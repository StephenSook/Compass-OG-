# 0G Ecosystem — Bookmark + Live Status (May 6 2026)

Source: Telegram bug-report channel + the user's downloaded `0G-Compute-SDK-Fine-tune-Bug-Report.docx`. Treat as "current state per the Telegram channel" — verify before Phase 8 mainnet deploy.

## Network IDs

| Network | Chain ID per plan | Chain ID per Telegram | Status |
|---|---|---|---|
| Galileo Testnet | 16602 | 16602 (per bug report) | ✅ Aligned |
| Aristotle Mainnet | 16661 | **16600** ← drift | ⚠️ Verify before Phase 8 |

The Telegram bug-report channel's pinned message lists `0G Chain Mainnet: Chain ID 16600`. The ChatGPT research brief and our locked plan use `16661`. Either:
- the chain was relaunched/renamed since the research was conducted
- the Telegram pinned message is stale
- there are two mainnets (transition period)

**Action:** before Phase 8 mainnet deploy (Day 24), call the official RPC and verify `eth_chainId`. Update `hardhat.config.ts` + `.env` if 16600 is correct.

## RPC URLs

- Galileo testnet: `https://evmrpc-testnet.0g.ai` ← confirmed working in Day-1 smoke test (RPC reachable, balance read OK)
- Mainnet (16661 plan, may be 16600): `https://evmrpc.0g.ai` ← unverified
- Mainnet (16600 alternative): not yet verified

## Faucets

- `hub.0g.ai/faucet?network=testnet` — **BROKEN per Telegram bug reports** ("none of the buttons work for me", "hub.0g.ai连接钱包一直不成功")
- `faucet.0g.ai` — **301 redirects to hub.0g.ai/faucet** — same broken UI
- `build.0g.ai` — Builder Hub, may have alternate faucet
- 0G Discord `#faucet` channel — bot command, alternate path
- Telegram bug-report channel — direct ask to 0G team works for hackathon participants

## Canonical TeeML Provider (testnet — for Phase 6a.1 pinning)

Per the bug-report doc, a confirmed working testnet TeeML provider is:

```
provider: 0xA02b95Aa6886b1116C4f334eDe00381511E31A09
network: Galileo (16602)
SDK: @0glabs/0g-serving-broker@0.7.5 (older — we use 2.0.0)
```

This is a candidate to pin as `ZG_BROKER_PROVIDER_ADDRESS` once the Day-1 smoke test confirms it's still live + has non-zero pricing.

## Confirmed SDK Failures on Galileo V3 (May 7 2026)

Two of three 0G SDKs we depend on are broken on the active testnet. Filed for 0G dev follow-up; track in TG.

### Storage — `@0glabs/0g-ts-sdk@0.3.3`

`Indexer.upload` → `Flow.submit(submission, {value: fee})` reverts with raw `require(false)` regardless of fee size (tested SDK-calculated fee 30 gwei AND explicit override 0.001 OG). Pre-checked: `Flow.market()` resolves, `Flow.paused()` returns false, submission struct well-formed. Cause likely: V3 added permission/pre-deposit/market-reward shape change not in SDK 0.3.3.

Workaround: gated behind `COMPASS_LIVE_STORAGE=1` env flag with a `compass-skipped://placeholder` URI scheme. Wire-up proven; flipping the flag once SDK is patched lights up live storage with no code changes.

### Compute — `@0glabs/0g-serving-broker@2.0.0`

`broker.ledger.addLedger("0.01")` reverts with `BAD_DATA: could not decode result data (value="0x", info={method: "getLedger", signature: "getLedger(address)"})`. The SDK calls `getLedger(address)` and the deployed contract returns empty bytes. Wallet had 5.088 OG balance, RPC reachable, chainId 16602 confirmed, all other broker setup steps OK.

Most likely cause: SDK 2.0.0 has stale ABI vs the V3 Galileo deployment, OR ledger contract address in SDK is wrong, OR the wallet has no ledger entry yet AND the SDK's "no-entry" code path is broken.

Phase 6 implementation depends on this SDK being fixed (or us using a direct-RPC path against the broker contracts). Real schedule risk; flag at Day-15 gate per `codex-tee-architecture-review.md`.

### Chain — ethers v6 + Hardhat (no SDK)

WORKING. Both AgentRegistry + CompassHub deployed to Galileo. Maria agents 1 & 2 minted. Events emit. Mint flow proven end-to-end on chain.

## Known SDK Bugs (banked for awareness)

### Bug #1 — Fine-tune binary path traversal (HIGH, doesn't affect us)

`@0glabs/0g-serving-broker@0.7.5` `fineTuning.acknowledgeModel` has an off-by-one path traversal in the bundled `0g-storage-client` binary spawn. Resolves to `node_modules/@0glabs/binary/0g-storage-client` (does not exist) instead of `node_modules/@0glabs/0g-serving-broker/binary/0g-storage-client`.

**Affects:** anyone calling `broker.fineTuning.acknowledgeModel(...)`.
**Doesn't affect us:** Compass uses `broker.inference.listService` + `broker.inference.processResponse` — not the fine-tuning surface.
**Resolution:** may be fixed in 2.0.0 (our installed version). Verify if we ever touch fine-tuning.

## Useful Links (ecosystem)

- Docs: https://docs.0g.ai/
- Build Portal: https://build.0g.ai/
- SDK list: https://build.0g.ai/sdks
- Showcase: https://build.0g.ai/showcase
- Compute Marketplace: https://compute-marketplace.0g.ai/
- StorageScan (Mainnet): https://storagescan.0g.ai/
- Explorer: https://explorer.0g.ai/
- ChainScan: https://chainscan.0g.ai/
- ChainScan Galileo: https://chainscan-galileo.0g.ai/

## Daily Q&A

Per Telegram pinned: 14:00–15:00 UTC+8 (Dragon hosts). Use this for Phase 6 TEE questions if Codex pre-review surfaces gaps.
