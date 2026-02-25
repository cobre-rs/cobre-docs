# ticket-002 Define SharedMemoryProvider Trait Specification

## Context

### Background

ferrompi's `SharedWindow<T>` enables ranks on the same physical node to share memory regions without replication. Cobre uses this for two large read-only data structures: the opening tree (scenario noise vectors) and optionally the cut pool (shared-memory-aggregation.md SS1.2-SS1.4). The SharedWindow semantics -- persistent memory regions with fence-based synchronization, leader/follower allocation, and direct pointer dereference -- are fundamentally different from the message-passing collectives (allgatherv, allreduce, broadcast, barrier). This justifies a separate trait rather than adding shared memory operations to the `Communicator` trait.

### Relation to Epic

This is the second ticket in Epic 01. It defines the `SharedMemoryProvider` trait as a companion to the `Communicator` trait (ticket-001). Not all backends implement shared memory: the ferrompi backend uses MPI windows, the shm backend uses OS shared memory primitives, while the local and tcp backends provide fallback implementations using regular heap allocation. The trait must be designed so that backends can opt out cleanly.

### Current State

- `src/specs/hpc/communication-patterns.md` SS5 defines `SharedWindow<T>` capabilities: window creation, intra-node grouping, read access, write synchronization
- `src/specs/hpc/shared-memory-aggregation.md` SS1 defines the leader allocation pattern, shared data candidates (opening tree, case data, cut pool), and generation protocol
- `src/specs/hpc/hybrid-parallelism.md` SS1.3 defines the shared memory layout (scenario storage, cut pool)
- `src/specs/hpc/hybrid-parallelism.md` SS6 Step 3 defines the shared memory communicator creation via `split_shared_memory()`
- The `communicator-trait.md` file will be created by ticket-001 but does not yet contain SharedMemoryProvider content

## Specification

### Requirements

Add a new section (SS4 SharedMemoryProvider Trait) to `src/specs/hpc/communicator-trait.md` (created by ticket-001). This section defines:

1. The `SharedMemoryProvider` trait with methods for shared memory region management
2. The `SharedRegion<T>` type representing a shared memory window
3. The fallback strategy for backends that do not support shared memory
4. The relationship between `Communicator` and `SharedMemoryProvider` (separate traits, optionally implemented by the same backend type)

The trait must cover these operations, derived from communication-patterns.md SS5.1 and shared-memory-aggregation.md SS1.1:

| Operation            | Current ferrompi API             | Trait Method                                    |
| -------------------- | -------------------------------- | ----------------------------------------------- |
| Create shared region | `SharedWindow::new(comm, count)` | `fn create_shared_region<T>(...)`               |
| Intra-node grouping  | `comm.split_shared_memory()`     | `fn split_local(&self) -> LocalCommunicator`    |
| Read access          | Direct pointer dereference       | `fn as_slice(&self) -> &[T]` on SharedRegion    |
| Write + synchronize  | Direct write + `window.fence()`  | `fn write(...) + fn fence(...)` on SharedRegion |
| Deallocation         | RAII (`Drop`)                    | RAII (`Drop`) on SharedRegion                   |

### Inputs/Props

| Source Document                | Relevant Sections                       | What to Extract                            |
| ------------------------------ | --------------------------------------- | ------------------------------------------ |
| `communication-patterns.md`    | SS5 (SharedWindow)                      | Capabilities, API, use cases               |
| `shared-memory-aggregation.md` | SS1.1-SS1.4 (leader allocation, data)   | Allocation pattern, shared data candidates |
| `hybrid-parallelism.md`        | SS1.3 (shared memory layout)            | Scenario storage and cut pool regions      |
| `hybrid-parallelism.md`        | SS6 Step 3 (shared memory communicator) | `split_shared_memory()` usage              |

### Outputs/Behavior

A new section SS4 in `src/specs/hpc/communicator-trait.md`:

1. **SS4.1 Trait Definition**: `pub trait SharedMemoryProvider` with method signatures in a Rust code block
2. **SS4.2 SharedRegion Type**: The shared memory region handle type with lifetime semantics, read/write access, and RAII cleanup
3. **SS4.3 Leader/Follower Pattern**: How the leader allocates memory and followers access it (mirroring shared-memory-aggregation.md SS1.1)
4. **SS4.4 Fallback Strategy**: For backends without shared memory (local, tcp), define a `HeapFallback` that allocates regular per-process memory -- the training loop code works identically, just without the memory savings of true sharing
5. **SS4.5 Optional Implementation**: How a backend type can implement both `Communicator` and `SharedMemoryProvider`, and how callers check for shared memory support at compile time via trait bounds

### Error Handling

- `create_shared_region` can fail if the OS rejects the shared memory allocation (size too large, permissions)
- `fence` can fail if a rank has crashed (detected by the underlying backend)
- Fallback allocations (heap) should never fail in practice (standard allocation failure semantics)

## Acceptance Criteria

- [ ] Given ticket-001 has been completed and `communicator-trait.md` exists with SS1-SS3, when this ticket is completed, then SS4 exists in the same file
- [ ] Given the spec exists, when reading SS4.1, then a `pub trait SharedMemoryProvider` code block contains methods for creating shared regions, splitting local communicator, and accessing shared data
- [ ] Given the spec exists, when reading SS4.2, then a `SharedRegion<T>` type is defined with `as_slice()` for read access, `write()` for leader writes, `fence()` for synchronization, and `Drop` for RAII cleanup
- [ ] Given the spec exists, when reading SS4.3, then the leader/follower allocation pattern from shared-memory-aggregation.md SS1.1 is reflected in the trait methods
- [ ] Given the spec exists, when reading SS4.4, then a `HeapFallback` strategy is defined for backends that do not support shared memory, with identical API semantics (allocate, read, write) but per-process memory instead of shared
- [ ] Given the spec exists, when reading SS4.5, then it explains how `<C: Communicator + SharedMemoryProvider>` bounds enable compile-time checking of shared memory support
- [ ] Given the spec exists, when checking cross-references, then SS4 references communication-patterns.md SS5, shared-memory-aggregation.md SS1, hybrid-parallelism.md SS1.3 and SS6 Step 3

## Implementation Guide

### Suggested Approach

1. Read ticket-001's output (`communicator-trait.md` SS1-SS3) to understand the established style
2. Add SS4 (SharedMemoryProvider Trait) after SS3
3. For SS4.1, define the trait:
   ```rust
   pub trait SharedMemoryProvider {
       type Region<T: CommData>: SharedRegion<T>;
       fn create_shared_region<T: CommData>(&self, count: usize) -> Result<Self::Region<T>, CommError>;
       fn split_local(&self) -> Result<Box<dyn Communicator>, CommError>;
       fn is_leader(&self) -> bool;
   }
   ```
   Note: `split_local()` returns a sub-communicator for ranks on the same node. The return type may need to be generic or boxed depending on whether dynamic dispatch is acceptable here (it is -- this is initialization-only, not hot-path).
4. For SS4.2, define `SharedRegion<T>` as a trait:
   ```rust
   pub trait SharedRegion<T: CommData>: Send + Sync {
       fn as_slice(&self) -> &[T];
       fn as_mut_slice(&mut self) -> &mut [T]; // only for leader
       fn fence(&self) -> Result<(), CommError>;
   }
   ```
   Note the RAII semantics: the region is freed when the `SharedRegion` is dropped.
5. For SS4.3, describe the leader/follower pattern in a table matching shared-memory-aggregation.md SS1.1
6. For SS4.4, describe `HeapFallback`: for local and tcp backends, `create_shared_region` allocates a regular `Vec<T>` on the heap; `fence()` is a no-op; `is_leader()` always returns `true` (every rank is its own leader because memory is not shared). The API is identical, but each rank has its own copy.
7. For SS4.5, show how callers can be generic over both traits and how the training loop conditionally uses shared memory for data that benefits from sharing (opening tree, case data)

### Key Files to Modify

| File                                  | Action                                     |
| ------------------------------------- | ------------------------------------------ |
| `src/specs/hpc/communicator-trait.md` | **MODIFY** -- Add SS4 SharedMemoryProvider |

### Patterns to Follow

- **Trait definition pattern**: Follow the `Communicator` trait style established by ticket-001 in the same file
- **Associated type pattern**: Follow `solver-abstraction.md` for traits with associated types (the solver trait uses a similar pattern for backend-specific types)
- **Leader/follower table pattern**: Follow `shared-memory-aggregation.md` SS1.1 table format

### Pitfalls to Avoid

- Do NOT merge SharedMemoryProvider into the Communicator trait -- they have different semantics (persistent regions vs. message passing) and not all backends implement both
- Do NOT require all backends to implement SharedMemoryProvider -- the local and tcp backends use HeapFallback, which is a separate type implementing the same trait
- Do NOT specify MPI-specific details (window attributes, MPI_Win types) in the trait -- those belong to the ferrompi backend spec (ticket-005)
- Do NOT add SUMMARY.md entries -- ticket-012 handles that

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds after modifying the file

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (the file must exist with SS1-SS3 before SS4 can be added)
- **Blocks**: ticket-005, ticket-006, ticket-007, ticket-008

## Effort Estimate

**Points**: 3
**Confidence**: High
