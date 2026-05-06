/**
 * Maria persona claims + 3 mock-issuer fixtures (HELP, Bethune House,
 * Hospital). Deterministic keys — same seed → same did:key → same demo.
 */
import { deterministicIssuerKeyPair, deterministicHolderKeyPair } from "./keys";
import type { ClaimSet, IssuerKeyPair, HolderKeyPair } from "./types";

export const ISSUERS = {
  help: deterministicIssuerKeyPair("compass-fixture-help-legal-aid-v1"),
  bethune: deterministicIssuerKeyPair("compass-fixture-bethune-shelter-v1"),
  hospital: deterministicIssuerKeyPair("compass-fixture-hk-fdh-hospital-v1"),
};

export const MARIA: HolderKeyPair = deterministicHolderKeyPair(
  "compass-fixture-maria-cruz-v1",
);

/**
 * Maria's full claim set across all three issuers.
 * Each issuer signs only the claims it's authoritative for.
 */
export const MARIA_FULL_CLAIMS: ClaimSet = {
  is_FDH_in_HK: true,
  has_pending_case: true,
  employment_active: true,
  residency: "HK",
  is_female: true,
  in_distress_marker_from_NGO: true,
  has_active_FDH_visa: true,
  HKID_valid: true,
};

/** Subset issued by HELP (legal aid eligibility). */
export const HELP_CLAIMS: ClaimSet = {
  is_FDH_in_HK: MARIA_FULL_CLAIMS.is_FDH_in_HK,
  has_pending_case: MARIA_FULL_CLAIMS.has_pending_case,
  employment_active: MARIA_FULL_CLAIMS.employment_active,
  residency: MARIA_FULL_CLAIMS.residency,
};

/** Subset issued by Bethune House (shelter intake eligibility). */
export const BETHUNE_CLAIMS: ClaimSet = {
  is_female: MARIA_FULL_CLAIMS.is_female,
  is_FDH_in_HK: MARIA_FULL_CLAIMS.is_FDH_in_HK,
  in_distress_marker_from_NGO: MARIA_FULL_CLAIMS.in_distress_marker_from_NGO,
  residency: MARIA_FULL_CLAIMS.residency,
};

/** Subset issued by Hospital (free-care eligibility). */
export const HOSPITAL_CLAIMS: ClaimSet = {
  has_active_FDH_visa: MARIA_FULL_CLAIMS.has_active_FDH_visa,
  HKID_valid: MARIA_FULL_CLAIMS.HKID_valid,
};

/** Resolve which fixture issuer signs claims for which policy. */
export function issuerForPolicy(policyId: string): IssuerKeyPair {
  if (policyId === "help-legal-aid") return ISSUERS.help;
  if (policyId === "bethune-shelter") return ISSUERS.bethune;
  if (policyId === "hk-fdh-hospital") return ISSUERS.hospital;
  throw new Error(`No fixture issuer for policy ${policyId}`);
}

export function claimsForPolicy(policyId: string): ClaimSet {
  if (policyId === "help-legal-aid") return HELP_CLAIMS;
  if (policyId === "bethune-shelter") return BETHUNE_CLAIMS;
  if (policyId === "hk-fdh-hospital") return HOSPITAL_CLAIMS;
  throw new Error(`No fixture claims for policy ${policyId}`);
}
