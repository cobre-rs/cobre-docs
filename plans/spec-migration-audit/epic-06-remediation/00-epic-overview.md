# Epic 06: Remediation

## Goal

Fix all HIGH findings from epics 01-05 and the user review, apply the cross-cutting notation change (beta to pi for cut coefficients), fix all tractable MEDIUM and LOW findings, and verify the fixed cobre-docs repo passes `mdbook build` with exit 0 after all fixes. The audit found 0 CRITICAL findings, so no CRITICAL remediation is needed.

## Findings Summary

| Source              | CRITICAL | HIGH   | MEDIUM | LOW    |
| ------------------- | -------- | ------ | ------ | ------ |
| Epics 01-05 audit   | 0        | 21     | 31     | 35     |
| User review (R1-R9) | 0        | 8      | 1      | 0      |
| **Total**           | **0**    | **29** | **32** | **35** |

## Tickets in This Epic

| Ticket     | Scope                                                                                                          | Points |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| ticket-018 | Cross-cutting notation change: beta to pi for Benders cut coefficients (R6)                                    | 3      |
| ticket-019 | Fix 7 section-number errata (F-1, F-5-F-9, F-11) + 8 user-review HIGH findings (R2-R5, R7-R9)                  | 4      |
| ticket-020 | Fix MEDIUM and LOW findings (asymmetric ref gaps, glossary, algorithm pages, R1); final build verification     | 3      |
| ticket-021 | Add 14 missing spec links to crate documentation pages (cobre-sddp, cobre-core, cobre-io, cobre-cli, ferrompi) | 2      |

**Execution order**: ticket-018 -> ticket-019 -> ticket-020 + ticket-021 (020 and 021 can run in parallel)

## Scope Changes from Original Plan

The original plan had 3 tickets (018, 019, 020). During refinement:

- **ticket-018** was repurposed from "Fix CRITICAL findings" (0 findings) to "Fix cross-cutting notation change" (the most impactful single change)
- **ticket-019** was split: the 14 HIGH crate doc missing-link findings were moved to the new ticket-021, keeping ticket-019 focused on spec file corrections
- **ticket-021** was added to handle crate doc missing links as a distinct concern

## Acceptance Criteria for the Epic

- All HIGH findings from epics 01-05 and user review are resolved
- Notation change (beta to pi) is complete across all math spec files
- `mdbook build` exits 0 after all fixes
- All cross-references that were flagged as broken now resolve
- All LaTeX rendering failures that are fixable are fixed
- All 14 HIGH crate doc missing-link gaps are filled
- Glossary has 9 new term definitions

## Dependencies

- Blocked By: All epics 01-05 must complete before this epic begins (done)
- Blocks: Nothing -- this is the final epic
