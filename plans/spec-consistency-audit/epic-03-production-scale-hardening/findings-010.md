## Findings: Cross-Check Sizing Calculator Output Against Spec Values

### Summary

- **Overall Verdict**: CLEAN
- Sections verified: 2.1, 3.1, 3.2, 3.3, 3.4
- Total individual values cross-checked: 54
- Matches: 50 exact match
- Explained variance: 4 (AR(12) vs AR(6) in s3.1/s3.2 typical counts)
- New discrepancies found: 0
- D1/D2/D3 from findings-003: all confirmed FIXED

### Methodology

1. Ran the LP sizing calculator with default config: `echo '{}' | python3 ~/git/powers/scripts/lp_sizing.py /dev/stdin`
2. Compared every row in sections 3.1, 3.2, 3.4 against calculator output
3. Compared every formula term in section 3.3 against `calculate_sizing()` (lines 191-234)
4. Verified section 2.1 state dimension formulas and numeric examples
5. Computed AR(12) worst-case sums from s3.1/s3.2 tables and confirmed they are internally consistent

---

### Section 3.4: Headline Values Comparison

| Metric             | Spec s3.4 (line 161) | Calculator Output | Match |
| ------------------ | -------------------: | ----------------: | ----- |
| Total variables    |                6,923 |             6,923 | PASS  |
| Total constraints  |               20,788 |            20,788 | PASS  |
| Active constraints |                5,788 |             5,788 | PASS  |
| State dimension    |                1,120 |             1,120 | PASS  |
| Cuts memory/stage  |             128.7 MB |          128.7 MB | PASS  |

**Verdict**: All five headline values match exactly.

**Memory derivation verification**: `15,000 cuts * 1,120 state_dim * 8 bytes + 15,000 * 8 bytes (RHS) + 15,000 * 32 bytes (metadata) = 134,400,000 + 120,000 + 480,000 = 135,000,000 bytes = 128.7 MB`. Confirmed.

---

### Section 3.1: Variable Count per Subproblem

Each row compared against the calculator's `calculate_sizing()` function. The s3.1 "Typical Count" column uses worst-case AR(12); the calculator uses average AR(6).

| Component                   | Spec Formula (s3.1)           | Spec Count | Calc Formula (lp_sizing.py)                                  | Calc Value | Verdict            |
| --------------------------- | ----------------------------- | ---------: | ------------------------------------------------------------ | ---------: | ------------------ |
| Future cost                 | 1                             |          1 | `1` (line 197)                                               |          1 | PASS               |
| Deficit                     | N_bus _ N_block _ N_seg       |         54 | `n_buses * n_blocks * avg_deficit_segments` (line 198)       |         54 | PASS               |
| Excess                      | N_bus \* N_block              |         18 | `n_buses * n_blocks` (line 199)                              |         18 | PASS               |
| Exchange (direct + reverse) | 2 _ N_line _ N_block          |         60 | `2 * n_lines * n_blocks` (line 200)                          |         60 | PASS               |
| Hydro storage               | N_hydro                       |        160 | `n_hydros` (line 201)                                        |        160 | PASS               |
| Hydro incremental inflow AR | N_hydro \* P                  |      1,920 | `n_hydros * avg_ar_order` (line 202)                         |        960 | EXPLAINED VARIANCE |
| Hydro turbined flow         | N_hydro \* N_block            |        480 | part of `n_hydros * n_blocks * 4` (line 203)                 |    (1,920) | PASS (see note 1)  |
| Hydro spillage              | N_hydro \* N_block            |        480 | part of `n_hydros * n_blocks * 4` (line 203)                 |    (1,920) | PASS (see note 1)  |
| Hydro generation            | N_hydro \* N_block            |        480 | part of `n_hydros * n_blocks * 4` (line 203)                 |    (1,920) | PASS (see note 1)  |
| Hydro inflow (per-block)    | N_hydro \* N_block            |        480 | part of `n_hydros * n_blocks * 4` (line 203)                 |    (1,920) | PASS (see note 1)  |
| Hydro diversion             | N_div \* N_block              |         30 | `n_hydros_with_diversion * n_blocks` (line 204)              |         30 | PASS               |
| Hydro evaporation           | N_evap \* N_block             |        150 | `n_hydros_with_evaporation * n_blocks` (line 205)            |        150 | PASS               |
| Hydro withdrawal            | N_withdrawal \* N_block       |         60 | `n_hydros_with_withdrawal * n_blocks` (line 206)             |         60 | PASS               |
| Hydro slacks                | N_hydro _ N_block _ 6         |      2,880 | `n_hydros * n_blocks * n_slack_types` (line 207)             |      2,880 | PASS               |
| Thermal generation          | N_thermal _ N_block _ avg_seg |        585 | `n_thermals * n_blocks * avg_thermal_segments` (line 208)    |        585 | PASS               |
| Contracts                   | (N_imp + N_exp) \* N_block    |         15 | `(n_contracts_import + n_contracts_export) * n_blocks` (209) |         15 | PASS               |
| Pumping (flow + power)      | N_pump _ N_block _ 2          |         30 | `n_pumps * n_blocks * 2` (line 210)                          |         30 | PASS               |
| **Total Variables**         |                               | **~7,500** |                                                              |  **6,923** | PASS (see note 2)  |

**Note 1**: The spec s3.1 table breaks hydro flow into four individual rows (turbined, spillage, generation, inflow) of 480 each = 1,920 total. The calculator combines them as `n_hydros * n_blocks * 4 = 1,920`. Algebraically identical: `4 * (N_hydro * N_block) = N_hydro * N_block * 4`.

**Note 2**: The s3.1 total "~7,500" is an explicit approximation. At worst-case AR(12), the exact row sum is 7,883. At average AR(6), the exact row sum is 6,923 matching the calculator. The "~7,500" approximation falls between these two extremes (midpoint = 7,403) and is reasonable. The s3.4 table provides the exact calculator value for authoritative reference.

**AR(12) vs AR(6) Explained Variance**: The only row affected is "Hydro incremental inflow AR". At AR(12): 160 _ 12 = 1,920. At AR(6): 160 _ 6 = 960. Difference = 960. This is explicitly documented in the s3.4 note (line 167).

---

### Section 3.2: Constraint Count per Subproblem

| Component                        | Spec Formula (s3.2)           |   Spec Count | Calc Formula (lp_sizing.py)                                  | Calc Value | Verdict            |
| -------------------------------- | ----------------------------- | -----------: | ------------------------------------------------------------ | ---------: | ------------------ |
| Load balance                     | N_bus \* N_block              |           18 | `n_buses * n_blocks` (line 214)                              |         18 | PASS               |
| Hydro water balance              | N_hydro                       |          160 | `n_hydros` (line 215)                                        |        160 | PASS               |
| Incremental inflow AR dynamics   | N_hydro                       |          160 | part of `n_hydros * (1 + avg_ar_order)` (line 216)           |    (1,120) | PASS (see note 3)  |
| Lagged incremental inflow fixing | N_hydro \* P                  |        1,920 | part of `n_hydros * (1 + avg_ar_order)` (line 216)           |    (1,120) | EXPLAINED VARIANCE |
| Hydro generation (constant)      | (N_hydro - N_fpha) \* N_block |          330 | `(n_hydros - n_hydros_with_fpha) * n_blocks` (line 217)      |        330 | PASS               |
| Hydro generation (FPHA)          | N_fpha _ N_block _ avg_planes |        1,500 | `n_hydros_with_fpha * n_blocks * avg_fpha_planes` (line 218) |      1,500 | PASS               |
| Outflow definition               | N_hydro \* N_block            |          480 | `n_hydros * n_blocks` (line 219)                             |        480 | PASS               |
| Outflow bounds (min/max)         | 2 _ N_hydro _ N_block         |          960 | `2 * n_hydros * n_blocks` (line 220)                         |        960 | PASS               |
| Turbined min                     | N_hydro \* N_block            |          480 | `n_hydros * n_blocks` (line 221)                             |        480 | PASS               |
| Generation min                   | N_hydro \* N_block            |          480 | `n_hydros * n_blocks` (line 222)                             |        480 | PASS               |
| Evaporation                      | N_evap \* N_block             |          150 | `n_hydros_with_evaporation * n_blocks` (line 223)            |        150 | PASS               |
| Water withdrawal                 | N_withdrawal \* N_block       |           60 | `n_hydros_with_withdrawal * n_blocks` (line 224)             |         60 | PASS               |
| Generic constraints              | N_generic                     |           50 | `n_generic_constraints` (line 225)                           |         50 | PASS               |
| Benders cuts (pre-allocated)     | N_cuts                        |      10k-15k | `n_cuts_capacity` (line 226)                                 |     15,000 | PASS               |
| **Total Constraints**            |                               | **~17k-22k** |                                                              | **20,788** | PASS               |

**Note 3**: The spec s3.2 table lists AR dynamics (160) and lag fixing (1,920 at AR(12)) as two separate rows summing to 2,080. The calculator combines them into a single field: `n_hydros * (1 + avg_ar_order) = 160 * 7 = 1,120` at AR(6). Algebraic equivalence: `N_hydro + N_hydro * AR_ORDER = N_hydro * (1 + AR_ORDER)`. At AR(6): 160 + 960 = 1,120 = 160 _ 7. At AR(12): 160 + 1,920 = 2,080 = 160 _ 13. No error.

**D3 fix verification**: The spec s3.2 table now correctly shows generation (constant) as `(N_hydro - N_fpha) * N_block = (160 - 50) * 3 = 330`, matching the calculator's `(n_hydros - n_hydros_with_fpha) * n_blocks = 330` (line 217). The D3 discrepancy from findings-003 is confirmed FIXED.

**Row sum verification at AR(6)**: 18 + 160 + 160 + 960 + 330 + 1,500 + 480 + 960 + 480 + 480 + 150 + 60 + 50 + 15,000 = 20,788. Matches calculator exactly.

**Row sum verification at AR(12)**: 18 + 160 + 160 + 1,920 + 330 + 1,500 + 480 + 960 + 480 + 480 + 150 + 60 + 50 + 15,000 = 21,748. Active = 6,748. Within the stated range "~17,000-22,000".

---

### Section 3.3: Counting Formulas Line-by-Line Comparison

#### Variables (s3.3 lines 112-124 vs calculator lines 197-211)

| #   | Spec Formula (s3.3)                                         | Calculator Code (lp_sizing.py)                                                     | Algebraically Equivalent? |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------- |
| 1   | `1` (theta)                                                 | `1` (line 197)                                                                     | YES -- identical          |
| 2   | `N_BUS * N_BLOCK * (AVG_DEF_SEGMENTS + 1)` (deficit+excess) | `n_buses * n_blocks * avg_deficit_segments` + `n_buses * n_blocks` (lines 198-199) | YES -- factored form      |
| 3   | `2 * N_LINE * N_BLOCK` (exchange)                           | `2 * n_lines * n_blocks` (line 200)                                                | YES -- identical          |
| 4   | `N_HYDRO` (storage)                                         | `n_hydros` (line 201)                                                              | YES -- identical          |
| 5   | `N_HYDRO * AR_ORDER` (inflow model)                         | `n_hydros * avg_ar_order` (line 202)                                               | YES -- identical          |
| 6   | `N_HYDRO * N_BLOCK * 4` (q, s, g, inflow)                   | `n_hydros * n_blocks * 4` (line 203)                                               | YES -- identical          |
| 7   | `N_HYDRO_DIV * N_BLOCK` (diversion)                         | `n_hydros_with_diversion * n_blocks` (line 204)                                    | YES -- identical          |
| 8   | `N_HYDRO_EVAP * N_BLOCK` (evaporation)                      | `n_hydros_with_evaporation * n_blocks` (line 205)                                  | YES -- identical          |
| 9   | `N_HYDRO_WITHDRAWAL * N_BLOCK` (withdrawal)                 | `n_hydros_with_withdrawal * n_blocks` (line 206)                                   | YES -- identical          |
| 10  | `N_HYDRO * N_BLOCK * N_SLACK_TYPES` (slacks)                | `n_hydros * n_blocks * n_slack_types` (line 207)                                   | YES -- identical          |
| 11  | `N_THERMAL * N_BLOCK * AVG_COST_SEGMENTS` (thermal)         | `n_thermals * n_blocks * avg_thermal_segments` (line 208)                          | YES -- identical          |
| 12  | `(N_CONTRACT_IMP + N_CONTRACT_EXP) * N_BLOCK` (contracts)   | `(n_contracts_import + n_contracts_export) * n_blocks` (line 209)                  | YES -- identical          |
| 13  | `N_PUMP * N_BLOCK * 2` (pumping)                            | `n_pumps * n_blocks * 2` (line 210)                                                | YES -- identical          |

**Battery**: The calculator also includes `n_batteries * (1 + n_blocks * 2)` (line 211), which evaluates to 0 since batteries are deferred. The spec s3.3 does not include a battery variable term (consistent with deferred status). No discrepancy.

**Evaluation**: s3.3 N_VAR formula at default AR(6) parameters: 1 + 72 + 60 + 160 + 960 + 1,920 + 30 + 150 + 60 + 2,880 + 585 + 15 + 30 = 6,923. Matches calculator.

#### Constraints (s3.3 lines 130-143 vs calculator lines 214-226)

| #   | Spec Formula (s3.3)                                 | Calculator Code (lp_sizing.py)                               | Algebraically Equivalent? |
| --- | --------------------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| 1   | `N_BUS * N_BLOCK` (load balance)                    | `n_buses * n_blocks` (line 214)                              | YES -- identical          |
| 2   | `N_HYDRO` (water balance)                           | `n_hydros` (line 215)                                        | YES -- identical          |
| 3   | `N_HYDRO` (AR dynamics)                             | part of `n_hydros * (1 + avg_ar_order)` (line 216)           | YES -- see note below     |
| 4   | `N_HYDRO * AR_ORDER` (lagged fixing)                | part of `n_hydros * (1 + avg_ar_order)` (line 216)           | YES -- see note below     |
| 5   | `(N_HYDRO - N_HYDRO_FPHA) * N_BLOCK` (gen constant) | `(n_hydros - n_hydros_with_fpha) * n_blocks` (line 217)      | YES -- identical          |
| 6   | `N_HYDRO_FPHA * N_BLOCK * AVG_FPHA_PLANES` (FPHA)   | `n_hydros_with_fpha * n_blocks * avg_fpha_planes` (line 218) | YES -- identical          |
| 7   | `N_HYDRO * N_BLOCK` (outflow definition)            | `n_hydros * n_blocks` (line 219)                             | YES -- identical          |
| 8   | `N_HYDRO * N_BLOCK * 2` (outflow bounds)            | `2 * n_hydros * n_blocks` (line 220)                         | YES -- identical          |
| 9   | `N_HYDRO * N_BLOCK` (turbined min)                  | `n_hydros * n_blocks` (line 221)                             | YES -- identical          |
| 10  | `N_HYDRO * N_BLOCK` (generation min)                | `n_hydros * n_blocks` (line 222)                             | YES -- identical          |
| 11  | `N_HYDRO_EVAP * N_BLOCK` (evaporation)              | `n_hydros_with_evaporation * n_blocks` (line 223)            | YES -- identical          |
| 12  | `N_HYDRO_WITHDRAWAL * N_BLOCK` (withdrawal)         | `n_hydros_with_withdrawal * n_blocks` (line 224)             | YES -- identical          |
| 13  | `N_GENERIC` (generic constraints)                   | `n_generic_constraints` (line 225)                           | YES -- identical          |
| 14  | `N_CUT_CAPACITY` (Benders cuts)                     | `n_cuts_capacity` (line 226)                                 | YES -- identical          |

**AR dynamics note**: The spec s3.3 uses two separate terms: `+ N_HYDRO` (line 132) and `+ N_HYDRO * AR_ORDER` (line 133). The calculator combines these into one field: `n_hydros * (1 + avg_ar_order)` (line 216). Algebraic equivalence: `N_HYDRO + N_HYDRO * AR_ORDER = N_HYDRO * (1 + AR_ORDER)`. This is factoring, not a discrepancy.

**Evaluation**: s3.3 N_CON formula at default AR(6) parameters: 18 + 160 + 160 + 960 + 330 + 1,500 + 480 + 960 + 480 + 480 + 150 + 60 + 50 + 15,000 = 20,788. Matches calculator.

#### State Dimension (s3.3 lines 149-152 vs calculator lines 229-232)

| #   | Spec Formula (s3.3)                          | Calculator Code (lp_sizing.py)            | Algebraically Equivalent? |
| --- | -------------------------------------------- | ----------------------------------------- | ------------------------- |
| 1   | `N_HYDRO` (storage)                          | `n_hydros` (line 229)                     | YES -- identical          |
| 2   | `SUM(AR_ORDER[h] for h in HYDROS)` (AR lags) | `n_hydros * avg_ar_order` (line 230)      | YES -- see note           |
| 3   | `# + N_BATTERY (deferred C.2)`               | `n_batteries` (line 231)                  | YES -- both zero          |
| 4   | `# + SUM(GNL_LAG[t] ...)  (deferred C.1)`    | `n_gnl_thermals * avg_gnl_lag` (line 232) | YES -- both zero          |

**AR lags note**: The spec uses the exact formulation `SUM(AR_ORDER[h] for h in HYDROS)` while the calculator uses the approximation `n_hydros * avg_ar_order`. These are equal when all hydros share the same AR order, and the calculator's `avg_ar_order` parameter is designed as a weighted average for this purpose. At default AR(6): 160 _ 6 = 960. At worst-case AR(12): 160 _ 12 = 1,920. Both match the spec's worked examples.

---

### Section 2.1: State Dimension Formulas and Examples

| Item                         | Spec Value (s2.1)                           | Calculator Value                                  | Match |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------- | ----- |
| State formula (general)      | N_hydro + sum(P_h) + N_battery + sum(L_gnl) | storage + ar_lags + battery + gnl (lines 182-188) | PASS  |
| State formula (current impl) | N_hydro + sum(P_h)                          | 160 + 960 = 1,120                                 | PASS  |
| Storage component            | 160 (line 52)                               | 160 (line 229)                                    | PASS  |
| AR lags worst case           | 160 \* 12 = 1,920 (line 53)                 | Would be 1,920 at AR(12)                          | PASS  |
| Total worst case             | 2,080 (line 54)                             | Would be 2,080 at AR(12)                          | PASS  |
| AR lags typical              | 160 \* 6 = 960 (line 56)                    | 960 (line 230)                                    | PASS  |
| Total typical                | 1,120 (line 56)                             | 1,120 (state_dimension)                           | PASS  |

**Verdict**: All state dimension formulas and numeric examples in s2.1 match the calculator. The worst-case (AR(12) = 2,080) and typical (AR(6) = 1,120) are both correctly documented with an explicit note explaining the relationship.

---

### D1/D2/D3 Fix Verification

The three discrepancies found in findings-003 were fixed in ticket-005. This section confirms each fix.

| ID  | Original Issue (findings-003)                                                                 | Current State (post-fix)                                                                                                 | Fixed? |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| D1  | s3.1 table missing per-block inflow variable row (480 vars)                                   | Row "Hydro inflow (per-block)" present at line 73 with correct formula and value                                         | YES    |
| D2  | s3.1 pumping formula missing \* 2 multiplier (15 instead of 30)                               | Row "Pumping (flow + power)" at line 80 now shows `N_pump * N_block * 2 = 5 * 3 * 2 = 30`                                | YES    |
| D3  | s3.2 and s3.3 gen constant used `N_hydro * N_block` instead of `(N_hydro - N_fpha) * N_block` | s3.2 line 91: `(N_hydro - N_fpha) * N_block = (160 - 50) * 3 = 330`; s3.3 line 134: `(N_HYDRO - N_HYDRO_FPHA) * N_BLOCK` | YES    |

---

### Explained Variance (Not Errors)

| ID  | Description                                                   | Spec Value      | Calculator Value  | Explanation                                  |
| --- | ------------------------------------------------------------- | --------------- | ----------------- | -------------------------------------------- |
| E1  | s3.1 AR lag variables: worst-case vs typical                  | 1,920 (AR(12))  | 960 (AR(6))       | s3.4 note (line 167) explicitly documents    |
| E2  | s3.2 AR dynamics + lag fixing: worst-case vs typical          | 2,080 (AR(12))  | 1,120 (AR(6))     | Same AR(12) vs AR(6) difference              |
| E3  | s3.1 total "~7,500" vs calculator 6,923                       | ~7,500 (approx) | 6,923 (AR(6))     | Explicit approximation; exact AR(12) = 7,883 |
| E4  | Contract split: notation-conventions 5 each vs calculator 3+2 | 5 total in s3.1 | 3 imp + 2 exp = 5 | Known from findings-003; total matches       |

---

### Acceptance Criteria Checklist

- [x] Calculator run with default config matches s3.4 headline values exactly (6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts/stage)
- [x] Every s3.1 variable row formula/count verified against calculator -- all PASS or EXPLAINED VARIANCE
- [x] Every s3.2 constraint row formula/count verified against calculator -- all PASS or EXPLAINED VARIANCE
- [x] Section 3.3 formulas algebraically equivalent to `calculate_sizing()` line by line -- all 13 variable terms and 14 constraint terms verified
- [x] Section 2.1 state dimension formulas and examples match calculator -- worst-case 2,080 and typical 1,120 both confirmed
- [x] D1/D2/D3 from findings-003 confirmed FIXED in current spec

### Overall Verdict

**CLEAN** -- No remaining discrepancies between `production-scale-reference.md` and the LP sizing calculator output. All D1/D2/D3 fixes from ticket-005 are confirmed. All formulas in s3.3 are algebraically identical to the calculator's `calculate_sizing()` function. The AR(12) vs AR(6) differences in s3.1/s3.2 typical counts are documented explained variance, not errors.
