# Compass — Outreach Log

Cold-email drafts for Phase C.4 + Phase 11.3. The README's Pillar 5
section ("Honesty about traction") points here. Even no-response counts:
silence with a logged-and-dated send is a more honest traction signal
than no contact at all.

**Important:** these are drafts. Actually sending them requires Stephen
to copy each into Gmail with his real signature, verify the recipient
address against the org's current contact page (links below — they
sometimes change), and adjust the line tagged `[edit]` to match the
current submission state.

## Status table

| # | Target | Type | Drafted | Sent | Replied | Outcome |
|---|--------|------|---------|------|---------|---------|
| 1 | HELP for Domestic Workers | NGO (persona check) | 2026-05-10 | — | — | — |
| 2 | Bethune House Migrant Women's Refuge | NGO (persona check) | 2026-05-10 | — | — | — |
| 3 | Mission for Migrant Workers | NGO (community check) | 2026-05-10 | — | — | — |
| 4 | Open Society Foundations (HK programme) | Foundation (funder) | 2026-05-10 | — | — | — |
| 5 | Luminate | Foundation (funder) | 2026-05-10 | — | — | — |
| 6 | HK Jockey Club Charities Trust | Foundation (funder) | 2026-05-10 | — | — | — |

Update the table after each send/reply. Even a "we received your note,
no further action" reply moves the column from `—` to `2026-05-XX —
acknowledgement only`. That's traction.

---

## 1. HELP for Domestic Workers

**Type:** NGO (primary persona inspiration)
**Why this org:** Maria's persona is loosely modelled on FDHs HELP serves; the legal-aid policy in the demo is named `help-legal-aid`.
**Contact lookup:** <https://helpforfdws.org/contact-us/> — verify the address before sending; they list a general inbox + a programme manager email.
**Suggested recipient:** general inbox, request forward to programme staff.

```
To: [verify from helpforfdws.org/contact-us/]
Subject: 2-min ask — building a privacy tool inspired by HELP's clinic flow

Hello HELP team,

I'm Stephen Sookra, a US-based developer building a hackathon demo called
Compass for the 0G APAC Hackathon (submission due June 5 2026). Compass
is a privacy-by-design eligibility-check primitive — the idea is that an
FDH could prove "I'm an FDH in HK with an open employment dispute" to a
clinic without handing over passport, contract, or HKID.

I'm writing because the demo's primary persona is a composite inspired
by HELP's clinic work, and one of the policies in the demo is literally
named `help-legal-aid`. The work is open-source and credits HELP, Bethune
House, and MFMW in the README, but I want to be honest: HELP has not
seen or endorsed any of this.

Two short asks if anyone has 5 minutes:

1. **Does the demo's framing of an FDH client feel respectful or
   exploitative?** Live URL: <https://app-psi-pied.vercel.app>. Page that
   matters most: <https://app-psi-pied.vercel.app/clinic/subpoena>.

2. **Would HELP want to be removed** from the credits + policy naming,
   or **would you be open** to a follow-up after the hackathon if the
   tool ever moves beyond a prototype?

No expectation of a reply — happy to absorb a "remove our name" instruction
silently. Repo: <https://github.com/StephenSook/Compass-OG->.

Thank you for the work you do.
— Stephen Sookra
   stephensookra@gmail.com
```

---

## 2. Bethune House Migrant Women's Refuge

**Type:** NGO (secondary persona — the shelter-intake policy)
**Why this org:** the demo includes a `bethune-shelter` policy modelling intake based on a notarized in-distress marker; persona credit in /about + README.
**Contact lookup:** <https://bethunehouse.org> — there's a contact form + a published email for shelter referrals.
**Suggested recipient:** general info inbox; ask for forward to executive director if available.

```
To: [verify from bethunehouse.org/contact]
Subject: 2-min ask — privacy-tool prototype credits Bethune House

Dear Bethune House team,

I'm Stephen Sookra, a US-based developer. I built a hackathon demo
called Compass (0G APAC Hackathon, due June 5 2026) that imagines a
privacy-by-design eligibility-check primitive for migrant workers. The
demo includes a hypothetical `bethune-shelter` intake policy where a
woman in distress could prove her partnered-NGO marker without handing
over identity documents.

The work is open-source. Bethune House is credited in the README and
inside the demo's policy fixtures; the repo's "what's mocked" table is
explicit that signing keys are local Ed25519 fixtures, not endorsed by
Bethune House.

Two asks if anyone has a few minutes:

1. **Does the demo's framing of a shelter-intake flow feel respectful?**
   Live URL: <https://app-psi-pied.vercel.app/clinic/subpoena>. This is
   the page that matters most — it shows what a clinic actually
   discloses under a subpoena.

2. **Should I remove Bethune House** from the credits + policy fixtures,
   or **would you be open** to a follow-up post-hackathon if Compass
   moves beyond a prototype?

I will absorb a "remove our name" instruction without push-back.

Repo: <https://github.com/StephenSook/Compass-OG->.

— Stephen Sookra
   stephensookra@gmail.com
```

---

## 3. Mission for Migrant Workers (MFMW)

**Type:** NGO (community check + Filipino domestic worker network)
**Why this org:** broader Filipino domestic worker community presence; potential community-check contact for persona imagery (Phase 7.5.1.d).
**Contact lookup:** <https://www.migrants.net/contact/> — has a published office email + Filipino-language hotline.
**Suggested recipient:** general inbox + ask for forward to a programme worker.

```
To: [verify from migrants.net/contact]
Subject: 2-min ask — privacy-tool prototype, Filipino-FDH community check

Hello MFMW team,

I'm Stephen Sookra, a developer building a privacy-tool demo called
Compass for the 0G APAC Hackathon (due June 5 2026). The demo's persona
is a Filipino domestic worker named Maria — a composite, not a real
person, but inspired by the work MFMW, HELP, and Bethune House do.

The hackathon's submission deadline forces a tight feedback loop, and
I've made a hard rule: no real photos of any vulnerable person, only
composite illustrations. Before locking any imagery I want a one-person
gut-check from someone close to the Filipino-FDH community in HK.

Three concrete ways MFMW could help, all small:

1. **Persona gut-check (5 min):** does the demo's framing of "Maria"
   feel respectful or exploitative? Live URL:
   <https://app-psi-pied.vercel.app>.

2. **Localization contact (10 min):** if anyone on staff or in your
   volunteer network would be willing to spot-check Tagalog
   translations of UI strings I'd be grateful — I'm planning to ship
   localized copy in the final hackathon polish.

3. **A "remove our name" instruction**, no push-back, if any of the
   above feels off.

Repo: <https://github.com/StephenSook/Compass-OG->.

— Stephen Sookra
   stephensookra@gmail.com
```

---

## 4. Open Society Foundations — HK / Asia-Pacific programme

**Type:** Foundation (post-hackathon funder pathway)
**Why this org:** OSF has a documented programme funding migrant-rights work in HK + tech-for-rights tools globally.
**Contact lookup:** <https://www.opensocietyfoundations.org/grants> — they list programme-area inboxes; the most relevant for Compass is "Open Society Initiative for Asia" plus "Justice + Rights".
**Suggested recipient:** programme inbox (varies by region) — verify each year.

```
To: [verify from opensocietyfoundations.org/grants]
Subject: Hackathon prototype — privacy-by-design eligibility for migrant workers

Dear Open Society team,

I'm Stephen Sookra, a US-based developer. I built a hackathon prototype
called Compass for the 0G APAC Hackathon (June 5 2026 deadline). The
prototype imagines a "private eligibility firewall" for vulnerable
migrant workers — proof of qualifying for free legal aid, shelter intake,
or hospital care without disclosing name, HKID, employer, or document
images.

The work is end-to-end live: SD-JWT VC issuance, AES-256-GCM browser
encryption, a TEE-attested receipt-signer in TDX (Phala dstack), and an
on-chain receipt log on 0G testnet. Architecture + threat model + honest
"what's real / what's mocked" table at:

- Live demo: <https://app-psi-pied.vercel.app>
- Repository: <https://github.com/StephenSook/Compass-OG->
- Architecture: <https://app-psi-pied.vercel.app/about>

I'm not asking for funding today. I'm writing because the prototype
explicitly addresses an OSF programme area (rights infrastructure for
migrant workers), and if Compass moves beyond hackathon-stage I would
want to do that with feedback from a funder that has reviewed migrant-
rights tools before. **One ask: would the relevant programme officer be
open to a 15-min call after the hackathon submission window?** Even a
"not the right fit" reply would be useful to log honestly.

— Stephen Sookra
   stephensookra@gmail.com
```

---

## 5. Luminate

**Type:** Foundation (privacy + accountability tech funder)
**Why this org:** Luminate is Pierre Omidyar's foundation specifically for "platform accountability" + "civic empowerment" tech. They fund privacy infrastructure.
**Contact lookup:** <https://luminategroup.com/contact> — they list a single contact form; the email goes to a programmes inbox.
**Suggested recipient:** programmes inbox via the contact form.

```
To: [via luminategroup.com/contact form]
Subject: Hackathon prototype — privacy infra for vulnerable migrant workers

Hello Luminate team,

I'm Stephen Sookra, a US-based developer. I built a hackathon prototype
called Compass for the 0G APAC Hackathon (June 5 2026 deadline). It's a
small privacy-infrastructure primitive: an autonomous agent that proves
"this user qualifies for free legal aid" to a clinic without disclosing
the user's identity, employer, or documents. The receipt the clinic
holds is a 15-min bucketed timestamp + a cryptographic commitment, and
nothing else.

The technical stack is a TEE-attested receipt-signer (Phala dstack TDX),
SD-JWT VCs encrypted browser-side with non-extractable AES-256, and an
on-chain log on 0G testnet (mainnet pending Phase 8). All open-source,
all reproducible by a third party with one CLI command.

- Demo: <https://app-psi-pied.vercel.app>
- Repo: <https://github.com/StephenSook/Compass-OG->
- Architecture: <https://app-psi-pied.vercel.app/about>

The prototype targets rights infrastructure for migrant workers. I'm
writing because Compass aligns with Luminate's stated focus on platform
accountability and civic-empowerment tech. **One ask: would a programme
officer be open to a 15-min introductory call after the hackathon
submission window?** A "not the right fit" reply is also useful — I'll
log it honestly in the project's outreach record.

— Stephen Sookra
   stephensookra@gmail.com
```

---

## 6. Hong Kong Jockey Club Charities Trust

**Type:** Foundation (largest HK domestic philanthropy)
**Why this org:** HKJC funds the largest share of HK migrant-worker programmes, including HELP and Bethune House.
**Contact lookup:** <https://charities.hkjc.com/charities/english/contact-us/> — published programme inboxes.
**Suggested recipient:** programmes inbox tagged "Healthy Community" (covers migrant-worker support).

```
To: [verify from charities.hkjc.com/contact-us]
Subject: HK migrant-worker privacy prototype — would a programme officer chat?

Dear HK Jockey Club Charities team,

I'm Stephen Sookra, a US-based developer. I built a hackathon prototype
called Compass for the 0G APAC Hackathon (June 5 2026 deadline). It
imagines a privacy-by-design eligibility-check primitive specifically
shaped for vulnerable migrant workers in HK — Foreign Domestic Helpers,
shelter intakes, and hospital-care eligibility, without forcing the
worker to hand over their passport or HKID.

The Trust's existing grantees in this space — HELP for Domestic Workers
and Bethune House Migrant Women's Refuge — directly inspired the demo's
persona and policy fixtures. The work is open-source and credits both
organizations, with an explicit "what's mocked" disclosure that neither
NGO has reviewed or endorsed the prototype.

- Demo: <https://app-psi-pied.vercel.app>
- Repo: <https://github.com/StephenSook/Compass-OG->

**One ask:** if the prototype proves out post-hackathon, would the
Trust's "Healthy Community" programme be open to a 20-min introductory
call to share what worked / didn't, and whether anything in the demo
might be adopted by an existing grantee?

A "not now" reply is fine and also useful — I'll log it in the project's
public outreach record.

— Stephen Sookra
   stephensookra@gmail.com
```

---

## How to use this log

1. **Verify recipient address** against each org's current contact page
   (links above). NGO + foundation inboxes change yearly; do not rely on
   addresses copied from elsewhere.
2. **Adjust the `[verify]` lines** in each draft.
3. **Send from a real signed-off email** — adding a personal note or a
   small detail from a recent press release is fine and recommended.
4. **Update the status table** with the send date + (if any) reply
   summary.
5. **Cross-link** in the README's Pillar 5 section so judges can see the
   actual outreach attempts.

Even a 0-of-6 reply rate is a stronger traction signal than 0-of-0
attempts. The honest-traction record is the load-bearing thing.
