# Epic 03: Solver Interface Trait Formalization

## Goals

Codify the existing solver interface contract (solver-abstraction.md SS4) as a formal trait spec with conformance tests. This is REFERENCE priority -- the contract already exists in detail, but it lacks the formal trait definition and structured conformance test suite that the other abstraction points now have.

## Scope

- 1 new trait spec file: `src/specs/architecture/solver-interface-trait.md`
- 1 new conformance test spec file: `src/specs/architecture/solver-interface-testing.md`
- Update cross-reference-index.md with 2 new rows
- Update SUMMARY.md with 2 new pages under Architecture
- Update `src/crates/solver.md` to reference the new trait spec

## Tickets

| Ticket     | Title                                                        | Estimated Effort |
| ---------- | ------------------------------------------------------------ | ---------------- |
| ticket-011 | Define SolverInterface trait spec                            | 3 points         |
| ticket-012 | Define SolverInterface conformance test spec                 | 3 points         |
| ticket-013 | Update cross-reference-index and SUMMARY for all trait specs | 3 points         |
| ticket-014 | Update crate specs to reference new trait specs              | 2 points         |

## Dependencies

- Depends on Epics 01 and 02 (ticket-013 updates cross-reference-index for ALL trait specs, not just solver)
- ticket-013 must come after all trait specs are created (epics 01, 02, and tickets 011-012)
- ticket-014 must come after ticket-013

## Completion Criteria

- Solver interface trait spec follows the communicator-trait.md pattern
- Conformance test spec covers all 8 operations from solver-abstraction.md SS4.1
- Cross-reference-index.md has rows for all 12 new spec files (6 trait specs + 6 test specs)
- SUMMARY.md includes all 12 new pages
- Crate specs (sddp.md, solver.md, stochastic.md) reference the relevant new trait specs
