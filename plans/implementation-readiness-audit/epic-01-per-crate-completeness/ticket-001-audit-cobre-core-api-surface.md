# ticket-001 Audit cobre-core API Surface Completeness

## Context

### Background

cobre-core is the foundation crate of the Cobre ecosystem, providing the in-memory data model, entity registries, topology validation, penalty resolution, and the internal structures that every other crate depends on. It is the first crate in the implementation ordering (Phase 1) and has no in-workspace dependencies. Before coding begins, we must verify that every public type, function, and error surface is specified with enough detail that an implementer can write the Rust code without guessing at signatures, semantics, or error handling.

### Relation to Epic

This is ticket 1 of 8 in the per-crate completeness audit. It covers the data model foundation and establishes the audit methodology that subsequent crate tickets will follow.

### Current State

The cobre-core API surface is specified across multiple files:

- `src/specs/data-model/input-system-entities.md` -- Entity type definitions (Bus, Line, Thermal, Hydro, Contract, PumpingStation, NonControllable)
- `src/specs/data-model/input-hydro-extensions.md` -- Hydro supplementary tables
- `src/specs/data-model/penalty-system.md` -- Three-tier penalty cascade resolution
- `src/specs/data-model/internal-structures.md` -- System struct, resolved runtime structures, topology validation
- `src/specs/math/system-elements.md` -- Entity variable definitions and constraint formulations
- `src/specs/math/equipment-formulations.md` -- Per-element LP formulation details
- `src/specs/architecture/training-loop.md` SS2.1b -- TrainingEvent enum (lives in cobre-core)
- `src/crates/core.md` -- Crate overview (71 lines)

## Specification

### Requirements

Audit the cobre-core API surface across five categories. For each category, enumerate every item that must be public, inspect the relevant spec files, and classify as COMPLETE, PARTIAL, or MISSING.

**Category 1: Public Types**
Enumerate all structs, enums, and type aliases that must be public in cobre-core. This includes:

- Entity types: Bus, Line, Thermal, Hydro, Contract, PumpingStation, NonControllable
- Entity registry types (collection containers)
- System struct (the top-level in-memory representation)
- StageTemplate and StageIndexer types (LP layout metadata)
- Topology types (bus connectivity, cascade ordering)
- Internal resolved structures (per-stage parameters, penalty values)
- TrainingEvent enum and its payload structs (11 variants per SS2.1b)
- LoadError enum (5 variants per SS8.1)

For each type, verify: (a) field names and types are specified, (b) derive macros are specified where relevant, (c) visibility is clear.

**Category 2: Public Functions**
Enumerate all public functions that cobre-core must expose at its crate boundary. This includes:

- Entity creation/construction functions
- Topology validation functions
- Penalty resolution functions
- Internal structure construction functions
- Any utility functions referenced by other crates

For each function, verify: (a) parameter names and types are specified, (b) return type is specified, (c) semantics are documented.

**Category 3: Error Types**
Enumerate all error types in cobre-core:

- LoadError enum (from input-loading-pipeline.md SS8.1)
- Validation errors (from validation-architecture.md)
- Any topology validation errors

For each error type, verify: (a) all variants are listed, (b) each variant has documentation, (c) error recovery contracts are specified.

**Category 4: Trait Implementations**
cobre-core defines types that implement traits from external crates (e.g., serde::Serialize/Deserialize, Display, Debug). Verify that behavioral expectations for trait implementations are documented where they affect correctness (e.g., serialization format, Display formatting).

**Category 5: Crate Boundary Interactions**
Enumerate all crate boundaries where cobre-core is consumed:

- cobre-io consumes cobre-core (entity types, System struct, LoadError)
- cobre-stochastic consumes cobre-core (AR model parameters, internal structures)
- cobre-solver consumes cobre-core (StageTemplate, StageIndexer)
- cobre-sddp consumes cobre-core (System, TrainingEvent, all entity types)
- cobre-comm consumes cobre-core (error type integration)
- cobre-cli consumes cobre-core (System, TrainingEvent, config types)

For each boundary, verify that both sides of the interaction are specified with concrete function signatures.

### Inputs/Props

- All spec files listed in the Phase 1 reading list: `src/specs/overview/design-principles.md`, `src/specs/data-model/input-system-entities.md`, `src/specs/data-model/input-hydro-extensions.md`, `src/specs/data-model/penalty-system.md`, `src/specs/data-model/internal-structures.md`, `src/specs/math/system-elements.md`, `src/specs/math/equipment-formulations.md`
- Additional cobre-core-relevant files: `src/specs/architecture/training-loop.md` (SS2.1b), `src/specs/architecture/input-loading-pipeline.md` (SS8.1), `src/specs/architecture/validation-architecture.md`
- Crate overview: `src/crates/core.md`

### Outputs/Behavior

A Markdown audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-001-cobre-core.md` containing:

1. **Completeness Matrix**: A table with rows for each public API item and columns for: Item Name, Category, Spec File, Section, Status (COMPLETE/PARTIAL/MISSING), Notes
2. **Category Summaries**: Per-category counts of COMPLETE/PARTIAL/MISSING items
3. **Findings**: Numbered findings (F-001, F-002, ...) for all PARTIAL and MISSING items, following the standardized finding format from the master plan
4. **Crate Verdict**: PASS (all items COMPLETE or PARTIAL with clear resolution path) / CONDITIONAL PASS (some PARTIAL items need resolution) / FAIL (MISSING items that block implementation)

### Error Handling

- If a spec file referenced in the reading list does not exist, log it as a MISSING finding with Blocker severity
- If a type is referenced in multiple specs with conflicting definitions, log it as a finding with High severity
- If a section number in a cross-reference does not exist in the target file, log it as a finding with Medium severity

## Acceptance Criteria

- [ ] Given the cobre-core spec files, when the audit is complete, then every public type (structs, enums, type aliases) that must exist in cobre-core is listed in the completeness matrix
- [ ] Given the completeness matrix, when all items are classified, then each item has a Status of COMPLETE, PARTIAL, or MISSING with a cited spec file and section number
- [ ] Given the entity types (Bus, Line, Thermal, Hydro, Contract, PumpingStation, NonControllable), when their field definitions are inspected, then each field has a named Rust type or the item is classified as PARTIAL with a note describing what is missing
- [ ] Given the System struct definition in internal-structures.md SS1, when its fields are inspected, then every field type is either a concrete Rust type or a reference to another specified type
- [ ] Given the TrainingEvent enum in training-loop.md SS2.1b, when all 11 variants are inspected, then each variant's payload struct has typed fields
- [ ] Given the LoadError enum in input-loading-pipeline.md SS8.1, when all 5 variants are inspected, then each variant has documentation and the error recovery contract is specified
- [ ] Given each crate boundary interaction (cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-comm, cobre-cli), when the interaction is traced, then the function signatures at both sides are either COMPLETE or a finding is logged
- [ ] Given the audit report, when all findings are reviewed, then each finding cites a specific file path, section number, and relevant text

## Implementation Guide

### Suggested Approach

1. Start by reading `src/crates/core.md` to get the crate overview
2. Read `src/specs/data-model/internal-structures.md` SS1 for the System struct -- this is the central type
3. Read `src/specs/data-model/input-system-entities.md` for entity type definitions -- enumerate every entity type and its fields
4. Read `src/specs/data-model/input-hydro-extensions.md` for hydro-specific supplementary types
5. Read `src/specs/data-model/penalty-system.md` for penalty resolution types and functions
6. Read `src/specs/architecture/training-loop.md` SS2.1b for the TrainingEvent enum
7. Read `src/specs/architecture/input-loading-pipeline.md` SS8.1 for LoadError and load_case signature
8. Read `src/specs/architecture/validation-architecture.md` for validation error types
9. For each type/function found, classify it and add to the completeness matrix
10. Trace crate boundary interactions by reading the consumer crate specs and verifying the types match

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-001-cobre-core.md`

### Patterns to Follow

- Use the standardized finding format from the master plan (Finding F-NNN with Severity, Affected Crate, Affected Phase, Evidence, Impact, Recommendation)
- Cite evidence as: `[file-path] section [number]: "[quoted text]"`
- Use the three-level classification: COMPLETE / PARTIAL / MISSING

### Pitfalls to Avoid

- Do not conflate "deferred features" with "missing specifications". If a type is listed as a stub (e.g., Contract entity), verify the stub is specified but do not flag the absence of full formulation as a gap.
- Do not audit types that belong to deferred crates (cobre-python, cobre-tui, cobre-mcp)
- Do not audit types for deferred features (CVaR, Cyclic horizon, FPHA)
- The System struct was added in gap-resolution epic-02. Verify it exists in internal-structures.md SS1 before auditing its fields.

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root (confirms all internal links resolve).

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-012 (Phase 1-4 readiness assessment uses this report)

## Effort Estimate

**Points**: 3
**Confidence**: High
