# Production Scale Reference

## Purpose

This spec defines the production-scale dimensions of the Cobre SDDP solver: system sizes, LP variable and constraint counts, state dimension formulas, and performance expectations by scale. It serves as the reference for capacity planning, memory budgeting, and performance regression detection.

## 1. Production Scale Dimensions

Based on the target production scenario:

| Dimension            | Value                      | Memory Impact                          |
| -------------------- | -------------------------- | -------------------------------------- |
| Stages               | 120                        | Graph size                             |
| Blocks per Stage     | 1-24 (varies), typically 3 | LP structure, outputs                  |
| Hydros               | 160                        | State dimension                        |
| Max AR Order         | 12                         | State dimension, variables/constraints |
| Thermals             | 130                        | Variables                              |
| Buses                | 6                          | Variables/constraints                  |
| Lines                | 10                         | Variables/constraints                  |
| Forward Passes       | 192                        | Parallelism                            |
| Openings             | 200                        | Backward pass LP solves                |
| Iterations           | 50                         | Cut pool size                          |
| Simulation Scenarios | 2000                       | Output size                            |

## 2. State Dimension Estimates

### 2.1 State Variables and Dimension

The **state dimension** determines the size of Benders cuts. State variables include:

| Component     | Count                | Description                                  | Status                           |
| ------------- | -------------------- | -------------------------------------------- | -------------------------------- |
| Storage       | $N_{hydro}$          | End-of-stage reservoir volume for each hydro | Implemented                      |
| AR Lags       | $\sum_{h} P_h$       | Inflow lag values for AR($P_h$) models       | Implemented                      |
| Battery SOC   | $N_{battery}$        | Battery state of charge                      | Deferred ([C.2](../deferred.md)) |
| GNL Committed | $\sum_{gnl} L_{gnl}$ | GNL dispatch pipeline                        | Deferred ([C.1](../deferred.md)) |

**State Dimension Formula**:

$$
N_{state} = N_{hydro} + \sum_{h=1}^{N_{hydro}} P_h + N_{battery} + \sum_{gnl} L_{gnl}
$$

For the current implementation (batteries and GNL deferred, both zero):

$$
N_{state} = N_{hydro} + \sum_{h=1}^{N_{hydro}} P_h
$$

For production scale (160 hydros, AR order up to 12):

- Storage: 160
- AR lags: $160 \times 12 = 1920$ (worst case, all hydros use max order)
- Total: up to 2,080

> **Note**: The actual state dimension depends on the AR orders specified in `inflow_ar_coefficients.parquet`. If most hydros use AR(6), the dimension would be $160 + 160 \times 6 = 1{,}120$.

## 3. Variable and Constraint Counts

### 3.1 Variable Count per Subproblem

| Component                   | Formula                                             | Typical Count       | Source             |
| --------------------------- | --------------------------------------------------- | ------------------- | ------------------ |
| Future cost                 | $1$                                                 | 1                   | Calculator         |
| Deficit                     | $N_{bus} \times N_{block} \times N_{seg}$           | 6 × 3 × 3 = 54      | Calculator         |
| Excess                      | $N_{bus} \times N_{block}$                          | 6 × 3 = 18          | Calculator         |
| Exchange (direct + reverse) | $2 \times N_{line} \times N_{block}$                | 2 × 10 × 3 = 60     | Calculator         |
| Hydro storage               | $N_{hydro}$                                         | 160                 | Calculator         |
| Hydro incremental inflow AR | $N_{hydro} \times P$                                | 160 × 12 = 1,920    | Calculator (AR 12) |
| Hydro turbined flow         | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       | Calculator         |
| Hydro spillage              | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       | Calculator         |
| Hydro generation            | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       | Calculator         |
| Hydro inflow (per-block)    | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       | Calculator         |
| Hydro diversion             | $N_{div} \times N_{block}$                          | ~10 × 3 = 30        | Calculator         |
| Hydro evaporation           | $N_{evap} \times N_{block}$                         | ~50 × 3 = 150       | Calculator         |
| Hydro withdrawal            | $N_{withdrawal} \times N_{block}$                   | ~20 × 3 = 60        | Calculator         |
| Hydro slacks                | $N_{hydro} \times N_{block} \times 6$               | 160 × 3 × 6 = 2,880 | Calculator         |
| Thermal generation          | $N_{thermal} \times N_{block} \times \bar{N}_{seg}$ | 130 × 3 × 1.5 = 585 | Calculator         |
| Contracts                   | $(N_{imp} + N_{exp}) \times N_{block}$              | 5 × 3 = 15          | Calculator         |
| Pumping (flow + power)      | $N_{pump} \times N_{block} \times 2$                | 5 × 3 × 2 = 30      | Calculator         |
| **Total Variables**         |                                                     | **~7,500**          | Derived            |

### 3.2 Constraint Count per Subproblem

| Component                        | Formula                                             | Typical Count        | Source             |
| -------------------------------- | --------------------------------------------------- | -------------------- | ------------------ |
| Load balance                     | $N_{bus} \times N_{block}$                          | 6 × 3 = 18           | Calculator         |
| Hydro water balance              | $N_{hydro}$                                         | 160                  | Calculator         |
| Incremental inflow AR dynamics   | $N_{hydro}$                                         | 160                  | Calculator         |
| Lagged incremental inflow fixing | $N_{hydro} \times P$                                | 160 × 12 = 1,920     | Calculator (AR 12) |
| Hydro generation (constant)      | $(N_{hydro} - N_{fpha}) \times N_{block}$           | (160 − 50) × 3 = 330 | Calculator         |
| Hydro generation (FPHA)          | $N_{fpha} \times N_{block} \times \bar{M}_{planes}$ | 50 × 3 × 10 = 1,500  | Calculator         |
| Outflow definition               | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480        | Calculator         |
| Outflow bounds (min/max)         | $2 \times N_{hydro} \times N_{block}$               | 2 × 160 × 3 = 960    | Calculator         |
| Turbined min                     | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480        | Calculator         |
| Generation min                   | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480        | Calculator         |
| Evaporation                      | $N_{evap} \times N_{block}$                         | 50 × 3 = 150         | Calculator         |
| Water withdrawal                 | $N_{withdrawal} \times N_{block}$                   | 20 × 3 = 60          | Calculator         |
| Generic constraints              | $N_{generic}$                                       | ~50                  | Calculator         |
| **Benders cuts (pre-allocated)** | $N_{cuts}$                                          | 10,000-15,000        | Configuration      |
| **Total Constraints**            |                                                     | **~17,000-22,000**   | Derived            |

> **Note**: The constraint count is dominated by pre-allocated Benders cut slots. During early iterations, most cut constraints are inactive (bounds set to $[-\infty, +\infty]$). See [Solver Abstraction §5](../architecture/solver-abstraction.md) for pre-allocation design.

### 3.3 Counting Formulas (Exact)

These formulas correspond one-to-one with the `calculate_sizing()` function in `scripts/lp_sizing.py` (lines 191-234). Each term below maps to a named field in the `LPSizing` dataclass. The calculator groups the "Incremental inflow AR dynamics" and "Lagged incremental inflow fixing" constraint rows into a single `n_cons_hydro_ar_dynamics` field computed as `N_HYDRO * (1 + AR_ORDER)`.

For precise sizing, use the following formulas where parameters come from the configuration:

**Variables**:

```
N_VAR = 1                                                      # theta
      + N_BUS × N_BLOCK × (AVG_DEF_SEGMENTS + 1)              # deficit + excess
      + 2 × N_LINE × N_BLOCK                                   # exchange
      + N_HYDRO                                                 # storage
      + N_HYDRO × AR_ORDER                                      # incremental inflow model
      + N_HYDRO × N_BLOCK × 4                                   # q, s, g, inflow
      + N_HYDRO_DIV × N_BLOCK                                   # diversion
      + N_HYDRO_EVAP × N_BLOCK                                  # evaporation
      + N_HYDRO_WITHDRAWAL × N_BLOCK                            # withdrawal
      + N_HYDRO × N_BLOCK × N_SLACK_TYPES                       # slack vars
      + N_THERMAL × N_BLOCK × AVG_COST_SEGMENTS                 # thermal
      + (N_CONTRACT_IMP + N_CONTRACT_EXP) × N_BLOCK             # contracts
      + N_PUMP × N_BLOCK × 2                                    # pump flow + power
```

**Constraints**:

```
N_CON = N_BUS × N_BLOCK                                        # load balance
      + N_HYDRO                                                 # water balance
      + N_HYDRO                                                 # inflow AR dynamics
      + N_HYDRO × AR_ORDER                                      # lagged inflow fixing
      + (N_HYDRO - N_HYDRO_FPHA) × N_BLOCK                       # generation (constant)
      + N_HYDRO_FPHA × N_BLOCK × AVG_FPHA_PLANES                # FPHA (additional)
      + N_HYDRO × N_BLOCK                                       # outflow definition
      + N_HYDRO × N_BLOCK × 2                                   # outflow bounds
      + N_HYDRO × N_BLOCK                                       # turbined min
      + N_HYDRO × N_BLOCK                                       # generation min
      + N_HYDRO_EVAP × N_BLOCK                                  # evaporation
      + N_HYDRO_WITHDRAWAL × N_BLOCK                            # withdrawal
      + N_GENERIC                                                # generic constraints
      + N_CUT_CAPACITY                                           # Benders cuts
```

**State Dimension**:

```
N_STATE = N_HYDRO                                               # storage
        + SUM(AR_ORDER[h] for h in HYDROS)                      # AR lags
        # + N_BATTERY  (deferred C.2)
        # + SUM(GNL_LAG[t] for t in GNL_THERMALS)  (deferred C.1)
```

### 3.4 Sizing Calculator Verification

The sizing calculator (`scripts/lp_sizing.py` in the `powers` repository) is the ground truth for LP variable counts, constraint counts, state dimension, and memory estimates. It accepts a JSON system configuration and computes all values using the same formulas documented in §3.3.

#### Calculator Location and Verification Command

To verify the production-scale values in this spec, run the calculator with an empty JSON input (which uses all defaults):

```sh
echo '{}' | python3 scripts/lp_sizing.py /dev/stdin
```

> **Note**: The calculator default `n_forward_passes` is 200; the spec uses 192 (see §1). This parameter does not affect LP variable or constraint counts, so the verification output matches regardless.

#### Default Parameters

The calculator's `SystemConfig` dataclass defines the following defaults, which drive all production-scale values in §3.1-§3.3:

| Parameter                   | Default | Description                        |
| --------------------------- | ------: | ---------------------------------- |
| `n_hydros`                  |     160 | Number of hydroelectric plants     |
| `n_thermals`                |     130 | Number of thermal plants           |
| `n_buses`                   |       6 | Number of subsystem buses          |
| `n_lines`                   |      10 | Number of transmission lines       |
| `n_blocks`                  |       3 | Load blocks per stage              |
| `n_pumps`                   |       5 | Number of pumping stations         |
| `n_contracts_import`        |       3 | Import contracts                   |
| `n_contracts_export`        |       2 | Export contracts                   |
| `avg_ar_order`              |       6 | Average AR order (for calculator)  |
| `max_ar_order`              |      12 | Maximum AR order (for worst-case)  |
| `n_hydros_with_fpha`        |      50 | Hydros with FPHA generation model  |
| `avg_fpha_planes`           |      10 | Average FPHA approximation planes  |
| `n_hydros_with_diversion`   |      10 | Hydros with water diversion        |
| `n_hydros_with_evaporation` |      50 | Hydros with evaporation modeling   |
| `n_hydros_with_withdrawal`  |      20 | Hydros with water withdrawal       |
| `avg_deficit_segments`      |       3 | Deficit cost segments per bus      |
| `avg_thermal_segments`      |     1.5 | Cost segments per thermal          |
| `n_slack_types`             |       6 | Slack variable types per hydro     |
| `n_generic_constraints`     |      50 | Generic (custom) constraints       |
| `n_cuts_capacity`           |  15,000 | Pre-allocated Benders cut slots    |
| `n_stages`                  |     120 | Planning horizon stages            |
| `n_iterations`              |      50 | SDDP iterations                    |
| `n_forward_passes`          |     200 | Calculator default (spec uses 192) |

#### Output Mapping

The following table maps calculator output fields to spec sections for cross-verification:

| Calculator Output Field        | Spec Reference                         |
| ------------------------------ | -------------------------------------- |
| `total_variables`              | §3.1 approximate total                 |
| `total_constraints`            | §3.2 approximate total                 |
| `total_constraints_no_cuts`    | §3.2 total minus Benders cuts row      |
| `state_dimension`              | §2.1 state dimension (avg AR(6) case)  |
| `cuts_per_stage_bytes`         | §3.4 headline table, cuts memory/stage |
| Per-variable-category fields   | §3.1 individual rows (at avg AR(6))    |
| Per-constraint-category fields | §3.2 individual rows (at avg AR(6))    |

#### Headline Values

Running with the default production-scale parameters (160 hydros, 130 thermals, 6 buses, 10 lines, avg AR order 6, 15,000 cut slots) produces:

| Metric             | Calculator Output | Notes                                     |
| ------------------ | ----------------: | ----------------------------------------- |
| Total variables    |             6,923 | §3.1 estimates ~7,500 (worst-case AR(12)) |
| Total constraints  |            20,788 | §3.2 estimates ~17,000-22,000             |
| Active constraints |             5,788 | Excluding pre-allocated cut slots         |
| State dimension    |             1,120 | With avg AR(6); up to 2,080 at AR(12)     |
| Cuts memory/stage  |          128.7 MB | Dense coefficients, 15,000 slots          |

#### AR(12) vs AR(6) Assumptions

The per-row estimates in §3.1 and §3.2 use worst-case AR order (P=12 for all hydros) to establish upper bounds for capacity planning. The sizing calculator uses configurable average AR order (default `avg_ar_order=6`), which better reflects typical production cases where hydros have varying AR orders. Both are consistent within their stated assumptions:

- **Worst-case (AR 12)**: §3.1 total ~7,900 variables; §3.2 active constraints ~6,750. Used for upper-bound capacity planning.
- **Average-case (AR 6)**: Calculator total 6,923 variables; active constraints 5,788. Used for typical memory budgeting.

Rows annotated "Calculator (AR 12)" in §3.1 and §3.2 are the ones affected by this assumption. To verify the worst-case values, run the calculator with `avg_ar_order` set to 12:

```sh
echo '{"avg_ar_order": 12}' | python3 scripts/lp_sizing.py /dev/stdin
```

## 4. Performance Expectations by Scale

> **Note**: Performance expectations in this section are aspirational targets based on domain experience and hardware specifications, not calculator-derived values. They will be validated and refined during implementation. See §3.4 for calculator-verifiable values.

> **Purpose**: This table provides expected timing targets for different problem scales, enabling performance validation and regression detection. Timings are per-iteration unless otherwise noted.

### 4.1 Hardware Assumptions

| Component | Specification                                         |
| --------- | ----------------------------------------------------- |
| CPU       | AMD EPYC 9R14 or equivalent (192 cores, 3.7 GHz base) |
| Memory    | DDR5, 384 GB/node                                     |
| Network   | InfiniBand HDR (200 Gb/s) or equivalent               |
| Storage   | NVMe SSD for I/O operations                           |

### 4.2 Test Systems

| Scale          | Stages | Hydros | Thermals | AR Order | Fwd Passes | Ranks | Threads/Rank | Forward Time | Backward Time | Memory/Rank |
| -------------- | ------ | ------ | -------- | -------- | ---------- | ----- | ------------ | ------------ | ------------- | ----------- |
| **Unit Test**  | 3      | 1      | 2        | 0        | 2          | 1     | 1            | <0.1s        | <1s           | <20 MB      |
| **Small**      | 6      | 5      | 5        | 1        | 10         | 1     | 2            | <0.2s        | <2s           | <50 MB      |
| **Medium**     | 12     | 80     | 65       | 6        | 100        | 4     | 12           | <5s          | <15s          | <500 MB     |
| **Large**      | 60     | 160    | 130      | 12       | 192        | 16    | 16           | <15s         | <45s          | <1.5 GB     |
| **Production** | 120    | 160    | 130      | 12       | 192        | 64    | 24           | <30s         | <90s          | <2 GB       |

> **Note**: Memory/rank estimates reference [Memory Architecture §2.1](../hpc/memory-architecture.md) (~1.2 GB per rank at production scale with 16 threads). Timing targets are aspirational — actual values depend on LP solver performance and will be validated during implementation.

### 4.3 Key Performance Indicators

| Metric                        | Target  | Measurement Point                  |
| ----------------------------- | ------- | ---------------------------------- |
| LP solve (warm-start)         | <2 ms   | Hot-path, ~500-row problem         |
| LP solve (cold-start)         | <20 ms  | First solve or basis invalid       |
| RHS batch update              | <100 us | ~500 constraint updates            |
| Solution extraction           | <50 us  | Primal + basis to buffers          |
| Cut exchange (MPI_Allgatherv) | <5 ms   | Per-stage, all ranks exchange cuts |
| Parallel efficiency           | >80%    | At 64 ranks vs. 1 rank             |
| Warm-start hit rate           | >70%    | Forward pass consecutive stages    |

### 4.4 Scaling Expectations

| Dimension       | Scaling Behavior                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward pass    | Time $\propto$ (stages $\times$ LP solve time) / (ranks $\times$ threads). Near-linear speedup.                                                                   |
| Backward pass   | Time $\propto$ stages $\times$ (openings / threads + MPI sync). Sequential stage dependency.                                                                      |
| Communication   | < 2% of iteration time at production scale, even on Ethernet ([Communication Patterns §3.2](../hpc/communication-patterns.md))                                    |
| Memory per rank | $\approx$ solver workspaces (~57 MB $\times$ threads) + cut pool (~250 MB) + opening tree (~30 MB). See [Memory Architecture §2.1](../hpc/memory-architecture.md) |
| Cut pool growth | Logical growth only (pre-allocated slots). Memory stable after initialization.                                                                                    |

### 4.5 Convergence Reference

| Problem Type                       | Typical Iterations | Optimality Gap  |
| ---------------------------------- | ------------------ | --------------- |
| Simple (few hydros, short horizon) | 10-20              | <0.1%           |
| Medium (regional system)           | 30-50              | <0.5%           |
| Complex (full national grid)       | 50-100             | <1.0%           |
| With CVaR risk measure             | +20-50% iterations | Same gap target |

> **Note**: Iteration counts assume reasonable initial policy (warm-start from previous study). Cold-start may require 2-3x more iterations.

## Cross-References

- [Design Principles](./design-principles.md) — Format selection criteria and design goals
- [Notation Conventions](./notation-conventions.md) — Mathematical symbols used in formulas above
- [LP Formulation](../math/lp-formulation.md) — Complete LP subproblem that these dimensions describe
- [SDDP Algorithm](../math/sddp-algorithm.md) — Forward/backward pass structure driving performance targets
- [Solver Abstraction §5](../architecture/solver-abstraction.md) — Cut pool pre-allocation and capacity management
- [Solver Workspaces §1.2](../architecture/solver-workspaces.md) — Per-thread workspace sizing (~57 MB)
- [Memory Architecture §2](../hpc/memory-architecture.md) — Per-rank memory budget (~1.2 GB), derivable components
- [Hybrid Parallelism](../hpc/hybrid-parallelism.md) — MPI+OpenMP architecture for achieving these scaling targets
- [Communication Patterns §3](../hpc/communication-patterns.md) — Communication volume analysis (<2% overhead)
- [SLURM Deployment](../hpc/slurm-deployment.md) — Job scripts for the test system scales above
