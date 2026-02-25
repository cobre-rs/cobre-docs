# Synchronization

## Purpose

This spec defines the synchronization architecture for Cobre: the complete set of communication synchronization points through the `Communicator` trait ([Communicator Trait SS1](./communicator-trait.md)) during SDDP iterations, the forward-to-backward transition, per-stage barrier semantics in the backward pass, and thread coordination within a rank. This spec details the synchronization mechanics that [Training Loop](../architecture/training-loop.md) and [Work Distribution](./work-distribution.md) describe at the algorithmic and distribution levels.

## 1. Communication Synchronization Points

### 1.1 Synchronization Summary

The following table lists all communication synchronization points in a single SDDP iteration. There are three types of collective calls per iteration: one post-forward `allgatherv` for visited states, one `allgatherv` per backward stage ($T-1$ calls total), and one post-backward `allreduce` for convergence — totaling $T+1$ collective operations. For method contracts and determinism guarantees, see [Communicator Trait SS2](./communicator-trait.md).

| Phase              | Operation    | Data Exchanged                                              | Direction       |
| ------------------ | ------------ | ----------------------------------------------------------- | --------------- |
| Forward → Backward | `allgatherv` | Visited states (trial points) from all forward trajectories | All ranks ↔ all |
| Backward stage $t$ | `allgatherv` | New cuts generated at stage $t$ by each rank                | All ranks ↔ all |
| Post-backward      | `allreduce`  | Convergence statistics (4 scalars — see §1.3)               | All ranks ↔ all |

### 1.2 Forward Pass: No Per-Stage Synchronization

The forward pass has **no per-stage synchronization barrier**. Each thread solves its assigned trajectories independently from stage $t = 1$ to $T$. No MPI communication occurs during the forward pass itself — each rank processes its contiguous block of scenarios without coordinating with other ranks.

### 1.3 Forward-to-Backward Transition

After all forward trajectories complete within a rank, the rank contributes its visited states to an `allgatherv` call. After this call, every rank has the complete set of trial points from all forward trajectories across all ranks. This is the **only** synchronization point between the forward and backward passes.

The post-forward `allreduce` aggregates convergence statistics:

| Quantity                            | Reduction       | Purpose                                |
| ----------------------------------- | --------------- | -------------------------------------- |
| First-stage LP objective            | `ReduceOp::Min` | Lower bound (monotonically increasing) |
| Total forward cost (sum)            | `ReduceOp::Sum` | Upper bound mean computation           |
| Total forward cost (sum of squares) | `ReduceOp::Sum` | Upper bound variance computation       |
| Trajectory count                    | `ReduceOp::Sum` | Denominator for mean/variance          |

See [Work Distribution §1.4](./work-distribution.md) and [Convergence Monitoring §3](../architecture/convergence-monitoring.md).

### 1.4 Backward Pass: Per-Stage Barrier

The backward pass has a **hard synchronization barrier at each stage boundary**. At each stage $t$ (walking from $T$ down to 2):

1. All ranks evaluate their assigned trial points and generate cuts (parallel across ranks and threads)
2. `allgatherv` collects all new cuts from all ranks — after this call, every rank has the complete set of new cuts for stage $t$
3. All ranks add the new cuts to stage $t-1$'s cut pool
4. Only then do ranks proceed to stage $t-1$

The `allgatherv` acts as an implicit barrier — no rank can proceed to stage $t-1$ until all ranks have contributed their cuts for stage $t$. This barrier is mandatory because the cuts generated at stage $t$ must be available when solving backward LPs at stage $t-1$ (the backward pass uses $V_{t+1}^k$, the current iteration's approximation). See [Training Loop §6.3](../architecture/training-loop.md) and [Work Distribution §2.2](./work-distribution.md).

### 1.5 Iteration Boundary

No explicit communication synchronization is required between iterations. The convergence monitor evaluates stopping rules locally on each rank using the aggregated statistics from §1.3. All ranks reach the same termination decision deterministically (same data, same rules).

An optional checkpoint barrier (`barrier`) may occur every $N$ iterations if checkpointing is enabled — see [Checkpointing](./checkpointing.md).

## 2. Thread Coordination Within Rank

Thread coordination within a rank uses OpenMP synchronization primitives, accessed via the C FFI wrapper described in [Hybrid Parallelism §5](./hybrid-parallelism.md).

### 2.1 Forward Pass Thread Coordination

No explicit thread synchronization during the forward pass. Each thread owns complete trajectories (thread-trajectory affinity) and solves them independently. The OpenMP parallel region's implicit barrier at the end ensures all threads have completed before the rank proceeds to the `allgatherv` for trial point collection.

### 2.2 Backward Pass Thread Coordination

At each backward stage $t$, threads within a rank coordinate in two phases:

**Phase 1 — Parallel evaluation**: Each thread evaluates its assigned trial points, solving all openings sequentially per trial point. Each thread accumulates its generated cuts in a thread-local buffer (no shared writes, no contention). See §3.

**Phase 2 — Collection and communication**: The OpenMP parallel region ends (implicit barrier ensures all threads have finished). The rank's main thread collects cuts from all thread-local buffers and participates in the inter-rank `allgatherv`.

This two-phase pattern repeats for each stage from $T$ down to 2.

### 2.3 Synchronization Primitives

| Primitive               | Usage                                                     | Source                                             |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| OpenMP implicit barrier | End of parallel region — ensures all threads complete     | Automatic at `}` of `#pragma omp parallel`         |
| OpenMP explicit barrier | If needed within a parallel region (not expected in v1.0) | `#pragma omp barrier` via C FFI                    |
| Thread-local storage    | Per-thread cut buffers, solver workspaces                 | OpenMP thread ID indexing into pre-allocated array |

The approved architecture does not require custom spin barriers or lock-free data structures for thread synchronization. OpenMP's implicit barrier at the end of parallel regions provides the necessary synchronization point between the parallel evaluation phase and the single-threaded MPI collection phase.

## 3. Cut Accumulation Pattern

### 3.1 Thread-Local Accumulation

During the backward pass parallel evaluation phase, each thread accumulates cuts in its own buffer. The buffers are indexed by OpenMP thread ID and pre-allocated at initialization. This design has zero contention during the hot loop — each thread writes exclusively to its own buffer.

| Property          | Value                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Buffer allocation | Pre-allocated per thread at initialization                                            |
| Buffer indexing   | OpenMP thread ID (`omp_get_thread_num()`)                                             |
| Contention        | None — pure thread-local writes                                                       |
| Cache alignment   | Each buffer starts on a cache line boundary (64 bytes) to prevent false sharing       |
| Capacity          | Sized for expected cuts per thread per stage ($\lceil M / N_{\text{threads}} \rceil$) |

### 3.2 Collection and Merge

After the OpenMP parallel region ends (implicit barrier), the rank's main thread collects all cuts from the per-thread buffers into a single contiguous array. This array is then used as the send buffer for `allgatherv`.

### 3.3 False Sharing Prevention

Adjacent thread buffers must not share cache lines. If two threads' buffers share a cache line, a write by one thread invalidates the cache line for the other, causing expensive cache coherency traffic. Pre-allocating each buffer at a cache-line-aligned address (64-byte boundary) eliminates this. See [Memory Architecture](./memory-architecture.md) for cache-line alignment conventions.

## 4. Asymmetry Summary

| Property                  | Forward Pass                                 | Backward Pass                                                |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| Per-stage synchronization | None                                         | `allgatherv` at every stage                                  |
| Thread coordination       | None (independent trajectories)              | Implicit OpenMP barrier between evaluation and collection    |
| Data flow direction       | Each thread accumulates independently        | Thread-local → rank-local merge → inter-rank `allgatherv`    |
| Parallelism grain         | Trajectory (coarse)                          | Trial point (coarse), openings sequential within trial point |
| Post-phase aggregation    | `allgatherv` (states) + `allreduce` (bounds) | Convergence check after all stages complete                  |

## Cross-References

- [Training Loop §4.3](../architecture/training-loop.md) — Forward pass parallel distribution, post-forward `allreduce`
- [Training Loop §5.2](../architecture/training-loop.md) — State extraction and `allgatherv` for trial point collection
- [Training Loop §6.3](../architecture/training-loop.md) — Backward pass stage synchronization barrier, `allgatherv` for cuts
- [SDDP Algorithm §3.4](../math/sddp-algorithm.md) — Backward pass hard barrier, forward pass no barrier, thread-trajectory affinity
- [Work Distribution §1.4](./work-distribution.md) — Post-forward `allreduce` with 4 convergence quantities
- [Work Distribution §2.2](./work-distribution.md) — Per-stage backward pass execution (6 steps including barrier)
- [Hybrid Parallelism §5](./hybrid-parallelism.md) — OpenMP C FFI wrapper primitives, implicit barriers
- [Convergence Monitoring](../architecture/convergence-monitoring.md) — Stopping rule evaluation using aggregated statistics
- [Communication Patterns](./communication-patterns.md) — collective operations via Communicator trait: `allgatherv`, `allreduce`
- [Communicator Trait SS2](./communicator-trait.md) — Method contracts for allgatherv, allreduce, barrier
- [Memory Architecture](./memory-architecture.md) — Cache-line alignment conventions, NUMA-local allocation
