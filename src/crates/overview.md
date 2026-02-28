# Crate Overview

Cobre is organized as a Cargo workspace with multiple crates. Each crate has a focused responsibility, and they compose together through shared types defined in `cobre-core`.

## Dependency graph

```
cobre-cli
  ├── cobre-sddp
  │     ├── cobre-core
  │     ├── cobre-stochastic
  │     ├── cobre-solver
  │     └── cobre-comm
  │           └── ferrompi (optional, mpi feature only)
  ├── cobre-io
  │     └── cobre-core
  ├── cobre-tui                  
  │     └── cobre-core           (event type definitions only)
  └── cobre-core

cobre-mcp                        [standalone server binary]
  ├── cobre-sddp
  ├── cobre-io
  ├── cobre-comm                 (tcp,shm features — no MPI dependency)
  └── cobre-core

cobre-python                     [PyO3 cdylib]
  ├── cobre-sddp
  ├── cobre-io
  ├── cobre-comm                 (tcp,shm features — no MPI dependency)
  └── cobre-core

ferrompi (optional, mpi feature of cobre-comm only)
  used by: cobre-comm (when mpi feature is enabled)
  NOT used by: cobre-mcp, cobre-python, cobre-tui, cobre-sddp (directly)
```

**Key property**: The `ferrompi` dependency is encapsulated within `cobre-comm` behind the `mpi` Cargo feature flag. None of the interface crates (`cobre-mcp`, `cobre-python`, `cobre-tui`) require MPI at build or run time -- they use `cobre-comm` with TCP, shared-memory, or local backends. See [Backend Selection SS1.2](../specs/hpc/backend-selection.md) for feature flag combinations per build profile.

## Crates

| Crate                                 | Status                                                | Description                                                                                                       |
| ------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`cobre-core`](./core.md)             | <span class="status-experimental">experimental</span> | Power system data model — buses, branches, generators, loads, topology                                            |
| [`cobre-io`](./io.md)                 | <span class="status-experimental">experimental</span> | File parsers and serializers (JSON, Parquet, CSV, Arrow)                                                          |
| [`cobre-stochastic`](./stochastic.md) | <span class="status-experimental">experimental</span> | Stochastic processes — PAR(p) models, correlated scenario generation                                              |
| [`cobre-solver`](./solver.md)         | <span class="status-experimental">experimental</span> | LP/MIP solver abstraction with HiGHS and CLP backends                                                             |
| [`cobre-sddp`](./sddp.md)             | <span class="status-experimental">experimental</span> | Stochastic Dual Dynamic Programming for hydrothermal dispatch                                                     |
| [`cobre-cli`](./cli.md)               | <span class="status-experimental">experimental</span> | Command-line interface for running studies                                                                        |
| [`cobre-comm`](./comm.md)             | <span class="status-experimental">experimental</span> | Pluggable communication backend abstraction (Communicator trait, backend selection, four backend implementations) |
| [`cobre-mcp`](./mcp.md)               | <span class="status-experimental">experimental</span> | MCP server exposing Cobre operations as tools, resources, and prompts                                             |
| [`cobre-python`](./python.md)         | <span class="status-experimental">experimental</span> | PyO3 Python bindings for programmatic solver access                                                               |
| [`cobre-tui`](./tui.md)               | <span class="status-experimental">experimental</span> | Interactive terminal UI for real-time training monitoring                                                         |

## Related repositories

| Repository                  | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| [`ferrompi`](./ferrompi.md) | MPI 4.x bindings for Rust via FFI — optional dependency for distributed execution |

## Design principles

**`cobre-core` is the foundation.** Every solver and tool shares the same data types. A hydro plant defined for SDDP dispatch is the same struct used in a power flow study. This enables multi-domain analysis on a single system definition.

**Solvers are pluggable.** `cobre-solver` provides a trait-based abstraction with compile-time backend selection. The currently implemented backends are HiGHS and CLP (both open-source); commercial solvers like Gurobi can be added behind the same interface.

**Communication is pluggable.** `cobre-comm` provides a `Communicator` trait abstraction with compile-time backend selection via Cargo feature flags. The production backend (ferrompi/MPI) delivers zero-cost abstraction through monomorphization. Alternative backends (TCP, shared memory, local) enable deployment without MPI infrastructure.

**IO is separated from computation.** Reading JSON configs, loading Parquet time series, or exporting Arrow tables happens in `cobre-io`. Solver crates never touch files directly — they receive typed data structures.
