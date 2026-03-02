# ticket-001 Rewrite design-principles.md Section 5.4 for StageLpCache

## Context

### Background

The Cobre spec corpus adopted Strategy 2+3 (StageLpCache) as the LP construction baseline, replacing the previously adopted Option A (per-thread full LP rebuild with `addRows`). The file `src/specs/overview/design-principles.md` section 5.4 ("Why This Does Not Block Performance") still describes the Option A workflow in detail and states "The adopted LP construction strategy is **Option A: rebuild per stage**". This is the most prominent contradiction in the corpus because design-principles.md is a high-level overview document likely read early by new contributors.

Additionally, line 122 references "Binary Formats Appendix A" which will be deleted in ticket-002. Both references must be updated in this ticket.

### Relation to Epic

This is the highest-priority ticket in Epic 01 because design-principles.md is the entry point for understanding Cobre's architectural decisions. Fixing it first eliminates the single most visible contradiction.

### Current State

- `src/specs/overview/design-principles.md` line 122: `See [Binary Formats Appendix A](../data-model/binary-formats.md) for the complete C vs C++ API comparison across HiGHS and CLP.`
- `src/specs/overview/design-principles.md` line 140 (section header `### 5.4 Why This Does Not Block Performance`)
- Lines 144-158: Full Option A workflow description with 5-step per-solve workflow and 3 bullet points arguing that solve time dominates
- Line 144: `The adopted LP construction strategy is **Option A: rebuild per stage** (see [Binary Formats §A.2](../data-model/binary-formats.md)).`

The section's core argument (C APIs are sufficient for performance) remains valid under StageLpCache. The mechanism is different: instead of `passModel` + `addRows` per stage transition, the StageLpCache provides a complete pre-assembled LP in CSC format loaded via a single `passModel`/`loadProblem` call.

## Specification

### Requirements

1. Rewrite section 5.4 to describe the StageLpCache workflow instead of Option A
2. Update the "adopted LP construction strategy" statement to reference Strategy 2+3 (StageLpCache)
3. Update the per-solve workflow steps to reflect the StageLpCache stage transition: (1) load complete StageLpCache[t] via `passModel`/`loadProblem`, (2) patch scenario-dependent values, (3) load basis for warm-start, (4) solve
4. Update the cross-reference from `[Binary Formats §A.2]` to `[Solver Abstraction SS11.4](../architecture/solver-abstraction.md)`
5. Update line 122 to reference `[Solver HiGHS Implementation](../architecture/solver-highs-impl.md)` and `[Solver CLP Implementation](../architecture/solver-clp-impl.md)` instead of the deleted Binary Formats Appendix A
6. Keep the section's argumentative structure: the core claim that C APIs are sufficient is still valid

### Inputs/Props

- Current file: `src/specs/overview/design-principles.md`
- Canonical StageLpCache description: `src/specs/architecture/solver-abstraction.md` SS11.2-SS11.4
- Production scale reference: `src/specs/overview/production-scale-reference.md` (60 stages, ~22.3 GB StageLpCache)

### Outputs/Behavior

- Section 5.4 accurately describes the StageLpCache workflow
- All cross-references point to correct, existing sections
- The argument that C APIs are sufficient for performance is preserved but updated for StageLpCache

### Error Handling

- If section 5.4 boundaries have shifted from the line numbers above, locate the section by its heading `### 5.4 Why This Does Not Block Performance`
- If line 122 content has changed, locate by searching for "Binary Formats Appendix A"

## Acceptance Criteria

- [ ] Given `src/specs/overview/design-principles.md`, when searching for "Option A", then zero matches are found
- [ ] Given `src/specs/overview/design-principles.md`, when searching for "Binary Formats Appendix A" or "Binary Formats §A", then zero matches are found
- [ ] Given `src/specs/overview/design-principles.md`, when reading section 5.4, then it describes StageLpCache as the adopted LP construction strategy and references `[Solver Abstraction SS11.4]`
- [ ] Given `src/specs/overview/design-principles.md`, when running `mdbook build` from the repo root, then the build succeeds with no new warnings related to design-principles.md

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/design-principles.md` lines 120-170 to understand the full context
2. Read `src/specs/architecture/solver-abstraction.md` SS11.2-SS11.4 for the canonical StageLpCache workflow description
3. Edit line 122: replace `See [Binary Formats Appendix A](../data-model/binary-formats.md) for the complete C vs C++ API comparison across HiGHS and CLP.` with `See [Solver HiGHS Implementation](../architecture/solver-highs-impl.md) and [Solver CLP Implementation](../architecture/solver-clp-impl.md) for the solver-specific C API usage.`
4. Edit line 144: replace `The adopted LP construction strategy is **Option A: rebuild per stage** (see [Binary Formats §A.2](../data-model/binary-formats.md)).` with `The adopted LP construction strategy is **Strategy 2+3: StageLpCache** (see [Solver Abstraction SS11.4](../architecture/solver-abstraction.md)).` followed by a description of how each thread loads a complete pre-assembled LP per stage via a single bulk API call
5. Replace the 5-step per-solve workflow (lines 146-150) with the StageLpCache workflow: (1) load StageLpCache[t] via `passModel`/`loadProblem` -- a single bulk copy of the complete LP including structural constraints and active Benders cuts in CSC format, (2) patch ~2,240 scenario-dependent values via bound modification, (3) load basis from previous iteration for warm-start, (4) solve
6. Update the bullets (lines 152-156) about clone pattern: remove the "model clone pattern would save steps 1-2" argument since it is no longer relevant. Replace with an explanation that the StageLpCache is shared across all ranks on the same node via `SharedRegion<T>`, reducing per-rank memory from ~91.8 GB (Option A) to ~22.3 GB (StageLpCache, node-wide)
7. Keep the paragraph at line 158 about solver-agnostic data ("What we store and restore is solver-agnostic") -- this is still accurate
8. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/overview/design-principles.md` (lines 122, 140-158)

### Patterns to Follow

- Use the same cross-reference format as other overview specs: `[Solver Abstraction SS11.4](../architecture/solver-abstraction.md)`
- Overview specs use plain numbered sections, not `SS` or `§` prefixes in their own headings

### Pitfalls to Avoid

- Do not change the section number (5.4) or heading text -- other files may reference it
- Do not add `SS` or `§` prefixes to the design-principles headings (this is an overview spec, uses plain numbers)
- Do not introduce references to Binary Formats Appendix A (it is being deleted)
- Do not remove the paragraph about solver-agnostic data at line 158 -- it remains correct and valuable

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `mdbook build` from the repo root and verify no new warnings
- Run `grep "Option A" src/specs/overview/design-principles.md` and verify zero matches
- Run `grep "Binary Formats Appendix" src/specs/overview/design-principles.md` and verify zero matches
- Run `grep "§A" src/specs/overview/design-principles.md` and verify zero matches

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-007 (solver-abstraction collapse), ticket-012 (cross-reference index update)

## Effort Estimate

**Points**: 2
**Confidence**: High
