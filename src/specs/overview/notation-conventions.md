# Notation Conventions

## Purpose

This spec defines the complete mathematical notation used across all Cobre specification documents: index sets, parameters, decision variables, and dual variables. It serves as the canonical reference for symbol meanings, ensuring consistency across all math and data model specs.

## 1. General Notation Conventions

This document follows [SDDP.jl](https://sddp.dev/stable/) notation conventions for consistency with the broader SDDP literature:

| Convention               | Meaning                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| $t \in \{1, \ldots, T\}$ | Stage index                                                                                                |
| $\omega \in \Omega_t$    | Scenario realization at stage $t$                                                                          |
| $x_t$                    | State variables at end of stage $t$                                                                        |
| $\hat{x}_{t-1}$          | Incoming state (from previous stage)                                                                       |
| $V_t(x)$                 | Value function (cost-to-go) at stage $t$                                                                   |
| $\theta_t$               | Epigraph variable approximating $V_{t}$                                                                    |
| $\pi$                    | Dual variables (row Lagrange multipliers); state cut coefficients are reduced costs of pinned columns (§5) |
| $(\alpha, \pi)$          | Cut intercept and coefficients                                                                             |
| $k$                      | Iteration counter                                                                                          |

## 2. Index Sets

| Symbol                                      | Description                                                | Typical Size                                               | Notes                                                        |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| $t \in \{1, \ldots, T\}$                    | Stages                                                     | 60-120                                                     | 5-10 year monthly horizon                                    |
| $k \in \mathcal{K}$                         | Blocks within stage                                        | 1-24                                                       | 3 typical (LEVE/MÉDIA/PESADA)                                |
| $\mathcal{B}$                               | Buses                                                      | 4-10                                                       | 4-5 for SIN subsystems                                       |
| $\mathcal{H}$                               | Hydro plants                                               | 160                                                        | All plants in system                                         |
| $\mathcal{H}^{op} \subseteq \mathcal{H}$    | Operating hydros (can generate)                            | $\approx \mathcal{H}$                                      | Most/all plants typically operating                          |
| $\mathcal{H}^{fill} \subseteq \mathcal{H}$  | Filling hydros (no generation)                             | 0                                                          | Usually 0; rare for new plants under commissioning           |
| $\mathcal{H}^{fpha} \subseteq \mathcal{H}$  | Hydros using FPHA production model                         | 50                                                         | Subset with fitted hyperplanes                               |
| $\mathcal{H}^{const} \subseteq \mathcal{H}$ | Hydros using constant productivity                         | $\lvert\mathcal{H}\rvert - \lvert\mathcal{H}^{fpha}\rvert$ | Complement of $\mathcal{H}^{fpha}$ within $\mathcal{H}^{op}$ |
| $\mathcal{T}$                               | Thermal plants                                             | 130                                                        |                                                              |
| $\mathcal{R}$                               | Non-controllable generation sources                        | 0                                                          | Renewable curtailment entities                               |
| $\mathcal{L}$                               | Transmission lines                                         | 10                                                         | Regional interconnections                                    |
| $\mathcal{C}$                               | All contracts ($\mathcal{C}^{imp} \cup \mathcal{C}^{exp}$) | 10                                                         | Unified contract set                                         |
| $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$    | Import/export contracts                                    | 5                                                          |                                                              |
| $\mathcal{P}$                               | Pumping stations                                           | 5                                                          |                                                              |
| $\mathcal{G}$                               | Generic constraints                                        | 50                                                         | User-defined                                                 |
| $\mathcal{S}_b$                             | Deficit segments for bus $b$                               | 1                                                          | Multiple segments optional                                   |
| $\mathcal{M}_h$                             | FPHA planes for hydro $h$                                  | 125                                                        | Typical value; depends on grid resolution                    |
| $\mathcal{U}_h$                             | Upstream hydros of $h$                                     | 1-2                                                        | Immediate upstream in cascade                                |
| $\Omega_t$                                  | Scenario realizations at stage $t$                         | 20                                                         | Standard branching factor                                    |

## 3. Parameters

### 3.1 Time and Conversion

| Symbol                         | Units      | Description                            |
| ------------------------------ | ---------- | -------------------------------------- |
| $\tau_k$                       | hours      | Duration of block $k$                  |
| $w_k = \tau_k / \sum_j \tau_j$ | -          | Block weight (fraction of stage)       |
| $\zeta$                        | hm³/(m³/s) | Time conversion: m³/s over stage → hm³ |

#### Time Conversion Factor Derivation

The factor $\zeta$ converts a flow rate in m³/s to a volume in hm³ accumulated over the stage duration.

**Fundamental Relationship**:
$$\text{Volume} = \text{Flow Rate} \times \text{Time}$$

**Unit Conversion Chain**:

1. Flow rate: $Q$ [m³/s]
2. Time period: $\tau$ [hours]
3. Target volume: $V$ [hm³] = $10^6$ m³

$$V \text{ [hm³]} = Q \text{ [m³/s]} \times \tau \text{ [hours]} \times \frac{3600 \text{ s}}{1 \text{ hour}} \times \frac{1 \text{ hm³}}{10^6 \text{ m³}}$$

$$V = Q \times \tau \times \frac{3600}{10^6} = Q \times \tau \times 0.0036$$

**For a stage with multiple blocks**:
If the stage has blocks $k \in \mathcal{K}$ with durations $\tau_k$ hours, and the flow is assumed constant across the stage (parallel blocks), the total time is $\sum_k \tau_k$ hours:

$$\zeta = 0.0036 \times \sum_{k \in \mathcal{K}} \tau_k \quad \text{[hm³/(m³/s)]}$$

**Dimensional Analysis**:
$$[\zeta] = \frac{\text{s}}{\text{h}} \times \frac{\text{m³}}{\text{hm³}} \times \text{h} = \frac{\text{hm³}}{\text{m³/s}}$$

**Worked Example** (Monthly Stage):

| Block     | Name   | Duration $\tau_k$ (h) |
| --------- | ------ | --------------------- |
| 1         | LEVE   | 200                   |
| 2         | MÉDIA  | 300                   |
| 3         | PESADA | 228                   |
| **Total** |        | **728**               |

$$\zeta = 0.0036 \times 728 = 2.6208 \text{ hm³/(m³/s)}$$

**Verification**: A constant inflow of $Q = 100$ m³/s over the month yields:
$$V = Q \times \zeta = 100 \times 2.6208 = 262.08 \text{ hm³}$$

Direct calculation: $100 \text{ m³/s} \times 728 \text{ h} \times 3600 \text{ s/h} / 10^6 = 262.08 \text{ hm³}$ ✓

### 3.2 Load and Costs

| Symbol                   | Units       | Description                            |
| ------------------------ | ----------- | -------------------------------------- |
| $D_{b,k}$                | MW          | Load at bus $b$, block $k$             |
| $c^{def}_{b,s}$          | \$/MWh      | Deficit cost at bus $b$, segment $s$   |
| $\bar{d}_{b,s}$          | MW          | Deficit segment depth                  |
| $c^{exc}_b$              | \$/MWh      | Excess generation cost                 |
| $c^{th}_{j,s}$           | \$/MWh      | Thermal cost at plant $j$, segment $s$ |
| $c^{spill}_h$            | \$/(m³/s·h) | Spillage cost                          |
| $c^{div}_h$              | \$/(m³/s·h) | Diversion cost                         |
| $c^{exch}_l$             | \$/MWh      | Exchange (transmission) cost           |
| $c^{imp}_c$, $c^{exp}_c$ | \$/MWh      | Contract import cost / export revenue  |

### 3.3 Hydro Parameters

| Symbol                                           | Units     | Description                                                                                                                                                                                 |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| $\hat{v}_h$                                      | hm³       | Incoming storage (state from previous stage)                                                                                                                                                |
| $\bar{V}_h$, $\underline{V}_h$                   | hm³       | Storage bounds                                                                                                                                                                              |
| $\bar{Q}_h$, $\underline{Q}_h$                   | m³/s      | Turbined flow bounds                                                                                                                                                                        |
| $\bar{G}_h$, $\underline{G}_h$                   | MW        | Generation bounds                                                                                                                                                                           |
| $\bar{O}_h$, $\underline{O}_h$                   | m³/s      | Outflow bounds                                                                                                                                                                              |
| $\rho_h$                                         | MW/(m³/s) | Productivity (constant model)                                                                                                                                                               |
| $\gamma^m_0, \gamma^m_v, \gamma^m_q, \gamma^m_s$ | -         | FPHA plane coefficients (already $\alpha_{FPHA}$-scaled)                                                                                                                                    |
| $\alpha_{FPHA}$                                  | -         | FPHA least-squares fit-correction factor; scales the fitted plane set, distinct from the Benders cut intercept $\alpha$. See [Hydro Production Models](../math/hydro-production-models.md). |

### 3.4 Transmission and Contract Parameters

| Symbol                           | Units | Description                    |
| -------------------------------- | ----- | ------------------------------ |
| $\bar{F}^+_l$, $\bar{F}^-_l$     | MW    | Line capacity (direct/reverse) |
| $\eta_l = 1 - \text{losses}/100$ | -     | Line efficiency                |
| $\bar{C}_c$, $\underline{C}_c$   | MW    | Contract capacity bounds       |

### 3.5 Inflow Model Parameters

> **Note on Periodicity**: The PAR(p) model uses periodic parameters that repeat with a cycle length $M$. Common configurations:
>
> - **Monthly stages**: $M=12$ (seasons = months)
> - **Weekly stages**: $M=52$ (seasons = weeks)
> - **Custom resolution**: $M$ = number of distinct periods in the cycle
>
> We use **"season $m$"** as a generic term for the position within the cycle, avoiding the term "month" which is resolution-specific. The mapping $m(t) = ((t-1) \mod M) + 1$ converts stage index $t$ to season index $m \in \{1, \ldots, M\}$.

| Symbol             | Units | Description                                |
| ------------------ | ----- | ------------------------------------------ |
| $\mu_m$            | m³/s  | Seasonal mean inflow for season $m$        |
| $\psi_{m,\ell}$    | -     | AR coefficient for season $m$, lag $\ell$  |
| $\sigma_m$         | m³/s  | Residual standard deviation for season $m$ |
| $\hat{a}_{h,\ell}$ | m³/s  | Incoming AR lag $\ell$ (state)             |

## 4. Decision Variables

> **Notation Convention**:
>
> - **Generation variables** use $g$ with entity subscript: $g_h$ (hydro at plant $h$), $g_j$ (thermal at plant $j$)
> - **Flow variables** use intuitive single letters: $q$ (turbined), $s$ (spillage), $u$ (diversion/bypass)
> - **Total outflow** is explicitly defined: $o_h = q_h + s_h$ (downstream channel flow)
> - **Contract variables** use $\chi$ (chi) with direction superscript: $\chi^{in}$, $\chi^{out}$
> - **Slack variables** use $\sigma$ with constraint-type superscript
>
> **Symbol Selection Rationale**:
>
> - $q$ (turbined): from "vazão turbinada" (Portuguese) or "discharge through turbines"
> - $s$ (spillage): standard hydrology notation
> - $u$ (diversion): "bypass" or "desvio" — avoids confusion with demand $D$ or deficit $\delta$
> - $o$ (outflow): total downstream flow affecting tailrace level
> - $r$ (withdrawal): "retirada" — consumptive removal from the system; the target is **signed** (negative values represent an inter-basin return/addition)
> - $\chi$ (contract): Greek chi, visually distinct from cost symbol $c$

### 4.1 Per-Block Variables

Per-block variables are indexed by $k \in \mathcal{K}$:

| Variable           | Domain                         | Units | Description                                                                                                                                |
| ------------------ | ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| $\delta_{b,k,s}$   | $[0, \bar{d}_{b,s}]$           | MW    | Deficit at bus $b$, segment $s$                                                                                                            |
| $\epsilon_{b,k}$   | $\geq 0$                       | MW    | Excess generation at bus $b$                                                                                                               |
| $f^+_{l,k}$        | $[0, \bar{F}^+_l]$             | MW    | Direct flow on line $l$                                                                                                                    |
| $f^-_{l,k}$        | $[0, \bar{F}^-_l]$             | MW    | Reverse flow on line $l$                                                                                                                   |
| $g_{j,k,s}$        | $[0, \bar{g}_{j,s}]$           | MW    | Thermal generation at plant $j$, segment $s$                                                                                               |
| $q_{h,k}$          | $[\underline{Q}_h, \bar{Q}_h]$ | m³/s  | Turbined flow at hydro $h$                                                                                                                 |
| $s_{h,k}$          | $\geq 0$                       | m³/s  | Spillage at hydro $h$                                                                                                                      |
| $g_{h,k}$          | $[\underline{G}_h, \bar{G}_h]$ | MW    | Hydro generation at plant $h$                                                                                                              |
| $u_{h,k}$          | $[0, \bar{U}_h]$               | m³/s  | Diversion/bypass flow (to separate channel)                                                                                                |
| $o_{h,k}$          | -                              | m³/s  | Total downstream outflow: $o_{h,k} = q_{h,k} + s_{h,k}$                                                                                    |
| $e_{h,k}$          | free                           | m³/s  | Evaporation (can be negative for condensation)                                                                                             |
| $r_{h,k}$          | signed                         | m³/s  | Water withdrawal; pinned to a signed target (negative = inter-basin return/addition); the realized value cannot cross zero past the target |
| $p_{j,k}$          | $[0, \bar{P}_j]$               | m³/s  | Pumped flow at station $j$                                                                                                                 |
| $\chi^{in}_{c,k}$  | $[0, \bar{C}_c]$               | MW    | Contract import                                                                                                                            |
| $\chi^{out}_{c,k}$ | $[0, \bar{C}_c]$               | MW    | Contract export                                                                                                                            |

### 4.2 Stage-Level State Variables

| Variable                 | Domain                         | Units | Description                                                                                                            |
| ------------------------ | ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| $v_h$                    | $[\underline{V}_h, \bar{V}_h]$ | hm³   | End-of-stage storage                                                                                                   |
| $v^{avg}_h$              | -                              | hm³   | Average storage during stage: $(\hat{v}_h + v_h)/2$                                                                    |
| $a_{h,\ell}$             | fixed                          | m³/s  | AR lag $\ell$ (fixed by state transition)                                                                              |
| $x^{\mathrm{a}}_{s,i,t}$ | fixed                          | MW    | Slot $s$ of plant $i$'s anticipated-thermal ring buffer at stage $t$ (fixed by state transition); slot 0 matures here. |
| $d^i_t$                  | $[\underline{G}_i, \bar{G}_i]$ | MW    | Anticipated-thermal commitment placed at stage $t$ for delivery at stage $t + K_i$                                     |
| $\theta$                 | $\geq 0$                       | \$    | Future cost (cost-to-go approximation)                                                                                 |

### 4.3 Slack Variables

Slack variables for soft constraints:

| Variable                                 | Domain   | Units | Constraint                         |
| ---------------------------------------- | -------- | ----- | ---------------------------------- |
| $\sigma^{v-}_h$                          | $\geq 0$ | hm³   | Storage below minimum              |
| $\sigma^{fill}_h$                        | $\geq 0$ | hm³   | Filling target shortfall           |
| $\sigma^{q-}_{h,k}$                      | $\geq 0$ | m³/s  | Turbined flow below minimum        |
| $\sigma^{o-}_{h,k}$                      | $\geq 0$ | m³/s  | Outflow below minimum              |
| $\sigma^{o+}_{h,k}$                      | $\geq 0$ | m³/s  | Outflow above maximum              |
| $\sigma^{g-}_{h,k}$                      | $\geq 0$ | MW    | Generation below minimum           |
| $\sigma^{e+}_{h,k}$, $\sigma^{e-}_{h,k}$ | $\geq 0$ | m³/s  | Evaporation violation              |
| $\sigma^{r}_{h,k}$                       | $\geq 0$ | m³/s  | Water withdrawal violation         |
| $\sigma^{inf}_h$                         | $\geq 0$ | m³/s  | Inflow non-negativity (if enabled) |

## 5. Dual Variables and Reduced Costs

Cut coefficients in SDDP are state sensitivities. This section describes how the incoming state is carried in the LP for efficient solver updates, and how the resulting sensitivities — row duals for true constraints, **reduced costs** for the pinned state columns — map to cut coefficients.

### 5.1 LP Formulation Strategy for Efficient Hot-Path Updates

In the SDDP algorithm, each subproblem solve requires setting the **incoming state** values (storage volumes and AR lags from the previous stage). For computational efficiency with solvers like HiGHS, Cobre gives each incoming-state coordinate its own LP column and **pins it by setting equal lower and upper column bounds**:

> **Design Principle**: Each incoming state coordinate is carried on a dedicated incoming-state column and pinned by equal column bounds; constraints that use incoming state reference that column rather than a constant RHS.

This design allows the hot path to update incoming state values by patching column bounds (and, for the realized-inflow noise, a single row RHS) without rebuilding the constraint matrix — only scalar values change between solves, not LP structure. The cut coefficient for each state coordinate is then the **reduced cost** of its pinned column (§5.4).

### 5.2 Water Balance: LP Form

The water balance is mathematically:

$$
v_h = \hat{v}_h + \zeta \Big[ a_h + \sum_{k \in \mathcal{K}} w_k \cdot \text{net\_flows}_{h,k} \Big]
$$

For LP implementation, the incoming storage is carried as a dedicated LP variable $v^{in}_h$ (the `storage_in` column) rather than a constant, and **all LP variables are collected on the LHS** with a zero RHS:

$$
\boxed{
v_h - v^{in}_h - \zeta \cdot a_h - \zeta \sum_{k} w_k \Big[
  \sum_{i \in \mathcal{U}_h} (q_{i,k} + s_{i,k} + u_{i,k})
  + \sum_{i:\text{div}=h} u_{i,k}
  + \sum_{j:\text{dest}=h} p_{j,k}
  - q_{h,k} - s_{h,k} - u_{h,k} - e_{h,k} - r_{h,k}
  - \sum_{j:\text{src}=h} p_{j,k}
\Big] = 0
}
$$

**LP Structure**:

- **LHS**: Linear combination of LP variables (storage $v_h$, incoming storage $v^{in}_h$, flows $q$, $s$, $u$, etc.)
- **RHS**: $0$ — the incoming state is _not_ a constraint RHS; it is pinned separately on the $v^{in}_h$ column (§5.1)
- **Constraint type**: Equality ($=$)

### 5.3 AR Lag Pinning: LP Form

For autoregressive inflow state variables, the lag column is pinned to the incoming value by equal column bounds:

$$
\boxed{\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}} \quad \forall h \in \mathcal{H}, \; \ell \in \{1, \ldots, P_h\}
$$

**LP Structure**:

- **Column**: $a_{h,\ell}$ (the `inflow_lags` column), bounds set equal to the incoming lag value
- **Pin value**: Incoming lag $\hat{a}_{h,\ell}$ (set via column bounds in the hot path)
- **No constraint row**: pinning is a bound, not an equality row

### 5.4 Cut Coefficient Derivation from Duals

The SDDP cut at stage $t-1$ has the form:

$$
\theta_{t-1} \geq \alpha + \sum_{h} \pi^v_h \cdot v_h + \sum_{h,\ell} \pi^{lag}_{h,\ell} \cdot a_{h,\ell}
$$

where $\alpha$ is the intercept and $\pi$ are the coefficients with respect to state variables.

**Key principle**: For an incoming-state column pinned at $\underline{x} = \bar{x} = \hat{x}$, the column's **reduced cost** $\bar{c}$ represents:

$$
\bar{c} = \frac{\partial Q^*}{\partial \hat{x}}
$$

where $Q^*$ is the optimal objective value — the **marginal cost of increasing the pinned bound**. By KKT parity this equals the multiplier the equivalent equality row $x^{in} = \hat{x}$ would have carried.

#### Storage Reduced Cost ($\bar{c}^{in}_h$)

The incoming storage column $v^{in}_h$ is pinned at $\underline{v}^{in}_h = \bar{v}^{in}_h = \hat{v}_h$ (see [LP Formulation §4a](../math/lp-formulation.md)). Its reduced cost $\bar{c}^{in}_h$ measures: _"How does optimal cost change if incoming storage $\hat{v}_h$ increases by 1 hm³?"_

**Economic interpretation**:

- More incoming storage means more water available for generation
- Water has value (can displace thermal generation or avoid deficit)
- Therefore, increasing $\hat{v}_h$ **decreases** cost: $\frac{\partial Q^*}{\partial \hat{v}_h} < 0$
- By LP convention (minimization), this gives $\bar{c}^{in}_h < 0$, hence $\pi^v_h < 0$

**Cut coefficient**:

$$
\boxed{\pi^v_h = \bar{c}^{in}_h / d^{col}_h}
$$

The reduced cost is divided by the column's prescaler factor $d^{col}_h$ to recover the original-unit sensitivity (§12 of [LP Formulation](../math/lp-formulation.md)); no sign change is needed. By the LP envelope theorem, the reduced cost automatically captures all downstream effects — water balance, FPHA hyperplanes, and generic constraints — without manual combination of duals from multiple constraint types. See [Cut Management §2](../math/cut-management.md).

#### AR Lag Reduced Cost ($\bar{c}^{lag}_{h,\ell}$)

The lag column $a_{h,\ell}$ is pinned at $\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}$. Its reduced cost measures: _"How does optimal cost change if incoming lag $\hat{a}_{h,\ell}$ increases by 1 m³/s?"\_

**Economic interpretation**:

- Higher historical inflow (in the PAR model) correlates with higher expected current inflow
- Higher inflows reduce cost (more hydro generation possible)
- Therefore, $\bar{c}^{lag}_{h,\ell} < 0$ (increasing the lag decreases cost)

**Cut coefficient**:

The cut coefficient for lag $\ell$ is the reduced cost of the pinned lag column, divided by its prescaler factor: $\pi^{lag}_{h,\ell} = \bar{c}^{lag}_{h,\ell} / d^{col}_{h,\ell}$. No sign change is needed.

### 5.5 Summary Table

| Symbol                   | Source                                     | Pinned value / RHS | Cut Coefficient                                                        |
| ------------------------ | ------------------------------------------ | ------------------ | ---------------------------------------------------------------------- |
| $\bar{c}^{in}_h$         | Reduced cost of pinned $v^{in}_h$ column   | $\hat{v}_h$        | $\pi^v_h = \bar{c}^{in}_h / d^{col}$ (captures all downstream effects) |
| $\bar{c}^{lag}_{h,\ell}$ | Reduced cost of pinned $a_{h,\ell}$ column | $\hat{a}_{h,\ell}$ | $\pi^{lag}_{h,\ell} = \bar{c}^{lag}_{h,\ell} / d^{col}$                |
| $\pi^{lb}_{b,k}$         | Load balance (row dual)                    | $D_{b,k}$          | Marginal cost of energy                                                |
| $\pi^{wb}_h$             | Water balance (row dual)                   | -                  | Not used directly for cut coefficients                                 |
| $\pi_m^{fpha}$           | FPHA hyperplane $m$ (row dual)             | -                  | Captured via $\bar{c}^{in}_h$ automatically                            |
| $\pi^{gen}_c$            | Generic constraint $c$ (row dual)          | -                  | Captured via $\bar{c}^{in}_h$ automatically                            |
| $\lambda_i$              | Benders cut $i$ (row dual)                 | $\alpha_i$         | Cut activity indicator                                                 |

### 5.6 Implementation Notes

The key property: since incoming state coordinates are pinned at equal column bounds, each column's reduced cost _is_ the bound sensitivity directly, so no sign change is needed when mapping to cut coefficients — only the per-column prescaler unscaling ($\pi^v_h = \bar{c}^{in}_h / d^{col}_h$; likewise for AR lags). Cut coefficient extraction reads the reduced costs of the contiguous incoming-state column regions (`storage_in`, `inflow_lags`, and, when present, `anticipated_state`).

**Verification check**: In a typical hydrothermal system:

- $\bar{c}^{in}_h < 0$ (water has value, more storage reduces cost)
- $\pi^v_h < 0$ (cut value increases as storage decreases — future is more expensive with less water)
- The cut $\theta \geq \alpha + \pi^v \cdot v$ correctly penalizes low storage

## Cross-References

- [LP Formulation](../math/lp-formulation.md) — Complete LP subproblem using this notation
- [SDDP Algorithm](../math/sddp-algorithm.md) — Algorithm overview and cut generation process
- [Cut Management](../math/cut-management.md) — Cut coefficient computation and aggregation details
- [PAR Inflow Model](../math/par-inflow-model.md) — Detailed PAR(p) model using inflow parameters defined here
- [Hydro Production Models](../math/hydro-production-models.md) — FPHA plane coefficients ($\gamma$) and productivity ($\rho$)
- [Equipment Formulations](../math/equipment-formulations.md) — Thermal, contract, pumping variable notation
- [What Cobre Solves](./what-cobre-solves.md) — methodology principles (reproducibility, determinism, declaration order invariance, code as ground truth, agent-readability) that frame this book
