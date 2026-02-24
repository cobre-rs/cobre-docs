# Scenario Generation

SDDP requires scenarios -- discrete realizations of uncertain quantities (primarily inflows) -- at multiple points in the algorithm. This page provides an overview of how scenarios are generated and used. For the underlying stochastic model, see [PAR Inflow Model (spec)](../specs/math/par-inflow-model.md). For the forward/backward pass mechanics that consume these scenarios, see [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md).

## The opening tree

Before the SDDP iteration loop begins, Cobre generates a **fixed opening tree**: a set of pre-sampled noise vectors for each stage. Each noise vector contains correlated random draws for all hydro plants, reflecting the spatial correlation structure estimated from historical data (see [Spatial Correlation](spatial-correlation.md)).

The opening tree is generated once and remains fixed throughout training. This ensures that every iteration's backward pass evaluates the same set of realizations, which is important for cut validity -- cuts are valid lower bounds on the expected cost-to-go computed over a specific discrete distribution.

The number of openings per stage is a key configuration parameter. More openings give a finer approximation of the continuous inflow distribution but increase the computational cost of each backward pass proportionally.

## Forward pass sampling

During the forward pass, each trajectory needs one scenario realization per stage. The default scheme (**InSample**) draws uniformly at random from the opening tree -- the same set used by the backward pass. This means the forward pass explores states that are consistent with the distribution the cuts were built for.

Alternative sampling schemes are available:

- **External**: Draws from user-provided scenario data, allowing the forward pass to explore states driven by historical or synthetically generated inflow sequences.
- **Historical**: Uses actual historical inflow records as forward pass scenarios, useful for validating the policy against observed conditions.

Regardless of the sampling scheme, the backward pass always uses the complete opening tree.

## Backward pass branching

The backward pass evaluates **all** openings in the tree at each visited trial point. This complete enumeration is what makes the resulting Benders cut a valid expected-value inequality: the cut coefficients are computed as probability-weighted averages over the full discrete distribution.

For each trial point $\hat{x}_{t-1}$ at stage $t$:

1. Solve the stage LP once per opening $\omega \in \Omega_t$, using $\hat{x}_{t-1}$ as the incoming state and $\omega$ as the inflow realization.
2. Extract dual multipliers and objective values from each solve.
3. Aggregate into a single cut (probability-weighted average of per-scenario coefficients).

The uniform probability $p(\omega) = 1 / |\Omega_t|$ applies when all openings are equally likely, which is the default.

## From noise to inflows

The opening tree stores **noise vectors** (standardized innovations), not inflows directly. At each stage, the PAR(p) model transforms these noise vectors into physical inflow values using the autoregressive equation:

$$
a_{h,t} = \text{deterministic base} + \text{lag contribution} + \sigma_{m(t)} \cdot \eta_t
$$

where $\eta_t$ is the noise draw from the opening tree. The deterministic base and lag contribution depend on the incoming state (autoregressive lags), so the same noise vector produces different inflows depending on the system's history. This is how the Markov property is maintained -- the state carries enough information to reconstruct the inflow dynamics.

## Scenario count and computational cost

The number of openings directly affects the backward pass cost: each backward stage solve requires $|\Omega_t|$ LP solves per trial point. Typical configurations use 20 to 200 openings per stage, balancing approximation quality against runtime.

The forward pass cost is independent of the opening count -- each trajectory samples exactly one realization per stage.

## Related topics

- [PAR Inflow Model (spec)](../specs/math/par-inflow-model.md) -- The autoregressive model that transforms noise into inflows
- [Spatial Correlation](spatial-correlation.md) -- How cross-plant correlation is embedded in the noise vectors
- [Forward and Backward Passes](forward-backward.md) -- How the passes consume scenarios
- [SDDP Algorithm (spec)](../specs/math/sddp-algorithm.md) -- Full specification including scenario sampling schemes and opening tree structure
