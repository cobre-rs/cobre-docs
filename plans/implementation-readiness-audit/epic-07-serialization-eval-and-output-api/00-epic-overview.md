# Epic 07: Serialization Evaluation and Output Writer API

## Goal

Evaluate whether `rkyv` is the optimal serialization library for the initialization-phase MPI broadcast of the `System` struct, and resolve the Batch 2 conditions (C-13/GAP-020 and C-14) by designing the full output writer API and simulation types. The rkyv evaluation should precede or run parallel to the output API work because its findings could influence serialization choices in the output pipeline.

## Scope

- Evaluate `rkyv` vs alternatives (`postcard`, manual serialization, FlatBuffers) for initialization-phase broadcast serialization
- Define the full output writer API (GAP-020): 9 elements including simulation/training Parquet writers, manifest writer, metadata writer, dictionary writers, FlatBuffers serialization, output error type, serde derives, Parquet library selection
- Define `SimulationScenarioResult` type and `fn simulate(...)` orchestrator signature (C-14)

## Conditions Resolved

| Condition | Description                                                       | Phase Blocked                         | Effort           |
| --------- | ----------------------------------------------------------------- | ------------------------------------- | ---------------- |
| C-13      | GAP-020: Define full output writer API (9 elements)               | 7                                     | 2-3 days         |
| C-14      | Define `SimulationScenarioResult` type and `simulate()` signature | 7                                     | Included in C-13 |
| (special) | rkyv serialization fitness evaluation                             | Informs future Phase 2 implementation | 1-2 days         |

## Tickets

| Ticket     | Title                                                       | Agent                          | Effort |
| ---------- | ----------------------------------------------------------- | ------------------------------ | ------ |
| ticket-027 | Evaluate rkyv Serialization Fitness for System Broadcast    | `data-model-format-specialist` | 3 pts  |
| ticket-028 | Define SimulationScenarioResult Type and Simulate Signature | `sddp-specialist`              | 2 pts  |
| ticket-029 | Define Output Writer API                                    | `data-model-format-specialist` | 4 pts  |

## Dependencies

- **Depends on**: Epics 01-04 (audit findings inform the scope), Epic 05 (entity struct definitions inform the output writer types)
- **Blocks**: Epic 08 (final verification)
- ticket-028 (C-14) blocks ticket-029 (C-13) -- the output writer method signatures depend on `SimulationScenarioResult`
- ticket-027 (rkyv eval) is independent of tickets 028-029

## Deliverables

- rkyv evaluation report with concrete recommendation and evidence
- Updated `src/specs/architecture/simulation-architecture.md` with `SimulationScenarioResult` type and `simulate()` signature
- Updated output spec files with full output writer API (9 elements)
- Updated `src/specs/overview/spec-gap-inventory.md` to mark GAP-020 as resolved
