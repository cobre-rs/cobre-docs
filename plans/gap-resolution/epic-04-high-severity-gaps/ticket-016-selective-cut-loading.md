# ticket-016: Adopt Selective Cut Addition as Baseline (GAP-011)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Resolve the open question in Solver Abstraction SS5.4 by formally adopting selective cut addition as the baseline cut loading strategy for the minimal viable solver. Remove the "open question" marker, document that bulk loading with bound deactivation is a deferred optimization, and specify the implications for CutBatch assembly logic and solver presolve configuration.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/solver-abstraction.md` (SS5.4 -- open question removal), `src/specs/architecture/cut-management-impl.md` (CutBatch assembly logic implications)
- **Key decisions needed**: Whether selective addition means one-cut-at-a-time or batch-of-new-cuts-per-iteration
- **Open questions**:
  - Does selective addition interact with the cut pool pre-allocation (deterministic slot assignment)?
  - Should presolve be disabled for incremental solves after cut addition, or is the solver expected to handle it?

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines cut row positions)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
