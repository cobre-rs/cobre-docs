# ticket-026 Update Cross-Reference Index and Resolve Ferrompi Slurm Module

## Context

### Background

Two remaining Batch 1 conditions require cross-spec consistency work:

1. **C-18**: The cross-reference index (`src/specs/cross-reference-index.md`) is missing entries for `backend-testing.md` and `ecosystem-guidelines.md`. Report-010 section 4 identified that these two spec files were not added to the index when they were created. The index must include them before Phase 3 conformance testing begins (implementers use the index to discover testing specs).

2. **C-19**: The spec corpus references a `ferrompi::slurm` module in several files, but report-008 Finding F-001 identified that it is unclear whether the real ferrompi crate actually contains a `slurm` module. If it does, the module's API should be documented in `backend-ferrompi.md` SS7. If it does not, the SLURM environment variable reading logic should be relocated to `cobre-comm` or `cobre-cli`, and all referencing specs should be updated.

### Relation to Epic

This ticket combines a small cross-reference index update (C-18) with a moderate investigation-and-resolution task (C-19). They are grouped because both involve cross-spec consistency verification, which is the `implementation-guardian` agent's specialty.

### Current State

- `src/specs/cross-reference-index.md` has 5 sections tracking all spec files. `backend-testing.md` and `ecosystem-guidelines.md` are absent from all 5 sections.
- The `ferrompi::slurm` module is referenced in `slurm-deployment.md`, `cli-and-lifecycle.md`, and potentially other files. The actual ferrompi crate structure is described in `backend-ferrompi.md` but the `slurm` module is not in the SS7 API reference.

## Specification

### Requirements

1. **C-18 -- Cross-reference index updates**: Add `backend-testing.md` and `ecosystem-guidelines.md` to all 5 sections of the cross-reference index:
   - Section 1: Master file list with primary crate assignment
   - Section 2: Per-crate reading lists (both files go to appropriate crate lists and as `(secondary)` to all 11 crate lists since they are cross-cutting)
   - Section 3: Outgoing reference table (extract outgoing references from each file)
   - Section 4: Incoming reference table (identify existing files that reference these two)
   - Section 5: Dependency ordering (insert in topological order)

   Follow the batch update sequence defined in CLAUDE.md: extract outgoing refs, identify incoming refs, compute topological position, assign primary crate, update document count header.

2. **C-19 -- ferrompi::slurm module resolution**: Investigate whether the `ferrompi::slurm` module is a real crate module or a spec-corpus invention. The resolution is one of:
   - **If the module exists in the real ferrompi crate**: Add its API (SLURM environment variable readers: `SLURM_PROCID`, `SLURM_LOCALID`, `SLURM_NTASKS`, etc.) to `backend-ferrompi.md` SS7.
   - **If the module does not exist**: Relocate the SLURM env-var reading responsibility to `cobre-comm` (as part of initialization) or `cobre-cli` (as part of the launcher). Update all referencing specs to point to the new location.

   Since this is a documentation-only plan with no access to the ferrompi crate source, the investigation must be based on the spec corpus itself: check whether `backend-ferrompi.md` SS7 (the API reference section) lists a `slurm` module, and whether any other spec describes `ferrompi::slurm` with concrete function signatures.

### Inputs/Props

- `src/specs/cross-reference-index.md` -- target for C-18
- `src/specs/architecture/backend-testing.md` -- file to add to index
- `src/specs/overview/ecosystem-guidelines.md` -- file to add to index
- `src/specs/hpc/backend-ferrompi.md` SS7 -- ferrompi API reference
- `src/specs/hpc/slurm-deployment.md` -- references ferrompi::slurm
- `src/specs/architecture/cli-and-lifecycle.md` -- may reference ferrompi::slurm
- Report-008 F-001, Report-010 section 4

### Outputs/Behavior

- Updated `src/specs/cross-reference-index.md` with entries for both `backend-testing.md` and `ecosystem-guidelines.md` across all 5 sections, document count header updated
- One of:
  - Updated `src/specs/hpc/backend-ferrompi.md` SS7 with `ferrompi::slurm` module API, OR
  - Updated referencing specs to relocate SLURM env-var reading to `cobre-comm` or `cobre-cli`

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `cross-reference-index.md` section 1 is read, then `backend-testing.md` and `ecosystem-guidelines.md` both appear in the master file list
- [ ] Given `cross-reference-index.md` section 2 is read, then both files appear in the appropriate per-crate reading lists
- [ ] Given `cross-reference-index.md` document count header is read, then the count matches the actual number of files listed in section 1
- [ ] Given the ferrompi::slurm investigation is complete, then either (a) `backend-ferrompi.md` SS7 includes a `slurm` module with env-var reader function signatures, or (b) all references to `ferrompi::slurm` in the spec corpus have been relocated to an explicit alternative module
- [ ] Given the updated files, when running `mdbook build`, then no errors occur

## Implementation Guide

### Suggested Approach

1. **C-18**: Read `backend-testing.md` and `ecosystem-guidelines.md` to extract their outgoing references. Read `cross-reference-index.md` current state. Apply the batch update sequence from CLAUDE.md.
2. **C-19**: Read `backend-ferrompi.md` SS7 to check if `slurm` is listed. Search the entire spec corpus for `ferrompi::slurm` to inventory all references. Based on findings, either add to SS7 or relocate.

### Key Files to Modify

- `src/specs/cross-reference-index.md` -- add two new entries
- `src/specs/hpc/backend-ferrompi.md` -- potentially add slurm module
- `src/specs/hpc/slurm-deployment.md` -- potentially update ferrompi::slurm references
- Other files referencing `ferrompi::slurm` -- update if relocating

### Patterns to Follow

- Follow the CLAUDE.md batch update sequence for the cross-reference index.
- Cross-cutting documents use `(secondary)` in per-crate reading lists and `(cross-cutting)` as primary crate.

### Pitfalls to Avoid

- Do NOT update the cross-reference index for one file and then the other separately -- batch both files together per CLAUDE.md convention.
- Do NOT invent ferrompi::slurm API functions -- if the module does not exist in SS7, the resolution is relocation, not fabrication.
- Verify the document count header arithmetic after adding entries.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

Verify `mdbook build` completes without errors.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: None directly

## Effort Estimate

**Points**: 2
**Confidence**: Medium (C-19 resolution path depends on investigation outcome)
