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
  └── cobre-core
```

## Crates

| Crate                                 | Status                                                | Description                                                            |
| ------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| [`cobre-core`](./core.md)             | <span class="status-experimental">experimental</span> | Power system data model — buses, branches, generators, loads, topology |
| [`cobre-io`](./io.md)                 | <span class="status-experimental">experimental</span> | File parsers and serializers (NEWAVE, CSV, JSON, Arrow)                |
| [`cobre-stochastic`](./stochastic.md) | <span class="status-experimental">experimental</span> | Stochastic processes — PAR(p) models, correlated scenario generation   |
| [`cobre-solver`](./solver.md)         | <span class="status-experimental">experimental</span> | LP/MIP solver abstraction with HiGHS and CLP backends                  |
| [`cobre-sddp`](./sddp.md)             | <span class="status-experimental">experimental</span> | Stochastic Dual Dynamic Programming for hydrothermal dispatch          |
| [`cobre-cli`](./cli.md)               | <span class="status-experimental">experimental</span> | Command-line interface for running studies                             |

## Related repositories

| Repository                  | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| [`ferrompi`](./ferrompi.md) | MPI 4.x bindings for Rust via FFI — optional dependency for distributed execution |

## Design principles

**`cobre-core` is the foundation.** Every solver and tool shares the same data types. A hydro plant defined for SDDP dispatch is the same struct used in a power flow study. This enables multi-domain analysis on a single system definition.

**Solvers are pluggable.** `cobre-solver` provides a trait-based abstraction with compile-time backend selection. The currently implemented backends are HiGHS and CLP (both open-source); commercial solvers like Gurobi can be added behind the same interface.

**IO is separated from computation.** Parsing NEWAVE files, reading TOML configs, or exporting Arrow tables happens in `cobre-io`. Solver crates never touch files directly — they receive typed data structures.
