# Accumulated Learnings: Through Epic 02

**Plan**: spec-consistency-audit
**Through Epic**: epic-02-external-reference-verification
**Updated**: 2026-02-24

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 5 fully correct, 4 CRITICAL, 1 MEDIUM, 2 LOW — 42% error rate (Epic 02)
- 2 software/web references verified; both fully correct, no changes needed (Epic 02)
- 31 in-spec citation usages audited; 81% contextually correct; all 6 problems trace to wrong bibliography metadata, not authorial misunderstanding (Epic 02)
- mdbook build: exit 0 after all fixes in both epics; no new KaTeX failures

---

## Key Findings

- **Wrong-metadata-but-valid-identifier** is the dominant bibliography failure mode — DOI or URL resolves correctly but title/authors/journal belong to a different paper; affects 3 of 4 CRITICAL entries; see `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- **Notation gaps concentrate in `lp-formulation.md`** — 12 of 19 symbol findings; hosts an unofficial penalty-parameter registry in section 1.3 not mirrored in `notation-conventions.md`; see `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`
- **`production-scale-reference.md` section 3.1-3.2 tables were wrong** — missing per-block inflow variable row, wrong pumping multiplier, overcounted constant-production constraints; fixed in ticket-005; `tools/lp_sizing.py` is the ground truth
- **Beta-to-pi migration is complete** — `block-formulations.md` line 83 was the last `$\beta$` in cut-coefficient context; see `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md`
- **`notation-conventions.md` enriched with 10 previously missing symbols** in Epic 01; 13 penalty cost symbols still unregistered (deferred)
- **SIDP upper-bound citation ambiguity**: Costa & Leclere (2023) title corrected in bibliography, but whether the cited paper is actually the basis for vertex-based upper bounds in `cobre-sddp` is unresolved; see `/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md` and findings-008

---

## Active Deferrals for Later Epics

- **Epic 03** (`ticket-011`): Change forward pass count 200 → 192 in 14 locations; update cut capacity formulas in `cut-management-impl.md` line 42 and `solver-abstraction.md` line 207
- **Epic 03**: Re-read spec text in `inflow-nonnegativity.md` and `cut-management.md` against corrected bibliography metadata before making substantive changes
- **Epic 05 or standalone**: Add 7 missing DOIs to bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018); all DOIs confirmed in findings-006
- **Epic 05 or standalone**: Add forward citations in specs for 4 orphan bibliography entries (Philpott & Guan 2008, de Matos et al. 2015, Dowson & Kapelevich 2021, Huangfu & Hall 2018); add cross-reference note in `notation-conventions.md` section 3 pointing to `lp-formulation.md` section 1.3
- **Epic 05 or standalone**: Resolve SIDP/vertex-based upper-bound citation — determine whether `optimization-online.org/?p=25462` (Costa/Merabet/Leclere 2024) is the correct source
- **Any epic**: Resolve `$\gamma$ overloading` (FPHA coefficients vs. pumping power rate `$\gamma_j$`); cascades through `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`
- **Any epic**: Unify PAR innovation noise to `$\varepsilon_t$`; currently `$\eta_t$` conflicts with `$\eta_l$` (line efficiency) in `par-inflow-model.md` and `inflow-nonnegativity.md`

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; also `bibliography.md` after Epic 02 fixes
- **Use formulas/calculator, not tables**: `production-scale-reference.md` sections 3.1-3.2 tables had 3 errors; `tools/lp_sizing.py` is correct
- **Verify notation references locally**: `lp-formulation.md`, `hydro-production-models.md` — symbols may deviate from `notation-conventions.md` for penalty parameters and PAR model terms
- **Bibliography annotations are now reliable** for CRITICAL entries; LOW entries (missing DOIs) are still incomplete but metadata is correct

---

## Process Patterns Established

- **Severity tier (SYMBOL CONFLICT / MISSING DEFINITION / SUBSCRIPT VARIANT)** enables clean prioritization for fix tickets; reuse in any notation audit
- **Full-corpus symbol scan as closing step** of any cross-cutting rename; one grep confirms isolation; see ticket-002 methodology in findings-002
- **Crossref API** (`api.crossref.org/works/{doi}`) is the definitive DOI verification tool; HTTP 200 reachability alone is not sufficient — the resolved metadata must be compared field-by-field
- **Thematic evidence tables** for behavioral audits (6 themes × evidence-per-spec matrix) — efficient; found high consistency with low effort; reuse for Epic 04 timing model consistency check
- **Deferred items should transfer via `changes-NNN.md` NEEDS REVIEW list** — more actionable than re-reading full findings reports
- **Single-ticket fix application** covering multiple files and severity levels worked cleanly; build verification with `mdbook build` is a sufficient regression gate
