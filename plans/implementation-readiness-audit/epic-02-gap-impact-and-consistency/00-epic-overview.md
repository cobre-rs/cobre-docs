# Epic 02: Gap Impact Assessment and Cross-Spec Consistency

## Goal

Triage all 13 Medium and 5 Low remaining gaps from the spec gap inventory, classifying each as resolve-before-coding or resolve-during-implementation. In parallel, verify that the spec corpus is internally consistent: cross-reference links resolve, shared types have consistent definitions, and mathematical notation is uniform.

## Scope

- All 18 remaining gaps (GAP-018 through GAP-035) from `src/specs/overview/spec-gap-inventory.md`
- All cross-reference links in the 84 spec files
- Shared types referenced across multiple specs: System, StageTemplate, StageIndexer, CutWireRecord, TrainingEvent, LoadError, SolverError
- Mathematical notation consistency between `src/specs/math/` and `src/specs/architecture/` files
- Cross-reference index (`src/specs/cross-reference-index.md`) sections 1-5 currency

## Tickets

| Ticket     | Title                                         | Agent                     | Effort |
| ---------- | --------------------------------------------- | ------------------------- | ------ |
| ticket-009 | Triage Medium and Low Gaps for Phase 1 Impact | `sddp-specialist`         | 3 pts  |
| ticket-010 | Verify Cross-Reference Link Integrity         | `implementation-guardian` | 3 pts  |
| ticket-011 | Verify Shared Type Consistency Across Specs   | `implementation-guardian` | 3 pts  |

## Dependencies

- No dependencies on Epic 01 (can execute in parallel)
- ticket-010 and ticket-011 are independent of each other
- ticket-009 is independent of tickets 010-011

## Deliverables

- Gap triage report with per-gap classification and rationale
- Cross-reference integrity report with broken/stale link inventory
- Shared type consistency report with discrepancy inventory
