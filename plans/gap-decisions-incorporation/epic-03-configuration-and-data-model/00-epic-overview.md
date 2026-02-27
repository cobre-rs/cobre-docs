# Epic 03: Configuration and Data Model Updates

## Goal

Update configuration reference and data model spec files for six gaps that involve adding config parameters, cleaning up data model inconsistencies, and documenting preconditions.

## Scope

- **GAP-019**: Document solver retry parameters as external config + encapsulation boundary in `configuration-reference.md` and `solver-interface-trait.md`
- **GAP-024**: Add `cut_activity_tolerance` config parameter to `configuration-reference.md`
- **GAP-027**: Mark `training.forward_passes` as mandatory (no default) in `configuration-reference.md`
- **GAP-035**: Update example `config.json` to use `"method": "level1"` in `configuration-reference.md`
- **GAP-031**: Uniformize scenario notation to `scenario_source` by removing `num_scenarios`/`sampling_method` legacy fields from `internal-structures.md`
- **GAP-034**: Document `forward_passes` immutability precondition in `cut-management-impl.md`

## Tickets

| Ticket     | Title                                                       | Dependencies | Effort |
| ---------- | ----------------------------------------------------------- | ------------ | ------ |
| ticket-006 | Update configuration reference for GAP-019, 024, 027, 035   | ticket-001   | 2      |
| ticket-007 | Uniformize scenario notation and remove legacy Stage fields | ticket-001   | 2      |
| ticket-008 | Document forward_passes immutability precondition           | ticket-001   | 1      |

## Acceptance Criteria

- `configuration-reference.md` contains solver retry config parameters with encapsulation note
- `configuration-reference.md` contains `cut_activity_tolerance` parameter entry
- `training.forward_passes` marked as mandatory with no default
- Example `config.json` uses `"method": "level1"` and `"risk_measure": "expectation"`
- `internal-structures.md` `Stage` struct uses `scenario_source`-aligned fields, legacy `SamplingMethod`/`num_scenarios` removed
- `cut-management-impl.md` documents `forward_passes` immutability as a precondition
