/**
 * Pure policy predicate evaluator. No I/O. Used inside the TEE.
 *
 * Hardening (Sonnet review):
 * - Depth guard prevents stack-overflow DoS from deeply-nested predicates.
 * - Empty `and: []` rejected (would otherwise vacuously return true and grant
 *   eligibility from a no-op predicate).
 * - Empty `or: []` rejected (would always return false — caller-side bug,
 *   surface it explicitly rather than silently denying).
 */
import type {
  ClaimSet,
  CompassPolicy,
  EligibilityResult,
  PredicateLeaf,
  PredicateNode,
} from "./types";

const MAX_PREDICATE_DEPTH = 16;

class MalformedPredicateError extends Error {}

function isLeaf(node: PredicateNode): node is PredicateLeaf {
  return typeof (node as PredicateLeaf).claim === "string";
}

function evalNode(node: PredicateNode, claims: ClaimSet, depth: number): boolean {
  if (depth > MAX_PREDICATE_DEPTH) {
    throw new MalformedPredicateError(`predicate depth exceeds ${MAX_PREDICATE_DEPTH}`);
  }
  if (isLeaf(node)) {
    return claims[node.claim] === node.equals;
  }
  if ("and" in node) {
    if (node.and.length === 0) throw new MalformedPredicateError("empty and:[]");
    return node.and.every((child) => evalNode(child, claims, depth + 1));
  }
  if ("or" in node) {
    if (node.or.length === 0) throw new MalformedPredicateError("empty or:[]");
    return node.or.some((child) => evalNode(child, claims, depth + 1));
  }
  throw new MalformedPredicateError(`unknown predicate node: ${JSON.stringify(node)}`);
}

function collectClaimNames(node: PredicateNode, acc: Set<string>, depth: number): void {
  if (depth > MAX_PREDICATE_DEPTH) {
    throw new MalformedPredicateError(`predicate depth exceeds ${MAX_PREDICATE_DEPTH}`);
  }
  if (isLeaf(node)) {
    acc.add(node.claim);
    return;
  }
  if ("and" in node) {
    if (node.and.length === 0) throw new MalformedPredicateError("empty and:[]");
    node.and.forEach((child) => collectClaimNames(child, acc, depth + 1));
    return;
  }
  if ("or" in node) {
    if (node.or.length === 0) throw new MalformedPredicateError("empty or:[]");
    node.or.forEach((child) => collectClaimNames(child, acc, depth + 1));
  }
}

export function evaluatePolicy(
  policy: CompassPolicy,
  claims: ClaimSet,
  policyHashHex: string,
): EligibilityResult {
  let required: Set<string>;
  try {
    required = new Set<string>();
    collectClaimNames(policy.predicate, required, 0);
  } catch (e) {
    if (e instanceof MalformedPredicateError) {
      return {
        eligible: false,
        reason: "predicate-false",
        policyId: policy.policyId,
        policyHash: policyHashHex,
      };
    }
    throw e;
  }

  for (const c of required) {
    if (!(c in claims)) {
      return {
        eligible: false,
        reason: "missing-required-claim",
        policyId: policy.policyId,
        policyHash: policyHashHex,
      };
    }
  }

  let ok: boolean;
  try {
    ok = evalNode(policy.predicate, claims, 0);
  } catch (e) {
    if (e instanceof MalformedPredicateError) {
      return {
        eligible: false,
        reason: "predicate-false",
        policyId: policy.policyId,
        policyHash: policyHashHex,
      };
    }
    throw e;
  }

  if (!ok) {
    return {
      eligible: false,
      reason: "predicate-false",
      policyId: policy.policyId,
      policyHash: policyHashHex,
    };
  }

  return {
    eligible: true,
    reason: "ok",
    policyId: policy.policyId,
    policyHash: policyHashHex,
    disclosedClaims: Array.from(required),
  };
}
