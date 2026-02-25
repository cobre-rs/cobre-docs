# Accumulated Learnings: Epic 01 — Communicator Trait and Backend Selection

**Plan**: communication-backend-abstraction
**Through epic**: epic-01-communicator-trait-spec
**Updated**: 2026-02-25

---

## Spec Document Conventions

- New spec files open with `# Title`, `## Purpose` (one paragraph citing architectural precedent), then numbered sections
- Every spec and crate file ends with a `## Cross-References` section listing all cited documents with section granularity
- Cross-reference link format: `[Section Name §N](./relative-path.md)` using the § symbol, not the word "Section"
- Crate files (`src/crates/*.md`) open with the crate name, a `<span class="status-experimental">` badge, `## Overview`, `## Key Concepts`, then numbered sections — matching `sddp.md` and `core.md` exactly
- Files added to `src/specs/hpc/` and `src/crates/` are NOT added to `SUMMARY.md` until ticket-012 (Epic 03)

## Table Formats Established

- Method contract tables: two tables per method (`| Condition | Description |`) for Preconditions and Postconditions, followed by prose for Determinism / Error semantics / Thread safety
- Feature flag matrix: `| Feature | Backend | External Dependencies | Link-Time Requirements | Binary Size Impact |`; unconditional backend row uses `_(always)_`; test/CI no-feature row uses `_(none)_`
- Build profile table: `| Build Profile | Cargo Features | Target | Rationale |`
- Per-backend env var table: `| Variable | Required | Default | Description |`; launcher-set vars use `_(set by launcher)_`; no-default cells use `_(none)_`
- Migration before/after: two-column `| Before | After |` table for dependency and signature changes

## Design Decisions — Trait Architecture

- `Communicator` and `SharedMemoryProvider` are separate traits; never merge them (different lifetime semantics: message-passing vs. persistent memory regions)
- Every backend type implements both traits; `SharedMemoryProvider` for local and tcp backends uses HeapFallback (per-process `Vec<T>`) defined in `communicator-trait.md` SS4.4
- `SharedRegion<T>` write access uses `as_mut_slice(&mut self) -> &mut [T]` (idiomatic Rust, zero-copy), not a `write(data: &[T])` copy method
- `split_local()` returns `Box<dyn Communicator>` — the one sanctioned use of dynamic dispatch, justified because it is initialization-only

## Design Decisions — Dispatch

- Static dispatch (`C: Communicator` generics) is non-negotiable for all hot-path call sites
- `Box<dyn Communicator>` is forbidden as a factory return type; multi-feature builds use a `CommBackend` enum with one match per collective call (~1 ns overhead, < 0.0001% of operation cost)
- The `local` backend's no-op collectives compile to zero instructions after inlining in single-feature builds
- `create_communicator()` returns `impl Communicator` in single-feature builds (fully monomorphized) and `CommBackend` in multi-feature builds

## Design Decisions — Backend Selection

- Two-level mechanism: Cargo feature flags (primary, compile-time) and `COBRE_COMM_BACKEND` env var (secondary, runtime)
- `local` backend is unconditional — no feature flag, always available, always the fallback
- Priority chain for `auto` mode: mpi > tcp > shm > local (only considers compiled-in backends)
- MPI launch detection probes six env vars: `PMI_RANK`, `PMI_SIZE`, `OMPI_COMM_WORLD_RANK`, `OMPI_COMM_WORLD_SIZE`, `MPI_LOCALRANKID`, `SLURM_PROCID`
- All Cobre comm env vars use `COBRE_` prefix to avoid collision with MPI launcher, OpenMP, and solver vars
- Architectural precedent for feature-flag backend selection is `solver-abstraction.md §10` — cite this in every section that follows the same pattern

## Error Type Architecture

- `CommError`: collective operation failures (used in trait method return types) — defined in `communicator-trait.md` SS1.4, extended with `AllocationFailed` in SS4.6
- `BackendError`: factory/selection failures (used in `create_communicator()` return type) — defined in `backend-selection.md` SS6.2
- Extend `CommError` via new numbered sub-sections; do not edit the original variant list retroactively

## Files Produced

- `src/specs/hpc/communicator-trait.md` — `Communicator` trait (SS1-SS3) and `SharedMemoryProvider` trait (SS4) with full method contracts and HeapFallback semantics
- `src/specs/hpc/backend-selection.md` — Two-level selection mechanism, feature matrix, factory pattern, library-mode API, structured error output
- `src/crates/comm.md` — Crate spec: architecture, dependency graph, public API surface, feature matrix, migration path from direct ferrompi usage

## Handoff Points for Epic 02

- Ferrompi backend (ticket-005): map `SharedWindow<T>` to `SharedRegion<T>` using the lifecycle model in `communicator-trait.md` SS4.2; cite the `drop` behavior table
- Local backend (ticket-006): document that all collectives compile to zero instructions, referencing `backend-selection.md` SS1.4
- TCP and shm backends (tickets 007-008): declare HeapFallback for `SharedMemoryProvider` by referencing `communicator-trait.md` SS4.4; do not re-specify its semantics
- Do not define new `CommError` variants in backend specs; reference SS1.4 and SS4.6

## Handoff Points for Epic 03

- `hybrid-parallelism.md §6` maps to backend-specific init sequences pre-documented in `backend-selection.md` SS7
- All direct ferrompi API references in existing specs should become `[Communicator Trait §N.M](./communicator-trait.md)` links
- `SUMMARY.md` update (ticket-012) must add all three files from this epic to the appropriate sidebar sections
