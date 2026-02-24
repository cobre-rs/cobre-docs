# ticket-016 Build the Cross-Reference Index File

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/cross-reference-index.md` as a new file in the cobre-docs book. This file will contain the 50-row spec-to-crate mapping table (from Epic 02 ticket-009), per-crate reading lists, outgoing/incoming cross-reference tables extracted programmatically from the spec files, and a dependency ordering table derived from the cross-reference structure.

Add the file to `src/SUMMARY.md` under the Specifications section so it appears in the book navigation.

This is the primary deliverable of Epic 05 and the only file modification in this epic.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/cross-reference-index.md` (new file, ~200-400 lines)
  - `src/SUMMARY.md` (add one entry: `- [Cross-Reference Index](./specs/cross-reference-index.md)`)
- **Key decisions needed**:
  - After Epic 02 ticket-009 produces the master spec-to-crate table, that table is directly embedded in this file
  - The dependency ordering: what determines "must be read before"? The natural ordering is: a spec A must be read before spec B if B has a cross-reference to A with a phrase like "see A for definitions" or "as defined in A"
  - Where in `SUMMARY.md` should the cross-reference index appear? Likely at the top of the Specifications section or at the end
- **Open questions**:
  - Should the cross-reference index be a single flat file or organized with sub-sections per crate?
  - Should the dependency ordering use a topological sort representation or a simpler "read in this order" narrative?
  - Should incoming cross-references be computed programmatically (grep-based extraction) or manually curated?
  - Should the index include links to algorithm reference pages (non-spec) or only spec-to-spec links?

## Dependencies

- **Blocked By**: ticket-009 (master spec-to-crate table), ticket-011 (cross-reference audit confirms links are accurate before indexing)
- **Blocks**: Nothing — this is a standalone new file addition

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
