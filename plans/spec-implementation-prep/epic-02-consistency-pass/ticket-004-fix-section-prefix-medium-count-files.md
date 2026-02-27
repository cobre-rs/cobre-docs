# ticket-004 Fix §-Convention Violations in Medium-Count Architecture Files

## Context

### Background

The Cobre spec corpus enforces a section prefix convention: architecture files use `SS` for section references, while `§` is reserved exclusively for links to HPC files (`src/specs/hpc/`). Twelve architecture files predate this convention and use `§` incorrectly. This ticket addresses the 4 files with medium violation counts (33 violations total), continuing the pattern established by ticket-003.

### Relation to Epic

This is the second of three tickets in Epic 02 (Consistency Pass). It handles 4 files with 7-10 violations each. ticket-003 handles the 3 highest-count files; ticket-005 handles the 5 lowest-count files plus the OpenMP audit.

### Current State

Four files contain medium counts of §-convention violations:

1. **`src/specs/architecture/solver-workspaces.md`**: 10 self-referential `§` violations, 0 legitimate HPC references. All 10 are violations. Examples:
   - `§1.2`, `§1.4`, `§1.5`, `§1.6` (self-referential)
   - `§2.4`, `§2.5` (self-referential)
   - `solver impl specs §4` (cross-architecture-file reference)

2. **`src/specs/architecture/training-loop.md`**: 9 self-referential `§` violations, 2 legitimate HPC `§` references. Examples:
   - `§4`, `§5.4`, `§6.2` (self-referential, should be `SS4`, `SS5.4`, `SS6.2`)
   - `§4.2a`, `§4.3`, `§5.1.1`, `§5.2` (self-referential)
   - `[Hybrid Parallelism §1](../hpc/hybrid-parallelism.md)` (legitimate, keep as-is)
   - `[Hybrid Parallelism §2](../hpc/hybrid-parallelism.md)` (legitimate, keep as-is)

3. **`src/specs/architecture/extension-points.md`**: 7 self-referential `§` violations, 0 legitimate HPC references. All 7 are violations. Examples:
   - `§2`, `§3`, `§4`, `§5` (self-referential)
   - `§2.2`, `§2.3`, `§4.3`, `§5.3`, `§8` (self-referential)

4. **`src/specs/architecture/input-loading-pipeline.md`**: 7 self-referential `§` violations, 0 legitimate HPC references. All 7 are violations. Examples:
   - `§2`, `§5`, `§7`, `§8` (self-referential)

## Specification

### Requirements

1. In each of the 4 files, replace every self-referential `§` with `SS`.
2. In each of the 4 files, replace every cross-architecture-file `§` reference with `SS`.
3. Preserve all legitimate `§` references to HPC files (links containing `../hpc/` in the path).
4. Do not change any section content, only the section prefix character.

### Inputs/Props

- 4 markdown files with identified § violation locations.

### Outputs/Behavior

- `solver-workspaces.md` contains exactly 0 `§` references.
- `training-loop.md` contains exactly 2 `§` references (both linking to `../hpc/` files).
- `extension-points.md` contains exactly 0 `§` references.
- `input-loading-pipeline.md` contains exactly 0 `§` references.

### Error Handling

- Not applicable (markdown text edits).

### Out of Scope

- Files handled by ticket-003 (`simulation-architecture.md`, `scenario-generation.md`, `solver-abstraction.md`).
- Files handled by ticket-005 (`solver-clp-impl.md`, `cut-management-impl.md`, `cli-and-lifecycle.md`, `convergence-monitoring.md`, `solver-highs-impl.md`).
- Any content changes beyond the `§` to `SS` prefix swap.

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-workspaces.md`, when running `grep "§" solver-workspaces.md`, then zero matches are found.
- [ ] Given `src/specs/architecture/training-loop.md`, when running `grep "§" training-loop.md | grep -v "../hpc/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/training-loop.md`, when running `grep "§" training-loop.md`, then exactly 2 matches are found (both `../hpc/` links).
- [ ] Given `src/specs/architecture/extension-points.md`, when running `grep "§" extension-points.md`, then zero matches are found.
- [ ] Given `src/specs/architecture/input-loading-pipeline.md`, when running `grep "§" input-loading-pipeline.md`, then zero matches are found.
- [ ] Given the command `mdbook build`, when executed from the repo root, then the build succeeds with no new warnings.

## Implementation Guide

### Suggested Approach

Apply the same mechanical replacement pattern established by ticket-003.

**Step 1: `solver-workspaces.md` (all 10 are violations)**

- Replace every `§` with `SS`. No exceptions needed.
- Handle the cross-arch reference `solver impl specs §4` -- change to `solver impl specs SS4`.
- Handle the tabular reference `| §1.4 Step |` -- change to `| SS1.4 Step |`.

**Step 2: `training-loop.md` (9 violations, 2 legitimate)**

- The 2 legitimate references are:
  - `[Hybrid Parallelism §1](../hpc/hybrid-parallelism.md)` -- keep as-is.
  - `[Hybrid Parallelism §2](../hpc/hybrid-parallelism.md)` -- keep as-is.
- Replace all other `§` with `SS`.
- Note: `training-loop.md` also had GAP-032 cleaned in ticket-001. If ticket-001 has not been executed yet, coordinate to avoid merge conflicts.

**Step 3: `extension-points.md` (all 7 are violations)**

- Replace every `§` with `SS`. No exceptions needed.

**Step 4: `input-loading-pipeline.md` (all 7 are violations)**

- Replace every `§` with `SS`. No exceptions needed.

**Step 5: Verify all 4 files**

- Run: `for f in solver-workspaces.md extension-points.md input-loading-pipeline.md; do grep "§" src/specs/architecture/$f; done` -- expect zero matches.
- Run: `grep "§" src/specs/architecture/training-loop.md | grep -v "../hpc/"` -- expect zero matches.
- Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-workspaces.md` (10 violations)
- `src/specs/architecture/training-loop.md` (9 violations)
- `src/specs/architecture/extension-points.md` (7 violations)
- `src/specs/architecture/input-loading-pipeline.md` (7 violations)

### Patterns to Follow

- Same replacement rules as ticket-003:
  - Self-referential `§N` becomes `SSN`.
  - Cross-architecture `Filename §N` becomes `Filename SSN`.
  - HPC file links remain unchanged.
- Within markdown tables, ensure cell content formatting is preserved after the swap.

### Pitfalls to Avoid

- `solver-workspaces.md` has `§` inside a markdown table header row (`| §1.4 Step |`). Ensure the table renders correctly after changing to `| SS1.4 Step |`.
- `training-loop.md` is shared with ticket-001 (GAP-032 cleanup). If both tickets modify the same file, the implementer must handle potential merge conflicts.
- Do not change `§` references inside markdown links pointing to `../hpc/` -- these are correct usage.

## Testing Requirements

### Unit Tests

Not applicable (markdown edits).

### Integration Tests

- Run `grep "§" src/specs/architecture/solver-workspaces.md` and verify 0 matches.
- Run `grep "§" src/specs/architecture/training-loop.md | grep -v "../hpc/"` and verify 0 matches.
- Run `grep "§" src/specs/architecture/extension-points.md` and verify 0 matches.
- Run `grep "§" src/specs/architecture/input-loading-pipeline.md` and verify 0 matches.
- Run `mdbook build` and verify success with no new warnings.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (can proceed in parallel with ticket-003, but should follow the same pattern)
- **Blocks**: ticket-005-fix-section-prefix-low-count-and-openmp-audit.md

## Effort Estimate

**Points**: 2
**Confidence**: High
