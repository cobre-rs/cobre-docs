# Accumulated Learnings Through Epic 02 (Gap Triage and Cross-Spec Consistency)

## Audit Results Overview

- Epics 01 and 02 complete; Epics 03 and 04 pending
- All 8 crates audited (epic-01): CONDITIONAL PASS across the board -- domain semantics sufficient, Rust API formalization and naming consistency are the gaps
- 18 remaining Medium/Low gaps triaged (epic-02): 3 Resolve-Before-Coding, 12 Resolve-During-Phase, 3 Resolve-After-MVP
- Total crate audit findings: 91 (16 High, 38 Medium, 33 Low)
- Cross-reference integrity: 3 broken links (one file), 2 stale section references, 2 specs missing from index, 100 convention violations (pre-existing)
- Shared type findings: all 7 Rust types consistent; 3 notation findings (1 High, 1 Medium, 1 Low)

## Gap Category Patterns

- **Missing Rust struct definitions** (most common gap): prose and tables exist but no `struct Foo { field: Type }` -- affects entity types in cobre-core, `PrecomputedPar`/opening tree in cobre-stochastic, workspace in cobre-solver, `TrainingConfig`/`StageCutPool` in cobre-sddp
- **Missing function signatures at crate boundaries** (second most common): behavior described but no typed Rust signature -- output writer API in cobre-io (GAP-020, Resolve-Before-Coding for Phase 7), `train`/`forward_pass`/`backward_pass` in cobre-sddp
- **Cross-spec naming inconsistencies** (highest severity-per-fix ratio): `patch_rhs_bounds` -> `patch_row_bounds` in `solver-interface-testing.md` (7 occurrences, High); `split_shared_memory()` -> `split_shared()` in 4 files; `forward_passes` name variants across 4 files
- **Notation drift**: `$\pi^a_{h,\ell}$` vs `$\pi^{lag}_{h,\ell}$` in `training-loop.md` SS7.1 (Medium); `$p_h$` vs `$P_h$` in `cut-management.md` (Low); both confined to individual sections

## Phase-Gated Critical Findings

- **Phase 1 (cobre-core)**: entity struct definitions absent for Bus, Line, Hydro, Thermal, PumpingStation, Stage, Block; `EntityId` type undefined -- all Resolve-During-Phase (local design decisions)
- **Phase 2 (cobre-io)**: GAP-029 (cross-reference validation checklist incomplete) is Resolve-Before-Coding; output writer API (GAP-020) is Resolve-Before-Coding for Phase 7 but does not block Phase 2 itself
- **Phase 3 (cobre-solver + ferrompi)**: `patch_rhs_bounds` must be renamed `patch_row_bounds` in `solver-interface-testing.md` (7 lines); `split_shared_memory()` -> `split_shared()` in 4 spec files; `StageTemplate`/`StageIndexer` crate ownership needs decision
- **Phase 4 (cobre-comm)**: `CommBackend` enum lacks `SharedMemoryProvider` implementation strategy -- Resolve-During-Phase (does not cross crate boundary at type level)
- **Phase 5 (cobre-stochastic)**: GAP-023 (opening tree Rust type, Resolve-Before-Coding); GAP-022 (`PrecomputedPar` struct, Resolve-During-Phase); `StageRng` type alias undefined
- **Phase 6 (cobre-sddp training)**: 8 Resolve-During-Phase gaps (0 Resolve-Before-Coding); notation F1 and F2 should be fixed before implementing cut coefficient extraction
- **Phase 7 (cobre-sddp simulation)**: GAP-020 (output writer API, Resolve-Before-Coding); simulation pipeline at 33% PARTIAL+MISSING; `SimulationScenarioResult` and `simulate()` absent
- **Phase 8 (cobre-cli)**: `training.enabled` missing from config reference; stale SLURM invocation patterns; all Resolve-During-Phase

## Three Pre-Coding Gap Resolution Items

- **GAP-029** (Phase 2): enumerate all entity cross-reference checks in `input-loading-pipeline.md` SS2.6; 2-3 days effort; resolvable immediately (all entity specs exist)
- **GAP-023** (Phase 5): define `OpeningTree` Rust type with `SharedRegion` ownership model; 1-2 days effort; requires SharedMemoryProvider trait reading (not Phase 4 coding)
- **GAP-020** (Phase 7): define `SimulationWriter` API (trait or type, method signatures, thread-safety guarantees, error type); 2-3 days effort; should be resolved during Phase 6 implementation, before Phase 7 begins
- **Total pre-coding effort**: 5-8 working days across 3 targeted spec additions

## Most Implementation-Ready Crates

- **cobre-solver**: 79% COMPLETE (38/48 items), only 1 High-severity finding (testing spec naming -- mechanical fix), all 10 trait methods fully specified with HiGHS backend mapping
- **ferrompi**: 96% COMPLETE (70/73 items), 0 MISSING items, 2 High-severity stale API names (`split_shared()`, `Mpi::init_thread()`) -- both mechanical find-and-replace
- **cobre-comm**: 77% COMPLETE (43/56 items), strong trait behavioral contracts, 1 High-severity structural gap (`CommBackend` + `SharedMemoryProvider`) that is Resolve-During-Phase

## Least Implementation-Ready Crates

- **cobre-io**: output writing API (GAP-020) completely absent; 20 MISSING items; schema layer is fully specified but the Rust calling convention is undefined
- **cobre-core**: 47% COMPLETE (36/76 items), all entity types have prose descriptions but no Rust struct definitions; all gaps are Resolve-During-Phase

## Consistency Verification Outcomes

- **Shared Rust types**: 7/7 PASS -- System, StageTemplate, StageIndexer, CutWireRecord, TrainingEvent, LoadError, SolverError all have consistent definitions across all referencing files
- **Mathematical notation**: 1/3 families PASS -- stage cost function (N2) is consistent; cut coefficients (N1) and dual variables (N3) both have drift in `training-loop.md` SS7.1
- **Cross-reference links**: 4,689 links verified, 3 broken (one missing artifact in production-scale-reference.md, trivial to remove), 0 mdBook build errors
- **Convention violations**: 83 `§` violations in 12 architecture files + 17 in 4 overview files -- all pre-existing, readability defect only, do not block implementation

## Key Architectural Findings

- "Document behavior first, formalize types later" authoring style produced strong domain semantics but thin Rust API layer -- consistent across all 8 crates
- Trait enum dispatch (cobre-sddp Subsystem G) is 97% COMPLETE, reflecting the spec-readiness plan investment in architecture trait specs -- that investment paid off directly
- "One canonical source + cross-references only" convention was effective: zero Rust type field-level discrepancies found despite 30 spec files modified during gap-resolution
- Gap-resolution plan updated 30 spec files but left 2 known stale items unaddressed: `patch_rhs_bounds` in testing spec and a stale section reference in gap inventory
- Two gaps (GAP-021 FlatBuffers schema, GAP-026 trial state distribution) were already resolved in the spec before the triage ran; the gap inventory is at least 2 entries stale

## Recommendations for Epic-03 (Phase Readiness and Testing)

- Use the phase-column in `report-009-gap-triage.md` section 3.2 as the gap input for per-phase readiness assessment -- no re-analysis needed
- Fix F3 (`patch_rhs_bounds` in `solver-interface-testing.md`) before the testing spec adequacy assessment; the 7 stale occurrences will produce misleading coverage analysis
- Flag the simulation pipeline (cobre-sddp Subsystem F, 33% PARTIAL+MISSING) for a dedicated adequacy sub-assessment; it is the only subsystem below the 30% threshold
- Use cobre-solver (79% COMPLETE) as the readiness target bar for Phase 1-4 crates; assess whether each crate can reach 70%+ before its implementation phase begins

## Recommendations for Epic-04 (Data Model, HPC, Verdict)

- Present GAP-020 (output writer API) as the highest-priority pre-coding condition in the readiness verdict: it is the only gap that requires a new API design (not just a struct sketch), affects the highest-integration phase (Phase 7), and has the most downstream dependents
- Include the cross-reference index update (2 missing specs, 9 changes) in the verdict's "conditions before coding" list -- it is low-effort but `backend-testing.md` must be indexed before conformance testing begins
- Include the notation fixes (F1, F2) as pre-Phase-6 conditions: `training-loop.md` SS7.1 `\pi^a` -> `\pi^{lag}` and `cut-management.md` `p_h` -> `P_h`
- Propose a post-verdict convention cleanup ticket for the 100 `§` violations; scope it as a batch sed replacement per file so it can be executed without review risk
