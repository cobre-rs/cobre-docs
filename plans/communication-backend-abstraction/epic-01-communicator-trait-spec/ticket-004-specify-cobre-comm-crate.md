# ticket-004 Specify cobre-comm Crate Architecture

## Context

### Background

The `Communicator` trait (ticket-001), `SharedMemoryProvider` trait (ticket-002), and backend selection mechanism (ticket-003) need a home in the Cobre crate graph. Currently, ferrompi is an external dependency used directly by `cobre-sddp` and `cobre-cli`. The abstraction layer should live in a dedicated `cobre-comm` crate that houses the traits, error types, backend selection logic, and feature-gated backend implementations. This keeps the communication abstraction independent of the SDDP algorithm while allowing multiple crates to depend on it.

### Relation to Epic

This is the final ticket in Epic 01. It documents where the trait and backend infrastructure lives in the crate dependency graph. The crate overview (`src/crates/overview.md`) will be updated in Epic 03 (ticket-012), but this ticket produces the crate-level spec document that defines `cobre-comm`'s responsibilities, dependencies, and public API surface.

### Current State

- `src/crates/overview.md` defines the current dependency graph with ferrompi as an optional external dependency used by `cobre-sddp` and `cobre-cli`
- No `cobre-comm` crate exists in the crate overview
- ferrompi is listed as "NOT used by: cobre-mcp, cobre-python, cobre-tui" in the overview
- `src/crates/` contains per-crate spec files (core.md, io.md, sddp.md, etc.) following a consistent format

## Specification

### Requirements

Create the file `src/crates/comm.md` containing a crate specification for `cobre-comm`. The spec must define:

1. **Crate responsibilities**: What `cobre-comm` owns vs. delegates
2. **Dependency position**: Where `cobre-comm` sits in the crate graph (between `cobre-core` and `cobre-sddp`)
3. **Public API surface**: Traits, types, and functions exported by the crate
4. **Feature flags**: Which backends are gated behind features
5. **Relationship to ferrompi**: How `cobre-comm` replaces the direct ferrompi dependency for `cobre-sddp`

### Inputs/Props

| Source Document         | Relevant Sections              | What to Extract                                      |
| ----------------------- | ------------------------------ | ---------------------------------------------------- |
| `crates/overview.md`    | Dependency graph, crate table  | Position of new crate in the graph                   |
| `crates/sddp.md`        | Full document                  | How cobre-sddp currently uses ferrompi               |
| `crates/core.md`        | Full document                  | The foundational crate that cobre-comm may depend on |
| `communicator-trait.md` | SS1-SS4 (from tickets 001-002) | The traits that cobre-comm exports                   |
| `backend-selection.md`  | SS3-SS4 (from ticket-003)      | Factory and feature flags that cobre-comm implements |

### Outputs/Behavior

A new markdown file at `src/crates/comm.md` containing:

1. **Purpose section**: One paragraph on `cobre-comm`'s role as the communication abstraction crate
2. **SS1 Crate Architecture**: Crate type (library), status, what it owns, what it delegates
3. **SS2 Dependency Graph**: Updated ASCII dependency graph showing `cobre-comm`'s position:
   ```
   cobre-sddp
     +-- cobre-comm [traits, backend selection, feature-gated backends]
     |     +-- cobre-core (error types only)
     |     +-- ferrompi (optional, feature = "ferrompi")
     +-- cobre-core
     +-- cobre-stochastic
     +-- cobre-solver
   ```
4. **SS3 Public API**: List of exported items (traits, types, functions, feature-gated modules)
5. **SS4 Feature Matrix**: Table showing which features enable which backends and their external dependencies
6. **SS5 Migration Path**: How existing code transitions from direct ferrompi usage to the `cobre-comm` abstraction

### Error Handling

Not applicable at the spec level -- error types are defined in the trait spec (ticket-001).

## Acceptance Criteria

- [ ] Given the file `src/crates/comm.md` does not exist, when the ticket is completed, then the file exists
- [ ] Given the spec exists, when reading SS1, then `cobre-comm` is described as a library crate housing communication traits, backend selection, and feature-gated backend implementations
- [ ] Given the spec exists, when reading SS2, then the dependency graph shows `cobre-comm` between `cobre-core` and `cobre-sddp`, with ferrompi as an optional dependency of `cobre-comm` (not `cobre-sddp`)
- [ ] Given the spec exists, when reading SS3, then the public API lists `Communicator`, `SharedMemoryProvider`, `SharedRegion`, `CommError`, `ReduceOp`, `CommData`, `create_communicator()`, and feature-gated backend types
- [ ] Given the spec exists, when reading SS4, then a feature matrix table shows: `local` (always on), `mpi` (optional, default for CLI/HPC), `tcp` (optional, default for Python), `shm` (optional), with their external dependencies and build profile recommendations (CLI/HPC, Python, test, dev) — consistent with solver-abstraction.md §10 compile-time selection pattern
- [ ] Given the spec exists, when reading SS5, then the migration path explains that `cobre-sddp` replaces `ferrompi` in its `Cargo.toml` with `cobre-comm`, changes function signatures from `comm: &ferrompi::Communicator` to `comm: &C` where `C: Communicator`, and each downstream crate selects its backend via feature flags (e.g., `cobre-python` enables `tcp,shm,local` but not `mpi`)
- [ ] Given the spec exists, when checking the style, then it follows the same format as existing crate specs (e.g., `crates/sddp.md`, `crates/core.md`)
- [ ] Given `mdbook build` is run, then it succeeds

## Implementation Guide

### Suggested Approach

1. Read `src/crates/sddp.md` and `src/crates/core.md` to understand the crate spec format
2. Create `src/crates/comm.md`
3. Write the Purpose section: `cobre-comm` provides the `Communicator` and `SharedMemoryProvider` traits, a backend selection factory, and feature-gated backend implementations. It decouples SDDP computation from specific communication technologies, enabling MPI, TCP, shared-memory, and single-process execution through a unified interface.
4. For SS1, use the same table format as other crate specs:
   | Attribute | Value |
   | --------- | ----- |
   | Crate type | Library |
   | Status | experimental |
   | What it owns | Communication traits, backend selection, backend implementations |
   | What it delegates | All computation to cobre-sddp; all data types to cobre-core |
5. For SS2, draw the new dependency graph showing cobre-comm's position
6. For SS3, list all public items with brief descriptions
7. For SS4, create a feature matrix table (consistent with solver-abstraction.md §10 pattern):
   | Feature | Backend | External Dependencies | Default (CLI) | Default (Python) | Default (Test) |
   | ------- | ------- | --------------------- | ------------- | ---------------- | -------------- |
   | (none) | Local | None | Always on | Always on | Always on |
   | mpi | Ferrompi | MPI runtime, ferrompi crate | Yes | No | No |
   | tcp | TCP | None (std::net or tokio) | No | Yes | No |
   | shm | Shared Memory | POSIX shm (Linux/macOS) | No | Optional | No |
   Document build profiles: CLI/HPC (`mpi,local`), Python wheel (`tcp,shm,local`), test/CI (`local`), development (`mpi,tcp,shm,local`)
8. For SS5, describe the migration from direct ferrompi usage to cobre-comm
9. Add Cross-References section

### Key Files to Modify

| File                 | Action                       |
| -------------------- | ---------------------------- |
| `src/crates/comm.md` | **CREATE** -- New crate spec |

### Patterns to Follow

- **Crate spec pattern**: Follow `src/crates/sddp.md` for the document structure (Purpose, Architecture, Dependency Graph, Public API)
- **Dependency graph pattern**: Follow `src/crates/overview.md` for the ASCII art graph format
- **Feature flag documentation**: Follow the solver crate's pattern for documenting feature-gated functionality

### Pitfalls to Avoid

- Do NOT update `src/crates/overview.md` -- ticket-012 does that
- Do NOT add the file to SUMMARY.md -- ticket-012 handles that
- Do NOT define the backends themselves -- those are Epic 02 tickets
- Do NOT make ferrompi a hard dependency of cobre-comm -- it must be feature-gated

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (trait definition), ticket-002 (SharedMemoryProvider), ticket-003 (backend selection)
- **Blocks**: ticket-012 (crate overview update)

## Effort Estimate

**Points**: 2
**Confidence**: High
