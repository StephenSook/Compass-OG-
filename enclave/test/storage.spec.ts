/**
 * Storage integration tests — gated on funded Galileo testnet env.
 *
 * Required env to run the live suite:
 *   ZG_RPC_URL                e.g. https://evmrpc-testnet.0g.ai
 *   ZG_INDEXER_URL            e.g. https://indexer-storage-testnet-turbo.0g.ai
 *   ZG_STORAGE_PRIVATE_KEY    0x-prefixed funded testnet wallet
 *   (or DEPLOYER_PRIVATE_KEY as fallback)
 *
 * Without these, the live tests skip cleanly. The local `constructor`
 * smoke test always runs and confirms wiring + env-gate behavior.
 */
import { describe, it, expect } from "vitest";
import { CompassStorage, compassStorageFromEnv } from "../src/storage";
import {
  encryptVault,
  decryptVault,
  serializeVault,
  deserializeVault,
} from "../src/crypto";

const HAS_LIVE_ENV =
  !!process.env.ZG_RPC_URL &&
  !!process.env.ZG_INDEXER_URL &&
  (!!process.env.ZG_STORAGE_PRIVATE_KEY || !!process.env.DEPLOYER_PRIVATE_KEY);

describe("storage — config + env-gate (always runs)", () => {
  it("constructor rejects missing config fields", () => {
    expect(
      () => new CompassStorage({ rpcUrl: "", indexerUrl: "x", privateKeyHex: "0x1" }),
    ).toThrow(/rpcUrl/);
    expect(
      () => new CompassStorage({ rpcUrl: "x", indexerUrl: "", privateKeyHex: "0x1" }),
    ).toThrow(/indexerUrl/);
    expect(
      () => new CompassStorage({ rpcUrl: "x", indexerUrl: "x", privateKeyHex: "" }),
    ).toThrow(/privateKeyHex/);
  });

  it("compassStorageFromEnv returns null when any required var is missing", () => {
    const orig = { ...process.env };
    delete process.env.ZG_RPC_URL;
    delete process.env.ZG_INDEXER_URL;
    delete process.env.ZG_STORAGE_PRIVATE_KEY;
    delete process.env.DEPLOYER_PRIVATE_KEY;
    expect(compassStorageFromEnv()).toBeNull();
    Object.assign(process.env, orig);
  });
});

describe.skipIf(!HAS_LIVE_ENV)(
  "storage — live Galileo round-trip (env-gated, requires funded testnet OG)",
  () => {
    it("uploads an encrypted vault and downloads it back", async () => {
      const storage = compassStorageFromEnv();
      expect(storage).not.toBeNull();
      const plaintext = new TextEncoder().encode(
        '{"vct":"compass:help-legal-aid","is_FDH_in_HK":true,"has_pending_case":true}',
      );
      const aad = new TextEncoder().encode("agent:0xfixture");
      const blob = encryptVault({
        plaintext,
        passphrase: "compass-fixture-passphrase",
        aad,
      });
      const wire = serializeVault(blob);

      const { rootHash, txHash } = await storage!.upload(wire);
      expect(rootHash).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(txHash).toMatch(/^0x[0-9a-fA-F]+$/);

      const downloaded = await storage!.download(rootHash);
      expect(Buffer.from(downloaded)).toEqual(Buffer.from(wire));

      const reborn = deserializeVault(downloaded);
      const out = decryptVault({ blob: reborn, passphrase: "compass-fixture-passphrase", aad });
      expect(Buffer.from(out)).toEqual(Buffer.from(plaintext));
    }, 120_000);

    it("download rejects malformed rootHash", async () => {
      const storage = compassStorageFromEnv()!;
      await expect(storage.download("not-hex")).rejects.toThrow(/0x hex/);
    });

    it("upload rejects empty buffer", async () => {
      const storage = compassStorageFromEnv()!;
      await expect(storage.upload(new Uint8Array(0))).rejects.toThrow(/empty/);
    });
  },
);
