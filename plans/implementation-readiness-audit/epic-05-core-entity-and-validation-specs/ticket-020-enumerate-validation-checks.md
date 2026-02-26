# ticket-020 Enumerate Entity Cross-Reference Validation Checks

## Context

### Background

GAP-029 in the spec gap inventory identifies that `src/specs/architecture/input-loading-pipeline.md` SS2.6 (Cross-Reference Validation) lacks a comprehensive enumeration of all entity cross-reference checks that must pass during input loading. The current content provides illustrative examples (e.g., "bus references valid" in the entity loading tables) but does not list every cross-entity reference that must be validated. Without an exhaustive checklist, an implementer of Phase 2 (cobre-io input loading) would need to reverse-engineer validation rules from scattered entity descriptions.

This is condition C-04 from the readiness verdict (report-017). It blocks Phase 2 (cobre-io implementation). The gap triage (report-009 section 5.1) classified GAP-029 as Resolve-Before-Coding with 2-3 days effort.

### Relation to Epic

This is the most effort-intensive ticket in Epic 05. It requires reading all 7 entity type definitions and their JSON schemas to extract every cross-entity reference that must be validated. It is accelerated (but not blocked) by ticket-018, which adds concrete Rust struct definitions that make cross-reference fields explicitly visible.

### Current State

- `src/specs/architecture/input-loading-pipeline.md` SS2 defines the file loading sequence with per-file validation notes in tables (SS2.1 through SS2.5).
- SS2.6 exists but contains only a brief description of cross-reference validation, not an exhaustive checklist.
- The validation notes in SS2.2 (entity registries) say things like "Bus references valid" and "cascade references acyclic" but do not enumerate every specific cross-reference field.
- `src/specs/data-model/input-system-entities.md` defines all entity fields including foreign-key references (e.g., `bus_id` in Thermal, `downstream_hydro_id` in Hydro).
- `src/specs/architecture/validation-architecture.md` defines the multi-layer validation design but defers cross-entity validation rules to SS2.6.

## Specification

### Requirements

1. Expand SS2.6 of `input-loading-pipeline.md` to include a comprehensive validation checklist table with the following columns:
   - **Source Entity**: The entity type containing the reference field
   - **Reference Field**: The specific field name (e.g., `bus_id`, `downstream_hydro_id`)
   - **Target Entity**: The entity collection being referenced
   - **Validation Rule**: The specific check (e.g., "must resolve to an existing bus ID", "must form an acyclic DAG")
   - **Error on Failure**: The error variant or message when validation fails

2. Cover every cross-entity reference across all 7 entity types:
   - `Line` references 2 buses (source, target)
   - `Thermal` references 1 bus
   - `Hydro` references 1 bus, optionally references a downstream hydro (cascade)
   - `PumpingStation` references 1 bus and 2 hydros (source, target)
   - `EnergyContract` references 1 bus
   - `NonControllableSource` references 1 bus
   - Generic constraints reference entity IDs of multiple types

3. Include structural validations (not just referential integrity):
   - Cascade topology must be acyclic (DAG)
   - Network topology connectivity (no isolated buses with entities)
   - Initial conditions array lengths must match entity collection sizes

4. Cross-reference the validation architecture spec (`validation-architecture.md`) for the error reporting pattern.

### Inputs/Props

- `src/specs/architecture/input-loading-pipeline.md` -- current SS2 content
- `src/specs/data-model/input-system-entities.md` -- entity field definitions with foreign keys
- `src/specs/data-model/input-hydro-extensions.md` -- hydro-specific cross-references
- `src/specs/data-model/input-constraints.md` -- generic constraint entity references
- `src/specs/architecture/validation-architecture.md` -- validation error pattern

### Outputs/Behavior

- Updated `src/specs/architecture/input-loading-pipeline.md` SS2.6 with:
  - Complete cross-reference validation checklist table (minimum 15 validation rules)
  - Structural validation rules (cascade acyclicity, connectivity, array length consistency)
  - Cross-reference to `validation-architecture.md` for error reporting
- Updated `src/specs/overview/spec-gap-inventory.md` to mark GAP-029 as resolved

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `input-loading-pipeline.md` SS2.6 is read, when counting validation rules in the checklist table, then at least 15 distinct cross-reference validation rules are enumerated
- [ ] Given the validation checklist, when checking against `input-system-entities.md` entity schemas, then every field ending in `_id` that references another entity type has a corresponding validation rule
- [ ] Given the validation checklist, when checking for structural validations, then cascade acyclicity and initial conditions array length checks are present
- [ ] Given `spec-gap-inventory.md` is read, when searching for GAP-029, then the status is "Resolved" with a reference to the updated SS2.6
- [ ] Given the validation checklist table, when checking column completeness, then every row has non-empty Source Entity, Reference Field, Target Entity, Validation Rule, and Error on Failure columns

## Implementation Guide

### Suggested Approach

1. Read `input-system-entities.md` to extract every field that references another entity type. Build a list of (source_entity, field_name, target_entity) triples.
2. Read `input-hydro-extensions.md` for hydro-specific cross-references (e.g., inflow model references).
3. Read `input-constraints.md` for generic constraint entity references.
4. Read `input-loading-pipeline.md` SS2.1-SS2.5 to check what validation notes already exist and ensure the new SS2.6 table does not contradict them.
5. Read `validation-architecture.md` to understand the error variant naming convention.
6. Build the checklist table in SS2.6 with one row per validation rule.
7. Add structural validation rules (cascade DAG, connectivity, array lengths).
8. Update `spec-gap-inventory.md` GAP-029 status.

### Key Files to Modify

- `src/specs/architecture/input-loading-pipeline.md` -- expand SS2.6
- `src/specs/overview/spec-gap-inventory.md` -- mark GAP-029 resolved

### Patterns to Follow

- Follow the table format used in SS2.1-SS2.5 for the loading sequence tables.
- Use the `LoadError` variants established in `validation-architecture.md`.
- Use the `SS` prefix convention for cross-references within architecture files.

### Pitfalls to Avoid

- Do NOT list schema validation rules (field types, required fields) -- those are covered by the "Schema validation first" note at the top of SS2.
- Do NOT duplicate the per-file validation notes from SS2.1-SS2.5 -- SS2.6 covers only cross-entity references that span multiple files.
- Do NOT invent new entity types or fields that are not in the input schemas.
- Verify that the total count in the checklist table header matches the actual number of rows.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

Verify `mdbook build` completes without errors after the changes.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None (accelerated by ticket-018 but not blocked)
- **Blocks**: None directly (but Epic 08 verification depends on all Epic 05 tickets)

## Effort Estimate

**Points**: 4
**Confidence**: High
