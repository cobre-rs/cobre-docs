# ticket-003 Fix §-Convention Violations in High-Count Architecture Files

## Context

### Background

The Cobre spec corpus enforces a section prefix convention: architecture files (`src/specs/architecture/`) use the `SS` prefix for section references (e.g., `SS5.3`), while the `§` prefix is reserved exclusively for references to HPC files (`src/specs/hpc/`). This convention was established during the spec-readiness plan and is documented in `CLAUDE.md`. However, 12 architecture files predate the convention and use `§` for both self-referential section anchors and cross-references to other architecture files. This ticket addresses the 3 files with the highest violation counts (70 violations total).

### Relation to Epic

This is the first of three tickets in Epic 02 (Consistency Pass) that fix §-convention violations. It handles the 3 highest-count files to make the largest dent first. ticket-004 handles medium-count files and ticket-005 handles low-count files plus the OpenMP audit.

### Current State

Three files contain the majority of §-convention violations:

1. **`src/specs/architecture/simulation-architecture.md`**: 42 self-referential `§` violations, 3 legitimate HPC `§` references (to `../hpc/communicator-trait.md`, `../data-model/internal-structures.md`, `../data-model/binary-formats.md`). Examples:
   - `§6.1` (self-referential, should be `SS6.1`)
   - `§4.4` (self-referential, should be `SS4.4`)
   - `[Communicator Trait §3](../hpc/communicator-trait.md)` (legitimate, keep as-is)

2. **`src/specs/architecture/scenario-generation.md`**: 14 self-referential `§` violations, 2 legitimate HPC `§` references (to `../hpc/memory-architecture.md` and `../hpc/hybrid-parallelism.md`). Examples:
   - `§3` (self-referential, should be `SS3`)
   - `§2.3` (self-referential, should be `SS2.3`)
   - `[Memory Architecture §2.1](../hpc/memory-architecture.md)` (legitimate, keep as-is)

3. **`src/specs/architecture/solver-abstraction.md`**: 14 self-referential `§` violations, 0 legitimate HPC `§` references. Every `§` in this file is a violation. Examples:
   - `§3` referencing section 3 of the same file
   - `§11` referencing section 11 of the same file
   - `binary-formats §3.4` referencing another non-HPC file using §

## Specification

### Requirements

1. In each of the 3 files, replace every self-referential `§` with `SS`.
2. In each of the 3 files, replace every cross-architecture-file `§` reference with `SS` (e.g., `binary-formats §3.4` becomes `binary-formats SS3.4`).
3. Preserve all legitimate `§` references to HPC files (links containing `../hpc/` in the path).
4. Do not change any section content, only the section prefix character.

### Inputs/Props

- 3 markdown files with identified § violation locations.

### Outputs/Behavior

- `simulation-architecture.md` contains exactly 3 `§` references (all linking to `../hpc/` or `../data-model/` files).
- `scenario-generation.md` contains exactly 2 `§` references (all linking to `../hpc/` files).
- `solver-abstraction.md` contains exactly 0 `§` references.
- All section numbers are unchanged (only the prefix character changes).

### Error Handling

- Not applicable (markdown text edits).

### Out of Scope

- Files handled by ticket-004 and ticket-005.
- Any content changes beyond the `§` to `SS` prefix swap.
- The convention blockquote (none of these 3 files are trait specs, so they do not contain the convention blockquote).

## Acceptance Criteria

- [ ] Given `src/specs/architecture/simulation-architecture.md`, when running `grep "§" simulation-architecture.md | grep -v "../hpc/\|../data-model/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/scenario-generation.md`, when running `grep "§" scenario-generation.md | grep -v "../hpc/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/solver-abstraction.md`, when running `grep "§" solver-abstraction.md`, then zero matches are found.
- [ ] Given any of the 3 files, when comparing section numbers before and after the edit, then all section numbers are identical (only the prefix changed from `§` to `SS`).
- [ ] Given the command `mdbook build`, when executed from the repo root, then the build succeeds with no new warnings.

## Implementation Guide

### Suggested Approach

For each file, the replacement is mechanical but requires care to distinguish legitimate HPC `§` references from violations:

**Step 1: `solver-abstraction.md` (simplest -- all 14 are violations)**

- Replace every `§` occurrence with `SS`. No exceptions needed since this file has zero legitimate HPC § references.
- Verification: `grep "§" src/specs/architecture/solver-abstraction.md` returns zero matches.

**Step 2: `scenario-generation.md` (14 violations, 2 legitimate)**

- The 2 legitimate references are:
  - Line 203: `[Memory Architecture §2.1](../hpc/memory-architecture.md)` -- keep as-is.
  - Line 534: reference to `§5.1` which is a self-reference (violation) despite being near an HPC link.
- Replace all `§` that do NOT appear inside a markdown link to `../hpc/`.
- Verification: `grep "§" src/specs/architecture/scenario-generation.md | grep -v "../hpc/"` returns zero matches.

**Step 3: `simulation-architecture.md` (42 violations, 3 legitimate)**

- The 3 legitimate references are:
  - Line 580: `[Communicator Trait §3](../hpc/communicator-trait.md)` -- keep as-is.
  - Line 609: `[Communicator Trait §3](../hpc/communicator-trait.md)` -- keep as-is.
  - Line 171: `[Internal Structures §12.2](../data-model/internal-structures.md)` -- this is a data-model link. Per the convention, `§` is reserved for HPC files only. However, this is a cross-file reference using `§` as a section indicator in the link text. Evaluate: since it links to `../data-model/` (not `../hpc/`), this should also be changed to `SS12.2`.
- Actually, on closer inspection: the `§` in `[Internal Structures §12.2]` and `[Binary Formats §3.2]` are inside link text referring to data-model files. These are also violations and should become `SS12.2` and `SS3.2` respectively.
- Replace all `§` except those inside markdown links pointing to `../hpc/`.
- Verification: `grep "§" src/specs/architecture/simulation-architecture.md | grep -v "../hpc/"` returns zero matches.

**Step 4: Verify all 3 files**

- Run: `grep "§" src/specs/architecture/simulation-architecture.md src/specs/architecture/scenario-generation.md src/specs/architecture/solver-abstraction.md | grep -v "../hpc/"` -- expect zero matches.
- Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/simulation-architecture.md` (42 violations)
- `src/specs/architecture/scenario-generation.md` (14 violations)
- `src/specs/architecture/solver-abstraction.md` (14 violations)

### Patterns to Follow

- **Self-referential `§N`** becomes **`SSN`** (e.g., `§6.1` becomes `SS6.1`).
- **Cross-architecture `Filename §N`** becomes **`Filename SSN`** (e.g., `Solver Abstraction §6` becomes `Solver Abstraction SS6`).
- **HPC file links `[Title §N](../hpc/file.md)`** remain unchanged -- these are the correct usage of `§`.
- Within Rust doc comments (`///`), the same rule applies: `§` becomes `SS` for non-HPC references.

### Pitfalls to Avoid

- Do not change `§` references inside markdown links pointing to `../hpc/` -- these are the correct usage.
- Do not change section numbers themselves (e.g., `§4.2` becomes `SS4.2`, not `SS4.3`).
- Do not add or remove spaces around the prefix (if the original has `(§4)`, the result should be `(SS4)`).
- Some `§` appear inside Rust code comments (`///`). Apply the same replacement rule there.
- `simulation-architecture.md` is the largest file (42 violations). Work through it methodically section by section to avoid missing any.

## Testing Requirements

### Unit Tests

Not applicable (markdown edits).

### Integration Tests

- Run `grep "§" src/specs/architecture/solver-abstraction.md` and verify 0 matches.
- Run `grep "§" src/specs/architecture/scenario-generation.md | grep -v "../hpc/"` and verify 0 matches.
- Run `grep "§" src/specs/architecture/simulation-architecture.md | grep -v "../hpc/"` and verify 0 matches.
- Run `mdbook build` and verify success with no new warnings.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-005-fix-section-prefix-low-count-and-openmp-audit.md (ticket-005 depends on the pattern established here for consistency)

## Effort Estimate

**Points**: 2
**Confidence**: High
