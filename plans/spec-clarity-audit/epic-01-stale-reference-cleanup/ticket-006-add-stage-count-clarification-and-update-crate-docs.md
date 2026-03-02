# ticket-006 Add Stage Count Clarification Note and Update Crate Docs

## Context

### Background

After tickets 002-005 update all stale "120 stages" references, the spec corpus needs a clarifying note in the canonical production-scale-reference.md explaining the relationship between the 60-stage production baseline and the 120-stage theoretical maximum. This prevents future confusion about why some calculations (e.g., scenario-generation.md, performance-adaptation-layer.md) still reference 120 stages.

Additionally, `src/crates/solver.md` line 67-70 describes "Dynamic constraint addition" via "batch `addRows`" as the cut injection mechanism. Under StageLpCache, `addRows` is no longer the hot-path mechanism -- cuts are pre-assembled into the StageLpCache CSC. The crate doc should be updated.

### Relation to Epic

This is the final ticket in Epic 01. It adds the clarifying note that makes the contextual "120 stages" references self-explanatory, and cleans up the only stale crate doc reference.

### Current State

1. `src/specs/overview/production-scale-reference.md` section 1 table: `Stages | 60` -- no note explaining that 120 is sometimes used as theoretical max elsewhere in the corpus
2. `src/crates/solver.md` lines 67-70:
   ```
   - **Dynamic constraint addition** -- New constraints are injected into the LP
     bottom row region via batch `addRows`. Constraints are stored in physical
     units; scaling is applied at solve time. In SDDP, this mechanism is used to
     inject Benders cuts generated during the backward pass.
   ```

## Specification

### Requirements

1. Add a note to `src/specs/overview/production-scale-reference.md` after the section 1 dimensions table (after line 23) clarifying the stage count convention:
   - 60 stages is the production baseline used for all capacity planning, performance budgeting, and memory sizing
   - 120 stages appears in some specs as a theoretical maximum or worst-case bound for FLOP cost calculations, temporal flattening memory estimates, and hypothetical sizing scenarios
   - When a spec references "120 stages", it must explicitly label this as "worst-case" or "hypothetical maximum" to distinguish from the production baseline

2. Update `src/crates/solver.md` lines 67-70 to describe the StageLpCache mechanism instead of `addRows` as the primary SDDP cut injection mechanism:
   - Benders cuts are pre-assembled into the StageLpCache CSC by the leader rank between iterations
   - `addRows` is used during StageLpCache assembly but is not invoked on the hot-path stage transition
   - Reference Solver Abstraction SS11.4

### Inputs/Props

- `src/specs/overview/production-scale-reference.md` (line 23 area)
- `src/crates/solver.md` (lines 67-70)

### Outputs/Behavior

- production-scale-reference.md contains a clear note distinguishing 60-stage baseline from 120-stage worst-case
- solver.md crate doc accurately describes the StageLpCache cut injection mechanism

### Error Handling

- If line numbers have shifted, locate by the section 1 table and the "Dynamic constraint addition" bullet respectively

## Acceptance Criteria

- [ ] Given `src/specs/overview/production-scale-reference.md`, when reading the note after the dimensions table, then it explains that 60 stages is the production baseline and 120 stages appears only as worst-case or hypothetical maximum in other specs
- [ ] Given `src/crates/solver.md`, when reading the dynamic constraint addition bullet, then it describes StageLpCache as the primary SDDP cut injection mechanism and mentions `addRows` only as part of StageLpCache assembly
- [ ] Given `src/crates/solver.md`, when searching for "addRows", then any remaining mention includes the qualifier "during StageLpCache assembly" or similar context
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/production-scale-reference.md` lines 1-30 to find the dimensions table
2. Add a blockquote note after the table:
   ```
   > **Stage count convention**: 60 stages is the production baseline used for all capacity planning, memory budgets, and performance targets throughout this specification corpus. Some specs reference 120 stages as a theoretical maximum or worst-case bound (e.g., FLOP cost calculations, temporal flattening memory estimates, hypothetical sizing). Such references are explicitly labeled as "worst-case" or "hypothetical maximum" to distinguish from the production baseline.
   ```
3. Read `src/crates/solver.md` lines 60-77
4. Update the "Dynamic constraint addition" bullet to:
   ```
   - **Cut injection via StageLpCache** -- Benders cuts generated during the backward
     pass are pre-assembled into a per-stage StageLpCache CSC representation by the
     leader rank between iterations. At each stage transition, threads load the complete
     LP (structural constraints + active cuts) via a single `passModel`/`loadProblem`
     call. The `addRows` API is used only during StageLpCache assembly, not on the
     hot-path stage transition. See [Solver Abstraction SS11.4](../specs/architecture/solver-abstraction.md).
   ```
5. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/overview/production-scale-reference.md` (after line 23)
- `src/crates/solver.md` (lines 67-70)

### Patterns to Follow

- production-scale-reference.md uses blockquote notes (`> **Note**: ...`) for clarifications
- Crate docs use relative paths to spec files: `[Solver Abstraction SS11.4](../specs/architecture/solver-abstraction.md)`

### Pitfalls to Avoid

- Do not change the dimensions table itself (60 stages is correct)
- Do not remove the mention of `addRows` entirely from solver.md -- it is still used, just not on the hot path
- Do not use `SS` or `§` prefixes in the production-scale-reference.md note (overview spec uses plain numbers)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `mdbook build` and verify success
- Read the updated production-scale-reference.md note and verify it explains the convention clearly

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-004, ticket-005 (these tickets update "120 stages" references; the clarification note explains the convention they follow)
- **Blocks**: ticket-016 (full-corpus verification)

## Effort Estimate

**Points**: 1
**Confidence**: High
