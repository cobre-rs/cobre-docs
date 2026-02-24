# cobre-stochastic

<span class="status-experimental">experimental</span>

## Overview

cobre-stochastic implements the scenario generation pipeline for SDDP training
and simulation. It preprocesses PAR(p) model parameters into cache-friendly
contiguous arrays, generates spatially correlated noise vectors, constructs the
opening tree used by the backward pass, and supports external scenario injection
for cases where inflows are supplied directly rather than generated from the
autoregressive model.

During preprocessing, raw PAR parameters (seasonal means, standard deviations,
and autoregressive coefficients loaded from Parquet files) are
reverse-standardized and expanded into per-stage deterministic base values,
lag coefficients, and residual scales. This eliminates per-stage season lookups
on the hot path. Spatial correlation across hydro plants is applied via a
Cholesky-factored correlation matrix so that a single matrix-vector multiply
transforms independent standard normals into correlated innovations.

The opening tree is the fixed set of noise realizations evaluated at every
visited state during the backward pass. It is constructed once at initialization
from the discretized noise distribution and reused across all iterations.
External scenario override allows users to supply pre-generated inflow
trajectories, bypassing the PAR model entirely while preserving the same
interface to the training loop.

## Key Concepts

- **PAR(p) preprocessing** -- Converts stored seasonal statistics and AR
  coefficients into a contiguous, stage-indexed layout. Computes residual
  standard deviations from sample standard deviations via reverse-standardization
  of AR coefficients. Initializes lag state from historical inflow data.
  See [Scenario Generation](../specs/architecture/scenario-generation.md) and
  [PAR(p) Inflow Model](../specs/math/par-inflow-model.md).

- **Correlated noise sampling** -- Independent standard normal draws are
  transformed through a Cholesky factor of the spatial correlation matrix to
  produce correlated innovations across hydro plants within each stage.

- **Opening tree** -- The fixed discrete set of noise realizations used by the
  backward pass to evaluate the cost-to-go at each visited state. Defines the
  probabilities and noise vectors that drive cut generation.

- **External scenario override** -- Users can supply inflow trajectories
  directly (e.g., from external hydrological models), bypassing PAR generation
  while maintaining the same downstream interface.

## Status

cobre-stochastic is in the **design phase**. The scenario generation and PAR
model specs linked above are stable and serve as the authoritative reference for
implementation. No Rust code has been published yet; the crate placeholder
exists in the Cargo workspace to reserve the module boundary.
