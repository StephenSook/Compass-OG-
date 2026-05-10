# 0G Aristotle Mainnet Funding Options (A.5 unblock paths)

A.5 needs ~0.1–0.2 OG on Aristotle mainnet for the AgentRegistry +
CompassHub deploys plus a buffer for receipt-issuing demo txs. At current
OG price that's **roughly $0.10–$0.40 of native gas**. Tiny absolute amount;
the block is the on/off-ramp, not the cost.

Coinbase has been stalling on this account (payment methods not saving,
holds on bank transfer). Below are alternate paths in order of preference.

---

## Path 1 — 0G hackathon ecosystem credits (FREE, RECOMMENDED FIRST)

The 0G APAC hackathon supports active builders with mainnet credits to
unblock production deploys. Lead-time: same-day to 3 days.

**Steps:**
1. Open https://hackquest.io and find the 0G APAC Hackathon submission
   portal. Look for an "Ecosystem Credits" / "Mainnet Grants" form.
2. Alternative: ping the 0G Discord (`#builders` channel — see project memory
   for invite). Mention: "Submitting Compass for Track 5; need ~0.2 OG on
   Aristotle for AgentRegistry + CompassHub deploy. Galileo testnet flow
   already shipped at github.com/StephenSook/Compass-OG-." Keep it short.
3. Provide deployer wallet address: `0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34`
4. They wire OG directly to that address.

**Why this first:** free, designed for this case, hackathon team is the
gate-keeper that wants you to ship anyway.

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

## Path 4 — Alternate exchanges (different KYC stack than Coinbase)

If you'd rather use an exchange-style flow:

### Kraken (https://kraken.com)
- US-friendly, different KYC + bank-link than Coinbase. Smaller-amount
  card buys often clear when Coinbase bounces.
- Buy ETH or USDC, withdraw to deployer wallet, then bridge per Path 2.
- KYC verification typically same-day for individual accounts.

### Binance (https://binance.com — non-US users) / Binance.US (https://binance.us)
- Largest exchange globally. Strong fiat-on-ramp for non-US.
- US users: Binance.US; smaller asset list but USDC available.
- Same flow: buy → withdraw to deployer → bridge.

### Bybit (https://bybit.com)
- Often has direct OG listing on their spot market — eliminates the bridge.
  Verify at https://www.bybit.com/en/trade/spot before assuming.
- KYC clears in 1–2 business days for small accounts.

**Recommendation order:** Bybit first if they list OG directly (one less
hop). Kraken if you're US-based and want a regulated alternative.

---

## Cost-benefit check — defer until Day 24

A.5 isn't urgent today (May 10). The original plan put mainnet at Day 25
(May 30). 20 days of buffer means there's no need to rush funding.

**Better sequencing:**
1. Apply for 0G ecosystem credits TODAY (lead-time 1–3 days, free)
2. If credits granted by Day 20: deploy A.5 immediately
3. If credits don't land by Day 22: pivot to Path 2 (L1 bridge) or Path 3
   (Ramp onramp)
4. Cap mainnet deploy at Day 24 to leave 7+ days of demo + recording buffer
5. Stop Phala TEE after demo + 48hr submission buffer (~Day 30)

**Why no rush:** Galileo testnet demo flow already covers everything except
the network label. Mainnet is a one-click chain switch once funded; there's
no point holding contracts on mainnet during build phase paying nothing
for storage but exposing addresses to indexers prematurely.
