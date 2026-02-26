# Report 004 -- cobre-solver API Surface Completeness Audit

**Crate**: cobre-solver
**Phase**: 3 (Solver + Communication)
**Auditor**: sddp-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name                  | Category | Spec File                   | Section | Status   | Notes                                                                                                                                                                                                                                            |
| -------------------------- | -------- | --------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SolverInterface`          | Trait    | `solver-interface-trait.md` | SS1     | COMPLETE | 10 methods with full Rust signatures, `Send` bound, `&mut self`/`&self` receiver documented per method. Trait requires `Send` but not `Sync`.                                                                                                    |
| `SolverError`              | Enum     | `solver-interface-trait.md` | SS3     | COMPLETE | 6 variants with concrete Rust field types. Hard-stop vs proceed-with-partial mapping table. `#[derive(Debug)]` specified.                                                                                                                        |
| `LpSolution`               | Struct   | `solver-interface-trait.md` | SS4.1   | COMPLETE | 6 fields fully typed (`objective: f64`, `primal: Vec<f64>`, `dual: Vec<f64>`, `reduced_costs: Vec<f64>`, `iterations: u64`, `solve_time_seconds: f64`).                                                                                          |
| `Basis`                    | Struct   | `solver-interface-trait.md` | SS4.2   | COMPLETE | 2 fields (`col_status: Vec<BasisStatus>`, `row_status: Vec<BasisStatus>`). Stored in original problem space.                                                                                                                                     |
| `BasisStatus`              | Enum     | `solver-interface-trait.md` | SS4.2   | COMPLETE | 5 variants (`AtLower`, `Basic`, `AtUpper`, `Free`, `Fixed`). Mapping to HiGHS/CLP status codes documented in `solver-highs-impl.md` SS2.6.                                                                                                       |
| `SolverStatistics`         | Struct   | `solver-interface-trait.md` | SS4.3   | COMPLETE | 6 fields fully typed (`solve_count: u64`, `success_count: u64`, `failure_count: u64`, `total_iterations: u64`, `retry_count: u64`, `total_solve_time_seconds: f64`).                                                                             |
| `StageTemplate`            | Struct   | `solver-interface-trait.md` | SS4.4   | COMPLETE | 13 fields fully typed. CSC arrays (`col_starts`, `row_indices`, `values`), bounds (`col_lower`, `col_upper`, `row_lower`, `row_upper`), objective, plus layout metadata (`n_state`, `n_transfer`, `n_cut_relevant`, `n_hydro`, `max_par_order`). |
| `CutBatch`                 | Struct   | `solver-interface-trait.md` | SS4.5   | COMPLETE | 5 fields fully typed. CSR arrays (`row_starts`, `col_indices`, `values`), row bounds (`row_lower`, `row_upper`).                                                                                                                                 |
| `StageIndexer`             | Struct   | `training-loop.md`          | SS5.5   | COMPLETE | 10 fields fully typed with `Range<usize>` and `usize` types. Worked example provided (SS5.5.3). Located in `training-loop.md`, not in a solver spec -- see F-001 below.                                                                          |
| Workspace type             | Struct   | `solver-workspaces.md`      | SS1.2   | PARTIAL  | Contents specified as a table (8 components) but no concrete Rust struct definition. No Rust type name. No field definitions. See F-002.                                                                                                         |
| Workspace Manager type     | Struct   | `solver-workspaces.md`      | SS1.7   | PARTIAL  | Responsibilities documented (array of workspaces, indexed access, aggregated statistics) but no concrete Rust struct, field types, or method signatures. See F-002.                                                                              |
| HiGHS configuration struct | Struct   | `solver-highs-impl.md`      | SS4.1   | MISSING  | SDDP-tuned settings table (9 parameters) lists HiGHS option names and values, but no Rust configuration struct type definition exists. See F-003.                                                                                                |

### 1.2 Public Functions

| Item Name                                                                       | Category     | Spec File                   | Section | Status   | Notes                                                                                                                                         |
| ------------------------------------------------------------------------------- | ------------ | --------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `load_model(&mut self, template: &StageTemplate)`                               | Trait method | `solver-interface-trait.md` | SS2.1   | COMPLETE | Full signature, pre/postcondition tables, infallibility documented with upstream reference to SS11.1.                                         |
| `add_cut_rows(&mut self, cuts: &CutBatch)`                                      | Trait method | `solver-interface-trait.md` | SS2.2   | COMPLETE | Full signature, pre/postcondition tables, infallibility documented with upstream reference to SS5.                                            |
| `patch_row_bounds(&mut self, patches: &[(usize, f64, f64)])`                    | Trait method | `solver-interface-trait.md` | SS2.3   | COMPLETE | Full signature, pre/postcondition tables, infallibility documented. HiGHS/CLP API mapping table.                                              |
| `patch_col_bounds(&mut self, patches: &[(usize, f64, f64)])`                    | Trait method | `solver-interface-trait.md` | SS2.3a  | COMPLETE | Full signature, pre/postcondition tables, infallibility documented. Not used in minimal viable SDDP.                                          |
| `solve(&mut self) -> Result<LpSolution, SolverError>`                           | Trait method | `solver-interface-trait.md` | SS2.4   | COMPLETE | Full signature, split Ok/Err postcondition tables, fallibility documented.                                                                    |
| `solve_with_basis(&mut self, basis: &Basis) -> Result<LpSolution, SolverError>` | Trait method | `solver-interface-trait.md` | SS2.5   | COMPLETE | Full signature, split Ok/Err postcondition tables, basis dimension mismatch handling documented.                                              |
| `reset(&mut self)`                                                              | Trait method | `solver-interface-trait.md` | SS2.6   | COMPLETE | Full signature, postcondition table, infallibility documented. Statistics preservation noted.                                                 |
| `get_basis(&self) -> Basis`                                                     | Trait method | `solver-interface-trait.md` | SS2.7   | COMPLETE | Full signature, precondition (successful solve required), postcondition table, infallibility documented.                                      |
| `statistics(&self) -> SolverStatistics`                                         | Trait method | `solver-interface-trait.md` | SS2.8   | COMPLETE | Full signature, postcondition table, infallibility documented.                                                                                |
| `name(&self) -> &'static str`                                                   | Trait method | `solver-interface-trait.md` | SS2.9   | COMPLETE | Full signature, postcondition table, infallibility documented.                                                                                |
| Workspace creation function                                                     | Function     | `solver-workspaces.md`      | SS1.3   | PARTIAL  | Initialization sequence described (6-step procedure) but no Rust function signature. See F-002.                                               |
| Workspace destruction function                                                  | Function     | `solver-workspaces.md`      | SS1.3a  | PARTIAL  | Destruction phase described in lifecycle table but no Rust function signature. See F-002.                                                     |
| `build_stage_template(system, stage_def, stage_index) -> StageTemplate`         | Function     | `solver-interface-trait.md` | SS4.4   | PARTIAL  | Signature shown in a comment block. Owned by `cobre-sddp`, not `cobre-solver`. Parameter types are prose references, not concrete Rust types. |

### 1.3 Error Types

| Item Name                                 | Category | Spec File                    | Section    | Status   | Notes                                                                                                                                                    |
| ----------------------------------------- | -------- | ---------------------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SolverError` enum definition             | Enum     | `solver-interface-trait.md`  | SS3        | COMPLETE | Full Rust enum with 6 variants, concrete field types, and doc comments for each variant.                                                                 |
| Hard-stop vs proceed-with-partial mapping | Contract | `solver-interface-trait.md`  | SS3        | COMPLETE | 6-row mapping table (`Infeasible`/`Unbounded`/`InternalError` = hard stop; `NumericalDifficulty`/`TimeLimitExceeded`/`IterationLimit` = may proceed).    |
| Err recovery contract                     | Contract | `solver-interface-trait.md`  | SS2.4      | COMPLETE | Documented in the `Err` postcondition table: "The caller should call `reset()` before reusing the solver."                                               |
| Per-method fallibility classification     | Contract | `solver-interface-trait.md`  | SS2.1--2.9 | COMPLETE | Each method explicitly states "Infallibility" or "Fallibility" with rationale. Only `solve` and `solve_with_basis` return `Result`.                      |
| HiGHS status-to-SolverError mapping       | Mapping  | `solver-highs-impl.md`       | SS2.4      | COMPLETE | 8-row table mapping `Highs_getModelStatus` integer codes (4, 7, 8, 9, 10, 13, 14, 15) to `SolverError` variants. Disambiguation for status 9 documented. |
| Retry config parameters                   | Config   | `configuration-reference.md` | --         | MISSING  | GAP-019 is unresolved. See F-004.                                                                                                                        |

### 1.4 Trait Implementations

| Item Name                          | Category | Spec File              | Section | Status   | Notes                                                                                                                                            |
| ---------------------------------- | -------- | ---------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| HiGHS `load_model`                 | Impl     | `solver-highs-impl.md` | SS2.1   | COMPLETE | Maps to `Highs_passLp` with full parameter list. CSC format preference documented with rationale.                                                |
| HiGHS `add_cut_rows`               | Impl     | `solver-highs-impl.md` | SS2.2   | COMPLETE | Maps to `Highs_addRows` with full parameter list. CSR format documented.                                                                         |
| HiGHS `patch_row_bounds`           | Impl     | `solver-highs-impl.md` | SS2.3   | COMPLETE | Maps to `Highs_changeRowsBoundsBySet` with batch API. Performance implication documented (~2,240 updates).                                       |
| HiGHS `patch_col_bounds`           | Impl     | `solver-highs-impl.md` | SS2.3   | COMPLETE | Maps to `Highs_changeColsBoundsBySet` with batch API.                                                                                            |
| HiGHS `solve` / `solve_with_basis` | Impl     | `solver-highs-impl.md` | SS2.4   | COMPLETE | Maps to `Highs_run`. Status interpretation table with 8 entries. Warm-start automatic via `Highs_setBasis`.                                      |
| HiGHS `get_basis`                  | Impl     | `solver-highs-impl.md` | SS2.6   | COMPLETE | Maps to `Highs_getBasis` / `Highs_setBasis`. Status code mapping table (5 codes). Interaction with cut row extension documented.                 |
| HiGHS `reset`                      | Impl     | `solver-highs-impl.md` | SS2.7   | COMPLETE | Maps to `Highs_clearSolver`. Full reset path (`Highs_destroy` + `Highs_create`) also documented.                                                 |
| HiGHS `statistics`                 | Impl     | `solver-highs-impl.md` | SS2.5   | COMPLETE | `Highs_getObjectiveValue`, `Highs_getSimplexIterationCount` documented. Solution extraction via `Highs_getSolution`.                             |
| HiGHS `name`                       | Impl     | --                     | --      | COMPLETE | Trivially returns `"highs"`. Documented in trait definition SS2.9.                                                                               |
| HiGHS retry escalation             | Impl     | `solver-highs-impl.md` | SS3     | COMPLETE | 5-step escalation table with specific HiGHS API calls per attempt. Post-retry settings restoration documented.                                   |
| HiGHS dual normalization           | Impl     | `solver-highs-impl.md` | SS6.2   | PARTIAL  | Sign convention verification requirement stated but the actual HiGHS sign convention is deferred to implementation-time verification. See F-005. |
| HiGHS infeasibility diagnostics    | Impl     | `solver-highs-impl.md` | SS2.8   | COMPLETE | `Highs_getDualRay` and `Highs_getPrimalRay` documented with availability flags and pre-allocated arrays.                                         |

### 1.5 Crate Boundary Interactions

| Boundary                          | Direction | Items Exchanged                                     | Spec File                                           | Section        | Status   | Notes                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | --------- | --------------------------------------------------- | --------------------------------------------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-solver -> cobre-core        | Imports   | `StageTemplate`, `StageIndexer`                     | `solver-interface-trait.md`, `training-loop.md`     | SS4.4, SS5.5   | PARTIAL  | `StageTemplate` is defined in `solver-interface-trait.md` (SS4.4) with a note that construction is owned by `cobre-sddp`. `StageIndexer` is defined in `training-loop.md` (SS5.5), which is a `cobre-sddp` spec. The crate ownership boundary is unclear -- which crate defines these types? See F-006. |
| cobre-sddp -> cobre-solver        | Calls     | `SolverInterface` trait methods, workspace creation | `solver-interface-trait.md`, `solver-workspaces.md` | SS1--2, SS1.3a | COMPLETE | The training loop's stage solve workflow (7-step sequence in `solver-workspaces.md` SS1.4) fully specifies the call sequence.                                                                                                                                                                           |
| cobre-sddp -> cobre-solver        | Passes    | `CutBatch`, `StageTemplate`, `Basis`, `LpSolution`  | `solver-interface-trait.md`                         | SS4            | COMPLETE | All data types crossing the boundary have concrete Rust definitions.                                                                                                                                                                                                                                    |
| cobre-solver -> HiGHS C API       | FFI       | Opaque `void*` handle, C function calls             | `solver-highs-impl.md`                              | SS1--2         | COMPLETE | Complete API mapping table (SS1) and per-operation API calls (SS2). FFI layer documented as `extern "C"` direct calls.                                                                                                                                                                                  |
| cobre-solver -> solver-workspaces | Internal  | Solver instance, buffers, basis cache               | `solver-workspaces.md`                              | SS1.2          | PARTIAL  | Workspace contents documented but no Rust type boundary between the workspace and the solver instance. See F-002.                                                                                                                                                                                       |

---

## 2. Findings

### F-001: StageIndexer defined in training-loop.md, not in a solver crate spec

**Severity**: Low
**Affected Crate**: cobre-solver (or cobre-sddp)
**Affected Phase**: Phase 3

**Evidence**: `training-loop.md` SS5.5:

> "The `StageIndexer` provides a read-only index map for accessing LP primal and dual positions by semantic name. It eliminates magic index numbers from the training loop and centralizes all LP layout arithmetic in one place."

And `solver-interface-trait.md` SS4.4:

> "**Construction ownership**: The `cobre-sddp` crate owns `StageTemplate` construction."

**Impact**: The `StageIndexer` is defined in a cobre-sddp spec (`training-loop.md`), yet its data mirrors LP layout metadata already present in `StageTemplate` (`n_state`, `n_cut_relevant`, `n_hydro`, `max_par_order`). If both `StageTemplate` and `StageIndexer` live in the same crate, this is fine. But the crate overview (`solver.md`) lists `StageTemplate` as a solver-crate type, while `StageIndexer` appears only in the training loop spec. The owning crate for each type is ambiguous.

**Recommendation**: Clarify in the spec which crate defines `StageTemplate` and `StageIndexer`. The CLAUDE.md guideline says `StageTemplate` and `StageIndexer` are cobre-core LP layout types (ticket context line: "depends on cobre-core for LP layout types (StageTemplate, StageIndexer)"). If they belong to cobre-core, both specs should reference cobre-core as the defining crate. If cobre-solver defines `StageTemplate`, update the crate overview to reflect this. The `StageIndexer` struct definition should appear in a spec owned by the same crate as `StageTemplate`.

---

### F-002: Workspace type has no concrete Rust struct definition

**Severity**: Medium
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-workspaces.md` SS1.2 describes workspace contents as a table:

> "Each thread-local workspace contains the following components: [table with 8 rows: Solver instance, RHS patch buffer, Primal buffer, Dual buffer, Reduced cost buffer, Per-stage basis cache, Solve statistics, NUMA node ID]"

And SS1.3a provides a lifecycle summary table:

> "**Creation** -- Once, at Initialization phase start. Within a parallel region, each thread creates its own workspace on its NUMA node via first-touch allocation (SS1.3)."

And SS1.7 describes the workspace manager:

> "A workspace manager owns the array of all thread-local workspaces within an MPI rank: Creates one workspace per OpenMP thread at initialization"

**Impact**: No Rust struct name, no field definitions, no method signatures for workspace creation, workspace access, workspace destruction, or workspace statistics aggregation. The solver-workspaces.md spec thoroughly describes the behavioral requirements and memory layout but stops short of providing any Rust type definitions. An implementer must invent the entire Rust API surface for the workspace layer.

**Recommendation**: Add a concrete Rust struct definition for the workspace type (e.g., `SolverWorkspace<S: SolverInterface>`) with typed fields for each component in the SS1.2 table. Add a `WorkspaceManager` struct with at minimum `fn new(num_threads: usize, factory: impl Fn() -> S) -> Self`, `fn get(&self, thread_id: usize) -> &mut SolverWorkspace<S>`, and `fn aggregate_statistics(&self) -> SolverStatistics`. Include the destruction function signature.

---

### F-003: HiGHS-specific configuration has no Rust type

**Severity**: Low
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-highs-impl.md` SS4.1 provides a table of SDDP-tuned settings:

> "| Solver algorithm | `"solver"` -> `"simplex"` | `"simplex"` | Simplex required for basis warm-starting |"
> "| Simplex strategy | `"simplex_strategy"` -> `4` | 4 (dual) | Dual simplex is the standard for SDDP |"
> "| Presolve | `"presolve"` -> `"off"` | `"off"` | Disabled for warm-start compatibility |"

The table lists 9 settings with HiGHS option names and values.

**Impact**: No Rust struct to hold these settings. An implementer must decide whether to hard-code them, use a builder pattern, or parse from configuration. The `configuration-reference.md` has no corresponding solver section. This is a minor issue because the settings are well-documented and could be implemented as constants.

**Recommendation**: Define a `HiGHsConfig` struct with fields for the configurable parameters (iteration limit, time limit) and document the hard-coded defaults for the non-configurable ones. Alternatively, document explicitly that these are implementation-internal constants not exposed via configuration.

---

### F-004: GAP-019 (solver retry configuration) remains unresolved

**Severity**: Medium
**Affected Crate**: cobre-sddp (config) and cobre-solver (consumer)
**Affected Phase**: Phase 3

**Evidence**: `spec-gap-inventory.md` GAP-019:

> "The retry logic contract specifies \"maximum attempts: 5\" and \"time budget\" as defaults, but no configuration parameters for these appear in [Configuration Reference](../configuration/configuration-reference.md). The retry policy is hardcoded behavior with no user override path."

Resolution path from the gap inventory:

> "Add `solver.retry_max_attempts` and `solver.retry_time_budget_seconds` to the configuration reference. Alternatively, document that these are implementation-internal constants not exposed to users."

And `solver-abstraction.md` SS7.1:

> "| Maximum attempts | A configurable upper bound on retry attempts (default: 5) |"
> "| Time budget | A configurable wall-clock budget for all attempts combined |"

Verification: `configuration-reference.md` contains no `solver.` prefix parameters and no `retry` keyword anywhere in the file.

**Impact**: The retry contract in SS7.1 uses the word "configurable" for both maximum attempts and time budget, but no configuration path exists. An implementer faces ambiguity: should these be user-configurable parameters loaded from `config.json`, or hard-coded constants? The gap resolution path offers both options but neither has been executed.

**Recommendation**: Execute the GAP-019 resolution: either add `solver.retry_max_attempts` (default: 5) and `solver.retry_time_budget_seconds` to `configuration-reference.md`, or change the SS7.1 text from "configurable" to "implementation-internal constant (default: 5)" and document this decision.

---

### F-005: HiGHS dual sign convention deferred to implementation-time verification

**Severity**: Medium
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-highs-impl.md` SS6.2:

> "HiGHS's dual sign convention must be verified against the canonical sign convention defined in [Solver Abstraction SS8](./solver-abstraction.md). If HiGHS reports duals with a different sign for $\geq$ constraints, the HiGHS implementation must negate the appropriate dual values before returning them to the SDDD algorithm. This is a critical correctness requirement -- sign errors in duals produce divergent cuts."

And `solver-interface-trait.md` SS7:

> "**Implementation responsibility:** Each solver backend must know its native dual sign convention and apply the appropriate transformation."

And `solver-abstraction.md` SS8:

> "| $\mathbf{a}'\mathbf{x} \leq b$ | Increasing RHS $b$ increases objective (shadow price $\partial z^*/\partial b > 0$) |"

**Impact**: The canonical sign convention is fully specified (positive dual on $\leq$ means positive shadow price), but the actual HiGHS sign convention is not documented in the spec. The spec says "must be verified" -- meaning this verification has not been performed at spec time. This creates a correctness risk: a sign error in dual normalization produces divergent cuts ($\beta_t^k = W_t^\top \pi_t^*$ with wrong sign). The spec correctly identifies this as a "critical correctness requirement" but defers the analysis.

**Recommendation**: Document the HiGHS dual sign convention in `solver-highs-impl.md` based on HiGHS documentation or empirical verification. HiGHS uses the convention where row duals are defined as $\pi_i = \partial z^* / \partial b_i$ (same as the Cobre canonical convention for row-form LPs), so no negation is needed for $\leq$ constraints. This should be verified and documented before Phase 3 implementation begins. Add a mandatory finite-difference sensitivity check to the conformance test suite per `CLAUDE.md` guidelines: "Finite-difference sensitivity check: the strongest dual verification."

---

### F-006: StageTemplate and StageIndexer crate ownership boundary unclear

**Severity**: Medium
**Affected Crate**: cobre-solver, cobre-core, cobre-sddp
**Affected Phase**: Phase 3

**Evidence**: `solver-interface-trait.md` SS4.4:

> "**Construction ownership**: The `cobre-sddp` crate owns `StageTemplate` construction. A builder function in `cobre-sddp` takes a reference to the resolved `System` struct ([Internal Structures SS1](../data-model/internal-structures.md)) and the `StageDefinition` for the target stage, and produces a `StageTemplate`. The solver crate (`cobre-solver`) receives `StageTemplate` as an opaque data holder and does not interpret its contents -- it bulk-loads the CSC arrays into the underlying LP solver without understanding what the columns or rows represent."

`crates/solver.md` overview:

> "cobre-solver provides the backend-agnostic LP solver interface"

Ticket-004 context line:

> "cobre-solver [...] depends on cobre-core for LP layout types (StageTemplate, StageIndexer)"

`training-loop.md` SS5.5:

> "The `StageIndexer` provides a read-only index map for accessing LP primal and dual positions by semantic name."
> "**Owned by the stage definition**: The indexer is associated with the stage template ([Solver Interface Trait SS4.4](./solver-interface-trait.md)), not with any solver instance."

**Impact**: Three specs assign ownership differently: the trait spec says `cobre-sddp` constructs `StageTemplate`; the ticket context says they are `cobre-core` types; the training-loop spec defines `StageIndexer` without naming its owning crate. This three-way ambiguity affects Cargo dependency structure: if `StageTemplate` is defined in cobre-core, cobre-solver depends on cobre-core. If defined in cobre-solver, cobre-sddp depends on cobre-solver for the type. If defined in cobre-sddp, cobre-solver cannot use it without a circular dependency.

**Recommendation**: Resolve definitively which crate defines `StageTemplate` and `StageIndexer`. The cleanest architecture would be: cobre-core defines both types (they are LP-layout data holders, not solver-specific), cobre-sddp constructs them from `System` data, and cobre-solver consumes them as opaque CSC data. Update the trait spec SS4.4 and the crate overview files to reflect this decision.

---

### F-007: solver-interface-testing.md uses old name `patch_rhs_bounds` instead of `patch_row_bounds`

**Severity**: High
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-interface-testing.md` line 5:

> "This spec defines the conformance test suite for the `SolverInterface` trait ([Solver Interface Trait](./solver-interface-trait.md)): `load_model`, `add_cut_rows`, `patch_rhs_bounds`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name`."

Line 139:

> "For `patch_rhs_bounds` tests, the state-fixing constraint (Row 0) RHS is changed from 6.0 to 4.0"

Line 170:

> "### SS1.6 patch_rhs_bounds Conformance"

Lines 174-175:

> "| `test_solver_highs_patch_rhs_bounds_state_change` | Load shared fixture. Add both cuts. Patch Row 0 RHS..."
> "| `test_solver_clp_patch_rhs_bounds_state_change` | Same as above."

Line 352:

> "method contracts for `load_model` (SS2.1), `add_cut_rows` (SS2.2), `patch_rhs_bounds` (SS2.3)"

Meanwhile, `spec-gap-inventory.md` line 160 documents the rename as resolved:

> "Source of GAP-009 (resolved: `patch_rhs_bounds` split into `patch_row_bounds`/`patch_col_bounds`)"

And `solver-interface-trait.md` SS2.3 uses the correct new name:

> "fn patch_row_bounds(&mut self, patches: &[(usize, f64, f64)]);"

**Impact**: The testing spec uses the pre-rename method name `patch_rhs_bounds` throughout (section heading, test names, cross-references). The trait spec uses the post-rename name `patch_row_bounds`. This inconsistency means the testing spec does not match the trait it is testing. Additionally, the testing spec's method enumeration in line 5 lists only 9 methods (omitting `patch_col_bounds`), while the trait has 10 methods.

**Recommendation**: Update `solver-interface-testing.md` to: (1) rename all occurrences of `patch_rhs_bounds` to `patch_row_bounds`, (2) add `patch_col_bounds` to the method enumeration, (3) add conformance tests for `patch_col_bounds`, (4) update test names from `test_solver_*_patch_rhs_bounds_*` to `test_solver_*_patch_row_bounds_*`, (5) update the cross-references section.

---

### F-008: Solver workspace statistics missing `warm_start_count`, `cold_start_count`, `max_solve_time`

**Severity**: Low
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-workspaces.md` SS1.6 defines 7 statistics counters:

> "| Total solves | Number of LP solves performed by this thread |"
> "| Warm starts | Number of solves that used a cached basis |"
> "| Cold starts | Number of solves without a cached basis |"
> "| Retries | Number of solves that required retry escalation |"
> "| Simplex iterations | Total simplex iterations across all solves |"
> "| Total solve time | Cumulative wall-clock time spent in solver calls |"
> "| Max solve time | Maximum single-solve wall-clock time (outlier detection) |"

But `SolverStatistics` in `solver-interface-trait.md` SS4.3 defines only 6 fields:

> "pub solve_count: u64,"
> "pub success_count: u64,"
> "pub failure_count: u64,"
> "pub total_iterations: u64,"
> "pub retry_count: u64,"
> "pub total_solve_time_seconds: f64,"

**Impact**: The `SolverStatistics` struct is missing `warm_start_count`, `cold_start_count`, and `max_solve_time` from the workspace spec. Also, the workspace spec lists `warm_starts` / `cold_starts` while the trait spec lists `success_count` / `failure_count` -- these are different decompositions. The workspace spec decomposes by warm-start vs cold-start; the trait spec decomposes by Ok vs Err outcome. Both decompositions are useful but neither spec reconciles them.

**Recommendation**: Add `warm_start_count: u64`, `cold_start_count: u64`, and `max_solve_time_seconds: f64` to `SolverStatistics`. Document that the warm/cold decomposition is orthogonal to the success/failure decomposition: `solve_count = warm_start_count + cold_start_count = success_count + failure_count`.

---

### F-009: Trait says 10 methods, ticket says 9 methods

**Severity**: Low
**Affected Crate**: cobre-solver
**Affected Phase**: Phase 3

**Evidence**: `solver-interface-trait.md` SS1:

> "The solver interface is modeled as a Rust trait with 10 methods."

The trait definition in SS1 lists 10 methods: `load_model`, `add_cut_rows`, `patch_row_bounds`, `patch_col_bounds`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name`.

Ticket-004 repeatedly says "9 methods":

> "SolverInterface trait (9 methods)"
> "all 9 SolverInterface methods are inspected"

The solver-abstraction.md SS4.1 operations table lists 9 operations (combining patch_row_bounds and patch_col_bounds into a single "Patch" concept, plus no separate "name" entry).

**Impact**: Minor documentation inconsistency. The actual trait has 10 methods (the post-GAP-009 split of `patch_rhs_bounds` into `patch_row_bounds` + `patch_col_bounds` added one method, and `name()` was always a 10th method not in the SS4.1 operations table). The "9 methods" count in the ticket predates or does not account for the split.

**Recommendation**: Update `solver-abstraction.md` SS4.1 to list 10 operations (split the "Patch" row into "Patch row bounds" and "Patch col bounds", or add "Name" as a separate row). Update cross-references that say "9 methods" to "10 methods".

---

## 3. Special Attention Items

### 3.1 All 10 SolverInterface Trait Methods

All 10 methods have concrete Rust signatures with parameter types, return types, and behavioral contracts (pre/postconditions). The methods are:

| #   | Method             | Signature                                                       | Fallible | Contract                                                                                            |
| --- | ------------------ | --------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| 1   | `load_model`       | `(&mut self, template: &StageTemplate)`                         | No       | Pre: valid CSC, LP layout convention. Post: model loaded, basis cleared.                            |
| 2   | `add_cut_rows`     | `(&mut self, cuts: &CutBatch)`                                  | No       | Pre: model loaded, valid CSR. Post: cuts appended at bottom.                                        |
| 3   | `patch_row_bounds` | `(&mut self, patches: &[(usize, f64, f64)])`                    | No       | Pre: model loaded, valid indices. Post: bounds updated, basis preserved.                            |
| 4   | `patch_col_bounds` | `(&mut self, patches: &[(usize, f64, f64)])`                    | No       | Pre: model loaded, valid indices. Post: bounds updated, basis preserved.                            |
| 5   | `solve`            | `(&mut self) -> Result<LpSolution, SolverError>`                | Yes      | Pre: model loaded. Ok: optimal solution with normalized duals. Err: terminal failure, call reset(). |
| 6   | `solve_with_basis` | `(&mut self, basis: &Basis) -> Result<LpSolution, SolverError>` | Yes      | Pre: model loaded, basis dimensions match. Ok/Err: same as solve.                                   |
| 7   | `reset`            | `(&mut self)`                                                   | No       | Pre: none. Post: clean state, statistics preserved.                                                 |
| 8   | `get_basis`        | `(&self) -> Basis`                                              | No       | Pre: successful solve completed. Post: basis with canonical status values.                          |
| 9   | `statistics`       | `(&self) -> SolverStatistics`                                   | No       | Pre: none. Post: non-negative monotonic counters.                                                   |
| 10  | `name`             | `(&self) -> &'static str`                                       | No       | Pre: none. Post: non-empty constant string.                                                         |

**Verdict**: COMPLETE. All 10 methods fully specified.

### 3.2 SolverError Hard-Stop vs Proceed-with-Partial Mapping

Fully specified in `solver-interface-trait.md` SS3:

| Variant               | Hard Stop | Partial Solution | Structured Fields                                              |
| --------------------- | --------- | ---------------- | -------------------------------------------------------------- |
| `Infeasible`          | Yes       | No               | `ray: Option<Vec<f64>>`                                        |
| `Unbounded`           | Yes       | No               | `direction: Option<Vec<f64>>`                                  |
| `NumericalDifficulty` | No        | Yes              | `partial_solution: Option<LpSolution>`, `message: String`      |
| `TimeLimitExceeded`   | No        | Yes              | `partial_solution: Option<LpSolution>`, `elapsed_seconds: f64` |
| `IterationLimit`      | No        | Yes              | `partial_solution: Option<LpSolution>`, `iterations: u64`      |
| `InternalError`       | Yes       | No               | `message: String`, `error_code: Option<i32>`                   |

**Verdict**: COMPLETE. Matches the CLAUDE.md `SolverError` pattern specification exactly.

### 3.3 StageTemplate and StageIndexer Concrete Fields

`StageTemplate` (13 fields, all typed):

- CSC: `col_starts: Vec<usize>`, `row_indices: Vec<usize>`, `values: Vec<f64>`
- Bounds: `col_lower: Vec<f64>`, `col_upper: Vec<f64>`, `row_lower: Vec<f64>`, `row_upper: Vec<f64>`, `objective: Vec<f64>`
- Dimensions: `num_cols: usize`, `num_rows: usize`, `num_nz: usize`
- Layout metadata: `n_state: usize`, `n_transfer: usize`, `n_cut_relevant: usize`, `n_hydro: usize`, `max_par_order: usize`

`StageIndexer` (10 fields, all typed):

- Columns: `storage: Range<usize>`, `inflow_lags: Range<usize>`, `theta: usize`, `n_state: usize`
- Rows: `water_balance: Range<usize>`, `lag_fixing: Range<usize>`, `fpha_hyperplanes: Range<usize>`, `generic_volume: Range<usize>`, `n_cut_relevant: usize`
- System: `hydro_count: usize`, `max_par_order: usize`

**Verdict**: COMPLETE for both types. Concrete Rust struct definitions with all fields typed.

### 3.4 Workspace Lifecycle

The 4-phase lifecycle is documented in `solver-workspaces.md` SS1.3a:

| Phase                | Specified                    | Function Signature |
| -------------------- | ---------------------------- | ------------------ |
| Creation             | Yes (SS1.3, 6-step sequence) | No Rust signature  |
| Per-iteration reuse  | Yes (SS1.4, 7-step sequence) | No Rust signature  |
| Per-stage transition | Yes (SS1.4 steps 1-7)        | No Rust signature  |
| Destruction          | Yes (SS1.3a table)           | No Rust signature  |

**Verdict**: PARTIAL. Behavioral specification is thorough (lifecycle phases, invariants, NUMA-awareness, statistics aggregation). Missing: Rust struct definition, method signatures, generic parameter `<S: SolverInterface>`. See F-002.

### 3.5 HiGHS Backend Mapping

Every trait method maps to specific HiGHS C API calls:

| Trait Method       | HiGHS C API Call(s)                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `load_model`       | `Highs_passLp`                                                                                                            |
| `add_cut_rows`     | `Highs_addRows`                                                                                                           |
| `patch_row_bounds` | `Highs_changeRowsBoundsBySet`                                                                                             |
| `patch_col_bounds` | `Highs_changeColsBoundsBySet`                                                                                             |
| `solve`            | `Highs_run` + `Highs_getModelStatus` + `Highs_getSolution` + `Highs_getObjectiveValue` + `Highs_getSimplexIterationCount` |
| `solve_with_basis` | `Highs_setBasis` + `Highs_run` + (same extraction as solve)                                                               |
| `reset`            | `Highs_clearSolver`                                                                                                       |
| `get_basis`        | `Highs_getBasis`                                                                                                          |
| `statistics`       | `Highs_getSimplexIterationCount` (iterations component)                                                                   |
| `name`             | Returns `"highs"` (no API call)                                                                                           |

**Verdict**: COMPLETE. All 10 methods mapped to concrete HiGHS C API calls.

### 3.6 Dual Normalization Convention and Mathematical Failure Mode

The canonical sign convention is fully specified in `solver-abstraction.md` SS8:

> "| $\mathbf{a}'\mathbf{x} \leq b$ | Increasing RHS $b$ increases objective (shadow price $\partial z^*/\partial b > 0$) |"

The mathematical failure mode is documented in `solver-interface-trait.md` SS7:

> "A sign error in $\pi_t^*$ produces cuts that point in the wrong direction, leading to divergence of the outer approximation."

The cut coefficient formula is given:

> "$\beta_t^k = W_t^\top \pi_t^*$"

**Verdict**: COMPLETE for the convention and failure mode specification. PARTIAL for HiGHS-specific sign analysis (see F-005).

### 3.7 GAP-019 Current State

GAP-019 is a Medium-severity gap that remains **unresolved**. The retry logic contract in `solver-abstraction.md` SS7.1 specifies "configurable" parameters with no configuration path. See F-004.

### 3.8 patch_row_bounds / patch_col_bounds Naming Verification

| File                          | Uses Correct Name | Notes                                                                                     |
| ----------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `solver-interface-trait.md`   | Yes               | `patch_row_bounds` (SS2.3), `patch_col_bounds` (SS2.3a)                                   |
| `solver-abstraction.md`       | Yes               | `patch_row_bounds` (SS4.1, SS11.2, SS11.3, SS11.4)                                        |
| `solver-highs-impl.md`        | Yes               | `patch_row_bounds` / `patch_col_bounds` in SS2.3 table                                    |
| `solver-workspaces.md`        | Yes               | `patch_row_bounds` (SS1.4 step 3)                                                         |
| `solver-interface-testing.md` | **No**            | Uses old name `patch_rhs_bounds` (6 occurrences). See F-007.                              |
| `spec-gap-inventory.md`       | Mixed             | Documents the rename as resolved but still references old name in the "Source of" column. |

---

## 4. Summary Statistics

| Category                    | COMPLETE | PARTIAL | MISSING | Total  |
| --------------------------- | -------- | ------- | ------- | ------ |
| Public Types                | 9        | 2       | 1       | 12     |
| Public Functions            | 10       | 3       | 0       | 13     |
| Error Types                 | 5        | 0       | 1       | 6      |
| Trait Implementations       | 11       | 1       | 0       | 12     |
| Crate Boundary Interactions | 3        | 2       | 0       | 5      |
| **Total**                   | **38**   | **8**   | **2**   | **48** |

**Finding severity distribution**: 1 High, 4 Medium, 4 Low

---

## 5. Crate Verdict

### CONDITIONAL PASS

cobre-solver has the most thoroughly specified API surface in the Cobre ecosystem. The `SolverInterface` trait (10 methods), `SolverError` enum (6 variants with hard-stop/proceed mapping), `StageTemplate` (13 typed fields), `CutBatch` (5 typed fields), `Basis` (with `BasisStatus` enum), `LpSolution`, and `SolverStatistics` are all production-ready with concrete Rust definitions and comprehensive behavioral contracts. The HiGHS backend mapping covers all trait methods with specific C API calls and a 5-step retry escalation sequence. The LP layout convention (column and row regions with exact index formulas and a worked example) is the most detailed specification in the corpus.

**Conditions for PASS**:

1. **F-007 (High)**: Update `solver-interface-testing.md` to use `patch_row_bounds` / `patch_col_bounds` names and add the missing `patch_col_bounds` tests. This is a naming consistency issue that would cause confusion during Phase 3 implementation.
2. **F-002 (Medium)**: Add concrete Rust type definitions for the workspace and workspace manager. The behavioral specification is thorough but an implementer currently has zero Rust type guidance for the workspace layer.
3. **F-004 (Medium)**: Resolve GAP-019 by either adding retry configuration parameters to `configuration-reference.md` or explicitly documenting them as internal constants.
4. **F-005 (Medium)**: Document the HiGHS dual sign convention (verified against the canonical convention) before Phase 3 begins. Add finite-difference sensitivity check to conformance tests.
5. **F-006 (Medium)**: Clarify the crate ownership boundary for `StageTemplate` and `StageIndexer`.
