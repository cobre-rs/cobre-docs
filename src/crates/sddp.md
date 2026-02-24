# cobre-sddp

<span class="status-experimental">experimental</span>

## Overview

cobre-sddp implements the core SDDP algorithm: the iterative training loop that
builds a piecewise-linear approximation of the expected future cost function
(FCF), the simulation pipeline that evaluates trained policies on large scenario
sets, and the convergence monitoring infrastructure that decides when to stop.
It coordinates the forward pass (scenario sampling, LP solves, state recording),
the backward pass (opening tree evaluation, dual extraction, cut generation),
and cross-rank synchronization via MPI.

The training loop is parameterized by four abstraction points -- risk measure,
cut formulation, horizon mode, and sampling scheme -- that control how backward
outcomes are aggregated, how cuts are structured, how stages connect (finite or
infinite horizon), and how forward scenarios are selected. Each iteration follows
a fixed lifecycle: forward pass, forward synchronization
(`MPI_Allreduce`), backward pass, cut synchronization (`MPI_Allgatherv`),
convergence check, optional checkpoint, and logging.

The simulation phase replays the trained policy on a configurable number of
scenarios, streaming per-scenario results to Hive-partitioned Parquet output.
Cut management is handled through the FCF runtime structure: a pre-allocated,
deterministic-slot cut pool per stage with activity tracking, selection
strategies (Level 1, Limited Memory Level 1), FlatBuffers serialization for
checkpoint/resume, and MPI broadcast for cross-rank distribution.

## Key Concepts

- **SDDP algorithm** -- Bellman recursion, forward/backward pass theory,
  single-cut vs multi-cut formulations, and the policy graph that structures
  stage-wise decomposition.
  See [SDDP Algorithm](../specs/math/sddp-algorithm.md).

- **LP subproblem** -- Complete stage LP structure: objective function,
  constraint matrix, variable bounds, and the epigraph variable linking to the
  future cost function that the solver constructs and solves at each node.
  See [LP Formulation](../specs/math/lp-formulation.md).

- **System element formulations** -- Per-element variables, constraints, and
  cost contributions for every modeled entity (hydro, thermal, bus, line,
  contract, pumping station, non-controllable source).
  See [System Element Modeling Overview](../specs/math/system-elements.md).

- **Block formulations** -- Multi-block stage structure, independent vs parallel
  block modes, block-level aggregation of generation and demand, and the
  relationship between blocks and LP construction.
  See [Block Formulation Variants](../specs/math/block-formulations.md).

- **Hydro production models** -- Constant productivity, FPHA (Future Production
  Hyperplane Approximation) hyperplanes, and head-dependent generation models
  that link reservoir volume to power output.
  See [Hydro Production Function Models](../specs/math/hydro-production-models.md).

- **Cut management** -- Benders cut lifecycle: dual extraction from stage
  subproblems, cut coefficient computation, aggregation (single-cut and
  multi-cut), validity conditions, and selection strategies (Level 1, LML1).
  See [Cut Management](../specs/math/cut-management.md).

- **Risk measures** -- CVaR (Conditional Value-at-Risk), convex combination
  with expectation (EAVaR), risk-averse cut generation with modified
  probabilities, per-stage risk profiles, and bound validity under nested
  risk measures.
  See [Risk Measures](../specs/math/risk-measures.md).

- **Stopping rules** -- Convergence criteria for the training loop: bound
  stalling detection, simulation-based stability tests, iteration limits,
  and wall-clock time limits.
  See [Stopping Rules](../specs/math/stopping-rules.md).

- **Training iterations** -- Each iteration performs a forward pass (sample $M$
  scenarios, solve stage LPs, record visited states and lower bound) followed by
  a backward pass (evaluate all openings at visited states, extract duals,
  generate and aggregate cuts).
  See [Training Loop](../specs/architecture/training-loop.md).

- **Simulation replays** -- After training, the policy is evaluated on a large
  scenario set distributed across MPI ranks. Each scenario solves the full stage
  sequence using the frozen FCF, with optional non-convex refinements.
  See [Simulation Architecture](../specs/architecture/simulation-architecture.md).

- **Convergence criteria** -- The convergence monitor tracks the deterministic
  lower bound (stage-1 LP objective) and statistical upper bound (mean forward
  cost with confidence interval). Stopping rules include bound stalling,
  simulation-based stability, iteration limits, and time limits.
  See [Convergence Monitoring](../specs/architecture/convergence-monitoring.md).

- **FCF structure** -- The runtime data structure holding Benders cuts: one
  pre-allocated pool per stage with deterministic slot assignment, activity
  bitmaps, and metadata for selection strategies. Capacity is fully allocated
  at initialization.
  See [Cut Management Implementation](../specs/architecture/cut-management-impl.md).

- **Cut selection strategies** -- Level 1 (keep cuts active at least once) and
  Limited Memory Level 1 (keep only the most recently active cut per visited
  state). Both preserve finite convergence guarantees while controlling pool
  growth.

## Status

cobre-sddp is in the **design phase**. The training loop, simulation, convergence,
and cut management specs linked above are stable and serve as the authoritative
reference for implementation. No Rust code has been published yet; the crate
placeholder exists in the Cargo workspace to reserve the module boundary.
