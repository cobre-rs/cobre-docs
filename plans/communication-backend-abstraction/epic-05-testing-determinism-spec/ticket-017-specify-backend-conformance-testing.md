# ticket-017 Specify Backend Conformance and Interchangeability Testing

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create a new spec document `src/specs/hpc/backend-testing.md` (Sections 1-3) that defines the conformance test suite for the `Communicator` trait. This includes: (1) a method-level conformance test matrix that every backend must pass, (2) interchangeability tests that verify identical SDDP results across backends given the same inputs and rank count, and (3) performance regression tests for the ferrompi backend to ensure the trait abstraction does not degrade MPI performance.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/backend-testing.md` (create new file, Sections 1-3)
- **Key decisions needed**:
  - The exact set of conformance tests per trait method (edge cases: empty buffers, single rank, mismatched sizes)
  - The reference case to use for interchangeability testing (a small but non-trivial SDDP case that completes in seconds)
  - Performance regression thresholds for the ferrompi backend (e.g., < 1% overhead vs. direct ferrompi calls)
- **Open questions**:
  - Should conformance tests be specified as a formal test suite (with test names and assertions) or as requirements that an implementation test suite must satisfy?
  - Should the interchangeability test compare ferrompi vs. TCP vs. shm, or only ferrompi vs. local?
  - What is the minimum rank count to test meaningful multi-rank behavior? (2 is sufficient for correctness, but 4+ tests load balancing)

## Dependencies

- **Blocked By**: ticket-001 (trait contract defines what to test), ticket-005 through ticket-008 (backend specs define what exists), ticket-011 (refactored specs define expected behavior)
- **Blocks**: ticket-018

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
