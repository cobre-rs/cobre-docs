# ticket-019 Fix Section-Number Errata and User-Review HIGH Findings in Spec Files

## Context

### Background

Epics 01-05 identified 7 HIGH section-number errata (F-1, F-5, F-6, F-7, F-8, F-9, F-11) where spec cross-references point to wrong or nonexistent section numbers. These are factual errors that misdirect readers to incorrect content. Additionally, the user's manual review identified 8 HIGH findings (R2-R5, R7-R9) that require corrections to spec file content. These are all edits to files under `src/specs/` and `src/crates/` — the crate doc missing links are handled separately in ticket-021.

### Relation to Epic

This ticket handles the bulk of the HIGH-severity spec file corrections. It runs after ticket-018 (notation change) because some of the same files are modified by both tickets, and the notation change must be settled first. It runs before ticket-020 (MEDIUM/LOW) and ticket-021 (crate doc links) to establish correct section references before cosmetic fixes.

### Current State

The 7 section-number errata are documented in the epic-05 accumulated learnings with exact file paths, line numbers, current text, and correct target sections. The user review findings (R2-R9) are documented in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/user-review-findings.md` with descriptions and fix guidance. The cross-reference index at `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` has an errata note (line 13) that must be updated once the 7 section-number fixes are applied.

## Specification

### Requirements

This ticket addresses 15 specific findings organized in 5 clusters:

**Cluster A: Solver-Abstraction Renumbering (F-6, F-7, F-8, F-11) — 3 files, same root cause**

The solver-abstraction.md was renumbered at some point, but references in other files were not updated. The compile-time solver selection feature is now in §10, not §2 or §9. The LP rebuild strategy is in §11, not §10.

| Finding | File                                           | Line | Current                          | Correct                                             |
| ------- | ---------------------------------------------- | ---- | -------------------------------- | --------------------------------------------------- |
| F-6     | `src/specs/architecture/extension-points.md`   | 228  | "Solver Abstraction §2"          | "Solver Abstraction §10"                            |
| F-6     | `src/specs/architecture/extension-points.md`   | 268  | "Solver Abstraction §2"          | "Solver Abstraction §10"                            |
| F-7     | `src/specs/architecture/solver-abstraction.md` | 388  | Mislabeled S8/S11 footer entries | Correct section labels per actual heading structure |
| F-8     | `src/specs/architecture/solver-abstraction.md` | 190  | "§10" for LP rebuild             | "§11"                                               |
| F-11    | `src/specs/overview/design-principles.md`      | 139  | "Solver Abstraction §9"          | "Solver Abstraction §10"                            |

**Cluster B: Phantom Section References (F-1, F-5, F-9) — 3 files**

These references point to section numbers that do not exist in the target file.

| Finding | File                                         | Line | Current                                                                                         | Correct                                                                      |
| ------- | -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| F-1     | `src/specs/math/sddp-algorithm.md`           | 164  | "Equipment Formulations §3" (§3 = Import/Export Contracts)                                      | "Equipment Formulations §1.2" (GNL thermals)                                 |
| F-5     | `src/specs/architecture/extension-points.md` | 267  | "Configuration Reference §18.6-§18.8" (nonexistent)                                             | "Configuration Reference §5, §6.2-§6.3" (policy_graph and per-stage options) |
| F-9     | `src/specs/data-model/penalty-system.md`     | 339  | "LP Formulation — Cost taxonomy (§5.0) and slack penalties (§5.8)" (§5.0 and §5.8 do not exist) | "LP Formulation — Cost taxonomy (§1) and penalty terms (§9)"                 |

**Cluster C: User Review — Legacy References and Content Corrections (R2, R3, R4, R9)**

| Finding | File                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2      | `src/specs/deferred.md`                           | Section C.5 "Non-Controllable Sources" is no longer deferred. Remove or reclassify. The NCS entity type exists in `system/non_controllable_sources.json`, the LP formulation is in `equipment-formulations.md` §6, and data model support is in `input-system-entities.md` §7. Reclassify C.5 status to IMPLEMENTED and add a note pointing to the implemented specs. Update any cross-references that describe NCS as "deferred". Update the deferred features count in any summary. |
| R3      | `src/specs/overview/design-principles.md` line 80 | Contains "01-math spec category" — a legacy subfolder name from the old powers-rs structure. Replace with "math" or "Mathematical Formulations" section name. The link `[01-math](../math/)` in the same line is correct as a relative path but the label text is wrong.                                                                                                                                                                                                              |
| R4      | `src/specs/math/lp-formulation.md`                | Search for "01-math" references (grep found none — this may have been fixed already or the reference is in a different form). Verify and fix if present.                                                                                                                                                                                                                                                                                                                              |
| R9      | `src/specs/data-model.md` line 5                  | Contains "the solver core (`cobre-core`)" — cobre-core is the data model crate, NOT the solver core. The solver crate is cobre-sddp. Fix: replace "the solver core (`cobre-core`)" with "the data model library (`cobre-core`)". Also search all other spec files for similar misidentifications.                                                                                                                                                                                     |

**Cluster D: User Review — Risk-Measures Fixes (R7, R8)**

| Finding | File                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R7      | `src/specs/math/risk-measures.md` §5  | LaTeX rendering errors causing strikethrough-like visual artifacts. The file has 28 pre-existing `<span>` warnings from Epic 04. Inspect the source around the theorem statement (lines 99-115) for: (a) accidental `~~` markdown strikethrough, (b) KaTeX `<span>` elements crossing markdown block boundaries, (c) malformed LaTeX that produces HTML artifacts. Fix the source to render cleanly.                                                                                                                                                                                                                                                                                                                               |
| R8      | `src/specs/math/risk-measures.md` §10 | Lower bound validity claims need verification. Current text says "the lower bound computed during SDDP training is NOT a valid bound for risk-averse problems" (line 234). According to the user and SDDP theory: for minimization, the backward-pass lower bound IS the one that holds in risk-neutral SDDP. For risk-averse (CVaR), it becomes a convergence indicator, not a valid bound. The UPPER bound from Monte Carlo simulation does NOT hold under risk aversion because forward costs under sampling distribution don't reflect risk-averse objective. Review the current text (lines 232-266) against these facts and fix any inaccuracies. The current text appears largely correct but the framing may be confusing. |

**Cluster E: User Review — Production Scale Reference (R5)**

| Finding | File                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R5      | `src/specs/overview/production-scale-reference.md` | Multiple issues: (1) §3.4 (line 154-156) says "A sizing calculator tool (`scripts/lp_sizing.py`) is planned... This tool does not yet exist" — but the script DOES exist at `~/git/powers/scripts/lp_sizing.py`. (2) Estimates like `N_withdrawal = 20` and `M_planes = 10` have no derivation. (3) Performance expectations in §4.2 have no robust references. Fix: Run `~/git/powers/scripts/lp_sizing.py` with its default input file. If the script runs successfully, replace fabricated estimates with script-derived values and update §3.4 to reference the existing script. If the script cannot be run (dependencies, environment), explicitly mark all performance expectations as "non-binding estimates" and remove the "this tool does not yet exist" claim by noting it exists in the powers repo. |

### Inputs/Props

- Epic-05 accumulated learnings: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/learnings/epic-05-summary.md` (lines 73-84 for exact finding details)
- User review findings: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/user-review-findings.md`
- Cross-reference index errata note: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` line 13
- The `lp_sizing.py` script: `~/git/powers/scripts/lp_sizing.py`

### Outputs/Behavior

- All 7 section-number errata resolved (correct section numbers in cross-references)
- All 8 user-review HIGH findings resolved
- Cross-reference index errata note updated or removed
- `mdbook build` passes with exit 0

### Error Handling

- **R5 script execution**: If `~/git/powers/scripts/lp_sizing.py` cannot be executed (missing Python dependencies, wrong Python version, etc.), do NOT fail the ticket. Instead: update §3.4 to note the script exists in the powers repo, mark performance expectations explicitly as estimates, and document the execution failure in the ticket completion notes.
- **R7 rendering**: If the strikethrough artifacts cannot be reproduced locally, document the investigation and note that the issue may be browser-specific or related to the deployed KaTeX version.
- **R8 math review**: If the current text is correct as-is, document the verification and make no changes (do not introduce errors by "fixing" correct content).

## Acceptance Criteria

**Cluster A (section-number errata):**

- [ ] Given `extension-points.md` line 228, when reading the solver dispatch note, then it references "Solver Abstraction §10" (not §2)
- [ ] Given `extension-points.md` line 268, when reading the cross-references, then it references "Solver Abstraction §10" (not §2)
- [ ] Given `extension-points.md` line 267, when reading the cross-references, then it references "Configuration Reference §5, §6.2-§6.3" (not §18.6-§18.8)
- [ ] Given `solver-abstraction.md` line 388, when reading the cross-references section, then the solver architecture decisions line has correct section labels matching the actual headings
- [ ] Given `solver-abstraction.md` line 190, when reading §5.1, then the LP rebuild reference points to "§11" (not §10)
- [ ] Given `design-principles.md` line 139, when reading §5.3, then it references "Solver Abstraction §10" (not §9)
- [ ] Given `sddp-algorithm.md` line 164, when reading §5 note, then it references "Equipment Formulations §1.2" (not §3)
- [ ] Given `penalty-system.md` line 339, when reading cross-references, then it references "LP Formulation — Cost taxonomy (§1) and penalty terms (§9)"

**Cluster C (legacy references and content):**

- [ ] Given `deferred.md` section C.5, when reading its status, then it is marked as IMPLEMENTED (not DEFERRED), with references to the implemented specs
- [ ] Given `design-principles.md` line 80, when reading the text, then "01-math" does not appear as a label (the link may still use `../math/` as a path)
- [ ] Given `data-model.md` line 5, when reading the section intro, then cobre-core is described as data model library (not solver core)
- [ ] Given a grep for "solver core.\*cobre-core" across all spec files, then zero matches remain

**Cluster D (risk-measures):**

- [ ] Given `risk-measures.md` §5, when rendered in the browser, then no strikethrough-like artifacts appear on the theorem text
- [ ] Given `risk-measures.md` §10, when reading the lower bound validity section, then the mathematical claims accurately reflect: (a) risk-neutral LB is valid, (b) risk-averse LB is a convergence indicator only, (c) risk-averse upper bound from Monte Carlo simulation is NOT valid

**Cluster E (production scale):**

- [ ] Given `production-scale-reference.md` §3.4, when reading the sizing calculator note, then it does NOT say "this tool does not yet exist"

**Overall:**

- [ ] Given `cross-reference-index.md` line 13, when reading the errata note, then either all 7 errata are noted as resolved OR the note is removed entirely
- [ ] Given the full cobre-docs repo, when running `mdbook build`, then the build succeeds with exit 0

## Implementation Guide

### Suggested Approach

1. **Read each target file** before editing to confirm the line numbers and current text match the finding descriptions (line numbers may have shifted if ticket-018 modified the same file)
2. **Execute Cluster A** first (mechanical section-number fixes, lowest risk)
3. **Execute Cluster B** next (phantom reference fixes, also mechanical)
4. **Execute Cluster C** (R2 requires restructuring deferred.md C.5; R3 and R9 are simple text replacements)
5. **Execute Cluster D** (R7 requires investigation; R8 requires mathematical review)
6. **Execute Cluster E** (R5 requires running external script or marking estimates)
7. **Update cross-reference index errata note** after all section-number fixes are done
8. **Run `mdbook build`** and verify exit 0

### Key Files to Modify

1. `/home/rogerio/git/cobre-docs/src/specs/architecture/extension-points.md` — F-5, F-6 (lines 228, 267, 268)
2. `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` — F-7, F-8 (lines 190, 388)
3. `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` — F-11, R3 (lines 80, 139)
4. `/home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md` — F-1 (line 164)
5. `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md` — F-9 (line 339)
6. `/home/rogerio/git/cobre-docs/src/specs/deferred.md` — R2 (section C.5, starting ~line 187)
7. `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md` — R7 (§5, lines ~99-115), R8 (§10, lines ~232-266)
8. `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` — R5 (§3.4 line ~154, §4.2 line ~173)
9. `/home/rogerio/git/cobre-docs/src/specs/data-model.md` — R9 (line 5)
10. `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` — Errata note (line 13)

### Patterns to Follow

- For section-number fixes: change only the section number in the reference text, not the link target (links point to files, not sections)
- For deferred.md R2: follow the existing pattern of other deferred features. Change "DEFERRED" to "IMPLEMENTED" and add a brief note with links to the implementing specs. Do not delete the content — it documents the feature.
- For risk-measures.md: be conservative; do not change correct mathematical content to "fix" a perceived error

### Pitfalls to Avoid

- **Line number drift**: ticket-018 modifies several of the same files (sddp-algorithm.md, risk-measures.md, lp-formulation.md). Read each file fresh before editing; do not trust line numbers from the finding descriptions if ticket-018 has already been applied.
- **R2 cross-reference cascade**: When changing C.5 from DEFERRED to IMPLEMENTED, check all files that reference "Deferred Features" to see if any specifically mention NCS as deferred. The sddp-algorithm.md cross-references section mentions "[Deferred Features](../deferred.md)" but does not specifically mention NCS.
- **R8 false positive risk**: The current risk-measures.md §10 text appears largely correct based on codebase inspection. The "Critical Warning" that the lower bound is NOT valid for risk-averse problems is the standard result from Philpott et al. (2013). Do not change this unless the mathematical claim is actually wrong. Focus on clarity, not rewrites.
- **R5 external script**: The script is in a separate repo (`~/git/powers/`). Do not commit changes to that repo. Only use its output to inform the production-scale-reference.md updates.

## Testing Requirements

### Build Verification

- Run `mdbook build` after all fixes and verify exit 0
- Run `mdbook build 2>&1 | grep -c "Rendering failed"` — must be 0

### Content Verification

- Grep for the 7 old section-number patterns to confirm they no longer appear:
  - `grep -rn "Equipment Formulations §3" src/specs/` — should return 0 hits
  - `grep -rn "§18\.6" src/specs/` — should return 0 hits
  - `grep -rn "Solver Abstraction §2" src/specs/` — should return 0 hits (except if §2 is a valid reference elsewhere)
  - `grep -rn "Solver Abstraction §9" src/specs/` — should return 0 hits
  - `grep -rn "§5\.0" src/specs/` — should return 0 hits
  - `grep -rn "§5\.8" src/specs/` — should return 0 hits
- Grep for legacy references: `grep -rn "01-math" src/specs/` — should return 0 hits
- Grep for misidentification: `grep -rn "solver core.*cobre-core" src/` — should return 0 hits

## Dependencies

- **Blocked By**: ticket-018 (notation change must complete first — it modifies overlapping files)
- **Blocks**: ticket-020 (MEDIUM/LOW fixes), ticket-021 (crate doc links)

## Effort Estimate

**Points**: 4
**Confidence**: Medium (most fixes are mechanical, but R5 requires running an external script, R7 requires LaTeX debugging, and R8 requires mathematical verification)
