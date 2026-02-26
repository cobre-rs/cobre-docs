# ticket-005: Resolve Decommissioned Operative State

## Context

### Background

GAP-002 identifies that the Decommissioned operative state in Internal Structures SS2 references an "open question" in Input System Entities SS3. The LP treatment of Decommissioned entities is undefined -- it is unclear whether Decommissioned matches Non-existing (zero variables, zero constraints) or has residual constraints such as reservoir drainage.

The stakeholder decision is clear: **Decommissioned = Non-existing**. Zero variables, zero constraints. Same treatment for hydros -- no reservoir drainage complexity. The hydro lifecycle should be simple in both non-existent and decommissioned states.

### Relation to Epic

Second ticket of Epic 2. A small, focused change to Internal Structures SS2. Can proceed independently of ticket-004 (SystemRepresentation), though both modify the same file.

### Current State

`src/specs/data-model/internal-structures.md` SS2 (Operative State) contains a table:

| State          | Applies To       | LP Treatment                                                     |
| -------------- | ---------------- | ---------------------------------------------------------------- |
| Non-existing   | All entity types | No LP variables or constraints                                   |
| Filling        | Hydros only      | Storage, spillage, evaporation, violation slacks. No generation. |
| Operating      | All entity types | Full LP variables and constraints                                |
| Decommissioned | All entity types | See open question in [Input System Entities SS3]                 |

The Decommissioned row references an open question instead of defining the LP treatment.

## Specification

### Requirements

1. Update the Decommissioned row in Internal Structures SS2 operative state table to specify LP treatment as "No LP variables or constraints (identical to Non-existing)"
2. Remove the "open question" reference from the Decommissioned row
3. Add a note explaining the stakeholder decision: decommissioned entities are treated identically to non-existing entities for the minimal viable solver, with no reservoir drainage complexity
4. If the "open question" in `src/specs/data-model/input-system-entities.md` SS3 exists, add a resolution note there as well

### Inputs/Props

- Current text of `src/specs/data-model/internal-structures.md` SS2
- Stakeholder decision: Decommissioned = Non-existing

### Outputs/Behavior

Updated SS2 with resolved Decommissioned state and no open questions.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given Internal Structures SS2 is read, when the Decommissioned row is inspected, then the LP Treatment column says "No LP variables or constraints (identical to Non-existing)"
- [ ] Given Internal Structures SS2 is read, when a developer searches for "open question," then no open question references remain in the operative state section
- [ ] Given the operative state table is read, when a developer considers entity lifecycle, then only 3 meaningful LP states exist: Non-existing (includes Decommissioned), Filling (hydros only), and Operating
- [ ] Given a developer reads the resolution note, when they look for the rationale, then they find an explanation that decommissioning does not require reservoir drainage in the minimal viable solver

## Implementation Guide

### Suggested Approach

1. Open `src/specs/data-model/internal-structures.md`
2. Find the operative state table in SS2
3. Change the Decommissioned LP Treatment from "See open question..." to "No LP variables or constraints (identical to Non-existing)"
4. Add a note below the table: "**Stakeholder decision**: Decommissioned entities are treated identically to Non-existing for all entity types, including hydros. Reservoir drainage after decommissioning is not modeled. This simplifies the lifecycle to three meaningful LP states: Non-existing/Decommissioned (no LP presence), Filling (hydros only), and Operating (full LP formulation)."
5. Check `src/specs/data-model/input-system-entities.md` for the referenced open question and add a resolution note if found
6. Verify `mdbook build` succeeds

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md` -- SS2 (Operative State)
- **Possibly edit**: `/home/rogerio/git/cobre-docs/src/specs/data-model/input-system-entities.md` -- SS3 (if open question exists there)

### Patterns to Follow

- Use the `§` prefix for internal section references within data-model files
- Use bold text for stakeholder decision callouts

### Pitfalls to Avoid

- Do NOT remove the Decommissioned state from the table -- it still exists as a concept (entities can have `exit_stage_id`), it just has the same LP treatment as Non-existing
- Do NOT modify the Filling state -- it is well-specified and unchanged by this decision
- Do NOT change the `entry_stage_id` / `exit_stage_id` lifecycle semantics -- only the LP treatment of Decommissioned is being resolved

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes

## Dependencies

- **Blocked By**: ticket-001 (ecosystem guidelines context)
- **Blocks**: ticket-007 (gap inventory update)

## Effort Estimate

**Points**: 1
**Confidence**: High
