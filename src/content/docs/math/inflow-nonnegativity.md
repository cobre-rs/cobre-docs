---
title: Inflow Non-Negativity Solution Methods
description: Four methods for handling negative PAR(p) inflow realizations — none, penalty, truncation, and the truncation_with_penalty hybrid — with LP formulations and trade-offs.
---

## Purpose

This spec defines the four methods available for handling negative inflow realizations produced by the PAR(p) model, including their LP formulations, objective function modifications, and trade-offs.

## 1. Problem Statement

The PAR(p) model's inflow equation — using the AR coefficient [$\psi_{m,\ell}$](/overview/notation-conventions#35-inflow-model-parameters) — can produce a negative realization:

$$
a_h = \underbrace{\mu_m - \sum_{\ell=1}^{p} \psi_{m,\ell} \mu_{m-\ell}}_{\text{deterministic base}} + \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}_{\text{lag contribution}} + \underbrace{\sigma_m \cdot \varepsilon}_{\text{noise term}}
$$

When the [innovation](/overview/notation-conventions#35-inflow-model-parameters) $\varepsilon$ is sufficiently negative (e.g., $\varepsilon < -2$), the total can become negative. That is not itself a physical impossibility: $a_h$ is _incremental_ inflow — a plant's natural flow minus its upstream plants' — so a genuinely negative value is real hydrology (a reach that loses water over the period), and the same $a_h < 0$ case arises whether the realization comes from PAR(p) noise or from replaying a negative window of historical/observed data directly (`inflow_history`/`recent_observations`; see [PAR(p) Inflow Model](/math/par-inflow-model)). What the methods below solve is the LP's water-balance consequence of $a_h < 0$: absorbing it without the other water-balance variables (storage, release, spillage — all bounded $\geq 0$) being driven infeasible.

## 2. Penalty Classification

The inflow non-negativity penalty $c^{inf}$ is a **Category 2 constraint violation penalty** — it provides slack for a physical constraint (non-negative inflow) that may be impossible to satisfy under extreme noise realizations. Its position in the penalty hierarchy (see [LP Formulation](/math/lp-formulation)):

$$
c^{tv-}, c^{ov\pm}, c^{gv-}, c^{ev\pm}, c^{wv\pm}, c^{inf} > c^{th}, c^{ctr}
$$

Since inflow $a_h$ is defined per stage (not per block), the inflow non-negativity penalty appears **outside** the block summation in the objective, alongside storage violation penalties:

$$
+ \sum_{h \in \mathcal{H}} c^{inf} \cdot \sigma^{inf}_h \cdot T
$$

where $T = \sum_k \tau_k$ is the total stage duration in hours. The product $\sigma^{inf}_h \cdot T$ converts the slack rate (m³/s) to an energy-equivalent dimension over the full stage.

## 3. Method: `none`

**LP Formulation**: Standard AR constraint (unchanged):

$$
a_h = \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Implications**:

- LP may become **infeasible** when $a_h < 0$ causes water balance violation
- Useful only for debugging or when the AR model guarantees positive outputs

## 4. Method: `penalty`

**Additional Variables**:

| Variable         | Domain   | Units | Description                 |
| ---------------- | -------- | ----- | --------------------------- |
| $\sigma^{inf}_h$ | $\geq 0$ | m³/s  | Inflow non-negativity slack |

**Modified AR Constraint**:

$$
a_h + \sigma^{inf}_h = \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Interpretation**: When the AR model produces negative $a_h$, the slack $\sigma^{inf}_h$ absorbs the violation, making the effective inflow:

$$
a_h^{effective} = a_h + \sigma^{inf}_h \geq 0
$$

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf} \cdot \sigma^{inf}_h \cdot T
$$

where $c^{inf}$ is the penalty cost and $T = \sum_k \tau_k$ is the total stage duration in hours.

**Advantages**:

- LP always feasible
- Clear cost signal for negative inflow events
- Preserves AR dynamics for positive realizations

**Disadvantages**:

- Adds variables and constraints
- Slightly affects marginal water values

## 5. Method: `truncation`

**Scenario Generation**:

$$
a_h = \max\left(0, \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon\right)
$$

**LP Formulation**: Standard AR constraint with the already-truncated $a_h$ value:

$$
a_h = \text{(truncated value from scenario)}
$$

**Advantages**:

- No additional LP variables or constraints
- Straightforward formulation

**Disadvantages**:

- **Biases the distribution**: Shifts mean upward
- **Breaks AR dynamics**: When truncation occurs, temporal correlation is disrupted
- May affect long-term storage dynamics

## 6. Method: `truncation_with_penalty` — Hybrid Design

The two preceding methods each handle one side of the problem well but leave the other unaddressed: pure truncation keeps the LP lean but biases the inflow distribution upward; pure penalty preserves distribution fidelity but relies entirely on LP slack to absorb every negative excursion. The hybrid combines both mechanisms to cover the full range of noise excursions efficiently.

### 6.1 Formulation: clamp outside the LP, slack inside the LP

The PAR(p) noise is clamped outside the LP before the scenario is patched in, exactly as in the `truncation` method:

$$
a_h = \max\left(0, \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon\right)
$$

Inside the LP, penalty slack columns $\sigma^{inf}_h$ are added to the water-balance constraint, exactly as in the `penalty` method:

**Additional Variables**:

| Variable         | Domain   | Units | Description                 |
| ---------------- | -------- | ----- | --------------------------- |
| $\sigma^{inf}_h$ | $\geq 0$ | m³/s  | Inflow non-negativity slack |

**Modified AR Constraint** (inside LP, using the clamped $a_h$):

$$
a_h + \sigma^{inf}_h = \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf} \cdot \sigma^{inf}_h \cdot T
$$

### 6.2 Why the hybrid

Clamping and slack columns serve complementary roles that together preserve relatively complete recourse:

- **Clamping handles the common case cheaply.** Most negative excursions are small — the noise term dips slightly below zero for a handful of stages in a scenario tree. Clamping those excursions to zero outside the LP adds no LP variables and no solver work. The inflow handed to the LP is always non-negative, so the water-balance constraint is never violated by the noise term alone.
- **Slack columns absorb rare large excursions without rejecting the scenario.** When the PAR(p) model produces an extreme realisation, the deterministic base and lag contribution combined with the noise term can still yield a zero inflow after clamping, and the LP's water-balance may still be infeasible without relief. The $\sigma^{inf}_h$ slack column lets the solver relax the non-negativity at a known cost rather than declaring infeasibility. The stage is kept in the training set; the penalty signal propagates into future-cost cuts.
- **Together they guarantee LP feasibility (Category 1 recourse) across the full noise distribution**, without biasing the distribution upward beyond what truncation already does for small excursions, and without adding LP slack columns for every stage regardless of whether they are needed.

### 6.3 Reference design and equivalence

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
a_h = \text{deterministic\_base} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell} + \sigma_m \cdot \varepsilon_h^{adj}
$$

**Non-negativity constraint**:

$$
a_h \geq 0
$$

**Interpretation**: The optimizer chooses $\xi_h$ to be the minimum adjustment needed to make $a_h \geq 0$:

$$
\xi_h = \max\left(0, -\varepsilon_h - \frac{\text{deterministic\_base} + \sum_\ell \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}{\sigma_m}\right)
$$

**Objective Function Addition** (outside block summation):

$$
+ \sum_{h \in \mathcal{H}} c^{inf} \cdot \sigma_m \cdot \xi_h \cdot T
$$

The penalty is proportional to $\sigma_m \cdot \xi_h$, which is the actual inflow adjustment in m³/s. Note that $\sigma_m$ varies by season, so the effective penalty for a given noise adjustment $\xi_h$ is larger in high-variability seasons and smaller in low-variability seasons. This is by design — a given noise adjustment represents a larger physical inflow correction when $\sigma_m$ is large.

**Equivalence with the clamp-plus-slack formulation**: The $\xi_h$ reference design and the clamp-plus-slack formulation are economically equivalent when both use the same penalty cost $c^{inf}$. In both cases the objective penalty equals $c^{inf}$ multiplied by the physical inflow correction in m³/s·h. The clamp-plus-slack formulation reuses the existing truncation and penalty mechanisms without introducing a separate noise-adjustment constraint inside the LP, which simplifies the solver's constraint matrix.

## 7. Comparison Summary

| Method                    | LP Size    | Bias    | AR Preservation | Feasibility |
| ------------------------- | ---------- | ------- | --------------- | ----------- |
| `none`                    | Base       | None    | Full            | May fail    |
| `penalty`                 | +vars/cons | Minimal | Full            | Guaranteed  |
| `truncation`              | Base       | Upward  | Partial         | Guaranteed  |
| `truncation_with_penalty` | +vars/cons | Minimal | Full            | Guaranteed  |

## 8. Reference

> Larroyd, P.V., Pedrini, R., Beltran, F., Teixeira, G., Finardi, E.C., & Picarelli, L.B. (2022). "Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem." _Energies_, 15(3), 1115. https://doi.org/10.3390/en15031115

## Cross-References

- [LP Formulation](/math/lp-formulation) — Objective function structure and penalty taxonomy where $c^{inf}$ is a Category 2 constraint violation penalty
- [PAR Inflow Model](/math/par-inflow-model) — Defines the PAR(p) model that produces the inflow realizations handled here
- [Penalty System](/math/penalty-system) — Penalty hierarchy and cascade resolution
- [Scenario Generation](/math/scenario-generation) — The noise term $\varepsilon$ in the inflow equation comes from the fixed opening tree (pre-generated noise vectors), not from per-iteration random sampling
- [Configuring inflow non-negativity](/running/configuration#inflow_non_negativity) — the software-layer setting that selects which of these four methods a study uses and where the penalty cost $c^{inf}$ is authored
