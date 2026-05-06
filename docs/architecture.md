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
│   • 0G Sealed Inference broker (TeeML — Plan B primary,     │
│     Plan A explored)                                        │
│   • Receipt construction per docs/schemas/receipt-v1.json   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│ 0G Storage               │    │ 0G Compute (Sealed Inference)│
│ • Encrypted VC vaults    │    │ • TEE policy evaluation      │
│ • Merkle-rooted permanent│    │ • Receipt-hash bound into    │
│   archive                │    │   TDX REPORTDATA (Plan B)    │
│ • Off-chain content      │    │ • Provider attestation quote │
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
| AES-256-GCM | All | NIST-vetted; correct nonce reuse |
| SD-JWT VC issuer (NGO) | Verifier | Issuer keypair held honestly |
| 0G Storage | All | Merkle-rooted archive returns same bytes |
| 0G Sealed Inference TEE | Provider + verifier | TDX attestation valid; no >1-day side-channel exploits |
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
8. Enclave-born signing key signs the canonicalized receipt
9. Receipt-hash + enclave pubkey embedded into `processResponse` content (Plan B)
10. 0G TEE signature covers the content; attestation quote returned
11. Provider verifies enclave key was bound into TEE REPORTDATA, then
    enclave-key signature, then 0G TEE signature
12. Provider calls `CompassHub.issueReceipt(receiptId, policyId, resultHash,
    expiry, attestationDigest)` — emits event with bucketed timestamp
13. Receipt is now public-readable but non-identifying. The `/clinic/subpoena`
    page renders this exact event log

## What's deployed where

| Network | Status |
|---|---|
| Galileo Testnet (16602) | Deploy targets — Phase 2.11 / 3a.8 |
| Aristotle Mainnet (16661 / possibly 16600 — see docs/notes/0g-ecosystem-status.md) | Phase 8 (Day 24) |

## Composition of Compass primitives outside Track 5

The same architecture serves DV survivors (shelter eligibility), foster youth
aging out (housing eligibility), undocumented immigrants (emergency healthcare
eligibility), journalists' sources (whistleblower-program eligibility). One
protocol, many vulnerable populations. Maria is the lead persona; the
architecture is the moat.
