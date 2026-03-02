# Epic 03: Decision Log and Prevention

## Goal

Create a central Decision Log file (`src/specs/overview/decision-log.md`) cataloging all cross-cutting architectural decisions in the Cobre spec corpus, and establish inline decision marker conventions to prevent future inconsistencies.

## Scope

- Create the Decision Log file with all existing cross-cutting decisions extracted from the spec corpus
- Register it in `src/SUMMARY.md` and `src/specs/overview.md`
- Add inline decision markers (standardized blockquote format) to the primary source sections for each decision
- Update `CLAUDE.md` with the Decision Log convention

## Ticket Count: 3

## Dependencies

- Blocked by Epic 01 and Epic 02: the Decision Log must catalog the state of decisions after cleanup, not before. Creating it during cleanup would mean cataloging stale decisions.

## Completion Criteria

- `src/specs/overview/decision-log.md` exists with all cross-cutting decisions cataloged
- Decision Log is accessible via the mdBook sidebar (registered in SUMMARY.md)
- `CLAUDE.md` documents the Decision Log convention
- `mdbook build` succeeds
