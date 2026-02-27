# Epic 01: Framing Restoration

## Goal

Restore generic, ecosystem-appropriate framing in all crate overview files, the ecosystem guidelines document, and the project-level `CLAUDE.md`. This epic is documentation-only: no behavioral contracts, method signatures, or structural patterns change. Only prose descriptions that incorrectly narrow the scope from "power system analysis and optimization ecosystem" to "SDDP solver" are updated.

## Scope

### In Scope

- All 7 crate overview files in `src/crates/` (core, solver, comm, ferrompi, cli, stochastic, io)
- `src/specs/overview/ecosystem-guidelines.md` section 1 (repository layout description)
- `CLAUDE.md` at repository root (project overview paragraph)

### Out of Scope

- Architecture spec purpose paragraphs (those are handled in Epic 02 and Epic 03)
- Method signatures, type names, or behavioral contracts
- Cross-reference index updates (no structural changes in this epic)
- New files (ecosystem-vision.md is in Epic 03)

## Tickets

| Ticket     | Title                                                                          | Files Modified                                                      | Effort |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------ |
| ticket-001 | Restore generic framing in cobre-core overview                                 | `src/crates/core.md`                                                | 1      |
| ticket-002 | Restore generic framing in cobre-solver overview                               | `src/crates/solver.md`                                              | 2      |
| ticket-003 | Restore generic framing in cobre-comm and ferrompi overviews                   | `src/crates/comm.md`, `src/crates/ferrompi.md`                      | 2      |
| ticket-004 | Restore generic framing in cobre-cli, cobre-stochastic, and cobre-io overviews | `src/crates/cli.md`, `src/crates/stochastic.md`, `src/crates/io.md` | 2      |
| ticket-005 | Restore generic framing in ecosystem-guidelines.md and CLAUDE.md               | `src/specs/overview/ecosystem-guidelines.md`, `CLAUDE.md`           | 2      |

## Dependencies

- No dependencies on other epics
- Tickets within this epic are independent and can be executed in any order, but the suggested order ensures simpler files are done first

## Success Criteria

- `grep -r "SDDP" src/crates/` returns zero results in overview paragraphs (SDDP may appear in contextual references like "SDDP training loop" within Key Concepts sections that legitimately describe SDDP-specific usage, but never in the Overview paragraph)
- `mdbook build` passes with no new warnings
- No behavioral contracts are changed
