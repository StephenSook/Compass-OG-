import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Maria's onboarding flow in four steps. Connect, mint, issue, request.";

export default async function Image() {
  return renderOg({
    eyebrow: "Onboard · 4 steps",
    title: "Maria&apos;s agent,",
    accent: "in three steps.",
    subtitle:
      "Connect Privy wallet · mint soulbound agent INFT · issue SD-JWT credential · request eligibility. Each step real on 0G Aristotle mainnet.",
    footer: "/onboard",
  });
}
