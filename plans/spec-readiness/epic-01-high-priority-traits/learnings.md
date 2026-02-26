# Epic 01 Learnings: High-Priority Trait Formalization

## Patterns That Worked Well

### Shared test fixture declared at the top of each testing spec

All three testing specs (risk-measure-testing.md, horizon-mode-testing.md, sampling-scheme-testing.md) open with a clearly labeled "Shared test fixture" block containing concrete tables of input values. This pattern eliminates redundancy inside individual test rows and makes the test table column for "Input Scenario" dramatically shorter and cleaner -- rows can say "Shared fixture with lambda=0.5, alpha=0.5" rather than repeating 15 lines of data. The fixture is given a name (Fixture A, Fixture B, or "Shared test fixture") and documented once, completely. Future test specs should follow this fixture-first pattern.

### Enum dispatch rationale section is substantive, not boilerplate

Each trait spec (SS4 in all three) contains a dedicated "Dispatch Mechanism" section that explains the specific reason why enum dispatch (not compile-time monomorphization, not trait objects) was chosen for that particular trait. The rationale is concrete: per-stage variation for RiskMeasure, global-but-for-consistency for HorizonMode and SamplingScheme. Each section references the dispatch analysis in `src/specs/architecture/extension-points.md` SS7 and also cross-references the sibling trait specs once they existed. This three-part structure (why not monomorphization / why not trait objects / performance characteristics with concrete numbers) should be replicated for all enum-dispatch traits.

### Method infallibility is documented as a deliberate contract

All three trait specs explicitly document that the primary methods (`aggregate_cut`, `evaluate_risk`, `successors`, `is_terminal`, `discount_factor`, `sample_forward`) do not return `Result`. The infallibility rationale is stated in each case: inputs are validated at configuration load time, and the validation pipeline is the single place that can produce errors. This prevents implementation drift where the hot path starts accumulating error-handling overhead. The pattern is: declare infallibility, explain why (upstream validation), cite the section where the validation occurs.

### Separation invariant as a first-class spec section

The SamplingScheme trait spec elevated the forward-backward separation invariant to its own section (SS5) with the heading "Forward-Backward Separation Invariant" and a bolded, prominent statement of the invariant. This is significantly stronger than burying the invariant in prose inside a method contract. The corresponding test spec (SS2) opens with "These tests are the highest-priority tests in this spec" and contains three dedicated tests for the invariant. For future traits where one invariant is architecturally critical, this explicit elevation to a named, standalone section is the right approach. This pattern is applicable to any correctness-critical invariant that cuts across multiple methods.

### Variant equivalence tests separate from conformance tests

All three testing specs distinguish between (a) conformance tests that verify each method works correctly for its primary purpose, and (b) variant equivalence tests that verify degenerate parameter settings collapse to simpler behavior. For RiskMeasure, this is lambda=0 and alpha=1 collapsing to Expectation. For SamplingScheme, this is InSample and External producing identical backward pass noise. Keeping these as a separate section (SS2 in the testing specs) clarifies the intent: these are not redundant tests, they verify the mathematical relationships between variants.

### Cross-reference sections are comprehensive and explicit

Every spec (both trait and testing) ends with a Cross-References section listing each referenced file, the specific sections within it, and a one-line description of the referenced content. The listing format is `[File](./link.md) -- description (section list)`. This is far more useful than bare hyperlinks embedded in prose, because a developer looking at the Cross-References section can understand the dependency graph without reading the full document. At minimum 8-12 entries per spec is appropriate for this corpus.

---

## Issues Found and Fixed

### Section symbol inconsistency in testing specs

The trait specs were written using the `## 1.`, `## 2.` heading format (no `§` symbol, because these are `src/specs/architecture/` files). However, within the test table cross-reference links, some early drafts used the HPC-style `§N` anchor syntax when linking back to the newly created architecture trait specs. The correct convention for architecture-to-architecture cross-references is `[File SS2.1](./file.md)` (not `§2.1`). The final versions of all six files use `SS` consistently for architecture specs. Future tickets must check every cross-reference link in every test table row, not just the top-level Cross-References section -- internal table links can diverge from the convention without being noticed during a quick review.

### Test naming convention needed explicit statement before the tables

The backend-testing.md gold standard does not explicitly label its naming convention as a named convention; the pattern emerges from the column headers. The epic-01 specs improved on this by adding an explicit "Test naming convention:" paragraph before each section's first table. This prevents implementers from guessing the convention from examples. The pattern for test naming is: `test_{trait}_{variant}_{method}_{scenario}` where each segment is lowercased and snake-cased. All six files state this explicitly.

### Numerical properties in testing specs needed their own subsection

Early planning of the risk-measure testing spec described numerical invariant tests (weights sum to 1, non-negative, bounded by mu_bar) as part of SS1. In the implemented version, these were correctly extracted to SS3 "Numerical Properties" with subsections for weight invariants (SS3.1) and monotonicity invariants (SS3.2). This separation is important: conformance tests verify specific numeric outputs against known inputs, while numerical property tests verify mathematical invariants that hold for any valid input. These are different categories of assertion and belong in different sections.

### Tied-cost test case explicitly acknowledges implementation-defined behavior

The risk-measure-testing.md SS1.1 includes `test_risk_cvar_aggregate_cut_tied_costs` which documents the case where multiple openings have identical objective values. The expected behavior column explicitly states: "The allocation among tied openings is implementation-defined (any split that totals 1.0 is correct)." This is the correct approach: rather than picking an arbitrary tie-breaking rule and enshrining it as the required behavior, the test acknowledges that multiple correct answers exist and only constrains the total weight. Future test specs should use this pattern for any operation with legitimate multiple correct outputs.

### Multi-error validation tests are necessary

The HorizonMode testing spec (SS2) includes `test_horizon_validate_h1_h4_multiple_errors` specifically to test that the `validate` function reports all violations simultaneously rather than failing on the first. This was explicitly required in the trait spec ("Error accumulation" paragraph in SS2.4). However, without a dedicated test for this behavior, an implementation could satisfy all single-violation tests while still aborting after the first error. The lesson: any spec that documents "all violations are reported" must have a corresponding multi-violation test case.

---

## Convention Clarifications

### `SS` prefix vs `§` symbol

The project already had an established convention (from the spec-consistency-audit plan) that `§` is used exclusively for `src/specs/hpc/` files, and `SS` is used for `src/specs/interfaces/` and `src/specs/architecture/`. This epic confirmed the same convention applies to the new architecture trait specs. Every architecture-to-architecture cross-reference in all six files uses `SS`. No guardian finding was needed on this because the ticket pitfalls section explicitly warned against using `§` -- but it is worth recording because it is easy to import the wrong symbol when copying from communicator-trait.md (which uses `§`).

### Convention blockquote must be verbatim, not paraphrased

The "Convention: Rust traits as specification guidelines" blockquote from communicator-trait.md must appear verbatim (word-for-word) in every trait spec. This was an explicit acceptance criterion. All three trait specs pass this check. The blockquote starts at the `> **Convention:` line and ends at `This convention applies to all trait-bearing specification documents in src/specs/.` The wording must not be simplified or adapted to context. The testing specs do not include the blockquote (it belongs only in the trait spec, not the conformance test spec).

### The `validate` method signature for HorizonMode

The horizon-mode-trait.md makes a subtle decision about the `validate` method signature: it is a static/associated function that returns `Result<HorizonMode, Vec<ValidationError>>` rather than a method on `&self`. This is because `validate` is called before the `HorizonMode` value exists -- it constructs the value if validation passes. This contrasts with the RiskMeasure and SamplingScheme approaches where validation is performed on the config type (a separate type) and the runtime type is only created after validation. The HorizonMode merges config and runtime representation for simplicity. Future trait specs must decide which pattern to use: separate config/runtime types (RiskMeasure pattern) vs. single type with static `validate` constructor (HorizonMode pattern). Both are valid; the choice should be documented explicitly.

### Infallibility requires documenting the upstream guard

Whenever a method is documented as infallible (no `Result` return), the spec must cite the specific upstream validation section that provides the guarantee. All three trait specs do this correctly: aggregate_cut and evaluate_risk cite Extension Points SS6 (variant selection pipeline); successors, is_terminal, discount_factor cite H1-H4 enforcement at config load; sample_forward cites the validation rules S1-S4 and the preprocessing validation steps. This is not just style -- it is the contract that allows a future implementer to trust the infallibility claim without wondering "what if the input is malformed?"

---

## Recommendations for Subsequent Epics

### Epic 02: CutSelectionStrategy and StoppingRule

Both epics should follow the same paired structure: trait spec first, testing spec second, each as a separate ticket. The CutSelectionStrategy trait spec should note that the cut selection strategy interacts with the cut pool size (`max_cuts` parameter) and must be consistent with the cut pool management described in `src/specs/architecture/cut-management-impl.md` SS1. The StoppingRule trait spec has a subtlety: it must document the distinction between convergence of the upper bound sequence and convergence of the gap, both of which are used in `src/specs/math/stopping-rules.md`.

For both traits, the dispatch mechanism section should explicitly cross-reference the three existing enum dispatch sections in risk-measure-trait.md SS4, horizon-mode-trait.md SS4, and sampling-scheme-trait.md SS4 as sibling patterns. The wording can be briefer (the argument has been made three times already), pointing to those sections for the full rationale.

### Test count guidance

Acceptance criteria in epic-01 tickets specified minimum test counts (at least 6 `aggregate_cut` tests, at least 8 horizon conformance tests, at least 9 sampling conformance tests). The implemented files exceed these minimums: risk-measure-testing.md has 9 aggregate_cut tests, 8 evaluate_risk tests, 4 equivalence tests, 7 numerical property tests, and 6 validation tests. The minimum counts in acceptance criteria should be treated as floors, not targets. For algorithm-heavy traits like CutSelectionStrategy, the test count will naturally be higher.

### Fixture complexity scales with trait complexity

The shared fixture for risk-measure-testing.md is a simple 3-opening table (18 cells). The horizon-mode-testing.md uses two named fixtures (Fixture A and Fixture B) with JSON configuration blocks. The sampling-scheme-testing.md requires a full PAR parameter table, an opening tree matrix (25 rows), an external scenario matrix (9 rows), and noise inversion reference calculations. Each successive trait required a more complex fixture because the contracts depended on more infrastructure. For StoppingRule, the fixture will need to define a convergence sequence (iterations, upper bounds, lower bounds) rather than static numerical data. Plan for this fixture complexity upfront in the ticket specification.

### Forward-backward separation pattern is domain-specific

The SamplingScheme trait's SS5 "Forward-Backward Separation Invariant" section is a pattern that applies specifically to SDDP algorithm abstractions where two phases (forward and backward) could inadvertently share state. The CutSelectionStrategy has a similar concern: the strategy must not influence the backward pass cut generation, only the cut pool eviction/selection for the forward pass LP. Future trait specs for algorithm abstraction points should evaluate whether a similar invariant section is needed.

### Sibling cross-references in cross-sections

By the time sampling-scheme-trait.md was written, it could cross-reference risk-measure-trait.md and horizon-mode-trait.md as "sibling trait specifications following the same enum dispatch pattern." This pattern of sibling references is useful for readers navigating a family of related specs. For epic-02, the CutSelectionStrategy and StoppingRule trait specs should cross-reference all three epic-01 specs as established sibling patterns in the Cross-References section.
