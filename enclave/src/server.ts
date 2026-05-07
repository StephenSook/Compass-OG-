/**
 * Compass receipt-signer HTTP server.
 *
 * Exposes an OpenAI-shaped POST /v1/chat/completions endpoint so the 0G
 * broker can route requests through it. Body shape matches the broker's
 * routing expectation; Compass-specific payload is base64-encoded inside
 * the user message content. Response wraps the signed receipt JSON in an
 * OpenAI completion shape so the broker's TEE-signature flow signs over
 * the receipt content.
 *
 * Day-4 scope: HTTP layer + signed-receipt round-trip with a configured
 * signer key (env `COMPASS_RECEIPT_SIGNER_KEY`). When deployed to dstack
 * TDX (Day-5), the signer key is derived inside the TEE; the
 * corresponding Ethereum address is bound into report_data automatically
 * by dstack so a verifier can cryptographically prove the key came from
 * this attested image.
 *
 * Local smoke test:
 *   COMPASS_RECEIPT_SIGNER_KEY=0x... node dist/server.js
 *   curl -X POST http://localhost:8080/v1/chat/completions \
 *     -H 'Content-Type: application/json' \
 *     -d '{"model":"compass:help-legal-aid","messages":[{"role":"user","content":"<base64-encoded JSON>"}]}'
 */
import express, { type Request, type Response } from "express";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { evaluatePolicy } from "./policy";
import { attestationDigest, buildReceiptDocument, canonicalize } from "./receipt";
import type { ClaimSet, CompassPolicy } from "./types";

const PORT = Number(process.env.PORT ?? 8080);
const SIGNER_KEY_HEX = process.env.COMPASS_RECEIPT_SIGNER_KEY;

if (!SIGNER_KEY_HEX) {
  console.error("ERROR: COMPASS_RECEIPT_SIGNER_KEY required (0x-hex secp256k1)");
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
  // Drop 0x04 prefix, keccak256 the X||Y, take last 20 bytes.
  // For brevity here, use sha256 fallback — Day-5 swaps to keccak via ethers.
  const xy = uncompressedPubKey.slice(1);
  const hash = sha256(xy);
  return "0x" + Buffer.from(hash.slice(-20)).toString("hex");
}

function signReceipt(digestHex: string): string {
  const digestBytes = Uint8Array.from(Buffer.from(digestHex.replace(/^0x/, ""), "hex"));
  const sig = secp256k1.sign(digestBytes, signerPrivKey, { prehash: false, lowS: true });
  return "0x" + Buffer.from(sig).toString("hex");
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", signer: signerEthereumAddress });
});

app.post("/v1/chat/completions", (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }
    const userMessage = body.messages.find((m: { role: string }) => m.role === "user");
    if (!userMessage?.content) {
      return res.status(400).json({ error: "user message required" });
    }

    const decoded = Buffer.from(userMessage.content, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as CompassPayload;

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
      canonical: canonicalize(receiptDoc),
    });

    res.json({
      id: `compass-${payload.receiptId.slice(0, 12)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
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
    console.error("[compass-server] error:", e);
    res.status(500).json({ error: (e as Error).message ?? "internal error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[compass-server] listening on :${PORT}`);
});
