# Stopping Rules

## Overview

SDDP is an iterative algorithm with no fixed termination point: it can always run another iteration and tighten the future cost approximation. Stopping rules provide the criteria for deciding when the current policy is good enough to stop.

Good stopping criteria balance two risks. Stopping too early leaves a suboptimal policy; stopping too late wastes computation on marginal improvements. Because the lower bound and the upper bound (statistical or deterministic) approach the true optimum from opposite sides, monitoring both gives a robust termination signal.

## The Five Available Rules

Cobre provides five stopping criteria. Multiple rules can be combined: `"any"` mode (default) stops when the first rule triggers; `"all"` mode requires every rule to trigger simultaneously.

### 1. Iteration Limit (Mandatory)

A hard cap on the number of iterations:

$$
\text{STOP} \iff k \geq k_{max}
$$

where $k$ is the current iteration count and $k_{max}$ is the configured limit.

This rule must always be present. It acts as a safety bound preventing runaway computation if other rules fail to trigger. For production studies, $k_{max}$ is typically set high enough that convergence rules trigger first, but not so high that a non-converging run consumes unbounded resources.

### 2. Time Limit

A wall-clock budget:

$$
\text{STOP} \iff t_{elapsed} \geq t_{max}
$$

Checked at the end of each iteration. Useful in operational contexts where results must be available within a fixed window, regardless of convergence status.

### 3. Bound Stalling

Detects when the lower bound has plateaued — the outer approximation is no longer improving despite additional iterations. The rule computes the relative improvement of the deterministic lower bound $\underline{z}^k$ over a sliding window of $\tau$ iterations:

$$
\Delta_k = \frac{\underline{z}^k - \underline{z}^{k-\tau}}{\max(1, |\underline{z}^k|)}
$$

$$
\text{STOP} \iff |\Delta_k| < \varepsilon_{stall}
$$

where $\varepsilon_{stall}$ is the relative tolerance (typically 0.01%). The window size $\tau$ controls sensitivity: a small window detects stalling faster but is more susceptible to transient plateaus; a larger window is more robust.

The intuition: if the LP approximation of future costs has not improved appreciably over the last $\tau$ iterations, the current cuts already provide a tight lower bound and further iteration is unlikely to change the dispatch policy.

### 4. Gap Convergence

When both a lower bound $\underline{z}^k$ and an upper bound $\bar{z}^k$ are available, their gap directly measures how far the current policy may be from optimal:

$$
\text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)}
$$

$$
\text{STOP} \iff \text{gap}^k < \varepsilon_{gap}
$$

The upper bound $\bar{z}^k$ can be the Monte Carlo average of forward pass costs (statistical, valid for risk-neutral problems) or the inner approximation via Lipschitz interpolation (deterministic, valid for all risk measures). A tight gap provides a verifiable certificate of near-optimality.

### 5. Simulation-Based Stopping (Recommended)

The most robust criterion combines two convergence indicators: stability of the outer approximation (bound) and stability of the policy itself (simulated cost profile). The rule executes in two steps, checked every `period` iterations:

**Step 1 — Bound stability check**:

$$
\text{Bound stable} \iff \left| \underline{z}^k - \underline{z}^{k-w} \right| < \varepsilon_{bound} \times \max(1, |\underline{z}^k|)
$$

where $w$ is the bound window (number of past iterations to compare against).

**Step 2 — Policy stability check** (only if bound is stable): Run `replications` Monte Carlo forward simulations under the current policy. Compute the mean per-stage cost $c_t$ across replications and compare to the previous simulation batch:

$$
d = \sqrt{\sum_{t=1}^{T} \left( \frac{c_t^{new} - c_t^{old}}{\max(1, |c_t^{old}|)} \right)^2}
$$

**Stopping condition**:

$$
\text{STOP} \iff \text{Bound stable} \land d < \varepsilon_{policy}
$$

This criterion requires both the bound and the simulated policy costs to have converged. The two-step design avoids premature termination: a temporarily stable bound might coincide with a policy that still changes significantly across iterations, and vice versa.

**Why this rule is recommended**: The bound monitors convergence of the mathematical approximation; the simulation monitors convergence of the economic dispatch decisions. Requiring both to stabilize ensures the solution is practically meaningful, not just numerically tight.

## Combining Rules

A typical conservative setup uses an iteration limit as a hard cap with simulation-based stopping as the primary convergence criterion:

- Iteration limit: 500 (hard safety cap)
- Simulation-based stopping: every 20 iterations, 100 replications, 1% policy tolerance
- Mode: `"any"` (stop when either triggers)

The iteration limit ensures termination even if the simulation criterion never triggers (e.g., due to high variance). In practice, well-tuned simulation criteria typically trigger well before the iteration limit.

## Termination Output

When any stopping rule triggers, the solver records which rule terminated the run, the final iteration count, the lower bound, the upper bound (if evaluated), and the optimality gap. This information is important for post-hoc analysis: a run terminated by the iteration limit before the simulation criterion converged may warrant rerunning with a higher limit.

## Further Reading

- [Convergence](convergence.md) — how bounds are computed and the gap is interpreted
- [SDDP Theory](sddp-theory.md) — the iteration structure that stopping rules monitor
- [Stopping Rules (spec)](../specs/math/stopping-rules.md) — complete formal specification with configuration schemas
- [Upper Bound Evaluation (spec)](../specs/math/upper-bound-evaluation.md) — deterministic upper bounds via inner approximation
