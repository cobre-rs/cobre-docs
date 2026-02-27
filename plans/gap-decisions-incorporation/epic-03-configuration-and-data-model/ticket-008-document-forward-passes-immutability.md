# ticket-008 Document Forward Passes Immutability Precondition

## Context

### Background

GAP-034 identified that the cut pool capacity formula
`warm_start_cuts + max_iterations x forward_passes` in `cut-management-impl.md` SS1.3
assumes `forward_passes` is fixed for the entire training run. If `forward_passes` could
change dynamically (e.g., via a future scheduler), the pre-allocated pool would be
incorrectly sized — either wasting memory or overflowing. The gap decision confirms that
`forward_passes` is immutable after initialization, and that a dynamic scheduler is
deferred to a future enhancement.

The gap inventory resolution log (section 7) records: "`forward_passes` is immutable
after initialization. Cut pool capacity formula relies on this precondition. Scheduler
deferred. See Solver Abstraction."

### Relation to Epic

This is the smallest ticket in epic-03 (1 point). It adds a precondition statement and
a deferred-feature note to two existing spec sections. It is independent of ticket-006
(configuration reference) and ticket-007 (scenario notation).

### Current State

**`src/specs/architecture/cut-management-impl.md`:**

- **SS1.2** (Deterministic Slot Assignment): Contains the formula
  `slot = warm_start_count + iteration x forward_passes + forward_pass_index`.
- **SS1.3** (Capacity and Sizing): Contains the capacity formula
  `warm_start_cuts + max_iterations x forward_passes` and a production example.
  Neither section states that `forward_passes` must be immutable.

**`src/specs/architecture/solver-abstraction.md`:**

- **SS5** (Cut Pool Design): Contains a similar capacity formula
  `capacity = warm_start_cuts + max_iterations x forward_passes_per_iteration` and the
  slot assignment formula. No immutability precondition is stated.

**`src/specs/configuration/configuration-reference.md`:**

- **Section 3.2**: Documents `training.forward_passes` as a mandatory integer parameter
  (will be marked mandatory by ticket-006). No immutability note exists.

**`src/specs/deferred.md`:**

- Lists deferred features. A dynamic `forward_passes` scheduler is not currently listed.

## Specification

### Requirements

1. **Add immutability precondition to `cut-management-impl.md` SS1.3**:
   - Add a blockquote precondition note immediately after the capacity formula table:
     "> **Precondition:** `forward_passes` is immutable after initialization. The cut
     pool capacity formula depends on this invariant — a runtime change to
     `forward_passes` would invalidate the pre-allocated slot assignment. A dynamic
     forward-passes scheduler is deferred (see
     [Deferred Features SSC.xx](../deferred.md))."
   - The note must cite the specific consequence (slot assignment invalidation) and
     the deferred feature.

2. **Add immutability note to `solver-abstraction.md` SS5**:
   - Add a brief sentence after the capacity formula: "`forward_passes_per_iteration`
     is immutable after initialization — see
     [Cut Management Implementation SS1.3](./cut-management-impl.md) for the
     precondition rationale."

3. **Add a deferred feature entry to `deferred.md`**:
   - Add a deferred feature item for "Dynamic forward-passes scheduler" that allows
     adjusting the number of forward passes per iteration during training. Reference
     the cut pool pre-allocation as the primary constraint that would need redesign
     (dynamic allocation or worst-case sizing).

### Inputs/Props

- GAP-034 decision: `forward_passes` immutable after initialization
- Current capacity formula in `cut-management-impl.md` SS1.3 and
  `solver-abstraction.md` SS5

### Outputs/Behavior

- Immutability precondition documented in two architecture specs
- Deferred feature entry added to `deferred.md`
- No new files created; no sections removed

### Error Handling

N/A (spec document edits only).

### Out of Scope

- Adding the mandatory-field enforcement to `configuration-reference.md` (that is
  ticket-006, GAP-027).
- Designing the dynamic scheduler (explicitly deferred).
- Modifying `training-loop.md` (the forward pass count is consumed from config but
  the training loop spec does not contain a capacity formula to annotate).

## Acceptance Criteria

- [ ] Given `cut-management-impl.md` SS1.3, when the ticket is complete, then a
      blockquote precondition appears immediately after the capacity formula table stating
      that `forward_passes` is immutable after initialization and citing slot assignment
      invalidation as the consequence.
- [ ] Given `solver-abstraction.md` SS5, when the ticket is complete, then a sentence
      after the capacity formula states that `forward_passes_per_iteration` is immutable
      with a cross-reference to `cut-management-impl.md` SS1.3.
- [ ] Given `deferred.md`, when the ticket is complete, then it contains a deferred
      feature entry for "Dynamic forward-passes scheduler" referencing the cut pool
      pre-allocation constraint.
- [ ] Given the completed files, when `mdbook build` is run, then the build succeeds
      with no new errors.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/cut-management-impl.md`.
2. Locate SS1.3 (Capacity and Sizing). After the capacity table (the one with
   "Capacity per stage", "Production example", etc.), insert the blockquote
   precondition note.
3. Open `src/specs/architecture/solver-abstraction.md`.
4. Locate SS5 (the section containing the capacity formula around line 400). After
   the slot assignment formula, add the immutability sentence with cross-reference.
5. Open `src/specs/deferred.md`.
6. Find the appropriate location for the new deferred item (the file uses lettered
   subsections like SSC.xx). Add the dynamic scheduler entry. Use the next available
   letter/number in the deferred features list.
7. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/architecture/cut-management-impl.md` — SS1.3
- `src/specs/architecture/solver-abstraction.md` — SS5
- `src/specs/deferred.md` — new deferred feature entry

### Patterns to Follow

- **Blockquote precondition format**: Use `> **Precondition:**` as the opening marker,
  consistent with the precondition blockquote style used in solver-interface-trait.md
  for method preconditions.
- **Cross-reference format**: Architecture-to-architecture uses `SS` prefix.
  `deferred.md` uses `SSC.xx` prefix for deferred feature items.
- **Deferred feature entry format**: Follow the existing pattern in `deferred.md` with
  a brief description, rationale for deferral, and cross-reference to the constraining
  spec section.

### Pitfalls to Avoid

- Do NOT use `§` prefix in architecture file prose (it is reserved for HPC file
  references).
- Do NOT add the immutability note to `configuration-reference.md` (that file documents
  parameters, not architectural invariants; ticket-006 handles the mandatory-field note).
- Ensure the deferred feature ID does not collide with existing entries in `deferred.md`.

## Testing Requirements

### Unit Tests

N/A (spec document, not code).

### Integration Tests

- Run `mdbook build` from the repo root and verify zero new errors.
- Verify the cross-reference from `cut-management-impl.md` to `deferred.md` resolves
  (check for broken link warnings in build output).

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
