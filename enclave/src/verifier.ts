/**
 * SD-JWT VC verifier. Enforces the full chain:
 *   issuer signature → trust list → revocation → KB-JWT (cnf binding) →
 *   vct check → audience binding → predicate evaluation against
 *   schema-allowlisted disclosed claims.
 *
 * Single-principal model: the holder's `cnf.jwk` is the secp256k1 key that
 * also owns the agent INFT and signs the on-chain Authwit grant. This
 * verifier MUST reject any presentation whose KB-JWT is missing, signed by
 * a different key, or fails nonce/audience binding.
 */
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest } from "@sd-jwt/crypto-nodejs";
import { ed25519 } from "@noble/curves/ed25519.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { KbVerifier } from "@sd-jwt/types";
import type { ClaimSet, CompassPolicy, EligibilityResult, IssuerKeyPair } from "./types";
import type { TrustList } from "./trust";
import { evaluatePolicy } from "./policy";

function decodeJsonSegment(b64url: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(b64url, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function preCheckKbJwt(
  kbJwt: string,
  credentialPayload: Record<string, unknown>,
  expectedNonce: string,
  expectedAudience: string,
): Promise<"ok" | "fail"> {
  const parts = kbJwt.split(".");
  if (parts.length !== 3) return "fail";
  const kbPayload = decodeJsonSegment(parts[1]);
  if (!kbPayload) return "fail";
  if (kbPayload.aud !== expectedAudience) return "fail";
  if (kbPayload.nonce !== expectedNonce) return "fail";
  const data = `${parts[0]}.${parts[1]}`;
  const verify = makeCnfBoundKbVerifier();
  return (await verify(data, parts[2], credentialPayload)) ? "ok" : "fail";
}

function makeIssuerVerifier(publicKeyBytes: Uint8Array) {
  return async (data: string, signatureBase64url: string): Promise<boolean> => {
    if (publicKeyBytes.length !== 32) return false;
    let sig: Uint8Array;
    try {
      sig = Uint8Array.from(Buffer.from(signatureBase64url, "base64url"));
    } catch {
      return false;
    }
    if (sig.length !== 64) return false;
    return ed25519.verify(sig, new TextEncoder().encode(data), publicKeyBytes);
  };
}

/**
 * KB-JWT verifier: reconstructs the secp256k1 pubkey from the credential's
 * `cnf.jwk` and verifies the holder's signature over the KB-JWT bytes.
 * `payload` here is the verified credential payload, not the KB payload —
 * the SD-JWT lib hands us the issuer-signed claims so we can pull `cnf`.
 */
function makeCnfBoundKbVerifier(): KbVerifier {
  return async (data, sigBase64url, credentialPayload) => {
    const cnf = (credentialPayload as { cnf?: { jwk?: Record<string, unknown> } })?.cnf;
    const jwk = cnf?.jwk;
    if (!jwk) return false;
    if (jwk.kty !== "EC" || jwk.crv !== "secp256k1") return false;
    if (typeof jwk.x !== "string" || typeof jwk.y !== "string") return false;
    let x: Uint8Array;
    let y: Uint8Array;
    let sig: Uint8Array;
    try {
      x = Uint8Array.from(Buffer.from(jwk.x, "base64url"));
      y = Uint8Array.from(Buffer.from(jwk.y, "base64url"));
      sig = Uint8Array.from(Buffer.from(sigBase64url, "base64url"));
    } catch {
      return false;
    }
    if (x.length !== 32 || y.length !== 32 || sig.length !== 64) return false;
    const pubBytes = new Uint8Array(65);
    pubBytes[0] = 0x04;
    pubBytes.set(x, 1);
    pubBytes.set(y, 33);
    const msgHash = sha256(new TextEncoder().encode(data));
    return secp256k1.verify(sig, msgHash, pubBytes, { prehash: false, lowS: true });
  };
}

export type RevocationStatus = "valid" | "revoked" | "unreachable";

/** v1 mock — accept a static map: issuerDid → revocation status. v2 fetches IETF Token Status List JWT. */
export type StatusListResolver = (issuerDid: string) => Promise<RevocationStatus>;

type VerifyOpts = {
  presentation: string;
  policy: CompassPolicy;
  policyHash: string;
  audience: string;
  nonce: string;
  /** Override clock for deterministic fixtures (seconds since epoch). */
  currentDate?: number;
  /** Allowed clock skew for iat/nbf/exp checks (default 60s). */
  skewSeconds?: number;
};

export class CompassVerifier {
  constructor(
    private readonly trustList: TrustList,
    private readonly issuerPubkeys: Map<string, Uint8Array>,
    private readonly statusResolver: StatusListResolver,
  ) {}

  async verifyAndEvaluate(opts: VerifyOpts): Promise<EligibilityResult> {
    const fail = (reason: EligibilityResult["reason"]): EligibilityResult => ({
      eligible: false,
      reason,
      policyId: opts.policy.policyId,
      policyHash: opts.policyHash,
    });

    // 1. Bare-parse the presentation to extract the issuer DID before signature
    //    verification (we need it to resolve the issuer's pubkey). Errors here
    //    are structural — distinct from signature failures downstream.
    let payloadIss: string;
    let kbJwt: string;
    try {
      const parts = opts.presentation.split("~");
      if (parts.length < 2) throw new Error("missing kb-jwt");
      const jwt = parts[0];
      const jwtParts = jwt.split(".");
      if (jwtParts.length !== 3) throw new Error("malformed jwt");
      const payload = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
      if (typeof payload?.iss !== "string" || payload.iss.length === 0) {
        throw new Error("missing iss");
      }
      payloadIss = payload.iss;
      kbJwt = parts[parts.length - 1];
      if (!kbJwt || kbJwt.split(".").length !== 3) throw new Error("missing kb-jwt");
    } catch {
      return fail("malformed-presentation");
    }

    // 2. Trust-list check (issuer DID must be allow-listed for this policy).
    if (!this.trustList.isTrusted(payloadIss)) return fail("issuer-not-trusted");

    // 3. Resolve issuer pubkey.
    const issuerPubkey = this.issuerPubkeys.get(payloadIss);
    if (!issuerPubkey) return fail("issuer-not-trusted");

    // 4. Revocation status. Distinct reasons for revoked vs unreachable —
    //    fail-closed in both cases but log them separately.
    const status = await this.statusResolver(payloadIss);
    if (status === "revoked") return fail("credential-revoked");
    if (status === "unreachable") return fail("status-list-unreachable");

    // 5a. Pre-check the KB-JWT signature against `cnf.jwk` from the credential
    //     payload. The library bundles KB sig failures and credential sig
    //     failures behind the same generic "Invalid JWT Signature" message,
    //     so we differentiate the two by checking KB first.
    const credPayload = decodeJsonSegment(opts.presentation.split("~")[0].split(".")[1]);
    if (credPayload === null) return fail("malformed-presentation");
    const kbCheck = await preCheckKbJwt(kbJwt, credPayload, opts.nonce, opts.audience);
    if (kbCheck !== "ok") return fail("kb-binding-failed");

    // 5b. Full SD-JWT verification: issuer sig + KB-JWT (re-verified) + nonce
    //     + iat/nbf/exp. Defense in depth — kbVerifier runs again here.
    const sdjwt = new SDJwtVcInstance({
      verifier: makeIssuerVerifier(issuerPubkey),
      signAlg: "EdDSA",
      kbVerifier: makeCnfBoundKbVerifier(),
      kbSignAlg: "ES256K",
      hasher: digest,
      hashAlg: "sha-256",
    });

    let verified;
    try {
      verified = await sdjwt.verify(opts.presentation, {
        keyBindingNonce: opts.nonce,
        currentDate: opts.currentDate,
        skewSeconds: opts.skewSeconds ?? 60,
      });
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      if (/expired|nbf|not.before|iat/i.test(msg)) return fail("credential-expired");
      if (/nonce/i.test(msg)) return fail("kb-binding-failed");
      if (/key.?binding|kb-jwt/i.test(msg)) return fail("kb-binding-failed");
      return fail("credential-bad-signature");
    }

    const payload = (verified.payload ?? {}) as Record<string, unknown>;

    // 6. vct must match policy.expectedVct.
    if (payload.vct !== opts.policy.expectedVct) return fail("wrong-vct");

    // 7. KB-JWT audience check. The lib enforces `nonce` via keyBindingNonce
    //    but does NOT enforce `aud`. We decode the KB-JWT (already integrity-
    //    verified by sdjwt.verify above) and assert aud === opts.audience.
    try {
      const kbPayload = JSON.parse(
        Buffer.from(kbJwt.split(".")[1], "base64url").toString("utf8"),
      );
      if (kbPayload?.aud !== opts.audience) return fail("kb-binding-failed");
    } catch {
      return fail("kb-binding-failed");
    }

    // 8. Build disclosed claim set from the policy schema's required allowlist
    //    (Codex finding: do NOT blacklist JWT claims — schema is authoritative).
    const allowedClaims = new Set<string>(opts.policy.credentialBundleSchema.required);
    for (const k of Object.keys(opts.policy.credentialBundleSchema.properties ?? {})) {
      allowedClaims.add(k);
    }
    const disclosed: ClaimSet = {};
    for (const k of allowedClaims) {
      if (Object.prototype.hasOwnProperty.call(payload, k)) {
        const v = payload[k];
        if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
          disclosed[k] = v;
        }
      }
    }

    return evaluatePolicy(opts.policy, disclosed, opts.policyHash);
  }
}

export function buildFixtureVerifier(
  trustList: TrustList,
  fixtureIssuers: IssuerKeyPair[],
): CompassVerifier {
  const map = new Map<string, Uint8Array>();
  for (const k of fixtureIssuers) map.set(k.did, k.publicKeyBytes);
  const resolver: StatusListResolver = async () => "valid";
  return new CompassVerifier(trustList, map, resolver);
}
