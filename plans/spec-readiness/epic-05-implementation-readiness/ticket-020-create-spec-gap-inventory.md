# ticket-020 Create Spec Gap Inventory

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/overview/spec-gap-inventory.md` that catalogs every open question, ambiguity, missing information, or unresolved design decision in the spec corpus that would block Rust implementation. For each gap, classify it by severity (blocker, high, medium, low), identify the affected crate(s), and suggest a resolution path. This document serves as the transition artifact from specification to implementation -- it tells developers exactly what needs to be decided before they can write code.

## Anticipated Scope

- **Files likely to be modified**: Create `src/specs/overview/spec-gap-inventory.md`
- **Key decisions resolved by stakeholder review** (see 00-epic-overview.md):
  - Gap inventory should be scoped to the minimal viable SDDP solver (MPI binary with Buses/Lines/Thermals/Hydros, constant productivity, Expectation risk, Level-1 cut selection, Finite horizon, InSample sampling)
  - Deferred features (Python, TUI, MCP, TCP/shm, CVaR, Cyclic horizon, etc.) are NOT gaps — they are explicitly out of scope for minimal viable
  - However, deferred features that require architectural hooks in the minimal viable (e.g., trait dispatch infrastructure, crate boundary interfaces) should be flagged if the hook is underspecified
  - "Real crates, real boundaries" requirement means any spec gap in crate interfaces IS a blocker even if the feature behind it is deferred
- **Remaining open questions**: Classification criteria for severity levels; whether to include performance specification gaps or only functional gaps; whether to cover test infrastructure gaps

## Dependencies

- **Blocked By**: ticket-015 through ticket-018 (consistency pass must complete first); ticket-019 (implementation ordering may reveal additional gaps)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
