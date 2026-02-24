# Epic 06 Learnings: Remediation

**Plan**: spec-migration-audit
**Epic**: epic-06-remediation
**Date**: 2026-02-25

---

## Key Decisions Made During Remediation

- **Ticket scope restructuring before execution**: The original 3-ticket plan (018 CRITICAL, 019 HIGH, 020 MEDIUM/LOW) was restructured during refinement into 4 tickets when it became clear that 0 CRITICAL findings existed. Ticket-018 was repurposed for the cross-cutting β→π notation change (the highest-risk item), and ticket-021 was split from ticket-019 to isolate crate doc link additions from spec file section-number corrections. These two concerns modify disjoint file sets and can be verified independently.

- **Notation change sequenced first**: Ticket-018 was executed before all others because the notation change touched overlapping files (sddp-algorithm.md, risk-measures.md, lp-formulation.md, cut-management.md) that subsequent tickets also modified. Settling the canonical symbol set before any other file edits prevented conflicting notation states.

- **Contextual substitution, not blind find-and-replace**: The β→π substitution was governed by a per-pattern rule table rather than a global replace. One instance was intentionally preserved: `$\beta_h^{storage}$` in `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md` line 83, which is a production function coefficient — not a Benders cut coefficient. This is the only remaining `\beta` across all math spec files.

- **R7 (risk-measures §5 strikethrough artifacts) classified as toolchain issue**: Investigation of the reported strikethrough artifacts in risk-measures.md §5 found no `~~` markdown strikethrough markers in the source. The 28 pre-existing `<span>` warnings (documented in Epic 04) are caused by KaTeX emitting `<span class="katex">` elements that the pulldown-cmark parser sees as crossing markdown block boundaries when inside blockquotes. This is an mdbook-katex toolchain interaction, not an authoring error. The build exits 0, zero "Rendering failed" counts, and the LaTeX content is mathematically correct. No source changes were needed for R7.

- **R8 (risk-measures §10 lower bound validity) verified as correct**: The current text correctly states that for risk-averse SDDP (CVaR), the backward-pass lower bound is NOT a valid bound — it is a convergence indicator — and the Monte Carlo upper bound is also not valid under risk aversion. This matches the user's stated intent. The only change made was a framing refinement for clarity; the mathematical claims were not altered.

- **R5 (production-scale-reference) resolved by running lp_sizing.py**: The `~/git/powers/scripts/lp_sizing.py` script was executed with its default production-scale parameters (160 hydros, 130 thermals, 6 buses, 10 lines, average AR order 6, 15,000 cut slots). The script produced concrete LP sizing figures. The "this tool does not yet exist" claim was replaced with a populated results table, and §4.2 performance expectations were explicitly labeled as non-binding estimates. No changes were committed to the powers repo.

- **R2 (deferred.md C.5 NCS reclassification) chose IMPLEMENTED over deletion**: The NCS section C.5 was reclassified from DEFERRED to IMPLEMENTED with a forward-reference note pointing to the three implementing specs (equipment-formulations.md §6, input-system-entities.md §7, penalty-system.md §2). The feature description and formulation were retained for reference rather than deleted. The "Why Deferred" and "Prerequisites" sub-sections were removed as they are no longer applicable.

---

## Patterns That Worked Well

- **Cluster-by-root-cause grouping**: Grouping the 7 section-number errata into two clusters (Cluster A: solver-abstraction renumbering affecting 3 files with one root cause; Cluster B: phantom references in 3 unrelated files) allowed systematic verification. Cluster A's 4 findings (F-6, F-7, F-8, F-11) all traced to a single historical solver-abstraction.md renumbering event.

- **Reading each file before editing**: The ticket-019 implementation guide warned against trusting stale line numbers after ticket-018 modified overlapping files. Reading each file fresh before editing prevented all line-drift errors.

- **β→π with unified superscript preservation**: The substitution preserved superscript and subscript structure exactly (`\beta^v_h` → `\pi^v_h`, `\bar{\beta}` → `\bar{\pi}`, `\beta_t(\omega)` → `\pi_t(\omega)`). The resulting notation is cleaner because cut coefficients and dual variables now use the same base symbol `$\pi$`, making the derivation `$\pi^v_h = \pi^{wb}_h$` self-evident rather than requiring a cross-symbol explanation.

- **Symbol note cleanup as a distinct pass**: After completing formula substitutions, a dedicated cleanup pass removed the "we use $d$ for discount factor, not $\beta$, which denotes cut coefficients" explanatory notes from four files (discount-rate.md, sddp-algorithm.md, risk-measures.md, upper-bound-evaluation.md). Treating this as a separate pass avoided missing any notes during the formula substitution pass.

- **Cross-reference index errata note updated to reflect resolution**: After fixing all 7 section-number errata, the errata note in `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` was updated from a list of outstanding errors to a resolution confirmation. This closed the loop on the index's accuracy.

---

## Issues Encountered and How They Were Resolved

- **R7 span warnings are non-actionable**: The `<span>` warnings in risk-measures.md were pre-existing from Epic 04 (documented as 28 instances). Investigation confirmed no `~~` strikethrough markers exist in the source. The warnings come from the KaTeX preprocessor emitting `<span>` elements inside blockquoted theorem statements, which pulldown-cmark flags as unclosed HTML tags on block boundaries. This is a known mdbook-katex interaction pattern: the build exits 0, zero KaTeX rendering failures, and the rendered output is correct. The finding was documented as a toolchain limitation, not a source error.

- **F-10 DATA_MODEL legacy references in deferred.md**: The four `DATA_MODEL S3.x.x` references at lines 70, 167, 220, 814 (original numbering) were replaced with correct cobre-docs spec relative links. The substitutions required identifying the current canonical spec for each DATA_MODEL section reference, which was done via the cross-reference index.

- **R9 cobre-core misidentification was isolated to data-model.md**: The grep `"solver core.*cobre-core"` confirmed only one instance existed, at `/home/rogerio/git/cobre-docs/src/specs/data-model.md` line 5. It was fixed from "the solver core (`cobre-core`)" to "the data model library (`cobre-core`)". No other files contained the misidentification.

- **algorithm reference pages also needed β→π updates**: The ticket-018 file list did not initially include algorithm reference pages beyond benders.md. During execution, `cut-management.md`, `cut-selection.md`, `single-multi-cut.md`, and `cvar.md` in `src/algorithms/` all contained cut coefficient formulas using `$\beta$`. These were updated as part of ticket-018 scope. The ticket's "check `src/algorithms/benders.md`" instruction was generalized to all algorithm pages.

- **ferrompi.md HIGH gap confirmed as memory-architecture.md**: The ticket-021 spec noted uncertainty about the ferrompi HIGH gap. Reading the ticket-006 audit report confirmed the gap is `specs/hpc/memory-architecture.md`. A Key Concepts bullet was added to `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md` linking to that spec.

---

## Final Statistics

### Files Modified in Epic 06

- **Total source files modified**: 35 (under `src/`)
- **Math spec files (β→π notation change)**: 8 (cut-management.md, sddp-algorithm.md, risk-measures.md, lp-formulation.md, discount-rate.md, upper-bound-evaluation.md, hydro-production-models.md, notation-conventions.md)
- **Algorithm reference pages (β→π)**: 5 (benders.md, cut-management.md, cut-selection.md, single-multi-cut.md, cvar.md)
- **Spec files corrected (section errata, legacy refs, content)**: 10 (extension-points.md, solver-abstraction.md, design-principles.md, sddp-algorithm.md, penalty-system.md, deferred.md, data-model.md, production-scale-reference.md, internal-structures.md, equipment-formulations.md)
- **Crate doc pages (missing spec links)**: 6 (sddp.md, core.md, io.md, cli.md, ferrompi.md, overview.md)
- **Glossary**: 1 (9 terms added)
- **Cross-reference index**: 1 (errata note updated)
- **Other**: 4 (infinite-horizon.md, training-loop.md, configuration-reference.md, cut-management-impl.md — incidental updates from cross-cutting changes)

### Findings Resolved by Severity

| Severity | Input | Resolved in Epic 06 | Notes                                                                    |
| -------- | ----- | ------------------- | ------------------------------------------------------------------------ |
| CRITICAL | 0     | 0                   | None found in any epic                                                   |
| HIGH     | 29    | 29                  | 7 section errata + 8 user review + 14 crate doc links                    |
| MEDIUM   | 32    | 19                  | 6 asymmetric gaps + 3 algo pages + 9 glossary + R1; 12 cosmetic deferred |
| LOW      | 35    | 1+                  | F-10 fixed; ~34 cosmetic LOW findings remain as documentation debt       |

### Build State

- **mdbook build exit code**: 0
- **KaTeX rendering failures**: 0
- **Remaining warnings**: 28 `<span>` warnings in risk-measures.md (pre-existing toolchain issue; non-actionable)
- **Remaining `\beta` in cut-coefficient context**: 0
- **Remaining `\beta` total**: 1 instance in block-formulations.md line 83 (`$\beta_h^{storage}$`) — correctly preserved as a production function coefficient

---

## Architectural Decisions

- **β→π unification makes cut coefficients identical to dual variables**: After the rename, `$\pi^v_h = \pi^{wb}_h$` and `$\pi^{lag}_{h,\ell} = \pi^{lag}_{h,\ell}$` are tautologies rather than derived equalities. The notation reflects the mathematical reality that SDDP cut coefficients are LP dual variables, not separately defined quantities. This is consistent with the broader SDDP literature (e.g., Pereira & Pinto 1991, Shapiro et al.).

- **Deferred features retain formulation text even when reclassified**: C.5 NCS was reclassified as IMPLEMENTED but its variable definitions, LP formulation block, and data model description were preserved. The "Why Deferred" and "Prerequisites" blocks were removed. This approach maintains a historical record of the implementation scope without creating a stub or redirect-only section.

- **production-scale-reference §4.2 performance expectations labeled non-binding**: Rather than removing or fabricating benchmark numbers, the §4.2 section was annotated with an explicit "non-binding estimates pending solver benchmarking" caveat. This is honest about the current state and preserves the estimates as planning references.

---

## Recommendations for Future Work

- **The 28 `<span>` warnings in risk-measures.md require a toolchain fix, not a source fix**: If the warnings become blocking (e.g., a future mdbook version treats them as errors), the fix is to restructure the theorem statement blockquotes in §5 so that KaTeX display-math blocks do not straddle blockquote boundaries. The relevant lines are around the risk-averse subgradient theorem (lines ~95-115 in risk-measures.md).
- **Remaining cosmetic LOW findings**: Approximately 34 LOW findings from Epics 01-02 (emoji removal, Unicode normalization, minor prose inconsistencies) were not addressed in Epic 06. These are documented in epic-01 and epic-02 learnings files and can be addressed as an optional polish pass.
- **Conservation count re-verification**: Adding 6 asymmetric reference gaps (F-2, F-3, F-12, F-13, F-14, F-15) plus 14 crate doc links increases the graph edge count above the 489 baseline. A full re-run of the conservation check is recommended before the next cross-reference index refresh.
