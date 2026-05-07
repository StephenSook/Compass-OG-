/**
 * Phase 6.1 broker probe — read-only enumeration of live 0G compute
 * providers. NO ledger funding committed. Identifies the canonical
 * TeeML provider that Compass will deploy its receipt-signer image to.
 *
 * Run from enclave/:
 *   set -a && source ../.env && set +a
 *   npx ts-node --files scripts/probe-broker.ts
 */
import { JsonRpcProvider, Wallet } from "ethers";
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

async function main() {
  const rpcUrl = process.env.ZEROG_TESTNET_RPC_URL;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !pk) throw new Error("ZEROG_TESTNET_RPC_URL + DEPLOYER_PRIVATE_KEY required");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(pk, provider);
  console.log(`[probe] RPC:    ${rpcUrl}`);
  console.log(`[probe] Wallet: ${signer.address}`);

  console.log(`[probe] Creating broker (no ledger funding committed)...`);
  const broker = await createZGComputeNetworkBroker(signer);

  console.log(`[probe] Calling broker.inference.listService()...`);
  const services = await broker.inference.listService();
  console.log(`[probe] ${services.length} services discovered`);

  const teeml = services.filter((s) => {
    const v = (s as unknown as { verifiability?: string }).verifiability;
    return v && v.toLowerCase().includes("teeml");
  });
  console.log(`[probe] ${teeml.length} TeeML providers`);

  for (const s of services) {
    console.log(JSON.stringify(s, bigintReplacer, 2));
    console.log("---");
  }

  if (teeml.length > 0) {
    const canonical = teeml[0];
    const out = {
      pinnedAt: new Date().toISOString(),
      provider: (canonical as unknown as { provider: string }).provider,
      url: (canonical as unknown as { url: string }).url,
      model: (canonical as unknown as { model: string }).model,
      serviceType: (canonical as unknown as { serviceType: string }).serviceType,
      verifiability: (canonical as unknown as { verifiability: string }).verifiability,
      inputPrice: ((canonical as unknown as { inputPrice: bigint }).inputPrice).toString(),
      outputPrice: ((canonical as unknown as { outputPrice: bigint }).outputPrice).toString(),
      allServices: services.length,
      teemlServices: teeml.length,
    };
    const outPath = resolve(__dirname, "../../docs/notes/0g-canonical-provider.json");
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`\n[probe] Pinned canonical TeeML provider:`);
    console.log(JSON.stringify(out, null, 2));
    console.log(`[probe] Written to ${outPath}`);
  } else {
    console.warn(`[probe] WARN: no TeeML providers found in listService output`);
  }
}

main().catch((e) => {
  console.error("[probe] FATAL:", e);
  process.exit(1);
});
