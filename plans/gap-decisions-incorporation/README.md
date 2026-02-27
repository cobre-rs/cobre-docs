# Gap Decisions Incorporation

Incorporate confirmed architectural decisions from a stakeholder design review into the Cobre specification corpus. Resolves 15 open gaps (GAP-018 through GAP-035) by updating the gap inventory and adding spec content to owning files.

## Tech Stack

- mdBook Markdown specification documents
- KaTeX math rendering
- No code -- all deliverables are `.md` files

## Epics

| Epic    | Name                         | Tickets | Status    |
| ------- | ---------------------------- | ------- | --------- |
| epic-01 | Gap Inventory Update         | 1       | executing |
| epic-02 | High-Impact Spec Content     | 4       | executing |
| epic-03 | Configuration and Data Model | 3       | outline   |
| epic-04 | Remaining Spec Content       | 5       | outline   |

## Progress

| Ticket     | Title                                                           | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | --------------------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Batch-update gap inventory for 15 resolved gaps                 | epic-01 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-002 | Add PAR-to-LP transformation flow and PrecomputedParLp struct   | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-003 | Define TrajectoryRecord type with contiguous LP solution layout | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-004 | Specify warm-start compatibility validation checks              | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-005 | Replace OpenMP with rayon for intra-rank parallelism            | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-006 | Update configuration reference for GAP-019, 024, 027, 035       | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-007 | Uniformize scenario notation and remove legacy Stage fields     | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-008 | Document forward_passes immutability precondition               | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-009 | Document backward pass trial state distribution strategy        | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-010 | Replace event channel with std::sync::mpsc                      | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-011 | Simplify SharedMemoryProvider bound for minimal viable          | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-012 | Design penalty ordering validation checks                       | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-013 | Document FlatBuffers requirements for cut persistence           | epic-04 | pending   | Outline      | --        | --      | --        |

## Gap-to-Ticket Mapping

| GAP     | Decision                                                          | Ticket     |
| ------- | ----------------------------------------------------------------- | ---------- |
| GAP-018 | Rayon for intra-rank parallelism                                  | ticket-005 |
| GAP-019 | Solver retry as external config, encapsulated                     | ticket-006 |
| GAP-021 | FlatBuffers requirements only, defer full schema                  | ticket-013 |
| GAP-022 | PAR-to-LP transformation flow + PrecomputedParLp struct           | ticket-002 |
| GAP-024 | cut_activity_tolerance as external config                         | ticket-006 |
| GAP-025 | Penalty ordering validation (warning)                             | ticket-012 |
| GAP-026 | Backward pass trial state distribution                            | ticket-009 |
| GAP-027 | forward_passes mandatory, no default                              | ticket-006 |
| GAP-028 | Warm-start validation: hydro count, PAR order, production methods | ticket-004 |
| GAP-030 | TrajectoryRecord with full LP solution, shared training+sim       | ticket-003 |
| GAP-031 | Uniformize to scenario_source, remove legacy fields               | ticket-007 |
| GAP-032 | std::sync::mpsc for event channel                                 | ticket-010 |
| GAP-033 | Isolated per-rank memory, shared memory deferred                  | ticket-011 |
| GAP-034 | forward_passes immutable after init                               | ticket-008 |
| GAP-035 | Update example config to minimal viable defaults                  | ticket-006 |
