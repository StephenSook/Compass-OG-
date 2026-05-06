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

// JSON.stringify replacer for bigint (Codex finding 2 — raw provider JSON
// contains bigint fields that crash default stringify).
function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function writeNotes(
  notesDir: string,
  walletAddress: string,
  rpcUrl: string,
  balance: bigint,
  providers: unknown[],
  sample: unknown[],
  passed: boolean,
): void {
  fs.mkdirSync(notesDir, { recursive: true });
  const notesPath = path.join(notesDir, "0g-tee-smoke.md");
  const timestamp = new Date().toISOString();
  const verdict = passed ? "PASSED" : "FAILED";
  const content = `# 0G Broker Smoke Test Result

**Run at:** ${timestamp}
**Wallet:** ${walletAddress}
**RPC:** ${rpcUrl}
**Balance (wei):** ${balance.toString()}
**Provider count:** ${providers.length}
**Verdict:** ${verdict}

## First 3 providers

\`\`\`json
${JSON.stringify(sample, bigintReplacer, 2)}
\`\`\`

## All providers (raw)

\`\`\`json
${JSON.stringify(providers, bigintReplacer, 2)}
\`\`\`
`;
  fs.writeFileSync(notesPath, content);
  console.log(`[smoke] Wrote ${notesPath} (${verdict})`);
}

async function main() {
  console.log(`[smoke] RPC: ${RPC_URL}`);

  const provider = new JsonRpcProvider(RPC_URL);
  const signer = new Wallet(PRIVATE_KEY!, provider);
  console.log(`[smoke] Wallet: ${signer.address}`);

  const notesDir = path.resolve(__dirname, "../../docs/notes");

  const balance = await provider.getBalance(signer.address);
  console.log(`[smoke] Balance: ${balance.toString()} wei`);
  if (balance === 0n) {
    console.error("ERROR: wallet has 0 balance.");
    console.error(`Visit https://faucet.0g.ai/ and fund: ${signer.address}`);
    process.exit(1);
  }

  console.log("[smoke] Creating broker...");
  const broker = await createZGComputeNetworkBroker(signer);

  // addLedger expects a number, not a string (per @0glabs/0g-serving-broker types).
  // Per Codex review: ledger setup failure is FATAL unless the error confidently
  // says "already exists" — non-fatal swallowing masks real broker/wallet/chain
  // misconfigurations.
  try {
    await broker.ledger.addLedger(0.01);
    console.log("[smoke] Ledger funded with 0.01 A0GI.");
  } catch (e: any) {
    const msg = String(e?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("exists")) {
      console.log("[smoke] Ledger already exists, skipping addLedger.");
    } else {
      console.error("[smoke] FATAL: addLedger failed:", e?.message ?? e);
      console.error(
        "[smoke] If 'insufficient funds', wallet has gas but no balance to deposit. Fund more.",
      );
      console.error(
        "[smoke] If 'wrong chain', RPC or chainId mismatch. Verify ZEROG_TESTNET_RPC_URL.",
      );
      process.exit(3);
    }
  }

  console.log("[smoke] Listing providers...");
  const providers = await broker.inference.listService();
  console.log(`[smoke] Found ${providers.length} provider(s).`);

  // ServiceStructOutput shape (verified from @0glabs/0g-serving-broker types):
  // { provider, serviceType, url, inputPrice (bigint), outputPrice (bigint), updatedAt (bigint), model, verifiability }
  const sample = providers.slice(0, 3).map((p: any) => ({
    provider: p.provider,
    serviceType: p.serviceType,
    url: p.url,
    model: p.model,
    verifiability: p.verifiability,
    inputPrice: p.inputPrice?.toString?.() ?? p.inputPrice,
    outputPrice: p.outputPrice?.toString?.() ?? p.outputPrice,
    updatedAt: p.updatedAt?.toString?.() ?? p.updatedAt,
  }));

  // Identify TeeML providers — Plan B requires verifiable TEE-attested inference.
  // Per Codex review: serviceType/verifiability shape may vary (string, enum, bytes).
  // Dump unique values so the operator can confirm the canonical TeeML marker.
  const uniqueServiceTypes = [
    ...new Set(providers.map((p: any) => String(p.serviceType))),
  ];
  const uniqueVerifiability = [
    ...new Set(providers.map((p: any) => String(p.verifiability))),
  ];
  console.log("[smoke] Unique serviceType values:", uniqueServiceTypes);
  console.log("[smoke] Unique verifiability values:", uniqueVerifiability);

  const teeMlProviders = providers.filter((p: any) => {
    const st = String(p.serviceType ?? "").toLowerCase();
    const vf = String(p.verifiability ?? "").toLowerCase();
    return st.includes("teeml") || vf.includes("tee") || vf.includes("teeml");
  });
  console.log(`[smoke] Found ${teeMlProviders.length} TeeML / TEE-attested provider(s).`);

  // Per Codex review: validate non-zero pricing — a free/dead/malformed provider
  // could pass the smoke gate otherwise.
  const teeMlWithPricing = teeMlProviders.filter(
    (p: any) => (p.inputPrice ?? 0n) > 0n && (p.outputPrice ?? 0n) > 0n,
  );
  console.log(
    `[smoke] TeeML providers with non-zero input+output pricing: ${teeMlWithPricing.length}`,
  );

  if (teeMlWithPricing.length === 0) {
    console.error(
      "[smoke] FATAL: zero TeeML providers with non-zero pricing. Day-1 gate FAILED.",
    );
    console.error(
      "[smoke] Expected at least 1 TEE-attested provider with active pricing. Pivot Day 2 to Phala/Oasis/Nitro or abort.",
    );
    writeNotes(notesDir, signer.address, RPC_URL, balance, providers, sample, false);
    process.exit(4);
  }

  console.log("[smoke] First 3 providers:");
  console.log(JSON.stringify(sample, bigintReplacer, 2));

  writeNotes(notesDir, signer.address, RPC_URL, balance, providers, sample, true);
  console.log("[smoke] OK — broker reachable, TeeML providers verified.");
  console.log(
    "[smoke] Phase 1.10 PASSED. Now pin one as canonical in docs/notes/0g-provider-canonical.md (Phase 6a.1).",
  );
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err);
  process.exit(2);
});
