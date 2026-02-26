# ticket-008 Define CutSelectionStrategy Conformance Test Spec

## Context

### Background

After the CutSelectionStrategy trait spec (ticket-007) defines the behavioral contract, a conformance test specification is needed. The three variants have different aggressiveness levels and tracking data requirements. Test cases must verify correct deactivation logic and the convergence guarantee property.

### Relation to Epic

Second ticket in Epic 02. Depends on ticket-007.

### Current State

- `src/specs/hpc/backend-testing.md` is the gold standard for conformance test specs
- No conformance test spec exists for cut selection
- Test cases are derivable from small cut pools (5-10 cuts) with known activity histories

## Specification

### Requirements

Create a new file `src/specs/architecture/cut-selection-testing.md` with the following structure:

1. **Title**: `# Cut Selection Testing and Conformance`
2. **Purpose paragraph**
3. **SS1. Conformance Test Suite**: Requirements tables for each variant:
   - Level1: cuts with active_count=0 are deactivated; cuts with active_count>0 are retained
   - LML1: cuts with last_active_iter older than memory_window are deactivated; recent cuts retained
   - Dominated: cuts dominated at all visited states are deactivated; non-dominated cuts retained
   - `should_run`: verify it returns true only on iterations divisible by check_frequency
   - `update_activity`: verify tracking data is updated correctly for binding cuts
   - Edge cases: all cuts active (no deactivation), all cuts inactive, single cut in pool, check_frequency=1
4. **SS2. Aggressiveness Ordering Tests**: Verify Level1 <= LML1 <= Dominated in terms of cuts deactivated (on the same pool state)
5. **SS3. Convergence Property Tests**: Verify that Level1 and LML1 never deactivate a cut that is binding at the current iteration
6. **Cross-References** section

### Content Guidelines

- Use small cut pools (5 cuts, 3 visited states) for hand-computability
- For Dominated variant tests, provide explicit cut coefficients and visited states so that domination can be verified by hand
- The aggressiveness ordering test (SS2) is important: given the same cut pool, Level1 deactivates the fewest cuts and Dominated the most

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then there are at least 10 conformance tests across all three variants
- [ ] Given the Dominated variant tests, when reading them, then they include explicit cut coefficients and visited state values
- [ ] Given SS2, when reading the aggressiveness ordering tests, then they verify Level1 <= LML1 <= Dominated on the same pool
- [ ] Given SS3, when reading convergence property tests, then they verify no binding cut is deactivated by Level1 or LML1
- [ ] Given any test, when reading Expected Observable Behavior, then values are concrete (specific cut indices deactivated/retained)

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/backend-testing.md` for format
2. Read `src/specs/architecture/cut-selection-trait.md` (ticket-007) for contracts
3. Design a 5-cut pool example with known activity histories and cut coefficients
4. Compute deactivation sets for each strategy by hand

### Key Files to Modify

- **Create**: `src/specs/architecture/cut-selection-testing.md`

### Patterns to Follow

- Same table format as the other testing specs

### Pitfalls to Avoid

- Do NOT include executable test code
- Do NOT create test cases requiring matrix computation (keep domination checks simple: 2-3 visited states, 5 cuts)
- Do NOT test cut serialization (that is a separate concern)

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-007
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: High
