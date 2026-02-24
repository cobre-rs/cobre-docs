# Forward and Backward Passes

SDDP iterates between two complementary phases: a **forward pass** that simulates the system under the current policy, and a **backward pass** that improves the policy by generating new Benders cuts. This page summarizes how the two passes work together. For the complete specification, see [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md).

## Forward pass

The forward pass simulates the system from stage 1 to stage $T$, producing **trial points** -- the reservoir states that the backward pass will use to build cuts.

For each of $M$ independent trajectories:

1. Start from the known initial state $x_0$ (reservoir volumes and inflow history).
2. At each stage $t$, sample an inflow scenario $\omega_t$ from the opening tree and solve the stage LP with the incoming state $\hat{x}_{t-1}$ and the sampled scenario. The LP includes all Benders cuts accumulated so far, so the future cost variable $\theta$ reflects the best available approximation of costs from stage $t+1$ onward.
3. Record the optimal outgoing state $\hat{x}_t$ (end-of-stage storage volumes and updated autoregressive lags) as the trial point for stage $t$.
4. Pass $\hat{x}_t$ as the incoming state to stage $t+1$ and repeat.

The forward pass also records each trajectory's total cost, which feeds the statistical upper bound estimate (see [Convergence](convergence.md)).

## Backward pass

The backward pass walks stages in reverse order, from $T$ down to 1, generating new cuts that tighten the future cost approximation.

At each stage $t$, for each trial point $\hat{x}_{t-1}$ collected during the forward pass:

1. Solve the stage $t$ LP for **every** scenario $\omega$ in the opening tree, using $\hat{x}_{t-1}$ as the incoming state. This is called **backward branching**: unlike the forward pass which samples one scenario per stage, the backward pass evaluates all of them.
2. From each LP solution, extract the optimal objective value and the dual multipliers of the state-linking constraints (water balance, autoregressive lag fixing). These duals measure how sensitive the future cost is to small changes in the incoming state.
3. Compute per-scenario cut coefficients $(\alpha(\omega), \beta(\omega))$ from the duals and trial point.
4. Aggregate the per-scenario coefficients into a single cut via probability-weighted averaging (the single-cut formulation).
5. Add the new cut to stage $t-1$'s problem.

Each iteration adds one cut per stage per trial point, progressively tightening the piecewise-linear lower approximation of the true cost-to-go function.

## How the passes work together

The two passes form a feedback loop:

- The **forward pass** uses the current cut set to make decisions. Better cuts lead to better trial points.
- The **backward pass** generates cuts at the states actually visited. More representative trial points lead to more useful cuts.

Over iterations, the cuts converge toward the true value function, and the forward pass policy converges toward the optimal dispatch schedule.

## Parallelization

Both passes offer natural parallelism:

- **Forward pass**: The $M$ trajectories are independent. Cobre distributes them across MPI ranks and OpenMP threads.
- **Backward pass**: Within each stage, the branching solves across scenarios can run in parallel. However, there is a synchronization barrier at each stage boundary -- all threads must finish generating cuts at stage $t$ before any thread moves to stage $t-1$, because the newly generated cuts must be available when solving stage $t-1$.

The forward pass LP solution at each stage also provides a warm-start basis for the corresponding backward pass solves, significantly reducing solver time.

For the full specification of the forward and backward pass mechanics, including scenario sampling schemes, feasibility guarantees, and the thread-trajectory affinity model, see [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md).

## Related topics

- [SDDP Theory](sddp-theory.md) -- High-level overview of the algorithm
- [Benders Decomposition](benders.md) -- The decomposition technique behind cut generation
- [Convergence](convergence.md) -- How the bounds produced by these passes are used to monitor convergence
- [Scenario Generation](scenario-generation.md) -- How scenarios are sampled for forward and backward passes
