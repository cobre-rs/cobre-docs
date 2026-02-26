# ticket-002 Audit cobre-io API Surface Completeness

## Context

### Background

cobre-io handles all I/O for the Cobre ecosystem: loading case directories (JSON configs, JSON entity registries, Parquet scenario files), running the five-layer validation pipeline, and writing output (Hive-partitioned Parquet, manifest files, metadata dictionaries). It is Phase 2 in the implementation ordering and depends on cobre-core for entity types and internal structures. The crate has two distinct API surfaces: the input loading pipeline and the output writing pipeline.

### Relation to Epic

This is ticket 2 of 8 in the per-crate completeness audit, covering the I/O layer that bridges external files and the in-memory data model.

### Current State

The cobre-io API surface is specified across:

- `src/specs/data-model/input-directory-structure.md` -- Case directory layout, file naming, discovery
- `src/specs/data-model/input-scenarios.md` -- Parquet scenario file schemas
- `src/specs/data-model/input-constraints.md` -- Constraint file formats
- `src/specs/data-model/output-schemas.md` -- Parquet output column schemas
- `src/specs/data-model/output-infrastructure.md` -- Hive partitioning, manifests, metadata
- `src/specs/data-model/binary-formats.md` -- FlatBuffers schemas for cut persistence
- `src/specs/architecture/validation-architecture.md` -- Five-layer validation pipeline
- `src/specs/architecture/input-loading-pipeline.md` -- Loading pipeline architecture, load_case API (SS8.1)
- `src/specs/configuration/configuration-reference.md` -- config.json and stages.json schemas
- `src/crates/io.md` -- Crate overview (78 lines)

## Specification

### Requirements

Audit the cobre-io API surface across five categories, following the same methodology as ticket-001.

**Category 1: Public Types**

- Config types: parsed config.json structure, stages.json structure
- Input file types: entity registry containers, scenario data containers
- Output types: Parquet writers, manifest structures, metadata dictionaries
- Validation types: validation pipeline stages, validation result containers
- FlatBuffers types: cut persistence schema types

**Category 2: Public Functions**

- `load_case(path: &Path) -> Result<System, LoadError>` (specified in input-loading-pipeline.md SS8.1)
- Individual loading functions: config loading, entity loading, scenario loading
- Validation pipeline entry point
- Output writing functions: convergence writer, simulation writer, manifest writer
- FlatBuffers serialization/deserialization functions

**Category 3: Error Types**

- LoadError (5 variants, specified in input-loading-pipeline.md SS8.1)
- Output writing errors
- FlatBuffers serialization errors

**Category 4: Trait Implementations**

- Serialization/deserialization traits for config types
- Any I/O-specific traits

**Category 5: Crate Boundary Interactions**

- cobre-io -> cobre-core: returns System struct, uses entity types
- cobre-sddp -> cobre-io: simulation results written via output pipeline
- cobre-cli -> cobre-io: orchestrates loading and output

### Inputs/Props

All spec files in the Phase 2 reading list plus output-related specs:

- `src/specs/data-model/input-directory-structure.md`
- `src/specs/data-model/input-scenarios.md`
- `src/specs/data-model/input-constraints.md`
- `src/specs/data-model/output-schemas.md`
- `src/specs/data-model/output-infrastructure.md`
- `src/specs/data-model/binary-formats.md`
- `src/specs/architecture/validation-architecture.md`
- `src/specs/architecture/input-loading-pipeline.md`
- `src/specs/configuration/configuration-reference.md`
- `src/crates/io.md`

### Outputs/Behavior

A Markdown audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-002-cobre-io.md` with the same structure as report-001.

### Error Handling

Same as ticket-001.

## Acceptance Criteria

- [ ] Given the cobre-io spec files, when the audit is complete, then the report contains a completeness matrix covering all public types in the input loading pipeline (config parsers, entity deserializers, scenario loaders)
- [ ] Given the output pipeline specs (output-schemas.md, output-infrastructure.md), when all output types are enumerated, then each type is classified as COMPLETE, PARTIAL, or MISSING
- [ ] Given the `load_case` function signature in input-loading-pipeline.md SS8.1, when its return type and error handling are inspected, then the System type and LoadError enum are traced to their definitions in cobre-core specs
- [ ] Given the FlatBuffers schema in binary-formats.md, when its completeness is assessed, then every field needed for cut persistence has a specified type or a finding is logged
- [ ] Given the five-layer validation pipeline in validation-architecture.md, when each layer is inspected, then the layer's input/output types and error reporting mechanism are either specified or flagged as PARTIAL/MISSING
- [ ] Given the output writer API surface (GAP-020 notes it was unspecified), when the current state is assessed, then the report documents whether GAP-020 resolution added sufficient API detail or if gaps remain
- [ ] Given each crate boundary interaction, when traced, then function signatures at both sides are documented

## Implementation Guide

### Suggested Approach

1. Read `src/crates/io.md` for the crate overview
2. Read `src/specs/architecture/input-loading-pipeline.md` fully -- this is the primary architecture spec for the input side
3. Read `src/specs/architecture/validation-architecture.md` for the validation pipeline types
4. Read `src/specs/data-model/input-directory-structure.md` for the file discovery types
5. Read `src/specs/configuration/configuration-reference.md` for config parsing types
6. Read `src/specs/data-model/output-schemas.md` and `src/specs/data-model/output-infrastructure.md` for the output side
7. Read `src/specs/data-model/binary-formats.md` for FlatBuffers types
8. Cross-reference with GAP-020 (output writer API) and GAP-021 (FlatBuffers .fbs schema) in the gap inventory to understand what was identified as missing

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-002-cobre-io.md`

### Patterns to Follow

Same as ticket-001.

### Pitfalls to Avoid

- GAP-020 (output writer API) and GAP-021 (FlatBuffers .fbs schema) are Medium-severity gaps that directly affect this crate. The audit should document their current state but not attempt to resolve them.
- The five-layer validation pipeline is architecturally complex. Focus on the public API surface (what cobre-cli calls), not the internal layer implementation details.
- Do not audit Python bindings output paths (deferred crate).

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-012 (Phase 1-4 readiness assessment uses this report)

## Effort Estimate

**Points**: 3
**Confidence**: High
