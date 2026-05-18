# Cobre

> Open infrastructure for power system computation.

Cobre is an ecosystem of Rust crates for power system analysis and optimization. The name comes from the Portuguese word for **copper** — the metal that conducts electricity. The project is licensed under [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE).

## This site is the methodology reference

This site documents the theory and computational strategies behind Cobre. It is written for:

- hydrothermal-planning analysts
- optimization researchers
- modellers preparing cases
- decision-makers reading executive-level rationale

**What you will find here:**

- **Theory** — The mathematical foundations: SDDP and Benders decomposition, stochastic inflow modeling with PAR(p), cut management strategies, and risk measures including CVaR.
- **Modeling reference** — The modeling decisions made for handling how the power system and the stochastic processes for dealing with uncertainties in the generation resources are represented.
- **Examples** — Worked reduced examples that allow the users to understand the algorithm's basic principles and create some intuition behind what might be going on in the production cases.
- **Reference** — Glossary of domain terms and bibliography.

## Cobre developer guide

For implementation details — trait signatures, struct layouts, build profiles, FFI contracts, parallelism mechanics — see the cobre developer-guide.

## Quick links

|         |                                                                   |
| ------- | ----------------------------------------------------------------- |
| GitHub  | [github.com/cobre-rs/cobre](https://github.com/cobre-rs/cobre)    |
| License | [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE) |
