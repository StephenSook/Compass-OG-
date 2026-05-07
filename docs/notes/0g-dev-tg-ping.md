# 0G Dev TG Ping — Four Blocking Questions (Compass)

**For copy-paste to 0G Telegram bug-report channel / Daily Q&A (14:00–15:00 UTC+8).**

Send as one message, follow up per-thread. Greeting + context + four numbered questions.

---

```
Hey 0G team. Solo hackathon builder on Track 5 (Compass — privacy-preserving
eligibility receipt firewall). Day 2 of the sprint. Four blockers — answers
unlock the rest of my build.

1. Custom-code TeeML question
   The provider docs say "Your AI service must implement the OpenAI API
   Interface for compatibility." Does TeeML attest only OpenAI-compatible
   LLM workloads, or can a publisher deploy an arbitrary Docker image
   (e.g. a deterministic Node.js policy evaluator that does NOT call an
   LLM) and have the TEE measurement cover that custom code?

   Compass needs the receipt-signing logic measured + attested. If TeeML
   is LLM-only, I need to know now so I can pivot to Phala/Oasis on Day 3
   instead of Day 15.

2. Compute SDK on Galileo V3 — all three hardcoded CAs return empty bytecode
   `@0glabs/0g-serving-broker@2.0.0` hardcodes:
     ledgerCA      0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7
     inferenceCA   0x46e8a02d609CaEfC1747197da1F38272d5E46c77
     fineTuningCA  0x35A5d96569867fE6534D823268337888229533dE
   `eth_getCode` against `evmrpc-testnet.0g.ai` returns `0x` for ALL three —
   nothing deployed at any of them. `broker.ledger.addLedger("0.01")` fails
   on the downstream `getLedger(address)` decode because the call hits
   empty space. What are the correct V3 ledger / inference / fineTuning CAs
   on Galileo, or which SDK version pins them?

3. Storage SDK on Galileo V3 — Flow.submit revert
   `@0glabs/0g-ts-sdk@0.3.3` `Indexer.upload` →
   `Flow.submit(submission, {value: fee})` against Flow CA
   `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` reverts with raw
   `require(false)` regardless of fee size (tested SDK-calculated 30 gwei
   AND explicit 0.001 OG override). Pre-checked: `Flow.market()` resolves,
   `Flow.paused()` returns false, submission struct well-formed (1 segment,
   1 chunk, 241-byte payload). Did V3 add a per-publisher pre-deposit or
   market-reward shape that the SDK's `calculatePrice` doesn't cover?

4. TeeML attestation — how does the signing-key pubkey get bound?
   The inference-provider docs say verbatim: "These attestations should
   include the public key of the signing key, verifying its creation
   within the TEE." But I can't find a documented mechanism — REPORTDATA
   isn't exposed to callers per the SDK surface. Is the signing-key
   pubkey:
     (a) embedded in REPORTDATA via a path I'm missing?
     (b) included in the Docker Compose hash / image manifest that
         `verifyService` checks?
     (c) carried in some other quote field (runtime data, RTMR, custom
         claim) that the consumer can verify?
   If (a) or (c), Compass can stay pure-0G. If only (b), we lose the
   "key was generated inside this exact image" proof and the pivot to
   Phala TDX (which exposes reportData up to 64 bytes) becomes
   structurally necessary.

Wallet 0x05b5Bb...5d34, chainId 16602 confirmed, balance 5.088 OG.
Repo public: github.com/StephenSook/Compass-OG-

Thanks 🙏
```

---

## Backup channel options

If TG channel is slow:
- 0G Discord `#builders` — same four questions, may attract independent builder confirmation
- Daily Q&A (Dragon hosts, 14:00–15:00 UTC+8 per pinned)
- Direct DM to roscuong | Kai (Galactic Guardians) — already responsive on the 5 OG send

## Expected answer paths

| Question | Best-case answer | Worst-case answer | Action under worst-case |
|---|---|---|---|
| 1 (custom-code TeeML) | "Yes — providers can publish arbitrary Docker images measured by TeeML" | "No — TeeML is OpenAI-compatible LLM only" | Pivot to Phala TDX (custom container + REPORTDATA), keep 0G Chain + Storage as integration |
| 2 (broker SDK) | "Use SDK 2.1.0 / hardcode new CAs `0x...`" | "V3 redeploy still in flight, ETA TBD" | DIY direct-RPC against new contract ABIs (24–45 hr per ecosystem-status) |
| 3 (storage SDK) | "Set `taskSize: N` / pin to commit `xyz`" | "V3 Flow rewrite still in flight" | Skip live storage; ship demo with `compass-skipped://placeholder` URI scheme |
| 4 (pubkey binding) | "REPORTDATA is exposed via X" or "carried in quote field Y" | "Only via Docker Compose hash — no per-key binding" | Pivot to Phala (Q4 + Q1 worst-case both confirm pivot need) |

Worst-case on all four = Phala pivot triggered + DIY-RPC fallback for compute + storage stays gated. Roughly 60–90 hrs of work but unblocks the build. Best-case on Q1 + Q4 = entire architecture stays pure-0G with provable key binding.
