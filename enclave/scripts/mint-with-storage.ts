/**
 * Phase 5.6 — encrypt fixture credential bundle, upload to 0G Storage,
 * mint AgentRegistry INFT with the storage rootHash as encryptedURI.
 *
 * Required env (sourced from repo-root .env):
 *   ZEROG_TESTNET_RPC_URL  — Galileo RPC
 *   ZG_INDEXER_URL         — 0G Storage indexer (default: testnet-turbo)
 *   DEPLOYER_PRIVATE_KEY   — funded testnet wallet
 *
 * Run from /enclave: `npx ts-node scripts/mint-with-storage.ts`
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sha256 } from "@noble/hashes/sha2.js";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { encryptVault, serializeVault } from "../src/crypto";
import { CompassStorage } from "../src/storage";

const DEFAULT_INDEXER = "https://indexer-storage-testnet-turbo.0g.ai";

const AGENT_REGISTRY_ABI = [
  "function mintAgent(bytes32 metadataHash, string calldata encryptedURI, address attestor, bytes32 trustListRoot) external returns (uint256 tokenId)",
  "event AgentMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataHash, string encryptedURI, address attestor, bytes32 trustListRoot)",
];

function hexlify(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

async function main() {
  const repoRoot = resolve(__dirname, "../..");
  const deployments = JSON.parse(
    readFileSync(resolve(repoRoot, "docs/deployments/og_galileo.json"), "utf8"),
  );
  const agentRegistryAddr = deployments.contracts.AgentRegistry as string;

  const rpcUrl = process.env.ZEROG_TESTNET_RPC_URL;
  const indexerUrl = process.env.ZG_INDEXER_URL ?? DEFAULT_INDEXER;
  const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !privateKeyHex) {
    throw new Error("ZEROG_TESTNET_RPC_URL + DEPLOYER_PRIVATE_KEY required");
  }

  const storage = new CompassStorage({ rpcUrl, indexerUrl, privateKeyHex });
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKeyHex, provider);
  const agentRegistry = new Contract(agentRegistryAddr, AGENT_REGISTRY_ABI, wallet);

  console.log(`Deployer:       ${wallet.address}`);
  console.log(`AgentRegistry:  ${agentRegistryAddr}`);

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
  const passphrase = process.env.COMPASS_VAULT_PASSPHRASE ?? "compass-fixture-passphrase-DEV-ONLY";
  const aad = new TextEncoder().encode(`agent:owner:${wallet.address.toLowerCase()}`);

  console.log(`\n[1/3] Encrypting credential bundle (${plaintext.length} bytes)...`);
  const blob = encryptVault({ plaintext, passphrase, aad });
  const wire = serializeVault(blob);
  const metadataHash = hexlify(sha256(wire));
  console.log(`  ciphertext+wire: ${wire.length} bytes`);
  console.log(`  metadataHash:    ${metadataHash}`);

  console.log(`\n[2/3] 0G Storage upload...`);
  let rootHash: string;
  let storageTxHash: string;
  if (process.env.COMPASS_LIVE_STORAGE === "1") {
    const result = await storage.upload(wire, { fee: 1_000_000_000_000_000n });
    rootHash = result.rootHash;
    storageTxHash = result.txHash;
    console.log(`  indexer:         ${indexerUrl}`);
    console.log(`  rootHash:        ${rootHash}`);
    console.log(`  storage tx:      ${storageTxHash}`);
  } else {
    rootHash = hexlify(sha256(wire));
    storageTxHash = "0xskipped-set-COMPASS_LIVE_STORAGE=1-to-enable";
    console.log(`  SKIPPED — set COMPASS_LIVE_STORAGE=1 to upload live`);
    console.log(`  placeholder rootHash: ${rootHash}`);
  }

  console.log(`\n[3/3] Minting AgentRegistry INFT...`);
  const encryptedURI = `0g://${rootHash}`;
  const attestor = wallet.address;
  const trustListRoot =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const tx = await agentRegistry.mintAgent(metadataHash, encryptedURI, attestor, trustListRoot);
  const receipt = await tx.wait();
  console.log(`  mint tx:         ${receipt.hash}`);
  const minted = receipt.logs.find((l: { fragment?: { name: string } }) =>
    l.fragment?.name === "AgentMinted",
  );
  const tokenId = minted ? (minted as unknown as { args: { tokenId: bigint } }).args.tokenId : null;
  console.log(`  tokenId:         ${tokenId?.toString() ?? "unknown"}`);
  console.log(`  encryptedURI:    ${encryptedURI}`);

  console.log(`\nPhase 5.6 complete.`);
  console.log(`Verify on chain:  https://chainscan-galileo.0g.ai/tx/${receipt.hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
