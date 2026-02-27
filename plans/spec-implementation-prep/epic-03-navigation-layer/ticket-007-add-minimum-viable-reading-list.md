# ticket-007 Add Minimum Viable Reading List to Implementation-Ordering

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add a new section to `src/specs/overview/implementation-ordering.md` that provides a flat, dependency-ordered "Minimum Viable Reading List" -- the 8-12 spec files a developer must read before writing any Cobre code. This section reduces the cognitive overhead of navigating the 84-file corpus by providing a curated entry point for implementation.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/overview/implementation-ordering.md` (add new section), possibly `src/specs/overview/ecosystem-guidelines.md` (add cross-reference to the new section)
- **Key decisions needed**:
  - The exact set of 8-12 specs to include (candidates: design-principles, notation-conventions, internal-structures, lp-formulation, sddp-algorithm, training-loop, solver-abstraction, solver-interface-trait, communicator-trait, input-directory-structure, implementation-ordering itself)
  - The dependency ordering within the flat list (which specs assume knowledge from other specs)
  - Whether to include brief annotations (1-sentence description of what each spec contributes to the developer's understanding) or just the links
  - Section number for the new section (likely section 9, after the existing Cross-References section 8)
- **Open questions**:
  - Should the reading list be organized by "concept layers" (math first, then data model, then architecture, then HPC) or strictly by dependency?
  - Should the list include the overview specs (design-principles, notation-conventions) or only the technical specs that directly inform implementation?
  - Does this section belong in `implementation-ordering.md` or should it be a separate overview file?

## Dependencies

- **Blocked By**: ticket-006-update-implementation-ordering-reading-lists.md (the per-phase reading lists must be complete before the minimum viable list is curated from them)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
