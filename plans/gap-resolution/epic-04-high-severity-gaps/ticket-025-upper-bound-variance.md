# ticket-025: Specify Upper Bound Variance Aggregation via Welford's Algorithm (GAP-038)

## Context

### Background

After the forward pass, each rank has per-scenario total costs for its assigned trajectories. Computing the upper bound mean and standard deviation requires aggregating individual cost values across all ranks. The current spec (Convergence Monitoring SS3.1) correctly specifies the aggregation using three sufficient statistics (count, sum, sum-of-squares) with `allreduce Sum`, but the variance formula and its numerical properties are not fully specified. GAP-038 flags the need to document the exact formula, Bessel's correction, and numerical stability considerations.

### Relation to Epic

This ticket resolves GAP-038 (High severity). It specifies the complete upper bound variance aggregation protocol, including the exact formula, the MPI allreduce payload, and numerical stability notes. This is needed for correct implementation of the convergence gap and 95% confidence interval.

### Current State

- **Convergence Monitoring SS3.1**: Specifies a "single `MPI_Allreduce`" with three sufficient statistics: scenario count (Sum), cost sum (Sum), cost sum-squares (Sum). Then lists: Mean = sum/N, Variance = (sum_sq/N) - mean^2, Std = sqrt(variance), CI = 1.96 \* std / sqrt(N).
- **Convergence Monitoring SS1**: States UB includes "95% confidence interval: $UB \pm 1.96 \cdot \sigma / \sqrt{N}$."
- **Convergence Monitoring SS2.4**: Per-iteration output record includes `upper_bound_std` and `ci_95` fields.
- **Training Loop SS4.3**: States allreduce aggregates "Upper bound statistics -- Mean and variance of total forward costs across all trajectories."

**Issues to resolve**:

1. The variance formula in SS3.1 uses `(sum_sq/N) - mean^2` (population variance), but the 95% CI uses $\sigma / \sqrt{N}$ where $\sigma$ should be the sample standard deviation (with Bessel's correction, dividing by $N-1$). The formula needs to specify which denominator is used.
2. The numerical stability of the `sum_sq - N * mean^2` formula is not discussed. For large cost values (e.g., total costs of $10^6$ with small relative variance), this formula can suffer from catastrophic cancellation. The alternative is per-rank Welford-style partial aggregation followed by global merge.
3. The allreduce payload specification is in SS3.1 but should be made more explicit about the exact `[f64; 3]` layout and the reduction operation.

## Specification

### Requirements

1. Add a new subsection SS3.1a "Upper Bound Variance Aggregation" to `convergence-monitoring.md` immediately after SS3.1.
2. Specify the per-rank local computation: each rank computes three local sufficient statistics from its $M_r$ local scenario total costs $\{c_1, c_2, \ldots, c_{M_r}\}$:
   ```
   local_count = M_r                          // u64 cast to f64 for allreduce
   local_sum   = sum(c_i for i in 1..M_r)     // f64
   local_sum_sq = sum(c_i^2 for i in 1..M_r)  // f64
   ```
3. Specify the allreduce payload as `[f64; 3]` in the order `[sum, sum_sq, count]` with `ReduceOp::Sum`. Note: the LB uses a separate allreduce with `ReduceOp::Min` (specified in ticket-024's SS4.3b). The UB statistics allreduce is independent of the LB allreduce.
4. Specify the global variance formula using Bessel's correction:
   $$\bar{c} = \frac{\text{sum}}{N}$$
   $$s^2 = \frac{\text{sum\_sq} - N \cdot \bar{c}^2}{N - 1}$$
   $$\sigma = \sqrt{s^2}$$
   $$\text{CI}_{95} = 1.96 \cdot \frac{\sigma}{\sqrt{N}}$$
   where $N = \text{count}$ is the total number of scenarios across all ranks.
5. Update the existing variance formula in SS3.1 to use Bessel's correction ($N-1$ denominator instead of $N$). The current formula `(sum_sq/N) - mean^2` is the biased (population) variance. Replace with the unbiased (sample) variance: `(sum_sq - N * mean^2) / (N - 1)`.
6. Add a numerical stability note: the two-pass formula `sum_sq - N * mean^2` can lose precision when the coefficient of variation is small (i.e., when costs are large but tightly distributed). At production scale ($N = 100$ scenarios, costs $\sim 10^6$), the relative error from catastrophic cancellation is bounded by $\epsilon_{mach} \cdot N \cdot (c_{max}/\sigma)^2$. For typical SDDP problems, this is acceptable (costs vary by 5-10% across scenarios). If higher numerical stability is needed (e.g., for post-processing validation), a two-pass approach (first pass for mean, second pass for variance) can be used -- but this requires two allreduce rounds and is deferred as an optimization.
7. Specify the edge case: if $N = 1$ (single scenario), the standard deviation is undefined (division by zero in Bessel's correction). In this case, set $\sigma = 0$ and $\text{CI}_{95} = 0$. Log a warning that the upper bound has no statistical validity with a single scenario.
8. Add a cross-reference to Training Loop SS4.3b (lower bound allreduce), Convergence Monitoring SS1 (bound definitions), and Convergence Monitoring SS2.4 (per-iteration output record).
9. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-038 as resolved.

### Inputs/Props

- Convergence Monitoring SS3.1 (cross-rank aggregation)
- Training Loop SS4.3 (forward synchronization)

### Outputs/Behavior

A complete specification of the upper bound variance aggregation protocol that an implementer can use to write the allreduce and variance computation without consulting external references.

### Error Handling

Not applicable -- specification document.

## Acceptance Criteria

- [ ] Given `convergence-monitoring.md`, when looking after SS3.1, then a subsection SS3.1a "Upper Bound Variance Aggregation" exists.
- [ ] Given SS3.1a, when reading the per-rank computation, then it specifies three local statistics: `local_count`, `local_sum`, `local_sum_sq`.
- [ ] Given SS3.1a, when reading the allreduce payload, then it specifies `[f64; 3]` with `ReduceOp::Sum` in the order `[sum, sum_sq, count]`.
- [ ] Given SS3.1a, when reading the variance formula, then it uses Bessel's correction with $N-1$ denominator.
- [ ] Given SS3.1, when reading the updated variance formula, then it uses $N-1$ denominator (not $N$).
- [ ] Given SS3.1a, when reading the numerical stability note, then it documents the catastrophic cancellation risk and states the single-pass formula is acceptable for typical SDDP problems.
- [ ] Given SS3.1a, when reading the edge case, then it specifies $\sigma = 0$ for $N = 1$ with a warning.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-038 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/convergence-monitoring.md` and locate SS3.1.
2. Update the variance formula in SS3.1 to use Bessel's correction: change `(sum_sq / N) - mean^2` to `(sum_sq - N * mean^2) / (N - 1)`.
3. Insert subsection `### 3.1a Upper Bound Variance Aggregation` after SS3.1.
4. Write the per-rank computation, allreduce payload, global formula, numerical stability note, and edge case specification.
5. Add cross-references to Training Loop SS4.3b, Convergence Monitoring SS1, and SS2.4.
6. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
7. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/convergence-monitoring.md` -- Update SS3.1 variance formula, add SS3.1a subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` -- Add GAP-038 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: "3.1a" pattern, consistent with the established "N.Ma" convention.
- **Performance/numerical note**: Follow the pattern in Solver Abstraction SS2.5 (numeric performance analysis with specific values and formulas). The numerical stability note should include a concrete bound on the relative error.
- **Edge case documentation**: Follow the pattern in Convergence Monitoring SS1 where the near-zero guard for the gap formula ($|UB| < 10^{-10}$) is documented inline.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT specify a multi-pass variance algorithm as the baseline. The single-pass `(sum, sum_sq, count)` approach is sufficient for SDDP and avoids a second allreduce round. The two-pass alternative is mentioned as an optimization only.
- Do NOT use population variance (divide by $N$). Use sample variance (divide by $N-1$) for consistency with the 95% CI formula.
- Do NOT remove or restructure the existing SS3.1 content. Only update the variance formula and add the new SS3.1a subsection.
- Do NOT specify a running/cross-iteration variance. The variance is computed fresh each iteration from that iteration's forward pass scenarios. There is no accumulated variance across iterations.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable -- specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: None (independent of LP layout specifics)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
