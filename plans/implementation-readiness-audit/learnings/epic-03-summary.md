# Accumulated Learnings Through Epic 03 (Phase Readiness and Test Adequacy)

## Audit Results Overview

- Epics 01, 02, and 03 complete; Epic 04 pending
- All 8 crates audited (epic-01): CONDITIONAL PASS -- domain semantics sufficient, Rust API formalization and naming consistency are the gaps
- 18 remaining Medium/Low gaps triaged (epic-02): 3 Resolve-Before-Coding, 12 Resolve-During-Phase, 3 Resolve-After-MVP
- 8 phases assessed (epic-03): 6 CONDITIONALLY READY, 1 READY (Phase 4 cobre-comm, Phase 6 cobre-sddp training), 1 NOT READY (Phase 7 simulation + output)
- 7 testing specs audited (epic-03): 5 ADEQUATE, 2 ADEQUATE WITH GAPS, 0 INADEQUATE; 247 total named tests verified
- Total pre-coding effort before first commit: 9-15 working days across all 8 phases

## Gap Category Patterns

- **Missing Rust struct definitions** (most common gap): prose and tables exist but no `struct Foo { field: Type }` -- affects entity types in cobre-core, `PrecomputedPar`/opening tree in cobre-stochastic, workspace in cobre-solver, `TrainingConfig`/`StageCutPool` in cobre-sddp
- **Missing function signatures at crate boundaries** (second most common): behavior described but no typed Rust signature -- output writer API in cobre-io (GAP-020), `train`/`forward_pass`/`backward_pass` in cobre-sddp, simulation orchestrator `simulate(...)` (F-012)
- **Cross-spec naming inconsistencies** (highest severity-per-fix ratio): `patch_rhs_bounds` -> `patch_row_bounds` in `solver-interface-testing.md` (8 occurrences, flagged across 3 consecutive epics); `split_shared_memory()` -> `split_shared()` in 4 files; `forward_passes` name variants across 4 files; SLURM scripts use non-existent `cobre train --config` subcommand
- **Notation drift**: `$\pi^a_{h,\ell}$` vs `$\pi^{lag}_{h,\ell}$` in `training-loop.md` SS7.1 (Medium, F1); `$p_h$` vs `$P_h$` in `cut-management.md` (Low, F2); fix before Phase 6

## Phase-by-Phase Verdicts and Critical Conditions

- **Phase 1** (cobre-core, CONDITIONALLY READY): 3 conditions -- add Rust struct definitions for 7 entity types (Bus, Line, Thermal, Hydro, etc.), define `EntityId` concrete type, add `Stage`/`Block`/`PolicyGraph` structs; 2-4 days
- **Phase 2** (cobre-io, CONDITIONALLY READY): 1 condition -- resolve GAP-029 (cross-reference validation checklist completeness in `input-loading-pipeline.md` SS2.6); 2-3 days
- **Phase 3** (ferrompi + cobre-solver, CONDITIONALLY READY): 4 conditions -- rename `patch_rhs_bounds` -> `patch_row_bounds` in testing spec, clarify `StageTemplate`/`StageIndexer` crate ownership, fix `Mpi` RAII guard lifetime in `FerrompiBackend`, fix 7 stale API name occurrences in 4 files; 1-2 days
- **Phase 4** (cobre-comm, READY): 0 conditions; all findings are local Rust strategy decisions (BoxedRegion for SharedMemoryProvider enum dispatch, CommData bound narrowing)
- **Phase 5** (cobre-stochastic, CONDITIONALLY READY): 1 condition -- GAP-023 (OpeningTree Rust type with Arc vs SharedRegion ownership model); 1-2 days; blocks Phase 5 start because type crosses crate boundary
- **Phase 6** (cobre-sddp training, READY): 0 conditions; 8+ gaps all Resolve-During-Phase; trait dispatch subsystem is 97% COMPLETE; fix notation F1, F2 before Phase 6 coding (15-minute edits)
- **Phase 7** (cobre-sddp sim + cobre-io, NOT READY): 3 blocking conditions -- define `SimulationScenarioResult` type, define `fn simulate(...)` orchestrator signature, define full output writer API (GAP-020: 9 missing elements); 2-3 days total; resolve during Phase 6 implementation
- **Phase 8** (cobre-cli, CONDITIONALLY READY): 3 cross-spec fixes -- replace `cobre train --config` with `cobre run` in SLURM scripts, standardize `training.forward_passes` name in 4 files, add `training.enabled` to config reference; ~1 day; inherits Phase 7 GAP-020 precondition

## Three Pre-Coding Resolve-Before-Coding Gaps (from Epic 02)

- **GAP-029** (Phase 2): enumerate all entity cross-reference checks in `input-loading-pipeline.md` SS2.6; 2-3 days; resolvable immediately
- **GAP-023** (Phase 5): define `OpeningTree` Rust type with SharedRegion ownership model; 1-2 days; resolvable before Phase 5, does not need Phase 4 to be coded
- **GAP-020** (Phase 7): define full output writer API (see 9-element breakdown in `report-013-phase-5-8-readiness.md` section 4.4); 2-3 days; resolve during Phase 6, before Phase 7 begins

## Testing Spec Adequacy Summary

- 5 of 7 specs ADEQUATE with 100% method coverage for minimal viable variants (no missing tests)
- `solver-interface-testing.md` ADEQUATE WITH GAPS: missing `patch_col_bounds` tests (3 HIGH priority additions needed), 8 stale `patch_rhs_bounds` name occurrences (2 MEDIUM corrections)
- `backend-testing.md` ADEQUATE WITH GAPS: no shared fixture at section 1 top (justified for rank-dependent communication tests); error tests distributed across subsections rather than a flat dedicated section
- All 7 specs: convention blockquote correctly absent; test naming pattern compliant; cross-solver/backend equivalence tolerances match CLAUDE.md (1e-8 relative objective, 1e-8 absolute primal, 1e-6 absolute dual, 2x warm-start ratio)
- Finite-difference sensitivity checks present in `solver-interface-testing.md` SS5 as required for dual/gradient postconditions
- `patch_col_bounds` gap was not flagged by any prior report -- only the coverage matrix methodology (trait methods vs test names, column by column) detected the 0-test method

## Most Implementation-Ready Crates

- **cobre-solver**: 79% COMPLETE, only 1 High-severity finding (stale test name), all 10 trait methods fully specified with HiGHS backend mapping; solver testing spec is ADEQUATE WITH GAPS (minor)
- **ferrompi**: 96% COMPLETE, 0 MISSING items, 2 High-severity stale API names (mechanical fix); backend testing spec is ADEQUATE WITH GAPS (structural deviation justified)
- **cobre-comm**: 77% COMPLETE, strong trait contracts, all 3 traits fully specified; Phase 4 is the only fully READY phase in Phases 1-4

## Least Implementation-Ready Crates

- **cobre-io**: output writing API (GAP-020) completely absent; schemas are fully specified but Rust types and function signatures for all writer operations are undefined; 9 distinct missing API elements across simulation, training, manifest, metadata, dictionary, and serialization layers
- **cobre-core**: 47% COMPLETE (36/76 items), all entity types have prose descriptions but no Rust struct definitions; 47% completeness understates readiness because struct derivation from prose is mechanical, but it still requires 2-4 days of spec work before Phase 1 coding

## Key Architectural Findings

- "Document behavior first, formalize types later" authoring style is consistent across all 8 crates -- domain semantics are strong; the Rust API layer is the systematic gap
- Trait enum dispatch (cobre-sddp Subsystem G) is 97% COMPLETE -- reflects the spec-readiness plan's investment in architecture trait specs; that investment is directly visible in the READY verdict for Phase 6
- High completeness percentage (96% ferrompi) does not guarantee zero pre-coding conditions -- Phase 3 has 4 conditions despite being the highest-completeness phase; conditions audit targets naming consistency and crate ownership, which completeness percentage misses
- The simulation pipeline "schemas complete, API absent" pattern (8 of 12 capabilities COMPLETE, 3 MISSING all on the API/type side) is the sharpest manifestation of the "behavior first" pattern and is the root cause of the Phase 7 NOT READY verdict
- "One canonical source + cross-references only" convention was effective: 7 of 7 shared Rust types passed consistency checks across 30 modified spec files in the gap-resolution plan

## Recommendations for Epic-04 (Data Model, HPC, Verdict)

- **Present GAP-020 as the single most important pre-coding condition** in the readiness verdict: it is the only gap requiring new API design (not struct sketching), defines a new crate boundary between cobre-sddp and cobre-io, has the most downstream dependents (6 simulation output operations + FlatBuffers serialization), and has a concrete 9-element specification target in `report-013-phase-5-8-readiness.md` section 4.4
- **Verdict should provide resolution scheduling batches**: Batch 1 (resolve immediately, no dependencies) -- GAP-023, Phase 8 cross-spec fixes, notation F1/F2, `patch_col_bounds` tests, `patch_rhs_bounds` rename; Batch 2 (resolve during Phase 6 coding) -- GAP-020 and simulation types; no pre-coding condition blocks Phases 1-4
- **Include cross-reference index update in verdict conditions**: 2 missing specs (`backend-testing.md`, `ecosystem-guidelines.md`) and 9 index changes are low-effort but `backend-testing.md` must be indexed before conformance testing begins
- **Convention cleanup ticket for 100 `§` violations (83 architecture, 17 overview)**: scope as batch sed replacement per file; do not bundle with other changes; propose for Epic-04 before the verdict synthesis so it does not appear as an outstanding defect in the final report
- **Data model end-to-end trace (ticket-015) should target Phase 7 types specifically**: verify that once `SimulationScenarioResult` is defined, it is consistent with `output-infrastructure.md` streaming architecture and `output-schemas.md` entity schemas; follow data flow: LP solve -> state extraction -> result struct -> bounded channel -> I/O thread -> Parquet write
