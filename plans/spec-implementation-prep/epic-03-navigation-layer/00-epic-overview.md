# Epic 03: Navigation Layer

## Goal

Update `src/specs/overview/implementation-ordering.md` to reflect the current (complete, gap-resolved) state of the spec corpus, and add a "Minimum Viable Reading List" section that gives developers a flat, dependency-ordered list of the 8-12 most essential spec files to read before writing any code.

## Scope

The `implementation-ordering.md` file was written during the spec-readiness plan (epic-05) when the spec corpus was still being created and 5 Blocker gaps were unresolved. Since then:

1. **All 5 Blockers are resolved** -- GAP-001 through GAP-005 have been incorporated into the spec prose. Phase 1 can now begin.
2. **New specs were added** during the spec-readiness plan (6 trait specs, 6 testing specs, `ecosystem-guidelines.md`) and potentially during the gap-resolution plan. The per-phase reading lists do not include these.
3. **The spec corpus is now complete** -- 84 spec files across 7 directories. The per-phase reading lists should be comprehensive.
4. **No "Minimum Viable Reading List" exists** -- a developer starting implementation has no guidance on which specs to read first for a high-level understanding of the system.

## Approach

This epic will be refined after learnings from Epics 01 and 02 are available. The refinement will use the exact file inventory and cross-reference relationships discovered during the consistency pass.

## Deliverables

- Updated `implementation-ordering.md` with:
  - Resolved blocker language (no more "must be resolved before Phase 1")
  - Complete per-phase spec reading lists
  - New "Minimum Viable Reading List" section
- `mdbook build` succeeds with no new warnings.

## Tickets

| Ticket     | Title                                                                     | Scope                                                                     |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ticket-006 | Update implementation-ordering blocker status and per-phase reading lists | Resolve blocker language, update all 8 phase reading lists with new specs |
| ticket-007 | Add Minimum Viable Reading List to implementation-ordering                | New section with flat, dependency-ordered list of essential specs         |
