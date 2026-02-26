# ticket-006 Define SamplingScheme Conformance Test Spec

## Context

### Background

After the SamplingScheme trait spec (ticket-005) defines the behavioral contract, a conformance test specification is needed. The SamplingScheme trait has three variants (InSample, External, Historical), and the critical invariant to test is the forward-backward separation: the backward pass always uses the fixed opening tree regardless of the forward sampling scheme.

### Relation to Epic

Sixth and final ticket in Epic 01. Depends on ticket-005.

### Current State

- `src/specs/hpc/backend-testing.md` is the gold standard
- No conformance test spec exists for sampling schemes
- Test cases are derivable from the scenario-generation.md examples (opening tree generation, noise inversion)

## Specification

### Requirements

Create a new file `src/specs/architecture/sampling-scheme-testing.md` with the following structure:

1. **Title**: `# Sampling Scheme Testing and Conformance`
2. **Purpose paragraph**
3. **SS1. Conformance Test Suite**: Requirements tables for each method across all three variants:
   - `sample_forward` for InSample (returns a noise vector from the opening tree at a random index)
   - `sample_forward` for External (returns a noise vector from external data, after noise inversion)
   - `sample_forward` for Historical (returns a noise vector from historical data, mapped to stages)
   - `requires_noise_inversion` (false for InSample, true for External and Historical)
   - `backward_tree_source` (all three return fixed opening tree, but with different PAR fitting sources)
   - Edge cases: single opening, single stage, external scenarios with selection_mode="sequential"
4. **SS2. Forward-Backward Separation Tests**: Verify that changing the sampling scheme does NOT affect the backward pass noise vectors
5. **SS3. Reproducibility Tests**: Verify that InSample with the same seed produces identical forward scenarios across runs
6. **SS4. Validation Tests**: Tests for rules S1-S4 (missing seed, missing files, invalid selection mode)
7. **Cross-References** section

### Content Guidelines

- Use small scenarios (3 stages, 2 hydros, 5 openings) for hand-computability
- The forward-backward separation test (SS2) is the highest-priority test
- InSample reproducibility tests should verify that seed derivation produces the same noise regardless of MPI rank assignment
- External variant tests should verify noise inversion produces correct implied noise values for known inputs

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then there are at least 9 conformance tests covering all three variants and methods
- [ ] Given SS2, when reading the forward-backward separation tests, then at least one test verifies that switching from InSample to External does not change backward pass noise
- [ ] Given SS3, when reading reproducibility tests, then at least one test verifies seed-based reproducibility for InSample
- [ ] Given SS4, when reading validation tests, then all four rules S1-S4 have test cases
- [ ] Given any test, when reading Expected Observable Behavior, then values are concrete

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/backend-testing.md` for format
2. Read `src/specs/architecture/sampling-scheme-trait.md` (ticket-005) for contracts
3. Design small test scenarios with known noise vectors
4. Write forward-backward separation tests as the highest priority section

### Key Files to Modify

- **Create**: `src/specs/architecture/sampling-scheme-testing.md`

### Patterns to Follow

- Same table format as backend-testing.md and the other testing specs in this epic

### Pitfalls to Avoid

- Do NOT test backward sampling schemes (only Complete is implemented, Monte Carlo backward is deferred)
- Do NOT include PAR model fitting correctness tests (those belong in a stochastic crate testing spec)
- Do NOT include executable test code

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-005 (SamplingScheme trait spec must exist first)
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: High
