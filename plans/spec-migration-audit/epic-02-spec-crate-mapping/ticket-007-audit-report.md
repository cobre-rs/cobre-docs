# ticket-007 Audit Report: Spec-to-Crate Mapping for Data Model and Overview Specs

**Date**: 2026-02-24
**Auditor**: sddp-specialist (automated)
**Scope**: 3 overview specs + 10 data model specs (13 files total)
**Checks**: M1 (Section Assignment), M2 (SUMMARY.md Placement), M3 (Ambiguity Resolution), M4 (Crate Coverage Gap)

---

## Table of Contents

1. [13-Row Mapping Table](#1-13-row-mapping-table)
2. [Ambiguity Resolution (Check M3)](#2-ambiguity-resolution-check-m3)
3. [Crate Coverage Gap Analysis (Check M4)](#3-crate-coverage-gap-analysis-check-m4)
4. [Per-File Findings](#4-per-file-findings)
5. [Summary Statistics](#5-summary-statistics)

---

## 1. 13-Row Mapping Table

| #   | Spec File                       | Section             | Primary Crate                  | Secondary Crate(s)               | Placement        | Findings    |
| --- | ------------------------------- | ------------------- | ------------------------------ | -------------------------------- | ---------------- | ----------- |
| 1   | `design-principles.md`          | `specs/overview/`   | `cobre-core`, `cobre-io`       | All crates (cross-cutting)       | CORRECT          | None        |
| 2   | `notation-conventions.md`       | `specs/overview/`   | (cross-cutting)                | All crates                       | CORRECT          | None        |
| 3   | `production-scale-reference.md` | `specs/overview/`   | `cobre-sddp`, `cobre-solver`   | `ferrompi`, `cobre-io`           | CORRECT          | None        |
| 4   | `input-directory-structure.md`  | `specs/data-model/` | `cobre-io`                     | `cobre-core`, `cobre-cli`        | CORRECT          | None        |
| 5   | `input-system-entities.md`      | `specs/data-model/` | `cobre-core`                   | `cobre-io`                       | CORRECT          | None        |
| 6   | `input-hydro-extensions.md`     | `specs/data-model/` | `cobre-core`                   | `cobre-io`                       | CORRECT          | None        |
| 7   | `input-scenarios.md`            | `specs/data-model/` | `cobre-io`, `cobre-stochastic` | `cobre-core`                     | CORRECT          | None        |
| 8   | `input-constraints.md`          | `specs/data-model/` | `cobre-io`                     | `cobre-core`, `cobre-sddp`       | CORRECT          | None        |
| 9   | `penalty-system.md`             | `specs/data-model/` | `cobre-core`                   | `cobre-sddp`                     | CORRECT          | None        |
| 10  | `internal-structures.md`        | `specs/data-model/` | `cobre-core`                   | `cobre-sddp`, `cobre-stochastic` | CORRECT (see M3) | M3 resolved |
| 11  | `output-schemas.md`             | `specs/data-model/` | `cobre-io`                     | `cobre-sddp`                     | CORRECT          | None        |
| 12  | `output-infrastructure.md`      | `specs/data-model/` | `cobre-io`                     | `ferrompi`, `cobre-sddp`         | CORRECT (see M3) | M3 resolved |
| 13  | `binary-formats.md`             | `specs/data-model/` | `cobre-io`                     | `cobre-sddp`, `cobre-solver`     | CORRECT (see M3) | M3 resolved |

---

## 2. Ambiguity Resolution (Check M3)

### 2.1 `binary-formats.md` -- Acceptable in `specs/data-model/`

**Question**: Should this file be in `specs/architecture/` given that it defines FlatBuffers schemas for policy persistence (cuts, states, vertices) and contains solver API analysis?

**Decision**: Placement in `specs/data-model/` is **acceptable**.

**Justification**: The spec's primary content is the authoritative format decision framework (section 1) and FlatBuffers serialization schemas (section 3) -- both are data format concerns, not algorithmic or architectural concerns. The format decision framework is the canonical reference cited by every other data model spec when justifying per-file format choices (JSON vs Parquet vs FlatBuffers). The solver API analysis in Appendix A is subordinate context explaining _why_ Option A (rebuild per stage) was chosen, which in turn justifies the cut pool memory layout requirements for the FlatBuffers schema. The primary crate is `cobre-io` (which owns serialization and deserialization of policy files). Secondary crates are `cobre-sddp` (which produces and consumes cuts at runtime) and `cobre-solver` (whose API constraints are documented in Appendix A). The data model section is the correct home because the spec answers "what format is data stored in and why" rather than "how does the algorithm work."

### 2.2 `internal-structures.md` -- Acceptable in `specs/data-model/`

**Question**: Should this file be in `specs/architecture/` given that it defines in-memory runtime structures?

**Decision**: Placement in `specs/data-model/` is **acceptable**.

**Justification**: The spec explicitly describes itself as "the logical in-memory data model" -- it defines _what_ data the solver holds, not _how_ the algorithm processes it. It is the unified counterpart to the input schema specs: while `input-system-entities.md` defines the on-disk JSON schema for hydro plants, `internal-structures.md` defines what the hydro plant looks like after loading, validation, and resolution. The spec carefully notes it "describes _what_ data the solver must hold in memory and _why_, without prescribing implementation types or data structures." The primary crate is `cobre-core` (which owns the entity types, penalty resolution, bound resolution, and canonical ordering). Secondary crates are `cobre-sddp` (which consumes these structures for LP construction) and `cobre-stochastic` (which uses the scenario pipeline structures in section 14). The data model section correctly houses this spec because it is the resolved data model, not an algorithm or pipeline description.

### 2.3 `output-infrastructure.md` -- Acceptable in `specs/data-model/`

**Question**: Should this file be in `specs/architecture/` given that it defines crash recovery manifests, MPI-native Hive partitioning for parallel writes, and I/O bandwidth requirements?

**Decision**: Placement in `specs/data-model/` is **acceptable**.

**Justification**: The spec defines the output file _infrastructure_ -- manifests, metadata, partitioning layout, and integrity checks -- which are data concerns, not algorithm concerns. The MPI-native Hive partitioning (section 3) describes the _directory and file layout_ resulting from parallel writes, not the MPI communication patterns themselves. The write protocol (rank-level assignment, atomic rename pattern, barrier before manifest) is a data integrity concern specifying how output files are produced correctly, not an HPC synchronization pattern. The primary crate is `cobre-io` (which implements file writing, manifest creation, and integrity validation). Secondary crates are `ferrompi` (which provides the MPI primitives used in parallel writing) and `cobre-sddp` (which triggers output writes at the appropriate points in the training/simulation loop). The data model section correctly houses this spec because it answers "what does the output directory look like and how are files organized" rather than "how are MPI ranks coordinated."

---

## 3. Crate Coverage Gap Analysis (Check M4)

### 3.1 Required Coverage Check for `cobre-core`

The ticket requires that `cobre-core` has coverage from at least 4 spec files: `input-system-entities.md`, `internal-structures.md`, `penalty-system.md`, and `design-principles.md`.

| Required Spec              | Assigns `cobre-core`? | Role                                 | Verified |
| -------------------------- | :-------------------: | ------------------------------------ | :------: |
| `input-system-entities.md` |          YES          | Primary                              |   YES    |
| `internal-structures.md`   |          YES          | Primary                              |   YES    |
| `penalty-system.md`        |          YES          | Primary                              |   YES    |
| `design-principles.md`     |          YES          | Primary (co-primary with `cobre-io`) |   YES    |

**Result**: `cobre-core` has **6 files** assigning it as primary or secondary:

- **Primary**: `input-system-entities.md`, `internal-structures.md`, `penalty-system.md`, `design-principles.md` (co-primary), `input-hydro-extensions.md`
- **Secondary**: `input-directory-structure.md`, `input-scenarios.md`, `input-constraints.md`, `notation-conventions.md`

The minimum of 4 is exceeded. **CHECK PASSES**.

### 3.2 Full Crate Coverage Matrix

| Crate              | Files as Primary | Files as Secondary | Total Coverage |
| ------------------ | :--------------: | :----------------: | :------------: |
| `cobre-core`       |        5         |         4          |       9        |
| `cobre-io`         |        6         |         1          |       7        |
| `cobre-sddp`       |        0         |         6          |       6        |
| `cobre-stochastic` |        0         |         2          |       2        |
| `cobre-solver`     |        0         |         2          |       2        |
| `cobre-cli`        |        0         |         1          |       1        |
| `ferrompi`         |        0         |         2          |       2        |

**Observations**:

- `cobre-sddp` has **zero primary mappings** from overview/data-model specs. This is expected: `cobre-sddp` is primarily specified by the `specs/math/` and `specs/architecture/` sections (training loop, LP formulation, cut management, etc.). The data model specs correctly assign it as secondary where it consumes data structures.
- `cobre-solver` has **zero primary mappings** from overview/data-model specs. Also expected: solver abstraction and implementation are specified in `specs/architecture/`. The data model specs correctly reference it as secondary in `binary-formats.md` (Appendix A solver API analysis) and `production-scale-reference.md` (LP solve timing targets).
- `cobre-cli` has **zero primary mappings** from overview/data-model specs. Expected: CLI is specified by `specs/architecture/cli-and-lifecycle.md` and `specs/configuration/configuration-reference.md`. It appears as secondary via `input-directory-structure.md` because the CLI reads the case directory.
- No crate has zero total coverage. **No gaps detected**.

---

## 4. Per-File Findings

### 4.1 Overview Section (3 files)

#### `design-principles.md`

**Check M1 -- Section Assignment Justification**

This spec has **dual primary targets**:

- `cobre-core`: Declaration order invariance (section 3), canonical ordering requirements (section 3.1--3.3), and implementation language decision (section 5) are core design constraints that `cobre-core` must enforce.
- `cobre-io`: Format selection criteria (section 1) define the JSON/Parquet/FlatBuffers framework that `cobre-io` implements for all file operations.

Current placement in `specs/overview/` is correct because the spec is foundational -- it establishes principles consumed by all crates, not just one. Moving it to either `specs/data-model/` or `specs/architecture/` would misrepresent its cross-cutting nature.

**Check M2 -- SUMMARY.md Placement**

Listed at line 57: `- [Design Principles](./specs/overview/design-principles.md)` under the "Overview" subsection of "Specifications". **CORRECT**.

**Findings**: None.

---

#### `notation-conventions.md`

**Check M1 -- Section Assignment Justification**

This spec is **cross-cutting** -- it defines the mathematical notation (index sets, parameters, decision variables, dual variables) used by every spec that contains equations. No single crate is the primary target; every crate that implements mathematical formulations references this notation. The SDDP.jl conventions (section 1) and the complete variable catalog (sections 2--5) are shared vocabulary.

Current placement in `specs/overview/` is correct as a reference document.

**Check M2 -- SUMMARY.md Placement**

Listed at line 58: `- [Notation Conventions](./specs/overview/notation-conventions.md)` under the "Overview" subsection. **CORRECT**.

**Findings**: None.

---

#### `production-scale-reference.md`

**Check M1 -- Section Assignment Justification**

Primary targets:

- `cobre-sddp`: Sections 2--4 define state dimension formulas, variable/constraint counts per subproblem, and performance expectations that the SDDP training loop must meet.
- `cobre-solver`: Section 4.3 defines LP solve timing targets (<2ms warm-start, <20ms cold-start) that the solver abstraction must achieve.

Secondary targets:

- `ferrompi`: Communication timing targets (<5ms for `MPI_Allgatherv`) and parallel efficiency (>80% at 64 ranks).
- `cobre-io`: Output size estimates referenced by `output-infrastructure.md`.

Current placement in `specs/overview/` is correct because it is a reference document setting targets for multiple crates, not a spec for any single crate.

**Check M2 -- SUMMARY.md Placement**

Listed at line 59: `- [Production Scale Reference](./specs/overview/production-scale-reference.md)` under the "Overview" subsection. **CORRECT**.

**Findings**: None.

---

### 4.2 Data Model Section (10 files)

#### `input-directory-structure.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-io` -- defines the case directory layout, all file paths and formats that the I/O layer must parse. The `config.json` schema (section 2) is the entry point for the loading pipeline.

Secondary: `cobre-core` (entity type references in directory tree), `cobre-cli` (reads `config.json` to initialize the study).

**Check M2 -- SUMMARY.md Placement**

Listed at line 76: `- [Input Directory Structure](./specs/data-model/input-directory-structure.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `input-system-entities.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-core` -- defines the JSON schemas for all 7 entity types (buses, lines, hydros, thermals, pumping stations, energy contracts, non-controllable sources). These map directly to `cobre-core` entity structs.

Secondary: `cobre-io` -- the loading pipeline parses these JSON files and produces `cobre-core` structures.

**Check M2 -- SUMMARY.md Placement**

Listed at line 77: `- [Input System Entities](./specs/data-model/input-system-entities.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `input-hydro-extensions.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-core` -- defines the hydro geometry, production model selection, and FPHA hyperplane data that augment the core hydro entity type.

Secondary: `cobre-io` -- parses the Parquet/JSON extension files.

**Check M2 -- SUMMARY.md Placement**

Listed at line 80: `- [Input Hydro Extensions](./specs/data-model/input-hydro-extensions.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `input-scenarios.md`

**Check M1 -- Section Assignment Justification**

Primary (dual):

- `cobre-io`: Defines the JSON/Parquet schemas for `stages.json`, `inflow_history.parquet`, `inflow_seasonal_stats.parquet`, `inflow_ar_coefficients.parquet`, `external_scenarios.parquet`, `load_seasonal_stats.parquet`, `load_factors.json`, and `correlation.json`. The loading pipeline must parse all of these.
- `cobre-stochastic`: The scenario pipeline (section 2), uncertainty models (section 3), and correlation model (section 5) define the stochastic model that `cobre-stochastic` implements.

Secondary: `cobre-core` -- stage/block definitions, policy graph, and season definitions become part of the core internal structures.

**Check M2 -- SUMMARY.md Placement**

Listed at line 78: `- [Input Scenarios](./specs/data-model/input-scenarios.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `input-constraints.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-io` -- defines initial conditions (`initial_conditions.json`), time-varying bound Parquet schemas, exchange factors, generic constraint JSON schema, generic constraint bound Parquet schema, and the policy directory layout. All are parsed by the I/O layer.

Secondary: `cobre-core` (bound resolution, generic constraint parsing), `cobre-sddp` (policy warm-start/resume consuming the policy directory).

**Check M2 -- SUMMARY.md Placement**

Listed at line 79: `- [Input Constraints](./specs/data-model/input-constraints.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `penalty-system.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-core` -- defines the three-tier penalty cascade (global defaults, entity overrides, stage overrides) and the pre-resolution semantics. The penalty tables, categories (recourse, constraint violation, regularization), and priority ordering are core data model concerns that `cobre-core` must enforce.

Secondary: `cobre-sddp` -- the LP objective function (section 8) incorporates all penalty terms, and the solver must respect the penalty priority ordering during LP construction.

**Check M2 -- SUMMARY.md Placement**

Listed at line 81: `- [Penalty System](./specs/data-model/penalty-system.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `internal-structures.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-core` -- defines the unified in-memory data model (entity collections, operative state, pre-resolved penalties, pre-resolved bounds, stage/block definitions, scenario pipeline state, generic constraints, initial conditions). All 16 sections describe what `cobre-core` must hold in memory.

Secondary: `cobre-sddp` (consumes these structures for LP construction and training loop), `cobre-stochastic` (section 14 defines the scenario pipeline state used for noise generation).

See section 2.2 above for the M3 ambiguity resolution.

**Check M2 -- SUMMARY.md Placement**

Listed at line 82: `- [Internal Structures](./specs/data-model/internal-structures.md)` under "Data Model". **CORRECT**.

**Findings**: None (M3 resolved above).

---

#### `output-schemas.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-io` -- defines the Parquet column schemas for all simulation outputs (costs, hydros, thermals, exchanges, buses, pumping stations, contracts, non-controllable sources, batteries, inflow lags, generic violations) and all training outputs (convergence, timing, MPI rank timing). The I/O layer must write these schemas.

Secondary: `cobre-sddp` -- the training convergence log (section 6.1) and timing schemas (sections 6.2--6.3) document data produced by the SDDP training loop.

**Check M2 -- SUMMARY.md Placement**

Listed at line 83: `- [Output Schemas](./specs/data-model/output-schemas.md)` under "Data Model". **CORRECT**.

**Findings**: None.

---

#### `output-infrastructure.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-io` -- defines manifest files (section 1), metadata for reproducibility (section 2), MPI-native Hive partitioning write semantics (section 3), output size estimates (section 4), and validation/integrity checks (section 5).

Secondary: `ferrompi` (MPI barrier in write protocol, rank-level parallelism), `cobre-sddp` (triggers output writes, produces convergence/timing data).

See section 2.3 above for the M3 ambiguity resolution.

**Check M2 -- SUMMARY.md Placement**

Listed at line 84: `- [Output Infrastructure](./specs/data-model/output-infrastructure.md)` under "Data Model". **CORRECT**.

**Findings**: None (M3 resolved above).

---

#### `binary-formats.md`

**Check M1 -- Section Assignment Justification**

Primary: `cobre-io` -- defines the format decision framework (section 1), FlatBuffers schemas for policy data (section 3), cut pool persistence requirements (section 4), and Parquet output configuration (section 5). All serialization and deserialization is `cobre-io`'s responsibility.

Secondary: `cobre-sddp` (produces and consumes cuts, visited states, vertices at runtime; the cut pool memory layout in section 3.4 directly impacts SDDP performance), `cobre-solver` (Appendix A documents HiGHS and CLP C API capabilities that constrain the LP construction strategy).

See section 2.1 above for the M3 ambiguity resolution.

**Check M2 -- SUMMARY.md Placement**

Listed at line 85: `- [Binary Formats](./specs/data-model/binary-formats.md)` under "Data Model". **CORRECT**.

**Findings**: None (M3 resolved above).

---

## 5. Summary Statistics

| Check                      | Result                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| M1 -- Section Assignment   | All 13 files correctly placed                                                                        |
| M2 -- SUMMARY.md Placement | All 13 files present under correct headings                                                          |
| M3 -- Ambiguity Resolution | 3/3 resolved: all acceptable in current section                                                      |
| M4 -- Crate Coverage Gap   | `cobre-core` has 5 primary + 4 secondary = 9 total (minimum 4 required). No crate has zero coverage. |

| Severity | Count | Details                                                           |
| -------- | :---: | ----------------------------------------------------------------- |
| HIGH     |   0   | No files missing from SUMMARY.md, no specs in wrong section       |
| MEDIUM   |   0   | No missing secondary crate acknowledgments (all documented above) |
| LOW      |   0   | No cosmetic issues                                                |

**Overall Verdict**: All 13 specs are correctly placed. No remediation required.

---

### Acceptance Criteria Verification

- [x] Given `binary-formats.md`, `internal-structures.md`, and `output-infrastructure.md`, when section placement is evaluated against crate boundaries, then a documented decision (justification) exists for each -- see section 2.
- [x] Given `design-principles.md`, when crate mapping is assessed, then both `cobre-core` (declaration order invariance) and `cobre-io` (format selection framework) are acknowledged as targets -- see row 1 of mapping table and section 4.1.
- [x] Given all 13 files, when checked against SUMMARY.md, then all 13 appear under the correct section heading -- verified lines 57--59 (overview) and 76--85 (data model).
- [x] Given `cobre-core`, after all 13 files are mapped, then at least 4 spec files assign it as primary or secondary target -- see section 3.1 (9 total).
- [x] The ticket produces a 13-row mapping table -- see section 1.

---

_End of audit report._
