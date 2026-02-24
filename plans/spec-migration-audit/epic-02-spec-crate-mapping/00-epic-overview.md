# Epic 02: Spec-to-Crate Mapping Audit

## Goal

Verify that each of the 50 migrated spec files is placed in the section of the mdBook that correctly reflects its primary implementation target crate, and that each crate documentation page is a complete and accurate summary of the formal specs that define its behavior.

## The Central Question

For every spec, ask: "Which crate will implement the behavior described in this spec?" If the answer does not match the SUMMARY.md section the spec is in, that is a HIGH finding.

## Key Mapping Ambiguities to Resolve

The following specs have non-obvious crate assignments that require explicit determination:

| Spec File                                       | Current Section       | Primary Target Crate(s)                                       | Question                                          |
| ----------------------------------------------- | --------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `specs/architecture/scenario-generation.md`     | `specs/architecture/` | `cobre-stochastic` and `cobre-sddp`                           | Should this be in `specs/architecture/` or split? |
| `specs/architecture/input-loading-pipeline.md`  | `specs/architecture/` | `cobre-io`                                                    | `specs/architecture/` or `specs/data-model/`?     |
| `specs/architecture/validation-architecture.md` | `specs/architecture/` | `cobre-io` (validation runs in cobre-cli, data in cobre-io)   | Split concern or unified?                         |
| `specs/math/system-elements.md`                 | `specs/math/`         | `cobre-core` (defines entities) and `cobre-sddp` (uses in LP) | Correct in math?                                  |
| `specs/math/equipment-formulations.md`          | `specs/math/`         | `cobre-core` (data model) and `cobre-sddp` (LP constraints)   | Should it cross-map to cobre-core?                |
| `specs/hpc/work-distribution.md`                | `specs/hpc/`          | `cobre-sddp` (distribution logic lives there)                 | HPC section OK?                                   |

## Tickets in This Epic

| Ticket     | Scope                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| ticket-006 | Audit crate documentation pages for spec reference completeness                     |
| ticket-007 | Audit data model and overview spec-to-crate assignments                             |
| ticket-008 | Audit math and architecture spec-to-crate assignments                               |
| ticket-009 | Audit HPC and configuration spec-to-crate assignments; produce master mapping table |

## Acceptance Criteria for the Epic

- A master spec-to-crate mapping table exists covering all 50 files, with the assessed primary and secondary crate for each
- All HIGH findings (incorrect section placement) are documented with reasoning
- The crate doc pages (`src/crates/`) are verified to reference all relevant formal specs
- Any crate gap (a crate with zero spec coverage for a known responsibility) is flagged

## Dependencies

- Blocked By: Epics 01 completion (content must be verified before mapping can be trusted)
- Blocks: Epic 05 (cross-reference index uses the mapping table from this epic)
- Blocks: Epic 06 (remediation may include moving files or updating SUMMARY.md)
