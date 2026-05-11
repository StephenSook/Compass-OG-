// Glossary entries used by the <Term> tooltip primitive. Each entry maps
// a canonical key to a one-line plain-language definition.
//
// Why this file exists: Compass mixes humanitarian framing (intake
// clinicians, NGOs, migrant workers) with cryptographic plumbing
// (SD-JWT VC, EIP-712, RA quotes). The humanitarian-track judges who
// score the submission may not have Web3 background; the privacy-track
// judges may not have humanitarian context. Inline hover definitions
// drop the cognitive load for both audiences without bloating the
// surface with parenthetical glosses.
//
// Definitions are intentionally short (one or two sentences). Longer
// explanations live in docs/architecture.md, docs/threat-model.md,
// and docs/honest-limits.md — link from the term when more depth is
// useful.

export type GlossaryEntry = {
  term: string;
  definition: string;
  link?: string;
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  "sd-jwt-vc": {
    term: "SD-JWT VC",
    definition:
      "Selective-Disclosure JSON Web Token Verifiable Credential. Claims commit to a salted-hash table; the holder reveals only the salts she chooses, keeping the rest private.",
    link: "https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/",
  },
  "eip-712": {
    term: "EIP-712",
    definition:
      "Ethereum standard for typed structured data signing. The wallet shows the user the exact fields she's authorizing instead of an opaque hex blob.",
    link: "https://eips.ethereum.org/EIPS/eip-712",
  },
  "pdpo-57": {
    term: "PDPO §57",
    definition:
      "Hong Kong Personal Data (Privacy) Ordinance section 57 — the legal mechanism by which an authority can compel a data controller to disclose personal data they hold.",
  },
  "agentidcommitment": {
    term: "agentIdCommitment",
    definition:
      "keccak256 hash of (agentTokenId, ownerAddress). Lets the audit log commit to which agent participated in a receipt without revealing the raw token ID or owner address on-chain.",
  },
  "dstack": {
    term: "dstack",
    definition:
      "Phala Network's TDX confidential-compute runtime. Provides deterministic key derivation sealed to the attested image, plus per-request remote-attestation quotes.",
    link: "https://docs.phala.network/dstack",
  },
  "composehash": {
    term: "composeHash",
    definition:
      "SHA-256 of the docker-compose manifest that boots the TDX enclave. Acts as the externally-verifiable handle to the exact image whose code is signing receipts.",
  },
  "ra-quote": {
    term: "RA quote",
    definition:
      "Remote Attestation quote. A cryptographic statement signed by the CPU that this code is running inside a TEE on genuine hardware. Compass binds one quote per receipt to the receipt-id + signer + image.",
  },
  "mr-td": {
    term: "MR_TD",
    definition:
      "Measurement Register for Trust Domain. The hardware-rooted hash of everything loaded into the TDX VM. Determines which sealed keys the dstack runtime will derive.",
  },
  "soulbound-inft": {
    term: "Soulbound INFT",
    definition:
      "Identity NFT that cannot be transferred. Compass uses one per agent: ownership cannot move, so the on-chain (token, owner) pair stays a stable cryptographic handle.",
  },
  "nullifier": {
    term: "nullifier",
    definition:
      "32-byte token derived from a grant. The contract records it as 'spent' on first use; replays revert. Prevents double-redemption of the same grant.",
  },
  "0g-teeml": {
    term: "0G TeeML",
    definition:
      "0G Network's TEE Machine Learning compute layer. Sealed-inference workloads (like Compass' receipt-signer) run here with verifiable attestation.",
  },
  "phala-tdx": {
    term: "Phala dstack TDX",
    definition:
      "Phala Network's Intel TDX (Trust Domain Extensions) confidential VM service. Where the Compass receipt-signer runs. Hardware-isolated; code is publicly attested.",
  },
  "authwit": {
    term: "Authwit",
    definition:
      "Authorization-Witness pattern: a separate principal (here, the user's wallet) signs a typed-data grant; a relayer submits the on-chain transaction. The contract validates the grant signature, not the relayer's identity.",
  },
  "non-extractable-key": {
    term: "non-extractable WebCrypto key",
    definition:
      "AES key handle generated in the browser with extractable=false. The browser will encrypt/decrypt with it but refuses to export the raw bytes — defeats key exfiltration via crypto.subtle.exportKey().",
  },
  "secp256k1": {
    term: "secp256k1",
    definition:
      "The elliptic curve used by Ethereum, Bitcoin, and Compass' receipt-signer. The TDX-sealed key is on this curve so signatures are EVM-compatible.",
  },
  "ed25519": {
    term: "Ed25519",
    definition:
      "Modern elliptic curve used by Compass' SD-JWT VC issuer keys. Fast, deterministic signatures with strong forward-security properties.",
  },
  "bucketed-timestamp": {
    term: "15-min timestamp bucket",
    definition:
      "Receipts emit time as 15-minute buckets, not exact seconds. Defeats fine-grained correlation between receipts and external events (e.g., a worker calling a phone number at a specific minute).",
  },
  "merkle-root": {
    term: "Merkle root",
    definition:
      "Hash that commits to an entire data tree. Compass uses one to bind the encrypted vault (held on 0G Storage) to the on-chain AgentRegistry without putting the data itself on-chain.",
  },
  "hkid": {
    term: "HKID",
    definition:
      "Hong Kong Identity Card number. The single most-disclosed field in HK intake forms and the single most-dangerous one for migrant workers under coercion.",
  },
  "fdh": {
    term: "FDH",
    definition:
      "Foreign Domestic Helper. The largest migrant-worker visa category in Hong Kong (~340,000 visa holders, roughly 5% of the population). Subject to the 14-day rule: a worker whose contract ends must leave HK within 14 days unless rehired.",
  },
};
