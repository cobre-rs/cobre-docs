# Accumulated Learnings Through Epic 01 (Gap Inventory Batch Update)

## Gap Inventory Update Patterns

- **Atomic batch update**: all 15 gaps resolved in a single ticket targeting only `src/specs/overview/spec-gap-inventory.md`; never split by gap or severity
- **Three-location rule**: every gap resolution touches (1) section 3 description cell (`**Resolved.** ...` marker), (2) section 3 resolution path cell (spec file + section link), (3) section 7 resolution log row -- touching fewer than three is an inconsistency
- **Forward references permitted in resolution path**: when spec content does not yet exist, the section 3 resolution path cell records where it will be added; the content-writing epic must create that exact section
- **Multiple gaps per ticket allowed in resolution log**: four gaps (GAP-019, GAP-024, GAP-027, GAP-035) share one ticket (epic-03/ticket-006); each still gets its own section 7 row
- **Entries appended in decision order, not GAP-ID order**: section 7 table is not sorted by GAP-NNN; new rows always append to the bottom

## Section 6 Arithmetic Conventions

- **Total gaps invariant**: sum of all severity counts in the severity table must equal 39; verify before committing
- **Split-row convention**: when a severity transitions from all-unresolved to all-resolved, replace the single `| Severity | N |` row with two rows `| Severity (unresolved) | 0 |` and `| Severity (resolved) | N |`
- **Severity note line completeness**: the `**By severity (...):**` annotation must enumerate every resolved GAP-ID; missing an ID is an inconsistency
- **Per-crate table counts incidences, not gaps**: a gap affecting two crates appears in two rows; column totals exceed 39; Blocker column shows unresolved only (goes to 0 when all blockers resolved)

## Section 7 Resolution Log Format

- **Five-column format**: `| GAP-NNN | YYYY-MM-DD | plan-name / epic-NN | ticket-NNN | <summary> |`
- **Summary length**: section 7 summaries are longer than section 3 description markers; they include the spec file Markdown link, section reference, and enough detail to audit without opening the spec
- **Stale entry risk**: when recording entries for gaps resolved by a prior plan, read the current section 3 resolution path cell first -- it reflects the latest decision and may differ from the original plan brief

## Pitfalls for Content Epics (02-04)

- **Planning briefs must not be committed to repo root**: `review.md` was accidentally committed during epic-01 and required a fix commit (3c927b1); planning inputs belong in the plan directory, never in repo root or `src/`
- **GAP-003 stale reference lesson**: resolution log initially inherited `rkyv` from the original decision; the correct value was `postcard` (superseded by a later plan); always read current spec state before recording
- **Content tickets must create sections at the exact path recorded in section 3**: verify after each content ticket that section 3 resolution path links resolve correctly in the built book
