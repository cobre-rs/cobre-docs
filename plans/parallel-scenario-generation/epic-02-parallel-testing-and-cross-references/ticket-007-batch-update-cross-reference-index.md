# ticket-007: Batch Update Cross-Reference Index

## Context

### Background

The cross-reference index (`src/specs/cross-reference-index.md`) maintains 5 sections that must stay consistent when spec files are modified: spec-to-crate mapping, per-crate reading lists, outgoing cross-reference table, incoming cross-reference table, and dependency ordering. Per the `CLAUDE.md` convention, cross-reference index updates must always be done in batches (all affected specs at once), never piecemeal.

This ticket performs the batch update for all files modified across Epics 01 and 02 of the parallel scenario generation plan. The modifications span 7 spec files, and the index must be updated to reflect the new outgoing and incoming cross-references created by the content additions.

### Relation to Epic

This is the final ticket in Epic 02 and the final ticket in the entire plan. It depends on all preceding tickets because the index update must capture the complete set of cross-reference changes.

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`

The file contains 79 spec entries. The relevant entries for this update are:

| #   | File                         | Section      | Primary Crate    |
| --- | ---------------------------- | ------------ | ---------------- |
| 33  | scenario-generation.md       | architecture | cobre-stochastic |
| 41  | work-distribution.md         | hpc          | cobre-sddp       |
| 42  | hybrid-parallelism.md        | hpc          | cobre-sddp       |
| 45  | shared-memory-aggregation.md | hpc          | cobre-sddp       |
| 65  | sampling-scheme-trait.md     | architecture | cobre-stochastic |
| 66  | sampling-scheme-testing.md   | architecture | cobre-stochastic |
| 67  | cut-selection-trait.md       | architecture | cobre-sddp       |
| 79  | decision-log.md              | overview     | (cross-cutting)  |

**Files modified in this plan that will have new cross-references to reflect:**

1. `scenario-generation.md` -- New outgoing refs to: `cut-selection-trait.md`, `work-distribution.md`, `shared-memory-aggregation.md`, `hybrid-parallelism.md`
2. `sampling-scheme-trait.md` -- New outgoing ref to: `work-distribution.md`
3. `sampling-scheme-testing.md` -- New outgoing refs to: `scenario-generation.md` (SS2.2b/SS2.3c), `work-distribution.md`
4. `work-distribution.md` -- Updated outgoing ref to: `scenario-generation.md` (now includes SS2.2b, SS2.3c)
5. `shared-memory-aggregation.md` -- Updated outgoing ref to: `scenario-generation.md` (now includes SS2.2b, SS2.3c)
6. `hybrid-parallelism.md` -- New outgoing ref to: `scenario-generation.md` (SS2.2b)
7. `decision-log.md` -- New DEC-017 entry references `scenario-generation.md`

**New incoming cross-references to add:**

- `cut-selection-trait.md` gains an incoming ref from `scenario-generation.md` (comparison in SS2.2b)
- `work-distribution.md` gains incoming refs from `scenario-generation.md`, `sampling-scheme-trait.md`, `sampling-scheme-testing.md`
- `shared-memory-aggregation.md` gains incoming ref from `scenario-generation.md` (already had one; entry updated)
- `hybrid-parallelism.md` gains incoming ref from `scenario-generation.md` (new)
- `scenario-generation.md` gains incoming refs from `hybrid-parallelism.md`, `sampling-scheme-testing.md` (for SS2.2b/SS2.3c)

## Specification

### Requirements

Update `src/specs/cross-reference-index.md` in a single batch. The updates affect sections 3 (outgoing), 4 (incoming), and potentially 5 (dependency ordering). Sections 1 and 2 do not change because no new spec files are added and no crate assignments change.

**Section 3: Outgoing Cross-Reference Table**

For each of the 7 modified files, update its row in the outgoing cross-reference table to include the new outgoing references:

1. **scenario-generation.md (#33)**: Add `cut-selection-trait.md`, `work-distribution.md`, `shared-memory-aggregation.md`, `hybrid-parallelism.md` to the outgoing refs (if not already present)
2. **sampling-scheme-trait.md (#65)**: Add `work-distribution.md` to the outgoing refs
3. **sampling-scheme-testing.md (#66)**: Add `work-distribution.md` to the outgoing refs (the reference to `scenario-generation.md` should already be present)
4. **work-distribution.md (#41)**: Verify `scenario-generation.md` is present (it should be; the entry was updated in ticket-006)
5. **shared-memory-aggregation.md (#45)**: Verify `scenario-generation.md` is present (it should be)
6. **hybrid-parallelism.md (#42)**: Add `scenario-generation.md` to the outgoing refs
7. **decision-log.md (#79)**: Verify that `scenario-generation.md` is listed (decision log references all specs via DEC entries)

**Section 4: Incoming Cross-Reference Table**

For each spec that gains new incoming references, update its row:

1. **cut-selection-trait.md (#67)**: Add `scenario-generation.md` to incoming refs
2. **work-distribution.md (#41)**: Add `sampling-scheme-trait.md` and `sampling-scheme-testing.md` to incoming refs (the ref from `scenario-generation.md` should already be present)
3. **hybrid-parallelism.md (#42)**: Add `scenario-generation.md` to incoming refs (if not already present)
4. **scenario-generation.md (#33)**: Add `hybrid-parallelism.md` to incoming refs (if not already present)

**Section 5: Dependency Ordering**

Check whether the new cross-references change the topological ordering. The new outgoing ref from `scenario-generation.md` to `cut-selection-trait.md` does not create a cycle (there is no existing path from `cut-selection-trait.md` back to `scenario-generation.md`). The new refs from `hybrid-parallelism.md` to `scenario-generation.md` also do not create a cycle. No reordering is expected, but verify.

### Inputs/Props

- The current content of `src/specs/cross-reference-index.md` (read the relevant sections before modifying)
- The Cross-References sections of all 7 modified files (to extract the exact outgoing references)

### Outputs/Behavior

Updated sections 3 and 4 (and potentially 5) of `cross-reference-index.md`. The document count header does not change (still 79 files).

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/cross-reference-index.md` section 3, when checking the outgoing refs row for `scenario-generation.md`, then `cut-selection-trait.md`, `work-distribution.md`, `shared-memory-aggregation.md`, and `hybrid-parallelism.md` are listed as outgoing references
- [ ] Given section 3, when checking the outgoing refs row for `sampling-scheme-trait.md`, then `work-distribution.md` is listed as an outgoing reference
- [ ] Given section 4, when checking the incoming refs row for `cut-selection-trait.md`, then `scenario-generation.md` is listed as an incoming reference
- [ ] Given section 4, when checking the incoming refs row for `work-distribution.md`, then `sampling-scheme-trait.md` and `sampling-scheme-testing.md` are listed as incoming references
- [ ] Given the modified `cross-reference-index.md`, when running `mdbook build` from the repo root, then the build completes without new warnings

## Implementation Guide

### Suggested Approach

1. Read `src/specs/cross-reference-index.md` sections 3 and 4 (these are large tables; use offset/limit to read the relevant rows for each file)
2. For each of the 7 modified spec files, read its current Cross-References section to extract the complete list of outgoing references
3. Compare the current outgoing reference list against the section 3 row in the index -- identify any new entries needed
4. Update section 3 rows for files with new outgoing references
5. Compute the inverse: for each new outgoing reference A -> B, ensure B's incoming row in section 4 lists A
6. Update section 4 rows accordingly
7. Check section 5 for topological consistency (no cycles introduced)
8. Run `mdbook build` to verify no new warnings

### Key Files to Modify

- `src/specs/cross-reference-index.md` -- Update sections 3 and 4

### Patterns to Follow

- The cross-reference index uses comma-separated file names in outgoing/incoming columns
- File names are listed without paths (just the filename, e.g., `scenario-generation.md`)
- Entries within a row should be in alphabetical order
- Per `CLAUDE.md`: "Always perform updates in batches (all affected specs at once per epic), never piecemeal"

### Pitfalls to Avoid

- Do NOT update only section 3 without updating section 4 (both must be updated together)
- Do NOT add new rows to section 1 (no new spec files are created)
- Do NOT change crate assignments in section 1 or section 2
- Do NOT modify the document count header (it remains 79)
- Do NOT update the file piecemeal across multiple commits -- all index changes must be in a single commit

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `mdbook build` from repo root and verify no new warnings
- Verify section 3/4 symmetry: for each outgoing ref A -> B in section 3, verify B lists A in its incoming refs in section 4

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-005-add-parallel-generation-tests.md, ticket-006-update-bidirectional-cross-references.md
- **Blocks**: None (final ticket)

## Effort Estimate

**Points**: 2
**Confidence**: High

## Out of Scope

- Modifying any spec file other than `cross-reference-index.md`
- Adding new spec files to the index
- Changing crate assignments or reading list order in sections 1 and 2
- Verifying section-number accuracy of existing index entries (that was done in the spec-readiness plan)
