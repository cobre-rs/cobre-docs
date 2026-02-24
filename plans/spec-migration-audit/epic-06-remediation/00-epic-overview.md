# Epic 06: Remediation

## Goal

Fix all CRITICAL and HIGH findings from epics 01-05, and as many MEDIUM findings as are tractable. Verify the fixed cobre-docs repo passes `mdbook build` with exit 0 after all fixes.

## Why This Epic Is Outline-Only

This epic cannot be specified in detail before epics 01-05 execute. The specific files to modify, the exact line numbers to change, and the severity of issues are all unknown until the audit tickets produce their findings. The three outline tickets below represent the logical buckets of remediation work, not a pre-specified list of changes.

## Tickets in This Epic

| Ticket     | Scope                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| ticket-018 | Fix all CRITICAL findings (information loss, broken links, missing content)                     |
| ticket-019 | Fix all HIGH findings (incorrect crate mapping, crate doc gaps, contradiction with formal spec) |
| ticket-020 | Fix MEDIUM and LOW findings; final build verification                                           |

## Acceptance Criteria for the Epic

- All CRITICAL findings from epics 01-05 are resolved
- All HIGH findings from epics 01-05 are resolved
- `mdbook build` exits 0 after all fixes
- All cross-references that were flagged as broken now resolve
- All LaTeX rendering failures that are fixable (bad LaTeX syntax) are fixed

## Dependencies

- Blocked By: All epics 01-05 must complete before this epic begins
- Blocks: Nothing — this is the final epic
