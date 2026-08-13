---
title: Upper Bound Evaluation
description: The statistical Monte-Carlo and exact deterministic upper-bound mechanisms, gap computation normalized on the lower bound, the sampled and census simulation estimators, and the reserved SIDP vertex-based inner approximation.
---

## Purpose

This spec defines Cobre's upper-bound mechanisms: the statistical Monte-Carlo and exact deterministic forward-pass estimators that supply the per-iteration training bound (sections 1–2), the gap computation that compares that bound against the lower bound from cuts (section 9), the post-training sampled and census simulation estimator (section 11), and the reserved vertex-based inner approximation (SIDP) target design (sections 3–8, 10). It complements the outer approximation (cuts) described in [SDDP Algorithm](/math/sddp-algorithm) by providing the convergence-certificate half of the bound pair.

For notation conventions (index sets, parameters, decision variables, dual variables), see [Notation Conventions](/overview/notation-conventions).

:::note[Symbol convention]
This spec uses $d$ for the discount factor. See [Discount Rate](/math/discount-rate).
:::

## 1 Overview of Upper-Bound Mechanisms

Standard SDDP produces only a **lower bound** $\underline{z}$ on the optimal cost, through the outer (cut) approximation. A convergence certificate additionally requires an **upper bound** $\bar{z}$, closing the gap

$$
\text{gap} = \max(0,\; \bar{z} - \underline{z})
$$

(section 9 gives the full per-iteration gap computation; [Stopping Rules](/math/stopping-rules), section 5, describes how the gap-based stopping rule consumes it).

Cobre computes this per-iteration upper bound via one of two forward-pass mechanisms, selected by the forward pass's sampling mode:

- **Statistical Monte-Carlo upper bound — implemented.** Under a sampled forward pass, the sample mean of the scenario costs gathered that iteration, together with a 95% confidence-interval half-width, estimates the expected cost under the policy. This is a **statistical** estimate: it carries genuine sampling error that narrows only as more scenarios are drawn.
- **Exact deterministic upper bound — implemented.** Under an enumerated forward pass, the probability-weighted expectation over every enumerated leaf path is the _exact_ expected cost under the policy, with no sampling error at all. See section 2.

A third mechanism — a vertex-based concave inner approximation of the cost-to-go function (**SIDP**) — is a **reserved, not-yet-implemented** target design, described in sections 3–8 (with its computational overhead in section 10). Once built, it would evaluate the upper bound independently of the forward pass's sampling mode.

:::note[Risk-averse objectives]
Both implemented mechanisms above are defined for the **expectation** objective: the exact bound sums cost weighted by leaf-path probability, and the statistical estimator's confidence interval assumes an unbiased sample mean of the risk-neutral expected cost. Neither is a valid upper bound on a risk-averse measure such as CVaR — see [Risk Measures](/math/risk-measures). The reserved inner approximation (sections 3–8) is designed to remain valid under any risk measure once implemented.
:::

This chapter also describes a distinct, later-phase estimator: the post-training out-of-sample **simulation** procedure (section 11), which reruns the trained policy on scenarios independent of the training tree, in a **sampled** and a **census** variant. That estimator is a diagnostic on the finished policy — it is not part of the per-iteration training loop the mechanisms above feed, and it is not consumed by any stopping rule.

## 2 Exact Deterministic Upper Bound

Under an **enumerated** forward pass — one that [visits every node of the policy graph deterministically](/math/policy-graphs) rather than sampling it — the forward pass evaluates every leaf path $\ell$ of the scenario tree exactly once. Let $P(\ell)$ be that leaf path's probability and

$$
C(\ell) = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t(\ell)
$$

its realized total discounted cost (see [Discount Rate](/math/discount-rate)). The exact upper bound is the probability-weighted expectation over the full enumeration:

$$
\bar{z}_{\text{exact}} = \sum_{\ell} P(\ell)\, C(\ell)
$$

Because the enumeration is exhaustive rather than sampled, $\bar{z}_{\text{exact}}$ is the exact expectation of total cost under the current policy — not an estimate of it. Its standard deviation and 95% confidence-interval half-width are consequently **identically zero**: a deduplicated enumeration carries no sampling distribution to estimate a spread over.

$\bar{z}_{\text{exact}}$ is defined for the **expectation** objective; see [Risk Measures](/math/risk-measures) for why a risk-averse measure changes this.

Contrast with the statistical mechanism (section 1): a sampled forward pass computes the same weighted-sum _form_ — sample weight $1/N$ per scenario — but that sum is a Monte Carlo estimator of the expectation, carrying genuine sampling error. Only the enumerated forward pass's weights (the true leaf-path probabilities) make the sum exact rather than an estimate.

This is the **training-phase**, per-iteration mechanism: it is evaluated once per training iteration and feeds the gap computation (section 9). It is distinct from the post-training out-of-sample simulation's census variant (section 11.4), which computes the same probability-weighted-sum form over an independently drawn simulation population, evaluated once after training completes.

## 3 Vertex-Based Inner Approximation

:::caution[Status: Reserved — Not Yet Implemented]
The vertex-based inner approximation (SIDP) described in this section through section 8 (Linearized Upper Bound LP) is a target design that has not been implemented; only the statistical and exact forward-pass mechanisms (sections 1–2) are available today. The methodology below is complete and valid on its own terms, independent of current support.
:::

The inner approximation $\bar{V}_t(x)$ would be constructed from **vertices** (visited state-value pairs):

$$
\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), (x^{(2)}, \bar{v}^{(2)}), \ldots, (x^{(n)}, \bar{v}^{(n)})\}
$$

where each vertex would store:

- $x^{(i)}$: State vector visited during forward passes
- $\bar{v}^{(i)}$: Upper bound on expected cost-to-go from that state (computed recursively)

## 4 Lipschitz Interpolation

:::caution[Status: Reserved — Not Yet Implemented]
Part of the reserved vertex-based inner-approximation (SIDP) target design introduced in section 3; retained here as a complete, valid methodology reference.
:::

For a new state $x$ not in $\mathcal{V}_t$, the upper bound would be computed via Lipschitz interpolation:

$$
\bar{V}_t(x) = \min_{(x^{(i)}, \bar{v}^{(i)}) \in \mathcal{V}_t} \left\{ \bar{v}^{(i)} + L_t \cdot \|x - x^{(i)}\|_1 \right\}
$$

where $L_t$ is the Lipschitz constant for stage $t$.

**Interpretation**: The upper bound at $x$ would be the minimum over all vertices of "vertex value plus distance penalty." This forms a concave piecewise-linear function — the inner (concave) counterpart to the outer (convex) cut approximation.

## 5 Lipschitz Constant Computation

:::caution[Status: Reserved — Not Yet Implemented]
Part of the reserved vertex-based inner-approximation (SIDP) target design introduced in section 3; retained here as a complete, valid methodology reference.
:::

The Lipschitz constant would bound the maximum rate of change of the value function with respect to the state. For SDDP with penalty-based feasibility (relatively complete recourse):

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
The discount factor $d$ appears in the Lipschitz accumulation because the future cost would be discounted. Without discounting ($d = 1$), $L_t$ would grow linearly with the remaining horizon.
:::

**Example**: With deficit penalty $1000$ \$/MWh over 5 stages, no discounting:

| Stage $t$ | Lipschitz $L_t$ |
| --------- | --------------- |
| 5         | 1,000           |
| 4         | 2,000           |
| 3         | 3,000           |
| 2         | 4,000           |
| 1         | 5,000           |

## 6 Vertex Value Computation

:::caution[Status: Reserved — Not Yet Implemented]
Part of the reserved vertex-based inner-approximation (SIDP) target design introduced in section 3; retained here as a complete, valid methodology reference.
:::

During the upper bound evaluation pass (a backward pass variant), vertex values would be computed as follows.

**At terminal stage $T$**:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_T}\left[c_T(x^{(i)}, \omega_T)\right] \quad \text{(expected immediate cost only)}
$$

**At stage $t < T$**:

For each vertex $(x^{(i)}, \cdot) \in \mathcal{V}_t$:

1. For each scenario $\omega_t$, the stage subproblem would be solved with incoming state $x^{(i)}$ and realization $\omega_t$
2. The optimal next-stage state $x_{t+1}^*(\omega_t)$ would be obtained
3. The inner approximation at the next stage would be evaluated: $\bar{\theta}(\omega_t) = \bar{V}_{t+1}(x_{t+1}^*(\omega_t))$
4. The vertex value would be set as the expected discounted cost-to-go:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_t}\left[c_t(x^{(i)}, \omega_t) + d_{t \to t+1} \cdot \bar{\theta}(\omega_t)\right]
$$

:::note[Expectation]
The vertex value would be an expectation over scenarios, not a single-scenario value — paralleling the backward pass for cuts, which also computes expected cost-to-go.
:::

## 7 Upper Bound Evaluation LP

:::caution[Status: Reserved — Not Yet Implemented]
Part of the reserved vertex-based inner-approximation (SIDP) target design introduced in section 3; retained here as a complete, valid methodology reference.
:::

For policy evaluation with the inner approximation, the stage LP would replace the outer approximation (cut constraints on $\theta$) with the inner approximation (vertex constraints on $\bar{\theta}$).

**Standard LP (outer approximation — lower bound; this part is implemented today)**:

$$
\min \; c_t^\top x_t + d_{t \to t+1} \cdot \theta
$$

$$
\text{s.t. } \theta \geq \alpha_k + \pi_k^\top x_t \quad \forall k \text{ (cuts)}
$$

**Inner approximation LP (upper bound; reserved)**:

$$
\min \; c_t^\top x_t + d_{t \to t+1} \cdot \bar{\theta}
$$

$$
\text{s.t. } \bar{\theta} \leq \bar{v}^{(i)} + L_t \sum_j |x_{t,j} - x_j^{(i)}| \quad \forall i \in \mathcal{V}_t \text{ (vertices)}
$$

:::note[Direction]
Cut constraints are **lower bounds** on $\theta$ ($\theta \geq \ldots$). Vertex constraints would be **upper bounds** on $\bar{\theta}$ ($\bar{\theta} \leq \ldots$). The cut approximation is convex (piecewise-linear from below); the vertex approximation would be concave (piecewise-linear from above).
:::

## 8 Linearized Upper Bound LP

:::caution[Status: Reserved — Not Yet Implemented]
Part of the reserved vertex-based inner-approximation (SIDP) target design introduced in section 3; retained here as a complete, valid methodology reference.
:::

The absolute value $|x_j - x_j^{(i)}|$ in the vertex constraints would be linearized using standard splitting:

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

## 9 Gap Computation

At each training iteration $k$, the current lower and upper bounds are evaluated at stage 1's fixed initial state $\hat{x}_1$.

**Lower bound** (from cuts, the outer approximation):

$$
\underline{z}^k = c_1(\hat{x}_1) + d_{1 \to 2} \cdot \underline{V}_2(\hat{x}_1)
$$

**Upper bound** (from whichever forward-pass mechanism is active, section 1): under a sampled forward pass, $\bar{z}^k$ is the statistical estimator's sample mean; under an enumerated forward pass, $\bar{z}^k = \bar{z}_{\text{exact}}$ (section 2).

**Gap**:

$$
\text{gap}^k = \max\bigl(0,\; \bar{z}^k - \underline{z}^k\bigr)
$$

Under the exact mechanism specifically, this is $\text{gap}^k = \max(0,\; \bar{z}_{\text{exact}} - \underline{z}^k)$. The clamp absorbs floating-point noise once the gap has closed to (numerically) zero; in exact arithmetic $\bar{z}^k \geq \underline{z}^k$ always holds.

**Relative gap**:

$$
\frac{\text{gap}^k}{\max(1,\, |\underline{z}^k|)} \times 100\%
$$

normalized by the **lower** bound, floored at $1$ so the ratio stays bounded as $\underline{z}^k \to 0$ — never by the upper bound.

**Convergence**: As $k \to \infty$, $\text{gap}^k \to 0$ for convex problems with finitely many scenarios, provided the upper bound is exact. Under a sampled forward pass, $\bar{z}^k$ carries sampling error, so a small reported gap reflects that noise as well as genuine convergence.

:::note[Reserved mechanism]
Under the reserved vertex-based inner approximation (sections 3–8), stage 1's upper bound would instead be $\bar{z}^k = c_1(\hat{x}_1) + d_{1 \to 2} \cdot \bar{V}_2(\hat{x}_1)$ — the inner approximation evaluated at the fixed initial state. The gap formula above is agnostic to which mechanism supplies $\bar{z}^k$.
:::

For stopping rules that use the gap, see [Stopping Rules](/math/stopping-rules), section 5.

## 10 Computational Considerations

:::caution[Status: Reserved — Not Yet Implemented]
The overhead considerations below apply only if the reserved vertex-based inner approximation (section 3) were implemented; they describe that mechanism's cost profile, not any upper-bound mechanism active today.
:::

| Aspect                   | Impact                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| **Vertices per stage**   | Typically $\mathcal{O}(\text{iterations} \times \text{forward\_passes})$ |
| **LP size increase**     | $2 \times n_{state} \times n_{vertices}$ additional variables            |
| **Evaluation frequency** | Trade-off between gap accuracy and runtime                               |
| **Memory**               | Vertices stored separately from cuts                                     |

**Recommendation**: A reasonable operating point would enable upper bound evaluation every 5-10 iterations after an initial burn-in period (10+ iterations), trading convergence-monitoring frequency against overhead.

## 11 Simulation-Phase Upper Bound Estimator

Cobre can also estimate an upper bound on expected total cost by running the trained policy on scenarios drawn independently of the training tree — a separate, post-training procedure distinct from the per-iteration training-phase mechanisms in sections 1–2. It supports two variants: a **sampled** estimator (Monte Carlo; sections 11.2–11.3) over an independently drawn scenario sample, and a **census** estimator (section 11.4) over an exhaustively enumerated population of scenarios.

### 11.1 Independence from Training

The core methodological guarantee is that the noise used for the simulation forward pass is drawn independently of the noise used during training. Training forward passes sample from the opening tree (see [Scenario Generation](/math/scenario-generation)) to build the scenario tree that drives cut generation; any cost computed by re-running the policy on those same training scenarios would produce a **biased** estimator — the cuts were shaped to be tight at those states. The out-of-sample simulation avoids this by drawing a fresh set of $N$ scenarios from the same opening tree via a separate seed. Because cuts have no dependence on these independent draws, the resulting cost sample is an unbiased estimator of the true expected cost under the current policy.

:::note[Risk-averse caveat]
The unbiasedness guarantee applies to the expected-cost estimator under risk-neutral evaluation. For risk-averse objectives, this out-of-sample cost distribution does not itself certify a bound on the risk measure — only the reserved vertex-based inner approximation (sections 3–8) is designed to provide that guarantee, once implemented. See [Risk Measures](/math/risk-measures).
:::

### 11.2 Sampled Estimator (Monte Carlo)

The sampled variant executes a complete forward pass for each of the $N$ independently drawn scenarios, recording the total discounted cost $C_i$ for scenario $i$:

$$
C_i = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(i)}
$$

where $c_t^{(i)}$ is the immediate cost at stage $t$ of scenario $i$, and $d_{1 \to t}$ is the cumulative discount factor from stage 1 to stage $t$ (see [Discount Rate](/math/discount-rate)).

The **sample mean** is the Monte Carlo estimator of expected total cost:

$$
\bar{C} = \frac{1}{N} \sum_{i=1}^{N} C_i
$$

This estimator is **unbiased** under independent draws: $\mathbb{E}[\bar{C}] = \mathbb{E}[C]$. The **sample standard deviation** is:

$$
\sigma_C = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N} (C_i - \bar{C})^2}
$$

the Bessel-corrected estimator appropriate to a drawn sample. For the census variant's population-level counterpart, see section 11.4.

### 11.3 Confidence Interval

Under the normal approximation, the 95% confidence interval for $\mathbb{E}[C]$ has half-width:

$$
\Delta_{95} = 1.96 \cdot \frac{\sigma_C}{\sqrt{N}}
$$

The approximation is reliable once $N$ is large enough for the central-limit-theorem regime to apply. The reported interval is $[\bar{C} - \Delta_{95},\; \bar{C} + \Delta_{95}]$.

**Trade-off**: every doubling of $N$ narrows the confidence interval by a factor of $\sqrt{2}$, but costs proportionally more LP solves — the per-check cost scales with $N$ times the horizon length. Because the half-width shrinks as $\sigma_C / \sqrt{N}$, a sufficiently large scenario count resolves the interval finely enough to distinguish a converged policy from one still improving.

This confidence interval applies to the **sampled** variant only. The census variant (section 11.4) reports the exact mean and population variance of an exhaustively enumerated population — there is no sampling error left to bound, so it carries no confidence interval.

### 11.4 Census Estimator

When the out-of-sample scenarios come from an exhaustive enumeration rather than a sample — a **declared census** — the per-scenario weight $w_i$ is that scenario's leaf-path probability rather than a uniform sample weight, and the weights sum to one: $\sum_i w_i = 1$.

The census **weighted mean** replaces the sample mean:

$$
\bar{C} = \sum_i w_i\, C_i
$$

and the census **weighted standard deviation** is the **true weighted population variance** — no Bessel correction:

$$
\sigma_C = \sqrt{\sum_i w_i\,(C_i - \bar{C})^2}
$$

The population form omits the sampled variant's $N/(N-1)$ correction because a census is exhaustive, not sampled: $C_i$ ranges over the entire population of scenarios rather than a draw from it, so there is no downward bias in the naive variance to correct for.

Because the population is fully enumerated rather than estimated from a draw, the census estimator carries **no confidence interval** — $\bar{C}$ and $\sigma_C$ are exact statistics of the enumerated population, not estimates of an unknown expectation.

:::note[Boundary with the training-phase exact bound]
This census weighted mean shares its $\sum_i w_i C_i$ form with the training-phase exact upper bound (section 2, $\sum_\ell P(\ell)\, C(\ell)$) — both are probability-weighted sums over an exhaustive enumeration. They are nonetheless distinct: section 2's exact bound is evaluated once per training iteration, over the training tree, to feed the gap (section 9); this census estimator is evaluated once, after training, over an independently drawn out-of-sample population, to report the policy's out-of-sample cost distribution. Neither feeds the other.
:::

### 11.5 Number of Simulation Scenarios

The sole knob governing the out-of-sample procedure — sampled or census — is the number of simulation scenarios $N$. It controls the statistical resolution of the sampled estimator and the compute cost of the procedure simultaneously.

Raising $N$ narrows the sampled confidence interval as $1/\sqrt{N}$, while the compute cost — proportional to $N$ times the horizon length in LP solves — grows linearly in $N$, so the scenario count trades statistical resolution directly against compute. Under the census variant, $N$ is instead fixed by the size of the declared enumeration rather than chosen for statistical resolution, since there is no confidence interval to narrow.

### 11.6 Relation to Training-Phase Bounds

This out-of-sample simulation estimator is independent of the training loop: it is not consumed by any stopping rule and does not gate training termination. Training termination is governed by the gap-based stopping rule (see [Stopping Rules](/math/stopping-rules), section 5), which compares the training-phase upper bound — the statistical or exact forward-pass estimator, sections 1–2 — against the lower bound at every iteration, using the training tree rather than an independent out-of-sample population.

This section's estimator instead reports the trained policy's out-of-sample cost distribution once training has finished: the sampled mean/standard-deviation/confidence-interval (sections 11.2–11.3), or the census weighted mean/population variance (section 11.4). See [Running Cobre → Convergence & Diagnostics](/running/interpreting-results/) for how this output is consumed operationally.

:::note[Boundary]
This chapter owns the methodology of both the training-phase forward-pass bound (sections 1–2) and the post-training simulation estimator (this section); the scenario seed derivation and the distribution of scenarios across compute resources are implementation detail outside this chapter's scope.
:::

## 12 Cyclic Mode

:::caution[Status: Reserved — Not Yet Implemented]
The cyclic policy-graph shape this section describes is **reserved**,
independently of this chapter's own not-implemented status above: Cobre's
policy graph is finite-horizon only, and supplying `cyclic` as the policy
graph type is rejected at load with a named error. See
[Horizon Modes](/math/horizon-modes) for the reserved cyclic target design.
:::

For the reserved cyclic policy graphs design (see [Horizon Modes](/math/horizon-modes)), the inner approximation would operate on the same seasonal cut-pool structure: vertices organized by season $\tau$, not by absolute stage ID. The Lipschitz constant would need to account for the cumulative discount around the cycle, which bounds the geometric series of future contributions.

The convergence guarantee would still hold: with $d_{cycle} < 1$, both the outer (cut) and inner (vertex) approximations would converge to the true value function at the fixed point.

## 13 References

> Costa, B.F.P., & Leclère, V. (2023). "Duality of upper bounds in stochastic dynamic programming." _Optimization Online_. https://optimization-online.org/?p=23738

> Philpott, A.B., de Matos, V.L., & Finardi, E.C. (2013). "On solving multistage stochastic programs with coherent risk measures." _Operations Research_, 61(4), 957-970. https://doi.org/10.1287/opre.2013.1175

## Cross-References

- [SDDP Algorithm](/math/sddp-algorithm) — Core algorithm providing the outer approximation (lower bound) that this spec complements
- [Notation Conventions](/overview/notation-conventions) — Standard symbols for state variables, value functions, and cost-to-go
- [Discount Rate](/math/discount-rate) — Discount factor $d$ used in the exact bound's discounted cost (section 2), the reserved vertex value computation (section 6), and the reserved Lipschitz accumulation (section 5)
- [Policy Graphs](/math/policy-graphs) — The enumerated-versus-sampled forward-pass distinction that selects between the statistical and exact upper-bound mechanisms (sections 1–2)
- [Horizon Modes](/math/horizon-modes) — The reserved cyclic policy-graph target design and the season-indexed pool structure section 12's reserved inner approximation would mirror
- [Cut Management](/math/cut-management) — Outer approximation cuts that provide the lower bound counterpart
- [Stopping Rules](/math/stopping-rules) — The gap-based stopping rule, which compares this chapter's training-phase upper bound (sections 1–2) against the lower bound (section 9)
- [Risk Measures](/math/risk-measures) — Risk-averse formulations for which neither implemented upper-bound mechanism is valid; the reserved inner approximation (sections 3–8) is designed to remain valid under any risk measure
- [Scenario Generation](/math/scenario-generation) — Opening-tree definition from which the out-of-sample simulation (section 11) draws independent scenarios
- **Running Cobre:** [Convergence & Diagnostics](/running/interpreting-results/) — the software guide for reading and assessing this estimator's output.
