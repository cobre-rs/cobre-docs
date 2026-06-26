---
title: Cut Management
description: Complete Benders cut lifecycle — cut definition, reduced-cost extraction, single-cut aggregation, validity conditions, cut pool growth, periodic-pruning strategies, and Dynamic Cut Selection (DCS).
---

## Purpose

This spec defines the complete Benders cut lifecycle in Cobre: what cuts represent mathematically, how cut coefficients relate to LP dual variables, how per-scenario cuts are aggregated into a single cut, under what conditions cuts are valid, and what selection strategies are available to control cut pool growth.

## 1. Cut Definition

A **Benders cut** at stage $t-1$ is a linear inequality that provides a lower bound on the cost-to-go function $V_t(x)$:

$$
\theta \geq \alpha + \sum_{h \in \mathcal{H}} \pi^v_h \cdot v_h + \sum_{h \in \mathcal{H}} \sum_{\ell=1}^{P_h} \pi^{lag}_{h,\ell} \cdot a_{h,\ell}
$$

where:

- $\theta$ is the future cost variable in the stage $t-1$ LP
- $\alpha$ is the cut intercept
- $\pi^v_h$ is the storage coefficient for hydro $h$ (marginal value of water)
- $\pi^{lag}_{h,\ell}$ is the AR lag coefficient for hydro $h$, lag $\ell$ (marginal value of inflow history)
- $v_h$, $a_{h,\ell}$ are the state variables (see [LP Formulation](/math/lp-formulation))

The cut coefficients are dense — every state variable (all storage volumes and all AR lags) has a non-zero coefficient in every cut. This density is a consequence of the full-state column-bound pinning used for reduced-cost extraction (§2).

Cobre adds cuts monotonically across iterations: an active cut is never removed from the lower-bound LP within a training run. Because the cut set only grows, the lower-bound estimate is non-decreasing across iterations of a training run. This is a methodology-level guarantee — the outer approximation of the value function can only become tighter iteration by iteration.

## 2. Reduced-Cost Extraction

After solving the stage $t$ subproblem for trial state $\hat{x}_{t-1}$ and scenario $\omega_t$, the cut coefficients are derived from the LP **reduced costs** of the pinned incoming-state columns — the columns whose lower and upper bounds were set equal to the incoming state value (see [LP Formulation §4a](/math/lp-formulation)).

Both storage and inflow lags use the same pattern: an incoming-state LP variable is pinned to the trial value by equal column bounds, and the reduced cost of that column gives the cut coefficient directly:

| Pinned column                  | Reduced cost             | Cut coefficient                                                    | Units     |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------ | --------- |
| Incoming storage (hydro $h$)   | $\bar{c}^{in}_h$         | $\pi^v_{t,h} = \bar{c}^{in}_h / d^{col}_h$                         | \$/hm³    |
| AR lag (hydro $h$, lag $\ell$) | $\bar{c}^{lag}_{h,\ell}$ | $\pi^{lag}_{t,h,\ell} = \bar{c}^{lag}_{h,\ell} / d^{col}_{h,\ell}$ | \$/(m³/s) |

where $d^{col}$ is the per-column prescaler factor that unscales the reduced cost; a further factor $K$ converts to original cost units at the reporting boundary (see [LP Formulation §12](/math/lp-formulation)). When anticipated thermals are present, each anticipated-state slot column contributes one coefficient by the same rule.

The cut intercept ensures the cut passes through the trial point:

$$
\alpha_t = Q_t(\hat{x}_{t-1}, \omega_t) - \sum_{h \in \mathcal{H}} \pi^v_{t,h} \cdot \hat{v}_h - \sum_{h \in \mathcal{H}} \sum_{\ell=1}^{P_h} \pi^{lag}_{t,h,\ell} \cdot \hat{a}_{h,\ell}
$$

where $Q_t(\hat{x}_{t-1}, \omega_t)$ is the optimal objective value of the stage $t$ subproblem.

**Sign convention**: By the LP envelope theorem, $\partial Q_t / \partial \hat{x}_j = \pi_j$, the sensitivity of the optimal value to the pinned incoming state. For a column pinned at $\underline{x}_j = \bar{x}_j = \hat{x}_j$, that sensitivity is exactly the column's reduced cost — equal, by KKT parity, to the multiplier the former equality row $x^{in}_j = \hat{x}_j$ would have carried — so the cut coefficient is taken directly from the reduced cost with no sign flip (after the per-column unscaling above). The reduced cost automatically captures all downstream effects: for storage, this includes contributions from the water balance, FPHA hyperplanes, and any generic constraints that reference the incoming storage variable $v^{in}_h$ (see [LP Formulation](/math/lp-formulation)).

:::note[Design note]
This "fishing" approach (pinning an incoming-state LP variable to the trial value and reading its sensitivity) is the standard technique used by SDDP.jl and other modern SDDP implementations. Cobre realises it through **column bounds** rather than an equality row: a bound-pinned column's reduced cost is the sensitivity, which removes the $N(1+L)$ (plus anticipated-state) redundant equality rows per stage while keeping the property that one value per state coordinate captures all downstream effects automatically. See [LP Formulation §4a](/math/lp-formulation).
:::

## 3. Single-Cut Aggregation

In the single-cut formulation, per-scenario cuts from the backward pass are aggregated into one cut per trial point by taking the probability-weighted expectation:

$$
\bar{\alpha}_{t-1} = \sum_{\omega \in \Omega_t} p(\omega) \cdot \alpha_t(\omega)
$$

$$
\bar{\pi}^v_{t-1,h} = \sum_{\omega \in \Omega_t} p(\omega) \cdot \pi^v_{t,h}(\omega)
$$

$$
\bar{\pi}^{lag}_{t-1,h,\ell} = \sum_{\omega \in \Omega_t} p(\omega) \cdot \pi^{lag}_{t,h,\ell}(\omega)
$$

where $p(\omega)$ is the probability of scenario $\omega$.

:::note[Opening tree correspondence]
The per-scenario cuts $\alpha_t(\omega)$, $\pi_t(\omega)$ correspond to the $N_{\text{openings}}$ noise vectors in the **fixed opening tree** — a pre-generated set of branchings created once before training begins. The backward pass always evaluates all openings, so the aggregation probabilities are uniform: $p(\omega) = 1/N_{\text{openings}}$. See [Scenario Generation](/math/scenario-generation).
:::

The aggregated cut $(\bar{\alpha}, \bar{\pi}^v, \bar{\pi}^{lag})$ is added to stage $t-1$'s cut pool.

:::note[Discount factor]
When the problem uses stage-dependent discount rates, discounting is applied to the $\theta$ variable in the stage $t-1$ objective function (i.e., $d_{t-1 \to t} \cdot \theta$), rather than scaling the cut coefficients directly. This is simpler — the cuts remain unmodified and the discount factor appears only in the objective. See [Discount Rate](/math/discount-rate) for the discounted Bellman equation and how discount factors interact with cut generation.
:::

:::note[Multi-cut formulation]
An alternative formulation creates one cut per scenario instead of aggregating, with per-scenario future cost variables $\theta_\omega$. This variant is not currently implemented; the single-cut formulation above is the production default.
:::

## 4. Cut Validity

A cut is **valid** if it is a lower bound on the true cost-to-go function everywhere in the feasible state space:

$$
\alpha_k + \pi_k^\top x \leq V_{t+1}(x) \quad \forall x \in \mathcal{X}_t
$$

**Validity conditions**: The cuts generated by SDDP are valid under:

1. **Convexity of stage subproblems** — guaranteed because all subproblems are LPs
2. **Relatively complete recourse** — feasibility for all states and scenarios. In Cobre, this is guaranteed by the recourse slack system (Category 1 penalties): every constraint that could be violated by exogenous uncertainty has a penalty slack variable, ensuring the LP is always feasible. See [Penalty System](/math/penalty-system).
3. **Correct sensitivity extraction** — the reduced costs used as cut coefficients must come from an optimal LP solution (not an infeasible or unbounded one)

## 5. Cut Growth and Selection Motivation

The number of cuts grows as $\mathcal{O}(\text{iterations} \times \text{forward\_passes})$. Many older cuts become redundant as newer, tighter cuts are generated. Without selection, the number of cut rows the LP carries grows linearly with iteration count.

**Append-only pool with stable slots**: Cuts are never deleted. Every cut ever generated is retained for the lifetime of the run at a **stable, deterministic slot index** — the slot is a fixed function of the iteration and forward-pass index, which is what makes the cut order reproducible across runs and rank counts (see [Determinism Guarantees](/math/determinism-guarantees)). The pool is never compacted.

**Deactivation mechanism** (periodic-pruning methods): A deactivated cut keeps its slot but is excluded from the per-iteration template rebake, so only active cuts are encoded as LP rows on each forward/backward solve. In the persistent lower-bound LP — where cut rows are never structurally removed, so the bound stays monotone — deactivation instead toggles the cut row's bound to a trivially-satisfied $\pm\infty$ sentinel. Both routes preserve the slot index for reproducibility and make **reactivation exact**: a cut that selection later restores is re-baked (or its bound restored) at the same slot.

Two families of selection strategy are available. **Periodic-pruning methods** (Level-1, LML1, Domination) run a value-evaluation pass after each $n$-th iteration and deactivate redundant cuts from the pool. **Dynamic Cut Selection** (DCS) takes a different approach: it keeps the pool entirely append-only — never deactivating any cut — and instead controls which cuts are resident in each individual stage LP solve (§8).

## 6. Cut Activity

Cut selection works from a **value-evaluation** view of activity. At a visited forward-pass trial point $\hat{x}$, each cut's value is $\alpha_k + \pi_k^\top \hat{x}$, and the per-state best value is

$$
V^*(\hat{x}) = \max_k \left\{ \alpha_k + \pi_k^\top \hat{x} \right\}
$$

taken over **all populated cuts, active and inactive**. A cut is **active (near-optimal) at $\hat{x}$** when its value lies within a tolerance band of the best:

$$
\text{cut } k \text{ is active at } \hat{x} \iff V^*(\hat{x}) - (\alpha_k + \pi_k^\top \hat{x}) \le \epsilon
$$

This is equivalent to the cut being binding (or near-binding) at the LP optimum reached from $\hat{x}$ — a cut at the per-state maximum is the one the future-cost variable $\theta$ rests on. The tolerance $\epsilon$ is the strategy's tie-breaking band: `tie_tolerance` for Level-1/LML1, `domination_tolerance` for Domination (§10).

| Tolerance  | Effect                                                       |
| ---------- | ------------------------------------------------------------ |
| 0          | Only exact-maximum cuts count as active                      |
| 1e-10      | Default: ties within rounding of the maximum are kept active |
| larger     | Wider near-optimal band retained                             |
| very large | All cuts considered active (no deactivation)                 |

## 7. Periodic-Pruning Strategies

Three periodic-pruning strategies are available, in increasing order of aggressiveness. All three share one **value-evaluation kernel**: every populated cut (active and inactive) is evaluated at every visited trial point, the per-state maximum is taken, and a per-state survival rule decides which cuts to keep. The kernel treats deactivation and reactivation **symmetrically** — in a single pass, a selected cut that is currently inactive is reactivated and an active cut not selected anywhere is deactivated. It is bit-deterministic regardless of thread count (see [Determinism Guarantees](/math/determinism-guarantees)).

**Visited-states window**: these strategies score cuts against the trial points held in the visited-states archive. To bound memory on long runs, the archive keeps only the most recent trial points — roughly those gathered over the last `check_frequency` iterations. After each selection run the archive is trimmed to that window, so a run sees up to about two windows of accumulated states before the trim; older trial points are then evicted. Dynamic Cut Selection (§8) does not use this archive.

### 7.1 Level-1

At each visited trial point, every cut within `tie_tolerance` of the per-state maximum value survives; the selected set is the union of these near-maximum cuts across all visited states. A cut is deactivated only if, at **every** visited state, its value is more than `tie_tolerance` below the maximum there. This strategy was originally proposed by de Matos, Philpott & Finardi (2015).

**Properties**:

- Least aggressive — retains any cut that is near-optimal at some visited state
- Preserves the convergence guarantee (see section 9)

### 7.2 Limited Memory Level-1 (LML1)

Like Level-1, but at each visited state only the **single oldest** eligible cut within `tie_tolerance` of the maximum survives (oldest = smallest slot index among non-warm-start cuts). The selected set is the union of these oldest-at-maximum cuts across visited states. Guigues & Bandarra (2019).

**Properties**:

- More aggressive than Level-1 — when several cuts tie at a state, only the oldest is kept, so redundant near-duplicates are shed faster
- Preserves the convergence guarantee (see section 9)

### 7.3 Domination

A cut is **dominated** if, at every visited state, the maximum over all populated cuts exceeds its value by more than `domination_tolerance`. Dominated cuts contribute nothing to the policy at any visited state and are deactivated; inactive cuts that achieve the maximum somewhere are reactivated. Formally, cut $k$ is dominated when

$$
\max_{j \neq k} \left\{ \alpha_j + \pi_j^\top \hat{x} \right\} - \left( \alpha_k + \pi_k^\top \hat{x} \right) > \text{domination\_tolerance} \quad \forall \hat{x} \in \text{visited states}
$$

This is the same max-survival logic as Level-1, using `domination_tolerance` in place of `tie_tolerance`.

**Properties**:

- Most aggressive — directly identifies cuts that provide no value at any known operating point
- Cost is $\mathcal{O}(|\text{cuts}| \times |\text{visited states}|)$ per stage per check; the kernel evaluates it as a dense matrix product distributed across threads
- May deactivate cuts that would be active at unvisited states (acceptable as the visited set grows dense)

## 8. Dynamic Cut Selection

Dynamic Cut Selection (DCS) is selected by `selection.method = "dynamic"` and is **mutually exclusive** with the periodic-pruning methods (Level-1, LML1, Domination). Unlike them, DCS never deactivates cuts from the pool — it keeps the pool entirely append-only and controls only **which cuts are resident in each stage LP** at solve time.

**Motivation**: rather than baking every active cut into each stage LP, DCS solves with a small **resident subset** and grows it lazily until the solution is provably exact, keeping per-solve LP size bounded as the pool grows. The full pool is retained off-LP and every cut remains a candidate.

### 8.1 Per-solve procedure

At iteration $k$, the DCS loop for one (stage, solve) is:

1. **Seed the resident set** with cuts that were active at this stage within the last $k_2$ iterations (the _seed window_), plus all cuts generated in the current iteration. The seed is derived only from synchronized per-slot pool metadata (`last_active_iter` and `iteration_generated`) — never from a per-worker solve trace. This makes the seed bit-identical across thread and MPI-rank counts.

2. **Solve** the stage LP with the current resident set. Let $x^*$ be the optimal state vector and $\theta^*$ the optimal future-cost value.

3. **Score the omitted (non-resident) candidate cuts.** Cut coefficients are stored in raw (unscaled) space while the LP solves in scaled space, so both $\theta^*$ and each state column must first be unscaled: $x_{\text{raw}} = \text{col\_scale}[c] \cdot x_{\text{scaled}}$. For candidate cut $i$ with intercept $\alpha_i$ and gradient $\nabla_i$, the future-cost floor it would impose at $x^*$ is

   $$
   f_i = \alpha_i + \nabla_i \cdot x^*_{\text{raw}}
   $$

   The candidate is **violated** iff $f_i - \theta^*_{\text{raw}} > \varepsilon_{\text{viol}}$ (strict). This follows from the cut-row convention $-\nabla \cdot x + \theta \ge \alpha$.

4. **Add the top $n_{\text{adic}}$** most-violated candidates (sorted by violation magnitude descending, ties broken by ascending slot id). Warm re-solve from the retained basis and return to step 2.

5. **Stop** when no candidate is violated. At this point the resident-subset optimum **equals the full-pool optimum** — every omitted cut is satisfied — so the result is exact. Backward duals and forward primals are extracted from this final LP.

### 8.2 Candidate-recency window $k_1$

By default every pool cut is a candidate ($k_1 = \infty$, i.e. `candidate_recency` absent), which preserves exactness. Setting `candidate_recency` to a finite $k_1$ restricts candidates to cuts generated within the last $k_1$ iterations. This is a deliberate, **inexact** speedup: cuts older than the window are never scored or added, even when violated.

### 8.3 Bounded inner loop with full-pool fallback

The add/re-solve loop is capped at 50 rounds (not user-configurable). If the cap is reached with violations remaining, all remaining violated candidates are added and one final solve is performed — degrading to a full-pool solve for that LP, which preserves exactness.

### 8.4 Pass uniformity and warm-start synergy

DCS applies identically across the **backward pass**, the **forward pass**, and **simulation**. Forward and simulation also run to exactness — no early stop — to avoid trajectory drift: an early stop in the forward pass would shift the states the backward pass visits, producing policy drift.

Because each inner re-solve adds only a few rows from a retained basis, DCS and LP basis warm-start are complementary, not in tension. See [LP Warm-Start](/math/lp-warm-start).

### 8.5 Seed window $k_2 = 0$

`seed_window = 0` is valid and meaningful: the resident set is seeded only with cuts generated in the current iteration, with no history. This matches the NEWAVE `selcor.dat` behavior (zero-history seeding), and the lazy loop then grows the resident set from scratch each solve. A larger `seed_window` trades a slightly larger initial LP for fewer inner iterations.

### 8.6 Determinism

The resident-set selection is bit-identical across thread and MPI-rank counts:

- The seed comes from synchronized pool metadata (`last_active_iter`, `iteration_generated`), not per-worker traces.
- The optimal state $x^*$ is scenario-deterministic (a function of the LP, not the rank).
- Candidate scoring uses a bit-deterministic batched matrix product (`gemm_block`).
- The violation sort uses a total ordering with an ascending-slot tie-break, making the top-$n_{\text{adic}}$ selection stable.

See [Determinism Guarantees](/math/determinism-guarantees).

## 9. Convergence Guarantee

**Theorem** (Bandarra & Guigues, 2021): Under Level-1 or LML1 cut selection, SDDP with finitely many scenarios converges to the optimal value function with probability 1.

**Key insight**: Removing cuts that are never active at any visited state does not affect the outer approximation quality at those states. As the set of visited states becomes dense over iterations, the approximation converges.

**DCS and convergence**: DCS is exact at every solve (§8.1 step 5) — the optimum it returns equals the full-pool optimum — so it does not weaken the convergence argument. The exactness guarantee rests on $k_1 = \infty$ (every pool cut remains a candidate); setting a finite `candidate_recency` sacrifices this guarantee.

> Bandarra, M., & Guigues, V. (2021). "Single cut and multicut stochastic dual dynamic programming with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments." _Computational Management Science_, 18(2), 125-148. https://doi.org/10.1007/s10287-021-00387-8

## 10. Selection Parameters

The `training.cut_selection` object has two always-on top-level knobs plus an optional tagged `selection` object. Omitting `selection` disables row selection. The `selection.method` field chooses the strategy; each method carries only its own parameters.

| Math symbol                 | Config key                       | Default                 | Applies to                     |
| --------------------------- | -------------------------------- | ----------------------- | ------------------------------ |
| —                           | `row_activity_tolerance`         | `0.0`                   | Always-on (top-level)          |
| —                           | `max_active_per_stage`           | none (no cap)           | Always-on (top-level)          |
| $\epsilon$                  | `selection.tie_tolerance`        | `1e-10`                 | `level1`, `lml1`               |
| —                           | `selection.check_frequency`      | `5` (must be > 0)       | `level1`, `lml1`, `domination` |
| $\epsilon$                  | `selection.domination_tolerance` | required, no default    | `domination`                   |
| $k_2$                       | `selection.seed_window`          | `5` (0 is valid)        | `dynamic`                      |
| $k_1$                       | `selection.candidate_recency`    | unset ($\infty$, exact) | `dynamic`                      |
| $n_{\text{adic}}$           | `selection.max_added_per_round`  | `10` (must be ≥ 1)      | `dynamic`                      |
| $\varepsilon_{\text{viol}}$ | `selection.violation_tolerance`  | `1e-10`                 | `dynamic`                      |
| —                           | `selection.start_iteration`      | `2` (must be ≥ 1)       | `dynamic`                      |

## Cross-References

- [LP Formulation](/math/lp-formulation) — Column-bound state pinning whose reduced costs give cut coefficients; Benders cut constraints in the LP
- [LP Warm-Start](/math/lp-warm-start) — Basis warm-start that is complementary to DCS inner re-solves
- [PAR Inflow Model](/math/par-inflow-model) — AR lag state variables that appear in cut coefficients
- [SDDP Algorithm](/math/sddp-algorithm) — Forward/backward pass structure that drives cut generation
- [Scenario Generation](/math/scenario-generation) — Fixed opening tree that defines backward pass branchings; sampling scheme abstraction
- [Penalty System](/math/penalty-system) — Recourse slacks that guarantee relatively complete recourse (cut validity condition)
- [Stopping Rules](/math/stopping-rules) — Convergence criteria that depend on cut quality
- [Discount Rate](/math/discount-rate) — Discount factor scaling in cut aggregation
- [Risk Measures](/math/risk-measures) — Risk-averse cut generation (CVaR modifies aggregation weights)
- [Block Formulations](/math/block-formulations) — Block structure that affects how per-block duals contribute to cut coefficients
- [Determinism Guarantees](/math/determinism-guarantees) — Bit-identical results across thread and MPI-rank counts, including DCS resident-set seeding
