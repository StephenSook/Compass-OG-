# Compass — Private Eligibility Firewall on 0G

> **Prove eligibility, not identity.**

A private eligibility firewall on 0G — vulnerable migrant workers prove they qualify for services through an autonomous agent, while clinics receive only non-identifying receipts.

**Track 5 — Privacy & Sovereign Infrastructure**, 0G APAC Hackathon 2026.

---

## See it live

| Layer | URL |
|---|---|
| Frontend | <https://app-psi-pied.vercel.app> |
| TEE receipt-signer | <https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network> |
| AgentRegistry (0G Galileo) | [`0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8`](https://chainscan-galileo.0g.ai/address/0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8) |
| CompassHub (0G Galileo) | [`0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b`](https://chainscan-galileo.0g.ai/address/0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b) |
| Container image | `ghcr.io/stephensook/compass-enclave:1.0.3` |
| Repo | <https://github.com/StephenSook/Compass-OG-> |

The Phala CVM is stopped between demos to save free credits. Click **Start** in the Phala dashboard before judging — receipts cannot be minted while the CVM is off, but the historical attestation evidence is permanent (see [docs/notes/phala-deployment.md](./docs/notes/phala-deployment.md)).

---

## The "shouldn't be possible" moment

Open the [subpoena scene](https://app-psi-pied.vercel.app/clinic/subpoena). Under a PDPO §57 disclosure order, the clinic produces this and only this:

```
14:32 on May 18, 2026 — Someone qualified for free legal assistance.
That's all that exists.
```

No name. No HKID. No employer. No documents. No fields a subpoena can pry open.

---

## Maria's story

Maria works 16 hours a day in a Hong Kong apartment. When she needs free legal help, she should not have to hand over her passport, her contract, and her HKID just to ask the question. Compass lets her prove "I'm an FDH in HK with an open employment dispute" without disclosing who she is. Her credentials stay encrypted on her device. The clinic learns only a bucketed timestamp and a cryptographic commitment.

Maria is a composite — built from research, not a real person. The persona is inspired by the work of [HELP for Domestic Workers](https://helpforfdws.org/), [Bethune House Migrant Women's Refuge](https://www.bethunehouse.org/), and [Mission for Migrant Workers](https://www.migrants.net/) in Hong Kong.

---

## What's real / what's mocked

| Component | Status | Note |
|---|---|---|
| AgentRegistry contract | **real** | ERC-7857 stripped, Galileo deployed |
| CompassHub contract | **real** | policies + Authwit + receipts, Galileo deployed |
| 0G Storage encrypted vaults | draft | AES-256-GCM round-trip on Node CLI; live 0G upload behind `COMPASS_LIVE_STORAGE=1`; browser-side flow is v2 |
| Receipt-signer service | **real** | dstack TDX dual-boot, per-receipt quote freshness binding |
| Phala Cloud TDX deploy | **real** | live: signer `0xaba6…a7e7`, composeHash `0x1884…cea0` |
| Vercel frontend | **real** | 11 routes serving 200, including `/vault` and the env-gated `/onboard` Privy flow |
| SD-JWT VC issuers (HELP, Bethune, Hospital) | mocked | real NGOs; signing keys are local Ed25519 fixtures, not endorsed by the NGOs |
| Trust list governance | stubbed | owner-managed for v1; production needs DAO |
| On-chain `verifyAttestation` | stubbed | off-chain enclave verification only |
| 0G broker `processResponse` co-signature | draft | out of scope for v1; receipt has its own signature chain |
| Privy embedded wallet integration | draft | wired in `/onboard` step 1 + root provider; live behind `NEXT_PUBLIC_PRIVY_APP_ID`, fixture timer in default build (see `docs/privy-setup.md`) |
| `/onboard` step 2 — live `mintAgent` | draft | Privy embedded wallet → `AgentRegistry.mintAgent` on Galileo (`0x461eda…3C2D8`), gated on user-funded gas via faucet; fixture timer when Privy is unset |
| Mainnet (Aristotle) deploy | pending | Galileo testnet only today; Phase 8 work |

This table also lives at [/about](https://app-psi-pied.vercel.app/about) on the frontend, with the same status badges.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  USER DEVICE  · Next.js · user-controlled EOA        │
│  • secp256k1 key (Privy wired; fixture by default)   │
│  • AES-256-GCM vault encryption                      │
│  • SD-JWT VC selective disclosure                    │
└────────────────────────┬─────────────────────────────┘
                         │  encrypted vault upload
                         ▼
┌──────────────────────────────────────────────────────┐
│  0G STORAGE  · Galileo testnet · encrypted blob      │
│  • ciphertext SD-JWT bundle                          │
│  • Merkle root → AgentRegistry.encryptedURI          │
└────────────────────────┬─────────────────────────────┘
                         │  selectively-disclosed claims
                         ▼
┌──────────────────────────────────────────────────────┐
│  0G TeeML / PHALA dstack TDX                         │
│  • dstack-derived secp256k1 signer                   │
│  • per-receipt quote: report_data binds              │
│    sha256(ethAddress || composeHash || receiptId)    │
│  • policy evaluator → eligible/denied                │
└────────────────────────┬─────────────────────────────┘
                         │  ReceiptIssued
                         ▼
┌──────────────────────────────────────────────────────┐
│  0G CHAIN  · AgentRegistry + CompassHub              │
│  • soulbound INFT (agent identity)                   │
│  • Authwit grants + nullifier replay protection      │
│  • ReceiptIssued event (15-min bucketed timestamp)   │
└──────────────────────────────────────────────────────┘
```

Visual + section-by-section breakdown: [/about](https://app-psi-pied.vercel.app/about).

---

## 0G integration

| Component | 0G Layer | Role |
|---|---|---|
| Agent ID | 0G Chain ([AgentRegistry](https://chainscan-galileo.0g.ai/address/0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8)) | Soulbound INFT bound to user EOA; carries encrypted vault URI |
| Encrypted vault | 0G Storage | AES-256-GCM ciphertext of SD-JWT bundle; root hash on-chain |
| Sealed inference | 0G TeeML / Phala dstack TDX | Receives selectively-disclosed claims; signs receipt with sealed key |
| Receipt log | 0G Chain ([CompassHub](https://chainscan-galileo.0g.ai/address/0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b)) | ReceiptIssued: receiptId, policyId, nullifier, agentIdCommitment, resultHash, attestationDigest, expiry, 15-min timestamp bucket |

---

## Replicate the TEE binding yourself

Two scripts let any judge re-verify the cryptographic chain independently. Clone, install, run:

```bash
git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG-/enclave && npm install --legacy-peer-deps
```

### A. Verify the live deploy's attestation

```bash
npm run verify-deploy -- \
  https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network
```

Expected output (when CVM is running):

```
[verify-deploy] /health source=tee signer=0xaba6b92ff8199275eb090c9b3049141fd431a7e7
[verify-deploy] ethAddress:    0xaba6b92ff8199275eb090c9b3049141fd431a7e7
[verify-deploy] composeHash:   0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
[verify-deploy] running verifyReportDataBinding...
[verify-deploy] OK — quote binds to (ethAddress, composeHash)
```

Captured evidence: [docs/notes/phala-deployment.md](./docs/notes/phala-deployment.md).

### B. Verify a receipt end-to-end (offline OR live)

```bash
# Offline — verifies the bundled sample receipt without needing Phala running
npm run mint-sample-receipt        # generates enclave/samples/receipt-sample.json
npm run verify-receipt -- --sample \
  --expected-compose 0xabababababababababababababababababababababababababababababababab

# Live — mints a fresh receipt against the running Phala CVM and verifies it
npm run verify-receipt -- \
  --live https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network \
  --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
```

Expected output (PASS):

```
[verify-receipt] ✓ attestationDigest = sha256(canonicalize(receipt))
[verify-receipt] ✓ signature ECDSA-recovers to claimed signer
[verify-receipt] ✓ receipt.quoteCommitment = sha256(perReceiptQuoteHex)
[verify-receipt] ✓ quote report_data binds (signerAddress || composeHash || receiptId)
[verify-receipt] PASS — receipt verified against TEE attestation.
```

Tampering produces explicit failure codes (`REPORT_DATA_MISMATCH`, `QUOTE_COMMITMENT_MISMATCH`, `ENV_MODE_RECEIPT`, `QUOTE_VERSION_UNSUPPORTED`) — see [`enclave/src/verify-attestation.ts`](./enclave/src/verify-attestation.ts).

Out of scope (next layer): full Intel DCAP verification of the TDX quote signature chain — run via the DStack Verifier or Intel QVL externally.

---

## Whitepaper

3-page technical whitepaper covering threat model, architecture,
cryptographic protocol, honest limits, and roadmap:
[`docs/whitepaper.pdf`](./docs/whitepaper.pdf) (markdown source:
[`docs/whitepaper.md`](./docs/whitepaper.md)).

---

## Pillar 5 — Honesty about traction

| # | Target | Type | Drafted | Sent | Replied |
|---|--------|------|---------|------|---------|
| 1 | HELP for Domestic Workers | NGO (persona check) | 2026-05-10 | — | — |
| 2 | Bethune House Migrant Women's Refuge | NGO (persona check) | 2026-05-10 | — | — |
| 3 | Mission for Migrant Workers | NGO (community check) | 2026-05-10 | — | — |
| 4 | Open Society Foundations | Foundation | 2026-05-10 | — | — |
| 5 | Luminate | Foundation | 2026-05-10 | — | — |
| 6 | HK Jockey Club Charities Trust | Foundation | 2026-05-10 | — | — |

Drafts live at [`docs/outreach/`](./docs/outreach/README.md). Even
no-response counts: silence after a logged-and-dated send is a more
honest traction signal than no contact at all. The `Sent` and `Replied`
columns update post-send.

---

## Ecosystem citizenship — `compass-eligibility-check` skill

The receipt verifier above is also packaged as a reusable Claude Code /
OpenClaw skill at [`skills/compass-eligibility-check/`](./skills/compass-eligibility-check/SKILL.md).
Any agent or CI step in the 0G ecosystem can install it and ask
"is this Compass receipt valid?" without needing to clone the full repo
or wire the TEE chain by hand.

Skill inputs:

- a `receiptId` from a `ReceiptIssued` event on Galileo or Aristotle
  CompassHub (live mode), OR
- a saved JSON bundle `{receipt, attestationDigest, signature,
  signerAddress, perReceiptQuoteHex}` (offline mode), OR
- the bundled sample fixture (no network needed)

Skill output: structured JSON with `verified: true/false` plus the
recovered `signerAddress`, `composeHash`, `policyId`, `timestampBucket`,
`agentIdCommitment`, and per-check pass/fail (`attestationDigestMatch`,
`signatureRecovers`, `quoteCommitmentMatch`, `reportDataBinding`,
`composeHashTrusted`).

Why publish it as a skill: per Track 5's ecosystem-citizenship criterion,
shipping reusable primitives multiplies the project's value beyond a
single demo. The skill format means a downstream agent — clinic intake
bot, partner NGO compliance check, audit pipeline — can verify Compass
receipts with one tool call.

---

## Live attestation evidence (pinned)

| Field | Value |
|---|---|
| Phala URL | `https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network` |
| TEE signer eth address | `0xaba6b92ff8199275eb090c9b3049141fd431a7e7` |
| dstack `composeHash` | `0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0` |
| Phala app ID | `65c93172e22403466eecee47dd1cc90375014a0f` |
| Phala instance ID | `0263ebb91641237ca840f3b46e6f3d56920197ae` |
| Image digest | `sha256:f3ed653050216ee4ad6a332e6e38d02c5d0166ff33b55ff80acd9973ae2727d1` |
| dstack runtime | `dstack-0.5.9` (production channel, not DEV) |
| Quote version | TDX v4 (10020 hex chars) |
| Signature chain entries | 2 |
| Bound at | 2026-05-08T01:38:14 UTC |

---

## On-chain deployments

| Network | Contract | Address |
|---|---|---|
| 0G Galileo (chainId 16602) | AgentRegistry | [`0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8`](https://chainscan-galileo.0g.ai/address/0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8) |
| 0G Galileo (chainId 16602) | CompassHub | [`0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b`](https://chainscan-galileo.0g.ai/address/0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b) |
| 0G Aristotle (mainnet) | — | pending — Phase 8 |

Deployer: `0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34`. Deployment record: [docs/deployments/](./docs/deployments/).

---

## Quickstart (local dev)

```bash
# Clone
git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG-

# Frontend
cd app && npm install && npm run dev          # → http://localhost:3000

# Receipt-signer (env mode — for development without dstack)
cd ../enclave && npm install --legacy-peer-deps && npx tsc
COMPASS_FORCE_LOCAL=1 \
COMPASS_RECEIPT_SIGNER_KEY=0x0000000000000000000000000000000000000000000000000000000000000001 \
  node dist/server.js                          # → http://localhost:8080/health

# Tests
cd enclave && npx vitest run                   # 103 passed | 3 skipped
cd ../contracts && npx hardhat test            # 40+ unit tests + 5 invariants
```

Production TEE deploy via Phala Cloud: see [enclave/phala/deploy.md](./enclave/phala/deploy.md).

---

## Tech stack

- **Solidity 0.8.24** + **Hardhat** for AgentRegistry + CompassHub
- **TypeScript 5.6** for receipt-signer (Express) + holder/issuer/verifier
- **Next.js 16** App Router + Tailwind v4 (Cinematic Privacy aesthetic)
- **Intel TDX** via **Phala dstack-0.5.9** for the sealed enclave
- **`@phala/dstack-sdk@0.5.7`** for `getKey` / `getQuote` / `info`
- **`@noble/curves`** secp256k1 + **`@noble/hashes`** keccak256/sha256 for receipt signing
- **`@sd-jwt/sd-jwt-vc`** + **`@sd-jwt/jwt-status-list`** for credential issuance + revocation
- **`@0gfoundation/0g-storage-ts-sdk`** + **`@0gfoundation/0g-compute-ts-sdk`** for 0G integration
- **Vercel** for frontend hosting · **GHCR** for the enclave image

103 vitest tests + 95% Solidity branch coverage. CI on every push: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

---

## Documentation map

| Doc | Purpose |
|---|---|
| [docs/architecture.md](./docs/architecture.md) | Full architecture walkthrough |
| [docs/threat-model.md](./docs/threat-model.md) | 9 attack surfaces with mitigations |
| [docs/honest-limits.md](./docs/honest-limits.md) | What Compass does NOT protect against |
| [docs/schemas/receipt-v1.json](./docs/schemas/receipt-v1.json) | Canonical receipt schema (v1.2.0) |
| [docs/policies/](./docs/policies/) | Three demo eligibility policies (HELP, Bethune, Hospital) |
| [docs/notes/phala-deployment.md](./docs/notes/phala-deployment.md) | Live TEE deployment evidence |
| [docs/notes/codex-tee-architecture-review.md](./docs/notes/codex-tee-architecture-review.md) | Adversarial architecture review |
| [enclave/phala/deploy.md](./enclave/phala/deploy.md) | Phala Cloud deploy runbook |
| [enclave/src/verify-attestation.ts](./enclave/src/verify-attestation.ts) | Verifier-side TEE binding chain |

---

## Honest limits

Compass narrows disclosure but does not eliminate it. Coercion, deniable encryption, full k-anonymity against statistical re-identification, and SD-JWT VC draft churn all remain open issues. See [docs/honest-limits.md](./docs/honest-limits.md) for the full list.

The receipt-signer key is **enclave-bound** by virtue of dstack `getKey`'s deterministic-key-sealed-to-MR_TD primitive plus the per-receipt quote's `report_data = sha256(ethAddress || composeHash || receiptId)` binding. Per-receipt freshness defeats the quote-replay attack a single boot quote would leave open. Verifier-side trust chain documented in [`enclave/src/verify-attestation.ts`](./enclave/src/verify-attestation.ts).

---

## License + credits

MIT — see [LICENSE](./LICENSE).

Solo build by **Stephen Sookra** (Atlanta). Pair-coded with **Claude Opus 4.7 (1M context)**, adversarially reviewed by **Codex (GPT-5.5)** for security boundaries, **Gemini 2.5 Pro** for long-context audits.

Persona narrative inspired by the work of HELP for Domestic Workers, Bethune House Migrant Women's Refuge, and Mission for Migrant Workers in Hong Kong. Compass does not represent any real worker; the demo flow is a composite.

Built on the 0G APAC Hackathon, May 2026. Track 5 — Privacy & Sovereign Infrastructure.
