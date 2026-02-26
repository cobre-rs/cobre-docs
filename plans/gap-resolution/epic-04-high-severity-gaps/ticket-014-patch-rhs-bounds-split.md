# ticket-014: Split patch_rhs_bounds into Row and Column Methods (GAP-009)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Resolve the `patch_rhs_bounds` method ambiguity in the Solver Interface Trait. The current method accepts `&[(usize, f64)]` but conflates row-index (RHS patching) and column-index (bound patching) semantics. Split into two separate methods -- `patch_row_bounds` and `patch_col_bounds` -- with explicit lower/upper pairs, and document the mapping to HiGHS `changeRowsBoundsBySet` and `changeColsBoundsBySet`.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/solver-interface-trait.md` (SS2.3), `src/specs/architecture/solver-abstraction.md` (any references to the old method)
- **Key decisions needed**: Whether to use `(usize, f64, f64)` tuples for lower/upper pairs or a tagged union approach
- **Open questions**:
  - Does the state patching sequence (ticket-009) require both row and column bound patches, or only row RHS patches?
  - Should the method accept sorted index arrays for HiGHS performance, or sort internally?

## Dependencies

- **Blocked By**: ticket-009 (state vector format determines which patches are needed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
