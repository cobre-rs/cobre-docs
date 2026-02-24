# ticket-018 Fix All CRITICAL Findings

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Apply all CRITICAL severity fixes identified in epics 01-05. CRITICAL findings are: information loss (content present in source but absent from target), broken cross-reference links that prevent navigation, and missing FlatBuffers schema elements or field definitions that would cause implementation errors.

The specific list of CRITICAL findings is unknown until epics 01-05 complete. Based on the prior migration quality reports (all 50 files PASS), the expected CRITICAL finding count is low (possibly zero). However, the deeper semantic audit in this plan may surface issues the structural audit missed.

## Anticipated Scope

- **Files likely to be modified**: Any `src/specs/*.md` file where content was found missing in epics 01-03. The set of files is determined by the audit findings.
- **Key decisions needed**:
  - If information loss is found, should the missing content be restored from the source file exactly, or should it be adapted to the cobre-docs style?
  - If a broken cross-reference is found, should the link be corrected (update the path) or should the referenced section be created?
- **Open questions**:
  - How many CRITICAL findings do epics 01-03 produce?
  - Are any CRITICAL findings in files that other tickets also need to modify (conflict risk)?
  - If a section anchor is broken because a heading was renamed, should the heading be restored (losing the rename) or should the link anchor be updated to match the new heading?

## Dependencies

- **Blocked By**: tickets 001-015 (all audit tickets must complete first)
- **Blocks**: ticket-019 (CRITICAL must be fixed before HIGH so HIGH fixes don't overwrite CRITICAL fixes)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
