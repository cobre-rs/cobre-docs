# ticket-019 Fix All HIGH Findings

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Apply all HIGH severity fixes identified in epics 01-05. HIGH findings include: incorrect spec-to-crate mapping (spec placed in wrong section), crate doc pages missing links to primary specs, contradictions between algorithm reference pages and formal specs, and broken anchor links (file exists but section anchor is wrong).

If Epic 02 determines that any specs need to be moved between sections (e.g., `input-loading-pipeline.md` moved from `specs/architecture/` to `specs/data-model/`), this ticket implements those moves and updates all cross-references pointing to the moved file.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/crates/*.md` — if crate doc pages are missing spec links (from ticket-006)
  - `src/SUMMARY.md` — if any spec files are moved between sections
  - `src/algorithms/*.md` — if algorithm reference pages contradict formal specs (from ticket-012)
  - `src/specs/*.md` — if cross-reference anchors need to be updated (from tickets 010-011)
  - Potentially moving a spec file if placement is determined to be wrong (from ticket-008)
- **Key decisions needed**:
  - If `scenario-generation.md` or `input-loading-pipeline.md` are found to be in the wrong section, does moving them require updating all incoming cross-references? (Yes — this is a significant change requiring careful link updates)
  - If crate doc pages need new spec links added, what format should the links follow (Key Concepts bullet vs Overview prose mention)?
- **Open questions**:
  - How many HIGH findings do epics 02-03 produce?
  - Do any HIGH findings involve file moves (high risk, many affected links)?
  - If a contradiction exists between `algorithms/sddp-theory.md` and `specs/math/sddp-algorithm.md`, which is the authoritative source and which gets corrected?

## Dependencies

- **Blocked By**: ticket-018 (CRITICAL fixes first to avoid conflict)
- **Blocks**: ticket-020

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
