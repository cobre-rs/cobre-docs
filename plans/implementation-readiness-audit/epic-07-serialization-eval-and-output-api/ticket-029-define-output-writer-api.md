# ticket-029 Define Output Writer API

## Context

### Background

Report-015 (data traceability) identified GAP-020 as the single systemic gap across all four output chains in the Cobre spec corpus. The spec corpus documents output schemas in full detail -- 11 simulation entity Parquet schemas, 3 training Parquet schemas, FlatBuffers policy schema, JSON/CSV manifest/metadata/dictionary schemas -- but provides zero Rust types or function signatures for the writing side. Report-013 section 4.4 enumerated 9 specific missing API elements that constitute GAP-020:

1. Simulation Parquet writer type
2. Training Parquet writer type
3. Manifest writer function
4. Metadata writer function
5. Dictionary writer functions
6. FlatBuffers serialization function (policy checkpoint)
7. Output error type (`OutputError`)
8. serde derives on output types
9. Parquet library selection

This is the largest gap surface in the spec corpus and the root cause of the Phase 7 NOT READY verdict. Without this API, the crate boundary between cobre-sddp (producer) and cobre-io (writer) is undefined.

### Relation to Epic

This is the third and final ticket in Epic 07. It depends on ticket-028 (`SimulationScenarioResult` type definition) because the simulation writer method signatures consume that type. It is independent of ticket-027 (rkyv evaluation). Completing this ticket resolves condition C-14 (together with ticket-028) and the GAP-020 gap, unblocking Phase 7 implementation.

### Current State

- `output-schemas.md` SS5.1--5.11 defines all 11 simulation entity Parquet schemas with column names, Arrow types, nullability
- `output-schemas.md` SS6.1--6.3 defines all 3 training Parquet schemas (convergence, iteration timing, MPI rank timing)
- `output-infrastructure.md` SS1 defines manifest JSON schemas (simulation and training)
- `output-infrastructure.md` SS2 defines metadata JSON schema
- `output-schemas.md` SS3--4 defines dictionary files (codes.json, bounds.parquet, state_dictionary.json, variables.csv, entities.csv)
- `binary-formats.md` SS3.1 defines the FlatBuffers policy schema (StageCuts, StageBasis, StageStates, StageVertices)
- `binary-formats.md` SS5 defines Parquet output configuration (Zstd compression, row group size, dictionary encoding)
- `simulation-architecture.md` SS6.1 describes the bounded channel streaming architecture
- `input-loading-pipeline.md` SS8.1 defines `load_case` and `LoadError` as the input-side anchoring API (the pattern to follow)
- Report-015 Finding 3 recommends using `load_case` as the architectural template for the output API
- GAP-020 in `spec-gap-inventory.md` is currently unresolved
- `SimulationScenarioResult` will be defined by ticket-028 (dependency)

## Specification

### Requirements

1. Add a new section to `src/specs/data-model/output-infrastructure.md` defining the complete output writer API for the cobre-io crate
2. The API must cover all 9 elements identified by report-013 section 4.4 (listed in Background above)
3. The API must serve all 4 output chains identified by report-015: (a) simulation results to Parquet, (b) training convergence/timing to Parquet, (c) policy checkpoint to FlatBuffers, (d) metadata/manifest/dictionaries to JSON/CSV
4. The API must follow the `load_case` anchoring pattern from `input-loading-pipeline.md` SS8.1: a single top-level entry point function (`write_results`) that orchestrates all output chains
5. Mark GAP-020 as resolved in `src/specs/overview/spec-gap-inventory.md` with a resolution path referencing the new section
6. Update the summary statistics in `spec-gap-inventory.md` section 6 to reflect the newly resolved gap

### Design Decisions to Make Explicit

1. **Single trait vs. separate writers**: Use separate concrete writer types per output chain (not a single `OutputWriter` trait). Rationale: the 4 chains have fundamentally different serialization formats (Parquet, FlatBuffers, JSON, CSV), different write frequencies (streaming vs. periodic vs. once), and different lifetime requirements. A unified trait would be a leaky abstraction.
2. **Parquet library**: `arrow-rs` (the Apache Arrow Rust implementation, which includes the `parquet` crate). Rationale: ecosystem standard, actively maintained by the Arrow project, integrates with the Arrow columnar memory format, and is the library that Polars, DataFusion, and DuckDB's Rust bindings use.
3. **Synchronous vs. async**: The writer API itself is synchronous. The bounded channel in `simulation-architecture.md` SS6.1 provides asynchronous decoupling between simulation threads and the I/O thread, but the writer methods themselves (called by the I/O thread) are blocking file I/O. No async runtime dependency.
4. **OutputError taxonomy**: Mirror `LoadError`'s structure -- one variant per error category: `IoError` (filesystem), `SerializationError` (Parquet/FlatBuffers encoding), `SchemaError` (column mismatch), `ManifestError` (crash recovery state corruption).
5. **Thread-safety**: The simulation Parquet writer must be `Send` (it runs on the dedicated I/O background thread). Training writers run on the main thread and do not require `Send`. FlatBuffers policy writers are called from rank 0 only.

### API Surface (9 Elements)

The following types and functions must be defined with full Rust signatures, doc-comments, parameter descriptions, and error conditions:

1. **`SimulationParquetWriter`** -- consumes `SimulationScenarioResult` from the bounded channel, writes per-entity Hive-partitioned Parquet files. Methods: `new(output_dir, system_ref, config)`, `write_scenario(&mut self, result: SimulationScenarioResult) -> Result<(), OutputError>`, `finalize(self) -> Result<SimulationManifest, OutputError>`
2. **`TrainingParquetWriter`** -- writes convergence log rows and timing rows. Methods: `new(output_dir)`, `write_iteration(&mut self, record: &IterationRecord) -> Result<(), OutputError>`, `write_rank_timing(&mut self, records: &[RankTimingRecord]) -> Result<(), OutputError>`, `finalize(self) -> Result<(), OutputError>`
3. **`fn write_simulation_manifest(path, manifest) -> Result<(), OutputError>`** -- writes `_manifest.json` atomically (temp file + rename per SS3.2)
4. **`fn write_training_manifest(path, manifest) -> Result<(), OutputError>`** -- writes training `_manifest.json`
5. **`fn write_metadata(path, metadata) -> Result<(), OutputError>`** -- writes `metadata.json`
6. **`fn write_dictionaries(path, system, config) -> Result<(), OutputError>`** -- writes all 5 dictionary files (codes.json, bounds.parquet, state_dictionary.json, variables.csv, entities.csv)
7. **`fn write_policy_checkpoint(path, stage_cuts, stage_bases, metadata) -> Result<(), OutputError>`** -- serializes cut pool, basis cache, and policy metadata to FlatBuffers `.bin` files
8. **`OutputError`** -- error enum with 4 variants (IoError, SerializationError, SchemaError, ManifestError)
9. **serde derives**: document which output-side types require `serde::Serialize` (manifest structs, metadata struct) and which require no serde (Parquet writers use Arrow arrays directly, FlatBuffers uses generated code)

### Anchoring Function

```rust
/// Write all output artifacts for a completed Cobre run.
///
/// This is the output-side counterpart to `load_case`. Called by rank 0
/// after training and simulation complete. Orchestrates all 4 output chains.
pub fn write_results(
    output_dir: &Path,
    training_output: &TrainingOutput,
    simulation_output: Option<&SimulationOutput>,
    system: &System,
    config: &Config,
) -> Result<(), OutputError>
```

### Out of Scope

- Implementing any Rust code
- Defining `SimulationScenarioResult` (that is ticket-028)
- Modifying `output-schemas.md` column definitions (those are already complete)
- Defining the bounded channel implementation (that is an implementation-phase decision)
- Training `TrajectoryRecord` type (GAP-030 training-side, Phase 6 Resolve-During-Phase)

## Acceptance Criteria

- [ ] Given `output-infrastructure.md` is opened, when searching for `write_results`, then a Rust function signature is found with doc-comments, parameter descriptions, and `# Errors` section, following the `load_case` pattern from `input-loading-pipeline.md` SS8.1
- [ ] Given `output-infrastructure.md` is opened, when searching for `SimulationParquetWriter`, then a struct with `new`, `write_scenario`, and `finalize` method signatures is found, with `write_scenario` consuming `SimulationScenarioResult` and `finalize` returning a manifest
- [ ] Given `output-infrastructure.md` is opened, when searching for `TrainingParquetWriter`, then a struct with `new`, `write_iteration`, `write_rank_timing`, and `finalize` method signatures is found
- [ ] Given `output-infrastructure.md` is opened, when searching for `OutputError`, then an error enum is found with exactly 4 variants: `IoError`, `SerializationError`, `SchemaError`, `ManifestError`
- [ ] Given `output-infrastructure.md` is opened, when all 9 API elements from report-013 section 4.4 are checked against the new section, then each element has a corresponding type, function, or documented decision (including the Parquet library selection as `arrow-rs`)
- [ ] Given `spec-gap-inventory.md` is opened, when the GAP-020 row is inspected, then its Description column begins with **Resolved.** and its Resolution Path references the new section in `output-infrastructure.md`
- [ ] Given `spec-gap-inventory.md` section 6 (Summary Statistics) is inspected, when the "Medium resolved" count is checked, then it has increased by 1 (from 2 to 3) and the total unresolved count has decreased by 1
- [ ] Given `mdbook build` is run from the repo root, then it completes without new errors or warnings attributable to changes in `output-infrastructure.md` or `spec-gap-inventory.md`

## Implementation Guide

### Suggested Approach

1. Read `output-infrastructure.md` in full (manifests SS1, metadata SS2, MPI partitioning SS3, validation SS5)
2. Read `output-schemas.md` SS5--6 for all Parquet schemas that the writers must produce
3. Read `binary-formats.md` SS3 for the FlatBuffers policy schema and SS5 for Parquet configuration
4. Read `input-loading-pipeline.md` SS8.1 for the `load_case` / `LoadError` pattern to mirror
5. Read `simulation-architecture.md` SS6.1 for the bounded channel streaming architecture
6. Read the `SimulationScenarioResult` definition from ticket-028 (in `simulation-architecture.md`)
7. Design the 9 API elements, writing full Rust signatures with doc-comments
8. Add a new section (recommended: SS6 "Output Writer API" with existing SS5 renumbered if needed, or append as a new top-level section after the current SS5) to `output-infrastructure.md`
9. Update `spec-gap-inventory.md`: mark GAP-020 as resolved, update summary statistics in section 6
10. Verify `mdbook build` passes

### Key Files to Read

- `src/specs/data-model/output-infrastructure.md` (all sections)
- `src/specs/data-model/output-schemas.md` (SS5--6 for schemas, SS3--4 for dictionaries)
- `src/specs/data-model/binary-formats.md` (SS3 for FlatBuffers, SS5 for Parquet config)
- `src/specs/architecture/input-loading-pipeline.md` (SS8.1 for `load_case` / `LoadError` pattern)
- `src/specs/architecture/simulation-architecture.md` (SS6.1 for streaming architecture, SS3.4 or equivalent for `SimulationScenarioResult` from ticket-028)
- `src/specs/overview/spec-gap-inventory.md` (GAP-020 row and section 6 statistics)

### Key Files to Create or Modify

- **Modify**: `src/specs/data-model/output-infrastructure.md` (add output writer API section)
- **Modify**: `src/specs/overview/spec-gap-inventory.md` (mark GAP-020 resolved, update statistics)

### Patterns to Follow

- Mirror the `load_case` anchoring pattern: a single entry point (`write_results`) documented with the same level of detail as `load_case` in SS8.1 (parameters, return type, errors, crate ownership)
- Mirror `LoadError`'s structure for `OutputError`: one variant per error category, doc-comments on each variant explaining when it occurs
- Use the struct definition style from `internal-structures.md` for any new types: doc-comments on every field, `#[derive(...)]` annotations

### Pitfalls to Avoid

- Do not create a single `OutputWriter` trait -- the 4 output chains use different formats and have different lifecycles; a unified trait would be a forced abstraction
- Do not define the `SimulationScenarioResult` type here -- that is ticket-028's deliverable; reference it by name
- Do not duplicate Parquet column definitions from `output-schemas.md` -- reference the existing schemas by section number
- Do not forget to update the summary statistics in `spec-gap-inventory.md` section 6 -- epic-06 learnings emphasize that gap statistics must be computed from the detailed table and verified to match
- Do not add `serde::Serialize` derives where they are not needed -- Parquet writers use Arrow arrays (not serde), FlatBuffers uses generated code (not serde); only manifest and metadata JSON writers need serde

## Testing Requirements

### Verification

- All 9 API elements from report-013 section 4.4 are addressed (check each one explicitly)
- All 4 output chains from report-015 (simulation Parquet, training Parquet, policy FlatBuffers, metadata/manifest/dictionaries) have corresponding writer types or functions
- GAP-020 is marked as resolved in `spec-gap-inventory.md` with correct summary statistics
- `mdbook build` passes without new errors
- The `write_results` anchoring function signature is consistent with `load_case` in style and documentation level

## Dependencies

- **Blocked By**: ticket-028-define-simulation-result-type.md (output writer method signatures consume `SimulationScenarioResult`)
- **Blocks**: None directly (but Epic 08 verification depends on GAP-020 resolution)

## Effort Estimate

**Points**: 3
**Confidence**: High (the 9 elements are explicitly enumerated, the input-side pattern exists as a template, and all output schemas are already fully defined)
