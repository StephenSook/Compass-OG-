---
title: Compass — BEYOND Expo IRL Pitch Script
purpose: Stand-up pitch for BEYOND Expo Macau May 28, 2026 in-person demo
methodology: Sookra Methodology Pitch Formula — leads with business per step 6
runtime: 3-5 min live demo + Q&A separate
audience: 0G Foundation, judges, investors, NGO partners
---

# Compass — BEYOND Expo IRL Pitch

## Why this script differs from `Demo/script.md`

The hackathon submission video at <https://www.youtube.com/watch?v=vg5WZHmlzZI>
opens with **Maria's persona** (Pillar 1 — Specific People). The Sookra
Methodology Pitch Formula step 6 says: *lead with business impact + TAM*
(mentor input from Aaron + Henry). For the BEYOND Expo IRL pitch, we
lead with the commercial case first, then bring the persona in as
proof — keeping every other beat intact.

Numbers below are from `docs/whitepaper.md` → §Business Impact. Sources
are footnoted there; do not invent figures during live delivery.

---

## Beat 0 — Business hook (~15s)

> "Twenty-two thousand dollars. That's what one Hong Kong migrant
> worker loses when she's deported after her abusive employer subpoenas
> her clinic records. Three hundred sixty-eight thousand of them are at
> risk right now. The Hong Kong government, every time, loses fourteen
> thousand dollars in legal-aid resources that get diverted instead.
>
> Hong Kong's Legal Aid Department spent six hundred eighty million
> Hong Kong dollars on civil cases last year — and not one dollar of
> that prevents the disclosure that triggered the deportation.
>
> We built Compass to fix that. One primitive. Mainnet live."

**Visual:** Three numbers slide in sequence —
**$22,200 worker · $14,100 government · 368,000 at risk.**

## Beat 1 — The persona, now as proof (~20s)

> "Maria is one of those three hundred sixty-eight thousand. She works
> sixteen hours a day in a Hong Kong apartment. She can't read her own
> contract. To get free legal help, she has to hand over her HKID, her
> passport, her contract. Her employer can subpoena every one of those
> documents back at her. She's deported in fourteen days."

**Visual:** Hands-sink image (re-use from hackathon video).

## Beat 2 — The structural gap (~15s)

> "The gap isn't 'no app exists.' The gap is that no one has built a
> primitive that proves eligibility without revealing identity — that
> produces a receipt the clinic can't be subpoenaed for, because the
> clinic never held the identifying data."

**Visual:** Architecture diagram from `/about`.

## Beat 3 — Live demo, 3 steps (~45s)

[Use same beats as `Demo/script.md` Beats 2-4 — connect wallet, mint
agent, request eligibility. Stay on Aristotle mainnet
(`NEXT_PUBLIC_COMPASS_USE_MAINNET=1`). Receipt mints on chainId 16661;
show the chainscan link.]

## Beat 4 — Subpoena scene (~20s)

> "Now imagine the subpoena. Under PDPO §57, what can the clinic
> actually disclose about Maria?"
>
> [Open `/clinic/subpoena`]
>
> "Someone qualified for free legal assistance at fourteen thirty-two
> on May eighteenth, twenty twenty-six. That's all that exists. No
> name. No HKID. No employer. No documents."

**Visual:** Subpoena scene live at <https://app-psi-pied.vercel.app/clinic/subpoena>.

## Beat 5 — Verifiability (~20s)

> "Don't trust me. The cryptographic chain — from the SD-JWT VC,
> through the sealed TEE attestation, to the on-chain receipt —
> verifies in your browser in a hundred and fifty milliseconds.
> Slither found zero security findings. Codex caught one blocker
> pre-mainnet that I fixed. Everything is verifiable independently
> of me."

**Visual:** `/verify` page running the bundle verifier.

## Beat 6 — Business model + grant pipeline (~30s)

> "Compass is open-source. Free for migrant-worker NGOs. Twelve-month
> grant ladder is mapped: Phala Builders Program up to fifty thousand,
> 0G ecosystem grants ten to a hundred, Ethereum Foundation PSE thirty
> to two-fifty. On the back of NGO traction — Open Society Migration
> Initiative, Luminate, Hong Kong Jockey Club Special Projects up to
> one million. Target by month eighteen: sixty thousand a year
> recurring from managed hosting and commercial dual-license, dropping
> grant dependency below sixty percent."

**Visual:** Grant ladder table from `docs/whitepaper.md` →
§Business Impact → §Sustainability.

## Beat 7 — Close (~10s)

> "Three hundred sixty-eight thousand workers in Hong Kong. Twenty-seven
> million across APAC. One primitive. Mainnet live, audited, verifiable.
> Compass."

**Visual:** Logo + URL <https://app-psi-pied.vercel.app> + chainscan
link to CompassHub `0xe42f…C58b`.

---

## Q&A preparation

| Question | Answer |
|---|---|
| What's the TAM if not NGO-funded? | Commercial dual-license for any non-NGO deployment (corporate identity systems with similar privacy needs, healthcare intake, refugee services in other jurisdictions). |
| Who deploys first? | Bethune House Migrant Women's Refuge (~600 women/year), HELP for Domestic Workers, Mission for Migrant Workers. Six cold-outreach drafts queued at `docs/outreach/`. |
| Why HK first? | Highest density of FDHs subject to the 14-day rule + PDPO §57 disclosure obligation. Acute, well-documented, NGOs already exist and are funded. |
| What's the moat? | Composition: SD-JWT VC + Phala dstack TDX + 0G Chain + browser-only crypto. Forkable; deploying it requires aligning four ecosystems and clearing the security-audit bar (Slither 0 + Codex adversarial). |
| What if 0G mainnet has an outage during a clinic intake? | v2 caches eligibility decisions for 15 min on-device; the receipt can be re-emitted to chain when network returns. |
| Why APAC, not US/EU? | The 14-day rule + the PDPO §57 disclosure obligation + the FDH visa structure are specific to HK. Adjacent jurisdictions (Singapore, Taiwan, GCC states) have parallel structures; v2 abstracts the policy layer for portability. |
| Does this replace a lawyer? | No. It proves the worker qualifies for the legal aid intake without the disclosure cost. Lawyers continue to do their work; Compass is the eligibility gate, not the case work. |

---

## References

- Hackathon submission video script: `Demo/script.md` (empathy-led,
  3-min hackathon submission).
- Edit recipe (how the video was produced): `Demo/edit-recipe.md`.
- Business Impact + sources: `docs/whitepaper.md#business-impact`.
- Sookra Methodology (Pitch Formula + Five Pillars): Obsidian vault
  distilled notes at
  `References/Imports-Distilled/Sookra Methodology - Pitch Formula.md`
  and `References/Imports-Distilled/Sookra Methodology - Five Pillars.md`.
