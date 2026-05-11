# ADR-0003: Per-receipt RA quote with `report_data` binding over boot-quote binding

**Status:** Accepted
**Date:** 2026-05-11
**Author:** Stephen Sookra
**Supersedes:** N/A

## Context

The Compass TEE (Phala dstack TDX, see [ADR-0001](./ADR-0001-0g-chain-phala-tdx-platform.md)) signs every receipt with a key derived inside the enclave via `dstack.getKey()`. A verifier needs to confirm:

1. The signer key was derived **inside this specific image** (`composeHash` pin), not by some attacker who recovered the key off-enclave.
2. The signature on this receipt was produced by **a live, attested instance** — not replayed from an archived quote captured during the demo last week.

Constraint #1 is solved by binding the signer's Ethereum address into the TDX quote's `report_data` field — the quote then carries an unforgeable claim "this image, identified by `MR_TD` and `composeHash`, controls this Ethereum address." That part is standard TDX-RA practice.

Constraint #2 is the one that needs an ADR. A naïve implementation would do **boot-quote binding**: the enclave generates one quote at boot, returns it from `/health`, and the verifier checks all subsequent receipts against that single quote. Attacker who once captures the boot quote (e.g., from a Wayback Machine snapshot or a public attestation pin) can replay it forever — even if the enclave was destroyed and a tampered image redeployed at the same URL.

Driving forces:

- **Receipts persist long after they are issued**: clinic logs retain receipts for years for audit. A 2030 verifier of a 2026 receipt should still be able to detect a replayed-quote attack against that receipt.
- **The enclave URL is not part of the trust chain**: Compass deliberately does not require the verifier to trust DNS or TLS to the dstack instance — the verifier checks the math, not the network endpoint.
- **`receiptId` is unique per receipt**: it is a 32-byte value derived inside the enclave (counter + composeHash + signer entropy). Binding it into the quote makes the quote provably unique per receipt.

## Decision

Every receipt carries a **freshly-generated TDX quote** (`perReceiptQuoteHex`), and the quote's `report_data` field (64 bytes at offset 568 in the TDX v4 quote layout) contains:

```
report_data = sha256(ethAddress || composeHash || receiptId)
            = sha256(20 bytes || 32 bytes || 32 bytes)        // → 32 bytes
```

The 32-byte sha256 output is left-justified into the 64-byte `report_data` slot (high 32 bytes are zero). The receipt itself includes both `attestationDigest = sha256(canonicalize(receipt))` and `quoteCommitment = sha256(perReceiptQuoteHex)` so the four verifier checks unwind cleanly:

1. `attestationDigest` matches `sha256(canonicalize(receipt))` — receipt fields are not tampered.
2. Signature recovers to `signerAddress` — receipt was signed by the claimed key.
3. `quoteCommitment` matches `sha256(perReceiptQuoteHex)` — receipt commits to this specific quote.
4. `report_data` in the quote matches `sha256(signerAddress || composeHash || receiptId)` — the quote binds this triple, not some other triple.

Defeats archived-quote replay because attacker would need to forge a quote whose `report_data` matches *this* receipt's `(signer, image, receiptId)` triple — which requires controlling the enclave at the moment of receipt issuance.

## Alternatives Considered

### Boot-quote binding (one quote per enclave boot)

- **Pros:** One TDX-quote operation per boot; lowest overhead; smallest receipt payload (no per-receipt quote bytes to ship).
- **Cons:** A single archived snapshot of `/health` lets an attacker replay quotes indefinitely; the verifier cannot distinguish "this enclave signed this receipt today" from "someone captured the boot quote in May 2026 and is replaying it in 2030." Defeats the multi-year audit story.
- **Rejected because:** Archived-quote replay is the primary novel attack against TEE-signed receipts; ignoring it is exactly the kind of "we use a TEE so it's secure" hand-wave that real reviewers will catch. (Codex did catch it in the pre-mainnet review — see [`docs/notes/codex-tee-architecture-review.md`](../notes/codex-tee-architecture-review.md).)

### Quote-per-N-receipts batching (one quote covers a batch)

- **Pros:** Amortizes the quote-generation cost across multiple receipts; smaller average payload.
- **Cons:** The `report_data` field can hold at most 64 bytes — committing to *all* receiptIds in a batch is impossible past ~2 receipts; binding only the Merkle root of receiptIds adds a side-tree the verifier must also retrieve and check, expanding the verifier surface; partial batch replay (attacker replays one valid receipt from a captured batch) remains an issue.
- **Rejected because:** The quote-generation cost on Phala dstack is ~80 ms — small enough to do per-receipt; batching adds complexity without removing the underlying replay risk.

### `report_data = sha256(signerAddress || composeHash)` — image binding only, no receipt freshness

- **Pros:** Static binding once per image; verifier check is simpler.
- **Cons:** Reduces to boot-quote binding by another name — attacker who captures any quote produced by this image can replay it against any receipt the enclave signs.
- **Rejected because:** Identical replay risk to boot-quote binding.

### `report_data = receiptId` only — freshness without identity

- **Pros:** Smallest binding; quote freshness explicit.
- **Cons:** Does not bind the signer or the image — attacker could in principle generate a quote with a chosen `receiptId` from a *different* enclave (e.g., a malicious image deployed on a different Phala CVM) and the verifier wouldn't notice without a separate composeHash check.
- **Rejected because:** Composability matters. The `report_data` slot is precious; using it for receiptId alone wastes the chance to bind the (signer, image) tuple that proves the signature came from *this* enclave image, not just *some* enclave.

### `report_data = hash(receiptId || composeHash)` — image + freshness, no signer

- **Pros:** Defeats both replay and cross-image substitution.
- **Cons:** Verifier must independently establish that `signerAddress` is the address derived inside this image — typically by re-running the dstack key-derivation and checking. That's a non-trivial extra check not all verifiers can do.
- **Rejected because:** Adding `signerAddress` to the `report_data` hash costs zero extra bytes (sha256 output is fixed at 32) and lets a verifier do the binding check in one step without re-deriving keys.

## Consequences

### Positive

- **Receipts are self-verifying for the lifetime of the receipt.** A 2030 verifier of a 2026 receipt unwinds the same four checks; replay attack against an archived quote is statistically impossible (requires sha256 preimage on the *target* receipt's triple).
- **Verifier in three places, same four checks.** Browser ([`app/src/lib/verifyReceipt.ts`](../../app/src/lib/verifyReceipt.ts)), CLI ([`enclave/scripts/verify-receipt.ts`](../../enclave/scripts/verify-receipt.ts)), and the Claude Code skill ([`skills/compass-eligibility-check/`](../../skills/compass-eligibility-check/SKILL.md) — wraps the CLI rather than re-implementing it). The canonicalization function is **byte-parity-duplicated** between the Node CLI and the browser port (`enclave/src/receipt.ts` and `app/src/lib/verifyReceipt.ts`) rather than shared from a single source — parity is enforced by paired vitest cases on both sides.
- **Composability story is clean.** Each layer of the binding (signer, image, receipt freshness) sits in `report_data`; a verifier who only wants to check *this signer's receipts* can match on signerAddress; one who wants to check *receipts from this image* can match on composeHash.

### Negative

- **~80 ms quote-generation latency per `/api/consume` call.** Acceptable for the Compass UX (a worker checking eligibility is willing to wait 200 ms); not acceptable for high-frequency machine-to-machine attestation. Documented in [`docs/honest-limits.md`](../honest-limits.md) §10.
- **Larger receipts.** Each receipt carries ~5 KB of `perReceiptQuoteHex` (TDX v4 quote is ~10K hex chars). Storage cost on 0G Storage is sub-cent per million receipts; not a blocker but worth noting.
- **Full Intel DCAP signature-chain verification is out of scope** for the in-repo verifier — running the DCAP cert-chain check + Quoting Enclave attestation is left to the DStack Verifier or Intel QVL externally. Documented in [`docs/honest-limits.md`](../honest-limits.md) §12 and in the verifier output: *"Out of scope (next layer): full Intel DCAP verification of the TDX quote signature chain — run via the DStack Verifier or Intel QVL externally."*

### Neutral

- The `report_data` slot is 64 bytes; we use the first 32 (sha256 output) and zero the remaining 32. Future migrations could pack a 64-byte sha512 if the binding domain grows (e.g., adding policyId), but the marginal value over the current 32-byte triple is small.
- The TDX v4 quote layout (signer at offset 568, length 64 for `report_data`) is hardcoded in the verifier. A TDX v5 layout change would require a verifier bump, version-pinned via the receipt's `version` field (`compass-receipt-1.2.0`).

## References

- [`enclave/src/receipt.ts`](../../enclave/src/receipt.ts) — `composeReceiptBundle()` builds the per-receipt quote with the bound `report_data`.
- [`enclave/src/verify-attestation.ts`](../../enclave/src/verify-attestation.ts) — canonical CLI verifier.
- [`app/src/lib/verifyReceipt.ts`](../../app/src/lib/verifyReceipt.ts) — browser-side 1:1 port.
- [`docs/notes/codex-tee-architecture-review.md`](../notes/codex-tee-architecture-review.md) — adversarial review that surfaced the boot-quote-replay risk.
- [`docs/honest-limits.md`](../honest-limits.md) §10, §12 — quote-generation latency + DCAP out-of-scope notes.
- Intel TDX Module 1.5 Application Binary Interface — `TDREPORT` layout, `report_data` semantics.
- [ADR-0001](./ADR-0001-0g-chain-phala-tdx-platform.md) — platform choice that enables this binding pattern.
- [ADR-0002](./ADR-0002-sd-jwt-vc-over-zk.md) — credential format that the enclave evaluates.
