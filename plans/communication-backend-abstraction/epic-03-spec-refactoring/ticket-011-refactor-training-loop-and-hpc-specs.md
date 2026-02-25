# ticket-011 Refactor training-loop.md and Remaining HPC Specs

## Context

### Background

Tickets 009 and 010 generalize the two primary HPC specs (`hybrid-parallelism.md` and `communication-patterns.md`) to reference the `Communicator` trait. This ticket completes the refactoring by updating four additional specs that reference MPI collectives or ferrompi APIs directly: the training loop (the central architecture spec), synchronization, work distribution, and shared memory aggregation. These specs use MPI operation names (`MPI_Allgatherv`, `MPI_Allreduce`, `MPI_Barrier`) and ferrompi types (`SharedWindow<T>`, `split_shared_memory()`) that must be generalized to trait-based references.

### Relation to Epic

This is the third ticket in Epic 03 and depends on tickets 009 and 010 because it cross-references the generalized terminology those tickets established. After this ticket, all SDDP architecture and HPC specs use consistent trait-based communication terminology. Tickets 012 and 013 depend on this ticket being complete so they can reference the final state of all refactored specs.

### Current State

Four files need modification:

1. **`src/specs/architecture/training-loop.md`** (313 lines):
   - SS2.1 step 2: "MPI_Allreduce aggregates global statistics" (line 37)
   - SS2.1 step 4: "MPI_Allgatherv distributes new cuts" (line 39)
   - SS4.3: "MPI_Allreduce aggregates: Lower bound, Upper bound" (lines 156-159)
   - SS4.3a: "MPI_Allreduce for bound aggregation becomes a local computation" (line 163)
   - SS5.2 step 3: "broadcast to all ranks via MPI_Allgatherv" (line 192)
   - SS6.3: "MPI_Allgatherv collects all new cuts" (line 227)
   - SS6.3a: "MPI_Allgatherv for cut synchronization becomes a no-op" (line 231)
   - Cross-References: Reference to "Work Distribution" uses "Detailed MPI+OpenMP parallelism patterns" (line 297)

2. **`src/specs/hpc/synchronization.md`** (127 lines):
   - Purpose paragraph: "complete set of MPI synchronization points" (line 5)
   - SS1 title: "MPI Synchronization Points" (line 8)
   - SS1.1: "MPI synchronization points" throughout table and prose (lines 11-17)
   - SS1.3: "MPI_Allgatherv call" and "MPI_Allreduce aggregates" (lines 25-36)
   - SS1.4: "MPI_Allgatherv collects all new cuts" (lines 40-47)
   - Cross-References: References "ferrompi collectives" (line 125)

3. **`src/specs/hpc/work-distribution.md`** (173 lines):
   - SS1.1 table: "MPI_Allreduce for lower bound" (line 18)
   - SS1.4: "single MPI_Allreduce aggregates" (lines 38-47)
   - SS2.1: "MPI_Allgatherv: each rank contributes" (lines 52-53)
   - SS2.2 Step 4: "MPI_Allgatherv collects all new cuts" (line 67)
   - SS3.2: "MPI_Allgatherv" in collective parameters table (lines 103-111)
   - Cross-References: References "ferrompi collectives" (line 169)

4. **`src/specs/hpc/shared-memory-aggregation.md`** (179 lines):
   - SS1.1: "ferrompi's `SharedWindow<T>`" and "MPI ranks" and "split_shared_memory()" (lines 9-17)
   - SS1.2: "`SharedWindow<T>`" references (lines 22-39)
   - SS1.3: "`SharedWindow<T>`" references (lines 43-52)
   - SS1.4: "`SharedWindow<T>`" references (lines 56-66)
   - SS2.1: "flat MPI_Allgatherv" (line 71)
   - SS2.2: "`SharedWindow<T>`" and "MPI_Allgatherv" (lines 76-84)
   - Cross-References: "`SharedWindow<T>` capabilities" (line 167)

## Specification

### Requirements

1. In all four files, replace `MPI_Allgatherv` with `allgatherv`, `MPI_Allreduce` with `allreduce`, `MPI_Allgatherv` with `allgatherv`, `MPI_Barrier` with `barrier`, and `MPI_Bcast` with `broadcast` in prose text. Add cross-references to `communicator-trait.md` method contracts where the operation is first mentioned in each file.
2. In `training-loop.md`, add the generic signature `train<C: Communicator>(comm: &C, ...)` to SS2.1 or SS4.3 prose as a reference to how the training loop is parameterized by the communicator backend.
3. In `training-loop.md` SS4.3a and SS6.3a, rephrase single-rank variants in terms of `comm.size() == 1` (trait-level condition) rather than "single-process mode". Add note that when using `LocalBackend`, all `Communicator` methods are identity/no-op operations.
4. In `synchronization.md`, replace "MPI Synchronization Points" with "Communication Synchronization Points" in the section title, and generalize table headers accordingly.
5. In `work-distribution.md`, replace MPI-specific collective names in the distribution arithmetic context (SS3.2) while preserving the mathematical content.
6. In `shared-memory-aggregation.md`, replace all `SharedWindow<T>` references with `SharedRegion<T>`, replace `split_shared_memory()` with `split_local()`, and add cross-references to `communicator-trait.md SS4`.
7. Each modified file's `## Cross-References` section must add entries for `communicator-trait.md` and optionally `backend-local.md` where relevant.

### Key Design Decisions

- **training-loop.md**: Show `train<C: Communicator>(comm: &C, ...)` once in SS4.3 as a signature note. Do not add full function signatures -- the training loop spec describes algorithmic behavior, not API surface. The trait parameterization is documented in `communicator-trait.md SS3`.
- **SS4.3a and SS6.3a**: Rephrase as "`comm.size() == 1`" behavior, which is the trait-level abstraction. Do not use "when using `LocalBackend`" because the single-rank case can also occur with MPI (single-rank `mpiexec -n 1`). The key distinction is `size() == 1` vs `size() > 1`.
- **synchronization.md**: Keep the MPI-style operation names in the SS1.1 summary table for familiarity (they are well-known names), but present them as `allgatherv` and `allreduce` (trait method names) rather than `MPI_Allgatherv` and `MPI_Allreduce`.
- **shared-memory-aggregation.md SS2.2**: The two-level aggregation optimization references `SharedWindow<T>` and intra-node `MPI_Allgatherv`. Replace with `SharedRegion<T>` and intra-node communication via the `SharedMemoryProvider` trait. Reference the relevant backend specs for implementation details.

### Error Handling

N/A -- documentation spec modification.

## Acceptance Criteria

- [ ] Given `training-loop.md` SS2.1, when read, then steps 2 and 4 reference `allreduce` and `allgatherv` (not `MPI_Allreduce` and `MPI_Allgatherv`), with a cross-reference to `communicator-trait.md SS2` on first mention
- [ ] Given `training-loop.md` SS4.3, when read, then it states the training loop is generic over `C: Communicator` (citing `communicator-trait.md SS3`) and replaces `MPI_Allreduce` with `allreduce`
- [ ] Given `training-loop.md` SS4.3a, when read, then it phrases the single-rank variant as "when `comm.size() == 1`" behavior: `allreduce` is a local computation, no inter-rank communication occurs
- [ ] Given `training-loop.md` SS6.3a, when read, then it phrases the single-rank backward variant as "when `comm.size() == 1`": `allgatherv` for cut synchronization is an identity operation, the per-stage barrier reduces to an OpenMP barrier only
- [ ] Given `synchronization.md` SS1 title, when read, then it says "Communication Synchronization Points" (not "MPI Synchronization Points")
- [ ] Given `synchronization.md` SS1.1 table, when read, then the Operation column uses trait method names (`allgatherv`, `allreduce`) with a cross-reference to `communicator-trait.md SS2`
- [ ] Given `work-distribution.md` SS1.4, when read, then it references `allreduce` (not `MPI_Allreduce`) with the trait cross-reference
- [ ] Given `work-distribution.md` SS3.2, when read, then the collective parameters table references `allgatherv` (not `MPI_Allgatherv`)
- [ ] Given `shared-memory-aggregation.md` SS1.1, when read, then `SharedWindow<T>` is replaced with `SharedRegion<T>` (citing `communicator-trait.md SS4.2`) and `split_shared_memory()` is replaced with `split_local()` (citing `communicator-trait.md SS4.1`)
- [ ] Given all four modified files, when `mdbook build` is run, then it succeeds with no broken links
- [ ] Given all four modified files, when read, then no section numbers have been deleted or renumbered

## Implementation Guide

### Suggested Approach

Process each file in order: training-loop.md first (most changes), then synchronization.md, work-distribution.md, shared-memory-aggregation.md.

#### File 1: training-loop.md

**SS2.1 Iteration Lifecycle (lines 36-42):**

- Step 2: Replace "MPI_Allreduce aggregates global statistics (lower bound, visited states) across ranks" with "`allreduce` ([Communicator Trait SS2.2](../hpc/communicator-trait.md)) aggregates global statistics (lower bound, upper bound) across ranks"
- Step 4: Replace "MPI_Allgatherv distributes new cuts to all ranks" with "`allgatherv` ([Communicator Trait SS2.1](../hpc/communicator-trait.md)) distributes new cuts to all ranks"

**SS4.3 Parallel Distribution (lines 151-159):**

Add after the first paragraph: "The training loop is generic over `C: Communicator` (see [Communicator Trait SS3](../hpc/communicator-trait.md) for the function signature pattern), enabling compile-time specialization to any communication backend."

- Replace "MPI_Allreduce aggregates:" with "`allreduce` aggregates:"

**SS4.3a Single-Rank Variant (lines 161-163):**

Replace: "In single-process mode (used by `cobre-python` and `cobre-mcp`), all scenarios are assigned to the single rank. The `MPI_Allreduce` for bound aggregation becomes a local computation -- the rank's local statistics are the global statistics. No inter-rank communication occurs."

With: "When `comm.size() == 1` (single-process mode, used by `cobre-python` and `cobre-mcp`, or single-rank MPI execution), all scenarios are assigned to the single rank. The `allreduce` for bound aggregation becomes a local computation -- the rank's local statistics are the global statistics. For the `LocalBackend`, this is an identity copy operation (see [Local Backend SS2.2](../hpc/backend-local.md)). No inter-rank communication occurs."

**SS5.2 State Lifecycle step 3 (line 192):**

Replace "broadcast to all ranks via `MPI_Allgatherv`" with "collected across all ranks via `allgatherv`".

**SS6.3 Parallel Distribution (lines 222-227):**

Replace "MPI_Allgatherv collects all new cuts from all ranks and distributes them" with "`allgatherv` collects all new cuts from all ranks and distributes them".

**SS6.3a Single-Rank Backward (lines 229-231):**

Replace: "In single-process mode, the `MPI_Allgatherv` for cut synchronization becomes a no-op -- all cuts generated by the single rank are immediately available locally. The per-stage synchronization barrier reduces to an OpenMP barrier only (ensuring all threads complete cut generation at stage $t$ before proceeding to stage $t-1$)."

With: "When `comm.size() == 1`, the `allgatherv` for cut synchronization becomes an identity operation -- all cuts generated by the single rank are immediately available locally (for the `LocalBackend`, this is a memcpy; see [Local Backend SS2.2](../hpc/backend-local.md)). The per-stage synchronization barrier reduces to an OpenMP barrier only (ensuring all threads complete cut generation at stage $t$ before proceeding to stage $t-1$)."

**Cross-References (lines 290-312):**

- Update the Work Distribution reference from "Detailed MPI+OpenMP parallelism patterns" to "Detailed communication+OpenMP parallelism patterns"
- Update the Synchronization reference from "Barrier semantics, MPI collective operations" to "Barrier semantics, collective operations via Communicator trait"
- Add: `[Communicator Trait](../hpc/communicator-trait.md) -- Communicator trait definition, method contracts, generic parameterization`
- Add: `[Local Backend](../hpc/backend-local.md) -- LocalBackend identity/no-op operations for single-rank execution`

#### File 2: synchronization.md

**Purpose paragraph (line 5):**

Replace "the complete set of MPI synchronization points" with "the complete set of communication synchronization points through the `Communicator` trait ([Communicator Trait SS1](./communicator-trait.md))".

**SS1 title (line 8):**

Rename "## 1. MPI Synchronization Points" to "## 1. Communication Synchronization Points".

**SS1.1 (lines 10-17):**

Replace "all MPI synchronization points" with "all communication synchronization points". In the table, replace the `MPI Operation` column header with `Operation` and the values `MPI_Allgatherv`, `MPI_Allreduce` with `allgatherv`, `allreduce`. Add note: "For method contracts and determinism guarantees, see [Communicator Trait SS2](./communicator-trait.md)."

**SS1.3 (lines 24-36):**

Replace `MPI_Allgatherv` with `allgatherv` and `MPI_Allreduce` with `allreduce`. Replace "MPI_MIN" with "ReduceOp::Min" and "MPI_SUM" with "ReduceOp::Sum" in the table.

**SS1.4 (lines 40-47):**

Replace "MPI_Allgatherv collects" with "`allgatherv` collects" and "MPI_Allgatherv acts as an implicit barrier" with "`allgatherv` acts as an implicit barrier".

**SS1.5 (lines 49-53):**

Replace "No explicit MPI synchronization" with "No explicit communication synchronization". Replace "MPI_Barrier" with "`barrier`".

**Cross-References (lines 115-127):**

Replace "ferrompi collectives: `MPI_Allgatherv`, `MPI_Allreduce`" with "collective operations via Communicator trait: `allgatherv`, `allreduce`".
Add: `[Communicator Trait SS2](./communicator-trait.md) -- Method contracts for allgatherv, allreduce, barrier`.

#### File 3: work-distribution.md

**SS1.1 table (line 18):**

Replace "MPI_Allreduce for lower bound and upper bound statistics" with "`allreduce` for lower bound and upper bound statistics".

**SS1.4 (lines 38-47):**

Replace "a single `MPI_Allreduce` aggregates:" with "a single `allreduce` ([Communicator Trait SS2.2](./communicator-trait.md)) aggregates:". In the table, replace `MPI_MIN` with `ReduceOp::Min` and `MPI_SUM` with `ReduceOp::Sum`.

**SS2.1 (lines 52-53):**

Replace "via `MPI_Allgatherv`" with "via `allgatherv` ([Communicator Trait SS2.1](./communicator-trait.md))".

**SS2.2 Step 4 (line 67):**

Replace "MPI_Allgatherv collects all new cuts" with "`allgatherv` collects all new cuts".

**SS2.2 Step 6 (line 71):**

Replace "The `MPI_Allgatherv` in step 4 acts as an implicit barrier" with "The `allgatherv` in step 4 acts as an implicit barrier".

**SS3.2 (lines 103-111):**

Replace "MPI_Allgatherv" with "`allgatherv`" in the heading and table. The `sendcount`, `recvcounts`, `displs` parameter names match the `Communicator::allgatherv` signature from `communicator-trait.md SS1.1` (the parameters are `counts` and `displs` in the trait).

**Cross-References (lines 159-173):**

Replace "ferrompi collectives: `MPI_Allreduce`, `MPI_Allgatherv`" with "collective operations via Communicator trait".
Add: `[Communicator Trait SS2](./communicator-trait.md) -- Method contracts for allgatherv, allreduce`.

#### File 4: shared-memory-aggregation.md

**SS1.1 (lines 9-17):**

Replace: "ferrompi's `SharedWindow<T>` allows MPI ranks on the same physical node to share memory regions."
With: "The `SharedMemoryProvider` trait ([Communicator Trait SS4](./communicator-trait.md)) allows ranks on the same physical node to share memory regions via `SharedRegion<T>` handles."

Replace: "one rank per node (the leader, determined by rank 0 within the intra-node communicator from `split_shared_memory()`)"
With: "one rank per node (the leader, determined by `is_leader()` from the `SharedMemoryProvider` trait, which returns `true` for rank 0 within the intra-node communicator from `split_local()`)"

Update the table:

- Role/Allocation column: Replace "Allocates full region" with "Calls `create_shared_region(count)` -- allocates full region" for Leader. Follower: "Receives handle to leader's region (size 0 local allocation)"
- Read Access column: Replace "Direct pointer dereference" with "`region.as_slice()` (zero-copy)"
- Write Access column: Replace "Direct write, then `window.fence()`" with "`region.as_mut_slice()`, then `region.fence()`"

Replace: "The `SharedWindow<T>` type provides RAII semantics -- `Drop` automatically frees the MPI window"
With: "The `SharedRegion<T>` type provides RAII semantics -- `Drop` automatically frees the underlying shared memory resource (MPI window for ferrompi, OS shared segment for shm, `Vec<T>` for HeapFallback). See [Communicator Trait SS4.2](./communicator-trait.md)."

**SS1.2 (lines 22-39):**

Replace "SharedWindow<T>" with "SharedRegion<T>" throughout. In the generation protocol steps:

- Step 1: Replace "Create intra-node communicator via `comm.split_shared_memory()`" with "Create intra-node communicator via `comm.split_local()` ([Communicator Trait SS4.1](./communicator-trait.md))"
- Step 2: Replace "Leader allocates `SharedWindow<f64>`" with "Leader calls `create_shared_region::<f64>(count)` ([Communicator Trait SS4.1](./communicator-trait.md))"
- Step 5: Replace "`window.fence()`" with "`region.fence()`"
- Step 6: Replace "direct pointer dereference" with "`region.as_slice()`"

**SS1.3 (lines 43-52):**

Replace "`SharedWindow<T>`" with "`SharedRegion<T>`" in the introductory sentence and design point note.

**SS1.4 (lines 56-66):**

Replace "`SharedWindow<T>`" with "`SharedRegion<T>`" in all occurrences.

**SS2.1 (line 71):**

Replace "flat `MPI_Allgatherv`" with "flat `allgatherv`".

**SS2.2 (lines 76-84):**

Replace "`SharedWindow<T>`" with "`SharedRegion<T>`" and "MPI_Allgatherv" with "`allgatherv`". Update step 1 "shared memory via `SharedWindow<T>`" to "shared memory via `SharedRegion<T>` (via the `SharedMemoryProvider` trait)". Update step 2 "MPI_Allgatherv across nodes" to "`allgatherv` across nodes". Update step 3 "`window.fence()`" to "`region.fence()`".

**Cross-References (lines 165-179):**

Replace "`SharedWindow<T>` capabilities" with "`SharedRegion<T>` capabilities and shared data candidates".
Add: `[Communicator Trait SS4](./communicator-trait.md) -- SharedMemoryProvider trait, SharedRegion<T>, leader/follower pattern`.
Add: `[Local Backend SS3](./backend-local.md) -- HeapFallback implementation for backends without shared memory`.

### Key Files to Modify

- `src/specs/architecture/training-loop.md`
- `src/specs/hpc/synchronization.md`
- `src/specs/hpc/work-distribution.md`
- `src/specs/hpc/shared-memory-aggregation.md`

### Patterns to Follow

- Cross-reference format: `[Section Name SS#](./relative-path.md)` using SS symbol
- For files in `src/specs/architecture/`, cross-references to HPC specs use `../hpc/` relative paths
- For files in `src/specs/hpc/`, cross-references to architecture specs use `../architecture/` relative paths
- Replace MPI operation names consistently: `MPI_Allgatherv` -> `allgatherv`, `MPI_Allreduce` -> `allreduce`, `MPI_Barrier` -> `barrier`, `MPI_Bcast` -> `broadcast`
- Replace reduction operation names: `MPI_SUM` -> `ReduceOp::Sum`, `MPI_MIN` -> `ReduceOp::Min`
- Replace `SharedWindow<T>` -> `SharedRegion<T>`, `split_shared_memory()` -> `split_local()`, `window.fence()` -> `region.fence()`

### Pitfalls to Avoid

- Do NOT change section numbers in any of the four files
- Do NOT modify the mathematical content (payload sizes, volume analysis, distribution arithmetic) -- only communication API references change
- Do NOT change the OpenMP thread coordination sections in synchronization.md SS2-SS3 -- those are independent of the communication backend
- In training-loop.md, do NOT change sections SS1, SS3, SS6.1, SS6.2, SS6.4, SS7 -- these sections do not reference MPI operations
- The cross-references from these files to other files that have NOT been refactored yet (e.g., `cut-management-impl.md`) should keep their existing text -- do not pre-emptively update references to specs outside this epic's scope

## Testing Requirements

### Unit Tests

N/A -- documentation spec.

### Integration Tests

- Run `mdbook build` from the repository root after all four files are modified. Verify zero warnings and zero broken links.
- Verify all new cross-reference links resolve to existing section anchors in the target files.
- Spot-check that the replaced MPI operation names are consistent across all four files (search for leftover `MPI_All` patterns).

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-009 (hybrid-parallelism.md refactored), ticket-010 (communication-patterns.md refactored)
- **Blocks**: ticket-013 (cross-reference index update)

## Effort Estimate

**Points**: 4
**Confidence**: High
