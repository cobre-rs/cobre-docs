# cobre-comm

<span class="status-experimental">experimental</span>

## Overview

cobre-comm provides the pluggable communication backend abstraction for distributed
computing in the Cobre ecosystem. It defines the `Communicator` trait (collective
operations: allgatherv, allreduce, broadcast, barrier) and the
`SharedMemoryProvider` trait (intra-node shared memory regions), a backend
selection factory with compile-time feature flags and optional runtime selection,
and feature-gated backend implementations. The crate decouples optimization
algorithms and analysis tools from specific communication technologies, enabling
MPI, TCP, shared-memory, and single-process execution through a unified interface
with zero-cost abstraction via static dispatch.

## Key Concepts

- **Communicator trait** -- The backend abstraction through which distributed
  algorithms perform collective operations (allgatherv, allreduce, broadcast,
  barrier). Defines method signatures, preconditions, postconditions, error
  semantics, and the determinism invariants required by SDDP. Static dispatch
  via generics eliminates dynamic dispatch overhead on the hot path.
  See [Communicator Trait §1-§3](../specs/hpc/communicator-trait.md).

- **SharedMemoryProvider trait** -- A companion trait for intra-node shared
  memory region management. Covers persistent shared memory regions with
  leader/follower allocation, fence-based synchronization, and RAII cleanup.
  Backends without shared memory support use a HeapFallback that provides the
  same API with per-process heap allocation.
  See [Communicator Trait §4](../specs/hpc/communicator-trait.md).

- **Backend selection** -- A two-level mechanism: Cargo feature flags (primary)
  control which backends are compiled in; the `COBRE_COMM_BACKEND` environment
  variable (secondary) selects among compiled-in backends at runtime. The factory
  function uses `cfg`-gated match arms for static dispatch, with an enum dispatch
  wrapper for multi-feature builds.
  See [Backend Selection](../specs/hpc/backend-selection.md).

- **Communication patterns** -- The three collective operations used per SDDP
  iteration (allgatherv for cut synchronization, allgatherv for trial point
  distribution, allreduce for convergence statistics) and their performance
  characteristics at production scale.
  See [Communication Patterns](../specs/hpc/communication-patterns.md).

- **Shared memory aggregation** -- Leader/follower allocation pattern for
  sharing read-only data structures (opening tree, case data, cut pool) across
  ranks on the same node, reducing per-node memory footprint.
  See [Shared Memory Aggregation](../specs/hpc/shared-memory-aggregation.md).

## 1. Crate Architecture

| Attribute         | Value                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crate type        | Library (`lib`)                                                                                                                                                                    |
| Status            | experimental                                                                                                                                                                       |
| What it owns      | Communication traits (`Communicator`, `SharedMemoryProvider`, `SharedRegion`), error types (`CommError`, `BackendError`), backend selection factory, feature-gated backend modules |
| What it delegates | All SDDP computation to `cobre-sddp`; all data types to `cobre-core`; MPI FFI bindings to `ferrompi` (optional dependency)                                                         |

**Responsibilities:**

1. Define the `Communicator` and `SharedMemoryProvider` trait interfaces
2. Define the `CommData`, `ReduceOp`, `CommError`, and `BackendError` types
3. Provide the `create_communicator()` factory function with `cfg`-gated backend selection
4. House feature-gated backend implementations (ferrompi, local, tcp, shm)
5. Provide the `BackendKind` enum for programmatic backend selection by library-mode callers

**Non-responsibilities:**

- The SDDP algorithm, training loop, and simulation -- those belong to `cobre-sddp`
- The MPI FFI bindings -- those belong to `ferrompi`, used as an optional dependency
- The power system data model -- that belongs to `cobre-core`

## 2. Dependency Graph

The introduction of `cobre-comm` restructures the dependency graph so that
`cobre-sddp` depends on `cobre-comm` for communication instead of directly on
`ferrompi`. The MPI dependency moves one layer down -- it becomes an optional
dependency of `cobre-comm`, gated behind the `mpi` feature flag.

```
cobre-cli
  ├── cobre-sddp
  │     ├── cobre-comm [features: mpi]
  │     │     ├── cobre-core (CommError integration only)
  │     │     └── ferrompi (optional, feature = "mpi")
  │     ├── cobre-core
  │     ├── cobre-stochastic
  │     └── cobre-solver
  ├── cobre-io
  │     └── cobre-core
  ├── cobre-tui
  │     └── cobre-core
  └── cobre-core

cobre-mcp
  ├── cobre-sddp
  │     └── cobre-comm [features: local only]
  ├── cobre-io
  └── cobre-core

cobre-python
  ├── cobre-sddp
  │     └── cobre-comm [features: tcp,shm]
  ├── cobre-io
  └── cobre-core
```

**Key changes from the current graph:**

| Before                                           | After                                                          |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `ferrompi` is an optional dep of `cobre-sddp`    | `ferrompi` is an optional dep of `cobre-comm`                  |
| `cobre-sddp` calls `ferrompi` directly           | `cobre-sddp` calls `cobre-comm` traits; backend is generic `C` |
| `cobre-python` uses single-process mode (no MPI) | `cobre-python` can use TCP or shm backends for multi-process   |
| `cobre-mcp` uses single-process mode (no MPI)    | `cobre-mcp` uses `LocalCommunicator` via `cobre-comm`          |

**Dependency direction:** `cobre-comm` depends on `cobre-core` only for error
type integration (structured error kinds from
[Structured Output §2](../specs/interfaces/structured-output.md)). It does NOT
depend on `cobre-sddp` -- the dependency flows in one direction:
`cobre-sddp → cobre-comm → cobre-core`.

## 3. Public API

### 3.1 Traits

| Item                   | Module  | Description                                                                                     |
| ---------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `Communicator`         | `crate` | Core trait for collective operations (allgatherv, allreduce, broadcast, barrier, rank, size)    |
| `SharedMemoryProvider` | `crate` | Trait for shared memory region creation, local communicator splitting, and leader determination |
| `SharedRegion<T>`      | `crate` | Trait for shared memory region handles (as_slice, as_mut_slice, fence, RAII Drop)               |
| `CommData`             | `crate` | Marker trait for types transmissible through collectives (`Send + Sync + Copy + 'static`)       |

### 3.2 Types

| Item           | Module       | Description                                                                                |
| -------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `ReduceOp`     | `crate`      | Enum: `Sum`, `Min`, `Max` -- element-wise reduction operations for `allreduce`             |
| `CommError`    | `crate`      | Enum: collective failures, buffer size errors, invalid root, allocation failures           |
| `BackendError` | `crate`      | Enum: backend not available, invalid backend, initialization failure, missing config       |
| `BackendKind`  | `crate`      | Enum: `Auto`, `Mpi`, `Tcp(TcpConfig)`, `Shm(ShmConfig)`, `Local` -- programmatic selection |
| `TcpConfig`    | `crate::tcp` | TCP backend configuration (coordinator address, rank, size, bind addr, timeout)            |
| `ShmConfig`    | `crate::shm` | Shared memory backend configuration (segment name, rank, size)                             |

### 3.3 Functions

| Item                    | Module  | Description                                                                                        |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `create_communicator()` | `crate` | Factory: reads `COBRE_COMM_BACKEND` env var, applies priority chain, returns concrete backend type |

### 3.4 Feature-Gated Backend Types

| Item                | Module         | Feature   | Description                                           |
| ------------------- | -------------- | --------- | ----------------------------------------------------- |
| `MpiCommunicator`   | `crate::mpi`   | `mpi`     | ferrompi backend wrapping MPI collectives             |
| `TcpCommunicator`   | `crate::tcp`   | `tcp`     | TCP/IP backend using coordinator pattern              |
| `ShmCommunicator`   | `crate::shm`   | `shm`     | POSIX shared memory backend for single-node execution |
| `LocalCommunicator` | `crate::local` | _(none)_  | Single-process no-op backend (always available)       |
| `CommBackend`       | `crate`        | _(multi)_ | Enum dispatch wrapper for multi-feature builds        |

All backend types implement both `Communicator` and `SharedMemoryProvider`. The
local and tcp backends implement `SharedMemoryProvider` via `HeapFallback`
(per-process heap allocation instead of true sharing).

## 4. Feature Matrix

See [Backend Selection](../specs/hpc/backend-selection.md) for full details.

### 4.1 Feature Flags

| Feature    | Backend             | External Dependencies                                    | Link-Time Requirements          | Binary Size Impact    |
| ---------- | ------------------- | -------------------------------------------------------- | ------------------------------- | --------------------- |
| `mpi`      | ferrompi (MPI)      | MPI development libraries (OpenMPI, MPICH, or Intel MPI) | Links `libmpi.so` or equivalent | ~200 KB + MPI runtime |
| `tcp`      | TCP sockets         | None (`std::net`)                                        | None                            | ~50 KB                |
| `shm`      | POSIX shared memory | POSIX shared memory APIs (`shm_open`, `mmap`)            | Links `librt` on Linux          | ~30 KB                |
| _(always)_ | Local (no-op)       | None                                                     | None                            | ~1 KB (inlined away)  |

**Rules:**

1. `local` is unconditional -- always compiled, no feature flag needed
2. Feature flags are additive -- multiple features can coexist in one binary
3. `ferrompi` crate dependency is gated behind the `mpi` feature

### 4.2 Build Profiles

| Build Profile    | Cargo Features | Downstream Crate | Rationale                                                                    |
| ---------------- | -------------- | ---------------- | ---------------------------------------------------------------------------- |
| **CLI / HPC**    | `mpi`          | `cobre-cli`      | MPI for cluster execution. `local` implicitly available for single-rank runs |
| **Python wheel** | `tcp,shm`      | `cobre-python`   | No MPI on user machines. TCP for multi-process, shm for intra-node           |
| **Test / CI**    | _(none)_       | all crates       | Only `local`. Deterministic, no external deps, fast compilation              |
| **Development**  | `mpi,tcp,shm`  | developer builds | All backends for testing. Runtime selection via `COBRE_COMM_BACKEND`         |

**Example Cargo.toml dependencies:**

```toml
# In cobre-cli/Cargo.toml (CLI/HPC build)
[dependencies]
cobre-comm = { path = "../cobre-comm", features = ["mpi"] }

# In cobre-python/Cargo.toml (Python wheel)
[dependencies]
cobre-comm = { path = "../cobre-comm", features = ["tcp", "shm"] }

# In cobre-sddp/Cargo.toml (feature pass-through)
[dependencies]
cobre-comm = { path = "../cobre-comm" }

[features]
mpi = ["cobre-comm/mpi"]
tcp = ["cobre-comm/tcp"]
shm = ["cobre-comm/shm"]
```

Feature flags are propagated through the dependency chain: `cobre-cli` enables
`cobre-sddp/mpi`, which enables `cobre-comm/mpi`, which enables the `ferrompi`
dependency. This is the standard Cargo feature propagation pattern.

## 5. Migration Path

The introduction of `cobre-comm` changes how downstream crates interact with
communication. The migration is mechanical -- it replaces concrete ferrompi types
with generic trait parameters.

### 5.1 Dependency Changes

| Crate          | Before                      | After                                                      |
| -------------- | --------------------------- | ---------------------------------------------------------- |
| `cobre-sddp`   | `ferrompi` (optional)       | `cobre-comm` (required, features forwarded)                |
| `cobre-cli`    | `ferrompi` (optional)       | No direct dep; uses `cobre-comm` via `cobre-sddp` features |
| `cobre-python` | No communication dependency | `cobre-comm` (features: `tcp,shm`)                         |
| `cobre-mcp`    | No communication dependency | `cobre-comm` (features: none, `local` only)                |

### 5.2 Signature Changes

Function signatures in `cobre-sddp` change from concrete ferrompi types to
generic trait bounds:

**Before (direct ferrompi usage):**

```rust
use ferrompi::Communicator;

pub fn train(
    comm: &Communicator,
    config: &TrainingConfig,
    stages: &[StageTemplate],
) -> TrainingResult { ... }
```

**After (generic over cobre-comm trait):**

```rust
use cobre_comm::{Communicator, SharedMemoryProvider};

pub fn train<C: Communicator + SharedMemoryProvider>(
    comm: &C,
    config: &TrainingConfig,
    stages: &[StageTemplate],
) -> TrainingResult { ... }
```

The change propagates to all functions that perform communication: `forward_pass`,
`backward_pass`, `synchronize_cuts`, `aggregate_statistics`, and the simulation
entry point. Each gains a generic `C: Communicator` parameter.

### 5.3 Initialization Changes

The training entry point in `cobre-cli` changes from direct MPI initialization
to the `cobre-comm` factory:

**Before:**

```rust
// cobre-cli: direct MPI init or single-process fallback
let comm = if mpi_available() {
    ferrompi::init_thread(Required)?
} else {
    // ad-hoc single-process mode
};
```

**After:**

```rust
let comm = cobre_comm::create_communicator()?;
train(&comm, &config, &stages)?;
```

For library-mode callers (`cobre-python`, `cobre-mcp`), the communicator is
constructed directly using the concrete backend type or the `BackendKind` enum:

```rust
// cobre-python: explicit backend selection
let comm = cobre_comm::LocalCommunicator::new();  // single-process
// or
let comm = cobre_comm::TcpCommunicator::connect(tcp_config)?;  // distributed
```

### 5.4 Downstream Feature Selection

Each downstream crate selects its communication backends via Cargo feature flags
on its `cobre-comm` (or `cobre-sddp`) dependency. The crate does not need to
know about backends it does not use:

| Crate          | Features Enabled | Available Backends | Typical Usage                        |
| -------------- | ---------------- | ------------------ | ------------------------------------ |
| `cobre-cli`    | `mpi`            | MPI, local         | `mpiexec` cluster runs               |
| `cobre-python` | `tcp,shm`        | TCP, shm, local    | Multi-process from Python            |
| `cobre-mcp`    | _(none)_         | local only         | Single-process MCP server            |
| test harness   | _(none)_         | local only         | Deterministic unit/integration tests |

## Status

cobre-comm is in the **design phase**. The trait definitions
([Communicator Trait](../specs/hpc/communicator-trait.md)) and backend selection
mechanism ([Backend Selection](../specs/hpc/backend-selection.md)) are specified.
Backend implementation specifications (ferrompi, local, TCP, shared-memory) are
planned for Epic 02. No Rust code has been published yet; the crate will be
added to the Cargo workspace during implementation.

## Cross-References

- [Communicator Trait §1-§3](../specs/hpc/communicator-trait.md) -- `Communicator` trait definition, method contracts, generic parameterization pattern
- [Communicator Trait §4](../specs/hpc/communicator-trait.md) -- `SharedMemoryProvider` and `SharedRegion` trait definitions, HeapFallback strategy
- [Backend Selection](../specs/hpc/backend-selection.md) -- Compile-time feature flags, runtime selection, factory pattern, library-mode API, error handling
- [Solver Abstraction §10](../specs/architecture/solver-abstraction.md) -- Architectural precedent for compile-time backend selection via Cargo feature flags and generic parameters
- [Communication Patterns](../specs/hpc/communication-patterns.md) -- The three collective operations per SDDP iteration and their performance characteristics
- [Shared Memory Aggregation](../specs/hpc/shared-memory-aggregation.md) -- Leader/follower allocation pattern for intra-node shared data
- [Hybrid Parallelism §6](../specs/hpc/hybrid-parallelism.md) -- Initialization sequence where backend selection occurs
- [Python Bindings §1.2](../specs/interfaces/python-bindings.md) -- Single-process execution mode that uses the local backend
- [Structured Output §2](../specs/interfaces/structured-output.md) -- Error kind registry for backend selection errors
