# Accumulated Learnings: Through Epic 05 — Testing and Determinism Verification (FINAL)

**Plan**: communication-backend-abstraction
**Through epic**: epic-05-testing-determinism-spec
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
- Error mapping tables: `| Source Error | CommError Variant |` with full variant struct literal; `mpi_error_code: 0` for non-MPI backends
- Execution mode table: `| Execution Mode | Supported | Thread Count | GIL State During Computation | Use Case |`
- Conformance test table: `| Test Name | Ranks | Input Scenario | Expected Observable Behavior |` — no executable code, requirements only
- Determinism test matrix: `| Test ID | Backend | Ranks | Threads/Rank | Reference | Purpose |` + separate comparison-mode table per quantity

## Design Decisions — Trait and Dispatch Architecture

- `Communicator` and `SharedMemoryProvider` are separate traits; never merge (different lifetime semantics)
- `HeapRegion<T>` defined once in `backend-local.md §3.2`; reused by `backend-tcp.md §7.1` — no duplication
- Static dispatch (`C: Communicator` generics) is non-negotiable for hot-path call sites
- `Box<dyn Communicator>` forbidden as factory return type; multi-feature builds use `CommBackend` enum
- Training loop generic: `train<C: Communicator>(comm: &C, ...)`
- `split_local()` returns `Box<dyn Communicator>` — the one sanctioned dynamic dispatch use (initialization-only)

## Design Decisions — Backend Selection

- Two-level: Cargo feature flags (compile-time) + `COBRE_COMM_BACKEND` env var (runtime)
- `local` backend is unconditional — no feature flag, always the fallback
- Priority chain for `auto`: mpi > tcp > shm > local (only compiled-in backends)
- Python-side `auto`: tcp if `COBRE_TCP_COORDINATOR` set, else shm (MPI never available from Python)
- `backend` parameter values (`"auto"`, `"shm"`, `"tcp"`, `"local"`) must match `COBRE_COMM_BACKEND` values

## Design Decisions — Collective Protocols

- TCP coordinator pattern: rank 0 is star-topology coordinator; no peer-to-peer messaging
- TCP message framing: 4-byte u32 big-endian length + 1-byte operation tag + raw payload; 10 tags (0x01–0x0A)
- shm allreduce requires two barriers: one after population, one after rank 0 reduces (one barrier is insufficient)
- shm generation counter (`AtomicU64`) prevents ABA problem in barrier
- TCP and shm allreduce produce bit-for-bit deterministic results (fixed rank-order reduction)
- ferrompi allreduce is non-deterministic across MPI libraries and rank counts (implementation-defined tree shape)

## Design Decisions — Python Multi-Process Execution

- **Single-function extension**: `num_workers: int = 1` + `backend: str = "auto"` added to `cobre.train()` / `cobre.simulate()`
- **Parent-as-orchestrator**: parent spawns, joins, collects; never holds a `Communicator` or participates in SDDP
- **`start_method="spawn"` required**: `"fork"` prohibited; raise `CobreError(kind="IncompatibleSettings")` when detected
- **Only rank 0's result returned**: all ranks converge identically; rank 0 places result on `multiprocessing.Queue`
- **Single progress callback for all workers**: events multiplexed with `ProgressEvent.worker_id` (0-based rank)
- **`T | None` for multi-process-only properties**: `workers` and `worker_id` return `None` for single-process runs
- **`WorkerError` on first detected failure**: parent terminates remaining workers, reports `WorkerError.rank / .exit_code / .inner`

## Design Decisions — Testing Specification

- **Testing spec defines requirements, not code**: conformance tables describe what to test (scenario, postcondition), not how to implement the test (`assert_eq!` and similar constructs are forbidden in spec documents)
- **Interchangeability vs. determinism are distinct properties**: interchangeability = different backends produce same results; determinism = same backend produces same results across different parallelism configurations
- **D10 (run-twice ferrompi)** is the critical MPI library determinism test: same config run twice must be bit-for-bit identical, even if MPI reduces in an implementation-defined tree
- **Upper bound tolerance is backend-dependent**: TCP and shm produce bit-for-bit identical upper bounds (fixed reduction order); ferrompi upper bound vs. local is unconstrained (different tree shape)
- **Reference test case defined by properties, not dataset**: 2–3 stages, 2 hydro plants, 10 forward passes, 5 iterations, < 5 seconds single-core — enables programmatic generation without pinning to a specific file

## Error Type Architecture

- `CommError`: collective operation failures (`communicator-trait.md §1.4`, extended `§4.6`)
- `BackendError`: factory/selection failures (`backend-selection.md §6.2`)
- Python hierarchy: `CobreError > ValidationError | SolverError | IOError | WorkerError`
- `WorkerError.inner`: original `CobreError` from worker, or `None` if crashed at OS level
- `CommError::AllocationFailed` applies to true shared memory backends (ferrompi, shm); HeapFallback backends (local, TCP) follow Rust OOM abort semantics

## Key Files (All 5 Epics)

- `src/specs/hpc/communicator-trait.md` — `Communicator` + `SharedMemoryProvider` traits
- `src/specs/hpc/backend-selection.md` — Two-level selection, feature matrix, factory, structured error output
- `src/specs/hpc/backend-{ferrompi,local,tcp,shm}.md` — Four backend implementations
- `src/specs/interfaces/python-bindings.md` — Extended with SS1.2a, SS2.1a/b, SS2.7, SS2.9, SS3.2a, SS6.1a, SS7.1–SS7.5
- `src/specs/interfaces/mcp-server.md` — SS1.1a future multi-process capability note
- `src/specs/hpc/backend-testing.md` — Full testing specification: §1 conformance, §2 interchangeability, §3 performance, §4 determinism
- `src/specs/cross-reference-index.md` — Updated through Epic 03; 60 rows total, `cobre-comm` reading list added
- `src/SUMMARY.md` — Updated through Epic 03; 6 new HPC spec pages and `cobre-comm` crate entry added
- `src/crates/comm.md` — Crate spec: architecture, dependency graph, public API, feature matrix, migration path
