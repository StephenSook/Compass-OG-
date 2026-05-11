# 0G Aristotle Mainnet Funding Options (A.5 unblock paths)

A.5 needs ~0.1–0.2 OG on Aristotle mainnet for the AgentRegistry +
CompassHub deploys plus a buffer for receipt-issuing demo txs. At current
OG price that's **roughly $0.10–$0.40 of native gas**. Tiny absolute amount;
the block is the on/off-ramp, not the cost.

Coinbase has been stalling on this account (payment methods not saving,
holds on bank transfer). Below are alternate paths in order of preference.

---

## Path 1 — 0G hackathon ecosystem credits — **NOT A THING for mainnet**

**Confirmed by 0G Labs (Asad Khalid, Discord 2026-05-08):** there are no
hackathon ecosystem credits for Aristotle mainnet. Mainnet is
CEX-buy-and-withdraw OR bridge from USDT. Full reply quoted in the
project memory at `project_og_funding_replies.md`.

> Buy 0G on a CEX and withdraw to chain 16661 or Bridge assets into
> Aristotle directly.

The hackathon-team-funded faucet that exists is **testnet only** at
https://faucet.0g.ai (Galileo). There's a hackathon promo code
`0G-APAC-HACKATHON` (10 OG testnet, valid until May 16 23:59 GMT+8,
1-per-wallet, 300-wallet FCFS cap) — useful for additional Galileo demos
but not for A.5 mainnet.

**Move to Path 2-4 below for mainnet funding.**

---

## Path 2 — Bridge L1 ETH (CHEAPEST CASH, ~30 MIN)

If you have ETH on Ethereum mainnet, bridge ~$5 to 0G mainnet.

**Steps:**
1. Open https://bridge.0g.ai/ in your browser.
2. Connect your Ethereum L1 wallet (MetaMask / Rabby / wallet of choice).
3. Source: Ethereum, Destination: 0G Mainnet (Aristotle, chainId 16661).
4. Bridge ~0.002 ETH (~$5) to give you headroom.
5. Wait ~10–15 minutes for the bridge confirmation. Check
   https://chainscan.0g.ai for the deposit landing on `0x05b5Bb550eb84…`.

**Cost breakdown:**
- L1 gas to initiate bridge: ~$1–3 depending on Ethereum gas price
- Bridge fee: typically 0
- Net: ~$5 funded with $4–7 spent

**Why second:** cheapest if you already hold L1 ETH; no fiat onramp friction.

---

## Path 3 — Direct fiat onramp (different processor than Coinbase)

Three onramp providers route through different banking stacks than
Coinbase. If Coinbase blocks your card/bank, one of these usually clears.

### MoonPay (https://moonpay.com)
- **Buy:** ETH or USDC, sent directly to your wallet address
- **Cost:** ~3.5% + $4.99 fixed fee for card; ~1% for bank transfer
- **KYC:** ID + selfie (5 min)
- **Speed:** card = instant; bank = 1–3 business days
- **Steps:**
  1. https://buy.moonpay.com (or in your wallet's "Buy" button if it integrates MoonPay)
  2. Pick ETH on Ethereum L1 (then bridge per Path 2) or USDC on Ethereum L1
  3. Recipient: `0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34`
  4. Pay with Visa/Mastercard or bank transfer
  5. ETH lands in deployer wallet directly

### Ramp Network (https://ramp.network)
- **Buy:** ETH, USDC, USDT (chain selectable)
- **Cost:** ~2.9% card; ~0.49% bank transfer (Open Banking in EU/UK)
- **KYC:** simpler than MoonPay for small amounts (<$200 often passes basic check)
- **Speed:** card = instant; Open Banking = 5–10 min
- **Steps:**
  1. https://app.ramp.network
  2. Quote ETH or USDC, recipient = deployer wallet
  3. KYC + pay
  4. Funds land directly on the chain you picked

### Transak (https://transak.com)
- **Buy:** ETH, USDC, OG (worth checking — Transak sometimes has direct
  0G chain support, eliminating the bridge step)
- **Cost:** ~3.5% card; lower for bank
- **KYC:** typical
- **Speed:** card = instant
- **Steps:**
  1. https://global.transak.com
  2. Search "0G" in the asset picker — if it shows up, buy direct, skip
     the bridge entirely
  3. Otherwise buy ETH on L1 + bridge (Path 2)

**Recommendation order:** Ramp first (cheapest fees + best Open Banking),
MoonPay second, Transak third (only worth it if they support direct OG).

---

## Path 4 — Alternate exchanges (0G's official recommendation list)

Per 0G Labs' Discord reply, the recommended CEXes that list 0G (OG)
spot and support withdrawals to Aristotle chain 16661 are:

### Bitget (https://www.bitget.com) — FIRST on 0G's list
- Different KYC + payment stack than Coinbase. Often clears when CB holds.
- Buy 0G spot directly (no bridge needed). Withdraw to deployer wallet
  on chain 16661.
- US-availability: limited; check the front-page country selector.

### MEXC (https://www.mexc.com) — SECOND on 0G's list
- Another non-CB processor. Spot listing for 0G confirmed by 0G team.
- KYC fairly relaxed for small amounts.

### Bybit (https://www.bybit.com) — THIRD on 0G's list
- Direct 0G spot listing per 0G team. Withdraw to chain 16661.
- KYC clears 1–2 business days for small accounts.

### Kraken (https://kraken.com) — FOURTH on 0G's list
- US-friendly. Different KYC + bank-link than Coinbase.
- Buy 0G spot, withdraw to deployer wallet on chain 16661.

**Recommendation order:** Bitget first (cited first by 0G team, different
processor than Coinbase). If Bitget unavailable in your jurisdiction:
MEXC → Bybit → Kraken. Coinbase is conspicuously absent from 0G's list
— don't fight that channel.

---

## Cost-benefit check — defer until Day 24

A.5 isn't urgent today (May 10). The original plan put mainnet at Day 25
(May 30). 20 days of buffer means no need to rush funding.

**Updated sequencing (post 0G-Labs reply):**
1. Sign up for **Bitget** today (KYC takes 0-24h). Different processor
   than Coinbase, listed first by the 0G team.
2. If Bitget jurisdiction-blocked: try **MEXC** or **Bybit**.
3. In parallel: bridge ~$5 from L1 ETH via `bridge.0g.ai` (Path 2) as a
   cheap backstop if no CEX clears.
4. Cap mainnet deploy at Day 24 to leave 7+ days of demo + recording buffer.
5. Stop Phala TEE after demo + 48hr submission buffer (~Day 30).

**Why no rush:** Galileo testnet demo flow already covers everything except
the network label. Mainnet is a one-click chain switch once funded; there's
no point holding contracts on mainnet during build phase paying nothing
for storage but exposing addresses to indexers prematurely.
