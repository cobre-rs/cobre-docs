# ticket-024: Clarify Lower Bound Computation (GAP-037)

## Context

### Background

The lower bound (LB) computation in the training loop has an apparent ambiguity. Convergence Monitoring SS1 states that the LB is "the objective value of the stage-1 LP" and that it is "deterministic: all scenarios share the same initial state $x_0$, so the stage-1 LP is identical regardless of scenario." Yet Training Loop SS4.3 says the LB is aggregated via `allreduce`, implying multiple ranks contribute potentially different values. GAP-037 asks: if stage 1 is deterministic, why use `allreduce` at all?

### Relation to Epic

This ticket resolves GAP-037 (High severity). It clarifies the LB computation mechanism in the training loop spec, resolving the apparent contradiction between "deterministic LB" and "allreduce aggregation."

### Current State

- **Convergence Monitoring SS1**: "The objective value of the stage-1 LP, which includes both the immediate stage-1 cost and the future cost approximation $\theta_2$ from accumulated cuts." States it is "deterministic: all scenarios share the same initial state $x_0$, so the stage-1 LP is identical regardless of scenario -- only one solve is needed."
- **Convergence Monitoring SS3.2**: "The lower bound is the objective value of the stage-1 LP, which is deterministic (identical across all scenarios and ranks) because all scenarios share the same initial state $x_0$. Only one rank needs to solve and broadcast this value."
- **Training Loop SS4.3**: Lists the forward pass `allreduce` as aggregating "Lower bound -- First-stage LP objective value (the deterministic lower bound, monotonically increasing across iterations)."
- **Convergence Monitoring SS3.1**: The cross-rank aggregation subsection describes a "single `MPI_Allreduce`" with three sufficient statistics (count, sum, sum-of-squares) -- but these are for the **upper bound**, not the lower bound. The LB is not mentioned in the allreduce specification.

**Resolution analysis**: The specs are actually consistent but the relationship needs to be made explicit. The stage-1 LP is identical across all ranks (same initial state, same cuts), so every rank that solves stage 1 gets the same LB. In the forward pass, every rank solves stage 1 for its first scenario trajectory (the stage-1 solve is the first step of the forward pass). All ranks thus independently compute the same LB value. The `allreduce` for the LB is either (a) redundant but harmless (all values are identical, `allreduce Min` returns the same value), or (b) it can be replaced by having any single rank solve stage 1 and broadcast. The current wording in SS4.3 bundles the LB into the forward synchronization `allreduce`, but SS3.2 correctly notes "only one rank needs to solve and broadcast."

## Specification

### Requirements

1. Add a new subsection SS4.3b "Lower Bound Extraction" to `training-loop.md` immediately after SS4.3a (single-rank variant).
2. Clarify that the lower bound is extracted from the **first** stage-1 LP solve on any rank. Since the stage-1 LP is identical across all ranks and all scenarios (same initial state $x_0$, same cut set), every stage-1 solve produces the same objective value. The LB is a single `f64` value, not a per-scenario statistic.
3. Specify the aggregation mechanism: the LB is included in the forward synchronization `allreduce` alongside the upper bound statistics. The reduction operation for the LB field is `ReduceOp::Min`. Since all ranks compute the same value, `Min` is a no-op in exact arithmetic. The `Min` operation serves as a **defensive guard against numerical noise** -- if floating-point non-determinism across different solver instances or NUMA nodes produces slightly different LB values, `Min` selects the most conservative (lowest) bound, preserving the mathematical guarantee that $LB \leq z^*$.
4. Specify the combined allreduce payload: the forward synchronization uses a single `allreduce` on a 4-element `[f64; 4]` array:
   ```
   [lb_candidate, cost_sum, cost_sum_sq, scenario_count]
   ```
   with reduction operations `[Min, Sum, Sum, Sum]`. The first element is the LB; the remaining three are the upper bound sufficient statistics (from Convergence Monitoring SS3.1). This requires a custom MPI reduction operation that applies different operations to different elements, or alternatively, two separate `allreduce` calls (one `Min` for LB, one `Sum` for UB statistics). Specify the two-call approach as the baseline for simplicity, noting that a custom reduction is an optimization.
5. Add a note that in the single-rank variant (SS4.3a), the LB extraction is trivial -- the rank's stage-1 objective is the global LB with no communication.
6. Update the existing allreduce bullet in SS4.3 to cross-reference SS4.3b for the LB mechanism instead of the current inline description.
7. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-037 as resolved.

### Inputs/Props

- Training Loop SS4.3 forward synchronization
- Convergence Monitoring SS1 and SS3.1-3.2

### Outputs/Behavior

A clear specification of how the LB is extracted and communicated, resolving the apparent contradiction between "deterministic" and "allreduce."

### Error Handling

Not applicable -- specification document.

## Acceptance Criteria

- [ ] Given `training-loop.md`, when looking after SS4.3a, then a subsection SS4.3b "Lower Bound Extraction" exists.
- [ ] Given SS4.3b, when reading the LB source, then it states the LB is the stage-1 LP objective value from any rank's first stage-1 solve.
- [ ] Given SS4.3b, when reading the aggregation mechanism, then it states `ReduceOp::Min` with a rationale of defending against numerical noise.
- [ ] Given SS4.3b, when reading the allreduce payload, then it specifies a two-call approach: one `allreduce Min` for LB, one `allreduce Sum` for UB statistics `[cost_sum, cost_sum_sq, scenario_count]`.
- [ ] Given SS4.3b, when reading the single-rank note, then it states no communication is needed for the LB in single-rank mode.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-037 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/training-loop.md` and locate SS4.3a.
2. Insert subsection `### 4.3b Lower Bound Extraction` after SS4.3a.
3. Write the LB extraction specification covering all 5 technical requirements.
4. Update the bullet in SS4.3 that references the LB allreduce to point to SS4.3b.
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` -- Add SS4.3b subsection, update SS4.3 bullet (primary edit)
- `src/specs/overview/spec-gap-inventory.md` -- Add GAP-037 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: "4.3b" pattern, following the existing "4.3a" single-rank variant.
- **Defensive design rationale**: Follow the pattern in Scenario Generation SS2.2a (SipHash-1-3 from ticket-019) where a defensive design choice is documented with rationale even when the expected case makes it unnecessary.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT change the upper bound allreduce mechanism. The UB aggregation (count, sum, sum_sq) is specified in Convergence Monitoring SS3.1 and is correct. This ticket only clarifies the LB mechanism.
- Do NOT specify that only rank 0 solves stage 1. All ranks solve stage 1 as part of their normal forward pass. The LB is a side effect of any rank's stage-1 solve, not a special-case computation.
- Do NOT use `allreduce` with a packed 4-element array and mixed operations as the baseline. Use two separate calls for clarity. The custom reduction optimization can be noted but is not the baseline.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable -- specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines the theta variable position -- completed)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
