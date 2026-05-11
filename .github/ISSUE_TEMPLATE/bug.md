---
name: Bug report
about: Something is not working the way the docs / tests / live app say it should
title: 'bug: '
labels: bug
assignees: ''
---

## What happened

(One or two sentences. What did you observe?)

## What you expected

(One sentence. What should have happened?)

## How to reproduce

(Step-by-step. Include the exact commit SHA you tested against if
local, or the live frontend URL + browser if you observed it in
production. If a Hardhat / Playwright / vitest test reproduces it,
include that.)

```
1.
2.
3.
```

## Environment

- Compass commit: `<git rev-parse HEAD>`
- Node version: `node --version`
- Network: <Aristotle mainnet 16661 / Galileo testnet 16602 / local>
- Browser (if frontend): <Chrome 142 / Firefox 134 / Safari 18 / …>

## Additional context

(Screenshots, error console output, on-chain tx hashes that reverted,
relevant `/api/tee-status` snapshot. Trim secrets.)

---

For security vulnerabilities — **do not file here**. See
[`SECURITY.md`](../SECURITY.md).
