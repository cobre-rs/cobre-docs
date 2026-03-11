# Convergence

SDDP is an iterative algorithm, so it needs well-defined criteria for when to stop. This page explains how convergence is monitored through bounds, what the five available stopping rules are and how their formulas work, and how to obtain a deterministic upper bound independent of the risk measure.

## Lower Bound

The first-stage LP objective — immediate cost plus the cut-based approximation of future cost — provides a **deterministic lower bound** $\underline{z}^k$ at iteration $k$:

$$
\underline{z}^k = c_1^\top \hat{x}_1^k + \theta_1^k
$$

Because each iteration adds new cuts that can only tighten the approximation, the lower bound increases monotonically. It never decreases, making it a reliable progress indicator.

## Statistical Upper Bound

The average total cost across all forward pass trajectories provides a **statistical upper bound** $\bar{z}^k$:

$$
\bar{z}^k = \frac{1}{M} \sum_{m=1}^{M} \sum_{t=1}^{T} c_t^\top \hat{x}_t^{k,m}
$$

This is a Monte Carlo estimate of the true policy cost, so it carries sampling noise. It is typically reported with a confidence interval based on the sample standard deviation across trajectories.

For risk-averse problems (e.g., CVaR objectives), the statistical upper bound is not valid in the classical sense — the sample average is not a valid upper bound on a risk measure. In such cases, the deterministic upper bound described below is necessary.

## Deterministic Upper Bound via Inner Approximation

For a convergence certificate valid under any risk measure, Cobre supports a **deterministic upper bound** through inner approximation (SIDP). The idea is to build a concave piecewise-linear overestimate of the value function from the _inside_, complementing the convex piecewise-linear underestimate built by cuts from the _outside_.

The inner approximation stores **vertices** — visited state-value pairs $(x^{(i)}, \bar{v}^{(i)})$ collected during forward passes. At any query state $x$, the upper bound is interpolated via the Lipschitz condition:

$$
\bar{V}_t(x) = \min_{i \in \mathcal{V}_t} \left\{ \bar{v}^{(i)} + L_t \cdot \|x - x^{(i)}\|_1 \right\}
$$

where $L_t$ is the Lipschitz constant for stage $t$, computed backward from the maximum penalty coefficient:

$$
L_T = c_{max}^{penalty}, \qquad L_t = L_{t+1} + c_{max}^{penalty,t}
$$

This formula uses the largest penalty cost (the dominant term in the objective) as a bound on how fast the value function can change per unit change in state. The upper bound at stage 1 then gives:

$$
\bar{z}^k = c_1(\hat{x}_1) + \bar{V}_2(\hat{x}_1)
$$

As iterations proceed, more vertices are collected and the inner approximation tightens. Both bounds converge to the same value, and the gap goes to zero.

## Optimality Gap

The gap between the bounds measures how far the current policy may be from optimal:

$$
\text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)}
$$

A small gap means the cut approximation is close to the true value function and the policy is near-optimal. In practice, the gap is monitored over iterations and used by the stopping rules described below.

## Stopping Rules

Cobre supports five stopping criteria, evaluated at the end of each iteration. Multiple rules can be combined with OR logic (stop when any rule triggers) or AND logic (stop when all rules trigger simultaneously).

### Iteration Limit

A hard cap on the number of iterations. This rule must always be present as a safety bound:

$$
\text{STOP} \iff k \geq k_{max}
$$

### Time Limit

A wall-clock time budget. Checked at the end of each iteration:

$$
\text{STOP} \iff t_{elapsed} \geq t_{max}
$$

### Bound Stalling

Detects when the lower bound has plateaued. The rule computes the relative improvement of $\underline{z}^k$ over a sliding window of $\tau$ iterations:

$$
\Delta_k = \frac{\underline{z}^k - \underline{z}^{k-\tau}}{\max(1, |\underline{z}^k|)}
$$

$$
\text{STOP} \iff |\Delta_k| < \varepsilon_{stall}
$$

If $|\Delta_k|$ falls below the tolerance, further iterations are unlikely to improve the policy significantly.

### Gap Convergence

Stops when the optimality gap falls below a threshold:

$$
\text{STOP} \iff \text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)} < \varepsilon_{gap}
$$

Requires an upper bound to be available (statistical or deterministic).

### Simulation-Based Stopping (Recommended)

The most robust criterion combines bound stability with policy stability. Periodically (e.g., every 20 iterations), the rule:

1. **Checks bound stability**:

   $$
   \text{Bound stable} \iff \left|\underline{z}^k - \underline{z}^{k-w}\right| < \varepsilon_{bound} \times \max(1, |\underline{z}^k|)
   $$

2. **If stable**, runs a batch of Monte Carlo simulations and computes the normalized distance between the per-stage cost profiles of consecutive simulation batches:

   $$
   d = \sqrt{\sum_{t} \left( \frac{c_t^{new} - c_t^{old}}{\max(1, |c_t^{old}|)} \right)^2}
   $$

3. **Stops when both converge**:

   $$
   \text{STOP} \iff \text{Bound stable} \land d < \varepsilon_{policy}
   $$

This avoids premature termination from statistical noise and ensures the policy is genuinely stable, not just the bound.

## Termination Output

When the algorithm stops, the output reports which rule triggered, the final iteration count, the lower and upper bounds, and the optimality gap. This information supports post-hoc analysis of whether the policy is sufficiently converged or whether additional iterations would be beneficial.

## Related Topics

- [SDDP Theory](sddp-theory.md) — Overview of the algorithm and its bound structure
- [Forward and Backward Passes](forward-backward.md) — The iteration mechanics that produce bounds
- [Stopping Rules](stopping-rules.md) — Complete stopping rule formulas and configuration guidance
- [Stopping Rules (spec)](../specs/math/stopping-rules.md) — Full specification with configuration schemas and formulas
- [Upper Bound Evaluation (spec)](../specs/math/upper-bound-evaluation.md) — Deterministic upper bounds via inner approximation
