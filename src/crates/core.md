# cobre-core

<span class="status-experimental">experimental</span>

## Overview

cobre-core provides the power system entity model for the Cobre ecosystem. It defines entity
registries, topology validation, and the resolved runtime structures that bridge
input files and the solver. Every system element -- buses, transmission lines,
hydro plants, thermal plants, pumping stations, energy contracts, and
non-controllable sources -- has a corresponding entity type with a unique ID,
cross-references to related entities, and stage-varying parameters.

A central responsibility of cobre-core is **resolution**: the process of
collapsing three-tier cascaded defaults (global, entity, stage) into concrete
per-entity, per-stage values. Input files express penalties and bounds with
sparse overrides for compactness; cobre-core pre-resolves them during loading so
that downstream solvers and analysis tools never query the cascade at runtime. The same principle
applies to generic constraints, block factors, and autoregressive model
coefficients -- all are loaded, validated, and stored in canonical (ID-sorted)
order.

The resulting internal structures are consumed in two phases with different
performance profiles. During **initialization**, they drive optimization model
construction, where correctness and clarity matter most. During **iterative
solution algorithms**, the scenario generation pipeline exercises the AR models
and correlation matrices repeatedly under MPI parallelism, where throughput is
critical.

## Key Concepts

- **Design principles** -- Format selection criteria (JSON for human-editable
  configuration, Parquet for columnar stage-varying data, FlatBuffers for binary
  policy data), declaration order invariance, and canonical ID ordering that
  underpin every data model decision.
  See [Design Principles](../specs/overview/design-principles.md).

- **System element formulations** -- Entity variable definitions and constraint
  formulations that the data model must represent: per-element decision variables,
  bounds, cost coefficients, and coupling constraints across the system.
  See [System Element Modeling Overview](../specs/math/system-elements.md).

- **Entity registries** -- JSON-backed collections for all physical and
  commercial elements in the system. Each entity carries typed fields, bus
  assignments, and optional stage-varying overrides.
  See [Input System Entities](../specs/data-model/input-system-entities.md).

- **Hydro extensions** -- Supplementary tables (reservoir geometry, production
  function hyperplanes, cascade topology, water travel times) that augment the
  base hydro entity with data too large or too structured for JSON.
  See [Input Hydro Extensions](../specs/data-model/input-hydro-extensions.md).

- **Penalty system** -- A three-tier cascade (global defaults in
  `penalties.json`, entity-level overrides in registry files, stage-level
  overrides in Parquet) that is pre-resolved into flat per-entity, per-stage
  penalty values during loading. Penalties provide graduated slack costs to
  guarantee LP feasibility under extreme scenarios.
  See [Penalty System](../specs/data-model/penalty-system.md).

- **Internal structures** -- The unified, cross-validated, ready-to-use
  representation that the solver operates on. Differs from input schemas in that
  all defaults are resolved, all cross-references are verified, and collections
  are in canonical order.
  See [Internal Structures](../specs/data-model/internal-structures.md).

## Status

cobre-core is in the **design phase**. The data model specs linked above are
stable and serve as the authoritative reference for implementation. No Rust code
has been published yet; the crate placeholder exists in the Cargo workspace to
reserve the module boundary.
