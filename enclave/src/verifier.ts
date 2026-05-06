/**
 * SD-JWT VC verifier. Checks the issuer signature, confirms issuer is in the
 * trust list, validates expiry/status (mocked v1), evaluates the policy
 * predicate against disclosed claims, and produces a deterministic
 * EligibilityResult.
 */
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest } from "@sd-jwt/crypto-nodejs";
import { ed25519 } from "@noble/curves/ed25519.js";
import type { ClaimSet, CompassPolicy, EligibilityResult, IssuerKeyPair } from "./types";
import type { TrustList } from "./trust";
import { evaluatePolicy } from "./policy";

function makeIssuerVerifier(publicKeyBytes: Uint8Array) {
  return async (data: string, signatureBase64url: string): Promise<boolean> => {
    const sig = Uint8Array.from(Buffer.from(signatureBase64url, "base64url"));
    return ed25519.verify(sig, new TextEncoder().encode(data), publicKeyBytes);
  };
}

export type RevocationStatus = "valid" | "revoked" | "unreachable";

/** v1 mock — accept a static map: issuerDid → revocation status. v2 fetches RFC 7644 status list JWT. */
export type StatusListResolver = (issuerDid: string) => Promise<RevocationStatus>;

export class CompassVerifier {
  constructor(
    private readonly trustList: TrustList,
    /** Map of issuerDid -> public key bytes (for signature verification) */
    private readonly issuerPubkeys: Map<string, Uint8Array>,
    private readonly statusResolver: StatusListResolver,
  ) {}

  /**
   * Verify a presented SD-JWT VC and evaluate the policy.
   * Returns deterministic result: same VC + same policy + same now-window
   * yields identical receipt-input hashes (Phase 4c.8).
   */
  async verifyAndEvaluate(opts: {
    presentation: string;
    policy: CompassPolicy;
    policyHash: string;
    audience: string;
    nonce: string;
  }): Promise<EligibilityResult> {
    // Inspect issuer-of-record from the JWT payload (decoded without verification first).
    // The full library `verify` call requires the verifier fn to be set in the instance,
    // and the verifier fn needs the right public key — which we resolve from the iss claim.
    let payloadIss: string;
    try {
      const jwt = opts.presentation.split("~")[0];
      const payloadB64 = jwt.split(".")[1];
      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
      payloadIss = payload.iss;
    } catch (e) {
      return {
        eligible: false,
        reason: "credential-bad-signature",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Trust-list check (per Ultraplan A4).
    if (!this.trustList.isTrusted(payloadIss)) {
      return {
        eligible: false,
        reason: "issuer-not-trusted",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Resolve issuer public key.
    const pubkey = this.issuerPubkeys.get(payloadIss);
    if (!pubkey) {
      return {
        eligible: false,
        reason: "issuer-not-trusted",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Revocation status (v1 mock; v2 fetches RFC 7644 status list).
    const status = await this.statusResolver(payloadIss);
    if (status === "revoked") {
      return {
        eligible: false,
        reason: "credential-revoked",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }
    if (status === "unreachable") {
      // Fail-closed per Ultraplan A6.
      return {
        eligible: false,
        reason: "credential-revoked",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Verify the SD-JWT signature + decode disclosed claims.
    const sdjwt = new SDJwtVcInstance({
      verifier: makeIssuerVerifier(pubkey),
      signAlg: "EdDSA",
      hasher: digest,
      hashAlg: "sha-256",
    });
    let verified: any;
    try {
      verified = await sdjwt.verify(opts.presentation);
    } catch (e) {
      return {
        eligible: false,
        reason: "credential-bad-signature",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Expiry check.
    const nowSec = Math.floor(Date.now() / 1000);
    const exp = verified.payload?.exp;
    if (typeof exp === "number" && exp <= nowSec) {
      return {
        eligible: false,
        reason: "credential-expired",
        policyId: opts.policy.policyId,
        policyHash: opts.policyHash,
      };
    }

    // Build the disclosed claim set, then evaluate the predicate.
    const disclosed: ClaimSet = {};
    for (const k of Object.keys(verified.payload ?? {})) {
      const v = verified.payload[k];
      // Skip standard JWT claims; keep only credential claims.
      if (
        k === "iss" ||
        k === "vct" ||
        k === "iat" ||
        k === "exp" ||
        k === "cnf" ||
        k === "_sd" ||
        k === "_sd_alg"
      ) continue;
      disclosed[k] = v as boolean | number | string;
    }

    return evaluatePolicy(opts.policy, disclosed, opts.policyHash);
  }
}

/**
 * Helper to construct a verifier with the standard fixture issuers.
 */
export function buildFixtureVerifier(
  trustList: TrustList,
  fixtureIssuers: IssuerKeyPair[],
): CompassVerifier {
  const map = new Map<string, Uint8Array>();
  for (const k of fixtureIssuers) map.set(k.did, k.publicKeyBytes);
  // v1: all fixture issuers report "valid" (no revocations modeled in v1).
  const resolver: StatusListResolver = async () => "valid";
  return new CompassVerifier(trustList, map, resolver);
}
