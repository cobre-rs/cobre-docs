# ticket-020 Create Spec Gap Inventory

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/overview/spec-gap-inventory.md` that catalogs every open question, ambiguity, missing information, or unresolved design decision in the spec corpus that would block Rust implementation. For each gap, classify it by severity (blocker, high, medium, low), identify the affected crate(s), and suggest a resolution path. This document serves as the transition artifact from specification to implementation -- it tells developers exactly what needs to be decided before they can write code.

## Anticipated Scope

- **Files likely to be modified**: Create `src/specs/overview/spec-gap-inventory.md`
- **Key decisions needed**: Classification criteria for severity levels; whether to include the "open points" and "open questions" already documented in existing specs (e.g., solver-abstraction.md has several) or only identify new gaps; how to handle deferred features (they are not gaps, but they have interface implications)
- **Open questions**: Should the inventory include performance specification gaps (e.g., "what latency target for LP solve?") or only functional gaps? Should it cover test infrastructure gaps (e.g., "test harness for multi-rank communication testing")?

## Dependencies

- **Blocked By**: ticket-015 through ticket-018 (consistency pass must complete first); ticket-019 (implementation ordering may reveal additional gaps)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
