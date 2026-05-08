/**
 * Generates a sample receipt + per-receipt quote pair using a fixed dev
 * key + synthesized v4 TDX quote whose report_data binds the receipt's
 * (ethAddress || composeHash || receiptId). The output is bundled at
 * enclave/samples/receipt-sample.json so judges can run verify-receipt
 * --sample without spinning up a Phala CVM.
 *
 * The sample is intentionally divorced from any live deploy — the
 * composeHash here is a fixed test value, not the production value.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { evaluatePolicy } from "../src/policy";
import {
  attestationDigest,
  buildReceiptDocument,
  quoteCommitmentFromQuoteHex,
} from "../src/receipt";
import { deriveEthAddressFromUncompressed } from "../src/eth-address";
import type { CompassPolicy, ClaimSet } from "../src/types";

const SAMPLE_PRIV = Uint8Array.from(
  Buffer.from("1".padStart(64, "0"), "hex"),
);
const SAMPLE_COMPOSE_HASH = "0x" + "ab".repeat(32);
const SAMPLE_RECEIPT_ID = "0x" + "9a".repeat(32);
const SAMPLE_CHALLENGE = "0x" + "9b".repeat(32);
const SAMPLE_AGENT_ID_COMMITMENT = "0x" + "9c".repeat(32);
const SAMPLE_VERIFIER_PUBKEY = "0x" + "9d".repeat(32);
const SAMPLE_CRED_BUNDLE_HASH = "0x" + "9e".repeat(32);
const SAMPLE_POLICY_HASH = "0x" + "9f".repeat(32);

const POLICY: CompassPolicy = {
  policyId: "compass:help-legal-aid",
  version: "1",
  predicate: { claim: "is_FDH_in_HK", equals: true },
  minAnonymitySet: 50,
  expectedVct: "https://compass/vc/help",
  credentialBundleSchema: { required: ["is_FDH_in_HK"], properties: {} },
  trustedIssuers: ["did:key:zMockHELP"],
  policyHashAlgorithm: "sha256",
  policyHashCanonicalization: "RFC8785-JCS",
};

const CLAIMS: ClaimSet = { is_FDH_in_HK: true };

function buildPerReceiptQuote(
  ethAddress: string,
  composeHash: string,
  receiptId: string,
): string {
  const addr = Buffer.from(ethAddress.replace(/^0x/, ""), "hex");
  const cmp = Buffer.from(composeHash.replace(/^0x/, ""), "hex");
  const rid = Buffer.from(receiptId.replace(/^0x/, ""), "hex");
  const input = new Uint8Array(addr.length + cmp.length + rid.length);
  input.set(addr, 0);
  input.set(cmp, addr.length);
  input.set(rid, addr.length + cmp.length);
  const reportDataDigest = sha256(input);
  // Synthesize a v4 TDX quote with our digest right-padded to 64 bytes.
  const quote = new Uint8Array(568 + 64);
  quote[0] = 0x04;
  quote.set(reportDataDigest, 568);
  return "0x" + Buffer.from(quote).toString("hex");
}

function signReceipt(privKey: Uint8Array, digestHex: string): string {
  const digest = Uint8Array.from(Buffer.from(digestHex.replace(/^0x/, ""), "hex"));
  const sig = secp256k1.sign(digest, privKey, { prehash: false, lowS: true });
  return "0x" + Buffer.from(sig).toString("hex");
}

function main() {
  const pub = secp256k1.getPublicKey(SAMPLE_PRIV, false);
  const ethAddress = deriveEthAddressFromUncompressed(pub);

  const evalResult = evaluatePolicy(POLICY, CLAIMS, SAMPLE_POLICY_HASH);
  const perReceiptQuoteHex = buildPerReceiptQuote(
    ethAddress,
    SAMPLE_COMPOSE_HASH,
    SAMPLE_RECEIPT_ID,
  );
  const quoteCommitment = quoteCommitmentFromQuoteHex(perReceiptQuoteHex);

  const receipt = buildReceiptDocument({
    receiptId: SAMPLE_RECEIPT_ID,
    challenge: SAMPLE_CHALLENGE,
    policyHash: SAMPLE_POLICY_HASH,
    agentIdCommitment: SAMPLE_AGENT_ID_COMMITMENT,
    verifierPubKey: SAMPLE_VERIFIER_PUBKEY,
    credentialBundleHash: SAMPLE_CRED_BUNDLE_HASH,
    result: evalResult,
    expiry: 1798761599,
    issuedAt: 1747542720,
    quoteCommitment,
  });
  const digest = attestationDigest(receipt);
  const signature = signReceipt(SAMPLE_PRIV, digest);

  const wrapped = {
    receipt,
    attestationDigest: digest,
    signature,
    signerAddress: ethAddress,
    perReceiptQuoteHex,
    perReceiptEventLog: "",
  };

  const outPath = resolve(__dirname, "../samples/receipt-sample.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(wrapped, null, 2));

  console.log(`[mint-sample] wrote ${outPath}`);
  console.log(`[mint-sample] sample composeHash: ${SAMPLE_COMPOSE_HASH}`);
  console.log(`[mint-sample] sample signer: ${ethAddress}`);
  console.log(
    `[mint-sample] verify with: npx ts-node scripts/verify-receipt.ts --sample --expected-compose ${SAMPLE_COMPOSE_HASH}`,
  );
}

main();
