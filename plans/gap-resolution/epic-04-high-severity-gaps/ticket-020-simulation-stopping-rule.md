# ticket-020: Specify Simulation-Based Stopping Rule Interaction (GAP-015)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Specify how the simulation-based stopping rule interacts with the main training loop. The convergence monitoring spec describes the rule but leaves the integration mechanics underspecified: whether simulation reuses the training LP infrastructure, whether it blocks the training loop, thread consumption, and scenario source. This ticket makes the interaction explicit for the minimal viable solver.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/convergence-monitoring.md` (SS2.3 step 4), `src/specs/architecture/training-loop.md` (phase boundary for simulation check)
- **Key decisions needed**: Whether simulation runs synchronously (blocking the iteration) or asynchronously
- **Open questions**:
  - Does the simulation use the same solver workspaces as training, or does it require separate LP instances?
  - How many scenarios are used for the simulation check, and are they drawn from a separate seed?
  - On which iterations is the simulation check triggered (every N iterations, or convergence-dependent)?

## Dependencies

- **Blocked By**: ticket-009 (state vector format affects simulation state management)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
