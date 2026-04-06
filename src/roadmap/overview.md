# Roadmap

> **The minimal viable solver is complete (v0.4.1, April 2026).** All 8 implementation phases are done: the full SDDP training loop, simulation pipeline, policy checkpointing, FPHA computed from geometry, Python bindings (3.12/3.13/3.14), and the `cobre-cli` binary with `init`, `run`, `validate`, `report`, `summary`, and `version` subcommands are all shipped. The workspace ships ~3,400 tests. The features listed below represent post-MVP development — they are not prerequisites for a working solver.

This section describes planned features for Cobre that are not yet implemented. The features listed here represent the team's current thinking about where the solver is headed — they are directional plans, not committed timelines or version targets.

Each feature has been analyzed for feasibility and grouped by theme. The thematic pages below provide detail on motivation, prerequisites, and planned approach for each feature.

> **Note**: Feature C.5 (Non-Controllable Sources) was originally deferred but is now fully implemented. It appears in the table below for historical reference with status "Implemented". All other features remain planned.

## Feature Index

| ID   | Feature                          | Theme                                                     | Effort              |
| ---- | -------------------------------- | --------------------------------------------------------- | ------------------- |
| C.1  | GNL Thermal Plants               | [Equipment & Modeling](./equipment-modeling.md)           | Large (3-4 wk)      |
| C.2  | Battery Energy Storage Systems   | [Equipment & Modeling](./equipment-modeling.md)           | Medium (2-3 wk)     |
| C.3  | Multi-Cut Formulation            | [Algorithm Variants](./algorithm-variants.md)             | Medium (2-3 wk)     |
| C.4  | Markovian Policy Graphs          | [Algorithm Variants](./algorithm-variants.md)             | Large (3-4 wk)      |
| C.5  | Non-Controllable Sources         | [Equipment & Modeling](./equipment-modeling.md)           | Implemented         |
| C.6  | FPHA Enhancements                | [Equipment & Modeling](./equipment-modeling.md)           | Med-Large (2-4 wk)  |
| C.7  | Temporal Scope Decoupling        | [Algorithm Variants](./algorithm-variants.md)             | Large (4-6 wk)      |
| C.8  | CEPEL PAR(p)-A Variant           | [Stochastic Enhancements](./stochastic-enhancements.md)   | Small-Med (1-2 wk)  |
| C.9  | Policy Compatibility Validation  | [Tooling & Interfaces](./tooling-interfaces.md)           | Medium (2-3 wk)     |
| C.10 | Fine-Grained Temporal Resolution | [Stochastic Enhancements](./stochastic-enhancements.md)   | Large (4-6 wk)      |
| C.11 | User-Supplied Noise Openings     | [Stochastic Enhancements](./stochastic-enhancements.md)   | Small (1 wk)        |
| C.12 | Complete Tree Solver             | [Algorithm Variants](./algorithm-variants.md)             | Med-Large (3-4 wk)  |
| C.13 | Alternative Forward Pass         | [Performance & Parallelism](./performance-parallelism.md) | Medium (2-3 wk)     |
| C.14 | Monte Carlo Backward Sampling    | [Stochastic Enhancements](./stochastic-enhancements.md)   | Small (1 wk)        |
| C.15 | Risk-Adjusted Forward Sampling   | [Stochastic Enhancements](./stochastic-enhancements.md)   | Medium (2-3 wk)     |
| C.16 | Revisiting Forward Pass          | [Performance & Parallelism](./performance-parallelism.md) | Small-Med (1-2 wk)  |
| C.17 | Forward Pass State Deduplication | [Performance & Parallelism](./performance-parallelism.md) | Small-Med (<1-3 wk) |
| C.18 | Pipelined Backward Pass          | [Performance & Parallelism](./performance-parallelism.md) | Medium (2-3 wk)     |
| C.19 | Dynamic Forward-Passes Scheduler | [Performance & Parallelism](./performance-parallelism.md) | TBD                 |

Each feature page below provides details on motivation, prerequisites, and planned approach.
