import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { tryLoadAttestedSigner, __testing as dstackTesting } from "../src/dstack";
import {
  VerificationError,
  buildExpectedReportData,
  extractReportData,
  parseQuoteVersion,
  verifyReportDataBinding,
} from "../src/verify-attestation";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";

const ZERO_ADDR = "0x" + "00".repeat(20);
const ZERO_COMPOSE = "0x" + "00".repeat(32);

function fakeQuote(reportData: Uint8Array, version = 4): string {
  if (reportData.length !== 64) throw new Error("reportData must be 64 bytes");
  const buf = new Uint8Array(568 + 64);
  buf[0] = version & 0xff;
  buf[1] = (version >> 8) & 0xff;
  buf.set(reportData, 568);
  return "0x" + Buffer.from(buf).toString("hex");
}

function syntheticReportData(ethAddress: string, composeHash: string): Uint8Array {
  const input = dstackTesting.buildReportDataInput(ethAddress, composeHash);
  const digest = sha256(input);
  const out = new Uint8Array(64);
  out.set(digest, 0);
  return out;
}

const priv = Uint8Array.from(Buffer.from("1".padStart(64, "0"), "hex"));
const pub = secp256k1.getPublicKey(priv, false);
const ethAddress = deriveEthAddressFromUncompressed(pub);
const composeHash = "0x" + "ab".repeat(32);

describe("verify-attestation", () => {
  it("parses TDX quote version from header", () => {
    const quote = fakeQuote(syntheticReportData(ethAddress, composeHash), 4);
    const bytes = Uint8Array.from(Buffer.from(quote.replace(/^0x/, ""), "hex"));
    expect(parseQuoteVersion(bytes)).toBe(4);
  });

  it("rejects v5 quote — explicit unsupported until verified capture", () => {
    const quote = fakeQuote(new Uint8Array(64), 5);
    expect(() => extractReportData(quote)).toThrow(VerificationError);
    try {
      extractReportData(quote);
    } catch (e) {
      expect((e as VerificationError).code).toBe("QUOTE_VERSION_UNSUPPORTED");
    }
  });

  it("extracts 64 bytes from offset 568 on v4", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    const extracted = extractReportData(fakeQuote(synthetic, 4));
    expect(extracted.length).toBe(64);
    expect(Buffer.from(extracted).toString("hex")).toBe(Buffer.from(synthetic).toString("hex"));
  });

  it("verifies a correctly-bound report_data (no throw)", () => {
    const quote = fakeQuote(syntheticReportData(ethAddress, composeHash), 4);
    expect(() =>
      verifyReportDataBinding({
        quoteHex: quote,
        expectedEthAddress: ethAddress,
        expectedComposeHash: composeHash,
      }),
    ).not.toThrow();
  });

  it("throws REPORT_DATA_MISMATCH on wrong eth address", () => {
    const quote = fakeQuote(syntheticReportData(ethAddress, composeHash), 4);
    try {
      verifyReportDataBinding({
        quoteHex: quote,
        expectedEthAddress: ZERO_ADDR,
        expectedComposeHash: composeHash,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(VerificationError);
      expect((e as VerificationError).code).toBe("REPORT_DATA_MISMATCH");
    }
  });

  it("throws REPORT_DATA_MISMATCH on wrong compose hash", () => {
    const quote = fakeQuote(syntheticReportData(ethAddress, composeHash), 4);
    try {
      verifyReportDataBinding({
        quoteHex: quote,
        expectedEthAddress: ethAddress,
        expectedComposeHash: ZERO_COMPOSE,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("REPORT_DATA_MISMATCH");
    }
  });

  it("throws REPORT_DATA_PADDING_NONZERO on tampered padding", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    synthetic[40] = 0xff;
    try {
      verifyReportDataBinding({
        quoteHex: fakeQuote(synthetic, 4),
        expectedEthAddress: ethAddress,
        expectedComposeHash: composeHash,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("REPORT_DATA_PADDING_NONZERO");
    }
  });

  it("throws QUOTE_TOO_SHORT on truncated quote", () => {
    try {
      extractReportData("0x0400" + "00".repeat(50));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("QUOTE_TOO_SHORT");
    }
  });

  it("throws ETH_ADDRESS_LENGTH on 19-byte input", () => {
    try {
      buildExpectedReportData("0x" + "11".repeat(19), composeHash);
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("ETH_ADDRESS_LENGTH");
    }
  });

  it("throws COMPOSE_HASH_LENGTH on 31-byte input", () => {
    try {
      buildExpectedReportData(ethAddress, "0x" + "22".repeat(31));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("COMPOSE_HASH_LENGTH");
    }
  });

  it("throws BAD_INPUT_HEX on odd-length", () => {
    try {
      buildExpectedReportData("0xabc", composeHash);
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("BAD_INPUT_HEX");
    }
  });
});

describe("dstack.tryLoadAttestedSigner", () => {
  it("returns null when /var/run/dstack.sock absent", async () => {
    const bundle = await tryLoadAttestedSigner({ socketPath: "/nonexistent/dstack.sock" });
    expect(bundle).toBeNull();
  });
});

describe("dstack.buildReportDataInput", () => {
  it("concatenates 20-byte address + 32-byte compose to 52 bytes", () => {
    const out = dstackTesting.buildReportDataInput("0x" + "aa".repeat(20), "0x" + "bb".repeat(32));
    expect(out.length).toBe(52);
    expect(Buffer.from(out.slice(0, 20)).toString("hex")).toBe("aa".repeat(20));
    expect(Buffer.from(out.slice(20)).toString("hex")).toBe("bb".repeat(32));
  });

  it("throws on wrong-size eth address", () => {
    expect(() =>
      dstackTesting.buildReportDataInput("0x" + "00".repeat(19), "0x" + "00".repeat(32)),
    ).toThrow(/eth address/);
  });

  it("throws on wrong-size compose hash", () => {
    expect(() =>
      dstackTesting.buildReportDataInput("0x" + "00".repeat(20), "0x" + "00".repeat(31)),
    ).toThrow(/compose hash/);
  });
});

describe("eth-address util", () => {
  it("derives a deterministic 20-byte address from secp256k1 pubkey", () => {
    const addr = deriveEthAddressFromUncompressed(pub);
    expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
    expect(deriveEthAddressFromUncompressed(pub)).toBe(addr);
  });

  it("rejects compressed pubkey", () => {
    const compressed = secp256k1.getPublicKey(priv, true);
    expect(() => deriveEthAddressFromUncompressed(compressed)).toThrow(/65-byte/);
  });
});
