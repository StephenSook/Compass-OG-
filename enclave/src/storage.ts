import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspect } from "node:util";
import { Wallet, JsonRpcProvider } from "ethers";
// Bare specifier resolves at runtime via vitest.config.ts's
// `resolve.conditions: [require, node]` and at the type level via the
// ambient redirect at src/types/0g-ts-sdk.d.ts. Both halves required —
// SDK ships only an "exports" map.
import { Indexer, MemData, defaultUploadOption } from "@0glabs/0g-ts-sdk";

const ROOT_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export type StorageConfig = {
  /** 0G Storage chain RPC (e.g. Galileo: https://evmrpc-testnet.0g.ai). */
  rpcUrl: string;
  /** Indexer service URL (e.g. https://indexer-storage-testnet-turbo.0g.ai). */
  indexerUrl: string;
  /** 0x-prefixed hex private key. Funded with testnet OG. */
  privateKeyHex: string;
};

export type UploadResult = {
  rootHash: string;
  txHash: string;
};

function sdkErrorMessage(err: Error): string {
  const name = err.constructor.name;
  return err.message ? `${name}: ${err.message}` : name;
}

export class CompassStorage {
  private readonly indexer: Indexer;
  private readonly signer: Wallet;
  private readonly rpcUrl: string;

  constructor(config: StorageConfig) {
    this.indexer = new Indexer(config.indexerUrl);
    const provider = new JsonRpcProvider(config.rpcUrl);
    this.signer = new Wallet(config.privateKeyHex, provider);
    this.rpcUrl = config.rpcUrl;
  }

  [inspect.custom](): string {
    return `CompassStorage { signer: ${this.signer.address}, rpcUrl: ${this.rpcUrl} }`;
  }

  async upload(bytes: Uint8Array, opts?: { fee?: bigint }): Promise<UploadResult> {
    if (bytes.length === 0) throw new Error("cannot upload empty buffer");
    if (opts?.fee !== undefined && opts.fee < 0n) {
      throw new Error(`fee must be >= 0n, got ${opts.fee}`);
    }
    const file = new MemData(bytes);
    // Always spread — never alias the SDK singleton so a future SDK mutation
    // of defaultUploadOption can't leak across uploads.
    const uploadOpts = { ...defaultUploadOption, ...(opts?.fee !== undefined && { fee: opts.fee }) };
    const [result, err] = await this.indexer.upload(
      file,
      this.rpcUrl,
      this.signer,
      uploadOpts,
    );
    if (err) throw new Error(`0G upload failed: ${sdkErrorMessage(err)}`, { cause: err });
    return { rootHash: result.rootHash, txHash: result.txHash };
  }

  async download(rootHash: string): Promise<Uint8Array> {
    if (!ROOT_HASH_RE.test(rootHash)) {
      throw new Error(`rootHash must be 0x + 64 hex chars, got ${rootHash}`);
    }
    const dir = mkdtempSync(join(tmpdir(), "compass-vault-"));
    const path = join(dir, "blob");
    try {
      const err = await this.indexer.download(rootHash, path, true);
      if (err) {
        throw new Error(
          `0G download failed for ${rootHash}: ${sdkErrorMessage(err)}`,
          { cause: err },
        );
      }
      const bytes = Uint8Array.from(readFileSync(path));
      if (bytes.length === 0) {
        throw new Error(`0G download returned 0 bytes for ${rootHash}`);
      }
      return bytes;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  address(): string {
    return this.signer.address;
  }
}

/** Returns null when any required env var is missing — env-gates integration tests. */
export function compassStorageFromEnv(): CompassStorage | null {
  const rpcUrl = process.env.ZG_RPC_URL;
  const indexerUrl = process.env.ZG_INDEXER_URL;
  let privateKeyHex = process.env.ZG_STORAGE_PRIVATE_KEY;
  if (!privateKeyHex && process.env.DEPLOYER_PRIVATE_KEY) {
    // Co-mingles deploy + storage signers — flag loudly so production catches it.
    console.warn(
      "[storage] ZG_STORAGE_PRIVATE_KEY not set, falling back to DEPLOYER_PRIVATE_KEY",
    );
    privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  }
  if (!rpcUrl || !indexerUrl || !privateKeyHex) return null;
  return new CompassStorage({ rpcUrl, indexerUrl, privateKeyHex });
}
