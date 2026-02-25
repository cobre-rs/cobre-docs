# Accumulated Learnings: Through Epic 03 — Spec Refactoring

**Plan**: communication-backend-abstraction
**Through epic**: epic-03-spec-refactoring
**Updated**: 2026-02-25

---

## Spec Document Conventions

- New spec files open with `# Title`, `## Purpose` (one paragraph citing architectural precedent, deployment scenario, both traits implemented, and Cargo feature flag), then numbered sections
- Every spec and crate file ends with a `## Cross-References` section listing all cited documents with section granularity
- **Section reference symbol is location-dependent**: files in `src/specs/hpc/` use `§` (e.g., `[Communicator Trait §2](./communicator-trait.md)`); files in `src/specs/architecture/` use `SS` (e.g., `[Communicator Trait SS2](../hpc/communicator-trait.md)`) — do not unify; follow the convention of the file being written or refactored
- Crate files (`src/crates/*.md`) open with the crate name, a `<span class="status-experimental">` badge, `## Overview`, `## Key Concepts`, then numbered sections — matching `sddp.md` and `core.md` exactly
- Files added to `src/specs/hpc/` and `src/crates/` are NOT added to `SUMMARY.md` until a dedicated sidebar-update ticket (ticket-012 pattern)

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

## Spec Refactoring Conventions (Epic 03 Established)

- **Additive-only rule**: never delete or renumber existing sections when refactoring a spec; only modify prose and add cross-references
- **Ferrompi detail preservation**: ferrompi-specific content (capabilities table, persistent collectives section) is not deleted — it is reframed with an opening sentence: "The following details the capabilities of the **ferrompi backend** (`FerrompiBackend`)..." and a cross-reference to `backend-ferrompi.md`
- **MPI operation name replacement rules**: `MPI_Allgatherv` → `allgatherv`, `MPI_Allreduce` → `allreduce`, `MPI_Barrier` → `barrier`, `MPI_Bcast` → `broadcast`, `MPI_SUM` → `ReduceOp::Sum`, `MPI_MIN` → `ReduceOp::Min`
- **Type replacement rules**: `SharedWindow<T>` → `SharedRegion<T>` (citing `communicator-trait.md §4.2`), `split_shared_memory()` → `split_local()` (citing `communicator-trait.md §4.1`), `window.fence()` → `region.fence()`
- **MPI operation names in mathematical or quoted contexts** are NOT replaced — only API-level references in prose are updated
- **Section title generalization pattern**: "MPI Operations" → "Collective Operations", "MPI Synchronization Points" → "Communication Synchronization Points"
- **`comm.size() == 1` replaces "single-process mode"**: for single-rank variants in training-loop.md, the condition is expressed as `comm.size() == 1` because single-rank execution can occur with any backend (including `mpiexec -n 1`), not just `LocalBackend`

## Residual Stale Content After Epic 03

- `hybrid-parallelism.md §3` table (MPI vs OpenMP responsibility split) retains `MPI_Allgatherv` and `MPI_Allreduce` in prose describing the MPI responsibility column — these are in a conceptual comparison table, not API calls, and were left unchanged
- `hybrid-parallelism.md §3` backward pass table retains `MPI_Allgatherv` in the operation description for Level 2
- `hybrid-parallelism.md` Cross-References section retains descriptions referencing `MPI_Allgatherv`, `SharedWindow<T>`, and `split_shared_memory()` in the link descriptions for `Training Loop §6.3` and `Communication Patterns`
- `communication-patterns.md` Cross-References section retains a `Hybrid Parallelism §1.2` link whose description mentions `SharedWindow<T>` and `split_shared_memory()`
- These residuals were not in-scope for Epic 03 tickets; they will surface in a future cleanup pass or can be addressed in Epic 06
- `memory-architecture.md` retains `SharedWindow<T>` and `MPI_Allgatherv` throughout — this file was not in Epic 03 scope

## Cross-Reference Link Format Rules

- For HPC-to-HPC links (within `src/specs/hpc/`): `[Target §N](./target-file.md)`
- For HPC-to-architecture links (from `src/specs/hpc/` to `src/specs/architecture/`): `[Target §N](../architecture/target-file.md)`
- For architecture-to-HPC links (from `src/specs/architecture/` to `src/specs/hpc/`): `[Target SS#](../hpc/target-file.md)` using `SS` notation
- For crate-to-spec links (from `src/crates/` to `src/specs/`): `[Target](../specs/hpc/target-file.md)` (one extra `../` level up)
- SUMMARY.md page paths are relative to `src/` (the mdBook source root), not to the file's directory: `./specs/hpc/communicator-trait.md`

## SUMMARY.md and Sidebar Conventions

- SUMMARY.md indentation uses 2 spaces per sub-level for mdBook nested sidebar entries
- New HPC communication specs are inserted as a contiguous block after `Communication Patterns` and before `Memory Architecture`
- Order within the block: `Communicator Trait` first, then `Backend Selection`, then the four backend specs in alphabetical order: ferrompi, local, shm, tcp
- `cobre-comm` is inserted into the Crate Documentation sidebar after `cobre-cli` (alphabetical order within the existing ordering policy)
- `comm.md` (crate spec in `src/crates/`) is NOT added to the cross-reference index — the index covers only `src/specs/` files

## Crate Dependency Graph Conventions

- Dependency graph uses ASCII tree format with `├──`, `└──`, and `│` connectors in a fenced code block
- New/changed entries are annotated with `[NEW]` on the right side of the line
- Optional dependencies are annotated inline: `(tcp,shm features — no MPI dependency)` or `(optional, mpi feature only)`
- The `ferrompi` block at the bottom uses a `used by:` / `NOT used by:` format listing all affected crates

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
- The training loop expresses its communicator dependency as `train<C: Communicator>(comm: &C, ...)` — the generic parameterization is a signature-level fact, referenced from `communicator-trait.md §3`

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

## Cross-Reference Index Conventions (Epic 03 Established)

- The cross-reference index (`src/specs/cross-reference-index.md`) counts only `src/specs/` files — crate files in `src/crates/` are excluded
- Spec-to-Crate Mapping rows are never renumbered; new rows are appended at the end (rows 55-60 for Epic 03's six new HPC specs)
- All six new HPC specs map to `cobre-comm` as their primary crate
- `communicator-trait.md` is the highest-fanin spec in the HPC section after Epic 03: referenced by `hybrid-parallelism.md`, `communication-patterns.md`, `training-loop.md`, `synchronization.md`, `work-distribution.md`, `shared-memory-aggregation.md`, and all four backend specs — total incoming ≥ 12
- Per-Crate Reading Lists use numbered entries with `(secondary)` annotations; the `cobre-comm` reading list has 6 primary + 3 secondary entries
- An errata note was added to the cross-reference index header after Epic 06 remediation: "Seven HIGH-severity section-number errors (F-1, F-5, F-6, F-7, F-8, F-9, F-11) were identified in the Epic 03 cross-reference audit and corrected in Epic 06 remediation"

## Files Produced / Modified in Epics 01-03

- `src/specs/hpc/communicator-trait.md` — `Communicator` trait (SS1-SS3) and `SharedMemoryProvider` trait (SS4) with full method contracts and HeapFallback semantics
- `src/specs/hpc/backend-selection.md` — Two-level selection mechanism, feature matrix, factory pattern, library-mode API, structured error output
- `src/crates/comm.md` — Crate spec: architecture, dependency graph, public API surface, feature matrix, migration path from direct ferrompi usage
- `src/specs/hpc/backend-ferrompi.md` — Ferrompi backend: zero-cost delegation to ferrompi API, `FerrompiRegion<T>` wrapping MPI windows, persistent collective optimization, MPI error mapping
- `src/specs/hpc/backend-local.md` — Local backend: ZST `LocalBackend`, identity/no-op classification, `HeapRegion<T>` definition, use cases, floating-point determinism guarantee
- `src/specs/hpc/backend-tcp.md` — TCP backend: coordinator pattern, handshake protocol, per-collective step-by-step message sequences, wire format with 10 operation tags, failure handling, performance analysis
- `src/specs/hpc/backend-shm.md` — Shm backend: POSIX `shm_open`/`mmap`, `ControlRegion` with atomic synchronization, per-collective shared-buffer protocols, `ShmRegion<T>`, NUMA trade-off analysis, platform requirements
- `src/specs/hpc/hybrid-parallelism.md` — Refactored: purpose and SS1 generalized to trait-based terminology; SS6 initialization sequence uses `create_communicator()`; cross-references added for all new specs
- `src/specs/hpc/communication-patterns.md` — Refactored: SS1 retitled "Collective Operations"; SS4 reframed as ferrompi-specific; SS5 updated to `SharedRegion<T>`; SS6 determinism linked to trait contract
- `src/specs/architecture/training-loop.md` — Refactored: `allreduce`/`allgatherv` replaces MPI names; single-rank variants use `comm.size() == 1`; `C: Communicator` generic documented in §4.3
- `src/specs/hpc/synchronization.md` — Refactored: SS1 retitled "Communication Synchronization Points"; MPI operation names replaced; `communicator-trait.md` added to cross-references
- `src/specs/hpc/work-distribution.md` — Refactored: MPI operation names replaced throughout; `communicator-trait.md` cross-reference added
- `src/specs/hpc/shared-memory-aggregation.md` — Refactored: all `SharedWindow<T>` replaced with `SharedRegion<T>`; `split_shared_memory()` replaced with `split_local()`; `communicator-trait.md §4` and `backend-local.md §3` added to cross-references
- `src/crates/overview.md` — Updated: `cobre-comm` added to dependency graph and crate table; `ferrompi` dependency encapsulated; "Communication is pluggable" design principle added
- `src/SUMMARY.md` — Updated: `cobre-comm` added to Crate Documentation; 6 new HPC spec pages added under High-Performance Computing
- `src/specs/cross-reference-index.md` — Updated: 60 rows total (up from 54); `cobre-comm` reading list added; outgoing and incoming reference tables updated for all refactored specs

## Handoff Points for Epic 04

- `backend-tcp.md §8.1` contains the complete TCP environment variable reference (`COBRE_TCP_COORDINATOR`, `COBRE_TCP_PORT`, `COBRE_TCP_RANK`, `COBRE_TCP_SIZE`, `COBRE_TCP_TIMEOUT_SECS`) — ticket-014 imports this by reference, not by restating
- `backend-shm.md §7.1` contains the complete shm environment variable reference (`COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE`) — ticket-015 imports this by reference
- `backend-shm.md §7.3` already contains a Python multi-process usage example with `multiprocessing.Process`; ticket-015 should reference it directly
- When writing Python-side specs in Epic 04, use the `SS` section symbol convention (not `§`) because the Python specs will live in `src/specs/interfaces/` — same layer as `training-loop.md`
- The `hybrid-parallelism.md §1.0a` single-process mode description (referencing `LocalBackend` and `HeapFallback`) is the canonical cross-reference target for Python-side single-process execution; Python spec should cite `hybrid-parallelism.md §1.0a` rather than restating the constraints

## Handoff Points for Epic 05

- Conformance tests must cover three distinct critical behaviors: identity/no-op distinction in local (`backend-local.md §2.2`), rank-ordered allgatherv assembly in TCP and shm (`backend-tcp.md §3.1`, `backend-shm.md §3.1`), and two-barrier protocol in shm allreduce (`backend-shm.md §3.2`)
- Use short timeouts for crash-detection tests: `COBRE_TCP_TIMEOUT_SECS=2` prevents 60-second hangs in CI
- The `comm.size() == 1` single-rank case in `training-loop.md §4.3a` and `§6.3a` has specific `LocalBackend` behavior (identity copy / memcpy) — conformance tests should verify `LocalBackend` allgatherv returns the send buffer as the full receive buffer
