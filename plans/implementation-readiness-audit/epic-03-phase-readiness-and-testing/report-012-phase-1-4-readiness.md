# Report 012: Implementation Phase 1-4 Readiness Assessment

**Date**: 2026-02-26
**Scope**: Phases 1-4 from [Implementation Ordering](../../../src/specs/overview/implementation-ordering.md) section 5
**Evidence Sources**: Epic 01 crate audit reports (001, 002, 004, 006, 008) and Epic 02 gap triage report (009)

---

## 1. Executive Summary

| Phase | Crates                  | Verdict             | Blocking Conditions                                                                             |
| ----- | ----------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 1     | cobre-core              | CONDITIONALLY READY | Resolve entity struct definitions (Bus, Line, Thermal, Hydro) and `EntityId` type before coding |
| 2     | cobre-io                | CONDITIONALLY READY | Resolve GAP-029 (cross-reference validation checklist completeness) before coding               |
| 3     | ferrompi + cobre-solver | CONDITIONALLY READY | Fix `patch_rhs_bounds` naming in testing spec; clarify `StageTemplate`/`StageIndexer` ownership |
| 4     | cobre-comm              | READY               | --                                                                                              |

Phase 4 is the only phase assessed as fully READY. Phases 1-3 each carry conditions that are resolvable through targeted spec updates (not architectural redesign). No phase is assessed as NOT READY.

---

## 2. Phase 1 Assessment: cobre-core -- Data Model and Registries

### 2.1 Spec Reading List Completeness

The Phase 1 reading list contains 7 specs:

1. Design Principles
2. Input System Entities
3. Input Hydro Extensions
4. Penalty System
5. Internal Structures
6. System Elements
7. Equipment Formulations

**Assessment**: The reading list covers all domain areas needed for entity types, topology, penalties, and the `System` struct. Report-001 section 1 confirms that the `System` struct (SS1.3), its public API (SS1.4), thread safety (SS1.6), and crate boundary contract (SS1.7) are all fully specified from these sources. No spec is missing from the reading list for Phase 1 deliverables.

**Evidence**: Report-001 verdict: "cobre-core has a strong specification foundation" with `System` struct, `TrainingEvent` (11 variants), `LoadError` (5 variants), and rkyv requirements all COMPLETE.

### 2.2 Testable Intermediate Achievability

The Phase 1 testable intermediate specifies:

> Entity creation (Bus, Line, Thermal, Hydro), entity registry population, topology validation (bus-connectivity, cascade ordering), three-tier penalty resolution (global/entity/stage), canonical ID ordering, internal structure construction

**Achievable capabilities** (COMPLETE spec status from report-001):

- `System` struct construction and population -- report-001 section 1.1: COMPLETE (SS1.3, all fields with Rust types)
- `TrainingEvent` enum for event channel -- report-001 section 1.1: COMPLETE (11 variants)
- `LoadError` enum for validation errors -- report-001 section 1.1: COMPLETE (5 variants)
- Cascade topology structure -- report-001 section 1.1: `CascadeTopology` field in `System` is COMPLETE at the container level
- rkyv serialization support -- report-001 section 1.1: COMPLETE (SS6.2)

**Blocked or degraded capabilities** (PARTIAL/MISSING spec status from report-001):

- Entity creation for Bus, Line, Thermal, Hydro -- report-001 F-001: fields listed by name but no Rust struct definitions. An implementer must derive struct definitions from prose and JSON field tables.
- Entity registry population -- depends on entity types above plus `EntityId` type (report-001 F-002: MISSING, no type alias or newtype defined)
- Canonical ID ordering -- depends on `EntityId` (F-002)
- Three-tier penalty resolution -- report-001 F-004: `ResolvedPenalties` and `ResolvedBounds` structs have no Rust definitions
- Topology validation functions -- report-001 F-012: function signatures for cascade cycle detection and network topology construction are not specified
- Internal structure construction for `Stage`, `Block`, `PolicyGraph` -- report-001 F-005: Rust struct definitions absent

**Achievability verdict**: The 47% COMPLETE status (report-001: 36/76 items) means roughly half the testable intermediate is directly implementable from specs. The remaining half requires the implementer to translate prose descriptions into Rust types -- the domain semantics are present but the Rust formalization is not.

### 2.3 Gap Impact on Phase

| Gap ID  | Description                                             | Classification (report-009) | Impact on Phase 1                                                                                              |
| ------- | ------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GAP-031 | `Stage` struct ambiguous fields overlapping with config | Resolve-During-Phase        | Naming conflict between `num_scenarios`/`sampling_method` and config params; local design decision for Phase 1 |

Phase 1 has exactly 1 gap from the triage. Report-009 classifies GAP-031 as Resolve-During-Phase with rationale: "the implementer of cobre-core will naturally resolve the naming conflict when mapping `stages.json` fields to struct fields." This gap does not block coding.

### 2.4 Implicit Knowledge Gaps

An implementer starting Phase 1 would need knowledge not captured in any spec:

1. **Rust type design patterns for entity hierarchies**: The specs describe 7 entity types with varying field sets. The implementer must decide between individual structs per entity type (with an `Entity` enum wrapper), a trait-based approach, or flat structs. The spec prescribes enum dispatch (CLAUDE.md: "closed variant sets always prefer enum dispatch") but does not show the entity enum itself.

2. **rkyv derive strategy**: Report-001 documents rkyv serialization requirements (SS6.2) including the HashMap exclusion rule, but the implementer must know how to apply `#[derive(Archive, Serialize, Deserialize)]` with `#[archive(check_bytes)]` and handle the exclusion of `HashMap` fields (which require custom serialization).

3. **Generic constraint expression representation**: Report-001 F-011 identifies that `GenericConstraint` has no Rust type for its parsed expression (`LinearExpression`, `ConstraintSense`, `SlackConfig`, `VariableReference` with 18 variants). The LP builder in cobre-sddp consumes these types, so the representation must be efficient for iteration.

4. **Date/time library choice**: Report-001 F-013 notes that `Stage` date fields (`start_date`, `end_date`) have no specified Rust type. The choice between `chrono::NaiveDate`, `time::Date`, or a custom type affects rkyv compatibility.

### 2.5 Cross-Phase Dependency Risks

Phase 1 has no upstream dependencies ("Blocked by: Nothing"). However, Phase 1 types flow downstream to all subsequent phases:

- **Phase 2 risk**: cobre-io deserializes JSON into cobre-core types. If entity struct definitions change after Phase 2 begins, the JSON deserialization layer must be updated. Low risk because entity fields are well-documented in prose.
- **Phase 3 risk**: `StageTemplate` and `StageIndexer` consume cobre-core types (report-004 F-006: crate ownership ambiguous). If these types are defined in cobre-core (as the ticket context suggests), Phase 1 must define them before Phase 3 can consume them. If they are defined in cobre-solver, Phase 1 has no exposure.
- **Phase 6 risk**: The `System` struct is the central data type consumed by the training loop. Its field layout (especially entity registries and cascade topology) determines how LP construction works. Changes to `System` after Phase 6 begins would require cascading updates.

**Mitigation**: The `System` struct definition (SS1.3) is COMPLETE and stable. The risk concentrates on the entity types that populate it.

### 2.6 Phase 1 Verdict: CONDITIONALLY READY

**Rationale**: The domain semantics for all Phase 1 deliverables are fully captured in the spec reading list. The `System` struct, `TrainingEvent`, `LoadError`, and rkyv requirements are COMPLETE. However, the 47% COMPLETE status means an implementer must make substantial Rust type design decisions that should be in the spec. The conditions below are necessary to prevent divergent implementations and ensure downstream phase compatibility.

**Conditions for READY**:

1. Add Rust struct definitions for Bus, Line, Thermal, Hydro, PumpingStation, Contract, NonControllable (report-001 F-001 -- "Must" priority)
2. Define `EntityId` as a concrete type or alias (report-001 F-002 -- "Must" priority)
3. Add Rust struct definitions for `Stage`, `Block`, `PolicyGraph` (report-001 F-005 -- "Should" priority)

---

## 3. Phase 2 Assessment: cobre-io -- Input Loading and Validation

### 3.1 Spec Reading List Completeness

The Phase 2 reading list contains 9 specs:

1. Input Directory Structure
2. Input Scenarios
3. Input Constraints
4. Output Schemas
5. Output Infrastructure
6. Binary Formats
7. Validation Architecture
8. Input Loading Pipeline
9. Configuration Reference

**Assessment**: The reading list covers both input and output concerns. For Phase 2's scope (input loading only), specs 1-3 and 7-9 are directly relevant. Specs 4-6 (output) are included because cobre-io owns both input and output, and the types may share error handling patterns. No input-relevant spec is missing.

**Evidence**: Report-002 confirms that `load_case` has a complete specification (SS8.1): signature, 9-step responsibility boundary, error type, conditional loading rules, and cross-reference validation checklist.

### 3.2 Testable Intermediate Achievability

The Phase 2 testable intermediate specifies:

> Load a case directory into internal structures: JSON config parsing, JSON entity registry deserialization, Parquet scenario loading, five-layer validation pipeline (structural, schema, referential integrity, dimensional consistency, semantic), error collection and reporting

**Achievable capabilities**:

- `load_case` function -- report-002 section 1.2: COMPLETE (full signature, parameters, return type, 9-step sequence)
- `LoadError` enum -- report-002 section 1.3: COMPLETE (5 variants, all fields typed)
- File loading sequence -- report-002 verdict: "34 files across 5 categories with dependency ordering, per-file validation, and conditional loading rules"
- Five-layer validation architecture -- report-002 verdict: "complete with 14 error kinds, error collection strategy, and structured JSON report format"
- Broadcast protocol (rkyv) -- report-002 verdict: "fully specified: rkyv serialization format, 16-byte alignment, two-step protocol"
- FlatBuffers schemas -- report-002 verdict: "complete: 8 tables with full field-level specifications"
- Parquet output schemas -- report-002 verdict: "complete: 14 entity-level schemas with column names, types, nullability"

**Blocked or degraded capabilities**:

- Validation pipeline entry point -- report-002 F-003: no `validate_case` function signature for `--validate-only` mode
- Configuration Rust types -- report-002 F-004: parsed config and stages types have no Rust struct definitions
- Cross-reference validation completeness -- GAP-029 (report-009: Resolve-Before-Coding): the checklist is "illustrative, not exhaustive"

**Note on output writing**: The output writer API (GAP-020, report-002 F-001) is entirely absent, but per the ticket specification, GAP-020 does NOT block Phase 2. GAP-020 blocks Phase 7 (simulation + output). Phase 2 covers input loading only.

### 3.3 Gap Impact on Phase

| Gap ID  | Description                                            | Classification (report-009) | Impact on Phase 2                                                                                                                                                           |
| ------- | ------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-025 | Penalty priority ordering validation rule missing      | Resolve-After-MVP           | No impact; penalty ordering is a user-experience improvement, not a correctness requirement                                                                                 |
| GAP-029 | Cross-reference validation checklist is "illustrative" | **Resolve-Before-Coding**   | The validation pipeline is the primary deliverable of Phase 2. Without a complete checklist, the implementer cannot know when the work is done. Blocks coding completeness. |

Phase 2 has 2 gaps. GAP-025 is Resolve-After-MVP and poses no risk. GAP-029 is the only Resolve-Before-Coding gap that affects Phase 2 directly.

**Evidence**: Report-009 rationale for GAP-029: "An implementer of the validation pipeline needs a complete, enumerated checklist to know when the work is done. Without it, the implementer must reverse-engineer all entity cross-references from the data model specs and guess which ones need validation."

### 3.4 Implicit Knowledge Gaps

1. **Parquet library choice**: Report-002 F-002 notes no Parquet library is specified. The `arrow-rs` `parquet` crate is the de facto standard for Rust Parquet I/O, but the spec does not mandate it. This affects both input (scenario loading) and output (Hive-partitioned writes).

2. **JSON deserialization framework**: The specs describe JSON schemas in detail but do not specify whether `serde_json` direct deserialization or a schema-validation-first approach (e.g., `jsonschema` crate) is expected. The five-layer validation pipeline suggests structural validation before deserialization.

3. **Broadcast orchestration ownership**: Report-002 F-011 identifies ambiguity in whether cobre-io exports rkyv serialization helpers or whether cobre-cli handles broadcast directly. This affects Phase 2's public API surface.

### 3.5 Cross-Phase Dependency Risks

- **Phase 1 dependency**: cobre-io depends on cobre-core entity types for deserialization targets. If Phase 1 entity struct definitions are not stable when Phase 2 begins, the JSON deserialization layer targets moving types. **Risk level**: Medium. **Mitigation**: Phase 1 conditions (entity struct definitions) should be resolved before Phase 2 begins.
- **Phase 7 dependency**: Phase 2's output writing API (GAP-020) is consumed by Phase 7. Since Phase 2 does not implement output writing, there is no risk to Phase 2 itself. The risk is to Phase 7 if the output API is not designed during Phase 2.
- **Phase 8 dependency**: cobre-cli calls `load_case` and orchestrates broadcast. If the broadcast helper location (cobre-io vs cobre-cli) changes, Phase 8 integration is affected. Low risk because the protocol is fully specified.

### 3.6 Phase 2 Verdict: CONDITIONALLY READY

**Rationale**: The input loading pipeline is substantially complete. The `load_case` function, file loading sequence, five-layer validation architecture, broadcast protocol, and all data format schemas are fully specified. The blocking condition is GAP-029: the cross-reference validation checklist must be complete before an implementer can build the validation pipeline to specification.

**Conditions for READY**:

1. Resolve GAP-029: enumerate all entity cross-reference checks in `input-loading-pipeline.md` SS2.6 (report-009 estimated effort: 2-3 days)

---

## 4. Phase 3 Assessment: ferrompi + cobre-solver -- MPI Bindings and LP Solver

### 4.1 Spec Reading List Completeness

The Phase 3 reading list contains 10 specs split across two crates:

**ferrompi** (4 specs): Hybrid Parallelism, Communication Patterns, Shared Memory Aggregation, Synchronization

**cobre-solver** (6 specs): Solver Abstraction, Solver Interface Trait, Solver HiGHS Implementation, Solver Workspaces, LP Formulation, Memory Architecture

**Assessment**: The reading list is comprehensive for both crates. Report-004 confirms all 10 `SolverInterface` trait methods are fully specified with HiGHS backend mapping. Report-008 confirms the ferrompi API reference (SS7) covers all types, functions, and error handling.

**Gap in reading list**: The `solver-interface-testing.md` spec is not in the reading list but contains the conformance test definitions. An implementer writing tests would need it. This is a minor omission since testing specs are typically consulted during implementation, not during initial design reading.

### 4.2 Testable Intermediate Achievability

The Phase 3 testable intermediate specifies:

> `ferrompi`: MPI init/finalize, allreduce, allgatherv, broadcast, barrier, SharedWindow creation, topology detection.
> `cobre-solver`: load a stage LP into HiGHS, solve, extract primals/duals/reduced costs, warm-start from basis, add cut rows via batch `addRows`

**ferrompi achievable capabilities** (report-008):

- `Mpi` RAII guard lifecycle -- COMPLETE (SS7.1: init, world, Drop)
- `Communicator` methods (allreduce, allgatherv, broadcast, barrier) -- COMPLETE (SS7.2)
- `SharedWindow<T>` operations -- COMPLETE (SS7.3: allocate, local_slice, fence)
- `MpiDatatype` implementations -- COMPLETE (7 types documented)
- `ThreadLevel` enum -- COMPLETE
- `ReduceOp` enum -- COMPLETE
- `Error`/`MpiErrorClass` -- COMPLETE

**ferrompi blocked or degraded capabilities** (report-008):

- `ferrompi::slurm` module -- report-008 F-001 (High): referenced in 4 HPC specs but not documented in SS7. This module provides SLURM topology detection, needed for shared-node communicator creation.
- `Mpi` guard storage in `FerrompiBackend` -- report-008 F-002 (High): the struct definition does not store the `Mpi` guard, creating a potential use-after-finalize bug.
- Stale API names -- report-008 F-003/F-004/F-005: `split_shared_memory()` (5 occurrences across 3 files) and `init_with_threading()` (1 occurrence) use pre-rename names.

**cobre-solver achievable capabilities** (report-004):

- `SolverInterface` trait (10 methods) -- COMPLETE (report-004 section 3.1: all signatures, pre/postconditions, fallibility classification)
- `SolverError` enum (6 variants) -- COMPLETE (report-004 section 3.2: hard-stop vs proceed-with-partial mapping)
- `StageTemplate` (13 fields) -- COMPLETE (report-004 section 3.3)
- `CutBatch` (5 fields) -- COMPLETE (report-004 section 1.1)
- `Basis` and `BasisStatus` -- COMPLETE (report-004 section 1.1)
- `LpSolution` (6 fields) -- COMPLETE (report-004 section 1.1)
- `SolverStatistics` (6 fields) -- COMPLETE (report-004 section 1.1)
- HiGHS backend mapping (all 10 methods to C API calls) -- COMPLETE (report-004 section 3.5)
- HiGHS retry escalation (5-step) -- COMPLETE (report-004 section 1.4)

**cobre-solver blocked or degraded capabilities** (report-004):

- `StageIndexer` defined in `training-loop.md`, not in a solver spec -- report-004 F-001 (Low): ownership ambiguity between cobre-solver, cobre-core, and cobre-sddp
- Workspace type has no Rust struct definition -- report-004 F-002 (Medium): behavioral spec thorough but no `SolverWorkspace<S>` or `WorkspaceManager` struct
- HiGHS dual sign convention deferred -- report-004 F-005 (Medium): canonical convention specified, but HiGHS-specific sign analysis not performed
- `patch_rhs_bounds` naming inconsistency in testing spec -- report-004 F-007 (High): 6 occurrences of old name in `solver-interface-testing.md`

### 4.3 Gap Impact on Phase

| Gap ID  | Description                                                         | Classification (report-009) | Impact on Phase 3                                                                                                           |
| ------- | ------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| GAP-019 | Solver retry configuration parameters missing from config reference | Resolve-During-Phase        | Retry logic is internal to cobre-solver with hardcoded defaults. Implementer can hardcode defaults and expose config later. |

Phase 3 has exactly 1 gap from the triage. Report-009 classifies GAP-019 as Resolve-During-Phase: "the implementer can hardcode the existing defaults (5 attempts, time budget) and expose configuration later." The retry contract is fully specified in Solver Abstraction SS7.1.

**Note**: Although GAP-019 is assigned to Phase 6 in report-009's phase column (because the config is consumed during training), the retry logic implementation occurs in Phase 3 (cobre-solver). The classification as Resolve-During-Phase applies regardless of which phase implements it.

### 4.4 Implicit Knowledge Gaps

1. **StageTemplate and StageIndexer ownership**: Report-004 F-006 (Medium) documents a three-way ambiguity. The solver-interface-trait.md says cobre-sddp constructs `StageTemplate`; the ticket context says they are cobre-core types; the training-loop.md defines `StageIndexer` without naming its owning crate. The implementer must decide the crate boundary before writing code, because the decision determines Cargo dependency direction. Report-004 recommends: cobre-core defines both types, cobre-sddp constructs them, cobre-solver consumes them as opaque CSC data.

2. **HiGHS dual sign convention**: Report-004 F-005 (Medium) notes the canonical sign convention is fully specified ($\partial z^* / \partial b > 0$ for $\leq$ constraints) but the actual HiGHS sign convention is not documented. The spec says "must be verified" -- meaning verification was deferred to implementation time. Report-004 recommends documenting the convention and adding a finite-difference sensitivity check to conformance tests before Phase 3 begins.

3. **HiGHS C API linkage strategy**: The spec documents individual C API calls (`Highs_passLp`, `Highs_addRows`, etc.) but does not specify the Rust FFI linkage mechanism -- whether to use `highs-sys` crate bindings, raw `extern "C"` declarations, or a custom `-sys` crate. This affects build system configuration.

4. **`patch_rhs_bounds` vs `patch_row_bounds` naming inconsistency**: Report-004 F-007 (High) documents that `solver-interface-testing.md` uses the pre-rename name `patch_rhs_bounds` in 6 occurrences, while the trait spec uses the post-rename name `patch_row_bounds`. Additionally, the testing spec enumerates only 9 methods (omitting `patch_col_bounds`), while the trait has 10 methods. An implementer using the testing spec as a test plan would write tests against the wrong method name.

### 4.5 Cross-Phase Dependency Risks

- **Phase 1 dependency (cobre-solver only)**: cobre-solver depends on cobre-core for LP layout types. If `StageTemplate` and `StageIndexer` are cobre-core types (as the ticket context suggests), they must be defined in Phase 1. If they are cobre-solver types, Phase 3 is self-contained for type definitions. **Risk level**: Medium due to the ownership ambiguity (F-006).
- **Phase 1 independence (ferrompi)**: ferrompi has no in-workspace dependencies. It can be developed in parallel with Phases 1-2. **Risk level**: None.
- **Phase 4 downstream**: cobre-comm wraps ferrompi. Stale API names in HPC specs (report-008 F-003/F-004/F-005) could cause confusion when Phase 4 implementers read the communicator-trait.md spec and encounter `split_shared_memory()` instead of the actual `split_shared()`. **Risk level**: Low (mechanical rename).
- **Phase 6 downstream**: The `SolverInterface` trait is consumed by the training loop. The dual normalization convention (F-005) must be correct before Phase 6 generates cuts, or the outer approximation will diverge. **Risk level**: High for correctness, but the verification can be performed during Phase 3 testing.

### 4.6 Phase 3 Verdict: CONDITIONALLY READY

**Rationale**: Phase 3 has the most thoroughly specified API surfaces in the Cobre ecosystem. The `SolverInterface` trait (10 methods, all COMPLETE), `SolverError` (6 variants), `StageTemplate` (13 fields), and the full HiGHS backend mapping are production-ready. ferrompi's API reference (SS7) is comprehensive with 17 types and 36 functions. The conditions below address naming consistency and ownership clarity that, if left unresolved, would cause implementer confusion and potential correctness issues.

**Conditions for READY**:

1. Fix `patch_rhs_bounds` to `patch_row_bounds` in `solver-interface-testing.md` and add `patch_col_bounds` tests (report-004 F-007 -- High)
2. Clarify `StageTemplate` and `StageIndexer` crate ownership (report-004 F-006 -- Medium)
3. Fix `Mpi` RAII guard lifetime in `FerrompiBackend` struct definition (report-008 F-002 -- High)
4. Fix stale API names: `split_shared_memory()` to `split_shared()` in 3 files, `init_with_threading()` to `Mpi::init_thread()` in 1 file (report-008 F-003/F-004/F-005 -- Medium)

---

## 5. Phase 4 Assessment: cobre-comm -- Communication Backend Abstraction

### 5.1 Spec Reading List Completeness

The Phase 4 reading list contains 4 specs:

1. Communicator Trait
2. Backend Selection
3. Backend: Ferrompi
4. Backend: Local

**Assessment**: The reading list covers all crate concerns. Report-006 confirms the `Communicator` trait (6 methods), `SharedMemoryProvider` trait (3 methods), `SharedRegion<T>` trait (3 methods), `CommError` (5 variants), `CommBackend` enum dispatch, and both backend implementations are fully specified from these sources.

### 5.2 Testable Intermediate Achievability

The Phase 4 testable intermediate specifies:

> `Communicator` trait with MPI backend: multi-rank allreduce (Sum, Min, Max), allgatherv with variable-length buffers, broadcast from root, barrier synchronization. `LocalCommunicator` for single-process testing. Backend selection factory (`create_communicator()`). Integration test: 4-rank allgatherv round-trip

**Achievable capabilities** (report-006):

- `Communicator` trait -- COMPLETE (6 methods, all with full Rust signatures, pre/postconditions, error semantics, thread safety, determinism guarantees)
- `SharedMemoryProvider` trait -- COMPLETE (3 methods with associated type `Region<T>`)
- `SharedRegion<T>` trait -- COMPLETE (3 methods with read/write phase semantics)
- `CommError` enum -- COMPLETE (5 variants with structured fields)
- `CommBackend` enum -- COMPLETE (variant-per-backend, feature-gated)
- `FerrompiBackend` -- COMPLETE ferrompi-to-trait method mapping table (report-006 section 1.4)
- `LocalBackend` -- COMPLETE identity-semantic implementations (report-006 section 1.4)
- `create_communicator()` factory -- COMPLETE (single-feature and multi-feature paths, report-006 section 1.2)
- `CommData` bound -- COMPLETE (`Copy + Send + Sync + 'static`)
- `BackendKind` for multi-feature selection -- COMPLETE (report-006 section 1.1)

**Findings requiring attention** (report-006):

- `CommBackend` enum dispatch does not implement `SharedMemoryProvider` -- report-006 F-005 (High): the associated type `Region<T>` cannot unify across backend region types in the enum. Spec recommends `Box<dyn SharedRegion<T>>` since `create_shared_region` is initialization-only.
- `HeapRegion` initialization uses `T::default()` but `CommData` lacks `Default` -- report-006 F-001 (Medium): compilation error, fix is `zeroed()` or add `Default` to `CommData`.
- Single-feature factory return type omits `SharedMemoryProvider` -- report-006 F-004 (Medium): `impl Communicator` should be `impl Communicator + SharedMemoryProvider`.

### 5.3 Gap Impact on Phase

No gaps from the triage (report-009) are assigned to Phase 4. The closest is GAP-033 (`SharedMemoryProvider` bound inconsistency), classified as Resolve-During-Phase and assigned to Phase 6. Report-009 rationale: "The Communicator Trait SS4.5 explicitly states: 'All four backend types implement both traits, so the `C: Communicator + SharedMemoryProvider` bound is always satisfiable.' The gap is about documentation consistency, not about a missing type or unsatisfiable bound."

Phase 4 has zero Resolve-Before-Coding gaps.

### 5.4 Implicit Knowledge Gaps

1. **`CommBackend` SharedMemoryProvider strategy**: Report-006 F-005 identifies the structural challenge: the `CommBackend` enum's `Region<T>` associated type must unify across different backend region types. The spec suggests `Box<dyn SharedRegion<T>>` for the initialization-only allocation path. An implementer must decide whether this boxing is acceptable or whether a different dispatch strategy is needed.

2. **`CommData` vs `MpiDatatype` bound narrowing**: Report-006 F-010 notes that `CommData` is broader than `MpiDatatype`. The `FerrompiBackend` impl must add `where T: MpiDatatype` bounds on each method, which is valid Rust (narrowing of trait bounds). The implementer must understand this pattern.

3. **TCP/Shm backend stubs**: Report-006 F-002 notes that `TcpConfig` and `ShmConfig` struct stubs are needed for the `BackendKind` enum to compile when those features are disabled. The stubs are trivial but not specified.

### 5.5 Cross-Phase Dependency Risks

- **Phase 3 dependency**: cobre-comm depends on ferrompi for the MPI backend. The stale API names in ferrompi specs (report-008 F-003/F-004/F-005) could cause confusion if not fixed before Phase 4. **Risk level**: Low. If Phase 3 conditions are met (fixing stale names), this risk is eliminated.
- **Phase 1 dependency**: cobre-comm depends on cobre-core only for error type integration (`CommError` kinds). The `System` struct and entity types are not needed. **Risk level**: Negligible.
- **Phase 6 downstream**: The `Communicator` trait is consumed by the training loop for cut synchronization and bound aggregation. The combined `C: Communicator + SharedMemoryProvider` bound must work correctly. Report-006 F-005 and F-004 address this. **Risk level**: Low if F-005 and F-004 are resolved during Phase 4 implementation.

### 5.6 Phase 4 Verdict: READY

**Rationale**: cobre-comm has the most completely specified trait contracts of any Phase 1-4 crate. All three traits (`Communicator`, `SharedMemoryProvider`, `SharedRegion<T>`) are fully defined with Rust signatures, all error types are complete, both backend implementations are mapped, and the factory function is specified. The findings from report-006 (F-005, F-001, F-004) are Resolve-During-Phase design decisions that do not require pre-coding spec changes -- they concern implementation strategy choices (boxing for enum dispatch, trait bound additions) that an experienced Rust developer can resolve inline.

Zero gaps from the triage are assigned to Phase 4. All report-006 findings are local to cobre-comm and do not affect upstream or downstream crate boundaries at the type level.

---

## 6. Cross-Phase Summary Table

| Phase | Crates                  | Verdict             | Resolve-Before-Coding Gaps | Resolve-During-Phase Gaps | Spec Completeness                          | Blocking Conditions                                                                                                                            |
| ----- | ----------------------- | ------------------- | -------------------------- | ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | cobre-core              | CONDITIONALLY READY | 0                          | 1 (GAP-031)               | 47% (36/76 COMPLETE)                       | Entity struct definitions (Bus, Line, Thermal, Hydro); `EntityId` type; `Stage`/`Block`/`PolicyGraph` structs                                  |
| 2     | cobre-io                | CONDITIONALLY READY | 1 (GAP-029)                | 0                         | Input: high; Output: low                   | GAP-029: complete cross-reference validation checklist                                                                                         |
| 3     | ferrompi + cobre-solver | CONDITIONALLY READY | 0                          | 1 (GAP-019)               | solver: 79% (38/48); ferrompi: 96% (70/73) | `patch_rhs_bounds` rename in testing spec; `StageTemplate`/`StageIndexer` ownership; ferrompi `Mpi` guard lifetime; stale API names in 4 files |
| 4     | cobre-comm              | READY               | 0                          | 0                         | 77% (43/56 COMPLETE)                       | --                                                                                                                                             |

**Key observation**: No phase is NOT READY. All three CONDITIONALLY READY phases have conditions that are spec updates (not architectural redesign). The total estimated pre-coding effort across all conditions is moderate.

---

## 7. Pre-Coding Conditions Inventory

This section consolidates all Resolve-Before-Coding gaps and High/Medium-severity findings from crate reports that must be addressed before their respective phases begin coding. Only items that would prevent an implementer from writing correct code are included.

### 7.1 Phase 1 Conditions

| ID    | Source           | Description                                                                     | Effort Estimate | Dependency |
| ----- | ---------------- | ------------------------------------------------------------------------------- | --------------- | ---------- |
| PC-01 | Report-001 F-001 | Add Rust struct definitions for Bus, Line, Thermal, Hydro (and 3 stub entities) | 1-2 days        | None       |
| PC-02 | Report-001 F-002 | Define `EntityId` as concrete type (e.g., `u32` newtype) or type alias          | Hours           | None       |
| PC-03 | Report-001 F-005 | Add Rust struct definitions for `Stage`, `Block`, `PolicyGraph`                 | 1 day           | None       |

**Total Phase 1 pre-coding effort**: 2-4 days

### 7.2 Phase 2 Conditions

| ID    | Source  | Description                                                                    | Effort Estimate | Dependency                       |
| ----- | ------- | ------------------------------------------------------------------------------ | --------------- | -------------------------------- |
| PC-04 | GAP-029 | Enumerate all entity cross-reference checks in input-loading-pipeline.md SS2.6 | 2-3 days        | All entity specs must be audited |

**Total Phase 2 pre-coding effort**: 2-3 days

### 7.3 Phase 3 Conditions

| ID    | Source                       | Description                                                                                                    | Effort Estimate | Dependency |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| PC-05 | Report-004 F-007             | Rename `patch_rhs_bounds` to `patch_row_bounds` in `solver-interface-testing.md`; add `patch_col_bounds` tests | Hours           | None       |
| PC-06 | Report-004 F-006             | Clarify `StageTemplate` and `StageIndexer` crate ownership (cobre-core vs cobre-solver)                        | Hours           | None       |
| PC-07 | Report-008 F-002             | Fix `Mpi` RAII guard lifetime in `FerrompiBackend` struct definition                                           | Hours           | None       |
| PC-08 | Report-008 F-003/F-004/F-005 | Fix stale API names in 4 spec files (7 occurrences total)                                                      | Hours           | None       |

**Total Phase 3 pre-coding effort**: 1-2 days

### 7.4 Phase 4 Conditions

None. Phase 4 is READY with no pre-coding conditions.

### 7.5 Aggregate Pre-Coding Effort

| Phase     | Conditions | Estimated Effort |
| --------- | ---------- | ---------------- |
| 1         | 3          | 2-4 days         |
| 2         | 1          | 2-3 days         |
| 3         | 4          | 1-2 days         |
| 4         | 0          | 0                |
| **Total** | **8**      | **5-9 days**     |

**Sequencing note**: Phase 1 and Phase 3 conditions are independent (no shared dependencies) and can be resolved in parallel. Phase 2's GAP-029 requires all entity specs to be audited, which overlaps with the Phase 1 entity struct definition work (PC-01). Resolving PC-01 first may accelerate GAP-029 resolution by providing concrete type definitions to enumerate cross-references against.
