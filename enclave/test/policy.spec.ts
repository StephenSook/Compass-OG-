import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "../src/policy";
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
  trustedIssuers: [],
  policyHashAlgorithm: "sha256",
  policyHashCanonicalization: "RFC 8785 JCS",
};

const POLICY_HASH = "0xabc";

describe("evaluatePolicy — pure predicate evaluator", () => {
  it("returns eligible:true when all predicates match", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      { is_FDH_in_HK: true, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r.eligible).toBe(true);
    expect(r.reason).toBe("ok");
  });

  it("returns predicate-false when any predicate fails", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      { is_FDH_in_HK: true, has_pending_case: false },
      POLICY_HASH,
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("predicate-false");
  });

  it("returns missing-required-claim when a referenced claim is absent", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      { is_FDH_in_HK: true },
      POLICY_HASH,
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("missing-required-claim");
  });

  it("supports OR predicates", () => {
    const orPolicy: CompassPolicy = {
      ...HELP_POLICY,
      predicate: {
        or: [
          { claim: "is_FDH_in_HK", equals: true },
          { claim: "is_other_visa", equals: true },
        ],
      },
    };
    const r1 = evaluatePolicy(orPolicy, { is_FDH_in_HK: true, is_other_visa: false }, POLICY_HASH);
    expect(r1.eligible).toBe(true);
    const r2 = evaluatePolicy(orPolicy, { is_FDH_in_HK: false, is_other_visa: true }, POLICY_HASH);
    expect(r2.eligible).toBe(true);
    const r3 = evaluatePolicy(orPolicy, { is_FDH_in_HK: false, is_other_visa: false }, POLICY_HASH);
    expect(r3.eligible).toBe(false);
  });

  it("policyHash + policyId are echoed into the result", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      { is_FDH_in_HK: true, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r.policyHash).toBe(POLICY_HASH);
    expect(r.policyId).toBe("help-legal-aid");
  });
});
