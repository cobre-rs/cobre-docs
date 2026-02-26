# Epic 01 Learnings: Per-Crate API Surface Completeness Audit

## Patterns Established

- **Completeness matrix pattern**: each crate audit is structured as five categories -- Public Types, Public Functions, Error Types, Trait Implementations, Crate Boundary Interactions -- with COMPLETE/PARTIAL/MISSING classification per item. This five-category structure is the canonical audit schema for all future crate audits. See any of `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-001-cobre-core.md` through `report-008-ferrompi.md`.

- **Conditional PASS verdict pattern**: all 8 crates received CONDITIONAL PASS. No crate is blocked from Phase 1-8 implementation by a total knowledge failure; all have sufficient domain semantics documented. The conditional qualifier always reflects one of three gap types: (a) missing Rust struct/type definitions despite complete prose descriptions, (b) missing function signatures at crate boundaries, or (c) cross-spec naming or structural inconsistencies. See verdict sections in all 8 reports.

- **Subsystem-level audit pattern for complex crates**: `report-005-cobre-sddp.md` decomposes cobre-sddp into 7 named subsystems (A. Training Loop Orchestrator through G. Trait Enum Dispatch) rather than using the flat category scheme. A 30%-PARTIAL+MISSING threshold per subsystem flags the simulation pipeline (Subsystem F at 33%) for elevated attention. This pattern is appropriate when a single crate spans multiple implementation phases.

- **GAP cross-reference in findings**: each finding references its originating GAP-NNN from `src/specs/overview/spec-gap-inventory.md` when applicable (e.g., F-001 in `report-003-cobre-stochastic.md` references GAP-022, F-002 references GAP-023). Findings that discover new gaps not in the original inventory are flagged explicitly. This traceability pattern must be maintained in epic-02 gap triage.

- **Affected Phase tagging**: every finding includes an `**Affected Phase**: Phase N` tag, enabling aggregate phase-readiness analysis without re-reading full finding text. Audit reports for crates spanning multiple phases use ranges (e.g., `Phase 4--5`). See any finding block in the 8 reports.

- **Spec-vs-real-API verification section**: `report-008-ferrompi.md` includes a dedicated "Spec vs Real API Verification Summary" section that checks the spec API table against the real external crate API. This section is only applicable to external dependencies (ferrompi) and should not be required for internally developed crates.

## Architectural Decisions

- **Output API is the largest single gap across the corpus**: the output writing API for cobre-io (GAP-020) has no types, traits, or function signatures despite fully specified Parquet schemas, FlatBuffers schemas, manifest JSON schemas, and MPI Hive partitioning protocol. Every other output spec section (schemas, infrastructure, binary formats) is COMPLETE or PARTIAL at the schema level but MISSING at the Rust API level. The decision to specify schemas before types produces a gap where the data format is unambiguous but the calling convention between cobre-sddp and cobre-io is entirely undefined. See `report-002-cobre-io.md` F-001 and F-005 through F-010.

- **Prose-described types without Rust struct definitions is the dominant gap category**: 25 of the 76 cobre-core items are PARTIAL specifically because the type has full prose and table descriptions but no concrete Rust struct definition with field types. The same pattern appears in cobre-stochastic (F-001, F-002), cobre-io (F-004), cobre-sddp (F-001, F-008, F-011), and cobre-cli (F-004). The corpus adopted a "document behavior first, formalize types later" authoring style; epic-02 must reverse this for all High-severity instances. See `report-001-cobre-core.md` category summary (33 PARTIAL out of 76 total).

- **`StageTemplate` and `StageIndexer` crate ownership is ambiguous**: `report-004-cobre-solver.md` F-006 identifies that these two types, which are used in at least three crates (cobre-solver, cobre-sddp, training-loop.md), lack a definitive owning crate in the spec. The recommended resolution is cobre-core ownership (types are LP-layout data holders, not solver-specific), but this requires a spec decision before Phase 3 implementation. The ambiguity will cause import confusion during Phase 3 if not resolved. See `report-004-cobre-solver.md` F-001 and F-006.

- **`CommBackend` enum dispatch cannot implement `SharedMemoryProvider` without a region-type unification strategy**: `report-006-cobre-comm.md` F-005 identifies a structural gap: the enum wrapper for multi-feature builds needs a unified region type across variants. Two options are available -- a `CommRegion<T>` enum or `Box<dyn SharedRegion<T>>`. The spec should make this choice explicit before Phase 4 because the choice affects the training entry point signature (`C: Communicator + SharedMemoryProvider`). See `report-006-cobre-comm.md` F-004 and F-005.

- **ferrompi API names have drifted from the real crate**: three method names in the spec do not match the real ferrompi crate API -- `split_shared_memory()` should be `split_shared()`, and `init_with_threading()` should be `Mpi::init_thread()`. These stale names appear in 4 spec files (`communicator-trait.md`, `ferrompi.md`, `communication-patterns.md`). The drift was not detected during spec authoring because ferrompi specs were written from documentation rather than from code inspection. All occurrences must be corrected before Phase 3 to prevent implementers from searching for methods that do not exist. See `report-008-ferrompi.md` F-003 through F-005.

## Files and Structures Created

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-001-cobre-core.md` -- 76-item completeness audit for the Phase 1 foundation crate. 13 findings (2 High, 6 Medium, 5 Low). Primary gap: entity struct definitions absent from `src/specs/data-model/internal-structures.md`.

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-002-cobre-io.md` -- 67-item completeness audit for the Phase 2 I/O crate. 12 findings (1 High, 5 Medium, 6 Low). Primary gap: output writer API entirely absent (GAP-020 unresolved).

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-003-cobre-stochastic.md` -- 42-item completeness audit for the Phase 5 stochastic crate. 11 findings (2 High, 5 Medium, 4 Low). Primary gaps: `PrecomputedPar` struct (GAP-022) and opening tree type (GAP-023) absent.

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-004-cobre-solver.md` -- 48-item completeness audit for the Phase 3 solver crate. 9 findings (1 High, 4 Medium, 4 Low). Most well-specified foundational crate. Primary gaps: naming inconsistency in testing spec (`patch_rhs_bounds` vs `patch_row_bounds`) and workspace Rust struct absent.

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-005-cobre-sddp.md` -- 106-item completeness audit organized by 7 subsystems for the Phase 6-7 SDDP orchestration crate. 16 findings (2 High, 9 Medium, 2 Low, 2 verification passes). Primary gaps: `TrajectoryRecord` type (GAP-030) and simulation pipeline at 33% PARTIAL+MISSING.

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-006-cobre-comm.md` -- 56-item completeness audit for the Phase 4 communication abstraction crate. 10 findings (1 High, 3 Medium, 6 Low). Primary gap: `CommBackend` enum lacks `SharedMemoryProvider` implementation strategy.

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-007-cobre-cli.md` -- 35-item completeness audit for the Phase 8 CLI crate. 13 findings (5 High, 3 Medium, 4 Low). Unique characteristic: 0 MISSING items but 5 High-severity cross-spec naming inconsistencies (all documentation fixes, no architectural changes required).

- `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-008-ferrompi.md` -- 73-item completeness audit for the external ferrompi MPI wrapper (Phase 3). 7 findings (2 High, 3 Medium, 2 Low). Unique characteristic: 0 MISSING items. Primary gap: stale method names in 4 spec files and `Mpi` RAII guard absent from `FerrompiBackend` struct definition.

## Conventions Adopted

- **Severity classification for audit findings**: High = blocks Phase N implementation if unresolved, requires spec update before coding begins; Medium = an implementer must make a design decision without spec guidance, resolvable during implementation; Low = convenience or clarity improvement, does not affect implementation correctness. This classification is consistent across all 8 reports and should be used in epic-02 triage.

- **CONDITIONAL PASS vs PASS**: PASS would require all MISSING items resolved and all High-severity findings addressed. CONDITIONAL PASS = domain semantics sufficient, but one or more Rust type definitions or function signatures are absent. All 8 crates are CONDITIONAL PASS. No crate is FAIL (which would require fundamental domain knowledge missing).

- **"Must / Should / May" resolution priority table**: each crate verdict section includes a resolution path table with three priority tiers. "Must" findings must be resolved before the crate's phase begins. "Should" findings are addressed in phase-prep time. "May" findings can be resolved during implementation. This convention should be replicated in epic-02 gap triage tickets. See verdict sections in all 8 reports.

- **Aggregate completeness rate as phase-readiness proxy**: cobre-solver at 38/48 COMPLETE (79%) is the most ready crate; cobre-core at 36/76 COMPLETE (47%) is the least ready despite being Phase 1. Completeness rate alone is not sufficient -- cobre-core's PARTIAL items are mostly entity struct type definitions (recoverable during implementation), while cobre-io's MISSING items are output API boundaries (blocking for Phase 4-5 integration).

## Surprises and Deviations

- **cobre-cli has the most High-severity findings despite zero MISSING items**: 5 of the 13 cobre-cli findings are High severity, but none are absent specifications -- all are cross-spec naming inconsistencies (3 different names for `training.forward_passes` across 4 files, stale SLURM invocation patterns, `training.enabled` missing from configuration reference). This was unexpected: a crate with complete behavioral documentation can still have implementation-blocking inconsistencies. The CLI spec inconsistencies will cause implementers to use wrong field names in JSON config parsing. See `report-007-cobre-cli.md` F-003, F-007, F-008, F-010, F-012.

- **ferrompi is the most complete crate (96% COMPLETE) but has two High-severity stale API names**: 70 of 73 items are COMPLETE, but F-003 and F-004 identify method names used throughout the spec corpus that do not exist in the real ferrompi crate. The high completeness rate masked the severity of the API name drift. This demonstrates that item-level COMPLETE/PARTIAL/MISSING status does not capture cross-spec consistency issues. See `report-008-ferrompi.md` F-003 through F-005.

- **cobre-sddp's trait enum dispatch subsystem (Subsystem G) is exceptionally complete**: 36 of 37 items in Subsystem G are COMPLETE, reflecting the thoroughness of the spec-readiness plan's architecture trait work. The 7 architecture trait specs produced in the previous plan paid off as direct completeness coverage for cobre-sddp's dispatch layer. In contrast, the training loop orchestration (Subsystem A) and simulation pipeline (Subsystem F) are where gaps concentrate, because those subsystems have no dedicated architecture trait specs.

- **`LoadError` ownership ambiguity between cobre-core and cobre-io**: `report-002-cobre-io.md` F-008 identifies that `LoadError` (a 5-variant error enum with full Rust definition) is specified in some places as a cobre-core type and in others as a cobre-io type. The recommendation is cobre-io ownership (it is tied to file operations), but the ambiguity must be resolved before Phase 2 to avoid duplicate definitions. This was not flagged in the original gap inventory.

- **No crate audit required more than 16 findings**: the maximum finding count per report was 16 (cobre-sddp). The corpus is not deficient in domain knowledge -- it is deficient in Rust type formalization and cross-spec consistency. This is a recoverable state.

## Aggregate Statistics

- Total findings across all 8 reports: 91 (16 High, 38 Medium, 33 Low, 4 verification passes not counted)
- Total audit items: cobre-core 76, cobre-io 67, cobre-stochastic 42, cobre-solver 48, cobre-sddp ~106 (subsystem items), cobre-comm 56, cobre-cli 35, ferrompi 73
- Verdicts: 8 CONDITIONAL PASS, 0 PASS, 0 FAIL
- Most implementation-ready crate: cobre-solver (79% COMPLETE, only 1 High-severity finding -- a naming inconsistency in the testing spec)
- Least specification-complete crate: cobre-core (47% COMPLETE by item count, though domain content is comprehensive)
- Highest finding count: cobre-sddp (16 findings) and cobre-cli (13 findings)
- Most severe gap: cobre-io output writer API entirely absent (GAP-020), blocking Phase 4-5 cobre-sddp -> cobre-io integration

## Recommendations for Future Epics

- **Epic-02 gap triage must prioritize output API definition (cobre-io F-001, GAP-020) and entity struct definitions (cobre-core F-001 through F-006)**: these are the only gaps that block Phase 1-4 implementation from proceeding without implementer-invented design decisions. All other High-severity findings are naming inconsistencies (cobre-cli F-003/F-010/F-012, ferrompi F-003/F-004/F-005) or structural ambiguities (cobre-comm F-005, cobre-solver F-006/F-007) that are addressable with targeted spec edits. See `report-001-cobre-core.md` resolution path table and `report-002-cobre-io.md` resolution path table.

- **Epic-02 must resolve the `StageTemplate`/`StageIndexer` crate ownership question**: this is the single most cross-cutting ambiguity in the corpus. It affects cobre-core, cobre-solver, cobre-sddp, and the training-loop spec. The recommended resolution (cobre-core ownership) must be confirmed and propagated to all 4 spec files before Phase 3 tickets are written. See `report-004-cobre-solver.md` F-001 and F-006.

- **Epic-02 must apply a naming standardization pass to all field names referenced across multiple spec files**: at minimum, `training.forward_passes` (3 variant names across 4 files), `split_shared()` (stale as `split_shared_memory()` in 4 files), and `Mpi::init_thread()` (stale as `init_with_threading()` in 1 file). These are mechanical find-and-replace changes but are High severity because they will cause compilation failures or JSON deserialization errors. See `report-007-cobre-cli.md` F-010 and `report-008-ferrompi.md` F-003 through F-005.

- **Epic-03 phase readiness assessment should treat cobre-solver as the Phase 3 anchor**: at 79% COMPLETE with only documentation-level gaps, cobre-solver is ready for implementation once the `StageTemplate`/`StageIndexer` ownership is clarified and the testing spec is updated to use `patch_row_bounds`. Use cobre-solver's completeness level (79%+) as the target for other Phase 1-4 crates before implementation begins.

- **The simulation pipeline (cobre-sddp Subsystem F, Phase 7) needs its own spec-writing ticket before Phase 6 completes**: at 33% PARTIAL+MISSING, the simulation subsystem is the only subsystem exceeding the 30% threshold. The minimum needed before Phase 7 begins is: `SimulationScenarioResult` type definition and `simulate` function signature. These are distinct from `TrajectoryRecord` (training, Phase 6) and must not be conflated. See `report-005-cobre-sddp.md` F-012, F-013, F-016.
