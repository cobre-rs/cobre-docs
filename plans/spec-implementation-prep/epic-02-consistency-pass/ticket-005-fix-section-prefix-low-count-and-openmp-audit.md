# ticket-005 Fix §-Convention Violations in Low-Count Architecture Files and Audit OpenMP References

## Context

### Background

This ticket completes the §-convention cleanup by handling the 5 remaining architecture files with low violation counts (16 violations total). It also includes an OpenMP reference audit across all architecture files to verify that OpenMP terminology accurately reflects the current architecture (which has adopted rayon for thread-level parallelism in the training loop and hybrid parallelism specs).

### Relation to Epic

This is the third and final ticket in Epic 02 (Consistency Pass). It completes the §-convention work started by ticket-003 and ticket-004, and adds the OpenMP audit as a final consistency check.

### Current State

**§-convention violations** in 5 files:

1. **`src/specs/architecture/solver-clp-impl.md`**: 5 violations. Mix of self-referential (`§5`, `§5.2`) and cross-architecture-file (`Solver Abstraction §6`, `Solver Abstraction §9`).
2. **`src/specs/architecture/cut-management-impl.md`**: 4 self-referential violations (`§2`, `§1.2`, `§4`, `§4.2`), 1 legitimate HPC reference (`[Communicator Trait SS2.1](../hpc/communicator-trait.md)` -- this one already uses `SS` correctly in the link text, but the `§` appears in the body text referencing `§4.1 step 3`).
3. **`src/specs/architecture/cli-and-lifecycle.md`**: 3 self-referential violations (`§5.3`, `§5.2`, `§3.1`), 1 legitimate HPC reference (`[Hybrid Parallelism §1](../hpc/hybrid-parallelism.md)`).
4. **`src/specs/architecture/convergence-monitoring.md`**: 2 self-referential violations (`§4`, `§2.4`), 1 legitimate HPC reference (`[Synchronization](../hpc/synchronization.md) ... (§1.3)`).
5. **`src/specs/architecture/solver-highs-impl.md`**: 2 cross-architecture-file violations (`Solver Abstraction §6`, `Solver Abstraction §9`).

**OpenMP references** in architecture files (outside the 3 allowed files -- `training-loop.md`, `hybrid-parallelism.md`, `communicator-trait.md`):

- `src/specs/architecture.md` line 47: "OpenMP threading" in a section description paragraph.
- `src/specs/architecture/solver-workspaces.md`: 6 occurrences describing the thread-local workspace pattern using "OpenMP thread" terminology.
- `src/specs/architecture/solver-clp-impl.md` line 277: "Each OpenMP thread creates its own `Clp_Simplex*`".
- `src/specs/architecture/solver-highs-impl.md` line 236: "Each OpenMP thread creates its own instance".
- `src/specs/architecture/solver-interface-trait.md` lines 133, 679: "OpenMP thread" in thread safety and factory context.

## Specification

### Requirements

**§-convention cleanup (5 files):**

1. Replace all self-referential and cross-architecture-file `§` with `SS` in the 5 files listed above.
2. Preserve all legitimate `§` references to HPC files.

**OpenMP audit (all architecture files):** 3. Evaluate each OpenMP reference in context. For each reference, determine whether:

- (a) It accurately describes the architecture (OpenMP is still the underlying thread mechanism in HPC specs and solver workspace specs) and should be preserved, OR
- (b) It is a stale reference that should be updated to use neutral terminology (e.g., "each thread" instead of "each OpenMP thread") since the architecture now uses rayon.

4. Document the audit findings in the acceptance criteria verification (no separate report file needed).

### Inputs/Props

- 5 markdown files for §-convention cleanup.
- 5 markdown files for OpenMP audit (including some overlap with the § files).

### Outputs/Behavior

- All 5 files have zero non-legitimate `§` references.
- OpenMP references are either confirmed as accurate or updated to neutral terminology.
- The total `§` count across all 25 architecture files should be exactly 7 (one per trait spec, inside the convention blockquote) plus the legitimate HPC `§` references in other files.

### Error Handling

- Not applicable (markdown text edits).

### Out of Scope

- OpenMP references in `src/specs/hpc/` files -- these are legitimate.
- OpenMP references in `src/specs/interfaces/` files -- these describe the Python/MCP execution model and are accurate.
- OpenMP references in `src/specs/data-model/` files -- these describe configuration and output schemas and are accurate.
- OpenMP references in `src/specs/math/` files -- these describe parallelization strategy and are accurate.

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-clp-impl.md`, when running `grep "§" solver-clp-impl.md`, then zero matches are found.
- [ ] Given `src/specs/architecture/cut-management-impl.md`, when running `grep "§" cut-management-impl.md | grep -v "../hpc/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/cli-and-lifecycle.md`, when running `grep "§" cli-and-lifecycle.md | grep -v "../hpc/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/convergence-monitoring.md`, when running `grep "§" convergence-monitoring.md | grep -v "../hpc/"`, then zero matches are found.
- [ ] Given `src/specs/architecture/solver-highs-impl.md`, when running `grep "§" solver-highs-impl.md`, then zero matches are found.
- [ ] Given the command `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"`, when executed, then zero matches are found (confirming all violations across all 25 architecture files are resolved).
- [ ] Given the command `mdbook build`, when executed from the repo root, then the build succeeds with no new warnings.

## Implementation Guide

### Suggested Approach

**Part A: §-convention cleanup (5 files)**

Follow the same mechanical pattern from ticket-003 and ticket-004.

**Step 1: `solver-clp-impl.md` (5 violations, 0 legitimate)**

- Replace every `§` with `SS`. All 5 are violations:
  - `§5` and `§5.2` (self-referential)
  - `Solver Abstraction §6` becomes `Solver Abstraction SS6`
  - `Solver Abstraction §9` becomes `Solver Abstraction SS9`

**Step 2: `solver-highs-impl.md` (2 violations, 0 legitimate)**

- Replace every `§` with `SS`:
  - `Solver Abstraction §6` becomes `Solver Abstraction SS6`
  - `Solver Abstraction §9` becomes `Solver Abstraction SS9`

**Step 3: `cut-management-impl.md` (4 violations, 1 legitimate)**

- The legitimate reference is the `[Communicator Trait SS2.1](../hpc/communicator-trait.md)` link on line 185 -- this already correctly uses `SS` in the link text. Verify the body text `§` references are all self-referential violations.
- Replace `§2`, `§1.2`, `§4`, `§4.1 step 3`, `§4.2` with their `SS` equivalents.

**Step 4: `cli-and-lifecycle.md` (3 violations, 1 legitimate)**

- Keep: `[Hybrid Parallelism §1](../hpc/hybrid-parallelism.md)`.
- Replace `§5.3`, `§5.2`, `§3.1` with `SS5.3`, `SS5.2`, `SS3.1`.

**Step 5: `convergence-monitoring.md` (2 violations, 1 legitimate)**

- Keep: the HPC link with `§1.3` pointing to synchronization.md.
- Replace `§4`, `§2.4` with `SS4`, `SS2.4`.

**Part B: OpenMP audit**

**Step 6: Review each OpenMP reference and decide**

The key question is: does the HPC layer still use OpenMP? The answer is nuanced:

- `training-loop.md` and `hybrid-parallelism.md` have adopted rayon terminology.
- `solver-workspaces.md`, `solver-clp-impl.md`, `solver-highs-impl.md`, and `solver-interface-trait.md` describe thread-local solver ownership. These files reference "OpenMP threads" because the solver workspace pattern was designed for OpenMP.
- Since the HPC specs (`work-distribution.md`, `synchronization.md`, `memory-architecture.md`) still describe the execution model using OpenMP terminology, the architecture files that reference "OpenMP threads" in the context of solver ownership are **consistent with the HPC specs**.

**Recommended audit outcome**: Preserve all OpenMP references in `solver-workspaces.md`, `solver-clp-impl.md`, `solver-highs-impl.md`, and `solver-interface-trait.md` as-is. These describe the thread-local ownership pattern and are consistent with the HPC layer specs. The `architecture.md` parent file reference is also consistent (it describes the section contents).

If the `training-loop.md` or `hybrid-parallelism.md` have already been updated to rayon, and the implementer finds that the solver workspace files should also transition, flag this as a future follow-up ticket rather than changing them in this ticket.

**Step 7: Final verification across all 25 architecture files**

- Run: `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"` -- expect zero matches.
- Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-clp-impl.md` (5 violations)
- `src/specs/architecture/solver-highs-impl.md` (2 violations)
- `src/specs/architecture/cut-management-impl.md` (4 violations)
- `src/specs/architecture/cli-and-lifecycle.md` (3 violations)
- `src/specs/architecture/convergence-monitoring.md` (2 violations)

### Patterns to Follow

- Same replacement rules as ticket-003 and ticket-004.
- For the OpenMP audit: document findings inline in the acceptance criteria verification, not as a separate file.

### Pitfalls to Avoid

- `cut-management-impl.md` has a mix of `SS` and `§` references to the same target (`communicator-trait.md`). Verify the existing `SS` references are correct and only the body-text `§` references are violations.
- Do not blindly replace OpenMP references without reading the surrounding context -- some are intentional descriptions of the thread-local ownership model.
- `solver-interface-trait.md` is a trait spec with a convention blockquote. The `§1` inside the blockquote (`Backend Testing §1`) is legitimate and must not be changed. The `§` reference to `solver-workspaces.md` on line 133 is a violation (references an architecture file, not an HPC file).

## Testing Requirements

### Unit Tests

Not applicable (markdown edits).

### Integration Tests

- Run the comprehensive verification: `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"` and verify zero matches.
- Count total `§` across architecture: `grep -c "§" src/specs/architecture/*.md | grep -v ":0$"` should show only the 7 trait specs (1 each) plus files with legitimate HPC `§` links.
- Run `mdbook build` and verify success with no new warnings.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-003-fix-section-prefix-high-count-files.md (establishes the replacement pattern), ticket-004-fix-section-prefix-medium-count-files.md (continues the pattern)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
