# Codex Pre-Phase-6 Architecture Verdict

**Date:** 2026-05-07 (Day 2 of sprint)
**Decision frame:** Plan A vs Plan B for Compass TEE integration on 0G TeeML
**Reviewer:** Codex (GPT-5.5) via codex-rescue plugin
**Inputs cited in prompt:**
1. Real `processResponse(providerAddress, chatID)` signature — quoted from `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference` — has NO `content` parameter.
2. No documented REPORTDATA / custom-data exposure on 0G TeeML.
3. Day-1 broker smoke test failed (`broker.ledger.addLedger` reverts with `BAD_DATA: getLedger` decode error — SDK 2.0.0 vs V3 Galileo deployment drift).
4. Storage SDK also broken on V3 Galileo (`Indexer.upload → Flow.submit` reverts with `require(false)`).
5. Chain layer working — AgentRegistry + CompassHub deployed, agents 1 & 2 minted.

## Verdict — Option (ii): pure-0G Plan B with implicit enclave-key trust

> Pick option ii: pure-0G Plan B with implicit enclave-key trust, and document the missing REPORTDATA binding aggressively.
>
> Plan A is structurally false because `processResponse(providerAddress, chatID)` signs only the TeeML chat response, not arbitrary receipt content; Plan B's original REPORTDATA binding is impossible because 0G TeeML exposes no custom REPORTDATA path; Compute and Storage SDKs are currently broken on Galileo; Chain is working with AgentRegistry, CompassHub, and Maria agents minted. The best hackathon path is therefore: keep the strongest working 0G story, avoid brittle model-output security, ship enclave-signed receipts, and be explicit that trust is anchored in 0G image attestation plus published Docker Compose hash, not per-key REPORTDATA binding.

## Why NOT the other options

- **(i) Smuggle receipt hash into TeeML inference prompt** — explicitly rejected. Codex enumerated 7 attack vectors: prompt injection altering/omitting/transforming the hash, decoding ambiguity, temperature/model drift breaking determinism, malicious model echoing without processing, post-processing mutation of whitespace/JSON, replay without nonce/agentId/expiry binding, and the false impression that TeeML signed the receipt when it only signed a model response containing text. "It turns the model into a security transport it was not designed to be."
- **(iii) Phala TDX / Oasis ROFL / AWS Nitro pivot** — stronger cryptographically (real REPORTDATA binding) but 70–120 hours / 10–16 days for a solo build vs 35–55 hours for option (ii). Burns half the remaining schedule and weakens pure-0G ecosystem-citizenship narrative for Track 5.
- **(iv) Skip TEE entirely, plain Node.js ECDSA** — degrades the privacy claim to "non-identifying receipt + on-chain Authwit only". Demo still works, but security claim retreats too far for grand-prize tier.

## Honest-limits language Codex authored (load into README + honest-limits.md)

> Compass receipts are generated inside the TeeML-attested container and signed by a key controlled by that runtime. Current 0G TeeML documentation does not expose custom REPORTDATA, so Compass cannot cryptographically bind the receipt signing key into the hardware quote; verification instead checks that the execution environment matches the 0G-published Docker Compose hash and expected TEE signer address. This means the prototype demonstrates TEE-gated receipt issuance under 0G attestation, but not a formally complete enclave-born-key proof. The implementation rejects any claim that arbitrary receipt JSON is covered by TeeML's `processResponse` signature.

## Day-15 escape criterion (verbatim)

> By Day 15, Compass must have a demo path where a judge can verify, from a fresh run, all of the following: TEE attestation passes, Docker Compose hash matches the expected 0G TeeML deployment, CompassHub verifies an enclave-signed receipt, and the UI clearly shows the attestation boundary and limitation.

If not working by Day 15, fallback priority order:
1. **Phala TDX or Oasis ROFL pivot** — only if it can produce a real REPORTDATA-bound key proof within 3 days.
2. **Option (ii) reduced scope** — if 0G TeeML attestation works but receipt verification needs simplification.
3. **Option (iv) plain Node.js ECDSA** — only if TEE integration blocks the demo entirely.
4. **Option (i) hash-in-prompt** — last resort. Discouraged.

## Risks Codex flagged for the chosen path (option ii)

Beyond key substitution:
- Malicious image with same apparent behavior signing receipts while leaking inputs if Docker Compose hash verification is misunderstood or stale.
- Secrets injected via env vars, mounted volumes, or network calls outside the intended trust boundary.
- Enclave signing receipts generated from untrusted host-provided inputs without input-provenance constraints.
- Replay of old valid receipts without nonce and expiry enforcement (CompassHub already enforces nullifier replay protection — verify the receipt path uses it too).
- Verifier configuration pointed at the wrong expected signer or compose hash.
- Supply-chain compromise of the published image, base image, or startup scripts.
- Core limitation: without REPORTDATA binding, judges cannot independently prove the receipt key was generated inside the attested enclave.

## Time budget for chosen path

> 35–55 hours, 5–7 focused days. Breakdown: 6–10h TeeML attestation verification + expected signer/hash handling; 6–8h enclave receipt signing + key lifecycle; 6–10h CompassHub verification wiring + replay protections; 5–8h UI/demo flow; 4–8h hostile-judge documentation + limitation language; 8–12h contingency for 0G SDK quirks.

## Plan adjustments triggered by this verdict

| Plan task | Original | Revised |
|---|---|---|
| Phase 6b.0 (TEE custom-data inspection) | Inspect REPORTDATA support | **Already done — confirmed unsupported. Document gap.** |
| Phase 6b.4 (reject unbound-key receipts) | Test rejects forged keys via REPORTDATA | **Test rejects forged keys via Docker Compose hash mismatch + signer address mismatch** |
| R19 (mitigation) | "If no field carries arbitrary 32-byte data, downgrade security claim explicitly in README" | **Triggered. Honest-limits language above is the downgrade.** |
| Plan B locked-primary | Plan B with REPORTDATA binding | **Plan B with implicit Docker Compose hash + signer address attestation** |
| Day-15 decision gate | Plan A vs Plan B switch | **Plan B vs Phala pivot — escape criterion above** |

## SDK gating reality (May 7)

| SDK | Status |
|---|---|
| `@0glabs/0g-ts-sdk@0.3.3` (storage) | **BROKEN on Galileo V3** — `Flow.submit` reverts `require(false)`. Filed for 0G dev TG. |
| `@0glabs/0g-serving-broker@2.0.0` (compute) | **BROKEN on Galileo V3** — `getLedger(address)` returns empty bytes, SDK can't decode. |
| Chain (ethers v6 + Hardhat) | **WORKING** — both contracts deployed, mints land, events emit. |

Two of three 0G SDKs we depend on are broken on the active testnet. Both filed for 0G dev follow-up. **Phase 6 implementation depends on the broker SDK getting fixed (or us using a non-SDK direct-RPC path against the broker contracts).** This is a real schedule risk; flag at Day-15 gate.

## Action items immediately downstream

1. Update `docs/honest-limits.md` to fold in Codex's REPORTDATA gap language verbatim.
2. Update `docs/notes/0g-ecosystem-status.md` with the smoke test failure + storage SDK failure as confirmed Day-1 findings.
3. Re-cast Phase 6 implementation steps in the master plan to reflect Plan B (implicit-trust variant), drop Plan A entirely, and stage the Day-15 Phala escape route.
4. Begin Phase 6 implementation: TeeML attestation verification on the consumer side + enclave receipt signing + CompassHub `attestEligibility` wiring.
