# ticket-016 Run Full-Corpus Consistency Audit

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Run a comprehensive grep-based consistency audit across the entire spec corpus (`src/specs/**/*.md` and `src/crates/**/*.md`) to verify that all stale patterns have been eliminated and no new inconsistencies were introduced during cleanup. Produce a verification report listing any remaining issues.

## Anticipated Scope

- **Files likely to be modified**: None (read-only audit). If issues are found, they are fixed in-ticket or flagged for a follow-up.
- **Key decisions needed**:
  - The complete list of grep patterns to check (built from the master plan success metrics plus any patterns discovered during Epics 01-02)
  - Whether to include a numerical value consistency check (e.g., every "22.3 GB" reference should point to the same canonical source)
  - Whether to check for orphaned cross-references (links to sections that no longer exist)
- **Open questions**:
  - Should the audit also verify that `mdbook build` produces zero warnings (not just zero errors)?
  - Should the audit check for consistency of the production-scale reference values across all files (60 stages, 160 hydros, 2080 state dimension, etc.)?

## Dependencies

- **Blocked By**: ticket-004, ticket-005, ticket-006, ticket-007, ticket-008, ticket-009, ticket-010, ticket-011 (all cleanup tickets)
- **Blocks**: ticket-017 (final verification report)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
