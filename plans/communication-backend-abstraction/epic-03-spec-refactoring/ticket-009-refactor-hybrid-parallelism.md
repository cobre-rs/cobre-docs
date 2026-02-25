# ticket-009 Refactor hybrid-parallelism.md for Backend Abstraction

## Context

### Background

Epics 01 and 02 produced seven new specification files defining the `Communicator` trait, `SharedMemoryProvider` trait, backend selection mechanism, and four backend implementations (ferrompi, local, TCP, shared-memory). The existing `hybrid-parallelism.md` was written before this abstraction existed and hardcodes ferrompi as the sole communication technology. This ticket generalizes the spec to present the trait-based architecture while preserving ferrompi-specific detail as one backend among several.

### Relation to Epic

Epic 03 refactors all existing specs to reference the new communication abstraction layer. This ticket is the first and most impactful refactoring target because `hybrid-parallelism.md` defines the overall parallelization architecture and initialization sequence. Tickets 010 and 011 depend on the generalized terminology and cross-references established here.

### Current State

`src/specs/hpc/hybrid-parallelism.md` (291 lines) currently:

- **Purpose paragraph** (line 5): States "ferrompi as the backbone for inter-node communication" -- needs generalization to "a pluggable communication backend"
- **SS1 table** (lines 11-16): Four rows with ferrompi-specific entries for Inter-node, Intra-node shared memory, and Topology detection -- needs generalization to trait-based descriptions
- **SS1.0a** (lines 18-28): Describes single-process mode in terms of "MPI is not initialized" and "SharedWindow\<T\> is not used" -- needs rephrasing in terms of `LocalBackend` and `SharedMemoryProvider` HeapFallback
- **SS1.2** (lines 42-52): "ferrompi Capabilities Used" table -- this is ferrompi-specific detail that remains valid but needs reframing
- **SS6** (lines 197-215): Initialization sequence Steps 1-3 are ferrompi-specific (MPI init, topology, shared memory communicator) -- needs generalization to `create_communicator()` factory
- **SS6a** (lines 217-231): Alternative init for single-process mode -- needs rephrasing in terms of `LocalBackend`
- **Cross-References** (lines 273-291): Missing references to new spec files

## Specification

### Requirements

1. Generalize the Purpose paragraph to describe a pluggable communication backend selected at compile time via Cargo feature flags
2. Generalize the SS1 architecture table to use trait-based terminology while preserving the overall structure
3. Rephrase SS1.0a to reference `LocalBackend` (from `backend-local.md`) and `SharedMemoryProvider` HeapFallback (from `communicator-trait.md SS4`)
4. Preserve SS1.2 but add a framing note that this subsection describes the ferrompi backend specifically, with a cross-reference to `backend-ferrompi.md`
5. Generalize SS6 Steps 1-3 to a backend-agnostic initialization that calls `create_communicator()`, with ferrompi-specific detail preserved as annotation or cross-reference
6. Rephrase SS6a to reference `LocalBackend` explicitly
7. Add cross-references to all new spec files where relevant

### Approach to Existing Sections

- **SS1.1 (Why ferrompi + OpenMP)**: Rename to "Why a Communication Backend + OpenMP" and generalize the opening paragraph. The ferrompi-specific rationale remains valid as the explanation for why MPI is the recommended production backend.
- **SS1.3 (Shared Memory Layout)**: Replace `SharedWindow<T>` with `SharedRegion<T>` in prose. Add a parenthetical "(via the `SharedMemoryProvider` trait)" with cross-reference.
- **SS2-SS5 (OpenMP sections)**: No changes required. These sections are about the OpenMP threading layer and are independent of the communication backend.
- **SS7 (Build Integration)**: Add a note about `cobre-comm` crate dependency and the `mpi` feature flag gating ferrompi linkage. Preserve existing OpenMP build details.
- **SS8 (Reference Deployment)**: No changes required. The deployment example uses MPI ranks, which remains the production configuration.

### Error Handling

N/A -- this is a documentation spec modification, not code.

## Acceptance Criteria

- [ ] Given the Purpose paragraph, when read, then it describes "a pluggable communication backend" rather than "ferrompi as the backbone"
- [ ] Given the SS1 architecture table, when read, then the Inter-node row references `Communicator` trait methods and the Intra-node row references `SharedMemoryProvider` trait, both with cross-references to `communicator-trait.md`
- [ ] Given SS1.0a, when read, then it references `LocalBackend` (citing `backend-local.md SS2`) and `SharedMemoryProvider` HeapFallback (citing `communicator-trait.md SS4`) instead of prose-level no-op descriptions
- [ ] Given SS1.2, when read, then it retains all ferrompi-specific detail but is framed as "the ferrompi backend's capabilities" with a cross-reference to `backend-ferrompi.md`
- [ ] Given SS6 Steps 1-3, when read, then the initialization is described as: Step 1 calls `create_communicator()` (citing `backend-selection.md SS4`), Step 2 uses `comm.rank()` and `comm.size()` (citing `communicator-trait.md SS2.5`), Step 3 calls `comm.split_local()` (citing `communicator-trait.md SS4.1`), with a note that for the `mpi` feature the factory internally calls `ferrompi::init_with_threading` (citing `backend-ferrompi.md SS2.1`)
- [ ] Given SS6a, when read, then it states that the `local` backend is selected (either explicitly or via auto-detection) and the `LocalBackend` struct handles Steps 1-3 as identity operations (citing `backend-local.md`)
- [ ] Given SS1.3, when read, then `SharedWindow<T>` references are replaced with `SharedRegion<T>` with a cross-reference to `communicator-trait.md SS4.2`
- [ ] Given the Cross-References section, when read, then it includes links to `communicator-trait.md`, `backend-selection.md`, `backend-ferrompi.md`, `backend-local.md`, and `shared-memory-aggregation.md`
- [ ] Given the complete modified file, when `mdbook build` is run, then it succeeds with no broken links
- [ ] Given the complete modified file, when read end-to-end, then no section numbers have been deleted or renumbered -- only prose has been modified and cross-references added

## Implementation Guide

### Suggested Approach

Execute the following modifications in order:

**Step 1 -- Purpose paragraph (line 5):**

Replace "ferrompi as the backbone for inter-node communication, intra-node shared memory, and topology detection" with "a pluggable communication backend (selected at compile time via Cargo feature flags) for inter-node communication, intra-node shared memory, and topology detection". Add a parenthetical cross-reference: "see [Backend Selection](./backend-selection.md)".

**Step 2 -- SS1 architecture table (lines 11-16):**

Modify the table to generalize the Technology column:

- Row 1 (Inter-node): Change "ferrompi (MPI point-to-point and collectives)" to "`Communicator` trait ([communicator-trait.md SS1](./communicator-trait.md))" and update Responsibility to reference trait method names (`allgatherv`, `allreduce`)
- Row 2 (Intra-node): Change "ferrompi (`SharedWindow<T>`, MPI windows)" to "`SharedMemoryProvider` trait ([communicator-trait.md SS4](./communicator-trait.md))" and replace `SharedWindow<T>` with `SharedRegion<T>` in Responsibility
- Row 3 (Topology): Change "ferrompi (`split_shared_memory()`, SLURM integration)" to "`SharedMemoryProvider::split_local()` ([communicator-trait.md SS4.1](./communicator-trait.md)) + SLURM integration"
- Row 4 (Intra-rank threading): No change -- OpenMP is independent of the communication backend

**Step 3 -- SS1.0a (lines 18-28):**

Rewrite to reference `LocalBackend`:

- Replace "MPI is not initialized. No `ferrompi` calls are made." with "The `local` communication backend is selected (see [Local Backend](./backend-local.md)). No inter-process communication occurs."
- Replace the bullet "All MPI collectives (`MPI_Allreduce`, `MPI_Allgatherv`, `MPI_Broadcast`) become local no-ops or trivial identity operations." with "All `Communicator` trait methods ([communicator-trait.md SS1.1](./communicator-trait.md)) are identity operations or no-ops, as specified in [Local Backend SS2](./backend-local.md)."
- Replace "`SharedWindow<T>` is not used" with "`SharedMemoryProvider` uses `HeapFallback` -- shared read-only data is allocated as regular per-process heap memory (see [Local Backend SS3](./backend-local.md))."

**Step 4 -- SS1.2 (lines 42-52):**

Add a framing sentence before the table: "The following table details the capabilities of the **ferrompi backend** (`FerrompiBackend`), which is the production communication backend for MPI-based HPC deployments. For the complete ferrompi backend specification, see [Ferrompi Backend](./backend-ferrompi.md). For alternative backends (local, TCP, shared-memory), see [Backend Selection SS1.2](./backend-selection.md)."

In the table, add a column annotation or parenthetical for `SharedWindow<T>`: "(`FerrompiRegion<T>` wrapping MPI windows -- see [Ferrompi Backend SS3](./backend-ferrompi.md))"

Replace `split_shared_memory()` reference with `split_local()` noting that for ferrompi this returns an intra-node MPI sub-communicator.

**Step 5 -- SS1.3 (lines 54-69):**

Replace "MPI windows" with "`SharedRegion<T>` (see [Communicator Trait SS4.2](./communicator-trait.md))". Replace "via MPI windows" with "via the `SharedMemoryProvider` trait". Keep the data table unchanged.

**Step 6 -- SS6 initialization sequence (lines 197-215):**

Rewrite Steps 1-3:

- **Step 1 -- Backend initialization**: "Call `create_communicator()` (see [Backend Selection SS3](./backend-selection.md)) to initialize the selected communication backend. For the `mpi` feature, the factory internally calls `ferrompi::init_with_threading(ThreadLevel::Multiple)` (see [Ferrompi Backend SS2.1](./backend-ferrompi.md)). For other backends, initialization is backend-specific (TCP: coordinator handshake; shm: segment creation; local: no-op)."
- **Step 2 -- Topology detection**: "Query `comm.rank()` and `comm.size()` (see [Communicator Trait SS2.5](./communicator-trait.md)) to determine rank count and rank ID. Detect the scheduler environment..."
- **Step 3 -- Shared memory communicator**: "Create an intra-node communicator via `comm.split_local()` (see [Communicator Trait SS4.1](./communicator-trait.md)). For the ferrompi backend, this groups ranks on the same physical node. For local and TCP backends, this returns a `LocalBackend` (see [Local Backend SS3.3](./backend-local.md)). For the shm backend, this returns a clone of the full communicator (see [Shm Backend SS1.3](./backend-shm.md))."

**Step 7 -- SS6a (lines 217-231):**

Rephrase the opening: "When operating in single-process mode (library-mode callers such as `cobre-mcp` and `cobre-python`), the `local` backend is selected via `create_communicator()` (either by explicit `COBRE_COMM_BACKEND=local` or by auto-detection -- see [Backend Selection SS2](./backend-selection.md)). `LocalBackend` handles Steps 1-3 as no-ops: `rank()` returns 0, `size()` returns 1, `split_local()` returns `Box::new(LocalBackend)`, and `SharedMemoryProvider` uses `HeapFallback` (see [Local Backend](./backend-local.md)). The initialization sequence continues at Step 4:"

**Step 8 -- SS7 Build Integration (lines 233-257):**

After the existing MPI linking paragraph (line 253), add: "Communication backend linking is managed by the `cobre-comm` crate (see [cobre-comm](../../crates/comm.md)). The `mpi` Cargo feature gates the `ferrompi` dependency; when disabled, no MPI headers or libraries are required at build time. See [Backend Selection SS1](./backend-selection.md) for the complete feature flag matrix."

**Step 9 -- Cross-References (lines 273-291):**

Add the following entries (maintaining alphabetical order within the section):

- `[Backend Selection](./backend-selection.md) -- Feature flags, runtime selection, factory pattern for communication backend initialization`
- `[Communicator Trait §1](./communicator-trait.md) -- Communicator trait definition, method contracts, generic parameterization`
- `[Communicator Trait §4](./communicator-trait.md) -- SharedMemoryProvider trait, SharedRegion<T>, HeapFallback semantics`
- `[Ferrompi Backend](./backend-ferrompi.md) -- FerrompiBackend struct, MPI initialization wrapper, FerrompiRegion<T>`
- `[Local Backend](./backend-local.md) -- LocalBackend ZST, identity/no-op classification, HeapRegion<T>`
- `[cobre-comm](../../crates/comm.md) -- Communication crate architecture, dependency graph, feature matrix`

### Key Files to Modify

- `src/specs/hpc/hybrid-parallelism.md` (single file)

### Patterns to Follow

- Cross-reference format: `[Section Name SS#](./relative-path.md)` using SS symbol (established in Epic 02 learnings)
- Every spec ends with `## Cross-References` section (established convention)
- Additive refactoring: existing ferrompi-specific content remains valid for MPI deployments; changes generalize the framing and add trait references alongside

### Pitfalls to Avoid

- Do NOT remove or renumber existing sections. SS1 through SS8 must retain their numbers.
- Do NOT delete the ferrompi Capabilities Used table (SS1.2). It remains the authoritative reference for what MPI features the production backend uses. Only add framing.
- Do NOT replace MPI-specific terminology in SS3-SS5 (OpenMP sections). Those sections are unrelated to the communication backend.
- Do NOT change the Reference Deployment parameters in SS8. The example is MPI-specific and remains valid.

## Testing Requirements

### Unit Tests

N/A -- documentation spec.

### Integration Tests

- Run `mdbook build` from the repository root after modifications. Verify zero warnings and zero broken links.
- Verify all new cross-reference links resolve to existing section anchors in the target files.

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-005, ticket-006 (all completed)
- **Blocks**: ticket-011 (references generalized terminology from this ticket), ticket-013 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
