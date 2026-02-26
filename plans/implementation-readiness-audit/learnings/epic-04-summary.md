# Accumulated Learnings Through Epic 04 (Data Model Traceability, HPC Correctness, Verdict)

## Audit Results Overview

- All 4 epics complete; entire implementation-readiness-audit plan is done
- All 8 crates audited (epic-01): CONDITIONAL PASS -- domain semantics sufficient, Rust API formalization and naming consistency are the gaps
- 18 Medium/Low gaps triaged (epic-02): 3 Resolve-Before-Coding, 12 Resolve-During-Phase, 3 Resolve-After-MVP
- 8 phases assessed (epic-03): 2 READY (Phase 4 cobre-comm, Phase 6 cobre-sddp training), 5 CONDITIONALLY READY, 1 NOT READY (Phase 7 simulation + output)
- 7 testing specs audited (epic-03): 5 ADEQUATE, 2 ADEQUATE WITH GAPS, 0 INADEQUATE; 247 named tests verified
- 8 data format chains traced (epic-04): 3 COMPLETE, 2 PARTIAL, 3 SCHEMA ONLY; all 4 output chains blocked by GAP-020
- 4 HPC correctness dimensions (epic-04): SUFFICIENT or SUFFICIENT WITH GAPS across all 4; 7 findings, 0 blocking
- **Final verdict (epic-04): CONDITIONAL GO -- 18 conditions, 9-15 working days total**

## Gap Category Patterns

- **Missing Rust struct definitions** (most common gap): prose and tables exist but no `struct Foo { field: Type }` -- affects entity types in cobre-core (Bus, Line, Hydro, Thermal, etc.), `OpeningTree` in cobre-stochastic, `StageCutPool` in cobre-sddp; all derivable from existing prose with 1-4 days of authoring
- **Missing function signatures at crate boundaries** (second most common): behavior described but no typed Rust signature -- `load_case` IS present (anchors all 4 input chains); output writer API entirely absent (GAP-020, 9 elements); `simulate()` orchestrator signature absent (GAP-030)
- **Cross-spec naming inconsistencies** (highest severity-per-fix ratio): `patch_rhs_bounds` -> `patch_row_bounds` in `solver-interface-testing.md` (8 occurrences); `split_shared_memory()` -> `split_shared()` in 4 files (7 occurrences total, confirmed by report-016); `forward_passes` name variants across 4 files; stale `rayon` threading reference in `training-loop.md` SS4.3 (1 occurrence); allgatherv `i32`/`usize` mismatch in `work-distribution.md` SS3.2
- **Notation drift**: `$\pi^a_{h,\ell}$` vs `$\pi^{lag}_{h,\ell}$` in `training-loop.md` SS7.1; `$p_h$` vs `$P_h$` in `cut-management.md`; fix before Phase 6

## Phase-by-Phase Verdicts and Critical Conditions

- **Phase 1** (cobre-core, CONDITIONALLY READY): C-01/C-02/C-03 -- add Rust struct definitions for 7 entity types, define `EntityId`, define `Stage`/`Block`/`PolicyGraph`; 2-4 days; Batch 1
- **Phase 2** (cobre-io input, CONDITIONALLY READY): C-04 -- GAP-029 enumerate entity cross-reference checks in `input-loading-pipeline.md` SS2.6; 2-3 days; Batch 1
- **Phase 3** (ferrompi + cobre-solver, CONDITIONALLY READY): C-05/C-06/C-07/C-08/C-18 -- rename `patch_rhs_bounds`, clarify `StageTemplate` ownership, fix `Mpi` RAII guard, fix 7 stale `split_shared_memory()` names, add 2 missing specs to cross-reference index; 1-2 days; Batch 1
- **Phase 4** (cobre-comm, READY): 0 conditions; all findings are local Rust strategy decisions
- **Phase 5** (cobre-stochastic, CONDITIONALLY READY): C-09 -- GAP-023 define `OpeningTree` Rust type with `SharedRegion` ownership model; 1-2 days; Batch 1
- **Phase 6** (cobre-sddp training, READY): C-10/C-11/C-12 are hour-scale fixes (notation drift, rayon comment, allgatherv type annotation); 0 architectural blockers; 8 Resolve-During-Phase gaps are all local decisions
- **Phase 7** (cobre-sddp sim + cobre-io, NOT READY): C-13/C-14 -- GAP-020 (9-element output writer API) + `SimulationScenarioResult` type + `simulate()` signature; 2-3 days; Batch 2 (during Phase 6)
- **Phase 8** (cobre-cli, CONDITIONALLY READY): C-15/C-16/C-17 -- replace `cobre train --config` with `cobre run`, standardize `training.forward_passes` in 4 files, add `training.enabled` field; 1 day; Batch 1; inherits Phase 7 precondition

## Pre-Coding Resolution Batches

- **Batch 1** (resolve before Phase 5+ coding, 7-12 days): C-01 through C-12, C-15 through C-18; pure spec authoring with no implementation prerequisites; unblocks Phases 1-6 and Phase 8; calendar time 4-6 days with 2 parallel authors
- **Batch 2** (resolve during Phase 6 coding, 2-3 days): C-13 and C-14 (GAP-020 output writer API and simulation types); deferred to Phase 6 because training pipeline patterns inform simulation API design; resolve before Phase 7 begins
- **Resolution order within Batch 2**: define `SimulationScenarioResult` first (C-14), then design GAP-020 output writer API (C-13), starting with the metadata/manifest chain (simplest serialization) to establish the writer pattern

## Data Model Traceability (Epic 04 New Dimension)

- **Input chains**: 3 COMPLETE (JSON entity registries, JSON config files, Parquet scenario files), 1 PARTIAL (FlatBuffers policy -- missing deserialization function signature and `StageCutPool` struct)
- **Output chains**: 0 COMPLETE; 3 SCHEMA ONLY (simulation results, training convergence/timing, metadata/manifests/dictionaries), 1 PARTIAL (FlatBuffers policy checkpoint -- strongest output chain because `.fbs` schema is machine-readable)
- **Systemic output gap**: all 4 output chains blocked by GAP-020; a single anchoring function (analogous to `load_case` on the input side) would cascade improvements across all 4 chains simultaneously
- **Source files**: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-015-data-traceability.md` section 4 (chain summary table) and section 5 (findings)

## HPC Spec Correctness (Epic 04 New Dimension)

- **MPI collective parameters** (SUFFICIENT WITH GAPS): 15 invocation sites inventoried; complete parameter detail at the two most critical sites (`communicator-trait.md` SS1.1 and `cut-management-impl.md` SS4.2a); type mismatch F-016-001 (`work-distribution.md` SS3.2 uses `i32`/`Vec<i32>` for allgatherv counts, trait uses `usize`) is the only finding requiring correction
- **Threading model** (SUFFICIENT WITH GAPS): 15 HPC files fully consistent (OpenMP); 2 inconsistencies in architecture files: `training-loop.md` SS4.3 struct comment references "rayon thread pool size", `solver-workspaces.md` SS1.3a uses `rayon::current_thread_index()` in test context; both pre-date GAP-018 resolution
- **NUMA/cache actionability** (SUFFICIENT): 12 of 15 guidelines ACTIONABLE with specific alignment values (64-byte cache lines), specific code paths (6-step NUMA initialization in `memory-architecture.md` SS3.2), and specific data structures; 3 ASPIRATIONAL guidelines are informational only
- **ferrompi API surface** (SUFFICIENT WITH GAPS): all wrapper code in `backend-ferrompi.md` SS1-SS3 matches SS7 API reference; 4 stale `split_shared_memory()` references remain (3 in `communicator-trait.md`, 1 new finding in `communication-patterns.md` line 208); `init_with_threading()` from report-008 F-005 was already corrected
- **Source file**: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-016-hpc-correctness.md` section 6 (summary table with all 7 findings)

## Crate Readiness Ranking

- **Rank 1 -- ferrompi** (96% complete, Phase 3, CONDITIONALLY READY): highest completeness, 0 MISSING items, 4 stale API names (mechanical fix); full API reference in `backend-ferrompi.md` SS7
- **Rank 2 -- cobre-solver** (79% complete, Phase 3, CONDITIONALLY READY): all 10 trait methods COMPLETE with HiGHS mapping; testing spec stale names are the main gap
- **Rank 3 -- cobre-comm** (77% complete, Phase 4, READY): only fully READY phase; all 3 traits complete; `CommBackend`+`SharedMemoryProvider` dispatch is a local design decision
- **Rank 4 -- cobre-sddp training** (97% Subsystem G, Phase 6, READY): trait dispatch 97% COMPLETE; 8 Resolve-During-Phase gaps are all local; 14-spec reading list
- **Rank 5 -- cobre-stochastic** (~65% complete, Phase 5, CONDITIONALLY READY): PAR math complete; `OpeningTree` (GAP-023) is the single pre-coding blocker
- **Rank 6 -- cobre-cli** (~66% complete, Phase 8, CONDITIONALLY READY): 0 MISSING items; 5 cross-spec naming inconsistencies require mechanical fixes
- **Rank 7 -- cobre-core** (47% complete, Phase 1, CONDITIONALLY READY): `System` struct COMPLETE; all entity types PARTIAL (no Rust struct definitions); 2-4 days of mechanical struct derivation
- **Rank 8 -- cobre-io output** (~30% complete, Phase 7, NOT READY): all output schemas fully specified; entire output writer API absent (9 elements, GAP-020)

## Key Architectural Findings

- "Document behavior first, formalize types later" authoring style is the systematic gap across all 8 crates -- crates ranking highest (ferrompi, cobre-solver) are where Rust APIs were formalized early; crates ranking lowest (cobre-core, cobre-io output) are where Rust API formalization was deferred
- Input/output spec asymmetry is explained by the `load_case` anchoring function -- the output side has no equivalent anchor; all output chain gaps resolve to this single missing API design decision
- 100 section-prefix convention violations (83 architecture, 17 overview files) are a navigability risk for Phase 6 implementers; a batch sed replacement pass should be scheduled before Phase 6 begins
- All 7 shared Rust types passed cross-spec consistency checks (report-011); all 4,689 internal Markdown links verified (report-010); zero mutual contradictions across 16 reports -- high confidence the conditions inventory is complete and no latent architectural gaps remain
- Testing corpus (247 tests, 7 specs) is ADEQUATE or ADEQUATE WITH GAPS for minimal viable variant scope; 3 HIGH-priority `patch_col_bounds` tests must be added to `solver-interface-testing.md` before Phase 3 begins

## Top 3 Risks After Conditions Are Met

- **Risk 1** (Phase 6 multi-crate integration, High impact, Medium likelihood): 5 upstream APIs converge at Phase 6; entity struct field names could diverge from LP formulation expectations; mitigation: resolve C-01 through C-03 before Phase 2 begins so downstream crates target stable types; use the 3-bus 12-stage 4-MPI-rank integration test in `implementation-ordering.md` section 5 as the Phase 6 quality gate
- **Risk 2** (GAP-020 resolution quality, High impact, Medium likelihood): output writer API defines the cobre-sddp/cobre-io crate boundary for all 4 output chains; a poorly designed API requires rework across both crates; mitigation: start with the metadata/manifest chain (simplest serialization), use `load_case` as the design template, define `SimulationScenarioResult` before designing writer method signatures
- **Risk 3** (convention violations degrading navigability, Medium impact, High likelihood): 100 section-prefix violations and 4 stale API names will be encountered by every Phase 6 implementer; mitigation: batch `§`-to-`SS` replacement pass as a standalone ticket before Phase 6; C-08 stale name fixes are already in Batch 1

## Audit Coverage Summary (Final)

- Total reports: 16 (reports 001-017, with report 017 being the terminal verdict)
- Total spec files read across all reports: 84 (full corpus verified in report-010)
- Total completeness items audited: 503
- Total findings across all 16 reports: 130
- Gaps triaged: 18 (3 Resolve-Before-Coding, 12 Resolve-During-Phase, 3 Resolve-After-MVP)
- Internal Markdown links verified: 4,689
- Named tests verified: 247
- Pre-coding conditions in final verdict: 18 (9-15 working days)
