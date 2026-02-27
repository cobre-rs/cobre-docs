# Accumulated Learnings Through Epic 08 (Final Verification — Plan Complete)

## Status Overview

- All 8 epics complete; 31/31 tickets completed
- Final verdict: **READY** -- all 19 conditions from report-017 confirmed resolved; zero Resolve-Before-Coding gaps remain; zero NOT READY phases
- Phase readiness: 7 READY, 1 READY WITH KNOWN GAPS (Phase 5/GAP-039), 0 NOT READY
- Overall mean quality score: ~0.950 (EXCELLENT tier, well above 0.75 gate)

## Audit Epics 01-04 Summary (Assessment Phase)

- **Epic 01**: 8 tickets, audited all 8 crates for API surface completeness -- 503 items assessed, 91 findings
- **Epic 02**: 4 tickets, triaged gaps, verified 4,689 links, checked 7 shared types -- 38 gaps classified, zero broken links
- **Epic 03**: 5 tickets, assessed 8-phase readiness, audited 7 testing specs -- 19 conditions identified, 247 named tests verified
- **Epic 04**: 4 tickets, traced 8 end-to-end data chains, audited 15 HPC files, issued CONDITIONAL GO with 19 conditions
- **Assessment lesson**: Organizing by orthogonal dimensions (completeness, gap triage, phase readiness, data traceability, HPC correctness) produces non-overlapping findings with higher total coverage than a single comprehensive pass

## Resolution Phase (Epics 05-07): Conditions by Epic

- **Epic 05** (C-01/02/03/04/09): entity structs, EntityId, Stage/Block/PolicyGraph, validation checklist, OpeningTree -- `src/specs/data-model/internal-structures.md` SS1-SS12, `src/specs/architecture/input-loading-pipeline.md` SS2.6, `src/specs/architecture/scenario-generation.md` SS2.3a
- **Epic 06** (C-05 through C-08, C-10 through C-12, C-15 through C-19): naming renames, notation fixes, config field names, CLI command, cross-reference index -- 12 conditions across 14 files in one mechanical-fixes epic
- **Epic 07** (C-13/14): serialization evaluation (rkyv vs postcard), simulation result types, output writer API -- `src/specs/architecture/simulation-architecture.md` SS3.4, `src/specs/data-model/output-infrastructure.md` SS6, `src/specs/architecture/input-loading-pipeline.md` SS6

## Final Verification (Epic 08)

- **Three-pass audit structure**: Pass A (new section cross-references), Pass B (stale identifiers), Pass C (index consistency) -- zero broken links, zero stale identifiers, 8 navigability findings (5 High, 3 Low), all non-blocking
- **READY verdict threshold**: zero unresolved Resolve-Before-Coding gaps AND zero NOT READY phases -- does not require all gaps resolved
- **GAP-039**: scenario broadcast format unspecified; Resolve-During-Phase for Phase 5; ~0.5 day effort; `src/specs/architecture/scenario-generation.md`
- **Gap inventory three-source consistency**: section 3 table + section 7 resolution log + section 6 summary statistics must all agree; GAP-036/037/038 rows lacked `**Resolved**` markers despite correct log and statistics

## Serialization Format Matrix (Established This Plan)

- **JSON input loading**: serde + serde_json (mandatory)
- **MPI System broadcast** (once per execution): postcard via serde (replaces rkyv)
- **Cut wire format** (hot path, fixed-size primitives): `#[repr(C)]` native-endian transmute
- **Policy persistence** (cross-version, dense arrays): FlatBuffers
- **Scenario broadcast** (hot path per iteration, GAP-039): likely `#[repr(C)]` f64 arrays -- to be specified in Phase 5
- **Parquet output** (simulation and training): arrow-rs RecordBatch
- **Manifest/metadata output**: serde JSON

## Entity and Data Model Patterns

- **Base/resolved field annotation**: `// -- Base fields --` and `// -- Resolved fields --` in entity structs; applies to all cobre-core entity structs -- `src/specs/data-model/internal-structures.md`
- **`Box<[f64]>` for fixed-size HPC arrays**: communicates "never resized" invariant; `Vec<f64>` communicates "may grow" -- `src/specs/data-model/internal-structures.md`
- **`EntityId` as concrete type**: used as HashMap key throughout runtime structs; defined in `internal-structures.md` and referenced in all entity struct specs
- **Derived column exclusion**: document what is NOT in a result struct explicitly; silence is ambiguous -- `src/specs/architecture/simulation-architecture.md` SS3.4

## Output and I/O Patterns

- **Anchoring function pair**: `load_case` (input) and `write_results` (output) are the single entry points that anchor all I/O chains; make crate boundaries traceable -- `src/specs/architecture/input-loading-pipeline.md` SS8.1, `src/specs/data-model/output-infrastructure.md` SS6.1
- **Separate concrete writers**: `SimulationParquetWriter` (streaming, Send) and `TrainingParquetWriter` (main thread) instead of a unified trait -- different format, frequency, and thread safety requirements; `src/specs/data-model/output-infrastructure.md` SS6.2-6.3
- **`OutputError` taxonomy**: 4 variants (IoError, SerializationError, SchemaError, ManifestError) mirroring `LoadError` structure
- **Streaming via channel**: `fn simulate()` returns `Result<SimulationSummary, SimulationError>` and streams results via `Sender<SimulationScenarioResult>`; prevents memory accumulation -- `src/specs/architecture/simulation-architecture.md` SS3.4.6

## Cross-Reference Index Discipline

- **Batch update after every spec-authoring epic**: Epic 06 included ticket-026 for this; Epic 07 did not -- resulted in 5 High-severity index inconsistencies discovered in Epic 08; every epic that adds new cross-reference entries must end with an explicit index maintenance ticket
- **Re-verify counts for files whose cross-reference sections grew**: when batch-updating, do not assume prior entry counts are correct; re-count from the file's actual Cross-References section
- **Index is a navigation aid, not a correctness guarantee**: missing index entries are High navigability defects but do not block a READY verdict; spec content is correct regardless of index completeness

## HPC Correctness Conventions

- **`ferrompi` has no scheduler awareness**: SLURM env-var reading belongs in `cobre_comm::slurm`, not `ferrompi` -- `src/specs/hpc/memory-architecture.md`, `src/specs/hpc/slurm-deployment.md`
- **`split_shared` (not `split_shared_memory`)**: rename complete across all 4 HPC files; zero occurrences of old name in live specs
- **CLI pattern is `cobre run /path/to/case`**: not `--config /path/to/config.json` -- `src/specs/hpc/slurm-deployment.md`
- **`i32` -> `usize` for allgatherv counts/displs**: correct type for `Vec<usize>` recvcounts and displs -- `src/specs/hpc/work-distribution.md` SS3.2

## Section Prefix and Notation Discipline

- **Section prefixes**: `SS` in architecture files, `§` in HPC files (only inside convention blockquote in architecture files), plain numbered headings in overview/planning files; no exceptions
- **`§` self-reference violation**: pre-existing architecture files authored before the convention may use `§` as self-referential anchors -- grep `§` across `src/specs/architecture/` to verify only blockquote occurrences remain
- **Mathematical notation**: `\pi^{lag}` (not `\pi^a`), `P_h` (not `p_h`) -- `src/specs/architecture/training-loop.md` SS7, `src/specs/math/cut-management.md`
- **`rayon` removed from training-loop.md**: threading model is MPI-based across ranks; no intra-process rayon parallelism in training loop spec

## Gap Inventory Discipline

- **Statistics must be computed from table**: count rows with specific status before writing summary statistics; never assume prior counts -- `src/specs/overview/spec-gap-inventory.md`
- **Three-source consistency invariant**: section 3 table rows, section 7 resolution log, section 6 summary statistics must all agree; update all three simultaneously when resolving a gap
- **Resolve-During-Phase classification**: a gap that blocks a specific phase but not earlier phases is Resolve-During-Phase, not Blocker; this classification preserves READY while flagging the gap for the correct phase team

## Dispatch Architecture

- **Flat enum over `Box<dyn Trait>`**: closed variant sets always use enum dispatch with `match` at call sites; `Box<dyn Trait>` rejected in all trait specs -- canonical reference: `src/specs/architecture/solver-interface-trait.md` SS5
- **Compile-time monomorphization**: reserved for traits that wrap FFI and fix exactly one backend per binary (e.g., `SolverInterface`)
- **Reuse existing derives**: when serde is already required for any use case, evaluate serde-based formats before adopting a format with its own derive system; postcard cost = 0 additional annotations on 43 cobre-core types

## Post-Plan Actions Required

- **Before Phase 5**: resolve GAP-039 (scenario broadcast format) in `src/specs/architecture/scenario-generation.md`; ~0.5 day effort
- **Before Phase 6**: cross-reference maintenance pass -- add `SimulationParquetWriter` forward reference from `simulation-architecture.md` SS6.1 to `output-infrastructure.md` SS6.2 (F1); add postcard/MPI broadcast entry to `binary-formats.md` section 2 (F2); batch-update `cross-reference-index.md` sections 3-4 for Epic 07 changes (F4, F5, F6)
- **Ongoing**: resolve `ecosystem-guidelines.md` rkyv/FlatBuffers inconsistency (pre-existing, Low priority) -- `ecosystem-guidelines.md` still prescribes rkyv for policy data while `binary-formats.md` specifies FlatBuffers
