# Epic 02: Parallel Testing and Cross-References

## Goal

Complete the parallel scenario generation spec update by adding parallel generation tests to the sampling scheme testing spec, updating bidirectional cross-references between scenario generation and HPC specs, and performing a batch update of the cross-reference index for all modified files.

## Scope

- New SS5 "Parallel Generation Tests" section in `sampling-scheme-testing.md` with 6 tests
- Updated Cross-References sections in `scenario-generation.md` and `sampling-scheme-trait.md` (architecture -> HPC direction)
- Updated Cross-References sections in `work-distribution.md`, `shared-memory-aggregation.md`, and `hybrid-parallelism.md` (HPC -> architecture direction)
- Batch update of the cross-reference index for all files modified across both epics

## Tickets

| Order | Ticket     | Title                                 | Effort |
| ----- | ---------- | ------------------------------------- | ------ |
| 1     | ticket-005 | Add parallel generation tests         | 3      |
| 2     | ticket-006 | Update bidirectional cross-references | 2      |
| 3     | ticket-007 | Batch update cross-reference index    | 2      |

## Dependencies

- This epic depends on Epic 01 completion (all 4 tickets). The parallel tests reference SS2.2b and SS2.3c content. The cross-reference updates reference all content added in Epic 01.
- Within this epic: ticket-006 is independent of ticket-005. Ticket-007 depends on both ticket-005 and ticket-006 (the index update must capture cross-references from all modified files).

## Deliverables

At epic completion:

1. `sampling-scheme-testing.md` contains SS5 with 6 parallel generation tests
2. All Cross-References sections in the 7 modified files are updated with bidirectional links
3. `cross-reference-index.md` is updated in a single batch for all affected files
4. `mdbook build` succeeds without new warnings
5. Consistency audit passes: all references point to existing sections, all bidirectional links are symmetric
