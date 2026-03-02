# ticket-015 Update Cross-Reference Index for Affected Entries

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Perform an incremental update of `src/specs/cross-reference-index.md` for entries affected by the cleanup in Epics 01-03. This includes: (1) removing references to the deleted Binary Formats Appendix A from outgoing/incoming reference lists, (2) adding the new `decision-log.md` file to the index, (3) updating section counts for files whose sections changed (e.g., binary-formats.md lost Appendix A), and (4) verifying the dependency order for files that gained or lost cross-references.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/cross-reference-index.md`
- **Key decisions needed**:
  - Whether to add `decision-log.md` as a new entry with its own outgoing/incoming references (yes, per index methodology)
  - Which category to assign `decision-log.md` (likely `overview`, primary crate `(cross-cutting)`)
  - Whether any files changed their outgoing reference count enough to affect the dependency order (section 5)
- **Open questions**:
  - How many outgoing references will `decision-log.md` have? This depends on the decisions cataloged in ticket-012.
  - Did any spec files gain new cross-references to `solver-abstraction.md` SS11.4 as part of the cleanup that are not yet in the index?

## Dependencies

- **Blocked By**: ticket-002 (binary-formats cleanup), ticket-003 (Appendix A cross-reference cleanup), ticket-007 (solver-abstraction cleanup), ticket-012 (Decision Log creation)
- **Blocks**: ticket-017 (final verification)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
