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

  let balance: bigint;
  try {
    balance = await provider.getBalance(signer.address);
  } catch (e: unknown) {
    console.error("[smoke] FATAL (exit 5): RPC unreachable —", JSON.stringify(e, bigintReplacer));
    process.exit(5);
  }
  console.log(`[smoke] Balance: ${balance.toString()} wei`);
  if (balance === 0n) {
    console.error("ERROR: wallet has 0 balance.");
    console.error(`Visit https://faucet.0g.ai/ and fund: ${signer.address}`);
    process.exit(1);
  }

  let broker: any;
  try {
    console.log("[smoke] Creating broker...");
    broker = await createZGComputeNetworkBroker(signer);
  } catch (e: unknown) {
    console.error(
      "[smoke] FATAL (exit 6): broker construction failed —",
      JSON.stringify(e, bigintReplacer),
    );
    console.error(
      "[smoke] Likely causes: SDK version mismatch, contract address drift, or 0G network down.",
    );
    process.exit(6);
  }

  // Tighten the "already exists" matcher per Codex finding 4/silent-failure-hunter
  // finding 2 — broad substring match could swallow unrelated errors like
  // "endpoint exists but unreachable."
  const LEDGER_EXISTS_RE = /ledger.*(already|exist|registered)/i;
  try {
    await broker.ledger.addLedger(0.01);
    console.log("[smoke] Ledger funded with 0.01 A0GI.");
  } catch (e: unknown) {
    const msg = String((e as any)?.message ?? "");
    if (LEDGER_EXISTS_RE.test(msg)) {
      console.log("[smoke] Ledger already exists, skipping addLedger.");
    } else {
      console.error("[smoke] FATAL (exit 3): addLedger failed:", msg || JSON.stringify(e, bigintReplacer));
      console.error(
        "[smoke] If 'insufficient funds', wallet has gas but no deposit balance. Fund more.",
      );
      console.error(
        "[smoke] If 'wrong chain', RPC or chainId mismatch. Verify ZEROG_TESTNET_RPC_URL.",
      );
      process.exit(3);
    }
  }

  let providers: unknown[];
  try {
    console.log("[smoke] Listing providers...");
    providers = await broker.inference.listService();
  } catch (e: unknown) {
    console.error(
      "[smoke] FATAL (exit 7): inference.listService failed —",
      JSON.stringify(e, bigintReplacer),
    );
    process.exit(7);
  }
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
  // could pass the smoke gate otherwise. Per silent-failure-hunter finding 5:
  // SDK shape drift (inputPrice as number not bigint) would throw on bigint
  // comparison. Coerce defensively.
  const toBig = (v: unknown): bigint => {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
    return 0n;
  };
  const teeMlWithPricing = teeMlProviders.filter(
    (p: any) => toBig(p.inputPrice) > 0n && toBig(p.outputPrice) > 0n,
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
