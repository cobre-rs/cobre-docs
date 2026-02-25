# ticket-011 Refactor training-loop.md and Remaining HPC Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/specs/architecture/training-loop.md`, `src/specs/hpc/synchronization.md`, `src/specs/hpc/work-distribution.md`, and `src/specs/hpc/shared-memory-aggregation.md` to reference the `Communicator` trait instead of direct ferrompi APIs. The training-loop.md updates are the most significant: SS2.1 (Iteration Lifecycle), SS4.3 (Parallel Distribution), SS4.3a (Single-Rank Variant), SS6.3 (Backward Pass Distribution), and SS6.3a (Single-Rank Backward) must all reference the trait.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/architecture/training-loop.md` -- SS2.1, SS4.3, SS4.3a, SS6.3, SS6.3a
  - `src/specs/hpc/synchronization.md` -- SS1.1, SS1.3, SS1.4
  - `src/specs/hpc/work-distribution.md` -- SS1.4, SS2.1, SS2.2, SS3.2
  - `src/specs/hpc/shared-memory-aggregation.md` -- SS1 (reference SharedMemoryProvider instead of direct SharedWindow)
- **Key decisions needed**:
  - Whether training-loop.md should show the generic signature `train<C: Communicator>(comm: &C, ...)` in the spec text, or keep it at the prose description level
  - How the single-rank variants (SS4.3a, SS6.3a) should be rephrased: as "when `comm.size() == 1`" behavior or as "when using `LocalBackend`"
  - Whether synchronization.md should remain ferrompi-centric (since it describes MPI sync semantics) or generalize to trait semantics
- **Open questions**:
  - How much of the single-rank variant prose can be eliminated now that `LocalBackend` formalizes the behavior?
  - Should shared-memory-aggregation.md's two-level aggregation optimization (SS2.2) reference the SharedMemoryProvider trait?

## Dependencies

- **Blocked By**: ticket-009, ticket-010 (hybrid-parallelism.md and communication-patterns.md refactored first)
- **Blocks**: ticket-013, ticket-014

## Effort Estimate

**Points**: 5
**Confidence**: Low (will be re-estimated during refinement)
