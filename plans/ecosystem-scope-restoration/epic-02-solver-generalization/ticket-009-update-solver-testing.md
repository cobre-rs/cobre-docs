# ticket-009 Update solver-interface-testing.md for New Method Names

## Context

### Background

The solver interface testing spec defines conformance tests for the `SolverInterface` trait. After ticket-007 renames `add_cut_rows` -> `add_rows`, `patch_row_bounds` -> `set_row_bounds`, and `patch_col_bounds` -> `set_col_bounds`, the testing spec must update test names, section headings, and method references to match. The purpose paragraph also references the old method names.

### Relation to Epic

This ticket updates the testing companion to `solver-interface-trait.md`. It depends on ticket-007 for the authoritative method names.

### Current State

File `src/specs/architecture/solver-interface-testing.md`:

- Purpose paragraph: "conformance test suite for the `SolverInterface` trait and its 10 methods (`load_model`, `add_cut_rows`, `patch_row_bounds`, `patch_col_bounds`, ...)"
- Test naming convention: `test_solver_{variant}_{method}_{scenario}` where `{method}` uses old names
- Test names contain `add_cut_rows`, `patch_row_bounds`, `patch_col_bounds`
- SS1.1 Shared LP Fixture references "cut rows" in the LP layout description
- Multiple test tables reference old method names in the test name column

## Specification

### Requirements

1. Update Purpose paragraph to list new method names: `add_rows`, `set_row_bounds`, `set_col_bounds`
2. Update all test names: `test_solver_{variant}_add_cut_rows_{scenario}` -> `test_solver_{variant}_add_rows_{scenario}`
3. Update all test names: `test_solver_{variant}_patch_row_bounds_{scenario}` -> `test_solver_{variant}_set_row_bounds_{scenario}`
4. Update all test names: `test_solver_{variant}_patch_col_bounds_{scenario}` -> `test_solver_{variant}_set_col_bounds_{scenario}`
5. Update method references in "Input Scenario" and "Expected Observable Behavior" columns
6. Update any references to LP layout terminology per ticket-006 (e.g., "cut rows" -> "dynamic constraint rows")
7. Preserve all test logic, expected values, and fixture data unchanged
8. Preserve SS section numbers and cross-reference links
9. This file has NO convention blockquote (testing specs do not include it -- per CLAUDE.md rules)

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-interface-testing.md`
- Dependencies: ticket-006 (layout terminology), ticket-007 (method names)

### Outputs/Behavior

- All test names use new method names
- Purpose paragraph lists new method names
- LP layout references use new terminology
- All test logic, expected values, and fixture data unchanged
- No convention blockquote present (correct for testing specs)

### Error Handling

- If a test description references "cuts" in the context of the test fixture LP (which has "cut rows" as test data), update to "dynamic constraint rows" but keep the LP fixture data itself unchanged

## Acceptance Criteria

- [ ] Given `solver-interface-testing.md`, when `grep "add_cut_rows" solver-interface-testing.md` is run, then zero matches are found
- [ ] Given `solver-interface-testing.md`, when `grep "patch_row_bounds\|patch_col_bounds" solver-interface-testing.md` is run, then zero matches are found
- [ ] Given the Purpose paragraph, when read, then it lists method names `add_rows`, `set_row_bounds`, `set_col_bounds`
- [ ] Given any test name in the file, when checked against the naming convention `test_solver_{variant}_{method}_{scenario}`, then `{method}` uses the new names
- [ ] Given the test fixture data (SS1.1), when diffed against the original, then numerical values and LP dimensions are unchanged
- [ ] Given the file, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Test fixture numerical data (stays identical)
- Cross-solver equivalence tolerances (stays identical)
- Adding or removing test cases
- Behavioral contract changes

## Implementation Guide

### Suggested Approach

1. Update the Purpose paragraph: replace `add_cut_rows` with `add_rows`, `patch_row_bounds` with `set_row_bounds`, `patch_col_bounds` with `set_col_bounds`
2. Global search-and-replace in test name columns:
   - `test_solver_highs_add_cut_rows` -> `test_solver_highs_add_rows`
   - `test_solver_clp_add_cut_rows` -> `test_solver_clp_add_rows`
   - `test_solver_highs_patch_row_bounds` -> `test_solver_highs_set_row_bounds`
   - `test_solver_clp_patch_row_bounds` -> `test_solver_clp_set_row_bounds`
   - `test_solver_highs_patch_col_bounds` -> `test_solver_highs_set_col_bounds`
   - `test_solver_clp_patch_col_bounds` -> `test_solver_clp_set_col_bounds`
3. Update prose in test description columns: "Benders cuts" -> "dynamic constraints" in layout context, "scenario patching" -> "bound updates" in method context
4. Update SS1.1 shared fixture LP layout description to use new region terminology
5. Verify no test data changed

### Key Files to Modify

- `src/specs/architecture/solver-interface-testing.md`

### Patterns to Follow

- Test naming convention stays: `test_solver_{variant}_{method}_{scenario}` -- only `{method}` changes
- All test descriptions should reference the new method names
- LP fixture data stays numerically identical

### Pitfalls to Avoid

- Do NOT change test expected values (numerical data)
- Do NOT change the shared LP fixture dimensions or coefficients
- Do NOT add or remove test cases
- Verify the file has NO convention blockquote (testing specs must not have one)

## Testing Requirements

### Unit Tests

- `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" src/specs/architecture/solver-interface-testing.md` returns 0

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: ticket-006, ticket-007
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
