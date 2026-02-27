# ticket-003 Define TrajectoryRecord Type with Contiguous LP Solution Layout

## Context

### Background

GAP-030 identifies that the forward pass "Record" step says to store "the stage cost and the end-of-stage state" but does not specify the data structure for per-scenario trajectory records. The stakeholder review confirmed: store the **complete LP solution** (primal variables, dual variables, and stage costs), use a **shared struct for both training forward pass and simulation** (simulation needs more output than training, so the struct is a superset), and store **contiguously** in memory.

### Relation to Epic

The `TrajectoryRecord` type is the primary data structure produced by the forward pass and consumed by the backward pass. It is also reused for simulation output. Defining it concretely unblocks implementation of both the training loop and simulation architecture.

### Current State

`src/specs/architecture/training-loop.md` section 4.2 step (e) says:

> Record: store the stage cost and the end-of-stage state (visited state, if saving for backward pass)

No struct definition, no memory layout, and no specification of what fields are stored. The backward pass (section 6) consumes "visited states" from forward pass records but the indexing scheme is unspecified.

`src/specs/architecture/simulation-architecture.md` references trajectory output but does not define a shared struct with the training loop.

## Specification

### Requirements

1. Add a `TrajectoryRecord` struct definition to `src/specs/architecture/training-loop.md` in a new subsection (e.g., SS4.2b or SS5.6)
2. The struct must contain:
   - Primal variables (full LP solution vector per stage)
   - Dual variables (full LP dual vector per stage)
   - Stage costs (objective value per stage)
   - End-of-stage state vector (storage volumes and AR lags)
3. Document the contiguous memory layout: records stored as `[scenario][stage]` for cache-friendly backward pass access
4. Document that this struct is a superset: training uses a subset (state + cost for backward pass), simulation uses the full record for output
5. Add a note in `src/specs/architecture/simulation-architecture.md` (or a cross-reference) confirming that simulation reuses `TrajectoryRecord` rather than defining its own type

### Out of Scope

- Specifying the Parquet output schema for simulation (already defined in `output-schemas.md`)
- Defining per-thread allocation strategy (already in `solver-workspaces.md`)
- Changing the forward pass algorithm steps (section 4.2 step sequence stays the same)

### Inputs/Props

The struct must hold per-stage data for one scenario trajectory:

- Primal solution: `Vec<f64>` of length `n_columns` (all LP variables including state, flow, slack, theta)
- Dual solution: `Vec<f64>` of length `n_rows` (all LP constraint duals including structural and cut rows)
- Stage cost: `f64` (LP objective value at this stage)
- State vector: already defined in SS5.1 as a contiguous `[f64]` of length `state_dimension`

### Outputs/Behavior

Updated `training-loop.md` with:

- A `TrajectoryRecord` struct definition with Rust code block and field descriptions
- Memory layout documentation
- Dual-use (training + simulation) design note

### Error Handling

Not applicable (spec documentation).

## Acceptance Criteria

- [ ] Given `src/specs/architecture/training-loop.md`, when searching for `TrajectoryRecord`, then a struct definition is found containing fields for primal variables, dual variables, stage costs, and end-of-stage state
- [ ] Given the `TrajectoryRecord` struct, when reading the memory layout documentation, then it specifies contiguous storage indexed by `[scenario][stage]` for cache-friendly backward pass access
- [ ] Given the `TrajectoryRecord` struct, when reading the design notes, then it states the struct is a superset used for both training forward pass and simulation, with training consuming only the state and cost subset
- [ ] Given `src/specs/architecture/training-loop.md`, when running `mdbook build`, then the build succeeds with no new errors

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/training-loop.md` sections 4.2 (forward pass) and 5.1 (state vector) to understand the existing definitions
2. Add a new subsection (SS4.2b "TrajectoryRecord Type" or SS5.6 "TrajectoryRecord") with:
   a. Rust struct definition in a code block
   b. Field descriptions table matching the existing pattern
   c. Memory layout specification: flat buffer indexed by `scenario * n_stages + stage`
   d. Design note explaining the training/simulation dual use
3. Update the forward pass step (e) in SS4.2 to reference the new struct definition
4. Add a cross-reference note in `src/specs/architecture/simulation-architecture.md` pointing to the TrajectoryRecord definition

### Key Files to Modify

- `src/specs/architecture/training-loop.md` -- add `TrajectoryRecord` struct definition and layout spec
- `src/specs/architecture/simulation-architecture.md` -- add cross-reference note (minor, 1-2 lines)

### Patterns to Follow

- Architecture specs use the `SS` prefix for section references (e.g., SS4.2b)
- Struct definitions in architecture specs follow the pattern in SS5.1 (StateVector) and SS2.1b (TrainingEvent): Rust code block with doc comments, followed by a field descriptions table
- The `SS` prefix is used for section numbering within the file; `§` is NOT used in architecture specs

### Pitfalls to Avoid

- Do NOT use `§` in architecture specs (only allowed in the convention blockquote, which is not present in training-loop.md since it is not a trait spec)
- Do NOT duplicate the state vector definition (SS5.1) -- the TrajectoryRecord contains the state vector as one of its fields, not a copy of the definition
- The primal/dual sizes vary per stage (different stages may have different LP sizes) -- the struct should reference the per-stage sizing from `StageTemplate` in solver-abstraction.md

## Testing Requirements

### Unit Tests

Not applicable (Markdown spec document).

### Integration Tests

- Run `mdbook build` and verify no new errors
- Verify cross-reference link from simulation-architecture.md resolves

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
