# ticket-006 Update Implementation-Ordering Blocker Status and Per-Phase Reading Lists

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/specs/overview/implementation-ordering.md` to reflect the current state of the spec corpus: mark all 5 Blocker gaps as resolved, and update the per-phase spec reading lists (Phases 1-8) to include the new spec files that were added during the spec-readiness and gap-resolution plans but are not yet referenced in the phase reading lists.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/overview/implementation-ordering.md`
- **Key decisions needed**:
  - Which new spec files belong in which phase's reading list (e.g., do the 6 trait specs and 6 testing specs go in Phase 6? Phase 3?)
  - Whether the Phase 6 reading list needs to be split due to size (it already has 14 entries)
  - How to phrase the blocker resolution (past tense vs. removal of blocker language)
- **Open questions**:
  - Does the file currently reference the 5 Blockers as unresolved, or was the blocker language written without explicit gap references?
  - Are there new specs from the gap-resolution plan that are not in the cross-reference index yet?
  - Should `ecosystem-guidelines.md` be added to a phase reading list, or is it a meta-document that stays outside the phase structure?

## Dependencies

- **Blocked By**: ticket-002-update-ecosystem-guidelines-blocker-table.md (blocker resolution context), ticket-005-fix-section-prefix-low-count-and-openmp-audit.md (consistency pass completes the file inventory)
- **Blocks**: ticket-007-add-minimum-viable-reading-list.md

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
