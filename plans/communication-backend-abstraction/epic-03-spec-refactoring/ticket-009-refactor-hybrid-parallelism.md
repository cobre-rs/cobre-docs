# ticket-009 Refactor hybrid-parallelism.md for Backend Abstraction

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/specs/hpc/hybrid-parallelism.md` to replace the ferrompi-centric architecture description with a backend-agnostic description that references the `Communicator` trait. The initialization sequence (SS6) must be generalized to be parameterized by the selected backend, and the single-process mode (SS1.0a) must reference the `LocalBackend` instead of describing no-op behavior in prose.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/hybrid-parallelism.md`
- **Key decisions needed**:
  - How to restructure SS1 (Hybrid Architecture Overview) to present the trait abstraction without losing the ferrompi-specific detail that remains relevant for MPI deployments
  - How to generalize SS6 (Initialization Sequence) into a backend-parameterized sequence without duplicating the sequence for each backend
  - Whether SS1.0a (Single-Process Mode) should be preserved as a subsection or replaced entirely by a reference to the LocalBackend spec
- **Open questions**:
  - Should the ferrompi-specific details (SS1.2 capabilities table) remain in hybrid-parallelism.md or move to backend-ferrompi.md?
  - Should the initialization sequence become a generic algorithm with backend-specific steps, or should it reference the backend specs for initialization details?

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-005, ticket-006
- **Blocks**: ticket-011, ticket-014

## Effort Estimate

**Points**: 4
**Confidence**: Low (will be re-estimated during refinement)
