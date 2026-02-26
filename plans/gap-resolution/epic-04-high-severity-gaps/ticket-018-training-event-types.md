# ticket-018: Define TrainingEvent Enum in cobre-core (GAP-013)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Define the `TrainingEvent` enum in cobre-core with one variant per event type and typed payload structs. The training loop references event types (`ForwardPassComplete`, `BackwardPassComplete`, `ConvergenceUpdate`, etc.) with payload summaries but no Rust type definitions exist. These events are needed for convergence monitoring, logging, and future TUI/MCP integration hooks.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (SS2.1a -- replace narrative event list with struct definitions), possibly `src/specs/data-model/internal-structures.md` (if the enum is placed in the data model spec)
- **Key decisions needed**: Whether the enum lives in cobre-core (as the spec states) or in cobre-sddp (since only the training loop produces events)
- **Open questions**:
  - What is the complete list of event variants for the minimal viable solver?
  - Should events carry timing information (wall-clock timestamps)?
  - Is the event channel synchronous (`crossbeam`) or async (`tokio::broadcast`)? (relates to GAP-032)

## Dependencies

- **Blocked By**: None (independent of LP layout and state vector work)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
