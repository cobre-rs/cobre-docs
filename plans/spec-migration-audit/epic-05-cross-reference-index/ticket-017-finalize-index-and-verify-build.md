# ticket-017 Finalize Cross-Reference Index and Verify mdBook Build

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

After ticket-016 creates the cross-reference index file, verify that the mdBook build succeeds with the new file, that the index appears in the built HTML book with correct navigation, and that all cross-reference links within the index file itself resolve correctly. This is the quality gate for Epic 05.

Additionally, verify that the SUMMARY.md change from ticket-016 renders correctly — the index must appear under the correct parent in the left navigation sidebar.

## Anticipated Scope

- **Files likely to be modified**: Read-only verification. If links in `cross-reference-index.md` are broken, fix them in this ticket.
- **Key decisions needed**:
  - After ticket-016 is executed, does the file as generated pass `mdbook build` without warning?
  - Are there any mdBook-specific rendering issues with very large tables (the 50-row spec-to-crate table and the outgoing/incoming cross-reference tables could be large)?
- **Open questions**:
  - Does mdBook have a table size limit or rendering issue with 50+ row tables?
  - Should the cross-reference index use HTML `<details>` collapsible sections for the per-spec link tables (to reduce page length)?
  - Is there a `mdbook-linkcheck` or similar tool configured in the cobre-docs build to catch broken links in the new file?

## Dependencies

- **Blocked By**: ticket-016 (file must exist before build can be verified)
- **Blocks**: Nothing

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
