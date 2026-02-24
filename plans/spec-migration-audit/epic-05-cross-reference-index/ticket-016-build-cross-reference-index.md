# ticket-016 Build the Cross-Reference Index File

## Context

### Background

The cobre-docs mdBook contains 50 specification files across 7 sections (Overview, Math, Data Model, Architecture, HPC, Configuration, Deferred), plus 8 crate documentation pages and 13 algorithm reference pages. When an implementer starts work on a crate, they currently have no centralized way to determine: (1) which specs to read, (2) in what order, and (3) what other specs those will reference. Epic 02 (tickets 007-009) produced a master 50-row spec-to-crate mapping table and per-crate coverage summary. Epic 03 (tickets 010-013) audited all 534 cross-reference links across the 50 spec files and catalogued 27 findings. This ticket uses those artifacts to build a centralized navigation index.

### Relation to Epic

This is the primary deliverable of Epic 05 (Cross-Reference Index Creation). The epic has exactly two tickets: this ticket creates the index file and adds it to SUMMARY.md; ticket-017 verifies the build and fixes any rendering or link issues. Together they produce the `cross-reference-index.md` page that makes implementation navigation deterministic.

### Current State

- No cross-reference index page exists anywhere in the mdBook.
- Each of the 50 spec files has a `## Cross-References` section at the bottom, containing Markdown bullet lists with links to related specs. The links follow the format `- [Target Name](relative/path.md) -- description`. There are 534 such entries total.
- The master 50-row spec-to-crate mapping table exists in the plan directory at `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md`, section 5. This table includes: spec file name, section, primary crate, secondary crate(s), placement verdict, and finding counts.
- The per-crate coverage summary (primary/secondary spec counts) exists in the same file, section 6.1.
- The deferred features mapping (21 features, each with target crate) exists in the same file, section 2.2.
- `src/SUMMARY.md` has 135 lines. The Specifications heading is at line 54; the section runs through line 111 (`- [Deferred Features](./specs/deferred.md)`).
- 7 HIGH findings (wrong section numbers) from Epic 03 are outstanding and will be fixed in Epic 06. The index must be built from the _current_ cross-reference sections as they exist in the files (not from corrected versions), because Epic 06 remediations have not been applied yet. The index should note that known errata exist (see Epic 03 findings F-1, F-5 through F-9, F-11).

## Specification

### Requirements

Create a single new Markdown file `src/specs/cross-reference-index.md` containing the following five components in order:

**Component 1: Spec-to-Crate Mapping Table** (~50 rows)
Reproduce the master mapping table from ticket-009 section 5. Columns: `#`, `Spec File` (as a Markdown link to the spec), `Section`, `Primary Crate`, `Secondary Crate(s)`. Omit the `Placement` and finding count columns (those are audit artifacts, not navigation aids). The spec file column must use relative links that resolve from `src/specs/cross-reference-index.md` (e.g., `[sddp-algorithm.md](./math/sddp-algorithm.md)`).

**Component 2: Per-Crate Reading Lists** (7 crates)
For each of the 7 crates (`cobre-sddp`, `cobre-core`, `cobre-io`, `cobre-stochastic`, `cobre-solver`, `cobre-cli`, `ferrompi`), produce a subsection with:

- The crate name as a `### Crate Name` heading
- A numbered list of specs to read, ordered by reading dependency (foundational specs first, dependent specs after). The ordering is determined by: a spec A should be listed before spec B if B's `## Cross-References` section links to A. Where no dependency exists, order by section (overview before math before data-model before architecture before hpc before configuration).
- Both primary and secondary specs are included, with secondary specs marked with "(secondary)" suffix.

**Component 3: Outgoing Cross-Reference Table**
A table showing, for each of the 50 spec files, which other specs it references. This is extracted from each file's `## Cross-References` section. Format: one row per spec file, with the "References" column containing a comma-separated list of linked spec names (as Markdown links). Group by section (Math, Data Model, Architecture, HPC, Configuration, Overview) with section header rows.

**Component 4: Incoming Cross-Reference Table**
The inverse of Component 3: for each of the 50 spec files, which other specs reference it. Format: one row per spec file, with the "Referenced By" column containing a comma-separated list of spec names that link to this file. This is computed by inverting the outgoing table. Group by section.

**Component 5: Dependency Ordering**
A topological reading order for the entire spec corpus, presented as a numbered list. Specs with no incoming references (roots) come first; specs referenced by many others come before specs that reference many. Within the same topological level, order by section. Include a brief note explaining that 7 known section-number errata exist from Epic 03 and will be corrected in Epic 06.

Additionally, add an entry for this file in `src/SUMMARY.md`. Place it immediately after line 56 (`- [Overview](./specs/overview.md)`) as a top-level entry under the Specifications heading:

```
- [Cross-Reference Index](./specs/cross-reference-index.md)
```

This positions the index as the first navigational entry under Specifications, before the subject-matter sections begin.

### Inputs/Props

Data sources (all within the cobre-docs repository or plan directory):

1. **Master spec-to-crate table**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md`, section 5 (rows 1-50)
2. **Per-crate coverage summary**: Same file, section 6.1
3. **Deferred features mapping**: Same file, section 2.2 (21 features with crate assignments)
4. **Cross-reference sections**: The `## Cross-References` section at the bottom of each of the 50 spec files in `src/specs/`. Use grep for `## Cross-References` to locate, then extract the bullet list below it.
5. **SUMMARY.md**: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`
6. **Epic 03 findings inventory**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/learnings.md` (the Full Finding Inventory table at the bottom)

### Outputs/Behavior

- New file: `src/specs/cross-reference-index.md` (~400-600 lines of Markdown)
- Modified file: `src/SUMMARY.md` (one line added after line 56)
- No other files modified

### Error Handling

- If a cross-reference link in a spec file uses a relative path that does not match a known spec file name, flag it in the outgoing table with a "(broken?)" annotation rather than silently omitting it. This preserves information for Epic 06 remediation.
- If the outgoing/incoming tables have asymmetric entries (A references B but B does not reference A), this is expected behavior documented as MEDIUM findings F-2, F-3, F-12-F-15 in Epic 03. The index reflects the current state of the files, not a corrected state.

## Acceptance Criteria

- [ ] Given the file `src/specs/cross-reference-index.md` does not exist, when this ticket is executed, then the file is created with all 5 components specified above.
- [ ] Given the master table in ticket-009 section 5, when Component 1 is compared against it, then all 50 rows are present with correct primary and secondary crate assignments, and all spec file names are Markdown links that resolve relative to the index file's location.
- [ ] Given the 7 crates listed in ticket-009 section 6.1, when Component 2 is inspected, then each crate has a reading list subsection, every spec that has the crate as primary or secondary appears in the list, and primary specs are not marked "(secondary)" while secondary specs are.
- [ ] Given a representative spec file (e.g., `sddp-algorithm.md` with 14 cross-reference entries), when Component 3 is inspected for that file's row, then all 14 referenced specs appear in the outgoing column.
- [ ] Given a spec with many incoming references (e.g., `lp-formulation.md` or `penalty-system.md`), when Component 4 is inspected for that file's row, then the "Referenced By" list matches the inverse of all outgoing tables that reference it.
- [ ] Given the Components 3 and 4 tables, when the total outgoing link count is computed, then it equals the total incoming link count (conservation check).
- [ ] Given `src/SUMMARY.md`, when the file is inspected after modification, then a line `- [Cross-Reference Index](./specs/cross-reference-index.md)` exists under the Specifications heading, positioned after the Overview entry and before the Mathematical Formulations section.
- [ ] Given the complete set of files, when `mdbook build` is run from the repository root, then the build exits with code 0 and produces no new errors on stderr.

## Implementation Guide

### Suggested Approach

1. **Extract the master table**: Read ticket-009 section 5. Transform columns: keep `#`, `Spec File`, `Section`, `Primary Crate`, `Secondary Crate(s)`. Convert `Spec File` values to relative Markdown links from `src/specs/`.

2. **Extract cross-references from all 50 spec files**: For each file, locate the `## Cross-References` heading and extract every `- [...](...) --` line below it. Parse the link target to get the referenced spec file name. Build two data structures:
   - `outgoing[source] -> list of (target_name, target_path)`
   - `incoming[target] -> list of (source_name, source_path)` (the inverse)

3. **Build per-crate reading lists**: For each crate, collect all specs where the crate is primary or secondary (from the master table). Use the outgoing cross-reference data to topologically sort within each crate's spec list: if spec B references spec A, A comes before B.

4. **Build the dependency ordering (Component 5)**: Compute in-degree for each spec (number of specs that reference it in their Cross-References section). Apply a topological sort where specs with higher in-degree (more foundational) come first. Break ties by section order.

5. **Compose the Markdown file**: Write all 5 components into `src/specs/cross-reference-index.md`. Use `## Component Title` headings for each component. Include a brief introduction paragraph at the top explaining the page's purpose.

6. **Update SUMMARY.md**: Insert one line after the `- [Overview](./specs/overview.md)` entry (currently line 56).

7. **Verify build**: Run `mdbook build` to confirm no errors.

### Key Files to Modify

- **Create**: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`
- **Modify**: `/home/rogerio/git/cobre-docs/src/SUMMARY.md` (add 1 line)

### Key Files to Read (Input Data)

- `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` (sections 2.2, 5, 6.1)
- All 50 files matching `src/specs/**/*.md` that contain a `## Cross-References` section (listed in the grep results: all 50 spec files have one)
- `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/learnings.md` (Full Finding Inventory table for the errata note)

### Patterns to Follow

- **Link format**: Use the same relative link convention as existing spec cross-reference sections: `[Spec Name](relative/path.md)`. From `src/specs/cross-reference-index.md`, paths to math specs are `./math/sddp-algorithm.md`, paths to architecture specs are `./architecture/training-loop.md`, etc.
- **Table format**: Use standard Markdown pipe tables with header separator. Match the format used in the master table in ticket-009 section 5.
- **SUMMARY.md format**: Follow the existing indentation and link format exactly. The new entry should be at the same indentation level as `- [Overview](./specs/overview.md)` (zero indent, top-level under the `# Specifications` heading).

### Pitfalls to Avoid

- **Do not correct the 7 HIGH findings**: The index must reflect the current state of the spec files. Epic 06 will fix the wrong section numbers. If the index were built from corrected data, it would be inconsistent with the actual file contents until Epic 06 completes.
- **Do not include algorithm reference pages or crate doc pages in the 50-row table**: Those are separate from the 50 spec files. The index covers specs only. Algorithm reference pages (in `src/algorithms/`) and crate docs (in `src/crates/`) are out of scope.
- **Do not use `$` characters in the index file**: The mdbook-katex preprocessor is active with `throw-on-error = true`. Any bare `$` would either trigger KaTeX processing or cause a build error. There should be no math in the index file, but if any spec name or description contains a dollar sign, escape it as `\$`.
- **SUMMARY.md line numbers may shift**: Always locate the insertion point by searching for the `- [Overview](./specs/overview.md)` line rather than relying on a hardcoded line number, since earlier epics may have modified the file.

## Testing Requirements

### Unit Tests

Not applicable (this is a documentation file, not code).

### Integration Tests

- **Build test**: Run `mdbook build` from `/home/rogerio/git/cobre-docs/` and verify exit code 0 with no new errors on stderr.
- **Link resolution spot-check**: Manually verify that 5 representative links in the new file resolve correctly in the built HTML output (check that clicking them navigates to the correct spec page).

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-009 (master spec-to-crate table -- completed), ticket-011 (cross-reference audit -- completed)
- **Blocks**: ticket-017 (build verification and finalization)

## Effort Estimate

**Points**: 3
**Confidence**: High
