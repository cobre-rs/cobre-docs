# ticket-015 Verify LaTeX Rendering for Remaining Pages and Deploy

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from ticket-014.

## Objective

After ticket-014 configures mdbook-katex and verifies the 9 high-density pages, this ticket completes coverage by verifying all remaining pages with LaTeX content, fixing any KaTeX-incompatible syntax, and pushing the configuration to deploy on GitHub Pages.

## Anticipated Scope

### Remaining Spec Pages with LaTeX

- `specs/math/block-formulations.md`
- `specs/math/discount-rate.md`
- `specs/math/infinite-horizon.md`
- `specs/math/inflow-nonnegativity.md`
- `specs/math/stopping-rules.md`
- `specs/math/equipment-formulations.md`
- `specs/math/system-elements.md`
- `specs/architecture/scenario-generation.md`
- `specs/architecture/convergence-monitoring.md`
- `specs/architecture/cut-management-impl.md`
- `specs/hpc/work-distribution.md`
- `specs/hpc/synchronization.md`
- `specs/configuration/configuration-reference.md` (1 formula)
- `specs/deferred.md` (28 formulas — highest risk for edge cases)

### Algorithm Reference Pages with Inline Equations

All 13 files in `src/algorithms/`:

- `sddp-theory.md`, `benders.md`, `forward-backward.md`, `convergence.md`, `stochastic-modeling.md`, `par-model.md`, `spatial-correlation.md`, `scenario-generation.md`, `cut-management.md`, `single-multi-cut.md`, `cut-selection.md`, `risk-measures.md`, `cvar.md`

### Key Tasks

1. **Build and inspect** all remaining pages for rendering issues
2. **Fix KaTeX-incompatible LaTeX** patterns discovered during ticket-014 (apply the same fixes across all files)
3. **Verify `deferred.md`** — 28 formulas including battery SOC equations, FPHA enhancements, and multi-cut formulations that may use less common LaTeX
4. **Update GitHub Pages workflow** (if needed) to install `mdbook-katex` in the build step
5. **Push to main** and verify equations render on the deployed site at https://cobre-rs.github.io/cobre-docs/

### Open Questions

- Are there any formulas in `deferred.md` that use environments not supported by KaTeX (e.g., `\begin{array}` with complex alignment)?
- Does the dark theme (`coal`) need CSS adjustments for KaTeX-rendered math? (KaTeX defaults to black text — may need `color: inherit` or similar)
- Should the `overview/notation-conventions.md` page (which defines all mathematical symbols) get special verification since it's the notation reference?

### Files to Modify

- Spec `.md` files — fix any KaTeX-incompatible commands (if patterns found in ticket-014)
- `.github/workflows/` — add `mdbook-katex` to CI build (if applicable)
- Possibly `theme/css/custom.css` — KaTeX dark-theme color adjustments

## Dependencies

- **Blocked By**: ticket-014 (establishes renderer configuration and identifies incompatibility patterns)
- **Blocks**: ticket-017 (final build verification)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
