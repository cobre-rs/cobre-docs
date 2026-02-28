# Cobre

**Open infrastructure for power system computation. Built in Rust.**

Cobre is an ecosystem of Rust crates for power system analysis and optimization. It provides a shared data model, file format interoperability, and modular solvers — starting with stochastic optimization for hydrothermal dispatch (SDDP) and designed to grow into power flow, dynamic simulation, and beyond.

The name comes from the Portuguese word for **copper** — the metal that conducts electricity.

## Who is this for?

- **Power system engineers** who need open, auditable alternatives to legacy planning tools
- **Researchers** working on stochastic optimization, hydrothermal scheduling, or energy policy
- **Developers** building tools that need a reliable power system data model and solver infrastructure

## What does Cobre provide?

**A shared data model.** The same `HydroPlant`, `Bus`, or `ThermalUnit` struct works whether you're running a 10-year stochastic dispatch or a steady-state power flow. Define your system once, analyze it from multiple angles.

**Production performance.** Rust gives us C/C++-level speed with memory safety guarantees. For software that dispatches national power grids, both matter.

**Interoperability.** Standard data formats (JSON, Parquet, Arrow) for input and output. Planned support for other file formats to enable migration from existing tools.

**Modularity.** Pick the crates you need. Use `cobre-core` for data modeling without pulling in solver dependencies. Use `cobre-sddp` without caring about power flow.

## Current status

<div class="warning">
Cobre is under active development. All crates are <strong>experimental</strong> — APIs will change without notice. Do not use in production yet.
</div>

See the [roadmap](https://github.com/cobre-rs/cobre#roadmap) for planned milestones.

## Quick links

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| GitHub             | [github.com/cobre-rs](https://github.com/cobre-rs)                |
| Main repository    | [cobre-rs/cobre](https://github.com/cobre-rs/cobre)               |
| API docs (rustdoc) | [docs.rs/cobre-core](https://docs.rs/cobre-core)                  |
| License            | [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE) |

## Context

Cobre was born from the need for an open, modern alternative to enabling power system planning research in Brazil. The project draws on algorithmic insights from SDDP.jl, architectural ideas from NREL Sienna and PowSyBl, and the auditable pre-processing approach from SPARHTACUS.
