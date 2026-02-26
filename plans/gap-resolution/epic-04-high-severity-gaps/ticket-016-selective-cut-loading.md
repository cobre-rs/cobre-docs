# ticket-016: Adopt Selective Cut Addition as Baseline (GAP-011)

## Context

### Background

Solver Abstraction SS5.4 contains an "open question" marker about whether to use selective cut addition (only active cuts added via `addRows`) or bulk cut loading (all cuts loaded with inactive cuts deactivated via bound toggling) for loading cuts into the solver LP at each stage transition. The open question must be closed for the minimal viable solver.

### Relation to Epic

This ticket resolves GAP-011 (High severity). Like ticket-015, it is a design decision ticket that removes an open-question marker. The decision affects `CutBatch` assembly logic in cobre-sddp and solver presolve configuration.

### Current State

- **Solver Abstraction SS5.4**: Contains the blockquote "Open question -- selective vs bulk cut loading" with two options. Selective addition is described as the "current baseline" but not formally adopted.
- **Cut Management Implementation SS1.1**: Activity bitmap tracks which cuts are active. The `CutBatch` assembly described in Solver Interface Trait SS4.5 reads from this bitmap.
- **Solver Workspaces SS1.10**: Discusses cut loading cost analysis showing `addRows` as the dominant stage-transition cost.
- **Solver Abstraction SS11.2 step 2**: States "Batch-add all active cuts from the cut pool via a single `addRows` call in CSR format (see SS5.4)."

## Specification

### Requirements

1. In `solver-abstraction.md` SS5.4, replace the "Open question" blockquote with a **Stakeholder Decision** note that formally adopts selective addition as the baseline:
   - Only active cuts are added via `addRows` at each stage transition.
   - Inactive cuts are excluded from the solver LP entirely.
   - Bulk loading with bound deactivation is deferred to a later optimization pass.
2. Document the rationale: (a) selective addition produces smaller LPs (fewer rows, smaller factorization); (b) it is the natural fit for the full-rebuild strategy (SS11.2) where the LP is transient; (c) presolve is currently disabled for warm-start compatibility, so bound-toggled inactive rows would not be optimized away; (d) the activity bitmap already provides O(1) active/inactive status per cut.
3. Add a note on CutBatch assembly implications: the `CutBatch` struct (Solver Interface Trait SS4.5) contains only active cuts. Assembly iterates the activity bitmap and copies only active cut data into the CSR arrays. The assembly cost is $O(n_{active} \times n_{state})$, not $O(n_{total} \times n_{state})$.
4. Add a note on presolve: with selective addition, presolve can remain disabled (as required for warm-start basis compatibility). If bulk loading were adopted in the future, presolve interaction would need re-evaluation.
5. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-011 as resolved.

### Inputs/Props

- Current open-question blockquote in SS5.4
- CutBatch assembly from Solver Interface Trait SS4.5
- Activity bitmap from Cut Management Implementation SS1.1

### Outputs/Behavior

The open-question marker is replaced with a concrete decision. The cut loading strategy is settled for the minimal viable solver.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `solver-abstraction.md` SS5.4, when searching for "Open question", then the blockquote is absent.
- [ ] Given `solver-abstraction.md` SS5.4, when reading the cut loading decision, then it states selective addition as the adopted baseline.
- [ ] Given SS5.4, when reading the rationale, then it lists at least three reasons (smaller LP, natural fit for rebuild, presolve disabled).
- [ ] Given SS5.4, when reading the CutBatch assembly note, then it states that only active cuts are included with $O(n_{active} \times n_{state})$ assembly cost.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-011 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/solver-abstraction.md` and locate SS5.4.
2. Replace the blockquote with a Stakeholder Decision note.
3. Add the rationale, CutBatch assembly note, and presolve note.
4. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
5. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md` — Replace open-question blockquote in SS5.4 (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-011 resolution row to Section 7 table

### Patterns to Follow

- **Stakeholder Decision note**: Same pattern as ticket-015 and the GAP-002 resolution.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT remove the description of the bulk loading alternative. Convert it to a "deferred optimization" note within the decision text so the rationale for the alternative is preserved.
- Do NOT modify SS5.1-5.3 (cut pool preallocation, mathematical basis). These are unaffected by the loading strategy choice.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines cut row positions — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
