# ticket-007 Audit Spec-to-Crate Mapping for Data Model and Overview Specs

## Context

### Background

This ticket audits whether the 13 specs in `specs/data-model/` and `specs/overview/` are placed in the section that correctly reflects their primary implementation target crate.

The data model section maps to two crates primarily:

- `cobre-core`: defines the in-memory representation of system entities (buses, hydros, thermals, etc.), their validation, and canonical ordering
- `cobre-io`: defines file I/O — parsing input files, writing output files, binary serialization

The split is: `cobre-core` owns the data types; `cobre-io` owns the file operations. This means a single spec file can be primary for `cobre-io` (file format) while being secondary for `cobre-core` (the types it defines).

The overview section (`specs/overview/`) contains foundational specs that apply across all crates. `design-principles.md` defines the format selection framework (primary for `cobre-io`) and the declaration order invariance requirement (primary for `cobre-core`). `notation-conventions.md` is shared across all crates. `production-scale-reference.md` sets performance targets that are primary for `cobre-sddp` and `cobre-solver`.

### Relation to Epic

This is ticket 2 of 4 in Epic 02. It establishes the crate mapping for 13 files (overview + data model), which feeds the master mapping table in ticket-009.

### Current State

The data model and overview sections are placed correctly at the macro level (data model specs are in `specs/data-model/`, overview specs in `specs/overview/`). The question is: are any of the 10 data model files in the wrong section? Specific concerns:

- `binary-formats.md` defines FlatBuffers schemas for policy persistence (cuts, states, vertices). Policy persistence is a `cobre-sddp`/`cobre-io` boundary concern. Is this correctly placed in `data-model/` or should it be in `architecture/`?
- `internal-structures.md` defines the unified in-memory runtime representation. This is purely `cobre-core` territory. Is `data-model/` the right section for a runtime structure spec?
- `output-infrastructure.md` defines crash recovery manifests, MPI-native Hive partitioning for parallel writes. The parallelism concern feels architectural. Is it correctly placed in `data-model/`?

## Specification

### Requirements

For each of the 13 files (3 overview + 10 data model):

**Check M1 — Section Assignment Justification**: State which crate(s) the spec primarily targets. Explain why the current section (`specs/overview/` or `specs/data-model/`) is appropriate or problematic.

**Check M2 — SUMMARY.md Placement Verification**: Confirm the file appears in `SUMMARY.md` under the correct heading. Read `/home/rogerio/git/cobre-docs/src/SUMMARY.md` and verify each file is listed.

**Check M3 — Ambiguity Resolution**: For the 3 ambiguous files (`binary-formats.md`, `internal-structures.md`, `output-infrastructure.md`), produce a documented decision:

- If the placement is acceptable: write 1-2 sentence justification
- If the placement is incorrect: write a HIGH finding with the recommended section and rationale
- If the spec should cross-map to multiple crates: document the primary vs secondary assignment

**Check M4 — Crate Coverage Gap Check**: After mapping all 13 files, check if any crate has zero coverage from overview/data-model specs when it should have some. Specifically: `cobre-core` must have coverage from at least `input-system-entities.md`, `internal-structures.md`, `penalty-system.md`, and `design-principles.md`.

### Inputs

- Files: `/home/rogerio/git/cobre-docs/src/specs/overview/` (3 files) and `/home/rogerio/git/cobre-docs/src/specs/data-model/` (10 files)
- Architecture reference: crate responsibility table from ticket-006
- SUMMARY.md: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`

### Outputs

A 13-row mapping table:

```
| Spec File | Section | Primary Crate | Secondary Crate(s) | Placement | Findings |
```

Plus written justifications for the 3 ambiguous files.

### Error Handling

- File missing from SUMMARY.md: HIGH
- Spec in wrong section with no justification: HIGH
- Spec correctly placed but missing secondary crate acknowledgment: LOW

## Acceptance Criteria

- [ ] Given `binary-formats.md`, `internal-structures.md`, and `output-infrastructure.md`, when section placement is evaluated against crate boundaries, then a documented decision (justification or HIGH finding) exists for each
- [ ] Given `design-principles.md`, when crate mapping is assessed, then both `cobre-core` (declaration order invariance) and `cobre-io` (format selection framework) are acknowledged as targets
- [ ] Given all 13 files, when checked against SUMMARY.md, then all 13 appear under the correct section heading
- [ ] Given `cobre-core`, after all 13 files are mapped, then at least 4 spec files assign it as primary or secondary target
- [ ] The ticket produces a 13-row mapping table

## Implementation Guide

### Suggested Approach

Step 1: Read `SUMMARY.md` to confirm all 13 files are listed correctly:

```bash
grep -A 20 "Data Model" /home/rogerio/git/cobre-docs/src/SUMMARY.md
grep -A 8 "Overview" /home/rogerio/git/cobre-docs/src/SUMMARY.md
```

Step 2: For each of the 3 ambiguous files, read the Purpose section to determine primary vs secondary crate:

```bash
head -15 /home/rogerio/git/cobre-docs/src/specs/data-model/binary-formats.md
head -15 /home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md
head -15 /home/rogerio/git/cobre-docs/src/specs/data-model/output-infrastructure.md
```

Step 3: For `binary-formats.md`, trace the FlatBuffers schemas back to their runtime users. The cut pool schema is consumed by `cobre-sddp` training loop and `cobre-io` checkpoint writing. The solver basis schema is consumed by `cobre-solver`. Determine: is this a `cobre-io` spec with `cobre-sddp` and `cobre-solver` as secondary targets?

Step 4: For `internal-structures.md`, determine whether it specifies `cobre-core` types (data model concern) or `cobre-sddp` runtime structures (algorithm concern).

Step 5: Construct the 13-row mapping table.

### Key Files to Modify

Read-only audit.

### Patterns to Follow

The epic overview table (00-epic-overview.md) lists the key mapping ambiguities — use those as the starting point for Check M3.

### Pitfalls to Avoid

- `design-principles.md` is explicitly an overview spec, not a data model spec. Do not confuse "data model" in the section name with "design principles for the data model." The overview section is a superset concern.
- `production-scale-reference.md` sets HPC performance targets. Its primary crate is `cobre-sddp` (the solver that must meet these targets) but it lives correctly in `specs/overview/` because it's a reference document, not a crate-specific spec.

## Testing Requirements

### Unit Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-006 (crate responsibility table)
- **Blocks**: ticket-009 (master mapping table compilation)

## Effort Estimate

**Points**: 2
**Confidence**: High
