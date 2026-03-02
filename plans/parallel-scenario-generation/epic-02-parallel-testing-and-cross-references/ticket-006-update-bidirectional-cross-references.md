# ticket-006: Update Bidirectional Cross-References

## Context

### Background

The content added by Epic 01 (SS2.2b, SS2.3c, SS5.2 addendum in `scenario-generation.md`) and ticket-005 (SS5 in `sampling-scheme-testing.md`) creates new relationships between spec files that must be reflected in their Cross-References sections. The Cobre spec corpus maintains bidirectional cross-references: if file A references file B in its body, both A and B should list each other in their Cross-References sections. This ticket updates the Cross-References sections of all files modified across both epics to reflect the new relationships.

### Relation to Epic

This is the second ticket in Epic 02. It ensures all cross-references are bidirectionally consistent before the cross-reference index update in ticket-007.

### Current State

The following new cross-reference relationships were created by the content additions in Epic 01 and ticket-005:

**New references FROM `scenario-generation.md` TO HPC specs (added in SS2.2b and SS2.3c):**

- `scenario-generation.md` SS2.2b -> `cut-selection-trait.md` SS2.2a (comparison reference)
- `scenario-generation.md` SS2.2b -> `work-distribution.md` §3.1 (partitioning formula)
- `scenario-generation.md` SS2.2b -> `shared-memory-aggregation.md` §1.4 (backward pass note)
- `scenario-generation.md` SS2.3c -> `shared-memory-aggregation.md` §1.4 (reconciliation)
- `scenario-generation.md` SS2.3c -> `work-distribution.md` §3.1 (partitioning formula)

**New references FROM `sampling-scheme-testing.md` TO architecture/HPC specs (added in SS5):**

- `sampling-scheme-testing.md` SS5 -> `scenario-generation.md` SS2.2b (parallel model under test)
- `sampling-scheme-testing.md` SS5 -> `scenario-generation.md` SS2.3c (opening tree parallel model)
- `sampling-scheme-testing.md` SS5 -> `work-distribution.md` §3.1 (contiguous block formula)

**Existing Cross-References sections that need updates:**

1. `scenario-generation.md` Cross-References (lines 635-651): Currently has 11 entries. Needs new entries for `cut-selection-trait.md`, `work-distribution.md`, `shared-memory-aggregation.md`, and `hybrid-parallelism.md`.
2. `sampling-scheme-trait.md` Cross-References (lines 383-397): Currently has 13 entries. Needs a new entry for `work-distribution.md` (the DEC-017 marker in SS2.1 creates a conceptual link to the parallel model).
3. `sampling-scheme-testing.md` Cross-References (lines 149-159): Currently has 8 entries. Needs new entries for `scenario-generation.md` SS2.2b/SS2.3c and `work-distribution.md`.
4. `work-distribution.md` Cross-References (lines 159-173): Currently has 13 entries. Has an existing entry for `scenario-generation.md` §2.3 (opening tree). Needs to add references to SS2.2b and SS2.3c.
5. `shared-memory-aggregation.md` Cross-References (lines 188-207): Currently has 16 entries. Has an existing entry for `scenario-generation.md` §2.2 and §2.3. Needs to add reference to SS2.2b and SS2.3c.
6. `hybrid-parallelism.md` Cross-References (lines 305-329): Currently has 19 entries. Does not currently reference `scenario-generation.md` directly (references it indirectly through training-loop.md). Needs a new entry for `scenario-generation.md` SS2.2b.

## Specification

### Requirements

Update the Cross-References section of each file listed below. For each file, add only the new entries specified -- do not remove or modify existing entries.

**File 1: `src/specs/architecture/scenario-generation.md`**

Add 4 new entries to the Cross-References section (after the existing entries, before the end of the section):

```markdown
- [Cut Selection Strategy Trait SS2.2a](./cut-selection-trait.md) -- Parallel work distribution pattern for cut selection; comparison reference for noise generation work distribution (SS2.2b)
- [Work Distribution §3.1](../hpc/work-distribution.md) -- Contiguous block assignment formula used by noise generation (SS2.2b) and opening tree generation (SS2.3c)
- [Shared Memory Aggregation §1.4](../hpc/shared-memory-aggregation.md) -- SharedRegion opening tree protocol; opening tree generation partitioning details provided by SS2.3c
- [Hybrid Parallelism §5.1](../hpc/hybrid-parallelism.md) -- Core parallel scenario solving pattern; consumes communication-free noise generation (SS2.2b)
```

**File 2: `src/specs/architecture/sampling-scheme-trait.md`**

Add 1 new entry to the Cross-References section:

```markdown
- [Work Distribution §3.1](../hpc/work-distribution.md) -- Contiguous block assignment formula; forward scenario distribution that determines which rank generates noise for which scenarios
```

**File 3: `src/specs/architecture/sampling-scheme-testing.md`**

Add 2 new entries to the Cross-References section:

```markdown
- [Scenario Generation SS2.2b](./scenario-generation.md) -- Communication-free parallel noise generation work distribution (tested by SS5)
- [Work Distribution §3.1](../hpc/work-distribution.md) -- Contiguous block assignment formula used in parallel generation tests (SS5)
```

**File 4: `src/specs/hpc/work-distribution.md`**

Update the existing `Scenario Generation` entry (currently: `- [Scenario Generation §2.3](../architecture/scenario-generation.md) — Fixed opening tree: the $N_{\text{openings}}$ noise vectors evaluated in the backward pass`) to include the new sections:

```markdown
- [Scenario Generation §2.2b, §2.3, §2.3c](../architecture/scenario-generation.md) -- Communication-free noise generation work distribution (§2.2b), fixed opening tree (§2.3), parallel opening tree generation partitioning (§2.3c)
```

**File 5: `src/specs/hpc/shared-memory-aggregation.md`**

Update the existing `Scenario Generation` entries. Currently there are two entries:

- `[Scenario Generation §2.2](...) -- Deterministic seed derivation, reproducible sampling`
- `[Scenario Generation §2.3](...) -- Fixed opening tree generation and memory layout`

Replace these two entries with a single consolidated entry:

```markdown
- [Scenario Generation §2.2, §2.2b, §2.3, §2.3c](../architecture/scenario-generation.md) -- Deterministic seed derivation (§2.2), communication-free noise work distribution (§2.2b), fixed opening tree generation and memory layout (§2.3), parallel opening tree generation partitioning (§2.3c)
```

**File 6: `src/specs/hpc/hybrid-parallelism.md`**

Add 1 new entry to the Cross-References section:

```markdown
- [Scenario Generation §2.2b](../architecture/scenario-generation.md) -- Communication-free noise generation work distribution; each Rayon worker thread generates noise independently using deterministic seeds
```

### Inputs/Props

- The current Cross-References sections of all 6 files (read each before modifying)
- The content added by tickets 001-005 (to identify which new references exist)

### Outputs/Behavior

Updated Cross-References sections in all 6 files. No content outside the Cross-References sections is modified.

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/scenario-generation.md`, when counting entries in the Cross-References section, then it contains the original 11 entries plus 4 new entries (15 total), and the new entries reference `cut-selection-trait.md`, `work-distribution.md`, `shared-memory-aggregation.md`, and `hybrid-parallelism.md`
- [ ] Given the file `src/specs/architecture/sampling-scheme-testing.md`, when counting entries in the Cross-References section, then it contains the original 8 entries plus 2 new entries (10 total), and the new entries reference `scenario-generation.md` SS2.2b and `work-distribution.md`
- [ ] Given the file `src/specs/hpc/work-distribution.md`, when checking the `Scenario Generation` entry, then it references SS2.2b, SS2.3, and SS2.3c (not just SS2.3)
- [ ] Given all 6 modified files, when running `mdbook build` from the repo root, then the build completes without new warnings

## Implementation Guide

### Suggested Approach

1. Read the Cross-References section of each of the 6 files to understand the current entries
2. For each file, apply the changes specified in Requirements -- add new entries or update existing entries as directed
3. Verify that all relative paths are correct:
   - Architecture files use `./` for other architecture files and `../hpc/` for HPC files
   - HPC files use `../architecture/` for architecture files and `./` for other HPC files
4. Verify that section references use the correct prefix: `SS` for architecture sections, `§` for HPC sections
5. Run `mdbook build` to verify no new warnings

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- Add 4 cross-reference entries
- `src/specs/architecture/sampling-scheme-trait.md` -- Add 1 cross-reference entry
- `src/specs/architecture/sampling-scheme-testing.md` -- Add 2 cross-reference entries
- `src/specs/hpc/work-distribution.md` -- Update 1 cross-reference entry
- `src/specs/hpc/shared-memory-aggregation.md` -- Consolidate 2 entries into 1
- `src/specs/hpc/hybrid-parallelism.md` -- Add 1 cross-reference entry

### Patterns to Follow

- Cross-reference entry format: `- [Display Name](./relative-path.md) -- Description (section list)`
- Use `§` prefix for HPC section numbers in entries within architecture files referencing HPC files
- Use `SS` prefix for architecture section numbers in entries within HPC files referencing architecture files
- For multi-section references, list sections in ascending order: `§2.2, §2.2b, §2.3, §2.3c`

### Pitfalls to Avoid

- Do NOT remove any existing cross-reference entries -- only add or update
- Do NOT use `§` prefix for section numbers within architecture files' own entries (use `SS` prefix)
- Do NOT modify content outside the Cross-References section of each file
- Do NOT consolidate entries unless explicitly instructed (only `shared-memory-aggregation.md` consolidates two entries into one)
- Do NOT add the convention blockquote or any other structural content

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `mdbook build` from repo root and verify no new warnings

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-005-add-parallel-generation-tests.md (the new SS5 section creates references that must be reflected in cross-references)
- **Blocks**: ticket-007-batch-update-cross-reference-index.md

## Effort Estimate

**Points**: 2
**Confidence**: High

## Out of Scope

- Updating the cross-reference index (ticket-007)
- Adding new content to any spec section (only Cross-References sections are modified)
- Modifying cross-references in files not listed in Requirements (e.g., `training-loop.md`, `cut-selection-trait.md`)
