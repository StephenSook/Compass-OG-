# YouTube tutorial — outline

Working title: **"Building a private eligibility firewall on 0G Chain
in 60 minutes: SD-JWT VC + Phala TEE + browser AES-GCM + a one-shot
on-chain receipt."**

Target length: 45-60 minutes screencast.

When to record: *after* the F.1 demo video is done, *after* the
Hashnode post is up. This is a long-tail SEO play, not a submission
artifact — record it any time post-June 5.

## Why bother

The 0G APAC hackathon left an audience of builders curious about the
stack who don't yet have a worked example. A tutorial that walks
through Compass end-to-end fills that gap, brings traffic to the
repo, and seeds follow-on hackathon entries that reuse Compass'
primitives.

## Audience assumptions

- Comfortable with TypeScript, Solidity, and basic web crypto.
- Has not used 0G, Phala dstack, or SD-JWT VC before.
- Has a Mac or Linux dev environment with Node 20+ and Docker.

## Outline (chapter timestamps)

### 0:00 — Cold open (90s)

The subpoena scene. The one-liner. The promise: by minute 60 you'll
have a working private eligibility firewall on your local machine that
mints real receipts on Galileo testnet.

### 1:30 — What we're building (3 min)

Architecture diagram pass. The four layers. Why this isn't ZK
(structural argument: SD-JWT VC + sealed inference covers the same
threat model for this use case with less ceremony).

### 4:30 — Repo tour (4 min)

`git clone https://github.com/StephenSook/Compass-OG-.git`

Walk through:

- `contracts/contracts/` — the three Solidity files.
- `enclave/src/` — receipt-signer + verify-receipt CLI.
- `app/src/` — Next.js frontend, with the `/api/issue` and
  `/api/consume` routes as the load-bearing surface.

### 8:30 — Setup (5 min)

```bash
cd contracts && npm ci --legacy-peer-deps && npx hardhat test
cd ../enclave && npm ci --legacy-peer-deps && npm test
cd ../app && npm ci --legacy-peer-deps && npm run dev
```

Live in localhost:3000. Show the four-step onboard flow in fixture
mode.

### 13:30 — Issuing an SD-JWT VC (8 min)

Walk through `app/src/app/api/issue/route.ts`. Explain selective
disclosure as the *load-bearing* property: claims commit to a
salt-and-hash table, the holder discloses only the salts she chooses.
Live mint a credential through the UI.

### 21:30 — Browser-side AES-256-GCM vault (6 min)

`app/src/lib/crypto/vault.ts`. Non-extractable WebCrypto key in
IndexedDB. PBKDF2 with 600k iterations. Show the vault file in
DevTools → IndexedDB. Open the localStorage entry — only ciphertext
metadata. The decryption key is unreachable to any extension or script.

### 27:30 — Phala dstack TDX (10 min)

Brief introduction to TDX. `dstack.getKey("compass-receipt-signer")`
returns a deterministic secp256k1 priv sealed to the attested image.
The composeHash binding. The per-receipt RA quote. Show the
`/api/tee-status` probe. Open the live TEE URL. Optional sidebar: how
RA-quote verification works in the off-chain verifier.

### 37:30 — The atomic receipt on 0G Chain (8 min)

`contracts/contracts/CompassHub.sol::consumeGrantAndIssueReceipt`. The
eight validations. The single tx that emits both `GrantConsumed` and
`ReceiptIssued`. Live mint a receipt through the UI. Open the
transaction on `chainscan-galileo.0g.ai` and walk the events.

### 45:30 — The subpoena moment (4 min)

Open `/clinic/subpoena`. Show what the bucketed timestamp + commitment
look like under a PDPO §57 disclosure order. Contrast with what a
traditional intake form would have exposed.

### 49:30 — Honest limits (6 min)

Walk `docs/honest-limits.md`. Coercion, coarse buckets, SD-JWT VC
draft churn, the open-question column in the reality table. The
"honesty is the differentiator" pitch.

### 55:30 — Re-deriving the cryptographic chain yourself (4 min)

`cd enclave && npm run verify-receipt -- --bundle ./fixtures/receipt.json`.
Walk the output. Explain what gets verified vs what you have to trust
upstream.

### 59:30 — Outro (1 min)

Star the repo. Star history chart. Subscribe to the channel.
"What I'd build on top of this" prompt for comments.

## Production checklist

- [ ] Clean recording environment: no notifications, no other tabs
  visible in DevTools, no real wallet addresses visible.
- [ ] Use a *throwaway* Privy login for the live demo.
- [ ] Use a *funded but disposable* Galileo wallet for the live tx —
  ~0.05 OG is plenty for a single receipt mint.
- [ ] OBS settings: 1080p60, AAC audio at 192kbps, screen + microphone
  source.
- [ ] Cut all `cd` keystrokes and command typos in post.
- [ ] Lower-third graphic at minute 0:00 with the live URL +
  GitHub link.
- [ ] Pinned comment with chapter timestamps + repo link + Discord
  invite.

## Thumbnail copy

`Private Eligibility on 0G — in 60 minutes`

Subtext: "SD-JWT + Phala TEE + browser AES-GCM + a one-shot on-chain
receipt. Solo build, hackathon-grade, mainnet-live."

## SEO description

```
Build a privacy-preserving eligibility firewall on 0G Chain end-to-end:
SD-JWT verifiable credentials, browser AES-256-GCM vault, Phala dstack
TDX sealed inference, and an atomic on-chain receipt that emits only a
15-minute timestamp bucket + a cryptographic commitment.

Repo: https://github.com/StephenSook/Compass-OG-
Live: https://app-psi-pied.vercel.app
Whitepaper: https://github.com/StephenSook/Compass-OG-/blob/main/docs/whitepaper.pdf

Chapters in pinned comment.
```
