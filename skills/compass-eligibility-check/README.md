# compass-eligibility-check

A reusable verification skill for the 0G ecosystem. Turns a Compass
eligibility receipt into a `{verified: true/false}` answer plus the
TEE-bound metadata, runnable from any agent, CLI, or CI step.

See [`SKILL.md`](./SKILL.md) for the full skill spec, inputs, outputs,
and invocation patterns.

## Why it matters

Compass receipts contain **just enough** to be useful (a 15-min
timestamp bucket, a non-identifying agent commitment, a result hash) and
**not a byte more** (no name, no HKID, no employer, no document fields).
That's the privacy-by-design property the on-chain `ReceiptIssued` event
encodes.

But "trust the contract" isn't enough — the receipt's `attestationDigest`
field claims a specific TEE produced it. This skill lets any third party
(judges, partner NGOs, downstream agents) re-prove the TEE chain
independently, without privileged access.

## Track 5 ecosystem citizenship

Per the 0G APAC hackathon Track 5 brief, ecosystem citizenship rewards
projects that ship reusable primitives the broader ecosystem can adopt.
This skill is one of those primitives — every project that issues
TDX-bound receipts on 0G can publish a verifier with the same shape.

## Cross-references

- Compass repo: <https://github.com/StephenSook/Compass-OG->
- TEE deployment evidence: `docs/notes/phala-deployment.md`
- Receipt schema (compass-receipt-1.2.0): `enclave/src/receipt.ts`
- Live verifier source: `enclave/scripts/verify-receipt.ts`
