# Accumulated Learnings Through Epic 05 (Final)

## Structural Patterns (All Trait Specs)

- Every trait spec opens with: Purpose paragraph -> verbatim convention blockquote -> SS1 Trait Definition
- Convention blockquote is word-for-word from `communicator-trait.md`; belongs in trait specs only, never in testing specs
- All architecture-to-architecture links use `SS` prefix; `§` is reserved for `src/specs/hpc/` files only
- The convention blockquote contains one valid `§` reference (`[Backend Testing §1](../hpc/backend-testing.md)`); this is the only permitted `§` inside any architecture spec prose
- Dispatch mechanism section must explain rejected alternatives, performance characteristics, and which architectural property drives the choice
- Infallibility claims must cite the specific upstream section that provides the guarantee
- Cross-References section: minimum 10-14 entries, each with file, sections, and one-line description

## Structural Patterns (All Testing Specs)

- Shared fixture declared once at the top of SS1 before any test tables; tests reference it as a delta
- Explicit "Test naming convention:" paragraph before the first table
- Architecture testing convention: `test_{trait}_{variant}_{method}_{scenario}` (all lowercase, snake_case)
- For solver tests, `{variant}` is the backend name (`highs`, `clp`); cross-solver equivalence tests use `test_solver_cross_...`
- Error path tests occupy a dedicated section (SS3), separate from success-path conformance tests
- Cross-solver equivalence tests: dedicated section with explicit tolerances (objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start 2x iteration ratio)
- Finite-difference sensitivity check is the strongest dual verification; use whenever a dual or gradient is a first-class postcondition

## Structural Patterns (Overview / Planning Specs)

- Overview-section specs use plain numbered sections (`## 1.`, `## 2.`); never `SS` or `§` regardless of section count
- Cross-cutting documents (no single owning crate) use `(cross-cutting)` as Primary Crate in the cross-reference index mapping table
- Implementation ordering documents express each phase as a sub-section with a two-column attribute table (Crates, What becomes testable, Blocked by, Spec reading list)
- An ASCII preformatted DAG complements per-phase Blocked-by entries for at-a-glance comprehension
- Gap inventories use a seven-column table (ID, Severity, Affected Crate(s), Spec File(s), Sections, Description, Resolution Path)
- Gap summary statistics must be computed from the detailed table and verified to match before the guardian pass

## Dispatch Architecture

- **Single active variant, global scope**: flat enum, match at call sites (CutSelectionStrategy, HorizonMode, SamplingScheme)
- **Single active variant, per-stage scope**: flat enum, match at call sites (RiskMeasure)
- **Multiple active variants evaluated simultaneously**: `Vec<EnumVariant>` + composition struct with mode field (StoppingRuleSet)
- **Single active variant, fixed at build time, wrapping FFI**: Rust `trait` with compile-time monomorphization (SolverInterface)
- `Box<dyn Trait>` is rejected in all current trait specs; closed variant sets always prefer enum dispatch
- The dispatch comparison table in `src/specs/architecture/solver-interface-trait.md` SS5 is the canonical reference for choosing between enum and monomorphization

## Invariants and Contracts

- Methods that are pure queries: never return `Result`; cite upstream validation that guarantees valid inputs
- Methods that wrap FFI calls: return `Result`; provide split Ok/Err postcondition tables
- When a method returns `Err`, the caller is responsible for calling `reset()` before reusing the instance
- Retry logic and sign-convention normalization are encapsulated inside implementations; the trait method returns only the final result
- Dual normalization is a trait-level guarantee connected to the mathematical failure mode (divergent cuts) in `src/specs/architecture/solver-interface-trait.md` SS7
- `SolverError` pattern: one variant per error category, optional structured diagnostic fields, hard-stop vs. proceed-with-partial mapping table

## § Convention: Two Violation Categories (Fully Remediated)

- **New spec files**: violations arise from over-applying the `§`-avoidance rule to the one legitimate HPC link inside the convention blockquote; caught in `sampling-scheme-trait.md` in epic-04 (`SS1` instead of `§1`)
- **Pre-existing architecture files**: authored before the convention existed; used `§` as self-referential section anchors; fixed in bulk in epic-04 (~262 occurrences across 13 files)
- Post-epic-04 grep of `§` in `src/specs/architecture/` returns only blockquote occurrences in the 7 trait specs; all other violations resolved
- Verification method for future authors: textual diff against canonical blockquote from `communicator-trait.md`, allowing only the path difference

## Cross-Reference Index Methodology

- Batch updates (all specs at once per epic) prevent partial-update commits and ensure consistency across all 5 sections
- For each batch: (1) extract outgoing refs for section 3; (2) identify existing specs gaining incoming refs for section 4; (3) compute topological positions for section 5; (4) assign primary crates for sections 1 and 2; (5) update document count header
- Cross-cutting documents (epic-05 pattern) go into ALL 11 per-crate reading lists in section 2 as `(secondary)`, including deferred crates
- Pre-existing gap: some pre-epic-04 specs are still missing entries in sections 3-5 of `src/specs/cross-reference-index.md`; this is known technical debt, not introduced by any plan in this series

## GIL Contract and Free-Threaded Python

- 6-point GIL contract is the current authoritative count; stale counts in `src/crates/*.md` should be caught via grep during any spec update that changes a numbered contract
- MPI prohibition: 3 independent reasons; reason (2) is GIL-dependent, reasons (1) and (3) persist under free-threaded Python
- Free-threaded Python detail belongs in `src/specs/interfaces/python-bindings.md` SS7.5a only; other files use the established shorthand

## Guardian Rejection History (All 5 Epics)

- **Epic-01**: no rejections; SS prefix warnings in ticket pitfalls prevented violations
- **Epic-02**: no rejections; one fixture inconsistency resolved inline
- **Epic-03**: one rejection -- 11 architecture-internal `§` in Rust doc-comment strings in `src/specs/architecture/solver-interface-trait.md`; root cause: pattern-matched on blockquote's valid `§` link
- **Epic-04**: no formal rejections; one inline defect in `sampling-scheme-trait.md` blockquote (`SS1` instead of `§1`)
- **Epic-05**: one resubmission (ticket-020 summary statistics counting error); one conditional pass (ticket-021 pre-existing cross-reference index structural gap)

## Implementation Readiness (Epic 05 Findings)

- Corpus stands at 74 specs; 38 gaps identified for the minimal viable solver scope (5 Blocker, 15 High, 13 Medium, 5 Low)
- All 5 Blockers must be resolved before Phase 1 coding can start: `SystemRepresentation` struct, decommissioned LP treatment, broadcast serialization format, `StageTemplate` construction, and forward pass patch sequence
- Dominant gap crate: `cobre-sddp` is involved in ~20 of 38 gaps; training loop and simulation architecture specs describe behavior in prose but leave inter-crate handoff types unspecified
- Minimal viable build sequence: 8 phases, bottom-up from `cobre-core` to `cobre-cli`; parallel tracks for Phases 3 (`ferrompi` + `cobre-solver`) and 5 (`cobre-stochastic`) after Phase 1
- Performance risks to address before implementation: Dominated strategy 7.7G FLOP cost (gate with Cargo feature flag); `Result`-returning hot-path methods (`solve`, `solve_with_basis`) require error-path benchmarks
- Key planning documents: `src/specs/overview/implementation-ordering.md` (phase reading lists), `src/specs/overview/spec-gap-inventory.md` (blocker and high-severity gaps)
