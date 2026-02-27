# Epic 01: GAP Marker Cleanup

## Goal

Remove all stale inline `GAP-XXX` references from spec prose outside `spec-gap-inventory.md`, so that developers encounter no "pending decision" or "open gap" language for decisions that have already been resolved and incorporated into the specs.

## Scope

Investigation identified 9 inline GAP references across 5 spec files (outside `spec-gap-inventory.md`):

| File                                            | GAP IDs                 | Reference Type                                                        |
| ----------------------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| `src/specs/architecture/training-loop.md`       | GAP-032                 | Design note blockquote -- decision content already inline             |
| `src/specs/hpc/communicator-trait.md`           | GAP-033                 | Section heading parenthetical + self-referential §-style refs in body |
| `src/specs/architecture/solver-abstraction.md`  | GAP-010                 | Stakeholder decision blockquote -- decision content already inline    |
| `src/specs/architecture/scenario-generation.md` | GAP-039                 | Architectural note blockquote -- explains why GAP-039 is a false gap  |
| `src/specs/overview/ecosystem-guidelines.md`    | GAP-001 through GAP-005 | Blocker table in implementation readiness section                     |

## Approach

Each GAP reference falls into one of three handling patterns:

1. **Design note blockquotes** (GAP-010, GAP-032): Remove the `(GAP-XXX)` label from the blockquote opener. The decision content is already present in the prose -- only the gap tracker reference is stale.
2. **Section heading labels** (GAP-033): Remove the `(GAP-033)` parenthetical from the heading. The section content stands on its own.
3. **Blocker table in ecosystem-guidelines.md** (GAP-001 through GAP-005): Update the table or surrounding prose to reflect that all 5 blockers are now resolved.
4. **False-gap explanations** (GAP-039): The architectural note explains why GAP-039 is not a real gap. Remove the GAP-039 reference while preserving the architectural insight.

## Deliverables

- 5 spec files cleaned of stale GAP references
- `mdbook build` succeeds with no new warnings
- `grep "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md` returns zero matches

## Tickets

| Ticket     | Title                                     | Scope                                                               |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------- |
| ticket-001 | Remove inline GAP markers from spec prose | Clean GAP-010, GAP-032, GAP-033, GAP-039 from 4 spec files          |
| ticket-002 | Update ecosystem-guidelines blocker table | Mark GAP-001 through GAP-005 as resolved in ecosystem-guidelines.md |
