# Audit Report: Math Spec Files Part 2

**Ticket**: ticket-003
**Date**: 2026-02-24
**Auditor**: sddp-specialist (automated)
**Scope**: 7 math spec files migrated from `powers-rs` to `cobre-docs`

**Source**: `/home/rogerio/git/powers/docs/specs/01-math/`
**Target**: `/home/rogerio/git/cobre-docs/src/specs/math/`

---

## 1. infinite-horizon.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Infinite Periodic Horizon`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero occurrences of POWE.RS, powers-core, powers-io, powers-sddp, powers-solver, powers-stochastic, powers-cli, powers-rs, powers\_, or ferroMPI. Source `POWE.RS SDDP` (line 18) correctly replaced with `Cobre SDDP` (target line 5).

### Check 3 -- Heading Inventory

**PASS**. All 12 headings match exactly between source and target:
`# Infinite Periodic Horizon`, `## Purpose`, `## 1 Motivation`, `## 2 Periodic Structure`, `## 3 Cyclic Policy Graph`, `## 4 Discount Requirement for Convergence`, `## 5 Cut Sharing Within Cycles`, `## 6 Forward Pass Behavior`, `## 7 Backward Pass Behavior`, `## 8 Fixed-Point Interpretation`, `## 9 Reference`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 14, target = 14. All formulas preserved.

**Check 4d (cycle discount convergence formula)**: Present. The convergence condition $d_{cycle} = \prod_{t \in \text{cycle}} d_{t \to t+1} < 1$ and the limit formula $\lim_{n \to \infty} d_{cycle}^n \cdot V_t(x) = 0$ are both intact in the target (lines 50--58).

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 0, target = 0. Code fences: source = 2, target = 2. The JSON code block for the cyclic policy graph is intact.

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 6 cross-references resolve to existing files:

- `discount-rate.md` -- OK
- `../data-model/input-scenarios.md` -- OK (was `../02-data-model/input-scenarios.md`)
- `sddp-algorithm.md` -- OK
- `cut-management.md` -- OK
- `stopping-rules.md` -- OK
- `../configuration/configuration-reference.md` -- OK (was `../05-config/configuration-reference.md`)

### Findings

| #   | Severity | Description                                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | LOW      | `§` replaced with `&sect;` HTML entity in 4 locations (lines 44, 62, 128, 129). Renders identically in HTML. |

### Verdict: **PASS**

---

## 2. risk-measures.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Risk Measures`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source `POWE.RS` (line 31, 68) correctly replaced with `Cobre` (target lines 5, 42).

### Check 3 -- Heading Inventory

**PASS**. All 19 headings match exactly between source and target: `# Risk Measures`, `## Purpose`, `## 1 Motivation`, `## 2 Conditional Value-at-Risk (CVaR)`, `## 3 Convex Combination Risk Measure`, `## 4 Dual Representation of Convex Risk Measures`, `### 4.1 CVaR Dual Representation`, `### 4.2 EAVaR Dual Representation`, `## 5 Risk-Averse Subgradient Theorem`, `## 6 Risk-Averse Bellman Equation`, `## 7 Cut Generation with Risk Measures`, `## 8 Per-Stage Risk Profiles`, `## 9 Upper Bound with Risk Measures`, `## 10 Lower Bound Validity with Risk Measures`, `### Why the Lower Bound Fails`, `### What the "Lower Bound" Represents`, `### Recommendations`, `## 11 References`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 26, target = 26. Inline `$$` formulas: source = 3, target = 3. All formulas preserved.

**Check 4a (symbol convention callout block)**: Present and complete. The target (lines 9--15) contains the callout block with all 5 symbol conventions:

1. $\alpha$ -- CVaR confidence level
2. $\hat{\alpha}_t(\omega)$ -- per-scenario cut intercepts
3. $d$ -- discount factor
4. $\mu$ -- risk-adjusted probability measure
5. $\psi(p, \mu)$ -- dual penalty function

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 15, target = 15 (alpha table: 6 rows, option table: 4 rows, recommendations table: 5 rows). Code fences: source = 2, target = 2 (JSON example).

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 8 cross-references resolve to existing files:

- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)
- `sddp-algorithm.md` -- OK
- `cut-management.md` -- OK (key link verified)
- `stopping-rules.md` -- OK
- `discount-rate.md` -- OK
- `infinite-horizon.md` -- OK
- `upper-bound-evaluation.md` -- OK
- `../data-model/input-scenarios.md` -- OK (was `../02-data-model/input-scenarios.md`)

### Findings

No findings. All checks pass cleanly.

### Verdict: **PASS**

---

## 3. inflow-nonnegativity.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Inflow Non-Negativity Solution Methods`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source had no brand terms in body content (only in frontmatter which was removed).

### Check 3 -- Heading Inventory

**PASS**. All 11 headings match exactly: `# Inflow Non-Negativity Solution Methods`, `## Purpose`, `## 1. Problem Statement`, `## 2. Penalty Classification`, `## 3. Method: \`none\``, `## 4. Method: \`penalty\``, `## 5. Method: \`truncation\``, `## 6. Method: \`truncation_with_penalty\``, `## 7. Comparison Summary`, `## 8. Reference`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 27 (counted from content only, excluding frontmatter), target = 27. Note: the source `$$` count also includes the inline formula `$$c^{tv-}...$$` on a single line, which is matched in target.

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 12, target = 12 (variable table: 4 rows, variable table 2: 4 rows, comparison summary table: 7 rows -- accounting for separator rows). Code fences: source = 8, target = 8 (4 JSON configuration blocks).

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 6 cross-references resolve to existing files:

- `lp-formulation.md` -- OK
- `par-inflow-model.md` -- OK
- `../data-model/penalty-system.md` -- OK (was `../02-data-model/penalty-system.md`)
- `../architecture/scenario-generation.md` -- OK (was `../03-architecture/scenario-generation.md`)
- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)
- `../configuration/configuration-reference.md` -- OK (was `../05-config/configuration-reference.md`)

### Length Verification

Source content (after frontmatter): 227 lines. Target: 226 lines. The 1-line difference is the blank line between frontmatter closing `---` and content. **No truncation detected.** All 8 sections plus cross-references are intact.

### Findings

No findings. All checks pass cleanly.

### Verdict: **PASS**

---

## 4. par-inflow-model.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# PAR(p) Inflow Model`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source had no brand terms in body content.

### Check 3 -- Heading Inventory

**PASS**. All 18 headings match exactly: `# PAR(p) Inflow Model`, `## Purpose`, `## 1. Model Definition`, `## 2. Parameter Set`, `## 3. Stored vs. Computed Quantities`, `### Stored in input files`, `### Computed at runtime`, `### LP coefficients`, `## 4. Model Order Selection`, `## 5. Fitting Procedure`, `### 5.1 Notation`, `### 5.2 Step 1 -- Seasonal Means and Standard Deviations`, `### 5.3 Step 2 -- Seasonal Autocorrelations`, `### 5.4 Step 3 -- Yule-Walker Equations`, `### 5.5 Step 4 -- Convert to Original Units`, `### 5.6 Step 5 -- Residual Standard Deviation`, `## 6. Validation Invariants`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 26, target = 26. Inline `$$` formulas: source = 4, target = 4. All formulas preserved, including the full Yule-Walker matrix system.

**Check 4b (fitting procedure sections)**: Present and complete. The target contains all fitting procedure subsections:

- 5.1 Notation (symbol table with $N_m$, $\bar{a}_m$, $s_m$, $\gamma_m(\ell)$, $\rho_m(\ell)$)
- 5.2 Step 1 -- seasonal means and standard deviations (moment-matching equations)
- 5.3 Step 2 -- seasonal autocorrelations (cross-seasonal autocovariance)
- 5.4 Step 3 -- Yule-Walker equations (matrix system)
- 5.5 Step 4 -- convert to original units
- 5.6 Step 5 -- residual standard deviation

Model order selection (AIC, BIC, coefficient significance) is present in section 4.

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 18, target = 18 (parameter set table: 5 rows, stored quantities table: 6 rows, notation table: 7 rows). Code fences: source = 0, target = 0.

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 5 cross-references resolve to existing files:

- `../data-model/input-scenarios.md` -- OK (was `../02-data-model/input-scenarios.md`)
- `lp-formulation.md` -- OK
- `inflow-nonnegativity.md` -- OK
- `../architecture/scenario-generation.md` -- OK (was `../03-architecture/scenario-generation.md`, key link verified)
- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)

### Findings

No findings. All checks pass cleanly.

### Verdict: **PASS**

---

## 5. equipment-formulations.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Equipment-Specific Formulations`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source `POWE.RS` (lines 21, 63, 254) correctly replaced with `Cobre` (target lines 5, 47, 238).

### Check 3 -- Heading Inventory

**PASS**. All 17 headings match exactly: `# Equipment-Specific Formulations`, `## Purpose`, `## 1. Thermal Plants`, `### 1.1 Standard Thermals`, `### 1.2 GNL Thermals`, `## 2. Transmission Lines`, `## 3. Import/Export Contracts`, `## 4. Pumping Stations`, `## 5. Hydro Plants`, `## 6. Non-Controllable Generation Sources`, `## 7. Deferred Equipment Types`, `### 7.1 Batteries`, `## 8. Simulation-Only Constraint Enhancements (Future)`, `### 8.1 Stepped Thermal Enforcement`, `### 8.2 Storage-Dependent Hydro Bounds`, `### 8.3 Relationship to Generic Constraints`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 28, target = 28. All formulas preserved across all 6 equipment types (thermal segment bounds, generation bounds, objective contribution, transmission flow bounds, load balance, contracts, pumping bounds, power consumption, NCS bounds, curtailment cost).

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 0, target = 0 (no tables -- this file uses prose and formula blocks). Code fences: source = 0, target = 0.

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 10 cross-references resolve to existing files:

- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)
- `system-elements.md` -- OK
- `lp-formulation.md` -- OK
- `hydro-production-models.md` -- OK
- `../data-model/penalty-system.md` -- OK (was `../02-data-model/penalty-system.md`)
- `../data-model/input-system-entities.md` -- OK (was `../02-data-model/input-system-entities.md`, key link verified)
- `../data-model/input-constraints.md` -- OK (was `../02-data-model/input-constraints.md`)
- `block-formulations.md` -- OK
- `../deferred.md` -- OK (was `../06-deferred/deferred-features.md`, file exists at `/home/rogerio/git/cobre-docs/src/specs/deferred.md`)
- `../data-model/input-scenarios.md` -- OK (was `../02-data-model/input-scenarios.md`)

### Extra Scrutiny (secondary elements)

All secondary equipment types verified present and complete:

- **Pumping Stations (section 4)**: Decision variables, bounds (including minimum flow), power consumption formula, water balance impact, load balance impact, objective contribution (none), and economic modeling note -- all present.
- **Import/Export Contracts (section 3)**: Unidirectional model, decision variables, bounds, load balance contribution (import/export distinction), objective contribution with single-summation explanation -- all present.
- **Non-Controllable Generation Sources (section 6)**: Decision variables, hard bounds, load balance, curtailment cost objective, notes on curtailment derivation, and open question on block distribution -- all present.

### Findings

No findings. All checks pass cleanly.

### Verdict: **PASS**

---

## 6. stopping-rules.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Stopping Rules`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source `POWE.RS SDDP solver` (line 18) correctly replaced with `Cobre SDDP solver` (target line 5).

### Check 3 -- Heading Inventory

**PASS**. All 10 headings match exactly: `# Stopping Rules`, `## Purpose`, `## 1 Available Stopping Rules`, `## 2 Iteration Limit (Mandatory)`, `## 3 Time Limit`, `## 4 Bound Stalling`, `## 5 Simulation-Based Stopping (Recommended)`, `## 6 Combining Rules`, `## 7 Output on Termination`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 12, target = 12. Inline `$$` formulas: source = 6, target = 6. All formulas preserved including the bound stalling condition, simulation distance metric, bound stability condition, and combining rule logic.

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 14, target = 14 (parameter table: 7 rows, output table: 7 rows). Code fences: source = 10, target = 10 (5 JSON configuration blocks).

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 6 cross-references resolve to existing files:

- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)
- `sddp-algorithm.md` -- OK
- `cut-management.md` -- OK
- `upper-bound-evaluation.md` -- OK
- `risk-measures.md` -- OK
- `../configuration/configuration-reference.md` -- OK (was `../05-config/configuration-reference.md`)

Note: The ticket suggested checking for a link `stopping-rules.md -> ../architecture/convergence-monitoring.md`. No such link exists in either source or target. This is not a finding.

### Findings

No findings. All checks pass cleanly.

### Verdict: **PASS**

---

## 7. upper-bound-evaluation.md

### Check 1 -- Frontmatter Removal

**PASS**. First line is `# Upper Bound Evaluation`. No `---` frontmatter present.

### Check 2 -- Brand Terms

**PASS**. Zero brand term occurrences. Source `POWE.RS` (line 18) correctly replaced with `Cobre` (target line 5).

### Check 3 -- Heading Inventory

**PASS**. All 14 headings match exactly: `# Upper Bound Evaluation`, `## Purpose`, `## 1 Motivation`, `## 2 Vertex-Based Inner Approximation`, `## 3 Lipschitz Interpolation`, `## 4 Lipschitz Constant Computation`, `## 5 Vertex Value Computation`, `## 6 Upper Bound Evaluation LP`, `## 7 Linearized Upper Bound LP`, `## 8 Gap Computation`, `## 9 Computational Considerations`, `## 10 Infinite Horizon`, `## 11 References`, `## Cross-References`.

### Check 4 -- Formula Inventory

**PASS**. `$$` delimiter lines: source = 36, target = 36. All formulas preserved including vertex set definition, Lipschitz interpolation, backward accumulation, vertex value computation, outer/inner approximation LP formulations, absolute value linearization, and gap computation.

**Check 4c (statistical test formulas)**: The ticket asked to verify t-test and confidence interval formulas. Reviewing both source and target, this file does **not** contain t-test or chi-squared formulas. It defines **deterministic** upper bounds via the SIDP inner approximation, not statistical tests. The gap computation formula (section 8) provides the deterministic convergence measure. This is consistent between source and target -- no information loss. The ticket's expectation of statistical test formulas in this file appears to be a mischaracterization; the statistical stopping rules are in `stopping-rules.md` instead.

### Check 5 -- Table and Code Block Inventory

**PASS**. Pipe-lines: source = 19, target = 19 (Lipschitz example table: 7 rows, additional variables table: 5 rows, computational considerations table: 6 rows, plus a 1-row implied from the vertex table). Code fences: source = 0, target = 0.

### Check 6 -- Cross-Reference Path Accuracy

**PASS**. All 10 cross-references resolve to existing files:

- `sddp-algorithm.md` -- OK
- `../overview/notation-conventions.md` -- OK (was `../00-overview/notation-conventions.md`)
- `discount-rate.md` -- OK
- `infinite-horizon.md` -- OK
- `cut-management.md` -- OK
- `stopping-rules.md` -- OK (key link verified: `upper-bound-evaluation.md -> stopping-rules.md`)
- `risk-measures.md` -- OK
- `../data-model/binary-formats.md` -- OK (was `../02-data-model/binary-formats.md`)
- `../data-model/input-directory-structure.md` -- OK (was `../02-data-model/input-directory-structure.md`)
- `../configuration/configuration-reference.md` -- OK (was `../05-config/configuration-reference.md`)

### Findings

| #   | Severity | Description                                                                                                                                                                                        |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | LOW      | Author name `Leclere` in target reference (line 207) is missing the accent from source `Leclere` with grave accent (source line 220: `Lecl\u00e8re`). Cosmetic; does not affect content integrity. |
| 2   | LOW      | En-dash `\u2013` in source page range `957\u2013970` (line 222) replaced with regular hyphen `957-970` in target (line 209). Cosmetic.                                                             |
| 3   | LOW      | `\u00a7` replaced with `&sect;` HTML entity in 3 locations (lines 215, 220, 221). Renders identically in HTML.                                                                                     |

### Verdict: **PASS**

---

## Summary Table

| File                      | FM  | Brands | Headings | Formulas          | Tables/Code             | Cross-refs | Verdict  |
| ------------------------- | --- | ------ | -------- | ----------------- | ----------------------- | ---------- | -------- |
| infinite-horizon.md       | OK  | OK     | 12/12    | 14/14             | 0/0 pipe, 2/2 fence     | 6/6 OK     | **PASS** |
| risk-measures.md          | OK  | OK     | 19/19    | 26/26 (+3 inline) | 15/15 pipe, 2/2 fence   | 8/8 OK     | **PASS** |
| inflow-nonnegativity.md   | OK  | OK     | 11/11    | 27/27             | 12/12 pipe, 8/8 fence   | 6/6 OK     | **PASS** |
| par-inflow-model.md       | OK  | OK     | 18/18    | 26/26 (+4 inline) | 18/18 pipe, 0/0 fence   | 5/5 OK     | **PASS** |
| equipment-formulations.md | OK  | OK     | 17/17    | 28/28             | 0/0 pipe, 0/0 fence     | 10/10 OK   | **PASS** |
| stopping-rules.md         | OK  | OK     | 10/10    | 12/12 (+6 inline) | 14/14 pipe, 10/10 fence | 6/6 OK     | **PASS** |
| upper-bound-evaluation.md | OK  | OK     | 14/14    | 36/36             | 19/19 pipe, 0/0 fence   | 10/10 OK   | **PASS** |

**Overall Result**: 7/7 files PASS. Zero CRITICAL or HIGH findings. 4 LOW findings across 2 files (cosmetic differences in Unicode characters and HTML entity encoding).

---

## Acceptance Criteria Verification

- [x] `risk-measures.md` symbol convention callout block: all 5 symbols present and correctly defined
- [x] `par-inflow-model.md` fitting procedure: moment-matching equations (steps 1--3) and model order selection (AIC, BIC, significance) present
- [x] `upper-bound-evaluation.md` statistical test formulas: file uses deterministic gap computation (not statistical tests); consistent between source and target
- [x] `infinite-horizon.md` cycle discount convergence: formula $d_{cycle} < 1$ and limit formula present
- [x] All 7 files: `$$` formula counts match source
- [x] All 7 files: zero broken cross-references (51 total links verified)
- [x] 7-row summary table produced
