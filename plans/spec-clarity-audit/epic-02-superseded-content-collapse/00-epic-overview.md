# Epic 02: Superseded Content Collapse

## Goal

Collapse detailed superseded analysis in recently-edited files to 1-2 sentence footnotes. These files were updated during the StageLpCache adoption and already contain the correct adopted baseline, but they also preserve extensive historical analysis (Option A workflows, cloning comparisons, memory tables) that clutters the reading experience and may confuse implementers.

## Scope

This epic covers files that **were** edited during the StageLpCache adoption and contain superseded content marked with "superseded", "previous Option A", "what it replaces", or similar labels. The goal is to collapse each block of superseded content to a brief footnote.

## Files Targeted

- `src/specs/architecture/solver-abstraction.md` -- SS11.2 "What it replaces" section with Option A memory comparison table; SS5 inline supersession notes
- `src/specs/architecture/solver-workspaces.md` -- SS1.10 "Resolved" blockquote with 30-line original analysis
- `src/specs/architecture/solver-clp-impl.md` -- SS5 full superseded C++ wrapper strategy section with comparison table
- `src/specs/architecture/solver-highs-impl.md` -- inline supersession notes about cloning
- `src/specs/architecture/cut-management-impl.md` -- SS3.3 inline reference to "previous Option A"

## Approach

For each superseded block:

1. Identify the exact lines containing superseded analysis
2. Replace with a 1-2 sentence footnote: "[Component] was previously [brief description]. Superseded by StageLpCache ([Solver Abstraction SS11.4](./solver-abstraction.md))."
3. Preserve any information that is still relevant (e.g., that `addRows` is still used for StageLpCache assembly between iterations)
4. Verify the surrounding context still reads coherently

## Ticket Count: 5

## Dependencies

- Blocked by Epic 01 ticket-002 (binary-formats cleanup) -- binary-formats.md option analysis is deleted in Epic 01; Epic 02 collapses remaining superseded content in other files. No direct file overlap, but the conceptual ordering matters (remove the source-of-truth stale content first, then clean up downstream references).

## Completion Criteria

- Zero multi-paragraph superseded analysis blocks remain in any spec file
- Each former superseded block is replaced by a 1-2 sentence footnote
- `grep -c "superseded\|previous Option A\|What it replaces\|Original analysis" src/specs/architecture/*.md` returns only the footnote lines
- `mdbook build` succeeds
