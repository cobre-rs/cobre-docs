# ticket-003 Define HorizonMode Trait Spec

## Context

### Background

The horizon mode is the second algorithm abstraction point in the SDDP training loop. It determines stage traversal, terminal conditions, and discount factors. Two variants exist: Finite (linear chain, terminal value V\_{T+1}=0) and Cyclic (at least one back-edge transition, discount required for convergence). The mathematical definitions are in `infinite-horizon.md`; the behavioral contract is informally described in `extension-points.md` SS4.4; the policy graph structure is in `sddp-algorithm.md` SS4.

This ticket formalizes the HorizonMode trait as a specification document following the `communicator-trait.md` pattern, adapted for enum-dispatch.

### Relation to Epic

Third ticket in Epic 01. The conformance test spec (ticket-004) depends on this trait spec. Independent of tickets 001-002 (RiskMeasure).

### Current State

- `src/specs/architecture/extension-points.md` SS4.4 describes the behavioral contract: four operations (successor computation, terminal detection, discount factor, validation)
- `src/specs/math/infinite-horizon.md` provides the cyclic policy graph math (periodic structure SS2, cyclic graph SS3, discount requirement SS4, cut sharing SS5, forward pass SS6, backward pass SS7)
- `src/specs/math/sddp-algorithm.md` SS4 describes policy graph topologies
- `src/specs/math/discount-rate.md` provides discount factor mechanics
- No formal trait definition exists yet

## Specification

### Requirements

Create a new file `src/specs/architecture/horizon-mode-trait.md` with the following structure:

1. **Title**: `# Horizon Mode Trait`
2. **Purpose paragraph**: One paragraph defining the trait's role in controlling stage traversal
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md`
4. **SS1. Trait Definition**: Enum-based trait with two variants (Finite, Cyclic), each carrying its configuration data
5. **SS2. Method Contracts**: Four methods with preconditions/postconditions tables:
   - `successors(stage_id) -> Vec<(stage_id, probability, discount_factor)>` -- Return successor stages with transition probabilities and discount factors
   - `is_terminal(stage_id) -> bool` -- Whether a stage has no successors (always false for Cyclic)
   - `discount_factor(source, target) -> f64` -- The per-transition discount factor
   - `validate(stages) -> Result<(), ValidationError>` -- Verify configuration validity (rules H1-H4 from extension-points.md SS4.3)
6. **SS3. Supporting Types**: `PolicyGraphConfig` matching the `stages.json` schema
7. **SS4. Dispatch Mechanism**: Enum dispatch. Horizon mode is global (one per run), so the variant is resolved once at initialization. The enum is matched at each call site (forward pass stage transition, backward pass traversal order).
8. **SS5. Forward Pass Termination**: Document the cycle termination logic from infinite-horizon.md SS6 (cumulative discount below threshold or max_horizon_length safety bound)
9. **SS6. Cut Pool Organization**: Document that Cyclic mode organizes cuts by season (not by absolute stage ID) per infinite-horizon.md SS5
10. **Cross-References** section

### Content Guidelines

- The **math spec is source of truth**. Reference infinite-horizon.md for all mathematical definitions.
- The `successors()` method must return transitions from the `policy_graph.transitions` array in `stages.json`
- For Cyclic mode, the back-edge transition is the one where `source_id > target_id` (or equal)
- The cycle discount validation (H2: cumulative cycle discount < 1) is critical for convergence
- Document that the Finite variant's `discount_factor` comes from `annual_discount_rate` (may be 1.0 if undiscounted)

### Error Handling

Validation errors use the existing validation architecture. The `validate()` method returns a structured error for each violated rule (H1-H4).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/horizon-mode-trait.md` exists, when reading it, then it contains: Purpose, convention blockquote, SS1-SS6, and Cross-References sections
- [ ] Given the trait definition in SS1, when comparing to `extension-points.md` SS4.4, then the four operations (successors, terminal detection, discount factor, validation) are present as methods
- [ ] Given the method contracts in SS2, when reading `successors`, then it has Preconditions and Postconditions tables
- [ ] Given the Cyclic variant, when reading the forward pass termination description in SS5, then it references the two termination conditions from infinite-horizon.md SS6
- [ ] Given the cut pool organization in SS6, when reading it, then it explains season-based organization for Cyclic mode per infinite-horizon.md SS5
- [ ] Given the validation rules in SS5 (method contract), when comparing to extension-points.md SS4.3, then rules H1-H4 are all present

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/communicator-trait.md` for the structural pattern
2. Read `src/specs/math/infinite-horizon.md` for the complete Cyclic mode math
3. Read `src/specs/architecture/extension-points.md` SS4 for the behavioral contract
4. Read `src/specs/math/discount-rate.md` for discount factor mechanics
5. Write the trait spec with the four methods, focusing on the Cyclic variant's complexity

### Key Files to Modify

- **Create**: `src/specs/architecture/horizon-mode-trait.md`

### Patterns to Follow

- Same structural pattern as communicator-trait.md and risk-measure-trait.md (ticket-001)
- Method contract format: Preconditions / Postconditions tables + prose

### Pitfalls to Avoid

- Do NOT use `§` symbol (file is in `src/specs/architecture/`)
- Do NOT redefine the periodic structure math from infinite-horizon.md -- reference it
- Do NOT add DECOMP special case or complete tree mode (deferred features)
- The Finite variant is simpler but must still have complete method contracts

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-004 (conformance test spec depends on this trait spec)

## Effort Estimate

**Points**: 3
**Confidence**: High
