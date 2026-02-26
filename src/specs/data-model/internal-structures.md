# Internal Structures

## Purpose

This spec defines the logical in-memory data model that the SDDP solver requires at runtime. It describes _what_ data the solver must hold in memory and _why_, without prescribing implementation types or data structures. The actual implementation (struct layout, indexing strategy, memory layout) will emerge during development.

These structures are the result of loading, validating, and resolving all input files into a unified, ready-to-use representation. They differ from input schemas in several ways:

| Concern    | Input Schemas                                | Internal Structures                      |
| ---------- | -------------------------------------------- | ---------------------------------------- |
| Scope      | One file at a time                           | Unified, cross-referenced                |
| Defaults   | May be absent (use global/entity default)    | All defaults resolved to concrete values |
| Penalties  | Three-tier cascade (global → entity → stage) | Pre-resolved per (entity, stage)         |
| Bounds     | Base values with sparse stage overrides      | Pre-resolved per (entity, stage)         |
| Validation | Deferred or partial                          | Complete — all cross-references verified |
| Ordering   | User-defined (arbitrary)                     | Canonical (sorted by ID)                 |

For input file schemas, see [Input System Entities](input-system-entities.md), [Input Hydro Extensions](input-hydro-extensions.md), [Input Scenarios](input-scenarios.md), [Input Constraints](input-constraints.md). For binary format choices (LP subproblems, cuts), see [Binary Formats](binary-formats.md).

### Role in Program Lifecycle

These internal structures serve two distinct purposes in the program, each with different performance characteristics:

**1. LP Definition Construction (initialization — built once)**

The system entities (§1–§9), pre-resolved penalties (§10), pre-resolved bounds (§11), generic constraints (§14), block factors (§12), and AR models (§13) are all loaded and resolved during program initialization — whether for training or simulation. From these resolved structures plus algorithm configuration (number of iterations, forward passes for cut preallocation, etc.), the program constructs a set of LP definitions, one per (stage, block) pair. These LP definitions are built once and reused throughout the algorithm. Since this happens once at startup, **data clarity and correctness are more important than performance** in this phase.

**2. Scenario Generation Pipeline (runtime — performance-critical)**

The scenario pipeline (§13) is exercised repeatedly during both training and simulation. Each forward pass requires sampling from standard normal distributions, applying Cholesky-decomposed correlation matrices, and transforming the results into correlated scenario realizations. This is parallelized across MPI ranks with seed preprocessing to ensure reproducibility. **Performance is critical** in this phase — the noise generation step (sampling, correlation transforms, and method-specific operations) must be efficient at scale.

> **Opening tree lifecycle**: The noise openings used in the backward pass are generated **once before training begins** (fixed opening tree), not per-iteration. The forward pass may use the same opening tree or an alternative noise source (e.g., external scenarios). See [Scenario Generation §2.3 and §3](../architecture/scenario-generation.md).

## 1. System Representation

The top-level system object holds all entity collections needed by the solver. After loading from input files, all collections are sorted by entity ID (canonical ordering) to ensure deterministic behavior regardless of declaration order in input files. See [Design Principles §3](../overview/design-principles.md).

### 1.1 Dual-Nature Design Principle

The Cobre data model follows a **dual-nature design**: `cobre-core` defines clarity-first data models optimized for correctness and readability, while `cobre-sddp` builds performance-adapted views at initialization from `&System`.

**`cobre-core` (clarity-first)**. The `System` struct uses `Vec<Hydro>`, `Vec<Thermal>`, and other rich entity structs organized as arrays-of-structs with `HashMap`-based O(1) lookup by entity ID. This representation prioritizes data clarity: field names match domain concepts, entity relationships are explicit, and the structure is straightforward to validate, debug, and serialize. The `System` struct is the canonical representation shared across all crates that need to read the case data.

**`cobre-sddp` (performance-adapted)**. Before the training loop begins, `cobre-sddp` constructs performance-adapted views from `&System`. These views reorganize the data into struct-of-arrays layouts with contiguous LP variable indices, SIMD-friendly `f64` slices, and pre-computed lookup tables that eliminate indirection on the hot path. The performance-adapted types are consumed exclusively within the SDDP training and simulation loops. Their lifetime is bounded by the algorithm execution, and they hold no ownership over the underlying case data.

This separation means that adding a new entity type or modifying a domain struct in `cobre-core` does not require changing the performance-critical inner loops of `cobre-sddp` -- only the initialization code that builds the performance-adapted views needs to be updated. Conversely, hot-path data layout optimizations in `cobre-sddp` do not propagate to the rest of the ecosystem.

> **Cross-reference**: The performance-adapted types in `cobre-sddp` (stage templates, LP variable indexers, contiguous coefficient arrays) are defined in Epic 3 specs. See [Solver Abstraction](../architecture/solver-abstraction.md) for the stage LP template design and [Solver Workspaces](../architecture/solver-workspaces.md) for thread-local workspace layout.

### 1.2 Entity Collections

| Collection               | Source                                 | Description                                                     |
| ------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| Buses                    | `system/buses.json`                    | Electrical network nodes with pre-resolved deficit segments     |
| Lines                    | `system/lines.json`                    | Transmission interconnections between buses                     |
| Hydros                   | `system/hydros.json` + extensions      | Hydro plants with generation model, reservoir, cascade topology |
| Thermals                 | `system/thermals.json`                 | Thermal plants with piecewise cost curves                       |
| Pumping stations         | `system/pumping_stations.json`         | Water transfer stations consuming power                         |
| Energy contracts         | `system/energy_contracts.json`         | Import/export agreements with external systems                  |
| Non-controllable sources | `system/non_controllable_sources.json` | Intermittent generation (wind/solar) with curtailment option    |

### 1.3 System Struct Sketch

The `System` struct is the top-level in-memory representation of a fully loaded, validated, and resolved case. It is produced by `cobre_io::load_case()` and consumed by `cobre_sddp::train()`, `cobre_sddp::simulate()`, and `cobre_stochastic` scenario generation.

```rust
/// Top-level system representation.
/// Produced by cobre-io, consumed by cobre-sddp and cobre-stochastic.
/// Immutable after construction. Shared read-only across threads.
pub struct System {
    // Entity collections (canonical ordering by ID)
    pub buses: Vec<Bus>,
    pub lines: Vec<Line>,
    pub hydros: Vec<Hydro>,
    pub thermals: Vec<Thermal>,
    pub pumping_stations: Vec<PumpingStation>,
    pub contracts: Vec<EnergyContract>,
    pub non_controllable_sources: Vec<NonControllableSource>,

    // O(1) lookup indices (entity ID -> position in collection)
    bus_index: HashMap<EntityId, usize>,
    line_index: HashMap<EntityId, usize>,
    hydro_index: HashMap<EntityId, usize>,
    thermal_index: HashMap<EntityId, usize>,
    pumping_station_index: HashMap<EntityId, usize>,
    contract_index: HashMap<EntityId, usize>,
    non_controllable_source_index: HashMap<EntityId, usize>,

    // Cascade topology (resolved during loading)
    pub cascade: CascadeTopology,

    // Transmission network topology (resolved during loading)
    pub network: NetworkTopology,

    // Stages and temporal structure
    pub stages: Vec<Stage>,
    pub policy_graph: PolicyGraph,

    // Pre-resolved penalties and bounds
    pub penalties: ResolvedPenalties,
    pub bounds: ResolvedBounds,

    // Scenario pipeline parameters
    pub par_models: Vec<ParModel>,       // per (hydro, stage)
    pub correlation: CorrelationModel,

    // Initial conditions
    pub initial_conditions: InitialConditions,

    // Generic constraints
    pub generic_constraints: Vec<GenericConstraint>,
}
```

**Field descriptions**:

| Field Group         | Fields                                                                                                                                | Description                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity collections  | `buses`, `lines`, `hydros`, `thermals`, `pumping_stations`, `contracts`, `non_controllable_sources`                                   | One `Vec` per entity type from the entity collections table (1.2). Each vector is sorted by `EntityId` in canonical order. Public for read access.                                                       |
| Lookup indices      | `bus_index`, `line_index`, `hydro_index`, `thermal_index`, `pumping_station_index`, `contract_index`, `non_controllable_source_index` | One `HashMap<EntityId, usize>` per entity type, mapping entity IDs to their position in the corresponding collection vector. Private -- accessed only through the public API methods (1.4).              |
| Cascade topology    | `cascade`                                                                                                                             | Resolved cascade topology for hydro plants. Contains downstream and upstream adjacency lists, with references to non-existing plants already redirected to the next operating downstream plant. See 1.5. |
| Network topology    | `network`                                                                                                                             | Resolved transmission network graph for buses and lines. Contains bus-line incidence relationships for power balance and flow constraints. See 1.5b.                                                     |
| Temporal structure  | `stages`, `policy_graph`                                                                                                              | Stage definitions (section 12) and policy graph transitions for finite or cyclic horizon.                                                                                                                |
| Pre-resolved data   | `penalties`, `bounds`                                                                                                                 | Fully resolved penalty and bound values per (entity, stage). See sections 10 and 11.                                                                                                                     |
| Scenario pipeline   | `par_models`, `correlation`                                                                                                           | PAR model parameters per (hydro, stage) and Cholesky-decomposed correlation matrices. See section 14.                                                                                                    |
| Initial conditions  | `initial_conditions`                                                                                                                  | Initial storage volumes, filling storage, and GNL pipeline state. See section 16.                                                                                                                        |
| Generic constraints | `generic_constraints`                                                                                                                 | User-defined linear constraints with parsed expressions and resolved entity references. See section 15.                                                                                                  |

### 1.4 Public API Surface

The `System` struct exposes the following public methods. All methods are read-only -- `System` is immutable after construction.

**Entity collection accessors** -- return shared slices over the canonical-ordered collections:

```rust
impl System {
    pub fn buses(&self) -> &[Bus];
    pub fn lines(&self) -> &[Line];
    pub fn hydros(&self) -> &[Hydro];
    pub fn thermals(&self) -> &[Thermal];
    pub fn pumping_stations(&self) -> &[PumpingStation];
    pub fn contracts(&self) -> &[EnergyContract];
    pub fn non_controllable_sources(&self) -> &[NonControllableSource];
}
```

**Entity count queries** -- return the number of entities of each type (used for LP dimensioning and preallocation):

```rust
impl System {
    pub fn n_buses(&self) -> usize;
    pub fn n_lines(&self) -> usize;
    pub fn n_hydros(&self) -> usize;
    pub fn n_thermals(&self) -> usize;
    pub fn n_pumping_stations(&self) -> usize;
    pub fn n_contracts(&self) -> usize;
    pub fn n_non_controllable_sources(&self) -> usize;
}
```

**Entity lookup by ID** -- O(1) lookup via the private `HashMap` indices. Returns `None` if the ID does not exist in the system:

```rust
impl System {
    pub fn bus(&self, id: EntityId) -> Option<&Bus>;
    pub fn line(&self, id: EntityId) -> Option<&Line>;
    pub fn hydro(&self, id: EntityId) -> Option<&Hydro>;
    pub fn thermal(&self, id: EntityId) -> Option<&Thermal>;
    pub fn pumping_station(&self, id: EntityId) -> Option<&PumpingStation>;
    pub fn contract(&self, id: EntityId) -> Option<&EnergyContract>;
    pub fn non_controllable_source(&self, id: EntityId) -> Option<&NonControllableSource>;
}
```

**Topology and structure accessors**:

```rust
impl System {
    pub fn cascade(&self) -> &CascadeTopology;
    pub fn network(&self) -> &NetworkTopology;
    pub fn stages(&self) -> &[Stage];
    pub fn policy_graph(&self) -> &PolicyGraph;
}
```

All accessor methods are infallible: they operate on fully validated, resolved data. The validation guarantees are established during `cobre_io::load_case()` -- see [Input Loading Pipeline](../architecture/input-loading-pipeline.md) section 2 for the file loading sequence and cross-reference validation.

### 1.5 Cascade Topology

The `CascadeTopology` struct holds the resolved hydro cascade graph. During input loading, raw downstream references are resolved into a directed graph with non-existing plants already redirected to the next operating downstream plant (see section 2 on cascade redirection). The topology provides:

- **Downstream adjacency**: for each hydro, the ID of its immediate downstream hydro (after redirection), or `None` if it is a terminal node
- **Upstream adjacency**: for each hydro, the list of hydro IDs that flow into it (derived from downstream references)
- **Travel times**: water travel delay from upstream to downstream, in stages
- **Topological order**: a pre-computed ordering of hydros such that every upstream plant appears before its downstream plant, enabling single-pass cascade traversal

The cascade topology is immutable after construction and shared read-only. LP construction uses it to build water balance constraints without needing to walk or re-resolve the cascade graph at build time.

### 1.5b Network Topology

The `NetworkTopology` struct holds the resolved transmission network graph for buses and lines. During input loading, bus-line connectivity is resolved into a directed graph suitable for generating power balance and flow constraints. The topology provides:

- **Bus-line incidence**: for each bus, the list of lines connected to it (both incoming and outgoing), enabling single-pass power balance constraint generation
- **Line endpoints**: for each line, the from-bus and to-bus IDs (resolved to collection indices for O(1) access)
- **Bus generation map**: for each bus, the list of generating entities (hydros, thermals, non-controllable sources) connected to it, with their collection indices
- **Bus load map**: for each bus, the demand and contract entities attached to it

The network topology is immutable after construction and shared read-only. LP construction uses it to build power flow and bus balance constraints without needing to re-resolve bus-line relationships at build time. This is the transmission-network counterpart to the hydro cascade topology in 1.5.

### 1.6 Thread Safety and Lifetime

**`Send + Sync` bounds.** The `System` struct implements `Send + Sync`. This is required because:

1. **MPI broadcast**: after rank 0 constructs `System` from input files, the serialized representation is broadcast to all worker ranks. Each rank deserializes into its own `System` instance. `Send` is required for the serialization buffer to cross thread boundaries during broadcast.
2. **OpenMP-style thread sharing**: within each MPI rank, multiple threads read from the same `System` during forward and backward pass LP construction. `Sync` is required so that `&System` can be shared across threads without synchronization.

All fields of `System` are either inherently `Send + Sync` (`Vec<T>` where `T: Send + Sync`, `HashMap<K, V>` where `K, V: Send + Sync`) or must be chosen to satisfy these bounds.

**Immutability after construction.** Once constructed by `cobre_io::load_case()`, the `System` is never mutated. All access is through shared references (`&System`). This eliminates the need for interior mutability patterns (`Mutex`, `RwLock`) and guarantees data-race freedom by construction.

**Lifetime and ownership.** The `System` is owned by the caller of `load_case()` (typically the top-level orchestrator in `cobre-cli` or `cobre-python`). It is passed by shared reference to `cobre_sddp::train()` and other consumers. Because MPI broadcast creates a full copy on each rank, no cross-rank reference sharing occurs -- each rank owns its `System` instance independently. The `System` lifetime is effectively `'static` within the scope of a single training or simulation run.

**No `Arc` needed.** Since each MPI rank owns its own `System` and shares it across threads via `&System` (not `Arc<System>`), there is no reference-counting overhead. The borrow checker ensures that the `System` outlives all references to it.

### 1.7 Crate Boundary Contract

The `System` struct is the primary data type that crosses the `cobre-io` / `cobre-core` / `cobre-sddp` crate boundaries:

- **`cobre_io::load_case(path: &Path) -> Result<System, LoadError>`** -- loads, validates, and resolves all input files from the case directory into a `System`. See [Input Loading Pipeline](../architecture/input-loading-pipeline.md) section 8 for the transition to in-memory model.
- **`cobre_sddp::train(system: &System, config: &TrainingConfig, comm: &C) -> Result<TrainingResult, TrainError>`** -- consumes the `System` by shared reference to build performance-adapted views, construct stage LP templates, and execute the SDDP training loop. See [Training Loop](../architecture/training-loop.md) section 1 for the algorithm overview.
- **`cobre_sddp::simulate(system: &System, policy: &Policy, config: &SimulationConfig, comm: &C) -> Result<SimulationResult, SimError>`** -- consumes the `System` by shared reference for simulation.

The `System` type is defined in `cobre-core` so that both `cobre-io` (producer) and `cobre-sddp` (consumer) depend on `cobre-core` without creating a circular dependency. This follows the bottom-up build sequence defined in [Implementation Ordering](../overview/implementation-ordering.md).

## 2. Operative State

Every entity with lifecycle attributes (`entry_stage_id`, `exit_stage_id`) has a stage-dependent operative state that determines which LP variables and constraints are active. The operative state is computed per entity per stage.

| State          | Applies To       | LP Treatment                                                                                                                |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Non-existing   | All entity types | No LP variables or constraints                                                                                              |
| Filling        | Hydros only      | Storage, spillage, evaporation, violation slacks. No generation (turbined = 0). See [Penalty System §7](penalty-system.md). |
| Operating      | All entity types | Full LP variables and constraints per entity type                                                                           |
| Decommissioned | All entity types | No LP variables or constraints (identical to Non-existing)                                                                  |

**Stakeholder decision**: Decommissioned entities are treated identically to Non-existing for all entity types, including hydros. Reservoir drainage after decommissioning is not modeled. This simplifies the lifecycle to three meaningful LP states: Non-existing/Decommissioned (no LP presence), Filling (hydros only), and Operating (full LP formulation).

**Hydro filling timeline**: `[start_stage_id, entry_stage_id)` = filling period. At `entry_stage_id`, transitions to operating. Based on CEPEL's dead-volume filling model (`enchimento de volume morto`).

**Cascade redirection**: When a downstream hydro is non-existing, outflows are automatically redirected to the next operating downstream in the cascade. The internal representation should resolve this redirection so the LP builder does not need to walk the cascade at build time.

## 3. Hydro Plant

Hydro plants are the most complex entity in the system. The in-memory hydro representation must include:

### Core Identity and Topology

- Entity ID, name, and bus assignment
- Downstream hydro ID (physical cascade), upstream hydro IDs (derived from downstream references)
- Lifecycle: `entry_stage_id`, `exit_stage_id`

### Reservoir

- `min_storage_hm3` (dead volume) — soft lower bound, violation uses `storage_violation_below` slack
- `max_storage_hm3` — hard upper bound (emergency spillage handles excess)

### Outflow Bounds

- `min_outflow_m3s` — soft lower bound (environmental flow), violation slack available
- `max_outflow_m3s` — soft upper bound (flood control), violation slack available. Null = no upper bound.

### Generation Model (Tagged Union)

The generation model is a tagged union selected by a `model` field. Only fields relevant to the selected variant are meaningful. See [Input System Entities §3](input-system-entities.md) for input schema and [Hydro Production Functions](../math/hydro-production-models.md) for math.

| Variant                 | Key Data                                                            | Requires Geometry              | Phase                 |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------ | --------------------- |
| `constant_productivity` | Productivity factor [MW/(m3/s)]                                     | No                             | Training + Simulation |
| `linearized_head`       | Base productivity, adjusted by storage-dependent head               | Yes                            | **Simulation-only**   |
| `fpha`                  | Hyperplane coefficients (gamma_0, gamma_v, gamma_q, gamma_s, kappa) | Computed: yes; Precomputed: no | Training + Simulation |

> **Simulation-only restriction**: The `linearized_head` model is excluded from training because the bilinear term ($q \times v^{avg}$) requires re-fixing $v^{avg}$ between iterations, changing the LP structure and breaking SDDP convergence guarantees. See [Hydro Production Models §3](../math/hydro-production-models.md).

All variants carry:

- `min_turbined_m3s`, `max_turbined_m3s` — machine flow limits (lower bound has violation slack)
- `min_generation_mw`, `max_generation_mw` — user-defined generation bounds (lower bound has violation slack, upper is hard)

**FPHA turbined flow penalty**: When using the `fpha` production model, the concave geometry of the hyperplane approximation means that every point inside the region bounded by the FPHA hyperplanes is a feasible LP solution — including solutions where the generation is less than what the physical production function would yield for the given turbined flow. Without correction, the solver can effectively "spill through the turbines" by choosing these interior points. To prevent this, a `fpha_turbined_cost` regularization penalty is applied to the turbined flow variable, and it must be strictly greater than the `spillage_cost` for the same plant. This ensures the solver prefers to turbine (and generate) rather than spill, and when it does turbine, the FPHA constraints push generation toward the physical envelope. This penalty is only active for hydros using the `fpha` production model.

### Production Model Selection

The active generation model can vary by stage or season. See [Input Hydro Extensions §2](input-hydro-extensions.md) for the selection modes (`stage_ranges`, `seasonal` with `default_model` fallback).

### Optional Hydro Data

| Data             | Purpose                                                            | Source             |
| ---------------- | ------------------------------------------------------------------ | ------------------ |
| Tailrace model   | Downstream water level vs. outflow (polynomial or piecewise)       | `hydros.json`      |
| Hydraulic losses | Head losses (factor or constant)                                   | `hydros.json`      |
| Efficiency       | Turbine-generator efficiency (constant; future: flow-dependent)    | `hydros.json`      |
| Evaporation      | 12 monthly coefficients (mm)                                       | `hydros.json`      |
| Geometry         | Volume-Height-Area table for forebay/area computation              | `hydro_geometry`   |
| FPHA hyperplanes | Pre-computed production function planes (optionally stage-varying) | `fpha_hyperplanes` |

### Diversion Channel (Optional)

- `downstream_id` — hydro receiving diverted water
- `max_flow_m3s` — maximum diversion flow
- Diversion variable bounded by `[0, max_flow_m3s]`; only regularization cost (no violation slacks)

### Filling Configuration (Optional)

Based on CEPEL's dead-volume filling model. See [Input System Entities §3](input-system-entities.md) and [Penalty System §7](penalty-system.md).

- `start_stage_id` — first filling stage
- `filling_inflow_m3s` — entity-level default for filling inflow (overridable per stage in `hydro_bounds`)
- Filling target is always `min_storage_hm3`
- Terminal constraint at `entry_stage_id - 1` with `filling_target_violation` slack (highest penalty in system)

## 4. Thermal Plant

In-memory thermal representation:

- Entity ID, name, bus assignment
- Lifecycle: `entry_stage_id`, `exit_stage_id`
- **Cost segments**: Piecewise-linear cost curve — ordered list of (capacity_mw, cost_per_mwh) segments
- **Generation bounds**: `min_mw`, `max_mw` — hard constraints (no slack variables; thermal dispatch is directly controllable)

### GNL Dispatch Anticipation

> **Implementation Status**: Data model defined. Validation currently rejects GNL thermal plants (thermals with `gnl_config` present). This restriction will be removed when the GNL algorithm is implemented.

GNL (Gas Natural Liquefeito) thermals require dispatch decisions N stages ahead due to fuel ordering lead times. This fundamentally changes the LP structure for these plants:

- **`lag_stages`** — number of stages of dispatch anticipation (e.g., 2 means the dispatch must be decided 2 stages before execution)
- **GNL state variables**: For each GNL thermal, the algorithm adds `lag_stages` state variables to the SDDP state vector: `gnl_committed[thermal_id, t+1]`, `gnl_committed[thermal_id, t+2]`, ..., up to `lag_stages` ahead. These represent the MW dispatch already committed for future stages.
- **LP coupling**: At stage `t`, the GNL thermal's generation is constrained by the commitment made at stage `t - lag_stages`. The LP at stage `t` also includes decision variables for committing dispatch at stage `t + lag_stages`.
- **State dimension impact**: Each GNL thermal with `lag_stages = L` adds `L` state variables to the system, increasing the cut coefficient count and the FCF dimensionality.

See [Input System Entities §4](input-system-entities.md) for the input schema.

## 5. Transmission Line

In-memory line representation:

- Entity ID, name, source/target bus IDs
- Lifecycle: `entry_stage_id`, `exit_stage_id`
- **Capacity**: `direct_mw`, `reverse_mw` — hard bounds (no slack variables)
- **Exchange cost**: Regularization cost per MWh (not a violation penalty)
- **Losses**: Transmission losses as percentage

## 6. Bus

In-memory bus representation:

- Entity ID, name
- **Deficit segments**: Pre-resolved piecewise-linear deficit cost curve. Each segment has `depth_mw` and `cost`. The final segment is unbounded (ensures LP feasibility). Deficit is a recourse slack — see [Penalty System §2](penalty-system.md).
- **Excess cost**: Cost for surplus generation absorption (recourse slack)

## 7. Pumping Station

In-memory pumping station representation. Independent system element — not a property of any hydro. See [Input System Entities §5](input-system-entities.md).

- Entity ID, name, bus assignment
- `source_hydro_id`, `destination_hydro_id` — water transfer endpoints
- Lifecycle: `entry_stage_id`, `exit_stage_id`
- `consumption_mw_per_m3s` — power consumption rate
- Flow bounds: `min_m3s`, `max_m3s`
- No explicit cost — cost is implicit via energy consumption at the connected bus

## 8. Energy Contract

In-memory contract representation. See [Input System Entities §6](input-system-entities.md).

- Entity ID, name, bus assignment
- Type: `import` or `export`
- Lifecycle: `entry_stage_id`, `exit_stage_id`
- `price_per_mwh` — cost (import) or revenue (export)
- Limits: `min_mw`, `max_mw`

## 9. Non-Controllable Source

In-memory non-controllable source representation. See [Input System Entities §7](input-system-entities.md).

Non-controllable sources represent intermittent generation (wind farms, solar plants, small hydros run-of-river, etc.) whose available output depends on external conditions rather than dispatch decisions. The solver receives a stochastic availability value per scenario and can only curtail generation below that availability — it cannot dispatch upward.

- Entity ID, name, bus assignment
- Lifecycle: `entry_stage_id`, `exit_stage_id`
- `max_generation_mw` — installed capacity (hard upper bound, physical limit)
- **Availability**: stochastic generation available per (stage, scenario), provided by the scenario pipeline. Bounded by `[0, max_generation_mw]`.
- **Generation variable**: bounded by `[0, available_generation]` — the solver dispatches between 0 and whatever is available
- **Curtailment**: the difference between available generation and dispatched generation. Penalized with `curtailment_cost` (regularization, Category 3) to prioritize using non-controllable generation over curtailing it. Analogous to spillage cost for hydros — curtailment discards available "free" energy.

## 10. Penalty Tables (Pre-Resolved)

At runtime, the solver needs a single resolved penalty value for each (entity, stage, penalty_type) tuple. The three-tier cascade (global defaults → entity overrides → stage overrides) is resolved during input loading. See [Penalty System](penalty-system.md) for the cascade semantics and penalty categories.

### Pre-Resolution

During input loading, the implementation should build a resolved penalty lookup that can answer: "what is the effective penalty for entity X, stage T, penalty type P?" in constant time. The resolution walks:

1. Start with global defaults from `penalties.json`
2. Apply entity-level overrides from entity registry files (`hydros.json`, `buses.json`, etc.)
3. Apply stage-level overrides from stage override files

### Penalty Types Per Entity

**Bus penalties:**

| Penalty            | Category | Description                                |
| ------------------ | -------- | ------------------------------------------ |
| `deficit_segments` | Recourse | Piecewise deficit cost (not stage-varying) |
| `excess_cost`      | Recourse | Surplus generation absorption              |

**Line penalties:**

| Penalty         | Category       | Description         |
| --------------- | -------------- | ------------------- |
| `exchange_cost` | Regularization | Flow discouragement |

**Hydro penalties:**

| Penalty                           | Category             | Description                                                                  |
| --------------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `spillage_cost`                   | Regularization       | Prefer turbining over spilling                                               |
| `diversion_cost`                  | Regularization       | Prefer main channel flow                                                     |
| `fpha_turbined_cost`              | Regularization       | Prevent interior FPHA solutions (FPHA model only, must be > `spillage_cost`) |
| `storage_violation_below_cost`    | Constraint violation | Storage below dead volume                                                    |
| `filling_target_violation_cost`   | Constraint violation | Filling target not reached                                                   |
| `turbined_violation_below_cost`   | Constraint violation | Turbined flow below minimum                                                  |
| `outflow_violation_below_cost`    | Constraint violation | Outflow below environmental minimum                                          |
| `outflow_violation_above_cost`    | Constraint violation | Outflow above flood control limit                                            |
| `generation_violation_below_cost` | Constraint violation | Generation below contractual minimum                                         |
| `evaporation_violation_cost`      | Constraint violation | Evaporation constraint (bidirectional)                                       |
| `water_withdrawal_violation_cost` | Constraint violation | Unmet water withdrawal                                                       |

**Non-controllable source penalties:**

| Penalty            | Category       | Description                                                                          |
| ------------------ | -------------- | ------------------------------------------------------------------------------------ |
| `curtailment_cost` | Regularization | Penalizes curtailing available generation; prioritizes using non-controllable energy |

### Penalty Priority Ordering

$$\text{Filling target} > \text{Storage violation} > \text{Deficit} > \text{Constraint violations} > \text{Resource costs} > \text{Regularization}$$

Regularization costs (spillage, diversion, FPHA turbined, curtailment, exchange) are the lowest priority — they guide solution quality when the LP has degrees of freedom, but never override economic or feasibility objectives. Within FPHA hydros, the constraint `fpha_turbined_cost > spillage_cost` must hold per plant.

## 11. Pre-Resolved Entity Bounds

Similar to penalties, entity bounds are resolved during loading from the base values in entity registries with sparse stage overrides applied on top. The internal representation should provide: "what are the effective bounds for entity X, stage T?" in constant time.

### Bound Resolution

For each entity type, the base bounds come from the entity registry file (e.g., `hydros.json`). Stage-specific overrides from the constraints directory (e.g., `hydro_bounds`) replace individual fields where provided (null = keep base). See [Input Constraints §2](input-constraints.md).

### Hydro Bounds Per Stage

The resolved set of hydro bounds for a given (hydro, stage):

| Bound                  | Source                          | Slack                        |
| ---------------------- | ------------------------------- | ---------------------------- |
| `min_storage_hm3`      | Reservoir config                | `storage_violation_below`    |
| `max_storage_hm3`      | Reservoir config                | Hard (emergency spill)       |
| `min_turbined_m3s`     | Generation model                | `turbined_violation_below`   |
| `max_turbined_m3s`     | Generation model                | Hard                         |
| `min_outflow_m3s`      | Outflow config                  | `outflow_violation_below`    |
| `max_outflow_m3s`      | Outflow config                  | `outflow_violation_above`    |
| `min_generation_mw`    | Generation model                | `generation_violation_below` |
| `max_generation_mw`    | Generation model                | Hard                         |
| `max_diversion_m3s`    | Diversion config                | Hard                         |
| `filling_inflow_m3s`   | Filling config → stage override | —                            |
| `water_withdrawal_m3s` | Stage override                  | `water_withdrawal_violation` |

## 12. Stage and Block Definitions

The temporal structure must be fully loaded in memory for the solver to dimension LPs and iterate:

### Stage

- `id` — unique identifier (non-negative for study, negative for pre-study)
- `start_date`, `end_date` — temporal extent
- `season_id` — links to season definitions for PAR model cycling
- `blocks` — ordered list of blocks (see below)
- `block_mode` — `parallel` or `chronological` (can vary per stage)
- `state_variables` — boolean flags: `storage` (default true), `inflow_lags` (default false)
- `risk_measure` — `expectation` or CVaR parameters (`alpha`, `lambda`)
- `num_scenarios` — branching factor for this stage
- `sampling_method` — SAA, LHS, QMC, etc.

### Block

- `id` — contiguous within stage (0, 1, 2, ...)
- `name` — human-readable label
- `hours` — duration in hours
- Derived: `weight = hours / sum(all block hours in stage)`

### Policy Graph

The policy graph defines stage transitions and discounting:

- `type` — `finite_horizon` or `cyclic`
- `annual_discount_rate` — global rate, auto-converted to per-transition factor: `beta = 1/(1+r)^dt`
- Transitions: list of `(source_id, target_id, probability)` with optional per-transition rate overrides

### Season Definitions

Maps `season_id` to calendar periods. Required when deriving AR parameters from inflow history.

- `cycle_type`: `monthly` (12 seasons), `weekly` (52), or `custom`
- Validation: all stages sharing a `season_id` must have equal duration

## 13. Block Factors

Block factors modify LP bounds and demand values per (entity, stage, block). They are loaded during initialization and used when constructing LP definitions.

- **Load factors**: Per (bus, stage, block) multipliers on stochastic load demand. Affect the actual demand value in the load balance constraint.
- **Exchange factors**: Per (line, stage, block) multipliers on line capacity (direct and reverse). Affect the line flow bounds in the LP — a different role from load factors. Values >1.0 represent higher block-level capacity.

Default: 1.0 when not specified.

## 14. Scenario Pipeline

The scenario pipeline state loaded in memory:

### Inflow Models (Per Hydro, Per Stage)

Pre-resolved seasonal statistics and AR coefficients:

- `mean_m3s` (mu) — seasonal mean inflow
- `std_m3s` (sigma) — seasonal standard deviation
- AR order `p` and coefficient list `[psi_1, ..., psi_p]` (variable length, can be 0)

Source: user-provided `inflow_seasonal_stats.parquet` (mu, sigma, ar_order) + optional `inflow_ar_coefficients.parquet` (lag coefficients), OR derived from `inflow_history` via season aggregation and Yule-Walker fitting. See [Input Scenarios §2-3](input-scenarios.md).

### Load Seasonal Statistics (Per Bus, Per Stage)

- `mean_mw`, `std_mw` — load statistics (typically no AR structure)

### Correlation Model

- Named profiles, each containing correlation groups with entity lists and correlation matrices
- Stage-to-profile mapping (schedule) — pre-resolved so the solver can look up the active profile per stage
- Cholesky-decomposed matrices ready for scenario generation

Source: user-provided `correlation.json` OR estimated from AR residuals of inflow history. See [Input Scenarios §5](input-scenarios.md).

## 15. Generic Constraints

User-defined linear constraints parsed and validated during loading. See [Input Constraints §3](input-constraints.md).

### Constraint Definition

Each generic constraint has:

- `id`, `name`, `description`
- **Parsed expression**: A list of linear terms, each being `coefficient x variable_reference`, plus a constant
- **Sense**: `>=`, `<=`, or `==`
- **Slack config**: whether a slack variable is created, and its penalty cost

### Variable References

The expression parser produces typed variable references. The full catalog:

| Variable                       | Entity                  | Block-specific                      |
| ------------------------------ | ----------------------- | ----------------------------------- |
| `hydro_storage`                | hydro                   | No (stage-level)                    |
| `hydro_turbined`               | hydro                   | Yes                                 |
| `hydro_spillage`               | hydro                   | Yes                                 |
| `hydro_diversion`              | hydro                   | Yes                                 |
| `hydro_outflow`                | hydro                   | Yes (alias for turbined + spillage) |
| `hydro_generation`             | hydro                   | Yes                                 |
| `hydro_evaporation`            | hydro                   | No                                  |
| `hydro_withdrawal`             | hydro                   | No                                  |
| `thermal_generation`           | thermal                 | Yes                                 |
| `line_direct`                  | line                    | Yes                                 |
| `line_reverse`                 | line                    | Yes                                 |
| `bus_deficit`                  | bus                     | Yes                                 |
| `bus_excess`                   | bus                     | Yes                                 |
| `pumping_flow`                 | pumping station         | Yes                                 |
| `pumping_power`                | pumping station         | Yes                                 |
| `contract_import`              | contract                | Yes                                 |
| `contract_export`              | contract                | Yes                                 |
| `non_controllable_generation`  | non-controllable source | Yes                                 |
| `non_controllable_curtailment` | non-controllable source | Yes                                 |

### Constraint Bounds

Pre-resolved per (constraint_id, stage_id, block_id). If no bound exists for a (constraint, stage), the constraint is not active for that stage.

### Validation (at load time)

All entity IDs referenced in constraint expressions must exist in the loaded system. Block IDs (if specified) must be valid for the stage. Expression parsing errors are reported at load time, not at LP build time.

## 16. Initial Conditions

Pre-resolved initial state:

- **Storage** (operating hydros): `value_hm3` per hydro, validated within `[min_storage_hm3, max_storage_hm3]`
- **Filling storage** (filling hydros): `value_hm3` per hydro, validated within `[0, min_storage_hm3]`
- **GNL pipeline**: For each GNL thermal, the committed dispatch (MW) for each future stage within the lag window. Represented as `(thermal_id, stage_offset, committed_mw)` tuples where `stage_offset` ranges from 1 to `lag_stages`. These values initialize the GNL state variables at the start of the study. See [Input Constraints §1](input-constraints.md).

> **Note**: GNL pipeline initial conditions are currently rejected by validation (GNL thermals are not accepted). When GNL support is implemented, the validation rule will be relaxed and these initial conditions will be required for any thermal with `gnl_config` defined.

See [Input Constraints §1](input-constraints.md).

## Cross-References

- [Input System Entities](input-system-entities.md) — JSON schemas that map to entity representations
- [Input Hydro Extensions](input-hydro-extensions.md) — Geometry, production models, FPHA hyperplanes
- [Input Constraints](input-constraints.md) — Initial conditions, time-varying bounds, generic constraints
- [Input Scenarios](input-scenarios.md) — Stage/block, inflow, and load data, correlation
- [Penalty System](penalty-system.md) — Penalty cascade resolution and categories
- [Binary Formats](binary-formats.md) — Serialization format decisions, FlatBuffers policy schema, cut pool persistence
- [Scenario Generation](../architecture/scenario-generation.md) — Opening tree lifecycle (§2.3), sampling scheme abstraction (§3)
- [LP Formulation](../math/lp-formulation.md) — Stage subproblem LP that consumes these internal structures at runtime
- [Design Principles](../overview/design-principles.md) — Order invariance requirement (§3)
- [Input Loading Pipeline](../architecture/input-loading-pipeline.md) — File loading sequence, broadcast strategy, transition to in-memory model (sections 2, 6, 8)
- [Training Loop](../architecture/training-loop.md) — SDDP algorithm that consumes System via shared reference (section 1)
- [Solver Abstraction](../architecture/solver-abstraction.md) — Stage LP template design built from System data (section 11)
- [Solver Workspaces](../architecture/solver-workspaces.md) — Thread-local workspace layout for performance-adapted views
- [Implementation Ordering](../overview/implementation-ordering.md) — Build sequence with cobre-core as foundation (section 4)
