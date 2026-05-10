---
name: compass-eligibility-check
description: Verify a Compass eligibility receipt end-to-end. Recovers the TEE signer from the receipt signature, re-derives the canonical attestationDigest, checks the per-receipt TDX quote commitment, and binds report_data to (signer, composeHash, receiptId). Triggers on "verify Compass receipt", "check eligibility receipt", "is this Compass receipt valid?", "verify TEE attestation for Compass". Inputs: a receiptId from a Galileo or Aristotle ReceiptIssued event, OR a saved JSON receipt-bundle. Output: structured pass/fail + the bound TEE measurements. Reads from the public 0G chains and the live Phala TDX endpoint; no private keys required.
---

# Compass eligibility-check skill

This skill turns the `verify-receipt` CLI from
[Compass-OG-](https://github.com/StephenSook/Compass-OG-) into a one-shot
verification an agent or judge can run without cloning the full repo.

It exercises the same cryptographic chain the on-chain `ReceiptIssued`
event commits to:

1. `attestationDigest = sha256(canonicalize(receipt))` matches what the
   receipt-signer claimed.
2. `ECDSA.recover(receipt.attestationDigest, receipt.signature) ==
   receipt.signerAddress` — secp256k1 recovery, lowS-normalized.
3. `receipt.quoteCommitment == sha256(perReceiptQuoteHex)` — the receipt
   commits to a specific TDX quote.
4. The TDX quote's `report_data` field binds `sha256(signerAddress ||
   composeHash || receiptId)` — defeats archived-quote replay across
   deployments and cross-receipt impersonation.
5. The recovered `composeHash` matches the trust anchor pinned in the
   Compass repo's deployment evidence (`docs/notes/phala-deployment.md`).

When all five hold, the skill prints `OK — receipt verified against TEE
attestation` and returns the structured fields. When any fails, it
prints the specific gap and returns the failure code.

## Inputs

| Mode    | Required input                                                                |
|---------|--------------------------------------------------------------------------------|
| Live    | A live Phala enclave URL — script mints a fresh receipt + verifies it          |
| Sample  | None — uses a fixture bundled with the Compass repo for offline demos          |
| Bundle  | Path to a JSON file `{receipt, attestationDigest, signature, signerAddress, perReceiptQuoteHex}` — verifies a user-supplied receipt offline |

## Outputs

```jsonc
{
  "verified": true,
  "receiptId": "0x…",
  "signerAddress": "0xaba6b92ff8199275eb090c9b3049141fd431a7e7",
  "composeHash": "0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0",
  "policyId": "0x21b8b0e6…2d08f",
  "timestampBucket": 1715024400,
  "agentIdCommitment": "0x…",
  "checks": {
    "attestationDigestMatch": true,
    "signatureRecovers": true,
    "quoteCommitmentMatch": true,
    "reportDataBinding": true,
    "composeHashTrusted": true
  }
}
```

On failure the same shape is returned with `verified: false` and the
specific `checks.<name>` set to false.

## How to invoke

### Option A — clone Compass repo (recommended for full offline mode)

```bash
git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG-/enclave
npm install --workspaces=false
npx ts-node scripts/verify-receipt.ts \
  --live https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network \
  --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
```

### Option B — verify a saved bundle

```bash
npx ts-node scripts/verify-receipt.ts \
  --bundle ./received-receipt.json \
  --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
```

The bundle must contain `{receipt, attestationDigest, signature,
signerAddress, perReceiptQuoteHex}` — the exact shape the live enclave
returns. Useful for verifying a receipt someone else minted.

### Option C — sample-mode (no network, no enclave)

```bash
npx ts-node scripts/verify-receipt.ts \
  --sample \
  --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0
```

## Trust anchors

Both values are pinned in `docs/notes/phala-deployment.md` of the Compass
repo and re-derivable from the live Phala endpoint:

- **TEE signer:** `0xaba6b92ff8199275eb090c9b3049141fd431a7e7`
- **composeHash:** `0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0`

If the live deploy is restarted with a new image, the `composeHash` MUST
be re-pinned in the consuming agent. The skill prints the recovered
value so an unattended consumer can detect the mismatch.

## When NOT to use

- Receipt freshness checks (use the on-chain `expiry` field directly; this
  skill verifies cryptographic provenance, not policy validity in time).
- Cross-receipt correlation (each receipt is independent; no graph queries).
- On-chain status / revocation lookups (out of scope for v1; A.4 covers
  attestation, not revocation).

## Versioning

`compass-receipt-1.2.0` is the current receipt-doc schema. Earlier
schemas (1.1.0) bound the boot quote, not per-receipt quotes — those
receipts are no longer accepted by this skill.

## Repository

Source: <https://github.com/StephenSook/Compass-OG-/tree/main/enclave/scripts/verify-receipt.ts>

Track 5 — Privacy & Sovereign Infrastructure submission for the 0G APAC
Hackathon 2026.
