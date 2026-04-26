# Hydro Production Function Models

## Purpose

This spec defines the hydro generation constraint models supported by Cobre, which relate turbined flow and reservoir storage to electrical output. Two models are available during training (policy construction): constant productivity and FPHA. A third model — linearized head — is available only during simulation (policy evaluation) as a higher-fidelity enhancement. The choice among training models trades off accuracy vs. computational cost, and can vary by stage per hydro.

All decision variables use **rate units** (MW, m³/s) — see the Variable Units Convention in [system elements](system-elements.md). For variable definitions see [notation conventions](../overview/notation-conventions.md); for LP integration see [LP formulation](lp-formulation.md); for hydro element descriptions see [system elements](system-elements.md).

## 1. Constant Productivity Model

The simplest model assumes a linear relationship:

$$
g_{h,k} = \rho_h \cdot q_{h,k}
$$

where $\rho_h$ (MW per m³/s) is the hydro productivity:

$$
\rho_h = \frac{9.81 \times \eta_h \times H^{ref}_h}{1000}
$$

with:

- $\eta_h$ = turbine efficiency (typically 0.85–0.92), from the hydro object's `efficiency` field
- $H^{ref}_h$ = reference net head (meters), typically at 65% storage

**LP treatment**: 1 equality constraint per hydro per block. The generation variable $g_{h,k}$ is fully determined by $q_{h,k}$ — no free generation variable is needed. Simple and fast, but ignores head variation with storage.

**Data requirements**: Only `productivity_mw_per_m3s` from `hydros.json`. No geometry or hyperplane data needed.

## 2. FPHA (Four-Point Head Approximation)

For accurate modeling of hydroelectric generation, FPHA (Função de Produção Hidrelétrica Aproximada) captures the nonlinear relationship between storage, flow, spillage, and generation through a piecewise-linear approximation.

### 2.1 Notation Mapping

This section uses consistent notation with the LP formulation. The following table maps Cobre symbols to equivalent CEPEL/Portuguese terminology for practitioners familiar with DECOMP/DESSEM:

| Cobre      | CEPEL/Portuguese               | Description                 | Units |
| ---------- | ------------------------------ | --------------------------- | ----- |
| $\phi$     | FPH                            | Hydro production function   | MW    |
| $v$        | $V$                            | Reservoir storage           | hm³   |
| $q$        | $Q$                            | Turbined flow               | m³/s  |
| $s$        | $S$                            | Spillage                    | m³/s  |
| $g_h$      | GH                             | Hydro generation            | MW    |
| $h_{fore}$ | $h_{mon}$ (montante)           | Forebay (upstream) level    | m     |
| $h_{tail}$ | $h_{jus}$ (jusante)            | Tailrace (downstream) level | m     |
| $h_{net}$  | $h_{liq}$ (líquida)            | Net head                    | m     |
| $h_{loss}$ | $h_{PerdH}$ (perda hidráulica) | Hydraulic losses            | m     |
| $q_{out}$  | $Q_{jus}$                      | Total downstream outflow    | m³/s  |

> **Note on lateral flow**: CEPEL models include $q_{lat}$ (lateral tributary flow affecting tailrace level) in $q_{out}$. Cobre uses $q_{out} = q + s$ in the LP formulation. For FPHA fitting purposes, a reference lateral flow can be assumed when evaluating the exact production function.

### 2.2 Exact Production Function

The **exact hydroelectric production function** relates generation to the operating state:

$$
\phi(v, q, q_{out}) = \rho(q, h_{net}) \times q \times h_{net}
$$

where:

- $v$ = reservoir storage volume (hm³)
- $q$ = turbined flow (m³/s)
- $q_{out}$ = total downstream outflow affecting tailrace level (m³/s)
- $h_{net}$ = net head (m)
- $\rho$ = specific productivity (MW·s/m⁴)

The **net head** is computed as:

$$
h_{net}(v, q, q_{out}) = h_{fore}(v) - h_{tail}(q_{out}) - h_{loss}(q)
$$

where:

- $h_{fore}(v)$ = forebay (upstream reservoir) level as function of storage
- $h_{tail}(q_{out})$ = tailrace (downstream channel) level as function of total outflow
- $h_{loss}(q)$ = hydraulic head losses in penstock and turbines

**Why linearization is needed**: $\phi$ is nonlinear in $(v, q)$ due to the bilinear product $q \times h_{net}$, nonlinear topology functions $h_{fore}(v)$ and $h_{tail}(q_{out})$, and flow-dependent hydraulic losses. For LP formulation, we approximate $\phi$ with a set of linear hyperplanes.

### 2.3 Topology Functions

Cobre uses **tabular data with linear interpolation** for topology functions — more transparent and easier to validate against surveyed data than polynomial fits.

#### Forebay Level $h_{fore}(v)$

The upstream water level is read from the volume-height curve in `hydro_geometry.parquet`:

| volume_hm3 | height_m | area_km2 |
| ---------- | -------- | -------- |
| $v_1$      | $h_1$    | $A_1$    |
| $v_2$      | $h_2$    | $A_2$    |
| ...        | ...      | ...      |

**Interpolation**: For storage $v$ where $v_i \leq v < v_{i+1}$:

$$
h_{fore}(v) = h_i + \frac{h_{i+1} - h_i}{v_{i+1} - v_i} \times (v - v_i)
$$

#### Tailrace Level $h_{tail}(q_{out})$

The downstream water level depends on total outflow. Two representations are supported, matching the `tailrace` tagged union in `hydros.json`:

**Polynomial model** (`type: "polynomial"`):

$$
h_{tail}(q_{out}) = c_0 + c_1 q_{out} + c_2 q_{out}^2 + c_3 q_{out}^3 + c_4 q_{out}^4
$$

**Piecewise-linear model** (`type: "piecewise"`):

| outflow_m3s | tailrace_m   |
| ----------- | ------------ |
| $q_1$       | $h_{tail,1}$ |
| $q_2$       | $h_{tail,2}$ |
| ...         | ...          |

With linear interpolation between points.

**Total downstream flow in LP**: $q_{out} = q + s$ (turbined flow + spillage). For FPHA fitting, a reference spillage $s_{ref}$ (typically 0) is used when evaluating the exact production function across the grid.

#### Hydraulic Losses $h_{loss}(q)$

Two models are supported, matching the `hydraulic_losses` tagged union in `hydros.json`:

**Factor model** (`type: "factor"`) — proportional to gross head:

$$
h_{loss}(q) = k_{loss} \times (h_{fore} - h_{tail})
$$

where $k_{loss}$ is typically 0.01–0.05 (1–5% losses).

**Constant model** (`type: "constant"`) — fixed head loss:

$$
h_{loss}(q) = \Delta h_{const}
$$

where $\Delta h_{const}$ is in meters (typically 1–5m).

### 2.4 Productivity

The **specific productivity** converts hydraulic power to electrical power:

$$
g_h = \frac{9.81 \times \eta \times q \times h_{net}}{1000} \quad \text{[MW]}
$$

where $\eta$ is the turbine-generator efficiency, configured via the `efficiency` field in `hydros.json`. Cobre uses constant efficiency: $\eta = \eta_{ref}$ — from the hydro object's `efficiency.value`.

### 2.5 FPHA Hyperplanes

The FPHA approximation replaces the nonlinear production function $\phi(v, q, s)$ with a set of $M$ linear hyperplanes that form a **concave upper envelope** of the exact surface. Each hyperplane $m$ defines an upper bound on generation:

$$
g_{h,k} \leq \gamma_0^m + \gamma_v^m \cdot v_h^{avg} + \gamma_q^m \cdot q_{h,k} + \gamma_s^m \cdot s_{h,k}
$$

**Physical interpretation of coefficients**:

| Coefficient | Sign | Meaning                                           |
| ----------- | ---- | ------------------------------------------------- |
| $\gamma_0$  | > 0  | Intercept (MW at zero storage, flow, spillage)    |
| $\gamma_v$  | > 0  | Higher storage → higher forebay → more generation |
| $\gamma_q$  | > 0  | More turbined flow → more generation              |
| $\gamma_s$  | ≤ 0  | More spillage → higher tailrace → less net head   |

**Source of hyperplanes**: Planes are either pre-computed (read from `fpha_hyperplanes.parquet`) or computed from topology data during preprocessing. The fitting process evaluates $\phi$ on a discretization grid over the operating region $[v_{min}, v_{max}] \times [0, q_{max}]$, then constructs the concave envelope of the resulting generation surface.

> **Implementation note:** The computed-source fitting grid is three-dimensional: volume, turbined flow, and spillage. The volume axis spans $[v_{min}, v_{max}]$ using `volume_discretization_points` uniformly spaced points (default 5). The turbined-flow axis spans $[q_{min}, q_{max}]$ using `turbine_discretization_points` points (default 5), where $q_{min} = \max(1.0, 0.01 \cdot q_{max})$ to avoid degenerate zero-flow tangent planes. The spillage axis uses `spillage_discretization_points` points (default 5) spanning $[0, 0.5 \cdot q_{max}]$, always including $s = 0$ as the first point. Validity range fields (`valid_v_min_hm3`, `valid_v_max_hm3`, `valid_q_max_m3s`) are stored as `null` in computed planes.

### 2.6 Correction Factor $\kappa$

The correction factor $\kappa$ scales the hyperplane intercepts to ensure the approximation is **conservative** — never overestimates generation:

$$
g_{FPHA}(v, q, s) = \kappa \times \max_m \left\{ \gamma_0^m + \gamma_v^m \cdot v + \gamma_q^m \cdot q + \gamma_s^m \cdot s \right\}
$$

> **Notation note**: We use $\kappa$ (kappa) for the FPHA correction factor to avoid collision with $\alpha$, which is used for Benders cut intercepts (see [cut management](cut-management.md)).

In practice, $\kappa$ is applied by pre-scaling the intercepts: $\tilde{\gamma}_0^m = \kappa \times \gamma_0^m$.

#### Worst-Case Approach (Default)

$$
\kappa = \min_{(v,q) \in \text{grid}} \left\{ \frac{\phi(v, q)}{\max_m (\gamma_0^m + \gamma_v^m v + \gamma_q^m q)} \right\}
$$

This guarantees $g_{FPHA} \leq \phi$ everywhere in the operating region.

#### MSE Minimization Approach

$$
\kappa = \frac{\sum_{i,j} g_{FPHA} \cdot \phi}{\sum_{i,j} g_{FPHA}^2}
$$

Minimizes mean squared error between approximation and exact function. Less conservative but more accurate on average.

> **Implementation note:** The worst-case approach is the active implementation. Kappa is computed as the minimum ratio $\phi / \max_m(\text{plane}_m)$ over all 3D grid points where both $\phi > 0$ and $\max_m > 0$; points with zero production are skipped. Kappa must lie in $(0, 1]$; values outside this range produce a fitting error.

#### Typical Values

| Reservoir Type    | Typical $\kappa$ | Notes                        |
| ----------------- | ---------------- | ---------------------------- |
| High-head storage | 0.97–0.99        | Significant head variation   |
| Medium-head       | 0.98–1.00        | Moderate approximation error |
| Run-of-river      | 0.99–1.00        | Nearly constant head         |

### 2.7 Spillage Effect on Generation

Spillage affects generation indirectly by raising the tailrace level, which reduces net head. The FPHA constraint incorporates this through $\gamma_s$:

$$
\gamma_s^m = -\rho \times q_{ref} \times \frac{\partial h_{tail}}{\partial q_{out}} \bigg|_{q_{out,ref}}
$$

**Physical interpretation**: Each additional m³/s of spillage raises the tailrace by $\partial h_{tail}/\partial q_{out}$ meters, reducing net head and thus generation.

**Sign convention**: $\gamma_s^m \leq 0$ because spillage reduces generation capacity.

> **Implementation note:** After tangent-plane sampling and redundancy elimination, a greedy removal heuristic selects at most `max_planes_per_hydro` planes (default 10). The heuristic evaluates, for each candidate plane, the increase in maximum approximation error that would result from its removal, then permanently removes the plane whose removal causes the smallest increase. Removal stops early if the concave-envelope property (minimum grid error $\geq -10^{-8}$) would be violated; in that case the result may contain more planes than the target cardinality. The validity range fields are set to `null` in all computed planes.

### 2.8 LP Integration

#### Final FPHA Constraint

For each hydro $h$ using FPHA, block $k$, and plane $m \in \mathcal{M}_h$:

$$
g_{h,k} \leq \tilde{\gamma}_0^m + \gamma_v^m \cdot v_h^{avg} + \gamma_q^m \cdot q_{h,k} + \gamma_s^m \cdot s_{h,k}
$$

where $\tilde{\gamma}_0^m = \kappa \times \gamma_0^m$ (pre-scaled intercept).

These are **hard constraints** — no slack variables. Feasibility is ensured through the `fpha_turbined_cost` regularization mechanism (see section 2.9).

#### Average Storage Computation

The average storage $v^{avg}_h$ over the stage:

$$
v^{avg}_h = \frac{v^{in}_h + v_h}{2}
$$

where $v^{in}_h$ is the incoming storage LP variable (fixed to $\hat{v}_h$ via the storage fixing constraint — see [LP Formulation](lp-formulation.md)) and $v_h$ is end-of-stage storage. Both are LP variables, so $v^{in}_h$ appears in the FPHA constraint with coefficient $\gamma_v^m / 2$. The LP solver automatically accounts for this when computing the dual of the storage fixing constraint.

#### Generation as Independent Variable

When using FPHA, the generation variable $g_{h,k}$ is **not** directly computed from turbined flow. Instead:

1. Generation is a free LP variable bounded by $[0, \bar{G}_h]$ (user-defined bounds from `hydros.json`)
2. FPHA constraints (one per plane $m$) provide upper bounds relating generation to storage, flow, and spillage
3. The optimizer maximizes generation subject to FPHA constraints
4. At optimum, generation lies on one of the FPHA hyperplane facets

**Key insight**: Because minimizing cost includes maximizing hydro generation (which has zero fuel cost), the optimizer naturally pushes generation to the FPHA surface boundary. The `fpha_turbined_cost` regularization (section 2.9) ensures the solution lies on the boundary rather than at an interior point.

### 2.9 FPHA Turbined Cost

For hydros using the FPHA production model, a regularization cost $c^{fpha}_h$ is applied to the turbined flow variable in the objective:

$$
\sum_{k} \tau_k \cdot c^{fpha}_h \cdot q_{h,k}
$$

This cost must satisfy $c^{fpha}_h > c^{spill}_h$ for each plant, ensuring that the optimizer prefers to reduce turbined flow rather than increase spillage when operating near the FPHA boundary. Without this regularization, the optimizer could find degenerate solutions where turbined flow and spillage are both artificially high (with net generation unchanged), because the FPHA surface has a flat region where increasing $q$ and $s$ simultaneously can maintain the same $g$.

This penalty applies **only** to hydros using the FPHA model. Plants with `constant_productivity` do not incur this cost. Plants using `linearized_head` (simulation-only, see section 3) are also excluded — the linearized head model uses an equality constraint, not a concave envelope.

For the full penalty taxonomy and priority ordering, see [Penalty System](./penalty-system.md).

### 2.10 Impact on Benders Cuts

The FPHA formulation affects water value computation. Because the incoming storage variable $v^{in}_h$ appears in the FPHA constraint (via $v^{avg}_h = (v^{in}_h + v_h)/2$, section 2.8), the FPHA hyperplane duals contribute to the marginal value of incoming storage. However, the implementation does **not** require manually combining duals from the water balance and FPHA constraints. Instead, the storage fixing constraint ($v^{in}_h = \hat{v}_h$, see [LP Formulation](lp-formulation.md)) captures the total sensitivity $\partial Q_t / \partial \hat{v}_h$ automatically — the LP solver propagates the FPHA contribution through $v^{in}_h$.

The cut coefficient for storage is simply the dual of the storage fixing constraint:

$$
\pi^v_h = \pi^{fix}_h
$$

This dual implicitly includes the water balance contribution ($\pi^{wb}_h$), the FPHA contribution ($\frac{1}{2} \sum_m \pi_m^{fpha} \cdot \gamma_v^m$), and any generic constraint contributions — all resolved by the LP solver without explicit dual combination.

For the complete cut coefficient computation, see [cut management](cut-management.md).

#### Model Transition Considerations

When a hydro transitions between production models across stages:

| Transition                     | Cut Interpretation                      | Action                            |
| ------------------------------ | --------------------------------------- | --------------------------------- |
| Constant → FPHA                | Cuts at stage $t$ use constant model    | Cut valid but conservative        |
| FPHA → Constant                | Stage $t+1$ backward pass uses constant | May overestimate value            |
| FPHA → FPHA (different params) | Parameters change                       | Cuts remain valid if conservative |

**Recommendation**: When using stage-dependent FPHA configuration, ensure the FPHA at stage $t$ is at least as conservative as stage $t+1$ for cut validity.

## 3. Linearized Head Model (Simulation-Only Enhancement)

> **Phase restriction**: This model is available **only during simulation** (policy evaluation). It must NOT be used during training (policy construction). During training, only `constant_productivity` and `fpha` are valid production models. See the rationale below.

An intermediate model between constant productivity and full FPHA that captures first-order head variation with storage:

$$
g_{h,k} = \rho_{ref} \cdot q_{h,k} \cdot \left( k_0 + k_V \cdot v_h^{avg} \right)
$$

where:

- $k_0, k_V$ are linearization coefficients derived from $h_{fore}(v)$
- $k_0 = 1 - k_V \cdot V_{ref}$ (normalization at reference volume)
- $k_V = \frac{1}{H_{ref}} \cdot \frac{dh_{fore}}{dV}\bigg|_{V_{ref}}$

### 3.1 Why Simulation-Only

The product $q_{h,k} \cdot v_h^{avg}$ is a **bilinear term** — both $q$ and $v^{avg}$ are LP variables. To maintain LP linearity, the standard approach fixes $v^{avg}$ from the previous SDDP iteration (or from a reference volume on the first iteration), converting the constraint to a linear equality. However, this means the **LP constraint coefficients change between iterations**: the effective productivity $\rho_{ref} \cdot (k_0 + k_V \cdot v^{avg}_{fixed})$ is different after each forward pass updates the storage trajectory.

This violates a foundational assumption of SDDP: **each stage must have a fixed LP structure** across all iterations. Benders cuts generated under one linearization point encode dual information about a specific LP. When the LP changes (because $v^{avg}_{fixed}$ changed), previously generated cuts are not guaranteed to be valid — they may cut off the true optimal solution or produce inconsistent value function approximations. This breaks the convergence guarantees of the algorithm.

**During simulation**, linearized head is safe because simulation executes a single forward pass through the policy — there are no cuts being accumulated, no convergence to verify. The model provides a higher-fidelity generation estimate than constant productivity without the preprocessing cost of fitting FPHA hyperplanes.

### 3.2 Simulation Use Case

The linearized head model fills a practical gap in the simulation step:

- **More accurate than constant productivity**: Captures how reservoir level affects generation — important for plants with significant head variation that are modeled with `constant_productivity` during training for computational reasons
- **Cheaper than FPHA**: Requires only the Volume-Height-Area curve (`hydro_geometry.parquet`), no hyperplane fitting
- **Single constraint**: One equality constraint per hydro per block, compared to $M$ inequality constraints for FPHA

Typical use: plants where full FPHA accuracy is justified for near-term training stages but far-future stages use `constant_productivity` during training, then `linearized_head` during simulation for improved analytics.

### 3.3 Data Requirements

`productivity_mw_per_m3s` from `hydros.json` plus `hydro_geometry.parquet` for the Volume-Height-Area curve.

## 4. Model Selection Guidelines

### Training (Policy Construction)

Only `constant_productivity` and `fpha` are valid during training. The linearized head model is excluded because it changes the LP between iterations (see section 3.1).

| Scenario                       | Recommended Model     | Rationale                          |
| ------------------------------ | --------------------- | ---------------------------------- |
| High-head storage reservoirs   | FPHA                  | Significant head variation (>20%)  |
| Large storage variation plants | FPHA                  | Operating across wide volume range |
| Run-of-river plants            | Constant productivity | Nearly constant head               |
| Initial algorithm testing      | Constant productivity | Fast iteration, debug focus        |
| Near-term stages               | FPHA                  | Accuracy for operational decisions |
| Far-future stages              | Constant productivity | Computational efficiency           |

### Simulation (Policy Evaluation)

All three models are available during simulation. The linearized head model is particularly useful as a simulation-only upgrade for plants that used `constant_productivity` during training:

| Scenario                                                 | Recommended Model     | Rationale                                  |
| -------------------------------------------------------- | --------------------- | ------------------------------------------ |
| Plants trained with FPHA                                 | FPHA                  | Consistency with training model            |
| Plants trained with constant, low head variation         | Constant productivity | No benefit from head correction            |
| Plants trained with constant, significant head variation | Linearized head       | Better analytics without FPHA fitting cost |
| Post-optimization validation                             | Compare all models    | Verify approximation quality               |

The production model may vary by stage or by season per hydro, configured via the `stage_ranges` and `seasonal` selection modes in `hydro_production_models.json`.

## 5. Data Requirements Summary

| Data Source                    | Required Fields                              | Used For                        |
| ------------------------------ | -------------------------------------------- | ------------------------------- |
| `hydros.json`                  | `generation.productivity_mw_per_m3s`         | Reference $\rho_{ref}$          |
| `hydros.json`                  | `tailrace` (polynomial or piecewise)         | $h_{tail}(q_{out})$ computation |
| `hydros.json`                  | `hydraulic_losses` (factor or constant)      | $h_{loss}(q)$ computation       |
| `hydros.json`                  | `efficiency` (constant)                      | Turbine efficiency $\eta$       |
| `hydro_geometry.parquet`       | volume_hm3, height_m                         | $h_{fore}(v)$ interpolation     |
| `fpha_hyperplanes.parquet`     | gamma_0, gamma_v, gamma_q, gamma_s, kappa    | Pre-fitted planes (optional)    |
| `hydro_production_models.json` | selection_mode, fpha_config per stage/season | Fitting configuration           |

## Cross-References

- [Notation conventions](../overview/notation-conventions.md) — variable and set definitions ($g_h$, $q_h$, $v_h$, $s_h$, $\rho_h$)
- [System elements](system-elements.md) — hydro plant element description, decision variables, Variable Units Convention
- [LP formulation](lp-formulation.md) — how production constraints integrate into the assembled LP
- [Penalty system](./penalty-system.md) — `fpha_turbined_cost` regularization, penalty priority ordering
- [Cut management](cut-management.md) — Benders cut generation affected by FPHA dual variables
- [Equipment formulations](equipment-formulations.md) — thermal and hydro equipment constraint patterns
