import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseBundle,
  verifyBundle,
  type ReceiptBundle,
} from "../verifyReceipt";

// Sample is the bundled test fixture pinned to composeHash = 0xab × 32
// (enclave/scripts/mint-sample-receipt.ts:27). Copied to app/public/
// samples/ for /verify's "Try sample" affordance.
const SAMPLE_PATH = resolve(
  __dirname,
  "../../../public/samples/receipt-sample.json",
);
const SAMPLE_COMPOSE_HASH = "0x" + "ab".repeat(32);
const PROD_COMPOSE_HASH =
  "0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0";

function loadSample(): ReceiptBundle {
  return parseBundle(readFileSync(SAMPLE_PATH, "utf8"));
}

// Deep clone via JSON round-trip — safe for the ReceiptBundle shape
// (no Dates, functions, or undefined fields).
function clone(b: ReceiptBundle): ReceiptBundle {
  return JSON.parse(JSON.stringify(b)) as ReceiptBundle;
}

describe("verifyBundle — happy path (canonical byte-parity with CLI)", () => {
  it("verifies the bundled sample receipt 4/4 ✓", () => {
    const bundle = loadSample();
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(true);
    expect(r.steps).toHaveLength(4);
    expect(r.steps.every((s) => s.ok)).toBe(true);
    if (r.ok) {
      expect(r.receipt.version).toBe("compass-receipt-1.2.0");
      expect(r.signerAddress.toLowerCase()).toBe(
        bundle.signerAddress.toLowerCase(),
      );
      expect(r.composeHash).toBe(SAMPLE_COMPOSE_HASH);
    }
  });
});

describe("verifyBundle — Step 1 (canonicalization + digest)", () => {
  it("rejects a receipt with a lone high surrogate (\\uD800)", () => {
    const bundle = loadSample();
    bundle.receipt.result.reason = "ok\uD800";
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    const step1 = r.steps[0]!;
    expect(step1.ok).toBe(false);
    if (!step1.ok) {
      expect(step1.detail).toMatch(/lone high surrogate/);
    }
  });

  it("rejects a receipt with a lone low surrogate (\\uDC00)", () => {
    const bundle = loadSample();
    bundle.receipt.result.reason = "ok\uDC00";
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    const step1 = r.steps[0]!;
    if (!step1.ok) {
      expect(step1.detail).toMatch(/lone low surrogate/);
    }
  });

  it("fails Step 1 when receipt fields are tampered (digest mismatch)", () => {
    const bundle = loadSample();
    bundle.receipt.expiry = bundle.receipt.expiry + 1;
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    expect(r.steps[0]!.ok).toBe(false);
  });
});

describe("verifyBundle — Step 2 (ECDSA recovery)", () => {
  it("fails when signerAddress is tampered to a different address", () => {
    const bundle = loadSample();
    bundle.signerAddress = "0x" + "ff".repeat(20);
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    const step2 = r.steps[1]!;
    expect(step2.ok).toBe(false);
    if (!step2.ok) {
      expect(step2.detail).toMatch(/expected|candidates/i);
    }
  });

  it("fails when signature bytes are random garbage", () => {
    const bundle = loadSample();
    bundle.signature = "0x" + "ab".repeat(64);
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    expect(r.steps[1]!.ok).toBe(false);
  });

  it("rejects a malformed signature (wrong byte length) with explicit detail", () => {
    const bundle = loadSample();
    bundle.signature = "0x" + "ab".repeat(50);
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    const step2 = r.steps[1]!;
    if (!step2.ok) {
      expect(step2.detail).toMatch(/signature must be 64 bytes/);
    }
  });
});

describe("verifyBundle — Step 3 (quoteCommitment + env-mode sentinel)", () => {
  it("emits Step 3 + Step 4 as failures when perReceiptQuoteHex is null", () => {
    const bundle = loadSample();
    bundle.perReceiptQuoteHex = null;
    const r = verifyBundle({
      bundle,
      expectedComposeHash: SAMPLE_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    expect(r.steps).toHaveLength(4);
    expect(r.steps[2]!.ok).toBe(false);
    expect(r.steps[3]!.ok).toBe(false);
    if (!r.steps[2]!.ok) {
      expect(r.steps[2]!.detail).toMatch(/no perReceiptQuoteHex/);
    }
  });
});

describe("verifyBundle — Step 4 (quote report_data binding)", () => {
  it("fails Step 4 when composeHash is wrong (real-receipt vs sample mix-up)", () => {
    const bundle = loadSample();
    const r = verifyBundle({
      bundle,
      expectedComposeHash: PROD_COMPOSE_HASH,
    });
    expect(r.ok).toBe(false);
    const step4 = r.steps[3]!;
    expect(step4.ok).toBe(false);
    if (!step4.ok) {
      expect(step4.detail).toMatch(/report_data does not match/);
    }
  });
});

describe("parseBundle — version pin + shape validation", () => {
  it("rejects v1.1.0 receipts (deprecated boot-quote binding)", () => {
    const text = readFileSync(SAMPLE_PATH, "utf8");
    const downgraded = text.replace(
      '"version": "compass-receipt-1.2.0"',
      '"version": "compass-receipt-1.1.0"',
    );
    expect(() => parseBundle(downgraded)).toThrow(/version.*not accepted/);
  });

  it("rejects bundles missing required top-level fields", () => {
    expect(() => parseBundle('{"signature":"0x00","signerAddress":"0x00"}')).toThrow(
      /missing required fields/,
    );
  });

  it("rejects bundles where receipt is not a plain object", () => {
    const text = JSON.stringify({
      receipt: "not-an-object",
      attestationDigest: "0x" + "a".repeat(64),
      signature: "0x" + "b".repeat(130),
      signerAddress: "0x" + "c".repeat(40),
    });
    expect(() => parseBundle(text)).toThrow(/bundle.receipt must be a JSON object/);
  });

  it("rejects bundles missing receipt.policyHash (deep shape)", () => {
    const bundle = JSON.parse(readFileSync(SAMPLE_PATH, "utf8"));
    delete bundle.receipt.policyHash;
    expect(() => parseBundle(JSON.stringify(bundle))).toThrow(
      /bundle.receipt.policyHash must be a string/,
    );
  });

  it("accepts the canonical sample without throwing", () => {
    const text = readFileSync(SAMPLE_PATH, "utf8");
    expect(() => parseBundle(text)).not.toThrow();
  });
});
