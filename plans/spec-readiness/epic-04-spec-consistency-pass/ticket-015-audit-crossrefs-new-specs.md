# ticket-015 Audit Cross-References in New Trait and Test Specs

## Context

### Background

Epics 01-03 produced 12 new specification files (6 trait specs + 6 testing specs) in `src/specs/architecture/` and updated the cross-reference index and SUMMARY in epic-03 (ticket-013). Additionally, the earlier `communication-backend-abstraction` plan produced 6 new HPC specs in `src/specs/hpc/`. Each of these files contains numerous cross-references to other specs, and each existing spec may have gained incoming references from the new files. A systematic audit is needed to verify that every cross-reference link is valid: the target file exists, the target section exists, and the section symbol convention is correct.

The epic-03 learnings documented a critical finding: 11 architecture-internal `§` references were found in `solver-interface-trait.md` during that epic and fixed. The root cause was pattern-matching on the convention blockquote's valid `§` link (which points to an HPC file) and applying `§` to architecture-internal references. This audit must grep all architecture files for any remaining `§` references that point to architecture files (not HPC files), as this is the most common violation pattern.

### Relation to Epic

This ticket is one of four parallel consistency checks in Epic 04. It covers cross-reference integrity, which is the most mechanically verifiable of the four checks. A broken cross-reference means a reader clicking a link will arrive at a nonexistent file or section, undermining the spec's usefulness as an implementation guide.

### Current State

The 12 new spec files in `src/specs/architecture/` are:

**Trait specs (6):**

- `risk-measure-trait.md`
- `horizon-mode-trait.md`
- `sampling-scheme-trait.md`
- `cut-selection-trait.md`
- `stopping-rule-trait.md`
- `solver-interface-trait.md`

**Testing specs (6):**

- `risk-measure-testing.md`
- `horizon-mode-testing.md`
- `sampling-scheme-testing.md`
- `cut-selection-testing.md`
- `stopping-rule-testing.md`
- `solver-interface-testing.md`

The 6 HPC specs from communication-backend-abstraction are:

- `src/specs/hpc/communicator-trait.md`
- `src/specs/hpc/backend-selection.md`
- `src/specs/hpc/backend-local.md`
- `src/specs/hpc/backend-tcp.md`
- `src/specs/hpc/backend-shm.md`
- `src/specs/hpc/backend-testing.md`

The cross-reference index (`src/specs/architecture/cross-reference-index.md`) was updated in ticket-013 to include all 12 new specs. The SUMMARY.md was also updated to list all new files.

## Specification

### Requirements

The audit has three distinct verification tasks:

**Task 1: Section symbol convention audit.** Grep all `.md` files in `src/specs/architecture/` for the `§` character. For each occurrence, verify that the reference target is an HPC file (`src/specs/hpc/` or `../hpc/`). Any `§` reference from an architecture file to another architecture file (e.g., `[Extension Points §7](./extension-points.md)`) is a violation -- it must use `SS` prefix instead. The ONLY valid `§` usage in architecture files is when the target is an HPC file (e.g., `[Communicator Trait §3](../hpc/communicator-trait.md)`) or when it appears inside the verbatim convention blockquote (which contains `[Backend Testing §1](../hpc/backend-testing.md)` -- a valid HPC reference).

Expected finding: The 11 violations in `solver-interface-trait.md` were already fixed in epic-03 (ticket-011 guardian rejection). The current file has only 3 `§` references, all pointing to `../hpc/communicator-trait.md` or `../hpc/backend-testing.md`. However, other architecture files (both new and pre-existing) may have picked up `§` violations during the trait spec work. The 18 architecture files found to contain `§` characters must all be checked.

**Task 2: Link target validation.** For each cross-reference link in the 12 new trait/test spec files and the 6 new HPC spec files, verify:

1. The target file exists at the resolved path
2. The target section (SS number or § number) exists in the target file
3. The section content matches the link text description (no stale references from moved sections)

Focus first on the Cross-References section at the bottom of each spec (which contains the densest set of links), then check inline references in the body text.

**Task 3: Incoming reference verification.** Check whether existing pre-epic specs that now have incoming references from the new specs are correctly referenced. For example, if `risk-measure-trait.md` references `[Cut Management §3](../math/cut-management.md)`, verify that `cut-management.md` has a section 3 matching the described content. This is a spot-check, not an exhaustive audit of all 60+ existing specs.

### Inputs/Props

- The 18 spec files listed above (12 new architecture + 6 new HPC)
- All files in `src/specs/architecture/` for the `§` grep
- The cross-reference index at `src/specs/architecture/cross-reference-index.md` as a reference for expected outgoing/incoming links

### Outputs/Behavior

- A list of all cross-reference violations found, categorized as: (a) broken link (target file missing), (b) broken section (target section missing), (c) `§` convention violation (architecture-to-architecture `§`), (d) stale reference (section content does not match link text)
- Fixes applied directly to the affected spec files following the additive-only convention (no section deletions or renumbering)
- If no violations are found, a confirmation that all cross-references are valid

### Error Handling

If a cross-reference points to a section that was renumbered (e.g., a new lettered subsection was inserted), update the reference to use the new section number. If a target file was renamed, update the path. Never delete sections to fix a reference.

## Acceptance Criteria

- [ ] Given all 18 architecture files containing `§` characters, when each `§` occurrence is examined, then every `§` reference either (a) points to an HPC file (`../hpc/`) or (b) appears inside the verbatim convention blockquote (which itself references an HPC file)
- [ ] Given the 12 new trait/test spec files, when every markdown link `[text](path)` in each file is resolved, then the target file exists at the resolved relative path
- [ ] Given the 12 new trait/test spec files, when a link includes a section reference (e.g., `SS2.3` or `§7`), then the target file contains a heading or section matching that number
- [ ] Given the 6 new HPC spec files, when every markdown link is resolved, then the target file exists and the referenced section exists
- [ ] Given any cross-reference violations found, when fixes are applied, then the additive-only convention is preserved (no sections deleted, no sections renumbered)

## Implementation Guide

### Suggested Approach

1. **Phase 1 -- `§` convention audit.** Grep all `.md` files in `src/specs/architecture/` for the `§` character. For each match, extract the link target path. If the path does not contain `../hpc/` or `./hpc/` or reference an HPC file, flag as a violation. Fix by replacing `§` with `SS` in the reference.

2. **Phase 2 -- Link target existence.** For each of the 18 new spec files, extract all markdown links (`[text](path)`). Resolve the relative path from the file's directory. Check that the target file exists on disk. Collect any broken links.

3. **Phase 3 -- Section existence.** For links that include a section reference (text like `SS2.3`, `§7`, or a heading-based fragment), open the target file and verify the section exists. Check both the Cross-References sections and inline references.

4. **Phase 4 -- Spot-check incoming references.** For the most-referenced target files (extension-points.md, training-loop.md, the math specs), verify that the referenced sections exist and match the descriptions.

5. **Phase 5 -- Apply fixes.** For any violations found, edit the affected files. For `§` violations, change to `SS`. For broken links, correct the path. For stale section references, update the section number.

### Key Files to Modify

Primary audit targets (may need fixes):

- `src/specs/architecture/risk-measure-trait.md`
- `src/specs/architecture/horizon-mode-trait.md`
- `src/specs/architecture/sampling-scheme-trait.md`
- `src/specs/architecture/cut-selection-trait.md`
- `src/specs/architecture/stopping-rule-trait.md`
- `src/specs/architecture/solver-interface-trait.md`
- `src/specs/architecture/risk-measure-testing.md`
- `src/specs/architecture/horizon-mode-testing.md`
- `src/specs/architecture/sampling-scheme-testing.md`
- `src/specs/architecture/cut-selection-testing.md`
- `src/specs/architecture/stopping-rule-testing.md`
- `src/specs/architecture/solver-interface-testing.md`
- `src/specs/hpc/communicator-trait.md`
- `src/specs/hpc/backend-selection.md`
- `src/specs/hpc/backend-local.md`
- `src/specs/hpc/backend-tcp.md`
- `src/specs/hpc/backend-shm.md`
- `src/specs/hpc/backend-testing.md`

Secondary targets (existing architecture files flagged by `§` grep):

- All 18 architecture files listed as containing `§` in the grep output

### Patterns to Follow

- The `§` prefix rule: `§` is used exclusively in `src/specs/hpc/` files for their own sections. Architecture files use `SS` for their sections and reference HPC files with `§`.
- Cross-reference format: `[Readable Title SS3.2](./file.md)` for architecture-to-architecture, `[Readable Title §3](../hpc/file.md)` for architecture-to-HPC.
- The convention blockquote contains one valid `§` reference: `[Backend Testing §1](../hpc/backend-testing.md)`. This is the only `§` that should appear in architecture files outside of explicit cross-reference links to HPC files.

### Pitfalls to Avoid

- Do not change `§` to `SS` inside the convention blockquote -- it correctly references an HPC file.
- Do not change `§` references that point to `../hpc/` paths -- those are correct.
- Do not renumber or delete sections to fix a broken reference -- use additive-only changes.
- Do not modify the cross-reference-index.md unless a structural error is found in its tables -- that file was updated in ticket-013 and is the reference, not the target, for this audit.

## Testing Requirements

Not applicable -- this is a specification document audit, not executable code.

## Dependencies

- **Blocked By**: ticket-013 (cross-reference-index and SUMMARY must be updated first -- completed)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
