# Report 006 -- cobre-comm API Surface Completeness Audit

**Crate**: cobre-comm
**Phase**: 4 (Communication Layer)
**Auditor**: hpc-parallel-computing-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name              | Category     | Spec File               | Section      | Status   | Notes                                                                                                                                                                                                                              |
| ---------------------- | ------------ | ----------------------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Communicator`         | Trait        | `communicator-trait.md` | SS1.1        | COMPLETE | Full Rust trait definition with 6 methods, generic `T: CommData` bound, `Send + Sync` supertrait. All method signatures are concrete with return types.                                                                            |
| `SharedMemoryProvider` | Trait        | `communicator-trait.md` | SS4.1        | COMPLETE | Full Rust trait definition with associated type `Region<T: CommData>: SharedRegion<T>`, 3 methods, `Send + Sync` supertrait.                                                                                                       |
| `SharedRegion<T>`      | Trait        | `communicator-trait.md` | SS4.2        | COMPLETE | Full Rust trait definition with 3 methods (`as_slice`, `as_mut_slice`, `fence`), `Send + Sync` bound. Lifecycle phases documented.                                                                                                 |
| `CommData`             | Marker trait | `communicator-trait.md` | SS1.2        | COMPLETE | Trait definition with bounds `Send + Sync + Copy + 'static` and blanket implementation.                                                                                                                                            |
| `ReduceOp`             | Enum         | `communicator-trait.md` | SS1.3        | COMPLETE | Full Rust enum with 3 variants (`Sum`, `Min`, `Max`), derive macros (`Debug, Clone, Copy, PartialEq, Eq`). MPI operation mapping documented.                                                                                       |
| `CommError`            | Enum         | `communicator-trait.md` | SS1.4, SS4.6 | COMPLETE | Full Rust enum with 5 variants (`CollectiveFailed`, `InvalidBufferSize`, `InvalidRoot`, `InvalidCommunicator`, `AllocationFailed`), all field types specified.                                                                     |
| `BackendError`         | Enum         | `backend-selection.md`  | SS6.2        | COMPLETE | Full Rust enum with 4 variants (`BackendNotAvailable`, `InvalidBackend`, `InitializationFailed`, `MissingConfiguration`), all field types specified including `Box<dyn std::error::Error + Send + Sync>`.                          |
| `BackendKind`          | Enum         | `backend-selection.md`  | SS5.2        | COMPLETE | Full Rust enum with 5 variants (`Auto`, `Mpi`, `Tcp(TcpConfig)`, `Shm(ShmConfig)`, `Local`).                                                                                                                                       |
| `FerrompiBackend`      | Struct       | `backend-ferrompi.md`   | SS1.1        | COMPLETE | Full Rust struct definition with 2 fields (`world: ferrompi::Communicator`, `shared: Option<ferrompi::Communicator>`). Feature-gated with `#[cfg(feature = "mpi")]`.                                                               |
| `FerrompiRegion<T>`    | Struct       | `backend-ferrompi.md`   | SS3.2        | COMPLETE | Full Rust struct definition with 2 fields (`window: ferrompi::SharedWindow<T>`, `count: usize`). Feature-gated.                                                                                                                    |
| `LocalBackend`         | Struct       | `backend-local.md`      | SS1.1        | COMPLETE | Full Rust struct definition: zero-sized type `pub struct LocalBackend;`. No fields.                                                                                                                                                |
| `HeapRegion<T>`        | Struct       | `backend-local.md`      | SS3.2        | PARTIAL  | Struct defined with `data: Vec<T>` field. However, `create_shared_region` uses `vec![T::default(); count]` which requires `T: Default`, but `CommData` bounds are `Send + Sync + Copy + 'static` -- no `Default` bound. See F-001. |
| `CommBackend`          | Enum         | `backend-selection.md`  | SS4.2        | COMPLETE | Full Rust enum with 4 variants (feature-gated `Mpi`, `Tcp`, `Shm`, always-present `Local`). `cfg` guards on the enum itself and on individual variants.                                                                            |
| `TcpConfig`            | Struct       | `comm.md`               | SS3.2        | PARTIAL  | Listed in the crate overview with field names but no Rust struct definition in any spec. TCP backend spec is deferred to Epic 02. See F-002.                                                                                       |
| `ShmConfig`            | Struct       | `comm.md`               | SS3.2        | PARTIAL  | Listed in the crate overview with field names but no Rust struct definition in any spec. Shm backend spec is deferred to Epic 02. See F-002.                                                                                       |

### 1.2 Public Functions

| Item Name                                    | Category     | Spec File               | Section      | Status   | Notes                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ------------ | ----------------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Communicator::allgatherv`                   | Trait method | `communicator-trait.md` | SS1.1, SS2.1 | COMPLETE | Full signature: `fn allgatherv<T: CommData>(&self, send: &[T], recv: &mut [T], counts: &[usize], displs: &[usize]) -> Result<(), CommError>`. Preconditions, postconditions, error semantics, thread safety all documented. Variable-length buffer handling with `counts` array and `displs` displacement calculation specified with concrete `&[usize]` types. |
| `Communicator::allreduce`                    | Trait method | `communicator-trait.md` | SS1.1, SS2.2 | COMPLETE | Full signature: `fn allreduce<T: CommData>(&self, send: &[T], recv: &mut [T], op: ReduceOp) -> Result<(), CommError>`. Preconditions, postconditions, floating-point non-determinism note documented.                                                                                                                                                           |
| `Communicator::broadcast`                    | Trait method | `communicator-trait.md` | SS1.1, SS2.3 | COMPLETE | Full signature: `fn broadcast<T: CommData>(&self, buf: &mut [T], root: usize) -> Result<(), CommError>`. Preconditions, postconditions, error semantics documented.                                                                                                                                                                                             |
| `Communicator::barrier`                      | Trait method | `communicator-trait.md` | SS1.1, SS2.4 | COMPLETE | Full signature: `fn barrier(&self) -> Result<(), CommError>`. Preconditions (all ranks must call), postconditions documented.                                                                                                                                                                                                                                   |
| `Communicator::rank`                         | Trait method | `communicator-trait.md` | SS1.1, SS2.5 | COMPLETE | Full signature: `fn rank(&self) -> usize`. Infallible. Postconditions (constant, in `0..size()`, unique) documented.                                                                                                                                                                                                                                            |
| `Communicator::size`                         | Trait method | `communicator-trait.md` | SS1.1, SS2.5 | COMPLETE | Full signature: `fn size(&self) -> usize`. Infallible. Postconditions (constant, >= 1) documented.                                                                                                                                                                                                                                                              |
| `Communicator::is_root`                      | Trait method | --                      | --           | MISSING  | Listed in the ticket requirements but not present in any spec file. The trait definition has no `is_root()` method. See F-003.                                                                                                                                                                                                                                  |
| `SharedMemoryProvider::create_shared_region` | Trait method | `communicator-trait.md` | SS4.1        | COMPLETE | Full signature: `fn create_shared_region<T: CommData>(&self, count: usize) -> Result<Self::Region<T>, CommError>`. Error contract (`AllocationFailed`) documented.                                                                                                                                                                                              |
| `SharedMemoryProvider::split_local`          | Trait method | `communicator-trait.md` | SS4.1        | COMPLETE | Full signature: `fn split_local(&self) -> Result<Box<dyn Communicator>, CommError>`. Returns dynamic dispatch (initialization-only, not hot path).                                                                                                                                                                                                              |
| `SharedMemoryProvider::is_leader`            | Trait method | `communicator-trait.md` | SS4.1        | COMPLETE | Full signature: `fn is_leader(&self) -> bool`. Infallible. Semantics documented for true shared memory and HeapFallback.                                                                                                                                                                                                                                        |
| `SharedRegion::as_slice`                     | Trait method | `communicator-trait.md` | SS4.2        | COMPLETE | Full signature: `fn as_slice(&self) -> &[T]`. Preconditions (fence must have completed) documented.                                                                                                                                                                                                                                                             |
| `SharedRegion::as_mut_slice`                 | Trait method | `communicator-trait.md` | SS4.2        | COMPLETE | Full signature: `fn as_mut_slice(&mut self) -> &mut [T]`. Leader-only semantics documented.                                                                                                                                                                                                                                                                     |
| `SharedRegion::fence`                        | Trait method | `communicator-trait.md` | SS4.2        | COMPLETE | Full signature: `fn fence(&self) -> Result<(), CommError>`. Collective operation semantics documented.                                                                                                                                                                                                                                                          |
| `create_communicator()` (no-feature)         | Factory      | `backend-selection.md`  | SS4.1        | COMPLETE | Full signature: `pub fn create_communicator() -> Result<LocalCommunicator, BackendError>`. For `#[cfg(not(any(feature = "mpi", feature = "tcp", feature = "shm")))]`.                                                                                                                                                                                           |
| `create_communicator()` (single-feature)     | Factory      | `backend-selection.md`  | SS4.1        | PARTIAL  | Signature uses `impl Communicator` return type: `pub fn create_communicator() -> Result<impl Communicator, BackendError>`. The `impl Communicator` return type does not include `SharedMemoryProvider`. See F-004.                                                                                                                                              |
| `create_communicator()` (multi-feature)      | Factory      | `backend-selection.md`  | SS4.2        | PARTIAL  | Returns `CommBackend` enum. `CommBackend` implements `Communicator` (shown) but `SharedMemoryProvider` implementation is not shown. See F-005.                                                                                                                                                                                                                  |
| `FerrompiBackend::new()`                     | Constructor  | `backend-ferrompi.md`   | SS2.1        | COMPLETE | Full signature: `pub fn new() -> Result<Self, BackendError>`. Initialization sequence (Steps 1-3), error conditions, panic conditions documented.                                                                                                                                                                                                               |
| `LocalBackend::new()`                        | Constructor  | `backend-local.md`      | SS4.5        | PARTIAL  | Referenced in `backend-selection.md` SS4.1 as `LocalCommunicator::new()` and in `backend-local.md` SS4.4 as `LocalBackend::new()` but the constructor signature is never formally defined. The ZST construction (`let comm = LocalBackend;`) is shown in examples. See F-006.                                                                                   |

### 1.3 Error Types

| Item Name                                                 | Category      | Spec File               | Section      | Status   | Notes                                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ------------- | ----------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CommError`                                               | Enum          | `communicator-trait.md` | SS1.4, SS4.6 | COMPLETE | 5 variants with all field types specified. Per-method error contracts documented in SS2.1--SS2.5. Extension with `AllocationFailed` in SS4.6.                                                                                                          |
| `BackendError`                                            | Enum          | `backend-selection.md`  | SS6.2        | COMPLETE | 4 variants with all field types specified. Structured error output with JSON examples. Error precedence in initialization sequence documented (SS6.5).                                                                                                 |
| `CommError` / `BackendError` relationship to `cobre-core` | Integration   | `comm.md`               | SS2          | PARTIAL  | The crate overview states the dependency is `cobre-core (CommError integration only)` and references `Structured Output SS2` for error kind registry. However, no concrete `From<CommError>` or `Into<CobreError>` conversion is specified. See F-007. |
| Per-method error contracts                                | Contract      | `communicator-trait.md` | SS2.1--SS2.5 | COMPLETE | Each method documents which `CommError` variants it can return and under what conditions. `rank()` and `size()` are infallible.                                                                                                                        |
| MPI error code mapping                                    | Mapping table | `backend-ferrompi.md`   | SS5.1        | COMPLETE | 8-row table mapping MPI error codes to `CommError` variants. `map_ferrompi_error` helper with full implementation shown (SS5.2).                                                                                                                       |

### 1.4 Trait Implementations

| Item Name                                  | Category    | Spec File               | Section | Status   | Notes                                                                                                                                                                                                           |
| ------------------------------------------ | ----------- | ----------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Communicator for FerrompiBackend`         | Impl        | `backend-ferrompi.md`   | SS1.2   | COMPLETE | Full implementation code for all 6 methods. Method mapping table (SS1.2) documents each ferrompi API call and type conversion (`usize` to `i32` for counts/displs, `ReduceOp` mapping, `root: usize` to `i32`). |
| `SharedMemoryProvider for FerrompiBackend` | Impl        | `backend-ferrompi.md`   | SS3.1   | COMPLETE | Full implementation code for all 3 methods. Leader/follower allocation logic documented.                                                                                                                        |
| `SharedRegion<T> for FerrompiRegion<T>`    | Impl        | `backend-ferrompi.md`   | SS3.2   | COMPLETE | Full implementation code for all 3 methods. `remote_slice(0)` pattern for read access, `local_slice_mut()` for write access.                                                                                    |
| `Drop for FerrompiBackend`                 | Impl        | `backend-ferrompi.md`   | SS2.2   | COMPLETE | Drop implementation documented. Ordering constraint (shared regions must drop before backend) specified.                                                                                                        |
| `Drop for FerrompiRegion<T>`               | Impl        | `backend-ferrompi.md`   | SS3.2   | COMPLETE | Delegates to `ferrompi::SharedWindow::drop()` which calls `MPI_Win_free`.                                                                                                                                       |
| `Communicator for LocalBackend`            | Impl        | `backend-local.md`      | SS1.2   | COMPLETE | Full implementation code for all 6 methods. Identity/no-op semantics for each method. Postcondition verification table (SS2.2).                                                                                 |
| `SharedMemoryProvider for LocalBackend`    | Impl        | `backend-local.md`      | SS3.1   | PARTIAL  | Full implementation code shown. However, `create_shared_region` uses `vec![T::default(); count]` which requires `T: Default` -- a bound not present on `CommData`. See F-001.                                   |
| `SharedRegion<T> for HeapRegion<T>`        | Impl        | `backend-local.md`      | SS3.2   | COMPLETE | Full implementation code for all 3 methods. `fence()` is a no-op.                                                                                                                                               |
| `Communicator for CommBackend`             | Impl        | `backend-selection.md`  | SS4.2   | PARTIAL  | `allgatherv` delegation shown in full. Other 5 methods indicated as "analogous implementations" with a comment. See F-008.                                                                                      |
| `SharedMemoryProvider for CommBackend`     | Impl        | `backend-selection.md`  | --      | MISSING  | The `CommBackend` enum implements `Communicator` (shown) but no `SharedMemoryProvider` implementation is shown or mentioned. See F-005.                                                                         |
| `Send + Sync` for all backend types        | Trait bound | `communicator-trait.md` | SS1.1   | COMPLETE | Required by `Communicator: Send + Sync`. `FerrompiBackend` is `Send + Sync` via `ferrompi::Communicator` being `Send + Sync`. `LocalBackend` is a ZST (trivially `Send + Sync`).                                |

### 1.5 Crate Boundary Interactions

| Boundary                                     | Consumer Spec                      | Status   | Notes                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-comm -> ferrompi (MPI backend)         | `backend-ferrompi.md` SS1.2, SS7   | COMPLETE | Every Communicator method mapped to the corresponding ferrompi API call with a summary table (SS1.2). Type conversions documented (`usize` to `i32`, `ReduceOp` mapping). Full ferrompi API reference in SS7 (1255 lines). `MpiDatatype` vs `CommData` relationship explained (SS7.4.3). |
| cobre-comm -> cobre-core (error integration) | `comm.md` SS2                      | PARTIAL  | The dependency is documented as "CommError integration only" via `Structured Output SS2`. However, no concrete `From` conversion or error type wrapping is specified. See F-007.                                                                                                         |
| cobre-sddp -> cobre-comm (cut sync)          | `communicator-trait.md` SS2.1      | COMPLETE | `allgatherv` usage for cut synchronization documented with production-scale payload estimates (~3.2 MB per stage, ~381 MB across 119 stages). Preconditions, postconditions, and determinism guarantees specified.                                                                       |
| cobre-sddp -> cobre-comm (bound sync)        | `communicator-trait.md` SS2.2      | COMPLETE | `allreduce` usage for convergence statistics documented. 32-byte payload (4 x f64). Two separate calls required (ReduceOp::Min for LB, ReduceOp::Sum for UB).                                                                                                                            |
| cobre-sddp -> cobre-comm (shared memory)     | `communicator-trait.md` SS4        | COMPLETE | `SharedMemoryProvider` and `SharedRegion<T>` lifecycle documented with shared data candidates table (opening tree ~0.8 MB, case data ~20 MB, cut pool ~250 MB). Leader/follower pattern, distributed population protocol, and HeapFallback semantics all specified.                      |
| cobre-sddp -> cobre-comm (generic bound)     | `communicator-trait.md` SS3, SS4.5 | PARTIAL  | The training entry point bound is `C: Communicator + SharedMemoryProvider`. The `train` function example in SS3 shows `C: Communicator` only; the example in SS4.5 shows `C: Communicator + SharedMemoryProvider`. This inconsistency is GAP-033. See F-009.                             |
| cobre-cli -> cobre-comm (factory)            | `backend-selection.md` SS4, SS7    | COMPLETE | Factory function `create_communicator()` documented for all build profiles. Initialization sequence integration with CLI startup phase documented (SS6.5, SS7).                                                                                                                          |
| cobre-python -> cobre-comm (library mode)    | `backend-selection.md` SS5         | COMPLETE | Programmatic backend selection via direct construction (`LocalCommunicator::new()`) or `BackendKind` enum. Python bindings integration example provided (SS5.3).                                                                                                                         |

---

## 2. Category Summaries

| Category                    | COMPLETE | PARTIAL | MISSING | Total  |
| --------------------------- | -------- | ------- | ------- | ------ |
| Public Types                | 12       | 3       | 0       | 15     |
| Public Functions            | 14       | 3       | 1       | 18     |
| Error Types                 | 4        | 1       | 0       | 5      |
| Trait Implementations       | 8        | 2       | 1       | 11     |
| Crate Boundary Interactions | 5        | 2       | 0       | 7      |
| **Total**                   | **43**   | **11**  | **2**   | **56** |

---

## 3. Findings

### F-001: `HeapRegion` uses `T::default()` but `CommData` does not require `Default`

**Severity**: Medium
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-local.md` SS3.1 shows the `LocalBackend::create_shared_region` implementation:

> ```rust
> fn create_shared_region<T: CommData>(
>     &self,
>     count: usize,
> ) -> Result<Self::Region<T>, CommError> {
>     Ok(HeapRegion {
>         data: vec![T::default(); count],
>     })
> }
> ```

And `src/specs/hpc/communicator-trait.md` SS1.2 defines `CommData`:

> ```rust
> pub trait CommData: Send + Sync + Copy + 'static {}
> impl<T: Send + Sync + Copy + 'static> CommData for T {}
> ```

The `CommData` bound is `Send + Sync + Copy + 'static`. The `Default` trait is not included. The `vec![T::default(); count]` expression requires `T: Default`, which is not guaranteed by the `CommData` bound.

**Impact**: This code will not compile as written. The `create_shared_region` call would fail with a trait bound error: "`the trait bound T: Default is not satisfied`". The fix is trivial (use `vec![unsafe { std::mem::zeroed() }; count]` since `T: Copy` guarantees a valid zero bit pattern for all numeric types used in practice, or add `Default` to the `CommData` bounds), but it is a correctness issue in the specification.

**Recommendation**: Either (a) add `Default` to the `CommData` trait bounds (`pub trait CommData: Send + Sync + Copy + Default + 'static {}`), or (b) change the initialization to use `vec![unsafe { std::mem::zeroed() }; count]` with a safety comment that `T: Copy` types used in SDDP (`f64`, `u8`, `u32`) have valid zero representations, or (c) use a helper like `vec![std::mem::MaybeUninit::<T>::zeroed().assume_init(); count]`. Option (a) is the simplest and is likely the intended design since all SDDP payload types (`f64`, `u8`, `u32`) implement `Default`.

---

### F-002: `TcpConfig` and `ShmConfig` struct definitions deferred

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4 (deferred backends)

**Evidence**: `src/crates/comm.md` SS3.2 lists both types:

> | `TcpConfig` | `crate::tcp` | TCP backend configuration (coordinator address, rank, size, bind addr, timeout) |
> | `ShmConfig` | `crate::shm` | Shared memory backend configuration (segment name, rank, size) |

And `src/specs/hpc/backend-selection.md` SS5.2 uses them in the `BackendKind` enum:

> ```rust
> pub enum BackendKind {
>     ...
>     Tcp(TcpConfig),
>     Shm(ShmConfig),
>     ...
> }
> ```

However, neither type has a Rust struct definition in any existing spec. The TCP backend spec and shared memory backend spec are deferred to Epic 02 (per `backend-ferrompi.md` Purpose: "The protocol details are specified in the TCP backend spec (Epic 02)" and similarly for shm).

**Impact**: Low for Phase 4 implementation of the core crate, because `TcpConfig` and `ShmConfig` are only needed when the `tcp` or `shm` features are compiled in, and those backends are deferred. However, the `BackendKind` enum references these types, so the enum definition cannot compile without stub definitions or additional feature gating.

**Recommendation**: Either (a) feature-gate the `Tcp(TcpConfig)` and `Shm(ShmConfig)` variants of `BackendKind` behind `#[cfg(feature = "tcp")]` and `#[cfg(feature = "shm")]` respectively (consistent with how `CommBackend` is already gated), or (b) add placeholder struct definitions with a TODO note. Option (a) is the cleaner design and consistent with the existing pattern.

---

### F-003: `is_root()` method does not exist in any spec

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: The ticket for this audit (`ticket-006`) lists `is_root()` as a Communicator trait method to audit:

> "All Communicator trait methods: allreduce, allgatherv, broadcast, barrier, rank(), size(), is_root()"

However, `src/specs/hpc/communicator-trait.md` SS1.1 defines exactly 6 methods on the `Communicator` trait:

> ```rust
> pub trait Communicator: Send + Sync {
>     fn allgatherv<T: CommData>(...) -> Result<(), CommError>;
>     fn allreduce<T: CommData>(...) -> Result<(), CommError>;
>     fn broadcast<T: CommData>(...) -> Result<(), CommError>;
>     fn barrier(&self) -> Result<(), CommError>;
>     fn rank(&self) -> usize;
>     fn size(&self) -> usize;
> }
> ```

No `is_root()` method exists. A grep of all HPC specs and the crate overview confirms zero occurrences of `is_root` anywhere in the specification corpus.

**Impact**: None for implementation. The `is_root()` convenience method (`rank() == 0`) is trivially derivable from `rank()`. This is a ticket specification error, not a crate spec gap.

**Recommendation**: No spec change needed. Note that if a convenience method is desired, it can be added as a provided method with a default implementation (`fn is_root(&self) -> bool { self.rank() == 0 }`), but this is an implementation decision, not a spec gap.

---

### F-004: Single-feature `create_communicator()` return type omits `SharedMemoryProvider`

**Severity**: Medium
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-selection.md` SS4.1 shows the single-feature (MPI-only) factory signature:

> ```rust
> #[cfg(all(feature = "mpi", not(feature = "tcp"), not(feature = "shm")))]
> pub fn create_communicator() -> Result<impl Communicator, BackendError> {
>     if mpi_launch_detected() {
>         Ok(MpiCommunicator::init()?)
>     } else {
>         Ok(LocalCommunicator::new())
>     }
> }
> ```

The return type is `impl Communicator`. But `src/specs/hpc/communicator-trait.md` SS4.5 establishes the combined generic bound for the training entry point:

> ```rust
> pub fn train<C: Communicator + SharedMemoryProvider>(
>     comm: &C,
>     ...
> ) -> TrainingResult {
> ```

The factory return type `impl Communicator` does not expose `SharedMemoryProvider`. A caller using `let comm = create_communicator()?; train(&comm, ...)?;` would fail to compile because the returned type satisfies `Communicator` but not the required `Communicator + SharedMemoryProvider` bound.

**Impact**: The factory function cannot be used directly with the training entry point as specified. The caller would need to either: (a) know the concrete return type and use it directly, (b) add a separate `impl SharedMemoryProvider` bound to the factory return type, or (c) use `impl Communicator + SharedMemoryProvider` as the return type. This is a specification inconsistency between the factory function and the training entry point.

**Recommendation**: Change the single-feature factory return type to `Result<impl Communicator + SharedMemoryProvider, BackendError>`. Both `FerrompiBackend` and `LocalBackend` implement both traits (per `communicator-trait.md` SS4.5 table), so this is type-safe. Alternatively, since `impl Trait` return types with multiple bounds are well-supported in Rust, this is a straightforward fix.

---

### F-005: `CommBackend` enum lacks `SharedMemoryProvider` implementation

**Severity**: High
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-selection.md` SS4.2 shows the `CommBackend` enum and its `Communicator` implementation:

> ```rust
> pub enum CommBackend {
>     #[cfg(feature = "mpi")]
>     Mpi(MpiCommunicator),
>     #[cfg(feature = "tcp")]
>     Tcp(TcpCommunicator),
>     #[cfg(feature = "shm")]
>     Shm(ShmCommunicator),
>     Local(LocalCommunicator),
> }
> ```
>
> ```rust
> impl Communicator for CommBackend {
>     fn allgatherv<T: CommData>(...) -> Result<(), CommError> {
>         match self { ... }
>     }
>     // ... analogous implementations for allreduce, broadcast, barrier, rank, size
> }
> ```

No `impl SharedMemoryProvider for CommBackend` is shown or mentioned anywhere in the spec. A grep of `backend-selection.md` for `SharedMemoryProvider` returns zero results.

Yet `src/specs/hpc/communicator-trait.md` SS4.5 states:

> "All four backend types implement both traits, so the `C: Communicator + SharedMemoryProvider` bound is always satisfiable"

And the training entry point requires `C: Communicator + SharedMemoryProvider`.

**Impact**: In multi-feature builds, `create_communicator()` returns `CommBackend`. If `CommBackend` does not implement `SharedMemoryProvider`, then multi-feature builds cannot use the factory function with the training entry point. This is a structural gap: the `SharedMemoryProvider` delegation through the enum (which requires handling the associated type `Region<T>`) is non-trivial because each variant has a different concrete `Region` type.

**Recommendation**: Add an `impl SharedMemoryProvider for CommBackend` section in `backend-selection.md` SS4.2. This is architecturally non-trivial because the `SharedMemoryProvider` trait has an associated type `Region<T: CommData>: SharedRegion<T>`, and each enum variant would need a different region type. The solution requires either: (a) a `CommRegion<T>` enum mirroring the `CommBackend` enum structure, or (b) type-erasing the region to `Box<dyn SharedRegion<T>>`. Document the chosen approach and its trade-offs. Since `create_shared_region` is initialization-only (not hot path), the `Box<dyn SharedRegion<T>>` approach is acceptable.

---

### F-006: `LocalBackend::new()` constructor not formally defined

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-selection.md` SS4.1 references the constructor:

> ```rust
> pub fn create_communicator() -> Result<LocalCommunicator, BackendError> {
>     Ok(LocalCommunicator::new())
> }
> ```

And `src/specs/hpc/backend-local.md` SS4.1 uses direct construction:

> ```rust
> let comm = LocalBackend;
> let result = train(&comm, &config)?;
> ```

The spec uses both `LocalCommunicator::new()` and `LocalBackend` (zero-sized type literal construction) interchangeably. No formal `impl LocalBackend { pub fn new() -> Self }` is shown. Additionally, the naming is inconsistent between `LocalCommunicator` (in `backend-selection.md`) and `LocalBackend` (in `backend-local.md`).

**Impact**: Minimal. For a ZST, `LocalBackend` and `LocalBackend::new()` are semantically identical. However, the naming inconsistency (`LocalCommunicator` vs `LocalBackend`) could confuse implementers. Similarly, `MpiCommunicator` (in selection spec) vs `FerrompiBackend` (in backend spec).

**Recommendation**: Standardize the naming convention across specs. The backend-specific specs use `FerrompiBackend` and `LocalBackend`; the selection and crate overview specs use `MpiCommunicator` and `LocalCommunicator`. Pick one naming convention and apply it consistently. The `*Backend` convention is more descriptive and already used in the detailed specs.

---

### F-007: `CommError` integration with `cobre-core` error types unspecified

**Severity**: Medium
**Affected Crate**: cobre-comm, cobre-core
**Affected Phase**: Phase 4

**Evidence**: `src/crates/comm.md` SS2 states:

> ```
> cobre-comm [features: mpi]
>       ├── cobre-core (CommError integration only)
> ```

And:

> "**Dependency direction:** `cobre-comm` depends on `cobre-core` only for error type integration (structured error kinds from [Structured Output SS2](../specs/interfaces/structured-output.md))."

`src/specs/hpc/backend-selection.md` SS6.2 shows JSON examples of structured error output:

> ```json
> {
>   "kind": "IncompatibleSettings",
>   "message": "Communication backend 'mpi' is not available in this build",
>   ...
> }
> ```

However, no concrete Rust conversion (`From<CommError> for CobreError`, `From<BackendError> for CobreError`, or similar) is specified anywhere. The error kind registry in `structured-output.md` is referenced but the mapping from `CommError` variants to error kinds is not formalized as Rust code.

**Impact**: Without a concrete conversion path, the integrating code in `cobre-sddp` and `cobre-cli` must manually convert `CommError` to whatever top-level error type is used. This is a crate boundary concern that affects Phase 5-6 integration.

**Recommendation**: Specify `From<CommError>` and `From<BackendError>` implementations that map to the structured error kinds. Alternatively, if `cobre-core` defines a `CobreError` enum with a `Comm(CommError)` variant, specify that relationship. This can be deferred to Phase 5 without blocking Phase 4, but should be documented as a known integration point.

---

### F-008: `CommBackend` `Communicator` impl shows only `allgatherv` in full

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-selection.md` SS4.2 shows the full delegation for `allgatherv`:

> ```rust
> impl Communicator for CommBackend {
>     fn allgatherv<T: CommData>(
>         &self,
>         send: &[T],
>         recv: &mut [T],
>         counts: &[usize],
>         displs: &[usize],
>     ) -> Result<(), CommError> {
>         match self {
>             #[cfg(feature = "mpi")]
>             CommBackend::Mpi(inner) => inner.allgatherv(send, recv, counts, displs),
>             ...
>         }
>     }
>     // ... analogous implementations for allreduce, broadcast, barrier, rank, size
> }
> ```

The remaining 5 methods are elided with "analogous implementations."

**Impact**: Minimal. The delegation pattern is mechanical and clearly implied. An implementer can trivially derive the remaining 5 methods from the `allgatherv` example. This is a documentation completeness concern, not a correctness concern.

**Recommendation**: No change needed. The pattern is clear. If completeness is desired, the full implementation can be added, but it adds length without information.

---

### F-009: GAP-033 -- Generic bounds inconsistency between `Communicator` and `Communicator + SharedMemoryProvider`

**Severity**: Low (per spec-gap-inventory classification)
**Affected Crate**: cobre-comm, cobre-sddp
**Affected Phase**: Phase 4-5

**Evidence**: `src/specs/overview/spec-gap-inventory.md` GAP-033 states:

> "The `train` function signature shows `C: Communicator + SharedMemoryProvider` as the generic bound, but the solver interface trait shows `C: Communicator` only (without `SharedMemoryProvider`). The exact set of generic bounds on the training entry point is inconsistent between the two specs."

The resolution path documented in the gap inventory is:

> "Unify: the training entry point should require `C: Communicator + SharedMemoryProvider` since shared memory is used for the opening tree and case data. Update the solver interface trait example to match."

**Current state of GAP-033**: The communicator trait spec (SS4.5) has already adopted the combined bound `C: Communicator + SharedMemoryProvider` and documented the rationale:

> "All four backend types implement both traits, so the `C: Communicator + SharedMemoryProvider` bound is always satisfiable -- callers never need to check for shared memory support at runtime."

However, the spec also provides an alternative for functions that do not need shared memory (SS4.5):

> ```rust
> /// The backward pass only needs collective communication.
> fn backward_pass<C: Communicator>(comm: &C, cuts: &CutPool) { ... }
> ```

The gap remains **unresolved** in the sense that the solver interface trait has not been updated to match. The communicator trait spec has chosen its side (combined bound for `train`, `Communicator`-only for sub-functions), but the cross-spec inconsistency persists until the solver interface trait is updated.

**Impact**: Low. The intended resolution direction is clear. The implementer should use `C: Communicator + SharedMemoryProvider` for the training entry point and `C: Communicator` for individual pass functions. The inconsistency does not block implementation.

**Recommendation**: Update the solver interface trait example to use `C: Communicator + SharedMemoryProvider` for the training entry point, as the gap inventory resolution path recommends. This is a mechanical spec update.

---

### F-010: `CommData` vs `MpiDatatype` bound mismatch requires implementer attention

**Severity**: Low
**Affected Crate**: cobre-comm
**Affected Phase**: Phase 4

**Evidence**: `src/specs/hpc/backend-ferrompi.md` SS7.4.3 explains the relationship:

> "Cobre's `CommData` trait ([Communicator Trait SS1.2](./communicator-trait.md)) is a blanket `Copy + Send + Sync + 'static` trait. The `FerrompiBackend` constrains `T: CommData` at the trait level, but the ferrompi calls require `T: MpiDatatype`. Since all `MpiDatatype` implementors satisfy `CommData` (they are all `Copy + Send + Sync + 'static`), the backend's generic bounds are compatible. The Cobre training loop only transmits `f64`, `u8`, and `u32` -- all of which implement `MpiDatatype`."

The trait hierarchy is: `CommData` is broader than `MpiDatatype` (any `Copy + Send + Sync + 'static` type satisfies `CommData`, but only 7 specific primitive types implement `MpiDatatype`). The `FerrompiBackend` impl accepts `T: CommData` at the trait signature level but internally requires `T: MpiDatatype` for the ferrompi calls.

**Impact**: If a user passes a type that is `CommData` but not `MpiDatatype` (e.g., a custom `#[repr(C)] struct { x: f64, y: f64 }` which is `Copy + Send + Sync + 'static`), the code would fail to compile inside the `FerrompiBackend` impl. The spec correctly identifies this constraint and states the training loop only uses `f64`, `u8`, and `u32`. However, the bound mismatch is not enforced at the trait level -- it is an implicit contract.

**Recommendation**: Document this as a known constraint in the implementation notes. The `FerrompiBackend` impl will need an additional `T: MpiDatatype` bound on each method, which may require the `Communicator` trait to be generic over the data type bound (e.g., `trait Communicator<D: DataBound = CommData>`) or the ferrompi backend to add a runtime check. The simplest approach is to add `where T: MpiDatatype` bounds on the `FerrompiBackend` method implementations, which the Rust compiler will accept as narrowing of the trait bound.

---

## 4. Crate Verdict

**CONDITIONAL PASS**

cobre-comm has an exceptionally thorough specification foundation. The `Communicator` trait (6 methods, all with full Rust signatures, preconditions, postconditions, error semantics, thread safety, and determinism guarantees), the `SharedMemoryProvider` trait (3 methods with associated types and lifecycle documentation), and the `SharedRegion<T>` trait (3 methods with read/write phase semantics) are all fully implementation-ready. The `FerrompiBackend` provides a complete ferrompi-to-trait method mapping table with type conversion documentation and a comprehensive ferrompi API reference (SS7, 1255 lines). The `LocalBackend` provides full implementations with identity semantics and postcondition verification tables. The `BackendError` type and `create_communicator()` factory function cover single-feature and multi-feature builds with clear `cfg`-gated code paths.

The **conditional** qualifier reflects three findings that require resolution:

1. **F-005 (High)**: The `CommBackend` enum dispatch wrapper for multi-feature builds does not implement `SharedMemoryProvider`. This is a structural gap because the enum's associated type (`Region<T>`) must unify across different backend region types. The spec needs to document the enum-level region type (likely `Box<dyn SharedRegion<T>>` since `create_shared_region` is initialization-only).

2. **F-001 (Medium)**: The `HeapRegion` initialization uses `T::default()` but `CommData` does not require `Default`. This will cause a compilation error. The fix is trivial (add `Default` to `CommData` bounds or use `zeroed()`), but requires a spec decision.

3. **F-004 (Medium)**: The single-feature factory return type (`impl Communicator`) omits `SharedMemoryProvider`, making it incompatible with the training entry point signature.

No finding blocks understanding of the crate's behavioral contracts. An experienced Rust developer can resolve all findings during implementation. The HPC communication semantics (MPI collective behavior, shared memory lifecycle, determinism invariants) are fully specified and require no additional domain analysis.

### Resolution path for PASS

| Priority | Finding             | Action                                                                                     |
| -------- | ------------------- | ------------------------------------------------------------------------------------------ |
| Must     | F-005               | Add `SharedMemoryProvider` implementation for `CommBackend` enum with region type strategy |
| Must     | F-001               | Add `Default` to `CommData` bounds or change `HeapRegion` initialization strategy          |
| Must     | F-004               | Change single-feature factory return type to `impl Communicator + SharedMemoryProvider`    |
| Should   | F-007               | Specify `CommError`/`BackendError` to `cobre-core` error type conversion                   |
| Should   | F-006               | Standardize backend naming convention (`*Backend` vs `*Communicator`)                      |
| May      | F-002               | Define `TcpConfig`/`ShmConfig` stubs or feature-gate `BackendKind` variants                |
| May      | F-009               | Resolve GAP-033 by updating solver interface trait example                                 |
| May      | F-003, F-008, F-010 | No spec changes needed; document as implementation notes                                   |
