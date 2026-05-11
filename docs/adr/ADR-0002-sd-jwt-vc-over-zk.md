# ADR-0002: SD-JWT VC for selective disclosure over PCD or zkSNARK Groth16

**Status:** Accepted
**Date:** 2026-05-11
**Author:** Stephen Sookra
**Supersedes:** N/A

## Context

A worker holds a credential issued by an NGO (HELP for Domestic Workers, Bethune House, Mission for Migrant Workers) attesting to a set of facts: *FDH in HK*, *open employment dispute*, *no income above threshold*. When she requests help, the policy needs to evaluate *some subset* of those facts — typically two or three claims — without exposing the others, and without the verifier learning who she is.

Constraints driving the decision:

- **Issuance UX**: NGOs are not crypto teams. The issuance step must be a single HTTP POST that produces a JWT-shaped artifact a non-crypto frontend dev can serialize and hand to the holder. Anything more complex stops adoption at the NGO before it starts.
- **Holder hardware**: A mid-range Android phone in Hong Kong's New Territories. No GPU. No TEE on-device. Browser-only WebCrypto.
- **Verifier diversity**: Compass needs to be verifiable in three places — the dstack TEE (Node), the holder's browser (WebCrypto + `@noble/curves`), and a third-party agent (Claude Code skill). The credential format must work in all three with no extra dependencies.
- **Revocation**: An NGO must be able to revoke a leaked credential without phoning home (the verifier should not need to make an outbound call to the issuer to check status — that leaks who's being checked).
- **Standards posture**: The submission is judged in part on ecosystem citizenship and standards adoption. Inventing a proprietary credential format is a regression vs. picking a draft IETF spec.

## Decision

We use **SD-JWT VC per `draft-ietf-oauth-sd-jwt-vc-15`** (draft-16 available as of 2026-04), with **Ed25519** issuer signatures and **`@sd-jwt/jwt-status-list`** revocation. The credential is encrypted at rest in the holder's browser via [`AES-256-GCM`](../../app/src/lib/holderVault.ts) with a non-extractable WebCrypto key persisted in IndexedDB.

## Alternatives Considered

### PCD (Proof-Carrying Data — 0xPARC/Zupass)

- **Pros:** Composable proof framework that wraps any underlying primitive (Semaphore, EdDSA-Poseidon, Groth16); already production at Zupass scale; clean TypeScript SDK.
- **Cons:** Pulls in `circomlibjs` + a circuit runtime as a heavy browser dep (>2 MB gzip for Groth16 verifier); requires writing or finding a circuit per policy; doesn't have a battle-tested status-list / revocation story comparable to SD-JWT's; verifier needs to ship the same circuit-or-proof-system the issuer used, which creates a tight coupling between issuer and verifier we explicitly want to avoid (issuers are NGOs that should not need to coordinate with verifiers about cryptographic primitives).
- **Rejected because:** The added 2 MB of WASM kills mobile-first UX (page load on a 4G connection in HK is already 3–5s); revocation story is weaker; the policy-by-policy circuit coupling violates Compass' "swap policies via a JSON file in `docs/policies/`" property.

### zkSNARK Groth16 with custom circuits (`circom` + `snarkjs`)

- **Pros:** Maximally cryptographic; trust only the math + the trusted setup; smallest proof size (~200 bytes); fastest verifier (~5 ms).
- **Cons:** Per-policy circuit (Compass has 3 policies; adding policies in v2 means new circuits each time); trusted setup ceremony required per circuit (or universal PLONK setup); proving time on a mobile device is 8–30s for non-trivial statements; no standard format for the underlying credential (you'd need a sibling spec like Anonymous Credentials 2.0 to be useful in the IETF / OIDC ecosystem); status-list revocation must be hand-built.
- **Rejected because:** 8–30s proving time on the worker's phone is unacceptable UX for an intake clinic ("please wait 30 seconds while your phone proves you're eligible" trains the user that the system is broken); the trusted-setup ceremony for each policy is operational debt Compass cannot carry in a hackathon window; standards-track posture is materially weaker.

### BBS+ signatures (anonymous credentials)

- **Pros:** Native unlinkable presentations; signature size sublinear in number of disclosed claims; backed by IETF draft (`draft-irtf-cfrg-bbs-signatures-08`).
- **Cons:** BBS+ requires pairing-friendly curves (BLS12-381); browser-side WebCrypto does not support pairings natively, requiring a WASM polyfill (~400 KB gzip) for verification; the IETF draft is still pre-CFRG-RG-LC as of 2026-05, status-list revocation is still being specified; issuer key material is non-standard (BLS12-381 vs. the Ed25519 NGOs already use for their internal signing infra).
- **Rejected because:** Adopting BBS+ in May 2026 means betting on a draft that is still pre-final; the pairing-curve dependency makes the browser-side verifier (`app/src/lib/verifyReceipt.ts`) ~3× heavier than the `@noble/curves` secp256k1 + Ed25519 stack we already need; unlinkability is **not the threat model** for Compass — the receipt's `agentIdCommitment` is already a hash of the holder's agent ID, so linkability across receipts of the same holder is *expected* and necessary for nullifier replay protection.

### Plain JWT with no selective disclosure (issuer signs the full payload)

- **Pros:** Trivial implementation; every JWT library on earth supports it.
- **Cons:** No selective disclosure — the holder must reveal ALL claims or none. Defeats the entire purpose of Compass.
- **Rejected because:** Selective disclosure is the privacy primitive Compass is built around. A plain JWT is what an NGO does *today*, and what Compass replaces.

## Consequences

### Positive

- Issuer side: `@sd-jwt/sd-jwt-vc` lets the NGO produce a credential with a single line of TypeScript per claim. The Ed25519 issuance key is the same key infrastructure NGOs already use for their internal signing.
- Holder side: A SD-JWT VC is a JWT plus disclosure salts; presentation to the TEE is a single string concatenation (`compact(jwt) + disclosures.map(b64).join('~') + ~kbjwt`). No proving step. No 30-second mobile delay.
- Verifier side: Standard JWT verification + a `~`-separated disclosure splitting routine. Works in Node (`@sd-jwt/sd-jwt-vc`), browser (`@noble/curves` + `@noble/hashes` directly — see `app/src/lib/verifyReceipt.ts`), and Claude Code skill (`skills/compass-eligibility-check/SKILL.md`).
- Revocation: `@sd-jwt/jwt-status-list` — the issuer publishes a status list at a stable URL, indexed by an integer. The verifier downloads the status list once per epoch and checks a single bit. NGO revokes by flipping the bit. Verifier learns *nothing* about who is being checked (status list is the same response for every check during the epoch).
- Standards story: SD-JWT VC is on the OAuth WG agenda for IETF 122 (Bangkok, July 2026). The credential format Compass ships will be alignable with the EU Digital Identity Wallet (eIDAS 2.0) reference architecture which explicitly cites SD-JWT VC.

### Negative

- **No native unlinkability across receipts.** A holder presenting the same VC twice can be correlated (same hash of disclosures). This is by design for Compass (the nullifier mechanism *needs* a stable identity per (agent, policy)) but is a privacy weaker-bound than BBS+. Documented in [`docs/honest-limits.md`](../honest-limits.md) §7.
- **Draft churn risk.** SD-JWT VC is a draft IETF spec. We pin to `draft-ietf-oauth-sd-jwt-vc-15` and document the version in the receipt's `vc.format` field. A later draft revision could require minor wire-format updates. Mitigated by version-pinning the consumed format in the verifier ([`app/src/lib/verifyReceipt.ts`](../../app/src/lib/verifyReceipt.ts) — `ReceiptDocument.version` literal `"compass-receipt-1.2.0"`).
- **Status-list bandwidth.** The verifier downloads the full status list once per epoch even if checking a single credential. For a 100K-credential NGO, the status list is ~12 KB. Acceptable for desktop; bounded for mobile.

### Neutral

- Three demo issuers (HELP, Bethune, Mission) ship with **local Ed25519 fixtures**, not NGO-endorsed keys. Documented in the README "What's real / what's mocked" table.
- The credential is encrypted at rest in the holder's browser via AES-256-GCM with a non-extractable IndexedDB CryptoKey. This is independent of the SD-JWT VC choice; any credential format would have used the same vault primitive.

## References

- [`app/src/lib/verifyReceipt.ts`](../../app/src/lib/verifyReceipt.ts) — browser-side verifier (Ed25519 + secp256k1 via `@noble/curves`).
- [`enclave/src/receipt.ts`](../../enclave/src/receipt.ts) — TEE-side canonicalization + signing.
- [`app/src/app/api/issue/route.ts`](../../app/src/app/api/issue/route.ts) — live issuer endpoint.
- [`docs/threat-model.md`](../threat-model.md) §5, §7 — credential trust + revocation.
- [`docs/honest-limits.md`](../honest-limits.md) §7 — linkability boundary.
- IETF SD-JWT VC draft: <https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/>
- [ADR-0001](./ADR-0001-0g-chain-phala-tdx-platform.md) — platform choice context.
