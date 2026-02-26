# ticket-019 Define Stage, Block, and PolicyGraph Struct Definitions

## Context

### Background

The implementation readiness audit (report-001, Finding F-005) identified that `Stage`, `Block`, and `PolicyGraph` are used as field types in the `System` struct (`pub stages: Vec<Stage>`, `pub policy_graph: PolicyGraph`) but have no Rust struct definitions in the spec corpus. Section 12 of `internal-structures.md` describes the temporal structure conceptually, and `src/specs/data-model/input-system-entities.md` defines the JSON schema for `stages.json`, but no Rust type definitions exist.

This is condition C-03 from the readiness verdict (report-017). It blocks Phase 1 (cobre-core implementation).

### Relation to Epic

This is the second ticket in Epic 05, following ticket-018 which defines entity types and `EntityId`. The `Stage` struct may reference entity-related types (e.g., block factors per entity type), and `PolicyGraph` defines the stage transition structure that controls the SDDP algorithm's horizon.

### Current State

- `src/specs/data-model/internal-structures.md` section 12 describes stages conceptually: each stage has blocks, durations, season mapping, and penalty cascade parameters.
- `src/specs/data-model/input-system-entities.md` defines `stages.json` with fields for blocks, block durations, and policy graph transitions.
- The `System` struct (section 1.3) references `Vec<Stage>` and `PolicyGraph` but these types are undefined.
- `src/specs/architecture/horizon-mode-trait.md` describes `HorizonMode` which controls whether the policy graph is finite or cyclic. The `PolicyGraph` type must support both modes.

## Specification

### Requirements

1. Add a Rust struct definition for `Stage` in `internal-structures.md` section 12, including:
   - Stage index (0-based `usize`)
   - Number of blocks in the stage
   - Block definitions (via `Vec<Block>`)
   - Season assignment
   - Duration information
   - Any stage-level parameters from the JSON schema

2. Add a Rust struct definition for `Block` in the same section, including:
   - Block index within stage (0-based `usize`)
   - Duration in hours (`f64`)
   - Load factor or demand factor if applicable

3. Add a Rust struct definition for `PolicyGraph` in the same section, including:
   - The transition structure (which stages follow which stages)
   - Support for both finite horizon (linear chain) and cyclic horizon (with cycle-back edges)
   - Cross-reference to `horizon-mode-trait.md` for the `HorizonMode` enum that determines graph shape

4. All three types are `cobre-core` clarity-first types, consistent with the dual-nature design principle in section 1.1.

### Inputs/Props

- `src/specs/data-model/internal-structures.md` section 12 -- existing temporal structure description
- `src/specs/data-model/input-system-entities.md` -- `stages.json` schema
- `src/specs/architecture/horizon-mode-trait.md` -- `HorizonMode` enum and policy graph semantics

### Outputs/Behavior

- Updated `src/specs/data-model/internal-structures.md` section 12 with:
  - `Stage` struct definition with doc comment and field descriptions table
  - `Block` struct definition with doc comment and field descriptions table
  - `PolicyGraph` struct definition with doc comment, field descriptions table, and cross-reference to `horizon-mode-trait.md`

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `internal-structures.md` is read, when searching for `pub struct Stage`, then a complete Rust struct definition is found with at least `index: usize`, `blocks: Vec<Block>`, and season/duration fields
- [ ] Given `internal-structures.md` is read, when searching for `pub struct Block`, then a complete Rust struct definition is found with at least `index: usize` and `duration_hours: f64`
- [ ] Given `internal-structures.md` is read, when searching for `pub struct PolicyGraph`, then a complete Rust struct definition is found that supports both finite and cyclic horizon modes
- [ ] Given the `PolicyGraph` struct definition, when checking cross-references, then a link to `horizon-mode-trait.md` is present explaining the relationship between `HorizonMode` and graph shape
- [ ] Given the `System` struct field `pub stages: Vec<Stage>`, when checking type resolution, then `Stage` resolves to a defined struct in the same file

## Implementation Guide

### Suggested Approach

1. Read `internal-structures.md` section 12 for existing temporal structure description.
2. Read `input-system-entities.md` for the `stages.json` schema fields.
3. Read `horizon-mode-trait.md` to understand the finite vs cyclic policy graph semantics.
4. Define `Block` first (simplest type, no dependencies).
5. Define `Stage` next (contains `Vec<Block>`).
6. Define `PolicyGraph` last (may reference stage indices, must accommodate both horizon modes).
7. Follow the same pattern as the `System` struct: code block with doc comment, then field descriptions table.

### Key Files to Modify

- `src/specs/data-model/internal-structures.md` -- section 12, add Stage/Block/PolicyGraph struct definitions

### Patterns to Follow

- Follow the `System` struct pattern: doc comment, struct definition, field descriptions table.
- Use `usize` for indices (consistent with the `System` struct's collection indices).
- Cross-reference `horizon-mode-trait.md` using the `SS` prefix convention for architecture files.

### Pitfalls to Avoid

- Do NOT define the `HorizonMode` enum here -- it already exists in `horizon-mode-trait.md`.
- Do NOT include LP-related fields (number of variables, constraint counts) -- those belong to `StageTemplate` in `cobre-solver`.
- Do NOT couple `PolicyGraph` to a specific horizon mode -- it should represent the graph structure that `HorizonMode` then interprets.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

Verify `mdbook build` completes without errors after the changes.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md (entity types may be referenced in stage-level parameters)
- **Blocks**: None directly (but Epic 08 verification depends on all Epic 05 tickets)

## Effort Estimate

**Points**: 2
**Confidence**: High
