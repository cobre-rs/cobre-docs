# ticket-006 Generalize LP Layout Terminology in solver-abstraction.md

## Context

### Background

The `solver-abstraction.md` file defines the LP layout convention (SS2) that all solver operations reference. Currently it uses SDDP-specific terminology: "Benders cuts" region, "cut rows," "cut-relevant constraints," and "structural rows." These terms should be generic LP terminology so that the layout is natural for any decomposition method (Benders, column generation, Dantzig-Wolfe, etc.) or any LP-based optimization (OPF, unit commitment).

### Relation to Epic

This is the foundational ticket in Epic 02. All other tickets in this epic depend on the terminology established here. The LP layout naming in this file propagates to every solver-related spec.

### Current State

File `src/specs/architecture/solver-abstraction.md`:

- SS2 "LP Layout Convention" uses "cut rows" and "Benders cuts" throughout
- SS2.2 Row Layout table has three regions: "Top" (cut-relevant), "Middle" (structural), "Bottom" (Benders cuts)
- SS2.2 Bottom region: "Benders cuts (active only)" with "Rebuilt each iteration via batch `addRows`"
- SS2.3 "Interaction with Basis Persistence" references "adding new cuts"
- SS5 "Cut Pool Design" -- this is SDDP-specific content that stays SDDP-specific, but its references to the layout use "cut rows"
- The Purpose paragraph references "SDDP algorithm" directly

## Specification

### Requirements

1. Update the Purpose paragraph of `solver-abstraction.md` to describe the solver abstraction generically (not "through which the SDDP algorithm interacts with LP solvers")
2. Rename the three row layout regions in SS2.2:
   - "Top" region -> "Dual-extraction region" (constraints whose duals contribute to subgradient/gradient computation)
   - "Middle" region -> "Static non-dual region" (structural constraints not needed for gradients)
   - "Bottom" region -> "Dynamic constraint region" (constraints added/removed at runtime via batch `add_rows`)
3. Replace "cut-relevant constraints" with "dual-relevant constraints" throughout SS2
4. Replace "Benders cuts" with "dynamic constraints" in the layout description (SDDP-specific sections like SS5 keep "Benders cuts" since they describe the SDDP domain)
5. Replace "structural rows" with "static constraint rows" in the layout description
6. Update SS2.3 "Interaction with Basis Persistence" to use new terminology
7. Update SS2.4 "Worked Example" to use new terminology
8. Update the SS1 "Design Rationale" to frame the solver abstraction generically
9. Preserve all mathematical formulas, index formulas, and worked examples
10. Preserve all cross-reference links
11. Do NOT change behavioral contracts, postconditions, or preconditions

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md`
- The file is large (~60KB). Only sections SS1 (Purpose + Design Rationale), SS2 (LP Layout Convention), and their cross-references need updating. Sections SS3-SS11 use the old terminology in places and should be updated where they reference the layout, but their SDDP-specific domain content (cut pool, Benders decomposition details) stays as-is.

### Outputs/Behavior

- LP layout description uses generic terminology
- SDDP-specific sections (SS5 Cut Pool, SS7 Retry Logic, SS8 Dual Normalization) retain SDDP terminology since they describe SDDP-domain behavior
- All index formulas and mathematical content unchanged
- All cross-reference links intact

### Error Handling

- When a section uses "cut" to mean "Benders cut" in an SDDP-specific context (SS5, SS7, SS8), keep "cut" -- only the layout region names and method-level descriptions change
- The term "cut" in mathematical formulas (like the cut coefficient computation) stays because it is mathematically precise

## Acceptance Criteria

- [ ] Given `solver-abstraction.md` SS2.2, when the row layout table is read, then the three regions are named "Dual-extraction region," "Static non-dual region," and "Dynamic constraint region" (or equivalent generic names)
- [ ] Given `solver-abstraction.md` SS2.2 Bottom region, when read, then it says "Dynamic constraints" not "Benders cuts" as the region name, though it may note "e.g., Benders cuts in SDDP" as an example
- [ ] Given `solver-abstraction.md` Purpose paragraph, when read, then it describes the solver abstraction generically, not as "through which the SDDP algorithm interacts"
- [ ] Given `solver-abstraction.md`, when all cross-reference links are checked, then none are broken
- [ ] Given `solver-abstraction.md`, when `mdbook build` is run, then the build succeeds with no new warnings

### Out of Scope

- SS5 Cut Pool Design (SDDP-specific domain content)
- SS7 Retry Logic Contract (behavioral contract, SDDP-specific)
- SS8 Dual Normalization (mathematical content, SDDP-specific)
- Mathematical formulas for cut coefficient computation
- Column layout (SS2.1) -- column ordering is already generic (state variables, decision variables)

## Implementation Guide

### Suggested Approach

1. **Purpose paragraph**: Replace "the unified interface through which the SDDP algorithm interacts with LP solvers" with "the unified interface through which optimization algorithms interact with LP solvers." Add "including the solver interface contract, LP layout convention, dynamic constraint management, ..." to replace "cut pool design"
2. **SS1 Design Rationale**: Replace "The SDDP algorithm must be solver-agnostic" with "Optimization algorithms using this layer must be solver-agnostic." Replace "SDDP algorithm only sees success or failure" with "calling algorithm only sees success or failure"
3. **SS2.2 Row Layout table**:
   - Top region: `[0, n_dual_relevant)` -- "All constraints whose duals contribute to subgradient computation (sub-regions defined below)"
   - Middle region: `[n_dual_relevant, n_static)` -- "All other static constraints: load balance, generation/flow bounds, penalty bounds, remaining constraints"
   - Bottom region: `[n_static, n_static + n_dynamic)` -- "Dynamic constraints (added at runtime via batch `add_rows`)"
4. **Variable renames in SS2.2**: `n_cut_relevant` -> `n_dual_relevant`, `n_structural` -> `n_static`, `n_active_cuts` -> `n_dynamic`
5. **SS2.2 subregion formulas**: `n_cut_relevant = N + N*L + n_fpha + n_gvc` stays mathematically identical, just rename the variable
6. **SS2.3**: Replace "adding new cuts" with "adding new dynamic constraints"; replace "cut rows" with "dynamic constraint rows"
7. **SS2.4**: Update worked example commentary to use new terms
8. **Sections SS3-SS11**: Search-and-replace in references to the layout. When a section describes "adding cuts to the LP," keep "cuts" if it is SDDP context, but update "bottom row region" to "dynamic constraint region"

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md` (sections: Purpose, SS1, SS2, and layout references in SS3-SS11)

### Patterns to Follow

- "dynamic constraints" for the bottom region (constraints added at runtime)
- "static constraints" for the structural region (present in the base model)
- "dual-relevant" for constraints whose duals feed subgradient computation
- Keep SDDP terminology in SDDP-specific sections (SS5, SS7, SS8) -- these are domain specs
- Maintain all mathematical notation unchanged

### Pitfalls to Avoid

- Do NOT rename `n_structural` in mathematical formulas without updating every reference -- the variable appears in many places
- Do NOT remove the FPHA, water balance, and AR lag constraint descriptions from the dual-extraction region -- these are concrete instances that stay
- Do NOT change cross-reference link targets (SS section numbers stay the same)
- Do NOT change the column layout (SS2.1) -- it is already generic
- Be careful with "cut" vs "dynamic constraint" in SS5 (Cut Pool Design) -- this section IS about SDDP Benders cuts and should keep that terminology

## Testing Requirements

### Unit Tests

- Search `solver-abstraction.md` SS2 heading area for "Benders cuts" as a region name -- 0 matches
- Verify all occurrences of `n_cut_relevant` in the file are replaced with `n_dual_relevant`
- Verify all occurrences of "structural rows" in SS2 are replaced with "static constraint rows" or "static rows"

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-007, ticket-008, ticket-009, ticket-010 (all reference terminology from this file)

## Effort Estimate

**Points**: 5
**Confidence**: Medium (large file with many cross-references; the rename must be consistent across ~60KB)
