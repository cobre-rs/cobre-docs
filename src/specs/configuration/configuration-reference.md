# Configuration Reference

## Purpose

This spec provides a comprehensive mapping between Cobre configuration options and their effects on LP subproblem construction and solver behavior. Configuration is split across two files: `config.json` (solver-side settings) and `stages.json` (temporal structure, per-stage variants, scenario configuration). This spec documents all options, their valid values, LP effects, and links to the defining math or data model spec.

For the file layout and `config.json` schema overview, see [Input Directory Structure §2](../data-model/input-directory-structure.md). For the `stages.json` schema, see [Input Scenarios](../data-model/input-scenarios.md).

## 1. Configuration File Split

| File          | Scope                                                                                                   | Where Defined                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `config.json` | Solver behavior: modeling options, training parameters, simulation, HPC, I/O                            | [Input Directory Structure §2](../data-model/input-directory-structure.md) |
| `stages.json` | Temporal structure: stages, blocks, block_mode, policy graph, risk measure, scenario source, n_openings | [Input Scenarios](../data-model/input-scenarios.md)                        |

**Design rationale**: Settings that are inherently per-stage (block mode, risk measure, scenario source) live in `stages.json` alongside the stage definitions. Settings that are global solver parameters (training iteration count, cut selection, inflow non-negativity method, upper bound evaluation) live in `config.json`.

### 1.1 CLI Presentation Settings

The output format (`--output-format human|json|json-lines`) is a **CLI flag**, not a configuration parameter. It is intentionally excluded from `config.json` because:

1. **Output format is a presentation concern, not a computation concern.** It does not affect solver behavior, random seeds, convergence criteria, or output files on disk. Mixing presentation settings with algorithm configuration would violate separation of concerns.

2. **The same case may be run with different output formats** depending on the consumer: `human` for interactive HPC sessions, `json` for CI/CD pipelines, `json-lines` for agent monitoring. These are per-invocation choices, not per-case choices.

3. **Reproducibility**: Two runs with the same `config.json` and inputs must produce identical results regardless of output format. If output format were in `config.json`, it would appear in the configuration hash (`data_integrity.config_hash` in [Output Infrastructure §2](../data-model/output-infrastructure.md)), creating spurious hash differences.

Similarly, the `--quiet` and `--no-progress` flags are CLI-only. They suppress output but do not change what is computed or written to disk. See [CLI and Lifecycle §3.1](../architecture/cli-and-lifecycle.md) for the global CLI flags and [Structured Output §5](../interfaces/structured-output.md) for the output format negotiation.

## 2. Modeling Options (`config.json` → `modeling`)

### 2.1 Inflow Non-Negativity Treatment

| Option                                      | Value                       | LP Effect                                     | Reference                                                |
| ------------------------------------------- | --------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| modeling.inflow_non_negativity.method       | `"none"`                    | No slack, may cause infeasibility             | [Inflow Non-Negativity](../math/inflow-nonnegativity.md) |
| modeling.inflow_non_negativity.method       | `"penalty"`                 | Add $\sigma^{inf}_h$ slack with penalty       | [Inflow Non-Negativity](../math/inflow-nonnegativity.md) |
| modeling.inflow_non_negativity.method       | `"truncation"`              | Pre-truncate in scenario generation           | [Inflow Non-Negativity](../math/inflow-nonnegativity.md) |
| modeling.inflow_non_negativity.method       | `"truncation_with_penalty"` | Noise adjustment slack $\xi_h$                | [Inflow Non-Negativity](../math/inflow-nonnegativity.md) |
| modeling.inflow_non_negativity.penalty_cost | float                       | Penalty coefficient $c^{inf}$ (default: 1000) | [Inflow Non-Negativity](../math/inflow-nonnegativity.md) |

| Method                    | Math Formulation                          | LP Variables Added |
| ------------------------- | ----------------------------------------- | ------------------ |
| `none`                    | Direct AR output                          | None               |
| `penalty`                 | $a_h + \sigma^{inf}_h = \text{AR output}$ | `inflow_slack`     |
| `truncation`              | $a_h = \max(0, \text{AR output})$         | None               |
| `truncation_with_penalty` | $\eta_h^{adj} = \eta_h + \xi_h$           | `noise_slack`      |

### 2.2 Penalty Coefficients

Penalty defaults are defined in `penalties.json`, not `config.json`. The penalty system uses a three-tier cascade: global defaults (`penalties.json`) → entity overrides (entity registry files) → stage overrides (`constraints/penalty_overrides_*.parquet`). See [Penalty System](../data-model/penalty-system.md) for the full specification.

The penalty categories are:

| Category              | Purpose           | Examples                                                                                    |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Recourse slacks       | LP feasibility    | `deficit_segments`, `excess_cost`                                                           |
| Constraint violations | Policy shaping    | `storage_violation_below_cost`, `filling_target_violation_cost`, `outflow_violation_*_cost` |
| Regularization        | Solution guidance | `spillage_cost`, `fpha_turbined_cost`, `exchange_cost`, `curtailment_cost`                  |

Priority ordering: Filling target > Storage violation > Deficit > Constraint violations > Resource costs > Regularization.

## 3. Training Options (`config.json` → `training`)

### 3.1 Training Enabled

| Option           | Type | Default | Description                                                                                                                                                       |
| ---------------- | ---- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| training.enabled | bool | `true`  | When `false`, skip the Training phase and proceed directly to Simulation. See [CLI and Lifecycle SS5](../architecture/cli-and-lifecycle.md) for lifecycle phases. |

### 3.2 Forward Pass Count

| Option                  | Type | Default                    | Description                                       |
| ----------------------- | ---- | -------------------------- | ------------------------------------------------- |
| training.forward_passes | int  | **mandatory** (no default) | Number of scenario trajectories $M$ per iteration |

The loader must reject any configuration that omits `training.forward_passes`. This field has no default because the optimal value depends on the problem structure and the available MPI ranks; an absent value would silently produce incorrect cut pool sizing (see [Cut Management Implementation SS1.3](../architecture/cut-management-impl.md)).

### 3.3 Cut Selection

| Option                                          | Value          | LP Effect                               | Reference                                                                                                                                                                                       |
| ----------------------------------------------- | -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| training.cut_selection.enabled                  | bool           | Enable/disable cut pruning              | [Cut Management](../math/cut-management.md)                                                                                                                                                     |
| training.cut_selection.method                   | `"level1"`     | Keep ever-active cuts                   | [Cut Management §7](../math/cut-management.md)                                                                                                                                                  |
| training.cut_selection.method                   | `"lml1"`       | Limited memory level-1                  | [Cut Management §7](../math/cut-management.md)                                                                                                                                                  |
| training.cut_selection.method                   | `"domination"` | Remove dominated cuts                   | [Cut Management §7](../math/cut-management.md)                                                                                                                                                  |
| training.cut_selection.threshold                | int            | Minimum iterations before first pruning | [Cut Management Implementation §2](../architecture/cut-management-impl.md)                                                                                                                      |
| training.cut_selection.check_frequency          | int            | Iterations between pruning checks       | [Cut Management Implementation §2](../architecture/cut-management-impl.md)                                                                                                                      |
| `training.cut_selection.cut_activity_tolerance` | float          | `1e-6`                                  | Minimum dual multiplier value for a cut to be considered binding (active). Used by all selection strategies. See [Cut Management Implementation SS6.1](../architecture/cut-management-impl.md). |

| Method       | Algorithm                                           |
| ------------ | --------------------------------------------------- |
| `level1`     | Keep cuts that were binding at least once           |
| `lml1`       | Keep most recently active cuts per state            |
| `domination` | Remove Pareto-dominated cuts (pointwise comparison) |

### 3.4 Stopping Rules

| Option                  | Type   | Description                               |
| ----------------------- | ------ | ----------------------------------------- |
| training.stopping_rules | array  | List of stopping rule configurations      |
| training.stopping_mode  | string | `"any"` (OR logic) or `"all"` (AND logic) |

Available rule types:

| Rule Type         | Parameters                                                    | Description                                 | Reference                                      |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `iteration_limit` | `limit: int`                                                  | Maximum iteration count (mandatory)         | [Stopping Rules §2](../math/stopping-rules.md) |
| `time_limit`      | `seconds: int`                                                | Wall-clock time limit                       | [Stopping Rules §3](../math/stopping-rules.md) |
| `bound_stalling`  | `iterations: int, tolerance: float`                           | LB relative improvement below tolerance     | [Stopping Rules §4](../math/stopping-rules.md) |
| `simulation`      | `replications, period, bound_window, distance_tol, bound_tol` | Policy stability via Monte Carlo simulation | [Stopping Rules §5](../math/stopping-rules.md) |

```json
{
  "training": {
    "stopping_rules": [
      { "type": "iteration_limit", "limit": 100 },
      { "type": "bound_stalling", "iterations": 10, "tolerance": 0.0001 }
    ],
    "stopping_mode": "any"
  }
}
```

### 3.5 Solver Retry Configuration

| Option                                      | Type  | Default | Description                                                                  |
| ------------------------------------------- | ----- | ------- | ---------------------------------------------------------------------------- |
| `training.solver.retry_max_attempts`        | int   | `5`     | Maximum number of solver retry attempts before propagating a hard error.     |
| `training.solver.retry_time_budget_seconds` | float | `30.0`  | Total time budget (seconds) across all retry attempts for a single LP solve. |

The retry escalation strategy — which solver parameters are varied across attempts — is encapsulated within each solver implementation and is not user-configurable. The external config parameters above control only the stopping conditions for the retry loop. See [Solver Interface Trait SS6](../architecture/solver-interface-trait.md) and [Solver Abstraction SS7](../architecture/solver-abstraction.md) for the encapsulation contract.

## 4. Upper Bound Evaluation (`config.json` → `upper_bound_evaluation`)

| Option                                          | Value    | LP Effect                         | Reference                                                   |
| ----------------------------------------------- | -------- | --------------------------------- | ----------------------------------------------------------- |
| upper_bound_evaluation.enabled                  | bool     | Enable vertex-based inner approx  | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |
| upper_bound_evaluation.initial_iteration        | int      | First iteration to compute UB     | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |
| upper_bound_evaluation.interval_iterations      | int      | Iterations between UB evaluations | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |
| upper_bound_evaluation.lipschitz.mode           | `"auto"` | Auto-compute Lipschitz constants  | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |
| upper_bound_evaluation.lipschitz.fallback_value | float    | Fallback when auto fails          | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |
| upper_bound_evaluation.lipschitz.scale_factor   | float    | Multiplicative safety margin      | [Upper Bound Evaluation](../math/upper-bound-evaluation.md) |

```json
{
  "upper_bound_evaluation": {
    "enabled": true,
    "initial_iteration": 10,
    "interval_iterations": 5,
    "lipschitz": {
      "mode": "auto",
      "fallback_value": 10000.0,
      "scale_factor": 1.1
    }
  }
}
```

## 5. Horizon and Discount (`stages.json` → `policy_graph`)

The horizon mode and discount rate are derived from the `policy_graph` structure in `stages.json`. See [Input Scenarios §1.2](../data-model/input-scenarios.md) for the full schema and [Extension Points §4](../architecture/extension-points.md) for variant selection.

| Option                                          | Value              | LP Effect                              | Reference                                                |
| ----------------------------------------------- | ------------------ | -------------------------------------- | -------------------------------------------------------- |
| policy_graph.type                               | `"finite_horizon"` | Terminal value $V_{T+1} = 0$           | [SDDP Algorithm §4.1](../math/sddp-algorithm.md)         |
| policy_graph.type                               | `"cyclic"`         | Cycle detection, cut sharing by season | [Infinite Horizon](../math/infinite-horizon.md)          |
| policy_graph.annual_discount_rate               | float              | Per-transition $d_{t \to t+1}$ factor  | [Discount Rate](../math/discount-rate.md)                |
| policy_graph.transitions[].annual_discount_rate | float              | Per-transition override                | [Input Scenarios §1.2](../data-model/input-scenarios.md) |

**Discount rate conversion**: The `annual_discount_rate` $r$ is converted to a per-transition discount factor:

$$d_{t \to t+1} = \frac{1}{(1 + r)^{\Delta t}}$$

where $\Delta t$ is the source stage duration in years. A rate of `0.0` means no discounting ($d = 1.0$).

**Finite horizon example:**

```json
{
  "policy_graph": {
    "type": "finite_horizon",
    "annual_discount_rate": 0.06,
    "transitions": [
      { "source_id": 0, "target_id": 1, "probability": 1.0 },
      { "source_id": 1, "target_id": 2, "probability": 1.0 }
    ]
  }
}
```

**Cyclic (infinite periodic) horizon:**

```json
{
  "policy_graph": {
    "type": "cyclic",
    "annual_discount_rate": 0.06,
    "transitions": [
      { "source_id": 0, "target_id": 1, "probability": 1.0 },
      { "source_id": 59, "target_id": 48, "probability": 1.0 }
    ]
  }
}
```

**Validation**: For `cyclic` graphs, the cumulative cycle discount must be $< 1$ (see [Extension Points §4.3](../architecture/extension-points.md)).

## 6. Per-Stage Options (`stages.json` → `stages[]`)

These settings vary by stage. Each is configured in the stage object within `stages.json`. See [Input Scenarios §1.4](../data-model/input-scenarios.md) for the full stage field table.

### 6.1 Block Mode

| Option     | Value             | LP Effect                                             | Reference                                           |
| ---------- | ----------------- | ----------------------------------------------------- | --------------------------------------------------- |
| block_mode | `"parallel"`      | Single water balance per stage, averaged generation   | [Block Formulations](../math/block-formulations.md) |
| block_mode | `"chronological"` | Per-block storage variables, sequential water balance | [Block Formulations](../math/block-formulations.md) |

Default: `"parallel"`. Can vary by stage (e.g., chronological for near-term, parallel for distant stages).

### 6.2 Risk Measure

| Option       | Value                                     | LP Effect                        | Reference                                    |
| ------------ | ----------------------------------------- | -------------------------------- | -------------------------------------------- |
| risk_measure | `"expectation"`                           | Risk-neutral expected value      | [Risk Measures §1](../math/risk-measures.md) |
| risk_measure | `{"cvar": {"alpha": ..., "lambda": ...}}` | Convex combination of E and CVaR | [Risk Measures §3](../math/risk-measures.md) |

Default: `"expectation"`. Can vary by stage (e.g., higher risk aversion for near-term stages). See [Extension Points §2](../architecture/extension-points.md) for variant selection and validation rules.

### 6.3 Scenario Source and Sampling Scheme

The `scenario_source` field configures how inflow scenarios are selected during the SDDP forward pass. See [Scenario Generation §3](../architecture/scenario-generation.md) for the full abstraction and [Extension Points §5](../architecture/extension-points.md) for variant selection.

| Option                          | Value          | Effect                                                                 | Reference                                                        |
| ------------------------------- | -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| scenario_source.sampling_scheme | `"in_sample"`  | Forward pass samples from the fixed opening tree (PAR-generated noise) | [Scenario Generation §3](../architecture/scenario-generation.md) |
| scenario_source.sampling_scheme | `"external"`   | Forward pass draws from user-provided scenario data                    | [Scenario Generation §4](../architecture/scenario-generation.md) |
| scenario_source.sampling_scheme | `"historical"` | Forward pass replays historical inflow sequences                       | [Scenario Generation §3](../architecture/scenario-generation.md) |
| scenario_source.seed            | i64            | Base seed for reproducible noise generation (required for `in_sample`) | [Input Scenarios §2.1](../data-model/input-scenarios.md)         |
| scenario_source.selection_mode  | `"random"`     | Sample from external scenarios with replacement                        | [Input Scenarios §2.1](../data-model/input-scenarios.md)         |
| scenario_source.selection_mode  | `"sequential"` | Cycle through external scenarios in order                              | [Input Scenarios §2.1](../data-model/input-scenarios.md)         |

| Sampling Scheme | Forward Noise Source                | Backward Noise Source                         |
| --------------- | ----------------------------------- | --------------------------------------------- |
| `in_sample`     | Opening tree (PAR-generated)        | Same opening tree                             |
| `external`      | User-provided scenario values       | Opening tree from PAR fitted to external data |
| `historical`    | Historical inflows mapped to stages | Opening tree from PAR fitted to history       |

### 6.4 Opening Tree Size

| Option       | Location    | Default | Effect                                   | Reference                                                          |
| ------------ | ----------- | ------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `n_openings` | stages.json | —       | Number of backward pass noise branchings | [Scenario Generation §2.3](../architecture/scenario-generation.md) |

The opening tree is generated once before training and remains fixed throughout. Larger values improve cut quality but increase backward pass cost linearly.

> **Deferred**: Monte Carlo backward sampling — sample $n < n_{\text{openings}}$ noise terms per backward step. See [Deferred Features §C.14](../deferred.md).

### 6.5 Production Function

The hydro production model is configured **per-hydro** (not globally) in `hydros.json`, with optional per-stage selection in `hydro_production_models.json`. See [Input Hydro Extensions §2](../data-model/input-hydro-extensions.md).

| Model                   | LP Effect                           | Phase                 | Reference                                                        |
| ----------------------- | ----------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `constant_productivity` | Fixed $\rho_h$                      | Training + Simulation | [Hydro Production Models §1](../math/hydro-production-models.md) |
| `fpha`                  | Piecewise-linear head approximation | Training + Simulation | [Hydro Production Models §2](../math/hydro-production-models.md) |
| `linearized_head`       | Bilinear $q \times v^{avg}$         | Simulation only       | [Hydro Production Models §3](../math/hydro-production-models.md) |

## 7. Simulation I/O Options (`config.json` → `simulation`)

Options that control simulation output and streaming behavior. All fields are optional; defaults are suitable for production use.

| Option                           | Type | Default | Description                                                                                                                                                                               | Reference                                                            |
| -------------------------------- | ---- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `simulation.io_channel_capacity` | int  | 64      | Bounded channel capacity between simulation threads and the I/O writer thread. Higher values reduce backpressure under fast simulation / slow disk, at the cost of increased peak memory. | [Output Infrastructure §6.2](../data-model/output-infrastructure.md) |

```json
{
  "simulation": {
    "io_channel_capacity": 128
  }
}
```

## 8. Complete Example

### `config.json`

```json
{
  "modeling": {
    "inflow_non_negativity": {
      "method": "penalty",
      "penalty_cost": 1000.0
    }
  },
  "training": {
    "enabled": true,
    "forward_passes": 10,
    "cut_selection": {
      "enabled": true,
      "method": "level1",
      "threshold": 0,
      "check_frequency": 10
    },
    "stopping_rules": [
      { "type": "iteration_limit", "limit": 100 },
      { "type": "bound_stalling", "iterations": 10, "tolerance": 0.0001 }
    ],
    "stopping_mode": "any"
  },
  "upper_bound_evaluation": {
    "enabled": true,
    "initial_iteration": 10,
    "interval_iterations": 5
  }
}
```

### `stages.json` (excerpt — per-stage options)

```json
{
  "policy_graph": {
    "type": "finite_horizon",
    "annual_discount_rate": 0.06,
    "transitions": [
      { "source_id": 0, "target_id": 1, "probability": 1.0 },
      { "source_id": 1, "target_id": 2, "probability": 1.0 }
    ]
  },
  "scenario_source": { "sampling_scheme": "in_sample", "seed": 42 },
  "n_openings": 20,
  "stages": [
    {
      "id": 0,
      "start_date": "2024-01-01",
      "end_date": "2024-02-01",
      "season_id": 0,
      "block_mode": "chronological",
      "risk_measure": { "cvar": { "alpha": 0.95, "lambda": 0.5 } },
      "blocks": [
        { "id": 0, "name": "LEVE", "hours": 168 },
        { "id": 1, "name": "MEDIA", "hours": 336 },
        { "id": 2, "name": "PESADA", "hours": 240 }
      ],
      "state_variables": { "storage": true, "inflow_lags": true }
    },
    {
      "id": 1,
      "start_date": "2024-02-01",
      "end_date": "2024-03-01",
      "season_id": 1,
      "block_mode": "parallel",
      "risk_measure": "expectation",
      "blocks": [{ "id": 0, "name": "UNICO", "hours": 696 }],
      "state_variables": { "storage": true, "inflow_lags": true }
    }
  ]
}
```

> **Note**: `block_mode`, `risk_measure`, and `state_variables` vary by stage. `scenario_source` and `n_openings` are top-level in `stages.json` (global for the run). `policy_graph` defines the horizon mode and discount rate. See [Input Scenarios](../data-model/input-scenarios.md) for the full schema.

## 8. Formulation-to-Configuration Mapping

This table maps each mathematical formulation to its configuration source and data files.

| Formulation Topic        | Config Location                                                               | Data Files                                                           | Spec Reference                                                   |
| ------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Block Formulation**    | stages.json → stages[].block_mode                                             | `Stage.blocks[]`, per-block water balance                            | [Block Formulations](../math/block-formulations.md)              |
| **Production Functions** | hydros.json + hydro_production_models.json                                    | `fpha_hyperplanes.parquet`, `hydro_geometry.parquet`                 | [Hydro Production Models](../math/hydro-production-models.md)    |
| **PAR(p) Model**         | scenarios/`inflow_seasonal_stats.parquet`, `inflow_ar_coefficients.parquet`   | Seasonal means/std, AR coefficients per (hydro, stage, lag)          | [PAR Inflow Model](../math/par-inflow-model.md)                  |
| **Non-Negativity**       | config.json → modeling.inflow_non_negativity                                  | LP slack variables, penalty coefficients                             | [Inflow Non-Negativity](../math/inflow-nonnegativity.md)         |
| **Cut Generation**       | N/A (runtime)                                                                 | Cut intercept/coefficients, dual extraction                          | [Cut Management](../math/cut-management.md)                      |
| **Cut Selection**        | config.json → training.cut_selection                                          | Cut activity tracking                                                | [Cut Management](../math/cut-management.md)                      |
| **Stopping Rules**       | config.json → training.stopping_rules[]                                       | Convergence metrics                                                  | [Stopping Rules](../math/stopping-rules.md)                      |
| **Discount Rate**        | stages.json → policy_graph.annual_discount_rate                               | Per-transition discount factor, cut scaling                          | [Discount Rate](../math/discount-rate.md)                        |
| **Horizon Mode**         | stages.json → policy_graph.type                                               | Policy graph cycle detection, cut sharing                            | [SDDP Algorithm §4](../math/sddp-algorithm.md)                   |
| **Inner Approximation**  | config.json → upper_bound_evaluation                                          | Vertex storage, Lipschitz constants                                  | [Upper Bound Evaluation](../math/upper-bound-evaluation.md)      |
| **Risk-Averse CVaR**     | stages.json → stages[].risk_measure                                           | Risk-adjusted probability computation                                | [Risk Measures](../math/risk-measures.md)                        |
| **Scenario Source**      | stages.json → scenario_source.sampling_scheme                                 | Opening tree, `external_scenarios.parquet`, `inflow_history.parquet` | [Scenario Generation §3](../architecture/scenario-generation.md) |
| **Penalty System**       | penalties.json + entity registries + constraints/penalty*overrides*\*.parquet | Three-tier cascade: global → entity → stage overrides                | [Penalty System](../data-model/penalty-system.md)                |

## 9. Variable Correspondence

| Math Symbol     | Field Name               | JSON/File Path                                                                     | Type       |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------- | ---------- |
| $v_h$           | Hydro storage            | hydros.json → storage                                                              | `f64`      |
| $\hat{v}_h$     | Incoming storage (state) | Internal state vector                                                              | `Vec<f64>` |
| $a_h$           | Incremental inflow       | `inflow_seasonal_stats.parquet` (mean_m3s)                                         | `f64`      |
| $\psi_{m,\ell}$ | AR coefficients          | `inflow_ar_coefficients.parquet` → coefficient                                     | `f64`      |
| $\sigma_m$      | Residual std dev         | Computed from $s_m$ and AR coefficients at runtime                                 | `f64`      |
| $\theta$        | Future cost variable     | LP variable                                                                        | `f64`      |
| $\alpha_k$      | Cut intercept            | FlatBuffers policy data (see [Binary Formats §3](../data-model/binary-formats.md)) | `f64`      |
| $\pi_k$         | Cut coefficients         | FlatBuffers policy data (see [Binary Formats §3](../data-model/binary-formats.md)) | `Vec<f64>` |
| $d_{t \to t+1}$ | Discount factor          | stages.json → policy_graph.annual_discount_rate                                    | `f64`      |
| $L_t$           | Lipschitz constant       | Computed from penalties                                                            | `f64`      |

## Cross-References

- [SDDP Algorithm](../math/sddp-algorithm.md) — Algorithm overview and policy graph structure
- [LP Formulation](../math/lp-formulation.md) — Objective function, constraints, dual variables
- [Block Formulations](../math/block-formulations.md) — Parallel and chronological block modes
- [Hydro Production Models](../math/hydro-production-models.md) — Constant productivity, FPHA, linearized head
- [PAR Inflow Model](../math/par-inflow-model.md) — PAR(p) definition and fitting
- [Inflow Non-Negativity](../math/inflow-nonnegativity.md) — Non-negativity treatment methods
- [Cut Management](../math/cut-management.md) — Cut generation, aggregation, selection
- [Cut Management Implementation](../architecture/cut-management-impl.md) — Cut selection implementation, serialization
- [Stopping Rules](../math/stopping-rules.md) — Convergence and stopping criteria
- [Discount Rate](../math/discount-rate.md) — Discounted Bellman equation
- [Infinite Horizon](../math/infinite-horizon.md) — Periodic structure and cyclic convergence
- [Upper Bound Evaluation](../math/upper-bound-evaluation.md) — Inner approximation and gap computation
- [Risk Measures](../math/risk-measures.md) — CVaR and risk-averse cut generation
- [Penalty System](../data-model/penalty-system.md) — Three-tier penalty cascade
- [Binary Formats](../data-model/binary-formats.md) — FlatBuffers policy data format
- [Input Directory Structure](../data-model/input-directory-structure.md) — File layout and config.json schema
- [Input Scenarios](../data-model/input-scenarios.md) — stages.json schema, scenario_source, policy_graph
- [Extension Points](../architecture/extension-points.md) — Variant selection, validation rules, dispatch mechanism
- [Solver Abstraction](../architecture/solver-abstraction.md) — Solver interface, LP construction, compile-time backend selection
- [Scenario Generation](../architecture/scenario-generation.md) — Sampling scheme abstraction, opening tree, external scenarios
- [Deferred Features](../deferred.md) — Planned but not yet implemented features
