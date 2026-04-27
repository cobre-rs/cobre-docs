# Cobre

> Open infrastructure for power system computation.

Cobre is an ecosystem of Rust crates for power system analysis and optimization. The name comes from the Portuguese word for **copper** — the metal that conducts electricity. The project is licensed under [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE).

## This site is the methodology reference

This site documents the theory and computational strategies begin cobre. It is written for researchers, algorithm designers, and contributors who need to understand why the system works the way it does.

**What you will find here:**

- **Theory** — The mathematical foundations: SDDP and Benders decomposition, stochastic inflow modeling with PAR(p), cut management strategies, and risk measures including CVaR.
- **Modeling reference** — The modeling decisions made for handling how the power system and the stochastic processes for dealing with uncertainties in the generation resources are represented.
- **Examples** — Worked reduced examples that allow the users to understand the algorithm's basic principles and create some intuition behind what might be going on in the production cases.
- **Reference** — Glossary of domain terms, notation conventions, and bibliography.

## Software Book

For installation instructions, tutorials, user guides, CLI reference, and per-crate API documentation, see the **[Software Book](https://docs.cobre-rs.dev/)**.

The software book describes what the software does today. This site describes the theory and design decisions behind it.

## Quick links

|                    |                                                                   |
| ------------------ | ----------------------------------------------------------------- |
| GitHub             | [github.com/cobre-rs/cobre](https://github.com/cobre-rs/cobre)    |
| Software Book      | [docs.cobre-rs.dev](https://docs.cobre-rs.dev/)                   |
| API docs (rustdoc) | [docs.rs/cobre-core](https://docs.rs/cobre-core)                  |
| License            | [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE) |
