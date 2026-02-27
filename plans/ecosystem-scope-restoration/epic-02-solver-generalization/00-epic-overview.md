# Epic 02: Solver Generalization

## Goal

Generalize the LP layout terminology in `solver-abstraction.md` and rename SDDP-specific methods in `SolverInterface` to generic LP operations. Update all downstream specs that reference these names. This makes `cobre-solver` usable for any LP-based optimization (OPF, unit commitment, column generation) without SDDP assumptions leaking through the solver interface.

## Scope

### In Scope

- `src/specs/architecture/solver-abstraction.md` -- LP layout region naming and terminology
- `src/specs/architecture/solver-interface-trait.md` -- Method renaming + purpose paragraph
- `src/specs/architecture/solver-interface-testing.md` -- Test name updates for new method names
- `src/specs/architecture/solver-workspaces.md` -- Update for generic LP context
- `src/specs/architecture/solver-clp-impl.md` -- Update for new method names
- `src/specs/architecture/solver-highs-impl.md` -- Update for new method names
- `src/specs/architecture/training-loop.md` -- Update call sites for new method names
- `src/specs/hpc/communicator-trait.md` -- Purpose paragraph update

### Out of Scope

- Mathematical formulations in `src/specs/math/` (these are inherently SDDP-specific and correctly so)
- Cut management specs (these are SDDP-domain specs that correctly use SDDP terminology)
- Data model specs (input schemas remain unchanged)
- Rust code changes

## Naming Conventions

### Method Renames (from master plan)

| Current                         | Proposed                    | Type Renames             |
| ------------------------------- | --------------------------- | ------------------------ |
| `add_cut_rows(cuts: &CutBatch)` | `add_rows(rows: &RowBatch)` | `CutBatch` -> `RowBatch` |
| `patch_row_bounds(patches)`     | `set_row_bounds(patches)`   | (no type change)         |
| `patch_col_bounds(patches)`     | `set_col_bounds(patches)`   | (no type change)         |

### LP Layout Region Renames

| Current                            | Proposed                    |
| ---------------------------------- | --------------------------- |
| "cut rows" / "Benders cuts" region | "dynamic constraint rows"   |
| "structural rows"                  | "static constraint rows"    |
| "cut-relevant constraints"         | "dual-relevant constraints" |
| "Top region"                       | "Dual-extraction region"    |
| "Middle region"                    | "Static non-dual region"    |
| "Bottom region"                    | "Dynamic constraint region" |

## Tickets

| Ticket     | Title                                                                    | Files Modified                                                                             | Effort |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------ |
| ticket-006 | Generalize LP layout terminology in solver-abstraction.md                | `src/specs/architecture/solver-abstraction.md`                                             | 5      |
| ticket-007 | Rename SolverInterface methods and update purpose paragraph              | `src/specs/architecture/solver-interface-trait.md`                                         | 3      |
| ticket-008 | Update solver implementation specs for new method names                  | `src/specs/architecture/solver-highs-impl.md`, `src/specs/architecture/solver-clp-impl.md` | 3      |
| ticket-009 | Update solver-interface-testing.md for new method names                  | `src/specs/architecture/solver-interface-testing.md`                                       | 3      |
| ticket-010 | Update solver-workspaces.md and training-loop.md for generic terminology | `src/specs/architecture/solver-workspaces.md`, `src/specs/architecture/training-loop.md`   | 3      |
| ticket-011 | Update communicator-trait.md purpose paragraph                           | `src/specs/hpc/communicator-trait.md`                                                      | 1      |

## Dependencies

- ticket-006 must be completed first (defines the new terminology)
- ticket-007 depends on ticket-006 (references layout terminology)
- tickets 008, 009, 010 depend on ticket-007 (reference method names)
- ticket-011 is independent of other tickets in this epic
- This epic depends on Epic 01 being complete (crate overviews should use generic framing before solver specs are updated)

## Success Criteria

- `solver-abstraction.md` LP layout section is describable without SDDP domain knowledge
- `SolverInterface` method names are natural for any LP use case
- All cross-references resolve correctly (no broken links)
- `mdbook build` passes with no new warnings
- No behavioral contracts are changed
- SS/section-prefix conventions are preserved (no new violations)
