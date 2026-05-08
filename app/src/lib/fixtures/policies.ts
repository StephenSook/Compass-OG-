export type PolicyFixture = {
  id: string;
  slug: string;
  name: string;
  issuer: string;
  issuerNote: string;
  predicate: string;
  predicateClaims: string[];
  minAnonymitySet: number;
  status: "active" | "draft" | "deprecated";
  policyHash: string;
  registeredAt: string;
  description: string;
};

export const POLICIES: PolicyFixture[] = [
  {
    id: "compass:help-legal-aid",
    slug: "help-legal-aid",
    name: "HELP for Domestic Workers — Free Legal Aid",
    issuer: "HELP for Domestic Workers (St. John's Cathedral office)",
    issuerNote: "Real organization. Compass-side signing key is a local Ed25519 fixture for the demo, not endorsed by the NGO.",
    predicate: "is_FDH_in_HK ∧ has_pending_case",
    predicateClaims: ["is_FDH_in_HK", "has_pending_case"],
    minAnonymitySet: 50,
    status: "active",
    policyHash: "0x71f4ad29b8e3b9c10238ff61a7c5a4b2d8e0f6c9e2b3a7c4f5d8e1b2c3d4e5f6",
    registeredAt: "2026-04-12",
    description:
      "Free legal consultation for Foreign Domestic Helpers in Hong Kong with an open employment dispute. Eligibility checked without disclosure of name, HKID, or employer.",
  },
  {
    id: "compass:bethune-shelter",
    slug: "bethune-shelter",
    name: "Bethune House — Emergency Shelter Intake",
    issuer: "Bethune House Migrant Women's Refuge",
    issuerNote: "Real organization. Compass-side signing key is a local Ed25519 fixture for the demo, not endorsed by the NGO.",
    predicate: "is_female ∧ is_FDH_in_HK ∧ in_distress_marker_from_NGO",
    predicateClaims: ["is_female", "is_FDH_in_HK", "in_distress_marker_from_NGO"],
    minAnonymitySet: 25,
    status: "active",
    policyHash: "0x2a8b3f6e9d4c7a1b5e8f2d6c9b4a7e3f8c1d5a2b9e4f7c3d8a6b5e1f2c9d4a7e",
    registeredAt: "2026-04-18",
    description:
      "Emergency shelter intake for migrant women in distress. Intake decision binds on a notarized in-distress marker from a partnered NGO; the shelter never sees the underlying credential.",
  },
  {
    id: "compass:hk-fdh-hospital",
    slug: "hk-fdh-hospital",
    name: "HK Public Hospital — Free Care for FDH",
    issuer: "Hospital Authority of Hong Kong (test profile)",
    issuerNote: "Test issuer profile. Hospital Authority of Hong Kong has not reviewed or endorsed this policy.",
    predicate: "has_active_FDH_visa ∧ HKID_valid",
    predicateClaims: ["has_active_FDH_visa", "HKID_valid"],
    minAnonymitySet: 100,
    status: "draft",
    policyHash: "0x9c4f8d2b6e3a7c5f1d8b4e9a2c6f3d7b8a1e5c9f2b6d3a7e4c8f1b5d9a2e6c3f",
    registeredAt: "2026-05-02",
    description:
      "Free public-hospital care for active-visa Foreign Domestic Helpers. Currently in draft — predicate is being narrowed to satisfy Hospital Authority compliance review before activation.",
  },
];

export function getPolicyById(id: string): PolicyFixture | undefined {
  return POLICIES.find((p) => p.id === id);
}

export function getPolicyBySlug(slug: string): PolicyFixture | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
