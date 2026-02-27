# ticket-001 Batch-Update Gap Inventory for 15 Resolved Gaps

## Context

### Background

The Cobre specification corpus tracks all implementation-blocking gaps in `src/specs/overview/spec-gap-inventory.md`. A stakeholder design review (`review.md` at repo root) provided confirmed decisions for all 15 remaining open gaps (GAP-018 through GAP-035, excluding already-resolved GAP-020, GAP-023, GAP-029). This ticket applies the confirmed decisions as resolution markers and summaries to the canonical gap inventory document.

### Relation to Epic

This is the sole ticket in Epic 01 and the first ticket in the plan. It establishes the "target state" by marking all gaps as resolved in the tracking document. Subsequent tickets in Epics 2-4 add the actual spec content that each resolution summary references.

### Current State

The file `src/specs/overview/spec-gap-inventory.md` currently has:

- **Section 3** (gap table): 15 gaps without **Resolved** markers (GAP-018, 019, 021, 022, 024, 025, 026, 027, 028, 030, 031, 032, 033, 034, 035)
- **Section 6** (summary statistics): Shows 10 Medium unresolved, 5 Low unresolved, 15 total unresolved
- **Section 7** (resolution log): Entries for 24 resolved gaps; missing entries for the 15 open gaps
- **Section 8** (cross-references): Does not need changes

## Specification

### Requirements

1. For each of the 15 gaps in the section 3 table, prepend **Resolved.** to the Description column and write a resolution summary in the Resolution Path column
2. Update section 6 summary statistics to reflect 0 unresolved gaps across all severities
3. Add resolution log entries in section 7 for all 15 gaps
4. Use the plan name `gap-decisions-incorporation` and the correct ticket IDs from this plan in the resolution log entries
5. Use today's date or the actual implementation date in the resolution log
6. Follow the existing table format exactly -- single-row Markdown table cells with pipe separators
7. This is an overview spec -- use plain numbered sections (`## 6.`, `## 7.`), never `SS` or `§`

### Out of Scope

- Adding spec content to the owning spec files (that is Epics 2-4)
- Modifying section 4 (key decisions), section 5 (performance risks), or section 8 (cross-references)
- Creating new sections

### Inputs/Props

The 15 gap decisions from `review.md` (summarized):

| GAP     | Decision Summary                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------- |
| GAP-018 | Use rayon for intra-rank parallelism; encapsulated in cobre-sddp                                                       |
| GAP-019 | Retry params as external config per-solver; encapsulated inside solver abstraction                                     |
| GAP-021 | Document FlatBuffers requirements only (batch extraction, cache-fitting); defer full schema                            |
| GAP-022 | Add explicit PAR canonical-to-LP transformation flow and PrecomputedParLp struct                                       |
| GAP-024 | Add `cut_activity_tolerance` as external config parameter                                                              |
| GAP-025 | Design penalty ordering validation checks (warning, not error)                                                         |
| GAP-026 | Document backward trial state distribution strategy                                                                    |
| GAP-027 | `training.forward_passes` is mandatory; no default; loader error if missing                                            |
| GAP-028 | Minimal validation: same hydro count, same max PAR order, same production methods per hydro, same PAR models per hydro |
| GAP-030 | Store complete LP solution (primal, dual, costs); shared struct for training + simulation; contiguous layout           |
| GAP-031 | Uniformize to `scenario_source`; remove `num_scenarios`/`sampling_method` legacy fields                                |
| GAP-032 | Use `std::sync::mpsc` for synchronous CLI binding; no tokio/crossbeam                                                  |
| GAP-033 | Isolated per-rank memory in Phase 5; MPI shared memory deferred to post-profiling                                      |
| GAP-034 | Immutable `forward_passes` after initialization; scheduler deferred                                                    |
| GAP-035 | Update example to use `"method": "level1"` and `"risk_measure": "expectation"`                                         |

### Outputs/Behavior

The updated `spec-gap-inventory.md` file with:

- 15 gap table rows updated with **Resolved** markers and resolution summaries
- Section 6 statistics showing 0 unresolved gaps
- Section 7 with 15 new resolution log entries

### Error Handling

- If a gap's description in the table does not match the expected text (indicating it was modified since last read), preserve the existing description and prepend the **Resolved** marker
- If section 6 arithmetic does not balance (total gaps != sum of per-severity counts), flag the discrepancy and correct it

## Acceptance Criteria

- [ ] Given the gap table in section 3, when searching for "Medium (unresolved)" or "Low (unresolved)" entries, then 0 are found -- all 15 gaps now show **Resolved** markers in their description column
- [ ] Given the section 6 summary statistics table, when reading the "Medium (unresolved)" row, then it shows 0; when reading the "Low (unresolved)" row, then it shows 0; when reading "Total unresolved", then it shows 0
- [ ] Given section 6, when the severity counts are summed (Blocker resolved: 5, High resolved: 16, Medium resolved: 13, Low resolved: 5), then the total equals 39
- [ ] Given section 7 resolution log, when counting entries with plan `gap-decisions-incorporation`, then exactly 15 entries exist corresponding to GAP-018, 019, 021, 022, 024, 025, 026, 027, 028, 030, 031, 032, 033, 034, 035
- [ ] Given the file `src/specs/overview/spec-gap-inventory.md`, when running `mdbook build` from repo root, then the build succeeds with no new errors

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/spec-gap-inventory.md` in full
2. For each of the 15 gaps in section 3, update the table row:
   - Prepend **Resolved.** to the Description cell
   - Write a concise resolution summary in the Resolution Path cell, referencing the target spec file and section where the content will be added (by Epics 2-4)
3. Update section 6 summary statistics:
   - Change `Medium (unresolved)` from 10 to 0
   - Change `Medium (resolved)` from 3 to 13
   - Change `Low` from 5 to 0 (add Low resolved: 5 row)
   - Change `Total unresolved` from 15 to 0
   - Verify total still equals 39
4. Update the per-crate table in section 6 to reflect the resolved counts
5. Update the note below section 6 to list all resolved gaps (currently mentions "5 Blockers, 16 High, 3 Medium")
6. Add 15 entries to section 7 resolution log following the existing format

### Key Files to Modify

- `src/specs/overview/spec-gap-inventory.md` -- the only file modified by this ticket

### Patterns to Follow

- **Resolution path format**: Match existing resolved gaps (e.g., GAP-001 through GAP-017) -- reference the specific spec file, section, and a one-line summary of what was added
- **Resolution log format**: `| GAP-NNN | [date] | gap-decisions-incorporation / epic-NN | ticket-NNN | [summary] |`
- **Section numbering**: This is an overview spec -- use `## 6.` and `## 7.` (plain numbers, no SS or section-symbol prefix)

### Pitfalls to Avoid

- Do NOT use `§` or `SS` prefixes in this file -- it is an overview spec under `src/specs/overview/`
- Do NOT modify section 4 (key decisions), section 5 (performance risks), or section 8 (cross-references)
- Ensure the summary statistics arithmetic is correct -- manually verify that per-severity counts sum to 39
- The per-crate table in section 6 counts gaps per crate (a gap affecting N crates is counted N times); this table must also be updated

## Testing Requirements

### Unit Tests

Not applicable (Markdown spec document).

### Integration Tests

- Run `mdbook build` from the repo root and verify no new errors
- Verify that the gap inventory page renders correctly in the built book

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-002, ticket-003, ticket-004, ticket-005, ticket-006, ticket-007, ticket-008, ticket-009, ticket-010, ticket-011, ticket-012, ticket-013

## Effort Estimate

**Points**: 2
**Confidence**: High
