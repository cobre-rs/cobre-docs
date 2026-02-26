# ticket-010 Verify Cross-Reference Link Integrity

## Context

### Background

The Cobre spec corpus contains 84 Markdown files with extensive cross-referencing: spec-to-spec links, section-number references (SS prefix for architecture, plain numbers for overview), and the five-section cross-reference index. The gap-resolution plan (25 tickets, 4 epics) modified approximately 30 spec files, adding new sections, renaming methods, and inserting subsections with the `N.Ma` lettering convention. These changes may have introduced broken links, stale section references, or inconsistencies in the cross-reference index.

### Relation to Epic

This is ticket 10 of 11 in Epic 02. It provides the cross-reference integrity verification that feeds into the final readiness verdict (ticket-017).

### Current State

The cross-reference index (`src/specs/cross-reference-index.md`) was last systematically updated during the spec-readiness plan. The gap-resolution plan added new specs (`ecosystem-guidelines.md`), new sections (SS2.1b, SS4.2a, SS5.4a, SS8.1, SS2.2a, SS2.3a, SS3.1a, SS1.3a, SS5a, SS5.2a), and renamed methods (`patch_row_bounds`/`patch_col_bounds`). The index header claims 74 spec files but the actual count may be different after gap-resolution.

## Specification

### Requirements

**Part 1: Internal Link Verification**
Run `mdbook build` from the repo root and capture any link warnings. Additionally, for every `[text](./relative-path.md)` link in every spec file under `src/specs/`:

- Verify the target file exists
- If the link includes a section anchor (`#section-name`), verify the anchor exists in the target file

**Part 2: Section Number Reference Verification**
For every section-number reference in prose (e.g., "SS2.1", "section 3", "SS4.2a"):

- Verify the referenced section exists in the target file
- Verify the section number matches the actual heading in the target file (not a stale reference to a pre-rename section)

**Part 3: Cross-Reference Index Currency**
Verify the five sections of `src/specs/cross-reference-index.md`:

1. **Section 1 (Spec-to-Crate Mapping)**: Verify the total spec count matches the actual number of files under `src/specs/`. Verify every file under `src/specs/` appears in the table. Verify no file in the table is missing from the filesystem.
2. **Section 2 (Per-Crate Reading Lists)**: Verify every spec file appears in at least one reading list. Verify the reading order is consistent with the declared dependencies.
3. **Section 3 (Outgoing Cross-References)**: For each spec, verify that its listed outgoing references match the actual links in the file. Flag any links in a spec file not listed in section 3, and any entries in section 3 not present in the spec file.
4. **Section 4 (Incoming Cross-References)**: Verify consistency with section 3 (if spec A lists spec B as an outgoing reference, then spec B should list spec A as an incoming reference).
5. **Section 5 (Dependency Ordering)**: Verify the topological ordering is consistent with the actual dependency structure.

**Part 4: Convention Compliance**
Verify the section prefix conventions established in CLAUDE.md:

- `SS` prefix used in `src/specs/architecture/` files (not `section`)
- `section` prefix (plain numbers) used in `src/specs/overview/` files (not `SS`)
- `section` prefix used in HPC files for self-references; `SS` for references to architecture files
- No `section` character used in architecture files except inside the convention blockquote

### Inputs/Props

- All 84 files under `src/specs/`
- `src/specs/cross-reference-index.md`
- `mdbook build` output
- `CLAUDE.md` section convention rules

### Outputs/Behavior

A Markdown report written to `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-010-crossref-integrity.md` containing:

1. **mdbook Build Results**: Any warnings or errors from `mdbook build`
2. **Broken Link Inventory**: Table of broken/stale links with columns: Source File, Link Text, Target, Issue
3. **Stale Section References**: Table of section references that no longer resolve
4. **Cross-Reference Index Delta**: Specific changes needed to bring the index up to date (new files to add, stale entries to remove, modified references to update)
5. **Convention Violations**: Any prefix convention violations found
6. **Summary Statistics**: Counts of broken links, stale references, index deltas, convention violations

### Error Handling

- If `mdbook build` fails entirely (not just warnings), log it as a Blocker finding
- Distinguish between "target file missing" (likely a bug) and "anchor not found" (may be a heading slug mismatch)

## Acceptance Criteria

- [ ] Given all 84 spec files, when every internal Markdown link is checked, then the report lists every broken link with source file and target
- [ ] Given the cross-reference index section 1, when the spec count is compared to the actual filesystem, then any discrepancy is documented (added or removed files since last index update)
- [ ] Given the cross-reference index sections 3 and 4, when outgoing and incoming references are cross-checked, then any asymmetries are documented (A references B but B does not list A as incoming)
- [ ] Given the gap-resolution changes (new sections SS2.1b, SS4.2a, SS5.4a, SS8.1, SS2.2a, SS2.3a, SS3.1a, SS1.3a, SS5a, SS5.2a), when references to these sections are checked in other files, then the report confirms they are correctly linked or flags missing links
- [ ] Given the section prefix convention rules, when architecture files are scanned for bare `section` character usage, then any violations outside the convention blockquote are flagged
- [ ] Given the `mdbook build` output, when it completes, then any warnings about dead links are included in the report

## Implementation Guide

### Suggested Approach

1. Run `mdbook build` from `/home/rogerio/git/cobre-docs/` and capture output
2. Use grep/ripgrep to extract all Markdown links from every spec file: `[text](target)` patterns
3. For each link, verify the target file exists relative to the source file
4. For links with anchors, convert the heading text to a slug and verify it exists
5. Read `src/specs/cross-reference-index.md` and verify each section against the filesystem
6. Scan architecture files for convention violations: `grep -n 'section' src/specs/architecture/*.md`
7. Compile all findings into the report

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-010-crossref-integrity.md`

### Patterns to Follow

- Be systematic: check every file, not a sample
- Use the `mdbook build` output as the primary link checker, supplemented by manual verification for section anchors
- For the cross-reference index delta, provide exact edits needed (which rows to add/modify/remove)

### Pitfalls to Avoid

- mdBook uses a specific heading-to-slug algorithm. Verify anchors using mdBook's rules, not a generic Markdown slug algorithm.
- The gap-resolution plan used the `N.Ma` lettering convention for new subsections. These subsections may not have corresponding mdBook anchors if they use special characters in headings.
- Some spec files may have intentionally broken links to deferred content. Verify against the deferred.md file before flagging.
- The cross-reference index has an errata note about seven corrected errors. Do not re-flag those as issues.

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Run `mdbook build` as the primary E2E gate.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-017 (readiness verdict uses the integrity results)

## Effort Estimate

**Points**: 3
**Confidence**: Medium (scope depends on the number of broken links discovered)
