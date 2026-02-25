# ticket-013 Update Cross-Reference Index with New Specs

## Context

### Background

The cross-reference index (`src/specs/cross-reference-index.md`) is the authoritative navigation map for the entire spec corpus. It currently covers 54 spec files across 5 index sections: Spec-to-Crate Mapping, Per-Crate Reading Lists, Outgoing Cross-Reference Table, Incoming Cross-Reference Table, and Dependency Ordering. Epics 01-02 added 7 new spec files and ticket-012 added them to SUMMARY.md. Tickets 009-011 modified the cross-references in 6 existing specs. This ticket updates the cross-reference index to reflect all of these changes.

### Relation to Epic

This is the final ticket in Epic 03. It depends on all other Epic 03 tickets (009-012) because it must capture the cross-reference state after all refactoring is complete. No tickets depend on this one within Epic 03; Epic 04 tickets may reference it.

### Current State

`src/specs/cross-reference-index.md` (487 lines) currently has 54 entries (rows 1-54 in the Spec-to-Crate Mapping table). The index must be extended to cover 7 new spec files:

1. `communicator-trait.md` -- HPC section, primary crate: cobre-comm
2. `backend-selection.md` -- HPC section, primary crate: cobre-comm
3. `backend-ferrompi.md` -- HPC section, primary crate: cobre-comm
4. `backend-local.md` -- HPC section, primary crate: cobre-comm
5. `backend-tcp.md` -- HPC section, primary crate: cobre-comm
6. `backend-shm.md` -- HPC section, primary crate: cobre-comm
7. `comm.md` (crate spec) -- not in the spec index per convention (crate specs are separate from spec files)

Additionally, 6 existing specs had their Cross-References sections modified in tickets 009-011, which changes the outgoing references for:

- `hybrid-parallelism.md` -- added references to communicator-trait.md, backend-selection.md, backend-ferrompi.md, backend-local.md, comm.md
- `communication-patterns.md` -- added references to communicator-trait.md, backend-selection.md, backend-ferrompi.md, backend-tcp.md, backend-shm.md, backend-local.md
- `training-loop.md` -- added references to communicator-trait.md, backend-local.md
- `synchronization.md` -- added reference to communicator-trait.md
- `work-distribution.md` -- added reference to communicator-trait.md
- `shared-memory-aggregation.md` -- added references to communicator-trait.md, backend-local.md

## Specification

### Requirements

1. **Section 1 (Spec-to-Crate Mapping)**: Add 6 rows (entries 55-60) for the new HPC spec files. Each row maps the file to its primary crate (`cobre-comm`) and secondary crate(s).
2. **Section 2 (Per-Crate Reading Lists)**: Add a new `cobre-comm` reading list. Add the new spec files as secondary entries to the `cobre-sddp` and `ferrompi` reading lists where relevant.
3. **Section 3 (Outgoing Cross-Reference Table)**: Add 6 new rows for the new spec files listing all specs they reference in their `## Cross-References` sections. Update 6 existing rows to reflect the new outgoing references added in tickets 009-011.
4. **Section 4 (Incoming Cross-Reference Table)**: Add 6 new rows for the new spec files listing all specs that reference them. Update existing rows for specs that now have additional incoming references (e.g., `communicator-trait.md` is now referenced by `hybrid-parallelism.md`, `communication-patterns.md`, `training-loop.md`, `synchronization.md`, `work-distribution.md`, `shared-memory-aggregation.md`).
5. **Section 5 (Dependency Ordering)**: Add the 6 new spec files at appropriate positions based on their incoming reference counts. Update counts for existing entries whose incoming reference counts changed.

### Detailed Entry Specifications

#### New Spec-to-Crate Mapping Entries

| #   | Spec File             | Section | Primary Crate | Secondary Crate(s)    |
| --- | --------------------- | ------- | ------------- | --------------------- |
| 55  | communicator-trait.md | hpc     | cobre-comm    | cobre-sddp            |
| 56  | backend-selection.md  | hpc     | cobre-comm    | cobre-sddp, cobre-cli |
| 57  | backend-ferrompi.md   | hpc     | cobre-comm    | ferrompi              |
| 58  | backend-local.md      | hpc     | cobre-comm    | --                    |
| 59  | backend-tcp.md        | hpc     | cobre-comm    | --                    |
| 60  | backend-shm.md        | hpc     | cobre-comm    | --                    |

#### cobre-comm Reading List

The new `cobre-comm` reading list should include all 6 new HPC specs as primary, plus existing specs that the crate implementer must understand as secondary:

1. [Communicator Trait](./hpc/communicator-trait.md) -- trait definition, method contracts
2. [Backend Selection](./hpc/backend-selection.md) -- feature flags, factory pattern
3. [Backend: Ferrompi](./hpc/backend-ferrompi.md)
4. [Backend: Local](./hpc/backend-local.md)
5. [Backend: TCP](./hpc/backend-tcp.md)
6. [Backend: Shared Memory](./hpc/backend-shm.md)
7. [Communication Patterns](./hpc/communication-patterns.md) (secondary) -- usage patterns for the trait
8. [Hybrid Parallelism](./hpc/hybrid-parallelism.md) (secondary) -- initialization sequence
9. [Shared Memory Aggregation](./hpc/shared-memory-aggregation.md) (secondary) -- SharedMemoryProvider usage

#### Outgoing References for New Spec Files

The specialist must read each new spec file's `## Cross-References` section to compile its outgoing reference list. The following is the expected content based on the files produced in Epics 01-02 (the specialist must verify against the actual file content):

- **communicator-trait.md** references: communication-patterns.md, hybrid-parallelism.md, shared-memory-aggregation.md, solver-abstraction.md, backend-selection.md
- **backend-selection.md** references: communicator-trait.md, solver-abstraction.md, python-bindings.md, backend-ferrompi.md, backend-local.md, backend-tcp.md, backend-shm.md
- **backend-ferrompi.md** references: communicator-trait.md, backend-selection.md, hybrid-parallelism.md, communication-patterns.md, shared-memory-aggregation.md
- **backend-local.md** references: communicator-trait.md, backend-selection.md
- **backend-tcp.md** references: communicator-trait.md, backend-selection.md, backend-local.md, communication-patterns.md
- **backend-shm.md** references: communicator-trait.md, backend-selection.md, backend-local.md, shared-memory-aggregation.md

The specialist MUST read the actual `## Cross-References` sections of these files to compile accurate outgoing reference lists. The above is guidance, not authoritative.

#### Updated Outgoing References for Modified Specs

After tickets 009-011, these existing specs have additional outgoing references:

- **hybrid-parallelism.md**: Add communicator-trait.md, backend-selection.md, backend-ferrompi.md, backend-local.md to existing list
- **communication-patterns.md**: Add communicator-trait.md, backend-selection.md, backend-ferrompi.md, backend-tcp.md, backend-shm.md, backend-local.md to existing list
- **training-loop.md**: Add communicator-trait.md, backend-local.md to existing list
- **synchronization.md**: Add communicator-trait.md to existing list
- **work-distribution.md**: Add communicator-trait.md to existing list
- **shared-memory-aggregation.md**: Add communicator-trait.md, backend-local.md to existing list

The specialist MUST read the actual `## Cross-References` sections of each modified file (after tickets 009-011 are complete) to compile the accurate full list.

### Error Handling

N/A -- documentation spec modification.

## Acceptance Criteria

- [ ] Given Section 1, when read, then it contains 60 rows (54 existing + 6 new), with the new rows correctly mapping each new spec to `cobre-comm` as primary crate
- [ ] Given Section 2, when read, then a new `cobre-comm` reading list exists with 6 primary and 3+ secondary entries, matching the established format
- [ ] Given Section 2, when read, then the `cobre-sddp` reading list includes communicator-trait.md and communication-patterns.md as secondary entries (they are dependencies of the SDDP training loop)
- [ ] Given Section 2, when read, then the `ferrompi` reading list includes backend-ferrompi.md as a secondary entry
- [ ] Given Section 3 (Outgoing), when read, then each of the 6 new specs has its own row with the correct list of referenced specs, and the 6 modified existing specs have updated reference lists reflecting tickets 009-011
- [ ] Given Section 4 (Incoming), when read, then communicator-trait.md appears with at least 8+ incoming references (6 modified specs from tickets 009-011 + backend specs that reference it)
- [ ] Given Section 5 (Dependency Ordering), when read, then the 6 new specs are inserted at positions consistent with their incoming reference counts, and the total spec count is stated as 60
- [ ] Given the complete modified file, when read, then the formatting matches the existing convention: pipe-delimited tables with consistent column widths, markdown links using relative paths
- [ ] Given the complete modified file, when `mdbook build` is run, then no broken links exist in the rendered page

## Implementation Guide

### Suggested Approach

This ticket requires reading 6 new spec files and 6 modified spec files to compile accurate reference lists. The order of execution is:

**Step 1 -- Read all source files:**

Read the `## Cross-References` section of each of the following files:

- `src/specs/hpc/communicator-trait.md`
- `src/specs/hpc/backend-selection.md`
- `src/specs/hpc/backend-ferrompi.md`
- `src/specs/hpc/backend-local.md`
- `src/specs/hpc/backend-tcp.md`
- `src/specs/hpc/backend-shm.md`
- `src/specs/hpc/hybrid-parallelism.md` (post-ticket-009 state)
- `src/specs/hpc/communication-patterns.md` (post-ticket-010 state)
- `src/specs/architecture/training-loop.md` (post-ticket-011 state)
- `src/specs/hpc/synchronization.md` (post-ticket-011 state)
- `src/specs/hpc/work-distribution.md` (post-ticket-011 state)
- `src/specs/hpc/shared-memory-aggregation.md` (post-ticket-011 state)

For each file, extract the complete list of spec files referenced in the `## Cross-References` section.

**Step 2 -- Update Section 1 (Spec-to-Crate Mapping Table):**

Add 6 new rows at the end of the HPC section of the table (after the existing `synchronization.md` row, which is currently row 48). Number them 55-60 (after the existing interface rows 51-54). Use the entry specifications from this ticket's Requirements section.

**Step 3 -- Update Section 2 (Per-Crate Reading Lists):**

Add a new `### cobre-comm` subsection after the `### ferrompi` subsection and before the `### cobre-mcp` subsection. The reading list follows the established format with numbered entries and (secondary) annotations.

Update `### cobre-sddp` to add secondary entries for:

- communicator-trait.md (between Hybrid Parallelism and Hydro Production Models, by reading order)
- backend-selection.md (after communicator-trait.md)

Update `### ferrompi` to add:

- backend-ferrompi.md as a secondary entry

**Step 4 -- Update Section 3 (Outgoing Cross-Reference Table):**

In the HPC subsection of the outgoing table, add 6 new rows for the new spec files. The reference list for each row is compiled from Step 1.

Update the 6 existing rows whose outgoing references changed in tickets 009-011. This means rewriting the References cell for each modified spec to include the newly added cross-references.

**Step 5 -- Update Section 4 (Incoming Cross-Reference Table):**

For each new spec file, create a new row in the HPC subsection. The "Referenced By" cell lists all specs that reference this spec (the inverse of the outgoing table).

To compile incoming references for `communicator-trait.md`, check which specs include it in their outgoing references (from Step 4). Do the same for each new spec file.

Update existing rows whose incoming reference counts changed. For example:

- `backend-selection.md` is now referenced by `hybrid-parallelism.md` (added in ticket-009)
- `backend-ferrompi.md` is now referenced by `hybrid-parallelism.md` and `communication-patterns.md` (added in tickets 009-010)

**Step 6 -- Update Section 5 (Dependency Ordering):**

Count the incoming references for each new spec (from the incoming table). Insert each new spec at the appropriate position in the global ordering based on its count. Update the total spec count to 60.

Update incoming reference counts for existing specs whose counts changed (specs that gained new incoming references from the new specs or from the modified existing specs).

**Step 7 -- Update the introductory paragraph:**

Change "50 specification files" (line 2) to "60 specification files" to reflect the addition of 6 new specs. Similarly update any other counts in introductory text.

### Key Files to Modify

- `src/specs/cross-reference-index.md` (single file)

### Files the Specialist Must Read First

- All 6 new spec files (for their `## Cross-References` sections)
- All 6 modified spec files (post-tickets 009-011, for their updated `## Cross-References` sections)
- The current `src/specs/cross-reference-index.md` (for existing format and content)

### Patterns to Follow

- Table format matches existing rows exactly (pipe-delimited, consistent alignment)
- Links use relative paths from the cross-reference-index file location (`./hpc/filename.md`, `./architecture/filename.md`)
- Reading lists use numbered entries with (secondary) annotations
- Incoming references are listed as comma-separated markdown links
- Dependency ordering table is sorted by incoming reference count descending, then by section order

### Pitfalls to Avoid

- Do NOT guess at cross-reference lists. Read the actual `## Cross-References` section of each file and transcribe accurately. Inaccurate cross-reference lists are the highest-risk error in this ticket.
- Do NOT include `comm.md` (the crate spec in `src/crates/`) in the cross-reference index. The index covers only spec files in `src/specs/`, not crate documentation files.
- Do NOT renumber existing rows in any table. Add new rows at the end of each section.
- When counting incoming references for the Dependency Ordering table, count only references from spec files (not from crate docs). Cross-references within the new specs (e.g., `communicator-trait.md` references `backend-selection.md` and vice versa) do count.
- Verify that the total number of rows in Section 1 equals the total number of specs mentioned in the introductory paragraph.

## Testing Requirements

### Unit Tests

N/A -- documentation spec.

### Integration Tests

- Run `mdbook build` from the repository root. Verify no broken links in the rendered cross-reference index page.
- Verify that every new spec file listed in Section 1 has a corresponding row in Sections 3 and 4.
- Verify that the incoming reference count in Section 5 matches the number of entries in the "Referenced By" cell in Section 4 for each spec.
- Spot-check 3-4 outgoing reference entries against the actual `## Cross-References` section of the source files to confirm accuracy.

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-009, ticket-010, ticket-011, ticket-012 (all refactored specs and SUMMARY.md must be final before the index is updated)
- **Blocks**: None within Epic 03. ticket-014 (Epic 04) may reference this.

## Effort Estimate

**Points**: 3
**Confidence**: Medium (accuracy of cross-reference compilation depends on reading 12 files and transcribing correctly; the mechanical nature is straightforward but error-prone)
