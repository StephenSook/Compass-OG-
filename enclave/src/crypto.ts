/**
 * AES-256-GCM + PBKDF2-SHA-256 for Compass encrypted credential vaults.
 *
 * Threat model: Maria's SD-JWT VCs are encrypted client-side BEFORE upload to
 * 0G Storage. Only Maria's device (or the TEE, on grant consumption) holds
 * the passphrase. The 0G Storage layer sees ciphertext only.
 *
 * Output format is a flat byte buffer:
 *
 *   [1 byte version=1][16 byte salt][12 byte iv][N byte ciphertext+tag]
 *
 * The trailing 16 bytes of ciphertext+tag is the GCM auth tag, matching
 * WebCrypto's `subtle.encrypt` output convention so the same blob can later
 * be decrypted in-browser without reframing.
 *
 * PBKDF2 iterations are pinned at 600,000 (OWASP 2023 baseline for
 * SHA-256). Random salt per encrypt, random 96-bit IV per encrypt — so
 * passphrase reuse across encrypts cannot leak via key/IV collision.
 *
 * AAD binds the ciphertext to a context string (typically the agent ID
 * commitment) — replaying a credential blob into a different agent's slot
 * fails decrypt with auth-tag mismatch.
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
  /** Context binding — typically agentIdCommitment. Replay-protects the blob. */
  aad: Uint8Array;
}): EncryptedVault {
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
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return Uint8Array.from(pt);
}

/** Pack an EncryptedVault to a single byte buffer for storage upload. */
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
  const version = bytes[0];
  if (version !== VERSION_BYTE) throw new Error(`unknown version byte: ${version}`);
  return {
    version: 1,
    salt: bytes.slice(1, 1 + SALT_LEN),
    iv: bytes.slice(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN),
    ciphertextAndTag: bytes.slice(1 + SALT_LEN + IV_LEN),
  };
}
