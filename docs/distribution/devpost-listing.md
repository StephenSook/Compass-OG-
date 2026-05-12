# Devpost listing — draft

For cross-listing Compass on Devpost after the 0G APAC Hackathon
deadline. Devpost's free tier accepts cross-listed projects and brings
a different audience (judges, recruiters, follow-on hackathon teams).

## Project name

`Compass — Private Eligibility Firewall`

## Elevator pitch (200 char limit)

```
A vulnerable migrant worker proves she qualifies for free legal help
without disclosing her name, HKID, or employer. Subpoenas reach a
15-min timestamp bucket. Live on 0G Aristotle mainnet.
```

## Story (long-form, ~600 words for the Devpost body)

```
## The asymmetry

Migrant workers in Hong Kong make up ~5% of the population. The
services that exist to help them — legal aid clinics, shelters, public
hospitals — all require identifying information at intake. Name, HKID,
employer, visa status. Those are exactly the fields an abusive employer
can later subpoena, or that a trafficker can use to find a worker who
sought help. The status quo asks the most vulnerable people in the
system to choose between getting help and being safe.

## What Compass changes

Compass eliminates the disclosure. A vulnerable worker carries an
encrypted SD-JWT verifiable credential in her browser vault. A sealed
inference receipt-signer running inside a Phala dstack TDX trusted
execution environment evaluates an eligibility policy against
selectively-disclosed claims. The result lands on 0G Chain as a
`ReceiptIssued` event whose fields are non-identifying — only a
15-minute timestamp bucket, a policy ID, a nullifier, and a
cryptographic commitment to the agent's on-chain identity.

A subpoena reaches the timestamp bucket and the commitment.
Nothing else exists to be disclosed.

## How it's built

Compass runs end-to-end on 0G:

- **0G Chain (Aristotle mainnet 16661 and Galileo testnet 16602)** —
  AgentRegistry holds a soulbound INFT bound to the user's EOA.
  CompassHub atomically consumes a single-use grant and issues a
  receipt in one transaction; nullifier-replay and receipt-id-replay
  protection both enforced on-chain.
- **0G Storage** — the user's SD-JWT VC ciphertext (AES-256-GCM with
  a non-extractable WebCrypto key in IndexedDB) is uploaded to 0G
  Storage; the Merkle root is committed to `AgentRegistry.encryptedURI`.
  The decryption key never enters the chain.
- **0G TeeML / Phala dstack TDX** — the receipt-signer derives a
  deterministic secp256k1 key sealed to its attested image via
  `dstack.getKey('compass-receipt-signer')`. Each receipt is bound to
  a per-receipt RA quote whose `report_data` commits to
  `(signer, image, receiptId)`, defeating archived-quote replay
  across deployments.

## Honest limits

We are explicit about what Compass does *not* do. Coercion: an abusive
employer who can see the worker's screen at disclosure can still read
the plaintext SD-JWT VC before encryption. Coarse buckets: 15-minute
windows are not full k-anonymity against statistical re-identification
in edge cases. SD-JWT VC draft churn: the implementation pins to
draft-15; we'll roll forward as the standard finalises. Full list at
`docs/honest-limits.md`.

## What's verifiable today

- 40 Hardhat unit tests + property-based invariants pass.
- 103 receipt-signer vitest tests pass.
- Slither 0.11.5 with 101 detectors: 0 security findings
  (`docs/audits/slither-2026-05-10.md`).
- Codex GPT-5.5 adversarial pre-submission review caught + fixed 1
  BLOCKER before mainnet deploy.
- Playwright E2E suite scaffolded across the user journey.

Don't trust the maintainer — re-derive the cryptographic chain
yourself with `enclave/src/verify-receipt.ts --bundle <receipt.json>`.

## Try it

- Live frontend: https://app-psi-pied.vercel.app
- Subpoena scene (the "shouldn't be possible" moment):
  https://app-psi-pied.vercel.app/clinic/subpoena
- Public audit log: https://app-psi-pied.vercel.app/audit
- 3D audit visualization:
  https://app-psi-pied.vercel.app/audit-graph.html
- Repo: https://github.com/StephenSook/Compass-OG-

Built solo by Stephen Sookra for the 0G APAC Hackathon Track 5
(Privacy & Sovereign Infrastructure).
```

## Built with (tag list — Devpost format)

```
0g, 0g-chain, 0g-storage, 0g-teeml, phala-network, dstack, tdx,
ethereum, solidity, hardhat, openzeppelin, next.js, typescript, viem,
ethers, privy, sd-jwt, ed25519, secp256k1, aes-256-gcm,
verifiable-credentials, zero-knowledge, web-cryptography
```

## Try it links

- Live frontend: `https://app-psi-pied.vercel.app`
- GitHub: `https://github.com/StephenSook/Compass-OG-`
- Whitepaper PDF: `https://github.com/StephenSook/Compass-OG-/blob/main/docs/whitepaper.pdf`
- Demo video: <https://www.youtube.com/watch?v=vg5WZHmlzZI>

## Image gallery

Upload the following from `Demo/assets/` and `docs/`:

1. Architecture diagram screenshot (`/about` page, the four-layer
   diagram) — primary cover image.
2. Subpoena scene screenshot (`/clinic/subpoena`) — the
   "shouldn't-be-possible" moment.
3. 3D audit-log force-graph screenshot (`/audit-graph.html`) — the
   visual wow.
4. Whitepaper PDF first page — credibility signal.

## Submission categories

If the Devpost hackathon equivalent has track selection: choose the
privacy/identity/Web3 track. If multi-select: also pick AI agents (the
agent is the autonomous receipt-signer inside the TEE).

## When to post

After June 5 hackathon deadline. Cross-listing during the active
window may violate the 0G APAC rules; wait until the official
HackQuest submission closes.
