# ticket-011 Update Forward Pass Count From 200 to 192

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Change the forward pass count from 200 to 192 in `production-scale-reference.md` and every other spec that references this value. Update all dependent calculations that are derived from the forward pass count, including: backward pass opening counts, communication payload sizes (MPI_Allgatherv volumes), parallelism arithmetic (passes per rank, passes per thread), memory estimates for forward pass state, and the performance expectation table.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/overview/production-scale-reference.md` (section 1 dimensions table, section 4.2 test systems table, section 4.4 scaling expectations)
  - `src/specs/hpc/work-distribution.md` (section 2.3 production-scale example arithmetic)
  - `src/specs/hpc/communication-patterns.md` (section 2.1 trial point payload, section 2.2 cut payload, section 3 volume analysis)
  - `src/specs/hpc/memory-architecture.md` (section 2.1 forward pass state and opening tree)
  - `src/specs/architecture/scenario-generation.md` (if it references 200 openings)
  - `src/specs/math/sddp-algorithm.md` (if 200 is mentioned in examples)
  - Other files identified in ticket-003 findings report
- **Key decisions needed**:
  - Should "openings" also change from 200 to 192, or do openings remain at 200 (since openings are the branching factor for backward pass, independent of forward pass count)?
  - How does 192 distribute across 64 ranks (192/64 = 3 per rank exactly, cleaner than 200/64 = 3.125)?
- **Open questions**:
  - The production-scale-reference section 4.2 table currently shows 200 forward passes for both "Large" and "Production" scales -- should "Large" also change?
  - Does the LP sizing calculator default `n_forward_passes` need updating to 192, or is the calculator considered out of scope?

## Dependencies

- **Blocked By**: ticket-010 (must have the full value cross-check before changing values)
- **Blocks**: ticket-012

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
