# ticket-007 Rename SolverInterface Methods and Update Purpose Paragraph

## Context

### Background

The `SolverInterface` trait in `solver-interface-trait.md` has methods with SDDP-specific names: `add_cut_rows` (should be generic batch row addition), `patch_row_bounds` and `patch_col_bounds` (the "patch" verb implies SDDP scenario patching when "set" is more generic). The purpose paragraph also frames the trait as "the backend abstraction through which the SDDP training loop performs LP operations." After ticket-006 establishes generic LP layout terminology, this ticket renames the methods to match.

### Relation to Epic

This ticket depends on ticket-006 (LP layout terminology) and is depended upon by tickets 008, 009, and 010 (which update downstream references to the renamed methods).

### Current State

File `src/specs/architecture/solver-interface-trait.md`:

- Purpose paragraph: "through which the SDDP training loop performs LP operations: loading stage templates, adding Benders cuts, patching scenario-dependent RHS/bounds"
- Method `add_cut_rows(&mut self, cuts: &CutBatch)` -- SDDP-specific name
- Method `patch_row_bounds(&mut self, patches: &[(usize, f64, f64)])` -- "patch" implies SDDP scenario patching
- Method `patch_col_bounds(&mut self, patches: &[(usize, f64, f64)])` -- same issue
- Convention blockquote is present and correct (must NOT be modified)
- 10 methods total; 7 are already generic (`load_model`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name`)

## Specification

### Requirements

1. Update the Purpose paragraph to describe the trait generically: "through which optimization algorithms perform LP operations: loading models, adding constraint rows, updating bounds, solving, and extracting solutions"
2. Rename `add_cut_rows` to `add_rows` throughout the file
3. Rename `CutBatch` type to `RowBatch` throughout the file
4. Rename `patch_row_bounds` to `set_row_bounds` throughout the file
5. Rename `patch_col_bounds` to `set_col_bounds` throughout the file
6. Update all method contract sections (SS2.1-SS2.8) to use new names
7. Update doc comments on the renamed methods to use generic language
8. Update the Cross-References section to reflect new terminology
9. Preserve the convention blockquote VERBATIM -- do not modify a single character
10. Preserve all behavioral contracts, preconditions, postconditions unchanged
11. Preserve the SS/section prefix convention (SS prefix for architecture cross-links)

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-interface-trait.md`
- Dependency: ticket-006 must be complete (this file references LP layout terminology from `solver-abstraction.md`)

### Outputs/Behavior

- Three methods renamed with generic LP terminology
- One type renamed (CutBatch -> RowBatch)
- Purpose paragraph describes generic LP solver interface
- All behavioral contracts identical
- Convention blockquote unchanged

### Error Handling

- The convention blockquote must be preserved exactly. Verify by diffing the blockquote against the canonical text in `CLAUDE.md`.
- SS section numbers do NOT change (SS1, SS2, etc.)

## Acceptance Criteria

- [ ] Given `solver-interface-trait.md`, when the trait definition is read, then the methods are named `add_rows`, `set_row_bounds`, and `set_col_bounds`
- [ ] Given `solver-interface-trait.md`, when the Purpose paragraph is read, then it describes "optimization algorithms" performing "LP operations," not "the SDDP training loop"
- [ ] Given `solver-interface-trait.md`, when `grep "add_cut_rows" solver-interface-trait.md` is run, then zero matches are found
- [ ] Given `solver-interface-trait.md`, when `grep "CutBatch" solver-interface-trait.md` is run, then zero matches are found
- [ ] Given `solver-interface-trait.md`, when `grep "patch_row_bounds\|patch_col_bounds" solver-interface-trait.md` is run, then zero matches are found
- [ ] Given `solver-interface-trait.md`, when the convention blockquote is compared to the canonical text in `CLAUDE.md`, then they are character-for-character identical (with the `../hpc/backend-testing.md` path)
- [ ] Given `solver-interface-trait.md`, when all preconditions and postconditions tables are diffed against originals (ignoring the method name change), then behavioral contracts are unchanged
- [ ] Given `solver-interface-trait.md`, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Downstream specs that reference these method names (tickets 008-010)
- Mathematical content in method contracts
- Behavioral contracts (only names change)

## Implementation Guide

### Suggested Approach

1. **Purpose paragraph**: Replace SDDP-specific framing with: "the backend abstraction through which optimization algorithms perform LP operations: loading models, adding constraint rows, updating row and column bounds, solving, warm-starting from a cached basis, and extracting solution data."
2. **SS1 Trait Definition**: In the Rust code block:
   - Rename `fn add_cut_rows(&mut self, cuts: &CutBatch)` -> `fn add_rows(&mut self, rows: &RowBatch)`
   - Rename `fn patch_row_bounds` -> `fn set_row_bounds`
   - Rename `fn patch_col_bounds` -> `fn set_col_bounds`
   - Update doc comments: "Batch-add active Benders cuts as LP rows" -> "Batch-add constraint rows to the LP"
   - Update doc comment on `set_row_bounds`: "Update scenario-dependent row bounds" -> "Update row bounds (constraint RHS values)"
   - Update doc comment on `set_col_bounds`: similarly generic
3. **SS2 Method Contracts**: Update section headings:
   - "SS2.2 add_cut_rows" -> "SS2.2 add_rows"
   - "SS2.3 patch_row_bounds" -> "SS2.3 set_row_bounds"
   - "SS2.3a patch_col_bounds" -> "SS2.3a set_col_bounds"
4. **SS2.2 add_rows contract**: Update prose from "appends active Benders cuts" to "appends constraint rows." Note that in SDDP, this is used for Benders cuts (reference `cobre-sddp` as the caller).
5. **Throughout**: Search for all instances of the old names and replace

### Key Files to Modify

- `src/specs/architecture/solver-interface-trait.md`

### Patterns to Follow

- `add_rows` / `RowBatch` for generic batch row addition
- `set_row_bounds` / `set_col_bounds` for generic bound updates
- Keep SDDP as example usage: "In SDDP, this is used to add Benders cuts" as parenthetical notes
- Preserve all cross-reference link formats: `[Solver Abstraction SS2.2](./solver-abstraction.md)` etc.

### Pitfalls to Avoid

- CRITICAL: Do NOT modify the convention blockquote
- Do NOT change SS section numbers
- Do NOT change behavioral contracts (preconditions, postconditions, error semantics)
- Do NOT modify the solver API mapping tables (HiGHS/CLP API calls stay the same)
- Verify that the `§` inside the convention blockquote remains `§1` (not `SS1`)

## Testing Requirements

### Unit Tests

- `grep "add_cut_rows" src/specs/architecture/solver-interface-trait.md` returns 0 matches
- `grep "CutBatch" src/specs/architecture/solver-interface-trait.md` returns 0 matches
- `grep "patch_row_bounds\|patch_col_bounds" src/specs/architecture/solver-interface-trait.md` returns 0 matches
- Convention blockquote verification: extract blockquote, compare to canonical text

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: ticket-006 (LP layout terminology must be established first)
- **Blocks**: ticket-008, ticket-009, ticket-010

## Effort Estimate

**Points**: 3
**Confidence**: High
