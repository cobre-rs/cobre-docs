# ticket-023 Clarify StageTemplate Ownership and Fix Ferrompi Stale Names

## Context

### Background

Three Phase 3 conditions from the readiness verdict are closely related -- they all affect ferrompi and cobre-solver spec files and involve naming or structural corrections:

1. **C-06**: `StageTemplate` and `StageIndexer` appear in specs attributed to both `cobre-core` and `cobre-solver`. An implementer needs a definitive answer on which crate owns these types. Report-004 Finding F-006 identified the ambiguity.

2. **C-07**: The `FerrompiBackend` struct definition in `src/specs/hpc/backend-ferrompi.md` stores the `Mpi` RAII guard incorrectly -- the guard must outlive the communicator handles derived from it, but the struct layout does not enforce this. Report-008 Finding F-002 identified the issue.

3. **C-08**: The API name `split_shared_memory()` appears in 4 spec files (7 total occurrences) but the canonical name in `backend-ferrompi.md` SS7 is `split_shared()`. Report-008 Findings F-003/F-004/F-005 and report-016 Findings F-016-006/F-016-007 confirm the stale references.

### Relation to Epic

This ticket groups three small conditions that each take hours individually but affect overlapping file sets in the solver/ferrompi domain. Grouping them avoids three trivially small tickets.

### Current State

- **C-06**: `StageTemplate` is defined in `src/specs/architecture/solver-abstraction.md` (solver context) but also referenced from `training-loop.md` which treats it as a `cobre-core` type. The crate overview files in `src/crates/` do not consistently assign ownership.
- **C-07**: `src/specs/hpc/backend-ferrompi.md` SS1 defines `FerrompiBackend` with an `mpi: Mpi` field. Rust drop order is reverse-declaration-order, so if `comm: MpiComm` is declared after `mpi: Mpi`, the communicator would be dropped before the guard, which is correct. But the spec does not document this constraint or use `ManuallyDrop`/field ordering to enforce it.
- **C-08**: Stale `split_shared_memory()` occurrences: `communicator-trait.md` (3 occurrences), `communication-patterns.md` (1 occurrence), plus potentially `memory-architecture.md` and other files. The canonical name `split_shared()` is established in `backend-ferrompi.md` SS7.

## Specification

### Requirements

1. **C-06 -- StageTemplate ownership**: Add an explicit ownership statement to `solver-abstraction.md` declaring whether `StageTemplate` and `StageIndexer` live in `cobre-core` or `cobre-solver`. The recommended resolution (from report-004 F-006): `StageTemplate` and `StageIndexer` belong in `cobre-solver` because they encode LP-specific structure (variable counts, constraint indices, coefficient offsets) that is not meaningful to other crates. `cobre-core` defines `Stage` (temporal structure) while `cobre-solver` defines `StageTemplate` (LP structure per stage). Update the relevant crate overview file (`src/crates/cobre-solver.md` or `src/crates/cobre-core.md`) to reflect this.

2. **C-07 -- Mpi guard lifetime**: In `backend-ferrompi.md` SS1, add a comment or documentation note to the `FerrompiBackend` struct definition that documents the Rust drop order constraint: `mpi: Mpi` must be the last field dropped (i.e., declared first in the struct) to ensure the RAII guard outlives all communicator handles. If the current field order is wrong, correct it.

3. **C-08 -- split_shared rename**: Replace all occurrences of `split_shared_memory()` with `split_shared()` in the following files:
   - `src/specs/hpc/communicator-trait.md` (3 occurrences)
   - `src/specs/hpc/communication-patterns.md` (1 occurrence)
   - Any additional files discovered by searching the spec corpus for `split_shared_memory`

### Inputs/Props

- Report-004 F-006 (StageTemplate ownership)
- Report-008 F-002 (Mpi guard), F-003/F-004/F-005 (stale names)
- Report-016 F-016-006/F-016-007 (additional stale name confirmations)
- `src/specs/architecture/solver-abstraction.md` -- StageTemplate definition
- `src/specs/hpc/backend-ferrompi.md` -- FerrompiBackend struct, SS7 canonical API
- `src/specs/hpc/communicator-trait.md` -- stale name occurrences
- `src/specs/hpc/communication-patterns.md` -- stale name occurrence

### Outputs/Behavior

- Updated `src/specs/architecture/solver-abstraction.md` with explicit StageTemplate/StageIndexer crate ownership statement
- Updated `src/crates/cobre-solver.md` (or `cobre-core.md`) to reflect ownership decision
- Updated `src/specs/hpc/backend-ferrompi.md` SS1 with drop order documentation on `FerrompiBackend`
- Updated `src/specs/hpc/communicator-trait.md` -- 3 occurrences of `split_shared_memory()` replaced with `split_shared()`
- Updated `src/specs/hpc/communication-patterns.md` -- 1 occurrence replaced
- Any additional files with stale occurrences also updated

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `solver-abstraction.md` is read, when searching for "crate ownership" or "belongs to", then an explicit statement declares `StageTemplate` and `StageIndexer` ownership in either `cobre-core` or `cobre-solver`
- [ ] Given `backend-ferrompi.md` SS1 is read, when examining the `FerrompiBackend` struct, then a comment documents the drop order constraint for the `mpi: Mpi` field
- [ ] Given the entire `src/specs/` directory is searched for `split_shared_memory`, then zero occurrences are found
- [ ] Given `communicator-trait.md` is searched for `split_shared()`, then the canonical name appears in all positions where `split_shared_memory()` previously appeared
- [ ] Given the updated files, when running `mdbook build`, then no errors occur

## Implementation Guide

### Suggested Approach

1. **C-06**: Read `solver-abstraction.md` to find the StageTemplate definition. Add an ownership paragraph: "StageTemplate and StageIndexer are defined in cobre-solver. They encode LP-specific structure (variable counts, constraint counts, coefficient offsets) derived from the System struct during solver initialization." Read the crate overview files in `src/crates/` and update accordingly.
2. **C-07**: Read `backend-ferrompi.md` SS1 and check the field order of `FerrompiBackend`. If `mpi: Mpi` is not the first field, reorder. Add a comment: "// SAFETY: `mpi` must be declared before `comm` to ensure Rust's reverse drop order drops the communicator before the MPI guard."
3. **C-08**: Search all files under `src/specs/` for `split_shared_memory`. Replace each occurrence with `split_shared`. Verify the total replacement count matches the expected 4+ occurrences.

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md` -- ownership statement
- `src/crates/cobre-solver.md` or `src/crates/cobre-core.md` -- ownership reflection
- `src/specs/hpc/backend-ferrompi.md` -- drop order documentation
- `src/specs/hpc/communicator-trait.md` -- 3 stale name replacements
- `src/specs/hpc/communication-patterns.md` -- 1 stale name replacement

### Patterns to Follow

- Use the `section` prefix for HPC file cross-references (not `SS`).
- Follow the existing struct documentation pattern in `backend-ferrompi.md`.

### Pitfalls to Avoid

- Do NOT change the `split_shared()` definition in `backend-ferrompi.md` SS7 -- that is the canonical source; only fix the stale references in other files.
- Do NOT move `StageTemplate` between crates in the spec -- just document the ownership clearly.
- Do NOT modify the Mpi RAII guard behavior, only document the drop order constraint.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

Verify `mdbook build` completes without errors.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: None directly

## Effort Estimate

**Points**: 2
**Confidence**: High
