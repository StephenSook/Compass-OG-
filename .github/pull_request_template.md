# Pull request

## What this PR does

(One or two sentences. Why is this change needed? What problem does it
solve?)

## Why this approach over the alternatives

(One paragraph. What other paths did you consider? Why does this one
win?)

## Honest limits

(What this PR does *not* solve. If you remove or weaken any guarantee
documented in `docs/honest-limits.md`, call that out here.)

## Verification

- [ ] `cd contracts && npx hardhat test` — passing
- [ ] `cd contracts && slither . --filter-paths "node_modules"` — 0 sec
- [ ] `cd app && npm run build` — passing
- [ ] `cd enclave && npm test` — passing
- [ ] Playwright suite — passing or N/A (e.g. for contracts-only PRs)
- [ ] If this PR changes a documented row in the `/about` reality
  table, the row state and note are updated to match.
- [ ] If this PR changes a privacy property, `docs/threat-model.md`
  and / or `docs/honest-limits.md` are updated.

## Linked issues / context

Closes #
Related: docs/architecture.md, docs/threat-model.md

---

For security-sensitive changes, also coordinate via the channels in
[`SECURITY.md`](../SECURITY.md) before opening the PR.
