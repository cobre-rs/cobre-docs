# Epic 02: Consistency Pass

## Goal

Enforce the §-convention across all architecture spec files and audit OpenMP references in architecture files for correctness. After this epic, `grep § src/specs/architecture/` returns only matches inside the verbatim convention blockquote (7 occurrences total, one per trait spec).

## Scope

### §-Convention Violations

Investigation identified 119 self-referential `§` violations across 12 architecture files. These are pre-convention files authored before the `SS` prefix convention was established during the spec-readiness plan. The 7 architecture files authored during spec-readiness (6 testing specs + `validation-architecture.md`) are already clean.

Violation counts by file:

| File                         | Violations | Type                                    |
| ---------------------------- | ---------- | --------------------------------------- |
| `simulation-architecture.md` | 42         | Self-referential §, cross-arch-file §   |
| `scenario-generation.md`     | 14         | Self-referential §, legitimate HPC §: 2 |
| `solver-abstraction.md`      | 14         | Self-referential §                      |
| `solver-workspaces.md`       | 10         | Self-referential §                      |
| `training-loop.md`           | 9          | Self-referential §, legitimate HPC §: 2 |
| `extension-points.md`        | 7          | Self-referential §                      |
| `input-loading-pipeline.md`  | 7          | Self-referential §                      |
| `solver-clp-impl.md`         | 5          | Self-referential §, cross-arch-file §   |
| `cut-management-impl.md`     | 4          | Self-referential §, legitimate HPC §: 1 |
| `cli-and-lifecycle.md`       | 3          | Self-referential §, legitimate HPC §: 1 |
| `convergence-monitoring.md`  | 2          | Self-referential §, legitimate HPC §: 1 |
| `solver-highs-impl.md`       | 2          | Cross-arch-file §                       |

The violations fall into two categories:

1. **Self-referential**: `§5.3` meaning section 5.3 within the same file -- should be `SS5.3`.
2. **Cross-architecture-file**: `Solver Abstraction §6` referencing another architecture file's section -- should be `SS6`.

Both violate the convention that `§` is reserved exclusively for links to `src/specs/hpc/` files.

### OpenMP Reference Audit

Architecture files contain OpenMP references that predate the rayon adoption in `training-loop.md` and `hybrid-parallelism.md`. Most are intentional (describing per-thread solver ownership), but require validation to confirm none are stale.

Files with OpenMP references outside the allowed `training-loop.md`, `hybrid-parallelism.md`, and `communicator-trait.md`:

- `architecture.md` (parent file): 1 reference (section description)
- `solver-workspaces.md`: 6 references (thread-local workspace pattern)
- `solver-clp-impl.md`: 1 reference (thread ownership)
- `solver-highs-impl.md`: 1 reference (thread ownership)
- `solver-interface-trait.md`: 2 references (workspace pattern, compile-time selection)

## Approach

The §-convention cleanup is mechanical: replace `§N` with `SSN` for self-referential uses, and replace `Filename §N` with `SS N` for cross-architecture-file references. The only `§` references that remain are those linking to `src/specs/hpc/` files and the convention blockquote's single `§1` reference.

The OpenMP audit is evaluative: each reference is checked in context to determine if it accurately describes the current architecture or needs updating.

## Deliverables

- 12 architecture files with §-convention violations corrected.
- OpenMP reference audit report (documented in ticket acceptance criteria).
- `grep § src/specs/architecture/ --include="*.md"` returns only convention blockquote matches (7 files, 1 match each).
- `mdbook build` succeeds with no new warnings.

## Tickets

| Ticket     | Title                                                                                   | Scope                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ticket-003 | Fix §-convention violations in high-count architecture files                            | simulation-architecture.md (42), scenario-generation.md (14), solver-abstraction.md (14)                                                                                               |
| ticket-004 | Fix §-convention violations in medium-count architecture files                          | solver-workspaces.md (10), training-loop.md (9), extension-points.md (7), input-loading-pipeline.md (7)                                                                                |
| ticket-005 | Fix §-convention violations in low-count architecture files and audit OpenMP references | solver-clp-impl.md (5), cut-management-impl.md (4), cli-and-lifecycle.md (3), convergence-monitoring.md (2), solver-highs-impl.md (2); plus OpenMP audit across all architecture files |
