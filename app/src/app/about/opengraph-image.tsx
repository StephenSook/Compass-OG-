import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Architecture, reality table, and how it differs from adjacent privacy projects.";

export default async function Image() {
  return renderOg({
    eyebrow: "About · architecture",
    title: "Bounded disclosure,",
    accent: "on the wire.",
    subtitle:
      "Four layers: SD-JWT VC vault · 0G Storage · Phala dstack TDX receipt-signer · 0G Chain audit log. Built for 368K HK migrant workers + 27M across APAC. $22K/$14K cost per incident.",
    footer: "/about · TAM + cost-per-incident inside",
  });
}
