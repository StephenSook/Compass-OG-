# Blog post — draft (Hashnode / Mirror.xyz / Medium)

Working title: **How I shipped a private eligibility firewall on 0G
mainnet, solo, in 30 days.**

Estimated length: 2,500-3,000 words. Reads in ~10 minutes. Pairs with
the F.5 X thread by linking the X post in the intro and the blog post
URL in the X thread's post 5.

Post when: after June 5 hackathon deadline closes. Goal is to extend
the X engagement window into the Community Award voting period
(post-submission Discord/X surveys are how the 10 × $1.3k community
awards are voted) and seed long-tail SEO for the Compass repo.

---

## Outline

### Section 1 — The cold open (200 words)

Lead with the asymmetry. A worker escaping wage theft has to hand her
HKID to the same legal-aid intake an employer's lawyer can later
subpoena. Show the subpoena-scene screenshot. Say "this is what shouldn't
be possible — and it is" twice. Sets the emotional stake.

### Section 2 — Why 0G (300 words)

Walk through the three 0G components used and *why each* was the right
fit:

- **0G Chain**: EVM-compatible L1 with cheap mainnet gas. Compass is a
  receipt-emitting contract surface; the on-chain audit log is the
  product. 0G mainnet was both affordable to deploy on and credible
  enough for "real" — both Galileo and Aristotle are live.
- **0G Storage**: encrypted ciphertext upload with a Merkle root
  commitment. The user's vault is portable across NGOs without the NGO
  ever holding the key.
- **0G TeeML / Phala dstack TDX**: the receipt-signer is sealed
  inference. Per-receipt RA quote binding `(signer, image, receiptId)`
  defeats archived-quote replay — important if you care about subpoena
  resistance over the long tail.

### Section 3 — The hardest bug (300 words)

Pre-mainnet deploy, Codex (GPT-5.5) caught a BLOCKER in the
`/api/consume` route: `agentIdCommitment` was being computed as
`keccak256(utf8("...:" + tokenId + ":" + ownerAddress))` while the
contract used `keccak256(abi.encode(uint256, address))`. The two values
would *never* match, so every legitimate receipt would have been
rejected on-chain — the demo would have looked working in the browser
and produced no audit-log row. The fix: switch to `recoverTypedDataAddress`
+ `encodeAbiParameters`. Commit `bf5b285`.

Talk about how that was a load-bearing find — adversarial
peer-review of cryptographic glue code is *the* discipline you can't
skip if you ship to mainnet.

### Section 4 — The honest limits (400 words)

Coercion. Coarse buckets. SD-JWT VC draft churn. Make the case that
calling out limits *upfront* is the trust signal that distinguishes
serious privacy work from privacy theatre. Link to `docs/honest-limits.md`
and the threat model. Show the reality table from `/about`.

### Section 5 — The two days that almost broke me (500 words)

The US-funding journey. Coinbase no listing → Bitget / MEXC / Bybit /
KuCoin all US-blocked → Kraken only has OGN, not OG. Pivot to MoonPay →
ETH on L1 → `hub.0g.ai` TokenFlight Cross-Chain Swap
(Hyperstream / Khalani route) → native OG on Aristotle. Acknowledge
the 0G team's responsiveness on the Telegram dev channel and Discord —
Asad Khalid's reply that ecosystem credits aren't available for
mainnet was helpful even though it wasn't the answer I hoped for.

Embed the actual transaction hash so readers can verify the funding
path end-to-end.

### Section 6 — What I'd build next (300 words)

Three concrete v2 items: browser-side 0G Storage upload, on-chain
trust-list governance (5-of-7 quorum, 7-day timelock), and
native-speaker review of the 5-language kiosk strings. Link to
`docs/roadmap.md` once that ships.

### Section 7 — Try it yourself (200 words)

The three links: live frontend, the subpoena scene, the 3D audit-log
view. The reproducibility recipe: `git clone` and
`npm run verify-receipt -- --bundle <your-receipt.json>`. End with the
GitHub star CTA (modest — "if it's useful, star it; if it's not, tell
me what missed").

### Section 8 — Acknowledgments (100 words)

NGO inspiration: Mission for Migrant Workers, HELP for Domestic
Workers, Bethune House Migrant Women's Refuge. 0G team for the
hackathon space. Anthropic for the Claude pair-programming that
unblocked most of the harder threads. The Codex review-loop posture
that makes solo work feel less reckless.

---

## Front-matter for Hashnode

```
title: How I shipped a private eligibility firewall on 0G mainnet,
       solo, in 30 days
subtitle: Compass turns "prove who you are" into "prove what you qualify
          for" — and the difference matters in the migrant-worker context.
publishAs: stephensookra
tags: privacy, web3, 0g, verifiable-credentials, hackathon,
      next-js, solidity, ethereum, tee, phala
cover: <upload architecture-diagram screenshot>
slug: compass-private-eligibility-firewall-on-0g
seoTitle: Compass — Private Eligibility Firewall on 0G
seoDescription: Built solo for the 0G APAC Hackathon Track 5 (Privacy &
                Sovereign Infrastructure). Live on Aristotle mainnet.
```

## Mirror.xyz adjustments

If posting on Mirror as well, the same body works. Add an editions
mint at the bottom (free; 100 supply; "If this resonated, mint a
commemorative edition — proceeds split to Bethune House") if you want a
distribution mechanism aligned with the project's values.

## Cross-post timing

- T+0 (right after June 5 submission close): Hashnode primary.
- T+1: Mirror.xyz.
- T+2: Cross-post excerpt to LinkedIn (sanitized).
- T+3: Excerpt to Reddit `r/ethereum` and `r/privacy` (be conservative
  with the self-promo etiquette).
- T+7: Resurface in the F.5 X thread as post 5 if engagement is moving.
