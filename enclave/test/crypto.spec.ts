import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encryptVault,
  decryptVault,
  deriveKey,
  serializeVault,
  deserializeVault,
} from "../src/crypto";

const PASSPHRASE = "compass-fixture-passphrase-correct-horse-battery-staple";
const AAD = new TextEncoder().encode("agent:0x1234");
const PLAINTEXT = new TextEncoder().encode(
  '{"vct":"compass:help-legal-aid","is_FDH_in_HK":true,"has_pending_case":true}',
);

describe("crypto — AES-256-GCM + PBKDF2 vault encryption", () => {
  it("round-trips a fixture VC via encrypt → decrypt", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const out = decryptVault({ blob, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(out)).toEqual(Buffer.from(PLAINTEXT));
  });

  it("ciphertext is not equal to plaintext (sanity check)", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(blob.ciphertextAndTag)).not.toEqual(Buffer.from(PLAINTEXT));
    expect(blob.ciphertextAndTag.length).toBeGreaterThan(PLAINTEXT.length);
  });

  it("PBKDF2 derives a 256-bit key deterministically from passphrase + salt", () => {
    const salt = new Uint8Array(16).fill(0x42);
    const k1 = deriveKey(PASSPHRASE, salt);
    const k2 = deriveKey(PASSPHRASE, salt);
    expect(k1.length).toBe(32);
    expect(Buffer.from(k1)).toEqual(Buffer.from(k2));
    const k3 = deriveKey("different-passphrase", salt);
    expect(Buffer.from(k1)).not.toEqual(Buffer.from(k3));
  });

  it("PBKDF2 is salt-sensitive — same passphrase + different salt → different key", () => {
    const s1 = new Uint8Array(16).fill(0x01);
    const s2 = new Uint8Array(16).fill(0x02);
    const k1 = deriveKey(PASSPHRASE, s1);
    const k2 = deriveKey(PASSPHRASE, s2);
    expect(Buffer.from(k1)).not.toEqual(Buffer.from(k2));
  });

  it("PBKDF2 rejects salts of the wrong length", () => {
    expect(() => deriveKey(PASSPHRASE, new Uint8Array(8))).toThrow(/salt must be/);
  });

  it("two encrypts of the same plaintext produce different IVs (no static IV reuse)", () => {
    const a = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const b = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(a.iv)).not.toEqual(Buffer.from(b.iv));
    expect(Buffer.from(a.salt)).not.toEqual(Buffer.from(b.salt));
    expect(Buffer.from(a.ciphertextAndTag)).not.toEqual(Buffer.from(b.ciphertextAndTag));
  });

  it("tampered ciphertext fails GCM auth-tag verification", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const tampered = {
      ...blob,
      ciphertextAndTag: Uint8Array.from(blob.ciphertextAndTag),
    };
    tampered.ciphertextAndTag[0] ^= 0x01;
    expect(() =>
      decryptVault({ blob: tampered, passphrase: PASSPHRASE, aad: AAD }),
    ).toThrow(/decryption failed/);
  });

  it("decrypt with wrong passphrase fails (auth-tag mismatch)", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    expect(() =>
      decryptVault({ blob, passphrase: "wrong-passphrase", aad: AAD }),
    ).toThrow(/decryption failed/);
  });

  it("decrypt with wrong AAD fails (replay-into-other-agent guard)", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const otherAad = new TextEncoder().encode("agent:0xdead");
    expect(() =>
      decryptVault({ blob, passphrase: PASSPHRASE, aad: otherAad }),
    ).toThrow(/decryption failed/);
  });

  it("encrypt rejects empty passphrase (boundary input check)", () => {
    expect(() =>
      encryptVault({ plaintext: PLAINTEXT, passphrase: "", aad: AAD }),
    ).toThrow(/passphrase must be non-empty/);
  });

  it("encrypt rejects empty plaintext (vault would contain no credential)", () => {
    expect(() =>
      encryptVault({ plaintext: new Uint8Array(0), passphrase: PASSPHRASE, aad: AAD }),
    ).toThrow(/plaintext must be non-empty/);
  });

  it("decrypt rejects empty passphrase", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    expect(() => decryptVault({ blob, passphrase: "", aad: AAD })).toThrow(
      /passphrase must be non-empty/,
    );
  });

  it("serialize → deserialize round-trips the wire format", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const wire = serializeVault(blob);
    const reborn = deserializeVault(wire);
    expect(reborn.version).toBe(1);
    expect(Buffer.from(reborn.salt)).toEqual(Buffer.from(blob.salt));
    expect(Buffer.from(reborn.iv)).toEqual(Buffer.from(blob.iv));
    expect(Buffer.from(reborn.ciphertextAndTag)).toEqual(Buffer.from(blob.ciphertextAndTag));
    const out = decryptVault({ blob: reborn, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(out)).toEqual(Buffer.from(PLAINTEXT));
  });

  it("deserializeVault returns copies, not aliased views (Buffer slice trap)", () => {
    // Simulate the production case: download() returns Uint8Array.from(readFileSync())
    // but if a future caller passes a Buffer directly, slice() would alias.
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const wire = Buffer.from(serializeVault(blob));
    const reborn = deserializeVault(wire);
    // Mutate the input AFTER deserialize. Aliased slices would propagate.
    wire.fill(0xff);
    // Decrypt must still succeed — deserialized fields must be independent copies.
    const out = decryptVault({ blob: reborn, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(out)).toEqual(Buffer.from(PLAINTEXT));
  });

  it("deserialize rejects truncated buffers", () => {
    expect(() => deserializeVault(new Uint8Array(10))).toThrow(/too short/);
  });

  it("deserialize rejects unknown version byte", () => {
    const blob = encryptVault({ plaintext: PLAINTEXT, passphrase: PASSPHRASE, aad: AAD });
    const wire = serializeVault(blob);
    wire[0] = 99;
    expect(() => deserializeVault(wire)).toThrow(/unknown version/);
  });

  it("handles random binary plaintext containing null bytes (not just JSON)", () => {
    const random = randomBytes(4096);
    random[0] = 0; random[100] = 0; random[1000] = 0;
    const blob = encryptVault({
      plaintext: Uint8Array.from(random),
      passphrase: PASSPHRASE,
      aad: AAD,
    });
    const out = decryptVault({ blob, passphrase: PASSPHRASE, aad: AAD });
    expect(Buffer.from(out)).toEqual(random);
  });

  it("handles empty AAD (binding optional)", () => {
    const blob = encryptVault({
      plaintext: PLAINTEXT,
      passphrase: PASSPHRASE,
      aad: new Uint8Array(0),
    });
    const out = decryptVault({ blob, passphrase: PASSPHRASE, aad: new Uint8Array(0) });
    expect(Buffer.from(out)).toEqual(Buffer.from(PLAINTEXT));
  });
});
