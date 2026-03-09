# Cobre

> Open infrastructure for power system computation.

Cobre is an ecosystem of Rust crates for power system analysis and optimization. The name comes from the Portuguese word for **copper** — the metal that conducts electricity. The project is licensed under [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE).

## This site is the methodology reference

This site documents the theory, design specifications, and roadmap behind Cobre. It is written for researchers, algorithm designers, and contributors who need to understand why the system works the way it does.

**What you will find here:**

- **Theory** — The mathematical foundations: SDDP and Benders decomposition, stochastic inflow modeling with PAR(p), cut management strategies, and risk measures including CVaR.
- **Specifications archive** — The design-phase artifacts that governed each implementation phase: data model schemas, architectural trait contracts, HPC communication patterns, and testing contracts.
- **Roadmap** — Planned features and deferred variants, with rationale for what was prioritized in the minimal viable solver.
- **Reference** — Glossary of domain terms, notation conventions, and bibliography.

## Software Book

For installation instructions, tutorials, user guides, CLI reference, and per-crate API documentation, see the **[Software Book](https://cobre-rs.github.io/cobre/)**.

The software book describes what the software does today. This site describes the theory and design decisions behind it.

## Quick links

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| GitHub             | [github.com/cobre-rs/cobre](https://github.com/cobre-rs/cobre)    |
| Software Book      | [cobre-rs.github.io/cobre](https://cobre-rs.github.io/cobre/)     |
| API docs (rustdoc) | [docs.rs/cobre-core](https://docs.rs/cobre-core)                  |
| License            | [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE) |
