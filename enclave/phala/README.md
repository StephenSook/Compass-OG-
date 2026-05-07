# Compass on Phala TDX — Day-15 Escape Hatch

Phala TDX deployment scaffold. **Not the primary path.** Retained as a Day-15 fallback if the pure-0G TeeML deployment hits an integration issue we can't resolve in time.

## Status (Day 3, 2026-05-07)

The original trigger for this scaffold was the assumption that 0G TeeML couldn't measure custom Compass code AND didn't expose REPORTDATA. Both assumptions were inverted by the 0G compute team's TG response the same day:

- TeeML attests arbitrary Docker images via dstack TDX. The OpenAI API requirement is a broker-routing constraint, NOT a TDX measurement constraint. Compass wraps the receipt-signer as an OpenAI-shaped HTTP endpoint to satisfy routing; TDX measures the whole image.
- REPORTDATA binding works on 0G TeeML — dstack TDX writes the signing key's Ethereum address into `report_data` automatically.

So Compass ships pure-0G with real hardware-bound REPORTDATA proof. This scaffold remains as the bounded-cost escape hatch in case integration with 0G's TeeML provider deployment hits a blocker we can't resolve before Day 15.

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
