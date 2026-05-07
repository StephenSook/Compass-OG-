import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import {
  buildApp,
  loadSigner,
  PayloadValidationError,
  signReceipt,
  validateCompassPayload,
  type SignerContext,
} from "../src/server";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";

const TEST_PRIV = Uint8Array.from(Buffer.from("1".padStart(64, "0"), "hex"));
const TEST_PUB = secp256k1.getPublicKey(TEST_PRIV, false);
const TEST_ADDR = deriveEthAddressFromUncompressed(TEST_PUB);

function fakeEnvSigner(): SignerContext {
  return { source: "env", privKey: TEST_PRIV, ethAddress: TEST_ADDR, attestation: null };
}

function validPayload() {
  const hex32 = (b: number) => "0x" + b.toString(16).padStart(2, "0").repeat(32);
  return {
    receiptId: hex32(1),
    challenge: hex32(2),
    agentIdCommitment: hex32(3),
    verifierPubKey: hex32(4),
    credentialBundleHash: hex32(5),
    policy: {
      policyId: "policy/test/v1",
      version: "1",
      predicate: { claim: "is_FDH_in_HK", equals: true },
      minAnonymitySet: 5,
      expectedVct: "https://compass/vc/test",
      credentialBundleSchema: { required: ["is_FDH_in_HK"], properties: {} },
      trustedIssuers: ["did:key:zMockTest"],
    },
    policyHash: hex32(6),
    claims: { is_FDH_in_HK: true },
    expiry: 2_000_000_000,
    issuedAt: 1_000_000_000,
  };
}

describe("validateCompassPayload", () => {
  it("accepts a well-formed payload", () => {
    expect(() => validateCompassPayload(validPayload())).not.toThrow();
  });

  it("rejects null", () => {
    expect(() => validateCompassPayload(null)).toThrow(PayloadValidationError);
  });

  it("rejects non-object", () => {
    expect(() => validateCompassPayload("string")).toThrow(PayloadValidationError);
  });

  for (const f of ["receiptId", "challenge", "agentIdCommitment", "policyHash", "credentialBundleHash"] as const) {
    it(`rejects missing ${f}`, () => {
      const p = validPayload();
      delete (p as Record<string, unknown>)[f];
      expect(() => validateCompassPayload(p)).toThrow(new RegExp(f));
    });
    it(`rejects malformed ${f} (not 32-byte hex)`, () => {
      const p = validPayload();
      (p as Record<string, unknown>)[f] = "0xabc";
      expect(() => validateCompassPayload(p)).toThrow(new RegExp(f));
    });
  }

  it("rejects malformed verifierPubKey", () => {
    const p = validPayload();
    p.verifierPubKey = "not-hex";
    expect(() => validateCompassPayload(p)).toThrow(/verifierPubKey/);
  });

  it("rejects negative expiry", () => {
    const p = validPayload();
    p.expiry = -1;
    expect(() => validateCompassPayload(p)).toThrow(/expiry/);
  });

  it("rejects expiry <= issuedAt", () => {
    const p = validPayload();
    p.expiry = p.issuedAt;
    expect(() => validateCompassPayload(p)).toThrow(/expiry must follow/);
  });

  it("rejects null policy", () => {
    const p = validPayload();
    (p as Record<string, unknown>).policy = null;
    expect(() => validateCompassPayload(p)).toThrow(/policy/);
  });

  it("rejects null claims", () => {
    const p = validPayload();
    (p as Record<string, unknown>).claims = null;
    expect(() => validateCompassPayload(p)).toThrow(/claims/);
  });
});

describe("signReceipt", () => {
  it("produces a 64-byte ECDSA r||s signature (raw, lowS-enforced)", () => {
    const digest = "0x" + "ab".repeat(32);
    const sig = signReceipt(TEST_PRIV, digest);
    expect(sig).toMatch(/^0x[0-9a-f]+$/);
    expect(sig.length).toBe(2 + 64 * 2);
  });

  it("is deterministic for the same digest (RFC6979 + lowS)", () => {
    const digest = "0x" + "cd".repeat(32);
    const a = signReceipt(TEST_PRIV, digest);
    const b = signReceipt(TEST_PRIV, digest);
    expect(a).toBe(b);
  });

  it("rejects non-32-byte digest", () => {
    expect(() => signReceipt(TEST_PRIV, "0xabc")).toThrow(/32-byte/);
  });
});

describe("loadSigner — TEE-required gate", () => {
  it("rejects garbage COMPASS_FORCE_LOCAL value (no boolean coercion)", async () => {
    const prev = process.env.COMPASS_FORCE_LOCAL;
    process.env.COMPASS_FORCE_LOCAL = "false";
    try {
      await expect(loadSigner()).rejects.toThrow(/literal "1" or "true"/);
    } finally {
      if (prev === undefined) delete process.env.COMPASS_FORCE_LOCAL;
      else process.env.COMPASS_FORCE_LOCAL = prev;
    }
  });

  it("rejects empty string COMPASS_FORCE_LOCAL", async () => {
    const prev = process.env.COMPASS_FORCE_LOCAL;
    process.env.COMPASS_FORCE_LOCAL = "";
    try {
      await expect(loadSigner()).rejects.toThrow(/literal "1" or "true"/);
    } finally {
      if (prev === undefined) delete process.env.COMPASS_FORCE_LOCAL;
      else process.env.COMPASS_FORCE_LOCAL = prev;
    }
  });

  it("loads env signer when COMPASS_FORCE_LOCAL=1 and key set", async () => {
    const prevForce = process.env.COMPASS_FORCE_LOCAL;
    const prevKey = process.env.COMPASS_RECEIPT_SIGNER_KEY;
    process.env.COMPASS_FORCE_LOCAL = "1";
    process.env.COMPASS_RECEIPT_SIGNER_KEY = "0x" + "01".padStart(64, "0");
    try {
      const signer = await loadSigner();
      expect(signer.source).toBe("env");
    } finally {
      if (prevForce === undefined) delete process.env.COMPASS_FORCE_LOCAL;
      else process.env.COMPASS_FORCE_LOCAL = prevForce;
      if (prevKey === undefined) delete process.env.COMPASS_RECEIPT_SIGNER_KEY;
      else process.env.COMPASS_RECEIPT_SIGNER_KEY = prevKey;
    }
  });
});

describe("buildApp HTTP routes", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = buildApp(fakeEnvSigner());
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("/health returns env-source signer", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { signer: string; source: string; status: string };
    expect(body.status).toBe("ok");
    expect(body.signer).toBe(TEST_ADDR);
    expect(body.source).toBe("env");
  });

  it("/v1/attestation 404s in env mode (no attestation)", async () => {
    const res = await fetch(`${baseUrl}/v1/attestation`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("E_NO_ATTESTATION");
  });

  it("/v1/chat/completions rejects empty body (E_REQ_SHAPE)", async () => {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("E_REQ_SHAPE");
  });

  it("/v1/chat/completions rejects missing user message", async () => {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: "x" }] }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe("E_REQ_USER_MSG");
  });

  it("/v1/chat/completions rejects invalid JSON in user content (E_DECODE_JSON)", async () => {
    const content = Buffer.from("not json").toString("base64");
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content }] }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe("E_DECODE_JSON");
  });

  it("/v1/chat/completions rejects malformed payload (E_PAYLOAD_VALIDATION)", async () => {
    const content = Buffer.from(JSON.stringify({ broken: "yes" })).toString("base64");
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content }] }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe("E_PAYLOAD_VALIDATION");
  });

  it("/v1/chat/completions signs valid payload and signature recovers to signer", async () => {
    const payload = validPayload();
    const content = Buffer.from(JSON.stringify(payload)).toString("base64");
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content }] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const inner = JSON.parse(body.choices[0].message.content) as {
      signature: string;
      signerAddress: string;
      attestationDigest: string;
      receipt: { receiptId: string };
    };
    expect(inner.signerAddress).toBe(TEST_ADDR);
    expect(inner.signature).toMatch(/^0x[0-9a-f]+$/);
    expect(inner.attestationDigest).toMatch(/^0x[0-9a-f]{64}$/);
    expect(inner.receipt.receiptId).toBe(payload.receiptId);
  });

  it("body too large triggers JSON error middleware (not HTML stack)", async () => {
    const huge = "x".repeat(2 * 1024 * 1024);
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: huge }] }),
    });
    expect([400, 413]).toContain(res.status);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("E_BODY_TOO_LARGE");
  });
});
