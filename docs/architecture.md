# Compass Architecture

> Private eligibility firewall on 0G. Two on-chain contracts, three off-chain
> services. Single-principal soulbound Agent INFTs. Bounded-disclosure receipts.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (app/) — Next.js 14 + Privy embedded wallet       │
│   • Maria onboards, mints Agent, uploads VC, requests       │
│     eligibility, views receipt, sees /clinic/subpoena       │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Off-chain Enclave (enclave/) — TypeScript node service     │
│   • SD-JWT VC issuer (mocked NGOs)                          │
│   • SD-JWT VC verifier + policy evaluator                   │
│   • 0G Storage upload (AES-256-GCM client-side encrypted)   │
│   • 0G Sealed Inference broker (TeeML / dstack TDX —        │
│     receipt key bound into REPORTDATA, see honest-limits §5b)│
│   • Receipt construction per docs/schemas/receipt-v1.json   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│ 0G Storage               │    │ 0G Compute (Sealed Inference)│
│ • Encrypted VC vaults    │    │ • TEE policy evaluation      │
│ • Merkle-rooted permanent│    │ • Receipt signed by key      │
│   archive                │    │   bound into TDX REPORTDATA  │
│ • Off-chain content      │    │   (recovered signer match)   │
└──────────────────────────┘    └──────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│  0G Chain (Aristotle mainnet — Galileo testnet for staging) │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  contracts/AgentRegistry.sol     contracts/CompassHub.sol    │
│  ──────────────────────────      ──────────────────────────  │
│  • ERC-721 + soulbound _update   • EIP-712 "Compass" v1      │
│  • mintAgent (zero-hash reject)  • IAgentRegistry binding    │
│  • updateMetadata (owner-gated)  • consumeGrant Authwit-style│
│  • authorizeUsage (ERC-7857)     • Policy registry (admin    │
│  • attestEligibility (oracle)    │   = first registrant)     │
│  • verifyAttestation v1 stub     • issueReceipt (oracle-only,│
│  • setOracle (owner-only)        │   dedup, expiry-checked)  │
│                                   • setOracle / xfer admin   │
└─────────────────────────────────────────────────────────────┘
```

## Trust boundaries

| Component | Trusted by | Trust assumption |
|---|---|---|
| Privy wallet | Maria | Embedded wallet doesn't leak key |
| AES-256-GCM | All | NIST-vetted; **never** nonce-reuses |
| SD-JWT VC issuer (NGO) | Verifier | Issuer keypair held honestly |
| 0G Storage | All | Merkle-rooted archive returns same bytes |
| 0G Sealed Inference TEE | Provider + verifier | dstack TDX measures the full VM image + Compose hash + container digests. Receipt-signing key derived inside the TEE; corresponding Ethereum address bound into the TDX quote's `report_data` field. Verifier runs Intel DCAP / dstack verifier and checks recovered signer matches embedded address — hardware-bound enclave-born key proof. See `docs/honest-limits.md` §5b. |
| AgentRegistry | CompassHub | ownerOf(tokenId) is canonical agent owner |
| CompassHub | Provider | Receipt log is append-only + dedup-checked |

## Single-principal model

Maria's Privy-derived secp256k1 key plays four roles:
1. EVM owner of `AgentRegistry` tokenId (soulbound — cannot be transferred)
2. EIP-712 signer for `CompassHub.consumeGrant` (verified via
   `recovered == agentRegistry.ownerOf(g.agentTokenId)` — `UnauthorizedSigner`
   if mismatch)
3. SD-JWT VC `cnf` claim (presentation keybinding)
4. Authwit Grant signer

A judge can verify "the holder, the agent owner, and the grant signer are the
same principal" from public on-chain data + the VC.

## Receipt lifecycle

1. Provider sends fresh `challenge` + `policyId` to Maria's app
2. App signs Authwit Grant via Privy → POSTs to enclave
3. Enclave fetches encrypted VC bundle from 0G Storage by Maria's `agentId`
4. Enclave decrypts inside TEE (AES-256-GCM, key wrapped via Privy device key)
5. Enclave loads canonical policy JSON from `docs/policies/<policyId>.json`
6. Enclave evaluates predicate
7. Enclave constructs receipt per `docs/schemas/receipt-v1.json`
8. Enclave signs the canonicalized receipt with the key derived inside the
   dstack TDX VM. The corresponding Ethereum address is bound into the TDX
   quote's `report_data` field on boot.
9. Provider calls `broker.inference.verifyService(...)`; consumer-side
   verifier runs Intel DCAP (or dstack verifier) on the quote, then asserts
   the signer recovered from the receipt signature equals the Ethereum
   address embedded in `report_data` — proves the key was generated inside
   this exact attested image. See honest-limits.md §5b.
10. Provider calls `CompassHub.issueReceipt(receiptId, policyId, resultHash,
    expiry, attestationDigest)` — emits event with bucketed timestamp.
    Same tx emits `GrantConsumed` carrying agentIdCommitment (NOT raw
    tokenId — fixed Day 3 to prevent on-chain correlation to Maria).
11. Receipt is now public-readable but non-identifying. The
    `/clinic/subpoena` page renders this exact event log

## What's deployed where

| Network | Status |
|---|---|
| Galileo Testnet (16602) | Deploy targets — Phase 2.11 / 3a.8 |
| Aristotle Mainnet (16661 / possibly 16600 — see docs/notes/0g-ecosystem-status.md) | Phase 8 (Day 24) |

## Composition of Compass primitives outside Track 5

The same architecture serves DV survivors (shelter eligibility), foster youth
aging out (housing eligibility), undocumented immigrants (emergency healthcare
eligibility), journalists' sources (whistleblower-program eligibility). One
protocol, many vulnerable populations. Maria is the lead persona.
