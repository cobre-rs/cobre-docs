# Mathematical Formulations

This section contains the formal mathematical specifications that define Cobre's optimization model. Together, these 14 specs describe the complete LP formulation solved at each stage of the SDDP algorithm, the stochastic processes that drive uncertainty, the cut management strategies that approximate the cost-to-go function, and the convergence machinery that determines when a policy is good enough.

Every constraint, variable bound, and algorithmic step that Cobre implements traces back to one of these pages. The specs are written to be precise enough to serve as a direct implementation reference: a developer should be able to read a spec and translate it into solver API calls without ambiguity. Where design choices exist (e.g., single-cut vs. multi-cut, constant vs. piecewise-linear productivity), each spec enumerates the supported variants and their configuration knobs.

The formulations assume familiarity with linear programming duality, the Bellman equation for multistage stochastic programs, and the basic SDDP decomposition scheme. Readers new to these topics should start with the [Algorithm Reference](../algorithms/sddp-theory.md) section, which provides tutorial-style explanations, before diving into the specs here.

## Reading Order

The specs have cross-references, so reading order matters. The following sequence builds concepts incrementally:

1. **[SDDP Algorithm](./math/sddp-algorithm.md)** -- Start here. Establishes the policy graph, state variables, Bellman recursion, and the single-cut vs. multi-cut distinction that the rest of the specs build on.
2. **[System Elements](./math/system-elements.md)** -- Defines every physical element (hydro plants, thermal units, buses, transmission lines, contracts) and its variables. Required context for reading any constraint formulation.
3. **[LP Formulation](./math/lp-formulation.md)** -- The complete stage subproblem: objective function, all constraint families, and the dual variables used for cut generation.
4. **[Hydro Production Models](./math/hydro-production-models.md)** -- How water-to-energy conversion is modeled: constant productivity, FPHA hyperplanes, and linearized head.
5. **[Equipment Formulations](./math/equipment-formulations.md)** -- Thermal dispatch, transmission limits, energy contracts, pumping stations, and non-controllable sources.
6. **[Block Formulations](./math/block-formulations.md)** -- Parallel and chronological block structures, and how they affect constraint aggregation.
7. **[Cut Management](./math/cut-management.md)** -- Cut generation, aggregation, selection strategies (Level 1, LML1), and dominated-cut detection.
8. **[PAR Inflow Model](./math/par-inflow-model.md)** -- The periodic autoregressive model for stochastic inflows: fitting, validation, and scenario generation.

The remaining specs can be read in any order after the first eight:

- **[Discount Rate](./math/discount-rate.md)** -- Stage-dependent discount factors and their effect on the Bellman equation.
- **[Infinite Horizon](./math/infinite-horizon.md)** -- Periodic policy graphs, cycle detection, and cross-cycle cut sharing.
- **[Risk Measures](./math/risk-measures.md)** -- CVaR, convex combination with expectation, and risk-averse cut generation.
- **[Inflow Non-Negativity](./math/inflow-nonnegativity.md)** -- Strategies for handling negative synthetic inflows from the PAR model.
- **[Stopping Rules](./math/stopping-rules.md)** -- Iteration limits, time limits, bound stalling, and simulation-based gap tests.
- **[Upper Bound Evaluation](./math/upper-bound-evaluation.md)** -- Statistical upper bound computation and optimality gap estimation.

## Spec Index

| Spec                                                         | Description                                                                     | Algorithm Reference                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [SDDP Algorithm](./math/sddp-algorithm.md)                   | Policy graph, state variables, Bellman recursion, single-cut vs. multi-cut      | [SDDP Theory](../algorithms/sddp-theory.md), [Benders Decomposition](../algorithms/benders.md)     |
| [LP Formulation](./math/lp-formulation.md)                   | Stage subproblem objective, constraints, and dual variables                     | [Forward and Backward Passes](../algorithms/forward-backward.md)                                   |
| [System Elements](./math/system-elements.md)                 | Physical elements, their decision variables, and interconnections               | --                                                                                                 |
| [Block Formulations](./math/block-formulations.md)           | Parallel and chronological blocks, policy compatibility validation              | --                                                                                                 |
| [Hydro Production Models](./math/hydro-production-models.md) | Constant productivity, FPHA hyperplanes, linearized head                        | --                                                                                                 |
| [Cut Management](./math/cut-management.md)                   | Cut generation, aggregation, Level 1 / LML1 selection, dominance detection      | [Cut Management](../algorithms/cut-management.md), [Cut Selection](../algorithms/cut-selection.md) |
| [Discount Rate](./math/discount-rate.md)                     | Discounted Bellman equation, stage-dependent discount factors                   | --                                                                                                 |
| [Infinite Horizon](./math/infinite-horizon.md)               | Periodic policy graph, cycle detection, cross-cycle cut sharing                 | [Convergence](../algorithms/convergence.md)                                                        |
| [Risk Measures](./math/risk-measures.md)                     | CVaR, convex combination with expectation, risk-averse cuts, per-stage profiles | [Risk Measures](../algorithms/risk-measures.md), [CVaR](../algorithms/cvar.md)                     |
| [Inflow Non-Negativity](./math/inflow-nonnegativity.md)      | Truncation, penalty, and hybrid strategies for negative synthetic inflows       | [Scenario Generation](../algorithms/scenario-generation.md)                                        |
| [PAR Inflow Model](./math/par-inflow-model.md)               | PAR(p) model definition, stored vs. computed quantities, fitting, validation    | [PAR(p) Models](../algorithms/par-model.md)                                                        |
| [Equipment Formulations](./math/equipment-formulations.md)   | Thermal, transmission, contracts, pumping, NCS, simulation-only enhancements    | --                                                                                                 |
| [Stopping Rules](./math/stopping-rules.md)                   | Iteration limit, time limit, bound stalling, simulation-based gap test          | [Convergence](../algorithms/convergence.md)                                                        |
| [Upper Bound Evaluation](./math/upper-bound-evaluation.md)   | Inner approximation, Lipschitz interpolation, statistical gap computation       | [Convergence](../algorithms/convergence.md)                                                        |

## Conventions

All specs in this section use the notation defined in [Notation Conventions](./overview/notation-conventions.md). Index sets, symbol definitions, and unit conventions are established there and are not repeated in individual spec pages.

The [System Elements](./math/system-elements.md) spec extends that notation with the concrete variables and parameters for each power system component. It serves as a second prerequisite for reading any constraint formulation -- the LP Formulation, Equipment Formulations, and Hydro Production Models specs all reference variables introduced there.
