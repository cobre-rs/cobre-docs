# ticket-015 Specify Python Worker Coordination API

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Define the complete Python API for coordinating multi-worker SDDP training, including worker process lifecycle management, result collection, error propagation from workers to the orchestrating process, and progress reporting across workers. This builds on the multi-process execution sections added by ticket-014 and provides the detailed API specifications (function signatures, class definitions, error handling) needed for implementation.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/interfaces/python-bindings.md` -- Expand the multi-process sections from ticket-014 with detailed API specifications
- **Key decisions needed**:
  - Whether to provide a high-level `DistributedTrainer` class or keep it as standalone functions
  - How worker errors (e.g., one worker crashes) propagate to the orchestrating process
  - How progress callbacks work across multiple workers (unified progress stream vs. per-worker)
- **Open questions**:
  - Should the API support heterogeneous workers (different numbers of OpenMP threads per worker)?
  - How does checkpointing interact with the multi-worker API?
  - Should the Python API expose backend selection, or should it auto-detect?

## Dependencies

- **Blocked By**: ticket-014 (multi-process execution sections must exist first)
- **Blocks**: ticket-017 (testing spec covers Python multi-process scenarios)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
