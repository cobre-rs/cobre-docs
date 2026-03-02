# ticket-014 Update CLAUDE.md with Decision Log Convention

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add the Decision Log convention to `CLAUDE.md` so that future spec authoring sessions automatically follow the established pattern. The convention should specify: (1) when a new decision must be added to the Decision Log, (2) the inline marker format for primary spec sections, (3) the propagation verification process (checking all affected files when a decision changes), and (4) the "Do NOT" anti-patterns for decision documentation.

## Anticipated Scope

- **Files likely to be modified**:
  - `CLAUDE.md` (root of repo)
- **Key decisions needed**:
  - Where in CLAUDE.md to place the Decision Log section (after "Cross-Reference Index Methodology" seems natural)
  - How prescriptive to be about the convention (full template vs. brief guideline)
  - Whether to add a "Do NOT" entry for decision documentation anti-patterns
- **Open questions**:
  - Should the convention specify a threshold for when a decision is "cross-cutting" (e.g., affects 3+ files)?
  - Should the convention require updating the Decision Log as part of every spec-editing plan, or only when decisions change?

## Dependencies

- **Blocked By**: ticket-012 (Decision Log must exist so the convention can reference it), ticket-013 (inline markers must be established so the convention can describe them)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
