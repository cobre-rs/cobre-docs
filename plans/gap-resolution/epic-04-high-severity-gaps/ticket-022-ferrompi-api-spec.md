# ticket-022: Specify ferrompi Standalone API (GAP-017)

## Context

### Background

The ferrompi crate's API surface is described indirectly through the `FerrompiBackend` wrapper in `backend-ferrompi.md`, but ferrompi itself has no standalone API specification. Methods like `init_with_threading`, `allgatherv`, `allreduce`, `bcast`, `barrier`, `SharedWindow::new`, `SharedWindow::as_slice`, and `SharedWindow::fence` are referenced by their ferrompi names in the backend spec but their exact Rust signatures, error types, lifetime requirements, and `unsafe` boundaries are unspecified. This is the contract that cobre-comm implements against.

### Relation to Epic

This ticket resolves GAP-017 (High severity). It creates the API reference that defines the ferrompi crate boundary — ferrompi is a separate repository, and cobre-comm depends on it via `git` or `path` dependency.

### Current State

- **Backend Ferrompi SS1.2**: Shows `FerrompiBackend` implementation delegating to ferrompi API calls. Method mapping table lists: `comm.allgatherv(send, recv, counts, displs)`, `comm.allreduce(send, recv, mpi_op)`, `comm.bcast(buf, root)`, `comm.barrier()`, `comm.rank()`, `comm.size()`.
- **Backend Ferrompi SS2.1**: Shows `ferrompi::init_with_threading(ThreadLevel::Multiple)` and `world.split_shared_memory()`.
- **Backend Ferrompi SS3**: Shows `ferrompi::SharedWindow::new(comm, count)`, `.as_slice(count)`, `.as_mut_slice()`, `.fence()`.
- **Hybrid Parallelism SS1.2**: Lists ferrompi capabilities: `Communicator` is `Send + Sync`, `SharedWindow<T>`, collectives API, threading level.

## Specification

### Requirements

1. Add a new section SS7 "ferrompi API Reference" to `backend-ferrompi.md` (after the existing SS6 "Feature Gating").
2. For each public ferrompi type and method, define:
   - Rust signature (full generic bounds)
   - Preconditions (valid communicator, buffer sizes, etc.)
   - Postconditions (what is guaranteed after the call)
   - Error type (`MpiError` with `error_code()` and `error_class()` methods)
   - Whether the method is `unsafe` and what safety invariants the caller must uphold
3. Document the following public items:

   **Module-level functions:**
   - `ferrompi::init_with_threading(level: ThreadLevel) -> Result<Universe, MpiError>` — MPI initialization. Panics if called twice. Returns a `Universe` that owns the MPI runtime.
   - `Universe::world(&self) -> Communicator` — Get the world communicator.

   **Communicator type:**
   - `Communicator: Send + Sync` — thread-safe handle to an MPI communicator.
   - `fn rank(&self) -> i32`
   - `fn size(&self) -> i32`
   - `fn allgatherv<T: Equivalence>(&self, send: &[T], recv: &mut [T], counts: &[i32], displs: &[i32]) -> Result<(), MpiError>`
   - `fn allreduce<T: Equivalence>(&self, send: &[T], recv: &mut [T], op: Op) -> Result<(), MpiError>`
   - `fn bcast<T: Equivalence>(&self, buf: &mut [T], root: i32) -> Result<(), MpiError>`
   - `fn barrier(&self) -> Result<(), MpiError>`
   - `fn split_shared_memory(&self) -> Result<Communicator, MpiError>`

   **SharedWindow type:**
   - `SharedWindow<T: Equivalence>` — MPI-3 shared memory window.
   - `fn new(comm: &Communicator, count: usize) -> Result<Self, MpiError>` — Allocate shared memory. Leader (rank 0 in comm) allocates `count` elements; followers allocate 0.
   - `fn as_slice(&self, count: usize) -> &[T]` — Read access to the shared memory region. **Safety**: caller must call `fence()` before reading if any rank has written.
   - `fn as_mut_slice(&mut self) -> &mut [T]` — Write access to the local allocation. Returns empty slice on followers.
   - `fn fence(&self) -> Result<(), MpiError>` — Collective synchronization barrier for the window.
   - `Drop` implementation calls `MPI_Win_free`.

   **Supporting types:**
   - `ThreadLevel` enum: `Single`, `Funneled`, `Serialized`, `Multiple`
   - `Op` enum: `Sum`, `Min`, `Max`
   - `Equivalence` trait: marker for MPI-transmissible types (similar to `CommData`)
   - `MpiError` struct: `fn error_code(&self) -> i32`, `fn error_class(&self) -> ErrorClass`, `fn to_string(&self) -> String`
   - `ErrorClass` enum: `Comm`, `Buffer`, `Count`, `Root`, `NoMem`, `Type`, `Win`, `Other`

4. Document the `unsafe` boundaries:
   - `SharedWindow::as_slice` is safe in Rust's borrow checker sense (returns `&[T]`) but has a **logical safety contract**: the caller must ensure no concurrent writes are in progress (enforced by `fence()` calls). This is documented as a precondition, not as Rust `unsafe`.
   - No public ferrompi methods are `unsafe` in the Rust keyword sense. The FFI `unsafe` is encapsulated within ferrompi's implementation.
5. Add a note that ferrompi is a thin wrapper around `MPI_*` C functions. The method names and semantics map directly to MPI standard operations. No abstraction is added beyond Rust type safety and error handling.
6. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-017 as resolved.

### Inputs/Props

- Method signatures inferred from `FerrompiBackend` delegation code in SS1.2
- MPI standard function semantics

### Outputs/Behavior

A complete API reference section that an implementer can use to build or verify the ferrompi crate without reading MPI documentation.

### Error Handling

All fallible methods return `Result<T, MpiError>`. The `MpiError` type provides `error_code()` for the raw MPI error code and `error_class()` for classification into the `ErrorClass` enum.

## Acceptance Criteria

- [ ] Given `backend-ferrompi.md`, when looking after SS6, then a section SS7 "ferrompi API Reference" exists.
- [ ] Given SS7, when counting documented public items, then at least 15 items are documented (2 module functions, 8 Communicator methods, 4 SharedWindow methods, 5+ supporting types).
- [ ] Given SS7, when reading `init_with_threading`, then the signature, preconditions (call once), and error type are documented.
- [ ] Given SS7, when reading `SharedWindow::as_slice`, then the logical safety contract (fence before read) is documented as a precondition.
- [ ] Given SS7, when reading the unsafe boundary note, then it states no public methods are Rust `unsafe`.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-017 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/hpc/backend-ferrompi.md` and locate the end of SS6.
2. Add section `## 7. ferrompi API Reference`.
3. Organize by type: module-level functions, Communicator, SharedWindow, supporting types.
4. For each item, write the signature in a Rust code block with doc comments, followed by precondition/postcondition tables (following the Solver Interface Trait SS2 pattern).
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/hpc/backend-ferrompi.md` — Add SS7 API reference section (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-017 resolution row to Section 7 table

### Patterns to Follow

- **Method contract format**: Follow the Solver Interface Trait SS2 pattern — preconditions/postconditions tables, fallibility note, API mapping.
- **Supporting type definitions**: Follow the `BasisStatus` enum pattern from Solver Interface Trait SS4.2.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT include ferrompi's internal implementation details (FFI calls, pointer management). Only the public API surface is documented.
- Do NOT add methods that are not used by `FerrompiBackend`. The API reference should cover exactly the methods that the backend delegates to, plus the initialization/shutdown methods.
- Do NOT make `as_slice` Rust `unsafe`. The FFI unsafety is encapsulated within ferrompi. The logical safety contract is documented as a precondition.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: None (ferrompi is a standalone crate)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
