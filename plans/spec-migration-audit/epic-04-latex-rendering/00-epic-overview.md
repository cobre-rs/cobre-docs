# Epic 04: LaTeX Equation Rendering — Configuration & Verification

## Critical Finding

**The `book.toml` has NO math rendering configured.** There is no MathJax injection, no KaTeX preprocessor, no custom HTML template with math support. All 403+ display equations (`$$`) and inline math (`$...$`) across the 50 spec files and 13 algorithm reference pages are currently rendering as **raw LaTeX text** on the deployed site. This is a blocking issue for the entire spec migration — the mathematical content is unreadable.

## Goal

1. **Configure math rendering** for the cobre-docs mdBook using `mdbook-katex` (recommended) or MathJax
2. **Verify** that all LaTeX equations render correctly after configuration
3. **Fix** any LaTeX syntax that is incompatible with the chosen renderer

## Recommended Approach: mdbook-katex

The [`mdbook-katex`](https://github.com/lzanini/mdbook-katex) preprocessor is recommended over MathJax for the following reasons:

| Criterion    | mdbook-katex (KaTeX)                              | MathJax (runtime)                         |
| ------------ | ------------------------------------------------- | ----------------------------------------- |
| Rendering    | Build-time (static HTML)                          | Client-side JavaScript                    |
| Page load    | No JS dependency — instant math display           | Delayed — equations pop in after JS loads |
| Offline      | Works without network                             | Requires CDN or bundled JS                |
| Search       | KaTeX output is in the HTML, searchable by mdBook | MathJax output is dynamic, not indexed    |
| CI-friendly  | Preprocessor runs in `mdbook build`               | Needs browser to verify rendering         |
| Installation | `cargo install mdbook-katex`                      | Custom theme/index.hbs edit               |

**Configuration** — add to `book.toml`:

```toml
[preprocessor.katex]
after = ["links"]
```

### KaTeX Limitations to Evaluate

KaTeX supports most LaTeX math commands but has a narrower command set than MathJax. Key commands used in the cobre specs that need testing:

| Command              | Used In                        | KaTeX Support            |
| -------------------- | ------------------------------ | ------------------------ |
| `\mathbb{E}`         | sddp-algorithm, risk-measures  | Yes                      |
| `\text{...}`         | lp-formulation, many specs     | Yes                      |
| `\operatorname{...}` | risk-measures (CVaR)           | Yes                      |
| `\boldsymbol{...}`   | spatial-correlation            | Yes                      |
| `\begin{aligned}`    | lp-formulation, cut-management | Yes                      |
| `\begin{cases}`      | inflow-nonnegativity           | Yes                      |
| `\underset{...}`     | risk-measures                  | Yes                      |
| `\backslash`         | —                              | **No** (use `\setminus`) |

The specs were authored in a powers-rs mdBook context that may have used MathJax. Any `\backslash` usage would need to be replaced with `\setminus` for KaTeX compatibility.

### Alternative: MathJax via custom theme

If KaTeX has compatibility issues with specific equations, the fallback is injecting MathJax via a custom `theme/index.hbs` or `additional-js`. This provides broader LaTeX support but at the cost of slower page loads and no build-time error detection.

## Tickets in This Epic

| Ticket     | Scope                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| ticket-014 | Configure mdbook-katex, build locally, verify 9 high-density pages       |
| ticket-015 | Verify remaining pages, fix any KaTeX-incompatible LaTeX, push to deploy |

## Acceptance Criteria for the Epic

- `book.toml` contains a working `[preprocessor.katex]` configuration (or equivalent MathJax setup)
- `mdbook build` succeeds with the math preprocessor enabled
- All display equations on the 9 priority pages render as typeset mathematics (not raw LaTeX)
- Zero "raw LaTeX visible" occurrences on the deployed site
- Any KaTeX-incompatible commands are replaced with compatible alternatives

## Dependencies

- **Blocked By**: None — should be executed early (it's a prerequisite for the specs being usable)
- **Blocks**: Epic 06 (any LaTeX syntax fixes)

## Note on Priority

This epic should be **prioritized ahead of Epics 01-03** if possible, because the content integrity and cross-reference audits benefit from having a working deployed site to visually inspect. The current state (no math rendering) means the deployed site is not usable for visual verification.
