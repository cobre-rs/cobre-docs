# Epic 02: Medium-Priority Trait Formalization

## Goals

Formalize the two MEDIUM-HIGH-priority algorithm abstractions as trait specs with conformance test specs:

1. **CutSelectionStrategy** -- Level-1, LML1, and Dominated Detection variants; periodic execution, activity tracking
2. **StoppingRule** -- 5 rules (iteration limit, time limit, bound stalling, simulation-based, graceful shutdown) with OR/AND composition

## Scope

- 2 new trait spec files in `src/specs/architecture/`
- 2 new conformance test spec files in `src/specs/architecture/`
- CutSelectionStrategy involves periodic execution and interaction with the cut pool activity bitmap
- StoppingRule involves rule composition (OR/AND logic) and interaction with the convergence monitor

## Tickets

| Ticket     | Title                                             | Estimated Effort |
| ---------- | ------------------------------------------------- | ---------------- |
| ticket-007 | Define CutSelectionStrategy trait spec            | 3 points         |
| ticket-008 | Define CutSelectionStrategy conformance test spec | 2 points         |
| ticket-009 | Define StoppingRule trait spec                    | 3 points         |
| ticket-010 | Define StoppingRule conformance test spec         | 2 points         |

## Dependencies

- Can proceed in parallel with Epic 01 (no trait depends on another)
- ticket-007 and ticket-008 are independent of ticket-009 and ticket-010

## Completion Criteria

- All 4 files created and internally consistent
- CutSelectionStrategy trait covers all three variants with their tracking data
- StoppingRule trait covers all 5 rules plus the OR/AND composition mechanism
- Each test spec has requirements tables with concrete expected behaviors
