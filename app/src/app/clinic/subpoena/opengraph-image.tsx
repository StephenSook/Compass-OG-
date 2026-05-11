import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Under PDPO §57 disclosure, this is everything the clinic discloses.";

export default async function Image() {
  return renderOg({
    eyebrow: "Subpoena scene · PDPO §57",
    title: "That's",
    accent: "all that exists.",
    subtitle:
      "Someone qualified for free legal assistance at 14:32 on May 18, 2026. No name. No HKID. No employer. No documents.",
    footer: "/clinic/subpoena",
  });
}
