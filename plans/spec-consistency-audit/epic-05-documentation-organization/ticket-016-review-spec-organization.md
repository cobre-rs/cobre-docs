# ticket-016 Review Spec Organization Coherence

## Context

### Background

The Cobre documentation contains 50 specification files organized into 6 sections (overview, math, data-model, architecture, hpc, configuration) plus a Deferred Features page and a Cross-Reference Index. The SUMMARY.md file additionally includes 4 non-spec sections (User Guide, Crate Documentation, Algorithm Reference, Reference) and a NEWAVE Migration section (to be removed in ticket-017). An initial analysis during plan creation found the organization is fundamentally correct with no misplaced specs, but a formal structured review with documented rationale and actionable improvement recommendations has not been performed.

Epics 01-04 conducted deep audits of the spec content (notation, bibliography, production scale, timing model) and accumulated knowledge about how the specs reference each other. The cross-reference index (built in Epic 05 of the previous plan, `src/specs/cross-reference-index.md`) already maps all 50 specs to crates and documents outgoing/incoming cross-references. This ticket performs the complementary structural review: is the grouping sound, are the container pages accurate, is the navigation coherent, and are there improvement opportunities?

### Relation to Epic

This ticket is the read-only audit ticket for Epic 05. It produces a findings report that documents the organization review and any improvement recommendations. Ticket-017 and ticket-018 make changes; this ticket only reads and reports. This follows the established CLEAN/findings-first pattern from Epics 01-04.

### Current State

- **SUMMARY.md** (`src/SUMMARY.md`, 136 lines): 8 top-level sections. The "Specifications" section lists 50 specs across 7 subsections (overview, math, data-model, architecture, hpc, configuration, deferred). The "NEWAVE Migration" section (lines 116-123) contains 6 stub pages.
- **Section container pages**: 6 files (`overview.md`, `math.md`, `data-model.md`, `architecture.md`, `hpc.md`, `configuration.md`) each provide a reading order, spec index table, and conventions note. These were authored at the same time as the spec corpus.
- **Cross-Reference Index** (`src/specs/cross-reference-index.md`): 5-component index (spec-to-crate mapping, per-crate reading lists, outgoing cross-references, incoming cross-references, dependency ordering). Updated in Epic 06 remediation with errata correction.
- **Deferred Features** (`src/specs/deferred.md`): 16 deferred features (C.1-C.16), approximately 830 lines. References CEPEL/NEWAVE/DECOMP in several entries.
- **Section spec counts**: overview (3), math (14), data-model (10), architecture (13), hpc (8), configuration (1), deferred (1) = 50 total.

## Specification

### Requirements

1. **Verify section grouping**: For each of the 50 specs, confirm that its current section placement is the most appropriate. Flag any spec that would be better served by a different section.
2. **Verify container page accuracy**: For each of the 6 section container pages, verify that:
   - The reading order is still accurate and reflects any changes made in Epics 01-04
   - The spec index table lists all specs in the section (no missing, no extra)
   - The description text is factually accurate
   - Navigation links at the bottom are correct
3. **Verify SUMMARY.md structure**: Confirm that SUMMARY.md entries match the actual file tree (no broken links, no missing files, no orphan files). Exclude `src/migration/` which is handled by ticket-017.
4. **Verify cross-reference index**: Confirm the cross-reference index at `src/specs/cross-reference-index.md` is consistent with the current SUMMARY.md and container pages. Check that the spec count (50), section assignments, and crate mappings are accurate.
5. **Assess deferred.md organization**: Review `src/specs/deferred.md` for structural coherence. It currently contains 16 features in a flat list. Assess whether the organization is adequate or whether grouping/splitting would improve navigability.
6. **Identify improvement opportunities**: Note any naming inconsistencies between SUMMARY.md titles and container page titles, missing bidirectional navigation links, or reading order suggestions that could be improved based on findings from Epics 01-04.

### Inputs/Props

- All files under `src/` that are referenced from `src/SUMMARY.md`
- The 6 section container pages
- The cross-reference index
- `src/specs/deferred.md`
- Knowledge from Epics 01-04 learnings about spec interdependencies

### Outputs/Behavior

A findings report written to `plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md` containing:

- Section-by-section review with verdict (SOUND / IMPROVEMENT SUGGESTED)
- Container page accuracy checklist (one row per container page)
- SUMMARY.md structure verification results
- Cross-reference index consistency check
- Deferred.md organization assessment
- Prioritized improvement recommendations (if any)

### Error Handling

If any broken links or missing files are found, document them in the findings report with exact file paths and line numbers. Do not fix them in this ticket.

## Acceptance Criteria

- [ ] Given the 50 specs across 6 sections, when the section grouping is reviewed, then a verdict (SOUND or IMPROVEMENT SUGGESTED) is recorded for each section with documented rationale
- [ ] Given the 6 section container pages, when each is reviewed against its section's specs, then every container page has a row in the accuracy checklist with pass/fail per criterion (reading order, spec index completeness, description accuracy, navigation links)
- [ ] Given SUMMARY.md, when entries are compared to the file tree (excluding `src/migration/`), then any mismatches (broken links, missing files, orphan files) are documented
- [ ] Given the cross-reference index, when its spec count, section assignments, and crate mappings are compared to SUMMARY.md and container pages, then any inconsistencies are documented
- [ ] Given `deferred.md`, when its 16-feature flat structure is reviewed, then an assessment of whether the organization is adequate is documented with rationale
- [ ] Given all findings, when improvement recommendations are compiled, then each recommendation has a description, affected files, and priority (HIGH/MEDIUM/LOW)
- [ ] The findings report is written to `plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md`
- [ ] No spec files are modified by this ticket

## Implementation Guide

### Suggested Approach

1. **Start with SUMMARY.md**: Parse the SUMMARY.md structure. Build a list of all referenced `.md` files. Verify each file exists under `src/`. Identify any `.md` files under `src/specs/` that are NOT referenced from SUMMARY.md.
2. **Review each section container page** in order (overview, math, data-model, architecture, hpc, configuration):
   - Compare the spec index table entries against the actual `src/specs/<section>/` directory listing
   - Verify the reading order makes sense given cross-reference dependencies
   - Check description text for outdated claims (e.g., spec counts, feature descriptions)
   - Verify navigation links at the bottom point to valid targets
3. **Review section placement** for each spec: Use the cross-reference index's spec-to-crate mapping and cross-reference tables to assess whether any spec has a majority of its references in a different section. The threshold for "misplaced" is: >70% of outgoing cross-references target a single other section.
4. **Review deferred.md**: Scan the 16 features (C.1-C.16). Check if there are natural groupings (e.g., modeling extensions, solver infrastructure, algorithm variants) that would improve navigation. Assess whether the flat structure is still appropriate given the section grew to ~830 lines.
5. **Compile findings**: Write the findings report with the structure defined in Outputs/Behavior.

### Key Files to Read

| File                                 | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `src/SUMMARY.md`                     | Table of contents, all page references |
| `src/specs/overview.md`              | Overview section container             |
| `src/specs/math.md`                  | Math section container                 |
| `src/specs/data-model.md`            | Data model section container           |
| `src/specs/architecture.md`          | Architecture section container         |
| `src/specs/hpc.md`                   | HPC section container                  |
| `src/specs/configuration.md`         | Configuration section container        |
| `src/specs/deferred.md`              | Deferred features page                 |
| `src/specs/cross-reference-index.md` | Cross-reference index                  |

### Key Files to Create

| File                                                                              | Purpose         |
| --------------------------------------------------------------------------------- | --------------- |
| `plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md` | Findings report |

### Patterns to Follow

- **CLEAN/findings-first**: This ticket produces a read-only findings report. No spec files are modified. Follow the pattern from ticket-001 (findings-001), ticket-003 (findings-003), ticket-006 (findings-006), ticket-010 (findings-010), ticket-013 (timing-model-analysis.md).
- **Severity tier (HIGH / MEDIUM / LOW)** for improvement recommendations, matching the tier pattern from Epic 01.
- **Thematic evidence tables** for the container page accuracy review (one table, one row per container page, columns for each criterion).

### Pitfalls to Avoid

- Do not conflate this review with the NEWAVE migration removal (ticket-017) or reference cleanup (ticket-018). If you notice NEWAVE-related issues, note them but do not include them as organization findings.
- The cross-reference index errata note (line 13 of `cross-reference-index.md`) references "Epic 06 remediation" which was from the prior implementation plan (not to be confused with Epic 06 of this plan). Do not flag this as an error.
- The `deferred.md` page is listed under "Specifications" in SUMMARY.md but does not have its own container page like the other 6 subsections. This is intentional (it is a single flat page, not a section with sub-pages).

## Testing Requirements

### Unit Tests

N/A (documentation audit, no code changes).

### Integration Tests

- Verify `mdbook build` exits 0 before the review begins (establishes clean baseline for ticket-017 and ticket-018).

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: None (can start independently; benefits from Epics 01-04 learnings which are available)
- **Blocks**: None (ticket-017 and ticket-018 can proceed independently, but findings may inform optional improvements)

## Effort Estimate

**Points**: 2
**Confidence**: High
