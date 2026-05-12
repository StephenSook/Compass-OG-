# Security policy

Compass is a privacy-preserving eligibility firewall handling sensitive
data flows: SD-JWT VCs, on-chain commitments, TEE attestation digests,
and EIP-712 grants signed by user wallets. Vulnerabilities in any of
these layers can leak the exact identity information the project is
designed to protect. We take responsible disclosure seriously.

## Reporting a vulnerability

**Do not file a public issue for security vulnerabilities.** Instead:

- Email: `stephensookra@gmail.com` (use subject `[Compass Security]`)
- Telegram: `@stephensookra`
- For sensitive findings, encrypt to the maintainer key at
  `https://github.com/StephenSook.gpg` if available.

Expected response time:

| Severity                         | Acknowledgment | Triage window |
|----------------------------------|----------------|---------------|
| Critical (key exfil, signer forge, plaintext leak) | < 24h | < 72h |
| High (replay, nullifier bypass, RA-quote spoof)   | < 48h | < 1w  |
| Medium (info disclosure, DoS)                     | < 1w  | < 2w  |
| Low (typos, doc issues, low-impact UX)            | < 2w  | best-effort |

Please include:

- A reproducible test case or PoC (preferred: a Hardhat test, Playwright
  script, or Node CLI invocation against `enclave/`).
- The commit SHA you tested against.
- A suggested CVSS-style severity if you have one.
- Whether you intend to publish; if so, your preferred timeline.

## Scope

In-scope for disclosure:

- **Contracts**: `contracts/AgentRegistry.sol`, `contracts/CompassHub.sol`,
  `contracts/IAgentRegistry.sol` and any auxiliary contract under
  `contracts/`.
- **Receipt-signer enclave**: `enclave/src/**` including the dstack TDX
  attestation path and the verifier CLI.
- **App**: `app/src/app/api/**` (server routes), `app/src/lib/**`
  (cryptographic primitives, vault, contracts client, fixtures).
- **Build / deploy**: hardhat config, Vercel build pipeline, GitHub
  Actions workflows, Phala Cloud CVM config.

Out of scope:

- Third-party services (Privy, Phala Cloud, Vercel, 0G Galileo/Aristotle
  RPC nodes) — report directly to those vendors.
- Dependencies — see `docs/audits/dependency-audit-2026-05-10.md` for
  the current state; advisories on `npm audit` output that have no
  exploitable surface in Compass are tracked, not patched, until
  remediated upstream.
- Issues requiring physical access to the maintainer's machine.

## Hall of Fame

We will publicly credit the first reporter of any confirmed in-scope
vulnerability (with consent) in `docs/audits/security-disclosures.md`
once the fix lands.

## What we already do

- Slither 0.11.5 with 101 detectors on every contract commit (CI gate
  pending; today it's run pre-PR). Latest report:
  `docs/audits/slither-2026-05-10.md`.
- Property-based invariant tests on `CompassHub` covering nullifier
  replay, receipt-id replay, signer binding, expiry, and provider
  binding. See `contracts/test/invariants.t.ts`.
- Codex GPT-5.5 adversarial pre-submission review caught 1 BLOCKER
  (agentIdCommitment encoding mismatch) before mainnet deploy. Findings
  + remediation tracked in `CHANGELOG.md` (v0.5 "Fixed") and
  `docs/honest-limits.md`.
- Per-receipt TDX RA quote binds `(signer, image, receiptId)` to defeat
  archived-quote replay across deployments. Quote-commitment derivation
  lives in `enclave/src/receipt.ts` (`quoteCommitmentFromQuoteHex`);
  verifier-side trust chain in `enclave/src/verify-attestation.ts`.
- AES-256-GCM browser vault keys are non-extractable WebCrypto handles
  in IndexedDB; plaintext never enters `localStorage`. See
  `app/src/lib/crypto/vault.ts`.
- HSTS preload set on the production frontend (Vercel); CSP and
  related security headers wired via `app/next.config.ts`.

## Coordinated disclosure

If your finding affects multiple projects in the 0G ecosystem (e.g., a
dstack TDX issue or a 0G Chain RPC bug), please CC the 0G security team
at `security@0g.ai` so we can coordinate the fix window.
