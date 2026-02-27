# ticket-009 Document Backward Pass Trial State Distribution Strategy

## Context

### Background

GAP-026 identified that `training-loop.md` SS6.3 states "trial states at each stage are distributed across MPI ranks" but does not specify the distribution strategy. The stakeholder design review decided on **contiguous block assignment**, consistent with the forward pass pattern documented in `work-distribution.md` SS1.1 and SS3.1. This ticket adds the missing specification to `training-loop.md` SS6.3.

### Relation to Epic

Epic 04 resolves the five remaining gaps that require documentation additions to spec files. This ticket resolves GAP-026 by documenting the backward trial state distribution strategy in the training loop spec.

### Current State

- `src/specs/architecture/training-loop.md` SS6.3 ("Parallel Distribution") currently says trial states are distributed but does not specify the assignment algorithm.
- `src/specs/hpc/work-distribution.md` SS2.1 already describes backward pass trial point collection via `allgatherv` and SS3.1 defines the contiguous block assignment arithmetic. It references "the same static contiguous block assignment as the forward pass."
- The gap inventory (`src/specs/overview/spec-gap-inventory.md`) section 3 row GAP-026 and section 7 resolution log row already record the decision and cite `training-loop.md` as the target.

## Specification

### Requirements

1. Expand `training-loop.md` SS6.3 to specify that backward trial states are distributed across MPI ranks using the same contiguous block assignment formula as the forward pass (documented in [Work Distribution SS3.1](../hpc/work-distribution.md)).
2. State that each rank receives a contiguous subset of the $M$ total trial points (visited states gathered via `allgatherv` in SS5.4a).
3. State that load balancing when $M$ is not evenly divisible by $R$ follows the same remainder-distribution rule: the first $M \bmod R$ ranks receive $\lceil M/R \rceil$ states, the remaining ranks receive $\lfloor M/R \rfloor$.
4. Note that state deduplication (reducing the trial point set before distribution) is deferred to [Deferred Features](../deferred.md).

### Inputs/Props

- The existing SS6.3 text ("Trial states at each stage are distributed across MPI ranks...").
- The contiguous block assignment formula from `work-distribution.md` SS3.1.

### Outputs/Behavior

SS6.3 gains a paragraph and/or small table documenting the contiguous block assignment for backward trial states, with a cross-reference to Work Distribution SS3.1 for the formula and to SS5.4a for the allgatherv wire format.

### Error Handling

Not applicable (documentation ticket).

### Out of Scope

- Changing the contiguous block assignment formula itself (it is already defined in `work-distribution.md`).
- Implementing state deduplication.
- Modifying `work-distribution.md` (it already documents this pattern).

## Acceptance Criteria

- [ ] Given `src/specs/architecture/training-loop.md` SS6.3, when the section is read, then it explicitly names "contiguous block assignment" as the backward trial state distribution strategy.
- [ ] Given `src/specs/architecture/training-loop.md` SS6.3, when the section is read, then it contains a cross-reference link to `[Work Distribution SS3.1](../hpc/work-distribution.md)` for the formula.
- [ ] Given `src/specs/architecture/training-loop.md` SS6.3, when the section is read, then it states that the distribution mirrors the forward pass pattern and references the allgatherv state exchange in SS5.4a.
- [ ] Given the modified file, when `mdbook build` is run, then it completes with exit code 0 and no new warnings beyond the known `risk-measures.md` unclosed span.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/training-loop.md` SS6.3 in full.
2. After the existing first paragraph of SS6.3 ("Trial states at each stage are distributed across MPI ranks..."), insert a new paragraph that:
   - Names the distribution strategy: contiguous block assignment, matching the forward pass (SS4.3 and [Work Distribution SS3.1](../hpc/work-distribution.md)).
   - States the formula: each rank $r$ receives trial points $[\text{start}_r, \text{start}_r + M_r)$ where $M_r$ is computed by the contiguous block formula in SS3.1.
   - References the allgatherv exchange from SS5.4a that populates the receive buffer in rank order, making the block assignment directly indexable.
   - Notes that state deduplication is deferred ([Deferred Features](../deferred.md)).
3. Run `mdbook build` to verify no regressions.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` (section 6.3 only)

### Patterns to Follow

- Letter-suffix subsections for mid-section insertions (e.g., SS6.3b) if needed, per the learnings convention. However, a new paragraph within SS6.3 is preferred if the content is short enough.
- Cross-reference format: `[Work Distribution SS3.1](../hpc/work-distribution.md)` (not `§3.1`, since Work Distribution is an HPC file referenced from an architecture file).
- Architecture-to-HPC cross-reference uses plain section references or `§` for HPC file targets -- in this case, both `[Work Distribution SS3.1]` and `§3.1` forms are acceptable since the target is in `src/specs/hpc/`.

### Pitfalls to Avoid

- Do not use `§` prefix when referencing sections within `training-loop.md` itself (use plain section references like SS6.3 or "§4.3" only when referencing HPC files).
- Do not duplicate the contiguous block formula in detail -- reference Work Distribution SS3.1 instead.
- Do not modify `work-distribution.md` -- it already documents the backward pass distribution pattern.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Run `mdbook build` from the repo root; verify exit code 0.
- Verify that the link `[Work Distribution SS3.1](../hpc/work-distribution.md)` resolves correctly in the built book.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md (gap inventory must record the resolution path first)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
