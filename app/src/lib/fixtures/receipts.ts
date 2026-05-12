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

export type ReceiptId = "1" | "2" | "3";

export const CANONICAL_RECEIPT_ID: ReceiptId = "1";

export const RECEIPTS: Record<ReceiptId, ReceiptFixture> = {
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
  "2": {
    receiptId: "0x8b7a9c2d1f5e4b3a8c7f6d2e9b1a5c8f4e7d3b2a1f9e6c5d4b3a8c7f6d2e9b1a",
    policyId: "compass:bethune-shelter",
    policyName: "Bethune House — Emergency Shelter Intake",
    policyIssuer: "Bethune House Migrant Women's Refuge",
    eligible: true,
    nullifier: "0xc4d8e2f7a3b6c9d1e5f8a2b6c9d3e7f1a5b8c2d6e9f3a7b1c5d9e3f7a1b5c9d3",
    agentIdCommitment:
      "0xd9e4f8a3b7c2d6e1f5a9b3c7d2e6f1a5b9c3d7e2f6a1b5c9d3e7f2a6b1c5d9e3",
    resultHash: "0x37b9c2e5d8a1f4c7b3e6d9a2f5c8b1e4d7a3f6c9b2e5d8a1f4c7b3e6d9a2f5c8",
    expirySec: 1798675199,
    attestationDigest:
      "0xa8c4d7e3f9b2c6d1a4e8f2b5c9d3e7a1f5b9c2d6e1f4a8b3c7d2e6f1a5b9c3d7",
    timestampBucketSec: 1747454400,
    mintTxHash:
      "0xe93d2f8b6a4c7d1e5f9b2c6a8d4e7f1b5c9d3e6f2a8b4c7d1e5f9b2c6a8d4e7f",
    storageRootHash:
      "0x6c8d2e9f3a5b7c1d4e8f2b6c9a3d7e1f5b9c2d6e8f4a1b5c7d3e9f2a6b8c4d1e",
    teeProvider: "0xa48f01287233509FD694a22Bf840225062E67836",
    teeSignerAddress: "0x83df4B8EbA7c0B3B740019b8c9a77ffF77D508cF",
  },
  "3": {
    receiptId: "0x2c9b8a7d6e5f4c3b2a1d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b3a2d1e0f9c8b",
    policyId: "compass:help-legal-aid",
    policyName: "HELP for Domestic Workers — Free Legal Aid",
    policyIssuer: "Compass Fixture Issuer (mocked NGO)",
    eligible: false,
    nullifier: "0x5e3d2c1b0a9f8e7d6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d9e8f7c6b5a4d3e2f",
    agentIdCommitment:
      "0xf2e1d0c9b8a7d6e5f4c3b2a1d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b3a2d1e0",
    resultHash: "0x4f3e2d1c0b9a8d7e6f5c4b3a2d1e0f9c8b7a6d5e4f3c2b1a0d9e8f7c6b5a4d3e",
    expirySec: 1798416000,
    attestationDigest:
      "0xb6a5d4e3f2c1b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d9e8f7c6b5a4",
    timestampBucketSec: 1747281600,
    mintTxHash:
      "0x7d6e5f4c3b2a1d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b3a2d1e0f9c8b7a6d5e",
    storageRootHash:
      "0x1b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d9e8f7c6b5a4d3e2f1c0b9a",
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

export function formatBucket(sec: number): string {
  return new Date(sec * 1000).toISOString().replace("T", " ").slice(0, 16);
}
