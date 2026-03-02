# Epic 04: Cross-File Verification

## Goal

Verify that the cleanup performed in Epics 01-03 has produced a fully consistent spec corpus. Update the cross-reference index for affected entries, run a full-corpus consistency audit, and produce a final verification report.

## Scope

- Incremental update of `src/specs/cross-reference-index.md` for entries affected by the cleanup
- Full-corpus grep-based consistency audit for all known stale patterns
- `mdbook build` verification
- Update of crate docs (`src/crates/*.md`) for any residual stale references

## Ticket Count: 3

## Dependencies

- Blocked by Epic 01, Epic 02, and Epic 03: verification must run after all cleanup is complete.

## Completion Criteria

- Cross-reference index is updated for all affected entries
- Full-corpus grep audit passes (zero stale patterns found)
- `mdbook build` succeeds with no new warnings
- Crate docs are consistent with spec content
