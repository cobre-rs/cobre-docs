# ticket-024 Fix Notation Drift and Threading References

## Context

### Background

The readiness audit identified three small but important corrections needed before Phase 6 (cobre-sddp training) coding begins:

1. **C-10 -- Notation drift**: `src/specs/architecture/training-loop.md` SS7.1 uses `$\pi^a_{h,\ell}$` where the canonical notation (established in `src/specs/math/risk-measures.md` and used consistently elsewhere) is `$\pi^{lag}_{h,\ell}$`. Separately, `src/specs/architecture/cut-management.md` uses `$p_h$` for probability where the canonical notation is `$P_h$` (uppercase). Report-011 Findings F1 and F2.

2. **C-11 -- Rayon reference**: `src/specs/architecture/training-loop.md` SS4.3 contains a struct comment referencing "rayon thread pool size" but the Cobre threading model uses OpenMP-style threading through ferrompi, not rayon. Report-016 Finding F-016-003.

3. **C-12 -- Type mismatch**: `src/specs/hpc/work-distribution.md` SS3.2 defines allgatherv counts and displacements as `i32`/`Vec<i32>` but the `CommunicatorTrait` uses `usize`. Report-016 Finding F-016-001.

### Relation to Epic

This is the simplest ticket in Epic 06 -- three targeted find-and-replace edits across three files. Each edit is under 5 minutes of work, but they must be tracked as conditions resolved.

### Current State

- `training-loop.md` SS7.1 uses `\pi^a` instead of `\pi^{lag}` in cut coefficient extraction formulas.
- `training-loop.md` SS4.3 has a struct field comment mentioning `rayon`.
- `cut-management.md` uses lowercase `p_h` instead of uppercase `P_h` for stage probability.
- `work-distribution.md` SS3.2 uses `i32` type annotations for allgatherv array parameters.

## Specification

### Requirements

1. In `src/specs/architecture/training-loop.md` SS7.1, replace all occurrences of `$\pi^a$` and `$\pi^a_{h,\ell}$` with `$\pi^{lag}$` and `$\pi^{lag}_{h,\ell}$` respectively.

2. In `src/specs/architecture/training-loop.md` SS4.3, replace the "rayon thread pool size" comment with the correct threading model reference (e.g., "OpenMP thread count" or "thread count" with a cross-reference to the threading model in `ferrompi` / `memory-architecture.md`).

3. In `src/specs/architecture/cut-management.md`, replace all occurrences of `$p_h$` (stage probability) with `$P_h$` to match the canonical notation.

4. In `src/specs/hpc/work-distribution.md` SS3.2, replace `i32` and `Vec<i32>` with `usize` and `Vec<usize>` for allgatherv counts and displacements parameters, matching the `CommunicatorTrait` type signature.

### Inputs/Props

- Report-011 F1 and F2 (notation drift)
- Report-016 F-016-003 (rayon reference)
- Report-016 F-016-001 (type mismatch)

### Outputs/Behavior

- Updated `src/specs/architecture/training-loop.md` -- notation fix in SS7.1, threading fix in SS4.3
- Updated `src/specs/architecture/cut-management.md` -- probability notation fix
- Updated `src/specs/hpc/work-distribution.md` -- type annotation fix in SS3.2

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `training-loop.md` is searched for `\pi^a`, then zero occurrences are found (all replaced with `\pi^{lag}`)
- [ ] Given `training-loop.md` SS4.3 is read, when searching for "rayon", then zero occurrences are found
- [ ] Given `cut-management.md` is searched for `p_h` in mathematical context (LaTeX `$p_h$`), then zero occurrences are found (all replaced with `$P_h$`)
- [ ] Given `work-distribution.md` SS3.2 is read, when checking allgatherv parameter types, then counts and displacements use `usize` and `Vec<usize>`, not `i32`/`Vec<i32>`
- [ ] Given the updated files, when running `mdbook build`, then no errors occur

## Implementation Guide

### Suggested Approach

1. Open `training-loop.md`, navigate to SS7.1. Search for `\pi^a` and replace with `\pi^{lag}`. Count replacements.
2. In the same file, navigate to SS4.3. Find the struct comment with "rayon" and replace with the correct threading reference.
3. Open `cut-management.md`. Search for `p_h` in LaTeX contexts (inside `$...$` or `$$...$$`). Replace with `P_h`. Be careful not to replace `p_h` in non-mathematical contexts (e.g., variable names in Rust code blocks).
4. Open `work-distribution.md` SS3.2. Find the allgatherv signature or parameter table. Replace `i32` with `usize` and `Vec<i32>` with `Vec<usize>`.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` -- SS7.1 notation, SS4.3 threading
- `src/specs/architecture/cut-management.md` -- probability notation
- `src/specs/hpc/work-distribution.md` -- SS3.2 type annotation

### Patterns to Follow

- Use the canonical notation from `src/specs/math/risk-measures.md` for mathematical symbols.
- Use the threading model vocabulary from `src/specs/hpc/memory-architecture.md`.

### Pitfalls to Avoid

- Do NOT replace `\pi^a` in contexts where it legitimately means something different from `\pi^{lag}` -- verify the surrounding text.
- Do NOT replace `p_h` in Rust code blocks or non-LaTeX contexts.
- Do NOT change the allgatherv semantics in work-distribution.md -- only the type annotation.

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

**Points**: 1
**Confidence**: High
