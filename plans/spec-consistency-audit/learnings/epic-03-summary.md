# Accumulated Learnings: Through Epic 03

**Plan**: spec-consistency-audit
**Through Epic**: epic-03-production-scale-hardening
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 42% error rate — dominant mode is wrong-metadata-but-valid-identifier (Epic 02)
- 54 individual values in `production-scale-reference.md` cross-checked against LP sizing calculator; 50 exact match, 4 explained variance, 0 new discrepancies (Epic 03)
- Forward pass count updated from 200 to 192 in 20 locations across 8 files; 25 non-forward-pass "200" occurrences correctly preserved (Epic 03)
- mdBook build: exit 0 after all fixes in all three epics; no new KaTeX failures

---

## Key Findings

- **LP sizing calculator (`scripts/lp_sizing.py`) is ground truth** for all LP variable counts, constraint counts, state dimension, and memory estimates; every value in `production-scale-reference.md` §3.1-§3.4 now traces to calculator output; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §3.4
- **Wrong-metadata-but-valid-identifier is the dominant bibliography failure mode** — DOI resolves but title/authors belong to a different paper; affects 3 of 4 CRITICAL entries; see `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- **Notation gaps concentrate in `lp-formulation.md`** — 12 of 19 symbol findings; unofficial penalty-parameter registry in §1.3 not mirrored in `notation-conventions.md`; see `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`
- **AR(12) vs AR(6) is a documented design duality, not an error** — §3.1/§3.2 tables use worst-case AR(12) for capacity planning; calculator uses configurable avg AR(6) for typical sizing; "Source" column in §3.1/§3.2 makes this explicit per row
- **Forward pass 192 has superior arithmetic properties over 200**: 192/64=3, 192/16=12, 192/128=1.5 — all exact; previously "12-13" and "approximately 1.5" ambiguities in `cut-management-impl.md` and `work-distribution.md` are now exact
- **`production-scale-reference.md` D1/D2/D3 errors from Epic 01 confirmed fixed** — missing per-block inflow row, wrong pumping multiplier, overcounted constant-production constraints; all three verified FIXED in ticket-010
- **Beta-to-pi migration is complete** — `block-formulations.md` line 83 was the last `$\beta$` in cut-coefficient context; see `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md`
- **`notation-conventions.md` enriched with 10 symbols** in Epic 01; 13 penalty cost symbols still unregistered (deferred)
- **SIDP upper-bound citation ambiguity**: Costa & Leclere (2023) title corrected in bibliography; whether the cited paper is the actual basis for vertex-based upper bounds in `cobre-sddp` remains unresolved; see `/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md`

---

## Active Deferrals for Later Epics

- **LP sizing calculator `n_forward_passes` default is 200** while spec uses 192; discrepancy is annotated in §3.4; calculator code is out of audit scope
- **13 penalty cost symbols unregistered** in `notation-conventions.md`; authoritative source is `lp-formulation.md` §1.3
- **`$\gamma$ overloading** (FPHA coefficients vs pumping power rate `$\gamma_j$`); cascades through `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`
- **PAR innovation noise `$\eta_t$` vs `$\varepsilon_t$`** conflict with line efficiency `$\eta_l$`; affects `par-inflow-model.md` and `inflow-nonnegativity.md`
- **7 missing DOIs** in bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018); all DOIs confirmed in findings-006; target Epic 05
- **4 orphan bibliography entries** lacking forward citations (Philpott & Guan 2008, de Matos et al. 2015, Dowson & Kapelevich 2021, Huangfu & Hall 2018); target Epic 05
- **SIDP/vertex-based upper-bound citation**: determine whether `optimization-online.org/?p=25462` (Costa/Merabet/Leclere 2024) is the correct source; see findings-008
- **Re-read `inflow-nonnegativity.md` and `cut-management.md`** against corrected bibliography metadata before substantive changes (noted in findings-010)

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; also `bibliography.md` after Epic 02 fixes
- **Calculator-verified, use §3.3 formulas or calculator output**: `production-scale-reference.md` §3.1-§3.4 is now fully annotated with Source column and §3.4 traceability block; run `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` for exact values; §3.1/§3.2 "Typical Count" column uses worst-case AR(12), not calculator defaults
- **Verify notation references locally**: `lp-formulation.md`, `hydro-production-models.md` — symbols may deviate from `notation-conventions.md` for penalty parameters and PAR model terms
- **Bibliography annotations reliable for CRITICAL entries**; LOW entries (missing DOIs) still incomplete but metadata is correct

---

## Process Patterns Established

- **Severity tier (SYMBOL CONFLICT / MISSING DEFINITION / SUBSCRIPT VARIANT)** enables clean prioritization for fix tickets; reuse in any notation audit (Epic 01)
- **Full-corpus symbol scan as closing step** of any cross-cutting rename; one grep confirms isolation (Epic 01)
- **Crossref API** (`api.crossref.org/works/{doi}`) is the definitive DOI verification tool; HTTP 200 reachability alone is insufficient — metadata must be compared field-by-field (Epic 02)
- **Thematic evidence tables** for behavioral audits (N themes × evidence-per-spec matrix) — efficient; found high consistency with low effort (Epic 01, reuse for Epic 04 timing model check)
- **Deferred items transfer via `changes-NNN.md` NEEDS REVIEW list** — more actionable than re-reading full findings reports (Epics 01-03)
- **CLEAN/findings-first ticket before any fix ticket**: verification-only ticket confirms baseline and gives subsequent fix tickets a clean starting point; use for every calculator-grounded or reference-grounded audit (Epic 03, ticket-010 before ticket-011)
- **Exclusion table for corpus-wide numeric replacements**: when replacing a numeral with many non-target occurrences, maintain a (location, reason unchanged) table alongside the changes; see `changes-011.md` 25-entry exclusion table (Epic 03)
- **Annotation-not-modification for tool/spec parameter discrepancies**: when a reference tool uses a different default than the spec, annotate the spec rather than modifying the tool; see `production-scale-reference.md` §3.4 `n_forward_passes` note (Epic 03)
- **"Source" column pattern for tabular specs**: adding Source (Calculator / Calculator (AR 12) / Configuration / Derived) to formula tables makes provenance explicit and reduces future audit effort; see §3.1 and §3.2 of `production-scale-reference.md` (Epic 03)
- **Derived-value cascade tracking**: list every affected file and every affected value before editing when a single parameter change propagates; prevents missing dependent values; see `changes-011.md` 20-change / 8-file manifest (Epic 03)
- **Single-ticket fix application** covering multiple files and severity levels worked cleanly; `mdbook build` is a sufficient regression gate (Epics 01-03)
