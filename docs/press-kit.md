# Compass — Press Kit

For journalists, podcasters, hackathon judges, and anyone writing
about Compass. Permission granted to reuse anything in this file with
attribution to "Compass — built solo by Stephen Sookra for the 0G APAC
Hackathon".

## One-liner (8 words)

A private eligibility firewall for vulnerable workers.

## Three-line description

Compass lets a vulnerable migrant worker prove she qualifies for a
free service — legal help, shelter, hospital care — without disclosing
her name, HKID, employer, or any document field. The service learns
only a bucketed 15-minute timestamp and a cryptographic commitment.
Built end-to-end on 0G: Chain (atomic single-use grants), Storage
(encrypted vault), and TeeML / Phala dstack TDX (sealed
attestation).

## Long description (200 words)

Hong Kong is home to 368,000 Foreign Domestic Helpers — 9.6 % of the
local workforce (HK LegCo Research Office, 2025). 17 % are in forced
labour and 60 % are deterred from filing Labour Tribunal claims by
deportation fear (Justice Centre HK 2016; Mission for Migrant
Workers 2023). Across APAC the migrant-worker population is 27.2
million (ILO, 2024). The legal and humanitarian services that exist
to help them require disclosure of identifying data: name, HKID,
employer, visa status. Those disclosures are exactly the levers that
abusive employers and traffickers use to find, retaliate against, and
silence the workers seeking help. The status quo asks workers to
choose between getting help and being safe.

Compass eliminates the disclosure. It is a privacy-preserving
eligibility firewall: a vulnerable worker carries an SD-JWT
verifiable credential encrypted in her browser vault (AES-256-GCM with
a non-extractable key in IndexedDB); a sealed-inference receipt-signer
running inside a Phala dstack TDX trusted execution environment
evaluates an eligibility policy against selectively-disclosed claims;
the result is committed to 0G Chain as a `ReceiptIssued` event whose
fields are non-identifying — only a 15-minute timestamp bucket, a
policy ID, a nullifier, and a cryptographic commitment to the
agent's on-chain identity. A subpoena reaches the bucketed timestamp
and the commitment. Nothing else exists to be disclosed.

## What's built

- 0G Aristotle mainnet (chainId 16661): AgentRegistry + CompassHub
  contracts, three policies registered.
- 0G Galileo testnet (chainId 16602): parallel demo path for judging.
- Phala dstack TDX receipt-signer with per-receipt RA quote binding
  `(signer, image, receiptId)`.
- AES-256-GCM browser vault using non-extractable WebCrypto keys.
- SD-JWT VC issuance + verification end-to-end.
- 5-language kiosk mode (English, Filipino, Bahasa Indonesia, Bahasa
  Malaysia, Cantonese).
- 3D audit-log visualization at `/audit-graph.html`.

## Business Impact

**TAM** — 368,000 FDHs in Hong Kong (LegCo 2025) · 27.2 million
migrant workers across APAC (ILO 2024) · US$1.087 billion in
personal remittances out of Hong Kong annually (World Bank 2024).

**Cost per incident** when an FDH is deported because identity
disclosure at intake was subpoena-reachable:

- Worker side: ≈ **US$22,200** lost (HK$152K remaining contract
  wages + HK$21K outstanding recruitment debt; HK Labour Dept MAW
  Sept 2025 + Amnesty 2013).
- HK government side: ≈ **US$14,100** lost (≈ HK$71,500 LAD civil
  application + HK$40–60K deportation processing; LAD FY2024/25
  statistics + HK Budget Head 70).

**Sustainability** — open-source. Free for migrant-worker NGOs.
AGPL core + commercial dual-license for non-NGO deployments. Phala
dstack TDX hosting ≈ US$15/year per receipt-signer instance.
12-month grant ladder: Phala Builders Program ($10–50K) → 0G
ecosystem ($10–100K) → EF PSE + Mozilla Technology Fund
($30–250K) → Open Society Migration Initiative + Luminate + HK
Jockey Club Special Projects ($150K–1M+). Target by month 18:
≈ US$60K/year recurring (managed hosting + dual-license).

Full sources in [`docs/whitepaper.md` → §Business Impact](./whitepaper.md#business-impact).

## Founder quote

> "The thing that wouldn't let me sleep was the asymmetry. A woman
> escaping wage theft has to hand her HKID to the same legal-aid intake
> that an employer's lawyer can later subpoena. The technology to
> eliminate that asymmetry already exists in scattered pieces — SD-JWT
> selective disclosure, sealed inference, on-chain commitments. Compass
> just wires them together in the order that matters."
>
> — Stephen Sookra, builder

## Honest limits

We are explicit about what Compass does *not* do. The full list lives
at [`docs/honest-limits.md`](./honest-limits.md). Headline items:

- Compass does not defeat coercion. An abusive employer who can see
  the worker's screen at the moment of disclosure can still read the
  plaintext SD-JWT VC before encryption.
- 15-minute timestamp buckets are not full k-anonymity. With enough
  side-information, statistical re-identification of edge-case
  workers may be possible. We default to coarse buckets and document
  the trade-off.
- SD-JWT VC standardization is still draft. The current implementation
  pins to `draft-ietf-oauth-sd-jwt-vc-15`; we will roll forward as
  the standard lands.

## How to cite

```bibtex
@misc{compass2026,
  title  = {Compass: A Private Eligibility Firewall on 0G},
  author = {Sookra, Stephen},
  year   = {2026},
  url    = {https://github.com/StephenSook/Compass-OG-},
  note   = {0G APAC Hackathon Track 5 (Privacy \& Sovereign Infrastructure)}
}
```

## Logos and screenshots

| Asset | Path | Use |
|---|---|---|
| Compass favicon | `app/src/app/favicon.ico` | favicons, social cards |
| Architecture diagram | `app/src/components/about/ArchitectureDiagram.tsx` (rendered on `/about`) | technical articles |
| Subpoena scene screenshot | live at `https://app-psi-pied.vercel.app/clinic/subpoena` | "what subpoena reveals" graphic |
| 3D audit view | live at `https://app-psi-pied.vercel.app/audit-graph.html` | visualization in coverage |
| Whitepaper PDF | `docs/whitepaper.pdf` | embedded reference |

We do not have a dedicated wordmark or brand color yet — please use
plain "Compass" in the body type of your publication. If you need a
visual asset and the above does not suit, email
`stephensookra@gmail.com`.

## Contact

- Email: `stephensookra@gmail.com`
- Telegram: `@stephensookra`
- GitHub: `https://github.com/StephenSook/Compass-OG-`
- Live frontend: `https://app-psi-pied.vercel.app`
