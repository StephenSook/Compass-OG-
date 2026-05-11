# Architecture Decision Records

Each ADR captures one architectural decision that was hard to reverse, had non-obvious tradeoffs, and would be questioned later. Format follows [MADR](https://adr.github.io/madr/) lightly. ADRs are immutable once Accepted — if a decision changes, a new ADR supersedes the old one.

| # | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./ADR-0001-0g-chain-phala-tdx-platform.md) | 0G Chain (Aristotle) + Phala dstack TDX as the privacy platform | Accepted | 2026-05-11 |
| [ADR-0002](./ADR-0002-sd-jwt-vc-over-zk.md) | SD-JWT VC for selective disclosure over PCD or zkSNARK Groth16 | Accepted | 2026-05-11 |
| [ADR-0003](./ADR-0003-per-receipt-quote-binding.md) | Per-receipt RA quote with `report_data` binding over boot-quote binding | Accepted | 2026-05-11 |

## When to write an ADR

Add a new file `ADR-NNNN-short-slug.md` when:

- The decision affects component boundaries, data flow, or protocol semantics.
- The decision is hard to reverse (chain choice, credential format, enclave platform).
- The decision has at least two viable alternatives the team considered and rejected.
- A future maintainer will ask "why did we do it this way?"

Do **not** write an ADR for:

- Library version bumps, lint rules, formatting — these belong in the commit message.
- Decisions with one obvious answer ("use HTTPS").
- Implementation details — ADRs are for *why*, not *how*.

## Template

See [`references/adr-template.md`](../../.claude/skills/adr-writer/references/adr-template.md) in the [`adr-writer`](https://github.com/anthropics/claude-code) skill, or copy any of the three ADRs above as a starting point.

## Supersession

When a new ADR replaces an old one:

1. Set the new ADR's `Supersedes:` field to the old ADR number.
2. Set the old ADR's `Status:` to `Superseded by ADR-NNNN`.
3. Do **not** edit the old ADR's body. The historical record is the point.
