# ticket-002 Update Ecosystem Guidelines Blocker Table

## Context

### Background

The file `src/specs/overview/ecosystem-guidelines.md` contains a "Implementation Readiness State" section (section 9) that lists the 5 Blocker gaps (GAP-001 through GAP-005) and states "All 5 Blockers must be resolved before Phase 1 coding starts." These 5 blockers have now been resolved through the gap-resolution plan, but the ecosystem-guidelines prose still presents them as unresolved prerequisites. This creates a misleading impression that implementation cannot begin.

### Relation to Epic

This is the second and final ticket in Epic 01 (GAP Marker Cleanup). It handles the `ecosystem-guidelines.md` blocker table separately from ticket-001 because the ecosystem-guidelines file requires a different edit pattern (updating status context around the table rather than simply removing a GAP label from prose).

### Current State

Lines 388-402 of `src/specs/overview/ecosystem-guidelines.md` contain:

```markdown
All 5 Blockers must be resolved before Phase 1 coding starts:

| Gap ID  | Description                                                                         |
| ------- | ----------------------------------------------------------------------------------- |
| GAP-001 | `SystemRepresentation` struct definition                                            |
| GAP-002 | Decommissioned LP treatment                                                         |
| GAP-003 | Broadcast serialization format — **Resolved**: `postcard` adopted for MPI broadcast |
| GAP-004 | `StageTemplate` construction and LP variable layout                                 |
| GAP-005 | Forward pass patch sequence                                                         |

The dominant gap crate is `cobre-sddp` (~20 of 38 gaps). The minimal viable build sequence
is bottom-up...
```

GAP-003 is already marked as resolved in the table. The other 4 GAPs (001, 002, 004, 005) are listed without resolution markers, and the introductory sentence implies they are still pending.

The section also references stale gap counts: "38 gaps (5 Blocker, 15 High, 13 Medium, 5 Low)" on line 387. The current inventory has 39 gaps per the spec-gap-inventory (the count was updated during the spec-readiness plan).

## Specification

### Requirements

1. Update the introductory sentence from "All 5 Blockers must be resolved before Phase 1 coding starts:" to "All 5 Blockers have been resolved:" (or equivalent past-tense phrasing).
2. Add **Resolved** markers to the 4 remaining GAP entries (GAP-001, GAP-002, GAP-004, GAP-005) in the blocker table, consistent with the existing GAP-003 format.
3. Update the gap count reference on line 387 from "38 gaps" to "39 gaps" and from "15 High" to "16 High" to match the current `spec-gap-inventory.md` counts.
4. Update the "~20 of 38 gaps" reference to "~20 of 39 gaps" for consistency.

### Inputs/Props

- `src/specs/overview/ecosystem-guidelines.md` (lines 385-402).
- `src/specs/overview/spec-gap-inventory.md` for authoritative gap counts and resolution details.

### Outputs/Behavior

- The blocker table shows all 5 gaps as resolved.
- Gap count statistics match the inventory.
- The section reads as a historical record of resolved prerequisites, not an active blocker list.

### Error Handling

- Not applicable (markdown text edits).

### Out of Scope

- Changing any other section of `ecosystem-guidelines.md`.
- Modifying `spec-gap-inventory.md`.
- Adding resolution details to the blocker table beyond the **Resolved** marker (the inventory file is the authoritative source for resolution details).

## Acceptance Criteria

- [ ] Given `src/specs/overview/ecosystem-guidelines.md`, when searching for the text "must be resolved before Phase 1", then zero matches are found.
- [ ] Given the blocker table in `ecosystem-guidelines.md`, when reading all 5 rows, then each row contains the text "Resolved" (matching the existing GAP-003 format).
- [ ] Given the gap count reference in `ecosystem-guidelines.md`, when reading the text, then it says "39 gaps" and "16 High" (matching `spec-gap-inventory.md`).
- [ ] Given the command `grep "GAP-" src/specs/overview/ecosystem-guidelines.md`, when executed, then all GAP references are within the resolved blocker table (historical context, not pending language).
- [ ] Given the command `mdbook build`, when executed from the repo root, then the build succeeds with no new warnings.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/ecosystem-guidelines.md` lines 385-405.
2. Verify current gap counts by running: `grep -c "^| GAP-" src/specs/overview/spec-gap-inventory.md` (expected: 39 total rows in the detailed table).
3. Change line 387: update "38 gaps (5 Blocker, 15 High, 13 Medium, 5 Low)" to "39 gaps (5 Blocker, 16 High, 13 Medium, 5 Low)".
4. Change the introductory sentence (approximately line 390): from "All 5 Blockers must be resolved before Phase 1 coding starts:" to "All 5 Blockers have been resolved:".
5. Update the 4 blocker table rows without resolution markers:
   - GAP-001: append " -- **Resolved**: defined in [Internal Structures](../data-model/internal-structures.md)"
   - GAP-002: append " -- **Resolved**: specified in [Training Loop](../architecture/training-loop.md)"
   - GAP-004: append " -- **Resolved**: specified in [Internal Structures](../data-model/internal-structures.md)"
   - GAP-005: append " -- **Resolved**: specified in [Training Loop](../architecture/training-loop.md)"
6. Update "~20 of 38 gaps" to "~20 of 39 gaps".
7. Run `mdbook build` to verify no new warnings.

### Key Files to Modify

- `src/specs/overview/ecosystem-guidelines.md` (lines 385-402)

### Patterns to Follow

- Match the existing GAP-003 resolution format: `Description -- **Resolved**: brief resolution note`.
- Use relative markdown links to the spec files where the resolution is documented.
- Overview files use plain numbered sections (`## 9.`, not `SS9`).

### Pitfalls to Avoid

- Do not remove the blocker table entirely -- it serves as a historical record of what was required before implementation could begin.
- Do not modify `spec-gap-inventory.md` -- it is the audit trail.
- Do not change the section numbering in `ecosystem-guidelines.md`.
- Verify the gap counts against the actual inventory before writing new numbers.

## Testing Requirements

### Unit Tests

Not applicable (markdown edits).

### Integration Tests

- Run `grep "must be resolved" src/specs/overview/ecosystem-guidelines.md` and verify zero matches.
- Run `grep "Resolved" src/specs/overview/ecosystem-guidelines.md | grep "GAP-00"` and verify 5 matches (one per blocker).
- Run `mdbook build` and verify success with no new warnings.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (can proceed independently of ticket-001)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
