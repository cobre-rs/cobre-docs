# ticket-015: Adopt Single-Phase LP Scaling as Baseline (GAP-010)

## Context

### Background

Solver Abstraction SS3 and Solver Workspaces SS2.1 contain an "open point" marker for the LP scaling strategy decision: single-phase scaling (compute once from template) vs two-phase scaling (re-scale after cuts). For the minimal viable solver, this open point must be closed with a concrete decision so implementers know which scaling path to build first.

### Relation to Epic

This ticket resolves GAP-010 (High severity). It is a design decision ticket that removes an open point marker and documents the chosen baseline. The decision enables implementers to proceed with a single, well-defined scaling implementation.

### Current State

- **Solver Abstraction SS3**: Contains the blockquote "Open point -- scaling strategy" with two options (single-phase vs two-phase).
- **Solver Workspaces SS2.1**: Contains a matching open-point blockquote referencing SS3.
- **Solver Workspaces SS2.2-2.5**: Defines the scaling transformation mechanics (D_c, D_r, unscaling formulas) that apply regardless of which strategy is chosen.
- **HiGHS default behavior**: HiGHS applies its own internal scaling by default (`kSimplexScaleStrategy = 2`). The Cobre spec must clarify whether to use HiGHS internal scaling or apply explicit Cobre-managed scaling.

## Specification

### Requirements

1. In `solver-abstraction.md` SS3, replace the "Open point -- scaling strategy" blockquote with a **Stakeholder Decision** note that adopts the following baseline for the minimal viable solver:
   - **Delegate scaling to the solver backend** (`SolverAuto` method from Solver Workspaces SS2.3).
   - HiGHS internal scaling is enabled by default (its built-in geometric mean strategy).
   - CLP internal scaling is enabled by default.
   - Cobre does NOT apply its own scaling in the minimal viable solver.
   - Two-phase scaling and Cobre-managed GeometricMean/Equilibration scaling are deferred to a later optimization pass.
2. Document the rationale: (a) HiGHS and CLP both have mature, well-tested internal scaling; (b) applying Cobre-managed scaling on top of solver scaling risks double-scaling; (c) deferring Cobre-managed scaling reduces initial implementation complexity; (d) the decision can be revisited if profiling shows numerical difficulties at production scale.
3. In `solver-workspaces.md` SS2.1, replace the "Open point -- scaling strategy" blockquote with a forward reference to the decision in Solver Abstraction SS3.
4. In `solver-workspaces.md` SS2.5, add a clarifying note that when `SolverAuto` is active, all scaling augmentation steps in the table are skipped (the solver handles everything internally). The only active rows are "4-5. Set basis, Solve" and "7. Update statistics."
5. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-010 as resolved.

### Inputs/Props

- Current open-point blockquotes in SS3 and SS2.1
- Scaling method enum from Solver Workspaces SS2.3

### Outputs/Behavior

The open-point markers are replaced with a concrete decision. The scaling strategy section reads as a settled design, not an open question.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `solver-abstraction.md` SS3, when searching for "Open point", then the scaling strategy blockquote is absent.
- [ ] Given `solver-abstraction.md` SS3, when reading the scaling decision, then it states `SolverAuto` (delegate to backend) as the baseline for the minimal viable solver.
- [ ] Given `solver-abstraction.md` SS3, when reading the rationale, then it lists at least three reasons (mature solver scaling, double-scaling risk, deferred complexity).
- [ ] Given `solver-workspaces.md` SS2.1, when searching for "Open point", then the scaling strategy blockquote is absent and replaced with a reference to SS3.
- [ ] Given `solver-workspaces.md` SS2.5, when reading the scaling integration table, then a note clarifies that SolverAuto skips all Cobre-managed augmentation steps.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-010 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/solver-abstraction.md` and locate SS3 "Abstraction Hierarchy" (which contains the open-point blockquote).
2. Replace the blockquote with a "Stakeholder Decision" note (use `>` blockquote with bold "Stakeholder Decision" prefix, matching the pattern used for GAP-002 resolution in Internal Structures SS2).
3. Open `src/specs/architecture/solver-workspaces.md` and locate SS2.1 "Motivation".
4. Replace the open-point blockquote with a short note: "The scaling strategy is resolved in [Solver Abstraction SS3](./solver-abstraction.md): delegate to the solver backend for the minimal viable solver."
5. In SS2.5, add a row or note about SolverAuto behavior.
6. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
7. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md` — Replace open-point blockquote in SS3 (primary edit)
- `src/specs/architecture/solver-workspaces.md` — Replace open-point blockquote in SS2.1, add SolverAuto note in SS2.5
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-010 resolution row to Section 7 table

### Patterns to Follow

- **Stakeholder Decision note**: Follow the pattern used in `internal-structures.md` SS2 for the GAP-002 resolution: `> **Stakeholder Decision**: ...`.
- **Deferred work notation**: State "deferred to a later optimization pass" consistently with the project vocabulary.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT delete the scaling mechanics sections (SS2.2-2.4 in solver-workspaces.md). These define the transformation formulas that apply when Cobre-managed scaling is eventually implemented. They remain as reference material.
- Do NOT state that scaling is disabled. The solver's internal scaling IS active under `SolverAuto`. Only Cobre-managed external scaling is deferred.
- Do NOT edit any files beyond the three listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines variable magnitudes — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
