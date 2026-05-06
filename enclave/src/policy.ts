/**
 * Pure policy predicate evaluator. No I/O. Used inside the TEE.
 */
import type {
  ClaimSet,
  CompassPolicy,
  EligibilityResult,
  PredicateLeaf,
  PredicateNode,
} from "./types";

function isLeaf(node: PredicateNode): node is PredicateLeaf {
  return typeof (node as PredicateLeaf).claim === "string";
}

function evalNode(node: PredicateNode, claims: ClaimSet): boolean {
  if (isLeaf(node)) {
    return claims[node.claim] === node.equals;
  }
  if ("and" in node) {
    return node.and.every((child) => evalNode(child, claims));
  }
  if ("or" in node) {
    return node.or.some((child) => evalNode(child, claims));
  }
  throw new Error(`Unknown predicate node: ${JSON.stringify(node)}`);
}

/**
 * Determine which claim names appear in the predicate tree (for required-claim
 * checks before evaluation).
 */
function collectClaimNames(node: PredicateNode, acc: Set<string>): void {
  if (isLeaf(node)) {
    acc.add(node.claim);
    return;
  }
  if ("and" in node) {
    node.and.forEach((child) => collectClaimNames(child, acc));
    return;
  }
  if ("or" in node) {
    node.or.forEach((child) => collectClaimNames(child, acc));
  }
}

export function evaluatePolicy(
  policy: CompassPolicy,
  claims: ClaimSet,
  policyHashHex: string,
): EligibilityResult {
  // Check every claim referenced in the predicate is present.
  const required = new Set<string>();
  collectClaimNames(policy.predicate, required);

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

  const ok = evalNode(policy.predicate, claims);
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
