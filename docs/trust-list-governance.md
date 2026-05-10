# Trust List Governance — v1 stub → v2 DAO design

The `/about` reality table marks **Trust list governance** as `draft`
because v1 ships a working but deliberately-stubbed model:
owner-managed, off-chain-enforced, single-principal. This document is
the design spec for the v2 DAO replacement so the row can flip to
`real` when the on-chain governance ships.

## Why a trust list at all

Compass receipts only mean something if the eligibility-check evaluated
**a credential signed by an issuer Compass trusts**. The trust list is
the cryptographic boundary between "Maria's HELP-issued FDH credential
is valid" and "anyone with an Ed25519 keypair can self-issue a
credential that says is_FDH_in_HK = true."

Two attack surfaces the trust list closes:

1. **Self-issued credentials.** Without a trust list, an attacker mints
   their own SD-JWT VC claiming any predicate they like, presents it to
   the enclave, and the enclave evaluates it as `eligible: true`.
2. **Compromised issuer keys.** If HELP's signing key leaks, every
   credential it signed is forgeable until the key is rotated. The
   trust list needs revocation pathways that are faster than the
   credential expiry window.

## v1 (today, shipped)

| Component | Where | Behavior |
|---|---|---|
| Per-agent trust root | `AgentRegistry.Agent.trustListRoot` (`bytes32`) | Stored on-chain; v1 leaves it `bytes32(0)` (no enforcement) |
| Per-policy trusted issuers | `CompassPolicy.trustedIssuers` (`string[]`) | Off-chain in `docs/policies/<slug>.json`; baked into the policy hash |
| Enforcement | `enclave/src/verifier.ts` | Off-chain check that SD-JWT VC's `iss` claim ∈ `policy.trustedIssuers` |
| Issuer addition | `docs/policies/*.json` edit + redeploy | Owner-managed; whoever has commit access controls the trust list |
| Issuer revocation | Status list at `enclave/src/trust.ts` | Per-credential revocation via IETF jwt-status-list draft |

**v1 limits documented in `docs/honest-limits.md`:**
- The repo owner has unilateral authority to add/remove trusted issuers.
- Revocation latency is bounded by status-list polling cadence (default 1hr).
- Cross-issuer threshold trust ("a credential needs 2-of-3 NGOs to
  co-sign") is not supported.

## Threat model the trust list must address

| Threat | v1 mitigation | v2 must close |
|---|---|---|
| Self-issued credential | Off-chain check against fixed `trustedIssuers` list | Same, but list is on-chain + governed |
| Issuer key compromise | Manual `docs/policies/*.json` edit + redeploy | Multi-sig revocation tx, ≤ 24h propagation |
| Repo owner goes rogue | Cannot fix in v1 | DAO threshold required to add/remove issuers |
| Sybil issuer (attacker spins up an issuer DID + lobbies for inclusion) | Manual review by owner | DAO vote with public discussion period |
| Issuer drift (legitimate issuer changes keys) | Manual `trustedIssuers` update + redeploy | On-chain rotation primitive (key replacement, not issuer replacement) |

## v2 design (proposed)

### On-chain TrustList contract

```solidity
struct TrustedIssuer {
    bytes32 issuerDidHash;   // keccak256 of did:key:z6Mk...
    address rotationKey;     // can rotate the issuer's signing key
    uint64  addedAt;
    uint64  revokedAt;       // 0 if active
    bytes32 metadataURI;     // IPFS pointer to issuer name + audit
}

mapping(bytes32 => TrustedIssuer) public issuers;
```

State transitions:

- **Add:** `proposeAddIssuer(issuerDidHash, rotationKey, metadataURI)`
  → 7-day timelock → `executeAddIssuer(...)` requires DAO threshold
  signatures.
- **Revoke:** `proposeRevoke(issuerDidHash)` → 24-hour expedited
  timelock → `executeRevoke(...)` requires DAO threshold OR a single
  multi-sig "incident response" key (smaller threshold for speed at
  the cost of needing post-hoc DAO ratification).
- **Key rotation:** `rotate(issuerDidHash, newDidHash, sig)` requires
  signature from `rotationKey`. No DAO involvement — the issuer
  manages their own keys.

### DAO composition

- **5 seats minimum, 7 recommended.** Compass v2 starts with:
  - 1 seat per partnered NGO (HELP, Bethune, Bethune House, MFMW)
  - 1 seat for Compass core (governance bootstrap, exits after year 1)
  - 1 seat for an external auditor (rotates yearly)
  - 1 seat for community-elected migrant-rights advocate
- **Quorum: 4-of-7 for adds, 3-of-7 for revokes** (faster revocation).
- **Voting period: 7 days** for adds (public discussion + Telegram
  digest). 24 hours for revokes.

### Per-agent vs global trust list

v1 stores trust on the AGENT (`AgentRegistry.Agent.trustListRoot`).
That model is wrong for v2:

- Maria shouldn't need to maintain her own trust list — she's not the
  expert on which NGOs are legitimate.
- A global trust list governed by the DAO is what Compass's privacy
  promise actually rests on.

**v2 migration:** the per-agent `trustListRoot` field is repurposed
or deprecated. New deployments leave it `bytes32(0)`; the off-chain
verifier reads from the global on-chain list instead. v1 deployments
remain functional but their `trustListRoot` field becomes purely
informational.

### Cross-issuer threshold trust (v3, not v2)

A natural extension is "this credential needs to be co-signed by 2 of
3 trusted issuers" — defends against a single compromised NGO. v3
work; out of v2 scope. v2 ships single-issuer trust to keep the
governance complexity bounded.

## Migration path (v1 → v2)

1. **Deploy `TrustList` contract on Aristotle mainnet** (alongside
   AgentRegistry + CompassHub redeploy). Bootstrap with the 4 NGOs
   already named in `docs/policies/*.json`.
2. **Update `enclave/src/verifier.ts`** to read trusted issuers from
   the on-chain contract via RPC. Cache for 5 minutes; force-refresh
   on `IssuerRevoked` events seen via WebSocket subscription.
3. **Deprecate the `trustedIssuers` field in policy JSON.** Policies
   continue to declare expected VCT but no longer carry their own
   trust list.
4. **Publish DAO charter** at `docs/governance/charter.md` (TBD).
5. **Run a 30-day v1+v2 dual-write period** where both the JSON list
   and the on-chain contract are honored. v1 list is authoritative if
   they disagree (rollback safety). After 30 days, flip to on-chain
   authoritative.

## Open questions

- **Who pays gas for issuer additions?** DAO treasury vs the issuer
  themselves. v2 sketch: issuer pays. Removes a perverse incentive.
- **Can a revoked issuer's prior receipts still be verified?** Yes —
  the receipt was signed by an issuer that WAS trusted at the time of
  signing. A separate "stale receipt" check uses the receipt's `expiry`
  field; revocation does not retroactively invalidate prior receipts.
- **What about issuer-side credential revocation?** Already handled
  separately by `enclave/src/trust.ts` + the IETF jwt-status-list
  draft (per-credential revocation). The v2 trust-list governance is
  about issuer-level addition/removal, not per-credential revocation.

## v1 escape hatch

If the v1 owner-managed model is exploited (e.g., Stephen's GitHub
account is compromised), the only mitigation is to revert the
malicious `docs/policies/*.json` change. The Vercel deploy follows
`main` so the next push fixes it; in the worst case, Vercel rollback
is a 1-click operation. v2 DAO governance closes this entirely.

## References

- Per-agent `trustListRoot` declaration: `contracts/AgentRegistry.sol:19`
- Off-chain enforcement: `enclave/src/verifier.ts`
- Per-policy `trustedIssuers`: `enclave/src/types.ts:53`
- Per-credential revocation (separate concern): `enclave/src/trust.ts`
- IETF OAuth Token Status List (draft): https://datatracker.ietf.org/doc/draft-ietf-oauth-status-list/
- Honest limits item 7 (trust list governance v1): `docs/honest-limits.md`
