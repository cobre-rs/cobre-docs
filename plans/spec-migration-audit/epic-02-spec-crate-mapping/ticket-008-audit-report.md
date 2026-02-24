# ticket-008 Audit Report: Spec-to-Crate Mapping for Math and Architecture Specs

**Date**: 2026-02-24
**Auditor**: sddp-specialist (automated)
**Scope**: 14 math specs + 13 architecture specs = 27 files
**Verdict**: All 27 files have correct primary crate assignments. 3 architecture placement decisions documented. 0 HIGH findings. 4 LOW findings.

---

## Table of Contents

1. [Check M1 -- Math Section Mapping (14 files)](#check-m1----math-section-mapping-14-files)
2. [Check M2 -- Architecture Section Mapping (13 files)](#check-m2----architecture-section-mapping-13-files)
3. [Check M3 -- Documented Decisions for Architecture Ambiguities](#check-m3----documented-decisions-for-architecture-ambiguities)
4. [Check M4 -- SUMMARY.md Verification](#check-m4----summarymd-verification)
5. [27-Row Mapping Table](#27-row-mapping-table)
6. [Findings Summary](#findings-summary)

---

## Check M1 -- Math Section Mapping (14 files)

### Methodology

For each file in `src/specs/math/`, the Purpose section was read to determine the primary subject matter, and the crate assignment was evaluated against the cobre-docs taxonomy (`specs/math/` = mathematical formulations) and the crate responsibility definitions from ticket-006.

### Per-File Analysis

#### 1. `sddp-algorithm.md`

- **Purpose**: "This spec describes the Stochastic Dual Dynamic Programming (SDDP) algorithm as implemented in Cobre: the multistage stochastic formulation, the iterative forward/backward pass structure, convergence monitoring, policy graph topologies, state variable requirements, and the single-cut vs multi-cut trade-off."
- **Primary Crate**: `cobre-sddp` -- defines the core SDDP algorithm that `cobre-sddp` implements
- **Secondary Crate(s)**: None
- **Placement**: Correct. Mathematical formulation of the SDDP algorithm belongs in `specs/math/`.

#### 2. `lp-formulation.md`

- **Purpose**: "This spec presents the complete stage subproblem LP for the Cobre SDDP solver: the objective function with its cost taxonomy, all constraint families, slack/penalty variables, and the Benders cut interface to the future cost function."
- **Primary Crate**: `cobre-sddp` -- the stage LP is constructed and solved by `cobre-sddp`
- **Secondary Crate(s)**: `cobre-core` (entity data feeds LP construction), `cobre-solver` (solver interface for LP operations)
- **Placement**: Correct.

#### 3. `system-elements.md`

- **Purpose**: "This spec describes the physical components of a hydrothermal power system as modeled by Cobre: what each element represents, its decision variables, how it connects to other elements, and its role in the optimization objective."
- **Primary Crate**: `cobre-core` -- defines the entity types (buses, hydros, thermals, lines, contracts, NCS, pumping stations) that `cobre-core` implements as entity registries
- **Secondary Crate(s)**: `cobre-sddp` -- the LP construction in `cobre-sddp` uses these element definitions to build constraints
- **Placement**: Correct. The spec is a mathematical formulation of physical elements, not a data schema. The `specs/math/` placement reflects that this is the conceptual foundation for the LP, not the data format.

#### 4. `block-formulations.md`

- **Purpose**: "This spec defines the two block formulations supported by Cobre -- parallel and chronological -- which determine how intra-stage time periods are handled in the LP."
- **Primary Crate**: `cobre-sddp` -- block formulations are LP structural variants implemented in stage LP construction
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 5. `hydro-production-models.md`

- **Purpose**: "This spec defines the hydro generation constraint models supported by Cobre, which relate turbined flow and reservoir storage to electrical output. Two models are available during training: constant productivity and FPHA."
- **Primary Crate**: `cobre-sddp` -- the FPHA hyperplane constraints are LP components assembled during stage LP construction
- **Secondary Crate(s)**: `cobre-core` -- hydro entity data (geometry polynomials, productivity parameters, FPHA hyperplane data) is stored in the core data model
- **Placement**: Correct. The spec defines the mathematical relationship between physical quantities and LP constraints. The dual nature (data in `cobre-core`, LP formulation in `cobre-sddp`) is inherent to the problem domain.

#### 6. `cut-management.md`

- **Purpose**: "This spec defines the complete Benders cut lifecycle in Cobre: what cuts represent mathematically, how cut coefficients relate to LP dual variables, how per-scenario cuts are aggregated into a single cut, under what conditions cuts are valid, and what selection strategies are available."
- **Primary Crate**: `cobre-sddp` -- cut generation, aggregation, selection, and validity are core SDDP algorithm operations
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 7. `discount-rate.md`

- **Purpose**: "This spec defines how discount rates are incorporated into the Cobre SDDP solver: the discounted Bellman equation, stage-dependent discount factors, effect on the future cost variable theta."
- **Primary Crate**: `cobre-sddp` -- discounting modifies the Bellman equation and cut computation, both implemented in `cobre-sddp`
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 8. `infinite-horizon.md`

- **Purpose**: "This spec defines the infinite periodic horizon formulation for Cobre SDDP: the periodic structure, convergence requirements, cut sharing within cycles, modified forward and backward pass behavior."
- **Primary Crate**: `cobre-sddp` -- the cyclic policy graph is a horizon mode variant of the training loop
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 9. `risk-measures.md`

- **Purpose**: "This spec defines the risk-averse SDDP formulation used in Cobre, based on Conditional Value-at-Risk (CVaR). It covers the CVaR definition, the convex combination risk measure, dual representations, the risk-averse subgradient theorem, modified Bellman equation with discount factor, risk-averse cut generation."
- **Primary Crate**: `cobre-sddp` -- CVaR risk measure modifies cut aggregation in the backward pass
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 10. `inflow-nonnegativity.md`

- **Purpose**: "This spec defines the four methods available for handling negative inflow realizations produced by the PAR(p) model, including their LP formulations, objective function modifications, and trade-offs."
- **Primary Crate**: `cobre-sddp` -- the inflow non-negativity methods modify LP constraints and objective terms
- **Secondary Crate(s)**: `cobre-stochastic` (the PAR model that produces the negative inflows is in `cobre-stochastic`, but the LP-level handling is in `cobre-sddp`)
- **Placement**: Correct. The spec defines LP formulation variants, not stochastic model behavior.

#### 11. `par-inflow-model.md`

- **Purpose**: "This spec defines the Periodic Autoregressive model of order p (PAR(p)) used to capture temporal correlation in inflow time series, including the model definition, parameter semantics, the relationship between stored and computed quantities, the fitting procedure, model order selection, and validation invariants."
- **Primary Crate**: `cobre-stochastic` -- the PAR(p) model is the core mathematical model that `cobre-stochastic` implements (preprocessing, noise generation, opening tree construction)
- **Secondary Crate(s)**: `cobre-io` (parameter loading from Parquet files), `cobre-core` (hydro entity carries seasonal stats)
- **Placement**: Correct. A math spec whose primary implementor is `cobre-stochastic` is acceptable in `specs/math/` because the spec defines the mathematical model (PAR equations, fitting theory, validation invariants), not the implementation architecture. The taxonomy criterion is content type, not implementation crate.

#### 12. `equipment-formulations.md`

- **Purpose**: "This spec details the LP constraints for each equipment type in Cobre. While system elements describes what each element is, this spec contains the detailed mathematical constraints governing each equipment type's behavior within the LP."
- **Primary Crate**: `cobre-sddp` -- the per-equipment LP constraints are assembled during stage LP construction
- **Secondary Crate(s)**: `cobre-core` -- entity type definitions and parameter data used by these constraints
- **Placement**: Correct.

#### 13. `stopping-rules.md`

- **Purpose**: "This spec defines the available stopping rules for the Cobre SDDP solver, their configuration, and how they combine."
- **Primary Crate**: `cobre-sddp` -- stopping rules are evaluated by the convergence monitor within the training loop
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 14. `upper-bound-evaluation.md`

- **Purpose**: "This spec defines the upper bound evaluation mechanism in Cobre via inner approximation (SIDP): the vertex-based value function approximation, Lipschitz interpolation, the linearized upper bound LP, gap computation, and configuration."
- **Primary Crate**: `cobre-sddp` -- upper bound evaluation is a convergence mechanism within the SDDP algorithm
- **Secondary Crate(s)**: None
- **Placement**: Correct.

### M1 Verdict: PASS

All 14 math specs have correct primary crate assignments. The expected assignments from the ticket are confirmed:

- `par-inflow-model.md` -> `cobre-stochastic` (confirmed)
- `system-elements.md` -> `cobre-core` + `cobre-sddp` (confirmed)
- `equipment-formulations.md` -> `cobre-sddp` + `cobre-core` (confirmed)
- All others -> `cobre-sddp` (confirmed)

---

## Check M2 -- Architecture Section Mapping (13 files)

### Per-File Analysis

#### 1. `training-loop.md`

- **Purpose**: "This spec defines the Cobre SDDP training loop architecture: the core training components, their configurable abstraction points, forward pass execution, backward pass execution, state management, and dual extraction for cut coefficients."
- **Primary Crate**: `cobre-sddp` -- the training loop is the central orchestration component of the SDDP algorithm
- **Secondary Crate(s)**: `cobre-solver` (LP solve operations), `cobre-stochastic` (scenario sampling)
- **Placement**: Correct. Describes how the training loop is built and integrated.

#### 2. `simulation-architecture.md`

- **Purpose**: "This spec defines the simulation phase of the Cobre SDDP solver: how trained policies are evaluated on large scenario sets, how simulation statistics are computed, and how results are streamed to Parquet output files."
- **Primary Crate**: `cobre-sddp` -- simulation is a phase of the SDDP execution pipeline
- **Secondary Crate(s)**: `cobre-io` (Parquet output streaming), `cobre-stochastic` (scenario selection)
- **Placement**: Correct.

#### 3. `cli-and-lifecycle.md`

- **Purpose**: "This spec defines the Cobre program entrypoint, command-line interface, exit codes, execution phase lifecycle, conditional execution modes, configuration resolution hierarchy, and job scheduler integration."
- **Primary Crate**: `cobre-cli` -- the CLI binary crate and execution lifecycle orchestrator
- **Secondary Crate(s)**: None (it orchestrates all other crates, but owns the lifecycle)
- **Placement**: Correct.

#### 4. `validation-architecture.md`

- **Purpose**: "This spec defines the Cobre multi-layer input validation pipeline: the five validation layers, the error collection strategy, the error type catalog, and the validation report format."
- **Primary Crate**: `cobre-io` -- validation logic runs during input loading, which is `cobre-io` territory
- **Secondary Crate(s)**: `cobre-cli` (orchestrates the validation phase on rank 0)
- **Placement**: See [Decision D2](#decision-d2----validation-architecturemd-placement) below.

#### 5. `input-loading-pipeline.md`

- **Purpose**: "This spec defines the Cobre input loading architecture: the rank-0 centric loading pattern, file loading sequence with dependency ordering, dependency resolution, conditional loading rules, sparse time-series expansion, data broadcasting strategy."
- **Primary Crate**: `cobre-io` -- input loading is the primary responsibility of `cobre-io`
- **Secondary Crate(s)**: `cobre-core` (produces the internal structures consumed by other crates)
- **Placement**: See [Decision D1](#decision-d1----input-loading-pipelinemd-placement) below.

#### 6. `scenario-generation.md`

- **Purpose**: "This spec defines the Cobre scenario generation pipeline: PAR model preprocessing, correlated noise generation, the sampling scheme abstraction that governs how scenarios are selected in forward and backward passes, external scenario integration, load scenario generation, and the scenario memory layout."
- **Primary Crate**: `cobre-stochastic` -- PAR preprocessing, noise generation, opening tree construction, and memory layout are all `cobre-stochastic` responsibilities
- **Secondary Crate(s)**: `cobre-sddp` (the sampling scheme abstraction is consumed by the training loop for forward/backward pass integration)
- **Placement**: See [Decision D3](#decision-d3----scenario-generationmd-placement) below.

#### 7. `solver-abstraction.md`

- **Purpose**: "This spec defines the multi-solver abstraction layer: the unified interface through which the SDDP algorithm interacts with LP solvers."
- **Primary Crate**: `cobre-solver` -- defines the solver trait contract and LP layout convention
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 8. `solver-highs-impl.md`

- **Purpose**: "This spec provides implementation guidance specific to HiGHS integration as the first open-source LP solver reference implementation for Cobre."
- **Primary Crate**: `cobre-solver` -- HiGHS is a solver backend implementation
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 9. `solver-clp-impl.md`

- **Purpose**: "This spec provides implementation guidance specific to CLP (Coin-OR Linear Programming) integration as the second open-source LP solver reference implementation for Cobre."
- **Primary Crate**: `cobre-solver` -- CLP is a solver backend implementation
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 10. `solver-workspaces.md`

- **Purpose**: "This spec defines the thread-local solver workspace infrastructure and the LP scaling specification. These components bridge the Solver Abstraction Layer with the HPC execution layer."
- **Primary Crate**: `cobre-solver` -- workspace lifecycle and LP scaling are solver-layer concerns
- **Secondary Crate(s)**: None (bridges to HPC layer but is owned by `cobre-solver`)
- **Placement**: Correct.

#### 11. `cut-management-impl.md`

- **Purpose**: "This spec defines how the mathematical cut management concepts from Cut Management are implemented in the Cobre architecture: the Future Cost Function (FCF) runtime structure, how cut selection strategies operate on the pre-allocated cut pool, cut serialization, cross-rank cut synchronization via MPI."
- **Primary Crate**: `cobre-sddp` -- the FCF runtime structure and cut pool management are core SDDP components
- **Secondary Crate(s)**: `cobre-io` (FlatBuffers serialization for checkpoint/resume)
- **Placement**: Correct.

#### 12. `convergence-monitoring.md`

- **Purpose**: "This spec defines the Cobre SDDP convergence monitoring architecture: the convergence criteria and stopping rules, the convergence monitor's tracked quantities and evaluation logic, bound computation including cross-rank aggregation."
- **Primary Crate**: `cobre-sddp` -- convergence monitoring is part of the training loop
- **Secondary Crate(s)**: None
- **Placement**: Correct.

#### 13. `extension-points.md`

- **Purpose**: "This spec defines how Cobre selects, composes, and validates algorithm variants at configuration time. The training loop is parameterized by four abstraction points."
- **Primary Crate**: `cobre-sddp` -- the extension points parameterize the training loop
- **Secondary Crate(s)**: `cobre-stochastic` (sampling scheme variant), `cobre-io` (configuration validation)
- **Placement**: Correct.

### M2 Verdict: PASS (with 3 placement decisions documented in M3)

All 13 architecture specs have correct primary crate assignments. The 3 ambiguous placements are resolved in M3 below.

---

## Check M3 -- Documented Decisions for Architecture Ambiguities

### Decision D1 -- `input-loading-pipeline.md` Placement

| Aspect                                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Current placement**                     | `specs/architecture/input-loading-pipeline.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Primary implementation crate**          | `cobre-io`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Taxonomy analysis**                     | The spec defines the _architectural pattern_ for input loading: the rank-0 centric design, the file loading sequence with dependency ordering, the sparse time-series expansion algorithm, the data broadcasting strategy, and the transition to the in-memory data model. These are "how it is built and integrated" concerns -- squarely in the `specs/architecture/` taxonomy. In contrast, `specs/data-model/` defines "what data flows" -- the file schemas, directory layout, and field definitions. The loading pipeline spec references `specs/data-model/input-directory-structure.md` for the file inventory and `specs/data-model/internal-structures.md` for the target data model, but the pipeline itself is an architectural pattern, not a data schema. |
| **Could it move to `specs/data-model/`?** | No. Moving it would conflate architectural orchestration (dependency ordering, rank-0 loading, MPI broadcast) with data format definitions. The `specs/data-model/` section would then contain a mix of "what the data looks like" and "how the data is loaded," reducing navigability.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Recommendation**                        | **Keep** in `specs/architecture/`. The `cobre-io` crate doc page (`src/crates/io.md`) already cross-references this spec. No further action needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Decision D2 -- `validation-architecture.md` Placement

| Aspect                                                   | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Current placement**                                    | `specs/architecture/validation-architecture.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Primary implementation crate**                         | `cobre-io`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Taxonomy analysis**                                    | The spec defines the _architectural framework_ for validation: the five-layer pipeline design (structural, schema, referential, dimensional, semantic), the error collection strategy (collect-all-before-failing), the error type catalog, and the validation report format. These are architectural design decisions about _how validation is structured_. The spec explicitly states: "This spec defines the architectural framework for validation; the loading pipeline spec defines what is validated per file." This self-description aligns perfectly with the `specs/architecture/` taxonomy. |
| **Could it move to `specs/data-model/`?**                | No, for the same reason as D1. The validation architecture describes a processing pattern (layered pipeline with dependency ordering), not a data format. While validation constraints are derived from the data model, the architecture of the validation system itself is a separate concern.                                                                                                                                                                                                                                                                                                        |
| **Could it be merged into `input-loading-pipeline.md`?** | No. The two specs have a clear division of responsibility: `input-loading-pipeline.md` defines _what is loaded and in what order_, while `validation-architecture.md` defines _how errors are detected and reported_. Merging would create an overly long spec mixing two distinct architectural concerns.                                                                                                                                                                                                                                                                                             |
| **Recommendation**                                       | **Keep** in `specs/architecture/`. The `cobre-io` crate doc page already cross-references this spec. No further action needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### Decision D3 -- `scenario-generation.md` Placement

| Aspect                              | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Current placement**               | `specs/architecture/scenario-generation.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Primary implementation crate**    | `cobre-stochastic`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Taxonomy analysis**               | This is the most nuanced case. The spec spans two crate boundaries: (1) PAR preprocessing, correlated noise generation, opening tree construction, and memory layout are `cobre-stochastic` implementations; (2) the sampling scheme abstraction (InSample, External, Historical) is an interface consumed by `cobre-sddp`'s training loop for forward/backward pass scenario selection. The spec describes _how_ the scenario pipeline is built (preprocessing workflow, memory layout, integration with the training loop) rather than _what_ the mathematical model is (that is in `specs/math/par-inflow-model.md`). |
| **Could it move to a new section?** | In principle, a `specs/stochastic/` section could be created, but this would be a single-file section, which violates the principle of meaningful groupings.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Could it move to `specs/math/`?** | No. The spec is primarily about implementation architecture (memory layout, preprocessing pipeline, sampling scheme abstraction, cache-friendly data structures), not mathematical formulations. The mathematical foundations are already in `specs/math/par-inflow-model.md`.                                                                                                                                                                                                                                                                                                                                           |
| **Recommendation**                  | **Keep** in `specs/architecture/`. The placement is correct under the taxonomy: the spec describes how the scenario generation pipeline is built and integrated, even though the primary implementor is `cobre-stochastic`. The `cobre-stochastic` crate doc page (`src/crates/stochastic.md`) already cross-references this spec as its primary architecture reference. The dual-crate nature is inherent to the problem -- `cobre-stochastic` produces scenarios, `cobre-sddp` consumes them through the sampling scheme interface.                                                                                    |

### M3 Verdict: PASS

All 3 architecture placement ambiguities have documented decisions. All 3 files are recommended to **keep** their current placement in `specs/architecture/`.

---

## Check M4 -- SUMMARY.md Verification

**File**: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`

### Math Section (lines 60-74)

| #   | SUMMARY.md Entry                                                     | Spec File                    | Present | Correct Heading |
| --- | -------------------------------------------------------------------- | ---------------------------- | :-----: | :-------------: |
| 1   | `[SDDP Algorithm](./specs/math/sddp-algorithm.md)`                   | `sddp-algorithm.md`          |   YES   |       YES       |
| 2   | `[LP Formulation](./specs/math/lp-formulation.md)`                   | `lp-formulation.md`          |   YES   |       YES       |
| 3   | `[System Elements](./specs/math/system-elements.md)`                 | `system-elements.md`         |   YES   |       YES       |
| 4   | `[Block Formulations](./specs/math/block-formulations.md)`           | `block-formulations.md`      |   YES   |       YES       |
| 5   | `[Hydro Production Models](./specs/math/hydro-production-models.md)` | `hydro-production-models.md` |   YES   |       YES       |
| 6   | `[Cut Management](./specs/math/cut-management.md)`                   | `cut-management.md`          |   YES   |       YES       |
| 7   | `[Discount Rate](./specs/math/discount-rate.md)`                     | `discount-rate.md`           |   YES   |       YES       |
| 8   | `[Infinite Horizon](./specs/math/infinite-horizon.md)`               | `infinite-horizon.md`        |   YES   |       YES       |
| 9   | `[Risk Measures](./specs/math/risk-measures.md)`                     | `risk-measures.md`           |   YES   |       YES       |
| 10  | `[Inflow Non-Negativity](./specs/math/inflow-nonnegativity.md)`      | `inflow-nonnegativity.md`    |   YES   |       YES       |
| 11  | `[PAR Inflow Model](./specs/math/par-inflow-model.md)`               | `par-inflow-model.md`        |   YES   |       YES       |
| 12  | `[Equipment Formulations](./specs/math/equipment-formulations.md)`   | `equipment-formulations.md`  |   YES   |       YES       |
| 13  | `[Stopping Rules](./specs/math/stopping-rules.md)`                   | `stopping-rules.md`          |   YES   |       YES       |
| 14  | `[Upper Bound Evaluation](./specs/math/upper-bound-evaluation.md)`   | `upper-bound-evaluation.md`  |   YES   |       YES       |

All 14 math files listed under the "Mathematical Formulations" heading.

### Architecture Section (lines 86-99)

| #   | SUMMARY.md Entry                                                               | Spec File                    | Present | Correct Heading |
| --- | ------------------------------------------------------------------------------ | ---------------------------- | :-----: | :-------------: |
| 1   | `[Training Loop](./specs/architecture/training-loop.md)`                       | `training-loop.md`           |   YES   |       YES       |
| 2   | `[Simulation Architecture](./specs/architecture/simulation-architecture.md)`   | `simulation-architecture.md` |   YES   |       YES       |
| 3   | `[CLI and Lifecycle](./specs/architecture/cli-and-lifecycle.md)`               | `cli-and-lifecycle.md`       |   YES   |       YES       |
| 4   | `[Validation Architecture](./specs/architecture/validation-architecture.md)`   | `validation-architecture.md` |   YES   |       YES       |
| 5   | `[Input Loading Pipeline](./specs/architecture/input-loading-pipeline.md)`     | `input-loading-pipeline.md`  |   YES   |       YES       |
| 6   | `[Scenario Generation](./specs/architecture/scenario-generation.md)`           | `scenario-generation.md`     |   YES   |       YES       |
| 7   | `[Solver Abstraction](./specs/architecture/solver-abstraction.md)`             | `solver-abstraction.md`      |   YES   |       YES       |
| 8   | `[Solver HiGHS Implementation](./specs/architecture/solver-highs-impl.md)`     | `solver-highs-impl.md`       |   YES   |       YES       |
| 9   | `[Solver CLP Implementation](./specs/architecture/solver-clp-impl.md)`         | `solver-clp-impl.md`         |   YES   |       YES       |
| 10  | `[Solver Workspaces](./specs/architecture/solver-workspaces.md)`               | `solver-workspaces.md`       |   YES   |       YES       |
| 11  | `[Cut Management Implementation](./specs/architecture/cut-management-impl.md)` | `cut-management-impl.md`     |   YES   |       YES       |
| 12  | `[Convergence Monitoring](./specs/architecture/convergence-monitoring.md)`     | `convergence-monitoring.md`  |   YES   |       YES       |
| 13  | `[Extension Points](./specs/architecture/extension-points.md)`                 | `extension-points.md`        |   YES   |       YES       |

All 13 architecture files listed under the "Architecture" heading.

### M4 Verdict: PASS

All 27 files are present in SUMMARY.md under their correct section headings. No missing entries, no misplaced entries.

---

## 27-Row Mapping Table

| #   | Spec File                    | Section      | Primary Crate      | Secondary Crate(s)                 | Placement OK | Findings                                                                                                                                                                               |
| --- | ---------------------------- | ------------ | ------------------ | ---------------------------------- | :----------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `sddp-algorithm.md`          | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 2   | `lp-formulation.md`          | math         | `cobre-sddp`       | `cobre-core`, `cobre-solver`       |     YES      | No issues                                                                                                                                                                              |
| 3   | `system-elements.md`         | math         | `cobre-core`       | `cobre-sddp`                       |     YES      | LOW: dual-crate nature (entity model in `cobre-core`, LP usage in `cobre-sddp`) should be noted in both crate doc pages                                                                |
| 4   | `block-formulations.md`      | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 5   | `hydro-production-models.md` | math         | `cobre-sddp`       | `cobre-core`                       |     YES      | LOW: dual-crate nature (FPHA LP constraints in `cobre-sddp`, hyperplane data + geometry in `cobre-core`) should be noted in both crate doc pages                                       |
| 6   | `cut-management.md`          | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 7   | `discount-rate.md`           | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 8   | `infinite-horizon.md`        | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 9   | `risk-measures.md`           | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 10  | `inflow-nonnegativity.md`    | math         | `cobre-sddp`       | `cobre-stochastic`                 |     YES      | No issues                                                                                                                                                                              |
| 11  | `par-inflow-model.md`        | math         | `cobre-stochastic` | `cobre-io`, `cobre-core`           |     YES      | LOW: primary crate is `cobre-stochastic`, not `cobre-sddp`; placement in `specs/math/` is correct because the spec defines the mathematical model, not the implementation architecture |
| 12  | `equipment-formulations.md`  | math         | `cobre-sddp`       | `cobre-core`                       |     YES      | LOW: same dual-crate pattern as `system-elements.md` and `hydro-production-models.md`                                                                                                  |
| 13  | `stopping-rules.md`          | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 14  | `upper-bound-evaluation.md`  | math         | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 15  | `training-loop.md`           | architecture | `cobre-sddp`       | `cobre-solver`, `cobre-stochastic` |     YES      | No issues                                                                                                                                                                              |
| 16  | `simulation-architecture.md` | architecture | `cobre-sddp`       | `cobre-io`, `cobre-stochastic`     |     YES      | No issues                                                                                                                                                                              |
| 17  | `cli-and-lifecycle.md`       | architecture | `cobre-cli`        | --                                 |     YES      | No issues                                                                                                                                                                              |
| 18  | `validation-architecture.md` | architecture | `cobre-io`         | `cobre-cli`                        |     YES      | Decision D2: keep in `specs/architecture/` -- defines validation pipeline architecture, not data formats                                                                               |
| 19  | `input-loading-pipeline.md`  | architecture | `cobre-io`         | `cobre-core`                       |     YES      | Decision D1: keep in `specs/architecture/` -- defines loading orchestration pattern, not data schemas                                                                                  |
| 20  | `scenario-generation.md`     | architecture | `cobre-stochastic` | `cobre-sddp`                       |     YES      | Decision D3: keep in `specs/architecture/` -- defines implementation pipeline, not mathematical model                                                                                  |
| 21  | `solver-abstraction.md`      | architecture | `cobre-solver`     | --                                 |     YES      | No issues                                                                                                                                                                              |
| 22  | `solver-highs-impl.md`       | architecture | `cobre-solver`     | --                                 |     YES      | No issues                                                                                                                                                                              |
| 23  | `solver-clp-impl.md`         | architecture | `cobre-solver`     | --                                 |     YES      | No issues                                                                                                                                                                              |
| 24  | `solver-workspaces.md`       | architecture | `cobre-solver`     | --                                 |     YES      | No issues                                                                                                                                                                              |
| 25  | `cut-management-impl.md`     | architecture | `cobre-sddp`       | `cobre-io`                         |     YES      | No issues                                                                                                                                                                              |
| 26  | `convergence-monitoring.md`  | architecture | `cobre-sddp`       | --                                 |     YES      | No issues                                                                                                                                                                              |
| 27  | `extension-points.md`        | architecture | `cobre-sddp`       | `cobre-stochastic`, `cobre-io`     |     YES      | No issues                                                                                                                                                                              |

---

## Findings Summary

| ID  | Severity | Spec File                    | Finding                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-1 | LOW      | `system-elements.md`         | Dual-crate spec: primary crate is `cobre-core` (entity model), secondary is `cobre-sddp` (LP usage). Both crate doc pages should cross-reference this spec. The `cobre-core` doc page already links to it via Input System Entities; the `cobre-sddp` doc page references it indirectly through `lp-formulation.md`. No action required unless explicit cross-reference audit finds a gap. |
| F-2 | LOW      | `hydro-production-models.md` | Dual-crate spec: FPHA hyperplane constraints are `cobre-sddp` LP components, but the underlying data (geometry polynomials, hyperplane coefficients) lives in `cobre-core`. Both crate doc pages should cross-reference. Same pattern as F-1.                                                                                                                                              |
| F-3 | LOW      | `par-inflow-model.md`        | Math spec whose primary implementation crate is `cobre-stochastic`, not `cobre-sddp`. Placement in `specs/math/` is correct because the content is a mathematical model definition (PAR equations, fitting theory, validation invariants), not an architecture spec. The `cobre-stochastic` crate doc page already cross-references it.                                                    |
| F-4 | LOW      | `equipment-formulations.md`  | Same dual-crate pattern as F-1 and F-2: LP constraints in `cobre-sddp`, entity type data in `cobre-core`.                                                                                                                                                                                                                                                                                  |

**No HIGH findings.** All primary crate assignments are correct. All files are present in SUMMARY.md. All architecture placement ambiguities have documented decisions.

### Crate Assignment Summary

| Crate              | Primary For (Math)             | Primary For (Architecture)        |                                                                                             Total Primary                                                                                              |
| ------------------ | ------------------------------ | --------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| `cobre-sddp`       | 11 files                       | 5 files                           |                                                                                                   16                                                                                                   |
| `cobre-core`       | 1 file (`system-elements.md`)  | 0 files                           |                                                                                                   1                                                                                                    |
| `cobre-stochastic` | 1 file (`par-inflow-model.md`) | 1 file (`scenario-generation.md`) |                                                                                                   2                                                                                                    |
| `cobre-solver`     | 0 files                        | 4 files                           |                                                                                                   4                                                                                                    |
| `cobre-io`         | 0 files                        | 2 files                           |                                                                                                   2                                                                                                    |
| `cobre-cli`        | 0 files                        | 1 file (`cli-and-lifecycle.md`)   |                                                                                                   1                                                                                                    |
| `ferrompi`         | 0 files                        | 0 files                           |                                                                                                   0                                                                                                    |
| **Total**          | **14**                         | **13**                            | **27** (note: `system-elements.md` has `cobre-core` primary + `cobre-sddp` secondary; `hydro-production-models.md` and `equipment-formulations.md` have `cobre-sddp` primary + `cobre-core` secondary) |

---

_End of audit report._
