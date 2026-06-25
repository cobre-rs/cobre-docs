---
title: Equipment-Specific Formulations
description: Detailed LP constraints for each equipment type — thermal, transmission, contracts, pumping, NCS — with objective contributions and load balance entries.
---

## Purpose

This spec details the LP constraints for each equipment type in Cobre. While [system elements](/math/system-elements) describes _what_ each element is and its decision variables, this spec contains the _detailed mathematical constraints_ governing each equipment type's behavior within the LP. The reading order is: [system elements](/math/system-elements) → [LP formulation](/math/lp-formulation) → **this spec** (per-equipment deep dives).

For variable definitions and index sets, see [notation conventions](/overview/notation-conventions). For hydro production constraints specifically, see [hydro production models](/math/hydro-production-models).

## 1. Thermal Plants

### 1.1 Standard Thermals

Thermal generation cost is modeled as a **piecewise-linear convex function** of dispatched power. Each cost segment represents a generation tranche with its own marginal cost — for example, a 200 MW plant might have its first 50 MW at \$100/MWh, the next 50 MW at \$150/MWh, and the final 100 MW at \$200/MWh. Because the segment costs are non-decreasing (convex), the LP solver naturally fills cheaper segments first.

**Decision Variables:**

- $g_{j,k,s}$ = generation at thermal $j$, block $k$, cost segment $s$

**Constraints:**

Total generation:

$$
g_{j,k} = \sum_{s} g_{j,k,s}
$$

Segment bounds:

$$
0 \leq g_{j,k,s} \leq \bar{g}_{j,s} \quad \forall s
$$

Total generation bounds:

$$
\underline{G}_j \leq g_{j,k} \leq \bar{G}_j
$$

Both bounds are **hard** constraints with no slack variables — thermal dispatch is directly controllable (unlike hydro, which depends on exogenous inflows).

**Objective Contribution:**

$$
\sum_{k} \tau_k \sum_{s} c^{th}_{j,s} \cdot g_{j,k,s}
$$

:::note[Continuous relaxation]
Cobre does not include binary commitment variables in the training LP. The minimum generation bound $\underline{G}_j$ is enforced as a simple lower bound, meaning the LP may dispatch a thermal at an intermediate level between zero and $\underline{G}_j$ — a region that is physically infeasible for most thermal units (below minimum stable load). This is a deliberate modeling choice: the continuous relaxation is acceptable for the long-term planning horizon targeted by SDDP, and stepped enforcement can be applied during simulation.
:::

## 2. Transmission Lines

**Decision Variables:**

- $f^+_{l,k}$ = direct flow (source → target)
- $f^-_{l,k}$ = reverse flow (target → source)

**Bounds:**

$$
0 \leq f^+_{l,k} \leq \bar{F}^+_l, \quad 0 \leq f^-_{l,k} \leq \bar{F}^-_l
$$

:::note[Stage-varying capacity]
The capacity limits $\bar{F}^+_l$ and $\bar{F}^-_l$ may vary by stage through exchange factors defined in `constraints/exchange_factors.json`.
:::

**Load Balance Contribution:**

At source bus:

$$
-f^+_{l,k} + \eta_l f^-_{l,k}
$$

At target bus:

$$
\eta_l f^+_{l,k} - f^-_{l,k}
$$

where $\eta_l = 1 - \text{losses\_percent}/100$ accounts for transmission losses.

**Objective Contribution:**

$$
\sum_{k} \tau_k \cdot c^{exch}_l (f^+_{l,k} + f^-_{l,k})
$$

:::note[Note on Exchange Cost]
The cost $c^{exch}_l$ is a **regularization term**, not an actual transmission cost. Its purpose is to:

1. **Prevent degenerate solutions**: Without this term, multiple equivalent solutions exist with different flow patterns
2. **Guide the solver**: Small positive cost encourages minimal power transfers when indifferent
3. **Improve numerical stability**: Reduces cycling in LP simplex iterations

Typical values are very small (\$0.01–1.00/MWh), several orders of magnitude below generation costs. If this cost significantly affects dispatch decisions, the value is set too high.

See LP formulation (§1.4 Regularization Costs) for the full taxonomy of penalty vs. cost types.
:::

## 3. Import/Export Contracts

Each contract is **unidirectional** — either an import or an export contract, identified by a `type` field.

**Decision Variables:**

- $\chi_{c,k}$ = dispatched power for contract $c$, block $k$

**Bounds:**

$$
\underline{C}_c \leq \chi_{c,k} \leq \bar{C}_c
$$

**Load Balance Contribution:**

At connected bus:

- Import contracts ($c \in \mathcal{C}^{imp}$): $+\chi_{c,k}$ (power entering the system)
- Export contracts ($c \in \mathcal{C}^{exp}$): $-\chi_{c,k}$ (power leaving the system)

**Objective Contribution:**

$$
\sum_{k} \tau_k \sum_{c \in \mathcal{C}} c^{ctr}_c \cdot \chi_{c,k}
$$

Because import prices ($c^{ctr}_c$) are positive and export prices are negative, this single summation naturally adds import costs and subtracts export revenue.

## 4. Pumping Stations

Pumping stations transfer water from a source reservoir (downstream) to a destination reservoir (upstream), consuming electrical power in the process.

**Decision Variables:**

- $p_{j,k}$ = pumped water flow at station $j$, block $k$ (m³/s)

**Bounds:**

$$
\underline{P}_j \leq p_{j,k} \leq \bar{P}_j
$$

Both bounds are hard constraints.

**Power Consumption:**

$$
P^{pump}_{j,k} = \gamma_j \cdot p_{j,k}
$$

where $\gamma_j$ is the power consumption rate (MW per m³/s).

**Water Balance Impact:**

- Source hydro: $-p_{j,k}$ (water removed)
- Destination hydro: $+p_{j,k}$ (water added)

**Load Balance Impact:**

At connected bus: $-P^{pump}_{j,k} = -\gamma_j \cdot p_{j,k}$ (power consumed)

**Objective Contribution:** None

:::note[Economic Modeling Note]
Pumping stations do not have a direct cost term in the objective function. The cost of pumping is implicitly captured through energy consumption — the marginal cost of energy at the connected bus determines the effective pumping cost. This approach correctly models the economic incentive: pumping is attractive when energy prices are low (e.g., excess hydro/renewable generation) and unattractive when prices are high (e.g., thermal dispatch at margin).
:::

## 5. Hydro Plants

Hydro constraints are the most complex in the system. Rather than duplicating them here, the hydro formulation is split across two specs:

- **Water balance, outflow, storage bounds, and soft constraints**: See [LP formulation](/math/lp-formulation) §4 (water balance), §6 (generation constraints), §7 (outflow constraints), §8 (variable bounds), §9 (constraint violation penalties).
- **Production function models** (constant productivity, FPHA, linearized head): See [hydro production models](/math/hydro-production-models).

For hydro decision variables and physical meaning, see [system elements](/math/system-elements) §5.

## 6. Non-Controllable Generation Sources

Non-controllable sources (wind farms, solar plants, small run-of-river hydros) have stochastic availability determined by the scenario pipeline. The solver can only curtail generation below the available amount — it cannot dispatch upward beyond what nature provides.

**Decision Variables:**

- $g^{nc}_{r,k}$ = generation at non-controllable source $r$, block $k$

**Bounds (hard):**

$$
0 \leq g^{nc}_{r,k} \leq A_r
$$

where $A_r$ is the stochastic available generation for the current (stage, scenario), bounded by $[0, \bar{G}_r]$ (installed capacity).

**Load Balance Contribution:**

At connected bus: $+g^{nc}_{r,k}$ (generation injected)

**Objective Contribution:**

$$
\sum_{k} \tau_k \sum_{r \in \mathcal{R}} c^{curt}_r \cdot (A_r - g^{nc}_{r,k})
$$

The curtailment cost $c^{curt}_r$ is a **regularization** penalty (Category 3 in the [Penalty System](/math/penalty-system)), analogous to `spillage_cost` for hydros — curtailment discards available "free" energy.

:::note[Note on curtailment not separate]
Curtailment is **not** a separate LP decision variable — it is derived as $\kappa_{r,k} = A_r - g^{nc}_{r,k}$. Both bounds are hard constraints with no slack variables, since the available generation is always non-negative and output can always be curtailed to zero.
:::

:::note[Block distribution of available generation]
The scenario pipeline produces a single available generation value $A_r$ per (stage, scenario). This value is used identically across all blocks within the stage — NCS generation is distributed proportionally to block duration. An alternative would be per-block factors (analogous to load demand and exchange capacity), trading uniform treatment for finer intra-stage granularity. Cobre does not currently support NCS block factors.
:::

## Cross-References

- [Notation conventions](/overview/notation-conventions) — variable and set definitions ($g_j$, $f_l$, $\chi_c$, $p_j$, $\tau_k$)
- [System elements](/math/system-elements) — element descriptions, decision variables, and connections
- [LP formulation](/math/lp-formulation) — how equipment constraints integrate into the assembled LP; hydro water balance (§4), generation constraints (§6), variable bounds (§8)
- [Hydro production models](/math/hydro-production-models) — hydro-specific production function constraints (constant, FPHA, linearized head)
- [Penalty System](/math/penalty-system) — penalty taxonomy, regularization vs. violation costs
- [Block formulations](/math/block-formulations) — block structure within which equipment constraints operate
- [SDDP Algorithm](/math/sddp-algorithm) — iterative algorithm that solves stage subproblems containing these equipment constraints
