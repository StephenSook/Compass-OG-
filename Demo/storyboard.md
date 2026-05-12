# Compass — demo storyboard

Visual companion to `Demo/script.md`. Beat-by-beat breakdown of what's on screen, what the camera is doing, and which production resource is loaded for each second of the cut.

Target runtime: **2:55** (script-aligned; previous 2:50 budget extended by 5s to land the "Aristotle mainnet" lines).

---

## Beat-by-beat table

| Time | Beat | What's on screen | Camera move | Voiceover (verbatim) |
|---|---|---|---|---|
| 0:00–0:18 | Open on Maria | `/` Cinematic Privacy hero, italic accent on `*identity*`, BlurText entrance | Hold static 2s, then animate; no camera move | "Maria works sixteen hours a day in a Hong Kong apartment. Today she needs free legal help." |
| 0:18–0:48 | The harm | Static composite. Use `Demo/assets/persona/hands-sink.png` (hands at the sink, no face — Banana-generated). Editor overlays it during VO; not loaded in the browser. | Slow Ken Burns push-in, 30s | "If she walks into the clinic the normal way, she hands over her passport, her employment contract, her HKID. The clinic stores them. Her employer subpoenas the file. Fourteen days. Deportation." |
| 0:48–1:30 | The Compass moment | Live UX on `/onboard`: 4-step walkthrough with `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` so the on-chain leg routes to **Aristotle mainnet** (chainId 16661). Steps 1-3 tick green in <5s each (Privy session pre-authed). Step 4 → "Request HELP eligibility (live) →" → wallet typed-data prompt → submitting grant… → mining receipt… → ✓ receipt minted with **Aristotle** explorer tx hash + 15-min bucket pill | Cursor-driven, real interaction. End with the green "✓ receipt minted" pill held for 1s | "With Compass, Maria proves she qualifies — without proving who she is. The clinic learns one bit. *Eligible.* Receipt minted, on 0G Aristotle mainnet." |
| 1:30–2:18 | Architecture, fast | `/about` scroll-through. 4-layer SVG diagram → ambient Spline 3D scene → integration table → reality table | Smooth scroll, no stops | "SD-JWT credential, encrypted on her device. 0G Storage holds the ciphertext. The receipt-signer runs inside Phala TDX. It evaluates the policy, signs the receipt with a key sealed inside the attested image. The receipt lands on 0G Chain — Aristotle mainnet. Three sentences." |
| 2:18–2:48 | The subpoena scene | `/clinic/subpoena` with `<RevealText>` char-by-char reveal | Slow downward scroll matching the reveal cadence; **2-second pause on the italic punchline** | "The clinic's full disclosure under PDPO §57 — *Someone qualified for free legal assistance at fourteen-thirty-two on May eighteenth, twenty-twenty-six.*" *(pause)* "That's all that exists." |
| 2:48–2:58 | The TAM | Black title card, Geist Mono caption | Static | "Fifteen million migrant workers across APAC. We start with Maria." |

---

## Frame-by-frame storyboard

### Frame 1 — hero (0:00–0:20)

```
+------------------------------------------+
|                                          |
|                                          |
|       Prove eligibility, not             |
|              *identity.*                 |
|                                          |
|                                          |
|     Maria works 16 hours a day in a      |
|     Hong Kong apartment...               |
|                                          |
|   [ Onboard Maria's agent → ]            |
|   See the disclosure log →               |
|                                          |
+------------------------------------------+
```

Hold the frame static for 2 seconds. Let the BlurText entrance animation finish. The italic on `*identity*` is the visual hook.

### Frame 2 — the harm (0:20–0:50)

Composite illustration. NO faces. NO real photos of vulnerable persons. The Banana persona assets (`hands-sink.png`, etc.) carry this beat — abstract enough to avoid exploitation framing, specific enough to anchor the voiceover.

Slow Ken Burns push-in. ~30 seconds total. The image is doing the emotional work — the voiceover delivers the facts.

### Frame 3 — Compass mint (0:48–1:30)

```
+------------------------------------------+
|  Maria's agent, in three steps.          |
|                                          |
|  01  Connect wallet              ✓ done  |
|  02  Mint the agent              ✓ done  |
|       0xfcbe…fc8e41 ↗                    |
|  03  Issue demo credential       ✓ done  |
|       128 B AES-256-GCM · 4 claims …     |
|                                          |
|  Maria's agent is *ready*.               |
|                                          |
|  [ Request HELP eligibility (live) → ]   |
|     Open the vault →                     |
|     See the disclosure scene →           |
|                                          |
|  -- click 'Request HELP eligibility' --  |
|                                          |
|  awaiting signature… → submitting        |
|  grant… → mining receipt… →              |
|  ✓ receipt minted                        |
|  chainscan.0g.ai/tx/0x… ↗                |
|  bucket 1715024400                       |
+------------------------------------------+
```

The link goes to `chainscan.0g.ai` (Aristotle mainnet), NOT
`chainscan-galileo.0g.ai`. The `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` flag
must be set in the deployed Vercel env before recording. Verify by
making a manual round-trip first and confirming the tx lands at
`chainscan.0g.ai`, not the testnet explorer.

If Phala CVM is up + `/api/tee-status` returns `mode: tee`: real mint,
on-camera, ~8s wait visible (1s wallet sig + ~3s tx broadcast + ~4s
mining + receipt-event parse). If CVM is down: `/api/consume` now 503s
with `tee_required` (review-pass change, 2026-05-11) — there is no
silent stub-digest fallback, so the recording cannot proceed. Restart
the CVM and re-verify before recording. The TEE-status badge on
`/about` is a separate visual — pull it in only if Beat 4 has slack.

### Frame 4 — architecture (1:30–2:18)

Scroll through `/about`:
1. Hero ("the receipt-signer runs in 0G Sealed Inference") — 4 seconds
2. 4-layer SVG diagram (`<ArchitectureDiagram>`) — 12 seconds
3. Ambient Spline 3D scene (renders below the diagram via `<SplineScene>`) — 6 seconds. This is the B.4 activation that landed 2026-05-10. Decorative, not narrated.
4. Integration table — 8 seconds
5. **"How Compass differs from adjacent projects"** comparison table (Worldcoin / Polygon ID / Anon Aadhaar / zkPass / Privacy Pools) — 8 seconds, scrolled-through, not stopped on
6. Reality table — 10 seconds. Specifically pass the eye over: AgentRegistry + CompassHub rows ("deployed to both 0G Galileo testnet and 0G Aristotle mainnet"), the Phala Cloud TDX row ("signer 0xaba6…a7e7, composeHash 0x1884…cea0"), and the Aristotle mainnet deploy row.

Smooth, continuous scroll. Camera does not stop. Voiceover compresses 4 layers into 3 sentences + "Aristotle mainnet."

### Frame 5 — subpoena (2:20–2:50)

```
+------------------------------------------+
|  HK LABOUR DEPARTMENT — DATA REQUEST     |
|  PDPO CAP. 486 §57                       |
|                                          |
|  ┌──────────────────────────────────┐   |
|  │                                  │   |
|  │           [ no data ]            │   |
|  │                                  │   |
|  └──────────────────────────────────┘   |
|                                          |
|  Disclosed                               |
|                                          |
|  Someone qualified for free legal       |
|  assistance at 14:32 on May 18, 2026.   |
|                                          |
|  *That's all that exists.*               |
|                                          |
|  No name. No HKID. No employer.          |
|  No documents.                           |
|                                          |
+------------------------------------------+
```

Slow downward scroll. The `<RevealText>` activates as the camera passes through it — char-by-char opacity reveal. **Pause 2 seconds on the italic punchline** before the next voiceover.

### Frame 6 — TAM (2:50–3:00)

```
+------------------------------------------+
|                                          |
|                                          |
|                                          |
|                                          |
|                                          |
|                                          |
|     15M migrant workers across APAC.     |
|     We start with Maria.                 |
|                                          |
|                                          |
|                                          |
+------------------------------------------+
```

Pure black background. Geist Mono. Lower-third placement. Hold for 8 seconds, then end.

---

## Production resource manifest

| Asset | Location | Status |
|---|---|---|
| `hands-sink.png` | `Demo/assets/persona/` | Banana-generated this session |
| `hk-skyline.png` | `Demo/assets/persona/` | Banana-generated this session |
| `abstract-enclave.png` | `Demo/assets/persona/` | Banana-generated this session |
| `<ArchitectureDiagram>` | `app/src/components/about/ArchitectureDiagram.tsx` | Inline SVG, in repo |
| `<SplineScene>` | `app/src/components/about/SplineScene.tsx` | Env-gated 3D scene; lazy-loaded behind Suspense. Requires `NEXT_PUBLIC_COMPASS_SPLINE_SCENE_URL` set (already in Vercel env) |
| `<RevealText>` | `app/src/components/primitives/RevealText.tsx` | In repo |
| `<TEEBadge>` | `app/src/components/primitives/TEEBadge.tsx` | In repo |
| Live `/onboard` step 4 flow | `https://app-psi-pied.vercel.app/onboard` | Privy session pre-authed; provider wallet ≥0.05 OG on Aristotle; 3 demo policies (HELP, Bethune, Hospital) registered on Aristotle CompassHub |
| Live `/clinic/subpoena` | `https://app-psi-pied.vercel.app/clinic/subpoena` | Verify before recording |
| Live TEE attestation badge | `https://app-psi-pied.vercel.app/api/tee-status` | Must return `mode: tee, reachable: true` — required for recording; no fallback after the 2026-05-11 fail-closed change |
| Live mint (Phala CVM) | `https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network/health` | Verify `source: tee` before recording |
| Aristotle chainscan link | `https://chainscan.0g.ai/address/0xe42fd4F0a3197126fEeF5e6AAfC5Fb8848bBC58b` | The CompassHub on mainnet — open in a second tab during Beat 3 if a "click the tx hash" beat is added |

---

## Cuts to make (verbatim from script)

- Every gas confirmation screen.
- Every loading spinner over 1s (fast-forward 3x or jump-cut).
- Every architecture lecture over 30s.
- Any backstory over 20s.
- Any "and so what we did was..." filler.
- Any moment where the camera lingers on Vercel's deploy banner.

---

## Recording-day timeline

T-60 min:
- **Phala dashboard** — Click **Start** on the `compass` CVM
  (cloud.phala.com/stephensooks-projects). Wait ~30s for boot.
- Verify Phala CVM up:
  `curl -s https://app-psi-pied.vercel.app/api/tee-status | jq .`
  → expects `mode: tee, reachable: true, source: tee, signer: 0xaba6…a7e7`
- **Mainnet flag** — confirm `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` set in
  Vercel prod env (`vercel env ls --environment production`). If unset
  or `0`, set it and promote a new deploy. The flag controls
  `activeChain()` / `activeCompassHub()` which `/api/consume` now uses
  (review pass, 2026-05-11). Without this, the mint lands on Galileo
  testnet, not Aristotle mainnet — quietly defeating the demo claim.
- Verify Vercel production URL renders all routes (cold load) — `/`,
  `/onboard`, `/vault`, `/about`, `/audit`, `/clinic`, `/clinic/inbox`,
  `/clinic/policies`, `/clinic/subpoena`, `/policies/<slug>`, `/receipt/<id>`,
  `/faq`, `/roadmap`, `/demo` (the last three landed in the polish push;
  they shouldn't appear in the recorded cut but the cold-load check
  surfaces any regressions before the live shoot).
- Run `npm run verify-receipt -- --live https://65c93172e22403466eecee47dd1cc90375014a0f-8080.dstack-pha-prod9.phala.network --expected-compose 0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0`
  from `enclave/`; expect `OK — receipt verified against TEE attestation`.
- **Pre-auth Privy session** — open `/onboard` in the recording browser,
  complete email login (do NOT record this step). Refresh; Step 1
  should show the wallet address pre-loaded.
- Verify provider relayer balance ≥ 0.05 OG on **Aristotle mainnet**:
  `node -e "const{ethers}=require('ethers');new ethers.JsonRpcProvider('https://evmrpc.0g.ai').getBalance('0xaD736a7233847Cf1D73a7D820b32424CF8125b0a').then(b=>console.log(ethers.formatEther(b),'OG'))"`
- **Test mint** — fire one /api/consume round trip through the live UI
  before recording. Verify the resulting tx is on chainscan.0g.ai (NOT
  chainscan-galileo.0g.ai). If it lands on Galileo, the mainnet flag
  didn't take — recheck the env var + redeploy.

T-30 min:
- Hide bookmark bar, DevTools, dock
- DND on, notifications silenced
- Camera region selected: `Cmd+Shift+5` → "Record Selected Portion" → drag rectangle
- Audio level test: 30s of voiceover, check waveform peaks at -6dB

T-0:
- Beat 1 first take. Re-record if any cursor wobble or hesitation.
- Beat 2 second. Beat 3 third. Etc.
- One beat = one take. Don't try to re-record mid-beat.

Post:
- Stitch in editor. Cut on beat boundaries.
- Voiceover sync: voiceover ends 200ms before next visual transition.
- Cold-viewer test by Day +1. Re-cut once if Beat 1 lands flat.

---

## Cold-viewer test (verbatim from script)

After first cut, send to two people who haven't seen Compass before. Single question:

> "What does this product do? In one sentence."

If both answer correctly: ship. If either fails: re-cut Beat 1 + Beat 2.
