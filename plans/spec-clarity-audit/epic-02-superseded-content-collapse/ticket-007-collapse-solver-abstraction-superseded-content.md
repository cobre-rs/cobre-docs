# ticket-007 Collapse Superseded Content in solver-abstraction.md

## Context

### Background

`src/specs/architecture/solver-abstraction.md` was the primary file edited during the StageLpCache adoption and contains the authoritative StageLpCache specification (SS11.2-SS11.4). However, it also preserves extensive superseded content: (1) a "What it replaces" comparison section with a detailed Option A memory table, (2) inline "superseded" labels in the optimization status table, and (3) Option A comparison text in SS11.2. This detailed historical analysis clutters the reading experience for implementers who need to understand the current architecture.

### Relation to Epic

This is the most important ticket in Epic 02 because solver-abstraction.md is the authoritative source for the LP construction architecture. Cleaning it first ensures the canonical reference is clear before cleaning downstream files.

### Current State

Superseded content blocks in `src/specs/architecture/solver-abstraction.md`:

1. **SS11.2 lines 578-591**: Description of StageLpCache that begins with "This replaces the previous Option A approach" and includes inline comparison text
2. **SS11.2 lines 631-638**: "What it replaces" section with an Option A memory table:
   ```
   | Component (Option A)             | Per Thread | 48 Threads/Rank | Node (4 ranks) |
   ```
   This is a 5-row table showing the old memory model. The new StageLpCache memory table (lines 640-648) follows immediately after.
3. **SS11.3 lines 595-603**: Optimization status table with "Superseded" labels for CLP cloning and pre-assembled CSR cut blocks
4. **SS5 lines 431, 448, 458**: Strategy 2+3 supersession notes within the cut pool section

## Specification

### Requirements

1. **SS11.2 "What it replaces" section (lines 631-638)**: Delete the entire Option A memory table and the "What it replaces" heading. Replace with a single footnote sentence: `> The StageLpCache replaces the previous Option A per-thread memory model (each thread maintaining independent CSR cut data), reducing node-wide memory from ~91.8 GB to ~22.3 GB. See the Decision Log for details.`
2. **SS11.2 inline comparison (lines 578-591)**: Remove the phrases "This replaces the previous Option A approach" and "under the previous Option A approach" from the StageLpCache description. Let the StageLpCache description stand on its own as the current architecture without referencing what it replaced.
3. **SS11.3 optimization status table (lines 595-603)**: Remove the two "Superseded" rows (CLP `makeBaseModel` cloning and Pre-assembled CSR cut blocks). These optimizations are no longer relevant and their presence implies they were once planned. Keep only the "Adopted" and "Deferred" rows.
4. **SS5 inline notes (lines 431, 448, 458)**: Collapse each "Strategy 2+3 supersession" paragraph to a single sentence footnote. The current text explains in detail how Strategy 2+3 changes the cut loading path -- this is already fully specified in SS11 and does not need to be repeated in SS5.

### Inputs/Props

- File to edit: `src/specs/architecture/solver-abstraction.md`
- StageLpCache specification: SS11.2-SS11.4 in the same file (the authoritative content to keep)

### Outputs/Behavior

- solver-abstraction.md reads as a clean specification of the current architecture
- No multi-paragraph superseded analysis blocks remain
- Each footnote is 1-2 sentences maximum
- The StageLpCache sections (SS11.2-SS11.4) describe the current architecture without "compared to Option A" framing

### Error Handling

- If line numbers have shifted (likely since ticket-002 and ticket-003 may have edited cross-references in this file), locate content by searching for "What it replaces", "Option A", "Superseded", and "Strategy 2+3 supersession"

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-abstraction.md`, when searching for "Component (Option A)", then zero matches are found (the Option A memory table is deleted)
- [ ] Given `src/specs/architecture/solver-abstraction.md`, when searching for "What it replaces", then zero matches are found
- [ ] Given the SS11.3 optimization status table, when reading its rows, then no "Superseded" rows exist
- [ ] Given SS5 of the file, when searching for paragraphs longer than 2 lines containing "Strategy 2+3", then each such paragraph has been collapsed to a 1-2 sentence footnote
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read SS11.2-SS11.4 (approximately lines 570-680) to understand the full StageLpCache specification
2. Delete the "What it replaces" heading and Option A memory table (lines 631-638). Insert a single-line blockquote footnote in its place
3. In SS11.2 (lines 578-591), remove comparative phrases ("This replaces the previous Option A approach", "under the previous Option A approach") while keeping the StageLpCache description intact
4. In SS11.3 optimization table (lines 595-603), delete the rows for "CLP makeBaseModel cloning" and "Pre-assembled CSR cut blocks" (both marked "Superseded")
5. In SS5 (search for "Strategy 2+3 note" and "Strategy 2+3 supersession"):
   - Line 431 area: Collapse the blockquote to: `> Under StageLpCache (SS11.4), cut coefficients are absorbed into the per-stage CSC. The cut pool retains only metadata.`
   - Line 448 area: Collapse to: `> Selective cut addition is the adopted baseline. Under StageLpCache (SS11.4), active cuts are pre-assembled into the per-stage CSC rather than added at each stage transition via addRows.`
   - Line 458 area: Remove entirely if it duplicates the previous footnote, or collapse to one sentence
6. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md`

### Patterns to Follow

- Architecture specs use `SS` prefix for section references
- Footnotes use blockquote format: `> Brief description. See [link] for details.`

### Pitfalls to Avoid

- Do not delete the StageLpCache memory table (lines 640-648) -- that is the current architecture. Only delete the Option A comparison table
- Do not remove the optimization status table entirely -- just the "Superseded" rows. Keep "Adopted" and "Deferred" rows
- Do not edit the StageLpCache specification itself (SS11.4) -- only remove comparative framing text
- Preserve all section numbers (SS5, SS11, SS11.2, SS11.3, SS11.4) -- other files reference them

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -c "What it replaces\|Component (Option A)\|Superseded" src/specs/architecture/solver-abstraction.md` and verify count is 0
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-002 (binary-formats cleanup removes the source Option A decision), ticket-003 (Appendix A cross-references cleaned from this file)
- **Blocks**: ticket-015 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
