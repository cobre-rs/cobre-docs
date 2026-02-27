# Ecosystem Scope Restoration

## Overview

The Cobre specification corpus has progressively narrowed its framing from "a power system analysis and optimization ecosystem" to "an HPC SDDP solver." This plan restores the correct ecosystem scope by addressing framing drift in crate overviews and overview docs, renaming SDDP-specific solver methods and LP layout terminology to generic LP operations, reframing the stochastic framework as general scenario generation infrastructure, and creating a new ecosystem vision document.

## Tech Stack

- mdBook (markdown documentation)
- No code changes -- all deliverables are `.md` files

## Epics

| Epic    | Name                                 | Tickets | Total Points | Status  |
| ------- | ------------------------------------ | ------- | ------------ | ------- |
| epic-01 | Framing Restoration                  | 5       | 9            | pending |
| epic-02 | Solver Generalization                | 6       | 18           | pending |
| epic-03 | Stochastic Generalization and Vision | 4       | 9            | pending |

**Total: 15 tickets, 36 points**

## Architecture Decisions

### Method Renames

| Current            | Proposed         | Type Change              |
| ------------------ | ---------------- | ------------------------ |
| `add_cut_rows`     | `add_rows`       | `CutBatch` -> `RowBatch` |
| `patch_row_bounds` | `set_row_bounds` | (no change)              |
| `patch_col_bounds` | `set_col_bounds` | (no change)              |

### LP Layout Region Renames

| Current                     | Proposed                    |
| --------------------------- | --------------------------- |
| "cut rows" / "Benders cuts" | "dynamic constraint rows"   |
| "structural rows"           | "static constraint rows"    |
| "cut-relevant constraints"  | "dual-relevant constraints" |

## Progress Tracking

| Ticket     | Title                                               | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | --------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Restore generic framing in cobre-core overview      | epic-01 | completed | Detailed     | 0.91      | 0.88    | EXCELLENT |
| ticket-002 | Restore generic framing in cobre-solver overview    | epic-01 | completed | Detailed     | 0.90      | 0.94    | EXCELLENT |
| ticket-003 | Restore generic framing in comm and ferrompi        | epic-01 | completed | Detailed     | 0.88      | 0.93    | EXCELLENT |
| ticket-004 | Restore generic framing in cli, stochastic, and io  | epic-01 | completed | Detailed     | 0.87      | 0.93    | EXCELLENT |
| ticket-005 | Restore generic framing in guidelines and CLAUDE.md | epic-01 | completed | Detailed     | 0.92      | 0.88    | EXCELLENT |
| ticket-006 | Generalize LP layout terminology                    | epic-02 | completed | Detailed     | 0.86      | 0.90    | EXCELLENT |
| ticket-007 | Rename SolverInterface methods                      | epic-02 | completed | Detailed     | 0.93      | 0.88    | EXCELLENT |
| ticket-008 | Update solver implementation specs                  | epic-02 | completed | Detailed     | 0.90      | 0.93    | EXCELLENT |
| ticket-009 | Update solver-interface-testing.md                  | epic-02 | completed | Detailed     | 0.91      | 0.90    | EXCELLENT |
| ticket-010 | Update workspaces and training-loop                 | epic-02 | completed | Detailed     | 0.87      | 0.93    | EXCELLENT |
| ticket-011 | Update communicator-trait.md purpose                | epic-02 | completed | Detailed     | 0.94      | 0.98    | EXCELLENT |
| ticket-012 | Reframe sampling-scheme-trait.md                    | epic-03 | pending   | Detailed     | 0.92      | --      | --        |
| ticket-013 | Reframe scenario-generation.md                      | epic-03 | pending   | Detailed     | 0.93      | --      | --        |
| ticket-014 | Create ecosystem-vision.md                          | epic-03 | pending   | Detailed     | 0.88      | --      | --        |
| ticket-015 | Update cross-reference index                        | epic-03 | pending   | Detailed     | 0.89      | --      | --        |

## Dependency Graph

```
Epic 01 (independent tickets, any order):
  ticket-001 ──┐
  ticket-002 ──┤
  ticket-003 ──┤── (all independent)
  ticket-004 ──┤
  ticket-005 ──┘

Epic 02 (ordered dependency chain + independent ticket-011):
  ticket-006 ──> ticket-007 ──> ticket-008
                           ──> ticket-009
                           ──> ticket-010
  ticket-011 (independent)

Epic 03 (mixed):
  ticket-012 (independent)
  ticket-013 (independent)
  ticket-014 ──> ticket-015
```

## Readiness Scores Summary

| Ticket     | Composite | Structure | Testability | Boundary | Dep Clarity | Atomicity |
| ---------- | --------- | --------- | ----------- | -------- | ----------- | --------- |
| ticket-001 | 0.91      | 1.00      | 0.85        | 0.90     | 1.00        | 0.90      |
| ticket-002 | 0.90      | 1.00      | 0.85        | 0.85     | 1.00        | 0.85      |
| ticket-003 | 0.88      | 1.00      | 0.80        | 0.85     | 1.00        | 0.80      |
| ticket-004 | 0.87      | 1.00      | 0.80        | 0.80     | 1.00        | 0.80      |
| ticket-005 | 0.92      | 1.00      | 0.90        | 0.90     | 1.00        | 0.85      |
| ticket-006 | 0.86      | 1.00      | 0.80        | 0.80     | 1.00        | 0.70      |
| ticket-007 | 0.93      | 1.00      | 0.95        | 0.85     | 1.00        | 0.80      |
| ticket-008 | 0.90      | 1.00      | 0.90        | 0.85     | 1.00        | 0.75      |
| ticket-009 | 0.91      | 1.00      | 0.90        | 0.85     | 1.00        | 0.80      |
| ticket-010 | 0.87      | 1.00      | 0.80        | 0.80     | 1.00        | 0.75      |
| ticket-011 | 0.94      | 1.00      | 0.95        | 0.90     | 1.00        | 0.90      |
| ticket-012 | 0.92      | 1.00      | 0.90        | 0.85     | 1.00        | 0.85      |
| ticket-013 | 0.93      | 1.00      | 0.90        | 0.90     | 1.00        | 0.90      |
| ticket-014 | 0.88      | 1.00      | 0.80        | 0.85     | 1.00        | 0.80      |
| ticket-015 | 0.89      | 1.00      | 0.85        | 0.85     | 1.00        | 0.80      |

**Mean readiness: 0.90** | **Min readiness: 0.86 (ticket-006)** | **All tickets >= 0.80 gate**

Dimensions below 0.85: ticket-003:testability (0.80), ticket-003:atomicity (0.80), ticket-004:testability (0.80), ticket-004:boundary (0.80), ticket-004:atomicity (0.80), ticket-006:testability (0.80), ticket-006:boundary (0.80), ticket-006:atomicity (0.70), ticket-008:atomicity (0.75), ticket-010:testability (0.80), ticket-010:boundary (0.80), ticket-010:atomicity (0.75), ticket-014:testability (0.80), ticket-014:atomicity (0.80), ticket-015:atomicity (0.80)
