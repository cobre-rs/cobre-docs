# Report 002 -- cobre-io API Surface Completeness Audit

**Crate**: cobre-io
**Phase**: 2 (I/O Layer)
**Auditor**: data-model-format-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name                                                                                                     | Category          | Spec File                                                    | Section      | Status   | Notes                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------ | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoadError`                                                                                                   | Enum              | `input-loading-pipeline.md`                                  | SS8.1        | COMPLETE | Full Rust enum with 5 variants, all fields typed, derives specified (`Debug`, `thiserror::Error`), phase mapping table provided                                                                                                 |
| Config (parsed `config.json`)                                                                                 | Struct            | `configuration-reference.md`                                 | SS1--8       | PARTIAL  | All fields, types, defaults, and validation rules documented in tables, but no Rust struct definition. Nested sections (mpi, modeling, training, upper_bound_evaluation, policy, simulation, exports) described individually    |
| Stages (parsed `stages.json`)                                                                                 | Struct            | `input-scenarios.md`                                         | SS1          | PARTIAL  | All stage fields documented in SS1.4 field table with JSON types and defaults. Season definitions, policy graph, scenario source, pre-study stages all documented. No Rust struct definition for the top-level parsed container |
| Penalties (parsed `penalties.json`)                                                                           | Struct            | `penalty-system.md` (via `input-directory-structure.md` SS3) | --           | PARTIAL  | Three-tier cascade semantics documented; penalty categories listed with typical ranges; no Rust struct definition for the parsed penalty container                                                                              |
| InitialConditions (parsed `initial_conditions.json`)                                                          | Struct            | `input-constraints.md`                                       | SS1          | PARTIAL  | JSON schema with `storage` and `filling_storage` arrays documented; validation rules complete; no Rust struct for the parsed result                                                                                             |
| Entity registry containers (Bus, Line, Hydro, Thermal, PumpingStation, EnergyContract, NonControllableSource) | Vec containers    | `input-loading-pipeline.md`                                  | SS2.2        | PARTIAL  | Loading order and per-file validation documented for all 7 entity types; schemas defined in `input-system-entities.md`; no Rust container type definitions (loading produces `Vec<EntityType>` for each, but this is inferred)  |
| Scenario data containers (ParModel params, AR coefficients, correlation)                                      | Structs           | `input-scenarios.md`                                         | SS2--5       | PARTIAL  | Parquet column schemas and JSON schemas for all scenario files fully documented; pipeline flexibility table in SS2.2; no Rust container types for loaded scenario data                                                          |
| Constraint containers (thermal bounds, hydro bounds, line bounds, generic constraints)                        | Structs           | `input-constraints.md`                                       | SS2--3       | PARTIAL  | Parquet schemas for all 12 constraint/override files documented with column names and types; generic constraint expression grammar specified in SS3; no Rust container types for loaded constraints                             |
| Simulation Parquet writer                                                                                     | Type              | `output-schemas.md`, `output-infrastructure.md`              | SS5, SS3     | MISSING  | Column schemas for 11 simulation entity outputs (SS5.1--5.11) are fully specified. MPI Hive partitioning protocol documented (SS3.2). No Rust writer type, trait, or function signature specified                               |
| Training Parquet writer                                                                                       | Type              | `output-schemas.md`, `output-infrastructure.md`              | SS6, SS1.2   | MISSING  | Column schemas for convergence log, iteration timing, MPI rank timing all specified. Training manifest documented. No Rust writer type or function signature                                                                    |
| Manifest structures (`_manifest.json`)                                                                        | Struct            | `output-infrastructure.md`                                   | SS1.1, SS1.2 | PARTIAL  | Full JSON schemas for simulation and training manifests with all fields documented; crash recovery protocol described; no Rust struct definitions                                                                               |
| Metadata structures (`metadata.json`)                                                                         | Struct            | `output-infrastructure.md`                                   | SS2          | PARTIAL  | Full JSON schema with run_info, configuration_snapshot, problem_dimensions, performance_summary, data_integrity, environment sections; no Rust struct                                                                           |
| Dictionary types (codes.json, bounds.parquet, variables.csv, entities.csv)                                    | Structs           | `output-schemas.md`                                          | SS3--4       | PARTIAL  | JSON and Parquet schemas for all dictionary files specified; categorical code mappings complete with 5 code tables; no Rust types                                                                                               |
| Validation report                                                                                             | Struct            | `validation-architecture.md`                                 | SS5          | PARTIAL  | Full JSON schema with example; structured output integration documented (SS5.1); report written to `validation_report.json`; no Rust type                                                                                       |
| Validation error catalog                                                                                      | Enum/Catalog      | `validation-architecture.md`                                 | SS4          | PARTIAL  | 14 error kinds with severity, description, and examples in table; each error carries file, entity, kind, message; no Rust enum definition                                                                                       |
| FlatBuffers `BendersCut`                                                                                      | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full FlatBuffers schema with all fields typed: cut_id, slot_index, iteration, forward_pass_idx, scenario_idx, intercept, coefficients, state_at_generation, is_active, domination_count                                         |
| FlatBuffers `StageCuts`                                                                                       | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: stage_id, state_dimension, capacity, warm_start_count, cuts, active_cut_indices, populated_count                                                                                                                   |
| FlatBuffers `VisitedState`                                                                                    | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: state_id, iteration, forward_pass_idx, scenario_idx, components, dominating_cut_id, dominating_objective                                                                                                           |
| FlatBuffers `StageStates`                                                                                     | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: stage_id, state_dimension, states                                                                                                                                                                                  |
| FlatBuffers `Vertex`                                                                                          | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: vertex_id, iteration, forward_pass_idx, scenario_idx, components, upper_bound_value, lipschitz_constant                                                                                                            |
| FlatBuffers `StageVertices`                                                                                   | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: stage_id, state_dimension, vertices, stage_lipschitz                                                                                                                                                               |
| FlatBuffers `StageBasis`                                                                                      | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema: stage_id, iteration, num_columns, num_rows, column_status, row_status, num_cut_rows                                                                                                                                |
| FlatBuffers `PolicyMetadata`                                                                                  | FlatBuffers table | `binary-formats.md`                                          | SS3.1        | COMPLETE | Full schema with all fields for resume/warm-start: version, cobre_version, completed_iterations, rng_seed, rng_state, state_dimension, num_stages, config_hash, system_hash                                                     |
| State dictionary (`state_dictionary.json`)                                                                    | Struct            | `input-constraints.md`                                       | SS4          | PARTIAL  | JSON schema with example showing index, type, entity_type, entity_id, name, checksum; no Rust struct                                                                                                                            |
| Parquet output configuration                                                                                  | Config            | `binary-formats.md`                                          | SS5          | COMPLETE | Compression (Zstd level 3), row group size (~100K rows), statistics enabled, dictionary encoding for categoricals -- all specified                                                                                              |

### 1.2 Public Functions

| Item Name                                             | Category       | Spec File                                       | Section      | Status   | Notes                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | -------------- | ----------------------------------------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load_case(path: &Path) -> Result<System, LoadError>` | Function       | `input-loading-pipeline.md`                     | SS8.1        | COMPLETE | Full signature, parameters, return type, responsibility boundary (9 steps), config loading rationale, error type all specified                                                                                                                                                                                                     |
| Config loading (step 1 within `load_case`)            | Internal step  | `input-loading-pipeline.md`                     | SS8.1, SS2.1 | COMPLETE | Explicitly specified as internal to `load_case` -- "does NOT accept a Config parameter"; conditional loading governed by config (SS4)                                                                                                                                                                                              |
| Entity registry loading (steps 3--4)                  | Internal steps | `input-loading-pipeline.md`                     | SS2.2--2.3   | COMPLETE | Loading order for all 7 entity types plus 3 extension files fully specified with dependency ordering and per-file validation                                                                                                                                                                                                       |
| Scenario data loading (step 5)                        | Internal step  | `input-loading-pipeline.md`                     | SS2.4        | COMPLETE | Loading order for 7 scenario files specified with dependencies and conditional loading rules (SS4)                                                                                                                                                                                                                                 |
| Constraint/override loading (step 6)                  | Internal step  | `input-loading-pipeline.md`                     | SS2.5        | COMPLETE | Loading order for 12 constraint/override files specified with dependencies                                                                                                                                                                                                                                                         |
| Sparse time-series expansion (step 7)                 | Internal step  | `input-loading-pipeline.md`                     | SS5          | COMPLETE | Four-step expansion behavior documented: load sparse, build dense, overlay, validate. Default value rules specified per file type                                                                                                                                                                                                  |
| Cross-reference validation (step 8)                   | Internal step  | `input-loading-pipeline.md`                     | SS2.6        | COMPLETE | Five-point cross-reference validation checklist documented                                                                                                                                                                                                                                                                         |
| Validation pipeline entry point                       | Function       | `validation-architecture.md`                    | SS1--3       | MISSING  | Five-layer validation pipeline is architecturally documented (layers, error collection, dependencies between layers), but no public API function signature or entry point is specified. The pipeline runs within `load_case` but has no independent callable entry. The `--validate-only` CLI mode (SS5.1) implies a callable path |
| Parallel policy loading                               | Function       | `input-loading-pipeline.md`                     | SS7          | PARTIAL  | Four-step protocol documented (metadata broadcast, dictionary validation, round-robin stage loading, cut exchange via `MPI_Allgatherv`). No function signature                                                                                                                                                                     |
| Simulation output writer                              | Function       | `output-schemas.md`, `output-infrastructure.md` | SS5, SS3     | MISSING  | 11 entity output schemas fully specified. MPI Hive partitioning write protocol documented (SS3.2). Atomic write pattern documented. No function signature for writing scenario results (GAP-020 unresolved)                                                                                                                        |
| Training output writer                                | Function       | `output-schemas.md`                             | SS6          | MISSING  | Convergence log, timing, and MPI rank timing schemas specified. No function signature for writing training outputs                                                                                                                                                                                                                 |
| Manifest writer                                       | Function       | `output-infrastructure.md`                      | SS1          | MISSING  | Manifest JSON schemas fully specified for both simulation and training. Crash recovery protocol documented. No function signature                                                                                                                                                                                                  |
| Metadata writer                                       | Function       | `output-infrastructure.md`                      | SS2          | MISSING  | Full metadata JSON schema specified. No function signature                                                                                                                                                                                                                                                                         |
| Dictionary writer                                     | Function       | `output-schemas.md`                             | SS3--4       | MISSING  | All dictionary schemas (codes.json, bounds.parquet, variables.csv, entities.csv) specified. No function signature                                                                                                                                                                                                                  |
| FlatBuffers serialization (policy write)              | Function       | `binary-formats.md`                             | SS3--4       | MISSING  | Schema fully specified. Checkpoint writes described conceptually ("fast serialization from in-memory cut pool to disk"). No Rust function signature for serializing a `StageCuts` to a `.bin` file                                                                                                                                 |
| FlatBuffers deserialization (policy load)             | Function       | `binary-formats.md`                             | SS3.4        | MISSING  | Zero-copy deserialization semantics documented. Cut pool memory layout requirements specified (contiguous dense arrays, 64-byte alignment). No Rust function signature                                                                                                                                                             |
| rkyv broadcast serialization                          | Function       | `input-loading-pipeline.md`                     | SS6.1        | PARTIAL  | Serialization format (rkyv 0.8+), alignment requirements (16-byte), buffer allocation code example all specified. No standalone function signature -- described as caller responsibility ("The caller... is responsible for broadcasting it")                                                                                      |

### 1.3 Error Types

| Item Name                        | Category             | Spec File                    | Section | Status   | Notes                                                                                                                                                                                          |
| -------------------------------- | -------------------- | ---------------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoadError`                      | Enum (5 variants)    | `input-loading-pipeline.md`  | SS8.1   | COMPLETE | Full Rust definition: `IoError`, `ParseError`, `SchemaError`, `CrossReferenceError`, `ConstraintError`. Each variant has typed fields, display format via `#[error(...)]`, phase mapping table |
| Validation error kinds           | Catalog (14 entries) | `validation-architecture.md` | SS4     | PARTIAL  | 14 kinds enumerated with severity, description, examples. Not formalized as Rust enum. Relationship to `LoadError` variants not mapped                                                         |
| Output writing errors            | Error type           | --                           | --      | MISSING  | No error type specified for any output writing operation (Parquet, manifest, dictionary, metadata). GAP-020 notes this gap                                                                     |
| FlatBuffers serialization errors | Error type           | --                           | --      | MISSING  | No error type for FlatBuffers serialization/deserialization failures. The binary-formats.md spec describes the schema but not failure modes                                                    |
| Policy loading errors            | Error type           | `input-loading-pipeline.md`  | SS7     | MISSING  | Parallel policy loading has validation steps (state dictionary dimension match, entity ID validation) but no error type for policy-specific failures distinct from `LoadError`                 |

### 1.4 Trait Implementations

| Item Name                                                         | Category | Spec File                   | Section | Status   | Notes                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | -------- | --------------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rkyv::Archive + Serialize + Deserialize` for all broadcast types | Derive   | `input-loading-pipeline.md` | SS6.2   | COMPLETE | Complete enumeration of 15+ types across 4 categories (entity, temporal/topological, pre-resolved, scenario). Derive example with `#[rkyv(compare(PartialEq))]` shown. HashMap exclusion rule documented |
| `serde::Deserialize` for JSON input types                         | Derive   | --                          | --      | MISSING  | JSON files (config.json, stages.json, penalties.json, etc.) require serde deserialization. No spec enumerates which types need serde derives for input parsing                                           |
| `serde::Serialize` for output JSON types                          | Derive   | --                          | --      | MISSING  | Output JSON files (manifests, metadata, validation report, state dictionary, codes.json) require serde serialization. Not specified                                                                      |
| `arrow2` / `polars` / `parquet` traits for Parquet I/O            | Trait    | --                          | --      | MISSING  | Parquet reading (input scenarios, bounds) and writing (simulation, training outputs) are core cobre-io responsibilities. No specification for which Parquet library to use or which traits to implement  |
| FlatBuffers generated code traits                                 | Trait    | `binary-formats.md`         | SS3.1   | PARTIAL  | The `.fbs` schema is provided inline. Code generation via `flatc` is implied but not explicitly documented. Generated types would implement FlatBuffers-specific traits automatically                    |

### 1.5 Crate Boundary Interactions

| Boundary                                           | Direction  | Spec File                    | Section      | Status   | Notes                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ---------- | ---------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| cobre-io -> cobre-core: returns `System`           | Outgoing   | `input-loading-pipeline.md`  | SS8.1        | COMPLETE | `load_case` returns `Result<System, LoadError>`. Ownership semantics documented ("an owned value, not `Arc<System>`"). Caller responsibility for broadcast documented                                                                                                                      |
| cobre-io -> cobre-core: uses entity types          | Dependency | `input-loading-pipeline.md`  | SS6.2, SS8.1 | COMPLETE | Entity types listed under rkyv bounds. `System` struct defined in cobre-core consumed by cobre-io                                                                                                                                                                                          |
| cobre-io -> cobre-core: uses `LoadError`           | Dependency | `input-loading-pipeline.md`  | SS8.1        | PARTIAL  | `LoadError` is defined in the input-loading-pipeline spec but crate ownership is ambiguous. SS8.1 says it is "the primary entry point from cobre-cli into cobre-io" implying cobre-io owns it, but cobre-core report-001 classified it as cobre-core. Crate assignment needs clarification |
| cobre-sddp -> cobre-io: writes simulation results  | Incoming   | `output-infrastructure.md`   | SS3          | MISSING  | MPI Hive partitioning protocol documented but no API for cobre-sddp to call into cobre-io for output writing (GAP-020)                                                                                                                                                                     |
| cobre-sddp -> cobre-io: writes training results    | Incoming   | `output-schemas.md`          | SS6          | MISSING  | Convergence, timing, and rank timing schemas specified but no cobre-sddp -> cobre-io calling convention                                                                                                                                                                                    |
| cobre-sddp -> cobre-io: writes policy checkpoints  | Incoming   | `binary-formats.md`          | SS3--4       | MISSING  | FlatBuffers schemas fully specified but no API for cobre-sddp to invoke checkpoint writes through cobre-io                                                                                                                                                                                 |
| cobre-cli -> cobre-io: calls `load_case`           | Incoming   | `input-loading-pipeline.md`  | SS8.1        | COMPLETE | Explicit call site documented. `load_case` is the "primary entry point from cobre-cli (rank 0) into cobre-io"                                                                                                                                                                              |
| cobre-cli -> cobre-io: invokes `--validate-only`   | Incoming   | `validation-architecture.md` | SS5          | PARTIAL  | `--validate-only` mode documented as producing validation report. No explicit function signature for validation-only path                                                                                                                                                                  |
| cobre-cli -> cobre-io: invokes output finalization | Incoming   | `output-infrastructure.md`   | SS1          | MISSING  | Manifest writing and `_SUCCESS` marker creation are documented as post-processing but no cobre-cli -> cobre-io API                                                                                                                                                                         |
| cobre-io -> ferrompi: broadcasts via rkyv          | Outgoing   | `input-loading-pipeline.md`  | SS6          | PARTIAL  | Broadcast protocol (two-step: size then contents), alignment, serialization format all specified. Actual MPI calls are caller responsibility (cobre-cli or cobre-comm), not cobre-io directly                                                                                              |

---

## 2. GAP-020 and GAP-021 Status Assessment

### GAP-020: Output Writer API (Medium Severity)

**Current state**: UNRESOLVED.

**Evidence from `spec-gap-inventory.md` line 45**:

> "The output directory structure and Parquet schemas are well-defined, but the API for writing output from cobre-sddp is unspecified. Does cobre-sddp call cobre-io functions directly? Is there a writer trait? What is the function signature for streaming simulation results? The crate boundary between cobre-sddp (producer) and cobre-io (writer) needs an explicit interface."

**Resolution path from gap inventory**:

> "Define a `SimulationWriter` trait or concrete type in cobre-io with methods like `write_scenario_result(&mut self, scenario_id: u32, results: &ScenarioResult) -> Result<(), IoError>`. Specify thread-safety requirements (the writer is accessed from the I/O background thread)."

**Assessment**: The output schemas (11 simulation entity types with full column definitions in `output-schemas.md` SS5) and the infrastructure layer (MPI Hive partitioning in `output-infrastructure.md` SS3, manifests in SS1, metadata in SS2) are thoroughly specified. What is missing is the **programmatic interface** -- the Rust types and function signatures that cobre-sddp uses to produce output through cobre-io. This is the single largest API gap in cobre-io.

### GAP-021: FlatBuffers .fbs Schema (Medium Severity)

**Current state**: EFFECTIVELY RESOLVED.

**Evidence from `spec-gap-inventory.md` line 46**:

> "The FlatBuffers schema for cut persistence is referenced but not provided in full. The spec describes the schema conceptually (StageCuts, BendersCut, StageBasis) but the actual `.fbs` schema definition that would be used for code generation is not included."

**Assessment**: Since the gap was logged, `binary-formats.md` SS3.1 now contains a complete FlatBuffers schema definition with full field-level specifications for all 8 FlatBuffers tables (`BendersCut`, `StageCuts`, `VisitedState`, `StageStates`, `Vertex`, `StageVertices`, `StageBasis`, `PolicyMetadata`). The schema is presented inline as a code block with namespace `cobre.policy`, includes all field types and defaults, and specifies the `root_type` as `StageCuts`. This is sufficient for `flatc` code generation. The only remaining gap is that the schema exists within the Markdown spec but not as a standalone `.fbs` file -- this is a mechanical step during implementation.

---

## 3. Findings

### F-001: Output writer API entirely unspecified -- no types, traits, or function signatures

**Severity**: High
**Affected Crate**: cobre-io (producer), cobre-sddp (consumer)
**Affected Phase**: Phase 5 (Simulation) and Phase 4 (Training outputs)

**Evidence**: `output-infrastructure.md` SS3.2 documents the write protocol:

> "**Write protocol:**
>
> 1. Each rank writes its assigned partitions independently (embarrassingly parallel -- no inter-rank coordination during writes).
> 2. All ranks synchronize at a barrier after writes complete.
> 3. Rank 0 writes the manifest file after the barrier."

And `output-infrastructure.md` SS3.2 further states:

> "**Atomic write pattern:** Each file is written to a temporary path (`data.parquet.tmp`), flushed to disk, then atomically renamed to `data.parquet`. This prevents partial files from appearing as valid output."

The schemas in `output-schemas.md` SS5 define 11 complete Parquet column schemas (costs, hydros, thermals, exchanges, buses, pumping_stations, contracts, non_controllables, batteries, inflow_lags, generic violations). The training schemas in SS6 define 3 more (convergence, iteration timing, MPI rank timing).

But there are zero Rust function signatures, zero Rust types, and zero trait definitions for the output writing API. There is no `SimulationWriter`, no `TrainingWriter`, no `write_scenario()`, no `write_convergence_row()`, no `OutputContext`, and no error type for write failures.

**Impact**: The cobre-sddp -> cobre-io boundary for output is entirely undefined. An implementer must design the complete output API from scratch, including: (a) whether output uses a trait or concrete types, (b) how streaming vs buffered writes are handled, (c) thread-safety requirements for multi-rank writes, (d) how the training loop emits convergence data, (e) the error type for write failures. This is the gap that GAP-020 identifies and it remains unresolved.

**Recommendation**: Define at minimum:

- A `SimulationWriter` type with `write_scenario(&mut self, scenario_id: u32, stage_id: u32, results: &ScenarioStageResult) -> Result<(), OutputError>`
- A `TrainingWriter` type with `write_convergence(&mut self, row: &ConvergenceRow) -> Result<(), OutputError>`
- A `ManifestWriter` for post-run finalization
- An `OutputError` enum with variants for I/O failures, Parquet encoding failures, and manifest corruption
- Thread-safety requirements for each writer type

---

### F-002: No Parquet library specified for input/output

**Severity**: Medium
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2 (input loading) and Phase 4--5 (output writing)

**Evidence**: `binary-formats.md` SS1 provides the format decision framework:

> "| Data Nature | Format | Key Examples | Rationale |
> | Entity-level tabular data | Parquet | Geometry tables, FPHA hyperplanes, bounds overrides | Columnar lookup tables indexed by entity -- efficient typed storage |
> | High-volume output | Parquet | Simulation results, training outputs | Columnar compression, partition pruning, analytics tooling |"

And `binary-formats.md` SS5 specifies Parquet configuration:

> "**Compression**: Zstd (level 3) -- good compression ratio without excessive CPU cost
> **Row group size**: ~100,000 rows -- large enough for efficient column encoding, small enough for reasonable memory during writes
> **Statistics**: Enabled -- allows predicate pushdown for analytics queries
> **Dictionary encoding**: Enabled for categorical columns"

But no Rust Parquet library is specified. The Rust ecosystem has multiple options (`parquet` crate from `arrow-rs`, `polars`, `arrow2`). The choice affects:

- API surface for reading input Parquet files (12 input files use Parquet)
- API surface for writing output Parquet files (14+ output schemas)
- Arrow type mappings
- Whether dictionary encoding and predicate pushdown are natively supported

**Impact**: The library choice is a foundational dependency for cobre-io. It affects trait bounds, error types, and the entire read/write code path. Without specification, implementers must make this decision independently.

**Recommendation**: Specify the Parquet library in `binary-formats.md` SS1 or `crates/io.md`. The `parquet` crate from `arrow-rs` is the standard choice for Rust, providing native Arrow interop, Zstd compression, dictionary encoding, and row group statistics.

---

### F-003: Validation pipeline has no independent callable API

**Severity**: Medium
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2

**Evidence**: `validation-architecture.md` SS1 describes the five-layer pipeline:

> "Validation runs on **rank 0 only** during the Validation phase. It collects all errors before failing, so the user sees every problem in a single report rather than fixing issues one at a time."

And SS3 describes the error collection strategy:

> "After all layers complete, the validation context is evaluated:
>
> - If **any errors** exist, the program emits a validation report and exits with code 3
> - If **only warnings** exist, the program emits the report to the log and continues execution."

The `load_case` function in `input-loading-pipeline.md` SS8.1 embeds validation within its 9-step sequence. But the CLI spec references a `--validate-only` mode (`validation-architecture.md` SS5):

> "In `--validate-only` mode, the report is the primary output."

This implies a callable validation path that stops after validation without proceeding to broadcast. There is no separate `validate_case(path: &Path) -> ValidationReport` function signature.

**Per-layer analysis** (`validation-architecture.md` SS2.1–2.5):

| Layer | Name                      | Input Types                                        | Output Types                               | Error Kinds                                                                                                                                                                   | Status                                                                                                              |
| ----- | ------------------------- | -------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1     | Structural                | File paths from `input-directory-structure.md` SS3 | Presence/parsability confirmation per file | `FileNotFound`, `ParseError`                                                                                                                                                  | PARTIAL — rules specified in prose; no Rust types for input set or per-file result                                  |
| 2     | Schema                    | Parsed JSON/Parquet content                        | Typed field values per entity type         | `SchemaViolation`                                                                                                                                                             | PARTIAL — per-field rules specified in `input-loading-pipeline.md` SS2; no Rust types for schema validation results |
| 3     | Referential Integrity     | Typed entity collections                           | Resolved cross-references                  | `InvalidReference`, `DuplicateId`                                                                                                                                             | PARTIAL — 7 cross-reference rules specified; no Rust types for resolution output                                    |
| 4     | Dimensional Consistency   | Resolved entity collections                        | Coverage-complete datasets                 | `DimensionMismatch`                                                                                                                                                           | PARTIAL — 6 dimensional rules specified; no Rust types for coverage result                                          |
| 5     | Semantic (Business Rules) | Coverage-complete datasets                         | Validated model                            | `InvalidValue`, `CycleDetected`, `BusinessRuleViolation`, `WarmStartIncompatible`, `ResumeIncompatible`, `NotImplemented` (errors); `UnusedEntity`, `ModelQuality` (warnings) | PARTIAL — 25+ business rules specified across 5 domain tables; no Rust types for per-layer output                   |

All 5 layers are PARTIAL: domain rules are thoroughly specified in prose but none have Rust types for their input/output interfaces. The 14-entry error kind catalog (`validation-architecture.md` SS4) is specified but not mapped to individual layers as Rust enums — the mapping above is inferred from the rule descriptions.

**Impact**: The `--validate-only` mode needs a function that runs validation and returns a report without constructing the full `System`. Either `load_case` must be decomposed into validate + construct phases, or a separate `validate_case` function must exist. The current spec does not clarify this.

**Recommendation**: Add a `validate_case(path: &Path) -> Result<ValidationReport, LoadError>` function signature that runs the five-layer validation pipeline and returns the report. `load_case` can then call `validate_case` internally and proceed to construct `System` only if validation passes.

---

### F-004: No Rust types for parsed configuration structures

**Severity**: Medium
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2

**Evidence**: `configuration-reference.md` documents all configuration fields across 8 sections. For example, SS3 training options:

> "| Option | Type | Default | Description |
> | training.forward_passes | int | --- | Number of scenario trajectories $M$ per iteration |"

And SS3.3 stopping rules:

> "| Rule Type | Parameters | Description |
> | `iteration_limit` | `limit: int` | Maximum iteration count (mandatory) |
> | `time_limit` | `seconds: int` | Wall-clock time limit |
> | `bound_stalling` | `iterations: int, tolerance: float` | LB relative improvement below tolerance |
> | `simulation` | `replications, period, bound_window, distance_tol, bound_tol` | Policy stability via Monte Carlo simulation |"

Each field has a JSON type, default value, and description. But there are no Rust struct definitions for the parsed configuration. The config structure is hierarchical: `Config { mpi: MpiConfig, modeling: ModelingConfig, training: TrainingConfig, ... }`. Without Rust types, the implementer must design the entire config deserialization hierarchy.

**Impact**: Configuration parsing is step 1 of `load_case`. The parsed config drives conditional loading (SS4). Without Rust types, the config <-> loading interaction is under-constrained.

**Recommendation**: Add Rust struct sketches for the top-level `Config` struct and its nested sections in `configuration-reference.md`. These can be minimal: field names, types, and `#[serde(default)]` annotations matching the documented defaults.

---

### F-005: Output error type not specified

**Severity**: Medium
**Affected Crate**: cobre-io
**Affected Phase**: Phase 4--5

**Evidence**: `LoadError` in `input-loading-pipeline.md` SS8.1 has 5 well-defined variants for input errors. But there is no corresponding error type for output operations. The output infrastructure spec documents failure modes in `output-infrastructure.md` SS3.3:

> "| Failure Type | Detection | Recovery |
> | Rank crash mid-write | Missing partitions in manifest | Re-run failed scenarios only |
> | Partial file write | Parquet read failure | Delete and re-write partition |
> | Manifest corruption | JSON parse error | Rebuild from partition listing |
> | Disk full | Write error | Alert, do not corrupt existing data |"

Four failure modes are documented but no `OutputError` or `WriteError` enum is defined.

**Impact**: Without an error type, the cobre-sddp -> cobre-io output boundary cannot have typed error handling. The training loop and simulation loop need to handle write failures (disk full, I/O errors) and must propagate them to the CLI for proper exit codes.

**Recommendation**: Define an `OutputError` enum with variants corresponding to the documented failure modes: `IoError`, `ParquetEncodingError`, `ManifestCorruptionError`, `PartitionIncompleteError`. Include the same context-carrying pattern used by `LoadError` (file path, message).

---

### F-006: FlatBuffers serialization/deserialization function signatures missing

**Severity**: Medium
**Affected Crate**: cobre-io
**Affected Phase**: Phase 4 (checkpointing) and Phase 2 (warm-start loading)

**Evidence**: `binary-formats.md` SS3.0 describes the two purposes of FlatBuffers:

> "The FlatBuffers format serves two purposes:
>
> - **Checkpoint writes**: Fast serialization from in-memory cut pool to disk
> - **Policy loading**: Efficient deserialization on resume/warm-start (zero-copy access to coefficient arrays)"

And SS3.4 describes the memory layout requirements:

> "On deserialization (checkpoint resume / warm-start load), the cut pool builder should copy these vectors into the runtime layout described above, preserving contiguity and alignment."

The FlatBuffers schema (SS3.1) is complete and would generate Rust types via `flatc`. But no Rust function signatures exist for:

- Serializing a `StageCuts` from the in-memory cut pool to a `.bin` file
- Deserializing a `.bin` file back into the cut pool builder
- Serializing/deserializing `StageStates`, `StageVertices`, `StageBasis`
- Compression/decompression for `.bin.zst` files

**Impact**: The checkpoint/resume cycle is a critical correctness requirement (SS4.1 specifies bit-for-bit reproducibility). Without specified serialization functions, the boundary between cobre-sddp (which owns the in-memory cut pool) and cobre-io (which handles disk persistence) is undefined.

**Recommendation**: Define function signatures for:

- `write_stage_cuts(path: &Path, cuts: &StageCuts) -> Result<(), PolicyIoError>`
- `read_stage_cuts(path: &Path) -> Result<StageCutsBuf, PolicyIoError>`
- Similar pairs for states, vertices, and basis
- A `PolicyIoError` type for FlatBuffers I/O failures

---

### F-007: Sparse time-series expansion produces no specified output type

**Severity**: Low
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2

**Evidence**: `input-loading-pipeline.md` SS5 documents the expansion behavior:

> "**Expansion behavior:**
>
> 1. Load the sparse Parquet file (only rows with explicit values).
> 2. Build a dense (stage x entity) structure initialized with defaults.
> 3. Overlay the sparse values onto the dense structure.
> 4. Validate that all stage IDs and entity IDs in the sparse data are valid."

The output is a "dense (stage x entity) structure" but its Rust type is unspecified. Is it a `Vec<Vec<f64>>`? A custom `DenseBounds` struct? An `ndarray::Array2`? The type must be compatible with the `ResolvedBounds` struct in cobre-core (which itself lacks a Rust definition per report-001 F-004).

**Impact**: Sparse expansion is internal to `load_case`, so the output type is not part of the public API. But the choice affects the representation of `ResolvedBounds` in the `System` struct.

**Recommendation**: Define the dense expansion output type when `ResolvedBounds` is defined in cobre-core. The types must be consistent.

---

### F-008: `LoadError` crate ownership ambiguous between cobre-core and cobre-io

**Severity**: Low
**Affected Crate**: cobre-core, cobre-io
**Affected Phase**: Phase 1--2

**Evidence**: `input-loading-pipeline.md` SS8.1 defines `LoadError` as part of the `load_case` API:

> ```rust
> pub fn load_case(path: &Path) -> Result<System, LoadError>
> ```

The function is "the primary entry point from cobre-cli (rank 0) into cobre-io". This implies `LoadError` is a cobre-io type. However, report-001 (cobre-core audit) classified `LoadError` as a cobre-core type because `input-loading-pipeline.md` SS8.1 cross-references state:

> "[Internal Structures](../data-model/internal-structures.md) SS1 -- defines the `System` struct returned by `load_case`"

And `System` is a cobre-core type. The `LoadError` enum is defined alongside `load_case` in SS8.1, which sits at the cobre-io API boundary.

The `rkyv` broadcast type list in SS6.2 does NOT include `LoadError`, which suggests it is not part of the cobre-core data model.

**Impact**: Both cobre-core and cobre-io must agree on where `LoadError` lives. If cobre-core, then cobre-io depends on cobre-core for its error type (natural, since cobre-io already depends on cobre-core for `System`). If cobre-io, then cobre-cli depends on cobre-io for error handling.

**Recommendation**: Assign `LoadError` to cobre-io. It is an I/O error type tied to the loading pipeline. cobre-core should not contain error types for file operations. cobre-cli already depends on cobre-io for `load_case`.

---

### F-009: Generic constraint expression parser not specified as cobre-io responsibility

**Severity**: Low
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2

**Evidence**: `input-constraints.md` SS3 provides the expression grammar:

> ```ebnf
> expression    ::= term (('+' | '-') term)*
> term          ::= coefficient? variable | number
> coefficient   ::= number '*'
> variable      ::= var_name '(' entity_id (',' block_id)? ')'
> entity_id     ::= integer
> block_id      ::= integer
> number        ::= float | integer
> ```

And lists 18 variable reference types with syntax. Validation rules include:

> "3. Expressions must parse correctly according to the grammar"

The grammar is specified but no parser function signature or parsing library choice is documented. The parser must run during `load_case` step 6 (constraint loading). Is this a hand-written recursive descent parser? A `nom`/`pest`/`winnow` parser? The output type (`LinearExpression` from report-001 F-011) is also unspecified.

**Impact**: Low -- the grammar is simple (no operator precedence, no parentheses beyond variable syntax). A hand-written parser would be straightforward. But the parsed output type must be defined.

**Recommendation**: Specify the parsed expression representation (e.g., `Vec<(f64, VariableReference)>`) and note that the parser is an internal cobre-io function. Library choice can be deferred to implementation.

---

### F-010: Parallel policy loading function signatures not specified

**Severity**: Low
**Affected Crate**: cobre-io
**Affected Phase**: Phase 2 (warm-start)

**Evidence**: `input-loading-pipeline.md` SS7 documents the parallel policy loading protocol:

> "1. Rank 0 loads and broadcasts the `policy/metadata.json` and `policy/state_dictionary.json` (small files). 2. All ranks validate the state dictionary against the current system (entity count, state variable mapping). 3. Each rank loads a subset of policy stage files from `policy/cuts/` -- stages are assigned round-robin by rank. 4. After local loading, ranks exchange cuts so that every rank has the complete policy."

This is the only loading path where all ranks participate (not rank-0 centric). But no function signature is provided. The function must accept the validated `System` (for state dictionary comparison), the policy directory path, and an MPI communicator.

**Impact**: Policy loading is optional (only for warm-start/resume modes). The protocol is well-documented. The missing function signature is a minor gap.

**Recommendation**: Add a function signature like `load_policy(system: &System, policy_path: &Path, comm: &Communicator) -> Result<PolicyData, LoadError>` to `input-loading-pipeline.md` SS7.

---

### F-011: Broadcast orchestration not clearly assigned to cobre-io or cobre-cli

**Severity**: Low
**Affected Crate**: cobre-io, cobre-cli
**Affected Phase**: Phase 2

**Evidence**: `input-loading-pipeline.md` SS6.1 describes the broadcast protocol:

> "When rank 0 serializes the `System` struct, the resulting byte buffer is broadcast via `MPI_Bcast`. Receiving ranks access the archived data directly from the receive buffer, then convert to owned types only once."

And SS8.1 states:

> "The caller (`cobre-cli` or `cobre-python`) owns the returned `System` and is responsible for broadcasting it to worker ranks via the rkyv serialization protocol (SS6.1)."

So `load_case` returns `System` to cobre-cli, and cobre-cli is responsible for broadcasting. But the broadcast requires rkyv serialization (SS6.1) with 16-byte alignment (SS6.3) and a two-step protocol. Does cobre-io export a `serialize_for_broadcast(system: &System) -> AlignedBuffer` helper? Or is broadcast entirely a cobre-cli/cobre-comm concern?

**Impact**: Low -- the protocol is fully specified. The crate assignment question is a design convenience, not a blocking gap.

**Recommendation**: Clarify whether cobre-io exports rkyv serialization helpers or whether cobre-cli handles broadcast directly using cobre-comm. The natural split: cobre-io handles rkyv serialization (since it knows the types), cobre-comm handles MPI transport.

---

### F-012: No specification for streaming vs buffered output mode

**Severity**: Low
**Affected Crate**: cobre-io
**Affected Phase**: Phase 5

**Evidence**: `input-directory-structure.md` SS2.5 documents the simulation output mode:

> "| `output_mode` | string | `"streaming"` | ..."

And `output-infrastructure.md` SS3.2 documents the write protocol and notes:

> "**Intra-rank thread parallelism (pending HPC specs):** The write protocol above describes rank-level granularity. However, Cobre uses hybrid MPI+OpenMP parallelism where multiple threads within each rank may independently process scenarios. If all thread-owned scenarios funnel through a single rank-level writer, this becomes a serialization bottleneck at scale. The actual write responsibility assignment (per-rank vs per-thread) and synchronization strategy will be defined in the HPC work distribution specs."

The `output_mode` field suggests "streaming" as default, but the actual streaming vs buffered behavior is not defined in any cobre-io API.

**Impact**: Low -- this is flagged as "pending HPC specs" and is an implementation-phase decision. The invariants (each partition written by exactly one writer, atomic writes, manifest after completion) are clear.

**Recommendation**: No immediate action needed. The HPC work distribution specs will define the threading model for output. The invariants in SS3.2 are sufficient constraints for the output API design.

---

## 4. Crate Verdict

**CONDITIONAL PASS**

cobre-io has a well-specified input loading pipeline and comprehensive data format specifications, but its output writing API surface is entirely absent.

**Strengths:**

- The `load_case` function has a complete specification: signature, parameters, return type, 9-step responsibility boundary, error type with 5 variants, conditional loading rules, and cross-reference validation checklist (`input-loading-pipeline.md` SS8.1).
- The file loading sequence is exhaustively documented: 34 files across 5 categories with dependency ordering, per-file validation, and conditional loading rules (`input-loading-pipeline.md` SS2).
- The five-layer validation pipeline architecture is complete with 14 error kinds, error collection strategy, and structured JSON report format (`validation-architecture.md`).
- The broadcast protocol is fully specified: rkyv serialization format, 16-byte alignment, two-step protocol, type enumeration, HashMap exclusion rule, and versioning scope (`input-loading-pipeline.md` SS6).
- All FlatBuffers schemas are complete: 8 tables with full field-level specifications covering cuts, states, vertices, basis, and metadata (`binary-formats.md` SS3.1).
- All Parquet output schemas are complete: 14 entity-level schemas with column names, types, nullability, and row count formulas (`output-schemas.md` SS5--6).
- Parquet output configuration is fully specified: compression, row group size, statistics, dictionary encoding (`binary-formats.md` SS5).

**Gaps:**

- F-001 (High): The output writing API has no types, traits, or function signatures. This is the GAP-020 gap and it remains unresolved. It affects the cobre-sddp -> cobre-io boundary for both simulation and training output.
- F-002 through F-006 (Medium): Missing Parquet library specification, validation pipeline entry point, configuration Rust types, output error type, and FlatBuffers serialization function signatures.
- F-007 through F-012 (Low): Sparse expansion output type, `LoadError` crate ownership, expression parser, policy loading signatures, broadcast orchestration assignment, and streaming mode specification.

**The conditional qualifier reflects that:**

1. **One finding (F-001) is a boundary blocker.** The output writing API gap (GAP-020) means the cobre-sddp -> cobre-io interface for output is entirely undefined. An implementer cannot write the simulation output pipeline without designing this API from scratch. This is the most significant gap across all cobre-io specifications.

2. **The input side is substantially complete.** `load_case` and the validation pipeline are well-specified. The medium-severity findings on the input side (F-003, F-004) are about Rust type definitions, not missing domain content.

3. **FlatBuffers schemas are effectively complete** (resolving GAP-021). The inline `.fbs` schema in `binary-formats.md` SS3.1 is sufficient for `flatc` code generation. Only the serialization/deserialization function signatures (F-006) are missing.

### Resolution path for PASS

To upgrade from CONDITIONAL PASS to PASS, the following findings must be resolved:

| Priority | Finding                                  | Action                                                                                                                |
| -------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Must     | F-001 (GAP-020)                          | Define output writer types, traits, and function signatures for simulation, training, manifest, and dictionary output |
| Must     | F-005                                    | Define `OutputError` enum for write failures                                                                          |
| Should   | F-002                                    | Specify Parquet library choice (`arrow-rs` `parquet` crate recommended)                                               |
| Should   | F-003                                    | Add `validate_case` function signature for `--validate-only` mode                                                     |
| Should   | F-004                                    | Add Rust struct sketches for parsed config and stages types                                                           |
| Should   | F-006                                    | Add FlatBuffers serialization/deserialization function signatures                                                     |
| May      | F-007, F-008, F-009, F-010, F-011, F-012 | Resolve during implementation or Phase 2 prep                                                                         |
