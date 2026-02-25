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
| Openings             | 20                         | Backward pass LP solves                |
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
- AR lags: $160 \times 12 = 1{,}920$ (all hydros at max order)
- **Total: 2,080** (production assumption)

> **Note**: The production assumption is $D_{state} = 2{,}080$, corresponding to all hydros using AR(12). This is the worst-case ceiling and the value used for all capacity planning and performance budgeting in this spec. If most hydros use AR(6), the dimension reduces to $160 + 160 \times 6 = 1{,}120$, which is the optimistic case.

## 3. Variable and Constraint Counts

### 3.1 Variable Count per Subproblem

| Component                   | Formula                                             | Typical Count       |
| --------------------------- | --------------------------------------------------- | ------------------- |
| Future cost                 | $1$                                                 | 1                   |
| Deficit                     | $N_{bus} \times N_{block} \times N_{seg}$           | 6 × 3 × 1 = 18      |
| Excess                      | $N_{bus} \times N_{block}$                          | 6 × 3 = 18          |
| Exchange (direct + reverse) | $2 \times N_{line} \times N_{block}$                | 2 × 10 × 3 = 60     |
| Hydro storage               | $N_{hydro}$                                         | 160                 |
| Hydro incremental inflow AR | $N_{hydro} \times P$                                | 160 × 12 = 1,920    |
| Hydro turbined flow         | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro spillage              | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro generation            | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro inflow (per-block)    | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro diversion             | $N_{div} \times N_{block}$                          | ~10 × 3 = 30        |
| Hydro evaporation           | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro withdrawal            | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480       |
| Hydro slacks                | $N_{hydro} \times N_{block} \times 6$               | 160 × 3 × 6 = 2,880 |
| Thermal generation          | $N_{thermal} \times N_{block} \times \bar{N}_{seg}$ | 130 × 3 × 1 = 390   |
| Contracts                   | $(N_{imp} + N_{exp}) \times N_{block}$              | 5 × 3 = 15          |
| Pumping (flow + power)      | $N_{pump} \times N_{block} \times 2$                | 5 × 3 × 2 = 30      |
| **Total Variables**         |                                                     | **~8,400**          |

### 3.2 Constraint Count per Subproblem

| Component                        | Formula                                             | Typical Count         |
| -------------------------------- | --------------------------------------------------- | --------------------- |
| Load balance                     | $N_{bus} \times N_{block}$                          | 6 × 3 = 18            |
| Hydro water balance              | $N_{hydro}$                                         | 160                   |
| Incremental inflow AR dynamics   | $N_{hydro}$                                         | 160                   |
| Lagged incremental inflow fixing | $N_{hydro} \times P$                                | 160 × 12 = 1,920      |
| Hydro generation (constant)      | $(N_{hydro} - N_{fpha}) \times N_{block}$           | (160 − 50) × 3 = 330  |
| Hydro generation (FPHA)          | $N_{fpha} \times N_{block} \times \bar{M}_{planes}$ | 50 × 3 × 125 = 18,750 |
| Outflow definition               | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480         |
| Outflow bounds (min/max)         | $2 \times N_{hydro} \times N_{block}$               | 2 × 160 × 3 = 960     |
| Turbined min                     | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480         |
| Generation min                   | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480         |
| Evaporation                      | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480         |
| Water withdrawal                 | $N_{hydro} \times N_{block}$                        | 160 × 3 = 480         |
| Generic constraints              | $N_{generic}$                                       | ~50                   |
| **Active constraints**           |                                                     | **~24,750**           |
| **Benders cuts (pre-allocated)** | $N_{cuts}$                                          | 10,000-15,000         |
| **Total Constraints**            |                                                     | **~35,000-40,000**    |

> **Note**: Among active constraints, FPHA hyperplane constraints dominate (~18,750 of ~24,750). The total constraint count including pre-allocated Benders cut slots reaches ~35,000-40,000, but during early iterations most cut constraints are inactive (bounds set to $[-\infty, +\infty]$). See [Solver Abstraction §5](../architecture/solver-abstraction.md) for pre-allocation design.

### 3.3 Counting Formulas (Exact)

For precise sizing, use the following formulas where parameters come from the system configuration. The production-scale values in §3.1 and §3.2 are obtained by substituting the parameters from §1.

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

**Production-scale parameter values**: `AVG_DEF_SEGMENTS = 1`, `AVG_COST_SEGMENTS = 1`, `AVG_FPHA_PLANES = 125`, `N_HYDRO_EVAP = N_HYDRO = 160`, `N_HYDRO_WITHDRAWAL = N_HYDRO = 160`, `AR_ORDER = 12` (worst case). All other parameters as in §1.

## 4. Performance Expectations by Scale

> **Note**: The Production-row timing estimates in this section are derived from a first-principles wall-clock model using LP solve time KPIs (§4.3), parallelism parameters (§4.2), and work distribution mechanics ([Work Distribution §2](../hpc/work-distribution.md)). They assume a fully warm-started steady-state iteration and do not account for I/O, checkpointing, or convergence check overhead. The complete derivation is recorded in the [timing model analysis](../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md) audit artifact. These are pre-implementation estimates pending solver benchmarking; the smaller test system rows (Unit Test through Large) remain engineering targets based on domain experience.

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
| **Production** | 120    | 160    | 130      | 12       | 192        | 64    | 24           | ~0.24s \*    | ~4.76s \*     | <2 GB       |

> **Note**: Memory/rank estimates reference [Memory Architecture §2.1](../hpc/memory-architecture.md) (~1.2 GB per rank at production scale with 16 threads). Rows marked with \* are model-derived estimates from the [timing model analysis](../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md) at $\tau_{LP} = 2$ ms (see §4.6 for the complete time budget). The remaining rows (Unit Test through Large) are engineering targets based on domain experience and will be validated during implementation.

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

| Dimension       | Scaling Behavior                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward pass    | Time $\propto$ (stages $\times$ LP solve time) / (ranks $\times$ threads). Near-linear speedup.                                                                                                                       |
| Backward pass   | Time $\propto$ stages $\times$ (openings / threads + MPI sync). Sequential stage dependency.                                                                                                                          |
| Communication   | Pure data transfer < 0.1% of iteration time on InfiniBand; total synchronization overhead (including load imbalance barriers) ~2% ([Communication Patterns §3.2](../hpc/communication-patterns.md), §4.6 time budget) |
| Memory per rank | $\approx$ solver workspaces (~57 MB $\times$ threads) + cut pool (~250 MB) + opening tree (~30 MB). See [Memory Architecture §2.1](../hpc/memory-architecture.md)                                                     |
| Cut pool growth | Logical growth only (pre-allocated slots). Memory stable after initialization.                                                                                                                                        |

> **Thread utilization at 64 ranks**: The forward and backward passes have different utilization characteristics. **Forward pass**: With $M = 192$ trajectories distributed across $R = 64$ ranks, each rank receives $192 / 64 = 3$ trajectories, so $3/24 = 12.5\%$ thread utilization. **Backward pass**: With $N_{open} = 20$ openings per stage distributed across $R = 64$ ranks, only 20 of 64 ranks receive work (at most 1 opening each), and each active rank uses 1 of 24 threads ($4.2\%$ utilization). The remaining 44 ranks are idle during backward pass stages. Despite the low utilization, the per-iteration compute time is determined by the critical path: $T \times \tau_{LP}$ for the forward pass and $(T-1) \times N_{open} \times \tau_{LP}$ for the backward pass. The 64-rank configuration trades utilization for reduced per-rank memory pressure and future scaling headroom. At $R = 8$ ranks with 24 threads, forward utilization reaches 100%. See the [timing model analysis §8](../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md) for the complete utilization comparison.

### 4.5 Convergence Reference

| Problem Type                       | Typical Iterations | Optimality Gap  |
| ---------------------------------- | ------------------ | --------------- |
| Simple (few hydros, short horizon) | 10-20              | <0.1%           |
| Medium (regional system)           | 30-50              | <0.5%           |
| Complex (full national grid)       | 50-100             | <1.0%           |
| With CVaR risk measure             | +20-50% iterations | Same gap target |

> **Note**: Iteration counts assume reasonable initial policy (warm-start from previous study). Cold-start may require 2-3x more iterations.

### 4.6 Wall-Clock Time Budget

The following per-iteration time budget is derived from a first-principles model at $\tau_{LP} = 2$ ms, $R = 64$ ranks, $D_{state} = 2{,}080$ (worst-case AR(12)), InfiniBand HDR. The complete derivation with all intermediate steps is in the [timing model analysis](../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md).

| Component                     | Per-Iteration | Fraction | Category        |
| ----------------------------- | ------------: | -------: | --------------- |
| Forward pass compute          |       0.240 s |    4.70% | Compute         |
| Backward pass compute         |       4.760 s |   93.30% | Compute         |
| Trial point `Allgatherv`      |       0.002 s |    0.04% | Communication   |
| Cut exchange (119 stages)     |       0.005 s |    0.10% | Communication   |
| Convergence `Allreduce`       |      ~0.000 s |   ~0.00% | Communication   |
| Barrier overhead (119 stages) |       0.095 s |    1.86% | Synchronization |
| **Per-iteration total**       |   **5.102 s** | **100%** |                 |

**50-iteration projection**:

| Metric                 |     Value | Notes                                           |
| ---------------------- | --------: | ----------------------------------------------- |
| 50-iteration total     |   255.1 s | $50 \times 5.102$                               |
| Wall-clock budget      | 7,200.0 s | 2-hour operational requirement                  |
| Budget fraction        |      3.5% | Headroom: 6,945 s (96.5%)                       |
| Headroom available for |           | I/O, checkpointing, cold-starts, cut management |

#### Sensitivity: Critical LP Solve Time

The model is linear in $\tau_{LP}$. LP solves per iteration: $120 + 119 \times 20 = 2{,}500$. Including barrier overhead (2% of backward compute), the LP-equivalent coefficient is $2{,}500 + 47.6 = 2{,}547.6$. The total 50-iteration compute time is:

$$
T_{total}^{full} \approx 50 \times (2{,}547.6 \times \tau_{LP} + 0.007) = 127{,}380 \times \tau_{LP} + 0.35 \text{ seconds}
$$

Setting $T_{total}^{full} = 7{,}200$ s and solving for the critical LP solve time:

$$
\tau_{LP}^{crit} = \frac{7{,}200 - 0.35}{127{,}380} \approx 56.5 \text{ ms}
$$

If the effective LP solve time exceeds approximately **56.5 ms**, the 50-iteration budget is violated. With only 20 openings (vs. 200 in earlier estimates), the solver has substantial headroom against LP solve time degradation.

| Scenario                        | $\tau_{LP}$ | 50-iter total | Budget % | Verdict           |
| ------------------------------- | ----------: | ------------: | -------: | ----------------- |
| Aggressive warm-start           |        1 ms |      ~127.8 s |     1.8% | Well under budget |
| **Target (spec KPI)**           |    **2 ms** |  **~255.1 s** | **3.5%** | **Under budget**  |
| Moderate warm-start degradation |        4 ms |      ~509.9 s |     7.1% | Under budget      |
| Elevated solve time             |       10 ms |    ~1,274.2 s |    17.7% | Under budget      |
| **Critical threshold**          |    ~56.5 ms |    ~7,200.0 s |   100.0% | At budget limit   |

#### Sensitivity: Backward Pass Warm-Start Rate

The backward pass constitutes ~93% of compute. If the backward pass warm-start hit rate $\eta_{ws}^{bwd}$ drops below 100% (the design target from [Work Distribution §2.3](../hpc/work-distribution.md)), LP solve times blend between warm-start ($\tau_{ws} = 2$ ms) and cold-start ($\tau_{cs} = 20$ ms):

| $\eta_{ws}^{bwd}$ | Effective $\tau_{LP}^{bwd}$ | 50-iter total | Verdict      |
| ----------------: | --------------------------: | ------------: | ------------ |
|              100% |                        2 ms |        ~255 s | Under budget |
|               90% |                      3.8 ms |        ~474 s | Under budget |
|               80% |                      5.6 ms |        ~693 s | Under budget |
|               70% |                      7.4 ms |        ~911 s | Under budget |

With 20 openings, warm-start remains beneficial for LP performance but is no longer an existential threat to the 2-hour budget. Even at 70% hit rate, the solver uses only ~12.7% of the budget. The sequential opening evaluation design ([Work Distribution §2.3](../hpc/work-distribution.md)) still targets near-100% warm-start for optimal LP throughput.

### 4.7 Model Assumptions

Every timing model estimate in §4.6 depends on the assumptions below. The table distinguishes spec-defined KPIs (which are targets to be met by the implementation), spec-defined architecture parameters (which are design decisions), and engineering estimates (which need validation).

| Assumption                               | Value      | Source                                                                      | Category             | Sensitivity |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------- | -------------------- | ----------- |
| LP solve time (warm-start)               | 2 ms       | §4.3 KPI                                                                    | Spec KPI             | **High**    |
| LP solve time (cold-start)               | 20 ms      | §4.3 KPI                                                                    | Spec KPI             | Medium      |
| Forward pass warm-start hit rate         | 70%        | §4.3 KPI                                                                    | Spec KPI             | Low         |
| Backward pass warm-start hit rate        | ~100%      | [Work Distribution §2.3](../hpc/work-distribution.md) (sequential openings) | Spec Architecture    | Low         |
| MPI ranks                                | 64         | §4.2                                                                        | Spec Architecture    | Low         |
| Threads per rank                         | 24         | §4.2                                                                        | Spec Architecture    | Low         |
| Stages                                   | 120        | §1                                                                          | Spec Architecture    | Low         |
| Forward passes                           | 192        | §1                                                                          | Spec Architecture    | Low         |
| Openings                                 | 20         | §1                                                                          | Spec Architecture    | Low         |
| Iterations                               | 50         | §1                                                                          | Spec Architecture    | Low         |
| Backward stages = $T - 1$                | 119        | [Training Loop §6.1](../architecture/training-loop.md)                      | Spec Architecture    | Low         |
| One LP solve per stage per trajectory    | 1          | §3 (blocks within LP, not separate solves)                                  | Spec Architecture    | Low         |
| Sequential opening evaluation per thread | Sequential | [Work Distribution §2.3](../hpc/work-distribution.md)                       | Spec Architecture    | Low         |
| InfiniBand HDR bandwidth                 | 25 GB/s    | §4.1                                                                        | Spec Architecture    | Low         |
| IB protocol overhead factor              | 50%        | [Communication Patterns §3.2](../hpc/communication-patterns.md)             | Engineering Estimate | Low         |
| MPI base latency (InfiniBand)            | 2 us       | Conservative estimate for modern IB HCA                                     | Engineering Estimate | Low         |
| LP solve time standard deviation         | 15%        | [Work Distribution §4.1](../hpc/work-distribution.md) (upper end of 5-15%)  | Engineering Estimate | Low         |
| Load imbalance barrier overhead          | 2%         | Derived from statistical model of per-stage max-of-ranks                    | Engineering Estimate | Low         |

**High-sensitivity parameters**: LP solve time ($\tau_{ws}$) is the primary assumption with material impact on feasibility, though the critical threshold is now ~56.5 ms (well above the 2 ms target). With 20 openings, backward pass warm-start hit rate ($\eta_{ws}^{bwd}$) is no longer an existential risk -- even at 70% hit rate the budget fraction is ~12.7%. All other parameters would need to change by an order of magnitude to threaten the 2-hour budget. Early solver benchmarking should still prioritize measuring LP solve time under warm-start conditions.

## Cross-References

- [Design Principles](./design-principles.md) — Format selection criteria and design goals
- [Notation Conventions](./notation-conventions.md) — Mathematical symbols used in formulas above
- [LP Formulation](../math/lp-formulation.md) — Complete LP subproblem that these dimensions describe
- [SDDP Algorithm](../math/sddp-algorithm.md) — Forward/backward pass structure driving performance targets
- [Solver Abstraction §5](../architecture/solver-abstraction.md) — Cut pool pre-allocation and capacity management
- [Solver Workspaces §1.2](../architecture/solver-workspaces.md) — Per-thread workspace sizing (~57 MB)
- [Memory Architecture §2](../hpc/memory-architecture.md) — Per-rank memory budget (~1.2 GB), derivable components
- [Hybrid Parallelism](../hpc/hybrid-parallelism.md) — MPI+OpenMP architecture for achieving these scaling targets
- [Communication Patterns §3](../hpc/communication-patterns.md) — Communication volume analysis, pure transfer < 0.1%
- [Work Distribution §2](../hpc/work-distribution.md) — Forward/backward pass distribution, thread-trajectory affinity
- [Training Loop §6](../architecture/training-loop.md) — Backward pass stage loop, cut synchronization per stage
- [SLURM Deployment](../hpc/slurm-deployment.md) — Job scripts for the test system scales above
