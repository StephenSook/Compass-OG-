/**
 * Consumer-side verifier for Compass receipt signer's enclave binding.
 *
 * Chain of evidence:
 *   1. Receipt has signerEthAddress + signature.
 *   2. Verifier ECDSA-recovers from signature → derives eth address →
 *      asserts == receipt.signerEthAddress (proves the key signed it).
 *   3. Verifier fetches enclave's TDX quote (from /v1/attestation).
 *   4. Verifier extracts report_data (offset 568, 64 bytes) and asserts
 *      first 32 bytes == sha256(ethAddress || composeHash); trailing 32 zero.
 *   5. Verifier checks composeHash against expected Compass image hash
 *      (published in repo / on chain).
 *   6. Verifier validates the quote signature chain via Intel QVL or DStack
 *      Verifier (out of scope for this module).
 *
 * dstack runs sha256(report_data) before placing it in the TDX quote, so the
 * 32-byte sha256 output is what the verifier sees, right-padded to 64.
 */
import { sha256 } from "@noble/hashes/sha2.js";

const TDX_REPORT_DATA_OFFSET = 568;
const TDX_REPORT_DATA_LEN = 64;
const SHA256_LEN = 32;

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
  const end = TDX_REPORT_DATA_OFFSET + TDX_REPORT_DATA_LEN;
  if (bytes.length < end) {
    throw new Error(`quote too short for report_data: ${bytes.length} < ${end}`);
  }
  return bytes.slice(TDX_REPORT_DATA_OFFSET, end);
}

export type VerifyBindingArgs = {
  quoteHex: string;
  expectedEthAddress: string;
  expectedComposeHash: string;
};

export type VerifyBindingResult = { ok: true } | { ok: false; reason: string };

export function verifyReportDataBinding(args: VerifyBindingArgs): VerifyBindingResult {
  let reportData: Uint8Array;
  try {
    reportData = extractReportData(args.quoteHex);
  } catch (e) {
    return { ok: false, reason: `quote parse: ${(e as Error).message}` };
  }

  let addr: Uint8Array;
  let cmp: Uint8Array;
  try {
    addr = hexToBytes(args.expectedEthAddress);
    cmp = hexToBytes(args.expectedComposeHash);
  } catch (e) {
    return { ok: false, reason: `bad input hex: ${(e as Error).message}` };
  }
  if (addr.length !== 20) return { ok: false, reason: `eth address must be 20 bytes, got ${addr.length}` };
  if (cmp.length !== 32) return { ok: false, reason: `compose hash must be 32 bytes, got ${cmp.length}` };

  const buf = new Uint8Array(addr.length + cmp.length);
  buf.set(addr, 0);
  buf.set(cmp, addr.length);
  const expected = sha256(buf);

  for (let i = 0; i < SHA256_LEN; i++) {
    if (reportData[i] !== expected[i]) {
      return { ok: false, reason: "report_data does not commit to (ethAddress || composeHash)" };
    }
  }
  for (let i = SHA256_LEN; i < TDX_REPORT_DATA_LEN; i++) {
    if (reportData[i] !== 0) {
      return { ok: false, reason: "report_data padding non-zero (unexpected dstack behavior)" };
    }
  }
  return { ok: true };
}
