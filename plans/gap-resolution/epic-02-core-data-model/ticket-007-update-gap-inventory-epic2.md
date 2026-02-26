# ticket-007: Update Spec-Gap-Inventory for GAP-001 Through GAP-003

## Context

### Background

After tickets 004, 005, and 006 resolve GAP-001, GAP-002, and GAP-003 respectively, the spec-gap-inventory must be updated to reflect the resolution. This ensures the inventory remains the single source of truth for gap status.

### Relation to Epic

Final ticket of Epic 2. Pure bookkeeping -- marks resolved gaps in the inventory.

### Current State

`src/specs/overview/spec-gap-inventory.md` SS3 contains a table with 38 gaps. GAP-001, GAP-002, and GAP-003 are listed with Blocker severity and resolution paths that match what was implemented in tickets 004-006.

The table uses a 7-column format: ID, Severity, Affected Crate(s), Spec File(s), Section(s), Description, Resolution Path.

## Specification

### Requirements

1. Update GAP-001 in the spec-gap-inventory table:
   - Change severity or add a status indicator showing "Resolved"
   - Update the Resolution Path column to reference the actual resolution (SystemRepresentation struct sketch in Internal Structures SS1)
2. Update GAP-002:
   - Mark as "Resolved"
   - Resolution: Decommissioned = Non-existing, documented in Internal Structures SS2
3. Update GAP-003:
   - Mark as "Resolved"
   - Resolution: rkyv serialization, documented in Input Loading Pipeline SS6
4. Update the summary statistics in SS6 to reflect 3 fewer Blocker gaps (5 -> 2 Blockers remaining)
5. Add a new section or note tracking resolution dates and the plan that resolved them

### Inputs/Props

- Current `src/specs/overview/spec-gap-inventory.md`
- Completed tickets 004, 005, 006

### Outputs/Behavior

Updated spec-gap-inventory with 3 gaps marked as resolved and summary statistics adjusted.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given the gap inventory is read, when GAP-001 is found, then it is marked as "Resolved" with reference to Internal Structures SS1
- [ ] Given the gap inventory is read, when GAP-002 is found, then it is marked as "Resolved" with reference to Internal Structures SS2
- [ ] Given the gap inventory is read, when GAP-003 is found, then it is marked as "Resolved" with reference to Input Loading Pipeline SS6
- [ ] Given the summary statistics are read, when the Blocker count is checked, then it shows 2 (down from 5)
- [ ] Given the summary statistics are read, when the total is verified by manual counting from the table, then the computed totals match the stated totals

## Implementation Guide

### Suggested Approach

1. Open `src/specs/overview/spec-gap-inventory.md`
2. In the SS3 table, update GAP-001, GAP-002, GAP-003 rows:
   - Prepend "**Resolved**" to the Description column, or add a Status column
   - Update the Resolution Path to show the actual resolution with section references
3. Update the SS6 summary statistics table to reflect resolved counts
4. Verify the per-crate table also reflects the changes (Blocker counts for cobre-core, cobre-io should decrease)
5. Verify `mdbook build` succeeds

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/overview/spec-gap-inventory.md`

### Patterns to Follow

- The gap inventory uses a 7-column table format -- maintain consistency
- Summary statistics must be computed from the detailed table and verified (per learnings)
- Use the same section reference style as other entries

### Pitfalls to Avoid

- Do NOT delete the gap rows -- mark them as resolved but keep the original description for historical reference
- Do NOT change the Severity column value -- a resolved Blocker was still a Blocker, it's the status that changes
- Do NOT forget to update BOTH the per-severity summary table AND the per-crate summary table
- Verify that the math is correct: recount all rows to confirm totals match

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes

## Dependencies

- **Blocked By**: ticket-004 (GAP-001), ticket-005 (GAP-002), ticket-006 (GAP-003)
- **Blocks**: None within Epic 2

## Effort Estimate

**Points**: 1
**Confidence**: High
