# ticket-025: Specify Upper Bound Variance Aggregation via Welford's Algorithm (GAP-038)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Specify the MPI aggregation protocol for upper bound variance computation. After the forward pass, each rank has per-scenario total costs. Computing the upper bound standard deviation requires aggregating individual cost deviations across all ranks, but `allreduce Sum` only provides global sums, not individual values. This ticket specifies the Welford-style aggregation using three values `(sum_costs, sum_costs_squared, count)` with `ReduceOp::Sum`, and documents the variance formula with Bessel's correction.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (SS4.3 -- upper bound computation), `src/specs/architecture/convergence-monitoring.md` (SS1 -- convergence test uses UB std)
- **Key decisions needed**: Whether the aggregation uses three separate `allreduce` calls or a single `allreduce` on a 3-element array
- **Open questions**:
  - Is the variance computed per-iteration only, or is there a running variance across iterations?
  - Should the formula use `count - 1` (Bessel's correction) or `count` denominator?
  - Is numerical stability of the sum-of-squares approach sufficient, or should Welford's online update form be used per-rank before the allreduce?

## Dependencies

- **Blocked By**: None (independent of LP layout specifics)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
