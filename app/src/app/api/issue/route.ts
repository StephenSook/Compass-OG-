// Live SD-JWT VC issuance for /onboard step 3.
//
// v1: server-side Ed25519 issuer key in Vercel env (ISSUER_PRIVATE_KEY,
// 32-byte hex). Browser POSTs claims, route signs an SD-JWT VC and returns
// the compact serialization. v2 adds AES-256-GCM encryption + 0G Storage
// upload. The reality table on /about correctly marks SD-JWT VC issuers as
// `draft (live behind ISSUER_PRIVATE_KEY env)` — when the env is unset we
// fall back to the fixture-timer path on the client side.

import { NextResponse } from "next/server";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest, generateSalt } from "@sd-jwt/crypto-nodejs";
import { ed25519 } from "@noble/curves/ed25519.js";
import { isAddress } from "viem";
import { check as rateLimitCheck, createBucketStore, extractClientIp } from "@/lib/ratelimit";

const RATE_LIMIT_STORE = createBucketStore();

export const runtime = "nodejs";

// The route accepts ONLY the holder address — vct and claims are
// server-controlled. This is intentional: an open route that signs
// arbitrary caller-supplied claims with the Compass issuer key would
// let anyone mint a credential asserting any eligibility property.
// v1 hardcodes the HELP FDH demo VC; v2 will move issuance to per-NGO
// authenticated endpoints with schema validation per partner.
type IssueRequestBody = {
  holderAddress?: `0x${string}`;
};

const DEMO_VCT = "https://compass.0g.ai/vct/help-fdh.v1";
const DEMO_CLAIMS: Record<string, unknown> = {
  is_FDH_in_HK: true,
  has_pending_case: true,
  employment_active: true,
  residency: "HK",
};

// Base58btc alphabet (Bitcoin / IPFS standard).
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58btcEncode(bytes: Uint8Array): string {
  // BigInt literals (0n, 256n) require ES2020+; this app targets ES2017,
  // so the constructor form keeps the encoder compatible without bumping
  // the global tsconfig target.
  const ZERO = BigInt(0);
  const BASE = BigInt(58);
  const BYTE_BASE = BigInt(256);
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let value = ZERO;
  for (const b of bytes) value = value * BYTE_BASE + BigInt(b);
  let out = "";
  while (value > ZERO) {
    const r = Number(value % BASE);
    out = B58[r] + out;
    value = value / BASE;
  }
  return "1".repeat(zeros) + out;
}

function ed25519PublicKeyToDidKey(publicKey: Uint8Array): string {
  // Multicodec ed25519-pub: 0xed (varint), then 0x01 continuation
  const prefix = new Uint8Array([0xed, 0x01]);
  const buf = new Uint8Array(prefix.length + publicKey.length);
  buf.set(prefix, 0);
  buf.set(publicKey, prefix.length);
  return "did:key:z" + base58btcEncode(buf);
}

function makeSigner(privateKeyBytes: Uint8Array) {
  return async (data: string): Promise<string> => {
    const sig = ed25519.sign(new TextEncoder().encode(data), privateKeyBytes);
    return Buffer.from(sig).toString("base64url");
  };
}

function loadIssuerKey(): { privateKey: Uint8Array; publicKey: Uint8Array } | null {
  const hex = process.env.ISSUER_PRIVATE_KEY;
  if (!hex || hex.length !== 64) return null;
  let privateKey: Uint8Array;
  try {
    privateKey = Uint8Array.from(Buffer.from(hex, "hex"));
  } catch {
    return null;
  }
  if (privateKey.length !== 32) return null;
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function POST(req: Request) {
  // Rate-limit BEFORE issuer-key load + signing. OWASP API4 / API6:
  // /api/issue performs Ed25519 sign + SD-JWT issuance on every call.
  // Without throttling, a flood would (a) pollute the Compass issuer
  // DID's reputation by minting thousands of credentials and (b)
  // exhaust Vercel function-minute budget. Same 5/min/IP cap as
  // /api/consume.
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

  const key = loadIssuerKey();
  if (!key) {
    return NextResponse.json(
      {
        error: "issuer_unconfigured",
        message:
          "ISSUER_PRIVATE_KEY env var is not set or invalid. /onboard step 3 stays in fixture mode until the env is wired.",
      },
      { status: 503 },
    );
  }

  // Body parsing. Empty body is valid (holderAddress is optional). A
  // body that's present but unparseable is 400, not silently default —
  // silent fall-through hid configuration mistakes (silent-failure-
  // hunter 2026-05-11).
  let body: IssueRequestBody = {};
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 0) {
    try {
      body = (await req.json()) as IssueRequestBody;
    } catch {
      return NextResponse.json(
        {
          error: "bad_request",
          message: "body must be JSON with optional holderAddress (0x-20-byte EVM address)",
        },
        { status: 400 },
      );
    }
  }

  // OWASP API3: holderAddress is the ONLY caller-supplied field that
  // makes it into the signed credential (via cnf.holderAddress). The
  // `0x${string}` TypeScript template is erased at runtime; we MUST
  // validate the shape so an attacker can't stamp arbitrary strings
  // (e.g. <script>) into a Compass-issuer-signed VC.
  const holderAddress = body.holderAddress;
  if (holderAddress !== undefined && !isAddress(holderAddress)) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: "holderAddress must be a valid 0x-prefixed 20-byte EVM address",
      },
      { status: 400 },
    );
  }

  const vct = DEMO_VCT;
  const claims = DEMO_CLAIMS;

  const issuerDid = ed25519PublicKeyToDidKey(key.publicKey);
  const sdjwt = new SDJwtVcInstance({
    signer: makeSigner(key.privateKey),
    signAlg: "EdDSA",
    hasher: digest,
    hashAlg: "sha-256",
    saltGenerator: generateSalt,
  });

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 * 24 * 365; // 1 year
  // cnf binding placeholder: in v2 the holder's full secp256k1 JWK comes
  // from Privy. v1 just stamps the EVM address so the receipt-signer can
  // verify "this credential belongs to this wallet" before mint.
  const payload: Record<string, unknown> = {
    iss: issuerDid,
    vct,
    iat: now,
    exp: expiresAt,
    ...claims,
  };
  if (holderAddress) {
    payload.cnf = { holderAddress };
  }

  const disclosureFrame: { _sd: string[] } = { _sd: Object.keys(claims) };

  let sdjwtvc: string;
  try {
    sdjwtvc = await sdjwt.issue(
      payload as Parameters<typeof sdjwt.issue>[0],
      disclosureFrame as Parameters<typeof sdjwt.issue>[1],
    );
  } catch (err) {
    console.error("[/api/issue] sd-jwt issue failed", err);
    // Truncate the upstream library's error to 200 chars — matches the
    // pattern in /api/consume + compassEnclave; defense-in-depth against
    // a future @sd-jwt/sd-jwt-vc release that surfaces sensitive
    // material (key bytes, stack paths, env-derived hints) in error
    // strings.
    const msg = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    return NextResponse.json(
      { error: "sign_failed", message: msg },
      { status: 500 },
    );
  }

  return NextResponse.json({
    sdjwtvc,
    issuerDid,
    vct,
    claimNames: Object.keys(claims),
    issuedAt: now,
    expiresAt,
  });
}
