// Fixture receipts. The on-chain fields (mintTxHash, storageRootHash,
// teeProvider, teeSignerAddress) are real Galileo-testnet artifacts;
// receipt-level fields (receiptId, nullifier, attestationDigest, etc.)
// are mocked until CompassHub.issueReceipt is wired.

export type ReceiptFixture = {
  receiptId: string;
  policyId: string;
  policyName: string;
  policyIssuer: string;
  eligible: boolean;
  nullifier: string;
  agentIdCommitment: string;
  resultHash: string;
  expirySec: number;
  attestationDigest: string;
  timestampBucketSec: number;
  mintTxHash: string;
  storageRootHash: string;
  teeProvider: string;
  teeSignerAddress: string;
};

export const CANONICAL_RECEIPT_ID = "1" as const;

export const RECEIPTS: Record<string, ReceiptFixture> = {
  [CANONICAL_RECEIPT_ID]: {
    receiptId: "0x4e6d3a1b9c84f72e5d3a1b9c84f72e5d3a1b9c84f72e5d3a1b9c84f72e5d3a1b",
    policyId: "compass:help-legal-aid",
    policyName: "HELP for Domestic Workers — Free Legal Aid",
    policyIssuer: "Compass Fixture Issuer (mocked NGO)",
    eligible: true,
    nullifier: "0x9f2c8b5a1e7d4f3c8b5a1e7d4f3c8b5a1e7d4f3c8b5a1e7d4f3c8b5a1e7d4f3c",
    agentIdCommitment:
      "0x7a3d8e2c5b9f4a1e7d4f3c8b5a1e7d4f3c8b5a1e7d4f3c8b5a1e7d4f3c8b5a1e",
    resultHash: "0xb16a59aca32afe0ff10998a416d438fa7062611960956497951279670565a4c1",
    // 2026-12-31 23:59:59 UTC — well past the demo narrative date so the
    // receipt renders as live for cold viewers.
    expirySec: 1798761599,
    attestationDigest:
      "0x5db7f9a289e09fcdcc873ecbf8bb42058340dedafebc8a262ab260b73245e0f8",
    timestampBucketSec: 1747542720,
    mintTxHash:
      "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41",
    storageRootHash:
      "0x4d188a35cc928455debe5b34b6455fbdce37880662bd01b141e3c60c5cc115b7",
    teeProvider: "0xa48f01287233509FD694a22Bf840225062E67836",
    teeSignerAddress: "0x83df4B8EbA7c0B3B740019b8c9a77ffF77D508cF",
  },
};

if (!RECEIPTS[CANONICAL_RECEIPT_ID]) {
  throw new Error(
    `RECEIPTS[${CANONICAL_RECEIPT_ID}] missing — subpoena → receipt link assumes this key exists`,
  );
}

export function shortenHex(hex: string, head = 6, tail = 4): string {
  if (hex.length <= head + tail + 2) return hex;
  return `${hex.slice(0, head + 2)}…${hex.slice(-tail)}`;
}

export function formatExpiry(sec: number): string {
  const d = new Date(sec * 1000);
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
