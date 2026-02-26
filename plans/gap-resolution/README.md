# Plan: Resolve Blocker Gaps and Codify Ecosystem Guidelines

## Overview

This plan resolves the 5 Blocker-severity and 15 High-severity specification gaps identified in the [Spec Gap Inventory](../../src/specs/overview/spec-gap-inventory.md), and codifies the accumulated ecosystem development guidelines from the spec-readiness plan into durable project artifacts. The work is specification-only -- no Rust code is produced.

**Two workstreams:**

- **Workstream A (Epic 1):** Extract durable development guidelines from spec-readiness learnings into `CLAUDE.md` (agent context) and `src/specs/overview/ecosystem-guidelines.md` (human-readable mdBook page).
- **Workstream B (Epics 2-4):** Resolve all 5 Blocker gaps (GAP-001 through GAP-005) by incorporating stakeholder design decisions, then resolve 15 High-severity gaps (GAP-006 through GAP-017, GAP-036 through GAP-038).

## Tech Stack

- **Documentation framework:** mdBook with KaTeX preprocessor
- **Spec format:** Markdown with section numbering conventions (SS for architecture, section for HPC, plain numbered for overview)
- **Validation:** `mdbook build` for link checking
- **Domain:** SDDP (Stochastic Dual Dynamic Programming) optimization ecosystem in Rust

## Progressive Planning

This plan uses **progressive planning mode**. Epics 1-3 have fully detailed tickets ready for implementation dispatch. Epic 4 has outline tickets that will be refined with learnings from Epics 1-3.

## Epic Summary

| Epic | Name                         | Tickets                       | Status  | Detail Level |
| ---- | ---------------------------- | ----------------------------- | ------- | ------------ |
| 01   | Ecosystem Guidelines         | 3 (ticket-001 to ticket-003)  | pending | Detailed     |
| 02   | Core Data Model Blockers     | 4 (ticket-004 to ticket-007)  | pending | Detailed     |
| 03   | LP Layout and State Vectors  | 3 (ticket-008 to ticket-010)  | pending | Detailed     |
| 04   | High-Severity Gap Resolution | 15 (ticket-011 to ticket-025) | pending | Outline      |

## Dependency Graph

```
Epic 1 (Ecosystem Guidelines)
  ticket-001 --> ticket-002 --> ticket-003

Epic 2 (Core Data Model)         [independent of Epic 1]
  ticket-004 --> ticket-005
  ticket-004 --> ticket-006
  ticket-005 --> ticket-007
  ticket-006 --> ticket-007

Epic 3 (LP Layout and State)     [blocked by Epic 2]
  ticket-008 --> ticket-009 --> ticket-010
                                ticket-008 --> ticket-010

Epic 4 (High-Severity Gaps)      [blocked by Epics 1-3, outline tickets]
  ticket-009 --> ticket-011 --> ticket-012
  ticket-006 --> ticket-012
  ticket-008 --> ticket-012
  ticket-008 --> ticket-013
  ticket-009 --> ticket-014
  ticket-008 --> ticket-015
  ticket-008 --> ticket-016
  ticket-004 --> ticket-017
  ticket-004 --> ticket-021
  ticket-009 --> ticket-020
  ticket-008 --> ticket-023
  ticket-008 --> ticket-024
  (ticket-018, ticket-019, ticket-022, ticket-025 have no intra-plan blockers)
```

## Progress Tracking

| Ticket     | Title                                                   | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | ------------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Create CLAUDE.md with Ecosystem Guidelines              | epic-01 | completed | Detailed     | 0.85      | 0.90    | EXCELLENT |
| ticket-002 | Create ecosystem-guidelines.md Spec Page                | epic-01 | completed | Detailed     | 0.90      | 0.90    | EXCELLENT |
| ticket-003 | Update SUMMARY.md and Cross-References                  | epic-01 | completed | Detailed     | 0.97      | 1.00    | EXCELLENT |
| ticket-004 | Specify SystemRepresentation Top-Level Type             | epic-02 | completed | Detailed     | 0.93      | 1.00    | EXCELLENT |
| ticket-005 | Resolve Decommissioned Operative State                  | epic-02 | completed | Detailed     | 0.83      | 1.00    | EXCELLENT |
| ticket-006 | Specify rkyv Serialization for MPI Broadcast            | epic-02 | completed | Detailed     | 0.94      | 1.00    | EXCELLENT |
| ticket-007 | Update Gap Inventory for GAP-001/002/003                | epic-02 | completed | Detailed     | 0.91      | 1.00    | EXCELLENT |
| ticket-008 | Specify LP Memory Layout with Index Formulas            | epic-03 | completed | Detailed     | 0.93      | 0.90    | EXCELLENT |
| ticket-009 | Specify State Vectors and Indexer Structs               | epic-03 | completed | Detailed     | 0.94      | 0.90    | EXCELLENT |
| ticket-010 | Update Gap Inventory for GAP-004/005                    | epic-03 | completed | Detailed     | 0.77      | 0.88    | EXCELLENT |
| ticket-011 | Specify State Vector MPI Wire Format                    | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-012 | Specify Cut Synchronization MPI Wire Format             | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-013 | Add AR Lag Fixing Constraints to LP Formulation         | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-014 | Split patch_rhs_bounds into Row and Column Methods      | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-015 | Adopt Single-Phase LP Scaling as Baseline               | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-016 | Adopt Selective Cut Addition as Baseline                | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-017 | Define load_case API and System Crate Boundary Type     | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-018 | Define TrainingEvent Enum in cobre-core                 | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-019 | Specify Deterministic Hash Function for Seed Derivation | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-020 | Specify Simulation-Based Stopping Rule Interaction      | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-021 | Audit CLI Lifecycle for Training Loop Consistency       | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-022 | Specify ferrompi Standalone API                         | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-023 | Specify Solver Workspace Lifecycle                      | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-024 | Clarify Lower Bound Computation                         | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-025 | Specify Upper Bound Variance Aggregation                | epic-04 | pending   | Outline      | --        | --      | --        |
