# ticket-006 Specify Local (No-Op) Backend Implementation

## Context

### Background

The local backend formalizes the current ad-hoc single-process mode described in hybrid-parallelism.md SS1.0a and training-loop.md SS4.3a/SS6.3a. Currently, single-process mode is specified as a set of prose exceptions to the MPI-based architecture ("MPI is not initialized", "collectives become local no-ops", "SharedWindow is not used"). The local backend makes this a first-class `Communicator` implementation with well-defined semantics for every trait method.

### Relation to Epic

This is the second backend implementation ticket. The local backend is the simplest implementation and serves as the foundation for understanding the trait contract: every method has a trivial implementation. It is always available (no feature flags) and is the default fallback when no other backend is configured.

### Current State

- `src/specs/hpc/hybrid-parallelism.md` SS1.0a describes single-process mode in prose
- `src/specs/architecture/training-loop.md` SS4.3a and SS6.3a describe single-rank variants of forward and backward passes
- `src/specs/interfaces/python-bindings.md` SS1.2 describes single-process execution for Python
- `src/specs/interfaces/mcp-server.md` SS1.1 describes single-process execution for MCP
- No formal specification exists for the no-op behavior of each collective operation

## Specification

### Requirements

Create the file `src/specs/hpc/backend-local.md` specifying the local (single-process, no-op) backend. The spec must cover:

1. **Struct definition**: `LocalBackend` struct with `impl Communicator`
2. **Method behavior**: Each trait method's trivial implementation:
   - `allgatherv`: Copy send buffer to receive buffer (identity operation)
   - `allreduce`: Copy send buffer to receive buffer (single rank, no aggregation needed)
   - `broadcast`: No-op (single rank, data is already present)
   - `barrier`: No-op (single rank, nothing to wait for)
   - `rank`: Always returns 0
   - `size`: Always returns 1
3. **SharedMemoryProvider fallback**: `HeapFallback` implementation where shared regions are regular heap allocations
4. **Always-available guarantee**: No feature flag, no external dependencies
5. **Relationship to existing single-process mode**: How this backend replaces the prose-based exceptions throughout the spec corpus

### Inputs/Props

| Source Document         | Relevant Sections                | What to Extract                             |
| ----------------------- | -------------------------------- | ------------------------------------------- |
| `hybrid-parallelism.md` | SS1.0a (single-process mode)     | Current prose description of no-op behavior |
| `training-loop.md`      | SS4.3a, SS6.3a (single-rank)     | Single-rank forward/backward pass behavior  |
| `python-bindings.md`    | SS1.2 (single-process execution) | Python mode's current behavior              |
| `mcp-server.md`         | SS1.1 (single-process execution) | MCP mode's current behavior                 |
| `communicator-trait.md` | SS1-SS4 (traits)                 | Trait signatures to implement               |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/backend-local.md` containing:

1. **Purpose**: One paragraph on the local backend's role as the single-process no-op implementation
2. **SS1 Struct and Trait Implementation**: `LocalBackend` struct definition, `impl Communicator for LocalBackend` with each method's trivial behavior
3. **SS2 Identity Semantics**: Formal definition of each method's behavior as identity operations, with a table showing the correspondence to the multi-rank behavior
4. **SS3 Shared Memory Fallback**: `HeapFallback` implementation of `SharedMemoryProvider` where regions are regular `Vec<T>` allocations
5. **SS4 Use Cases**: When the local backend is used (Python bindings, MCP server, TUI, testing, development)
6. **SS5 Determinism**: The local backend's trivial determinism guarantee (single rank = no communication non-determinism)
7. **Cross-References** section

### Error Handling

- The local backend cannot fail on any collective operation (they are identity operations on local memory)
- All methods return `Ok(())` unconditionally
- Memory allocation failures for HeapFallback shared regions follow standard Rust allocation failure semantics

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/backend-local.md` does not exist, when the ticket is completed, then the file exists
- [ ] Given the spec exists, when reading SS1, then `LocalBackend` implements `Communicator` with `rank() = 0`, `size() = 1`, and identity behavior for all collectives
- [ ] Given the spec exists, when reading SS2, then each method's behavior is defined in a table showing the multi-rank behavior vs. the local identity behavior
- [ ] Given the spec exists, when reading SS2, then `allgatherv` is specified as: copy send buffer contents to receive buffer at displacement 0 (counts = [send_len], displs = [0])
- [ ] Given the spec exists, when reading SS3, then `HeapFallback` implements `SharedMemoryProvider` with `create_shared_region` allocating a `Vec<T>`, `is_leader()` returning `true`, and `fence()` as a no-op
- [ ] Given the spec exists, when reading SS4, then the use cases list Python bindings, MCP server, TUI, and testing
- [ ] Given the spec exists, when reading SS5, then the determinism guarantee states: with a single rank, results are deterministically identical regardless of the number of OpenMP threads (matching the invariant from shared-memory-aggregation.md SS3.1)
- [ ] Given the spec exists, when checking cross-references, then it references hybrid-parallelism.md SS1.0a, training-loop.md SS4.3a/SS6.3a, communicator-trait.md

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-local.md`
2. Write Purpose: The local backend provides a `Communicator` implementation for single-process execution. All collective operations are identity operations (no inter-process communication). This formalizes the single-process mode previously described as prose exceptions throughout the spec corpus, making it a first-class backend with the same trait interface as MPI.
3. For SS1, show the struct and implementation:

   ```rust
   pub struct LocalBackend;

   impl Communicator for LocalBackend {
       fn allgatherv<T: CommData>(&self, send: &[T], recv: &mut [T], counts: &[usize], displs: &[usize]) -> Result<(), CommError> {
           recv[displs[0]..displs[0] + counts[0]].copy_from_slice(send);
           Ok(())
       }
       fn allreduce<T: CommData>(&self, send: &[T], recv: &mut [T], _op: ReduceOp) -> Result<(), CommError> {
           recv.copy_from_slice(send);
           Ok(())
       }
       fn broadcast<T: CommData>(&self, _buf: &mut [T], _root: usize) -> Result<(), CommError> {
           Ok(()) // Data is already in the buffer
       }
       fn barrier(&self) -> Result<(), CommError> {
           Ok(()) // Nothing to synchronize
       }
       fn rank(&self) -> usize { 0 }
       fn size(&self) -> usize { 1 }
   }
   ```

4. For SS2, create a behavior table:
   | Method | Multi-Rank Behavior | Local Backend Behavior |
   | ------ | ------------------- | ---------------------- |
   | allgatherv | Gathers from all ranks, ordered by rank | Copies send to recv[0..len] |
   | allreduce | Reduces across all ranks | Identity copy (single value) |
   | broadcast | Sends from root to all ranks | No-op (already local) |
   | barrier | Blocks until all ranks arrive | No-op (nothing to wait for) |
5. For SS3, show HeapFallback implementation
6. For SS4, list the use cases with references to existing specs
7. For SS5, state the determinism guarantee
8. Add Cross-References

### Key Files to Modify

| File                             | Action                          |
| -------------------------------- | ------------------------------- |
| `src/specs/hpc/backend-local.md` | **CREATE** -- New spec document |

### Patterns to Follow

- **Backend spec pattern**: Follow the structure established by ticket-005 (backend-ferrompi.md)
- **Identity semantics pattern**: Clearly distinguish "no-op" (does nothing) from "identity" (copies input to output)

### Pitfalls to Avoid

- Do NOT call `allgatherv` a "no-op" -- it must copy the send buffer to the receive buffer (identity operation). Only `barrier` and `broadcast` are true no-ops.
- Do NOT make LocalBackend require any feature flag -- it must always be available
- Do NOT add SUMMARY.md entries -- ticket-012 handles that

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (Communicator trait), ticket-002 (SharedMemoryProvider trait)
- **Blocks**: ticket-009, ticket-014 (Python bindings reference this backend)

## Effort Estimate

**Points**: 2
**Confidence**: High
