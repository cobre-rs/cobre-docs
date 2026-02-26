# Plan: Spec Readiness

## Overview

Prepare the Cobre SDDP specification corpus for Rust implementation by formalizing the remaining abstraction-point traits with conformance test specs, performing a final consistency pass, and producing an implementation readiness assessment.

## Tech Stack

- **All work is documentation/specification changes** (Markdown files in an mdBook project)
- No Rust code, no executable tests, no infrastructure changes

## Epics

| Epic    | Name                                 | Tickets | Status   |
| ------- | ------------------------------------ | ------- | -------- |
| epic-01 | High-Priority Trait Formalization    | 6       | Complete |
| epic-02 | Medium-Priority Trait Formalization  | 4       | Complete |
| epic-03 | Solver Interface Trait Formalization | 4       | Pending  |
| epic-04 | Spec Consistency Final Pass          | 4       | Pending  |
| epic-05 | Implementation Readiness Assessment  | 3       | Pending  |

## Dependency Graph

```
Epic 01 (High-Priority Traits) ──┐
                                  ├──> Epic 03 (Solver + Index Updates) ──> Epic 04 (Consistency) ──> Epic 05 (Readiness)
Epic 02 (Medium-Priority Traits) ┘
```

Within Epic 01, ticket pairs are independent of each other:

- ticket-001 -> ticket-002 (RiskMeasure trait -> test)
- ticket-003 -> ticket-004 (HorizonMode trait -> test)
- ticket-005 -> ticket-006 (SamplingScheme trait -> test)

Within Epic 02, ticket pairs are independent of each other:

- ticket-007 -> ticket-008 (CutSelectionStrategy trait -> test)
- ticket-009 -> ticket-010 (StoppingRule trait -> test)

Within Epic 03:

- ticket-011 -> ticket-012 (SolverInterface trait -> test)
- ticket-011, ticket-012 must complete before ticket-013 (index updates)
- ticket-013 -> ticket-014 (index -> crate specs)

Within Epic 04:

- ticket-015, ticket-016, ticket-017, ticket-018 can proceed in parallel (all blocked by epic 03)

Within Epic 05:

- ticket-019, ticket-020 can proceed in parallel (both blocked by epic 04)
- ticket-019, ticket-020 -> ticket-021

## Execution Order

Recommended execution order (respecting dependencies, maximizing parallelism):

**Batch 1** (parallel): ticket-001, ticket-003, ticket-005, ticket-007, ticket-009
**Batch 2** (parallel): ticket-002, ticket-004, ticket-006, ticket-008, ticket-010
**Batch 3** (sequential): ticket-011
**Batch 4** (sequential): ticket-012
**Batch 5** (sequential): ticket-013
**Batch 6** (sequential): ticket-014
**Batch 7** (parallel): ticket-015, ticket-016, ticket-017, ticket-018
**Batch 8** (parallel): ticket-019, ticket-020
**Batch 9** (sequential): ticket-021

## Progress Tracking

| Ticket     | Title                                                        | Epic    | Status    | Detail Level |
| ---------- | ------------------------------------------------------------ | ------- | --------- | ------------ |
| ticket-001 | Define RiskMeasure trait spec                                | epic-01 | completed | Detailed     |
| ticket-002 | Define RiskMeasure conformance test spec                     | epic-01 | completed | Detailed     |
| ticket-003 | Define HorizonMode trait spec                                | epic-01 | completed | Detailed     |
| ticket-004 | Define HorizonMode conformance test spec                     | epic-01 | completed | Detailed     |
| ticket-005 | Define SamplingScheme trait spec                             | epic-01 | completed | Detailed     |
| ticket-006 | Define SamplingScheme conformance test spec                  | epic-01 | completed | Detailed     |
| ticket-007 | Define CutSelectionStrategy trait spec                       | epic-02 | completed | Detailed     |
| ticket-008 | Define CutSelectionStrategy conformance test spec            | epic-02 | completed | Detailed     |
| ticket-009 | Define StoppingRule trait spec                               | epic-02 | completed | Detailed     |
| ticket-010 | Define StoppingRule conformance test spec                    | epic-02 | completed | Detailed     |
| ticket-011 | Define SolverInterface trait spec                            | epic-03 | pending   | Outline      |
| ticket-012 | Define SolverInterface conformance test spec                 | epic-03 | pending   | Outline      |
| ticket-013 | Update cross-reference-index and SUMMARY for all trait specs | epic-03 | pending   | Outline      |
| ticket-014 | Update crate specs to reference new trait specs              | epic-03 | pending   | Outline      |
| ticket-015 | Audit cross-references in new trait and test specs           | epic-04 | pending   | Outline      |
| ticket-016 | Audit naming consistency across trait specs                  | epic-04 | pending   | Outline      |
| ticket-017 | Validate free-threaded Python note consistency               | epic-04 | pending   | Outline      |
| ticket-018 | Verify traits-as-guidelines convention propagation           | epic-04 | pending   | Outline      |
| ticket-019 | Create implementation ordering document                      | epic-05 | pending   | Outline      |
| ticket-020 | Create spec gap inventory                                    | epic-05 | pending   | Outline      |
| ticket-021 | Update SUMMARY and cross-reference-index for readiness docs  | epic-05 | pending   | Outline      |
