# ticket-009 Define StoppingRule Trait Spec

## Context

### Background

The stopping rule abstraction determines when SDDP training terminates. Five rules exist: iteration limit (mandatory safety bound), time limit, bound stalling, simulation-based, and graceful shutdown (OS signal). Rules compose via `stopping_mode`: `"any"` (OR logic -- first rule to trigger causes termination) or `"all"` (AND logic -- all must trigger). The mathematical definitions are in `stopping-rules.md`; the convergence monitor architecture is in `convergence-monitoring.md` SS1-SS2.

The key design insight is that stopping rules are **composable**: the convergence monitor evaluates all configured rules each iteration and applies the composition logic. This is fundamentally different from the other traits (which are single-variant selections).

### Relation to Epic

Third ticket in Epic 02. The conformance test spec (ticket-010) depends on this. Independent of tickets 007-008 (CutSelectionStrategy).

### Current State

- `src/specs/math/stopping-rules.md` defines all 5 rules mathematically (iteration limit SS2, time limit SS3, bound stalling SS4, simulation-based SS5, combination logic SS6)
- `src/specs/architecture/convergence-monitoring.md` SS1 lists the rules and SS2 describes the convergence monitor
- No formal trait definition exists

## Specification

### Requirements

Create a new file `src/specs/architecture/stopping-rule-trait.md` with the following structure:

1. **Title**: `# Stopping Rule Trait`
2. **Purpose paragraph**
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md`
4. **SS1. Trait Definition**: The stopping rule abstraction has two layers:
   - **Individual rules**: Enum with 5 variants (IterationLimit, TimeLimit, BoundStalling, SimulationBased, GracefulShutdown), each with its configuration parameters
   - **Composition**: A `StoppingRuleSet` that holds a list of individual rules plus the `stopping_mode` ("any" or "all")
5. **SS2. Individual Rule Contracts**: For each of the 5 rules, define:
   - `evaluate(monitor_state) -> bool` -- Whether this rule triggers given the current convergence monitor state
   - Preconditions and postconditions tables per rule
   - The iteration limit rule evaluates `k >= limit`
   - The time limit rule evaluates `elapsed >= seconds`
   - The bound stalling rule evaluates the windowed relative improvement formula from stopping-rules.md SS4
   - The simulation-based rule has a two-phase evaluation (bound stability first, then simulation comparison) per stopping-rules.md SS5
   - The graceful shutdown rule checks an external signal flag
6. **SS3. Composition Contract**: The `StoppingRuleSet.should_stop(monitor_state) -> (bool, reason)` method:
   - Mode "any": returns true when ANY individual rule evaluates to true (OR logic)
   - Mode "all": returns true when ALL individual rules evaluate to true (AND logic)
   - Returns the triggering rule(s) as the reason
7. **SS4. Supporting Types**: `StoppingRuleConfig` matching the JSON schema from stopping-rules.md, `StopReason` enum
8. **SS5. Interaction with Convergence Monitor**: Document how the convergence monitor calls `should_stop` each iteration and which tracked quantities each rule reads (convergence-monitoring.md SS2.1)
9. **SS6. Risk-Averse Considerations**: Document the notes from stopping-rules.md SS4 and SS5 about bound interpretation under CVaR
10. **Cross-References** section

### Content Guidelines

- The **composition logic** (OR/AND) is the unique aspect of this trait compared to the other enum-dispatch traits
- The simulation-based rule is the most complex: it has a `period` (not checked every iteration), a two-phase evaluation, and it runs Monte Carlo simulations
- Document that the iteration limit is mandatory (must always be included as a safety bound)
- The graceful shutdown rule is signal-based, not configuration-driven

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then both layers (individual rules and composition) are defined
- [ ] Given SS2, when reading individual rule contracts, then all 5 rules have evaluate methods with preconditions/postconditions
- [ ] Given SS3, when reading the composition contract, then both "any" and "all" modes are specified
- [ ] Given the bound stalling rule in SS2, when reading its formula, then it matches stopping-rules.md SS4
- [ ] Given the simulation-based rule in SS2, when reading it, then the two-phase evaluation (bound stability + simulation comparison) is documented
- [ ] Given SS6, when reading risk-averse considerations, then it references risk-measures.md SS10

## Implementation Guide

### Suggested Approach

1. Read `src/specs/math/stopping-rules.md` for all 5 rules
2. Read `src/specs/architecture/convergence-monitoring.md` SS1-SS2 for the monitor architecture
3. Read `src/specs/hpc/communicator-trait.md` for the structural pattern
4. Design the two-layer abstraction (individual rules + composition set)

### Key Files to Modify

- **Create**: `src/specs/architecture/stopping-rule-trait.md`

### Patterns to Follow

- Same structural pattern as the other trait specs, but with the unique two-layer design (individual rules + composition)

### Pitfalls to Avoid

- Do NOT conflate the stopping rule trait with the convergence monitor (the monitor USES the rules, it IS NOT a stopping rule)
- Do NOT add new stopping rules beyond the 5 defined
- Do NOT define the training log format (that is convergence-monitoring.md territory)
- The simulation-based rule's Monte Carlo simulation is a runtime operation, not a pure evaluation -- document this distinction

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-010 (conformance test spec)

## Effort Estimate

**Points**: 3
**Confidence**: High
