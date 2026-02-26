# ticket-006 Audit cobre-comm API Surface Completeness

## Context

### Background

cobre-comm provides the communication backend abstraction: the Communicator trait, the MPI backend (wrapping ferrompi), the Local backend (for single-process testing), and the backend selection factory. It is Phase 4 in the implementation ordering and depends on ferrompi (via the `mpi` Cargo feature).

### Relation to Epic

This is ticket 6 of 8 in the per-crate completeness audit. cobre-comm has a relatively focused API surface centered on the Communicator trait and its two backends.

### Current State

The cobre-comm API surface is specified in:

- `src/specs/hpc/communicator-trait.md` -- Communicator trait (658 lines), collective operations, topology queries
- `src/specs/hpc/backend-selection.md` -- Backend selection factory, feature flag mechanism (548 lines)
- `src/specs/hpc/backend-ferrompi.md` -- MPI backend wrapping ferrompi (1255 lines), includes ferrompi API reference (SS7)
- `src/specs/hpc/backend-local.md` -- Local single-process backend (280 lines)
- `src/specs/hpc/backend-testing.md` -- Backend conformance tests (479 lines)
- `src/crates/comm.md` -- Crate overview (332 lines)

## Specification

### Requirements

Audit cobre-comm across five categories.

**Category 1: Public Types**

- Communicator trait definition (all methods)
- MpiCommunicator struct
- LocalCommunicator struct
- ReduceOp enum (Sum, Min, Max)
- CommError type
- Backend selection configuration types

**Category 2: Public Functions**

- `create_communicator()` factory function (from backend-selection.md)
- All Communicator trait methods: allreduce, allgatherv, broadcast, barrier, rank(), size(), is_root()
- Backend-specific initialization functions

**Category 3: Error Types**

- CommError type and its relationship to cobre-core error types
- Per-method error contracts (which methods can fail, under what conditions)

**Category 4: Trait Implementations**

- MpiCommunicator implements Communicator
- LocalCommunicator implements Communicator
- Behavioral contracts for each method in each backend

**Category 5: Crate Boundary Interactions**

- cobre-comm -> ferrompi: wraps MPI primitives
- cobre-comm -> cobre-core: error type integration
- cobre-sddp -> cobre-comm: calls collectives for cut sync and bound sync

### Inputs/Props

- `src/specs/hpc/communicator-trait.md`
- `src/specs/hpc/backend-selection.md`
- `src/specs/hpc/backend-ferrompi.md`
- `src/specs/hpc/backend-local.md`
- `src/crates/comm.md`

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-006-cobre-comm.md`.

### Error Handling

Same as ticket-001.

## Acceptance Criteria

- [ ] Given communicator-trait.md, when all Communicator trait methods are enumerated, then each method has a concrete Rust signature with type parameters for the data being communicated
- [ ] Given the allgatherv method, when its signature is inspected, then the variable-length buffer handling (counts array, displacement calculation) is specified with concrete types
- [ ] Given the backend-selection.md factory function, when its signature is inspected, then the feature flag mechanism (MPI vs Local) is documented with compile-time selection
- [ ] Given the MpiCommunicator implementation in backend-ferrompi.md, when each Communicator method is traced to the corresponding ferrompi call, then every mapping is documented
- [ ] Given the LocalCommunicator in backend-local.md, when its behavioral contract is inspected, then single-process semantics for each collective operation (e.g., allreduce is identity, allgatherv returns input) are documented
- [ ] Given GAP-033 (generic bounds inconsistency), when the current state is inspected, then the report documents whether the Communicator + SharedMemoryProvider bound question is resolved

## Implementation Guide

### Suggested Approach

1. Read `src/crates/comm.md` for overview (this is unusually detailed at 332 lines)
2. Read `src/specs/hpc/communicator-trait.md` for the trait definition
3. Read `src/specs/hpc/backend-ferrompi.md` for the MPI backend and ferrompi API reference
4. Read `src/specs/hpc/backend-local.md` for the local backend
5. Read `src/specs/hpc/backend-selection.md` for the factory function
6. Cross-reference GAP-033 for the generic bounds question

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-006-cobre-comm.md`

### Patterns to Follow

Same as ticket-001.

### Pitfalls to Avoid

- Do not audit the TCP backend (deferred) or shm backend (deferred). Only verify they do not pollute the Communicator trait contract.
- GAP-033 (generic bounds inconsistency) is a Low-severity gap. Document its current state objectively.
- The ferrompi API reference in backend-ferrompi.md SS7 was rewritten in gap-resolution ticket-022. Verify it matches the real crate API.

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
