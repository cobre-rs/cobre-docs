# ticket-015 Update Cross-Reference Index for Affected Entries

## Context

### Background

The cross-reference index (`src/specs/cross-reference-index.md`) is the canonical navigation index for the entire Cobre spec corpus. It has 5 sections: (1) Spec-to-Crate Mapping Table, (2) Per-Crate Reading Lists, (3) Outgoing Cross-Reference Table, (4) Incoming Cross-Reference Table, and (5) Dependency Ordering. The index currently tracks 78 spec files.

Epic 03 created `src/specs/overview/decision-log.md` (a new spec file with 15 DEC entries and 3 sections) and added inline DEC markers to 7 primary spec files. The decision-log.md file has outgoing links to 9 other specs (via its Primary Spec Section column), and 7 spec files now contain incoming links back to it (via inline `[DEC-NNN](../overview/decision-log.md)` blockquotes). Additionally, Epic 01 deleted Binary Formats Appendix A (which reduced `binary-formats.md` from 6 numbered sections to 5 numbered sections + Cross-References), but the cross-reference index was not updated for any of these changes.

### Relation to Epic

This is the first ticket of Epic 04 (Cross-File Verification). It ensures the cross-reference index accurately reflects the post-cleanup corpus state before the consistency audit (ticket-016) and final build verification (ticket-017) run.

### Current State

- `decision-log.md` is NOT present in the cross-reference index (grep for "decision-log" in the file returns zero matches).
- The index header says "78 specification files" -- this needs to become 79 after adding `decision-log.md`.
- `binary-formats.md` row in section 1 is unchanged (its section structure was modified by ticket-002 which deleted Appendix A, but the mapping table entry does not track section counts, so it may need no change beyond verifying accuracy).
- 7 spec files gained new outgoing links to `decision-log.md` via inline DEC markers: `solver-abstraction.md`, `solver-interface-trait.md`, `binary-formats.md`, `memory-architecture.md`, `python-bindings.md`, `design-principles.md`, `production-scale-reference.md`.
- `decision-log.md` has outgoing links (via its Primary Spec Section column) to: `solver-abstraction.md`, `binary-formats.md`, `input-directory-structure.md`, `solver-interface-trait.md`, `memory-architecture.md`, `hybrid-parallelism.md`, `python-bindings.md`, `design-principles.md`, `production-scale-reference.md`.

## Specification

### Requirements

1. Add `decision-log.md` to section 1 (Spec-to-Crate Mapping Table) as entry #79 (or inserted in sequence after the other overview specs), with:
   - Section: `overview`
   - Primary Crate: `(cross-cutting)`
   - Secondary Crate(s): `All crates`
2. Add `decision-log.md` to section 2 (Per-Crate Reading Lists) as a `(secondary)` entry in all 11 per-crate reading lists, following the same pattern as `implementation-ordering.md` and `spec-gap-inventory.md`.
3. Add a row for `decision-log.md` in section 3 (Outgoing Cross-Reference Table) under the Overview subsection, listing its 9 outgoing references.
4. Update section 3 rows for the 7 files that now link to `decision-log.md`: add `decision-log.md` to their outgoing references.
5. Add a row for `decision-log.md` in section 4 (Incoming Cross-Reference Table) under the Overview subsection, listing all 7 files that reference it.
6. Update section 4 rows for the 9 files that `decision-log.md` links to: add `decision-log.md` to their incoming references.
7. Add `decision-log.md` to section 5 (Dependency Ordering) with the correct incoming reference count (7), inserted at the appropriate position in the sorted table.
8. Update the header text from "78 specification files" to "79 specification files".

### Inputs/Props

**Outgoing references from `decision-log.md`** (from its Primary Spec Section column links):

- `solver-abstraction.md` (DEC-001, DEC-005, DEC-007, DEC-008, DEC-015)
- `binary-formats.md` (DEC-002, DEC-003, DEC-004)
- `input-directory-structure.md` (DEC-004)
- `solver-interface-trait.md` (DEC-006)
- `memory-architecture.md` (DEC-010, DEC-011)
- `hybrid-parallelism.md` (DEC-011)
- `python-bindings.md` (DEC-012)
- `design-principles.md` (DEC-013, DEC-014)
- `production-scale-reference.md` (DEC-009)

**Incoming references to `decision-log.md`** (files with inline `[DEC-NNN](decision-log.md)` links):

- `solver-abstraction.md`
- `solver-interface-trait.md`
- `binary-formats.md`
- `memory-architecture.md`
- `python-bindings.md`
- `design-principles.md`
- `production-scale-reference.md`

### Outputs/Behavior

- `src/specs/cross-reference-index.md` is updated in all 5 sections to accurately reflect `decision-log.md` as a new spec file and all changed cross-reference relationships.
- No other files are modified.

### Error Handling

- If the incoming reference count for `decision-log.md` in section 5 does not match the number of files listed in section 4, resolve the discrepancy before committing.
- If any outgoing link from `decision-log.md` points to a file not currently in the index, flag it (should not happen since all targets are existing spec files).

## Acceptance Criteria

- [ ] Given `decision-log.md` is absent from the index, when `grep -c "decision-log" src/specs/cross-reference-index.md` is run after the edit, then the count is >= 20 (the file appears in sections 1-5 and across multiple per-crate reading lists).
- [ ] Given the index header says "78 specification files", when the edit is complete, then the header says "79 specification files".
- [ ] Given `decision-log.md` links to 9 specs, when section 3 (Outgoing) is inspected, then the `decision-log.md` row lists exactly 9 outgoing references: `solver-abstraction.md`, `binary-formats.md`, `input-directory-structure.md`, `solver-interface-trait.md`, `memory-architecture.md`, `hybrid-parallelism.md`, `python-bindings.md`, `design-principles.md`, `production-scale-reference.md`.
- [ ] Given 7 spec files reference `decision-log.md`, when section 4 (Incoming) is inspected, then the `decision-log.md` row lists exactly 7 incoming references: `solver-abstraction.md`, `solver-interface-trait.md`, `binary-formats.md`, `memory-architecture.md`, `python-bindings.md`, `design-principles.md`, `production-scale-reference.md`.
- [ ] Given `decision-log.md` has 7 incoming references, when section 5 (Dependency Ordering) is inspected, then `decision-log.md` appears with `Incoming References: 7` and is inserted between other specs with 7 incoming refs (in the overview section-order position).

## Implementation Guide

### Suggested Approach

1. Read the full `src/specs/cross-reference-index.md` file (682 lines, read in sections of ~200 lines).
2. Update section 1: insert `decision-log.md` as row 77 (after `spec-gap-inventory.md` row 74, before `ecosystem-guidelines.md` row 74; or assign the next number 79 at the bottom of the overview group). Use: `| 79 | [decision-log.md](./overview/decision-log.md) | overview | (cross-cutting) | All crates |`
3. Update section 2: in each of the 11 per-crate reading lists, add `[Decision Log](./overview/decision-log.md) (secondary)` at the end, after `Ecosystem Vision`. Follow the pattern of `implementation-ordering.md` and `spec-gap-inventory.md` entries.
4. Update section 3 (Outgoing): add a `decision-log.md` row under the Overview subsection listing 9 outgoing references. Also update the outgoing rows for the 7 files that gained `decision-log.md` links (add `decision-log.md` to each row).
5. Update section 4 (Incoming): add a `decision-log.md` row under the Overview subsection listing 7 incoming references. Also update the incoming rows for the 9 files that `decision-log.md` links to (add `decision-log.md` to each row).
6. Update section 5 (Dependency Ordering): insert `decision-log.md` with `overview` section and `7` incoming references, at position ~45-46 (between entries with 7 incoming refs, ordered by section: overview comes before math, data-model, architecture, hpc).
7. Update the header: change "78 specification files" to "79 specification files".
8. Verify by running `grep -c "decision-log" src/specs/cross-reference-index.md` to confirm the file appears in all expected locations.

### Key Files to Modify

- `src/specs/cross-reference-index.md` (all 5 sections)

### Patterns to Follow

- The cross-reference index batch update methodology from `CLAUDE.md`: update all 5 sections in a single pass, not piecemeal.
- Follow the exact row format used by `implementation-ordering.md` and `spec-gap-inventory.md` (both are `(cross-cutting)` overview specs) for section 1 and section 2 entries.
- In section 2 per-crate reading lists, `decision-log.md` goes as `(secondary)` in the same position as other cross-cutting overview specs (after `Ecosystem Vision`).

### Pitfalls to Avoid

- Do not update section 3 or 4 without checking both directions: adding `decision-log.md` as outgoing from file X requires also adding file X as incoming to `decision-log.md`, and vice versa.
- Do not renumber existing rows in section 1 (the numbering is stable identifiers).
- Do not change the section-5 sort order convention: same incoming-count entries are ordered by section precedence (overview, math, data-model, architecture, hpc, configuration, deferred, interfaces).
- Do not modify `binary-formats.md` or any other spec file -- this ticket touches only the cross-reference index.

## Testing Requirements

### Unit Tests

Not applicable (markdown editing).

### Integration Tests

- Run `mdbook build` and verify it completes with no new warnings beyond the pre-existing `risk-measures.md` `<span>` warnings and the search index size warning.
- Verify `grep -c "decision-log" src/specs/cross-reference-index.md` returns >= 20.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-002-cleanup-binary-formats-option-a.md, ticket-003-remove-appendix-a-cross-references.md, ticket-007-collapse-solver-abstraction-superseded-content.md, ticket-012-create-decision-log.md (all completed)
- **Blocks**: ticket-016-full-corpus-consistency-audit.md, ticket-017-final-verification-and-build.md

## Effort Estimate

**Points**: 2
**Confidence**: High
