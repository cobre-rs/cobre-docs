# Epic 02: Core Data Model (GAP-001, GAP-002, GAP-003)

## Goal

Resolve the three foundational Blocker gaps that define the data model layer: the SystemRepresentation top-level type (GAP-001), the Decommissioned operative state (GAP-002), and the MPI broadcast serialization format (GAP-003). These gaps must be resolved before the LP layout (Epic 3) can reference entity collections and type bounds.

## Stakeholder Decisions Applied

- **GAP-001**: Dual-nature design -- clean data models in cobre-core for clarity; performance-adapted structures in cobre-sddp for hot-path operations
- **GAP-002**: Decommissioned = Non-existing (zero variables, zero constraints). Same for hydros -- no reservoir drainage complexity
- **GAP-003**: Use rkyv (zero-copy deserialization). bincode is unmaintained. Add Serialize/Deserialize bounds to necessary types.

## Scope

- Update `src/specs/data-model/internal-structures.md` sections 1 and 2 to resolve GAP-001 and GAP-002
- Update `src/specs/architecture/input-loading-pipeline.md` section 6 to resolve GAP-003
- Update `src/specs/overview/spec-gap-inventory.md` to mark GAP-001, GAP-002, GAP-003 as resolved

## Tickets

| Ticket     | Title                                                          | Gap     | Estimate |
| ---------- | -------------------------------------------------------------- | ------- | -------- |
| ticket-004 | Specify SystemRepresentation struct and dual-nature data model | GAP-001 | 3 points |
| ticket-005 | Resolve Decommissioned operative state                         | GAP-002 | 1 point  |
| ticket-006 | Specify rkyv serialization for MPI broadcast                   | GAP-003 | 2 points |
| ticket-007 | Update spec-gap-inventory for GAP-001 through GAP-003          | --      | 1 point  |

## Dependencies

- **Blocked by**: Epic 1 (ecosystem guidelines provide context for all subsequent work)
- **Blocks**: Epic 3 (LP layout references entity collections from SystemRepresentation, rkyv bounds on types)

## Acceptance Criteria

- [ ] SystemRepresentation has a struct sketch with public accessors, entity-count queries, cascade topology lookup, and `Send + Sync` bounds
- [ ] Internal Structures SS2 states that Decommissioned is treated identically to Non-existing
- [ ] Input Loading Pipeline SS6 specifies rkyv as the serialization format with zero-copy rationale
- [ ] Necessary cobre-core types have `rkyv::Archive + rkyv::Serialize + rkyv::Deserialize` bounds documented
- [ ] spec-gap-inventory entries for GAP-001, GAP-002, GAP-003 are updated to "Resolved" with resolution summaries
