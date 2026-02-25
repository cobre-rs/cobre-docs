# ticket-003 Specify Backend Registration and Selection Mechanism

## Context

### Background

With the `Communicator` trait (ticket-001) and `SharedMemoryProvider` trait (ticket-002) defined, a mechanism is needed to select which backend implementation to use. The current system has a binary choice embedded in the initialization sequence: if MPI is detected, use ferrompi; otherwise, single-process mode. The new system must support four backends (ferrompi, local, tcp, shm) with a two-level selection mechanism: **compile-time feature flags** (primary, consistent with solver-abstraction.md §10) control which backends are available in the binary, and **optional runtime selection** (secondary, via environment variable) picks among compiled-in backends when multiple are present.

### Relation to Epic

This is the third ticket in Epic 01. It defines how the application selects a backend at startup, complementing the trait definitions from tickets 001 and 002. The backend selection mechanism is referenced by all backend implementation specs (Epic 02) and by the initialization sequence refactoring (Epic 03).

### Current State

- `src/specs/hpc/hybrid-parallelism.md` SS6 defines the initialization sequence with MPI-first ordering
- `src/specs/hpc/hybrid-parallelism.md` SS6a defines the alternative initialization for single-process mode
- `src/specs/hpc/hybrid-parallelism.md` SS4.1 defines resource allocations read from environment variables (MPI rank count from launcher, threads from `OMP_NUM_THREADS`)
- `src/specs/architecture/cli-and-lifecycle.md` SS5 defines the startup phase where parallel environment is initialized
- No backend selection mechanism exists -- the choice is implicit in whether MPI is available

## Specification

### Requirements

Create the file `src/specs/hpc/backend-selection.md` containing a complete specification for the backend selection and instantiation mechanism. The spec must cover:

1. **Compile-time feature flags** (primary mechanism): Cargo feature flags that control which backends are compiled into the binary, following the same pattern as solver-abstraction.md §10. Feature flags determine link-time dependencies (e.g., `mpi` pulls in ferrompi, `tcp` needs no external deps), enable dead code elimination, and allow monomorphization of the training loop for the selected backend.
2. **Build profiles**: Recommended feature combinations per target: CLI/HPC (`mpi,local`), Python wheel (`tcp,shm,local`), test/CI (`local`), development (`mpi,tcp,shm,local`).
3. **Runtime backend selection** (secondary mechanism): When multiple backends are compiled in, an optional `COBRE_COMM_BACKEND` environment variable selects among them, with a priority-based default: `mpi` > `tcp` > `shm` > `local`.
4. **Auto-detection logic**: How the default priority selects a backend based on compiled-in features and runtime environment (e.g., MPI launch detection via `PMI_RANK` / `OMPI_COMM_WORLD_RANK`).
5. **Backend-specific configuration**: Additional environment variables per backend (e.g., `COBRE_TCP_COORDINATOR` for the tcp backend)
6. **Factory pattern**: How the selected backend is instantiated and returned as a concrete type (static dispatch via `cfg`-gated match arms, not trait objects)
7. **Programmatic API**: How library-mode callers (cobre-python, cobre-mcp) select a backend via API rather than environment variables
8. **Validation and error reporting**: What happens when an invalid or unavailable backend is requested

### Inputs/Props

| Source Document         | Relevant Sections                    | What to Extract                                      |
| ----------------------- | ------------------------------------ | ---------------------------------------------------- |
| `hybrid-parallelism.md` | SS4.1 (resource allocations)         | Existing env var pattern for parallel config         |
| `hybrid-parallelism.md` | SS6, SS6a (init sequences)           | How current init differs between MPI and single-proc |
| `cli-and-lifecycle.md`  | SS5 (startup phase)                  | Where in the lifecycle backend selection occurs      |
| `design-principles.md`  | SS5 (Rust strategy)                  | Feature flags, compile-time selection patterns       |
| `solver-abstraction.md` | SS10 (compile-time solver selection) | How the solver uses feature flags for backend choice |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/backend-selection.md` containing:

1. **Purpose section**: One paragraph on the role of backend selection as a two-level mechanism (compile-time + runtime), drawing explicit parallel to solver-abstraction.md §10
2. **SS1 Compile-Time Feature Flags**: Cargo features (`mpi`, `tcp`, `shm`) that control which backends are compiled in, with `local` always available. Feature flag matrix showing dependencies, binary size impact, and link-time requirements. Build profile recommendations per target (CLI/HPC, Python, test, dev).
3. **SS2 Runtime Backend Selection**: `COBRE_COMM_BACKEND` environment variable for selecting among compiled-in backends. Priority-based default (`mpi` > `tcp` > `shm` > `local`). Auto-detection algorithm for MPI launch environment.
4. **SS3 Backend Configuration**: Per-backend environment variables and configuration parameters
5. **SS4 Factory Pattern**: How `create_communicator()` uses `cfg`-gated match arms to return a concrete backend type. Show how single-feature builds enable full monomorphization (compiler eliminates all branches). Show how multi-feature builds use an enum dispatch with one branch point at initialization.
6. **SS5 Library-Mode API**: Programmatic backend selection for embedded callers (cobre-python, cobre-mcp)
7. **SS6 Error Handling**: What happens on invalid selection, feature not compiled, or initialization failure

### Error Handling

- Requesting a backend not compiled in (e.g., `COBRE_COMM_BACKEND=mpi` when the `mpi` feature is not enabled) produces a **compile-time error** if only one backend is available, or a **clear runtime error** listing available backends if multiple are compiled in
- Default priority chain uses only compiled-in backends: try mpi (if feature enabled and MPI environment detected) → tcp (if feature enabled and `COBRE_TCP_COORDINATOR` set) → shm (if feature enabled and `COBRE_SHM_NAME` set) → local (always available)
- Backend initialization failures (e.g., MPI runtime not found, TCP coordinator unreachable) produce structured errors per the error kind registry (structured-output.md SS2)

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/backend-selection.md` does not exist, when the ticket is completed, then the file exists with complete content
- [ ] Given the spec exists, when reading SS1, then Cargo feature flags are documented as the **primary** backend selection mechanism, with `local` always available, `mpi` as default for CLI builds, and `tcp`/`shm` as optional. A feature matrix table shows each flag's external dependencies, link-time requirements, and recommended build profiles (CLI/HPC, Python, test, dev).
- [ ] Given the spec exists, when reading SS1, then the spec draws an explicit parallel to solver-abstraction.md §10 as the architectural precedent for compile-time backend selection
- [ ] Given the spec exists, when reading SS2, then the `COBRE_COMM_BACKEND` environment variable is documented as a **secondary** mechanism for selecting among compiled-in backends, with priority-based default (`mpi` > `tcp` > `shm` > `local`) and MPI launch auto-detection
- [ ] Given the spec exists, when reading SS3, then per-backend configuration environment variables are documented in a table (e.g., `COBRE_TCP_COORDINATOR`, `COBRE_TCP_PORT`, `COBRE_SHM_NAME`)
- [ ] Given the spec exists, when reading SS4, then a `create_communicator()` factory function is shown using `cfg`-gated match arms. The spec explains how single-feature builds enable full monomorphization, while multi-feature builds use enum dispatch with one branch at initialization.
- [ ] Given the spec exists, when reading SS5, then the programmatic API is documented for library-mode callers (cobre-python, cobre-mcp) with code examples
- [ ] Given the spec exists, when reading SS6, then error conditions are specified: compile-time errors for impossible configurations, runtime errors for missing backends in multi-feature builds
- [ ] Given the spec exists, when checking cross-references, then it references hybrid-parallelism.md SS4.1, SS6; cli-and-lifecycle.md SS5; solver-abstraction.md SS10; communicator-trait.md SS1

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-selection.md`
2. Write the Purpose section — emphasize the two-level selection model: compile-time feature flags (primary) + runtime env var (secondary). Draw explicit parallel to solver-abstraction.md §10.
3. For SS1 (Compile-Time Feature Flags), define the feature flag matrix:
   - `mpi` feature: Enables ferrompi backend. Depends on MPI development libraries. Default for `cobre-cli` (HPC builds).
   - `tcp` feature: Enables TCP backend. No external dependencies (uses `std::net` or tokio). Default for `cobre-python` wheel builds.
   - `shm` feature: Enables shared-memory backend. Requires POSIX shared memory APIs (Linux/macOS). Optional.
   - `local` is always available (no feature flag needed, no dependencies).
   - Show a feature matrix table:
     | Feature | Backend | External Deps | Binary Impact | Default (CLI) | Default (Python) | Default (Test) |
   - Define build profiles with recommended feature combinations:
     - CLI/HPC: `--features mpi,local` (production cluster deployment)
     - Python wheel: `--features tcp,shm,local` (no MPI required on user machine)
     - Test/CI: `--features local` (minimal, fast, deterministic)
     - Development: `--features mpi,tcp,shm,local` (all backends for testing)
   - Explain how single-feature builds achieve full monomorphization (the compiler knows the concrete `Communicator` type, enabling inlining across the abstraction boundary — identical to solver §10's rationale)
4. For SS2 (Runtime Backend Selection), define the secondary mechanism:
   - `COBRE_COMM_BACKEND` env var with values: `auto` (default), `mpi`, `local`, `tcp`, `shm`
   - `auto` priority chain (only considers compiled-in backends): mpi (if feature enabled + MPI launch detected) → tcp (if feature enabled + `COBRE_TCP_COORDINATOR` set) → shm (if feature enabled + `COBRE_SHM_NAME` set) → local
   - MPI launch detection: check for `PMI_RANK` or `OMPI_COMM_WORLD_RANK` env vars
   - Present as a decision flowchart
5. For SS3, document per-backend configuration env vars:
   - mpi: No additional config (reads from MPI environment)
   - local: No additional config
   - tcp: `COBRE_TCP_COORDINATOR` (host:port), `COBRE_TCP_RANK`, `COBRE_TCP_SIZE`
   - shm: `COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE`
6. For SS4, show the factory pattern using `cfg`-gated match arms:
   - Single-feature build: `create_communicator()` returns the one concrete type directly (zero-cost, fully monomorphized)
   - Multi-feature build: `create_communicator()` returns a `CommBackend` enum with variants for each compiled-in backend. The enum dispatches at one point (initialization); the training loop is generic over `C: Communicator`.
   - Reference solver-abstraction.md §10 as the architectural precedent
7. For SS5, show how cobre-python and cobre-mcp call the factory directly with a specific backend kind, bypassing env var detection
8. For SS6, define error handling:
   - Compile-time: requesting `COBRE_COMM_BACKEND=mpi` when `mpi` feature is not compiled produces a clear error listing available backends
   - Runtime: initialization failures (MPI not found, TCP unreachable) produce structured errors per error kind registry
9. Add Cross-References section

### Key Files to Modify

| File                                 | Action                          |
| ------------------------------------ | ------------------------------- |
| `src/specs/hpc/backend-selection.md` | **CREATE** -- New spec document |

### Patterns to Follow

- **Environment variable pattern**: Follow hybrid-parallelism.md SS4.1 table format for env var documentation
- **Feature flag pattern**: Follow solver-abstraction.md SS10 for compile-time backend selection
- **Factory pattern**: Follow the solver crate's pattern for creating backend instances
- **Error reporting pattern**: Follow structured-output.md SS2 for error kind definitions

### Pitfalls to Avoid

- Do NOT make `local` conditional on a feature flag -- it must always be available as the fallback
- Do NOT use `Box<dyn Communicator>` for the factory return type -- static dispatch is a design decision for zero-cost abstraction
- Do NOT define the backends themselves -- those are Epic 02 tickets
- Do NOT add SUMMARY.md entries -- ticket-012 handles that
- Do NOT over-specify the TCP rendezvous protocol -- the backend spec (ticket-007) handles protocol details

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (trait must exist to reference in the factory return type)
- **Blocks**: ticket-005, ticket-006, ticket-007, ticket-008, ticket-009

## Effort Estimate

**Points**: 3
**Confidence**: High
