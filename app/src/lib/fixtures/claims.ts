// Predicate claim names referenced by both PolicyFixture.predicateClaims and
// CredentialFixture.disclosableClaims. Hoisted so adding a new claim requires
// touching this file alone — and so a typo in either fixture file fails to
// compile instead of slipping through as a string.

export type ClaimName =
  | "is_FDH_in_HK"
  | "has_pending_case"
  | "employment_active"
  | "residency"
  | "is_female"
  | "in_distress_marker_from_NGO"
  | "has_active_FDH_visa"
  | "HKID_valid";
