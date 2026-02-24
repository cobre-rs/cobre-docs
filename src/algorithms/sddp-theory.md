# SDDP Theory

Stochastic Dual Dynamic Programming (SDDP) is the core optimization algorithm behind Cobre's hydrothermal dispatch solver. This page provides a practical overview of how the algorithm works. For the complete formal specification, see [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md).

## What problem does SDDP solve?

Power system operators must decide how much water to release from reservoirs and how much thermal generation to dispatch at each time step over a multi-month or multi-year horizon. The challenge is **uncertainty**: future river inflows are unknown, and using too much water now risks expensive thermal generation later, while hoarding water risks spilling it.

SDDP finds the least-cost generation schedule that accounts for this uncertainty across all stages simultaneously. The decision at each stage depends on the current reservoir levels, recent inflow history, and a probabilistic model of future inflows.

## How SDDP works: forward and backward passes

SDDP is an iterative algorithm. Each iteration has two phases:

**Forward pass.** The algorithm simulates the system forward in time, from stage 1 to stage $T$. At each stage it samples a random inflow scenario, solves a linear program (LP) to determine optimal generation and reservoir operations, and records the resulting reservoir levels. These recorded states are called **trial points**. Multiple independent trajectories are simulated in parallel.

**Backward pass.** Walking backward from stage $T$ to stage 1, the algorithm re-solves each stage LP at the trial points collected during the forward pass -- but now for _every_ inflow scenario in the scenario set. From each solve it extracts dual variables (shadow prices) that measure how sensitive the future cost is to changes in reservoir levels. These sensitivities are assembled into **Benders cuts**: linear constraints that approximate the future cost function.

Each iteration adds new cuts, progressively tightening the approximation of future costs. The forward pass uses the latest cuts to make better decisions; the backward pass generates cuts at the states actually visited.

## Lower and upper bounds

SDDP produces two bounds that bracket the true optimal cost:

**Lower bound.** The first-stage LP objective (including the cut-based future cost approximation) provides a deterministic lower bound $\underline{z}^k$. Because cuts can only tighten the approximation, this bound increases monotonically across iterations.

**Upper bound.** The average total cost across all forward pass trajectories provides a statistical upper bound $\bar{z}^k$. This estimate has sampling noise, so it is typically reported with a confidence interval.

## Convergence

The algorithm monitors the **optimality gap** between the bounds:

$$
\text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)}
$$

When the gap falls below a threshold, or the lower bound stalls, the algorithm terminates. The resulting set of cuts defines the operational **policy**: at any future state, solving the LP with these cuts yields the recommended dispatch.

For detailed stopping criteria, see [Convergence](convergence.md) and [Stopping Rules (spec)](../specs/math/stopping-rules.md).

## Policy graphs

SDDP organizes stages into a **policy graph** -- a directed graph where nodes are decision stages and arcs represent transitions.

**Finite horizon.** The standard setup is a linear chain of $T$ stages (e.g., 60 monthly stages for a 5-year study). The terminal stage has zero future cost.

**Infinite horizon.** For long-term planning, the last stage can loop back to the first, creating a cyclic graph. A discount factor $d < 1$ on the cycle arc ensures convergence. Cuts at equivalent positions in the cycle are shared.

See [SDDP Algorithm (spec) -- Policy Graph Structure](../specs/math/sddp-algorithm.md#4-policy-graph-structure) for details.

## State variables

The **state** at each stage captures everything the future cost depends on. In Cobre, state variables are:

- **Reservoir storage volumes** ($v_h$): one per hydro plant, representing end-of-stage water levels
- **Autoregressive inflow lags** ($a_{h,\ell}$): past inflow values needed by the PAR(p) stochastic model to generate current-stage inflows

Together, these can reach approximately 2000 dimensions for a system with 160+ hydro plants and multi-lag inflow models.

The Markov property -- future costs depend only on the current state, not on the path that led to it -- is what makes cut generation mathematically valid. The AR lags are included as state variables precisely to preserve this property.

## Single-cut formulation

Cobre uses the **single-cut** formulation by default: at each iteration, the per-scenario cut coefficients are averaged into one aggregated cut per stage. This keeps the LP small and solve times fast, at the cost of potentially needing more iterations. A multi-cut variant (one cut per scenario) is planned for future releases.

## Further reading

- [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md) -- Complete formal specification with all formulas, edge cases, and design rationale
- [Benders Decomposition](benders.md) -- The decomposition technique underlying cut generation
- [Forward and Backward Passes](forward-backward.md) -- Detailed pass mechanics
- [Convergence](convergence.md) -- Bound computation and stopping criteria
- [Cut Management](cut-management.md) -- Cut selection, deletion, and storage strategies
- [Single-Cut vs Multi-Cut](single-multi-cut.md) -- Trade-offs between aggregation strategies
