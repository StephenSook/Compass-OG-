# Hackathon submission — field-by-field answers

Two forms to fill for the 0G APAC Hackathon submission:

1. **Google Form — "0G Project Registration / 项目登记"** (pre-submission, do first)
   - `https://docs.google.com/forms/d/e/1FAIpQLSdT1wJ8ymBznzv9RiBEz8zBoCRHsUdiCjdu7Qi1QrpkzfmjIg/viewform`
2. **HackQuest — Submit Project** (final submission, gated on demo video + X post)
   - `https://hackquest.io/hackathon/57e543a9-0b08-4ba3-8326-e5cd751c0248/<project-id>/submit`

This doc is the single source of truth for what to paste into each field. Update it if any answer changes (e.g., if a contract redeploys or the X post URL lands).

---

## Form 1 — Google Form (no gates, do NOW)

| # | Field | Value |
|---|---|---|
| 1 | Email checkbox | ✓ Record `stephensookra@gmail.com` |
| 2 | Telegram / WeChat | `@stephensookra` |
| 3 | Country / region | `United States` (pre-filled) |
| 4 | Your Project Name | `Compass` |
| 5 | What's Your Demo? (URL) | `https://app-psi-pied.vercel.app` |
| 6 | Project Build Progress | **100%** |
| 7 | Hackathon Stage | **Live & Deployed / 正式上线** |
| 8 | Submitted demo before CheckPoint? | **No** |
| 9 | 0G components used (multi-select) | ✓ 0G Storage · ✓ 0G Compute · ✓ 0G Chain · ✓ Agentic ID (ERC-7857) · ✓ TEE / Private Sandbox |
| 10 | 0G AI workflow tooling (multi-select) | ✓ 0G AI Context for Coding Assistants (CLAUDE.md / LLM context reference) |
| 11 | 0G SDKs / Starter Kits (multi-select) | ✓ `0glabs/0g-ts-sdk` (TypeScript Storage SDK) · ✓ Deployment Scripts (Hardhat / Foundry / Truffle) |
| 12 | Track interest (multi-select) | ✓ **Track 5: Privacy & Sovereign Infrastructure** (primary) · ✓ Track 1: Agentic Infrastructure & OpenClaw Lab |
| 13 | Biggest bottleneck (multi-select) | ✓ Market Validation — Finding real users · ✓ Growth — Need BD / distribution help |
| 14 | Team Size | **Solo** |
| 15 | Need to form a team? | **No** |
| 16 | Joined 0G APAC community? (multi-select) | ✓ 0G APAC Dev Telegram (`t.me/zerog_apac_dev`) |
| 17 | Schedule 1:1 sync for demo | **Yes** |
| 18 | BEYOND Expo 2026 Macau May 28 IRL | **Yes** — attending in-person for Compass demo showcase |
| 19 | Technical feedback (optional) | (paste below) |

### Q19 — Technical feedback paste

```
Aristotle mainnet RPC reliable. Cross-chain swap via hub.0g.ai TokenFlight (Hyperstream/Khalani) worked end-to-end, but US-based funding is rough — none of the four CEXes 0G recommends (Bitget/MEXC/Bybit/KuCoin) accept US KYC; Kraken only lists OGN not OG; Coinbase no listing. The only workable path I found: MoonPay $20 → ETH on Ethereum L1 → MetaMask → hub.0g.ai TokenFlight → native OG on Aristotle. An official US-friendly OG buying path (or a hackathon-only credit for US builders) would unblock more APAC-track US entries. ERC-7857 reference impl would speed adoption; I stripped to a minimal soulbound INFT. Phala dstack TDX integration was smooth — per-receipt RA-quote binding works well.
```

---

## Form 2 — HackQuest Submit Project (GATED, do after F.1 + F.5)

### Two gates before this form is fillable

1. **Create Compass project entry on HackQuest first.** The URL currently shows `/null/submit` — the "Select the Project to Submit" dropdown is empty because no project is registered against your HackQuest account. Look for "My Projects" → "Create Project" / "Register Project" in HackQuest dashboard before this submit form will work.
2. **F.5 Project X Post Link is required** — cannot submit HackQuest until the X post is live. F.5 itself depends on F.1 demo video URL. Sequence:
   ```
   F.1 record demo (Demo/script.md) → upload YouTube unlisted → DEMO_VIDEO_URL
         ↓
   F.5 post X tweet (Demo/x-post-final.md) → X_POST_URL
         ↓
   HackQuest Submit Project (paste DEMO_VIDEO_URL into project entry, X_POST_URL into form)
   ```

### Field-by-field

| # | Field | Value |
|---|---|---|
| 1 | Select the Project to Submit | `Compass` (after creating the entry on HackQuest) |
| 2 | Contract address | `0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b` (CompassHub — Aristotle mainnet entry point, chainId 16661). If the field accepts multiple/comma: also include AgentRegistry `0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9` |
| 3 | Prize Track (multi-select) | ✓ Grand Prizes · ✓ Excellence Awards · ✓ Community Awards |
| 4 | 0G Components (multi-select) | ✓ 0G Storage · ✓ 0G Chain · ✓ 0G Compute · ✓ Agent ID · ✓ Privacy / Secure Execution |
| 5 | 0G On-Chain Integration Proof (300 char) | (paste below) |
| 6 | GitHub Repository Link | `https://github.com/StephenSook/Compass-OG-` |
| 7 | Project X Post Link | (paste from F.5 once the X post is live) |

### Q5 — 0G On-Chain Integration Proof paste (under 300 chars)

```
Aristotle mainnet (chainId 16661): AgentRegistry 0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9, CompassHub 0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b. 3 demo policies (HELP/Bethune/Hospital) registered on-chain. Also live on Galileo testnet (16602). chainscan.0g.ai verifies all tx history.
```

(Counted: ~290 chars including spaces — under the 300 cap with room for the canonical alias if needed.)

---

## Final-week timeline (per OG team May 11 final-sprint announcement)

The 0G APAC Hackathon hard submission deadline is **May 16 2026, 23:59 GMT+8** (per Dragon's May 11 final-push tweet + the 0G-APAC-HACKATHON promo code expiry). HackQuest forms can keep being updated until the deadline; the final submitted version is what is judged. Today is 2026-05-11 → 5 days to go.

| Date (2026) | Action |
|---|---|
| May 11 (today) | Polish push; round-4 multi-agent audit shipped (see CHANGELOG). |
| May 12-13 | Record F.1 demo video (per `Demo/script.md`, 6 beats, ~2:55). Upload YouTube unlisted; capture URL. |
| May 14 | Stop the Phala TEE CVM cost meter only after recording finishes; restart it 24hr before any judge demo. Verify `/api/tee-status` returns `mode: tee` from a cold incognito session. |
| May 15 | F.5 — post X tweet using `Demo/x-post-final.md` template within 24hr of HackQuest submission; capture URL. Update Google Form (registration) + HackQuest submission form with the X URL and demo URL. |
| **May 16** | **23:59 GMT+8 hard HackQuest submission deadline.** Final-version-as-submitted is what is judged. |
| May 17+ | Community Award push (10× $1.3k voted via Discord/X engagement). Reply to every @0g_labs / @HackQuest_ engagement for 48 hours after the primary X post. |

### Dragon's final-sprint checklist (from the 2026-05-11 "Final Push" tweet)

The OG team's Dragon explicitly called out four things for the last 5 days. Compass status against each:

| Dragon's point | Compass status |
|---|---|
| 1. Going-to-market, not just code | 6 NGO/foundation outreach drafts in `docs/outreach/` (HELP, Bethune, Mission, Open Society, Luminate, Jockey Club). Press kit at `docs/press-kit.md`. Cite-this-work block in README. |
| 2. Nail one-liner | **"Prove eligibility, not identity."** Locked across README hero, /about, social-preview PNG, /opengraph-image, whitepaper, press kit, and every Demo/* file. |
| 3. Two videos — How It Works + Pitch | F.1 (`Demo/script.md`) targets the Pitch Video (Problem → Product → Architecture → Why 0G → Why Solo Build) at ~2:55. Pure user-journey "How It Works" track is **not** a separate recording in this submission; the Pitch covers both arcs because the runtime budget is 3:00 and a separate user-journey video would require footage not yet captured. Documented as a v0.6 follow-up. |
| 4. First 100 users the unsexy way | NGO + foundation cold-emails drafted. Pillar-5 traction log in README. F.5 X post tags 4 mandatory accounts (`@0G_labs @0g_CN @0g_Eco @HackQuest_`) for Community Award eligibility. |

### What's NOT in this submission (intentional)

- **BEYOND Expo Macau May 28 IRL demo** — out of scope until the hackathon submission lands; revisit post-May-16 if Compass gets shortlisted (per user feedback 2026-05-10: "leave out Macau until it's confirmed I have won").
- **0G Pay × Khalani integration** — Compass is a free eligibility check (NGO → migrant worker), no payment rail needed.
- **CheckPoint demo submission** — answered "No" on the Google Form because the v0.5 milestone landed after the CheckPoint window.

---

## Form 3 — HackQuest Project Archive (the entry that "Submit" gates on)

After creating the project on HackQuest, the platform opens a full **Project Archive** form with Overview / Checkpoints / Team tabs. This is what the user encountered at `hackquest.io/projects/setup/286c1d36-…/`. Fill every field below; the "0 Incomplete Project" badge clears once enough fields are populated.

### Overview tab

#### Top block

| Field | Value |
|---|---|
| Avatar / Logo (image upload) | Upload `app/public/og-image.png` (preferred — it's the canonical 1200×630 Compass brand asset) OR the favicon variant if the avatar slot is square (use `app/public/icon-512.png` if it exists, else crop `og-image.png` to a square). |
| Name (7/80 already filled) | `Compass` |
| Intro (0/200) | (paste below) |

##### Intro paste (~195 chars)

```
Private eligibility firewall on 0G. Workers prove eligibility for free legal help without disclosing name, HKID, employer. Subpoenas reach only a 15-min timestamp bucket. Live on Aristotle mainnet.
```

#### Sector chips (pick max 4)

- ✓ **Infra** (privacy infrastructure is the core)
- ✓ **AI** (the receipt-signer is a sealed AI agent inside the TEE)
- ✓ **Other** (identity / verifiable credentials — closest match for SD-JWT VC)
- (leave the 4th open, or pick **DAO** if the form requires 4)

#### Tech tag chips (pick max 8)

Click the existing chips:

- ✓ **Next** · ✓ **Solidity** · ✓ **Ethers** · ✓ **Node** · ✓ **Web3**

Then `+ Add New` for these three custom tags (HackQuest allows free-text additions):

- ✓ `TypeScript`
- ✓ `Phala-dstack`
- ✓ `SD-JWT`

(8/8 = full slate)

#### Links block

| Field | Value |
|---|---|
| MVP Link | `https://app-psi-pied.vercel.app` |
| Project Link (GitHub) | `https://github.com/StephenSook/Compass-OG-` |
| X (Twitter) Link | `steve_social_` (just the handle; the form prepends `x.com/`) |

#### Wallet

Click **Connect Wallet** → use the same MetaMask account that holds the deployer key (`0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34`) since that's the one with on-chain history matching the deployments. Same network (0G Aristotle, chainId 16661) as required by the helper text. If MetaMask isn't installed in the browser session, this can stay disconnected — reward claims happen post-judging.

#### Images (max 4)

Capture from the live deployment + `/about` page. All at the listed sizes (500×300 thumbs or 1280×720 hero).

| # | Source | What it shows |
|---|---|---|
| 1 | `/about` page (full architecture diagram screenshot) | Four-layer architecture — primary cover image. Save as `Demo/assets/hackquest/01-architecture.png`. |
| 2 | `/clinic/subpoena` page | The "shouldn't-be-possible" moment — what a clinic can disclose under PDPO §57. Save as `Demo/assets/hackquest/02-subpoena.png`. |
| 3 | `/audit-graph.html` | 3D force-graph of the public audit log — visual wow. Save as `Demo/assets/hackquest/03-audit-graph.png`. |
| 4 | `/onboard` 3-step page (post-mainnet, with the receipt minted) | Shows the working mainnet flow end-to-end. Save as `Demo/assets/hackquest/04-onboard.png`. |

If pressed for time, the existing `about-architecture.png` at repo root works for slot 1 directly (no recapture needed).

#### Videos — Demo Video tab

Click the small **link icon** (chain icon, right of the upload icon) and paste:

```
https://www.youtube.com/watch?v=vg5WZHmlzZI
```

Skip the upload icon — the YouTube URL link is the canonical reference.

#### Videos — Pitch Video tab

Paste the same URL — the demo video is a combined Pitch + How-It-Works track per `Demo/script.md`.

#### Description (rich text)

```
**368,000 foreign domestic helpers in Hong Kong — 9.6% of the workforce. 17% in forced labour. 60% deterred from filing Labour Tribunal claims by deportation fear. Every legal-aid intake forces disclosure of name, HKID, employer — every disclosure subpoena-reachable. Compass fixes this. Live on 0G Aristotle mainnet (chainId 16661).**

## The asymmetry

Migrant workers in Hong Kong number 368,000 — 9.6% of the local workforce (HK LegCo Research Office, 2025). Across APAC, 27.2 million migrant workers face similar disclosure traps (ILO Global Estimates, 2024). The services that exist to help them — legal aid clinics, shelters, public hospitals — all require identifying information at intake. Name, HKID, employer, visa status. Those are exactly the fields an abusive employer can later subpoena, or that a trafficker can use to find a worker who sought help. The status quo asks the most vulnerable people in the system to choose between getting help and being safe.

## What Compass changes

Compass eliminates the disclosure. A vulnerable worker carries an encrypted SD-JWT verifiable credential in her browser vault. A sealed inference receipt-signer running inside a Phala dstack TDX trusted execution environment evaluates an eligibility policy against selectively-disclosed claims. The result lands on 0G Chain as a `ReceiptIssued` event whose fields are non-identifying — only a 15-minute timestamp bucket, a policy ID, a nullifier, and a cryptographic commitment to the agent's on-chain identity.

A subpoena reaches the timestamp bucket and the commitment. Nothing else exists to be disclosed.

## How it's built

Compass runs end-to-end on 0G:

- **0G Chain (Aristotle mainnet 16661 + Galileo testnet 16602)** — AgentRegistry holds a soulbound INFT bound to the user's EOA. CompassHub atomically consumes a single-use grant and issues a receipt in one transaction; nullifier-replay and receipt-id-replay protection both enforced on-chain.
- **0G Storage** — the user's SD-JWT VC ciphertext (AES-256-GCM with a non-extractable WebCrypto key in IndexedDB) is uploaded to 0G Storage; the Merkle root is committed to `AgentRegistry.encryptedURI`. The decryption key never enters the chain.
- **0G TeeML / Phala dstack TDX** — the receipt-signer derives a deterministic secp256k1 key sealed to its attested image via `dstack.getKey('compass-receipt-signer')`. Each receipt is bound to a per-receipt RA quote whose `report_data` commits to `(signer, image, receiptId)`, defeating archived-quote replay across deployments.

## Honest limits

We are explicit about what Compass does NOT do. Coercion: an abusive employer who can see the worker's screen at disclosure can still read the plaintext SD-JWT VC before encryption. Coarse buckets: 15-minute windows are not full k-anonymity against statistical re-identification in edge cases. SD-JWT VC draft churn: the implementation pins to draft-15; we'll roll forward as the standard finalises. Full list at `docs/honest-limits.md`.

## What's verifiable today

- 40 Hardhat unit tests + property-based invariants pass.
- 103 receipt-signer vitest tests pass.
- Slither 0.11.5 with 101 detectors: 0 security findings.
- Codex GPT-5.5 adversarial pre-submission review caught + fixed 1 BLOCKER before mainnet deploy.
- 5 prior security audits (Codex x3, Slither, ultrareview, OWASP API).
- Playwright E2E suite scaffolded across the user journey.

Don't trust the maintainer — re-derive the cryptographic chain yourself with `enclave/src/verify-receipt.ts --bundle <receipt.json>`.

## Business Impact

**TAM** — 368,000 FDHs in Hong Kong (LegCo 2025) + 27.2M migrant workers across APAC (ILO 2024). HK Legal Aid Department spent HK$679.6M on civil cases in FY2024/25 — none of it prevents the disclosure that triggers deportation.

**Cost per incident:**
- Worker side: ≈ **US$22,200** lost (HK$152K remaining contract wages + HK$21K outstanding recruitment debt).
- Hong Kong government side: ≈ **US$14,100** lost (≈ HK$71,500 LAD civil application + HK$40-60K deportation processing).

**Sustainability** — open-source. Free for migrant-worker NGOs. AGPL core + commercial dual-license for non-NGO deployments. Phala dstack TDX hosting costs ≈ US$15/year per receipt-signer instance. 12-month grant ladder mapped: Phala Builders Program ($10-50K) → 0G ecosystem ($10-100K) → EF PSE + Mozilla Technology Fund ($30-250K) → Open Society Migration Initiative + Luminate + HK Jockey Club Special Projects ($150K-1M+). Target by month 18: ≈ US$60K/year recurring (managed hosting + dual-license), reducing grant dependency below 60%.

Full numbers + sources in `docs/whitepaper.md` → §Business Impact.

## Try it

- Live frontend: https://app-psi-pied.vercel.app
- Subpoena scene: https://app-psi-pied.vercel.app/clinic/subpoena
- Public audit log: https://app-psi-pied.vercel.app/audit
- 3D audit visualization: https://app-psi-pied.vercel.app/audit-graph.html
- Repo: https://github.com/StephenSook/Compass-OG-
- Demo video: https://www.youtube.com/watch?v=vg5WZHmlzZI

Built solo by Stephen Sookra for the 0G APAC Hackathon Track 5 (Privacy & Sovereign Infrastructure).
```

#### Progress During Hackathon (rich text)

```
Built end-to-end during the 0G APAC hackathon window (project kickoff 2026-05-02; submission 2026-05-16).

**Phase A — credential vault + agent identity (May 2-3)**
Browser-side AES-256-GCM encryption with non-extractable WebCrypto keys in IndexedDB. SD-JWT VC draft-15 selective disclosure. Soulbound minimal INFT on AgentRegistry binding the user's EOA to their encrypted vault URI on 0G Storage.

**Phase B — TEE receipt-signer (May 4-5)**
Express service running inside a Phala dstack TDX CVM. Deterministic secp256k1 key derivation via `dstack.getKey('compass-receipt-signer')`. Per-receipt RA quote with `report_data = sha256(signer || composeHash || receiptId)` — defeats archived-quote replay across deployments. ADR-003 documents the binding rationale.

**Phase C — atomic on-chain consume + issue (May 5-6)**
CompassHub.consumeGrantAndIssueReceipt() consumes a single-use grant and emits ReceiptIssued in one transaction. Nullifier-replay + receipt-id-replay protection enforced on-chain. 40 Hardhat unit tests + property-based invariants pass.

**Phase D — subpoena scene + audit log (May 7-8)**
/clinic/subpoena page renders what a clinic could actually disclose under PDPO §57 — only the 15-min timestamp bucket and the receipt commitment exist. /audit page lists every on-chain receipt with no identifying fields. /audit-graph.html renders the audit log as a 3D force-graph.

**Phase E — Aristotle mainnet deploy (May 10)**
AgentRegistry at 0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9 and CompassHub at 0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b on 0G Aristotle mainnet (chainId 16661). 3 demo policies (HELP / Bethune / HK FDH Hospital) registered on-chain.

**Phase F — demo + submission (May 11-16)**
Three-minute demo video at https://www.youtube.com/watch?v=vg5WZHmlzZI. Mermaid C4Context architecture diagram. 3 ADRs (MADR-lite) covering platform / credential / quote-binding decisions. Multi-agent audit landed CRITICAL Privy SSR fix + Docker dependabot + network-copy corrections. Final-week X cadence locked.

**Verifiability ledger (what shipped, what's testable):**
- 40 Hardhat unit tests + property-based invariants ✓
- 103 receipt-signer vitest tests ✓
- Slither 0.11.5 (101 detectors): 0 security findings ✓
- Codex GPT-5.5 adversarial review: 1 BLOCKER caught + fixed pre-mainnet
- 5 prior security audits (Codex x3, Slither, ultrareview, OWASP API)
- Playwright E2E suite scaffolded across user journey
- Verifiable independence: `enclave/src/verify-receipt.ts --bundle <receipt.json>` lets anyone re-derive the cryptographic chain offline.

**Non-code surfaces:** README ToC + Mermaid C4 + 22 entries · 3 ADRs · whitepaper PDF · press kit · 6 NGO outreach drafts · DoraHacks + Devpost cross-listing drafts queued post-deadline.
```

#### Fundraising Status (rich text)

```
Not actively fundraising. Solo hackathon build.

Any prize money seeds a small DoraHacks bounty pool (capped at 25% of any winnings) for v0.6 follow-on work:

- Native-speaker localization review for the 4 kiosk languages already shipped (Filipino, Bahasa Indonesia, Bahasa Malaysia, Cantonese)
- Browser-side 0G Storage upload v2 (replaces the current Node CLI upload path)
- Mythril symbolic-execution audit pass (catches anything Slither missed)

Open to partnership discussions with HK migrant-worker NGOs (Bethune House, HELP for Domestic Workers, Mission for Migrant Workers, Open Society Foundations, Luminate, Hong Kong Jockey Club Charities Trust) post-deadline. 6 cold-outreach drafts queued at `docs/outreach/` ready to send after May 16.
```

#### Active Hackathon

Select **0G APAC Hackathon 2026** from the dropdown (the one whose ID is `57e543a9-0b08-4ba3-8326-e5cd751c0248`).

#### Deployment Details

| Sub-field | Value |
|---|---|
| Ecosystem Deployed (dropdown) | Search/scroll for **0G** (or **0G Chain** / **0G Aristotle**). Select that entry. If only one 0G option exists, pick it. |
| Testnet / Mainnet (toggle) | **Mainnet** (primary — judges should see the mainnet deploy). Both are deployed; the textarea below covers Galileo too. |
| Contract address & deployed link (textarea) | (paste below) |

##### Contract address & deployed link paste

```
0G Aristotle MAINNET (chainId 16661):
  AgentRegistry  0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9
                 https://chainscan.0g.ai/address/0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9
  CompassHub     0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b
                 https://chainscan.0g.ai/address/0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b

0G Galileo TESTNET (chainId 16602):
  AgentRegistry  0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8
  CompassHub     0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b

3 demo policies registered on Aristotle CompassHub:
  help-legal-aid    0x21b8b0e65ae28bfbae2096e8a9b7bc245d92d5e56fb74ca989c1a551b4c2d08f
  bethune-shelter   0x907978ff834fc33b4a96dec017c847725ffa7a6410a1093aa1dfddb761a278a7
  hk-fdh-hospital   0x6a6ec18760b76ee7806463dfe7b33785f2d758d5302adfb749e228c1c5e0b786

Deployer:          0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34
Provider relayer:  0xaD736a7233847Cf1D73a7D820b32424CF8125b0a

Live frontend:    https://app-psi-pied.vercel.app
Subpoena scene:   https://app-psi-pied.vercel.app/clinic/subpoena
Public audit log: https://app-psi-pied.vercel.app/audit
3D audit graph:   https://app-psi-pied.vercel.app/audit-graph.html
TEE status JSON:  https://app-psi-pied.vercel.app/api/tee-status
GitHub:           https://github.com/StephenSook/Compass-OG-
Whitepaper PDF:   https://github.com/StephenSook/Compass-OG-/blob/main/docs/whitepaper.pdf
Demo video:       https://www.youtube.com/watch?v=vg5WZHmlzZI
```

### Checkpoints tab

Click `+ Add Checkpoint` six times and paste these. Each "Title" is short; the body field accepts richer text.

| # | Date (2026) | Title | Body |
|---|---|---|---|
| 1 | May 2-3 | Phase A — credential vault + agent identity | Browser-side AES-256-GCM with non-extractable WebCrypto keys in IndexedDB. SD-JWT VC draft-15 selective disclosure. Soulbound minimal INFT on AgentRegistry binding EOA → encrypted vault URI on 0G Storage. |
| 2 | May 4-5 | Phase B — TEE receipt-signer | Express service inside Phala dstack TDX CVM. Deterministic secp256k1 key via `dstack.getKey('compass-receipt-signer')`. Per-receipt RA quote with report_data = sha256(signer ‖ composeHash ‖ receiptId). |
| 3 | May 5-6 | Phase C — atomic on-chain consume + issue | CompassHub.consumeGrantAndIssueReceipt() consumes single-use grant + emits ReceiptIssued in one tx. Nullifier-replay + receipt-id-replay protection enforced on-chain. 40 Hardhat tests pass. |
| 4 | May 7-8 | Phase D — subpoena scene + audit log | /clinic/subpoena renders what's disclosable under PDPO §57 (only the 15-min timestamp bucket exists). /audit lists every on-chain receipt with no identifying fields. /audit-graph.html renders as 3D force-graph. |
| 5 | May 10 | Phase E — Aristotle mainnet deploy | AgentRegistry 0xf1FA…06Bf9 + CompassHub 0xe42f…C58b on chainId 16661. 3 demo policies (HELP / Bethune / HK FDH Hospital) registered on-chain. |
| 6 | May 11-16 | Phase F — demo video + submission | 2:52 demo at youtube.com/watch?v=vg5WZHmlzZI. Mermaid C4 architecture. 3 ADRs. Multi-agent audit landed CRITICAL Privy SSR fix + Docker dependabot. Final-week X cadence locked. |

Checkpoints are optional — if the form lets you submit without them, skip and circle back if time allows. They reinforce "shipped progressively, not stale repo" for judges.

### Team tab

| Field | Value |
|---|---|
| Team Intro (200 char) | (paste below) |
| Team Leader | `Stephen Sookra` (auto-set — that's you) |
| Team Member card | already populated (your profile with "Quack planet" / "I forgot to write any personal introduction" — consider updating that profile bio if you have 2 min) |
| Invite Link `nceW8et1` | Solo build — no need to share. |

##### Team Intro paste (~195 chars)

```
Solo build by Stephen Sookra — privacy-focused Web3 builder. Prior work: secp256k1 sealed inference, SD-JWT VC selective disclosure, Phala dstack TDX attestation. Telegram @stephensookra · X @steve_social_
```

(If your existing profile bio "I forgot to write any personal introduction" feels weak for judges, update it under HackQuest → profile → edit. Suggested: "Privacy-focused Web3 builder. Build constraints I take seriously: vulnerable users, subpoena-resistant logs, sealed inference. Reachable via Telegram @stephensookra.")

---

## Order to fill (one-pass, no back-tracking)

1. Avatar (icon upload) → Name (already done) → Intro paste
2. Sector chips (3 clicks)
3. Tech tag chips (5 clicks + 3 Add-New)
4. MVP / GitHub / X links
5. Wallet — skip OR connect Aristotle MetaMask
6. Images — capture all 4 screenshots first, upload as a batch
7. Demo Video → paste URL via link icon
8. Pitch Video → paste same URL
9. Description rich text — paste
10. Progress During Hackathon — paste
11. Fundraising Status — paste
12. Active Hackathon — pick "0G APAC Hackathon 2026"
13. Deployment Details — Ecosystem = 0G, Mainnet toggle, paste textarea
14. **Save Edit** (top right yellow button) — verify the "0 Incomplete Project" badge moves to "Complete Project" or shows the actual missing-field count
15. Switch to Checkpoints tab → add 6 checkpoints (optional but recommended)
16. **Save Edit**
17. Switch to Team tab → paste Team Intro
18. **Save Edit**
19. Click Back → from the project list, navigate to the official Submit Project form → fill Form 2 (per the table above)

Once the Project Archive is "Complete," the **Select the Project to Submit** dropdown on the HackQuest Submit Project form will populate with `Compass`, and Form 2 above becomes fillable.

---

## Post-submission tracking

After each form lands, append the timestamp + confirmation here:

- [x] Google Form submitted at: 2026-05-12 (per user confirmation)
- [x] HackQuest project entry created at: 2026-05-12 (Project Archive completed — 100 Info Complete)
- [x] HackQuest project archive saved (Overview / Checkpoints / Team) at: 2026-05-12
- [x] HackQuest Submit Project filed at: 2026-05-12 (capture confirmation: `Demo/hackquest-submission-confirmation.png`)
- [x] X post URL: `https://x.com/steve_social_/status/2054073329355530692` (all 4 @ tags + both # hashtags — Community Award eligible)

---

## Why these answers, not others

- **All 3 prize tracks selected on HackQuest** — Per the grand-prize execution plan, Compass is positioned for Grand Prizes (Track 5 win), Excellence Awards (per-category bonuses), and Community Awards (10× $1.3k via X/Discord engagement). Selecting all three keeps every prize lane open.
- **Both Track 1 + Track 5 on Google Form** — Track 5 (Privacy & Sovereign Infra) is the primary fit. Track 1 (Agentic Infra & OpenClaw Lab) is a secondary fit because C.2 shipped a Compass OpenClaw skill (`compass-eligibility-check`) at `docs/skills/compass-eligibility-check/`.
- **0G components: 5 of 6 selected** — Storage (encrypted vault ciphertext upload), Compute (Phala dstack TDX is 0G's TeeML compute path), Chain (AgentRegistry + CompassHub deployed to both Galileo and Aristotle), Agent ID (ERC-7857 stripped soulbound INFT for agent identity), and TEE/Private Sandbox (the entire privacy premise sits on Phala dstack TDX). Skipped 0G DA — not used in v1; the audit log is on 0G Chain directly.
- **SDKs: TypeScript Storage SDK + Hardhat deployment scripts** — `enclave/` and `app/` use `@0glabs/0g-ts-sdk` for the encrypted vault upload path. Contracts deploy via Hardhat from `contracts/`. The other listed SDKs (Rust, S3-compatible, Go, Web Starter, Compute) are not used in Compass v1.
- **CompassHub as the primary contract** on HackQuest's single-address field — CompassHub is the entry point for the grant-and-receipt flow; AgentRegistry is the dependency. If the field accepts multiple, include both.
- **Tech feedback uses concrete numbers** — the US-funding pain is a real builder-experience signal 0G can act on; the ERC-7857 reference-impl note is a constructive ask. Both improve the chance of in-person follow-up at BEYOND Expo.
