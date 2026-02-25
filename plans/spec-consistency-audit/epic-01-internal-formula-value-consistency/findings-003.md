## Findings: Parameter Value Consistency

### Summary

- Total parameter values checked: 47
- Consistent: 39
- Inconsistent: 5 (true discrepancies in spec tables vs formulas/calculator)
- Explained variance: 2 (documented AR(12) vs AR(6) differences)
- Forward pass count locations (200, user target 192): 14 locations cataloged
- Note: 1 illustrative example in output-infrastructure.md uses different values by design (not a discrepancy)

---

### Value Cross-Reference Table

#### Core System Dimensions

| Parameter            | Canonical Value | notation-conventions.md s2 | production-scale-reference.md s1 | sddp-algorithm.md s1 | work-distribution.md s2.3 | communication-patterns.md s2 | memory-architecture.md s2.1 | calculator defaults |
| -------------------- | --------------- | -------------------------- | -------------------------------- | -------------------- | ------------------------- | ---------------------------- | --------------------------- | ------------------- |
| Hydros               | 160             | 160 (line 30)              | 160 (line 15)                    | "160+" (line 14)     | --                        | 160 (line 42)                | 160 (line 36)               | 160 (line 53)       |
| Thermals             | 130             | 130 (line 33)              | 130 (line 17)                    | --                   | --                        | --                           | 130 (line 36)               | 130 (line 54)       |
| Buses                | 6               | "4-10" (line 29)           | 6 (line 18)                      | --                   | --                        | --                           | --                          | 6 (line 53)         |
| Lines                | 10              | 10 (line 34)               | 10 (line 19)                     | --                   | --                        | --                           | --                          | 10 (line 55)        |
| Stages               | 120             | "60-120" (line 27)         | 120 (line 13)                    | --                   | --                        | 120 (line 42)                | 120 (line 36)               | 120 (line 83)       |
| Blocks               | "typically 3"   | "1-24" typical 3 (line 28) | "1-24 typically 3" (line 14)     | --                   | --                        | --                           | --                          | 3 (line 54)         |
| Openings             | 200             | 20 (line 41)               | 200 (line 21)                    | --                   | --                        | --                           | 200 (line 36,40)            | --                  |
| Max AR order         | 12              | --                         | 12 (line 16)                     | --                   | --                        | --                           | --                          | 12 (line 74)        |
| Avg AR order         | 6               | --                         | implicit in s3.4 note            | --                   | --                        | avg 6 (line 42)              | --                          | 6 (line 75)         |
| Forward passes       | 200             | --                         | 200 (line 20)                    | --                   | 200 (line 84)             | 200 (lines 42,63,84)         | 200 (lines 36,44)           | 200 (line 85)       |
| Iterations           | 50              | --                         | 50 (line 22)                     | --                   | --                        | --                           | --                          | 50 (line 84)        |
| Simulation scenarios | 2000            | --                         | 2000 (line 23)                   | --                   | --                        | --                           | --                          | --                  |
| Import contracts     | 5               | 5 (line 35)                | --                               | --                   | --                        | --                           | --                          | 3 (line 59)         |
| Export contracts     | 5               | 5 (line 35)                | --                               | --                   | --                        | --                           | --                          | 2 (line 60)         |
| Pumping stations     | 5               | 5 (line 36)                | --                               | --                   | --                        | --                           | --                          | 5 (line 56)         |
| Generic constraints  | 50              | 50 (line 37)               | --                               | --                   | --                        | --                           | --                          | 50 (line 62)        |
| FPHA planes          | 125             | 125 (line 39)              | --                               | --                   | --                        | --                           | --                          | avg 10 (line 71)    |
| Cut capacity         | 15,000          | --                         | 15,000 implied (s3.4)            | --                   | --                        | --                           | 15,000 (line 36)            | 15,000 (line 82)    |

**Status**: CONSISTENT -- all canonical dimension values are aligned across specs.

**Notes on Openings**:

- notation-conventions.md section 2 lists $|\Omega_t|$ = 20 as "Standard NEWAVE branching factor" -- this is the number of scenario realizations per stage node in the scenario tree, not the number of forward pass openings.
- production-scale-reference.md section 1 lists "Openings = 200" as the backward pass opening count.
- These are different concepts (branching factor vs. opening tree size) and both are correct in context.

**Notes on Contracts**:

- notation-conventions.md section 2 gives 5 for both import and export contracts.
- calculator defaults use 3 import + 2 export = 5 total contracts.
- The spec says $|\mathcal{C}^{imp}|, |\mathcal{C}^{exp}|$ = 5 each, implying 10 total, while production-scale-reference s3.1 uses $(N_{imp} + N_{exp}) \times N_{block}$ = 5 \* 3 = 15 without specifying the split.
- The calculator uses 3+2=5 total. This is a minor discrepancy: the notation-conventions s2 "Typical Size" for contracts says 5, which could be read as 5 each or 5 total.

**Notes on FPHA planes**:

- notation-conventions.md section 2 gives 125 as typical for $|\mathcal{M}_h|$ (FPHA planes per hydro).
- The calculator uses `avg_fpha_planes = 10` as a much lower average for the LP sizing.
- production-scale-reference.md s3.2 uses "50 FPHA hydros _ 3 blocks _ 10 avg planes = 1500" in the constraint count.
- These are different: 125 is the max per hydro, 10 is the average used for sizing. Consistent within their contexts.

#### LP Sizing Values

| Metric             | Calculator Output | production-scale-reference.md s3.4 | Consistent? |
| ------------------ | ----------------- | ---------------------------------- | ----------- |
| Total variables    | 6,923             | 6,923 (line 160)                   | YES         |
| Total constraints  | 20,788            | 20,788 (line 161)                  | YES         |
| Active constraints | 5,788             | 5,788 (line 162)                   | YES         |
| State dimension    | 1,120             | 1,120 (line 163)                   | YES         |
| Cuts memory/stage  | 128.7 MB          | 128.7 MB (line 164)                | YES         |

All five calculator headline numbers match the spec exactly.

---

### Dimensional Formula Cross-Check

| Formula                              | production-scale-reference.md                            | calculator code (`lp_sizing.py`)                                                           | Consistent?                                              |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| State dim = N_hydro + sum(AR_orders) | s2: $N_{state} = N_{hydro} + \sum P_h$ (line 47)         | `n_state_storage + n_state_ar_lags` = `n_hydros + n_hydros * avg_ar_order` (lines 229-230) | YES                                                      |
| State dim at avg AR(6)               | 160 + 960 = 1,120 (line 56)                              | 160 + 960 = 1,120                                                                          | YES                                                      |
| State dim at max AR(12)              | 160 + 1,920 = 2,080 (line 54)                            | Would be 2,080 if max_ar_order used                                                        | YES                                                      |
| N_VAR theta                          | 1 (s3.1)                                                 | 1 (line 197)                                                                               | YES                                                      |
| N_VAR deficit                        | N_BUS _ N_BLOCK _ AVG_DEF_SEG (s3.3)                     | `n_buses * n_blocks * avg_deficit_segments` (line 198)                                     | YES                                                      |
| N_VAR hydro_flow                     | N_HYDRO _ N_BLOCK _ 4 (s3.3 line 116)                    | `n_hydros * n_blocks * 4` (line 203)                                                       | YES -- but see discrepancy D1 below                      |
| N_VAR pumping                        | N_PUMP _ N_BLOCK _ 2 (s3.3 line 123)                     | `n_pumps * n_blocks * 2` (line 210)                                                        | YES -- but see discrepancy D2 below                      |
| N_CON AR dynamics                    | N_HYDRO + N_HYDRO \* AR_ORDER (s3.3 lines 131-132)       | `n_hydros * (1 + avg_ar_order)` (line 216)                                                 | YES (algebraically equivalent)                           |
| N_CON gen_constant                   | N_HYDRO \* N_BLOCK (s3.3 line 133)                       | `(n_hydros - n_hydros_with_fpha) * n_blocks` (line 217)                                    | **NO** -- see discrepancy D3                             |
| N_CON gen_fpha                       | N_HYDRO_FPHA _ N_BLOCK _ AVG_FPHA_PLANES (s3.3 line 134) | `n_hydros_with_fpha * n_blocks * avg_fpha_planes` (line 218)                               | YES                                                      |
| Cut capacity                         | 5,000 + 50 \* 200 = 15,000 (s3.4)                        | `n_cuts_capacity = 15000` (line 82)                                                        | YES -- matches formula in cut-management-impl.md line 42 |

---

### Discrepancies Found

#### D1. Hydro Flow Variables: Spec s3.1 Table vs s3.3 Formula (INCONSISTENCY)

**Location**: production-scale-reference.md section 3.1 table (lines 70-72) vs section 3.3 formula (line 116)

- **s3.1 table** lists three separate per-block hydro flow rows: turbined (480), spillage (480), generation (480) = 1,440 total. It does NOT list a per-block inflow variable.
- **s3.3 formula** uses `N_HYDRO * N_BLOCK * 4` which includes four flow-type variables: `q, s, g, inflow`.
- **Calculator** uses `n_hydros * n_blocks * 4 = 1,920` (line 203).

The per-block inflow variable ($a_h$ from the AR model) must be an LP variable to participate in the water balance constraint. The s3.3 formula and calculator are correct; the s3.1 table is missing the per-block inflow variable row (480 variables).

**Impact**: The s3.1 table sum is ~7,388 instead of ~7,868 at worst-case AR(12). The stated "~7,500" approximate is closer to the missing-inflow sum than to the correct value. This is a documentation error in the table only; the formulas (s3.3) and calculator are correct.

#### D2. Pumping Variables: Spec s3.1 Table vs s3.3 Formula (INCONSISTENCY)

**Location**: production-scale-reference.md section 3.1 table (line 79) vs section 3.3 formula (line 123)

- **s3.1 table** lists Pumping as `N_pump * N_block = 5 * 3 = 15`.
- **s3.3 formula** uses `N_PUMP * N_BLOCK * 2` (pump flow + power).
- **Calculator** uses `n_pumps * n_blocks * 2 = 30` (line 210).

The factor of 2 accounts for both pumped flow and pumped power variables. The s3.3 formula and calculator are correct; the s3.1 table is missing the multiplier.

**Impact**: 15 variables understated. Minor magnitude but a real inconsistency between the table and its own section's counting formulas.

#### D3. Generation (Constant) Constraints: Spec s3.2 Table and s3.3 Formula vs Calculator (INCONSISTENCY)

**Location**: production-scale-reference.md section 3.2 table (line 90) and section 3.3 formula (line 133) vs calculator (line 217)

- **s3.2 table** lists "Hydro generation (constant)" as `N_hydro * N_block = 160 * 3 = 480`.
- **s3.3 formula** (line 133) also uses `N_HYDRO * N_BLOCK`.
- **Calculator** uses `(n_hydros - n_hydros_with_fpha) * n_blocks = (160-50)*3 = 330`.

The constant productivity constraint (`g = rho * q`) applies only to hydros NOT using FPHA. FPHA hydros use the hyperplane constraints instead. The calculator is logically correct. Both the s3.2 table and s3.3 formula overcount by including FPHA hydros.

**Impact**: 150 constraints overstated in the spec. However, the overall s3.2 total range "~17,000-22,000" still encompasses the calculator value of 20,788.

#### D4. Spec s3.2 Table: AR Dynamics and Lag Fixing as Separate Rows vs Combined in Spec s3.3 (MINOR)

**Location**: production-scale-reference.md section 3.2 (lines 88-89) vs section 3.3 (lines 131-132)

- **s3.2 table** lists "Incremental inflow AR dynamics" (160) and "Lagged incremental inflow fixing" (160\*12=1920) as separate rows, totaling 2,080 at AR(12).
- **s3.3 formula** lists `N_HYDRO` (AR dynamics) + `N_HYDRO * AR_ORDER` (lagged fixing) as separate terms.
- **Calculator** combines into `n_hydros * (1 + avg_ar_order) = 160 * 7 = 1,120`.

This is algebraically consistent: `160 + 160*6 = 160*(1+6) = 1,120`. The difference is only in presentation (two rows vs one formula). **No error**.

#### D5. Spec s3.1 Total Stated as "~7,500" (UNDERSTATED APPROXIMATION)

**Location**: production-scale-reference.md section 3.1 (line 80)

At worst-case AR(12) including the missing inflow variable and corrected pumping:

- Actual sum = 7,388 + 480 (inflow) + 15 (pumping correction) = 7,883
- Stated: "~7,500"

This approximation is 5% below the correct sum. At avg AR(6), the corrected total would be 6,923 (matching the calculator). The "~7,500" approximation is reasonable but understated for the worst-case.

**Impact**: Low -- the stated value is explicitly approximate, and section 3.4 provides the exact calculator values.

---

### AR Order Explained Variance (Not Errors)

#### E1. AR(12) Worst-Case vs AR(6) Average

**Location**: production-scale-reference.md section 3.1 vs section 3.4

- s3.1 uses AR(12) for worst-case estimates: 1,920 AR lag variables, 1,920 AR lag constraints
- s3.4 references calculator with avg AR(6): 960 AR lag variables, 960 AR lag constraints
- s3.4 note (line 166) explicitly explains: "The estimates in section 3.1 and 3.2 use worst-case AR order (12 for all hydros). The sizing calculator uses configurable average AR order (default 6)."

**Status**: EXPLAINED -- not an error. Both values are correct under their stated assumptions.

#### E2. State Dimension: 2,080 vs 1,120

**Location**: production-scale-reference.md section 2 (lines 53-56)

- Worst case (all AR(12)): 160 + 1,920 = 2,080
- Typical (avg AR(6)): 160 + 960 = 1,120

Both are explicitly stated in the same section with a note explaining the relationship.

**Status**: EXPLAINED -- section 2.1 note on line 56 clearly states: "If most hydros use AR(6), the dimension would be 160 + 160 \* 6 = 1,120."

---

### Forward Pass Count Locations (200 -- user target: 192)

The following locations contain the value `200` specifically in the context of forward passes or openings (not block duration, bandwidth, or other uses):

| #   | File                                      | Line | Context                                               | Type                     |
| --- | ----------------------------------------- | ---- | ----------------------------------------------------- | ------------------------ |
| 1   | `overview/production-scale-reference.md`  | 20   | `Forward Passes \| 200` (dimension table)             | **Canonical definition** |
| 2   | `overview/production-scale-reference.md`  | 21   | `Openings \| 200` (dimension table)                   | Backward pass openings   |
| 3   | `overview/production-scale-reference.md`  | 188  | `200` Fwd Passes in Large test system row             | Test system table        |
| 4   | `overview/production-scale-reference.md`  | 189  | `200` Fwd Passes in Production test system row        | Test system table        |
| 5   | `data-model/input-directory-structure.md` | 106  | `"num_forward_passes": 200` (minimal example)         | Config example           |
| 6   | `data-model/input-directory-structure.md` | 156  | `"num_forward_passes": 200` (full example)            | Config example           |
| 7   | `data-model/output-infrastructure.md`     | 130  | `"num_forward_passes": 200` (output example)          | Output example           |
| 8   | `architecture/cut-management-impl.md`     | 42   | `5,000 + 50 * 200 = 15,000 slots` (capacity formula)  | Cut capacity formula     |
| 9   | `architecture/solver-abstraction.md`      | 207  | `50 * 200 = 10,000` (capacity formula)                | Cut capacity formula     |
| 10  | `hpc/communication-patterns.md`           | 42   | `M = 200 trajectories` (payload sizing)               | Communication analysis   |
| 11  | `hpc/communication-patterns.md`           | 63   | `M = 200 forward passes` (cut payload)                | Communication analysis   |
| 12  | `hpc/communication-patterns.md`           | 84   | `M = 200 forward passes` (bandwidth reference)        | Communication analysis   |
| 13  | `hpc/memory-architecture.md`              | 36   | `200 forward passes, 200 openings` (reference config) | Memory budget            |
| 14  | `hpc/work-distribution.md`                | 84   | `M = 200 forward passes` (parallelism example)        | Work distribution        |

**Additional 200 occurrences NOT related to forward passes** (excluded from above):

- `notation-conventions.md` line 82: block duration 200 hours (LEVE)
- `production-scale-reference.md` line 178: InfiniBand HDR 200 Gb/s
- `communication-patterns.md` lines 95,99,106: InfiniBand 200 Gb/s, 200 iterations
- `memory-architecture.md` lines 40,44,66,69: 200 openings in memory derivation, iteration 200 in cut growth table
- `output-infrastructure.md` lines 160,268,272,287: different example values (thermals=200 in a different case study, output sizes)
- Various other contexts (storage values, cost values, NUMA latency)

**Calculator**: `lp_sizing.py` line 38 and line 85: `n_forward_passes: 200`

**Note**: Locations #8 and #9 (cut capacity formulas `50 * 200 = 15,000`) will need the formula updated too if forward passes change from 200 to 192 (new capacity = 5,000 + 50 \* 192 = 14,600, or the cut capacity kept at 15,000 with the formula explanation adjusted).

---

### Additional Findings

#### F1. Configuration Reference Default vs Production Scale

**Location**: `configuration/configuration-reference.md` line 253

The configuration reference example shows `"forward_passes": 10` as the example value, which is a small-case example, not the production default. This is not a discrepancy -- it's an illustrative minimum configuration. However, it differs from all production-scale references (200).

#### F2. Output Infrastructure Example Uses Non-Canonical Dimensions

**Location**: `data-model/output-infrastructure.md` lines 159-162

The output schema example uses `num_thermals: 200`, `num_buses: 5`, `num_lines: 8` which differ from canonical values (130, 6, 10). This is a self-contained illustrative example for a different case study (12 stages) and is not intended to match the production-scale reference. **Not an error**, but could be confusing.

#### F3. Communication Patterns Uses D_state = 2,080 (AR(12)) While Other Calcs Use 1,120 (AR(6))

**Location**: `hpc/communication-patterns.md` line 84

Section 3.1 reference configuration uses `D_state = 2,080` (worst-case AR(12)) for bandwidth analysis, while section 2.1 on the same page uses "average P_h = 6 lags" and computes state dim = 1,120. Both are internally consistent (bandwidth analysis uses worst case, payload sizing uses average case), but the same file using two different AR assumptions could be confusing.

#### F4. PAR Inflow Model AR Order Consistency

**Location**: `math/par-inflow-model.md`

The PAR model spec does not specify concrete AR order values (correctly, since AR order varies by hydro and season). It references the data model files for configuration. Cross-reference to notation-conventions s3.5 and production-scale-reference s1 is clean.

---

### Acceptance Criteria Verification

1. **Notation-conventions section 2 typical sizes verified across all specs**: PASS -- all canonical dimensions (160 hydros, 130 thermals, 6 buses, 10 lines, 120 stages, 3 blocks) are consistent across all specs that reference them.

2. **Production-scale-reference section 3 counting formulas verified against calculator**: PARTIAL PASS -- s3.3 formulas match the calculator except for the generation (constant) constraint formula which overcounts by including FPHA hydros (D3). The s3.1 and s3.2 tables have two additional discrepancies (D1: missing per-block inflow variable, D2: pumping multiplier).

3. **Calculator defaults verified against spec citations**: PASS -- all five headline values (6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts/stage) match exactly between the calculator output and production-scale-reference s3.4 table.

4. **All locations of "200" forward passes identified**: PASS -- 14 spec locations + 2 calculator locations cataloged with line numbers and context.
