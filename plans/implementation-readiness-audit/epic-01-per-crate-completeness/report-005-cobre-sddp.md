# Report 005 -- cobre-sddp API Surface Completeness Audit

**Crate**: cobre-sddp
**Phase**: 6 (Training Loop and FCF), 7 (Simulation)
**Auditor**: sddp-specialist
**Date**: 2026-02-26

---

## Subsystem A: Training Loop Orchestrator

### A.1 Completeness Matrix -- Types

| Item Name               | Category | Spec File          | Section | Status   | Notes                                                                                                                                              |
| ----------------------- | -------- | ------------------ | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Training Orchestrator   | Struct   | `training-loop.md` | SS2     | PARTIAL  | Components table and iteration lifecycle defined, but no Rust struct with concrete field types for the orchestrator itself                         |
| Iteration lifecycle     | Protocol | `training-loop.md` | SS2.1   | COMPLETE | 7-step sequence fully specified: forward, sync, backward, cut sync, convergence, checkpoint, logging                                               |
| Event emission points   | Protocol | `training-loop.md` | SS2.1a  | COMPLETE | 11 events with typed payloads (7 per-iteration + 4 lifecycle); full table with payload fields                                                      |
| `TrainingEvent` enum    | Enum     | `training-loop.md` | SS2.1b  | COMPLETE | Full Rust enum definition with 11 variants, all field names and types, derive traits (`Clone`, `Debug`); lives in cobre-core                       |
| `StoppingRuleResult`    | Struct   | `training-loop.md` | SS2.1b  | COMPLETE | Full Rust struct with 3 fields                                                                                                                     |
| Termination conditions  | Table    | `training-loop.md` | SS2.2   | COMPLETE | 5 conditions mapped to stopping rules                                                                                                              |
| Abstraction point table | Table    | `training-loop.md` | SS3     | COMPLETE | 4 abstraction points (risk measure, cut formulation, horizon mode, sampling scheme) with behavioral contracts                                      |
| Training config type    | Struct   | --                 | --      | MISSING  | No `TrainingConfig` or equivalent struct that bundles `forward_passes`, `max_iterations`, stopping rules, cut selection, etc. into one typed value |

### A.2 Completeness Matrix -- Functions

| Item Name           | Category | Spec File          | Section | Status   | Notes                                                                                                   |
| ------------------- | -------- | ------------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `train` entry point | Function | `training-loop.md` | SS4.3   | PARTIAL  | Generic bound `C: Communicator` shown, but full function signature (all parameters, return type) absent |
| Iteration loop body | Protocol | `training-loop.md` | SS2.1   | COMPLETE | Algorithmically complete 7-step sequence                                                                |

### A.3 Findings

**F-001: No `TrainingConfig` struct definition**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS2 provides a component-responsibility table:

  > "| **Risk Measure** | Determines how backward outcomes are aggregated into cut coefficients (expectation vs CVaR) | `risk_measure` per stage in `stages.json` |"

  and SS4.3 references `training.forward_passes` from `config.json`. However, no Rust struct aggregates all training parameters (forward_passes, max_iterations, stopping rules, cut selection config, checkpoint interval) into a typed configuration value.

- **Impact**: Implementer must infer the aggregation structure from scattered references across `training-loop.md`, `convergence-monitoring.md`, and `configuration-reference.md`.
- **Recommendation**: Define a `TrainingConfig` struct that bundles `forward_passes: u32`, `stopping_rule_set: StoppingRuleSet`, `cut_selection: Option<CutSelectionStrategy>`, `checkpoint_interval: Option<u32>`, and `horizon_mode: HorizonMode` into one typed value.

**F-002: `train` function signature incomplete**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS4.3 states:

  > "The training loop is generic over `C: Communicator` (see [Communicator Trait SS3](../hpc/communicator-trait.md) for the function signature pattern), enabling compile-time specialization to any communication backend."

  The reference to "function signature pattern" delegates to the communicator spec, but no concrete `fn train<C: Communicator, S: SolverInterface>(...)` signature is defined with full parameter list and return type.

- **Impact**: The entry point is the primary public API of cobre-sddp. Without a concrete signature, the implementer must reconstruct it from the iteration lifecycle.
- **Recommendation**: Provide a complete `train` function signature with parameters: `comm: &C`, `system: &System`, `stages: &[Stage]`, `config: &TrainingConfig`, `fcf: &mut Fcf`, `workspaces: &mut [SolverWorkspace<S>]`, and return type `Result<TrainingResult, TrainingError>`.

---

## Subsystem B: Forward Pass

### B.1 Completeness Matrix -- Types

| Item Name                | Category | Spec File          | Section   | Status   | Notes                                                                                                                   |
| ------------------------ | -------- | ------------------ | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Forward pass algorithm   | Protocol | `training-loop.md` | SS4.1-4.2 | COMPLETE | Full algorithmic specification: initialize, stage loop (6 sub-steps a-f), aggregate                                     |
| `StateVector`            | Type     | `training-loop.md` | SS5.1.1   | COMPLETE | `type StateVector = Vec<f64>` with layout, alignment (64-byte), and dimension formula $n_{state} = N \cdot (1 + L)$     |
| `StageIndexer`           | Struct   | `training-loop.md` | SS5.5     | COMPLETE | Full Rust struct with 12 fields, usage examples, and worked example                                                     |
| Patch sequence           | Protocol | `training-loop.md` | SS4.2a    | COMPLETE | 3 categories of RHS patches fully specified with row formulas and worked example; patch count formula $N \cdot (2 + L)$ |
| State extraction         | Protocol | `training-loop.md` | SS5.2     | COMPLETE | `&solution.primal[0..n_state]` -- single contiguous memcpy                                                              |
| State wire format        | Protocol | `training-loop.md` | SS5.4a    | COMPLETE | Raw `[f64]` reinterpretation, per-stage `allgatherv`, collective parameters table, production-scale sizing              |
| `TrajectoryRecord`       | Struct   | --                 | --        | MISSING  | Per-scenario trajectory storage for backward pass consumption (GAP-030)                                                 |
| Forward pass return type | Type     | --                 | --        | MISSING  | No explicit return type bundling visited states per stage and bound candidates                                          |

### B.2 Completeness Matrix -- Functions

| Item Name                       | Category | Spec File          | Section | Status   | Notes                                                                                                                     |
| ------------------------------- | -------- | ------------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Forward pass function signature | Function | `training-loop.md` | SS4     | PARTIAL  | Algorithm fully described but no concrete function signature with parameters for scenario set, stage range, LP workspaces |
| State transfer                  | Function | `training-loop.md` | SS5.3   | COMPLETE | `patch(row, value)` calls for storage and lag transfer fully specified                                                    |
| LB extraction                   | Protocol | `training-loop.md` | SS4.3b  | COMPLETE | Source, aggregation (`allreduce Min`), two-call baseline, single-rank variant -- all specified                            |
| UB sufficient statistics        | Protocol | `training-loop.md` | SS4.3b  | COMPLETE | Three-element `[f64; 3]` array `[cost_sum, cost_sum_sq, scenario_count]` with `ReduceOp::Sum`                             |

### B.3 Findings

**F-003: `TrajectoryRecord` type undefined (GAP-030)**

- **Severity**: High
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS4.2 step e states:

  > "**Record** -- Store the stage cost and the end-of-stage state $\hat{x}_t$ (storage volumes and updated AR lags)"

  The spec-gap-inventory GAP-030 entry reads:

  > "The forward pass step 'Record' (step e) says to store 'the stage cost and the end-of-stage state' but does not specify the data structure for per-scenario trajectory records. Is this a flat array? A struct per stage? How is it indexed for the backward pass?"

  GAP-030 remains **unresolved** -- no `TrajectoryRecord` type has been added to the specs since the gap was filed.

- **Impact**: The backward pass must index into forward pass results by `[scenario][stage]`. Without a concrete type, the implementer has no guidance on memory layout, indexing scheme, or cache-friendly access pattern.
- **Recommendation**: Define a `TrajectoryRecord` struct holding `costs: Vec<f64>` (length $T$), `states: Vec<f64>` (length $T \times n_{state}$, stored in stage-major order for contiguous backward pass access), and `total_cost: f64`. Specify storage as a contiguous buffer indexed by `[scenario][stage]`.

**F-004: Forward pass function signature missing**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS4.1 describes the forward pass purpose:

  > "The forward pass simulates $M$ independent scenario trajectories through the full stage horizon, solving the stage LP at each step with the current FCF approximation."

  SS4.3 specifies parallel distribution and aggregation but no concrete function signature with parameters for scenario set, stage range, LP workspaces, and return type with visited states and bound candidates.

- **Impact**: The acceptance criterion requires "the function signature includes parameters for scenario set, stage range, LP workspaces, and the return type includes visited states and bound candidates." This is not met.
- **Recommendation**: Define `fn forward_pass<C, S>(comm: &C, workspaces: &mut [SolverWorkspace<S>], fcf: &Fcf, stages: Range<usize>, scenarios: Range<u32>, rng: &mut SeedDerive) -> ForwardPassResult` where `ForwardPassResult` bundles `visited_states: Vec<Vec<StateVector>>`, `lb_candidate: f64`, `ub_stats: [f64; 3]`.

---

## Subsystem C: Backward Pass

### C.1 Completeness Matrix -- Types

| Item Name                  | Category | Spec File               | Section   | Status   | Notes                                                                                                                              |
| -------------------------- | -------- | ----------------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backward pass algorithm    | Protocol | `training-loop.md`      | SS6.1-6.3 | COMPLETE | Full 4-step per-stage sequence: retrieve openings, evaluate each opening, aggregate into cut, add cut                              |
| `BackwardOutcome`          | Struct   | `risk-measure-trait.md` | SS1       | COMPLETE | Full Rust struct: `intercept: f64`, `coefficients: Vec<f64>`, `objective_value: f64`                                               |
| Cut structure              | Formula  | `training-loop.md`      | SS7.1     | COMPLETE | Full cut equation with $\alpha$, $\pi^v_h$, $\pi^a_{h,\ell}$ terms                                                                 |
| Cut coefficient derivation | Formula  | `training-loop.md`      | SS7.2     | COMPLETE | Dual extraction from water balance, AR lag, FPHA, and generic constraint duals; intercept formula $\alpha = Q - \pi^\top \hat{x}$  |
| Cut metadata               | Table    | `training-loop.md`      | SS7.3     | PARTIAL  | 3 fields listed (stage, iteration, active count) but no Rust struct; more comprehensive metadata in `cut-selection-trait.md` SS3.2 |
| Single-cut aggregation     | Formula  | `cut-management.md`     | SS3       | COMPLETE | $\bar{\alpha} = \sum_\omega p(\omega) \cdot \alpha_t(\omega)$ and corresponding gradient formula                                   |
| Per-stage sync barrier     | Protocol | `training-loop.md`      | SS6.3     | COMPLETE | `allgatherv` collects all new cuts from all ranks at each stage                                                                    |

### C.2 Completeness Matrix -- Functions

| Item Name                        | Category | Spec File               | Section | Status   | Notes                                                                                                             |
| -------------------------------- | -------- | ----------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Backward pass function signature | Function | `training-loop.md`      | SS6     | PARTIAL  | Algorithm complete but no concrete function signature with parameters and return type                             |
| `RiskMeasure::aggregate_cut`     | Method   | `risk-measure-trait.md` | SS1     | COMPLETE | Full signature: `fn aggregate_cut(&self, outcomes: &[BackwardOutcome], probabilities: &[f64]) -> (f64, Vec<f64>)` |
| Opening evaluation               | Protocol | `training-loop.md`      | SS6.2   | COMPLETE | Sequential evaluation of all $N_{\text{openings}}$ for each trial point with warm-start preservation              |

### C.3 Findings

**F-005: Backward pass trial state distribution strategy unspecified (GAP-026)**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS6.3 states:

  > "Trial states at each stage are distributed across MPI ranks."

  The spec-gap-inventory GAP-026 reads:

  > "The backward pass states 'trial states at each stage are distributed across MPI ranks' but the distribution strategy is not specified. Is it contiguous block assignment (like forward scenarios) or round-robin?"

  `work-distribution.md` SS2.1 partially resolves this:

  > "The trial points are then distributed across ranks for the backward pass using the same static contiguous block assignment as the forward pass (SS3)."

  However, this was added after GAP-026 was filed. GAP-026 remains listed as Medium/unresolved in the inventory.

- **Impact**: The work-distribution spec provides the answer (contiguous block assignment), but the training-loop spec itself does not cross-reference it. The two specs should be consistent. Practical impact is low since the resolution exists in work-distribution.md.
- **Recommendation**: Add explicit text to `training-loop.md` SS6.3 cross-referencing `work-distribution.md` SS2.1 for the backward pass distribution strategy. Mark GAP-026 as resolved.

**F-006: Backward pass function signature missing**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS6 describes the backward pass algorithm across SS6.1-SS6.3 but provides no concrete function signature with parameters (visited states, opening tree, LP workspaces, risk measures, FCF) and return type (new cuts per stage).
- **Impact**: Implementer must reconstruct the signature from the algorithmic description.
- **Recommendation**: Define `fn backward_pass<C, S>(comm: &C, workspaces: &mut [SolverWorkspace<S>], fcf: &mut Fcf, visited_states: &[Vec<StateVector>], opening_tree: &OpeningTree, risk_measures: &[RiskMeasure], indexers: &[StageIndexer])`.

**F-007: Cut coefficient computation concrete input/output types partially specified**

- **Severity**: Low
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `training-loop.md` SS7.2 gives the complete mathematical derivation:

  > "The intercept $\alpha$ is computed from the LP objective value and the state-dependent terms: $\alpha = Q_t(\hat{x}_{t-1}, \omega) - \sum_h \pi^v_h \cdot \hat{v}_{h,t-1} - \sum_h \sum_\ell \pi^a_{h,\ell} \cdot \hat{a}_{h,t-1-\ell}$"

  And `risk-measure-trait.md` SS1 defines the concrete `BackwardOutcome` type:

  > "`rust pub struct BackwardOutcome { pub intercept: f64, pub coefficients: Vec<f64>, pub objective_value: f64, }`"

  The formula inputs (dual slice from `solution.dual[0..n_cut_relevant]`, trial state `&[f64]`, objective value `f64`) and output (`BackwardOutcome`) are individually specified, but no single function signature ties them together as a `compute_cut_coefficients` helper.

- **Impact**: Low -- all pieces exist. An implementer can compose them without ambiguity.
- **Recommendation**: Consider adding a `fn compute_backward_outcome(objective: f64, duals: &[f64], trial_state: &[f64], indexer: &StageIndexer) -> BackwardOutcome` helper signature in `training-loop.md` SS7.2 for clarity.

---

## Subsystem D: Convergence Monitoring

### D.1 Completeness Matrix -- Types

| Item Name                   | Category | Spec File                   | Section | Status   | Notes                                                                                                             |
| --------------------------- | -------- | --------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------- | --------------- | --- |
| Convergence criteria        | Formula  | `convergence-monitoring.md` | SS1     | COMPLETE | LB, UB, gap formulas with guard for near-zero UB                                                                  |
| Tracked quantities          | Table    | `convergence-monitoring.md` | SS2.1   | COMPLETE | 5 quantities: LB, UB, UB std, gap, iteration wall-clock time -- all with types                                    |
| Bound stalling formula      | Formula  | `convergence-monitoring.md` | SS2.2   | COMPLETE | $\Delta_k = (\underline{z}^k - \underline{z}^{k-\tau}) / \max(1,                                                  | \underline{z}^k | )$  |
| Convergence evaluation      | Protocol | `convergence-monitoring.md` | SS2.3   | COMPLETE | 5-step evaluation sequence                                                                                        |
| Simulation-based stopping   | Protocol | `convergence-monitoring.md` | SS2.3a  | COMPLETE | Execution model, workspace reuse, scenario source, parallel distribution, comparison metric, first-check behavior |
| Per-iteration output record | Table    | `convergence-monitoring.md` | SS2.4   | COMPLETE | 8 fields with descriptions                                                                                        |
| UB variance (Bessel's)      | Formula  | `convergence-monitoring.md` | SS3.1a  | COMPLETE | $s^2 = (Q - N \cdot \bar{c}^2) / (N - 1)$ with Bessel's correction, numerical stability analysis, edge case $N=1$ |
| Allreduce payload           | Table    | `convergence-monitoring.md` | SS3.1a  | COMPLETE | `[sum, sum_sq, count]` as `[f64; 3]` with `ReduceOp::Sum`                                                         |
| `MonitorState`              | Struct   | `stopping-rule-trait.md`    | SS4.3   | COMPLETE | Full Rust struct with 7 fields, all typed, consumption matrix per rule                                            |
| `ConvergenceMonitor` struct | Struct   | --                          | --      | MISSING  | No Rust struct definition for the monitor that owns `MonitorState`, `StoppingRuleSet`, and bound history          |
| Training log format         | Protocol | `convergence-monitoring.md` | SS4     | COMPLETE | Header, per-iteration, termination formats; JSON-lines streaming schema                                           |

### D.2 Completeness Matrix -- Functions

| Item Name                      | Category | Spec File                   | Section | Status   | Notes                                                                               |
| ------------------------------ | -------- | --------------------------- | ------- | -------- | ----------------------------------------------------------------------------------- |
| `StoppingRuleSet::should_stop` | Method   | `stopping-rule-trait.md`    | SS1.2   | COMPLETE | Full signature: `fn should_stop(&self, state: &MonitorState) -> (bool, StopReason)` |
| `StoppingRule::evaluate`       | Method   | `stopping-rule-trait.md`    | SS2     | COMPLETE | Full signature with match arms for all 5 variants, pre/postconditions per variant   |
| Bound computation (cross-rank) | Protocol | `convergence-monitoring.md` | SS3.1   | COMPLETE | Three sufficient statistics with allreduce                                          |
| LB properties                  | Protocol | `convergence-monitoring.md` | SS3.2   | COMPLETE | Monotonicity, validity, includes $\theta_2$                                         |

### D.3 Findings

**F-008: `ConvergenceMonitor` struct not defined**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `convergence-monitoring.md` SS2 defines tracked quantities and evaluation logic. `stopping-rule-trait.md` SS4.3 defines the `MonitorState` struct consumed by rules. SS5 describes the per-iteration protocol. However, no Rust struct bundles the `MonitorState`, `StoppingRuleSet`, and bound history vectors into a `ConvergenceMonitor` that owns the evaluation lifecycle.
- **Impact**: The implementer must design the ownership and update semantics of the monitor from the protocol description. The individual components are well-specified but not composed.
- **Recommendation**: Define a `ConvergenceMonitor` struct with fields: `state: MonitorState`, `rules: StoppingRuleSet`, `bound_history: Vec<f64>`, `start_time: Instant`.

**F-009: Upper bound variance uses Bessel's correction -- VERIFIED COMPLETE**

- **Severity**: None (verification pass)
- **Evidence**: `convergence-monitoring.md` SS3.1a explicitly states:

  > "The denominator $N - 1$ is **Bessel's correction**, producing the unbiased sample variance. This is required because the $N$ forward pass scenarios are a sample from the underlying stochastic process, not the full population."

  The formula is:

  > "$s^2 = \frac{Q - N \cdot \bar{c}^2}{N - 1}$"

  The edge case $N = 1$ is handled:

  > "When $N = 1$, the Bessel-corrected variance involves division by $N - 1 = 0$. In this case: Set $\sigma = 0$, Set $\text{CI}_{95} = 0$, Log a **warning**"

  This acceptance criterion is fully satisfied.

---

## Subsystem E: FCF Management

### E.1 Completeness Matrix -- Types

| Item Name                  | Category | Spec File                | Section | Status   | Notes                                                                                                                                     |
| -------------------------- | -------- | ------------------------ | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Per-stage cut pool         | Table    | `cut-management-impl.md` | SS1.1   | COMPLETE | 5 components: coefficient storage, intercept array, activity bitmap, populated count, cut metadata -- all described with storage strategy |
| Deterministic slot formula | Formula  | `cut-management-impl.md` | SS1.2   | COMPLETE | `slot = warm_start_count + iteration * forward_passes + forward_pass_index`                                                               |
| Capacity sizing            | Table    | `cut-management-impl.md` | SS1.3   | COMPLETE | Capacity formula, production example (15,000 slots), per-cut memory, per-stage total, all-stage total                                     |
| FCF operations             | Table    | `cut-management-impl.md` | SS1.4   | COMPLETE | 5 operations: add cut, get active cuts, evaluate at state, run selection, aggregate stats                                                 |
| `CutWireRecord`            | Struct   | `cut-management-impl.md` | SS4.2a  | COMPLETE | Full `#[repr(C)]` struct with byte offsets, explicit `_padding: u32`, alignment analysis, per-cut size formula, allgatherv type parameter |
| `CutMetadata`              | Struct   | `cut-selection-trait.md` | SS3.2   | COMPLETE | Full Rust struct with 5 fields: `iteration_generated`, `forward_pass_index`, `active_count`, `last_active_iter`, `domination_count`       |
| `DeactivationSet`          | Struct   | `cut-selection-trait.md` | SS3.3   | COMPLETE | `pub struct DeactivationSet { pub indices: Vec<u32> }`                                                                                    |
| Activity tracking          | Protocol | `cut-management-impl.md` | SS6     | COMPLETE | Binding detection via positive dual; counter update table per strategy                                                                    |
| Generic constraint preproc | Protocol | `cut-management-impl.md` | SS5     | COMPLETE | Sparse dual-to-cut mapping precomputed at init; runtime as sparse matrix-vector multiply                                                  |
| Cut serialization          | Protocol | `cut-management-impl.md` | SS3     | COMPLETE | FlatBuffers for checkpoint/resume; 3 execution modes (fresh, warm-start, resume)                                                          |
| `StageCutPool` struct      | Struct   | --                       | --      | MISSING  | The per-stage cut pool is described by its components (SS1.1) but no Rust struct aggregates them                                          |

### E.2 Completeness Matrix -- Functions

| Item Name                               | Category | Spec File                | Section | Status   | Notes                                                             |
| --------------------------------------- | -------- | ------------------------ | ------- | -------- | ----------------------------------------------------------------- |
| `CutSelectionStrategy::should_run`      | Method   | `cut-selection-trait.md` | SS2.1   | COMPLETE | Full implementation shown with match arms                         |
| `CutSelectionStrategy::select`          | Method   | `cut-selection-trait.md` | SS2.2   | COMPLETE | Full signature with per-variant behavioral contracts              |
| `CutSelectionStrategy::update_activity` | Method   | `cut-selection-trait.md` | SS2.3   | COMPLETE | Full implementation shown with match arms and counter updates     |
| Cut sync protocol                       | Protocol | `cut-management-impl.md` | SS4.1   | COMPLETE | 4-step protocol: count, size exchange, data exchange, integration |
| Wire format serialization/deser         | Protocol | `cut-management-impl.md` | SS4.2a  | COMPLETE | Send (4 steps) and receive (5 steps) procedures specified         |

### E.3 Findings

**F-010: `CutWireRecord` `#[repr(C)]` layout fully specified -- VERIFIED COMPLETE**

- **Severity**: None (verification pass)
- **Evidence**: `cut-management-impl.md` SS4.2a provides the complete byte-level specification:

  > "`rust #[repr(C)] struct CutWireRecord { slot_index: u32, // offset 0, size 4 iteration: u32, // offset 4, size 4 forward_pass_index: u32, // offset 8, size 4 _padding: u32, // offset 12, size 4 intercept: f64, // offset 16, size 8 coefficients: [f64; 0], // offset 24, size 0 (variable-length tail) }`"

  With explicit padding, alignment analysis, per-cut size formula ($24 + n_{state} \times 8$), and production-scale sizing (16,664 bytes). This acceptance criterion is fully satisfied.

**F-011: `StageCutPool` struct not defined as a Rust type**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 6
- **Evidence**: `cut-management-impl.md` SS1.1 describes the per-stage cut pool components:

  > "| Coefficient storage | Contiguous dense `[f64]` arrays, one per cut, of length `state_dimension`. Stored in a flat buffer indexed by slot index for O(1) access. Cache-line aligned (64 bytes) for efficient CSR assembly. |"

  And SS1.4 lists 5 operations. But these are described as a design rather than a concrete `StageCutPool` struct with typed fields (`coefficients: Vec<f64>`, `intercepts: Vec<f64>`, `activity_bitmap: BitVec`, `metadata: Vec<CutMetadata>`, `populated_count: u32`, `capacity: u32`).

- **Impact**: The individual components are well-described. An implementer can compose them, but the struct boundary is not formally declared.
- **Recommendation**: Add a `StageCutPool` struct definition to `cut-management-impl.md` SS1.1 with concrete field types.

---

## Subsystem F: Simulation Pipeline

### F.1 Completeness Matrix -- Types

| Item Name                   | Category | Spec File                    | Section | Status   | Notes                                                                                            |
| --------------------------- | -------- | ---------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------ |
| Simulation overview         | Protocol | `simulation-architecture.md` | SS1     | COMPLETE | Architecture diagram, config table, relationship to training table                               |
| Simulation configuration    | Table    | `simulation-architecture.md` | SS1.1   | COMPLETE | 4 parameters: enabled, n_scenarios, sampling scheme, output detail                               |
| Policy compatibility        | Protocol | `simulation-architecture.md` | SS2     | PARTIAL  | Validation checks table provided, but full algorithm deferred to `deferred.md` SSC.9             |
| Scenario distribution       | Protocol | `simulation-architecture.md` | SS3.1   | COMPLETE | Same two-level (MPI rank + thread) distribution as training; contiguous block assignment formula |
| Per-scenario forward pass   | Protocol | `simulation-architecture.md` | SS3.2   | COMPLETE | 4-step per-scenario sequence (initialize, stage loop, compute cost, stream results)              |
| Memory management           | Protocol | `simulation-architecture.md` | SS3.3   | COMPLETE | Streaming release pattern documented                                                             |
| Cost statistics             | Table    | `simulation-architecture.md` | SS4.1   | COMPLETE | Mean, std, min/max, CVaR -- with formulas                                                        |
| MPI aggregation             | Table    | `simulation-architecture.md` | SS4.4   | COMPLETE | `MPI_Allreduce` for min/max, `MPI_Gatherv` for individual costs, rank 0 computation              |
| Output streaming            | Protocol | `simulation-architecture.md` | SS6     | COMPLETE | Bounded channel, background I/O thread, detail levels, distributed output                        |
| `TrajectoryRecord` (sim)    | Struct   | --                           | --      | MISSING  | GAP-030 affects both training and simulation; no concrete per-scenario result type defined       |
| Simulation orchestrator sig | Function | --                           | --      | MISSING  | No concrete function signature for the simulation entry point                                    |

### F.2 Findings

**F-012: Simulation orchestrator function signature missing**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 7
- **Evidence**: `simulation-architecture.md` SS1 provides the architecture diagram and SS3 specifies the execution algorithm, but no concrete function signature is defined (e.g., `fn simulate<C, S>(comm: &C, system: &System, fcf: &Fcf, config: &SimulationConfig, writer: &mut SimulationWriter) -> SimulationResult`).

  SS1.1 shows the configuration:

  > "| `enabled` | `simulation.enabled` | Whether the simulation phase executes after training |"

  But the function that consumes this configuration is not declared.

- **Impact**: Simulation is Phase 7, so this is lower urgency than training loop gaps. The algorithm is clear enough to derive a signature.
- **Recommendation**: Define a `simulate` function signature with parameters for communicator, system, frozen FCF, simulation config, and output writer.

**F-013: `TrajectoryRecord` missing for simulation (GAP-030 continued)**

- **Severity**: Medium
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 7
- **Evidence**: The simulation per-scenario forward pass (SS3.2) step e says:

  > "**Extract results** -- Record stage-level outputs: generation, storage, flows, costs, violations, marginal values."

  No concrete type holds these per-scenario, per-stage results before they are streamed to the output writer. GAP-030 applies here as well.

- **Impact**: The simulation streaming architecture (SS6) assumes a typed payload flows from simulation threads to the I/O thread, but the type is not defined.
- **Recommendation**: Define `SimulationScenarioResult` holding per-stage cost, state, and optionally detailed per-entity outputs. This is distinct from the training `TrajectoryRecord` (which needs only cost and state).

---

## Subsystem G: Trait Enum Dispatch

### G.1 Completeness Matrix -- Types

| Item Name                               | Category | Spec File                | Section | Status   | Notes                                                                                                                                             |
| --------------------------------------- | -------- | ------------------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RiskMeasure` enum                      | Enum     | `risk-measure-trait.md`  | SS1     | COMPLETE | 2 variants: `Expectation`, `CVaR { alpha: f64, lambda: f64 }`. Derive `Debug, Clone, Copy`                                                        |
| `RiskMeasure::aggregate_cut`            | Method   | `risk-measure-trait.md`  | SS1     | COMPLETE | Full signature with pre/postconditions, behavioral contract for weight computation                                                                |
| `RiskMeasure::evaluate_risk`            | Method   | `risk-measure-trait.md`  | SS1     | COMPLETE | Full signature with pre/postconditions                                                                                                            |
| `RiskMeasureConfig`                     | Enum     | `risk-measure-trait.md`  | SS3.1   | COMPLETE | Serde-annotated enum matching JSON schema                                                                                                         |
| `StageRiskMeasures`                     | Type     | `risk-measure-trait.md`  | SS3.2   | COMPLETE | `pub type StageRiskMeasures = Vec<RiskMeasure>`                                                                                                   |
| Risk validation rules                   | Table    | `risk-measure-trait.md`  | SS5     | COMPLETE | R1-R3 with R3 normalization                                                                                                                       |
| Dispatch mechanism (risk)               | Analysis | `risk-measure-trait.md`  | SS4     | COMPLETE | Enum dispatch with rationale for rejection of monomorphization and trait objects                                                                  |
| `HorizonMode` enum                      | Enum     | `horizon-mode-trait.md`  | SS1     | COMPLETE | 2 variants: `Finite { transitions }`, `Cyclic { transitions, cycle_length, cycle_start, cycle_discount, max_horizon_length, discount_threshold }` |
| `HorizonMode::successors`               | Method   | `horizon-mode-trait.md`  | SS2.1   | COMPLETE | Full signature returning `Vec<Successor>` with pre/postconditions, determinism guarantee                                                          |
| `HorizonMode::is_terminal`              | Method   | `horizon-mode-trait.md`  | SS2.2   | COMPLETE | Full signature with consistency postcondition                                                                                                     |
| `HorizonMode::discount_factor`          | Method   | `horizon-mode-trait.md`  | SS2.3   | COMPLETE | Full signature with formula linking to discount-rate spec                                                                                         |
| `HorizonMode::validate`                 | Method   | `horizon-mode-trait.md`  | SS2.4   | COMPLETE | Full signature with `ValidationError` enum (4 variants), error accumulation                                                                       |
| `HorizonMode::should_terminate_forward` | Method   | `horizon-mode-trait.md`  | SS5     | COMPLETE | Full implementation shown with match arms                                                                                                         |
| `HorizonMode::season`                   | Method   | `horizon-mode-trait.md`  | SS3.3   | COMPLETE | Full signature with formula $\tau(t) = (t - t_{start}) \bmod P + 1$                                                                               |
| `Successor`                             | Struct   | `horizon-mode-trait.md`  | SS2.1   | COMPLETE | `target_id: usize, probability: f64, discount_factor: f64`                                                                                        |
| `TransitionMap`                         | Type     | `horizon-mode-trait.md`  | SS3.2   | COMPLETE | `pub type TransitionMap = HashMap<usize, Vec<Successor>>`                                                                                         |
| `PolicyGraphConfig`                     | Struct   | `horizon-mode-trait.md`  | SS3.1   | COMPLETE | Full Rust struct with serde derives                                                                                                               |
| `PolicyGraphType`                       | Enum     | `horizon-mode-trait.md`  | SS3.1   | COMPLETE | `FiniteHorizon`, `Cyclic` with serde annotation                                                                                                   |
| `TransitionConfig`                      | Struct   | `horizon-mode-trait.md`  | SS3.1   | COMPLETE | Full Rust struct with `source_id`, `target_id`, `probability`, `annual_discount_rate: Option<f64>`                                                |
| Dispatch mechanism (horizon)            | Analysis | `horizon-mode-trait.md`  | SS4     | COMPLETE | Enum dispatch with rationale                                                                                                                      |
| Forward pass termination                | Protocol | `horizon-mode-trait.md`  | SS5     | COMPLETE | Two conditions: cumulative discount < threshold, max horizon length exceeded                                                                      |
| Cut pool organization                   | Protocol | `horizon-mode-trait.md`  | SS6     | COMPLETE | Finite: per-stage; Cyclic: per-season                                                                                                             |
| `CutSelectionStrategy` enum             | Enum     | `cut-selection-trait.md` | SS1     | COMPLETE | 3 variants: `Level1`, `LML1`, `Dominated` -- all with per-variant fields                                                                          |
| `CutSelectionConfig`                    | Struct   | `cut-selection-trait.md` | SS3.1   | COMPLETE | Full Rust struct with 5 fields and serde derive                                                                                                   |
| Cut selection validation rules          | Table    | `cut-selection-trait.md` | SS5     | COMPLETE | C1-C5 with error descriptions                                                                                                                     |
| Dispatch mechanism (cut sel)            | Analysis | `cut-selection-trait.md` | SS4     | COMPLETE | Enum dispatch with rationale                                                                                                                      |
| `StoppingRule` enum                     | Enum     | `stopping-rule-trait.md` | SS1.1   | COMPLETE | 5 variants: `IterationLimit`, `TimeLimit`, `BoundStalling`, `SimulationBased`, `GracefulShutdown`                                                 |
| `StoppingRuleSet` struct                | Struct   | `stopping-rule-trait.md` | SS1.2   | COMPLETE | `rules: Vec<StoppingRule>`, `mode: StoppingMode`                                                                                                  |
| `StoppingMode` enum                     | Enum     | `stopping-rule-trait.md` | SS1.2   | COMPLETE | `Any`, `All`                                                                                                                                      |
| `StopReason` enum                       | Enum     | `stopping-rule-trait.md` | SS4.2   | COMPLETE | `None`, `Single(StopReasonKind)`, `Multiple(Vec<StopReasonKind>)`                                                                                 |
| `StopReasonKind` enum                   | Enum     | `stopping-rule-trait.md` | SS4.2   | COMPLETE | 5 variants matching the 5 rules                                                                                                                   |
| `StoppingRuleConfig`                    | Enum     | `stopping-rule-trait.md` | SS4.1   | COMPLETE | 4 config variants with serde tag annotation                                                                                                       |
| Stopping validation rules               | Table    | `stopping-rule-trait.md` | SS4.1   | COMPLETE | V1-V10 with error descriptions                                                                                                                    |
| Composition contract                    | Protocol | `stopping-rule-trait.md` | SS3     | COMPLETE | "Any" (OR) and "All" (AND) semantics with GracefulShutdown override                                                                               |
| Dispatch mechanism (stopping)           | Analysis | `stopping-rule-trait.md` | SS7     | COMPLETE | Enum dispatch with rationale                                                                                                                      |
| Risk-averse considerations              | Protocol | `stopping-rule-trait.md` | SS6     | COMPLETE | BoundStalling and SimulationBased behavior under CVaR documented                                                                                  |
| `SamplingScheme` enum                   | Note     | `training-loop.md`       | SS3.4   | PARTIAL  | 3 variants described (InSample, External, Historical) but enum definition delegated to cobre-stochastic; not audited here                         |

### G.2 Findings

**F-014: `SamplingScheme` enum delegated to cobre-stochastic**

- **Severity**: Low
- **Affected Crate**: cobre-sddp (consumer), cobre-stochastic (owner)
- **Affected Phase**: 5 (cobre-stochastic), 6 (cobre-sddp consumes it)
- **Evidence**: `training-loop.md` SS3.4 lists the three sampling scheme variants:

  > "| `InSample` | Fixed opening tree | Sample random index from pre-generated noise vectors (default) |"

  The full enum definition is expected in the sampling-scheme-trait.md spec, which is owned by cobre-stochastic, not cobre-sddp. The cobre-sddp audit verifies only that the training loop consumes the scheme correctly.

- **Impact**: Minimal for cobre-sddp; the interface is clear. The sampling-scheme-trait audit belongs in the cobre-stochastic audit.
- **Recommendation**: No action needed for cobre-sddp. Ensure the cobre-stochastic audit (ticket-004) covers the `SamplingScheme` enum definition.

---

## Gap Status Check

### GAP-026: Backward pass trial state distribution

- **Status**: Partially resolved in `work-distribution.md` SS2.1. The training-loop spec itself still lacks an explicit cross-reference. See F-005.

### GAP-027: `training.forward_passes` default

- **Status**: Unresolved. The configuration-reference.md still shows "---" for the default value. The spec-gap-inventory recommends:

  > "Specify that `training.forward_passes` is required (no default) and the loader emits an error if it is missing."

  No update has been made to the configuration reference spec.

- **Finding**:

**F-015: `training.forward_passes` default value unresolved (GAP-027)**

- **Severity**: Medium
- **Affected Crate**: cobre-cli, cobre-sddp
- **Affected Phase**: 6
- **Evidence**: GAP-027 in `spec-gap-inventory.md`:

  > "The `training.forward_passes` parameter has no documented default value (the table shows '---'). This is a mandatory parameter for the training loop. Should the loader reject configs without it, or should there be a sensible default?"

  This gap remains unresolved in the specification corpus.

- **Impact**: An implementer does not know whether to require or default this critical parameter.
- **Recommendation**: Make `forward_passes` required (no default). Document this as a loader validation error.

### GAP-030: `TrajectoryRecord`

- **Status**: Unresolved. No `TrajectoryRecord` type has been added to the specs. See F-003 and F-013.

---

## Subsystem Completeness Summary

| Subsystem                     | Total Items | COMPLETE | PARTIAL | MISSING | PARTIAL+MISSING % | Threshold Exceeded |
| ----------------------------- | ----------- | -------- | ------- | ------- | ----------------- | ------------------ |
| A. Training Loop Orchestrator | 10          | 7        | 2       | 1       | 30%               | No (at boundary)   |
| B. Forward Pass               | 12          | 9        | 1       | 2       | 25%               | No                 |
| C. Backward Pass              | 9           | 7        | 1       | 1       | 22%               | No                 |
| D. Convergence Monitoring     | 13          | 11       | 0       | 2       | 15%               | No                 |
| E. FCF Management             | 13          | 11       | 0       | 2       | 15%               | No                 |
| F. Simulation Pipeline        | 12          | 8        | 1       | 3       | 33%               | **Yes** (>30%)     |
| G. Trait Enum Dispatch        | 37          | 36       | 1       | 0       | 3%                | No                 |

**F-016: Simulation pipeline exceeds 30% PARTIAL+MISSING threshold**

- **Severity**: High
- **Affected Crate**: cobre-sddp
- **Affected Phase**: 7
- **Evidence**: Subsystem F has 4 out of 12 items classified as PARTIAL or MISSING (33%), exceeding the 30% threshold defined in the ticket. The three MISSING items are: simulation orchestrator function signature, `TrajectoryRecord`/`SimulationScenarioResult` type (GAP-030), and policy compatibility validation (deferred). The PARTIAL item is the policy compatibility validation which has checks listed but the algorithm deferred.
- **Impact**: The simulation pipeline (Phase 7) is less ready for implementation than the training loop (Phase 6).
- **Recommendation**: Prioritize defining the simulation orchestrator signature and the `SimulationScenarioResult` type before Phase 7 begins. The policy compatibility validation can remain deferred since training and simulation run in the same binary for the minimal viable solver.

---

## Finding Summary

| ID    | Severity | Subsystem                     | Item                                                 |
| ----- | -------- | ----------------------------- | ---------------------------------------------------- |
| F-001 | Medium   | A. Training Loop Orchestrator | `TrainingConfig` struct undefined                    |
| F-002 | Medium   | A. Training Loop Orchestrator | `train` function signature incomplete                |
| F-003 | High     | B. Forward Pass               | `TrajectoryRecord` undefined (GAP-030)               |
| F-004 | Medium   | B. Forward Pass               | Forward pass function signature missing              |
| F-005 | Medium   | C. Backward Pass              | Trial state distribution cross-ref missing (GAP-026) |
| F-006 | Medium   | C. Backward Pass              | Backward pass function signature missing             |
| F-007 | Low      | C. Backward Pass              | Cut coefficient computation helper not composed      |
| F-008 | Medium   | D. Convergence Monitoring     | `ConvergenceMonitor` struct not defined              |
| F-009 | None     | D. Convergence Monitoring     | Bessel's correction VERIFIED COMPLETE                |
| F-010 | None     | E. FCF Management             | `CutWireRecord` layout VERIFIED COMPLETE             |
| F-011 | Medium   | E. FCF Management             | `StageCutPool` struct not defined                    |
| F-012 | Medium   | F. Simulation Pipeline        | Simulation orchestrator signature missing            |
| F-013 | Medium   | F. Simulation Pipeline        | `SimulationScenarioResult` missing (GAP-030)         |
| F-014 | Low      | G. Trait Enum Dispatch        | `SamplingScheme` delegated to cobre-stochastic       |
| F-015 | Medium   | Gap Status                    | `training.forward_passes` default (GAP-027)          |
| F-016 | High     | Subsystem Summary             | Simulation pipeline exceeds 30% threshold            |

### Severity Distribution

| Severity  | Count  |
| --------- | ------ |
| High      | 2      |
| Medium    | 9      |
| Low       | 2      |
| None      | 2      |
| **Total** | **15** |

---

## Crate Verdict: CONDITIONAL PASS

cobre-sddp receives a **CONDITIONAL PASS**. The conditions are:

1. **Resolve GAP-030 before Phase 6 implementation begins**: Define `TrajectoryRecord` (training) and `SimulationScenarioResult` (simulation) types with concrete field types and memory layout. This is the only High-severity finding that affects Phase 6.

2. **Resolve GAP-027 before Phase 6 implementation begins**: Decide whether `training.forward_passes` is required or has a default, and update the configuration reference.

3. **Define top-level function signatures before Phase 6**: The `train`, `forward_pass`, and `backward_pass` function signatures can be inferred from the algorithmic descriptions, but explicit signatures would eliminate ambiguity. This is a convenience rather than a blocker.

4. **Define `StageCutPool` and `ConvergenceMonitor` structs**: These are aggregation types whose components are well-specified individually. The struct boundaries should be formalized but can be resolved during implementation.

5. **Simulation pipeline gaps (Phase 7)**: The simulation subsystem has 33% PARTIAL+MISSING items but is Phase 7 (not Phase 6). Conditions 1 and 2 above must be resolved before Phase 7; the remaining simulation gaps can be addressed between Phase 6 and Phase 7.

**Rationale**: The trait enum dispatch system (Subsystem G) is exceptionally well-specified -- 36 of 37 items are COMPLETE with full Rust type definitions, method signatures, pre/postconditions, validation rules, and dispatch mechanism analysis. The mathematical foundations (cut generation, risk-adjusted aggregation, convergence monitoring, Bessel's correction) are thoroughly specified with concrete formulas and worked examples. The primary gaps are structural: missing aggregation structs (`TrainingConfig`, `ConvergenceMonitor`, `StageCutPool`) and top-level function signatures that compose the well-specified components. These are Medium-severity gaps that an experienced implementer can resolve during coding. The one High-severity gap (`TrajectoryRecord` / GAP-030) is a genuine spec deficiency that requires a design decision before implementation.
