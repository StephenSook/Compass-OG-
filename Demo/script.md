# Compass — demo script

Target runtime: **2:55** (under 3:00 hard cap per HackQuest rules). YouTube unlisted. Screen recording + voiceover only — no HK b-roll, no sponsor cuts, no sizzle reel.

The script is locked at 6 beats. Every word earns its place. If a line can be cut without losing the beat, cut it.

---

## Beat 1 — open on Maria (0:00–0:18)

**Visual:** `/` Cinematic Privacy hero. The italic accent on `*identity*`. Camera holds for 2 seconds before any animation, then the BlurText word-by-word entrance hits.

**Voiceover (recorded separately, sync in editor):**

> Maria works sixteen hours a day in a Hong Kong apartment.
> Today, she needs free legal help.

Two sentences. No backstory. No setup. The hero copy carries the rest.

---

## Beat 2 — the harm (0:18–0:48)

**Visual:** static composite illustration — passport, contract, HKID handed across. Banana-generated, NO faces, dignified framing. Hold for the full 30s; let the voiceover do the work.

**Voiceover:**

> If she walks into the clinic the normal way, she hands over her passport, her employment contract, her HKID.
> The clinic stores them.
> Her employer subpoenas the file.
> Fourteen days. Deportation.

Four sentences. The pacing tightens beat-by-beat. The last fragment lands hardest because it is shortest.

**Cut criterion:** if this beat tests over 32 seconds, drop "her employment contract" — pacing matters more than completeness.

---

## Beat 3 — the Compass moment (0:48–1:30)

**Visual:** live UX on `/onboard`, the four-step walkthrough. Open the
production Vercel URL with the Privy embedded wallet already
authenticated **and `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` set** so the
on-chain leg routes to Aristotle mainnet (chainId 16661) rather than
Galileo testnet. Steps 1, 2, 3 each tick to green in under 5s. Step 4 is
the load-bearing reveal: click "Request HELP eligibility (live) →", the
wallet prompts for a typed-data signature, the button shows
"submitting grant… → mining receipt… → ✓ receipt minted" with the
Aristotle explorer tx hash + the 15-min timestamp bucket pill. The
mainnet receipt is the differentiation. Most hackathon submissions ship
to testnet; we ship to a real chain.

If the Phala CVM is up and `/api/tee-status` returns `mode: tee`, mint
on-camera. The 5-second wait is worth it because nothing else looks
like a real signature appearing. If the CVM is down, `/api/consume`
now fails closed with a 503 `tee_required` response (a result of the
2026-05-11 review pass — we no longer silently emit stub-digest
receipts when the enclave is unreachable), so the recording cannot
proceed until Phala is back. Plan accordingly.

**Pre-recording prerequisite:** Privy session active in the recording
browser; provider relayer wallet funded ≥0.05 OG on Aristotle
(`0xaD736a7233847Cf1D73a7D820b32424CF8125b0a`); all 3 demo policies
(HELP, Bethune, Hospital) registered on Aristotle CompassHub —
baseline state per `docs/notes/0g-galileo-policy-setup.md` policy
table.

**Voiceover:**

> With Compass, Maria proves she qualifies — without proving who she is.
> The clinic learns one bit. *Eligible.*
> Receipt minted, on 0G Aristotle mainnet.

Italic emphasis on `*eligible*` — the same Instrument Serif italic used on the page itself. The "0G Aristotle mainnet" line is delivered flat, almost as an aside; the chain identity does the work, not the prosody.

---

## Beat 4 — architecture, fast (1:30–2:18)

**Visual:** scroll through `/about`. The 4-layer SVG diagram → the
ambient Spline 3D scene (which renders below the diagram and provides
visual depth without narrative interruption) → integration table →
reality table. Camera scrolls smoothly; do not stop on any panel. The
Spline scene is decorative, not load-bearing — its presence simply
signals "this is a serious surface, not a static doc."

**Voiceover:**

> SD-JWT credential, encrypted on her device.
> 0G Storage holds the ciphertext.
> The receipt-signer runs inside Phala TDX. It evaluates the policy, signs the receipt with a key sealed inside the attested image.
> The receipt lands on 0G Chain — Aristotle mainnet.
> Three sentences.

The line "three sentences" is the joke and the brag. Architecture in three sentences is not a thing — except here. "Aristotle mainnet" reinforces the Beat 3 mint.

---

## Beat 5 — the subpoena scene (2:18–2:48)

**Visual:** `/clinic/subpoena` page. The camera scrolls down slowly so the `<RevealText>` char-by-char reveal hits in tempo. The italic punchline lands at full size. **Pause 2 seconds** on the punchline before the next voiceover line.

**Voiceover:**

> The clinic's full disclosure under PDPO §57 —
>
> *Someone qualified for free legal assistance at fourteen-thirty-two on May eighteenth, twenty-twenty-six.*
>
> *(2-second pause)*
>
> That's all that exists.

Read the disclosure line in your normal cadence. The italic line gets a slower, quieter delivery — almost flat. The pause is the moment.

---

## Beat 6 — the TAM (2:48–2:58)

**Visual:** black title card. Geist Mono caption, lower third, low-contrast.

> 15M migrant workers across APAC. We start with Maria.

**Voiceover:**

> Fifteen million migrant workers across APAC. We start with Maria.

End on the period. No outro chord. No URL card. The README has the URL.

---

## Cuts to make in editing

- Every gas confirmation screen.
- Every loading spinner that hangs over 1 second (fast-forward 3x or jump-cut).
- Every architecture lecture over 30 seconds.
- Any backstory over 20 seconds.
- Any "and so what we did was..." filler.
- Any moment where the camera lingers on Vercel's deploy banner. That's not the show.

---

## Production tools

- **Recorder:** macOS native screen recording (`Cmd+Shift+5` → "Record Selected Portion") or QuickTime. Clean rectangle, no menu bar, no dock.
- **Editor:** iMovie or DaVinci Resolve free tier. Cut on the beat — voiceover ends 200ms before the next visual transition.
- **Voiceover:** record separately, sync in editor. One beat at a time. Quiet room. AirPods or Yeti mic.
- **Color:** none. The site's pure black already does the work.

---

## Recording checklist

- [ ] Phala CVM **Started** — `curl https://app-psi-pied.vercel.app/api/tee-status` returns `mode: tee, reachable: true, signer: 0xaba6...a7e7` before recording. **No fallback path** — if the CVM is down, `/api/consume` 503s with `tee_required` and the mint won't go through.
- [ ] Vercel deploy current — `/`, `/onboard`, `/vault`, `/clinic/subpoena`, `/about`, `/audit`, `/faq`, `/roadmap`, `/demo` all render. Reality table on `/about` shows the green TEE-live dot.
- [ ] **Mainnet flag flipped** — `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` set in Vercel prod env and a fresh deploy promoted. Verify a `/api/consume` round trip lands a tx on chainscan.0g.ai (NOT chainscan-galileo.0g.ai) before recording.
- [ ] Privy session pre-authed in recording browser. `/onboard` Step 1 shows wallet address pre-loaded on cold reload (do NOT record the email login).
- [ ] Provider relayer wallet funded ≥0.05 OG on **Aristotle mainnet** (`0xaD736a7233847Cf1D73a7D820b32424CF8125b0a`). All 3 demo policies (HELP, Bethune, Hospital) registered on Aristotle CompassHub `0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b`.
- [ ] Browser zoom: 100% (default).
- [ ] Hide bookmark bar, DevTools, mac dock.
- [ ] System notifications: Do Not Disturb on.
- [ ] Audio: AirPods or Yeti mic; one take per beat; quiet room.
- [ ] Screen-record region: clean rectangle, no menu bar.

---

## Cold-viewer test

After first cut, send to **two people who haven't seen Compass before**. One non-technical friend; one developer if available. Single question:

> "What does this product do? In one sentence."

If both answer correctly: ship.
If either says "uhh I'm not sure" or gives a wrong answer: re-cut the opening 30 seconds. The harm beat (0:18–0:48) is most likely the issue.

---

## After upload

- [ ] YouTube → Settings → Visibility: **Unlisted**.
- [ ] Copy URL into `README.md` hero block (replace `[DEMO_VIDEO_URL]` placeholder).
- [ ] Copy URL into `Demo/x-post-final.md` (the X-post template has a `[DEMO_VIDEO_URL]` placeholder in both the primary and short variants).
- [ ] Paste the URL into the HackQuest submission form using `Demo/hackquest-submission-answers.md` as the cheat sheet for the surrounding fields.
- [ ] Post the final X thread per `Demo/x-post-final.md` with the four mandatory tags + two required hashtags. Capture the X-post URL afterwards.
- [ ] Paste the X-post URL back into the HackQuest "Project X Post Link" field (the form requires it).
- [ ] Update the `/about` reality table if anything was changed during recording (e.g., the mainnet-flag flip persists post-recording or rolls back).
- [ ] Drop the demo URL into `CHANGELOG.md` under v0.5 (or whichever version covers the submission cycle).

---

## Open uncertainties

- Is the subpoena `RevealText` on-tempo for video? Test once before final. The scroll-driven char reveal works in the browser; in a recording, the camera scrolls slowly so the reveal hits.
- Should the live mint actually happen on-camera on **mainnet**? Yes — that is the entire point of the rewrite. Mint on Aristotle. The fallback is "abort recording, restart Phala CVM, mint again." We do NOT fall back to Galileo for the demo cut.

---

## Out-of-scope for v1

- HK b-roll
- Original soundtrack
- SRT subtitle track
- Sponsor logos in the cut

Note: the Spline 3D scene used to live in this list; B.4 activated it on `/about`. It appears as ambient depth during the Beat 4 scroll-through — no narrative beat dedicated to it.

---

## Cross-doc sync after recording

When the demo URL lands, update **all** of the following in the same commit:

| File | What changes |
|---|---|
| `README.md` | hero block + `## See it live` table gets the YouTube URL |
| `CHANGELOG.md` | new entry under "Added" for v0.5 referencing the URL |
| `Demo/x-post-final.md` | `[DEMO_VIDEO_URL]` placeholder → real URL |
| `Demo/hackquest-submission-answers.md` | the after-recording tracking checkboxes get timestamped |
| `docs/press-kit.md` | "Logos and screenshots" table gets a demo-video row |
| `app/src/app/page.tsx` | optional — add "Watch the 3-minute demo →" CTA below the existing nav row |

Per the memory rule (`feedback_doc_sync.md`): doc surfaces drift fast on Compass because the "what's real vs what's mocked" credibility signal is the whole pitch. Sync everything in one commit.
