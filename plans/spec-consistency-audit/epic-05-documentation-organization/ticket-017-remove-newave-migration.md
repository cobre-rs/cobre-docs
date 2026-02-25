# ticket-017 Remove NEWAVE Migration Section

## Context

### Background

The mdBook documentation includes a "NEWAVE Migration" top-level section in SUMMARY.md (lines 116-123) that links to 6 stub pages under `src/migration/`. Every one of these files contains exactly 3 lines: a heading and a "This page is under construction" blockquote. No actual content was ever written. The migration documentation was a placeholder for future NEWAVE file format parsing and result comparison guides, but the NEWAVE import feature has been deferred. Keeping empty stub pages clutters the book navigation and gives readers a false impression that migration documentation exists.

This ticket removes the 6 stub files and the SUMMARY.md section that references them, then verifies no other pages link to the migration directory.

### Relation to Epic

This is the first change ticket in Epic 05. It removes the empty NEWAVE migration stubs before ticket-018 performs the corpus-wide NEWAVE/CEPEL reference audit. Ordering matters because ticket-018 should audit the final state of the repository (without the migration stubs) rather than having to exclude them from its analysis.

### Current State

The 6 files under `src/migration/` are:

| File                                 | Content                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `src/migration/overview.md`          | `# NEWAVE Migration Overview` + "under construction" |
| `src/migration/file-formats.md`      | `# File Format Reference` + "under construction"     |
| `src/migration/hidr-dat.md`          | `# HIDR.DAT` + "under construction"                  |
| `src/migration/term-dat.md`          | `# TERM.DAT` + "under construction"                  |
| `src/migration/confhd-dat.md`        | `# CONFHD.DAT` + "under construction"                |
| `src/migration/comparing-results.md` | `# Comparing Results` + "under construction"         |

In `src/SUMMARY.md`, lines 114-125 contain:

```markdown
---

# NEWAVE Migration

- [Overview](./migration/overview.md)
- [File Format Reference](./migration/file-formats.md)
  - [HIDR.DAT](./migration/hidr-dat.md)
  - [TERM.DAT](./migration/term-dat.md)
  - [CONFHD.DAT](./migration/confhd-dat.md)
- [Comparing Results](./migration/comparing-results.md)
```

A grep for `migration/` across `src/` (excluding `src/migration/` itself and the glossary's unrelated "thread migration" term) shows that only `src/SUMMARY.md` references these files. Additionally, `src/specs/data-model/input-hydro-extensions.md` line 219 mentions "Legacy system migration" as a use case for FPHA coefficient import, but this refers to the concept of data migration, not to the `src/migration/` pages -- it does not link to them.

## Specification

### Requirements

1. **Delete all 6 files** under `src/migration/`:
   - `src/migration/overview.md`
   - `src/migration/file-formats.md`
   - `src/migration/hidr-dat.md`
   - `src/migration/term-dat.md`
   - `src/migration/confhd-dat.md`
   - `src/migration/comparing-results.md`
2. **Remove the `src/migration/` directory** after deleting the files.
3. **Remove SUMMARY.md lines 114-125** (the `---` separator, the `# NEWAVE Migration` heading, and all 6 list items). The `---` separator before the `# Reference` section should remain.
4. **Verify no broken internal links** exist after the removal.
5. **Verify `mdbook build` exits 0** after the changes.

### Inputs/Props

- `src/SUMMARY.md` (to edit)
- `src/migration/` directory (to delete)

### Outputs/Behavior

- The `src/migration/` directory and all 6 files within it are deleted.
- `src/SUMMARY.md` no longer contains the "NEWAVE Migration" section.
- The mdBook builds cleanly with no broken link warnings.
- A changes log is written to `plans/spec-consistency-audit/epic-05-documentation-organization/changes-017.md` documenting exactly what was removed.

### Error Handling

- If `mdbook build` fails after the removal, inspect the error output for broken links. The only expected references to `src/migration/` are in SUMMARY.md lines 118-123; if any other file references migration pages, document the finding and add a link removal to the changes log.

## Acceptance Criteria

- [ ] Given the 6 stub files under `src/migration/`, when the ticket is complete, then the `src/migration/` directory no longer exists
- [ ] Given `src/SUMMARY.md` containing the "NEWAVE Migration" section at lines 116-123, when the ticket is complete, then the heading, all 6 list items, and the preceding `---` separator are removed
- [ ] Given the edited SUMMARY.md, when the remaining sections are inspected, then the `---` separator before `# Reference` is still present and all other sections are unchanged
- [ ] Given the modified repository, when `mdbook build` is run, then the build exits with code 0 and produces no warnings about missing files
- [ ] Given a grep for `migration/` across `src/` (excluding the glossary's "thread migration"), when run after deletion, then zero results are returned
- [ ] A changes log exists at `plans/spec-consistency-audit/epic-05-documentation-organization/changes-017.md` documenting the 6 deleted files and the SUMMARY.md edit

## Implementation Guide

### Suggested Approach

1. **Delete the migration files and directory**:
   ```bash
   rm -rf src/migration/
   ```
2. **Edit SUMMARY.md**: Remove lines 114-125 (the `---` separator, the `# NEWAVE Migration` heading, and the 6 list items). The file should go from the end of the "Specifications" section's last entry directly to the `---` separator before `# Reference`. After the edit, the structure should be:

   ```
   ...
   - [Deferred Features](./specs/deferred.md)

   ---

   # Reference

   - [Glossary](./reference/glossary.md)
   ...
   ```

3. **Verify no broken references**: Run `grep -r 'migration/' src/ --include='*.md'` and confirm the only result (if any) is the unrelated "thread migration" term in `reference/glossary.md` and the conceptual "Legacy system migration" in `input-hydro-extensions.md` (neither links to `src/migration/`).
4. **Build mdBook**: Run `mdbook build` and verify exit code 0 with no warnings.
5. **Write the changes log**: Document the 6 deleted files and the SUMMARY.md edit in `changes-017.md`.

### Key Files to Modify

| File             | Change                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `src/SUMMARY.md` | Remove lines 114-125 (NEWAVE Migration section + preceding separator) |

### Key Files to Delete

| File                                 | Reason                           |
| ------------------------------------ | -------------------------------- |
| `src/migration/overview.md`          | Empty stub — 3 lines, no content |
| `src/migration/file-formats.md`      | Empty stub — 3 lines, no content |
| `src/migration/hidr-dat.md`          | Empty stub — 3 lines, no content |
| `src/migration/term-dat.md`          | Empty stub — 3 lines, no content |
| `src/migration/confhd-dat.md`        | Empty stub — 3 lines, no content |
| `src/migration/comparing-results.md` | Empty stub — 3 lines, no content |

### Key Files to Create

| File                                                                             | Purpose     |
| -------------------------------------------------------------------------------- | ----------- |
| `plans/spec-consistency-audit/epic-05-documentation-organization/changes-017.md` | Changes log |

### Patterns to Follow

- **mdBook build as regression gate**: Run `mdbook build` after changes and verify exit 0. This pattern was used consistently in Epics 01-04.
- **Changes log**: Document all modifications in a changes file, following the `changes-NNN.md` pattern from tickets 005, 009, 011, 012, 015.

### Pitfalls to Avoid

- Do not remove the `---` separator that precedes the `# Reference` section. Only remove the `---` that precedes `# NEWAVE Migration`.
- Do not touch the "Legacy system migration" text in `src/specs/data-model/input-hydro-extensions.md` line 219. That is a conceptual reference to the use case of importing FPHA coefficients from DECOMP/DESSEM, not a link to the migration pages. It will be reviewed in ticket-018.
- Do not confuse "thread migration" (glossary term, `src/reference/glossary.md` line 135) with the NEWAVE migration section. The glossary term is about CPU thread affinity and is completely unrelated.

## Testing Requirements

### Unit Tests

N/A (documentation change, no code).

### Integration Tests

- `mdbook build` exits with code 0 after the removal.
- `grep -r 'migration/' src/ --include='*.md'` returns no links to `src/migration/` pages.

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-018 (the reference audit should see the final state without migration stubs)

## Effort Estimate

**Points**: 1
**Confidence**: High
