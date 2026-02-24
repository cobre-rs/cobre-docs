# Epic 01: Content Integrity Verification

## Goal

Verify that zero information was lost during the migration of all 50 spec files from `powers-rs` to `cobre-docs`. Each file must be audited individually — no sampling.

## Scope

- 50 source files across 7 directories in `/home/rogerio/git/powers/docs/specs/`
- 50 corresponding target files across 7 sections in `/home/rogerio/git/cobre-docs/src/specs/`
- The audit confirms: frontmatter removal, brand replacement, cross-reference path rewriting, and content preservation (headings, tables, code blocks, formulas, prose)

## What This Epic Does NOT Cover

- Correctness of the spec content itself (that is the source of truth)
- Algorithm reference pages (`src/algorithms/`)
- Crate documentation pages (`src/crates/`)
- Whether specs are in the right section (Epic 02)

## Tickets in This Epic

| Ticket     | Scope                                               | Files                                                                                                                                                          |
| ---------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ticket-001 | Overview specs audit                                | 3 files: `specs/overview/`                                                                                                                                     |
| ticket-002 | Math specs audit — Part 1                           | 7 files: `sddp-algorithm`, `lp-formulation`, `system-elements`, `block-formulations`, `hydro-production-models`, `cut-management`, `discount-rate`             |
| ticket-003 | Math specs audit — Part 2                           | 7 files: `infinite-horizon`, `risk-measures`, `inflow-nonnegativity`, `par-inflow-model`, `equipment-formulations`, `stopping-rules`, `upper-bound-evaluation` |
| ticket-004 | Data model specs audit                              | 10 files: all `specs/data-model/`                                                                                                                              |
| ticket-005 | Architecture, HPC, Config, and Deferred specs audit | 22 files: all `specs/architecture/` + `specs/hpc/` + `specs/configuration/` + `specs/deferred.md`                                                              |

## Acceptance Criteria for the Epic

- Each ticket produces a pass/fail table with one row per file
- Every file that passes has: zero YAML frontmatter, zero prohibited brand terms, correct cross-reference paths, matching heading/table/formula counts vs source
- Every CRITICAL finding (information loss) is logged with file path, section heading, and description of the missing content
- The epic concludes with a roll-up summary table of all 50 files

## Dependencies

- No upstream dependencies — this epic can start immediately
- Blocks: Epic 06 (Remediation) depends on findings from this epic
