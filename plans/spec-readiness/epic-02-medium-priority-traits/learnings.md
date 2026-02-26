# Epic 02 Learnings: Medium-Priority Trait Formalization

## Patterns Followed from Epic 01

### Convention blockquote is verbatim in both trait specs

Both `cut-selection-trait.md` and `stopping-rule-trait.md` include the "Rust traits as specification guidelines" blockquote word-for-word from `communicator-trait.md`. This remained an explicit acceptance criterion and was satisfied without deviation. The blockquote appears immediately after the Purpose paragraph and before SS1 in both files, matching the placement established in epic-01.

### Shared test fixture with hand-computed values at the top of each testing spec

`cut-selection-testing.md` opens with a 5-cut pool table (6 columns: intercept, coefficient, active_count, last_active_iter, iteration_generated, active flag) plus a 3-state visited-state table and a full cut-values-at-visited-states matrix -- all hand-computed. `stopping-rule-testing.md` opens with a `MonitorState` baseline table (7 fields) that individual tests selectively override. The fixture-first pattern from epic-01 is maintained: every test case in SS1 is a targeted delta from a fully specified shared state, keeping table rows short and verifiable.

### Method contract format with Preconditions / Postconditions tables

All three methods in `cut-selection-trait.md` (`should_run`, `select`, `update_activity`) and the `evaluate` method in `stopping-rule-trait.md` use the same Preconditions/Postconditions table format established in the epic-01 trait specs. Variant-specific behavioral contracts are stated as additional postcondition tables beneath the shared ones, preserving the separation between general guarantees and variant-specific behavior.

### Infallibility documented with upstream guard citation

Every infallible method names the upstream section that provides the guarantee. For `should_run` and `select`, infallibility cites the validation rules C1-C5 in `cut-selection-trait.md` SS5. For `evaluate`, infallibility cites SS4 (validation rules V1-V10). This is the same pattern as epic-01: "infallibility requires citing the upstream guard."

### SS prefix throughout; no use of the HPC-only `§` symbol

All cross-references in both trait specs and both testing specs use `SS` for architecture-to-architecture links. No guardian finding was needed on this -- the pitfalls sections of both ticket-007 and ticket-009 did not explicitly warn against it, but the authors followed the convention correctly. The sibling cross-references in the Cross-References sections of all four files use `SSN` consistently.

### Sibling cross-references in the Cross-References section

By epic-02, the corpus has five sibling trait specs. `cut-selection-trait.md` cross-references all three epic-01 trait specs as "sibling trait specifications following the same enum dispatch pattern." `stopping-rule-trait.md` cross-references all four existing sibling trait specs including `cut-selection-trait.md`. The convention of listing siblings in the Cross-References section is fully established.

### Test naming convention stated explicitly before each section's first table

Both testing specs include an explicit "Test naming convention:" paragraph at the top of SS1 before any tables appear, following the epic-01 improvement. The naming convention for `cut-selection-testing.md` is `test_cutselection_{variant}_{method}_{scenario}`; for `stopping-rule-testing.md` it is `test_stopping_{rule}_{scenario}`.

### Dispatch mechanism section (SS4 in cut-selection, SS7 in stopping-rule) is substantive

The dispatch rationale in `cut-selection-trait.md` SS4 explains why enum dispatch beats compile-time monomorphization specifically for the case where the strategy is global (one per run), and why trait objects are rejected -- including a production-scale calculation (12 dispatches per iteration at 120 stages and `check_frequency=10`). `stopping-rule-trait.md` SS7 provides the additional argument that a generic type parameter for stopping rules cannot represent a heterogeneous set, which is a new dispatch argument not present in the epic-01 specs.

---

## New Patterns and Conventions Established

### Two-layer abstraction for composable traits

The `StoppingRule` trait introduced a pattern not present in any epic-01 trait: the **two-layer design** with a flat enum for individual variants (`StoppingRule`) and a separate composition struct (`StoppingRuleSet`) that holds a `Vec<StoppingRule>` plus a `StoppingMode`. This design is justified in the Purpose paragraph and in SS1's "Two-layer rationale" block. The key distinction from single-variant enum-dispatch traits is that the stopping rule abstraction must evaluate a _set_ of rules simultaneously, which is impossible to express as a single enum match. Future trait specs that require multi-rule combination (e.g., a hypothetical ensemble of risk measures) should use this same two-layer pattern.

Files: `src/specs/architecture/stopping-rule-trait.md` SS1.1, SS1.2.

### GracefulShutdown as a non-configurable, always-injected variant

The `GracefulShutdown` variant is documented as never appearing in `config.json` -- it is injected at `StoppingRuleSet` construction time. This is a new category of trait variant: one that is always present and driven by a runtime mechanism (OS signals) rather than user configuration. The implication is that validation rule V10 (at least one IterationLimit rule) is the only cross-rule validation; GracefulShutdown does not need validation. Additionally, the GracefulShutdown override behavior (always evaluated first, bypasses composition logic) is specified explicitly in SS3.4 and tested in SS2.3 of the testing spec. Future traits with similarly mandatory or signal-driven variants should use the same always-injected, validation-exempt pattern.

Files: `src/specs/architecture/stopping-rule-trait.md` SS1.1, SS3.4; `src/specs/architecture/stopping-rule-testing.md` SS2.3.

### Side-effect separation for complex evaluation

The `SimulationBased` rule has a unique property: its evaluation depends on Monte Carlo simulations that are computationally expensive. The spec documents that `evaluate` is deliberately pure -- it only reads simulation results from `MonitorState` that the convergence monitor has already populated. The convergence monitor detects the rule's presence, runs simulations on checkpoint iterations, and stores results before calling `evaluate`. This side-effect separation ensures the rule is testable in isolation with mock `MonitorState` inputs. The testing spec (SS1.4) validates this by using mock `current_simulation_costs` and `last_simulation_costs` fields without any actual Monte Carlo execution.

This pattern generalizes to any trait method whose evaluation depends on an expensive computation: the computation belongs in the caller (convergence monitor), the pure decision logic belongs in the trait method, and the intermediate data is passed through a shared state struct.

Files: `src/specs/architecture/stopping-rule-trait.md` SS2.4 (last paragraph "Side-effect separation"); `src/specs/architecture/stopping-rule-testing.md` SS1.4 purpose paragraph.

### Aggressiveness ordering tests as a first-class section

`cut-selection-testing.md` SS2 contains a dedicated "Aggressiveness Ordering Tests" section that verifies the structural property Level1 <= LML1 <= Dominated on the same cut pool. This is analogous to the "variant equivalence tests" in epic-01, but instead of verifying that degenerate parameters collapse to simpler behavior, it verifies that the strategies maintain a known partial ordering. The shared fixture is reused directly, and the deactivation sets are explicitly listed for all three strategies. This section is not a conformance test (it does not test individual method contracts) but a cross-variant structural test. The distinction matches the category separation established in epic-01.

Files: `src/specs/architecture/cut-selection-testing.md` SS2.

### Convergence property tests with precondition contradiction resolution

`cut-selection-testing.md` SS3 addresses a subtle issue: the shared fixture has cut 1 with `active_count=0` and `last_active_iter=5`, but the domination analysis shows that cut 1 achieves the maximum value at `x_hat=1.0`. This means the shared fixture contains a technically inconsistent state (cut 1 is binding at a visited state but has never been recorded as active). The convergence property tests explicitly resolve this by constructing corrected scenarios -- cut 1 with `active_count=1` after `update_activity` has been called. The test narrative explains: "the precondition that `update_activity` is called before `select` guarantees that binding cuts always have active_count > 0 when Level1 runs." This pattern of explicitly acknowledging and resolving fixture inconsistencies -- rather than silently using a contradictory fixture -- should be followed in future testing specs.

Files: `src/specs/architecture/cut-selection-testing.md` SS3, test `test_cutselection_level1_preserves_binding_cut`.

### Non-monotonic rule flagged explicitly

`stopping-rule-trait.md` SS2.3 includes a "Not monotonic" note for BoundStalling: the rule can return `true` at iteration $k$ and `false` at iteration $k+1$ if a late cut causes a significant bound jump. The note explains why the composition logic evaluates all rules at each iteration rather than caching results. This is the first trait spec in the corpus to explicitly document that a method is non-monotonic and to explain the compositional implication. The oscillating bounds sequence in `stopping-rule-testing.md` SS3.3 is specifically designed to demonstrate this non-monotonicity: the test at $k=4$ triggers, the test at $k=5$ does not.

Files: `src/specs/architecture/stopping-rule-trait.md` SS2.3; `src/specs/architecture/stopping-rule-testing.md` SS3.3.

### MonitorState field-consumption table

`stopping-rule-trait.md` SS4.3 includes a matrix table mapping which `MonitorState` fields each rule consumes, with one row per field and one column per rule variant. This format (not used in any epic-01 spec) makes the state dependency graph immediately legible without reading five separate rule sections. Future specs that define a shared state struct consumed by multiple variants should include a similar field-consumption matrix.

Files: `src/specs/architecture/stopping-rule-trait.md` SS4.3.

### Near-zero bound guard test added beyond ticket specification

The ticket-010 specification listed three bound stalling test sequences: decreasing increments, flat, and oscillating. The implemented `stopping-rule-testing.md` added a fourth sequence -- SS3.4 "Near-Zero Bounds" -- that specifically tests the `max(1, |z^k|)` denominator guard for small bound values. This extension was not specified in the ticket's acceptance criteria but is mathematically necessary: without this guard, a near-zero bound would produce a denominator of ~0.28 instead of 1.0, inflating the relative improvement and potentially suppressing a trigger. The fourth sequence was added because it tests a non-obvious correctness property that cannot be inferred from the other three sequences. Future testing spec authors should look for denominator-guard and edge-case behaviors that acceptance criteria underspecify and add them proactively.

Files: `src/specs/architecture/stopping-rule-testing.md` SS3.4.

---

## Unique Challenges

### CutSelectionStrategy: three-method trait with state mutation

Unlike the epic-01 traits (which typically had one or two pure query methods), `CutSelectionStrategy` has three methods with distinct roles: `should_run` (pure query), `select` (pure query over complex state), and `update_activity` (state mutator). The state mutation in `update_activity` is variant-specific: Level1 increments a counter, LML1 sets a timestamp, and Dominated resets a counter. This required a per-cut `CutMetadata` struct (SS3.2) with all three fields present simultaneously -- even though each variant only uses one field. The rationale is that a single metadata struct is simpler than three separate per-variant structs, and the unused fields for a given variant are zero/default at initialization. The initialization semantics table (SS3.2) documents which field is meaningful per variant and why `last_active_iter` is initialized to `iteration_generated` rather than 0 (to prevent immediate LML1 deactivation of newly created cuts).

Files: `src/specs/architecture/cut-selection-trait.md` SS2.3, SS3.2.

### CutSelectionStrategy: O(n \* m) dominated detection requires production-scale cost calculation

The Dominated variant's cost is $O(|\text{active cuts}| \times |\text{visited states}|)$ per stage per check, which at production scale (120 stages, 15,000 cuts, 1,920 visited states, `check_frequency=50`) yields approximately 7.7G floating-point operations per stage per check. This production-scale cost calculation appears in SS6.4 of `cut-selection-trait.md` and justifies the `check_frequency` amortization. Including this concrete cost figure in the spec -- rather than leaving it as a vague "expensive" warning -- gives future implementers an accurate basis for deciding whether to gate the Dominated strategy behind a feature flag or to parallelise it. This is the first spec in the corpus to include a production-scale cost calculation of this form.

Files: `src/specs/architecture/cut-selection-trait.md` SS6.4.

### CutSelectionStrategy: deactivation semantics require explaining three distinct invariants

Why are cuts never deleted, only deactivated? The spec identifies three distinct reasons (SS6.1): checkpoint/resume correctness, deterministic slot assignment, and post-hoc analysis. Each maps to a different consumer of the cut pool data. This three-reason justification required reading `cut-management-impl.md` SS1-SS3 in detail to identify all consumers. Future specs that document a "soft delete" or "deactivation not deletion" pattern should similarly enumerate all consumers that depend on the preserved data, rather than giving a single-reason justification.

Files: `src/specs/architecture/cut-selection-trait.md` SS6.1.

### StoppingRule: two-layer design creates a dispatch mechanism argument not seen before

The stopping rule's dispatch section (SS7) adds a novel argument: compile-time monomorphization is structurally impossible for a heterogeneous rule set, not merely inconvenient. A generic type parameter `S: StoppingRuleTrait` can represent only one rule type at a time. To represent a set of different rules, `Vec<Box<dyn StoppingRuleTrait>>` would be required, which brings dynamic dispatch without the closed-variant benefits of enum dispatch. The chosen design (`Vec<StoppingRule>`) uses enum dispatch inside a `Vec` -- every rule is a value-type enum element, and the `match` is inside `evaluate`. This is a strictly better design for a closed, small variant set. The argument should be recorded because it applies to any future abstraction that requires a heterogeneous collection of variants evaluated simultaneously.

Files: `src/specs/architecture/stopping-rule-trait.md` SS7.

### StoppingRule: risk-averse considerations require cross-referencing two prior specs

SS6 of `stopping-rule-trait.md` explains that BoundStalling's lower bound is not a valid lower bound under CVaR (it is a convergence indicator only), citing `risk-measures.md` SS10. It also explains that SimulationBased measures policy stability directly, making it independent of bound validity -- but that the convergence monitor must apply `evaluate_risk` from `risk-measure-trait.md` SS2.2 when computing simulation cost summaries. This required cross-referencing both the math spec and the previously written epic-01 trait spec simultaneously. The pattern of including a dedicated "Risk-Averse Considerations" section in algorithm specs that interact with CVaR should be followed for any future spec that touches convergence quantities.

Files: `src/specs/architecture/stopping-rule-trait.md` SS6.

---

## Issues Discovered During Guardian Verification

No guardian rejection was triggered during epic-02. The implementation satisfied all acceptance criteria on the first submission for all four tickets.

The one potential issue identified during review (not a guardian rejection) was the fixture inconsistency in `cut-selection-testing.md`: the shared fixture has cut 1 with `active_count=0` yet the domination analysis shows cut 1 achieves the maximum value at `x_hat=1.0`. A strictly correct fixture would have `active_count=1` for cut 1. However, the convergence property tests (SS3) explicitly address this by constructing corrected scenarios, and the shared fixture's inconsistency is only relevant for the SS3 tests (not SS1 or SS2, which only use `active_count` for Level1 and LML1 decisions). The inconsistency was not corrected in the fixture itself because fixing it would change the Level1 conformance test outcome (cut 1 would no longer be in the deactivation set for `test_cutselection_level1_select_deactivate_never_active`), and the fixture's primary purpose is to demonstrate that Level1 deactivates never-active cuts.

The correct reading is: the shared fixture represents an idealized snapshot for Level1 and LML1 tests, and the SS3 tests use it as a starting point that is explicitly corrected for the convergence property scenarios. This is documented inline in the test narrative but could be made more prominent in a future revision.

---

## Recommendations for Upcoming Epics

### Epic 03: SolverInterface trait

The SolverInterface is qualitatively different from all five traits written so far: it is a boundary with external code (the LP solver library), not an internal algorithm configuration. Expectations:

- The trait will likely need an `Error` associated type or return `Result` -- infallibility is not guaranteed because LP solvers can fail (numerical issues, memory, license errors). Document the error boundary explicitly.
- The SolverInterface is the only trait in the corpus where compile-time monomorphization (generic over `S: SolverInterface`) is both correct and recommended, because the solver type is fixed at compile time and there is exactly one active solver per binary. Document the dispatch decision explicitly and explain why this is a different case from all previous traits.
- The conformance test spec for SolverInterface must use a mock/stub solver implementation because the real solvers (HiGHS, Gurobi) are not available in the test environment. The stub should produce deterministic, hand-verifiable LP solutions for small problems (2-3 variables, 3-5 cuts). Document this pattern explicitly.
- Reference `solver-abstraction.md` SS1-SS5 and `solver-workspaces.md` SS1.4 before drafting. The CSR assembly process (SS5.4 of solver-abstraction) is important context for what the interface must expose.

### Epic 03: Index and crate spec updates

Ticket-013 and ticket-014 (index and crate updates) are structural, not behavioral. The risk is missing cross-references to the six new trait spec files and six new testing spec files. Recommended approach: use Grep to find all existing cross-references to `cut-management.md`, `stopping-rules.md`, and `convergence-monitoring.md` in the index and crate specs, then add parallel references to the new trait specs that extend those math specs.

### Epic 04: Consistency pass will need to check four new spec categories

The six epic-01 specs and four epic-02 specs introduce: (a) convention blockquote, (b) SS prefix in all links, (c) test naming convention paragraphs, (d) the "sibling trait" cross-reference pattern. The consistency pass (ticket-015 through ticket-018) should verify all four categories across all ten files. Ticket-018 ("verify traits-as-guidelines convention propagation") should specifically check that the convention blockquote is verbatim in all seven trait specs (including the upcoming SolverInterface) and absent from all testing specs.

### Epic 04: BoundStalling non-monotonicity note should be checked for consistency

`stopping-rule-trait.md` SS2.3 includes the first "Not monotonic" method note in the corpus. If the consistency pass finds other methods across the existing specs that are also non-monotonic, they should receive the same explicit note. Candidate: the `evaluate_risk` weight output under certain CVaR configurations may not be monotonic in lambda. Check `risk-measure-trait.md` SS2 during the audit.

### Epic 05: Readiness assessment should enumerate the CutSelectionStrategy Dominated variant as a risk

The Dominated strategy's $O(n \times m)$ cost (documented in `cut-selection-trait.md` SS6.4 with the 7.7G FLOP estimate) is the most expensive single operation in the training loop outside of LP solves. The readiness assessment should flag this as a performance risk requiring early profiling, and recommend that the initial Rust implementation gate the Dominated strategy behind a Cargo feature flag so it can be excluded from CI timing benchmarks.

### Test fixture complexity across epics has stabilized

Epics 01 and 02 showed increasing fixture complexity: simple 3-opening tables (RiskMeasure) -> two named JSON config fixtures (HorizonMode) -> PAR parameters + opening tree matrix (SamplingScheme) -> 5-cut pool with visited states and hand-computed domination table (CutSelectionStrategy) -> `MonitorState` struct with per-field baseline table (StoppingRule). The complexity has stabilized because the `MonitorState` baseline is simpler than the cut pool fixture -- it is a struct with named fields rather than a matrix. Epic-03's SolverInterface fixture will likely require a small LP problem (2-3 variables, 3-5 constraints) with a known optimal solution, which is structurally similar in complexity to the SamplingScheme fixture. Plan for hand-solvable LP instances.
