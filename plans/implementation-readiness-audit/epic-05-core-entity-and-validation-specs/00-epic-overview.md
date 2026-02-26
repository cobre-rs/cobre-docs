# Epic 05: Core Entity Struct Definitions and Validation Specs

## Goal

Resolve the high-effort Batch 1 conditions that require substantive spec authoring: adding Rust struct definitions for all cobre-core entity types (C-01, C-02, C-03), enumerating the complete validation checklist for entity cross-references (C-04/GAP-029), and defining the `OpeningTree` Rust type with ownership model (C-09/GAP-023). These are the conditions that require domain understanding and design decisions, not mechanical find-and-replace.

## Scope

- Add Rust struct definitions for 7 entity types (Bus, Line, Thermal, Hydro, PumpingStation, EnergyContract, NonControllableSource) to `src/specs/data-model/internal-structures.md`
- Define `EntityId` as a concrete type or alias in the same file
- Add Rust struct definitions for `Stage`, `Block`, `PolicyGraph` to the same file
- Enumerate all entity cross-reference validation checks in `src/specs/architecture/input-loading-pipeline.md` SS2.6
- Define `OpeningTree` Rust type with `Arc` vs `SharedRegion` ownership model in `src/specs/architecture/scenario-generation.md`

## Conditions Resolved

| Condition | Description                                                                                          | Phase Blocked | Effort   |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------- | -------- |
| C-01      | Add Rust struct definitions for Bus, Line, Thermal, Hydro, PumpingStation, Contract, NonControllable | 1             | 1-2 days |
| C-02      | Define `EntityId` as concrete type or alias                                                          | 1             | Hours    |
| C-03      | Add Rust struct definitions for `Stage`, `Block`, `PolicyGraph`                                      | 1             | 1 day    |
| C-04      | GAP-029: Enumerate all entity cross-reference validation checks in SS2.6                             | 2             | 2-3 days |
| C-09      | GAP-023: Define `OpeningTree` Rust type with ownership model                                         | 5             | 1-2 days |

## Tickets

| Ticket     | Title                                                   | Agent                          | Effort |
| ---------- | ------------------------------------------------------- | ------------------------------ | ------ |
| ticket-018 | Define EntityId Type and Entity Struct Definitions      | `data-model-format-specialist` | 3 pts  |
| ticket-019 | Define Stage, Block, and PolicyGraph Struct Definitions | `data-model-format-specialist` | 2 pts  |
| ticket-020 | Enumerate Entity Cross-Reference Validation Checks      | `data-model-format-specialist` | 4 pts  |
| ticket-021 | Define OpeningTree Rust Type with Ownership Model       | `sddp-specialist`              | 3 pts  |

## Dependencies

- **Depends on**: Epics 01-04 (completed audit provides the findings that define the scope of each ticket)
- **Blocks**: Epic 08 (final verification)
- ticket-020 (C-04) is accelerated by ticket-018 (C-01/C-02) but not blocked by it
- ticket-021 (C-09) is independent of all other tickets in this epic

## Deliverables

- Updated `src/specs/data-model/internal-structures.md` with Rust struct definitions for all entity types, `EntityId`, `Stage`, `Block`, `PolicyGraph`
- Updated `src/specs/architecture/input-loading-pipeline.md` SS2.6 with complete validation checklist
- Updated `src/specs/architecture/scenario-generation.md` with `OpeningTree` type definition
- Updated `src/specs/overview/spec-gap-inventory.md` to mark GAP-029 and GAP-023 as resolved
