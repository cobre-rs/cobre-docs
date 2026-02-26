# ticket-022: Specify ferrompi Standalone API (GAP-017)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create an API reference specification for the ferrompi crate that defines each public method's Rust signature, preconditions, postconditions, error types, and `unsafe` boundaries. Methods like `init_with_threading`, `allgatherv`, `allreduce`, `bcast`, `barrier`, `SharedWindow::new`, `SharedWindow::as_slice`, and `SharedWindow::fence` are referenced by multiple specs but have no standalone API specification. This is the contract that the cobre-comm ferrompi backend implements against.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/backend-ferrompi.md` (add API reference section or create a new dedicated section)
- **Key decisions needed**: Whether to create a new spec file or extend the existing backend-ferrompi spec
- **Open questions**:
  - Which methods require `unsafe` and what are the safety invariants the caller must uphold?
  - Does `SharedWindow` map to MPI-3 one-sided communication or MPI shared memory windows?
  - Should the API spec include the `#[repr(C)]` layout requirements for types passed through MPI?

## Dependencies

- **Blocked By**: None (ferrompi is a standalone crate)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
