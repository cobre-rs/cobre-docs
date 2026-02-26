# Epic 03 Learnings: Solver Trait Formalization

## Patterns Followed from Epics 01-02

### Convention blockquote is verbatim in solver-interface-trait.md

`solver-interface-trait.md` includes the "Rust traits as specification guidelines" blockquote word-for-word from `communicator-trait.md`, matching the blockquote in all five prior trait specs. Placement is correct: immediately after the Purpose paragraph and before SS1. The testing spec (`solver-interface-testing.md`) does not include the blockquote, confirming the convention that blockquotes belong only in trait specs.

File: `src/specs/architecture/solver-interface-trait.md`, line 7.

### Shared test fixture with hand-computed LP data at the top of SS1

`solver-interface-testing.md` opens SS1 with three named sub-fixtures (SS1.1 shared LP, SS1.2 Benders cut fixture, SS1.3 patched RHS fixture) before any test tables appear. The shared LP is a 3-variable, 2-constraint problem with explicit CSC matrix arrays, column/row bounds, objective coefficients, and a fully hand-computed optimal primal vector, dual vector, objective value, and basis. This continues the fixture-first pattern from epics 01-02.

File: `src/specs/architecture/solver-interface-testing.md` SS1.1-SS1.3.

### Method contract format with Preconditions/Postconditions tables

All 9 methods in `solver-interface-trait.md` (SS2.1-SS2.9) use the Preconditions/Postconditions table format established in the prior epics. The two fallible methods (`solve`, `solve_with_basis`) provide two postcondition tables each -- one for `Ok` and one for `Err` -- to keep the contract for each outcome explicit.

File: `src/specs/architecture/solver-interface-trait.md` SS2.

### SS prefix throughout architecture specs; § only for HPC cross-references

All intra-architecture cross-references in the implemented files use `SS`. The three correct uses of `§` in `solver-interface-trait.md` are outbound links to HPC files (`communicator-trait.md §3` and `backend-testing.md §1`), which correctly use the HPC domain prefix. No architecture-internal `§` symbol appears in the committed files.

Files: `src/specs/architecture/solver-interface-trait.md` (lines 5, 7, 589); `src/specs/architecture/solver-interface-testing.md` (no `§` occurrences).

### Sibling cross-references in the Cross-References section

`solver-interface-trait.md` cross-references `communicator-trait.md` explicitly as the source of both the dispatch pattern and the convention blockquote, and `extension-points.md` for the dispatch analysis. `solver-interface-testing.md` cross-references `backend-testing.md` as the gold-standard conformance test methodology pattern. The practice of citing sibling specs that share structural patterns is fully established.

File: `src/specs/architecture/solver-interface-trait.md` Cross-References section (14 entries); `src/specs/architecture/solver-interface-testing.md` Cross-References section.

### Test naming convention stated before the first table

`solver-interface-testing.md` opens SS1 with an explicit "Test naming convention:" paragraph (`test_solver_{variant}_{method}_{scenario}`) before any test tables. This continues the pattern added as an improvement in epic-01.

File: `src/specs/architecture/solver-interface-testing.md` SS1, first paragraph.

---

## New Patterns and Conventions Established

### Rust trait (not enum) for compile-time-selected backends

`solver-interface-trait.md` is the only trait spec in the corpus that uses a Rust `trait` declaration as its dispatch mechanism rather than an enum with `match`. The trait definition in SS1 shows a public `trait SolverInterface: Send { ... }` with 9 method signatures. The dispatch mechanism section (SS5) explains why this is the correct pattern for this specific case: exactly one solver type is active per binary (feature-gated), the call frequency is millions of times per run (on the hot path), and the backend wraps a C library FFI handle. All five algorithm-variant traits from epics 01-02 use enum dispatch. The contrast table in SS5 makes the decision boundary explicit for future spec authors.

File: `src/specs/architecture/solver-interface-trait.md` SS1, SS5.

### Fallible methods modeled with split Ok/Err postcondition tables

`solve()` and `solve_with_basis()` are the first methods in the corpus where the postcondition tables are split by outcome. The trait spec provides a "Postconditions (on `Ok`)" table and a separate "Postconditions (on `Err`)" table for each. This is necessary because the caller's behavior diverges fundamentally on error: on `Ok` the training loop extracts duals and continues; on `Err` it must call `reset()` before reusing the instance. The split table format makes this behavioral fork immediately visible without reading the prose.

File: `src/specs/architecture/solver-interface-trait.md` SS2.4 and SS2.5.

### SolverError as a structured enum with per-variant optional fields

`SolverError` (SS3) is the first error type defined in the spec corpus. Its six variants mirror `solver-abstraction.md` SS6 exactly, but the spec adds structured fields: `Infeasible` carries an optional infeasibility ray, `NumericalDifficulty` carries an optional partial solution and a message string, `TimeLimitExceeded` carries an optional partial solution and elapsed time, `IterationLimit` carries an optional partial solution and iteration count, `InternalError` carries a message and optional error code. The structured fields allow the training loop to log diagnostics and optionally proceed with partial solutions without unwrapping to strings. The error-to-response mapping table (SS3) documents which variants cause a hard stop vs. allow proceeding with a partial solution.

File: `src/specs/architecture/solver-interface-trait.md` SS3.

### Retry logic encapsulation as an explicit trait-level contract

SS6 of `solver-interface-trait.md` formally states that the retry logic from `solver-abstraction.md` SS7 is encapsulated inside each `SolverInterface` implementation. The SDDP training loop never sees retry attempts -- it only receives the final `Result`. This is the first trait spec in the corpus to include a dedicated "Encapsulation" section specifying what behavioral complexity is hidden from the caller. The pattern is applicable to any trait whose implementations wrap multi-step recovery sequences.

File: `src/specs/architecture/solver-interface-trait.md` SS6.

### Dual normalization contract as an explicit trait-level guarantee

SS7 of `solver-interface-trait.md` formalizes that all `LpSolution.dual` values are pre-normalized to the canonical sign convention before being returned. This is the first time a sign convention guarantee is stated as a trait-level postcondition (it previously existed only in `solver-abstraction.md` SS8). The section includes the mathematical consequence: a sign error in `pi_t^*` produces divergent cuts via the formula `beta_t^k = W_t^T pi_t^*`. Connecting the normalization contract to its failure mode (divergent outer approximation) justifies the normalization requirement for readers who might otherwise consider it an optimization detail.

File: `src/specs/architecture/solver-interface-trait.md` SS7.

### Dedicated dual normalization verification section in the testing spec

`solver-interface-testing.md` SS5 adds a section beyond the acceptance criteria: "Dual Normalization Verification." This section includes a finite-difference sensitivity check (`test_solver_highs_dual_normalization_sensitivity_check`) that verifies the dual value is consistent with the empirical derivative of the objective with respect to the RHS. This check is mathematically independent from reading off the dual from the solver API, making it a stronger verification than directly comparing to the hand-computed value. The finite-difference pattern applies to any spec that specifies a dual or gradient value -- the sensitivity check is a solver-agnostic verification that does not require trusting the solver's dual reporting.

File: `src/specs/architecture/solver-interface-testing.md` SS5.

### LP lifecycle test as a standalone section

SS4 of `solver-interface-testing.md` contains a full LP lifecycle test (`test_solver_highs_lifecycle_full_cycle`) that exercises all 9 methods in the prescribed ordering: load -> solve -> add cuts -> solve -> get basis -> patch -> solve with basis -> verify statistics -> reset -> reload -> solve. The test explicitly states the expected observable behavior at each step, making it a walkthrough of the complete operational protocol. This is the first conformance test spec in the corpus to include such a lifecycle section; it is appropriate for any interface where methods must be called in a specific sequence.

File: `src/specs/architecture/solver-interface-testing.md` SS4.

### Intra-lifecycle infeasibility test added beyond acceptance criteria

The lifecycle repeated patch test (`test_solver_highs_lifecycle_repeated_patch_solve`) discovers that patching Row 0 RHS to 8.0 (reservoir volume = 8) makes the LP infeasible: the power balance constraint becomes `2*8 + x2 = 14` with `x2 >= 0`, but `16 > 14` leaves no feasible thermal dispatch. This infeasibility is caused by the structural design of the fixture (hydro overproduces at high reservoir volumes) and was not specified in the acceptance criteria. Including this test case demonstrates that the error path of `patch_rhs_bounds` followed by `solve` is reachable through normal operation, not just through deliberately constructed infeasible LPs as in SS3.

File: `src/specs/architecture/solver-interface-testing.md` SS4 (`test_solver_highs_lifecycle_repeated_patch_solve`).

---

## Unique Challenges

### § vs SS prefix in doc-comments and inline section anchors

The `solver-interface-trait.md` is the first architecture trait spec that directly cross-references an HPC file (`communicator-trait.md`) as a pattern source. This creates a legitimate mixed-prefix situation: the HPC reference uses `§3` (correct), while all architecture-to-architecture references use `SS` (also correct). The challenge is that the convention blockquote itself is copied verbatim from `communicator-trait.md`, and the blockquote contains `[Backend Testing §1](../hpc/backend-testing.md)` -- this is a valid `§` reference because it points to an HPC file. The risk is that authors pattern-matching on the blockquote's `§` usage incorrectly apply it to architecture links. The ticket pitfall section warned against this explicitly, but the warning requires understanding which files are in `src/specs/hpc/` vs `src/specs/architecture/`.

The guardian rejection during epic-03 (11 architecture-internal `§` references fixed to `SS`) was caused by exactly this: the initial submission of `solver-interface-trait.md` used `§` for architecture-to-architecture links in Rust doc-comments inside the code blocks (e.g., `/// See [Solver Abstraction §4]` instead of `/// See [Solver Abstraction SS4]`). The fix required replacing all architecture-internal `§` anchors within the trait code block doc-comments. The committed file has zero architecture-internal `§` references.

### Cross-reference index batch update methodology

Ticket-013 updated `cross-reference-index.md` across all five sections (SS1-SS5) simultaneously to register 12 new files (6 trait specs + 6 testing specs created across epics 01-03). The batch approach required: (1) reading each of the 12 new spec files to extract their Cross-References sections for the SS3 outgoing table; (2) identifying which existing specs gained new incoming references for the SS4 incoming table; (3) computing topological positions for SS5 dependency ordering; and (4) assigning each spec to its primary crate for SS1 and SS2 reading lists. The total count advanced from 60 to 72 entries. Performing this update in a single ticket rather than incrementally across the three epics prevented 12 intermediate commits that would each have left the index partially updated.

File: `src/specs/cross-reference-index.md`.

### Infeasible LP in the testing fixture via contradictory column bounds

The error path tests (SS3.1) use an infeasible LP constructed from contradictory column bounds (`col_lower = [5.0]`, `col_upper = [3.0]`) rather than from contradictory constraints. This approach is preferable to a constraint-based infeasibility construction for three reasons: (1) it produces a provably infeasible LP without requiring the solver to run simplex iterations, (2) the infeasibility is immediately verifiable by inspection, and (3) it exercises the `load_model` + `solve` path rather than requiring cut logic. The unbounded LP (SS3.2) uses a free column (`col_lower = [-inf]`, `col_upper = [+inf]`) with a negative objective coefficient.

File: `src/specs/architecture/solver-interface-testing.md` SS3.

### stochastic.md needed a new bullet for a previously unrepresented concept

Ticket-014 discovered that `src/crates/stochastic.md` had no Key Concepts bullet for the sampling scheme abstraction at all -- it referenced `scenario-generation.md` in passing but did not describe the sampling scheme as a configurable abstraction point. The new bullet was positioned after the "Opening tree" bullet because the sampling scheme builds on the opening tree concept (it selects scenario realizations from the opening tree in the in-sample variant). This placement is consistent with the dependency ordering in `cross-reference-index.md` SS2.

File: `src/crates/stochastic.md`.

---

## Issues Discovered During Guardian Verification

### Guardian rejection: 11 architecture-internal § references in Rust doc-comments

The initial submission of `solver-interface-trait.md` contained 11 `§` references inside Rust doc-comment strings (`/// ...`) within the SS1 trait code block. These were architecture-to-architecture references (e.g., `/// See [Solver Abstraction §4]`, `/// See [Solver Workspaces §1.1]`) that should have used `SS`. The guardian caught all 11 and rejected the submission. After correction, all architecture-internal references within doc-comments use `SS` (e.g., `/// See [Solver Abstraction SS4]`, `/// See [Solver Workspaces SS1.1]`). The final committed file at `src/specs/architecture/solver-interface-trait.md` has zero architecture-internal `§` references.

The root cause: the initial author pattern-matched on the convention blockquote's `[Backend Testing §1]` link (which is valid, since `backend-testing.md` is in `src/specs/hpc/`) and applied `§` to all section anchors inside code blocks. The correction requires recognizing that the file's containing directory determines the prefix, not the block type (prose vs. doc-comment vs. code).

---

## Recommendations for Epics 04-05

### Epic 04: Verify the mixed-prefix case during the consistency pass

Ticket-018 ("verify traits-as-guidelines convention propagation") should specifically check that all 12 architecture trait and testing spec files have zero architecture-internal `§` references. The Grep pattern `§` in `src/specs/architecture/*.md` should return only references where the link target is in `src/specs/hpc/`. Any `§` anchor pointing to `./solver-abstraction.md`, `./extension-points.md`, or any other architecture file is a violation. The guardian rejection during epic-03 shows this check cannot be skipped.

### Epic 04: SolverInterface test naming is not a variant -- it is a backend

The naming convention for solver tests (`test_solver_{variant}_{method}_{scenario}`) uses `{variant}` for the backend name (`highs` or `clp`), not for an enum variant as in the prior algorithm-variant traits. The consistency pass should verify that this naming pattern is used uniformly in `solver-interface-testing.md` and that the cross-solver equivalence tests (which do not have a single `{variant}`) use a distinct prefix (`test_solver_cross_...`). This distinction should be noted in the consistency report so that the `{variant}` segment is understood as an open field whose semantics depend on the trait being tested.

### Epic 04: Convention blockquote now has two correct `§` occurrences inside it

The convention blockquote references `[Backend Testing §1](../hpc/backend-testing.md)`. This `§` is valid (HPC file), but the consistency pass must verify that this is the only `§` inside the blockquote across all seven trait specs. Any `§` added outside the blockquote in an architecture spec is a violation.

### Epic 05: SolverInterface introduces the only `Result`-returning hot-path method

The readiness assessment should note that `solve()` and `solve_with_basis()` are called millions of times per training run and return `Result`. The `Err` branch causes the training loop to call `reset()` -- which itself is infallible -- before reusing the solver. Performance implications: the `Result` allocation on the error path is negligible (errors are rare), but the reset-and-reload sequence following a terminal error adds latency. The readiness assessment should flag that implementers should benchmark the error-path cost separately from the hot-path cost.

### Epic 05: Dual normalization is a conformance requirement, not an optimization

The readiness assessment should confirm that both HiGHS and CLP implementations are required to normalize duals before returning `LpSolution`. The normalization code path runs once per solve (during solution extraction) and adds a single pass over the dual vector. The cost is O(num*rows) -- negligible relative to the LP solve. Nonetheless, the assessment should recommend that the normalization be verified by the sensitivity check in `solver-interface-testing.md` SS5 (`test_solver*{variant}\_dual_normalization_sensitivity_check`) during initial implementation, not just by comparing to expected values.
