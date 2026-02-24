# ticket-006 Audit Report: Crate Documentation Pages -- Spec Reference Completeness

**Date**: 2026-02-24
**Auditor**: sddp-specialist (automated)
**Scope**: 7 crate doc pages + overview.md in `/home/rogerio/git/cobre-docs/src/crates/`
**Verdict**: 5 FAIL, 2 PASS (see per-crate sections below)

---

## Table of Contents

1. [Check D -- Dependency Graph (overview.md)](#check-d----dependency-graph-overviewmd)
2. [cobre-core](#cobre-core)
3. [cobre-io](#cobre-io)
4. [cobre-stochastic](#cobre-stochastic)
5. [cobre-solver](#cobre-solver)
6. [cobre-sddp](#cobre-sddp)
7. [cobre-cli](#cobre-cli)
8. [ferrompi](#ferrompi)
9. [7-Crate Summary Table](#7-crate-summary-table)

---

## Check D -- Dependency Graph (overview.md)

**File**: `/home/rogerio/git/cobre-docs/src/crates/overview.md`

### Documented Graph

```
cobre-cli
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core
```

### Comparison with Cargo.toml

All individual crate `Cargo.toml` files are placeholder stubs with **no `[dependencies]` sections**. The workspace `Cargo.toml` at `/home/rogerio/git/cobre/Cargo.toml` lists 7 members (`cobre`, `cobre-core`, `cobre-io`, `cobre-stochastic`, `cobre-solver`, `cobre-sddp`, `cobre-cli`) but declares no inter-crate dependencies. The dependency graph therefore cannot be verified against actual Cargo.toml manifests -- it represents the _intended_ design.

### Findings

| #   | Severity | Finding                                                                                                                                                                                                                                                                                     |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | MEDIUM   | **`cobre-stochastic` likely depends on `cobre-core`** but is shown with no sub-dependencies. The stochastic crate needs entity types (hydro IDs, stage indices) from `cobre-core` to index PAR parameters and generate scenarios. When dependencies are populated, this edge should appear. |
| D-2 | LOW      | **`cobre-solver` likely depends on `cobre-core`** (for type definitions such as stage indices, entity IDs used in LP layout). Not shown in graph.                                                                                                                                           |
| D-3 | LOW      | **`cobre` umbrella crate** is a workspace member but not shown in the dependency graph. The graph only shows the 6 functional crates plus ferrompi. Acceptable since the umbrella crate is a re-export facade, but worth noting for completeness.                                           |
| D-4 | LOW      | **ferrompi** is correctly shown under "Related repositories" rather than in the dependency graph, consistent with its status as a separate repository and optional dependency of `cobre-sddp`.                                                                                              |

**Dependency Graph Verdict**: INCONCLUSIVE (no Cargo.toml dependencies to verify against; D-1 is a likely omission)

---

## cobre-core

**File**: `/home/rogerio/git/cobre-docs/src/crates/core.md`

### Check A -- Link Coverage

| Expected Spec               | Link Present | Link Resolves | Notes                                                                                                                 |
| --------------------------- | :----------: | :-----------: | --------------------------------------------------------------------------------------------------------------------- |
| `design-principles.md`      |      NO      |      N/A      | **PRIMARY**: Declares declaration order invariance, canonical ordering, format selection -- all core responsibilities |
| `system-elements.md`        |      NO      |      N/A      | **PRIMARY**: Defines all physical elements (hydro, thermal, bus, line, etc.) that cobre-core models                   |
| `equipment-formulations.md` |      NO      |      N/A      | **SECONDARY**: Defines pumping station and contract data model aspects; LP constraints are cobre-sddp's concern       |
| `input-system-entities.md`  |     YES      |      YES      |                                                                                                                       |
| `internal-structures.md`    |     YES      |      YES      |                                                                                                                       |
| `penalty-system.md`         |     YES      |      YES      |                                                                                                                       |
| `input-hydro-extensions.md` |     YES      |      YES      |                                                                                                                       |

### Check B -- Link Correctness

All 4 existing links resolve correctly to existing files:

- `../specs/data-model/input-system-entities.md` -- OK
- `../specs/data-model/input-hydro-extensions.md` -- OK
- `../specs/data-model/penalty-system.md` -- OK
- `../specs/data-model/internal-structures.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (core.md)                                                                                                                                                                        | Spec Reference                                                                                                         | Verified |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | :------: |
| C-1 | "three-tier cascaded defaults (global, entity, stage) into concrete per-entity, per-stage values"                                                                                      | `penalty-system.md` section 1: "three-tier cascade resolution: global defaults -> entity overrides -> stage overrides" |   YES    |
| C-2 | "all are loaded, validated, and stored in canonical (ID-sorted) order"                                                                                                                 | `design-principles.md` section 3.1: "all entity collections must be sorted by ID before any processing"                |   YES    |
| C-3 | "Every system element -- buses, transmission lines, hydro plants, thermal plants, pumping stations, energy contracts, and non-controllable sources -- has a corresponding entity type" | `system-elements.md` defines exactly these element types                                                               |   YES    |

### Findings

| #      | Severity | Finding                                                                                                                                                                                                                                                                                                                          |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CORE-1 | HIGH     | **`design-principles.md` not linked.** This spec declares the declaration order invariance requirement (section 3) and format selection criteria (section 1) -- both are core responsibilities. The cobre-core Overview prose directly references "canonical (ID-sorted) order" and "resolution" which originate from this spec. |
| CORE-2 | HIGH     | **`system-elements.md` not linked.** This spec defines every physical element that cobre-core models. The Overview sentence "Every system element -- buses, transmission lines, hydro plants..." directly paraphrases `system-elements.md`. This is a primary spec for this crate.                                               |
| CORE-3 | MEDIUM   | **`equipment-formulations.md` not linked.** Defines pumping station constraints and contract constraints. The data model aspects (entity fields, decision variables) are relevant to cobre-core, though the LP constraint details belong to cobre-sddp.                                                                          |

**Verdict: FAIL** (2 HIGH findings)

---

## cobre-io

**File**: `/home/rogerio/git/cobre-docs/src/crates/io.md`

### Check A -- Link Coverage

| Expected Spec                  | Link Present | Link Resolves | Notes                                                                                                                                                            |
| ------------------------------ | :----------: | :-----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input-directory-structure.md` |     YES      |      YES      |                                                                                                                                                                  |
| `input-scenarios.md`           |     YES      |      YES      |                                                                                                                                                                  |
| `input-constraints.md`         |     YES      |      YES      |                                                                                                                                                                  |
| `output-schemas.md`            |     YES      |      YES      |                                                                                                                                                                  |
| `output-infrastructure.md`     |     YES      |      YES      |                                                                                                                                                                  |
| `binary-formats.md`            |     YES      |      YES      |                                                                                                                                                                  |
| `input-loading-pipeline.md`    |      NO      |      N/A      | **PRIMARY**: Defines the rank-0 centric loading pattern, file loading sequence with dependency ordering, and broadcast strategy -- all cobre-io responsibilities |
| `validation-architecture.md`   |      NO      |      N/A      | **PRIMARY**: Defines the five-layer validation pipeline that cobre-io implements                                                                                 |
| `design-principles.md`         |      NO      |      N/A      | **SECONDARY**: Defines the format decision framework (JSON/Parquet/FlatBuffers/CSV) referenced in the io Overview prose ("format decision framework")            |

### Check B -- Link Correctness

All 6 existing links resolve correctly:

- `../specs/data-model/input-directory-structure.md` -- OK
- `../specs/data-model/input-scenarios.md` -- OK
- `../specs/data-model/input-constraints.md` -- OK
- `../specs/data-model/output-schemas.md` -- OK
- `../specs/data-model/output-infrastructure.md` -- OK
- `../specs/data-model/binary-formats.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (io.md)                                                                                                          | Spec Reference                                                                                                          | Verified |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | :------: |
| C-1 | "the loader validates schemas, resolves file references, and produces the internal structures that cobre-core expects" | `input-loading-pipeline.md` section 1: "rank 0 loads and validates all input data" and section 2: file loading sequence |   YES    |
| C-2 | "Hive-partitioned Parquet files for simulation and training results"                                                   | `output-infrastructure.md` section on MPI-native Hive partitioning                                                      |   YES    |
| C-3 | "FlatBuffers for zero-copy deserialization and SIMD-friendly dense array access"                                       | `binary-formats.md` -- confirmed FlatBuffers for policy data                                                            |   YES    |

### Findings

| #    | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IO-1 | HIGH     | **`input-loading-pipeline.md` not linked.** This spec defines the entire loading architecture (rank-0 centric pattern, file loading sequence with 30+ files in dependency order, conditional loading, sparse time-series expansion, broadcast strategy). The io.md Overview directly describes this behavior ("the loader validates schemas, resolves file references") without linking the spec. |
| IO-2 | HIGH     | **`validation-architecture.md` not linked.** This spec defines the five-layer validation pipeline. The io.md Overview mentions "Configuration validation covers required fields, cross-reference integrity" but does not link the spec. Note: `validation-architecture.md` IS linked from `cli.md`, but cobre-io is the crate that _implements_ the validation logic.                             |
| IO-3 | MEDIUM   | **`design-principles.md` not linked.** The io.md Status section references "the format decision framework" which is defined in `design-principles.md` section 1.                                                                                                                                                                                                                                  |

**Verdict: FAIL** (2 HIGH findings)

---

## cobre-stochastic

**File**: `/home/rogerio/git/cobre-docs/src/crates/stochastic.md`

### Check A -- Link Coverage

| Expected Spec            | Link Present | Link Resolves | Notes |
| ------------------------ | :----------: | :-----------: | ----- |
| `par-inflow-model.md`    |     YES      |      YES      |       |
| `scenario-generation.md` |     YES      |      YES      |       |

### Check B -- Link Correctness

Both links resolve correctly:

- `../specs/architecture/scenario-generation.md` -- OK
- `../specs/math/par-inflow-model.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (stochastic.md)                                                                                                                              | Spec Reference                                                                                            | Verified |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | :------: |
| C-1 | "Cholesky-factored correlation matrix so that a single matrix-vector multiply transforms independent standard normals into correlated innovations" | `scenario-generation.md` section 2 and `par-inflow-model.md` spatial correlation section                  |   YES    |
| C-2 | "opening tree is the fixed set of noise realizations evaluated at every visited state during the backward pass"                                    | `scenario-generation.md` section on opening tree construction; `training-loop.md` section 6 backward pass |   YES    |

### Findings

No findings. Both expected specs are linked and resolve. Behavioral claims are accurate.

**Verdict: PASS**

---

## cobre-solver

**File**: `/home/rogerio/git/cobre-docs/src/crates/solver.md`

### Check A -- Link Coverage

| Expected Spec           | Link Present | Link Resolves | Notes |
| ----------------------- | :----------: | :-----------: | ----- |
| `solver-abstraction.md` |     YES      |      YES      |       |
| `solver-highs-impl.md`  |     YES      |      YES      |       |
| `solver-clp-impl.md`    |     YES      |      YES      |       |
| `solver-workspaces.md`  |     YES      |      YES      |       |

### Check B -- Link Correctness

All 4 links resolve correctly:

- `../specs/architecture/solver-abstraction.md` -- OK
- `../specs/architecture/solver-highs-impl.md` -- OK
- `../specs/architecture/solver-clp-impl.md` -- OK
- `../specs/architecture/solver-workspaces.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (solver.md)                                                            | Spec Reference                                           | Verified |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------- | :------: |
| C-1 | "Compile-time selection via generics avoids dynamic dispatch"                | `solver-abstraction.md` (compile-time backend selection) |   YES    |
| C-2 | "Each workspace is padded to cache-line boundaries to prevent false sharing" | `solver-workspaces.md` (cache-line padding requirement)  |   YES    |

### Findings

No findings. All 4 expected specs are linked and resolve. Behavioral claims are accurate.

**Verdict: PASS**

---

## cobre-sddp

**File**: `/home/rogerio/git/cobre-docs/src/crates/sddp.md`

### Check A -- Link Coverage

The expected spec set for cobre-sddp is the largest of all crates, spanning math, architecture, and HPC categories.

#### Architecture Specs

| Expected Spec                | Link Present | Link Resolves | Notes                                                                                                                          |
| ---------------------------- | :----------: | :-----------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `training-loop.md`           |     YES      |      YES      |                                                                                                                                |
| `simulation-architecture.md` |     YES      |      YES      |                                                                                                                                |
| `convergence-monitoring.md`  |     YES      |      YES      |                                                                                                                                |
| `cut-management-impl.md`     |     YES      |      YES      |                                                                                                                                |
| `extension-points.md`        |      NO      |      N/A      | **SECONDARY**: Defines the extensibility architecture for risk measures, cut formulations, horizon modes, and sampling schemes |

#### Math Specs

| Expected Spec                | Link Present | Link Resolves | Notes                                                                                                                                                               |
| ---------------------------- | :----------: | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sddp-algorithm.md`          |      NO      |      N/A      | **PRIMARY**: The foundational mathematical spec defining the SDDP algorithm, Bellman recursion, forward/backward pass structure, cut generation, convergence theory |
| `lp-formulation.md`          |      NO      |      N/A      | **PRIMARY**: Defines the complete LP subproblem that cobre-sddp builds and solves at each stage                                                                     |
| `system-elements.md`         |      NO      |      N/A      | **PRIMARY**: Defines all system elements whose decision variables and constraints appear in the LP                                                                  |
| `block-formulations.md`      |      NO      |      N/A      | **PRIMARY**: Defines multi-block stage structure (parallel/chronological) that cobre-sddp implements                                                                |
| `hydro-production-models.md` |      NO      |      N/A      | **PRIMARY**: Defines FPHA and other hydro production models that cobre-sddp uses in LP construction                                                                 |
| `cut-management.md`          |      NO      |      N/A      | **PRIMARY**: Defines the mathematical theory of cut generation, aggregation (single-cut), and selection (Level 1, LML1)                                             |
| `discount-rate.md`           |      NO      |      N/A      | **SECONDARY**: Defines how discount factors modify cut coefficients                                                                                                 |
| `infinite-horizon.md`        |      NO      |      N/A      | **SECONDARY**: Defines the cycle-back policy graph topology                                                                                                         |
| `risk-measures.md`           |      NO      |      N/A      | **PRIMARY**: Defines CVaR risk measure and how it modifies cut aggregation probabilities. Directly referenced by sddp.md Overview: "risk measure" abstraction point |
| `inflow-nonnegativity.md`    |      NO      |      N/A      | **SECONDARY**: Defines four methods for handling negative AR inflows in the LP                                                                                      |
| `stopping-rules.md`          |      NO      |      N/A      | **PRIMARY**: Defines the mathematical stopping criteria referenced in sddp.md: "bound stalling, simulation-based stability, iteration limits, and time limits"      |
| `upper-bound-evaluation.md`  |      NO      |      N/A      | **SECONDARY**: Defines the statistical upper bound computation                                                                                                      |
| `equipment-formulations.md`  |      NO      |      N/A      | **SECONDARY**: Defines per-equipment LP constraints                                                                                                                 |

#### HPC Specs

| Expected Spec                  | Link Present | Link Resolves | Notes                                                                                                   |
| ------------------------------ | :----------: | :-----------: | ------------------------------------------------------------------------------------------------------- |
| `hybrid-parallelism.md`        |      NO      |      N/A      | **SECONDARY** (primary for ferrompi): The hybrid MPI+OpenMP architecture that cobre-sddp operates under |
| `communication-patterns.md`    |      NO      |      N/A      | **SECONDARY** (primary for ferrompi): MPI operations used during SDDP training                          |
| `synchronization.md`           |      NO      |      N/A      | **SECONDARY** (primary for ferrompi): MPI synchronization points in SDDP iterations                     |
| `work-distribution.md`         |      NO      |      N/A      | **SECONDARY**: How work is distributed across ranks/threads                                             |
| `memory-architecture.md`       |      NO      |      N/A      | **SECONDARY**: Data ownership model and memory budget                                                   |
| `shared-memory-aggregation.md` |      NO      |      N/A      | **SECONDARY** (primary for ferrompi): SharedWindow usage for cut pool and scenarios                     |
| `checkpointing.md`             |      NO      |      N/A      | **SECONDARY**: Checkpoint/resume strategy                                                               |
| `slurm-deployment.md`          |      NO      |      N/A      | **SECONDARY**: Deployment configuration                                                                 |

### Check B -- Link Correctness

All 4 existing links resolve correctly:

- `../specs/architecture/training-loop.md` -- OK
- `../specs/architecture/simulation-architecture.md` -- OK
- `../specs/architecture/convergence-monitoring.md` -- OK
- `../specs/architecture/cut-management-impl.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (sddp.md)                                                                                                                                                                                                  | Spec Reference                                                                                     | Verified |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | :------: |
| C-1 | "Each iteration follows a fixed lifecycle: forward pass, forward synchronization (`MPI_Allreduce`), backward pass, cut synchronization (`MPI_Allgatherv`), convergence check, optional checkpoint, and logging." | `training-loop.md` section 2.1: matches exactly (same 7-step sequence, same MPI operations named). |   YES    |
| C-2 | "Level 1 (keep cuts active at least once) and Limited Memory Level 1 (keep only the most recently active cut per visited state)"                                                                                 | `cut-management-impl.md` and `cut-management.md` section 7: confirmed both strategies              |   YES    |
| C-3 | "pre-allocated, deterministic-slot cut pool per stage with activity tracking"                                                                                                                                    | `cut-management-impl.md` section on FCF runtime structure                                          |   YES    |

Note: Claim C-1 is consistent with `training-loop.md` section 2.1, which is the referenced spec. However, `synchronization.md` section 1.1 describes the forward-to-backward transition as using `MPI_Allgatherv` (for visited states) plus `MPI_Allreduce` (for convergence statistics), not just `MPI_Allreduce`. This is an inter-spec inconsistency, not a crate doc error -- the crate doc correctly mirrors its referenced spec (`training-loop.md`).

### Findings

| #       | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SDDP-1  | HIGH     | **`sddp-algorithm.md` not linked.** This is the foundational mathematical spec for SDDP. It defines the Bellman recursion, forward/backward pass structure, cut generation theory, and convergence properties. The sddp.md Overview paraphrases its content throughout ("iterative training loop that builds a piecewise-linear approximation of the expected future cost function") without linking the spec.                             |
| SDDP-2  | HIGH     | **`lp-formulation.md` not linked.** Defines the complete LP subproblem structure. cobre-sddp builds this LP at every stage-block pair.                                                                                                                                                                                                                                                                                                     |
| SDDP-3  | HIGH     | **`system-elements.md` not linked.** Defines all system elements whose variables and constraints populate the LP.                                                                                                                                                                                                                                                                                                                          |
| SDDP-4  | HIGH     | **`block-formulations.md` not linked.** Defines multi-block stage structure (parallel/chronological) that cobre-sddp implements.                                                                                                                                                                                                                                                                                                           |
| SDDP-5  | HIGH     | **`hydro-production-models.md` not linked.** Defines FPHA and other production models used in LP construction.                                                                                                                                                                                                                                                                                                                             |
| SDDP-6  | HIGH     | **`cut-management.md` (math) not linked.** Defines the mathematical theory of cut generation and selection. The crate doc links only the architecture-level `cut-management-impl.md` but not the mathematical foundation.                                                                                                                                                                                                                  |
| SDDP-7  | HIGH     | **`risk-measures.md` not linked.** The sddp.md Overview explicitly names "risk measure" as an abstraction point but does not link the spec that defines it.                                                                                                                                                                                                                                                                                |
| SDDP-8  | HIGH     | **`stopping-rules.md` not linked.** The sddp.md Overview names "bound stalling, simulation-based stability, iteration limits, and time limits" as stopping criteria but does not link the spec that defines their mathematics.                                                                                                                                                                                                             |
| SDDP-9  | MEDIUM   | **`extension-points.md` not linked.** Defines the extensibility architecture for the four abstraction points mentioned in the Overview.                                                                                                                                                                                                                                                                                                    |
| SDDP-10 | MEDIUM   | **`discount-rate.md` not linked.** Defines how discount factors modify cut coefficients.                                                                                                                                                                                                                                                                                                                                                   |
| SDDP-11 | MEDIUM   | **`infinite-horizon.md` not linked.** Defines the cycle-back policy graph topology referenced by the "horizon mode" abstraction point.                                                                                                                                                                                                                                                                                                     |
| SDDP-12 | MEDIUM   | **`upper-bound-evaluation.md` not linked.** Defines the statistical upper bound computation used by the convergence monitor.                                                                                                                                                                                                                                                                                                               |
| SDDP-13 | MEDIUM   | **`inflow-nonnegativity.md` not linked.** Defines four inflow non-negativity methods that affect LP construction.                                                                                                                                                                                                                                                                                                                          |
| SDDP-14 | MEDIUM   | **`equipment-formulations.md` not linked.** Defines per-equipment LP constraints assembled by cobre-sddp.                                                                                                                                                                                                                                                                                                                                  |
| SDDP-15 | MEDIUM   | **No HPC specs linked.** The Overview prominently describes MPI operations (`MPI_Allreduce`, `MPI_Allgatherv`) and "cross-rank synchronization via MPI" but links none of the 8 HPC specs. While HPC specs are primarily owned by ferrompi, the SDDP training loop is the consumer of those HPC patterns. At minimum, `work-distribution.md`, `synchronization.md`, and `checkpointing.md` describe behavior that cobre-sddp orchestrates. |

**Verdict: FAIL** (8 HIGH findings, 7 MEDIUM findings)

---

## cobre-cli

**File**: `/home/rogerio/git/cobre-docs/src/crates/cli.md`

### Check A -- Link Coverage

| Expected Spec                | Link Present | Link Resolves | Notes                                                                                                                                                                                                                                                                  |
| ---------------------------- | :----------: | :-----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli-and-lifecycle.md`       |     YES      |      YES      |                                                                                                                                                                                                                                                                        |
| `configuration-reference.md` |      NO      |      N/A      | **PRIMARY**: The CLI loads and validates `config.json`; this spec defines the complete configuration option mapping. The cli.md Overview says "All runtime behavior is controlled via the case directory's `config.json`" without linking the configuration reference. |
| `validation-architecture.md` |     YES      |      YES      | Linked in Key Concepts (validation pipeline section)                                                                                                                                                                                                                   |

### Check B -- Link Correctness

Both existing links resolve correctly:

- `../specs/architecture/cli-and-lifecycle.md` -- OK
- `../specs/architecture/validation-architecture.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (cli.md)                                                                                                                                                                                                                                                                     | Spec Reference                                                                         | Verified |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | :------: |
| C-1 | "five-layer validation pipeline (structural, schema, referential integrity, dimensional consistency, semantic rules)"                                                                                                                                                              | `validation-architecture.md` sections 2.1-2.5: exactly these five layers in this order |   YES    |
| C-2 | "Exit codes follow a structured scheme: 0 for success, 1 for CLI argument errors, 2 for configuration validation errors, 3 for input data validation errors, 4 for runtime errors, 5 for checkpoint recovery failures, and signal-derived codes (130 for SIGINT, 137 for SIGKILL)" | `cli-and-lifecycle.md` section 4: exact match                                          |   YES    |
| C-3 | "The CLI itself accepts only the case path and a minimal set of flags (`--validate-only`, `--version`, `--help`)"                                                                                                                                                                  | `cli-and-lifecycle.md` section 3: exact match                                          |   YES    |

### Findings

| #     | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI-1 | HIGH     | **`configuration-reference.md` not linked.** This spec provides the comprehensive mapping of all configuration options to LP subproblem behavior. The cli.md Overview says "All runtime behavior is controlled via the case directory's `config.json`" and the Key Concepts section has a "Configuration loading" bullet that describes config.json behavior, yet neither links to the configuration reference spec. |

**Verdict: FAIL** (1 HIGH finding)

---

## ferrompi

**File**: `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md`

### Check A -- Link Coverage

| Expected Spec                  | Link Present | Link Resolves | Notes                                                                                                                                                                                                                  |
| ------------------------------ | :----------: | :-----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hybrid-parallelism.md`        |     YES      |      YES      | Linked twice (thread-safe communicators + topology detection)                                                                                                                                                          |
| `communication-patterns.md`    |     YES      |      YES      | Linked twice (SharedWindow + collective operations)                                                                                                                                                                    |
| `synchronization.md`           |      NO      |      N/A      | **SECONDARY**: Defines MPI synchronization points. Synchronization protocol-level behavior is consumed by cobre-sddp's training loop, not directly by ferrompi (which provides the primitives). Absence is defensible. |
| `shared-memory-aggregation.md` |     YES      |      YES      | Linked under SharedWindow section                                                                                                                                                                                      |
| `slurm-deployment.md`          |     YES      |      YES      | Linked under SLURM integration section                                                                                                                                                                                 |

### Check B -- Link Correctness

All 6 link instances resolve correctly:

- `../specs/hpc/hybrid-parallelism.md` -- OK (x2)
- `../specs/hpc/communication-patterns.md` -- OK (x2)
- `../specs/hpc/shared-memory-aggregation.md` -- OK
- `../specs/hpc/slurm-deployment.md` -- OK

Zero broken links.

### Check C -- Behavioral Claims Spot-Check

| #   | Claim (ferrompi.md)                                                              | Spec Reference                                                                                      | Verified |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | :------: |
| C-1 | "All MPI communicator handles exposed by ferrompi implement `Send + Sync`"       | `hybrid-parallelism.md` section 1: confirms `Send + Sync` requirement for thread-safe communicators |   YES    |
| C-2 | "Only collective operations -- no point-to-point messaging" during SDDP training | `communication-patterns.md` section 1.2: "No Point-to-Point Messaging" -- exact match               |   YES    |
| C-3 | "MPI 4.0 persistent collective support (`allgatherv_init`, `allreduce_init`)"    | `communication-patterns.md` persistent collectives section                                          |   YES    |

### Findings

| #       | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FERRO-1 | LOW      | **`synchronization.md` not linked.** The synchronization spec defines the MPI synchronization protocol (3 collective calls per iteration, forward-to-backward transition, per-stage backward barrier). However, this is a protocol spec consumed by cobre-sddp, not a ferrompi capability spec. ferrompi provides the primitives; the training loop defines the protocol. Absence is defensible but could be mentioned as a "See also" reference. |

**Verdict: PASS** (0 HIGH, 0 MEDIUM; 1 LOW finding only)

---

## 7-Crate Summary Table

| Crate                | Primary Specs Covered | Primary Specs Missing                                                                                                                                       | Secondary Specs Missing                                                                                                                            | Broken Links | Verdict  |
| -------------------- | :-------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | :----------: | :------: |
| **cobre-core**       |         4 / 6         | `design-principles`, `system-elements`                                                                                                                      | `equipment-formulations`                                                                                                                           |      0       | **FAIL** |
| **cobre-io**         |         6 / 8         | `input-loading-pipeline`, `validation-architecture`                                                                                                         | `design-principles`                                                                                                                                |      0       | **FAIL** |
| **cobre-stochastic** |         2 / 2         | (none)                                                                                                                                                      | (none)                                                                                                                                             |      0       | **PASS** |
| **cobre-solver**     |         4 / 4         | (none)                                                                                                                                                      | (none)                                                                                                                                             |      0       | **PASS** |
| **cobre-sddp**       |        4 / 12         | `sddp-algorithm`, `lp-formulation`, `system-elements`, `block-formulations`, `hydro-production-models`, `cut-management`, `risk-measures`, `stopping-rules` | `extension-points`, `discount-rate`, `infinite-horizon`, `upper-bound-evaluation`, `inflow-nonnegativity`, `equipment-formulations`, + 8 HPC specs |      0       | **FAIL** |
| **cobre-cli**        |         2 / 3         | `configuration-reference`                                                                                                                                   | (none)                                                                                                                                             |      0       | **FAIL** |
| **ferrompi**         |         4 / 4         | (none)                                                                                                                                                      | `synchronization` (defensible)                                                                                                                     |      0       | **PASS** |

### Aggregate Statistics

- **Total HIGH findings**: 14 (CORE: 2, IO: 2, SDDP: 8, CLI: 1, FERRO: 0, STOCH: 0, SOLVER: 0)
- **Total MEDIUM findings**: 11 (CORE: 1, IO: 1, SDDP: 7, CLI: 0, FERRO: 0, STOCH: 0, SOLVER: 0)
- **Total LOW findings**: 4 (D-2, D-3, D-4, FERRO-1)
- **Broken links**: 0 across all crate doc pages
- **Behavioral claim inaccuracies**: 0 (all spot-checked claims match their referenced specs)

### Key Observation

The audit reveals a clear pattern: crate doc pages link only to **architecture/data-model specs** and omit **math specs** entirely. cobre-sddp is the most severely affected because its expected coverage spans all three spec categories (math, architecture, HPC), but its Key Concepts section links only 4 architecture specs out of 25+ expected specs. The math specs (`sddp-algorithm.md`, `lp-formulation.md`, `cut-management.md`, `risk-measures.md`, `stopping-rules.md`, etc.) are the theoretical foundation for the SDDP crate and their absence from the crate doc means a developer consulting the crate page would miss the complete mathematical specification.

---

_End of audit report._
