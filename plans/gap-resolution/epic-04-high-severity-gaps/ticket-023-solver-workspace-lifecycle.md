# ticket-023: Specify Solver Workspace Lifecycle (GAP-036)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Specify the complete lifecycle of solver workspaces: creation, reuse across iterations, destruction, and interaction with the threading model. The Solver Workspaces spec defines thread-local solver instances with per-stage basis caches, but the exact lifecycle phases and the interaction with rayon/thread-pool patterns are not fully specified. This ticket makes the lifecycle explicit and consistent with the threading model.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/solver-workspaces.md` (lifecycle specification), `src/specs/architecture/training-loop.md` (verify workspace usage is consistent)
- **Key decisions needed**: Whether workspaces are created once at training start or lazily on first use per thread
- **Open questions**:
  - Are workspaces pinned to threads (thread-local storage) or distributed from a pool?
  - How does basis caching interact with workspace reuse -- is the basis per-stage or per-workspace?
  - When a rayon thread steals work from another thread's queue, does it need a different workspace?

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines workspace LP structure)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
