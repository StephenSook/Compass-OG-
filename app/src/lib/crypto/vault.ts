// Browser-side vault crypto. AES-256-GCM via WebCrypto with a non-extractable
// 256-bit AES key persisted in IndexedDB. The key never leaves the browser:
// generateKey is called with extractable=false, so it can only be passed to
// SubtleCrypto.encrypt/decrypt.
//
// v1 design points:
// - per-device random key, NOT derived from the user's wallet. Cross-device
//   continuity is a v3 problem (key escrow / wallet-signed unwrap).
// - ciphertext + iv stored in localStorage; key in IndexedDB. An attacker who
//   reads only localStorage cannot decrypt; they would also need the IDB key,
//   which is non-extractable and cannot be cloned out via web APIs.
// - 0G Storage upload of ciphertext is still v2.
//
// This module is browser-only — never import it from a server component or a
// route handler. Calls reference window/indexedDB/crypto.subtle directly.

const DB_NAME = "compass-vault";
const DB_VERSION = 1;
const STORE = "keys";
const KEY_ID = "vault-key-v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
  });
}

async function idbGet(id: string): Promise<CryptoKey | null> {
  const db = await openDb();
  try {
    return await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as CryptoKey | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IDB get failed"));
    });
  } finally {
    db.close();
  }
}

async function idbPut(id: string, key: CryptoKey): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(key, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB put failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IDB put aborted"));
    });
  } finally {
    db.close();
  }
}

export async function getOrCreateVaultKey(): Promise<CryptoKey> {
  const existing = await idbGet(KEY_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await idbPut(KEY_ID, key);
  return key;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  bytesEncrypted: number;
};

// TS 5.7 narrowed BufferSource to ArrayBufferView<ArrayBuffer> | ArrayBuffer,
// which forces explicit casts at WebCrypto call sites — Uint8Array literals
// resolve to Uint8Array<ArrayBufferLike> and no longer match. Casting the
// values rather than widening BufferSource keeps the surface narrow.
export async function encryptText(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    textEncoder.encode(plaintext) as BufferSource,
  );
  const bytes = new Uint8Array(ct);
  return {
    ciphertext: bytesToBase64Url(bytes),
    iv: bytesToBase64Url(iv),
    bytesEncrypted: bytes.byteLength,
  };
}

export async function decryptText(
  payload: EncryptedPayload,
  key: CryptoKey,
): Promise<string> {
  const iv = base64UrlToBytes(payload.iv);
  const ct = base64UrlToBytes(payload.ciphertext);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  return textDecoder.decode(pt);
}

export type StoredLiveCredential = {
  schema: "compass.live_credential.v2";
  ciphertext: string;
  iv: string;
  algorithm: "AES-256-GCM";
  keySource: "indexeddb-random-256";
  bytesEncrypted: number;
  encryptedAt: number;
  issuerDid: string;
  vct: string;
  claimNames: string[];
  issuedAt: number;
  expiresAt: number;
};

export function isStoredLiveCredential(v: unknown): v is StoredLiveCredential {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return (
    x.schema === "compass.live_credential.v2"
    && typeof x.ciphertext === "string"
    && typeof x.iv === "string"
    && typeof x.bytesEncrypted === "number"
    && typeof x.issuerDid === "string"
    && Array.isArray(x.claimNames)
  );
}
