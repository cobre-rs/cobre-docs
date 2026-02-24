# Accumulated Learnings: Epics 01 through 06 (Complete Plan)

**Plan**: spec-migration-audit
**Through Epic**: epic-06-remediation
**Updated**: 2026-02-25

---

## Final Audit State

- All 50 spec files passed content integrity, section placement, cross-reference coherence, and LaTeX rendering checks across epics 01-05
- Zero CRITICAL findings across all 6 epics
- All 29 HIGH findings resolved: 7 section-number errata (F-1, F-5-F-9, F-11), 8 user-review findings (R2-R9 where R6 was the notation change), 14 crate doc missing-link gaps
- 19 of 32 MEDIUM findings resolved (6 asymmetric reference gaps, 3 algorithm page gaps, 9 glossary additions, R1 solver description); 12 cosmetic MEDIUM findings remain as documentation debt
- 1 of 35 LOW findings resolved (F-10 DATA_MODEL legacy refs in deferred.md); ~34 cosmetic LOW findings remain as documentation debt
- β→π notation change complete: `$\pi$` now denotes cut coefficients across all math spec files; one correct `$\beta_h^{storage}$` preserved in block-formulations.md as a production function coefficient
- Cross-reference index live at `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`
- mdbook build: exit 0, zero KaTeX rendering failures; 28 pre-existing `<span>` warnings in risk-measures.md are a toolchain issue (non-actionable)
- Total source files modified across all 6 epics: ~40 (4 data-model spec files in epics 01-05 plus 35 in epic-06)
- Total plan files (tickets, audit reports, learnings): 162 files, 29,485 insertions

---

## Patterns Established

- **6-check content integrity protocol** (frontmatter, brand terms, headings, formula count, table/code count, path resolution): reuse for any future doc migration; see `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-01-content-integrity/learnings.md`
- **4-check crate mapping protocol** (M1 section assignment, M2 SUMMARY.md, M3 ambiguity, M4 coverage gap): demonstrated in tickets 007-009; yields definitive primary/secondary crate assignments
- **Section-number reference audit table** (file, line, ref text, target section, heading, PASS/FAIL): audited 534 references across 55 files in Epic 03; the only reliable method for catching phantom section numbers
- **Bidirectional pair check**: 15 pairs checked in Epic 03, yielding 6 MEDIUM asymmetric gaps that unidirectional audits miss; always verify both directions when auditing cross-references
- **HTML element count as rendering proxy**: count `class="katex"` and `class="katex-display"` in generated HTML; zero `<p>$$</p>` confirms no unprocessed math
- **Currency `$` scan before enabling KaTeX**: grep all source files for bare `$[0-9/]` and escape as `\$`; data-model cost tables are the highest-risk location
- **Post-build grep for rendering failures**: `grep -c "Rendering failed"` on build stderr after every `mdbook build`; zero is the gate
- **Link conservation check as index integrity gate**: assert total outgoing equals total incoming before accepting a bidirectional index; catches transposition errors immediately
- **Topological reading-order by incoming-reference count (in-degree)**: zero manual curation required; lp-formulation.md (22), cut-management.md (21), sddp-algorithm.md (19) are the corpus foundations
- **Contextual substitution rule table over blind find-and-replace**: for any cross-cutting symbol rename, write per-pattern rules with explicit DO NOT CHANGE entries before executing; prevents incorrect substitution of same-symbol different-concept instances
- **Cluster findings by root cause, not by source ticket**: 4 HIGH findings (F-6, F-7, F-8, F-11) shared one root cause (solver-abstraction.md renumbering event); fixing them together in one file read eliminated repeated context-loading

---

## Architectural Decisions

- `specs/architecture/input-loading-pipeline.md` stays in architecture — primary crate: `cobre-io`
- `specs/hpc/synchronization.md` — primary is `cobre-sddp`, not `ferrompi`
- `specs/data-model/binary-formats.md`, `internal-structures.md`, `output-infrastructure.md` stay in data-model despite architectural content — see ticket-007 section 2
- Algorithm reference pages use simplified notation intentionally; notation differences from formal spec are acceptable if mathematically equivalent
- **mdbook-katex v0.10.0-alpha chosen over MathJax**: build-time rendering, no JS dependency, CI-visible errors, searchable static HTML output; see `/home/rogerio/git/cobre-docs/book.toml`
- **Pinned binary CI install for mdbook-katex**: avoids 3-minute `cargo install`; both workflow files pin to `v0.10.0-alpha-binaries` release tag; see `.github/workflows/ci.yml` and `deploy.yml`
- **Cross-reference index built from un-remediated files**: link targets are all correct; section-number description errors were documented in the index errata note and fixed in Epic 06
- **β→π notation unification**: cut coefficients and LP dual variables now share the base symbol `$\pi$`, making `$\pi^v_h = \pi^{wb}_h$` a tautology; the derivation from LP duals is self-evident without a cross-symbol explanation; see `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md` §5.4
- **Deferred feature reclassification retains formulation text**: C.5 NCS was reclassified from DEFERRED to IMPLEMENTED; the formulation and data model descriptions were preserved as reference; only the "Why Deferred" and "Prerequisites" blocks were removed; see `/home/rogerio/git/cobre-docs/src/specs/deferred.md`
- **production-scale-reference §4.2 labeled non-binding**: performance expectations annotated as "non-binding estimates pending solver benchmarking" after running `lp_sizing.py` for LP sizing; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`

---

## Key Files

- `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` — 452-line navigation index: 50-row crate table, 7 per-crate reading lists, outgoing/incoming reference tables (489+ links), global dependency ordering
- `/home/rogerio/git/cobre-docs/book.toml` — `[preprocessor.katex]` with `after = ["links"]` and `throw-on-error = true`
- `/home/rogerio/git/cobre-docs/theme/css/custom.css` — KaTeX dark-theme block (`.katex`, `.katex-display` with `color: inherit`)
- `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml` and `deploy.yml` — mdbook-katex binary install using pinned v0.10.0-alpha-binaries URL
- `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md` — canonical symbol registry; §5.4 documents the β→π derivation; §5.5 summary table updated
- `/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md` — most heavily modified by β→π (cut definition §1, dual extraction §2, aggregation §3, FPHA note, activity §6, selection §7)
- `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md` — R7 span warnings are toolchain-generated (non-actionable); R8 §10 lower bound validity text verified correct and confirmed
- `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md` — sole remaining `$\beta_h^{storage}$` instance; intentionally preserved as a hydro production function coefficient
- `/home/rogerio/git/cobre-docs/src/crates/sddp.md` — 8 Key Concepts bullets added linking to all 12 primary math specs
- `/home/rogerio/git/cobre-docs/src/specs/deferred.md` — C.5 NCS reclassified to IMPLEMENTED; F-10 DATA_MODEL legacy refs replaced with cobre-docs relative links
- `/home/rogerio/git/cobre-docs/src/reference/glossary.md` — 9 terms added: Epigraph variable, Relatively complete recourse, Yule-Walker equations, Innovation, Discount factor, EAVaR, Block (patamar), Coherent risk measure, Outer approximation
- Master 50-row crate table: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` section 5

---

## Conventions

- **Severity**: CRITICAL = information loss or mathematical incorrectness; HIGH = wrong section number, broken link, or missing required reference; MEDIUM = missing secondary reference, notation inconsistency, or named-term glossary gap; LOW = cosmetic
- **`\$` escape convention**: all currency unit labels in table cells use `\$`; bare `$` produces non-fatal KaTeX WARNs that do not fail the build
- **Glossary threshold**: absent terms are LOW if standard domain knowledge; MEDIUM if named methods, domain-specific overloads, or Cobre-specific acronyms
- **Primary vs. secondary crate**: Primary = crate implementing the spec's behavior; Secondary = crates consuming it; "(secondary)" suffix in reading lists identifies supplementary reading
- **5-component index structure**: (1) spec-to-crate mapping, (2) per-crate reading lists, (3) outgoing table, (4) incoming table, (5) dependency ordering — separates three navigation use-cases cleanly
- **β→π substitution boundary**: cut coefficient `$\pi$` shares base symbol with dual variables by design; `$\beta_h^{storage}$` in block-formulations.md is the canonical example of a non-cut `$\beta$` that must not be changed
- **Deferred feature reclassification pattern**: change status field, add forward-reference note with links to implementing specs, remove "Why Deferred" and "Prerequisites" blocks, retain formulation text

---

## Surprises and Deviations

- **Zero CRITICAL findings**: The audit plan budgeted a full ticket (ticket-018) for CRITICAL remediation. No CRITICAL findings materialized across all 5 audit epics, freeing the ticket for the highest-impact user-review item (R6, the β→π notation change).
- **R7 was a toolchain limitation, not an authoring error**: The reported strikethrough artifacts in risk-measures.md §5 had no `~~` source markers. The 28 `<span>` warnings are caused by KaTeX emitting HTML spans inside blockquote-wrapped theorem statements, which pulldown-cmark flags as unclosed tags when the block boundary is crossed. The build exits 0 and content renders correctly. Source: `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md`.
- **R8 text was mathematically correct**: Initial ticket language suggested the §10 lower bound validity claims might be inverted. Careful review confirmed the current text correctly states: risk-neutral lower bound is valid; risk-averse lower bound is a convergence indicator only; risk-averse upper bound from Monte Carlo is not valid. No mathematical claims were changed.
- **Algorithm reference pages required β→π updates beyond the planned scope**: ticket-018 listed benders.md as the only algorithm page to check. Execution revealed that cut-management.md, cut-selection.md, single-multi-cut.md, and cvar.md in `src/algorithms/` all contained cut coefficient formulas. All 5 algorithm pages were updated within ticket-018 scope.
- **lp_sizing.py ran successfully**: R5 anticipated the possibility that the script might not run due to missing dependencies. The script executed cleanly and produced concrete LP sizing figures (6,923 variables, 20,788 constraints, 128.7 MB cuts/stage at 15,000 slots). These figures replaced the "future work" placeholder in production-scale-reference.md §3.4.
- **ticket-021 ticket split was necessary**: The original ticket-019 scope (section-number errata + user-review HIGH + crate doc links) would have required editing both `src/specs/` and `src/crates/` files simultaneously. The split made each ticket's verification grep patterns unambiguous and allowed parallel execution with ticket-020.

---

## Recommendations

- **The 28 `<span>` warnings in risk-measures.md are the only open build quality issue**: If a future mdbook version treats them as errors, restructure the theorem statement blockquotes in `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md` §5 (lines ~95-115) so KaTeX display-math blocks do not straddle blockquote boundaries.
- **Re-run conservation check after graph expansion**: Adding 6 asymmetric reference gap fixes and 14 crate doc links increased the cross-reference graph edge count above the 489 baseline. A full re-run of the conservation check (outgoing total = incoming total) is recommended before the next index refresh.
- **Write acceptance criteria after reading target files**: the most consistent failure mode across all 6 epics; never use counts or section numbers from memory or prior-epic estimates.
- **SUMMARY.md position anchored to neighbor entry, not line number**: locate insertion point by searching for the target neighbor entry string; robust to prior-epic modifications.
- **Any future notation change should follow the same pattern**: inventory all occurrences first with grep, write a per-pattern rule table with explicit DO NOT CHANGE entries, process files in dependency order (definitions first, then consumers), clean up explanatory notes in a separate pass, verify with final grep.
