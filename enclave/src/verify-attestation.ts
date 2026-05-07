/**
 * Consumer-side verifier for the Compass receipt-signer's TDX binding.
 *
 * Asserts report_data inside a dstack-issued TDX quote commits to
 * sha256(ethAddress(20) || composeHash(32)). Throws on any mismatch — this
 * is a security boundary; silent failure is unacceptable.
 *
 * Quote-format support: TDX 1.0 (Quote v4) only. v5 layout shifts the
 * body descriptor and is rejected here pending a verified v5 capture.
 */
import { sha256 } from "@noble/hashes/sha2.js";

const QUOTE_VERSION_OFFSET = 0;
const QUOTE_VERSION_LEN = 2;
const TDX_V4_REPORT_DATA_OFFSET = 568;
const TDX_REPORT_DATA_LEN = 64;
const SHA256_LEN = 32;

export type VerificationCode =
  | "QUOTE_TOO_SHORT"
  | "QUOTE_VERSION_UNSUPPORTED"
  | "BAD_INPUT_HEX"
  | "ETH_ADDRESS_LENGTH"
  | "COMPOSE_HASH_LENGTH"
  | "REPORT_DATA_MISMATCH"
  | "REPORT_DATA_PADDING_NONZERO";

export class VerificationError extends Error {
  constructor(public readonly code: VerificationCode, message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

function hexToBytes(hex: string, label: string): Uint8Array {
  const stripped = hex.replace(/^0x/, "");
  if (stripped.length % 2 !== 0) {
    throw new VerificationError("BAD_INPUT_HEX", `${label}: odd-length hex`);
  }
  const out = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(out[i])) {
      throw new VerificationError("BAD_INPUT_HEX", `${label}: invalid hex char`);
    }
  }
  return out;
}

export function parseQuoteVersion(quoteBytes: Uint8Array): number {
  if (quoteBytes.length < QUOTE_VERSION_OFFSET + QUOTE_VERSION_LEN) {
    throw new VerificationError("QUOTE_TOO_SHORT", "quote shorter than version field");
  }
  return quoteBytes[QUOTE_VERSION_OFFSET] | (quoteBytes[QUOTE_VERSION_OFFSET + 1] << 8);
}

export function extractReportData(quoteHex: string): Uint8Array {
  const bytes = hexToBytes(quoteHex, "quoteHex");
  const version = parseQuoteVersion(bytes);
  if (version !== 4) {
    throw new VerificationError(
      "QUOTE_VERSION_UNSUPPORTED",
      `TDX quote v${version} not supported; pin v4 dstack runtime or upgrade verifier`,
    );
  }
  const end = TDX_V4_REPORT_DATA_OFFSET + TDX_REPORT_DATA_LEN;
  if (bytes.length < end) {
    throw new VerificationError(
      "QUOTE_TOO_SHORT",
      `quote ${bytes.length} bytes < ${end} required for v4 report_data`,
    );
  }
  return bytes.slice(TDX_V4_REPORT_DATA_OFFSET, end);
}

export type VerifyBindingArgs = {
  quoteHex: string;
  expectedEthAddress: string;
  expectedComposeHash: string;
};

export function buildExpectedReportData(
  ethAddress: string,
  composeHash: string,
): Uint8Array {
  const addr = hexToBytes(ethAddress, "ethAddress");
  if (addr.length !== 20) {
    throw new VerificationError("ETH_ADDRESS_LENGTH", `eth address must be 20 bytes, got ${addr.length}`);
  }
  const cmp = hexToBytes(composeHash, "composeHash");
  if (cmp.length !== 32) {
    throw new VerificationError("COMPOSE_HASH_LENGTH", `compose hash must be 32 bytes, got ${cmp.length}`);
  }
  const buf = new Uint8Array(addr.length + cmp.length);
  buf.set(addr, 0);
  buf.set(cmp, addr.length);
  return sha256(buf);
}

export function verifyReportDataBinding(args: VerifyBindingArgs): void {
  const reportData = extractReportData(args.quoteHex);
  const expected = buildExpectedReportData(args.expectedEthAddress, args.expectedComposeHash);

  for (let i = 0; i < SHA256_LEN; i++) {
    if (reportData[i] !== expected[i]) {
      throw new VerificationError(
        "REPORT_DATA_MISMATCH",
        "report_data does not commit to sha256(ethAddress || composeHash)",
      );
    }
  }
  for (let i = SHA256_LEN; i < TDX_REPORT_DATA_LEN; i++) {
    if (reportData[i] !== 0) {
      throw new VerificationError(
        "REPORT_DATA_PADDING_NONZERO",
        `report_data byte ${i} non-zero; dstack padding behavior unexpected`,
      );
    }
  }
}
