/**
 * Shared types for the Compass enclave service.
 */

export type ClaimSet = Record<string, boolean | number | string>;

export type EligibilityResult = {
  eligible: boolean;
  reason:
    | "ok"
    | "predicate-false"
    | "credential-revoked"
    | "credential-expired"
    | "credential-bad-signature"
    | "issuer-not-trusted"
    | "missing-required-claim";
  policyId: string;
  policyHash: string;
  /** Disclosed claims that satisfied the predicate (for audit logs). */
  disclosedClaims?: string[];
};

/**
 * Predicate language for policy JSONs.
 * v1 supports: { and: [{claim, equals}] }.
 */
export type PredicateLeaf = {
  claim: string;
  equals: boolean | number | string;
};

export type PredicateNode =
  | { and: (PredicateLeaf | PredicateNode)[] }
  | { or: (PredicateLeaf | PredicateNode)[] }
  | PredicateLeaf;

export type CompassPolicy = {
  policyId: string;
  issuerCanonicalName?: string;
  version: string;
  predicate: PredicateNode;
  minAnonymitySet: number;
  credentialBundleSchema: {
    required: string[];
    properties: Record<string, unknown>;
  };
  trustedIssuers: string[];
  humanReadable?: Record<string, unknown>;
  policyHashAlgorithm: "sha256";
  policyHashCanonicalization: string;
};

export type IssuerKeyPair = {
  did: string; // did:key:z6Mk... (Ed25519)
  privateKeyBytes: Uint8Array;
  publicKeyBytes: Uint8Array;
};

export type HolderKeyPair = {
  /** secp256k1 (matches Privy/EVM) */
  privateKeyHex: string;
  publicKeyHex: string;
  jwk: {
    kty: "EC";
    crv: "secp256k1";
    x: string;
    y: string;
  };
};

export type StatusListEntry = {
  index: number;
  /** "valid" or "revoked" — bit flag in the RFC 7644 status list */
  status: "valid" | "revoked";
};
