/**
 * Receipt construction + canonical digest. Implements docs/schemas/receipt-v1.json.
 * The digest computed here MUST equal the on-chain ReceiptIssued.attestationDigest
 * field for the verify-receipt CLI to reproduce it.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import type { EligibilityResult } from "./types";

export type ReceiptDocument = {
  version: "compass-receipt-1.0.0";
  receiptId: string;
  challenge: string;
  policyHash: string;
  agentIdCommitment: string;
  verifierPubKey: string;
  credentialBundleHash: string;
  result: { eligible: boolean; reason: string };
  resultHash: string;
  expiry: number;
  issuedAt: number;
};

/**
 * RFC 8785 JCS-compatible canonicalization for our restricted schema
 * (strings + booleans + integers + objects). Recursively sorts keys.
 * Sufficient for receipt-v1.json's flat structure.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return (
      "{" +
      keys
        .map((k) => JSON.stringify(k) + ":" + canonicalize((value as any)[k]))
        .join(",") +
      "}"
    );
  }
  throw new Error("Cannot canonicalize: " + typeof value);
}

function hexlify(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

export function attestationDigest(doc: ReceiptDocument): string {
  const canonical = canonicalize(doc);
  return hexlify(sha256(new TextEncoder().encode(canonical)));
}

export function buildReceiptDocument(opts: {
  receiptId: string;
  challenge: string;
  policyHash: string;
  agentIdCommitment: string;
  verifierPubKey: string;
  credentialBundleHash: string;
  result: EligibilityResult;
  expiry: number;
  issuedAt: number;
}): ReceiptDocument {
  const result = { eligible: opts.result.eligible, reason: opts.result.reason };
  const resultHash = hexlify(
    sha256(new TextEncoder().encode(canonicalize(result))),
  );
  return {
    version: "compass-receipt-1.0.0",
    receiptId: opts.receiptId,
    challenge: opts.challenge,
    policyHash: opts.policyHash,
    agentIdCommitment: opts.agentIdCommitment,
    verifierPubKey: opts.verifierPubKey,
    credentialBundleHash: opts.credentialBundleHash,
    result,
    resultHash,
    expiry: opts.expiry,
    issuedAt: opts.issuedAt,
  };
}
