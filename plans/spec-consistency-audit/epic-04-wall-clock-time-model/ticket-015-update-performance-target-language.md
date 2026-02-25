# ticket-015 Update Performance Target Language in Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Replace the "aspirational" and "non-binding estimates pending solver benchmarking" language in `production-scale-reference.md` section 4 with model-based estimates derived from tickets 013-014. Add an explicit "Assumptions" subsection listing every assumption the timing model relies on (LP solve time, warm-start hit rate, communication bandwidth, parallel efficiency). Update the forward/backward time columns in the section 4.2 test systems table to reflect the model's predictions. Ensure the updated language communicates the confidence level (model-based estimate vs empirical measurement).

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/overview/production-scale-reference.md` section 4 (performance expectations)
  - Possibly `src/specs/hpc/communication-patterns.md` section 3 (if the "<2% overhead" claim needs updating)
  - Possibly `src/specs/hpc/memory-architecture.md` (if memory estimates change with 192 passes)
- **Key decisions needed**:
  - How to frame the model estimates: "Model-based estimate: X seconds per iteration (assumptions: ...)" vs updating the table values directly
  - Whether to keep the "aspirational" qualifier alongside the model estimate (hedging) or remove it entirely
  - Whether to add a "Wall-Clock Time Budget" subsection that breaks down the 2-hour target into per-iteration budget
- **Open questions**:
  - Should the timing model be placed in production-scale-reference.md or in a separate document?
  - How to present sensitivity analysis (e.g., "if LP solve time doubles to 4ms, total time is still under 2 hours")?
  - Should the model distinguish between the "steady state" iteration (full cut pool) and early iterations (few cuts, faster LP solves)?

## Dependencies

- **Blocked By**: ticket-013, ticket-014 (needs the complete timing model)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
