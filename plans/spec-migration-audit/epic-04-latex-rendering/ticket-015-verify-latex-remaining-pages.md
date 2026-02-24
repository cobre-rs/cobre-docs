# ticket-015 Verify LaTeX Rendering for Remaining Pages and Deploy

## Context

### Background

Ticket-014 configured `mdbook-katex` as the math preprocessor, added dark-theme CSS for KaTeX, updated the CI/deploy workflows, and verified the 9 highest-density equation pages. This ticket completes the verification by covering all remaining pages with LaTeX content (26 pages with display math + 25 pages with inline-only math = 51 remaining pages out of 60 total), fixing any KaTeX-incompatible syntax discovered, and ensuring the deployed site at `https://cobre-rs.github.io/cobre-docs/` renders all mathematics correctly.

The codebase inspection during ticket-014 refinement found: no `\backslash` usage, no custom macros, no unsupported environments, and only standard KaTeX-compatible commands (`\mathbb`, `\mathcal`, `\boldsymbol`, `\operatorname`, `\text`, `\underset`, `\underbrace`, `\begin{pmatrix}`). The risk of widespread incompatibility is low. The primary work is systematic verification and fixing any edge cases that `throw-on-error = true` surfaced during ticket-014.

### Relation to Epic

This is the second and final ticket in Epic 04. It completes the LaTeX rendering verification across all pages, ensuring zero raw-LaTeX occurrences on the deployed site. After this ticket, the mathematical content is fully readable, unblocking all subsequent epics (especially Epic 06 remediation, which requires visually inspecting corrected cross-references in mathematical context).

### Current State

After ticket-014 completion:

- `book.toml` has `[preprocessor.katex]` configured with `throw-on-error = true`
- `custom.css` has KaTeX dark-theme CSS (color inheritance, overflow handling)
- CI and deploy workflows install `mdbook-katex`
- `mdbook build` succeeds locally with zero errors
- 9 priority pages verified: `sddp-algorithm.md`, `lp-formulation.md`, `risk-measures.md`, `par-inflow-model.md`, `upper-bound-evaluation.md`, `cut-management.md`, `hydro-production-models.md`, `training-loop.md`, `notation-conventions.md`

**Remaining pages with display math (`$$`) not yet verified** (26 pages):

Spec pages (14):

1. `specs/math/block-formulations.md` (10 `$$` delimiters)
2. `specs/math/discount-rate.md` (16 `$$` delimiters)
3. `specs/math/infinite-horizon.md` (14 `$$` delimiters)
4. `specs/math/inflow-nonnegativity.md` (27 `$$` delimiters)
5. `specs/math/stopping-rules.md` (18 `$$` delimiters)
6. `specs/math/equipment-formulations.md` (28 `$$` delimiters)
7. `specs/math/system-elements.md` (22 `$$` delimiters)
8. `specs/architecture/scenario-generation.md` (8 `$$` delimiters)
9. `specs/architecture/convergence-monitoring.md` (4 `$$` delimiters)
10. `specs/data-model/internal-structures.md` (1 `$$` delimiter)
11. `specs/data-model/penalty-system.md` (1 `$$` delimiter)
12. `specs/configuration/configuration-reference.md` (1 `$$` delimiter)
13. `specs/deferred.md` (28 `$$` delimiters -- highest risk for edge cases due to diverse formula topics)
14. `specs/overview/production-scale-reference.md` (4 `$$` delimiters)

Algorithm reference pages (12): 15. `algorithms/sddp-theory.md` (2 `$$`) 16. `algorithms/benders.md` (6 `$$`) 17. `algorithms/forward-backward.md` (0 `$$`, inline only) 18. `algorithms/convergence.md` (8 `$$`) 19. `algorithms/stochastic-modeling.md` (2 `$$`) 20. `algorithms/par-model.md` (4 `$$`) 21. `algorithms/spatial-correlation.md` (2 `$$`) 22. `algorithms/scenario-generation.md` (2 `$$`) 23. `algorithms/cut-management.md` (2 `$$`) 24. `algorithms/single-multi-cut.md` (6 `$$`) 25. `algorithms/cut-selection.md` (2 `$$`) 26. `algorithms/risk-measures.md` (2 `$$`) 27. `algorithms/cvar.md` (4 `$$`)

**Remaining pages with inline math only** (25 pages -- files that contain `$...$` but no `$$`):

These include HPC specs (`work-distribution.md`, `synchronization.md`, `communication-patterns.md`, `shared-memory-aggregation.md`, `memory-architecture.md`, `hybrid-parallelism.md`, `checkpointing.md`, `slurm-deployment.md`), architecture specs (`solver-abstraction.md`, `solver-workspaces.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `cut-management-impl.md`, `simulation-architecture.md`, `validation-architecture.md`, `extension-points.md`, `cli-and-lifecycle.md`), data model specs (`input-directory-structure.md`, `input-system-entities.md`, `input-scenarios.md`, `input-constraints.md`, `input-hydro-extensions.md`, `output-schemas.md`, `output-infrastructure.md`), and crate pages (`sddp.md`, `solver.md`).

## Specification

### Requirements

1. **Verify all 26 remaining pages with display math** by opening each generated HTML page and confirming equations render as typeset mathematics
2. **Spot-check 5 representative pages with inline-only math** (from HPC, architecture, and data-model sections) to confirm inline `$...$` renders correctly
3. **Fix any KaTeX-incompatible LaTeX** found during verification -- apply fixes using KaTeX-compatible alternatives and document each change
4. **Verify `deferred.md` with extra scrutiny** -- its 28 display equations span diverse topics (battery SOC, FPHA enhancements, multi-cut formulations) and may use less common LaTeX patterns
5. **Verify escaped `\$` rendering** on `system-elements.md` (7 escaped `\$`) and `equipment-formulations.md` (also uses `\$`) to confirm literal dollar signs display correctly alongside math
6. **Run a final `mdbook build`** confirming zero errors after all fixes
7. **Do NOT push to main** in this ticket -- pushing to deploy is a separate action that the user will perform after reviewing the changes. Instead, confirm the local build is ready for deployment.

### Inputs

- All 51 remaining pages listed in Current State
- The `book.toml` configuration from ticket-014
- The `custom.css` KaTeX styles from ticket-014
- The learnings note from Epic 03: "F-16 notation difference in `benders.md` is intentional -- do not fix it during rendering passes"

### Outputs/Behavior

- All 35 pages with display math render all `$$` blocks as typeset mathematics
- All 60 pages with inline math render `$...$` as typeset math symbols
- All escaped `\$` in prose text render as literal `$` characters
- `mdbook build` exits with code 0 and zero KaTeX warnings
- A verification report summarizing: pages checked, issues found, fixes applied, and pages with no issues

### Error Handling

- If a specific LaTeX command is unsupported by KaTeX: replace with the closest KaTeX-compatible equivalent. Common substitutions:
  - `\backslash` -> `\setminus` (not expected based on codebase scan, but documented as fallback)
  - `\bold{}` -> `\boldsymbol{}` or `\mathbf{}` (already using `\boldsymbol` which is supported)
- If a display equation overflows the content width on narrow viewports: the `overflow-x: auto` from ticket-014's CSS handles this. No source change needed.
- If `deferred.md` has LaTeX that KaTeX cannot handle and rewriting is non-trivial: document the specific formula, mark it as a known limitation, and flag for user decision (rewrite vs. MathJax fallback).

## Acceptance Criteria

- [ ] Given the 14 remaining spec pages with display math, when each generated HTML page is opened, then every `$$` block displays as typeset mathematics (not raw LaTeX text)
- [ ] Given the 13 algorithm reference pages (12 with display math + `forward-backward.md` with inline only), when each generated HTML page is opened, then all math renders correctly
- [ ] Given `deferred.md` with 28 display equations across diverse topics (battery SOC, wind/solar curtailment, FPHA enhancements, multi-cut), when the generated HTML is opened, then all 28 display equations render as typeset math
- [ ] Given 5 representative inline-only pages (`specs/hpc/work-distribution.md`, `specs/architecture/solver-abstraction.md`, `specs/data-model/input-system-entities.md`, `specs/hpc/communication-patterns.md`, `crates/sddp.md`), when each generated HTML page is opened, then all `$...$` inline math renders as typeset math symbols
- [ ] Given `system-elements.md` and `equipment-formulations.md` contain escaped `\$` in prose alongside math, when the pages are rendered, then escaped `\$` displays as literal `$` and adjacent math renders correctly
- [ ] Given the `benders.md` page uses the intentional notation $E_{t+1}^\top \pi^*$ (per Epic 03 F-16), when the page renders, then this notation displays correctly and has NOT been modified
- [ ] Given all fixes are applied, when `mdbook build` is run, then it exits with code 0 and produces zero KaTeX errors or warnings
- [ ] Given the verification is complete, when a summary report is produced, then it lists: total pages verified, total display equations verified, total fixes applied (if any), and confirms readiness for deployment

## Implementation Guide

### Suggested Approach

**Step 1: Systematic page-by-page verification of display-math pages**

Open the locally built book (from ticket-014's `mdbook build` output in `/home/rogerio/git/cobre-docs/book/`) and navigate to each of the 26 remaining display-math pages. For each page:

1. Scroll through the entire page
2. Confirm every display equation block shows typeset math (rendered by KaTeX into `<span class="katex-display">` elements)
3. Note any raw `$$` or `\` commands visible as plain text -- these indicate rendering failures
4. Check that inline math within the same page also renders

Group by section for efficient navigation:

- **Math specs** (7 remaining): `block-formulations`, `discount-rate`, `infinite-horizon`, `inflow-nonnegativity`, `stopping-rules`, `equipment-formulations`, `system-elements`
- **Architecture specs** (2): `scenario-generation`, `convergence-monitoring`
- **Data model / config / deferred** (3): `internal-structures`, `penalty-system`, `configuration-reference`, plus the critical `deferred.md`
- **Overview** (1): `production-scale-reference`
- **Algorithm reference** (13 pages): all files in `src/algorithms/`

**Step 2: Verify deferred.md with extra attention**

`deferred.md` has 28 display equations spread across 21 deferred features. These formulas cover:

- Battery energy storage (SOC balance equations)
- Wind/solar curtailment
- FPHA linearization enhancements
- Multi-cut formulations
- Network flow constraints

Read through the generated HTML carefully. If any formula uses a LaTeX command not seen in the other spec pages, it may need a KaTeX-compatible rewrite.

**Step 3: Spot-check inline-only pages**

Open 5 representative pages from different sections:

1. `specs/hpc/work-distribution.md` -- uses `\text{}` in inline math
2. `specs/architecture/solver-abstraction.md` -- uses mathematical symbols in architecture context
3. `specs/data-model/input-system-entities.md` -- uses inline math for variable names
4. `specs/hpc/communication-patterns.md` -- uses `\text{}` for MPI operation names
5. `crates/sddp.md` -- crate doc page with inline math references

For each, confirm that inline `$...$` renders and that non-math content is unaffected.

**Step 4: Fix any issues found**

If any LaTeX command fails:

1. Identify the unsupported command from the build error or visual inspection
2. Find the KaTeX-compatible alternative from [KaTeX supported functions](https://katex.org/docs/supported)
3. Edit the source `.md` file with the fix
4. Rebuild with `mdbook build` and re-verify

**Step 5: Final build and verification report**

Run `mdbook build` one final time. Produce a brief report:

- Total pages verified: [N]
- Total display equations verified: ~481 `$$` delimiters across 35 pages
- Issues found: [list or "none"]
- Fixes applied: [list or "none"]
- Build status: SUCCESS / zero errors
- Ready for deployment: YES / NO

### Key Files to Modify

| File                                         | Change                                               |
| -------------------------------------------- | ---------------------------------------------------- |
| Any `.md` file with KaTeX-incompatible LaTeX | Replace unsupported commands with KaTeX alternatives |

No configuration files need modification (those were handled in ticket-014). The only changes in this ticket are LaTeX syntax fixes in source markdown files, if any are needed.

### Patterns to Follow

- Follow the same fix patterns established in ticket-014 (if any fixes were needed there)
- When replacing LaTeX commands, add a brief HTML comment above the changed equation noting the original command (for traceability): `<!-- KaTeX fix: replaced \originalcmd with \newcmd -->`
- Do NOT change mathematical meaning when fixing LaTeX syntax -- only change the rendering command

### Pitfalls to Avoid

- **Do not modify `benders.md` notation**: Epic 03 F-16 confirmed that $E_{t+1}^\top \pi^*$ is an intentional notation choice, not an error. Leave it as-is.
- **Do not push to main in this ticket**: The deployment push should be done by the user after reviewing the full set of changes from tickets 014 and 015.
- **Do not confuse `\$` (escaped dollar) with `$` (math delimiter)**: Files like `system-elements.md`, `equipment-formulations.md`, `discount-rate.md`, and `lp-formulation.md` use `\$` for literal currency. Verify these render as `$`, not as math.
- **Beware of `deferred.md`'s legacy references**: Epic 03 F-10 identified 4 legacy "DATA_MODEL S3.x.x" references in `deferred.md`. These are text content issues, not LaTeX issues -- do not attempt to fix them in this ticket (they belong to Epic 06 remediation).
- **Do not add equations or mathematical content**: This ticket only verifies and fixes rendering. Content changes belong to other tickets.

## Testing Requirements

### Build Verification

- Run `mdbook build` with `throw-on-error = true` -- must exit with code 0
- Grep the generated HTML for raw `$$` that were not processed by KaTeX: any `<p>$$</p>` patterns in the output HTML indicate a rendering failure

### Systematic Visual Verification (26 display-math pages + 5 inline spot-checks)

For each verified page, confirm:

1. No raw LaTeX text visible
2. Display equations are centered and typeset
3. Inline math is rendered inline with surrounding text
4. Page layout is not broken by wide equations

### Escaped Dollar Sign Verification

On `system-elements.md`, `equipment-formulations.md`, and `discount-rate.md`:

- Confirm `\$100/MWh` type patterns render as `$100/MWh` (literal dollar sign)
- Confirm adjacent math formulas on the same page render correctly

### Regression Check

Re-verify 2 of the 9 priority pages from ticket-014 (`lp-formulation.md` and `par-inflow-model.md`) to confirm no regression from any fixes applied in this ticket.

## Dependencies

- **Blocked By**: ticket-014 (establishes the mdbook-katex configuration, CSS, and CI workflow changes)
- **Blocks**: ticket-018, ticket-019, ticket-020 (remediation tickets in Epic 06 that require a working rendered site for visual verification of fixes)

## Effort Estimate

**Points**: 2
**Confidence**: High (the codebase scan shows all LaTeX is standard KaTeX-compatible. The main work is systematic verification across 31 pages plus 5 spot-checks. No complex configuration changes needed -- those are in ticket-014. The only code changes would be LaTeX syntax fixes, which the scan suggests will be minimal or zero.)
