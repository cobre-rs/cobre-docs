# ticket-007 Uniformize Scenario Notation and Remove Legacy Stage Fields

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-031 decision to uniformize scenario notation to `scenario_source` by removing the legacy `num_scenarios` and `sampling_method` fields from `StageSamplingConfig` and `SamplingMethod` enum in `src/specs/data-model/internal-structures.md` section 12. Replace with a per-stage `scenario_source` field that aligns with the `stages.json` `scenario_source` configuration already documented in `configuration-reference.md`. Update all cross-references to the removed fields.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/data-model/internal-structures.md` (section 12.5 StageSamplingConfig, section 12.6 Stage struct, possibly section 12.1 SamplingMethod enum), `src/specs/configuration/configuration-reference.md` (section 8 example stages.json), possibly `src/specs/data-model/input-scenarios.md` (field tables)
- **Key decisions needed**: What replaces `StageSamplingConfig` -- does `scenario_source` become a field directly on `Stage`, or is there a new `ScenarioSourceConfig` struct? Should `SamplingMethod` enum be removed entirely or renamed?
- **Open questions**: How many files reference `num_scenarios` or `sampling_method` by name? Does the example `stages.json` in configuration-reference.md need updating (it currently shows `"num_scenarios": 20` and `"sampling_method": "saa"`)?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
