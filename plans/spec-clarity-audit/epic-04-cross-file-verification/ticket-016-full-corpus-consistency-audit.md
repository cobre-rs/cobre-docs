# ticket-016 Run Full-Corpus Consistency Audit

## Context

### Background

Epics 01-03 of the spec-clarity-audit plan systematically cleaned the Cobre spec corpus: replacing "120 stages" production references with "60 stages", removing Option A / Appendix A content, collapsing superseded analysis, and creating a Decision Log with inline markers. These changes touched approximately 20 spec files across `src/specs/` and `src/crates/`. A final grep-based audit is needed to verify that (a) no stale patterns were missed, (b) no new inconsistencies were introduced during the cleanup, and (c) the remaining "120 stages" and "Strategy 2+3" references are properly contextualized.

### Relation to Epic

This is the second ticket of Epic 04 (Cross-File Verification). It runs after the cross-reference index update (ticket-015) and before the final build verification (ticket-017). The audit systematically sweeps the entire corpus for stale patterns defined in the master plan success metrics.

### Current State

Based on current corpus inspection:

- **"120 stages" references**: 6 remaining occurrences across 3 files (`production-scale-reference.md`, `scenario-generation.md`, `performance-adaptation-layer.md`). All appear to be properly contextualized as "hypothetical maximum", "worst-case", or "range bound" (e.g., "60-120 stages"), but this must be verified exhaustively.
- **"Strategy 2+3" references**: 3 remaining occurrences in `memory-architecture.md` and 1 in `design-principles.md`. All use the form "Strategy 2+3 (StageLpCache)" or "Strategy 2+3" with immediate StageLpCache context, but each must be verified as not presenting it as one of multiple options.
- **"Option A" / "Appendix A" references**: 0 occurrences in `src/specs/` and `src/crates/` (confirmed by grep).
- **DEC markers**: 15 inline markers placed in 7 spec files, matching the 15 entries in `decision-log.md`.
- **mdbook build**: succeeds with only pre-existing `risk-measures.md` `<span>` warnings and the search index size warning.
- **Crate docs**: No stale patterns detected in `src/crates/*.md`.

## Specification

### Requirements

1. Run a comprehensive grep-based audit across `src/specs/**/*.md` and `src/crates/**/*.md` for the following stale patterns:
   - `Option A` (case-insensitive) -- should return 0 matches
   - `Appendix A` (case-insensitive) -- should return 0 matches
   - `28 GB` or `28GB` -- should return 0 matches (stale memory estimate)
   - `10 MB basis` or `10MB basis` -- should return 0 matches (stale basis size)
   - `rkyv` -- should return 0 matches in adoption/decision context (may appear in historical "replaces rkyv" notes in `binary-formats.md`)
   - `bincode` -- should return 0 matches outside of `CLAUDE.md` context (the `CLAUDE.md` guideline "do not use bincode" is expected)
2. Audit all remaining "120 stages" references and classify each as:
   - **Legitimate**: explicitly labeled as "hypothetical maximum", "worst-case", "range bound", or "theoretical"
   - **Stale**: presented as a production baseline without qualifier -- these must be fixed in-ticket
3. Audit all remaining "Strategy 2+3" references and verify each is used in a context that presents StageLpCache as the adopted baseline (not as one option among alternatives).
4. Cross-check the Decision Log DEC entries against inline markers:
   - Verify that each of the 15 DEC-NNN IDs in `decision-log.md` has at least one corresponding inline marker `[DEC-NNN](decision-log.md)` in the spec corpus.
   - Verify that no inline DEC marker references a non-existent DEC entry.
5. Verify production-scale reference values are consistent across files:
   - "60 stages" as production baseline
   - "160 hydros" as production baseline
   - "22.3 GB" for StageLpCache memory (not "28 GB")
6. If any stale pattern is found, fix it in-ticket following the same patterns established in Epics 01-02 (replace with 60-stage value or add "hypothetical maximum" qualifier).

### Inputs/Props

**Stale pattern grep commands** (all run against `src/specs/` and `src/crates/`):

| Pattern                                                           | Expected Result | Meaning if Found            |
| ----------------------------------------------------------------- | --------------- | --------------------------- |
| `Option A` (case-insensitive)                                     | 0 matches       | Missed cleanup from Epic 01 |
| `Appendix A` (case-insensitive)                                   | 0 matches       | Missed cleanup from Epic 01 |
| `28 GB` or `28GB`                                                 | 0 matches       | Stale memory estimate       |
| `10 MB basis`                                                     | 0 matches       | Stale basis size estimate   |
| `120 stages` (not in "hypothetical"/"worst-case"/"range" context) | 0 matches       | Stale production reference  |

**DEC marker cross-check**: For each DEC-001 through DEC-015 in `decision-log.md`, verify at least one `[DEC-NNN]` link exists in a spec file outside `decision-log.md`.

### Outputs/Behavior

- A verification report (written as output text, not a separate file) listing:
  - Each grep pattern checked, the result, and pass/fail status
  - Each "120 stages" reference with its file, line, and classification (legitimate/stale)
  - Each "Strategy 2+3" reference with its file, line, and classification
  - DEC marker cross-check results (all 15 matched / any missing)
  - Production-scale value consistency results
  - Summary: total checks, passes, failures
- If any stale patterns are found and fixed, the specific edits made.

### Error Handling

- If a stale pattern is found that requires a judgment call (ambiguous context), do NOT fix it autonomously. Flag it in the report with the text "REQUIRES REVIEW: [description]" and proceed with the remaining checks.
- If the DEC marker cross-check reveals a DEC entry with no inline marker, flag it but do not add markers (that would be out of scope for this ticket).

## Acceptance Criteria

- [ ] Given `Option A` was removed in Epic 01, when `grep -ri "option a" src/specs/ src/crates/` is run, then it returns 0 matches.
- [ ] Given `Appendix A` was removed in Epic 01, when `grep -ri "appendix a" src/specs/ src/crates/` is run, then it returns 0 matches.
- [ ] Given stale memory values were updated, when `grep -r "28 GB\|28GB" src/specs/ src/crates/` is run, then it returns 0 matches.
- [ ] Given all "120 stages" references were reviewed, when each occurrence is checked, then every remaining instance has an explicit qualifier ("hypothetical maximum", "worst-case", range like "60-120", or "theoretical").
- [ ] Given all 15 DEC entries exist in `decision-log.md`, when the corpus is searched for `DEC-NNN` markers, then each of DEC-001 through DEC-015 has at least one inline reference in a spec file other than `decision-log.md`.

## Implementation Guide

### Suggested Approach

1. Run all stale-pattern grep commands systematically, recording results.
2. For "120 stages", read the surrounding context (5 lines before and after) for each match to classify it.
3. For "Strategy 2+3", verify each occurrence is in a "this is the adopted approach" context, not a "choosing between options" context.
4. For DEC cross-check, run `grep -r "DEC-001" src/specs/ | grep -v decision-log.md` for each DEC-001 through DEC-015.
5. Compile all results into a summary report.
6. If any stale patterns are found, fix them following Epic 01-02 patterns: replace production "120 stages" with "60 stages", add "hypothetical maximum" qualifier where 120 is a range bound.

### Key Files to Modify

- Likely none (read-only audit). If stale patterns are found, the specific affected files will be identified during the audit.

### Patterns to Follow

- Use the same classification scheme from ticket-004 and ticket-005: "production reference" (replace with 60) vs "hypothetical maximum" (keep 120 with qualifier) vs "range bound" (keep "60-120" with context).
- If fixing a "Strategy 2+3" occurrence, use the form "StageLpCache" as the primary name, with "Strategy 2+3" as parenthetical context only if needed for historical traceability.

### Pitfalls to Avoid

- Do not grep only `src/specs/` -- also include `src/crates/` (crate overview docs).
- Do not treat "120 stages" in a range like "60-120 stages" as stale; ranges are legitimate when the context explains the range.
- Do not fix ambiguous cases without flagging them -- the anti-simplification principle requires escalation.
- Do not count the `risk-measures.md` `<span>` warnings as new warnings (they are pre-existing and documented in the project memory).

## Testing Requirements

### Unit Tests

Not applicable (audit task).

### Integration Tests

- Run `mdbook build` and verify no new warnings appear (only the pre-existing `risk-measures.md` and search index warnings).
- If any files were edited, verify the specific grep patterns pass after the edit.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-015-update-cross-reference-index.md, ticket-004-update-120-stages-in-trait-specs.md, ticket-005-update-120-stages-in-hpc-and-overview-specs.md, ticket-006-add-stage-count-clarification-and-update-crate-docs.md, ticket-007-collapse-solver-abstraction-superseded-content.md, ticket-008-collapse-solver-workspaces-resolved-blockquote.md, ticket-009-collapse-solver-clp-impl-superseded-section.md, ticket-010-collapse-solver-highs-impl-superseded-notes.md, ticket-011-collapse-cut-management-impl-option-a-reference.md (all completed)
- **Blocks**: ticket-017-final-verification-and-build.md

## Effort Estimate

**Points**: 2
**Confidence**: High
