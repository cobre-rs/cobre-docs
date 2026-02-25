# ticket-005 Specify Ferrompi Backend Implementation

## Context

### Background

The ferrompi backend wraps the existing ferrompi MPI bindings behind the `Communicator` and `SharedMemoryProvider` traits defined in Epic 01. This is the most critical backend because it preserves the existing MPI-based execution model that is the primary production path. The spec must demonstrate that the trait abstraction adds zero runtime cost compared to direct ferrompi calls, since the training loop's communication is performance-sensitive at production scale (~587 MB/iteration per communication-patterns.md SS3.1).

### Relation to Epic

This is the first backend implementation ticket in Epic 02. The ferrompi backend is the reference implementation -- all other backends must match its observable behavior (modulo implementation-specific details like shared memory). Tickets 006-008 define the alternative backends.

### Current State

- `src/specs/hpc/communication-patterns.md` SS1.1 defines the ferrompi API signatures used by SDDP
- `src/specs/hpc/communication-patterns.md` SS4 describes persistent collectives as an optimization opportunity
- `src/specs/hpc/communication-patterns.md` SS5 describes `SharedWindow<T>` usage
- `src/specs/hpc/hybrid-parallelism.md` SS1.2 lists all ferrompi capabilities used
- `src/specs/hpc/hybrid-parallelism.md` SS6 defines the MPI initialization sequence
- `src/specs/hpc/communicator-trait.md` (from ticket-001) defines the `Communicator` trait
- `src/specs/hpc/communicator-trait.md` SS4 (from ticket-002) defines `SharedMemoryProvider`
- No backend-specific spec exists

## Specification

### Requirements

Create the file `src/specs/hpc/backend-ferrompi.md` specifying how the ferrompi crate is wrapped behind the `Communicator` and `SharedMemoryProvider` traits. The spec must cover:

1. **Struct definition**: `FerrompiBackend` struct that holds a `ferrompi::Communicator` handle and implements both traits
2. **Method mapping**: One-to-one mapping from each trait method to the corresponding ferrompi API call
3. **Initialization**: How `FerrompiBackend::new()` wraps the ferrompi initialization sequence (MPI_Init_thread with MPI_THREAD_MULTIPLE)
4. **SharedWindow implementation**: How `SharedMemoryProvider` delegates to `ferrompi::SharedWindow<T>`
5. **Performance characteristics**: Zero-cost abstraction argument (monomorphization eliminates indirection)
6. **Persistent collectives**: How the backend can internally use MPI 4.0 persistent collectives (communication-patterns.md SS4) without affecting the trait interface
7. **Error mapping**: How ferrompi/MPI errors map to `CommError` variants
8. **Feature gating**: Backend is only available when `features = ["ferrompi"]` is enabled

### Inputs/Props

| Source Document             | Relevant Sections                    | What to Extract                                   |
| --------------------------- | ------------------------------------ | ------------------------------------------------- |
| `communication-patterns.md` | SS1.1 (operations), SS4 (persistent) | ferrompi API signatures, optimization opportunity |
| `communication-patterns.md` | SS5 (SharedWindow)                   | SharedWindow API and capabilities                 |
| `hybrid-parallelism.md`     | SS1.2 (capabilities), SS6 (init)     | Full ferrompi capability list, init sequence      |
| `communicator-trait.md`     | SS1-SS4 (traits)                     | Trait method signatures to implement              |
| `backend-selection.md`      | SS4 (feature flags)                  | Feature gating requirements                       |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/backend-ferrompi.md` containing:

1. **Purpose**: One paragraph on the ferrompi backend as the primary production communication backend
2. **SS1 Struct and Trait Implementation**: `FerrompiBackend` struct definition, `impl Communicator for FerrompiBackend` with method-by-method mapping
3. **SS2 Initialization**: The initialization sequence (wrapping hybrid-parallelism.md SS6 Steps 1-3) as `FerrompiBackend::new()`
4. **SS3 SharedWindow Implementation**: `impl SharedMemoryProvider for FerrompiBackend` with `SharedRegion` backed by `ferrompi::SharedWindow<T>`
5. **SS4 Performance**: Zero-cost argument, persistent collectives as internal optimization
6. **SS5 Error Mapping**: Table mapping ferrompi/MPI error codes to `CommError` variants
7. **SS6 Feature Gating**: Cargo feature requirements, conditional compilation
8. **Cross-References** section

### Error Handling

- MPI errors (communicator failure, buffer mismatch, rank crash) map to specific `CommError` variants
- `MPI_Init_thread` failure (wrong threading level) produces `CommError::InitFailed`
- The backend must handle `MPI_Finalize` in its `Drop` implementation

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/backend-ferrompi.md` does not exist, when the ticket is completed, then the file exists
- [ ] Given the spec exists, when reading SS1, then a `FerrompiBackend` struct is defined with `impl Communicator` showing each trait method delegating to the corresponding ferrompi API call
- [ ] Given the spec exists, when reading SS2, then the initialization sequence matches hybrid-parallelism.md SS6 Steps 1-3 (MPI_Init_thread, topology detection, shared memory communicator)
- [ ] Given the spec exists, when reading SS3, then `impl SharedMemoryProvider for FerrompiBackend` is defined with `SharedRegion` wrapping `ferrompi::SharedWindow<T>`
- [ ] Given the spec exists, when reading SS4, then the zero-cost abstraction argument is made via monomorphization, and persistent collectives (communication-patterns.md SS4) are documented as an internal optimization that does not affect the trait interface
- [ ] Given the spec exists, when reading SS5, then an error mapping table covers at least: `MPI_ERR_COMM`, `MPI_ERR_BUFFER`, `MPI_ERR_COUNT`, `MPI_ERR_OTHER`
- [ ] Given the spec exists, when reading SS6, then `#[cfg(feature = "ferrompi")]` gating is specified
- [ ] Given the spec exists, when checking cross-references, then it references communicator-trait.md, communication-patterns.md, hybrid-parallelism.md

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-ferrompi.md`
2. Write Purpose: The ferrompi backend wraps the ferrompi MPI bindings, providing the `Communicator` and `SharedMemoryProvider` trait implementations for production HPC deployments. It is the reference backend -- all other backends must match its observable behavior.
3. For SS1, show the struct and implementation:
   ```rust
   #[cfg(feature = "ferrompi")]
   pub struct FerrompiBackend {
       world: ferrompi::Communicator,
       shared: Option<ferrompi::Communicator>, // intra-node communicator
   }
   ```
   Then show `impl Communicator for FerrompiBackend` with each method:
   - `allgatherv` -> `self.world.allgatherv(send, recv, counts, displs)`
   - `allreduce` -> `self.world.allreduce(send, recv, op.into())` (map `ReduceOp` to `ferrompi::Op`)
   - `broadcast` -> `self.world.bcast(buf, root)`
   - `barrier` -> `self.world.barrier()`
   - `rank` -> `self.world.rank() as usize`
   - `size` -> `self.world.size() as usize`
4. For SS2, describe initialization as `FerrompiBackend::new()`:
   - Calls `ferrompi::init_with_threading(ThreadLevel::Multiple)`
   - Reads world communicator
   - Creates intra-node communicator via `split_shared_memory()`
   - Returns the backend handle
5. For SS3, show SharedMemoryProvider implementation:
   - `create_shared_region<T>` -> `ferrompi::SharedWindow::new(self.shared.as_ref().unwrap(), count)`
   - `split_local` -> return the intra-node communicator wrapped in a new `FerrompiBackend`
   - `is_leader` -> `self.shared.as_ref().unwrap().rank() == 0`
6. For SS4, explain monomorphization: when the training loop is `train::<FerrompiBackend>(comm, ...)`, the compiler generates code that directly calls ferrompi functions with no indirection. Also mention that persistent collectives (MPI 4.0) can be used internally without changing the trait interface.
7. For SS5, create an error mapping table
8. For SS6, show feature gate annotations
9. Add Cross-References

### Key Files to Modify

| File                                | Action                          |
| ----------------------------------- | ------------------------------- |
| `src/specs/hpc/backend-ferrompi.md` | **CREATE** -- New spec document |

### Patterns to Follow

- **Implementation spec pattern**: Follow `solver-highs-impl.md` for the pattern of specifying a concrete implementation of an abstract trait
- **Code block pattern**: Follow the Rust code block style from communicator-trait.md
- **Error mapping pattern**: Follow structured-output.md SS2 for error kind tables

### Pitfalls to Avoid

- Do NOT change the existing ferrompi API -- the backend wraps it, not modifies it
- Do NOT add new MPI operations beyond what SDDP uses -- the trait surface is fixed
- Do NOT specify MPI implementation details (OpenMPI vs MPICH internals) -- those are deployment concerns
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
- **Blocks**: ticket-009, ticket-010 (refactoring references this backend)

## Effort Estimate

**Points**: 3
**Confidence**: High
