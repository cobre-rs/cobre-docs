# ticket-007 Add Minimum Viable Reading List to Implementation-Ordering

## Context

### Background

The Cobre specification corpus contains 84 markdown files across 7 directories. A developer starting the implementation has no guidance on which specs to read first. The per-phase reading lists (section 5 of `implementation-ordering.md`) are comprehensive but phase-specific -- they tell you what to read for Phase 3, not what to read to understand the system as a whole.

The Minimum Viable Reading List (MVRL) is a flat, dependency-ordered list of 10 spec files that a developer must read before writing any Cobre code. After reading these 10 files, a developer will understand: the mathematical foundations (SDDP algorithm, LP formulation), the data model (entities, internal structures), the core architectural patterns (training loop, solver abstraction, communicator), the implementation build sequence, and the authoring conventions that govern the corpus.

### Relation to Epic

This is the second ticket in Epic 03 (Navigation Layer). It depends on ticket-006 (per-phase reading list completion) because the MVRL is curated from the complete reading lists. Ticket-008 (spec usage guide) will reference the MVRL by section number.

### Current State

`src/specs/overview/implementation-ordering.md` currently has 8 sections (numbered `## 1.` through `## 8.`). The new MVRL section will be `## 9. Minimum Viable Reading List`, inserted after the existing `## 8. Cross-References` section. The file is approximately 232 lines long (will be ~250 after ticket-006 additions).

## Specification

### Requirements

Add a new section `## 9. Minimum Viable Reading List` to `src/specs/overview/implementation-ordering.md` after the existing section 8 (Cross-References). The section contains:

1. **Introductory paragraph** (2-3 sentences): explains the purpose of the MVRL -- a curated entry point for developers who need to understand the Cobre system before writing implementation tickets.

2. **Ordered list of 10 spec files** with one-sentence annotations. The order follows a concept-layered dependency chain: foundational conventions first, then mathematical model, then data model, then architecture, then HPC, then build sequence. Each entry is a numbered list item with a markdown link and a one-sentence description of what the spec contributes to the developer's understanding.

The 10 specs in order:

| #   | Spec File                                                           | Why It Is Essential                                                                                            |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | `overview/design-principles.md`                                     | Format selection criteria, declaration-order invariance, agent-readability rules that govern every spec        |
| 2   | `overview/notation-conventions.md`                                  | Mathematical notation used throughout all math and architecture specs                                          |
| 3   | `math/sddp-algorithm.md`                                            | The core algorithm: forward/backward passes, cut generation, convergence -- the mathematical heart of Cobre    |
| 4   | `math/lp-formulation.md`                                            | Stage LP structure, variable layout, constraint categories -- defines what the solver must solve at each stage |
| 5   | `data-model/internal-structures.md`                                 | `SystemRepresentation`, `StageTemplate`, LP variable layout -- the in-memory data model that all crates share  |
| 6   | `architecture/training-loop.md`                                     | Iteration lifecycle, forward/backward pass orchestration, TrajectoryRecord, event emission                     |
| 7   | `architecture/solver-interface-trait.md`                            | LP solver abstraction, dispatch mechanism, error contracts, warm-start protocol                                |
| 8   | `hpc/communicator-trait.md`                                         | Communication abstraction, collective operations, backend interchangeability                                   |
| 9   | `hpc/hybrid-parallelism.md`                                         | MPI+threads execution model, rank/thread topology, rayon integration                                           |
| 10  | `overview/implementation-ordering.md` (this document, sections 1-8) | Build sequence, phase dependencies, trait variant selection for minimal viable solver                          |

3. **Closing paragraph** (1-2 sentences): directs the reader to the per-phase reading lists (section 5) for phase-specific deep dives, and to the spec usage guide (ticket-008, once added) for understanding the boundary between specs and implementation.

### Inputs/Props

- The completed per-phase reading lists from ticket-006
- The cross-reference index section 5 (dependency ordering) for validation of the chosen order

### Outputs/Behavior

A new section 9 appears in `implementation-ordering.md` containing the MVRL. The section uses plain numbered headings (`## 9.`), consistent with the overview file convention. The ordered list uses markdown numbered list items (`1.`, `2.`, etc.) with links and annotations.

### Error Handling

Not applicable (documentation-only change).

### Out of Scope

- The MVRL does not replace the per-phase reading lists. It is a complement, not a substitute.
- No changes to sections 1-8 of `implementation-ordering.md` (those were handled by ticket-006).
- No changes to any other file. The SUMMARY.md and cross-reference index are not modified in this ticket (the file already exists in SUMMARY.md; the cross-reference index already lists `implementation-ordering.md`).
- The spec usage guide (ticket-008) is a separate document; this ticket only adds the MVRL section.

## Acceptance Criteria

- [ ] Given the updated `src/specs/overview/implementation-ordering.md`, when `grep -c "## 9\. Minimum Viable Reading List" src/specs/overview/implementation-ordering.md` is run, then the output is `1` (exactly one MVRL section heading exists).
- [ ] Given the updated file, when `grep -c "design-principles" src/specs/overview/implementation-ordering.md` is run, then the output is at least `2` (design-principles appears in both Phase 1 reading list and MVRL).
- [ ] Given the updated file, when `grep -c "notation-conventions" src/specs/overview/implementation-ordering.md` is run, then the output is at least `2` (notation-conventions appears in both Phase 1 reading list and MVRL).
- [ ] Given the updated file, when `grep -c "sddp-algorithm" src/specs/overview/implementation-ordering.md` is run, then the output is at least `2` (sddp-algorithm appears in both Phase 6 reading list and MVRL).
- [ ] Given the updated file, when the MVRL section is inspected, then it contains exactly 10 numbered list items, each with a markdown link to a spec file and a one-sentence annotation.
- [ ] Given the updated file, when every link in the MVRL section is resolved relative to `src/specs/overview/`, then all 10 links point to existing files.
- [ ] Given the updated file, when `mdbook build` is run from the repo root, then the build succeeds with exit code 0.
- [ ] Given the updated file, when the MVRL section is inspected, then no `SS` or `§` prefixes appear in the section text (overview file convention).

## Implementation Guide

### Suggested Approach

1. Open `src/specs/overview/implementation-ordering.md` after ticket-006 modifications are complete.
2. Locate the end of section 8 (Cross-References) -- this is the last line of the file (currently line 232, will be slightly longer after ticket-006).
3. Append a blank line, then the new section:
   ```
   ## 9. Minimum Viable Reading List
   ```
4. Write the introductory paragraph explaining that the MVRL is a curated entry point for developers who need a high-level understanding before writing implementation tickets.
5. Write the 10-item numbered list with links and annotations. Use the exact order from the Requirements table above.
6. Write the closing paragraph directing readers to per-phase reading lists (section 5) and the spec usage guide.
7. Run `mdbook build` to verify no broken links.

### Key Files to Modify

- `src/specs/overview/implementation-ordering.md` -- the only file modified

### Patterns to Follow

- Section heading uses plain numbered format: `## 9. Minimum Viable Reading List` (consistent with sections 1-8).
- Links use the same relative path format as the per-phase reading lists: `[Display Name](../section/filename.md)`.
- The ordered list uses markdown numbered items (`1.`, `2.`, ..., `10.`).
- Annotations are one sentence, ending with a period.

### Pitfalls to Avoid

- Do not use `§` or `SS` prefixes anywhere in this section. Overview files use plain numbered headings only.
- Do not include more than 10 specs. The MVRL is deliberately constrained to be approachable. Peripheral specs belong in the per-phase reading lists, not here.
- Do not reference the spec usage guide by file path if ticket-008 has not yet been implemented. Use a forward reference like "the spec usage guide (section 10, if present)" or omit the reference in the closing paragraph and let ticket-008 add it.
- Do not include testing specs in the MVRL. Testing specs are phase-specific implementation guides, not system-understanding prerequisites.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only).

### Integration Tests

- Run `mdbook build` from the repo root and confirm exit code 0.
- Run the grep checks from the acceptance criteria.
- Manually verify the 10-item list matches the Requirements table.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-006-update-implementation-ordering-reading-lists.md (per-phase reading lists must be complete before the MVRL is curated from them)
- **Blocks**: ticket-008-add-spec-usage-guide.md (the spec usage guide references the MVRL by section number)

## Effort Estimate

**Points**: 1
**Confidence**: High
