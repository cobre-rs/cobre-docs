# ticket-017 Remove NEWAVE Migration Section

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Delete the 6 stub migration files in `src/migration/` and remove the NEWAVE Migration section from SUMMARY.md. These files contain only 3 lines each (title and placeholder text) with no actual content. Removing them declutters the mdBook and aligns with the policy that NEWAVE file parsing is deferred to later work.

## Anticipated Scope

- **Files likely to be modified**: `src/SUMMARY.md` (remove lines 116-123, the NEWAVE Migration section)
- **Files to delete**: All 6 files under `src/migration/` (exact filenames to be confirmed during refinement)
- **Key decisions needed**: Whether any redirect or "deferred" note should replace the migration section in SUMMARY.md, or whether it should simply be removed
- **Open questions**:
  - Should a one-line note in `src/specs/deferred.md` mention that NEWAVE migration documentation is planned for the future?
  - Are there any internal cross-references pointing to `src/migration/` pages that would break?
  - Does the mdBook build cleanly after the removal?

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-018 (the reference audit should happen after migration stubs are gone)

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
