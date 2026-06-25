---
title: The SDDP Framework in One Page
description: Minimum context for the SDDP idea — forward pass, backward pass, bounds, convergence, and risk measures in one page.
---

## Purpose

This chapter gives a reader new to stochastic dynamic programming the minimum context needed to follow the rest of the book. It covers the SDDP idea in one page. Every claim here is developed in detail in [SDDP Algorithm](/math/sddp-algorithm).

## 1. The Core Idea

Optimal dispatch over a multi-stage horizon cannot be solved by enumerating all scenarios: the number of scenario paths grows exponentially with the number of stages. SDDP avoids enumeration by exploiting the structure of the problem.

At each stage, the future is summarised by a **cost-to-go function** — the minimum expected cost from that stage forward, as a function of the current state (reservoir levels, inflow lags). SDDP approximates this function from below using a collection of affine functions called **Benders cuts**. Each cut is valid everywhere: it underestimates the true cost-to-go at every state.

The approximation improves iteratively. Starting with no cuts, the algorithm alternates between two passes:

**Forward pass**: Starting from the initial state, simulate a batch of scenario paths forward through all stages, recording the states visited at each stage.

**Backward pass**: Starting from the last stage and working back to stage one, solve each subproblem at each visited state and use the resulting dual variables to generate a new cut for the previous stage. The cut encodes how the cost-to-go changes as the incoming state changes.

As iterations accumulate, the piecewise-linear approximation covers more of the state space and the lower bound rises toward the true optimum.

## 2. Bounds and Convergence

SDDP maintains two bounds on the optimal expected cost:

**Lower bound**: The objective value of the stage-zero subproblem with the current cut approximation. This value is a rigorous lower bound on the optimal cost; it increases monotonically as cuts are added.

**Upper bound**: The sample average cost of forward simulations under the current policy. Because this average is computed from a finite number of scenarios, it carries statistical uncertainty; Cobre reports both the estimate and its confidence interval.

The **optimality gap** is the difference between the upper and lower bounds. When the gap falls below the stopping criterion, the algorithm terminates. The stopping rule governs how the gap is assessed; see [Stopping Rules](/math/stopping-rules) for the full treatment.

Convergence of SDDP to the optimal value function, under the cut selection strategies used in Cobre, is guaranteed with probability 1 as iterations tend to infinity. In practice, production studies converge in tens to hundreds of iterations.

## 3. Risk Measures

The basic SDDP algorithm minimises expected cost. Cobre supports **risk-averse** formulations through nested risk measures applied at each stage. The conditional value-at-risk (CVaR) measure shifts weight toward high-cost scenarios, producing policies that are more conservative in the tail of the cost distribution. The risk measure is applied inside the backward pass: cut coefficients are aggregated using risk-weighted averages rather than simple expectations. See [Risk Measures](/math/risk-measures) for the formulation.

## 4. Where to Go Next

This overview omits every implementation detail: the LP column layout, cut storage, the scenario tree structure, the warm-start strategy, and the distributed-execution design. Those details are the subject of Parts 2 through 7 of this book.

For the full algorithm, with stage LP formulation, cut coefficient derivation, and convergence analysis, see [SDDP Algorithm](/math/sddp-algorithm).

For the cut mechanics — how cuts are generated, stored, and pruned — see [Cut Management](/math/cut-management).

## Cross-References

- [SDDP Algorithm](/math/sddp-algorithm) — complete algorithmic treatment: stage LP formulation, cut generation, convergence proof
- [Cut Management](/math/cut-management) — cut storage, selection strategies, and domination pruning
- [Risk Measures](/math/risk-measures) — CVaR and nested risk measure formulations for risk-averse SDDP
- [Stopping Rules](/math/stopping-rules) — gap-based and iteration-based convergence criteria
