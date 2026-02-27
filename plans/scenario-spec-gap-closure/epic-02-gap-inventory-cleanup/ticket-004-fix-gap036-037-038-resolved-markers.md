# ticket-004 Fix GAP-036/037/038 Resolved Markers in Section 3

## Context

### Background

Report-031 (section 6.2) of the implementation readiness audit identified a maintenance inconsistency: GAP-036, GAP-037, and GAP-038 are correctly listed as resolved in the section 7 resolution log and correctly counted in the section 6 summary statistics, but their rows in the section 3 detailed table are missing `**Resolved**` prefixes in the Resolution Path column. The Resolution Path column still contains the original unresolved description text instead of starting with the `**Resolved**` marker followed by the resolution explanation.

This is a cosmetic fix that brings section 3 into alignment with sections 6 and 7. It does not change the intended meaning or any statistics.

### Relation to Epic

This is the second of two tickets in Epic 2 (Gap Inventory Cleanup). It handles the cosmetic marker fix for GAP-036/037/038. The first ticket (ticket-003) handles the substantive GAP-039 reclassification.

### Current State

File: `src/specs/overview/spec-gap-inventory.md`

**GAP-036 row** (line 61): Resolution Path column contains the resolution text but lacks the `**Resolved**` prefix. Section 7 has a resolution entry (line 151) dated 2026-02-26 with ticket-023.

**GAP-037 row** (line 62): Resolution Path column contains the resolution text but lacks the `**Resolved**` prefix. Section 7 has a resolution entry (line 152) dated 2026-02-26 with ticket-024.

**GAP-038 row** (line 63): Resolution Path column contains the resolution text but lacks the `**Resolved**` prefix. Section 7 has a resolution entry (line 153) dated 2026-02-26 with ticket-025.

The section 6 summary already correctly counts these as resolved (they are included in the "15 High resolved" list). No statistics need to change.

## Specification

### Requirements

1. **Add `**Resolved**` prefix to GAP-036 Resolution Path** (line 61): Prepend `**Resolved** -- ` to the existing Resolution Path text. The existing text already describes the resolution; it just needs the marker.

2. **Add `**Resolved**` prefix to GAP-037 Resolution Path** (line 62): Same treatment as GAP-036.

3. **Add `**Resolved**` prefix to GAP-038 Resolution Path** (line 63): Same treatment as GAP-038.

4. **Verify no statistics change**: Section 6 already counts these as resolved. Confirm the counts remain correct after the edit.

### Inputs/Props

- Current content of `src/specs/overview/spec-gap-inventory.md` lines 61-63

### Outputs/Behavior

- Modified `src/specs/overview/spec-gap-inventory.md` with `**Resolved**` markers on three rows

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying the resolution text itself (it is already correct)
- Changing section 6 or section 7 (they are already correct for these gaps)
- Modifying GAP-039 (that is ticket-003)

## Acceptance Criteria

- [ ] Given the GAP-036 row in section 3, when the Resolution Path column is read, then it starts with `**Resolved**`
- [ ] Given the GAP-037 row in section 3, when the Resolution Path column is read, then it starts with `**Resolved**`
- [ ] Given the GAP-038 row in section 3, when the Resolution Path column is read, then it starts with `**Resolved**`
- [ ] Given the section 6 summary statistics, when all counts are recounted from section 3, then they match exactly (no change from current correct values after ticket-003)
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. Read `spec-gap-inventory.md` and locate lines 61-63 (GAP-036, GAP-037, GAP-038 rows in section 3)
2. For each row, find the Resolution Path column (last column in the pipe-delimited table)
3. Prepend `**Resolved** -- ` to the existing text in that column
4. Verify that section 6 statistics remain correct (they should, since these gaps were already counted as resolved)
5. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/overview/spec-gap-inventory.md` -- section 3, lines 61-63

### Patterns to Follow

- Other resolved gaps in the same table use the pattern: `**Resolved** -- description of resolution...`
- For example, GAP-006 through GAP-017 (lines 36-47) all have `**Resolved**` prefixes in their Resolution Path column

### Pitfalls to Avoid

- Do NOT modify the Description column (only the Resolution Path column changes)
- Do NOT modify section 6 or section 7 statistics (they are already correct for these three gaps)
- Do NOT change the resolution text itself -- only add the `**Resolved**` prefix marker
- Be careful with table formatting -- the pipe-delimited columns must remain properly aligned

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Grep for `GAP-036.*\*\*Resolved\*\*` in section 3; verify match found
- Grep for `GAP-037.*\*\*Resolved\*\*` in section 3; verify match found
- Grep for `GAP-038.*\*\*Resolved\*\*` in section 3; verify match found

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: ticket-003 (should be done after GAP-039 reclassification to avoid multiple passes through the same table)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
