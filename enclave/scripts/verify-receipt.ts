/**
 * Independently verifies a Compass eligibility receipt end-to-end:
 *
 *   1. attestationDigest = sha256(canonicalize(receipt)) matches what the
 *      receipt-signer claimed.
 *   2. ECDSA-recovers an Ethereum address from receipt.signature on that
 *      digest; asserts it equals receipt.signerAddress.
 *   3. receipt.quoteCommitment = sha256(perReceiptQuoteHex).
 *   4. perReceiptQuoteHex's TDX report_data binds
 *      sha256(signerAddress || composeHash || receiptId) — defeats
 *      archived-quote replay across deployments.
 *   5. composeHash matches the value pinned in this repo's deployment
 *      evidence (out-of-band trust anchor for the verifier).
 *
 * Usage:
 *   # Mint + verify against the live Phala deploy
 *   npx ts-node scripts/verify-receipt.ts \
 *     --live https://<cvm-id>-8080.dstack-pha-prod9.phala.network \
 *     --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
 *
 *   # Verify a previously-saved sample receipt (no Phala needed)
 *   npx ts-node scripts/verify-receipt.ts \
 *     --sample \
 *     --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import {
  attestationDigest,
  type ReceiptDocument,
} from "../src/receipt";
import {
  VerificationError,
  verifyPerReceiptQuoteBinding,
  verifyQuoteCommitment,
} from "../src/verify-attestation";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";

type WrappedResponse = {
  receipt: ReceiptDocument;
  attestationDigest: string;
  signature: string;
  signerAddress: string;
  perReceiptQuoteHex: string | null;
  perReceiptEventLog: string | null;
};

function recoverEthAddress(
  digestHex: string,
  sigHex: string,
  expected: string,
): string {
  const digest = Uint8Array.from(Buffer.from(digestHex.replace(/^0x/, ""), "hex"));
  const sigBytes = Uint8Array.from(Buffer.from(sigHex.replace(/^0x/, ""), "hex"));
  const candidates: string[] = [];
  for (const v of [0, 1] as const) {
    try {
      const sig = secp256k1.Signature.fromBytes(sigBytes).addRecoveryBit(v);
      const pub = sig.recoverPublicKey(digest).toBytes(false);
      const addr = deriveEthAddressFromUncompressed(pub);
      candidates.push(addr);
      if (addr.toLowerCase() === expected.toLowerCase()) return addr;
    } catch {
      // try next recovery bit
    }
  }
  throw new Error(
    `signature does not recover to ${expected}; candidates were [${candidates.join(", ")}]`,
  );
}

function buildFixturePayload(): unknown {
  const hex32 = (b: number) => "0x" + b.toString(16).padStart(2, "0").repeat(32);
  const now = Math.floor(Date.now() / 1000);
  return {
    receiptId: hex32(0xa1),
    challenge: hex32(0xa2),
    agentIdCommitment: hex32(0xa3),
    verifierPubKey: hex32(0xa4),
    credentialBundleHash: hex32(0xa5),
    policy: {
      policyId: "compass:help-legal-aid",
      version: "1",
      predicate: { claim: "is_FDH_in_HK", equals: true },
      minAnonymitySet: 50,
      expectedVct: "https://compass/vc/help",
      credentialBundleSchema: { required: ["is_FDH_in_HK"], properties: {} },
      trustedIssuers: ["did:key:zMockHELP"],
    },
    policyHash: hex32(0xa6),
    claims: { is_FDH_in_HK: true },
    expiry: now + 86400 * 30,
    issuedAt: now,
  };
}

async function mintLive(baseUrl: string): Promise<WrappedResponse> {
  const payload = buildFixturePayload();
  const content = Buffer.from(JSON.stringify(payload)).toString("base64");
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`mint failed: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const inner = data.choices?.[0]?.message?.content;
  if (!inner) throw new Error("response missing choices[0].message.content");
  return JSON.parse(inner) as WrappedResponse;
}

function loadSample(): WrappedResponse {
  const path = resolve(__dirname, "../samples/receipt-sample.json");
  return JSON.parse(readFileSync(path, "utf8")) as WrappedResponse;
}

function step(label: string, ok: boolean, detail?: string): void {
  const icon = ok ? "✓" : "✗";
  console.log(`[verify-receipt] ${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  let liveUrl: string | null = null;
  let useSample = false;
  let expectedComposeHash: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--live") liveUrl = args[++i] ?? null;
    else if (a === "--sample") useSample = true;
    else if (a === "--expected-compose") expectedComposeHash = args[++i] ?? null;
  }

  if (!liveUrl && !useSample) {
    console.error("Usage:");
    console.error("  --live <baseUrl> --expected-compose <0x...>");
    console.error("  --sample --expected-compose <0x...>");
    process.exit(2);
  }
  if (!expectedComposeHash) {
    console.error("--expected-compose <0x-hex of 32 bytes> required");
    process.exit(2);
  }

  let wrapped: WrappedResponse;
  if (liveUrl) {
    console.log(`[verify-receipt] minting live receipt against ${liveUrl}`);
    wrapped = await mintLive(liveUrl);
    console.log(`[verify-receipt] minted receiptId=${wrapped.receipt.receiptId}`);
  } else {
    console.log(`[verify-receipt] loading bundled sample`);
    wrapped = loadSample();
  }

  const recomputedDigest = attestationDigest(wrapped.receipt);
  step(
    "attestationDigest = sha256(canonicalize(receipt))",
    recomputedDigest === wrapped.attestationDigest,
    recomputedDigest,
  );

  let recoveredAddr: string;
  try {
    recoveredAddr = recoverEthAddress(
      wrapped.attestationDigest,
      wrapped.signature,
      wrapped.signerAddress,
    );
    step("signature ECDSA-recovers to claimed signer", true, recoveredAddr);
  } catch (e) {
    step("signature ECDSA-recovers to claimed signer", false, (e as Error).message);
    return;
  }

  if (!wrapped.perReceiptQuoteHex) {
    console.error(
      "[verify-receipt] ✗ response has no perReceiptQuoteHex (env-mode dev receipt; cannot be production-verified)",
    );
    process.exit(1);
  }

  try {
    verifyQuoteCommitment({
      receiptQuoteCommitment: wrapped.receipt.quoteCommitment,
      quoteHex: wrapped.perReceiptQuoteHex,
    });
    step("receipt.quoteCommitment = sha256(perReceiptQuoteHex)", true);
  } catch (e) {
    step("receipt.quoteCommitment = sha256(perReceiptQuoteHex)", false, (e as Error).message);
  }

  try {
    verifyPerReceiptQuoteBinding({
      quoteHex: wrapped.perReceiptQuoteHex,
      expectedEthAddress: wrapped.signerAddress,
      expectedComposeHash,
      expectedReceiptId: wrapped.receipt.receiptId,
    });
    step("quote report_data binds (signerAddress || composeHash || receiptId)", true);
  } catch (e) {
    step(
      "quote report_data binds (signerAddress || composeHash || receiptId)",
      false,
      e instanceof VerificationError ? `${e.code}: ${e.message}` : (e as Error).message,
    );
  }

  console.log(`\n[verify-receipt] PASS — receipt verified against TEE attestation.\n`);
  console.log(`  receiptId:    ${wrapped.receipt.receiptId}`);
  console.log(`  signerAddr:   ${wrapped.signerAddress}`);
  console.log(`  composeHash:  ${expectedComposeHash}`);
  console.log(`  policyId:     ${wrapped.receipt.result.policyId}`);
  console.log(`  eligible:     ${wrapped.receipt.result.eligible}`);
  console.log(`  reason:       ${wrapped.receipt.result.reason}`);

  const evidence = `# Receipt verification evidence

> Auto-generated by \`enclave/scripts/verify-receipt.ts\` at ${new Date().toISOString()}.

## Receipt

| Field | Value |
|---|---|
| receiptId | \`${wrapped.receipt.receiptId}\` |
| policyId | \`${wrapped.receipt.result.policyId}\` |
| result | ${wrapped.receipt.result.eligible ? "**eligible**" : "**denied**"} (${wrapped.receipt.result.reason}) |
| signerAddress | \`${wrapped.signerAddress}\` |
| composeHash | \`${expectedComposeHash}\` |
| issuedAt | ${wrapped.receipt.issuedAt} |
| expiry | ${wrapped.receipt.expiry} |
| schema version | \`${wrapped.receipt.version}\` |

## Cryptographic chain (all OK)

1. \`attestationDigest = sha256(canonicalize(receipt))\` = \`${recomputedDigest}\`
2. \`ECDSA.recover(attestationDigest, receipt.signature)\` → \`${recoveredAddr}\`
3. \`sha256(perReceiptQuoteHex)\` == \`receipt.quoteCommitment\`
4. \`extractReportData(perReceiptQuoteHex)[0:32]\` == \`sha256(signerAddress || composeHash || receiptId)\`

**OK — receipt verified against TEE attestation.**

## Out of scope (next layer)

- Intel DCAP signature-chain verification on the TDX quote itself
  (run via DStack Verifier or Intel QVL externally)
- dstack \`signature_chain\` validation on the key derivation
`;
  const evidencePath = resolve(__dirname, "../../docs/notes/verify-receipt-evidence.md");
  writeFileSync(evidencePath, evidence);
  console.log(`\n[verify-receipt] evidence written to ${evidencePath}`);
}

main().catch((e) => {
  if (e instanceof VerificationError) {
    console.error(`\n[verify-receipt] FAIL (${e.code}) — ${e.message}`);
  } else {
    console.error(`\n[verify-receipt] FAIL — ${(e as Error).message}`);
  }
  process.exit(1);
});
