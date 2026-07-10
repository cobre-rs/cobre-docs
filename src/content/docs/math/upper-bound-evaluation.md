---
title: Upper Bound Evaluation
description: Inner approximation via SIDP — vertex-based value function approximation, Lipschitz interpolation, the linearized upper bound LP, gap computation, out-of-sample simulation, and configuration.
---

:::caution[Status: Not Implemented]
This spec describes a planned design that has not yet been implemented.
:::

## Purpose

This spec defines the upper bound evaluation mechanism in Cobre via inner approximation (SIDP): the vertex-based value function approximation, Lipschitz interpolation, the linearized upper bound LP, gap computation, and configuration. It complements the outer approximation (cuts) described in [SDDP Algorithm](/math/sddp-algorithm) by providing a convergence certificate through deterministic upper bounds.

For notation conventions (index sets, parameters, decision variables, dual variables), see [Notation Conventions](/overview/notation-conventions).

:::note[Symbol convention]
This spec uses $d$ for the discount factor. See [Discount Rate](/math/discount-rate).
:::

## 1 Motivation

Standard SDDP provides only a **lower bound** (outer approximation) through cuts. Convergence verification requires an **upper bound** (inner approximation). This is especially important for:

1. **Risk-averse problems**: CVaR objectives cannot be reliably estimated via Monte Carlo simulation of the policy
2. **Convergence certificates**: Gap $= \bar{z} - \underline{z}$ provides a true optimality measure
3. **Conservative policies**: Inner approximation gives "at most $Y$" guarantees

:::note[Deterministic vs. simulation-based upper bounds]
The simulation-based stopping rules (see [Stopping Rules](/math/stopping-rules)) estimate an upper bound by running the SDDP policy on sampled scenarios and averaging costs. This is a **statistical** estimate — valid for risk-neutral problems but not for risk-averse (CVaR) objectives. The inner approximation described here provides a **deterministic** upper bound that is valid regardless of the risk measure.
:::

## 2 Vertex-Based Inner Approximation

The inner approximation $\bar{V}_t(x)$ is constructed from **vertices** (visited state-value pairs):

$$
\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), (x^{(2)}, \bar{v}^{(2)}), \ldots, (x^{(n)}, \bar{v}^{(n)})\}
$$

where each vertex stores:

- $x^{(i)}$: State vector visited during forward passes
- $\bar{v}^{(i)}$: Upper bound on expected cost-to-go from that state (computed recursively)

## 3 Lipschitz Interpolation

For a new state $x$ not in $\mathcal{V}_t$, the upper bound is computed via Lipschitz interpolation:

$$
\bar{V}_t(x) = \min_{(x^{(i)}, \bar{v}^{(i)}) \in \mathcal{V}_t} \left\{ \bar{v}^{(i)} + L_t \cdot \|x - x^{(i)}\|_1 \right\}
$$

where $L_t$ is the Lipschitz constant for stage $t$.

**Interpretation**: The upper bound at $x$ is the minimum over all vertices of "vertex value plus distance penalty." This forms a concave piecewise-linear function — the inner (concave) counterpart to the outer (convex) cut approximation.

## 4 Lipschitz Constant Computation

The Lipschitz constant bounds the maximum rate of change of the value function with respect to the state. For SDDP with penalty-based feasibility (relatively complete recourse):

**Backward accumulation**:

$$
L_T = c_{max}^{penalty}
$$

$$
L_t = d_{t \to t+1} \cdot L_{t+1} + c_{max}^{penalty,t}
$$

where:

- $c_{max}^{penalty,t}$ is the maximum penalty coefficient at stage $t$ (e.g., deficit penalty in \$/MWh)
- $d_{t \to t+1}$ is the discount factor for transition $t \to t+1$ (see [Discount Rate](/math/discount-rate))

:::note[Note]
The discount factor $d$ appears in the Lipschitz accumulation because the future cost is discounted. Without discounting ($d = 1$), $L_t$ grows linearly with the remaining horizon.
:::

**Example**: With deficit penalty $1000$ \$/MWh over 5 stages, no discounting:

| Stage $t$ | Lipschitz $L_t$ |
| --------- | --------------- |
| 5         | 1,000           |
| 4         | 2,000           |
| 3         | 3,000           |
| 2         | 4,000           |
| 1         | 5,000           |

## 5 Vertex Value Computation

During the upper bound evaluation pass (a backward pass variant):

**At terminal stage $T$**:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_T}\left[c_T(x^{(i)}, \omega_T)\right] \quad \text{(expected immediate cost only)}
$$

**At stage $t < T$**:

For each vertex $(x^{(i)}, \cdot) \in \mathcal{V}_t$:

1. For each scenario $\omega_t$, solve the stage subproblem with incoming state $x^{(i)}$ and realization $\omega_t$
2. Obtain the optimal next-stage state $x_{t+1}^*(\omega_t)$
3. Evaluate the inner approximation at the next stage: $\bar{\theta}(\omega_t) = \bar{V}_{t+1}(x_{t+1}^*(\omega_t))$
4. Set vertex value as the expected discounted cost-to-go:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_t}\left[c_t(x^{(i)}, \omega_t) + d_{t \to t+1} \cdot \bar{\theta}(\omega_t)\right]
$$

:::note[Expectation]
The vertex value is an expectation over scenarios, not a single-scenario value. This parallels the backward pass for cuts, which also computes expected cost-to-go.
:::

## 6 Upper Bound Evaluation LP

For policy evaluation with inner approximation, the stage LP replaces the outer approximation (cut constraints on $\theta$) with inner approximation (vertex constraints on $\bar{\theta}$).

**Standard LP (outer approximation — lower bound)**:

$$
\min \; c_t^\top x_t + d_{t \to t+1} \cdot \theta
$$

$$
\text{s.t. } \theta \geq \alpha_k + \pi_k^\top x_t \quad \forall k \text{ (cuts)}
$$

**Inner approximation LP (upper bound)**:

$$
\min \; c_t^\top x_t + d_{t \to t+1} \cdot \bar{\theta}
$$

$$
\text{s.t. } \bar{\theta} \leq \bar{v}^{(i)} + L_t \sum_j |x_{t,j} - x_j^{(i)}| \quad \forall i \in \mathcal{V}_t \text{ (vertices)}
$$

:::note[Direction]
Cut constraints are **lower bounds** on $\theta$ ($\theta \geq \ldots$). Vertex constraints are **upper bounds** on $\bar{\theta}$ ($\bar{\theta} \leq \ldots$). The cut approximation is convex (piecewise-linear from below); the vertex approximation is concave (piecewise-linear from above).
:::

## 7 Linearized Upper Bound LP

The absolute value $|x_j - x_j^{(i)}|$ in the vertex constraints is linearized using standard splitting:

$$
|x_j - x_j^{(i)}| = u_j^{(i)+} + u_j^{(i)-}
$$

$$
x_j - x_j^{(i)} = u_j^{(i)+} - u_j^{(i)-}
$$

$$
u_j^{(i)+}, u_j^{(i)-} \geq 0
$$

**Additional variables** (per vertex $i$, per state component $j$):

| Variable       | Domain   | Description                                         |
| -------------- | -------- | --------------------------------------------------- |
| $u_j^{(i)+}$   | $\geq 0$ | Positive deviation from vertex $i$ in dimension $j$ |
| $u_j^{(i)-}$   | $\geq 0$ | Negative deviation from vertex $i$ in dimension $j$ |
| $\bar{\theta}$ | free     | Upper bound on future cost                          |

**Constraints** (for each vertex $i \in \mathcal{V}_t$):

$$
\bar{\theta} \leq \bar{v}^{(i)} + L_t \sum_j (u_j^{(i)+} + u_j^{(i)-})
$$

$$
x_j - x_j^{(i)} = u_j^{(i)+} - u_j^{(i)-} \quad \forall j
$$

## 8 Gap Computation

At each iteration $k$ where the upper bound is evaluated:

**Lower bound** (from cuts at stage 1):

$$
\underline{z}^k = c_1(\hat{x}_1) + d_{1 \to 2} \cdot \underline{V}_2(\hat{x}_1)
$$

**Upper bound** (from vertices at stage 1):

$$
\bar{z}^k = c_1(\hat{x}_1) + d_{1 \to 2} \cdot \bar{V}_2(\hat{x}_1)
$$

**Relative gap**:

$$
\text{gap}^k = \frac{\bar{z}^k - \underline{z}^k}{\max(1, |\bar{z}^k|)} \times 100\%
$$

**Convergence**: As $k \to \infty$, $\text{gap}^k \to 0$ for convex problems with finitely many scenarios.

For stopping rules that use the gap, see [Stopping Rules](/math/stopping-rules).

## 9 Computational Considerations

| Aspect                   | Impact                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| **Vertices per stage**   | Typically $\mathcal{O}(\text{iterations} \times \text{forward\_passes})$ |
| **LP size increase**     | $2 \times n_{state} \times n_{vertices}$ additional variables            |
| **Evaluation frequency** | Trade-off between gap accuracy and runtime                               |
| **Memory**               | Vertices stored separately from cuts                                     |

**Recommendation**: Enable upper bound evaluation every 5-10 iterations after an initial burn-in period (10+ iterations) for convergence monitoring without excessive overhead.

## 10 Out-of-Sample Simulation Procedure

Cobre can also estimate an upper bound on expected total cost by running the trained policy on scenarios drawn independently of the training tree. This procedure produces a **statistical** upper-bound estimate; for the deterministic upper bound applicable to risk-averse policies, see sections 2–9 of this chapter.

### 10.1 Independence from Training

The core methodological guarantee is that the noise used for the simulation forward pass is drawn independently of the noise used during training. Training forward passes sample from the opening tree (see [Scenario Generation](/math/scenario-generation)) to build the scenario tree that drives cut generation; any cost computed by re-running the policy on those same training scenarios would produce a **biased** estimator — the cuts were shaped to be tight at those states. The out-of-sample simulation avoids this by drawing a fresh set of $N$ independent noise realizations from the same opening tree via a separate seed. Because cuts have no dependence on these independent draws, the resulting cost sample is an unbiased estimator of the true expected cost under the current policy.

:::note[Risk-averse caveat]
The unbiasedness guarantee applies to the expected-cost estimator under risk-neutral evaluation. For risk-averse objectives, the Monte Carlo CVaR estimator is not a valid upper bound on the risk measure — only the deterministic inner approximation (sections 2–9) provides that guarantee. See [Risk Measures](/math/risk-measures).
:::

### 10.2 Monte Carlo Estimator

The simulation executes a complete forward pass for each of the $N$ independent replications, recording the total discounted cost $C_i$ for scenario $i$:

$$
C_i = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(i)}
$$

where $c_t^{(i)}$ is the immediate cost at stage $t$ of replication $i$, and $d_{1 \to t}$ is the cumulative discount factor from stage 1 to stage $t$ (see [Discount Rate](/math/discount-rate)).

The **sample mean** is the Monte Carlo estimator of expected total cost:

$$
\bar{C} = \frac{1}{N} \sum_{i=1}^{N} C_i
$$

This estimator is **unbiased** under independent draws: $\mathbb{E}[\bar{C}] = \mathbb{E}[C]$. The **sample standard deviation** is:

$$
\sigma_C = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N} (C_i - \bar{C})^2}
$$

In addition to mean and standard deviation, the simulation computes the Conditional Value-at-Risk at a specified confidence level $\alpha$ from the sorted scenario costs. For the CVaR estimator and its interpretation under risk-averse policies, see [Risk Measures](/math/risk-measures).

### 10.3 Confidence Interval

Under the normal approximation, the 95% confidence interval for $\mathbb{E}[C]$ has half-width:

$$
\Delta_{95} = 1.96 \cdot \frac{\sigma_C}{\sqrt{N}}
$$

The approximation is reliable when $N \geq 20$ (central-limit-theorem regime). The reported interval is $[\bar{C} - \Delta_{95},\; \bar{C} + \Delta_{95}]$.

**Trade-off**: every doubling of $N$ narrows the confidence interval by a factor of $\sqrt{2}$, but costs proportionally more LP solves — $N \times T$ stage subproblems per simulation check. Because the half-width shrinks as $\sigma_C / \sqrt{N}$, a sufficiently large replication count resolves the interval finely enough to distinguish a converged policy from one still improving.

### 10.4 Configurable Replication Count

The sole knob governing the out-of-sample procedure is the number of replications $N$ (the `replications` parameter of the `simulation` stopping rule). It controls the statistical resolution of the estimator and the compute cost of each stopping check simultaneously.

| $N$ | Confidence interval half-width | LP solves per check ($T = 120$) |
| --- | ------------------------------ | ------------------------------- |
| 20  | $\approx \sigma_C / 4.5$       | 2,400                           |
| 100 | $\approx \sigma_C / 10$        | 12,000                          |
| 500 | $\approx \sigma_C / 22$        | 60,000                          |

Raising $N$ narrows the interval as $1/\sqrt{N}$ while the per-check cost — $N \times T$ LP solves — grows linearly in $N$, so the replication count trades statistical resolution directly against compute per stopping check.

### 10.5 Interaction with the Simulation-Based Stopping Rule

The out-of-sample simulation described here is the per-iteration measurement on which the simulation-based stopping rule operates. Each time the stopping rule fires (every `period` iterations, when the outer-approximation bound is stable), one simulation check is executed, producing $\bar{C}$, $\sigma_C$, and $\Delta_{95}$ for the current iteration. The stopping rule then compares consecutive simulation estimates to test whether the policy has stabilized across iterations. The stopping criterion and the comparison metric are fully specified in [Stopping Rules](/math/stopping-rules) section 5; this chapter owns only the per-iteration estimator (mean, standard deviation, confidence interval) and delegates the convergence decision to that chapter.

:::note[Boundary]
This section owns the methodology of the per-iteration estimator; the scenario seed derivation, the distribution of replications across compute resources, and the per-stage cost comparison metric belong to the stopping-rule integration and are specified in [Stopping Rules](/math/stopping-rules) section 5.
:::

## 11 Cyclic Mode

For cyclic policy graphs (see [Horizon Modes](/math/horizon-modes)), the inner approximation operates on the same seasonal cut-pool structure: vertices are organized by season $\tau$, not by absolute stage ID. The Lipschitz constant must account for the cumulative discount around the cycle, which bounds the geometric series of future contributions.

The convergence guarantee still holds: with $d_{cycle} < 1$, both the outer (cut) and inner (vertex) approximations converge to the true value function at the fixed point.

## 12 References

> Costa, B.F.P., & Leclère, V. (2023). "Duality of upper bounds in stochastic dynamic programming." _Optimization Online_. https://optimization-online.org/?p=23738

> Philpott, A.B., de Matos, V.L., & Finardi, E.C. (2013). "On solving multistage stochastic programs with coherent risk measures." _Operations Research_, 61(4), 957-970. https://doi.org/10.1287/opre.2013.1175

## Cross-References

- [SDDP Algorithm](/math/sddp-algorithm) — Core algorithm providing the outer approximation (lower bound) that this spec complements
- [Notation Conventions](/overview/notation-conventions) — Standard symbols for state variables, value functions, and cost-to-go
- [Discount Rate](/math/discount-rate) — Discount factor $d$ used in vertex value computation (section 5) and Lipschitz accumulation (section 4)
- [Horizon Modes](/math/horizon-modes) — Cyclic policy graphs and the season-indexed pool structure that the inner approximation mirrors
- [Cut Management](/math/cut-management) — Outer approximation cuts that provide the lower bound counterpart
- [Stopping Rules](/math/stopping-rules) — Convergence criteria that use the gap between inner and outer approximations; simulation-based stopping rule that consumes the per-iteration out-of-sample estimator (section 10.5)
- [Risk Measures](/math/risk-measures) — CVaR objectives where deterministic upper bounds are essential; CVaR estimator validity under risk-averse policies (section 10.1)
- [Scenario Generation](/math/scenario-generation) — Opening-tree definition from which out-of-sample replications draw independent noise realizations (section 10.1)
- **Running Cobre:** [Convergence & Diagnostics](/running/interpreting-results/) — the software guide for reading and assessing this estimator's output.
