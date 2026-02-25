# Wall-Clock Timing Model: One SDDP Iteration at Production Scale

## 1. Parameter Table

All input parameters with their source specifications.

| Parameter                     | Symbol       | Value                    | Source                                |
| ----------------------------- | ------------ | ------------------------ | ------------------------------------- |
| Stages                        | $T$          | 120                      | `production-scale-reference.md` SS1   |
| Blocks per stage              | $N_{block}$  | 3 (typical)              | `production-scale-reference.md` SS1   |
| Forward passes (trajectories) | $M$          | 192                      | `production-scale-reference.md` SS1   |
| Openings                      | $N_{open}$   | 200                      | `production-scale-reference.md` SS1   |
| Iterations                    | $K$          | 50                       | `production-scale-reference.md` SS1   |
| MPI ranks                     | $R$          | 64                       | `production-scale-reference.md` SS4.2 |
| Threads per rank              | $N_{thr}$    | 24                       | `production-scale-reference.md` SS4.2 |
| LP solve time (warm-start)    | $\tau_{ws}$  | < 2 ms                   | `production-scale-reference.md` SS4.3 |
| LP solve time (cold-start)    | $\tau_{cs}$  | < 20 ms                  | `production-scale-reference.md` SS4.3 |
| Warm-start hit rate           | $\eta_{ws}$  | > 70%                    | `production-scale-reference.md` SS4.3 |
| LP variables (typical)        | $N_{var}$    | ~7,500                   | `production-scale-reference.md` SS3.1 |
| LP constraints (active)       | $N_{con}$    | ~5,788                   | `production-scale-reference.md` SS3.4 |
| Wall-clock budget (total)     | $T_{budget}$ | 7,200 s (2 hours)        | Operational requirement               |
| Forward distribution          | --           | Static contiguous blocks | `work-distribution.md` SS1.1          |
| Thread scheduling             | --           | `schedule(dynamic,1)`    | `work-distribution.md` SS1.2          |
| Opening evaluation            | --           | Sequential per thread    | `work-distribution.md` SS2.3          |
| Backward stage order          | --           | $t = T$ down to 2        | `training-loop.md` SS6.1              |

## 2. Forward Pass Timing Derivation

### 2.1 Work Distribution

The forward pass distributes $M = 192$ trajectories across $R = 64$ ranks using static contiguous blocks (`work-distribution.md` SS1.1).

$$
M_r = \left\lfloor \frac{M}{R} \right\rfloor = \left\lfloor \frac{192}{64} \right\rfloor = 3 \text{ trajectories per rank}
$$

Since $192 \bmod 64 = 0$, every rank receives exactly 3 trajectories.

### 2.2 Thread Assignment Within Rank

Within each rank, the 3 trajectories are distributed to $N_{thr} = 24$ threads via `schedule(dynamic,1)` (`work-distribution.md` SS1.2). Each trajectory is fully owned by one thread (thread-trajectory affinity). Since there are only 3 trajectories and 24 threads:

$$
N_{active} = \min(M_r, N_{thr}) = \min(3, 24) = 3 \text{ active threads}
$$

The remaining 21 threads are idle during the forward pass.

### 2.3 Per-Thread Work

Each active thread processes one trajectory by solving 120 stages sequentially ($t = 1$ to $T$). At each stage, there is **one LP solve** (the 3 blocks are part of the LP structure, not separate solves -- see `production-scale-reference.md` SS1 and SS3).

$$
\text{LP solves per thread} = T = 120
$$

### 2.4 Per-Rank Forward Time

All 3 trajectories execute in parallel (one per thread). The per-rank forward time is determined by the slowest thread, which in the balanced case is:

$$
T_{fwd}^{rank} = T \times \tau_{LP} = 120 \times \tau_{LP}
$$

where $\tau_{LP}$ is the effective LP solve time per stage.

### 2.5 Global Forward Time

All ranks execute independently and in parallel with no inter-rank communication during the forward pass (`work-distribution.md` SS1.1). The global forward time equals the per-rank time:

$$
\boxed{T_{fwd} = 120 \times \tau_{LP}}
$$

### 2.6 Thread Utilization (Forward Pass)

$$
U_{fwd} = \frac{N_{active}}{N_{thr}} = \frac{3}{24} = 12.5\%
$$

Only 3 of 24 threads are active per rank during the forward pass.

## 3. Backward Pass Timing Derivation

### 3.1 Stage Loop Structure

The backward pass processes stages in reverse order from $t = T = 120$ down to $t = 2$, yielding:

$$
N_{stages}^{bwd} = T - 1 = 119 \text{ stages}
$$

These stages are processed **sequentially** because stage $t-1$ depends on the cuts generated at stage $t$ (`training-loop.md` SS6.3, `work-distribution.md` SS2.2 Step 5-6).

### 3.2 Trial Point Distribution Per Stage

At each backward stage $t$, the trial points are the visited states from all $M = 192$ forward trajectories. These are distributed across $R = 64$ ranks using static contiguous blocks (`work-distribution.md` SS2.1, SS2.2 Step 1):

$$
M_r^{bwd} = \left\lfloor \frac{M}{R} \right\rfloor = \left\lfloor \frac{192}{64} \right\rfloor = 3 \text{ trial points per rank}
$$

### 3.3 Thread Assignment Within Rank (Backward)

The 3 trial points per rank are distributed to $N_{thr} = 24$ threads via `schedule(dynamic,1)` (`work-distribution.md` SS4.3):

$$
N_{active}^{bwd} = \min(M_r^{bwd}, N_{thr}) = \min(3, 24) = 3 \text{ active threads}
$$

### 3.4 Per-Thread Work at Each Stage

Each active thread owns one trial point and evaluates **all** $N_{open} = 200$ openings **sequentially** (`work-distribution.md` SS2.2 Step 2, SS2.3). The sequential evaluation preserves warm-start across openings (same LP structure, only RHS changes).

$$
\text{LP solves per thread per stage} = N_{open} = 200
$$

### 3.5 Per-Rank Per-Stage Backward Time

All 3 trial points execute in parallel (one per active thread). The per-rank time at each backward stage is:

$$
T_{bwd}^{rank,stage} = N_{open} \times \tau_{LP} = 200 \times \tau_{LP}
$$

### 3.6 Total Backward Time

Summing across all 119 sequential stages:

$$
T_{bwd} = N_{stages}^{bwd} \times T_{bwd}^{rank,stage} = 119 \times 200 \times \tau_{LP}
$$

$$
\boxed{T_{bwd} = 23{,}800 \times \tau_{LP}}
$$

### 3.7 Thread Utilization (Backward Pass)

$$
U_{bwd} = \frac{N_{active}^{bwd}}{N_{thr}} = \frac{3}{24} = 12.5\%
$$

Identical to the forward pass: only 3 of 24 threads are active per rank.

## 4. Per-Iteration Compute Time

The per-iteration compute time is the sum of forward and backward pass times. This is **compute-only** -- synchronization overhead (MPI collectives, barriers) is excluded and will be modeled separately in ticket-014.

$$
T_{iter} = T_{fwd} + T_{bwd} = 120 \times \tau_{LP} + 23{,}800 \times \tau_{LP}
$$

$$
\boxed{T_{iter} = 23{,}920 \times \tau_{LP}}
$$

The backward pass dominates: $T_{bwd} / T_{iter} = 23{,}800 / 23{,}920 = 99.5\%$.

## 5. 50-Iteration Projection

### 5.1 Total Compute Time

$$
T_{total} = K \times T_{iter} = 50 \times 23{,}920 \times \tau_{LP} = 1{,}196{,}000 \times \tau_{LP}
$$

### 5.2 Reference Calculation at $\tau_{LP} = 2$ ms

Using the warm-start target of $\tau_{LP} = 0.002$ s:

$$
T_{iter} = 23{,}920 \times 0.002 = 47.84 \text{ seconds}
$$

$$
T_{total} = 50 \times 47.84 = 2{,}392 \text{ seconds}
$$

$$
\frac{T_{total}}{T_{budget}} = \frac{2{,}392}{7{,}200} = 33.2\%
$$

At the warm-start LP solve target of 2 ms, 50 iterations complete in 2,392 seconds -- well within the 7,200-second budget, with 4,808 seconds (66.8%) of headroom remaining for synchronization overhead, cold-start LP solves, and other costs.

## 6. Sensitivity Analysis: LP Solve Time

The total 50-iteration compute time as a function of LP solve time $\tau_{LP}$.

| $\tau_{LP}$ (ms) | $T_{iter}$ (s) | $T_{total}$ (s) | Budget fraction | Headroom (s) | Verdict           |
| ---------------: | -------------: | --------------: | --------------: | -----------: | ----------------- |
|                1 |          23.92 |           1,196 |           16.6% |        6,004 | Well under budget |
|                2 |          47.84 |           2,392 |           33.2% |        4,808 | Under budget      |
|                4 |          95.68 |           4,784 |           66.4% |        2,416 | Under budget      |
|               10 |         239.20 |          11,960 |          166.1% |       -4,760 | **OVER budget**   |
|               20 |         478.40 |          23,920 |          332.2% |      -16,720 | **OVER budget**   |

**Derivation at each point**:

- $\tau_{LP} = 1$ ms: $T_{total} = 1{,}196{,}000 \times 0.001 = 1{,}196$ s
- $\tau_{LP} = 2$ ms: $T_{total} = 1{,}196{,}000 \times 0.002 = 2{,}392$ s
- $\tau_{LP} = 4$ ms: $T_{total} = 1{,}196{,}000 \times 0.004 = 4{,}784$ s
- $\tau_{LP} = 10$ ms: $T_{total} = 1{,}196{,}000 \times 0.010 = 11{,}960$ s
- $\tau_{LP} = 20$ ms: $T_{total} = 1{,}196{,}000 \times 0.020 = 23{,}920$ s

**Critical LP solve time threshold** (where $T_{total} = T_{budget}$):

$$
\tau_{LP}^{crit} = \frac{T_{budget}}{K \times 23{,}920} = \frac{7{,}200}{1{,}196{,}000} \approx 6.02 \text{ ms}
$$

If the effective LP solve time exceeds ~6 ms, the 50-iteration budget is violated on compute alone (before synchronization overhead is added).

## 7. Effective LP Solve Time: Warm-Start Hit Rate Sensitivity

### 7.1 Effective LP Solve Time Formula

Not all LP solves achieve warm-start. The effective LP solve time depends on the warm-start hit rate $\eta_{ws}$:

$$
\tau_{LP}^{eff} = \eta_{ws} \times \tau_{ws} + (1 - \eta_{ws}) \times \tau_{cs}
$$

### 7.2 Forward Pass vs Backward Pass Warm-Start Characteristics

The warm-start hit rate differs between passes:

- **Forward pass**: Warm-start is between consecutive stages of the same trajectory ($t \to t+1$). The LP structure changes between stages (different RHS, potentially different constraint activity). The spec targets $\eta_{ws} > 70\%$ (`production-scale-reference.md` SS4.3).
- **Backward pass**: Warm-start is between consecutive openings for the **same trial point at the same stage**. The LP structure is identical (same stage, same trial point); only the RHS noise terms change. This is the ideal warm-start scenario, and the hit rate is expected to be near 100%.

For the backward pass (which constitutes 99.5% of compute), the effective LP solve time is essentially $\tau_{ws}$ since warm-start is preserved across openings (`work-distribution.md` SS2.3). The forward pass hit rate matters less due to its small contribution.

### 7.3 Blended Effective LP Solve Time

Accounting for the different warm-start characteristics of each pass:

$$
T_{iter} = T \times \tau_{LP}^{fwd} + (T-1) \times N_{open} \times \tau_{LP}^{bwd}
$$

where:

$$
\tau_{LP}^{fwd} = \eta_{ws}^{fwd} \times \tau_{ws} + (1 - \eta_{ws}^{fwd}) \times \tau_{cs}
$$

$$
\tau_{LP}^{bwd} = \eta_{ws}^{bwd} \times \tau_{ws} + (1 - \eta_{ws}^{bwd}) \times \tau_{cs}
$$

With $\eta_{ws}^{bwd} \approx 1.0$ (near-perfect warm-start for sequential openings), we have $\tau_{LP}^{bwd} \approx \tau_{ws}$.

### 7.4 Sensitivity Table: Varying Forward Pass Hit Rate

Fixed parameters: $\tau_{ws} = 2$ ms, $\tau_{cs} = 20$ ms, $\eta_{ws}^{bwd} = 1.0$ (backward pass warm-start near-perfect).

| $\eta_{ws}^{fwd}$ | $\tau_{LP}^{fwd}$ (ms) | $T_{fwd}$ (s) | $T_{bwd}$ (s) | $T_{iter}$ (s) | $T_{total}$ (s) | Budget % |
| ----------------: | ---------------------: | ------------: | ------------: | -------------: | --------------: | -------: |
|              100% |                   2.00 |          0.24 |         47.60 |          47.84 |           2,392 |    33.2% |
|               90% |                   3.80 |          0.46 |         47.60 |          48.06 |           2,403 |    33.4% |
|               80% |                   5.60 |          0.67 |         47.60 |          48.27 |           2,414 |    33.5% |
|               70% |                   7.40 |          0.89 |         47.60 |          48.49 |           2,425 |    33.7% |
|               60% |                   9.20 |          1.10 |         47.60 |          48.70 |           2,435 |    33.8% |
|               50% |                  11.00 |          1.32 |         47.60 |          48.92 |           2,446 |    34.0% |
|                0% |                  20.00 |          2.40 |         47.60 |          50.00 |           2,500 |    34.7% |

**Derivation for $\eta_{ws}^{fwd} = 70\%$** (the spec target):

- $\tau_{LP}^{fwd} = 0.70 \times 2 + 0.30 \times 20 = 1.4 + 6.0 = 7.4$ ms
- $T_{fwd} = 120 \times 0.0074 = 0.888$ s
- $T_{bwd} = 119 \times 200 \times 0.002 = 47.60$ s
- $T_{iter} = 0.888 + 47.60 = 48.488$ s
- $T_{total} = 50 \times 48.488 = 2{,}424.4$ s

**Key insight**: The forward pass warm-start hit rate has minimal impact on total time because the forward pass contributes less than 1% of compute. Even at 0% warm-start (all cold-start) in the forward pass, the total only increases by ~108 seconds (from 2,392 to 2,500 seconds).

### 7.5 Sensitivity Table: Varying Backward Pass Hit Rate

If backward pass warm-start degrades below the expected near-100%, the impact is dramatic.

Fixed parameters: $\tau_{ws} = 2$ ms, $\tau_{cs} = 20$ ms, $\eta_{ws}^{fwd} = 0.70$.

| $\eta_{ws}^{bwd}$ | $\tau_{LP}^{bwd}$ (ms) | $T_{bwd}$ (s) | $T_{iter}$ (s) | $T_{total}$ (s) | Budget % | Verdict         |
| ----------------: | ---------------------: | ------------: | -------------: | --------------: | -------: | --------------- |
|              100% |                   2.00 |         47.60 |          48.49 |           2,425 |    33.7% | Under budget    |
|               95% |                   2.90 |         69.02 |          69.91 |           3,496 |    48.6% | Under budget    |
|               90% |                   3.80 |         90.44 |          91.33 |           4,567 |    63.4% | Under budget    |
|               80% |                   5.60 |        133.28 |         134.17 |           6,709 |    93.2% | Tight           |
|               70% |                   7.40 |        176.12 |         177.01 |           8,851 |   122.9% | **OVER budget** |
|               50% |                  11.00 |        261.80 |         262.69 |          13,135 |   182.4% | **OVER budget** |

**Derivation for $\eta_{ws}^{bwd} = 90\%$**:

- $\tau_{LP}^{bwd} = 0.90 \times 2 + 0.10 \times 20 = 1.8 + 2.0 = 3.8$ ms
- $T_{bwd} = 23{,}800 \times 0.0038 = 90.44$ s
- $T_{iter} = 0.888 + 90.44 = 91.33$ s
- $T_{total} = 50 \times 91.33 = 4{,}566.5$ s

**Critical finding**: Backward pass warm-start hit rate is the single most important performance parameter. A drop from 100% to 80% nearly triples the compute time. The sequential-opening design (`work-distribution.md` SS2.3) is specifically engineered to maintain near-100% backward warm-start, and this analysis confirms why that design choice is critical.

## 8. Thread Utilization Analysis

### 8.1 The 64-Rank Utilization Problem

At the production deployment of $R = 64$ ranks with $N_{thr} = 24$ threads per rank:

| Pass                 | Items to distribute | Items per rank | Active threads | Idle threads | Utilization |
| -------------------- | ------------------: | -------------: | -------------: | -----------: | ----------: |
| Forward              |    192 trajectories |              3 |              3 |           21 |       12.5% |
| Backward (per stage) |    192 trial points |              3 |              3 |           21 |       12.5% |

Total hardware threads: $R \times N_{thr} = 64 \times 24 = 1{,}536$.
Active threads: $R \times 3 = 64 \times 3 = 192$ (in both passes).
Global utilization: $192 / 1{,}536 = 12.5\%$.

### 8.2 Root Cause

The low utilization is a direct consequence of the rank count ($R = 64$) being large relative to the pass count ($M = 192$):

$$
\frac{M}{R} = \frac{192}{64} = 3 \ll N_{thr} = 24
$$

The work quantum (trajectory or trial point) is indivisible -- a thread must own an entire trajectory or trial point to preserve warm-start. When $M/R < N_{thr}$, threads go idle.

### 8.3 Alternative Deployment Scenarios

The following table shows how different rank/thread configurations affect utilization while keeping the total core count constant at approximately 1,536.

| Config | $R$ | $N_{thr}$ | Total cores | Items/rank | Active threads/rank | Utilization | $T_{iter}$ at 2 ms |
| ------ | --: | --------: | ----------: | ---------: | ------------------: | ----------: | -----------------: |
| A      |  64 |        24 |       1,536 |          3 |                   3 |       12.5% |            47.84 s |
| B      |  32 |        48 |       1,536 |          6 |                   6 |       12.5% |            47.84 s |
| C      |  16 |        24 |         384 |         12 |                  12 |       50.0% |            47.84 s |
| D      |  16 |        12 |         192 |         12 |                  12 |  **100.0%** |            47.84 s |
| E      |   8 |        24 |         192 |         24 |                  24 |  **100.0%** |            47.84 s |
| F      |   4 |        24 |          96 |         48 |                  24 |  **100.0%** |            95.68 s |

**Derivation for Config D** ($R = 16$, $N_{thr} = 12$):

- Items per rank: $192 / 16 = 12$
- Active threads per rank: $\min(12, 12) = 12$
- Utilization: $12 / 12 = 100\%$
- Forward: $120 \times 0.002 = 0.24$ s (all 12 trajectories run in parallel on 12 threads)
- Backward per stage: $200 \times 0.002 = 0.40$ s (all 12 trial points run in parallel on 12 threads)
- $T_{iter} = 0.24 + 119 \times 0.40 = 0.24 + 47.60 = 47.84$ s

**Derivation for Config E** ($R = 8$, $N_{thr} = 24$):

- Items per rank: $192 / 8 = 24$
- Active threads per rank: $\min(24, 24) = 24$
- Utilization: $24 / 24 = 100\%$
- Forward: $120 \times 0.002 = 0.24$ s (24 trajectories on 24 threads, 1 batch)
- Backward per stage: $200 \times 0.002 = 0.40$ s (24 trial points on 24 threads, 1 batch)
- $T_{iter} = 0.24 + 119 \times 0.40 = 47.84$ s

### 8.4 Key Observation

The per-iteration compute time $T_{iter}$ is **independent of rank count** (given sufficient total threads to cover $M$ items), because:

1. The forward pass critical path is $T \times \tau_{LP}$ per trajectory, and all trajectories run in parallel.
2. The backward pass critical path is $N_{open} \times \tau_{LP}$ per trial point per stage, and all trial points at a stage run in parallel.
3. Adding more ranks beyond what is needed to parallelize $M$ items does not reduce the critical path -- it only reduces utilization.

The optimal rank count is:

$$
R^* = \left\lceil \frac{M}{N_{thr}} \right\rceil = \left\lceil \frac{192}{24} \right\rceil = 8 \text{ ranks}
$$

At $R = 8$ ranks with 24 threads each, all threads are active (100% utilization) and $T_{iter}$ is the same as at 64 ranks. However, the 64-rank configuration provides advantages that may justify the lower utilization:

- **Reduced per-rank memory pressure**: Each rank holds fewer solver workspaces (3 active vs 24).
- **MPI synchronization benefits**: More ranks can reduce `MPI_Allgatherv` latency on fat-tree topologies.
- **Future scaling**: If $M$ increases (e.g., 1,536 trajectories), 64 ranks would achieve $1{,}536 / 64 = 24$ items per rank, reaching 100% utilization.

The utilization vs. deployment trade-off is an operational decision. This analysis provides the compute-time model; ticket-014 will model the synchronization overhead that differentiates the configurations.

## 9. Assumptions Register

Every assumption used in this model, with source and confidence level.

| #   | Assumption                                          | Value      | Source                                                                              | Confidence                                                                       |
| --- | --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A1  | Stages in planning horizon                          | 120        | `production-scale-reference.md` SS1                                                 | **High** (spec)                                                                  |
| A2  | Forward passes per iteration                        | 192        | `production-scale-reference.md` SS1                                                 | **High** (spec)                                                                  |
| A3  | Openings per trial point                            | 200        | `production-scale-reference.md` SS1                                                 | **High** (spec)                                                                  |
| A4  | SDDP iterations                                     | 50         | `production-scale-reference.md` SS1                                                 | **High** (spec)                                                                  |
| A5  | MPI ranks (production)                              | 64         | `production-scale-reference.md` SS4.2                                               | **High** (spec)                                                                  |
| A6  | Threads per rank                                    | 24         | `production-scale-reference.md` SS4.2                                               | **High** (spec)                                                                  |
| A7  | LP solve time (warm-start target)                   | 2 ms       | `production-scale-reference.md` SS4.3                                               | **Medium** (aspirational target)                                                 |
| A8  | LP solve time (cold-start target)                   | 20 ms      | `production-scale-reference.md` SS4.3                                               | **Medium** (aspirational target)                                                 |
| A9  | Forward pass warm-start hit rate                    | 70%        | `production-scale-reference.md` SS4.3                                               | **Medium** (aspirational target)                                                 |
| A10 | Backward pass warm-start hit rate                   | ~100%      | `work-distribution.md` SS2.3 (sequential openings, same LP, RHS-only changes)       | **High** (by design)                                                             |
| A11 | One LP solve per stage per trajectory (forward)     | 1          | `production-scale-reference.md` SS3 (blocks are within the LP, not separate solves) | **High** (spec)                                                                  |
| A12 | One LP solve per opening per trial point (backward) | 1          | `training-loop.md` SS6.2 Step 2                                                     | **High** (spec)                                                                  |
| A13 | Backward stages = $T - 1$                           | 119        | `training-loop.md` SS6.1 ($t = T$ down to 2)                                        | **High** (spec)                                                                  |
| A14 | Openings evaluated sequentially per thread          | Sequential | `work-distribution.md` SS2.3                                                        | **High** (spec, deliberate design)                                               |
| A15 | Forward pass distribution is static contiguous      | Static     | `work-distribution.md` SS1.1                                                        | **High** (spec)                                                                  |
| A16 | Thread scheduling is `schedule(dynamic,1)`          | Dynamic,1  | `work-distribution.md` SS1.2, SS4.3                                                 | **High** (spec)                                                                  |
| A17 | No inter-rank communication during forward pass     | None       | `work-distribution.md` SS1.1                                                        | **High** (spec)                                                                  |
| A18 | LP solve time is uniform across stages              | Assumed    | No spec evidence of stage-varying LP cost                                           | **Medium** (LP structure is same per stage, but cut count grows with iterations) |
| A19 | LP solve time is uniform across trial points        | Assumed    | `work-distribution.md` SS4.2 notes small variance (~5-15%)                          | **Medium** (load balancing absorbs variance)                                     |
| A20 | Synchronization overhead excluded                   | Excluded   | Ticket-014 scope                                                                    | **High** (by design of this ticket)                                              |
| A21 | Wall-clock budget for 50 iterations                 | 7,200 s    | Operational requirement (2 hours)                                                   | **High** (operational)                                                           |
| A22 | Trial points per stage = M (no deduplication)       | 192        | `training-loop.md` SS5.2 (deduplication is deferred)                                | **High** (spec)                                                                  |

### Confidence Levels

- **High**: Value taken directly from an approved specification section.
- **Medium**: Value is an aspirational target from the spec or a reasonable engineering estimate. Needs validation with actual solver benchmarks.
- **Low**: Speculative or needs significant validation.

## 10. Summary of Key Results

| Metric                                     | Value    | Formula                     |
| ------------------------------------------ | -------- | --------------------------- |
| Forward pass LP solves per rank            | 120      | $T$                         |
| Backward pass LP solves per rank per stage | 200      | $N_{open}$                  |
| Total LP solves per iteration (per rank)   | 23,920   | $T + (T-1) \times N_{open}$ |
| Per-iteration compute (at 2 ms)            | 47.84 s  | $23{,}920 \times 0.002$     |
| 50-iteration compute (at 2 ms)             | 2,392 s  | $50 \times 47.84$           |
| Budget fraction (at 2 ms)                  | 33.2%    | $2{,}392 / 7{,}200$         |
| Critical LP solve time                     | ~6.02 ms | $7{,}200 / 1{,}196{,}000$   |
| Thread utilization (64 ranks)              | 12.5%    | $3 / 24$                    |
| Optimal rank count (for 100% utilization)  | 8        | $\lceil 192 / 24 \rceil$    |
| Backward pass share of compute             | 99.5%    | $23{,}800 / 23{,}920$       |

---

## 11. Synchronization and Communication Overhead Model

This section extends the compute-only model (SS1--SS10) with MPI synchronization overhead: trial point gathering, per-stage cut exchange, convergence reduction, and load imbalance barrier time. All derivations use $R = 64$ ranks and recompute from first principles at the production state dimensions $D_{\text{state}} = 1{,}120$ (typical, AR(6)) and $D_{\text{state}} = 2{,}080$ (worst-case, AR(12)).

### 11.1 Additional Parameters

| Parameter                      | Symbol         | Value               | Source                                         |
| ------------------------------ | -------------- | ------------------- | ---------------------------------------------- |
| State dimension (typical)      | $D$            | 1,120               | `production-scale-reference.md` SS2.1 (AR(6))  |
| State dimension (worst-case)   | $D_{max}$      | 2,080               | `production-scale-reference.md` SS2.1 (AR(12)) |
| InfiniBand HDR bandwidth       | $B_{IB}$       | 200 Gb/s (25 GB/s)  | `production-scale-reference.md` SS4.1          |
| Protocol overhead (InfiniBand) | $\gamma_{IB}$  | 50%                 | `communication-patterns.md` SS3.2              |
| Protocol overhead (Ethernet)   | $\gamma_{Eth}$ | 100%                | `communication-patterns.md` SS3.2              |
| MPI base latency (InfiniBand)  | $\alpha_{MPI}$ | 2 us                | Conservative estimate for IB HCA               |
| LP solve time std dev          | $\sigma_{LP}$  | ~15% of $\tau_{LP}$ | `work-distribution.md` SS4.1 (~5-15%)          |
| Load imbalance factor          | $\delta_{imb}$ | ~2%                 | Derived (SS11.5)                               |

### 11.2 Payload Size Derivation

#### Trial Point Payload

From `communication-patterns.md` SS2.1, each trial point carries:

| Component       | Type    | Size at $D = 1{,}120$              | Size at $D = 2{,}080$               |
| --------------- | ------- | ---------------------------------- | ----------------------------------- |
| State vector    | `[f64]` | $1{,}120 \times 8 = 8{,}960$ bytes | $2{,}080 \times 8 = 16{,}640$ bytes |
| Stage index     | `u32`   | 4 bytes                            | 4 bytes                             |
| **Total/point** |         | **8,964 bytes**                    | **16,644 bytes**                    |

#### Cut Payload

From `cut-management-impl.md` SS4.2, each cut carries:

| Field              | Type    | Size at $D = 1{,}120$              | Size at $D = 2{,}080$               |
| ------------------ | ------- | ---------------------------------- | ----------------------------------- |
| Slot index         | `u32`   | 4 bytes                            | 4 bytes                             |
| Iteration          | `u32`   | 4 bytes                            | 4 bytes                             |
| Forward pass index | `u32`   | 4 bytes                            | 4 bytes                             |
| Intercept          | `f64`   | 8 bytes                            | 8 bytes                             |
| Coefficients       | `[f64]` | $1{,}120 \times 8 = 8{,}960$ bytes | $2{,}080 \times 8 = 16{,}640$ bytes |
| **Total/cut**      |         | **8,980 bytes**                    | **16,660 bytes**                    |

#### Convergence Statistics Payload

From `communication-patterns.md` SS2.3: 4 scalars of `f64` = 32 bytes total. Negligible.

### 11.3 Communication Volume Table

All volumes computed for $R = 64$ ranks, $M = 192$ forward passes, $T = 120$ stages.

**Trial point `MPI_Allgatherv`** (once per iteration, all 120 stages' visited states):

$$
V_{trial} = M \times T \times S_{trial}
$$

| Dimension     | Per stage                                             | Per iteration (120 stages)   |
| ------------- | ----------------------------------------------------- | ---------------------------- |
| $D = 1{,}120$ | $192 \times 8{,}964 = 1{,}721{,}088$ bytes (1.72 MB)  | $1.72 \times 120 = 206.5$ MB |
| $D = 2{,}080$ | $192 \times 16{,}644 = 3{,}195{,}648$ bytes (3.20 MB) | $3.20 \times 120 = 383.6$ MB |

**Verification** (acceptance criterion): At $D = 1{,}120$, the trial point volume per iteration is 206.5 MB -- confirming the `communication-patterns.md` SS2.1 calculation of "~206 MB".

**Cut `MPI_Allgatherv`** (119 times per iteration, once per backward stage):

$$
V_{cut}^{stage} = M \times S_{cut}
$$

$$
V_{cut}^{iter} = (T - 1) \times V_{cut}^{stage}
$$

| Dimension     | Per stage                                             | Per iteration (119 stages)   |
| ------------- | ----------------------------------------------------- | ---------------------------- |
| $D = 1{,}120$ | $192 \times 8{,}980 = 1{,}724{,}160$ bytes (1.72 MB)  | $1.72 \times 119 = 205.2$ MB |
| $D = 2{,}080$ | $192 \times 16{,}660 = 3{,}198{,}720$ bytes (3.20 MB) | $3.20 \times 119 = 380.5$ MB |

**Verification** (acceptance criterion): At $D = 1{,}120$, per-stage cut payload is $192 \times 8{,}980 = 1{,}724{,}160$ bytes (1.72 MB) and per-iteration is $1.72 \times 119 = 205.2$ MB. This confirms the acceptance target of "~205 MB".

**Convergence `MPI_Allreduce`** (once per iteration): 32 bytes.

**Total communication volume per iteration**:

| Dimension     | Trial points |     Cuts | Convergence |    **Total** |
| ------------- | -----------: | -------: | ----------: | -----------: |
| $D = 1{,}120$ |     206.5 MB | 205.2 MB |    32 bytes | **411.7 MB** |
| $D = 2{,}080$ |     383.6 MB | 380.5 MB |    32 bytes | **764.1 MB** |

**Note**: The `communication-patterns.md` SS3.1 volume of "~587 MB" was computed at $R = 16$, $D = 2{,}080$. The volume is independent of rank count for `Allgatherv` (all ranks receive the same total data), so the difference is entirely due to state dimension: at $D = 2{,}080$ our model gives 764.1 MB versus the spec's 587 MB. The discrepancy arises because the spec's trial point volume (206 MB at $D = 1{,}120$) was combined with the cut volume at $D = 2{,}080$ (381 MB), producing a mixed-dimension total. Our model separates the two dimensions cleanly.

### 11.4 Per-Stage Cut Exchange Latency Derivation

The `MPI_Allgatherv` latency consists of three components:

$$
T_{cut}^{stage} = T_{wire} + T_{protocol} + T_{latency}
$$

#### Wire Time

The wire time is the time to transmit the payload at the network's raw bandwidth:

$$
T_{wire} = \frac{V_{cut}^{stage}}{B_{IB}}
$$

| Dimension     | Payload (bytes) | Wire time                                    |
| ------------- | --------------: | -------------------------------------------- |
| $D = 1{,}120$ |       1,724,160 | $1{,}724{,}160 / 25 \times 10^9 = 0.0690$ ms |
| $D = 2{,}080$ |       3,198,720 | $3{,}198{,}720 / 25 \times 10^9 = 0.1279$ ms |

#### Protocol Overhead

On InfiniBand HDR, protocol overhead (RDMA verbs, completion queue processing, memory registration) adds approximately 50% to the wire time (`communication-patterns.md` SS3.2):

$$
T_{protocol} = \gamma_{IB} \times T_{wire} = 0.5 \times T_{wire}
$$

| Dimension     | Protocol overhead |
| ------------- | ----------------: |
| $D = 1{,}120$ |         0.0345 ms |
| $D = 2{,}080$ |         0.0640 ms |

#### MPI Latency (Ring Model)

For `MPI_Allgatherv` with $R = 64$ ranks, the ring algorithm requires $(R - 1)$ communication steps, each incurring a base latency $\alpha_{MPI}$:

$$
T_{latency} = (R - 1) \times \alpha_{MPI} = 63 \times 2 \text{ us} = 126 \text{ us} = 0.126 \text{ ms}
$$

This latency is constant regardless of state dimension -- it depends only on the rank count and interconnect latency.

#### Total Per-Stage Cut Exchange

$$
T_{cut}^{stage} = T_{wire} \times (1 + \gamma_{IB}) + T_{latency}
$$

| Dimension     | Wire + protocol | MPI latency | **Total per stage** |
| ------------- | --------------: | ----------: | ------------------: |
| $D = 1{,}120$ |        0.104 ms |    0.126 ms |        **0.230 ms** |
| $D = 2{,}080$ |        0.192 ms |    0.126 ms |        **0.318 ms** |

**Verification** (acceptance criterion): Both values are well under 0.5 ms per stage, confirming the `production-scale-reference.md` SS4.3 KPI of "Cut exchange < 5 ms per stage" by a factor of 15--22x.

#### Total Cut Exchange Per Iteration

$$
T_{cut}^{iter} = (T - 1) \times T_{cut}^{stage}
$$

| Dimension     | 119 stages total |
| ------------- | ---------------: |
| $D = 1{,}120$ |         27.37 ms |
| $D = 2{,}080$ |         37.84 ms |

### 11.5 Trial Point Gathering Latency

The trial point `MPI_Allgatherv` transmits all 120 stages' worth of visited states in a single collective call (once per iteration).

$$
T_{trial} = \frac{V_{trial}}{B_{IB}} \times (1 + \gamma_{IB}) + T_{latency}
$$

| Dimension     | Wire time | + Protocol (x1.5) | + MPI latency |    **Total** |
| ------------- | --------: | ----------------: | ------------: | -----------: |
| $D = 1{,}120$ |   8.26 ms |          12.39 ms |      0.126 ms | **12.51 ms** |
| $D = 2{,}080$ |  15.34 ms |          23.02 ms |      0.126 ms | **23.14 ms** |

**Derivation for $D = 1{,}120$**:

- $V_{trial} = 206{,}530{,}560$ bytes
- $T_{wire} = 206{,}530{,}560 / (25 \times 10^9) = 8.261$ ms
- $T_{wire} \times 1.5 = 12.392$ ms
- $T_{trial} = 12.392 + 0.126 = 12.518$ ms

### 11.6 Convergence Reduction Latency

The `MPI_Allreduce` for convergence statistics uses a recursive-halving/doubling algorithm:

$$
T_{conv} = \log_2(R) \times \alpha_{MPI} + \frac{32}{B_{IB}} \times \log_2(R)
$$

$$
T_{conv} = \log_2(64) \times 2 \text{ us} = 6 \times 2 \text{ us} = 12 \text{ us} = 0.012 \text{ ms}
$$

The 32-byte wire time is negligible ($32 / (25 \times 10^9) = 1.28$ ns per step). The convergence reduction is entirely latency-dominated.

### 11.7 Load Imbalance Barrier Overhead

At each backward stage, the `MPI_Allgatherv` for cut exchange acts as an implicit barrier (`work-distribution.md` SS2.2 Step 6). No rank can proceed to stage $t - 1$ until every rank has completed its trial point evaluations and contributed cuts for stage $t$. The barrier overhead is the time the fastest rank waits for the slowest.

#### Statistical Model

Each rank processes 3 trial points in parallel on 3 threads, each thread evaluating 200 openings sequentially. The per-thread compute time at a single backward stage is:

$$
T_{thread}^{stage} = N_{open} \times \tau_{LP} = 200 \times 2 \text{ ms} = 400 \text{ ms}
$$

The variance of the per-thread time comes from LP solve time variance across the 200 openings. With $\sigma_{LP} \approx 0.15 \times \tau_{LP} = 0.3$ ms (`work-distribution.md` SS4.1):

$$
\sigma_{thread}^{stage} = \sigma_{LP} \times \sqrt{N_{open}} = 0.3 \times \sqrt{200} = 0.3 \times 14.14 = 4.24 \text{ ms}
$$

The per-rank time is the maximum of 3 independent threads. Using the expected maximum of $n$ i.i.d. normal random variables ($E[\max_n] \approx \mu + \sigma \times a_n$ where $a_3 \approx 1.09$):

$$
E[T_{rank}^{stage}] \approx 400 + 4.24 \times 1.09 = 404.6 \text{ ms}
$$

$$
\sigma_{rank}^{stage} \approx \frac{4.24}{1 + 0.8 \times \ln(3)} \approx 2.2 \text{ ms}
$$

The barrier waits for the slowest of $R = 64$ ranks. Using $a_{64} \approx 2.83$:

$$
E[\max_{64} T_{rank}^{stage}] \approx 404.6 + 2.2 \times 2.83 = 404.6 + 6.2 = 410.8 \text{ ms}
$$

The barrier overhead is:

$$
T_{barrier}^{stage} = E[\max_{64}] - E[T_{rank}^{stage}] \approx 410.8 - 404.6 = 6.2 \text{ ms}
$$

This is approximately $6.2 / 400 = 1.6\%$ of the per-stage backward compute time.

#### Simplified Estimate

For the remainder of this analysis, we model the barrier overhead conservatively as 2% of per-stage backward compute time:

$$
T_{barrier}^{stage} = \delta_{imb} \times T_{bwd}^{rank,stage} = 0.02 \times 400 = 8 \text{ ms}
$$

$$
T_{barrier}^{iter} = (T - 1) \times T_{barrier}^{stage} = 119 \times 8 = 952 \text{ ms}
$$

### 11.8 Complete Iteration Time Formula

Combining compute (SS4) and synchronization overhead:

$$
T_{iter}^{full} = \underbrace{T_{fwd} + T_{bwd}}_{\text{compute}} + \underbrace{T_{trial} + T_{cut}^{iter} + T_{conv}}_{\text{communication}} + \underbrace{T_{barrier}^{iter}}_{\text{load imbalance}}
$$

Substituting the reference values at $\tau_{LP} = 2$ ms:

| Component               | Symbol               | $D = 1{,}120$ | $D = 2{,}080$ | Fraction ($D = 1{,}120$) |
| ----------------------- | -------------------- | ------------: | ------------: | -----------------------: |
| Forward compute         | $T_{fwd}$            |       0.240 s |       0.240 s |                    0.49% |
| Backward compute        | $T_{bwd}$            |      47.600 s |      47.600 s |                   97.48% |
| Trial point gathering   | $T_{trial}$          |       0.013 s |       0.023 s |                    0.03% |
| Cut exchange (119x)     | $T_{cut}^{iter}$     |       0.027 s |       0.038 s |                    0.06% |
| Convergence reduction   | $T_{conv}$           |      ~0.000 s |      ~0.000 s |                   ~0.00% |
| Barrier overhead (119x) | $T_{barrier}^{iter}$ |       0.952 s |       0.952 s |                    1.95% |
| **Total per iteration** | $T_{iter}^{full}$    |  **48.832 s** |  **48.853 s** |               **100.0%** |

**Derivation for $D = 1{,}120$**:

$$
T_{iter}^{full} = 0.240 + 47.600 + 0.013 + 0.027 + 0.000 + 0.952 = 48.832 \text{ s}
$$

### 11.9 Synchronization Overhead Summary

$$
T_{sync} = T_{trial} + T_{cut}^{iter} + T_{conv} + T_{barrier}^{iter}
$$

| Overhead type          | $D = 1{,}120$ | $D = 2{,}080$ |
| ---------------------- | ------------: | ------------: |
| Pure communication     |         40 ms |         61 ms |
| Load imbalance barrier |        952 ms |        952 ms |
| **Total sync**         |    **992 ms** |  **1,013 ms** |

$$
\text{Sync fraction} = \frac{T_{sync}}{T_{iter}^{full}} = \frac{0.992}{48.832} = 2.03\% \quad (D = 1{,}120)
$$

$$
\text{Communication-only fraction} = \frac{T_{trial} + T_{cut}^{iter} + T_{conv}}{T_{iter}^{full}} = \frac{0.040}{48.832} = 0.08\% \quad (D = 1{,}120)
$$

### 11.10 50-Iteration Wall-Clock Estimate

$$
T_{total}^{full} = K \times T_{iter}^{full}
$$

| Dimension     | $T_{iter}^{full}$ | $T_{total}^{full}$ (50 iter) | Budget fraction |  Headroom |
| ------------- | ----------------: | ---------------------------: | --------------: | --------: |
| $D = 1{,}120$ |           48.83 s |                    2,441.6 s |           33.9% | 4,758.4 s |
| $D = 2{,}080$ |           48.85 s |                    2,442.7 s |           33.9% | 4,757.3 s |

**Verification** (acceptance criterion): At $\tau_{LP} = 2$ ms with $D = 1{,}120$, the complete per-iteration time is 48.83 s. Over 50 iterations: $50 \times 48.83 = 2{,}441.6$ s, well under the 7,200 s budget.

The synchronization overhead adds only $\sim$50 seconds to the 50-iteration total (from 2,392 s compute-only to 2,442 s with sync), consuming approximately 1 percentage point of the budget headroom.

### 11.11 Consistency Check: Existing Spec Claims vs Model

| #   | Spec Claim                                                 | Source                                | Model Prediction                                                                                                           | Verdict                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Communication fraction "< 1%" on InfiniBand                | `communication-patterns.md` SS3.2     | Pure communication (data transfer) = 0.08% of iteration time at $D = 1{,}120$ on IB. Even at $D = 2{,}080$: 0.13%.         | **CONFIRMED** -- pure data transfer is far under 1%.                                                                                                                                                                                                                                                      |
| C2  | "Cut exchange < 5 ms per stage"                            | `production-scale-reference.md` SS4.3 | Per-stage cut exchange = 0.230 ms at $D = 1{,}120$; 0.318 ms at $D = 2{,}080$. Both are under 5 ms by a factor of 15--22x. | **CONFIRMED** -- the 5 ms KPI is very conservative.                                                                                                                                                                                                                                                       |
| C3  | "Communication < 2% of iteration time" at production scale | `production-scale-reference.md` SS4.4 | Pure communication = 0.08% (confirmed). Including load imbalance barriers: 2.03%.                                          | **CONFIRMED with caveat** -- the claim holds for pure communication. If load imbalance barriers are counted as "communication" (since they occur at MPI synchronization points), the total is 2.03%, marginally above 2%. The claim should clarify whether it includes barrier overhead. See notes below. |

**Notes on C3**: The 2.03% figure at $D = 1{,}120$ includes 1.95% from load imbalance waiting at per-stage barriers and only 0.08% from actual data transfer. The `production-scale-reference.md` SS4.4 claim of "< 2% of iteration time" cites `communication-patterns.md` SS3.2, which computes pure data transfer time -- not barrier overhead. Under this interpretation, the claim is solidly confirmed (0.08% << 2%). However, ticket-015 should consider whether the claim should be expanded to "Communication and synchronization overhead < 3% of iteration time" for full transparency. The barrier overhead is a consequence of the MPI synchronization architecture, even though it is not wire time.

### 11.12 Time Budget Breakdown

Percentage of per-iteration wall-clock time allocated to each component (at $\tau_{LP} = 2$ ms, $D = 1{,}120$, $R = 64$, InfiniBand HDR).

| Component                     |  Time (ms) |    Fraction | Category        |
| ----------------------------- | ---------: | ----------: | --------------- |
| Forward pass compute          |        240 |       0.49% | Compute         |
| Backward pass compute         |     47,600 |      97.48% | Compute         |
| Trial point `Allgatherv`      |         13 |       0.03% | Communication   |
| Cut exchange (119 stages)     |         27 |       0.06% | Communication   |
| Convergence `Allreduce`       |       ~0.0 |      ~0.00% | Communication   |
| Barrier overhead (119 stages) |        952 |       1.95% | Synchronization |
| **Total**                     | **48,832** | **100.00%** |                 |

The backward pass compute dominates at 97.5%. All communication combined (data transfer) is 0.08%. The load imbalance barrier is 1.95%. The forward pass compute is 0.49%.

### 11.13 Ethernet Comparison

For deployments on 100 Gbps Ethernet instead of InfiniBand HDR:

| Parameter         | InfiniBand HDR | 100 Gbps Ethernet |
| ----------------- | -------------: | ----------------: |
| Bandwidth         |        25 GB/s |         12.5 GB/s |
| Protocol overhead |            50% |              100% |
| Base MPI latency  |           2 us |              5 us |

Per-stage cut exchange at $D = 1{,}120$:

$$
T_{cut,Eth}^{stage} = \frac{1{,}724{,}160}{12.5 \times 10^9} \times 2.0 + 63 \times 5 \text{ us} = 0.276 + 0.315 = 0.591 \text{ ms}
$$

Trial point gathering at $D = 1{,}120$:

$$
T_{trial,Eth} = \frac{206{,}530{,}560}{12.5 \times 10^9} \times 2.0 + 0.315 = 33.045 + 0.315 = 33.360 \text{ ms}
$$

Total communication (Ethernet):

$$
T_{comm,Eth} = 33.36 + 119 \times 0.591 + 0.030 = 33.36 + 70.33 + 0.03 = 103.72 \text{ ms}
$$

Communication fraction on Ethernet: $103.72 / (48{,}832 + 63.72) = 103.72 / 48{,}896 = 0.21\%$ -- still well under 2%. The barrier overhead (952 ms) dominates synchronization regardless of network technology.

### 11.14 Assumptions Register (Synchronization)

| #   | Assumption                                     | Value   | Source                                                          | Confidence |
| --- | ---------------------------------------------- | ------- | --------------------------------------------------------------- | ---------- |
| A23 | State dimension (typical)                      | 1,120   | `production-scale-reference.md` SS2.1 (AR(6) case)              | **High**   |
| A24 | State dimension (worst-case)                   | 2,080   | `production-scale-reference.md` SS2.1 (AR(12) case)             | **High**   |
| A25 | InfiniBand HDR bandwidth                       | 25 GB/s | `production-scale-reference.md` SS4.1                           | **High**   |
| A26 | IB protocol overhead factor                    | 50%     | `communication-patterns.md` SS3.2                               | **Medium** |
| A27 | MPI base latency on IB                         | 2 us    | Conservative estimate for modern IB HCA (typical: 1-2 us)       | **Medium** |
| A28 | Allgatherv uses ring algorithm                 | Ring    | Standard MPI implementation for medium messages                 | **Medium** |
| A29 | Allreduce uses recursive halving               | Log(R)  | Standard MPI for small payloads                                 | **Medium** |
| A30 | LP solve time std dev is 15% of mean           | 15%     | `work-distribution.md` SS4.1 (upper end of 5-15% range)         | **Medium** |
| A31 | Load imbalance modeled as 2% of backward stage | 2%      | Derived from statistical model (SS11.7), rounded conservatively | **Medium** |
| A32 | Trial point gathering is a single Allgatherv   | 1 call  | `communication-patterns.md` SS1.1, `training-loop.md` SS5.2     | **High**   |

## 12. Complete Timing Model Summary

Combining SS1--SS11, the complete per-iteration wall-clock time at production scale ($\tau_{LP} = 2$ ms, $R = 64$, $D = 1{,}120$, InfiniBand HDR):

$$
\boxed{T_{iter}^{full} = 48.83 \text{ s}}
$$

$$
\boxed{T_{total}^{full} = 50 \times 48.83 = 2{,}441.6 \text{ s} \quad (33.9\% \text{ of } 7{,}200 \text{ s budget})}
$$

| Metric                                    | Compute-only (SS10) | With sync (SS12) |    Delta |
| ----------------------------------------- | ------------------: | ---------------: | -------: |
| Per-iteration time                        |             47.84 s |          48.83 s |  +0.99 s |
| 50-iteration total                        |           2,392.0 s |        2,441.6 s |  +49.6 s |
| Budget fraction                           |               33.2% |            33.9% |    +0.7% |
| Headroom                                  |           4,808.0 s |        4,758.4 s |  -49.6 s |
| Critical LP solve time (budget = 7,200 s) |            ~6.02 ms |         ~5.90 ms | -0.12 ms |

The synchronization overhead is a small perturbation on the compute-dominated model: adding 0.99 seconds (2.0%) to each iteration and consuming less than 1 percentage point of budget headroom over 50 iterations.
