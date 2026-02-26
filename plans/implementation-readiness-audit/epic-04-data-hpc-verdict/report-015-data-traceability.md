# Report 015 -- Data Model End-to-End Traceability

**Date**: 2026-02-26
**Scope**: 8 data format chains (4 input, 4 output) traced from source to sink
**Inputs**: 10 data model specs (`src/specs/data-model/*.md`), 3 architecture specs (`input-loading-pipeline.md`, `simulation-architecture.md`, `validation-architecture.md`), prior audit reports (001, 002, 013)
**Method**: Per-chain tracing from schema spec through pipeline function to in-memory/on-disk representation, with verdict assignment from {COMPLETE, SCHEMA ONLY, PARTIAL, MISSING}

---

## 1. Executive Summary

Of the 8 data format chains traced, 3 are COMPLETE, 2 are PARTIAL, and 3 are SCHEMA ONLY. All 4 input chains have at least one fully specified link (schema + pipeline), while all 4 output chains suffer from the same systemic gap: output schemas are fully defined but no Rust writer types or function signatures exist anywhere in the spec corpus. The single most important finding is that the output side of the data model -- chains 5 through 8 -- is uniformly blocked by GAP-020 (output writer API absence), confirming the Phase 7 NOT READY verdict from report-013. The input side is in substantially better shape: the `load_case` function signature (SS8.1 of `input-loading-pipeline.md`) anchors 3 of the 4 input chains, with the FlatBuffers policy loading chain being the only input chain with a partial pipeline specification. No new gap identifiers are introduced; all findings map to existing GAP-020, GAP-023, or GAP-030.

---

## 2. Input Chain Assessments

### 2.1 Chain 1: JSON Entity Registries -> Loading Pipeline -> In-Memory Entity Collections

**Direction**: Input
**Data**: 7 entity registries (buses, lines, hydros, thermals, pumping stations, energy contracts, non-controllable sources)

| Link           | Source                                             | Section                     | Status  |
| -------------- | -------------------------------------------------- | --------------------------- | ------- |
| Schema         | `src/specs/data-model/input-system-entities.md`    | SS1--7                      | Defined |
| Pipeline       | `src/specs/architecture/input-loading-pipeline.md` | SS2.2 (loading order 5--11) | Defined |
| In-memory type | `src/specs/data-model/internal-structures.md`      | SS1.2--1.3, SS2--9          | Defined |

**Trace**:

1. **Schema**: Each of the 7 entity registries has a fully specified JSON schema in `input-system-entities.md`. Bus (SS1) defines deficit segments, excess cost; Line (SS2) defines source/target bus, capacity, losses; Hydro (SS3) defines the most complex schema with reservoir, generation model, cascade, lifecycle, filling; Thermal (SS4) defines cost curve segments and GNL; Pumping Station (SS5) defines source/destination hydro, power consumption; Energy Contract (SS6) defines import/export type, price, limits; Non-Controllable Source (SS7) defines installed capacity and availability.

2. **Pipeline**: `input-loading-pipeline.md` SS2.2 specifies the exact loading order (buses first at order 5, then lines at 6, hydros at 7, thermals at 8, NCS at 9, pumping at 10, contracts at 11). Each file has documented dependencies (e.g., lines depend on buses for source/target bus validation) and per-file validation rules. The pipeline entry point `load_case(path: &Path) -> Result<System, LoadError>` is fully specified in SS8.1.

3. **In-memory type**: `internal-structures.md` SS1.3 provides the `System` struct with `Vec<Bus>`, `Vec<Hydro>`, etc. in Rust code. Entity collection accessors (SS1.4) and lookup methods are specified with full Rust signatures. However, per report-001, the individual entity struct definitions (Bus, Line, Hydro, etc.) are PARTIAL -- fields are listed by name and semantics in SS2--9, but no Rust struct definitions with concrete types exist for any entity other than `System` itself.

**Verdict**: **COMPLETE**

The chain is fully traceable: JSON schema -> `load_case` pipeline with dependency ordering -> `System` struct containing typed entity vectors. The individual entity struct definitions being PARTIAL (fields listed but no Rust struct) does not break the chain because the behavioral contract is complete -- the field names, types (from JSON schema), semantics, and target container structure (`Vec<EntityType>`) are all documented. An implementer can derive the Rust structs from the schema and internal-structures descriptions without ambiguity.

---

### 2.2 Chain 2: JSON Configuration Files -> Loading Pipeline -> In-Memory Resolved Structures

**Direction**: Input
**Data**: `config.json`, `stages.json`, `penalties.json`, `initial_conditions.json`

| Link                                | Source                                              | Section                    | Status  |
| ----------------------------------- | --------------------------------------------------- | -------------------------- | ------- |
| Schema (config)                     | `src/specs/data-model/input-directory-structure.md` | SS2                        | Defined |
| Schema (stages)                     | `src/specs/data-model/input-scenarios.md`           | SS1                        | Defined |
| Schema (penalties)                  | `src/specs/data-model/penalty-system.md`            | SS3                        | Defined |
| Schema (initial_conditions)         | `src/specs/data-model/input-constraints.md`         | SS1                        | Defined |
| Pipeline                            | `src/specs/architecture/input-loading-pipeline.md`  | SS2.1 (loading order 1--4) | Defined |
| In-memory type (stages)             | `src/specs/data-model/internal-structures.md`       | SS12                       | Defined |
| In-memory type (penalties)          | `src/specs/data-model/internal-structures.md`       | SS10                       | Defined |
| In-memory type (bounds)             | `src/specs/data-model/internal-structures.md`       | SS11                       | Defined |
| In-memory type (initial_conditions) | `src/specs/data-model/internal-structures.md`       | SS16                       | Defined |

**Trace**:

1. **Schema**: All 4 root-level JSON files have fully specified schemas. `config.json` in `input-directory-structure.md` SS2 includes full examples (minimal and complete), section-by-section field tables, and validation rules. `stages.json` in `input-scenarios.md` SS1 covers season definitions, policy graph, blocks, state variables, risk measures, and sampling methods. `penalties.json` in `penalty-system.md` SS3 defines the three-tier cascade with JSON example. `initial_conditions.json` in `input-constraints.md` SS1 defines storage and filling_storage arrays with validation rules.

2. **Pipeline**: `input-loading-pipeline.md` SS2.1 specifies loading order 1--4: config first (no dependencies), stages second (depends on config), penalties third (no dependencies), initial_conditions fourth (array lengths deferred until entity registries loaded). The pipeline function `load_case` (SS8.1) encompasses all four files.

3. **In-memory type**: `internal-structures.md` documents the resolved targets: stages and blocks in SS12 with all fields (id, dates, blocks, block_mode, state_variables, risk_measure, num_scenarios, sampling_method); policy graph in SS12 with type, discount rate, transitions; pre-resolved penalties in SS10 with per-entity-type penalty tables and priority ordering; pre-resolved bounds in SS11 with per-(entity, stage) resolution; initial conditions in SS16. The `System` struct (SS1.3) contains `stages: Vec<Stage>`, `policy_graph: PolicyGraph`, `penalties: ResolvedPenalties`, `bounds: ResolvedBounds`, and `initial_conditions: InitialConditions`.

**Verdict**: **COMPLETE**

All three links (schema, pipeline, in-memory type) are present for all 4 configuration files. The configuration files are the most thoroughly specified input chain in the entire data model.

---

### 2.3 Chain 3: Parquet Scenario Files -> Loading Pipeline -> In-Memory Scenario Structures

**Direction**: Input
**Data**: PAR parameters (`inflow_seasonal_stats.parquet`, `inflow_ar_coefficients.parquet`), correlation matrices (`correlation.json`), hydro geometry (`hydro_geometry.parquet`), FPHA hyperplanes (`fpha_hyperplanes.parquet`)

| Link                         | Source                                             | Section                           | Status  |
| ---------------------------- | -------------------------------------------------- | --------------------------------- | ------- |
| Schema (seasonal stats)      | `src/specs/data-model/input-scenarios.md`          | SS3.1                             | Defined |
| Schema (AR coefficients)     | `src/specs/data-model/input-scenarios.md`          | SS3.2                             | Defined |
| Schema (correlation)         | `src/specs/data-model/input-scenarios.md`          | SS5                               | Defined |
| Schema (geometry)            | `src/specs/data-model/input-hydro-extensions.md`   | SS1                               | Defined |
| Schema (FPHA)                | `src/specs/data-model/input-hydro-extensions.md`   | SS3                               | Defined |
| Pipeline                     | `src/specs/architecture/input-loading-pipeline.md` | SS2.3--2.4 (loading order 12--21) | Defined |
| In-memory type (PAR models)  | `src/specs/data-model/internal-structures.md`      | SS14                              | Defined |
| In-memory type (correlation) | `src/specs/data-model/internal-structures.md`      | SS14                              | Defined |

**Trace**:

1. **Schema**: All Parquet column schemas are fully specified with column names, types, and validation rules. `inflow_seasonal_stats.parquet` has 5 columns (hydro_id, stage_id, mean_m3s, std_m3s, ar_order). `inflow_ar_coefficients.parquet` has 4 columns (hydro_id, stage_id, lag, coefficient). `correlation.json` defines a profile-based system with named profiles, correlation groups, matrices, and optional schedule. `hydro_geometry.parquet` has 4 columns (hydro_id, volume_hm3, height_m, area_km2). `fpha_hyperplanes.parquet` has 10+ columns covering plane coefficients and validity ranges.

2. **Pipeline**: `input-loading-pipeline.md` SS2.3 specifies extension data loading (order 12--14: geometry, production models, FPHA) and SS2.4 specifies scenario data loading (order 15--21: seasonal stats, AR coefficients, history, load stats, load factors, correlation, external scenarios). Each file has documented dependencies and conditional loading rules (SS4).

3. **In-memory type**: `internal-structures.md` SS14 (Scenario Pipeline) documents the target: per-(hydro, stage) inflow models with mean, std, AR order, and coefficient list; per-(bus, stage) load statistics; named correlation profiles with Cholesky-decomposed matrices and stage-to-profile mapping. The `System` struct contains `par_models: Vec<ParModel>` and `correlation: CorrelationModel`.

**Verdict**: **COMPLETE**

All links are present. The scenario pipeline flexibility table in `input-scenarios.md` SS2.2 documents 9 combinations of user-provided vs. derived components, ensuring the pipeline handles all valid file presence/absence patterns. The in-memory targets are specified at the semantic level (field names, types, sources) within `internal-structures.md` SS14. An implementer can derive Rust types from the documented contracts.

---

### 2.4 Chain 4: FlatBuffers Policy Files -> Loading Pipeline -> In-Memory Cut Pool

**Direction**: Input
**Data**: Policy cuts (`policy/cuts/stage_NNN.bin`), states (`policy/states/stage_NNN.bin`), vertices (`policy/vertices/stage_NNN.bin`), basis (`policy/basis/stage_NNN.bin`), metadata (`policy/metadata.json`), state dictionary (`policy/state_dictionary.json`)

| Link                             | Source                                             | Section | Status  |
| -------------------------------- | -------------------------------------------------- | ------- | ------- |
| Schema (FlatBuffers)             | `src/specs/data-model/binary-formats.md`           | SS3.1   | Defined |
| Schema (metadata/dictionary)     | `src/specs/data-model/input-constraints.md`        | SS4     | Defined |
| Directory structure              | `src/specs/data-model/binary-formats.md`           | SS3.2   | Defined |
| Pipeline (parallel load)         | `src/specs/architecture/input-loading-pipeline.md` | SS7     | Partial |
| Pipeline (deserialization fn)    | --                                                 | --      | Missing |
| In-memory type (cut pool layout) | `src/specs/data-model/binary-formats.md`           | SS3.4   | Defined |
| In-memory type (cut pool struct) | `src/specs/data-model/internal-structures.md`      | --      | Absent  |

**Trace**:

1. **Schema**: The FlatBuffers `.fbs` schema in `binary-formats.md` SS3.1 is fully specified. It defines `BendersCut` (10 fields including slot_index, intercept, dense coefficient vector), `StageCuts` (7 fields including active_cut_indices and populated_count), `VisitedState`, `StageStates`, `Vertex`, `StageVertices`, `StageBasis`, and `PolicyMetadata`. The policy directory structure (SS3.2) and encoding guidelines (SS3.3) are complete. Report-002 confirmed all 8 FlatBuffers table definitions as COMPLETE.

2. **Pipeline**: `input-loading-pipeline.md` SS7 documents the parallel policy loading protocol: (a) rank 0 broadcasts metadata and state dictionary, (b) all ranks validate dictionary against current system, (c) stages assigned round-robin, (d) exchange via MPI_Allgatherv. However, **no function signature** is provided for the loading entry point. Report-002 classified parallel policy loading as PARTIAL (protocol documented, no function signature). Additionally, no Rust deserialization function signature exists for converting FlatBuffers binary to in-memory cut pool structures (report-002, SS1.2: FlatBuffers deserialization is MISSING).

3. **In-memory type**: `binary-formats.md` SS3.4 specifies the cut pool memory layout requirements in detail: contiguous dense coefficient arrays, intercepts separated from coefficients, 64-byte cache-line alignment, O(1) indexing of active cuts. These are performance requirements on the layout. However, `internal-structures.md` does not define a `StageCutPool` or `CutPool` struct -- this is documented as a Phase 6 Resolve-During-Phase gap. The gap is explicitly noted in report-013 section 3.2 as having "no `StageCutPool` struct" but being achievable because "Pre-allocation formula, activity tracking, Level-1 algorithm all specified."

**Verdict**: **PARTIAL**

The schema link is fully specified (FlatBuffers `.fbs` complete). The pipeline link is partial -- the 4-step protocol is documented but no function signature exists for the deserialization entry point. The in-memory target link is partial -- layout requirements are specified but no Rust struct definition exists for the cut pool. The chain is traceable at the behavioral/semantic level but missing the function signatures and struct definitions that would make it implementable without design decisions.

---

## 3. Output Chain Assessments

### 3.1 Chain 5: Simulation Results -> Streaming Channel -> Parquet Per-Entity Schemas

**Direction**: Output
**Data**: Per-scenario simulation results for 11 entity types (costs, hydros, thermals, exchanges, buses, pumping stations, contracts, non-controllables, batteries, inflow lags, generic violations)

| Link                             | Source                                              | Section     | Status            |
| -------------------------------- | --------------------------------------------------- | ----------- | ----------------- |
| In-memory source (result type)   | --                                                  | --          | Missing (GAP-030) |
| Writer pipeline (streaming arch) | `src/specs/architecture/simulation-architecture.md` | SS6         | Behavioral only   |
| Writer function signature        | --                                                  | --          | Missing (GAP-020) |
| On-disk schema (Parquet columns) | `src/specs/data-model/output-schemas.md`            | SS5.1--5.11 | Defined           |
| On-disk infrastructure           | `src/specs/data-model/output-infrastructure.md`     | SS3         | Defined           |

**Trace**:

1. **In-memory source**: The per-scenario result type (`SimulationScenarioResult` or equivalent) is **not defined** anywhere in the spec corpus. Report-005 identified this as finding F-013 and report-013 section 4.2 confirmed it as GAP-030: "no per-scenario result type for the streaming payload." The simulation architecture (SS3.2) describes the per-scenario forward pass and its 4-step per-stage sequence (realize uncertainties, build LP, solve, extract results), but the result extraction step says only "Record stage-level outputs" without defining the container type.

2. **Writer pipeline**: `simulation-architecture.md` SS6.1 describes the streaming architecture: bounded channel connecting simulation threads to a background I/O thread, with backpressure. SS6.2 defines three output detail levels (summary, stage-level, full). SS6.3 describes distributed output with Hive partitioning. However, no Rust type for the writer exists -- no trait, no concrete type, no `write_scenario_result` method signature. Report-002 SS1.1 classified the simulation Parquet writer as MISSING. Report-002 SS1.2 classified the simulation output writer function as MISSING.

3. **On-disk schema**: `output-schemas.md` SS5 provides fully specified Parquet column schemas for all 11 entity types. Each schema table lists column name, Arrow type, nullability, and description. The Hive partitioning scheme (`scenario_id=XXXX/data.parquet`) is documented in `output-infrastructure.md` SS3.1. Parquet configuration (Zstd compression, row group size, dictionary encoding) is specified in `binary-formats.md` SS5.

**Verdict**: **SCHEMA ONLY**

The on-disk Parquet schemas are fully defined (11 entity types with complete column specifications), and the streaming architecture is described behaviorally. However, two critical links are missing: (a) the in-memory source type (`SimulationScenarioResult`, GAP-030) and (b) the writer function/trait (GAP-020). Without these, the chain cannot be implemented -- there is no type to serialize and no function to call. This is consistent with the Phase 7 NOT READY verdict in report-013 section 4.5.

**Cross-reference**: Report-013 section 4.4 identifies 9 specific MISSING API elements that constitute GAP-020, including the simulation Parquet writer type, training Parquet writer type, manifest writer, metadata writer, dictionary writer, FlatBuffers serialization function, output writing error type, serde derives, and Parquet library selection.

---

### 3.2 Chain 6: Training Convergence/Timing -> Writer -> Parquet Training Schemas

**Direction**: Output
**Data**: Convergence log (`convergence.parquet`), iteration timing (`timing/iterations.parquet`), MPI rank timing (`timing/mpi_ranks.parquet`)

| Link                                | Source                                          | Section    | Status            |
| ----------------------------------- | ----------------------------------------------- | ---------- | ----------------- |
| In-memory source (convergence data) | `src/specs/data-model/output-schemas.md`        | SS6.1      | Schema-derivable  |
| In-memory source (timing data)      | `src/specs/data-model/output-schemas.md`        | SS6.2--6.3 | Schema-derivable  |
| Writer function signature           | --                                              | --         | Missing (GAP-020) |
| On-disk schema (convergence)        | `src/specs/data-model/output-schemas.md`        | SS6.1      | Defined           |
| On-disk schema (iteration timing)   | `src/specs/data-model/output-schemas.md`        | SS6.2      | Defined           |
| On-disk schema (MPI rank timing)    | `src/specs/data-model/output-schemas.md`        | SS6.3      | Defined           |
| Manifest                            | `src/specs/data-model/output-infrastructure.md` | SS1.2      | Defined           |

**Trace**:

1. **In-memory source**: The convergence log columns (iteration, lower_bound, upper_bound_mean, gap_percent, cuts_added, etc.) are fully specified in `output-schemas.md` SS6.1. The iteration timing columns (forward_solve_ms, backward_solve_ms, etc.) are specified in SS6.2. The MPI rank timing columns are specified in SS6.3. The in-memory source types are derivable from these column definitions -- each row of each Parquet file corresponds to a record that the training loop produces. However, no explicit Rust struct for the convergence record or timing record is defined.

2. **Writer function**: No training output writer type or function signature exists anywhere in the spec corpus. Report-002 SS1.2 classified the training output writer as MISSING. The training manifest (SS1.2 of `output-infrastructure.md`) is a JSON schema with no writer function.

3. **On-disk schema**: All 3 training Parquet schemas are fully specified with column names, types, nullability, and semantics. The convergence log has 14 columns with detailed notes on upper bound mechanisms and gap computation. The iteration timing has 10 columns. The MPI rank timing has 8 columns. Row counts are documented (num_iterations for convergence/timing, num_iterations x num_ranks for MPI).

**Verdict**: **SCHEMA ONLY**

The on-disk schemas are fully specified. The in-memory source records are derivable from the schemas. The missing link is the writer function/type (GAP-020) -- there is no Rust type for writing convergence rows, timing rows, or the training manifest to disk.

---

### 3.3 Chain 7: In-Memory Cut Pool -> FlatBuffers Serialization -> Policy Checkpoint Files

**Direction**: Output
**Data**: Cut pool serialized to `policy/cuts/stage_NNN.bin`, states to `policy/states/stage_NNN.bin`, vertices to `policy/vertices/stage_NNN.bin`, basis to `policy/basis/stage_NNN.bin`

| Link                               | Source                                   | Section | Status                                |
| ---------------------------------- | ---------------------------------------- | ------- | ------------------------------------- |
| In-memory source (cut pool layout) | `src/specs/data-model/binary-formats.md` | SS3.4   | Defined (layout requirements)         |
| In-memory source (cut pool struct) | --                                       | --      | Absent (Phase 6 Resolve-During-Phase) |
| Serialization function             | --                                       | --      | Missing (GAP-020)                     |
| On-disk schema (FlatBuffers)       | `src/specs/data-model/binary-formats.md` | SS3.1   | Defined                               |
| On-disk directory structure        | `src/specs/data-model/binary-formats.md` | SS3.2   | Defined                               |
| Checkpoint trigger/protocol        | `src/specs/data-model/binary-formats.md` | SS4     | Defined                               |

**Trace**:

1. **In-memory source**: `binary-formats.md` SS3.4 specifies the cut pool memory layout requirements (contiguous dense `[double]` arrays, intercepts separated, 64-byte alignment, O(1) indexing). SS3.0 documents the runtime access pattern: the cut pool lives in memory shared across threads, is updated during backward pass, and periodically checkpointed to disk. SS4 documents checkpoint reproducibility requirements, execution modes (fresh/warm_start/resume), and cut pool sizing. The in-memory layout is specified at the requirements level but no Rust struct definition exists for `StageCutPool` or similar.

2. **Serialization function**: No Rust function signature for serializing a `StageCuts` to a `.bin` file exists. Report-002 SS1.2 classified FlatBuffers serialization as MISSING: "Schema fully specified. Checkpoint writes described conceptually ('fast serialization from in-memory cut pool to disk'). No Rust function signature for serializing a `StageCuts` to a `.bin` file." Similarly, no deserialization function signature exists. Both directions are part of GAP-020.

3. **On-disk schema**: The FlatBuffers `.fbs` schema is fully specified in SS3.1 (confirmed COMPLETE by report-002). The directory structure (SS3.2) and encoding guidelines (SS3.3) are complete. Compression options (uncompressed or Zstd) are documented.

**Verdict**: **PARTIAL**

The on-disk schema is complete (FlatBuffers `.fbs` with all tables defined). The in-memory source is specified at the layout-requirements level but lacks a Rust struct. The serialization function is missing (GAP-020). The chain is stronger than chains 5--6 because the FlatBuffers schema is a machine-readable contract that constrains the serialization code, and the checkpoint protocol (SS4) documents the complete behavioral requirements. An implementer must still design the serialization function signature and the in-memory struct.

---

### 3.4 Chain 8: Metadata/Manifest/Dictionaries -> JSON/CSV Writers -> Output Files

**Direction**: Output
**Data**: `training/metadata.json`, `simulation/_manifest.json`, `training/_manifest.json`, `training/dictionaries/codes.json`, `training/dictionaries/bounds.parquet`, `training/dictionaries/variables.csv`, `training/dictionaries/entities.csv`, `training/dictionaries/state_dictionary.json`

| Link                            | Source                                          | Section    | Status            |
| ------------------------------- | ----------------------------------------------- | ---------- | ----------------- |
| In-memory source (manifest)     | `src/specs/data-model/output-infrastructure.md` | SS1.1--1.2 | Schema-derivable  |
| In-memory source (metadata)     | `src/specs/data-model/output-infrastructure.md` | SS2        | Schema-derivable  |
| In-memory source (dictionaries) | `src/specs/data-model/output-schemas.md`        | SS3--4     | Schema-derivable  |
| Writer functions                | --                                              | --         | Missing (GAP-020) |
| On-disk schema (manifests)      | `src/specs/data-model/output-infrastructure.md` | SS1.1--1.2 | Defined           |
| On-disk schema (metadata)       | `src/specs/data-model/output-infrastructure.md` | SS2        | Defined           |
| On-disk schema (dictionaries)   | `src/specs/data-model/output-schemas.md`        | SS3--4     | Defined           |

**Trace**:

1. **In-memory source**: The manifest JSON schemas (`output-infrastructure.md` SS1.1--1.2) define all fields for simulation and training manifests including status, timestamps, scenario counts, checksum, and MPI info. The metadata JSON schema (SS2) defines 6 sections (run_info, configuration_snapshot, problem_dimensions, performance_summary, data_integrity, environment) with all fields documented. The dictionary schemas (`output-schemas.md` SS3--4) define categorical codes (5 code tables), bounds dictionary (6-column Parquet), variables metadata (6-column CSV), and entities metadata (5-column CSV). All in-memory source types are derivable from these schemas -- each JSON field or Parquet/CSV column maps to a Rust struct field.

2. **Writer functions**: No writer function signatures exist for any of the 8 output files in this chain. Report-002 SS1.2 classified manifest writer, metadata writer, and dictionary writer functions as MISSING (all part of GAP-020). The crash recovery protocol for manifests is documented (SS1.1 of `output-infrastructure.md`: check for `status: "running"`, read `partitions_written`, resume from incomplete), but no Rust function implements it.

3. **On-disk schema**: All schemas are fully specified. Manifest JSON schemas include examples with all fields. Metadata JSON schema includes a complete example. Dictionary schemas include column definitions and example data.

**Verdict**: **SCHEMA ONLY**

The on-disk schemas for all 8 files are fully specified, and the in-memory types are derivable from them. The missing link is the writer functions (GAP-020). This chain has the simplest serialization requirements (JSON and CSV are straightforward formats), making GAP-020 resolution for this chain lower effort than for the Parquet or FlatBuffers chains.

---

## 4. Chain Completeness Summary Table

| Chain ID | Direction | Source                           | Sink                                      | Verdict     | Blocking Gap IDs             |
| -------- | --------- | -------------------------------- | ----------------------------------------- | ----------- | ---------------------------- |
| 1        | Input     | JSON entity registries (7 files) | `System.{buses, hydros, ...}` collections | COMPLETE    | --                           |
| 2        | Input     | JSON config files (4 files)      | `System.{stages, penalties, bounds, ...}` | COMPLETE    | --                           |
| 3        | Input     | Parquet scenario/extension files | `System.{par_models, correlation}`        | COMPLETE    | --                           |
| 4        | Input     | FlatBuffers policy files         | In-memory cut pool                        | PARTIAL     | GAP-020 (deserialization fn) |
| 5        | Output    | Simulation scenario results      | Parquet per-entity Hive partitions        | SCHEMA ONLY | GAP-020, GAP-030             |
| 6        | Output    | Training convergence/timing      | Parquet training files                    | SCHEMA ONLY | GAP-020                      |
| 7        | Output    | In-memory cut pool               | FlatBuffers policy checkpoint files       | PARTIAL     | GAP-020                      |
| 8        | Output    | Metadata/manifest/dictionaries   | JSON/CSV/Parquet dictionary files         | SCHEMA ONLY | GAP-020                      |

---

## 5. Findings and Recommendations

### Finding 1: Output writer API is the single systemic gap across all output chains

**Gap**: GAP-020
**Affected chains**: 5, 6, 7, 8 (all 4 output chains)
**Severity**: Blocks Phase 7 implementation

All 4 output chains are blocked by the same root cause: the spec corpus documents output schemas in full detail (column definitions, Parquet configuration, directory structure, Hive partitioning, crash recovery protocols) but provides zero Rust types or function signatures for the writing side. Report-002 identified 9 specific missing API elements that constitute GAP-020:

1. Simulation Parquet writer type
2. Training Parquet writer type
3. Manifest writer function
4. Metadata writer function
5. Dictionary writer functions (4 files)
6. FlatBuffers serialization function
7. Output writing error type
8. serde Serialize derives for output types
9. Parquet library selection

**Resolution priority**: High. This is the single largest gap surface in the entire spec corpus and the root cause of the Phase 7 NOT READY verdict. Estimated resolution effort from report-013: 2--3 days.

### Finding 2: SimulationScenarioResult type absence breaks the simulation output chain

**Gap**: GAP-030
**Affected chains**: 5
**Severity**: Blocks the producer side of the simulation streaming architecture

The simulation result type (`SimulationScenarioResult` or equivalent) is absent from the spec corpus. This type serves as the payload sent through the bounded channel from simulation threads to the background I/O thread (`simulation-architecture.md` SS6.1). Without it:

- The simulation pipeline (cobre-sddp) cannot define what it produces
- The output writer (cobre-io) cannot define what it consumes
- The thread-safety bounds (`Send`) on the channel payload are unspecified
- The integration between cobre-sddp and cobre-io at the Phase 7 boundary is undefined

GAP-030 was originally classified in report-013 as Resolve-During-Phase for Phase 6 (where it applies to `TrajectoryRecord` for training), but for Phase 7 it represents a crate-boundary type that must be specified before coding. The epic-03 learnings specifically recommended that the data model end-to-end trace "verify that once `SimulationScenarioResult` is defined, it is consistent with `output-infrastructure.md` streaming architecture and `output-schemas.md` entity schemas."

**Resolution priority**: High. Must be resolved in conjunction with GAP-020.

### Finding 3: Input chains are substantially more complete than output chains

**Pattern observation**: All 4 input chains have COMPLETE or PARTIAL verdicts. All 4 output chains have SCHEMA ONLY or PARTIAL verdicts. The asymmetry is explained by the "document behavior first, formalize types later" authoring pattern identified in the epic-02 learnings:

- The input side has an anchoring function signature (`load_case`, specified in `input-loading-pipeline.md` SS8.1) with full Rust definition, error type, and responsibility boundary
- The output side has no equivalent anchoring function -- the behavioral contracts (streaming architecture, Hive partitioning, crash recovery) are documented but no API formalizes them

This suggests that specifying a single output-side function analogous to `load_case` -- for example, `fn create_output_context(...)` or a writer trait with initialization and write methods -- would cascade improvements across all 4 output chains simultaneously.

### Finding 4: FlatBuffers policy chain is the strongest output chain despite PARTIAL verdict

**Affected chains**: 4 (input), 7 (output)

The FlatBuffers policy chain (chains 4 and 7 combined) is the best-specified of the output chains because:

- The `.fbs` schema is machine-readable and fully verified (report-002: all 8 tables COMPLETE)
- The cut pool memory layout requirements are documented with performance rationale (`binary-formats.md` SS3.4)
- The checkpoint protocol specifies reproducibility requirements, execution modes, and sizing formulas (SS4)
- The directory structure is complete (SS3.2)

The remaining gaps are the serialization/deserialization function signatures and the in-memory cut pool Rust struct -- both of which are constrained by the existing specifications. This chain can be resolved with less design ambiguity than chains 5--6.

### Finding 5: No new gap identifiers needed

All findings map to existing gap IDs:

| Finding                                             | Gap ID  | Original source                               |
| --------------------------------------------------- | ------- | --------------------------------------------- |
| Output writer API absence                           | GAP-020 | Report-002 (cobre-io), report-013 section 4.4 |
| Opening tree type (referenced in scenario chain)    | GAP-023 | Report-013 section 2.3                        |
| SimulationScenarioResult / TrajectoryRecord absence | GAP-030 | Report-013 section 4.2                        |

No duplicate identifiers were created by this tracing exercise.
