# Epic 03: Cross-Reference Fixes

## Goal

Resolve all 8 cross-reference navigability issues identified in report-030 of the implementation readiness audit. This includes content-level fixes (adding missing links in spec files) and index-level fixes (correcting the cross-reference index sections 3 and 4).

## Scope

### Content Fixes (F1, F2, F3)

- `src/specs/architecture/simulation-architecture.md` -- Add link from SS6.1 to `output-infrastructure.md` SS6.2 (F1); fix imprecise Cross-References entry (F3)
- `src/specs/data-model/binary-formats.md` -- Add postcard/MPI broadcast row to section 2 format summary table (F2)

### Index Fixes (F4, F5, F6, F7, F8)

- `src/specs/cross-reference-index.md` -- Batch update of sections 3, 4, and 5:
  - Section 3: Add 3 missing outgoing refs for output-infrastructure.md (F4); add 8 missing outgoing refs for simulation-architecture.md (F8)
  - Section 4: Fix simulation-architecture.md incoming refs (F5); fix input-loading-pipeline.md incoming refs (F6); add structured-output.md to output-infrastructure.md incoming refs (F7)
  - Section 5: Update incoming counts for affected files

## Tickets

| #   | Ticket     | Title                                                                        |
| --- | ---------- | ---------------------------------------------------------------------------- |
| 5   | ticket-005 | Add missing cross-references in simulation-architecture and binary-formats   |
| 6   | ticket-006 | Batch-update cross-reference index for F4 through F8                         |
| 7   | ticket-007 | Fix low-priority Cross-References entry precision in simulation-architecture |

## Dependencies

- Epic 1 and Epic 2 should be completed first, as they modify `scenario-generation.md` and `spec-gap-inventory.md` which may affect cross-reference counts
- Ticket 006 (index batch update) should be done after ticket 005 (content fixes), because content fixes may add new outgoing references that need to be reflected in the index
- Ticket 007 (cosmetic precision fix) is independent and can be done in any order

## Completion Criteria

- All 5 HIGH findings (F1, F2, F4, F5, F6) resolved
- All 3 LOW findings (F3, F7, F8) resolved
- Cross-reference index sections 3 and 4 match the actual Cross-References sections in all affected files
- `mdbook build` exits 0 with no new warnings
