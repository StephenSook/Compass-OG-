# Final X post — submission window

Per plan F.5: post within 24 hours of HackQuest submission. Must include the four mandatory tags + both required hashtags so it's eligible for the Community Award track. Replace bracketed placeholders before posting.

---

## Primary post (X / Twitter — 280 chars hard cap)

> Compass — a private eligibility firewall on 0G. A vulnerable migrant worker proves she qualifies for free legal help without disclosing her name, HKID, or employer. The clinic gets a 15-min bucketed timestamp and a cryptographic commitment. That's it.
>
> Demo: [DEMO_VIDEO_URL]
> Live: https://app-psi-pied.vercel.app
> Repo: https://github.com/StephenSook/Compass-OG-
>
> @0G_labs @0g_CN @0g_Eco @HackQuest_ #0GHackathon #BuildOn0G

**Length check:** the body above is over 280 chars including links. Cut the second sentence ("The clinic gets…") if the platform compresses URLs to t.co. Confirm in the X composer; trim further if needed.

---

## Short variant (if 280-char limit bites)

> Compass — private eligibility firewall on 0G. Prove eligibility, not identity.
>
> Demo: [DEMO_VIDEO_URL]
> Live: https://app-psi-pied.vercel.app
> Code: https://github.com/StephenSook/Compass-OG-
>
> @0G_labs @0g_CN @0g_Eco @HackQuest_ #0GHackathon #BuildOn0G

---

## Thread continuation (optional, posts 2-4)

### Post 2 — the architecture beat

> Built end-to-end on 0G:
> · 0G Chain — AgentRegistry (soulbound INFT) + CompassHub (Authwit grants + receipt log) on Galileo
> · 0G TeeML / Phala dstack TDX — per-receipt RA quote binds (signer, image, receiptId)
> · 0G Storage — encrypted SD-JWT VC ciphertext (live upload v2)
>
> Whitepaper: https://github.com/StephenSook/Compass-OG-/blob/main/docs/whitepaper.pdf

### Post 3 — the wow moment

> Subpoena scenario, live: open https://app-psi-pied.vercel.app/clinic/subpoena
>
> Under PDPO §57, the clinic discloses ONLY:
> "Someone qualified for free legal assistance at 14:32 on May 18, 2026. That's all that exists."
>
> No name. No HKID. No employer. No documents.

### Post 4 — verifiable independence

> Don't trust me — re-derive the cryptographic chain yourself:
>
> ```
> git clone https://github.com/StephenSook/Compass-OG-.git
> cd Compass-OG-/enclave
> npm install
> npm run verify-receipt -- --bundle <your-receipt.json> \
>   --expected-compose 0x1884e756…cea0
> ```
>
> Slither: 0 sec findings. Codex pre-review: 1 BLOCKER caught + fixed.

---

## Pre-post checklist

- [ ] Demo video uploaded to YouTube unlisted; URL filled in above.
- [ ] HackQuest submission confirmation captured to `Demo/submission-confirmation.png` (per F.4).
- [ ] All four mandatory tags present: `@0G_labs @0g_CN @0g_Eco @HackQuest_`
- [ ] Both required hashtags present: `#0GHackathon #BuildOn0G`
- [ ] Final character count under 280 (X composer is authoritative).
- [ ] Frontend `https://app-psi-pied.vercel.app` loads cold in incognito (no SSO interstitial — verify deployment-protection state before posting).
- [ ] Phala CVM `mode: tee` per `/api/tee-status` (so judges who click the demo URL see the live TEE, not the stub fallback).
- [ ] Mention the whitepaper PDF link in at least one post if the thread fires.

---

## Post timing

- **Primary post:** within 24 hours of HackQuest submission confirmation (target: June 3 evening US time / June 4 morning APAC).
- **Thread continuation:** optional, post within 6 hours of the primary if engagement is moving (≥10 likes/RTs on the primary).
- **Replies:** monitor for 48 hours after the primary. Reply to every @0g_labs / @HackQuest_ engagement.

---

## Why the four tags + two hashtags matter

Per the HackQuest submission rules (re-verify before posting in case the rules update):

- `@0G_labs` + `@0G_CN` + `@0g_Eco` + `@HackQuest_` — without all four, the post is ineligible for the Community Award (10× $1.3k awards voted via Discord/X engagement).
- `#0GHackathon` + `#BuildOn0G` — hackathon discoverability tags.

Missing a tag = forfeit Community Award eligibility, not just lost reach. Treat the tag list as load-bearing, not decorative.
