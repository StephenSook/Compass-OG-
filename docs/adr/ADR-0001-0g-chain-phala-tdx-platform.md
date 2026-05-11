# ADR-0001: 0G Chain (Aristotle) + Phala dstack TDX as the privacy platform

**Status:** Accepted
**Date:** 2026-05-11
**Author:** Stephen Sookra
**Supersedes:** N/A

## Context

Compass needs a public ledger for receipts of eligibility checks (so a clinic can prove a worker qualified for help) **and** a sealed compute environment that can hold a worker's SD-JWT VC long enough to evaluate it against a policy — without ever exposing the disclosures off-enclave. The hackathon is **0G APAC 2026 Track 5 — Privacy & Sovereign Infrastructure**, so the on-chain side is constrained to the 0G stack (chainId 16602 Galileo testnet, chainId 16661 Aristotle mainnet). The enclave side is **open** to anything the team can productionize in eight weeks.

Constraints driving the decision:

- Hackathon timeline (~8 weeks total, ~5 weeks to first deploy).
- Solo build; no second engineer to share TEE ops with.
- Receipts must be cheap (≤$0.001 per mint) so the system stays useful for high-volume intake clinics.
- Verifier must be reproducible by any third party in <60 seconds from a single `receiptId` — without trust in the operator.
- TEE compose-hash binding must be auditable on a chain Compass can also use for receipts. (Two-chain bridging would double the trust surface and the audit story.)

## Decision

We use **0G Chain (Aristotle mainnet, chainId 16661)** for `AgentRegistry` + `CompassHub` + `ReceiptIssued` events, and **Phala dstack-0.5.9 production-channel CVMs (Intel TDX)** for the receipt-signing enclave. The enclave's deterministic-key-sealed-to-MR_TD primitive plus per-receipt RA quote (see [ADR-0003](./ADR-0003-per-receipt-quote-binding.md)) provides the cryptographic root the verifier chain unwinds to.

## Alternatives Considered

### Aztec Network (zkSNARK-rolled L2 with private state)

- **Pros:** Native private state; zkSNARK proofs are universally verifiable; no TEE trust assumption.
- **Cons:** Requires authoring privacy-preserving circuits per policy (Compass has 3+ policies and growing); proving time runs into 30–120s on consumer hardware; circuit-level changes require a re-trusted setup or PLONK-class universal setup; aliens-to-judges if they expect to read Solidity.
- **Rejected because:** Hackathon track is 0G-specific (Aztec would mean *no* on-chain integration with the prescribed ecosystem); writing privacy circuits for 3 policies in 8 weeks is unrealistic for one engineer; and Compass actually needs a *sealed enclave* not a *proof system* — the TEE is doing policy evaluation that involves text-fielded SD-JWT disclosures, which is awkward to express in arithmetic circuits.

### Aleph Zero (Substrate + ZK + Liminal TEE)

- **Pros:** Privacy-preserving smart contracts on Substrate; ink! contract language; built-in confidential compute via Liminal.
- **Cons:** Not in the 0G ecosystem; Aleph TEE primitives less battle-tested than Phala dstack (which has been live for 3+ years and has a documented production-channel separate from DEV); Substrate ink! contracts would not bridge cleanly to Track-5 judging expectations of Solidity + EVM.
- **Rejected because:** Track 5 mandates 0G integration; switching to a Substrate L1 forfeits the entire submission.

### Bare Intel SGX (Gramine + OpenEnclave)

- **Pros:** Most mature TEE in production (Signal Messenger, MobileCoin); large body of audit work.
- **Cons:** SGX has been **end-of-lifed on consumer CPUs** since Q3 2025 (Intel 12th gen+); only Xeon-Scalable EPC pages remain; running on cloud SGX requires Azure Confidential Computing or AWS Nitro Enclaves, neither of which integrate cleanly with the 0G ecosystem; per-CPU enclave key has no remote-attestation chain that matches dstack's `composeHash` model.
- **Rejected because:** Long-term ecosystem viability is the inverse of what we need; Phala has explicitly committed to TDX through 2030 and ships a dstack image registry; the SGX route would add a third party (Azure/AWS) the judge has to trust on top of the chain operator.

### AMD SEV-SNP

- **Pros:** VM-level isolation (whole-VM enclave, not per-process), large memory pages OK for SD-JWT VC processing.
- **Cons:** No production TEE-as-a-service mirror of dstack on the 0G side; provider list is narrower; remote attestation primitive (SEV-SNP attestation report) is solid but lacks the `composeHash` notion that lets a verifier pin a specific image without re-doing the platform-attestation chain themselves.
- **Rejected because:** Bringing our own cloud (AWS/GCP SEV-SNP) breaks the Track-5 "use 0G primitives" expectation; Phala dstack TDX provides the same trust properties with a one-click deploy + a `getQuote()` SDK call.

### 0G TeeML (native to the ecosystem)

- **Pros:** First-party 0G primitive; ecosystem alignment.
- **Cons:** As of 2026-05, 0G TeeML is **not yet GA**; access is via private waitlist; the attestation-chain documentation lags Phala's by 6–12 months; we cannot produce the live `dstack-0.5.9` evidence Track 5 expects.
- **Rejected because:** Not available in time. The architecture is designed so that swapping Phala dstack → 0G TeeML is a single-file change (`enclave/src/dstack-client.ts`) once 0G TeeML is GA — see [ADR-0003](./ADR-0003-per-receipt-quote-binding.md) for the verifier-side substitution surface.

## Consequences

### Positive

- One chain (0G Aristotle) handles registry, hub, and receipts — single audit story, single explorer (`chainscan.0g.ai`).
- Phala dstack provides a `composeHash` that pins the exact enclave image; verifier just needs to know this 32-byte hash to trust any receipt signed by the enclave's derived key.
- Per-receipt mint cost on Aristotle is sub-cent; per Galileo telemetry, `consumeGrantAndIssueReceipt` is ~165k gas at ~1 gwei → fractions of a cent.
- The `getKey` / `getQuote` / `info` SDK surface is small enough that a verifier CLI can be written from scratch in <500 LOC ([`enclave/scripts/verify-receipt.ts`](../../enclave/scripts/verify-receipt.ts), [`app/src/lib/verifyReceipt.ts`](../../app/src/lib/verifyReceipt.ts) browser port).

### Negative

- We accept the Intel-TDX trust assumption (Intel as platform vendor + Phala as operator). [`docs/honest-limits.md`](../honest-limits.md) §3 documents this explicitly. A purely cryptographic proof of policy evaluation would be preferable but is not achievable in the hackathon window.
- The Phala CVM costs $0.04/day idle (per memory in `project_phala_billing.md`); it must be **started** before any demo or live mint. Receipts cannot be minted while the CVM is off. This is operationalized via [`/api/tee-status`](../../app/src/app/api/tee-status/route.ts) and the README "See it live" notice.
- 0G Aristotle mainnet OG must be acquired via CEX or bridge; no ecosystem credits available for hackathon mainnet (per memory `project_og_funding_replies.md`). Mainnet deploy is gated on user funding.

### Neutral

- Two chains live (Galileo testnet + Aristotle mainnet) — the codebase switches via `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` and the `activeChain()` / `activeCompassHub()` / `activeAgentRegistry()` helpers. Verifier-side: `composeHash` is the same on both; only the on-chain `ReceiptIssued` event source changes.
- The TEE image is open-source ([`enclave/`](../../enclave/) + `docker-compose.yaml`); the `composeHash` is reproducible by any third party who rebuilds the image.

## References

- [`enclave/src/dstack-client.ts`](../../enclave/src/dstack-client.ts) — dstack SDK call sites.
- [`enclave/phala/deploy.md`](../../enclave/phala/deploy.md) — production deploy runbook.
- [`docs/notes/phala-deployment.md`](../notes/phala-deployment.md) — live evidence pins.
- [`docs/threat-model.md`](../threat-model.md) §3, §4, §6 — TEE trust assumptions.
- [ADR-0003](./ADR-0003-per-receipt-quote-binding.md) — per-receipt quote binding rationale.
