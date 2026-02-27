# ticket-008 Update Solver Implementation Specs for New Method Names

## Context

### Background

The HiGHS and CLP implementation specs (`solver-highs-impl.md`, `solver-clp-impl.md`) contain sections that map `SolverInterface` methods to solver-specific API calls. After ticket-007 renames `add_cut_rows` -> `add_rows`, `patch_row_bounds` -> `set_row_bounds`, and `patch_col_bounds` -> `set_col_bounds`, these implementation specs must be updated to reference the new method names. The purpose paragraphs also use SDDP-specific framing.

### Relation to Epic

This ticket updates the two solver implementation specs that directly reference the renamed methods from ticket-007.

### Current State

File `src/specs/architecture/solver-highs-impl.md`:

- Purpose paragraph: "HiGHS integration as the first open-source LP solver reference implementation for Cobre" (acceptable but has "SDDP-tuned configuration")
- SS2.2: "Add Cut Rows" section heading
- SS2.3: "Patch Scenario-Dependent Values" section heading

File `src/specs/architecture/solver-clp-impl.md`:

- Purpose paragraph: similar SDDP-specific framing
- SS2.2: "Add Cut Rows" section heading
- SS2.3: "Patch Scenario-Dependent Values" section heading

## Specification

### Requirements

1. Update `solver-highs-impl.md` SS2.2 heading from "Add Cut Rows" to "Add Rows"
2. Update `solver-highs-impl.md` SS2.3 heading from "Patch Scenario-Dependent Values" to "Set Row Bounds" (or "Update Row Bounds")
3. Update all references to `add_cut_rows` -> `add_rows`, `patch_row_bounds` -> `set_row_bounds`, `patch_col_bounds` -> `set_col_bounds` in `solver-highs-impl.md`
4. Apply the same changes to `solver-clp-impl.md`
5. Update purpose paragraphs to use generic LP framing where currently SDDP-specific
6. Update references to LP layout terminology per ticket-006 (e.g., "cut rows" -> "dynamic constraint rows")
7. Preserve all API call mappings, code snippets, and behavioral descriptions
8. Preserve all cross-reference links

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-highs-impl.md`, `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-clp-impl.md`
- Dependencies: ticket-006 (layout terminology), ticket-007 (method names)

### Outputs/Behavior

- Both files reference the new method names
- Section headings updated to match new method names
- Purpose paragraphs use generic LP framing
- All API mappings, code examples, and behavioral contracts unchanged
- SDDP-specific configuration sections (SS4 "SDDP-Tuned Settings") retain SDDP context since they describe SDDP-specific solver tuning

### Error Handling

- SS4 "SDDP-Tuned Settings" is legitimately SDDP-specific (it describes solver configuration for SDDP workloads). Keep the heading and content as-is, but note that these settings are "optimized for decomposition workloads" or similar generic framing.

## Acceptance Criteria

- [ ] Given `solver-highs-impl.md`, when `grep "add_cut_rows" solver-highs-impl.md` is run, then zero matches are found
- [ ] Given `solver-clp-impl.md`, when `grep "add_cut_rows" solver-clp-impl.md` is run, then zero matches are found
- [ ] Given both files, when the SS2.2 heading is read, then it says "Add Rows" not "Add Cut Rows"
- [ ] Given both files, when the SS2.3 heading is read, then it uses "Set Row Bounds" or "Update Row Bounds" terminology, not "Patch Scenario-Dependent Values"
- [ ] Given both files, when all API call mappings (HiGHS C API calls, CLP C API calls) are diffed against originals, then the actual API function names are unchanged
- [ ] Given both files, when `mdbook build` is run, then the build succeeds with no new warnings

### Out of Scope

- Changing actual HiGHS or CLP API function names (these are external C library calls)
- SS4 configuration content (SDDP-specific solver tuning is correct)
- SS5 C++ Wrapper Strategy in CLP impl (already generic)
- Memory footprint sections

## Implementation Guide

### Suggested Approach

**For `solver-highs-impl.md`:**

1. Purpose paragraph: Replace "SDDP-tuned configuration" with "optimization-tuned configuration" in the first sentence. Keep the rest generic.
2. SS2.2: Rename heading to "Add Rows" (was "Add Cut Rows"). Update prose: "adds multiple constraint rows" instead of "adds multiple cut rows."
3. SS2.3: Rename heading to "Set Row Bounds" (was "Patch Scenario-Dependent Values"). Update prose: "updates row bounds" instead of "scenario patching." Note SDDP usage: "In SDDP, this is used for scenario-dependent RHS updates (~2,240 per solve)."
4. Search for all other references to old method names and update

**For `solver-clp-impl.md`:**

1. Same pattern as HiGHS
2. CLP's mutable pointer access section (SS2.3) stays technically identical but framing changes from "Patch Scenario-Dependent Values" to "Set Row Bounds"
3. The CLP "Safety note" about mutable pointers being valid only while the model is unchanged stays as-is

### Key Files to Modify

- `src/specs/architecture/solver-highs-impl.md`
- `src/specs/architecture/solver-clp-impl.md`

### Patterns to Follow

- Method name consistency with ticket-007: `add_rows`, `set_row_bounds`, `set_col_bounds`
- Layout terminology consistency with ticket-006: "dynamic constraint rows", "static rows"
- SDDP as usage example: "In SDDP, the ~2,240 RHS updates per solve target state-linking constraints"
- API call names are external and stay unchanged

### Pitfalls to Avoid

- Do NOT change HiGHS or CLP C API function names (e.g., `Highs_addRows`, `Clp_addRows` stay as-is)
- Do NOT change SS4 "SDDP-Tuned Settings" heading -- this section IS about SDDP-specific configuration
- Do NOT change the retry strategy content (behavioral contracts)
- Do NOT modify cross-reference section numbers

## Testing Requirements

### Unit Tests

- `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" src/specs/architecture/solver-highs-impl.md` returns 0
- `grep "add_cut_rows\|patch_row_bounds\|patch_col_bounds" src/specs/architecture/solver-clp-impl.md` returns 0

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: ticket-006, ticket-007
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
