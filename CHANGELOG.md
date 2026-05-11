# Changelog

All notable changes are tracked here. Older changes during the
build-up phase are folded into milestone summaries; recent changes are
listed by commit. The version cadence follows the hackathon timeline,
not semver — this is `v0.x` until the post-hackathon hardening pass.

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
