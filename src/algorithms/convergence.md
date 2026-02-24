# Convergence

SDDP is an iterative algorithm, so it needs well-defined criteria for when to stop. This page explains how convergence is monitored through bounds and what stopping rules are available. For the full specification, see [Stopping Rules (spec)](../specs/math/stopping-rules.md) and [Upper Bound Evaluation (spec)](../specs/math/upper-bound-evaluation.md).

## Lower bound

The first-stage LP objective -- immediate cost plus the cut-based approximation of future cost -- provides a **deterministic lower bound** $\underline{z}^k$ at iteration $k$:

$$
\underline{z}^k = c_1^\top \hat{x}_1^k + \theta_1^k
$$

Because each iteration adds new cuts that can only tighten the approximation, the lower bound increases monotonically. It never decreases, making it a reliable progress indicator.

## Upper bound

The average total cost across all forward pass trajectories provides a **statistical upper bound** $\bar{z}^k$:

$$
\bar{z}^k = \frac{1}{M} \sum_{m=1}^{M} \sum_{t=1}^{T} c_t^\top \hat{x}_t^{k,m}
$$

This is a Monte Carlo estimate of the true policy cost, so it carries sampling noise. It is typically reported with a confidence interval based on the sample standard deviation across trajectories.

For risk-averse problems (e.g., CVaR objectives), the statistical upper bound is not valid in the classical sense. Cobre also supports a **deterministic upper bound** via inner approximation (vertex-based Lipschitz interpolation), which provides valid bounds regardless of the risk measure. See [Upper Bound Evaluation (spec)](../specs/math/upper-bound-evaluation.md) for details.

## Optimality gap

The gap between the bounds measures how far the current policy may be from optimal:

$$
\text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)}
$$

A small gap means the cut approximation is close to the true value function and the policy is near-optimal. In practice, the gap is monitored over iterations and used by the stopping rules described below.

## Stopping rules

Cobre supports several stopping criteria, evaluated at the end of each iteration. Multiple rules can be combined with OR logic (stop when any rule triggers) or AND logic (stop when all rules trigger simultaneously).

### Iteration limit

A hard cap on the number of iterations. This is a safety bound to prevent runaway computation and must always be present.

### Time limit

A wall-clock time budget. Checked at the end of each iteration.

### Bound stalling

Detects when the lower bound has plateaued. The rule computes the relative improvement of $\underline{z}^k$ over a sliding window of $\tau$ iterations:

$$
\Delta_k = \frac{\underline{z}^k - \underline{z}^{k-\tau}}{\max(1, |\underline{z}^k|)}
$$

If $|\Delta_k|$ falls below a tolerance, the algorithm stops -- further iterations are unlikely to improve the policy significantly.

### Simulation-based stopping (recommended)

The most robust criterion combines bound stability with policy stability. Periodically (e.g., every 20 iterations), the rule:

1. Checks whether the lower bound has stabilized over a recent window.
2. If so, runs a batch of Monte Carlo simulations using the current policy and compares the per-stage cost profile to the previous simulation batch.
3. Stops only when both the bound and the simulated policy costs have converged.

This avoids premature termination from statistical noise and ensures the policy is genuinely stable, not just the bound.

## Termination output

When the algorithm stops, the output reports which rule triggered, the final iteration count, the lower and upper bounds, and the optimality gap. This information supports post-hoc analysis of whether the policy is sufficiently converged or whether additional iterations would be beneficial.

## Related topics

- [SDDP Theory](sddp-theory.md) -- Overview of the algorithm and its bound structure
- [Forward and Backward Passes](forward-backward.md) -- The iteration mechanics that produce bounds
- [Stopping Rules (spec)](../specs/math/stopping-rules.md) -- Full specification with configuration schemas and formulas
- [Upper Bound Evaluation (spec)](../specs/math/upper-bound-evaluation.md) -- Deterministic upper bounds via inner approximation
