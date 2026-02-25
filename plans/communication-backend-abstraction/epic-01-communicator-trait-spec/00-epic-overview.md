# Epic 01: Communicator Trait and Backend Selection Specification

## Goals

1. Define the `Communicator` trait with method signatures for all five SDDP collective operations
2. Define the `SharedMemoryProvider` trait for shared-memory window operations
3. Specify the backend registration, selection, and factory mechanism
4. Document the new `cobre-comm` crate that houses the trait and backend registry

## Scope

This epic produces two new specification documents:

- `src/specs/hpc/communicator-trait.md` -- The trait interface, method contracts, error semantics, and generic parameterization of the training loop
- `src/specs/hpc/backend-selection.md` -- The backend registry, selection mechanism (environment variables, API), factory pattern, and feature-flag strategy

## Tickets

| Ticket     | Title                                           | Status  | Detail Level |
| ---------- | ----------------------------------------------- | ------- | ------------ |
| ticket-001 | Define Communicator trait method signatures     | pending | Detailed     |
| ticket-002 | Define SharedMemoryProvider trait specification | pending | Detailed     |
| ticket-003 | Specify backend registration and selection      | pending | Detailed     |
| ticket-004 | Specify cobre-comm crate architecture           | pending | Detailed     |

## Dependencies

- **Blocked By**: None (this is the first epic)
- **Blocks**: Epic 02 (backend implementations reference the trait), Epic 03 (spec refactoring references the trait)

## Success Criteria

- Two new spec documents exist with implementation-ready Rust trait definitions
- Method signatures cover all five SDDP collective operations identified in communication-patterns.md SS1.1
- The backend selection mechanism is specified with environment variable names and auto-detection logic
- The `cobre-comm` crate is documented with its dependency position in the crate graph
