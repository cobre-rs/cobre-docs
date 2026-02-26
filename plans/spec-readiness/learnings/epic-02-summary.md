# Accumulated Learnings Through Epic 02

## Structural Patterns (All Trait Specs)

- Every trait spec opens with: Purpose paragraph -> verbatim convention blockquote -> SS1 Trait Definition
- Convention blockquote is word-for-word from `communicator-trait.md`; paraphrasing is not permitted
- Convention blockquote belongs in trait specs only, not in testing specs
- All architecture-to-architecture links use `SS` prefix; `§` is reserved for `src/specs/hpc/` files only
- Dispatch mechanism section (SS4 or SS7) must explain: why not monomorphization, why not trait objects, performance characteristics
- Infallibility claims must cite the specific upstream section (validation rule, config load step) that provides the guarantee
- Sibling trait specs listed in Cross-References as "following the same enum dispatch pattern"

## Structural Patterns (All Testing Specs)

- Shared fixture declared once at the top of SS1, before any test tables; test rows reference it as a delta
- Explicit "Test naming convention:" paragraph before the first table in each section
- Convention for architecture testing specs: `test_{trait}_{variant}_{method}_{scenario}` (all lowercase, snake_case)
- Variant equivalence / cross-variant ordering tests are a dedicated section, separate from conformance tests
- Numerical property tests (formulas, invariants) occupy a dedicated section; conformance tests only check specific outputs
- If a method has non-monotonic behavior, add an explicit "Not monotonic" note and include a test case that demonstrates the non-monotonicity
- When a fixture contains a state that is internally inconsistent for a subset of tests, document the inconsistency inline and construct corrected scenarios rather than silently using the contradictory fixture

## Dispatch Architecture

- **Single active variant, global scope**: use flat enum, match at call sites (CutSelectionStrategy, HorizonMode, SamplingScheme)
- **Single active variant, per-stage scope**: use flat enum, match at call sites (RiskMeasure)
- **Multiple active variants evaluated simultaneously**: use `Vec<EnumVariant>` + composition struct with mode field (StoppingRuleSet); compile-time monomorphization is structurally impossible for heterogeneous sets
- Compile-time monomorphization reserved for SolverInterface (one solver type fixed per binary)
- `Box<dyn Trait>` is rejected in all current trait specs; closed variant sets always prefer enum dispatch

## Invariants and Contracts

- Methods that are pure queries (read-only): `should_run`, `select`, `evaluate` -- never return `Result`
- Methods that mutate tracking state: `update_activity` -- also infallible when operating on pre-validated, pre-allocated structs
- Any trait with per-iteration selection/evaluation must document: what triggers it, on which iterations it is skipped, and how skipping interacts with composition logic
- For "soft delete" patterns (deactivation not deletion): enumerate all consumers that rely on preserved data (checkpoint/resume, deterministic indexing, post-hoc analysis)
- Non-monotonic rules (BoundStalling) must be evaluated freshly each iteration; composition logic must not cache results

## Unique Design Patterns Introduced in Epic 02

- **Two-layer abstraction**: individual rule enum + composition struct; use when multiple variants must be evaluated simultaneously and combined by boolean logic
- **Always-injected, non-configurable variant**: GracefulShutdown has no JSON representation; injected at construction time; bypasses composition logic entirely; validation rules do not apply to it
- **Side-effect separation**: when a method's evaluation depends on an expensive computation, the computation belongs in the caller, the pure decision belongs in the method, and intermediate data passes through a shared state struct (MonitorState pattern)
- **Field-consumption matrix**: when multiple variants consume overlapping subsets of a shared state struct, include a table mapping fields to variants; eliminates need to read five sections to understand dependencies
- **Production-scale cost calculation**: when a variant has super-linear algorithmic cost, include a concrete FLOP estimate at production scale (not just a Big-O expression)

## Test Design Principles

- Minimum test counts are floors, not targets; algorithm-heavy traits naturally exceed minimums
- For dominated / partial-domination tests: provide explicit cut coefficients and visited state values so readers can verify domination by hand (not just trust the expected result)
- For composition (OR/AND) tests: cover all combinations -- single trigger, both trigger, neither trigger, and mixed triggered/not-triggered -- in both modes
- For signal/flag-driven variants (GracefulShutdown): test monotonicity explicitly (once set, flag is never cleared)
- For rules with phase-gated evaluation (SimulationBased): test each failure mode independently -- wrong iteration, Phase 1 failure, Phase 2 failure, first-evaluation (no prior data)
- Near-zero and denominator-guard scenarios should be added proactively even when not specified in acceptance criteria, if the formula contains division by a potentially small value

## Cross-Reference Quality

- At minimum 8-12 Cross-References entries per spec
- Each entry includes: the file, the specific sections within it, and a one-line description of what is referenced
- Format: `[File](./link.md) -- description (section list)`
- Do not use bare hyperlinks embedded in prose as a substitute for the Cross-References section

## Upcoming Epic Guidance

- **Epic 03 SolverInterface**: expect `Result`-returning methods (infallibility does not apply); use compile-time monomorphization (correct case); use stub/mock LP problems for testing; reference `solver-abstraction.md` SS5.4 (CSR assembly)
- **Epic 03 index updates**: Grep for existing references to `cut-management.md`, `stopping-rules.md`, `convergence-monitoring.md` before adding parallel references to new trait specs
- **Epic 04 consistency pass**: verify convention blockquote verbatim in all seven trait specs; absent from all testing specs; verify SS prefix in all new spec links; verify "Not monotonic" notes are applied wherever applicable
- **Epic 05 readiness**: flag Dominated strategy as a performance risk; recommend Cargo feature flag to gate it from CI benchmarks; reference the 7.7G FLOP estimate in `cut-selection-trait.md` SS6.4
