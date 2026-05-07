/**
 * dstack TDX boot helper. Derives an enclave-bound secp256k1 receipt-signer
 * key, then issues a TDX quote whose report_data commits to
 * sha256(ethAddress || composeHash). Returns null when /var/run/dstack.sock
 * is absent so callers can fall back to env-var keys (dev only — server.ts
 * gates this behind COMPASS_FORCE_LOCAL).
 */
import { existsSync } from "node:fs";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { DstackClient } from "@phala/dstack-sdk";
import { deriveEthAddressFromUncompressed } from "./eth-address";
import { verifyReportDataBinding } from "./verify-attestation";

export type AttestedSignerBundle = {
  source: "tee";
  privKey: Uint8Array;
  pubKeyUncompressed: Uint8Array;
  ethAddress: string;
  composeHash: string;
  appId: string;
  instanceId: string;
  reportDataInput: Uint8Array;
  quoteHex: string;
  eventLog: string;
  signatureChain: Uint8Array[];
  boundAt: number;
};

const DEFAULT_SOCK = "/var/run/dstack.sock";
const KEY_PATH = "compass-receipt-signer";

function buildReportDataInput(ethAddress: string, composeHash: string): Uint8Array {
  const addr = Buffer.from(ethAddress.replace(/^0x/, ""), "hex");
  const cmp = Buffer.from(composeHash.replace(/^0x/, ""), "hex");
  if (addr.length !== 20) throw new Error(`eth address must be 20 bytes, got ${addr.length}`);
  if (cmp.length !== 32) throw new Error(`compose hash must be 32 bytes, got ${cmp.length}`);
  const out = new Uint8Array(addr.length + cmp.length);
  out.set(addr, 0);
  out.set(cmp, addr.length);
  return out;
}

export async function tryLoadAttestedSigner(opts?: {
  endpoint?: string;
  socketPath?: string;
}): Promise<AttestedSignerBundle | null> {
  const sockPath = opts?.socketPath ?? DEFAULT_SOCK;
  const endpoint = opts?.endpoint;
  if (!endpoint && !existsSync(sockPath)) return null;

  const client = new DstackClient(endpoint);
  if (!(await client.isReachable())) return null;

  const info = await client.info();
  if (!info.compose_hash) {
    throw new Error("dstack info() returned no compose_hash; refusing TEE boot");
  }
  const composeHash = info.compose_hash.startsWith("0x")
    ? info.compose_hash
    : "0x" + info.compose_hash;

  const keyResp = await client.getKey(KEY_PATH);
  const privKey = keyResp.key;
  if (privKey.length !== 32) {
    throw new Error(`dstack getKey returned ${privKey.length}-byte key, expected 32`);
  }
  if (!keyResp.signature_chain || keyResp.signature_chain.length === 0) {
    throw new Error("dstack returned empty signature_chain; cannot prove key authenticity");
  }
  const pubKeyUncompressed = secp256k1.getPublicKey(privKey, false);
  const ethAddress = deriveEthAddressFromUncompressed(pubKeyUncompressed);

  const reportDataInput = buildReportDataInput(ethAddress, composeHash);
  // SDK v0.5+ does not auto-hash; we hand getQuote a 32-byte commitment.
  const reportDataHash = sha256(reportDataInput);
  const quoteResp = await client.getQuote(reportDataHash);

  if (typeof quoteResp.quote !== "string" || quoteResp.quote.length < 100) {
    throw new Error(`dstack getQuote returned malformed quote: ${quoteResp.quote?.slice(0, 32)}...`);
  }

  // Self-verify: if dstack/driver behavior diverges from our verifier
  // (version/offset/padding), fail at boot rather than at receipt-mint time.
  verifyReportDataBinding({
    quoteHex: quoteResp.quote,
    expectedEthAddress: ethAddress,
    expectedComposeHash: composeHash,
  });

  return {
    source: "tee",
    privKey,
    pubKeyUncompressed,
    ethAddress,
    composeHash,
    appId: info.app_id,
    instanceId: info.instance_id,
    reportDataInput,
    quoteHex: quoteResp.quote,
    eventLog: quoteResp.event_log,
    signatureChain: keyResp.signature_chain,
    boundAt: Math.floor(Date.now() / 1000),
  };
}

export const __testing = { buildReportDataInput };
