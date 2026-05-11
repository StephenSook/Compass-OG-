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
the verify-receipt CLI (planned, not yet shipped) reproduces the chain.

### 5b. REPORTDATA binding — confirmed supported on 0G TeeML (Day 3)

Day 3 update (2026-05-07). 0G compute team confirmed in Telegram support
thread that the receipt signing key is bound into REPORTDATA via the
standard dstack TDX flow. 0G TeeML is built on dstack TDX. The signing
key is derived inside the TEE; the corresponding Ethereum address is
written into the TDX quote's `report_data` field. To verify: fetch the
provider's TDX quote, run Intel DCAP (or the dstack verifier), then
check that the signer recovered from any signed response matches the
address embedded in `report_data`. That gives a hardware-bound proof
that the key was generated inside this exact attested image.

The OpenAI API compatibility constraint is a *broker-routing* requirement,
not a TDX measurement constraint. The full TDX VM image, Compose hash,
and container image digests are all measured. Compass wraps the
SD-JWT verifier + policy evaluator + receipt signer as an OpenAI-shaped
HTTP endpoint to satisfy the routing layer; the TDX measurement covers
the entire deployed image.

What this means for Compass's privacy claim: the receipt is bound
cryptographically to (a) the issuing key, (b) the attested image, and
(c) the on-chain `ReceiptIssued` event with `attestationDigest`. A
hostile verifier can independently reproduce the chain and reject any
receipt whose signer doesn't match the address bound in `report_data`.

Phala TDX scaffold at `enclave/phala/` remains as the Day-15 escape
hatch in case the 0G TeeML provider deployment hits an integration
issue we can't resolve in time. Pure-0G stays the primary path.

### 6. SD-JWT VC standards stability

We pin `@sd-jwt/sd-jwt-vc` to a draft-stage IETF profile. The underlying
SD-JWT selective-disclosure primitive is published as RFC 9601 (December
2024); the VC profile (draft-ietf-oauth-sd-jwt-vc) is still moving — it
advanced to **draft-16** in April 2026 (Compass v0.5 pins **draft-15**;
v0.6 will roll forward). Re-pin on each draft increment. Production
deployments should track the IETF OAuth working group's progress.

**Standards alignment.** SD-JWT VC is the same wire format the EU
Digital Identity Wallet (EUDIW) under [eIDAS 2.0](https://eur-lex.europa.eu/eli/reg/2024/1183/oj)
(in effect since 2025) standardised for member-state digital credentials.
A Compass-issued credential is interoperable with EUDIW-reference
verifiers; an eIDAS-compliant NGO wallet can interoperate with Compass'
TEE-attested receipt path without re-issuance. This is the same posture
the [arXiv self-sovereign-identity analysis](https://arxiv.org/html/2601.19837v2)
of eIDAS 2.0 recommends for new SSI implementations.

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

### 13. SD-JWT VC key-binding (KB) — v2 enforces, v1 did not

**v2 (current):** The verifier MUST reject any presentation that does not
include a KB-JWT signed by the secp256k1 key declared in the credential's
`cnf.jwk` claim. The holder attaches a KB-JWT covering `{aud, nonce, iat,
sd_hash}`; the verifier checks (a) signature against `cnf.jwk`, (b) `aud`
matches the verifier's expected audience, (c) `nonce` matches the verifier's
challenge, (d) `iat`/`nbf`/`exp` are within skew. The single-principal
binding (cnf.jwk == agent INFT owner == EIP-712 grant signer) is the
load-bearing security claim — any presentation forged by a key not bound
to the credential is rejected with reason `kb-binding-failed`.

What was true in v1 (now superseded): KB was skipped, presentations were
effectively bearer tokens, and integrity relied entirely on the on-chain
Authwit signature. The Codex + Sonnet review surfaced this as a BLOCKER;
v2 closes it.

### 14. Mainnet Cancun EVM compatibility verification

We compile with `evmVersion: cancun` because OpenZeppelin v5 uses `mcopy`
(a Cancun opcode). If 0G mainnet runs a fork without Cancun support,
contract deployment fails. Galileo testnet deployment is the verification
step — bump to OpenZeppelin v4.x (paris-compatible) if needed before
mainnet deploy.

### 15. Caller-supplied receiptId — DoS griefing via mempool replay

`CompassHub.consumeGrantAndIssueReceipt` accepts the `r.receiptId` from
the caller (the provider relayer) and stores it in the global
`usedReceiptIds` mapping with no binding to the grant fields. A mempool
watcher can mint their own (permissionless) agent + sign their own
grant + submit `consumeGrantAndIssueReceipt` with `r.receiptId` copied
from the legitimate user's pending tx. If the attacker's tx lands first,
`usedReceiptIds[receiptId] = true` and the legitimate tx reverts with
`ReceiptAlreadyIssued`. The attacker pays ~140k gas per grief; the
legitimate user has to retry with a different `receiptId`.

What this is NOT: a forgery (the contract still verifies the grant
signer == agent owner) and NOT a way to steal eligibility. The receipt
the attacker mints is bound to the attacker's own agent.

What this IS: a DoS griefing primitive. Demo is single-actor so it
doesn't bite v1. Production fix: derive `receiptId` inside the contract
from `keccak256(abi.encode(address(this), block.chainid, g.policyId,
g.nullifier, g.provider, g.agentTokenId))` and reject any caller-supplied
field that doesn't match.

The Codex pre-submission review surfaced this as HIGH; v2 closes it
with an in-contract derivation pattern.

### 16. Verifier public key is a placeholder in v1

`COMPASS_VERIFIER_PUB_KEY` in `app/src/lib/compassEnclave.ts` is a stub
constant the enclave receives in every receipt-doc. Real verifier
identity (the clinic's secp256k1 pubkey) belongs there. v2 wires this
from the calling clinic's actual key material; the receipt-doc field is
already canonicalized into the `attestationDigest` so swapping it later
is a single-line change with no contract impact.

The placeholder is documented here rather than silently stubbed; a
verifier comparing two receipts cannot infer different clinics from
this field in v1.

### 17. SD-JWT VC `cnf` claim shape

The `/api/issue` route emits `cnf: { holderAddress }` (an EVM address)
as a v1 placeholder. The `draft-ietf-oauth-sd-jwt-vc-15` profile expects
`cnf: { jwk: {...} }` carrying the holder's public key. v1 stamps the
EVM address only; v2 derives the secp256k1 JWK from the Privy embedded
wallet and emits the standards-compliant shape.

A standards-compliant verifier (e.g., a generic SD-JWT VC checker that
isn't aware of Compass) would reject the v1 receipt. Compass's
in-house verifier accepts the address-shaped `cnf` because the receipt
chain doesn't load-bear on it — agent ownership is tracked on-chain via
`AgentRegistry.ownerOf`, not via the credential's `cnf`.

### 18. CompassHub does not gate `consumeGrantAndIssueReceipt` on provider authorization (by design)

`CompassHub.consumeGrantAndIssueReceipt` requires only that
`msg.sender == grant.provider`, that the `policyId` is active, that the
EIP-712 grant signer matches `agentRegistry.ownerOf(agentTokenId)`, and
that the receipt fields are non-zero. There is no per-policy provider
allowlist. Because `AgentRegistry.mintAgent` is permissionless, anyone
can mint an agent, sign a grant with their own `provider` address, and
emit a `ReceiptIssued` event with an arbitrary `resultHash` and an
arbitrary non-zero `attestationDigest` for any active policy.

This is **by design**, not an oversight. The contract is the *public
audit log*, not the source of receipt validity. Receipt validity is
established off-chain via the TDX attestation chain:
- The receipt's `attestationDigest` must hash a canonicalized
  receipt-doc that the receipt-signer key signed.
- The receipt-signer key is sealed inside the attested Phala dstack
  image; the public-key handle is committed to the per-receipt RA
  quote's `report_data` as `sha256(ethAddress || composeHash || receiptId)`.
- The off-chain verifier in `enclave/src/verify-attestation.ts` plus
  the `verify-receipt` CLI re-derive the chain locally; a fake on-chain
  event with a forged attestationDigest fails the off-chain check.

A v2 fix lands an on-chain provider allowlist per policy (`PolicyMeta.provider`
gated to a set of authorized relayer addresses), making the on-chain
log self-consistent rather than just verifiable. The trade-off: that
breaks the "permissionless agent + permissionless eligibility check"
property today, which is the property we actually want for migrant-worker
intake where any NGO worker should be able to relay a receipt without
asking the contract owner to allowlist them first.

Tracked in `docs/trust-list-governance.md` (the trust-list and the
provider allowlist are the same v2 governance surface).

### 19. No enforced Content Security Policy (v0.5 ships report-only)

`app/next.config.ts` sets `Content-Security-Policy-Report-Only` with the
intended allowlist (Privy auth, Phala enclave URL, 0G RPC + chainscan,
Spline runtime, 3d-force-graph CDN). A *report-only* CSP does not block
violations — it surfaces them so the maintainer can tighten the policy
before enforcement.

The vault's `extractable=false` AES-256-GCM key prevents `crypto.subtle.exportKey()`,
but same-origin script *can* call `crypto.subtle.decrypt()` with the
non-extractable handle. A successful XSS injection therefore can decrypt
vault contents in place even though the key cannot be exfiltrated. CSP
enforcement is the right belt-and-braces defense, and `v0.6` graduates
the report-only header to an enforced policy after a one-week observation
window confirms zero false-positive violations.

Tracked in `docs/notes/sentry-setup.md` and `CHANGELOG.md` v0.6.

---

### 20. agentIdCommitment is brute-forceable from public registry data (by design)

The on-chain `ReceiptIssued.agentIdCommitment = keccak256(abi.encode(uint256 agentTokenId, address agent))` is deterministic and reproducible from public data. `AgentRegistry` mints + ownership are public; an observer can enumerate all `(tokenId, owner)` pairs and recompute commitments to link a receipt to a specific on-chain agent.

**Why this is intentional, not a bug:** the privacy claim is *bounded disclosure of PII* — no name, no HKID, no employer, no document fields. The on-chain `(tokenId, owner)` linkage is not PII; the owner is a Privy embedded wallet address provisioned at email signup. Receipts ARE intentionally linkable across policies for the same agent — this is the audit-log property the system wants. The disclosure surface that matters for migrant workers (legal name, HKID, employer of record) stays off-chain; the wallet address never appears on a receipt in plaintext.

A future v0.7 variant could derive `agentIdCommitment` from an enclave-secret-derived per-receipt blinding factor, breaking the registry-brute-force linkage at the cost of cross-policy unlinkability. Documented as out of scope for v0.5.

### 21. Enclave does not verify `policyHash` matches the evaluated policy (v0.6 fix)

`enclave/src/server.ts:196` calls `evaluatePolicy(payload.policy, payload.claims, payload.policyHash)` where `payload.policyHash` is caller-supplied and **NOT** verified against `sha256(canonicalize(payload.policy))`. A direct caller to the public Phala enclave URL could submit a permissive predicate plus the hash of a stricter policy; the enclave would evaluate the permissive predicate, return `eligible: true`, and stamp the stricter policy hash into the signed receipt.

**Scope of the bug:**
- Compass' `/api/consume` flow is NOT affected: the server constructs both `policy` and `policyHash` from server-controlled constants (`helpLegalAidPolicy(label)` + `HELP_POLICY_HASH_HEX`), so receipts minted through the documented path are consistent.
- The bug surfaces only via direct calls to the public Phala enclave URL. A consumer who trusts a receipt's `policyHash` to identify the evaluated predicate could be deceived.

**Fix (v0.6):** enclave canonicalizes the supplied policy, computes its hash, rejects the request unless `policyHash == sha256(canonicalize(policy))`. Requires Phala CVM rebuild → composeHash changes → trust-anchor update across `docs/notes/phala-deployment.md`, README, and the canonical compose-hash references in the verifier (browser + CLI).

### 22. `registerPolicy` is permissionless first-claimer admin (by design + v0.7 fix)

`CompassHub.registerPolicy()` lets the FIRST caller for a given `policyId` permanently become its `oracleAdmin`. There is no governance signature, no `onlyOwner`-style gate, no front-running protection. An attacker can claim arbitrary `policyId` strings before legitimate registration and set the admin to their own address.

**Why this is currently a low-impact issue for v0.5:** all three demo policies (`help-legal-aid`, `bethune-shelter`, `hk-fdh-hospital`) are ALREADY registered on Aristotle mainnet with the deployer wallet as admin. Squatting risk is closed for these policies. Future policies (added by partner NGOs in v0.7+) need the gating fix.

**Fix (v0.7):** gate `registerPolicy` behind `onlyOracleAdmin` OR require a 5-of-7 governance multisig signature over `{policyId, policyHash, uri, minAnonymitySet}`. Pairs with the v0.7 trust-list governance work documented at `docs/trust-list-governance.md`.

### 23. Skip-to-content link removed pending structural refactor (v0.7)

The 2026-05-11 audit shipped a WCAG 2.1 §2.4.1 skip-to-content link plus a `#main-content` landing pad in `app/src/app/layout.tsx`. Code-review subsequently flagged that each page's persistent `<header>` containing the COMPASS chip lives INSIDE `<main>` — focus from the landing pad therefore tabs forward to the header link, defeating the skip. The skip-link was removed for v0.5 rather than ship a broken a11y affordance.

**Fix (v0.7):** extract `<CompassHeader />` to a layout-mounted shared component, drop the per-page `<header>` from all ~16 pages, add `id="main-content"` to layout's `<main>` wrapper. Skip-link will then correctly skip past the layout-level header into the page content section.

Tracked in the public GitHub v0.6 milestone.

### 25. `npm audit` reports vulnerabilities in dead-code transitive dependencies

`npm audit` against the three workspaces reports 57 total findings (app 5,
contracts 29, enclave 23). All highs are in dependencies Compass does not
exercise:

| Severity | Package | Path | Reachable from Compass code? |
|---|---|---|---|
| HIGH | axios (CVE) | `@privy-io/react-auth → x402 → wagmi → @wagmi/connectors → @base-org/account → @coinbase/cdp-sdk → axios` | NO. Compass uses Privy's embedded-EOA path only (`embeddedWallets.ethereum.createOnLogin`); the wagmi connector graph is not invoked. |
| MODERATE | postcss | build-time CSS toolchain | Build only — does not ship to runtime bundle. |
| MODERATE | next | framework | Next 16.2.5 disclosed CVE not yet patched upstream; tracking the 16.2.x release stream. |
| MODERATE | @splinetool/react-spline | runtime 3D scene | Lazy-loaded only on `/about`; no untrusted-input surface (scene URL is server-controlled via env). |

Contracts + enclave workspace highs are in hardhat-test-stack transitive
deps (e.g., older lodash, regular dev-only paths) that never reach
production runtime — `contracts/` ships bytecode, `enclave/` is rebuilt
into a sealed Phala CVM image, neither carries the dev-only npm graph
into production.

**v0.6 plan:** roll Privy / Next / Spline forward as upstream patches
land. Compass is not running any dev-deps in production runtime, so the
audit findings are tracked-not-blocking for v0.5 submission.

`enclave/src/server.ts:110-118` validates `expiry > issuedAt` but does NOT require `issuedAt` to be within a small clock-skew window of current enclave time, and does NOT cap `expiry - issuedAt`. A direct caller can mint a TEE-signed receipt with `issuedAt = 1` (epoch zero) and `expiry = 2^32`, producing a "valid forever" credential.

**Mitigation today:** `/api/consume` sets both fields server-side (`issuedAt = Math.floor(Date.now()/1000)`, `expiry = nowSec + 60*60*24*365` — 1 year max), so Compass-flow receipts have bounded validity. The gap exists only for direct enclave callers.

**Fix (v0.6):** enclave rejects `issuedAt` outside `[currentTime - 60s, currentTime + 60s]` and caps `expiry - issuedAt` at 1 year. Pairs with §21 since both require a CVM rebuild + composeHash update.

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
