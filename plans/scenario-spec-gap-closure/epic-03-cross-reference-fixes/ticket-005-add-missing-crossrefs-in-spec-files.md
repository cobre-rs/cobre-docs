# ticket-005 Add Missing Cross-References in simulation-architecture and binary-formats

## Context

### Background

Report-030 (Cross-Reference Integrity Report) identified two HIGH-severity missing cross-reference findings that require content changes in spec files:

- **F1 (HIGH)**: `simulation-architecture.md` SS6.1 describes the bounded channel and background I/O thread but does not link to `output-infrastructure.md` SS6.2 (`SimulationParquetWriter`) where the consumer is specified. A reader cannot follow the chain from "background I/O thread" to the concrete writer implementation.

- **F2 (HIGH)**: `binary-formats.md` is the canonical format authority but does not reference `postcard` as the MPI broadcast serialization format. The `postcard` adoption (in `input-loading-pipeline.md` SS6.1) created a new serialization category ("MPI Broadcast") that is absent from the section 2 format summary table.

### Relation to Epic

This is the first of three tickets in Epic 3 (Cross-Reference Fixes). It handles the content-level fixes (F1, F2). Ticket-006 handles the index-level fixes (F4-F8). Ticket-007 handles the low-priority cosmetic fix (F3). This ticket must be completed before ticket-006 because the content changes here may affect outgoing reference counts in the index.

### Current State

**`src/specs/architecture/simulation-architecture.md` SS6.1** (lines 724-731):
The streaming architecture section describes the bounded channel of `SimulationScenarioResult` and the background I/O thread. It references `output-schemas.md` for column definitions but does NOT reference `output-infrastructure.md` SS6.2 where the `SimulationParquetWriter` consuming those results is defined. The term "SimulationParquetWriter" does not appear anywhere in `simulation-architecture.md`.

**`src/specs/data-model/binary-formats.md` section 2** (lines 42-57):
The "Format Summary by Category" table lists 12 data categories with their format choices. The table does not include an "MPI Broadcast" category or any reference to `postcard`. The word "postcard" does not appear anywhere in `binary-formats.md`.

## Specification

### Requirements

1. **Fix F1: Add SimulationParquetWriter reference in simulation-architecture.md SS6.1.**

   In the SS6.1 streaming architecture text (around line 730), add a sentence or parenthetical reference pointing to `output-infrastructure.md` SS6.2 for the `SimulationParquetWriter` that consumes the `SimulationScenarioResult` values from the channel. Something like: "The I/O thread receives `SimulationScenarioResult` values and writes them to Parquet files asynchronously via the `SimulationParquetWriter` ([Output Infrastructure SS6.2](../data-model/output-infrastructure.md)), converting the nested per-entity-type layout to the columnar Parquet schemas defined in [Output Schemas SS5](../data-model/output-schemas.md)."

2. **Fix F2: Add postcard/MPI broadcast entry to binary-formats.md section 2.**

   Add a new row to the section 2 "Format Summary by Category" table:

   | Data Category             | Read/Write | Format   | Rationale                                                                                                                                                  |
   | ------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | MPI Broadcast (case data) | Internal   | postcard | Fast serialization for one-time rank-0-to-all broadcast of `System` struct. See [Input Loading Pipeline SS6.1](../architecture/input-loading-pipeline.md). |

   Also add a corresponding entry to the section 1 "Format Decision Framework" table if appropriate (a new row for "MPI broadcast / internal transfer" -> "postcard").

   Optionally, add a brief mention in the Cross-References section of `binary-formats.md` referencing `input-loading-pipeline.md` if it is not already there.

### Inputs/Props

- Current content of `src/specs/architecture/simulation-architecture.md`
- Current content of `src/specs/data-model/binary-formats.md`
- Report-030 findings F1 and F2

### Outputs/Behavior

- Modified `src/specs/architecture/simulation-architecture.md` with SS6.2 reference
- Modified `src/specs/data-model/binary-formats.md` with postcard/MPI broadcast entry

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying the Cross-References section of `simulation-architecture.md` for precision (F3 -- that is ticket-007)
- Updating the cross-reference index (that is ticket-006)
- Adding content to `output-infrastructure.md` (it already has the correct content)

## Acceptance Criteria

- [ ] Given `simulation-architecture.md` SS6.1, when searched for "SimulationParquetWriter", then at least one match is found
- [ ] Given `simulation-architecture.md` SS6.1, when searched for "output-infrastructure.md", then at least one match is found within SS6.1 (not just in the Cross-References section)
- [ ] Given `binary-formats.md` section 2, when the format summary table is read, then a row for "MPI Broadcast" with format "postcard" is present
- [ ] Given `binary-formats.md`, when searched for "postcard", then at least one match is found
- [ ] Given `binary-formats.md`, when searched for "input-loading-pipeline", then at least one match is found
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. **Fix F1 in simulation-architecture.md:**
   - Read SS6.1 (line 724-731)
   - Find the sentence at line 730: "The I/O thread receives `SimulationScenarioResult` values and writes them to Parquet files asynchronously, converting the nested per-entity-type layout to the columnar Parquet schemas defined in [Output Schemas SS5](../data-model/output-schemas.md)."
   - Insert the `SimulationParquetWriter` reference. Suggested edit: "The I/O thread receives `SimulationScenarioResult` values and writes them to Parquet files asynchronously via the `SimulationParquetWriter` ([Output Infrastructure SS6.2](../data-model/output-infrastructure.md)), converting the nested per-entity-type layout to the columnar Parquet schemas defined in [Output Schemas SS5](../data-model/output-schemas.md)."

2. **Fix F2 in binary-formats.md:**
   - Read section 2 (lines 42-57)
   - Add a new row to the table after the "Dictionaries" row. The new row should be: `| MPI Broadcast (case data) | Internal | postcard | Fast serde for rank-0-to-all broadcast; see [Input Loading Pipeline SS6.1](../architecture/input-loading-pipeline.md) |`
   - Optionally, add a row to the section 1 format decision framework table as well
   - Check if `binary-formats.md` has a Cross-References section; if so, add `input-loading-pipeline.md` to it if not already present

3. Run `mdbook build` to verify no broken links

### Key Files to Modify

- `src/specs/architecture/simulation-architecture.md` -- SS6.1 (around line 730)
- `src/specs/data-model/binary-formats.md` -- section 2 table (around line 57), optionally Cross-References section

### Patterns to Follow

- Cross-reference links in `simulation-architecture.md` use the pattern: `[Output Infrastructure SS6.2](../data-model/output-infrastructure.md)` (relative path from `src/specs/architecture/`)
- Cross-reference links in `binary-formats.md` use the pattern: `[Input Loading Pipeline SS6.1](../architecture/input-loading-pipeline.md)` (relative path from `src/specs/data-model/`)
- The format summary table in `binary-formats.md` uses pipe-delimited format with consistent column alignment

### Pitfalls to Avoid

- Do NOT modify the existing SS6.1 content beyond inserting the reference -- the streaming architecture description is correct
- Do NOT add `postcard` as a format for policy data or cut data -- those use FlatBuffers and raw `#[repr(C)]` respectively. Postcard is ONLY for the `System` struct MPI broadcast.
- Be careful with the Read/Write column for the new row. The MPI broadcast is "Internal" (neither a user-facing read nor write; it is an internal serialization for inter-rank communication). Or use "Read/Write" if following the existing convention where "Read" means consumed and "Write" means produced. Look at how the existing rows classify their Read/Write.

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Grep for "SimulationParquetWriter" in `simulation-architecture.md`; verify at least one match in SS6.1
- Grep for "postcard" in `binary-formats.md`; verify at least one match

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-006 (index batch update needs to account for any new outgoing refs added by this ticket)

## Effort Estimate

**Points**: 2
**Confidence**: High
