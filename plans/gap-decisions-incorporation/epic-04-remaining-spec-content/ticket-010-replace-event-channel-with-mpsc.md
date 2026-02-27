# ticket-010 Replace Event Channel with std::sync::mpsc

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-032 decision to use `std::sync::mpsc` for the synchronous CLI event channel. Replace the `Option<broadcast::Sender<TrainingEvent>>` pattern in `src/specs/architecture/training-loop.md` SS2.1a with `Option<std::sync::mpsc::Sender<TrainingEvent>>`. Add a spec note documenting that tokio and crossbeam are not used unless absolutely necessary. Reserve `tokio::sync::broadcast` for the async Python/MCP interfaces (deferred crates only).

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (section 2.1a, possibly section 2.1b)
- **Key decisions needed**: Whether `mpsc::Sender` (single consumer) is sufficient or if multiple consumers need a different pattern (e.g., cloned senders, fan-out)
- **Open questions**: The current spec says "Consumers are additive -- multiple can subscribe simultaneously" which implies broadcast semantics. How does `mpsc` (single consumer) handle multiple consumers? Does the single consumer fan out internally?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
