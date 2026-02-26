# Accumulated Learnings Through Epic 03

## Structural Patterns (All Trait Specs)

- Every trait spec opens with: Purpose paragraph -> verbatim convention blockquote -> SS1 Trait Definition
- Convention blockquote is word-for-word from `communicator-trait.md`; belongs in trait specs only, never in testing specs
- All architecture-to-architecture links use `SS` prefix; `§` is reserved for `src/specs/hpc/` files only
- The convention blockquote itself contains one valid `§` reference (`[Backend Testing §1]`); this is the only permitted `§` inside any architecture spec
- Dispatch mechanism section must explain: why not the rejected alternatives, performance characteristics, and which architectural property drives the choice
- Infallibility claims must cite the specific upstream section that provides the guarantee
- Sibling trait specs listed in Cross-References as "following the same [dispatch] pattern"
- Cross-References section: minimum 10-14 entries, each with file, sections, and one-line description

## Structural Patterns (All Testing Specs)

- Shared fixture declared once at the top of SS1 before any test tables; tests reference it as a delta
- Explicit "Test naming convention:" paragraph before the first table
- Architecture testing convention: `test_{trait}_{variant}_{method}_{scenario}` (all lowercase, snake_case)
- For solver tests, `{variant}` is the backend name (`highs`, `clp`); cross-solver equivalence tests use `test_solver_cross_...`
- Error path tests occupy a dedicated section (SS3), separate from success-path conformance tests
- LP lifecycle test in a standalone section when methods must be called in sequence
- When a fixture produces infeasibility through normal operation (not just deliberate error construction), include that case as a lifecycle test

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
- When a method returns `Err`, the caller is responsible for calling `reset()` before reusing the instance; document this in the `Err` postcondition table
- Retry logic and sign-convention normalization are encapsulated inside implementations; the trait method returns only the final result
- Dual normalization is a trait-level guarantee, not a caller responsibility; connect it to the mathematical failure mode (divergent cuts) to justify the contract

## Error Type Design

- `SolverError` is the first error enum in the corpus; its pattern: one variant per error category from the source spec (SS6), optional structured fields (partial solution, infeasibility ray, message), and a hard-stop vs. proceed-with-partial mapping table
- Hard-stop variants: `Infeasible`, `Unbounded`, `InternalError`
- Proceed-with-partial variants: `NumericalDifficulty`, `TimeLimitExceeded`, `IterationLimit`
- Future error enums should follow the same structure: variant mirrors the source spec's error categories; fields carry diagnostics; a response mapping table documents caller behavior

## Unique Design Patterns Introduced in Epic 03

- **Two-layer abstraction** (epic-02): flat enum + composition struct; use when multiple variants must be evaluated simultaneously
- **Always-injected variant** (epic-02): GracefulShutdown; bypasses composition and validation
- **Side-effect separation** (epic-02): expensive computation in caller, pure decision in method, shared state passes intermediate data
- **Field-consumption matrix** (epic-02): table mapping shared state fields to variants
- **Retry encapsulation section** (epic-03): dedicated SS documenting what behavioral complexity is hidden from the caller; applies to any trait whose implementations wrap multi-step recovery
- **Dual normalization contract section** (epic-03): dedicated SS guaranteeing pre-normalized outputs; connects the guarantee to the mathematical failure mode of violating it
- **Finite-difference sensitivity check** (epic-03): verifies dual values by perturbing RHS and comparing empirical slope; solver-agnostic and independent of API trust

## Test Design Principles

- Minimum test counts are floors; algorithm-heavy traits and multi-backend traits exceed them naturally
- For dominated / partial-domination tests: provide explicit coefficients so readers can verify by hand
- For composition tests: cover all combinations (single trigger, both, neither, mixed)
- Near-zero and denominator-guard scenarios should be added proactively when formulas contain division by small values
- For multi-backend traits: cross-solver equivalence tests occupy a dedicated section with explicit tolerances table (objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start iterations 2x ratio)
- The finite-difference sensitivity check is the strongest dual verification; use it whenever a dual or gradient is a first-class postcondition

## Cross-Reference Index Methodology

- Batch updates (all 12 specs at once in ticket-013) prevent partial-update commits and ensure consistency across all 5 sections
- For each batch: (1) read new files to extract outgoing references for SS3; (2) identify existing specs gaining new incoming references for SS4; (3) compute topological positions for SS5; (4) assign primary crates for SS1 and SS2
- `SamplingScheme` belongs to `cobre-stochastic`, not `cobre-sddp`; verify crate assignments before updating SS2
- Doc count advanced from 60 to 72; update the document header count at the same time

## Guardian Rejection Patterns

- **Epic-01**: no rejections; SS prefix warnings in ticket pitfalls prevented violations
- **Epic-02**: no rejections; one fixture inconsistency identified and resolved inline
- **Epic-03**: one rejection -- 11 architecture-internal `§` references inside Rust doc-comment strings within code blocks (not in prose); root cause: author pattern-matched on the blockquote's valid `§` link and applied it to architecture links inside doc-comments

## Upcoming Epic Guidance

- **Epic 04 consistency pass**: Grep `§` in `src/specs/architecture/*.md`; any result pointing to an architecture file (not `src/specs/hpc/`) is a violation; verify convention blockquote verbatim in all seven trait specs; verify `{variant}` naming semantics per trait type in testing specs
- **Epic 04 audit**: the "Not monotonic" note pattern from `stopping-rule-trait.md` SS2.3 may apply to other methods; check `risk-measure-trait.md` SS2 during the pass
- **Epic 05 readiness**: flag Dominated strategy 7.7G FLOP cost (in `cut-selection-trait.md` SS6.4) as performance risk requiring feature flag; flag `Result`-returning hot-path methods as requiring separate error-path benchmark; confirm dual normalization verified by sensitivity check during initial implementation
