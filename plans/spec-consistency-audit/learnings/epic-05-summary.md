# Accumulated Learnings: Through Epic 05

**Plan**: spec-consistency-audit
**Through Epic**: epic-05-documentation-organization
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 42% error rate — dominant mode is wrong-metadata-but-valid-identifier (Epic 02)
- 54 individual values in `production-scale-reference.md` cross-checked against LP sizing calculator; 50 exact match, 4 explained variance, 0 new discrepancies (Epic 03)
- Forward pass count updated from 200 to 192 in 20 locations across 8 files; 25 non-forward-pass "200" occurrences correctly preserved (Epic 03)
- First-principles timing model confirms 50-iteration production run uses 33.9% of 2-hour budget at the 2 ms warm-start KPI; 66.1% headroom for I/O, checkpointing, cold-starts (Epic 04)
- Three existing spec performance claims verified: `communication-patterns.md` "<1% IB" CONFIRMED (actual 0.08%); §4.3 "<5 ms/stage cut exchange" CONFIRMED (actual 0.23 ms, 22x margin); §4.4 "<2% communication" CONFIRMED with caveat (pure wire time 0.08%; total sync including barriers 2.03%) (Epic 04)
- 42 NEWAVE/CEPEL/DECOMP/DESSEM occurrences audited across 31 files; 38 KEEP, 4 UPDATE, 0 REMOVE — 4 false capability claims corrected to "Planned support" or actual format list (Epic 05)
- 50-spec corpus organization reviewed; all 6 sections SOUND, zero broken links, zero misplaced specs, zero orphan files (Epic 05)
- 6 empty NEWAVE migration stub files deleted; `src/migration/` directory removed; SUMMARY.md updated accordingly (Epic 05)
- mdBook build: exit 0 after all fixes in all five epics; no new KaTeX failures

---

## Key Findings

- **LP sizing calculator (`scripts/lp_sizing.py`) is ground truth** for all LP variable counts, constraint counts, state dimension, and memory estimates; every value in `production-scale-reference.md` §3.1-§3.4 now traces to calculator output; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §3.4
- **Wrong-metadata-but-valid-identifier is the dominant bibliography failure mode** — DOI resolves but title/authors belong to a different paper; affects 3 of 4 CRITICAL entries; see `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- **Notation gaps concentrate in `lp-formulation.md`** — 12 of 19 symbol findings; unofficial penalty-parameter registry in §1.3 not mirrored in `notation-conventions.md`; see `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`
- **AR(12) vs AR(6) is a documented design duality, not an error** — §3.1/§3.2 tables use worst-case AR(12) for capacity planning; calculator uses configurable avg AR(6) for typical sizing; "Source" column in §3.1/§3.2 makes this explicit per row
- **Forward pass 192 has superior arithmetic properties over 200**: 192/64=3, 192/16=12, 192/128=1.5 — all exact; previously "12-13" and "approximately 1.5" ambiguities in `cut-management-impl.md` and `work-distribution.md` are now exact
- **Beta-to-pi migration is complete** — `block-formulations.md` line 83 was the last `$\beta$` in cut-coefficient context; see `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md`
- **Backward pass warm-start is the single most sensitive performance parameter**: a drop from 100% to 80% hit rate triples compute time; forward pass warm-start has negligible impact; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` §7.5
- **Backward pass dominates at 97.5% of iteration compute**: this asymmetry makes LP solve time the only lever that matters for feasibility; critical LP solve time threshold is ~6 ms (3x safety margin over the 2 ms KPI); see `production-scale-reference.md` §4.6
- **False capability claim is a distinct defect category**: a claim that NEWAVE parsers exist (they do not) is categorically different from strategic positioning ("alternative to NEWAVE") or domain modeling ("CEPEL dead-volume filling"); only the false claims required UPDATE; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md`
- **Spec organization is structurally sound at 50 specs / 6 sections**: no misplaced specs, no broken links; SUMMARY.md sidebar order diverges from container page reading order in 4 of 6 sections but both orderings are defensible; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md`
- **SIDP upper-bound citation ambiguity remains unresolved**: Costa & Leclere (2023) title corrected in bibliography; whether the cited paper is the actual basis for vertex-based upper bounds in `cobre-sddp` remains open; see `/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md`

---

## Active Deferrals for Later Epics

- **LP sizing calculator `n_forward_passes` default is 200** while spec uses 192; discrepancy is annotated in §3.4; calculator code is out of audit scope
- **13 penalty cost symbols unregistered** in `notation-conventions.md`; authoritative source is `lp-formulation.md` §1.3
- **`$\gamma` overloading** (FPHA coefficients vs pumping power rate `$\gamma_j$`); cascades through `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`; relevant for Python binding parameter naming
- **PAR innovation noise `$\eta_t$` vs `$\varepsilon_t$`** conflict with line efficiency `$\eta_l$`; affects `par-inflow-model.md` and `inflow-nonnegativity.md`
- **7 missing DOIs** in bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018); see findings-006
- **4 orphan bibliography entries** lacking forward citations (Philpott & Guan 2008, de Matos et al. 2015, Dowson & Kapelevich 2021, Huangfu & Hall 2018)
- **SIDP/vertex-based upper-bound citation**: determine whether `optimization-online.org/?p=25462` (Costa/Merabet/Leclere 2024) is the correct source; see findings-008
- **Solver benchmarking validation**: timing model in `epic-04-wall-clock-time-model/timing-model-analysis.md` produces pre-implementation estimates; warm-start LP solve time and backward pass opening warm-start hit rate are the only two high-sensitivity parameters to measure first
- **`communication-patterns.md` §3.1 mixed-dimension volume**: the spec's "~587 MB" uses D=1,120 for trial points and D=2,080 for cuts; future cleanup ticket should make this explicit; deferred per annotation-not-modification policy
- **3 MEDIUM organization improvements from findings-016.md**: M-1 (harmonize SUMMARY.md order with container page reading order), M-2 (add navigation sections to 4 container pages), M-3 (align cross-reference index numbering with SUMMARY.md); all are low-risk and scoped to specific files; batch as a single maintenance ticket
- **deferred.md LOW improvements**: L-1 (archive implemented C.5), L-2 (number 3 unnumbered variants), L-3 (add TOC); apply when feature list grows beyond ~25 entries
- **`src/introduction.md` line 44 is a protected statement** — "born from the need for an open, modern alternative to NEWAVE, DECOMP, DESSEM" — must not be removed in any future documentation pass

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; also `bibliography.md` after Epic 02 fixes
- **Calculator-verified, use §3.3 formulas or calculator output**: `production-scale-reference.md` §3.1-§3.4 is fully annotated with Source column and §3.4 traceability block; run `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` for exact values
- **Model-verified performance numbers**: `production-scale-reference.md` §4.2 Production row and §4.6-§4.7 are derived from the first-principles timing model at `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md`; non-Production rows in §4.2 remain aspirational engineering targets
- **Verify notation references locally**: `lp-formulation.md`, `hydro-production-models.md` — symbols may deviate from `notation-conventions.md` for penalty parameters and PAR model terms
- **Bibliography annotations reliable for CRITICAL entries**; LOW entries (missing DOIs) still incomplete but metadata is correct
- **`src/crates/overview.md` now correct**: cobre-io capability description uses JSON/Parquet/CSV/Arrow after Epic 05 fixes; any new spec describing IO formats should match these four formats

---

## Process Patterns Established

- **Severity tier (SYMBOL CONFLICT / MISSING DEFINITION / SUBSCRIPT VARIANT)** enables clean prioritization for fix tickets; reuse in any notation audit (Epic 01)
- **Full-corpus symbol scan as closing step** of any cross-cutting rename; one grep confirms isolation (Epic 01)
- **Crossref API** (`api.crossref.org/works/{doi}`) is the definitive DOI verification tool; HTTP 200 reachability alone is insufficient — metadata must be compared field-by-field (Epic 02)
- **Deferred items transfer via `changes-NNN.md` NEEDS REVIEW list** — more actionable than re-reading full findings reports (Epics 01-03)
- **CLEAN/findings-first ticket before any fix ticket**: verification-only ticket confirms baseline and gives subsequent fix tickets a clean starting point; use for every calculator-grounded, reference-grounded, or structural audit (Epics 03, 05)
- **Exclusion table for corpus-wide numeric replacements**: when replacing a numeral with many non-target occurrences, maintain a (location, reason unchanged) table alongside the changes; see `changes-011.md` 25-entry exclusion table (Epic 03)
- **Annotation-not-modification for tool/spec parameter discrepancies**: when a reference tool uses a different default than the spec, annotate the spec rather than modifying the tool; also for spec claims that are approximately correct but need scope qualification (Epics 03-04)
- **"Source" column pattern for tabular specs**: adding Source (Calculator / Calculator (AR 12) / Configuration / Derived / Spec KPI / Spec Architecture / Engineering Estimate) to formula tables makes provenance explicit and reduces future audit effort (Epics 03-04)
- **Derived-value cascade tracking**: list every affected file and every affected value before editing when a single parameter change propagates; see `changes-011.md` 20-change / 8-file manifest (Epic 03)
- **Standalone audit artifact in plans/ directory**: for long quantitative derivations, place the full model in the epic directory and reference it from spec sections; keeps spec files concise while preserving full traceability (Epic 04)
- **Closed-form sensitivity formulas before numeric substitution**: expressing the model as a closed-form equation makes critical thresholds derivable analytically; use in any quantitative spec update involving a performance target (Epic 04)
- **Decision table with rationale column for reference audits**: documenting all N occurrences with File, Line, Keyword, Context, Decision, and Rationale columns makes the audit reproducible and challengeable at the individual-item level; see `changes-018.md` (Epic 05)
- **Three-way classification for external-reference cleanup**: KEEP / UPDATE / REMOVE avoids over-deletion; the UPDATE bucket is where false capability claims live (Epic 05)
- **"Planned support" replacement wording**: replace false present-tense capability claims with "Planned support for X to enable Y" — preserves roadmap visibility without misleading readers; applied in `introduction.md` and `crates/overview.md` (Epic 05)
- **Zero-match grep assertion after file deletion**: after removing files, grep for any link pattern targeting the deleted paths and assert zero matches; confirms no broken navigation links remain (Epics 01, 05)
- **Single-ticket fix application** covering multiple files and severity levels worked cleanly; `mdbook build` is a sufficient regression gate (Epics 01-05)
