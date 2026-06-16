# Penalty System

## Purpose

This spec defines the unified penalty system that ensures LP feasibility across all scenarios while correctly pricing operational costs and constraint violations. See [LP Formulation](./lp-formulation.md) for how penalties enter the objective function.

## 1. Cascade Resolution

The LP must always be feasible. Several physical and operational constraints may be impossible to satisfy in extreme scenarios (droughts, equipment failures, etc.). The penalty system provides slack variables with graduated costs to maintain feasibility while signaling the severity of violations.

Cobre's penalty cascade has three levels of specificity: a stage override on a (entity, stage, penalty) triple is most specific, an entity override defined per entity is next, and a global default at the case level is the fallback. The most specific value present wins.

| Query                       | Stage Override? | Entity Override? | Result                |
| --------------------------- | --------------- | ---------------- | --------------------- |
| Hydro 0, Stage 30, spillage | No              | Yes (0.005)      | 0.005 (entity)        |
| Hydro 0, Stage 60, spillage | Yes (0.02)      | Yes (0.005)      | 0.02 (stage)          |
| Hydro 1, Stage 30, spillage | No              | No               | 0.01 (global default) |

Penalties cascade through three tiers (global default, per-entity, per-stage); defaults live in case-level files.

## 2. Penalty Categories

Penalties serve three distinct purposes in the LP formulation. Understanding these categories is important for setting appropriate cost magnitudes and interpreting results.

### Category 1: Recourse Slacks (LP Feasibility)

These penalties ensure that the SDDP algorithm has relatively complete recourse — every subproblem must be feasible regardless of the scenario realization. Without these slacks, the LP would be infeasible when generation cannot meet demand or when excess uncontrollable generation cannot be absorbed.

| Penalty            | Units  | Applied To                | Purpose                         | Typical Range       |
| ------------------ | ------ | ------------------------- | ------------------------------- | ------------------- |
| `deficit_segments` | \$/MWh | Unmet load per bus        | Piecewise cost of load shedding | 1,000–10,000 \$/MWh |
| `excess_cost`      | \$/MWh | Excess generation per bus | Absorb uncontrollable surplus   | 0.001–100 \$/MWh    |

Deficit and excess are conceptually slack variables on the load balance constraint, but they have special names because of their importance in the hydrothermal dispatch application. Deficit represents the value of lost load; excess is a regularization-level cost to eliminate spurious slack generation.

> **Note on `excess_cost` range**: The wide typical range (0.001--100 \$/MWh) reflects two distinct use cases. At the low end (0.001--0.1), the cost acts as a pure regularization term that breaks solver degeneracy without distorting the policy. At the high end (1--100), the cost serves a policy-shaping role, actively discouraging excess generation to keep dispatch solutions physically realistic. The global default example (`"excess_cost": 100.0`) uses the upper end of this range.

### Category 2: Constraint Violation Penalties (Policy Shaping)

These penalties provide slack for physical or operational constraints that may be impossible to satisfy under extreme conditions (e.g., drought, environmental directives from the system operator). Their cost must be high enough to affect the value function in earlier stages, signaling that the system should avoid states that lead to these violations.

| Penalty                           | Units       | Applied To                    | Purpose                                            | Typical Range       |
| --------------------------------- | ----------- | ----------------------------- | -------------------------------------------------- | ------------------- |
| `storage_violation_below_cost`    | \$/hm3      | Storage < min (dead volume)   | Reservoir below dead volume — near-physical limit  | 10,000+ \$/unit     |
| `filling_target_violation_cost`   | \$/hm3      | Filling target not reached    | Terminal filling constraint — highest priority     | 50,000+ \$/unit     |
| `turbined_violation_below_cost`   | \$/(m3/s·h) | Turbined flow < min           | Equipment limits / ecological flow                 | 500–1,000 \$/unit   |
| `outflow_violation_below_cost`    | \$/(m3/s·h) | Outflow < min                 | Environmental minimum flow (operator/regulatory)   | 500–1,000 \$/unit   |
| `outflow_violation_above_cost`    | \$/(m3/s·h) | Outflow > max                 | Downstream flooding prevention                     | 500–1,000 \$/unit   |
| `generation_violation_below_cost` | \$/MWh      | Generation < min              | Contractual or environmental minimum generation    | 1,000–2,000 \$/unit |
| `evaporation_violation_cost`      | \$/(m3/s·h) | Evaporation constraint        | Physical constraint (bidirectional, see Section 5) | 5,000+ \$/unit      |
| `water_withdrawal_violation_cost` | \$/(m3/s·h) | Unmet water withdrawal        | Human consumption / irrigation commitments         | 1,000–5,000 \$/unit |
| `generic_violation_cost`          | varies      | Generic constraint violations | User-defined physical or operational constraints   | User-defined        |

These penalties create an artificial cost in the objective function that propagates backward through the value function, telling earlier stages to store more water (or dispatch differently) to avoid reaching states where violations are necessary.

### Category 3: Regularization Costs (Solution Guidance)

These are small costs inserted into the objective function to guide the solver toward physically preferred solutions when the LP would otherwise be indifferent. They do not represent real costs and should be orders of magnitude smaller than any economic cost to avoid distorting the optimal policy.

| Penalty            | Units       | Applied To                     | Purpose                                                                                                | Typical Range      |
| ------------------ | ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------ |
| `spillage_cost`    | \$/(m3/s·h) | Water spilled                  | Prefer turbining over spilling when solver is indifferent                                              | 0.001–0.01 \$/unit |
| `turbined_cost`    | \$/(m3/s·h) | Turbined flow (every hydro)    | Prevent interior FPHA solutions and align with NEWAVE; must be > `spillage_cost` per plant (see below) | 0.01–0.1 \$/unit   |
| `diversion_cost`   | \$/(m3/s·h) | Water diverted                 | Prefer main channel flow; higher than spillage (water leaves cascade)                                  | 0.01–0.1 \$/unit   |
| `curtailment_cost` | \$/MWh      | Curtailed non-controllable gen | Prioritize using available non-controllable generation over curtailing it                              | 0.001–0.01 \$/unit |
| `exchange_cost`    | \$/MWh      | Power flow on lines            | Prefer local supply; avoid unnecessary inter-bus power flows                                           | 0.01–1.0 \$/unit   |

### Penalty Priority Ordering

When setting penalty magnitudes, the following ordering must be maintained:

$$\text{Filling target} > \text{Storage violation} > \text{Deficit} > \text{Constraint violations} > \text{Resource costs} > \text{Regularization}$$

The filling target violation cost must be the highest penalty in the system — filling the dead volume is prioritized above all other objectives. The storage violation below cost must exceed deficit cost — keeping reservoirs above dead volume is more critical than serving load (operating below dead volume risks dam safety and equipment damage).

**Turbined-cost validation rule**: For every hydro, `turbined_cost > spillage_cost` must hold. The rule has two motivations. For hydros using the `fpha` model, the concave FPHA geometry allows interior LP solutions where the objective is met with less turbined flow than the physical production function would require — the turbined-flow penalty makes every unit of turbined flow carry a small additional cost, which collapses the degenerate interior region. For hydros using `constant_productivity`, the same penalty applies uniformly so that two solutions with the same generation but different `(turbined, spillage)` decompositions are tie-broken consistently with NEWAVE; without it, constant-productivity plants paid nothing on the turbine column and the dispatch diverged from the reference model.

### Penalty Ordering Validation

The qualitative ordering above is enforced by five adjacent-pair validation checks. Each check compares a higher-priority penalty against the next lower-priority penalty in the hierarchy. All five checks produce **warnings**, not errors — violating the ordering degrades policy quality but does not break algorithmic correctness. The turbined-cost validation rule (`turbined_cost > spillage_cost`) is a separate **error** because it affects LP solution correctness for FPHA plants (interior FPHA solutions), not merely policy quality.

Validation runs on **post-resolution** penalty values — after the three-tier cascade (global defaults, entity overrides, stage overrides) has been applied. Each (entity, stage) pair is checked independently, so a stage override that inverts the ordering for a specific entity will trigger a warning for that entity at that stage.

| Check | Higher Priority                              | Lower Priority                                                     | Comparison Scope  | Severity |
| ----- | -------------------------------------------- | ------------------------------------------------------------------ | ----------------- | -------- |
| 1     | `filling_target_violation_cost`              | `storage_violation_below_cost`                                     | Per hydro         | Warning  |
| 2     | `storage_violation_below_cost`               | `max(deficit_segments[-1].cost)` (last deficit segment on the bus) | Per hydro vs. bus | Warning  |
| 3     | `max(deficit_segments[-1].cost)`             | `max(constraint_violation_costs)` (see below)                      | Per hydro vs. bus | Warning  |
| 4     | `min(constraint_violation_costs)`            | `max(resource_costs)` (thermal generation costs)                   | Per bus           | Warning  |
| 5     | `min(resource_costs)` or `min(deficit_cost)` | `max(regularization_costs)` (see below)                            | System-wide       | Warning  |

**Constraint violation costs** (used in checks 3 and 4): the set {`turbined_violation_below_cost`, `outflow_violation_below_cost`, `outflow_violation_above_cost`, `generation_violation_below_cost`, `evaporation_violation_cost`, `water_withdrawal_violation_cost`} for the hydro being checked.

**Resource costs** (used in checks 4 and 5): thermal generation costs (`cost_per_mwh`) for thermals connected to the bus being checked.

**Regularization costs** (used in check 5): the set {`spillage_cost`, `turbined_cost`, `diversion_cost`, `curtailment_cost`, `exchange_cost`} across all entities in the system.

**Warning aggregation**: To avoid excessive output when many (entity, stage) pairs violate the same check, warnings are aggregated: one warning per violated check across all entities and stages. The warning message reports the total violation count and the most extreme example (the pair with the largest inversion magnitude).

## 3. Penalty Defaults and Overrides

Default penalty values are set at the case level for buses, lines, hydros, and non-controllable sources. Per-entity overrides may appear in the entity registry; per-stage overrides may appear as sparse tables.

Five additional hydro penalty fields support directional and inflow-specific penalties. All are optional and default to the symmetric value when unset:

- `water_withdrawal_violation_pos_cost` — penalty per m3/s of over-withdrawal (withdrew more than target); defaults to `water_withdrawal_violation_cost`
- `water_withdrawal_violation_neg_cost` — penalty per m3/s of under-withdrawal (withdrew less than target); defaults to `water_withdrawal_violation_cost`
- `evaporation_violation_pos_cost` — penalty per m³/s of positive deviation of the signed net evaporation flow from the linearised target; defaults to `evaporation_violation_cost`
- `evaporation_violation_neg_cost` — penalty per m³/s of negative deviation of the signed net evaporation flow from the linearised target; defaults to `evaporation_violation_cost`
- `inflow_nonnegativity_cost` — penalty per m3/s of inflow non-negativity slack activation (method = `"penalty"`); defaults to 1000.0

The fallback target for the four directional costs is the entity's **resolved** symmetric cost. If an entity overrides only its symmetric `water_withdrawal_violation_cost` (or `evaporation_violation_cost`), its directional `*_pos_cost` / `*_neg_cost` inherit that entity-level override — not the global symmetric default. The resolution order per directional field is therefore: entity directional override → entity symmetric override → global symmetric default; the global _directional_ default is never used as a fallback for a per-entity directional cost.

See [Inflow Non-Negativity](./inflow-nonnegativity.md) for details on the penalty method.

### Piecewise Deficit

Deficit is modeled as piecewise linear segments. Each segment specifies a depth (MW of unmet demand) and cost. Segments are cumulative: first `depth_mw` MW at first cost, next at second cost, etc. The last segment **MUST** have `depth_mw: null` to ensure LP feasibility (unbounded extension).

Deficit segments can be overridden per bus in the entity registry, but **cannot be stage-varying** (piecewise structure is too complex for per-stage override).

## 4. Constraint Violation Coverage

This section enumerates all constraints in the LP that use slack variables, organized by the system element they belong to. For the full LP constraint formulations, see [LP Formulation](./lp-formulation.md).

### System-Level (Bus)

| Constraint Type | Slack Variable | Direction                  | Penalty            | Category |
| --------------- | -------------- | -------------------------- | ------------------ | -------- |
| Load balance    | `deficit`      | Lower (unmet demand)       | `deficit_segments` | Recourse |
| Load balance    | `excess`       | Upper (surplus generation) | `excess_cost`      | Recourse |

### Hydro — Flow and Generation Constraints

| Constraint Type    | Slack Variable                   | Direction   | Penalty                               | Category             |
| ------------------ | -------------------------------- | ----------- | ------------------------------------- | -------------------- |
| Minimum storage    | `storage_violation_below`        | Lower bound | `storage_violation_below_cost`        | Constraint violation |
| Filling target     | `filling_target_violation`       | Lower bound | `filling_target_violation_cost`       | Constraint violation |
| Minimum turbined   | `turbined_violation_below`       | Lower bound | `turbined_violation_below_cost`       | Constraint violation |
| Minimum outflow    | `outflow_violation_below`        | Lower bound | `outflow_violation_below_cost`        | Constraint violation |
| Maximum outflow    | `outflow_violation_above`        | Upper bound | `outflow_violation_above_cost`        | Constraint violation |
| Minimum generation | `generation_violation_below`     | Lower bound | `generation_violation_below_cost`     | Constraint violation |
| Evaporation        | `evaporation_violation_pos`      | Upper slack | `evaporation_violation_pos_cost`      | Constraint violation |
| Evaporation        | `evaporation_violation_neg`      | Lower slack | `evaporation_violation_neg_cost`      | Constraint violation |
| Water withdrawal   | `water_withdrawal_violation_pos` | Upper slack | `water_withdrawal_violation_pos_cost` | Constraint violation |
| Water withdrawal   | `water_withdrawal_violation_neg` | Lower slack | `water_withdrawal_violation_neg_cost` | Constraint violation |

### Hydro — Storage Bounds

**Minimum storage** (`min_storage_hm3`) uses a slack variable (`storage_violation_below`) with a very high penalty cost — above deficit cost in the penalty hierarchy. Operating below dead volume risks dam safety and equipment damage, so this is treated as a near-physical violation. The slack ensures LP feasibility in extreme scenarios (severe drought, or the transition from filling to operating when the reservoir did not fully reach `min_storage_hm3`).

**Maximum storage** (`max_storage_hm3`) is a hard physical limit (reservoir capacity). If storage would exceed the maximum, emergency spillage handles the excess. No slack variable is used.

**Filling target constraint**: At the last filling stage (`entry_stage_id - 1`), a terminal constraint enforces `v_h >= min_storage_hm3`. This uses the `filling_target_violation` slack with the highest penalty in the system (`filling_target_violation_cost`), ensuring the solver prioritizes filling above all other objectives including load serving. The slack only activates when there is physically insufficient water.

### Lines

**Exchange bounds** are hard variable bounds on the direct and reverse flow variables. No slack variables. The `exchange_cost` is a regularization term on the flow variables themselves, not a violation penalty.

### Thermals

**Thermal bounds** (`min_generation`, `max_generation`) are hard constraints. No slack variables. Thermal dispatch is directly controllable (unlike hydro, which depends on exogenous inflows), so if bounds cannot be met, this indicates a data error.

### Generic Constraints

User-defined generic constraints can optionally have slack variables with user-specified penalty costs. These are typically used for physical or operational directives from the system operator, and fall into the **constraint violation** category.

### Non-Controllable Sources

**Non-controllable generation bounds**: Generation is bounded by `[0, available_generation]` where `available_generation` comes from the scenario pipeline. Both bounds are hard constraints — no slack variables. The `curtailment_cost` is a regularization term (Category 3) applied to the difference between available and dispatched generation, penalizing curtailment to prioritize using "free" non-controllable energy. Analogous to hydro `spillage_cost` — curtailment discards available energy.

## 5. Bidirectional Slacks and Directional Overrides

### Signed Net Evaporation

The reservoir-surface evaporation flow $Q_{ev,h}$ is a **signed net flux**: positive values represent net evaporative loss, negative values represent net rainfall input on the lake surface (precipitation on the reservoir exceeds open-water evaporation). On tropical and subtropical basins, the per-stage net coefficient is routinely negative for 5–7 months per year, so the negative case is the wet-season norm rather than an exceptional condition. Other situations that can yield a negative value include condensation in humid climates and linearisation artefacts at certain volume/coefficient combinations.

The evaporation column is bounded symmetrically, $Q_{ev,h} \in [-q^{\max}_{ev,h},\, +q^{\max}_{ev,h}]$, where $q^{\max}_{ev,h}$ is the maximum-magnitude linearised target across stages multiplied by a safety margin. The symmetric bound lets the same column absorb both directions without forcing the over-evaporation slack to fire on every wet-month stage. A negative $Q_{ev,h}$ enters the water-balance equation with the same coefficient as a positive value; the sign of $Q_{ev,h}$ itself controls whether the term subtracts (loss) or adds (rainfall input) from storage.

The evaporation equality row uses **bidirectional slack variables** to absorb deviations from the linearised target:

```
Q_evaporated - evap_slack_positive + evap_slack_negative = EvapCoef x Area(V_avg)

where:
  evap_slack_positive >= 0  (Q_evaporated above the linearised target)
  evap_slack_negative >= 0  (Q_evaporated below the linearised target)
```

The slacks themselves remain one-sided ($\geq 0$); the sign of the target is carried by $Q_{ev,h}$ and `EvapCoef`. Each slack receives its own penalty: `evaporation_violation_pos_cost` and `evaporation_violation_neg_cost`. When the directional costs are unset, both default to the entity's resolved symmetric `evaporation_violation_cost` — an entity that overrides only the symmetric cost has that override inherited by its directional costs, rather than reverting to the global default.

Stage-varying overrides follow the same pattern: directional costs may be overridden independently per (entity, stage). Penalty values may vary by stage. Stage-varying overrides are sparse — only entries that differ from defaults are recorded.

## 6. Hydro Variable Bounds Summary

| Variable        | Lower Bound         | Upper Bound         | Lower Slack  | Upper Slack     |
| --------------- | ------------------- | ------------------- | ------------ | --------------- |
| `storage`       | `min_storage_hm3`   | `max_storage_hm3`   | With penalty | Emergency spill |
| `turbined_flow` | `min_turbined_m3s`  | `max_turbined_m3s`  | With penalty | Hard            |
| `spillage`      | 0                   | Inf                 | Hard         | —               |
| `outflow`       | `min_outflow_m3s`   | `max_outflow_m3s`   | With penalty | With penalty    |
| `generation`    | `min_generation_mw` | `max_generation_mw` | With penalty | Hard            |
| `evaporation`   | $-q^{\max}_{ev,h}$  | $+q^{\max}_{ev,h}$  | With penalty | With penalty    |
| `withdrawal`    | `water_withdrawal`  | `water_withdrawal`  | With penalty | With penalty    |

> **Generation bounds**: The user explicitly sets `min_generation_mw` and `max_generation_mw`. These are not derived from turbined flow bounds, because the production function is not always constant productivity. When a complete hydro model is available, the installed capacity provides a natural hard upper bound. The lower bound always requires a slack to maintain feasibility.

Relationship: `outflow = turbined_flow + spillage`, `generation = f(turbined_flow, storage)` (depends on production model)

### Dead-Volume Filling Specifics

During the filling period (`[start_stage_id, entry_stage_id)`), the hydro is in commissioning state. The reservoir is being filled to `min_storage_hm3` (dead volume). This model is based on CEPEL's dead-volume filling approach (`enchimento de volume morto`).

**Operational constraints during filling**:

- **No generation**: `turbined_flow = 0`, `generation = 0` (hard constraint — turbines not installed/operational)
- **Outflow via spillage only**: During filling, turbines are not operational. Outflow is limited to spillage once water reaches the spillway crest. Bottom discharge outlets are a simulation-only feature.
- **Min outflow requirement**: Environmental flow must be met via spillage. If spillage is not physically possible (reservoir level below spillway crest), the `outflow_violation_below` slack absorbs the shortfall.
- **Filling retention**: Inflow allocated for filling is removed from available inflow before the water balance — it goes directly to storage.
- **Storage bounds relaxed**: `min_storage_hm3` does not apply during filling — storage can be anywhere in `[0, max_storage_hm3]`.

**Terminal filling constraint**: At the last filling stage (`entry_stage_id - 1`), a constraint enforces:

```
v_h >= min_storage_hm3 - filling_target_violation
```

where `filling_target_violation >= 0` has `filling_target_violation_cost` — the highest penalty in the system. This ensures the solver prioritizes filling above all other objectives. The slack only activates when nature physically did not provide enough water.

**Transition to operating**: At `entry_stage_id`, the hydro becomes operational. The storage at the end of the last filling stage becomes the initial storage for the first operating stage. If `filling_target_violation > 0` (filling fell short), the operating stage's own `storage_violation_below` slack handles the shortfall — both LPs remain feasible.

**Penalties during filling**: The same outflow violation cost applies. Spillage during filling also incurs `spillage_cost`. The `storage_violation_below` slack is not active during filling (storage is allowed below `min_storage_hm3` by design).

## 7. LP Objective Function Impact

For each stage `t`, block `b`, scenario `s`:

```
minimize:
  // Resource costs
  + Sigma_thermal (generation x cost_per_mwh)
  + Sigma_contract (import x import_price - export x export_price)

  // Recourse slacks (LP feasibility)
  + Sigma_bus Sigma_segment (deficit_segment x segment_cost)
  + Sigma_bus (excess x excess_cost)

  // Constraint violation penalties (policy shaping)
  + Sigma_hydro (storage_violation_below x storage_violation_below_cost)
  + Sigma_hydro_filling (filling_target_violation x filling_target_violation_cost)
  + Sigma_hydro (turbined_violation_below x turbined_violation_below_cost)
  + Sigma_hydro (outflow_violation_below x outflow_violation_below_cost)
  + Sigma_hydro (outflow_violation_above x outflow_violation_above_cost)
  + Sigma_hydro (generation_violation_below x generation_violation_below_cost)
  + Sigma_hydro (evaporation_violation_pos x evaporation_violation_pos_cost)
  + Sigma_hydro (evaporation_violation_neg x evaporation_violation_neg_cost)
  + Sigma_hydro (water_withdrawal_violation_pos x water_withdrawal_violation_pos_cost)
  + Sigma_hydro (water_withdrawal_violation_neg x water_withdrawal_violation_neg_cost)

  // Regularization costs (solution guidance)
  + Sigma_hydro (spillage x spillage_cost)
  + Sigma_hydro (turbined_flow x turbined_cost)
  + Sigma_hydro (diversion x diversion_cost)
  + Sigma_ncs (curtailment x curtailment_cost)
  + Sigma_line (direct_flow x exchange_cost + reverse_flow x exchange_cost)

  // Future cost function
  + theta  // Cut approximation (future cost)
```

> **Note on pumping**: Pumping stations do not have an explicit cost in the objective. The cost of pumping is implicitly captured through the energy consumed at the connected bus (appears as negative demand in the load balance). The marginal cost at that bus determines the effective pumping cost.

## Cross-References

- [LP Formulation](./lp-formulation.md) — Cost taxonomy (§1) and penalty terms (§9)
- [Inflow Non-Negativity](./inflow-nonnegativity.md) — Penalty method for inflow non-negativity
