# Horizon Modes

## Purpose

The **horizon mode** is the global topology of the policy graph for a Cobre
run. It determines whether the stage graph is an acyclic chain with a known
terminal condition or a cycle whose value functions must stabilise across
repeated traversals. Because the topology applies uniformly to every stage, a
single mode governs the entire run; the choice is declared in the case
configuration via the policy graph type field.

Cobre supports two modes: **Finite** (acyclic) and **Cyclic**
(infinite-periodic). This chapter describes the methodology meaning of each
mode, the guarantee it carries, and the trade-offs that guide the choice
between them.

Section 2 introduces the cyclic mode at the idea / guarantee / knob /
trade-off level; section 3 gives its formal mathematical structure (the
season function, the cycle convergence inequality, the season-indexed
cut pool, and the fixed-point Bellman operator); section 4 covers
forward-pass termination; section 5 covers mode selection. The
mechanics of the per-transition discount factor and its role in the
cycle convergence requirement belong to
[Discount-Rate Handling](./discount-rate.md).

## 1. Finite (Acyclic) Mode

**Idea.** The stage graph is a linear chain: stage 1 leads to stage 2, which
leads to stage 3, and so on up to stage T. The chain has a definite end. The
terminal value function is zero — no water left in storage at stage T+1 has any
value in the model.

**Guarantee.** Because the chain is acyclic, every stage is visited exactly
once per forward or backward pass. The algorithm terminates naturally when it
reaches the terminal stage. There is no cycle to traverse and no convergence
criterion tied to cycle stability. Each stage accumulates its own independent
cut pool; a cut generated at stage t is valid only for stage t, so there are T
independent pools for a T-stage study.

**Knob.** The case configuration declares the policy graph type as finite. The
number of stages T is the length of the chain.

**Trade-off.** Finite mode is appropriate when the study has a bounded horizon
and the modeller can accept the terminal condition. For short-to-medium
planning horizons — say, a one- to five-year operational study — the end-of-chain
effect is a manageable modelling assumption, and the simplicity of acyclic
traversal makes the algorithm straightforward to interpret and debug. The
limitation is that reservoir storage near the terminal stage is systematically
undervalued: the zero terminal condition gives the optimiser an incentive to
empty reservoirs before stage T, producing an artefact known as the
end-of-world effect. When that artefact would distort the policy, cyclic mode
is the better choice.

## 2. Cyclic (Infinite-Periodic) Mode

**Idea.** The stage graph contains a back-edge that returns from the last stage
of a cycle to the first stage of the next repetition, forming a closed loop.
There is no terminal stage; instead, the policy is required to be self-consistent
across cycle repetitions. Cut pools are organised by season — the position of a
stage within one cycle — rather than by absolute stage identity. A single
cycle's worth of seasonal cut pools represents the entire infinite horizon.

**Guarantee.** Convergence of the cyclic mode rests on the cumulative discount
factor around one full cycle falling strictly below one. When that condition
holds, contributions from distant future cycles become negligible, and the value
functions at each season stabilise across iterations. The formal statement of
this guarantee — the convergence inequality, the season function, the
cut-sharing equation, and the fixed-point Bellman operator — is given in
section 3.

**Knob.** The case configuration declares the policy graph type as cyclic and
supplies an annual discount rate. The discount rate, together with each
transition's duration, determines the per-transition factor; the product of
factors around one cycle must be strictly below one. See
[Discount-Rate Handling](./discount-rate.md) for the conversion mechanics.

**Trade-off.** Cyclic mode eliminates the end-of-world effect by representing
the planning problem as an ongoing, perpetually recurring operation. It is the
natural choice for long-term planning studies where a finite terminal condition
would produce misleading near-terminal policies. The cost is additional
complexity: the modeller must supply a discount rate, the algorithm must verify
cycle convergence, and the forward pass requires explicit termination logic
rather than a natural chain endpoint. Section 3 formalises the convergence
requirement; section 4 describes the forward-pass termination rules.

## 3. Cyclic Mode — Mathematical Detail

This section gives the formal structure that section 2 summarised in prose:
the season function, the cycle convergence inequality, the season-indexed cut
pool with its cut-sharing equation, the fixed-point Bellman interpretation,
and the convergence criterion that the algorithm checks across consecutive
cycles.

### Season Function

For a cycle of length $P$ stages (for example, twelve monthly stages making
a calendar year), the **season** of stage $t$ is its position within one
cycle:

$$
\tau(t) \;=\; (t - 1) \bmod P + 1 \;\in\; \{1, 2, \ldots, P\}.
$$

Two stages with the same season share the structural properties of the cycle
at that position: demand pattern, inflow statistics, block definitions, and
stochastic-process parameters. The cycle is the unit that repeats; the season
is the position within it.

### Cycle Convergence Inequality

For the value function to remain finite across infinite repetitions, the
cumulative discount around one full cycle must be strictly below one:

$$
d_{\text{cycle}} \;=\; \prod_{t \in \text{cycle}} d_{t \to t+1} \;<\; 1.
$$

This guarantees that the geometric series of cycle contributions converges,

$$
\lim_{n \to \infty} d_{\text{cycle}}^{\,n} \cdot V_t(x) \;=\; 0,
$$

so contributions from far-future cycles become negligible. A cyclic policy
graph whose per-transition factors fail this inequality is rejected at
validation. See [Discount-Rate Handling](./discount-rate.md) for the
conversion from the annual rate to the per-transition factors.

### Season-Indexed Cut Pool

Let $\mathcal{C}_\tau = \{\,t : \tau(t) = \tau\,\}$ denote the set of all
stages occupying season $\tau$. A cut generated at any stage in
$\mathcal{C}_\tau$ is valid for every stage in $\mathcal{C}_\tau$, so the
cut pool is indexed by season rather than by absolute stage:

$$
\underline{V}_\tau(x) \;=\; \max_{k \in \mathcal{K}_\tau}
\bigl\{\, \alpha_k + \pi_k^{\top} x \,\bigr\}.
$$

A single cycle of $P$ pools therefore represents the entire infinite
horizon. The pool-organisation difference between finite and cyclic mode
reduces to: $T$ pools indexed by absolute stage versus $P$ pools indexed by
season.

### Fixed-Point Bellman Operator

The cyclic value function satisfies the seasonal Bellman recursion

$$
V_\tau \;=\; T_\tau\, V_{\tau + 1 \,(\bmod P)},
$$

where $T_\tau$ is the one-stage Bellman operator at season $\tau$:

$$
(T_\tau V)(x) \;=\; \mathbb{E}_{\omega_\tau}\!\left[\,
\min_{x'}\, \bigl\{ c_\tau(x', u) + d \cdot V(x') \bigr\}
\,\right].
$$

Cyclic SDDP computes the fixed point of this seasonal operator chain: the
policy is converged when the value function at every season is stable across
consecutive cycles.

### Cycle Convergence Criterion

The outer approximation has converged in cyclic mode when the lower bounds
at every season stabilise across consecutive cycles:

$$
\max_{\tau \in \{1, \ldots, P\}}
\bigl|\, \underline{z}^{\,k,\tau} - \underline{z}^{\,k - P,\tau} \,\bigr|
\;<\; \delta_{\text{cycle}},
$$

where the tolerance $\delta_{\text{cycle}}$ is a configured stopping
parameter. See [Stopping Rules](./stopping-rules.md) for the catalogue of
cyclic-mode stopping criteria.

## 4. Forward-Pass Termination in Cyclic Mode

In finite mode the forward pass ends when it reaches the terminal stage; no
explicit stopping rule is needed. In cyclic mode there is no terminal stage, so
the training loop applies two stopping conditions.

**Condition 1 — Cumulative-discount tolerance.** As the forward pass traverses
successive stages, a running product accumulates the per-transition discount
factors. When this cumulative product falls below a configurable
cumulative-discount tolerance, the remaining stages contribute so little to the
total trajectory cost that continuing would not meaningfully affect the policy.
The pass terminates at that point.

**Condition 2 — Maximum-stage safety bound.** A configurable maximum-stage
safety bound prevents unbounded traversal in pathological cases where the
cumulative discount shrinks slowly — for example, when the cycle discount is
valid but close to one. A typical bound corresponds to roughly twenty years of
monthly stages. If the cumulative-discount condition has not triggered by the
time the safety bound is reached, the pass terminates unconditionally.

The forward pass terminates when either condition is met, whichever comes first.
The discount mechanics underlying the cumulative-discount condition — the formula
relating the annual rate to the per-transition factor and the running product —
are described in [Discount-Rate Handling](./discount-rate.md).

## 5. Choosing Between Modes

The choice between finite and cyclic mode is a modelling decision about what
the study horizon represents.

**Choose finite mode when:**

- The study has a well-defined end date and the modeller can accept a zero
  terminal condition (or supplements it with imported boundary cuts — see
  [SDDP Algorithm](./sddp-algorithm.md) for the terminal boundary cut mechanism).
- The planning horizon is short enough that the end-of-world effect is
  negligible or acceptable.
- Interpretability and simplicity are priorities: acyclic traversal requires
  no discount rate, no cycle convergence check, and no forward-pass termination
  logic beyond reaching the last stage.

**Choose cyclic mode when:**

- The study represents an ongoing operation — long-term reservoir planning,
  multi-year dispatch, perpetual system operation — where imposing a terminal
  condition would produce systematically distorted near-terminal policies.
- The modeller has a meaningful annual discount rate that reflects the time
  value of future costs.
- The cut pool compression offered by season-indexed pools is desirable:
  instead of accumulating T independent pools, only P pools (one per season)
  are maintained regardless of how many cycle repetitions the forward pass
  traverses.

**Summary of trade-offs:**

| Property                    | Finite                          | Cyclic                              |
| --------------------------- | ------------------------------- | ----------------------------------- |
| Terminal condition          | V at T+1 = 0 (or imported cuts) | None; self-consistent across cycles |
| End-of-world effect         | Present near terminal stage     | Absent                              |
| Cut pools                   | T pools, one per stage          | P pools, one per season             |
| Discount rate requirement   | None                            | Required; must give cycle < 1       |
| Forward-pass stopping logic | Reaches terminal stage          | Two-condition explicit rule         |
| Mathematical complexity     | Lower                           | Higher                              |

The cut-generation mechanics that produce the cuts filling both pool
organisations are covered in [Cut Management](./cut-management.md). The
algorithm within which both modes operate is described in
[SDDP Algorithm](./sddp-algorithm.md).

## 6. Reference

> Costa, B.F.P., Calixto, A.O., Sousa, R.F.S., Figueiredo, R.T., Penna, D.D.J., Khenayfis, L.S., & Oliveira, A.M.R. (2025). "Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach." _Proceeding Series of the Brazilian Society of Computational and Applied Mathematics_, 11(1), 1–7. https://doi.org/10.5540/03.2025.011.01.0355

The cyclic-mode formal structure in section 3 — the season function,
the cycle convergence inequality, the season-indexed cut pool with its
cut-sharing equation, and the fixed-point Bellman operator — is drawn
from this paper. The full bibliographic entry is in
[Bibliography](../reference/bibliography.md).

## Cross-References

- [Discount-Rate Handling](./discount-rate.md) — Annual-rate-to-factor
  conversion, per-transition discount mechanics, cumulative discounting, and
  the cycle convergence requirement.
- [Cut Management](./cut-management.md) — Cut generation and aggregation
  mechanics that produce the cuts filling the per-stage or per-season pools.
- [SDDP Algorithm](./sddp-algorithm.md) — The algorithm that the horizon mode
  parameterises; finite and cyclic policy graph topologies; terminal boundary
  cut mechanism.
- [Stopping Rules](./stopping-rules.md) — Cyclic-mode stopping criteria,
  including the cycle convergence tolerance applied to seasonal lower
  bounds.
