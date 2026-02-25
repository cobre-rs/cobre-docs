# ticket-012 Update Crate Overview and SUMMARY.md

## Context

### Background

Epics 01 and 02 produced seven new spec files and one new crate spec file, none of which have been added to `SUMMARY.md` (the mdBook sidebar navigation) or to `overview.md` (the crate dependency graph and table). Per the learnings document, "Files added to `src/specs/hpc/` and `src/crates/` are NOT added to `SUMMARY.md` until ticket-012 (Epic 03)." This ticket fulfills that deferred obligation.

### Relation to Epic

This ticket is independent of tickets 009-011 (no shared file modifications). It can execute in parallel with them. Ticket-013 depends on this ticket because the cross-reference index must reference the same page structure as SUMMARY.md.

### Current State

**`src/crates/overview.md`** (62 lines):

- Dependency graph (lines 7-32): Shows `ferrompi (optional, MPI execution only)` at the bottom with "used by: cobre-sddp, cobre-cli" and "NOT used by: cobre-mcp, cobre-python, cobre-tui". The `cobre-comm` crate is missing entirely.
- "Key property" note (line 34): States "None of the three new crates depend on `ferrompi`." This must be updated because `cobre-comm` conditionally depends on ferrompi (via the `mpi` feature flag).
- Crate table (lines 38-49): Lists 9 crates + ferrompi. Missing `cobre-comm`.
- Design principles section (lines 56-62): May need a sentence about pluggable communication.

**`src/SUMMARY.md`** (133 lines):

- Crate Documentation section (lines 25-35): Lists crates in order. Missing `cobre-comm`.
- High-Performance Computing section (lines 104-112): Lists 7 HPC spec pages. Missing the 6 new spec pages: `communicator-trait.md`, `backend-selection.md`, `backend-ferrompi.md`, `backend-local.md`, `backend-tcp.md`, `backend-shm.md`.

## Specification

### Requirements

1. Add `cobre-comm` to the dependency graph in `overview.md`, showing it as a dependency of `cobre-sddp` (replacing the direct `ferrompi` dependency) and as an optional dependency with ferrompi gated behind the `mpi` feature
2. Add `cobre-comm` to the crate table in `overview.md` with experimental status and appropriate description
3. Update the "Key property" note to account for `cobre-comm`'s conditional `ferrompi` dependency
4. Add `cobre-comm` to the Crate Documentation section of `SUMMARY.md`
5. Add all 6 new HPC spec pages to the High-Performance Computing section of `SUMMARY.md`, grouped logically
6. Add a sentence to the design principles section about pluggable communication backends

### Key Design Decisions

- **HPC section grouping in SUMMARY.md**: The 6 new pages should be grouped under a "Communication Backends" indent level beneath the existing HPC entries. The order should be: `communicator-trait.md` first (the trait definition), then `backend-selection.md` (how backends are chosen), then the four backend specs alphabetically: `backend-ferrompi.md`, `backend-local.md`, `backend-shm.md`, `backend-tcp.md`. This matches the logical reading order: understand the trait, understand selection, then read individual backends.
- **Dependency graph update**: `cobre-comm` sits between `cobre-sddp` and `ferrompi`. The graph should show `cobre-sddp -> cobre-comm -> ferrompi (optional, mpi feature)`. The `cobre-mcp`, `cobre-python` entries should show they use `cobre-comm` (without `mpi` feature, using TCP/shm/local backends).
- **ferrompi row preservation**: `ferrompi` remains in the Related Repositories table at the bottom. It is now "used by: cobre-comm (mpi feature only)" instead of "used by: cobre-sddp, cobre-cli".

### Error Handling

N/A -- documentation spec modification.

## Acceptance Criteria

- [ ] Given `overview.md` dependency graph, when read, then `cobre-comm` appears as a dependency of `cobre-sddp`, and `ferrompi` appears as an optional dependency of `cobre-comm` (not of `cobre-sddp` directly)
- [ ] Given `overview.md` crate table, when read, then `cobre-comm` is listed with experimental status badge, linking to `./comm.md`, with description "Pluggable communication backend abstraction (Communicator trait, backend selection, four backend implementations)"
- [ ] Given `overview.md` "Key property" note, when read, then it accounts for `cobre-comm`: the three new crates (mcp, python, tui) do not depend on ferrompi directly, but `cobre-comm` has an optional `mpi` feature that gates the ferrompi dependency
- [ ] Given `overview.md` dependency graph, when read, then `cobre-mcp` and `cobre-python` show `cobre-comm` (without `mpi` feature) in their dependency list
- [ ] Given `SUMMARY.md` Crate Documentation section, when read, then `cobre-comm` appears in the list (between `cobre-cli` and `cobre-core` alphabetically, or after `cobre-cli` following the existing order)
- [ ] Given `SUMMARY.md` HPC section, when read, then all 6 new spec pages appear in a logical grouping with proper indentation: communicator-trait, backend-selection, then the four backend specs
- [ ] Given the modified `SUMMARY.md`, when `mdbook build` is run, then all 6 new HPC pages and the `cobre-comm` crate page render in the sidebar correctly with no broken links
- [ ] Given `overview.md` design principles section, when read, then it includes a sentence about pluggable communication backends following the same pattern as the existing solver pluggability sentence

## Implementation Guide

### Suggested Approach

**Step 1 -- Update `src/crates/overview.md` dependency graph (lines 7-32):**

Replace the current graph with:

```
cobre-cli
  ├── cobre-sddp
  │     ├── cobre-core
  │     ├── cobre-stochastic
  │     ├── cobre-solver
  │     └── cobre-comm
  │           └── ferrompi (optional, mpi feature only)
  ├── cobre-io
  │     └── cobre-core
  ├── cobre-tui                  [NEW]
  │     └── cobre-core           (event type definitions only)
  └── cobre-core

cobre-mcp                        [NEW, standalone server binary]
  ├── cobre-sddp
  ├── cobre-io
  ├── cobre-comm                 (tcp,shm features — no MPI dependency)
  └── cobre-core

cobre-python                     [NEW, PyO3 cdylib]
  ├── cobre-sddp
  ├── cobre-io
  ├── cobre-comm                 (tcp,shm features — no MPI dependency)
  └── cobre-core

ferrompi (optional, mpi feature of cobre-comm only)
  used by: cobre-comm (when mpi feature is enabled)
  NOT used by: cobre-mcp, cobre-python, cobre-tui, cobre-sddp (directly)
```

**Step 2 -- Update "Key property" note (line 34):**

Replace: "**Key property**: None of the three new crates depend on `ferrompi`. They share the single-process execution path through `cobre-sddp` with OpenMP parallelism only."

With: "**Key property**: The `ferrompi` dependency is encapsulated within `cobre-comm` behind the `mpi` Cargo feature flag. None of the interface crates (`cobre-mcp`, `cobre-python`, `cobre-tui`) require MPI at build or run time -- they use `cobre-comm` with TCP, shared-memory, or local backends. See [Backend Selection SS1.2](../specs/hpc/backend-selection.md) for feature flag combinations per build profile."

**Step 3 -- Add `cobre-comm` to the crate table (after line 45, between cobre-cli and the existing entries):**

Add a new row:

```markdown
| [`cobre-comm`](./comm.md) | <span class="status-experimental">experimental</span> | Pluggable communication backend abstraction (Communicator trait, SharedMemoryProvider, backend selection, four backend implementations) |
```

Place it after `cobre-cli` to maintain alphabetical order within the table.

**Step 4 -- Update design principles section (lines 56-62):**

After the existing "Solvers are pluggable" paragraph, add:

"**Communication is pluggable.** `cobre-comm` provides a `Communicator` trait abstraction with compile-time backend selection via Cargo feature flags. The production backend (ferrompi/MPI) delivers zero-cost abstraction through monomorphization. Alternative backends (TCP, shared memory, local) enable deployment without MPI infrastructure."

**Step 5 -- Update `src/SUMMARY.md` Crate Documentation section (lines 25-35):**

Add `cobre-comm` to the list. Insert after `cobre-cli`:

```markdown
- [cobre-comm](./crates/comm.md)
```

The updated section becomes:

```
- [Overview](./crates/overview.md)
- [cobre-core](./crates/core.md)
- [cobre-io](./crates/io.md)
- [cobre-stochastic](./crates/stochastic.md)
- [cobre-solver](./crates/solver.md)
- [cobre-sddp](./crates/sddp.md)
- [cobre-cli](./crates/cli.md)
- [cobre-comm](./crates/comm.md)
- [cobre-mcp](./crates/mcp.md)
- [cobre-python](./crates/python.md)
- [cobre-tui](./crates/tui.md)
- [ferrompi](./crates/ferrompi.md)
```

**Step 6 -- Update `src/SUMMARY.md` High-Performance Computing section (lines 104-112):**

Add the 6 new pages after the existing entries, grouped under a "Communication Backend Abstraction" heading. In mdBook, use indentation to create a sub-group:

```
- [High-Performance Computing](./specs/hpc.md)
  - [Work Distribution](./specs/hpc/work-distribution.md)
  - [Hybrid Parallelism](./specs/hpc/hybrid-parallelism.md)
  - [Communication Patterns](./specs/hpc/communication-patterns.md)
  - [Communicator Trait](./specs/hpc/communicator-trait.md)
  - [Backend Selection](./specs/hpc/backend-selection.md)
  - [Backend: Ferrompi (MPI)](./specs/hpc/backend-ferrompi.md)
  - [Backend: Local (No-op)](./specs/hpc/backend-local.md)
  - [Backend: Shared Memory](./specs/hpc/backend-shm.md)
  - [Backend: TCP](./specs/hpc/backend-tcp.md)
  - [Memory Architecture](./specs/hpc/memory-architecture.md)
  - [Shared Memory Aggregation](./specs/hpc/shared-memory-aggregation.md)
  - [Checkpointing](./specs/hpc/checkpointing.md)
  - [SLURM Deployment](./specs/hpc/slurm-deployment.md)
  - [Synchronization](./specs/hpc/synchronization.md)
```

The new pages are inserted after Communication Patterns (which they extend) and before Memory Architecture (which is orthogonal). This places the communication backend abstraction pages in a contiguous block.

### Key Files to Modify

- `src/crates/overview.md`
- `src/SUMMARY.md`

### Patterns to Follow

- Crate table row format matches existing rows: `| [crate-name](./file.md) | <span class="status-experimental">experimental</span> | Description |`
- SUMMARY.md indentation uses 2 spaces for sub-items
- Cross-reference format from crates to specs: `../specs/hpc/filename.md`

### Pitfalls to Avoid

- Do NOT reorder existing entries in the SUMMARY.md -- only insert new ones at appropriate positions
- Do NOT remove the `ferrompi` entry from the Related Repositories table or from the crate table -- it remains a documented external dependency
- Do NOT change the existing crate descriptions in the crate table
- Ensure the SUMMARY.md page paths are relative to `src/` (the mdBook source root), not to the file's own directory

## Testing Requirements

### Unit Tests

N/A -- documentation spec.

### Integration Tests

- Run `mdbook build` from the repository root. Verify:
  - All 6 new HPC pages appear in the sidebar under High-Performance Computing
  - The `cobre-comm` crate page appears in the sidebar under Crate Documentation
  - No broken links in the build output
- Manually verify the dependency graph in overview.md renders correctly in the browser (the code block should display as a tree)

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-004 (cobre-comm crate spec), ticket-005 through ticket-008 (all backend specs) -- all completed
- **Blocks**: ticket-013 (cross-reference index must reference same pages as SUMMARY.md)

## Effort Estimate

**Points**: 2
**Confidence**: High
