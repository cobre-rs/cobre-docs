# Accumulated Learnings Through Epic 07 (Serialization Evaluation and Output Writer API)

## Status Overview

- All 7 epics complete (Epics 01-04: audit; Epic 05: entity/validation specs; Epic 06: mechanical fixes; Epic 07: serialization eval and output API)
- Epic 07: C-13 and C-14 resolved across 3 tickets; quality scores 0.925, 0.975, 0.930 (all EXCELLENT)
- Plan progress: 29/31 tickets completed, 2 remaining (epic-08: ticket-030, ticket-031)

## Conditions Fully Resolved

- **Phase 1** (cobre-core): C-01/C-02/C-03 -- RESOLVED (Epic 05)
- **Phase 2** (cobre-io): C-04 -- RESOLVED (Epic 05)
- **Phase 3** (ferrompi + cobre-solver): C-05/C-06/C-07/C-08/C-18/C-19 -- RESOLVED (Epic 06)
- **Phase 4** (cobre-comm): READY with 0 conditions
- **Phase 5** (cobre-stochastic): C-09 -- RESOLVED (Epic 05)
- **Phase 6** (cobre-sddp training): C-10/C-11/C-12 -- RESOLVED (Epic 06)
- **Phase 7** (cobre-sddp sim + cobre-io): C-13/C-14 -- RESOLVED (Epic 07)
- **Phase 8** (cobre-cli): C-15/C-16/C-17 -- RESOLVED (Epic 06)

## Remaining Work

- **Epic 08** (2 tickets): ticket-030 (cross-reference integrity re-verification), ticket-031 (confirm all 19 conditions resolved, produce final verdict)
- **GAP-039** (new, High): scenario broadcast format unspecified -- hot-path per-iteration operation; must be resolved before Phase 5 coding, not an Epic 08 blocker

## Epic 07 Key Decisions

- **rkyv replaced by postcard**: once-per-execution ~6 MB broadcast saves under 2 ms with zero-copy -- immaterial; rkyv imposed 129 additional derive annotations on 43 types above the 86 serde derives already required; postcard reuses existing serde derives at zero annotation cost; postcard is post-1.0 stable, rkyv is pre-1.0 with breaking change history
- **postcard vs FlatBuffers for broadcast**: FlatBuffers rejected for System broadcast -- requires .fbs schema for all 43 deeply nested types with enum-rich structs; FlatBuffers strength is dense homogeneous arrays (cuts), not complex nested structs
- **SimulationScenarioResult**: nested layout (10 per-entity sub-structs -> SimulationStageResult -> SimulationScenarioResult); derived columns (energy = power x duration, net flow, losses) excluded from payload, computed by output writer using System metadata
- **fn simulate() streams via Sender**: returns Result<SimulationSummary, SimulationError>, not Vec<SimulationScenarioResult>; streaming prevents memory accumulation for thousands of scenarios
- **arrow-rs for Parquet**: Apache Arrow Rust implementation; writers use RecordBatch -- no serde derives on per-row result structs
- **Separate concrete writers**: SimulationParquetWriter (Send, streaming I/O thread), TrainingParquetWriter (main thread), plus standalone functions for manifest/metadata/dictionary/policy checkpoint; no unified OutputWriter trait
- **write_results anchoring function**: mirrors load_case pattern from input-loading-pipeline.md SS8.1; does NOT write simulation Parquet files (those are written by SimulationParquetWriter during simulation execution)

## Serialization Format Matrix (established this plan)

- **JSON input loading**: serde + serde_json (mandatory)
- **MPI System broadcast** (once per execution): postcard via serde (replaces rkyv)
- **Cut wire format** (hot path, fixed-size primitives): #[repr(C)] native-endian transmute
- **Policy persistence** (cross-version, dense arrays): FlatBuffers
- **Scenario broadcast** (hot path per iteration, GAP-039): likely #[repr(C)] f64 arrays -- to be specified
- **Parquet output** (simulation and training): arrow-rs RecordBatch
- **Manifest/metadata output**: serde JSON
- **Policy checkpoint**: FlatBuffers generated code

## Reuse-Existing-Derives Principle

- When serde derives are already required for any use case, evaluate serde-based formats before adopting a format with its own derive system
- 43 cobre-core types require serde for JSON loading regardless of broadcast choice; postcard cost = 0 additional annotations
- Applied at: input-loading-pipeline.md SS6.1 "Why postcard over rkyv" paragraph

## Output Writer API Patterns

- **Anchoring pair**: write_results (after-completion orchestrator) + SimulationParquetWriter (streaming during execution) -- analogous to load_case anchoring input chains
- **OutputError taxonomy**: 4 variants matching output phases: IoError, SerializationError, SchemaError, ManifestError; mirrors LoadError structure
- **Thread safety documentation**: Send/Sync status explicitly in struct doc-comments; SimulationParquetWriter is Send, not Sync; TrainingParquetWriter needs neither
- **Writer lifecycle as numbered steps**: create -> use -> finalize documented in struct doc-comment

## Files Modified in Epic 07

- `src/specs/architecture/input-loading-pipeline.md` -- SS6.1--6.4: rkyv -> postcard replacement; SS8.1: updated references
- `src/specs/architecture/simulation-architecture.md` -- SS3.4 (new ~500 lines): 10 per-entity result sub-structs, SimulationStageResult, SimulationScenarioResult, SimulationSummary, SimulationError, fn simulate() signature; SS6.1: updated channel payload type reference
- `src/specs/data-model/output-infrastructure.md` -- SS6 (new ~470 lines): write_results, SimulationParquetWriter, TrainingParquetWriter, OutputError, 4 standalone writer functions, write_policy_checkpoint, API element summary table
- `src/specs/overview/spec-gap-inventory.md` -- GAP-020 marked Resolved; GAP-039 added (High, scenario broadcast format)
- `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md` -- 10-section evaluation report (new)

## Top Accumulated Patterns (All Epics)

- **Batch cross-reference index updates**: always update all 5 sections of cross-reference-index.md together; never update for a single spec in isolation (Epic 06)
- **Section prefix discipline**: `SS` in architecture files, `§` in HPC files (only inside convention blockquote in architecture files), plain numbered headings in overview files; no exceptions (Epics 03/04/06)
- **Serialization format selection**: quantify the marginal benefit for the specific call site; do not adopt a library for a capability that is not exercised at that call site (Epic 07)
- **Reuse existing derives**: when serde is already present, postcard/serde-json cost = 0 additional annotations (Epic 07)
- **Anchoring function pattern**: one top-level entry point anchors all chains in a direction (load_case for input, write_results for output); the single function makes crate boundaries traceable (Epics 04/07)
- **Separate concrete types over unified traits**: when output chains differ in format, frequency, and thread safety, separate concrete writers outperform a unified trait abstraction (Epic 07)
- **Derived column exclusion table**: document what is NOT in a result struct explicitly; silence is ambiguous (Epic 07)
- **Base/resolved field annotation pattern**: `// -- Base fields --` and `// -- Resolved fields --` in entity structs; applies to all cobre-core entity structs (Epic 05)
- **Box<[f64]> for fixed-size HPC arrays**: communicates "never resized" invariant; Vec<f64> communicates "may grow" (Epic 05)
- **ferrompi has no scheduler awareness**: SLURM env-var reading belongs in cobre_comm::slurm, not ferrompi (Epic 06)
- **CLI pattern is `cobre run /path/to/case`**: not `--config /path/to/config.json` (Epic 06)
- **GAP statistics must be computed from table**: count rows with specific status before writing summary statistics (Epic 06)
