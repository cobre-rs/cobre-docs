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
