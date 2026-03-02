# Master Plan: Spec Clarity Audit

## Executive Summary

The Cobre spec corpus (87 markdown files, ~36,000 lines) has accumulated internal contradictions following the adoption of Strategy 2+3 (StageLpCache) as the LP construction baseline, replacing the previously adopted Option A (per-thread full LP rebuild with addRows). Eleven files were updated to reflect StageLpCache, but the remaining corpus still references Option A as the adopted strategy, uses stale production-scale values (120 stages, 28 GB), and presents superseded analysis as if it were current. This plan systematically audits and cleans the entire spec corpus to ensure unambiguous, coherent documentation before implementation begins.

## Goals

1. **Eliminate all contradictory "adopted" statements** -- every spec file must unambiguously communicate the current architectural baseline (Strategy 2+3 / StageLpCache)
2. **Replace stale production-scale values** -- update "120 stages" references used as production baseline to "60 stages" and recalculate all derived values (28 GB, 10 MB basis, dispatch counts)
3. **Collapse superseded analysis to footnotes** -- replace detailed Option A / cloning analysis with 1-2 sentence summaries pointing to the authoritative sections
4. **Delete misplaced content** -- remove binary-formats Appendix A (solver API analysis belongs in solver-specific specs)
5. **Establish a Decision Log** -- create a central record of cross-cutting architectural decisions to prevent recurrence
6. **Verify cross-file consistency** -- confirm that after cleanup, all cross-references resolve, all numerical values are consistent, and no contradictions remain

## Non-Goals

- Rewriting spec content unrelated to the StageLpCache adoption or stale values
- Adding new spec content or resolving open gaps
- Changing the architecture itself -- this is a documentation cleanup, not a design change
- Updating the mdBook build configuration or theme
- Modifying files outside `src/` (except this plan directory)

## Architecture Overview

### Current State

The spec corpus has three layers of inconsistency:

| Layer                   | Description                                                                                                         | Files Affected                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Contradictory baselines | Files state "Option A is adopted" while others state "Strategy 2+3 is adopted"                                      | 2 files (design-principles, binary-formats)                                                         |
| Stale numerical values  | "120 stages" used as production reference instead of "60 stages"; derived values (28 GB, dispatch counts) are wrong | 12 files                                                                                            |
| Superseded detail       | Detailed Option A analysis, cloning analysis, and comparison tables remain as live content                          | 5 files (solver-abstraction, solver-workspaces, solver-clp-impl, solver-highs-impl, binary-formats) |
| Broken cross-references | Links to Binary Formats Appendix A will break after deletion                                                        | 6 files                                                                                             |

### Target State

- Every file uses "Strategy 2+3 (StageLpCache)" as the adopted LP construction baseline
- Production-scale values consistently use 60 stages as the baseline, with 120 stages appearing only as hypothetical maximum or range bound (with explicit clarification)
- Superseded analysis is collapsed to 1-2 sentence footnotes
- Binary Formats Appendix A is deleted; all cross-references point to solver-specific specs
- A central Decision Log exists at `src/specs/overview/decision-log.md`
- Cross-reference index is updated for all affected entries

### Key Design Decisions

1. **Superseded content: collapse to footnotes** -- 1-2 sentence summary replacing detailed analysis. Rationale: maximizes clarity while preserving historical context pointers.
2. **Binary Formats Appendix A: delete entirely** -- solver API analysis belongs in solver-specific specs (solver-highs-impl, solver-clp-impl). Rationale: binary-formats.md should focus on binary format concerns only.
3. **120 stages: contextual replacement** -- replace where used as "production reference" but keep as "hypothetical maximum" or "range bound". Add clarifying note to production-scale-reference.md. Rationale: 120 stages is a valid theoretical maximum for some calculations.
4. **Design-principles.md section 5.4: full rewrite** -- describe StageLpCache workflow instead of Option A workflow. Rationale: this is a high-level design document that should reflect current architecture.
5. **Audit scope: spec files + crate docs** -- `src/specs/**/*.md` + `src/crates/**/*.md`. Rationale: crate docs reference spec content and may propagate stale values.
6. **Cross-reference index: incremental update** -- only entries affected by cleanup. Rationale: most entries are unaffected; full rebuild is wasteful.
7. **Prevention: Central Decision Log** -- single file listing all cross-cutting decisions. Rationale: makes it impossible to miss a decision when updating specs.

## Technical Approach

### Cleanup Methodology

Each ticket follows a systematic process:

1. **Grep** for the specific stale pattern in the target file(s)
2. **Read** surrounding context to understand the purpose of each reference
3. **Classify** each reference: stale-production-reference vs hypothetical-maximum vs range-bound
4. **Edit** with the appropriate replacement
5. **Verify** the edit is consistent with the canonical source (production-scale-reference.md for values, solver-abstraction.md SS11 for StageLpCache)
6. **Build** with `mdbook build` to verify no broken links

### Testing Strategy

- `mdbook build` after each file-touching ticket to catch broken links
- `grep` verification commands in each ticket's acceptance criteria to confirm stale patterns are eliminated
- Cross-reference consistency check as a dedicated final ticket

## Phases and Milestones

| Phase | Epic                                 | Focus                                                                       | Tickets | Detail Level |
| ----- | ------------------------------------ | --------------------------------------------------------------------------- | ------- | ------------ |
| 1     | Epic 01: Stale Reference Cleanup     | Fix contradictory baselines and stale numerical values in untouched files   | 6       | Detailed     |
| 1     | Epic 02: Superseded Content Collapse | Collapse detailed superseded analysis to footnotes in recently-edited files | 5       | Detailed     |
| 2     | Epic 03: Decision Log and Prevention | Create central decision log and establish conventions                       | 3       | Outline      |
| 2     | Epic 04: Cross-File Verification     | Verify consistency, update cross-reference index, final audit               | 3       | Outline      |

## Risk Analysis

| Risk                                             | Likelihood | Impact                                             | Mitigation                                         |
| ------------------------------------------------ | ---------- | -------------------------------------------------- | -------------------------------------------------- |
| Missed stale reference                           | Medium     | Low -- caught during implementation or code review | Systematic grep-based verification in each ticket  |
| Broken cross-reference after Appendix A deletion | Low        | Medium -- broken link in built book                | Ticket-specific grep for all Appendix A references |
| Section renumbering cascade                      | Low        | Medium -- other files reference section numbers    | Avoid renumbering; prefer in-place edits           |
| Merge conflict with uncommitted changes          | Medium     | Low                                                | Plan assumes current working tree state            |

## Success Metrics

1. `grep -r "Option A" src/specs/` returns zero results outside of historical footnotes
2. `grep -r "120 stages" src/specs/` returns only hypothetical-maximum or range-bound uses, each with explicit context
3. `grep -r "28 GB" src/specs/` returns zero results (replaced by ~14.3 GB or ~22.3 GB as appropriate)
4. `mdbook build` succeeds with no new warnings
5. `src/specs/overview/decision-log.md` exists with all cross-cutting decisions cataloged
6. Every "adopted" statement in the corpus points to the same baseline (Strategy 2+3 / StageLpCache)
