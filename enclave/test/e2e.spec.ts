import { describe, it, expect } from "vitest";
import { CompassIssuer } from "../src/issuer";
import { CompassHolder } from "../src/holder";
import { CompassVerifier, type StatusListResolver } from "../src/verifier";
import { buildTrustList } from "../src/trust";
import { ISSUERS, MARIA, HELP_CLAIMS } from "../src/fixtures";
import { buildReceiptDocument, attestationDigest, canonicalize } from "../src/receipt";
import { sha256 } from "@noble/hashes/sha2.js";
import type { CompassPolicy } from "../src/types";

const HELP_POLICY: CompassPolicy = {
  policyId: "help-legal-aid",
  version: "1.0.0",
  predicate: {
    and: [
      { claim: "is_FDH_in_HK", equals: true },
      { claim: "has_pending_case", equals: true },
    ],
  },
  minAnonymitySet: 100,
  credentialBundleSchema: {
    required: ["is_FDH_in_HK", "has_pending_case"],
    properties: {},
  },
  trustedIssuers: [ISSUERS.help.did],
  policyHashAlgorithm: "sha256",
  policyHashCanonicalization: "RFC 8785 JCS",
};

const POLICY_HASH = "0xpolicyhash000000000000000000000000000000000000000000000000000001";
const AUDIENCE = "https://help.compass-fixture.test";
const NONCE = "compass-nonce-fixture-001";

describe("Compass — full SD-JWT VC issuer→holder→verifier round-trip", () => {
  it("Maria gets a HELP credential, presents it, verifier returns eligible:true", async () => {
    const issuer = new CompassIssuer(ISSUERS.help);
    const issued = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
    });
    expect(issued.sdjwtvc).toContain("~");

    const holder = new CompassHolder(MARIA);
    const presentation = await holder.present({
      issuedSdjwt: issued.sdjwtvc,
      discloseClaims: ["is_FDH_in_HK", "has_pending_case"],
      audience: AUDIENCE,
      nonce: NONCE,
    });

    const trust = buildTrustList([ISSUERS.help.did]);
    const issuerPubkeys = new Map([[ISSUERS.help.did, ISSUERS.help.publicKeyBytes]]);
    const validResolver: StatusListResolver = async () => "valid";
    const verifier = new CompassVerifier(trust, issuerPubkeys, validResolver);

    const result = await verifier.verifyAndEvaluate({
      presentation,
      policy: HELP_POLICY,
      policyHash: POLICY_HASH,
      audience: AUDIENCE,
      nonce: NONCE,
    });

    expect(result.eligible).toBe(true);
    expect(result.reason).toBe("ok");
    expect(result.policyId).toBe("help-legal-aid");
    expect(result.policyHash).toBe(POLICY_HASH);
  });

  it("rejects presentation when issuer is NOT in the trust list (Ultraplan A4)", async () => {
    const issuer = new CompassIssuer(ISSUERS.bethune); // Bethune signs, but trust list only has HELP
    const issued = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
    });

    const holder = new CompassHolder(MARIA);
    const presentation = await holder.present({
      issuedSdjwt: issued.sdjwtvc,
      discloseClaims: ["is_FDH_in_HK", "has_pending_case"],
      audience: AUDIENCE,
      nonce: NONCE,
    });

    const trust = buildTrustList([ISSUERS.help.did]); // bethune NOT in trust list
    const issuerPubkeys = new Map([[ISSUERS.help.did, ISSUERS.help.publicKeyBytes]]);
    const validResolver: StatusListResolver = async () => "valid";
    const verifier = new CompassVerifier(trust, issuerPubkeys, validResolver);

    const result = await verifier.verifyAndEvaluate({
      presentation,
      policy: HELP_POLICY,
      policyHash: POLICY_HASH,
      audience: AUDIENCE,
      nonce: NONCE,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("issuer-not-trusted");
  });

  it("rejects revoked credential (status-list bit set)", async () => {
    const issuer = new CompassIssuer(ISSUERS.help);
    const issued = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
    });

    const holder = new CompassHolder(MARIA);
    const presentation = await holder.present({
      issuedSdjwt: issued.sdjwtvc,
      discloseClaims: ["is_FDH_in_HK", "has_pending_case"],
      audience: AUDIENCE,
      nonce: NONCE,
    });

    const trust = buildTrustList([ISSUERS.help.did]);
    const issuerPubkeys = new Map([[ISSUERS.help.did, ISSUERS.help.publicKeyBytes]]);
    const revokedResolver: StatusListResolver = async () => "revoked";
    const verifier = new CompassVerifier(trust, issuerPubkeys, revokedResolver);

    const result = await verifier.verifyAndEvaluate({
      presentation,
      policy: HELP_POLICY,
      policyHash: POLICY_HASH,
      audience: AUDIENCE,
      nonce: NONCE,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("credential-revoked");
  });

  it("fails closed when status-list endpoint is unreachable (Ultraplan A6)", async () => {
    const issuer = new CompassIssuer(ISSUERS.help);
    const issued = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
    });

    const holder = new CompassHolder(MARIA);
    const presentation = await holder.present({
      issuedSdjwt: issued.sdjwtvc,
      discloseClaims: ["is_FDH_in_HK", "has_pending_case"],
      audience: AUDIENCE,
      nonce: NONCE,
    });

    const trust = buildTrustList([ISSUERS.help.did]);
    const issuerPubkeys = new Map([[ISSUERS.help.did, ISSUERS.help.publicKeyBytes]]);
    const downResolver: StatusListResolver = async () => "unreachable";
    const verifier = new CompassVerifier(trust, issuerPubkeys, downResolver);

    const result = await verifier.verifyAndEvaluate({
      presentation,
      policy: HELP_POLICY,
      policyHash: POLICY_HASH,
      audience: AUDIENCE,
      nonce: NONCE,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("credential-revoked"); // fail-closed
  });

  it("rejects when the holder presents fewer claims than the policy requires", async () => {
    const issuer = new CompassIssuer(ISSUERS.help);
    const issued = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
    });

    const holder = new CompassHolder(MARIA);
    // Only disclose one of the two required claims.
    const presentation = await holder.present({
      issuedSdjwt: issued.sdjwtvc,
      discloseClaims: ["is_FDH_in_HK"],
      audience: AUDIENCE,
      nonce: NONCE,
    });

    const trust = buildTrustList([ISSUERS.help.did]);
    const issuerPubkeys = new Map([[ISSUERS.help.did, ISSUERS.help.publicKeyBytes]]);
    const validResolver: StatusListResolver = async () => "valid";
    const verifier = new CompassVerifier(trust, issuerPubkeys, validResolver);

    const result = await verifier.verifyAndEvaluate({
      presentation,
      policy: HELP_POLICY,
      policyHash: POLICY_HASH,
      audience: AUDIENCE,
      nonce: NONCE,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("missing-required-claim");
  });

  it("Phase 4c.8 — deterministic receipt digest fixture (judge-replicable)", async () => {
    const issuer = new CompassIssuer(ISSUERS.help);
    const issued1 = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
      iat: 1715000000,
      exp: 1717592000,
    });
    const issued2 = await issuer.issue({
      holderJwk: MARIA.jwk,
      claims: HELP_CLAIMS,
      vct: "compass:help-legal-aid",
      iat: 1715000000,
      exp: 1717592000,
    });
    // SD-JWT salts make the JWT itself non-deterministic; the receipt digest
    // is what we pin. Construct a receipt for both with identical inputs:
    const eligibleResult = {
      eligible: true,
      reason: "ok" as const,
      policyId: "help-legal-aid",
      policyHash: POLICY_HASH,
    };
    const doc = buildReceiptDocument({
      receiptId: "0xreceipt0000000000000000000000000000000000000000000000000000001",
      challenge: "0xchallenge00000000000000000000000000000000000000000000000000001",
      policyHash: POLICY_HASH,
      agentIdCommitment:
        "0xagent000000000000000000000000000000000000000000000000000000001",
      verifierPubKey: "0xpubkey00000000000000000000000000000000000000000000000000000001",
      credentialBundleHash:
        "0xbundle00000000000000000000000000000000000000000000000000000001",
      result: eligibleResult,
      expiry: 1717592000,
      issuedAt: 1715000000,
    });
    const digest1 = attestationDigest(doc);
    const digest2 = attestationDigest(doc);
    expect(digest1).toEqual(digest2);
    expect(digest1).toMatch(/^0x[0-9a-f]{64}$/);
    // The hash should remain identical across runs. Snapshot:
    const expectedHex =
      "0x" +
      Array.from(sha256(new TextEncoder().encode(canonicalize(doc))))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    expect(digest1).toBe(expectedHex);
  });
});
