# Accumulated Learnings: Epic 01

**Plan**: spec-consistency-audit
**Through Epic**: epic-01-internal-formula-value-consistency
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without any changes
- 3 SYMBOL CONFLICT, 10 MISSING DEFINITION, 6 SUBSCRIPT VARIANT items found — all LOW-to-MEDIUM severity
- 47 parameter values cross-referenced; headline system dimensions consistent across all specs; only internal counting tables in `production-scale-reference.md` had errors
- 6 behavioral themes checked across math / architecture / HPC layers — 1 LOW contradiction, 3 LOW ambiguities; otherwise fully consistent
- mdbook build: exit 0 after all fixes; zero new KaTeX failures

---

## Key Findings

- **Notation gaps concentrate in `lp-formulation.md`** — 12 of 19 symbol findings are in this one file; it hosts an unofficial penalty-parameter registry in section 1.3 that is not mirrored in `notation-conventions.md`; see `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`
- **`production-scale-reference.md` section 3.1-3.2 tables were wrong** — missing per-block inflow variable row, wrong pumping multiplier, overcounted constant-production constraints; fixed in ticket-005; formulas and calculator (`tools/lp_sizing.py`) remain the ground truth
- **Beta-to-pi migration is now complete** — `block-formulations.md` line 83 was the last `$\beta$` in cut coefficient context; replaced with `$\pi^v_h$`; see `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md`; this supersedes the spec-migration-audit epic-06 summary note that labeled this instance as "intentionally preserved"
- **`notation-conventions.md` was enriched with 10 previously missing symbols** — 4 index sets (`$\mathcal{R}$`, `$\mathcal{C}$`, `$\mathcal{H}^{fpha}$`, `$\mathcal{H}^{const}$`), 2 slack variables, 2 dual variables, 1 subscript fix, 1 contract capacity correction; see `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`
- **13 penalty cost symbols remain unregistered** in `notation-conventions.md` section 3 — deferred; authoritative source is `lp-formulation.md` section 1.3

---

## Active Deferrals for Later Epics

- **Epic 03** (`ticket-011`): Change forward pass count 200 → 192 in all 14 locations cataloged at `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-003.md` lines 186-213; also update cut capacity formulas in `cut-management-impl.md` line 42 and `solver-abstraction.md` line 207
- **Any epic**: Resolve `$\gamma$ overloading` (FPHA coefficients vs pumping power rate `$\gamma_j$`) — rename `$\gamma_j$` to avoid conflict; cascades through `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`
- **Any epic**: Unify PAR innovation noise to `$\varepsilon_t$` — currently `$\eta_t$` in LP form conflicts with `$\eta_l$` (line efficiency); affects `par-inflow-model.md` and `inflow-nonnegativity.md`
- **Epic 05 or standalone**: Add cross-reference note in `notation-conventions.md` section 3 pointing to `lp-formulation.md` section 1.3 for penalty cost parameters

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs
- **Use formulas/calculator, not tables**: `production-scale-reference.md` sections 3.1-3.2 tables had 3 errors; the `tools/lp_sizing.py` calculator is correct
- **Verify notation references locally**: `lp-formulation.md`, `hydro-production-models.md` — symbols may deviate from `notation-conventions.md` for penalty parameters and PAR model terms

---

## Process Patterns Established

- **Severity tier (SYMBOL CONFLICT / MISSING DEFINITION / SUBSCRIPT VARIANT)** enables clean prioritization for fix tickets; reuse in any notation audit
- **Full-corpus beta/symbol scan as closing step** of any cross-cutting rename — one grep confirms isolation; see ticket-002 methodology in `findings-002.md`
- **Thematic evidence tables** for behavioral audits (6 themes × evidence-per-spec matrix) — efficient; found high consistency with low effort; reuse for Epic 04 timing model consistency check
- **Deferred items should transfer via `changes-005.md` NEEDS REVIEW list** — more actionable than re-reading full findings reports; 11 items cataloged there are the primary input for Epic 03 and beyond
