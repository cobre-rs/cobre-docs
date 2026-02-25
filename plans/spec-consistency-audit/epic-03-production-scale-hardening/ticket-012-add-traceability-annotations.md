# ticket-012 Add Traceability Annotations to Production Scale Reference

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add traceability annotations to `production-scale-reference.md` that link each numeric value to its source (LP sizing calculator default configuration, calculator formula, or explicit derivation). The goal is that any reader can independently reproduce every value in the document by running a documented command or following a documented calculation chain.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/specs/overview/production-scale-reference.md` (add annotations throughout sections 3.1-3.4)
- **Key decisions needed**:
  - Format for traceability annotations: inline notes? A new "Traceability" subsection? A footnote system?
  - Whether to add a "Verification" section at the end with exact shell commands to reproduce all values
  - Whether the existing note in section 3.4 ("A sizing calculator tool exists in the powers repository...") is sufficient or needs expansion
- **Open questions**:
  - Should the traceability cover section 4 (performance expectations) as well, even though those values are "aspirational"?
  - How to annotate values that come from the calculator vs values that come from domain expertise (e.g., LP solve time targets)?
  - Should the "Note" in section 3.4 become a more prominent "Verification" subsection?

## Dependencies

- **Blocked By**: ticket-010, ticket-011 (need all values correct before adding traceability)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
