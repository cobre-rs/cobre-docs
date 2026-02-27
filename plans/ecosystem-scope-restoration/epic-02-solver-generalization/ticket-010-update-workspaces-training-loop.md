# ticket-010 Update solver-workspaces.md and training-loop.md for Generic Terminology

## Context

### Background

The solver workspaces spec and training loop spec both reference old method names and LP layout terminology from `solver-abstraction.md`. After tickets 006-007 establish new terminology, these two files need updating. `solver-workspaces.md` references the stage solve workflow (SS1.4) which uses old method names. `training-loop.md` calls `SolverInterface` methods by the old names in its forward/backward pass descriptions.

### Relation to Epic

This ticket updates the two remaining architecture specs that reference solver methods and layout terminology. It is the last high-impact ticket in Epic 02.

### Current State

File `src/specs/architecture/solver-workspaces.md`:

- SS1.4 Stage Solve Workflow: references `addRows` for cuts, "patch scenario values" for RHS updates
- SS1.4 step 2: "Add active cuts" using `addRows`
- SS1.4 step 3: "Patch scenario values" using `patch_row_bounds`
- SS2.5: "Scaling Integration with Stage Solve Workflow" references `addRows`

File `src/specs/architecture/training-loop.md`:

- Purpose paragraph: "Cobre SDDP training loop architecture" -- this is correct (it IS the SDDP training loop)
- SS4-SS5 describe forward/backward passes calling solver methods by old names
- References to `add_cut_rows`, `patch_row_bounds`, cut rows

## Specification

### Requirements

1. Update `solver-workspaces.md` SS1.4 step names:
   - Step 2: "Add active cuts" -> "Add dynamic constraints" (or "Add active constraints")
   - Step 3: "Patch scenario values" -> "Set row bounds" (or "Update row bounds")
2. Update method references in `solver-workspaces.md` from old to new names
3. Update LP layout terminology references per ticket-006
4. Update `training-loop.md` method references from old to new names
5. In `training-loop.md`, keep SDDP-specific framing (it IS the SDDP training loop spec) but use new method names when referencing `SolverInterface` operations
6. Preserve all behavioral descriptions, performance characteristics, and timing analysis
7. Preserve all cross-reference links

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-workspaces.md`, `/home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md`
- Dependencies: ticket-006 (layout terms), ticket-007 (method names)

### Outputs/Behavior

- Both files reference new method names when calling `SolverInterface`
- Layout terminology updated (dynamic constraints, static rows, etc.)
- Training loop spec retains SDDP-specific framing (it describes the SDDP training loop)
- All behavioral descriptions unchanged
- All cross-reference links intact

### Error Handling

- `training-loop.md` is inherently SDDP-specific -- do NOT genericize its core content. Only update method names and LP layout terminology references. The training loop calls `add_rows` (which it uses for Benders cuts) and `set_row_bounds` (which it uses for scenario RHS patching).

## Acceptance Criteria

- [ ] Given `solver-workspaces.md` SS1.4, when step 2 is read, then it references `add_rows` (not `add_cut_rows`) and "dynamic constraints" (not "cuts")
- [ ] Given `solver-workspaces.md` SS1.4, when step 3 is read, then it references `set_row_bounds` (not `patch_row_bounds`)
- [ ] Given `training-loop.md`, when `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" training-loop.md` is run, then zero matches are found
- [ ] Given `training-loop.md`, when the SDDP algorithm description is read, then it still describes SDDP (not generalized to arbitrary algorithms)
- [ ] Given both files, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Training loop SDDP algorithm description (correctly SDDP-specific)
- Performance analysis numbers in workspaces spec
- Memory footprint tables
- Scaling integration details (SS2.5) beyond method name references

## Implementation Guide

### Suggested Approach

**For `solver-workspaces.md`:**

1. SS1.4 Stage Solve Workflow steps:
   - Step 2: "Add active dynamic constraints (if stage changed) -- Batch-add active constraints from the constraint pool via `add_rows` in CSR format."
   - Step 3: "Set row bounds -- Write scenario-dependent values into the bound patch buffer, then apply via `set_row_bounds`."
2. Update SS1.4 commentary: "steps 1-2 are skipped for within-stage solves" stays
3. SS2.5 Scaling Integration: Update "Add active cuts" -> "Add dynamic constraints" in the table
4. Update references to `addRows` (the raw API call) -- keep the API call name but update the Cobre method name

**For `training-loop.md`:**

1. Search for all references to `add_cut_rows` and replace with `add_rows`
2. Search for all references to `patch_row_bounds` and replace with `set_row_bounds`
3. Where the text says "add Benders cuts via add_cut_rows," change to "add Benders cuts via `add_rows`" -- the SDDP domain term "Benders cuts" stays, but the method name changes
4. Update LP layout terminology references where they appear

### Key Files to Modify

- `src/specs/architecture/solver-workspaces.md` (SS1.4, SS2.5)
- `src/specs/architecture/training-loop.md` (forward/backward pass sections)

### Patterns to Follow

- `training-loop.md` keeps SDDP domain terminology but uses new method names for `SolverInterface` calls
- `solver-workspaces.md` uses generic method names and layout terminology
- Pattern: "The backward pass adds Benders cuts via `add_rows`" -- SDDP domain + generic method

### Pitfalls to Avoid

- Do NOT genericize `training-loop.md` content -- it IS the SDDP training loop spec
- Do NOT change performance numbers or timing analysis
- Do NOT change the raw solver API call names (`Highs_addRows`, `Clp_addRows` -- these are external API names)
- `training-loop.md` is a large file (~73KB) -- be thorough in searching for old method names

## Testing Requirements

### Unit Tests

- `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" src/specs/architecture/solver-workspaces.md` returns 0
- `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" src/specs/architecture/training-loop.md` returns 0

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: ticket-006, ticket-007
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: Medium (training-loop.md is 73KB and requires thorough search)
