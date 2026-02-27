# Epic 02: Gap Inventory Cleanup

## Goal

Reclassify GAP-039 as a resolved false gap, fix the missing `**Resolved**` markers on GAP-036/037/038 in the section 3 detailed table, and verify that summary statistics in section 6 are correct.

## Scope

All changes are within a single file: `src/specs/overview/spec-gap-inventory.md`.

### Changes

1. **GAP-039 reclassification** -- Change severity from High to "High (resolved)" in section 3, update the description to explain why this was a false gap (the seed-based architecture in SS2.2a eliminates the broadcast), add resolution entry to section 7, update section 6 summary statistics
2. **GAP-036/037/038 marker fix** -- Add `**Resolved**` prefix to the Resolution Path column in section 3 for these three gaps, matching what is already correctly recorded in sections 6 and 7

## Tickets

| #   | Ticket     | Title                                             |
| --- | ---------- | ------------------------------------------------- |
| 3   | ticket-003 | Reclassify GAP-039 as resolved false gap          |
| 4   | ticket-004 | Fix GAP-036/037/038 Resolved markers in section 3 |

## Dependencies

- Epic 1 should be completed first so that the scenario-generation.md changes (SS2.2 clarifying note, SS2.3b) can be cited as part of the GAP-039 resolution evidence

## Completion Criteria

- GAP-039 row in section 3 has correct "resolved (false gap)" explanation
- GAP-039 entry added to section 7 resolution log
- GAP-036/037/038 rows in section 3 have `**Resolved**` prefix in Resolution Path
- Section 6 summary statistics match the actual section 3 table counts
- `mdbook build` exits 0 with no new warnings
