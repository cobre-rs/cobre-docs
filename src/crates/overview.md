# Crate Overview

Cobre is organized as a Cargo workspace with multiple crates. Each crate has a focused responsibility, and they compose together through shared types defined in `cobre-core`.

## Dependency graph

```
cobre-cli
  ├── cobre-sddp
  │     ├── cobre-core
  │     ├── cobre-stochastic
  │     └── cobre-solver
  ├── cobre-io
  │     └── cobre-core
  ├── cobre-tui                  [NEW]
  │     └── cobre-core           (event type definitions only)
  └── cobre-core

cobre-mcp                        [NEW, standalone server binary]
  ├── cobre-sddp
  ├── cobre-io
  └── cobre-core

cobre-python                     [NEW, PyO3 cdylib]
  ├── cobre-sddp
  ├── cobre-io
  └── cobre-core

ferrompi (optional, MPI execution only)
  used by: cobre-sddp, cobre-cli
  NOT used by: cobre-mcp, cobre-python, cobre-tui
```

**Key property**: None of the three new crates depend on `ferrompi`. They share the single-process execution path through `cobre-sddp` with OpenMP parallelism only.

## Crates

| Crate                                 | Status                                                | Description                                                            |
| ------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| [`cobre-core`](./core.md)             | <span class="status-experimental">experimental</span> | Power system data model — buses, branches, generators, loads, topology |
| [`cobre-io`](./io.md)                 | <span class="status-experimental">experimental</span> | File parsers and serializers (JSON, Parquet, CSV, Arrow)               |
| [`cobre-stochastic`](./stochastic.md) | <span class="status-experimental">experimental</span> | Stochastic processes — PAR(p) models, correlated scenario generation   |
| [`cobre-solver`](./solver.md)         | <span class="status-experimental">experimental</span> | LP/MIP solver abstraction with HiGHS and CLP backends                  |
| [`cobre-sddp`](./sddp.md)             | <span class="status-experimental">experimental</span> | Stochastic Dual Dynamic Programming for hydrothermal dispatch          |
| [`cobre-cli`](./cli.md)               | <span class="status-experimental">experimental</span> | Command-line interface for running studies                             |
| [`cobre-mcp`](./mcp.md)               | <span class="status-experimental">experimental</span> | MCP server exposing Cobre operations as tools, resources, and prompts  |
| [`cobre-python`](./python.md)         | <span class="status-experimental">experimental</span> | PyO3 Python bindings for programmatic solver access                    |
| [`cobre-tui`](./tui.md)               | <span class="status-experimental">experimental</span> | Interactive terminal UI for real-time training monitoring              |

## Related repositories

| Repository                  | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| [`ferrompi`](./ferrompi.md) | MPI 4.x bindings for Rust via FFI — optional dependency for distributed execution |

## Design principles

**`cobre-core` is the foundation.** Every solver and tool shares the same data types. A hydro plant defined for SDDP dispatch is the same struct used in a power flow study. This enables multi-domain analysis on a single system definition.

**Solvers are pluggable.** `cobre-solver` provides a trait-based abstraction with compile-time backend selection. The currently implemented backends are HiGHS and CLP (both open-source); commercial solvers like Gurobi can be added behind the same interface.

**IO is separated from computation.** Reading JSON configs, loading Parquet time series, or exporting Arrow tables happens in `cobre-io`. Solver crates never touch files directly — they receive typed data structures.
