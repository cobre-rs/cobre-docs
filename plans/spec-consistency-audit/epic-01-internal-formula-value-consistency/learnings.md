# Epic 01 Learnings: Internal Formula & Value Consistency

**Epic**: epic-01-internal-formula-value-consistency
**Completed**: 2026-02-25
**Scope**: 14 math specs, overview/architecture/HPC cross-checks; 210 symbol usages; 47 parameter values; 6 behavioral themes

---

## 1. Patterns Discovered

- **Notation gaps cluster in `lp-formulation.md` and `hydro-production-models.md`** — 16 of 19 symbol-level findings are in these two files; all other math specs are largely clean (`findings-001.md`, `findings-002.md`).
- **Missing definitions outnumber conflicts** — 10 MISSING DEFINITION items vs. 3 SYMBOL CONFLICT items; the corpus is consistent where it defines symbols; the weakness is underspecification in `notation-conventions.md`.
- **Penalty cost parameters are systematically absent** — 13 cross-spec penalty symbols (8 Category 2 penalties, `$c^{ctr}_c$`, `$c^{fpha}_h$`, `$c^{curt}_r$`, `$\gamma_j$`) exist only in `lp-formulation.md` section 1.3 tables, not in `notation-conventions.md` section 3.
- **Subscript variants are polish, not semantic errors** — all 6 SUBSCRIPT VARIANT items are derivable from context; none prevent correct implementation.
- **Behavioral descriptions are highly consistent across abstraction layers** — all 6 behavioral themes pass with 1 LOW contradiction and 3 LOW ambiguities (`findings-004.md`).
- **Parameter values consistent at headline level** — canonical system dimensions (160 hydros, 130 thermals, 6 buses, 10 lines, 120 stages) agree across all specs; only internal counting tables in `production-scale-reference.md` had errors.

---

## 2. Spec Quality Assessment

- **Strong**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md` — fully consistent with notation-conventions; all HPC specs consistent as a group at the wire-format level.
- **Weak — `lp-formulation.md`**: 12 findings; section 1.3 penalty tables serve as an unofficial notation registry not mirrored in `notation-conventions.md`.
- **Weak — `hydro-production-models.md`**: 3 notation items (SC-3, SV-5, MD `$c^{fpha}_h$`) involving inconsistent cut coefficient superscript/subscript conventions.
- **Weak — `production-scale-reference.md` section 3.1-3.2 tables**: 3 counting errors (D1-D3); the section 3.3 formulas and `tools/lp_sizing.py` calculator are correct and are the ground truth.

---

## 3. Notable Fixes Applied

All fixes are in `changes-005.md`. Highest-impact items:

- **Beta-to-pi migration complete** (`block-formulations.md` line 83): `$\beta_h^{storage}$` replaced with `$\pi^v_h$`; this was the last surviving `$\beta$` in cut coefficient context. **Supersedes** the `spec-migration-audit` epic-06 summary (`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/learnings/epic-06-summary.md` line 80) which incorrectly labeled this instance as intentionally preserved.
- **Cut coefficient notation aligned** (`hydro-production-models.md` line 281): `$\pi_h^{balance}$` → `$\pi^{wb}_h$`; `$\pi_{\hat{v}_h}$` → `$\pi^v_h$`; matches `cut-management.md` line 46.
- **notation-conventions.md enriched**: fixed thermal subscript collision (`$c^{th}_{t,s}$` → `$c^{th}_{j,s}$`); replaced phantom `$\bar{M}_c$` with `$\bar{C}_c$`/`$\underline{C}_c$`; added 4 index sets, 2 slack variables, 2 dual variables.
- **production-scale-reference.md tables corrected**: D1 (missing inflow variable row), D2 (pumping multiplier), D3 (constant-production constraint overcounting).
- **synchronization.md section 1.1**: "exactly three collective calls" corrected to "three types … $T+1$ total per iteration."

---

## 4. Deferred Items (from `changes-005.md` NEEDS REVIEW)

- **$\gamma$ overloading** (`lp-formulation.md` line 150, `system-elements.md` line 451): FPHA coefficients vs pumping power rate; rename cascades through 3 files; deferred.
- **$\eta$ overloading**: PAR innovation noise (`$\eta_t$`) conflicts with line efficiency (`$\eta_l$`); unify to `$\varepsilon_t$` in `par-inflow-model.md` and `inflow-nonnegativity.md`; deferred.
- **13 penalty cost symbols**: absent from `notation-conventions.md` section 3; add a cross-reference note pointing to `lp-formulation.md` section 1.3 as authoritative source (preferred over expanding the table).
- **Forward pass 200 → 192**: 14 spec locations cataloged in `findings-003.md` lines 186-213; explicitly deferred to Epic 03 (`ticket-011`); also requires updating `cut-management-impl.md` line 42 and `solver-abstraction.md` line 207.
- **PAR subscript variants SV-2, SV-3**: `$\psi_\ell$`/`$\mu_t$`/`$\sigma_t$` vs season-indexed canonical forms; LP context makes mapping implicit; deferred.

---

## 5. Implications for Later Epics

- **Epic 02 (bibliography)**: `par-inflow-model.md` (PAR), `risk-measures.md` (CVaR/EAVaR), `upper-bound-evaluation.md` (SIDP) are highest-risk for citation-level errors; `discount-rate.md` and `infinite-horizon.md` are clean internally.
- **Epic 03 (production scale)**: Use `findings-003.md` lines 186-213 as the exact catalog for the 200→192 forward-pass update; `communication-patterns.md` intentionally uses `D_state = 2,080` (AR(12)) vs. 1,120 (AR(6)) elsewhere — clarify with explicit AR-order assumptions in section headers.
- **Epic 04 (timing model)**: Behavioral specs are reliable for timing analysis; `synchronization.md` section 1.1 now gives the correct $T+1$ collective call count; document which warm-start path (within-iteration or across-iteration) the timing model assumes (`solver-workspaces.md` vs `training-loop.md` ambiguity B-002/B-003).
- **Epic 05 (organization)**: If `lp-formulation.md` is split or moved, preserve penalty parameter tables and add the cross-reference note to `notation-conventions.md` section 3.
- **Epic 06 (Python API)**: `notation-conventions.md` symbol table is now complete for core quantities; the unresolved `$\gamma$ overloading` is the one clash that could affect Python parameter naming — prefer `gamma_pump` or distinct name in the binding layer.

---

## 6. Process Observations

- **Severity tier (SYMBOL CONFLICT / MISSING DEFINITION / SUBSCRIPT VARIANT)** over pass/fail: enabled clean prioritization in the fix ticket; reuse for any notation audit.
- **Full-corpus symbol scan as closing step**: cheap confirmation that a rename is isolated; the beta scan across 14 specs in ticket-002 confirmed a single remaining violation.
- **Thematic evidence-table behavioral audit**: 6 themes × evidence-per-spec matrix found high consistency with low effort; reuse for Epic 04 timing model consistency checks.
- **Adjustment needed**: deferred numeric changes should be their own mini-ticket at creation time so the catalog transfers cleanly; the `changes-005.md` NEEDS REVIEW list is the most actionable handoff artifact — read it first when planning any future epic.
