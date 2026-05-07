/**
 * Minimal repro for 0G Compute SDK 2.0.0 broken on Galileo V3.
 *
 * Run: COMPASS_LIVE_STORAGE=0 \
 *      DEPLOYER_PRIVATE_KEY=0x... \
 *      ZEROG_TESTNET_RPC_URL=https://evmrpc-testnet.0g.ai \
 *      npx ts-node scripts/repro-compute-sdk.ts
 *
 * Expected output: BAD_DATA on getLedger(address) decode because the
 * SDK-hardcoded ledgerCA 0x0c0D02e4...c53e7 has empty bytecode on V3.
 */
import { JsonRpcProvider, Wallet } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

async function main() {
  const rpcUrl = process.env.ZEROG_TESTNET_RPC_URL!;
  const pk = process.env.DEPLOYER_PRIVATE_KEY!;
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(pk, provider);

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Wallet: ${signer.address}`);

  // SDK 2.0.0 default CAs (broker.js:createZGComputeNetworkBroker):
  //   ledgerCA      0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7
  //   inferenceCA   0x46e8a02d609CaEfC1747197da1F38272d5E46c77
  //   fineTuningCA  0x35A5d96569867fE6534D823268337888229533dE
  // Direct eth_getCode confirms all three return 0x on V3.
  for (const addr of [
    "0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7",
    "0x46e8a02d609CaEfC1747197da1F38272d5E46c77",
    "0x35A5d96569867fE6534D823268337888229533dE",
  ]) {
    const code = await provider.getCode(addr);
    console.log(`  eth_getCode(${addr}) = ${code === "0x" ? "0x (EMPTY)" : `${code.length} chars`}`);
  }

  const broker = await createZGComputeNetworkBroker(signer);
  console.log("Calling broker.ledger.addLedger('0.01')...");
  await broker.ledger.addLedger("0.01");
  console.log("Unexpected success");
}

main().catch((e) => {
  console.error("REPRO FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
