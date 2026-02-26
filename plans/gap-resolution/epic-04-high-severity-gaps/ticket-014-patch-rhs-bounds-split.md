# ticket-014: Split patch_rhs_bounds into Row and Column Methods (GAP-009)

## Context

### Background

The `SolverInterface` trait method `patch_rhs_bounds(&mut self, patches: &[(usize, f64)])` conflates row-index RHS patching and column-index bound patching in a single method with ambiguous semantics. The `usize` index could refer to either a row or a column, and the single `f64` value does not distinguish between setting the lower bound, upper bound, or both. HiGHS uses separate APIs (`changeRowsBoundsBySet` for row bounds, `changeColsBoundsBySet` for column bounds), each taking distinct lower/upper value pairs. The current signature makes it impossible to implement correctly without additional convention documentation. The forward pass patch sequence (Training Loop SS4.2a) only patches row RHS values, but the generic solver interface should support column bound patches as well for future flexibility.

### Relation to Epic

This ticket resolves GAP-009 (High severity). It modifies the solver interface trait spec, which is the contract between cobre-sddp and cobre-solver. The split clarifies the API for implementers and directly addresses the ambiguity identified in the gap inventory.

### Current State

- **Solver Interface Trait SS2.3**: Method `patch_rhs_bounds(&mut self, patches: &[(usize, f64)])` with pre/postconditions. Description says "Update scenario-dependent RHS values and variable bounds."
- **Training Loop SS4.2a**: All forward pass patches are row RHS patches (water balance, lag fixing, noise fixing). The patches set both lower and upper bounds to the same value (equality constraint RHS).
- **Solver Abstraction SS11.4**: References "within-stage incremental updates" via `patch_rhs_bounds`.
- **HiGHS API**: `Highs_changeRowsBoundsBySet(highs, num, set, lower, upper)` and `Highs_changeColsBoundsBySet(highs, num, set, lower, upper)`.
- **CLP API**: Direct mutable pointer access via `Clp_rowLower()`, `Clp_rowUpper()`, `Clp_colLower()`, `Clp_colUpper()`.

## Specification

### Requirements

1. Replace the existing `patch_rhs_bounds` method in `solver-interface-trait.md` SS2.3 with two separate methods:
   - `patch_row_bounds(&mut self, patches: &[(usize, f64, f64)])` — patches row lower and upper bounds by row index
   - `patch_col_bounds(&mut self, patches: &[(usize, f64, f64)])` — patches column lower and upper bounds by column index
2. Each patch tuple is `(index, new_lower, new_upper)`. For equality constraint RHS patches (the common case in SDDP), the caller sets `new_lower = new_upper = value`.
3. Update the trait definition code block in SS1 to replace `patch_rhs_bounds` with the two new methods.
4. Update the method contract in SS2.3 to define pre/postconditions for both methods. The preconditions and postconditions are structurally identical (valid indices, finite values, solver basis preserved) but applied to row vs column indices respectively.
5. Document the HiGHS and CLP API mapping for each method:
   - `patch_row_bounds` maps to `Highs_changeRowsBoundsBySet` (HiGHS) or `Clp_rowLower()`/`Clp_rowUpper()` mutable pointer writes (CLP).
   - `patch_col_bounds` maps to `Highs_changeColsBoundsBySet` (HiGHS) or `Clp_colLower()`/`Clp_colUpper()` mutable pointer writes (CLP).
6. Add a note that `patch_col_bounds` is not used in the minimal viable SDDP forward/backward pass (all patches are row RHS), but is included for completeness and future use (e.g., variable bound tightening heuristics).
7. Update all references to `patch_rhs_bounds` in `solver-interface-trait.md` to reference the appropriate new method name.
8. In `training-loop.md` SS4.2a and SS5.3, update references from `patch_rhs_bounds` to `patch_row_bounds` since all patches in the training loop target row bounds.
9. In `solver-workspaces.md` SS1.4, update the stage solve workflow description to reference `patch_row_bounds` (step 3).
10. In `solver-abstraction.md`, update any references to `patch_rhs_bounds` in SS4.1 (operations table) and SS11.2-11.4 (rebuild sequence) to reference the split methods.
11. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-009 as resolved.

### Inputs/Props

- Current `patch_rhs_bounds` method signature and contract from SS2.3
- HiGHS and CLP API signatures for row/column bound modification
- Forward pass patch sequence from Training Loop SS4.2a

### Outputs/Behavior

Two method signatures with clear semantics: `patch_row_bounds` for constraint RHS and `patch_col_bounds` for variable bounds, each with `(index, lower, upper)` tuples.

### Error Handling

Both methods remain infallible (no `Result` return). Out-of-bounds indices are programming errors (panic on violation), consistent with the existing contract.

## Acceptance Criteria

- [ ] Given `solver-interface-trait.md` SS1, when reading the trait definition, then `patch_rhs_bounds` is absent and `patch_row_bounds` and `patch_col_bounds` are present with `&[(usize, f64, f64)]` signatures.
- [ ] Given SS2.3, when reading the method contracts, then separate pre/postcondition tables exist for `patch_row_bounds` and `patch_col_bounds`.
- [ ] Given SS2.3, when checking the HiGHS mapping, then `patch_row_bounds` maps to `Highs_changeRowsBoundsBySet` and `patch_col_bounds` maps to `Highs_changeColsBoundsBySet`.
- [ ] Given `training-loop.md` SS4.2a, when reading the patch sequence, then all references use `patch_row_bounds` (not the old name).
- [ ] Given `solver-workspaces.md` SS1.4, when reading step 3, then it references `patch_row_bounds`.
- [ ] Given `solver-abstraction.md` SS4.1, when reading the operations table, then the "Patch RHS/bounds" row is updated to reference both methods.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-009 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/solver-interface-trait.md`.
2. In SS1 trait definition: replace `fn patch_rhs_bounds(...)` with `fn patch_row_bounds(...)` and `fn patch_col_bounds(...)`. Update doc comments.
3. In SS2.3: rewrite the method contract section. Split into two subsections (SS2.3a for `patch_row_bounds`, SS2.3b for `patch_col_bounds`) or use a single section with clearly delineated contracts for each. Add the HiGHS/CLP mapping.
4. Search for all occurrences of `patch_rhs_bounds` in the four other files and update them.
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-interface-trait.md` — Replace method, update contract (primary edit)
- `src/specs/architecture/training-loop.md` — Update SS4.2a and SS5.3 references from `patch_rhs_bounds` to `patch_row_bounds`
- `src/specs/architecture/solver-workspaces.md` — Update SS1.4 step 3 reference
- `src/specs/architecture/solver-abstraction.md` — Update SS4.1 operations table and SS11.2-11.4 references
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-009 resolution row to Section 7 table

### Patterns to Follow

- **Method contract format**: Follow the existing SS2.1-SS2.9 pattern: preconditions table, postconditions table, fallibility note, API mapping.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT leave any stale references to `patch_rhs_bounds` in the five files listed above. Search each file thoroughly.
- Do NOT change the infallibility contract. Both new methods remain infallible (panic on invalid indices), consistent with the original.
- Do NOT sort indices internally. The HiGHS API accepts unsorted index sets; sorting is the caller's responsibility if desired for performance.
- Do NOT edit files beyond the five listed above. Other specs that reference `patch_rhs_bounds` by narrative description (not method name) do not need updating.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-009 (state vector format determines which patches are needed — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
