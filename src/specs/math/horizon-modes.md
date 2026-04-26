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

**Scope boundary.** This chapter owns the three-mode concept at the
methodology level. The deep mathematical treatment of the cyclic mode —
the periodic structure, the season function, the cut-sharing equation, the
cycle convergence inequality, and the fixed-point Bellman operator — belongs to
[Infinite Horizon](./infinite-horizon.md). The mechanics of the per-transition
discount factor and its role in the cycle convergence requirement belong to
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
functions at each season stabilise across iterations. The deep treatment of
this guarantee — including the convergence inequality, the season function, the
cut-sharing equation, and the fixed-point Bellman operator — is in
[Infinite Horizon](./infinite-horizon.md).

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
rather than a natural chain endpoint. Both the convergence requirement and the
forward-pass termination rules are described in Section 3.

## 3. Forward-Pass Termination in Cyclic Mode

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

## 4. Choosing Between Modes

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

## Cross-References

- [Infinite Horizon](./infinite-horizon.md) — Deep mathematical treatment of
  the cyclic mode: periodic structure, season function, cycle convergence
  inequality, cut-sharing equation, forward and backward pass behaviour,
  fixed-point Bellman operator interpretation.
- [Discount-Rate Handling](./discount-rate.md) — Annual-rate-to-factor
  conversion, per-transition discount mechanics, cumulative discounting, and
  the cycle convergence requirement.
- [Cut Management](./cut-management.md) — Cut generation and aggregation
  mechanics that produce the cuts filling the per-stage or per-season pools.
- [SDDP Algorithm](./sddp-algorithm.md) — The algorithm that the horizon mode
  parameterises; finite and cyclic policy graph topologies; terminal boundary
  cut mechanism.
