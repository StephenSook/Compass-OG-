/**
 * Compass receipt-signer HTTP server. Wraps signed receipts in OpenAI
 * completion shape because the 0G broker forwards the user-message
 * content verbatim, then signs the response — that's what binds the
 * receipt to the TEE-attested execution boundary.
 */
import express, { type Request, type Response } from "express";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { randomUUID } from "node:crypto";
import { evaluatePolicy } from "./policy";
import { attestationDigest, buildReceiptDocument, canonicalize } from "./receipt";
import type { ClaimSet, CompassPolicy } from "./types";

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.COMPASS_BIND_HOST ?? "127.0.0.1";
const SIGNER_KEY_HEX = process.env.COMPASS_RECEIPT_SIGNER_KEY;
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const HEX_ANY = /^0x[0-9a-fA-F]+$/;

if (!SIGNER_KEY_HEX) {
  console.error("ERROR: COMPASS_RECEIPT_SIGNER_KEY required");
  process.exit(1);
}
if (!HEX32.test(SIGNER_KEY_HEX)) {
  console.error(
    `ERROR: COMPASS_RECEIPT_SIGNER_KEY must be 32-byte hex (0x + 64 chars); got ${SIGNER_KEY_HEX.length} chars`,
  );
  process.exit(1);
}

const signerPrivKey = Uint8Array.from(
  Buffer.from(SIGNER_KEY_HEX.replace(/^0x/, ""), "hex"),
);
const signerPubKeyUncompressed = secp256k1.getPublicKey(signerPrivKey, false);
const signerEthereumAddress = deriveEthAddress(signerPubKeyUncompressed);

console.log(`[compass-server] starting`);
console.log(`[compass-server] signer eth address: ${signerEthereumAddress}`);

type CompassPayload = {
  receiptId: string;
  challenge: string;
  agentIdCommitment: string;
  verifierPubKey: string;
  credentialBundleHash: string;
  policy: CompassPolicy;
  policyHash: string;
  claims: ClaimSet;
  expiry: number;
  issuedAt: number;
};

function deriveEthAddress(uncompressedPubKey: Uint8Array): string {
  // EIP-55 Ethereum address: keccak256(pubkey[1:65]) → last 20 bytes.
  // dstack TDX writes this exact address into report_data on Day-5 deploy;
  // sha256 here would silently mismatch.
  if (uncompressedPubKey.length !== 65 || uncompressedPubKey[0] !== 0x04) {
    throw new Error(
      `expected 65-byte uncompressed secp256k1 pubkey, got ${uncompressedPubKey.length} bytes`,
    );
  }
  const xy = uncompressedPubKey.slice(1);
  const hash = keccak_256(xy);
  return "0x" + Buffer.from(hash.slice(-20)).toString("hex");
}

function signReceipt(digestHex: string): string {
  const hex = digestHex.replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error(`signReceipt: digest must be 32-byte hex, got ${hex.length} chars`);
  }
  const digestBytes = Uint8Array.from(Buffer.from(hex, "hex"));
  const sig = secp256k1.sign(digestBytes, signerPrivKey, { prehash: false, lowS: true });
  return "0x" + Buffer.from(sig).toString("hex");
}

class PayloadValidationError extends Error {}

function validateCompassPayload(raw: unknown): CompassPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new PayloadValidationError("payload must be an object");
  }
  const o = raw as Record<string, unknown>;
  for (const f of ["receiptId", "challenge", "agentIdCommitment", "policyHash", "credentialBundleHash"]) {
    if (typeof o[f] !== "string" || !HEX32.test(o[f] as string)) {
      throw new PayloadValidationError(`${f} must be 32-byte 0x-hex`);
    }
  }
  if (typeof o.verifierPubKey !== "string" || !HEX_ANY.test(o.verifierPubKey)) {
    throw new PayloadValidationError("verifierPubKey must be 0x-hex");
  }
  if (typeof o.expiry !== "number" || !Number.isFinite(o.expiry) || o.expiry <= 0) {
    throw new PayloadValidationError("expiry must be positive finite number");
  }
  if (typeof o.issuedAt !== "number" || !Number.isFinite(o.issuedAt) || o.issuedAt <= 0) {
    throw new PayloadValidationError("issuedAt must be positive finite number");
  }
  if ((o.expiry as number) <= (o.issuedAt as number)) {
    throw new PayloadValidationError("expiry must follow issuedAt");
  }
  if (typeof o.policy !== "object" || o.policy === null) {
    throw new PayloadValidationError("policy must be an object");
  }
  if (typeof o.claims !== "object" || o.claims === null) {
    throw new PayloadValidationError("claims must be an object");
  }
  return o as unknown as CompassPayload;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", signer: signerEthereumAddress });
});

app.post("/v1/chat/completions", (req: Request, res: Response) => {
  const errorId = randomUUID();
  try {
    const body = req.body;
    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: "messages[] required", code: "E_REQ_SHAPE" });
    }
    const userMessage = body.messages.find((m: { role: string }) => m.role === "user");
    if (!userMessage?.content || typeof userMessage.content !== "string") {
      return res.status(400).json({ error: "user message required", code: "E_REQ_USER_MSG" });
    }

    let decoded: string;
    try {
      decoded = Buffer.from(userMessage.content, "base64").toString("utf8");
    } catch {
      return res.status(400).json({ error: "invalid base64", code: "E_DECODE_B64" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(decoded);
    } catch {
      return res.status(400).json({ error: "invalid JSON in user content", code: "E_DECODE_JSON" });
    }

    let payload: CompassPayload;
    try {
      payload = validateCompassPayload(parsed);
    } catch (e) {
      return res.status(400).json({
        error: (e as PayloadValidationError).message,
        code: "E_PAYLOAD_VALIDATION",
      });
    }

    const evalResult = evaluatePolicy(payload.policy, payload.claims, payload.policyHash);

    const receiptDoc = buildReceiptDocument({
      receiptId: payload.receiptId,
      challenge: payload.challenge,
      policyHash: payload.policyHash,
      agentIdCommitment: payload.agentIdCommitment,
      verifierPubKey: payload.verifierPubKey,
      credentialBundleHash: payload.credentialBundleHash,
      result: evalResult,
      expiry: payload.expiry,
      issuedAt: payload.issuedAt,
    });

    const digest = attestationDigest(receiptDoc);
    const signature = signReceipt(digest);

    const responseContent = JSON.stringify({
      receipt: receiptDoc,
      attestationDigest: digest,
      signature,
      signerAddress: signerEthereumAddress,
    });

    res.json({
      id: `compass-${payload.receiptId.slice(0, 12)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: typeof body.model === "string" ? body.model.slice(0, 256) : "compass:unknown",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: responseContent },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (e) {
    console.error(`[compass-server] [${errorId}] unhandled:`, e);
    res.status(500).json({ error: "internal error", errorId, code: "E_INTERNAL" });
  }
});

const httpServer = app.listen(PORT, HOST, () => {
  console.log(`[compass-server] listening on ${HOST}:${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`[compass-server] received ${signal}, draining`);
  httpServer.close((err) => {
    if (err) console.error("[compass-server] close error:", err);
    process.exit(err ? 1 : 0);
  });
  setTimeout(() => {
    console.error("[compass-server] forced exit after 10s drain");
    process.exit(1);
  }, 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Suppress unused-import warning for `sha256` retained for receipt.ts dep coupling.
void sha256;
