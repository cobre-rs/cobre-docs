# Scenario Spec Gap Closure

## Overview

Close GAP-039 definitively (false gap -- seed-based architecture eliminates broadcast), fix InSample description inconsistency in `scenario-generation.md`, add missing `sampling_method` section, fix GAP-036/037/038 table markers, and resolve 8 cross-reference navigability issues from report-030.

## Tech Stack

- mdBook specification documents (Markdown)
- No code changes

## Epics

| Epic | Name                             | Tickets | Status  |
| ---- | -------------------------------- | ------- | ------- |
| 01   | Scenario Generation Spec Updates | 2       | pending |
| 02   | Gap Inventory Cleanup            | 2       | pending |
| 03   | Cross-Reference Fixes            | 3       | pending |

## Progress Tracking

| Ticket     | Title                                                                        | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | ---------------------------------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Fix InSample description and add seed-broadcast clarification                | epic-01 | completed | Detailed     | 1.00      | 0.90    | EXCELLENT |
| ticket-002 | Add sampling_method section to scenario-generation.md                        | epic-01 | completed | Detailed     | 0.98      | 0.88    | EXCELLENT |
| ticket-003 | Reclassify GAP-039 as resolved false gap                                     | epic-02 | completed | Detailed     | 0.96      | 0.96    | EXCELLENT |
| ticket-004 | Fix GAP-036/037/038 Resolved markers in section 3                            | epic-02 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-005 | Add missing cross-references in simulation-architecture and binary-formats   | epic-03 | completed | Detailed     | 0.98      | 1.00    | EXCELLENT |
| ticket-006 | Batch-update cross-reference index for F4 through F8                         | epic-03 | completed | Detailed     | 0.98      | 1.00    | EXCELLENT |
| ticket-007 | Fix low-priority Cross-References entry precision in simulation-architecture | epic-03 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |

## Dependency Graph

```
ticket-001 ──> ticket-003
ticket-002 ──> ticket-003
ticket-003 ──> ticket-004
ticket-005 ──> ticket-006
ticket-007 (independent)
```

## Key Files Modified

| File                                                | Tickets  | Changes                                                       |
| --------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `src/specs/architecture/scenario-generation.md`     | 001, 002 | SS3.2 InSample fix, new SS2.3b section, SS2.2 clarifying note |
| `src/specs/overview/spec-gap-inventory.md`          | 003, 004 | GAP-039 reclassification, GAP-036/037/038 markers, stats      |
| `src/specs/architecture/simulation-architecture.md` | 005, 007 | F1 (SS6.1 link), F3 (Cross-Refs precision)                    |
| `src/specs/data-model/binary-formats.md`            | 005      | F2 (postcard/MPI broadcast entry)                             |
| `src/specs/cross-reference-index.md`                | 006      | F4-F8 (sections 3, 4, 5 batch update)                         |
