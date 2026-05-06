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
  version: "compass-receipt-1.0.0";
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
};

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
}): ReceiptDocument {
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
