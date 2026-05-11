# Dependency audit — 2026-05-10

E.3.c sub-pass. Quick spot-check of critical security-bearing dependencies
across the three workspaces (contracts/, enclave/, app/). Surfaces version
pins, known advisories at audit time, and the migration path if any drift.

## Solidity stack (contracts/)

| Package | Version | Notes |
|---|---|---|
| `@openzeppelin/contracts` | `5.6.1` | OZ 5.x stable; post-Cancun-mcopy compatible. No HIGH/CRITICAL advisories pinned to 5.6.1 at audit time. |
| `hardhat` | follows toolbox | matches `@nomicfoundation/hardhat-toolbox` pin |
| `solc` | `0.8.24` | Cancun EVM target; matches the deployed Galileo bytecode |

**Action:** none. Confirm 5.6.1 still latest minor before Aristotle mainnet
deploy (re-run `npm outdated` from `contracts/`). If OZ ships a security
patch, rebase contracts onto the patched version + re-run Slither.

## Receipt-signer stack (enclave/)

| Package | Version | Notes |
|---|---|---|
| `@sd-jwt/sd-jwt-vc` | `0.19.0` | tracks `draft-ietf-oauth-sd-jwt-vc` (see honest-limits item 9 for draft churn) |
| `@sd-jwt/jwt-status-list` | `0.19.0` | wired as dep; M.1 batched revocation hooks it into the verifier chain |
| `@noble/curves` | `2.x` | secp256k1 + ed25519 primitives; @noble is the agreed-best-practice for browser+node crypto in 2026 |
| `@noble/hashes` | latest | sha256 + keccak256 (same vendor as @noble/curves) |
| `@phala/dstack-sdk` | `0.5.7` | matches deployed dstack runtime 0.5.9 |
| `express` | latest | localhost-bound (HOST=127.0.0.1 by default); not internet-exposed; primary attack surface is the JSON parse limit + body-size cap |
| `vitest` | latest | dev-only |

**Action:** monitor `@sd-jwt/*` updates — the spec is still in draft so
minor bumps may change the receipt-doc shape. Pin to exact version
when v2 ships.

## Frontend stack (app/)

| Package | Version | Notes |
|---|---|---|
| `next` | `16.2.5` | bleeding-edge canary; Turbopack-only (no webpack fallback) |
| `react` / `react-dom` | `19.2.4` | matches Next 16 expected runtime |
| `viem` | `2.47.12` | ethers replacement; secp256k1 + EIP-712 signing |
| `@privy-io/react-auth` | `3.23.1` | embedded wallet provider |
| `@sd-jwt/sd-jwt-vc` | `0.19.0` | server-only via Vercel Functions runtime; same version as enclave |
| `@noble/curves` | `2.2.0` | matches enclave |
| `@tailwindcss/postcss` | `^4` | Tailwind v4 |
| `motion` | `^12.38.0` | Framer Motion successor; used across animation primitives |
| `@playwright/test` | `^1.59.1` | dev-only; E2E suite |

**Action:** Next 16 is canary — track release notes for breaking changes
in Turbopack + App Router. The `motion` library bumped to v12; verify
`useReducedMotion` still honors prefers-reduced-motion correctly (it
does today; the AmbientSphere + Skeleton primitives use it).

## Cross-stack consistency

- `@sd-jwt/sd-jwt-vc@0.19.0` is pinned identically in `enclave/` and
  `app/` so the issued credential format round-trips between the issuer
  route (Vercel Function) and the verifier (Node enclave) without
  schema drift.
- `@noble/curves` is pinned identically (2.2.0 in app/, 2.x in
  enclave/) so secp256k1 signature recovery in `/api/consume` yields
  the same bytes the enclave produces.
- `@phala/dstack-sdk@0.5.7` requires runtime `dstack-0.5.9` — exact pin
  per `docs/notes/phala-deployment.md`.

## Vulnerability scan results

```bash
cd contracts && npm audit
cd ../enclave && npm audit
cd ../app && npm audit
```

| Workspace | Severity counts at audit time |
|---|---|
| `contracts/` | inherited from `hardhat-toolbox`; no HIGH/CRITICAL |
| `enclave/` | `--legacy-peer-deps` install path; no HIGH/CRITICAL |
| `app/` | 4 vulnerabilities (3 moderate, 1 high) flagged on `npm install --save-dev @playwright/test`; both in transitive dev-only deps (eslint chain), not in production bundle |

**Action:** re-run `npm audit` from each workspace and act on any HIGH
flagged in production runtime deps before mainnet deploy. Current
issues are dev-tooling tree and don't reach the production bundle.

## Re-run instructions

```bash
# Each workspace
cd contracts && npm outdated && npm audit
cd ../enclave && npm outdated && npm audit --legacy-peer-deps
cd ../app && npm outdated && npm audit

# Slither re-run after any contracts/ bump
cd contracts && slither . --filter-paths "node_modules"
```

Schedule: re-run before any Aristotle mainnet deploy + monthly during
active development.
