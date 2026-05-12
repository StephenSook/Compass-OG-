/**
 * dstack TDX boot helper. Derives an enclave-bound secp256k1 receipt-signer
 * key, requests a boot-time quote (informational, served from /v1/attestation),
 * and exposes requestPerReceiptQuote() for fresh per-request binding to a
 * specific receiptId. Returns null when /var/run/dstack.sock is absent.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { DstackClient } from "@phala/dstack-sdk";
import { deriveEthAddressFromUncompressed } from "./eth-address";
import { verifyPerReceiptQuoteBinding, verifyReportDataBinding } from "./verify-attestation";

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
  /**
   * Issues a fresh quote whose report_data commits to
   * sha256(ethAddress || composeHash || receiptId). Used per-receipt so a
   * verifier can prove the quote was current AT signing time, not just an
   * archived boot quote being replayed.
   */
  requestPerReceiptQuote: (receiptId: string) => Promise<{ quoteHex: string; eventLog: string }>;
};

const DEFAULT_SOCK = "/var/run/dstack.sock";
const KEY_PATH = "compass-receipt-signer";

function bootReportDataInput(ethAddress: string, composeHash: string): Uint8Array {
  const addr = Buffer.from(ethAddress.replace(/^0x/, ""), "hex");
  const cmp = Buffer.from(composeHash.replace(/^0x/, ""), "hex");
  if (addr.length !== 20) throw new Error(`eth address must be 20 bytes, got ${addr.length}`);
  if (cmp.length !== 32) throw new Error(`compose hash must be 32 bytes, got ${cmp.length}`);
  const out = new Uint8Array(addr.length + cmp.length);
  out.set(addr, 0);
  out.set(cmp, addr.length);
  return out;
}

export function buildPerReceiptReportDataInput(
  ethAddress: string,
  composeHash: string,
  receiptId: string,
): Uint8Array {
  const addr = Buffer.from(ethAddress.replace(/^0x/, ""), "hex");
  const cmp = Buffer.from(composeHash.replace(/^0x/, ""), "hex");
  const rid = Buffer.from(receiptId.replace(/^0x/, ""), "hex");
  if (addr.length !== 20) throw new Error(`eth address must be 20 bytes, got ${addr.length}`);
  if (cmp.length !== 32) throw new Error(`compose hash must be 32 bytes, got ${cmp.length}`);
  if (rid.length !== 32) throw new Error(`receiptId must be 32 bytes, got ${rid.length}`);
  const out = new Uint8Array(addr.length + cmp.length + rid.length);
  out.set(addr, 0);
  out.set(cmp, addr.length);
  out.set(rid, addr.length + cmp.length);
  return out;
}

export async function tryLoadAttestedSigner(opts?: {
  endpoint?: string;
  socketPath?: string;
}): Promise<AttestedSignerBundle | null> {
  const sockPath = opts?.socketPath ?? DEFAULT_SOCK;
  const endpoint = opts?.endpoint;

  if (!endpoint) {
    const exists = existsSync(sockPath);
    if (!exists) {
      try {
        const dir = readdirSync("/var/run");
        console.log(`[dstack] ${sockPath} absent; /var/run contains: ${JSON.stringify(dir)}`);
      } catch (e) {
        console.log(`[dstack] /var/run readdir failed: ${(e as Error).message}`);
      }
      return null;
    }
    try {
      const st = statSync(sockPath);
      console.log(
        `[dstack] ${sockPath} exists; isSocket=${st.isSocket()} isFile=${st.isFile()} isDirectory=${st.isDirectory()} mode=0${(st.mode & 0o777).toString(8)}`,
      );
    } catch (e) {
      console.log(`[dstack] stat ${sockPath} failed: ${(e as Error).message}`);
    }
  }

  // SDK 0.5.7's isReachable() probes /prpc/Tappd.Info (legacy tappd path),
  // which dstack-0.5.9 dropped. Skip the probe and rely on info()'s error.
  const client = new DstackClient(endpoint);
  let info;
  try {
    info = await client.info();
    console.log(`[dstack] info() OK; appId=${info.app_id} composeHash=${info.compose_hash?.slice(0, 16)}...`);
  } catch (e) {
    console.log(`[dstack] info() failed: ${(e as Error).message}`);
    return null;
  }
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

  const reportDataInput = bootReportDataInput(ethAddress, composeHash);
  const bootReportDataHash = sha256(reportDataInput);
  const bootQuoteResp = await client.getQuote(bootReportDataHash);

  if (typeof bootQuoteResp.quote !== "string" || bootQuoteResp.quote.length < 100) {
    throw new Error(`dstack getQuote returned malformed quote: ${bootQuoteResp.quote?.slice(0, 32)}...`);
  }

  verifyReportDataBinding({
    quoteHex: bootQuoteResp.quote,
    expectedEthAddress: ethAddress,
    expectedComposeHash: composeHash,
  });

  const requestPerReceiptQuote = async (receiptId: string) => {
    const input = buildPerReceiptReportDataInput(ethAddress, composeHash, receiptId);
    const hash = sha256(input);
    const resp = await client.getQuote(hash);
    if (typeof resp.quote !== "string" || resp.quote.length < 100) {
      throw new Error(`dstack getQuote returned malformed per-receipt quote`);
    }
    verifyPerReceiptQuoteBinding({
      quoteHex: resp.quote,
      expectedEthAddress: ethAddress,
      expectedComposeHash: composeHash,
      expectedReceiptId: receiptId,
    });
    return { quoteHex: resp.quote, eventLog: resp.event_log };
  };

  return {
    source: "tee",
    privKey,
    pubKeyUncompressed,
    ethAddress,
    composeHash,
    appId: info.app_id,
    instanceId: info.instance_id,
    reportDataInput,
    quoteHex: bootQuoteResp.quote,
    eventLog: bootQuoteResp.event_log,
    signatureChain: keyResp.signature_chain,
    boundAt: Math.floor(Date.now() / 1000),
    requestPerReceiptQuote,
  };
}

export const __testing = {
  bootReportDataInput,
  buildPerReceiptReportDataInput,
};
