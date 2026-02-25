# Accumulated Learnings: Through Epic 04 — Python Multi-Process Execution Specification

**Plan**: communication-backend-abstraction
**Through epic**: epic-04-python-multiprocess-spec
**Updated**: 2026-02-25

---

## Spec Document Conventions

- New spec files: `# Title`, `## Purpose` (one paragraph), numbered sections, `## Cross-References` at end
- **Section reference symbol**: `§` for `src/specs/hpc/`; `SS` for `src/specs/interfaces/` and `src/specs/architecture/` — never unify
- **Lettered subsection notation** for non-breaking additions: `SS2.1a`, `SS2.1b` (not `SS2.12`, `SS2.13`)
- Crate files (`src/crates/*.md`): `<span class="status-experimental">` badge, `## Overview`, `## Key Concepts`, then numbered sections
- Additive-only rule: never delete or renumber existing sections; new content goes into lettered subsections or appended top-level sections
- Cross-reference link format: HPC-to-HPC `[Target §N](./file.md)`; interfaces-to-HPC `[Target Name](../hpc/file.md) SSN.M`; same-directory `[Target](./file.md)`

## Table Formats Established

- Method contract: two tables per method (Preconditions / Postconditions) + prose for Determinism / Error semantics / Thread safety
- Feature flag matrix: `| Feature | Backend | External Dependencies | Link-Time Requirements | Binary Size Impact |`
- Build profile table: `| Build Profile | Includes X? | Rationale |`
- Per-backend env var: `| Variable | Required | Default | Description |`; no-default cells use `_(none)_`
- Execution mode table: `| Execution Mode | Supported | Thread Count | GIL State During Computation | Use Case |`

## Design Decisions — Trait and Dispatch Architecture

- `Communicator` and `SharedMemoryProvider` are separate traits; never merge (different lifetime semantics)
- `HeapRegion<T>` defined once in `backend-local.md` SS3.2; reused by `backend-tcp.md` SS7.1 — no duplication
- Static dispatch (`C: Communicator` generics) is non-negotiable for hot-path call sites
- `Box<dyn Communicator>` forbidden as factory return type; multi-feature builds use `CommBackend` enum
- Training loop generic: `train<C: Communicator>(comm: &C, ...)`

## Design Decisions — Backend Selection

- Two-level: Cargo feature flags (compile-time) + `COBRE_COMM_BACKEND` env var (runtime)
- `local` backend is unconditional — no feature flag, always the fallback
- Priority chain for `auto`: mpi > tcp > shm > local (only compiled-in backends)
- Python-side `auto` simplifies to: tcp if `COBRE_TCP_COORDINATOR` set, else shm (MPI never available in Python)
- `backend` parameter values (`"auto"`, `"shm"`, `"tcp"`, `"local"`) must match `COBRE_COMM_BACKEND` values from `backend-selection.md SS2.1`

## Design Decisions — Collective Protocols

- TCP coordinator pattern: rank 0 is star-topology coordinator; no peer-to-peer messaging
- TCP message framing: 4-byte u32 big-endian length + 1-byte operation tag + raw payload; 10 tags (0x01-0x0A)
- shm allreduce requires two barriers: one after population, one after rank 0 reduces (one barrier is insufficient)
- shm generation counter (`AtomicU64`) prevents ABA problem in barrier
- TCP and shm allreduce produce bit-for-bit deterministic results (fixed rank-order reduction)

## Design Decisions — Python Multi-Process Execution

- **Single-function extension**: `num_workers: int = 1` + `backend: str = "auto"` added to existing `cobre.train()` / `cobre.simulate()`; no new top-level API functions needed
- **Parent-as-orchestrator**: parent spawns, joins, and collects results; never holds a `Communicator` or participates in SDDP
- **`start_method="spawn"` required**: `"fork"` prohibited (OpenMP fork-safety); raise `CobreError(kind="IncompatibleSettings")` when `"fork"` detected with `num_workers > 1`
- **Only rank 0's result returned**: all ranks converge to identical policy; rank 0 places result on `multiprocessing.Queue`
- **Single progress callback for all workers**: events multiplexed with `ProgressEvent.worker_id` (0-based rank)
- **`T | None` for multi-process-only properties**: `workers` and `worker_id` return `None` for single-process runs, not empty/default
- **`WorkerError` on first detected failure**: parent terminates remaining workers, joins all with timeout, reports `WorkerError.rank / .exit_code / .inner`
- **Future-capability note pattern**: state current mode as default, cross-reference full spec, state deferral condition — 5-15 lines max; no schema/dependency changes for deferred features

## Error Type Architecture

- `CommError`: collective operation failures (`communicator-trait.md` SS1.4, extended SS4.6)
- `BackendError`: factory/selection failures (`backend-selection.md` SS6.2)
- Python hierarchy: `CobreError > ValidationError | SolverError | IOError | WorkerError`
- `WorkerError.inner`: original `CobreError` from worker, or `None` if crashed at OS level

## Key Files (Epics 01-04)

- `src/specs/hpc/communicator-trait.md` — `Communicator` + `SharedMemoryProvider` traits
- `src/specs/hpc/backend-selection.md` — Two-level selection, feature matrix, factory, structured error output
- `src/specs/hpc/backend-{ferrompi,local,tcp,shm}.md` — Four backend implementations
- `src/specs/interfaces/python-bindings.md` — Extended with SS1.2a, SS2.1a/b, SS3.2a, SS6.1a, SS7.1-SS7.5 for multi-process
- `src/specs/interfaces/mcp-server.md` — SS1.1a future multi-process capability note added

## Handoff Points for Epic 05 (Testing and Determinism Verification)

- Test the full Python `num_workers > 1` lifecycle end-to-end: spawn, communicator create, result collect, `WorkerError` on failure — this tests the Python orchestration layer, not just the Rust protocols
- Negative test: `start_method="fork"` + `num_workers=2` must raise `CobreError(kind="IncompatibleSettings")`
- Negative test: worker raises `CobreError` → `WorkerError.inner` populated; worker crashes at OS level → `inner` is `None`; remaining workers terminated, not left as zombies
- Determinism tests: use `cobre.train(num_workers=N, backend="shm")` — not manual per-rank env var invocations — the library's auto-generation is the surface under test
- `ProgressEvent.worker_id` multiplexing: with `num_workers=2`, verify both `worker_id=0` and `worker_id=1` events arrive; same-worker events arrive in iteration order
- TCP auto-detection: `COBRE_TCP_COORDINATOR=127.0.0.1:<port>` + `backend="auto"` + `num_workers=2` selects TCP (verify via `WorkerInfo.backend`)
- Carry forward: identity/no-op in local (`backend-local.md §2.2`), rank-ordered allgatherv in TCP/shm, two-barrier shm allreduce (`backend-shm.md §3.2`), `COBRE_TCP_TIMEOUT_SECS=2` for crash-detection tests
