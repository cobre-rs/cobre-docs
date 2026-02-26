# ticket-002 Define RiskMeasure Conformance Test Spec

## Context

### Background

After the RiskMeasure trait spec (ticket-001) defines the behavioral contract, a conformance test specification is needed to verify that implementations correctly satisfy the contract. The conformance test spec follows the `backend-testing.md` pattern: requirements tables with columns (Test Name | Input | Expected Observable Behavior), no executable code. The test spec covers both variants (Expectation, CVaR), edge cases (lambda=0 reducing to expectation, alpha=1 reducing to expectation), and the mathematical invariants from `risk-measures.md`.

### Relation to Epic

Second ticket in Epic 01. Depends on ticket-001 (the trait spec it tests against).

### Current State

- `src/specs/hpc/backend-testing.md` is the gold standard for conformance test specs (4 sections: conformance, interchangeability, performance, determinism)
- No conformance test spec exists for risk measures
- The mathematical test cases are derivable from `risk-measures.md` SS7 (the sorting-based greedy allocation has deterministic, hand-computable results for small input sets)

## Specification

### Requirements

Create a new file `src/specs/architecture/risk-measure-testing.md` with the following structure:

1. **Title**: `# Risk Measure Testing and Conformance`
2. **Purpose paragraph**: Define the conformance test suite for the RiskMeasure trait, verifying that both variants produce correct cut aggregation weights and risk evaluation values
3. **SS1. Conformance Test Suite**: Requirements tables for both methods across both variants:
   - `aggregate_cut` with Expectation variant (uniform weights, reduces to cut-management.md SS3)
   - `aggregate_cut` with CVaR variant (risk-adjusted weights from sorting-based greedy allocation)
   - `evaluate_risk` with Expectation variant (weighted mean)
   - `evaluate_risk` with CVaR variant (convex combination of expectation and CVaR)
   - Edge cases: lambda=0 (expectation), lambda=1 (pure CVaR), alpha=1 (CVaR = expectation), alpha approaching 0 (extreme risk aversion), single opening (trivial aggregation)
4. **SS2. Variant Equivalence Tests**: Verify that risk-neutral settings produce identical results to the baseline (cut-management.md SS3 aggregation)
5. **SS3. Numerical Properties**: Tests for the mathematical invariants:
   - Risk-adjusted weights sum to 1.0
   - Risk-adjusted weights are non-negative
   - Each weight is at most $\bar{\mu}_\omega = (1-\lambda) p_\omega + \lambda p_\omega / \alpha$
   - Descending cost order means descending weight assignment (highest cost gets highest weight up to its cap)
6. **Cross-References** section

### Content Guidelines

- **Test naming convention**: `test_risk_{variant}_{method}_{scenario}` where `{variant}` is `expectation` or `cvar` and `{method}` is `aggregate_cut` or `evaluate_risk`
- Requirements tables have 4 columns: Test Name | Input Scenario | Expected Observable Behavior | Variant
- All test cases must have hand-computable expected values (small input sets: 3-5 openings)
- Do NOT include executable code (assert statements, function calls, etc.)
- Reference specific sections of `risk-measure-trait.md` for the contracts being tested

### Error Handling

Include tests for validation rejection of invalid parameters (alpha=0, lambda<0, lambda>1) per extension-points.md SS2.3 rules R1-R3.

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/risk-measure-testing.md` exists, when reading it, then it contains: Purpose, SS1-SS3, and Cross-References sections
- [ ] Given the conformance test table in SS1, when counting aggregate_cut tests, then there are at least 6 tests covering both variants plus edge cases
- [ ] Given the conformance test table in SS1, when counting evaluate_risk tests, then there are at least 4 tests covering both variants plus edge cases
- [ ] Given any test in the conformance table, when reading the Expected Observable Behavior column, then the expected values are concrete numbers (not formulas or "correct result")
- [ ] Given the numerical properties tests in SS3, when reading them, then they verify: weights sum to 1, weights non-negative, weights bounded by $\bar{\mu}_\omega$
- [ ] Given the test naming convention, when reading any test name, then it follows the `test_risk_{variant}_{method}_{scenario}` pattern

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/backend-testing.md` SS1 to internalize the requirements table format (4 columns, no executable code)
2. Read the trait spec created in ticket-001 (`src/specs/architecture/risk-measure-trait.md`) for the method contracts
3. Read `src/specs/math/risk-measures.md` SS7 to derive hand-computable test cases
4. Derive small examples:
   - 3 openings with uniform probability 1/3, costs [100, 200, 300], lambda=0.5, alpha=0.5
   - Hand-compute the greedy allocation: upper bounds $\bar{\mu}_\omega$, sorted by cost descending, allocate
   - The expected aggregated intercept and coefficients follow from the weights
5. Write the test spec with concrete numeric expectations

### Key Files to Modify

- **Create**: `src/specs/architecture/risk-measure-testing.md`

### Patterns to Follow

- **Requirements table format**: Directly from `backend-testing.md` -- columns are Test Name | Ranks (or Variant) | Input Scenario | Expected Observable Behavior
- **No executable code**: The spec describes WHAT to test, not HOW to implement the test
- **Concrete expected values**: Every test must have a computable expected outcome, not just "correct" or "valid"

### Pitfalls to Avoid

- Do NOT include Rust assert macros or test function signatures
- Do NOT define large test cases (>5 openings) -- keep them hand-computable
- Do NOT duplicate the mathematical derivation from risk-measures.md -- reference it
- Do NOT test the dispatch mechanism (that is an implementation concern, not a conformance requirement)

## Testing Requirements

### Unit Tests

Not applicable -- this is a specification document.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (RiskMeasure trait spec must exist first)
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 3
**Confidence**: High
