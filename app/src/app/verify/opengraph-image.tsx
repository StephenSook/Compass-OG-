import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Verify a receipt in your browser. Don't trust us; re-derive the chain.";

export default async function Image() {
  return renderOg({
    eyebrow: "Verify · browser-side",
    title: "Don't trust us.",
    accent: "Re-derive it.",
    subtitle:
      "Paste a Compass receipt bundle. Your browser re-runs the four cryptographic checks the CLI does — no server calls, no clone, no install.",
    footer: "/verify",
  });
}
