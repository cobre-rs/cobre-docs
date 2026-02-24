# Summary

[Introduction](./introduction.md)

---

# User Guide

- [Getting Started](./guide/getting-started.md)
  - [Installation](./guide/installation.md)
  - [Your First Study](./guide/first-study.md)
- [System Modeling](./guide/system-modeling.md)
  - [Hydro Plants](./guide/hydro-plants.md)
  - [Thermal Units](./guide/thermal-units.md)
  - [Network Topology](./guide/network-topology.md)
- [Running Studies](./guide/running-studies.md)
  - [Configuration](./guide/configuration.md)
  - [CLI Reference](./guide/cli-reference.md)
  - [Interpreting Results](./guide/interpreting-results.md)

---

# Crate Documentation

- [Overview](./crates/overview.md)
- [cobre-core](./crates/core.md)
- [cobre-io](./crates/io.md)
- [cobre-stochastic](./crates/stochastic.md)
- [cobre-solver](./crates/solver.md)
- [cobre-sddp](./crates/sddp.md)
- [cobre-cli](./crates/cli.md)
- [ferrompi](./crates/ferrompi.md)

---

# Algorithm Reference

- [SDDP Theory](./algorithms/sddp-theory.md)
  - [Benders Decomposition](./algorithms/benders.md)
  - [Forward and Backward Passes](./algorithms/forward-backward.md)
  - [Convergence](./algorithms/convergence.md)
- [Stochastic Modeling](./algorithms/stochastic-modeling.md)
  - [PAR(p) Autoregressive Models](./algorithms/par-model.md)
  - [Spatial Correlation](./algorithms/spatial-correlation.md)
  - [Scenario Generation](./algorithms/scenario-generation.md)
- [Cut Management](./algorithms/cut-management.md)
  - [Single-Cut vs Multi-Cut](./algorithms/single-multi-cut.md)
  - [Cut Selection](./algorithms/cut-selection.md)
- [Risk Measures](./algorithms/risk-measures.md)
  - [CVaR](./algorithms/cvar.md)

---

# Specifications

- [Overview](./specs/overview.md)
  - [Design Principles](./specs/overview/design-principles.md)
  - [Notation Conventions](./specs/overview/notation-conventions.md)
  - [Production Scale Reference](./specs/overview/production-scale-reference.md)
- [Mathematical Formulations](./specs/math.md)
  - [SDDP Algorithm](./specs/math/sddp-algorithm.md)
  - [LP Formulation](./specs/math/lp-formulation.md)
  - [System Elements](./specs/math/system-elements.md)
  - [Block Formulations](./specs/math/block-formulations.md)
  - [Hydro Production Models](./specs/math/hydro-production-models.md)
  - [Cut Management](./specs/math/cut-management.md)
  - [Discount Rate](./specs/math/discount-rate.md)
  - [Infinite Horizon](./specs/math/infinite-horizon.md)
  - [Risk Measures](./specs/math/risk-measures.md)
  - [Inflow Non-Negativity](./specs/math/inflow-nonnegativity.md)
  - [PAR Inflow Model](./specs/math/par-inflow-model.md)
  - [Equipment Formulations](./specs/math/equipment-formulations.md)
  - [Stopping Rules](./specs/math/stopping-rules.md)
  - [Upper Bound Evaluation](./specs/math/upper-bound-evaluation.md)
- [Data Model](./specs/data-model.md)
  - [Input Directory Structure](./specs/data-model/input-directory-structure.md)
  - [Input System Entities](./specs/data-model/input-system-entities.md)
  - [Input Scenarios](./specs/data-model/input-scenarios.md)
  - [Input Constraints](./specs/data-model/input-constraints.md)
  - [Input Hydro Extensions](./specs/data-model/input-hydro-extensions.md)
  - [Penalty System](./specs/data-model/penalty-system.md)
  - [Internal Structures](./specs/data-model/internal-structures.md)
  - [Output Schemas](./specs/data-model/output-schemas.md)
  - [Output Infrastructure](./specs/data-model/output-infrastructure.md)
  - [Binary Formats](./specs/data-model/binary-formats.md)
- [Architecture](./specs/architecture.md)
  - [Training Loop](./specs/architecture/training-loop.md)
  - [Simulation Architecture](./specs/architecture/simulation-architecture.md)
  - [CLI and Lifecycle](./specs/architecture/cli-and-lifecycle.md)
  - [Validation Architecture](./specs/architecture/validation-architecture.md)
  - [Input Loading Pipeline](./specs/architecture/input-loading-pipeline.md)
  - [Scenario Generation](./specs/architecture/scenario-generation.md)
  - [Solver Abstraction](./specs/architecture/solver-abstraction.md)
  - [Solver HiGHS Implementation](./specs/architecture/solver-highs-impl.md)
  - [Solver CLP Implementation](./specs/architecture/solver-clp-impl.md)
  - [Solver Workspaces](./specs/architecture/solver-workspaces.md)
  - [Cut Management Implementation](./specs/architecture/cut-management-impl.md)
  - [Convergence Monitoring](./specs/architecture/convergence-monitoring.md)
  - [Extension Points](./specs/architecture/extension-points.md)
- [High-Performance Computing](./specs/hpc.md)
  - [Work Distribution](./specs/hpc/work-distribution.md)
  - [Hybrid Parallelism](./specs/hpc/hybrid-parallelism.md)
  - [Communication Patterns](./specs/hpc/communication-patterns.md)
  - [Memory Architecture](./specs/hpc/memory-architecture.md)
  - [Shared Memory Aggregation](./specs/hpc/shared-memory-aggregation.md)
  - [Checkpointing](./specs/hpc/checkpointing.md)
  - [SLURM Deployment](./specs/hpc/slurm-deployment.md)
  - [Synchronization](./specs/hpc/synchronization.md)
- [Configuration](./specs/configuration.md)
  - [Configuration Reference](./specs/configuration/configuration-reference.md)
- [Deferred Features](./specs/deferred.md)

---

# NEWAVE Migration

- [Overview](./migration/overview.md)
- [File Format Reference](./migration/file-formats.md)
  - [HIDR.DAT](./migration/hidr-dat.md)
  - [TERM.DAT](./migration/term-dat.md)
  - [CONFHD.DAT](./migration/confhd-dat.md)
- [Comparing Results](./migration/comparing-results.md)

---

# Reference

- [Glossary](./reference/glossary.md)
- [Bibliography](./reference/bibliography.md)
- [FAQ](./reference/faq.md)

---

[Contributing](./contributing.md)
