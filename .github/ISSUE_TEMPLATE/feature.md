---
name: Feature request
about: Suggest a new capability for Compass
title: 'feat: '
labels: enhancement
assignees: ''
---

## The problem you are trying to solve

(One paragraph. Who is affected? What do they do today, and where does
that fall short?)

## The change you are proposing

(Concrete. What would land in the codebase if this issue were closed?)

## Alternatives you considered

(One or two sentences each. What other approaches did you weigh, and
why is this proposal preferable?)

## Honest limits

(What this proposal does *not* solve. Compass is explicit about its
limits per [`docs/honest-limits.md`](../../docs/honest-limits.md); please
extend that posture here.)

## Compass scope check

Tick all that apply:

- [ ] This change concerns one of the populations Compass is designed
  to serve (migrant workers, NGO clients, intake clinicians).
- [ ] This change has a clear cryptographic correctness story — I can
  describe how the threat model changes if it lands.
- [ ] This change does not regress the privacy properties enumerated
  in `docs/architecture.md` and `docs/threat-model.md`.
- [ ] If implemented, a Playwright / Hardhat / vitest test would
  cover the new behavior.

If none of the boxes apply, this may be out of scope; please open a
Discussion instead.
