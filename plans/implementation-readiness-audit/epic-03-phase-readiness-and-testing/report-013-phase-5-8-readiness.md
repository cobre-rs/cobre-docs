# Report 013 -- Implementation Phase 5-8 Readiness Assessment

**Date**: 2026-02-26
**Scope**: Phases 5-8 from [Implementation Ordering](../../../src/specs/overview/implementation-ordering.md) section 5
**Inputs**: Report-003 (cobre-stochastic), Report-005 (cobre-sddp), Report-002 (cobre-io output), Report-007 (cobre-cli), Report-009 (gap triage), Epic-02 learnings
**Method**: Per-phase assessment across 5 dimensions, consuming existing audit reports without re-auditing crate API surfaces

---

## 1. Executive Summary

| Phase | Crate(s)                    | Verdict             | Blocking Pre-Coding Conditions                                                      |
| ----- | --------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| 5     | cobre-stochastic            | CONDITIONALLY READY | GAP-023 (opening tree type) must be resolved before Phase 5 start                   |
| 6     | cobre-sddp (training)       | READY               | None -- all 8 gaps are Resolve-During-Phase                                         |
| 7     | cobre-sddp (sim) + cobre-io | NOT READY           | GAP-020 (output writer API), simulation orchestrator signature, result type missing |
| 8     | cobre-cli                   | CONDITIONALLY READY | Config naming inconsistencies (F-003/F-010/F-012) must be reconciled                |

**Overall**: Phases 5 and 6 can proceed with minimal pre-work. Phase 7 has the largest gap surface in the entire build sequence and requires 2-3 days of targeted spec resolution before coding can begin. Phase 8 is blocked by documentation inconsistencies rather than missing architecture.

---

## 2. Phase 5 Assessment: cobre-stochastic (Scenario Generation)

### 2.1 Spec Reading List Completeness

The Phase 5 reading list contains 5 specs:

| Listed Spec           | Covers                                              | Sufficient? |
| --------------------- | --------------------------------------------------- | ----------- |
| Scenario Generation   | PAR preprocessing, opening tree, noise correlation  | Yes         |
| PAR Inflow Model      | AR model mathematics, residual std, Yule-Walker     | Yes         |
| Inflow Non-Negativity | Truncation and redistribution methods               | Yes         |
| Sampling Scheme Trait | `SamplingScheme` enum, `sample_forward`, validation | Yes         |
| Input Scenarios       | Parquet schemas for PAR parameters and correlation  | Yes         |

**Missing from list**: None identified. The five specs cover the full cobre-stochastic scope. The `internal-structures.md` SS14 (which defines the `System.par_models` and `System.correlation` fields consumed by cobre-stochastic) is a cobre-core spec read in Phase 1 and does not need to be re-listed.

**Verdict**: Complete.

### 2.2 Testable Intermediate Achievability

The Phase 5 testable intermediate specifies: "PAR(p) parameter preprocessing (reverse-standardization, contiguous layout), Cholesky-factored correlated noise generation, opening tree construction (fixed discrete realizations with probabilities), InSample forward sampling, reproducible scenario generation given a seed."

| Capability                   | Spec Completeness (from report-003) | Achievable? | Notes                                                                                       |
| ---------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| PAR preprocessing            | PARTIAL (no Rust struct)            | Yes         | GAP-022 (Resolve-During-Phase): array layout fully specified, struct derivable from table   |
| Reverse-standardization      | COMPLETE                            | Yes         | Formula in `par-inflow-model.md` SS3 is unambiguous                                         |
| Cholesky-factored noise gen  | PARTIAL (no storage type)           | Yes         | F-005 in report-003: library dependency unspecified but nalgebra is the idiomatic choice    |
| Opening tree construction    | MISSING (no Rust type)              | Conditional | GAP-023 (Resolve-Before-Coding): crosses cobre-stochastic/cobre-sddp boundary               |
| InSample forward sampling    | COMPLETE                            | Yes         | `sample_forward` has full Rust signature with pre/postconditions                            |
| Reproducible seed derivation | PARTIAL (no Rust signature)         | Yes         | SipHash-1-3 algorithm fully specified including byte encoding; function derivable from spec |

**Assessment**: 5 of 6 capabilities are achievable without pre-coding spec work. The opening tree construction is conditionally achievable because the type crosses a crate boundary.

### 2.3 Gap Impact on Phase

| Gap ID  | Classification        | Impact on Phase 5                                                                                                                                                                    |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-022 | Resolve-During-Phase  | `PrecomputedPar` struct is internal to cobre-stochastic. The array layout (4 arrays, dimensions, row-major ordering) is fully specified. Implementer can derive the struct directly. |
| GAP-023 | Resolve-Before-Coding | Opening tree type crosses the cobre-stochastic/cobre-sddp boundary. Ownership model (`Arc<OpeningTree>` vs `SharedRegion<f64>`) affects the public API of cobre-stochastic.          |

**GAP-023 scope determination**: GAP-023 blocks the Phase 5 _start_, not merely Phase 6 consumption. The reason is that the opening tree is the primary _output_ of cobre-stochastic's `construct_opening_tree` function. Without a concrete return type, the implementer cannot write the function signature for this core crate-boundary API. Report-009 classifies GAP-023 as Resolve-Before-Coding with 1-2 days effort, which aligns with this assessment.

### 2.4 Implicit Knowledge Gaps

1. **Linear algebra library selection**: Report-003 F-005 notes that the Cholesky factorization has no specified library dependency. The implementer must choose between `nalgebra` (idiomatic for small dense matrices), `faer` (newer, SIMD-optimized), or a custom lower-triangular implementation. For typical correlation groups (5-20 entities), all options perform equivalently. The choice affects `Cargo.toml` dependencies but not the API.

2. **`StageRng` type**: Report-003 F-004 identifies that `StageRng` (used as a parameter in `sample_forward`) is never defined as a type alias. The spec says "Pcg64 (or equivalent)" -- the implementer must pin this to a concrete type for reproducibility. This is a one-line type alias decision.

3. **`NoiseVector` derive macros**: Report-003 notes that `NoiseVector` has no derive macros specified. The implementer must decide on `Debug, Clone` at minimum.

### 2.5 Cross-Phase Dependency Risks

Phase 5 depends only on Phase 1 (cobre-core internal structures for PAR model parameters). The dependency is well-characterized: `System.par_models` and `System.correlation` fields are documented in `internal-structures.md` SS14. The risk is that Phase 1 entity struct definitions (all Resolve-During-Phase per report-009) might not match the field names expected by cobre-stochastic. This is low risk because the field semantics are clear even if the Rust struct names differ.

Phase 5 produces outputs consumed by Phase 6: the opening tree and `PrecomputedPar`. The opening tree crosses the crate boundary (GAP-023); `PrecomputedPar` is consumed only within cobre-stochastic's own evaluation methods and does not cross a boundary.

**Verdict**: **CONDITIONALLY READY**. Resolve GAP-023 (opening tree Rust type and ownership model) before Phase 5 coding begins. Estimated effort: 1-2 days. All other gaps are Resolve-During-Phase.

---

## 3. Phase 6 Assessment: cobre-sddp Training (Forward/Backward Pass and Cuts)

### 3.1 Spec Reading List Completeness

The Phase 6 reading list contains 14 specs -- the largest of any phase:

| Listed Spec                   | Covers                                                      | Sufficient? |
| ----------------------------- | ----------------------------------------------------------- | ----------- |
| SDDP Algorithm                | Mathematical foundation, Bellman recursion, cut generation  | Yes         |
| LP Formulation                | Stage LP structure, variable layout, constraint formulation | Yes         |
| Cut Management                | Cut coefficients, single/multi-cut, cut pool operations     | Yes         |
| Risk Measures                 | CVaR formulation, expectation variant                       | Yes         |
| Stopping Rules                | 5 stopping criteria, composite evaluation                   | Yes         |
| Upper Bound Evaluation        | Statistical upper bound, confidence intervals               | Yes         |
| Training Loop                 | Iteration lifecycle, event emission, forward/backward pass  | Yes         |
| Convergence Monitoring        | Lower/upper bounds, gap computation, stalling detection     | Yes         |
| Cut Management Implementation | Cut pool pre-allocation, Level-1 selection, activity        | Yes         |
| Work Distribution             | MPI rank/thread assignment, forward/backward distribution   | Yes         |
| Synchronization               | Cut sync via allgatherv, bound aggregation via allreduce    | Yes         |
| Risk Measure Trait            | Enum definition, `aggregate_cut` method                     | Yes         |
| Horizon Mode Trait            | Finite variant, successor/terminal methods                  | Yes         |
| Cut Selection Strategy Trait  | Level-1 variant, `select` method                            | Yes         |
| Stopping Rule Trait           | All 5 rules, `StoppingRuleSet` composition                  | Yes         |

**Missing from list**: The `Solver Interface Trait` and `Solver Workspaces` specs are not listed for Phase 6 but are consumed indirectly through cobre-solver (Phase 3). The training loop calls `solve()` and `solve_with_basis()` on solver workspaces. An implementer already has these from Phase 3 reading. This is not a gap -- it is correct layering.

**Verdict**: Complete. The 14-spec reading list is the most comprehensive in the build sequence.

### 3.2 Testable Intermediate Achievability

The Phase 6 testable intermediate specifies a large set of capabilities including the integration test: "train a 3-bus, 2-hydro, 1-thermal, 12-stage case on 4 MPI ranks until convergence."

| Capability                    | Spec Completeness (from report-005)   | Achievable? | Notes                                                                                                                |
| ----------------------------- | ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Stage LP construction         | PARTIAL (StageTemplate struct absent) | Yes         | LP variable layout fully specified in `lp-formulation.md`; StageTemplate gap is Phase 3 (Resolve-During-Phase)       |
| Forward pass (sample + solve) | PARTIAL (no function signature)       | Yes         | 7-step iteration lifecycle fully specified; `sample_forward` complete; LP solve API complete from Phase 3            |
| Backward pass (eval + duals)  | PARTIAL (no function signature)       | Yes         | Cut generation mathematics fully specified; dual extraction from solver complete; trial state distribution clarified |
| Cut coefficient computation   | COMPLETE                              | Yes         | $\alpha_t^k$ and $\beta_t^k$ formulas with sign convention documented                                                |
| Single-cut aggregation        | COMPLETE                              | Yes         | Probability-weighted aggregation formula fully specified                                                             |
| Cut sync via allgatherv       | COMPLETE                              | Yes         | `CutWireRecord` layout verified consistent across all specs (report-010)                                             |
| Convergence monitoring        | PARTIAL (no struct)                   | Yes         | Lower bound, statistical upper bound with Bessel's correction, gap formula all complete                              |
| All 5 stopping rules          | COMPLETE (97% in Subsystem G)         | Yes         | Full Rust enum definitions, `should_stop` signatures, composition contract                                           |
| FCF management + Level-1      | PARTIAL (no `StageCutPool` struct)    | Yes         | Pre-allocation formula, activity tracking, Level-1 algorithm all specified                                           |
| 4-rank integration test       | Depends on above                      | Yes         | All components individually achievable; integration is assembly                                                      |

**Assessment**: All 10 capabilities are achievable. The PARTIAL items are all aggregation structs (`TrainingConfig`, `ConvergenceMonitor`, `StageCutPool`) whose individual components are fully specified. Report-005 Subsystem G (Trait Enum Dispatch) is 97% COMPLETE -- 36 of 37 items have full Rust definitions.

### 3.3 Gap Impact on Phase

| Gap ID  | Classification       | Impact on Phase 6                                                                                                                      |
| ------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-018 | Resolve-During-Phase | Threading model (rayon vs std::thread). Spec already recommends rayon (Training Loop SS4.3). Local to cobre-sddp.                      |
| GAP-019 | Resolve-During-Phase | Solver retry config. Hardcoded defaults documented in Solver Abstraction SS7.1. Internal to cobre-solver, does not affect Phase 6 API. |
| GAP-024 | Resolve-During-Phase | Cut activity tolerance. Default 1e-6 is standard practice. One-line constant.                                                          |
| GAP-026 | Resolve-During-Phase | Backward trial state distribution. Already clarified in Work Distribution SS2: same contiguous block assignment as forward pass.       |
| GAP-027 | Resolve-During-Phase | `training.forward_passes` default. Resolution: mark as required, emit error if missing. Does not affect cobre-sddp types.              |
| GAP-030 | Resolve-During-Phase | `TrajectoryRecord` data structure. Per-scenario state+cost storage. All fields known; struct layout is local to cobre-sddp.            |
| GAP-032 | Resolve-During-Phase | Event channel type. `std::sync::mpsc` is the zero-dependency starting point. Internal to cobre-core/cobre-sddp.                        |
| GAP-033 | Resolve-During-Phase | `SharedMemoryProvider` bound inconsistency. All 4 backends implement both traits. Documentation fix only.                              |
| GAP-034 | Resolve-During-Phase | Cut pool capacity formula assumes immutable `forward_passes`. Confirmed immutable by config reference. Assert as precondition.         |

**Assessment**: Zero Resolve-Before-Coding gaps for Phase 6. All 8 gaps (plus GAP-034 which is Low severity) are local design decisions that do not affect crate boundary types.

### 3.4 Implicit Knowledge Gaps

1. **Notation drift**: Report-010 (shared types and notation) identified two notation inconsistencies in `training-loop.md` SS7.1: `$\pi^a_{h,\ell}$` vs `$\pi^{lag}_{h,\ell}$` (Medium) and `$p_h$` vs `$P_h$` in `cut-management.md` (Low). These should be fixed before implementing cut coefficient extraction to avoid sign/notation confusion. This is a 15-minute spec edit, not a design decision.

2. **`StageTemplate`/`StageIndexer` crate ownership**: The LP variable layout types are consumed by cobre-sddp but may be defined in cobre-core or cobre-solver. The epic-02 learnings note this as a Phase 3 decision point. By Phase 6, this decision will have been made.

3. **Forward pass patch sequence**: GAP-005 (Blocker, now resolved) defined the state transfer mechanism. The implementer should verify the resolution in `training-loop.md` before coding the forward pass state injection.

### 3.5 Cross-Phase Dependency Risks

Phase 6 depends on all four preceding crates: cobre-core (Phase 1), cobre-stochastic (Phase 5), cobre-solver (Phase 3), and cobre-comm (Phase 4). This is the highest fan-in in the dependency graph.

**Multi-crate integration risk**: The primary risk is that the four upstream crates expose APIs with subtly incompatible assumptions. Specific integration points:

| Integration Point                         | Risk Level | Mitigation                                                                                          |
| ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| cobre-stochastic opening tree -> backward | Medium     | GAP-023 resolution defines the shared type before Phase 5 begins                                    |
| cobre-solver workspace -> training loop   | Low        | Solver trait is 79% COMPLETE with full method signatures; warm-start API documented                 |
| cobre-comm allgatherv -> cut sync         | Low        | `CutWireRecord` layout verified consistent across all specs (report-010)                            |
| cobre-core System -> LP construction      | Medium     | Entity struct definitions are Resolve-During-Phase; field semantics documented but names may differ |

The multi-crate integration test (3-bus, 2-hydro, 1-thermal, 12-stage on 4 MPI ranks) is the natural integration validation. The test scope is well-defined in the implementation ordering.

**Verdict**: **READY**. All testable intermediates are achievable with current spec completeness. All 8+ gaps are Resolve-During-Phase. The 14-spec reading list is comprehensive. The trait dispatch subsystem (97% COMPLETE) provides an exceptionally strong foundation.

---

## 4. Phase 7 Assessment: Simulation + Output (cobre-sddp + cobre-io)

### 4.1 Spec Reading List Completeness

The Phase 7 reading list contains 5 specs:

| Listed Spec             | Covers                                                       | Sufficient? |
| ----------------------- | ------------------------------------------------------------ | ----------- |
| Simulation Architecture | Pipeline architecture, scenario distribution, cost stats     | Yes         |
| Output Schemas          | 11 simulation entity schemas, training schemas, dictionaries | Yes         |
| Output Infrastructure   | Hive partitioning, manifests, metadata, crash recovery       | Yes         |
| Binary Formats          | FlatBuffers schema for FCF checkpoint                        | Yes         |
| Checkpointing           | Checkpoint trigger, file layout, resume protocol             | Yes         |

**Missing from list**: The Phase 7 reading list does not include `input-loading-pipeline.md` (which contains the policy loading protocol in SS7 for warm-start scenarios) or `validation-architecture.md` (which defines the structured error format consumed by output writers). These are secondary references that the implementer may need but are not critical path items for the minimal viable simulation.

**Verdict**: Adequate for the minimal viable. The 5 listed specs cover the simulation pipeline and output chain.

### 4.2 Testable Intermediate Achievability

The Phase 7 testable intermediate specifies: "Simulation pipeline: replay trained FCF on a large scenario set distributed across MPI ranks, solve stage LP sequence per scenario, stream per-scenario results. Output pipeline: Hive-partitioned Parquet writes, manifest files, metadata dictionaries, FlatBuffers serialization. Integration test: full train + simulate cycle on 4 ranks, verify output Parquet schema and row counts."

| Capability                        | Spec Completeness                      | Achievable? | Notes                                                                                       |
| --------------------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| Simulation scenario distribution  | COMPLETE (SS3.1)                       | Yes         | Same two-level distribution as training; formula reusable                                   |
| Per-scenario forward pass         | COMPLETE (SS3.2)                       | Yes         | 4-step sequence (initialize, stage loop, compute cost, stream results) fully specified      |
| Cost statistics (mean, CVaR)      | COMPLETE (SS4.1)                       | Yes         | Formulas for all statistics provided                                                        |
| MPI aggregation for sim results   | COMPLETE (SS4.4)                       | Yes         | `MPI_Allreduce` for min/max, `MPI_Gatherv` for costs documented                             |
| Simulation orchestrator signature | **MISSING**                            | **No**      | F-012 in report-005: no function signature for the simulation entry point                   |
| `SimulationScenarioResult` type   | **MISSING**                            | **No**      | F-013 in report-005 (GAP-030): no per-scenario result type for the streaming payload        |
| Output streaming architecture     | COMPLETE (SS6)                         | Yes         | Bounded channel, background I/O thread, detail levels documented                            |
| Simulation -> IO writer API       | **MISSING**                            | **No**      | GAP-020: no types, traits, or function signatures for cobre-sddp to call cobre-io           |
| Hive-partitioned Parquet writes   | PARTIAL (schemas yes, writer no)       | Conditional | 11 entity output schemas complete; write protocol documented; no Rust writer type           |
| Training Parquet writer           | **MISSING** (schema yes, writer no)    | **No**      | Convergence log schema specified; no function signature                                     |
| Manifest writer                   | **MISSING** (schema yes, writer no)    | **No**      | Manifest JSON schemas specified; crash recovery protocol documented; no function signature  |
| Metadata writer                   | **MISSING** (schema yes, writer no)    | **No**      | Full metadata JSON schema specified; no function signature                                  |
| Dictionary writer                 | **MISSING** (schema yes, writer no)    | **No**      | All dictionary schemas specified; no function signature                                     |
| FlatBuffers serialization         | PARTIAL (schema yes, function no)      | Conditional | Complete `.fbs` schema in binary-formats.md SS3.1; no Rust serialization function signature |
| Policy compatibility validation   | PARTIAL (checks listed, algo deferred) | Yes         | 8-row validation table sufficient for minimal viable (no external warm-start)               |
| Integration test (train+simulate) | Depends on above                       | **No**      | Cannot assemble without the orchestrator signature, result type, and writer API             |

**Assessment**: 7 of 16 capabilities are blocked by missing API elements. The pattern is consistent: _schemas and protocols are fully specified, but Rust types and function signatures are absent for all output-side operations_. This is the "document behavior first, formalize types later" authoring pattern identified in the epic-02 learnings, concentrated in the output pipeline.

### 4.3 Gap Impact on Phase

| Gap ID  | Classification        | Impact on Phase 7                                                                                                                                                                |
| ------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-020 | Resolve-Before-Coding | The single largest API gap. Without the output writer interface (types, method signatures, thread-safety guarantees, error types), cobre-sddp cannot stream results to cobre-io. |
| GAP-028 | Resolve-During-Phase  | Policy compatibility validation for warm-start. For the minimal viable solver (no external warm-start), the 8-row inline table is sufficient.                                    |

Note: GAP-021 (FlatBuffers schema) was already resolved -- the full `.fbs` schema exists in binary-formats.md SS3.1. Per the ticket instructions, it is not counted as a Phase 7 gap.

### 4.4 Specific Missing API Elements for GAP-020

Report-002 (cobre-io) identified the following MISSING items that constitute GAP-020:

| Missing Element                | From Report-002    | What Must Be Specified                                                                  |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------- |
| Simulation Parquet writer type | SS1.1 row: MISSING | Rust trait or concrete type with `write_scenario_result` method, thread-safety bounds   |
| Training Parquet writer type   | SS1.1 row: MISSING | Rust type with `write_convergence_row`, `write_timing_row` methods                      |
| Manifest writer function       | SS1.2 row: MISSING | `fn write_manifest(path: &Path, manifest: &Manifest) -> Result<(), IoError>`            |
| Metadata writer function       | SS1.2 row: MISSING | `fn write_metadata(path: &Path, metadata: &RunMetadata) -> Result<(), IoError>`         |
| Dictionary writer function     | SS1.2 row: MISSING | Functions for codes.json, bounds.parquet, variables.csv, entities.csv                   |
| FlatBuffers serialization fn   | SS1.2 row: MISSING | `fn serialize_stage_cuts(cuts: &StageCuts) -> Vec<u8>` and deserialize counterpart      |
| Output writing error type      | SS1.3 row: MISSING | Error enum for Parquet write failures, manifest write failures, serialization errors    |
| serde Serialize derives        | SS1.4 row: MISSING | Which output types need `serde::Serialize` for JSON output (manifests, metadata, codes) |
| Parquet library selection      | SS1.4 row: MISSING | Whether to use `arrow2`, `polars`, or `parquet` crate for Parquet I/O                   |

**Estimated resolution effort**: 2-3 days. The schemas are fully specified, so the API design is constrained to wrapping the existing schemas in Rust types and function signatures. The simulation streaming architecture (bounded channel, background I/O thread) provides the thread-safety context. The writer must be `Send` (moved to the I/O thread) but not necessarily `Sync` (only one thread writes at a time).

### 4.5 Cross-Phase Dependency Risks

Phase 7 is a **dual-crate phase**: cobre-sddp (simulation pipeline) and cobre-io (output writing) must be developed in coordination. The risk is that:

1. **Producer-consumer type mismatch**: The simulation pipeline produces per-scenario results that the output writer consumes. Without a shared type (`SimulationScenarioResult`), the two crate implementations could diverge on field names, field types, or field ordering.

2. **Thread-safety contract ambiguity**: The streaming architecture uses a bounded channel between simulation threads and an I/O background thread. The `Send` bound on the payload type is implicit but not specified. If the simulation result type contains non-`Send` types (e.g., solver workspace references), the streaming architecture breaks.

3. **MPI Hive partitioning coordination**: Each MPI rank writes its own partition of the output. The partition key assignment (rank ID in the Hive path) must be coordinated between cobre-sddp (which knows the rank assignment) and cobre-io (which writes the files). The protocol is documented in `output-infrastructure.md` SS3.2, but the function parameter that carries the rank ID into the writer is unspecified.

**Verdict**: **NOT READY**. Three fundamental spec gaps block the testable intermediate: (1) simulation orchestrator function signature (MISSING), (2) `SimulationScenarioResult` type (MISSING / GAP-030), (3) output writer API (MISSING / GAP-020). These are not local design decisions -- they define the crate boundary between cobre-sddp and cobre-io. Total pre-coding resolution effort: 2-3 days.

---

## 5. Phase 8 Assessment: cobre-cli (Lifecycle, Configuration, Exit Codes)

### 5.1 Spec Reading List Completeness

The Phase 8 reading list contains 5 specs:

| Listed Spec             | Covers                                                    | Sufficient? |
| ----------------------- | --------------------------------------------------------- | ----------- |
| CLI and Lifecycle       | Execution phases, exit codes, subcommands, config resolve | Yes         |
| Configuration Reference | All config.json fields, defaults, validation              | Yes         |
| Validation Architecture | 5-layer pipeline, 14 error kinds, validation report       | Yes         |
| SLURM Deployment        | Job scripts, scaling patterns, resource allocation        | Yes         |
| Structured Output       | JSON/JSON-lines envelopes, error records                  | Yes         |

**Missing from list**: None identified. The 5 specs cover the full cobre-cli scope.

**Verdict**: Complete.

### 5.2 Testable Intermediate Achievability

The Phase 8 testable intermediate specifies: "Full execution lifecycle: MPI initialization, command-line parsing, config resolution, rank-0 validation pipeline, data broadcast, training phase, simulation phase, finalization. Exit code scheme (0-5 + signal codes). `--validate-only` mode. Integration test: `mpiexec -n N cobre CASE_DIR` produces expected output directory structure with correct exit code."

| Capability                 | Spec Completeness (from report-007) | Achievable? | Notes                                                                                 |
| -------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| MPI initialization         | COMPLETE (SS5.2a)                   | Yes         | Ordering constraint documented; delegated to Hybrid Parallelism SS6                   |
| Command-line parsing       | PARTIAL (no clap struct)            | Yes         | All arguments and flags documented in tables; sufficient for implementation           |
| Config resolution          | PARTIAL (no `ResolvedConfig` type)  | Yes         | Two-level merge documented; field tables complete; struct derivable                   |
| Rank-0 validation pipeline | COMPLETE (SS5.2a)                   | Yes         | Produces `System` struct; delegated to Input Loading Pipeline SS8.1                   |
| rkyv broadcast             | COMPLETE (SS5.2a)                   | Yes         | Two-step protocol (size then contents) fully specified                                |
| Training invocation        | COMPLETE (SS5.2a)                   | Yes         | Delegated to Training Loop SS2.1; `train` function exists in training loop spec       |
| Simulation invocation      | COMPLETE (SS5.2a)                   | Yes         | Delegated to Simulation Architecture SS1                                              |
| Output writing             | PARTIAL (GAP-020 affects API)       | Conditional | Documented as Finalize phase; depends on GAP-020 resolution in Phase 7                |
| Exit code scheme           | COMPLETE (SS4)                      | Yes         | All 8 codes documented; per-subcommand mapping partially incomplete (F-006)           |
| `--validate-only` mode     | COMPLETE (SS5.3)                    | Yes         | Behavior fully specified with exit code mapping                                       |
| MPI finalize               | COMPLETE (SS5.2a)                   | Yes         | Ordering constraint documented; last MPI operation                                    |
| Signal handling            | PARTIAL (no Rust type)              | Yes         | Graceful shutdown protocol described; `AtomicBool` flag sufficient                    |
| Integration test           | Depends on above                    | Conditional | Requires Phases 6-7 to be functional; output verification requires GAP-020 resolution |

**Assessment**: 10 of 13 capabilities are achievable without pre-coding spec work for Phase 8 itself. The 3 conditional items all depend on Phase 7 completion (particularly GAP-020). Phase 8 has no _new_ spec gaps beyond what Phase 7 must already resolve.

### 5.3 Gap Impact on Phase

| Gap ID  | Classification       | Impact on Phase 8                                                                                                                          |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-027 | Resolve-During-Phase | `training.forward_passes` default. Mark as required in config parser. Affects cobre-cli's config validation, not cobre-cli's architecture. |
| GAP-035 | Resolve-After-MVP    | Example config uses non-minimal defaults. Documentation fix only.                                                                          |

Phase 8 has no Resolve-Before-Coding gaps of its own. Its blockers are all inherited from Phase 7 (GAP-020).

### 5.4 Implicit Knowledge Gaps

1. **SLURM invocation pattern mismatch** (F-003, F-012 in report-007): All five SLURM job scripts use `cobre train --config /path/to/config.json`, which contradicts the canonical CLI spec (`cobre run /path/to/case_directory` or bare `cobre /path/to/case_directory`). The `train` subcommand does not exist. The `--config` flag does not exist. This must be reconciled before Phase 8 to avoid building the wrong CLI interface.

2. **Config field name inconsistency** (F-010 in report-007): Three different names for the same parameter (`forward_passes`, `num_forward_passes`, `forward_scenarios`) across four spec files. The canonical name (`training.forward_passes` from configuration-reference.md) must be standardized before the config parser is implemented.

3. **`training.enabled` undefined** (F-007 in report-007): The conditional execution logic (SS5.3) depends on `training.enabled`, but this field has no schema definition, no default value, and no validation rules. A one-line addition to configuration-reference.md is needed.

4. **Event subscription mechanism** (F-002 in report-007, GAP-032): How does `main()` register as a consumer of `TrainingEvent`? The channel type (`broadcast::Sender` vs `std::sync::mpsc`) is unspecified. This is Resolve-During-Phase but the implementer needs to make this choice early in Phase 8.

### 5.5 Cross-Phase Dependency Risks

Phase 8 depends on Phases 6 and 7. The primary risk is **MPI lifecycle documentation sufficiency**: cobre-cli orchestrates the entire MPI lifecycle from `create_communicator()` (first operation) to `MPI_Finalize` (last operation).

**MPI lifecycle docs assessment**: The Phase-Training Loop alignment table in cli-and-lifecycle.md SS5.2a provides 16 rows covering all lifecycle operations with authoritative spec cross-references and ordering constraints. The 4 key invariants (MPI-first, rank-0 validation before broadcast, workspaces before training, scenarios before training) are explicitly stated. The SLURM deployment spec adds resource allocation patterns (nodes, tasks-per-node, cpus-per-task to MPI ranks and OpenMP threads mapping).

**Sufficiency determination**: The MPI lifecycle is sufficiently documented for implementation. The ordering constraints are explicit. The one gap is the _formal_ precondition/postcondition table per phase (F-002 in report-007, Medium severity), which is a documentation convenience rather than a missing specification. The alignment table contains all the information an implementer needs.

**Verdict**: **CONDITIONALLY READY**. Phase 8's own spec coverage is strong (23 COMPLETE, 11 PARTIAL, 0 MISSING per report-007). The conditions are: (1) resolve the SLURM invocation pattern mismatch (F-003/F-012) before Phase 8 coding, (2) standardize the config field name for forward passes (F-010), (3) add `training.enabled` to configuration-reference.md (F-007). Estimated effort: 1 day for all three. Phase 8 also inherits the Phase 7 precondition that GAP-020 must be resolved.

---

## 6. Simulation Pipeline Deep-Dive

Report-005 Subsystem F (Simulation Pipeline) has 33% PARTIAL+MISSING items, exceeding the 30% audit threshold. This section enumerates each capability from report-005 Subsystem F.

### 6.1 Per-Capability Status

| #   | Capability                                      | Report-005 Status | Spec Source                        | Assessment                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Simulation overview and architecture diagram    | COMPLETE          | `simulation-architecture.md` SS1   | Architecture diagram, config table, and relationship to training documented. No action needed.                                                                                                                                              |
| 2   | Simulation configuration parameters             | COMPLETE          | `simulation-architecture.md` SS1.1 | 4 parameters (enabled, n_scenarios, sampling scheme, output detail) fully specified with types and defaults.                                                                                                                                |
| 3   | Policy compatibility validation                 | PARTIAL           | `simulation-architecture.md` SS2   | 8-row validation check table provided (block mode, hydro count, AR orders, cascade topology, etc.). Full algorithm deferred to `deferred.md` SSC.9. For the minimal viable solver (no external warm-start), the inline table is sufficient. |
| 4   | Scenario distribution across MPI ranks          | COMPLETE          | `simulation-architecture.md` SS3.1 | Same two-level (MPI rank + thread) distribution as training. Contiguous block assignment formula reusable from Phase 6.                                                                                                                     |
| 5   | Per-scenario forward pass (4-step sequence)     | COMPLETE          | `simulation-architecture.md` SS3.2 | Initialize, stage loop, compute total cost, stream results. Each step documented with behavior and data dependencies.                                                                                                                       |
| 6   | Memory management (streaming release)           | COMPLETE          | `simulation-architecture.md` SS3.3 | Streaming release pattern: per-stage results streamed to I/O thread, stage buffers released after streaming. Documented.                                                                                                                    |
| 7   | Cost statistics computation                     | COMPLETE          | `simulation-architecture.md` SS4.1 | Mean, standard deviation, min/max, CVaR at configurable $\alpha$ levels. Formulas provided.                                                                                                                                                 |
| 8   | MPI aggregation for simulation results          | COMPLETE          | `simulation-architecture.md` SS4.4 | `MPI_Allreduce` for min/max, `MPI_Gatherv` for individual costs to rank 0 for final statistics. Documented.                                                                                                                                 |
| 9   | Output streaming (bounded channel + I/O thread) | COMPLETE          | `simulation-architecture.md` SS6   | Bounded channel between simulation threads and background I/O thread. Three detail levels (summary, standard, detailed). Distributed output (each rank writes its partition). Documented.                                                   |
| 10  | `SimulationScenarioResult` type                 | **MISSING**       | -- (GAP-030)                       | No concrete per-scenario result type defined. The streaming architecture assumes a typed payload flows from simulation threads to the I/O thread, but the type is absent. This is the payload carried by the bounded channel.               |
| 11  | Simulation orchestrator function signature      | **MISSING**       | -- (F-012 in report-005)           | No `fn simulate<C, S>(...)` signature. The algorithm is clear from SS3, but the parameter list (communicator, system, frozen FCF, config, writer) is not formalized.                                                                        |
| 12  | Policy compatibility validation algorithm       | **MISSING**       | deferred.md SSC.9                  | Full validation algorithm deferred. For the minimal viable solver (training and simulation in same binary, no external policy import), the 8-row inline table is sufficient. This is a post-MVP item.                                       |

### 6.2 Status Summary

| Status   | Count | Items                                                            |
| -------- | ----- | ---------------------------------------------------------------- |
| COMPLETE | 8     | #1, #2, #4, #5, #6, #7, #8, #9                                   |
| PARTIAL  | 1     | #3 (policy compatibility -- checks listed, algo deferred)        |
| MISSING  | 3     | #10 (result type), #11 (orchestrator sig), #12 (validation algo) |

**PARTIAL+MISSING**: 4 of 12 = 33%, confirming report-005's threshold exceedance finding.

### 6.3 Impact Assessment

The 3 MISSING items have different urgency levels:

1. **`SimulationScenarioResult` (MISSING, High urgency)**: This type is the payload of the bounded channel between simulation threads and the I/O thread. It defines what per-scenario, per-stage data is captured and streamed. The streaming architecture (item #9, COMPLETE) is designed around this type but cannot be implemented without it. The type should contain at minimum: scenario ID, per-stage costs, per-stage state vectors, and optionally per-entity generation/flow/storage values depending on the output detail level.

2. **Simulation orchestrator signature (MISSING, High urgency)**: The entry point that cobre-cli calls to start the simulation phase. Without this, cobre-cli cannot delegate to cobre-sddp for simulation. The signature should be: `fn simulate<C: Communicator + SharedMemoryProvider>(comm: &C, system: &System, fcf: &Fcf, config: &SimulationConfig, writer: &mut dyn SimulationWriter) -> Result<SimulationSummary, SimulationError>` (or similar).

3. **Policy compatibility validation algorithm (MISSING, Low urgency)**: Deferred to post-MVP. The 8-row inline check table is sufficient for the minimal viable solver where training and simulation run in the same binary with the same system.

### 6.4 Resolution Path

Items #10 and #11 should be resolved as part of the GAP-020 resolution (2-3 days total for all Phase 7 pre-coding work). Specifically:

- Define `SimulationScenarioResult` with per-stage cost, state vector, and optional detailed outputs. The detail levels (summary/standard/detailed) from item #9 suggest a tiered struct or enum.
- Define `fn simulate(...)` signature with parameters for communicator, system, frozen FCF, simulation config, and output writer.
- Both should be added to `simulation-architecture.md` alongside the existing algorithmic description.

Item #12 (policy compatibility validation algorithm) can remain deferred per report-009's Resolve-After-MVP classification.

---

## 7. Cross-Phase Summary Table

| Phase | Crate(s)                    | Verdict             | Resolve-Before-Coding Gaps                                                                                  | Resolve-During-Phase Gaps                                                       | Effort to Ready | Resolution Timing                    |
| ----- | --------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------- | ------------------------------------ |
| 5     | cobre-stochastic            | CONDITIONALLY READY | GAP-023 (opening tree type)                                                                                 | GAP-022 (PrecomputedPar struct)                                                 | 1-2 days        | Before Phase 5 start                 |
| 6     | cobre-sddp (training)       | READY               | None                                                                                                        | GAP-018, GAP-019, GAP-024, GAP-026, GAP-027, GAP-030, GAP-032, GAP-033, GAP-034 | 0 days          | N/A -- resolve inline during coding  |
| 7     | cobre-sddp (sim) + cobre-io | NOT READY           | GAP-020 (output writer API), F-012 (simulation orchestrator sig), GAP-030 (`SimulationScenarioResult` type) | GAP-028 (policy compat validation)                                              | 2-3 days        | Before Phase 7 start; during Phase 6 |
| 8     | cobre-cli                   | CONDITIONALLY READY | None (inherits Phase 7 precondition)                                                                        | GAP-027, GAP-035, F-003/F-007/F-010/F-012 (cross-spec fixes)                    | 1 day           | Before Phase 8 start                 |

**Total pre-coding effort across Phases 5-8**: 4-6 working days (GAP-023: 1-2 days, GAP-020 + simulation types: 2-3 days, CLI cross-spec fixes: 1 day).

---

## 8. Pre-Coding Conditions Inventory

This section consolidates all pre-coding conditions for Phases 5-8 with resolution timing aligned to the phase dependency graph.

### 8.1 Conditions Ordered by Resolution Deadline

| #   | Condition                                                                                                                                                                        | Phase Blocked | Classification        | Effort         | Earliest Resolution   | Latest Resolution    | Dependencies                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------- | -------------- | --------------------- | -------------------- | ------------------------------------------------------------------------------ |
| 1   | GAP-023: Define `OpeningTree` Rust type with ownership model (`Arc` vs `SharedRegion`) and accessor methods                                                                      | 5             | Resolve-Before-Coding | 1-2 days       | Immediately           | Before Phase 5 start | Requires SharedMemoryProvider trait reading (Phase 4 spec, not Phase 4 coding) |
| 2   | GAP-020: Define output writer API -- `SimulationWriter` type/trait, training writer, manifest writer, metadata writer, dictionary writer, error types, Parquet library selection | 7             | Resolve-Before-Coding | 2-3 days       | During Phase 6 coding | Before Phase 7 start | Requires simulation result type (#3) to be defined first                       |
| 3   | Define `SimulationScenarioResult` type and `fn simulate(...)` orchestrator signature in `simulation-architecture.md`                                                             | 7             | Resolve-Before-Coding | Included in #2 | During Phase 6 coding | Before Phase 7 start | Requires understanding of training `TrajectoryRecord` from Phase 6             |
| 4   | Reconcile SLURM invocation patterns: replace `cobre train --config` with `cobre run /path/to/case_dir` in slurm-deployment.md (F-003, F-012)                                     | 8             | Cross-spec fix        | 0.5 day        | Immediately           | Before Phase 8 start | None                                                                           |
| 5   | Standardize config field name: `training.forward_passes` as canonical, update 3 other specs (F-010)                                                                              | 8             | Cross-spec fix        | 0.25 day       | Immediately           | Before Phase 8 start | None                                                                           |
| 6   | Add `training.enabled` to configuration-reference.md with type `bool`, default `true` (F-007)                                                                                    | 8             | Cross-spec fix        | 0.1 day        | Immediately           | Before Phase 8 start | None                                                                           |
| 7   | Fix notation drift: `training-loop.md` SS7.1 `\pi^a` -> `\pi^{lag}`, `cut-management.md` `p_h` -> `P_h`                                                                          | 6             | Notation fix          | 0.1 day        | Immediately           | Before Phase 6 start | None                                                                           |

### 8.2 Resolution Scheduling

Given the phase dependency graph (Phase 5 can parallel Phases 3-4; Phase 6 depends on all of 1-5; Phase 7 depends on 6; Phase 8 depends on 6-7):

**Batch 1 (resolve immediately, before any Phase 5-8 coding)**:

- Condition #1 (GAP-023): Required before Phase 5 start. Can be resolved now since it only requires reading the SharedMemoryProvider spec, not waiting for Phase 4 coding.
- Conditions #4, #5, #6 (cross-spec fixes): Mechanical fixes with no dependencies. Total: ~1 day.
- Condition #7 (notation fix): 15-minute spec edit.

**Batch 2 (resolve during Phase 6 coding, before Phase 7 start)**:

- Conditions #2 and #3 (GAP-020 + simulation types): Best resolved after Phase 6 coding has established the training pipeline patterns. The simulation pipeline mirrors the training pipeline for forward passes, so the training implementation informs the simulation API design.

**Total pre-coding calendar**: 1-2 days for Batch 1 (parallelizable with Phases 3-4), then 2-3 days for Batch 2 (during Phase 6, before Phase 7). No pre-coding condition blocks Phases 1-4.
