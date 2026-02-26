# ticket-018 Define EntityId Type and Entity Struct Definitions

## Context

### Background

The implementation readiness audit (report-001, Finding F-001 and F-002) identified that `src/specs/data-model/internal-structures.md` defines the `System` struct with `Vec<Bus>`, `Vec<Hydro>`, etc., but the individual entity structs (`Bus`, `Line`, `Thermal`, `Hydro`, `PumpingStation`, `EnergyContract`, `NonControllableSource`) have no Rust struct definitions in the spec corpus. The prose descriptions and JSON schema tables exist in `src/specs/data-model/input-system-entities.md` but no one has translated them into Rust `struct` sketches with typed fields. Additionally, `EntityId` is used throughout the spec corpus (including in `System` struct's `HashMap<EntityId, usize>` lookup indices) but is never defined as a concrete type.

These are conditions C-01 (entity structs) and C-02 (EntityId) from the readiness verdict (report-017). Both block Phase 1 (cobre-core implementation).

### Relation to Epic

This is the foundational ticket in Epic 05. The entity struct definitions are consumed by ticket-019 (Stage/Block/PolicyGraph which reference entity types), accelerate ticket-020 (validation checks reference entity field names), and are prerequisites for Phase 1 coding.

### Current State

- `src/specs/data-model/internal-structures.md` section 1.3 contains the `System` struct with `Vec<Bus>`, `Vec<Line>`, etc. as field types, but `Bus`, `Line`, etc. are never defined as Rust structs.
- `src/specs/data-model/input-system-entities.md` contains comprehensive JSON schema tables for all 7 entity types with field names, types, default values, and descriptions.
- `EntityId` appears in `HashMap<EntityId, usize>` in the `System` struct and throughout the spec corpus but has no type definition.
- The "dual-nature design" principle (section 1.1) establishes that `cobre-core` entity structs are "clarity-first" -- they match domain concepts, use `Vec<T>` collections, and `HashMap`-based lookup. Performance-adapted layouts are built separately by `cobre-sddp`.

## Specification

### Requirements

1. Define `EntityId` as a concrete Rust type in `internal-structures.md`, placed before the entity struct definitions. The type should be a newtype wrapper around an integer (e.g., `u32`) or a `String`, with the choice justified based on the JSON input format (entities use string IDs in JSON files) and the lookup pattern (`HashMap<EntityId, usize>`).

2. Add Rust struct definitions for all 7 entity types in a new section of `internal-structures.md` (between the current section 1 and section 2). Each struct must include:
   - All fields derivable from the corresponding JSON schema table in `input-system-entities.md`
   - Field types that are concrete Rust types (not `serde_json::Value` or `Box<dyn Any>`)
   - A doc comment describing the entity
   - A note on which fields are "base" (loaded directly from JSON) vs "resolved" (computed during loading, e.g., pre-resolved penalties)

3. The 7 entity types are: `Bus`, `Line`, `Thermal`, `Hydro`, `PumpingStation`, `EnergyContract`, `NonControllableSource`.

4. For `Hydro`, include the cascade-related fields (`downstream_id: Option<EntityId>`, `reservoir: ReservoirSpec`, etc.) and cross-reference `input-hydro-extensions.md` for the generation model and inflow model fields.

5. For `Bus`, include the deficit segment fields that represent the piecewise linear deficit cost curve.

6. Do NOT define performance-adapted types (those belong to `cobre-sddp`). Do NOT define `Stage`, `Block`, or `PolicyGraph` (those are ticket-019).

### Inputs/Props

- `src/specs/data-model/input-system-entities.md` -- JSON schema tables for all 7 entity types
- `src/specs/data-model/input-hydro-extensions.md` -- Hydro generation model and inflow model fields
- `src/specs/data-model/internal-structures.md` section 1 -- existing `System` struct and dual-nature design

### Outputs/Behavior

- Updated `src/specs/data-model/internal-structures.md` with:
  - `EntityId` type definition with justification
  - 7 entity struct definitions with typed fields and doc comments
  - Field descriptions table for each struct (matching the format of the System struct's field descriptions table in section 1.3)

### Error Handling

Not applicable -- this is a spec authoring task, not a code implementation.

## Acceptance Criteria

- [ ] Given `internal-structures.md` is read, when searching for `pub struct Bus`, then a complete Rust struct definition is found with at least `id: EntityId`, `name: String`, and deficit segment fields
- [ ] Given `internal-structures.md` is read, when searching for `pub struct Hydro`, then a complete Rust struct definition is found with at least `id: EntityId`, `bus_id: EntityId`, `downstream_id: Option<EntityId>`, reservoir fields, and a cross-reference to `input-hydro-extensions.md`
- [ ] Given `internal-structures.md` is read, when searching for `pub type EntityId` or `pub struct EntityId`, then a concrete type definition is found with a justification comment
- [ ] Given all 7 entity struct definitions are present, when comparing field names against `input-system-entities.md` JSON schema tables, then every required JSON field has a corresponding Rust struct field with an appropriate type
- [ ] Given the entity struct definitions are present, when checking `System` struct fields `pub buses: Vec<Bus>`, then `Bus` resolves to a defined struct in the same file

## Implementation Guide

### Suggested Approach

1. Read `src/specs/data-model/input-system-entities.md` completely to extract all entity fields from JSON schema tables.
2. Read `src/specs/data-model/input-hydro-extensions.md` for additional Hydro fields.
3. Read `src/specs/data-model/internal-structures.md` section 1 to understand existing context (System struct, dual-nature design, field descriptions format).
4. Define `EntityId` first. Examine how entity IDs appear in the JSON schemas -- if they are string-typed in JSON but need efficient hashing, a `String` newtype is appropriate. If they are integer-typed, `u32` is appropriate. Justify the choice in a comment.
5. Add a new subsection (e.g., "1.5 Entity Struct Definitions" or renumber existing sections) with the 7 struct definitions.
6. For each struct, follow the pattern: doc comment, `pub struct Name { fields }`, then a field descriptions table in Markdown.
7. Ensure field types use existing types from the spec (e.g., `EntityId` for cross-references, `f64` for physical quantities, `Vec<T>` for stage-indexed arrays, `Option<T>` for optional fields).

### Key Files to Modify

- `src/specs/data-model/internal-structures.md` -- primary target, add EntityId and 7 entity structs

### Patterns to Follow

- Follow the existing `System` struct pattern in section 1.3: Rust code block with doc comment, followed by a field descriptions table.
- Use the dual-nature design language from section 1.1: these structs are "clarity-first" representations, not performance-adapted.
- Field names should use Rust snake_case that maps naturally to the camelCase JSON field names in the input schemas.

### Pitfalls to Avoid

- Do NOT include fields that belong to the performance-adapted layer (e.g., LP variable indices, contiguous f64 slices). Those are `cobre-sddp` types.
- Do NOT define the same struct in multiple spec files. These are the canonical definitions.
- Do NOT use `String` for fields that have a fixed set of variants -- use enums (e.g., `HydroGenerationModel::Linear | HydroGenerationModel::PiecewiseLinear`).
- Do NOT add `serde` derive annotations -- the spec captures logical structure, not serialization details.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

After the structs are added, verify that `mdbook build` completes without errors (the new content is valid Markdown).

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None (this is the first ticket in Epic 05)
- **Blocks**: ticket-019-define-stage-block-policygraph.md (Stage/Block/PolicyGraph may reference entity types)

## Effort Estimate

**Points**: 3
**Confidence**: High
