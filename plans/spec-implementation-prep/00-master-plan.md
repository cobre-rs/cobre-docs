# Master Plan: Spec Implementation Prep

## Executive Summary

Prepare the cobre-docs specification corpus to be a clean, navigable reference for developers starting the Cobre SDDP solver implementation. The work has three goals: (1) remove stale inline GAP markers from spec prose now that the referenced gaps are resolved, (2) fix cross-file consistency issues -- primarily 119 self-referential `§` violations in 12 architecture files and stale OpenMP references -- and (3) update the implementation ordering document to reflect the complete, gap-resolved state of the spec corpus.

## Goals & Non-Goals

### Goals

1. **GAP marker cleanup**: Remove or replace inline `GAP-XXX` references in spec prose (outside `spec-gap-inventory.md`) so that developers encounter no stale "pending decision" language.
2. **§-convention enforcement**: Replace all self-referential `§` usage in `src/specs/architecture/` files with the correct `SS` prefix, preserving the convention that `§` is reserved exclusively for links to `src/specs/hpc/` files.
3. **OpenMP reference audit**: Verify that architecture-level spec files do not contain stale OpenMP references that should have been updated to rayon-based language (if applicable) or confirm they are intentional.
4. **Implementation ordering update**: Update `implementation-ordering.md` to reflect the current (complete) spec state -- all 5 Blockers resolved, per-phase reading lists current, and a new "Minimum Viable Reading List" for first-time readers.

### Non-Goals

- Rewriting or restructuring any spec's technical content.
- Modifying `spec-gap-inventory.md` (preserved as audit trail).
- Adding new specs or sections.
- Changing the gap numbering scheme.
- Updating the cross-reference index (separate plan scope).

## Architecture Overview

### Current State

- 84 spec files across 7 directories under `src/specs/`.
- 4 inline GAP marker references across 4 spec files (GAP-010, GAP-032, GAP-033, GAP-039) plus a blocker table in `ecosystem-guidelines.md` (GAP-001 through GAP-005).
- 119 self-referential `§` violations in 12 architecture files (pre-convention files that were authored before the `SS` prefix convention was established).
- 7 architecture files are already clean (the 6 testing specs + `validation-architecture.md`, all authored during the spec-readiness plan).
- `implementation-ordering.md` references 5 Blocker gaps as unresolved, and its per-phase reading lists do not include specs added after it was written.

### Target State

- Zero stale inline GAP markers in spec prose (inventory preserved).
- Zero self-referential `§` usage in `src/specs/architecture/` files -- only legitimate `§` references to HPC files and the convention blockquote remain.
- `implementation-ordering.md` reflects the complete, gap-resolved corpus with updated reading lists and a new Minimum Viable Reading List section.

### Key Design Decisions

1. **GAP marker handling is contextual**: Some GAP references (like `GAP-032` in `training-loop.md`) are in "Design note" blockquotes where the decision content is already inline. These need the `GAP-032` label removed but the content preserved. Others (like `GAP-033` in `communicator-trait.md` section headings) need the parenthetical GAP reference removed from the heading.
2. **§ replacement is mechanical**: Every self-referential `§N` in an architecture file becomes `SSN`. Cross-references to other architecture files using `§` (e.g., "Solver Abstraction §6") become `SS6`. References to HPC files using `§` remain unchanged.
3. **OpenMP references in architecture files are largely intentional**: The investigation found OpenMP references in `solver-workspaces.md`, `solver-clp-impl.md`, `solver-highs-impl.md`, and `solver-interface-trait.md`. These are pre-rayon files that describe per-thread solver ownership using OpenMP terminology. Since the HPC layer specs still describe MPI+OpenMP (or MPI+rayon), these references need case-by-case evaluation, not blanket replacement.

## Technical Approach

### Tech Stack

- mdBook markdown files only. No code changes.
- Verification via `grep`, `mdbook build`, and manual cross-reference checks.

### Component/Module Breakdown

| Epic | Name               | Scope                                                                                                                  |
| ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1    | GAP Marker Cleanup | 4 spec files + 1 overview file with inline GAP references                                                              |
| 2    | Consistency Pass   | 12 architecture files with §-convention violations; OpenMP reference audit across architecture files                   |
| 3    | Navigation Layer   | Update `implementation-ordering.md` with resolved blockers, updated reading lists, and new Minimum Viable Reading List |

### Testing Strategy

- `mdbook build` must complete with no new warnings after each epic.
- `grep § src/specs/architecture/` must return only convention blockquote occurrences after Epic 2.
- `grep "GAP-" src/specs/ | grep -v spec-gap-inventory.md` must return zero results after Epic 1 (with the possible exception of the ecosystem-guidelines blocker table, which references GAP IDs as historical data).

## Phases & Milestones

| Phase | Epic               | Duration | Milestone                                                           |
| ----- | ------------------ | -------- | ------------------------------------------------------------------- |
| 1     | GAP Marker Cleanup | 1-2 days | Zero stale inline GAP markers                                       |
| 2     | Consistency Pass   | 3-5 days | Zero § violations in architecture files                             |
| 3     | Navigation Layer   | 2-3 days | Updated implementation-ordering.md with Minimum Viable Reading List |

## Risk Analysis

| Risk                                                                     | Likelihood | Impact | Mitigation                                                                               |
| ------------------------------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------------------- |
| § replacement breaks markdown links                                      | Low        | Medium | Each replacement is a text substitution within prose, not a link target change           |
| OpenMP->rayon terminology change introduces inconsistency with HPC specs | Medium     | High   | Evaluate each OpenMP reference in context; HPC specs legitimately use OpenMP terminology |
| Missing cross-references in updated reading lists                        | Low        | Medium | Systematic comparison of current spec file list against reading list entries             |

## Success Metrics

1. `grep "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md` returns zero matches (excluding ecosystem-guidelines blocker table if it is updated to mark them as resolved).
2. `grep "§" src/specs/architecture/ --include="*.md"` returns only matches inside the verbatim convention blockquote (7 trait spec files, 1 match each = 7 total).
3. `mdbook build` succeeds with no new warnings.
4. `implementation-ordering.md` lists all 84 spec files in at least one per-phase reading list.
