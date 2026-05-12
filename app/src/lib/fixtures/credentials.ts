// Vault fixtures. Each row mirrors the production AES-256-GCM/0G-Storage
// envelope; no crypto runs in this module — the production browser path is
// the v2 wire-up (today the round-trip exists in the Node CLI). The fields
// exposed here (issuer DID, claim names, KDF/cipher labels, storage root
// hash, ciphertext byte count) are public-by-design even in production.

import type { ClaimName } from "./claims";
import type { ReceiptId } from "./receipts";

export type CredentialStatus = "active" | "expired" | "revoked";

export type CredentialFixture = {
  id: string;
  issuer: string;
  issuerDid: string;
  vctType: string;
  storageRootHash: string;
  encryptionAlg: "AES-256-GCM";
  kdf: "PBKDF2-SHA256-600k";
  /** Disclosable claim *names* — values are encrypted on the user's device. */
  disclosableClaims: readonly ClaimName[];
  issuedAt: string;
  expiresAt: string;
  status: CredentialStatus;
  /** AES-256-GCM ciphertext size as uploaded to 0G Storage. */
  bytesEncrypted: number;
  /** Most recent ReceiptIssued that disclosed against this credential. */
  lastReceiptId?: ReceiptId;
};

export const TONE_BY_CREDENTIAL_STATUS: Record<
  CredentialStatus,
  "positive" | "warning" | "neutral"
> = {
  active: "positive",
  expired: "neutral",
  revoked: "warning",
};

export const CREDENTIALS: CredentialFixture[] = [
  {
    id: "vc:help-fdh:maria-2026-04-12",
    issuer: "HELP for Domestic Workers (St. John's Cathedral office)",
    issuerDid: "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSdoqMkzeKjPNd3JKjk7",
    vctType: "https://compass.0g.ai/vct/help-fdh.v1",
    storageRootHash:
      "0x4d188a35cc928455debe5b34b6455fbdce37880662bd01b141e3c60c5cc115b7",
    encryptionAlg: "AES-256-GCM",
    kdf: "PBKDF2-SHA256-600k",
    disclosableClaims: [
      "is_FDH_in_HK",
      "has_pending_case",
      "employment_active",
      "residency",
    ],
    issuedAt: "2026-04-12",
    expiresAt: "2027-04-12",
    status: "active",
    bytesEncrypted: 4_872,
    lastReceiptId: "1",
  },
  {
    id: "vc:bethune:maria-2026-04-18",
    issuer: "Bethune House Migrant Women's Refuge",
    issuerDid: "did:key:z6MkfqQfVnf4VVtL9wW8oJfqLCY9iWVaVdsP5xNcWZ8gZNJh",
    vctType: "https://compass.0g.ai/vct/bethune-shelter.v1",
    storageRootHash:
      "0x6c8d2e9f3a5b7c1d4e8f2b6c9a3d7e1f5b9c2d6e8f4a1b5c7d3e9f2a6b8c4d1e",
    encryptionAlg: "AES-256-GCM",
    kdf: "PBKDF2-SHA256-600k",
    disclosableClaims: [
      "is_female",
      "is_FDH_in_HK",
      "in_distress_marker_from_NGO",
    ],
    issuedAt: "2026-04-18",
    expiresAt: "2027-04-18",
    status: "active",
    bytesEncrypted: 3_614,
  },
];

export function totalBytesEncrypted(creds: readonly CredentialFixture[]): number {
  return creds.reduce((sum, c) => sum + c.bytesEncrypted, 0);
}

export function uniqueIssuers(creds: readonly CredentialFixture[]): number {
  return new Set(creds.map((c) => c.issuerDid)).size;
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function shortenDid(did: string, head = 14, tail = 6): string {
  if (did.length <= head + tail + 2) return did;
  return `${did.slice(0, head)}…${did.slice(-tail)}`;
}
