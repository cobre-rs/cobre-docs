# Changes Log -- Ticket 017: Remove NEWAVE Migration Section

**Date**: 2026-02-25
**Branch**: `feat/spec-migration-audit`

## Summary

Removed the entire NEWAVE Migration section from the mdbook. All 6 pages were
empty stubs containing only "This page is under construction" placeholders with
no substantive content. Removing them eliminates dead navigation entries and
reduces reader confusion.

## Files Deleted

| File                                 | Content                           |
| ------------------------------------ | --------------------------------- |
| `src/migration/overview.md`          | Stub: "NEWAVE Migration Overview" |
| `src/migration/file-formats.md`      | Stub: "File Format Reference"     |
| `src/migration/hidr-dat.md`          | Stub: "HIDR.DAT"                  |
| `src/migration/term-dat.md`          | Stub: "TERM.DAT"                  |
| `src/migration/confhd-dat.md`        | Stub: "CONFHD.DAT"                |
| `src/migration/comparing-results.md` | Stub: "Comparing Results"         |

The `src/migration/` directory was removed after deleting all files.

## Files Modified

### `src/SUMMARY.md`

Removed lines 114--124 (the `---` separator before `# NEWAVE Migration`, the
heading itself, and the 6 navigation list items). The `---` separator before
`# Reference` was preserved. The transition now goes directly from the end of
the Specifications section to `---` then `# Reference`.

**Before** (lines 112--127):

```markdown
- [Deferred Features](./specs/deferred.md)

---

# NEWAVE Migration

- [Overview](./migration/overview.md)
- [File Format Reference](./migration/file-formats.md)
  - [HIDR.DAT](./migration/hidr-dat.md)
  - [TERM.DAT](./migration/term-dat.md)
  - [CONFHD.DAT](./migration/confhd-dat.md)
- [Comparing Results](./migration/comparing-results.md)

---

# Reference
```

**After** (lines 112--116):

```markdown
- [Deferred Features](./specs/deferred.md)

---

# Reference
```

## Verification

- `mdbook build` exits 0 with no warnings about missing migration files
- Grep for `(migration/` across `src/` returns zero matches (no broken links)
- Pre-existing `<span>` warnings in `specs/math/risk-measures.md` are unrelated
- Conceptual mentions of "migration" in glossary and input-hydro-extensions.md
  are not links to the deleted pages and were left untouched
