# Benders Decomposition

## Overview

Stochastic Dual Dynamic Programming (SDDP) solves large multistage stochastic optimization problems by decomposing them into smaller single-stage subproblems. This decomposition is rooted in **Benders decomposition** (also known as the L-shaped method), which splits a monolithic problem into a master problem and subproblems connected through linear inequalities called _cuts_.

In the hydrothermal dispatch context, a direct formulation over all stages, scenarios, and equipment would produce an LP with millions of variables and constraints. Benders decomposition breaks this into $T$ stage subproblems, each solved independently for a given incoming state and scenario realization.

## The Stage Subproblem

Each stage $t$ solves an LP of the form:

$$
\min_{x_t, \theta_t} \quad c_t^\top x_t + \theta_t
$$

$$
\text{s.t.} \quad A_t x_t = b_t - E_t x_{t-1}, \quad x_t \in \mathcal{X}_t, \quad \theta_t \geq \underline{V}_{t+1}(x_t)
$$

where $x_{t-1}$ is the incoming state (reservoir volumes, AR inflow lags) fixed from the previous stage, $c_t^\top x_t$ captures the immediate cost (thermal generation, penalties, regularization), and $\theta_t$ approximates the expected future cost from stages $t+1$ through $T$.

The full LP structure -- objective terms, constraint families, slack variables, and variable bounds -- is specified in the [LP Formulation](../specs/math/lp-formulation.md).

## How Cuts Approximate Future Cost

The true future cost function $V_{t+1}(x_t)$ is convex but unknown. SDDP builds a piecewise-linear lower approximation $\underline{V}_{t+1}$ through iterative cut generation:

$$
\underline{V}_{t+1}(x_t) = \max_{i \in \mathcal{K}} \left\{ \alpha_i + \pi_i^\top x_t \right\}
$$

Each cut $(\alpha_i, \pi_i)$ is a supporting hyperplane derived from **dual variables** of the backward pass. When the stage $t+1$ subproblem is solved at a trial state $\hat{x}_t$ under scenario $\omega$, the optimal dual multipliers $\pi^*$ of the state-linking constraints yield:

- **Slope**: $\pi = E_{t+1}^\top \pi^*$ (sensitivity of future cost to incoming state)
- **Intercept**: $\alpha = V_{t+1}(\hat{x}_t, \omega) - \pi^\top \hat{x}_t$

> **Notation note**: The matrix form $E_{t+1}^\top \pi^*$ above is the standard Benders decomposition notation from the stochastic programming literature. In Cobre's formal specs, the cut coefficients are expressed directly in terms of LP dual variables: $\pi^v_h = \pi^{wb}_h$ (the water balance dual) and $\pi^{lag}_{h,\ell}$ (the lag-fixing constraint dual), without explicit technology matrices. Both conventions are mathematically equivalent -- the matrix form is compact for general derivations, while the direct-dual form is more practical for implementation. See [Cut Management (spec)](../specs/math/cut-management.md) for the full derivation.

In the hydrothermal problem, the state variables are reservoir storage volumes $v_h$ and AR inflow lags $a_{h,\ell}$, so the cut coefficients come from the water balance dual $\pi^{wb}_h$ and the lag-fixing constraint dual $\pi^{lag}_{h,\ell}$.

## The Forward-Backward Iteration

SDDP alternates between two passes:

1. **Forward pass**: Simulate scenario paths from stage 1 to $T$, solving each stage LP with the current cut approximation. This produces trial states $\hat{x}_t$ and a statistical upper bound on optimal cost.

2. **Backward pass**: Traverse from stage $T$ back to stage 1. At each stage, solve subproblems for all scenario realizations at each trial state, extract dual multipliers, and aggregate them into new cuts. The first-stage objective (including $\theta_1$) provides a deterministic lower bound.

Cuts accumulate over iterations, progressively tightening $\underline{V}_{t+1}$ toward the true $V_{t+1}$. The algorithm converges when the gap between lower and upper bounds falls below a tolerance.

## Why the LP Formulation Matters

The quality of Benders cuts depends directly on the LP formulation:

- **Recourse slacks** (deficit, excess) guarantee feasibility for every scenario, ensuring duals always exist. Without relatively complete recourse, the backward pass would encounter infeasible subproblems.
- **Penalty magnitudes** shape the value function. Correct priority ordering ensures that cuts propagate economically meaningful signals across stages.
- **State variable identification** determines which dual multipliers contribute to cut coefficients. Every constraint linking the current stage to the incoming state produces a component of $\pi$.

The complete specification of all objective terms, constraints, and their dual interpretations is in the [LP Formulation](../specs/math/lp-formulation.md).

## Related Topics

- [LP Formulation](../specs/math/lp-formulation.md) -- complete stage subproblem: objective, constraints, penalties, and Benders cut interface
- [Cut Management](../specs/math/cut-management.md) -- cut coefficient derivation, aggregation (single-cut vs multi-cut), and selection strategies
- [SDDP Algorithm](../specs/math/sddp-algorithm.md) -- the iterative structure, convergence monitoring, and policy graph topologies
- [Forward-Backward Pass](forward-backward.md) -- detailed mechanics of the forward simulation and backward cut generation passes

## Further Reading

- Pereira, M. V. F. and Pinto, L. M. V. G. (1991). "Multi-stage stochastic optimization applied to energy planning." _Mathematical Programming_, 52(1-3), 359-375.
- Benders, J. F. (1962). "Partitioning procedures for solving mixed-variables programming problems." _Numerische Mathematik_, 4(1), 238-252.
- Birge, J. R. and Louveaux, F. V. (2011). _Introduction to Stochastic Programming_. Springer, 2nd edition.
- SDDP.jl documentation: [https://sddp.dev/stable/](https://sddp.dev/stable/)
