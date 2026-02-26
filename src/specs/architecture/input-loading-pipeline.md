# Input Loading Pipeline

## Purpose

This spec defines the Cobre input loading architecture: the rank-0 centric loading pattern, file loading sequence with dependency ordering, dependency resolution, conditional loading rules, sparse time-series expansion, data broadcasting strategy, parallel policy loading for warm-start, and the transition to the in-memory data model.

For the file inventory and directory layout, see [Input Directory Structure](../data-model/input-directory-structure.md).
For the in-memory data model after loading completes, see [Internal Structures](../data-model/internal-structures.md).

## 1. Loading Architecture

Input loading follows a **rank-0 centric** pattern: rank 0 loads and validates all input data, then broadcasts to worker ranks. This design:

- Minimizes filesystem contention on parallel filesystems
- Centralizes validation logic on a single rank
- Reduces complexity of error handling across ranks
- Ensures all ranks receive identical, validated data

The one exception is **policy loading for warm-start** (§7), where all ranks load in parallel to avoid bottlenecking on large policy files.

> **Placeholder** — The input loading pipeline diagram (`../../diagrams/exports/svg/data/input-loading-pipeline.svg`) will be revised after the text review is complete.

## 2. File Loading Sequence

Files are loaded in dependency order so that each file can be validated against previously loaded data. Loading fails fast on the first error.

**Schema validation first:** Every JSON file undergoes full schema validation before any other checks. This includes required vs. optional fields, data types, value ranges, and structural constraints (e.g., array lengths, enum values). Similarly, every Parquet file is validated for expected columns, column types, and per-column value constraints. The "Validation" column in the tables below lists only the **additional** cross-reference and semantic checks performed after schema validation passes.

> **Note:** The validations listed in this section are illustrative, not exhaustive. Additional validations may be introduced during implementation or as a result of reviewing other specs. See [Validation Architecture](./validation-architecture.md) for the complete multi-layer validation design.

### 2.1 Root-Level Files

| Order | File                      | Dependencies | Validation                                              |
| ----- | ------------------------- | ------------ | ------------------------------------------------------- |
| 1     | `config.json`             | None         | JSON schema, execution mode, section structure          |
| 2     | `stages.json`             | config       | Stage count, season mapping, policy graph, block counts |
| 3     | `penalties.json`          | None         | All penalty values > 0, required categories present     |
| 4     | `initial_conditions.json` | None         | Array lengths deferred until entity registries loaded   |

### 2.2 System Entity Registries

| Order | File                                   | Dependencies  | Validation                                       |
| ----- | -------------------------------------- | ------------- | ------------------------------------------------ |
| 5     | `system/buses.json`                    | None          | Bus IDs unique                                   |
| 6     | `system/lines.json`                    | buses         | Source/target bus references valid               |
| 7     | `system/hydros.json`                   | buses         | Bus references valid, cascade references acyclic |
| 8     | `system/thermals.json`                 | buses         | Bus references valid                             |
| 9     | `system/non_controllable_sources.json` | buses         | Bus references valid (optional file)             |
| 10    | `system/pumping_stations.json`         | hydros, buses | Hydro and bus references valid (optional file)   |
| 11    | `system/energy_contracts.json`         | buses         | Bus references valid (optional file)             |

### 2.3 System Extension Data

| Order | File                                  | Dependencies   | Validation                                                        |
| ----- | ------------------------------------- | -------------- | ----------------------------------------------------------------- |
| 12    | `system/hydro_geometry.parquet`       | hydros         | Hydro ID coverage, monotonic volume-area-level curves             |
| 13    | `system/hydro_production_models.json` | hydros, stages | Hydro/stage references valid (optional file)                      |
| 14    | `system/fpha_hyperplanes.parquet`     | hydros         | Required only when FPHA source is `"precomputed"` (optional file) |

### 2.4 Scenario Data

| Order | File                                       | Dependencies     | Validation                                                    |
| ----- | ------------------------------------------ | ---------------- | ------------------------------------------------------------- |
| 15    | `scenarios/inflow_seasonal_stats.parquet`  | hydros, stages   | Hydro/stage coverage (optional file)                          |
| 16    | `scenarios/inflow_ar_coefficients.parquet` | hydros, stages   | Hydro/stage/lag coverage, consistent AR order (optional file) |
| 17    | `scenarios/inflow_history.parquet`         | hydros           | Hydro ID coverage (optional file)                             |
| 18    | `scenarios/load_seasonal_stats.parquet`    | buses, stages    | Bus/stage coverage (optional file)                            |
| 19    | `scenarios/load_factors.json`              | stages           | Block count consistency (optional file)                       |
| 20    | `scenarios/correlation.json`               | hydros           | Group membership covers all hydros (optional file)            |
| 21    | `scenarios/external_scenarios.parquet`     | entities, stages | Entity/stage/scenario coverage (optional file)                |

### 2.5 Constraints and Overrides

| Order | File                                            | Dependencies                | Validation                                        |
| ----- | ----------------------------------------------- | --------------------------- | ------------------------------------------------- |
| 22    | `constraints/thermal_bounds.parquet`            | thermals, stages            | Entity/stage references valid (optional file)     |
| 23    | `constraints/hydro_bounds.parquet`              | hydros, stages              | Entity/stage references valid (optional file)     |
| 24    | `constraints/line_bounds.parquet`               | lines, stages               | Entity/stage references valid (optional file)     |
| 25    | `constraints/pumping_bounds.parquet`            | pumping, stages             | Entity/stage references valid (optional file)     |
| 26    | `constraints/contract_bounds.parquet`           | contracts, stages           | Entity/stage references valid (optional file)     |
| 27    | `constraints/exchange_factors.json`             | lines, stages               | Line/stage references valid (optional file)       |
| 28    | `constraints/generic_constraints.json`          | entities                    | Entity references valid (optional file)           |
| 29    | `constraints/generic_constraint_bounds.parquet` | generic constraints, stages | Constraint/stage references valid (optional file) |
| 30    | `constraints/penalty_overrides_bus.parquet`     | buses, stages               | Entity/stage references valid (optional file)     |
| 31    | `constraints/penalty_overrides_line.parquet`    | lines, stages               | Entity/stage references valid (optional file)     |
| 32    | `constraints/penalty_overrides_hydro.parquet`   | hydros, stages              | Entity/stage references valid (optional file)     |
| 33    | `constraints/penalty_overrides_ncs.parquet`     | NCS, stages                 | Entity/stage references valid (optional file)     |

### 2.6 Cross-Reference Validation

After all files are loaded, a final cross-reference validation pass checks:

- `initial_conditions.json` storage array lengths match hydro registry count
- Inflow model coverage is complete for all operating hydros
- FPHA hyperplanes exist for all hydros with FPHA source `"precomputed"` (hydros with source `"computed"` do not require this file — planes are generated during Initialization)
- Generic constraint entity references resolve to loaded entities
- Policy graph stage transitions are valid (no dangling references)

### 2.7 Policy Files (Warm-Start Only)

| Order | File       | Dependencies | Validation                                                |
| ----- | ---------- | ------------ | --------------------------------------------------------- |
| 34    | `policy/*` | All above    | State dictionary matches current system, cut format valid |

Policy loading uses a different pattern — see §7 Parallel Policy Loading.

## 3. Dependency Graph

Input files form a directed acyclic graph (DAG) of dependencies. The loading sequence in §2 is a valid topological ordering of this DAG. Files at the same dependency level may be loaded in any order relative to each other.

> **Placeholder** — The dependency graph diagram (`../../diagrams/exports/svg/data/json-schema-dependencies.svg`) will be revised after the text review is complete.

## 4. Conditional Loading

Some files are loaded only when certain conditions are met. Missing optional files are not errors — the loader uses defaults (typically empty collections or identity values).

| Condition                                                 | Effect                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `training.enabled = false` in `config.json`               | Skip scenario noise generation (but still load models if simulation needs them)                |
| `simulation.enabled = false` in `config.json`             | Skip simulation-specific scenario setup                                                        |
| `policy.mode = "warm_start"` in `config.json`             | Load `policy/*` files (§7)                                                                     |
| Policy graph has cycle (`stages.json`)                    | Validate cycle structure per [Infinite Horizon](../math/infinite-horizon.md)                   |
| Hydros with FPHA production model, source `"precomputed"` | Require `fpha_hyperplanes.parquet`                                                             |
| Hydros with FPHA production model, source `"computed"`    | FPHA hyperplanes computed during Initialization phase from geometry and topology data (see §8) |
| `pumping_stations.json` present                           | Load pumping bounds, validate hydro/bus references                                             |
| `energy_contracts.json` present                           | Load contract bounds                                                                           |
| `non_controllable_sources.json` present                   | Load NCS penalty overrides                                                                     |
| `external_scenarios.parquet` present                      | Use external scenarios instead of PAR-generated ones                                           |

> **Note on external scenarios scope**: The presence of `external_scenarios.parquet` does NOT imply simulation-only usage. External scenarios can also be used during training — see [Scenario Generation SS4.2](./scenario-generation.md). Loading and validation apply identically regardless of the target phase.

## 5. Sparse Time-Series Expansion

Time-series Parquet files (bounds, penalty overrides) use **sparse representation**: only rows with non-default values are stored. Stages and entities not present in the file receive default values.

**Expansion behavior:**

1. Load the sparse Parquet file (only rows with explicit values).
2. Build a dense (stage × entity) structure initialized with defaults.
3. Overlay the sparse values onto the dense structure.
4. Validate that all stage IDs and entity IDs in the sparse data are valid (reference loaded registries).

**Default values:** Each file type has its own default. For bounds files, the default is the static bound from the entity registry. For penalty overrides, the default is the global value from `penalties.json`. This is defined per file in the relevant data model spec — see [Input System Entities](../data-model/input-system-entities.md) and [Penalty System](../data-model/penalty-system.md).

## 6. Broadcast Strategy

After rank 0 loads and validates all data, it broadcasts to worker ranks. Data is serialized to contiguous byte buffers for MPI broadcast. The broadcast uses a two-step protocol: first the buffer size, then the buffer contents.

**Broadcast categories:**

| Category          | Data                                                       | Strategy                                         |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Small objects     | Config, stages, penalties, initial conditions              | Single `MPI_Bcast`                               |
| Entity registries | Buses, lines, hydros, thermals, NCS, pumping, contracts    | Single `MPI_Bcast`                               |
| Scenario models   | PAR parameters, correlation matrices, load models          | Single `MPI_Bcast`                               |
| Bounds/overrides  | All constraint bounds, penalty overrides, exchange factors | Single `MPI_Bcast` (sparse form, expand locally) |
| Policy cuts       | FCF cuts for warm-start                                    | Parallel load (§7)                               |

**Sparse broadcast optimization:** Bounds and penalty override files are broadcast in their sparse Parquet form. Each rank performs the sparse-to-dense expansion locally (§5). This reduces broadcast volume — only non-default values are transmitted.

### 6.1 Serialization Format

The serialization format for MPI broadcast is **rkyv** (version 0.8+).

rkyv ("archive") provides zero-copy deserialization: the archived representation can be accessed directly from the byte buffer without deserializing into owned Rust types. When rank 0 serializes the `System` struct, the resulting byte buffer is broadcast via `MPI_Bcast`. Receiving ranks access the archived data directly from the receive buffer, then convert to owned types only once. This avoids the double allocation overhead (deserialize into intermediate representation, then copy into final types) that traditional serialization frameworks impose. For a `System` struct at production scale — containing 160 hydros, 120 stages, thousands of resolved bounds entries, and PAR model parameters — this eliminates a significant allocation burst on every worker rank during startup.

**Why not bincode:** bincode was considered but is unmaintained. Its last release predates the current Rust edition, and it lacks the zero-copy access pattern that rkyv provides. Given that the broadcast payload can reach tens of megabytes for production-scale systems, the allocation-free archived access is a material advantage.

**Sparse broadcast and Parquet pass-through:** For bounds and penalty override data broadcast in sparse Parquet form (see broadcast categories table above), rkyv serializes only the metadata envelope (entity IDs, stage ranges, file identity). The raw Parquet bytes are passed through as-is in a separate broadcast buffer — they are not re-serialized through rkyv. Each rank deserializes the metadata envelope via rkyv and then performs sparse-to-dense expansion locally from the Parquet bytes.

### 6.2 Required Trait Bounds

All types that participate in the `System` broadcast must derive `rkyv::Archive`, `rkyv::Serialize`, and `rkyv::Deserialize`. The complete list of types requiring these trait bounds:

**Entity types:**

- `System`, `Bus`, `Line`, `Hydro`, `Thermal`, `PumpingStation`, `EnergyContract`, `NonControllableSource`

**Temporal and topological types:**

- `Stage`, `PolicyGraph`, `CascadeTopology`, `NetworkTopology`

**Pre-resolved data types:**

- `ResolvedPenalties`, `ResolvedBounds`

**Scenario pipeline types:**

- `ParModel`, `CorrelationModel`

**Other types:**

- `InitialConditions`, `GenericConstraint`

All nested types within these top-level types (e.g., tagged union variants within `Hydro`, individual bound entries within `ResolvedBounds`) must also satisfy the same trait bounds transitively.

**Derive example:**

```rust
#[derive(rkyv::Archive, rkyv::Serialize, rkyv::Deserialize)]
#[rkyv(compare(PartialEq))]
pub struct Hydro { /* ... */ }
```

**HashMap lookup indices are NOT serialized.** The `System` struct contains `HashMap<EntityId, usize>` fields (`bus_index`, `hydro_index`, `thermal_index`, etc.) that serve as O(1) lookup indices from entity ID to position in the corresponding `Vec`. These indices are **excluded** from rkyv serialization. Each receiving rank rebuilds them locally from the deserialized entity collections. This is correct because the indices are derived data — they are deterministically reconstructable from the entity vectors — and excluding them reduces the broadcast payload size and avoids serializing HashMap internal layout, which is not stable across allocator states.

### 6.3 Alignment and Buffer Allocation

rkyv requires **16-byte alignment** for archived data by default. The archived root object must begin at a 16-byte-aligned address for zero-copy access to function correctly.

The MPI receive buffer on worker ranks must be allocated with appropriate alignment. Standard `Vec<u8>` allocation does not guarantee 16-byte alignment. Instead, use explicit aligned allocation:

```rust
use std::alloc::{alloc, Layout};

let layout = Layout::from_size_align(size, 16).expect("valid layout");
let ptr = unsafe { alloc(layout) };
```

Rank 0 serializes via `rkyv::to_bytes` (or equivalent), which produces an aligned buffer. The two-step broadcast protocol (size first, then contents) allows worker ranks to allocate a correctly aligned receive buffer of the exact required size before the second `MPI_Bcast` call.

### 6.4 Versioning Scope

rkyv does **not** provide built-in schema evolution. The archived byte format is tied directly to the Rust struct layout — any change to field order, field types, or field count produces an incompatible archive. There is no field tagging, no optional field mechanism, and no forward/backward compatibility guarantee.

This is acceptable because rkyv is used **exclusively for in-memory MPI broadcast** within a single program execution. All ranks run the same binary, so the struct layout is identical on the serializing and deserializing sides. There is no cross-version compatibility requirement for broadcast data — the buffer exists only for the duration of the broadcast operation and is never persisted to disk.

**rkyv is NOT suitable for long-term storage.** Any data that must survive across program versions (policy cuts, checkpoints, warm-start files) uses FlatBuffers, which provides schema evolution and cross-version compatibility. See [Binary Formats](../data-model/binary-formats.md) SS3 for the FlatBuffers policy persistence format.

## 7. Parallel Policy Loading (Warm-Start)

Policy files (cuts, states, vertices, basis) can be large. Loading them on rank 0 and broadcasting would create a bottleneck. Instead, all ranks load in parallel:

1. Rank 0 loads and broadcasts the `policy/metadata.json` and `policy/state_dictionary.json` (small files).
2. All ranks validate the state dictionary against the current system (entity count, state variable mapping).
3. Each rank loads a subset of policy stage files from `policy/cuts/` — stages are assigned round-robin by rank.
4. After local loading, ranks exchange cuts so that every rank has the complete policy. The exchange strategy (e.g., `MPI_Allgatherv` or shared memory window + inter-node broadcast) is an implementation choice.

For the policy file format (FlatBuffers `.bin` files), see [Binary Formats](../data-model/binary-formats.md) SS3.2.

## 8. Transition to In-Memory Model

After loading and broadcasting, each rank constructs its in-memory data model from the loaded data. The in-memory structures are defined in [Internal Structures](../data-model/internal-structures.md) and are not specified here.

**FPHA preprocessing:** For hydros with FPHA production model and source `"computed"`, the FPHA hyperplanes are fitted during the Initialization phase (after validation, before training). Fitting uses the hydro geometry (volume-area-level curves from `hydro_geometry.parquet`), topology data (productivity, tailrace, hydraulic losses, turbine efficiency from `hydros.json`), and fitting configuration (discretization points from `hydro_production_models.json`). See [Hydro Production Models](../math/hydro-production-models.md) for the mathematical formulation and [Input Hydro Extensions](../data-model/input-hydro-extensions.md) for the required input data.

The key invariant is: **after the Initialization phase completes, all ranks hold identical copies of the validated case data** (except for per-rank scenario assignments, which are determined during Scenario Generation). See [CLI and Lifecycle](./cli-and-lifecycle.md) SS5.2 for the phase sequence.

### 8.1 `load_case` Public API

`load_case` is the primary entry point from `cobre-cli` (rank 0) into `cobre-io`. It performs the complete loading sequence (SS2.1--2.6), cross-reference validation (SS2.6), and returns a fully resolved `System` value ready for rkyv broadcast.

**Function signature:**

```rust
/// Load, validate, and resolve a Cobre case from the input directory.
///
/// This is the primary entry point from cobre-cli (rank 0) into cobre-io.
/// Returns the fully resolved System struct ready for rkyv broadcast.
///
/// # Errors
/// Returns LoadError if any file cannot be read, parsed, or validated.
pub fn load_case(path: &Path) -> Result<System, LoadError>
```

**Parameters:**

- `path: &Path` -- the case directory containing `config.json` and all subdirectories (`system/`, `scenarios/`, `constraints/`, `policy/`). This is the root directory of the case, not a path to any individual file.

**Return type:**

- `System` -- an owned value (not `Arc<System>`). The caller (`cobre-cli` or `cobre-python`) owns the returned `System` and is responsible for broadcasting it to worker ranks via the rkyv serialization protocol (SS6.1). After broadcast, each rank owns its own deserialized copy. Ownership transfer is the simplest pattern: no reference counting, no shared-memory coordination, no lifetime entanglement between the loading phase and the algorithm phase.

**Config loading:**

`load_case` does NOT accept a `Config` parameter. The `config.json` file is loaded as step 1 within `load_case` itself, per the loading sequence (SS2.1). The config governs conditional loading decisions (SS4) such as whether to require FPHA hyperplanes or scenario model files. Accepting a pre-loaded config would split the loading sequence across two call sites, creating a risk that conditional loading decisions are evaluated against a config that does not match the case directory contents.

**Responsibility boundary:**

`load_case` performs the following steps, in order:

1. Load and validate `config.json` (SS2.1).
2. Load root-level files: `stages.json`, `penalties.json`, `initial_conditions.json` (SS2.1).
3. Load system entity registries (SS2.2).
4. Load system extension data (SS2.3).
5. Load scenario data (SS2.4).
6. Load constraints and overrides (SS2.5).
7. Apply sparse time-series expansion (SS5).
8. Perform cross-reference validation (SS2.6).
9. Construct and return the `System` struct with all collections in canonical order.

`load_case` does NOT load policy files (SS2.7). Policy loading follows a different pattern -- all ranks load in parallel (SS7) -- and is a separate operation invoked after the `System` broadcast. See [CLI and Lifecycle](./cli-and-lifecycle.md) SS5.2 for the phase sequence that separates case loading from policy loading.

**`LoadError` enum:**

```rust
/// Errors that can occur during case loading.
#[derive(Debug, thiserror::Error)]
pub enum LoadError {
    /// Filesystem read failure (file not found, permission denied, I/O error).
    #[error("I/O error reading {path}: {source}")]
    IoError {
        path: PathBuf,
        source: std::io::Error,
    },

    /// JSON or Parquet parsing failure (malformed content, encoding error).
    #[error("parse error in {path}: {message}")]
    ParseError {
        path: PathBuf,
        message: String,
    },

    /// Schema validation failure (missing required field, wrong type, value out of range).
    #[error("schema error in {path}, field {field}: {message}")]
    SchemaError {
        path: PathBuf,
        field: String,
        message: String,
    },

    /// Cross-reference validation failure (dangling entity ID, broken foreign key).
    #[error("cross-reference error: {source_entity} in {source_file} references \
             non-existent {target_entity} in {target_collection}")]
    CrossReferenceError {
        source_file: PathBuf,
        source_entity: String,
        target_collection: String,
        target_entity: String,
    },

    /// Semantic constraint violation (acyclic cascade, complete coverage, consistency).
    #[error("constraint violation: {description}")]
    ConstraintError {
        description: String,
    },
}
```

The variants are ordered by the phase in which they typically occur:

| Variant               | Typical Phase              | Example                                                             |
| --------------------- | -------------------------- | ------------------------------------------------------------------- |
| `IoError`             | File read (any step)       | `system/hydros.json` not found                                      |
| `ParseError`          | File parse (any step)      | Malformed JSON in `stages.json`                                     |
| `SchemaError`         | Schema validation          | `hydros.json` entry missing required field `bus_id`                 |
| `CrossReferenceError` | Cross-reference validation | Hydro `bus_id = "BUS_99"` not found in bus registry                 |
| `ConstraintError`     | Semantic validation        | Hydro cascade contains a cycle; inflow model coverage is incomplete |

All variants carry enough context for the caller to produce a diagnostic message without re-reading the input files.

**Cross-references:**

- [Internal Structures](../data-model/internal-structures.md) SS1 -- defines the `System` struct returned by `load_case`
- [CLI and Lifecycle](./cli-and-lifecycle.md) SS5.2 -- Validation phase where `load_case` is invoked on rank 0

## Cross-References

- [Input Directory Structure](../data-model/input-directory-structure.md) — File inventory, directory layout, `config.json` schema
- [Internal Structures](../data-model/internal-structures.md) — In-memory data model constructed from loaded data
- [CLI and Lifecycle](./cli-and-lifecycle.md) — Execution phases (Validation, Initialization) that orchestrate loading
- [Validation Architecture](./validation-architecture.md) — Multi-layer validation applied during and after loading
- [Design Principles](../overview/design-principles.md) — Declaration order invariance requiring canonicalization after loading
- [Configuration Reference](../configuration/configuration-reference.md) — Complete `config.json` schema loaded in step 1
- [Input System Entities](../data-model/input-system-entities.md) — Entity registries and default bounds
- [Input Scenarios](../data-model/input-scenarios.md) — Scenario model files and policy graph
- [Input Constraints](../data-model/input-constraints.md) — Generic constraints, penalty overrides, exchange factors
- [PAR Inflow Model](../math/par-inflow-model.md) — PAR(p) model parameters loaded from `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet`
- [Binary Formats](../data-model/binary-formats.md) — Policy file format (FlatBuffers) for warm-start loading
- [Penalty System](../data-model/penalty-system.md) — Default penalty values and override cascade
