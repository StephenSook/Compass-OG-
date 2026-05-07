/**
 * Minimal repro for 0G Storage SDK Flow.submit revert on Galileo V3.
 *
 * Run: DEPLOYER_PRIVATE_KEY=0x... \
 *      ZEROG_TESTNET_RPC_URL=https://evmrpc-testnet.0g.ai \
 *      ZG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai \
 *      npx ts-node scripts/repro-storage-sdk.ts
 *
 * First attempt: SDK calculatePrice fee — reverts at estimateGas, no tx.
 * Second attempt: explicit gasLimit override + 0.001 OG fee — forces a
 * real tx to land. Captures the revert tx hash for support.
 */
import { JsonRpcProvider, Wallet, Contract, parseEther } from "ethers";
import { Indexer, MemData, defaultUploadOption } from "@0gfoundation/0g-storage-ts-sdk";

const FLOW_CA = "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296";
const FLOW_ABI = [
  "function submit(tuple(uint256 length, bytes tags, tuple(bytes32 root, uint256 height)[] nodes) submission) payable returns (uint256)",
  "function market() view returns (address)",
  "function paused() view returns (bool)",
];

async function main() {
  const rpcUrl = process.env.ZEROG_TESTNET_RPC_URL!;
  const indexerUrl = process.env.ZG_INDEXER_URL!;
  const pk = process.env.DEPLOYER_PRIVATE_KEY!;
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(pk, provider);

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Indexer: ${indexerUrl}`);
  console.log(`Wallet: ${signer.address}`);
  console.log(`Flow CA: ${FLOW_CA}`);

  const flow = new Contract(FLOW_CA, FLOW_ABI, signer);
  console.log(`Flow.market(): ${await flow.market()}`);
  console.log(`Flow.paused(): ${await flow.paused()}`);

  // Build a small file via the SDK to get a valid Merkle root + submission.
  const bytes = new Uint8Array(241).fill(0x55);
  const file = new MemData(bytes);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr || !tree) throw new Error(`merkleTree failed: ${treeErr?.message}`);
  console.log(`rootHash: ${tree.rootHash()}`);

  const [submission, subErr] = await file.createSubmission("0x");
  if (subErr || !submission) throw new Error(`createSubmission failed: ${subErr?.message}`);

  // Force submission with explicit gasLimit + generous fee — this lets the
  // tx land on-chain so the revert produces a hash for the support team.
  console.log("\nForcing Flow.submit with gasLimit=1_000_000 + value=0.001 OG...");
  try {
    const tx = await flow.submit(submission, {
      value: parseEther("0.001"),
      gasLimit: 1_000_000n,
    });
    console.log(`tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`status: ${receipt?.status} (1 = success, 0 = reverted)`);
    if (receipt?.status === 0) {
      console.log(`REVERTED on-chain — share this hash with 0G support: ${tx.hash}`);
    }
  } catch (e) {
    console.error(`submit failed: ${e instanceof Error ? e.message : e}`);
  }

  // Also exercise the SDK path so they can confirm the higher-level failure.
  console.log("\nNow attempting Indexer.upload (SDK path) — will revert at estimateGas:");
  const indexer = new Indexer(indexerUrl);
  const [result, err] = await indexer.upload(
    new MemData(bytes),
    rpcUrl,
    signer,
    defaultUploadOption,
  );
  if (err) console.error(`SDK upload err: ${err.message}`);
  else console.log(`SDK upload OK: ${JSON.stringify(result)}`);
}

main().catch((e) => {
  console.error("REPRO FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
