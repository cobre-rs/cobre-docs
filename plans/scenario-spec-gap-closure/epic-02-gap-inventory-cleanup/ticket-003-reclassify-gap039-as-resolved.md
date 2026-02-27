# ticket-003 Reclassify GAP-039 as Resolved False Gap

## Context

### Background

GAP-039 was added to `spec-gap-inventory.md` during the implementation readiness audit (report-031, section 4) with the description: "Scenario innovation noise / scenario sample broadcast format not specified. Rank 0 generates scenarios and broadcasts to all ranks before each forward pass, but the wire format and MPI broadcast pattern are unspecified."

This description is architecturally incorrect. The actual Cobre design (specified in `scenario-generation.md` SS2.2a since Epic 05 of the readiness audit) uses deterministic seed derivation via SipHash-1-3. Each MPI rank independently generates its own noise from the seed `(base_seed, iteration, scenario, stage)`. There is no "rank 0 generates and broadcasts" pattern for noise data. The broadcast pattern exists only for the `System` struct (via postcard, in `input-loading-pipeline.md` SS6.1) and for cut data (via raw `#[repr(C)]` structs, in `cut-management-impl.md` SS4.2a). Forward pass noise is generated locally by each rank.

After ticket-001 adds the clarifying note in SS2.2, the spec explicitly states that no broadcast is needed. GAP-039 should be reclassified as a false gap (resolved because the concern it described does not exist in the architecture).

### Relation to Epic

This is the first of two tickets in Epic 2 (Gap Inventory Cleanup). It handles the substantive reclassification of GAP-039. The second ticket (ticket-004) handles the cosmetic marker fix for GAP-036/037/038.

### Current State

File: `src/specs/overview/spec-gap-inventory.md`

**GAP-039 row in section 3** (line 64): Currently listed as High severity, unresolved. The description column says "Scenario innovation noise / scenario sample broadcast format not specified." The Resolution Path column says "Add a new subsection to [Scenario Generation]... specifying the broadcast format..."

**Section 6 summary statistics** (lines 99-113): Shows "High (unresolved): 1" -- this is GAP-039. Shows "Total unresolved: 16."

**Section 7 resolution log** (lines 130-156): No entry for GAP-039.

## Specification

### Requirements

1. **Update GAP-039 row in section 3 detailed table** (line 64):
   - Keep the GAP ID, crate assignment, and spec file references unchanged
   - Update the Description column to accurately describe what was investigated and why it is a false gap: the seed-based architecture in SS2.2a means each rank generates noise independently; no broadcast is needed
   - Prefix the Resolution Path column with `**Resolved (false gap)**` and replace the old resolution path text with an explanation: "The concern described a broadcast pattern that does not exist in the Cobre architecture. Each MPI rank independently generates forward pass noise via deterministic seed derivation (Scenario Generation SS2.2a). The opening tree noise is also generated independently per rank from the same deterministic seeds. No MPI broadcast of noise data occurs. See SS2.2 clarifying note. Reclassified as false gap by scenario-spec-gap-closure plan."

2. **Add GAP-039 entry to section 7 resolution log** (after line 156):
   - Resolved Date: current date (2026-02-27)
   - Plan / Epic: scenario-spec-gap-closure / epic-02
   - Ticket: ticket-003
   - Resolution Summary: False gap. The described broadcast pattern does not exist in the architecture. Each MPI rank independently generates noise via deterministic seed derivation (SS2.2a). No new spec content was needed beyond a clarifying note in SS2.2.

3. **Update section 6 summary statistics** (lines 99-113):
   - High (unresolved): 1 -> 0
   - High (resolved): 15 -> 16
   - Total unresolved: 16 -> 15
   - Update the parenthetical list in the "By severity" line to include GAP-039 in the High resolved list: "16 High resolved: GAP-006 through GAP-017, GAP-036, GAP-037, GAP-038, GAP-039"
   - Update the "By crate" table: cobre-stochastic High count decreases by 1 (currently 2, becomes 1), cobre-sddp High count decreases by 1 (currently 12, becomes 11). Also update the respective Total columns.

4. **Verify consistency**: After all changes, recount the section 3 table to confirm the section 6 statistics match.

### Inputs/Props

- Current content of `src/specs/overview/spec-gap-inventory.md`
- Knowledge that SS2.2a already specifies the seed-based independent noise generation

### Outputs/Behavior

- Modified `src/specs/overview/spec-gap-inventory.md` with GAP-039 reclassified

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying `scenario-generation.md` (done in Epic 1)
- Fixing GAP-036/037/038 markers (that is ticket-004)
- Adding or removing any other gaps

## Acceptance Criteria

- [ ] Given the GAP-039 row in section 3, when read, then the Resolution Path column starts with `**Resolved (false gap)**`
- [ ] Given the GAP-039 row in section 3, when read, then the description mentions "deterministic seed derivation" and "SS2.2a"
- [ ] Given the section 7 resolution log, when searched for GAP-039, then exactly one entry is found with plan "scenario-spec-gap-closure"
- [ ] Given the section 6 summary statistics, when "High (unresolved)" is read, then the count is 0
- [ ] Given the section 6 summary statistics, when "High (resolved)" is read, then the count is 16
- [ ] Given the section 6 summary statistics, when "Total unresolved" is read, then the count is 15
- [ ] Given the "By crate" table in section 6, when the cobre-stochastic row is read, then the High column shows 1 (not 2)
- [ ] Given the "By crate" table in section 6, when the cobre-sddp row is read, then the High column shows 11 (not 12)
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. Read `spec-gap-inventory.md` and locate the GAP-039 row in section 3 (line 64)
2. Edit the Description and Resolution Path columns. Keep the row structure (pipe-delimited table format)
3. Add the resolution log entry in section 7 (after the last existing entry, currently GAP-020 at line 156)
4. Update section 6 summary statistics:
   - Line 101: Update the parenthetical High resolved list to include GAP-039
   - Line 107: Change "1" to "0" for High (unresolved)
   - Line 108: Change "15" to "16" for High (resolved)
   - Line 113: Change "16" to "15" for Total unresolved
   - Lines 121-122: Update cobre-stochastic and cobre-sddp High counts
5. Recount ALL rows in section 3 to verify the statistics are correct
6. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/overview/spec-gap-inventory.md` -- section 3 (line 64), section 6 (lines 99-128), section 7 (after line 156)

### Patterns to Follow

- Resolution Path markers use the pattern: `**Resolved** -- ` followed by explanation text. For false gaps, use: `**Resolved (false gap)** -- ` followed by explanation text.
- Resolution log entries follow the existing table format: `| GAP-039 | 2026-02-27 | scenario-spec-gap-closure / epic-02 | ticket-003 | Resolution summary... |`
- Overview specs use plain numbered sections (`## 6.`, `## 7.`), not `SS` or section symbol prefixes -- per CLAUDE.md conventions.

### Pitfalls to Avoid

- Do NOT change the GAP ID number (it stays GAP-039)
- Do NOT remove the row from section 3 (resolved gaps remain in the inventory table for historical reference)
- Do NOT forget to update BOTH the severity-level counts AND the per-crate counts in section 6
- Do NOT update the "Note:" paragraph below the per-crate table -- it explains why per-crate counts exceed total counts (this explanation remains valid)
- Be careful with the "By crate" table: GAP-039 affects both cobre-stochastic AND cobre-sddp, so both rows need adjustment. The Total column for each must also be decremented by 1 since the gap was unresolved in both.
- Wait: re-examine the "By crate" table. It says "High" but does not distinguish resolved vs unresolved. Looking at the note: "Resolved gaps (5 Blockers, 15 High, 3 Medium) are excluded from the severity-level unresolved counts above." This implies the "By crate" table counts UNRESOLVED gaps only. So cobre-stochastic High=2 means 2 unresolved High gaps; resolving GAP-039 means cobre-stochastic High=1, Total=4. And cobre-sddp High=12 is problematic -- this seems too high if it is unresolved only. Carefully verify by recounting the section 3 table for each crate before changing.

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Recount section 3 table manually to verify section 6 statistics
- Search for "GAP-039" in section 7; verify exactly one entry exists

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: ticket-001 (SS2.2 clarifying note must exist before it can be cited as resolution evidence)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
