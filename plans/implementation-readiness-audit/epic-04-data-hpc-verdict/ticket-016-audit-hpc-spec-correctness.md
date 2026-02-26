# ticket-016 Audit HPC Spec Correctness

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Verify that every MPI collective operation in the spec corpus is specified with exact type parameters (data type, operation type, buffer sizes). Verify that the threading model (rayon) is consistently referenced with concrete configuration (thread count, pool initialization, thread-local workspace access). Verify that NUMA and cache-awareness guidance is concrete enough for implementation (specific layout requirements, alignment constraints, hot-path allocation avoidance). Verify that the ferrompi API reference matches the real crate for all operations actually used by the minimal viable solver.

## Anticipated Scope

- **Files likely to be modified**: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-016-hpc-correctness.md` (new file)
- **Key decisions needed**: What level of MPI parameter specificity is "concrete enough" (exact C types vs Rust types vs just the operation name)
- **Open questions**:
  - Does GAP-018 (threading model) materially affect the HPC correctness of existing specs, or is it only about the choice between rayon and std::thread?
  - Are all allgatherv calls specified with their buffer size formulas?
  - Does the SharedWindow API in the spec match the real ferrompi SharedWindow for the operations used in shared-memory aggregation?
  - Are the NUMA-awareness guidelines actionable (specific struct layouts) or aspirational (general guidance)?

## Dependencies

- **Blocked By**: ticket-006 (cobre-comm audit), ticket-008 (ferrompi audit)
- **Blocks**: ticket-017 (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
