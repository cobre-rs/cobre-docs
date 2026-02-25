# ticket-009 Apply Fixes for Epic 02 Findings

## Context

### Background

Tickets 006-008 produced findings reports documenting bibliography metadata errors, unreachable URLs, contextually incorrect citations, orphan bibliography entries, and uncited references. This ticket applies the fixes for all issues identified in those reports.

### Relation to Epic

This is the final ticket in Epic 02. It depends on all three audit tickets being complete so the full scope of changes is known.

### Current State

The findings reports are located at:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-006.md`
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-007.md`
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-008.md`

## Specification

### Requirements

1. Read all three findings reports to build a consolidated list of required changes
2. For bibliography metadata corrections (from findings-006):
   - Fix author names, years, titles, journal names, DOIs in `bibliography.md`
   - If a paper has been published in a journal since the arXiv preprint, update the entry to reference the journal version (keeping the arXiv link as secondary)
3. For unreachable URLs (from findings-007):
   - If an alternative URL was found, update the link
   - If no alternative exists, add a note "[URL last verified: YYYY-MM-DD]"
4. For contextually incorrect citations (from findings-008):
   - Fix the claim text in the citing spec to accurately reflect the paper's contribution
   - If the claim is merely misleading (not wrong), soften the language
5. For orphan bibliography entries:
   - Do NOT remove them (they may be useful for future reference)
   - Add a note if they are not currently cited
6. For uncited references in specs:
   - Add the reference to bibliography.md if it is a legitimate source
7. After all fixes, run `mdbook build` to verify

### Inputs/Props

**Findings reports** (read first):

- `findings-006.md` through `findings-008.md` in the epic-02 directory

**Files potentially modified**:

- `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- Any spec file that contains a contextually incorrect citation

### Outputs/Behavior

- All bibliography metadata corrections applied
- All citation usage corrections applied
- `mdbook build` completes without errors
- A summary of changes listing each file modified and what was changed

### Error Handling

- If a finding requires domain expertise to resolve (e.g., whether a claim about a paper is correct), flag it as NEEDS REVIEW
- If fixing a citation claim would require rewriting a significant portion of a spec section, flag it as SCOPE ESCALATION and do not apply the fix in this ticket

## Acceptance Criteria

- [ ] Given findings from tickets 006-008, when all NEEDS CORRECTION entries are processed, then each is either fixed or flagged as NEEDS REVIEW
- [ ] Given bibliography.md is modified, when DOI links are preserved, then they still point to the correct papers
- [ ] Given citation usage fixes are applied, when the spec text is re-read, then the claims accurately reflect the cited papers' contributions
- [ ] Given fixes are applied, when `mdbook build` is run, then it exits with code 0

## Implementation Guide

### Suggested Approach

1. Start with bibliography.md metadata fixes (simplest, highest confidence)
2. Apply URL fixes
3. Apply citation usage fixes in specs (most nuanced)
4. Run `mdbook build`
5. Produce the change summary

### Key Files to Modify

- `/home/rogerio/git/cobre-docs/src/reference/bibliography.md` (metadata corrections)
- Various spec files (citation usage corrections -- exact files depend on findings)

### Patterns to Follow

- When fixing a bibliography entry, preserve the existing formatting style (bold authors, italic journal name, em-dash annotation)
- When fixing a citation claim, minimize changes to surrounding text
- When updating an arXiv entry to a journal version, keep the arXiv link as a secondary reference

### Pitfalls to Avoid

- Do not reformat the entire bibliography to a different citation style -- match the existing format
- Do not add new references that were not identified in the findings reports
- Do not change the annotation text in bibliography.md unless the annotation itself was flagged as incorrect

## Testing Requirements

### Unit Tests

N/A (documentation changes)

### Integration Tests

- `mdbook build` must pass from `/home/rogerio/git/cobre-docs/`

### E2E Tests

N/A

## Dependencies

- **Blocked By**: ticket-006, ticket-007, ticket-008
- **Blocks**: None (Epics 03-04 can start independently)

## Effort Estimate

**Points**: 2
**Confidence**: Medium (depends on volume of findings from tickets 006-008)
