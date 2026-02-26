# ticket-013: Add AR Lag Fixing Constraints to LP Formulation (GAP-008)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add the AR lag fixing constraints to the LP Formulation spec. These are equality constraints that bind each lag variable to its incoming state value, and they appear in the cut-relevant top region of the LP row layout. Their duals are the cut coefficients for inflow lag state variables. The LP formulation currently shows the AR dynamics equation but not these separate fixing constraints.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/math/lp-formulation.md` (new section or subsection of SS5), `src/specs/architecture/solver-abstraction.md` (verify row layout includes these)
- **Key decisions needed**: Whether these are formally separate from the AR dynamics equation or just an explicit restatement
- **Open questions**:
  - Are the lag fixing constraints one constraint per (hydro, lag), or can they be combined?
  - The LP layout (ticket-008) places these at rows `[N, N + N*L)` -- does this agree with the mathematical formulation?

## Dependencies

- **Blocked By**: ticket-008 (row layout must define the position of these constraints)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
