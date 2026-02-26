# Report 008 -- ferrompi API Surface Completeness Audit

**Crate**: ferrompi (external)
**Phase**: 3 (Solver + Communication Layer)
**Auditor**: hpc-parallel-computing-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name             | Category          | Spec File             | Section          | Spec vs Real API | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ----------------- | --------------------- | ---------------- | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mpi`                 | RAII guard struct | `backend-ferrompi.md` | SS7.1            | Consistent       | COMPLETE | RAII guard for MPI lifetime. `init()`, `init_thread()`, `world()`, `thread_level()`, `wtime()`, `version()`, `is_initialized()`, `is_finalized()` all documented with signatures, preconditions, and postconditions. `Drop` calls `MPI_Finalize`.                                                                                                                    |
| `Communicator`        | Struct            | `backend-ferrompi.md` | SS7.2            | Consistent       | COMPLETE | Safe handle wrapping `MPI_Comm`. Implements `Send + Sync` (via `unsafe impl`, justified by `MPI_THREAD_MULTIPLE`). Full method inventory: 6 Cobre-used methods with detailed docs (SS7.2.1--SS7.2.8), plus summary tables for management, point-to-point, additional collectives, scalar variants, in-place variants, nonblocking variants, and persistent variants. |
| `SharedWindow<T>`     | Generic struct    | `backend-ferrompi.md` | SS7.3            | Consistent       | COMPLETE | Generic over `T: MpiDatatype`. `allocate`, `local_slice`, `local_slice_mut`, `remote_slice`, `fence` all documented with signatures, preconditions, postconditions, and error types. Lock/unlock RAII guards (`lock`, `lock_all`) documented for completeness. `Drop` calls `MPI_Win_free`. `rma` Cargo feature requirement noted.                                   |
| `ThreadLevel`         | Enum              | `backend-ferrompi.md` | SS7.4.1          | Consistent       | COMPLETE | 4 variants (`Single`, `Funneled`, `Serialized`, `Multiple`) with `#[repr(i32)]` discriminants (0, 1, 2, 3). `Ord` implementation documented for level comparison.                                                                                                                                                                                                    |
| `ReduceOp`            | Enum              | `backend-ferrompi.md` | SS7.4.2          | Consistent       | COMPLETE | 4 variants (`Sum`, `Min`, `Max`, `Prod`) with `#[repr(i32)]`. Cobre uses only `Sum` and `Min`.                                                                                                                                                                                                                                                                       |
| `MpiDatatype`         | Sealed trait      | `backend-ferrompi.md` | SS7.4.3          | Consistent       | COMPLETE | Sealed marker trait with `Copy + Send + 'static` supertraits and `const TAG: DatatypeTag` associated constant. 7 built-in implementations documented (f32, f64, i32, i64, u8, u32, u64). Relationship to Cobre's `CommData` explained.                                                                                                                               |
| `DatatypeTag`         | Enum              | `backend-ferrompi.md` | SS7.4.4          | Consistent       | COMPLETE | 7-variant discriminant enum (`F32`, `F64`, `I32`, `I64`, `U8`, `U32`, `U64`) with `#[repr(i32)]`.                                                                                                                                                                                                                                                                    |
| `Error`               | Enum              | `backend-ferrompi.md` | SS7.4.5          | Consistent       | COMPLETE | 5 variants (`AlreadyInitialized`, `Mpi { class, code, message }`, `InvalidBuffer`, `NotSupported(String)`, `Internal(String)`). `thiserror`-derived. `from_code` and `check` constructors documented. Convenience `Result<T>` type alias.                                                                                                                            |
| `MpiErrorClass`       | Enum              | `backend-ferrompi.md` | SS7.4.6          | Consistent       | COMPLETE | 22 named variants plus `Raw(i32)` fallback. Maps standard MPI error classes. Explicit note about missing `NoMem` variant (surfaces as `Other` or `Raw`).                                                                                                                                                                                                             |
| `SplitType`           | Enum              | `backend-ferrompi.md` | SS7.4.7          | Consistent       | COMPLETE | Documented in supporting types table with `Shared = 0` variant. Used internally by `split_shared()`.                                                                                                                                                                                                                                                                 |
| `Request`             | Handle            | `backend-ferrompi.md` | SS7.4.7          | Consistent       | COMPLETE | Handle for nonblocking operations. Methods: `wait()`, `test()`, `cancel()`.                                                                                                                                                                                                                                                                                          |
| `PersistentRequest`   | Handle            | `backend-ferrompi.md` | SS7.4.7          | Consistent       | COMPLETE | Handle for MPI 4.0+ persistent operations. Methods: `start()`, `wait()`, `test()`.                                                                                                                                                                                                                                                                                   |
| `Status`              | Struct            | `backend-ferrompi.md` | SS7.4.7          | Consistent       | COMPLETE | Message metadata from receive operations.                                                                                                                                                                                                                                                                                                                            |
| `Info`                | RAII wrapper      | `backend-ferrompi.md` | SS7.4.7          | Consistent       | COMPLETE | Wraps `MPI_Info`. RAII Drop calls `MPI_Info_free`.                                                                                                                                                                                                                                                                                                                   |
| `LockType`            | Enum              | `backend-ferrompi.md` | SS7.3.5, SS7.4.7 | Consistent       | COMPLETE | `Exclusive` and `Shared` variants for passive-target synchronization.                                                                                                                                                                                                                                                                                                |
| `LockGuard<'a, T>`    | RAII guard        | `backend-ferrompi.md` | SS7.3.5, SS7.4.7 | Consistent       | COMPLETE | RAII guard from `lock()`. Drop calls `MPI_Win_unlock`.                                                                                                                                                                                                                                                                                                               |
| `LockAllGuard<'a, T>` | RAII guard        | `backend-ferrompi.md` | SS7.3.5, SS7.4.7 | Consistent       | COMPLETE | RAII guard from `lock_all()`. Drop calls `MPI_Win_unlock_all`.                                                                                                                                                                                                                                                                                                       |

### 1.2 Public Functions

| Item Name                         | Category        | Spec File             | Section | Spec vs Real API | Status   | Notes                                                                                                                                                                                                                                  |
| --------------------------------- | --------------- | --------------------- | ------- | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mpi::init()`                     | Constructor     | `backend-ferrompi.md` | SS7.1.1 | Consistent       | COMPLETE | Signature: `pub fn init() -> Result<Self>`. Preconditions, postconditions, error types documented.                                                                                                                                     |
| `Mpi::init_thread()`              | Constructor     | `backend-ferrompi.md` | SS7.1.2 | Consistent       | COMPLETE | Signature: `pub fn init_thread(required: ThreadLevel) -> Result<Self>`. Thread level enforcement documented (returns `Err` if provided level < requested).                                                                             |
| `Mpi::world()`                    | Accessor        | `backend-ferrompi.md` | SS7.1.3 | Consistent       | COMPLETE | Signature: `pub fn world(&self) -> Communicator`. Infallible. Lifetime tied to `Mpi` guard.                                                                                                                                            |
| `Mpi::thread_level()`             | Query           | `backend-ferrompi.md` | SS7.1.4 | Consistent       | COMPLETE | Signature: `fn thread_level(&self) -> ThreadLevel`.                                                                                                                                                                                    |
| `Mpi::wtime()`                    | Static          | `backend-ferrompi.md` | SS7.1.4 | Consistent       | COMPLETE | Signature: `fn wtime() -> f64`. Static method wrapping `MPI_Wtime`.                                                                                                                                                                    |
| `Mpi::version()`                  | Static          | `backend-ferrompi.md` | SS7.1.4 | Consistent       | COMPLETE | Signature: `fn version() -> Result<String>`.                                                                                                                                                                                           |
| `Mpi::is_initialized()`           | Static          | `backend-ferrompi.md` | SS7.1.4 | Consistent       | COMPLETE | Signature: `fn is_initialized() -> bool`.                                                                                                                                                                                              |
| `Mpi::is_finalized()`             | Static          | `backend-ferrompi.md` | SS7.1.4 | Consistent       | COMPLETE | Signature: `fn is_finalized() -> bool`.                                                                                                                                                                                                |
| `Communicator::rank()`            | Query           | `backend-ferrompi.md` | SS7.2.1 | Consistent       | COMPLETE | Signature: `pub fn rank(&self) -> i32`. Infallible. Returns `[0, size())`.                                                                                                                                                             |
| `Communicator::size()`            | Query           | `backend-ferrompi.md` | SS7.2.2 | Consistent       | COMPLETE | Signature: `pub fn size(&self) -> i32`. Infallible. Returns `>= 1`.                                                                                                                                                                    |
| `Communicator::allgatherv()`      | Collective      | `backend-ferrompi.md` | SS7.2.3 | Consistent       | COMPLETE | Signature: `pub fn allgatherv<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], recvcounts: &[i32], displs: &[i32]) -> Result<()>`. Concrete `&[i32]` types for counts/displacements. 5 preconditions and 1 postcondition documented. |
| `Communicator::allreduce()`       | Collective      | `backend-ferrompi.md` | SS7.2.4 | Consistent       | COMPLETE | Signature: `pub fn allreduce<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], op: ReduceOp) -> Result<()>`.                                                                                                                          |
| `Communicator::broadcast()`       | Collective      | `backend-ferrompi.md` | SS7.2.5 | Consistent       | COMPLETE | Signature: `pub fn broadcast<T: MpiDatatype>(&self, data: &mut [T], root: i32) -> Result<()>`.                                                                                                                                         |
| `Communicator::barrier()`         | Collective      | `backend-ferrompi.md` | SS7.2.6 | Consistent       | COMPLETE | Signature: `pub fn barrier(&self) -> Result<()>`.                                                                                                                                                                                      |
| `Communicator::split_shared()`    | Factory         | `backend-ferrompi.md` | SS7.2.7 | Consistent       | COMPLETE | Signature: `pub fn split_shared(&self) -> Result<Communicator>`. Convenience wrapper for `MPI_Comm_split_type(MPI_COMM_TYPE_SHARED)`.                                                                                                  |
| `Communicator::allreduce_init()`  | Persistent      | `backend-ferrompi.md` | SS7.2.8 | Consistent       | COMPLETE | Signature: `pub fn allreduce_init<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], op: ReduceOp) -> Result<PersistentRequest>`. `Error::NotSupported` if MPI < 4.0.                                                                  |
| `Communicator::duplicate()`       | Management      | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Listed in summary table with signature.                                                                                                                                                                                                |
| `Communicator::split()`           | Management      | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Listed in summary table with signature.                                                                                                                                                                                                |
| `Communicator::split_type()`      | Management      | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Listed in summary table with signature. Generalization of `split_shared`.                                                                                                                                                              |
| `Communicator::processor_name()`  | Management      | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Listed in summary table with signature.                                                                                                                                                                                                |
| `Communicator::raw_handle()`      | Management      | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Returns raw `MPI_Comm` handle.                                                                                                                                                                                                         |
| `Communicator::send()`            | Point-to-point  | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Blocking send with signature.                                                                                                                                                                                                          |
| `Communicator::recv()`            | Point-to-point  | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Blocking receive; returns `(source, tag, count)`.                                                                                                                                                                                      |
| `Communicator::isend()`           | Nonblocking P2P | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Returns `Request`.                                                                                                                                                                                                                     |
| `Communicator::irecv()`           | Nonblocking P2P | `backend-ferrompi.md` | SS7.2.9 | Consistent       | COMPLETE | Returns `Request`.                                                                                                                                                                                                                     |
| `SharedWindow::allocate()`        | Factory         | `backend-ferrompi.md` | SS7.3.1 | Consistent       | COMPLETE | Signature: `pub fn allocate(comm: &Communicator, local_count: usize) -> Result<Self>`. Preconditions (shared-memory communicator, collective call). Postconditions (uninitialized memory).                                             |
| `SharedWindow::local_slice()`     | Accessor        | `backend-ferrompi.md` | SS7.3.2 | Consistent       | COMPLETE | Signature: `pub fn local_slice(&self) -> &[T]`. Infallible.                                                                                                                                                                            |
| `SharedWindow::local_slice_mut()` | Accessor        | `backend-ferrompi.md` | SS7.3.2 | Consistent       | COMPLETE | Signature: `pub fn local_slice_mut(&mut self) -> &mut [T]`. Infallible. Rust borrow checker enforces exclusive access.                                                                                                                 |
| `SharedWindow::remote_slice()`    | Accessor        | `backend-ferrompi.md` | SS7.3.3 | Consistent       | COMPLETE | Signature: `pub fn remote_slice(&self, rank: i32) -> Result<&[T]>`. Logical safety contract documented (fence before read).                                                                                                            |
| `SharedWindow::fence()`           | Synchronization | `backend-ferrompi.md` | SS7.3.4 | Consistent       | COMPLETE | Signature: `pub fn fence(&self) -> Result<()>`. Collective operation.                                                                                                                                                                  |
| `SharedWindow::lock()`            | Synchronization | `backend-ferrompi.md` | SS7.3.5 | Consistent       | COMPLETE | Returns RAII `LockGuard<'_, T>`. Not used by Cobre.                                                                                                                                                                                    |
| `SharedWindow::lock_all()`        | Synchronization | `backend-ferrompi.md` | SS7.3.5 | Consistent       | COMPLETE | Returns RAII `LockAllGuard<'_, T>`. Not used by Cobre.                                                                                                                                                                                 |
| `SharedWindow::raw_handle()`      | Accessor        | `backend-ferrompi.md` | SS7.3.6 | Consistent       | COMPLETE | Returns raw `MPI_Win` handle.                                                                                                                                                                                                          |
| `SharedWindow::comm_size()`       | Query           | `backend-ferrompi.md` | SS7.3.6 | Consistent       | COMPLETE | Returns size of window's communicator.                                                                                                                                                                                                 |
| `Error::from_code()`              | Constructor     | `backend-ferrompi.md` | SS7.4.5 | Consistent       | COMPLETE | Constructs `Error` from raw MPI error code.                                                                                                                                                                                            |
| `Error::check()`                  | Constructor     | `backend-ferrompi.md` | SS7.4.5 | Consistent       | COMPLETE | Returns `Ok(())` for `MPI_SUCCESS`.                                                                                                                                                                                                    |
| `ferrompi::slurm::*`              | Module          | --                    | --      | MISSING from SS7 | PARTIAL  | SLURM helpers referenced in multiple HPC specs but absent from the ferrompi API reference. See F-001.                                                                                                                                  |

### 1.3 Error Types

| Item Name                 | Category      | Spec File             | Section      | Spec vs Real API | Status   | Notes                                                                                                                                                                                                                                 |
| ------------------------- | ------------- | --------------------- | ------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ferrompi::Error`         | Enum          | `backend-ferrompi.md` | SS7.4.5      | Consistent       | COMPLETE | 5 variants with all field types specified. `thiserror`-derived. `Mpi` variant carries `MpiErrorClass`, `i32` code, and `String` message. Convenience `Result<T>` alias.                                                               |
| `ferrompi::MpiErrorClass` | Enum          | `backend-ferrompi.md` | SS7.4.6      | Consistent       | COMPLETE | 22 named variants plus `Raw(i32)` fallback. Explicit note that `NoMem` is absent (surfaces as `Other` or `Raw`).                                                                                                                      |
| Init failure handling     | Error flow    | `backend-ferrompi.md` | SS5.3        | N/A              | COMPLETE | `Mpi::init_thread` failure mapped to `BackendError::InitializationFailed`. Thread level insufficiency also returns `Err`.                                                                                                             |
| MPI error mapping         | Mapping table | `backend-ferrompi.md` | SS5.1--SS5.2 | N/A              | COMPLETE | 8-row table mapping MPI error codes to `CommError` variants. Full `map_ferrompi_error` implementation code shown with pattern matching on `Error` variants. Sentinel values for missing context fields documented as design decision. |

### 1.4 Trait Implementations

| Item Name                      | Category    | Spec File             | Section      | Spec vs Real API | Status   | Notes                                                                                                         |
| ------------------------------ | ----------- | --------------------- | ------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `MpiDatatype for f64`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_DOUBLE`. Used by Cobre for cut coefficients, convergence statistics.                             |
| `MpiDatatype for f32`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_FLOAT`.                                                                                          |
| `MpiDatatype for i32`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_INT`. Used as counts/displacements type in `allgatherv`.                                         |
| `MpiDatatype for i64`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_LONG_LONG`.                                                                                      |
| `MpiDatatype for u8`           | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_UNSIGNED_CHAR`. Used by Cobre for serialized cut wire format.                                    |
| `MpiDatatype for u32`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_UNSIGNED`. Used by Cobre for slot indices.                                                       |
| `MpiDatatype for u64`          | Impl        | `backend-ferrompi.md` | SS7.4.3      | Consistent       | COMPLETE | Maps to `MPI_UNSIGNED_LONG_LONG`.                                                                             |
| `Send + Sync for Communicator` | Unsafe impl | `backend-ferrompi.md` | SS7.2, SS7.5 | Consistent       | COMPLETE | Justified by `MPI_THREAD_MULTIPLE` guarantee. Listed in unsafe boundary summary.                              |
| `Drop for Mpi`                 | Impl        | `backend-ferrompi.md` | SS7.1.4      | Consistent       | COMPLETE | Calls `MPI_Finalize`. Ordering constraint documented (all windows and derived communicators must drop first). |
| `Drop for SharedWindow<T>`     | Impl        | `backend-ferrompi.md` | SS7.3.7      | Consistent       | COMPLETE | Calls `MPI_Win_free`. Must complete before `Mpi` drop.                                                        |

### 1.5 Crate Boundary Interactions

| Boundary                                         | Consumer Spec                      | Spec vs Real API | Status                  | Notes                                                                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------- | ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-comm -> ferrompi (Communicator delegation) | `backend-ferrompi.md` SS1.2        | Consistent       | COMPLETE                | Method mapping table documents each trait method to ferrompi API call. Type conversions: `usize` to `i32` for counts/displs/root, `ReduceOp` enum mapping.                                    |
| cobre-comm -> ferrompi (SharedWindow delegation) | `backend-ferrompi.md` SS3.1--SS3.2 | Consistent       | COMPLETE                | `FerrompiRegion<T>` wraps `SharedWindow<T>`. Leader/follower allocation pattern: leader allocates `count`, followers allocate 0. `remote_slice(0)` for reads, `local_slice_mut()` for writes. |
| cobre-comm -> ferrompi (Initialization)          | `backend-ferrompi.md` SS2.1        | PARTIAL          | See F-002               | `Mpi` RAII guard lifecycle has a structural gap -- guard not stored in `FerrompiBackend` struct.                                                                                              |
| cobre-comm -> ferrompi (Error mapping)           | `backend-ferrompi.md` SS5.1--SS5.2 | Consistent       | COMPLETE                | Full error mapping with `map_ferrompi_error` function. All ferrompi `Error` variants handled.                                                                                                 |
| cobre-comm -> ferrompi (Feature gating)          | `backend-ferrompi.md` SS6          | Consistent       | COMPLETE                | `#[cfg(feature = "mpi")]` gates all ferrompi code. `Cargo.toml` feature declaration shown. Build profiles documented.                                                                         |
| HPC specs -> ferrompi (API name cross-refs)      | Multiple                           | PARTIAL          | See F-003, F-004, F-005 | Several HPC specs use stale ferrompi API names that do not match the SS7 canonical reference.                                                                                                 |

---

## 2. Category Summaries

| Category                    | COMPLETE | PARTIAL | MISSING | Total  |
| --------------------------- | -------- | ------- | ------- | ------ |
| Public Types                | 17       | 0       | 0       | 17     |
| Public Functions            | 35       | 1       | 0       | 36     |
| Error Types                 | 4        | 0       | 0       | 4      |
| Trait Implementations       | 10       | 0       | 0       | 10     |
| Crate Boundary Interactions | 4        | 2       | 0       | 6      |
| **Total**                   | **70**   | **3**   | **0**   | **73** |

---

## 3. Findings

### F-001: `ferrompi::slurm` Module Absent from SS7 API Reference

**Severity**: High
**Affected Crate**: ferrompi
**Affected Phase**: Phase 3 (Communication Layer)

**Evidence**:

Multiple HPC specs reference a `ferrompi::slurm` module that does not appear anywhere in the ferrompi API reference (SS7):

- `slurm-deployment.md` line 12: `"ferrompi::slurm::local_rank() to read SLURM topology variables (SLURM_LOCALID, SLURM_CPUS_PER_TASK, etc.)"`
- `slurm-deployment.md` line 44: `"The Rust binary reads SLURM_CPUS_PER_TASK via ferrompi::slurm::cpus_per_task()"`
- `slurm-deployment.md` line 176: `"The Rust binary reads these SLURM environment variables via ferrompi::slurm helpers during initialization"`
- `memory-architecture.md` line 105: `"Main thread determines NUMA topology via ferrompi::slurm helpers"`
- `ferrompi.md` (crate overview) line 57--59: `"SLURM integration -- Topology query APIs that read resource allocations from the scheduler environment (SLURM_CPUS_PER_TASK, SLURM_MEM_PER_NODE) to configure thread counts and memory budgets without manual specification."`

The SS7 API reference -- which was rewritten in gap-resolution ticket-022 to match the real ferrompi crate -- documents no `slurm` module, no `local_rank()` function, and no `cpus_per_task()` function. This means either: (a) the real ferrompi crate has a `slurm` module that ticket-022 omitted from the API reference, or (b) the SLURM helpers do not exist in the real crate and the other HPC specs reference a speculative API.

**Impact**: If the `ferrompi::slurm` module does not exist in the real crate, all SLURM environment variable reading must be implemented elsewhere (likely `cobre-comm` or `cobre-cli`). Four spec files reference functions that may not exist, creating implementation confusion at Phase 3.

**Recommendation**: (1) Verify whether the real ferrompi crate at github.com/rjmalves/ferrompi contains a `slurm` module. (2) If it does, add its API to SS7. (3) If it does not, update all referencing specs to attribute SLURM environment variable reading to `cobre-comm` or `cobre-cli` instead of ferrompi, and update the ferrompi crate overview accordingly.

---

### F-002: `Mpi` RAII Guard Not Stored in `FerrompiBackend` Struct

**Severity**: High
**Affected Crate**: cobre-comm (ferrompi integration)
**Affected Phase**: Phase 4 (Communication Layer)

**Evidence**:

The `FerrompiBackend::new()` constructor in `backend-ferrompi.md` SS2.1 (line 132--166) creates an `Mpi` guard as a local variable:

```rust
let mpi = ferrompi::Mpi::init_thread(
    ferrompi::ThreadLevel::Multiple,
).map_err(|e| BackendError::InitializationFailed {
    backend: "mpi".to_string(),
    source: Box::new(e),
})?;

let world = mpi.world();
```

A comment at line 135--137 states: `"ferrompi::Mpi::init_thread returns the Mpi guard whose Drop calls MPI_Finalize. The guard is stored in the backend struct (see note below on lifetime management)."` However, the struct definition at SS1.1 (line 20--28) contains only two fields:

```rust
pub struct FerrompiBackend {
    world: ferrompi::Communicator,
    shared: Option<ferrompi::Communicator>,
}
```

There is no `mpi: ferrompi::Mpi` field. When `new()` returns, the local `mpi` variable is dropped, which calls `MPI_Finalize`. The `world` communicator extracted from it would then be invalid. This is a structural correctness issue in the spec code.

The `Drop` implementation at SS2.2 (line 174--181) confirms the inconsistency: `"MPI_Finalize is called by ferrompi's Mpi drop."` But no `Mpi` guard is present to be dropped.

**Impact**: The initialization code as written would finalize MPI immediately after construction. Implementers following this spec verbatim would produce a runtime crash (use-after-finalize on the world communicator). The struct must include an `mpi: ferrompi::Mpi` field to hold the RAII guard alive.

**Recommendation**: Add `mpi: ferrompi::Mpi` as the first field of `FerrompiBackend`. Update the struct definition in SS1.1, the extended struct in SS4.2 (persistent collectives), and the `Drop` implementation in SS2.2 to explicitly drop `mpi` last.

---

### F-003: `communicator-trait.md` Uses Stale Name `split_shared_memory()` for ferrompi API

**Severity**: Medium
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4 (Communication Layer)

**Evidence**:

The communicator trait spec references the ferrompi function as `split_shared_memory()` in three locations, while the canonical SS7 API reference documents it as `split_shared()`:

- `communicator-trait.md` line 370: `"This corresponds to comm.split_shared_memory() in the ferrompi API"`
- `communicator-trait.md` line 512: `"This is consistent with the split_shared_memory() convention in ferrompi"`
- `communicator-trait.md` line 653 (Cross-References): `"Shared memory communicator creation via split_shared_memory()"`

The SS7 canonical reference at `backend-ferrompi.md` line 779--806 documents the method as:

```rust
impl Communicator {
    pub fn split_shared(&self) -> Result<Communicator>
}
```

The ticket-022 rewrite established `split_shared()` as the real API name, but `communicator-trait.md` was not updated to match.

**Impact**: Implementers reading the communicator trait spec will search for a `split_shared_memory()` method that does not exist in ferrompi. The mismatch creates confusion during Phase 4 implementation.

**Recommendation**: Replace all three occurrences of `split_shared_memory()` in `communicator-trait.md` with `split_shared()`.

---

### F-004: `ferrompi.md` Crate Overview Uses Stale Name `init_with_threading()`

**Severity**: Medium
**Affected Crate**: ferrompi (documentation)
**Affected Phase**: Phase 3

**Evidence**:

The ferrompi crate overview at `src/crates/ferrompi.md` line 39 states:

`"init_with_threading(ThreadLevel::Multiple) for full MPI thread support."`

The SS7 canonical reference at `backend-ferrompi.md` SS7.1.2 (line 537--543) documents the actual function name as:

```rust
impl Mpi {
    pub fn init_thread(required: ThreadLevel) -> Result<Self>
}
```

Every other spec file that references this function uses the correct name `Mpi::init_thread()`:

- `hybrid-parallelism.md` line 53: `"Mpi::init_thread(ThreadLevel::Multiple)"`
- `hybrid-parallelism.md` line 202: `"ferrompi::Mpi::init_thread(ThreadLevel::Multiple)"`
- `slurm-deployment.md` line 12: `"ferrompi::Mpi::init_thread(Multiple)"`
- `backend-ferrompi.md` line 138: `"ferrompi::Mpi::init_thread(...)"`

Only the crate overview uses the stale name `init_with_threading`.

**Impact**: Implementers reading the crate overview as their first introduction to ferrompi will encounter an incorrect function name.

**Recommendation**: Replace `init_with_threading(ThreadLevel::Multiple)` with `Mpi::init_thread(ThreadLevel::Multiple)` in `src/crates/ferrompi.md` line 39.

---

### F-005: `ferrompi.md` and `communication-patterns.md` Use Stale Name `split_shared_memory()`

**Severity**: Medium
**Affected Crate**: ferrompi (documentation), cobre-comm
**Affected Phase**: Phase 3--4

**Evidence**:

Two additional files beyond `communicator-trait.md` (covered in F-003) reference the stale ferrompi function name:

- `src/crates/ferrompi.md` line 17: `"Combined with split_shared_memory() for grouping co-located ranks"`
- `src/crates/ferrompi.md` line 61: `"Topology detection -- split_shared_memory() groups co-located ranks"`
- `src/specs/hpc/communication-patterns.md` line 208 (Cross-References): `"ferrompi capabilities table, SharedWindow<T>, split_shared_memory()"`

The SS7 canonical name is `split_shared()` (see F-003 evidence).

**Impact**: Same as F-003. Combined with F-003 and F-004, there are 6 stale API name references across 3 files that were not updated when ticket-022 rewrote the API reference.

**Recommendation**: Replace `split_shared_memory()` with `split_shared()` in both `ferrompi.md` (2 occurrences) and `communication-patterns.md` (1 occurrence).

---

### F-006: `SharedWindow<T>` Requires `rma` Feature Flag but Feature Not Documented in Cobre Integration

**Severity**: Low
**Affected Crate**: cobre-comm (Cargo.toml)
**Affected Phase**: Phase 4

**Evidence**:

The SS7 API reference at `backend-ferrompi.md` line 881 states:

`"SharedWindow<T> provides access to MPI-3 shared memory windows (MPI_Win_allocate_shared). Requires the rma Cargo feature."`

However, the Cobre integration section at SS6.2 (line 466--473) specifies the ferrompi dependency as:

```toml
[features]
default = []
mpi = ["dep:ferrompi"]

[dependencies]
ferrompi = { version = "0.1", optional = true }
```

No `rma` feature is enabled on the ferrompi dependency. Since `SharedWindow<T>` is essential for Cobre's shared memory pattern (opening tree, cut pool -- used throughout the HPC specs), the `rma` feature must be explicitly enabled.

**Impact**: If the `rma` feature is required to compile `SharedWindow<T>`, the Cargo dependency specification as written would fail to compile the `FerrompiRegion<T>` wrapper. This is a build-time error, easily caught, but should be corrected in the spec.

**Recommendation**: Update the `Cargo.toml` in SS6.2 to: `ferrompi = { version = "0.1", optional = true, features = ["rma"] }`.

---

### F-007: `FerrompiBackend` Extended Struct Definition Inconsistent Across Sections

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**:

The `FerrompiBackend` struct is defined in two places with different fields:

SS1.1 (line 20--28) defines:

```rust
pub struct FerrompiBackend {
    world: ferrompi::Communicator,
    shared: Option<ferrompi::Communicator>,
}
```

SS4.2 (line 346--355) extends it with a `persistent_allreduce` field:

```rust
pub struct FerrompiBackend {
    world: ferrompi::Communicator,
    shared: Option<ferrompi::Communicator>,
    persistent_allreduce: Option<ferrompi::PersistentRequest>,
}
```

There is no note in SS1.1 indicating that the struct will be extended in SS4.2, nor does SS4.2 explicitly state that it supersedes SS1.1. Additionally, neither definition includes the `mpi: ferrompi::Mpi` field identified in F-002.

**Impact**: Ambiguity about the authoritative struct definition. An implementer reading only SS1.1 would miss the persistent collective field.

**Recommendation**: Consolidate the struct definition in SS1.1 to include all fields (including the `mpi` guard from F-002 and the optional persistent request), with comments indicating which are for the base implementation and which are for the persistent collective optimization.

---

## 4. Spec vs Real API Verification Summary

The ferrompi API reference (SS7) was rewritten in gap-resolution ticket-022 to match the real crate. Based on internal consistency analysis across the spec corpus, the SS7 API reference presents a coherent and detailed API surface. The following assessment applies:

| SS7 Component                                        | Internal Consistency  | Cross-Spec Alignment                                                 | Assessment          |
| ---------------------------------------------------- | --------------------- | -------------------------------------------------------------------- | ------------------- |
| `Mpi` struct and lifecycle                           | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS2, `hybrid-parallelism.md` SS6 | PASS                |
| `Communicator` methods                               | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS1.2 mapping table              | PASS                |
| `SharedWindow<T>` operations                         | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS3 wrapper code                 | PASS                |
| `MpiDatatype` implementations                        | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS7.4.3                          | PASS                |
| `ThreadLevel` enum                                   | Consistent within SS7 | Consistent across all HPC specs                                      | PASS                |
| `ReduceOp` enum                                      | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS1.2                            | PASS                |
| `Error` / `MpiErrorClass`                            | Consistent within SS7 | Consistent in `backend-ferrompi.md` SS5                              | PASS                |
| `ferrompi::slurm` module                             | NOT PRESENT in SS7    | Referenced in 4 HPC specs                                            | FAIL (F-001)        |
| API naming (`split_shared` vs `split_shared_memory`) | `split_shared` in SS7 | Stale names in 3 files                                               | FAIL (F-003, F-005) |
| API naming (`init_thread` vs `init_with_threading`)  | `init_thread` in SS7  | Stale name in 1 file                                                 | FAIL (F-004)        |

**Note**: This audit cannot independently verify the SS7 API reference against the real crate source code at github.com/rjmalves/ferrompi (no network access). The assessment above is based on internal consistency within the spec corpus. The ticket-022 rewrite is assumed correct for the SS7 content itself; the findings above concern content outside SS7 that was not updated to match.

---

## 5. Acceptance Criteria Verification

| Criterion                                                                                                             | Status      | Evidence                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every public type and function in SS7 matches the real crate API                                                      | CONDITIONAL | SS7 is internally consistent and comprehensive (17 types, 36 functions). Cannot independently verify against real crate. `ferrompi::slurm` module is missing from SS7 (F-001).                                                  |
| `Mpi` RAII guard lifecycle (init_thread, world(), Drop) is documented                                                 | PARTIAL     | All three lifecycle phases are documented in SS7.1. However, the integration code in SS2.1 does not store the guard in the struct, creating a use-after-finalize bug (F-002).                                                   |
| `allgatherv` variable-length buffer parameters specified with concrete Rust types                                     | PASS        | SS7.2.3 specifies `recvcounts: &[i32]` and `displs: &[i32]`. The type conversion from Cobre's `&[usize]` is documented in SS1.2.                                                                                                |
| `SharedWindow<T>` operations (allocate, local_slice, remote_slice, local_slice_mut, fence) documented with signatures | PASS        | All 5 operations documented with full signatures, preconditions, postconditions, and error types in SS7.3.1--SS7.3.4.                                                                                                           |
| `MpiDatatype` implementations include at least f64, i32, u8                                                           | PASS        | 7 implementations documented: f32, f64, i32, i64, u8, u32, u64. Sealed trait prevents downstream implementations.                                                                                                               |
| All HPC spec references to ferrompi use correct API names from SS7                                                    | FAIL        | 6 stale references across 3 files: `split_shared_memory()` (5 occurrences in communicator-trait.md, ferrompi.md, communication-patterns.md) and `init_with_threading()` (1 occurrence in ferrompi.md). See F-003, F-004, F-005. |

---

## 6. Crate Verdict

**CONDITIONAL PASS**

The ferrompi API reference in SS7 is comprehensive and internally consistent, covering all types, functions, error handling, and trait implementations needed for the Cobre integration. The acceptance criteria for `allgatherv` parameters, `SharedWindow<T>` operations, and `MpiDatatype` implementations are fully met.

The verdict is conditional on resolving 7 findings:

- **2 High severity** (must fix before Phase 3 implementation):
  - F-001: Document or relocate the `ferrompi::slurm` module -- 4 HPC specs depend on it
  - F-002: Fix the `Mpi` RAII guard lifetime in the `FerrompiBackend` struct definition

- **3 Medium severity** (should fix before Phase 4):
  - F-003: Fix `split_shared_memory()` -> `split_shared()` in `communicator-trait.md` (3 occurrences)
  - F-004: Fix `init_with_threading()` -> `Mpi::init_thread()` in `ferrompi.md` (1 occurrence)
  - F-005: Fix `split_shared_memory()` -> `split_shared()` in `ferrompi.md` and `communication-patterns.md` (3 occurrences)

- **2 Low severity** (fix during implementation):
  - F-006: Enable `rma` feature in ferrompi Cargo dependency for `SharedWindow<T>`
  - F-007: Consolidate the two `FerrompiBackend` struct definitions into one authoritative version

Total stale API name references to correct: 7 occurrences across 3 files.
