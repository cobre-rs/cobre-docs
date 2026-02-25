# Ferrompi Backend

## Purpose

The ferrompi backend is the primary production communication backend for Cobre. It wraps the ferrompi MPI bindings behind the `Communicator` and `SharedMemoryProvider` traits defined in [Communicator Trait §1](./communicator-trait.md) and [Communicator Trait §4](./communicator-trait.md), providing zero-cost abstraction over MPI collectives and shared memory windows for HPC cluster deployments. As the reference backend, all other backends must match its observable behavior -- the ferrompi backend defines the canonical semantics that the local, TCP, and shared memory backends emulate. The architecture follows the compile-time selection pattern established in [Solver Abstraction §10](../architecture/solver-abstraction.md) and gated by the `mpi` feature flag as specified in [Backend Registration and Selection §1.2](./backend-selection.md).

## 1. Struct and Trait Implementation

### 1.1 Struct Definition

The `FerrompiBackend` struct holds the MPI communicator handles obtained during initialization. The world communicator is used for all inter-rank collective operations during training; the intra-node communicator is used for shared memory window creation and leader/follower determination.

```rust
/// Primary production communication backend wrapping ferrompi MPI bindings.
///
/// Delegates all `Communicator` trait methods directly to the corresponding
/// ferrompi API calls, achieving zero-cost abstraction via monomorphization
/// (see §4.1).
#[cfg(feature = "mpi")]
pub struct FerrompiBackend {
    /// World communicator for all collective operations and rank/size queries.
    world: ferrompi::Communicator,

    /// Intra-node communicator created via `split_shared_memory()`. Groups
    /// ranks on the same physical node for shared memory window operations.
    /// `None` only if initialization is incomplete (see §2).
    shared: Option<ferrompi::Communicator>,
}
```

### 1.2 Communicator Trait Implementation

The `impl Communicator for FerrompiBackend` delegates each trait method to the corresponding ferrompi API call. The method mapping table below summarizes the conversions.

```rust
#[cfg(feature = "mpi")]
impl Communicator for FerrompiBackend {
    fn allgatherv<T: CommData>(
        &self,
        send: &[T],
        recv: &mut [T],
        counts: &[usize],
        displs: &[usize],
    ) -> Result<(), CommError> {
        self.world
            .allgatherv(send, recv, counts, displs)
            .map_err(|e| CommError::CollectiveFailed {
                operation: "allgatherv",
                mpi_error_code: e.error_code(),
                message: e.to_string(),
            })
    }

    fn allreduce<T: CommData>(
        &self,
        send: &[T],
        recv: &mut [T],
        op: ReduceOp,
    ) -> Result<(), CommError> {
        let mpi_op = match op {
            ReduceOp::Sum => ferrompi::Op::Sum,
            ReduceOp::Min => ferrompi::Op::Min,
            ReduceOp::Max => ferrompi::Op::Max,
        };
        self.world
            .allreduce(send, recv, mpi_op)
            .map_err(|e| CommError::CollectiveFailed {
                operation: "allreduce",
                mpi_error_code: e.error_code(),
                message: e.to_string(),
            })
    }

    fn broadcast<T: CommData>(
        &self,
        buf: &mut [T],
        root: usize,
    ) -> Result<(), CommError> {
        self.world
            .bcast(buf, root as i32)
            .map_err(|e| CommError::CollectiveFailed {
                operation: "broadcast",
                mpi_error_code: e.error_code(),
                message: e.to_string(),
            })
    }

    fn barrier(&self) -> Result<(), CommError> {
        self.world
            .barrier()
            .map_err(|e| CommError::CollectiveFailed {
                operation: "barrier",
                mpi_error_code: e.error_code(),
                message: e.to_string(),
            })
    }

    fn rank(&self) -> usize {
        self.world.rank() as usize
    }

    fn size(&self) -> usize {
        self.world.size() as usize
    }
}
```

**Method mapping summary:**

| Trait Method | ferrompi API Call                                   | Type Conversion                                |
| ------------ | --------------------------------------------------- | ---------------------------------------------- |
| `allgatherv` | `self.world.allgatherv(send, recv, counts, displs)` | None (signatures match directly)               |
| `allreduce`  | `self.world.allreduce(send, recv, mpi_op)`          | `ReduceOp` to `ferrompi::Op` (zero-cost match) |
| `broadcast`  | `self.world.bcast(buf, root)`                       | `root: usize` to `i32`                         |
| `barrier`    | `self.world.barrier()`                              | None                                           |
| `rank`       | `self.world.rank()`                                 | `i32` to `usize`                               |
| `size`       | `self.world.size()`                                 | `i32` to `usize`                               |

**Error delegation:** All fallible methods convert `ferrompi::MpiError` to `CommError::CollectiveFailed` using the error code and message from the MPI error. No new `CommError` variants are introduced -- all errors map to the variants defined in [Communicator Trait §1.4](./communicator-trait.md) and [Communicator Trait §4.6](./communicator-trait.md). See SS5 for the complete error mapping table.

**Precondition validation:** Buffer size preconditions ([Communicator Trait §2.1](./communicator-trait.md) -- §2.5) are enforced by the ferrompi layer, which validates arguments before issuing the MPI call. The `FerrompiBackend` does not duplicate these checks.

## 2. Initialization

The `FerrompiBackend::new()` constructor wraps the MPI initialization sequence defined in [Hybrid Parallelism §6](./hybrid-parallelism.md) Steps 1-3. It is called once during the Startup phase, before any collective operations or shared memory allocations.

### 2.1 Initialization Sequence

```rust
#[cfg(feature = "mpi")]
impl FerrompiBackend {
    /// Initialize the ferrompi backend (MPI startup sequence, Steps 1-3 of
    /// [Hybrid Parallelism §6](./hybrid-parallelism.md)).
    ///
    /// # Errors
    ///
    /// Returns `BackendError::InitializationFailed` if `MPI_Init_thread` fails
    /// or returns a threading level below `MPI_THREAD_MULTIPLE`, or if the
    /// shared-memory communicator split fails.
    ///
    /// # Panics
    ///
    /// Panics if called more than once (MPI does not support multiple
    /// initializations).
    pub fn new() -> Result<Self, BackendError> {
        // Step 1 — MPI initialization (Hybrid Parallelism §6 Step 1)
        // MPI_THREAD_MULTIPLE required for hybrid MPI+OpenMP execution.
        let universe = ferrompi::init_with_threading(
            ferrompi::ThreadLevel::Multiple,
        ).map_err(|e| BackendError::InitializationFailed {
            backend: "mpi".to_string(),
            source: Box::new(e),
        })?;

        let world = universe.world();

        // Step 2 — Topology detection (Hybrid Parallelism §6 Step 2)
        let _rank = world.rank();
        let _size = world.size();

        // Step 3 — Shared memory communicator (Hybrid Parallelism §6 Step 3)
        // MPI_COMM_TYPE_SHARED groups ranks that can share memory.
        let shared = world
            .split_shared_memory()
            .map_err(|e| BackendError::InitializationFailed {
                backend: "mpi".to_string(),
                source: Box::new(e),
            })?;

        Ok(FerrompiBackend {
            world,
            shared: Some(shared),
        })
    }
}
```

### 2.2 Shutdown and Drop

The `FerrompiBackend` implements `Drop` to call `MPI_Finalize` when the backend is destroyed. All shared memory regions ([SharedRegion §3](#3-sharedwindow-implementation)) must be dropped before the backend is dropped, because `MPI_Win_free` must precede `MPI_Finalize`.

```rust
#[cfg(feature = "mpi")]
impl Drop for FerrompiBackend {
    fn drop(&mut self) {
        // Drop the intra-node communicator before MPI_Finalize.
        self.shared.take();
        // MPI_Finalize is called by ferrompi's Universe drop.
    }
}
```

**Ordering constraint:** The training loop ensures the following drop order during shutdown:

1. All `SharedRegion<T>` handles (calls `MPI_Win_free` on each window)
2. The `FerrompiBackend` (calls `MPI_Finalize` via ferrompi's `Universe` drop)

This ordering is consistent with the lifetime contract in [Communicator Trait §4.2](./communicator-trait.md).

## 3. SharedWindow Implementation

### 3.1 SharedMemoryProvider Trait Implementation

The `FerrompiBackend` implements `SharedMemoryProvider` by delegating to ferrompi's `SharedWindow<T>` for true intra-node shared memory. The `Region` associated type wraps `ferrompi::SharedWindow<T>` in a `FerrompiRegion<T>` newtype that implements the `SharedRegion<T>` trait.

```rust
#[cfg(feature = "mpi")]
impl SharedMemoryProvider for FerrompiBackend {
    type Region<T: CommData> = FerrompiRegion<T>;

    fn create_shared_region<T: CommData>(
        &self,
        count: usize,
    ) -> Result<Self::Region<T>, CommError> {
        let shared_comm = self.shared.as_ref().ok_or(
            CommError::InvalidCommunicator,
        )?;

        // The leader (local rank 0) allocates `count` elements.
        // Followers allocate size 0 and receive a handle to the
        // leader's memory via MPI window attachment.
        let alloc_count = if shared_comm.rank() == 0 {
            count
        } else {
            0
        };

        let window = ferrompi::SharedWindow::new(shared_comm, alloc_count)
            .map_err(|e| CommError::AllocationFailed {
                requested_bytes: count * std::mem::size_of::<T>(),
                message: e.to_string(),
            })?;

        Ok(FerrompiRegion {
            window,
            count,
        })
    }

    fn split_local(&self) -> Result<Box<dyn Communicator>, CommError> {
        let shared_comm = self.shared.as_ref().ok_or(
            CommError::InvalidCommunicator,
        )?;

        // Returns the intra-node communicator as a standalone backend.
        // No nested shared communicator needed on the sub-communicator.
        Ok(Box::new(FerrompiBackend {
            world: shared_comm.clone(),
            shared: None,
        }))
    }

    fn is_leader(&self) -> bool {
        self.shared
            .as_ref()
            .map(|c| c.rank() == 0)
            .unwrap_or(true)
    }
}
```

**Leader determination:** The leader is the rank with local rank 0 within the intra-node communicator, consistent with the convention in [Hybrid Parallelism §6 Step 3](./hybrid-parallelism.md) and the leader/follower pattern in [Communicator Trait §4.3](./communicator-trait.md).

### 3.2 SharedRegion Wrapper

The `FerrompiRegion<T>` newtype wraps `ferrompi::SharedWindow<T>` and implements the `SharedRegion<T>` trait. The wrapper encapsulates the `unsafe` boundary for raw pointer dereference into MPI shared windows, presenting a safe Rust interface to the training loop.

```rust
/// Shared memory region backed by an MPI window (`ferrompi::SharedWindow<T>`).
///
/// Lifecycle follows [Communicator Trait §4.2](./communicator-trait.md).
/// RAII: dropping calls `MPI_Win_free` on the underlying window.
#[cfg(feature = "mpi")]
pub struct FerrompiRegion<T: CommData> {
    /// The underlying MPI shared memory window.
    window: ferrompi::SharedWindow<T>,

    /// Logical element count (the `count` passed to `create_shared_region`;
    /// followers allocate 0 locally but reference the leader's memory).
    count: usize,
}
```

```rust
#[cfg(feature = "mpi")]
impl<T: CommData> SharedRegion<T> for FerrompiRegion<T> {
    fn as_slice(&self) -> &[T] {
        // Safety: unsafe pointer dereference is encapsulated within
        // ferrompi::SharedWindow::as_slice(). Caller must call fence()
        // before reading to ensure no data races.
        self.window.as_slice(self.count)
    }

    fn as_mut_slice(&mut self) -> &mut [T] {
        // On followers, the local allocation is size 0; returns empty slice.
        // Safety: same as as_slice(); &mut self prevents concurrent access.
        self.window.as_mut_slice()
    }

    fn fence(&self) -> Result<(), CommError> {
        // MPI_Win_fence: collective -- all ranks must call fence().
        self.window.fence().map_err(|e| CommError::CollectiveFailed {
            operation: "fence",
            mpi_error_code: e.error_code(),
            message: e.to_string(),
        })
    }
}
```

```rust
#[cfg(feature = "mpi")]
impl<T: CommData> Drop for FerrompiRegion<T> {
    fn drop(&mut self) {
        // MPI_Win_free called via ferrompi::SharedWindow::drop().
        // Must complete before MPI_Finalize (see §2.2).
    }
}
```

## 4. Performance

### 4.1 Zero-Cost Abstraction via Monomorphization

When the training loop is generic over `C: Communicator` and the binary is built with only the `mpi` feature enabled, the compiler resolves `C` to `FerrompiBackend` at compile time. This enables:

1. **Full inlining** -- Each trait method call compiles to a direct call to the corresponding ferrompi function. The `match` on `ReduceOp` in `allreduce` is eliminated when the variant is known at the call site (constant propagation).

2. **No vtable, no indirection** -- Static dispatch means there is no trait object, no vtable lookup, and no dynamic dispatch overhead. The generated assembly for `train::<FerrompiBackend>(comm, ...)` is identical to code that calls `comm.world.allgatherv(...)` directly.

3. **Dead code elimination** -- In a single-feature build (`--features mpi` only), all `cfg`-gated code paths for other backends are removed from the binary. The `CommBackend` enum ([Backend Registration and Selection §4.2](./backend-selection.md)) is never instantiated.

This achieves the same zero-cost property as the solver abstraction pattern in [Solver Abstraction §10](../architecture/solver-abstraction.md): the abstraction layer has no runtime cost in production builds.

### 4.2 Persistent Collectives as Internal Optimization

MPI 4.0 persistent collectives ([Communication Patterns §4](./communication-patterns.md)) can be used as an internal optimization within the `FerrompiBackend` without affecting the `Communicator` trait interface. The trait methods (`allgatherv`, `allreduce`, `broadcast`, `barrier`) define the external API; the backend is free to implement them using either standard or persistent MPI collectives.

**Persistent collective strategy:**

| Trait Method | Persistent Candidate | Implementation Strategy                                                                                                               |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `allreduce`  | Yes                  | Pre-initialize with fixed 32-byte buffer at construction; reuse every iteration                                                       |
| `allgatherv` | Conditional          | Pre-initialize if buffer sizes are known at construction (fixed $M$); fall back to standard collective if counts change between calls |
| `broadcast`  | No                   | Called only during initialization with varying buffer sizes; standard collective is sufficient                                        |
| `barrier`    | No                   | Called only at checkpoints; standard collective is sufficient                                                                         |

**Internal state for persistent collectives:**

```rust
#[cfg(feature = "mpi")]
pub struct FerrompiBackend {
    world: ferrompi::Communicator,
    shared: Option<ferrompi::Communicator>,

    /// Pre-initialized persistent allreduce request for convergence
    /// statistics (4 x f64, fixed size). `None` if the MPI implementation
    /// does not support MPI 4.0 persistent collectives.
    persistent_allreduce: Option<ferrompi::PersistentRequest>,
}
```

The persistent collective initialization occurs during `FerrompiBackend::new()` if the MPI implementation supports it (detected via `MPI_T_get_info` or a runtime version check). If persistent collectives are unavailable, the backend falls back to standard collectives transparently -- the trait interface is unchanged.

**Key property:** Persistent collectives are an implementation detail of the ferrompi backend. They do not appear in the `Communicator` trait definition, do not affect the trait's method signatures, and do not alter the observable semantics of any collective operation. Other backends are unaffected by this optimization.

## 5. Error Mapping

The ferrompi backend maps MPI error codes to `CommError` variants defined in [Communicator Trait §1.4](./communicator-trait.md) and [Communicator Trait §4.6](./communicator-trait.md). No new `CommError` variants are introduced by this backend.

### 5.1 MPI Error Code to CommError Mapping

| MPI Error Code   | Typical Cause                                           | CommError Variant                                                    |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| `MPI_ERR_COMM`   | Invalid or finalized communicator handle                | `CommError::InvalidCommunicator`                                     |
| `MPI_ERR_BUFFER` | Invalid buffer pointer (null, misaligned)               | `CommError::InvalidBufferSize { operation, expected, actual }`       |
| `MPI_ERR_COUNT`  | Negative count or count/displacement mismatch           | `CommError::InvalidBufferSize { operation, expected, actual }`       |
| `MPI_ERR_TYPE`   | Unsupported or uncommitted MPI datatype                 | `CommError::CollectiveFailed { operation, mpi_error_code, message }` |
| `MPI_ERR_ROOT`   | Root rank out of range in broadcast                     | `CommError::InvalidRoot { root, size }`                              |
| `MPI_ERR_WIN`    | Invalid MPI window in shared memory operation           | `CommError::CollectiveFailed { operation, mpi_error_code, message }` |
| `MPI_ERR_NO_MEM` | Shared memory allocation rejected by OS/MPI             | `CommError::AllocationFailed { requested_bytes, message }`           |
| `MPI_ERR_OTHER`  | Unclassified MPI error (process crash, network failure) | `CommError::CollectiveFailed { operation, mpi_error_code, message }` |

### 5.2 Error Conversion Implementation

```rust
/// Convert a ferrompi MPI error to the most specific `CommError` variant.
/// Unrecognized error codes fall through to `CommError::CollectiveFailed`.
#[cfg(feature = "mpi")]
fn map_mpi_error(e: ferrompi::MpiError, operation: &'static str) -> CommError {
    match e.error_class() {
        ferrompi::ErrorClass::Comm => CommError::InvalidCommunicator,
        ferrompi::ErrorClass::Root => CommError::InvalidRoot {
            root: e.context_root().unwrap_or(0),
            size: e.context_size().unwrap_or(0),
        },
        ferrompi::ErrorClass::Buffer | ferrompi::ErrorClass::Count => {
            CommError::InvalidBufferSize {
                operation,
                expected: e.context_expected().unwrap_or(0),
                actual: e.context_actual().unwrap_or(0),
            }
        }
        ferrompi::ErrorClass::NoMem => CommError::AllocationFailed {
            requested_bytes: e.context_requested_bytes().unwrap_or(0),
            message: e.to_string(),
        },
        _ => CommError::CollectiveFailed {
            operation,
            mpi_error_code: e.error_code(),
            message: e.to_string(),
        },
    }
}
```

### 5.3 MPI_Init_thread Failure

If `ferrompi::init_with_threading(ThreadLevel::Multiple)` fails -- either because `MPI_Init_thread` returns an error or because the provided threading level is below `MPI_THREAD_MULTIPLE` -- the error is reported as `BackendError::InitializationFailed` (defined in [Backend Registration and Selection §6.2](./backend-selection.md)), not as a `CommError`. This is because initialization failure is a factory-level concern that occurs before any `Communicator` trait method can be called.

## 6. Feature Gating

### 6.1 Conditional Compilation

The entire `FerrompiBackend` implementation is gated behind the `mpi` Cargo feature flag, consistent with the feature flag matrix in [Backend Registration and Selection §1.2](./backend-selection.md).

```rust
#[cfg(feature = "mpi")]
mod ferrompi_backend {
    use crate::comm::{
        CommData, CommError, Communicator, ReduceOp,
        SharedMemoryProvider, SharedRegion,
    };

    pub struct FerrompiBackend { /* ... */ }
    pub struct FerrompiRegion<T: CommData> { /* ... */ }

    impl Communicator for FerrompiBackend { /* ... */ }
    impl SharedMemoryProvider for FerrompiBackend { /* ... */ }
    impl<T: CommData> SharedRegion<T> for FerrompiRegion<T> { /* ... */ }
}

#[cfg(feature = "mpi")]
pub use ferrompi_backend::{FerrompiBackend, FerrompiRegion};
```

### 6.2 Cargo.toml Feature Declaration

```toml
[features]
default = []
mpi = ["dep:ferrompi"]

[dependencies]
ferrompi = { version = "0.1", optional = true }
```

When `mpi` is not enabled:

- The `ferrompi` crate is not compiled or linked.
- No MPI development libraries (OpenMPI, MPICH, Intel MPI) are required at build time.
- The `FerrompiBackend` and `FerrompiRegion` types do not exist -- any attempt to reference them produces a Rust compilation error.
- The `create_communicator()` factory function ([Backend Registration and Selection §4.1](./backend-selection.md)) does not include an MPI branch.

When `mpi` is enabled:

- The `ferrompi` crate is compiled and linked against the system MPI library (`libmpi.so` or equivalent).
- All `#[cfg(feature = "mpi")]` items are included in the binary.
- The MPI backend is available for selection via the factory function or `COBRE_COMM_BACKEND=mpi`.

### 6.3 Build Profile Integration

The ferrompi backend is included in the following build profiles from [Backend Registration and Selection §1.3](./backend-selection.md):

| Build Profile | Includes `mpi`? | Rationale                                                        |
| ------------- | :-------------: | ---------------------------------------------------------------- |
| CLI / HPC     |       Yes       | MPI is the production communication layer for cluster deployment |
| Python wheel  |       No        | No MPI dependency on user machines                               |
| Test / CI     |       No        | Only `local` backend; no external dependencies                   |
| Development   |       Yes       | All backends compiled for testing                                |

## Cross-References

- [Communicator Trait §1](./communicator-trait.md) -- `Communicator` trait definition, `CommData`, `ReduceOp`, `CommError` type definitions implemented by this backend
- [Communicator Trait §2](./communicator-trait.md) -- Method contracts (preconditions, postconditions, determinism guarantees) that this backend preserves by delegation to ferrompi
- [Communicator Trait §3](./communicator-trait.md) -- Generic parameterization pattern (`train<C: Communicator>`) enabling zero-cost monomorphization of this backend
- [Communicator Trait §4](./communicator-trait.md) -- `SharedMemoryProvider` trait, `SharedRegion<T>` lifecycle phases, leader/follower pattern, drop behavior table
- [Communicator Trait §4.6](./communicator-trait.md) -- `CommError::AllocationFailed` variant used for `MPI_ERR_NO_MEM` mapping
- [Communication Patterns §1.1](./communication-patterns.md) -- ferrompi API signatures (`comm.allgatherv`, `comm.allreduce`, `comm.bcast`, `comm.barrier`) wrapped by this backend
- [Communication Patterns §4](./communication-patterns.md) -- Persistent collectives (`MPI_Allgatherv_init`, `MPI_Allreduce_init`) used as internal optimization (§4.2)
- [Communication Patterns §5](./communication-patterns.md) -- `SharedWindow<T>` capabilities (window creation, intra-node grouping, read access, write synchronization) wrapped by `FerrompiRegion<T>`
- [Hybrid Parallelism §1.2](./hybrid-parallelism.md) -- ferrompi capabilities table: `Communicator` is `Send + Sync`, `SharedWindow<T>`, collectives API, threading level
- [Hybrid Parallelism §6](./hybrid-parallelism.md) -- MPI initialization sequence (Steps 1-3) implemented by `FerrompiBackend::new()`
- [Backend Registration and Selection §1.2](./backend-selection.md) -- Feature flag matrix; `mpi` feature gates the ferrompi crate dependency
- [Backend Registration and Selection §4](./backend-selection.md) -- Factory pattern returning concrete `FerrompiBackend` type in single-feature builds
- [Solver Abstraction §10](../architecture/solver-abstraction.md) -- Compile-time selection pattern via generic parameters and Cargo feature flags; the architectural precedent for this backend's zero-cost design
