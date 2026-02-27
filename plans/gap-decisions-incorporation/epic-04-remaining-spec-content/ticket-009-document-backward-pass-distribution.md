# ticket-009 Document Backward Pass Trial State Distribution Strategy

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-026 decision to document the backward trial state distribution strategy in `src/specs/architecture/training-loop.md` SS6.3. Specify contiguous block assignment for backward trial states across MPI ranks, consistent with the forward pass pattern. Document that all ranks receive the same set of trial states via `allgatherv` and each rank processes its assigned subset. Clarify load balancing when trial state count differs from forward pass count.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (section 6.3 "Parallel Distribution")
- **Key decisions needed**: Whether to add a subsection SS6.3a or expand the existing SS6.3 text
- **Open questions**: Does the current SS6.3 text need to be replaced or only supplemented? How does state deduplication (future feature) interact with this distribution strategy?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
