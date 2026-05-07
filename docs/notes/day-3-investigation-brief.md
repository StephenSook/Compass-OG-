# Day 3 Investigation Brief — TeeML Custom Code + Phala Scout + SDK Diagnosis

**Date:** 2026-05-07 (Day 2 — pre-emptive Day-3 work after the Phase 6.0 verdict)
**Trigger:** Codex stress-test BLOCKER 6.1 — "TeeML may sign only LLM output, not Compass evaluator code"
**Method:** doc fetch + raw `eth_getCode` against SDK-hardcoded ledger CA + Phala docs scout

## Finding 1 — TeeML is OpenAI-compatible LLM only [CONFIRMED]

The 0G Compute provider docs (`/developer-hub/building-on-0g/compute-network/inference-provider`) state verbatim:

> "Your AI service must implement the OpenAI API Interface for compatibility."

Implication: TeeML providers serve OpenAI-compatible inference endpoints. There is no documented path to deploy an arbitrary Docker image (e.g. a deterministic Node.js SD-JWT verifier + policy evaluator) and have its measurement covered by TeeML attestation.

Codex BLOCKER 6.1 is therefore **confirmed** under the documented surface. The implicit-trust Plan B from commit `96357b9` only signs receipts from a 0G-blessed LLM image — NOT from Compass policy code.

This collapses the marginal security gain of pure-0G option (ii) over plain Node.js ECDSA (option iv): both prove "a key signed this", neither proves "Compass code produced this." TeeML attestation in option (ii) only certifies that some 0G-published inference image responded — not that the response represents Compass's deterministic policy evaluation.

**Open question banked for Q1 in `0g-dev-tg-ping.md`** — 0G may have an undocumented BYOC path; we ask before pivoting.

## Finding 2 — Compute SDK ledger CA is empty bytecode on V3 [CONFIRMED]

Diagnosis steps:

1. SDK 2.0.0 hardcodes `ledgerCA = '0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7'` at `node_modules/@0glabs/0g-serving-broker/lib.commonjs/broker.js:createZGComputeNetworkBroker`.
2. Raw RPC: `eth_getCode("0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7", "latest")` against `evmrpc-testnet.0g.ai` returns `0x` — **no contract deployed at that address.**
3. SDK calls `getLedger(address)` against an empty address → returns `0x` empty bytes → ethers v6 `BAD_DATA: could not decode result data`.

Root cause: V3 Galileo redeployed the compute ledger contract; SDK 2.0.0 still points at the V2 address. SDK fundamentally broken until a 2.1.x release ships with the new CA, OR we DIY direct-RPC against the V3 ledger contract once we know its address.

## Finding 3 — Storage SDK Flow.submit revert is the same architectural class [CONFIRMED]

Already documented in `docs/notes/0g-ecosystem-status.md`:

`Indexer.upload` → `Flow.submit(submission, {value: fee})` reverts `require(false)` regardless of fee. Pre-checked: market() resolves, paused() false, submission well-formed. Cause likely V3 added pricing/permission shape change not in SDK 0.3.3.

Both compute and storage SDKs are V3-stale. The chain layer (ethers + Hardhat directly against AgentRegistry + CompassHub) works because we deployed the contracts ourselves with current-version artifacts and ABIs — no SDK in the loop.

## Phala TDX scout — pivot scope estimate

From Phala docs (https://docs.phala.com/dstack/getting-started + https://phala.com/posts/understanding-tdx-attestation-reports-a-developers-guide):

| Capability Compass needs | Phala TDX support |
|---|---|
| Custom Docker container deploy | ✅ Dashboard + docker-compose.yml upload |
| REPORTDATA binding | ✅ Up to 64 bytes; supports binding TLS certs, wallet addresses, social proofs (and trivially: enclave-born signing pubkey + receipt digest) |
| TEE attestation quote retrieval | ✅ DStack Verifier reproduces the chain |
| First deploy time (claimed) | < 30 minutes |
| Pricing | Phala Cloud — pay-per-CVM hour; documented as developer-tier-friendly |

**Realistic pivot cost (revised down from Codex's 70–120 hr estimate now that we've scouted):**
- 4–6 hr Phala account + first CVM deploy + smoke "hello world"
- 6–10 hr port the existing `enclave/` TypeScript service into a Phala-deployed container
- 4–6 hr REPORTDATA binding flow: enclave generates ed25519 key on boot, `H(pubkey || challenge)` → reportData
- 6–8 hr quote verification on the consumer side via DStack Verifier
- 4–6 hr CompassHub `attestEligibility` wiring against Phala-signed receipts
- 4–6 hr docs + judge replicability + verify-receipt CLI
- 6–10 hr contingency

Total: **30–50 focused hours / 4–7 days** for a solo dev with no Phala prior. Codex's pessimistic 70–120 hr was without scouting and assumed untouched familiarity cost. Real cost is closer to the 0G Plan B estimate.

## Recommended pivot architecture (proposal — user to approve)

```
┌──────────────┐    ┌────────────────────────┐    ┌──────────────┐
│ User device  │ →  │ Phala TDX CVM (custom) │ ←  │ Provider     │
│ Privy wallet │    │ • SD-JWT verifier      │    │ (clinic)     │
│ AES-256-GCM  │    │ • Policy evaluator     │    │ submits Auth │
│ encrypts VC  │    │ • Receipt signer       │    │ grant        │
└──────────────┘    │ • REPORTDATA = H(pk‖c) │    └──────┬───────┘
       │            └────────┬───────────────┘           │
       ▼                     │                           ▼
┌──────────────┐             │                  ┌──────────────────┐
│ 0G Storage   │ ←───────────┴─────────────────▶│ 0G Chain         │
│ encrypted    │       (when SDK fixed)         │ AgentRegistry    │
│ vault blobs  │                                │ CompassHub       │
└──────────────┘                                │ (already         │
                                                │  deployed +      │
                                                │  working)        │
                                                └──────────────────┘
```

What's preserved as 0G ecosystem citizenship:
- AgentRegistry + CompassHub on Galileo (live, working)
- 0G Storage encrypted vaults (gated until SDK fix; placeholder works)
- 0G TeeML can still be used cosmetically for an LLM-generated "explain this receipt" feature on the demo frontend (NOT security-critical)

What moves to Phala:
- The actual TEE — receipt signing happens inside a Phala TDX CVM with REPORTDATA-bound enclave key
- Quote verification via DStack Verifier
- Honest-limits §5b updated: "REPORTDATA binding present (Phala TDX); 0G TeeML used for non-critical inference-flavored UX only"

What this does to the Track 5 narrative:
- "Pure-0G" tagline retreats to "0G Chain + 0G Storage + Phala TEE" — still ecosystem-citizenship-positive (0G is the load-bearing chain + storage layer; Phala fills the TEE primitive that 0G doesn't expose for custom workloads). Honest framing scores with privacy-track judges.
- Privacy claim STRENGTHENS — REPORTDATA-bound key is the strongest TEE proof available; Compass becomes the privacy-track project that actually shipped a hardware-quote-bound receipt key.

## Decision needed from user

Three forks:

1. **Pivot to Phala on Day 3 (now).** Don't wait for TG answers. Phala's REPORTDATA path is real, the cost is bounded, and the architectural correctness is compelling. Risk: if 0G TG comes back with "yes BYOC works, here's the SDK", we burned 4-7 days.

2. **Wait for TG answers (1–2 days).** Send the ping at next 14:00 UTC+8 daily Q&A. If Q1 = "yes BYOC", proceed pure-0G option (ii). If Q1 = "no, LLM-only" (most likely outcome per the docs), pivot Phala on Day 4–5. Risk: lose 1–2 days; total schedule exposure ~ same.

3. **Parallel: start Phala scout AND wait for TG.** Burn 6–8 hours on Phala "hello world" deploy + REPORTDATA toy program while TG queue resolves. If Q1 = yes BYOC, the Phala work is sunk cost (~$50-100 of Phala credits). If Q1 = no, we have a 6–8 hour head start.

Recommend (3) — bounded sunk cost, max optionality, momentum preserved.

## Files updated by this brief

None code-side. This is a banked decision point for the user. If user approves pivot, next commits will:
- Add Phala deploy scaffold (`enclave/phala/` workspace)
- Add reportData-binding receipt-signer module
- Update `docs/honest-limits.md` §5b to reflect Phala TEE
- Update `docs/architecture.md` trust-boundary table
- Update README "Architecture (at a glance)" to show Phala node

## Deeper investigation pass (Firecrawl + GitHub API + raw eth_call) — added 2026-05-07

User flagged that the first pass under-used research tools (single WebFetch + one WebSearch). Redid with proper tools.

### Smoking gun #2 — ALL THREE compute SDK addresses are empty bytecode on V3

`eth_getCode` against `evmrpc-testnet.0g.ai` for the three CAs hardcoded in `@0glabs/0g-serving-broker@2.0.0` (`broker.js:createZGComputeNetworkBroker` defaults):

| SDK constant | Address | bytecode length on V3 |
|---|---|---|
| `ledgerCA` | `0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7` | 2 chars (`0x` — empty) |
| `inferenceCA` | `0x46e8a02d609CaEfC1747197da1F38272d5E46c77` | 2 chars (`0x` — empty) |
| `fineTuningCA` | `0x35A5d96569867fE6534D823268337888229533dE` | 2 chars (`0x` — empty) |

**Compute SDK 2.0.0 is fully orphaned on Galileo V3.** Not a bug in one call path — every contract address it expects to exist points at empty space. V3 redeployed everything to new addresses; SDK has not caught up.

DIY direct-RPC fallback now requires not just rebuilding ledger/deposit flows but also locating all three V3 contract redeployments. The `0g-serving-broker` GitHub repo (Go backend at `0glabs/0g-serving-broker`) does NOT carry deployment-address constants in any file we could find via `api.github.com` content listing — the addresses are likely environment-config-driven on the team's deploy side, NOT pinned in the open-source SDK. We should ask 0G for the canonical V3 addresses in the same TG ping.

### Partial good news from inference-provider docs

Verbatim from `docs.0g.ai/developer-hub/building-on-0g/compute-network/inference-provider` (Firecrawl JSON extraction):

> "TEE (Trusted Execution Environment) verification ensures your computations are tamper-proof. Services running in TEE: - Generate signing keys within the secure environment - Provide CPU and GPU attestations - Sign all inference results. **These attestations should include the public key of the signing key, verifying its creation within the TEE.** All inference results must be signed with this signing key."

This says the attestation SHOULD include the signing-key pubkey. So 0G's TeeML attestation MAY support pubkey binding via some mechanism (compose hash inclusion? a non-REPORTDATA quote field?). Worth asking in the same TG ping — could collapse the entire pivot need if true.

But: the docs ALSO say verbatim "Your AI service must implement the OpenAI API Interface for compatibility." That constraint stands. Even if pubkey binding is supported, custom Compass evaluator code must masquerade as an OpenAI-compatible inference endpoint. Possible but constrains the architecture.

### Phala Cloud — confirmed free signup + free first CVM

Verbatim from `docs.phala.com/phala-cloud/getting-started/sign-up-for-cloud-account`:

> "Sign up with GitHub, Google, or email and password. Registration takes under a minute. After registration, you'll receive free credits to deploy your first CVM. No payment method required for the free tier."

Plus from dstack getting-started: TDX quote retrieval inside a Docker container is one curl call to `/var/run/dstack.sock`:

> ```
> curl -X POST --unix-socket /var/run/dstack.sock \
>   -H 'Content-Type: application/json' \
>   -d '{"reportData": "0x1234deadbeef..."}' \
>   http://dstack/GetQuote | jq .
> ```

Max 64 bytes reportData. For larger data (Compass needs `sha256(pubkey || nonce)` = 32 bytes), pad to 64. Implementation in `enclave/phala/src/attestation.ts`.

### Updated pivot estimate

Phala Cloud signup is 1 min. First "hello world" CVM deploy from the dashboard: under 30 minutes per Phala docs. Compass-specific scaffold (Dockerfile + docker-compose + reportData binding + verifier): ~6-8 hours of focused work.

Realistic Day-3 pivot if user approves Fork 1: a Phala-deployed Compass enclave with reportData-bound receipt signing live by end of Day 5. That preserves the original 28-day timeline.

### Tools used this pass (lesson logged)

- `mcp__firecrawl__firecrawl_map` — discovered 0G doc URL inventory
- `mcp__firecrawl__firecrawl_scrape` with JSON-mode extraction — pulled verbatim quotes from JS-rendered docs (WebFetch returned terse summaries)
- Raw `curl + eth_getCode` JSON-RPC — confirmed all three SDK CAs empty on V3
- `api.github.com` REST — probed `0glabs/0g-serving-broker` repo for canonical contract addresses (not present)
- Phala docs proper scrape — confirmed signup flow + reportData mechanics

The first investigation pass did NOT use Firecrawl, did NOT use eth_getCode parallel, did NOT probe GitHub. The user correctly flagged this. Lesson: for SPA-rendered docs, default to Firecrawl. For SDK-version-vs-deployed-state diagnostics, always run raw eth_getCode in parallel with the GitHub probe. WebFetch is for static HTML.
