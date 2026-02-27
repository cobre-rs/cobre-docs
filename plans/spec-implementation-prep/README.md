# Spec Implementation Prep

Prepare the cobre-docs specification corpus to be a clean, navigable reference for developers starting the Cobre SDDP solver implementation.

## Tech Stack

- mdBook markdown files only (no code changes)
- Verification via `grep`, `mdbook build`

## Epics

| Epic    | Name               | Tickets     | Status  |
| ------- | ------------------ | ----------- | ------- |
| epic-01 | GAP Marker Cleanup | 2           | pending |
| epic-02 | Consistency Pass   | 3           | pending |
| epic-03 | Navigation Layer   | 3 (outline) | pending |

## Progress

| Ticket     | Title                                                                                   | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | --------------------------------------------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Remove inline GAP markers from spec prose                                               | epic-01 | completed | Detailed     | 0.98      | 0.93    | EXCELLENT |
| ticket-002 | Update ecosystem-guidelines blocker table                                               | epic-01 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-003 | Fix §-convention violations in high-count architecture files                            | epic-02 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-004 | Fix §-convention violations in medium-count architecture files                          | epic-02 | completed | Detailed     | 0.98      | 1.00    | EXCELLENT |
| ticket-005 | Fix §-convention violations in low-count architecture files and audit OpenMP references | epic-02 | completed | Detailed     | 0.94      | 1.00    | EXCELLENT |
| ticket-006 | Update implementation-ordering blocker status and per-phase reading lists               | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-007 | Add Minimum Viable Reading List to implementation-ordering                              | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-008 | Add "How to Use This Specification" guide                                               | epic-03 | pending   | Outline      | --        | --      | --        |

## Readiness Scores (Detailed Tickets)

| Ticket     | Composite | Structure | Testability | Boundary | Dep Clarity | Atomicity |
| ---------- | --------- | --------- | ----------- | -------- | ----------- | --------- |
| ticket-001 | 0.98      | 1.00      | 1.00        | 1.00     | 1.00        | 0.80      |
| ticket-002 | 1.00      | 1.00      | 1.00        | 1.00     | 1.00        | 1.00      |
| ticket-003 | 1.00      | 1.00      | 1.00        | 1.00     | 1.00        | 1.00      |
| ticket-004 | 0.98      | 1.00      | 1.00        | 1.00     | 1.00        | 0.80      |
| ticket-005 | 0.94      | 1.00      | 1.00        | 1.00     | 1.00        | 0.40      |

Dimensions below 0.85: ticket-001:atomicity (0.80), ticket-004:atomicity (0.80), ticket-005:atomicity (0.40)

**Note on ticket-005 atomicity**: The ticket combines §-convention cleanup (5 files) with an OpenMP audit. The OpenMP audit is evaluative (read-and-decide) rather than a separate code change, so splitting it into a separate ticket would produce a ticket with no file modifications. The compound title reflects two activities but the files overlap, making this a pragmatic grouping. The composite score (0.94) is well above the 0.80 gate.
