# ticket-008 Audit ferrompi API Surface Completeness

## Context

### Background

ferrompi is an external Rust crate providing safe MPI bindings. It is a separate repository (not a workspace crate) consumed by cobre-comm when the `mpi` feature is enabled. It is Phase 3 in the implementation ordering (alongside cobre-solver). The ferrompi API reference was rewritten in gap-resolution ticket-022 (backend-ferrompi.md SS7, 913 lines) to match the real crate API at github.com/rjmalves/ferrompi.

### Relation to Epic

This is ticket 8 of 8 in the per-crate completeness audit. ferrompi is unique among the audited crates because it is an external dependency with an existing implementation. The audit verifies that the spec's API reference matches the real crate and that all needed primitives are documented.

### Current State

The ferrompi API surface is specified in:

- `src/specs/hpc/backend-ferrompi.md` SS7 -- ferrompi API Reference (913 lines of additions from ticket-022): Mpi RAII guard, Communicator, SharedWindow<T>, MpiDatatype trait, ThreadLevel, supporting types
- `src/specs/hpc/hybrid-parallelism.md` -- References ferrompi for MPI+rayon integration
- `src/specs/hpc/communication-patterns.md` -- References ferrompi collective operations
- `src/specs/hpc/shared-memory-aggregation.md` -- References ferrompi SharedWindow
- `src/specs/hpc/synchronization.md` -- References ferrompi barrier and fence operations
- `src/crates/ferrompi.md` -- Crate overview (77 lines)

## Specification

### Requirements

Audit ferrompi across five categories, with special attention to verifying the spec matches the real crate.

**Category 1: Public Types**

- `Mpi` RAII guard (initialization and finalization)
- `Communicator` type (not a trait -- ferrompi's concrete type)
- `SharedWindow<T>` for shared memory operations
- `MpiDatatype` trait (which Rust types implement it)
- `ThreadLevel` enum (Single, Funneled, Serialized, Multiple)
- `ReduceOp` or equivalent for collective operation types

**Category 2: Public Functions**

- `Mpi::init_thread(ThreadLevel)` -- initialization
- `Mpi::world()` -- get world communicator
- `Communicator::rank()`, `size()`, `barrier()`
- `Communicator::allreduce()`, `allgatherv()`, `broadcast()`
- `Communicator::split_shared()` -- shared memory communicator
- `SharedWindow::allocate()`, `local_slice()`, `remote_slice()`, `local_slice_mut()`
- `SharedWindow::fence()` -- one-sided synchronization
- Persistent collective operations (`allreduce_init` if documented)

**Category 3: Error Types**

- MPI error handling (does ferrompi return Result or panic on MPI errors?)
- Thread level initialization failure handling

**Category 4: Trait Implementations**

- `MpiDatatype` implementations for primitive types (f64, i32, u8, etc.)
- Send/Sync properties of ferrompi types

**Category 5: Crate Boundary Interactions**

- cobre-comm -> ferrompi: wraps all collective operations and SharedWindow
- cobre-comm calls `Mpi::init_thread(ThreadLevel::Multiple)` at startup

### Inputs/Props

- `src/specs/hpc/backend-ferrompi.md` (especially SS7)
- `src/specs/hpc/hybrid-parallelism.md`
- `src/specs/hpc/communication-patterns.md`
- `src/specs/hpc/shared-memory-aggregation.md`
- `src/specs/hpc/synchronization.md`
- `src/crates/ferrompi.md`

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-008-ferrompi.md`.

### Error Handling

Same as ticket-001. Additionally, if the spec references a ferrompi API that does not exist in the real crate, log it as a High-severity finding.

## Acceptance Criteria

- [ ] Given backend-ferrompi.md SS7, when the API reference is inspected, then every public type and function listed matches the API documented in the real ferrompi crate at github.com/rjmalves/ferrompi
- [ ] Given the Mpi RAII guard, when its lifecycle is inspected, then initialization (`init_thread`), world communicator access (`world()`), and finalization (Drop) are all documented
- [ ] Given the allgatherv operation, when its signature is inspected in the ferrompi API reference, then the variable-length buffer parameters (counts, displacements) are specified with concrete Rust types
- [ ] Given the SharedWindow type, when its operations are inspected, then allocate, local_slice, remote_slice, local_slice_mut, and fence are all documented with signatures
- [ ] Given the MpiDatatype trait, when its implementations are inspected, then at least f64, i32, u8 are documented as implementing MpiDatatype
- [ ] Given all references to ferrompi in hybrid-parallelism.md, communication-patterns.md, shared-memory-aggregation.md, and synchronization.md, when each reference is traced, then it uses the correct function/type names from the SS7 API reference (not the old speculative names from before ticket-022)

## Implementation Guide

### Suggested Approach

1. Read `src/crates/ferrompi.md` for overview
2. Read `src/specs/hpc/backend-ferrompi.md` SS7 fully -- this is the API reference rewritten in ticket-022
3. Compare against the real ferrompi crate at github.com/rjmalves/ferrompi (read the source or docs)
4. Check that all 5 HPC spec files that reference ferrompi use the correct API names
5. Verify that the SLURM helpers (`ferrompi::slurm`) documented in SS7 match the real crate

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-008-ferrompi.md`

### Patterns to Follow

Same as ticket-001. For ferrompi specifically, include a "Spec vs Real API" comparison column in the completeness matrix.

### Pitfalls to Avoid

- The ferrompi API reference was already rewritten in ticket-022 to match the real crate. This audit verifies correctness of that rewrite, not starting from scratch.
- Do not audit deferred ferrompi features (persistent collectives, CUDA-aware MPI) unless they are referenced in the minimal viable specs.
- The real ferrompi crate may have evolved since ticket-022. If possible, check the latest release for any API changes.

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-012 (Phase 1-4 readiness assessment uses this report)

## Effort Estimate

**Points**: 2
**Confidence**: High
