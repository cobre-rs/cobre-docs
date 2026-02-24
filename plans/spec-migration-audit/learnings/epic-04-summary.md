# Accumulated Learnings: Epics 01 through 04

**Plan**: spec-migration-audit
**Through Epic**: epic-04-latex-rendering
**Updated**: 2026-02-24

---

## Audit State After Four Epics

- All 50 spec files pass content integrity, section placement, cross-reference coherence, and LaTeX rendering checks
- Zero CRITICAL findings across all four epics
- Math rendering fully operational: 1,348 KaTeX elements across 35 display-math pages, zero rendering errors
- 7 HIGH cross-reference findings outstanding (F-1, F-5 through F-9, F-11) -- all wrong or phantom section numbers
- 14 HIGH crate doc missing-link findings outstanding -- 8 concentrated in `cobre-sddp`
- 19 MEDIUM findings outstanding (6 asymmetric reference gaps, 3 algorithm notation gaps, 9 glossary omissions, 1 LOW legacy reference)

---

## Patterns Established

- **6-check content integrity protocol** (frontmatter, brand terms, headings, formula count, table/code count, path resolution): reuse verbatim for any future doc migration. See `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-01-content-integrity/learnings.md`.
- **4-check crate mapping protocol** (M1 section assignment, M2 SUMMARY.md, M3 ambiguity, M4 coverage gap): demonstrated in tickets 007-009.
- **Section-number reference table** (file, line, ref text, target section, heading, PASS/FAIL): audited 534 references across 55 files in Epic 03.
- **Bidirectional pair checks**: 15 pairs checked in Epic 03, yielding 6 MEDIUM asymmetric gaps invisible to unidirectional audits.
- **HTML element count as rendering proxy**: count `class="katex"` and `class="katex-display"` in generated HTML; zero `<p>$$</p>` confirms no unprocessed math.
- **Currency `$` scan before enabling KaTeX**: grep all source files for bare `$[0-9/]` and escape as `\$`; data-model cost tables are the highest-risk location.
- **Post-build grep for rendering failures**: `grep -c "Rendering failed"` on build stderr after every `mdbook build`; `throw-on-error = true` catches unsupported LaTeX but not currency-dollar WARNs.

---

## Architectural Decisions

- `specs/architecture/input-loading-pipeline.md` stays in architecture -- primary: `cobre-io`
- `specs/hpc/synchronization.md` -- primary is `cobre-sddp`, not `ferrompi`
- `specs/data-model/binary-formats.md`, `internal-structures.md`, `output-infrastructure.md` stay in data-model despite architectural content -- see ticket-007 section 2
- Algorithm reference pages use simplified notation intentionally; notation differences from formal spec are acceptable if mathematically equivalent (zero contradictions found)
- **mdbook-katex v0.10.0-alpha chosen over MathJax**: build-time rendering, no JS dependency, CI-visible errors, searchable static HTML output
- **Pinned binary CI install for mdbook-katex**: avoids 3-minute `cargo install`; both workflow files pin to `v0.10.0-alpha-binaries` release tag

---

## Key Files

- `/home/rogerio/git/cobre-docs/book.toml` -- `[preprocessor.katex]` with `after = ["links"]` and `throw-on-error = true`
- `/home/rogerio/git/cobre-docs/theme/css/custom.css` -- KaTeX dark-theme block appended (`.katex`, `.katex-display` with `color: inherit`)
- `/home/rogerio/git/cobre-docs/.github/workflows/ci.yml` and `deploy.yml` -- mdbook-katex binary install using pinned v0.10.0-alpha-binaries URL
- `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md` -- 30+ `\$` escapes (Epic 04) + F-9 phantom section refs (Epic 03 HIGH)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/output-schemas.md`, `input-directory-structure.md`, `input-system-entities.md` -- `\$` escapes applied for currency table cells (Epic 04)
- `/home/rogerio/git/cobre-docs/src/crates/sddp.md` -- 8 HIGH missing spec links from Epic 02
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` -- source of 4 HIGH findings (F-6, F-7, F-8, F-11) from a single renumbering event
- Master 50-row crate table: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` section 5

---

## Conventions

- **Severity**: CRITICAL = info loss; HIGH = wrong section/broken link/missing required ref; MEDIUM = missing secondary ref, notation inconsistency, glossary gap; LOW = cosmetic
- **`\$` escape convention**: all currency unit labels in table cells use `\$`; bare `$` produces non-fatal KaTeX WARNs that do not fail the build
- **Glossary threshold**: absent terms are LOW if standard domain knowledge; MEDIUM if named methods, domain-specific overloads, or Cobre-specific acronyms

---

## Outstanding Findings (Epic 05 and 06 Input)

- F-1 HIGH: `sddp-algorithm.md` line 164 -- Equipment Formulations S3 should be S1.2
- F-5 HIGH: `extension-points.md` line 267 -- `configuration-reference.md` S18.6-S18.8 nonexistent; correct is S5, S6.2-S6.3
- F-6 HIGH: `extension-points.md` lines 228, 268 -- Solver Abstraction S2; correct is S10
- F-7 HIGH: `solver-abstraction.md` line 388 -- mislabeled S8/S11 footer entries
- F-8 HIGH: `solver-abstraction.md` line 190 -- self-reference S10 for LP rebuild; correct is S11
- F-9 HIGH: `penalty-system.md` line 339 -- LP Formulation S5.0 and S5.8 nonexistent; correct is S1 and S9
- F-11 HIGH: `design-principles.md` line 139 -- Solver Abstraction S9; correct is S10
- 14 HIGH crate doc missing links: `cobre-sddp` (8), `cobre-core` (2), `cobre-io` (2), `cobre-cli` (1), `ferrompi` (1) -- see epic-02 summary for per-crate list
- F-2, F-3, F-12 to F-15 MEDIUM: 6 asymmetric reference gaps across 6 spec pairs
- F-16 to F-18 MEDIUM: 3 algorithm page notation/link gaps (benders clarifying note, forward-backward missing link, cvar missing link)
- F-19 to F-27 MEDIUM: 9 glossary omissions; definition text in ticket-013 report sections F-19 through F-27
- F-10 LOW: `deferred.md` legacy "DATA_MODEL S3.x.x" references at lines 70, 167, 220, 814

---

## Recommendations for Epics 05 and 06

- **Epic 05**: Resolve all 7 HIGH findings before index construction to avoid indexing wrong section numbers; the 21 deferred features in `deferred.md` (ticket-009 section 2.2) each need an individual index entry; use master 50-row crate table as base
- **Epic 06 priority clusters**: (1) solver-abstraction.md renumbering -- fix F-6, F-7, F-8, F-11 together (same root cause, 3 files); (2) phantom refs -- fix F-5, F-9 (quick mechanical); (3) 14 HIGH crate doc missing links; (4) 9 glossary additions (definition text ready)
- **Epic 06 LaTeX safety**: after every math spec edit run `mdbook build 2>&1 | grep -c "Rendering failed"`; new data-model table rows with costs must use `\$`
- **Write acceptance criteria after reading the target file**: repeated failure mode across Epics 02, 03, and 04 -- never use counts or section numbers from memory
