# Communication Backend Abstraction

## Overview

This plan introduces a pluggable communication backend abstraction layer to the Cobre SDDP solver specification corpus. It defines a `Communicator` trait abstracting all collective operations, specifies four backend implementations (ferrompi/MPI, local, TCP, shared-memory) selected via compile-time Cargo feature flags (consistent with solver-abstraction.md §10), refactors all affected HPC and architecture specs, enables Python multi-process SDDP via alternative backends, and defines a testing and determinism verification strategy.

## Tech Stack

- Markdown documentation in mdBook
- SDDP domain expertise for HPC communication specs
- Rust trait design patterns (for specifying the trait interface)

## Epics

| Epic    | Name                                     | Tickets      | Status    |
| ------- | ---------------------------------------- | ------------ | --------- |
| Epic 01 | Communicator Trait and Backend Selection | 4 (detailed) | completed |
| Epic 02 | Backend Implementation Specifications    | 4 (detailed) | completed |
| Epic 03 | Refactor Existing Specs to Use Trait     | 5 (outline)  | pending   |
| Epic 04 | Python Multi-Process Execution Spec      | 3 (outline)  | pending   |
| Epic 05 | Testing and Determinism Verification     | 2 (outline)  | pending   |

## Dependency Graph

```
Epic 01: Communicator Trait + Backend Selection
  ticket-001 Define Communicator trait ─────────────────┐
  ticket-002 Define SharedMemoryProvider trait ──────────┤ (depends on 001)
  ticket-003 Specify backend registration/selection ────┤ (depends on 001)
  ticket-004 Specify cobre-comm crate ─────────────────┘ (depends on 001-003)

Epic 02: Backend Implementation Specifications
  ticket-005 Specify ferrompi backend ──────────────────┐ (depends on 001, 002)
  ticket-006 Specify local backend ─────────────────────┤ (depends on 001, 002)
  ticket-007 Specify TCP backend ───────────────────────┤ (depends on 001, 003)
  ticket-008 Specify shared-memory backend ─────────────┘ (depends on 001, 002, 003)

Epic 03: Refactor Existing Specs [OUTLINE]
  ticket-009 Refactor hybrid-parallelism.md ────────────┐ (depends on 001, 002, 005, 006)
  ticket-010 Refactor communication-patterns.md ────────┤ (depends on 001, 002, 005)
  ticket-011 Refactor training-loop.md + HPC specs ─────┤ (depends on 009, 010)
  ticket-012 Update crate overview + SUMMARY.md ────────┤ (depends on 004-008)
  ticket-013 Update cross-reference index ──────────────┘ (depends on 009-012)

Epic 04: Python Multi-Process Spec [OUTLINE]
  ticket-014 Add multi-process sections to python.md ───┐ (depends on 007, 008, 009)
  ticket-015 Specify Python worker coordination API ─────┤ (depends on 014)
  ticket-016 Update MCP server for multi-process ────────┘ (depends on 007, 014)

Epic 05: Testing and Determinism [OUTLINE]
  ticket-017 Specify backend conformance testing ────────┐ (depends on 001, 005-008, 011)
  ticket-018 Specify determinism verification ───────────┘ (depends on 017)
```

## Execution Order

The recommended execution order follows the dependency graph:

1. **ticket-001** (Communicator trait) -- foundation for everything
2. **ticket-002** (SharedMemoryProvider) and **ticket-003** (backend selection) -- can be parallel after 001
3. **ticket-004** (cobre-comm crate) -- after 001-003
4. **ticket-005** through **ticket-008** (all backend specs) -- can be parallel after 001-003
5. **Epic 03 tickets** (after refinement) -- require Epics 01-02 complete
6. **Epic 04 tickets** (after refinement) -- require TCP/shm backends and refactored specs
7. **Epic 05 tickets** (after refinement) -- require everything above

## Progress Tracking

| Ticket     | Title                                                        | Epic    | Status    | Detail Level |
| ---------- | ------------------------------------------------------------ | ------- | --------- | ------------ |
| ticket-001 | Define Communicator trait method signatures                  | epic-01 | completed | Detailed     |
| ticket-002 | Define SharedMemoryProvider trait specification              | epic-01 | completed | Detailed     |
| ticket-003 | Specify backend registration and selection                   | epic-01 | completed | Detailed     |
| ticket-004 | Specify cobre-comm crate architecture                        | epic-01 | completed | Detailed     |
| ticket-005 | Specify ferrompi backend implementation                      | epic-02 | completed | Detailed     |
| ticket-006 | Specify local (no-op) backend implementation                 | epic-02 | completed | Detailed     |
| ticket-007 | Specify TCP backend implementation                           | epic-02 | completed | Detailed     |
| ticket-008 | Specify shared-memory backend implementation                 | epic-02 | completed | Detailed     |
| ticket-009 | Refactor hybrid-parallelism.md for backend abstraction       | epic-03 | pending   | Outline      |
| ticket-010 | Refactor communication-patterns.md for trait references      | epic-03 | pending   | Outline      |
| ticket-011 | Refactor training-loop.md and remaining HPC specs            | epic-03 | pending   | Outline      |
| ticket-012 | Update crate overview and SUMMARY.md                         | epic-03 | pending   | Outline      |
| ticket-013 | Update cross-reference index with new specs                  | epic-03 | pending   | Outline      |
| ticket-014 | Add multi-process execution sections to python-bindings.md   | epic-04 | pending   | Outline      |
| ticket-015 | Specify Python worker coordination API                       | epic-04 | pending   | Outline      |
| ticket-016 | Update MCP server spec for optional multi-process capability | epic-04 | pending   | Outline      |
| ticket-017 | Specify backend conformance and interchangeability testing   | epic-05 | pending   | Outline      |
| ticket-018 | Specify determinism verification across backends             | epic-05 | pending   | Outline      |
