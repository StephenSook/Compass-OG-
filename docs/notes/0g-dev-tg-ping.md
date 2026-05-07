# 0G Dev TG Ping — Three Blocking Questions (Compass)

**For copy-paste to 0G Telegram bug-report channel / Daily Q&A (14:00–15:00 UTC+8).**

Send as one message, follow up per-thread. Greeting + context + three numbered questions.

---

```
Hey 0G team. Solo hackathon builder on Track 5 (Compass — privacy-preserving
eligibility receipt firewall). Day 2 of the sprint. Three blockers — answers
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

2. Compute SDK on Galileo V3 — broken ledger contract
   `@0glabs/0g-serving-broker@2.0.0` hardcodes ledger CA
   `0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7`. `eth_getCode` against
   `evmrpc-testnet.0g.ai` returns `0x` (no contract deployed there).
   `broker.ledger.addLedger("0.01")` fails on the downstream
   `getLedger(address)` decode because there's nothing to call. Has the
   ledger contract been redeployed on V3 to a new address? What's the
   correct CA, or which SDK version pins it?

3. Storage SDK on Galileo V3 — Flow.submit revert
   `@0glabs/0g-ts-sdk@0.3.3` `Indexer.upload` →
   `Flow.submit(submission, {value: fee})` against Flow CA
   `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` reverts with raw
   `require(false)` regardless of fee size (tested SDK-calculated 30 gwei
   AND explicit 0.001 OG override). Pre-checked: `Flow.market()` resolves,
   `Flow.paused()` returns false, submission struct well-formed (1 segment,
   1 chunk, 241-byte payload). Did V3 add a per-publisher pre-deposit or
   market-reward shape that the SDK's `calculatePrice` doesn't cover?

Wallet 0x05b5Bb...5d34, chainId 16602 confirmed, balance 5.088 OG.
Repo public: github.com/StephenSook/Compass-OG-

Thanks 🙏
```

---

## Backup channel options

If TG channel is slow:
- 0G Discord `#builders` — same three questions, may attract independent builder confirmation
- Daily Q&A (Dragon hosts, 14:00–15:00 UTC+8 per pinned)
- Direct DM to roscuong | Kai (Galactic Guardians) — already responsive on the 5 OG send

## Expected answer paths

| Question | Best-case answer | Worst-case answer | Action under worst-case |
|---|---|---|---|
| 1 (custom-code TeeML) | "Yes — providers can publish arbitrary Docker images measured by TeeML" | "No — TeeML is OpenAI-compatible LLM only" | Pivot to Phala TDX (custom container + REPORTDATA), keep 0G Chain + Storage as integration |
| 2 (broker SDK) | "Use SDK 2.1.0 / hardcode new CA `0x...`" | "V3 ledger redeploy still in flight, ETA TBD" | DIY direct-RPC against new ledger ABI (24–45 hr per ecosystem-status) |
| 3 (storage SDK) | "Set `taskSize: N` / pin to commit `xyz`" | "V3 Flow rewrite still in flight" | Skip live storage; ship demo with `compass-skipped://placeholder` URI scheme |

Worst-case on all three = Phala pivot triggered + DIY-RPC fallback for compute + storage stays gated. Roughly 60–90 hrs of work but unblocks the build. Best-case on Q1 = entire architecture stays pure-0G.
