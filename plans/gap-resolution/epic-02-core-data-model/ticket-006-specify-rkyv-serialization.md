# ticket-006: Specify rkyv Serialization for MPI Broadcast

## Context

### Background

GAP-003 identifies that the broadcast strategy in Input Loading Pipeline SS6 says data is "serialized to contiguous byte buffers for MPI broadcast" but does not specify the serialization format. The stakeholder decision is to use **rkyv** for zero-copy deserialization. bincode is unmaintained.

rkyv was chosen specifically for performance: it enables zero-copy deserialization, meaning the receiving rank can read directly from the received byte buffer without allocating and copying into Rust structs. This is important because the System data structure can be large (hundreds of MB at production scale) and is broadcast to every MPI rank at startup.

### Relation to Epic

Third ticket of Epic 2. Adds serialization bounds to the types defined in ticket-004.

### Current State

`src/specs/architecture/input-loading-pipeline.md` SS6 (Broadcast Strategy) describes:

- A two-step broadcast protocol (buffer size, then buffer contents)
- Categories of data to broadcast
- Sparse broadcast optimization
- No serialization format specification

`src/specs/data-model/internal-structures.md` SS1 entity types have no serialization bounds documented.

## Specification

### Requirements

1. Update Input Loading Pipeline SS6 to specify **rkyv** as the serialization format for MPI broadcast
2. Add a rationale paragraph explaining:
   - rkyv enables zero-copy deserialization: the archived representation can be accessed directly from the byte buffer without deserialization into owned Rust types
   - This avoids allocation overhead for the large System struct during broadcast
   - bincode was considered but is unmaintained
   - For the sparse broadcast optimization (bounds/overrides in Parquet form), rkyv is used for the metadata envelope; the actual Parquet bytes are passed through as-is
3. Document the required trait bounds on cobre-core types:
   - `rkyv::Archive + rkyv::Serialize<...> + rkyv::Deserialize<...>` on all types that participate in MPI broadcast
   - This includes: `System`, all entity types (Bus, Line, Hydro, Thermal, etc.), `Stage`, `PolicyGraph`, `ResolvedPenalties`, `ResolvedBounds`, `ParModel`, `CorrelationModel`, `InitialConditions`, `GenericConstraint`
   - Emphasize that the `HashMap` indices in `System` are NOT serialized -- they are rebuilt on the receiving rank from the entity collections
4. Add a note about alignment: rkyv requires 16-byte alignment for archived data by default; document that the MPI receive buffer must be allocated with appropriate alignment
5. Add a note about versioning: rkyv does not have built-in schema evolution; document that the archived format is tied to the Rust struct layout and is NOT suitable for long-term storage (use FlatBuffers for persistent policy files, as already specified in Binary Formats)

### Inputs/Props

- Current text of `src/specs/architecture/input-loading-pipeline.md` SS6
- Stakeholder decision: use rkyv

### Outputs/Behavior

Updated Input Loading Pipeline SS6 with rkyv specification, rationale, and type bounds.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given Input Loading Pipeline SS6 is read, when a developer looks for the serialization format, then they find "rkyv" specified with zero-copy deserialization rationale
- [ ] Given a developer reads the trait bounds, when they check which types need rkyv derives, then they find a complete list of types requiring `Archive + Serialize + Deserialize`
- [ ] Given a developer reads the alignment note, when they allocate the MPI receive buffer, then they know to use 16-byte aligned allocation
- [ ] Given a developer reads the versioning note, when they consider using rkyv for persistent storage, then they find a clear statement that rkyv is for in-memory broadcast only (FlatBuffers for persistence)
- [ ] Given the HashMap indices are mentioned, when a developer checks serialization scope, then they find that lookup indices are excluded from serialization and rebuilt locally

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/input-loading-pipeline.md`
2. Find SS6 (Broadcast Strategy)
3. Add a new subsection `### 6.1 Serialization Format` (renumbering existing content if needed) with:
   - Statement: "The serialization format for MPI broadcast is **rkyv** (version 0.8+)"
   - Zero-copy rationale paragraph
   - bincode rejection note
4. Add a new subsection `### 6.2 Required Trait Bounds` with the list of types and their required derives
5. Add a note about alignment and buffer allocation
6. Add a note about versioning scope (broadcast only, not persistence)
7. Verify `mdbook build` succeeds

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/architecture/input-loading-pipeline.md` -- SS6 (Broadcast Strategy)

### Patterns to Follow

- Use `SS` prefix for section references within architecture files (e.g., `SS6.1`)
- Reference Binary Formats for the FlatBuffers policy persistence format
- Use code blocks for Rust derive examples

### Pitfalls to Avoid

- Do NOT add rkyv bounds to the struct sketch in Internal Structures (that file uses `§` section numbering and is a data-model spec; the serialization bounds are an architecture concern documented in the loading pipeline)
- Do NOT specify a particular rkyv crate version beyond "0.8+" -- the exact version is an implementation choice
- Do NOT prescribe `rkyv::with::Map` or other rkyv combinators for HashMap fields -- just state that HashMaps are excluded from serialization
- Do NOT confuse rkyv serialization (for MPI broadcast) with FlatBuffers serialization (for cut persistence / checkpoint) -- they serve different purposes

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes

## Dependencies

- **Blocked By**: ticket-004 (SystemRepresentation struct must be defined before we can list which types need rkyv bounds)
- **Blocks**: ticket-007 (gap inventory update)

## Effort Estimate

**Points**: 2
**Confidence**: High
