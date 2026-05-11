# Support

Thanks for your interest in Compass. This file points you to the right channel for the kind of help you need.

## Quick links

| You want to... | Go to |
|---|---|
| Report a security issue (privately) | [`SECURITY.md`](./SECURITY.md) — do **not** open a public issue |
| Verify a Compass receipt | <https://app-psi-pied.vercel.app/verify> (browser, no install) |
| Reproduce the live deploy's attestation | [`README.md` § "Replicate the TEE binding yourself"](./README.md#replicate-the-tee-binding-yourself) |
| File a bug | [Open a Bug issue](https://github.com/StephenSook/Compass-OG-/issues/new?template=bug.yml) |
| Suggest a feature | [Open a Feature issue](https://github.com/StephenSook/Compass-OG-/issues/new?template=feature.yml) |
| Understand the architecture | [`docs/architecture.md`](./docs/architecture.md) or [/about on the live app](https://app-psi-pied.vercel.app/about) |
| Understand the threat model | [`docs/threat-model.md`](./docs/threat-model.md) |
| Understand what Compass does **not** protect against | [`docs/honest-limits.md`](./docs/honest-limits.md) |
| Read the whitepaper | [`docs/whitepaper.pdf`](./docs/whitepaper.pdf) |
| Cite Compass academically | [`README.md` § "Cite this work"](./README.md#cite-this-work) |
| Get in touch with the maintainer | Telegram `@stephensookra` |

## Response expectations

Compass is a solo hackathon build (0G APAC 2026 Track 5). Best-effort response times:

| Channel | Target |
|---|---|
| Security disclosures (email `stephensookra@gmail.com` with subject `[Compass Security]` or Telegram `@stephensookra` per [SECURITY.md](./SECURITY.md)) | 72 hours initial acknowledgement |
| Public issues (bug / feature) | 5 business days |
| Pull requests | Reviewed in the order received |

Outside the active hackathon submission window (now → June 5 2026), expect slower turnaround.

## What this repo is *not* set up for

- **Production-grade support** — Compass is a research-stage project. The honest-limits document spells out exactly what is, and is not, hardened.
- **Real-time chat** — there is no Discord, Slack, or Telegram group. The repo is the source of truth.
- **Custom enterprise integrations** — out of scope until the project graduates beyond hackathon stage.

## Anti-trafficking mission notice

Compass exists to protect vulnerable migrant workers. If you encounter the repo or the live demo being used in a way that could re-identify a real worker or undermine that mission, please flag it via security disclosure (private, not public issue) — see [`SECURITY.md`](./SECURITY.md) and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) § "Mission-specific abuse".
