# ticket-010 Collapse Superseded Inline Notes in solver-highs-impl.md

## Context

### Background

`src/specs/architecture/solver-highs-impl.md` contains inline supersession notes about HiGHS cloning. Unlike solver-clp-impl.md which has a dedicated superseded section, solver-highs-impl.md has shorter inline notes embedded within active content. These need to be collapsed to single-sentence footnotes.

### Relation to Epic

This ticket handles the smallest superseded content block in Epic 02. HiGHS is the primary solver backend for the minimal viable solver, so its implementation spec should be maximally clear.

### Current State

`src/specs/architecture/solver-highs-impl.md`:

1. **Line 244** (within the stage transition section): A multi-sentence paragraph explaining that `Highs_passLp` is used under Strategy 2+3, that `Highs_addRows` is no longer on the hot path, and providing CSC format details. This is primarily current-architecture content but contains comparative framing ("no longer used on the hot-path stage transition")

2. **Line 246**: `HiGHS does not expose LP template cloning through its C API (no equivalent of CLP's makeBaseModel/setToBaseModel), but this is moot under StageLpCache -- the cloning optimization is superseded.`
   This is a pure supersession note -- cloning was never available for HiGHS, and with StageLpCache it is moot regardless.

## Specification

### Requirements

1. **Line 244 area**: Keep the current-architecture description of `Highs_passLp` loading the StageLpCache. Remove the comparative framing ("no longer used on the hot-path stage transition") and let the description stand on its own. The `Highs_addRows` mention for StageLpCache assembly between iterations can stay as a brief parenthetical
2. **Line 246**: Remove the cloning mootness note entirely. It adds no value -- HiGHS never had cloning, and StageLpCache makes the point doubly irrelevant. The absence of cloning in HiGHS is already documented in the C API capabilities earlier in the file

### Inputs/Props

- File to edit: `src/specs/architecture/solver-highs-impl.md`
- Lines 244-246

### Outputs/Behavior

- The stage transition section describes `Highs_passLp` with StageLpCache as the current architecture without "compared to Option A" framing
- No mention of cloning being "moot" or "superseded"

### Error Handling

- If line numbers have shifted, locate by searching for "superseded" and "moot under StageLpCache"

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-highs-impl.md`, when searching for "superseded", then zero matches are found
- [ ] Given `src/specs/architecture/solver-highs-impl.md`, when searching for "moot", then zero matches are found
- [ ] Given `src/specs/architecture/solver-highs-impl.md`, when reading the stage transition section, then `Highs_passLp` with StageLpCache is described as the current mechanism without comparative framing
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read lines 240-250 to understand the context
2. Edit line 244: Rewrite to describe the current architecture directly:
   `Under Strategy 2+3, stage transitions load the complete StageLpCache[t] via Highs_passLp -- which includes structural constraints plus all active cuts in CSC format. Since the StageLpCache CSC is in HiGHS's native internal format, Highs_passLp is a fast bulk memory operation with no format conversion overhead. Highs_addRows is used during StageLpCache assembly between iterations.`
   (Remove "The Highs_addRows call is no longer used on the hot-path stage transition" phrasing)
3. Delete line 246 (the cloning mootness note) entirely
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/solver-highs-impl.md` (lines 244-246)

### Patterns to Follow

- Architecture specs use `SS` prefix for section references
- Describe the current architecture directly, not comparatively

### Pitfalls to Avoid

- Do not remove the mention of `Highs_addRows` entirely -- it is still used for StageLpCache assembly
- Do not change section numbers or headings
- The edits are small and surgical -- do not rewrite surrounding paragraphs

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -c "superseded\|moot" src/specs/architecture/solver-highs-impl.md` and verify count is 0
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-003 (Appendix A cross-references in this file should be cleaned first)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
