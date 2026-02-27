# Report 031 -- Final Implementation Readiness Verdict

**Date**: 2026-02-26
**Scope**: Confirmation of all 19 conditions from report-017, GAP-039 assessment, cross-reference integrity integration, gap inventory verification
**Inputs**: Reports 017, 030; accumulated learnings through Epic 07; spec-gap-inventory.md; spot-checked spec files
**Deliverable**: Final READY / STILL CONDITIONAL determination superseding the CONDITIONAL GO from report-017

---

## 1. Verdict

### READY

The Cobre specification corpus is ready for implementation. All 19 conditions from the CONDITIONAL GO verdict (report-017) have been confirmed resolved across Epics 05-07 by spot-checking the specific files and sections cited in the condition resolution table below. The newly discovered GAP-039 (scenario innovation noise broadcast format) is classified as a Resolve-During-Phase gap for Phase 5 and does not block Phases 1-4 coding. The cross-reference integrity findings from ticket-030 identify 8 issues (5 High, 3 Low), all of which are navigability improvements rather than correctness blockers. Zero Resolve-Before-Coding gaps remain unresolved, and zero phases are NOT READY.

---

## 2. Condition Resolution Table

Each row confirms that the condition from report-017 section 2 has been resolved by citing the specific ticket, file, and section where the resolution was verified by spot-checking the live spec file content.

| ID   | Description (abbreviated)                                                     | Resolving Ticket(s) | Resolving File / Section                                                                                                                                                                                                                                               | Verification Status |
| ---- | ----------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| C-01 | Add Rust struct definitions for Bus, Line, Thermal, Hydro, etc.               | ticket-018, -019    | `internal-structures.md` -- `pub struct Bus` (ln 368), `Line` (422), `Hydro` (481), `Thermal` (656), `PumpingStation` (731), `NonControllableSource` (831)                                                                                                             | CONFIRMED           |
| C-02 | Define `EntityId` as concrete type                                            | ticket-018          | `internal-structures.md` -- `EntityId` used throughout (e.g., `bus_index: HashMap<EntityId, usize>` ln 81-85)                                                                                                                                                          | CONFIRMED           |
| C-03 | Add Rust struct definitions for Stage, Block, PolicyGraph                     | ticket-019          | `internal-structures.md` -- `pub struct Block` (ln 1182), `Stage` (1308), `PolicyGraph` (1520)                                                                                                                                                                         | CONFIRMED           |
| C-04 | GAP-029: Enumerate cross-reference validation checks in SS2.6                 | ticket-020          | `input-loading-pipeline.md` SS2.6 -- "26 cross-reference validation rules" table (ln 93-124)                                                                                                                                                                           | CONFIRMED           |
| C-05 | Rename `patch_rhs_bounds` to `patch_row_bounds`; add `patch_col_bounds` tests | ticket-022          | `solver-interface-testing.md` SS1.6 (`patch_row_bounds` ln 170-175), SS1.6a (`patch_col_bounds` ln 177-186). Zero `patch_rhs_bounds` occurrences in live specs.                                                                                                        | CONFIRMED           |
| C-06 | Clarify `StageTemplate`/`StageIndexer` crate ownership                        | ticket-023          | `solver-abstraction.md` SS2 -- ownership statement (ln 554)                                                                                                                                                                                                            | CONFIRMED           |
| C-07 | Fix `Mpi` RAII guard lifetime in `FerrompiBackend`                            | ticket-023          | `backend-ferrompi.md` SS7 -- `Mpi` RAII guard documented (ln 516, 610, 1047); Drop ordering constraint explicit                                                                                                                                                        | CONFIRMED           |
| C-08 | Fix stale `split_shared_memory()` to `split_shared()` in 4 files              | ticket-023          | `backend-ferrompi.md` (ln 32, 160, 163, 788, 794), `communication-patterns.md`, `communicator-trait.md`, `work-distribution.md` -- zero `split_shared_memory` occurrences remain (report-030 B1: PASS)                                                                 | CONFIRMED           |
| C-09 | GAP-023: Define `OpeningTree` Rust type                                       | ticket-021          | `scenario-generation.md` SS2.3a -- `pub struct OpeningTree` (ln 210), `openings_per_stage: Box<[usize]>`, `OpeningTreeView<'a>` borrow type                                                                                                                            | CONFIRMED           |
| C-10 | Fix notation: `pi^a` to `pi^{lag}`; `p_h` to `P_h`                            | ticket-024          | `training-loop.md` SS7 -- `\pi^{lag}_{h,\ell}` throughout (ln 804, 813, 822, 829); zero `\pi^a` occurrences. `cut-management.md` -- `P_h` (ln 12, 37)                                                                                                                  | CONFIRMED           |
| C-11 | Fix `rayon` threading reference in training-loop.md SS4.3                     | ticket-024          | `training-loop.md` -- zero `rayon` occurrences (grep returns empty)                                                                                                                                                                                                    | CONFIRMED           |
| C-12 | Fix `i32`/`Vec<i32>` to `usize` for allgatherv counts/displs                  | ticket-024          | `work-distribution.md` SS3.2 -- `recvcounts[r]` and `displs[r]` typed as `Vec<usize>` (ln 108-109)                                                                                                                                                                     | CONFIRMED           |
| C-13 | GAP-020: Define output writer API (9 elements)                                | ticket-027, -029    | `output-infrastructure.md` SS6 -- `write_results` (SS6.1), `SimulationParquetWriter` (SS6.2), `TrainingParquetWriter` (SS6.3), `OutputError` (SS6.4), standalone functions (SS6.5-6.6). `input-loading-pipeline.md` SS6.1 -- postcard replaces rkyv for MPI broadcast. | CONFIRMED           |
| C-14 | Define `SimulationScenarioResult` type and `fn simulate()` signature          | ticket-028          | `simulation-architecture.md` SS3.4 -- `SimulationScenarioResult` (ln 380-403), `SimulationSummary` (448), `SimulationError` (531), `fn simulate()` (574)                                                                                                               | CONFIRMED           |
| C-15 | Replace `cobre train --config` with `cobre run` in SLURM scripts              | ticket-025          | `slurm-deployment.md` -- 5 occurrences of `cobre run /path/to/case` (ln 36, 77, 118, 163, 214); zero `cobre train` occurrences                                                                                                                                         | CONFIRMED           |
| C-16 | Standardize config field name `training.forward_passes`                       | ticket-025          | `configuration-reference.md` -- `training.forward_passes` (ln 75); no variant names (`num_forward_passes`, `forward_scenarios`) remain                                                                                                                                 | CONFIRMED           |
| C-17 | Add `training.enabled` boolean field                                          | ticket-025          | `configuration-reference.md` -- `training.enabled` with `bool` type and `true` default (ln 69)                                                                                                                                                                         | CONFIRMED           |
| C-18 | Add `backend-testing.md` and `ecosystem-guidelines.md` to cross-ref index     | ticket-026          | `cross-reference-index.md` -- `backend-testing.md` (ln 95, 285), `ecosystem-guidelines.md` (ln 96, 156, 179, 204, 223, 242, 256, 273)                                                                                                                                  | CONFIRMED           |
| C-19 | Resolve `ferrompi::slurm` module gap                                          | ticket-026          | `memory-architecture.md` -- `cobre_comm::slurm` (ln 105); `slurm-deployment.md` -- `cobre run`; zero `ferrompi::slurm` occurrences (report-030 B2: PASS)                                                                                                               | CONFIRMED           |

**Result: 19/19 conditions CONFIRMED.**

### GAP-039 Assessment Row

| ID      | Description                                        | Blocks Phase(s) | Blocks READY? | Classification            |
| ------- | -------------------------------------------------- | --------------- | ------------- | ------------------------- |
| GAP-039 | Scenario innovation noise broadcast format missing | Phase 5         | NO            | Resolve-During-Phase (P5) |

See Section 4 for full analysis.

---

## 3. Phase Readiness Summary

This table updates the phase verdicts from report-017 section 4 to reflect all 19 conditions confirmed resolved.

| Phase | Crate(s)                    | Original Verdict (R-017) | Updated Verdict       | Conditions Resolved                | Remaining Gaps (Resolve-During-Phase) |
| ----- | --------------------------- | ------------------------ | --------------------- | ---------------------------------- | ------------------------------------- |
| 1     | cobre-core                  | CONDITIONALLY READY      | READY                 | C-01, C-02, C-03                   | GAP-031 (Low)                         |
| 2     | cobre-io (input)            | CONDITIONALLY READY      | READY                 | C-04 (GAP-029 resolved)            | None                                  |
| 3     | ferrompi + cobre-solver     | CONDITIONALLY READY      | READY                 | C-05, C-06, C-07, C-08, C-18, C-19 | GAP-019 (Medium)                      |
| 4     | cobre-comm                  | READY                    | READY                 | (no conditions)                    | None                                  |
| 5     | cobre-stochastic            | CONDITIONALLY READY      | READY WITH KNOWN GAPS | C-09 (GAP-023 resolved)            | GAP-022 (Medium), GAP-039 (High)      |
| 6     | cobre-sddp (training)       | READY                    | READY                 | C-10, C-11, C-12 (minor fixes)     | 8 gaps (all Medium/Low)               |
| 7     | cobre-sddp (sim) + cobre-io | NOT READY                | READY                 | C-13 (GAP-020 resolved), C-14      | GAP-028 (Medium)                      |
| 8     | cobre-cli                   | CONDITIONALLY READY      | READY                 | C-15, C-16, C-17                   | GAP-027, GAP-035 (Medium, Low)        |

**Aggregate**: 7 READY, 1 READY WITH KNOWN GAPS, 0 CONDITIONALLY READY, 0 NOT READY.

**Phase 5 note**: Phase 5 is upgraded from CONDITIONALLY READY to READY WITH KNOWN GAPS because GAP-039 (High severity, scenario broadcast format) is unresolved but has a bounded resolution path (raw `#[repr(C)]` f64 arrays, ~0.5 day effort) that can be completed at the start of Phase 5 before the code that uses it is written. GAP-022 (Medium, `PrecomputedPar` struct) is a standard Resolve-During-Phase gap. Neither gap blocks starting Phase 5 coding.

---

## 4. GAP-039 Analysis

### What is GAP-039?

GAP-039 concerns the unspecified MPI broadcast format for scenario innovation noise data. At each SDDP iteration, rank 0 generates $M \times T \times N_{\text{hydro}}$ f64 innovation noise values and broadcasts them to all worker ranks before the forward pass begins. The wire format and MPI call pattern for this broadcast are not specified in the current spec corpus.

### Which phase does GAP-039 block?

**Phase 5 (cobre-stochastic)**. The scenario generation pipeline is implemented in Phase 5. Phases 1-4 (cobre-core, cobre-io, ferrompi, cobre-solver, cobre-comm) do not touch scenario broadcast.

### Can Phase 1-4 coding proceed without resolving GAP-039?

**Yes.** GAP-039 affects only the scenario broadcast within `cobre-stochastic` and the forward pass entry point in `cobre-sddp`. None of the Phase 1-4 crates (cobre-core, cobre-io, ferrompi, cobre-solver, cobre-comm) generate, broadcast, or consume scenario innovation noises. The dependency chain is:

$$
\text{Phase 1-4 crates} \xrightarrow{\text{no dependency}} \text{scenario broadcast format}
$$

### Is GAP-039 a Blocker or a Resolve-During-Phase gap?

**Resolve-During-Phase (Phase 5).** The resolution path is well-bounded:

1. **Data structure**: The payload is a flat contiguous array of f64 values with dimensions known at compile time from the `System` struct (number of hydros, AR order) and at runtime from configuration (number of scenarios, number of stages). This is structurally identical to the state vector broadcast (Training Loop SS5.4a, GAP-006 resolved) and the cut wire format (Cut Management Implementation SS4.2a, GAP-007 resolved).

2. **Wire format**: Raw `#[repr(C)]` f64 arrays with `MPI_Bcast` over `u8` bytes, matching the established pattern for all hot-path MPI operations in the Cobre spec corpus. No serialization overhead.

3. **Effort**: ~0.5 day to specify the subsection in `scenario-generation.md` -- one struct definition, one broadcast call pattern, one sizing formula.

4. **Timing**: The spec can be written at the start of Phase 5, before the code that implements it. The broadcast format does not feed back into any Phase 1-4 API.

### Does GAP-039 change the READY verdict?

**No.** The READY verdict requires:

1. Zero unresolved Resolve-Before-Coding gaps: **Satisfied** -- all 3 original Resolve-Before-Coding gaps (GAP-020, GAP-023, GAP-029) are marked Resolved.
2. Zero NOT READY phases: **Satisfied** -- Phase 7 (the only NOT READY phase) is now READY; Phase 5 is READY WITH KNOWN GAPS (GAP-039 is Resolve-During-Phase, not a phase blocker).

GAP-039 does not meet the Blocker severity definition ("Cannot proceed without resolving. Missing information that prevents writing correct code.") because:

- The data to be broadcast (f64 innovation noises) is fully defined in `scenario-generation.md` SS2.3.
- The broadcast primitive (`MPI_Bcast` via the `Communicator` trait) is fully specified in `communicator-trait.md`.
- Only the wire format (a simple sizing formula and struct layout) is missing, and it follows the established pattern from two resolved High-severity gaps (GAP-006, GAP-007).

**Recommendation**: Resolve GAP-039 in the first week of Phase 5 as a pre-coding task, before `cobre-stochastic` scenario broadcast code is written. Estimated effort: 0.5 day.

---

## 5. Ticket-030 Findings Integration

Report-030 identified 8 findings across 3 categories. Each is classified below as blocking or non-blocking for the READY verdict.

### 5.1 Finding Classification Table

| #   | Finding                                                                                                        | Severity | Category                | Blocks READY? | Rationale                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | `simulation-architecture.md` SS6.1 does not link to `output-infrastructure.md` SS6.2 (SimulationParquetWriter) | High     | MISSING CROSS-REFERENCE | NO            | Navigability issue. Both specs exist and are correct; only the hyperlink from the streaming architecture to the concrete writer is missing. An implementer reading either spec independently has all information needed. |
| F2  | `binary-formats.md` does not reference postcard as the MPI broadcast format                                    | High     | MISSING CROSS-REFERENCE | NO            | Navigability issue. The postcard decision is fully documented in `input-loading-pipeline.md` SS6.1. `binary-formats.md` is a secondary index; missing an entry does not invalidate the authoritative spec.               |
| F3  | `simulation-architecture.md` Cross-References lacks SS6 precision for output-infrastructure                    | Low      | MISSING CROSS-REFERENCE | NO            | Minor imprecision in a cross-reference description. Does not affect correctness.                                                                                                                                         |
| F4  | `cross-reference-index.md` section 3 missing 3 outgoing refs for output-infrastructure                         | High     | INDEX INCONSISTENCY     | NO            | The index is a navigation aid. Missing entries degrade discoverability but do not invalidate any spec content.                                                                                                           |
| F5  | `cross-reference-index.md` section 4 incorrect for simulation-architecture                                     | High     | INDEX INCONSISTENCY     | NO            | Same rationale as F4. Erroneous `implementation-ordering.md` entry and missing `output-infrastructure.md` entry are index maintenance issues.                                                                            |
| F6  | `cross-reference-index.md` section 4 incorrect for input-loading-pipeline                                      | High     | INDEX INCONSISTENCY     | NO            | Same rationale as F4/F5.                                                                                                                                                                                                 |
| F7  | `cross-reference-index.md` section 4 missing `structured-output.md` for output-infrastructure                  | Low      | INDEX INCONSISTENCY     | NO            | Pre-existing omission (not introduced by Epics 05-07).                                                                                                                                                                   |
| F8  | `cross-reference-index.md` section 3 missing 8 outgoing refs for simulation-architecture                       | Low      | INDEX INCONSISTENCY     | NO            | Pre-existing incompleteness (not introduced by Epics 05-07).                                                                                                                                                             |

### 5.2 Assessment

**Zero findings block the READY verdict.** All 8 findings fall into two categories -- missing cross-references (navigability) and index inconsistencies (maintenance) -- neither of which prevents writing correct implementation code. The spec content itself is correct and complete; only the navigation layer between specs has gaps.

**Remediation recommendation**: Schedule a single cross-reference maintenance pass as a separate ticket after the READY verdict is issued, before Phase 6 (the phase with the highest cross-spec reading density). This pass should:

1. Add a `SimulationParquetWriter` forward reference from `simulation-architecture.md` SS6.1 to `output-infrastructure.md` SS6.2 (F1)
2. Add a postcard/MPI broadcast entry to `binary-formats.md` section 2 (F2)
3. Batch-update the cross-reference index for all Epic 07 changes (F4, F5, F6)

Findings F3, F7, and F8 are low-priority cosmetic improvements.

### 5.3 Positive Results from Ticket-030

Report-030 also confirmed several important positive results:

- **mdBook build: PASS** -- exit code 0, no new warnings
- **Zero broken links** across all 20 files modified in Epics 05-07
- **Zero stale identifiers** -- `split_shared_memory` (0 hits), `ferrompi::slurm` (0 hits), `patch_rhs_bounds` (0 hits in live specs)
- **rkyv correctly confined** -- single occurrence in `input-loading-pipeline.md` comparison paragraph only

---

## 6. Gap Inventory Verification

### 6.1 Summary Statistics Audit

The section 6 summary in `spec-gap-inventory.md` claims:

| Severity             | Claimed Count |
| -------------------- | ------------- |
| Blocker (resolved)   | 5             |
| High (unresolved)    | 1             |
| High (resolved)      | 15            |
| Medium (unresolved)  | 10            |
| Medium (resolved)    | 3             |
| Low (unresolved)     | 5             |
| **Total**            | **39**        |
| **Total unresolved** | **16**        |

**Actual counts from section 3 detailed table** (computed by scanning `**Resolved**` markers in the Resolution Path column):

| Severity             | Actual Count | Matches Claimed? |
| -------------------- | ------------ | ---------------- |
| Blocker (resolved)   | 5            | YES              |
| High (unresolved)    | 4            | NO (claimed 1)   |
| High (resolved)      | 12           | NO (claimed 15)  |
| Medium (unresolved)  | 10           | YES              |
| Medium (resolved)    | 3            | YES              |
| Low (unresolved)     | 5            | YES              |
| **Total**            | **39**       | YES              |
| **Total unresolved** | **19**       | NO (claimed 16)  |

### 6.2 Root Cause of Discrepancy

Three gaps -- **GAP-036, GAP-037, GAP-038** -- are listed in the Resolution Log (section 7) with resolution dates and ticket references, and are explicitly named in the section 6 summary line ("15 High resolved: GAP-006 through GAP-017, GAP-036, GAP-037, GAP-038"). However, their rows in the section 3 detailed table do **not** carry the `**Resolved**` marker in the Resolution Path column. The Resolution Path column still contains the original unresolved description text.

This is a maintenance inconsistency: the resolution log and summary statistics were updated (correctly reflecting that these gaps were resolved by tickets 023-025), but the section 3 table rows were not updated with `**Resolved**` prefixes.

### 6.3 Correct Statistics

The **intended** statistics (counting GAP-036/037/038 as resolved, consistent with the resolution log) are:

| Severity             | Correct Count |
| -------------------- | ------------- |
| Blocker (resolved)   | 5             |
| High (unresolved)    | 1             |
| High (resolved)      | 15            |
| Medium (unresolved)  | 10            |
| Medium (resolved)    | 3             |
| Low (unresolved)     | 5             |
| **Total**            | **39**        |
| **Total unresolved** | **16**        |

The section 6 summary statistics are correct **in intent** -- they match the resolution log. The discrepancy is that GAP-036/037/038 rows in section 3 lack the `**Resolved**` marker. This is a cosmetic table maintenance issue, not a substantive gap inventory error.

### 6.4 Specific Gap Status Verification

Per the ticket specification, the following gaps were explicitly verified:

- **GAP-020** (output writer API): Marked `**Resolved**` in section 3 -- CORRECT
- **GAP-023** (OpeningTree type): Marked `**Resolved**` in section 3 -- CORRECT
- **GAP-029** (validation checklist): Marked `**Resolved**` in section 3 -- CORRECT
- **GAP-039** (scenario broadcast format): Present as High unresolved -- CORRECT

### 6.5 Recommended Fix

Add `**Resolved**` prefixes to the Resolution Path column for GAP-036, GAP-037, and GAP-038 in section 3. This brings the detailed table into alignment with the resolution log and summary statistics. This is a cosmetic fix that does not change the intended meaning of any section.

---

## 7. Audit Plan Summary

### Plan Metrics

| Metric                        | Value                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| Plan name                     | implementation-readiness-audit                              |
| Total epics                   | 8                                                           |
| Total tickets                 | 31                                                          |
| Tickets completed             | 31 (including this terminal ticket)                         |
| Epics completed               | 8                                                           |
| Reports produced              | 18 (reports 001-017 in Epics 01-04, report-030, report-031) |
| Conditions identified (R-017) | 19                                                          |
| Conditions resolved           | 19 (Epics 05-07)                                            |
| Conditions confirmed          | 19/19 (this report)                                         |
| New gaps discovered           | 1 (GAP-039, Epic 07)                                        |
| Original verdict (R-017)      | CONDITIONAL GO                                              |
| Final verdict (R-031)         | READY                                                       |

### Epic Summary

| Epic | Title                             | Tickets | Purpose                                           | Key Output                          |
| ---- | --------------------------------- | ------- | ------------------------------------------------- | ----------------------------------- |
| 01   | Per-Crate Completeness            | 8       | Audit all 8 crates for API surface completeness   | 503 items, 91 findings              |
| 02   | Gap Impact and Consistency        | 4       | Triage gaps, verify links, check type consistency | 18 gaps classified, 4689 links      |
| 03   | Phase Readiness and Testing       | 5       | Assess 8 phases, audit testing specs              | 19 conditions, 247 tests verified   |
| 04   | Data and HPC Verdict              | 4       | Trace data chains, verify HPC, issue verdict      | CONDITIONAL GO with 19 conditions   |
| 05   | Core Entity and Validation Specs  | 5       | Resolve C-01/02/03/04/09                          | Entity structs, validation rules    |
| 06   | Mechanical Fixes                  | 5       | Resolve C-05/06/07/08/10-12/15-19                 | 12 conditions fixed across 14 files |
| 07   | Serialization Eval and Output API | 3       | Resolve C-13/14; evaluate rkyv vs postcard        | Output writer API, postcard adopted |
| 08   | Final Verification                | 2       | Cross-ref integrity, final verdict                | This report                         |

### Quality Scores

Across all scored tickets (Epics 05-07, where quality scoring was active):

- Epic 05: quality scores 0.93, 0.92, 0.95, 0.95, 0.93 (mean 0.936)
- Epic 06: quality scores 0.954, 0.988, 0.987, ~0.97, ~0.97 (mean ~0.974)
- Epic 07: quality scores 0.925, 0.975, 0.930 (mean 0.943)
- Epic 08: quality score 0.93 (ticket-030)
- Overall mean quality: ~0.950 (EXCELLENT tier, well above 0.75 gate)

### Audit Completeness

The 31-ticket plan covered 8 orthogonal assessment dimensions (report-017 section 7.3):

1. Per-crate API surface completeness (503 items across 8 crates)
2. Gap severity triage (39 gaps classified)
3. Cross-reference link integrity (4,689 links verified)
4. Shared type and notation consistency (7 types, 3 notation families)
5. Phase readiness (8 phases with per-phase blocking condition analysis)
6. Testing spec adequacy (7 specs, 247 named tests)
7. Data model traceability (8 end-to-end format chains)
8. HPC spec correctness (15 HPC files, 4 correctness dimensions)

All dimensions were independently assessed. No report contradicted another report's conclusions. The convergence of evidence from 18 independently-scoped reports provides high confidence that the conditions inventory is complete and the READY verdict is well-founded.

---

## Appendix: Condition Resolution Timeline

| Epic      | Tickets        | Conditions Resolved                                                                    | Working Days                            |
| --------- | -------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| 05        | 018-022        | C-01, C-02, C-03, C-04, C-09 (5 conditions)                                            | Entity structs, validation, OpeningTree |
| 06        | 023-026        | C-05, C-06, C-07, C-08, C-10, C-11, C-12, C-15, C-16, C-17, C-18, C-19 (12 conditions) | Naming, notation, config, index         |
| 07        | 027-029        | C-13, C-14 (2 conditions)                                                              | Serialization eval, output writer API   |
| **Total** | **12 tickets** | **19 conditions**                                                                      |                                         |
