# Epic 04: Remaining Spec Content

## Goal

Resolve the five remaining gaps that require documentation additions to various spec files: backward pass distribution strategy (GAP-026), event channel implementation (GAP-032), NUMA/shared memory simplification (GAP-033), penalty ordering validation (GAP-025), and FlatBuffers requirements documentation (GAP-021).

## Scope

- **GAP-026**: Document backward trial state distribution strategy in `training-loop.md`
- **GAP-032**: Replace `broadcast::Sender` with `std::sync::mpsc` for the synchronous CLI binding in `training-loop.md`
- **GAP-033**: Simplify `SharedMemoryProvider` bound -- isolated per-rank memory in Phase 5, MPI shared memory deferred to post-profiling in `communicator-trait.md` and `training-loop.md`
- **GAP-025**: Design penalty ordering validation checks in `penalty-system.md` and `input-loading-pipeline.md`
- **GAP-021**: Document FlatBuffers requirements (batch extraction, cache-fitting) without full schema in `binary-formats.md`

## Tickets

| Ticket     | Title                                                    | Dependencies | Effort |
| ---------- | -------------------------------------------------------- | ------------ | ------ |
| ticket-009 | Document backward pass trial state distribution strategy | ticket-001   | 1      |
| ticket-010 | Replace event channel with std::sync::mpsc               | ticket-001   | 1      |
| ticket-011 | Simplify SharedMemoryProvider bound for minimal viable   | ticket-001   | 2      |
| ticket-012 | Design penalty ordering validation checks                | ticket-001   | 2      |
| ticket-013 | Document FlatBuffers requirements for cut persistence    | ticket-001   | 1      |

## Acceptance Criteria

- `training-loop.md` SS6.3 documents contiguous block assignment for backward trial states
- `training-loop.md` SS2.1a uses `std::sync::mpsc::Sender` instead of `broadcast::Sender`
- `communicator-trait.md` clarifies that `SharedMemoryProvider` for shared memory is deferred to post-profiling
- `penalty-system.md` specifies validation checks for penalty ordering with warning behavior
- `binary-formats.md` section 3 documents batch extraction and cache-fitting requirements without prescribing full schema
