# Report 001 -- cobre-core API Surface Completeness Audit

**Crate**: cobre-core
**Phase**: 1 (Foundation)
**Auditor**: data-model-format-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name               | Category            | Spec File                   | Section | Status   | Notes                                                                                                                                                                           |
| ----------------------- | ------------------- | --------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `System`                | Struct              | `internal-structures.md`    | SS1.3   | COMPLETE | All fields specified with Rust types; dual-nature design documented (SS1.1); public fields and private `HashMap` indices identified                                             |
| `Bus`                   | Struct              | `internal-structures.md`    | SS6     | PARTIAL  | Fields listed by name (id, name, deficit_segments, excess_cost) but no Rust struct definition with concrete types; references input-system-entities.md SS1 for JSON field types |
| `Line`                  | Struct              | `internal-structures.md`    | SS5     | PARTIAL  | Fields listed by name (id, name, source/target bus IDs, lifecycle, capacity, exchange_cost, losses_percent) but no Rust struct definition                                       |
| `Hydro`                 | Struct              | `internal-structures.md`    | SS3     | PARTIAL  | Most comprehensive entity spec. Tagged union generation model documented. No Rust struct definition -- fields described in prose/tables                                         |
| `Thermal`               | Struct              | `internal-structures.md`    | SS4     | PARTIAL  | Fields listed (id, name, bus, lifecycle, cost_segments, generation bounds) but no Rust struct definition                                                                        |
| `PumpingStation`        | Struct              | `internal-structures.md`    | SS7     | PARTIAL  | Fields listed (id, name, bus, source/dest hydro, lifecycle, consumption rate, flow bounds) but no Rust struct definition                                                        |
| `EnergyContract`        | Struct              | `internal-structures.md`    | SS8     | PARTIAL  | Fields listed (id, name, bus, type, lifecycle, price, limits) but no Rust struct definition                                                                                     |
| `NonControllableSource` | Struct              | `internal-structures.md`    | SS9     | PARTIAL  | Fields listed (id, name, bus, lifecycle, max_generation_mw) but no Rust struct definition                                                                                       |
| `EntityId`              | Type alias          | `internal-structures.md`    | SS1.3   | MISSING  | Used throughout as `EntityId` in `HashMap<EntityId, usize>` and lookup methods, but never defined as a concrete type (i32? u32? newtype?)                                       |
| `CascadeTopology`       | Struct              | `internal-structures.md`    | SS1.5   | PARTIAL  | Responsibilities documented (downstream/upstream adjacency, travel times, topological order) but no Rust struct definition with field types                                     |
| `NetworkTopology`       | Struct              | `internal-structures.md`    | SS1.5b  | PARTIAL  | Responsibilities documented (bus-line incidence, line endpoints, bus generation/load maps) but no Rust struct definition with field types                                       |
| `Stage`                 | Struct              | `internal-structures.md`    | SS12    | PARTIAL  | Fields listed (id, start/end date, season_id, blocks, block_mode, state_variables, risk_measure, num_scenarios, sampling_method) but no Rust struct; date type unspecified      |
| `Block`                 | Struct              | `internal-structures.md`    | SS12    | PARTIAL  | Fields listed (id, name, hours, derived weight) but no Rust struct definition                                                                                                   |
| `PolicyGraph`           | Struct              | `internal-structures.md`    | SS12    | PARTIAL  | Fields listed (type, annual_discount_rate, transitions) but no Rust struct definition; transition tuple type not formalized                                                     |
| `ResolvedPenalties`     | Struct              | `internal-structures.md`    | SS10    | PARTIAL  | Semantics and all penalty types thoroughly documented per entity category; no Rust struct definition; storage strategy (2D array? HashMap?) unspecified                         |
| `ResolvedBounds`        | Struct              | `internal-structures.md`    | SS11    | PARTIAL  | All bound fields per entity type documented; no Rust struct definition; storage strategy unspecified                                                                            |
| `ParModel`              | Struct              | `internal-structures.md`    | SS14    | PARTIAL  | Fields listed (mean_m3s, std_m3s, ar_order, coefficients) but no Rust struct definition                                                                                         |
| `CorrelationModel`      | Struct              | `internal-structures.md`    | SS14    | PARTIAL  | Responsibilities documented (profiles, groups, Cholesky-decomposed matrices, schedule) but no Rust struct definition                                                            |
| `InitialConditions`     | Struct              | `internal-structures.md`    | SS16    | PARTIAL  | Three categories documented (operating storage, filling storage, GNL pipeline) but no Rust struct definition                                                                    |
| `GenericConstraint`     | Struct              | `internal-structures.md`    | SS15    | PARTIAL  | Fields and variable reference catalog documented; no Rust struct definition for the constraint or its parsed expression type                                                    |
| `TrainingEvent`         | Enum                | `training-loop.md`          | SS2.1b  | COMPLETE | Full Rust enum definition with 11 variants (7 per-iteration + 4 lifecycle), all field names and types specified, derive traits documented (`Clone`, `Debug`)                    |
| `StoppingRuleResult`    | Struct              | `training-loop.md`          | SS2.1b  | COMPLETE | Full Rust struct definition with 3 fields (`rule_name: String`, `triggered: bool`, `detail: String`), derive traits documented                                                  |
| `LoadError`             | Enum                | `input-loading-pipeline.md` | SS8.1   | COMPLETE | Full Rust enum definition with 5 variants, all fields typed, `#[derive(Debug, thiserror::Error)]` specified, recovery table provided                                            |
| `DeficitSegment`        | Struct              | `input-system-entities.md`  | SS1     | PARTIAL  | JSON fields specified (`depth_mw: f64 or null`, `cost: f64`) but no Rust struct definition; the nullable-f64 representation needs a Rust type decision                          |
| `HydroGenerationModel`  | Enum (tagged union) | `input-system-entities.md`  | SS3     | PARTIAL  | Three variants documented with JSON schemas and field tables; no Rust enum definition                                                                                           |
| `ContractType`          | Enum                | `input-system-entities.md`  | SS6     | PARTIAL  | Two variants (`import`, `export`) documented in JSON; no Rust enum definition                                                                                                   |
| `OperativeState`        | Enum                | `internal-structures.md`    | SS2     | PARTIAL  | Four states documented (`NonExisting`, `Filling`, `Operating`, `Decommissioned`) with LP treatment; no Rust enum definition                                                     |
| `BlockMode`             | Enum                | `internal-structures.md`    | SS12    | PARTIAL  | Two variants (`parallel`, `chronological`) documented; no Rust enum definition                                                                                                  |
| `PolicyGraphType`       | Enum                | `internal-structures.md`    | SS12    | PARTIAL  | Two variants (`finite_horizon`, `cyclic`) documented; no Rust enum definition                                                                                                   |
| `VariableReference`     | Enum                | `internal-structures.md`    | SS15    | PARTIAL  | 18 variants cataloged with entity type and block-specificity; no Rust enum definition                                                                                           |

### 1.2 Public Functions

| Item Name                              | Category | Spec File                | Section       | Status   | Notes                                                                                                                                                                                                                                                                             |
| -------------------------------------- | -------- | ------------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `System::buses()`                      | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn buses(&self) -> &[Bus]` -- full signature                                                                                                                                                                                                                                 |
| `System::lines()`                      | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn lines(&self) -> &[Line]` -- full signature                                                                                                                                                                                                                                |
| `System::hydros()`                     | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn hydros(&self) -> &[Hydro]` -- full signature                                                                                                                                                                                                                              |
| `System::thermals()`                   | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn thermals(&self) -> &[Thermal]` -- full signature                                                                                                                                                                                                                          |
| `System::pumping_stations()`           | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn pumping_stations(&self) -> &[PumpingStation]` -- full signature                                                                                                                                                                                                           |
| `System::contracts()`                  | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn contracts(&self) -> &[EnergyContract]` -- full signature                                                                                                                                                                                                                  |
| `System::non_controllable_sources()`   | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn non_controllable_sources(&self) -> &[NonControllableSource]` -- full signature                                                                                                                                                                                            |
| `System::n_buses()`                    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_buses(&self) -> usize` -- full signature                                                                                                                                                                                                                                |
| `System::n_lines()`                    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_lines(&self) -> usize` -- full signature                                                                                                                                                                                                                                |
| `System::n_hydros()`                   | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_hydros(&self) -> usize` -- full signature                                                                                                                                                                                                                               |
| `System::n_thermals()`                 | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_thermals(&self) -> usize` -- full signature                                                                                                                                                                                                                             |
| `System::n_pumping_stations()`         | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_pumping_stations(&self) -> usize` -- full signature                                                                                                                                                                                                                     |
| `System::n_contracts()`                | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_contracts(&self) -> usize` -- full signature                                                                                                                                                                                                                            |
| `System::n_non_controllable_sources()` | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn n_non_controllable_sources(&self) -> usize` -- full signature                                                                                                                                                                                                             |
| `System::bus()`                        | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn bus(&self, id: EntityId) -> Option<&Bus>` -- full signature                                                                                                                                                                                                               |
| `System::line()`                       | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn line(&self, id: EntityId) -> Option<&Line>` -- full signature                                                                                                                                                                                                             |
| `System::hydro()`                      | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn hydro(&self, id: EntityId) -> Option<&Hydro>` -- full signature                                                                                                                                                                                                           |
| `System::thermal()`                    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn thermal(&self, id: EntityId) -> Option<&Thermal>` -- full signature                                                                                                                                                                                                       |
| `System::pumping_station()`            | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn pumping_station(&self, id: EntityId) -> Option<&PumpingStation>` -- full signature                                                                                                                                                                                        |
| `System::contract()`                   | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn contract(&self, id: EntityId) -> Option<&EnergyContract>` -- full signature                                                                                                                                                                                               |
| `System::non_controllable_source()`    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn non_controllable_source(&self, id: EntityId) -> Option<&NonControllableSource>` -- full signature                                                                                                                                                                         |
| `System::cascade()`                    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn cascade(&self) -> &CascadeTopology` -- full signature                                                                                                                                                                                                                     |
| `System::network()`                    | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn network(&self) -> &NetworkTopology` -- full signature                                                                                                                                                                                                                     |
| `System::stages()`                     | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn stages(&self) -> &[Stage]` -- full signature                                                                                                                                                                                                                              |
| `System::policy_graph()`               | Method   | `internal-structures.md` | SS1.4         | COMPLETE | `pub fn policy_graph(&self) -> &PolicyGraph` -- full signature                                                                                                                                                                                                                    |
| Penalty resolution functions           | Function | `penalty-system.md`      | SS1           | MISSING  | The three-tier cascade resolution is documented semantically but no public API function signature is specified for resolving penalties. Resolution happens inside `load_case` (cobre-io), so this may not need a cobre-core public API, but there is no specification either way. |
| Topology construction functions        | Function | `internal-structures.md` | SS1.5, SS1.5b | MISSING  | `CascadeTopology` and `NetworkTopology` are produced during loading but no constructor or factory function signatures exist                                                                                                                                                       |
| `System` construction                  | Function | `internal-structures.md` | SS1.3         | MISSING  | No `System::new()` or builder pattern specified. The System is produced by `load_case` (cobre-io) but the construction interface is unspecified.                                                                                                                                  |

### 1.3 Error Types

| Item Name                     | Category   | Spec File                    | Section | Status   | Notes                                                                                                                                                                                                                                                              |
| ----------------------------- | ---------- | ---------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LoadError`                   | Enum       | `input-loading-pipeline.md`  | SS8.1   | COMPLETE | 5 variants fully typed: `IoError`, `ParseError`, `SchemaError`, `CrossReferenceError`, `ConstraintError`. Derives `Debug` + `thiserror::Error`. Phase mapping table provided.                                                                                      |
| Validation error kinds        | Catalog    | `validation-architecture.md` | SS4     | PARTIAL  | 14 error kinds cataloged (12 errors + 2 warnings) with severity and examples, but no Rust enum definition. The catalog is a conceptual taxonomy, not a concrete type. The relationship between these kinds and `LoadError` variants is implied but not formalized. |
| `ValidationReport`            | Struct     | `validation-architecture.md` | SS5     | PARTIAL  | JSON schema for the report is specified but no Rust struct definition. It is unclear whether this is a cobre-core type or a cobre-io/cobre-cli concern.                                                                                                            |
| Topology validation errors    | Error type | --                           | --      | MISSING  | Cycle detection errors and cascade redirection failures are described in validation-architecture.md SS2.5 (semantic rules) but are folded into the general validation error catalog. No dedicated topology error type is specified.                                |
| `LoadError` recovery contract | Contract   | `input-loading-pipeline.md`  | SS8.1   | COMPLETE | All variants carry enough context for diagnostics. Fail-fast behavior documented. No retry contract (loading is not retryable).                                                                                                                                    |

### 1.4 Trait Implementations

| Item Name                                                  | Category    | Spec File                   | Section | Status   | Notes                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------- | --------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rkyv::Archive + Serialize + Deserialize` for entity types | Derive      | `input-loading-pipeline.md` | SS6.2   | COMPLETE | Complete list of types requiring rkyv derives enumerated. Example derive macro shown. Alignment requirements (16-byte) documented. HashMap exclusion rule documented.                                                                                             |
| `Send + Sync` for `System`                                 | Trait bound | `internal-structures.md`    | SS1.6   | COMPLETE | Required for MPI broadcast and OpenMP-style thread sharing. Rationale documented. All nested types must satisfy transitively.                                                                                                                                     |
| `Clone + Debug` for `TrainingEvent`                        | Derive      | `training-loop.md`          | SS2.1b  | COMPLETE | Explicitly stated. `Send + Sync` explicitly NOT required (ownership transfer via channel).                                                                                                                                                                        |
| `Debug + thiserror::Error` for `LoadError`                 | Derive      | `input-loading-pipeline.md` | SS8.1   | COMPLETE | Error display formats specified via `#[error(...)]` attribute macros.                                                                                                                                                                                             |
| `serde::Serialize + Deserialize` for entity types          | Derive      | --                          | --      | MISSING  | Entity types need serde derives for JSON loading (cobre-io) but no spec documents this requirement. The rkyv requirement (SS6.2) is for broadcast; serde would be needed for initial JSON/Parquet parsing. This may be a cobre-io concern rather than cobre-core. |
| `Display` for entity types                                 | Trait       | --                          | --      | MISSING  | No spec documents Display formatting expectations for entity types, which would be needed for error messages, logging, and CLI output.                                                                                                                            |
| `PartialEq` for entity types                               | Derive      | `input-loading-pipeline.md` | SS6.2   | PARTIAL  | The rkyv derive example shows `#[rkyv(compare(PartialEq))]` but this is for archived comparison. Whether entity types themselves need `PartialEq` for testing or validation is unspecified.                                                                       |

### 1.5 Crate Boundary Interactions

| Boundary                       | Consumer Spec                         | Status   | Notes                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-io -> cobre-core         | `input-loading-pipeline.md` SS8.1     | PARTIAL  | `load_case` returns `Result<System, LoadError>`. `System` and `LoadError` are in cobre-core. The `load_case` function itself is in cobre-io. The boundary is specified from the cobre-io side. However, the `System` construction mechanism (how cobre-io builds a `System`) is unspecified -- no builder or constructor API.               |
| cobre-stochastic -> cobre-core | `internal-structures.md` SS14         | PARTIAL  | `ParModel` and `CorrelationModel` are consumed by the scenario pipeline. The types are in cobre-core. But cobre-stochastic's consuming function signatures are not specified in any cobre-stochastic spec.                                                                                                                                  |
| cobre-solver -> cobre-core     | `solver-interface-trait.md` SS4.4     | COMPLETE | `StageTemplate` is in cobre-solver (not cobre-core). `StageTemplate` construction consumes `&System`. The `SolverInterface::load_model` takes `&StageTemplate`. The boundary is well-defined. Note: `StageTemplate` and `StageIndexer` are NOT cobre-core types despite the ticket mentioning them; they belong to cobre-sddp/cobre-solver. |
| cobre-sddp -> cobre-core       | `internal-structures.md` SS1.7        | PARTIAL  | `train(system: &System, config: &TrainingConfig, comm: &C) -> Result<TrainingResult, TrainError>` is sketched. `System` is cobre-core. But `TrainingConfig`, `TrainingResult`, and `TrainError` are not defined in any cobre-core spec (they belong to cobre-sddp).                                                                         |
| cobre-comm -> cobre-core       | `input-loading-pipeline.md` SS6.1-6.3 | PARTIAL  | The broadcast protocol uses rkyv-serialized `System`. The comm layer consumes cobre-core types for serialization. But the specific comm function that takes `&System` and broadcasts it is not fully specified at both sides.                                                                                                               |
| cobre-cli -> cobre-core        | `training-loop.md` SS2.1b             | PARTIAL  | cobre-cli consumes `TrainingEvent` from cobre-core for logging/TUI. `System` is passed through. Config types mentioned but not specified as cobre-core types.                                                                                                                                                                               |

---

## 2. Category Summaries

| Category                    | COMPLETE | PARTIAL | MISSING | Total  |
| --------------------------- | -------- | ------- | ------- | ------ |
| Public Types                | 4        | 25      | 1       | 30     |
| Public Functions            | 25       | 0       | 3       | 28     |
| Error Types                 | 2        | 2       | 1       | 5      |
| Trait Implementations       | 4        | 1       | 2       | 7      |
| Crate Boundary Interactions | 1        | 5       | 0       | 6      |
| **Total**                   | **36**   | **33**  | **7**   | **76** |

---

## 3. Findings

### F-001: Entity type structs lack Rust definitions

**Severity**: High
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` sections 3-9 describe each entity type (Bus, Line, Hydro, Thermal, PumpingStation, EnergyContract, NonControllableSource) using prose and tables listing field names and conceptual types. For example, SS6 states:

> "Entity ID, name ... Deficit segments: Pre-resolved piecewise-linear deficit cost curve. Each segment has `depth_mw` and `cost`. ... Excess cost: Cost for surplus generation absorption"

But no Rust struct definition is provided for any entity type. Only the `System` struct (SS1.3) and `TrainingEvent` enum (training-loop.md SS2.1b) have concrete Rust definitions.

**Impact**: An implementer must infer Rust field names, types (e.g., is `name` a `String` or `&str`? Is `entry_stage_id` an `Option<i32>` or `Option<u32>`?), visibility (`pub` vs. `pub(crate)`), and derive macros for 7 entity structs. The JSON input schemas in `input-system-entities.md` provide field types (i32, f64, string, etc.) but these are JSON types, not Rust types -- the mapping is not always 1:1 (e.g., JSON `i32|null` could be `Option<i32>` or a sentinel value).

**Recommendation**: Add Rust struct sketches (comparable to the `System` struct sketch in SS1.3) for all 7 entity types in `internal-structures.md` sections 3-9. Each sketch should include field names, Rust types, visibility, and derive macros. The existing JSON field tables in `input-system-entities.md` provide sufficient source material for deriving these.

---

### F-002: `EntityId` type not defined

**Severity**: High
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS1.3 uses `EntityId` in the System struct definition:

> `bus_index: HashMap<EntityId, usize>`

and in the public API (SS1.4):

> `pub fn bus(&self, id: EntityId) -> Option<&Bus>`

But `EntityId` is never defined. The input schemas use `i32` for entity IDs (e.g., `input-system-entities.md` SS1: `id: i32`). It is unclear whether `EntityId` is a type alias (`type EntityId = i32`), a newtype wrapper (`struct EntityId(i32)`), or something else.

**Impact**: Every crate that references entities by ID depends on this type. A newtype wrapper would provide type safety (prevent mixing bus IDs with hydro IDs) but at the cost of ergonomics. A plain `i32` alias is simpler but less safe. This decision propagates to every entity struct, every lookup, and every cross-reference validation.

**Recommendation**: Define `EntityId` explicitly in `internal-structures.md` SS1. Given that input schemas use `i32` and the spec states "entity ID is the sole identifier" (design-principles.md SS3), the simplest approach is `type EntityId = i32`. If per-entity-type safety is desired (e.g., `BusId` vs. `HydroId`), this should be an explicit design decision documented in the spec.

---

### F-003: `CascadeTopology` and `NetworkTopology` lack Rust struct definitions

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS1.5 describes `CascadeTopology`:

> "Downstream adjacency: for each hydro, the ID of its immediate downstream hydro (after redirection), or `None` if it is a terminal node"
> "Upstream adjacency: for each hydro, the list of hydro IDs that flow into it"
> "Travel times: water travel delay from upstream to downstream, in stages"
> "Topological order: a pre-computed ordering of hydros such that every upstream plant appears before its downstream plant"

SS1.5b describes `NetworkTopology` similarly with bus-line incidence and generation/load maps.

Neither has a Rust struct definition. The internal data structures (adjacency list representation, HashMap, Vec of tuples, etc.) are left to the implementer.

**Impact**: LP construction depends on these topologies for water balance constraints (cascade) and power balance constraints (network). Without defined field types, the implementer must design the graph representation and the crate boundary is ambiguous.

**Recommendation**: Add Rust struct sketches for both types. For `CascadeTopology`, this would include: `downstream: Vec<Option<usize>>`, `upstream: Vec<Vec<usize>>`, `travel_times: Vec<Vec<u32>>`, `topological_order: Vec<usize>`. For `NetworkTopology`, similar adjacency structures for bus-line-generator relationships.

---

### F-004: `ResolvedPenalties` and `ResolvedBounds` lack storage design

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS10 states:

> "the implementation should build a resolved penalty lookup that can answer: 'what is the effective penalty for entity X, stage T, penalty type P?' in constant time"

SS11 similarly states constant-time bound lookup. The penalty types per entity are exhaustively cataloged (SS10 tables). However, no Rust struct definition or storage strategy is provided for either `ResolvedPenalties` or `ResolvedBounds`.

**Impact**: The storage design affects both memory layout and API surface. Options include: (a) a flat 2D array indexed by `(entity_index, stage_index)` per entity type, (b) a struct-of-arrays with one `Vec<f64>` per penalty type, (c) a single `HashMap<(EntityType, EntityId, StageId, PenaltyType), f64>`. The choice affects cache behavior during LP construction and serialization size for MPI broadcast.

**Recommendation**: Add Rust struct definitions for `ResolvedPenalties` and `ResolvedBounds`. Given the constant-time lookup requirement and the SDDP hot-path profile, a struct-of-arrays layout with `Vec<Vec<f64>>` indexed by `[entity_index][stage_index]` per penalty/bound field is the natural choice. This aligns with the dual-nature design principle (SS1.1) -- clarity-first for cobre-core.

---

### F-005: `Stage`, `Block`, and `PolicyGraph` lack Rust struct definitions

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS12 lists Stage fields:

> "`id` -- unique identifier (non-negative for study, negative for pre-study)"
> "`start_date`, `end_date` -- temporal extent"
> "`season_id` -- links to season definitions"
> "`blocks` -- ordered list of blocks"
> "`block_mode` -- `parallel` or `chronological`"

But no Rust struct is defined. The date type is unspecified (chrono::NaiveDate? String? custom type?). The `risk_measure` field type is listed as "expectation or CVaR parameters (alpha, lambda)" without a Rust enum.

**Impact**: `Stage` is used in `System::stages()` and drives LP dimensioning and scenario generation. Every crate consuming `System` needs to know the `Stage` field types. The date representation choice affects validation logic and serialization.

**Recommendation**: Add Rust struct definitions for `Stage`, `Block`, and `PolicyGraph` in internal-structures.md SS12. Define supporting enums (`BlockMode`, `PolicyGraphType`, `RiskMeasureConfig`) with explicit variants and fields.

---

### F-006: `ParModel` and `CorrelationModel` lack Rust struct definitions

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 2 (but types defined in Phase 1 crate)

**Evidence**: `src/specs/data-model/internal-structures.md` SS14 describes:

> "`mean_m3s` (mu) -- seasonal mean inflow"
> "`std_m3s` (sigma) -- seasonal standard deviation"
> "AR order `p` and coefficient list `[psi_1, ..., psi_p]` (variable length, can be 0)"

For `CorrelationModel`:

> "Named profiles, each containing correlation groups with entity lists and correlation matrices"
> "Stage-to-profile mapping (schedule) -- pre-resolved"
> "Cholesky-decomposed matrices ready for scenario generation"

No Rust struct definitions for either. The Cholesky matrix storage (dense 2D array? ndarray? flat Vec?) is unspecified.

**Impact**: cobre-stochastic depends on these types for scenario generation. The matrix representation choice affects SIMD/BLAS compatibility and performance.

**Recommendation**: Add Rust struct definitions for `ParModel` (per-hydro per-stage) and `CorrelationModel` (profiles with groups, matrices, and schedule). For correlation matrices, specify the storage format (e.g., `Vec<Vec<f64>>` for clarity-first in cobre-core, with a note that cobre-stochastic may build SIMD-friendly views).

---

### F-007: `System` construction API unspecified

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS1.7 documents the crate boundary contract:

> "`cobre_io::load_case(path: &Path) -> Result<System, LoadError>` -- loads, validates, and resolves all input files"

But there is no specification for how `cobre-io` constructs a `System`. The `System` struct has both public fields (entity collections) and private fields (HashMap indices). There is no `System::new()`, builder pattern, or factory function documented.

**Impact**: cobre-io must be able to construct a `System` with both public and private fields. Without a defined construction path, the implementer must choose between: (a) making all fields public (breaking encapsulation of HashMap indices), (b) providing a `System::new()` that takes all 19 fields, or (c) using a builder pattern. This is a crate API design decision that affects the cobre-core/cobre-io boundary.

**Recommendation**: Add a `System::new()` or `SystemBuilder` API in internal-structures.md SS1. The constructor should accept the entity collections and temporal/penalty/bounds data, then internally build the HashMap indices and validate canonical ordering. This keeps the construction logic within cobre-core while allowing cobre-io to provide the raw data.

---

### F-008: Validation error type not formalized as Rust type in cobre-core

**Severity**: Low
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/architecture/validation-architecture.md` SS4 provides a 14-entry error kind catalog:

> "`FileNotFound` (Error), `ParseError` (Error), `SchemaViolation` (Error), `InvalidReference` (Error), `DuplicateId` (Error), `InvalidValue` (Error), `CycleDetected` (Error), `DimensionMismatch` (Error), `BusinessRuleViolation` (Error), `WarmStartIncompatible` (Error), `ResumeIncompatible` (Error), `NotImplemented` (Error), `UnusedEntity` (Warning), `ModelQuality` (Warning)"

These are conceptual categories. The `LoadError` enum in `input-loading-pipeline.md` SS8.1 is the only concrete Rust error type and has 5 variants that do not map 1:1 to the 14 catalog entries.

**Impact**: The relationship between the validation error catalog (14 kinds) and `LoadError` (5 variants) is unclear. Are the 14 kinds mapped into 5 `LoadError` variants? Does cobre-core expose a `ValidationErrorKind` enum for the report? The validation report JSON uses `kind` strings matching the catalog -- is this serialized from a Rust enum or from a free-form string?

**Recommendation**: Clarify whether cobre-core defines a `ValidationErrorKind` enum matching the 14 catalog entries, or whether the catalog is purely a documentation artifact. If `LoadError` is the only Rust error type, document the mapping from the 14 kinds to the 5 `LoadError` variants.

---

### F-009: `serde` derive requirements for entity types not specified

**Severity**: Low
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/architecture/input-loading-pipeline.md` SS6.2 states:

> "All types that participate in the `System` broadcast must derive `rkyv::Archive`, `rkyv::Serialize`, and `rkyv::Deserialize`. The complete list of types requiring these trait bounds:"

The section then enumerates entity types under "Entity types:" and supporting types. However, there is no corresponding enumeration for `serde::Serialize + serde::Deserialize`, which entity types need for JSON/Parquet loading in cobre-io and for validation report serialization.

**Impact**: The implementer must determine independently which types need serde derives. In practice, all entity types need serde for loading, but this is an inference, not a specification.

**Recommendation**: Add a brief note in `internal-structures.md` SS1 or `input-loading-pipeline.md` SS6.2 listing which types require serde derives. This can be a simple statement: "All entity types, Stage, Block, PolicyGraph, GenericConstraint, and penalty/bounds configuration types require `serde::Serialize + serde::Deserialize` for JSON/Parquet loading."

---

### F-010: cobre-stochastic consuming function signatures unspecified

**Severity**: Low
**Affected Crate**: cobre-core (boundary concern)
**Affected Phase**: Phase 2

**Evidence**: `src/specs/data-model/internal-structures.md` SS14 documents `ParModel` and `CorrelationModel` as fields of `System`. SS1.7 mentions that `cobre_sddp::train()` and `cobre_sddp::simulate()` consume `&System`. But there is no specification for how cobre-stochastic consumes these types -- no function signature like `generate_scenarios(par_models: &[ParModel], correlation: &CorrelationModel, ...) -> ...`.

**Impact**: The cobre-stochastic boundary is implicit: it reads `system.par_models` and `system.correlation` via public fields. Without a specified consuming API, the interface is fragile.

**Recommendation**: This is primarily a cobre-stochastic audit concern (ticket-003). No cobre-core change needed, but the finding is logged here because the types are defined in cobre-core.

---

### F-011: `GenericConstraint` parsed expression type unspecified

**Severity**: Medium
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS15 describes the `GenericConstraint` structure:

> "Parsed expression: A list of linear terms, each being `coefficient x variable_reference`, plus a constant"
> "Sense: `>=`, `<=`, or `==`"
> "Slack config: whether a slack variable is created, and its penalty cost"

The `VariableReference` catalog lists 18 variants. But no Rust types are defined for: the parsed expression representation (`Vec<(f64, VariableReference)>`? a custom `LinearExpression` struct?), the constraint sense enum, or the slack configuration.

**Impact**: Generic constraints affect LP construction. The expression representation must be efficient for the LP builder to iterate over terms. Without a concrete type, the boundary between cobre-core's "parsed and validated" representation and cobre-sddp's LP consumption is unclear.

**Recommendation**: Add Rust type definitions for `GenericConstraint`, `LinearExpression` (or `LinearTerm`), `ConstraintSense`, `SlackConfig`, and `VariableReference` in internal-structures.md SS15.

---

### F-012: Topology validation function signatures missing

**Severity**: Low
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/architecture/validation-architecture.md` SS2.5 specifies validation rules including:

> "Acyclic cascade — Hydro cascade graph is a directed acyclic graph (DAG) — no cycles in downstream references"

And `src/specs/data-model/internal-structures.md` SS1.3 states:

> "// Cascade topology (resolved during loading)"
> "pub cascade: CascadeTopology,"

SS1.5 further documents: "During input loading, raw downstream references are resolved into a directed graph with non-existing plants already redirected to the next operating downstream plant." But no function signatures are specified for:

- Cascade cycle detection
- Cascade redirection resolution
- Network topology construction
- Penalty priority ordering validation

These are internal to the loading pipeline (cobre-io calls them), but some may be public cobre-core functions if topology validation is a reusable concern.

**Impact**: Low -- these are likely implementation-internal functions. The validation rules are well-specified; only the function interface is missing.

**Recommendation**: Determine during implementation whether topology validation functions are public cobre-core API or private cobre-io implementation. If public (for reuse by testing or external tools), add signatures.

---

### F-013: Date/time type for Stage start_date/end_date unspecified

**Severity**: Low
**Affected Crate**: cobre-core
**Affected Phase**: Phase 1

**Evidence**: `src/specs/data-model/internal-structures.md` SS12 lists Stage fields including `start_date`, `end_date` but does not specify the Rust type. The input schema in `input-scenarios.md` uses ISO 8601 date strings. The choice of Rust type (`chrono::NaiveDate`, `time::Date`, `String`, custom type) affects serialization, arithmetic, and rkyv compatibility.

**Impact**: Stage date arithmetic is used for block hour validation (sum of block hours equals stage duration) and season alignment. The date type must support these operations.

**Recommendation**: Specify the date type in the `Stage` struct definition. `chrono::NaiveDate` is the conventional choice for Rust. Note that rkyv derives may require a wrapper type if chrono types do not natively support rkyv.

---

## 4. Crate Verdict

**CONDITIONAL PASS**

cobre-core has a strong specification foundation. The `System` struct (SS1.3), its public API surface (SS1.4), thread safety properties (SS1.6), crate boundary contract (SS1.7), `TrainingEvent` enum (11 variants with full Rust definitions), `LoadError` enum (5 variants with full Rust definitions), and rkyv serialization requirements (SS6.2) are all fully specified and implementation-ready.

The primary gap is the absence of Rust struct definitions for the 7 entity types (F-001), the `EntityId` type alias (F-002), the topology structs (F-003), the resolved penalty/bounds structs (F-004), the temporal structs (F-005), the scenario pipeline structs (F-006), and the generic constraint types (F-011). These types are thoroughly described in prose and tables -- the domain semantics are clear -- but lack the concrete Rust type definitions that would allow an implementer to write code without making design decisions that should be in the specification.

The **conditional** qualifier reflects that:

1. **No finding is a blocker.** The domain content is comprehensive. An experienced Rust developer can derive correct struct definitions from the existing prose, JSON schemas, and field tables. The risk is inconsistency across implementers, not impossibility.

2. **The highest-severity findings (F-001, F-002) are mechanically resolvable.** Adding Rust struct sketches comparable to the existing `System` sketch (SS1.3) requires no new domain analysis -- only translating the existing field tables into Rust syntax.

3. **All crate boundaries are at least partially specified.** The `System` type and its public methods form a clean API surface. The gaps are in construction (F-007) and consuming side signatures (F-010), not in the shared types themselves.

### Resolution path for PASS

To upgrade from CONDITIONAL PASS to PASS, the following findings must be resolved before Phase 1 coding begins:

| Priority | Finding                                         | Action                                                                   |
| -------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Must     | F-001                                           | Add Rust struct sketches for all 7 entity types                          |
| Must     | F-002                                           | Define `EntityId` as concrete type or alias                              |
| Should   | F-003                                           | Add Rust struct sketches for `CascadeTopology` and `NetworkTopology`     |
| Should   | F-004                                           | Add Rust struct definitions for `ResolvedPenalties` and `ResolvedBounds` |
| Should   | F-005                                           | Add Rust struct definitions for `Stage`, `Block`, `PolicyGraph`          |
| Should   | F-007                                           | Specify `System` construction API                                        |
| May      | F-006, F-008, F-009, F-010, F-011, F-012, F-013 | Resolve during implementation or during Phase 2 prep                     |
