---
title: Toy Four-Reservoir SDDP Walkthrough
description: Hand-traceable four-reservoir SDDP iteration — multi-dimensional cuts, per-bus dispatch, and per-reservoir marginal water values on a four-bus system with independent 0-order inflows.
---

## Purpose

This chapter extends the single-reservoir walkthrough in
[Toy Single-Reservoir Walkthrough](/examples/toy-single-reservoir) to a
four-reservoir, four-bus system, still using a 0-order
(seasonal-sampling) inflow model. The chapter demonstrates two
phenomena that the single-reservoir case cannot exhibit:

- **Multi-dimensional cuts.** The cut becomes a hyperplane with one
  storage coefficient per reservoir; the optimiser must balance
  releases across plants by reading the per-storage reduced cost of
  each pinned incoming-storage column.
- **Per-bus dispatch with independent supply.** Each bus carries its
  own demand and is served by its local hydro and a local thermal;
  the LP solves the regional dispatches simultaneously inside one
  stage problem.

Cobre ships an actual reference case at `examples/4ree/` modelling the
four-region Brazilian interconnected system (SUDESTE, SUL, NORDESTE,
NORTE) with 24 monthly stages, 126 thermals, and two transmission
lines (SUDESTE–SUL and SUDESTE–NORDESTE). The shipped case has no
inter-reservoir cascade coupling (each region's reservoir is
independent), no spatial inflow correlation, and uses a constant
hydro productivity model. This walkthrough preserves those
properties but replaces the production-scale numbers with
hand-traceable values: 4 stages, 3 openings, one thermal per bus, no
transmission. **This walkthrough is a pedagogical caricature, not a
reproduction of the shipped case.**

The chapter does not cover transmission, cascade coupling, the FPHA
production model, an infinite-horizon cyclic policy, multi-resolution
coupling, or risk measures. Those topics are addressed in the
chapters cited in section 8.

---

## 1. The Case in One Picture

The system has four buses, each with one local hydro (productivity
1.0), one local thermal, and one local demand block. The four
reservoirs are independent — no cascade coupling. There is no
transmission between buses in this walkthrough; each bus
self-balances dispatch from its local resources.

```d2
direction: right

classes: {
  hydro: {style: {stroke: "#4a90b8"}}
  thermal: {style: {stroke: "#f5a623"}}
}

a1: "Inflow a₁\n(0-order)" {shape: oval; class: hydro}
a2: "Inflow a₂\n(0-order)" {shape: oval; class: hydro}
a3: "Inflow a₃\n(0-order)" {shape: oval; class: hydro}
a4: "Inflow a₄\n(0-order)" {shape: oval; class: hydro}
h1: "H1\ncap 100" {shape: cylinder; class: hydro}
h2: "H2\ncap 100" {shape: cylinder; class: hydro}
h3: "H3\ncap 80" {shape: cylinder; class: hydro}
h4: "H4\ncap 80" {shape: cylinder; class: hydro}
b1: "Bus 1\nD = 25"
b2: "Bus 2\nD = 20"
b3: "Bus 3\nD = 15"
b4: "Bus 4\nD = 12"
t1: "Thermal₁\ncost 50" {class: thermal}
t2: "Thermal₂\ncost 50" {class: thermal}
t3: "Thermal₃\ncost 50" {class: thermal}
t4: "Thermal₄\ncost 50" {class: thermal}

a1 -> h1 -> b1
a2 -> h2 -> b2
a3 -> h3 -> b3
a4 -> h4 -> b4
t1 -> b1
t2 -> b2
t3 -> b3
t4 -> b4
```

**Per-hydro parameters:**

| Hydro | Bus | $\bar V_h$ | $\hat v_{h,0}$ | $\mu_h$ | $\sigma_h$ | Productivity |
| ----- | --- | ---------- | -------------- | ------- | ---------- | ------------ |
| H1    | B1  | 100        | 30             | 15      | 5          | 1.0          |
| H2    | B2  | 100        | 30             | 12      | 4          | 1.0          |
| H3    | B3  | 80         | 20             | 10      | 3          | 1.0          |
| H4    | B4  | 80         | 20             | 8       | 3          | 1.0          |

**Per-bus demand:**

| Bus | $D_b$ |
| --- | ----- |
| B1  | 25    |
| B2  | 20    |
| B3  | 15    |
| B4  | 12    |

**System-level parameters:**

| Parameter             | Symbol    | Value       |
| --------------------- | --------- | ----------- |
| Stages                | $T$       | 4           |
| Openings per stage    | $N$       | 3           |
| Thermal marginal cost | $c^{th}$  | 50 \$/MWh   |
| Deficit cost          | $c^{def}$ | 1000 \$/MWh |
| Discount factor       | $d$       | 1.0         |

Each bus's demand exceeds its local hydro mean inflow ($D_1 - \mu_1 = 10$,
$D_2 - \mu_2 = 8$, $D_3 - \mu_3 = 5$, $D_4 - \mu_4 = 4$), so reservoirs
deplete over the four-stage horizon and thermal generation appears in
later stages.

---

## 2. Stage LP for This Case

The stage-$t$ LP is assembled from the general formulation in
[LP Formulation](/math/lp-formulation), specialised to four
hydros, four buses with one local thermal each, four storage state
variables, and 0-order inflow (no AR-lag state).

**Objective** (minimise current-stage cost plus future cost):

$$
\min \quad \sum_{b=1}^{4} \bigl( 50\, g^{th}_b + 1000\, \delta_b \bigr) + \theta
$$

**Per-bus load balance** (each bus self-balances, no transmission):

$$
g_b + g^{th}_b + \delta_b = D_b, \qquad b = 1, 2, 3, 4
$$

where $g_b$ is the local hydro generation at bus $b$.

**Hydro generation** (constant productivity at all four plants):

$$
g_h \;=\; 1.0 \cdot q_h, \qquad h = 1, 2, 3, 4
$$

**Water balances** (each reservoir is independent — no cascade):

$$
v_h \;=\; v^{in}_h + a_h - q_h, \qquad h = 1, 2, 3, 4
$$

(For this walkthrough $\zeta = 1$: one m³/s of turbining per stage
withdraws one hm³.)

**Incoming-storage pinning** (the reduced cost of each pinned column
becomes the cut coefficient):

$$
v^{in}_h \;=\; \hat{v}_{h,t-1}, \qquad h = 1, 2, 3, 4
$$

**Bounds**: $0 \leq v_h \leq \bar V_h$; $q_h, g_h, g^{th}_b, \delta_b \geq 0$;
$\theta \geq 0$.

**Future cost variable $\theta$**: as in the single-reservoir case, the
terminal stage carries no cuts; cuts of the form
$\theta \geq \alpha + \sum_h \pi^v_h\, v_h$ are added by the backward
pass to earlier stages' LPs. With four reservoirs the cut is now a
4-coefficient hyperplane in storage state space, with each
$\pi^v_h \leq 0$ reflecting that storage at hydro $h$ reduces future
cost.

Note again the absence of any AR-lag state: 0-order inflow has no
memory, so storage is the entire state vector.

---

## 3. The 0-Order Inflow Model with Four Hydros

Each hydro $h$ samples its own inflow independently from a normal
distribution with hydro-specific seasonal mean and standard deviation:

$$
a_{h,t} \;=\; \mu_h + \sigma_h\, \varepsilon_{h,t}, \qquad
\varepsilon_{h,t} \sim \mathcal{N}(0, 1)
$$

with hydro-specific $(\mu_h, \sigma_h)$ from the parameter table in
section 1. **The innovations are independent across hydros** — there
is no `correlation.json` file in the actual `examples/4ree/` case, and
this walkthrough preserves that property.

If a `correlation.json` file were supplied, the spatial structure
$\Sigma$ between innovations would be applied via the spectral
factorisation $\varepsilon = L\, z$ with $L L^{\top} = \Sigma$ — see
[PAR Inflow Model](/math/par-inflow-model) section 8 for the
multivariate case. For this walkthrough the four innovations are
drawn independently.

The three openings used in the backward pass correspond to a single
shared $\varepsilon \in \{-1, 0, +1\}$ applied uniformly to all four
hydros (a simplifying choice — in the production code each hydro
draws its own $\varepsilon$ and the joint distribution lives over a
larger sample-tree). Each opening has equal probability $p = 1/3$.

---

## 4. Iteration 1 — Forward Pass

The forward pass samples one trajectory using $\varepsilon_t = 0$ for
every stage, so each hydro receives its mean inflow at every stage.
With $\theta$ free at zero (no cuts in iteration 1), the LP minimises
the per-bus thermal and deficit costs at each stage.

Because at the initial state every bus has enough hydro plus storage
to meet demand from hydro alone, stages 1–3 carry zero cost. Stage 4
runs water-short on three of the four buses.

**Stage 1** — incoming storage $\hat v_0 = (30, 30, 20, 20)$, inflows
$(15, 12, 10, 8)$. At every bus, $q_h = D_b$ (demand met from hydro);
end-of-stage storage:

$$
v_1 = (30 + 15 - 25,\; 30 + 12 - 20,\; 20 + 10 - 15,\; 20 + 8 - 12) = (20, 22, 15, 16).
$$

Stage cost: $0$ (no thermal, no deficit).

**Stage 2** — $\hat v_1 = (20, 22, 15, 16)$. Same pattern: each bus
meets demand from hydro; storage decreases by $D_b - \mu_h$:

$$
v_2 = (10, 14, 10, 12).
$$

Stage cost: $0$.

**Stage 3** — $\hat v_2 = (10, 14, 10, 12)$. Bus 1 reaches a knife
edge: water available $= \hat v_{1,2} + a_1 = 10 + 15 = 25 = D_1$; the
LP turbines all available water and ends with $v_{1,3} = 0$. Other
buses still have surplus.

$$
v_3 = (0, 6, 5, 8).
$$

Stage cost: $0$.

**Stage 4** — $\hat v_3 = (0, 6, 5, 8)$, inflows $(15, 12, 10, 8)$.
Now three buses go water-short:

| Bus | $\hat v_3$ | $a$ | Avail. | $D$ | $q$ | $g^{th}$ | $\delta$ |
| --- | ---------- | --- | ------ | --- | --- | -------- | -------- |
| B1  | 0          | 15  | 15     | 25  | 15  | 10       | 0        |
| B2  | 6          | 12  | 18     | 20  | 18  | 2        | 0        |
| B3  | 5          | 10  | 15     | 15  | 15  | 0        | 0        |
| B4  | 8          | 8   | 16     | 12  | 12  | 0        | 0        |

Stage 4 cost: $50 \times 10 + 50 \times 2 = 500 + 100 = 600$.

**Trajectory upper-bound estimate**: $0 + 0 + 0 + 600 = 600$.

---

## 5. Iteration 1 — Backward Pass

The backward pass walks stages $4 \to 1$. At each stage it pins the
incoming storage to the trial point from the forward pass, evaluates
all three openings, reads the four pinned-column reduced costs, and
aggregates into a 4-coefficient cut. The mechanics follow
[Cut Management](/math/cut-management) sections 2–3, generalised
from one storage coefficient (single-reservoir case) to four (this
case).

### Stage 4 (terminal)

**Trial point**: $\hat v_3 = (0, 6, 5, 8)$. Inflows under the three
shared openings (all four hydros move together with $\varepsilon$):

| Opening    | $\varepsilon$ | $a_1$ | $a_2$ | $a_3$ | $a_4$ |
| ---------- | ------------- | ----- | ----- | ----- | ----- |
| $\omega_1$ | $-1$          | 10    | 8     | 7     | 5     |
| $\omega_2$ | $0$           | 15    | 12    | 10    | 8     |
| $\omega_3$ | $+1$          | 20    | 16    | 13    | 11    |

For each opening, each bus solves its local dispatch independently
(no transmission, no $\theta$ at the terminal stage):

**$\omega_1$ (dry):**

| Bus | Avail. | $D$ | $q$ | $g^{th}$ | Stage cost | $\pi^v_h$ |
| --- | ------ | --- | --- | -------- | ---------- | --------- |
| B1  | 10     | 25  | 10  | 15       | 750        | $-50$     |
| B2  | 14     | 20  | 14  | 6        | 300        | $-50$     |
| B3  | 12     | 15  | 12  | 3        | 150        | $-50$     |
| B4  | 13     | 12  | 12  | 0        | 0          | $0$       |

$Q_4(\omega_1) = 750 + 300 + 150 + 0 = 1200$.

The storage cut coefficient at each bus — the reduced cost of the pinned
incoming-storage column — follows the single-reservoir logic: water-limited
buses with thermal active have $\pi^v_h = -50$; buses where demand is met by
hydro alone have $\pi^v_h = 0$.

**$\omega_2$ (mean):**

| Bus | Avail. | $D$ | $q$ | $g^{th}$ | Stage cost | $\pi^v_h$ |
| --- | ------ | --- | --- | -------- | ---------- | --------- |
| B1  | 15     | 25  | 15  | 10       | 500        | $-50$     |
| B2  | 18     | 20  | 18  | 2        | 100        | $-50$     |
| B3  | 15     | 15  | 15  | 0        | 0          | $0$       |
| B4  | 16     | 12  | 12  | 0        | 0          | $0$       |

$Q_4(\omega_2) = 600$. B3 is at a knife edge ($D = $ avail.); the
walkthrough takes the basis returning $\pi^v_3(\omega_2) = 0$ (extra
storage flows to terminal $v_4$ which has zero value).

**$\omega_3$ (wet):**

| Bus | Avail. | $D$ | $q$ | $g^{th}$ | Stage cost | $\pi^v_h$ |
| --- | ------ | --- | --- | -------- | ---------- | --------- |
| B1  | 20     | 25  | 20  | 5        | 250        | $-50$     |
| B2  | 22     | 20  | 20  | 0        | 0          | $0$       |
| B3  | 18     | 15  | 15  | 0        | 0          | $0$       |
| B4  | 19     | 12  | 12  | 0        | 0          | $0$       |

$Q_4(\omega_3) = 250$.

**Per-opening intercepts**
$\hat\alpha_4(\omega) = Q_4(\omega) - \sum_h \pi^v_h(\omega)\, \hat{v}_{h,3}$:

| Opening    | $Q_4$  | $-\sum_h \pi^v_h \hat v_{h,3}$       | $\hat\alpha_4$ |
| ---------- | ------ | ------------------------------------ | -------------- |
| $\omega_1$ | $1200$ | $50(0) + 50(6) + 50(5) + 0(8) = 550$ | $1750$         |
| $\omega_2$ | $600$  | $50(0) + 50(6) + 0(5) + 0(8) = 300$  | $900$          |
| $\omega_3$ | $250$  | $50(0) + 0(6) + 0(5) + 0(8) = 0$     | $250$          |

(The signs flip because $\pi^v < 0$ and the formula subtracts a
negative-times-positive product.)

**Aggregation** ($p = 1/3$):

$$
\bar\alpha_4 = \tfrac{1}{3}(1750 + 900 + 250) = \tfrac{2900}{3} \approx 966.7
$$

| Hydro | $\bar\pi^v_h$                                   |
| ----- | ----------------------------------------------- |
| H1    | $\tfrac{1}{3}(-50 - 50 - 50) = -50$             |
| H2    | $\tfrac{1}{3}(-50 - 50 + 0)  = -\tfrac{100}{3}$ |
| H3    | $\tfrac{1}{3}(-50 + 0 + 0)   = -\tfrac{50}{3}$  |
| H4    | $\tfrac{1}{3}(0 + 0 + 0)     = 0$               |

**Cut added to stage 3's LP**:

$$
\theta \;\geq\; \tfrac{2900}{3} - 50\, v_1 - \tfrac{100}{3}\, v_2 - \tfrac{50}{3}\, v_3 + 0 \cdot v_4
$$

**Sanity check.** At $v = \hat v_3 = (0, 6, 5, 8)$, the cut evaluates
to

$$
\tfrac{2900}{3} - 0 - \tfrac{600}{3} - \tfrac{250}{3} + 0
= \tfrac{2900 - 600 - 250}{3} = \tfrac{2050}{3} \approx 683.3.
$$

The probability-weighted expected stage-4 cost at the trial is
$\bar Q_4 = (1/3)(1200 + 600 + 250) = 2050/3 \approx 683.3$. The cut is
tight at the trial point, as required for cut validity. ✓

The four storage coefficients $(-50, -100/3, -50/3, 0)$ rank by how
much each reservoir reduces expected future cost. H1 is the most
valuable: thermal at B1 was active in all three openings, so an extra
unit at H1 saves $50$ in every scenario and the average is $-50$. H4
has zero coefficient: B4 was thermal-free in every opening, so storage
at H4 has no marginal value at this trial point.

### Stages 3, 2 and 1

The same procedure repeats at the earlier stages, with the cut from
the next stage active in the LP. At each stage:

1. Pin the incoming storage vector $\hat v_{t-1}$ (column bounds).
2. Solve all three opening LPs with the next-stage cut active.
3. Read four pinned-column reduced costs per opening (one per reservoir).
4. Compute per-opening intercepts via
   $\hat\alpha(\omega) = Q(\omega) - \sum_h \pi^v_h(\omega)\, \hat v_{h,t-1}$.
5. Aggregate by probability-weighted averaging into one
   5-coefficient cut (intercept plus four storage slopes).
6. Add the cut to the previous stage's LP.

By the end of the backward pass, stages 1 through 3 each carry one
cut; stage 4 has none.

---

## 6. The Cut as a 4-D Hyperplane

The fundamental change from the single-reservoir case is the
dimensionality of the cut. Each cut is now a hyperplane in
4-dimensional storage state space:

$$
\hat{V}_t^k(v) \;=\; \max_{i = 1, \ldots, k}
\Bigl\{ \bar\alpha^i + \bar\pi^{v,i}_1\, v_1 + \bar\pi^{v,i}_2\, v_2
+ \bar\pi^{v,i}_3\, v_3 + \bar\pi^{v,i}_4\, v_4 \Bigr\}.
$$

Several practical consequences follow:

**Per-reservoir marginal water value.** The four slopes
$\bar\pi^v_h$ at the iteration-1 stage-3 cut — $-50$, $-100/3$,
$-50/3$, $0$ — encode where storage matters most at the visited
trial point. The optimiser at stage 3 sees these slopes and
preferentially holds water at H1 (highest marginal value) and
releases water at H4 (zero marginal value) when both choices are
available.

**Cut tightness is local, not global.** The cut is a tangent
hyperplane at the trial point only; far from the trial point the
hyperplane is a loose lower bound on the true value function. The
forward pass spreads trial points across the storage state space as
iterations progress, and each new trial point produces a cut that
tightens the approximation in its neighbourhood. The pointwise
maximum over many such hyperplanes converges to the convex value
function.

**Per-bus thermal regime drives slope structure.** A bus whose
thermal is always idle (B4 in this trial) gets $\bar\pi^v_h = 0$;
the corresponding reservoir's storage has no marginal value at the
visited state. As subsequent iterations sample trial points where
B4 also runs short, that reservoir's slope becomes negative in those
cuts, and the cumulative cut pool eventually covers the region
where every reservoir's storage carries a non-zero marginal value.

---

## 7. Convergence on This Case

The relative gap

$$
\text{gap}^k = \frac{\bar z^k - \underline z^k}{\max(1, |\bar z^k|)}
$$

narrows as cuts accumulate. Convergence is faster than for one
reservoir because the four-reservoir cuts contain four times as much
information per iteration, but the state space being explored is also
larger; the practical iteration counts depend on the demand-to-inflow
ratios, the reservoir capacities, and the variance of the inflows.
The stopping rule fires when the gap falls below the configured
tolerance or the iteration limit is reached — see
[Stopping Rules](/math/stopping-rules) for the available
criteria.

---

## 8. What This Example Does Not Show

The toy walkthrough above keeps to four reservoirs at four buses with
no transmission. It does not cover:

- **Transmission networks**: the actual `examples/4ree/` case has two
  transmission lines (SUDESTE–SUL, SUDESTE–NORDESTE) that allow
  cheap thermal at one bus to serve another. With transmission, the
  load balance becomes a network constraint and the per-bus thermal
  share depends on line capacities and exchange costs. The cut
  structure does not change — still one storage coefficient per
  reservoir — but the per-opening LPs are no longer separable across
  buses.
- **Cascade coupling**: in branched cascades, downstream reservoirs
  receive upstream releases via a water-balance term
  $v_h = v^{in}_h + a_h - q_h - s_h + \sum_{u \in \text{upstream}}(q_u + s_u)$;
  the storage cut coefficient at upstream plants then carries the
  expected downstream value of released water. See
  [System Elements](/math/system-elements) for cascade topology
  and [Cut Management](/math/cut-management) for how cascade
  sensitivities propagate through the pinned-column reduced cost.
- **FPHA production model**: nonlinear head-dependent productivity
  approximated by piecewise-linear hyperplanes; one of the planes
  binds at the optimum and contributes to the storage cut
  coefficient. See [Hydro Production Models](/math/hydro-production-models).
- **Spatial inflow correlation**: when a `correlation.json` file is
  supplied, the per-hydro innovations are drawn from a correlated
  multivariate normal via spectral factorisation. See
  [PAR Inflow Model](/math/par-inflow-model) section 8.
- **Autoregressive inflow memory**: a PAR(p) model with $p \geq 1$
  adds one lag state variable per hydro per lag and one AR-lag cut
  coefficient per lag; the cut becomes a hyperplane in storage _and_
  lag state space.
- **Risk measures**: CVaR weighting that shifts cut aggregation
  probabilities away from uniform $p = 1/N$ toward worst scenarios,
  raising cut intercepts and slopes in the dry direction. See
  [Risk Measures](/math/risk-measures).
- **Cyclic policy graphs**: the four-stage horizon terminates without
  a cut linking back to stage 1. Cyclic-mode SDDP — periodic policy
  graphs where the last stage's cuts would feed into the first stage —
  is a reserved target design; Cobre's policy graph loader accepts only
  `finite_horizon` today. See [Horizon Modes](/math/horizon-modes).
- **Multi-resolution coupling**: weekly intra-stage blocks embedded
  in a monthly horizon, with policy transfer between resolutions.
  See [Multi-Resolution Studies](/math/multi-resolution-studies).

---

## Cross-References

- [Toy Single-Reservoir Walkthrough](/examples/toy-single-reservoir) — Single-reservoir baseline; core SDDP loop, 0-order inflow, forward/backward/cut in the simplest setting
- [LP Formulation](/math/lp-formulation) — Complete stage LP, column and row layout, column-bound state pinning, reduced-cost extraction
- [System Elements](/math/system-elements) — Hydro plant element, cascade topology (not exercised here), water-balance convention, FPHA overview
- [Hydro Production Models](/math/hydro-production-models) — Constant-productivity (used here) and FPHA hyperplane fitting; impact on Benders cut coefficients
- [PAR Inflow Model](/math/par-inflow-model) — Inflow model definition; the $p = 0$ degenerate case (white noise) used here; spatial correlation factorisation for multivariate cases
- [Cut Management](/math/cut-management) — Dual extraction, per-opening intercepts, single-cut aggregation; sign convention $\pi^v = \partial Q/\partial \hat v$
- [Risk Measures](/math/risk-measures) — CVaR definition, EAVaR convex combination, risk-adjusted aggregation weights
- [Horizon Modes](/math/horizon-modes) — Finite (supported) vs. reserved cyclic policy graphs and the season-indexed cut pool
