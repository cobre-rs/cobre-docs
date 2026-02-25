# Findings: Notation Sections 4-5 vs Math Specs Part 2

## Summary

- Total symbols checked: 83
- Consistent: 72
- Inconsistent: 11 (see detailed findings)
- Beta-to-pi migration incomplete: 1 (block-formulations.md)
- Missing from notation-conventions: 5 (see detailed findings)

### Issue Breakdown

| Classification                  | Count | Details                                                                                                                           |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| BETA-TO-PI MIGRATION INCOMPLETE | 1     | `$\beta_h^{storage}$` in block-formulations.md                                                                                    |
| SYMBOL CONFLICT                 | 3     | `$\pi_h^{balance}$` in hydro-production-models.md; `$\bar{M}_c$` vs `$\bar{C}_c$` for contract capacity; `$\eta$` triple overload |
| SUBSCRIPT VARIANT               | 2     | `$\chi_{c,k}$` vs `$\chi^{in/out}_{c,k}$`; `$\varepsilon_t$` vs `$\eta_t$` for PAR noise                                          |
| MISSING DEFINITION              | 5     | `$\sigma^{v-}_h$`, `$\sigma^{fill}_h$`, `$\xi_h$`, `$\pi_m^{fpha}$`, `$\pi^{gen}_c$`                                              |

## Detailed Findings

### block-formulations.md

| Line | Symbol                | Issue                           | Canonical Definition                                                                                                                                   | Actual Usage                                                                                                                   |
| ---- | --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 83   | `$\beta_h^{storage}$` | BETA-TO-PI MIGRATION INCOMPLETE | Notation-conventions.md section 5 uses `$\pi^v_h$` for storage cut coefficient. The `$\beta$` symbol is not used anywhere in the notation conventions. | `$\beta_h^{storage} = \pi^{wb}_{h,1}$` — should be `$\pi^v_h = \pi^{wb}_{h,1}$` to match the canonical cut coefficient naming. |

### hydro-production-models.md

| Line | Symbol              | Issue              | Canonical Definition                                                                  | Actual Usage                                                                                                                                                 |
| ---- | ------------------- | ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 281  | `$\pi_h^{balance}$` | SYMBOL CONFLICT    | Notation-conventions.md section 5 defines the water balance dual as `$\pi^{wb}_h$`.   | `$\pi_{\hat{v}_h} = \pi_h^{balance} + \frac{1}{2} \sum_m \pi_m^{fpha} \cdot \gamma_v^m$` — uses non-canonical `$\pi_h^{balance}$` instead of `$\pi^{wb}_h$`. |
| 281  | `$\pi_{\hat{v}_h}$` | SYMBOL CONFLICT    | Notation-conventions.md section 5 defines the storage cut coefficient as `$\pi^v_h$`. | Uses `$\pi_{\hat{v}_h}$` as the LHS symbol rather than `$\pi^v_h$`. The subscript `$\hat{v}_h$` is a variable name, not an index.                            |
| 281  | `$\pi_m^{fpha}$`    | MISSING DEFINITION | Not defined in notation-conventions.md.                                               | Dual of FPHA hyperplane $m$. Used in hydro-production-models.md and cut-management.md. Should be added to notation-conventions.md section 5.                 |

### cut-management.md

| Line | Symbol           | Issue              | Canonical Definition                    | Actual Usage                                                                                                                                                              |
| ---- | ---------------- | ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 46   | `$\pi_m^{fpha}$` | MISSING DEFINITION | Not defined in notation-conventions.md. | `$\pi^v_{t,h} = \pi^{wb}_h + \frac{1}{2} \sum_m \pi_m^{fpha} \cdot \gamma_v^m$` — used consistently with hydro-production-models.md but absent from notation-conventions. |
| 50   | `$\pi^{gen}_c$`  | MISSING DEFINITION | Not defined in notation-conventions.md. | "their duals $\pi^{gen}_c$ also contribute to cut coefficients" — should be added to notation-conventions.md section 5.                                                   |

### equipment-formulations.md

| Line | Symbol         | Issue             | Canonical Definition                                                                                                 | Actual Usage                                                                                                                                                               |
| ---- | -------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 106  | `$\chi_{c,k}$` | SUBSCRIPT VARIANT | Notation-conventions.md section 4.1 defines `$\chi^{in}_{c,k}$` and `$\chi^{out}_{c,k}$` with direction superscript. | Uses unsuperscripted `$\chi_{c,k}$` for unidirectional contracts. This is intentional (unidirectional contract model) but creates a discrepancy with notation-conventions. |

This same variant appears in: lp-formulation.md (lines 22, 102, 140, 149), system-elements.md (lines 479, 487, 488, 500, 507, 524).

### inflow-nonnegativity.md

| Line                | Symbol    | Issue              | Canonical Definition                                                                                                                                                                            | Actual Usage                                                                                                                                                                                |
| ------------------- | --------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12, 15, 42, 75, 116 | `$\eta$`  | SUBSCRIPT VARIANT  | PAR model formal definition in par-inflow-model.md line 12 uses `$\varepsilon_t$` for innovation noise. Notation-conventions.md section 3.4 defines `$\eta_l$` as transmission line efficiency. | Uses bare `$\eta$` for noise realization. Matches the LP-form convention from par-inflow-model.md line 74 (`$\eta_t$`) but conflicts with `$\varepsilon_t$` in the formal model definition. |
| 157                 | `$\xi_h$` | MISSING DEFINITION | Not defined in notation-conventions.md.                                                                                                                                                         | Noise adjustment slack (dimensionless) for the `truncation_with_penalty` method. This is a decision variable that should be catalogued.                                                     |

### par-inflow-model.md

| Line     | Symbol                          | Issue             | Canonical Definition                                                                                                                          | Actual Usage                                                                                                                                                                                                                                                                                                   |
| -------- | ------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12 vs 74 | `$\varepsilon_t$` vs `$\eta_t$` | SUBSCRIPT VARIANT | Line 12 defines `$\varepsilon_t \sim \mathcal{N}(0, 1)$` as the innovation noise. Line 74 uses `$\eta_t$` as "the sampled noise realization". | Two symbols for the same concept within the same spec. `$\varepsilon_t$` is the mathematical innovation; `$\eta_t$` is the sampled value in the LP. The distinction may be intentional (random variable vs realized value) but is confusing, especially since `$\eta_l$` is also transmission line efficiency. |

### lp-formulation.md

| Line               | Symbol              | Issue              | Canonical Definition                                                                                       | Actual Usage                                                                                                             |
| ------------------ | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 127, 269, 277, 317 | `$\sigma^{v-}_h$`   | MISSING DEFINITION | Not defined in notation-conventions.md section 4.3 (Slack Variables).                                      | Storage violation slack (storage below minimum). Used extensively but not catalogued in the canonical symbol table.      |
| 127, 277, 317      | `$\sigma^{fill}_h$` | MISSING DEFINITION | Not defined in notation-conventions.md section 4.3 (Slack Variables).                                      | Filling target slack. Used extensively but not catalogued in the canonical symbol table.                                 |
| 200-202            | `$\psi_\ell$`       | SUBSCRIPT VARIANT  | Notation-conventions.md section 3.5 defines `$\psi_{m,\ell}$` (AR coefficient for season $m$, lag $\ell$). | Uses `$\psi_\ell$` without season subscript. The season is implicit from the stage. Not strictly wrong but inconsistent. |

### notation-conventions.md vs math specs — Contract Capacity

| Line                     | Symbol                         | Issue           | Canonical Definition                                                              | Actual Usage                                                                                                                                                                    |
| ------------------------ | ------------------------------ | --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NC:126 vs EF:111, SE:494 | `$\bar{M}_c$` vs `$\bar{C}_c$` | SYMBOL CONFLICT | Notation-conventions.md section 3.4 defines `$\bar{M}_c$` as "Contract capacity". | Equipment-formulations.md and system-elements.md use `$\bar{C}_c$` and `$\underline{C}_c$` for contract dispatch limits. The `$\bar{M}_c$` symbol is not used in any math spec. |

### risk-measures.md

| Line     | Symbol                         | Issue                          | Canonical Definition                                                                                                    | Actual Usage                                                                                                                                                                                                                                                    |
| -------- | ------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 26       | `$\eta$`                       | SYMBOL CONFLICT (acknowledged) | Notation-conventions.md section 3.4 defines `$\eta_l$` as transmission line efficiency.                                 | Uses `$\eta$` as VaR threshold in CVaR definition. This is standard risk measure convention and explicitly documented in the symbol conventions box at the top of the spec. The conflict is noted but accepted per the spec's own preamble.                     |
| 101, 105 | `$\lambda(\tilde{x}, \omega)$` | SYMBOL CONFLICT (acknowledged) | Notation-conventions.md section 5.5 defines `$\lambda_i$` as "Cut activity indicator" (dual of Benders cut constraint). | Uses `$\lambda$` as subgradient vector in the Risk-Averse Subgradient Theorem. The spec immediately clarifies: "the subgradients $\lambda(\tilde{x}, \omega)$ are the cut coefficients $\pi_t(\omega)$". This is a direct quotation from the theorem statement. |

### discount-rate.md

All symbols checked against notation-conventions: CONSISTENT.

- `$d$` for discount factor: documented in spec preamble, no conflict with `$\delta$`
- `$\theta$`: matches section 4.2
- `$\alpha_i$`, `$\pi^v_{i,h}$`, `$\pi^{lag}_{i,h,\ell}$`: match sections 5.4-5.5
- `$V_t$`, `$c_t$`, `$x_t$`: match section 1

### infinite-horizon.md

All symbols checked against notation-conventions: CONSISTENT.

- `$\alpha_k + \pi_k^\top x$`: compact vector notation, consistent with section 1 convention
- `$d_{cycle}$`: discount factor variant, consistent
- `$\tau(t)$`: season mapping, consistent with section 3.5's `$m(t)$` concept
- `$\underline{V}_\tau(x)$`: value function indexed by season, consistent

### stopping-rules.md

All symbols checked against notation-conventions: CONSISTENT.

- `$\underline{z}^k$`: lower bound at iteration $k$
- `$\bar{z}^k$`: upper bound estimate
- `$k$`: iteration counter (section 1)

### upper-bound-evaluation.md

All symbols checked against notation-conventions: CONSISTENT.

- `$\alpha_k + \pi_k^\top x_t$`: compact cut notation (section 1)
- `$\bar{V}_t(x)$`: inner approximation notation, consistent with `$V_t$` convention
- `$d_{t \to t+1}$`: discount factor, consistent with discount-rate.md
- `$L_t$`: Lipschitz constant — introduced locally, not in notation-conventions (acceptable as a spec-local quantity)

## Beta-to-Pi Migration Scan (All 14 Math Specs)

Searched all 14 math spec files for any `\beta` usage in cut coefficient context.

| File                       | Line | Finding                                                                                                    |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| block-formulations.md      | 83   | `$\beta_h^{storage} = \pi^{wb}_{h,1}$` — **INCOMPLETE MIGRATION**. Should be `$\pi^v_h = \pi^{wb}_{h,1}$`. |
| sddp-algorithm.md          | -    | No `$\beta$` found.                                                                                        |
| lp-formulation.md          | -    | No `$\beta$` found.                                                                                        |
| system-elements.md         | -    | No `$\beta$` found.                                                                                        |
| hydro-production-models.md | -    | No `$\beta$` found.                                                                                        |
| cut-management.md          | -    | No `$\beta$` found.                                                                                        |
| discount-rate.md           | -    | No `$\beta$` found.                                                                                        |
| infinite-horizon.md        | -    | No `$\beta$` found.                                                                                        |
| risk-measures.md           | -    | No `$\beta$` found.                                                                                        |
| inflow-nonnegativity.md    | -    | No `$\beta$` found.                                                                                        |
| par-inflow-model.md        | -    | No `$\beta$` found.                                                                                        |
| equipment-formulations.md  | -    | No `$\beta$` found.                                                                                        |
| stopping-rules.md          | -    | No `$\beta$` found.                                                                                        |
| upper-bound-evaluation.md  | -    | No `$\beta$` found.                                                                                        |

**Result**: 1 remaining `$\beta$` instance in cut coefficient context. All other specs have been migrated to `$\pi$`.

## PAR Inflow Model Symbol Consistency Check

The ticket specifically requests verification that stored ($s_m$, $\psi_{m,\ell}$) and computed ($\sigma_m$) symbols match notation-conventions.

| Symbol                           | notation-conventions.md                                                        | par-inflow-model.md                                                                                 | Consistent?                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `$\mu_m$` (seasonal mean)        | Section 3.5: `$\mu_m$` — m3/s, "Seasonal mean inflow for season $m$"           | Section 2: `$\mu_m$` — "Mean inflow for season $m$"                                                 | YES                                                                                                                 |
| `$s_m$` (sample std)             | Not in section 3.5 (only `$\sigma_m$` for residual std)                        | Section 3: `$s_m$` — "Standard deviation of historical observations for season $m$"                 | N/A (par-inflow-model introduces this locally as stored quantity, distinct from notation-conventions' `$\sigma_m$`) |
| `$\psi_{m,\ell}$` (AR coeff)     | Section 3.5: `$\psi_{m,\ell}$` — "AR coefficient for season $m$, lag $\ell$"   | Section 2: `$\psi_{m,1}, \ldots, \psi_{m,p}$` — "Autoregressive coefficients"                       | YES                                                                                                                 |
| `$\sigma_m$` (residual std)      | Section 3.5: `$\sigma_m$` — m3/s, "Residual standard deviation for season $m$" | Section 2: `$\sigma_m$` — "Scale of innovation term"; Section 3: computed, not stored               | YES                                                                                                                 |
| `$\hat{a}_{h,\ell}$` (lag state) | Section 3.5: `$\hat{a}_{h,\ell}$` — m3/s, "Incoming AR lag $\ell$ (state)"     | Not directly used in model definition (uses `$a_{h,t-\ell}$`); used in LP form (section 3, line 73) | YES (used in LP context)                                                                                            |
| `$\varepsilon_t$` (innovation)   | Not in notation-conventions.md                                                 | Section 1: `$\varepsilon_t \sim \mathcal{N}(0, 1)$`                                                 | MISSING from notation-conventions                                                                                   |
| `$\eta_t$` (noise realization)   | `$\eta_l$` defined as transmission line efficiency                             | Section 3 (LP coefficients): `$\eta_t$` — "sampled noise realization"                               | SYMBOL CONFLICT with `$\eta_l$`                                                                                     |

## Recommendations

### High Priority (should be fixed)

1. **block-formulations.md line 83**: Replace `$\beta_h^{storage}$` with `$\pi^v_h$` to complete the beta-to-pi migration.

2. **hydro-production-models.md line 281**: Replace `$\pi_h^{balance}$` with `$\pi^{wb}_h$` and `$\pi_{\hat{v}_h}$` with `$\pi^v_h$` to match notation-conventions section 5.

3. **notation-conventions.md section 4.3**: Add missing slack variables:
   - `$\sigma^{v-}_h$` — Storage below minimum (hm3)
   - `$\sigma^{fill}_h$` — Filling target shortfall (hm3)

4. **notation-conventions.md section 3.4**: Replace `$\bar{M}_c$` with `$\bar{C}_c$`, `$\underline{C}_c$` to match equipment-formulations.md and system-elements.md usage.

### Medium Priority (notation enrichment)

5. **notation-conventions.md section 5**: Add dual variables for FPHA and generic constraints:
   - `$\pi_m^{fpha}$` — Dual of FPHA hyperplane $m$
   - `$\pi^{gen}_c$` — Dual of generic constraint $c$

6. **notation-conventions.md section 4**: Add the noise adjustment variable:
   - `$\xi_h$` — Noise adjustment slack for truncation_with_penalty method (dimensionless)

### Low Priority (documentation clarification)

7. **Contract variable convention**: Either update notation-conventions section 4.1 to include unsuperscripted `$\chi_{c,k}$` as the primary notation (reflecting the unidirectional contract model), or add a note explaining that `$\chi^{in}_{c,k}$` / `$\chi^{out}_{c,k}$` are used when direction needs to be explicit, while `$\chi_{c,k}$` is used for the unified unidirectional model.

8. **PAR noise symbol**: Clarify in notation-conventions (or in par-inflow-model.md) the distinction between `$\varepsilon_t$` (random variable, innovation) and `$\eta_t$` (realized noise value in LP), or unify to a single symbol to avoid collision with `$\eta_l$` (transmission efficiency).

9. **lp-formulation.md line 200**: Add season subscript to `$\psi_\ell$` to read `$\psi_{m,\ell}$` for consistency with notation-conventions section 3.5, or add a note that the season is implicit.
