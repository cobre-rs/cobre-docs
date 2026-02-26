# Epic 04: High-Severity Gap Resolution (Outline)

## Goal

Resolve the 15 High-severity gaps (GAP-006 through GAP-017, plus GAP-036 through GAP-038) from the spec-gap-inventory. These gaps cover state vector wire formats, MPI serialization, AR lag constraints, solver interface ambiguities, open design points, crate boundary APIs, event types, seed derivation, simulation-based stopping, CLI lifecycle, ferrompi API, solver workspaces, lower bound computation, and upper bound variance aggregation.

## Status

This epic uses **outline tickets** that will be refined with learnings from Epics 1-3. The outline tickets capture intent, anticipated scope, and open questions but are NOT ready for implementation dispatch.

## Scope

All 15 High-severity gaps from the spec-gap-inventory:

| Gap     | Summary                                         | Affected Crate(s)            |
| ------- | ----------------------------------------------- | ---------------------------- |
| GAP-006 | State vector MPI wire format                    | cobre-sddp                   |
| GAP-007 | Cut synchronization MPI wire format             | cobre-sddp                   |
| GAP-008 | AR lag fixing constraints in LP formulation     | cobre-sddp                   |
| GAP-009 | patch_rhs_bounds method ambiguity               | cobre-solver                 |
| GAP-010 | LP scaling strategy (open point)                | cobre-sddp, cobre-solver     |
| GAP-011 | Selective vs bulk cut loading (open question)   | cobre-sddp, cobre-solver     |
| GAP-012 | load_case API and crate boundary type           | cobre-core, cobre-io         |
| GAP-013 | TrainingEvent types for cobre-core              | cobre-sddp                   |
| GAP-014 | Deterministic hash function for seed derivation | cobre-stochastic, cobre-sddp |
| GAP-015 | Simulation-based stopping rule interaction      | cobre-sddp                   |
| GAP-016 | CLI lifecycle audit                             | cobre-cli                    |
| GAP-017 | ferrompi standalone API specification           | ferrompi                     |
| GAP-036 | Solver workspace lifecycle                      | cobre-sddp, cobre-solver     |
| GAP-037 | Lower bound computation clarification           | cobre-sddp                   |
| GAP-038 | Upper bound variance aggregation                | cobre-sddp                   |

## Dependencies

- **Blocked by**: Epics 1, 2, 3 (learnings from those epics inform the refinement of these tickets)
- **Blocks**: Implementation Phase 1

## Refinement Trigger

This epic should be refined when:

1. All 5 Blocker gaps are resolved (Epics 2-3 complete)
2. Learnings from Epics 1-3 are extracted
3. The LP layout and state vector formats are stable

## Tickets

See individual ticket files for outlines. All tickets are at `[OUTLINE]` level.
