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
| Storage below minimum    | $c^{sv-}_h$  | \$/hm³      | $v_h \geq \underline{V}_h$                               |
| Filling target shortfall | $c^{fill}_h$ | \$/hm³      | $v_h \geq V^{\text{target}}_t$ (per-stage filling floor) |
| Turbined flow minimum    | $c^{tv-}_h$  | \$/(m³/s·h) | $q_{h,b,k} \geq \underline{Q}_{h,b}$ (per cell)          |
| Outflow minimum          | $c^{ov-}_h$  | \$/(m³/s·h) | $o_{h,k} \geq \underline{O}_h$                           |
| Outflow maximum          | $c^{ov+}_h$  | \$/(m³/s·h) | $o_{h,k} \leq \bar{O}_h$                                 |
| Generation minimum       | $c^{gv-}_h$  | \$/MWh      | $g_{h,b,k} \geq \underline{G}_{h,b}$ (per cell)          |
| Evaporation violation    | $c^{ev}_h$   | \$/(m³/s·h) | Evaporation within physical limits                       |
| Withdrawal violation     | $c^{wv}_h$   | \$/(m³/s·h) | Water withdrawal commitment (bidirectional: under/over)  |

### 1.4 Category 3: Regularization Costs (Solution Guidance)

Small costs that guide the solver toward physically preferred solutions when the LP would otherwise be indifferent. Must be orders of magnitude smaller than any economic cost:

| Cost               | Symbol          | Units       | Purpose                                         |
| ------------------ | --------------- | ----------- | ----------------------------------------------- |
| Spillage           | $c^{spill}_h$   | \$/(m³/s·h) | Prefer turbining over spilling when indifferent |
| FPHA turbined flow | $c^{fpha}_h$    | \$/(m³/s·h) | Prevent interior FPHA solutions (FPHA-only)     |
| Diversion          | $c^{div}_h$     | \$/(m³/s·h) | Prefer main channel flow                        |
| Curtailment        | $c^{curt}_r$    | \$/MWh      | Prioritize using available NCS generation       |
| Exchange           | $c^{exch}_\ell$ | \$/MWh      | Prevent unnecessary power flows                 |

:::note[Note]
Regularization costs should be at least 2-3 orders of magnitude smaller than economic costs to avoid distorting the optimal solution.
:::

### 1.5 Penalty Priority Ordering

The following ordering must be maintained (from highest to lowest):

$$
c^{sv-} > c^{def} > c^{tv-}, c^{ov\pm}, c^{gv-}, c^{ev}, c^{wv} > c^{th}, c^{ctr} > c^{spill}, c^{fpha}, c^{div}, c^{curt}, c^{exch}
$$

with the filling-target penalty pinned **below deficit** on a separate rung: $c^{def} > c^{fill}$.

1. **Storage violation** ($c^{sv-}$): Highest penalty — reservoir below dead volume risks dam safety, so it must exceed deficit
2. **Deficit** ($c^{def}$): Value of lost load; exceeds any generation cost
3. **Constraint violations** ($c^{tv-}$, $c^{ov\pm}$, $c^{gv-}$, $c^{ev}$, $c^{wv}$): Exceed typical marginal cost but allow violation when physically necessary
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
  + \underbrace{\sum_{l \in \mathcal{L}} c^{exch}_l (f^+_{l,k} + f^-_{l,k})}_{\text{Exchange (regularization)}}
$$

$$
  + \underbrace{\text{Constraint violation penalties}}_{\text{See §9}}
\Bigg]
$$

$$
+ \underbrace{\sum_{h \in \mathcal{H}} \Big[ c^{sv-}_h \sigma^{v-}_h + c^{fill}_h \sigma^{fill}_h \Big]}_{\text{Storage violations (not per-block)}}
+ \; \theta
$$

:::note[Note on storage violation penalties]
Storage violation penalties ($\sigma^{v-}_h$, $\sigma^{fill}_h$) are **not** multiplied by $\tau_k$ because they apply to end-of-stage storage (hm³), not to per-block flow rates. All other penalty terms are per-block and carry the $\tau_k$ weighting. Contract prices $c^{ctr}_c$ are positive for imports and negative for exports, so a single sum handles both.
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
+ \sum_{l: \text{target}=b} \eta_l f^+_{l,k} + \sum_{l: \text{source}=b} \eta_l f^-_{l,k}
$$

$$
- \sum_{l: \text{source}=b} f^+_{l,k} - \sum_{l: \text{target}=b} f^-_{l,k}
- \sum_{c \in \mathcal{C}^{exp}_b} \chi_{c,k}
- \sum_{j \in \mathcal{P}_b} \gamma_j p_{j,k}
+ \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k}
$$

**Dual variable**: $\pi^{lb}_{b,k}$ (marginal cost of energy at bus $b$, block $k$, in \$/MW; divide by $\tau_k$ for \$/MWh — see [Variable Units Convention](/math/system-elements))

For the physical meaning of each element in the balance, see [system elements](/math/system-elements).

## 4. Hydro Water Balance

For each hydro $h \in \mathcal{H}$ (parallel blocks formulation):

$$
v_h = v^{in}_h + b^{\mathrm{in}}_{h,1} + \zeta \Bigg[ a_h + \sum_{k \in \mathcal{K}} w_k \Big(
  \underbrace{\sum_{i \in \mathcal{U}_h} (q_{i,k} + s_{i,k} + u_{i,k})}_{\text{Inflow from upstream}}
  + \underbrace{\sum_{i: \text{div}=h} u_{i,k}}_{\text{Diverted inflow}}
  + \underbrace{\sum_{j: \text{dest}=h} p_{j,k}}_{\text{Pumped inflow}}
$$

$$
  - \underbrace{q_{h,k} - s_{h,k} - u_{h,k}}_{\text{Outflows}}
  - \underbrace{e_{h,k}}_{\text{Evaporation}}
  - \underbrace{\sum_{j: \text{src}=h} p_{j,k}}_{\text{Pumped outflow}}
\Big) - \underbrace{r_h}_{\text{Withdrawal (signed target)}} \Bigg]
$$

where:

- $v^{in}_h$ = incoming storage LP variable, pinned to the previous stage's value via column bounds (§4a)
- $b^{\mathrm{in}}_{h,1}$ = in-transit volume maturing at the current stage on a declared travel-time arc into $h$ (hm³), added directly as a stage-level inflow (already a volume, so it sits **outside** the $\zeta$ conversion). When a cascade arc carries a travel time, the upstream release is delayed through this term instead of entering the same-stage upstream inflow sum above; see §5d. Absent (zero) for instantaneous arcs
- $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$ = the plant's total turbined flow, summed over its (hydro, bus) cells (§3). Each cell's own column $q_{h,b,k}$ is bounded independently (§8) and, for an FPHA hydro, feeds that cell's own generation constraint (§6); storage, spillage, diversion, and inflow stay single per-plant quantities regardless of cell count. A single-cell plant has $q_{h,k} \equiv q_{h,b,k}$
- $a_h$ = incremental inflow (from AR model, see [PAR(p) inflow model](/math/par-inflow-model)); equivalently $z_h$ from the z-inflow constraint (§5b)
- $r_h$ = water withdrawal target (m³/s), a **signed fixed RHS parameter** from `water_withdrawal_m3s` (not a per-block LP decision variable). $r_h > 0$ schedules a consumptive removal; $r_h < 0$ schedules an inter-basin return/addition that adds water to the reservoir. The realized withdrawal removed from the reservoir is $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$; see §9 for the slack bounds that prevent the realized flow from flipping sign. Withdrawal is applied at the stage level, outside the per-block summation
- $e_{h,k}$ = signed net evaporation flow (m³/s): positive values represent net evaporative loss subtracted from storage; negative values represent net rainfall input on the lake surface that adds to storage through the same coefficient (the leading $-$ sign on $e_{h,k}$ flips the contribution automatically — see [penalty system §5](/math/penalty-system))
- $w_k = \tau_k / \sum_j \tau_j$ = block weight
- $\zeta = 0.0036 \times \sum_k \tau_k$ = time conversion factor

:::note[Dimensional Consistency]
(see [Variable Units Convention](/math/system-elements)):

- LHS: $v_h$ [hm³]
- RHS: $v^{in}_h$ [hm³] + $\zeta$ [hm³/(m³/s)] × (flow terms [m³/s])
- The factor $\zeta$ converts all flow rates (m³/s) to volumes (hm³) accumulated over the stage
- Block weights $w_k$ are dimensionless and sum to 1
- The AR inflow $a_h$ is in m³/s (average rate over the stage)
- All flow decision variables use rate units (m³/s) — the conversion to volume happens only through $\zeta$ in this constraint
  :::

**Dual variable**: $\pi^{wb}_h$ (water value — captures the marginal value of incoming storage as seen through the hydro balance, but is **not** used directly as a cut coefficient; the cut coefficient comes from the reduced cost of the pinned incoming-storage column, see §4a and [cut management](/math/cut-management))

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
The incoming state is pinned by **column bounds**, not by an explicit equality _constraint row_ $v^{in}_h = \hat{v}_h$ whose dual would be read: the equivalent fixing-row block is a permanent empty sentinel (§4b). Pinning by bounds keeps $N(1+L)$ redundant equality rows per stage out of the model (plus the anticipated-state rows, §5c); the two formulations are KKT-equivalent — see below.
:::

The variable $v^{in}_h$ then appears as an LP variable (not a constant) in all constraints that depend on incoming storage: the water balance (§4), the FPHA average storage computation (§6), and any generic constraints (§10) that reference incoming storage.

**Cut coefficient**: the storage cut coefficient $\pi^v_h$ is the **reduced cost** of the pinned `storage_in` column (unscaled by its prescaler column factor — see §12 (LP Scaling) and [cut management](/math/cut-management)). No fixing-constraint dual is involved.

**Why this design**: By LP duality, when a column is pinned at $\underline{x} = \bar{x}$ its reduced cost equals the sensitivity $\partial Q_t / \partial \hat{v}_h$ of the optimal value to the pinned bound — exactly the multiplier the equivalent equality row $v^{in}_h = \hat{v}_h$ would have carried (KKT parity). This sensitivity automatically accounts for all downstream effects through water balance, FPHA, and generic constraints, so a single reduced-cost value suffices — no combination of duals from multiple constraint types is needed. This is the same "fishing" technique used by SDDP.jl, realised through column bounds rather than a fixing row, and is analogous to how the AR lags (section 5a) are pinned for inflow history.

**Column count**: $N$ pinned incoming-storage columns, where $N = |\mathcal{H}|$ is the number of operating hydros. There is no corresponding fixing-row block.

## 4b. LP Column and Row Layout

LP column layout — state variables (storage, AR lags) first for contiguous
reduced-cost extraction, dispatch variables per block, and `θ` (future cost) last
for the Benders cuts, assembled with the constraint-row families below.

```d2
direction: down

columns: "Decision-variable columns — fixed contiguous order in x" {
  state: "1 · State (coupling)\nvₕ storage · aₕ,ℓ AR lags\npinned by column bounds; reduced costs → π"
  dispatch: "2 · Dispatch (per block k)\nflow · hydro · turbined · spill\nthermal · NCS · deficit"
  future: "3 · Future\nθ future cost (bounded by cuts)"
  state -> dispatch -> future
}

rows: "Constraint-row families" {
  grid-columns: 1
  lb: "Load balance — per bus, per block"
  wb: "Water balance — per hydro, per block"
  fix: "Fixing — incoming-state coupling"
  cut: "Benders cuts:  θ ≥ α + πᵀx" {style.stroke-dash: 4}
}

columns -> rows: "assembled into the stage LP"
```

The stage LP uses a fixed column and row layout that places state variables first, followed by auxiliary and equipment columns. State is pinned by **column bounds** on the incoming-state columns (§4a, §5a, §5c, §5d), and cut coefficients are read as the **reduced costs** of those columns — so the fixed column order, not a fixed row order, is what enables contiguous coefficient extraction. With $N = |\mathcal{H}|$ hydros, $L$ = maximum AR order, $A$ = number of anticipated thermals, $K = K_{\max} = \max_i K_i$, and $B$ = total in-transit bucket count (the sum, over receiving plants, of each plant's maturity-lag depth — §5d):

**Column layout**:

| Region                | Count | Description                                                                       |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| `storage`             | $N$   | Outgoing storage volumes (state) — first                                          |
| `inflow_lags`         | $NL$  | AR lag variables (state) — after storage                                          |
| `transit_buckets_out` | $B$   | Outgoing in-transit bucket volumes (state, plant-major lag-minor) — after lags    |
| `anticipated_state`   | $K A$ | Ring-buffer slots for anticipated thermals (state, slot-major plant-minor)        |
| `z_inflow`            | $N$   | Realized inflow (auxiliary, not state) — after the state block                    |
| `storage_in`          | $N$   | Incoming storage volumes (auxiliary, for §4a) — after z-inflow                    |
| `transit_buckets_in`  | $B$   | Incoming in-transit bucket volumes (auxiliary, pinned for §5d) — after storage_in |
| `theta`               | $1$   | Future cost variable — last of the state prefix                                   |

Equipment columns (turbine, spillage, diversion, thermal, anticipated-decision and anticipated-state-out, line flows, deficit, excess, slacks) follow immediately after `theta`. The `turbine` column family, and the FPHA `generation` column family, are indexed by **(hydro, bus) cell** rather than by plant — one column per cell (§3, §6) — while every other hydro equipment column (spillage, diversion) stays indexed by plant; a single-cell plant's layout is byte-identical to the pre-partition, per-plant form. The `transit_buckets_out` block is an identity-resolved state carrier (like `storage`, and mirroring the anticipated-state-out carrier of §5c): it holds the volume still in transit on each cascade arc, defined by in-LP ring shift and deposit rows rather than pinned, and the `transit_buckets_in` block is the matching pinned incoming copy read for the delayed-arrival water-balance entry and the cut coefficient (§5d). Two auxiliary blocks are reserved for anticipated thermals: $A$ **anticipated-decision** columns $d^i_t$ carrying the commitment placed at this stage for delivery $K_i$ stages later, and $A$ **anticipated-state-out** columns $y^i_t$ used to decouple the post-shift state from the decision-write coefficient — see §5c.

The `z_inflow` region holds one free column per hydro representing the total realized inflow $z_h = a_h$ (m³/s) for each hydro at the current stage. These are auxiliary columns (zero objective cost, unbounded) whose primal values after solving give the realized inflow. They participate in the water balance (§4) and are defined by the z-inflow constraints (§5b).

**Row layout** (equality-constraint prefix):

Because state is pinned by column bounds (§4a, §5a, §5c, §5d) rather than by equality rows, there are **no** state-fixing rows: the former `storage_fixing` ($N$), `lag_fixing` ($NL$), `transit_bucket_fixing` ($B$), and `anticipated_state_fixing` ($KA$) row blocks are permanent empty sentinels (zero rows). The equality-constraint prefix therefore begins directly with the z-inflow definitions:

| Region     | Count | Description                                                         |
| ---------- | ----- | ------------------------------------------------------------------- |
| `z_inflow` | $N$   | Realized-inflow definition constraints (§5b) — first equality block |

Equipment rows (water balance, load balance, FPHA, evaporation, outflow bounds, anticipated-fishing and anticipated-state-out equalities, transit-bucket shift and deposit definitions, generic constraints, etc.) follow after the z-inflow rows.

Cut coefficients are **not** read from a contiguous dual slice over a fixing-row prefix. Instead, each incoming-state coordinate is pinned on its own LP column — `storage_in` for storage, `inflow_lags` for AR lags, `transit_buckets_in` for in-transit buckets, `anticipated_state` for anticipated-thermal slots — and its cut coefficient is the **reduced cost** of that column (§4a, [cut management](/math/cut-management)). The map from a state coordinate to its pinned column is fixed (`state_to_lp_incoming_column`), and each of these incoming-state column regions is contiguous, so all storage, inflow-lag, in-transit bucket, and anticipated-state coefficients are still gathered by reading a few contiguous slices — of the reduced-cost vector rather than the dual vector.

**Worked example** ($N = 3$, $L = 2$, $A = 0$, $B = 0$ — no travel-time arcs): the storage region holds 3 columns, the AR lag region holds 6 (3 hydros × 2 lags), the z-inflow region holds 3, and the incoming-storage region holds 3, so `theta` is the 16th column. The state count (outgoing storage + AR lags) is $N(1 + L) = 9$. With $B = 0$ the layout is byte-for-byte the bucket-free layout.

## 5. AR Inflow Dynamics

The incremental inflow $a_h$ is determined by the PAR(p) autoregressive model:

$$
a_h = \underbrace{\left( \mu_t - \sum_{\ell=1}^{P_h} \psi_\ell \mu_{t-\ell} \right)}_{\text{deterministic base}}
+ \underbrace{\sum_{\ell=1}^{P_h} \psi_\ell \cdot a_{h,\ell}}_{\text{lag contribution}}
+ \underbrace{\sigma_t \cdot \eta_t}_{\text{stochastic innovation}}
$$

To maintain the Markov property, lagged inflows $a_{h,\ell}$ are promoted to state variables pinned by column bounds — see section 5a below.

See [PAR(p) inflow model](/math/par-inflow-model) for the complete PAR(p) model specification.

## 5a. AR Lag Pinning

The AR dynamics equation (section 5) uses lagged inflows $a_{h,\ell}$ as LP variables. To maintain the Markov property in the SDDP decomposition, each lag variable is pinned to its incoming state value via equal lower and upper **column bounds** on the `inflow_lags` column. This binds the lag variables to the known incoming state, and the **reduced cost** of each pinned column provides the cut coefficient $\pi^{lag}_{h,\ell}$ for the corresponding inflow-lag dimension of the Benders cuts (section 11). Whether these lag dimensions actually enter the cut is governed by the stage's `state_variables` selection (which defaults to storage-only): when `inflow_lags` is disabled the lag columns are still pinned for the AR dynamics, but their reduced costs are projected out of the cut, yielding a storage-only cut even under a PAR($p$) fit — see [cut management](/math/cut-management).

For each hydro $h \in \mathcal{H}$ and each lag $\ell \in \{0, \ldots, L-1\}$:

$$
\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}
$$

where:

- $a_{h,\ell}$ = LP variable representing the inflow at lag $\ell$ for hydro $h$
- $\hat{a}_{h,\ell}$ = incoming state value (inflow observation from $\ell$ stages ago), written into both bounds via bound patching
- $L$ = maximum AR order across all hydros (uniform lag storage convention)

**Column count**: $N \times L$ pinned lag columns, where $N = |\mathcal{H}|$ is the number of operating hydros and $L$ is the system-wide maximum lag. All hydros store $L$ lags regardless of their individual AR order $P_h$; hydros with $P_h < L$ have zero-valued AR coefficients ($\psi_\ell = 0$ for $\ell > P_h$) in the dynamics equation, but their lag columns are still present and pinned. This uniform layout keeps the `inflow_lags` columns contiguous, so all lag cut coefficients are read in a single slice of the reduced-cost vector (section 4b). There is no corresponding lag-fixing row block.

**Cut coefficient**: $\pi^{lag}_{h,\ell}$ (marginal value of inflow history at lag $\ell$ for hydro $h$) is the reduced cost of the pinned `inflow_lags` column, unscaled by its prescaler column factor (§12, LP Scaling) — see [cut management](/math/cut-management).

## 5b. Realized-Inflow Definition Constraints (z-inflow)

For each hydro $h \in \mathcal{H}$, the LP includes an auxiliary variable $z_h$ representing the total realized inflow (m³/s) at the current stage. These variables are defined by equality constraints that combine the deterministic base, lag contributions, and stochastic noise:

$$
z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell} + \sigma_{m(t)} \cdot \eta_t
$$

where:

- $z_h$ = LP variable representing the realized inflow for hydro $h$ (free column, zero cost)
- $b_{h,m(t)}$ = deterministic base (precomputed from seasonal means and AR coefficients — see [PAR(p) model §7.4](/math/par-inflow-model))
- $\psi_{m(t),\ell}$ = original-unit AR coefficients (constraint matrix entries, set once at LP construction)
- $a_{h,\ell}$ = LP variables for lagged inflows (state variables, fixed by §5a)
- $\sigma_{m(t)} \cdot \eta_t$ = noise innovation (patched into the constraint RHS per scenario)

The z-inflow variable $z_h$ then enters the water balance constraint (§4) in place of the raw inflow term $a_h$, and its primal value after solving gives the realized inflow for reporting and simulation extraction.

The z-inflow columns sit between the AR lag columns and the incoming storage columns in the column layout (section 4b). Because state is pinned by column bounds rather than fixing rows, their constraint rows form the **first** equality block (section 4b). The RHS is patched per scenario with $b_{h,m(t)} + \sigma_{m(t)} \cdot \eta_t$, where $\eta_t$ is the effective noise (possibly clamped for inflow non-negativity — see [Inflow Non-Negativity](/math/inflow-nonnegativity)). These are not state variables and do not contribute to cut coefficients.

**Constraint count**: $N$ total constraints, where $N = |\mathcal{H}|$ is the number of operating hydros. See section 4b for the row layout.

## 5c. Anticipated Thermal Dispatch

Anticipated thermals (see [System Elements §4](/math/system-elements)) introduce a per-plant ring buffer of $K_i$ pending commitments and a per-stage commitment column. The lead $K_i$ is the integer stage lead resolved from the plant's `lead_stages` (a stage count) or `lead_time_hours` (a physical duration end-anchored on the stage calendar); every commitment is bounded, costed, and commissioning-gated at its **delivery** stage $t + K_i$, not the decision stage. The incoming ring-buffer state is pinned by column bounds (like all other state, §4a); two constraint blocks then couple the remaining variables. The layout is engineered so that the reduced cost on slot 0 of the pinned anticipated-state column at stage $t + 1$ propagates back to the predecessor's commitment column via the standard SDDP cut machinery without any decision-side coefficient corrupting the routing.

### State pinning (column bounds, one per `(slot, plant)`)

For each plant $i \in \{0, \ldots, A - 1\}$ and slot $s \in \{0, \ldots, K - 1\}$, the anticipated-state slot column is pinned by equal column bounds:

$$
\underline{x}^{\mathrm{a}}_{s, i, t} \;=\; \bar{x}^{\mathrm{a}}_{s, i, t} \;=\; \widehat{x}^{\mathrm{a}}_{s, i, t}
$$

The value $\widehat{x}^{\mathrm{a}}_{s, i, t}$ is the incoming state from the previous stage's ring-buffer shift (or, at $t = 0$, the seed `past_anticipated_commitments[i].values_mw[s]`). The slot is **pinned** by its column bounds alone; no decision-write coefficient appears anywhere on the slot column. The cut subgradient with respect to the incoming-state coordinate, $\partial Q_t / \partial \widehat{x}^{\mathrm{a}}_{s, i, t}$, is the **reduced cost** of the pinned slot column (§4a). Padding slots $s \geq K_i$ are pinned to zero by the same bounds; their reduced cost is zero because the slot carries no information.

### Fishing equality (one row per anticipated plant, every stage)

For each plant $i$ and every stage $t \in [0, T - 1]$, the per-block generation of plant $i$ is bound to the matured commitment in slot 0:

$$
\sum_{b = 0}^{B - 1} h_b \cdot g_{i, b, t} \;-\; H_t \cdot x^{\mathrm{a}}_{0, i, t} \;=\; 0
$$

where $h_b$ is the block-$b$ duration and $H_t = \sum_b h_b$. The row is active at every study stage; at $t < K_i$ the slot-0 value comes from the seed `values_mw[t]` and the LP cannot freely choose the per-block generation. From $t \geq K_i$ onward, slot 0 carries a past LP decision delivered via the ring buffer.

### State-out equality (one row per active plant)

For each plant $i$ active at stage $t$ (i.e., $t + K_i < T$), one auxiliary row pins the **anticipated-state-out** column $y^i_t$ to the decision $d^i_t$:

$$
y^i_t \;-\; d^i_t \;=\; 0
$$

The ring-buffer shift between stages uses $y^i_t$ — not $d^i_t$ — as the value written into slot $K_i - 1$ of the next stage's incoming state. The auxiliary $y$ column carries zero objective cost and serves only as the "carrier" that decouples the post-shift state from the decision column. Without this decoupling, the decision column $d^i_t$ would feed directly into the slot whose pinned reduced cost the next stage's cut reads back, corrupting the subgradient routing at $K_i = 1$ (slot 0 = slot $K_i - 1$ collision).

### Objective contributions

Two terms enter the objective for each anticipated plant:

$$
\sum_{i = 0}^{A - 1} c_i(t + K_i) \cdot H_{t + K_i} \cdot d^{\mathrm{NPV}}_{t + K_i} \cdot d^i_t
\;-\;
\sum_{i \in \mathrm{deliver}(t)} \sum_b c_i(t) \cdot h_b \cdot d^{\mathrm{NPV}}_t \cdot g_{i, b, t}
$$

The first sum is the **commitment cost discounted to the delivery stage** $t + K_i$. The second sum subtracts the standard per-block thermal cost at every delivery stage so the same MWh is not charged twice — once through the matured commitment and once through the per-block dispatch. Anticipated-state columns and anticipated-state-out columns carry zero objective cost; they are pure carriers of state. In run cost output this commitment term is reported as its own `anticipated_thermal_cost` category (zero when no anticipated plants are present), distinct from the per-block `thermal_cost`, so the named cost categories sum to the stage's immediate cost.

### Cut subgradient remapping

When the backward pass returns a subgradient on slot $(s, i)$ of stage $t + 1$ — read as the reduced cost of that pinned slot column — the cut-row builder maps it to a column in the **predecessor's** stage problem as follows:

- $s + 1 = K_i$ (slot 0 viewed from the next stage equals slot $K_i - 1$ viewed from this stage): the coefficient targets the predecessor's commitment column $d^i_{t}$ directly. This is the only branch that fires for $K_i = 1$.
- $s + 1 < K_i$: the coefficient targets the predecessor's outgoing-state slot $s + 1$, which holds the same commitment one stage earlier in its journey through the ring buffer.
- $s \geq K_i$ (padding): identity remap; the reduced cost is structurally zero so the cut coefficient on the padded slot does not propagate any sensitivity.

The recursion guarantees that, no matter how many stages elapse between commitment and delivery, the marginal cost of a future obligation reaches the original $d^i$ column it should price.

## 5d. Water Travel Time (In-Transit Buckets)

When an upstream release takes appreciable time to travel down the cascade, the water leaving a plant this stage does not reach its downstream neighbour in the same stage. Cobre models this as an **augmented in-transit state**: the volume still in transit on a cascade arc is carried through the Bellman recursion as extra state coordinates, exactly like storage (§4a) and AR lags (§5a). This subsection formulates that state, its pinning, the delayed-arrival water-balance entry, the ring that advances it, its cut coefficient, and the horizon limitation.

**Scope.** A hydro $h$ declares a travel-time arc when its `travel_time_hours` is present and strictly positive **and** it has a downstream plant; the diversion and pumping arcs carry no travel time (main cascade arc only). An absent or zero travel time is an instantaneous transfer — the upstream release enters the downstream water balance in the same stage (§4) and no state is added.

### In-transit bucket state

For each receiving (downstream) plant $i$ that has at least one incoming travel-time arc, the in-transit water destined for $i$ is discretized into **maturity lags** $d \in \{1, \ldots, L_i\}$. The bucket $b_{i,d}$ (hm³) holds the aggregate volume — summed over every upstream arc feeding $i$ — that matures into plant $i$'s reservoir $d - 1$ stages after the current one. Lag $d = 1$ matures at the current stage; lag $d = L_i$ is the freshest deposit, furthest from delivery. The per-plant depth $L_i$ is the deepest maturity lag any arc into $i$ can reach on the stage calendar. The confluence of several arcs into one plant collapses into this single aggregated bucket block.

The buckets extend the state vector. With $B = \sum_i L_i$ the total bucket count, the state dimension is

$$
n_{\text{state}} = N(1 + L) + B + A \, K_{\max}
$$

The bucket block sits **after** the AR inflow lags and **before** the anticipated-thermal slots in the canonical state order (§4b). Buckets are ordered canonically by $(\text{plant}, \text{lag})$ — the receiving plant in the same $(\texttt{operational\_start\_date}, \texttt{id})$ order every state block uses, then ascending maturity lag. When no arc is declared, $B = 0$ and the layout reproduces the bucket-free state byte-for-byte.

### State pinning (column bounds)

Like every other incoming state coordinate, each incoming bucket is carried on its own LP column (`transit_buckets_in`, §4b) and pinned to its trial value by equal lower and upper **column bounds**:

$$
\underline{b}^{\,\mathrm{in}}_{i,d} = \bar{b}^{\,\mathrm{in}}_{i,d} = \hat{b}_{i,d}
$$

where $\hat{b}_{i,d}$ is the incoming in-transit volume carried from the previous stage's ring shift (or, at the first stage, the seed derived from `past_defluences` — see [system elements §5](/math/system-elements) and the hydro Implementation notes). The **reduced cost** of the pinned bucket column is the cut coefficient for that in-transit dimension (see below) — the same regime used for storage (§4a) and AR lags (§5a). No fixing row is involved; the `transit_bucket_fixing` block is a permanent empty sentinel like the other state blocks (§4b).

### Delayed-arrival water-balance entry

The bucket maturing at the current stage, $b^{\mathrm{in}}_{i,1}$, delivers its volume into receiving plant $i$'s water balance (§4). Because the bucket is already an accumulated volume (hm³), it enters the balance directly — outside the $\zeta$ flow-to-volume conversion — with a $-1.0$ coefficient in the all-variables-on-the-LHS form:

$$
v_i - v^{\mathrm{in}}_i - b^{\mathrm{in}}_{i,1} - \zeta\big[\,\cdots\,\big] = 0
$$

Equivalently, $b^{\mathrm{in}}_{i,1}$ is a stage-level inflow added to the reservoir. Because the confluence of several upstream arcs is already summed inside the single state coordinate, exactly one delayed-arrival entry appears per receiving plant.

Under the parallel-blocks formulation the maturing bucket is a single stage-level entry. Under the [chronological-blocks formulation](/math/block-formulations), the same volume is delivered across the arrival stage's own blocks, weighted by a fixed **arrival density** $\phi_{i,k} \ge 0$ with $\sum_k \phi_{i,k} = 1$, resolved against the arrival stage's block partition. The arrival density is a single fixed split per maturing bucket — it does not depend on which source block released the water, an accepted modeling bound when the release and arrival stages partition their hours differently.

Once a travel-time arc is declared for an upstream plant, that plant's release no longer enters the downstream water balance as the same-stage upstream term of §4; it is routed into the buckets at release and re-enters only as this delayed-arrival term at maturity.

### Ring advance (DeliveryRing)

The buckets advance through the recursion with the same generic **DeliveryRing** primitive that carries the anticipated-thermal ring (§5c): a slot-major, lane-minor grid of $B$ outgoing and $B$ incoming columns, one lane per receiving plant. The ring performs a Markov-1 slot advance — the water at maturity lag $d + 1$ at one stage is at maturity lag $d$ at the next, one step closer to delivery. Within each stage this is encoded by in-LP **shift rows** binding the outgoing carrier to the incoming state one slot deeper,

$$
b^{\mathrm{out}}_{i,d} \equiv b^{\mathrm{in}}_{i,d+1}
$$

(one row per interior slot), together with the cross-stage identity that carries the outgoing state into the next stage's incoming state — never an out-of-LP shift. The outgoing bucket state $b^{\mathrm{out}}_{i,d}$ is resolved by identity — it is a genuine LP column, part of $n_{\text{state}}$ — and its freshest slots receive the current stage's upstream releases through per-arc **deposit** entries: each release, scaled by the fraction of it maturing at each reachable lag, is written into the corresponding outgoing bucket slots. This is the direct analogue of the anticipated ring's decision-write, reusing the same skeleton.

### Cut coefficient

Because the incoming bucket column is pinned at equal bounds, its reduced cost is the sensitivity $\partial Q_t / \partial \hat{b}_{i,d}$ of the optimal stage cost to the in-transit volume, unscaled by the column prescaler (§12, LP Scaling):

$$
\pi^{b}_{i,d} = \bar{c}^{\,b}_{i,d} / d^{col}_{i,d}
$$

Transit buckets are **always** included in the cut projection — never gated by the per-stage `state_variables` selection that can drop the storage or inflow-lag dimensions (see [cut management](/math/cut-management)). Each cut therefore carries one coefficient per bucket dimension, contiguous with the storage, lag, and anticipated coefficients and read from the same reduced-cost mechanism (§11). In the policy manifest a bucket dimension is tagged with the **downstream** hydro as its entity and the maturity lag as its sub-index.

### Horizon limitation

In-transit volume that would mature **after the study's last stage is dropped** — it is **not** credited to terminal storage. A release late in the horizon whose travel time carries it past the final stage $T$ leaves the modeled system without arriving. This is a deliberate methodology limitation: the deepest maturity lag active at stage $t$ is capped at $T - 1 - t$, so no bucket ever points beyond the horizon and the share is discarded rather than misdirected onto an earlier lag. Terminal-storage credit for still-in-transit water is deferred.

## 6. Hydro Generation Constraints

Cobre supports two production models during training, in increasing order of complexity. A third model (linearized head) is available during simulation only — see [hydro production models §3](/math/hydro-production-models). The model can vary by stage or season per hydro.

Both models are evaluated **per cell** $(h, b)$ (§3) rather than per plant; a single-cell plant's constraint is byte-identical to the pre-partition, per-plant form.

**Constant Productivity Model** (for each cell $(h, b)$ of hydro $h \in \mathcal{H}^{const}$, block $k$):

$$
g_{h,b,k} = \rho_h \cdot q_{h,b,k}
$$

Constant-productivity hydros carry no separate generation column: $g_{h,b,k}$ is this direct multiple of the cell's own turbined-flow column, so a cell's generation bound is enforced by folding it into that column's bound (§8) rather than by a bound on $g_{h,b,k}$ itself.

**FPHA Model** (for each plane $m \in \mathcal{M}_h$, cell $(h, b)$ of hydro $h \in \mathcal{H}^{fpha}$, block $k$):

$$
g_{h,b,k} \leq \sigma_{h,b} \big( \gamma^m_0 + \gamma^m_v \cdot v^{avg}_h + \gamma^m_s \cdot s_{h,k} \big) + \gamma^m_q \cdot q_{h,b,k}
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is the average storage during the stage, with $v^{in}_h$ being the incoming storage LP variable (§4a) and $v_h$ the end-of-stage storage — a single plant-level quantity shared by every cell, since storage is not partitioned. $\sigma_{h,b}$ is cell $(h,b)$'s **apportionment share** of plant $h$'s declared turbine capacity,

$$
\sigma_{h,b} = \frac{\sum_{g \,\in\, (h,b)} \bar{Q}_g}{\sum_{g \,\in\, h} \bar{Q}_g}
$$

(the ratio of the cell's own unit groups' declared `max_turbined_m3s` to the plant's total, $0$ when the plant's total is $0$), satisfying $\sum_{b \in \mathcal{B}_h} \sigma_{h,b} = 1$. Only the plane's flow-independent part — the intercept $\gamma^m_0$, the storage term, and the spillage term — is apportioned by $\sigma_{h,b}$; the flow coefficient $\gamma^m_q$ stays on the cell's own $q_{h,b,k}$ unscaled, because it alone is homogeneous in the cell partition (summing the per-cell rows at fixed $v^{avg}_h$, $s_{h,k}$, and $\sum_b q_{h,b,k}$ recovers the plant-level bound this replaces). A single-cell plant has $\sigma_{h,b} = 1$ exactly, reproducing the pre-partition row with no special case.

**Generation Bounds** (per cell $(h, b)$, block $k$ — the FPHA generation column's own bound; a constant-productivity cell has no such column, so its generation cap is folded into the turbined-flow bound below instead):

$$
\underline{G}_{h,b} - \sigma^{g-}_{h,b,k} \leq g_{h,b,k} \leq \bar{G}_{h,b}
$$

$$
\underline{G}_{h,b} = \sum_{g \,\in\, (h,b)} \underline{G}_g, \qquad \bar{G}_{h,b} = \min\!\Big( \sum_{g \,\in\, (h,b)} \bar{G}_g,\ \ \bar{G}_h \Big)
$$

Generation bounds are user-defined (declared per unit group, not derived from turbined flow). The lower bound is soft, with one slack $\sigma^{g-}_{h,b,k}$ **per cell** — priced at the plant's own penalty $c^{gv-}_h$ at full magnitude on every cell of a split plant, never divided by cell count; a constant-productivity cell's floor couples this same slack to $\rho_h \cdot q_{h,b,k}$ rather than to a generation column. The upper bound's plain sum over the cell's own unit groups closes against the plant's own resolved maximum $\bar{G}_h$ — a bounds override may never raise a cell above it. See [system elements §5](/math/system-elements).

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
\underline{V}_h - \sigma^{v-}_h \leq v_h \leq \bar{V}_h
$$

The lower bound (dead volume) is soft — the slack $\sigma^{v-}_h$ has a very high penalty above deficit cost. The upper bound (reservoir capacity) is hard; excess water is handled by emergency spillage. During the filling period, this $\underline{V}_h$ lower bound is inactive (storage can be anywhere in $[0, \bar{V}_h]$); the per-stage filling floor below takes its place.

**Filling floors** (for filling hydros, at every stage $t \in [\text{start\_stage\_id}, \text{entry\_stage\_id})$):

$$
v_h + \sigma^{fill}_h \geq V^{\text{target}}_t,
\qquad
V^{\text{target}}_t = \min\!\Big( V^{\text{target}}_{t+1} - \zeta_{t+1}\,\text{rate}_{t+1},\ \underline{V}_h \Big),
\quad V^{\text{target}}_{L} = \underline{V}_h
$$

The minimum end-of-stage storage $V^{\text{target}}_t$ ramps up at the configured accumulation rate `filling_min_rate_m3s` (= $\text{rate}_t$) and reaches the dead volume $\underline{V}_h$ at the last filling stage $L = \text{entry\_stage\_id} - 1$; $\zeta_t$ converts the rate over the stage duration into hm³. The slack $\sigma^{fill}_h$ is priced at $c^{fill}_h$, which is pinned **below deficit** (not the system maximum). This replaces the earlier single terminal constraint at `entry_stage_id - 1`. See [Penalty System §6](/math/penalty-system).

### Turbined Flow Bounds (per cell $(h, b)$, block $k$)

$$
\underline{Q}_{h,b} - \sigma^{q-}_{h,b,k} \leq q_{h,b,k} \leq \bar{Q}_{h,b}
$$

The lower bound is soft, with one slack $\sigma^{q-}_{h,b,k}$ per cell, priced at the plant's own penalty $c^{tv-}_h$ at full magnitude on every cell — never divided by cell count; it is the plain sum of the cell's own unit groups' resolved minimum turbined flow, $\underline{Q}_{h,b} = \sum_{g \,\in\, (h,b)} \underline{Q}_g$. The upper bound is hard and closes against the plant's own resolved maximum, never raised above it:

$$
\bar{Q}_{h,b} = \min\!\left( \sum_{g \,\in\, (h,b)} \mathrm{fold}(g),\ \ \bar{Q}_h \right)
$$

where $\mathrm{fold}(g) = \bar{Q}_g$ for an FPHA hydro (turbined flow and generation are independent columns there) and $\mathrm{fold}(g) = \min(\bar{Q}_g,\ \bar{G}_g / \rho_h)$ for a constant-productivity hydro — each group's own flow cap and MW-implied flow cap must be folded **before** summing across the cell, since $\min$ does not distribute over a sum of groups that bind on different sides. This is the mechanism that enforces a constant-productivity cell's generation cap (§6): there is no separate generation column to bound directly.

### Diversion Flow Bounds (per hydro $h$, block $k$)

$$
0 \leq u_{h,k} \leq \bar{U}_h
$$

Both bounds are hard. Diversion cost is a regularization term (see §1.4), not a violation penalty.

### Pumping Flow Bounds (per station $j$, block $k$)

$$
\underline{P}_j \leq p_{j,k} \leq \bar{P}_j
$$

Both bounds are hard.

## 9. Constraint Violation Penalty Terms

The per-block constraint violation penalties in the objective (referenced from §2) are:

$$
\sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \Big[
  c^{tv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{q-}_{h,b,k} + c^{ov-}_h \sigma^{o-}_{h,k} + c^{ov+}_h \sigma^{o+}_{h,k} + c^{gv-}_h \sum_{b \in \mathcal{B}_h} \sigma^{g-}_{h,b,k}
  + c^{ev+}_h \sigma^{e+}_{h,k} + c^{ev-}_h \sigma^{e-}_{h,k}
\Big]
$$

The turbined- and generation-minimum slacks are **per cell** — each of a split plant's cells carries its own slack column and its own row, priced at the plant's penalty at full magnitude, never divided across cells. The outflow and evaporation slacks stay per-plant: outflow has no per-cell column to attribute a floor to.

$$
+ \sum_{h \in \mathcal{H}} T \cdot c^{wv}_h (\sigma^{w-}_h + \sigma^{w+}_h)
$$

where $T = \sum_k \tau_k$ is the total stage duration in hours. Withdrawal violation slacks ($\sigma^{w-}_h$, $\sigma^{w+}_h$) are stage-level (not per-block) and bidirectional: $\sigma^{w-}_h$ penalizes under-delivery (the realized withdrawal $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$ falls short of the target), and $\sigma^{w+}_h$ penalizes over-delivery. The **withdrawal target $r_h$ is signed** (§4), and the slack bounds ensure the realized withdrawal cannot flip sign relative to the target:

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

User-defined linear constraints (per constraint $g \in \mathcal{G}$):

$$
\sum_{e} \gamma_{g,e} \cdot x_e \quad \{\leq, =, \geq\} \quad b_g
$$

where $x_e$ can reference any LP variable using expression syntax:

- `hydro_storage(id)`, `hydro_turbined(id)`, `hydro_spillage(id)`
- `thermal_generation(id)`, `bus_deficit(id)`, etc.

`hydro_turbined` and `hydro_generation` additionally accept a named `bus=` argument selecting one **(hydro, bus) cell** of a plant split across several buses — e.g. `hydro_turbined(5, bus=2)` — resolving to that cell's own column; no other variable form accepts it. An optional positional block argument, when present, precedes the named argument: `f(id)`, `f(id, block)`, `f(id, bus=b)`, and `f(id, block, bus=b)` all parse. Omitting `bus=` on a plant with more than one cell addresses every one of its cells at once, matching the whole-entity reference every other variable form uses.

The coefficients $\gamma_{g,e}$ and the RHS $b_g$ may be either literal numeric values or **named scalar parameters**. A scalar parameter resolves to a single number per stage and can carry one of four kinds:

| Kind        | Value semantics                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `constant`  | One value for every stage                                                                                 |
| `per_stage` | Explicit value per stage                                                                                  |
| `seasonal`  | One value per season; stages inherit the value from their season                                          |
| `computed`  | Value derived from a small expression evaluated at LP-build time (e.g., a fraction of installed capacity) |

Resolution happens once at LP-build time, so the LP coefficients are still numeric at solve time — the parameter mechanism does not introduce LP-variable coupling between constraints. Methodology relevance: it lets the corpus express ramping limits, capacity caps, and operator-imposed quotas that vary by stage or season without authoring a separate constraint per stage. Coefficient and RHS values can therefore be **stage-varying constants**, not just literal numbers.

Generic constraints can have optional slack variables with configurable penalties.

**Row materialization**: a constraint bound declared with `block_id = None` over a **block-independent** expression — one whose every term references a stock variable (incoming storage $v^{in}_h$, outgoing storage $v_h$, evaporation outflow $e_{h,k}$ collapsed to its stage average, or an anticipated-thermal commitment) — is materialized as a **single stage-level row** priced by the total stage hours $T$, since per-block rows would be identical. A `block_id = None` bound on a block-level expression, or any `block_id = Some(k)` bound, still produces one row per relevant block. This is an LP row-count optimization that is cost- and parity-neutral.

## 11. Benders Cuts

For each active cut $i$ from previous iterations:

$$
\theta \geq \alpha_i + \sum_{h \in \mathcal{H}} \pi^v_{i,h} \cdot v_h + \sum_{h,\ell} \pi^{lag}_{i,h,\ell} \cdot a_{h,\ell}
$$

where:

- $\alpha_i$ = cut intercept (RHS)
- $\pi^v_{i,h}$ = coefficient for storage state variable
- $\pi^{lag}_{i,h,\ell}$ = coefficient for AR lag state variable

When anticipated thermals are present, the cut carries one additional coefficient per anticipated-state slot (§5c), read from the same reduced-cost mechanism. When travel-time arcs are present, it likewise carries one coefficient per in-transit bucket dimension (§5d); unlike the storage and lag coefficients, the bucket coefficients are always part of the cut projection.

Cuts live in an **append-only pool** at stable slot indices: every cut ever generated is retained for the lifetime of the run, and only the active subset is baked into each iteration's stage template. Deactivation toggles a cut row's bound to a trivially-satisfied $\pm\infty$ sentinel rather than removing the row, so slot indices stay stable and reactivation is exact. See [cut management](/math/cut-management).

For cut coefficient derivation, aggregation, and selection strategies, see [cut management](/math/cut-management).

## 12. LP Scaling

The stage LP is numerically conditioned via a three-step scaling procedure applied once at template construction time. Scaling improves solver convergence by reducing the condition number of the constraint matrix without changing the optimization argmin.

### 12.1 Cost Scaling

All objective coefficients (except the future cost variable $\theta$) are divided by a fixed positive constant $K$, chosen once per study. $K$ scales the cost domain uniformly and leaves the constraint matrix and feasible region untouched, so the LP argmin is invariant to it and any two choices of $K$ agree in exact arithmetic:

$$
\tilde{c}_j = \frac{c_j}{K} \quad \text{for all } j \neq \theta
$$

The $\theta$ variable retains its coefficient of 1.0 because the Benders cuts enforce $\theta \geq \alpha_{scaled}$ where $\alpha_{scaled} = Q_{successor} / K$, so $\theta$ already operates in scaled cost space. The LP objective is $\sum_j \tilde{c}_j x_j + 1.0 \cdot \theta$, and the total scaled objective equals $(C_{stage} + C_{future}) / K$. All cost-domain outputs (objective values, duals, cost breakdowns) are multiplied by $K$ at the reporting boundary to recover original units.

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

- Matrix entries: $\hat{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}$
- Row bounds: $\hat{l}_i^{row} = l_i^{row} \cdot d_i^{row}$, $\hat{u}_i^{row} = u_i^{row} \cdot d_i^{row}$

Column bounds and objective coefficients are not modified by row scaling.

The combined scaling produces the standard $D_r \cdot A \cdot D_c$ form where $D_r$ and $D_c$ are diagonal scaling matrices.

:::note[Dual unscaling]
LP row duals are in the scaled problem's space. To recover original-unit duals: $\pi_i^{original} = \pi_i^{scaled} \cdot d_i^{row} \cdot K$. The per-column and per-row scale factors are stored in the stage LP template for use during dual extraction and cut coefficient computation. This recovery is exact when the solve applies no scaling beyond Cobre's own prescaling — the case by default; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for.
:::

:::note[Reduced-cost unscaling for cut coefficients]
State cut coefficients are read as the **reduced costs** of the pinned incoming-state columns (§4a, Incoming-Storage Pinning), not as row duals. A reduced cost is reported in the scaled problem's space; the original-unit sensitivity is $\pi_j^{original} = (\bar{c}_j^{scaled} / d_j^{col}) \cdot K$ — divide by the column factor, then multiply by $K$. The **division** by $d_j^{col}$ (not multiplication) follows from the column transform $\tilde{x}_j = x_j / d_j^{col}$ of §12.2 (Column Scaling): the LP solver/backend differentiates the scaled objective with respect to $\tilde{x}_j$, so recovering $\partial Q / \partial x_j$ divides the column factor back out. When the solve applies no scaling beyond Cobre's own prescaling — the case by default — this single unscaling is exact; if the backend applies a further scaling of its own on top of the prescaled matrix, a second scaling factor enters that this identity does not account for, and the single unscaling no longer exactly recovers original units. (Cut coefficients are stored in scaled cost space — the $\bar{c}_j^{scaled}/d_j^{col}$ value — with $K$ applied only at the reporting boundary, as for all cost-domain quantities.)
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
