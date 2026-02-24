# Epic 03: Cross-Reference and Coherence Audit

## Goal

Verify that all internal cross-references in the spec and crate documentation files are semantically correct (not just syntactically resolvable), that the algorithm reference pages accurately summarize the formal specs without contradiction, and that the glossary covers the key terminology used across all specs.

## Scope

- 1,324 internal markdown links across `src/specs/` (confirmed count from Epic 01 revision report, 1,545 was the migration-time count which included crates/ and broader scope)
- 13 algorithm reference pages in `src/algorithms/`
- 1 glossary at `src/reference/glossary.md`

## What "Coherence" Means Here

A cross-reference is coherent if:

1. It resolves to an existing file (structural check — already verified by the migration)
2. It points to the section that actually discusses what the referring text claims it discusses (semantic check — not previously audited)
3. The section anchor (if present) still matches a heading in the target file

An algorithm reference page is coherent if:

1. Its description of an algorithm matches the formal spec's description
2. Formulas or procedures described in accessible language do not contradict the formal notation
3. "Further reading" links in algorithm reference pages point to the correct formal specs

## Tickets in This Epic

| Ticket     | Scope                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- |
| ticket-010 | Audit semantic accuracy of cross-references in math and overview specs                 |
| ticket-011 | Audit semantic accuracy of cross-references in architecture, HPC, and data model specs |
| ticket-012 | Audit algorithm reference pages for consistency with formal specs                      |
| ticket-013 | Audit glossary coverage and crate doc page cross-reference accuracy                    |

## Acceptance Criteria for the Epic

- All section anchor links (`#section-title` style) verified to match actual headings in target files
- No algorithm reference page contradicts a formal spec
- Glossary covers all technical terms used in math specs that are not self-defining
- All "Further reading" links in algorithm reference pages resolved and semantically accurate

## Dependencies

- Blocked By: Epic 01 (content integrity must be confirmed before semantic audit)
- Blocks: Epic 06 (fixes broken anchors, resolves contradictions)
