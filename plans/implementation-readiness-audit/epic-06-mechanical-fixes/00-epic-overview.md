# Epic 06: Mechanical Naming, Notation, and Index Fixes

## Goal

Resolve all Batch 1 conditions that are mechanical fixes: renaming stale API names, fixing notation drift, correcting type annotations, clarifying crate ownership, adding missing specs to the cross-reference index, and fixing CLI cross-spec inconsistencies. These conditions require minimal design decisions -- they are targeted edits guided by specific findings from the audit reports.

## Scope

- Rename `patch_rhs_bounds` to `patch_row_bounds` and add `patch_col_bounds` tests (C-05)
- Clarify `StageTemplate`/`StageIndexer` crate ownership (C-06)
- Fix `Mpi` RAII guard lifetime in `FerrompiBackend` struct (C-07)
- Fix stale `split_shared_memory()` to `split_shared()` in 4 files (C-08)
- Fix notation drift in `training-loop.md` and `cut-management.md` (C-10)
- Fix `rayon` threading reference in `training-loop.md` (C-11)
- Fix type mismatch in `work-distribution.md` allgatherv signature (C-12)
- Reconcile SLURM invocation patterns (C-15)
- Standardize `training.forward_passes` config field name (C-16)
- Add `training.enabled` boolean to config reference (C-17)
- Add `backend-testing.md` and `ecosystem-guidelines.md` to cross-reference index (C-18)
- Resolve `ferrompi::slurm` module gap (C-19)

## Conditions Resolved

| Condition | Description                                                                     | Phase Blocked | Effort    |
| --------- | ------------------------------------------------------------------------------- | ------------- | --------- |
| C-05      | Rename `patch_rhs_bounds` to `patch_row_bounds`, add `patch_col_bounds` tests   | 3             | Hours     |
| C-06      | Clarify `StageTemplate`/`StageIndexer` crate ownership                          | 3             | Hours     |
| C-07      | Fix `Mpi` RAII guard lifetime in `FerrompiBackend` struct definition            | 3             | Hours     |
| C-08      | Fix stale `split_shared_memory()` to `split_shared()` in 4 files                | 3             | Hours     |
| C-10      | Fix notation drift: `$\pi^a$` to `$\pi^{lag}$`; `$p_h$` to `$P_h$`              | 6             | Hours     |
| C-11      | Fix `rayon` threading reference in `training-loop.md` SS4.3                     | 6             | Hours     |
| C-12      | Fix type mismatch in `work-distribution.md` SS3.2                               | 6             | Hours     |
| C-15      | Reconcile SLURM invocation patterns                                             | 8             | 0.5 day   |
| C-16      | Standardize config field name `training.forward_passes`                         | 8             | Hours     |
| C-17      | Add `training.enabled` boolean to `configuration-reference.md`                  | 8             | Hours     |
| C-18      | Add `backend-testing.md` and `ecosystem-guidelines.md` to cross-reference index | 3             | Hours     |
| C-19      | Resolve `ferrompi::slurm` module gap                                            | 3             | 0.5-1 day |

## Tickets

| Ticket     | Title                                                          | Agent                               | Effort |
| ---------- | -------------------------------------------------------------- | ----------------------------------- | ------ |
| ticket-022 | Fix Solver Testing Spec Naming and Add patch_col_bounds Tests  | `sddp-specialist`                   | 2 pts  |
| ticket-023 | Clarify StageTemplate Ownership and Fix Ferrompi Stale Names   | `hpc-parallel-computing-specialist` | 2 pts  |
| ticket-024 | Fix Notation Drift and Threading References                    | `sddp-specialist`                   | 1 pt   |
| ticket-025 | Fix CLI Config and SLURM Cross-Spec Inconsistencies            | `sddp-specialist`                   | 2 pts  |
| ticket-026 | Update Cross-Reference Index and Resolve Ferrompi Slurm Module | `implementation-guardian`           | 2 pts  |

## Dependencies

- **Depends on**: Epics 01-04 (audit reports provide the exact locations and counts for each fix)
- **Blocks**: Epic 08 (final verification)
- All tickets in this epic are independent of Epic 05 and can execute in parallel with it
- Tickets within this epic are independent of each other except ticket-023 groups C-06/C-07/C-08 together

## Deliverables

- Updated `src/specs/architecture/solver-interface-testing.md` (C-05)
- Updated `src/specs/architecture/solver-abstraction.md` or relevant file (C-06)
- Updated `src/specs/hpc/backend-ferrompi.md` (C-07)
- Updated 4 files with `split_shared()` fix (C-08)
- Updated `src/specs/architecture/training-loop.md` (C-10, C-11)
- Updated `src/specs/architecture/cut-management.md` (C-10)
- Updated `src/specs/hpc/work-distribution.md` (C-12)
- Updated `src/specs/hpc/slurm-deployment.md` (C-15)
- Updated 4 config-referencing files (C-16)
- Updated `src/specs/configuration/configuration-reference.md` (C-17)
- Updated `src/specs/cross-reference-index.md` (C-18)
- Resolved `ferrompi::slurm` module gap in relevant specs (C-19)
