# ticket-004: Specify SystemRepresentation Struct and Dual-Nature Data Model

## Context

### Background

GAP-001 identifies that the `SystemRepresentation` top-level type -- which holds all entity collections, metadata, and cascade topology -- is described only narratively in Internal Structures SS1. No struct sketch, no public API surface, and no method signatures exist. All downstream crates depend on this type: cobre-io produces it, cobre-sddp consumes it, and cobre-stochastic references it for PAR model preprocessing.

The stakeholder decision is to design with **dual nature**: clean, beautiful data models in cobre-core that are simple to understand; performance-adapted structures in cobre-sddp that sacrifice readability for hot-path performance.

### Relation to Epic

First ticket of Epic 2. The SystemRepresentation is the foundation that GAP-002 (operative state) and GAP-003 (serialization) build upon. The LP layout (Epic 3) references entity collections from this type to compute column/row indices.

### Current State

`src/specs/data-model/internal-structures.md` section 1 contains:

- A table of entity collections (Buses, Lines, Hydros, Thermals, etc.)
- A brief System Metadata note (entity counts, cascade topology, global config references)
- No struct definition, no public API, no method signatures

## Specification

### Requirements

1. Add a Rust struct sketch for `System` (the top-level cobre-core type) to Internal Structures SS1
2. Define public accessor methods for:
   - Entity collections by type (buses, lines, hydros, thermals, etc.)
   - Entity count queries per type
   - Entity lookup by ID (constant-time)
   - Cascade topology access (downstream/upstream adjacency)
3. Specify `Send + Sync` bounds (required for shared read-only access across threads within an MPI rank)
4. Add a new subsection to SS1 explaining the **dual-nature design principle**:
   - **cobre-core `System`**: Clarity-first. Uses `Vec<Hydro>`, `Vec<Thermal>`, etc. with `HashMap<EntityId, usize>` for O(1) lookup. Entity structs are rich and readable.
   - **cobre-sddp performance-adapted views**: Built at initialization from `&System`. Uses struct-of-arrays layout where needed for cache efficiency. Column/row index maps for LP positions. These are specified in Epic 3.
5. Document that the `System` type is the return type of `cobre_io::load_case()` and the primary input to `cobre_sddp::train()` and `cobre_sddp::simulate()`
6. Document that after construction, `System` is immutable and shared via `&System` (no `Arc` needed because MPI broadcast creates a copy per rank, and within a rank the lifetime is 'static for the program duration)

### Struct Sketch

The specification should include a struct sketch similar to:

```rust
/// Top-level system representation.
/// Produced by cobre-io, consumed by cobre-sddp and cobre-stochastic.
/// Immutable after construction. Shared read-only across threads.
pub struct System {
    // Entity collections (canonical ordering by ID)
    pub buses: Vec<Bus>,
    pub lines: Vec<Line>,
    pub hydros: Vec<Hydro>,
    pub thermals: Vec<Thermal>,
    pub pumping_stations: Vec<PumpingStation>,
    pub contracts: Vec<EnergyContract>,
    pub non_controllable_sources: Vec<NonControllableSource>,

    // O(1) lookup indices (entity ID -> position in collection)
    // Built during construction, not serialized
    bus_index: HashMap<EntityId, usize>,
    hydro_index: HashMap<EntityId, usize>,
    // ... one per entity type

    // Cascade topology (resolved during loading)
    pub cascade: CascadeTopology,

    // Stages and temporal structure
    pub stages: Vec<Stage>,
    pub policy_graph: PolicyGraph,

    // Pre-resolved penalties and bounds
    pub penalties: ResolvedPenalties,
    pub bounds: ResolvedBounds,

    // Scenario pipeline parameters
    pub par_models: Vec<ParModel>,       // per (hydro, stage)
    pub correlation: CorrelationModel,

    // Initial conditions
    pub initial_conditions: InitialConditions,

    // Generic constraints
    pub generic_constraints: Vec<GenericConstraint>,
}
```

### Inputs/Props

- Current text of `src/specs/data-model/internal-structures.md` SS1
- Stakeholder decision on dual-nature design

### Outputs/Behavior

Updated `src/specs/data-model/internal-structures.md` with struct sketch, public API, and dual-nature design principle subsection.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given Internal Structures SS1 is read, when a developer looks for the top-level type, then they find a Rust struct sketch named `System` with all 7 entity collection fields
- [ ] Given the struct sketch exists, when a developer checks for lookup methods, then they find O(1) entity lookup by ID documented (via HashMap index)
- [ ] Given the struct sketch exists, when a developer checks for thread-safety bounds, then `Send + Sync` are explicitly documented with rationale
- [ ] Given Internal Structures SS1 is read, when a developer looks for the dual-nature design principle, then they find a subsection explaining that cobre-core uses clarity-first data models while cobre-sddp builds performance-adapted views at initialization
- [ ] Given the struct sketch exists, when it is compared against Internal Structures SS1 entity collections table, then every entity type from the table has a corresponding field in the struct
- [ ] Given the struct sketch exists, when a developer checks for the crate boundary API, then they find that `System` is the return type of `cobre_io::load_case()` and the input to `cobre_sddp::train()`
- [ ] Given the cascade topology is referenced, when a developer looks for its type, then they find `CascadeTopology` mentioned with a description of downstream/upstream adjacency (resolved to skip non-existing plants, per current SS2 text)

## Implementation Guide

### Suggested Approach

1. Read `src/specs/data-model/internal-structures.md` SS1 current text
2. Add a new subsection `### 1.1 Dual-Nature Design Principle` after the entity collections table
3. Add a new subsection `### 1.2 System Struct Sketch` with the Rust struct definition
4. Add a new subsection `### 1.3 Public API Surface` with method signatures for entity access, count queries, and ID lookup
5. Add a note about `Send + Sync` bounds and immutability after construction
6. Update the existing System Metadata bullet points to reference the struct fields
7. Verify cross-references to other specs are correct

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md` -- SS1 (System Representation)

### Patterns to Follow

- Use `§` prefix for section references within this data-model file (e.g., `§1.2`)
- Use code blocks with `rust` language tag for struct sketches
- Follow the existing convention blockquote pattern from trait specs: "these serve as guidelines for implementation, not absolute source-of-truth contracts"
- Match the existing style of SS3 (Hydro Plant) which has subsections for different aspects of the entity

### Pitfalls to Avoid

- Do NOT change the existing content of SS2 (Operative State) -- that is ticket-005
- Do NOT add rkyv bounds yet -- that is ticket-006
- Do NOT define the performance-adapted cobre-sddp types -- that is Epic 3 (LP layout)
- Do NOT prescribe specific HashMap implementation (std vs. hashbrown) -- that is an implementation choice
- Do NOT add methods that imply mutable access -- System is immutable after construction

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes

## Dependencies

- **Blocked By**: ticket-001 (ecosystem guidelines should be in context), ticket-002 (ecosystem guidelines spec)
- **Blocks**: ticket-005 (operative state), ticket-006 (rkyv bounds), ticket-007 (gap inventory update), all of Epic 3

## Effort Estimate

**Points**: 3
**Confidence**: High
