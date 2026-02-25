# ticket-001 Define Communicator Trait Method Signatures

## Context

### Background

The Cobre SDDP solver currently uses ferrompi APIs directly for all inter-rank communication. The communication surface is small and well-defined: exactly three collective operations during iterative training (allgatherv for trial points, allgatherv for cuts, allreduce for convergence statistics), plus two initialization-time operations (broadcast for case data, barrier for checkpoint synchronization). This ticket defines the `Communicator` trait that abstracts these operations into a backend-agnostic interface.

### Relation to Epic

This is the foundation ticket for Epic 01 and the entire plan. The `Communicator` trait defines the contract that all backend implementations must satisfy. Every subsequent ticket in every epic references this trait. ticket-002 (SharedMemoryProvider) is a companion trait with different semantics; ticket-003 (backend selection) and ticket-004 (cobre-comm crate) build on this trait.

### Current State

- `src/specs/hpc/communication-patterns.md` SS1.1 defines the three iterative collectives and two initialization collectives with their ferrompi API signatures
- `src/specs/hpc/communication-patterns.md` SS2 defines the data payloads for each operation (trial points: ~1.72 MB/stage, cuts: ~3.2 MB/stage, convergence: 32 bytes)
- `src/specs/hpc/communication-patterns.md` SS6 defines the deterministic communication invariant
- `src/specs/hpc/hybrid-parallelism.md` SS1.2 lists the ferrompi capabilities used: `Communicator` (Send + Sync), `SharedWindow<T>`, `split_shared_memory()`, `allreduce()`, `allgatherv()`, `broadcast()`
- `src/specs/hpc/synchronization.md` SS1.1 defines the three MPI sync points per iteration
- No `communicator-trait.md` file exists in the specs

## Specification

### Requirements

Create the file `src/specs/hpc/communicator-trait.md` with a **partial** spec containing the `Communicator` trait definition. This ticket writes Sections 1-3 of the spec (Purpose, Trait Definition, Method Contracts). Sections on SharedMemoryProvider (ticket-002), backend selection (ticket-003), and crate architecture (ticket-004) will be added by subsequent tickets or placed in separate spec files.

The trait must cover these five operations, derived from communication-patterns.md SS1.1:

| Operation  | Current ferrompi API                                  | Trait Method             |
| ---------- | ----------------------------------------------------- | ------------------------ |
| Allgatherv | `comm.allgatherv(&send, &mut recv, &counts, &displs)` | `fn allgatherv(...)`     |
| Allreduce  | `comm.allreduce(&send, &mut recv, Op::Sum)`           | `fn allreduce(...)`      |
| Broadcast  | `comm.bcast(&mut buf, root)`                          | `fn broadcast(...)`      |
| Barrier    | `comm.barrier()`                                      | `fn barrier(...)`        |
| Rank/Size  | `comm.rank()`, `comm.size()`                          | `fn rank()`, `fn size()` |

Plus these query methods:

- `fn rank(&self) -> usize` -- this process's rank (0-indexed)
- `fn size(&self) -> usize` -- total number of ranks in the communicator

### Inputs/Props

The spec author has these authoritative sources:

| Source Document             | Relevant Sections                 | What to Extract                                         |
| --------------------------- | --------------------------------- | ------------------------------------------------------- |
| `communication-patterns.md` | SS1.1 (operations summary)        | Complete list of collective operations and their APIs   |
| `communication-patterns.md` | SS2 (data payloads)               | Payload types and sizes for method signatures           |
| `communication-patterns.md` | SS6 (deterministic communication) | Determinism contracts for the trait                     |
| `hybrid-parallelism.md`     | SS1.2 (ferrompi capabilities)     | `Send + Sync` requirement, thread safety                |
| `synchronization.md`        | SS1.1 (sync points)               | When each operation is called in the SDDP loop          |
| `work-distribution.md`      | SS3.2 (MPI collective parameters) | `sendcount`, `recvcounts`, `displs` types and semantics |
| `design-principles.md`      | SS5 (Rust + FFI strategy)         | Static dispatch, zero-cost abstractions preference      |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/communicator-trait.md` containing:

1. **Purpose section**: One paragraph explaining the trait's role as a backend abstraction for SDDP collective operations
2. **SS1 Trait Definition**: The full `pub trait Communicator: Send + Sync` with all method signatures in a Rust code block
3. **SS2 Method Contracts**: For each method, a subsection with:
   - **Preconditions**: What must be true before calling
   - **Postconditions**: What is guaranteed after return
   - **Determinism**: Whether the operation is deterministic across backends
   - **Error semantics**: What errors can occur and how they are reported
   - **Thread safety**: How the method interacts with concurrent OpenMP threads
4. **SS3 Generic Parameterization**: How the training loop and other callers use `<C: Communicator>` generics for static dispatch

### Error Handling

The trait must define a `CommError` type for fallible operations. The spec should specify:

- Allgatherv can fail if buffer sizes are inconsistent
- Allreduce can fail on communication errors
- Broadcast can fail on communication errors
- Barrier can fail if a rank crashes (timeout-based detection for non-MPI backends)
- All errors are fatal for SDDP -- there is no partial failure recovery model

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/communicator-trait.md` does not exist, when the ticket is completed, then the file exists with Sections 1-3
- [ ] Given the spec exists, when reading SS1, then a `pub trait Communicator: Send + Sync` code block contains methods for allgatherv, allreduce, broadcast, barrier, rank, and size
- [ ] Given the spec exists, when reading SS2, then each of the six methods has a contract subsection with preconditions, postconditions, determinism guarantee, error semantics, and thread safety notes
- [ ] Given the spec exists, when reading the allgatherv contract, then it specifies that received data is ordered by rank (rank 0, rank 1, ..., rank R-1) for determinism
- [ ] Given the spec exists, when reading the allreduce contract, then it specifies both `Sum` and `Min` reduction operations (needed for convergence statistics per communication-patterns.md SS2.3)
- [ ] Given the spec exists, when reading SS3, then it shows a generic training loop signature `fn train<C: Communicator>(comm: &C, ...)` with rationale for static dispatch over dynamic dispatch
- [ ] Given the spec exists, when reading the error type definition, then a `CommError` enum or trait is defined with variants covering the failure modes listed in Error Handling above
- [ ] Given the spec exists, when checking cross-references, then it references communication-patterns.md SS1.1, SS2, SS6; hybrid-parallelism.md SS1.2; synchronization.md SS1.1; work-distribution.md SS3.2
- [ ] Given `mdbook build` is run from the repo root, then the build succeeds (the file is not in SUMMARY.md yet; unreferenced files are allowed)

## Implementation Guide

### Suggested Approach

1. Create the file `src/specs/hpc/communicator-trait.md`
2. Write the Purpose section: a single paragraph explaining that this trait abstracts the five collective operations used by SDDP (allgatherv, allreduce, broadcast, barrier, rank/size) behind a backend-agnostic interface, enabling pluggable communication backends while preserving determinism and zero-cost abstraction via static dispatch
3. Write SS1 (Trait Definition):
   - Open with a Rust code block showing the complete `pub trait Communicator: Send + Sync` definition
   - Method signatures should use generic `T: CommData` bounds for payload types (define `CommData` as `Send + Sync + Copy + 'static` -- the types that can be communicated)
   - `allgatherv` signature: takes `&self`, send buffer `&[T]`, receive buffer `&mut [T]`, counts `&[usize]`, displacements `&[usize]` -> `Result<(), CommError>`
   - `allreduce` signature: takes `&self`, send buffer `&[T]`, receive buffer `&mut [T]`, operation `ReduceOp` -> `Result<(), CommError>` where `ReduceOp` is an enum `{Sum, Min, Max}`
   - `broadcast` signature: takes `&self`, buffer `&mut [T]`, root rank `usize` -> `Result<(), CommError>`
   - `barrier` signature: takes `&self` -> `Result<(), CommError>`
   - `rank` signature: takes `&self` -> `usize` (infallible)
   - `size` signature: takes `&self` -> `usize` (infallible)
   - Define `ReduceOp` enum after the trait
   - Define `CommData` trait bound
   - Define `CommError` enum
4. Write SS2 (Method Contracts): one subsection per method (SS2.1 allgatherv, SS2.2 allreduce, SS2.3 broadcast, SS2.4 barrier, SS2.5 rank/size)
   - For allgatherv: emphasize rank-ordered receive for determinism; specify that `counts[r]` = number of elements from rank `r`, `displs[r]` = offset in receive buffer for rank `r`; note that this is the most performance-critical operation (~587 MB/iteration at production scale per communication-patterns.md SS3.1)
   - For allreduce: specify that `Sum` and `Min` operations must be supported (convergence stats use both per communication-patterns.md SS2.3 Note); note floating-point non-determinism for `Sum` is acceptable per communication-patterns.md SS6.2
   - For broadcast: specify root rank semantics; this is initialization-only (case data)
   - For barrier: specify that all ranks must call barrier; note this is checkpoint-only
   - For rank/size: infallible, constant after initialization
5. Write SS3 (Generic Parameterization):
   - Show the training loop generic signature
   - Explain monomorphization: for each backend, the compiler generates specialized code, eliminating virtual dispatch overhead
   - Note that this is consistent with design-principles.md SS5 (Rust + zero-cost abstractions)
6. Add Cross-References section

### Key Files to Modify

| File                                  | Action                                  |
| ------------------------------------- | --------------------------------------- |
| `src/specs/hpc/communicator-trait.md` | **CREATE** -- New spec document (SS1-3) |

### Patterns to Follow

- **Spec structure pattern**: Follow `communication-patterns.md` for Purpose + numbered sections + tables + cross-references layout
- **Rust code block pattern**: Follow `solver-abstraction.md` for trait definition code blocks with doc comments
- **Contract pattern**: Follow `solver-workspaces.md` for precondition/postcondition style
- **Cross-reference pattern**: Use `[Section Name](./file.md)` relative links per established convention

### Pitfalls to Avoid

- Do NOT include `SharedWindow<T>` operations in this trait -- those are a separate trait (ticket-002) because shared memory has fundamentally different lifetime semantics than message-passing collectives
- Do NOT define backend implementations -- those are Epic 02 tickets
- Do NOT add the file to SUMMARY.md yet -- ticket-012 handles SUMMARY.md updates
- Do NOT use dynamic dispatch (`dyn Communicator`) -- the design decision is static dispatch via generics for zero-cost abstraction
- Do NOT add `split_shared_memory()` to this trait -- that is part of SharedMemoryProvider (ticket-002)
- Do NOT over-specify the wire format -- the trait defines semantics, not implementation details

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket producing a markdown specification file).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (first ticket in the plan)
- **Blocks**: ticket-002, ticket-003, ticket-004, ticket-005, ticket-006, ticket-007, ticket-008

## Effort Estimate

**Points**: 4
**Confidence**: High
