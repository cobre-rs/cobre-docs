# Epic 03: Navigation Layer

## Goal

Update `src/specs/overview/implementation-ordering.md` to reflect the current (complete, gap-resolved) state of the spec corpus, add a "Minimum Viable Reading List" section that gives developers a flat, dependency-ordered list of the 10 most essential spec files to read before writing any code, and add a "How to Use This Specification" guide that explains the abstraction boundary between the spec corpus and implementation work.

## Scope

The `implementation-ordering.md` file was written during the spec-readiness plan (epic-05) when the spec corpus was still being created and 5 Blocker gaps were unresolved. Since then:

1. **All 5 Blockers are resolved** -- GAP-001 through GAP-005 have been incorporated into the spec prose. Phase 1 can now begin.
2. **New specs were added** during the spec-readiness plan (7 trait specs, 6 testing specs, `ecosystem-guidelines.md`) and the gap-resolution plan added content to existing specs. The per-phase reading lists do not include these additions -- 15 specs are missing.
3. **The spec corpus is now complete** -- 84 spec files across 7 directories. The per-phase reading lists should be comprehensive.
4. **No "Minimum Viable Reading List" exists** -- a developer starting implementation has no guidance on which specs to read first for a high-level understanding of the system.
5. **No spec usage guide exists** -- a developer has no document explaining what cobre-docs is, what abstraction level it operates at, and where implementation planning begins.

## Approach

Refined using learnings from Epics 01-02. Key findings:

- Blocker language cleanup is already complete (epic-01, tickets 001-002). No blocker-related edits are needed in `implementation-ordering.md`.
- The consistency pass (epic-02) finalized the file inventory, enabling precise identification of the 15 missing specs.
- Overview files use plain numbered headings (`## 1.`, `## 2.`); no `SS` or `§` prefixes.

## Deliverables

- Updated `implementation-ordering.md` with:
  - Complete per-phase spec reading lists (15 additions across 7 of the 8 phases)
  - New "Minimum Viable Reading List" section (section 9, 10 specs in dependency order)
  - Cross-reference to the spec usage guide
- New `src/specs/overview/spec-usage-guide.md` with:
  - What cobre-docs is and is not
  - What you will and will not find
  - Worked example mapping spec content to implementation ticket
  - Where implementation planning begins
- Updated `src/SUMMARY.md` registering the new file
- `mdbook build` succeeds with no new warnings.

## Tickets

| Ticket     | Title                                                      | Scope                                                                                    |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ticket-006 | Update implementation-ordering per-phase reading lists     | Add 15 missing specs to the 8 phase reading lists                                        |
| ticket-007 | Add Minimum Viable Reading List to implementation-ordering | New section 9 with flat, dependency-ordered list of 10 essential specs                   |
| ticket-008 | Add "How to Use This Specification" guide                  | New file explaining abstraction boundary, worked example, and entry point for developers |
