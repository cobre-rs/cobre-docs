# LP Formulation

## Purpose

This spec presents the complete stage subproblem LP for the Cobre SDDP solver: the objective function with its cost taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function. It uses the **parallel blocks** formulation by default.

**Reading order**: [SDDP algorithm](sddp-algorithm.md) → [system elements](system-elements.md) → **this spec** → [equipment formulations](equipment-formulations.md)

For what each physical element represents and its decision variables, see [system elements](system-elements.md). For variable naming conventions and index sets, see [notation conventions](../overview/notation-conventions.md).

## 1. Cost and Penalty Taxonomy

The objective function includes three categories of penalty/cost terms plus resource costs. This taxonomy aligns with [Penalty System §2](../data-model/penalty-system.md). Understanding these categories is essential for setting appropriate parameter values and interpreting solution reports.

### 1.1 Resource Costs (Actual Operating Expenses)

Resource costs represent actual generation or contractual expenditures:

| Cost               | Symbol         | Units  | Typical Values | Objective Term                                           |
| ------------------ | -------------- | ------ | -------------- | -------------------------------------------------------- |
| Thermal generation | $c^{th}_{j,s}$ | \$/MWh | 50-500         | $\sum_{j,k,s} \tau_k \cdot c^{th}_{j,s} \cdot g_{j,k,s}$ |
| Contract dispatch  | $c^{ctr}_c$    | \$/MWh | 50-300         | $\sum_{c,k} \tau_k \cdot c^{ctr}_c \cdot \chi_{c,k}$     |

Contract prices are positive for imports (cost) and negative for exports (revenue), so a single summation naturally handles both directions. See [system elements §8](system-elements.md) for the unidirectional contract model.

> **Note on Pumping**: Pumping stations do not have an explicit cost parameter. The cost of pumping is implicitly determined by the marginal cost of energy at the bus where the pump is connected — see [equipment formulations](equipment-formulations.md) for details.

### 1.2 Category 1: Recourse Slacks (LP Feasibility)

These ensure the SDDP algorithm has relatively complete recourse — every subproblem must be feasible regardless of scenario realization:

| Penalty           | Symbol          | Units  | Typical Values | Purpose                              |
| ----------------- | --------------- | ------ | -------------- | ------------------------------------ |
| Deficit           | $c^{def}_{b,s}$ | \$/MWh | 1,000-10,000   | Value of unserved energy (piecewise) |
| Excess generation | $c^{exc}_b$     | \$/MWh | 0.001-0.1      | Absorb uncontrollable surplus        |

### 1.3 Category 2: Constraint Violation Penalties (Policy Shaping)

These provide slack for physical or operational constraints that may be impossible to satisfy under extreme conditions. Their cost must be high enough to affect the value function in earlier stages:

| Penalty                  | Symbol       | Units       | Typical Values | Violated Constraint                   |
| ------------------------ | ------------ | ----------- | -------------- | ------------------------------------- |
| Storage below minimum    | $c^{sv-}_h$  | \$/hm³      | 10,000+        | $v_h \geq \underline{V}_h$            |
| Filling target shortfall | $c^{fill}_h$ | \$/hm³      | 50,000+        | $v_h \geq \underline{V}_h$ (terminal) |
| Turbined flow minimum    | $c^{tv-}_h$  | \$/(m³/s·h) | 500-1,000      | $q_{h,k} \geq \underline{Q}_h$        |
| Outflow minimum          | $c^{ov-}_h$  | \$/(m³/s·h) | 500-1,000      | $o_{h,k} \geq \underline{O}_h$        |
| Outflow maximum          | $c^{ov+}_h$  | \$/(m³/s·h) | 500-1,000      | $o_{h,k} \leq \bar{O}_h$              |
| Generation minimum       | $c^{gv-}_h$  | \$/MWh      | 1,000-2,000    | $g_{h,k} \geq \underline{G}_h$        |
| Evaporation violation    | $c^{ev}_h$   | \$/(m³/s·h) | 5,000+         | Evaporation within physical limits    |
| Withdrawal violation     | $c^{wv}_h$   | \$/(m³/s·h) | 1,000-5,000    | Water withdrawal commitment           |

### 1.4 Category 3: Regularization Costs (Solution Guidance)

Small costs that guide the solver toward physically preferred solutions when the LP would otherwise be indifferent. Must be orders of magnitude smaller than any economic cost:

| Cost               | Symbol          | Units       | Typical Values | Purpose                                         |
| ------------------ | --------------- | ----------- | -------------- | ----------------------------------------------- |
| Spillage           | $c^{spill}_h$   | \$/(m³/s·h) | 0.001-0.01     | Prefer turbining over spilling when indifferent |
| FPHA turbined flow | $c^{fpha}_h$    | \$/(m³/s·h) | 0.01-0.1       | Prevent interior FPHA solutions (FPHA-only)     |
| Diversion          | $c^{div}_h$     | \$/(m³/s·h) | 0.01-0.1       | Prefer main channel flow                        |
| Curtailment        | $c^{curt}_r$    | \$/MWh      | 0.001-0.01     | Prioritize using available NCS generation       |
| Exchange           | $c^{exch}_\ell$ | \$/MWh      | 0.01-1.0       | Prevent unnecessary power flows                 |

> **Note**: Regularization costs should be at least 2-3 orders of magnitude smaller than economic costs to avoid distorting the optimal solution.

### 1.5 Penalty Priority Ordering

The following ordering must be maintained (from highest to lowest):

$$c^{fill} > c^{sv-} > c^{def} > c^{tv-}, c^{ov\pm}, c^{gv-}, c^{ev}, c^{wv} > c^{th}, c^{ctr} > c^{spill}, c^{fpha}, c^{div}, c^{curt}, c^{exch}$$

1. **Filling target** ($c^{fill}$): Highest penalty — filling dead volume is prioritized above all other objectives
2. **Storage violation** ($c^{sv-}$): Above deficit — reservoir below dead volume risks dam safety
3. **Deficit** ($c^{def}$): Value of lost load; exceeds any generation cost
4. **Constraint violations** ($c^{tv-}$, $c^{ov\pm}$, $c^{gv-}$, $c^{ev}$, $c^{wv}$): Exceed typical marginal cost but allow violation when physically necessary
5. **Resource costs** ($c^{th}$, $c^{ctr}$): Market-based or fuel-based
6. **Regularization** ($c^{spill}$, $c^{fpha}$, $c^{div}$, $c^{curt}$, $c^{exch}$): Near-zero

For the full penalty specification, cascade resolution, and stage-varying overrides, see [Penalty System](../data-model/penalty-system.md).

> **Note on Thermal Plants**: Thermal bounds ($\underline{G}_j$, $\bar{G}_j$) are hard constraints with no slack variables. Thermal dispatch is directly controllable, unlike hydro constraints that may be violated due to exogenous inflow uncertainty.

> **FPHA validation rule**: For each hydro using the `fpha` production model, $c^{fpha}_h > c^{spill}_h$ must hold. See [Penalty System §2](../data-model/penalty-system.md).

### 1.6 Objective Function Structure

The complete stage objective is:

$$
\min \; \underbrace{C^{resource}}_{\text{thermal, contracts}} + \underbrace{C^{recourse}}_{\text{deficit, excess}} + \underbrace{C^{violation}}_{\text{constraint slacks}} + \underbrace{C^{regularization}}_{\text{spillage, exchange, ...}} + \theta
$$

where each component is summed over blocks with appropriate time weighting:

$$C^{component} = \sum_{k \in \mathcal{K}} \tau_k \cdot (\text{cost terms for component})$$

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

> **Note**: Storage violation penalties ($\sigma^{v-}_h$, $\sigma^{fill}_h$) are **not** multiplied by $\tau_k$ because they apply to end-of-stage storage (hm³), not to per-block flow rates. All other penalty terms are per-block and carry the $\tau_k$ weighting. Contract prices $c^{ctr}_c$ are positive for imports and negative for exports, so a single sum handles both.

## 3. Load Balance Constraint

For each bus $b \in \mathcal{B}$ and block $k \in \mathcal{K}$:

$$
\sum_{h \in \mathcal{H}_b} g_{h,k} + \sum_{j \in \mathcal{T}_b} \sum_s g_{j,k,s}
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

**Dual variable**: $\pi^{lb}_{b,k}$ (marginal cost of energy at bus $b$, block $k$, in \$/MW; divide by $\tau_k$ for \$/MWh — see [Variable Units Convention](system-elements.md))

For the physical meaning of each element in the balance, see [system elements](system-elements.md).

## 4. Hydro Water Balance

For each hydro $h \in \mathcal{H}$ (parallel blocks formulation):

$$
v_h = v^{in}_h + \zeta \Bigg[ a_h + \sum_{k \in \mathcal{K}} w_k \Big(
  \underbrace{\sum_{i \in \mathcal{U}_h} (q_{i,k} + s_{i,k} + u_{i,k})}_{\text{Inflow from upstream}}
  + \underbrace{\sum_{i: \text{div}=h} u_{i,k}}_{\text{Diverted inflow}}
  + \underbrace{\sum_{j: \text{dest}=h} p_{j,k}}_{\text{Pumped inflow}}
$$

$$
  - \underbrace{q_{h,k} - s_{h,k} - u_{h,k}}_{\text{Outflows}}
  - \underbrace{e_{h,k}}_{\text{Evaporation}}
  - \underbrace{r_{h,k}}_{\text{Withdrawal}}
  - \underbrace{\sum_{j: \text{src}=h} p_{j,k}}_{\text{Pumped outflow}}
\Big) \Bigg]
$$

where:

- $v^{in}_h$ = incoming storage LP variable, fixed to the previous stage's value via the storage fixing constraint (§4a)
- $a_h$ = incremental inflow (from AR model, see [PAR(p) inflow model](par-inflow-model.md))
- $w_k = \tau_k / \sum_j \tau_j$ = block weight
- $\zeta = 0.0036 \times \sum_k \tau_k$ = time conversion factor

> **Dimensional Consistency** (see [Variable Units Convention](system-elements.md)):
>
> - LHS: $v_h$ [hm³]
> - RHS: $v^{in}_h$ [hm³] + $\zeta$ [hm³/(m³/s)] × (flow terms [m³/s])
> - The factor $\zeta$ converts all flow rates (m³/s) to volumes (hm³) accumulated over the stage
> - Block weights $w_k$ are dimensionless and sum to 1
> - The AR inflow $a_h$ is in m³/s (average rate over the stage)
> - All flow decision variables use rate units (m³/s) — the conversion to volume happens only through $\zeta$ in this constraint

**Dual variable**: $\pi^{wb}_h$ (water value — captures the marginal value of incoming storage as seen through the hydro balance, but is **not** used directly as a cut coefficient; the cut coefficient comes from the storage fixing constraint dual, see §4a and [cut management](cut-management.md))

## 4a. Storage Fixing Constraints

The water balance (§4), FPHA hyperplanes (§6), and generic constraints (§10) all involve the incoming storage value $\hat{v}_h$. Rather than embedding $\hat{v}_h$ as a constant in the RHS of each of these constraints (which would require collecting duals from all of them to compute cut coefficients), Cobre introduces an explicit **incoming storage LP variable** $v^{in}_h$ with a fixing constraint:

For each hydro $h \in \mathcal{H}$:

$$
v^{in}_h = \hat{v}_h
$$

where:

- $v^{in}_h$ = LP variable representing the incoming storage for hydro $h$ (unbounded)
- $\hat{v}_h$ = incoming state value (end-of-stage storage from the previous stage, fixed via RHS patching)

The variable $v^{in}_h$ then appears as an LP variable (not a constant) in all constraints that depend on incoming storage: the water balance (§4), the FPHA average storage computation (§6), and any generic constraints (§10) that reference incoming storage.

**Dual variable**: $\pi^{fix}_h$ (marginal value of incoming storage for hydro $h$, used directly as the storage cut coefficient — see [cut management](cut-management.md))

**Why this design**: By LP duality, the dual of the fixing constraint $v^{in}_h = \hat{v}_h$ captures the total sensitivity $\partial Q_t / \partial \hat{v}_h$, automatically accounting for all downstream effects through water balance, FPHA, and generic constraints. This eliminates the need to combine duals from multiple constraint types to compute the storage cut coefficient — a single dual value suffices. This is the same "fishing constraint" technique used by SDDP.jl and is analogous to how the AR lag fixing constraints (§5a) work for inflow lags.

**Constraint count**: $N$ total constraints, where $N = |\mathcal{H}|$ is the number of operating hydros.

> **Implementation notes**:
>
> - The incoming storage variable $v^{in}_h$ has **no bounds** — its value is entirely determined by the fixing constraint. The outgoing storage $v_h$ retains its original bounds (§8).
> - The RHS value $\hat{v}_h$ is patched per scenario during the forward pass ([Training Loop SS4.2a](../architecture/training-loop.md)) and backward pass, at row $h$ ([Solver Abstraction SS2.2](../architecture/solver-abstraction.md)).
> - The dual extraction for cut coefficients reads $\pi^{fix}_h$ from the contiguous top region of the dual vector, where the row-column index symmetry enables a single slice read for all storage cut coefficients ([Training Loop SS7.2](../architecture/training-loop.md)).
> - The column for $v^{in}_h$ is placed after the state prefix (after outgoing storage and lag variables) — see [Solver Abstraction SS2.1](../architecture/solver-abstraction.md). The incoming storage variables are **not** part of the state vector; they are auxiliary variables whose only purpose is to provide a clean dual for cut coefficient extraction.

## 5. AR Inflow Dynamics

The incremental inflow $a_h$ is determined by the PAR(p) autoregressive model:

$$
a_h = \underbrace{\left( \mu_t - \sum_{\ell=1}^{P_h} \psi_\ell \mu_{t-\ell} \right)}_{\text{deterministic base}}
+ \underbrace{\sum_{\ell=1}^{P_h} \psi_\ell \cdot a_{h,\ell}}_{\text{lag contribution}}
+ \underbrace{\sigma_t \cdot \eta_t}_{\text{stochastic innovation}}
$$

To maintain the Markov property, lagged inflows $a_{h,\ell}$ are promoted to state variables with explicit fixing constraints — see [SS5a](#5a-ar-lag-fixing-constraints) below.

See [PAR(p) inflow model](par-inflow-model.md) for the complete PAR(p) model specification.

## 5a. AR Lag Fixing Constraints

The AR dynamics equation (SS5) uses lagged inflows $a_{h,\ell}$ as LP variables. To maintain the Markov property in the SDDP decomposition, each lag variable must be fixed to its incoming state value via an explicit equality constraint. These constraints serve a dual purpose: they bind the lag variables to the known incoming state, and their dual multipliers $\pi^{lag}_{h,\ell}$ provide the cut coefficients for the inflow lag dimensions of the Benders cuts (SS11).

For each hydro $h \in \mathcal{H}$ and each lag $\ell \in \{0, \ldots, L-1\}$ (0-based, matching the implementation index convention in [Solver Abstraction SS2.2](../architecture/solver-abstraction.md)):

$$
a_{h,\ell} = \hat{a}_{h,\ell}
$$

where:

- $a_{h,\ell}$ = LP variable representing the inflow at lag $\ell$ for hydro $h$
- $\hat{a}_{h,\ell}$ = incoming state value (inflow observation from $\ell$ stages ago, fixed via RHS patching)
- $L$ = maximum AR order across all hydros (uniform lag storage convention)

**Constraint count**: $N \times L$ total constraints, where $N = |\mathcal{H}|$ is the number of operating hydros and $L$ is the system-wide maximum lag. All hydros store $L$ lags regardless of their individual AR order $P_h$; hydros with $P_h < L$ have zero-valued AR coefficients ($\psi_\ell = 0$ for $\ell > P_h$) in the dynamics equation, but their lag fixing constraints are still present. This uniform layout enables contiguous memory access and SIMD-friendly cut coefficient extraction — see [Solver Abstraction SS2.2](../architecture/solver-abstraction.md) for the row layout.

**Dual variable**: $\pi^{lag}_{h,\ell}$ (marginal value of inflow history at lag $\ell$ for hydro $h$, used as the cut coefficient for the corresponding inflow lag state variable — see [cut management](cut-management.md))

> **Implementation notes**:
>
> - The RHS value $\hat{a}_{h,\ell}$ is patched per scenario during the forward pass ([Training Loop SS4.2a](../architecture/training-loop.md)) and backward pass, following the same index formula as the column layout: row $N + \ell \cdot N + h$ for hydro $h$, lag $\ell$ ([Solver Abstraction SS2.2](../architecture/solver-abstraction.md)).
> - The dual extraction for cut coefficients reads $\pi^{lag}_{h,\ell}$ from the contiguous top region of the dual vector, where the row-column index symmetry enables a single slice read ([Training Loop SS7.2](../architecture/training-loop.md)).

## 6. Hydro Generation Constraints

Cobre supports two production models during training, in increasing order of complexity. A third model (linearized head) is available during simulation only — see [hydro production models §3](hydro-production-models.md). The model can vary by stage or season per hydro — see [Input Hydro Extensions §2](../data-model/input-hydro-extensions.md).

**Constant Productivity Model** (for each hydro $h \in \mathcal{H}^{const}$, block $k$):

$$
g_{h,k} = \rho_h \cdot q_{h,k}
$$

**FPHA Model** (for each plane $m \in \mathcal{M}_h$, hydro $h \in \mathcal{H}^{fpha}$, block $k$):

$$
g_{h,k} \leq \gamma^m_0 + \gamma^m_v \cdot v^{avg}_h + \gamma^m_q \cdot q_{h,k} + \gamma^m_s \cdot s_{h,k}
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is the average storage during the stage, with $v^{in}_h$ being the incoming storage LP variable (§4a) and $v_h$ the end-of-stage storage.

**Generation Bounds** (per hydro $h$, block $k$):

$$
\underline{G}_h - \sigma^{g-}_{h,k} \leq g_{h,k} \leq \bar{G}_h
$$

Generation bounds are user-defined (not derived from turbined flow). The lower bound is soft (with slack $\sigma^{g-}_{h,k}$); the upper bound is hard. See [system elements §5](system-elements.md).

For details on the FPHA construction and production function model variants, see [hydro production models](hydro-production-models.md).

## 7. Outflow Constraints

**Outflow Definition** (per hydro $h$, block $k$):

$$
o_{h,k} = q_{h,k} + s_{h,k}
$$

> **Clarification**: Outflow $o$ represents water released to the downstream channel (affecting tailrace level). It does NOT include:
>
> - **Withdrawal** $r_{h,k}$: Consumptive use removed from the system (irrigation, water supply)
> - **Diversion** $u_{h,k}$: Water bypassed to a separate channel (not affecting main tailrace)
>
> The water balance (§4) accounts for all flows: inflow $-$ $(q + s + u + r)$ $-$ evaporation = storage change.

**Outflow Bounds** (with slacks for soft enforcement):

$$
\underline{O}_h - \sigma^{o-}_{h,k} \leq o_{h,k} \leq \bar{O}_h + \sigma^{o+}_{h,k}
$$

## 8. Variable Bounds and Minimum Constraints

### Storage Bounds (per hydro $h$)

$$
\underline{V}_h - \sigma^{v-}_h \leq v_h \leq \bar{V}_h
$$

The lower bound (dead volume) is soft — the slack $\sigma^{v-}_h$ has a very high penalty above deficit cost. The upper bound (reservoir capacity) is hard; excess water is handled by emergency spillage. During the filling period, the lower bound is inactive (storage can be anywhere in $[0, \bar{V}_h]$).

**Filling terminal constraint** (at stage `entry_stage_id - 1`, for filling hydros only):

$$
v_h + \sigma^{fill}_h \geq \underline{V}_h
$$

with the highest penalty in the system ($c^{fill}_h$). See [Penalty System §7](../data-model/penalty-system.md).

### Turbined Flow Bounds (per hydro $h$, block $k$)

$$
\underline{Q}_h - \sigma^{q-}_{h,k} \leq q_{h,k} \leq \bar{Q}_h
$$

Lower bound is soft; upper bound is hard.

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
  c^{tv-}_h \sigma^{q-}_{h,k} + c^{ov-}_h \sigma^{o-}_{h,k} + c^{ov+}_h \sigma^{o+}_{h,k} + c^{gv-}_h \sigma^{g-}_{h,k}
  + c^{ev}_h (\sigma^{e+}_{h,k} + \sigma^{e-}_{h,k}) + c^{wv}_h \sigma^{r}_{h,k}
\Big]
$$

Storage violation penalties ($c^{sv-}_h \sigma^{v-}_h$ and $c^{fill}_h \sigma^{fill}_h$) appear outside the $\tau_k$ sum because they apply to end-of-stage storage — see §2.

### Penalty Resolution

The effective penalty for any (entity, stage, penalty_type) tuple follows a three-level cascade:

1. **Stage-specific override** (from Parquet files in `constraints/`)
2. **Entity-specific override** (from entity registry JSON)
3. **Global default** (from `penalties.json`)

For the full resolution semantics and all penalty value definitions, see [Penalty System](../data-model/penalty-system.md).

## 10. Generic Constraints

User-defined linear constraints (per constraint $g \in \mathcal{G}$):

$$
\sum_{e} \gamma_{g,e} \cdot x_e \quad \{\leq, =, \geq\} \quad b_g
$$

where $x_e$ can reference any LP variable using expression syntax:

- `hydro_storage(id)`, `hydro_turbined(id)`, `hydro_spillage(id)`
- `thermal_generation(id)`, `bus_deficit(id)`, etc.

Generic constraints can have optional slack variables with configurable penalties.

## 11. Benders Cuts

For each active cut $i$ from previous iterations:

$$
\theta \geq \alpha_i + \sum_{h \in \mathcal{H}} \pi^v_{i,h} \cdot v_h + \sum_{h,\ell} \pi^{lag}_{i,h,\ell} \cdot a_{h,\ell}
$$

where:

- $\alpha_i$ = cut intercept (RHS)
- $\pi^v_{i,h}$ = coefficient for storage state variable
- $\pi^{lag}_{i,h,\ell}$ = coefficient for AR lag state variable

Cuts are pre-allocated and toggled active/inactive via bound changes for warm-starting efficiency.

For cut coefficient derivation, aggregation, and selection strategies, see [cut management](cut-management.md).

## Cross-References

- [Notation conventions](../overview/notation-conventions.md) — index sets, parameters, decision variable naming
- [System elements](system-elements.md) — physical meaning of each element, decision variables, Variable Units Convention
- [Penalty System](../data-model/penalty-system.md) — three-category taxonomy, penalty names, priority ordering, cascade resolution
- [Input System Entities](../data-model/input-system-entities.md) — entity registries (contracts §6, NCS §7, GNL §4, pumping §5)
- [SDDP algorithm](sddp-algorithm.md) — iterative structure that solves this LP at each stage
- [PAR(p) inflow model](par-inflow-model.md) — complete AR inflow model specification
- [Hydro production models](hydro-production-models.md) — constant, linearized head, and FPHA model details
- [Cut management](cut-management.md) — dual extraction, cut coefficients, aggregation, and selection
- [Internal Structures](../data-model/internal-structures.md) — Pre-resolved in-memory data model that provides entity data and bounds to the LP builder
- [Solver Abstraction](../architecture/solver-abstraction.md) — LP layout convention (SS2) mapping this mathematical formulation to solver column/row indices, with exact index formulas and a worked example
- [Equipment formulations](equipment-formulations.md) — per-equipment constraint derivations, pumping details
