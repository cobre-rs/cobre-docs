# Accumulated Learnings Through Epic 06 (Mechanical Naming, Notation, and Index Fixes)

## Status Overview

- All 6 epics complete (Epics 01-04: audit; Epic 05: entity/validation specs; Epic 06: mechanical fixes)
- Epic 06: 12 conditions resolved (C-05/C-06/C-07/C-08/C-10/C-11/C-12/C-15/C-16/C-17/C-18/C-19) across 5 tickets; all EXCELLENT quality (0.954, 0.988, 0.987, ~0.97, ~0.97)
- Plan progress: 26/31 tickets completed, 5 remaining (3 in epic-07, 2 in epic-08)

## Conditions Fully Resolved

- **Phase 1** (cobre-core): C-01/C-02/C-03 -- RESOLVED (Epic 05)
- **Phase 2** (cobre-io): C-04 -- RESOLVED (Epic 05)
- **Phase 3** (ferrompi + cobre-solver): C-05/C-06/C-07/C-08/C-18/C-19 -- RESOLVED (Epic 06)
- **Phase 4** (cobre-comm): READY with 0 conditions
- **Phase 5** (cobre-stochastic): C-09 -- RESOLVED (Epic 05); OpeningTree revised to per-stage branching (session fix)
- **Phase 6** (cobre-sddp training): C-10/C-11/C-12 -- RESOLVED (Epic 06)
- **Phase 7** (cobre-sddp sim + cobre-io): C-13/C-14 -- UNRESOLVED; target Epic 07
- **Phase 8** (cobre-cli): C-15/C-16/C-17 -- RESOLVED (Epic 06)

## Remaining Conditions

Only 2 conditions remain:

- **C-13**: Evaluate rkyv serialization fitness for System broadcast (GAP-003 follow-up)
- **C-14**: Define SimulationScenarioResult type and output writer API (GAP-020)

## Epic 06 Patterns

- **Batch mechanical fixes are efficient**: grouping related renames (e.g., all `split_shared_memory()` → `split_shared()` across 4 files) into a single ticket avoids repeated context loading
- **`ferrompi::slurm` was a spec-corpus invention**: the real ferrompi crate is a thin MPI wrapper with no scheduler awareness; SLURM env-var reading relocated to `cobre_comm::slurm`; lesson: always verify spec module paths against the authoritative API reference (backend-ferrompi.md SS7) before using them
- **CLI pattern is `cobre run /path/to/case`**: takes a case directory (not `--config /path/to/config.json`); all 5 SLURM script occurrences corrected
- **Config field name canonical form is `training.forward_passes`**: variants `num_forward_passes` and `forward_scenarios` eliminated from 4 spec files
- **Section renumbering propagation**: when adding new subsections (e.g., `training.enabled` as §3.1), subsequent subsections must be renumbered (§3.2 → §3.3, etc.)
- **Cross-reference index batch updates work well at scale**: adding 2 files required updating all 5 sections; the batch sequence from CLAUDE.md (outgoing → incoming → topological → crate → count) prevents omissions

## OpeningTree Revision (In-Session)

The `OpeningTree` type from ticket-021 was revised in this session to fix four problems:

1. **Per-stage branching**: replaced uniform `n_openings: usize` with `openings_per_stage: Box<[usize]>` and `stage_offsets: Box<[usize]>` for O(1) access
2. **Removed ownership analysis**: ~100 lines of Arc vs SharedRegion comparison removed; ownership is an implementation decision, not a behavioral contract
3. **Forward/backward separation**: clarified that `OpeningTree` is primarily a backward pass structure; forward pass uses it only via `InSample` scheme
4. **`n_openings()` method takes `stage` parameter**: signature changed from `fn n_openings(&self) -> usize` to `fn n_openings(&self, stage: usize) -> usize`

## Files Modified in Epic 06

- `src/specs/architecture/solver-interface-testing.md` -- C-05: renamed tests, added patch_col_bounds tests
- `src/specs/architecture/solver-abstraction.md` -- C-06: StageTemplate/StageIndexer crate ownership
- `src/specs/hpc/backend-ferrompi.md` -- C-07: Mpi RAII guard lifetime; C-08: split_shared() rename
- `src/specs/hpc/communication-patterns.md` -- C-08: split_shared() rename
- `src/specs/hpc/communicator-trait.md` -- C-08: split_shared() rename
- `src/specs/hpc/work-distribution.md` -- C-08/C-12: split_shared() rename, allgatherv type fix
- `src/specs/architecture/training-loop.md` -- C-10/C-11: notation drift, threading reference
- `src/specs/math/cut-management.md` -- C-10: notation drift
- `src/specs/hpc/slurm-deployment.md` -- C-15/C-19: cobre run, cobre_comm::slurm
- `src/specs/data-model/output-infrastructure.md` -- C-16: forward_passes field name
- `src/specs/data-model/input-directory-structure.md` -- C-16: forward_passes field name
- `src/specs/configuration/configuration-reference.md` -- C-16/C-17: forward_passes, training.enabled
- `src/specs/cross-reference-index.md` -- C-18: backend-testing.md, ecosystem-guidelines.md added (76 files total)
- `src/specs/hpc/memory-architecture.md` -- C-19: cobre_comm::slurm

## Top Priority Remaining Work

- **Epic 07** (3 tickets, outline → needs refinement):
  - ticket-027: Evaluate rkyv serialization fitness (C-13)
  - ticket-028: Define SimulationScenarioResult type (C-14 part 1)
  - ticket-029: Define output writer API (C-14 part 2)
- **Epic 08** (2 tickets, outline → needs refinement):
  - ticket-030: Re-verify cross-reference integrity after all edits
  - ticket-031: Confirm all 19 conditions resolved, produce final verdict
