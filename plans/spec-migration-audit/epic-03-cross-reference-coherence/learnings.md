# Epic 03 Learnings: Cross-Reference and Coherence Audit

**Plan**: spec-migration-audit
**Epic**: epic-03-cross-reference-coherence
**Completed**: 2026-02-24

---

## What This Epic Accomplished

Epic 03 performed a full semantic audit of cross-references across the entire spec corpus. Four tickets covered distinct scopes:

- **Ticket 010**: 18 files (3 overview + 1 math index + 14 math specs), 376 links, 136 section-number references audited. Yielded 1 HIGH and 2 MEDIUM findings.
- **Ticket 011**: 37 files (architecture, HPC, data model, configuration, deferred), approximately 1,149 links, 398 section-number references verified (341 full audit + 57 spot-check). Yielded 6 HIGH, 4 MEDIUM, and 1 LOW finding.
- **Ticket 012**: 13 algorithm reference pages, 19 formulas and 8 factual claims checked against formal specs, 2 Further Reading link gaps identified. Yielded 3 MEDIUM findings. Zero formula contradictions found.
- **Ticket 013**: Glossary (72 terms across 10 categories) and all 8 crate doc pages (35 existing links). Yielded 9 MEDIUM findings (all glossary gaps). All 35 existing crate doc links verified semantically accurate.

---

## Key Findings Summary

| Severity  |  Count | Finding IDs                                                    |
| --------- | -----: | -------------------------------------------------------------- |
| CRITICAL  |      0 | --                                                             |
| HIGH      |      7 | F-1, F-5, F-6, F-7, F-8, F-9, F-11                             |
| MEDIUM    |     19 | F-2, F-3, F-12, F-13, F-14, F-15, F-16, F-17, F-18, F-19--F-27 |
| LOW       |      1 | F-10                                                           |
| **Total** | **27** |                                                                |

The 7 HIGH findings are all wrong section numbers that actively misdirect readers to incorrect content. The 19 MEDIUM findings split into: asymmetric bidirectional reference gaps (F-2, F-3, F-12, F-13, F-14, F-15), algorithm page notation/link gaps (F-16, F-17, F-18), and glossary term omissions (F-19 through F-27). No content is factually wrong in the algorithm pages -- all 19 formulas and 8 claims checked are mathematically consistent with their formal spec counterparts.

---

## Root Cause Patterns Discovered

### Pattern 1: solver-abstraction.md Off-by-One Renumbering

The single largest concentration of HIGH findings (F-6, F-8, F-11) shares a common root cause: `solver-abstraction.md` was renumbered at some point (likely when "Dual Variable Normalization" was inserted as S8), shifting sections 8-11 by one position, but cross-references from other files were not updated. Specifically:

- `design-principles.md` references S9 for compile-time solver selection (correct section is S10) -- F-11
- `extension-points.md` references S2 for compile-time solver selection (correct section is S10) -- F-6
- `solver-abstraction.md` itself references S10 for LP rebuild strategy (correct section is S11) -- F-8
- `solver-abstraction.md` footer mislabels S8 as "stage transitions" and S11 as "dual-solver validation" -- F-7

All four findings require the same type of fix: updating section number references to point to the correct sections after the renumbering. This pattern is documented at `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-011-audit-report.md`, section 7 "Solver Abstraction Section Numbering Pattern".

### Pattern 2: Phantom Section References (Sections That Never Existed)

Two HIGH findings (F-5, F-9) point to section numbers that have never existed in the target files, as opposed to the off-by-one pattern above:

- `extension-points.md` references `configuration-reference.md` S18.6-S18.8 -- that file only has S1-S9 -- F-5
- `penalty-system.md` references `lp-formulation.md` S5.0 and S5.8 -- those subsections do not exist; cost taxonomy is S1 and penalties are S9 -- F-9

These suggest the references were written speculatively from memory or copied from an earlier draft without verifying the target file structure.

### Pattern 3: Asymmetric Bidirectional References

Six MEDIUM findings (F-2, F-3, F-12, F-13, F-14, F-15) represent one-directional links where the reverse direction is missing. The math-to-implementation direction is consistently missing: `cut-management.md` links nowhere toward `cut-management-impl.md` (F-13), `lp-formulation.md` links nowhere toward `internal-structures.md` (F-15), and `training-loop.md` links nowhere toward `synchronization.md` (F-12). The pattern suggests that math specs were written before their implementation counterparts were created and cross-references were never backfilled.

### Pattern 4: Glossary Lags Behind Spec Evolution

Nine MEDIUM glossary findings (F-19 through F-27) reveal that the glossary was last updated before several key specs were added or matured. The four most impactful omissions are:

- "Epigraph variable" (F-19): used extensively in LP formulation and notation conventions
- "EAVaR" (F-24): named acronym for Cobre's specific risk measure implementation
- "Block" in the intra-stage time period sense (F-25): appears throughout LP, system elements, and equipment formulation specs
- "Outer approximation" (F-27): fundamental SDDP concept paired with cuts

Glossary coverage by category: Stochastic Modeling 50%, Risk Measures 60%, SDDP Algorithm 82%. All other categories are at 94-100%.

---

## Methodology Insights

### What Worked Well

- **Section-number reference table format** (file, line, ref text, target section, heading, PASS/FAIL) proved effective for catching mismatches at scale. Ticket 011 audited 398 section references using this approach across 37 files.
- **Bidirectional pair checks** revealed the asymmetric reference pattern (Pattern 3) that would have been invisible to a unidirectional audit. 15 pairs were checked across tickets 010 and 011.
- **Root cause grouping** at the end of ticket 011 connected F-6, F-7, F-8, and F-11 as a single renumbering event rather than four independent mistakes. This is the most actionable insight for Epic 06 remediation.
- **Semantic sampling at 3 links per file** (54 math, 74 architecture/HPC/data) found zero failures outside the identified mismatches, confirming that the structural integrity established in Epic 01 is holding at the semantic level.
- **Formula-by-formula verification** in ticket 012 against formal spec counterparts cleared all 19 formulas without contradiction, providing high confidence that the algorithm reference layer is mathematically sound.

### What Could Be Improved

- The ticket background for ticket 013 stated 78 glossary terms in 9 categories; the actual glossary has 72 terms in 10 categories. Acceptance criteria that rely on counts from earlier-epic estimates without re-reading the file cause scope uncertainty. Future tickets should read the target file before writing acceptance criteria (consistent with the recommendation from Epic 02 learnings).
- Ticket 010 flagged F-4 (penalty-system.md section mismatch) as informational/out-of-scope, then ticket 011 had to re-examine it as F-9. Cleaner handoff: when a cross-ticket dependency is identified, explicitly assign it to the downstream ticket's acceptance criteria rather than leaving it as an informal note.

---

## Impact on Remaining Epics

### Epic 04 (LaTeX Rendering)

- Epic 03 found zero formula contradictions across the spec corpus. The 19 formula checks in ticket 012 provide a verified baseline: if a formula renders incorrectly in LaTeX output, the source is a rendering bug, not an underlying error in the formula content.
- The notation inconsistency in `benders.md` (F-16, abstract matrix vs. direct-dual convention) may surface as a rendering question: the page uses $E_{t+1}^\top \pi^*$ notation while the spec uses $\beta^v_h = \pi^{wb}_h$. Epic 04 should be aware that this is an intentional notation difference, not a typo.

### Epic 05 (Cross-Reference Index)

- The 7 HIGH findings (wrong section numbers) must be resolved before or during index construction. Building an index from F-1, F-5, F-6, F-8, F-9, F-11 entries would propagate the wrong section numbers into the index.
- The 6 asymmetric reference findings (F-2, F-3, F-12, F-13, F-14, F-15) indicate pairs of specs that should appear together in the bidirectional index but currently link in only one direction. The index should add bidirectional entries for all 6 pairs even if the source files are not yet fixed.
- The 27 total findings provide a precise list of files that need index entries revised or added. See the full inventory table below.

### Epic 06 (Remediation)

- The 7 HIGH findings are all mechanical fixes (change a section number or label). Each fix is contained to a single line in a single file. None require structural changes to the spec content.
- The solver-abstraction.md renumbering (Pattern 1) is the highest-priority cluster: fixing S10 and S11 references in `design-principles.md`, `extension-points.md`, and `solver-abstraction.md` itself resolves 4 of the 7 HIGH findings.
- The 9 glossary additions (F-19 through F-27) are all self-contained: the recommended definition text is provided in ticket-013-audit-report.md for each finding.
- The 6 asymmetric reference additions are also self-contained: ticket-011 provides the exact cross-reference text to add to each file.
- The algorithm reference page updates (F-16, F-17, F-18) each require adding a clarifying note or a single "Further reading" entry -- no content changes.

---

## Full Finding Inventory

| ID   | Severity | Source File                                                 | Description                                                                                | Epic 06 Action                                |
| ---- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| F-1  | HIGH     | `src/specs/math/sddp-algorithm.md` line 164                 | References Equipment Formulations S3 for GNL thermals; correct section is S1.2             | Change `S3` to `S1.2` in anchor text          |
| F-2  | MEDIUM   | `src/specs/math/equipment-formulations.md`                  | Missing reverse link to `sddp-algorithm.md` in cross-references                            | Add link to `sddp-algorithm.md`               |
| F-3  | MEDIUM   | `src/specs/math/cut-management.md`                          | Missing reverse link to `block-formulations.md` in cross-references                        | Add link to `block-formulations.md`           |
| F-4  | HIGH     | `src/specs/data-model/penalty-system.md` line 339           | Pre-identified in T010, confirmed in T011 as F-9 (duplicate entry, see F-9)                | See F-9                                       |
| F-5  | HIGH     | `src/specs/architecture/extension-points.md` line 267       | References non-existent `configuration-reference.md` S18.6-S18.8; correct is S5, S6.2-S6.3 | Update section references                     |
| F-6  | HIGH     | `src/specs/architecture/extension-points.md` lines 228, 268 | References Solver Abstraction S2 for compile-time solver selection; correct is S10         | Change `S2` to `S10` (2 occurrences)          |
| F-7  | HIGH     | `src/specs/architecture/solver-abstraction.md` line 388     | Footer mislabels S8 as "stage transitions" and S11 as "dual-solver validation"             | Correct label text                            |
| F-8  | HIGH     | `src/specs/architecture/solver-abstraction.md` line 190     | Self-reference `S10` for LP rebuild strategy; correct section is S11                       | Change `S10` to `S11`                         |
| F-9  | HIGH     | `src/specs/data-model/penalty-system.md` line 339           | References non-existent LP Formulation S5.0 and S5.8; correct is S1 and S9                 | Update section references                     |
| F-10 | LOW      | `src/specs/deferred.md` lines 70, 167, 220, 814             | Legacy "DATA_MODEL S3.x.x" references from pre-migration numbering                         | Remove or update to current spec paths        |
| F-11 | HIGH     | `src/specs/overview/design-principles.md` line 139          | References Solver Abstraction S9 for compile-time selection; correct is S10                | Change `S9` to `S10`                          |
| F-12 | MEDIUM   | `src/specs/architecture/training-loop.md`                   | Missing link to `synchronization.md` for barrier semantics                                 | Add link to `synchronization.md`              |
| F-13 | MEDIUM   | `src/specs/math/cut-management.md`                          | Missing link to `cut-management-impl.md`                                                   | Add link to `cut-management-impl.md`          |
| F-14 | MEDIUM   | `src/specs/configuration/configuration-reference.md`        | Missing reverse link to `solver-abstraction.md`                                            | Add link to `solver-abstraction.md`           |
| F-15 | MEDIUM   | Both `internal-structures.md` and `lp-formulation.md`       | Neither file references the other despite direct dependency                                | Add bidirectional links to both files         |
| F-16 | MEDIUM   | `src/algorithms/benders.md` line 35                         | Uses abstract matrix notation for cut slope vs. direct-dual convention in spec             | Add clarifying note on Cobre's LP formulation |
| F-17 | MEDIUM   | `src/algorithms/forward-backward.md`                        | Missing link to `solver-workspaces.md` in "Related topics"                                 | Add link to `solver-workspaces.md`            |
| F-18 | MEDIUM   | `src/algorithms/cvar.md`                                    | Missing link to `cut-management.md` in "Further reading"                                   | Add link to `cut-management.md`               |
| F-19 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Epigraph variable"                                                          | Add definition (see T013 report)              |
| F-20 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Relatively complete recourse"                                               | Add definition (see T013 report)              |
| F-21 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Yule-Walker equations"                                                      | Add definition (see T013 report)              |
| F-22 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Innovation" (stochastic modeling)                                           | Add definition (see T013 report)              |
| F-23 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Discount factor"                                                            | Add definition (see T013 report)              |
| F-24 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "EAVaR"                                                                      | Add definition (see T013 report)              |
| F-25 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Block" (intra-stage time period)                                            | Add definition (see T013 report)              |
| F-26 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Coherent risk measure"                                                      | Add definition (see T013 report)              |
| F-27 | MEDIUM   | `src/reference/glossary.md`                                 | Missing term: "Outer approximation"                                                        | Add definition (see T013 report)              |

Note: F-4 in ticket 010 is the same finding as F-9 in ticket 011. The table above lists it once as F-9. The finding count of 27 unique findings (F-1 through F-27, minus the F-4/F-9 duplication) is 26 unique remediations.
