# ticket-001 Define RiskMeasure Trait Spec

## Context

### Background

The Cobre SDDP training loop is parameterized by four abstraction points, one of which is the **risk measure**. The risk measure determines how backward pass outcomes are aggregated into a single cut. Two variants exist: Expectation (risk-neutral, probability-weighted average) and CVaR (convex combination of expectation and Conditional Value-at-Risk). The mathematical definitions are in `risk-measures.md`; the behavioral contract is informally described in `extension-points.md` SS2.4; the cut aggregation mechanics are in `cut-management.md` SS3 and `risk-measures.md` SS7. The risk measure varies per stage (configured in `stages.json`), which rules out compile-time monomorphization -- enum dispatch is the recommended approach per `extension-points.md` SS7.

This ticket formalizes the RiskMeasure trait as a specification document following the `communicator-trait.md` pattern, adapted for enum-dispatch algorithm variants.

### Relation to Epic

First ticket in Epic 01 (High-Priority Trait Formalization). The conformance test spec (ticket-002) depends on this trait spec.

### Current State

- `src/specs/architecture/extension-points.md` SS2.4 describes the behavioral contract informally: two operations (cut aggregation, risk evaluation)
- `src/specs/math/risk-measures.md` provides the complete mathematical definitions (CVaR SS2, convex combination SS3, dual representation SS4, cut generation with risk measures SS7, per-stage profiles SS8)
- `src/specs/math/cut-management.md` SS3 defines single-cut aggregation (risk-neutral case)
- `src/specs/architecture/cut-management-impl.md` SS1 describes the FCF runtime structure
- No formal trait definition exists yet

## Specification

### Requirements

Create a new file `src/specs/architecture/risk-measure-trait.md` with the following structure:

1. **Title**: `# Risk Measure Trait`
2. **Purpose paragraph**: One paragraph defining the trait's role in the SDDP training loop
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md` (the "Convention: Rust traits as specification guidelines" blockquote)
4. **SS1. Trait Definition**: Enum-based trait with two variants (Expectation, CVaR)
5. **SS2. Method Contracts**: Two methods with preconditions/postconditions tables:
   - `aggregate_cut(outcomes, probabilities) -> (intercept, coefficients)` -- Given per-opening backward pass results and opening probabilities, produce aggregated cut coefficients using risk-adjusted weights
   - `evaluate_risk(costs, probabilities) -> f64` -- Given a vector of cost values and probabilities, compute the risk-adjusted scalar (used for convergence bound computation)
6. **SS3. Supporting Types**: `RiskMeasureConfig` enum matching the `stages.json` schema (`"expectation"` or `{"cvar": {"alpha": ..., "lambda": ...}}`)
7. **SS4. Dispatch Mechanism**: Enum dispatch (match on variant at each call site). Reference extension-points.md SS7 discussion. Explain why per-stage variation makes generic dispatch impractical.
8. **SS5. Validation Rules**: Reproduce rules R1-R3 from extension-points.md SS2.3 with cross-references
9. **SS6. Special Cases**: Document the three special cases from risk-measures.md SS7 (risk-neutral lambda=0, pure CVaR lambda=1, convex combination 0<lambda<1)
10. **Cross-References** section

### Content Guidelines

- The **math spec is source of truth**. The trait spec codifies the behavioral interface; it must not contradict risk-measures.md or cut-management.md
- Method signatures in the trait definition should be Rust-style but are guidelines (per the convention blockquote)
- Each method contract must have Preconditions and Postconditions tables following the communicator-trait.md format
- The risk-adjusted weight computation (sorting-based greedy allocation from risk-measures.md SS7) should be described as a behavioral contract, not as implementation steps
- Document that `aggregate_cut` replaces probability weights $p(\omega)$ with risk-adjusted weights $\mu^*_\omega$ -- this is the ONLY difference from risk-neutral aggregation
- Reference the lower bound validity warning from risk-measures.md SS10

### Error Handling

Define a `RiskMeasureError` type or specify that risk measure operations are infallible (they operate on validated inputs -- validation happens at config load time per extension-points.md SS6).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/risk-measure-trait.md` exists, when reading it, then it contains: Purpose, convention blockquote, SS1-SS6, and Cross-References sections
- [ ] Given the convention blockquote, when comparing to `communicator-trait.md`, then it is verbatim identical (word-for-word copy)
- [ ] Given the trait definition in SS1, when comparing to `extension-points.md` SS2.4, then the two operations (cut aggregation, risk evaluation) are present as methods
- [ ] Given the method contracts in SS2, when reading `aggregate_cut`, then it has Preconditions and Postconditions tables in the communicator-trait.md format
- [ ] Given the method contracts in SS2, when reading `evaluate_risk`, then it has Preconditions and Postconditions tables
- [ ] Given the dispatch mechanism in SS4, when reading it, then it explains enum dispatch and references extension-points.md SS7
- [ ] Given the cross-references section, when checking each link, then all links point to existing sections in existing files

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/communicator-trait.md` to internalize the structure (Purpose, convention blockquote, numbered sections with method contracts, Cross-References)
2. Read `src/specs/math/risk-measures.md` SS1-SS7 for the mathematical definitions
3. Read `src/specs/architecture/extension-points.md` SS2 for the behavioral contract and SS7 for the dispatch mechanism discussion
4. Read `src/specs/math/cut-management.md` SS3 for single-cut aggregation (the risk-neutral baseline that the risk measure modifies)
5. Write the trait spec adapting the communicator-trait.md structure for an enum-dispatch algorithm variant

### Key Files to Modify

- **Create**: `src/specs/architecture/risk-measure-trait.md`

### Patterns to Follow

- **Convention blockquote**: Copy verbatim from communicator-trait.md (lines 7)
- **Method contract format**: Two tables per method (Preconditions / Postconditions) + prose for determinism, error semantics, thread safety -- as in communicator-trait.md SS2.1-SS2.5
- **Section numbering**: Use `## 1.`, `## 2.` etc. (these are in `src/specs/architecture/` so the section symbol is implicit; do NOT use `§` which is reserved for `src/specs/hpc/`)
- **Cross-reference format**: architecture-to-math: `[Target Name](../math/file.md)`; architecture-to-architecture: `[Target Name](./file.md)`

### Pitfalls to Avoid

- Do NOT use `§` symbol -- this file is in `src/specs/architecture/`, not `src/specs/hpc/`
- Do NOT define new mathematical formulas -- reference the math specs instead
- Do NOT add executable code examples beyond the trait definition and enum definition
- Do NOT change the existing extension-points.md content
- Do NOT add multi-cut formulation (it is a deferred feature per extension-points.md SS3)

## Testing Requirements

### Unit Tests

Not applicable -- this is a specification document, not code.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-002 (conformance test spec depends on this trait spec)

## Effort Estimate

**Points**: 3
**Confidence**: High
