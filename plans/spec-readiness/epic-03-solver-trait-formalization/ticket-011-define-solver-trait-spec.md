# ticket-011 Define SolverInterface Trait Spec

## Context

### Background

The SolverInterface is the final abstraction point requiring a formal trait specification. Unlike the five abstraction-point traits formalized in epics 01-02 (RiskMeasure, HorizonMode, SamplingScheme, CutSelectionStrategy, StoppingRule), the SolverInterface wraps external C libraries (HiGHS and CLP) via FFI. This has two critical consequences: (1) solver operations CAN fail (infallibility does not apply -- LP solves may return errors from numerical difficulties, infeasibility, etc.), so methods return `Result` rather than bare values; (2) the dispatch mechanism is compile-time monomorphization via generics (one solver type per binary), not enum dispatch, because the solver backend is a build-time choice, not a per-stage or per-run configuration. The operations table in `solver-abstraction.md` SS4.1 already defines the 8 required operations implicitly; this ticket formalizes them as a trait with method signatures, preconditions/postconditions tables, and error type definitions.

### Relation to Epic

First ticket in Epic 03. The conformance test spec (ticket-012) depends on this trait spec. The cross-reference and SUMMARY updates (ticket-013) and crate spec updates (ticket-014) depend on this file existing.

### Current State

- `src/specs/architecture/solver-abstraction.md` SS4 defines the 8 required operations in a table, SS4.2 defines contract guarantees, SS4.3 defines the dual-solver validation table mapping operations to HiGHS/CLP APIs
- `src/specs/architecture/solver-abstraction.md` SS6 defines error categories, SS7 defines the retry logic contract, SS8 defines dual normalization, SS9 defines basis storage, SS10 defines compile-time solver selection
- `src/specs/architecture/extension-points.md` SS6 lists SolverInterface in the dispatch mechanism analysis (compile-time monomorphization)
- Five trait specs exist following the established pattern: `risk-measure-trait.md`, `horizon-mode-trait.md`, `sampling-scheme-trait.md`, `cut-selection-trait.md`, `stopping-rule-trait.md` -- all in `src/specs/architecture/`
- No formal `SolverInterface` trait definition document exists

## Specification

### Requirements

Create a new file `src/specs/architecture/solver-interface-trait.md` with the following structure:

1. **Title**: `# Solver Interface Trait`
2. **Purpose paragraph**: Define the `SolverInterface` trait -- the backend abstraction through which the SDDP training loop performs LP operations. Reference that this is the compile-time-selected solver backend, following the same monomorphization pattern as the Communicator trait. Reference `solver-abstraction.md` SS4 as the source of the operations contract.
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md` (the exact same blockquote used in all trait specs). This must be word-for-word identical to the blockquote in `risk-measure-trait.md`, `horizon-mode-trait.md`, etc.
4. **SS1. Trait Definition**: A Rust trait (not an enum -- this is the one trait that uses compile-time monomorphization, not enum dispatch) with the 8 methods from `solver-abstraction.md` SS4.1:
   - `load_model(template: &StageTemplate)` -- Bulk-load pre-assembled structural LP in CSC form
   - `add_cut_rows(cuts: &CutBatch)` -- Batch-add active Benders cuts in CSR format
   - `patch_rhs_bounds(patches: &[(usize, f64)])` -- Update scenario-dependent RHS and bounds
   - `solve() -> Result<LpSolution, SolverError>` -- Solve the loaded LP with internal retry logic
   - `solve_with_basis(basis: &Basis) -> Result<LpSolution, SolverError>` -- Set basis for warm-start, then solve
   - `reset()` -- Clear all internal solver state
   - `get_basis() -> Basis` -- Extract current simplex basis
   - `statistics() -> SolverStatistics` -- Return accumulated solve metrics
   - Also include `name() -> &'static str` for solver identification (SS4.2)
   - The trait must require `Send` (thread-local ownership, transferred between threads during workspace reuse) but NOT `Sync` (each solver instance is exclusively owned by one thread -- SS4.2)
5. **SS2. Method Contracts**: One subsection per method with Preconditions/Postconditions tables. Critical distinctions from epics 01-02 traits:
   - `solve()` and `solve_with_basis()` return `Result` -- these are the ONLY fallible methods. The error type is `SolverError` (defined in SS3).
   - `load_model()`, `add_cut_rows()`, `patch_rhs_bounds()` are infallible precondition-guarded: the caller (training loop) ensures valid inputs by construction (the stage template is pre-assembled, cuts come from the validated cut pool, patches come from the validated scenario). If preconditions are violated, these methods may panic.
   - `reset()`, `get_basis()`, `statistics()`, `name()` are always infallible.
   - Document the thread-safety model: each solver instance is exclusively owned by one thread (no concurrent access). The `Send` bound allows transfer between threads during workspace initialization.
   - Reference `solver-abstraction.md` SS2 for LP layout convention that `load_model` expects, SS5.4 for CSR assembly of cuts, SS8 for dual normalization in `solve`/`solve_with_basis`.
6. **SS3. Error Type**: Define `SolverError` as an enum with variants matching `solver-abstraction.md` SS6: `Infeasible`, `Unbounded`, `NumericalDifficulty`, `TimeLimitExceeded`, `IterationLimit`, `InternalError`. Include fields for optional infeasibility ray, partial solution (for `NumericalDifficulty`, `TimeLimitExceeded`, `IterationLimit`), and recovery hints.
7. **SS4. Supporting Types**: Define `LpSolution` (primal values, dual values, objective, basis), `Basis` (column statuses + row statuses, compact representation per SS9), `SolverStatistics` (total solves, iterations, retries, failures, timing), `StageTemplate` (reference to CSC data per SS11.1), `CutBatch` (CSR arrays per SS5.4).
8. **SS5. Dispatch Mechanism**: Compile-time monomorphization. The training loop is generic: `fn train<S: SolverInterface, C: Communicator>(...)`. Only one solver type is active per binary. Reference `solver-abstraction.md` SS10 for Cargo feature flag mechanism. Contrast with the enum dispatch used by the 5 algorithm-variant traits from epics 01-02 (those are enum-dispatched because they have a small, fixed variant set that may vary per stage or per run; the solver is fixed at build time).
9. **SS6. Retry Logic Encapsulation**: Document that the retry logic from `solver-abstraction.md` SS7 is encapsulated WITHIN each solver implementation. The `SolverInterface` trait's `solve()` method returns only the final result after all retries are exhausted. The SDDP algorithm never sees retry attempts. Reference `solver-highs-impl.md` and `solver-clp-impl.md` for solver-specific retry strategies.
10. **SS7. Dual Normalization Contract**: Document that the `LpSolution` returned by `solve()` and `solve_with_basis()` contains duals already normalized to the canonical sign convention from `solver-abstraction.md` SS8. The training loop does not apply any post-processing to duals.
11. **Cross-References** section: At least 10 entries. Must include: `solver-abstraction.md` (SS4, SS6, SS7, SS8, SS9, SS10, SS11), `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`, `training-loop.md`, `cut-management-impl.md`, `binary-formats.md`, `communicator-trait.md` (reference pattern), `extension-points.md` (SS7 dispatch analysis), `hybrid-parallelism.md` (threading model).

### Content Guidelines

- This is a REFERENCE priority trait: the contract already exists in detail in `solver-abstraction.md`. The trait spec formalizes the implicit contracts into explicit Rust trait syntax.
- Methods that interact with the solver C API may fail; do not claim infallibility for `solve()` or `solve_with_basis()`.
- The `load_model`, `add_cut_rows`, and `patch_rhs_bounds` methods are infallible only because their callers guarantee valid inputs. Document this as a precondition guarantee, not as inherent method safety.
- Do NOT duplicate the LP layout details from `solver-abstraction.md` SS2; reference them.
- Do NOT duplicate the retry strategy details from `solver-highs-impl.md` or `solver-clp-impl.md`; reference them.
- Do NOT include CSR/CSC assembly algorithms; reference `solver-abstraction.md` SS5.4 and `binary-formats.md` SS3.4.
- All architecture-to-architecture links use the `SS` prefix, never `§` (which is reserved for `src/specs/hpc/` files).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/solver-interface-trait.md` exists, when reading it, then it opens with a Purpose paragraph, the verbatim convention blockquote, and SS1 Trait Definition
- [ ] Given SS1, when reading the trait, then it is a Rust trait (not an enum), with 9 methods matching the 8 operations from `solver-abstraction.md` SS4.1 plus `name()`
- [ ] Given SS2, when reading `solve()` and `solve_with_basis()`, then they return `Result<LpSolution, SolverError>` with Preconditions/Postconditions tables
- [ ] Given SS2, when reading `load_model()`, `add_cut_rows()`, `patch_rhs_bounds()`, then they do not return `Result` but document precondition guarantees
- [ ] Given SS3, when reading `SolverError`, then it has 6 variants matching `solver-abstraction.md` SS6
- [ ] Given SS5, when reading the dispatch mechanism, then it explains compile-time monomorphization and contrasts it with enum dispatch used in epics 01-02 traits
- [ ] Given SS6, when reading retry logic encapsulation, then it references `solver-abstraction.md` SS7 and both solver implementation specs
- [ ] Given SS7, when reading dual normalization, then it references `solver-abstraction.md` SS8 and states that `LpSolution` duals are pre-normalized
- [ ] Given the Cross-References section, when checking links, then there are at least 10 entries and all links resolve to existing files

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/solver-abstraction.md` thoroughly -- SS4 (operations), SS6 (errors), SS7 (retry), SS8 (dual normalization), SS9 (basis), SS10 (compile-time selection), SS11 (stage templates)
2. Read `src/specs/architecture/risk-measure-trait.md` for the structural pattern: Purpose, convention blockquote, SS1 definition, SS2 contracts, cross-references
3. Read `src/specs/hpc/communicator-trait.md` for the convention blockquote text and the monomorphization pattern (the communicator also uses compile-time generics, so the dispatch mechanism section can follow the same reasoning)
4. Write the trait spec, adapting the structure for a Rust trait (not an enum), fallible methods (Result returns), and the unique aspects of FFI-wrapped solver operations
5. Verify all cross-reference links resolve by checking file paths

### Key Files to Modify

- **Create**: `src/specs/architecture/solver-interface-trait.md`

### Patterns to Follow

- Same structural pattern as `risk-measure-trait.md`, `horizon-mode-trait.md`, etc.: Purpose, convention blockquote, SS1 definition, SS2 contracts, supporting types, dispatch mechanism, cross-references
- Method contract format with Preconditions/Postconditions tables (same as `communicator-trait.md` SS2)
- Convention blockquote copied verbatim from `communicator-trait.md`
- Cross-References section format: `[File](./link.md) -- description (section list)` with at least 10 entries

### Pitfalls to Avoid

- Do NOT define this as an enum. The SolverInterface is the ONE trait that uses compile-time monomorphization via a Rust trait, not enum dispatch.
- Do NOT claim that `solve()` or `solve_with_basis()` are infallible. They wrap external C library calls that can and do fail.
- Do NOT duplicate the LP layout convention from `solver-abstraction.md` SS2. Reference it.
- Do NOT describe solver-specific retry strategies. Reference `solver-highs-impl.md` and `solver-clp-impl.md`.
- Do NOT use `§` prefix for section references in this architecture spec. Use `SS` prefix for all intra-architecture cross-references.
- Do NOT paraphrase the convention blockquote. It must be word-for-word identical to the version in `communicator-trait.md`.

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: None (follows patterns established in epics 01-02)
- **Blocks**: ticket-012 (conformance test spec), ticket-013 (cross-reference updates)

## Effort Estimate

**Points**: 3
**Confidence**: High
