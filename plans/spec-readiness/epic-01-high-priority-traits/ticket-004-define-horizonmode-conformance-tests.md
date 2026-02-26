# ticket-004 Define HorizonMode Conformance Test Spec

## Context

### Background

After the HorizonMode trait spec (ticket-003) defines the behavioral contract, a conformance test specification is needed. The HorizonMode trait has two variants (Finite, Cyclic) with different behaviors for successor computation, terminal detection, discount factors, and validation. Test cases must cover both variants and the validation rules H1-H4 from extension-points.md SS4.3.

### Relation to Epic

Fourth ticket in Epic 01. Depends on ticket-003 (the trait spec it tests against).

### Current State

- `src/specs/hpc/backend-testing.md` is the gold standard for conformance test specs
- No conformance test spec exists for horizon modes
- Test cases are derivable from the policy graph examples in infinite-horizon.md SS3 (60-stage cyclic graph with back-edge from stage 59 to 48) and extension-points.md SS4.2 (finite and cyclic config examples)

## Specification

### Requirements

Create a new file `src/specs/architecture/horizon-mode-testing.md` with the following structure:

1. **Title**: `# Horizon Mode Testing and Conformance`
2. **Purpose paragraph**
3. **SS1. Conformance Test Suite**: Requirements tables for all four methods across both variants:
   - `successors` for Finite variant (linear chain, each stage has exactly one successor except terminal)
   - `successors` for Cyclic variant (back-edge transition returns to cycle start)
   - `is_terminal` for Finite variant (true at terminal stage, false elsewhere)
   - `is_terminal` for Cyclic variant (always false)
   - `discount_factor` for both variants (from annual_discount_rate)
   - Edge cases: single-stage Finite, 1-stage cycle, undiscounted Finite (rate=0)
4. **SS2. Validation Tests**: Requirements tables for rules H1-H4:
   - H1: empty stage set -> error
   - H2: cumulative cycle discount >= 1 -> error
   - H3: cycle start stage out of bounds -> error
   - H4: dangling transition target -> error
5. **SS3. Forward Pass Termination Tests**: For Cyclic variant, verify that forward pass terminates under the two conditions (discount threshold, max_horizon_length)
6. **Cross-References** section

### Content Guidelines

- Use small example policy graphs (3-5 stages for Finite, 12 stages with back-edge for Cyclic)
- Expected values must be concrete: "successors(stage 2) returns [(3, 1.0, 0.995)]" not "returns the next stage"
- Reference horizon-mode-trait.md (ticket-003) for the contracts being tested
- Follow the backend-testing.md table format

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then there are at least 8 conformance tests covering all four methods across both variants
- [ ] Given the validation tests in SS2, when reading them, then all four rules H1-H4 have at least one test case each
- [ ] Given any test in the tables, when reading Expected Observable Behavior, then the values are concrete (specific stage IDs, specific discount factors)
- [ ] Given the Cyclic variant tests, when reading them, then at least one test uses the infinite-horizon.md SS3 example (60 stages, back-edge 59->48)

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/backend-testing.md` for the table format
2. Read `src/specs/architecture/horizon-mode-trait.md` (ticket-003) for the method contracts
3. Design small policy graphs: a 3-stage Finite, a 12-stage Cyclic with one back-edge
4. Compute expected successors, terminal status, and discount factors by hand
5. Write validation rejection tests for each rule

### Key Files to Modify

- **Create**: `src/specs/architecture/horizon-mode-testing.md`

### Patterns to Follow

- Same table format as backend-testing.md and risk-measure-testing.md (ticket-002)

### Pitfalls to Avoid

- Do NOT include executable test code
- Do NOT use large policy graphs (keep them 3-12 stages for hand-computability)
- Do NOT test DECOMP or complete tree mode (deferred features)

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-003 (HorizonMode trait spec must exist first)
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: High
