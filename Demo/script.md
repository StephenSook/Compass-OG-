# Compass — demo script

Target runtime: **2:50** (under 3:00 hard cap per HackQuest rules). YouTube unlisted. Screen recording + voiceover only — no HK b-roll, no sponsor cuts, no sizzle reel.

The script is locked at 6 beats. Every word earns its place. If a line can be cut without losing the beat, cut it.

---

## Beat 1 — open on Maria (0:00–0:20)

**Visual:** `/` Cinematic Privacy hero. The italic accent on `*identity*`. Camera holds for 2 seconds before any animation, then the BlurText word-by-word entrance hits.

**Voiceover (recorded separately, sync in editor):**

> Maria works sixteen hours a day in a Hong Kong apartment.
> Today, she needs free legal help.

Two sentences. No backstory. No setup. The hero copy carries the rest.

---

## Beat 2 — the harm (0:20–0:50)

**Visual:** static composite illustration — passport, contract, HKID handed across. Banana-generated, NO faces, dignified framing. Hold for the full 30s; let the voiceover do the work.

**Voiceover:**

> If she walks into the clinic the normal way, she hands over her passport, her employment contract, her HKID.
> The clinic stores them.
> Her employer subpoenas the file.
> Fourteen days. Deportation.

Four sentences. The pacing tightens beat-by-beat. The last fragment lands hardest because it is shortest.

**Cut criterion:** if this beat tests over 32 seconds, drop "her employment contract" — pacing matters more than completeness.

---

## Beat 3 — the Compass moment (0:50–1:30)

**Visual:** live UX. Open `/clinic/subpoena` → request flow on the production Vercel URL → receipt mints in under 15 seconds with the `<TEEBadge status="verified" />` next to it.

If the Phala CVM is up and `verify-receipt` PASSES against the live signer, mint on-camera. The 5-second wait is worth it because nothing else looks like a real signature appearing. If the CVM is down, fall back to a pre-recorded mint and cut the wait.

**Voiceover:**

> With Compass, Maria proves she qualifies — without proving who she is.
> The clinic learns one bit. *Eligible.*
> Receipt minted.

Italic emphasis on `*eligible*` — the same Instrument Serif italic used on the page itself. The voiceover and the screen are doing the same trick at the same moment.

---

## Beat 4 — architecture, fast (1:30–2:20)

**Visual:** scroll through `/about`. The 4-layer SVG diagram → integration table → reality table. Camera scrolls smoothly; do not stop on any panel.

**Voiceover:**

> SD-JWT credential, encrypted on her device.
> 0G Storage holds the ciphertext.
> The receipt-signer runs inside Phala TDX. It evaluates the policy, signs the receipt with a key sealed inside the attested image.
> The receipt lands on 0G Chain.
> Three sentences.

The line "three sentences" is the joke and the brag. Architecture in three sentences is not a thing — except here.

---

## Beat 5 — the subpoena scene (2:20–2:50)

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

## Beat 6 — the TAM (2:50–3:00)

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

- [ ] Phala CVM Started — verify `/health` returns `source: tee` before recording (Beat 3 fallback otherwise).
- [ ] Vercel deploy current — `/audit`, `/policies/[slug]`, `/about` all render.
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
If either says "uhh I'm not sure" or gives a wrong answer: re-cut the opening 30 seconds. The harm beat (0:20–0:50) is most likely the issue.

---

## After upload

- [ ] YouTube → Settings → Visibility: **Unlisted**.
- [ ] Copy URL into `README.md` hero block.
- [ ] Copy URL into HackQuest submission form.
- [ ] Drop URL into final X post with `@0G_labs @0g_CN @0g_Eco @HackQuest_` and `#0GHackathon #BuildOn0G`.

---

## Open uncertainties

- Is the subpoena `RevealText` on-tempo for video? Test once before final. The scroll-driven char reveal works in the browser; in a recording, the camera scrolls slowly so the reveal hits.
- Should the live mint actually happen on-camera? If Phala CVM is up + verify-receipt PASSES against the signer, yes. Otherwise pre-recorded mint with the wait cut.

---

## Out-of-scope for v1

- HK b-roll
- Spline 3D scene
- Original soundtrack
- SRT subtitle track
- Sponsor logos in the cut
