# Epic 04 Learnings: LaTeX Equation Rendering

**Plan**: spec-migration-audit
**Epic**: epic-04-latex-rendering
**Completed**: 2026-02-24

---

## Patterns Established

- **mdbook-katex binary-install pattern**: Install the preprocessor from a pinned GitHub release binary rather than `cargo install` to avoid a 3-minute Rust compilation step on CI. The pattern is: `curl -sSL <release-url> | tar xz && chmod +x mdbook-katex && sudo mv mdbook-katex /usr/local/bin/`. Demonstrated in `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml` and `/home/rogerio/git/cobre-docs/.github/workflows/deploy.yml`.

- **Currency `$` scan before enabling KaTeX**: Before enabling a math preprocessor on any mdBook corpus, grep all source files for bare `$` used as a currency symbol (patterns: `$/MWh`, `$/hm³`, `$/unit`, `$/(m3/s·h)`) and escape them as `\$` preemptively. Discovered during ticket-015 when 8 KaTeX WARN messages fired from data-model table cells. Affected files: `penalty-system.md`, `output-schemas.md`, `input-directory-structure.md`, `input-system-entities.md` under `/home/rogerio/git/cobre-docs/src/specs/data-model/`.

- **KaTeX dark-theme CSS block**: Append `.katex { color: inherit; font-size: 1.1em; }` and `.katex-display { color: inherit; overflow-x: auto; overflow-y: hidden; padding: 0.5em 0; }` to the custom CSS file to prevent black math text on dark backgrounds. Established in `/home/rogerio/git/cobre-docs/theme/css/custom.css`. This is a one-time setup that applies to all future pages without per-page changes.

- **HTML element count as rendering proxy**: Because mdbook-katex renders math to HTML at build time, counting `class="katex"` and `class="katex-display"` elements in the generated HTML reliably confirms rendering success without requiring a browser. A page with N display equations must have exactly N `katex-display` spans and zero `<p>$$</p>` patterns in the output HTML.

- **`throw-on-error = true` as a build gate**: Setting `throw-on-error = true` in `[preprocessor.katex]` in `book.toml` surfaces every unsupported LaTeX command at build time, making KaTeX failures CI-visible rather than silent. This is preferred over omitting the flag and discovering rendering failures only after deployment. Established in `/home/rogerio/git/cobre-docs/book.toml`.

---

## Architectural Decisions Recorded

- **mdbook-katex v0.10.0-alpha chosen over MathJax**: Decision rationale: build-time rendering (static HTML, no JS dependency), instant math display with no page-load delay, KaTeX output is indexed by mdBook's search, and CI can catch LaTeX errors at build time. MathJax rejected because it requires client-side JS and cannot detect authoring errors during the build. The alpha designation was acceptable because the full LaTeX command set used in the corpus (no `\backslash`, no custom macros, only standard environments) is fully supported. Evidence: zero KaTeX errors across 1,348 rendered elements. Decision recorded in `/home/rogerio/git/cobre-docs/book.toml`.

- **Pinned release binary URL for CI over `cargo install`**: The CI workflows pin to `v0.10.0-alpha-binaries` release tag rather than `latest` to ensure reproducible builds. The risk of the pinned URL becoming stale is accepted as lower than the 3-minute `cargo install` overhead on each CI run. If the binary URL breaks, the fallback is `cargo install mdbook-katex --locked`. Decision visible in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`.

- **`after = ["links"]` ordering**: KaTeX preprocessor runs after mdBook's `links` preprocessor to ensure `{{#include}}` directives are resolved before math is parsed. If KaTeX ran before `links`, included file content would not have its math processed. This ordering is correct for all current and anticipated use of includes in the corpus.

---

## Files and Structures Created

- `/home/rogerio/git/cobre-docs/book.toml` -- added `[preprocessor.katex]` section with `after = ["links"]` and `throw-on-error = true`
- `/home/rogerio/git/cobre-docs/theme/css/custom.css` -- appended KaTeX dark-theme compatibility block (`.katex`, `.katex-display` selectors)
- `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml` -- added `Install mdbook-katex` step using pinned binary download
- `/home/rogerio/git/cobre-docs/.github/workflows/deploy.yml` -- added `Install mdbook-katex` step using pinned binary download
- `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-04-latex-rendering/ticket-015-verification-report.md` -- verification report covering all 35 display-math pages and 5 inline spot-checks

---

## Conventions Adopted

- **`\$` escape convention for currency in tables**: All currency unit labels in table cells (Units column, description column, typical range column) use `\$` to prevent KaTeX from interpreting the `$` as a math delimiter. This convention is now established across all four data-model files that contain cost tables. Any future data-model additions with currency columns must follow this pattern; bare `$` will cause non-fatal KaTeX warnings and may cause rendering artifacts.

- **KaTeX CSS section banner**: New CSS sections in `custom.css` use the existing banner comment convention: `/* --- Section Name ----- */`. The KaTeX block uses `/* --- KaTeX math rendering (dark theme compatibility) --------------------- */`. New CSS additions for future plugins should follow the same pattern.

- **Verification report format**: The ticket-015 report at `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-04-latex-rendering/ticket-015-verification-report.md` establishes the table format for rendering verification: page path, KaTeX element count, display count, raw `$$` count, and PASS/FAIL verdict. This format is reusable for any future rendering audit after a preprocessor change.

---

## Surprises and Deviations from Plan

- **Currency `$` false positives were not anticipated**: The epic overview and ticket-014 identified `\$` escape handling as a risk for files like `lp-formulation.md` (18 already-escaped instances). What was not anticipated was that data-model files (`penalty-system.md`, `output-schemas.md`, `input-directory-structure.md`, `input-system-entities.md`) contained bare `$` currency symbols that the corpus scan had not flagged. These files use `$` in table cells as plain text (not escaped), which the KaTeX preprocessor attempted to interpret as math delimiters, producing 8 WARN messages. All eight were resolved by escaping. The deviation is that fixes were needed in data-model files, not the math spec files where the risk was anticipated.

- **`throw-on-error = true` limitation with non-fatal WARNs**: The ticket specified using `throw-on-error = true` to surface all errors. In practice, the 8 currency-dollar false positives produced WARNs (non-fatal) rather than errors that halt the build. The `throw-on-error` flag only applies to unsupported LaTeX commands; it does not promote WARN-level rendering failures to build-stopping errors. This means a build can exit 0 with silent rendering gaps for currency-dollar patterns. Workaround: after each build, grep stderr for `mdbook_katex::render: Rendering failed` in addition to checking the exit code.

- **28 non-fatal build warnings from `risk-measures.md`**: The generated HTML for `risk-measures.md` produces 28 "unclosed HTML tag `<span>` found while exiting Strikethrough" warnings. These are false positives: mdbook's markdown parser misidentifies KaTeX-generated `<span>` tags as orphaned HTML within a non-existent strikethrough context. The file has no tilde characters and no strikethrough markup. Rendering is correct (115 KaTeX elements, 15 display equations, 0 errors). These warnings are cosmetic and pre-existing in the build output; they are not actionable.

- **`deferred.md` display equation count differs from ticket spec**: The ticket listed `deferred.md` as having 28 display-equation delimiters (14 `$$` opening + 14 `$$` closing = 14 equations). The verification report confirmed 14 display equations and 87 total KaTeX elements. The "28 `$$` delimiters" count in the ticket was correct as a raw delimiter count (opening + closing) but the actual equation count is 14. Future tickets should state display equation counts (pairs), not raw delimiter counts.

- **No LaTeX syntax fixes were needed in math spec files**: The epic overview and ticket-014 identified several potential incompatibilities (`\backslash`, custom macros). None were present. The only fixes were the currency `\$` escaping in data-model files. Zero changes were made to any math spec source file for LaTeX compatibility reasons.

---

## Recommendations for Future Epics

- **Epic 05 (Cross-Reference Index)**: The math rendering infrastructure is now complete. The 35 display-math pages are confirmed rendering correctly and are safe to include in visual cross-reference audits. When building the index, the 1,348 KaTeX elements across those pages are correctly searchable via mdBook's built-in search (KaTeX renders to static HTML, not JS-injected content).

- **Epic 06 (Remediation)**: When editing math spec files to fix cross-reference errors (F-1, F-5 through F-9, F-11), verify after each file save that `mdbook build` still exits 0 with zero `Rendering failed` warnings. Math spec files contain dense equations; a careless edit that breaks a LaTeX delimiter will produce a non-fatal warning that is easy to miss. Run `mdbook build 2>&1 | grep -c "Rendering failed"` as a post-edit sanity check.

- **Data-model file edits in Epic 06**: The four data-model files modified in this epic (`penalty-system.md`, `output-schemas.md`, `input-directory-structure.md`, `input-system-entities.md`) now use `\$` throughout their cost tables. Any new table rows added during Epic 06 remediation must follow the same `\$` convention. A bare `$` in these files will silently produce a KaTeX WARN that does not fail the build.

- **Pinned binary URL maintenance**: The CI workflows pin `mdbook-katex` to `v0.10.0-alpha-binaries`. If a newer release is required for a future LaTeX feature, update both `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` in the same commit. The binary download URL pattern is `https://github.com/lzanini/mdbook-katex/releases/download/<tag>/mdbook-katex-v<version>-x86_64-unknown-linux-gnu.tar.gz`.

- **Currency scan protocol for future doc additions**: Any new spec file that includes cost tables, penalty tables, or pricing information must be scanned for bare `$` before merging. The pattern to grep is `\$[0-9/]` (dollar sign followed by a digit or slash). Files matching this pattern need `\$` escaping in all currency occurrences before they will build cleanly with the KaTeX preprocessor.
