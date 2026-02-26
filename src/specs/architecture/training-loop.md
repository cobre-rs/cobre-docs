# Training Loop

## Purpose

This spec defines the Cobre SDDP training loop architecture: the core training components, their configurable abstraction points, forward pass execution with sampling scheme parameterization and parallel distribution, backward pass execution with opening tree evaluation and cut generation, state management, and dual extraction for cut coefficients.

## 1. SDDP Algorithm Overview

The training phase implements the Stochastic Dual Dynamic Programming (SDDP) algorithm, iteratively constructing piecewise-linear approximations of the expected future cost function (FCF) through forward simulation and backward cut generation.

Each iteration consists of three phases:

1. **Forward pass** — Sample $M$ scenarios via the configured **sampling scheme**, solve the LP at each stage with the current FCF, record visited states and stage-1 costs for the lower bound
2. **Backward pass** — For each stage $T$ down to 2, evaluate the cost-to-go from each visited state under **all** openings from the fixed opening tree, extract LP duals, and compute new cuts via the risk measure
3. **Convergence check** — Update the upper bound estimate (mean forward cost), compute the gap $(UB - LB) / |UB|$, and test stopping rules (gap tolerance, stable LB, iteration/time limits)

The loop terminates when converged or a limit is reached, outputting the FCF cuts and bound history.

## 2. Training Orchestrator Components

The training orchestrator manages the iterative SDDP loop and coordinates the following components:

| Component               | Responsibility                                                                                            | Configuration Source                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Risk Measure**        | Determines how backward outcomes are aggregated into cut coefficients (expectation vs CVaR)               | `risk_measure` per stage in `stages.json`          |
| **Cut Formulation**     | Determines cut structure (single-cut; multi-cut is deferred)                                              | Fixed: single-cut                                  |
| **Horizon Mode**        | Determines stage transitions, terminal conditions, and discount factors                                   | `policy_graph` in `stages.json`                    |
| **Sampling Scheme**     | Determines how the forward pass selects scenario realizations at each stage                               | `scenario_source.sampling_scheme` in `stages.json` |
| **FCF**                 | Stores accumulated Benders cuts per stage; queried during LP construction and updated after backward pass | Built incrementally across iterations              |
| **Convergence Monitor** | Tracks lower/upper bounds, gap history, and evaluates stopping rules                                      | `stopping_rules` in `config.json`                  |

### 2.1 Iteration Lifecycle

Each iteration follows a fixed sequence:

1. **Forward pass** — Execute $M$ scenario trajectories (§4)
2. **Forward synchronization** — `allreduce` ([Communicator Trait SS2.2](../hpc/communicator-trait.md)) aggregates global statistics (lower bound, upper bound) across ranks
3. **Backward pass** — Generate cuts from visited states (§6)
4. **Cut synchronization** — `allgatherv` ([Communicator Trait SS2.1](../hpc/communicator-trait.md)) distributes new cuts to all ranks
5. **Convergence update** — Update bound estimates, evaluate stopping rules (see [Convergence Monitoring](./convergence-monitoring.md))
6. **Checkpoint** — If the checkpoint interval has elapsed, persist current FCF and iteration state (see [Checkpointing](../hpc/checkpointing.md))
7. **Logging** — Emit iteration summary (bounds, gap, timings)

### 2.1a Event Emission Points

Each step in the iteration lifecycle (§2.1) emits a typed event to the shared event channel when an event sender is registered. These events feed all runtime consumers: text logger, JSON-lines writer, TUI renderer, MCP progress notifications, and Parquet convergence writer. Event types are defined in `cobre-core`.

| Step | Lifecycle Phase         | Event Type             | Payload Summary                                                                                                               |
| ---- | ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1    | Forward pass            | `ForwardPassComplete`  | iteration, scenarios, lb_candidate, ub_mean, ub_std, elapsed_ms                                                               |
| 2    | Forward synchronization | `ForwardSyncComplete`  | iteration, global_lb, global_ub_mean, global_ub_std, sync_time_ms                                                             |
| 3    | Backward pass           | `BackwardPassComplete` | iteration, cuts_generated, stages_processed, elapsed_ms                                                                       |
| 4    | Cut synchronization     | `CutSyncComplete`      | iteration, cuts_distributed, cuts_active, cuts_removed, sync_time_ms                                                          |
| 5    | Convergence update      | `ConvergenceUpdate`    | iteration, lower_bound, upper_bound, upper_bound_std, gap, rules_evaluated[]                                                  |
| 6    | Checkpoint              | `CheckpointComplete`   | iteration, checkpoint_path, elapsed_ms (only when checkpoint interval triggers)                                               |
| 7    | Logging                 | `IterationSummary`     | iteration, lower_bound, upper_bound, gap, wall_time_ms, iteration_time_ms, forward_ms, backward_ms, lp_solves, memory_peak_mb |

**Lifecycle events** (emitted once per training/simulation run, not per iteration):

| Event Type           | Trigger                     | Payload Summary                                                         |
| -------------------- | --------------------------- | ----------------------------------------------------------------------- |
| `TrainingStarted`    | Training loop entry         | case_name, stages, hydros, thermals, ranks, threads_per_rank, timestamp |
| `TrainingFinished`   | Training loop exit          | reason, iterations, final_lb, final_ub, total_time_ms, total_cuts       |
| `SimulationProgress` | Simulation batch completion | scenarios_complete, scenarios_total, elapsed_ms                         |
| `SimulationFinished` | Simulation completion       | scenarios, output_dir, elapsed_ms                                       |

The event channel uses an `Option<broadcast::Sender<TrainingEvent>>` pattern: when `None`, no events are emitted (zero overhead for library-mode callers). When `Some(sender)`, events are emitted at each step boundary. Consumers are additive -- multiple can subscribe simultaneously. See [Convergence Monitoring SS4.1](./convergence-monitoring.md) for the JSON-lines schema, [Terminal UI](../interfaces/terminal-ui.md) for TUI consumption, and [MCP Server](../interfaces/mcp-server.md) for MCP progress notifications.

### 2.2 Termination Conditions

The loop terminates based on the configured `stopping_mode` (`"any"` or `"all"`) applied to the following conditions:

| Condition         | Description                                                         | Configuration              |
| ----------------- | ------------------------------------------------------------------- | -------------------------- |
| Bound stalling    | LB relative improvement over window below tolerance                 | `bound_stalling` rule      |
| Simulation-based  | Bound stable AND simulated policy costs stable                      | `simulation` rule          |
| Iteration limit   | Maximum iteration count reached                                     | `iteration_limit` rule     |
| Time limit        | Wall-clock time exceeded                                            | `time_limit` rule          |
| Graceful shutdown | External signal received (checkpoints last **completed** iteration) | OS signal (SIGTERM/SIGINT) |

For the full stopping rule specification, see [Stopping Rules](../math/stopping-rules.md).

## 3. Abstraction Points

The training loop is parameterized by four abstraction points. Each is a behavioral contract — the training loop interacts with each through a defined interface, independent of the specific variant.

### 3.1 Risk Measure

Given a set of backward outcomes (one per opening) with probabilities, the risk measure aggregates them into a single cut. The two variants are:

- **Expectation** (risk-neutral) — Probability-weighted average of outcomes. The cut intercept and gradient are the weighted means of the per-outcome intercepts and gradients.
- **CVaR** (risk-averse) — Convex combination of expectation and conditional value-at-risk: $(1 - \lambda) \cdot \mathbb{E}[\cdot] + \lambda \cdot \text{CVaR}_\alpha[\cdot]$. Cut coefficients are computed via sorting-based greedy weight allocation. See [Risk Measures](../math/risk-measures.md).

The risk measure can vary by stage (configured per stage in `stages.json`).

### 3.2 Cut Formulation

Determines the structure of cuts added to the FCF:

- **Single-cut** (current) — One aggregated cut per iteration per stage. The future cost variable $\theta$ receives a single constraint per backward pass evaluation.
- **Multi-cut** (deferred) — One cut per opening per iteration. See [Deferred Features SSC.3](../deferred.md).

### 3.3 Horizon Mode

Determines stage traversal and terminal conditions:

- **Finite horizon** — Linear chain $1 \to 2 \to \cdots \to T$. Terminal value $V_{T+1} = 0$.
- **Cyclic** — Stage $T$ transitions back to a cycle start stage. Requires discount factor $d < 1$ for convergence. Cuts at equivalent cycle positions are shared.

See [SDDP Algorithm SS4](../math/sddp-algorithm.md) and [Infinite Horizon](../math/infinite-horizon.md).

### 3.4 Sampling Scheme

Determines how the forward pass selects scenario realizations. This is one of three orthogonal SDDP concerns formalized in [Scenario Generation SS3](./scenario-generation.md):

| Scheme       | Forward Noise Source                       | Description                                                    |
| ------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `InSample`   | Fixed opening tree                         | Sample random index from pre-generated noise vectors (default) |
| `External`   | User-provided `external_scenarios.parquet` | Draw from external data (random or sequential selection)       |
| `Historical` | `inflow_history.parquet` mapped to stages  | Replay historical inflow sequences in order                    |

The backward pass noise source is **always** the fixed opening tree, regardless of the forward sampling scheme. This separation means the forward and backward passes may use different noise distributions — see [Scenario Generation SS3.1](./scenario-generation.md).

## 4. Forward Pass

### 4.1 Overview

The forward pass simulates $M$ independent scenario trajectories through the full stage horizon, solving the stage LP at each step with the current FCF approximation. The purpose is twofold:

1. **Generate trial points** — The visited states $\{\hat{x}_t\}$ at each stage become the evaluation points for the backward pass
2. **Estimate upper bound** — The mean total forward cost across all trajectories provides a statistical upper bound estimate

### 4.2 Scenario Trajectory

For each forward trajectory:

1. **Initialize** — Start from the known initial state $x_0$: initial storage volumes from [Input Constraints SS1](../data-model/input-constraints.md) and inflow lag values from historical data or pre-study stages
2. **Stage loop** ($t = 1, \ldots, T$):
   a. **Select scenario realization** — The sampling scheme selects the noise vector for this stage:
   - _InSample_: Sample random index $j$ from the opening tree, retrieve noise vector $\eta_{t,j}$
   - _External_: Select scenario from external data (by random sampling or sequential iteration). The external inflow values are **inverted to noise terms** via the PAR model (see [Scenario Generation SS3.2](./scenario-generation.md))
   - _Historical_: Look up historical inflow for this stage. The historical values are similarly inverted to noise terms
     b. **Compute inflows and fix noise** — The PAR model evaluates with the selected noise to produce inflow values. The noise terms $\varepsilon_{h,t}$ (whether sampled, inverted from external data, or inverted from historical data) are fixed into the LP via fixing constraints on the AR dynamics equation — the LP always receives noise, never raw inflow values directly (see [Scenario Generation SS3.2](./scenario-generation.md))
     c. **Build stage LP** — Construct the stage LP with incoming state $\hat{x}_{t-1}$, scenario realization, and all current FCF cuts as constraints on $\theta$
     d. **Solve** — Solve the LP. Feasibility is guaranteed by the recourse slack system (see [Penalty System](../data-model/penalty-system.md))
     e. **Record** — Store the stage cost and the end-of-stage state $\hat{x}_t$ (storage volumes and updated AR lags)
     f. **Transition** — Pass $\hat{x}_t$ as the incoming state to stage $t+1$
3. **Aggregate** — Compute total trajectory cost $\sum_{t=1}^{T} c_t$

### 4.2a Forward Pass Patch Sequence

Step c above ("Build stage LP") decomposes into the LP rebuild sequence ([Solver Abstraction SS11.2](./solver-abstraction.md)): load template, add active cuts, patch scenario-dependent RHS values, and warm-start. This subsection specifies the **exact `patch_rhs_bounds` calls** for the forward pass — the patches that transform a generic stage template into the LP for a specific (incoming state, scenario realization) pair.

Three categories of patches are applied, all targeting constraint RHS values:

**Category 1 — Incoming state (water balance RHS)**

For each operating hydro $h \in [0, N)$, fix the incoming storage in the water balance constraint:

```
patch(row = h, value = state[h])
```

This sets $\hat{v}_{h}$ (the incoming storage from the previous stage) as the RHS contribution to water balance row $h$ ([Solver Abstraction SS2.2](./solver-abstraction.md)). The water balance row's RHS encodes the incoming storage term so that the LP solves for the outgoing storage $v_h$.

**Category 2 — Incoming state (AR lag fixing RHS)**

For each operating hydro $h \in [0, N)$ and each lag $\ell \in [0, L)$, fix the inflow lag value:

```
patch(row = N + ℓ·N + h, value = state[N + ℓ·N + h])
```

This sets $\hat{a}_{h,\ell}$ (the inflow lag from the incoming state) as the RHS of the lag fixing constraint at row $N + \ell \cdot N + h$ ([Solver Abstraction SS2.2](./solver-abstraction.md)). The row index formula mirrors the column index formula for the lag state variable — this symmetry is by design (see [Solver Abstraction SS2.2](./solver-abstraction.md)).

**Category 3 — Noise innovation (AR dynamics RHS)**

For each operating hydro $h \in [0, N)$, fix the stochastic innovation term $\varepsilon_{h,t}$ in the AR dynamics equation:

```
patch(row = ar_dynamics_row(h), value = εₕ)
```

where `ar_dynamics_row(h)` is the row index of hydro $h$'s inflow AR dynamics constraint in the middle region of the row layout ([Solver Abstraction SS2.2](./solver-abstraction.md)). The noise value $\varepsilon_{h,t}$ comes from the sampling scheme's realization (step a) — whether sampled from the opening tree, inverted from external data, or inverted from historical data.

**Patch count formula:**

$$n_{patches} = \underbrace{N}_{\text{water balance}} + \underbrace{N \cdot L}_{\text{lag fixing}} + \underbrace{N}_{\text{noise fixing}} = N \cdot (2 + L)$$

At production scale ($N = 160$, $L = 12$): $n_{patches} = 160 \times (2 + 12) = 2{,}240$.

**Worked example (3-hydro AR(2) system):**

Using the system from [Solver Abstraction SS2.4](./solver-abstraction.md) ($N = 3$, $L = 2$):

| Patch # | Category      | Row Formula             |  Row | Value                          |
| ------: | ------------- | ----------------------- | ---: | ------------------------------ |
|       0 | Water balance | $h = 0$                 |    0 | $\hat{v}_0$ (storage H0)       |
|       1 | Water balance | $h = 1$                 |    1 | $\hat{v}_1$ (storage H1)       |
|       2 | Water balance | $h = 2$                 |    2 | $\hat{v}_2$ (storage H2)       |
|       3 | AR lag fixing | $N + 0 \cdot N + 0 = 3$ |    3 | $\hat{a}_{0,0}$ (H0 lag 0)     |
|       4 | AR lag fixing | $N + 0 \cdot N + 1 = 4$ |    4 | $\hat{a}_{1,0}$ (H1 lag 0)     |
|       5 | AR lag fixing | $N + 0 \cdot N + 2 = 5$ |    5 | $\hat{a}_{2,0}$ (H2 lag 0)     |
|       6 | AR lag fixing | $N + 1 \cdot N + 0 = 6$ |    6 | $\hat{a}_{0,1}$ (H0 lag 1)     |
|       7 | AR lag fixing | $N + 1 \cdot N + 1 = 7$ |    7 | $\hat{a}_{1,1}$ (H1 lag 1)     |
|       8 | AR lag fixing | $N + 1 \cdot N + 2 = 8$ |    8 | $\hat{a}_{2,1}$ (H2 lag 1)     |
|       9 | Noise fixing  | `ar_dynamics_row(0)`    | (\*) | $\varepsilon_{0,t}$ (H0 noise) |
|      10 | Noise fixing  | `ar_dynamics_row(1)`    | (\*) | $\varepsilon_{1,t}$ (H1 noise) |
|      11 | Noise fixing  | `ar_dynamics_row(2)`    | (\*) | $\varepsilon_{2,t}$ (H2 noise) |

(\*) AR dynamics rows are in the middle region ([Solver Abstraction SS2.2](./solver-abstraction.md)), starting at offset $n_{cut\_relevant} + N_{bus} \times N_{blk}$ (after load balance rows). The exact row indices depend on the system's bus and block counts.

Total: $n_{patches} = 3 \times (2 + 2) = 12$ patches, matching the formula.

**Backward pass similarity:** The backward pass applies the same three patch categories with different values: the incoming state is the trial point $\hat{x}_{t-1}$ from the forward pass, and the noise innovations are drawn from the fixed opening tree rather than the sampling scheme. The patch count formula and row indices are identical.

### 4.3 Parallel Distribution

Scenarios are distributed across MPI ranks in contiguous blocks. Within each rank, scenarios are parallelized across OpenMP threads with **thread-trajectory affinity**: each thread owns one or more complete trajectories and solves all stages sequentially for its assigned trajectories. This preserves cache locality — the solver basis, scenario data, and LP coefficients remain warm in the thread's cache lines across stages.

The training loop is generic over `C: Communicator` (see [Communicator Trait SS3](../hpc/communicator-trait.md) for the function signature pattern), enabling compile-time specialization to any communication backend.

When $M > N_{\text{threads}}$, threads process multiple trajectories in batches. Between batches, the thread saves and restores forward pass state (solver basis, visited states, scenario realization) at stage boundaries. This is analogous to context switching, but only occurs at well-defined stage boundaries.

After all ranks complete their trajectories, `allreduce` aggregates:

- **Lower bound** — First-stage LP objective value (the deterministic lower bound, monotonically increasing across iterations)
- **Upper bound statistics** — Mean and variance of total forward costs across all trajectories

### 4.3a Single-Rank Forward Pass Variant

When `comm.size() == 1` (single-process mode, used by `cobre-python` and `cobre-mcp`, or single-rank MPI execution), all scenarios are assigned to the single rank. The `allreduce` for bound aggregation becomes a local computation -- the rank's local statistics are the global statistics. For the `LocalBackend`, this is an identity copy operation (see [Local Backend SS2.2](../hpc/backend-local.md)). No inter-rank communication occurs. OpenMP thread-level parallelism remains active: scenarios are distributed across threads within the single rank using the same thread-trajectory affinity pattern (§4.3). See [Hybrid Parallelism §1](../hpc/hybrid-parallelism.md) for the single-process mode initialization sequence.

### 4.4 Warm-Starting

The forward pass LP solution at stage $t$ provides a near-optimal basis for the backward pass solves at the same stage. The solver retains this basis after the forward solve so that the backward pass at stage $t$ can warm-start from it, significantly reducing solve times. See [Solver Workspaces](./solver-workspaces.md).

## 5. State Management

### 5.1 State Vector

The state vector carries all information needed to transition between stages and generate valid cuts. It consists of:

| Component       | Dimension          | Source at Stage $t$                                 |
| --------------- | ------------------ | --------------------------------------------------- |
| Storage volumes | $N_{\text{hydro}}$ | End-of-stage storage from LP solution ($v_{h,T_k}$) |
| AR inflow lags  | $\sum_h P_h$       | Updated lag buffer after inflow computation         |

Future extensions (batteries, GNL pipeline) may add additional state dimensions — see [SDDP Algorithm SS5](../math/sddp-algorithm.md).

#### 5.1.1 Concrete Type Definition

The state vector is a flat `[f64]` array whose layout matches the LP column prefix defined in [Solver Abstraction SS2.1](./solver-abstraction.md):

```rust
/// Flat state vector matching the LP column prefix layout.
/// Position i corresponds to cut coefficient i.
/// Layout: [v_0, v_1, ..., v_{N-1}, a_{0,0}, a_{1,0}, ..., a_{N-1,0}, a_{0,1}, ..., a_{N-1,L-1}]
/// where v_h = storage for hydro h, a_{h,l} = inflow lag l for hydro h.
/// Total dimension: N * (1 + L)
///
/// Aligned to 64 bytes for AVX-512 SIMD dot product operations.
type StateVector = Vec<f64>;  // len = n_state, allocated with 64-byte alignment
```

The state dimension is $n_{state} = N \cdot (1 + L)$, where $N$ is the number of operating hydros and $L$ is the maximum PAR order across all operating hydros — both defined in [Solver Abstraction SS2.1](./solver-abstraction.md).

**Memory alignment**: State vectors are allocated with 64-byte alignment (the AVX-512 register width, accommodating 8 `f64` values per SIMD lane). This alignment constraint also applies to cut coefficient arrays in the cut pool ([Solver Abstraction SS2.5](./solver-abstraction.md)), ensuring that the primary operation on state vectors — the dot product — can use aligned SIMD loads.

#### 5.1.2 Dot Product as Primary Operation

The primary numerical operation on state vectors is the dot product between a state vector $\mathbf{x}$ and a cut coefficient vector $\boldsymbol{\pi}$:

$$\theta_k = \alpha_k + \boldsymbol{\pi}_k^\top \mathbf{x}$$

This operation occurs in two critical contexts:

1. **Forward pass** — Evaluating the current FCF at a visited state to determine the value of $\theta$. For each active cut $k$, compute $\alpha_k + \boldsymbol{\pi}_k^\top \mathbf{x}$ and take the maximum. This determines the lower bound contribution from the future cost approximation.
2. **Backward pass** — Computing the cut intercept after solving a backward LP:

$$\alpha = Q_t(\hat{x}_{t-1}, \omega) - \boldsymbol{\pi}^\top \hat{x}_{t-1}$$

Both contexts involve a dense dot product of length $n_{state}$ between two 64-byte-aligned `f64` arrays. Implementations should use BLAS-like vectorized routines when available (e.g., SIMD-accelerated `ddot`). At production scale ($n_{state} = 2{,}080$), this is a 16.6 KB operation that fits entirely in L1 data cache — see [Solver Abstraction SS2.5](./solver-abstraction.md) for cache locality analysis.

### 5.2 State Extraction from LP Solution

After solving the stage LP, the state vector is extracted from the LP primal solution. Because the state variables occupy the contiguous prefix of the column layout ([Solver Abstraction SS2.1](./solver-abstraction.md)), extraction is a single contiguous memory copy:

```rust
// Extract state from LP solution — single contiguous memcpy
let state: &[f64] = &solution.primal[0..n_state];
```

This copies:

- `state[0..N]` — Storage volumes $v_0, v_1, \ldots, v_{N-1}$ from the LP primal vector
- `state[N..N*(1+L)]` — Inflow lag values $a_{0,0}, a_{1,0}, \ldots, a_{N-1,L-1}$ from the LP primal vector

No index gathering or scattering is required — the LP column layout is designed so that state extraction is a single contiguous slice read.

### 5.3 State Transfer Between Stages

Transferring state from stage $t$ to stage $t+1$ requires patching the next stage's LP with the outgoing state values. This uses the `patch_rhs_bounds` interface ([Solver Interface Trait SS2.3](./solver-interface-trait.md)) with two categories of patches:

**Storage transfer**: For each operating hydro $h \in [0, N)$, patch the water balance constraint RHS:

```
patch(row = h, value = state[h])
```

**Inflow lag transfer**: For each hydro $h \in [0, N)$ and lag $\ell \in [0, L)$, patch the lag fixing constraint RHS:

```
patch(row = N + ℓ·N + h, value = state[N + ℓ·N + h])
```

Both use the row index formulas from [Solver Abstraction SS2.2](./solver-abstraction.md). The patch row index for lag values matches the column index of the corresponding state variable — this symmetry is by design and simplifies the transfer logic to iterating over state indices.

The state transfer patches are a subset of the full forward pass patch sequence (§4.2a, categories 1 and 2). The noise innovation patches (category 3) are separate because they depend on the scenario realization, not the incoming state.

### 5.4 State Lifecycle

1. **Initialization** — The initial state $x_0$ is constructed from:
   - Storage: initial reservoir volumes from `initial_conditions.json` (see [Input Constraints SS1](../data-model/input-constraints.md))
   - AR lags: historical inflow values from `inflow_history.parquet` or pre-study stages in `stages.json`, ordered newest-first (lag 1 = most recent)

2. **Update** — At each stage, the state is updated in two steps:
   - **Inflow computation**: The PAR model (or external/historical lookup) produces the stage inflow $a_{h,t}$. The lag buffer is shifted: the oldest lag drops off, all remaining lags shift by one position, and $a_{h,t}$ becomes the new lag-1 value
   - **Storage extraction**: End-of-stage storage volumes are read from the LP solution's state variable values (§5.2)

3. **Extraction for backward pass** — After the forward pass, the visited states at each stage are collected across all ranks via `allgatherv`. State deduplication (merging duplicate visited states to reduce backward pass LP solves) is a potential optimization deferred to [Deferred Features](../deferred.md).

### 5.5 StageIndexer

The `StageIndexer` provides a read-only index map for accessing LP primal and dual positions by semantic name. It eliminates magic index numbers from the training loop and centralizes all LP layout arithmetic in one place.

```rust
/// Read-only index map for accessing LP primal/dual positions by semantic name.
/// Built once at initialization from the stage definition.
/// Shared across all threads within an MPI rank (`Send + Sync`).
/// Equal on all ranks (since LPs differ only by noise innovations, not structure).
pub struct StageIndexer {
    /// Column range for storage volumes: [0, N).
    pub storage: Range<usize>,
    /// Column range for inflow lag variables: [N, N*(1+L)).
    pub inflow_lags: Range<usize>,
    /// Column index of the future cost variable θ: N*(1+L).
    pub theta: usize,
    /// Total state dimension: N*(1+L). Equal to storage.len() + inflow_lags.len().
    pub n_state: usize,
    /// Row range for water balance constraints: [0, N).
    pub water_balance: Range<usize>,
    /// Row range for AR lag fixing constraints: [N, N+N*L).
    pub lag_fixing: Range<usize>,
    /// Row range for FPHA hyperplane constraints: [N+N*L, N+N*L+n_fpha).
    pub fpha_hyperplanes: Range<usize>,
    /// Row range for generic volume constraints: [N+N*L+n_fpha, n_cut_relevant).
    pub generic_volume: Range<usize>,
    /// Total count of cut-relevant constraint rows: N + N*L + n_fpha + n_gvc.
    pub n_cut_relevant: usize,
    /// Number of operating hydros at this stage.
    pub hydro_count: usize,
    /// Maximum PAR order across all operating hydros at this stage.
    pub max_par_order: usize,
}
```

#### 5.5.1 Indexer Properties

- **Built at initialization**: The indexer is constructed once per stage from the `System` struct ([Internal Structures SS1](../data-model/internal-structures.md)) and the stage configuration. The construction cost is negligible — pure arithmetic on system dimensions.
- **Immutable after construction** (`Send + Sync`): The indexer contains only `usize` values and `Range<usize>` values. It is never mutated after construction, making it safe to share across all threads within an MPI rank without synchronization.
- **Equal across all ranks**: All MPI ranks construct the same LP structure for each stage — the LP layout depends only on the system definition and stage configuration, not on the rank's assigned scenarios. Only noise innovation values differ across ranks and scenarios. Therefore, all ranks produce identical indexers.
- **Owned by the stage definition**: The indexer is associated with the stage template ([Solver Interface Trait SS4.4](./solver-interface-trait.md)), not with any solver instance. It outlives individual solver invocations and is shared read-only.

#### 5.5.2 Indexer Usage Examples

```rust
// Extract full state vector from LP solution (single contiguous slice)
let state = &solution.primal[indexer.storage.start..indexer.inflow_lags.end];
assert_eq!(state.len(), indexer.n_state);

// Extract cut-relevant duals for cut coefficient computation
let cut_duals = &solution.dual[0..indexer.n_cut_relevant];

// Access a specific hydro's storage value (hydro 3)
let h3_storage = solution.primal[indexer.storage.start + 3];

// Access a specific lag value (hydro 2, lag 1)
// Formula: inflow_lags.start + lag * hydro_count + hydro
let h2_lag1 = solution.primal[indexer.inflow_lags.start + 1 * indexer.hydro_count + 2];

// Patch water balance RHS for incoming storage (hydro h)
let wb_row = indexer.water_balance.start + h;

// Patch lag fixing RHS for (hydro h, lag ℓ)
let lag_row = indexer.lag_fixing.start + l * indexer.hydro_count + h;

// Access θ variable value
let theta_value = solution.primal[indexer.theta];
```

**Lag indexing verification**: The formula `inflow_lags.start + l * hydro_count + h` produces the correct index given the LP column layout `[..., a_{0,0}, a_{1,0}, ..., a_{N-1,0}, a_{0,1}, ..., a_{N-1,L-1}]`. For hydro $h$ at lag $\ell$: the column index is $N + \ell \cdot N + h$, and since `inflow_lags.start = N` and `hydro_count = N`, the formula gives $N + \ell \cdot N + h$ — matching [Solver Abstraction SS2.1](./solver-abstraction.md).

#### 5.5.3 Worked Example (3-Hydro AR(2) System)

Using the system from [Solver Abstraction SS2.4](./solver-abstraction.md) ($N = 3$, $L = 2$, $n_{fpha} = 4$, $n_{gvc} = 0$):

```rust
let indexer = StageIndexer {
    storage: 0..3,          // columns 0, 1, 2
    inflow_lags: 3..9,      // columns 3, 4, 5, 6, 7, 8
    theta: 9,               // column 9
    n_state: 9,             // 3 * (1 + 2)
    water_balance: 0..3,    // rows 0, 1, 2
    lag_fixing: 3..9,       // rows 3, 4, 5, 6, 7, 8
    fpha_hyperplanes: 9..13, // rows 9, 10, 11, 12
    generic_volume: 13..13, // empty range (n_gvc = 0)
    n_cut_relevant: 13,     // 3 + 6 + 4 + 0
    hydro_count: 3,
    max_par_order: 2,
};

// Extract state: primal[0..9] — a single contiguous slice of 9 f64 values
let state = &solution.primal[indexer.storage.start..indexer.inflow_lags.end];
// state = [v_0, v_1, v_2, a_{0,0}, a_{1,0}, a_{2,0}, a_{0,1}, a_{1,1}, a_{2,1}]

// H1 storage (hydro 1): primal[0 + 1] = primal[1]
let h1_storage = solution.primal[indexer.storage.start + 1];

// H2 lag 1 (hydro 2, lag 1): primal[3 + 1*3 + 2] = primal[8]
let h2_lag1 = solution.primal[indexer.inflow_lags.start + 1 * indexer.hydro_count + 2];

// Cut-relevant duals: dual[0..13] — includes water balance, lag fixing, FPHA
let cut_duals = &solution.dual[0..indexer.n_cut_relevant];
// The first 9 duals map directly to cut coefficients for state variables 0..8
// Duals 9..12 are FPHA plane duals contributing to storage coefficients via
// the precomputed mapping (see Cut Management Implementation SS5)
```

## 6. Backward Pass

### 6.1 Overview

The backward pass improves the FCF by generating new Benders cuts. It walks stages in reverse order from $T$ down to 2. The trial points $\{\hat{x}_t\}$ used here are the visited states from **all** forward scenarios across **all** MPI ranks (gathered via `allgatherv` in §5.4). At each stage, the cost-to-go from each trial point is evaluated under **all** openings from the fixed opening tree.

### 6.2 Cut Generation per Stage

At each stage $t$, for each trial point $\hat{x}_{t-1}$ collected during the forward pass:

1. **Retrieve openings** — Get all $N_{\text{openings}}$ noise vectors for stage $t$ from the fixed opening tree (see [Scenario Generation SS2.3](./scenario-generation.md)). This is the **Complete** backward sampling scheme — all openings are always evaluated. A deferred `MonteCarlo(n)` variant would sample a subset; see [Deferred Features SSC.14](../deferred.md).

2. **Evaluate each opening** — For each noise vector $\eta_{t,j}$ ($j = 0, \ldots, N_{\text{openings}} - 1$):
   a. Compute realized inflows via the PAR model with the trial state's lag buffer and the opening's noise vector
   b. Build the backward LP at stage $t$: the incoming state $\hat{x}_{t-1}$ is fixed (storage and lag values set as constraints), and the scenario realization uses the computed inflows
   c. Solve the LP and extract:
   - Objective value $Q_t(\hat{x}_{t-1}, \omega_j)$
   - Dual variables of state-linking constraints (water balance for storage, fixing constraints for AR lags)
   - For hydros using FPHA, the FPHA hyperplane duals also contribute to storage cut coefficients (see [Cut Management SS2](../math/cut-management.md))

3. **Aggregate into cut** — The risk measure aggregates the per-opening outcomes into a single cut:
   - Probabilities are uniform: $p(\omega_j) = 1/N_{\text{openings}}$
   - For Expectation: weighted average of intercepts and gradients
   - For CVaR: sorting-based greedy weight allocation (see [Risk Measures](../math/risk-measures.md))

4. **Add cut** — The new cut is added to stage $t-1$'s cut pool in the FCF

### 6.3 Parallel Distribution

Trial states at each stage are distributed across MPI ranks. Within each rank, each thread evaluates its assigned states sequentially, reusing the warm solver basis saved from the forward pass at that stage (§4.4). The branching scenarios (openings) for each state are evaluated sequentially by the same thread, keeping the solver state hot.

**Stage synchronization barrier**: All threads across all ranks must complete cut generation at stage $t$ before any thread proceeds to stage $t-1$. This is because the new cuts at stage $t$ must be available to all ranks before they solve backward LPs at stage $t-1$ (which include stage $t$'s cuts in their FCF approximation).

After processing each stage, `allgatherv` collects all new cuts from all ranks and distributes them, so every rank has the complete set of new cuts.

### 6.3a Single-Rank Backward Pass Variant

When `comm.size() == 1`, the `allgatherv` for cut synchronization becomes an identity operation -- all cuts generated by the single rank are immediately available locally (for the `LocalBackend`, this is a memcpy; see [Local Backend SS2.2](../hpc/backend-local.md)). The per-stage synchronization barrier reduces to an OpenMP barrier only (ensuring all threads complete cut generation at stage $t$ before proceeding to stage $t-1$). All trial states are local, so no state broadcasting is needed. The backward pass logic is otherwise identical to the multi-rank case.

### 6.4 LP Rebuild Considerations

Memory constraints prevent keeping all stage LPs with their full cut sets resident simultaneously. The solver must rebuild LPs when transitioning between stages, which lies on the critical performance path. Strategies to minimize rebuild cost include:

- **Cut preallocation** — Reserve space for expected cut count to avoid LP resizing
- **Basis persistence** — Reuse the forward pass basis as a warm-start for the backward LP
- **Incremental constraint updates** — Add only new cuts (from the current iteration) rather than rebuilding the full LP

See [Solver Abstraction](./solver-abstraction.md) and [Solver Workspaces](./solver-workspaces.md).

## 7. Dual Extraction for Cut Coefficients

### 7.1 Cut Structure

A Benders cut for stage $t-1$ has the form:

$$
\theta_t \geq \alpha + \sum_{h \in \mathcal{H}} \pi^v_h \cdot v_{h,t-1} + \sum_{h \in \mathcal{H}} \sum_{\ell=1}^{P_h} \pi^a_{h,\ell} \cdot a_{h,t-1-\ell}
$$

where:

| Symbol           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| $\alpha$         | Cut intercept (constant term)                                    |
| $\pi^v_h$        | Cut coefficient for hydro $h$'s storage state variable           |
| $\pi^a_{h,\ell}$ | Cut coefficient for hydro $h$'s inflow lag $\ell$ state variable |
| $v_{h,t-1}$      | End-of-stage storage at stage $t-1$ (state variable)             |
| $a_{h,t-1-\ell}$ | Inflow lag $\ell$ at stage $t-1$ (state variable)                |

### 7.2 Derivation from LP Duality

The cut coefficients are derived from the dual variables of the backward LP's state-linking constraints:

- **Storage**: The water balance constraint links incoming storage $v_{h,t-1}$ to outgoing storage. Its dual $\pi^v_h$ is the cut coefficient, representing the marginal value of an additional unit of storage at the previous stage.
- **AR inflow lags**: The lag fixing constraints bind each lag variable to its incoming value. Their duals $\pi^a_{h,\ell}$ are the cut coefficients, representing the marginal value of inflow history.
- **FPHA duals**: For hydros using FPHA, the hyperplane constraint duals contribute additional terms to $\pi^v_h$ because the FPHA planes depend on storage (head). See [Cut Management SS2](../math/cut-management.md).
- **Generic constraint duals**: When generic constraints involve state variables, their duals also contribute to cut coefficients. The mapping from generic constraint duals to state variable coefficients is static (determined at input loading time) and should be precomputed once. See [Cut Management Implementation](./cut-management-impl.md).

The intercept $\alpha$ is computed from the LP objective value and the state-dependent terms:

$$
\alpha = Q_t(\hat{x}_{t-1}, \omega) - \sum_h \pi^v_h \cdot \hat{v}_{h,t-1} - \sum_h \sum_\ell \pi^a_{h,\ell} \cdot \hat{a}_{h,t-1-\ell}
$$

### 7.3 Cut Metadata

Each cut carries metadata for cut management:

| Field        | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Stage        | Which stage's FCF this cut belongs to                        |
| Iteration    | The iteration when this cut was generated                    |
| Active count | Number of times this cut was binding in subsequent LP solves |

The active count is used by cut selection strategies to prune dominated or inactive cuts. See [Cut Management Implementation](./cut-management-impl.md).

## Cross-References

- [SDDP Algorithm](../math/sddp-algorithm.md) — Mathematical definition of the SDDP algorithm that this training loop implements
- [Cut Management (Math)](../math/cut-management.md) — Mathematical foundations for cut coefficients, selection theory, and dominance criteria
- [Cut Management Implementation](./cut-management-impl.md) — FCF structure, cut selection strategies, serialization, and cross-rank cut synchronization
- [Stopping Rules](../math/stopping-rules.md) — Convergence criteria and termination conditions
- [Risk Measures](../math/risk-measures.md) — CVaR mathematical formulation and cut weight computation
- [Work Distribution](../hpc/work-distribution.md) — Detailed communication+OpenMP parallelism patterns for forward and backward pass distribution
- [Convergence Monitoring](./convergence-monitoring.md) — Convergence criteria, bound computation, and stopping rules applied within this loop
- [Input Loading Pipeline](./input-loading-pipeline.md) — How case data and warm-start policy cuts are loaded before training begins
- [Input Constraints](../data-model/input-constraints.md) — Initial conditions (SS1) that provide the starting state $x_0$
- [Input Scenarios](../data-model/input-scenarios.md) — Scenario source configuration (SS2.1), external scenarios (SS2.5)
- [Scenario Generation](./scenario-generation.md) — Sampling scheme abstraction (SS3), fixed opening tree lifecycle (SS2.3), external scenario integration (SS4)
- [Penalty System](../data-model/penalty-system.md) — Recourse slacks guaranteeing LP feasibility
- [Solver Abstraction](./solver-abstraction.md) — Solver interface and LP construction
- [Solver Workspaces](./solver-workspaces.md) — Solver state management, basis persistence, and warm-starting
- [Synchronization](../hpc/synchronization.md) — Barrier semantics, collective operations via Communicator trait, and stage-boundary synchronization patterns
- [Checkpointing](../hpc/checkpointing.md) — Checkpoint format and graceful shutdown
- [Deferred Features](../deferred.md) — Multi-cut (C.3), alternative forward pass (C.13), Monte Carlo backward sampling (C.14), policy compatibility validation (C.9)
- [Structured Output](../interfaces/structured-output.md) — JSON-lines streaming protocol consuming events from this training loop
- [Terminal UI](../interfaces/terminal-ui.md) — TUI renderer consuming events from this training loop
- [MCP Server](../interfaces/mcp-server.md) — MCP progress notifications consuming events from this training loop
- [Python Bindings](../interfaces/python-bindings.md) — Single-process execution mode for Python library callers
- [Communicator Trait](../hpc/communicator-trait.md) — Communicator trait definition, method contracts, generic parameterization
- [Local Backend](../hpc/backend-local.md) — LocalBackend identity/no-op operations for single-rank execution
