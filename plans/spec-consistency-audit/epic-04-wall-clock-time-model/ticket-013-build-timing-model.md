# ticket-013 Build Forward and Backward Pass Timing Model

## Context

### Background

The Cobre SDDP specification corpus states a performance target of "complete under 2 hours" for the production case (50 iterations, 192 forward passes, 200 openings, 64 MPI ranks, 24 threads/rank, 120 stages). However, no documented derivation exists showing whether this target is achievable. The current `production-scale-reference.md` §4 describes the timing targets as "aspirational" and "pending solver benchmarking." This ticket builds the first-principles timing model from the spec parameters.

### Relation to Epic

This is the foundation ticket for Epic 04 (Wall-Clock Time Model & Performance Targets). It produces the core timing derivation that ticket-014 extends with synchronization overhead and ticket-015 uses to update the spec language. Without this model, the other two tickets have no basis.

### Current State

- `production-scale-reference.md` §4.2 contains a test systems table with timing columns (Forward Time, Backward Time) that show aspirational targets: "<30s" forward, "<90s" backward for production scale. These are not derived from any model.
- `production-scale-reference.md` §4.3 defines LP solve KPIs: <2 ms warm-start, <20 ms cold-start.
- `work-distribution.md` §2.2 specifies backward pass mechanics: trial points distributed across ranks, each thread evaluates all openings for its assigned trial points sequentially (preserving warm-start).
- `communication-patterns.md` §3.2 estimates "<1%" communication overhead on InfiniBand.
- Epic 03 confirmed: 192 forward passes, 200 openings, state dimension 1,120 (avg AR(6)) or 2,080 (worst-case AR(12)).
- The LP sizing calculator (verified in ticket-010) produces: 6,923 variables, 5,788 active constraints at avg AR(6).

## Specification

### Requirements

1. **Produce a new markdown section** (to be placed in `production-scale-reference.md` by ticket-015) containing a complete wall-clock timing derivation for one SDDP iteration at production scale.
2. **Model the forward pass critical path** from first principles:
   - 192 trajectories / 64 ranks = 3 trajectories per rank
   - 3 trajectories distributed to 24 threads via `schedule(dynamic,1)` => 3 threads active
   - Each active thread: 120 stages sequentially, 1 LP solve per stage (blocks are within the LP, not separate solves)
   - Per-rank forward time = 120 × LP_solve_time (3 trajectories execute in parallel on 3 threads)
   - Thread utilization: 3/24 = 12.5%
3. **Model the backward pass critical path** from first principles:
   - 119 stages processed sequentially (T down to 2)
   - At each stage: 192 trial points / 64 ranks = 3 trial points per rank
   - 3 trial points distributed to 24 threads via `schedule(dynamic,1)` => 3 threads active
   - Each active thread: 200 openings solved sequentially (warm-start preserved per `work-distribution.md` §2.3)
   - Per-rank per-stage backward time = 200 × LP_solve_time (3 trial points finish in parallel, each doing 200 solves)
   - Total backward time = 119 × 200 × LP_solve_time
   - Thread utilization: 3/24 = 12.5%
4. **Compute per-iteration time** = forward_time + backward_time (sync overhead added in ticket-014).
5. **Compute 50-iteration total** and compare against 7,200-second budget.
6. **Document all assumptions** explicitly: LP solve time, warm-start hit rate, warm-start vs cold-start ratio, block-within-LP clarification.
7. **Provide sensitivity table** showing total time at LP solve times of 1 ms, 2 ms, 4 ms, 10 ms, and 20 ms.
8. **Identify the thread utilization concern**: only 3/24 threads active in both forward and backward pass at 64 ranks. Note that this is a consequence of the rank count (64) being large relative to the pass count (192). Note the alternative deployment scenarios where utilization is better (e.g., 16 ranks × 12 threads from `work-distribution.md` §2.3 example: 192/16=12 trial points per rank, 12 threads => 12/12 = 100% utilization).
9. **Write the model as a standalone analysis document** at `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md`. This document will be the source material that ticket-015 distills into spec sections.

### Inputs/Props

All inputs come from existing specs — no new data is needed:

| Parameter                  | Value                                        | Source                                           |
| -------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Forward passes (M)         | 192                                          | `production-scale-reference.md` §1               |
| Openings (N_openings)      | 200                                          | `production-scale-reference.md` §1               |
| Stages (T)                 | 120                                          | `production-scale-reference.md` §1               |
| Iterations                 | 50                                           | `production-scale-reference.md` §1               |
| MPI ranks (R)              | 64                                           | `production-scale-reference.md` §4.2             |
| Threads per rank           | 24                                           | `production-scale-reference.md` §4.2             |
| LP solve warm-start target | <2 ms                                        | `production-scale-reference.md` §4.3             |
| LP solve cold-start target | <20 ms                                       | `production-scale-reference.md` §4.3             |
| Warm-start hit rate        | >70%                                         | `production-scale-reference.md` §4.3             |
| LP variables               | 6,923                                        | `production-scale-reference.md` §3.4 (avg AR(6)) |
| Active constraints         | 5,788                                        | `production-scale-reference.md` §3.4 (avg AR(6)) |
| Backward pass distribution | Scenario-based, sequential openings          | `work-distribution.md` §2.2-§2.3                 |
| Forward pass distribution  | Contiguous block, thread-trajectory affinity | `work-distribution.md` §1.1-§1.2                 |

### Outputs/Behavior

The analysis document must contain:

1. **Parameter table**: All input parameters with sources
2. **Forward pass timing derivation**: Step-by-step arithmetic showing per-rank, per-iteration forward time
3. **Backward pass timing derivation**: Step-by-step arithmetic showing per-rank, per-stage, per-iteration backward time
4. **Per-iteration total** (compute only, no sync overhead — that is ticket-014's scope)
5. **50-iteration projection**
6. **Sensitivity analysis table**: Total 50-iteration time at 5 LP solve time points
7. **Thread utilization analysis**: Utilization at 64-rank deployment vs alternative rank/thread configurations
8. **Assumptions register**: Every assumption explicitly listed with its source and confidence level

### Error Handling

- If the model shows the 2-hour target is infeasible at the <2 ms LP solve target, document the gap and identify which parameter(s) would need to change (fewer ranks for better utilization, faster LP solver, fewer openings, etc.)
- If the warm-start assumption significantly affects the result, show both warm-start and cold-start scenarios

## Acceptance Criteria

- [ ] Given the production parameters (192 forward, 200 openings, 64 ranks, 24 threads, 120 stages, 50 iterations), when the forward pass is modeled, then the derivation shows: per-rank forward time = 120 × LP_solve_time, with 3/24 = 12.5% thread utilization
- [ ] Given the same parameters, when the backward pass is modeled, then the derivation shows: per-iteration backward time = 119 × 200 × LP_solve_time, with 3/24 = 12.5% thread utilization per rank
- [ ] Given LP_solve_time = 2 ms (warm-start target), when per-iteration compute is summed (forward + backward), then the result equals (120 + 119 × 200) × 0.002 = (120 + 23,800) × 0.002 = 23,920 × 0.002 = 47.84 seconds (approximately)
- [ ] Given 50 iterations at ~47.84 s/iteration compute, then the 50-iteration compute total is ~2,392 seconds, well under 7,200 seconds
- [ ] The sensitivity table shows total 50-iteration time at LP solve times of 1, 2, 4, 10, and 20 ms
- [ ] The thread utilization section identifies that at 64 ranks, only 12.5% of threads are active, and shows at least one alternative configuration (e.g., 16 ranks × 12 threads) where utilization is better
- [ ] The assumptions register lists every parameter used with its source spec and section
- [ ] The analysis is self-contained in `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md`
- [ ] The warm-start hit rate assumption and its impact on the effective LP solve time is quantified

## Implementation Guide

### Suggested Approach

1. **Read the input specs** listed in the Inputs table above to confirm all parameter values.
2. **Derive the forward pass model**:
   - Trajectories per rank: `ceil(192/64) = 3` (192 divides 64 evenly)
   - Active threads per rank: `min(3, 24) = 3`
   - Per-trajectory time: `120 stages × LP_time`
   - Per-rank forward time: `max over 3 threads = 120 × LP_time` (all 3 finish simultaneously with identical work)
   - Thread utilization: `3/24 = 12.5%`
3. **Derive the backward pass model**:
   - Trial points per rank per stage: `192/64 = 3`
   - Active threads per rank per stage: `min(3, 24) = 3`
   - Per-trial-point per-stage time: `200 openings × LP_time` (sequential, preserving warm-start)
   - Per-rank per-stage backward time: `200 × LP_time` (3 trial points finish in parallel)
   - Per-iteration backward time: `119 stages × 200 × LP_time` (stages are sequential)
   - Thread utilization: `3/24 = 12.5%`
4. **Combine**: `T_iter = T_forward + T_backward = (120 + 119 × 200) × LP_time`
5. **Sensitivity**: Compute for LP_time in {1 ms, 2 ms, 4 ms, 10 ms, 20 ms}
6. **Utilization analysis**: Compute for alternative configurations (R=16, T_r=12; R=8, T_r=16; R=32, T_r=24) showing trial_points_per_rank = 192/R and thread utilization = min(192/R, T_r) / T_r
7. **Assumptions register**: Tabulate every parameter with source.
8. **Write the document** to the output path.

### Key Files to Read

| File                                               | Section       | Purpose                                 |
| -------------------------------------------------- | ------------- | --------------------------------------- |
| `src/specs/overview/production-scale-reference.md` | §1, §4.1-§4.3 | Parameter values, KPIs                  |
| `src/specs/hpc/work-distribution.md`               | §1.1-§2.3     | Forward/backward distribution mechanics |
| `src/specs/architecture/training-loop.md`          | §4, §6        | Forward/backward pass structure         |
| `src/specs/hpc/communication-patterns.md`          | §2, §3        | Payload sizes (context for ticket-014)  |

### Key File to Create

- `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md`

### Patterns to Follow

- **Thematic evidence tables** pattern from Epics 01-03: present the model as a structured table-driven analysis
- **Source column pattern** from Epic 03 (`production-scale-reference.md` §3.1): annotate every value with its source
- **Assumptions-register pattern**: explicitly list every assumption with confidence level (High = from spec, Medium = reasonable engineering estimate, Low = needs validation)
- Use exact arithmetic, not approximations. Show the formula, then the numerical substitution, then the result.

### Pitfalls to Avoid

- **Do not conflate blocks with LP solves**: Blocks (1-24 per stage, typically 3) increase LP size but there is still ONE LP solve per stage in the forward pass and ONE LP solve per opening in the backward pass. The blocks are structural components within the LP (variables like `N_hydro × N_block` turbined flow, constraints like `N_bus × N_block` load balance).
- **Do not assume openings are parallelized across threads**: `work-distribution.md` §2.3 explicitly states openings are evaluated sequentially by the owning thread to preserve warm-start.
- **Do not assume all threads are active**: At 64 ranks with 192 passes, only 3 trial points per rank => only 3 of 24 threads active.
- **Do not include synchronization overhead**: That is ticket-014's scope. This ticket produces compute-only timing.
- **Do not conflate warm-start hit rate across passes**: Forward pass warm-start is between consecutive stages of the same trajectory (§4.3 KPIs say >70%). Backward pass warm-start is between consecutive openings for the same trial point at the same stage (same LP structure, only RHS changes — expected to be very high, near 100%).

## Testing Requirements

### Verification Steps

- Arithmetic spot-check: at LP_time = 2 ms, per-iteration compute = (120 + 23,800) × 0.002 = 47.84 s. 50 iterations = 2,392 s.
- Verify 2,392 s < 7,200 s (the 2-hour target), so the compute-only model fits with margin.
- Sensitivity check: at LP_time = 20 ms (cold-start worst case), per-iteration = (120 + 23,800) × 0.020 = 478.4 s, 50 iterations = 23,920 s >> 7,200 s. This should appear in the sensitivity table.
- Verify the analysis document references every spec section used.
- Verify mdBook still builds: `mdbook build` exits 0 (the analysis document is in the `plans/` directory, not in `src/`, so it does not affect the book build — but confirm).

## Dependencies

- **Blocked By**: ticket-011 (confirmed 192 forward passes — completed), ticket-012 (traceability annotations — completed)
- **Blocks**: ticket-014, ticket-015

## Effort Estimate

**Points**: 3
**Confidence**: High
