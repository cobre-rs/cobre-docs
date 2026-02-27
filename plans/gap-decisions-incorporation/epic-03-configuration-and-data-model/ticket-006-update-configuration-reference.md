# ticket-006 Update Configuration Reference for GAP-019, 024, 027, 035

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/specs/configuration/configuration-reference.md` to incorporate four configuration-related gap decisions: (1) add solver retry parameters as per-solver external config with encapsulation note (GAP-019), (2) add `cut_activity_tolerance` parameter (GAP-024), (3) mark `training.forward_passes` as mandatory with no default (GAP-027), and (4) update the example `config.json` to use `"method": "level1"` and `"risk_measure": "expectation"` (GAP-035).

## Anticipated Scope

- **Files likely to be modified**: `src/specs/configuration/configuration-reference.md`, possibly `src/specs/architecture/solver-interface-trait.md` (for GAP-019 encapsulation boundary note)
- **Key decisions needed**: Whether solver retry config goes in a new `solver` section or under `training`; whether the encapsulation boundary note goes in configuration-reference.md or solver-interface-trait.md or both
- **Open questions**: Should `cut_activity_tolerance` go under `training.cut_selection` or as a top-level `training` parameter? What is the appropriate default for `cut_activity_tolerance` (GAP-024 suggests 1e-6)?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
