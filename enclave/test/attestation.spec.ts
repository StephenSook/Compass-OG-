import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { tryLoadAttestedSigner, __testing as dstackTesting } from "../src/dstack";
import {
  extractReportData,
  verifyReportDataBinding,
} from "../src/verify-attestation";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";

const ZERO_ADDR = "0x" + "00".repeat(20);
const ZERO_COMPOSE = "0x" + "00".repeat(32);

function fakeQuoteWithReportData(reportData: Uint8Array): string {
  if (reportData.length !== 64) throw new Error("reportData must be 64 bytes");
  const buf = new Uint8Array(568 + 64);
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

describe("verify-attestation", () => {
  const priv = Uint8Array.from(
    Buffer.from("1".padStart(64, "0"), "hex"),
  );
  const pub = secp256k1.getPublicKey(priv, false);
  const ethAddress = deriveEthAddressFromUncompressed(pub);
  const composeHash = "0x" + "ab".repeat(32);

  it("extractReportData returns 64 bytes from offset 568", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    const quote = fakeQuoteWithReportData(synthetic);
    const extracted = extractReportData(quote);
    expect(extracted.length).toBe(64);
    expect(Buffer.from(extracted).toString("hex")).toBe(
      Buffer.from(synthetic).toString("hex"),
    );
  });

  it("verifies a correctly-bound report_data", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    const quote = fakeQuoteWithReportData(synthetic);
    const result = verifyReportDataBinding({
      quoteHex: quote,
      expectedEthAddress: ethAddress,
      expectedComposeHash: composeHash,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects when eth address does not match", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    const quote = fakeQuoteWithReportData(synthetic);
    const result = verifyReportDataBinding({
      quoteHex: quote,
      expectedEthAddress: ZERO_ADDR,
      expectedComposeHash: composeHash,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/ethAddress/);
  });

  it("rejects when compose hash does not match", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    const quote = fakeQuoteWithReportData(synthetic);
    const result = verifyReportDataBinding({
      quoteHex: quote,
      expectedEthAddress: ethAddress,
      expectedComposeHash: ZERO_COMPOSE,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects when padding is non-zero (unexpected dstack output)", () => {
    const synthetic = syntheticReportData(ethAddress, composeHash);
    synthetic[40] = 0xff;
    const quote = fakeQuoteWithReportData(synthetic);
    const result = verifyReportDataBinding({
      quoteHex: quote,
      expectedEthAddress: ethAddress,
      expectedComposeHash: composeHash,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/padding/);
  });

  it("rejects truncated quote", () => {
    expect(() => extractReportData("0x" + "00".repeat(100))).toThrow(
      /quote too short/,
    );
  });

  it("rejects 19-byte eth address input", () => {
    const result = verifyReportDataBinding({
      quoteHex: fakeQuoteWithReportData(new Uint8Array(64)),
      expectedEthAddress: "0x" + "11".repeat(19),
      expectedComposeHash: composeHash,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/eth address/);
  });

  it("rejects 31-byte compose hash input", () => {
    const result = verifyReportDataBinding({
      quoteHex: fakeQuoteWithReportData(new Uint8Array(64)),
      expectedEthAddress: ethAddress,
      expectedComposeHash: "0x" + "22".repeat(31),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/compose hash/);
  });
});

describe("dstack.tryLoadAttestedSigner", () => {
  it("returns null when /var/run/dstack.sock absent (dev env)", async () => {
    const bundle = await tryLoadAttestedSigner({ socketPath: "/nonexistent/dstack.sock" });
    expect(bundle).toBeNull();
  });

  it("returns null when COMPASS_FORCE_LOCAL forces it (caller must check)", async () => {
    // tryLoadAttestedSigner ignores COMPASS_FORCE_LOCAL itself — that gate
    // lives in server.ts. Direct calls bypass it. Doc the contract here.
    const bundle = await tryLoadAttestedSigner({ socketPath: "/nonexistent/x" });
    expect(bundle).toBeNull();
  });
});

describe("dstack.buildReportDataInput", () => {
  it("concatenates 20-byte address + 32-byte compose to 52 bytes", () => {
    const addr = "0x" + "aa".repeat(20);
    const cmp = "0x" + "bb".repeat(32);
    const out = dstackTesting.buildReportDataInput(addr, cmp);
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
    const priv = Uint8Array.from(Buffer.from("1".padStart(64, "0"), "hex"));
    const pub = secp256k1.getPublicKey(priv, false);
    const addr = deriveEthAddressFromUncompressed(pub);
    expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
    // Determinism: same input → same output.
    expect(deriveEthAddressFromUncompressed(pub)).toBe(addr);
  });

  it("rejects compressed pubkey", () => {
    const priv = Uint8Array.from(Buffer.from("1".padStart(64, "0"), "hex"));
    const pubCompressed = secp256k1.getPublicKey(priv, true);
    expect(() => deriveEthAddressFromUncompressed(pubCompressed)).toThrow(/65-byte/);
  });
});
