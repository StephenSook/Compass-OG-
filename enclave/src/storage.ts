/**
 * 0G Storage wrapper for Compass encrypted-vault upload/download.
 *
 * Inputs are raw byte buffers (typically a serialized EncryptedVault from
 * crypto.ts). The caller does NOT see plaintext at this layer — that's
 * the point: 0G Storage holds ciphertext only.
 *
 * Operations:
 *   upload(bytes) → { rootHash, txHash } — paid in OG via the signer
 *   download(rootHash) → bytes — verified by Merkle root
 *
 * Phase 5 v1: requires a funded Galileo testnet wallet. Tests gate on
 * ZG_RPC_URL + ZG_INDEXER_URL + ZG_STORAGE_PRIVATE_KEY env vars; absence
 * skips the integration suite without failure.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Wallet, JsonRpcProvider } from "ethers";
// The SDK ships only an "exports" map; bare-specifier import works at
// runtime via vitest.config.ts's `resolve.conditions: [require, node]`.
// TypeScript resolution is helped along by the ambient .d.ts at
// types/0g-ts-sdk.d.ts (re-exports from the explicit CJS subpath).
import { Indexer, MemData, defaultUploadOption } from "@0glabs/0g-ts-sdk";

export type StorageConfig = {
  /** 0G Storage chain RPC (e.g. Galileo: https://evmrpc-testnet.0g.ai). */
  rpcUrl: string;
  /** Indexer service URL (e.g. https://indexer-storage-testnet-turbo.0g.ai). */
  indexerUrl: string;
  /** Private key (0x-prefixed hex). Funded with testnet OG. */
  privateKeyHex: string;
};

export type UploadResult = {
  rootHash: string;
  txHash: string;
};

export class CompassStorage {
  private readonly indexer: Indexer;
  private readonly signer: Wallet;

  constructor(private readonly config: StorageConfig) {
    if (!config.rpcUrl) throw new Error("rpcUrl required");
    if (!config.indexerUrl) throw new Error("indexerUrl required");
    if (!config.privateKeyHex) throw new Error("privateKeyHex required");
    this.indexer = new Indexer(config.indexerUrl);
    const provider = new JsonRpcProvider(config.rpcUrl);
    this.signer = new Wallet(config.privateKeyHex, provider);
  }

  /** Upload an opaque byte buffer. Returns the storage Merkle root + tx hash. */
  async upload(bytes: Uint8Array): Promise<UploadResult> {
    if (bytes.length === 0) throw new Error("cannot upload empty buffer");
    const file = new MemData(Array.from(bytes));
    const [result, err] = await this.indexer.upload(
      file,
      this.config.rpcUrl,
      this.signer,
      defaultUploadOption,
    );
    if (err) throw new Error(`0G upload failed: ${err.message ?? String(err)}`);
    if (!result) throw new Error("0G upload returned no result");
    return { rootHash: result.rootHash, txHash: result.txHash };
  }

  /** Download by Merkle root. Returns the original byte buffer. */
  async download(rootHash: string): Promise<Uint8Array> {
    if (!/^0x[0-9a-fA-F]+$/.test(rootHash)) throw new Error("rootHash must be 0x hex");
    const dir = mkdtempSync(join(tmpdir(), "compass-vault-"));
    const path = join(dir, "blob");
    try {
      const err = await this.indexer.download(rootHash, path, true);
      if (err) throw new Error(`0G download failed: ${err.message ?? String(err)}`);
      return Uint8Array.from(readFileSync(path));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /** The signer's funded address (for log lines + on-chain mintAgent caller). */
  address(): string {
    return this.signer.address;
  }
}

/**
 * Build a CompassStorage from environment variables. Returns null when any
 * required var is missing — callers can use this to gate integration tests
 * cleanly without failing locally.
 */
export function compassStorageFromEnv(): CompassStorage | null {
  const rpcUrl = process.env.ZG_RPC_URL;
  const indexerUrl = process.env.ZG_INDEXER_URL;
  const privateKeyHex =
    process.env.ZG_STORAGE_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !indexerUrl || !privateKeyHex) return null;
  return new CompassStorage({ rpcUrl, indexerUrl, privateKeyHex });
}
