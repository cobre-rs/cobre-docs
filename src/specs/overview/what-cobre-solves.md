# What Cobre Solves

## Purpose

This chapter answers the foundational question: what problem does Cobre compute, and what does a user get when a run completes? It frames the methodology scope for Part 1 and threads the capability statements that appear throughout the book.

## 1. The Problem

Power systems that rely heavily on hydroelectric generation face a planning problem that is both large-scale and deeply uncertain. Water stored in reservoirs today is water available for generation in future months; the right dispatch policy depends on how much rain is likely to fall across a multi-year horizon, the cost of thermal alternatives, and the risk appetite of the system operator.

Cobre solves the **multi-stage stochastic hydrothermal dispatch problem**: given a power system with hydro reservoirs, thermal plants, and a stochastic inflow process, find the operating policy that minimises expected generation cost over a planning horizon while meeting load at every stage under every scenario. The state space is continuous (reservoir levels, autoregressive inflow lags), the uncertainty is structured by a periodic autoregressive model, and the horizon spans dozens of stages.

This is the founding problem of the Brazilian national power system operator and motivates the design of every component in the Cobre ecosystem.

## 2. The Algorithm

Cobre implements **Stochastic Dual Dynamic Programming (SDDP)**. SDDP solves the multi-stage problem by decomposing it into per-stage linear programmes that are linked through state variables (reservoir levels and inflow lags). Iterating forward and backward through the stage tree, the algorithm builds piecewise-linear approximations of the cost-to-go function at each stage. These approximations, called Benders cuts, carry future cost information from the last stage back to the first.

The algorithm converges when the gap between a statistical lower bound and an upper bound falls below a chosen stopping criterion. See [The SDDP Framework in One Page](./sddp-framework-overview.md) for the one-page framing, and [SDDP Algorithm](../math/sddp-algorithm.md) for the full algorithmic treatment.

## 3. Methodology Guarantees

At convergence, Cobre provides three bounds on the optimal policy cost:

1. **Lower bound** — the objective value of the stage-zero LP with the current cut approximation. This bound increases monotonically across iterations and converges to the true optimal value.
2. **Statistical upper bound** — the sample average cost of forward simulations under the current policy, with a confidence interval. This bound decreases as the policy improves.
3. **Statistical upper bound** — the sample-average cost of out-of-sample forward simulations, with a confidence interval, used for final convergence assessment.

In addition, Cobre provides a **determinism guarantee**: given the same input data, results are identical regardless of the number of MPI ranks or threads used during execution. This guarantee is a property of the algorithm design, not an approximation.

## 4. How Cobre Is Used

Cobre is operated through two equivalent interfaces:

**CLI**: Cobre is driven via the `cobre` CLI; the same case directories and configuration files used from Python are used from the CLI.

**Python**: Cobre is callable from Python via PyO3 bindings; cases can be configured, runs launched, and results loaded from Python without leaving the methodology layer.

Every Cobre operation produces machine-parseable structured output (JSON or Parquet) alongside human-readable progress streams. Results are structured and self-describing: a completed training run writes the policy, the convergence record, and the output statistics to known paths under the case directory.

Cobre policies are checkpointable; checkpoints persist the policy across restarts and are forward-compatible across releases. A training run interrupted at any iteration can be resumed from the last checkpoint without restarting from scratch.

Cobre supports distributed execution with deterministic results across MPI rank and thread configurations. The same study runs on a laptop with a single process or on an HPC cluster with hundreds of ranks; the numerical results are bit-identical.

Cobre is designed for production-scale studies; a 60-stage horizon is the practical baseline. The index dimensions at this scale are roughly 160 hydro plants, 130 thermal units, 20 scenarios per stage, and up to 24 blocks per stage.

## 5. Methodology Principles

The following principles govern how Cobre is built and how this book describes it. Each principle is a durable commitment: it holds across algorithm versions, hardware configurations, and study types.

- **Reproducibility** — Every Cobre run can be re-derived by any party that holds the recorded inputs and provenance. Given the same inputs, the same random seed, and conforming hardware, the computed policy, the convergence record, and the simulation costs are numerically identical. See [Reproducibility and Provenance](../math/reproducibility-and-provenance.md) for the five categories of provenance that Cobre records and the bookkeeping that makes this commitment actionable.

- **Determinism** — Cobre produces bit-identical results across MPI rank and thread configurations, hardware within IEEE 754 conformance, and re-runs with the same seed. This is an explicit methodology commitment, achieved through coordinated mechanisms in the algorithm design, not an incidental property of the implementation. See [Determinism Guarantees](../math/determinism-guarantees.md) for the full scope, the four coordinating mechanisms, and the out-of-scope statement.

- **Declaration order invariance** — Optimisation results are bit-for-bit identical regardless of the order in which entities are declared in input files; the algorithm depends only on entity IDs. Reordering hydro plants, thermal units, or transmission lines in the case configuration produces no change in the computed policy or bounds. This property is critical for programmatic workflows where input files are assembled by tools rather than edited by hand.

- **Code as ground truth** — When this methodology book and the Cobre codebase disagree, the codebase is correct and this book is updated to match. The methodology describes current Cobre as fact; it does not carry version annotations, deprecation notices, or migration notes. Readers who find a discrepancy between a chapter and observed behaviour should treat the observed behaviour as authoritative and report the discrepancy.

- **Agent-readability** — Every Cobre operation produces structured, machine-parseable output (JSON or Parquet) alongside human-readable progress streams; stable schemas allow programmatic tools to compose, monitor, and verify Cobre workflows. This commitment extends reproducibility to the interface layer: a tool that replays the same command with the same inputs receives the same structured response, enabling automated verification of solver behaviour.

## Cross-References

- [The SDDP Framework in One Page](./sddp-framework-overview.md) — one-page algorithmic framing: forward simulation, backward cut generation, and convergence bounds
- [How to Read This Book](./how-to-read.md) — navigation guide for the seven-Part structure of this book
- [SDDP Algorithm](../math/sddp-algorithm.md) — full algorithmic treatment: stage LPs, cut generation, convergence theory
- [Determinism Guarantees](../math/determinism-guarantees.md) — bit-identical result scope, four coordinating mechanisms, and out-of-scope statement (Part 4.8)
- [Reproducibility and Provenance](../math/reproducibility-and-provenance.md) — five provenance categories and bookkeeping commitment (Part 4.9)
