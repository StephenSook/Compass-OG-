/**
 * Receipt construction + canonical digest. Implements docs/schemas/receipt-v1.json.
 * The digest computed here MUST equal the on-chain ReceiptIssued.attestationDigest
 * field for the verify-receipt CLI to reproduce it.
 *
 * Canonicalization is a strict-input subset of RFC 8785 JCS — it accepts only
 * strings, booleans, integers, finite numbers, plain arrays, and plain objects.
 * NaN, Infinity, lone surrogates, sparse arrays, prototype-bearing objects,
 * and bigints all reject. The receipt schema produces no such values, but if
 * upstream code attempts to canonicalize foreign data, the rejection is
 * deliberate — silently round-tripping invalid JSON is how digest reproducibility
 * dies.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import type { EligibilityResult } from "./types";

export type ReceiptResult = {
  eligible: boolean;
  reason: string;
  policyId: string;
  /** Sorted list of claim names whose disclosure satisfied the predicate. */
  disclosedClaims: string[];
};

export type ReceiptDocument = {
  version: "compass-receipt-1.2.0";
  receiptId: string;
  challenge: string;
  policyHash: string;
  agentIdCommitment: string;
  verifierPubKey: string;
  credentialBundleHash: string;
  result: ReceiptResult;
  resultHash: string;
  expiry: number;
  issuedAt: number;
  /**
   * sha256 of the per-receipt TDX quote whose report_data binds
   * (ethAddress || composeHash || receiptId). Defeats quote replay across
   * deployments. v1.2.0 semantics; v1.1.0 bound the boot quote and is no
   * longer accepted.
   */
  quoteCommitment: string;
};

// MUST stay literal — verifier hardcodes against this exact sha256.
export const ENV_MODE_QUOTE_COMMITMENT = (() => {
  const digest = sha256(new TextEncoder().encode("compass-env-mode-no-attestation"));
  return "0x" + Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join("");
})();

class CanonicalizationError extends Error {}

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CanonicalizationError(`non-finite number: ${value}`);
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = value.charCodeAt(i + 1);
        if (next < 0xdc00 || next > 0xdfff) {
          throw new CanonicalizationError("lone high surrogate in string");
        }
        i++;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        throw new CanonicalizationError("lone low surrogate in string");
      }
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new CanonicalizationError("non-plain object cannot canonicalize");
    }
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return (
      "{" +
      keys
        .map((k) => JSON.stringify(k) + ":" + canonicalize((value as Record<string, unknown>)[k]))
        .join(",") +
      "}"
    );
  }
  throw new CanonicalizationError(`cannot canonicalize: ${typeof value}`);
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
  quoteCommitment: string;
}): ReceiptDocument {
  if (!/^0x[0-9a-f]{64}$/.test(opts.quoteCommitment)) {
    throw new Error("quoteCommitment must be 32-byte 0x-hex");
  }
  const result: ReceiptResult = {
    eligible: opts.result.eligible,
    reason: opts.result.reason,
    policyId: opts.result.policyId,
    disclosedClaims: [...(opts.result.disclosedClaims ?? [])].sort(),
  };
  const resultHash = hexlify(
    sha256(new TextEncoder().encode(canonicalize(result))),
  );
  return {
    version: "compass-receipt-1.2.0",
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
    quoteCommitment: opts.quoteCommitment,
  };
}

export function quoteCommitmentFromQuoteHex(quoteHex: string): string {
  const stripped = quoteHex.replace(/^0x/i, "");
  if (stripped.length === 0) throw new Error("quoteHex must not be empty");
  if (stripped.length % 2 !== 0) throw new Error("quoteHex must be even-length");
  if (!/^[0-9a-fA-F]+$/.test(stripped)) throw new Error("quoteHex contains non-hex chars");
  const bytes = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return hexlify(sha256(bytes));
}
