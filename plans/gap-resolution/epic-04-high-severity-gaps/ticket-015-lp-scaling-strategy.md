# ticket-015: Adopt Single-Phase LP Scaling as Baseline (GAP-010)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Resolve the open point in Solver Abstraction SS3 by formally adopting single-phase scaling as the baseline LP scaling strategy for the minimal viable solver. Remove the "open point" marker and document the decision, including the rationale for deferring two-phase scaling to a later optimization pass.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/solver-abstraction.md` (SS3 -- open point removal and baseline adoption)
- **Key decisions needed**: Whether single-phase scaling is applied universally or only when numerical difficulties are detected
- **Open questions**:
  - Does HiGHS apply its own internal scaling by default, making an explicit scaling strategy redundant?
  - Should the scaling strategy be configurable or hardcoded for the minimal viable solver?

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines variable magnitudes that scaling must address)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
