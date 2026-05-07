/**
 * Compass receipt-signer HTTP server. Wraps signed receipts in OpenAI
 * completion shape because the 0G broker forwards the user-message content
 * verbatim, then signs the response — that's what binds the receipt to the
 * TEE-attested execution boundary.
 */
import express, { type Request, type Response, type NextFunction } from "express";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { randomUUID } from "node:crypto";
import { evaluatePolicy } from "./policy";
import {
  attestationDigest,
  buildReceiptDocument,
  ENV_MODE_QUOTE_COMMITMENT,
  quoteCommitmentFromQuoteHex,
} from "./receipt";
import type { ClaimSet, CompassPolicy } from "./types";
import { tryLoadAttestedSigner, type AttestedSignerBundle } from "./dstack";
import { deriveEthAddressFromUncompressed } from "./eth-address";

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.COMPASS_BIND_HOST ?? "127.0.0.1";
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const HEX_ANY = /^0x[0-9a-fA-F]+$/;
const FORCE_LOCAL_LITERALS = new Set(["1", "true"]);

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

export type SignerContext =
  | { source: "tee"; privKey: Uint8Array; ethAddress: string; attestation: AttestedSignerBundle }
  | { source: "env"; privKey: Uint8Array; ethAddress: string; attestation: null };

class PayloadValidationError extends Error {}

function isForceLocal(): boolean {
  const raw = process.env.COMPASS_FORCE_LOCAL;
  if (raw === undefined) return false;
  if (!FORCE_LOCAL_LITERALS.has(raw)) {
    throw new Error(
      `COMPASS_FORCE_LOCAL must be literal "1" or "true"; got "${raw}". Refusing to boot to avoid silent mode flip.`,
    );
  }
  return true;
}

function loadEnvSigner(): SignerContext {
  const hex = process.env.COMPASS_RECEIPT_SIGNER_KEY;
  if (!hex) {
    throw new Error("COMPASS_RECEIPT_SIGNER_KEY required for env-mode boot");
  }
  if (!HEX32.test(hex)) {
    throw new Error(
      `COMPASS_RECEIPT_SIGNER_KEY must be 32-byte hex (0x + 64 chars); got ${hex.length} chars`,
    );
  }
  const privKey = Uint8Array.from(Buffer.from(hex.replace(/^0x/, ""), "hex"));
  const pub = secp256k1.getPublicKey(privKey, false);
  const ethAddress = deriveEthAddressFromUncompressed(pub);
  return { source: "env", privKey, ethAddress, attestation: null };
}

export async function loadSigner(): Promise<SignerContext> {
  const forceLocal = isForceLocal();
  if (!forceLocal) {
    const bundle = await tryLoadAttestedSigner();
    if (bundle) {
      return { source: "tee", privKey: bundle.privKey, ethAddress: bundle.ethAddress, attestation: bundle };
    }
    throw new Error(
      "TEE mode required but /var/run/dstack.sock is absent or unreachable. Set COMPASS_FORCE_LOCAL=1 explicitly to boot in env mode (dev only).",
    );
  }
  return loadEnvSigner();
}

export function signReceipt(privKey: Uint8Array, digestHex: string): string {
  const hex = digestHex.replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error(`signReceipt: digest must be 32-byte hex, got ${hex.length} chars`);
  }
  const digest = Uint8Array.from(Buffer.from(hex, "hex"));
  const sig = secp256k1.sign(digest, privKey, { prehash: false, lowS: true });
  return "0x" + Buffer.from(sig).toString("hex");
}

export function validateCompassPayload(raw: unknown): CompassPayload {
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

export { PayloadValidationError };

export function buildApp(signer: SignerContext) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", signer: signer.ethAddress, source: signer.source });
  });

  app.get("/v1/attestation", (_req: Request, res: Response) => {
    if (signer.source !== "tee") {
      return res
        .status(404)
        .json({ error: "no attestation: server booted in env mode", code: "E_NO_ATTESTATION" });
    }
    const a = signer.attestation;
    res.json({
      ethAddress: a.ethAddress,
      composeHash: a.composeHash,
      appId: a.appId,
      instanceId: a.instanceId,
      reportDataHex: "0x" + Buffer.from(a.reportDataInput).toString("hex"),
      quoteHex: a.quoteHex,
      eventLog: a.eventLog,
      // signatureChainHex is dstack's KMS attestation chain over the public
      // key derivation, not signing material — safe to publish.
      signatureChainHex: a.signatureChain.map((b) => "0x" + Buffer.from(b).toString("hex")),
      boundAt: a.boundAt,
    });
  });

  app.post("/v1/chat/completions", async (req: Request, res: Response) => {
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

      // TEE mode: fetch a fresh per-receipt quote whose report_data binds
      // (ethAddress || composeHash || receiptId). Defeats quote-replay
      // attacks where an archived boot quote is bound to receipts minted
      // after a key extraction.
      let quoteCommitment: string;
      let perReceiptQuoteHex: string | null = null;
      let perReceiptEventLog: string | null = null;
      if (signer.source === "tee") {
        const fresh = await signer.attestation.requestPerReceiptQuote(payload.receiptId);
        perReceiptQuoteHex = fresh.quoteHex;
        perReceiptEventLog = fresh.eventLog;
        quoteCommitment = quoteCommitmentFromQuoteHex(fresh.quoteHex);
      } else {
        quoteCommitment = ENV_MODE_QUOTE_COMMITMENT;
      }

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
        quoteCommitment,
      });

      const digest = attestationDigest(receiptDoc);
      const signature = signReceipt(signer.privKey, digest);

      const responseContent = JSON.stringify({
        receipt: receiptDoc,
        attestationDigest: digest,
        signature,
        signerAddress: signer.ethAddress,
        perReceiptQuoteHex,
        perReceiptEventLog,
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

  // JSON error middleware — Express default is HTML w/ stack trace, which
  // leaks internal paths and module versions on body-parse / size errors.
  app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    const errorId = randomUUID();
    console.error(`[compass-server] [${errorId}] middleware:`, err.message);
    const status = err.status ?? 400;
    const code =
      err.type === "entity.too.large" ? "E_BODY_TOO_LARGE"
      : err.type === "entity.parse.failed" ? "E_BODY_PARSE"
      : "E_REQUEST";
    res.status(status).json({ error: err.message, code, errorId });
  });

  return app;
}

async function bootstrap() {
  console.log("[compass-server] starting");
  const signer = await loadSigner();
  console.log(`[compass-server] signer source: ${signer.source}`);
  console.log(`[compass-server] signer eth address: ${signer.ethAddress}`);
  if (signer.source === "tee") {
    console.log(`[compass-server] composeHash: ${signer.attestation.composeHash}`);
    console.log(`[compass-server] appId: ${signer.attestation.appId}`);
  }

  const app = buildApp(signer);
  const httpServer = app.listen(PORT, HOST, () => {
    console.log(`[compass-server] listening on ${HOST}:${PORT}`);
  });

  const shutdown = (sig: string) => {
    console.log(`[compass-server] received ${sig}, draining`);
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
}

if (require.main === module) {
  bootstrap().catch((e) => {
    console.error("[compass-server] boot failed:", e);
    process.exit(1);
  });
}
