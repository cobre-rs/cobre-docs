# ticket-010: Update Spec-Gap-Inventory and Cross-References for GAP-004 and GAP-005

## Context

### Background

After tickets 008 and 009 resolve GAP-004 and GAP-005, the spec-gap-inventory must be updated to mark these gaps as resolved. Additionally, the LP layout changes in ticket-008 may require minor cross-reference updates in other specs that reference the LP layout convention.

### Relation to Epic

Final ticket of Epic 3. Bookkeeping and cross-reference consistency.

### Current State

`src/specs/overview/spec-gap-inventory.md` has GAP-004 and GAP-005 listed as Blocker severity. After ticket-007 (Epic 2), GAP-001 through GAP-003 are already resolved, leaving 2 Blockers.

## Specification

### Requirements

1. Update GAP-004 in the spec-gap-inventory:
   - Mark as "Resolved"
   - Resolution: LP memory layout with exact index formulas in Solver Abstraction SS2; StageTemplate construction ownership in Solver Interface Trait SS4.4
2. Update GAP-005:
   - Mark as "Resolved"
   - Resolution: State vector format, patch sequence, and indexer structs in Training Loop SS5
3. Update summary statistics: Blocker count goes from 2 to 0 (all 5 Blockers resolved)
4. Verify cross-references in other specs that reference the LP layout:
   - `src/specs/architecture/cut-management-impl.md` (references SS5 for cut pool and SS2 for dual extraction)
   - `src/specs/architecture/solver-workspaces.md` (references SS2 for layout convention)
   - `src/specs/math/lp-formulation.md` (the source math that the LP layout implements)
   - Add or update cross-references as needed to point to the new subsections

### Inputs/Props

- Updated `src/specs/overview/spec-gap-inventory.md` (after ticket-007)
- Completed tickets 008 and 009

### Outputs/Behavior

Updated spec-gap-inventory with all 5 Blockers resolved. Cross-references verified.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given the gap inventory is read, when GAP-004 is found, then it is marked as "Resolved" with reference to Solver Abstraction SS2 and Solver Interface Trait SS4.4
- [ ] Given the gap inventory is read, when GAP-005 is found, then it is marked as "Resolved" with reference to Training Loop SS5
- [ ] Given the summary statistics are read, when the Blocker count is checked, then it shows 0
- [ ] Given the total gap count is verified, when all rows are recounted, then the computed totals match the stated totals
- [ ] Given the cross-references in cut-management-impl.md are checked, when the LP layout is referenced, then the references point to the correct (possibly renumbered) subsections in Solver Abstraction SS2
- [ ] Given `mdbook build` is run, when the build completes, then there are no broken links

## Implementation Guide

### Suggested Approach

1. Open `src/specs/overview/spec-gap-inventory.md`
2. Update GAP-004 and GAP-005 rows to "Resolved"
3. Update summary statistics (both per-severity and per-crate tables)
4. Grep for references to "Solver Abstraction SS2" across the spec corpus to verify cross-references still work
5. If SS2 subsections were renumbered in ticket-008, update any external references
6. Run `mdbook build` to verify no broken links

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/overview/spec-gap-inventory.md`
- **Possibly edit**: Cross-reference updates in `cut-management-impl.md`, `solver-workspaces.md`, `training-loop.md` if subsection numbers changed

### Patterns to Follow

- Same gap inventory table format as ticket-007
- Verify summary statistics match by manual counting

### Pitfalls to Avoid

- Do NOT change the gap severity -- a resolved Blocker was still a Blocker
- Do NOT forget to update the per-crate summary table
- If cross-reference updates are needed, verify the exact subsection numbers from the ticket-008 changes

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after all changes

## Dependencies

- **Blocked By**: ticket-008 (GAP-004), ticket-009 (GAP-005)
- **Blocks**: None within Epic 3

## Effort Estimate

**Points**: 2
**Confidence**: High
