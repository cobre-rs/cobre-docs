---
title: Inflow Non-Negativity Solution Methods
description: Four methods for handling negative PAR(p) inflow realizations — none, penalty, truncation, and the truncation_with_penalty hybrid — with LP formulations and trade-offs.
---

## Purpose

This chapter defines the four methods available for handling negative inflow realizations produced by the PAR(p) model, including their LP formulations, objective function modifications, and trade-offs.

## 1. Problem Statement

The PAR(p) model's inflow equation — using the AR coefficient [$\psi_{m,\ell}$](/overview/notation-conventions#35-inflow-model-parameters) — can produce a negative realization:

$$
a_h = \underbrace{b_{h,m}}_{\text{deterministic base}} + \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}_{\text{lag contribution}} + \underbrace{\sigma_m \cdot \varepsilon}_{\text{noise term}}
$$

When the [innovation](/overview/notation-conventions#35-inflow-model-parameters) $\varepsilon$ is sufficiently negative (e.g., $\varepsilon < -2$), the total can become negative. That is not itself a physical impossibility: $a_h$ is _incremental_ inflow — a plant's natural flow minus its upstream plants' — so a genuinely negative value is real hydrology (a reach that loses water over the period), and the same $a_h < 0$ case arises whether the realization comes from PAR(p) noise or from replaying a negative window of historical/observed data directly (`inflow_history`/`recent_observations`; see [PAR(p) Inflow Model](/math/par-inflow-model)). What the methods below solve is the LP's water-balance consequence of $a_h < 0$: absorbing it without the other water-balance variables (storage, release, spillage — all bounded $\geq 0$) being driven infeasible.

No method changes the realization itself. Under every method the realized-inflow row ([LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows)) keeps $a_h$ at the PAR value, which may be negative, and the AR lags of later stages are built from that value. The methods differ only in the water a slack column $\sigma^{inf}_h$ may add beside $a_h$ in the hydro's water balance: none, any non-negative amount at a cost, or an amount bounded by the **truncation amount**

$$
l^*_h = \max\left(0,\; -\Big(b_{h,m} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon\Big)\right)
$$

the water that lifts the realization to zero. $l^*_h$ is evaluated at every solve from that solve's noise and the incoming lags $\hat{a}_{h,\ell}$ pinned for it, so it depends on the trial state.

## 2. Penalty Classification

The inflow non-negativity penalty $c^{inf}_h$ prices a **Category 1 recourse slack** ([Penalty System — Category 1](/math/penalty-system#category-1-recourse-slacks-lp-feasibility)): the slack adds water to the hydro's water balance, so every subproblem stays feasible when a negative inflow realization leaves the balance without a solution. Its cost is ordered with the constraint-violation penalties: converted to an energy-equivalent cost in \$/MWh, it lies above the thermal and contract costs and below deficit ([Penalty System — Penalty Priority Ordering](/math/penalty-system#penalty-priority-ordering)).

Since inflow $a_h$ is defined per stage (not per block), the inflow non-negativity penalty appears **outside** the block summation in the objective, alongside storage violation penalties:

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

where $H_t = \sum_k \tau_k$ is the total stage duration in hours. The product $\sigma^{inf}_h \cdot H_t$ is the volume of water the slack adds, in (m³/s)·h, so $c^{inf}_h$ is a cost per (m³/s)·h of added water. The term is present under the `penalty` and `truncation_with_penalty` methods; under `truncation` the slack costs nothing.

## 3. Method: `none`

**LP Formulation**: Standard AR constraint (unchanged):

$$
a_h = b_{h,m} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Implications**:

- LP may become **infeasible** when $a_h < 0$ causes water balance violation
- Useful only for debugging or when the AR model guarantees positive outputs

## 4. Method: `penalty`

**Additional Variables**:

| Variable         | Domain   | Units | Description                 |
| ---------------- | -------- | ----- | --------------------------- |
| $\sigma^{inf}_h$ | $\geq 0$ | m³/s  | Inflow non-negativity slack |

**Water-balance term**: the slack enters the hydro's water balance beside the realized inflow, every term on the left-hand side ([LP Formulation §4](/math/lp-formulation#4-hydro-water-balance)):

$$
-\zeta \,\big( a_h + \sigma^{inf}_h \big) \;\; \text{(parallel stage)}, \qquad -\zeta_k \,\big( a_h + \sigma^{inf}_h \big) \;\; \text{(block } k \text{ of a chronological stage)}
$$

so the slack adds $\zeta\,\sigma^{inf}_h$ hm³ of water over the stage, $\zeta_k\,\sigma^{inf}_h$ in block $k$. The realized-inflow row ([LP Formulation §5](/math/lp-formulation#5-realized-inflow-definition-rows)) is unchanged: the AR equation keeps the realization $a_h$. The slack enters exactly the water-balance rows that $a_h$ enters: on a PreFilling hydro, the rows of the first non-PreFilling plant downstream ([LP Formulation — PreFilling Pass-Through](/math/lp-formulation#prefilling-pass-through)), no row when there is none and the water leaves the system, and never the hydro's own frozen identity row. **Interpretation**: the water reaching the reservoir is $a_h^{effective} = a_h + \sigma^{inf}_h$. The LP uses the slack whenever the water balance cannot be met otherwise, or whenever the added water is worth more than its cost; nothing ties it to the sign of the realization.

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

where $c^{inf}_h$ is the penalty cost of hydro $h$ and $H_t = \sum_k \tau_k$ is the total stage duration in hours.

**Advantages**:

- LP always feasible
- Clear cost signal for negative inflow events
- Preserves AR dynamics for positive realizations

**Disadvantages**:

- Adds one slack column per hydro
- Slightly affects marginal water values

## 5. Method: `truncation`

This method follows [Larroyd et al. (2022)](/reference/bibliography/#inflow-modelling): the realization stays raw, and a separate column adds exactly the water that lifts it to zero.

**Additional Variables**:

| Variable         | Domain                     | Units | Description                                       |
| ---------------- | -------------------------- | ----- | ------------------------------------------------- |
| $\sigma^{inf}_h$ | $[\,l^*_h,\; l^*_h\,]$     | m³/s  | Truncation correction, fixed at the truncation amount of §1 |

**LP Formulation**: the realized-inflow row keeps the raw PAR value, $a_h = b_{h,m} + \sum_{\ell} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon$, negative or not, and the outgoing lags carry it. The correction enters the water balance beside $a_h$ as the slack of §4 does, on the same rows, so the water balance receives

$$
a_h + \sigma^{inf}_h = \max(a_h, 0)
$$

The column's bounds are set at every solve to the truncation amount of that solve, and it carries **no cost**: the objective is the one the LP would have with a zero inflow in place of the negative one.

**Advantages**:

- A negative realization never reaches the water balance: the balance receives $\max(a_h, 0)$
- The AR state is not censored: the lags carry the raw realization, so the inflow process keeps its distribution and its temporal correlation
- No cost term and no tuning parameter
- Works for any residual standard deviation $\sigma_m$, zero included: a negative deterministic value $b_{h,m} + \sum_\ell \psi_{m,\ell} \hat a_{h,\ell}$ is corrected the same way

**Disadvantages**:

- Adds one column per hydro
- The water balance receives more water than the PAR value whenever that value is negative, so the mean water received is above the mean of the inflow process
- $l^*_h$ depends on the trial state through the incoming lags, so the stage cost-to-go is not guaranteed convex in the lag components ([Cut Management — Tier 1](/math/cut-management#tier-1-valid-lower-bound)). This is the limitation the method's source states in its §2.5: a cut taken with the correction frozen at its trial state can exceed the true successor cost at another state, so the lower bound is not guaranteed to stay below the upper bound, and a gap-based stopping test can report a convergence that has not occurred. Each cut stays a valid minorant of the successor cost with the correction frozen at its own trial state.

## 6. Method: `truncation_with_penalty` — Hybrid Design

The two preceding methods each fix one side of the problem: `truncation` always adds the water a negative realization lacks, at no cost, while `penalty` lets the LP buy any amount of water at a price, whatever the sign of the realization. The hybrid prices the water as `penalty` does and bounds it by the truncation amount as `truncation` does.

### 6.1 Formulation: a priced correction bounded by the truncation amount

The realized-inflow row and the lags are those of §5: the realization stays raw. The slack column is bounded by the truncation amount of the solve:

**Additional Variables**:

| Variable         | Domain                 | Units | Description                                              |
| ---------------- | ---------------------- | ----- | -------------------------------------------------------- |
| $\sigma^{inf}_h$ | $[\,0,\; l^*_h\,]$     | m³/s  | Inflow non-negativity slack, at most the truncation amount |

**Water-balance term**: as in §4, on the same rows; the water balance receives between $a_h$ and $\max(a_h, 0)$.

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

### 6.2 Why the hybrid

- **The slack never buys water the realization does not lack.** Where $a_h \geq 0$ the bound is $l^*_h = 0$ and the slack is zero; the unbounded `penalty` slack can still add water there whenever the water is worth more than $c^{inf}_h$.
- **The LP chooses how much of the deficit to cover.** Where $a_h < 0$ the LP adds up to $l^*_h$ at $c^{inf}_h$ per (m³/s)·h and lets the rest of the negative inflow draw on storage when stored water is cheaper than the penalty, so the penalty sets the price of the correction instead of fixing it at the full amount.
- **The AR state is not censored**, as under `truncation`. The dependence of $l^*_h$ on the trial state, and the limitation of §5 that follows from it, are the same.

### 6.3 Reference design

The literature formulates the same problem using a dimensionless noise-adjustment slack $\xi_h$. This reference design is presented here so readers familiar with the Brazilian stochastic-dispatch literature can map between the two formulations.

**Additional Variables**:

| Variable | Domain   | Units | Description                            |
| -------- | -------- | ----- | -------------------------------------- |
| $\xi_h$  | $\geq 0$ | -     | Noise adjustment slack (dimensionless) |

**Modified AR Constraint** (two parts):

**Part A — Modified noise term**:

$$
\varepsilon_h^{adj} = \varepsilon_h + \xi_h
$$

where $\varepsilon_h$ is the original (possibly very negative) noise realization.

**Part B — Inflow with adjusted noise**:

$$
a_h = b_{h,m} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon_h^{adj}
$$

**Non-negativity constraint**:

$$
a_h \geq 0
$$

**Interpretation**: The optimizer chooses $\xi_h$ to be the minimum adjustment needed to make $a_h \geq 0$:

$$
\xi_h = \max\left(0, -\varepsilon_h - \frac{b_{h,m} + \sum_\ell \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}{\sigma_m}\right)
$$

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma_m \cdot \xi_h \cdot H_t
$$

The penalty is proportional to $\sigma_m \cdot \xi_h$, which is the actual inflow adjustment in m³/s. Note that $\sigma_m$ varies by season, so the effective penalty for a given noise adjustment $\xi_h$ is larger in high-variability seasons and smaller in low-variability seasons. This is by design — a given noise adjustment represents a larger physical inflow correction when $\sigma_m$ is large.

**Relation to the bounded-slack formulation of §6.1**: both price added water at $c^{inf}_h$ per (m³/s)·h, and the minimum adjustment $\sigma_m \cdot \xi_h$ equals the truncation amount $l^*_h$ of §1, the slack's upper bound. They differ in where the adjustment lands. The reference design's adjustment changes $a_h$ itself, which the AR lags of later stages carry, while the slack adds water beside an unchanged realized-inflow row, so the lags carry the raw realization. And the reference design needs $\sigma_m > 0$ to express any adjustment, while the slack corrects a negative deterministic value at $\sigma_m = 0$. The bounded-slack formulation adds one column and no noise-adjustment constraint to the LP.

## 7. Comparison Summary

| Method                    | LP Size             | Water added to the balance                  | Cost of added water | AR state | Feasibility |
| ------------------------- | ------------------- | ------------------------------------------- | ------------------- | -------- | ----------- |
| `none`                    | Base                | None                                        | —                   | Raw      | May fail    |
| `penalty`                 | +1 column per hydro | Any amount $\geq 0$, at any realization     | $c^{inf}_h$         | Raw      | Guaranteed  |
| `truncation`              | +1 column per hydro | Exactly $l^*_h$                             | 0                   | Raw      | Guaranteed  |
| `truncation_with_penalty` | +1 column per hydro | Between $0$ and $l^*_h$                     | $c^{inf}_h$         | Raw      | Guaranteed  |

Under the two truncation methods the correction depends on the trial state, which costs the convexity guarantee of the lower bound (§5).

## 8. Reference

- [Larroyd et al. (2022)](/reference/bibliography/#inflow-modelling)

## Cross-References

- [LP Formulation](/math/lp-formulation) — Objective function structure and penalty taxonomy, where $c^{inf}_h$ prices a Category 1 recourse slack
- [PAR(p) Inflow Model](/math/par-inflow-model) — Defines the PAR(p) model that produces the inflow realizations handled here
- [Penalty System](/math/penalty-system) — Penalty hierarchy and cascade resolution
- [Scenario Generation](/math/scenario-generation) — The noise term $\varepsilon$ in the inflow equation comes from the fixed opening tree (pre-generated noise vectors), not from per-iteration random sampling
- [Configuring inflow non-negativity](/running/configuration#modelinginflow_non_negativity) — the software-layer setting that selects which of these four methods a study uses and where the penalty cost $c^{inf}_h$ is authored
