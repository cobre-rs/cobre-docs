# Ecosystem Vision

This document describes the Cobre ecosystem vision: a comprehensive, open-source platform for power system analysis and optimization, built as a modular set of Rust crates. It explains why the specification corpus designs infrastructure crates (core, solver, comm, io) to be domain-agnostic, and how SDDP-based hydrothermal dispatch serves as the first solver vertical in a broader roadmap. New contributors should read this document to understand the design intent before diving into component specifications.

## 1. Ecosystem Overview

Cobre is an open-source ecosystem of Rust crates for power system analysis and optimization. The name derives from the Portuguese word for copper — a conductor of electricity — reflecting the project's focus on electrical power systems and its origin in the Brazilian power sector research community.

### 1.1 The Problem Cobre Addresses

Power system software has long suffered from fragmentation. Most existing tools are either single-problem (an SDDP solver that cannot run power flow, or a power flow tool that has no stochastic capabilities) or single-language (a Julia ecosystem that cannot be embedded in a Python workflow, or a C++ solver with no ergonomic bindings). Research groups and system operators maintain parallel implementations of the same domain entities — hydro plants, thermal units, transmission lines — in separate codebases that cannot interoperate.

Cobre addresses this fragmentation by providing:

- A **shared data model** (`cobre-core`) defining power system entities once, used by all algorithms
- **File format interoperability** (`cobre-io`) so that inputs and outputs are not locked to a single solver
- **Modular solvers** where each algorithm is a vertical built on top of shared infrastructure

### 1.2 Architectural Inspirations

Cobre draws on design lessons from prior art in scientific computing and power systems:

| Ecosystem   | Language | Contribution to Cobre's Design                                   |
| ----------- | -------- | ---------------------------------------------------------------- |
| NREL Sienna | Julia    | Layered architecture separating data model from algorithms       |
| PowSyBl     | Java     | Format-agnostic I/O and pluggable solver backends                |
| SDDP.jl     | Julia    | Progressive SDDP algorithm structure and cut management patterns |
| SPARHTACUS  | C++      | High-performance MPI-parallel stochastic dispatch implementation |

Cobre is not a port of any of these tools. It shares architectural ideas while making different trade-offs: Rust for memory safety in parallel code, enum dispatch over runtime polymorphism, and a specification-first development process that produces verified behavioral contracts before implementation.

### 1.3 Current Status

Cobre is **experimental**. The specification corpus is complete for the first solver vertical (SDDP-based hydrothermal dispatch). The Rust implementation is in progress following the phased build sequence defined in [Implementation Ordering](./implementation-ordering.md). No production deployment should depend on Cobre until the experimental status is lifted.

---

## 2. Architectural Layers

The Cobre architecture is organized in five layers. Each layer depends only on layers below it. This dependency discipline is enforced by the Cargo workspace: crates in a higher layer cannot be imported by crates in a lower layer.

### 2.1 Foundation Layer

**Crate**: `cobre-core`

The foundation layer defines the power system entity model: `HydroPlant`, `Bus`, `ThermalUnit`, `TransmissionLine`, `PumpingStation`, and related structs. These entities are the shared vocabulary of the entire ecosystem. Every algorithm, from SDDP hydrothermal dispatch to Newton-Raphson power flow, operates on instances of these types.

The entity model is **generic** — it does not know about SDDP, about LP formulations, or about which algorithm will consume it. This is a deliberate design choice. See [Section 6](#6-design-principles-for-genericity) for the rationale.

### 2.2 Infrastructure Layer

**Crates**: `cobre-io`, `cobre-comm`, `ferrompi`

The infrastructure layer provides capabilities that any algorithm needs without embedding knowledge of any particular algorithm:

- `cobre-io` handles serialization and file format interoperability. It reads and writes JSON, Parquet, FlatBuffers, and CSV without knowing what algorithm will process the data.
- `cobre-comm` provides a communication abstraction over collective operations (broadcast, reduce, scatter, gather). It does not know the distributed algorithm being parallelized — only that some data needs to move between ranks.
- `ferrompi` provides safe Rust MPI bindings. It is maintained in a separate repository and can be used by any Rust project requiring MPI, not just Cobre.

### 2.3 Solver Abstraction Layer

**Crate**: `cobre-solver`

The solver abstraction layer defines an LP solver interface that wraps concrete solver backends (HiGHS, CLP) behind a uniform API. It does not know what optimization algorithm calls it — it only knows how to formulate, solve, and query an LP problem.

This layer exists to allow the same HiGHS or CLP backend to serve SDDP today, optimal power flow tomorrow, and future algorithms without modification. The LP interface is selected at compile time via Cargo features; enum dispatch handles algorithm-specific specialization above this layer. See [Solver Abstraction](../architecture/solver-abstraction.md) for the LP layout and interface design.

### 2.4 Solver Vertical Layer

**Crate**: `cobre-sddp` (and future verticals)

The solver vertical layer implements specific algorithms on top of the shared infrastructure. A vertical is a complete solution algorithm: it uses `cobre-core` entities, `cobre-io` formats, `cobre-solver` LP interface, and `cobre-comm` communication primitives, but adds algorithm-specific logic — Benders cuts, scenario trees, convergence criteria, output schemas.

`cobre-sddp` is the first vertical: Stochastic Dual Dynamic Programming for multi-stage hydrothermal dispatch. Its presence does not constrain the infrastructure layers; future verticals (power flow, OPF) will be added as sibling crates.

### 2.5 Application Layer

**Crates**: `cobre-cli`, `cobre-mcp`, `cobre-tui`, `cobre-python`, and future tools

The application layer provides user-facing interfaces. `cobre-cli` is the command-line entry point for running SDDP studies. `cobre-mcp` exposes Cobre capabilities via the Model Context Protocol for AI agent integration. `cobre-tui` provides a terminal-based monitoring interface. `cobre-python` provides PyO3-based Python bindings.

Application-layer crates are the only layer that may depend on a specific solver vertical. This means `cobre-cli` currently depends on `cobre-sddp`, but a future `cobre-opf-cli` would depend on a hypothetical `cobre-opf` vertical instead.

---

## 3. Crate Map

| Crate              | Status       | Role                           | Generic?                                               | Notes               |
| ------------------ | ------------ | ------------------------------ | ------------------------------------------------------ | ------------------- |
| `cobre-core`       | experimental | Power system entity model      | Yes — domain entities work across all applications     | Primary crate       |
| `cobre-io`         | experimental | Serialization, file formats    | Yes — format-agnostic                                  | Primary crate       |
| `cobre-solver`     | experimental | LP solver abstraction          | Yes — wraps any LP solver                              | Primary crate       |
| `cobre-stochastic` | experimental | Scenario generation framework  | Yes — PAR(p) is the first implementation               | Primary crate       |
| `cobre-comm`       | experimental | Communication abstraction      | Yes — wraps MPI or single-process execution            | Primary crate       |
| `cobre-sddp`       | experimental | SDDP hydrothermal dispatch     | No — first solver vertical                             | Primary crate       |
| `cobre-cli`        | experimental | CLI entry point                | No — SDDP-specific CLI                                 | Application         |
| `cobre-mcp`        | experimental | MCP server for AI agent access | Partial — protocol is generic; tools are SDDP-specific | Application         |
| `cobre-tui`        | experimental | Terminal UI for run monitoring | No — SDDP training visualization                       | Application         |
| `cobre-python`     | experimental | Python bindings via PyO3       | No — exposes SDDP workflow to Python callers           | Application         |
| `ferrompi`         | experimental | Safe MPI Rust bindings         | Yes — general MPI wrapping, not Cobre-specific         | Separate repository |

---

## 4. Solver Verticals

### 4.1 The Vertical Concept

A solver vertical is a complete solution algorithm built on top of the shared infrastructure layers. The defining characteristic of a vertical is that it can be added or replaced without modifying the foundation, infrastructure, or solver abstraction layers. Each vertical uses:

- `cobre-core` entities — the same `HydroPlant`, `Bus`, `ThermalUnit` structs
- `cobre-io` formats — the same JSON, Parquet, and FlatBuffers files
- `cobre-solver` LP interface — the same HiGHS and CLP backends
- `cobre-comm` collective operations — the same MPI broadcast and reduce primitives

What varies between verticals is the algorithm: how the LP is formulated, how iterates are generated, what convergence criteria apply, and what outputs are produced.

### 4.2 SDDP (Current, Experimental)

Stochastic Dual Dynamic Programming for multi-stage hydrothermal dispatch. The algorithm implements Benders decomposition over time stages, computing piecewise-linear value function approximations (cuts) that propagate future cost information backward from the last stage to the first. Forward and backward passes alternate until the gap between lower and upper cost bounds falls below the stopping criterion.

SDDP is the first vertical because hydrothermal dispatch under uncertainty is the founding problem that motivated the Cobre ecosystem. The full specification is in the `src/specs/` tree; the phased implementation plan is in [Implementation Ordering](./implementation-ordering.md).

### 4.3 Power Flow (Planned, Phase 2)

Newton-Raphson AC power flow and DC power flow approximation. Both formulations use the same `Bus`, `TransmissionLine`, and `ThermalUnit` entities from `cobre-core`. The DC formulation uses `cobre-solver` for the LP relaxation; the AC formulation uses an iterative nonlinear solver. Planned for Phase 2 after the SDDP vertical reaches production-grade status.

### 4.4 Optimal Power Flow (Planned, Phase 2)

AC-OPF and DC-OPF on top of the power flow vertical. DC-OPF uses the `cobre-solver` LP interface directly. AC-OPF extends it with quadratic terms. Both use the same entity model and file formats as power flow and SDDP, enabling combined studies that run dispatch and power flow on the same system model.

### 4.5 Future Verticals

The following verticals are on the long-term roadmap but have no active specification work:

- **Dynamic Simulation**: Time-domain simulation for voltage and frequency stability analysis.
- **Battery and Storage Optimization**: Storage dispatch with renewable uncertainty, extending the stochastic framework of `cobre-stochastic`.
- **Renewable Integration Studies**: Capacity expansion with intermittent generation and storage, using `cobre-stochastic` for scenario generation.

---

## 5. Roadmap Phases

### 5.1 Phase 0 — SDDP Specification and Initial Implementation (Current)

Goal: production-grade hydrothermal dispatch solver.

The specification corpus for the SDDP vertical is complete. The Rust implementation proceeds through the 8-phase build sequence defined in [Implementation Ordering](./implementation-ordering.md), starting from `cobre-core` and building up to `cobre-cli`. Experimental status applies to the entire stack.

Deliverables at Phase 0 completion:

- Validated SDDP training and simulation binary
- Python bindings for study automation
- Benchmark suite for production-scale cases (164 hydros, 120 stages)
- NEWAVE validation demonstrating result equivalence on reference cases

### 5.2 Phase 1 — Hardening and Ecosystem Tooling

Goal: ecosystem maturity and broad adoption readiness.

- Python bindings (`cobre-python`): PyO3 API with zero-copy data paths for result analysis
- Terminal UI (`cobre-tui`): convergence monitoring and interactive run management
- MCP server (`cobre-mcp`): AI agent access to Cobre runs, results, and diagnostics
- Additional I/O formats: NEWAVE input compatibility, additional Parquet schemas
- NEWAVE validation suite: systematic comparison against the reference Brazilian hydrothermal dispatch tool

### 5.3 Phase 2 — Power System Expansion

Goal: make Cobre useful for power system studies beyond stochastic dispatch.

- Newton-Raphson AC power flow vertical
- DC power flow vertical
- AC-OPF and DC-OPF verticals
- Web-based visualization for power flow results
- Cross-vertical workflows: run SDDP dispatch, then power flow validation on the same system model

### 5.4 Future Directions

The following items have no committed timeline but are design-compatible with the current architecture:

- Dynamic simulation and stability analysis
- Renewable uncertainty models beyond PAR(p) (e.g., VAR models, copula-based spatial correlation)
- Battery and storage optimization vertical
- SCADA data integration for real-time dispatch support
- MCP server expansion for AI-assisted power system analysis workflows

---

## 6. Design Principles for Genericity

The infrastructure crates (`cobre-core`, `cobre-io`, `cobre-solver`, `cobre-stochastic`, `cobre-comm`) are deliberately generic — they contain no SDDP-specific logic. This section explains why.

### 6.1 Shared Entity Model

The same `HydroPlant`, `Bus`, or `ThermalUnit` struct works whether the algorithm is a 10-year stochastic dispatch study or a steady-state power flow calculation. Defining these entities once in `cobre-core` prevents the divergence that occurs when multiple tools each maintain their own representation of the same physical equipment.

Divergence is not a theoretical risk. In production power system toolchains, it is common to find hydro plant data described by different attribute sets in a dispatch tool and a power flow tool maintained by the same organization. Reconciling these divergent representations before each combined study is a recurring, error-prone manual step. Cobre eliminates it by defining the entity model once and making every algorithm consume it.

### 6.2 Solver Abstraction Independence

`cobre-solver` defines an LP interface without knowing the calling algorithm. This allows the same HiGHS backend to serve SDDP subproblems, DC-OPF problems, and future algorithms without any modification to the solver abstraction layer. The calling algorithm changes; the backend does not.

The alternative — a solver abstraction tailored to SDDP — would require a new abstraction layer for each subsequent vertical, multiplying FFI binding maintenance burden with each new algorithm. The generic interface costs marginally more to design once and saves unbounded maintenance work across the ecosystem's lifetime.

### 6.3 Communication Layer Isolation

`cobre-comm` provides collective operations (broadcast, reduce, scatter, gather) without knowing the distributed algorithm. The same MPI infrastructure supports SDDP backward-pass cut aggregation across ranks and will support future distributed power flow without any modification.

The communication layer isolation also enables the single-process fallback: when `cobre-comm` is configured for single-process execution, the same algorithm code runs without any MPI dependency. This makes development and testing on a laptop identical to deployment on a 256-node HPC cluster.

### 6.4 Scenario Generation Framework

`cobre-stochastic` provides a sampling abstraction that any algorithm can use. PAR(p) autoregressive models for hydro inflows are the first implementation. Future verticals (renewable integration, battery dispatch) can register their own stochastic models in the same framework without touching the SDDP codebase.

The abstraction boundary also simplifies validation: the stochastic model is tested independently of the optimization algorithm, so a regression in scenario generation is immediately localized to `cobre-stochastic` rather than buried in the SDDP training loop.

### 6.5 Forward Compatibility

Generic designs cost little at the point of initial implementation. The `cobre-core` entity model is no more complex because it avoids SDDP-specific fields; the `cobre-comm` API is no harder to implement because it does not know the algorithm it serves. The cost of genericity is paid once in design; the benefit compounds with each new vertical that reuses existing infrastructure rather than reimplementing it.

The alternative — SDDP-specific infrastructure — would require a large refactoring effort before the first power flow vertical could be added. Cobre's architecture is chosen to avoid this refactoring cost by treating genericity as a first-class requirement from the start.

---

## Cross-References

- [Design Principles](./design-principles.md) — Detailed design principles governing format selection, declaration order invariance, and agent-readability across the specification corpus
- [Ecosystem Guidelines](./ecosystem-guidelines.md) — Durable authoring conventions for the Cobre specification corpus; invariants checklist for spec authoring tasks
- [Implementation Ordering](./implementation-ordering.md) — 8-phase build sequence for the SDDP vertical with per-phase spec reading lists and dependency DAG
- [cobre-core crate overview](../../crates/core.md) — Power system entity model: entity types, collection structs, and canonicalization requirements
- [cobre-solver crate overview](../../crates/solver.md) — LP solver abstraction: HiGHS and CLP backends, compile-time selection, solver workspace design
- [cobre-sddp crate overview](../../crates/sddp.md) — SDDP hydrothermal dispatch vertical: training loop, cut management, scenario pipeline
- [Solver Abstraction](../architecture/solver-abstraction.md) — LP variable layout, solver interface design, and compile-time backend selection
- [Scenario Generation](../architecture/scenario-generation.md) — PAR(p) scenario generation pipeline, sampling abstraction, and inflow model integration
