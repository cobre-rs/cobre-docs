# Stopping Rules

## Purpose

This spec defines the available stopping rules for the Cobre SDDP solver, their configuration, and how they combine. It covers iteration limits, time limits, bound stalling, and the recommended simulation-based stopping criterion.

## 1 Available Stopping Rules

SDDP can terminate based on multiple criteria. Each rule is evaluated independently, and the `stopping_mode` determines how they combine:

- `"any"`: Stop when **any** rule triggers (OR logic)

- `"all"`: Stop when **all** rules trigger (AND logic)

## 2 Iteration Limit (Mandatory)

**Configuration**:

```json
{ "type": "iteration_limit", "limit": 50 }
```

**Evaluation**:

$$
\text{STOP} \iff k \geq k_{max}
$$

where $k$ is the current iteration and $k_{max}$ is the limit.

**Purpose**: Safety bound to prevent infinite loops. **Must always be included.**

## 3 Time Limit

**Configuration**:

```json
{ "type": "time_limit", "seconds": 3600 }
```

**Evaluation**:

$$
\text{STOP} \iff t_{elapsed} \geq t_{max}
$$

Wall-clock time is checked at the end of each iteration.

## 4 Bound Stalling

**Configuration**:

```json
{
  "type": "bound_stalling",
  "iterations": 10,
  "tolerance": 0.0001
}
```

**Evaluation**:

Track the deterministic lower bound $\underline{z}^k$ over iterations. Compute relative improvement over a window of $\tau$ iterations (the `iterations` parameter):

$$
\Delta_k = \frac{\underline{z}^k - \underline{z}^{k-\tau}}{\max(1, |\underline{z}^k|)}
$$

**Stopping condition**:

$$
\text{STOP} \iff |\Delta_k| < \text{tolerance}
$$

**Interpretation**: The bound has plateaued — the relative improvement over the last $\tau$ iterations is below the specified tolerance, indicating diminishing returns from further iterations.

> **Risk-averse note**: Under risk-averse formulations (e.g., CVaR), the lower bound $\underline{z}^k$ may not be a valid bound in the classical sense. Bound stalling still detects convergence of the outer approximation, but the gap interpretation changes. See [Risk Measures](risk-measures.md) for details.

## 5 Simulation-Based Stopping (Recommended)

**Configuration**:

```json
{
  "type": "simulation",
  "replications": 100,
  "period": 20,
  "bound_window": 5,
  "distance_tol": 0.01,
  "bound_tol": 0.0001
}
```

| Parameter      | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `replications` | Number of Monte Carlo forward simulations to run                         |
| `period`       | Check every this many iterations                                         |
| `bound_window` | Number of past iterations over which to measure bound stability          |
| `distance_tol` | Threshold for normalized distance between consecutive simulation results |
| `bound_tol`    | Relative tolerance for bound stability check                             |

**Algorithm**:

1. **Check bound stability first**:

   $$
   \text{Bound stable} \iff \left| \underline{z}^k - \underline{z}^{k - w} \right| < \text{bound\_tol} \times \max(1, |\underline{z}^k|)
   $$

   where $w$ is the `bound_window` parameter.

2. **If bound is stable**, run `replications` Monte Carlo simulations using the current policy. Compute per-stage total costs $c_t^{new}$ and compare to the previous simulation's costs $c_t^{old}$:

   $$
   d = \sqrt{\sum_{t} \left( \frac{c_t^{new} - c_t^{old}}{\max(1, |c_t^{old}|)} \right)^2}
   $$

   The comparison metric is the mean per-stage cost across replications. Future extensions may compare other quantities (e.g., state variable trajectories or decision variable distributions).

3. **Stopping condition**:
   $$
   \text{STOP} \iff \text{Bound stable} \land d < \text{distance\_tol}
   $$

**Interpretation**: Both the outer approximation (bound) and the policy (simulated costs) have stabilized.

**Why recommended**: Combines a theoretical convergence indicator (bound) with practical policy quality (simulation), avoiding premature termination from statistical noise.

> **Risk-averse note**: For risk-averse problems, the bound stability check monitors convergence of the risk-adjusted outer approximation. The simulation comparison remains valid since it measures policy stability directly, independent of bound interpretation. See [Risk Measures](risk-measures.md).

> **Partial Implementation**: The current implementation is a stub that compares simulation costs against a **zero baseline** rather than consecutive simulation snapshots. Specifically, when `simulation_costs` are available, the distance is computed as $d = \sqrt{\sum_t (c_t / \max(1, |c_t|))^2}$ against zero, which is conservative: it never triggers on the first evaluation and only triggers when per-stage costs are themselves near zero. The planned full version (targeted for a future epic) will store the previous simulation's cost vector and compute the distance between consecutive snapshots as described above ($c_t^{new}$ vs $c_t^{old}$). The convergence monitor is responsible for managing the two-snapshot comparison externally.
>
> Additionally, the **bound stability pre-check** (Phase 1) is not yet implemented: the `bound_tol` and `bound_window` parameters are parsed from configuration but currently discarded -- the rule skips directly to the simulation distance comparison. Until Phase 1 is implemented, the rule may evaluate simulations even when the bound is still actively improving, which is conservative (wastes simulation time) but not incorrect.

## 6 Combining Rules

**Mode: `"any"` (default)**:

$$
\text{STOP} \iff \text{Rule}_1 \lor \text{Rule}_2 \lor \ldots
$$

First rule to trigger causes termination.

**Mode: `"all"`**:

$$
\text{STOP} \iff \text{Rule}_1 \land \text{Rule}_2 \land \ldots
$$

All rules must trigger simultaneously.

**Example** (conservative setup):

```json
{
  "stopping_rules": [
    { "type": "iteration_limit", "limit": 500 },
    {
      "type": "simulation",
      "replications": 100,
      "period": 20,
      "bound_window": 5,
      "distance_tol": 0.01,
      "bound_tol": 0.0001
    }
  ],
  "stopping_mode": "any"
}
```

This runs until simulation-based convergence OR 500 iterations, whichever comes first.

## 7 Output on Termination

When any stopping rule triggers, the output includes:

| Field             | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `stopping_rule`   | Which rule triggered                                                       |
| `final_iteration` | Iteration count at termination                                             |
| `lower_bound`     | Final deterministic lower bound                                            |
| `upper_bound`     | Final simulated upper bound (if available)                                 |
| `gap`             | Optimality gap: $(\bar{z} - \underline{z}) / \max(1, \lvert\bar{z}\rvert)$ |

## Cross-References

- [Notation Conventions](../overview/notation-conventions.md) — Symbol definitions for bounds and statistical quantities
- [SDDP Algorithm](sddp-algorithm.md) — Main iteration loop that evaluates stopping rules
- [Cut Management](cut-management.md) — Cut generation and selection that affect convergence speed
- [Upper Bound Evaluation](upper-bound-evaluation.md) — Monte Carlo simulation for upper bound estimation, used by simulation-based stopping
- [Risk Measures](risk-measures.md) — Risk-averse formulations that affect bound interpretation
- [Configuration Reference](../configuration/configuration-reference.md) — JSON schema for `stopping_rules` and `stopping_mode`
