# ticket-013 Build Forward and Backward Pass Timing Model

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Derive a per-iteration wall-clock time estimate for the production case (192 forward passes, 64 ranks, 24 threads/rank, 120 stages) by modeling the forward pass and backward pass execution from first principles using the LP solve time targets in production-scale-reference.md section 4.3 and the parallelism parameters from the HPC specs. The model must separate forward time, backward time, and identify the critical path.

## Anticipated Scope

- **Files likely to be modified**: None initially (produces a model document); may later feed into ticket-015
- **Key decisions needed**:
  - LP solve time assumption: use the <2ms warm-start target from production-scale-reference section 4.3, or derive from LP problem size (~6,923 variables, ~5,788 active constraints)?
  - Forward pass critical path: 192 passes / 64 ranks = 3 passes/rank, each sequential over 120 stages. Each stage: 1 LP solve. Per-rank forward time = 3 × 120 × LP_time. No inter-rank sync during forward pass.
  - Backward pass critical path: 120 stages sequentially. Per stage: each rank handles its trial points (192/64 = 3 per rank), each trial point evaluates 192 openings sequentially per thread. Per-rank per-stage = ceil(3/24) = 1 trial-point-batch × 192 × LP_time. Wait -- need to clarify: 192 openings total or 192 per trial point?
  - Thread distribution in backward pass: 3 trial points per rank, 24 threads per rank. With dynamic scheduling, each thread handles ceil(3/24) < 1 trial points, so effectively 3 threads active, 21 idle? Or are trial points from ALL forward passes distributed differently?
- **Open questions**:
  - The forward pass generates 192 trial points total (one per forward trajectory per stage). In the backward pass, ALL 192 trial points at each stage are distributed across ALL 64 ranks. So each rank handles 192/64 = 3 trial points per stage. Each trial point requires evaluating all 192 openings sequentially (per work-distribution.md section 2.2). With 24 threads and 3 trial points, dynamic scheduling gives 3 threads active, each doing 192 LP solves. The other 21 threads are idle. Is this the correct interpretation?
  - Should the model consider the scenario where openings count differs from forward pass count (the spec says openings = 200 currently, forward passes = 200)?
  - What is the warm-start hit rate assumption for backward pass (where RHS changes between openings but LP structure is identical)?

## Dependencies

- **Blocked By**: ticket-011 (needs confirmed 192 forward passes and openings count decision)
- **Blocks**: ticket-014, ticket-015

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
