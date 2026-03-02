# ticket-013 Add Inline Decision Markers to Primary Spec Sections

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add standardized inline decision markers at each primary spec section that owns a cross-cutting decision. The marker format links back to the Decision Log entry, making it clear when reading a spec section that it contains an authoritative decision record and where the full propagation list can be found. This creates a bidirectional link: Decision Log points to affected files, and affected files point to the Decision Log.

## Anticipated Scope

- **Files likely to be modified**: Every spec file that owns a primary cross-cutting decision. Estimated 10-15 files, primarily in `src/specs/architecture/` and `src/specs/overview/`. Exact list depends on the decisions cataloged in ticket-012.
- **Key decisions needed**:
  - Exact blockquote format for the inline marker (e.g., `> **Decision DEC-NNN (active)**: [brief summary]. See [Decision Log](../overview/decision-log.md#dec-nnn) for affected files.`)
  - Whether to add markers to ALL decision sites or only to the primary (owning) section
  - Whether the marker replaces existing decision blockquotes (e.g., the "Decision (2026-02-16)" blockquotes) or supplements them
- **Open questions**:
  - How to handle decision blockquotes that were written before this convention (e.g., the binary-formats Decision blockquote that was updated in ticket-002)? Should they be reformatted to the new standard?
  - Should the marker include the Decision ID from the Decision Log?

## Dependencies

- **Blocked By**: ticket-012 (Decision Log must exist before markers can reference it)
- **Blocks**: ticket-017 (full-corpus verification checks for marker consistency)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
