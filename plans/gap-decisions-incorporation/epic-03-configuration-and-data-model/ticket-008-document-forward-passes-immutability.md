# ticket-008 Document Forward Passes Immutability Precondition

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-034 decision to document that `forward_passes` is immutable after initialization. Add this as an explicit precondition in `src/specs/architecture/cut-management-impl.md` where the cut pool capacity formula `warm_start_cuts + max_iterations x forward_passes` depends on this invariant. Also add a forward reference noting that a dynamic forward_passes scheduler is deferred to a future enhancement.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/cut-management-impl.md` (section 1.3 capacity formula), possibly `src/specs/architecture/training-loop.md` (forward pass section to document the invariant)
- **Key decisions needed**: Whether to add the precondition as a blockquote note or a formal subsection
- **Open questions**: Does the `TrainingConfig` struct (if defined by earlier tickets) need an explicit `immutable after construction` note for the `forward_passes` field?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
