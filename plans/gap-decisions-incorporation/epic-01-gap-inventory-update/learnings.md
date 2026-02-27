# Epic 01 Learnings: Gap Inventory Batch Update

## Patterns Established

- **Single-ticket atomic batch pattern**: all 15 open gaps were resolved in one ticket targeting one file (`src/specs/overview/spec-gap-inventory.md`). No partial commits, no per-gap tickets. This matches the CLAUDE.md convention that overview spec batch updates are never split. See `plans/gap-decisions-incorporation/epic-01-gap-inventory-update/ticket-001-batch-update-gap-inventory.md`.

- **Three-location update rule**: every gap resolution requires simultaneous updates to three locations within the same file -- (1) the description cell in section 3 (`**Resolved.** ...` prepended), (2) the resolution path cell in section 3, and (3) a new row in section 7 resolution log. Touching fewer than three locations leaves the document in an inconsistent state. See `src/specs/overview/spec-gap-inventory.md` sections 3 and 7.

- **Section 3 resolution marker format**: `**Resolved.** <one-sentence summary of what was decided>`. The bold period is mandatory. The summary is written in present tense and names the mechanism chosen. Example from GAP-018 row (line 43): `**Resolved.** Rayon adopted for intra-rank parallelism. OpenMP and std::thread deferred.` The resolution path cell then references the specific spec file and section where the content will appear.

- **Resolution log row format**: `| GAP-NNN | YYYY-MM-DD | plan-name / epic-NN | ticket-NNN | <summary> |`. Five columns, pipe-separated, single row (no line wrapping). See lines 135-173 of `src/specs/overview/spec-gap-inventory.md`. The resolution summary in the log is longer and more precise than the description marker; it names the spec file and section with a Markdown link.

- **Multiple gaps per ticket in resolution log**: GAP-019, GAP-024, GAP-027, and GAP-035 all map to the same ticket (ticket-006 of epic-03). Each gap gets its own resolution log row -- there is no row-merging or grouping. The ticket column repeats `ticket-006` four times. See lines 163-166 of `src/specs/overview/spec-gap-inventory.md`.

## Architectural Decisions

- **Gap inventory update precedes spec content work**: epic-01 writes only the inventory entries; epics 2-4 write the actual spec sections. This separation keeps the tracking document authoritative at all times and allows individual epics to verify their work against the resolution summary already recorded. The inventory becomes a spec-writing checklist, not just a post-hoc record.

- **Resolution path cell references the future spec location**: in ticket-001, when spec content does not yet exist, the resolution path cell references where the content will be added (e.g., `[Configuration Reference](../configuration/configuration-reference.md) SS3.1`). This is intentional -- it is a forward reference, not a live link. The link must be made live by the content-writing epic that follows.

- **`review.md` is planning input, not a spec file**: `review.md` served as the authoritative decision source for this epic and was intentionally excluded from the mdBook `src/` directory. It was accidentally committed to the repo root during the implementation and removed in the follow-up fix commit (3c927b1). Planning briefs and design review notes must not be placed in the repo root or `src/`; they belong in the plan directory or a dedicated `decisions/` folder outside `src/`.

## Files and Structures Created

- `src/specs/overview/spec-gap-inventory.md` -- the sole file modified. Section 3 had 15 gap rows updated with `**Resolved.**` markers; section 6 summary statistics updated to show 0 unresolved across all severities; section 7 resolution log gained 15 new entries. All changes were made in a single commit (`4b7c8c9`), plus one fix commit (`3c927b1`) for a stale serialization reference.

## Conventions Adopted

- **Section 6 severity table row convention**: each severity that was previously "unresolved" splits into two rows: `Severity (unresolved)` set to 0, and `Severity (resolved)` set to the full count. Before epic-01, the Low row was a single `| Low | 5 |` row (no resolved/unresolved split). After epic-01, it became `| Low (unresolved) | 0 |` and `| Low (resolved) | 5 |`. This split-row pattern must be applied whenever a severity category transitions from all-unresolved to all-resolved. See lines 103-114 of `src/specs/overview/spec-gap-inventory.md`.

- **Section 6 note line format**: the `**By severity (...):**` annotation above the severity table must enumerate ALL resolved gaps by GAP-ID. Before epic-01 the note read `5 Blockers resolved: ...; 16 High resolved: ...; 3 Medium resolved: ...`. After epic-01 it reads `...; 13 Medium resolved: GAP-018 through GAP-030 (with gaps); 5 Low resolved: GAP-031 through GAP-035`. The note is a completeness check -- if it does not list a GAP-ID that appears as resolved in section 7, the document is inconsistent. See line 101 of `src/specs/overview/spec-gap-inventory.md`.

- **Per-crate table in section 6 counts gap-crate incidences, not gaps**: a gap affecting two crates appears in two rows of the per-crate table. The per-crate column totals do not sum to 39 (the total gap count); they sum to the total incidences across all gaps. Before epic-01, cobre-core had Medium=1 and Low=2 (total=4); after epic-01, those became 0 (total=1). The Blocker column in the per-crate table shows unresolved counts only, so it goes to 0 for all crates when all blockers are resolved. See lines 116-127 of `src/specs/overview/spec-gap-inventory.md`.

- **Section 6 arithmetic verification**: the sum of all counts in the severity table must equal 39 (total gap count). The formula is: `Blocker (resolved) + High (resolved) + Medium (resolved) + Low (resolved) + [any unresolved counts] = 39`. After epic-01: 5 + 16 + 13 + 5 + 0 = 39. This must be verified manually before committing. An arithmetic error in section 6 is a guardian rejection criterion.

- **Resolution log entries are appended, not inserted**: new entries go at the bottom of the section 7 table in the order the decisions were made, regardless of GAP-NNN numeric order. The table is not sorted by ID. See that GAP-039 (line 158) and GAP-022 (line 159) appear after all blockers and high-severity entries despite lower numeric IDs in some cases.

## Surprises and Deviations

- **Stale resolution log entry for GAP-003 required a post-merge fix**: the initial ticket-001 implementation wrote the GAP-003 resolution log entry with `rkyv` as the serialization format, matching the original resolution from the `gap-resolution` plan. However, the `gap-resolution` plan later corrected GAP-003 to use `postcard` (not `rkyv`) in a fix commit. The resolution log entry inherited the stale value. A code review caught this and it was fixed in commit 3c927b1. The lesson: when writing resolution log entries for gaps resolved by a previous plan, read the current state of the resolution path cell in section 3 first -- it reflects the latest decision. Do not rely on the original plan's decision description.

- **`review.md` accidentally committed to repo root**: the planning brief that described the 15 gap decisions was committed to the repository root during implementation. This was caught in code review and reverted in commit 3c927b1. The fix commit needed `review.md` to show as a deletion (the `git show` output shows it being added in the fix commit because git shows the diff to revert it -- the file was present in the parent and then removed). Planning and decision documents used as specialist inputs must live in the plan directory and must never be committed to the repo root or `src/`.

- **Resolution summaries in section 7 are longer than section 3 description markers**: spec authors may assume a brief marker suffices in both locations. In practice, section 3 description cells are truncated to a single sentence (50-80 characters), while section 7 resolution log summaries include the spec file link, the section reference, and enough detail to audit the resolution without reading the spec. See the contrast between line 43 (section 3, GAP-018) and line 162 (section 7, GAP-018) of `src/specs/overview/spec-gap-inventory.md`.

## Recommendations for Future Epics

- **Epics 2-4 must verify section 3 resolution path cells match their delivered content**: each ticket in epics 2-4 targets specific spec files and sections listed in the section 3 resolution path column. Before marking a content ticket complete, the implementer must confirm that the spec file and section referenced in section 3 actually contains the promised content. If the link is a forward reference (pointing to a section not yet written), the ticket for that section must create it at the exact path. See the resolution path cells for GAP-019, GAP-024, GAP-027, GAP-035 (all pointing to `[Configuration Reference](../configuration/configuration-reference.md)`) which are delivered by epic-03 ticket-006.

- **Content tickets that add new sections to existing files must use the correct section prefix for that file's directory**: architecture files use `SS`, HPC files use `§`, overview files use plain numbers. This is not checked by the gap inventory itself, but violations will be caught by guardian verification. See CLAUDE.md section prefix rules and the Cross-Reference Index Methodology section.

- **A single gap may span content in multiple tickets across multiple epics**: GAP-022, GAP-030, GAP-028, GAP-018 each have one resolution log entry pointing to a single content ticket, but GAP-019 and GAP-024 and GAP-027 and GAP-035 share a single ticket-006. The section 7 resolution log enforces one row per gap regardless of how many tickets contributed. When multiple gaps are resolved by one content ticket, write one resolution log row per gap, all pointing to the same ticket.

- **Verify the per-crate table totals after each content epic**: epics 2-4 add spec content but do not modify the gap inventory. The per-crate table in section 6 reflects resolved/unresolved counts that are already set to 0 after epic-01. If any content epic discovers that a gap resolution requires modifying a different crate than what section 3 records, the crate column in section 3 must be updated along with the per-crate table in section 6. See `src/specs/overview/spec-gap-inventory.md` lines 118-127.
