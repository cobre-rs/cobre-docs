# cobre-io

<span class="status-experimental">experimental</span>

## Overview

cobre-io handles all file-system interactions for a Cobre study: reading input
case directories, writing training and simulation outputs, and persisting binary
policy data for checkpoint/resume and warm-start workflows. It is the boundary
between on-disk formats and the in-memory data model defined by cobre-core.

On the **input side**, cobre-io loads a case directory that follows a
well-defined layout: a root `config.json` with algorithm and study parameters,
JSON registry files under `system/` for entity definitions, Parquet tables for
stage-varying overrides and scenario data, and JSON descriptors for generic
constraints. The loader validates schemas, resolves file references, and
produces the internal structures that cobre-core expects. Configuration
validation covers required fields, cross-reference integrity (e.g., every
`bus_id` must exist), and semantic checks (e.g., deficit segments must end
with an unbounded tier).

On the **output side**, cobre-io writes Hive-partitioned Parquet files for
simulation and training results, enabling efficient partition pruning by
downstream analytics tools. Each output run produces a manifest file for crash
recovery and incremental writes, plus metadata files (variable dictionaries,
entity catalogs, scenario codebooks) that make outputs self-describing.
**Binary policy data** -- cuts, visited states, vertices, and solver basis
caches -- is serialized with FlatBuffers for zero-copy deserialization and
SIMD-friendly dense array access. This format supports the checkpoint/resume
cycle during training and cross-study warm-start of the cut pool.

## Key Concepts

- **Directory structure** -- The canonical layout of a Cobre input case:
  `config.json` at the root, `system/` for entity registries, `scenarios/` for
  inflow and demand data, `constraints/` for generic constraint groups.
  See [Input Directory Structure](../specs/data-model/input-directory-structure.md).

- **Input scenarios** -- Parquet-based tabular data for inflows, demands, and
  other stochastic processes, plus JSON configuration for the autoregressive
  model, correlation matrices, and noise generation parameters.
  See [Input Scenarios](../specs/data-model/input-scenarios.md).

- **Input constraints** -- JSON-defined generic linear constraints that can span
  multiple entity types and stages, supporting inequality and equality forms
  with stage-varying right-hand sides.
  See [Input Constraints](../specs/data-model/input-constraints.md).

- **Output schemas** -- Column definitions and data types for the Parquet files
  produced during simulation (per-scenario, per-stage results) and training
  (convergence metrics, cut statistics).
  See [Output Schemas](../specs/data-model/output-schemas.md).

- **Output infrastructure** -- Manifest files for crash recovery, MPI-native
  Hive partitioning for parallel writes, metadata dictionaries, and integrity
  checks (xxhash checksums).
  See [Output Infrastructure](../specs/data-model/output-infrastructure.md).

- **Binary formats** -- FlatBuffers schemas for policy persistence (cuts,
  visited states, vertices) and solver basis caching. Designed for zero-copy
  loading and checkpoint/resume across training iterations.
  See [Binary Formats](../specs/data-model/binary-formats.md).

- **Input loading pipeline** -- Rank-0 centric loading strategy, dependency
  ordering across input files, sparse expansion of cascaded defaults, and MPI
  data broadcasting to worker ranks after validation completes.
  See [Input Loading Pipeline](../specs/architecture/input-loading-pipeline.md).

- **Validation architecture** -- Five-layer validation pipeline (structural,
  schema, referential integrity, dimensional consistency, semantic rules), error
  collection strategy, error catalog, and human-readable report format.
  See [Validation Architecture](../specs/architecture/validation-architecture.md).

## Status

cobre-io is in the **design phase**. The format decision framework and all
referenced specs are stable. No Rust code has been published yet; the crate
placeholder exists in the Cargo workspace to reserve the module boundary.
