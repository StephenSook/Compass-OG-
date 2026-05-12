import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Compass — Public audit log. Receipts on 0G Chain with non-identifying fields only.";

export default async function Image() {
  return renderOg({
    eyebrow: "Public audit log",
    title: "Receipts, not",
    accent: "identities.",
    subtitle:
      "On-chain ReceiptIssued events: receiptId, policyId, nullifier, agentIdCommitment, resultHash, attestationDigest, 15-min timestampBucket. Nothing else.",
    footer: "/audit",
  });
}
