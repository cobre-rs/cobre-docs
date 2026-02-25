# Epic 04: Wall-Clock Time Model & Performance Targets

## Goals

Build a documented, defensible wall-clock time model that computes whether the production case (50 iterations, 192 forward passes, 64 AMD EPYC ranks, 24 threads/rank) can complete under 2 hours. Replace the current "aspirational" and "non-binding" performance target language in `production-scale-reference.md` with a model-based estimate that has explicit, reviewable assumptions. The model must account for forward pass time, backward pass time, synchronization overhead, and cut exchange.

## Scope

### In Scope

- Building the timing model from documented parameters (LP solve time, stage count, pass count, rank count, thread count)
- Computing forward pass time: 192 passes / 64 ranks = 3 passes/rank, 120 stages, LP solve time per stage
- Computing backward pass time: 120 stages × 192 openings, distributed across 24 threads/rank
- Modeling synchronization overhead: MPI_Allgatherv per stage boundary in backward pass
- Modeling cut exchange overhead: per-stage cut synchronization volume
- Determining whether 50 iterations × (forward + backward + overhead) < 7200 seconds
- Updating production-scale-reference.md section 4 with model-based estimates

### Out of Scope

- Running actual solver benchmarks (no Cobre code exists yet to benchmark)
- Changing the LP sizing calculator
- Modifying the parallelization strategy

## Tickets

| ID         | Title                                            | Scope                                                                               | Estimate |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- | -------- |
| ticket-013 | Build forward and backward pass timing model     | Derive per-iteration time from LP solve targets and parallelism parameters          | 3 points |
| ticket-014 | Model synchronization and communication overhead | Compute MPI overhead from communication pattern specs and add to iteration model    | 2 points |
| ticket-015 | Update performance target language in specs      | Replace "aspirational" language with model-based estimates, add assumptions section | 3 points |

## Dependencies

- **Depends on**: Epic 03 (needs the corrected 192 forward passes and verified sizing values)

## Success Criteria

- A documented timing model with explicit assumptions for every parameter
- The model produces a total wall-clock time estimate for 50 iterations
- The estimate is either (a) below 2 hours with margin, or (b) identifies what parameters need to change to meet the target
- production-scale-reference.md section 4 is updated with model-based estimates
- The "aspirational" / "non-binding" disclaimers are replaced or supplemented with the model's confidence level
- mdBook builds cleanly
