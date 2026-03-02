# ticket-004: Add DEC-017 Decision Log Entry and Inline Markers

## Context

### Background

The deterministic seed derivation architecture (SipHash-1-3) in `scenario-generation.md` SS2.2/SS2.2a enables communication-free parallel noise generation -- every rank independently derives identical noise for any `(iteration, scenario_index, stage_id)` tuple without MPI broadcast or gather. This is a cross-cutting architectural decision that affects multiple spec files: the scenario generation spec, the sampling scheme trait, the shared memory aggregation spec, the work distribution spec, and the hybrid parallelism spec. Per the Decision Log convention in `CLAUDE.md`, any architectural decision affecting 2+ spec files must be registered in the Decision Log with inline markers in all affected files.

Tickets 001-003 have added the explicit parallel execution documentation. This ticket creates the DEC-017 registry entry and propagates inline markers to all affected files.

### Relation to Epic

This is the final ticket in Epic 01. It depends on all three content tickets (001-003) because the Decision Log entry references the content they added (SS2.2b, SS2.3c, SS5.2 addendum).

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/overview/decision-log.md`

The Decision Log currently contains 16 entries (DEC-001 through DEC-016). DEC-016 is the most recent entry (dated 2026-03-02), documenting deferred parallel cut selection. The next available ID is DEC-017.

The Decision Log format requires:

- A registry table row with columns: ID, Date, Status, Decision Summary, Primary Spec Section, Affected Files
- Inline markers in each affected file in the format: `> **Decision [DEC-017](../overview/decision-log.md#dec-017) (active):** [One-sentence summary].`

The affected files for DEC-017 are:

1. `scenario-generation.md` -- Primary spec; contains SS2.2, SS2.2a, SS2.2b, SS2.3c
2. `sampling-scheme-trait.md` -- Consumes noise vectors from the generation pipeline; references reproducibility guarantee
3. `shared-memory-aggregation.md` -- SS1.4 documents the `SharedRegion<T>` opening tree protocol
4. `work-distribution.md` -- SS1 documents forward pass scenario distribution (which implicitly relies on communication-free noise)
5. `hybrid-parallelism.md` -- SS5.1 documents the parallel scenario solving pattern

## Specification

### Requirements

**Part A: Decision Log Registry Entry**

Add a new row to the registry table in `decision-log.md` section 2 with the following values:

| Column               | Value                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                   | DEC-017                                                                                                                                                                                                         |
| Date                 | 2026-03-02                                                                                                                                                                                                      |
| Status               | active                                                                                                                                                                                                          |
| Decision Summary     | Communication-free parallel noise generation: every rank and thread independently derives identical noise via deterministic SipHash-1-3 seed derivation, eliminating MPI broadcast or gather for scenario noise |
| Primary Spec Section | [Scenario Generation SS2.2b](../architecture/scenario-generation.md)                                                                                                                                            |
| Affected Files       | `scenario-generation.md`, `sampling-scheme-trait.md`, `shared-memory-aggregation.md`, `work-distribution.md`, `hybrid-parallelism.md`                                                                           |

The new row must be appended after the DEC-016 row, maintaining the table's column alignment.

**Part B: Inline Markers**

Place the following inline marker blockquote in each affected file, at the location specified:

**Marker text:**

```markdown
> **Decision [DEC-017](../overview/decision-log.md#dec-017) (active):** Communication-free parallel noise generation -- every rank and thread independently derives identical noise via deterministic SipHash-1-3 seed derivation, eliminating MPI broadcast or gather for scenario noise.
```

**Placement per file:**

1. **`scenario-generation.md`**: Place the marker at the top of the new SS2.2b subsection (after the `### 2.2b Work Distribution for Noise Generation` heading, before the first paragraph). The path is `../overview/decision-log.md` (correct for files in `src/specs/architecture/`).

2. **`sampling-scheme-trait.md`**: Place the marker in SS2.1 `sample_forward`, after the **Infallibility** paragraph (after line 133). The sampling scheme consumes noise vectors that are generated communication-free; the marker documents this dependency. The path is `../overview/decision-log.md`.

3. **`shared-memory-aggregation.md`**: Place the marker in SS1.4 "Shared Data: Opening Tree", after the property table and before the "Generation protocol" list (after line 66). The opening tree generation protocol in SS1.4 relies on the communication-free property. The path is `../overview/decision-log.md`.

4. **`work-distribution.md`**: Place the marker in SS1.2 "Thread-Trajectory Affinity Within Rank", after the bullet list of benefits (after line 29). The thread-trajectory affinity relies on each thread generating noise independently. The path is `../overview/decision-log.md`.

5. **`hybrid-parallelism.md`**: Place the marker in SS5.1 "Core Pattern: Parallel Scenario Solving", before the code snippet (after line 177, before the `\`\`\`rust`block). The parallel scenario solving pattern implicitly relies on communication-free noise generation. The path is`../overview/decision-log.md`.

### Inputs/Props

- The current content of `decision-log.md` (to find the insertion point for the new row)
- The current content of all 5 affected files (to find the correct marker placement locations)
- The Decision Log convention from `CLAUDE.md` (for marker format)

### Outputs/Behavior

- `decision-log.md` gains a DEC-017 row in the registry table
- Each of the 5 affected files gains an inline DEC-017 marker blockquote at the specified location

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/decision-log.md`, when searching for `DEC-017`, then exactly one row is found in the registry table with Status = `active`, and the Affected Files column lists exactly 5 files: `scenario-generation.md`, `sampling-scheme-trait.md`, `shared-memory-aggregation.md`, `work-distribution.md`, `hybrid-parallelism.md`
- [ ] Given the command `grep -r "DEC-017" src/specs/`, when executed from the repo root, then matches are found in exactly 6 files: the 5 affected files listed above plus `decision-log.md` itself
- [ ] Given each of the 5 affected files, when checking the inline marker, then it matches the format `> **Decision [DEC-017](../overview/decision-log.md#dec-017) (active):** Communication-free parallel noise generation` followed by the one-sentence summary
- [ ] Given the file `src/specs/overview/decision-log.md`, when checking the DEC-017 row's Primary Spec Section column, then it contains `[Scenario Generation SS2.2b](../architecture/scenario-generation.md)`
- [ ] Given all modified files, when running `mdbook build` from the repo root, then the build completes without new warnings

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/decision-log.md` to find the end of the registry table (after the DEC-016 row, around line 37)
2. Append the DEC-017 row to the registry table, maintaining column alignment with existing rows
3. For each of the 5 affected files:
   a. Read the file to find the exact insertion point (as specified in Requirements Part B)
   b. Insert the inline marker blockquote at that location
   c. Verify the relative path to `decision-log.md` is correct for the file's directory (`../overview/decision-log.md` for architecture and HPC files)
4. Run `grep -r "DEC-017" src/specs/` to verify exactly 6 files contain the marker
5. Run `mdbook build` to verify no new warnings

### Key Files to Modify

- `src/specs/overview/decision-log.md` -- Add DEC-017 registry row
- `src/specs/architecture/scenario-generation.md` -- Add inline marker in SS2.2b
- `src/specs/architecture/sampling-scheme-trait.md` -- Add inline marker in SS2.1
- `src/specs/hpc/shared-memory-aggregation.md` -- Add inline marker in SS1.4
- `src/specs/hpc/work-distribution.md` -- Add inline marker in SS1.2
- `src/specs/hpc/hybrid-parallelism.md` -- Add inline marker in SS5.1

### Patterns to Follow

- Follow the exact format of existing inline markers in the codebase (e.g., the DEC-016 marker in `shared-memory-aggregation.md` line 43 and `synchronization.md` line 52)
- The Decision Log registry row must be a single table row, even if the Affected Files list is long -- use comma-separated backtick-quoted filenames
- The inline marker uses a blockquote (`>`) with bold decision reference and anchor link

### Pitfalls to Avoid

- Do NOT use `./decision-log.md` for files in `src/specs/architecture/` or `src/specs/hpc/` -- the correct relative path is `../overview/decision-log.md`
- Do NOT place the marker inside a code block or table -- it must be a standalone blockquote paragraph
- Do NOT modify the content of the DEC-016 or any earlier Decision Log entry
- Do NOT add the marker to files not listed in the Affected Files column

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `grep -r "DEC-017" src/specs/` and verify exactly 6 matches (one per affected file + decision-log.md)
- Run `mdbook build` from repo root and verify no new warnings

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-add-noise-generation-work-distribution.md, ticket-002-document-parallel-opening-tree-generation.md, ticket-003-document-forward-pass-thread-noise-generation.md
- **Blocks**: ticket-005-add-parallel-generation-tests.md (tests reference DEC-017 in their rationale)

## Effort Estimate

**Points**: 2
**Confidence**: High

## Out of Scope

- Adding new cross-references to the Cross-References sections of the affected files (ticket-006)
- Updating the cross-reference index (ticket-007)
- Creating any new spec files
