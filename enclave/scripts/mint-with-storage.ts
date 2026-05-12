/**
 * Phase 5.6 — encrypt fixture credential bundle, upload to 0G Storage,
 * mint AgentRegistry INFT with the storage rootHash as encryptedURI.
 *
 * Required env (auto-loaded from repo-root .env):
 *   ZEROG_TESTNET_RPC_URL    — Galileo RPC
 *   DEPLOYER_PRIVATE_KEY     — funded testnet wallet
 *   COMPASS_VAULT_PASSPHRASE — vault encryption passphrase (hard-required)
 *   ZG_INDEXER_URL           — optional, defaults to testnet-turbo
 *   COMPASS_LIVE_STORAGE     — "1" enables live 0G Storage upload, default "0"
 *
 * Run from /enclave: `npx ts-node --files scripts/mint-with-storage.ts`
 */
import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspect } from "node:util";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  type InterfaceAbi,
  type Log,
  type LogDescription,
} from "ethers";
import { encryptVault, serializeVault } from "../src/crypto";
import { CompassStorage } from "../src/storage";

const repoRoot = resolve(__dirname, "../..");
loadEnv({ path: resolve(repoRoot, ".env") });

const DEFAULT_INDEXER = "https://indexer-storage-testnet-turbo.0g.ai";
const PLACEHOLDER_ROOT_HASH =
  "0x" + "70".repeat(32); // distinct from any sha256(wire) — "p" = 0x70 repeated

function hexlify(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

function readDeployments(): { chainId: number; agentRegistry: string } {
  const path = resolve(repoRoot, "docs/deployments/og_galileo.json");
  if (!existsSync(path)) {
    throw new Error(
      `Deployment manifest not found at ${path}. Run contracts/scripts/deploy/deploy.ts first.`,
    );
  }
  let parsed: { chainId?: number; contracts?: { AgentRegistry?: string } };
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`Deployment manifest at ${path} is not valid JSON`, { cause: e as Error });
  }
  const agentRegistry = parsed.contracts?.AgentRegistry;
  if (!agentRegistry) {
    throw new Error(`Deployment manifest missing contracts.AgentRegistry: ${path}`);
  }
  if (typeof parsed.chainId !== "number") {
    throw new Error(`Deployment manifest missing chainId: ${path}`);
  }
  return { chainId: parsed.chainId, agentRegistry };
}

function loadAgentRegistryAbi(): InterfaceAbi {
  const artifact = JSON.parse(
    readFileSync(
      resolve(repoRoot, "contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json"),
      "utf8",
    ),
  ) as { abi: InterfaceAbi };
  return artifact.abi;
}

async function main() {
  const liveStorageRaw = process.env.COMPASS_LIVE_STORAGE ?? "0";
  if (liveStorageRaw !== "0" && liveStorageRaw !== "1") {
    throw new Error(`COMPASS_LIVE_STORAGE must be "0" or "1", got ${JSON.stringify(liveStorageRaw)}`);
  }
  const liveStorage = liveStorageRaw === "1";

  const passphrase = process.env.COMPASS_VAULT_PASSPHRASE;
  if (!passphrase) {
    throw new Error(
      "COMPASS_VAULT_PASSPHRASE is required. Set it in .env (do NOT use a public default).",
    );
  }

  const rpcUrl = process.env.ZEROG_TESTNET_RPC_URL;
  const indexerUrl = process.env.ZG_INDEXER_URL ?? DEFAULT_INDEXER;
  const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !privateKeyHex) {
    throw new Error("ZEROG_TESTNET_RPC_URL + DEPLOYER_PRIVATE_KEY required");
  }

  const deployments = readDeployments();
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== deployments.chainId) {
    throw new Error(
      `RPC chainId ${network.chainId} != deployment manifest chainId ${deployments.chainId}`,
    );
  }
  const wallet = new Wallet(privateKeyHex, provider);
  const agentRegistry = new Contract(deployments.agentRegistry, loadAgentRegistryAbi(), wallet);

  console.log(`Deployer:        ${wallet.address}`);
  console.log(`AgentRegistry:   ${deployments.agentRegistry}`);
  console.log(`Indexer:         ${indexerUrl}${process.env.ZG_INDEXER_URL ? "" : " (default)"}`);
  console.log(`Live storage:    ${liveStorage ? "ON" : "OFF (placeholder rootHash)"}`);

  const credentialBundle = JSON.stringify({
    issuer: "compass-fixture-help-legal-aid",
    subject: "did:key:z-maria-fixture",
    vct: "compass:help-legal-aid",
    is_FDH_in_HK: true,
    has_pending_case: true,
    employment_active: true,
    residency: "HK",
  });
  const plaintext = new TextEncoder().encode(credentialBundle);
  const aad = new TextEncoder().encode(`agent:owner:${wallet.address.toLowerCase()}`);

  console.log(`\n[1/3] Encrypting credential bundle (${plaintext.length} bytes)...`);
  const blob = encryptVault({ plaintext, passphrase, aad });
  const wire = serializeVault(blob);
  const metadataHash = hexlify(sha256(wire));
  console.log(`  ciphertext+wire: ${wire.length} bytes`);
  console.log(`  metadataHash:    ${metadataHash}`);

  console.log(`\n[2/3] 0G Storage upload...`);
  let rootHash: string;
  let storageTxHash: string | null;
  if (liveStorage) {
    const storage = new CompassStorage({ rpcUrl, indexerUrl, privateKeyHex });
    const result = await storage.upload(wire, { fee: 1_000_000_000_000_000n });
    rootHash = result.rootHash;
    storageTxHash = result.txHash;
    console.log(`  rootHash:        ${rootHash}`);
    console.log(`  storage tx:      ${storageTxHash}`);
  } else {
    rootHash = PLACEHOLDER_ROOT_HASH;
    storageTxHash = null;
    console.log(`  SKIPPED — set COMPASS_LIVE_STORAGE=1 to upload live`);
    console.log(`  placeholder rootHash: ${rootHash}`);
  }

  console.log(`\n[3/3] Minting AgentRegistry INFT...`);
  const encryptedURI = liveStorage ? `0g://${rootHash}` : "compass-skipped://placeholder";
  const tx = await agentRegistry.mintAgent(metadataHash, encryptedURI, wallet.address, ZeroHash);
  const receipt = await tx.wait();
  if (!receipt) throw new Error(`mint tx ${tx.hash} returned null receipt`);
  if (receipt.status !== 1) {
    throw new Error(`mint tx reverted: ${tx.hash} (status=${receipt.status})`);
  }
  console.log(`  mint tx:         ${receipt.hash}`);

  const parsed = receipt.logs
    .map((l: Log): LogDescription | null => {
      try {
        return agentRegistry.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((p: LogDescription | null) => p?.name === "AgentMinted");
  if (!parsed) {
    throw new Error(
      `mint tx ${receipt.hash} succeeded but no AgentMinted event found — ABI drift?`,
    );
  }
  const tokenId = parsed.args.tokenId as bigint;
  console.log(`  tokenId:         ${tokenId.toString()}`);
  console.log(`  encryptedURI:    ${encryptedURI}`);

  console.log(`\nPhase 5.6 complete.`);
  console.log(`Verify on chain:  https://chainscan-galileo.0g.ai/tx/${receipt.hash}`);
}

main().catch((e) => {
  console.error(inspect(e, { depth: null, colors: false }));
  process.exit(1);
});
