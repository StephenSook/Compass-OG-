# Changelog

## Unreleased — Sookra Methodology compliance pass (2026-05-12, ninth wave)

Post-submission audit against the Sookra Methodology (Five Pillars +
Pitch Formula, documented in the personal Obsidian vault at
`References/Imports-Distilled/Sookra Methodology - *`). Hackathon
submission was strong on Pillars 1 (specific people), 2 (structural
gap), 4 (technology as inevitable answer) — weak on Pillar 3 (opening
stat hook) and Pillar 5 (closing business numbers). Pitch Formula
step 6 (lead with business impact + TAM, mentor input from Aaron +
Henry) was not followed in the hackathon-submission demo. This wave
closes those gaps for the BEYOND Expo Macau IRL pitch on 2026-05-28
without disturbing the already-locked HackQuest submission.

Defensible primary-source numbers researched in parallel via 3 agents
hitting WebSearch + Firecrawl against HK LegCo, ILO, World Bank, HK
Labour Department, HK LAD, Justice Centre HK, Amnesty International,
Mission for Migrant Workers, plus 0G/Phala/PSE/Luminate/OSF/HKJC
grant program pages. All numbers footnoted in
`docs/whitepaper.md` → §Business Impact and the new
`Demo/script-irl.md` IRL pitch.

### Added

- **`docs/whitepaper.md` → §Business Impact** — TAM (368K HK FDHs +
  27.2M APAC migrant workers + US$1.087B HK remittance outflow + 17%
  forced-labour rate + 60% deportation-fear deterrence), cost per
  incident (≈ US$22,200 to the worker, ≈ US$14,100 to the HK
  government), and sustainability (open-core + managed-hosted tier
  + 12-month grant ladder targeting Phala/0G/EF PSE → OSF/Luminate/
  HKJC). New References sub-section adds the 9 primary-source URLs
  the section depends on.
- **`Demo/script-irl.md`** — NEW. BEYOND Expo Macau IRL pitch script
  that LEADS WITH BUSINESS per Sookra Methodology Pitch Formula step
  6. Beat 0 opens on three numbers ($22,200 worker · $14,100
  government · 368,000 at risk) before the Maria persona enters in
  Beat 1 as proof. Beat 6 closes with the grant pipeline. Q&A prep
  table covers 7 likely judge questions including the moat,
  jurisdictional expansion, and 0G outage handling.

### Changed

- **`docs/whitepaper.md` → §Problem** — FDH population corrected from
  "~340,000" to the LegCo-sourced **368,000** (end-2024); composition
  + workforce-share added (55% Filipina, 42% Indonesian, 9.6% of HK
  workforce).
- **`README.md` → §Why this matters** — methodology-compliant
  rewrite: leads with 368K + 17% forced labour + 60% deterrence-from-
  filing, then closes with US$22,200 / US$14,100 cost-per-incident +
  link to Business Impact section. Stat-opener primes the rest of the
  README.
- **`Demo/hackquest-submission-answers.md` → Description paste** —
  368K stat-opener prepended to the Description rich-text block; new
  Business Impact subsection (TAM + cost-per-incident + sustainability
  + grant ladder) inserted before the §Try-it links. The user can
  re-paste the updated Description into HackQuest's Project Archive
  rich-text field (which is still editable post-submission via
  Project Archive top-level Save Edit) to flow the methodology gap
  closure to judges who land on the project page after the X cadence
  drives traffic.

### Honest carry-over

- **Demo Beat 6 title card stays at "15M migrant workers across APAC"**
  — the rendered video is locked at `vg5WZHmlzZI`; re-rendering means
  a new YouTube URL and propagation pain across 5 surfaces (README,
  X post, HackQuest, dorahacks, devpost). The 27.2M ILO figure is
  the more defensible APAC-wide number and is cited in every textual
  surface. v0.6 demo re-cut will align the title card.
- **The HackQuest Submit Project form is locked.** Project Archive
  rich-text fields (Description, Progress, Fundraising) are still
  editable. Re-paste the updated Description after this wave if the
  HackQuest UI allows. The X Post Link / Contract Address / GitHub
  Link / Prize Tracks / 0G Components are submitted-once fields.

## Unreleased — F.4 HackQuest project filed (2026-05-12, eighth wave)

Compass formally submitted to the 0G APAC Hackathon via HackQuest at
`hackathon/57e543a9-0b08-4ba3-8326-e5cd751c0248/.../submit`. Four days
ahead of the May 16 23:59 GMT+8 deadline. All three prize tracks
selected (Grand + Excellence + Community). 5 of 6 0G components
attested (Storage, Compute, Chain, Agent ID, Privacy/Secure Execution;
DA + Other skipped — DA unused in v1). On-chain proof packs the
Aristotle mainnet AgentRegistry + CompassHub addresses, 3 registered
demo policies, and the Galileo testnet parity note within the 300-char
cap.

The Project Archive (the entry that gates the Submit Project form)
landed earlier the same day at 100% Info Complete: avatar (1024×1024
brand-mark generated locally from `icon.tsx` design), 195-char intro,
3 sector chips (Infra + AI + Other), 8 tech tags (5 stock chips + 3
custom: TypeScript, Phala-dstack, SD-JWT), all 4 captured screenshots
(`/about` cover + `/clinic/subpoena` + `/audit-graph.html` + `/onboard`)
via Playwright at 1280×720 prod, demo + pitch video URLs both set to
the live YouTube URL, full Description + Progress During Hackathon
rich-text blocks with verifiability ledger, 6 Phase A-F checkpoints
mapped to HackQuest's Type taxonomy (Development × 3, Design × 1,
Launch × 2), evergreen profile bio + United States location swap.

### Added

- **`Demo/hackquest-submission-answers.md`** — Form 3 section
  expanded with field-by-field paste guide for the Project Archive
  (Overview / Checkpoints / Team tabs); post-submission tracking
  checkboxes flipped to checked with the 2026-05-12 timestamp on all
  four legs (Google Form + Project Archive + Submit Project + X post).
- **`Demo/assets/hackquest/compass-avatar.png`** — 1024×1024
  brand-mark avatar (black square + white italic serif "C") rendered
  via PIL from `app/src/app/icon.tsx` design parameters. Scales clean
  to any HackQuest avatar slot from 32px to 512px without artifacts.
  Generated reproducibly — same Times New Roman Italic at fontSize
  760 on 1024×1024 black background.
- **`Demo/assets/hackquest/01-04-*.png`** — Four 1280×720 screenshots
  captured from `app-psi-pied.vercel.app` via Playwright MCP for the
  Project Archive Images slots: `01-about-architecture.png` (cover —
  hero "Bounded disclosure" + Layer 1 box), `02-subpoena.png`
  (INVESTIGATION REQUEST + [NO DATA] wow moment),
  `03-audit-graph.png` (3D force-graph receipt nodes),
  `04-onboard.png` ("Maria's agent, in three steps" + Connect wallet).

### Submitted answers (load-bearing references — do NOT change without redoing the submit)

- Contract address (the form's single-address field) =
  `0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b` (CompassHub on
  Aristotle mainnet, chainId 16661). AgentRegistry
  `0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9` is included in the
  300-char On-Chain Integration Proof.
- Project X Post Link =
  `https://x.com/steve_social_/status/2054073329355530692` (all 4
  mandatory @ tags `@0G_labs @0g_CN @0g_Eco @HackQuest_` + both
  hashtags `#0GHackathon #BuildOn0G` confirmed present — Community
  Award eligible).
- GitHub Repository Link = `https://github.com/StephenSook/Compass-OG-`

### Gated next-actions (post-submission)

- **Capture confirmation screenshot** → save as
  `Demo/hackquest-submission-confirmation.png`. Single source of truth
  the form landed within the window.
- **Continue build-in-public X cadence** through May 16 — posts 7/10
  (demo video drop), 8/10 (subpoena scene), 9/10 (browser-verifier),
  10/10 (final shipped + ask) per `Demo/x-post-final.md`. Posts 7-9
  thread off 6/10; post 10/10 standalone if a stronger
  Community-Award-eligible link is needed.
- **48-hour reply window** — monitor `@0G_labs` / `@HackQuest_` /
  `@0g_CN` / `@0g_Eco` engagement on the submitted X post; reply to
  every mention within the window. Community Award is votes on X +
  Discord engagement during active judging.
- **Phala TEE restart 24hr before any judge demo** — the CVM is
  stopped between cycles to save cost ($0.04/day idle); restart
  before any cold demo so `/api/tee-status` returns `mode: tee` not
  the stub fallback. Verify via cold incognito GET to
  `https://app-psi-pied.vercel.app/api/tee-status`.

## Unreleased — F.1 demo video shipped (2026-05-12, seventh wave)

The 3-minute walkthrough is live on YouTube unlisted at
<https://www.youtube.com/watch?v=vg5WZHmlzZI>. Recorded in a single
take, edited post-recording via the ffmpeg pipeline documented in the
session memory (Beat 2 hands-sink Ken Burns substitution at 11.6-25s
of the trimmed timeline, Beat 6 black-card closer at 161.9-171.9s,
audio normalized to -14 LUFS / -1.5 TP per YouTube spec, 1920×1080 @
16fps H.264 High profile, AAC 48kHz stereo, faststart moov atom).
Final runtime 2:52, under the 3:00 HackQuest cap. Webcam selfie +
"Stephen Sookra" name tag preserved as founder presence per Dragon's
"Why your team" criterion.

### Changed

- **`README.md`** — Hero "Watch the demo" block now links the live
  YouTube URL with a one-liner ("Maria's path from the harm to a
  mainnet-attested receipt in six beats, 2:52, 1080p").
- **`Demo/x-post-final.md`** — Both `[DEMO_VIDEO_URL]` placeholders
  (primary post + short variant) replaced with the live URL.
- **`docs/distribution/dorahacks-listing.md`** — Demo video link
  filled in.
- **`docs/distribution/devpost-listing.md`** — Demo video link
  filled in.
- **Vercel prod env** — `NEXT_PUBLIC_COMPASS_DEMO_VIDEO_URL` set to
  the live URL. Triggers the sticky `<DemoCta>` primitive (bottom-
  right "Watch the 3-min demo →" CTA) on every page. New deploy
  promoted to `app-psi-pied.vercel.app`.

### Not yet (gated on user action)

- F.5 X post — uses `Demo/x-post-final.md` template with the URL
  already filled in. Post within 24hr of HackQuest submission.
- HackQuest submission — submit project + paste demo URL + X post
  URL.
- Update X post on @steve_social_'s May 6 thread with the demo URL
  as a thread continuation (optional; new audiences can find via
  README).

---

## Unreleased — OG team May 11 announcement sync (2026-05-11, sixth wave)

OG team's "Final Push — 5 DAYS TO GO" tweet (Dragon, May 11) + the
"0G APAC Hackathon · Final Week Sprint" Discord post locked the
HackQuest submission deadline at **May 16 2026, 23:59 GMT+8** — not
June 5 as several Demo/* drafts had inherited from an earlier
internal timeline.

### Changed

- **`SUPPORT.md`** — response-time table footnote updated from
  "now → June 5 2026" to "now → **May 16 2026, 23:59 GMT+8**" with
  attribution to the OG team's May 11 final-sprint announcement.
- **`Demo/x-post-final.md`** — "Post timing" section: primary post
  target moved from "June 3 evening US time / June 4 morning APAC"
  to "**May 15 evening US time / May 16 morning APAC**, within
  24hr of HackQuest submission." Added explanatory paragraph
  citing the OG team announcement.
- **`Demo/hackquest-submission-answers.md`** — replaced the
  "Revised timeline (BEYOND Expo Macau = Yes)" section entirely.
  Old timeline reached June 5; new "Final-week timeline" maps
  May 11 (today) → May 16 (deadline) → May 17+ (community award
  push). Removed Macau travel prep (per user 2026-05-10:
  "leave out Macau, not confirmed I've won"). Added a
  **Dragon's final-sprint checklist** sub-section mapping the
  4 points from the May 11 tweet against Compass status:
  (1) going-to-market via NGO outreach drafts;
  (2) one-liner locked "Prove eligibility, not identity.";
  (3) Pitch Video covers user-journey arc at 2:55 — separate
      "How It Works" video deferred to v0.6;
  (4) Community Award eligibility via 4 mandatory tags in F.5.
  Added a "What's NOT in this submission (intentional)"
  sub-section explicit about Macau, 0G Pay × Khalani,
  CheckPoint deferral.
- **`Demo/hackquest-submission-answers.pdf`** — regenerated to
  match the .md changes (md-to-pdf, ~249 KB).
- **`Demo/otc-discord-ping.md`** — June 5 → May 16 23:59 GMT+8.
- **`Demo/discord-support-ticket.md`** — two June 5 references
  → May 16 23:59 GMT+8.

### Why this matters

Both HackQuest submission and registration forms are editable until
the deadline; the final submitted version is what gets judged
(Dragon's "5 days to go" tweet, point 5). The Demo/* drafts
needed to reflect the actual deadline so the final-sprint cadence
matches what the OG team will actually grade against.

### What this does NOT touch (verified clean)

- `README.md`, `docs/whitepaper.md`, `docs/press-kit.md`,
  `Demo/script.md`, `Demo/storyboard.md`, `docs/honest-limits.md`,
  `docs/outreach/*.md` — none of these had embedded deadline
  references; they are framed around the live product not the
  submission window.
- The one-liner "Prove eligibility, not identity." is already
  locked across README, /about, social-preview PNG, /opengraph-image,
  whitepaper, press kit, and every Demo/* file — no edit needed.
- ADRs, threat model, architecture doc — frozen as historical
  records; no deadline coupling.

---

## Unreleased — Round-4 multi-agent audit cleanup (2026-05-11, fifth wave)

7-subagent + 1-skill parallel review surfaced one CRITICAL SSR
regression in my own perf fix plus 9 doc drifts, 1 mainnet-copy bug,
1 verifier-output-structure improvement, and 1 dependabot scope gap.
All shipped.

### Fixed

- **CRITICAL** Privy `dynamic({ ssr: false })` at root layout broke
  SSR for the entire app tree. The wrapper rendered null server-side,
  so `{children}` were not emitted in server HTML on every RSC route
  (`/about`, `/faq`, `/roadmap`, `/audit`, `/clinic/*`, `/vault`,
  `/analytics`, `/demo`, `/policies/*`, `/receipt/*`). Mounted-flag
  pattern: render `<>{children}</>` on SSR + pre-hydration, lazy-load
  Privy after `useEffect` fires.
  (`app/src/components/providers/PrivyClientProvider.tsx`)
- **Mainnet UX** — `/onboard` step 2 hardcoded "Galileo" in user-
  visible copy and linked to the Galileo faucet, while `activeChain()`
  routes writes to Aristotle when `NEXT_PUBLIC_COMPASS_USE_MAINNET=1`.
  A mainnet demo sent users to the wrong faucet. Now: network name
  derived from `activeChain().name`; funding affordance branches on
  `useMainnet()` (Galileo → faucet button, Aristotle → CEX/bridge
  doc).
  (`app/src/components/onboard/MintAgentButton.tsx`,
  `app/src/app/onboard/page.tsx`)
- **README drift** — Aristotle mainnet row flipped from "draft" to
  "real" with both deployed addresses (was contradicting 5 other
  places in the same README + `/about`). `--bundle <path>` mode
  marked "v2 roadmap" but already shipped — line removed. C4Context
  diagram split "0G Chain + 0G Storage" into two systems with
  Storage marked v2/draft.
- **`docs/architecture.md`** — ASCII diagram listed
  `authorizeUsage (ERC-7857)` under AgentRegistry, but contracts are
  ERC-7857 *stripped*. Replaced.
- **ADR-0001** — Clarified `dstack-0.5.9` is the CVM image; the SDK
  pin is `@phala/dstack-sdk@0.5.7` (normal one-patch lag).
- **ADR-0002** — BBS+ rejected-alternative justification claimed
  `agentIdCommitment` linkability is "necessary for nullifier replay
  protection." Codex round 4 caught this is factually wrong —
  `buildNullifier(nonce, provider, policy)` against
  `CompassHub.usedNullifiers` doesn't require stable
  `agentIdCommitment`. Rewrote to make the two properties orthogonal.
- **ADR-0003** — Canonicalization "shared between Node and browser
  ports" was wrong — it's byte-parity-duplicated with paired vitest
  cases. Clarified. Also clarified that the Claude Code skill wraps
  the CLI rather than re-implementing it.
- **ADR-0003 §"Negative"** — DCAP signature-chain verification was
  framed as a deliberate scope boundary in prose only. silent-failure-
  hunter caught that programmatic consumers can't detect "incomplete
  verification" from prose. Added `dcapVerified: false` as a typed
  literal field on `VerifyResult` (both `ok: true` and `ok: false`
  variants) so downstream agents can branch on the field directly.
- **`docs/adr/README.md`** — Template link pointed at a path inside
  the user's global Claude config (`.claude/skills/...`) that doesn't
  exist in this repo. Replaced with copy-an-existing-ADR guidance.
- **`SUPPORT.md`** — Bug/Feature issue links used legacy `.md`
  template names; the repo ships `.yml` issue forms. Fixed.
  "Security disclosures (`security@…` per SECURITY.md)" referenced a
  channel SECURITY.md doesn't expose — real channels are
  `stephensookra@gmail.com` (subject `[Compass Security]`) and
  Telegram `@stephensookra`. Aligned.

### Added

- **`.github/dependabot.yml`** — Docker ecosystem entries for
  `/enclave/Dockerfile` and `/enclave/phala/Dockerfile`. Without
  these, base-image CVEs got no Dependabot PRs. Codex round 4.

### Audit attribution

Round-4 reviewers (parallel, ~3-7 min each):
- **Codex GPT-5.5** adversarial — 2 MEDIUM (ADR-0002 nullifier
  claim, mainnet faucet copy), 2 LOW (docker dependabot,
  SUPPORT.md links). INFO: Privy fix clean post-mounted-flag
  rewrite; BlurText first-word skip clean.
- **Gemini 2.5 Pro** long-context whole-repo — 3 SHIP doc drifts
  (Aristotle row stale, `--bundle` lie, ERC-7857 mention), 1
  DOCUMENT-as-limit (dstack version split).
- **pr-review-toolkit:code-reviewer** — 1 CRITICAL (SSR break), 1
  important (ADR README broken link).
- **pr-review-toolkit:silent-failure-hunter** — 1 CRITICAL
  (Privy fallback UI), 1 HIGH (DCAP framing).
- **pr-review-toolkit:type-design-analyzer** — 1 HIGH (branded
  crypto types — deferred to v0.6), 1 MEDIUM (VerifyResult failure
  variant tightening — deferred).
- **pr-review-toolkit:pr-test-analyzer** — 5 test-coverage gaps
  (deferred to v0.6).
- **vercel:deployment-expert** — CI/CD hardening recommendations
  (deferred — orthogonal to project quality, batched for v0.6).
- **security-audit skill** — verdict SAFE. No new findings beyond
  prior 5 audit rounds.

### Deferred to v0.6

- Branded crypto identifier types (`EthAddress`, `HexBytes32`) —
  refactor across `parseBundle` + all crypto call sites.
- VerifyResult failure-variant field-tightening.
- 8 test-coverage gaps (env-mode sentinel, quote-format errors,
  report_data padding, forceLruEvict, /verify file-size cap,
  compassEnclave.ts, crypto/vault.ts, enclave dstack helpers).
- CI hardening (E2E job, `.next/cache`, Hardhat artifact pass-
  through, concurrency group).
- 4 user-action items (Vercel secrets, Vercel-Sensitive flags,
  rollback-safety contract-address pinning).

---

All notable changes are tracked here. Older changes during the
build-up phase are folded into milestone summaries; recent changes are
listed by commit. The version cadence follows the hackathon timeline,
not semver — this is `v0.x` until the post-hackathon hardening pass.

## Unreleased — Vercel perf audit SHIP fixes (2026-05-11, fourth wave)

Independent Vercel `performance-optimizer` agent audit flagged two
SHIP-priority wins. Both applied.

### Changed

- **`app/src/components/providers/PrivyClientProvider.tsx`** —
  static `import { PrivyProvider } from "@privy-io/react-auth"`
  replaced with `next/dynamic({ ssr: false })`. The Privy vendor
  chunk (~1.22 MB uncompressed, ~290 KB brotli) was being hoisted
  into the root layout bundle and shipped on **every route** —
  including `/verify`, which uses no wallet. Now it loads only
  when `PRIVY_APP_ID` is set AND this provider mounts (i.e.,
  `/onboard` step 1). Expected: `/verify` loses ~1.0 MB of JS;
  `/` LCP drops ~150 ms on slower devices.
- **`app/src/components/primitives/BlurText.tsx`** — first word
  (`i === 0`) now skips the blur/opacity stagger animation. Reason:
  Chrome's LCP picker waits for `opacity > 0` and `filter: blur(0)`
  before counting a glyph as paint-complete. Animating the LCP
  word delayed real LCP by ~400 ms (4 words × 100 ms stagger).
  Other words still animate; only the first is instant. No visual
  regression unless the first word matters less than the others
  for the design — for the hero "Prove eligibility, not identity.",
  it does not.

### Honest scope notes

- Two `CONSIDER`-tier fixes from the same audit (Floating-UI 147 KB
  tooltip chunk dynamic-load; drop Instrument_Serif italic 15 KB)
  not applied yet — left for v0.6 if the perf budget justifies it.
- The audit ran without PSI access (quota exhausted earlier); chunk
  sizes were derived from direct `curl` of brotli-served bundles
  plus identifier extraction. The "expected" LCP/TTI improvements
  are projections, not measured. Validate post-deploy via
  Vercel Analytics Real User Monitoring or local Lighthouse.

---

## Unreleased — ADRs + Mermaid C4 + social preview + Discussions (2026-05-11, third wave)

Doc-deep + community surfaces.

### Added

- **`docs/adr/`** — Architecture Decision Records (MADR-lite format):
  - **ADR-0001**: 0G Chain (Aristotle) + Phala dstack TDX as the
    privacy platform — over Aztec / Aleph / SGX / SEV-SNP / 0G TeeML.
  - **ADR-0002**: SD-JWT VC for selective disclosure — over PCD,
    zkSNARK Groth16, BBS+, or plain JWT.
  - **ADR-0003**: Per-receipt RA quote with
    `report_data = sha256(ethAddress || composeHash || receiptId)`
    binding — over boot-quote binding, batched quotes, or
    image-only binding. Defeats archived-quote replay.
  - **README** — ADR index + "when to write an ADR" guidance.
- **Mermaid C4Context diagram** inside the README Architecture
  section. Renders natively on GitHub. Covers the 3 person-actors
  (worker, clinician, judge) + 4 systems (Compass, NGO Issuer,
  0G Chain + Storage, Phala dstack TDX) + 7 relationships.
- **`docs/social-preview.png`** — custom 1280×640 GitHub social
  preview. Rendered from the live `/opengraph-image` endpoint
  (Next.js `next/og` Satori output, 1200×630 baseline), padded
  to GitHub's 2:1 spec on a dark `#0a0e1a` canvas to match the
  Cinematic Privacy aesthetic. Drop-in for **Settings → General →
  Social preview → Upload image**.
- **`.github/FUNDING.yml`** — single `custom:` entry pointing at the
  maintainer's Telegram for collaboration / NGO partnership inquiries.
  (No GitHub Sponsors account yet; trivial one-line swap when one
  is configured.)
- **GitHub Discussions enabled** via
  `gh api -X PATCH repos/StephenSook/Compass-OG- -f has_discussions=true`.
  Six default categories auto-created (Announcements, General,
  Ideas, Polls, Q&A, Show and tell). Q&A is the canonical
  user-help surface for non-security questions per `SUPPORT.md`.

### Changed

- **README documentation map** — added link to `docs/adr/` so judges
  can find the rationale-with-rejected-alternatives writeups without
  hunting.

---

## Unreleased — Repo hygiene + visualizations (2026-05-11, second wave)

Repository-health pass aligned with current OSS best practices, plus three
pre-rendered visualizations of the codebase.

### Added

- **README table of contents** — 22-entry section index near the top
  for fast judge skim. Anchors map to existing H2 headers (no rename
  churn).
- **README "Why this matters" elevator pitch** — 2-sentence opener
  above Maria's story that frames the privacy gap in concrete legal
  terms (14-day FDH deportation window + subpoena vulnerability).
- **`docs/visualizations/`** — three pre-rendered codebase views:
  - `compass-architecture-3d.html` — hand-curated 22-node / 27-edge
    3D force graph of the holder / credential / 0G Storage / 0G Chain
    / TEE / verifier layers. Built on three.js + 3d-force-graph with
    bloom post-processing, hover-to-trace neighbors, click-for-detail
    info panel. Standalone, CDN-only, no build step.
  - `compass-knowledge-graph.html` + `.json` — auto-generated
    full-codebase graph via `graphify update .`: 484 nodes (files +
    symbols), 491 edges (containment, imports, calls), 132
    communities. RAG-ready node-link JSON.
  - `compass-gource.mp4` — animated git-history time-lapse rendered
    with gource 0.56 + ffmpeg, 1280×720 H.264, ~3.2 MB.
  - `compass-graph-report.md` — plain-language audit of every node +
    edge in the graphify output (35 KB).
  - `README.md` — index + regeneration commands for all three.
- **`.github/dependabot.yml`** — weekly npm + github-actions updates
  on Monday 06:00 HKT for `/app`, `/enclave`, `/contracts`, and
  workflow files. Labels routed to `dependencies` + `security`.
- **`.github/CODEOWNERS`** — pre-wired review routing (currently all
  paths → `@StephenSook`; adding a co-maintainer is now a one-line
  change instead of a repo-wide refactor).
- **`SUPPORT.md`** — channel-by-channel help index (security
  disclosures → SECURITY.md; verifier UX → `/verify`; threat model →
  `docs/threat-model.md`; etc.). Sets explicit response-time
  expectations.
- **`.github/ISSUE_TEMPLATE/bug.yml`** + **`feature.yml`** + **`config.yml`** —
  modern GitHub issue *forms* (dropdowns, validation, required fields,
  contact-link routing for security disclosures). Replaces the
  legacy `.md` templates which GitHub no longer detects as templates
  in the community-profile API.

### Changed

- Repo metadata via `gh repo edit`:
  - **Homepage URL** set to <https://app-psi-pied.vercel.app>
    (previously empty).
  - **Topics** populated with 20 entries for discoverability: `0g`,
    `0g-foundation`, `web3`, `privacy`, `zero-knowledge`,
    `verifiable-credentials`, `sd-jwt`, `selective-disclosure`, `tee`,
    `intel-tdx`, `phala-network`, `dstack`, `confidential-computing`,
    `remote-attestation`, `ethereum`, `solidity`, `nextjs`,
    `typescript`, `hackathon`, `self-sovereign-identity`.
  - **Wiki + Projects disabled** (both unused; reduces surface area
    for typo-squat issues and orphan content).

### Removed

- `.github/ISSUE_TEMPLATE/bug.md` + `feature.md` — superseded by
  `.yml` issue forms (same content, modern surface).

---

## Unreleased — UI/UX polish push + /verify differentiator (2026-05-11)

The "tighten before submission" milestone. No new features; polish of
existing surfaces.

### Added

- **OG image generation** — 8 per-route `opengraph-image.tsx`
  generators using `next/og` `ImageResponse`. Routes: `/`, `/about`,
  `/clinic/subpoena`, `/audit`, `/onboard`, `/demo`, `/faq`,
  `/roadmap`. Shared template at `app/src/lib/og.tsx`. Every shared
  link now unfurls with a custom 1200×630 hero card on the canonical
  black background.
- **PWA manifest + dynamic favicon + apple-touch-icon** —
  `app/src/app/manifest.ts`, `icon.tsx`, `apple-icon.tsx`. Black square
  with white italic `C` mark. Add-to-home-screen affordance on iOS +
  Android Chrome.
- **Custom `not-found.tsx` + `error.tsx`** — on-brand 404 ("Neither
  does Maria's HKID, on-chain") + 500 ("The receipt-signer probably
  didn't") with retry, home, and `/api/tee-status` CTAs. Replaces the
  Vercel default fallback pages.
- **`<Term>` glossary tooltip primitive** — Radix-Tooltip-backed,
  keyboard-focusable, screen-reader-friendly via `aria-describedby`,
  portal-mounted. 20 glossary entries in `app/src/lib/glossary.ts`
  covering SD-JWT VC, EIP-712, PDPO §57, agentIdCommitment, dstack,
  composeHash, RA quote, MR_TD, soulbound INFT, nullifier, 0G TeeML,
  Phala dstack TDX, Authwit, non-extractable WebCrypto key, secp256k1,
  Ed25519, bucketed timestamp, Merkle root, HKID, FDH. Applied to
  `/faq` (4 questions) and `/clinic/subpoena` (PDPO §57 header).
- **`<CursorSpotlight>` primitive** — pointer-following 420px radial
  gradient (4.5% alpha) on every dark-themed page. Pure CSS variable
  + pointermove listener; no WebGL, no library. Honors
  `prefers-reduced-motion`.
- **`<Reveal>` primitive** — IntersectionObserver-driven fade-in +
  translate-up wrapper. Applied to 5 Sections on `/about` with
  staggered delays (0/60/120/180/240ms) for a gentle scroll cascade.
- **`<DemoCta>` primitive** — sticky bottom-right "Watch the
  3-min demo →" CTA. Env-gated on
  `NEXT_PUBLIC_COMPASS_DEMO_VIDEO_URL`; renders null until F.1 lands.
  Shows after 800ms or 30%-viewport scroll. Session-dismissible.

### Added (continued — `/verify` + SEO + onboard polish push, commits 5a87b1f + f1602ab)

- **`/verify` — browser-side receipt verifier.** Drag-drop or paste a
  Compass receipt-bundle JSON; the page re-runs the same four
  cryptographic checks the `verify-receipt` CLI does, entirely in the
  browser using `@noble/curves` + `@noble/hashes`. No clone, no
  `npm install`, no terminal. Source: `app/src/lib/verifyReceipt.ts`;
  UI: `app/src/app/verify/page.tsx`. **Try sample** loads the bundled
  fixture from `app/public/samples/receipt-sample.json` and auto-swaps
  the composeHash input to the fixture value so all four checks tick
  green on first click. Per-route OG image at `verify/opengraph-image.tsx`.
  Home page + `/demo` step 06 both link the new page.
- **`app/src/app/sitemap.ts`** — auto-generated XML sitemap listing 16
  public routes with change-frequency + priority. Search engines now
  see the privacy claim, the architecture page, the subpoena scene,
  the FAQ, the roadmap, the verify page, and the audit log explicitly.
- **`app/src/app/robots.ts`** — open robots policy; `/api/` and
  `/_next/` disallowed; sitemap pointer included.
- **`/onboard` progress indicator** — 3-bar progress strip + "X of 3 ·
  current-step" label above the step list. `STEP_LABELS` + `labelFor()`
  helper added to surface the current step name without duplicating
  literals. Existing step state machine + aria-live region untouched.

### Dependency added

- `@radix-ui/react-tooltip ^1.2.8` (~10kb gzipped, AA accessibility)
- `@noble/hashes ^2.2.0` (sha256, keccak256 for the browser-side verifier)

### Added (continued — standards-alignment signal)

- **`/about` "Standards alignment" section** + `docs/honest-limits.md`
  §6 update: Compass' SD-JWT VC path is interoperable with the EU
  Digital Identity Wallet under [eIDAS 2.0](https://eur-lex.europa.eu/eli/reg/2024/1183/oj)
  (in effect since 2025). Notes the recent IETF draft increment
  (draft-15 → draft-16, April 2026; Compass v0.5 stays on -15, v0.6
  rolls forward). Links to RFC 9601 + the arXiv eIDAS-2.0 SSI analysis.
  No code path changes — the signal is for non-Web3 humanitarian-track
  judges + NGO partnership conversations where EUDIW alignment matters.

### Fixed

- **CI Slither job unblocked.** `contracts/.npmrc` pins
  `legacy-peer-deps=true` so the crytic/slither-action Docker — which
  re-invokes `npm ci` without the flag — picks it up from the dir.
  Action gains `ignore-compile: true` to reuse the host pre-compile
  output and skip the redundant dep install inside Docker.
  First 4/4 green CI run on Compass.
- **`/verify` Try-sample composeHash auto-swap (f1602ab).** The bundled
  sample is a test fixture pinned to `0xab × 32`, not the production
  composeHash. Clicking Try-sample now sets both fields together so the
  "first click" demo path lands green; real-receipt verifications keep
  the production composeHash as the default.

---

## v0.5 — Aristotle mainnet (2026-05-10)

The "make it real on the canonical chain" milestone. Compass now runs
end-to-end on 0G Aristotle mainnet (chainId 16661), with the Galileo
testnet remaining as a parallel demo path.

### Added

- 0G Aristotle mainnet deployment: AgentRegistry at
  `0xf1FAaBef1d00Db1a15b7637Dc0d8526449D06Bf9`, CompassHub at
  `0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b`. Three demo policies
  (`help-legal-aid`, `bethune-shelter`, `hk-fdh-hospital`) registered
  on mainnet.
- B.4 — 3D Spline scene on `/about`, lazy-loaded behind Suspense,
  zero impact on cold bundle when unset. R13 LCP guard retained.
- Honest reality-table flips: Aristotle deploy row → real; Spline
  row → real; 13 of 17 rows now `real`.
- D.2 — Slither audit post-Aristotle-deploy re-run identical to the
  baseline (`docs/audits/slither-2026-05-10.md`).
- F.4 — Field-by-field hackathon submission answers
  (`Demo/hackquest-submission-answers.md`) covering both HackQuest and
  the 0G Project Registration Google Form.

### Fixed

- Codex BLOCKER caught + fixed pre-mainnet: `agentIdCommitment` in
  `/api/consume` now uses `recoverTypedDataAddress` + `keccak256(abi.encode(uint256, address))`
  exactly matching CompassHub's on-chain encoding.
- Privy onboarding reliability: `MintAgentButton` now uses
  `parseEventLogs` filtered by `eventName: "AgentMinted"` instead of
  filter-by-address (which hit `Transfer` first when ERC721
  `_safeMint` emits both). PrivyConnectButton drops the
  double-fire-on-reauth pattern.
- `@ts-expect-error` directive in `SplineScene.tsx` removed after the
  install gate cleared (would otherwise become an unused-directive
  build error under TS strict).

## v0.4 — Hardening (2026-05-09 → 2026-05-10)

The "be honest, be auditable, be testable" milestone.

### Added

- D.1 — Playwright E2E test suite scaffolded across `/`, `/vault`,
  `/clinic/subpoena`, and the browser-side AES-256-GCM crypto path.
- D.2 — Slither 0.11.5 audit (101 detectors) at
  `docs/audits/slither-2026-05-10.md`. 0 security findings. Refactor
  extracted `IAgentRegistry` to its own file.
- D.3 — Trust-list governance v1 documented; v2 DAO design specced at
  `docs/trust-list-governance.md` (5-of-7 add quorum, 3-of-7 revoke,
  7-day timelock with 24h revoke expedite).
- D.4 — `verify-receipt` CLI now supports `--bundle <receipt.json>`
  for one-shot verification by recipients; README cookbook adds a
  3-step "I received a receipt, how do I verify it?" path.
- E.1 — HLS / MP4 hero video background scaffold (env-gated;
  AmbientSphere SVG fallback when unset).
- E.2 — `/analytics` page with an inline-SVG histogram (no chart-lib
  dependency).
- E.3 — Six SD-JWT fuzz tests; dependency audit at
  `docs/audits/dependency-audit-2026-05-10.md`.
- M.1 — Batched revocation primitive (`enclave/src/status-list.ts`)
  with 8 unit tests.
- M.2 — Standalone 3D force-graph audit view at
  `/audit-graph.html` (3d-force-graph + Three.js via CDN; zero
  bundle impact).
- F.2 — Codex GPT-5.5 adversarial pre-submission review; 1 BLOCKER
  caught + fixed, 4 MEDIUM findings resolved or documented.
- C.5 — Drop-in NGO kiosk mode at `/kiosk` with locked nav and large
  touch targets.
- C.3 — Kiosk localization to 5 languages (en/fil/id/ms/yue) via
  `app/src/lib/i18n/kiosk-strings.ts`; non-English strings are
  AI-generated baseline pending native-speaker review.

## v0.3 — Reality flips (2026-05-08 → 2026-05-09)

The "stop the slideware" milestone.

### Added

- A.1 — Live SD-JWT VC issuance via `/api/issue` signing Ed25519 SD-JWT
  when `ISSUER_PRIVATE_KEY` is set.
- A.2 — Browser AES-256-GCM vault: non-extractable IndexedDB key
  encrypts the SD-JWT VC before localStorage persist; plaintext
  never enters localStorage.
- A.3 — `consumeGrantAndIssueReceipt` live on Galileo: `/api/consume`
  relayer signs the on-chain tx, atomic single-tx emits both
  `GrantConsumed` and `ReceiptIssued`.
- A.4 — `attestationDigest` sourced from the live Phala dstack TDX
  enclave; per-receipt RA quote binds `(signer, image, receiptId)`.
- B.1 — `AmbientSphere` primitive replaces the missing persona image.
- B.2 — Mobile responsive sweep across `/`, `/vault`,
  `/clinic/subpoena`.
- B.3 — `Skeleton` shimmer primitive + live `/api/tee-status` badge on
  `/about`.
- C.1 — Three-page submission whitepaper PDF at `docs/whitepaper.pdf`.
- C.2 — `compass-eligibility-check` OpenClaw / Claude Code skill at
  `skills/compass-eligibility-check/`.
- C.4 — Six cold-email outreach drafts at `docs/outreach/`.

## v0.2 — Bootstrap (2026-04 → 2026-05-07)

Initial Compass scaffold: `AgentRegistry` + `CompassHub` contracts on
Galileo, Next.js app with the four-step onboard flow, Phala dstack TDX
receipt-signer enclave with deterministic `getKey`-sealed secp256k1
key, and the canonical four-layer architecture wired end-to-end.

See git history before commit `b1c083c` for the bootstrap commit
sequence.
