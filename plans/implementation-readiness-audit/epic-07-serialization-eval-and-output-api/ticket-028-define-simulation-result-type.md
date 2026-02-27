# ticket-028 Define SimulationScenarioResult Type and Simulate Signature

## Context

### Background

The simulation architecture spec (`simulation-architecture.md`) describes the full simulation pipeline -- scenario distribution, per-scenario forward pass, statistics computation, output streaming -- but provides no Rust type for the per-scenario result payload. Report-015 (data traceability, Finding 2) identified this as GAP-030: the `SimulationScenarioResult` type is absent from the spec corpus. Without it, cobre-sddp cannot define what the simulation pipeline produces, and cobre-io cannot define what the output writer consumes. The bounded channel connecting simulation threads to the I/O background thread (`simulation-architecture.md` SS6.1) has no payload type.

This is half of condition C-14 from the readiness verdict. The other half -- the output writer API -- is ticket-029, which depends on this ticket because the writer method signatures consume `SimulationScenarioResult`.

### Relation to Epic

This is the second ticket in Epic 07. It is independent of ticket-027 (rkyv evaluation) and blocks ticket-029 (output writer API). The type defined here bridges cobre-sddp (producer) and cobre-io (consumer) at the Phase 7 crate boundary.

### Current State

- `simulation-architecture.md` SS3.2 describes the per-scenario forward pass steps but defines no result struct
- `simulation-architecture.md` SS6.1 describes the bounded channel streaming architecture without a payload type
- `output-schemas.md` SS5.1--5.11 defines all 11 simulation entity Parquet schemas with full column definitions
- `output-infrastructure.md` SS3 defines Hive partitioning by `scenario_id` with per-rank write assignment
- `internal-structures.md` SS1 defines the `System` struct, entity types (`Bus`, `Line`, `Hydro`, `Thermal`, etc.), and `EntityId`
- GAP-030 in `spec-gap-inventory.md` describes the missing `TrajectoryRecord` for training and by extension the missing `SimulationScenarioResult` for simulation
- The training loop's `TrajectoryRecord` (GAP-030 resolution path) is a per-scenario, per-stage buffer for the backward pass; the simulation equivalent is a per-scenario, all-stages result for output writing

## Specification

### Requirements

1. Add a new section to `src/specs/architecture/simulation-architecture.md` (between the current SS6 "Output Streaming" and the Cross-References section, or as a new subsection of SS3 or SS6) defining the `SimulationScenarioResult` struct and the `fn simulate()` orchestrator function signature
2. The struct must hold all data needed to write every column defined in `output-schemas.md` SS5.1--5.11 for one scenario
3. The struct must be `Send` (required for the bounded channel in SS6.1)
4. The `fn simulate()` signature must specify: inputs (System reference, FCF policy, scenario assignments, config), return type, and crate ownership (cobre-sddp)
5. The design must be consistent with the streaming architecture in SS6.1: results are produced per-scenario and streamed through a bounded channel, not accumulated in a `Vec<SimulationScenarioResult>`

### Design Decisions to Make Explicit

1. **Flat vs. nested data**: The struct should use a nested design (per-entity-type `Vec`s grouped by stage) rather than a flattened Parquet-column layout. Rationale: the simulation loop produces results stage-by-stage; the output writer is responsible for columnar conversion during Parquet serialization. The nested layout matches the production flow.
2. **Vec return vs. streaming/channel**: The `fn simulate()` function does NOT return `Vec<SimulationScenarioResult>`. Instead, it takes a `Sender<SimulationScenarioResult>` argument (the sending end of the bounded channel from SS6.1). Each scenario result is sent through the channel as soon as it completes. The function returns `Result<SimulationSummary, SimulationError>` where `SimulationSummary` holds the aggregate statistics from SS4.
3. **Metadata inclusion**: Each `SimulationScenarioResult` includes scenario-level metadata: `scenario_id: u32`, `total_cost: f64`, and `per_category_costs` (the compact cost buffer from SS3.3). Per-stage detail is included when the output detail level (SS6.2) is Stage-level or Full.

### Inputs/Props

- `System` reference (immutable, shared across all scenarios)
- FCF policy (trained cuts from cobre-sddp)
- Scenario assignments (which scenarios this rank processes)
- Simulation configuration (detail level, sampling scheme)
- `Sender<SimulationScenarioResult>` channel handle

### Outputs/Behavior

- Per-scenario `SimulationScenarioResult` sent through channel
- `SimulationSummary` returned after all scenarios complete (contains the aggregate statistics from SS4.1--4.4)

### Error Handling

- `SimulationError` type should be a lightweight enum consistent with the error patterns in the codebase (e.g., `LoadError` in `input-loading-pipeline.md` SS8.1)
- Infeasible LP at any stage is a hard error (per SS3.2 step c)

### Out of Scope

- Defining the output writer API (that is ticket-029)
- Defining the training `TrajectoryRecord` type (that is GAP-030's training-side resolution, a Phase 6 Resolve-During-Phase item)
- Defining the non-convex extension types (deferred per SS5)
- Implementing any Rust code

## Acceptance Criteria

- [ ] Given `simulation-architecture.md` is opened, when searching for `SimulationScenarioResult`, then a Rust struct definition is found with fields covering: `scenario_id: u32`, per-stage result vectors for costs, hydros, thermals, exchanges, buses, and optional entity types, and `Send` bound documentation
- [ ] Given the `SimulationScenarioResult` struct, when its fields are compared against `output-schemas.md` SS5.1--5.11, then every non-derived Parquet column (columns that are not computed during output writing) has a corresponding field or sub-field in the struct
- [ ] Given `simulation-architecture.md` is opened, when searching for `fn simulate`, then a function signature is found with parameters for System reference, FCF policy, scenario assignments, config, and a `Sender` channel handle
- [ ] Given the `fn simulate` signature, when the return type is inspected, then it returns `Result<SimulationSummary, SimulationError>` where `SimulationSummary` contains the aggregate statistics fields from SS4.1--4.4
- [ ] Given `simulation-architecture.md` is opened, when searching for `SimulationError`, then an error enum is found with at least variants for LP infeasibility and I/O failure
- [ ] Given the new section in `simulation-architecture.md`, when the streaming architecture in SS6.1 is re-read, then the channel payload type (`SimulationScenarioResult`) is referenced by name in SS6.1
- [ ] Given `mdbook build` is run from the repo root, then it completes without new errors or warnings attributable to changes in `simulation-architecture.md`

## Implementation Guide

### Suggested Approach

1. Read `simulation-architecture.md` in full to understand the simulation pipeline, output streaming (SS6), and statistics computation (SS4)
2. Read `output-schemas.md` SS5.1--5.11 to enumerate every column that the result type must cover
3. Read `internal-structures.md` SS1 to understand entity type definitions and EntityId
4. Read `output-infrastructure.md` SS3 to understand the write semantics (per-rank, per-scenario partitions)
5. Design the `SimulationScenarioResult` struct with nested per-entity-type sub-structs (e.g., `SimulationHydroResult`, `SimulationThermalResult`) matching the output schema entity groupings
6. Design the `SimulationSummary` struct with the aggregate statistics fields from SS4.1--4.4
7. Design the `SimulationError` enum
8. Write the `fn simulate()` function signature with doc-comments explaining each parameter
9. Add the new section to `simulation-architecture.md` (recommended location: new SS3.4 "Result Types" after SS3.3 "Memory Management", with forward reference from SS6.1)
10. Update SS6.1 to reference `SimulationScenarioResult` by name as the channel payload

### Key Files to Read

- `src/specs/architecture/simulation-architecture.md` (SS3, SS4, SS6)
- `src/specs/data-model/output-schemas.md` (SS5.1--5.11 for all simulation entity schemas)
- `src/specs/data-model/output-infrastructure.md` (SS3 for write semantics)
- `src/specs/data-model/internal-structures.md` (SS1 for entity types, SS11 for Stage/Block)

### Key Files to Create or Modify

- **Modify**: `src/specs/architecture/simulation-architecture.md` (add result type section, update SS6.1 channel reference)

### Patterns to Follow

- Follow the struct definition style from `internal-structures.md`: doc-comments on every field, `#[derive(...)]` annotations, explicit `Send` / `Sync` documentation
- Follow the function signature style from `input-loading-pipeline.md` SS8.1 (`load_case`): full doc-comment with `# Errors` section, explicit parameter documentation
- Follow the error enum style from `input-loading-pipeline.md` SS8.1 (`LoadError`): one variant per error category, descriptive variant names

### Pitfalls to Avoid

- Do not define per-block fields when `output-schemas.md` columns have `block_id: Yes (Nullable)` -- the struct should hold per-stage data that includes block-level detail when the block is present, matching the simulation loop's stage-by-stage production
- Do not include derived columns (e.g., `net_flow_mw = direct_flow_mw - reverse_flow_mw`) in the struct -- those are computed by the output writer during Parquet serialization
- Do not define the output writer interface here -- that is ticket-029's scope
- Do not break the existing section numbering in `simulation-architecture.md` -- if adding a new section, renumber subsequent sections or use a subsection (e.g., SS3.4)

## Testing Requirements

### Verification

- All columns from `output-schemas.md` SS5.1--5.11 are traceable to fields in `SimulationScenarioResult` (excluding derived columns)
- The struct is documented as `Send` for the bounded channel
- The `fn simulate()` signature is consistent with the streaming architecture described in SS6.1
- `mdbook build` passes without new errors

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md (entity struct definitions used by result type fields -- COMPLETED)
- **Blocks**: ticket-029-define-output-writer-api.md (output writer method signatures consume `SimulationScenarioResult`)

## Effort Estimate

**Points**: 2
**Confidence**: High (the output schemas fully constrain the struct fields; the streaming architecture constrains the function signature)
