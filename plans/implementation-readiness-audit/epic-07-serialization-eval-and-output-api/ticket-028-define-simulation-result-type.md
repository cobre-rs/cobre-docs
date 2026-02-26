# ticket-028 Define SimulationScenarioResult Type and Simulate Signature

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Define the `SimulationScenarioResult` Rust type and the `fn simulate(...)` orchestrator function signature in `src/specs/architecture/simulation-architecture.md`. This type is the per-scenario output record that the simulation pipeline produces and the output writer consumes. Without it, the output writer API (ticket-029/C-13) cannot define method signatures because it does not know the input type. The definition should be informed by the training pipeline's `TrajectoryRecord` pattern (which will be established after Epic 05 entity structs are available) and the output schema definitions already present in `src/specs/data-model/output-schemas.md`.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/simulation-architecture.md` (primary -- add struct definition and function signature), possibly `src/specs/data-model/internal-structures.md` (if the result type needs to reference entity structs from Epic 05)
- **Key decisions needed**: (1) Whether `SimulationScenarioResult` holds flattened field-per-column data (matching Parquet output schema) or structured nested data (matching domain concepts); (2) Whether the `simulate()` function returns `Vec<SimulationScenarioResult>` or uses a streaming/channel pattern consistent with the output infrastructure spec; (3) Whether the type includes all scenario metadata (scenario index, seed, stage sequence) or only the per-stage results
- **Open questions**: Does the existing `output-schemas.md` simulation Parquet schema fully constrain the struct fields, or are there additional fields needed for the training convergence output? How does the bounded-channel streaming pattern in `output-infrastructure.md` affect the function signature (return type vs callback)?

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md (entity struct definitions may be needed for result type fields)
- **Blocks**: ticket-029-define-output-writer-api.md (output writer methods consume `SimulationScenarioResult`)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
