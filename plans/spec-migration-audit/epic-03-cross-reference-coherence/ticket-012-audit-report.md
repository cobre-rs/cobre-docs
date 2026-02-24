# Ticket-012 Audit Report: Algorithm Reference Pages vs Formal Specs

**Date**: 2026-02-24
**Scope**: 13 algorithm reference pages in `src/algorithms/` audited against formal specs in `src/specs/math/`, `src/specs/architecture/`, `src/specs/deferred.md`, and `src/specs/overview/notation-conventions.md`.

---

## 1. Summary Table

| Algorithm Page           | Formulas Checked | Formulas OK | Claims Checked | Claims OK | Further Reading OK | Verdict  |
| ------------------------ | ---------------: | ----------: | -------------: | --------: | ------------------ | -------- |
| `sddp-theory.md`         |                1 |           1 |              2 |         2 | OK (0 issues)      | PASS     |
| `benders.md`             |                3 |           2 |              0 |         0 | OK (0 issues)      | 1 MEDIUM |
| `forward-backward.md`    |                0 |           0 |              2 |         2 | 1 MEDIUM           | 1 MEDIUM |
| `convergence.md`         |                3 |           3 |              0 |         0 | OK (0 issues)      | PASS     |
| `stochastic-modeling.md` |                1 |           1 |              0 |         0 | OK (0 issues)      | PASS     |
| `par-model.md`           |                2 |           2 |              0 |         0 | OK (0 issues)      | PASS     |
| `spatial-correlation.md` |                1 |           1 |              0 |         0 | OK (0 issues)      | PASS     |
| `scenario-generation.md` |                1 |           1 |              1 |         1 | OK (0 issues)      | PASS     |
| `cut-management.md`      |                1 |           1 |              1 |         1 | OK (0 issues)      | PASS     |
| `single-multi-cut.md`    |                2 |           2 |              1 |         1 | OK (0 issues)      | PASS     |
| `cut-selection.md`       |                1 |           1 |              0 |         0 | OK (0 issues)      | PASS     |
| `risk-measures.md`       |                1 |           1 |              1 |         1 | OK (0 issues)      | PASS     |
| `cvar.md`                |                2 |           2 |              0 |         0 | 1 MEDIUM           | 1 MEDIUM |

**Totals**: 19 formulas checked (18 OK, 1 MEDIUM notation issue); 8 claims checked (8 OK); 2 Further Reading issues (MEDIUM).

---

## 2. Per-Page Formula Audit

### 2.1 `sddp-theory.md`

| #   | Formula (algorithm page)                                        | Formal Spec Counterpart                                                          | Verdict |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| F1  | `gap^k = (z_bar^k - z_under^k) / max(1, \|z_bar^k\|)` (line 34) | `sddp-algorithm.md` SS3.3: `gap^k = (z_bar^k - z_under^k) / max(1, \|z_bar^k\|)` | MATCH   |

**Notes**: The gap formula in `sddp-theory.md` is identical to the one in `sddp-algorithm.md` SS3.3. The `stopping-rules.md` SS7 output table shows a slightly different formula for `gap_percent`: `(z_bar - z_under) / |z_bar| x 100` (without `max(1, ...)`). However, that is a display field for termination output, not the convergence test formula itself, so there is no contradiction. The algorithm reference page correctly uses the `max(1, ...)` form from the main spec.

### 2.2 `benders.md`

| #   | Formula (algorithm page)                                                             | Formal Spec Counterpart                                                                   | Verdict               |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------- |
| F2  | Stage LP: `min c_t^T x_t + theta_t` s.t. `A_t x_t = b_t - E_t x_{t-1}` (lines 13-18) | `sddp-algorithm.md` SS2: `A_t x_t = b_t - E_t x_{t-1}`                                    | MATCH                 |
| F3  | Cut: `V_{t+1}(x_t) = max_i { alpha_i + beta_i^T x_t }` (lines 29-31)                 | `cut-management.md` SS1: `theta >= alpha + sum beta^v_h v_h + sum beta^lag a_{h,l}`       | MATCH (simplified)    |
| F4  | Slope: `beta = E_{t+1}^T pi^*` (line 35)                                             | `notation-conventions.md` SS5.4: `beta^v_h = pi^wb_h` (direct, no matrix multiply needed) | **MEDIUM** (see F-16) |

**Notes on F4**: The algorithm page uses the textbook SDDP notation `beta = E_{t+1}^T pi^*` where `E_{t+1}` is the state-transition matrix. The formal spec (`notation-conventions.md` SS5.4) shows that because the LP is formulated with incoming state on the RHS with coefficient +1, the cut coefficient equals the dual directly: `beta^v_h = pi^wb_h`. These are mathematically equivalent -- the textbook form implicitly includes the +1 coefficient matrix. The algorithm page's notation is correct in the abstract but uses a different convention (matrix `E`) than the spec's direct-dual convention. This is a notation inconsistency, not a mathematical contradiction.

### 2.3 `forward-backward.md`

No formulas in this page (it is purely prose). No formula audit needed.

### 2.4 `convergence.md`

| #   | Formula (algorithm page)                                                                    | Formal Spec Counterpart                                                                       | Verdict                                                                |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| F5  | Lower bound: `z_under^k = c_1^T x_hat_1^k + theta_1^k` (line 11)                            | `sddp-algorithm.md` SS3.3: `z_under^k = V_1^k(x) = min { c_1^T x_1 + theta_1 : constraints }` | MATCH (equivalent; the algorithm page uses the optimal solution value) |
| F6  | Upper bound: `z_bar^k = (1/M) sum_m sum_t c_t^T x_hat_t^{k,m}` (line 20)                    | `sddp-algorithm.md` SS3.3: `z_bar^k = (1/M) sum_m sum_t c_t^T x_t^{(m)}`                      | MATCH                                                                  |
| F7  | Gap: `gap^k = (z_bar^k - z_under^k) / max(1, \|z_bar^k\|)` (line 32)                        | `sddp-algorithm.md` SS3.3: identical formula                                                  | MATCH                                                                  |
| F8  | Bound stalling: `Delta_k = (z_under^k - z_under^{k-tau}) / max(1, \|z_under^k\|)` (line 54) | `stopping-rules.md` SS4: `Delta_k = (z_under^k - z_under^{k-tau}) / max(1, \|z_under^k\|)`    | MATCH                                                                  |

### 2.5 `stochastic-modeling.md`

| #   | Formula (algorithm page)                                                                                     | Formal Spec Counterpart                      | Verdict |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------- |
| F9  | PAR(p): `a_{h,t} = mu_{m(t)} + sum psi_{m(t),l}(a_{h,t-l} - mu_{m(t-l)}) + sigma_{m(t)} epsilon_t` (line 17) | `par-inflow-model.md` SS1: identical formula | MATCH   |

### 2.6 `par-model.md`

| #   | Formula (algorithm page)                                              | Formal Spec Counterpart                                     | Verdict |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ------- |
| F10 | PAR(p) equation: identical to F9 (line 14)                            | `par-inflow-model.md` SS1                                   | MATCH   |
| F11 | State variables: `(v_{h,t}, a_{h,t-1}, ..., a_{h,t-p_max})` (line 37) | `sddp-algorithm.md` SS5 table and `par-inflow-model.md` SS1 | MATCH   |

### 2.7 `spatial-correlation.md`

| #   | Formula (algorithm page)                        | Formal Spec Counterpart                                                   | Verdict                                                                                                                                                                                                                   |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F12 | PAR(p) with subscript `epsilon_{h,t}` (line 10) | `par-inflow-model.md` SS1: `epsilon_t` (no plant subscript on innovation) | MATCH (acceptable; the page explicitly discusses spatial correlation via correlated innovations, so the plant subscript `h` clarifies that each plant has its own residual, which is exactly how the spatial model works) |

### 2.8 `scenario-generation.md`

| #   | Formula (algorithm page)                                                                                 | Formal Spec Counterpart                                                      | Verdict                       |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------- |
| F13 | Informal AR expression: `a_{h,t} = deterministic base + lag contribution + sigma_{m(t)} eta_t` (line 41) | `par-inflow-model.md` SS3 / `lp-formulation.md` SS5: identical decomposition | MATCH (simplified prose form) |

### 2.9 `cut-management.md`

| #   | Formula (algorithm page)                                                          | Formal Spec Counterpart            | Verdict |
| --- | --------------------------------------------------------------------------------- | ---------------------------------- | ------- |
| F14 | Cut: `theta >= alpha + sum beta^v_h v_h + sum beta^{lag}_{h,l} a_{h,l}` (line 12) | `cut-management.md` SS1: identical | MATCH   |

### 2.10 `single-multi-cut.md`

| #    | Formula (algorithm page)                                                                             | Formal Spec Counterpart                                                    | Verdict |
| ---- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| F15a | Single-cut aggregation: `alpha_bar = sum p(w) alpha(w)`, `beta_bar = sum p(w) beta(w)` (line 10)     | `cut-management.md` SS3: identical structure with component-wise expansion | MATCH   |
| F15b | Multi-cut: `theta_w >= alpha(w) + beta(w)^T x` with linking `theta = sum p(w) theta_w` (lines 33-37) | `sddp-algorithm.md` SS6.2: `theta_{t-1,w} >= alpha(w) + beta(w)^T x_{t-1}` | MATCH   |

### 2.11 `cut-selection.md`

| #    | Formula (algorithm page)                                                                                 | Formal Spec Counterpart                                                   | Verdict |
| ---- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| F16a | Activity criterion: `cut k active at x_hat iff theta^* - (alpha_k + beta_k^T x_hat) < epsilon` (line 14) | `cut-management.md` SS6: `theta^* - (alpha_k + beta_k^T x_hat) < epsilon` | MATCH   |

### 2.12 `risk-measures.md`

| #   | Formula (algorithm page)                                                                       | Formal Spec Counterpart                  | Verdict |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | ------- |
| F17 | Convex combination: `rho^{lambda,alpha}[Z] = (1-lambda) E[Z] + lambda CVaR_alpha[Z]` (line 20) | `risk-measures.md` (spec) SS3: identical | MATCH   |

### 2.13 `cvar.md`

| #   | Formula (algorithm page)                                                                       | Formal Spec Counterpart                  | Verdict |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | ------- |
| F18 | CVaR: `CVaR_alpha(Z) = min_eta { eta + (1/alpha) E[(Z-eta)^+] }` (line 10)                     | `risk-measures.md` (spec) SS2: identical | MATCH   |
| F19 | Convex combination: `rho^{lambda,alpha}[Z] = (1-lambda) E[Z] + lambda CVaR_alpha[Z]` (line 38) | `risk-measures.md` (spec) SS3: identical | MATCH   |

---

## 3. Per-Page Claim Audit

### Claim 1: "Each iteration adds new cuts, progressively tightening the approximation" (`sddp-theory.md` line 19)

- **Formal spec**: `sddp-algorithm.md` SS3.2 (backward pass) states: "The backward pass produces one new cut per stage per trial point per iteration." SS3.3 states: "This bound increases monotonically as cuts are added."
- **Verdict**: **CONSISTENT**. The claim is a simplified restatement of the spec.

### Claim 2: "Cobre uses the single-cut formulation by default" and "A multi-cut variant is planned for future releases" (`sddp-theory.md` line 64)

- **Formal spec**: `sddp-algorithm.md` SS6: "Cobre implements single-cut by default. Multi-cut is planned for future implementation." `deferred.md` SS C.3: "## C.3 Multi-Cut Formulation -- Status: DEFERRED"
- **Verdict**: **CONSISTENT**.

### Claim 3: "Multiple independent trajectories are simulated in parallel" (`forward-backward.md` line 15 / `sddp-theory.md` line 15)

- **Formal spec**: `sddp-algorithm.md` SS3.1 "Parallelization" note: "Forward trajectories are independent -- Cobre distributes M trajectories across MPI ranks, with OpenMP threads solving individual stage LPs within each rank."
- **Verdict**: **CONSISTENT**.

### Claim 4: "the forward pass LP solution at each stage also provides a warm-start basis for the corresponding backward pass solves" (`forward-backward.md` line 48)

- **Formal spec**: `sddp-algorithm.md` SS3.1 "Warm-starting" note: "The forward pass LP solution at stage t provides a near-optimal basis for the backward pass solves at the same stage, significantly reducing solve times." Also `solver-workspaces.md` SS1.5 and `training-loop.md` SS4.4 confirm basis reuse.
- **Verdict**: **CONSISTENT**.

### Claim 5: "The opening tree is generated once and remains fixed throughout training" (`scenario-generation.md` line 9)

- **Formal spec**: `sddp-algorithm.md` SS3.1 sidebar: refers to "fixed opening tree -- a set of pre-generated noise vectors generated once before training begins." `sddp-algorithm.md` SS3.2 sidebar: "Every scenario omega in Omega_t refers to all N_openings noise vectors in the fixed opening tree for stage t... the same set across all iterations." Also `cut-management.md` SS3 sidebar: "a pre-generated set of branchings created once before training begins."
- **Verdict**: **CONSISTENT**.

### Claim 6: "the first-stage LP objective is not a valid lower bound on the true risk-averse optimal cost" (`risk-measures.md` algorithm page, line 32)

- **Formal spec**: `risk-measures.md` (spec) SS10 "Critical Warning": "The lower bound computed during SDDP training is NOT a valid bound for risk-averse problems."
- **Verdict**: **CONSISTENT**.

### Claim 7: "deactivated cuts are not deleted from memory -- they are relaxed to -infinity" (`cut-management.md` algorithm page, line 33)

- **Formal spec**: `cut-management.md` (spec) SS5: "Cuts are not deleted -- they are deactivated by relaxing their bound to -infinity."
- **Verdict**: **CONSISTENT**.

### Claim 8: multi-cut is deferred (`single-multi-cut.md` line 53)

- **Formal spec**: `deferred.md` SS C.3: "## C.3 Multi-Cut Formulation -- Status: DEFERRED"
- **Verdict**: **CONSISTENT**.

---

## 4. Further Reading / Related Topics Link Audit

### 4.1 `sddp-theory.md`

| #   | Link Text                                       | Target                                                     | Exists | Correct Topic                       | Verdict |
| --- | ----------------------------------------------- | ---------------------------------------------------------- | ------ | ----------------------------------- | ------- |
| 1   | SDDP Algorithm (spec)                           | `../specs/math/sddp-algorithm.md`                          | Yes    | Yes                                 | CORRECT |
| 2   | SDDP Algorithm (spec) -- Policy Graph Structure | `../specs/math/sddp-algorithm.md#4-policy-graph-structure` | Yes    | Yes (heading exists, see SS5 below) | CORRECT |
| 3   | Convergence                                     | `convergence.md`                                           | Yes    | Yes                                 | CORRECT |
| 4   | Stopping Rules (spec)                           | `../specs/math/stopping-rules.md`                          | Yes    | Yes                                 | CORRECT |
| 5   | Benders Decomposition                           | `benders.md`                                               | Yes    | Yes                                 | CORRECT |
| 6   | Forward and Backward Passes                     | `forward-backward.md`                                      | Yes    | Yes                                 | CORRECT |
| 7   | Convergence                                     | `convergence.md`                                           | Yes    | Yes                                 | CORRECT |
| 8   | Cut Management                                  | `cut-management.md`                                        | Yes    | Yes                                 | CORRECT |
| 9   | Single-Cut vs Multi-Cut                         | `single-multi-cut.md`                                      | Yes    | Yes                                 | CORRECT |

**Missing spec links**: None critical. The page links to the main SDDP spec, which cross-references everything else.

### 4.2 `benders.md`

| #   | Link Text                 | Target                            | Exists | Correct Topic | Verdict |
| --- | ------------------------- | --------------------------------- | ------ | ------------- | ------- |
| 1   | LP Formulation            | `../specs/math/lp-formulation.md` | Yes    | Yes           | CORRECT |
| 2   | LP Formulation (repeated) | `../specs/math/lp-formulation.md` | Yes    | Yes           | CORRECT |
| 3   | Cut Management            | `../specs/math/cut-management.md` | Yes    | Yes           | CORRECT |
| 4   | SDDP Algorithm            | `../specs/math/sddp-algorithm.md` | Yes    | Yes           | CORRECT |
| 5   | Forward-Backward Pass     | `forward-backward.md`             | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.3 `forward-backward.md`

| #   | Link Text                        | Target                            | Exists | Correct Topic | Verdict |
| --- | -------------------------------- | --------------------------------- | ------ | ------------- | ------- |
| 1   | SDDP Algorithm (spec)            | `../specs/math/sddp-algorithm.md` | Yes    | Yes           | CORRECT |
| 2   | SDDP Algorithm (spec) (repeated) | `../specs/math/sddp-algorithm.md` | Yes    | Yes           | CORRECT |
| 3   | Convergence                      | `convergence.md`                  | Yes    | Yes           | CORRECT |
| 4   | SDDP Theory                      | `sddp-theory.md`                  | Yes    | Yes           | CORRECT |
| 5   | Benders Decomposition            | `benders.md`                      | Yes    | Yes           | CORRECT |
| 6   | Convergence                      | `convergence.md`                  | Yes    | Yes           | CORRECT |
| 7   | Scenario Generation              | `scenario-generation.md`          | Yes    | Yes           | CORRECT |

**Missing spec links**: The page discusses warm-starting from forward to backward pass and parallelization, but does not link to `solver-workspaces.md` or `training-loop.md` which contain the formal specification of these features. See finding F-17.

### 4.4 `convergence.md`

| #   | Link Text                                | Target                                    | Exists | Correct Topic | Verdict |
| --- | ---------------------------------------- | ----------------------------------------- | ------ | ------------- | ------- |
| 1   | Stopping Rules (spec)                    | `../specs/math/stopping-rules.md`         | Yes    | Yes           | CORRECT |
| 2   | Upper Bound Evaluation (spec)            | `../specs/math/upper-bound-evaluation.md` | Yes    | Yes           | CORRECT |
| 3   | Upper Bound Evaluation (spec) (repeated) | `../specs/math/upper-bound-evaluation.md` | Yes    | Yes           | CORRECT |
| 4   | SDDP Theory                              | `sddp-theory.md`                          | Yes    | Yes           | CORRECT |
| 5   | Forward and Backward Passes              | `forward-backward.md`                     | Yes    | Yes           | CORRECT |
| 6   | Stopping Rules (spec) (repeated)         | `../specs/math/stopping-rules.md`         | Yes    | Yes           | CORRECT |
| 7   | Upper Bound Evaluation (spec) (repeated) | `../specs/math/upper-bound-evaluation.md` | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.5 `stochastic-modeling.md`

| #   | Link Text                      | Target                              | Exists | Correct Topic | Verdict |
| --- | ------------------------------ | ----------------------------------- | ------ | ------------- | ------- |
| 1   | PAR Inflow Model Specification | `../specs/math/par-inflow-model.md` | Yes    | Yes           | CORRECT |
| 2   | PAR(p) Autoregressive Models   | `par-model.md`                      | Yes    | Yes           | CORRECT |
| 3   | Scenario Generation            | `scenario-generation.md`            | Yes    | Yes           | CORRECT |
| 4   | Spatial Correlation            | `spatial-correlation.md`            | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.6 `par-model.md`

| #   | Link Text                      | Target                              | Exists | Correct Topic | Verdict |
| --- | ------------------------------ | ----------------------------------- | ------ | ------------- | ------- |
| 1   | Stochastic Modeling            | `stochastic-modeling.md`            | Yes    | Yes           | CORRECT |
| 2   | PAR Inflow Model Specification | `../specs/math/par-inflow-model.md` | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.7 `spatial-correlation.md`

| #   | Link Text               | Target                              | Exists | Correct Topic | Verdict |
| --- | ----------------------- | ----------------------------------- | ------ | ------------- | ------- |
| 1   | PAR Inflow Model (spec) | `../specs/math/par-inflow-model.md` | Yes    | Yes           | CORRECT |
| 2   | Scenario Generation     | `scenario-generation.md`            | Yes    | Yes           | CORRECT |
| 3   | SDDP Theory             | `sddp-theory.md`                    | Yes    | Yes           | CORRECT |

**Missing spec links**: None. The page mentions spatial correlation in noise vectors but the formal spec for spatial correlation is embedded in the PAR model spec, which is linked.

### 4.8 `scenario-generation.md`

| #   | Link Text                          | Target                              | Exists | Correct Topic | Verdict |
| --- | ---------------------------------- | ----------------------------------- | ------ | ------------- | ------- |
| 1   | PAR Inflow Model (spec)            | `../specs/math/par-inflow-model.md` | Yes    | Yes           | CORRECT |
| 2   | SDDP Algorithm (spec)              | `../specs/math/sddp-algorithm.md`   | Yes    | Yes           | CORRECT |
| 3   | Spatial Correlation                | `spatial-correlation.md`            | Yes    | Yes           | CORRECT |
| 4   | PAR Inflow Model (spec) (repeated) | `../specs/math/par-inflow-model.md` | Yes    | Yes           | CORRECT |
| 5   | Spatial Correlation (repeated)     | `spatial-correlation.md`            | Yes    | Yes           | CORRECT |
| 6   | Forward and Backward Passes        | `forward-backward.md`               | Yes    | Yes           | CORRECT |
| 7   | SDDP Algorithm (spec) (repeated)   | `../specs/math/sddp-algorithm.md`   | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.9 `cut-management.md`

| #   | Link Text                   | Target                            | Exists | Correct Topic | Verdict |
| --- | --------------------------- | --------------------------------- | ------ | ------------- | ------- |
| 1   | Cut Management (spec)       | `../specs/math/cut-management.md` | Yes    | Yes           | CORRECT |
| 2   | Single-Cut vs Multi-Cut     | `single-multi-cut.md`             | Yes    | Yes           | CORRECT |
| 3   | Cut Selection               | `cut-selection.md`                | Yes    | Yes           | CORRECT |
| 4   | Benders Decomposition       | `benders.md`                      | Yes    | Yes           | CORRECT |
| 5   | Forward and Backward Passes | `forward-backward.md`             | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.10 `single-multi-cut.md`

| #   | Link Text             | Target                            | Exists | Correct Topic | Verdict |
| --- | --------------------- | --------------------------------- | ------ | ------------- | ------- |
| 1   | Deferred Features     | `../specs/deferred.md`            | Yes    | Yes           | CORRECT |
| 2   | Cut Management (spec) | `../specs/math/cut-management.md` | Yes    | Yes           | CORRECT |
| 3   | Cut Management        | `cut-management.md`               | Yes    | Yes           | CORRECT |
| 4   | Benders Decomposition | `benders.md`                      | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.11 `cut-selection.md`

| #   | Link Text                          | Target                                                   | Exists | Correct Topic                       | Verdict |
| --- | ---------------------------------- | -------------------------------------------------------- | ------ | ----------------------------------- | ------- |
| 1   | Cut Management (spec) -- section 9 | `../specs/math/cut-management.md#9-selection-parameters` | Yes    | Yes (heading exists, see SS5 below) | CORRECT |
| 2   | Cut Management (spec)              | `../specs/math/cut-management.md`                        | Yes    | Yes                                 | CORRECT |
| 3   | Cut Management                     | `cut-management.md`                                      | Yes    | Yes                                 | CORRECT |
| 4   | Convergence                        | `convergence.md`                                         | Yes    | Yes                                 | CORRECT |

**Missing spec links**: None.

### 4.12 `risk-measures.md`

| #   | Link Text            | Target                           | Exists | Correct Topic | Verdict |
| --- | -------------------- | -------------------------------- | ------ | ------------- | ------- |
| 1   | CVaR                 | `cvar.md`                        | Yes    | Yes           | CORRECT |
| 2   | Risk Measures (spec) | `../specs/math/risk-measures.md` | Yes    | Yes           | CORRECT |
| 3   | Cut Management       | `cut-management.md`              | Yes    | Yes           | CORRECT |
| 4   | Convergence          | `convergence.md`                 | Yes    | Yes           | CORRECT |

**Missing spec links**: None.

### 4.13 `cvar.md`

| #   | Link Text            | Target                           | Exists | Correct Topic | Verdict |
| --- | -------------------- | -------------------------------- | ------ | ------------- | ------- |
| 1   | Risk Measures        | `risk-measures.md`               | Yes    | Yes           | CORRECT |
| 2   | Risk Measures (spec) | `../specs/math/risk-measures.md` | Yes    | Yes           | CORRECT |
| 3   | SDDP Theory          | `sddp-theory.md`                 | Yes    | Yes           | CORRECT |

**Missing spec links**: The page discusses how CVaR changes the aggregation weights in the backward pass and states the convex combination formula. It does not link to `cut-management.md` (algorithm page) or `cut-management.md` (spec), which formally define how risk-adjusted weights integrate into cut aggregation. See finding F-18.

---

## 5. Anchor Fragment Verification

### Anchor 1: `sddp-theory.md` line 49

**Link**: `[SDDP Algorithm (spec) -- Policy Graph Structure](../specs/math/sddp-algorithm.md#4-policy-graph-structure)`

**Target file**: `src/specs/math/sddp-algorithm.md`

**Expected heading**: `## 4. Policy Graph Structure`

**Actual heading at line 125**: `## 4. Policy Graph Structure`

**Anchor generated**: `#4-policy-graph-structure` (matches link fragment)

**Verdict**: **CORRECT**

### Anchor 2: `cut-selection.md` line 51

**Link**: `[Cut Management (spec) -- section 9](../specs/math/cut-management.md#9-selection-parameters)`

**Target file**: `src/specs/math/cut-management.md`

**Expected heading**: `## 9. Selection Parameters`

**Actual heading at line 179**: `## 9. Selection Parameters`

**Anchor generated**: `#9-selection-parameters` (matches link fragment)

**Verdict**: **CORRECT**

---

## 6. Findings List

### F-16 (MEDIUM) -- `benders.md` uses abstract matrix notation for cut slope

**File**: `src/algorithms/benders.md` line 35
**Category**: Notation inconsistency
**Severity**: MEDIUM

**Description**: The algorithm page states the cut slope as:

> **Slope**: $\beta = E_{t+1}^\top \pi^*$ (sensitivity of future cost to incoming state)

The formal spec (`notation-conventions.md` SS5.4) establishes a direct-dual convention where $\beta^v_h = \pi^{wb}_h$ because the LP is formulated with the incoming state isolated on the RHS with coefficient +1. The abstract matrix form $E_{t+1}^\top \pi^*$ is mathematically correct in the general SDDP formulation (where $E$ is the state-transition matrix, which in Cobre's LP formulation happens to be identity or near-identity for the state-linking constraints), but it introduces the symbol $E$ which is the Cobre notation for the state-transition matrix used in the constraint $A_t x_t = b_t - E_t x_{t-1}$. The formal spec never uses the matrix product form for deriving cut coefficients -- it instead derives them directly from the LP dual.

**Impact**: A reader might be confused about whether a matrix multiplication is needed, when in Cobre's formulation the cut coefficient is simply the dual value. No mathematical contradiction -- the matrix $E_t$ has the appropriate structure that makes the product reduce to the dual value itself.

**Recommendation**: Consider adding a clarifying note such as "In Cobre's LP formulation, the incoming state appears directly on the RHS, so $E_{t+1}^\top \pi^* = \pi^*$ for each state-linking constraint."

---

### F-17 (MEDIUM) -- `forward-backward.md` missing link to warm-start formal spec

**File**: `src/algorithms/forward-backward.md` line 48
**Category**: Essential spec missing from "Related topics"
**Severity**: MEDIUM

**Description**: The page claims "The forward pass LP solution at each stage also provides a warm-start basis for the corresponding backward pass solves, significantly reducing solver time" (line 48). This claim is factually correct (verified against `sddp-algorithm.md` SS3.1 and `solver-workspaces.md` SS1.5). However, the "Related topics" section at the bottom does not link to either `solver-workspaces.md` or `training-loop.md`, which contain the formal specifications of the warm-start mechanism, basis persistence, and the thread-trajectory affinity model.

The page does reference `sddp-algorithm.md` in the closing paragraph (line 50), which mentions "the thread-trajectory affinity model" -- but the detailed spec for this is in `solver-workspaces.md` and `training-loop.md`, neither of which is reachable from the "Related topics" list.

**Impact**: A reader wanting to understand the warm-start mechanism in detail would need to discover `solver-workspaces.md` through the `sddp-algorithm.md` cross-references rather than from a direct link.

**Recommendation**: Add `[Solver Workspaces (spec)](../specs/architecture/solver-workspaces.md)` to the "Related topics" section.

---

### F-18 (MEDIUM) -- `cvar.md` missing link to cut management

**File**: `src/algorithms/cvar.md`
**Category**: Essential spec missing from "Further reading"
**Severity**: MEDIUM

**Description**: The page states "During the backward pass, this combination changes only the aggregation weights used to combine per-scenario cut coefficients into a single cut" (line 41). The formal specification of how risk-adjusted weights replace scenario probabilities in cut aggregation is in `risk-measures.md` (spec) SS7 and `cut-management.md` (spec) SS3. The page links to the risk-measures spec but does not link to either `cut-management.md` (algorithm page) or `cut-management.md` (spec), where the aggregation formula and its risk-neutral form are defined.

**Impact**: A reader interested in how exactly CVaR weights modify the cut aggregation formula would need to navigate through the risk-measures spec cross-references rather than finding a direct link from this page.

**Recommendation**: Add `[Cut Management](cut-management.md)` to the "Further reading" section.

---

## 7. Non-Findings (Reviewed and Cleared)

The following items were reviewed and found to NOT constitute findings:

1. **`convergence.md` gap formula vs `stopping-rules.md` SS7 output table**: The `stopping-rules.md` output table shows `gap_percent` with formula `(z_bar - z_under) / |z_bar| x 100` (without `max(1, ...)`). This is a display formatting field, not a convergence test formula. The actual convergence test formulas in `stopping-rules.md` SS4 and `sddp-algorithm.md` SS3.3 use `max(1, ...)` consistently. No contradiction.

2. **`par-model.md` notation**: Uses $\psi_{m,\ell}$ for AR coefficients, matching both `notation-conventions.md` SS3.5 and `par-inflow-model.md` SS1. Consistent.

3. **`spatial-correlation.md` adds plant subscript to innovation**: Uses $\varepsilon_{h,t}$ instead of $\varepsilon_t$. This is intentional -- the page explicitly discusses spatial correlation, where each plant has its own correlated residual. The formal spec uses $\varepsilon_t$ as a scalar for the single-plant model. The subscript addition is a clarification, not a contradiction.

4. **`risk-measures.md` (algorithm page) "not a valid lower bound" claim**: The page says "the first-stage LP objective is not a valid lower bound on the true risk-averse optimal cost." The spec says "The lower bound computed during SDDP training is NOT a valid bound for risk-averse problems." However, the algorithm page also says "It remains a useful convergence indicator (it increases monotonically and plateaus)" which matches the spec's SS10 "What the Lower Bound Represents" section. Fully consistent.

5. **`scenario-generation.md` "opening tree is generated once" claim**: Verified against multiple spec sources. Consistent.

6. **`cut-management.md` "relaxed to -infinity" claim**: Verbatim match with `cut-management.md` (spec) SS5. Consistent.

7. **`benders.md` uses $A_t$, $E_t$, $b_t$ notation**: The formal spec `sddp-algorithm.md` SS2 uses identical notation: $A_t x_t = b_t - E_t x_{t-1}$. Consistent.

8. **`convergence.md` mentions "vertex-based Lipschitz interpolation"**: This matches `upper-bound-evaluation.md` SS3 (Lipschitz Interpolation). Consistent.

9. **`single-multi-cut.md` multi-cut linking constraint**: Uses $\theta = \sum_\omega p(\omega) \theta_\omega$. The spec `sddp-algorithm.md` SS6.2 shows the individual scenario cuts but does not explicitly show the linking constraint. The algorithm page's linking constraint is mathematically implied by the formulation and is not contradicted by any spec. Consistent.

10. **`cut-selection.md` convergence guarantee attribution**: Attributes to "Guigues and Bandarra (2019)". The formal spec `cut-management.md` SS8 cites the same paper: "Guigues, V., & Bandarra, M.P. (2019)." Consistent.

---

## 8. Summary of Findings

| ID   | Severity | File                             | Description                                                                                                                |
| ---- | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| F-16 | MEDIUM   | `algorithms/benders.md`          | Uses abstract matrix notation `E_{t+1}^T pi^*` for cut slope; formal spec uses direct-dual convention `beta^v_h = pi^wb_h` |
| F-17 | MEDIUM   | `algorithms/forward-backward.md` | Missing link to `solver-workspaces.md` in "Related topics" for warm-start details                                          |
| F-18 | MEDIUM   | `algorithms/cvar.md`             | Missing link to `cut-management.md` in "Further reading" for cut aggregation details                                       |

**No HIGH severity findings.**

All 19 formulas are mathematically consistent with their formal spec counterparts. All 8 key factual claims are consistent with the formal specs. Both anchor fragments resolve correctly. The 3 MEDIUM findings are notation and link completeness issues that do not affect mathematical or factual correctness.
