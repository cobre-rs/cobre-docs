# Epic 02: Backend Implementation Specifications

## Goals

1. Specify the ferrompi backend -- how it wraps existing ferrompi calls behind the `Communicator` trait
2. Specify the local backend -- the formalized single-process no-op implementation
3. Specify the TCP backend -- multi-process SDDP without MPI via TCP sockets
4. Specify the shared-memory backend -- multi-process SDDP on a single node via OS shared memory

## Scope

This epic produces four new specification documents, one per backend:

- `src/specs/hpc/backend-ferrompi.md` -- Wraps ferrompi; delegates to existing MPI implementation
- `src/specs/hpc/backend-local.md` -- Identity/no-op operations for single-process mode
- `src/specs/hpc/backend-tcp.md` -- TCP-based collective operations with coordinator pattern
- `src/specs/hpc/backend-shm.md` -- OS shared memory based backend for single-node multi-process

## Tickets

| Ticket     | Title                                        | Status  | Detail Level |
| ---------- | -------------------------------------------- | ------- | ------------ |
| ticket-005 | Specify ferrompi backend implementation      | pending | Detailed     |
| ticket-006 | Specify local (no-op) backend implementation | pending | Detailed     |
| ticket-007 | Specify TCP backend implementation           | pending | Detailed     |
| ticket-008 | Specify shared-memory backend implementation | pending | Detailed     |

## Dependencies

- **Blocked By**: Epic 01 (trait definitions must exist before backend specs can reference them)
- **Blocks**: Epic 03 (refactoring needs to know which backends exist), Epic 04 (Python needs TCP/shm backend specs)

## Success Criteria

- Four backend spec documents exist with enough implementation detail for a Rust developer
- Each backend spec references the `Communicator` trait methods and specifies how each is implemented
- The ferrompi backend preserves all existing performance characteristics
- The local backend formalizes the current single-process mode behavior
- The TCP backend specifies connection establishment, collective protocols, and failure handling
- The shm backend specifies shared memory region management and synchronization primitives
