# ticket-008 Collapse Resolved Blockquote in solver-workspaces.md SS1.10

## Context

### Background

`src/specs/architecture/solver-workspaces.md` section SS1.10 ("Resolved -- Cut Loading Cost (Strategy 2+3)") contains a 30-line blockquote preserving the "original analysis" of cut loading cost under Option A. The blockquote begins with "Resolved: Strategy 2+3 (StageLpCache) resolves the cut loading bottleneck identified below" and then reproduces the entire original analysis including a sizing table, mitigation strategies list, and the conclusion that cut loading was the dominant cost. This is the largest single block of superseded content in any spec file.

### Relation to Epic

This ticket targets the most visually prominent superseded block in the spec corpus -- a 30-line blockquote that a reader would encounter when reading the workspaces spec sequentially. Collapsing it removes the most disruptive reading interruption.

### Current State

`src/specs/architecture/solver-workspaces.md` lines 184-210:

- Line 184: `### 1.10 Resolved -- Cut Loading Cost (Strategy 2+3)`
- Lines 186-188: Resolution summary (3 lines) -- this is the useful part
- Lines 190-210: Original analysis blockquote (21 lines) -- this is the superseded content to collapse:
  - Sizing table (cut data vs basis data)
  - Calculation "~5 ms per stage transition... 60 stages... ~300 ms for cut loading vs ~120 ms for solving"
  - "Two-level storage consideration" paragraph
  - "Mitigation strategies" list (4 items: pre-assembled CSR, CLP cloning, incremental updates, reduced active count)
  - Concluding sentence about motivating solver-specific optimizations

## Specification

### Requirements

1. Keep the section heading `### 1.10 Resolved -- Cut Loading Cost (Strategy 2+3)` unchanged
2. Keep the 3-line resolution summary (lines 186-188) that describes how StageLpCache resolves the bottleneck
3. Replace the 21-line original analysis blockquote (lines 190-210) with a 2-sentence footnote:
   `> The original analysis (pre-StageLpCache) identified cut loading via per-thread addRows as the dominant stage transition cost: ~5 ms loading vs ~2 ms solving per stage at production scale. This motivated the StageLpCache design which eliminates per-thread cut assembly entirely.`
4. Remove the "retained below for historical context" sentence (line 188) since the detailed history is being collapsed

### Inputs/Props

- File to edit: `src/specs/architecture/solver-workspaces.md`
- Lines 184-210

### Outputs/Behavior

- SS1.10 is a concise 6-7 line section: heading + resolution summary + 2-sentence footnote
- No multi-paragraph blockquote with sizing tables and mitigation strategy lists
- The key insight (cut loading was 2.5x more expensive than solving) is preserved in the footnote

### Error Handling

- If line numbers have shifted, locate by searching for "### 1.10" or "Original analysis"

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-workspaces.md`, when reading section SS1.10, then it contains at most 8 lines total (heading, blank line, resolution summary, blank line, footnote)
- [ ] Given `src/specs/architecture/solver-workspaces.md`, when searching for "Mitigation strategies" or "Two-level storage consideration", then zero matches are found
- [ ] Given `src/specs/architecture/solver-workspaces.md`, when searching for "retained below for historical context", then zero matches are found
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read lines 184-215 to understand the full section
2. Keep lines 184-187 (heading and resolution summary, minus the "retained below" sentence)
3. Replace lines 188-210 with:
   ```
   > The original analysis (pre-StageLpCache) identified cut loading via per-thread `addRows` as the dominant stage transition cost: ~5 ms loading vs ~2 ms solving per stage at production scale. This motivated the StageLpCache design which eliminates per-thread cut assembly entirely.
   ```
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/solver-workspaces.md` (lines 184-210)

### Patterns to Follow

- Footnotes in architecture specs use blockquote format: `> Brief text.`
- Section numbering uses `SS` prefix

### Pitfalls to Avoid

- Do not delete the section heading or resolution summary -- only the detailed original analysis
- Do not renumber subsequent sections
- Do not touch the cross-references section at the end of the file (unless Appendix A references were already cleaned by ticket-003)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -c "Mitigation strategies\|Two-level storage\|retained below" src/specs/architecture/solver-workspaces.md` and verify count is 0
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-003 (Appendix A cross-references in this file should be cleaned first)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
