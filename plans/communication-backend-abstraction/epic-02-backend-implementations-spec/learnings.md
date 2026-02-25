# Epic 02 Learnings: Backend Implementation Specifications

**Plan**: communication-backend-abstraction
**Epic**: epic-02-backend-implementations-spec
**Tickets**: ticket-005 through ticket-008
**Date**: 2026-02-25

---

## Patterns Established

- **Backend spec opening paragraph pattern**: Every backend spec opens with a single `## Purpose` paragraph that (a) names the deployment scenario the backend targets, (b) cites the two traits it implements (`Communicator` and `SharedMemoryProvider`), (c) identifies the architectural precedent (`Solver Abstraction §10`), and (d) names the Cargo feature flag. This pattern is consistent across all four files: `src/specs/hpc/backend-ferrompi.md`, `src/specs/hpc/backend-local.md`, `src/specs/hpc/backend-tcp.md`, `src/specs/hpc/backend-shm.md`.

- **Backend section numbering pattern**: All four backend specs use the same top-level section scheme: §1 Struct and Trait Implementation, §2 Initialization / Connection / Process Coordination, §3 SharedWindow / Identity Semantics / Collective Protocols, §4 Performance / SharedMemoryProvider, §5 Error Mapping / Determinism, §6 Feature Gating / Performance Analysis / Platform Requirements, §7 Configuration, with `## Cross-References` at the end. Deviations from this base skeleton are additive (TCP adds SS4 Message Framing; shm adds SS5 NUMA Considerations), never subtractive.

- **Method mapping summary table pattern**: After every `impl Communicator` code block, a `| Trait Method | API Call | Type Conversion |` table summarizes the delegation in prose form. Observed in `backend-ferrompi.md` SS1.2. Future backend specs should include an equivalent summary when the delegation is non-trivial.

- **Step-by-step collective protocol pattern**: Multi-process backends (TCP, shm) specify each collective as a numbered sequence of steps describing who sends what to whom and when barriers are required. TCP uses "message exchange sequence" headers; shm uses "Protocol:" headers with direct shared-buffer write/read steps. Both formats enumerate every rank's role explicitly.

- **Build profile integration table pattern**: Every backend spec closes its feature-gating section with a `| Build Profile | Includes X? | Rationale |` table showing CLI/HPC, Python wheel, Test/CI, and Development profiles. The ferrompi backend is enabled in CLI/HPC and Development only; TCP and shm are enabled in Python wheel and Development only; local is unconditional and omitted from this table.

- **Coordinator-specific topology diagram pattern**: `backend-tcp.md` SS1 includes an ASCII art topology diagram showing the star layout (coordinator + workers). `backend-shm.md` SS1 includes an ASCII art diagram showing processes sharing a control region and data region. These diagrams are anchored inside SS1 (Architecture), not in a separate section.

## Architectural Decisions

- **Coordinator pattern for TCP collective operations**: The TCP backend routes all collective operations through rank 0 (coordinator) using a star topology, not a peer-to-peer mesh. Rejected alternative: full mesh ($O(R^2)$ connections). Rationale: SDDP uses only collective operations, never point-to-point messaging (`communication-patterns.md §1.2`), so a star hub maps naturally to the collective pattern with far simpler connection management. Code at `src/specs/hpc/backend-tcp.md` SS1.1.

- **Shared buffer write-then-barrier-then-read pattern for shm collectives**: The shm backend implements allgatherv and broadcast as: each rank writes to its slot in a shared POSIX mmap buffer, then all ranks synchronize via a shared barrier, then all ranks read the complete assembled buffer. Rejected alternative: TCP-style coordinator relay through shared memory. Rationale: with truly shared memory there is no coordination bottleneck; each rank can read its own copy directly after the barrier, eliminating all data relay overhead. Code at `src/specs/hpc/backend-shm.md` SS3.

- **HeapFallback reuse for local and TCP SharedMemoryProvider**: Both `LocalBackend` and `TcpBackend` use the same `HeapRegion<T>` type (per-process `Vec<T>`) for `SharedMemoryProvider`. The TCP backend explicitly reuses the `HeapRegion<T>` type defined by the local backend rather than defining its own. Rationale: the semantics are identical (both backends have no true shared memory); a single type avoids duplication. The canonical behavior is defined once in `communicator-trait.md` SS4.4 and referenced by both backends. Code at `src/specs/hpc/backend-local.md` SS3.2 (definition) and `src/specs/hpc/backend-tcp.md` SS7.1 (reuse).

- **True POSIX shared memory for ferrompi and shm SharedMemoryProvider**: The ferrompi backend uses `ferrompi::SharedWindow<T>` (MPI windows) wrapped in `FerrompiRegion<T>`; the shm backend uses `shm_open`/`mmap` wrapped in `ShmRegion<T>`. Both provide true inter-process shared memory with the same memory savings (~62.4 MB vs. 83.2 MB for 4 ranks). Rejected alternative: HeapFallback for shm. Rationale: the shm backend's primary value proposition is memory saving on single-node workstations and containers; using HeapFallback would eliminate this advantage entirely. Code at `src/specs/hpc/backend-ferrompi.md` SS3 and `src/specs/hpc/backend-shm.md` SS4.

- **Feature flag name `mpi` (not `ferrompi`)**: The feature flag for the ferrompi backend is `features = ["mpi"]`, even though the underlying crate is `ferrompi`. Rationale: the public interface is the abstract MPI backend concept; the ferrompi crate is an implementation detail. This allows a future crate swap (e.g., `rsmpi`) without breaking the feature name. Established in `src/specs/hpc/backend-ferrompi.md` SS6.

- **Generation counter in shm barrier to prevent ABA problem**: The shm barrier uses a `barrier_generation: AtomicU64` counter alongside `barrier_count: AtomicU32`. When the barrier completes, the generation is incremented. Waiters check the generation, not the count, to avoid re-entering an already-completed barrier. Code at `src/specs/hpc/backend-shm.md` SS1.4.

- **Two-barrier protocol for shm allreduce**: The shm allreduce requires two barriers: one after all ranks write their per-rank input slots (ensuring population is complete before rank 0 reduces), and one after rank 0 writes the result (ensuring visibility before all ranks read). A single barrier would be insufficient because the reduction step is done exclusively by rank 0. Code at `src/specs/hpc/backend-shm.md` SS3.2.

- **`split_local()` behavior differs by backend**: For ferrompi, `split_local()` returns a new `FerrompiBackend` wrapping the intra-node communicator (a real MPI communicator). For local, `split_local()` returns `Box::new(LocalBackend)` (identical to the caller). For TCP, `split_local()` returns `Box::new(LocalBackend)` (single-rank, each TCP rank is its own node). For shm, `split_local()` returns a `Box::new(ShmBackend)` with the same rank and size as the parent (since all shm ranks are on the same node). This means there is no universal rule for `split_local()` — each backend's behavior follows from whether co-located ranks can share memory. Established across all four files.

- **Coordinator address resolution asymmetry**: In the TCP backend, the coordinator (rank 0) binds to `0.0.0.0:COBRE_TCP_PORT` and does not read `COBRE_TCP_COORDINATOR`. Workers read `COBRE_TCP_COORDINATOR` to find the coordinator. This asymmetry means the coordinator's external address need not be known to rank 0 at startup. Established in `src/specs/hpc/backend-tcp.md` SS8.1.

## Files and Structures Created

- `src/specs/hpc/backend-ferrompi.md` — Ferrompi backend spec: `FerrompiBackend` struct and trait impls (§1), initialization wrapping `hybrid-parallelism.md §6` steps 1-3 (§2), `FerrompiRegion<T>` wrapping `ferrompi::SharedWindow<T>` (§3), zero-cost monomorphization and persistent collectives (§4), MPI error code to `CommError` mapping table (§5), `#[cfg(feature = "mpi")]` gating (§6).

- `src/specs/hpc/backend-local.md` — Local backend spec: `LocalBackend` ZST definition (§1), identity vs. no-op classification table and postcondition verification (§2), `HeapRegion<T>` definition and `HeapFallback` behavior summary (§3), use cases: Python bindings, MCP server, TUI, testing (§4), floating-point determinism guarantee (§5).

- `src/specs/hpc/backend-tcp.md` — TCP backend spec: coordinator pattern and topology diagram (§1), startup sequence and handshake protocol with field-level framing details (§2), per-collective step-by-step message exchange sequences (§3), wire format with operation tag table (§4), timeout-based failure detection and graceful shutdown (§5), performance analysis with coordinator I/O and wire-speed math (§6), `HeapFallback` reuse (§7), full environment variable reference (§8).

- `src/specs/hpc/backend-shm.md` — Shm backend spec: process model and shared memory layout diagram (§1), POSIX `shm_open`/`mmap` startup sequence with rank 0 vs. follower paths (§2), per-collective protocols using shared buffers and atomic synchronization (§3), `ShmRegion<T>` implementing true POSIX shared memory for `SharedMemoryProvider` (§4), NUMA first-touch policy and performance trade-off analysis (§5), platform requirements table (Linux/macOS yes, Windows no) with system call inventory (§6), full environment variable reference (§7), error mapping table (§8).

## Conventions Adopted

- **No new `CommError` variants in backend specs**: All four backend specs map their failures to the `CommError` variants defined in `communicator-trait.md` SS1.4 and SS4.6. When a backend error has no matching MPI code (TCP, shm), `mpi_error_code` is set to `0` and the `message` field carries the OS/TCP error description. Established in `backend-ferrompi.md` SS5.1, reiterated in `backend-tcp.md` SS5.3 and `backend-shm.md` SS8.

- **Error mapping tables use two-column format**: `| Source Error | CommError Variant |` with the full variant struct literal (including field names) in the right column. The table appears in a numbered SS within the Error Mapping section of each backend spec.

- **Identity vs. no-op distinction must be explicit**: `allgatherv` and `allreduce` for the local backend are identity copies (the send buffer is copied to the receive buffer), NOT no-ops. Only `barrier` and `broadcast` are true no-ops. This distinction is called out explicitly in `backend-local.md` SS2 with a classification column. Any future spec that simplifies "identity copy" to "no-op" should be corrected.

- **Unsafe code encapsulation rule**: The `unsafe` boundary for raw pointer dereference into shared memory (MPI windows or POSIX mmap) is encapsulated within the wrapper type (`FerrompiRegion<T>` or `ShmRegion<T>`). The `SharedRegion<T>` trait presents safe Rust signatures. This pattern is documented in `backend-ferrompi.md` SS3.2 and `backend-shm.md` SS4.2.

- **TCP_NODELAY + SO_KEEPALIVE required for persistent connections**: The TCP backend specifies both socket options on all persistent connections. `TCP_NODELAY` is critical because without it, Nagle's algorithm will buffer small messages (e.g., `BarrierReady` zero-byte payloads) and introduce unnecessary latency. Established in `backend-tcp.md` SS2.4.

- **Rank 0 is responsible for segment lifecycle in shm**: Rank 0 creates the POSIX shared memory segment on startup (`O_EXCL` to prevent stale segments) and calls `shm_unlink` on drop. Other ranks only open and map; they never create or unlink. This matches the leader convention from `communicator-trait.md` SS4.3. Established in `backend-shm.md` SS2.1 and SS2.3.

- **Persistent collective optimization is internal-only**: The ferrompi backend documents MPI 4.0 persistent collectives (`MPI_Allreduce_init`, `MPI_Allgatherv_init`) as an optional internal optimization that does not affect the `Communicator` trait interface. Pre-initialized requests are tracked in optional struct fields (`persistent_allreduce: Option<ferrompi::PersistentRequest>`). The optimization is transparent to callers. Established in `backend-ferrompi.md` SS4.2.

- **`mpi_error_code` set to 0 for non-MPI backends**: When mapping TCP I/O or POSIX shm errors to `CommError::CollectiveFailed`, the `mpi_error_code` field is always `0` because there is no MPI error code to report. This is explicitly documented in `backend-tcp.md` SS5.3 and `backend-shm.md` SS8 to avoid confusion.

## Surprises and Deviations

- **Feature flag named `mpi` but crate named `ferrompi`**: Tickets originally used `features = ["ferrompi"]` in the specification text. The implemented spec uses `features = ["mpi"]` to decouple the public feature name from the crate name. A developer reading `ticket-005` would expect to write `#[cfg(feature = "ferrompi")]` but should instead write `#[cfg(feature = "mpi")]` as shown in `backend-ferrompi.md` SS6.

- **TCP `allreduce` is deterministically sequential, stricter than MPI**: The ticket noted floating-point non-determinism as a concern but only asked for the TCP backend to match MPI. The implemented spec goes further: because the coordinator reduces in fixed rank order (0, 1, ..., R-1), the TCP backend's `allreduce` result is bit-for-bit deterministic for a given rank count, which is stricter than the MPI spec (which allows implementation-defined reduction trees). Same holds for the shm backend's allreduce. Documented in `backend-tcp.md` SS3.2 and `backend-shm.md` SS3.2.

- **shm `split_local()` returns a clone of the full `ShmBackend`**: The ticket and epic overview expected `split_local()` to return a single-rank communicator (like TCP and local). Instead, the shm implementation returns a clone of the parent `ShmBackend` with the same rank and size, because all shm ranks are already on the same node -- the "local" communicator is the full communicator. This affects how code that calls `split_local()` and then checks `size()` will behave (it will get R, not 1). Documented in `backend-shm.md` SS4.1.

- **shm `ControlRegion` uses `repr(C)` and `_padding`**: The control region struct was specified with a `_padding: [u8; 128]` field to push the control region to a cache line boundary, preventing false sharing between control and data regions. This was not in the original ticket specification but was added during implementation. Documented in `backend-shm.md` SS1.3.

- **TCP backend performance analysis corrected from ticket estimate**: The ticket stated "< 200 ms/iteration overhead" as the goal. The implemented analysis in `backend-tcp.md` SS6.3 computes approximately 112 ms/iteration at 100 Gbps with a ~50% protocol overhead factor, and ~2.2% of a 5-second iteration -- within the goal. The coordinator I/O analysis revealed that allgatherv dominates (9,352 MB through coordinator per iteration vs. 587 MB total) because the coordinator must relay the full assembled buffer to all workers.

## Recommendations for Future Epics

- **Epic 03 (Refactoring)**: When updating `hybrid-parallelism.md §6` to reference `FerrompiBackend::new()`, cite `backend-ferrompi.md §2.1` for the initialization sequence. The three-step MPI init sequence (init_with_threading, topology detection, split_shared_memory) in the new spec exactly matches §6 Steps 1-3.

- **Epic 03 (Refactoring)**: When updating `communication-patterns.md §5` to reference `SharedMemoryProvider`, replace `SharedWindow<T>` with `SharedRegion<T>` and link to `communicator-trait.md §4.2`. The ferrompi backend's `FerrompiRegion<T>` is the direct replacement for `SharedWindow<T>` with identical semantics.

- **Epic 03 (Refactoring)**: The TCP backend's performance analysis (`backend-tcp.md §6.4`) quantifies the MPI vs. TCP comparison at production scale. When updating `communication-patterns.md §3`, cite this analysis rather than restating it.

- **Epic 04 (Python multi-process)**: The shm backend spec (`backend-shm.md §7.3`) already contains a Python multi-process usage example with `multiprocessing.Process`. The ticket-015 (Python worker coordination) spec should reference this code pattern directly rather than re-specifying it.

- **Epic 04 (Python multi-process)**: TCP backend configuration requires `COBRE_TCP_COORDINATOR`, `COBRE_TCP_PORT`, `COBRE_TCP_RANK`, `COBRE_TCP_SIZE`, and optionally `COBRE_TCP_TIMEOUT_SECS`. Shm backend configuration requires `COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE`. These are fully documented in `backend-tcp.md §8.1` and `backend-shm.md §7.1` — ticket-014 should import these tables by reference.

- **Epic 05 (Testing)**: The conformance test suite (ticket-017) needs to exercise three distinct behaviors: (1) the identity/no-op distinction in the local backend (`backend-local.md §2.2`), (2) rank-ordered assembly in allgatherv for TCP and shm backends (`backend-tcp.md §3.1`, `backend-shm.md §3.1`), and (3) the two-barrier protocol in shm allreduce (`backend-shm.md §3.2`). These are the implementation choices most likely to produce subtle correctness bugs.

- **Epic 05 (Testing)**: The TCP backend has a configurable timeout (`COBRE_TCP_TIMEOUT_SECS`, default 60 s) and the shm backend's barrier has a timeout for crash detection (`backend-shm.md §3.4`). Conformance tests that deliberately crash a rank should use a short timeout (e.g., `COBRE_TCP_TIMEOUT_SECS=2`) to avoid 60-second test hangs.
