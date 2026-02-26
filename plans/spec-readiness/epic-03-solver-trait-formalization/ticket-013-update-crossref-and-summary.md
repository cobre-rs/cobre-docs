# ticket-013 Update Cross-Reference Index and SUMMARY for All Trait Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add rows to `src/specs/cross-reference-index.md` for all 12 new spec files created across epics 01, 02, and 03 (6 trait specs + 6 test specs). Add corresponding entries to `src/SUMMARY.md` under the Architecture section. Update the per-crate reading lists in cross-reference-index.md to include the new trait specs in the correct dependency order. This is a batch update after all trait spec files are created, avoiding multiple partial updates.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/cross-reference-index.md` (add 12 rows to SS1 table, update per-crate reading lists for cobre-sddp, cobre-solver, cobre-stochastic), `src/SUMMARY.md` (add 12 new page entries under Architecture)
- **Key decisions needed**: Exact crate assignments for each new spec (which traits are primary to cobre-sddp vs cobre-solver vs cobre-stochastic); reading list ordering within each crate
- **Open questions**: Should the trait specs be grouped together in SUMMARY.md (e.g., a "Trait Specifications" sub-section) or interspersed with existing architecture specs?

## Dependencies

- **Blocked By**: ticket-001 through ticket-012 (all trait and test specs must exist)
- **Blocks**: ticket-014

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
