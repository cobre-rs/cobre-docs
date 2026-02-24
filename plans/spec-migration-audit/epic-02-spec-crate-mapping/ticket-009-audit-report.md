# ticket-009 Audit Report: HPC, Config, and Deferred Spec Mapping + Master Spec-to-Crate Table

**Date**: 2026-02-24
**Auditor**: sddp-specialist (automated)
**Scope**: 8 HPC specs + 1 configuration spec + 1 deferred spec = 10 files; master table compilation from tickets 007, 008, 009
**Verdict**: All 10 files have correct primary crate assignments. All deferred features mapped. 0 HIGH findings. 1 MEDIUM finding. 2 LOW findings.

---

## Table of Contents

1. [Check M1 -- HPC Section Mapping (8 files)](#1-check-m1----hpc-section-mapping-8-files)
2. [Check M2 -- Config and Deferred Mapping](#2-check-m2----config-and-deferred-mapping)
3. [Check M3 -- SUMMARY.md Verification](#3-check-m3----summarymd-verification)
4. [10-Row Mapping Table (This Ticket)](#4-10-row-mapping-table-this-ticket)
5. [Check M4 -- Master 50-Row Spec-to-Crate Table](#5-check-m4----master-50-row-spec-to-crate-table)
6. [Check M5 -- Crate Coverage Summary](#6-check-m5----crate-coverage-summary)
7. [Findings Summary](#7-findings-summary)
8. [Acceptance Criteria Verification](#8-acceptance-criteria-verification)

---

## 1. Check M1 -- HPC Section Mapping (8 files)

### Methodology

For each file in `src/specs/hpc/`, the Purpose section was read to determine the primary subject matter and the crate assignment was evaluated against crate responsibility definitions and the content of each spec.

### Per-File Analysis

#### 1.1 `work-distribution.md`

- **Purpose**: "This spec defines how Cobre distributes computational work across MPI ranks and OpenMP threads during the SDDP training loop: forward pass scenario distribution with thread-trajectory affinity, backward pass trial point distribution with per-stage synchronization, and the load balancing strategy."
- **Primary Crate**: `cobre-sddp` -- the work distribution logic (contiguous block assignment, thread-trajectory affinity, forward/backward pass distribution) is part of the SDDP training loop implementation.
- **Secondary Crate(s)**: `ferrompi` -- uses `MPI_Allgatherv` and `MPI_Allreduce` primitives for state gathering and bound aggregation.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `cobre-sddp` as primary. **CONFIRMED**. The spec is about how the SDDP algorithm distributes work, not about MPI primitives themselves.

#### 1.2 `hybrid-parallelism.md`

- **Purpose**: "This spec defines the hybrid parallelization strategy used by Cobre: ferrompi as the backbone for inter-node communication, intra-node shared memory, and topology detection; OpenMP via C FFI as the threading layer for intra-rank parallelism."
- **Primary Crate**: `cobre-sddp` -- the hybrid architecture is the parallelization strategy for the SDDP training loop. Sections 3-4 define the MPI vs OpenMP responsibility split and parallel configuration that govern SDDP execution.
- **Secondary Crate(s)**: `ferrompi` -- sections 1.2 and 5 define ferrompi capabilities used (SharedWindow, split_shared_memory, threading level) and the OpenMP C FFI wrapper that is built alongside the binary. `cobre-solver` -- section 4.3 defines LP solver threading suppression requirements.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested both `cobre-sddp` and `ferrompi`. **CONFIRMED** with `cobre-sddp` as primary (the spec describes how SDDP uses ferrompi, not ferrompi's own API).

#### 1.3 `communication-patterns.md`

- **Purpose**: "This spec defines the MPI communication patterns used by Cobre during SDDP training: the collective operations, their data payloads, wire formats, communication volume analysis, and optimization opportunities."
- **Primary Crate**: `ferrompi` -- the spec defines MPI collective operations (`MPI_Allgatherv`, `MPI_Allreduce`, `MPI_Bcast`), `SharedWindow<T>` usage, persistent collective optimization, and deterministic communication invariants. These are all ferrompi API concerns.
- **Secondary Crate(s)**: `cobre-sddp` -- the communication patterns serve the SDDP training loop (cut synchronization, trial point exchange, convergence statistics). The data payloads (section 2) encode SDDP-specific structures.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `ferrompi` as primary and `cobre-sddp` as secondary. **CONFIRMED**. The spec's content is MPI communication design, not algorithm logic.

#### 1.4 `memory-architecture.md`

- **Purpose**: "This spec defines the memory architecture for Cobre: data ownership categories, per-rank memory budget derived from approved specifications, NUMA-aware allocation principles, and memory growth analysis across SDDP iterations."
- **Primary Crate**: `cobre-sddp` -- the memory architecture is driven by the SDDP training loop's data ownership model (section 1): shared read-only data, thread-local solver workspaces, rank-local cut pool growth. The per-rank memory budget (section 2) and hot-path allocation avoidance (section 4) are SDDP training requirements.
- **Secondary Crate(s)**: `cobre-solver` -- solver workspace memory is the dominant budget item (~912 MB of ~1.2 GB per rank, section 2.1). NUMA-aware allocation (section 3) directly affects solver workspace placement.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `cobre-sddp` primary, `cobre-solver` secondary. **CONFIRMED**.

#### 1.5 `shared-memory-aggregation.md`

- **Purpose**: "This spec defines the intra-node shared memory usage patterns, reproducibility guarantees, and performance monitoring for Cobre."
- **Primary Crate**: `cobre-sddp` -- the spec defines shared memory usage for SDDP training data (opening tree, input case data, cut pool), reproducibility guarantees for the SDDP algorithm (section 3: bit-for-bit identical results regardless of rank/thread count), and performance monitoring interpretation (section 4).
- **Secondary Crate(s)**: `ferrompi` -- sections 1.1-1.4 detail `SharedWindow<T>` allocation patterns and `split_shared_memory()` usage.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `cobre-sddp` as primary. **CONFIRMED**. The spec is about how SDDP uses shared memory, not about the shared memory API itself.

#### 1.6 `checkpointing.md`

- **Purpose**: "This spec defines how Cobre persists training state for fault tolerance (checkpointing) and supports resuming training or warm-starting from a previously trained policy."
- **Primary Crate**: `cobre-sddp` -- checkpoint contents (section 2) are entirely SDDP training state: cut pool, cut activity, solver basis, iteration counter, RNG state, convergence history. The three execution modes (fresh/warm_start/resume, section 3) govern SDDP training initialization. Signal handling integration (section 4) is SDDP-loop-aware.
- **Secondary Crate(s)**: `cobre-io` -- the checkpoint serialization format is FlatBuffers (defined in `binary-formats.md`), and the actual write/read operations are I/O layer responsibilities. `cobre-cli` -- signal handling (SIGTERM/SIGINT) and execution mode selection are CLI lifecycle concerns.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `cobre-sddp` and `cobre-io`. **CONFIRMED** with the addition of `cobre-cli` as secondary.

#### 1.7 `slurm-deployment.md`

- **Purpose**: "This spec defines SLURM job scripts and deployment patterns for Cobre on HPC clusters."
- **Primary Crate**: `cobre-cli` -- the spec defines job scripts that launch the `cobre` binary, SLURM environment variables read by the binary at startup, checkpoint/resume integration via CLI invocation, and parameter study sweeps. The binary is what gets deployed and interacts with the scheduler.
- **Secondary Crate(s)**: `ferrompi` -- the binary reads SLURM topology variables via `ferrompi::slurm` helpers. The spec references `ferrompi::init_with_threading(Multiple)` and `ferrompi::slurm::local_rank()`.
- **Note**: This is a **deployment/operations spec**, not an implementation spec. It does not define any Rust API. Its "crate" assignment is to `cobre-cli` because the binary is the deployment artifact, but the spec's primary audience is operators, not developers.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `cobre-cli` with the caveat that it is a deployment document. **CONFIRMED**.

#### 1.8 `synchronization.md`

- **Purpose**: "This spec defines the synchronization architecture for Cobre: the complete set of MPI synchronization points during SDDP iterations, the forward-to-backward transition, per-stage barrier semantics in the backward pass, and thread coordination within a rank."
- **Primary Crate**: `cobre-sddp` -- the synchronization points (section 1) are defined in terms of SDDP algorithm phases (forward pass, backward pass, iteration boundary). The cut accumulation pattern (section 3) describes how SDDP cuts are collected across threads.
- **Secondary Crate(s)**: `ferrompi` -- the MPI collective operations (`MPI_Allgatherv`, `MPI_Allreduce`, `MPI_Barrier`) are ferrompi API calls.
- **Ticket-009 assessment vs. ticket context**: The ticket suggested `ferrompi` primary, `cobre-sddp` secondary. After reading the spec, the content is primarily about SDDP algorithm synchronization semantics (when to synchronize, what data to exchange, why per-stage barriers are needed), with ferrompi providing the primitives. **CORRECTED**: `cobre-sddp` is primary, `ferrompi` is secondary. The spec answers "when and why does SDDP synchronize" rather than "how do MPI primitives work."

---

## 2. Check M2 -- Config and Deferred Mapping

### 2.1 `configuration-reference.md`

- **Purpose**: "This spec provides a comprehensive mapping between Cobre configuration options and their effects on LP subproblem construction and solver behavior."
- **Primary Crate**: `cobre-cli` -- the spec defines the `config.json` and `stages.json` schemas that the CLI parses at startup. Section 7 provides a complete JSON example.
- **Secondary Crate(s)**: `cobre-sddp` -- the majority of configuration fields directly govern SDDP training behavior: `training.forward_passes` (forward scenario count), `training.cut_selection` (cut pruning), `training.stopping_rules` (convergence), `upper_bound_evaluation` (inner approximation). Section 8 maps each formulation topic to its config source. `cobre-stochastic` -- `stages.json` fields (`scenario_source`, `n_openings`, `risk_measure`) govern the stochastic model. `cobre-core` -- `modeling.inflow_non_negativity` affects LP variable construction in the core entity model.
- **Dual nature**: The spec is jointly owned by `cobre-cli` (parsing) and `cobre-sddp` (semantics). The primary assignment goes to `cobre-cli` because the spec defines the _configuration schema_ (JSON keys, types, defaults, validation) that the CLI is responsible for parsing and distributing.

### 2.2 `deferred.md` -- Per-Feature Crate Assignment

The deferred features spec contains 18 numbered features (C.1 through C.18) plus 3 additional deferred algorithm variants. Each is mapped to its target crate below.

| Feature | Name                                  | Primary Crate      | Secondary Crate(s)                           | Category                 | Notes                                                                |
| ------- | ------------------------------------- | ------------------ | -------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| C.1     | GNL Thermal Plants                    | `cobre-sddp`       | `cobre-core`, `cobre-solver`                 | Math/LP extension        | Requires SDDiP (MIP solver integration), Lagrangian relaxation       |
| C.2     | Battery Energy Storage Systems        | `cobre-sddp`       | `cobre-core`, `cobre-io`                     | Math/LP extension        | Linear LP formulation, new state variable (SOC)                      |
| C.3     | Multi-Cut Formulation                 | `cobre-sddp`       | --                                           | Algorithm variant        | LP construction change: multiple $\theta_\omega$ variables per stage |
| C.4     | Markovian Policy Graphs               | `cobre-sddp`       | `cobre-stochastic`                           | Algorithm variant        | Policy graph with regime-dependent cuts and transitions              |
| C.5     | Non-Controllable Sources (Wind/Solar) | `cobre-sddp`       | `cobre-core`, `cobre-stochastic`, `cobre-io` | Math/LP extension        | Stochastic generation with curtailment                               |
| C.6     | FPHA Enhancements                     | `cobre-sddp`       | `cobre-core`                                 | Math extension           | Variable efficiency, pumped hydro, dynamic recomputation             |
| C.7     | Temporal Scope Decoupling             | `cobre-sddp`       | `cobre-core`, `cobre-io`                     | Architecture extension   | Multi-period LP within single SDDP stage (SPARHTACUS)                |
| C.8     | CEPEL PAR(p)-A Variant                | `cobre-stochastic` | `cobre-io`                                   | Math extension           | Lognormal PAR variant, same input schema                             |
| C.9     | Policy Compatibility Validation       | `cobre-io`         | `cobre-sddp`, `cobre-cli`                    | Cross-cutting            | Validates input vs. policy metadata on resume/simulation             |
| C.10    | Fine-Grained Temporal Resolution      | `cobre-sddp`       | `cobre-core`, `cobre-io`                     | Architecture extension   | Typical days within stages, LP construction changes                  |
| C.11    | User-Supplied Noise Openings          | `cobre-stochastic` | `cobre-io`                                   | Data/scenario extension  | Direct noise input bypassing internal generation                     |
| C.12    | Complete Tree Solver Integration      | `cobre-sddp`       | `cobre-stochastic`                           | Algorithm variant        | DECOMP-style tree enumeration, replaces sampling                     |
| C.13    | Alternative Forward Pass Model        | `cobre-sddp`       | `cobre-solver`                               | Algorithm variant        | Dual LP models (training + simulation-only)                          |
| C.14    | Monte Carlo Backward Sampling         | `cobre-sddp`       | --                                           | Algorithm variant        | Sample $n$ openings instead of evaluating all                        |
| C.15    | Risk-Adjusted Forward Sampling        | `cobre-sddp`       | --                                           | Algorithm variant        | Bias forward sampling toward distribution tails                      |
| C.16    | Revisiting Forward Pass               | `cobre-sddp`       | --                                           | Algorithm variant        | Re-solve from previously visited states                              |
| C.17    | Forward Pass State Deduplication      | `cobre-sddp`       | --                                           | Performance optimization | Merge near-identical trial points before backward pass               |
| C.18    | Pipelined Backward Pass               | `cobre-sddp`       | `ferrompi`                                   | HPC optimization         | Non-blocking MPI for overlapped communication                        |
| --      | Objective States                      | `cobre-sddp`       | `cobre-stochastic`                           | Algorithm variant        | Exogenous price processes                                            |
| --      | Belief States (POMDP)                 | `cobre-sddp`       | --                                           | Algorithm variant        | Partially observable hidden states                                   |
| --      | Duality Handlers (Lagrangian)         | `cobre-sddp`       | `cobre-solver`                               | Algorithm variant        | MIP cuts via Lagrangian relaxation                                   |

**Summary**: Of 21 deferred features, 17 have `cobre-sddp` as primary, 2 have `cobre-stochastic`, 1 has `cobre-io`, and 1 has `cobre-sddp`. All 21 features have at least one target crate assigned. **CHECK PASSES**.

---

## 3. Check M3 -- SUMMARY.md Verification

All 10 files verified in `src/SUMMARY.md`:

| #   | Spec File                      | SUMMARY.md Line | Section Heading            | Status  |
| --- | ------------------------------ | --------------- | -------------------------- | ------- |
| 1   | `work-distribution.md`         | 101             | High-Performance Computing | CORRECT |
| 2   | `hybrid-parallelism.md`        | 102             | High-Performance Computing | CORRECT |
| 3   | `communication-patterns.md`    | 103             | High-Performance Computing | CORRECT |
| 4   | `memory-architecture.md`       | 104             | High-Performance Computing | CORRECT |
| 5   | `shared-memory-aggregation.md` | 105             | High-Performance Computing | CORRECT |
| 6   | `checkpointing.md`             | 106             | High-Performance Computing | CORRECT |
| 7   | `slurm-deployment.md`          | 107             | High-Performance Computing | CORRECT |
| 8   | `synchronization.md`           | 108             | High-Performance Computing | CORRECT |
| 9   | `configuration-reference.md`   | 110             | Configuration              | CORRECT |
| 10  | `deferred.md`                  | 111             | Deferred Features          | CORRECT |

**CHECK PASSES**: All 10 files present under correct headings.

---

## 4. 10-Row Mapping Table (This Ticket)

| #   | Spec File                      | Section                | Primary Crate | Secondary Crate(s)                             | Placement         | Findings     |
| --- | ------------------------------ | ---------------------- | ------------- | ---------------------------------------------- | ----------------- | ------------ |
| 41  | `work-distribution.md`         | `specs/hpc/`           | `cobre-sddp`  | `ferrompi`                                     | CORRECT           | None         |
| 42  | `hybrid-parallelism.md`        | `specs/hpc/`           | `cobre-sddp`  | `ferrompi`, `cobre-solver`                     | CORRECT           | None         |
| 43  | `communication-patterns.md`    | `specs/hpc/`           | `ferrompi`    | `cobre-sddp`                                   | CORRECT           | None         |
| 44  | `memory-architecture.md`       | `specs/hpc/`           | `cobre-sddp`  | `cobre-solver`                                 | CORRECT           | None         |
| 45  | `shared-memory-aggregation.md` | `specs/hpc/`           | `cobre-sddp`  | `ferrompi`                                     | CORRECT           | None         |
| 46  | `checkpointing.md`             | `specs/hpc/`           | `cobre-sddp`  | `cobre-io`, `cobre-cli`                        | CORRECT           | None         |
| 47  | `slurm-deployment.md`          | `specs/hpc/`           | `cobre-cli`   | `ferrompi`                                     | CORRECT           | F-1 (LOW)    |
| 48  | `synchronization.md`           | `specs/hpc/`           | `cobre-sddp`  | `ferrompi`                                     | CORRECT (see F-2) | F-2 (MEDIUM) |
| 49  | `configuration-reference.md`   | `specs/configuration/` | `cobre-cli`   | `cobre-sddp`, `cobre-stochastic`, `cobre-core` | CORRECT           | F-3 (LOW)    |
| 50  | `deferred.md`                  | `specs/` (top-level)   | (multi-crate) | See per-feature table in section 2.2           | CORRECT           | None         |

---

## 5. Check M4 -- Master 50-Row Spec-to-Crate Table

This table merges the 13-row table from ticket-007, the 27-row table from ticket-008, and the 10-row table from this ticket.

Severity counts per spec use the following definitions:

- **CRITICAL**: Spec in wrong section, missing from SUMMARY.md, or primary crate assignment incorrect
- **HIGH**: Secondary crate missing acknowledgment, or HPC spec incorrectly assigned
- **MEDIUM**: Ambiguous primary/secondary boundary requiring documented decision
- **LOW**: Cross-reference gap, dual-crate pattern to document, cosmetic issue

| #   | Spec File                       | Section           | Primary Crate                  | Secondary Crate(s)                             | Placement  | CRITICAL | HIGH  | MEDIUM |  LOW  |
| --- | ------------------------------- | ----------------- | ------------------------------ | ---------------------------------------------- | ---------- | :------: | :---: | :----: | :---: |
| 1   | `design-principles.md`          | overview          | `cobre-core`, `cobre-io`       | All crates (cross-cutting)                     | CORRECT    |    0     |   0   |   0    |   0   |
| 2   | `notation-conventions.md`       | overview          | (cross-cutting)                | All crates                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 3   | `production-scale-reference.md` | overview          | `cobre-sddp`, `cobre-solver`   | `ferrompi`, `cobre-io`                         | CORRECT    |    0     |   0   |   0    |   0   |
| 4   | `input-directory-structure.md`  | data-model        | `cobre-io`                     | `cobre-core`, `cobre-cli`                      | CORRECT    |    0     |   0   |   0    |   0   |
| 5   | `input-system-entities.md`      | data-model        | `cobre-core`                   | `cobre-io`                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 6   | `input-hydro-extensions.md`     | data-model        | `cobre-core`                   | `cobre-io`                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 7   | `input-scenarios.md`            | data-model        | `cobre-io`, `cobre-stochastic` | `cobre-core`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 8   | `input-constraints.md`          | data-model        | `cobre-io`                     | `cobre-core`, `cobre-sddp`                     | CORRECT    |    0     |   0   |   0    |   0   |
| 9   | `penalty-system.md`             | data-model        | `cobre-core`                   | `cobre-sddp`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 10  | `internal-structures.md`        | data-model        | `cobre-core`                   | `cobre-sddp`, `cobre-stochastic`               | CORRECT    |    0     |   0   |   0    |   0   |
| 11  | `output-schemas.md`             | data-model        | `cobre-io`                     | `cobre-sddp`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 12  | `output-infrastructure.md`      | data-model        | `cobre-io`                     | `ferrompi`, `cobre-sddp`                       | CORRECT    |    0     |   0   |   0    |   0   |
| 13  | `binary-formats.md`             | data-model        | `cobre-io`                     | `cobre-sddp`, `cobre-solver`                   | CORRECT    |    0     |   0   |   0    |   0   |
| 14  | `sddp-algorithm.md`             | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 15  | `lp-formulation.md`             | math              | `cobre-sddp`                   | `cobre-core`, `cobre-solver`                   | CORRECT    |    0     |   0   |   0    |   0   |
| 16  | `system-elements.md`            | math              | `cobre-core`                   | `cobre-sddp`                                   | CORRECT    |    0     |   0   |   0    |   1   |
| 17  | `block-formulations.md`         | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 18  | `hydro-production-models.md`    | math              | `cobre-sddp`                   | `cobre-core`                                   | CORRECT    |    0     |   0   |   0    |   1   |
| 19  | `cut-management.md`             | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 20  | `discount-rate.md`              | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 21  | `infinite-horizon.md`           | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 22  | `risk-measures.md`              | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 23  | `inflow-nonnegativity.md`       | math              | `cobre-sddp`                   | `cobre-stochastic`                             | CORRECT    |    0     |   0   |   0    |   0   |
| 24  | `par-inflow-model.md`           | math              | `cobre-stochastic`             | `cobre-io`, `cobre-core`                       | CORRECT    |    0     |   0   |   0    |   1   |
| 25  | `equipment-formulations.md`     | math              | `cobre-sddp`                   | `cobre-core`                                   | CORRECT    |    0     |   0   |   0    |   1   |
| 26  | `stopping-rules.md`             | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 27  | `upper-bound-evaluation.md`     | math              | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 28  | `training-loop.md`              | architecture      | `cobre-sddp`                   | `cobre-solver`, `cobre-stochastic`             | CORRECT    |    0     |   0   |   0    |   0   |
| 29  | `simulation-architecture.md`    | architecture      | `cobre-sddp`                   | `cobre-io`, `cobre-stochastic`                 | CORRECT    |    0     |   0   |   0    |   0   |
| 30  | `cli-and-lifecycle.md`          | architecture      | `cobre-cli`                    | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 31  | `validation-architecture.md`    | architecture      | `cobre-io`                     | `cobre-cli`                                    | CORRECT    |    0     |   0   |   0    |   0   |
| 32  | `input-loading-pipeline.md`     | architecture      | `cobre-io`                     | `cobre-core`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 33  | `scenario-generation.md`        | architecture      | `cobre-stochastic`             | `cobre-sddp`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 34  | `solver-abstraction.md`         | architecture      | `cobre-solver`                 | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 35  | `solver-highs-impl.md`          | architecture      | `cobre-solver`                 | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 36  | `solver-clp-impl.md`            | architecture      | `cobre-solver`                 | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 37  | `solver-workspaces.md`          | architecture      | `cobre-solver`                 | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 38  | `cut-management-impl.md`        | architecture      | `cobre-sddp`                   | `cobre-io`                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 39  | `convergence-monitoring.md`     | architecture      | `cobre-sddp`                   | --                                             | CORRECT    |    0     |   0   |   0    |   0   |
| 40  | `extension-points.md`           | architecture      | `cobre-sddp`                   | `cobre-stochastic`, `cobre-io`                 | CORRECT    |    0     |   0   |   0    |   0   |
| 41  | `work-distribution.md`          | hpc               | `cobre-sddp`                   | `ferrompi`                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 42  | `hybrid-parallelism.md`         | hpc               | `cobre-sddp`                   | `ferrompi`, `cobre-solver`                     | CORRECT    |    0     |   0   |   0    |   0   |
| 43  | `communication-patterns.md`     | hpc               | `ferrompi`                     | `cobre-sddp`                                   | CORRECT    |    0     |   0   |   0    |   0   |
| 44  | `memory-architecture.md`        | hpc               | `cobre-sddp`                   | `cobre-solver`                                 | CORRECT    |    0     |   0   |   0    |   0   |
| 45  | `shared-memory-aggregation.md`  | hpc               | `cobre-sddp`                   | `ferrompi`                                     | CORRECT    |    0     |   0   |   0    |   0   |
| 46  | `checkpointing.md`              | hpc               | `cobre-sddp`                   | `cobre-io`, `cobre-cli`                        | CORRECT    |    0     |   0   |   0    |   0   |
| 47  | `slurm-deployment.md`           | hpc               | `cobre-cli`                    | `ferrompi`                                     | CORRECT    |    0     |   0   |   0    |   1   |
| 48  | `synchronization.md`            | hpc               | `cobre-sddp`                   | `ferrompi`                                     | CORRECT    |    0     |   0   |   1    |   0   |
| 49  | `configuration-reference.md`    | configuration     | `cobre-cli`                    | `cobre-sddp`, `cobre-stochastic`, `cobre-core` | CORRECT    |    0     |   0   |   0    |   1   |
| 50  | `deferred.md`                   | specs (top-level) | (multi-crate)                  | See section 2.2                                | CORRECT    |    0     |   0   |   0    |   0   |
|     |                                 |                   |                                |                                                | **TOTALS** |  **0**   | **0** | **1**  | **6** |

---

## 6. Check M5 -- Crate Coverage Summary

### 6.1 Per-Crate Mapping Counts

Compiled from all 50 rows of the master table.

| Crate              | Primary Specs (count) | Primary Spec Files                            | Secondary Specs (count) | Coverage Gaps |
| ------------------ | :-------------------: | --------------------------------------------- | :---------------------: | ------------- |
| `cobre-sddp`       |          22           | rows 3, 14-15, 17-23, 25-29, 38-42, 44-46, 48 |           16            | None          |
| `cobre-core`       |           6           | rows 1, 5-6, 9-10, 16                         |           11            | None          |
| `cobre-io`         |           8           | rows 4, 7-8, 11-13, 31-32                     |           10            | None          |
| `cobre-stochastic` |           3           | rows 7, 24, 33                                |            8            | None          |
| `cobre-solver`     |           4           | rows 34-37                                    |            6            | None          |
| `cobre-cli`        |           3           | rows 30, 47, 49                               |            5            | None          |
| `ferrompi`         |           1           | row 43                                        |            9            | None          |

**Notes on counting**:

- Rows with dual primaries (rows 1, 3, 7) are counted once per primary crate listed.
- Row 2 (`notation-conventions.md`) is cross-cutting and not counted as primary for any specific crate.
- Row 50 (`deferred.md`) is multi-crate and not counted in primary totals; its 21 sub-features are mapped in section 2.2.

### 6.2 Coverage Gap Analysis

A crate has a "coverage gap" if it has a confirmed implementation responsibility that no spec covers.

| Crate              | Confirmed Responsibilities                                                                                                                                      | Spec Coverage                   | Gap? |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---- |
| `cobre-sddp`       | SDDP algorithm, training loop, LP construction, cut management, simulation, convergence, risk measures, work distribution, synchronization, memory architecture | 22 primary + 16 secondary specs | No   |
| `cobre-core`       | Entity types, internal structures, penalty system, design principles                                                                                            | 6 primary + 11 secondary specs  | No   |
| `cobre-io`         | Input parsing, output writing, validation, binary formats, loading pipeline                                                                                     | 8 primary + 10 secondary specs  | No   |
| `cobre-stochastic` | PAR model, scenario generation, noise correlation                                                                                                               | 3 primary + 8 secondary specs   | No   |
| `cobre-solver`     | Solver abstraction, HiGHS impl, CLP impl, workspaces                                                                                                            | 4 primary + 6 secondary specs   | No   |
| `cobre-cli`        | CLI lifecycle, config parsing, SLURM deployment                                                                                                                 | 3 primary + 5 secondary specs   | No   |
| `ferrompi`         | MPI communication, SharedWindow, topology detection                                                                                                             | 1 primary + 9 secondary specs   | No   |

**No coverage gaps detected.** Every crate has at least one primary spec and multiple secondary references across the spec corpus. The `ferrompi` crate has only 1 primary spec (`communication-patterns.md`) but 9 secondary references, reflecting its nature as an infrastructure library consumed by other crates rather than a domain-specific component.

---

## 7. Findings Summary

| ID  | Severity | Spec File                    | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | LOW      | `slurm-deployment.md`        | This is a deployment/operations spec, not an implementation spec. It defines SLURM job scripts (shell), environment variables, and checkpoint/resume integration -- not Rust API. The "primary crate" assignment to `cobre-cli` reflects the deployment artifact (the binary), but this spec's audience is operators, not crate developers. No action required, but the crate doc page for `cobre-cli` should note this spec as "deployment guidance" rather than "implementation spec."                |
| F-2 | MEDIUM   | `synchronization.md`         | The ticket context suggested `ferrompi` as primary and `cobre-sddp` as secondary. After reading the spec, this assignment was **corrected**: `cobre-sddp` is primary because the spec defines SDDP algorithm synchronization semantics (when to synchronize, what data to exchange, per-stage barrier rationale), not MPI primitive specifications. `ferrompi` is secondary as the provider of the primitives. This correction does not change any file placement -- it only affects the mapping table. |
| F-3 | LOW      | `configuration-reference.md` | Dual-nature spec: the JSON schema definition is a `cobre-cli` concern (parsing), but the semantic meaning of most fields is a `cobre-sddp` concern (training behavior). The primary assignment to `cobre-cli` follows the convention that config schema ownership belongs to the parsing layer. Both `cobre-cli` and `cobre-sddp` crate doc pages should cross-reference this spec.                                                                                                                     |

**Aggregate from all tickets (007 + 008 + 009)**:

| Severity | Ticket-007 | Ticket-008 | Ticket-009 | Total |
| -------- | :--------: | :--------: | :--------: | :---: |
| CRITICAL |     0      |     0      |     0      | **0** |
| HIGH     |     0      |     0      |     0      | **0** |
| MEDIUM   |     0      |     0      |     1      | **1** |
| LOW      |     0      |     4      |     2      | **6** |

The single MEDIUM finding (F-2) is a mapping correction documented in this report. The 6 LOW findings are all cross-reference documentation suggestions with no impact on correctness.

---

## 8. Acceptance Criteria Verification

- [x] Given `hybrid-parallelism.md`, when crate assignment is determined, then both `cobre-sddp` (primary: orchestration) and `ferrompi` (secondary: MPI primitives) are acknowledged as targets -- see section 1.2 and row 42.
- [x] Given `checkpointing.md`, when crate assignment is determined, then both `cobre-sddp` (primary: FCF checkpoint logic) and `cobre-io` (secondary: FlatBuffers serialization) are acknowledged -- see section 1.6 and row 46.
- [x] Given `deferred.md`, when the 18+ deferred features are mapped, then each feature has at least one target crate assigned -- see section 2.2 (21 features mapped).
- [x] Given the completed master table, when crate coverage summary is computed, then no crate has a confirmed responsibility with zero spec coverage -- see section 6.2 (0 gaps).
- [x] The ticket produces the 50-row master spec-to-crate table -- see section 5.
- [x] The ticket produces the per-crate coverage summary table -- see section 6.1.

---

_End of audit report._
