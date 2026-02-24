# ticket-020 Fix MEDIUM and LOW Findings and Verify Final Build

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Apply all MEDIUM severity fixes and tractable LOW severity fixes from epics 01-05. Then run the final `mdbook build` verification to confirm the entire fixed book builds successfully with exit code 0.

MEDIUM findings include: glossary entries for terms that appear in specs but are not defined (from ticket-013), LaTeX equation fixes for rendering failures caused by unsupported commands (from tickets 014-015), and any style inconsistencies from the content audit.

The final build check is the quality gate for the entire audit plan.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/reference/glossary.md` — add missing term definitions (from ticket-013)
  - Any spec files with LaTeX rendering issues — update LaTeX commands to MathJax-compatible equivalents (from tickets 014-015)
- **Key decisions needed**:
  - Which MEDIUM findings are tractable vs "nice to have"? (glossary additions are tractable; style inconsistencies may require judgment calls)
  - For LaTeX fixes: if a LaTeX command is not supported by the deployed MathJax version, is the fix to change the command or to update the MathJax version in the mdBook theme?
- **Open questions**:
  - How many MEDIUM and LOW findings do epics 01-05 produce?
  - Does the glossary require new sections (e.g., a section for implementation/tooling terms) or only additions to existing sections?
  - After all fixes, does `mdbook build --dest-dir /tmp/build-check` exit 0?
  - Should the final build verification also check that the deployed GitHub Pages site is updated (i.e., push to main and verify CI)?

## Dependencies

- **Blocked By**: ticket-019 (HIGH fixes must be applied before MEDIUM/LOW to avoid conflicts)
- **Blocks**: Nothing — this is the final ticket in the plan

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
