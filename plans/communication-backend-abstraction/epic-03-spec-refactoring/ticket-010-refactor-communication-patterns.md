# ticket-010 Refactor communication-patterns.md for Trait References

## Context

### Background

Epics 01 and 02 established the `Communicator` trait with method contracts for `allgatherv`, `allreduce`, `broadcast`, and `barrier` (in `communicator-trait.md`), and the `SharedMemoryProvider` trait with `SharedRegion<T>` (in the same file SS4). The existing `communication-patterns.md` describes SDDP communication mechanics using ferrompi API signatures. This ticket updates the API references to use trait method signatures while preserving the communication volume analysis, determinism guarantees, and performance analysis that are backend-independent.

### Relation to Epic

This ticket is the second refactoring target in Epic 03. It runs in parallel with ticket-009 (no dependency between them). Ticket-011 depends on both 009 and 010 being complete. The communication-patterns spec is referenced by synchronization.md, work-distribution.md, and shared-memory-aggregation.md -- all of which are modified in ticket-011.

### Current State

`src/specs/hpc/communication-patterns.md` (198 lines) currently:

- **Purpose paragraph** (line 5): States "MPI communication patterns used by Cobre" and "All MPI operations use the ferrompi crate" -- needs generalization
- **SS1 title** (line 8): "MPI Operations" -- needs generalization to "Collective Operations"
- **SS1.1 table** (lines 13-17): Operations summary with `ferrompi API` column showing `comm.allgatherv(...)`, `comm.allreduce(...)`, `comm.bcast(...)`, `comm.barrier()` -- needs to reference `Communicator` trait methods
- **SS4** (lines 112-139): "Persistent Collectives" -- this is MPI 4.0 specific optimization. Needs reframing as ferrompi-backend-specific optimization
- **SS5** (lines 141-165): "Intra-Node Shared Memory" with `SharedWindow<T>` API table -- needs generalization to `SharedMemoryProvider` and `SharedRegion<T>`
- **SS6** (lines 167-182): "Deterministic Communication" -- backend-independent invariant, but references "MPI collective operations"
- **Cross-References** (lines 184-198): Missing references to new spec files

## Specification

### Requirements

1. Generalize the Purpose paragraph to describe communication patterns through the `Communicator` trait
2. Rename SS1 from "MPI Operations" to "Collective Operations" and update the table to reference `Communicator` trait methods
3. SS2 (Data Payloads) and SS3 (Communication Volume Analysis) are backend-independent -- changes are limited to replacing "MPI" terminology with "collective" terminology where it appears in section titles or prose
4. Reframe SS4 (Persistent Collectives) as a ferrompi-backend optimization, with a cross-reference to `backend-ferrompi.md SS1` where persistent collectives are documented
5. Generalize SS5 to reference `SharedMemoryProvider` and `SharedRegion<T>` instead of ferrompi's `SharedWindow<T>`
6. Generalize SS6 determinism prose to reference the `Communicator` trait's determinism contract rather than MPI-specific guarantees
7. Add cross-references to new spec files

### Key Design Decisions

- The SS1.1 operations summary table should show **trait method signatures only** (not both trait and ferrompi). The ferrompi API details are documented in `backend-ferrompi.md SS1`. This avoids duplication.
- SS3 (Communication Volume Analysis) is entirely backend-independent because data volumes depend on SDDP problem parameters, not transport mechanism. Only the SS3.2 bandwidth analysis needs a note that the numbers apply to any backend achieving the stated bandwidth.
- SS4 (Persistent Collectives) remains in communication-patterns.md because it describes an optimization opportunity relevant to understanding the communication design. However, it must be reframed as ferrompi-specific.
- SS5.1 table should reference `SharedMemoryProvider` trait methods, not ferrompi-specific API.

### Error Handling

N/A -- documentation spec modification.

## Acceptance Criteria

- [ ] Given the Purpose paragraph, when read, then it describes "communication patterns used by Cobre through the `Communicator` trait" rather than "MPI communication patterns" and "ferrompi crate"
- [ ] Given SS1, when read, then the section title is "Collective Operations" (not "MPI Operations") and the SS1.1 table's API column shows `Communicator` trait method signatures (`comm.allgatherv(...)`, `comm.allreduce(...)`, `comm.broadcast(...)`, `comm.barrier()`) with a cross-reference to `communicator-trait.md SS2`
- [ ] Given SS1.1, when read, then the initialization collectives table also uses trait method names, and a note clarifies that `comm` is `&C where C: Communicator`
- [ ] Given SS1.2, when read, then "No Point-to-Point Messaging" retains its content but replaces "MPI" references with "collective" references where appropriate
- [ ] Given SS2 and SS3, when read, then they are substantively unchanged except that "MPI_Allgatherv" references become "`allgatherv`" and "MPI_Allreduce" references become "`allreduce`" -- the volume analysis numbers and bandwidth calculations are untouched
- [ ] Given SS4, when read, then it is framed as "Ferrompi Backend: Persistent Collectives" with an opening sentence noting this optimization is specific to the ferrompi backend and a cross-reference to `backend-ferrompi.md`
- [ ] Given SS5, when read, then `SharedWindow<T>` is replaced with `SharedRegion<T>` (citing `communicator-trait.md SS4.2`), `SharedWindow::new(comm, count)` is replaced with `create_shared_region(count)`, `comm.split_shared_memory()` is replaced with `split_local()`, and `window.fence()` is replaced with `region.fence()`
- [ ] Given SS6, when read, then determinism is described as a property of the `Communicator` trait contract (citing `communicator-trait.md SS2.1` for rank-ordered receives) rather than as an MPI-specific property
- [ ] Given the Cross-References section, when read, then it includes links to `communicator-trait.md`, `backend-ferrompi.md`, `backend-selection.md`, and `backend-local.md`
- [ ] Given the complete modified file, when `mdbook build` is run, then it succeeds with no broken links

## Implementation Guide

### Suggested Approach

Execute the following modifications in order:

**Step 1 -- Purpose paragraph (line 5):**

Replace:

> "This spec defines the MPI communication patterns used by Cobre during SDDP training: the collective operations, their data payloads, wire formats, communication volume analysis, and optimization opportunities. All MPI operations use the ferrompi crate -- no raw C FFI for MPI."

With:

> "This spec defines the communication patterns used by Cobre during SDDP training through the `Communicator` trait ([Communicator Trait SS1](./communicator-trait.md)): the collective operations, their data payloads, wire formats, communication volume analysis, and optimization opportunities. Communication is performed through a pluggable backend selected at compile time (see [Backend Selection](./backend-selection.md)) -- the SDDP training loop is generic over `C: Communicator` and never calls backend-specific APIs directly."

Update the second sentence to reference trait-level contracts.

**Step 2 -- SS1 section title and preamble (line 8):**

Rename "## 1. MPI Operations" to "## 1. Collective Operations".

Update the SS1.1 preamble: Replace "Cobre uses exactly three MPI collective operations" with "Cobre uses exactly three collective operations through the `Communicator` trait". Replace "All use ferrompi's safe, generic API with `Communicator` handles that are `Send + Sync`" with "All operations are invoked through `comm: &C` where `C: Communicator` (see [Communicator Trait SS3](./communicator-trait.md) for generic parameterization). The communicator is `Send + Sync` to support hybrid communication+OpenMP execution."

**Step 3 -- SS1.1 operations summary tables (lines 13-24):**

Replace the `ferrompi API` column header with `Communicator Trait Method`. Update signatures:

| Operation    | Communicator Trait Method                             | When                    | Data                          | Frequency                |
| ------------ | ----------------------------------------------------- | ----------------------- | ----------------------------- | ------------------------ |
| `allgatherv` | `comm.allgatherv(&send, &mut recv, &counts, &displs)` | Forward -> backward     | Visited states (trial points) | Once per iteration       |
| `allgatherv` | `comm.allgatherv(&send, &mut recv, &counts, &displs)` | Backward stage boundary | New cuts at stage $t$         | Once per stage ($T - 1$) |
| `allreduce`  | `comm.allreduce(&send, &mut recv, ReduceOp::Sum)`     | Post-forward            | Convergence statistics        | Once per iteration       |

For the initialization table:

| Operation   | Communicator Trait Method        | When       | Data                     |
| ----------- | -------------------------------- | ---------- | ------------------------ |
| `broadcast` | `comm.broadcast(&mut buf, root)` | Startup    | Configuration, case data |
| `barrier`   | `comm.barrier()`                 | Checkpoint | Synchronization only     |

Add a note: "For method contracts (preconditions, postconditions, error semantics), see [Communicator Trait SS2](./communicator-trait.md)."

**Step 4 -- SS2 Data Payloads (lines 32-78):**

Replace occurrences of `MPI_Allgatherv` with `allgatherv` and `MPI_Allreduce` with `allreduce` in the prose. The data payload tables, sizes, and calculations remain unchanged. Specifically:

- SS2.1: "each rank contributes its visited states to `allgatherv`" (was "MPI_Allgatherv")
- SS2.2: "ranks exchange cuts via `allgatherv`" (was "MPI_Allgatherv")
- SS2.3: "The `allreduce` aggregates 4 scalars using `ReduceOp::Sum`" (was "MPI_Allreduce" and "Op::Sum")
- SS2.3 table: Replace `MPI_MIN` with `ReduceOp::Min`, `MPI_SUM` with `ReduceOp::Sum`
- SS2.3 Note: Replace "If ferrompi does not support mixed reduction operations in a single `allreduce`" with "Because the `Communicator` trait's `allreduce` accepts a single `ReduceOp` per call"

**Step 5 -- SS3 Communication Volume Analysis (lines 80-110):**

Replace `MPI_Allgatherv` and `MPI_Allreduce` with `allgatherv` and `allreduce`. Update the SS3.1 table headers similarly. The bandwidth analysis numbers in SS3.2 are transport-level and remain unchanged. Add a note at the end of SS3.2: "These bandwidth estimates assume direct network transfer (MPI or TCP). The shm backend uses shared memory buffers instead of network I/O, with effectively zero transfer latency for intra-node communication. See [Shm Backend SS3](./backend-shm.md)."

**Step 6 -- SS4 Persistent Collectives (lines 112-139):**

Rename from "## 4. Persistent Collectives" to "## 4. Persistent Collectives (Ferrompi Backend)".

Add opening paragraph: "This section describes an optimization specific to the **ferrompi backend** (`FerrompiBackend`). MPI 4.0 persistent collectives allow pre-negotiating communication patterns at initialization and reusing them across iterations. For the complete ferrompi backend specification, see [Ferrompi Backend](./backend-ferrompi.md). Other backends use their own optimization strategies: the TCP backend uses persistent socket connections ([TCP Backend SS2](./backend-tcp.md)); the shm backend uses persistent shared memory segments ([Shm Backend SS1](./backend-shm.md))."

In the SS4.1 table, change the `ferrompi support` row label to `ferrompi API` (it already says the right thing).

Leave SS4.2 and SS4.3 unchanged -- they describe the applicability to SDDP operations and design decision, which remain valid.

**Step 7 -- SS5 Intra-Node Shared Memory (lines 141-165):**

Rename SS5.1 from "SharedWindow\<T\>" to "SharedRegion\<T\>".

Replace the opening sentence: "The `SharedMemoryProvider` trait ([Communicator Trait SS4](./communicator-trait.md)) enables ranks on the same physical node to share memory regions without replication. The concrete region type (`SharedRegion<T>`) is backend-specific: `FerrompiRegion<T>` for MPI windows, `ShmRegion<T>` for POSIX shared memory, or `HeapRegion<T>` for the heap fallback (local and TCP backends). See [Communicator Trait SS4.2](./communicator-trait.md) for the `SharedRegion<T>` trait definition."

Update the SS5.1 capability table:

| Capability            | Trait Method                           | Use Case                                          |
| --------------------- | -------------------------------------- | ------------------------------------------------- |
| Region creation       | `provider.create_shared_region(count)` | Allocate shared region on intra-node communicator |
| Intra-node grouping   | `provider.split_local()`               | Identify co-located ranks                         |
| Read access           | `region.as_slice()`                    | Zero-copy reads from shared region                |
| Write synchronization | `region.fence()`                       | Ensure visibility of writes across ranks          |

Leave SS5.2 (Shared Data Candidates) unchanged except replacing `SharedWindow<T>` in the Rationale column with `SharedRegion<T>` and the design point note: replace "SharedWindow<T>" with "SharedRegion<T>".

**Step 8 -- SS6 Deterministic Communication (lines 167-182):**

Replace "All MPI collective operations" with "All collective operations through the `Communicator` trait". Add: "The rank-ordered receive semantics are a formal postcondition of `allgatherv` (see [Communicator Trait SS2.1](./communicator-trait.md)) that all backends must satisfy."

In SS6.2, replace "MPI_Allreduce" with "allreduce" and "Op::Sum" with "ReduceOp::Sum". Add: "Non-MPI backends (TCP, shm) produce deterministic reduction results because they use a fixed coordinator/rank-0 reduction order -- see [TCP Backend SS3.2](./backend-tcp.md) and [Shm Backend SS3.2](./backend-shm.md)."

**Step 9 -- Cross-References (lines 184-198):**

Add the following entries:

- `[Communicator Trait SS1-SS3](./communicator-trait.md) -- Communicator trait definition, method contracts, generic parameterization`
- `[Communicator Trait SS4](./communicator-trait.md) -- SharedMemoryProvider trait, SharedRegion<T> type`
- `[Backend Selection](./backend-selection.md) -- Feature flags, runtime selection, factory pattern`
- `[Ferrompi Backend](./backend-ferrompi.md) -- FerrompiBackend: MPI delegation, persistent collectives, FerrompiRegion<T>`
- `[TCP Backend](./backend-tcp.md) -- TcpBackend: coordinator pattern, message framing, deterministic reductions`
- `[Shm Backend](./backend-shm.md) -- ShmBackend: shared buffer protocols, atomic barriers, ShmRegion<T>`
- `[Local Backend](./backend-local.md) -- LocalBackend: identity/no-op operations, HeapRegion<T>`

### Key Files to Modify

- `src/specs/hpc/communication-patterns.md` (single file)

### Patterns to Follow

- Cross-reference format: `[Section Name SS#](./relative-path.md)` using SS symbol
- Every spec ends with `## Cross-References` section
- Additive refactoring: ferrompi-specific content reframed, not deleted
- Method names in backticks: `allgatherv`, `allreduce`, `broadcast`, `barrier`

### Pitfalls to Avoid

- Do NOT change the communication volume numbers in SS2 or SS3. These are backend-independent calculations based on SDDP problem parameters.
- Do NOT remove SS4 (Persistent Collectives). It remains valid as a ferrompi-specific optimization opportunity. Only reframe it.
- Do NOT change section numbers. SS1 through SS6 must retain their numbers.
- Do NOT replace `MPI_Allgatherv` or `MPI_Allreduce` in quoted mathematical contexts or in cross-references to other specs that still use MPI terminology (those will be updated in ticket-011).

## Testing Requirements

### Unit Tests

N/A -- documentation spec.

### Integration Tests

- Run `mdbook build` from the repository root after modifications. Verify zero warnings and zero broken links.
- Verify all new cross-reference links resolve to existing section anchors in the target files.

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-005 (all completed)
- **Blocks**: ticket-011 (references generalized terminology from this ticket), ticket-013 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
