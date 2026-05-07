# Compass on Phala TDX — Day-3 Scaffold

Phala TDX deployment for the Compass enclave service. Used if 0G TeeML cannot run custom Compass evaluator code (Codex BLOCKER 6.1 — see `docs/notes/codex-tee-architecture-review.md`).

## Why this exists

0G TeeML providers must "implement the OpenAI API Interface" per `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference-provider`. Compass needs to run a deterministic SD-JWT verifier + policy evaluator, not an LLM. Phala TDX supports arbitrary Docker images measured by TDX attestation with full REPORTDATA binding (up to 64 bytes — covers `sha256(signerPubkey || nonce)`).

## What's here

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build of the Compass enclave service |
| `docker-compose.yaml` | Phala dstack-compatible service def; mounts `/var/run/dstack.sock` |
| `src/attestation.ts` | Generates Ed25519 signer keypair on boot, requests TDX quote with `reportData = sha256(pubkey \|\| nonce)` |
| `src/verify-attestation.ts` | Consumer-side `extractReportData` + `verifyReportDataBinding` |

## Deploy steps (Phala Cloud — quickest path)

1. Sign up free at `https://cloud.phala.com/register` — GitHub/Google/email; takes <1 min; free credits cover first CVM
2. From `/Users/stephensookra/Desktop/Compass/Compass-OG-/enclave`, build: `docker build -f phala/Dockerfile -t compass-enclave:latest .`
3. In Phala Cloud dashboard → CVM → New CVM → upload `phala/docker-compose.yaml`
4. Set encrypted env vars (`COMPASS_POLICY_REGISTRY_URL`, etc) per docker-compose.yaml
5. Click Deploy. Phala provisions a TDX CVM, pulls the image, runs it
6. Copy the deployment URL + the published compose hash from the Phala dashboard
7. Pin the compose hash in `docs/honest-limits.md` §5b

## Deploy steps (self-hosted dstack — only if Phala Cloud rate-limits)

Requires bare-metal Intel TDX server (16GB RAM + 100GB disk + IPv4). Skip unless Phala Cloud is unavailable. Reference: `https://docs.phala.com/dstack/getting-started`.

## Verifier flow (consumer side)

```ts
import { verifyReportDataBinding } from "./verify-attestation";

const { ok, reason } = verifyReportDataBinding({
  quoteHex: "0x...",                       // from Phala dashboard / receipt blob
  expectedSignerPubkey: pubkey32Bytes,     // from receipt JSON
  nonce: challenge32Bytes,                 // from grant
});
if (!ok) throw new Error(reason);
```

Then verify the receipt signature with `expectedSignerPubkey`. Combined with the Phala-published compose hash, the verifier proves: (a) the signing key was generated inside a TDX-measured image, (b) the image content matches the expected Compass deployment, (c) the receipt was signed by that exact key.

This is the REPORTDATA-bound proof that 0G TeeML does not expose.

## Open questions banked for Phala TG / Discord

1. Does Phala Cloud's free-credit tier allow long-running CVMs (24+ hr) or only short bursts?
2. What's the canonical TDX Quote Verification flow — DStack Verifier binary, Trust Center API, or roll-your-own with Intel QVL?
3. Is the dstack `composeHash` in `GetQuote` response the exact value matched against the Phala dashboard image hash?

## What still ties Compass to 0G

Even with Phala doing the TEE, 0G remains load-bearing:
- AgentRegistry + CompassHub deployed to Galileo (live, agents 1+2 minted)
- 0G Storage encrypted vault uploads (gated until SDK fix)
- Optional 0G TeeML for an "explain this receipt" LLM-flavored UX in the demo (cosmetic, not security-critical)

Track 5 narrative: "0G Chain + 0G Storage + Phala TEE." Honest engineering framing.

## Cost trigger

Activate this scaffold only when Phase 6.0 BLOCKER 6.1 is confirmed by 0G dev TG ("TeeML is OpenAI-only, no BYOC"). If 0G says BYOC is supported, defer Phala build, return to pure-0G option (ii). The Day-3 investigation brief at `docs/notes/day-3-investigation-brief.md` documents the trigger.
