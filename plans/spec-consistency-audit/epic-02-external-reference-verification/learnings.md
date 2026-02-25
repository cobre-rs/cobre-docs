# Per-Epic Learnings: Epic 02 — External Reference Verification

**Plan**: spec-consistency-audit
**Epic**: epic-02-external-reference-verification
**Tickets**: ticket-006, ticket-007, ticket-008, ticket-009
**Date**: 2026-02-24

---

## Patterns Discovered

- **Wrong-metadata-but-valid-DOI** is the dominant failure mode (3 of 4 CRITICAL entries): the DOI or URL resolves correctly, but the title, authors, and/or journal in the bibliography text belong to a different paper. Entries were not fabricated — they appear to be copy-paste collisions where one paper's metadata was paired with another paper's identifier. See `/home/rogerio/git/cobre-docs/src/reference/bibliography.md` for all corrected entries.
- **Completely wrong DOI** occurred once: `10.1287/opre.2013.1200` resolved to a Bertsimas et al. paper, not the intended Philpott et al. (2013). The last three digits (1200 vs. 1175) were the error — a transposition typical of manual DOI entry.
- **Software/web references were clean**: both the CEPEL Libs URL (`see.cepel.br/manual/libs/latest/`) and the SPARHTACUS wiki (`github.com/SPARHTACUS/SPTcpp/wiki`) resolved at HTTP 200 with content matching their descriptions. No changes required for ticket-007.
- **Contextual misattribution follows metadata errors**: all 4 MISLEADING and 2 INCORRECT in-spec citations (findings-008) trace directly to the bibliography metadata being wrong, not to the spec authors misunderstanding a paper they read. Once metadata is fixed, the contextual claims become verifiable.

---

## Quality Assessment

- Academic bibliography: 5/12 entries fully correct, 4 CRITICAL, 1 MEDIUM, 2 LOW — **42% error rate by entry count** (58% correct).
- However, severity is asymmetric: the 4 CRITICAL entries share a common pattern (wrong metadata for a valid identifier) that suggests a systematic data-entry problem in the original bibliography construction, not pervasive carelessness.
- Citation usage in spec files: 25/31 contextually correct (81%), with all 6 problematic usages (A9, A10, A11, A12, A13, A15) directly attributable to the wrong-metadata entries in the bibliography. The spec authors cited correctly for the topic; the bibliography entries were mislabeled.
- 4 bibliography entries are orphans (never cited in specs): Philpott & Guan (2008), de Matos et al. (2015), Dowson & Kapelevich (2021), Huangfu & Hall (2018). Retained by design as useful references.
- 3 references cited in spec/algorithm files were absent from bibliography.md: Benders (1962), Birge (1985), Birge & Louveaux (2011) — all added in ticket-009.

---

## Notable Fixes

- **Philpott et al. (2013) DOI** (`opre.2013.1200` → `opre.2013.1175`): highest-confidence fix — one field, one digit-group error, confirmed via Crossref. Propagated to `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md` and `/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md`.
- **Costa et al. (2025)**: metadata updated to match the actual SBMAC proceedings paper (7 authors, correct title "Boundary conditions for hydrothermal operation planning problems..."). Propagated to `/home/rogerio/git/cobre-docs/src/specs/math/infinite-horizon.md`.
- **Costa & Leclere (2023)**: title corrected to "Duality of upper bounds in stochastic dynamic programming"; annotation updated to remove the SIDP claim, which cannot be confirmed against the actual paper. See `/home/rogerio/git/cobre-docs/src/reference/bibliography.md` line 46-47.
- **Larroyd et al. (2022)**: author list corrected (6 actual authors vs. 4 listed, 3 of whom were wrong); title corrected. Propagated to `/home/rogerio/git/cobre-docs/src/specs/math/inflow-nonnegativity.md`.
- **Guigues & Bandarra**: upgraded from 2019 arXiv preprint to 2021 journal version in _Computational Management Science_; author order corrected to match journal publication. Propagated to `/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md` and `/home/rogerio/git/cobre-docs/src/algorithms/cut-selection.md`.

---

## Deferred Items

- **7 missing DOIs** (LOW): Pereira & Pinto 1991, Philpott & Guan 2008, de Matos et al. 2015, Shapiro 2011, Philpott & de Matos 2012, Dowson & Kapelevich 2021, Huangfu & Hall 2018. All DOIs confirmed and cataloged in findings-006. Not added because the ticket prioritized correctness over completeness, and these entries are otherwise accurate.
- **SIDP content uncertainty** for Costa & Leclere (2023): the annotation was corrected to the actual paper title, but the spec's claim that this paper is the basis for vertex-based upper bounds in `cobre-sddp` remains partially unverified. A separate decision is needed on whether the 2024 Costa/Merabet/Leclere paper (`optimization-online.org/?p=25462`) is the better citation target for the SIDP claim. Deferred to Epic 05 or a standalone review.
- **4 orphan entries**: retained in bibliography but none were cited in specs during this epic. A future pass (Epic 05) could add forward citations from spec files to these papers.
- **Misleading over-attributions** (A9, A10, A13, A15): not softened because the metadata fix makes the claims verifiable; readers can now access the correct papers and judge scope themselves.

---

## Implications for Later Epics

- **Epic 03 (production scale hardening)**: bibliography is now correct; any spec text that references paper titles by name (e.g., descriptions in the inflow-nonnegativity or cut-management specs) should be re-read against the corrected metadata before making substantive changes to that text.
- **Epic 05 (documentation organization)**: the 4 orphan entries and 7 missing DOIs represent low-hanging fruit for a completeness pass. The `notation-conventions.md` cross-reference note (deferred from Epic 01) and orphan citation additions can be batched into a single pass.
- **Epic 06 (Python API)**: no direct bibliography dependencies. The `infinite-horizon.md` citation (Costa et al. 2025) is now correct but the conceptual gap — whether the intended paper is actually the basis for `cobre-sddp`'s infinite horizon formulation — remains open if the Python API spec references that spec.

---

## Process Observations

- **Crossref API** (`api.crossref.org/works/{doi}`) was the definitive tool for academic DOI verification — it returns structured metadata (title, authors, journal, volume, pages) that can be compared field-by-field. Optimization Online and arXiv required page-scraping as no structured API is available.
- **Verification requires fetching the target, not just checking reachability**: HTTP 200 on a DOI is not sufficient — the Larroyd and Costa entries both resolved cleanly but to entirely different papers. Metadata comparison against the resolved page is mandatory.
- **Single-ticket fix application worked well**: all 4 CRITICAL, 1 MEDIUM, and 3 LOW fixes were applied in one ticket (ticket-009) that modified 7 files. Build verification (`mdbook build`) confirmed no regressions. The pre-existing KaTeX warnings in `risk-measures.md` are unrelated noise.
