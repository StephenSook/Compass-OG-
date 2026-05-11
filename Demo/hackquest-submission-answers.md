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

## Revised timeline (BEYOND Expo Macau = Yes)

May 28 IRL demo at BEYOND Expo Macau is now a hard date 18 days from 2026-05-10. F.1 demo video and F.5 X post both move EARLIER so the HackQuest submission lands before travel — no Macau hotel Wi-Fi gambling.

| Date | Action |
|------|--------|
| May 10-22 | Polish · record F.1 demo video · upload YouTube unlisted |
| May 23 | F.5 — post X tweet using `Demo/x-post-final.md` template; capture URL |
| May 24 | HackQuest Submit Project (with X URL from May 23) — locks submission before travel |
| May 26-27 | Fly NYC → Macau (US passport visa-free ≤30 days via Macau airport; HKG ferry alternative) |
| **May 28** | **BEYOND Expo IRL demo showcase** — in-person to 0G team + judges |
| May 29 - June 4 | Post-event X engagement; Community Award push (10× $1.3k voted via Discord/X) |
| June 5 | Hackathon deadline (already submitted) |

### Travel prep checklist

- [ ] US passport valid 6+ months past travel
- [ ] Book flights NYC → Macau (~$1200-1800 economy, 18-22hr; price climbs from here)
- [ ] BEYOND Expo registration: `https://portal.beyondexpo.com/reg/beyond26/web/#/zh/ticket/mall?track=tk07`
- [ ] Hotel near Cotai (where BEYOND Expo is held) — book by May 20
- [ ] Demo gear: laptop + mobile hotspot SIM + offline kiosk fallback build
- [ ] Printed materials: QR codes → live app + GitHub + whitepaper; one-page handout
- [ ] Practice demo cold on hotel Wi-Fi on May 27 before Day 1
- [ ] Confirm 0G team booth / session schedule via Telegram before flying

---

## Post-submission tracking

After each form lands, append the timestamp + confirmation here:

- [ ] Google Form submitted at: __________ (capture confirmation: `Demo/google-form-confirmation.png`)
- [ ] HackQuest project entry created at: __________
- [ ] HackQuest Submit Project filed at: __________ (capture confirmation: `Demo/hackquest-submission-confirmation.png`)
- [ ] X post URL: __________

---

## Why these answers, not others

- **All 3 prize tracks selected on HackQuest** — Per the grand-prize execution plan, Compass is positioned for Grand Prizes (Track 5 win), Excellence Awards (per-category bonuses), and Community Awards (10× $1.3k via X/Discord engagement). Selecting all three keeps every prize lane open.
- **Both Track 1 + Track 5 on Google Form** — Track 5 (Privacy & Sovereign Infra) is the primary fit. Track 1 (Agentic Infra & OpenClaw Lab) is a secondary fit because C.2 shipped a Compass OpenClaw skill (`compass-eligibility-check`) at `docs/skills/compass-eligibility-check/`.
- **0G components: 5 of 6 selected** — Storage (encrypted vault ciphertext upload), Compute (Phala dstack TDX is 0G's TeeML compute path), Chain (AgentRegistry + CompassHub deployed to both Galileo and Aristotle), Agent ID (ERC-7857 stripped soulbound INFT for agent identity), and TEE/Private Sandbox (the entire privacy premise sits on Phala dstack TDX). Skipped 0G DA — not used in v1; the audit log is on 0G Chain directly.
- **SDKs: TypeScript Storage SDK + Hardhat deployment scripts** — `enclave/` and `app/` use `@0glabs/0g-ts-sdk` for the encrypted vault upload path. Contracts deploy via Hardhat from `contracts/`. The other listed SDKs (Rust, S3-compatible, Go, Web Starter, Compute) are not used in Compass v1.
- **CompassHub as the primary contract** on HackQuest's single-address field — CompassHub is the entry point for the grant-and-receipt flow; AgentRegistry is the dependency. If the field accepts multiple, include both.
- **Tech feedback uses concrete numbers** — the US-funding pain is a real builder-experience signal 0G can act on; the ERC-7857 reference-impl note is a constructive ask. Both improve the chance of in-person follow-up at BEYOND Expo.
