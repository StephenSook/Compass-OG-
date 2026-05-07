# Compass — Private Eligibility Firewall on 0G

> **Prove eligibility, not identity.**

Compass is a private eligibility firewall built on 0G Network. Vulnerable users (lead persona: Maria Cruz, Filipino domestic worker in Hong Kong) prove they qualify for services through a soulbound agent identity — clinics receive only non-identifying receipts, never raw credentials.

**Track 5: Privacy & Sovereign Infrastructure** — 0G APAC Hackathon 2026.

---

## What this is

A two-contract on-chain footprint plus an off-chain enclave service:

- `AgentRegistry` (ERC-7857-stripped, soulbound) — Maria's agent identity with encrypted credential pointer to 0G Storage
- `CompassHub` — policy registry + atomic `consumeGrantAndIssueReceipt` (Aztec-Authwit-style EIP-712 grant + bounded-disclosure receipt in a single tx, single-principal-bound to the agent owner)
- 0G Sealed Inference (TeeML) — policy evaluation inside hardware-attested enclave
- 0G Storage — AES-256-GCM-encrypted SD-JWT VC vaults
- 0G Chain — testnet (Galileo, chainId 16602) for staging; mainnet chainId pending verification (16661 or 16600 — see `docs/notes/0g-ecosystem-status.md`)

The clinic's view of Maria after she passes eligibility: `"Someone qualified for free legal assistance at 14:32 on May 18, 2026."` That's the entire disclosure. No name. No HKID. No employer. No documents.

## Repo layout

```
Compass-OG-/
├── contracts/    Hardhat workspace — AgentRegistry + CompassHub
├── app/          Next.js 14 App Router — Privy embedded wallet
├── enclave/      TypeScript node service — 0G broker + SD-JWT VC + receipt
├── docs/
│   ├── policies/         demo policy JSONs (HELP, Bethune, Hospital)
│   ├── notes/            broker smoke test results, canonical provider, cost benchmarks
│   ├── deployments/      mainnet contract addresses + Explorer links
│   └── schemas/          receipt-v1.json canonicalization spec
└── .github/workflows/ci.yml   contracts + app + enclave on every push
```

## Status

**Today (May 6 2026):** workspace + scaffolding + contracts + invariants. See `docs/notes/0g-tee-smoke.md` for the broker smoke-test result.

| Area | State |
|---|---|
| Hardhat workspace + 0G networks (Galileo / Aristotle) | wired |
| `AgentRegistry` soulbound + ERC-7857-stripped | implemented + tested |
| `CompassHub` atomic grant + receipt | implemented + tested |
| Property-based invariants (5) | green |
| `slither` static analysis | clean (medium + high) |
| `solidity-coverage` | 100% lines, 96.55% branches |
| 0G broker SDK smoke test | infrastructure ready, gated on testnet funding |
| SD-JWT VC issuer/holder/verifier round-trip | not started |
| 0G Storage encrypted vault upload | not started |
| 0G Sealed Inference broker integration | not started |
| Mainnet deploy | not yet |

Build-in-public:
- X thread: posted day-1 — search `#0GHackathon` for `@StephenSook` updates
- Discord: 0G builders channel
- Repo updates daily through the submission deadline

## Architecture (at a glance)

User device (Privy embedded wallet) → AES-256-GCM encrypts SD-JWT VC → uploaded to 0G Storage. Provider sends fresh challenge + policyId. Maria signs an Authwit grant via Privy. Provider passes the grant to the enclave; the enclave decrypts the VC inside the 0G TeeML-attested image (built on dstack TDX), evaluates the policy predicate, signs the receipt with a key derived inside that image, and returns it. The Ethereum address corresponding to the signing key is bound into the TDX quote's `report_data` field — verifiers run Intel DCAP (or the dstack verifier) and check that the receipt signer matches the address embedded in `report_data`, proving the key was generated inside this exact attested image. Provider posts grant + receipt in a single `consumeGrantAndIssueReceipt` call — atomic, no half-state. The clinic sees the on-chain `ReceiptIssued` event; the clinic never sees Maria.

## Honest limits

This is hackathon-grade. Read `docs/honest-limits.md` for the full disclosure list. Highlights:
- Three demo issuers (HELP for Domestic Workers, Bethune House, MFMW) are **mocked** local fixtures, not real NGOs
- Trust list governance is **stubbed** — owner-managed for v1, needs DAO for production
- On-chain `verifyAttestation` is a **stub** — RA quote verification too expensive on-chain, real verification happens off-chain in the enclave service
- Receipt-key-to-quote binding is **REPORTDATA-bound** — confirmed Day 3 by 0G compute team. dstack TDX writes the signing key's Ethereum address into the quote's `report_data`. Hardware-bound enclave-born key proof. See `docs/honest-limits.md` §5b.
- SD-JWT VC pinned to draft-ietf-oauth-sd-jwt-vc-15 (the underlying SD-JWT primitive is RFC 9901 stable, but the VC profile is in flux)

## Replicate a receipt yourself — *roadmap*

The judge-replicable verify-receipt CLI is a roadmap item. It will reproduce the receipt digest from public on-chain inputs + the canonical 0G TEE provider's attestation quote + the policy JSON. **Status today: scaffolded, not built.** It depends on (a) the canonical 0G TEE provider being pinned in production and (b) at least one real receipt anchored on mainnet.

When live, the invocation will be:

```bash
git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG- && npm install
npm run verify-receipt -- --receiptId 0x…
```

Expected output: `OK — receipt verified against TEE attestation.`

Until then, the receipt's digest construction is documented in [`docs/schemas/receipt-v1.json`](./docs/schemas/receipt-v1.json) (RFC 8785 JCS canonical form), and the enclave-key TEE-binding requirement is documented in `docs/honest-limits.md`.

## License

MIT — see [LICENSE](./LICENSE).

## Build credits

Solo build by Stephen Sookra (KSU CS sophomore, Atlanta). Pair-coded with Claude Code (Opus 4.7), reviewed by Codex (GPT-5.5) and Gemini 2.5 Pro. Thanks to the 0G Labs team and HackQuest for the infrastructure and the platform.
