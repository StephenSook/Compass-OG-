# Contributing to Compass

Thanks for your interest. Compass is a hackathon-stage project today,
which means the codebase is small (~250 LoC of Solidity, ~5k LoC of
TypeScript) and the maintainer (Stephen Sookra) is the only committer.
That said, contributions are welcome — please read the rest of this
file before opening an issue or a PR.

## Quick orientation

- **Architecture**: `docs/architecture.md` is the canonical map.
  `docs/whitepaper.md` is the narrative version.
- **Threat model**: `docs/threat-model.md`.
- **What's real vs mocked**: `/about` page on the live frontend, also
  `app/src/app/about/page.tsx`.
- **Limits we're honest about**: `docs/honest-limits.md`.

## Local setup

```bash
# Contracts
cd contracts && npm ci --legacy-peer-deps
npx hardhat compile
npx hardhat test
slither . --filter-paths "node_modules"   # requires slither-analyzer

# App
cd ../app && npm ci --legacy-peer-deps
npm run dev                                # localhost:3000
npm run build                              # production build

# Enclave (off-chain verifier + receipt-signer logic)
cd ../enclave && npm ci --legacy-peer-deps
npm run test
npx tsc --noEmit                           # type-check only
```

## Issue and PR conventions

- **Issues**: please use one of the templates under
  `.github/ISSUE_TEMPLATE/`. If a security issue, see
  [`SECURITY.md`](./SECURITY.md) instead — do not open a public issue.
- **Branch naming**: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`,
  `chore/<scope>`. Match the commit prefix.
- **Commit messages**: conventional — `feat(scope): subject`,
  `fix(scope): subject`. Bodies should answer *why*, not *what* — the
  diff already shows what changed.
- **PR template**: under `.github/pull_request_template.md`.

## Code conventions

- TypeScript strict mode; no `any` without a comment explaining the
  boundary it crosses.
- Solidity: pinned 0.8.24, viaIR, optimizer 200 runs, Cancun EVM.
- No emoji in source files unless requested.
- Comments only when *why* is non-obvious. Never write a comment that
  restates what the code does — the reader can already see that.
- File names match the project pattern: `kebab-case.md` for docs,
  `PascalCase.tsx` for React components, `camelCase.ts` for utility
  modules.

## Testing expectations

For any new contract-state-mutating function, add:

1. A unit test in `contracts/test/<Contract>.<scenario>.t.ts` covering
   the happy path.
2. At least one property-based invariant in
   `contracts/test/invariants.t.ts` if the function affects a global
   invariant (nullifier set, receipt-id set, owner binding, etc.).

For any new app route, add a Playwright test in
`app/playwright/<route>.spec.ts` exercising the happy path.

For any new enclave behaviour, extend the vitest suite under
`enclave/src/__tests__/`.

## Tone

We're solving a humanitarian problem (anti-trafficking, migrant-worker
protection) with cryptographic plumbing. The codebase reflects that:
honest about limits, conservative about claims, careful about who can
be harmed if we get it wrong. Please write code and prose with that
posture in mind.

## License

By contributing, you agree your contribution will be released under
the same license as the rest of the project. See
[`LICENSE`](./LICENSE).
