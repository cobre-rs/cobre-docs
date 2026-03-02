# ticket-012 Create Central Decision Log

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/overview/decision-log.md` as the central record of all cross-cutting architectural decisions in the Cobre spec corpus. The Decision Log catalogs each decision with its date, status (active/superseded), the primary spec section that owns it, and a list of all spec files affected by it. This prevents future scenarios where a decision is updated in the primary spec but not propagated to all affected files.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/overview/decision-log.md` (new file)
  - `src/SUMMARY.md` (add entry under Specifications > Overview)
  - `src/specs/overview.md` (add entry to the overview section listing)
- **Key decisions needed**:
  - Exact table structure for the Decision Log (columns: ID, Date, Status, Decision, Primary Spec, Affected Files, Superseded By)
  - How to categorize decisions (LP construction strategy, serialization format, parallelism model, dispatch pattern, etc.)
  - Whether to include spec-local decisions or only cross-cutting ones
  - How many decisions to extract from the corpus (initial estimate: 15-25 cross-cutting decisions based on grep for "Decision" and "adopted" blockquotes)
- **Open questions**:
  - Should the Decision Log use plain numbered sections (overview convention) or a table-per-category format?
  - Should each decision entry link to a specific line/section, or just to the file?
  - Should the log include a "Last Verified" date column for tracking when affected files were last checked for consistency?

## Dependencies

- **Blocked By**: ticket-001 through ticket-011 (all cleanup must be complete before cataloging decisions, to avoid cataloging stale state)
- **Blocks**: ticket-014 (inline decision markers reference the Decision Log)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
