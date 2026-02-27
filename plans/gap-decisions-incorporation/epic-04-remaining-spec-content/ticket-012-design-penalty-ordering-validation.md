# ticket-012 Design Penalty Ordering Validation Checks

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-025 decision to design penalty ordering validation checks. The current spec says penalty priority ordering "must be maintained" but provides no enforcement. Add validation rules that check the qualitative ordering (Filling target > Storage violation > Deficit > Constraint violations > Resource costs > Regularization) and emit a **warning** (not error) if violated. Document that violations may cause suboptimal policy behavior but do not break algorithmic correctness. Specify which specific penalty pairs are validated and the comparison logic.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/data-model/penalty-system.md` (near the ordering specification), `src/specs/architecture/input-loading-pipeline.md` (validation rules section SS2.6 or a new subsection), possibly `src/specs/architecture/validation-architecture.md`
- **Key decisions needed**: Which specific penalty pairs to validate (all adjacent pairs in the ordering, or only critical pairs like deficit vs regularization?); whether the validation produces a single warning or per-violation warnings; whether the FPHA validation rule (already exists) is the only hard error or if some ordering violations should also be hard errors
- **Open questions**: How does the three-tier penalty cascade (global -> entity -> stage) interact with ordering validation? Should ordering be checked after cascade resolution (per entity, per stage) or only at the global defaults level?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
