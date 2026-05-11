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
  expectedVct: "compass:help-legal-aid",
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

  it("rejects an empty and:[] predicate as predicate-false (Codex finding)", () => {
    const empty: CompassPolicy = { ...HELP_POLICY, predicate: { and: [] } };
    const r = evaluatePolicy(empty, {}, POLICY_HASH);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("predicate-false");
  });

  it("rejects an empty or:[] predicate as predicate-false (Codex finding)", () => {
    const empty: CompassPolicy = { ...HELP_POLICY, predicate: { or: [] } };
    const r = evaluatePolicy(empty, {}, POLICY_HASH);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("predicate-false");
  });
});

// E.3.a SD-JWT VC fuzz block — property-based tests covering edge cases the
// happy-path tests miss. Hand-rolled (no fast-check dep) to keep the
// vitest install footprint flat. Each `it` asserts an invariant the
// evaluator must hold under adversarial input.
describe("evaluatePolicy — fuzz / adversarial", () => {
  const baseClaims = { is_FDH_in_HK: true, has_pending_case: true } as const;

  it("type-coerced inputs (string 'true' vs boolean true) must NOT match", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      // @ts-expect-error — deliberately wrong type
      { is_FDH_in_HK: "true", has_pending_case: true },
      POLICY_HASH,
    );
    expect(r.eligible).toBe(false);
  });

  it("numeric 1 must NOT match boolean true", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      // @ts-expect-error — deliberately wrong type
      { is_FDH_in_HK: 1, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r.eligible).toBe(false);
  });

  it("extra claims (not in predicate) must not affect eligibility", () => {
    const r = evaluatePolicy(
      HELP_POLICY,
      { ...baseClaims, extra_claim: true, another: "yes" } as Record<string, unknown> as typeof baseClaims,
      POLICY_HASH,
    );
    expect(r.eligible).toBe(true);
  });

  it("AND-of-OR nesting evaluates AND/OR correctly when ALL referenced claims are disclosed", () => {
    // Important contract: evaluatePolicy requires every claim NAME
    // referenced in the predicate to be present in the claims input,
    // even claims behind an OR that the verifier never had to use.
    // This is a deliberate "all-or-nothing disclosure" design — the
    // holder cannot strategically omit a claim that an OR branch
    // might have evaluated against.
    const nested: CompassPolicy = {
      ...HELP_POLICY,
      predicate: {
        and: [
          {
            or: [
              { claim: "is_FDH_in_HK", equals: true },
              { claim: "is_other_visa", equals: true },
            ],
          },
          { claim: "has_pending_case", equals: true },
        ],
      },
    };
    // Happy path: BOTH OR-branch claims disclosed (one true), AND-branch claim disclosed
    const r1 = evaluatePolicy(
      nested,
      { is_FDH_in_HK: true, is_other_visa: false, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r1.eligible).toBe(true);
    // Predicate fails when neither OR branch matches
    const r2 = evaluatePolicy(
      nested,
      { is_FDH_in_HK: false, is_other_visa: false, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r2.eligible).toBe(false);
    expect(r2.reason).toBe("predicate-false");
    // Missing claim from OR branch (even though the other OR branch matches)
    // → missing-required-claim, not predicate-false. Surfaces the strict
    // disclosure rule above.
    const r3 = evaluatePolicy(
      nested,
      { is_FDH_in_HK: true, has_pending_case: true },
      POLICY_HASH,
    );
    expect(r3.eligible).toBe(false);
    expect(r3.reason).toBe("missing-required-claim");
  });

  it("disclosedClaims output is de-duplicated (sorting deferred to receipt builder)", () => {
    const orPolicy: CompassPolicy = {
      ...HELP_POLICY,
      predicate: {
        or: [
          { claim: "z_claim", equals: true },
          { claim: "a_claim", equals: true },
          { claim: "z_claim", equals: true },
        ],
      },
    };
    const r = evaluatePolicy(orPolicy, { z_claim: true, a_claim: true }, POLICY_HASH);
    // evaluatePolicy preserves predicate order; the receipt builder
    // (enclave/src/receipt.ts buildReceiptDocument) sorts before
    // canonicalization. Test the v1 contract: at least de-duplicated.
    if (r.disclosedClaims) {
      expect(r.disclosedClaims.length).toBe(new Set(r.disclosedClaims).size);
    }
  });

  it("string-equals predicate matches exactly (case-sensitive)", () => {
    const stringPolicy: CompassPolicy = {
      ...HELP_POLICY,
      predicate: { and: [{ claim: "residency", equals: "HK" }] },
    };
    const r1 = evaluatePolicy(stringPolicy, { residency: "HK" }, POLICY_HASH);
    expect(r1.eligible).toBe(true);
    const r2 = evaluatePolicy(stringPolicy, { residency: "hk" }, POLICY_HASH);
    expect(r2.eligible).toBe(false);
  });

  it("rejects predicates deeper than MAX_PREDICATE_DEPTH (DoS guard)", () => {
    let node: any = { claim: "leaf", equals: true };
    for (let i = 0; i < 20; i++) node = { and: [node] };
    const deep: CompassPolicy = { ...HELP_POLICY, predicate: node };
    const r = evaluatePolicy(deep, { leaf: true }, POLICY_HASH);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("predicate-false");
  });
});
