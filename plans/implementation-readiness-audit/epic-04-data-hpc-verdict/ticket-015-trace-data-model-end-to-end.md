# ticket-015 Trace Data Model End-to-End

## Context

### Background

The implementation-readiness-audit plan has completed three epics: Epic 01 produced per-crate API surface completeness audits for all 8 crates, Epic 02 triaged the 18 remaining Medium/Low gaps and verified cross-reference and shared-type consistency, and Epic 03 assessed phase readiness for all 8 implementation phases and audited the 7 testing specs for adequacy. The accumulated learnings consistently identify a "document behavior first, formalize types later" authoring pattern: schemas and behavioral contracts are strong, but Rust types and function signatures for I/O operations are systematically absent. This pattern is most acute in the output pipeline (GAP-020: 9 missing API elements) and was the root cause of the Phase 7 NOT READY verdict.

This ticket completes the data model traceability dimension of the audit by tracing every data format chain end-to-end -- from schema spec through loading/writing pipeline to in-memory or on-disk representation -- and identifying any chain where a link is missing.

### Relation to Epic

This is the first of three tickets in Epic 04 (Data Model, HPC, and Verdict). It executes in parallel with ticket-016 (HPC Spec Correctness). Both feed ticket-017 (Readiness Verdict), which synthesizes all 16 audit reports into the final GO / CONDITIONAL GO / NO-GO recommendation.

### Current State

The data model spec corpus spans three directories:

- `src/specs/data-model/` -- 10 files covering input schemas (entities, scenarios, constraints, hydro extensions, directory structure), output schemas (`output-schemas.md`), output infrastructure (`output-infrastructure.md`), binary formats (`binary-formats.md`), internal structures (`internal-structures.md`), and the penalty system
- `src/specs/architecture/` -- `input-loading-pipeline.md` (loading sequence and validation), `validation-architecture.md` (5-layer validation design)
- `src/specs/architecture/` -- `simulation-architecture.md` (simulation pipeline including streaming output)

Key findings from earlier epics that bound this ticket's scope:

- Report-001 (cobre-core): 47% COMPLETE; all entity types have prose/table descriptions but no Rust struct definitions. The `System` struct container is COMPLETE.
- Report-002 (cobre-io): output writer API completely absent (GAP-020). Input loading schemas fully specified. 9 distinct missing API elements on the output side.
- Report-013 (Phase 5-8 readiness): Phase 7 NOT READY due to 3 missing elements -- `SimulationScenarioResult` type, `fn simulate(...)` signature, and output writer API.
- Epic-03 learnings recommendation: "Data model end-to-end trace should target Phase 7 types specifically: verify that once `SimulationScenarioResult` is defined, it is consistent with `output-infrastructure.md` streaming architecture and `output-schemas.md` entity schemas."

## Specification

### Requirements

Trace the following data format chains and assess each for end-to-end completeness:

**Input chains (JSON/Parquet schema -> loading pipeline -> in-memory type):**

1. JSON entity registries (buses, lines, hydros, thermals, pumping stations, energy contracts, non-controllable sources) -> `input-loading-pipeline.md` SS2.2 -> `internal-structures.md` entity collections
2. JSON configuration files (config.json, stages.json, penalties.json, initial_conditions.json) -> `input-loading-pipeline.md` SS2.1 -> `internal-structures.md` resolved structures
3. Parquet scenario files (PAR parameters, correlation matrices, hydro geometry, FPHA hyperplanes) -> `input-loading-pipeline.md` SS2.3-2.4 -> `internal-structures.md` SS13-14
4. FlatBuffers policy files (cuts, states, vertices) -> `input-loading-pipeline.md` SS7 (warm-start) -> in-memory cut pool

**Output chains (in-memory source -> writing pipeline -> on-disk schema):**

5. Simulation results -> streaming channel -> Parquet per-entity schemas in `output-schemas.md`
6. Training convergence/timing -> writer -> Parquet training schemas in `output-schemas.md`
7. In-memory cut pool -> FlatBuffers serialization -> policy checkpoint files in `binary-formats.md` SS3
8. Metadata/manifest/dictionaries -> JSON/CSV writers -> `output-infrastructure.md` + `output-schemas.md` dictionaries

For each chain, classify completeness as:

- **COMPLETE**: schema defined, pipeline function specified (at least behaviorally), in-memory type defined or derivable
- **SCHEMA ONLY**: schema defined but loading/writing function unspecified
- **PARTIAL**: some links present, some missing (specify which)
- **MISSING**: fundamental link absent

### Inputs/Props

The report consumes existing spec files and prior audit reports (not re-auditing them):

- Data model specs: `src/specs/data-model/*.md` (all 10 files)
- Architecture specs: `src/specs/architecture/input-loading-pipeline.md`, `src/specs/architecture/simulation-architecture.md`, `src/specs/architecture/validation-architecture.md`
- Epic 01 reports: `report-001-cobre-core.md` (entity type completeness), `report-002-cobre-io.md` (I/O API completeness)
- Epic 03 report: `report-013-phase-5-8-readiness.md` (Phase 7 assessment, GAP-020 breakdown in section 4.4)

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-015-data-traceability.md`

The report structure:

1. **Executive summary** -- one-paragraph overview with aggregate chain completeness counts and the single most important finding
2. **Input chain assessments** (4 chains) -- per-chain traceability with schema source, pipeline function, target in-memory type, verdict, and gap identification
3. **Output chain assessments** (4 chains) -- per-chain traceability with in-memory source, writer function, target on-disk schema, verdict, and gap identification
4. **Chain completeness summary table** -- chain ID, direction (input/output), source, sink, verdict (COMPLETE/SCHEMA ONLY/PARTIAL/MISSING), blocking gap IDs if any
5. **Findings and recommendations** -- consolidated list of all gaps identified in the tracing, cross-referenced to existing gap IDs where applicable, with resolution priority

### Error Handling

If a spec file referenced above does not exist at the expected path, note it as a data gap in the report. Do not fail the entire assessment.

## Acceptance Criteria

- [ ] Given the report file `report-015-data-traceability.md` exists, when opened, then it contains exactly 5 sections (executive summary, input chain assessments with 4 sub-sections, output chain assessments with 4 sub-sections, chain completeness summary table, findings and recommendations)
- [ ] Given each chain assessment, when reviewed, then it traces the full path from source to sink with specific spec file paths and section references, and assigns exactly one verdict from the set {COMPLETE, SCHEMA ONLY, PARTIAL, MISSING}
- [ ] Given the output chain assessments, when the simulation results chain is evaluated, then it identifies the `SimulationScenarioResult` absence (GAP-030) and the output writer API absence (GAP-020) as the two links that break the chain, and cross-references report-013 section 4.4
- [ ] Given the chain completeness summary table, when reviewed, then it contains exactly 8 rows (4 input + 4 output) with columns for chain ID, direction, source, sink, and verdict
- [ ] Given the findings section, when reviewed, then each finding cross-references an existing gap ID where one exists (GAP-020, GAP-023, GAP-030) rather than creating duplicate gap identifiers

## Implementation Guide

### Suggested Approach

1. Read the 10 data model spec files to inventory all defined schemas (JSON, Parquet, FlatBuffers) and their column/field definitions
2. Read `input-loading-pipeline.md` to map each schema to its loading function and validation step (SS2.1-2.6)
3. Read `internal-structures.md` to identify the target in-memory types for each input chain
4. For each input chain, trace: schema spec (file + section) -> loading pipeline step (file + section) -> in-memory type (file + section). Note any missing link.
5. Read `output-schemas.md` and `output-infrastructure.md` to inventory all output schemas
6. Read `simulation-architecture.md` SS6 for the streaming output architecture
7. For each output chain, trace: in-memory source (file + section) -> writing function (file + section) -> on-disk schema (file + section). Note any missing link.
8. Cross-reference findings with the GAP-020 breakdown in report-013 section 4.4 to avoid duplicating already-identified gaps
9. Compile the summary table and findings section

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-015-data-traceability.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in Epics 01-03: title with report number, date, scope, evidence sources, clear section numbering
- Use the four-level chain completeness scale (COMPLETE / SCHEMA ONLY / PARTIAL / MISSING) consistently
- Cross-reference existing gap IDs (GAP-020, GAP-023, GAP-030) rather than inventing new identifiers for already-known gaps
- Cite specific spec file paths and section numbers for every link in every chain

### Pitfalls to Avoid

- Do not re-audit crate API surfaces -- consume existing reports (001, 002, 013) for completeness data
- Do not propose API designs for the missing output writer elements -- that is spec authoring work, not audit work
- Do not trace the performance-adapted types in cobre-sddp (stage templates, LP variable indexers) -- those are internal to cobre-sddp and not part of the data model I/O chains
- The FlatBuffers cut persistence chain IS complete at the schema level (GAP-021 was resolved per report-009) -- do not re-flag it as missing

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-audit-cobre-core-api-surface.md (provides in-memory type completeness), ticket-002-audit-cobre-io-api-surface.md (provides I/O API completeness)
- **Blocks**: ticket-017-synthesize-readiness-verdict.md (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: High
