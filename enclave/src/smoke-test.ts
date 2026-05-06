/**
 * Phase 1.10 — 0G broker smoke test.
 *
 * CRITICAL Day-1 gate per Ultraplan B3. Validates the entire 0G TEE architecture
 * works end-to-end. If this fails, pivot to Phala/Oasis/Nitro Day 2 or abort.
 *
 * Prerequisites:
 *   - DEPLOYER_PRIVATE_KEY set in ../.env
 *   - Wallet funded with testnet OG via https://faucet.0g.ai/
 *
 * Run: `npx ts-node src/smoke-test.ts`
 *
 * Expected output: at least 1 TeeML provider listed with non-zero pricing.
 * Saves results to ../docs/notes/0g-tee-smoke.md per Phase 1.10.
 */
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { JsonRpcProvider, Wallet } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const RPC_URL =
  process.env.ZEROG_TESTNET_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY || PRIVATE_KEY.startsWith("0x_")) {
  console.error("ERROR: DEPLOYER_PRIVATE_KEY not set in .env");
  console.error("Run first: npx ts-node src/generate-wallet.ts");
  process.exit(1);
}

async function main() {
  console.log(`[smoke] RPC: ${RPC_URL}`);

  const provider = new JsonRpcProvider(RPC_URL);
  const signer = new Wallet(PRIVATE_KEY!, provider);
  console.log(`[smoke] Wallet: ${signer.address}`);

  const balance = await provider.getBalance(signer.address);
  console.log(`[smoke] Balance: ${balance.toString()} wei`);
  if (balance === 0n) {
    console.error("ERROR: wallet has 0 balance.");
    console.error(`Visit https://faucet.0g.ai/ and fund: ${signer.address}`);
    process.exit(1);
  }

  console.log("[smoke] Creating broker...");
  const broker = await createZGComputeNetworkBroker(signer);

  console.log("[smoke] Listing providers...");
  const providers = await broker.inference.listService();
  console.log(`[smoke] Found ${providers.length} provider(s).`);

  const sample = providers.slice(0, 3).map((p: any) => ({
    address: p.provider ?? p.address,
    model: p.model ?? p.name,
    inputPrice: p.inputPrice?.toString?.() ?? p.inputPrice,
    outputPrice: p.outputPrice?.toString?.() ?? p.outputPrice,
    serviceType: p.serviceType ?? p.type,
    verifiability: p.verifiability,
    url: p.url,
  }));

  console.log("[smoke] First 3 providers:");
  console.log(JSON.stringify(sample, null, 2));

  // Save to docs/notes/0g-tee-smoke.md per Phase 1.10
  const notesDir = path.resolve(__dirname, "../../docs/notes");
  fs.mkdirSync(notesDir, { recursive: true });
  const notesPath = path.join(notesDir, "0g-tee-smoke.md");
  const timestamp = new Date().toISOString();
  const content = `# 0G Broker Smoke Test Result

**Run at:** ${timestamp}
**Wallet:** ${signer.address}
**RPC:** ${RPC_URL}
**Balance (wei):** ${balance.toString()}
**Provider count:** ${providers.length}

## First 3 providers

\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`

## All providers (raw)

\`\`\`json
${JSON.stringify(providers, null, 2)}
\`\`\`
`;
  fs.writeFileSync(notesPath, content);
  console.log(`[smoke] Wrote ${notesPath}`);
  console.log("[smoke] OK — broker reachable, providers enumerated.");
  console.log(
    "[smoke] Phase 1.10 PASSED. Now pin one as canonical in docs/notes/0g-provider-canonical.md (Phase 6a.1).",
  );
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err);
  process.exit(2);
});
