# ticket-014 Configure mdbook-katex and Verify High-Density Equation Pages

## Context

### Background

The cobre-docs mdBook contains 60 files with inline LaTeX math (`$...$`) and 35 files with display equations (`$$...$$`), totaling approximately 481 display-equation delimiters across the specs, algorithm reference, and overview sections. **The `book.toml` currently has no math rendering configured** -- no preprocessor, no MathJax injection, no custom theme with math support. As a result, all mathematical content renders as raw LaTeX text on the deployed site at `https://cobre-rs.github.io/cobre-docs/`, making the specifications unreadable for their primary audience.

Epic 03 confirmed that all 403+ display equations are mathematically sound (zero formula contradictions found across 19 formulas and 8 factual claims). If an equation fails to render after configuring the preprocessor, the root cause is a renderer compatibility issue, not an authoring error.

### Relation to Epic

This is the first ticket in Epic 04 (LaTeX Equation Rendering). It performs the foundational work: installing `mdbook-katex`, configuring `book.toml`, scanning for and fixing incompatible LaTeX patterns, building locally, and verifying the 9 highest-density pages. Ticket-015 then covers the remaining 26 pages with display math and the 25 pages with inline-only math.

### Current State

- **`book.toml`** (`/home/rogerio/git/cobre-docs/book.toml`): No `[preprocessor.katex]` section. Contains `[output.html]` with `additional-css = ["theme/css/custom.css"]`, coal theme as default, and search enabled.
- **`custom.css`** (`/home/rogerio/git/cobre-docs/theme/css/custom.css`): 282 lines of custom dark-theme styling. No math-related CSS. Uses CSS variables for colors (e.g., `--body: #C8C6C2`, `--bright: #E8E6E3`). KaTeX will need `color: inherit` to match the theme.
- **CI workflow** (`/home/rogerio/git/cobre-docs/.github/workflows/ci.yml`): Installs mdbook via `peaceiris/actions-mdbook@v2`, runs `mdbook build` and `mdbook test`. Does NOT install `mdbook-katex`.
- **Deploy workflow** (`/home/rogerio/git/cobre-docs/.github/workflows/deploy.yml`): Installs mdbook via `peaceiris/actions-mdbook@v2`, runs `mdbook build`, uploads to GitHub Pages. Does NOT install `mdbook-katex`.
- **`mdbook-katex`**: Not installed locally. `cargo` (v1.89.0) and `mdbook` (v0.5.2) are available.
- **LaTeX environments used**: Only `\begin{pmatrix}` (3 instances in `par-inflow-model.md`). No `\begin{aligned}`, `\begin{cases}`, `\begin{array}`, or `\begin{matrix}`. All supported by KaTeX.
- **LaTeX commands used**: `\mathbb`, `\mathcal`, `\boldsymbol`, `\operatorname`, `\text`, `\underset`, `\underbrace`, `\overbrace` -- all supported by KaTeX. No `\backslash` (the one unsupported command flagged in the epic overview). No custom macros (`\DeclareMathOperator`, `\newcommand`).
- **Escaped dollar signs**: 37 occurrences of `\$` in prose (e.g., `\$100/MWh` in cost tables). The preprocessor must not interpret these as math delimiters.

## Specification

### Requirements

1. **Install `mdbook-katex`** via `cargo install mdbook-katex`
2. **Configure `book.toml`** with `[preprocessor.katex]` section, including `after = ["links"]` and `throw-on-error = true` (to surface unsupported commands at build time)
3. **Add KaTeX dark-theme CSS** to `theme/css/custom.css` so that rendered math inherits the theme text color instead of defaulting to black
4. **Update both CI workflows** (`.github/workflows/ci.yml` and `.github/workflows/deploy.yml`) to install `mdbook-katex` before building
5. **Build locally** with `mdbook build` and verify zero build errors from the KaTeX preprocessor
6. **Visually verify** the 9 highest-density pages by opening the built HTML and confirming equations render as typeset mathematics

### Inputs

- `book.toml` at `/home/rogerio/git/cobre-docs/book.toml`
- `custom.css` at `/home/rogerio/git/cobre-docs/theme/css/custom.css`
- CI config at `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml`
- Deploy config at `/home/rogerio/git/cobre-docs/.github/workflows/deploy.yml`
- 9 priority spec pages (listed in Acceptance Criteria)

### Outputs/Behavior

- `mdbook build` succeeds with zero KaTeX errors
- All `$$` blocks in the 9 priority pages render as typeset math in the generated HTML (no raw LaTeX visible)
- All `$...$` inline math in the 9 priority pages renders as typeset math
- Escaped dollar signs (`\$100/MWh`) render as literal `$` characters, not as math delimiters
- KaTeX-rendered math is legible on the coal (dark) theme

### Error Handling

- If `mdbook-katex` reports errors for specific LaTeX commands during build: fix the LaTeX in the source `.md` files to use KaTeX-compatible alternatives. Document each fix.
- If `mdbook-katex` cannot handle escaped `\$` correctly (treats them as math delimiters): evaluate the `no-inline` option or switch to MathJax fallback. Document the decision with rationale.
- If `cargo install mdbook-katex` fails: check for Rust toolchain version requirements, try `cargo install mdbook-katex --locked`. The current cargo 1.89.0 should be sufficient.

## Acceptance Criteria

- [ ] Given the current `book.toml` has no math preprocessor, when `[preprocessor.katex]` is added with `after = ["links"]` and `throw-on-error = true`, then `mdbook build` completes with exit code 0 and no KaTeX error messages in stderr
- [ ] Given the 9 priority pages below, when the built HTML is opened in a browser, then every `$$` block displays as typeset mathematics (not raw LaTeX text):
  1. `specs/math/sddp-algorithm.md` (16 display-equation delimiters)
  2. `specs/math/lp-formulation.md` (56 display-equation delimiters)
  3. `specs/math/risk-measures.md` (29 display-equation delimiters)
  4. `specs/math/par-inflow-model.md` (30 display-equation delimiters, includes `\begin{pmatrix}`)
  5. `specs/math/upper-bound-evaluation.md` (36 display-equation delimiters)
  6. `specs/math/cut-management.md` (21 display-equation delimiters)
  7. `specs/math/hydro-production-models.md` (38 display-equation delimiters)
  8. `specs/architecture/training-loop.md` (4 display-equation delimiters + inline math)
  9. `specs/overview/notation-conventions.md` (27 display-equation delimiters, defines all symbols)
- [ ] Given `lp-formulation.md` contains 18 escaped `\$` in cost tables (e.g., `\$100/MWh`), when the page is rendered, then those appear as literal `$` characters and are not parsed as math delimiters
- [ ] Given the coal dark theme with `--body: #C8C6C2`, when KaTeX math is rendered, then the math text color is legible against the dark background (not black-on-dark)
- [ ] Given `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`, when `mdbook-katex` installation steps are added, then the workflows can build the book with the KaTeX preprocessor enabled
- [ ] Given `throw-on-error = true` in `book.toml`, when any unsupported LaTeX command exists in a source file, then `mdbook build` fails with an error message identifying the file and the unsupported command

## Implementation Guide

### Suggested Approach

**Step 1: Install mdbook-katex locally**

```bash
cargo install mdbook-katex
```

Verify installation with `mdbook-katex --version`.

**Step 2: Configure book.toml**

Add the following section to `/home/rogerio/git/cobre-docs/book.toml` after the `[build]` section and before `[output.html]`:

```toml
[preprocessor.katex]
after = ["links"]
throw-on-error = true
```

The `after = ["links"]` ensures KaTeX runs after mdBook's link preprocessor resolves `{{#include}}` directives. The `throw-on-error = true` makes the build fail on unsupported LaTeX, providing build-time error detection.

**Step 3: Add KaTeX dark-theme CSS**

Append to `/home/rogerio/git/cobre-docs/theme/css/custom.css`:

```css
/* --- KaTeX math rendering (dark theme compatibility) --------------------- */

.katex {
  color: inherit;
  font-size: 1.1em;
}

.katex-display {
  color: inherit;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5em 0;
}
```

The `color: inherit` ensures math text uses the theme's body color (`--body: #C8C6C2`) rather than KaTeX's default black. The `overflow-x: auto` prevents wide equations from breaking the layout. The `font-size: 1.1em` makes math slightly larger than body text for readability (standard convention).

**Step 4: Build locally and check for errors**

```bash
cd /home/rogerio/git/cobre-docs
mdbook build 2>&1 | tee build-output.log
```

If `throw-on-error = true` catches unsupported commands, the build will fail with error messages identifying the file and command. Fix each one in the source markdown.

**Step 5: Verify the 9 priority pages**

```bash
mdbook serve --open
```

Navigate to each of the 9 pages and visually confirm:

- Display equations render as typeset math
- Inline math renders correctly
- Escaped `\$` renders as literal dollar sign
- Math is legible on the dark theme

**Step 6: Update CI workflows**

For both `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`, add a step to install `mdbook-katex` after the mdBook installation step:

```yaml
- name: Install mdbook-katex
  run: cargo install mdbook-katex --locked
```

Note: The `peaceiris/actions-mdbook@v2` action only installs mdbook itself, not preprocessors. The `cargo install` step requires Rust to be available -- add `dtolnay/rust-toolchain@stable` before the install step if the runner does not have Rust pre-installed. Ubuntu runners typically do NOT have Rust pre-installed.

Alternative (faster, avoids Rust compilation on CI): Use a pre-built binary release from `https://github.com/lzanini/mdbook-katex/releases`. Download and place in PATH:

```yaml
- name: Install mdbook-katex
  run: |
    curl -sSL https://github.com/lzanini/mdbook-katex/releases/latest/download/mdbook-katex-x86_64-unknown-linux-gnu.tar.gz | tar xz
    chmod +x mdbook-katex
    sudo mv mdbook-katex /usr/local/bin/
```

Choose whichever approach is more reliable. The binary download is much faster (~5 seconds vs ~3 minutes for `cargo install`) but depends on the release artifact naming convention being stable.

### Key Files to Modify

| File                                                        | Change                             |
| ----------------------------------------------------------- | ---------------------------------- |
| `/home/rogerio/git/cobre-docs/book.toml`                    | Add `[preprocessor.katex]` section |
| `/home/rogerio/git/cobre-docs/theme/css/custom.css`         | Add KaTeX dark-theme CSS block     |
| `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml`     | Add mdbook-katex installation step |
| `/home/rogerio/git/cobre-docs/.github/workflows/deploy.yml` | Add mdbook-katex installation step |

### Patterns to Follow

- The `book.toml` uses standard mdBook TOML format. Follow the existing section ordering.
- The `custom.css` uses a comment-banner convention for section headers (`/* --- Section Name --- */`). Follow this pattern for the new KaTeX section.
- The CI workflows use the `peaceiris/actions-mdbook@v2` action pattern. The new step should be inserted immediately after that action.

### Pitfalls to Avoid

- **Do not set `no-inline = true`**: The specs use inline math (`$...$`) extensively (60 files). Disabling inline math would break more than it fixes.
- **Do not use MathJax unless KaTeX fails**: KaTeX renders at build time (static HTML), which is faster and works offline. MathJax requires client-side JavaScript and cannot catch errors at build time. Only fall back to MathJax if KaTeX cannot handle the LaTeX patterns used.
- **Watch for `\$` misinterpretation**: The `lp-formulation.md` file has 18 escaped dollar signs in cost tables. If KaTeX strips the backslash and creates phantom math delimiters, this will cause rendering errors. Test this file specifically.
- **Do not "fix" the F-16 notation difference**: The learnings from Epic 03 explicitly note that `benders.md` uses matrix notation ($E_{t+1}^\top \pi^*$) intentionally different from the formal spec's direct-dual convention. This is a notation choice, not an error.
- **CI binary download URL**: The exact URL for mdbook-katex releases may change between versions. Pin to a specific version or use `latest` with caution. Verify the URL works before committing the workflow change.

## Testing Requirements

### Build Verification (Primary)

- Run `mdbook build` with `throw-on-error = true` and verify exit code 0
- Capture and review stderr for any KaTeX warnings even if the build succeeds
- Count the number of `.katex` elements in the generated HTML for `lp-formulation.html` (should be >0, confirming KaTeX actually processed the file)

### Visual Spot-Check (9 Priority Pages)

For each of the 9 priority pages, open the generated HTML and verify:

1. At least one display equation is visible as typeset math
2. No raw `$$` delimiters are visible in the rendered page
3. Inline math (e.g., `$V_t(x)$`) renders as a formatted symbol, not as raw text
4. Escaped `\$` in prose text renders as a literal `$` character

### Dark Theme Verification

- Open `lp-formulation.html` in the coal theme
- Verify math text is legible (should inherit `--body: #C8C6C2`, not appear as black text)
- Verify display equations do not overflow the content area

### CI Workflow Validation

- Verify the updated workflow YAML is valid syntax
- If possible, run the CI workflow on a branch to confirm it builds successfully with mdbook-katex

## Dependencies

- **Blocked By**: None -- this ticket should be prioritized early (prerequisite for visual verification of all other epics)
- **Blocks**: ticket-015 (remaining pages verification and deployment)

## Effort Estimate

**Points**: 3
**Confidence**: High (codebase inspection shows no `\backslash`, no custom macros, no unsupported environments -- the LaTeX is standard and KaTeX-compatible. The main work is configuration, CI updates, and visual verification of 9 dense pages.)
