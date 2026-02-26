# ticket-021: Audit CLI Lifecycle for Training Loop Consistency (GAP-016)

## Context

### Background

The CLI and Lifecycle spec was not in the original critical reading list for the gap inventory and may have drifted from the Training Loop spec. GAP-016 flags the need to verify that MPI initialization happens before config loading, that rank-0 validation is explicitly sequenced, and that the `run` subcommand's phase boundaries are correctly documented relative to the training loop's assumptions.

### Relation to Epic

This ticket resolves GAP-016 (High severity). It is an audit-and-fix ticket, not a design decision ticket. The goal is consistency verification between two specs, with corrections applied as needed.

### Current State

- **CLI and Lifecycle SS5.2**: Phase table shows Startup (All ranks: MPI init, scheduler detection, CLI parsing), Validation (Rank 0 only: load files, schema validation), Initialization (All: broadcast, memory allocation, solver setup), Scenario Gen (All), Training (All), Simulation (All), Finalize (All).
- **Training Loop SS2.1**: Iteration lifecycle (forward pass, sync, backward pass, cut sync, convergence, checkpoint, logging). Does not specify pre-training phases.
- **Training Loop SS4.3**: Forward pass starts from a known initial state $x_0$ from `initial_conditions.json` — this implies loading has already completed.
- **Input Loading Pipeline SS1**: Rank-0 centric loading (rank 0 loads, validates, broadcasts). Broadcast happens during Initialization phase per CLI SS5.2.

The audit must verify:

1. MPI init precedes config loading (yes: Startup is before Validation in SS5.2)
2. Rank-0 validation is before broadcast (yes: Validation is rank 0 only, Initialization includes broadcast)
3. Scenario generation is after broadcast (yes: Scenario Gen follows Initialization)
4. Solver workspace allocation is in Initialization (yes, per SS5.2 "memory allocation, solver setup")

## Specification

### Requirements

1. Read `cli-and-lifecycle.md` SS5.2 and verify phase ordering against `training-loop.md` assumptions. Specifically verify:
   - MPI init (Startup) precedes file loading (Validation)
   - Rank-0 validation precedes broadcast (Initialization)
   - Solver workspace allocation is in Initialization, before Training
   - Scenario generation is before Training
2. If any inconsistency is found, fix it in `cli-and-lifecycle.md`. Based on current reading, the phase ordering appears correct. The primary issue is likely documentation completeness rather than ordering errors.
3. Add a new subsection SS5.2a "Phase-Training Loop Alignment" to `cli-and-lifecycle.md` that explicitly documents the correspondence between CLI phases and Training Loop sections:
   - Startup: MPI init (Hybrid Parallelism SS6), scheduler detection (CLI SS6.3)
   - Validation: `load_case` (Input Loading Pipeline SS8.1, defined in ticket-017)
   - Initialization: rkyv broadcast (Input Loading Pipeline SS6), solver workspace allocation (Solver Workspaces SS1.3), stage template construction (Solver Abstraction SS11.1)
   - Scenario Gen: PAR preprocessing and opening tree generation (Scenario Generation SS1-2)
   - Training: SDDP iterations (Training Loop SS2.1)
   - Simulation: Policy evaluation (Simulation Architecture)
   - Finalize: Output writing, MPI finalize
4. Verify that the `run` subcommand's phase participation (SS5.4) is consistent with the training loop: `run` participates in all 7 phases.
5. If the validation-only path (`cobre validate`) correctly stops after Validation phase without entering Initialization, verify this is documented clearly.
6. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-016 as resolved.

### Inputs/Props

- CLI and Lifecycle SS5.2 phase table
- Training Loop SS2.1 iteration lifecycle
- Input Loading Pipeline SS1 loading architecture

### Outputs/Behavior

A new alignment subsection that explicitly maps CLI phases to training loop sections, plus any corrections to phase ordering if inconsistencies are found.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `cli-and-lifecycle.md`, when looking after SS5.2, then a subsection SS5.2a "Phase-Training Loop Alignment" exists.
- [ ] Given SS5.2a, when reading the alignment table, then each of the 7 phases maps to specific spec sections with cross-reference links.
- [ ] Given SS5.2a, when checking Startup phase, then MPI init is listed as the first operation.
- [ ] Given SS5.2a, when checking Validation phase, then rank-0 file loading and validation is listed.
- [ ] Given SS5.2a, when checking Initialization phase, then broadcast, solver workspace allocation, and stage template construction are listed.
- [ ] Given `cli-and-lifecycle.md`, when searching for phase ordering inconsistencies with the training loop, then none are found (or any found are corrected).
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-016 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/cli-and-lifecycle.md` and read SS5.2 carefully.
2. Cross-check each phase against the corresponding spec sections (Training Loop, Input Loading Pipeline, Solver Workspaces, Scenario Generation).
3. If inconsistencies are found, fix them in `cli-and-lifecycle.md`.
4. Insert subsection `### 5.2a Phase-Training Loop Alignment` after SS5.2.
5. Write the alignment table with phase name, MPI ranks involved, key operations, and spec cross-references.
6. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
7. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/cli-and-lifecycle.md` — Add SS5.2a alignment subsection, fix any inconsistencies (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-016 resolution row to Section 7 table

### Patterns to Follow

- **Alignment table**: Use a table with columns: Phase, MPI Ranks, Key Operations, Spec Reference(s). Similar to the phase table in SS5.2 but with explicit cross-reference links.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT restructure the CLI spec. The audit adds an alignment subsection; it does not reorganize existing content.
- Do NOT duplicate content from other specs. Use cross-reference links, not copies.
- Do NOT edit any files beyond the two listed above. The training loop spec does not need changes — the alignment subsection lives in the CLI spec.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-004 (System type must be defined to verify the broadcast step — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
