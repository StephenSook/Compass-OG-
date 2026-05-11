import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Frequently asked questions, with file-level citations for every claim.";

export default async function Image() {
  return renderOg({
    eyebrow: "FAQ · 11 questions",
    title: "Honest answers,",
    accent: "with citations.",
    subtitle:
      "Technical and non-technical. Every answer links the code file or documented limit that ships the evidence. No marketing claims without a citation.",
    footer: "/faq",
  });
}
