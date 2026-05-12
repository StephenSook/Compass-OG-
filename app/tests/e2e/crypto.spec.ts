import { expect, test } from "@playwright/test";

// Browser-side crypto round-trip — runs in a real Chromium context so the
// AES-GCM + IndexedDB primitives the vault.ts module uses are exercised
// against the same Web Crypto implementation users actually hit. Mirrors
// the assertions of the manual Playwright probe in this session.

test("AES-256-GCM round-trip + IDB persistence + type guard", async ({ page }) => {
  // Navigate to /vault so we have a real https-equivalent origin context
  // (localhost is also a secure context for SubtleCrypto + IDB).
  await page.goto("/vault");

  const result = await page.evaluate(async () => {
    function bytesToBase64Url(bytes: Uint8Array): string {
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    type Tests = Record<string, { pass: boolean; detail?: string }>;
    const out: Tests = {};

    // T1: AES-256-GCM round-trip
    try {
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = "compass-vault-roundtrip-test-eyJ0eXAiOiJ2YytzZC1qd3QifQ";
      const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        new TextEncoder().encode(plaintext) as BufferSource,
      );
      const ctB64 = bytesToBase64Url(new Uint8Array(ct));
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        ct,
      );
      const text = new TextDecoder().decode(decrypted);
      out.aesRoundTrip = {
        pass: text === plaintext,
        detail: `keyExtractable=${key.extractable}, ctLen=${ctB64.length}`,
      };
    } catch (e) {
      out.aesRoundTrip = { pass: false, detail: String(e) };
    }

    // T2: GCM auth tag rejects 1-bit flip
    try {
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        new TextEncoder().encode("hello") as BufferSource,
      );
      const tampered = new Uint8Array(ct);
      tampered[0] = tampered[0] ^ 0x01;
      let threw = false;
      try {
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv as BufferSource },
          key,
          tampered as BufferSource,
        );
      } catch {
        threw = true;
      }
      out.gcmAuthTag = { pass: threw };
    } catch (e) {
      out.gcmAuthTag = { pass: false, detail: String(e) };
    }

    // T3: IndexedDB CryptoKey persistence
    try {
      indexedDB.deleteDatabase("compass-vault-pwtest");
      await new Promise((r) => setTimeout(r, 50));
      const dbReq = indexedDB.open("compass-vault-pwtest", 1);
      await new Promise<void>((res, rej) => {
        dbReq.onupgradeneeded = () => dbReq.result.createObjectStore("keys");
        dbReq.onsuccess = () => res();
        dbReq.onerror = () => rej(dbReq.error);
      });
      const db = dbReq.result;
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      await new Promise<void>((res, rej) => {
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").put(key, "vault-key-v1");
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      const fetched = await new Promise<CryptoKey>((res, rej) => {
        const tx = db.transaction("keys", "readonly");
        const req = tx.objectStore("keys").get("vault-key-v1");
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      db.close();
      indexedDB.deleteDatabase("compass-vault-pwtest");
      out.idbPersist = {
        pass:
          (fetched.algorithm as { name: string }).name === "AES-GCM"
          && fetched.extractable === false,
        detail: `algo=${(fetched.algorithm as { name: string }).name}, ext=${fetched.extractable}`,
      };
    } catch (e) {
      out.idbPersist = { pass: false, detail: String(e) };
    }

    // T4: type-guard rejects old plaintext shape, accepts v2
    type StoredLiveCredential = {
      schema: string;
      ciphertext: string;
      iv: string;
      bytesEncrypted: number;
      issuerDid: string;
      claimNames: string[];
    };
    function isStoredLiveCredential(v: unknown): v is StoredLiveCredential {
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
    const v2 = {
      schema: "compass.live_credential.v2",
      ciphertext: "abc",
      iv: "iv",
      algorithm: "AES-256-GCM",
      keySource: "indexeddb-random-256",
      bytesEncrypted: 100,
      encryptedAt: 1000,
      issuerDid: "did:key:z",
      vct: "x",
      claimNames: ["a"],
      issuedAt: 1,
      expiresAt: 2,
    };
    const oldShape = { sdjwtvc: "ey...", issuerDid: "did:key:z", claimNames: ["a"] };
    out.typeGuard = {
      pass: isStoredLiveCredential(v2) === true && isStoredLiveCredential(oldShape) === false,
    };

    return out;
  });

  for (const [name, r] of Object.entries(result)) {
    expect.soft(r.pass, `${name}: ${r.detail ?? ""}`).toBe(true);
  }
});
