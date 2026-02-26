# ticket-010 Define StoppingRule Conformance Test Spec

## Context

### Background

After the StoppingRule trait spec (ticket-009) defines the behavioral contract, a conformance test specification is needed. The stopping rule system has two layers to test: individual rule evaluation and composition logic (OR/AND). The simulation-based rule is the most complex, requiring a two-phase evaluation with Monte Carlo simulations.

### Relation to Epic

Fourth and final ticket in Epic 02. Depends on ticket-009.

### Current State

- `src/specs/hpc/backend-testing.md` is the gold standard
- No conformance test spec exists for stopping rules
- Test cases are derivable from the formulas in stopping-rules.md (all have closed-form evaluation conditions)

## Specification

### Requirements

Create a new file `src/specs/architecture/stopping-rule-testing.md` with the following structure:

1. **Title**: `# Stopping Rule Testing and Conformance`
2. **Purpose paragraph**
3. **SS1. Individual Rule Conformance Tests**: Requirements tables for each of the 5 rules:
   - Iteration limit: triggers at exactly limit, does not trigger at limit-1
   - Time limit: triggers when elapsed >= seconds
   - Bound stalling: provide a sequence of lower bounds and verify trigger/no-trigger against tolerance
   - Simulation-based: verify the two-phase evaluation (bound stability gate, then simulation distance)
   - Graceful shutdown: verify trigger when signal flag is set, no trigger when not set
   - Edge cases: limit=1 (triggers immediately), tolerance=0 (never triggers for improving bounds), period=1 for simulation
4. **SS2. Composition Tests**: Requirements tables for OR/AND logic:
   - OR mode: verify that a single triggered rule causes stop
   - OR mode: verify that the FIRST triggered rule is reported as reason
   - AND mode: verify that all rules must trigger (one rule not triggering prevents stop)
   - AND mode: verify that the stop reason lists all rules
   - Mixed: iteration limit (triggered) + bound stalling (not triggered) in AND mode -> no stop
   - Mixed: iteration limit (triggered) + bound stalling (not triggered) in OR mode -> stop (reason: iteration_limit)
5. **SS3. Bound Stalling Numerical Tests**: Provide specific bound sequences and verify the windowed relative improvement calculation:
   - Monotonically increasing bounds with decreasing increments -> triggers when increment < tolerance
   - Flat bounds -> triggers immediately after window passes
   - Oscillating bounds -> does not trigger (relative improvement exceeds tolerance in some direction)
6. **Cross-References** section

### Content Guidelines

- Use concrete numeric sequences for bound stalling tests (e.g., LB = [100, 105, 108, 110, 111, 111.05, 111.08] with tolerance=0.001 and window=5)
- For composition tests, use simple rules (iteration limit + time limit) that are easy to reason about
- The simulation-based rule tests can use mock simulation results (no need for actual Monte Carlo -- specify the distance metric inputs and expected evaluation)
- All expected behaviors must be concrete (triggers/does not trigger, reported reason)

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then all 5 individual rules have at least 2 test cases each (trigger and no-trigger)
- [ ] Given SS2, when reading composition tests, then both OR and AND modes have at least 3 test cases each
- [ ] Given SS3, when reading bound stalling numerical tests, then at least 3 bound sequences are provided with hand-computable expected results
- [ ] Given any test, when reading Expected Observable Behavior, then it specifies either "triggers" or "does not trigger" plus the reported reason
- [ ] Given the composition tests, when reading them, then at least one test has mixed triggered/not-triggered rules in both AND and OR modes

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/backend-testing.md` for format
2. Read `src/specs/architecture/stopping-rule-trait.md` (ticket-009) for contracts
3. Design bound stalling sequences that are easy to verify by hand
4. Design composition test cases with 2-3 rules in both OR and AND modes

### Key Files to Modify

- **Create**: `src/specs/architecture/stopping-rule-testing.md`

### Patterns to Follow

- Same table format as the other testing specs

### Pitfalls to Avoid

- Do NOT include executable test code
- Do NOT test the convergence monitor itself (only test the stopping rules in isolation)
- Do NOT test the training log format
- Keep bound stalling sequences short (5-10 iterations)

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-009
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: High
