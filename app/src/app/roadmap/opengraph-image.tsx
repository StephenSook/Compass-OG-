import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Roadmap. What's shipped, what's next, what's later, with honest gating constraints.";

export default async function Image() {
  return renderOg({
    eyebrow: "Roadmap · 5 phases",
    title: "What we built ·",
    accent: "what's next.",
    subtitle:
      "v0.5 shipped on Aristotle mainnet. v0.6 hardening, v0.7 trust-list governance, v0.8 real NGO integration, v1.0 optional ZK path.",
    footer: "/roadmap",
  });
}
