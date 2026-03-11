# Stage Subproblem LP Formulation

## Overview

At each stage of the SDDP algorithm, the dispatcher solves a linear program (LP) that models the power system for that time period. This LP is the fundamental computational unit of the solver: the forward pass executes it once per stage to simulate the policy, and the backward pass executes it once per stage per scenario to generate Benders cuts.

Understanding the LP structure is important because it directly shapes the quality of the cuts and the economic signals propagated across stages. A well-structured LP ensures that cuts carry meaningful marginal water values and that every scenario is feasible.

## Cost and Penalty Taxonomy

The objective function combines four types of costs. The distinction matters because each type serves a different algorithmic role.

### Resource Costs

Resource costs represent actual operating expenditures with economic meaning:

| Cost               | Symbol         | Units  | Role                                       |
| ------------------ | -------------- | ------ | ------------------------------------------ |
| Thermal generation | $c^{th}_{j,s}$ | \$/MWh | Fuel cost, typically 50–500                |
| Contract dispatch  | $c^{ctr}_c$    | \$/MWh | Positive for imports, negative for exports |

### Category 1: Recourse Slacks

These penalty terms guarantee that every LP is feasible regardless of the inflow scenario. Without them, the backward pass could encounter infeasible subproblems, making cut generation impossible.

| Penalty           | Symbol          | Units  | Purpose                                    |
| ----------------- | --------------- | ------ | ------------------------------------------ |
| Load deficit      | $c^{def}_{b,s}$ | \$/MWh | Unserved energy (piecewise, 1,000–10,000)  |
| Excess generation | $c^{exc}_b$     | \$/MWh | Absorbs uncontrollable surplus (0.001–0.1) |

### Category 2: Constraint Violation Penalties

These provide soft enforcement of physical constraints that may be impossible to satisfy under extreme conditions. They must be high enough to propagate penalty signals into the future cost function and influence reservoir decisions multiple stages ahead.

| Penalty                  | Symbol        | Violated Constraint                           |
| ------------------------ | ------------- | --------------------------------------------- |
| Storage below minimum    | $c^{sv-}_h$   | $v_h \geq \underline{V}_h$                    |
| Filling target shortfall | $c^{fill}_h$  | $v_h \geq \underline{V}_h$ (terminal)         |
| Turbined flow minimum    | $c^{tv-}_h$   | $q_{h,k} \geq \underline{Q}_h$                |
| Outflow minimum/maximum  | $c^{ov\pm}_h$ | $\underline{O}_h \leq o_{h,k} \leq \bar{O}_h$ |
| Generation minimum       | $c^{gv-}_h$   | $g_{h,k} \geq \underline{G}_h$                |

### Category 3: Regularization Costs

Very small costs (2–3 orders of magnitude below economic costs) that break degeneracy and guide the solver toward physically preferred solutions when the LP is otherwise indifferent:

| Cost               | Symbol          | Purpose                           |
| ------------------ | --------------- | --------------------------------- |
| Spillage           | $c^{spill}_h$   | Prefer turbining over spilling    |
| FPHA turbined flow | $c^{fpha}_h$    | Prevent degenerate FPHA solutions |
| Exchange           | $c^{exch}_\ell$ | Prevent unnecessary power flows   |

### Priority Ordering

The ordering must be maintained to ensure correct economic signals:

$$
c^{fill} > c^{sv-} > c^{def} > c^{tv-}, c^{ov\pm}, c^{gv-} > c^{th}, c^{ctr} \gg c^{spill}, c^{fpha}, c^{exch}
$$

Filling a dead reservoir (dam safety) has the highest priority; load shedding ranks above generation costs; regularization terms are negligible compared to any economic quantity.

## The Stage Subproblem LP

The complete objective minimizes total cost over all load blocks $k \in \mathcal{K}$:

$$
\min \sum_{k \in \mathcal{K}} \tau_k \Bigg[
  \sum_{j} c^{th}_{j} g_{j,k}
  + \sum_{b} \sum_s c^{def}_{b,s} \delta_{b,k,s}
  + \sum_{b} c^{exc}_b \epsilon_{b,k}
  + \sum_{h} c^{spill}_h s_{h,k}
  + \text{other violation terms}
\Bigg]
$$

$$
+ \sum_{h} \left[ c^{sv-}_h \sigma^{v-}_h + c^{fill}_h \sigma^{fill}_h \right]
+ \; \theta
$$

Storage violation penalties ($\sigma^{v-}_h$, $\sigma^{fill}_h$) appear outside the block sum because they apply to end-of-stage storage (hm³), not per-block flow rates.

## Key Constraint Families

### Load Balance

For each bus $b$ and block $k$, supply must meet demand. Hydro generation, thermal dispatch, imports, and transmission flows contribute to supply; deficit and excess slack variables ensure feasibility:

$$
\sum_{h \in \mathcal{H}_b} g_{h,k} + \sum_{j \in \mathcal{T}_b} g_{j,k}
+ \text{(flows in)} - \text{(flows out)}
+ \sum_s \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k}
$$

### Hydro Water Balance

End-of-stage storage equals incoming storage plus net inflows and minus all outflows, scaled by the time conversion factor $\zeta = 0.0036 \times \sum_k \tau_k$:

$$
v_h = v^{in}_h + \zeta \left[ a_h + \sum_k w_k \left( \sum_{i \in \mathcal{U}_h}(q_{i,k} + s_{i,k}) - q_{h,k} - s_{h,k} - e_{h,k} \right) \right]
$$

where $a_h$ is the incremental inflow from the PAR(p) model and $v^{in}_h$ is the incoming storage.

### State-Fixing Constraints and the Benders Interface

A critical design choice is the introduction of explicit incoming-state LP variables $v^{in}_h$ and $a_{h,\ell}$, each fixed to the trial value via an equality constraint:

$$
v^{in}_h = \hat{v}_h, \qquad a_{h,\ell} = \hat{a}_{h,\ell}
$$

The dual of each fixing constraint is the cut coefficient for that state dimension. This "fishing constraint" technique collects all sensitivity information into a single dual value per state variable — the LP solver automatically propagates contributions from all downstream constraints (water balance, FPHA, generic constraints) through the incoming-state variable. The result appears in the stage LP as:

$$
\theta \geq \alpha_i + \sum_{h} \pi^v_{i,h} \cdot v_h + \sum_{h,\ell} \pi^{lag}_{i,h,\ell} \cdot a_{h,\ell}
$$

where $\pi^v_{i,h}$ is the dual of the storage fixing constraint and $\pi^{lag}_{i,h,\ell}$ is the dual of the lag fixing constraint. Each new Benders cut is derived from these duals after each backward-pass solve.

## Hydro Production Models

Two production models are available during training:

**Constant productivity**: A linear equality linking generation to turbined flow:

$$
g_{h,k} = \rho_h \cdot q_{h,k}
$$

where $\rho_h$ (MW per m³/s) depends on turbine efficiency and reference head. Simple and fast.

**FPHA (piecewise-linear)**: A set of $M$ linear hyperplanes forming a concave upper bound on generation as a function of storage and flow:

$$
g_{h,k} \leq \gamma_0^m + \gamma_v^m \cdot v^{avg}_h + \gamma_q^m \cdot q_{h,k} + \gamma_s^m \cdot s_{h,k}
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is average stage storage. FPHA captures head variation and the effect of spillage on tailrace level, at the cost of more constraints per hydro.

## Further Reading

- [Benders Decomposition](benders.md) — how cuts are derived from this LP structure
- [Hydro Production](hydro-production.md) — full derivation of constant productivity and FPHA models
- [PAR(p) Autoregressive Models](par-model.md) — the inflow model that produces $a_h$
- [LP Formulation (spec)](../specs/math/lp-formulation.md) — complete formal specification with all constraint families, variable bounds, and dual variable conventions
- [Cut Management (spec)](../specs/math/cut-management.md) — dual extraction and cut coefficient derivation
