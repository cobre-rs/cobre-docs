# Accumulated Learnings Through Epic 01 (Per-Crate API Surface Audit)

## Audit Results Overview

- All 8 crates audited: cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-comm, cobre-cli, ferrompi
- All 8 crates: CONDITIONAL PASS -- domain semantics sufficient, Rust type formalization and cross-spec naming are the gaps
- Total findings: 91 across all reports (16 High, 38 Medium, 33 Low)
- Implementation-ready crates (minimal additional spec work): cobre-solver, ferrompi, cobre-comm
- Highest-risk crates for implementation: cobre-core (47% COMPLETE by item count), cobre-io (output API entirely absent)

## Gap Category Patterns

- **Missing Rust struct definitions** (most common gap): prose and table descriptions exist but no `struct Foo { field: Type }` -- affects entity types in cobre-core, `PrecomputedPar`/opening tree in cobre-stochastic, workspace in cobre-solver, `TrainingConfig`/`ConvergenceMonitor`/`StageCutPool` in cobre-sddp
- **Missing function signatures at crate boundaries** (second most common): behavior described but no typed Rust signature -- affects output writer API in cobre-io, `train`/`forward_pass`/`backward_pass` in cobre-sddp, parallel policy loading in cobre-io
- **Cross-spec naming inconsistencies** (highest severity-per-fix ratio): stale method names and field names cause compilation failures; `split_shared_memory()` should be `split_shared()` (4 files), `init_with_threading()` should be `Mpi::init_thread()` (1 file), `forward_passes` vs `num_forward_passes` vs `forward_scenarios` (4 files)
- **Crate ownership ambiguities**: `StageTemplate`/`StageIndexer` (cobre-core vs cobre-solver vs training-loop.md), `LoadError` (cobre-core vs cobre-io)

## Phase-Gated Critical Findings

- **Phase 1 (cobre-core)**: entity struct definitions absent for 7 types (Bus, Line, Hydro, Thermal, PumpingStation, Stage, Block) -- an implementer can derive them from prose but should not have to; `EntityId` type undefined
- **Phase 2 (cobre-io)**: output writer API entirely unspecified (GAP-020 unresolved) -- the cobre-sddp -> cobre-io boundary for simulation and training output has no Rust API definition; `OutputError` enum absent
- **Phase 3 (cobre-solver + ferrompi)**: `patch_rhs_bounds` must be renamed `patch_row_bounds` in `src/specs/architecture/solver-interface-testing.md`; `split_shared_memory()` -> `split_shared()` in 4 spec files; `StageTemplate`/`StageIndexer` crate ownership must be decided
- **Phase 4 (cobre-comm)**: `CommBackend` enum lacks `SharedMemoryProvider` implementation strategy (region type unification needed before training entry point signature can be finalized)
- **Phase 5 (cobre-stochastic)**: `PrecomputedPar` struct (GAP-022) and opening tree type (GAP-023) absent; `StageRng` type undefined
- **Phase 6 (cobre-sddp training)**: `TrajectoryRecord` type undefined (GAP-030); `training.forward_passes` field has no default and is inconsistently named across specs
- **Phase 7 (cobre-sddp simulation)**: simulation pipeline at 33% PARTIAL+MISSING threshold; `SimulationScenarioResult` and `simulate()` signature both absent
- **Phase 8 (cobre-cli)**: `training.enabled` config field not in configuration reference; 5 High-severity cross-spec naming issues (all documentation fixes)

## Most Implementation-Ready Crates

- **cobre-solver**: 79% COMPLETE (38/48 items), 1 High-severity finding (testing spec naming), all 10 trait methods fully specified with HiGHS backend mapping
- **ferrompi**: 96% COMPLETE (70/73 items), 0 MISSING items, 2 High-severity stale API names (mechanical find-and-replace)
- **cobre-comm**: 77% COMPLETE (43/56 items), strong trait behavioral contracts, 1 High-severity structural gap (`CommBackend` + `SharedMemoryProvider`)

## Least Implementation-Ready Crates

- **cobre-io**: output writing API (GAP-020) completely absent despite comprehensive schema specs; 20 MISSING items (mostly output writer function signatures)
- **cobre-core**: 47% COMPLETE (36/76 items), 33 PARTIAL items -- all entity types have prose descriptions but no Rust struct definitions

## Key Architectural Findings

- The corpus adopted "document behavior first, formalize types later" -- domain semantics are strong, Rust API surface is the gap
- Trait enum dispatch (cobre-sddp Subsystem G) is 97% COMPLETE, reflecting the thoroughness of the spec-readiness plan's architecture trait work -- that investment paid off directly
- Output API gap (cobre-io GAP-020) is the largest single gap in the corpus: schemas are fully specified but the Rust API for writing them is undefined, blocking Phase 4-5 integration
- `StageTemplate`/`StageIndexer` crate ownership ambiguity is the most cross-cutting decision needed before Phase 3

## Recommendations for Epic-02 (Gap Triage and Consistency)

- Resolve cobre-io output API gap (GAP-020) first: define `OutputWriter` type/trait, `OutputError` enum, and function signatures for simulation, training, manifest, and dictionary writes
- Apply naming standardization pass: `forward_passes` canonical name, `split_shared()` in 4 files, `Mpi::init_thread()` in 1 file, `patch_row_bounds` in testing spec
- Decide `StageTemplate`/`StageIndexer` crate ownership and propagate to all affected spec files
- Add Rust struct sketches for the 7 entity types in `src/specs/data-model/internal-structures.md` (cobre-core F-001)
- Resolve `CommBackend` + `SharedMemoryProvider` region type strategy (cobre-comm F-005)
- Define `PrecomputedPar` and opening tree structs (GAP-022, GAP-023) and `StageRng` type alias

## Recommendations for Epic-03 (Phase Readiness and Testing)

- Use cobre-solver 79% completeness as the target bar for Phase 1-4 crates before beginning implementation tickets
- Flag simulation pipeline (cobre-sddp Subsystem F) for a dedicated spec-writing sub-ticket before Phase 7 planning
- Assess `TrajectoryRecord` (GAP-030) as a Phase 6 blocker -- it is the only High-severity finding that prevents the training loop from being implemented correctly
- Verify that the HiGHS dual sign convention is documented in `src/specs/hpc/solver-highs-impl.md` before Phase 3 tickets are dispatched (cobre-solver F-005)
