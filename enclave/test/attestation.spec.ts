import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { tryLoadAttestedSigner, __testing as dstackTesting } from "../src/dstack";
import {
  VerificationError,
  buildExpectedReportData,
  extractReportData,
  parseQuoteVersion,
  verifyPerReceiptQuoteBinding,
  verifyQuoteCommitment,
  verifyReportDataBinding,
} from "../src/verify-attestation";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";
import {
  ENV_MODE_QUOTE_COMMITMENT,
  buildReceiptDocument,
  quoteCommitmentFromQuoteHex,
} from "../src/receipt";

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
  const input = dstackTesting.bootReportDataInput(ethAddress, composeHash);
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

describe("dstack reportData input builders", () => {
  it("bootReportDataInput: 20 + 32 = 52 bytes", () => {
    const out = dstackTesting.bootReportDataInput("0x" + "aa".repeat(20), "0x" + "bb".repeat(32));
    expect(out.length).toBe(52);
  });

  it("buildPerReceiptReportDataInput: 20 + 32 + 32 = 84 bytes", () => {
    const out = dstackTesting.buildPerReceiptReportDataInput(
      "0x" + "aa".repeat(20),
      "0x" + "bb".repeat(32),
      "0x" + "cc".repeat(32),
    );
    expect(out.length).toBe(84);
    expect(Buffer.from(out.slice(0, 20)).toString("hex")).toBe("aa".repeat(20));
    expect(Buffer.from(out.slice(20, 52)).toString("hex")).toBe("bb".repeat(32));
    expect(Buffer.from(out.slice(52)).toString("hex")).toBe("cc".repeat(32));
  });

  it("rejects wrong-size receiptId", () => {
    expect(() =>
      dstackTesting.buildPerReceiptReportDataInput(
        "0x" + "aa".repeat(20),
        "0x" + "bb".repeat(32),
        "0x" + "cc".repeat(31),
      ),
    ).toThrow(/receiptId/);
  });
});

describe("quoteCommitment + freshness mitigation", () => {
  const fakeQuoteHex = "0x" + "ab".repeat(632);

  it("ENV_MODE_QUOTE_COMMITMENT is the sha256 of the marker string", () => {
    const expected = "0x" + Array.from(
      sha256(new TextEncoder().encode("compass-env-mode-no-attestation")),
    ).map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(ENV_MODE_QUOTE_COMMITMENT).toBe(expected);
  });

  it("quoteCommitmentFromQuoteHex is deterministic", () => {
    const a = quoteCommitmentFromQuoteHex(fakeQuoteHex);
    const b = quoteCommitmentFromQuoteHex(fakeQuoteHex);
    expect(a).toBe(b);
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("verifyQuoteCommitment accepts matching commitment", () => {
    const commitment = quoteCommitmentFromQuoteHex(fakeQuoteHex);
    expect(() =>
      verifyQuoteCommitment({
        receiptQuoteCommitment: commitment,
        quoteHex: fakeQuoteHex,
      }),
    ).not.toThrow();
  });

  it("verifyQuoteCommitment throws QUOTE_COMMITMENT_MISMATCH on substituted quote", () => {
    const commitment = quoteCommitmentFromQuoteHex(fakeQuoteHex);
    const otherQuote = "0x" + "cd".repeat(632);
    try {
      verifyQuoteCommitment({
        receiptQuoteCommitment: commitment,
        quoteHex: otherQuote,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(VerificationError);
      expect((e as VerificationError).code).toBe("QUOTE_COMMITMENT_MISMATCH");
    }
  });

  it("verifyQuoteCommitment throws ENV_MODE_RECEIPT on env sentinel", () => {
    try {
      verifyQuoteCommitment({
        receiptQuoteCommitment: ENV_MODE_QUOTE_COMMITMENT,
        quoteHex: fakeQuoteHex,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("ENV_MODE_RECEIPT");
    }
  });

  it("buildReceiptDocument rejects malformed quoteCommitment", () => {
    const inputs = {
      receiptId: "0x" + "01".repeat(32),
      challenge: "0x" + "02".repeat(32),
      policyHash: "0x" + "03".repeat(32),
      agentIdCommitment: "0x" + "04".repeat(32),
      verifierPubKey: "0x" + "05".repeat(32),
      credentialBundleHash: "0x" + "06".repeat(32),
      result: { eligible: true, reason: "ok" as const, policyId: "p", disclosedClaims: [] },
      expiry: 2_000_000_000,
      issuedAt: 1_000_000_000,
      quoteCommitment: "0xnotenoughhex",
    };
    expect(() => buildReceiptDocument(inputs)).toThrow(/quoteCommitment must be 32-byte/);
  });

  it("buildReceiptDocument emits version 1.2.0 with the field", () => {
    const inputs = {
      receiptId: "0x" + "01".repeat(32),
      challenge: "0x" + "02".repeat(32),
      policyHash: "0x" + "03".repeat(32),
      agentIdCommitment: "0x" + "04".repeat(32),
      verifierPubKey: "0x" + "05".repeat(32),
      credentialBundleHash: "0x" + "06".repeat(32),
      result: { eligible: true, reason: "ok" as const, policyId: "p", disclosedClaims: [] },
      expiry: 2_000_000_000,
      issuedAt: 1_000_000_000,
      quoteCommitment: "0x" + "ab".repeat(32),
    };
    const doc = buildReceiptDocument(inputs);
    expect(doc.version).toBe("compass-receipt-1.2.0");
    expect(doc.quoteCommitment).toBe("0x" + "ab".repeat(32));
  });
});

describe("per-receipt quote binding", () => {
  const receiptId = "0x" + "9a".repeat(32);
  const composeHash2 = "0x" + "ab".repeat(32);

  function fakePerReceiptQuote(addr: string, cmp: string, rid: string): string {
    const input = dstackTesting.buildPerReceiptReportDataInput(addr, cmp, rid);
    const digest = sha256(input);
    const out = new Uint8Array(64);
    out.set(digest, 0);
    return fakeQuote(out, 4);
  }

  it("accepts a correctly-bound per-receipt quote", () => {
    const quote = fakePerReceiptQuote(ethAddress, composeHash2, receiptId);
    expect(() =>
      verifyPerReceiptQuoteBinding({
        quoteHex: quote,
        expectedEthAddress: ethAddress,
        expectedComposeHash: composeHash2,
        expectedReceiptId: receiptId,
      }),
    ).not.toThrow();
  });

  it("throws REPORT_DATA_MISMATCH on substituted receiptId", () => {
    const quote = fakePerReceiptQuote(ethAddress, composeHash2, receiptId);
    const otherReceiptId = "0x" + "ff".repeat(32);
    try {
      verifyPerReceiptQuoteBinding({
        quoteHex: quote,
        expectedEthAddress: ethAddress,
        expectedComposeHash: composeHash2,
        expectedReceiptId: otherReceiptId,
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("REPORT_DATA_MISMATCH");
    }
  });

  it("throws RECEIPT_ID_LENGTH on 31-byte receiptId", () => {
    try {
      verifyPerReceiptQuoteBinding({
        quoteHex: fakeQuote(new Uint8Array(64), 4),
        expectedEthAddress: ethAddress,
        expectedComposeHash: composeHash2,
        expectedReceiptId: "0x" + "11".repeat(31),
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as VerificationError).code).toBe("RECEIPT_ID_LENGTH");
    }
  });
});

describe("quoteCommitmentFromQuoteHex hardening", () => {
  it("rejects odd-length hex", () => {
    expect(() => quoteCommitmentFromQuoteHex("0xabc")).toThrow(/even-length/);
  });

  it("rejects non-hex chars", () => {
    expect(() => quoteCommitmentFromQuoteHex("0xzzzz")).toThrow(/non-hex/);
  });

  it("accepts uppercase 0X prefix", () => {
    const lower = quoteCommitmentFromQuoteHex("0xabcdef");
    const upper = quoteCommitmentFromQuoteHex("0XABCDEF");
    expect(lower).toBe(upper);
  });

  it("rejects empty input", () => {
    expect(() => quoteCommitmentFromQuoteHex("0x")).toThrow(/empty/);
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
