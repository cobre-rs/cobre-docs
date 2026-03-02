# Parallel Scenario Generation Spec Update

## Overview

This plan adds explicit parallel execution documentation to the scenario generation pipeline in the Cobre mdBook specification corpus. The scenario generation specs already document the algorithm, seed strategy, and reproducibility guarantees in detail, but lack explicit parallel execution documentation compared to the standard set by the recent cut selection work distribution update (DEC-016). This plan closes that gap.

## Tech Stack

Markdown spec files in an mdBook project. No code implementation.

## Epics

| Epic | Name                                  | Tickets | Description                                                      |
| ---- | ------------------------------------- | ------- | ---------------------------------------------------------------- |
| 01   | Scenario Generation Work Distribution | 4       | Core spec updates: SS2.2b, SS2.3c, SS5.2 addendum, DEC-017 entry |
| 02   | Parallel Testing and Cross-References | 3       | Parallel tests, cross-reference updates, index batch update      |

## Progress

| Ticket     | Title                                                 | Epic    | Status    | Detail Level | Readiness | Quality | Badge |
| ---------- | ----------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | ----- |
| ticket-001 | Add work distribution for noise generation subsection | epic-01 | completed | Detailed     | 1.00      | --      | --    |
| ticket-002 | Document parallel opening tree generation             | epic-01 | completed | Detailed     | 1.00      | --      | --    |
| ticket-003 | Document forward pass per-thread noise generation     | epic-01 | completed | Detailed     | 1.00      | --      | --    |
| ticket-004 | Add DEC-017 decision log entry and inline markers     | epic-01 | completed | Detailed     | 0.96      | --      | --    |
| ticket-005 | Add parallel generation tests                         | epic-02 | pending   | Detailed     | 1.00      | --      | --    |
| ticket-006 | Update bidirectional cross-references                 | epic-02 | pending   | Detailed     | 0.96      | --      | --    |
| ticket-007 | Batch update cross-reference index                    | epic-02 | pending   | Detailed     | 1.00      | --      | --    |

## Dependency Graph

```
ticket-001 ──┬──> ticket-002 ──┐
             ├──> ticket-003 ──┤
             │                 │
             └─────────────────┴──> ticket-004 ──> ticket-005 ──┬──> ticket-007
                                                                 │
                                                  ticket-006 ──┘
```

Note: ticket-006 depends on ticket-005 (new SS5 creates references). ticket-007 depends on both ticket-005 and ticket-006.

## Files Modified

| File                                                | Tickets                 | Changes                                                    |
| --------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `src/specs/architecture/scenario-generation.md`     | 001, 002, 003, 004, 006 | SS2.2b, SS2.3c, SS5.2 addendum, DEC-017 marker, cross-refs |
| `src/specs/architecture/sampling-scheme-trait.md`   | 004, 006                | DEC-017 marker, cross-refs                                 |
| `src/specs/architecture/sampling-scheme-testing.md` | 005, 006                | SS5 parallel tests, cross-refs                             |
| `src/specs/hpc/work-distribution.md`                | 004, 006                | DEC-017 marker, cross-refs                                 |
| `src/specs/hpc/shared-memory-aggregation.md`        | 004, 006                | DEC-017 marker, cross-refs                                 |
| `src/specs/hpc/hybrid-parallelism.md`               | 004, 006                | DEC-017 marker, cross-refs                                 |
| `src/specs/overview/decision-log.md`                | 004                     | DEC-017 registry row                                       |
| `src/specs/cross-reference-index.md`                | 007                     | Batch update sections 3 and 4                              |
