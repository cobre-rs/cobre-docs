# ticket-014 Configure mdbook-katex and Verify High-Density Equation Pages

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

**CRITICAL**: The `book.toml` currently has NO math rendering configured. All 403+ display equations render as raw LaTeX text on the deployed site. This ticket configures `mdbook-katex` as the math preprocessor, verifies it builds locally, and tests the 9 highest-LaTeX-density pages.

## Anticipated Scope

### Step 1: Install and Configure mdbook-katex

Install the preprocessor:

```bash
cargo install mdbook-katex
```

Add to `book.toml`:

```toml
[preprocessor.katex]
after = ["links"]
```

### Step 2: Evaluate KaTeX Compatibility

Before building, scan the spec files for LaTeX commands known to be unsupported by KaTeX:

- `\backslash` → replace with `\setminus`
- Any other edge cases from the [KaTeX supported functions list](https://katex.org/docs/supported)

### Step 3: Build and Verify Locally

Run `mdbook build` and open the generated HTML to verify equations render on the 9 priority pages:

1. `specs/math/sddp-algorithm.md` — SDDP value function recursion, forward/backward pass equations
2. `specs/math/lp-formulation.md` — full LP block structure with all constraint forms
3. `specs/math/risk-measures.md` — CVaR definition, convex combination, dual representation
4. `specs/math/par-inflow-model.md` — PAR(p) autoregressive model equation
5. `specs/math/upper-bound-evaluation.md` — confidence interval and statistical test formulas
6. `specs/math/cut-management.md` — Benders cut generation and aggregation
7. `specs/math/hydro-production-models.md` — FPHA hyperplane equations, productivity formulas
8. `specs/architecture/training-loop.md` — discount factor equations, cut generation formulas
9. `specs/architecture/solver-workspaces.md` — basis and warm-start formulas

### Step 4: Evaluate mdbook-katex vs MathJax Fallback

If KaTeX fails on specific equations, document the failures and evaluate whether:

- (A) The LaTeX can be rewritten for KaTeX compatibility (preferred), or
- (B) MathJax should be used instead (fallback — inject via custom `theme/index.hbs`)

Record a decision with rationale.

### Key Decisions Needed

- **mdbook-katex vs MathJax**: Does KaTeX handle all the LaTeX patterns used in the 50 specs? The specs use `\mathbb`, `\text`, `\operatorname`, `\begin{aligned}`, `\begin{cases}`, `\boldsymbol`, `\underset` — all supported by KaTeX. The main risk is `\backslash` (not supported — use `\setminus`).
- **CI integration**: Should `mdbook-katex` be added to the GitHub Actions CI workflow so that equation rendering failures cause build failures?
- **`throw-on-error`**: Should `throw-on-error = true` be set in `book.toml` to catch any unsupported commands at build time?

### Open Questions

- Does the GitHub Pages workflow (`gh-pages` or equivalent) need to install `mdbook-katex` before building?
- Are there any multi-line equation environments (`\begin{array}`, `\begin{matrix}`) used in the specs?
- Does the `custom.css` need KaTeX-specific styling adjustments for the dark theme?

### Files to Modify

- `book.toml` — add `[preprocessor.katex]` section
- Possibly spec `.md` files — replace KaTeX-incompatible commands
- Possibly `.github/workflows/` — add `mdbook-katex` installation step (if CI builds the docs)

## Dependencies

- **Blocked By**: None — should be prioritized early (prerequisite for visual verification in all other epics)
- **Blocks**: ticket-015 (remaining pages), ticket-017 (remediation)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement — depends on KaTeX compatibility)
