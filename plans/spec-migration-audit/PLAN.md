# SDDP Spec Migration Quality Audit & Enforcement — Plan Summary

## What This Plan Does

Deep scrutiny of the 50 SDDP spec documents migrated from `powers-rs` → `cobre-docs`, verifying correctness, crate-mapping accuracy, cross-reference coherence, LaTeX rendering, and producing a centralized cross-reference index.

## 6 Epics, 20 Tickets

### Epic 01 — Content Integrity Verification (5 tickets, DETAILED)

File-by-file comparison of all 50 source specs against their migrated targets using a 6-check methodology:

1. Frontmatter removal verified
2. Brand terms eliminated (POWE.RS → Cobre)
3. Heading inventory matches
4. Formula/equation counts match ($$, inline $)
5. Table/code block counts match
6. Cross-reference paths correctly rewritten (numbered → named directories)

Includes a Python normalization script for diffing beyond structural changes.

| Ticket | Scope                                                          |
| ------ | -------------------------------------------------------------- |
| 001    | 3 overview specs                                               |
| 002    | 7 math specs (sddp-algorithm through discount-rate)            |
| 003    | 7 math specs (infinite-horizon through upper-bound-evaluation) |
| 004    | 10 data model specs                                            |
| 005    | 22 architecture + HPC + config + deferred specs                |

### Epic 02 — Spec-to-Crate Mapping Audit (4 tickets, DETAILED)

Verifies each spec is assigned to the correct section and maps to the right crate(s). Resolves 3 key ambiguities:

- `scenario-generation.md` in `specs/architecture/` but implements `cobre-stochastic`
- `input-loading-pipeline.md` and `validation-architecture.md` map to `cobre-io`
- Produces 50-row master spec-to-crate mapping table

| Ticket | Scope                                                |
| ------ | ---------------------------------------------------- |
| 006    | 8 crate doc pages — link coverage + dependency graph |
| 007    | 13 data model + overview specs                       |
| 008    | 27 math + architecture specs                         |
| 009    | 10 HPC + config specs + master mapping table         |

### Epic 03 — Cross-Reference & Coherence Audit (4 tickets, OUTLINE)

- Verify all ~1,324 internal cross-references resolve and point to correct content
- Verify 13 algorithm reference pages are consistent with formal specs
- Audit glossary coverage

### Epic 04 — LaTeX Equation Rendering: Configuration & Verification (2 tickets, OUTLINE)

**CRITICAL FINDING**: `book.toml` has NO math rendering configured. All 403+ display equations render as raw LaTeX text on the deployed site. This epic must:

1. **Configure `mdbook-katex`** (recommended) — build-time KaTeX preprocessor, no client-side JS dependency, instant math display, CI-friendly (build errors catch unsupported commands). See [mdbook-katex](https://github.com/lzanini/mdbook-katex).
2. **Evaluate KaTeX compatibility** — most commands used in the specs (`\mathbb`, `\text`, `\operatorname`, `\begin{aligned}`, `\begin{cases}`) are supported. Main risk: `\backslash` (use `\setminus`). Fallback: MathJax via custom `theme/index.hbs` if KaTeX has blockers.
3. **Verify rendering** on 9 high-density pages + remaining pages
4. **Deploy** — update GitHub Pages workflow to install `mdbook-katex`

| Ticket | Scope                                                                                 |
| ------ | ------------------------------------------------------------------------------------- |
| 014    | Install mdbook-katex, configure book.toml, build locally, verify 9 high-density pages |
| 015    | Verify remaining pages, fix KaTeX-incompatible LaTeX, update CI, push to deploy       |

> **Priority note**: This epic should be executed early — the specs are unreadable without math rendering.

### Epic 05 — Cross-Reference Index Creation (2 tickets, OUTLINE)

- Create `src/specs/cross-reference-index.md` mapping:
  - Each spec → target crate(s)
  - Each spec → outgoing/incoming links
  - Each crate → all specs defining its behavior
  - Implementation dependency ordering

### Epic 06 — Remediation (3 tickets, OUTLINE)

- Fix CRITICAL findings (information loss)
- Fix HIGH findings (incorrect mapping, broken links)
- Fix MEDIUM/LOW + final mdBook build verification

## Severity Classification

| Severity | Definition                                                                                   |
| -------- | -------------------------------------------------------------------------------------------- |
| CRITICAL | Information loss — content present in source but absent from target                          |
| HIGH     | Incorrect spec-to-crate mapping, broken link, contradiction between algo ref and formal spec |
| MEDIUM   | Missing crate doc reference, glossary gap, minor cross-reference inaccuracy                  |
| LOW      | Style inconsistency, cosmetic, non-blocking                                                  |

## Success Metrics

- Zero CRITICAL findings remaining after remediation
- All 1,324 internal cross-references resolve correctly
- All LaTeX display equations render on deployed site
- Cross-reference index exists and is linked in SUMMARY.md
- mdBook builds with exit 0

## Agent Routing

- `sddp-specialist` — content integrity, math verification
- `open-source-documentation-writer` — cross-reference index, glossary
- `implementation-guardian` — spec-to-crate mapping verification

## Progressive Mode

Epics 1-2 are fully detailed (9 tickets). Epics 3-6 are outline (11 tickets) because their specifics depend on findings from epics 1-2. They will be refined before execution using learnings.
