# ticket-008 Specify Shared-Memory Backend Implementation

## Context

### Background

The shared-memory (shm) backend enables multi-process SDDP on a single node using OS shared memory primitives (POSIX `shm_open`/`mmap` on Linux/macOS) without MPI. This backend targets single-node deployments where multiple processes exploit NUMA locality (like MPI ranks) but MPI installation is unavailable. Unlike the TCP backend, the shm backend provides true shared memory for the `SharedMemoryProvider` trait, enabling the memory-saving benefits of `SharedWindow<T>` (scenario storage, cut pool sharing) without MPI windows.

### Relation to Epic

This is the fourth and final backend implementation ticket. The shm backend is the most specialized alternative backend: it combines the multi-process capability of TCP with the shared memory capability of ferrompi, but restricted to a single node. It is most useful for Python multi-process execution on workstations and single-node containers.

### Current State

- `src/specs/hpc/shared-memory-aggregation.md` SS1 defines the leader allocation pattern and shared data candidates
- `src/specs/hpc/communication-patterns.md` SS5 describes `SharedWindow<T>` semantics
- `src/specs/hpc/hybrid-parallelism.md` SS1.3 defines the shared memory layout
- No OS-level shared memory spec exists in the Cobre corpus
- POSIX shared memory is widely available on Linux and macOS, the two target platforms

## Specification

### Requirements

Create the file `src/specs/hpc/backend-shm.md` specifying the shared-memory backend. The spec must cover:

1. **Architecture**: Multiple processes on the same node communicate via shared memory regions and lightweight synchronization primitives
2. **Collective implementation**: How collectives are implemented using shared memory buffers and atomic synchronization rather than network messages:
   - `allgatherv`: Each rank writes to its slot in a shared buffer; barrier; all ranks read the complete buffer
   - `allreduce`: Each rank writes to its slot; barrier; rank 0 reduces; barrier; all ranks read result
   - `broadcast`: Root writes to shared buffer; barrier; all ranks read
   - `barrier`: Atomic counter + futex/condvar
3. **SharedMemoryProvider**: Full implementation using POSIX shared memory (not HeapFallback)
4. **Process coordination**: How processes discover each other and synchronize startup
5. **NUMA considerations**: How shared memory regions interact with NUMA policies
6. **Feature gating**: Available when `features = ["shm"]` is enabled
7. **Single-node restriction**: This backend only works for processes on the same physical node

### Inputs/Props

| Source Document                | Relevant Sections                  | What to Extract                      |
| ------------------------------ | ---------------------------------- | ------------------------------------ |
| `shared-memory-aggregation.md` | SS1 (SharedWindow usage, leader)   | Allocation patterns, data candidates |
| `communication-patterns.md`    | SS5 (SharedWindow), SS2 (payloads) | Shared memory semantics, data sizes  |
| `hybrid-parallelism.md`        | SS1.3 (layout), SS4.4 (NUMA)       | Memory layout, NUMA policies         |
| `communicator-trait.md`        | SS1-SS4 (traits)                   | Trait signatures to implement        |
| `backend-selection.md`         | SS2 (per-backend config)           | Environment variable names for shm   |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/backend-shm.md` containing:

1. **Purpose**: One paragraph on the shm backend's role as a single-node multi-process backend with true shared memory
2. **SS1 Architecture**: Process model, shared memory layout, synchronization primitives
3. **SS2 Process Coordination**: Named shared memory segment discovery, startup synchronization
4. **SS3 Collective Protocols**: How each collective is implemented using shared memory buffers
5. **SS4 SharedMemoryProvider**: Full POSIX shared memory implementation of the trait
6. **SS5 NUMA Considerations**: Interaction with NUMA allocation policies, first-touch implications
7. **SS6 Platform Requirements**: POSIX shm APIs, Linux/macOS support, no Windows support
8. **SS7 Configuration**: Environment variables (`COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE`)
9. **Cross-References** section

### Error Handling

- Shared memory creation failure: `CommError::InitFailed` with OS error
- Process crash during collective: Detected via watchdog or timeout on atomic wait
- Name collision on shared memory segment: Use unique names with PID or UUID suffix

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/backend-shm.md` does not exist, when the ticket is completed, then the file exists
- [ ] Given the spec exists, when reading SS1, then the architecture describes multiple processes sharing memory regions via POSIX shm_open/mmap
- [ ] Given the spec exists, when reading SS2, then the startup protocol specifies: rank 0 creates the named shared memory segment, other ranks open it by name, all ranks synchronize via a barrier in the shared region
- [ ] Given the spec exists, when reading SS3, then each collective operation is specified using shared memory buffers with atomic synchronization (not TCP sockets)
- [ ] Given the spec exists, when reading SS3, then `allgatherv` is specified as: each rank writes to its designated offset in a shared buffer -> barrier -> all ranks read the complete buffer. Data ordering is by rank for determinism
- [ ] Given the spec exists, when reading SS4, then `SharedMemoryProvider` is fully implemented using POSIX shared memory (not HeapFallback), with `create_shared_region` calling `shm_open` + `mmap`
- [ ] Given the spec exists, when reading SS5, then NUMA implications are discussed: shared memory regions may span NUMA domains, first-touch policy applies, and the performance trade-off vs. per-rank memory is acknowledged
- [ ] Given the spec exists, when reading SS6, then platform requirements state Linux and macOS support, with POSIX shm APIs (`shm_open`, `shm_unlink`, `mmap`, `munmap`)
- [ ] Given the spec exists, when reading SS7, then `COBRE_SHM_NAME`, `COBRE_SHM_RANK`, `COBRE_SHM_SIZE` are documented

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-shm.md`
2. Write Purpose: The shared-memory backend enables multi-process SDDP on a single node using OS shared memory primitives. It provides both collective communication (via shared buffers) and true shared memory regions (via POSIX shm) for the `SharedMemoryProvider` trait. This backend combines the multi-process parallelism of MPI with single-node shared memory, without requiring MPI installation.
3. For SS1, describe the architecture:
   - Each process is an independent OS process (not threads) with its own address space
   - Shared memory regions are created via `shm_open` + `mmap`, visible to all processes on the same node
   - A control region (small shared buffer) holds synchronization primitives: atomic counters, mutex/futex for barrier
   - Data regions hold collective buffers and shared data (opening tree, case data)
4. For SS2, describe process coordination:
   - Rank 0 creates a named shared memory segment `COBRE_SHM_NAME` (e.g., `/cobre_comm_<uuid>`)
   - Rank 0 initializes the control region (atomic rank counter, barrier state, total size)
   - Ranks 1..R-1 open the segment by name and map it
   - All ranks register via atomic increment of the rank counter
   - Rank 0 waits for all R ranks to register, then sets a "ready" flag
5. For SS3, specify collectives using shared memory:
   - **allgatherv**: Each rank writes its data to offset `displs[rank] * sizeof(T)` in a shared data buffer. Then a shared barrier (atomic counter reaches R). After barrier, all ranks can read the complete buffer.
   - **allreduce**: Each rank writes its data to a per-rank slot. Barrier. Rank 0 reads all slots and computes the reduction. Writes result to a designated output slot. Barrier. All ranks read the result.
   - **broadcast**: Root writes to the shared buffer. Barrier. All ranks read.
   - **barrier**: Atomic counter incremented by each rank. Futex/condvar wait until counter reaches R. Counter reset for next barrier.
6. For SS4, describe POSIX shm implementation of SharedMemoryProvider:
   - `create_shared_region<T>(count)` -> `shm_open(name, O_CREAT|O_RDWR)` + `ftruncate(count * sizeof(T))` + `mmap`
   - `as_slice()` -> pointer dereference into mmaped region
   - `fence()` -> memory fence (`std::sync::atomic::fence(SeqCst)`) + shared barrier
   - `Drop` -> `munmap` + `shm_unlink` (rank 0 only)
7. For SS5, discuss NUMA: shared memory regions allocated by rank 0 may be on rank 0's NUMA node. First-touch initialization (each rank touches its portion first) can distribute pages across NUMA nodes if the OS supports NUMA-aware page placement for shared memory.
8. For SS6, specify platform requirements
9. For SS7, document environment variables
10. Add Cross-References

### Key Files to Modify

| File                           | Action                          |
| ------------------------------ | ------------------------------- |
| `src/specs/hpc/backend-shm.md` | **CREATE** -- New spec document |

### Patterns to Follow

- **Backend spec pattern**: Follow the structure established by ticket-005 (backend-ferrompi.md)
- **Shared memory pattern**: Reference shared-memory-aggregation.md SS1.1 for the leader/follower allocation model

### Pitfalls to Avoid

- Do NOT specify multi-node shared memory -- this backend is single-node only. Multi-node requires the TCP or ferrompi backend.
- Do NOT use System V shared memory (`shmget`/`shmat`) -- POSIX shared memory (`shm_open`/`mmap`) is the modern standard
- Do NOT add SUMMARY.md entries -- ticket-012 handles that
- Do NOT specify Windows support -- Cobre targets Linux HPC and macOS development

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (Communicator trait), ticket-002 (SharedMemoryProvider trait), ticket-003 (backend selection with shm config)
- **Blocks**: ticket-014 (Python multi-process uses shm backend), ticket-017 (testing spec)

## Effort Estimate

**Points**: 4
**Confidence**: High
