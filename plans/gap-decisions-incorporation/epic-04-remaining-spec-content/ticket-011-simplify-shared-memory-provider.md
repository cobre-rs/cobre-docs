# ticket-011 Simplify SharedMemoryProvider Bound for Minimal Viable

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-033 decision to simplify the `SharedMemoryProvider` bound on the training entry point. For Phase 5 (minimal viable), each MPI rank uses **isolated per-rank memory** -- no MPI shared memory windows. The `SharedMemoryProvider` trait and MPI shared memory optimization for the `System` struct are deferred to a post-profiling optimization pass, gated on memory pressure measurements on large nodes. Update relevant specs to document this simplification and the conditions under which shared memory would be re-introduced.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/communicator-trait.md` (section 4 SharedMemoryProvider), `src/specs/architecture/training-loop.md` (if it references SharedMemoryProvider in the train function signature), possibly `src/specs/hpc/hybrid-parallelism.md` (section 1.3 shared memory layout)
- **Key decisions needed**: Whether to remove `SharedMemoryProvider` from the `train()` generic bound entirely or keep it with `HeapFallback` as the default implementation; how to document the deferral without losing the architectural design for future use
- **Open questions**: Does removing `SharedMemoryProvider` from the train signature require changes to the `Communicator` trait definition? Which specs currently reference `SharedMemoryProvider` in the context of the training entrypoint?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
