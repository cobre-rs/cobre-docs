# Master Plan: Communication Backend Abstraction

## Executive Summary

This plan introduces a pluggable communication backend abstraction layer to the Cobre SDDP solver specification corpus. The current specs hardcode ferrompi as the only communication backend, with a binary mode: full MPI or single-process no-ops. This plan designs a `Communicator` trait that abstracts all collective operations used by SDDP, specifies four backend implementations (ferrompi, local, TCP/IPC, shared-memory), refactors all affected HPC and architecture specs to reference the trait instead of direct ferrompi calls, updates the Python bindings spec to support multi-process execution via alternative backends, and defines a testing and determinism verification strategy for backend interchangeability.

## Goals & Non-Goals

### Goals

1. **Define the `Communicator` trait**: A Rust trait specification covering the five collective operations used by SDDP (allgatherv, allreduce, broadcast, barrier, shared window) with implementation-ready method signatures, safety contracts, and error semantics.
2. **Specify backend registration and selection**: A compile-time mechanism for selecting which communication backends are available (via Cargo feature flags, consistent with solver-abstraction.md §10), with optional runtime selection among compiled-in backends when multiple are present.
3. **Specify four backend implementations**:
   - **ferrompi** (existing MPI): wraps the current ferrompi usage behind the trait
   - **local** (single-process no-op): formalizes the current ad-hoc single-process mode
   - **tcp** (multi-process without MPI): enables distributed SDDP without an MPI runtime, targeting container deployments and Python multi-process orchestration
   - **shm** (shared-memory, single-node multi-process): enables multi-process SDDP on a single node using OS shared memory primitives, without MPI
4. **Refactor all affected specs**: Update hybrid-parallelism.md, communication-patterns.md, synchronization.md, work-distribution.md, shared-memory-aggregation.md, training-loop.md, and crate overview to reference the `Communicator` trait instead of direct ferrompi APIs.
5. **Enable Python multi-process SDDP**: Update python-bindings.md to document an in-process multi-worker execution mode using the tcp or shm backend, removing the subprocess-only limitation for distributed execution.
6. **Define testing strategy**: Specify backend interchangeability tests and determinism verification across all backends.
7. **Preserve performance**: Ensure the ferrompi backend specification maintains identical performance characteristics to the current direct-call architecture.
8. **Maintain determinism**: Extend the reproducibility invariant from shared-memory-aggregation.md SS3 to cover all backends.

### Non-Goals

- Implementing the backends in Rust code (this plan produces specifications, not code)
- Changing the SDDP algorithm or its mathematical properties
- Adding GPU communication backends (NCCL-equivalent) -- SDDP is CPU-bound
- Specifying MPI-4.0 persistent collective details within the trait (that remains an implementation optimization behind the ferrompi backend)
- Changing the OpenMP threading model (intra-rank parallelism is unchanged)
- Defining a general-purpose communication framework -- the trait surface is scoped to SDDP's exact collective needs

## Architecture Overview

### Current State

The specification corpus defines communication at two levels:

1. **HPC specs** (communication-patterns.md, synchronization.md, hybrid-parallelism.md, work-distribution.md, shared-memory-aggregation.md) specify ferrompi collectives directly: `comm.allgatherv()`, `comm.allreduce()`, `comm.bcast()`, `comm.barrier()`, `SharedWindow<T>`.
2. **Single-process mode** (hybrid-parallelism.md SS1.0a, training-loop.md SS4.3a/SS6.3a, python-bindings.md SS1.2) is specified as an alternative initialization sequence that skips MPI entirely -- collectives become "local no-ops" described in prose, not through a formal interface.

This creates a binary choice: full MPI or no communication. Python bindings are locked to single-process mode due to GIL/MPI incompatibility (python-bindings.md SS7). Container deployments require MPI runtime installation. There is no middle ground.

### Target State

A `Communicator` trait in `cobre-sddp` (or a new `cobre-comm` crate) abstracts all collective operations:

```
                      ┌─────────────────────────┐
                      │   Communicator Trait     │
                      │  allgatherv, allreduce,  │
                      │  broadcast, barrier,     │
                      │  shared_window           │
                      └──────────┬──────────────┘
                                 │
              ┌──────────────────┼──────────────────┐──────────────────┐
              │                  │                   │                  │
     ┌────────▼────────┐ ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐
     │  FerrompiBackend │ │ LocalBackend│  │   TcpBackend    │ │  ShmBackend │
     │  (MPI, existing) │ │ (no-op)     │  │ (TCP/IPC)       │ │ (shm)       │
     └─────────────────┘ └─────────────┘  └─────────────────┘ └─────────────┘
```

All HPC specs reference the trait, not ferrompi directly. ferrompi becomes one backend behind the trait. Single-process mode is the `LocalBackend`. Python bindings can optionally use `TcpBackend` or `ShmBackend` for multi-process execution without MPI. The initialization sequence (hybrid-parallelism.md SS6) is parameterized by backend selection.

### Key Design Decisions

1. **Trait in `cobre-sddp` or new `cobre-comm` crate**: The trait should be defined in a new `cobre-comm` crate to keep the abstraction layer independent of the SDDP algorithm. `cobre-sddp` depends on `cobre-comm`; backend implementations are separate crates or feature-gated modules within `cobre-comm`.

2. **Static dispatch via generics (not dynamic dispatch)**: The training loop is parameterized as `fn train<C: Communicator>(comm: &C, ...)`. This enables monomorphization and zero-cost abstraction for the ferrompi backend, preserving existing performance. The backend is selected at startup and fixed for the lifetime of the training run.

3. **SharedWindow as a separate trait**: `SharedWindow<T>` has fundamentally different semantics from collectives (it is a persistent memory region, not a message-passing operation). It should be a separate trait (`SharedMemoryProvider`) that some backends implement and others do not. The local and tcp backends provide fallback implementations using regular heap allocation.

4. **Compile-time feature-flag selection (consistent with solver §10)**: The primary backend selection mechanism is Cargo feature flags, following the same pattern as compile-time solver selection in solver-abstraction.md §10. Feature flags control which backends are compiled into the binary, eliminating dead code and link-time dependencies for unused backends. When multiple backends are compiled in, an optional runtime `COBRE_COMM_BACKEND` environment variable selects among them, with a priority-based default: `mpi` > `tcp` > `shm` > `local`. This hybrid approach gives compile-time zero-cost abstraction (monomorphization, inlining) while preserving runtime flexibility for multi-backend builds. Build profiles determine the default feature set: CLI/HPC builds enable `mpi`, Python wheels enable `tcp` and `shm`, test builds use `local` only.

5. **TCP backend uses a coordinator pattern**: One process acts as coordinator (analogous to MPI rank 0). Workers connect to the coordinator. The coordinator manages collective operations. This avoids the complexity of a full peer-to-peer mesh while supporting the all-to-all collective pattern SDDP requires.

6. **Determinism is backend-invariant**: The reproducibility invariant (shared-memory-aggregation.md SS3) must hold across all backends. Given the same inputs, rank count, and random seed, all backends must produce bit-for-bit identical results.

## Technical Approach

### Tech Stack

- **Primary**: Markdown documentation in mdBook
- **Domain expertise**: SDDP communication patterns, Rust trait design, distributed systems
- **Specialist**: `sddp-specialist` for domain-specific HPC communication specs

### Component/Module Breakdown

| Epic    | Focus                                     | Specs Involved                                                             | Tickets |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------- | ------- |
| Epic 01 | Communicator trait + backend selection    | New: communicator-trait.md, backend-selection.md                           | 4       |
| Epic 02 | Backend implementation specifications     | New: ferrompi-backend.md, local-backend.md, tcp-backend.md, shm-backend.md | 4       |
| Epic 03 | Refactor existing specs to use trait      | Modify: 8 existing HPC/architecture specs, crate overview                  | 5       |
| Epic 04 | Python multi-process execution spec       | Modify: python-bindings.md; possibly mcp-server.md                         | 3       |
| Epic 05 | Testing and determinism verification spec | New: backend-testing.md or section in existing spec                        | 2       |

### Data Flow

```
Epic 01: Define Communicator trait ──────────────────────┐
  (communicator-trait.md, backend-selection.md)           │
                                                          │
Epic 02: Specify backend implementations ◄───────────────┘
  (ferrompi-backend.md, local-backend.md,                 │
   tcp-backend.md, shm-backend.md)                        │
                                                          │
Epic 03: Refactor existing specs ◄────────────────────────┤
  (hybrid-parallelism.md, communication-patterns.md,      │
   synchronization.md, work-distribution.md, etc.)        │
                                                          │
Epic 04: Python multi-process spec ◄──────────────────────┤
  (python-bindings.md updates)                            │
                                                          │
Epic 05: Testing & determinism spec ◄─────────────────────┘
  (backend-testing.md)
```

### Testing Strategy

1. Each ticket produces a specification document or document update
2. Validation: `mdbook build` succeeds after each ticket
3. Cross-reference consistency: all new cross-references resolve to existing sections
4. Backend interchangeability: the testing spec (Epic 05) defines how to verify that all backends produce identical results

## Phases & Milestones

| Phase | Epic    | Milestone                       | Criteria                                                                               |
| ----- | ------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| 1     | Epic 01 | Trait interface defined         | `Communicator` trait spec complete with method signatures and contracts                |
| 2     | Epic 02 | All backends specified          | Four backend specs written with enough detail for implementation                       |
| 3     | Epic 03 | Existing specs refactored       | All HPC/architecture specs reference trait; ferrompi is one backend, not the only path |
| 4     | Epic 04 | Python multi-process documented | python-bindings.md supports in-process multi-worker via tcp/shm backends               |
| 5     | Epic 05 | Testing strategy complete       | Backend interchangeability and determinism verification spec written                   |

## Risk Analysis

| Risk                                                       | Likelihood | Impact | Mitigation                                                                                                                  |
| ---------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Trait surface too large (SharedWindow complexity)          | Medium     | High   | Separate SharedMemoryProvider trait; not all backends implement it                                                          |
| TCP backend spec over-specifies wire protocol              | Medium     | Low    | Focus on semantics and collective contracts, not byte-level protocol details                                                |
| Refactoring breaks cross-reference consistency             | Low        | Medium | Verify all cross-references after each spec modification                                                                    |
| Python multi-process mode adds complexity to bindings spec | Medium     | Medium | Limit scope to documenting the capability; complex orchestration is deferred                                                |
| Performance regression perception for ferrompi backend     | Low        | High   | Compile-time feature flags + static dispatch via generics preserves zero-cost abstraction (identical pattern to solver §10) |
| Shared-memory backend complexity rivals MPI                | Medium     | Medium | Scope shm backend to single-node, read-only shared regions only                                                             |

## Success Metrics

1. A `Communicator` trait spec with method signatures for all five SDDP collective operations
2. Four backend implementation specs with enough detail for a Rust developer to implement from
3. All 8 affected HPC/architecture specs updated to reference the trait
4. Python bindings spec documents at least one multi-process execution path without MPI
5. A testing spec that defines backend interchangeability and determinism verification
6. `mdbook build` succeeds after all changes
7. No regression in the ferrompi backend's specified performance characteristics
8. The reproducibility invariant (shared-memory-aggregation.md SS3) is extended to all backends
