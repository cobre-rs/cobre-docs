# Accumulated Learnings Through Epic 04

## Structural Patterns (All Trait Specs)

- Every trait spec opens with: Purpose paragraph -> verbatim convention blockquote -> SS1 Trait Definition
- Convention blockquote is word-for-word from `communicator-trait.md`; belongs in trait specs only, never in testing specs
- All architecture-to-architecture links use `SS` prefix; `§` is reserved for `src/specs/hpc/` files only
- The convention blockquote contains one valid `§` reference (`[Backend Testing §1](../hpc/backend-testing.md)`); this is the only permitted `§` inside any architecture spec prose
- The blockquote path difference is permitted: `./backend-testing.md` in HPC files, `../hpc/backend-testing.md` in architecture files
- Dispatch mechanism section must explain rejected alternatives, performance characteristics, and which architectural property drives the choice
- Infallibility claims must cite the specific upstream section that provides the guarantee
- Cross-References section: minimum 10-14 entries, each with file, sections, and one-line description
- Cross-reference index batch updates (ticket-013 pattern): extract outgoing refs for SS3, identify existing specs gaining incoming refs for SS4, compute topological positions for SS5, assign primary crates for SS1/SS2; update document count header at the same time

## Structural Patterns (All Testing Specs)

- Shared fixture declared once at the top of SS1 before any test tables; tests reference it as a delta
- Explicit "Test naming convention:" paragraph before the first table
- Architecture testing convention: `test_{trait}_{variant}_{method}_{scenario}` (all lowercase, snake_case)
- For solver tests, `{variant}` is the backend name (`highs`, `clp`); cross-solver equivalence tests use `test_solver_cross_...`
- Error path tests occupy a dedicated section (SS3), separate from success-path conformance tests
- LP lifecycle test in a standalone section when methods must be called in sequence
- Test counts are floors; minimum test counts exceeded naturally by algorithm-heavy and multi-backend traits
- Cross-solver equivalence tests: dedicated section with explicit tolerances (objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start 2x iteration ratio)
- Finite-difference sensitivity check is the strongest dual verification; use whenever a dual or gradient is a first-class postcondition

## Dispatch Architecture

- **Single active variant, global scope**: flat enum, match at call sites (CutSelectionStrategy, HorizonMode, SamplingScheme)
- **Single active variant, per-stage scope**: flat enum, match at call sites (RiskMeasure)
- **Multiple active variants evaluated simultaneously**: `Vec<EnumVariant>` + composition struct with mode field (StoppingRuleSet)
- **Single active variant, fixed at build time, wrapping FFI**: Rust `trait` with compile-time monomorphization (SolverInterface)
- `Box<dyn Trait>` is rejected in all current trait specs; closed variant sets always prefer enum dispatch
- The dispatch comparison table in `solver-interface-trait.md` SS5 is the canonical reference for future authors choosing between enum and monomorphization

## Invariants and Contracts

- Methods that are pure queries: never return `Result`; cite upstream validation that guarantees valid inputs
- Methods that wrap FFI calls: return `Result`; provide split Ok/Err postcondition tables
- When a method returns `Err`, the caller is responsible for calling `reset()` before reusing the instance
- Retry logic and sign-convention normalization are encapsulated inside implementations; the trait method returns only the final result
- Dual normalization is a trait-level guarantee connected to the mathematical failure mode (divergent cuts) in `solver-interface-trait.md` SS7
- `SolverError` pattern: one variant per error category, optional structured diagnostic fields, hard-stop vs. proceed-with-partial mapping table

## § Convention: Two Violation Categories

- **New spec files**: violations arise from over-applying the `§`-avoidance rule to the one legitimate HPC link inside the convention blockquote; caught in `sampling-scheme-trait.md` in epic-04 (`SS1` instead of `§1`)
- **Pre-existing architecture files**: authored before the convention existed; use `§` as self-referential section anchors; fixed in bulk in epic-04 (~262 occurrences across 13 files including `training-loop.md`, `input-loading-pipeline.md`, `simulation-architecture.md`)
- Epic-04 fully remediated all pre-existing § violations; post-epic-04 grep of `§` in `src/specs/architecture/` returns only blockquote occurrences in the 7 trait specs
- Verification method for future audits: textual diff against canonical blockquote from `communicator-trait.md`, allowing only the path difference

## GIL Contract and Free-Threaded Python

- 6-point GIL contract is the current authoritative count; `src/crates/python.md` updated from "Five-point" to "Six-point" in epic-04 (stale count from prior plan scope gap)
- MPI prohibition: 3 independent reasons — (1) `MPI_Init_thread` timing conflict, (2) GIL/`MPI_THREAD_MULTIPLE` deadlock, (3) dual-FFI-layer fragility; reason (2) is GIL-dependent, reasons (1) and (3) persist under free-threaded Python
- Shorthand "GIL/MPI incompatibility" is acceptable; "because the GIL prevents MPI" is not
- Free-threaded Python detail belongs in `python-bindings.md` SS7.5a only; other files use the established shorthand
- `src/crates/*.md` files lag behind `src/specs/` changes; when a numbered contract is extended, grep `src/crates/` for the previous count string as part of the update checklist

## Unique Design Patterns and Guardian History

- **Two-layer abstraction** (epic-02): flat enum + composition struct; **Always-injected variant** (epic-02): GracefulShutdown
- **Retry encapsulation section** (epic-03): dedicated SS for behavioral complexity hidden from caller
- **Dual normalization contract section** (epic-03): dedicated SS connecting guarantee to mathematical failure mode
- **Decision log in ticket** (epic-04): records scope boundary decisions inline in the ticket file; prevents re-evaluation
- **Epic-01**: no guardian rejections; SS prefix warnings in ticket pitfalls prevented violations
- **Epic-02**: no rejections; one fixture inconsistency resolved inline
- **Epic-03**: one rejection — 11 architecture-internal `§` in Rust doc-comments in `solver-interface-trait.md`; root cause: pattern-matched on blockquote's valid `§`
- **Epic-04**: no formal rejections; one inline defect — `sampling-scheme-trait.md` blockquote used `SS1` instead of `§1` for HPC link; mirror image of epic-03

## Epic 05 Guidance

- Dominated strategy 7.7G FLOP cost (in `cut-selection-trait.md` SS6.4): flag as performance risk requiring feature flag
- `Result`-returning hot-path methods (`solve`, `solve_with_basis`): require separate error-path benchmark
- Dual normalization: verify by sensitivity check in `solver-interface-testing.md` SS5 during initial implementation
- Convention blockquote verification: textual diff against canonical, not visual inspection
- Crate overview check: for each spec finalized, verify corresponding `src/crates/*.md` still accurately reflects section count and content
