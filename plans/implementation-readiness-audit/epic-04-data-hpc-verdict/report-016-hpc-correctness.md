# Report 016 -- HPC Spec Correctness Audit

**Scope**: HPC specification corpus internal correctness
**Auditor**: hpc-parallel-computing-specialist
**Date**: 2026-02-26

---

## 1. Executive Summary

This report audits the HPC specification corpus (15 files in `src/specs/hpc/` plus 3 architecture files that reference HPC) across four correctness dimensions: MPI collective parameter specificity, threading model consistency, NUMA/cache actionability, and ferrompi API surface match. The overall assessment is **SUFFICIENT WITH GAPS**. The strongest dimension is MPI collective parameter specificity, where the specification provides exact type parameters, buffer size formulas, and wire format layouts for all critical operations. The most significant finding is a **type mismatch** in `work-distribution.md` SS3.2, which specifies `allgatherv` counts/displacements as `i32`/`Vec<i32>` while the canonical `Communicator` trait in `communicator-trait.md` SS1.1 uses `usize`. This is a correctness issue that could cause implementer confusion, though the conversion is documented in `backend-ferrompi.md` SS1.2. Three stale `split_shared_memory()` references persist in `communicator-trait.md` (confirmed from report-008 F-003), and two `rayon` references appear in architecture specs that reference the HPC threading model -- one in `training-loop.md` and one in `solver-workspaces.md` -- creating a threading model inconsistency with the approved OpenMP-via-C-FFI model.

---

## 2. MPI Collective Parameter Audit

This section inventories every MPI collective operation invocation in the spec corpus, assessing whether each provides sufficient parameter detail for an implementer to write the call without guessing buffer sizes.

### 2.1 Canonical Trait Signatures

The authoritative trait signatures are defined in `communicator-trait.md` SS1.1:

| Method       | Generic Type  | Buffer Parameters                                                      | ReduceOp       |
| ------------ | ------------- | ---------------------------------------------------------------------- | -------------- |
| `allgatherv` | `T: CommData` | `send: &[T]`, `recv: &mut [T]`, `counts: &[usize]`, `displs: &[usize]` | N/A            |
| `allreduce`  | `T: CommData` | `send: &[T]`, `recv: &mut [T]`                                         | `op: ReduceOp` |
| `broadcast`  | `T: CommData` | `buf: &mut [T]`, `root: usize`                                         | N/A            |
| `barrier`    | N/A           | None                                                                   | N/A            |

All four methods return `Result<(), CommError>`. The `CommData` trait has bounds `Send + Sync + Copy + 'static` with a blanket implementation.

### 2.2 allgatherv Invocation Inventory

| #   | File                        | Section | Context                                        | Type Parameter                                         | Buffer Size Formulas                                                                                                                                   | Counts/Displs Formulas                                                                 | Specificity                                                                                          |
| --- | --------------------------- | ------- | ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `communicator-trait.md`     | SS1.1   | Trait definition                               | `T: CommData` (generic)                                | Preconditions table in SS2.1: `send.len() == counts[self.rank()]`, `recv.len() >= displs[R-1] + counts[R-1]`                                           | `counts.len() == self.size()`, `displs.len() == self.size()`                           | COMPLETE                                                                                             |
| 2   | `communicator-trait.md`     | SS2.1   | Method contract                                | `T: CommData` (generic)                                | Full precondition and postcondition tables                                                                                                             | Non-overlapping region constraint specified                                            | COMPLETE                                                                                             |
| 3   | `communication-patterns.md` | SS1.1   | Operations summary table, row 1 (trial points) | Not stated explicitly                                  | Linked to `work-distribution.md` SS3.1 for counts/displacements                                                                                        | "Once per iteration" frequency                                                         | PARTIAL -- type parameter not stated at this site                                                    |
| 4   | `communication-patterns.md` | SS1.1   | Operations summary table, row 2 (cuts)         | Not stated explicitly                                  | Linked to `cut-management-impl.md` SS4.2 for wire format                                                                                               | "Once per stage (T-1)" frequency                                                       | PARTIAL -- type parameter not stated at this site                                                    |
| 5   | `communication-patterns.md` | SS2.1   | Trial point payload                            | Implicit `f64` (state vector) + `u32` (stage index)    | Size formula: `192 x 8,964 ~ 1.72 MB per stage`, `~206 MB total`                                                                                       | Linked to `work-distribution.md` SS3.1                                                 | SUFFICIENT -- production-scale sizes stated                                                          |
| 6   | `communication-patterns.md` | SS2.2   | Cut payload                                    | Implicit from wire format                              | Size formula: `192 cuts x 16,660 bytes ~ 3.2 MB per stage`                                                                                             | Linked to `cut-management-impl.md` SS4.2                                               | SUFFICIENT -- production-scale sizes stated                                                          |
| 7   | `work-distribution.md`      | SS3.2   | Collective parameters table                    | **Not stated**                                         | `sendcount` formula: "Number of items this rank contributes"                                                                                           | `recvcounts[r]`: from SS3.1 formula; `displs[r]`: "Cumulative sum of recvcounts[0..r]" | SUFFICIENT WITH GAP -- formulas present but type is `i32`/`Vec<i32>`, conflicts with trait's `usize` |
| 8   | `synchronization.md`        | SS1.1   | Synchronization summary table                  | Not stated                                             | Implicit from `communication-patterns.md` references                                                                                                   | Not stated at this site                                                                | PARTIAL -- summary table, no parameter detail                                                        |
| 9   | `synchronization.md`        | SS1.3   | Forward-to-backward transition                 | Not stated                                             | Implicit: "visited states from all forward trajectories"                                                                                               | Not stated at this site                                                                | PARTIAL -- narrative description                                                                     |
| 10  | `synchronization.md`        | SS1.4   | Per-stage barrier                              | Not stated                                             | Implicit: "new cuts from all ranks"                                                                                                                    | Not stated at this site                                                                | PARTIAL -- narrative description                                                                     |
| 11  | `cut-management-impl.md`    | SS4.1   | Synchronization protocol (step 3)              | `MPI_Allgatherv` (raw MPI name, not trait method name) | "serialized cut data (coefficients + intercepts + metadata)"                                                                                           | Step 2: "Allgather of cut counts (one integer per rank)"                               | SUFFICIENT -- protocol steps are clear                                                               |
| 12  | `cut-management-impl.md`    | SS4.2a  | Wire format specification                      | **`T = u8`** (explicitly stated)                       | Exact byte-level formulas: `counts[r] = M_r x cut_size`, `displs[r] = sum(counts[0..r-1])`, `send.len() = M_r x cut_size`, `recv.len() = M x cut_size` | Complete formulas in a 4-row parameter table                                           | COMPLETE -- most detailed invocation in the corpus                                                   |
| 13  | `backend-ferrompi.md`       | SS1.2   | Method mapping table                           | `T: CommData` (via trait)                              | Type conversion noted: `counts`/`displs` `&[usize]` to `&[i32]`                                                                                        | N/A (mapping, not invocation)                                                          | COMPLETE for conversion context                                                                      |
| 14  | `training-loop.md`          | SS5.2   | Trial point collection                         | Not stated explicitly                                  | "visited states" reference                                                                                                                             | Cross-reference to HPC specs                                                           | PARTIAL -- architectural context only                                                                |
| 15  | `training-loop.md`          | SS6.3   | Cut distribution                               | Not stated explicitly                                  | "new cuts" reference                                                                                                                                   | Cross-reference to HPC specs                                                           | PARTIAL -- architectural context only                                                                |

### 2.3 allreduce Invocation Inventory

| #   | File                        | Section      | Context                               | Type Parameter                          | Buffer Sizes                                 | ReduceOp                                                        | Specificity                                           |
| --- | --------------------------- | ------------ | ------------------------------------- | --------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `communicator-trait.md`     | SS1.1, SS2.2 | Trait definition and contract         | `T: CommData` (generic)                 | `send.len() == recv.len()`, `send.len() > 0` | `op: ReduceOp`                                                  | COMPLETE                                              |
| 2   | `communicator-trait.md`     | SS1.3        | ReduceOp enum                         | N/A                                     | N/A                                          | `Sum`, `Min`, `Max` variants with use-case documentation        | COMPLETE                                              |
| 3   | `communication-patterns.md` | SS1.1        | Operations summary table              | Not stated explicitly                   | Implicit: 4 scalars                          | `ReduceOp::Sum` stated                                          | PARTIAL -- type parameter not stated                  |
| 4   | `communication-patterns.md` | SS2.3        | Convergence statistics                | `f64` (implicit from table)             | 32 bytes (4 x f64)                           | Two calls: `ReduceOp::Min` for LB, `ReduceOp::Sum` for UB stats | COMPLETE -- exact payload and reduction ops specified |
| 5   | `work-distribution.md`      | SS1.4        | Post-forward aggregation              | Not stated                              | 4 quantities listed in table                 | `ReduceOp::Min` and `ReduceOp::Sum` stated in table             | SUFFICIENT                                            |
| 6   | `synchronization.md`        | SS1.3        | Forward-to-backward convergence stats | `f64` (implicit from table)             | 4 scalars, reduction ops per-quantity        | `ReduceOp::Min` and `ReduceOp::Sum`                             | SUFFICIENT                                            |
| 7   | `communicator-trait.md`     | SS3          | Generic parameterization example      | `f64` (explicit in code: `[0.0f64; 4]`) | 4 elements                                   | `ReduceOp::Sum`                                                 | COMPLETE -- code example with concrete types          |

### 2.4 broadcast Invocation Inventory

| #   | File                        | Section      | Context                       | Type Parameter | Buffer Sizes                       | Root                 | Specificity                                                |
| --- | --------------------------- | ------------ | ----------------------------- | -------------- | ---------------------------------- | -------------------- | ---------------------------------------------------------- |
| 1   | `communicator-trait.md`     | SS1.1, SS2.3 | Trait definition and contract | `T: CommData`  | `buf.len()` identical on all ranks | `root < self.size()` | COMPLETE                                                   |
| 2   | `communication-patterns.md` | SS1.1        | Operations summary table      | Not stated     | "Configuration, case data"         | Not stated           | PARTIAL -- initialization only, low specificity acceptable |

### 2.5 barrier Invocation Inventory

| #   | File                        | Section           | Context                       | Specificity |
| --- | --------------------------- | ----------------- | ----------------------------- | ----------- |
| 1   | `communicator-trait.md`     | SS1.1, SS2.4      | Trait definition and contract | COMPLETE    |
| 2   | `communication-patterns.md` | SS1.1             | Operations summary table      | SUFFICIENT  |
| 3   | `checkpointing.md`          | (checkpoint sync) | Checkpoint barrier            | SUFFICIENT  |

### 2.6 MPI Parameter Findings

**F-016-001 (Medium): Type mismatch in `work-distribution.md` SS3.2.** The collective parameters table specifies `sendcount` as type `i32`, `recvcounts` as `Vec<i32>`, and `displs` as `Vec<i32>`. The canonical `Communicator` trait in `communicator-trait.md` SS1.1 uses `usize` for all count and displacement parameters. The `backend-ferrompi.md` SS1.2 method mapping table documents the `usize`-to-`i32` conversion as a ferrompi-specific implementation detail (ferrompi's `allgatherv` takes `&[i32]`). The `work-distribution.md` table conflates the trait-level types with the ferrompi-level types, which could mislead an implementer targeting a non-MPI backend where `usize` is the native type.

**F-016-002 (Low): Inconsistent MPI naming in `cut-management-impl.md` SS4.1.** Step 2 references "`MPI_Allgather`" and step 3 references "`MPI_Allgatherv`" using raw MPI C function names rather than the Cobre trait method names (`comm.allgatherv()`). This is not incorrect (the text describes the protocol, not the code), but it is inconsistent with the rest of the spec corpus, which uses trait method names. The SS4.2a subsection correctly uses the trait terminology.

**Assessment: SUFFICIENT WITH GAPS.** The spec corpus provides complete parameter detail at the two most critical sites: the trait definition (`communicator-trait.md` SS1.1/SS2) and the wire format specification (`cut-management-impl.md` SS4.2a). Intermediate sites (communication-patterns, synchronization) provide narrative context and production-scale sizes but often omit the explicit type parameter -- acceptable because they cross-reference the authoritative sites. The `i32`/`usize` type mismatch in `work-distribution.md` is the only finding that could cause implementer confusion and should be corrected.

---

## 3. Threading Model Consistency Audit

This section inventories all references to intra-rank threading technologies across the spec corpus and assesses consistency with the approved model.

### 3.1 Approved Threading Model

`hybrid-parallelism.md` SS1.1 establishes the approved threading model:

> "**OpenMP via C FFI** fills the one gap inter-process communication cannot cover: thread-level parallelism within a single rank."

`hybrid-parallelism.md` SS2 provides an explicit comparison table of OpenMP vs Rayon and states the decision for OpenMP:

> "Native OpenMP is used via C FFI rather than Rayon (Rust's standard parallelism library)."

SS5 details the C FFI wrapper strategy with three primitives (parallel for, parallel reduce, first-touch initialization) and direct OpenMP runtime function bindings (`omp_get_thread_num`, `omp_get_num_threads`, etc.).

### 3.2 Threading Reference Inventory

| #   | File                       | Section                          | Technology Referenced | Context                                                                                                                                                                                                                                                        | Consistent?                        |
| --- | -------------------------- | -------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | `hybrid-parallelism.md`    | SS1.1                            | OpenMP via C FFI      | Approved model definition                                                                                                                                                                                                                                      | YES (authoritative)                |
| 2   | `hybrid-parallelism.md`    | SS2                              | Rayon                 | Explicitly rejected in comparison table                                                                                                                                                                                                                        | YES (rejection)                    |
| 3   | `hybrid-parallelism.md`    | SS5                              | OpenMP                | C FFI wrapper primitives and runtime functions                                                                                                                                                                                                                 | YES                                |
| 4   | `memory-architecture.md`   | SS1.2                            | OpenMP                | OpenMP clause table (`shared`, `private`, thread ID indexing)                                                                                                                                                                                                  | YES                                |
| 5   | `memory-architecture.md`   | SS3.1                            | OpenMP (implicit)     | "First-touch initialization" within OpenMP parallel region                                                                                                                                                                                                     | YES                                |
| 6   | `synchronization.md`       | SS2                              | OpenMP                | Thread coordination primitives table: implicit barrier, explicit barrier, thread-local storage                                                                                                                                                                 | YES                                |
| 7   | `synchronization.md`       | SS3.1                            | OpenMP                | Cut accumulation buffers indexed by `omp_get_thread_num()`                                                                                                                                                                                                     | YES                                |
| 8   | `work-distribution.md`     | SS1.2                            | OpenMP                | `schedule(dynamic,1)` for thread-trajectory affinity                                                                                                                                                                                                           | YES                                |
| 9   | `work-distribution.md`     | SS4.3                            | OpenMP                | Dynamic scheduling within rank                                                                                                                                                                                                                                 | YES                                |
| 10  | `slurm-deployment.md`      | (multiple)                       | OpenMP                | `OMP_NUM_THREADS`, `OMP_PROC_BIND`, `OMP_PLACES` in job scripts                                                                                                                                                                                                | YES                                |
| 11  | **`training-loop.md`**     | **SS4.3 (struct field comment)** | **rayon**             | Comment on `TrainingStarted` event struct: `"Number of threads per rank (rayon thread pool size)."`                                                                                                                                                            | **NO -- inconsistent**             |
| 12  | **`solver-workspaces.md`** | **SS1.3a**                       | **rayon**             | Workspace lifecycle note: `"If the underlying runtime's work-stealing scheduler (e.g., rayon in test harnesses) moves a task to a different thread, the task must still access the workspace indexed by the executing thread's rayon::current_thread_index()"` | **NO -- inconsistent**             |
| 13  | `spec-gap-inventory.md`    | GAP-018                          | rayon, `std::thread`  | Gap description (historical): "Will this use rayon, std::thread with manual affinity, or FFI to OpenMP via C?"                                                                                                                                                 | YES (historical gap, now resolved) |
| 14  | `spec-gap-inventory.md`    | GAP-036                          | rayon                 | Gap description (historical): "interaction with rayon/thread-pool patterns"                                                                                                                                                                                    | YES (historical gap, now resolved) |
| 15  | `spec-gap-inventory.md`    | GAP-036 resolution               | rayon                 | Resolution text: "rayon::current_thread_index() correctness requirement"                                                                                                                                                                                       | CONDITIONAL (see F-016-004)        |

### 3.3 Threading Model Findings

**F-016-003 (Medium): Stale `rayon` reference in `training-loop.md` SS4.3.** The `TrainingStarted` event struct contains a field comment `"Number of threads per rank (rayon thread pool size)."` This references rayon as the threading runtime, but the approved model is OpenMP via C FFI. The field itself (`threads_per_rank: u32`) is threading-model-agnostic; only the comment is incorrect. This should be corrected to `"Number of threads per rank (OpenMP thread count)."` or simply `"Number of OpenMP threads per rank."`.

**F-016-004 (Low): Rayon reference in `solver-workspaces.md` SS1.3a.** The workspace lifecycle note references `rayon` as an example of a work-stealing scheduler that might be used in test harnesses, with `rayon::current_thread_index()` as the correct workspace indexing function. This is not strictly inconsistent -- it documents a correctness invariant for a hypothetical test scenario where rayon is used instead of OpenMP. However, it introduces rayon as a threading technology that an implementer might consider as an alternative, when `hybrid-parallelism.md` SS2 explicitly rejected rayon. The note should clarify that production code uses OpenMP (not rayon) and that the `rayon` reference applies only to a deferred test harness scenario.

**Assessment: SUFFICIENT WITH GAPS.** The 15 HPC spec files are fully consistent: all threading references use OpenMP terminology and mechanisms. The two inconsistencies are in architecture specs (`training-loop.md` and `solver-workspaces.md`), which were authored before the OpenMP decision was finalized (GAP-018 resolution). Neither finding blocks implementation -- the approved model in `hybrid-parallelism.md` is unambiguous -- but the stale references could cause implementer confusion if read in isolation.

---

## 4. NUMA and Cache-Awareness Assessment

This section classifies each NUMA/cache guideline in the spec corpus as ACTIONABLE (specific layout, alignment, or code path) or ASPIRATIONAL (general principle without implementation-level detail).

### 4.1 NUMA Guidelines

| #   | File                     | Section            | Guideline                                                                                                                                                    | Classification   | Evidence                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `memory-architecture.md` | SS3.1, Principle 1 | "Thread-owns-workspace: Each solver workspace is allocated by the thread that will use it, ensuring first-touch allocation on the thread's local NUMA node." | **ACTIONABLE**   | Tied to specific code path: `solver-workspaces.md` SS1.3 initialization sequence (6 steps). The owning thread creates the solver instance and zero-fills all buffers.                                                                                                                                                                          |
| 2   | `memory-architecture.md` | SS3.1, Principle 2 | "One rank per NUMA domain: The recommended deployment is one MPI rank per NUMA domain."                                                                      | **ASPIRATIONAL** | This is a deployment recommendation, not an enforced constraint. No runtime check validates that rank count matches NUMA domain count. The reference deployment in `hybrid-parallelism.md` SS8 shows a concrete example (8 ranks on 8 NUMA domains), but the spec does not specify what happens if the user deploys 2 ranks on 8 NUMA domains. |
| 3   | `memory-architecture.md` | SS3.1, Principle 3 | "First-touch initialization: Large arrays are initialized by the owning thread within an OpenMP parallel region, not by the main thread."                    | **ACTIONABLE**   | Tied to specific code paths: `solver-workspaces.md` SS1.3 (workspace initialization), `hybrid-parallelism.md` SS5.2 (first-touch C FFI primitive). The initialization sequence specifies that each thread pins to its NUMA node, creates its solver instance, and fills all buffers with zeros.                                                |
| 4   | `memory-architecture.md` | SS3.2              | "NUMA initialization sequence" (6 steps)                                                                                                                     | **ACTIONABLE**   | Concrete 6-step procedure: (1) main thread detects NUMA topology, (2) enter OpenMP parallel region, (3) each thread creates solver instance, (4) each thread initializes buffers, (5) implicit barrier, (6) main thread verifies. Cross-references `solver-workspaces.md` SS1.3.                                                               |
| 5   | `memory-architecture.md` | SS3.4              | NUMA latency reference table (local ~80ns, adjacent ~120ns, remote ~200ns)                                                                                   | **ASPIRATIONAL** | Informational table explaining why NUMA-aware allocation matters. No struct layout prescription or code path tied to these values. Useful for developer understanding but not implementable as a spec.                                                                                                                                         |
| 6   | `hybrid-parallelism.md`  | SS4.4              | "NUMA memory allocation configured at startup via Linux libnuma API. Local allocation: Memory allocated on the NUMA node of the calling thread."             | **ACTIONABLE**   | Specifies the technology (`libnuma`) and the policy (`local allocation` and `first-touch`). Tied to initialization step 6 in `hybrid-parallelism.md` SS6.                                                                                                                                                                                      |

### 4.2 Cache-Line Alignment Guidelines

| #   | File                     | Section | Guideline                                                                                                                           | Classification | Evidence                                                                                                                                                                                                                     |
| --- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `memory-architecture.md` | SS3.3   | "All per-thread data structures must be padded to cache line boundaries (64 bytes) to prevent false sharing."                       | **ACTIONABLE** | Specifies exact alignment value (64 bytes). Lists the specific data structures that require alignment: solver workspace array entries, cut accumulation buffers, per-thread solve statistics counters.                       |
| 2   | `synchronization.md`     | SS3.1   | "Each buffer starts on a cache line boundary (64 bytes) to prevent false sharing."                                                  | **ACTIONABLE** | Specifies alignment for cut accumulation buffers specifically. Table includes: buffer allocation (pre-allocated per thread at init), buffer indexing (`omp_get_thread_num()`), cache alignment (64 bytes), capacity formula. |
| 3   | `synchronization.md`     | SS3.3   | "Adjacent thread buffers must not share cache lines."                                                                               | **ACTIONABLE** | Reiterates the false sharing prevention requirement with the specific solution: "Pre-allocating each buffer at a cache-line-aligned address (64-byte boundary)."                                                             |
| 4   | `solver-workspaces.md`   | SS1.2   | "Workspaces should be padded to cache line boundaries (64 bytes) to prevent false sharing between adjacent workspaces in an array." | **ACTIONABLE** | Applied to the workspace array specifically.                                                                                                                                                                                 |
| 5   | `cut-management-impl.md` | SS1.1   | "Cache-line aligned (64 bytes) for efficient CSR assembly."                                                                         | **ACTIONABLE** | Applied to coefficient storage in the cut pool.                                                                                                                                                                              |

### 4.3 Hot-Path Allocation Avoidance Guidelines

| #   | File                     | Section | Guideline                                                                                                                 | Classification | Evidence                                                                                                                                                                                                                                                          |
| --- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `memory-architecture.md` | SS4.1   | "No heap allocation (malloc/new/Vec::push beyond capacity) is permitted during the SDDP hot path."                        | **ACTIONABLE** | Defines the hot path scope: forward pass LP solves, backward pass LP solves, and cut accumulation.                                                                                                                                                                |
| 2   | `memory-architecture.md` | SS4.2   | Pre-allocated components table (6 items)                                                                                  | **ACTIONABLE** | Enumerates all 6 pre-allocated components: solver instance, primal/dual buffers, RHS patch buffer, cut pool slots, cut accumulation buffers, MPI send/recv buffers. Each item specifies when it is pre-allocated, when it is reused, and the source spec section. |
| 3   | `memory-architecture.md` | SS4.3   | "In debug/test builds, an allocation tracker can detect unexpected hot-path allocations by hooking the global allocator." | **ACTIONABLE** | Describes a concrete implementation mechanism (allocator hook) for verifying the zero-allocation invariant.                                                                                                                                                       |

### 4.4 Struct Field Layout Guidance

| #   | File                     | Section | Guideline                                                                                                                  | Classification | Evidence                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `cut-management-impl.md` | SS4.2a  | `CutWireRecord` `#[repr(C)]` struct with explicit field ordering, explicit `_padding` field, and byte offset annotations   | **ACTIONABLE** | Complete struct layout: `slot_index` (offset 0, 4 bytes), `iteration` (offset 4, 4 bytes), `forward_pass_index` (offset 8, 4 bytes), `_padding` (offset 12, 4 bytes), `intercept` (offset 16, 8 bytes), `coefficients` (offset 24, variable). 8-byte alignment for `f64` fields guaranteed by explicit padding. |
| 2   | `cut-management-impl.md` | SS1.1   | Cut pool component layout: "Contiguous dense [f64] arrays, one per cut. Intercept array: Separate contiguous [f64] array." | **ACTIONABLE** | Separation of intercepts from coefficients to "avoid polluting cache during coefficient copy loops." This is a specific cache-friendly layout prescription.                                                                                                                                                     |

### 4.5 NUMA/Cache Findings

**F-016-005 (Low): No struct field ordering prescription for workspace data structures.** While the specs specify cache-line alignment for workspace array entries (`solver-workspaces.md` SS1.2) and cut accumulation buffers (`synchronization.md` SS3.1), they do not prescribe the internal field ordering of workspace structs (e.g., should the solver instance pointer be adjacent to the per-stage basis cache for cache locality?). This is acceptable because the workspace is thread-local (no false sharing concern for internal fields), and the dominant cache locality concern is the LP solver's internal memory layout (which is opaque and solver-managed).

**Assessment: SUFFICIENT.** The NUMA and cache guidance is predominantly ACTIONABLE: 12 of 15 guidelines provide specific alignment values (64 bytes), specific code paths (initialization sequence), or specific data structures (cut pool layout, workspace array). The 3 ASPIRATIONAL guidelines (one-rank-per-NUMA recommendation, NUMA latency reference table, and the absent field ordering prescription) are informational and do not block implementation.

---

## 5. ferrompi API Surface Match

This section verifies that every ferrompi API call referenced in the spec corpus uses method names and signatures matching the ferrompi crate's documented API in `backend-ferrompi.md` SS7.

### 5.1 Canonical ferrompi API (from `backend-ferrompi.md` SS7)

| Type              | Method            | Signature                                                                                                                | Notes                              |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `Mpi`             | `init_thread`     | `pub fn init_thread(required: ThreadLevel) -> Result<Self>`                                                              | Cobre uses `ThreadLevel::Multiple` |
| `Communicator`    | `rank`            | `pub fn rank(&self) -> i32`                                                                                              |                                    |
| `Communicator`    | `size`            | `pub fn size(&self) -> i32`                                                                                              |                                    |
| `Communicator`    | `allgatherv`      | `pub fn allgatherv<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], recvcounts: &[i32], displs: &[i32]) -> Result<()>` |                                    |
| `Communicator`    | `allreduce`       | `pub fn allreduce<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], op: ReduceOp) -> Result<()>`                        |                                    |
| `Communicator`    | `broadcast`       | `pub fn broadcast<T: MpiDatatype>(&self, data: &mut [T], root: i32) -> Result<()>`                                       |                                    |
| `Communicator`    | `barrier`         | `pub fn barrier(&self) -> Result<()>`                                                                                    |                                    |
| `Communicator`    | `split_shared`    | `pub fn split_shared(&self) -> Result<Communicator>`                                                                     |                                    |
| `SharedWindow<T>` | `allocate`        | `pub fn allocate(comm: &Communicator, count: usize) -> Result<Self>`                                                     |                                    |
| `SharedWindow<T>` | `remote_slice`    | `pub fn remote_slice(&self, rank: i32) -> Result<&[T]>`                                                                  |                                    |
| `SharedWindow<T>` | `local_slice_mut` | `pub fn local_slice_mut(&mut self) -> &mut [T]`                                                                          |                                    |
| `SharedWindow<T>` | `fence`           | `pub fn fence(&self) -> Result<()>`                                                                                      |                                    |

### 5.2 Stale API Name Audit

Report-008 identified 3 findings with stale API names. This audit confirms their current status and checks for additional stale references.

**Confirmed stale references from report-008:**

| Report-008 Finding | Stale Name              | Correct Name         | File(s)                     | Line(s)                                                                                                                   | Still Present?                                                    |
| ------------------ | ----------------------- | -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| F-003              | `split_shared_memory()` | `split_shared()`     | `communicator-trait.md`     | Line 370 (SS4.1 `split_local` docstring), Line 512 (SS4.3 leader determination note), Line 653 (cross-references section) | **YES -- confirmed still present in all 3 locations**             |
| F-004              | `split_shared_memory()` | `split_shared()`     | `communication-patterns.md` | Line 208 (cross-references section)                                                                                       | **YES -- confirmed still present**                                |
| F-005              | `init_with_threading()` | `Mpi::init_thread()` | `hybrid-parallelism.md`     | N/A                                                                                                                       | **NO -- not found; this was corrected when GAP-017 was resolved** |

**Note on report-008 F-004 scope:** Report-008 listed `hybrid-parallelism.md` as containing `split_shared_memory()` in 2 locations (F-004). Searching the current file content, `hybrid-parallelism.md` does not contain the string `split_shared_memory` -- it uses `split_local()` (the Cobre trait method name) and `split_shared()` (the ferrompi method name) correctly. The F-004 stale references in `hybrid-parallelism.md` were corrected during GAP-017 resolution. However, the `communication-patterns.md` cross-references entry (line 208) was not covered by report-008 and contains `split_shared_memory()`.

**New stale reference found:**

| Finding         | Stale Name              | Correct Name     | File                        | Line | Description                                                                                                                       |
| --------------- | ----------------------- | ---------------- | --------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| F-016-006 (Low) | `split_shared_memory()` | `split_shared()` | `communication-patterns.md` | 208  | Cross-references section: "ferrompi capabilities table, `SharedWindow<T>`, `split_shared_memory()`" -- should be `split_shared()` |

### 5.3 API Signature Consistency Check

Beyond naming, the following verifies that API call patterns in the wrapper code (`backend-ferrompi.md` SS1--SS3) match the SS7 reference:

| Wrapper Call Site                | Wrapper Signature                                             | SS7 API Signature                                                                                   | Match?                      |
| -------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------- |
| `allgatherv` (SS1.2)             | `self.world.allgatherv(send, recv, &i32_counts, &i32_displs)` | `allgatherv<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], recvcounts: &[i32], displs: &[i32])` | YES                         |
| `allreduce` (SS1.2)              | `self.world.allreduce(send, recv, mpi_op)`                    | `allreduce<T: MpiDatatype>(&self, send: &[T], recv: &mut [T], op: ReduceOp)`                        | YES                         |
| `broadcast` (SS1.2)              | `self.world.broadcast(buf, root as i32)`                      | `broadcast<T: MpiDatatype>(&self, data: &mut [T], root: i32)`                                       | YES                         |
| `barrier` (SS1.2)                | `self.world.barrier()`                                        | `barrier(&self) -> Result<()>`                                                                      | YES                         |
| `rank` (SS1.2)                   | `self.world.rank() as usize`                                  | `rank(&self) -> i32`                                                                                | YES (conversion documented) |
| `size` (SS1.2)                   | `self.world.size() as usize`                                  | `size(&self) -> i32`                                                                                | YES (conversion documented) |
| `split_shared` (SS3.1)           | `world.split_shared()`                                        | `split_shared(&self) -> Result<Communicator>`                                                       | YES                         |
| `SharedWindow::allocate` (SS3.1) | `ferrompi::SharedWindow::allocate(shared_comm, alloc_count)`  | `allocate(comm: &Communicator, count: usize) -> Result<Self>`                                       | YES                         |
| `remote_slice` (SS3.2)           | `self.window.remote_slice(0)`                                 | `remote_slice(&self, rank: i32) -> Result<&[T]>`                                                    | YES                         |
| `local_slice_mut` (SS3.2)        | `self.window.local_slice_mut()`                               | `local_slice_mut(&mut self) -> &mut [T]`                                                            | YES                         |
| `fence` (SS3.2)                  | `self.window.fence()`                                         | `fence(&self) -> Result<()>`                                                                        | YES                         |

**Report-008 F-001 (ferrompi::slurm module):** Report-008 noted that `slurm-deployment.md` references `ferrompi::slurm::local_rank()` and `ferrompi::slurm::cpus_per_task()`, but the SS7 API reference does not document a `slurm` module. This finding is inherited from report-008 and not re-audited here (per ticket instructions: "Do not re-audit the ferrompi crate API surface"). The finding remains open.

**Report-008 F-002 (Mpi RAII guard not stored):** Report-008 noted that the `FerrompiBackend` struct in SS1.1 does not store the `Mpi` guard, which means `MPI_Finalize` would be called when the `Mpi` instance goes out of scope in `new()`. This is an implementation correctness issue, not a naming issue, and is inherited from report-008 without re-audit.

### 5.4 ferrompi API Surface Findings

**F-016-006 (Low): Stale `split_shared_memory()` in `communication-patterns.md` cross-references.** Line 208 of `communication-patterns.md` references `split_shared_memory()` in the cross-references section. The correct ferrompi method name is `split_shared()`. This was not identified in report-008 (which focused on `communicator-trait.md` and `hybrid-parallelism.md`).

**F-016-007 (Low): Stale `split_shared_memory()` persists in `communicator-trait.md`.** Report-008 F-003 identified 3 locations in `communicator-trait.md` using `split_shared_memory()`. All 3 remain present (lines 370, 512, 653). These were not corrected during GAP-017 resolution, which focused on `backend-ferrompi.md` and `hybrid-parallelism.md`.

**Assessment: SUFFICIENT WITH GAPS.** All wrapper code in `backend-ferrompi.md` SS1--SS3 correctly matches the SS7 API reference. The `init_with_threading()` stale name from report-008 F-005 has been corrected. The `split_shared_memory()` stale references in `hybrid-parallelism.md` (report-008 F-004) have been corrected. However, 4 `split_shared_memory()` references remain: 3 in `communicator-trait.md` (report-008 F-003, still open) and 1 in `communication-patterns.md` (new finding F-016-006). None of these affect the wrapper implementation (which correctly uses `split_shared()`), but they create naming inconsistency in the spec corpus.

---

## 6. Summary Table

| Dimension                              | Verdict              | Finding Count | Blocking Findings |
| -------------------------------------- | -------------------- | :-----------: | :---------------: |
| MPI collective parameter specificity   | SUFFICIENT WITH GAPS |       2       |         0         |
| Threading model consistency            | SUFFICIENT WITH GAPS |       2       |         0         |
| NUMA and cache-awareness actionability | SUFFICIENT           |       1       |         0         |
| ferrompi API surface match             | SUFFICIENT WITH GAPS |       2       |         0         |

**Total findings: 7** (0 High, 3 Medium, 4 Low, 0 Blocking)

**Finding summary:**

| ID        | Severity | Dimension      | Description                                                                                                        |
| --------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| F-016-001 | Medium   | MPI parameters | Type mismatch: `work-distribution.md` SS3.2 uses `i32`/`Vec<i32>` for counts/displs; trait uses `usize`            |
| F-016-002 | Low      | MPI parameters | `cut-management-impl.md` SS4.1 uses raw MPI C names instead of trait method names                                  |
| F-016-003 | Medium   | Threading      | `training-loop.md` SS4.3 struct comment references "rayon thread pool size"                                        |
| F-016-004 | Low      | Threading      | `solver-workspaces.md` SS1.3a references rayon in test harness context                                             |
| F-016-005 | Low      | NUMA/cache     | No struct field ordering prescription for workspace internals (acceptable)                                         |
| F-016-006 | Low      | ferrompi API   | `communication-patterns.md` line 208: stale `split_shared_memory()` (new finding)                                  |
| F-016-007 | Low      | ferrompi API   | `communicator-trait.md` lines 370, 512, 653: stale `split_shared_memory()` (confirms report-008 F-003, still open) |

**Evidence sources:**

- HPC specs: all 15 files in `src/specs/hpc/` (communicator-trait, communication-patterns, work-distribution, synchronization, hybrid-parallelism, memory-architecture, shared-memory-aggregation, backend-ferrompi, backend-local, backend-tcp, backend-shm, backend-selection, backend-testing, slurm-deployment, checkpointing)
- Architecture specs: `training-loop.md`, `solver-workspaces.md`, `cut-management-impl.md`
- Prior reports: `report-006-cobre-comm.md`, `report-008-ferrompi.md`, `report-012-phase-1-4-readiness.md`
