/**
 * Consumer-side verifier for Phala-attested receipts.
 *
 * Given a TDX quote, expected compose hash, expected signer pubkey, and the
 * nonce that was used to build reportData:
 *   1. Parse the quote header + body.
 *   2. Extract reportData (offset 568, length 64 — TDX quote spec section 4.5).
 *   3. Recompute sha256(pubkey || nonce) and assert reportData matches.
 *   4. Assert the quote's MRTD/RTMR matches the expected dstack image
 *      measurement (delegated to DStack Verifier; we only do the structural
 *      check here).
 *
 * For full quote signature verification (Intel Quote Verification Library),
 * shell out to DStack Verifier or Phala's hosted Trust Center API. This
 * module covers the Compass-specific reportData binding only.
 */
import { sha256 } from "@noble/hashes/sha2.js";

const TDX_QUOTE_REPORTDATA_OFFSET = 568;
const TDX_QUOTE_REPORTDATA_LEN = 64;

function hexToBytes(hex: string): Uint8Array {
  const stripped = hex.replace(/^0x/, "");
  if (stripped.length % 2 !== 0) throw new Error("odd-length hex");
  const out = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function extractReportData(quoteHex: string): Uint8Array {
  const bytes = hexToBytes(quoteHex);
  if (bytes.length < TDX_QUOTE_REPORTDATA_OFFSET + TDX_QUOTE_REPORTDATA_LEN) {
    throw new Error(
      `quote too short for reportData extraction: ${bytes.length} < ${TDX_QUOTE_REPORTDATA_OFFSET + TDX_QUOTE_REPORTDATA_LEN}`,
    );
  }
  return bytes.slice(
    TDX_QUOTE_REPORTDATA_OFFSET,
    TDX_QUOTE_REPORTDATA_OFFSET + TDX_QUOTE_REPORTDATA_LEN,
  );
}

export function verifyReportDataBinding(opts: {
  quoteHex: string;
  expectedSignerPubkey: Uint8Array;
  nonce: Uint8Array;
}): { ok: true } | { ok: false; reason: string } {
  let reportData: Uint8Array;
  try {
    reportData = extractReportData(opts.quoteHex);
  } catch (e) {
    return { ok: false, reason: `quote parse: ${(e as Error).message}` };
  }
  const buf = new Uint8Array(opts.expectedSignerPubkey.length + opts.nonce.length);
  buf.set(opts.expectedSignerPubkey, 0);
  buf.set(opts.nonce, opts.expectedSignerPubkey.length);
  const expected = sha256(buf);
  for (let i = 0; i < expected.length; i++) {
    if (reportData[i] !== expected[i]) {
      return { ok: false, reason: "reportData mismatch — pubkey/nonce binding broken" };
    }
  }
  // Trailing 32 bytes must be zero (we padded sha256 right).
  for (let i = expected.length; i < TDX_QUOTE_REPORTDATA_LEN; i++) {
    if (reportData[i] !== 0) {
      return { ok: false, reason: "reportData padding non-zero" };
    }
  }
  return { ok: true };
}
