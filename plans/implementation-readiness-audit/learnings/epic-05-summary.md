# Accumulated Learnings Through Epic 05 (Core Entity Struct Definitions and Validation Specs)

## Status Overview

- All 5 epics complete (Epics 01-04: audit; Epic 05: first condition-resolution epic)
- Epic 01: all 8 crates audited, CONDITIONAL PASS -- 91 findings (16 High, 38 Medium, 33 Low)
- Epic 02: 18 Medium/Low gaps triaged -- 3 Resolve-Before-Coding, 12 Resolve-During-Phase, 3 Resolve-After-MVP
- Epic 03: 8 phases assessed -- 2 READY, 5 CONDITIONALLY READY, 1 NOT READY (Phase 7)
- Epic 04: final verdict CONDITIONAL GO -- 18 conditions, 9-15 working days; data/HPC correctness confirmed
- Epic 05: 5 conditions resolved (C-01 through C-04, C-09); +1,592 lines across 4 spec files; all 4 tickets EXCELLENT quality (0.958, 0.961, 0.99, 0.98)

## Gap Category Patterns (Updated)

- **Missing Rust struct definitions** (most common gap, now partially resolved): 7 entity structs and EntityId added to `src/specs/data-model/internal-structures.md` sections 1.8-1.9; Stage/Block/PolicyGraph added to section 12; OpeningTree added to `src/specs/architecture/scenario-generation.md` SS2.3a; cobre-core and cobre-stochastic entity gaps are now closed
- **Missing function signatures at crate boundaries** (second most common, unresolved): GAP-020 (output writer API, 9 elements) remains the dominant gap; `SimulationScenarioResult` and `simulate()` still absent; resolve during Phase 6 before Phase 7 begins
- **Cross-spec naming inconsistencies** (highest severity-per-fix ratio, unresolved in this epic): `patch_rhs_bounds` -> `patch_row_bounds` (8 occurrences), `split_shared_memory()` -> `split_shared()` (4 files); target Epic 06 (mechanical fixes)
- **Validation spec incompleteness** (now resolved for entity cross-references): 26-rule checklist in `input-loading-pipeline.md` SS2.6 replaces the prior illustrative 7-item list; GAP-029 closed
- **Memory layout errors** (corrected in this epic): `scenario-generation.md` stated "opening-major" ordering; corrected to stage-major, which is the access-optimal layout for the backward pass

## Phase-by-Phase Condition Status

- **Phase 1** (cobre-core, conditions C-01/C-02/C-03): RESOLVED -- EntityId newtype, 7 entity structs, Stage/Block/PolicyGraph all in `internal-structures.md` sections 1.8-1.9 and 12; Phase 1 can begin
- **Phase 2** (cobre-io, condition C-04): RESOLVED -- 26-rule cross-reference validation checklist in `input-loading-pipeline.md` SS2.6; Phase 2 can begin
- **Phase 3** (ferrompi + cobre-solver, conditions C-05/C-06/C-07/C-08/C-18): unresolved; target Epic 06 mechanical fixes
- **Phase 4** (cobre-comm): READY with 0 conditions; no change
- **Phase 5** (cobre-stochastic, condition C-09): RESOLVED -- OpeningTree struct + OpeningTreeView borrow type + SharedRegion ownership model in `scenario-generation.md` SS2.3a; Phase 5 can begin after Phases 1-4 complete
- **Phase 6** (cobre-sddp training): READY with 0 conditions; notation fixes (F1, F2) remain pre-Phase-6 15-minute edits
- **Phase 7** (cobre-sddp sim + cobre-io): NOT READY; conditions C-13/C-14 (GAP-020, SimulationScenarioResult, simulate() signature) unresolved; resolve during Phase 6
- **Phase 8** (cobre-cli): CONDITIONALLY READY; conditions C-15/C-16/C-17 unresolved; target Epic 06

## Pre-Coding Resolution Batch Status

- **Batch 1** (resolve before Phase 5 coding): C-01/C-02/C-03/C-04/C-09 DONE; C-05/C-06/C-07/C-08/C-10/C-11/C-12/C-15/C-16/C-17/C-18 remain (target Epic 06)
- **Batch 2** (resolve during Phase 6 coding): C-13/C-14 (GAP-020 + simulation types) unresolved; on track per schedule

## New Patterns from Epic 05

- **EntityId newtype over primitive**: wrap `i32` (not `String`); derive `Copy`/`Hash`/`Eq`; omit `Ord`; prevents ID/index confusion at zero runtime cost; see `internal-structures.md` SS1.8
- **Base vs Resolved field annotation**: every entity struct uses `// -- Base fields (loaded from JSON) --` and `// -- Resolved fields (defaults applied during loading) --` inline comment blocks; makes loading-pass responsibilities explicit; see `internal-structures.md` sections 1.9.2-1.9.8
- **Supporting enum extraction before structs**: each entity or temporal group opens with a supporting enums subsection; prevents forward-reference confusion; matches Rust compiler dependency order; see `internal-structures.md` sections 1.9.1 and 12.1
- **Dual-type owned/borrowed split for HPC shared data**: `OpeningTree` (owned, `Box<[f64]>`) for the generating crate; `OpeningTreeView<'a>` (borrowed, `&'a [f64]`) for the consuming crate; training loop sees only a borrowed slice with stride-based accessors; see `scenario-generation.md` SS2.3a
- **`Box<[f64]>` over `Vec<f64>` for fixed-size HPC backing arrays**: communicates "allocated once, never resized" invariant at the type level; no capacity field, no accidental reallocation path; apply to all pre-allocated HPC arrays (cut pools, workspace buffers, inflow coefficient arrays)
- **Layered validation execution order**: referential integrity rules (26 of 26 cover foreign-key checks) execute before structural rules (cascade acyclicity, self-loop checks, coverage checks); structural checks depend on confirmed-valid references; order documented in execution-order paragraph after the table

## Architectural Decisions Settled by Epic 05

- **PolicyGraph/HorizonMode separation**: `PolicyGraph` in cobre-core holds raw topology loaded from JSON; `HorizonMode` in cobre-sddp is built FROM `PolicyGraph` during extension point dispatch; avoids circular dependency between cobre-core and cobre-sddp; see `internal-structures.md` SS12.10
- **OpeningTree ownership**: `SharedRegion<f64>` primary path (true shared memory on multi-rank nodes); `HeapFallback` (equivalent to `Arc<OpeningTree>`) for `LocalComm`/`TcpComm` single-process backends; `HeapFallback` makes `SharedRegion` code correct on all backends without conditional logic; see `scenario-generation.md` SS2.3a
- **Stage-major memory layout for OpeningTree**: stage-major (`data[stage * n_openings * dim + opening_idx * dim]`) is correct for backward pass; opening-major (the prior incorrect spec text) would require non-contiguous access at each backward stage; correction made in place in `scenario-generation.md` SS2.3

## Files and Key Additions

- `src/specs/data-model/internal-structures.md`: +639 lines in sections 1.8-1.9 (EntityId, 7 entity structs, 5 supporting enums, 4 auxiliary structs); +458 lines in section 12 (Block, Stage, PolicyGraph, 7 supporting types); canonical `cobre-core` entity type definitions
- `src/specs/architecture/scenario-generation.md`: +205 lines in new section SS2.3a (OpeningTree, OpeningTreeView, ownership model analysis, corrected memory layout); also corrects opening-major -> stage-major in SS2.3
- `src/specs/architecture/input-loading-pipeline.md`: +29 lines net in SS2.6 (26-rule validation table replaces 7-item illustrative list)
- `src/specs/overview/spec-gap-inventory.md`: GAP-023 and GAP-029 marked Resolved with detailed resolution descriptions; summary statistics updated

## Quality Scoring Results

- ticket-018 (EntityId + entity structs): readiness 0.94, quality 0.958 (EXCELLENT)
- ticket-019 (Stage/Block/PolicyGraph): readiness 0.80, quality 0.961 (EXCELLENT)
- ticket-020 (26-rule validation checklist): readiness 0.979, quality 0.99 (EXCELLENT)
- ticket-021 (OpeningTree + ownership model): readiness 0.94, quality 0.98 (EXCELLENT)
- Epic-05 mean quality: 0.972 -- highest mean quality score of any epic in this plan

## Top Priority Remaining Work

- **Next epic (Epic 06, mechanical fixes)**: resolve C-05/C-06/C-07/C-08/C-10/C-11/C-12/C-15/C-16/C-17/C-18 (naming consistency, cross-reference index, notation drift, CLI subcommand rename); all mechanical; no design decisions
- **GAP-020** (during Phase 6): define SimulationWriter trait/type (9 elements); start with metadata/manifest chain (simplest serialization pattern); use load_case as the design template; define SimulationScenarioResult before designing writer method signatures
- **Phase 1 can begin** now that C-01/C-02/C-03 are resolved; use `internal-structures.md` sections 1.8-1.9 as the entity implementation reference; verify that field names match the JSON schema field paths documented in the Source column of each field descriptions table
- **Validation implementation reference**: the 26-rule table in `input-loading-pipeline.md` SS2.6 is the complete specification for the Phase 2 cross-reference validation pass; rules 1-15 and 23-26 implement first, then rules 16-22 after foreign keys are confirmed valid
