# ferrompi

<span class="status-experimental">experimental</span>

## Overview

ferrompi provides safe, idiomatic Rust bindings for MPI. It is the backbone
for all process-level parallelism in Cobre, covering inter-node communication,
intra-node shared memory, and topology detection. All MPI communicator handles
exposed by ferrompi implement `Send + Sync`, enabling hybrid MPI+threads
parallelism without `unsafe` sharing of raw `MPI_Comm` handles.

A central capability is `SharedWindow<T>`, which allows MPI ranks on the same
physical node to share memory regions without replication. In SDDP workloads,
this is used for scenario storage and the cut pool -- large data structures
that would otherwise be duplicated across every rank within a node. Combined
with `split_shared_memory()` for grouping co-located ranks, `SharedWindow<T>`
reduces per-node memory footprint by an order of magnitude compared to
per-rank replication.

ferrompi also provides collective operations (`allreduce`, `allgatherv`,
`broadcast`) used for cut synchronization, bound aggregation, and
configuration broadcast during SDDP training. MPI 4.0 persistent collective
support (`allgatherv_init`, `allreduce_init`) allows pre-negotiating
communication patterns at initialization and reusing them across iterations,
amortizing setup cost. Topology query APIs and SLURM integration enable
automatic detection of node boundaries and NUMA domain layout, which drives
the rank-per-NUMA-domain deployment strategy.

ferrompi is a **separate repository** from the Cobre workspace. It is
published as an independent crate because safe MPI bindings are useful beyond
hydrothermal dispatch, but it is a critical dependency for all HPC
functionality in Cobre.

## Key Concepts

- **Thread-safe communicators** -- `Communicator` is `Send + Sync`, enabling
  hybrid MPI+OpenMP without unsafe code. Initialized with
  `init_with_threading(ThreadLevel::Multiple)` for full MPI thread support.
  See [Hybrid Parallelism](../specs/hpc/hybrid-parallelism.md).

- **SharedWindow\<T\>** -- Zero-copy shared memory regions across ranks on
  the same physical node. Used for scenario storage (read-only) and the cut
  pool (read-heavy, written at stage boundaries). Write visibility is ensured
  via `window.fence()`.
  See [Communication Patterns](../specs/hpc/communication-patterns.md) and
  [Shared Memory Aggregation](../specs/hpc/shared-memory-aggregation.md).

- **Collective operations** -- `allreduce()`, `allgatherv()`, and
  `broadcast()` with generic, type-safe APIs. These are the only MPI
  operations used during SDDP training -- no point-to-point messaging.
  Persistent collective variants are available for amortizing setup cost
  across iterations.
  See [Communication Patterns](../specs/hpc/communication-patterns.md).

- **SLURM integration** -- Topology query APIs that read resource allocations
  from the scheduler environment (`SLURM_CPUS_PER_TASK`, `SLURM_MEM_PER_NODE`)
  to configure thread counts and memory budgets without manual specification.
  See [SLURM Deployment](../specs/hpc/slurm-deployment.md).

- **Topology detection** -- `split_shared_memory()` groups co-located ranks
  into intra-node communicators for shared memory operations. NUMA domain
  mapping supports the one-rank-per-NUMA-domain deployment model.
  See [Hybrid Parallelism](../specs/hpc/hybrid-parallelism.md).

- **Synchronization protocol** -- MPI synchronization points in the SDDP
  training loop: three collective calls per iteration (forward `Allreduce`,
  backward `Allgatherv`, convergence `Allreduce`), forward-to-backward
  transition barriers, and per-stage backward synchronization.
  See [Synchronization](../specs/hpc/synchronization.md).

## Status

ferrompi is in the **design phase**. The HPC specs linked above define the
behavioral requirements and API surface that ferrompi must satisfy. No Rust
code has been published yet; the crate placeholder exists to reserve the
module boundary and document the dependency relationship.
