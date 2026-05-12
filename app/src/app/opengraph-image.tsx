import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Prove eligibility, not identity. A private eligibility firewall on 0G.";

export default async function Image() {
  return renderOg({
    eyebrow: "Compass",
    title: "Prove eligibility,",
    accent: "not identity.",
    subtitle:
      "A private eligibility firewall on 0G. 368,000 HK migrant workers + 27M across APAC prove they qualify for services without disclosing name, HKID, or employer.",
    footer: "368K at risk · Aristotle mainnet · live",
  });
}
