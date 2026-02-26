# ticket-022 Fix Solver Testing Spec Naming and Add patch_col_bounds Tests

## Context

### Background

The implementation readiness audit (report-004, Finding F-007) identified that `src/specs/architecture/solver-interface-testing.md` uses the stale method name `patch_rhs_bounds` in 8 occurrences where the canonical method name is `patch_row_bounds` (as defined in `solver-interface-trait.md`). Additionally, the testing spec adequacy audit (report-014) found that the `patch_col_bounds` method has zero test cases -- it is the only `SolverInterface` trait method with no tests.

This resolves condition C-05 from the readiness verdict (report-017). It unblocks Phase 3 (cobre-solver implementation) by ensuring the testing spec matches the trait spec.

### Relation to Epic

This is one of five mechanical fix tickets in Epic 06. It is independent of all other tickets in the epic.

### Current State

- `src/specs/architecture/solver-interface-testing.md` contains 8 occurrences of `patch_rhs_bounds` that should be `patch_row_bounds`.
- `src/specs/architecture/solver-interface-trait.md` defines the canonical method name as `patch_row_bounds` (right-hand side is a misnomer; the method patches row bounds, i.e., constraint lower/upper bounds).
- The testing spec has no test cases for `patch_col_bounds` (patching variable bounds). Report-014 flagged this as HIGH priority because `patch_col_bounds` is exercised during every training iteration (variable fixing for state transfer).

## Specification

### Requirements

1. Replace all 8 occurrences of `patch_rhs_bounds` with `patch_row_bounds` in `solver-interface-testing.md`.

2. Add at least 3 `patch_col_bounds` test cases to `solver-interface-testing.md` in the appropriate section (alongside the existing `patch_row_bounds` tests). The test cases should cover:
   - Basic column bound patching (set lower and upper bounds on a variable)
   - Bound patching with unbounded variables (setting `f64::NEG_INFINITY` or `f64::INFINITY`)
   - Re-patching after solve (verify that bounds are correctly applied before a subsequent solve)

3. Follow the test naming convention: `test_solver_{variant}_{method}_{scenario}` (e.g., `test_solver_highs_patch_col_bounds_basic`).

4. Follow the shared fixture pattern: reference the existing shared LP fixture and describe the delta (which columns are patched).

### Inputs/Props

- `src/specs/architecture/solver-interface-testing.md` -- target file
- `src/specs/architecture/solver-interface-trait.md` -- canonical method names and behavioral contracts
- Report-004 Finding F-007 and Report-014 -- specific line counts and gap description

### Outputs/Behavior

- Updated `src/specs/architecture/solver-interface-testing.md` with:
  - 0 occurrences of `patch_rhs_bounds` (all replaced with `patch_row_bounds`)
  - At least 3 new `patch_col_bounds` test cases in the appropriate section

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `solver-interface-testing.md` is searched for `patch_rhs_bounds`, then zero matches are found
- [ ] Given `solver-interface-testing.md` is searched for `patch_row_bounds`, then at least 8 matches are found (the renamed occurrences)
- [ ] Given `solver-interface-testing.md` is searched for `patch_col_bounds`, then at least 3 test cases are found with names matching `test_solver_{variant}_patch_col_bounds_{scenario}`
- [ ] Given the new `patch_col_bounds` tests, when checking the test structure, then each test references the shared fixture and describes the specific delta (which columns are patched to which bounds)
- [ ] Given the updated file, when running `mdbook build`, then no errors occur

## Implementation Guide

### Suggested Approach

1. Read `solver-interface-testing.md` and identify all 8 occurrences of `patch_rhs_bounds`.
2. Replace each with `patch_row_bounds`, preserving all surrounding context.
3. Find the section containing `patch_row_bounds` tests (likely SS2 or SS3).
4. Read the behavioral contract for `patch_col_bounds` in `solver-interface-trait.md`.
5. Add 3 test cases following the existing test table format and naming convention.
6. Verify the replacement count: 8 replacements, 0 remaining `patch_rhs_bounds`.

### Key Files to Modify

- `src/specs/architecture/solver-interface-testing.md` -- rename and add tests

### Patterns to Follow

- Follow the existing test table format in `solver-interface-testing.md`.
- Follow the test naming convention: `test_solver_highs_patch_col_bounds_{scenario}`.
- Follow the shared fixture pattern: "Starting from the shared fixture, patch column N bounds to [lb, ub]."

### Pitfalls to Avoid

- Do NOT rename occurrences in other files -- only `solver-interface-testing.md` is affected.
- Do NOT confuse `patch_row_bounds` (constraint bounds) with `patch_col_bounds` (variable bounds) -- they are distinct methods with different semantics.
- Do NOT add cross-solver equivalence tests for `patch_col_bounds` -- those belong in a separate section and are out of scope.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

Verify `mdbook build` completes without errors.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: None directly (but Epic 08 verification covers this)

## Effort Estimate

**Points**: 2
**Confidence**: High
