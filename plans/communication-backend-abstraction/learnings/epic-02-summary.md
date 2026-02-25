# Accumulated Learnings: Through Epic 02 — Backend Implementation Specifications

**Plan**: communication-backend-abstraction
**Through epic**: epic-02-backend-implementations-spec
**Updated**: 2026-02-25

---

## Spec Document Conventions

- New spec files open with `# Title`, `## Purpose` (one paragraph citing architectural precedent, deployment scenario, both traits implemented, and Cargo feature flag), then numbered sections
- Every spec and crate file ends with a `## Cross-References` section listing all cited documents with section granularity
- Cross-reference link format: `[Section Name §N](./relative-path.md)` using the § symbol, not the word "Section"
- Crate files (`src/crates/*.md`) open with the crate name, a `<span class="status-experimental">` badge, `## Overview`, `## Key Concepts`, then numbered sections — matching `sddp.md` and `core.md` exactly
- Files added to `src/specs/hpc/` and `src/crates/` are NOT added to `SUMMARY.md` until ticket-012 (Epic 03)

## Table Formats Established

- Method contract tables: two tables per method (`| Condition | Description |`) for Preconditions and Postconditions, followed by prose for Determinism / Error semantics / Thread safety
- Feature flag matrix: `| Feature | Backend | External Dependencies | Link-Time Requirements | Binary Size Impact |`; unconditional backend row uses `_(always)_`; test/CI no-feature row uses `_(none)_`
- Build profile table: `| Build Profile | Includes X? | Rationale |`; every backend spec closes its feature-gating section with this table for CLI/HPC, Python wheel, Test/CI, and Development profiles
- Per-backend env var table: `| Variable | Required | Default | Description |`; no-default cells use `_(none)_`
- Error mapping tables: `| Source Error | CommError Variant |` with the full variant struct literal in the right column; `mpi_error_code: 0` for non-MPI backends
- Migration before/after: two-column `| Before | After |` table for dependency and signature changes

## Backend Spec Structure (All Four Backends)

- §1 Struct and Trait Implementation — struct definition + `impl Communicator` code + method mapping summary table
- §2 Initialization / Connection Establishment / Process Coordination — startup sequence for the backend
- §3 SharedWindow / Identity Semantics / Collective Protocols — SharedMemoryProvider or per-collective step-by-step protocols
- §4 Performance / SharedMemoryProvider — zero-cost argument or HeapFallback / true-shm implementation
- §5 Error Mapping / Determinism — error mapping table or determinism guarantee table
- §6 Feature Gating / Performance Analysis / Platform Requirements — `#[cfg(feature)]` gating + build profiles
- §7 Configuration — environment variable reference + example invocation
- `## Cross-References` at the end
- Additive sections allowed (TCP adds §4 Message Framing; shm adds §5 NUMA Considerations); no sections may be removed

## Design Decisions — Trait Architecture

- `Communicator` and `SharedMemoryProvider` are separate traits; never merge them (different lifetime semantics: message-passing vs. persistent memory regions)
- `LocalBackend` and `TcpBackend` use `HeapFallback` (`HeapRegion<T>`, per-process `Vec<T>`) for `SharedMemoryProvider`; `FerrompiBackend` uses `FerrompiRegion<T>` wrapping `ferrompi::SharedWindow<T>`; `ShmBackend` uses `ShmRegion<T>` wrapping `shm_open`/`mmap`
- `HeapRegion<T>` is defined once in `backend-local.md` SS3.2 and reused by `backend-tcp.md` SS7.1 — no duplication
- `SharedRegion<T>` write access uses `as_mut_slice(&mut self) -> &mut [T]` (idiomatic Rust, zero-copy)
- `split_local()` returns `Box<dyn Communicator>` — the one sanctioned use of dynamic dispatch, justified because it is initialization-only
- `split_local()` behavior differs per backend: ferrompi returns intra-node MPI sub-communicator; local and TCP return `Box::new(LocalBackend)`; shm returns a clone of the full `ShmBackend` (all shm ranks are on the same node)
- `unsafe` boundary for raw pointer dereference into shared memory is encapsulated in the wrapper type (`FerrompiRegion<T>` or `ShmRegion<T>`); `SharedRegion<T>` trait presents safe signatures only

## Design Decisions — Dispatch

- Static dispatch (`C: Communicator` generics) is non-negotiable for all hot-path call sites
- `Box<dyn Communicator>` is forbidden as a factory return type; multi-feature builds use a `CommBackend` enum with one match per collective call
- The `local` backend's no-op collectives compile to zero instructions after inlining in single-feature builds
- `create_communicator()` returns `impl Communicator` in single-feature builds and `CommBackend` in multi-feature builds

## Design Decisions — Backend Selection

- Two-level mechanism: Cargo feature flags (primary, compile-time) and `COBRE_COMM_BACKEND` env var (secondary, runtime)
- `local` backend is unconditional — no feature flag, always available, always the fallback
- Priority chain for `auto` mode: mpi > tcp > shm > local (only considers compiled-in backends)
- MPI launch detection probes six env vars: `PMI_RANK`, `PMI_SIZE`, `OMPI_COMM_WORLD_RANK`, `OMPI_COMM_WORLD_SIZE`, `MPI_LOCALRANKID`, `SLURM_PROCID`
- All Cobre comm env vars use `COBRE_` prefix to avoid collision with MPI launcher, OpenMP, and solver vars
- Feature flag for the ferrompi backend is named `mpi` (public concept), not `ferrompi` (implementation detail)

## Design Decisions — Collective Protocols

- **TCP coordinator pattern**: rank 0 is coordinator (star topology); all collective operations flow through coordinator; no peer-to-peer messaging; workers send data, coordinator assembles/reduces, coordinator broadcasts result — documented in `src/specs/hpc/backend-tcp.md` SS1 and SS3
- **TCP message framing**: 4-byte u32 big-endian length + 1-byte operation tag + raw payload; 10 operation tags (0x01-0x0A) defined in `backend-tcp.md` SS4.2; payload transmitted in sender's native byte order (homogeneous architecture assumed)
- **shm collective pattern**: each rank writes to its offset in shared buffer -> barrier -> all ranks read; no coordinator required; barrier uses atomic counter + futex (Linux) or pthread condvar with PTHREAD_PROCESS_SHARED (macOS) — documented in `src/specs/hpc/backend-shm.md` SS3
- **shm allreduce requires two barriers**: one after population, one after rank 0 reduces; a single barrier is insufficient — documented in `backend-shm.md` SS3.2
- **shm generation counter prevents ABA problem in barrier**: `barrier_generation: AtomicU64` incremented on each completion; waiters check generation, not count — documented in `backend-shm.md` SS1.4
- **TCP and shm allreduce are stricter than MPI**: coordinator/rank-0 reduces in fixed rank order, producing bit-for-bit deterministic results regardless of MPI implementation — documented in `backend-tcp.md` SS3.2 and `backend-shm.md` SS3.2

## Design Decisions — SharedMemoryProvider

- **ferrompi and shm**: true inter-process shared memory; both achieve ~62.4 MB savings vs. 83.2 MB HeapFallback for 4 ranks with ~20 MB of shareable data
- **local and TCP**: HeapFallback (per-process `Vec<T>`); every rank is its own "leader" (`is_leader()` always returns `true`); `fence()` is a no-op
- **Shared data candidates** (opening tree ~0.8 MB, input case data ~20 MB, cut pool ~250 MB at capacity) are consistent across ferrompi and shm backends
- **Rank 0 is always the leader** for segment lifecycle in shm: creates segment with `O_EXCL`, initializes control region, calls `shm_unlink` on drop

## Error Type Architecture

- `CommError`: collective operation failures — defined in `communicator-trait.md` SS1.4, extended with `AllocationFailed` in SS4.6
- `BackendError`: factory/selection failures — defined in `backend-selection.md` SS6.2
- No backend spec introduces new `CommError` variants; all errors map to existing variants
- For non-MPI backends, `mpi_error_code: 0` in `CommError::CollectiveFailed`; OS/TCP error in the `message` field
- Initialization errors (handshake failures, `shm_open` EEXIST) reported as `BackendError::InitializationFailed`, not `CommError`

## Files Produced

- `src/specs/hpc/communicator-trait.md` — `Communicator` trait (SS1-SS3) and `SharedMemoryProvider` trait (SS4) with full method contracts and HeapFallback semantics
- `src/specs/hpc/backend-selection.md` — Two-level selection mechanism, feature matrix, factory pattern, library-mode API, structured error output
- `src/crates/comm.md` — Crate spec: architecture, dependency graph, public API surface, feature matrix, migration path from direct ferrompi usage
- `src/specs/hpc/backend-ferrompi.md` — Ferrompi backend: zero-cost delegation to ferrompi API, `FerrompiRegion<T>` wrapping MPI windows, persistent collective optimization, MPI error mapping
- `src/specs/hpc/backend-local.md` — Local backend: ZST `LocalBackend`, identity/no-op classification, `HeapRegion<T>` definition, use cases, floating-point determinism guarantee
- `src/specs/hpc/backend-tcp.md` — TCP backend: coordinator pattern, handshake protocol, per-collective step-by-step message sequences, wire format with 10 operation tags, failure handling, performance analysis
- `src/specs/hpc/backend-shm.md` — Shm backend: POSIX `shm_open`/`mmap`, `ControlRegion` with atomic synchronization, per-collective shared-buffer protocols, `ShmRegion<T>`, NUMA trade-off analysis, platform requirements

## Handoff Points for Epic 03

- `hybrid-parallelism.md §6` maps to `backend-ferrompi.md §2.1` (FerrompiBackend::new() wraps §6 Steps 1-3 exactly)
- All direct ferrompi API references in existing specs should become `[Communicator Trait §N.M](./communicator-trait.md)` links; `SharedWindow<T>` references should become `SharedRegion<T>` citing `communicator-trait.md §4.2`
- `communication-patterns.md §3.2` TCP viability analysis is now superseded by the detailed analysis in `backend-tcp.md §6.3` and §6.4; cite the backend spec rather than restating numbers
- `SUMMARY.md` update (ticket-012) must add `backend-ferrompi.md`, `backend-local.md`, `backend-tcp.md`, `backend-shm.md`, `communicator-trait.md`, `backend-selection.md` to the appropriate sidebar sections

## Handoff Points for Epic 04

- `backend-tcp.md §8.1` contains the complete TCP environment variable reference (`COBRE_TCP_COORDINATOR`, `COBRE_TCP_PORT`, `COBRE_TCP_RANK`, `COBRE_TCP_SIZE`, `COBRE_TCP_TIMEOUT_SECS`) — ticket-014 imports this by reference, not by restating
- `backend-shm.md §7.1` contains the complete shm environment variable reference (`COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE`) — ticket-015 imports this by reference
- `backend-shm.md §7.3` already contains a Python multi-process usage example with `multiprocessing.Process`; ticket-015 should reference it directly

## Handoff Points for Epic 05

- Conformance tests must cover three distinct critical behaviors: identity/no-op distinction in local (`backend-local.md §2.2`), rank-ordered allgatherv assembly in TCP and shm (`backend-tcp.md §3.1`, `backend-shm.md §3.1`), and two-barrier protocol in shm allreduce (`backend-shm.md §3.2`)
- Use short timeouts for crash-detection tests: `COBRE_TCP_TIMEOUT_SECS=2` prevents 60-second hangs in CI
