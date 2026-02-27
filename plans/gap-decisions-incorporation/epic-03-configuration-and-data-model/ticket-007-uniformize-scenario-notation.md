# ticket-007 Uniformize Scenario Notation and Remove Legacy Stage Fields

## Context

### Background

GAP-031 identified an inconsistency in the `Stage` struct defined in
`src/specs/data-model/internal-structures.md` section 12: the `Stage` has a
`sampling_config: StageSamplingConfig` field containing `num_scenarios` and
`sampling_method`, while the configuration reference and scenario generation specs
already use a top-level `scenario_source` concept in `stages.json` with a
`sampling_scheme` field. The gap decision is to uniformize the internal data model
to use `scenario_source`-aligned naming, removing the legacy `StageSamplingConfig`
struct and `SamplingMethod` enum.

The gap inventory resolution log (section 7) records: "Stage scenario fields
uniformized: `scenario_source` replaces `num_scenarios` and `sampling_method` legacy
fields. See Internal Structures and Simulation Architecture."

### Relation to Epic

This is the data model cleanup ticket in epic-03. It modifies the internal structures
spec to align the `Stage` struct with the already-established `scenario_source`
configuration pattern. It is independent of ticket-006 (configuration reference) and
ticket-008 (forward_passes immutability).

### Current State

**`src/specs/data-model/internal-structures.md` section 12:**

- **Section 12.1** (Supporting Enums): Contains `SamplingMethod` enum with variants
  `Saa`, `Lhs`, `QmcSobol`, `QmcHalton`, `Selective`. This enum describes how noise
  vectors are drawn.
- **Section 12.5** (`StageSamplingConfig`): A struct with two fields:
  `num_scenarios: usize` and `sampling_method: SamplingMethod`. Source annotation says
  `stages.json stages[].num_scenarios and stages[].sampling_method`.
- **Section 12.6** (`Stage`): Contains field `pub sampling_config: StageSamplingConfig`.
  The field descriptions table maps it to
  `stages.json stages[].num_scenarios, stages[].sampling_method`.

**`src/specs/configuration/configuration-reference.md`:**

- **Section 6.3**: Documents `scenario_source.sampling_scheme` as the per-stage field
  in `stages.json`, with values `in_sample`, `external`, `historical`. This is the
  forward-pass noise source selection.
- **Section 8**: The `stages.json` example still contains per-stage
  `"num_scenarios": 20` and `"sampling_method": "saa"` fields that should be removed.

**`src/specs/architecture/scenario-generation.md`:**

- **SS2.3**: References `StageSamplingConfig.num_scenarios` for the per-stage branching
  factor in the opening tree.
- **SS5**: References `sampling_method` for controlling noise vector generation algorithm.

**Key distinction**: `scenario_source.sampling_scheme` (in_sample / external / historical)
controls _which noise source_ the forward pass uses. `sampling_method` (saa / lhs /
qmc_sobol / etc.) controls _how_ the opening tree noise vectors are generated. These are
orthogonal concepts (scenario-generation.md SS5 clarifies this). The `SamplingMethod`
enum is still semantically valid but needs to be renamed/relocated to align with
`scenario_source` vocabulary, and `num_scenarios` should become part of the scenario
source configuration rather than a standalone stage field.

**Files that reference `num_scenarios`, `sampling_method`, `SamplingMethod`, or
`StageSamplingConfig` by name:**

- `src/specs/data-model/internal-structures.md` (primary target)
- `src/specs/data-model/input-scenarios.md` (JSON schema; per-stage field tables)
- `src/specs/data-model/input-directory-structure.md` (stages.json description)
- `src/specs/configuration/configuration-reference.md` (section 8 example)
- `src/specs/architecture/scenario-generation.md` (SS2.3 branching factor, SS5 method)
- `src/specs/architecture/validation-architecture.md` (validation rule references)

## Specification

### Requirements

1. **Replace `StageSamplingConfig` struct** in internal-structures.md section 12.5:
   - Remove the `StageSamplingConfig` struct definition.
   - Replace it with a `ScenarioSourceConfig` struct that groups the scenario-related
     fields under `scenario_source`-aligned naming:
     - `branching_factor: usize` (replaces `num_scenarios`) — number of noise
       realizations per stage for both the opening tree and forward pass.
     - `noise_method: NoiseMethod` (replaces `sampling_method`) — algorithm for
       generating noise vectors (SAA, LHS, QMC-Sobol, QMC-Halton, Selective).
   - Source annotation: `stages.json scenario_source` (top-level) and per-stage overrides.

2. **Rename `SamplingMethod` enum** in section 12.1:
   - Rename to `NoiseMethod` to distinguish from `SamplingScheme` (which is the
     forward-pass noise source selection in scenario-generation.md SS3).
   - Keep the same variants (`Saa`, `Lhs`, `QmcSobol`, `QmcHalton`, `Selective`).
   - Update the doc comment to clarify that this controls opening tree noise generation
     algorithm, orthogonal to `SamplingScheme`.

3. **Update `Stage` struct** in section 12.6:
   - Replace `pub sampling_config: StageSamplingConfig` with
     `pub scenario_config: ScenarioSourceConfig`.
   - Update the field descriptions table accordingly.

4. **Update the `stages.json` example** in configuration-reference.md section 8:
   - Remove per-stage `"num_scenarios": 20` and `"sampling_method": "saa"` fields from
     both stage objects.
   - The top-level `"scenario_source"` and `"n_openings"` fields already exist in the
     example and are correct.

5. **Update cross-references** in files that reference the renamed types:
   - `src/specs/architecture/scenario-generation.md` SS2.3: Change
     `StageSamplingConfig.num_scenarios` to `ScenarioSourceConfig.branching_factor`.
   - `src/specs/architecture/scenario-generation.md` SS5: Change `sampling_method`
     references to `noise_method` / `NoiseMethod`.
   - `src/specs/data-model/input-scenarios.md`: Update per-stage field tables to use
     `branching_factor` and `noise_method` naming where they reference internal struct
     fields (JSON field names `num_scenarios` and `sampling_method` in the input schema
     may remain as-is since that is the external JSON contract; the input loading pipeline
     maps them to the internal names).
   - `src/specs/architecture/validation-architecture.md`: Update references to
     `num_scenarios` in validation rule descriptions to `branching_factor`.

### Inputs/Props

- GAP-031 decision: uniformize to `scenario_source`-aligned naming
- Current `StageSamplingConfig`, `SamplingMethod`, and `Stage` definitions in
  internal-structures.md section 12

### Outputs/Behavior

- Renamed struct (`ScenarioSourceConfig`), renamed enum (`NoiseMethod`), updated
  `Stage` field, updated cross-references across 5 files
- No new files created; no sections added or removed

### Error Handling

N/A (spec document edits only).

### Out of Scope

- Changing the JSON field names in the input schema (`stages.json` still uses
  `num_scenarios` and `sampling_method` as external JSON keys; only the internal Rust
  type names change).
- Modifying `src/specs/interfaces/mcp-server.md` (the MCP tool schemas reference
  `num_scenarios` in a simulation context unrelated to the Stage struct).
- Modifying `src/specs/overview/spec-gap-inventory.md` (already updated by ticket-001).
- Adding new sections to any file; this ticket only renames/replaces existing content.

## Acceptance Criteria

- [ ] Given `internal-structures.md` section 12.1, when the ticket is complete, then
      the enum formerly named `SamplingMethod` is now named `NoiseMethod` with the same
      five variants and a doc comment distinguishing it from `SamplingScheme`.
- [ ] Given `internal-structures.md` section 12.5, when the ticket is complete, then
      `StageSamplingConfig` no longer exists and is replaced by `ScenarioSourceConfig` with
      fields `branching_factor: usize` and `noise_method: NoiseMethod`.
- [ ] Given `internal-structures.md` section 12.6, when the ticket is complete, then
      the `Stage` struct field reads `pub scenario_config: ScenarioSourceConfig` and the
      field descriptions table references the new struct name.
- [ ] Given `configuration-reference.md` section 8, when the ticket is complete, then
      neither stage object in the `stages.json` example contains `"num_scenarios"` or
      `"sampling_method"` keys.
- [ ] Given `scenario-generation.md` SS2.3, when the ticket is complete, then references
      to `StageSamplingConfig.num_scenarios` are replaced with
      `ScenarioSourceConfig.branching_factor`.
- [ ] Given the completed files, when `mdbook build` is run, then the build succeeds
      with no new errors.

## Implementation Guide

### Suggested Approach

1. Start with `src/specs/data-model/internal-structures.md`:
   a. In section 12.1, rename `SamplingMethod` to `NoiseMethod`. Update the doc comment
   to explain that this controls opening tree noise generation, not the forward pass
   noise source (which is `SamplingScheme`).
   b. In section 12.5, replace the `StageSamplingConfig` struct with
   `ScenarioSourceConfig`. Update field names and doc comments. Update the Source
   annotation to reference `stages.json scenario_source`.
   c. In section 12.6, replace `sampling_config: StageSamplingConfig` with
   `scenario_config: ScenarioSourceConfig` in the `Stage` struct and field table.
2. Open `src/specs/configuration/configuration-reference.md` section 8 and remove
   `"num_scenarios"` and `"sampling_method"` from both stage objects in the `stages.json`
   example.
3. Open `src/specs/architecture/scenario-generation.md`:
   a. In SS2.3, replace `StageSamplingConfig.num_scenarios` with
   `ScenarioSourceConfig.branching_factor`.
   b. In SS5, replace `sampling_method` references with `noise_method` / `NoiseMethod`.
4. Open `src/specs/data-model/input-scenarios.md` and update any references to the
   internal struct field names (note: JSON schema field names remain unchanged).
5. Open `src/specs/architecture/validation-architecture.md` and update `num_scenarios`
   references in validation rule descriptions.
6. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/data-model/internal-structures.md` — sections 12.1, 12.5, 12.6
- `src/specs/configuration/configuration-reference.md` — section 8 (stages.json example)
- `src/specs/architecture/scenario-generation.md` — SS2.3, SS5
- `src/specs/data-model/input-scenarios.md` — per-stage field table
- `src/specs/architecture/validation-architecture.md` — validation rule references

### Patterns to Follow

- **Struct definition template** (from learnings): prose summary, Rust code block with
  `///` doc comments, field descriptions table, design note.
- **Bidirectional cross-referencing** (from learnings): when renaming a type, update both
  the defining file and all consuming files.
- **Section prefix rules**: `SS` in architecture files, plain numbers in data-model and
  configuration files, `§` only for HPC file references.

### Pitfalls to Avoid

- Do NOT change the JSON field names in `stages.json` schema (`num_scenarios`,
  `sampling_method`). Those are external contract. Only the internal Rust struct/enum
  names change.
- Do NOT confuse `NoiseMethod` (how noise vectors are generated: SAA, LHS, etc.) with
  `SamplingScheme` (which noise source the forward pass uses: in_sample, external,
  historical). These are orthogonal and documented in different specs.
- Watch for the `input-directory-structure.md` reference at line 86 which mentions
  `sampling method` and `num_scenarios` in a file description table — this describes the
  JSON file content, not the Rust struct, so it should NOT change.

## Testing Requirements

### Unit Tests

N/A (spec document, not code).

### Integration Tests

- Run `mdbook build` from the repo root and verify zero new errors.
- Search for orphaned references: `grep -r "StageSamplingConfig\|SamplingMethod"
src/specs/` should return zero results after completion (excluding
  `spec-gap-inventory.md` which contains historical resolution log text).

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
