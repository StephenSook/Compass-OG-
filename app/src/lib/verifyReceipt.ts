// Browser-side mirror of enclave/scripts/verify-receipt.ts. Lets a
// visitor paste a receipt bundle JSON into /verify and see the full
// cryptographic chain re-derived locally — no server call, no CLI.
//
// Why this exists alongside the Node CLI: the CLI is the canonical
// reference, but it requires the user to clone + npm install +
// understand ts-node. The browser path runs in any tab in 3 seconds.
//
// What it verifies (same 4 checks as the CLI):
//  1. attestationDigest = sha256(canonicalize(receipt))
//  2. ECDSA-recovers an Ethereum address from receipt.signature on the
//     digest; asserts it equals receipt.signerAddress.
//  3. receipt.quoteCommitment = sha256(perReceiptQuoteHex)
//  4. perReceiptQuoteHex's TDX v4 report_data binds
//     sha256(signerAddress || composeHash || receiptId)
//
// Out of scope (same as CLI):
//  - Intel DCAP signature-chain verification on the TDX quote itself
//    (run via DStack Verifier or Intel QVL externally)
//  - dstack signature_chain validation on the key derivation

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

export type ReceiptDocument = {
  version: string;
  receiptId: string;
  challenge: string;
  policyHash: string;
  agentIdCommitment: string;
  verifierPubKey: string;
  credentialBundleHash: string;
  result: {
    eligible: boolean;
    reason: string;
    policyId: string;
    disclosedClaims: string[];
  };
  resultHash: string;
  expiry: number;
  issuedAt: number;
  quoteCommitment: string;
};

export type ReceiptBundle = {
  receipt: ReceiptDocument;
  attestationDigest: string;
  signature: string;
  signerAddress: string;
  perReceiptQuoteHex: string | null;
  perReceiptEventLog?: string | null;
};

export type StepResult = {
  label: string;
  ok: boolean;
  detail?: string;
};

export type VerifyResult = {
  ok: boolean;
  steps: StepResult[];
  receipt?: ReceiptDocument;
  signerAddress?: string;
  composeHash?: string;
};

const QUOTE_VERSION_OFFSET = 0;
const TDX_V4_REPORT_DATA_OFFSET = 568;
const TDX_REPORT_DATA_LEN = 64;
const SHA256_LEN = 32;

// Pinned schema version. Must match enclave/src/receipt.ts ReceiptDocument.
// v1.1.0 bound the boot quote and is no longer accepted; v1.2.0 binds a
// per-receipt quote. Strict pin prevents downgrade-acceptance.
const ACCEPTED_RECEIPT_VERSION = "compass-receipt-1.2.0";

// Sentinel for env-mode receipts (CVM stopped or local dev without an
// attested image). The dstack server emits this exact quoteCommitment on
// the non-attested path; rejecting it here matches enclave/src/verify-
// attestation.ts:113-118. Computed once at module load.
const ENV_MODE_QUOTE_COMMITMENT = (() => {
  const digest = sha256(new TextEncoder().encode("compass-env-mode-no-attestation"));
  return bytesToHex(digest);
})();

function hexToBytes(hex: string): Uint8Array {
  const stripped = hex.replace(/^0x/i, "");
  if (stripped.length % 2 !== 0) throw new Error("odd-length hex");
  if (!/^[0-9a-fA-F]*$/.test(stripped)) throw new Error("invalid hex");
  const out = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

// JCS-subset canonicalization — MUST match enclave/src/receipt.ts byte-for-byte.
// The lone-surrogate rejection is load-bearing: JSON.stringify happily emits
// "\uD800" for an unpaired surrogate, producing a different canonical bytestring
// than the CLI canonical verifier (which throws). Without this check, a malicious
// receipt with a lone surrogate in any string field would pass browser
// verification while failing CLI verification — a false-positive authenticity
// claim on the load-bearing security path. Mirror Codex + code-reviewer 2026-05-11.
function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite number: ${value}`);
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = value.charCodeAt(i + 1);
        if (next < 0xdc00 || next > 0xdfff) {
          throw new Error("lone high surrogate in string");
        }
        i++;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        throw new Error("lone low surrogate in string");
      }
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error("non-plain object cannot canonicalize");
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
  throw new Error(`cannot canonicalize: ${typeof value}`);
}

function attestationDigestOf(receipt: ReceiptDocument): string {
  return bytesToHex(sha256(new TextEncoder().encode(canonicalize(receipt))));
}

function deriveEthAddressFromUncompressed(uncompressed: Uint8Array): string {
  if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
    throw new Error(`expected 65-byte uncompressed secp256k1 pubkey, got ${uncompressed.length}`);
  }
  return "0x" + bytesToHex(keccak_256(uncompressed.slice(1)).slice(-20)).slice(2);
}

function recoverEthAddress(digestHex: string, sigHex: string): string[] {
  const digest = hexToBytes(digestHex);
  const sigBytes = hexToBytes(sigHex);
  const candidates: string[] = [];
  for (const v of [0, 1] as const) {
    try {
      const sig = secp256k1.Signature.fromBytes(sigBytes).addRecoveryBit(v);
      const pub = sig.recoverPublicKey(digest).toBytes(false);
      candidates.push(deriveEthAddressFromUncompressed(pub));
    } catch {
      // try next recovery bit
    }
  }
  return candidates;
}

function quoteCommitmentFromQuoteHex(quoteHex: string): string {
  return bytesToHex(sha256(hexToBytes(quoteHex)));
}

function extractReportData(quoteHex: string): Uint8Array {
  const bytes = hexToBytes(quoteHex);
  if (bytes.length < 2) throw new Error("quote shorter than version field");
  const version = bytes[QUOTE_VERSION_OFFSET]! | (bytes[QUOTE_VERSION_OFFSET + 1]! << 8);
  if (version !== 4) {
    throw new Error(`TDX quote v${version} not supported; v4 only`);
  }
  const end = TDX_V4_REPORT_DATA_OFFSET + TDX_REPORT_DATA_LEN;
  if (bytes.length < end) {
    throw new Error(`quote ${bytes.length} bytes < ${end} required for v4 report_data`);
  }
  return bytes.slice(TDX_V4_REPORT_DATA_OFFSET, end);
}

function verifyPerReceiptQuoteBinding(args: {
  quoteHex: string;
  expectedEthAddress: string;
  expectedComposeHash: string;
  expectedReceiptId: string;
}): void {
  const reportData = extractReportData(args.quoteHex);

  // report_data is 64 bytes; first 32 hold the binding, rest must be zero.
  const binding = reportData.slice(0, SHA256_LEN);
  const padding = reportData.slice(SHA256_LEN);
  for (const b of padding) {
    if (b !== 0) throw new Error("report_data padding non-zero");
  }

  const ethBytes = hexToBytes(args.expectedEthAddress);
  if (ethBytes.length !== 20) throw new Error("expectedEthAddress not 20 bytes");
  const composeBytes = hexToBytes(args.expectedComposeHash);
  if (composeBytes.length !== 32) throw new Error("expectedComposeHash not 32 bytes");
  const receiptIdBytes = hexToBytes(args.expectedReceiptId);
  if (receiptIdBytes.length !== 32) throw new Error("expectedReceiptId not 32 bytes");

  const preimage = new Uint8Array(ethBytes.length + composeBytes.length + receiptIdBytes.length);
  preimage.set(ethBytes, 0);
  preimage.set(composeBytes, ethBytes.length);
  preimage.set(receiptIdBytes, ethBytes.length + composeBytes.length);
  const expected = sha256(preimage);

  for (let i = 0; i < SHA256_LEN; i++) {
    if (binding[i] !== expected[i]) {
      throw new Error("report_data does not match sha256(signer || composeHash || receiptId)");
    }
  }
}

export function verifyBundle(args: {
  bundle: ReceiptBundle;
  expectedComposeHash: string;
}): VerifyResult {
  const steps: StepResult[] = [];
  const { bundle, expectedComposeHash } = args;

  // Step 1 — digest matches canonical receipt
  let digestOk = false;
  try {
    const recomputed = attestationDigestOf(bundle.receipt);
    digestOk = recomputed === bundle.attestationDigest;
    steps.push({
      label: "attestationDigest = sha256(canonicalize(receipt))",
      ok: digestOk,
      detail: digestOk
        ? recomputed
        : `expected ${bundle.attestationDigest}, got ${recomputed}`,
    });
  } catch (e) {
    steps.push({
      label: "attestationDigest = sha256(canonicalize(receipt))",
      ok: false,
      detail: (e as Error).message,
    });
  }

  // Step 2 — signature recovers to claimed signer
  let recoveredAddr: string | undefined;
  try {
    const candidates = recoverEthAddress(bundle.attestationDigest, bundle.signature);
    const match = candidates.find(
      (a) => a.toLowerCase() === bundle.signerAddress.toLowerCase(),
    );
    if (match) {
      recoveredAddr = match;
      steps.push({
        label: "signature ECDSA-recovers to claimed signer",
        ok: true,
        detail: match,
      });
    } else {
      steps.push({
        label: "signature ECDSA-recovers to claimed signer",
        ok: false,
        detail: `expected ${bundle.signerAddress}; candidates [${candidates.join(", ")}]`,
      });
    }
  } catch (e) {
    steps.push({
      label: "signature ECDSA-recovers to claimed signer",
      ok: false,
      detail: (e as Error).message,
    });
  }

  // Step 3 — quoteCommitment = sha256(perReceiptQuoteHex).
  // CLI canonical guard: reject env-mode-sentinel receipts FIRST (matches
  // enclave/src/verify-attestation.ts:113-118). Without this, an env-mode
  // bundle with a synthetic quote hex whose sha256 happens to hash to the
  // sentinel would pass Step 3 incorrectly.
  if (bundle.receipt.quoteCommitment.toLowerCase() === ENV_MODE_QUOTE_COMMITMENT.toLowerCase()) {
    steps.push({
      label: "receipt.quoteCommitment = sha256(perReceiptQuoteHex)",
      ok: false,
      detail:
        "env-mode receipt sentinel detected — receipt was minted without TEE attestation and cannot be production-verified",
    });
    steps.push({
      label: "quote report_data binds (signerAddress || composeHash || receiptId)",
      ok: false,
      detail: "skipped — env-mode receipt cannot bind a TEE attestation",
    });
  } else if (!bundle.perReceiptQuoteHex) {
    steps.push({
      label: "receipt.quoteCommitment = sha256(perReceiptQuoteHex)",
      ok: false,
      detail:
        "bundle has no perReceiptQuoteHex (env-mode dev receipt; cannot be production-verified)",
    });
    // Always emit Step 4 even when quote is absent, so the user sees the
    // full 4-step trace rather than silently dropping a step.
    steps.push({
      label: "quote report_data binds (signerAddress || composeHash || receiptId)",
      ok: false,
      detail: "skipped — no perReceiptQuoteHex in bundle",
    });
  } else {
    try {
      const recomputed = quoteCommitmentFromQuoteHex(bundle.perReceiptQuoteHex);
      const ok = recomputed === bundle.receipt.quoteCommitment;
      steps.push({
        label: "receipt.quoteCommitment = sha256(perReceiptQuoteHex)",
        ok,
        detail: ok
          ? recomputed
          : `expected ${bundle.receipt.quoteCommitment}, got ${recomputed}`,
      });
    } catch (e) {
      steps.push({
        label: "receipt.quoteCommitment = sha256(perReceiptQuoteHex)",
        ok: false,
        detail: (e as Error).message,
      });
    }

    // Step 4 — quote report_data binds (signer || composeHash || receiptId)
    try {
      verifyPerReceiptQuoteBinding({
        quoteHex: bundle.perReceiptQuoteHex,
        expectedEthAddress: bundle.signerAddress,
        expectedComposeHash,
        expectedReceiptId: bundle.receipt.receiptId,
      });
      steps.push({
        label: "quote report_data binds (signerAddress || composeHash || receiptId)",
        ok: true,
      });
    } catch (e) {
      steps.push({
        label: "quote report_data binds (signerAddress || composeHash || receiptId)",
        ok: false,
        detail: (e as Error).message,
      });
    }
  }

  return {
    ok: steps.every((s) => s.ok),
    steps,
    receipt: bundle.receipt,
    signerAddress: recoveredAddr ?? bundle.signerAddress,
    composeHash: expectedComposeHash,
  };
}

export function parseBundle(text: string): ReceiptBundle {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("bundle must be a JSON object");
  }
  if (
    !parsed.receipt ||
    typeof parsed.attestationDigest !== "string" ||
    typeof parsed.signature !== "string" ||
    typeof parsed.signerAddress !== "string"
  ) {
    throw new Error(
      "bundle missing required fields: {receipt, attestationDigest, signature, signerAddress}",
    );
  }
  const r = parsed.receipt;
  if (typeof r !== "object" || r === null || Array.isArray(r)) {
    throw new Error("bundle.receipt must be a JSON object");
  }
  for (const field of [
    "version",
    "receiptId",
    "challenge",
    "policyHash",
    "agentIdCommitment",
    "verifierPubKey",
    "credentialBundleHash",
    "result",
    "resultHash",
    "quoteCommitment",
  ]) {
    if (typeof r[field] !== "string") {
      throw new Error(`bundle.receipt.${field} must be a string`);
    }
  }
  if (typeof r.expiry !== "number" || typeof r.issuedAt !== "number") {
    throw new Error("bundle.receipt.expiry and issuedAt must be numbers");
  }
  if (r.version !== ACCEPTED_RECEIPT_VERSION) {
    throw new Error(
      `bundle.receipt.version "${r.version}" not accepted; expected "${ACCEPTED_RECEIPT_VERSION}" (v1.1.0 bound the boot quote and is no longer accepted; upgrade to v1.2.0 per-receipt quote)`,
    );
  }
  return parsed as ReceiptBundle;
}
