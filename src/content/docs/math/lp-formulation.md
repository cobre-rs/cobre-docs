---
title: LP Formulation
description: Complete stage subproblem LP — objective taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function.
---

## Purpose

This spec presents the complete stage subproblem LP for the Cobre SDDP solver: the objective function with its cost taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function. It uses the **parallel blocks** formulation by default.

**Reading order**: [SDDP algorithm](/math/sddp-algorithm) → [system elements](/math/system-elements) → **this spec** → [equipment formulations](/math/equipment-formulations)

For what each physical element represents and its decision variables, see [system elements](/math/system-elements). For variable naming conventions and index sets, see [notation conventions](/overview/notation-conventions).

## 1. Cost and Penalty Taxonomy

The objective function includes three categories of penalty/cost terms plus resource costs. This taxonomy aligns with [Penalty System](/math/penalty-system). Understanding these categories is essential for setting appropriate parameter values and interpreting solution reports.

### 1.1 Resource Costs (Actual Operating Expenses)

Resource costs represent actual generation or contractual expenditures:

| Cost               | Symbol         | Units  | Objective Term                                           |
| ------------------ | -------------- | ------ | -------------------------------------------------------- |
| Thermal generation | $c^{th}_{j,s}$ | \$/MWh | $\sum_{j,k,s} \tau_k \cdot c^{th}_{j,s} \cdot g_{j,k,s}$ |
| Contract dispatch  | $c^{ctr}_c$    | \$/MWh | $\sum_{c,k} \tau_k \cdot c^{ctr}_c \cdot \chi_{c,k}$     |

Contract prices are positive for imports (cost) and negative for exports (revenue), so a single summation naturally handles both directions. See [system elements §8](/math/system-elements) for the unidirectional contract model.

:::note[Note on Pumping]
Pumping stations do not have an explicit cost parameter. The cost of pumping is implicitly determined by the marginal cost of energy at the bus where the pump is connected — see [equipment formulations](/math/equipment-formulations) for details.
:::

### 1.2 Category 1: Recourse Slacks (LP Feasibility)

These ensure the SDDP algorithm has relatively complete recourse — every subproblem must be feasible regardless of scenario realization:

| Penalty           | Symbol          | Units  | Purpose                              |
| ----------------- | --------------- | ------ | ------------------------------------ |
| Deficit           | $c^{def}_{b,s}$ | \$/MWh | Value of unserved energy (piecewise) |
| Excess generation | $c^{exc}_b$     | \$/MWh | Absorb uncontrollable surplus        |

### 1.3 Category 2: Constraint Violation Penalties (Policy Shaping)

These provide slack for physical or operational constraints that may be impossible to satisfy under extreme conditions. Their cost must be high enough to affect the value function in earlier stages:

| Penalty                  | Symbol       | Units       | Violated Constraint                                      |
| ------------------------ | ------------ | ----------- | -------------------------------------------------------- |
| Storage below minimum    | $c^{sv-}_h$  | \$/hm³      | $v_h \geq \underline{V}_h$ (filling hydro, from its entry stage) |
| Filling target shortfall | $c^{fill}_h$ | \$/hm³      | $v_h \geq V^{\text{target}}_t$ (per-stage filling floor) |
| Turbined flow minimum    | $c^{tv-}_h$  | \$/(m³/s·h) | $q_{h,b,k} \geq \underline{Q}_{h,b}$ (per cell)          |
| Outflow minimum          | $c^{ov-}_h$  | \$/(m³/s·h) | $o_{h,k} \geq \underline{O}_h$                           |
| Outflow maximum          | $c^{ov+}_h$  | \$/(m³/s·h) | $o_{h,k} \leq \bar{O}_h$                                 |
| Generation minimum       | $c^{gv-}_h$  | \$/MWh      | $g_{h,b,k} \geq \underline{G}_{h,b}$ (per cell)          |
| Evaporation above target | $c^{ev+}_h$  | \$/(m³/s·h) | Net evaporation flow above the linearized target         |
| Evaporation below target | $c^{ev-}_h$  | \$/(m³/s·h) | Net evaporation flow below the linearized target         |
| Withdrawal above target  | $c^{wv+}_h$  | \$/(m³/s·h) | Realized withdrawal above the signed target $r_h$        |
| Withdrawal below target  | $c^{wv-}_h$  | \$/(m³/s·h) | Realized withdrawal below the signed target $r_h$        |

### 1.4 Category 3: Regularization Costs (Solution Guidance)

Small costs that guide the solver toward physically preferred solutions when the LP would otherwise be indifferent. Must be orders of magnitude smaller than any economic cost:

| Cost               | Symbol          | Units       | Purpose                                         |
| ------------------ | --------------- | ----------- | ----------------------------------------------- |
| Spillage           | $c^{spill}_h$   | \$/(m³/s·h) | Prefer turbining over spilling when indifferent |
| FPHA turbined flow | $c^{fpha}_h$    | \$/(m³/s·h) | Prevent interior FPHA solutions (FPHA-only)     |
| Diversion          | $c^{div}_h$     | \$/(m³/s·h) | Prefer main channel flow                        |
| Curtailment        | $c^{curt}_r$    | \$/MWh      | Prioritize using available NCS generation       |
| Exchange           | $c^{exch}_n$ | \$/MWh      | Prevent unnecessary power flows                 |

:::note[Note]
Regularization costs should be at least 2-3 orders of magnitude smaller than economic costs to avoid distorting the optimal solution.
:::

### 1.5 Penalty Priority Ordering

The following ordering must be maintained (from highest to lowest):

$$
c^{sv-} > c^{def} > c^{tv-}, c^{ov\pm}, c^{gv-}, c^{ev\pm}, c^{wv\pm} > c^{th}, c^{ctr} > c^{spill}, c^{fpha}, c^{div}, c^{curt}, c^{exch}
$$

with the filling-target penalty pinned **below deficit** on a separate rung: $c^{def} > c^{fill}$.

1. **Storage violation** ($c^{sv-}$): Highest penalty — it prices the soft dead-volume floor of a filling hydro once it operates (every other operating hydro's dead volume is a hard bound), so it must exceed deficit
2. **Deficit** ($c^{def}$): Value of lost load; exceeds any generation cost
3. **Constraint violations** ($c^{tv-}$, $c^{ov\pm}$, $c^{gv-}$, $c^{ev\pm}$, $c^{wv\pm}$): Exceed typical marginal cost but allow violation when physically necessary
4. **Resource costs** ($c^{th}$, $c^{ctr}$): Market-based or fuel-based
5. **Regularization** ($c^{spill}$, $c^{fpha}$, $c^{div}$, $c^{curt}$, $c^{exch}$): Near-zero
6. **Filling target** ($c^{fill}$): Pinned below deficit — a commissioning fill schedule is not defended as hard as load serving. Its position relative to the operational-constraint tier (item 3) is left to study calibration.

For the full penalty specification, cascade resolution, and stage-varying overrides, see [Penalty System](/math/penalty-system).

:::note[Note on Thermal Plants]
Thermal bounds ($\underline{G}_j$, $\bar{G}_j$) are hard constraints with no slack variables. Thermal dispatch is directly controllable, unlike hydro constraints that may be violated due to exogenous inflow uncertainty.
:::

:::note[FPHA validation rule]
For each hydro using the `fpha` production model, $c^{fpha}_h > c^{spill}_h$ must hold. See [Penalty System](/math/penalty-system).
:::

### 1.6 Objective Function Structure

The complete stage objective is:

$$
\min \; \underbrace{C^{resource}}_{\text{thermal, contracts}} + \underbrace{C^{recourse}}_{\text{deficit, excess}} + \underbrace{C^{violation}}_{\text{constraint slacks}} + \underbrace{C^{regularization}}_{\text{spillage, exchange, ...}} + \theta
$$

where each component is summed over blocks with appropriate time weighting:

$$
C^{component} = \sum_{k \in \mathcal{K}} \tau_k \cdot (\text{cost terms for component})
$$

## 2. Objective Function

$$
\min \sum_{k \in \mathcal{K}} \tau_k \Bigg[
  \underbrace{\sum_{j \in \mathcal{T}} \sum_s c^{th}_{j,s} g_{j,k,s}}_{\text{Thermal cost}}
  + \underbrace{\sum_{c \in \mathcal{C}} c^{ctr}_c \chi_{c,k}}_{\text{Contract cost}}
$$

$$
  + \underbrace{\sum_{b \in \mathcal{B}} \sum_{s \in \mathcal{S}_b} c^{def}_{b,s} \delta_{b,k,s}}_{\text{Deficit (piecewise)}}
  + \underbrace{\sum_{b \in \mathcal{B}} c^{exc}_b \epsilon_{b,k}}_{\text{Excess}}
$$

$$
  + \underbrace{\sum_{h \in \mathcal{H}} c^{spill}_h s_{h,k}
  + \sum_{h \in \mathcal{H}^{fpha}} c^{fpha}_h q_{h,k}
  + \sum_{h \in \mathcal{H}} c^{div}_h u_{h,k}}_{\text{Hydro regularization}}
$$

$$
  + \underbrace{\sum_{r \in \mathcal{R}} c^{curt}_r (A_r - g^{nc}_{r,k})}_{\text{Curtailment (regularization)}}
  + \underbrace{\sum_{n \in \mathcal{L}} c^{exch}_n (f^+_{n,k} + f^-_{n,k})}_{\text{Exchange (regularization)}}
$$

$$
  + \underbrace{\text{Constraint violation penalties}}_{\text{See }\S 9}
\Bigg]
$$

$$
+ \underbrace{\sum_{h \in \mathcal{H}} \Big[ c^{sv-}_h \sigma^{v-}_h + c^{fill}_h \sigma^{fill}_h \Big]}_{\text{Storage violations (not per-block)}}
+ \; \theta
$$

:::note[Note on storage violation penalties]
Storage violation penalties ($\sigma^{v-}_h$, $\sigma^{fill}_h$) are **not** multiplied by $\tau_k$ because they apply to end-of-stage storage (hm³), not to per-block flow rates. All other penalty terms are per-block and carry the $\tau_k$ weighting. Contract prices $c^{ctr}_c$ are positive for imports and negative for exports, so a single sum handles both. $\sigma^{v-}_h$ exists only for a filling hydro from its entry stage on and $\sigma^{fill}_h$ only during its filling window; for every other hydro both are absent.
:::

## 3. Load Balance Constraint

Each hydro plant $h$ is partitioned into one or more **(hydro, bus) cells** — one cell per distinct bus among the plant's declared unit groups (see [system elements §5](/math/system-elements)). $\mathcal{B}_h$ denotes the set of buses hosting one of $h$'s cells; $\mathcal{H}_b$ denotes the hydros with a cell at bus $b$ (i.e. $b \in \mathcal{B}_h$). $g_{h,b,k}$ is the generation of hydro $h$'s cell at bus $b$, block $k$ — the quantity that actually injects at $b$. A plant whose groups share a single bus has $|\mathcal{B}_h| = 1$, and $g_{h,b,k}$ collapses to the single-cell $g_{h,k}$ used everywhere else in this spec.

For each bus $b \in \mathcal{B}$ and block $k \in \mathcal{K}$:

$$
\sum_{h \in \mathcal{H}_b} g_{h,b,k} + \sum_{j \in \mathcal{T}_b} \sum_s g_{j,k,s}
+ \sum_{r \in \mathcal{R}_b} g^{nc}_{r,k}
+ \sum_{c \in \mathcal{C}^{imp}_b} \chi_{c,k}
$$

$$
+ \sum_{n: \text{target}=b} f^+_{n,k} + \sum_{n: \text{source}=b} f^-_{n,k}
$$

$$
- \sum_{n: \text{source}=b} f^+_{n,k} - \sum_{n: \text{target}=b} f^-_{n,k}
- \sum_{c \in \mathcal{C}^{exp}_b} \chi_{c,k}
- \sum_{y \in \mathcal{P}_b} \rho^{pump}_y p_{y,k}
+ \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k}
$$

**Dual variable**: $\pi^{lb}_{b,k}$ (marginal cost of energy at bus $b$, block $k$, in \$/MW; divide by $\tau_k$ for \$/MWh — see [Variable Units Convention](/math/system-elements))

For the physical meaning of each element in the balance, see [system elements](/math/system-elements).

## 4. Hydro Water Balance

Every hydro $h \in \mathcal{H}$ has one water-balance row on a parallel stage and one per block on a chronological stage ([Block Formulations](/math/block-formulations)); every LP variable is on the left-hand side.

### Parallel-Stage Row

$$
\begin{aligned}
& v_h - v^{in}_h - b^{\mathrm{in}}_{h,1}
  - \zeta \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_h \big) \\
& \quad + \sum_{k \in \mathcal{K}} \zeta_k \Big( q_{h,k} + s_{h,k} + u_{h,k}
  - \sum_{h' \in \mathcal{U}_h} \nu_{h',t,0} \, (q_{h',k} + s_{h',k})
  - \sum_{h':\,\text{div}=h} u_{h',k} \\
& \qquad + \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta \, r_h
\end{aligned}
$$

### Chronological-Stage Rows

For each block $k \in \mathcal{K}$, with $v_{h,0} = v^{in}_h$ and $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
\begin{aligned}
& v_{h,k} - v_{h,k-1} - \phi_{h,k} \, b^{\mathrm{in}}_{h,1}
  - \zeta_k \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_{h,k} \big)
  + \zeta_k \big( q_{h,k} + s_{h,k} + u_{h,k} \big) \\
& \quad - \sum_{h' \in \mathcal{U}_h} \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \zeta_{k'} \, (q_{h',k'} + s_{h',k'})
  - \zeta_k \sum_{h':\,\text{div}=h} u_{h',k}
  + \zeta_k \Big( \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta_k \, r_h
\end{aligned}
$$

### Row Terms

- $v_h$ and $v^{in}_h$ = outgoing and incoming storage; $v^{in}_h$ is pinned to the trial value by its column bounds (§4a). On a chronological stage $v_{h,k}$ is the storage at the end of block $k$
- $b^{\mathrm{in}}_{h,1}$ = in-transit volume maturing at this stage on the travel-time arcs into $h$, in hm³ and therefore outside the conversion (§5d); a chronological stage spreads it over its blocks by the arrival density $\phi_{h,k}$, $\sum_k \phi_{h,k} = 1$. Absent when no travel-time arc enters $h$
- $z_h = a_h$ = realized incremental inflow (§5b), so block $k$ of a chronological stage receives the share $w_k\,\zeta\,\sigma_{m(t)}\,\varepsilon_t$ of the innovation
- $\sigma^{inf}_h$ = inflow non-negativity slack, present under the penalty-based methods, which adds water (see [Inflow Non-Negativity](/math/inflow-nonnegativity))
- $r_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ = signed stage-level withdrawal target ($r_h < 0$ adds water) and its stage-level under- and over-delivery slacks; the realized withdrawal is $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$, with the slack caps in §9
- $e_h$ / $e_{h,k}$ = signed net evaporation of a hydro with an evaporation model (a negative value is net rainfall on the lake and adds water): one stage-level column on a parallel stage of any block count, one per block on a chronological stage, each a bounded column tied to storage by its evaporation row (see [Evaporation Row](#evaporation-row))
- $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$, $s_{h,k}$, $u_{h,k}$ = the plant's own turbined, spilled and diverted flow in block $k$; every (hydro, bus) cell's turbined column carries the same coefficient, and spillage and diversion are single per-plant columns
- Upstream release: only the turbined and spilled flow of each $h' \in \mathcal{U}_h$ reaches $h$; a plant's diverted flow reaches only its diversion target (the $\text{div}$ sum)
- $\nu_{h',t,0} = (H_t - \Delta^{tt}_{h'})^+ / H_t$ = same-stage share of the release of $h'$ on a parallel stage, with $H_t$ the duration of stage $t$ and $\Delta^{tt}_{h'}$ the travel time of $h'$'s main cascade arc ($0$ when none is declared, so the share is $1$); the remaining $1 - \nu_{h',t,0}$ is deposited into the in-transit buckets (§5d)
- $\nu^{k' \to k}_{h',t}$ = within-stage routing share on a chronological stage: the fraction of $h'$'s block-$k'$ release that reaches $h$'s block-$k$ row in the same stage, $k \ge k'$. Without a travel time $\nu^{k \to k}_{h',t} = 1$ and $\nu^{k' \to k}_{h',t} = 0$ for $k' < k$; the rest of the release is deposited into the buckets (§5d)
- $p_{y,k}$ = pumped flow of station $y$, out of its source plant's row and into its destination plant's row (see [Equipment Formulations](/math/equipment-formulations)); on a parallel stage every block's pumped flow enters the single stage row
- $\zeta = 0.0036 \sum_{k \in \mathcal{K}} \tau_k$ and $\zeta_k = 0.0036\,\tau_k = w_k\,\zeta$ = stage and block flow-to-volume conversions, with $\tau_k$ the duration of block $k$ in hours and $w_k = \tau_k / \sum_{k' \in \mathcal{K}} \tau_{k'}$ its weight, so $\sum_k \zeta_k = \zeta$

### PreFilling Pass-Through

A PreFilling hydro (see [System Elements](/math/system-elements#not-yet-commissioned-hydros-prefilling) for the phase) has the frozen identity row $v_h - v^{in}_h = 0$, and on a chronological stage $v_{h,k} - v_{h,k-1} = 0$ per block, with right-hand side $0$. Its local inflow $z_h$, the releases of its upstream plants and the flows diverted into it enter the row of the first non-PreFilling plant downstream with the coefficients they would carry on the PreFilling plant's own row ($-\zeta$ on $z_h$ on a parallel stage and $-\zeta_k$ on each block row of a chronological stage, $-\zeta_k$ on every block-$k$ flow) and no travel-time share, and its withdrawal target moves to that plant's right-hand side. With no such plant downstream the water leaves the system.

### Summing the Block Rows

Summing a chronological stage's block rows over $k \in \mathcal{K}$ telescopes the storage terms to $v_h - v^{in}_h$, returns $b^{\mathrm{in}}_{h,1}$ ($\sum_k \phi_{h,k} = 1$), and returns the parallel coefficients of $z_h$, $\sigma^{inf}_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ and the right-hand side ($\sum_k \zeta_k = \zeta$); the per-block flows keep their $\zeta_k$. The sum has the parallel row's form with two mode differences: $\sum_k \zeta_k\,e_{h,k}$ in place of $\zeta\,e_h$, and each upstream block-$k'$ release carrying its own same-stage share $\sum_{k \ge k'} \nu^{k' \to k}_{h',t}$ in place of $\nu_{h',t,0}$, whose duration-weighted average over $k'$ is $\nu_{h',t,0}$: $\sum_{k' \in \mathcal{K}} w_{k'} \sum_{k \ge k'} \nu^{k' \to k}_{h',t} = \nu_{h',t,0}$. With one block, or no travel time on the arc, the shares coincide.

:::note[Dimensional Consistency]
(see [Variable Units Convention](/math/system-elements)):

- Storage ($v_h$, $v^{in}_h$, $v_{h,k}$) and $b^{\mathrm{in}}_{h,1}$ are in hm³
- $\zeta$ and $\zeta_k$ are in hm³/(m³/s)
- Every flow, every slack and $r_h$ are in m³/s
- The conversion to volume happens only through $\zeta$ and $\zeta_k$
:::

**Dual variable**: $\pi^{wb}_h$ for the parallel row; on a chronological stage each block row has its own dual $\pi^{wb}_{h,k}$ (water value — captures the marginal value of incoming storage as seen through the hydro balance, but is **not** used directly as a cut coefficient; the cut coefficient comes from the reduced cost of the pinned incoming-storage column, see §4a and [cut management](/math/cut-management))

### Evaporation Row

Every hydro with an evaporation model has an evaporation row that ties its net evaporation to storage. A parallel stage, of any block count, has one row per such hydro, on the stage's incoming and outgoing storage:

$$
e_h - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v^{in}_h + v_h \big) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h}
$$

A chronological stage has one row per block $k \in \mathcal{K}$, on the block's own storages, with $v_{h,0} = v^{in}_h$ and $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
e_{h,k} - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v_{h,k-1} + v_{h,k} \big) - \sigma^{e+}_{h,k} + \sigma^{e-}_{h,k} = \gamma^{ev}_{0,h}
$$

- $\gamma^{ev}_{v,h}$ and $\gamma^{ev}_{0,h}$ = slope and intercept, at a reference volume, of the tangent of the evaporation flux of $h$: the evaporation coefficient of the stage's calendar month times the reservoir surface area from its area–volume curve, converted to a monthly-average rate in m³/s. Both are recomputed at every stage; the row's target is the tangent evaluated at the average of the two storages the row reads. The flux, and so $e_h$ or $e_{h,k}$, can be negative (net rainfall on the lake)
- $e_h$ / $e_{h,k}$ = net evaporation (Row Terms above), bounded symmetrically about zero by a fixed safety margin times $\lvert \gamma^{ev}_{0,h} + \gamma^{ev}_{v,h} \bar{V}_h \rvert$, the magnitude of the target at the maximum storage $\bar{V}_h$, recomputed at every stage; it is not a free column. It enters the parallel water-balance row as $\zeta \, e_h$ and the block-$k$ row of a chronological stage as $\zeta_k \, e_{h,k}$
- $\sigma^{e+}_h$ / $\sigma^{e+}_{h,k}$ and $\sigma^{e-}_h$ / $\sigma^{e-}_{h,k}$ = evaporation above and below the target, priced at $c^{ev+}_h$ and $c^{ev-}_h$: the row sets the evaporation to the target plus $\sigma^{e+}$ minus $\sigma^{e-}$. On a parallel stage the one pair is priced over the stage hours $H_t$, on a chronological stage each block's pair over its duration $\tau_k$ (§9)

With one block the parallel and chronological forms coincide, rows and pricing alike. A PreFilling hydro has no evaporation row.

## 4a. Incoming-Storage Pinning

The water balance (§4), FPHA hyperplanes (§6), and generic constraints (§10) all involve the incoming storage value $\hat{v}_h$. Rather than embedding $\hat{v}_h$ as a constant in the RHS of each of these constraints (which would require collecting duals from all of them to compute cut coefficients), Cobre introduces an explicit **incoming storage LP variable** $v^{in}_h$ that every such constraint references, and **pins** it to the trial value.

For each hydro $h \in \mathcal{H}$, the incoming-storage column (`storage_in`, §4b) is pinned by setting equal lower and upper **column bounds**:

$$
\underline{v}^{in}_h = \bar{v}^{in}_h = \hat{v}_h
$$

where:

- $v^{in}_h$ = LP variable representing the incoming storage for hydro $h$
- $\hat{v}_h$ = incoming state value (end-of-stage storage from the previous stage), written into both bounds per scenario via bound patching

:::note[Pinning by bounds not by a row]
The incoming state is pinned by **column bounds**, not by an explicit equality _constraint row_ $v^{in}_h = \hat{v}_h$ whose dual would be read: the equivalent fixing-row block is a permanent empty sentinel (§4b). Pinning by bounds keeps $N(1+P^{\max})$ redundant equality rows per stage out of the model (plus the anticipated-state rows, §5c); the two formulations are KKT-equivalent — see below.
:::

The variable $v^{in}_h$ then appears as an LP variable (not a constant) in all constraints that depend on incoming storage: the water balance (§4), the FPHA average storage computation (§6), and any generic constraints (§10) that reference incoming storage.

**Cut coefficient**: the storage cut coefficient $\beta^v_h$ is the **reduced cost** of the pinned `storage_in` column (unscaled by its prescaler column factor — see §12 (LP Scaling) and [cut management](/math/cut-management)). No fixing-constraint dual is involved.

**Why this design**: By LP duality, when a column is pinned at $\underline{x} = \bar{x}$ its reduced cost equals the sensitivity $\partial Q_t / \partial \hat{v}_h$ of the optimal value to the pinned bound — exactly the multiplier the equivalent equality row $v^{in}_h = \hat{v}_h$ would have carried (KKT parity). This sensitivity automatically accounts for all downstream effects through water balance, FPHA, and generic constraints, so a single reduced-cost value suffices — no combination of duals from multiple constraint types is needed. This is the same "fishing" technique used by SDDP.jl, realised through column bounds rather than a fixing row, and is analogous to how the AR lags (section 5a) are pinned for inflow history.

**Column count**: $N$ pinned incoming-storage columns, where $N = |\mathcal{H}|$ is the number of operating hydros. There is no corresponding fixing-row block.

## 4b. LP Column and Row Layout

LP column layout — state variables (storage, AR lags) first for contiguous
reduced-cost extraction, dispatch variables per block, and `θ` (future cost) last
for the Benders cuts, assembled with the constraint-row families below.

```d2
direction: down

columns: "Decision-variable columns — fixed contiguous order in x" {
  state: "1 · State (coupling)\nvₕ storage · aₕ,ℓ AR lags\npinned by column bounds; reduced costs → β"
  dispatch: "2 · Dispatch (per block k)\nflow · hydro · turbined · spill\nthermal · NCS · deficit"
  future: "3 · Future\nθ future cost (bounded by cuts)"
  state -> dispatch -> future
}

rows: "Constraint-row families" {
  grid-columns: 1
  lb: "Load balance — per bus, per block"
  wb: "Water balance — per hydro, per block"
  fix: "Fixing — incoming-state coupling"
  cut: "Benders cuts:  θ ≥ β₀ + βᵀx" {style.stroke-dash: 4}
}

columns -> rows: "assembled into the stage LP"
```

The stage LP uses a fixed column and row layout that places state variables first, followed by auxiliary and equipment columns. State is pinned by **column bounds** on the incoming-state columns (§4a, §5a, §5c, §5d), and cut coefficients are read as the **reduced costs** of those columns — so the fixed column order, not a fixed row order, is what enables contiguous coefficient extraction. With $N = |\mathcal{H}|$ hydros, $P^{\max}$ = maximum AR order, $A$ = number of anticipated thermals, $K_{\max} = \max_i K_i$, and $B$ = total in-transit bucket count (the sum, over receiving plants, of each plant's maturity-lag depth — §5d):

**Column layout**:

| Region                | Count | Description                                                                       |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| `storage`             | $N$   | Outgoing storage volumes (state) — first                                          |
| `inflow_lags`         | $N P^{\max}$  | AR lag variables (state) — after storage                                          |
| `transit_buckets_out` | $B$   | Outgoing in-transit bucket volumes (state, plant-major lag-minor) — after lags    |
| `anticipated_state`   | $K_{\max} A$ | Ring-buffer slots for anticipated thermals (state, slot-major plant-minor)        |
| `z_inflow`            | $N$   | Realized inflow (auxiliary, not state) — after the state block                    |
| `storage_in`          | $N$   | Incoming storage volumes (auxiliary, for §4a) — after z-inflow                    |
| `transit_buckets_in`  | $B$   | Incoming in-transit bucket volumes (auxiliary, pinned for §5d) — after storage_in |
| `theta`               | $1$   | Future cost variable — last of the state prefix                                   |

Equipment columns (turbine, spillage, diversion, thermal, anticipated-decision and anticipated-state-out, line flows, deficit, excess, slacks) follow immediately after `theta`. The `turbine` column family, and the FPHA `generation` column family, are indexed by **(hydro, bus) cell** rather than by plant — one column per cell (§3, §6) — while every other hydro equipment column (spillage, diversion) stays indexed by plant; a single-cell plant's layout is byte-identical to the pre-partition, per-plant form. The `transit_buckets_out` block is an identity-resolved state carrier (like `storage`, and mirroring the anticipated-state-out carrier of §5c): it holds the volume still in transit on each cascade arc, defined by in-LP ring shift and deposit rows rather than pinned, and the `transit_buckets_in` block is the matching pinned incoming copy read for the delayed-arrival water-balance entry and the cut coefficient (§5d). Two auxiliary blocks are reserved for anticipated thermals: $A$ **anticipated-decision** columns $g^{\mathrm{a}}_{i,t}$ carrying the commitment placed at this stage for delivery $K_i$ stages later, and $A$ **anticipated-state-out** columns $y^i_t$ used to decouple the post-shift state from the decision-write coefficient — see §5c.

The `z_inflow` region holds one free column per hydro representing the total realized inflow $z_h = a_h$ (m³/s) for each hydro at the current stage. These are auxiliary columns (zero objective cost, unbounded) whose primal values after solving give the realized inflow. They participate in the water balance (§4) and are defined by the z-inflow constraints (§5b).

**Row layout** (equality-constraint prefix):

Because state is pinned by column bounds (§4a, §5a, §5c, §5d) rather than by equality rows, there are **no** state-fixing rows: the former `storage_fixing` ($N$), `lag_fixing` ($N P^{\max}$), `transit_bucket_fixing` ($B$), and `anticipated_state_fixing` ($K_{\max} A$) row blocks are permanent empty sentinels (zero rows). The equality-constraint prefix therefore begins directly with the z-inflow definitions:

| Region     | Count | Description                                                         |
| ---------- | ----- | ------------------------------------------------------------------- |
| `z_inflow` | $N$   | Realized-inflow definition constraints (§5b) — first equality block |

Equipment rows (water balance, load balance, FPHA, evaporation, outflow bounds, anticipated-fishing and anticipated-state-out equalities, transit-bucket shift and deposit definitions, generic constraints, etc.) follow after the z-inflow rows.

Cut coefficients are **not** read from a contiguous dual slice over a fixing-row prefix. Instead, each incoming-state coordinate is pinned on its own LP column — `storage_in` for storage, `inflow_lags` for AR lags, `transit_buckets_in` for in-transit buckets, `anticipated_state` for anticipated-thermal slots — and its cut coefficient is the **reduced cost** of that column (§4a, [cut management](/math/cut-management)). The map from a state coordinate to its pinned column is fixed (`state_to_lp_incoming_column`), and each of these incoming-state column regions is contiguous, so all storage, inflow-lag, in-transit bucket, and anticipated-state coefficients are still gathered by reading a few contiguous slices — of the reduced-cost vector rather than the dual vector.

**Worked example** ($N = 3$, $P^{\max} = 2$, $A = 0$, $B = 0$ — no travel-time arcs): the storage region holds 3 columns, the AR lag region holds 6 (3 hydros × 2 lags), the z-inflow region holds 3, and the incoming-storage region holds 3, so `theta` is the 16th column. The state count (outgoing storage + AR lags) is $N(1 + P^{\max}) = 9$. With $B = 0$ the layout is byte-for-byte the bucket-free layout.

## 5. AR Inflow Dynamics

The realized inflow $z_h$ is determined by the PAR(p) autoregressive model:

$$
z_h = \underbrace{b_{h,m(t)}}_{\text{deterministic base}}
+ \underbrace{\sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell}}_{\text{lag contribution}}
+ \underbrace{\sigma_{m(t)} \cdot \varepsilon_t}_{\text{stochastic innovation}}
$$

To maintain the Markov property, lagged inflows $a_{h,\ell}$ are promoted to state variables pinned by column bounds — see section 5a below.

See [PAR(p) inflow model](/math/par-inflow-model) for the complete PAR(p) model specification.

## 5a. AR Lag Pinning

The AR dynamics equation (section 5) uses lagged inflows $a_{h,\ell}$ as LP variables. To maintain the Markov property in the SDDP decomposition, each lag variable is pinned to its incoming state value via equal lower and upper **column bounds** on the `inflow_lags` column. This binds the lag variables to the known incoming state, and the **reduced cost** of each pinned column provides the cut coefficient $\beta^{lag}_{h,\ell}$ for the corresponding inflow-lag dimension of the Benders cuts (section 11). Whether these lag dimensions actually enter the cut is governed by the stage's `state_variables` selection (which defaults to storage-only): when `inflow_lags` is disabled the lag columns are still pinned for the AR dynamics, but their reduced costs are projected out of the cut, yielding a storage-only cut even under a PAR($p$) fit — see [cut management](/math/cut-management).

For each hydro $h \in \mathcal{H}$ and each lag $\ell \in \{1, \ldots, P^{\max}\}$:

$$
\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}
$$

where:

- $a_{h,\ell}$ = LP variable representing the inflow at lag $\ell$ for hydro $h$
- $\hat{a}_{h,\ell}$ = incoming state value (inflow observation from $\ell$ stages ago), written into both bounds via bound patching
- $P^{\max}$ = maximum AR order across all hydros (uniform lag storage convention)

**Column count**: $N \times P^{\max}$ pinned lag columns, where $N = |\mathcal{H}|$ is the number of operating hydros and $P^{\max}$ is the system-wide maximum lag. All hydros store $P^{\max}$ lags regardless of their individual AR order $P_h$; hydros with $P_h < P^{\max}$ have zero-valued AR coefficients ($\psi_{m(t),\ell} = 0$ for $\ell > P_h$) in the dynamics equation, but their lag columns are still present and pinned. This uniform layout keeps the `inflow_lags` columns contiguous, so all lag cut coefficients are read in a single slice of the reduced-cost vector (section 4b). There is no corresponding lag-fixing row block.

**Cut coefficient**: $\beta^{lag}_{h,\ell}$ (marginal value of inflow history at lag $\ell$ for hydro $h$) is the reduced cost of the pinned `inflow_lags` column, unscaled by its prescaler column factor (§12, LP Scaling) — see [cut management](/math/cut-management).

## 5b. Realized-Inflow Definition Constraints (z-inflow)

For each hydro $h \in \mathcal{H}$, the LP includes an auxiliary variable $z_h$ representing the total realized inflow (m³/s) at the current stage. These variables are defined by equality constraints that combine the deterministic base, lag contributions, and stochastic noise:

$$
z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell} + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $z_h$ = LP variable representing the realized inflow for hydro $h$ (free column, zero cost)
- $b_{h,m(t)}$ = deterministic base (precomputed from seasonal means and AR coefficients — see [PAR(p) model §7.4](/math/par-inflow-model))
- $\psi_{m(t),\ell}$ = original-unit AR coefficients (constraint matrix entries, set once at LP construction)
- $a_{h,\ell}$ = LP variables for lagged inflows (state variables, fixed by §5a)
- $\sigma_{m(t)} \cdot \varepsilon_t$ = noise innovation (patched into the constraint RHS per scenario)

The z-inflow variable $z_h$ then enters the water balance constraint (§4) in place of the raw inflow term $a_h$, and its primal value after solving gives the realized inflow for reporting and simulation extraction.

The z-inflow columns sit between the AR lag columns and the incoming storage columns in the column layout (section 4b). Because state is pinned by column bounds rather than fixing rows, their constraint rows form the **first** equality block (section 4b). The RHS is patched per scenario with $b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t$, where $\varepsilon_t$ is the effective noise (possibly clamped for inflow non-negativity — see [Inflow Non-Negativity](/math/inflow-nonnegativity)). These are not state variables and do not contribute to cut coefficients.

**Constraint count**: $N$ total constraints, where $N = |\mathcal{H}|$ is the number of operating hydros. See section 4b for the row layout.

## 5c. Anticipated Thermal Dispatch

Anticipated thermals (see [System Elements §4](/math/system-elements)) introduce a per-plant ring buffer of $K_i$ pending commitments and a per-stage commitment column. The lead $K_i$ is the integer stage lead resolved from the plant's `lead_stages` (a stage count) or `lead_time_hours` (a physical duration end-anchored on the stage calendar); every commitment is bounded, costed, and commissioning-gated at its **delivery** stage $t + K_i$, not the decision stage. The incoming ring-buffer state is pinned by column bounds (like all other state, §4a); two constraint blocks then couple the remaining variables. The layout is engineered so that the reduced cost on slot 0 of the pinned anticipated-state column at stage $t + 1$ propagates back to the predecessor's commitment column via the standard SDDP cut machinery without any decision-side coefficient corrupting the routing.

### State pinning (column bounds, one per `(slot, plant)`)

For each plant $i \in \{1, \ldots, A\}$ and slot $s \in \{0, \ldots, K_{\max} - 1\}$, the anticipated-state slot column is pinned by equal column bounds:

$$
\underline{x}^{\mathrm{a}}_{s, i, t} \;=\; \bar{x}^{\mathrm{a}}_{s, i, t} \;=\; \widehat{x}^{\mathrm{a}}_{s, i, t}
$$

The value $\widehat{x}^{\mathrm{a}}_{s, i, t}$ is the incoming state from the previous stage's ring-buffer shift (or, at $t = 1$, the committed MW rate resolved **by date** from the pre-horizon commitment window covering delivery stage $s + 1$ — an externally-decided rate held constant over that window, not a value read positionally from an array). The slot is **pinned** by its column bounds alone; no decision-write coefficient appears anywhere on the slot column. The cut subgradient with respect to the incoming-state coordinate, $\partial Q_t / \partial \widehat{x}^{\mathrm{a}}_{s, i, t}$, is the **reduced cost** of the pinned slot column (§4a). Padding slots $s \geq K_i$ are pinned to zero by the same bounds; their reduced cost is zero because the slot carries no information. These seed windows tile the plant's leading delivery stages exactly — a committed 0 MW is written explicitly for any stage with no scheduled commitment, never implied by omission — the LP-level statement of the coverage contract detailed at [System Elements §4](/math/system-elements#anticipated-thermal-plants) and the software layer.

### Fishing equality (one row per anticipated plant, every stage)

For each plant $i$ and every stage $t \in \{1, \ldots, T\}$, the per-block generation of plant $i$ is bound to the matured commitment in slot 0:

$$
\sum_{k \in \mathcal{K}} \tau_k \cdot g_{i,k} \;-\; H_t \cdot x^{\mathrm{a}}_{0, i, t} \;=\; 0
$$

where $\tau_k$ is the block-$k$ duration and $H_t = \sum_{k \in \mathcal{K}} \tau_k$. The row is active at every study stage; at $t \leq K_i$ the slot-0 value comes from the seed rate for the window covering delivery stage $t$ and the LP cannot freely choose the per-block generation. From $t > K_i$ onward, slot 0 carries a past LP decision delivered via the ring buffer.

### State-out equality (one row per active plant)

For each plant $i$ active at stage $t$ (i.e., $t + K_i \leq T$), one auxiliary row pins the **anticipated-state-out** column $y^i_t$ to the decision $g^{\mathrm{a}}_{i,t}$:

$$
y^i_t \;-\; g^{\mathrm{a}}_{i,t} \;=\; 0
$$

The ring-buffer shift between stages uses $y^i_t$ — not $g^{\mathrm{a}}_{i,t}$ — as the value written into slot $K_i - 1$ of the next stage's incoming state. The auxiliary $y$ column carries zero objective cost and serves only as the "carrier" that decouples the post-shift state from the decision column. Without this decoupling, the decision column $g^{\mathrm{a}}_{i,t}$ would feed directly into the slot whose pinned reduced cost the next stage's cut reads back, corrupting the subgradient routing at $K_i = 1$ (slot 0 = slot $K_i - 1$ collision).

### Objective contributions

Two terms enter the objective for each anticipated plant:

$$
\sum_{i = 1}^{A} c_i(t + K_i) \cdot H_{t + K_i} \cdot d_{1 \to t + K_i} \cdot g^{\mathrm{a}}_{i,t}
\;-\;
\sum_{i \in \mathrm{deliver}(t)} \sum_{k \in \mathcal{K}} c_i(t) \cdot \tau_k \cdot d_{1 \to t} \cdot g_{i,k}
$$

The first sum is the **commitment cost discounted to the delivery stage** $t + K_i$. The second sum subtracts the standard per-block thermal cost at every delivery stage so the same MWh is not charged twice — once through the matured commitment and once through the per-block dispatch. Anticipated-state columns and anticipated-state-out columns carry zero objective cost; they are pure carriers of state. In run cost output this commitment term is reported as its own `anticipated_thermal_cost` category (zero when no anticipated plants are present), distinct from the per-block `thermal_cost`, so the named cost categories sum to the stage's immediate cost.

### Cut subgradient remapping

When the backward pass returns a subgradient on slot $(s, i)$ of stage $t + 1$ — read as the reduced cost of that pinned slot column — the cut-row builder maps it to a column in the **predecessor's** stage problem as follows:

- $s + 1 = K_i$ (slot 0 viewed from the next stage equals slot $K_i - 1$ viewed from this stage): the coefficient targets the predecessor's commitment column $g^{\mathrm{a}}_{i,t}$ directly. This is the only branch that fires for $K_i = 1$.
- $s + 1 < K_i$: the coefficient targets the predecessor's outgoing-state slot $s + 1$, which holds the same commitment one stage earlier in its journey through the ring buffer.
- $s \geq K_i$ (padding): identity remap; the reduced cost is structurally zero so the cut coefficient on the padded slot does not propagate any sensitivity.

The recursion guarantees that, no matter how many stages elapse between commitment and delivery, the marginal cost of a future obligation reaches the original $g^{\mathrm{a}}_i$ column it should price.

## 5d. Water Travel Time (In-Transit Buckets)

When an upstream release takes appreciable time to travel down the cascade, the water leaving a plant this stage does not reach its downstream neighbour in the same stage. Cobre models this as an **augmented in-transit state**: the volume still in transit on a cascade arc is carried through the Bellman recursion as extra state coordinates, exactly like storage (§4a) and AR lags (§5a). This subsection formulates that state, its pinning, the delayed-arrival water-balance entry, the ring that advances it, its cut coefficient, and the horizon limitation.

**Scope.** A hydro $h$ declares a travel-time arc when its `travel_time_hours` is present and strictly positive **and** it has a downstream plant; the diversion and pumping arcs carry no travel time (main cascade arc only). An absent or zero travel time is an instantaneous transfer — the upstream release enters the downstream water balance in the same stage (§4) and no state is added.

### In-transit bucket state

For each receiving (downstream) plant $h$ that has at least one incoming travel-time arc, the in-transit water destined for $h$ is discretized into **maturity lags** $d \in \{1, \ldots, L_h\}$. The bucket $b^{\mathrm{out}}_{h,d}$ (hm³) holds the aggregate volume — summed over every upstream arc feeding $h$ — that matures into plant $h$'s reservoir $d - 1$ stages after the current one. Lag $d = 1$ matures at the current stage; lag $d = L_h$ is the freshest deposit, furthest from delivery. The per-plant depth $L_h$ is the deepest maturity lag any arc into $h$ can reach on the stage calendar. The confluence of several arcs into one plant collapses into this single aggregated bucket block.

The buckets extend the state vector. With $B = \sum_h L_h$ the total bucket count, the state dimension is

$$
n_{\text{state}} = N(1 + P^{\max}) + B + A \, K_{\max}
$$

The bucket block sits **after** the AR inflow lags and **before** the anticipated-thermal slots in the canonical state order (§4b). Buckets are ordered canonically by $(\text{plant}, \text{lag})$ — the receiving plant in the same $(\texttt{operational\_start\_date}, \texttt{id})$ order every state block uses, then ascending maturity lag. When no arc is declared, $B = 0$ and the layout reproduces the bucket-free state byte-for-byte.

### State pinning (column bounds)

Like every other incoming state coordinate, each incoming bucket is carried on its own LP column (`transit_buckets_in`, §4b) and pinned to its trial value by equal lower and upper **column bounds**:

$$
\underline{b}^{\,\mathrm{in}}_{h,d} = \bar{b}^{\,\mathrm{in}}_{h,d} = \hat{b}_{h,d}
$$

where $\hat{b}_{h,d}$ is the incoming in-transit volume carried from the previous stage's ring shift (or, at the first stage, the seed derived from `past_defluences` — see [system elements §5](/math/system-elements) and the hydro Implementation notes). The **reduced cost** of the pinned bucket column is the cut coefficient for that in-transit dimension (see below) — the same regime used for storage (§4a) and AR lags (§5a). No fixing row is involved; the `transit_bucket_fixing` block is a permanent empty sentinel like the other state blocks (§4b).

### Delayed-arrival water-balance entry

The bucket maturing at the current stage, $b^{\mathrm{in}}_{h,1}$, delivers its volume into receiving plant $h$'s water balance (§4). Because the bucket is already an accumulated volume (hm³), it enters the balance directly — outside the $\zeta$ flow-to-volume conversion — with a $-1.0$ coefficient in the all-variables-on-the-LHS form:

$$
v_h - v^{\mathrm{in}}_h - b^{\mathrm{in}}_{h,1} - \zeta\big[\,\cdots\,\big] = 0
$$

Equivalently, $b^{\mathrm{in}}_{h,1}$ is a stage-level inflow added to the reservoir. Because the confluence of several upstream arcs is already summed inside the single state coordinate, exactly one delayed-arrival entry appears per receiving plant.

Under the parallel-blocks formulation the maturing bucket is a single stage-level entry. Under the [chronological-blocks formulation](/math/block-formulations), the same volume is delivered across the arrival stage's own blocks, weighted by a fixed **arrival density** $\phi_{h,k} \ge 0$ with $\sum_k \phi_{h,k} = 1$, resolved against the arrival stage's block partition. The arrival density is a single fixed split per maturing bucket — it does not depend on which source block released the water, an accepted modeling bound when the release and arrival stages partition their hours differently.

On a declared travel-time arc the share $\nu_{h',t,0}$ of each release ($\nu^{k' \to k}_{h',t}$ on a chronological stage) reaches the downstream row in the release stage (§4); the remaining share is deposited into the buckets at release and reaches the downstream plant as this delayed-arrival term at maturity.

### Ring advance (DeliveryRing)

The buckets advance through the recursion with the same generic **DeliveryRing** primitive that carries the anticipated-thermal ring (§5c): a slot-major, lane-minor grid of $B$ outgoing and $B$ incoming columns, one lane per receiving plant. The ring performs a Markov-1 slot advance — the water at maturity lag $d + 1$ at one stage is at maturity lag $d$ at the next, one step closer to delivery. Within each stage this is encoded by in-LP **shift rows** binding the outgoing carrier to the incoming state one slot deeper,

$$
b^{\mathrm{out}}_{h,d} \equiv b^{\mathrm{in}}_{h,d+1}
$$

(one row per interior slot), together with the cross-stage identity that carries the outgoing state into the next stage's incoming state — never an out-of-LP shift. The outgoing bucket state $b^{\mathrm{out}}_{h,d}$ is resolved by identity — it is a genuine LP column, part of $n_{\text{state}}$ — and its freshest slots receive the current stage's upstream releases through per-arc **deposit** entries: each release, scaled by the fraction of it maturing at each reachable lag (these fractions sum to $1 - \nu_{h',t,0}$, §4), is written into the corresponding outgoing bucket slots. This is the direct analogue of the anticipated ring's decision-write, reusing the same skeleton.

### Cut coefficient

Because the incoming bucket column is pinned at equal bounds, its reduced cost is the sensitivity $\partial Q_t / \partial \hat{b}_{h,d}$ of the optimal stage cost to the in-transit volume, unscaled by the column prescaler (§12, LP Scaling):

$$
\beta^{b}_{h,d} = \bar{c}^{\,b}_{h,d} / d^{col}_{h,d}
$$

Transit buckets are **always** included in the cut projection — never gated by the per-stage `state_variables` selection that can drop the storage or inflow-lag dimensions (see [cut management](/math/cut-management)). Each cut therefore carries one coefficient per bucket dimension, contiguous with the storage, lag, and anticipated coefficients and read from the same reduced-cost mechanism (§11). In the policy manifest a bucket dimension is tagged with the **downstream** hydro as its entity and the maturity lag as its sub-index.

### Horizon limitation

In-transit volume that would mature **after the study's last stage** is dropped and not credited to terminal storage — but only **when no terminal boundary future-cost function is loaded**. Absent a boundary, a release late in the horizon whose travel time carries it past the final stage $T$ leaves the modeled system without arriving: the deepest maturity lag active at stage $t$ is capped at $T - 1 - t$, so no bucket ever points beyond the horizon and the share is discarded rather than misdirected onto an earlier lag. When a [terminal boundary](/math/post-study-boundary) is loaded instead, this cap is lifted: the terminal deep-lag in-transit slots are held live rather than capped away, carried into the terminal stage's incoming-state vector, and reach the boundary-priced cut-state projection. The still-in-transit water is valued at the boundary rather than discarded, priced through the same reduced-cost cut mechanism the buckets already use (see Cut coefficient, above) — transit buckets are always in the cut projection, so a held-live bucket needs no separate pricing path.

## 6. Hydro Generation Constraints

Cobre supports two production models, in increasing order of complexity. A third model name, linearized head, is a reserved alias that resolves to constant productivity in every phase — see [hydro production models §3](/math/hydro-production-models). The model can vary by stage or season per hydro.

Both models are evaluated **per cell** $(h, b)$ (§3) rather than per plant; a single-cell plant's constraint is byte-identical to the pre-partition, per-plant form.

**Constant Productivity Model** (for each cell $(h, b)$ of hydro $h \in \mathcal{H}^{const}$, block $k$):

$$
g_{h,b,k} = \rho_h \cdot q_{h,b,k}
$$

Constant-productivity hydros carry no separate generation column: $g_{h,b,k}$ is this direct multiple of the cell's own turbined-flow column, so a cell's generation bound is enforced by folding it into that column's bound (§8) rather than by a bound on $g_{h,b,k}$ itself.

**FPHA Model** (for each plane $m \in \mathcal{M}_h$, cell $(h, b)$ of hydro $h \in \mathcal{H}^{fpha}$, block $k$):

$$
g_{h,b,k} \leq \lambda_{h,b} \big( \gamma^m_0 + \gamma^m_v \cdot v^{avg}_h + \gamma^m_s \cdot s_{h,k} \big) + \gamma^m_q \cdot q_{h,b,k}
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is the average storage during the stage, with $v^{in}_h$ being the incoming storage LP variable (§4a) and $v_h$ the end-of-stage storage — a single plant-level quantity shared by every cell, since storage is not partitioned. $\lambda_{h,b}$ is cell $(h,b)$'s **apportionment share** of plant $h$'s declared turbine capacity,

$$
\lambda_{h,b} = \frac{\sum_{u \,\in\, (h,b)} \bar{Q}_u}{\sum_{u \,\in\, h} \bar{Q}_u}
$$

(the ratio of the cell's own unit groups' declared `max_turbined_m3s` to the plant's total, $0$ when the plant's total is $0$), satisfying $\sum_{b \in \mathcal{B}_h} \lambda_{h,b} = 1$. Only the plane's flow-independent part — the intercept $\gamma^m_0$, the storage term, and the spillage term — is apportioned by $\lambda_{h,b}$; the flow coefficient $\gamma^m_q$ stays on the cell's own $q_{h,b,k}$ unscaled, because it alone is homogeneous in the cell partition (summing the per-cell rows at fixed $v^{avg}_h$, $s_{h,k}$, and $\sum_b q_{h,b,k}$ recovers the plant-level bound this replaces). A single-cell plant has $\lambda_{h,b} = 1$ exactly, reproducing the pre-partition row with no special case.

**Generation Bounds** (per cell $(h, b)$, block $k$ — the FPHA generation column's own bound; a constant-productivity cell has no such column, so its generation cap is folded into the turbined-flow bound below instead):

$$
\underline{G}_{h,b} - \sigma^{g-}_{h,b,k} \leq g_{h,b,k} \leq \bar{G}_{h,b}
$$

$$
\underline{G}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{G}_u, \qquad \bar{G}_{h,b} = \min\!\Big( \sum_{u \,\in\, (h,b)} \bar{G}_u,\ \ \bar{G}_h \Big)
$$

Generation bounds are user-defined (declared per unit group, not derived from turbined flow). The lower bound is soft, with one slack $\sigma^{g-}_{h,b,k}$ **per cell** — priced at the plant's own penalty $c^{gv-}_h$ at full magnitude on every cell of a split plant, never divided by cell count; a constant-productivity cell's floor couples this same slack to $\rho_h \cdot q_{h,b,k}$ rather than to a generation column. The upper bound's plain sum over the cell's own unit groups closes against the plant's own resolved maximum $\bar{G}_h$ — a bounds override may never raise a cell above it. See [system elements §5](/math/system-elements). Matches the per-cell $\sigma^{g-}_{h,b,k}$ defined in [notation conventions §4.3](/overview/notation-conventions#43-slack-variables).

For details on the FPHA construction and production function model variants, see [hydro production models](/math/hydro-production-models).

## 7. Outflow Constraints

**Outflow Definition** (per hydro $h$, block $k$):

$$
o_{h,k} = q_{h,k} + s_{h,k}
$$

:::note[Clarification]
Outflow $o$ represents water released to the downstream channel (affecting tailrace level). It does NOT include:

- **Withdrawal** $r_h$: A signed consumptive-use parameter (positive = removal from system for irrigation/water supply; negative = inter-basin return/addition). This is a fixed parameter (not a decision variable) — see §4 for the signed-target semantics and §9 for the slack bounds
- **Diversion** $u_{h,k}$: Water bypassed to a separate channel (not affecting main tailrace)

The water balance (§4) accounts for all flows: inflow $-$ $(q + s + u)$ $-$ evaporation $-$ withdrawal = storage change. Withdrawal $r_h$ enters as a signed fixed RHS parameter; bidirectional violation slacks ($\sigma^{w-}_h$, $\sigma^{w+}_h$) allow the LP to relax the withdrawal commitment when necessary (see §9).
:::

**Outflow Bounds** (with slacks for soft enforcement):

$$
\underline{O}_h - \sigma^{o-}_{h,k} \leq o_{h,k} \leq \bar{O}_h + \sigma^{o+}_{h,k}
$$

## 8. Variable Bounds and Minimum Constraints

### Storage Bounds (per hydro $h$)

$$
\underline{V}_h \leq v_h \leq \bar{V}_h
$$

The dead volume $\underline{V}_h$ is a hard lower bound for every hydro except two cases: a hydro with a filling configuration has a floor of $0$ in every phase, the per-stage filling floor below taking its place while it fills, and from its entry stage on the dead volume returns as the soft floor $v_h + \sigma^{v-}_h \geq \underline{V}_h$, the only storage-below-minimum slack of the LP, priced above deficit; a hydro without a filling configuration has a floor of $0$ while PreFilling, where its frozen identity (§4) holds the storage at its incoming value. On a chronological stage the block-end storages $v_{h,k}$ carry the same column bounds, and the soft floor applies to the end-of-stage storage $v_h$ only. The upper bound is hard; excess water leaves through spillage.

**Filling floors** (for filling hydros, at every stage $t \in [\text{start\_stage\_id}, \text{entry\_stage\_id})$):

$$
v_h + \sigma^{fill}_h \geq V^{\text{target}}_t,
\qquad
V^{\text{target}}_t = \min\!\Big( V^{\text{target}}_{t+1} - \zeta_{t+1}\,\text{rate}_{t+1},\ \underline{V}_h \Big),
\quad V^{\text{target}}_{L} = \underline{V}_h
$$

The minimum end-of-stage storage $V^{\text{target}}_t$ ramps up at the configured accumulation rate `filling_min_rate_m3s` (= $\text{rate}_t$) and reaches the dead volume $\underline{V}_h$ at the last filling stage $L = \text{entry\_stage\_id} - 1$; $\zeta_t$ converts the rate over the stage duration into hm³. The slack $\sigma^{fill}_h$ is priced at $c^{fill}_h$, which is pinned **below deficit** (not the system maximum). See [Penalty System §6](/math/penalty-system).

### Turbined Flow Bounds (per cell $(h, b)$, block $k$)

$$
\underline{Q}_{h,b} - \sigma^{q-}_{h,b,k} \leq q_{h,b,k} \leq \bar{Q}_{h,b}
$$

The lower bound is soft, with one slack $\sigma^{q-}_{h,b,k}$ per cell, priced at the plant's own penalty $c^{tv-}_h$ at full magnitude on every cell — never divided by cell count; it is the plain sum of the cell's own unit groups' resolved minimum turbined flow, $\underline{Q}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{Q}_u$. The upper bound is hard and closes against the plant's own resolved maximum, never raised above it:

$$
\bar{Q}_{h,b} = \min\!\left( \sum_{u \,\in\, (h,b)} \mathrm{fold}(u),\ \ \bar{Q}_h \right)
$$

where $\mathrm{fold}(u) = \bar{Q}_u$ for an FPHA hydro (turbined flow and generation are independent columns there) and $\mathrm{fold}(u) = \min(\bar{Q}_u,\ \bar{G}_u / \rho_h)$ for a constant-productivity hydro — each group's own flow cap and MW-implied flow cap must be folded **before** summing across the cell, since $\min$ does not distribute over a sum of groups that bind on different sides. This is the mechanism that enforces a constant-productivity cell's generation cap (§6): there is no separate generation column to bound directly. Matches the per-cell $\sigma^{q-}_{h,b,k}$ defined in [notation conventions §4.3](/overview/notation-conventions#43-slack-variables).

### Diversion Flow Bounds (per hydro $h$, block $k$)

$$
0 \leq u_{h,k} \leq \bar{U}_h
$$

Both bounds are hard. Diversion cost is a regularization term (see §1.4), not a violation penalty.

### Pumping Flow Bounds (per station $y$, block $k$)

$$
\underline{P}_y \leq p_{y,k} \leq \bar{P}_y
$$

Both bounds are hard.

## 9. Constraint Violation Penalty Terms

The per-block constraint violation penalties in the objective (referenced from §2) are:

$$
\sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \Big[
  c^{tv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{q-}_{h,b,k} + c^{ov-}_h \sigma^{o-}_{h,k} + c^{ov+}_h \sigma^{o+}_{h,k} + c^{gv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{g-}_{h,b,k}
\Big]
$$

The turbined- and generation-minimum slacks are **per cell** — each of a split plant's cells carries its own slack column and its own row, priced at the plant's penalty at full magnitude, never divided across cells. The outflow slacks stay per plant: outflow has no per-cell column to attribute a floor to. The evaporation slacks are per plant too, stage-level on a parallel stage and per block on a chronological stage ([Evaporation Row](#evaporation-row)).

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{wv-}_h \sigma^{w-}_h + c^{wv+}_h \sigma^{w+}_h\bigr)
$$

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{ev+}_h \sigma^{e+}_h + c^{ev-}_h \sigma^{e-}_h\bigr) \;\; \text{(parallel stage)}, \qquad + \sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \bigl(c^{ev+}_h \sigma^{e+}_{h,k} + c^{ev-}_h \sigma^{e-}_{h,k}\bigr) \;\; \text{(chronological stage)}
$$

where $H_t = \sum_k \tau_k$ is the total stage duration in hours, and the evaporation sums run over the hydros that model evaporation. Withdrawal violation slacks ($\sigma^{w-}_h$, $\sigma^{w+}_h$) are stage-level (not per-block) and bidirectional: $\sigma^{w-}_h$ penalizes under-delivery (the realized withdrawal $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$ falls short of the target), and $\sigma^{w+}_h$ penalizes over-delivery. The **withdrawal target $r_h$ is signed** (§4), and the slack bounds ensure the realized withdrawal cannot flip sign relative to the target:

- $r_h > 0$ (scheduled removal): $\sigma^{w-}_h \leq r_h$ (under-delivery slack capped at the target magnitude; floors $R_h \geq 0$), $\sigma^{w+}_h$ unbounded.
- $r_h < 0$ (scheduled inter-basin return/addition): $\sigma^{w+}_h \leq |r_h|$ (over-delivery slack capped at $|r_h|$; caps $R_h \leq 0$), $\sigma^{w-}_h$ unbounded.
- $r_h = 0$: both slacks are pinned to zero (presolve-eliminated).

This cap guards a degenerate case: an unbounded under-delivery slack would let a run-of-river plant "un-withdraw" past its target and inject phantom water into the reservoir.

Storage violation penalties ($c^{sv-}_h \sigma^{v-}_h$ and $c^{fill}_h \sigma^{fill}_h$) appear outside the $\tau_k$ sum because they apply to end-of-stage storage — see §2.

### Penalty Resolution

The effective penalty for any (entity, stage, penalty_type) tuple follows a three-level cascade:

1. **Stage-specific override** (from Parquet files in `constraints/`)
2. **Entity-specific override** (from entity registry JSON)
3. **Global default** (from `penalties.json`)

For the full resolution semantics and all penalty value definitions, see [Penalty System](/math/penalty-system).

## 10. Generic Constraints

User-defined linear constraints (per constraint $g \in \mathcal{G}$) take a two-sided interval form:

$$
\underline{b}_g \;\leq\; \sum_{e} \gamma_{g,e} \cdot x_e \;\leq\; \bar{b}_g
$$

where $x_e$ can reference any LP variable using expression syntax:

- `hydro_storage(id)`, `hydro_turbined(id)`, `hydro_spillage(id)`
- `thermal_generation(id)`, `bus_deficit(id)`, etc.

`hydro_turbined` and `hydro_generation` additionally accept a named `bus=` argument selecting one **(hydro, bus) cell** of a plant split across several buses — e.g. `hydro_turbined(5, bus=2)` — resolving to that cell's own column; no other variable form accepts it. An optional positional block argument, when present, precedes the named argument: `f(id)`, `f(id, block)`, `f(id, bus=b)`, and `f(id, block, bus=b)` all parse. Omitting `bus=` on a plant with more than one cell addresses every one of its cells at once, matching the whole-entity reference every other variable form uses.

A term may also address a plant's **useful volume** $v_h - V^{min}_h$ — its storage above the physical minimum $V^{min}_h$. It is realised on the storage variable itself by shifting both endpoints by the same amount,

$$
\underline{b}_g \le \gamma_{g,e}\,(v_h - V^{min}_h) + \dots \le \bar{b}_g
\iff
\underline{b}_g + \gamma_{g,e}V^{min}_h \le \gamma_{g,e}\,v_h + \dots \le \bar{b}_g + \gamma_{g,e}V^{min}_h,
$$

so it adds no LP variable; an absent endpoint stays absent, and a negative $\gamma_{g,e}$ lowers both endpoints.

Either endpoint, $\underline{b}_g$ or $\bar{b}_g$, may be absent — never both — with an absent side read as the corresponding infinity. This single interval subsumes every shape a constraint can take: a present $\underline{b}_g$ alone is a floor, a present $\bar{b}_g$ alone is a cap, $\underline{b}_g = \bar{b}_g$ is an equality, and both present together bound a two-sided band. A constraint is no longer characterised by picking one relation out of a fixed set — its shape falls out of which endpoints happen to be present.

### Coefficients and Endpoints

The coefficients $\gamma_{g,e}$ may be either literal numeric values or **named scalar parameters**, exactly as for any other coefficient in the LP.

Each endpoint composes independently from up to two pieces, summed together: a numeric base that may itself vary by stage (and, for the finest-grained parameter kind below, by block within the stage), plus an optional affine remainder layered on top of it — a constant plus a weighted sum of named scalar parameters. An endpoint carrying neither piece is simply absent; a base alone, a remainder alone, or their sum are all valid, so a single endpoint can combine a scheduled floor or cap that already varies by stage with a further parameter-driven adjustment on top.

A named scalar parameter resolves to a single number per stage and can carry one of five kinds:

| Kind               | Value semantics                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constant`         | One value for every stage                                                                                                                                              |
| `per_stage`        | Explicit value per stage                                                                                                                                               |
| `seasonal`         | One value per season; stages inherit the value from their season                                                                                                       |
| `computed`         | A quantity derived from a hydro plant's geometry and energy-conversion model — its reference-point or useful-range mean productivities, reference operating point, physical storage range, or maximum stored energy (see [Hydro Production Models §5](/math/hydro-production-models#5-energy-conversion-quantities)) |
| Per-(stage, block) | Explicit value per stage **and** per block within that stage — the finest-grained schedule, letting a value vary across a stage's blocks, not just from stage to stage |

Resolution happens once at LP-build time, so the LP coefficients and endpoints are still numeric at solve time — the parameter mechanism does not introduce LP-variable coupling between constraints. Methodology relevance: it lets the corpus express ramping limits, capacity caps, and operator-imposed quotas that vary by stage, season, or block without authoring a separate constraint per stage. Coefficient and endpoint values can therefore be **stage- and block-varying constants**, not just literal numbers.

### Two-Sided Slack

A constraint may optionally carry a slack, penalized per unit of violation, so the row relaxes at a cost instead of forcing infeasibility. A one-sided row — only $\underline{b}_g$ or only $\bar{b}_g$ present — carries a single slack column relaxing that one endpoint. A two-sided row — both $\underline{b}_g$ and $\bar{b}_g$ present — carries **two** independent slack columns, $\sigma^{gc+}_g$ relaxing the floor upward and $\sigma^{gc-}_g$ relaxing the cap downward: a single column cannot represent both "how far below the floor" and "how far above the cap" without conflating the two directions.

The reported violation is the **signed net** $\sigma^{gc+}_g - \sigma^{gc-}_g$: positive when the row sits below its floor, negative when it sits above its cap, matching the sign of the underlying deviation rather than reading as an unsigned magnitude. The objective charges both columns, $\sigma^{gc+}_g + \sigma^{gc-}_g$, which coincides with the net's magnitude whenever only one direction is active — the case at any optimum, since paying for both directions on the same row at once is strictly dominated by paying for neither of the excess.

**Row materialization**: a constraint bound declared with `block_id = None` over a **block-independent** expression — one whose every term references a stock variable (incoming storage $v^{in}_h$, outgoing storage $v_h$, evaporation (the stage-level $e_h$ on a parallel stage, a named block's $e_{h,k}$ on a chronological stage), or an anticipated-thermal commitment) — is materialized as a **single stage-level row** priced by the total stage hours $H_t$, since per-block rows would be identical, **provided its endpoints are block-independent too**: an endpoint drawn from the per-(stage, block) parameter kind above varies within the stage, which forces the per-block row set even when the expression alone would otherwise qualify for the collapse. A `block_id = None` bound on a block-level expression, or any `block_id = Some(k)` bound, still produces one row per relevant block. This is an LP row-count optimization that is cost- and parity-neutral.

See [Generic Constraints](/reference/generic-constraints) for the authoring grammar, the activation grid, and the per-file field tables this formulation implements.

### Hydro Inflow

A `hydro_inflow` term reads the inflow $I_{h,k}$ of hydro $h$ in block $k$, a rate in m³/s built from LP columns:

$$
I_{h,k} = z_h + \sum_{h':\,\text{div}=h} u_{h',k} + \sum_{h' \in \mathcal{U}_h} o^{arr}_{h' \to h,k} + \frac{\phi_{h,k}}{\zeta_k} \, b^{\mathrm{in}}_{h,1} + \sum_{h' \in \mathcal{U}^{pre}_h(t)} \Big( z_{h'} + \sum_{h'':\,\text{div}=h'} u_{h'',k} + \sum_{h'' \in \mathcal{U}_{h'}} o_{h'',k} \Big)
$$

Each upstream release is credited to block $k$ by the travel time of its arc:

$$
o^{arr}_{h' \to h,k} = \begin{cases} o_{h',k} & \text{arc without a travel time} \\ \nu_{h',t,0} \, o_{h',k} & \text{travel-time arc, parallel stage} \\ \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \dfrac{\zeta_{k'}}{\zeta_k} \, o_{h',k'} & \text{travel-time arc, chronological stage} \end{cases}
$$

- $o_{h',k} = q_{h',k} + s_{h',k}$ = turbined plus spilled outflow of $h'$ (§7), credited with the same-stage share $\nu_{h',t,0}$ or the within-stage shares $\nu^{k' \to k}_{h',t}$ of §4
- $\phi_{h,k}$ = arrival density of §5d on a chronological stage and $\tau_k / H_t$ on a parallel stage: the share of the maturing in-transit volume $b^{\mathrm{in}}_{h,1}$ that arrives in block $k$, which the division by $\zeta_k$ turns into a rate
- $\mathcal{U}^{pre}_h(t)$ = PreFilling plants at stage $t$ whose first non-PreFilling downstream plant is $h$ (see [PreFilling Pass-Through](#prefilling-pass-through)); the local inflow of each, the flows diverted into it and the releases of its upstream plants enter whole, with no travel-time share

The term excludes pumping, the inflow non-negativity slack, the plant's own outflows, evaporation and withdrawal.

For a hydro that is not PreFilling at stage $t$, the term mirrors the inflow side of its water balance (§4). On a chronological stage $\zeta_k I_{h,k}$ equals the inflow terms of block $k$'s water-balance row: the local inflow, the flows diverted in, the credited releases, the maturing transit volume and the PreFilling pass-through. On a parallel stage $\sum_{k} \zeta_k I_{h,k}$ equals the same terms of the stage row, and only the duration-weighted stage total matches the balance; the split across blocks is a convention.

$I_{h,k}$ reads per-block columns, so a bound without a block expands to one row per block (see row materialization in [§10](#10-generic-constraints)).

## 11. Benders Cuts

For each active cut $i$ from previous iterations:

$$
\theta \geq \beta_{0,i} + \sum_{h \in \mathcal{H}} \beta^v_{i,h} \cdot v_h + \sum_{h,\ell} \beta^{lag}_{i,h,\ell} \cdot a_{h,\ell}
$$

where:

- $\beta_{0,i}$ = cut intercept (RHS)
- $\beta^v_{i,h}$ = coefficient for storage state variable
- $\beta^{lag}_{i,h,\ell}$ = coefficient for AR lag state variable

When anticipated thermals are present, the cut carries one additional coefficient per anticipated-state slot (§5c), read from the same reduced-cost mechanism. When travel-time arcs are present, it likewise carries one coefficient per in-transit bucket dimension (§5d); unlike the storage and lag coefficients, the bucket coefficients are always part of the cut projection.

Cuts live in an **append-only pool** at stable slot indices: every cut ever generated is retained for the lifetime of the run, and only the active subset is baked into each iteration's stage template. Deactivation **excludes** a cut from each iteration's stage-template rebake rather than mutating any row; the persistent lower-bound LP is append-only (its rows are never removed, so the lower bound stays monotone). Slot indices stay stable, so reactivation — re-baking the cut into the template at the same slot — is exact. See [cut management](/math/cut-management).

For cut coefficient derivation, aggregation, and selection strategies, see [cut management](/math/cut-management).

## 12. LP Scaling

The stage LP is numerically conditioned via a three-step scaling procedure applied once at template construction time. Scaling improves solver convergence by reducing the condition number of the constraint matrix without changing the optimization argmin.

### 12.1 Cost Scaling

All objective coefficients (except the future cost variable $\theta$) are divided by a fixed positive constant $K$, chosen once per study. $K$ scales the cost domain uniformly and leaves the constraint matrix and feasible region untouched, so the LP argmin is invariant to it and any two choices of $K$ agree in exact arithmetic:

$$
\tilde{c}_j = \frac{c_j}{K} \quad \text{for all } j \neq \theta
$$

The $\theta$ variable retains its coefficient of 1.0 because the Benders cuts enforce $\theta \geq \beta_0^{scaled}$ where $\beta_0^{scaled} = Q_{successor} / K$, so $\theta$ already operates in scaled cost space. The LP objective is $\sum_j \tilde{c}_j x_j + 1.0 \cdot \theta$, and the total scaled objective equals $(C_{stage} + C_{future}) / K$. All cost-domain outputs (objective values, duals, cost breakdowns) are multiplied by $K$ at the reporting boundary to recover original units.

:::note[Impact on cut coefficients]
Cut intercepts and coefficients are stored in scaled cost space (divided by $K$). When evaluating or reporting cut values, the factor $K$ must be applied. Duals extracted from the LP are already in scaled cost space and must be multiplied by $K$ to obtain original-unit values.
:::

### 12.2 Column Scaling (Geometric Mean)

After cost scaling, each column $j$ is assigned a geometric-mean scale factor — the standard matrix-equilibration heuristic (Curtis & Reid, 1972):

$$
d_j^{col} = \frac{1}{\sqrt{\max_i |A_{ij}| \cdot \min_i |A_{ij}|}}
$$

where the max and min are taken over nonzero entries in column $j$. Columns with no nonzero entries receive $d_j^{col} = 1$. The transformation replaces:

- Matrix entries: $\tilde{A}_{ij} = A_{ij} \cdot d_j^{col}$
- Objective coefficients: $\tilde{c}_j = c_j \cdot d_j^{col}$
- Column bounds: $\tilde{l}_j = l_j / d_j^{col}$, $\tilde{u}_j = u_j / d_j^{col}$

### 12.3 Row Scaling (Geometric Mean)

After column scaling, each row $i$ is assigned a scale factor using the same geometric-mean formula applied to the already column-scaled matrix:

$$
d_i^{row} = \frac{1}{\sqrt{\max_j |\tilde{A}_{ij}| \cdot \min_j |\tilde{A}_{ij}|}}
$$

The transformation replaces:

- Matrix entries: $\check{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}$
- Row bounds: $\check{l}_i^{row} = l_i^{row} \cdot d_i^{row}$, $\check{u}_i^{row} = u_i^{row} \cdot d_i^{row}$

Column bounds and objective coefficients are not modified by row scaling.

The combined scaling produces the standard $D_r \cdot A \cdot D_c$ form where $D_r$ and $D_c$ are diagonal scaling matrices.

:::note[Dual unscaling]
LP row duals are in the scaled problem's space. To recover original-unit duals: $\pi_i^{original} = \pi_i^{scaled} \cdot d_i^{row} \cdot K$. The per-column and per-row scale factors are stored in the stage LP template for use during dual extraction and cut coefficient computation. This recovery is exact when the solve applies no scaling beyond Cobre's own prescaling — the case by default; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for.
:::

:::note[Reduced-cost unscaling for cut coefficients]
State cut coefficients are read as the **reduced costs** of the pinned incoming-state columns (§4a, Incoming-Storage Pinning), not as row duals. A reduced cost is reported in the scaled problem's space; the original-unit sensitivity is $\beta_j^{original} = (\bar{c}_j^{scaled} / d_j^{col}) \cdot K$ — divide by the column factor, then multiply by $K$. The **division** by $d_j^{col}$ (not multiplication) follows from the column transform $\tilde{x}_j = x_j / d_j^{col}$ of §12.2 (Column Scaling): the LP solver/backend differentiates the scaled objective with respect to $\tilde{x}_j$, so recovering $\partial Q / \partial x_j$ divides the column factor back out. When the solve applies no scaling beyond Cobre's own prescaling — the case by default — this single unscaling is exact; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for, and the single unscaling no longer exactly recovers original units. (Cut coefficients are stored in scaled cost space — the $\bar{c}_j^{scaled}/d_j^{col}$ value — with $K$ applied only at the reporting boundary, as for all cost-domain quantities.)
:::

## Cross-References

- [Notation conventions](/overview/notation-conventions) — index sets, parameters, decision variable naming
- [System elements](/math/system-elements) — physical meaning of each element, decision variables, Variable Units Convention
- [Penalty System](/math/penalty-system) — three-category taxonomy, penalty names, priority ordering, cascade resolution
- [SDDP algorithm](/math/sddp-algorithm) — iterative structure that solves this LP at each stage
- [PAR(p) inflow model](/math/par-inflow-model) — complete AR inflow model specification
- [Hydro production models](/math/hydro-production-models) — constant, linearized head, and FPHA model details
- [Cut management](/math/cut-management) — dual extraction, cut coefficients, aggregation, and selection
- [Equipment formulations](/math/equipment-formulations) — per-equipment constraint derivations, pumping details
