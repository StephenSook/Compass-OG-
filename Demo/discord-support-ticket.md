# 0G Discord support-ticket draft — A.5 mainnet funding (US-CEX gap)

Per Dolly bot (0G Discord, 2026-05-10): OTC is NOT endorsed (scam risk),
and the official path for mainnet OG acquisition is "open a support
ticket in Discord for guidance on acquiring tokens."

This file is the draft message for that ticket. Open via Discord →
Support → New Ticket (or whichever channel the bot directs you to).

## Subject line

A.5 mainnet funding — US builder, CEX gap

## Body

```
Hi 0G support — Compass for Track 5 (Privacy &
Sovereign Infrastructure), 0G APAC Hackathon
2026.

Quick context: I need ~0.5 OG on Aristotle
(chainId 16661) to deploy AgentRegistry +
CompassHub contracts before the June 5
submission deadline. Galileo flow already
shipped end-to-end:
- Repo: https://github.com/StephenSook/Compass-OG-
- Live demo: https://app-psi-pied.vercel.app
- Galileo AgentRegistry: 0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8
- Galileo CompassHub: 0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b
- TEE deploy: composeHash 0x1884...cea0,
  signer 0xaba6...a7e7

The US-CEX gap I'm hitting:

- Bitget — geo-blocks US
- MEXC — geo-blocks US
- Bybit — geo-blocks US
- Kraken — lists OGN (Origin Protocol), NOT
  0G. Confirmed by checking their asset list.
- Coinbase — currently not processing the
  payment methods for my account
- OTC discouraged per Dolly bot guidance
- Hackathon ecosystem credits — confirmed
  not a thing per Asad Khalid's reply on 5/8

So I've covered every CEX in the official 0G
recommendation list and none route to a US
builder. Could the team:

1. Confirm the bridge.0g.ai route works for
   funding (ETH on Ethereum mainnet → 0G
   Aristotle) so I can use a US-friendly ETH
   onramp like Cash App / Robinhood, OR
2. Point at a US-accessible CEX I'm missing,
   OR
3. Offer hackathon-specific guidance for the
   edge case where all your recommended
   exchanges geo-block the builder's
   jurisdiction.

Deployer wallet (Aristotle): 0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34
Submission deadline: June 5 2026.

Thank you — happy to share more context if
useful.

— Stephen Sookra
   stephensookra@gmail.com
```

## Status

- [ ] Submitted: ____
- [ ] Acknowledged: ____
- [ ] Resolved: ____

## If support route stalls

Fall back to: Cash App / Robinhood → ETH on Ethereum mainnet → bridge
via bridge.0g.ai → Aristotle. Path 2 in
`docs/notes/0g-mainnet-funding-options.md`. Test with $5 first.
