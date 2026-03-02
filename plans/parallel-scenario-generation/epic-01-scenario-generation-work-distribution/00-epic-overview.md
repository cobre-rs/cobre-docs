# Epic 01: Scenario Generation Work Distribution

## Goal

Add explicit parallel execution documentation to the scenario generation specs, bringing them to the same level of parallelism documentation as the cut selection work distribution update (DEC-016). This epic covers the core spec content additions: a new work distribution subsection, opening tree parallelization addendum, forward pass threading documentation, and the DEC-017 decision log entry with inline markers.

## Scope

- New SS2.2b "Work Distribution for Noise Generation" subsection in `scenario-generation.md`
- Addendum to SS2.3 documenting parallel opening tree generation with partitioning formula
- Addendum to SS5.2 documenting forward pass per-thread noise generation calling convention
- DEC-017 decision log entry for communication-free parallel noise generation
- Inline DEC-017 markers in all affected spec files

## Tickets

| Order | Ticket     | Title                                                 | Effort |
| ----- | ---------- | ----------------------------------------------------- | ------ |
| 1     | ticket-001 | Add work distribution for noise generation subsection | 3      |
| 2     | ticket-002 | Document parallel opening tree generation             | 2      |
| 3     | ticket-003 | Document forward pass per-thread noise generation     | 2      |
| 4     | ticket-004 | Add DEC-017 decision log entry and inline markers     | 2      |

## Dependencies

- No external dependencies. This epic uses only existing spec files.
- Ticket-002 depends on ticket-001 (the work distribution model established in SS2.2b is referenced by the opening tree addendum).
- Ticket-003 depends on ticket-001 (the work distribution model is referenced by the forward pass threading documentation).
- Ticket-004 depends on tickets 001-003 (the decision log entry references all three content additions).

## Deliverables

At epic completion:

1. `scenario-generation.md` contains SS2.2b, updated SS2.3, and updated SS5.2
2. `decision-log.md` contains DEC-017 registry row
3. All files listed in DEC-017's Affected Files column contain the inline marker
4. `mdbook build` succeeds without new warnings
