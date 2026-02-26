# ticket-007 Define CutSelectionStrategy Trait Spec

## Context

### Background

Cut selection controls how the cut pool is pruned to maintain LP solve performance. Three strategies exist: Level-1 (retain any cut that was ever binding), Limited Memory Level-1/LML1 (retain cuts binding within a time window), and Dominated Cut Detection (remove cuts dominated at all visited states). The mathematical definitions are in `cut-management.md` SS7; the implementation architecture is in `cut-management-impl.md` SS2; the configuration is in `extension-points.md` (indirectly, via cut-management-impl.md SS2.4).

Cut selection runs **periodically** (every `check_frequency` iterations), not at every iteration. It only **deactivates** cuts (never deletes), preserving slot indices for reproducibility.

### Relation to Epic

First ticket in Epic 02. The conformance test spec (ticket-008) depends on this trait spec.

### Current State

- `src/specs/math/cut-management.md` SS7 defines the three strategies mathematically (Level-1 SS7.1, LML1 SS7.2, Dominated SS7.3)
- `src/specs/architecture/cut-management-impl.md` SS2 defines the implementation architecture (tracking data, configuration)
- `src/specs/architecture/cut-management-impl.md` SS6 defines cut activity tracking (binding detection, counter updates)
- No formal trait definition exists

## Specification

### Requirements

Create a new file `src/specs/architecture/cut-selection-trait.md` with the following structure:

1. **Title**: `# Cut Selection Strategy Trait`
2. **Purpose paragraph**
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md`
4. **SS1. Trait Definition**: Enum-based trait with three variants (Level1, LML1, Dominated), each carrying its strategy-specific configuration
5. **SS2. Method Contracts**: Three methods:
   - `should_run(iteration) -> bool` -- Whether to run selection this iteration (based on `check_frequency`)
   - `select(cut_pool, iteration) -> DeactivationSet` -- Given the current cut pool state and iteration number, return the set of cut indices to deactivate. Each variant applies its own logic:
     - Level1: deactivate cuts with `active_count == 0`
     - LML1: deactivate cuts with `last_active_iter < iteration - memory_window`
     - Dominated: deactivate cuts dominated at all visited states (within tolerance)
   - `update_activity(cut_index, iteration)` -- Update the tracking data for a binding cut (called after each LP solve per cut-management-impl.md SS6.2)
6. **SS3. Supporting Types**: `CutSelectionConfig` matching the configuration schema, per-cut tracking metadata
7. **SS4. Dispatch Mechanism**: Enum dispatch. Strategy is global (one per run). The enum is matched at the `should_run` and `select` call sites.
8. **SS5. Convergence Guarantee**: Document the convergence theorem from cut-management.md SS8 (Level-1 and LML1 preserve convergence; Dominated is more aggressive)
9. **SS6. Interaction with Cut Pool**: Document the relationship with cut-management-impl.md SS1 (activity bitmap, deterministic slot assignment, populated count)
10. **Cross-References** section

### Content Guidelines

- Each variant's `select` behavior must be described as a behavioral contract, not as an algorithm
- The Dominated variant is the most complex: O(|active cuts| x |visited states|) per stage per check
- Document that deactivation updates the activity bitmap but does NOT delete cuts
- The `threshold` parameter (epsilon) applies to all three strategies for near-binding tolerance
- Reference cut-management.md SS8 for the convergence guarantee

## Acceptance Criteria

- [ ] Given the file exists, when reading SS1, then three variants are defined with their per-variant configuration data
- [ ] Given the method contracts in SS2, when reading `select`, then each variant's behavior is described with preconditions/postconditions
- [ ] Given SS5, when reading the convergence guarantee, then it references cut-management.md SS8
- [ ] Given SS6, when reading the cut pool interaction, then it documents the activity bitmap and deactivation semantics
- [ ] Given the cross-references, when checking them, then all links resolve

## Implementation Guide

### Suggested Approach

1. Read `src/specs/math/cut-management.md` SS7 for the three strategies
2. Read `src/specs/architecture/cut-management-impl.md` SS2 for implementation architecture and SS6 for activity tracking
3. Read `src/specs/hpc/communicator-trait.md` for the structural pattern
4. Write the trait spec with three-variant enum

### Key Files to Modify

- **Create**: `src/specs/architecture/cut-selection-trait.md`

### Patterns to Follow

- Same structural pattern as the Epic 01 trait specs
- Method contract format with Preconditions/Postconditions tables

### Pitfalls to Avoid

- Do NOT define new cut selection strategies beyond the three existing ones
- Do NOT describe the CSR assembly process (that is solver-abstraction.md territory)
- Do NOT include the FlatBuffers serialization details (that is binary-formats.md territory)

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-008 (conformance test spec)

## Effort Estimate

**Points**: 3
**Confidence**: High
