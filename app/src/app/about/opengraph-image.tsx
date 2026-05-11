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
      "Four layers: SD-JWT VC vault · 0G Storage ciphertext · Phala dstack TDX receipt-signer · 0G Chain audit log. Every claim mapped to a real / draft / mocked row.",
    footer: "/about",
  });
}
