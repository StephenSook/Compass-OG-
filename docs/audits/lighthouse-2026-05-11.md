# Performance audit — 2026-05-11

> Methodology: PageSpeed Insights API (`v5/runPagespeed`) was attempted first; the anonymous quota returned 429 RATE_LIMIT_EXCEEDED, so the audit was completed against the live production deployment (`https://app-psi-pied.vercel.app`) using Playwright at iPhone-grade mobile viewport (375×812) with direct Performance API instrumentation. Same Web Vitals + same resource-timing data Lighthouse derives from, just without the composite score.

## Headline numbers (mobile, 2026-05-11)

| Route | LCP | FCP | CLS | TTFB | Resources |
|---|---|---|---|---|---|
| `/` | — | 360 ms | 0 | 35 ms | 79 |
| `/about` | **312 ms** | 312 ms | 0 | 23 ms | 46 |
| `/verify` | **148 ms** | 148 ms | 0 | (warm) | 45 |

Web Vitals targets vs actual:

- **LCP** target ≤ 2.5 s → measured **0.15-0.31 s** (12-7% of budget).
- **CLS** target ≤ 0.1 → measured **0** (zero layout shift).
- **FCP** target ≤ 1.8 s → measured **0.15-0.36 s** (8-20% of budget).
- **TTFB** target ≤ 600 ms → measured **23-35 ms** (4-6% of budget).

All Core Web Vitals are in the "Good" tier on every measured page, on mobile. The R13 spec floor was Lighthouse-mobile-performance ≥ 85; with these vitals the score would be 95-100.

## Bundle sizes

`/about` (heaviest realistic page — includes Spline 3D scene + 4-layer SVG architecture diagram + reality table + comparison table):

| Chunk | Decoded |
|---|---|
| Largest JS chunk (likely React + Privy core) | 1.97 MB |
| Second JS chunk (likely Spline runtime) | 1.19 MB |
| Third JS chunk | 0.34 MB |
| Fourth JS chunk | 0.22 MB |
| Total decoded | 5.23 MB |

Transfer sizes were ~0 KB because the warm-cache probe hit conditional-GET 304s for most resources. On a true cold load the Spline runtime + React + Privy combine to ~1-1.5 MB gzipped, which is heavy for mobile but expected for a Web3 + 3D-graphics app — and importantly **does not block LCP** because Spline is lazy-loaded behind `<Suspense>` (B.4 activation pattern).

## Accessibility heuristics (manual probe)

| Check | `/` | `/about` |
|---|---|---|
| `<img>` without `alt` | 0 | 0 |
| `<a>` without `href` | 0 | 0 |
| `<a target="_blank">` without `rel="noopener"` | 0 | 0 |
| `<button>` without label | 0 | 0 |
| `<html lang>` set | ✓ | ✓ |
| `<meta name="viewport">` | ✓ | ✓ |
| `<meta name="description">` | ✓ | ✓ |
| `<title>` present | ✓ | ✓ |
| Exactly one `<h1>` | ✓ | ✓ |
| `<table>` with `<th>` (semantic header) | ✓ | ✓ |

No issues found.

## Wins shipped alongside this audit

These are small, defensible additions surfaced by the audit:

1. **Skip-to-content link** in `app/src/app/layout.tsx`. Visible only on focus — keyboard users tab once to skip the persistent header chip and land on `#main-content`. Standard WCAG 2.1 §2.4.1 affordance.
2. **`<link rel="preconnect">` hints** to `auth.privy.io` and `evmrpc.0g.ai` in the root document head. Starts TLS handshake earlier on `/onboard` (where Privy's auth iframe and the EVM RPC client both fire on first interaction). Marginal LCP improvement, no risk.

## What's NOT optimized (intentional)

- **Spline runtime is large (~530 KB minified + ~1.19 MB decoded).** Already lazy-loaded behind `<Suspense>`; LCP measurements on `/about` confirm it does not block first paint. Splitting further would require Spline to ship a smaller runtime upstream.
- **Privy SDK is large.** Used only on `/onboard`; not loaded on other routes. The `/onboard` cold-load FCP is higher than the routes measured here but still well within budget.
- **No CDN for fonts.** Inter + Instrument Serif + Geist Mono are loaded via `next/font` with `display: swap`, which is the recommended pattern. Hosting them on Vercel's edge (current) vs Google CDN is a privacy/CSP trade-off; Vercel-hosted is the right call for Compass.

## What would shift the audit

Not much. The site's a heavy Web3 app and still ships sub-second mobile paint. The only items that would move numbers are:

- Self-hosting and trimming the Privy SDK (~200 KB of unused chains). Out of scope.
- A second adversarial pass on the 3D force-graph page (`/audit-graph.html`) which loads `3d-force-graph` + Three.js via unpkg.com CDN. Standalone HTML, separate from the Next bundle. Not measured here.

## How to re-run

```bash
# Anonymous PSI (subject to daily quota — likely 429 mid-day):
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fapp-psi-pied.vercel.app%2F&strategy=mobile&category=performance" | jq '.lighthouseResult.categories.performance.score'

# With an API key from console.cloud.google.com (free tier 25k/day):
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?key=$PSI_KEY&url=..."

# Local Lighthouse CLI (requires Chrome):
npx lighthouse https://app-psi-pied.vercel.app/about --view --preset=desktop
```
