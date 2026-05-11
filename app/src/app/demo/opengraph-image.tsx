import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — 7-stop guided tour for hackathon judges. Click these in order.";

export default async function Image() {
  return renderOg({
    eyebrow: "Guided demo · 7 stops",
    title: "Click these",
    accent: "in order.",
    subtitle:
      "Hackathon judges: this is the path that gives you everything you need to score the submission. Estimated 8-12 minutes end-to-end.",
    footer: "/demo",
  });
}
