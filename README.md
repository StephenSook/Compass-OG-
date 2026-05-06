# Compass — Private Eligibility Firewall on 0G

> **Prove eligibility, not identity.**

Compass is a private eligibility firewall built on 0G Network. Vulnerable users (lead persona: Maria Cruz, Filipino domestic worker in Hong Kong) prove they qualify for services through an autonomous agent — clinics receive only non-identifying receipts, never raw credentials.

**Track 5: Privacy & Sovereign Infrastructure** — 0G APAC Hackathon 2026.

---

## What this is

A two-contract on-chain footprint plus an off-chain enclave service:

- `AgentRegistry` (ERC-7857-stripped) — Maria's portable agent identity with encrypted credential pointer to 0G Storage
- `CompassHub` — policy registry + Aztec-Authwit-style EIP-712 single-use grants + receipt event log
- 0G Sealed Inference (TeeML) — policy evaluation inside hardware-attested enclave
- 0G Storage — AES-256-GCM-encrypted SD-JWT VC vaults
- 0G Chain (Aristotle, chainId 16661) — receipts and grants on-chain, no PII

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

**Day 1 (May 6 2026)**: scaffolding + 0G broker smoke test. See `docs/notes/0g-tee-smoke.md`.

Build-in-public:
- X thread: posted Day 1 — search `#0GHackathon` for `@StephenSook` updates
- Discord: 0G builders channel
- Repo updates daily through May 16 / June 5 deadline

## Architecture (at a glance)

User device (Privy embedded wallet) → AES-256-GCM encrypts SD-JWT VC → uploaded to 0G Storage. Provider sends fresh challenge + policyId. Maria's agent calls 0G Sealed Inference: TEE decrypts the VC inside the enclave, evaluates the policy predicate, emits a receipt with the result + policy hash + agent commitment + attestation digest. The enclave's signing key is bound into the TEE attestation REPORTDATA. Receipt logged on 0G Chain via `CompassHub.issueReceipt`. The clinic sees the receipt; the clinic never sees Maria.

## Honest limits

This is hackathon-grade. Read `docs/honest-limits.md` for the full disclosure list. Highlights:
- Three demo issuers (HELP for Domestic Workers, Bethune House, MFMW) are **mocked** local fixtures, not real NGOs
- Trust list governance is **stubbed** — owner-managed for v1, needs DAO for production
- On-chain `verifyAttestation` is a **stub** — RA quote verification too expensive on-chain, real verification happens off-chain in the enclave service
- SD-JWT VC pinned to draft-ietf-oauth-sd-jwt-vc-15 (the underlying SD-JWT primitive is RFC 9901 stable, but the VC profile is in flux)

## Replicate a receipt yourself — *roadmap, Day 24 / Phase 10.5.5*

The judge-replicable verify-receipt CLI is a roadmap item (built in Phase 10.5.5 of the locked plan). It will reproduce the receipt digest from public on-chain inputs + the canonical 0G TEE provider's attestation quote + the policy JSON. **Status today: scaffolded, not built.** It depends on (a) the canonical 0G TEE provider being pinned in Phase 6a.1 and (b) at least one real receipt anchored on Aristotle mainnet in Phase 8.

When live, the invocation will be:

```bash
git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG- && npm install
npm run verify-receipt -- --receiptId 0x…
```

Expected output: `OK — receipt verified against TEE attestation.`

Until then, the receipt's digest construction (`H(policyHash || providerChallenge || agentIdCommitment || verifierPubKey || result || expiry || credentialBundleHash)`) is documented in [`contracts/contracts/CompassHub.sol`](./contracts/contracts/CompassHub.sol) `issueReceipt` NatSpec, and the locked Plan-B enclave-key TEE-binding requirement is documented in `docs/honest-limits.md`.

## License

MIT — see [LICENSE](./LICENSE).

## Build credits

Solo build by Stephen Sookra (KSU CS sophomore, Atlanta). Built with Claude Code Opus 4.7 + Codex GPT-5.5 + Gemini 2.5 Pro under the Sookra Methodology framework. Thanks to the 0G Labs team and HackQuest for the infrastructure and the platform.
