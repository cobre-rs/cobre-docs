# ticket-024: Clarify Lower Bound Computation (GAP-037)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Clarify the lower bound computation in the training loop. The spec states the lower bound is the "first-stage LP objective value" obtained via `allreduce` with `ReduceOp::Min`, but if all ranks solve the same deterministic stage-1 LP (fixed initial state), the values should be identical across ranks. The use of `Min` implies ranks may produce different values. This ticket resolves the ambiguity: does each rank solve stage 1 once or per-scenario, and why is `Min` used?

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (SS4.3 -- lower bound computation)
- **Key decisions needed**: Whether each rank solves stage 1 for each of its assigned scenarios (different theta approximations as cuts accumulate) or only once
- **Open questions**:
  - If stage 1 is solved per-scenario, do different scenarios at stage 1 differ only in theta (the future cost approximation), or also in inflow noise?
  - Is the `allreduce Min` a defensive measure against numerical noise, or does it reflect genuinely different first-stage solutions?
  - Should the lower bound be the minimum, mean, or a specific rank's stage-1 objective?

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines the theta variable position)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
