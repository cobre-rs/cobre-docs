# Shared Type Consistency Report

**Ticket**: ticket-011-verify-shared-type-consistency.md
**Agent**: implementation-guardian
**Date**: 2026-02-26T00:00:00Z

**Overall**: REJECTED (4/7 type criteria passed, 1/3 notation families fully consistent)

---

## Part 1: Shared Type Consistency Matrix

### Type T1: System (canonical: `src/specs/data-model/internal-structures.md` SS1.3)

**Canonical field list** (from `internal-structures.md` SS1.3 `pub struct System`):

| Field                           | Type                                 |
| ------------------------------- | ------------------------------------ |
| `buses`                         | `Vec<Bus>`                           |
| `lines`                         | `Vec<Line>`                          |
| `hydros`                        | `Vec<Hydro>`                         |
| `thermals`                      | `Vec<Thermal>`                       |
| `pumping_stations`              | `Vec<PumpingStation>`                |
| `contracts`                     | `Vec<EnergyContract>`                |
| `non_controllable_sources`      | `Vec<NonControllableSource>`         |
| `bus_index`                     | `HashMap<EntityId, usize>` (private) |
| `line_index`                    | `HashMap<EntityId, usize>` (private) |
| `hydro_index`                   | `HashMap<EntityId, usize>` (private) |
| `thermal_index`                 | `HashMap<EntityId, usize>` (private) |
| `pumping_station_index`         | `HashMap<EntityId, usize>` (private) |
| `contract_index`                | `HashMap<EntityId, usize>` (private) |
| `non_controllable_source_index` | `HashMap<EntityId, usize>` (private) |
| `cascade`                       | `CascadeTopology`                    |
| `network`                       | `NetworkTopology`                    |
| `stages`                        | `Vec<Stage>`                         |
| `policy_graph`                  | `PolicyGraph`                        |
| `penalties`                     | `ResolvedPenalties`                  |
| `bounds`                        | `ResolvedBounds`                     |
| `par_models`                    | `Vec<ParModel>`                      |
| `correlation`                   | `CorrelationModel`                   |
| `initial_conditions`            | `InitialConditions`                  |
| `generic_constraints`           | `Vec<GenericConstraint>`             |

| Referencing File                                         | Status     | Notes                                                                                                                   |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/specs/architecture/input-loading-pipeline.md` SS8.1 | CONSISTENT | References `System` as the return type of `load_case`; cross-references internal-structures.md SS1 correctly            |
| `src/specs/architecture/training-loop.md` SS5.5.1        | CONSISTENT | References `System` by shared reference `&System` for `StageIndexer` construction; no field-level claims that conflict  |
| `src/specs/architecture/solver-interface-trait.md` SS4.4 | CONSISTENT | References `System` for `StageTemplate` construction; cites internal-structures.md SS1                                  |
| `src/specs/architecture/cli-and-lifecycle.md`            | CONSISTENT | References `System` as the output of `load_case` on rank 0; no field-level claims                                       |
| `src/specs/architecture/solver-abstraction.md` SS11.1    | CONSISTENT | References internal-structures.md for the source of stage template construction; no field list                          |
| `src/specs/hpc/memory-architecture.md`                   | CONSISTENT | No field-level `System` references found                                                                                |
| Other referencing files (42 total)                       | CONSISTENT | All other files reference `System` at the type level without listing fields; no conflicts with the canonical field list |

**Verdict**: T1 PASS. No file contradicts the canonical field list. Files that reference `System` operate at the type boundary level (function signatures, descriptions) rather than re-listing fields, which is acceptable per the ticket pitfall guidance.

---

### Type T2: StageTemplate (canonical: `src/specs/architecture/solver-interface-trait.md` SS4.4)

**Canonical field list** (from `solver-interface-trait.md` SS4.4):

| Field            | Type         | Notes                                           |
| ---------------- | ------------ | ----------------------------------------------- |
| `num_cols`       | `usize`      | Number of columns                               |
| `num_rows`       | `usize`      | Number of structural rows (excluding cuts)      |
| `num_nz`         | `usize`      | Non-zero entries in structural matrix           |
| `col_starts`     | `Vec<usize>` | CSC column start offsets, length `num_cols + 1` |
| `row_indices`    | `Vec<usize>` | CSC row indices, length `num_nz`                |
| `values`         | `Vec<f64>`   | CSC non-zero values, length `num_nz`            |
| `col_lower`      | `Vec<f64>`   | Length `num_cols`                               |
| `col_upper`      | `Vec<f64>`   | Length `num_cols`                               |
| `objective`      | `Vec<f64>`   | Length `num_cols`                               |
| `row_lower`      | `Vec<f64>`   | Length `num_rows`                               |
| `row_upper`      | `Vec<f64>`   | Length `num_rows`                               |
| `n_state`        | `usize`      | Equal to N\*(1+L)                               |
| `n_transfer`     | `usize`      | Equal to N\*L                                   |
| `n_cut_relevant` | `usize`      | Equal to N + N\*L + n_fpha + n_gvc              |
| `n_hydro`        | `usize`      | Number of operating hydros at this stage        |
| `max_par_order`  | `usize`      | Maximum PAR order across all operating hydros   |

| Referencing File                                                  | Status     | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/architecture/solver-abstraction.md` SS11.1             | CONSISTENT | Describes the stage template concept (CSC arrays, naming, sharing) without a field list; does not conflict                                                                                                                                                                                                                                                                                  |
| `src/specs/architecture/solver-interface-testing.md` SS3.1, SS3.2 | CONSISTENT | Uses `StageTemplate` field names in test data tables: `num_cols`, `num_rows`, `num_nz`, `col_starts`, `row_indices`, `values`, `col_lower`, `col_upper`, `objective`, `row_lower`, `row_upper`, `n_state`, `n_cut_relevant`. Fields `n_transfer`, `n_hydro`, `max_par_order` are absent from test tables but this is acceptable — the test LPs are trivial and do not exercise those fields |
| `src/specs/architecture/training-loop.md` SS5.5                   | CONSISTENT | References `StageTemplate` by type in the `StageIndexer` description; no field-level claims that conflict                                                                                                                                                                                                                                                                                   |
| `src/specs/hpc/communicator-trait.md`                             | CONSISTENT | References `stages: &[StageTemplate]` in the `train` function signature; no field-level claims                                                                                                                                                                                                                                                                                              |
| `src/specs/overview/ecosystem-guidelines.md`                      | CONSISTENT | Mentions `StageTemplate` only in gap description; no field-level claims                                                                                                                                                                                                                                                                                                                     |
| `src/specs/overview/spec-gap-inventory.md`                        | CONSISTENT | Mentions `StageTemplate` in GAP-004 description; no field-level claims                                                                                                                                                                                                                                                                                                                      |

**Verdict**: T2 PASS. No referencing file contradicts the canonical field list.

---

### Type T3: StageIndexer (canonical: `src/specs/architecture/training-loop.md` SS5.5)

**Canonical field list** (from `training-loop.md` SS5.5):

| Field              | Type           | Notes                                      |
| ------------------ | -------------- | ------------------------------------------ |
| `storage`          | `Range<usize>` | Column range `[0, N)`                      |
| `inflow_lags`      | `Range<usize>` | Column range `[N, N*(1+L))`                |
| `theta`            | `usize`        | Column index `N*(1+L)`                     |
| `n_state`          | `usize`        | Total state dimension `N*(1+L)`            |
| `water_balance`    | `Range<usize>` | Row range `[0, N)`                         |
| `lag_fixing`       | `Range<usize>` | Row range `[N, N+N*L)`                     |
| `fpha_hyperplanes` | `Range<usize>` | Row range `[N+N*L, N+N*L+n_fpha)`          |
| `generic_volume`   | `Range<usize>` | Row range `[N+N*L+n_fpha, n_cut_relevant)` |
| `n_cut_relevant`   | `usize`        | Total cut-relevant rows                    |
| `hydro_count`      | `usize`        | Number of operating hydros                 |
| `max_par_order`    | `usize`        | Maximum PAR order                          |

Note: `StageIndexer` is defined in `training-loop.md` and is the canonical source; the ticket indicates the canonical source is `solver-abstraction.md` SS2.2 for the indexer, but inspecting that section reveals it contains the row/column layout formulas, not the struct definition. `StageIndexer` struct definition appears only in `training-loop.md` SS5.5, confirming it as canonical.

| Referencing File                                   | Status     | Notes                                                                                   |
| -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `src/specs/overview/spec-gap-inventory.md` GAP-005 | CONSISTENT | References `StageIndexer` by name and section (Training Loop SS5); does not list fields |

**Verdict**: T3 PASS. Only one other file references `StageIndexer` and it does not claim any fields.

---

### Type T4: CutWireRecord (canonical: `src/specs/architecture/cut-management-impl.md` SS4.2a)

**Canonical field list** (from `cut-management-impl.md` SS4.2a `#[repr(C)] struct CutWireRecord`):

| Field                | Type       | Offset | Size     | Notes                                  |
| -------------------- | ---------- | ------ | -------- | -------------------------------------- |
| `slot_index`         | `u32`      | 0      | 4        | Deterministic slot index               |
| `iteration`          | `u32`      | 4      | 4        | Iteration generated                    |
| `forward_pass_index` | `u32`      | 8      | 4        | Forward pass index                     |
| `_padding`           | `u32`      | 12     | 4        | Explicit padding for 8-byte alignment  |
| `intercept`          | `f64`      | 16     | 8        | Cut intercept α                        |
| `coefficients`       | `[f64; 0]` | 24     | variable | Variable-length tail, n_state elements |

| Referencing File                                   | Status     | Notes                                                                                                                                                                                                       |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/overview/spec-gap-inventory.md` GAP-007 | CONSISTENT | References `CutWireRecord` with `#[repr(C)]`, explicit `_padding` field, native endianness, per-cut size $24 + n_{state} \times 8$, `allgatherv` over `T = u8`. All details agree with canonical definition |

**Verdict**: T4 PASS. The only non-canonical reference to `CutWireRecord` (spec-gap-inventory.md) is fully consistent with the canonical field list and byte layout.

---

### Type T5: TrainingEvent (canonical: `src/specs/architecture/training-loop.md` SS2.1b)

**Canonical variant list** (11 variants total from `training-loop.md` SS2.1b):

Per-iteration events (7): `ForwardPassComplete`, `ForwardSyncComplete`, `BackwardPassComplete`, `CutSyncComplete`, `ConvergenceUpdate`, `CheckpointComplete`, `IterationSummary`

Lifecycle events (4): `TrainingStarted`, `TrainingFinished`, `SimulationProgress`, `SimulationFinished`

| Referencing File                                   | Status     | Notes                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/interfaces/terminal-ui.md`              | CONSISTENT | Lists all 11 variants in the event mapping table (lines 112--122). Variant names match exactly. The JSON-lines mode table mapping (lines 88--95) references only 4 variants by name but this is contextual (pipe-mode limitation), not an error |
| `src/specs/overview/spec-gap-inventory.md` GAP-013 | CONSISTENT | States "11 variants (7 per-iteration + 4 lifecycle)" matching the canonical count. Lists `StoppingRuleResult` helper struct and `Clone + Debug` derives, all consistent                                                                         |

**Verdict**: T5 PASS. Both referencing files are fully consistent with the canonical 11-variant list and variant names.

---

### Type T6: LoadError (canonical: `src/specs/architecture/input-loading-pipeline.md` SS8.1)

**Canonical variant list** (5 variants from `input-loading-pipeline.md` SS8.1):

`IoError`, `ParseError`, `SchemaError`, `CrossReferenceError`, `ConstraintError`

| Referencing File                                    | Status     | Notes                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/data-model/internal-structures.md` SS1.7 | CONSISTENT | References `LoadError` in the crate boundary contract: `pub fn load_case(path: &Path) -> Result<System, LoadError>`. States "See [Input Loading Pipeline](../architecture/input-loading-pipeline.md) SS8.1 for the full function signature, `LoadError` enum, and responsibility boundary." Does not list variants independently — defers entirely to the canonical source |
| `src/specs/overview/spec-gap-inventory.md` GAP-012  | CONSISTENT | Lists all 5 variants: `IoError`, `ParseError`, `SchemaError`, `CrossReferenceError`, `ConstraintError`. Agrees with canonical definition                                                                                                                                                                                                                                   |

**Verdict**: T6 PASS. Both referencing files are consistent with the canonical 5-variant list.

---

### Type T7: SolverError (canonical: `src/specs/architecture/solver-interface-trait.md` SS3)

**Canonical variant list** (6 variants from `solver-interface-trait.md` SS3):

| Variant               | Hard Stop | May Proceed with Partial |
| --------------------- | :-------: | :----------------------: |
| `Infeasible`          |    Yes    |            No            |
| `Unbounded`           |    Yes    |            No            |
| `NumericalDifficulty` |    No     |           Yes            |
| `TimeLimitExceeded`   |    No     |           Yes            |
| `IterationLimit`      |    No     |           Yes            |
| `InternalError`       |    Yes    |            No            |

| Referencing File                                         | Status     | Notes                                                                                                                                                                                                             |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/overview/ecosystem-guidelines.md` SS4.4       | CONSISTENT | Lists all 6 variants with identical hard-stop vs proceed-with-partial mapping. Variant names match exactly                                                                                                        |
| `src/specs/architecture/solver-interface-testing.md` SS3 | CONSISTENT | Uses `SolverError::Infeasible` and `SolverError::Unbounded` variant names. Hard-stop behavior is verified through test expectations. No variant count claim that conflicts                                        |
| `src/specs/interfaces/python-bindings.md` SS6.2          | CONSISTENT | Python `SolverError` class maps to `SolverFailure` runtime error kind; does not enumerate Rust variants or claim a variant count. The Python error type is an abstraction boundary, not a mirror of the Rust enum |

**Verdict**: T7 PASS. All referencing files are consistent with the canonical 6-variant list and hard-stop mapping.

---

## Part 2: Mathematical Notation Consistency Matrix

### Notation Family N1: Cut Coefficients (canonical: `src/specs/math/cut-management.md`)

**Canonical symbols** (from `cut-management.md` SS1 and SS2):

| Symbol                 | Meaning                                          |
| ---------------------- | ------------------------------------------------ |
| `$\alpha$`             | Cut intercept                                    |
| `$\pi^v_h$`            | Storage cut coefficient for hydro $h$            |
| `$\pi^{lag}_{h,\ell}$` | AR lag cut coefficient for hydro $h$, lag $\ell$ |
| `$p_h$`                | Per-hydro AR order (lowercase)                   |

| Usage Site                                           | Symbol Used                                                                     | Status           | Notes                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/math/lp-formulation.md` SS11              | `$\pi^v_{i,h}$`, `$\pi^{lag}_{i,h,\ell}$`                                       | CONSISTENT       | Adds cut index $i$ subscript (expected for the LP-level cut formulation); superscript convention matches                                                                                                                                                                                     |
| `src/specs/math/lp-formulation.md` SS5a              | `$\pi^{lag}_{h,\ell}$`                                                          | CONSISTENT       | Same notation for the dual variable itself                                                                                                                                                                                                                                                   |
| `src/specs/math/sddp-algorithm.md` SS3.2             | `$\pi(\omega)$` (vectorized form)                                               | CONSISTENT       | Uses compact notation `$(\alpha(\omega), \pi(\omega))$` for the cut tuple; SS3.3 references `$\pi_i^\top x_1$` consistent with the vector form                                                                                                                                               |
| `src/specs/architecture/solver-abstraction.md` SS2.2 | `$\pi^{wb}_h$`, `$\pi^{lag}_{h,\ell}$`, `$\pi^{fpha}_{h,m,k}$`, `$\pi^{gen}_g$` | CONSISTENT       | All dual symbols match `cut-management.md` conventions                                                                                                                                                                                                                                       |
| `src/specs/architecture/training-loop.md` SS7.1      | `$\pi^a_{h,\ell}$`                                                              | **INCONSISTENT** | Uses `$\pi^a_{h,\ell}$` instead of the canonical `$\pi^{lag}_{h,\ell}$` for AR lag cut coefficients                                                                                                                                                                                          |
| `src/specs/architecture/training-loop.md` SS7.1      | `$P_h$` (uppercase)                                                             | **INCONSISTENT** | Uses `$P_h$` for per-hydro AR order; canonical `cut-management.md` uses `$p_h$` (lowercase). Note: `lp-formulation.md` and `solver-abstraction.md` also use `$P_h$`, so the inconsistency is between `cut-management.md` (which uses `$p_h$`) and all architecture specs (which use `$P_h$`) |

**Verdict**: N1 FAIL. Two inconsistencies found (see Findings F1 and F2).

---

### Notation Family N2: Stage Cost Function (canonical: `src/specs/math/sddp-algorithm.md`)

**Canonical symbols** (from `sddp-algorithm.md` SS2, SS3):

| Symbol                         | Meaning                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `$V_t(x_{t-1})$`               | Value function (cost-to-go) at stage $t$                                                  |
| `$Q_t(\hat{x}_{t-1}, \omega)$` | Optimal objective of stage $t$ subproblem for state $\hat{x}_{t-1}$ and scenario $\omega$ |
| `$c_t^\top x_t$`               | Stage $t$ operating cost                                                                  |

| Usage Site                                      | Symbol Used                          | Status     | Notes                                                           |
| ----------------------------------------------- | ------------------------------------ | ---------- | --------------------------------------------------------------- |
| `src/specs/math/cut-management.md` SS1          | `$V_t(x)$`                           | CONSISTENT | Value function matches canonical                                |
| `src/specs/math/cut-management.md` SS2          | `$Q_t(\hat{x}_{t-1}, \omega_t)$`     | CONSISTENT | Stage subproblem objective matches canonical                    |
| `src/specs/architecture/training-loop.md` SS7.2 | `$Q_t(\hat{x}_{t-1}, \omega)$`       | CONSISTENT | Matches canonical form                                          |
| `src/specs/architecture/training-loop.md` SS5.1 | `$\boldsymbol{\pi}^\top \mathbf{x}$` | CONSISTENT | Uses vectorized form consistent with SDDP algorithm formulation |

**Verdict**: N2 PASS. All usage sites are consistent with the canonical symbols.

---

### Notation Family N3: Dual Variables (canonical: `src/specs/math/lp-formulation.md`)

**Canonical symbols** (from `lp-formulation.md`):

| Symbol                 | Constraint    | Meaning                                       |
| ---------------------- | ------------- | --------------------------------------------- |
| `$\pi^{lb}_{b,k}$`     | Load balance  | Marginal cost of energy at bus $b$, block $k$ |
| `$\pi^{wb}_h$`         | Water balance | Water value (marginal value of storage)       |
| `$\pi^{lag}_{h,\ell}$` | AR lag fixing | Marginal value of inflow history              |

**Sign convention** (canonical: `solver-abstraction.md` SS8, referenced by `solver-interface-trait.md` SS7):

Positive dual on $\leq$ constraint means $\partial z^*/\partial b > 0$ (increasing RHS increases objective).

| Usage Site                                               | Symbol Used                                  | Status           | Notes                                                                                                                                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/architecture/solver-abstraction.md` SS2.2     | `$\pi^{wb}_h$`, `$\pi^{lag}_{h,\ell}$`       | CONSISTENT       | Matches `lp-formulation.md` conventions exactly                                                                                                                                                                                          |
| `src/specs/math/cut-management.md` SS2                   | `$\pi^{wb}_h$`, `$\pi^{lag}_{h,\ell}$`       | CONSISTENT       | Matches canonical dual names                                                                                                                                                                                                             |
| `src/specs/architecture/training-loop.md` SS7.1          | `$\pi^v_h$`, `$\pi^a_{h,\ell}$`              | **INCONSISTENT** | Uses `$\pi^a_{h,\ell}$` instead of `$\pi^{lag}_{h,\ell}$` for the AR lag dual; uses `$\pi^v_h$` for water balance (same as `cut-management.md` cut coefficient but different from `lp-formulation.md`'s `$\pi^{wb}_h$` for the raw dual) |
| `src/specs/architecture/solver-interface-trait.md` SS7   | Canonical sign convention cited by reference | CONSISTENT       | Defers to `solver-abstraction.md` SS8                                                                                                                                                                                                    |
| `src/specs/architecture/solver-interface-testing.md` SS5 | $\pi_0 = -100.0$, $\pi_3 = 1.0$              | CONSISTENT       | Uses numeric values consistent with the canonical sign convention                                                                                                                                                                        |

**Note on `$\pi^v_h$` vs `$\pi^{wb}_h$`**: The `$\pi^{wb}_h$` symbol in `lp-formulation.md` refers to the raw dual of the water balance constraint. The `$\pi^v_h$` symbol in `cut-management.md` refers to the derived cut coefficient (which equals `$\pi^{wb}_h$` for constant-productivity hydros but includes the FPHA correction term `$+\frac{1}{2}\sum_m \pi_m^{fpha} \cdot \gamma_v^m$` for FPHA hydros). These two symbols represent genuinely different mathematical objects and the distinction is intentional. The inconsistency flagged here is specifically the `$\pi^{lag}$` vs `$\pi^a$` discrepancy.

**Verdict**: N3 FAIL. One inconsistency found (see Finding F3).

---

## Part 3: Enum Variant Completeness

### SolverError enum variants vs training loop expectations

The `SolverError` enum defines 6 variants. The training loop (`training-loop.md`) references solver errors generically, handling them as hard-stop or proceed-with-partial. The testing spec (`solver-interface-testing.md`) explicitly exercises `Infeasible` and `Unbounded`. The `ecosystem-guidelines.md` lists all 6 variants with dispositions. All 6 variants have definitions in the trait spec. No phantom variants found.

**Verdict**: PASS.

### TrainingEvent enum variants vs TUI consumption

The TUI spec (`terminal-ui.md`) maps all 11 `TrainingEvent` variants to view components. No phantom variants in either direction. The TUI table at lines 112--122 lists exactly the 11 canonical variants.

**Verdict**: PASS.

### LoadError enum variants vs usage

`internal-structures.md` and `spec-gap-inventory.md` reference `LoadError` consistently with the 5-variant canonical definition. No phantom variants found.

**Verdict**: PASS.

---

## Findings

### F1 — AR Lag Notation: `$\pi^a_{h,\ell}$` vs `$\pi^{lag}_{h,\ell}$`

**Severity**: Medium

**Type**: Notation inconsistency (N1 and N3)

**Canonical source**: `src/specs/math/cut-management.md` SS1, SS2; `src/specs/math/lp-formulation.md` SS5a

The canonical notation for the AR lag fixing dual (and the corresponding Benders cut coefficient) is `$\pi^{lag}_{h,\ell}$`, established in `cut-management.md` SS1:

```
$\theta \geq \alpha + \sum_{h \in \mathcal{H}} \pi^v_h \cdot v_h + \sum_{h \in \mathcal{H}} \sum_{\ell=1}^{p_h} \pi^{lag}_{h,\ell} \cdot a_{h,\ell}$
```

And confirmed in `lp-formulation.md` SS5a: "their dual multipliers `$\pi^{lag}_{h,\ell}$` provide the cut coefficients"

The inconsistent usage site is `src/specs/architecture/training-loop.md` SS7.1 (line 804), which writes:

```
$\theta_t \geq \alpha + \sum_{h \in \mathcal{H}} \pi^v_h \cdot v_{h,t-1} + \sum_{h \in \mathcal{H}} \sum_{\ell=1}^{P_h} \pi^a_{h,\ell} \cdot a_{h,t-1-\ell}$
```

The superscript `a` (presumably for "autoregressive") is used instead of the canonical `lag`. This notation also appears in the intercept formula at line 829 (`$\pi^a_{h,\ell}$`) and in the table and prose at lines 812--822.

**Impact**: An implementer reading `training-loop.md` SS7 in isolation and `cut-management.md` in isolation will encounter two different symbols for the same quantity, creating ambiguity during implementation of cut coefficient extraction.

**Required action**: Update `training-loop.md` SS7.1 to replace all occurrences of `$\pi^a_{h,\ell}$` with `$\pi^{lag}_{h,\ell}$` to match the canonical notation.

---

### F2 — AR Order Notation: `$p_h$` vs `$P_h$`

**Severity**: Low

**Type**: Notation inconsistency (N1)

**Canonical source**: `src/specs/math/cut-management.md` SS1

The `cut-management.md` uses lowercase `$p_h$` for the per-hydro AR order in the cut summation limits:

```
$\sum_{\ell=1}^{p_h}$   (cut-management.md lines 12, 37)
```

All architecture specs and `lp-formulation.md` use uppercase `$P_h$`:

- `solver-abstraction.md`: "$L = \max_{h} P_h$" (line 27); "individual AR order $P_h$" (line 54)
- `lp-formulation.md`: "$\sum_{\ell=1}^{P_h}$" (lines 200, 201); "individual AR order $P_h$" (line 225)
- `training-loop.md`: "$\sum_{\ell=1}^{P_h}$" (line 804)

The meaning is identical in all uses. The inconsistency is confined to `cut-management.md` using lowercase. Since `lp-formulation.md` (a math spec) establishes `$P_h$` with definition "per-hydro AR order" and is cross-referenced by all architecture specs, `$P_h$` should be considered the corpus-wide standard for this parameter.

**Impact**: Minor. Different readers may be confused when transitioning between `cut-management.md` and the architecture specs. No functional ambiguity exists.

**Required action**: Update `cut-management.md` SS1 and SS2 to replace `$p_h$` with `$P_h$` to align with the notation used in `lp-formulation.md` and all architecture specs.

---

### F3 — Stale `patch_rhs_bounds` References in Solver Interface Testing Spec

**Severity**: High

**Type**: Structural type / API name inconsistency

**Canonical source**: `src/specs/architecture/solver-interface-trait.md` SS2.3 (`patch_row_bounds`) and SS2.3a (`patch_col_bounds`)

GAP-009 was resolved by splitting the old `patch_rhs_bounds` method into two separate methods: `patch_row_bounds` (SS2.3) and `patch_col_bounds` (SS2.3a). The GAP-009 resolution log states "All cross-references updated."

However, `src/specs/architecture/solver-interface-testing.md` retains 7 occurrences of the old `patch_rhs_bounds` name, none of which were updated:

| Line | Occurrence                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 5    | Purpose paragraph: "...`patch_rhs_bounds`..." in method list                                           |
| 139  | Section SS1.3: "For `patch_rhs_bounds` tests..."                                                       |
| 170  | Section heading: "### SS1.6 patch_rhs_bounds Conformance"                                              |
| 174  | Test name: `test_solver_highs_patch_rhs_bounds_state_change`                                           |
| 175  | Test name: `test_solver_clp_patch_rhs_bounds_state_change`                                             |
| 330  | Lifecycle test step 7: "`patch_rhs_bounds` Row 0 RHS to 4.0"                                           |
| 332  | Lifecycle test step 4: "`patch_rhs_bounds` Row 0 to 4.0" and step 6: "`patch_rhs_bounds` Row 0 to 8.0" |
| 352  | Cross-References: "`patch_rhs_bounds` (SS2.3)" — incorrect section reference                           |

The cross-reference at line 352 also points `patch_rhs_bounds` to SS2.3 of `solver-interface-trait.md`, but SS2.3 now defines `patch_row_bounds`, not `patch_rhs_bounds`. This means the cross-reference anchor is broken: a reader following it will land at the correct section but find a different method name, causing confusion.

**Impact**: High. An implementer reading the conformance test spec to implement `patch_row_bounds` will find test names, test descriptions, and cross-references using the old method name. The testing spec effectively tests a method (`patch_rhs_bounds`) that no longer exists in the interface.

**Required action**:

1. In `solver-interface-testing.md` line 5: replace `patch_rhs_bounds` with `patch_row_bounds`
2. Rename section SS1.6 heading and surrounding text from `patch_rhs_bounds` to `patch_row_bounds`
3. Rename test cases from `patch_rhs_bounds_state_change` to `patch_row_bounds_state_change`
4. Update lifecycle test step descriptions at lines 330 and 332
5. Update the Cross-References entry at line 352 to list `patch_row_bounds` (SS2.3) and `patch_col_bounds` (SS2.3a) as two separate methods

---

## Summary

| Category                              | Inconsistencies        | Severity    |
| ------------------------------------- | ---------------------- | ----------- |
| T1 System                             | 0                      | —           |
| T2 StageTemplate                      | 0                      | —           |
| T3 StageIndexer                       | 0                      | —           |
| T4 CutWireRecord                      | 0                      | —           |
| T5 TrainingEvent                      | 0                      | —           |
| T6 LoadError                          | 0                      | —           |
| T7 SolverError                        | 0                      | —           |
| N1 Cut coefficient notation           | 2 (F1, F2)             | Medium, Low |
| N2 Stage cost function notation       | 0                      | —           |
| N3 Dual variable notation             | 1 (F3 also affects N3) | —           |
| Structural: `patch_rhs_bounds` rename | 1 (F3)                 | High        |

**Total inconsistencies**: 3 distinct findings (F1, F2, F3)

| Finding | File                                                 | Lines                                | Severity | Type                                                               |
| ------- | ---------------------------------------------------- | ------------------------------------ | -------- | ------------------------------------------------------------------ |
| F1      | `src/specs/architecture/training-loop.md`            | 804, 812–813, 822, 829               | Medium   | Notation: `$\pi^a$` should be `$\pi^{lag}$`                        |
| F2      | `src/specs/math/cut-management.md`                   | 12, 37                               | Low      | Notation: `$p_h$` should be `$P_h$`                                |
| F3      | `src/specs/architecture/solver-interface-testing.md` | 5, 139, 170, 174, 175, 330, 332, 352 | High     | Stale method name: `patch_rhs_bounds` should be `patch_row_bounds` |

## Recommendation

Fix the 3 failing criteria before proceeding. Priority order:

1. **F3 first** (High severity): `solver-interface-testing.md` has 7–8 stale references to `patch_rhs_bounds` that directly contradict the canonical interface definition. An implementer following the testing spec would test a non-existent method.
2. **F1 next** (Medium severity): `training-loop.md` SS7 introduces an undocumented notation variant (`$\pi^a$`) that creates ambiguity for anyone implementing cut coefficient extraction while cross-referencing both the math and architecture specs.
3. **F2 last** (Low severity): `cut-management.md` uses `$p_h$` while all other specs use `$P_h$`; functionally unambiguous but inconsistent.
