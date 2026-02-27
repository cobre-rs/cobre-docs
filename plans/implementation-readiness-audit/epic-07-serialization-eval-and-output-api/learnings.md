# Epic 07 Learnings: Serialization Evaluation and Output Writer API

**Epic**: epic-07-serialization-eval-and-output-api
**Date**: 2026-02-27
**Tickets**: ticket-027, ticket-028, ticket-029
**Quality scores**: 0.925, 0.975, 0.930 (all EXCELLENT)

---

## Patterns Established

### P1: Evidence-based serialization library evaluation with quantitative thresholds

The rkyv evaluation (report-027) established a reusable five-dimension framework for choosing a Rust serialization library: (1) zero-copy value quantified in milliseconds for the specific use case, (2) derive macro annotation count relative to what is already required, (3) ecosystem overlap with existing dependencies, (4) maintenance status and API stability, (5) suitability for the data shape. The key threshold finding: for a once-per-execution ~6 MB broadcast, zero-copy deserialization saves under 2 ms -- immaterial against execution times of minutes to hours. This threshold pattern applies to any future library selection where the primary advertised benefit is a performance feature. See `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md` sections 2--3.

### P2: Reuse-existing-derives principle for serialization format selection

When serde derives are already required for one use case (JSON input loading in `cobre-io`), always evaluate whether a serde-based binary format satisfies the other use cases before introducing a format with its own derive system. postcard achieves MPI broadcast at zero additional annotation cost because all 43 `cobre-core` types already carry `serde::Serialize` and `serde::Deserialize`. The 129 rkyv-specific annotations it replaces were entirely additive overhead. This principle is documented in `src/specs/architecture/input-loading-pipeline.md` SS6.1 and the rationale paragraph.

### P3: Nested per-entity-type result struct design for simulation output

The `SimulationScenarioResult` type uses a nested layout: per-entity-type sub-structs (`SimulationHydroResult`, `SimulationThermalResult`, etc.) grouped into `SimulationStageResult`, then collected in `SimulationScenarioResult`. This reflects the simulation loop's stage-by-stage production order and delegates all columnar transformation (nested to flat Arrow RecordBatch) to the output writer. The nested layout avoids a premature transpose in the hot path. Source: `src/specs/architecture/simulation-architecture.md` SS3.4, design rationale paragraph.

### P4: Derived column exclusion from hot-path result structs

Any column that can be computed deterministically from other columns during output writing is excluded from `SimulationScenarioResult`. The excluded columns table in SS3.4 documents 15 derived quantities (energy = power x duration, net flow, losses, volume from flow, etc.) that the output writer computes using `System` metadata (block durations, loss factors) already available. This keeps the channel payload minimal and avoids redundant `f64` fields on every scenario-stage-entity row. Source: `src/specs/architecture/simulation-architecture.md` SS3.4, excluded columns table.

### P5: Streaming via Sender parameter, not Vec return

`fn simulate()` accepts a `Sender<SimulationScenarioResult>` parameter rather than accumulating and returning `Vec<SimulationScenarioResult>`. The function returns `Result<SimulationSummary, SimulationError>` with aggregate statistics only. This streaming design prevents accumulating thousands of scenarios in memory, enables the background I/O thread to begin writing before simulation completes, and provides backpressure through the bounded channel capacity. The pattern mirrors the established bounded channel architecture in `simulation-architecture.md` SS6.1. Source: `src/specs/architecture/simulation-architecture.md` SS3.4.6.

### P6: Output writer API mirrors load_case anchoring pattern

`write_results` mirrors `load_case` from `input-loading-pipeline.md` SS8.1: a single top-level function in `cobre-io` that orchestrates all output chains, accepts all required inputs as parameters, returns `Result<(), OutputError>`, and has a complete doc-comment with parameter descriptions and `# Errors` section. The symmetry between input and output anchoring functions makes the crate boundary between `cobre-sddp` (producer) and `cobre-io` (writer) explicit and verifiable. Source: `src/specs/data-model/output-infrastructure.md` SS6.1.

### P7: Separate concrete writers per output chain, not a unified trait

Four output chains (simulation Parquet, training Parquet, policy FlatBuffers, manifest/metadata/dictionary JSON/CSV) use different formats, have different write frequencies, and have different thread-safety requirements. `SimulationParquetWriter` is `Send` and runs on a dedicated I/O thread; `TrainingParquetWriter` runs on the main thread and does not need `Send`. Introducing a unified `OutputWriter` trait would force artificial uniformity across chains with different serialization stacks. Source: `src/specs/data-model/output-infrastructure.md` SS6, design decisions list.

### P8: GAP-039 discovery -- scenario broadcast format is a distinct hot-path gap

The rkyv evaluation revealed that scenario generation broadcasts are categorically different from the System broadcast: they occur once per training iteration (thousands of times per run), involve flat `f64` arrays of innovation noises, and belong in `cobre-stochastic` + `cobre-sddp` rather than `cobre-io`. Unlike the System broadcast (postcard, once per execution), the scenario broadcast format has genuine performance implications and the correct approach is likely raw `#[repr(C)]` `f64` arrays -- matching the cut wire format pattern from `cut-management-impl.md` SS4.2a. This gap was captured as GAP-039 (High severity) in `src/specs/overview/spec-gap-inventory.md`.

---

## Architectural Decisions

### D1: Replace rkyv with postcard for System broadcast (GAP-003 follow-up)

Decision: replace rkyv 0.8+ with postcard 1.1.x for the MPI initialization broadcast of the `System` struct. The five-dimension evaluation in report-027 found: (a) zero-copy value is immaterial at 0--2 ms for a once-per-execution operation; (b) rkyv imposes 129 additional derive annotations on top of the 86 serde derives already required -- postcard adds zero; (c) rkyv is pre-1.0 with a documented breaking change from 0.7 to 0.8 while postcard is post-1.0 stable; (d) postcard has a minimal dependency footprint (only `serde` + `cobs`). Rejected alternatives: rkyv (immaterial benefit, substantial cost), FlatBuffers (requires `.fbs` schema for all 43 types with deep nesting and enum-rich structs -- its strength is dense homogeneous arrays, not complex nested structs), manual `#[repr(C)]` (not applicable -- `System` contains `Vec`, `String`, `Option`, enum variants with data). Source: `src/specs/architecture/input-loading-pipeline.md` SS6.1, report-027.

### D2: arrow-rs as the Parquet library

Decision: use the `arrow-rs` ecosystem (`arrow` + `parquet` crates) for all Parquet writing. Rationale: it is the Apache Arrow Rust implementation, actively maintained by the Arrow project, and the library used by Polars, DataFusion, and DuckDB's Rust bindings. Rejected alternatives: `polars` (higher-level, pulls in significant dependency weight not needed for write-only Parquet output), `parquet-rs` alone without Arrow arrays (lower-level API, more boilerplate per column). The output writer constructs Arrow `RecordBatch` objects and serializes them -- no serde derives required on per-row result structs. Source: `src/specs/data-model/output-infrastructure.md` SS6, decision 2.

### D3: Synchronous output writer API with async decoupling at architecture level

Decision: all writer methods are blocking. Async decoupling is provided by the bounded channel (`simulation-architecture.md` SS6.1), not by the writer API. This avoids an async runtime dependency in `cobre-io` and keeps the writer interface simple. The background I/O thread is the natural unit of async isolation -- it receives from the channel and writes synchronously. Rejected alternative: async `write_scenario` using Tokio or async-std (adds runtime dependency to `cobre-io`, complicates error propagation, unnecessary when there is already one dedicated I/O thread per rank). Source: `src/specs/data-model/output-infrastructure.md` SS6, decision 3.

### D4: SimulationParquetWriter is Send, TrainingParquetWriter is not

Decision: `SimulationParquetWriter` implements `Send` because it is created on the main thread and moved to the background I/O thread. `TrainingParquetWriter` does not need `Send` because training output is written on the main thread after training completes. The explicit documentation of `Send` and the absence of `Sync` (only one thread accesses the writer at a time) establishes the concurrency contract for implementers. Source: `src/specs/data-model/output-infrastructure.md` SS6.2.

### D5: OutputError with 4 variants mirrors LoadError structure

Decision: `OutputError` has exactly 4 variants (`IoError`, `SerializationError`, `SchemaError`, `ManifestError`) with structured fields using `thiserror`. This mirrors `LoadError`'s structure from `input-loading-pipeline.md` SS8.1 and provides the same level of diagnostic detail (path, entity name, column name) per error category. The 4-variant taxonomy covers all output failure modes: filesystem failures, Arrow/Parquet encoding failures, column schema mismatches, and manifest state corruption. Source: `src/specs/data-model/output-infrastructure.md` SS6.4.

---

## Files and Structures Created

- `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md` -- 10-section evidence-based evaluation comparing rkyv, postcard, manual `#[repr(C)]`, and FlatBuffers. Includes production-scale payload size estimate (6 MB breakdown across 16 System components), 43-type derive annotation inventory, consolidated 8-column comparison matrix, and recommendation with 3-sentence rationale.

- `src/specs/architecture/input-loading-pipeline.md` SS6.1--6.4: replaced rkyv specification with postcard. Key changes: SS6.1 rationale paragraph replaced (removed zero-copy justification, added evidence-based postcard rationale with report reference); SS6.2 derive annotations changed from `rkyv::Archive + rkyv::Serialize + rkyv::Deserialize` to `serde::Serialize + serde::Deserialize` with note that `chrono/serde` handles `NaiveDate`; SS6.3 16-byte alignment requirement removed (postcard uses standard `Vec<u8>`); SS6.4 versioning scope preserved with `s/rkyv/postcard/`. Net change: -16 lines, +14 lines.

- `src/specs/architecture/simulation-architecture.md` SS3.4 (new, ~500 lines): 6 subsections defining: (SS3.4.1) 10 per-entity result sub-structs with full Rust field definitions and doc-comments; (SS3.4.2) `SimulationStageResult` grouping per-entity Vecs; (SS3.4.3) `SimulationScenarioResult` channel payload with `scenario_id`, `total_cost`, `per_category_costs`, `stages`; (SS3.4.4) `SimulationSummary` aggregate statistics struct; (SS3.4.5) `SimulationError` enum with 5 variants (`LpInfeasible`, `UnboundedLP`, `IoError`, `ChannelClosed`, `InternalError`); (SS3.4.6) `fn simulate()` signature with doc-comment covering all 5 parameters and streaming return design. SS6.1 updated to reference `SimulationScenarioResult` by name.

- `src/specs/data-model/output-infrastructure.md` SS6 (new, ~470 lines): 7 subsections covering all 9 API elements from report-013 section 4.4: (SS6.1) `write_results` anchoring function with full doc-comment; (SS6.2) `SimulationParquetWriter` with `new`/`write_scenario`/`finalize` method signatures; (SS6.3) `TrainingParquetWriter` with `new`/`write_iteration`/`write_rank_timing`/`finalize` method signatures; (SS6.4) `OutputError` 4-variant enum with `thiserror`; (SS6.5) 4 standalone manifest/metadata/dictionary writer functions; (SS6.6) `write_policy_checkpoint` FlatBuffers function; (SS6.7) API element summary table mapping all 9 report-013 elements to their definitions.

- `src/specs/overview/spec-gap-inventory.md`: GAP-020 marked Resolved with reference to `output-infrastructure.md` SS6. GAP-039 added (High severity, `cobre-stochastic`/`cobre-sddp`, scenario broadcast format unspecified). Summary statistics updated.

---

## Conventions Adopted

### C1: Serialization format choice justification cites marginal benefit, not absolute benefit

When documenting why one serialization format was chosen over another, the justification must cite the marginal benefit for the specific use case (e.g., "under 2 ms saved once per execution") rather than the absolute capability of the library. The absolute capability (zero-copy deserialization) may be real and documented; the question is whether it matters for this call site. This convention is established in `input-loading-pipeline.md` SS6.1 and should be applied to all future serialization format selections in the spec corpus.

### C2: Excluded derived columns documented in a table before result struct definitions

Before any result struct definition that omits derived columns, include a table documenting the excluded columns, their derivation formula, and the entity type. This makes the spec reviewable without requiring the reader to verify absence -- the table explicitly accounts for every exclusion. Established in `simulation-architecture.md` SS3.4, excluded columns table.

### C3: `Send` and `Sync` status documented explicitly in struct doc-comments

Any struct that crosses thread boundaries must document its `Send` and `Sync` status in the struct-level doc-comment with reasoning. `SimulationParquetWriter` documents `Send: yes (moves to I/O thread)`, `Sync: no (only one thread accesses it)`. This makes the concurrency model verifiable by reading the type doc-comment alone. Established in `output-infrastructure.md` SS6.2.

### C4: Writer lifecycle documented as numbered steps in struct doc-comment

Concrete writer structs document their lifecycle (create, use, finalize) as numbered steps in the struct-level doc-comment. This is more readable than prose because it establishes call ordering at a glance. `SimulationParquetWriter` has steps: (1) `new()`, (2) `write_scenario()` called per scenario, (3) `finalize()` after channel closes. Established in `output-infrastructure.md` SS6.2.

---

## Surprises and Deviations

### S1: rkyv annotation count was 43 types (25% more than ticket's minimum of 22)

Ticket-027 required enumerating a minimum of 22 types requiring rkyv derives (per SS6.2). The full transitive inventory found 43 types: 18 top-level types from SS6.2 plus 25 transitive types including all supporting enums and auxiliary structs from Epic 05's entity definitions. The full count strengthened the recommendation -- 129 annotations vs 43 is a 3x annotation multiplier over the 86 serde annotations, not the 2.4x that the 22-type minimum would suggest. Source: report-027 section 4.2.

### S2: GAP-039 discovered during ticket-027, not anticipated in epic planning

The epic overview and ticket-027 scoped the evaluation to the System broadcast only. While writing the postcard justification paragraph, the evaluator noted that scenario innovation broadcasts -- occurring once per training iteration -- are a categorically different use case where format choice has genuine hot-path performance implications. This led to adding GAP-039 as a new High-severity gap during ticket-027, outside the ticket's formal output scope. GAP-039 is not a blocker for Epic 08 (final verification of conditions already known) but must be resolved before Phase 5/6 coding begins.

### S3: SimulationScenarioResult sub-struct count expanded to 10 entity types

Ticket-028 specified result sub-structs for "costs, hydros, thermals, exchanges, buses, and optional entity types." The implementation enumerated 10 distinct sub-structs: `SimulationCostResult`, `SimulationHydroResult`, `SimulationThermalResult`, `SimulationExchangeResult`, `SimulationBusResult`, `SimulationPumpingResult`, `SimulationContractResult`, `SimulationNonControllableResult`, `SimulationInflowLagResult`, `SimulationGenericViolationResult`. The count expanded from the ticket's general groupings to match the exact 11 output schema tables (SS5.1--5.11), with costs being one struct. `SimulationInflowLagResult` is stage-level (no block_id) because AR inflow lag state is not block-granular.

### S4: `write_results` does not write simulation Parquet files

The initial expectation was that `write_results` would be the single orchestrator for all output. The final design splits responsibility: `SimulationParquetWriter` writes simulation Parquet files during simulation execution (streaming), while `write_results` is called after both training and simulation complete and writes only the training Parquet files, manifests, metadata, dictionaries, and policy checkpoint. This is documented explicitly in `output-infrastructure.md` SS6.1 ("write_results does NOT write simulation Parquet files"). The split reflects the streaming architecture: by the time `write_results` is called, simulation files are already on disk.

---

## Recommendations for Subsequent Epics

### R1: Epic 08 ticket-030 (cross-reference re-verification) must include GAP-039 in inventory

ticket-030 verifies cross-reference integrity after all epic-07 edits. It must also note GAP-039 (unresolved, High severity) as a known open gap that does not block the Phase 1-6 implementation timeline but must be resolved before Phase 5 (cobre-stochastic) scenario generation coding begins. GAP-039 belongs in `scenario-generation.md`, not in the output infrastructure files touched in this epic.

### R2: Epic 08 ticket-031 should confirm C-13 and C-14 as resolved

Condition C-13 (rkyv fitness evaluation, GAP-003 follow-up) is resolved by report-027 and the updated `input-loading-pipeline.md` SS6.1--6.4. Condition C-14 (SimulationScenarioResult type and output writer API) is resolved by the new SS3.4 in `simulation-architecture.md` and the new SS6 in `output-infrastructure.md` together with GAP-020 resolution. ticket-031 should verify both conditions as RESOLVED and note GAP-039 as a new unresolved gap that does not affect the 19-condition verdict structure.

### R3: Future simulation-side spec tickets should follow the 10-sub-struct pattern

Any spec ticket that touches `SimulationScenarioResult` fields (e.g., adding a new entity type or extending violation tracking) must follow the 10-sub-struct decomposition in `simulation-architecture.md` SS3.4.1. Each entity type has its own struct; do not add fields to existing structs for new entity features. The excluded columns table must be updated when new computed quantities are added.

### R4: When specifying Parquet writers, establish the RecordBatch construction point explicitly

Ticket-029's implementation did not specify where and how Arrow `RecordBatch` objects are built from the nested result structs. Future tickets for Parquet writer testing or implementation should identify this as the point of highest implementation complexity: converting `Vec<SimulationHydroResult>` into typed Arrow arrays (one per column) while computing derived columns from `System` metadata. A dedicated subsection in `output-infrastructure.md` or `output-schemas.md` specifying the column-construction logic would reduce implementer ambiguity.

### R5: Use `write_results` + `SimulationParquetWriter` as the template pair for any future output chain

Any future output chain (e.g., a new output format for post-processing tools) should follow the established template: a streaming writer for hot-path/incremental output (like `SimulationParquetWriter`) plus inclusion of its finalization in `write_results`. The pair captures the split-responsibility design: streaming during production, manifest/metadata writes after completion. This template is now documented in `output-infrastructure.md` SS6 and is the canonical output-side design reference.
