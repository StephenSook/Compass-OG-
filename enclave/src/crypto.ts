/**
 * AES-256-GCM + PBKDF2-SHA-256 for encrypted credential vaults.
 *
 * Wire format: [1B version=1][16B salt][12B iv][N B ciphertext||authTag]
 * The trailing 16 bytes of ciphertext||authTag is the GCM auth tag —
 * matches WebCrypto subtle.encrypt output so blobs decrypt in-browser
 * without reframing.
 */
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";

const VERSION_BYTE = 1;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;
const PBKDF2_ITERATIONS = 600_000;

export type EncryptedVault = {
  version: 1;
  salt: Uint8Array;
  iv: Uint8Array;
  /** ciphertext || authTag — matches WebCrypto subtle.encrypt output. */
  ciphertextAndTag: Uint8Array;
};

export function deriveKey(passphrase: string, salt: Uint8Array): Uint8Array {
  if (salt.length !== SALT_LEN) {
    throw new Error(`salt must be ${SALT_LEN} bytes, got ${salt.length}`);
  }
  const key = pbkdf2Sync(
    passphrase,
    Buffer.from(salt),
    PBKDF2_ITERATIONS,
    KEY_LEN,
    "sha256",
  );
  return Uint8Array.from(key);
}

export function encryptVault(opts: {
  plaintext: Uint8Array;
  passphrase: string;
  /** AAD binds blob to caller context (e.g. agentIdCommitment). Empty AAD = no binding. */
  aad: Uint8Array;
}): EncryptedVault {
  if (opts.passphrase.length === 0) throw new Error("passphrase must be non-empty");
  if (opts.plaintext.length === 0) throw new Error("plaintext must be non-empty");
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(opts.passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  if (opts.aad.length > 0) cipher.setAAD(Buffer.from(opts.aad));
  const ct = Buffer.concat([cipher.update(Buffer.from(opts.plaintext)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    salt: Uint8Array.from(salt),
    iv: Uint8Array.from(iv),
    ciphertextAndTag: Uint8Array.from(Buffer.concat([ct, tag])),
  };
}

export function decryptVault(opts: {
  blob: EncryptedVault;
  passphrase: string;
  aad: Uint8Array;
}): Uint8Array {
  if (opts.passphrase.length === 0) throw new Error("passphrase must be non-empty");
  const { blob } = opts;
  if (blob.version !== 1) throw new Error(`unknown vault version: ${blob.version}`);
  if (blob.salt.length !== SALT_LEN) throw new Error("bad salt length");
  if (blob.iv.length !== IV_LEN) throw new Error("bad iv length");
  if (blob.ciphertextAndTag.length < TAG_LEN) throw new Error("ciphertext+tag too short");
  const key = deriveKey(opts.passphrase, blob.salt);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(blob.iv));
  if (opts.aad.length > 0) decipher.setAAD(Buffer.from(opts.aad));
  const ctLen = blob.ciphertextAndTag.length - TAG_LEN;
  const ct = Buffer.from(blob.ciphertextAndTag.slice(0, ctLen));
  const tag = Buffer.from(blob.ciphertextAndTag.slice(ctLen));
  decipher.setAuthTag(tag);
  try {
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return Uint8Array.from(pt);
  } catch (e) {
    // GCM auth-tag mismatch — list candidate causes without leaking which check
    // failed (would be a padding-oracle-style channel).
    throw new Error(
      "vault decryption failed: wrong passphrase, wrong AAD, or tampered ciphertext",
      { cause: e },
    );
  }
}

export function serializeVault(v: EncryptedVault): Uint8Array {
  const total = 1 + SALT_LEN + IV_LEN + v.ciphertextAndTag.length;
  const out = new Uint8Array(total);
  out[0] = v.version;
  out.set(v.salt, 1);
  out.set(v.iv, 1 + SALT_LEN);
  out.set(v.ciphertextAndTag, 1 + SALT_LEN + IV_LEN);
  return out;
}

export function deserializeVault(bytes: Uint8Array): EncryptedVault {
  const minLen = 1 + SALT_LEN + IV_LEN + TAG_LEN;
  if (bytes.length < minLen) {
    throw new Error(`vault buffer too short: ${bytes.length} < ${minLen}`);
  }
  if (bytes[0] !== VERSION_BYTE) throw new Error(`unknown version byte: ${bytes[0]}`);
  // Uint8Array.from(...subarray) forces a copy. Buffer.prototype.slice (which
  // dispatches when bytes is a Node Buffer) returns a VIEW sharing the parent
  // ArrayBuffer — caller mutation or pooled-buffer recycling would silently
  // corrupt the returned vault.
  return {
    version: 1,
    salt: Uint8Array.from(bytes.subarray(1, 1 + SALT_LEN)),
    iv: Uint8Array.from(bytes.subarray(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN)),
    ciphertextAndTag: Uint8Array.from(bytes.subarray(1 + SALT_LEN + IV_LEN)),
  };
}
