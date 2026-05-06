# Honest Limits — What Compass Does NOT Protect Against

## Compass v1 does NOT:

### 1. Defeat physical coercion

If an abuser, employer, or state agent forces Maria to unlock the app and
produce a receipt at gunpoint or under threat, Compass cannot prevent that.
It can only ensure the receipt itself is non-identifying. The "blast radius"
framing is honest about this.

### 2. Provide network-layer anonymity

IP addresses, wallet-to-wallet transaction correlation, and TLS fingerprints
are out of scope. Production deployments should sit behind Oblivious HTTP or
a privacy CDN. We don't ship that today.

### 3. Use real NGO issuers

The three demo issuers in the demo (HELP for Domestic Workers, Bethune House
Migrant Women's Refuge, Mission for Migrant Workers) are **mocked** local
fixture issuers. We have not partnered with these organizations. Their names
appear in the demo for narrative authenticity; the actual issuer keys are
in `enclave/keys/*-issuer.key.json` (gitignored fixtures).

### 4. Decentralized trust list governance

The `trustListRoot` per agent and the policy registry's `policy.admin` field
are owner-managed in v1. Production needs a DAO / multi-attestor consensus
for adding/removing trusted issuers. We document the gap; we don't fix it.

### 5. On-chain TDX RA quote verification

`AgentRegistry.verifyAttestation` is a v1 STUB — it requires non-empty quote
bytes and otherwise returns true. Real TDX Remote Attestation quote
verification is too expensive to do on-chain. The off-chain enclave service
verifies quotes against the canonical 0G TEE provider's measurement, and
the verify-receipt CLI (Phase 10.5.5 — coming Day 24) reproduces the chain.

### 6. SD-JWT VC standards stability

We pin `@sd-jwt/sd-jwt-vc` to a draft-stage IETF profile. The underlying
SD-JWT selective-disclosure primitive is published as RFC 9601 (December
2024); the VC profile (draft-ietf-oauth-sd-jwt-vc) is still moving. Re-pin
on each draft increment. Production deployments should track the IETF
OAuth working group's progress.

### 7. Cross-issuer threshold trust

A single issuer compromise breaks any policy that lists that issuer in its
trust set. We do not implement BBS+ or threshold signatures for credential
attestation. Documented future work.

### 8. Fully unlinkable cross-policy presentations

Each grant carries a unique nullifier; across distinct grants, nullifiers
are unlinkable without additional metadata correlation. Full presentation
unlinkability across verifiers would require BBS+ signatures or
zero-knowledge proofs of knowledge — out of scope for v1.

### 9. Differential privacy budget across receipts

A motivated adversary observing many receipts over time can build statistical
inferences. Each policy declares a `minAnonymitySet` on registration but we
don't track receipt-volume budgets per agent. Documented future work.

### 10. Article 17 GDPR full compliance

PII is kept off-chain and we use crypto-shredding (key destruction) as the
deletion mechanism. We do not have a clean GDPR controllership map for a
decentralized chain. We follow the EDPB-aligned pattern (personal data
off-chain, references/hashes/proofs on-chain) but do not claim full RTBF
compliance.

### 11. Mainnet ecosystem-credit grant

Mainnet deploy needs real OG tokens. There is no mainnet faucet for
hackathon participants per the 0G Telegram bug-report channel. Builders
either bridge from Ethereum (low-single-digit USD via Interport, ~$10-20
via XSwap; verify at deploy time) or qualify for an ecosystem grant after
deployment. v1 demo runs on Galileo testnet (16602); mainnet deploy is
pending.

### 12. `oid4vc-ts` transport

The OpenID for VC issuance / presentation transport (`oid4vc-ts`) is
intentionally NOT integrated. Compass's "issuer" is a local mock for the
demo — there is no real OID4VCI flow to a wallet. Adding the transport
layer would consume 2–4 days for zero demo gain. Documented decision.

### 13. Mainnet Cancun EVM compatibility verification

We compile with `evmVersion: cancun` because OpenZeppelin v5 uses `mcopy`
(a Cancun opcode). If 0G mainnet runs a fork without Cancun support,
contract deployment fails. Galileo testnet deployment is the verification
step — bump to OpenZeppelin v4.x (paris-compatible) if needed before
mainnet deploy.

---

## What Compass v1 DOES protect

To be clear:

- **The receipt itself is non-identifying.** The on-chain `ReceiptIssued`
  event contains only
  `{receiptId, policyId, nullifier, agentIdCommitment, resultHash, expiry,
  attestationDigest, timestampBucket}` — no name, no HKID, no employer,
  no documents.
- **The clinic never holds raw credentials.** They flow into the TEE,
  the policy evaluates inside the TEE, only the receipt comes out.
- **Single-principal binding is enforced on-chain.** `consumeGrant` recovers
  the EIP-712 signer and matches against `agentRegistry.ownerOf(agentTokenId)`.
  The agent INFT is soulbound; ownership cannot be transferred away.
- **Receipts are replay-protected.** `usedReceiptIds` mapping; `usedNullifiers`
  mapping. Both monotonic — proven via `inv-1` and `inv-4` invariant tests.
- **Bounded disclosure is the load-bearing claim.** Even under subpoena
  pressure, the clinic can disclose only the receipt log — never the
  credential, never Maria's identity.

---

*This document is referenced in the README, the threat model, and is the
basis for the "What's Real / What's Mocked" table judges will read first.*
