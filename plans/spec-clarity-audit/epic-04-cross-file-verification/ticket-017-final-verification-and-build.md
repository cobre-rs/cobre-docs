# ticket-017 Final Verification and mdBook Build

## Context

### Background

This is the terminal ticket of the spec-clarity-audit plan. Epics 01-03 performed all cleanup work (stale reference fixes, superseded content collapse, Decision Log creation), ticket-015 updated the cross-reference index, and ticket-016 ran a comprehensive grep-based consistency audit. This ticket performs the final end-to-end verification: confirming `mdbook build` succeeds, spot-checking key spec files for reading coherence, cross-checking Decision Log entries against inline markers, and verifying that the plan's master success metrics are all satisfied.

### Relation to Epic

This is the third and final ticket of Epic 04 (Cross-File Verification) and the terminal ticket of the entire spec-clarity-audit plan. It produces a final summary confirming that all plan goals have been met.

### Current State

- All 14 prior tickets (ticket-001 through ticket-016) are completed.
- `mdbook build` succeeds with only pre-existing `risk-measures.md` `<span>` warnings (cosmetic, documented in project memory as not breaking the build) and a search index size warning.
- The cross-reference index has been updated for `decision-log.md` (ticket-015).
- The grep-based consistency audit (ticket-016) has passed.
- The Decision Log (`src/specs/overview/decision-log.md`) contains 15 DEC entries with inline markers in 7 primary spec files.
- `CLAUDE.md` has been updated with the Decision Log Convention section (ticket-014).

## Specification

### Requirements

1. Run `mdbook build` and verify:
   - Build succeeds (exit code 0).
   - The only warnings are the pre-existing `risk-measures.md` `<span>` warnings and the search index size warning.
   - No new warnings related to broken links, missing files, or HTML issues.
2. Spot-check the following 7 high-traffic spec files for reading coherence (no contradictory statements, no orphaned references, no sentence fragments from edits):
   - `src/specs/overview/design-principles.md` (section 5.4 rewritten in ticket-001)
   - `src/specs/architecture/solver-abstraction.md` (superseded content collapsed in ticket-007)
   - `src/specs/data-model/binary-formats.md` (Appendix A deleted in ticket-002)
   - `src/specs/architecture/training-loop.md` (stage count updated)
   - `src/specs/hpc/memory-architecture.md` (stage count updated, DEC markers added)
   - `src/specs/overview/production-scale-reference.md` (clarification note added in ticket-006, DEC marker added)
   - `src/specs/overview/decision-log.md` (created in ticket-012)
3. Cross-check Decision Log completeness:
   - Verify all 15 DEC entries (DEC-001 through DEC-015) in `decision-log.md` have Status `active`.
   - Verify each DEC entry's Affected Files column lists files that actually contain the corresponding inline marker or reference.
4. Verify the master plan success metrics are all satisfied:
   - Zero "Option A" references as an adopted strategy (grep check).
   - Zero "Appendix A" references (grep check).
   - Zero unqualified "120 stages" production baseline references (any remaining "120 stages" has a "hypothetical maximum" or "worst-case" qualifier).
   - All superseded analysis sections collapsed to footnotes or removed.
   - Decision Log exists and is populated with 15 entries.
   - Cross-reference index updated for `decision-log.md`.
   - `CLAUDE.md` updated with Decision Log Convention.

### Inputs/Props

**Files to spot-check** (7 files, read sections affected by the audit plan):

| File                            | Sections Affected by Audit | What to Verify                                                              |
| ------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `design-principles.md`          | SS5.3, SS5.4, SS5.5        | StageLpCache workflow description is coherent; no Option A references       |
| `solver-abstraction.md`         | SS3, SS5, SS6, SS10, SS11  | Superseded comparative framing removed; DEC markers present                 |
| `binary-formats.md`             | SS1-SS5, Cross-References  | Appendix A absent; section numbering contiguous; DEC markers present        |
| `training-loop.md`              | Stage count references     | All use 60 stages or properly qualified                                     |
| `memory-architecture.md`        | SS2, SS3                   | "Strategy 2+3 (StageLpCache)" used as adopted baseline; DEC markers present |
| `production-scale-reference.md` | Opening paragraphs         | 60-stage baseline with clarification note; DEC-009 marker present           |
| `decision-log.md`               | Sections 1-3               | 15 entries, all active, Affected Files columns populated                    |

### Outputs/Behavior

- Confirmation text (in ticket output) with:
  - `mdbook build` result (success/failure, warning count).
  - Spot-check results for each of the 7 files (pass/fail with brief note).
  - Decision Log cross-check result.
  - Master plan success metrics checklist (all items checked).
  - Overall plan status: COMPLETE or ISSUES FOUND (with details).
- No files are modified (this is a verification-only ticket). If minor issues are found during spot-checking, they are flagged in the output for manual review -- they are NOT fixed in-ticket.

### Error Handling

- If `mdbook build` fails with a new error (not the pre-existing `risk-measures.md` warnings), report the error verbatim and mark the ticket as BLOCKED until the error is resolved.
- If a spot-check reveals a reading coherence issue (e.g., a sentence fragment or dangling reference), report it with file path and line number but do NOT fix it in-ticket. Flag it as "COHERENCE ISSUE: [description]" in the output.

## Acceptance Criteria

- [ ] Given `mdbook build` is run from the repo root, when the command completes, then exit code is 0 and the only warnings are the pre-existing `risk-measures.md` `<span>` warnings and the search index size warning.
- [ ] Given `design-principles.md` section 5.4 was rewritten, when the section is read, then it describes the StageLpCache workflow without referencing Option A as an alternative.
- [ ] Given `binary-formats.md` Appendix A was deleted, when the file is read, then it has sections Purpose, 1-5, and Cross-References with no gap in numbering and no references to an appendix.
- [ ] Given the Decision Log has 15 entries, when `grep -c "^| DEC-" src/specs/overview/decision-log.md` is run, then it returns 15.
- [ ] Given the master plan defined 6 success metrics, when all metrics are verified, then a completion report confirms all 6 pass.

## Implementation Guide

### Suggested Approach

1. Run `mdbook build` from the repo root. Capture stdout/stderr. Verify exit code 0 and count warnings (expecting only risk-measures.md and search index warnings).
2. For each of the 7 spot-check files, read the sections listed in the Inputs/Props table. For each, confirm:
   - No contradictory "adopted" statements (e.g., "Option A is adopted" alongside "StageLpCache is adopted").
   - No orphaned cross-references (links to deleted sections or files).
   - No sentence fragments or grammar issues caused by edit splicing.
   - DEC markers are present where expected.
3. Run the Decision Log cross-check: `grep -c "^| DEC-" src/specs/overview/decision-log.md` should return 15. Spot-check 3 random DEC entries by verifying their Affected Files column matches reality.
4. Run master plan success metric checks:
   - `grep -ri "option a" src/specs/ src/crates/` should return 0.
   - `grep -ri "appendix a" src/specs/ src/crates/` should return 0.
   - `grep -r "120 stages" src/specs/ src/crates/` -- verify all matches have qualifiers.
   - Confirm `decision-log.md` exists with 15 entries.
   - Confirm cross-reference index contains `decision-log.md`.
   - Confirm `CLAUDE.md` contains "Decision Log Convention".
5. Compile results into a completion report.

### Key Files to Modify

None (read-only verification).

### Patterns to Follow

- The spot-check is a human-readable coherence review, not an exhaustive grep. Focus on the sections that were edited, looking for editing artifacts.
- The master plan success metrics are defined in `plans/spec-clarity-audit/00-master-plan.md` under "Goals".

### Pitfalls to Avoid

- Do not fix issues found during spot-checking -- this is a verification ticket, not a fix ticket. Report issues for manual review.
- Do not treat the pre-existing `risk-measures.md` `<span>` warnings as failures. They are documented in project memory as cosmetic and predate this plan.
- Do not skip the reading coherence spot-check and rely solely on grep -- grep catches pattern matches but not editing artifacts like sentence fragments or contradictory prose.

## Testing Requirements

### Unit Tests

Not applicable (verification task).

### Integration Tests

- `mdbook build` is the primary integration test. It verifies all internal links resolve, all files are included in the book, and the HTML output is generated successfully.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-015-update-cross-reference-index.md, ticket-016-full-corpus-consistency-audit.md
- **Blocks**: None (terminal ticket)

## Effort Estimate

**Points**: 1
**Confidence**: High
