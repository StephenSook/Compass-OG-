// Server-side relayer for CompassHub.consumeGrantAndIssueReceipt.
//
// Why a relayer: the contract requires msg.sender == grant.provider AND
// signer(grant) == agentRegistry.ownerOf(agentTokenId). That's two distinct
// principals — the user's Privy embedded wallet (agent owner) signs the
// EIP-712 grant in the browser, and the provider wallet (held server-side
// here) calls the contract and pays gas. Same architecture as the SD-JWT VC
// issuer route in /api/issue.
//
// v1: PROVIDER_PRIVATE_KEY env holds a fresh secp256k1 key, funded on
// Galileo via the deployer transfer documented in
// docs/notes/0g-galileo-policy-setup.md. v2 moves provider keys per-NGO
// (HELP, Bethune, Hospital each hold their own) and into a Phala enclave
// per docs/honest-limits.md.

import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  isAddress,
  isHex,
  keccak256,
  parseEventLogs,
  recoverTypedDataAddress,
  size,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { activeChain, useMainnet } from "@/lib/chains";
import {
  activeCompassHub,
  COMPASS_EIP712_DOMAIN_NAME,
  COMPASS_EIP712_DOMAIN_VERSION,
  COMPASS_GRANT_TYPES,
  COMPASS_HUB_ABI,
  HELP_LEGAL_AID_POLICY_LABEL,
} from "@/lib/contracts";
import { callEnclave, getEnclaveUrl } from "@/lib/compassEnclave";
import { check as rateLimitCheck, createBucketStore, extractClientIp } from "@/lib/ratelimit";

const RATE_LIMIT_STORE = createBucketStore();

// Galileo on-chain policy hash for help-legal-aid (registered via
// docs/notes/0g-galileo-policy-setup.md). The enclave receives the same
// hash so the receipt's policyHash field round-trips identically.
const HELP_POLICY_HASH_HEX: Hex =
  "0xc352f9c54bd580a2a45ef8c4a8f566607473fa8cfdefcb692121653178c765dc";

// Fixed credential-bundle commitment for the demo HELP claims. v2 derives
// this from the user's actual encrypted bundle in 0G Storage.
const HELP_CREDENTIAL_BUNDLE_HASH: Hex = keccak256(
  toHex("compass:help-credential-bundle:v1"),
);

export const runtime = "nodejs";

type GrantBody = {
  agentTokenId: string;
  policyId: Hex;
  provider: Hex;
  nonce: string;
  expiry: number;
  nullifier: Hex;
};

type ConsumeBody = {
  grant?: GrantBody;
  sig?: Hex;
};

function loadProviderKey(): Hex | null {
  const raw = process.env.PROVIDER_PRIVATE_KEY;
  if (!raw) return null;
  const hex = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!isHex(hex) || hex.length !== 66) return null;
  return hex as Hex;
}

function isPlainBytes32(v: unknown): v is Hex {
  return typeof v === "string" && isHex(v) && v.length === 66;
}

function validateGrant(g: GrantBody | undefined): { ok: boolean; reason?: string } {
  if (!g) return { ok: false, reason: "grant missing" };
  if (typeof g.agentTokenId !== "string" || !/^\d+$/.test(g.agentTokenId))
    return { ok: false, reason: "agentTokenId must be decimal string" };
  if (!isPlainBytes32(g.policyId)) return { ok: false, reason: "policyId must be 0x-32-bytes" };
  if (!isAddress(g.provider)) return { ok: false, reason: "provider must be address" };
  if (typeof g.nonce !== "string" || !/^\d+$/.test(g.nonce))
    return { ok: false, reason: "nonce must be decimal string" };
  if (typeof g.expiry !== "number" || g.expiry <= 0)
    return { ok: false, reason: "expiry must be positive number" };
  if (!isPlainBytes32(g.nullifier)) return { ok: false, reason: "nullifier must be 0x-32-bytes" };
  return { ok: true };
}

export async function POST(req: Request) {
  // Rate limit before any expensive work — drops floods at the cheapest
  // possible boundary. The 5/min cap is generous for legitimate demo
  // flows (judges mint at most a handful of receipts) and aggressive
  // against drain-the-provider-wallet abuse.
  const clientIp = extractClientIp(req.headers);
  const rl = rateLimitCheck(RATE_LIMIT_STORE, clientIp);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Too many requests — try again in ${Math.ceil(rl.resetMs / 1000)}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const sk = loadProviderKey();
  if (!sk) {
    return NextResponse.json(
      {
        error: "provider_unconfigured",
        message:
          "PROVIDER_PRIVATE_KEY env is not set or invalid. /onboard step 4 stays in fixture mode until the env is wired.",
      },
      { status: 503 },
    );
  }

  let body: ConsumeBody = {};
  try {
    body = (await req.json()) as ConsumeBody;
  } catch {
    return NextResponse.json({ error: "bad_request", message: "body must be JSON" }, { status: 400 });
  }

  const sig = body.sig;
  if (!sig || !isHex(sig) || size(sig) !== 65) {
    return NextResponse.json(
      { error: "bad_request", message: "sig must be 65-byte hex" },
      { status: 400 },
    );
  }
  const valid = validateGrant(body.grant);
  if (!valid.ok || !body.grant) {
    return NextResponse.json(
      { error: "bad_request", message: valid.reason ?? "invalid grant" },
      { status: 400 },
    );
  }

  // Provider must match the address committed to in the grant — the contract
  // enforces this at msg.sender == grant.provider, but rejecting early gives
  // a cleaner error than a viem revert.
  const account = privateKeyToAccount(sk);
  if (account.address.toLowerCase() !== body.grant.provider.toLowerCase()) {
    return NextResponse.json(
      {
        error: "provider_mismatch",
        message:
          "grant.provider does not match the server-held provider key. Check NEXT_PUBLIC_COMPASS_PROVIDER_ADDRESS.",
      },
      { status: 400 },
    );
  }

  // Receipt fields are minted server-side. receiptId binds to the grant
  // nullifier so each grant maps to exactly one receipt. resultHash is the
  // fixed "eligible:true" outcome for the demo. attestationDigest is the
  // load-bearing field A.4 makes real — sourced from the live Phala TDX
  // enclave when COMPASS_ENCLAVE_URL is set, falls back to the named stub
  // digest when unset (and surfaces the degraded mode in the response so
  // the browser can surface it).
  const nowSec = Math.floor(Date.now() / 1000);
  const receiptId = keccak256(
    toHex(`compass-receipt:${body.grant.nullifier}:${nowSec}`),
  );
  const resultHash = keccak256(toHex("compass-eligibility-result:eligible:true:help-legal-aid"));
  const receiptExpiry = nowSec + 60 * 60 * 24 * 365; // 1 year
  const challenge = keccak256(
    toHex(`compass-challenge:${body.grant.nullifier}:${nowSec}`),
  );

  // The on-chain ReceiptIssued event computes
  //   agentIdCommitment = keccak256(abi.encode(agentTokenId, ownerOf(tokenId)))
  // (CompassHub.sol). The enclave receipt-doc must commit to the SAME value
  // so a verifier sees one consistent agent handle across the chain. We
  // recover the agent owner from the EIP-712 grant signature here — the
  // contract enforces signer == ownerOf(tokenId) so a successful tx implies
  // the recovered address is the correct owner; if the sig is malformed the
  // contract reverts and we never persist the receipt.
  // Resolve the active chain + contract address once. Every downstream
  // step — EIP-712 domain separator, publicClient, walletClient,
  // writeContract target — must use the SAME value or the recovered
  // signer won't match what the contract expects.
  const chain = activeChain();
  const compassHubAddress = activeCompassHub();

  let agentOwner: Hex;
  try {
    agentOwner = await recoverTypedDataAddress({
      domain: {
        name: COMPASS_EIP712_DOMAIN_NAME,
        version: COMPASS_EIP712_DOMAIN_VERSION,
        chainId: chain.id,
        verifyingContract: compassHubAddress,
      },
      types: COMPASS_GRANT_TYPES,
      primaryType: "Grant",
      message: {
        agentTokenId: BigInt(body.grant.agentTokenId),
        policyId: body.grant.policyId,
        provider: body.grant.provider,
        nonce: BigInt(body.grant.nonce),
        expiry: BigInt(body.grant.expiry),
        nullifier: body.grant.nullifier,
      },
      signature: sig,
    });
  } catch (err) {
    console.error("[/api/consume] recoverTypedDataAddress failed", err);
    return NextResponse.json(
      { error: "bad_signature", message: "could not recover signer from grant" },
      { status: 400 },
    );
  }

  const agentIdCommitment = keccak256(
    encodeAbiParameters(
      [{ type: "uint256" }, { type: "address" }],
      [BigInt(body.grant.agentTokenId), agentOwner],
    ),
  );

  let attestationDigest: Hex = keccak256(toHex("compass-tdx-stub-v1"));
  let teeSource: "tee" | "env" | "stub" = "stub";
  let teeSignerAddress: Hex | null = null;
  let perReceiptQuoteHex: Hex | null = null;
  let teeReceiptVersion: string | null = null;
  let teeError: string | null = null;
  const enclaveUrl = getEnclaveUrl();
  if (enclaveUrl) {
    try {
      const enc = await callEnclave(enclaveUrl, {
        receiptId,
        challenge,
        policyHash: HELP_POLICY_HASH_HEX,
        agentIdCommitment,
        credentialBundleHash: HELP_CREDENTIAL_BUNDLE_HASH,
        policyLabel: HELP_LEGAL_AID_POLICY_LABEL,
        expirySec: receiptExpiry,
      });
      attestationDigest = enc.attestationDigest;
      teeSource = enc.source;
      teeSignerAddress = enc.signerAddress;
      perReceiptQuoteHex = enc.perReceiptQuoteHex;
      teeReceiptVersion = enc.receiptVersion;
    } catch (err) {
      console.warn("[/api/consume] enclave call failed, using stub digest", err);
      teeError = err instanceof Error ? err.message.slice(0, 240) : "unknown";
    }
  }

  // Fail closed if the enclave was reachable but did not return a real
  // TDX attestation. Without this guard the route would silently mint an
  // on-chain ReceiptIssued event with the stub digest the moment the
  // Phala CVM is stopped — contradicting the "receipts are TDX-attested"
  // claim in /about and the whitepaper. The stub-only path is reserved
  // for local dev with COMPASS_ENCLAVE_URL unset, where no mainnet tx
  // ever fires (the route returns 503 if PROVIDER_PRIVATE_KEY is also
  // unset and the demo stays in fixture mode).
  if (enclaveUrl && teeSource !== "tee") {
    return NextResponse.json(
      {
        error: "tee_required",
        message:
          "Phala dstack TDX enclave did not return a valid TEE attestation. Refusing to mint a receipt with a stub digest. Restart the CVM and retry; see /api/tee-status for live state.",
        teeError,
      },
      { status: 503 },
    );
  }

  const grantTuple = {
    agentTokenId: BigInt(body.grant.agentTokenId),
    policyId: body.grant.policyId,
    provider: body.grant.provider,
    nonce: BigInt(body.grant.nonce),
    expiry: BigInt(body.grant.expiry),
    nullifier: body.grant.nullifier,
  } as const;

  const receiptTuple = {
    receiptId,
    resultHash,
    receiptExpiry: BigInt(receiptExpiry),
    attestationDigest,
  } as const;

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  const walletClient = createWalletClient({
    chain,
    transport: http(),
    account,
  });

  let txHash: Hex;
  try {
    txHash = await walletClient.writeContract({
      address: compassHubAddress,
      abi: COMPASS_HUB_ABI,
      functionName: "consumeGrantAndIssueReceipt",
      args: [grantTuple, sig, receiptTuple],
    });
  } catch (err) {
    console.error("[/api/consume] writeContract failed", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "tx_failed", message: msg.slice(0, 240) },
      { status: 500 },
    );
  }

  let txReceipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>;
  try {
    txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  } catch (err) {
    console.error("[/api/consume] waitForTransactionReceipt failed", err);
    return NextResponse.json(
      { error: "tx_unconfirmed", message: "Submitted but not yet confirmed", txHash },
      { status: 504 },
    );
  }

  if (txReceipt.status !== "success") {
    return NextResponse.json(
      { error: "tx_reverted", message: "Tx mined but reverted", txHash },
      { status: 502 },
    );
  }

  // Pull ReceiptIssued event for the canonical fields the browser surfaces.
  const events = parseEventLogs({
    abi: COMPASS_HUB_ABI,
    eventName: "ReceiptIssued",
    logs: txReceipt.logs,
  });
  const issued = events[0];
  if (!issued) {
    return NextResponse.json(
      { error: "event_missing", message: "Tx confirmed but ReceiptIssued not found", txHash },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      txHash,
      blockNumber: Number(txReceipt.blockNumber),
      receiptId: issued.args.receiptId,
      policyId: issued.args.policyId,
      nullifier: issued.args.nullifier,
      agentIdCommitment: issued.args.agentIdCommitment,
      resultHash: issued.args.resultHash,
      attestationDigest: issued.args.attestationDigest,
      timestampBucket: Number(issued.args.timestampBucket),
      receiptExpiry: Number(issued.args.expiry),
      network: useMainnet() ? "aristotle" : "galileo",
      chainId: chain.id,
      tee: {
        source: teeSource,
        signerAddress: teeSignerAddress,
        perReceiptQuoteHex,
        receiptVersion: teeReceiptVersion,
        error: teeError,
      },
    },
    {
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rl.resetMs / 1000)),
      },
    },
  );
}
