# ticket-021 Update SUMMARY and Cross-Reference Index for Readiness Documents

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add the two new readiness documents (`implementation-ordering.md` and `spec-gap-inventory.md`) to `src/SUMMARY.md` under the Overview section and to `src/specs/cross-reference-index.md`. Ensure the documents are properly linked and discoverable. This is the final housekeeping ticket that completes the plan.

## Anticipated Scope

- **Files likely to be modified**: `src/SUMMARY.md` (add 2 entries under Overview), `src/specs/cross-reference-index.md` (add 2 rows to SS1 table, update relevant reading lists)
- **Key decisions needed**: Where to place the new documents in the SUMMARY sidebar (after production-scale-reference.md? in a new "Implementation" sub-section?)
- **Open questions**: Should the cross-reference-index assign these documents to a specific crate or mark them as cross-cutting (like design-principles.md)?

## Dependencies

- **Blocked By**: ticket-019, ticket-020
- **Blocks**: None (this is the final ticket)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
