/**
 * Read-only enumeration of live 0G compute providers. Does not fund the
 * ledger — broker is created purely to call listService(). Output pins the
 * canonical TeeML provider to docs/notes/0g-canonical-provider.json.
 */
import { JsonRpcProvider, Wallet } from "ethers";
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LIST_TIMEOUT_MS = 30_000;

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
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
  const services = await withTimeout(
    broker.inference.listService(),
    LIST_TIMEOUT_MS,
    "listService",
  );
  console.log(`[probe] ${services.length} services discovered`);

  // Filter to TeeML + sort deterministically by provider address so the
  // canonical pin is reproducible across SDK versions / re-runs.
  const teeml = services
    .filter((s) => {
      const v = (s as unknown as { verifiability?: string }).verifiability;
      return v?.toLowerCase() === "teeml";
    })
    .sort((a, b) =>
      ((a as unknown as { provider: string }).provider).localeCompare(
        (b as unknown as { provider: string }).provider,
      ),
    );
  console.log(`[probe] ${teeml.length} TeeML providers (sorted)`);

  for (const s of services) {
    console.log(JSON.stringify(s, bigintReplacer, 2));
    console.log("---");
  }

  if (teeml.length === 0) {
    console.error(
      "[probe] FATAL: zero TeeML providers — refusing to overwrite canonical-provider.json",
    );
    process.exit(2);
  }

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
    alternates: teeml.slice(1).map((s) => (s as unknown as { provider: string }).provider),
  };

  const outPath = resolve(__dirname, "../../docs/notes/0g-canonical-provider.json");
  if (existsSync(outPath)) {
    const prior = JSON.parse(readFileSync(outPath, "utf8"));
    if (prior.provider !== out.provider) {
      console.warn("[probe] canonical provider changed:");
      console.warn(`  was: ${prior.provider}`);
      console.warn(`  now: ${out.provider}`);
      if (!process.argv.includes("--confirm-rotation")) {
        console.error("[probe] refusing to overwrite. Re-run with --confirm-rotation");
        process.exit(3);
      }
    }
  }
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\n[probe] Pinned canonical TeeML provider:`);
  console.log(JSON.stringify(out, null, 2));
  console.log(`[probe] Written to ${outPath}`);
}

main().catch((e) => {
  console.error("[probe] FATAL:", e);
  process.exit(1);
});
