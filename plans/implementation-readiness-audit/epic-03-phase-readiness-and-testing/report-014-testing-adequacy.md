# Report 014: Testing Spec Adequacy Audit

## 1. Executive Summary

This report audits 7 testing specs against 6 adequacy dimensions defined by the CLAUDE.md structural patterns. The audit scope is limited to testing specs; trait specs were audited separately in Epic 01.

**Aggregate statistics:**

| Metric                                          | Value                |
| ----------------------------------------------- | -------------------- |
| Testing specs audited                           | 7                    |
| Total named tests across all specs              | 247                  |
| Specs rated ADEQUATE                            | 5                    |
| Specs rated ADEQUATE WITH GAPS                  | 2                    |
| Specs rated INADEQUATE                          | 0                    |
| Structural compliance violations                | 0                    |
| Missing cross-solver/backend equivalence tables | 0                    |
| Missing finite-difference sensitivity checks    | 0 (where applicable) |

The two ADEQUATE WITH GAPS verdicts are:

1. **solver-interface-testing.md** -- 8 stale `patch_rhs_bounds` references (should be `patch_row_bounds`); no tests for the 10th trait method `patch_col_bounds`.
2. **backend-testing.md** -- no shared test fixture declared at the top of section 1; no dedicated error-variant-exhaustive section (error tests are distributed across subsections 1.8.1--1.8.5 which is acceptable but not a single dedicated section).

No spec is INADEQUATE. All 7 specs satisfy the majority of dimensions, and the identified gaps are correctable without structural rework.

---

## 2. Per-Spec Assessments

### 2.1 risk-measure-testing.md

**Trait under test:** `RiskMeasure` enum -- 2 methods (`aggregate_cut`, `evaluate_risk`), 2 variants (Expectation, CVaR).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Shared fixture at SS1 top (3-opening table). "Test naming convention:" paragraph present. Naming pattern `test_risk_{variant}_{method}_{scenario}` matches CLAUDE.md. Convention blockquote absent (correct for testing spec).                          |
| 2. Conformance test coverage            | PASS      | SS1.1 covers `aggregate_cut` for both Expectation and CVaR across 9 tests. SS1.2 covers `evaluate_risk` for both variants across 8 tests. Both methods and both variants exercised.                                                                     |
| 3. Error path coverage                  | PASS      | SS3.3 is the dedicated validation rejection section (6 tests covering rules R1, R2, R3 including boundary and normalization cases). All `ValidationError` variants exercised.                                                                           |
| 4. Cross-solver/backend equivalence     | N/A       | `RiskMeasure` is an enum with pure computation, not a multi-backend trait. No solver or backend equivalence required.                                                                                                                                   |
| 5. Finite-difference sensitivity checks | N/A       | `RiskMeasure` methods do not produce dual/gradient postconditions. No finite-difference check required.                                                                                                                                                 |
| 6. Test count adequacy                  | PASS      | 34 named tests for a 2-method, 2-variant enum. SS2 provides 4 variant equivalence tests. SS3.1 provides 4 weight invariant tests. SS3.2 provides 3 monotonicity tests. Count is proportional to the mathematical complexity of CVaR weight computation. |

#### Coverage Table

| Method               | Variants Tested                  | Test Count | Boundary Cases                                                        |
| -------------------- | -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `aggregate_cut`      | Expectation (2), CVaR (7)        | 9          | single opening, nonuniform probs, tied costs, extreme alpha           |
| `evaluate_risk`      | Expectation (2), CVaR (6)        | 8          | single opening, nonuniform probs, extreme alpha                       |
| Variant equivalence  | CVaR degenerating to Expectation | 4          | lambda=0, alpha=1                                                     |
| Numerical properties | Weight invariants, monotonicity  | 7          | sum-to-one, non-negative, bounded, descending cost order              |
| Validation rejection | CVaR config errors               | 6          | alpha=0, alpha<0, alpha>1, lambda<0, lambda>1, lambda=0 normalization |

**Missing tests:** None identified for minimal viable scope.

**Verdict: ADEQUATE**

---

### 2.2 horizon-mode-testing.md

**Trait under test:** `HorizonMode` enum -- 4 methods (`successors`, `is_terminal`, `discount_factor`, `validate`) + `should_terminate_forward`, 2 variants (Finite, Cyclic).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                    |
| --------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Two shared fixtures (A: Finite 5-stage, B: Cyclic 12-stage) declared at SS1 top with full JSON examples. "Test naming convention:" paragraph present. Naming pattern `test_horizon_{variant}_{method}_{scenario}` correct. Convention blockquote absent.    |
| 2. Conformance test coverage            | PASS      | SS1.1: `successors` (7 tests), SS1.2: `is_terminal` (5 tests), SS1.3: `discount_factor` (5 tests). Both variants covered. `validate` tested in SS2 (7 tests). `should_terminate_forward` in SS3 (5 tests).                                                  |
| 3. Error path coverage                  | PASS      | SS2 is the dedicated validation section with 7 tests covering H1 (empty stages), H2 (cycle discount >= 1), H3 (cycle start out of bounds), H4 (dangling transition), multi-error accumulation, and 2 positive (pass) cases. All validation rules exercised. |
| 4. Cross-solver/backend equivalence     | N/A       | `HorizonMode` is an enum with pure computation, not a multi-backend trait.                                                                                                                                                                                  |
| 5. Finite-difference sensitivity checks | N/A       | No dual/gradient postconditions.                                                                                                                                                                                                                            |
| 6. Test count adequacy                  | PASS      | 33 named tests for a 4+1 method, 2-variant enum with complex cyclic termination logic. SS3.3 includes a production-scale 60-stage example. Count is proportional to complexity.                                                                             |

#### Coverage Table

| Method                      | Variants Tested        | Test Count | Boundary Cases                                             |
| --------------------------- | ---------------------- | ---------- | ---------------------------------------------------------- |
| `successors`                | Finite (3), Cyclic (4) | 7          | single-stage, back-edge, self-loop                         |
| `is_terminal`               | Finite (3), Cyclic (2) | 5          | terminal, non-terminal, single-stage                       |
| `discount_factor`           | Finite (3), Cyclic (2) | 5          | undiscounted, back-edge, consistency with successors       |
| `validate`                  | Both                   | 7          | H1-H4 rules, multi-error, positive cases                   |
| `should_terminate_forward`  | Finite (1), Cyclic (4) | 5          | discount threshold, max horizon, 60-stage production scale |
| (Production-scale 60-stage) | Cyclic                 | 4          | back-edge at stage 59, prefix stage, termination           |

**Missing tests:** None identified for minimal viable scope.

**Verdict: ADEQUATE**

---

### 2.3 sampling-scheme-testing.md

**Trait under test:** `SamplingScheme` enum -- 3 methods (`sample_forward`, `requires_noise_inversion`, `backward_tree_source`), 3 variants (InSample, External, Historical).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Shared fixture at SS1 top with PAR model parameters, 5-opening noise table, external scenario data, historical data, seed configuration, and hand-computed noise inversion reference. "Test naming convention:" paragraph present. Naming pattern `test_sampling_{variant}_{method}_{scenario}` correct. Convention blockquote absent. |
| 2. Conformance test coverage            | PASS      | SS1.1: `sample_forward` (7 tests across all 3 variants). SS1.2: `requires_noise_inversion` (3 tests, one per variant). SS1.3: `backward_tree_source` (3 tests, one per variant). SS1.4: 2 edge case tests. All methods and all variants exercised.                                                                                     |
| 3. Error path coverage                  | PASS      | SS4 is the dedicated validation section with 8 tests covering rules S1 (missing seed), S2 (missing external file), S3 (missing historical file), S4 (invalid selection mode), plus 4 positive cases. All `SamplingSchemeValidationError` variants exercised.                                                                           |
| 4. Cross-solver/backend equivalence     | N/A       | `SamplingScheme` is an enum with pure computation, not a multi-backend trait.                                                                                                                                                                                                                                                          |
| 5. Finite-difference sensitivity checks | N/A       | No dual/gradient postconditions.                                                                                                                                                                                                                                                                                                       |
| 6. Test count adequacy                  | PASS      | 29 named tests for a 3-method, 3-variant enum. SS2 provides 3 forward-backward separation tests (highest-priority invariant). SS3 provides 3 reproducibility tests. Count proportional to the noise inversion and multi-stage chain complexity.                                                                                        |

#### Coverage Table

| Method                      | Variants Tested                              | Test Count | Boundary Cases                                                        |
| --------------------------- | -------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `sample_forward`            | InSample (3), External (3), Historical (1)   | 7          | single opening, sequential cycling, multi-stage lag chain             |
| `requires_noise_inversion`  | All 3                                        | 3          | --                                                                    |
| `backward_tree_source`      | All 3                                        | 3          | --                                                                    |
| Edge cases                  | InSample, External                           | 2          | single stage, sequential cycling modular arithmetic                   |
| Forward-backward separation | InSample vs External, InSample vs Historical | 3          | most critical invariant: backward noise invariant under scheme change |
| Reproducibility             | InSample                                     | 3          | same seed, cross-rank, different seeds                                |
| Validation                  | S1-S4                                        | 8          | missing files, invalid modes, defaults, positive cases                |

**Missing tests:** None identified for minimal viable scope.

**Verdict: ADEQUATE**

---

### 2.4 cut-selection-testing.md

**Trait under test:** `CutSelectionStrategy` enum -- 3 methods (`should_run`, `select`, `update_activity`), 3 variants (Level1, LML1, Dominated).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Shared fixture at SS1 top: 5-cut pool with hand-computed intercepts, coefficients, activity metadata, visited states, cut-value-at-state table, and domination summary. "Test naming convention:" paragraph present. Naming pattern `test_cutselection_{variant}_{method}_{scenario}` correct. Convention blockquote absent. |
| 2. Conformance test coverage            | PASS      | SS1.1: Level1 `select` (4 tests). SS1.2: LML1 `select` (3 tests). SS1.3: Dominated `select` (3 tests). SS1.4: `should_run` (2 tests). SS1.5: `update_activity` (3 tests, one per variant). All 3 methods and all 3 variants exercised.                                                                                       |
| 3. Error path coverage                  | PASS      | Cut selection methods are pure queries that never return `Result` (per CLAUDE.md invariant). There are no error paths to test. The convergence property tests in SS3 (4 tests) verify the safety invariant that binding cuts are never deactivated, which serves the analogous role.                                         |
| 4. Cross-solver/backend equivalence     | N/A       | `CutSelectionStrategy` is an enum with pure computation.                                                                                                                                                                                                                                                                     |
| 5. Finite-difference sensitivity checks | N/A       | No dual/gradient postconditions.                                                                                                                                                                                                                                                                                             |
| 6. Test count adequacy                  | PASS      | 21 named tests for a 3-method, 3-variant enum. SS2 provides 2 aggressiveness ordering tests (structural property: Level1 <= LML1 <= Dominated). SS3 provides 4 convergence property tests. Count is proportional to the combinatorial complexity of cut activity tracking.                                                   |

#### Coverage Table

| Method                  | Variants Tested                     | Test Count | Boundary Cases                                                          |
| ----------------------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `select`                | Level1 (4), LML1 (3), Dominated (3) | 10         | all inactive, all active, partial domination, no domination, single cut |
| `should_run`            | Level1 (1), LML1 (1)                | 2          | periodic trigger, frequency=1                                           |
| `update_activity`       | Level1 (1), LML1 (1), Dominated (1) | 3          | increment, timestamp, reset                                             |
| Aggressiveness ordering | All 3 compared                      | 2          | shared fixture, all-recently-active                                     |
| Convergence properties  | Level1 (2), LML1 (2)                | 4          | binding cut preservation, positive-active-count, current-iteration      |

**Missing tests:** None identified for minimal viable scope.

**Verdict: ADEQUATE**

---

### 2.5 stopping-rule-testing.md

**Trait under test:** `StoppingRule` enum -- 5 variants (IterationLimit, TimeLimit, BoundStalling, SimulationBased, GracefulShutdown) + `StoppingRuleSet` composition layer.

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                                                                          |
| --------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Shared MonitorState fixture at SS1 top with baseline field values. "Test naming convention:" paragraph present for both individual rules and composition tests. Naming patterns `test_stopping_{rule}_{scenario}` and `test_stopping_composition_{mode}_{scenario}` correct. Convention blockquote absent.        |
| 2. Conformance test coverage            | PASS      | SS1.1: IterationLimit (4 tests). SS1.2: TimeLimit (3 tests). SS1.3: BoundStalling (4 tests). SS1.4: SimulationBased (6 tests). SS1.5: GracefulShutdown (3 tests). All 5 variants exercised. SS2: composition OR (5 tests), AND (5 tests), shutdown override (3 tests).                                            |
| 3. Error path coverage                  | PASS      | Stopping rules are pure query methods that do not return `Result`. SS1.4 covers the "no trigger" paths for SimulationBased (phase 1 fails, phase 2 fails, not checkpoint, first evaluation). The composition tests cover "none trigger" cases for both OR and AND modes. These serve as error-adjacent paths.     |
| 4. Cross-solver/backend equivalence     | N/A       | `StoppingRule` is an enum with pure computation.                                                                                                                                                                                                                                                                  |
| 5. Finite-difference sensitivity checks | N/A       | No dual/gradient postconditions.                                                                                                                                                                                                                                                                                  |
| 6. Test count adequacy                  | PASS      | 41 named tests for a 5-variant enum plus composition layer. SS3 provides 8 bound stalling numerical tests across 4 scenarios (decreasing increments, flat bounds, oscillating, near-zero). Count is proportional to the algorithmic complexity of the simulation-based two-phase rule and bound stalling formula. |

#### Coverage Table

| Method/Layer             | Variants Tested | Test Count | Boundary Cases                                                                     |
| ------------------------ | --------------- | ---------- | ---------------------------------------------------------------------------------- |
| IterationLimit           | --              | 4          | at limit, below, above, limit=1                                                    |
| TimeLimit                | --              | 3          | at threshold, below, above                                                         |
| BoundStalling            | --              | 4          | triggers, small improvement, not enough history, window=1                          |
| SimulationBased          | --              | 6          | both phases pass, phase1 fails, phase2 fails, not checkpoint, first eval, period=1 |
| GracefulShutdown         | --              | 3          | signaled, not signaled, monotonic                                                  |
| Composition OR           | --              | 5          | single trigger, both trigger, none, mixed, second rule first                       |
| Composition AND          | --              | 5          | all trigger, one missing, none, mixed, three rules                                 |
| Shutdown override        | --              | 3          | OR mode, AND mode, not requested                                                   |
| Bound stalling numerical | --              | 8          | decreasing increments (3), flat (1), oscillating (3), near-zero (1)                |

**Missing tests:** None identified for minimal viable scope.

**Verdict: ADEQUATE**

---

### 2.6 solver-interface-testing.md

**Trait under test:** `SolverInterface` trait -- 10 methods (`load_model`, `add_cut_rows`, `patch_row_bounds`, `patch_col_bounds`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name`), 2 backends (HiGHS, CLP).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PASS      | Shared LP fixture at SS1.1 top with hand-computed optimal solution, dual values, and basis. Benders cut fixture at SS1.2. Patched RHS fixture at SS1.3. "Test naming convention:" paragraph present. Naming pattern `test_solver_{variant}_{method}_{scenario}` correct. Convention blockquote absent.                                                                                                                                                                                                                     |
| 2. Conformance test coverage            | PARTIAL   | 9 of 10 trait methods are tested. SS1.4: `load_model` (4 tests). SS1.5: `add_cut_rows` (4 tests). SS1.6: `patch_rhs_bounds` (2 tests). SS1.7: `solve` (8 tests). SS1.8: `solve_with_basis` (4 tests). SS1.9: `reset` (4 tests). SS1.10: `get_basis` (6 tests). SS1.11: `statistics` (4 tests). SS1.12: `name` (2 tests). **GAP: `patch_col_bounds` (the 10th method) has zero tests.** Additionally, 8 occurrences of `patch_rhs_bounds` in the spec use a stale method name -- the trait spec defines `patch_row_bounds`. |
| 3. Error path coverage                  | PASS      | SS3 is the dedicated error path section with infeasible LP (SS3.1, 2 tests) and unbounded LP (SS3.2, 2 tests). Both `SolverError::Infeasible` and `SolverError::Unbounded` variants exercised. SS4 lifecycle tests include an infeasibility test via over-patching (step 7 of repeated_patch_solve).                                                                                                                                                                                                                       |
| 4. Cross-solver equivalence             | PASS      | SS2 provides the cross-solver equivalence section with explicit tolerance table matching CLAUDE.md values: objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start 2x ratio. 7 cross-solver tests verify HiGHS-vs-CLP agreement on objective, primal, dual, cuts, patching, and warm-start iterations.                                                                                                                                                                                               |
| 5. Finite-difference sensitivity checks | PASS      | SS5 contains 6 dual normalization verification tests. Specifically, `test_solver_highs_dual_normalization_sensitivity_check` and `test_solver_clp_dual_normalization_sensitivity_check` perform finite-difference checks: solve at RHS=6, solve at RHS=6.01, verify $(z^{**} - z^*)/0.01 \approx \pi_0$ within 1e-2. This is exactly the CLAUDE.md-prescribed pattern.                                                                                                                                                     |
| 6. Test count adequacy                  | PASS      | 59 named tests for a 10-method trait with 2 backends, error paths, lifecycle tests, cross-solver equivalence, and finite-difference sensitivity checks. This is the most test-dense spec in the corpus, proportional to the FFI complexity and dual normalization criticality.                                                                                                                                                                                                                                             |

#### Coverage Table

| Method                                                 | Backends Tested    | Test Count | Boundary Cases                                                 |
| ------------------------------------------------------ | ------------------ | ---------- | -------------------------------------------------------------- |
| `load_model`                                           | HiGHS (2), CLP (2) | 4          | initial load, replace previous                                 |
| `add_cut_rows`                                         | HiGHS (2), CLP (2) | 4          | two cuts, single cut                                           |
| `patch_rhs_bounds` (stale name for `patch_row_bounds`) | HiGHS (1), CLP (1) | 2          | state change RHS 6->4                                          |
| `patch_col_bounds`                                     | **NONE**           | **0**      | **No tests**                                                   |
| `solve`                                                | HiGHS (4), CLP (4) | 8          | duals, duals with cuts, reduced costs, iterations              |
| `solve_with_basis`                                     | HiGHS (2), CLP (2) | 4          | warm start, cut extension                                      |
| `reset`                                                | HiGHS (2), CLP (2) | 4          | clears state, preserves statistics                             |
| `get_basis`                                            | HiGHS (3), CLP (3) | 6          | dimensions, roundtrip, with cuts                               |
| `statistics`                                           | HiGHS (2), CLP (2) | 4          | initial zeros, increment after 3 solves                        |
| `name`                                                 | HiGHS (1), CLP (1) | 2          | returns identifier string                                      |
| Cross-solver equivalence                               | HiGHS vs CLP       | 7          | objective, primal, dual, cuts, patching, warm-start            |
| Error paths (infeasible, unbounded)                    | HiGHS (2), CLP (2) | 4          | contradictory bounds, unbounded objective                      |
| Lifecycle                                              | HiGHS (2), CLP (2) | 4          | full cycle (12 steps), repeated patch leading to infeasibility |
| Dual normalization                                     | HiGHS (3), CLP (3) | 6          | cut-relevant row, finite-difference sensitivity, binding cut   |

#### Identified Gaps

1. **`patch_col_bounds` not tested (0 tests).** The trait spec defines this as the 10th method. The testing spec does not mention it. The trait spec notes it is "not used in minimal viable SDDP" -- however, it is part of the trait contract and requires at least basic conformance coverage.

2. **Stale method name: `patch_rhs_bounds` (8 occurrences).** The trait spec defines `patch_row_bounds`, but the testing spec uses `patch_rhs_bounds` throughout SS1.6 and in lifecycle tests. This is a naming inconsistency that should be resolved, though it does not affect test coverage analysis since the behavioral intent is clear.

3. **No `SolverError::NumericalDifficulty`, `SolverError::TimeLimitExceeded`, or `SolverError::IterationLimit` error path tests.** Only `Infeasible` and `Unbounded` are tested. The "proceed-with-partial" error variants from the trait spec are not exercised. These are harder to trigger deterministically with a small fixture, so this is a low-severity gap.

**Verdict: ADEQUATE WITH GAPS**

---

### 2.7 backend-testing.md

**Trait under test:** `Communicator` trait -- 6 methods (`allgatherv`, `allreduce`, `broadcast`, `barrier`, `rank`, `size`) + `SharedMemoryProvider` trait (3 methods: `create_shared_region`, `is_leader`, `split_local`), 4 backends (local, ferrompi, TCP, shm).

#### Dimension Assessment

| Dimension                               | Pass/Fail | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Structural compliance                | PARTIAL   | "Test naming convention:" paragraph present at section 1 top. Naming pattern `test_{backend}_{method}_{scenario}` correct. Uses plain numbered sections (correct for HPC directory). Convention blockquote absent (correct). **GAP: No shared test fixture declared at the top of section 1.** The spec uses per-test inline data (rank sends specific elements). This is acceptable for communication-layer tests where inputs are rank-dependent, but deviates from the CLAUDE.md pattern of "shared fixture at SS1 top." |
| 2. Conformance test coverage            | PASS      | Section 1.1: `allgatherv` (5 tests). 1.2: `allreduce` (5 tests). 1.3: `broadcast` (3 tests). 1.4: `barrier` (2 tests). 1.5: `rank`/`size` (3 tests). 1.6: compound collective sequencing (1 test). 1.7: `SharedMemoryProvider` lifecycle (4 tests). All methods exercised.                                                                                                                                                                                                                                                  |
| 3. Error path coverage                  | PASS      | Section 1.8 is the dedicated error section with 5 subsections by `CommError` variant: 1.8.1 `InvalidBufferSize` (2 tests), 1.8.2 `InvalidRoot` (1 test), 1.8.3 `CollectiveFailed` (2 tests), 1.8.4 `InvalidCommunicator` (1 test), 1.8.5 `AllocationFailed` (1 test). All 5 `CommError` variants exercised. Section 1.9 documents per-backend error behavior differences.                                                                                                                                                   |
| 4. Cross-backend equivalence            | PASS      | Section 2 provides the interchangeability test suite with a reference test case (section 2.1), a 4-backend comparison matrix (section 2.2), and a comparison criteria table (section 2.3) with explicit tolerances: lower bound trace and cut pool are bit-for-bit identical, upper bound mean within ~1e-12 relative. Section 2.4 covers Python multi-process interchangeability.                                                                                                                                          |
| 5. Finite-difference sensitivity checks | N/A       | `Communicator` methods do not produce dual/gradient postconditions. Communication correctness is verified by data integrity checks, not sensitivity analysis.                                                                                                                                                                                                                                                                                                                                                               |
| 6. Test count adequacy                  | PASS      | 30 named tests in the conformance suite alone, plus the interchangeability and determinism frameworks in sections 2-4. Section 3 provides per-operation performance regression tests with explicit regression thresholds. Section 4 provides a 10-configuration determinism test matrix (D1-D10). The total coverage is proportional to the 4-backend x multi-rank combinatorial complexity.                                                                                                                                |

#### Coverage Table

| Method                 | Backends Tested            | Test Count  | Boundary Cases                                                                   |
| ---------------------- | -------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `allgatherv`           | All 4 (parameterized)      | 5           | heterogeneous, identity size=1, empty send, single element, large payload        |
| `allreduce`            | All 4 (parameterized)      | 5           | sum, min, max, identity size=1, single element                                   |
| `broadcast`            | All 4 (parameterized)      | 3           | root=0, root=last, data integrity (10k elements)                                 |
| `barrier`              | All 4 (parameterized)      | 2           | write-before-read-after, repeated                                                |
| `rank`/`size`          | All 4 (parameterized)      | 3           | in-range, consistent, unique                                                     |
| Collective sequencing  | All 4 (parameterized)      | 1           | interleaved allgatherv-allreduce-barrier-allgatherv                              |
| `SharedMemoryProvider` | All 4 (parameterized)      | 4           | lifecycle, is_leader, split_local, drop                                          |
| Error paths            | Per-variant                | 7           | buffer mismatch, invalid root, timeout, finalized, excessive alloc               |
| Interchangeability     | 4 backends compared        | (framework) | lower bound, cut pool, policy, upper bound                                       |
| Determinism            | 10 configurations (D1-D10) | (framework) | rank scaling, thread scaling, run-twice, cross-backend                           |
| Python multi-process   | shm                        | (framework) | worker info, error propagation, fork rejection, reproducibility, TCP auto-detect |

#### Identified Gaps

1. **No shared test fixture at section 1 top.** Communication tests use inline rank-specific data in each test row. This is a structural deviation from CLAUDE.md, though arguably justified for rank-dependent test inputs.

2. **Error tests distributed across subsections 1.8.1-1.8.5** rather than a single flat "SS3"-style dedicated section. The content is equivalent, but the structure differs from the sibling architecture testing specs which use a single dedicated section.

**Verdict: ADEQUATE WITH GAPS**

---

## 3. Cross-Spec Pattern Analysis

### 3.1 Consistent Patterns (All 7 Specs)

1. **"Test naming convention:" paragraph present** in all specs at the correct location (before the first test table in the primary conformance section). All naming patterns follow the `test_{trait}_{variant}_{method}_{scenario}` convention.

2. **Convention blockquote absent** from all 7 testing specs. No spec violates the CLAUDE.md rule that the convention blockquote belongs only in trait specs.

3. **Cross-References section present** in all specs with bidirectional links to the corresponding trait spec, math specs, and sibling testing specs.

4. **Hand-computable test fixtures** used in all specs. Every expected output includes a derivation or reference to the computation method, enabling manual verification.

### 3.2 Architecture vs HPC Structural Difference

The 6 architecture testing specs use the SS prefix for sections, while backend-testing.md uses plain numbered sections. This is **correct** per CLAUDE.md: HPC files use plain numbers, architecture files use SS.

### 3.3 Shared Fixture Pattern Compliance

| Spec                        | Fixture Location | Fixture Type                                                           | Compliant |
| --------------------------- | ---------------- | ---------------------------------------------------------------------- | --------- |
| risk-measure-testing.md     | SS1 top          | 3-opening probability table                                            | Yes       |
| horizon-mode-testing.md     | SS1 top          | Two fixtures (A: Finite 5-stage, B: Cyclic 12-stage) with JSON         | Yes       |
| sampling-scheme-testing.md  | SS1 top          | PAR parameters, 5-opening noise table, external scenarios, seed config | Yes       |
| cut-selection-testing.md    | SS1 top          | 5-cut pool with hand-computed domination table                         | Yes       |
| stopping-rule-testing.md    | SS1 top          | MonitorState baseline with 10-entry history                            | Yes       |
| solver-interface-testing.md | SS1.1            | LP fixture with CSC data, dual values, basis                           | Yes       |
| backend-testing.md          | Section 1 top    | **No shared fixture** (per-test inline data)                           | Partial   |

### 3.4 Error Path Section Placement

| Spec                        | Error Section | Placement                                 | Dedicated Section  |
| --------------------------- | ------------- | ----------------------------------------- | ------------------ |
| risk-measure-testing.md     | SS3.3         | Within Numerical Properties               | Yes (sub-section)  |
| horizon-mode-testing.md     | SS2           | Standalone                                | Yes                |
| sampling-scheme-testing.md  | SS4           | Standalone                                | Yes                |
| cut-selection-testing.md    | SS3           | Convergence Properties (no Result errors) | N/A (pure queries) |
| stopping-rule-testing.md    | --            | None needed (pure queries)                | N/A                |
| solver-interface-testing.md | SS3           | Standalone                                | Yes                |
| backend-testing.md          | 1.8           | Sub-sections 1.8.1-1.8.5                  | Yes (structured)   |

### 3.5 Tolerance Table Verification (solver-interface-testing.md Only)

The cross-solver equivalence tolerance table in SS2 was verified against CLAUDE.md values:

| Quantity              | Spec Value    | CLAUDE.md Value | Match |
| --------------------- | ------------- | --------------- | ----- |
| Objective value       | 1e-8 relative | 1e-8 relative   | Yes   |
| Primal values         | 1e-8 absolute | 1e-8 absolute   | Yes   |
| Dual values           | 1e-6 absolute | 1e-6 absolute   | Yes   |
| Warm-start iterations | 2x ratio      | 2x              | Yes   |

All four tolerance values match exactly.

---

## 4. Summary Table

| Spec                        | Test Count | Method Coverage %               | Error Paths        | Equivalence               | Finite-Diff | Verdict            |
| --------------------------- | ---------- | ------------------------------- | ------------------ | ------------------------- | ----------- | ------------------ |
| risk-measure-testing.md     | 34         | 100% (2/2 methods)              | Y (SS3.3)          | N/A                       | N/A         | ADEQUATE           |
| horizon-mode-testing.md     | 33         | 100% (4+1/4+1 methods)          | Y (SS2)            | N/A                       | N/A         | ADEQUATE           |
| sampling-scheme-testing.md  | 29         | 100% (3/3 methods)              | Y (SS4)            | N/A                       | N/A         | ADEQUATE           |
| cut-selection-testing.md    | 21         | 100% (3/3 methods)              | N/A (pure queries) | N/A                       | N/A         | ADEQUATE           |
| stopping-rule-testing.md    | 41         | 100% (5 variants + composition) | N/A (pure queries) | N/A                       | N/A         | ADEQUATE           |
| solver-interface-testing.md | 59         | 90% (9/10 methods)              | Y (SS3)            | Y (SS2, tolerances match) | Y (SS5)     | ADEQUATE WITH GAPS |
| backend-testing.md          | 30         | 100% (6+3/6+3 methods)          | Y (1.8)            | Y (section 2)             | N/A         | ADEQUATE WITH GAPS |

---

## 5. Missing Tests Inventory

### Priority: HIGH

| Test Name                                      | Spec                        | Method             | Rationale                                                                                                                                                           |
| ---------------------------------------------- | --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_solver_highs_patch_col_bounds_basic`     | solver-interface-testing.md | `patch_col_bounds` | The 10th trait method has 0 tests. Should load fixture, patch column 2 upper bound from 8.0 to 4.0, solve, verify $x_2 \leq 4.0$ and objective changes accordingly. |
| `test_solver_clp_patch_col_bounds_basic`       | solver-interface-testing.md | `patch_col_bounds` | Same test for CLP backend.                                                                                                                                          |
| `test_solver_cross_patch_col_bounds_agreement` | solver-interface-testing.md | `patch_col_bounds` | Cross-solver equivalence for column bound patching.                                                                                                                 |

### Priority: MEDIUM

| Test Name                                         | Spec                        | Method             | Rationale                                                                                                                                                                         |
| ------------------------------------------------- | --------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_solver_highs_patch_row_bounds_state_change` | solver-interface-testing.md | `patch_row_bounds` | Rename of existing `test_solver_highs_patch_rhs_bounds_state_change` to match trait method name `patch_row_bounds`. Not a new test -- a naming correction for 8 stale references. |
| `test_solver_clp_patch_row_bounds_state_change`   | solver-interface-testing.md | `patch_row_bounds` | Same naming correction for CLP variant.                                                                                                                                           |

### Priority: LOW

| Test Name                                      | Spec                        | Method       | Rationale                                                                                                                                    |
| ---------------------------------------------- | --------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_solver_highs_solve_numerical_difficulty` | solver-interface-testing.md | `solve`      | Trigger `SolverError::NumericalDifficulty` with a poorly scaled LP. Hard to construct deterministically; may require a pathological matrix.  |
| `test_solver_highs_solve_iteration_limit`      | solver-interface-testing.md | `solve`      | Trigger `SolverError::IterationLimit` by configuring solver with iteration_limit=1 on a non-trivial LP. Depends on solver configuration API. |
| `test_solver_highs_solve_time_limit`           | solver-interface-testing.md | `solve`      | Trigger `SolverError::TimeLimitExceeded` by configuring solver with time_limit near 0. Depends on solver configuration API.                  |
| `test_backend_shared_fixture_allgatherv`       | backend-testing.md          | `allgatherv` | Introduce a shared fixture at section 1 top for structural compliance. Not functionally necessary -- the per-test inline data is correct.    |
