# Accumulated Learnings: Through Epic 04

**Plan**: spec-consistency-audit
**Through Epic**: epic-04-wall-clock-time-model
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 42% error rate — dominant mode is wrong-metadata-but-valid-identifier (Epic 02)
- 54 individual values in `production-scale-reference.md` cross-checked against LP sizing calculator; 50 exact match, 4 explained variance, 0 new discrepancies (Epic 03)
- Forward pass count updated from 200 to 192 in 20 locations across 8 files; 25 non-forward-pass "200" occurrences correctly preserved (Epic 03)
- First-principles timing model confirms 50-iteration production run uses 33.9% of 2-hour budget at the 2 ms warm-start KPI; 66.1% headroom for I/O, checkpointing, cold-starts (Epic 04)
- Three existing spec performance claims verified: `communication-patterns.md` "<1% IB" CONFIRMED (actual 0.08%); §4.3 "<5 ms/stage cut exchange" CONFIRMED (actual 0.23 ms, 22x margin); §4.4 "<2% communication" CONFIRMED with caveat (pure wire time 0.08%; total sync including barriers 2.03%) (Epic 04)
- mdBook build: exit 0 after all fixes in all four epics; no new KaTeX failures

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
- **Backward pass warm-start is the single most sensitive performance parameter**: a drop from 100% to 80% hit rate triples compute time (2,425 s → 6,709 s, 93% of budget); forward pass warm-start has negligible impact (<2% change across full range); the sequential-opening design in `work-distribution.md` §2.3 is specifically engineered to maintain near-100% backward warm-start; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` §7.5
- **Backward pass dominates at 97.5% of iteration compute**: $T_{bwd} = 119 \times 200 \times \tau_{LP} = 23{,}800 \times \tau_{LP}$ vs $T_{fwd} = 120 \times \tau_{LP}$; this asymmetry makes LP solve time the only lever that matters for feasibility; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.6
- **Critical LP solve time threshold is ~6 ms**: $T_{crit} = 7{,}200 / 1{,}196{,}000 \approx 5.98$ ms; the spec KPI of 2 ms provides a 3x safety margin; early solver benchmarking should measure this first; see §4.6
- **Thread utilization at 64 ranks is 12.5%** (3 active threads of 24 per rank); this is by design — 64 ranks trades utilization for memory pressure reduction and future scaling headroom; optimal utilization (100%) is achieved at 8 ranks × 24 threads with identical per-iteration time; see §4.4
- **Load imbalance barrier overhead (1.95%) dominates synchronization** — pure wire time is only 0.08%; any future synchronization optimization effort should target load imbalance sources (LP solve variance, NUMA latency) rather than network bandwidth; see timing model §11.9

---

## Active Deferrals for Later Epics

- **LP sizing calculator `n_forward_passes` default is 200** while spec uses 192; discrepancy is annotated in §3.4; calculator code is out of audit scope
- **13 penalty cost symbols unregistered** in `notation-conventions.md`; authoritative source is `lp-formulation.md` §1.3
- **`$\gamma` overloading** (FPHA coefficients vs pumping power rate `$\gamma_j$`); cascades through `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`
- **PAR innovation noise `$\eta_t$` vs `$\varepsilon_t$`** conflict with line efficiency `$\eta_l$`; affects `par-inflow-model.md` and `inflow-nonnegativity.md`
- **7 missing DOIs** in bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018); all DOIs confirmed in findings-006; target Epic 05
- **4 orphan bibliography entries** lacking forward citations (Philpott & Guan 2008, de Matos et al. 2015, Dowson & Kapelevich 2021, Huangfu & Hall 2018); target Epic 05
- **SIDP/vertex-based upper-bound citation**: determine whether `optimization-online.org/?p=25462` (Costa/Merabet/Leclere 2024) is the correct source; see findings-008
- **Re-read `inflow-nonnegativity.md` and `cut-management.md`** against corrected bibliography metadata before substantive changes (noted in findings-010)
- **Solver benchmarking validation**: the timing model in `epic-04-wall-clock-time-model/timing-model-analysis.md` produces pre-implementation estimates; actual measurement of (a) warm-start LP solve time and (b) backward pass opening warm-start hit rate will be the first regression tests against the model; these are the only two parameters with high sensitivity
- **`communication-patterns.md` §3.1 mixed-dimension volume**: the spec's "~587 MB" uses D=1,120 for trial points and D=2,080 for cuts; a future cleanup ticket should make this explicit or present both dimensions in the table; deferred per annotation-not-modification policy

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; also `bibliography.md` after Epic 02 fixes
- **Calculator-verified, use §3.3 formulas or calculator output**: `production-scale-reference.md` §3.1-§3.4 is now fully annotated with Source column and §3.4 traceability block; run `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` for exact values; §3.1/§3.2 "Typical Count" column uses worst-case AR(12), not calculator defaults
- **Model-verified performance numbers**: `production-scale-reference.md` §4.2 Production row and §4.6-§4.7 are now derived from the first-principles timing model at `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md`; non-Production rows in §4.2 remain aspirational engineering targets pending implementation
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
- **Annotation-not-modification for tool/spec parameter discrepancies**: when a reference tool uses a different default than the spec, annotate the spec rather than modifying the tool; also used for spec claims that are approximately correct but need scope qualification (e.g., "<2% communication" qualified with a barrier-overhead note in §4.4 and §3.2) (Epics 03-04)
- **"Source" column pattern for tabular specs**: adding Source (Calculator / Calculator (AR 12) / Configuration / Derived / Spec KPI / Spec Architecture / Engineering Estimate) to formula tables makes provenance explicit and reduces future audit effort; see §3.1/§3.2 and §4.7 of `production-scale-reference.md` (Epics 03-04)
- **Derived-value cascade tracking**: list every affected file and every affected value before editing when a single parameter change propagates; prevents missing dependent values; see `changes-011.md` 20-change / 8-file manifest (Epic 03)
- **Standalone audit artifact in plans/ directory**: for long quantitative derivations (831 lines in `timing-model-analysis.md`), place the full model in the epic directory and reference it from spec sections; keeps spec files concise while preserving full traceability; mdBook build is unaffected (Epic 04)
- **Closed-form sensitivity formulas before numeric substitution**: expressing the model as $T_{total} = 1{,}196{,}000 \times \tau_{LP} + 49.6$ makes the critical threshold ($\tau_{LP}^{crit} \approx 6$ ms) derivable analytically; this pattern should be used in any quantitative spec update that involves a performance target (Epic 04)
- **Consistency check table with CONFIRMED / NEEDS UPDATE verdicts**: at the end of any modeling ticket, check all existing spec claims that the model could confirm or refute; produces a clean handoff to the spec-update ticket (Epic 04, timing model §11.11)
- **Single-ticket fix application** covering multiple files and severity levels worked cleanly; `mdbook build` is a sufficient regression gate (Epics 01-04)
