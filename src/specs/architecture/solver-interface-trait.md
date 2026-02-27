# Solver Interface Trait

## Purpose

This spec defines the `SolverInterface` trait -- the backend abstraction through which optimization algorithms perform LP operations: loading models, adding constraint rows, updating row and column bounds, solving, warm-starting from a cached basis, and extracting solution data. The solver is resolved as a generic type parameter at compile time, following the same monomorphization pattern used by the Communicator trait ([Communicator Trait §3](../hpc/communicator-trait.md)). Because LP solvers wrap FFI calls to C libraries (HiGHS, CLP) on a per-thread exclusive-ownership basis, the trait requires `Send` but not `Sync`. The operations contract originates from [Solver Abstraction SS4](./solver-abstraction.md), which defines the behavioral requirements validated against both reference solver APIs.

> **Convention: Rust traits as specification guidelines.** The Rust trait definitions, method signatures, and struct declarations throughout this specification corpus serve as _guidelines for implementation_, not as absolute source-of-truth contracts that must be reproduced verbatim. Their purpose is twofold: (1) to express behavioral contracts, preconditions, postconditions, and type-level invariants more precisely than prose alone, and (2) to anchor conformance test suites that verify backend interchangeability (see [Backend Testing §1](../hpc/backend-testing.md)). Implementation may diverge in naming, parameter ordering, error representation, or internal organization when practical considerations demand it -- provided the behavioral contracts and conformance tests continue to pass. When a trait signature and a prose description conflict, the prose description (which captures the domain intent) takes precedence; the conflict should be resolved by updating the trait signature. This convention applies to all trait-bearing specification documents in `src/specs/`.

## 1. Trait Definition

The solver interface is modeled as a Rust trait with 10 methods. Each method corresponds to one operation from the solver interface contract ([Solver Abstraction SS4.1](./solver-abstraction.md)), plus a `name()` method for diagnostics.

```rust
/// Backend abstraction for LP solver operations in optimization algorithms.
///
/// Implementations wrap a single solver instance (HiGHS `void*` handle,
/// CLP `Clp_Simplex*` handle, etc.) and encapsulate all solver-specific
/// behavior: API calling conventions, retry logic, dual normalization,
/// and basis format translation.
///
/// The trait requires `Send` (transferable between threads) but NOT `Sync`.
/// Each solver instance is exclusively owned by one thread at a time --
/// LP solvers are not thread-safe. The thread-local workspace pattern
/// (see Solver Workspaces SS1.1) ensures exclusive ownership without
/// runtime synchronization.
pub trait SolverInterface: Send {
    /// Bulk-load a pre-assembled structural LP into the solver.
    ///
    /// The stage template contains the LP matrix in CSC form, column and
    /// row bounds, and objective coefficients. This operation replaces
    /// any previously loaded model. The LP layout follows the convention
    /// defined in [Solver Abstraction SS2](./solver-abstraction.md).
    ///
    /// Maps to `Highs_passLp` (HiGHS) or `Clp_loadProblem` (CLP).
    fn load_model(&mut self, template: &StageTemplate);

    /// Batch-add constraint rows to the LP (dynamic constraint region).
    ///
    /// The cut batch contains active cuts in CSR format, ready for a
    /// single `addRows` call. Cuts are appended at the bottom of the
    /// constraint matrix per [Solver Abstraction SS2.2](./solver-abstraction.md).
    ///
    /// Maps to `Highs_addRows` (HiGHS) or `Clp_addRows` (CLP).
    fn add_rows(&mut self, cuts: &RowBatch);

    /// Update row bounds (constraint RHS values).
    ///
    /// Each patch is a (row_index, new_lower, new_upper) triple. The
    /// patches update inflow RHS, state-fixing constraints, and
    /// noise-fixing values without modifying the structural LP. For
    /// equality constraints, set new_lower = new_upper = value.
    /// This is the primary modification performed between successive
    /// solves at the same stage (within-stage incremental updates per
    /// [Solver Abstraction SS11.4](./solver-abstraction.md)).
    ///
    /// Maps to `Highs_changeRowsBoundsBySet` (HiGHS) or mutable pointer
    /// access via `Clp_rowLower()`/`Clp_rowUpper()` (CLP).
    fn set_row_bounds(&mut self, patches: &[(usize, f64, f64)]);

    /// Update column bounds (variable lower/upper bounds).
    ///
    /// Each entry is a (col_index, new_lower, new_upper) triple. It
    /// updates variable bounds without modifying the structural
    /// LP. This method is not used in minimal viable SDDP but is
    /// included for completeness — future extensions (e.g., thermal
    /// unit commitment bounds, battery state-of-charge limits) may
    /// require per-scenario column bound updates.
    ///
    /// Maps to `Highs_changeColsBoundsBySet` (HiGHS) or mutable pointer
    /// access via `Clp_colLower()`/`Clp_colUpper()` (CLP).
    fn set_col_bounds(&mut self, patches: &[(usize, f64, f64)]);

    /// Solve the loaded LP.
    ///
    /// Applies the solver's internal retry logic (see SS6) and returns
    /// either a valid solution with normalized duals (see SS7) or a
    /// terminal error. The caller never sees intermediate retry attempts.
    ///
    /// Maps to `Highs_run` (HiGHS) or `Clp_dual`/`Clp_initialDualSolve`
    /// (CLP).
    fn solve(&mut self) -> Result<LpSolution, SolverError>;

    /// Set a basis for warm-starting, then solve.
    ///
    /// Loads the provided basis into the solver before invoking the
    /// solve sequence. The basis structure splits at the cut boundary:
    /// structural rows are reused directly, new cut rows are initialized
    /// as Basic per [Solver Abstraction SS2.3](./solver-abstraction.md).
    ///
    /// Maps to `Highs_setBasis` + `Highs_run` (HiGHS) or
    /// `Clp_copyinStatus` + `Clp_dual` (CLP).
    fn solve_with_basis(
        &mut self,
        basis: &Basis,
    ) -> Result<LpSolution, SolverError>;

    /// Clear all internal solver state.
    ///
    /// Resets the solver to a clean state: clears cached basis,
    /// factorization workspace, and any accumulated internal state.
    /// After reset, the solver is ready for a fresh `load_model` call.
    ///
    /// Maps to `Highs_clearSolver` (HiGHS) or model reconstruction
    /// (CLP).
    fn reset(&mut self);

    /// Extract the current simplex basis.
    ///
    /// Returns the basis from the most recent successful solve.
    /// The basis contains one status value per column and one per row,
    /// stored in the original problem space (not presolved) per
    /// [Solver Abstraction SS9](./solver-abstraction.md).
    ///
    /// Maps to `Highs_getBasis` (HiGHS) or `Clp_statusArray` (CLP).
    fn get_basis(&self) -> Basis;

    /// Return accumulated solve metrics.
    ///
    /// Provides total solve count, total simplex iterations, retry
    /// count, failure count, and cumulative wall-clock time. Counters
    /// accumulate across all solves performed by this instance since
    /// construction or the last reset.
    fn statistics(&self) -> SolverStatistics;

    /// Return the solver backend name.
    ///
    /// Used for logging, diagnostics, and checkpoint metadata.
    /// Returns a static string such as `"highs"` or `"clp"`.
    fn name(&self) -> &'static str;
}
```

**Thread safety model:** The `Send` bound allows solver instances to be transferred between threads (e.g., during thread pool initialization), but the absence of `Sync` prevents concurrent access. This matches the reality of C-library solver handles, which maintain mutable internal state (factorization workspace, working arrays) that is not safe to share. The thread-local workspace pattern in [Solver Workspaces SS1.1](./solver-workspaces.md) ensures each OpenMP thread owns exactly one solver instance for the entire training run.

**Mutability:** All methods that modify solver state (`load_model`, `add_rows`, `set_row_bounds`, `set_col_bounds`, `solve`, `solve_with_basis`, `reset`) take `&mut self`. Read-only accessors (`get_basis`, `statistics`, `name`) take `&self`.

## 2. Method Contracts

### 2.1 load_model

`load_model` bulk-loads a pre-assembled structural LP into the solver instance. This is the first step of the LP rebuild sequence at each stage transition ([Solver Abstraction SS11.2](./solver-abstraction.md), step 1). The stage template is built once at initialization and shared read-only across all threads within an MPI rank.

**Preconditions:**

| Condition                                           | Description                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `template` contains a valid CSC matrix              | Column starts, row indices, and values arrays are consistent; no out-of-bounds indices |
| `template` follows the LP layout convention         | Column and row ordering per [Solver Abstraction SS2](./solver-abstraction.md)          |
| `template.num_cols > 0` and `template.num_rows > 0` | Non-empty LP                                                                           |

**Postconditions:**

| Condition                                      | Description                                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Solver holds the structural LP from `template` | Previous model (if any) is fully replaced                                                           |
| No cuts are present                            | The loaded model contains only structural constraints; constraint rows are added separately via `add_rows` |
| Solver basis is cleared                        | Any cached basis from a previous model is invalidated                                               |

**Infallibility:** This method does not return `Result`. The stage template is validated during initialization ([Solver Abstraction SS11.1](./solver-abstraction.md)); passing an invalid template is a programming error (panic on violation).

### 2.2 add_rows

`add_rows` appends constraint rows to the dynamic constraint region in a single batch call. In SDDP, this is used to add Benders cuts. This is step 2 of the LP rebuild sequence ([Solver Abstraction SS11.2](./solver-abstraction.md)). The row batch is assembled from the cut pool's activity bitmap for the current stage.

**Preconditions:**

| Condition                                                      | Description                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `load_model` has been called                                   | A structural LP must be loaded before adding cuts                    |
| `cuts` contains valid CSR row data                             | Row starts, column indices, values, and bounds arrays are consistent |
| Cut column indices reference valid columns in the loaded model | Indices within `[0, num_cols)`                                       |

**Postconditions:**

| Condition                                                                          | Description                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active cuts are appended as rows at `[n_structural, n_structural + cuts.num_rows)` | Cut row positions follow [Solver Abstraction SS2.2](./solver-abstraction.md) bottom region |
| Structural rows `[0, n_structural)` are unchanged                                  | Adding cuts does not modify the structural LP                                              |
| Solver basis is not automatically set                                              | Caller must use `solve_with_basis` to apply a cached basis                                 |

**Infallibility:** This method does not return `Result`. The cut batch is assembled from the pre-validated cut pool ([Solver Abstraction SS5](./solver-abstraction.md)); invalid CSR data is a programming error (panic on violation).

### 2.3 set_row_bounds

`set_row_bounds` updates row bounds (constraint RHS values) without structural LP changes. This is step 3 of the LP rebuild sequence and the primary modification between successive solves at the same stage ([Solver Abstraction SS11.4](./solver-abstraction.md)). Each patch is a `(row_index, new_lower, new_upper)` triple. For equality constraints (water balance, lag fixing, noise fixing), set `new_lower = new_upper = value`.

**Preconditions:**

| Condition                                | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| `load_model` has been called             | A model must be loaded before patching                |
| All row indices in `patches` are valid   | Each index references a valid row in the loaded model |
| All bound values in `patches` are finite | No NaN or infinity                                    |
| `new_lower <= new_upper` for each patch  | Lower bound does not exceed upper bound               |

**Postconditions:**

| Condition                                                    | Description                                         |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Row lower and upper bounds at each patched index are updated | The LP reflects the current scenario realization    |
| Non-patched rows are unchanged                               | Only the specified row indices are modified         |
| Column bounds are unchanged                                  | Row patching does not affect column bounds          |
| Solver basis is preserved                                    | Patching does not invalidate a previously set basis |

**Infallibility:** This method does not return `Result`. Patch indices are computed from the LP layout convention ([Solver Abstraction SS2](./solver-abstraction.md)); out-of-bounds indices are a programming error (panic on violation).

**Solver API mapping:**

| Solver | API Call                                                             |
| ------ | -------------------------------------------------------------------- |
| HiGHS  | `Highs_changeRowsBoundsBySet(model, num_set, indices, lower, upper)` |
| CLP    | Mutable `double*` via `Clp_rowLower()` / `Clp_rowUpper()`            |

### 2.3a set_col_bounds

`set_col_bounds` updates column bounds (variable lower/upper bounds) without structural LP changes. Each entry is a `(col_index, new_lower, new_upper)` triple. This method is not used in minimal viable SDDP but is included for completeness -- future extensions (e.g., thermal unit commitment bounds, battery state-of-charge limits) may require per-scenario column bound updates.

**Preconditions:**

| Condition                                 | Description                                              |
| ----------------------------------------- | -------------------------------------------------------- |
| `load_model` has been called              | A model must be loaded before patching                   |
| All column indices in `patches` are valid | Each index references a valid column in the loaded model |
| All bound values in `patches` are finite  | No NaN or infinity                                       |
| `new_lower <= new_upper` for each patch   | Lower bound does not exceed upper bound                  |

**Postconditions:**

| Condition                                                       | Description                                         |
| --------------------------------------------------------------- | --------------------------------------------------- |
| Column lower and upper bounds at each patched index are updated | The LP reflects the current scenario realization    |
| Non-patched columns are unchanged                               | Only the specified column indices are modified      |
| Row bounds are unchanged                                        | Column patching does not affect row bounds          |
| Solver basis is preserved                                       | Patching does not invalidate a previously set basis |

**Infallibility:** This method does not return `Result`. Patch indices are computed from the LP layout convention ([Solver Abstraction SS2](./solver-abstraction.md)); out-of-bounds indices are a programming error (panic on violation).

**Solver API mapping:**

| Solver | API Call                                                             |
| ------ | -------------------------------------------------------------------- |
| HiGHS  | `Highs_changeColsBoundsBySet(model, num_set, indices, lower, upper)` |
| CLP    | Mutable `double*` via `Clp_colLower()` / `Clp_colUpper()`            |

### 2.4 solve

`solve` invokes the LP solver with its internal retry logic and returns either a valid solution or a terminal error. This is the primary hot-path method -- called millions of times during a training run.

**Preconditions:**

| Condition                                             | Description              |
| ----------------------------------------------------- | ------------------------ |
| `load_model` has been called                          | A model must be loaded   |
| Cuts and scenario patches have been applied as needed | The LP is ready to solve |

**Postconditions (on `Ok`):**

| Condition                                             | Description                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `LpSolution.objective` is the optimal objective value | Minimization sense                                                             |
| `LpSolution.primal` contains optimal primal values    | Length equals `num_cols`                                                       |
| `LpSolution.dual` contains normalized dual values     | Sign convention per [Solver Abstraction SS8](./solver-abstraction.md); see SS7 |
| `LpSolution.dual.len() == num_rows`                   | One dual per constraint (structural + cuts)                                    |
| Solver basis reflects the optimal solution            | Available via `get_basis()` after a successful solve                           |
| `SolverStatistics` counters are incremented           | Solve count, iteration count, and timing updated                               |

**Postconditions (on `Err`):**

| Condition                                              | Description                                                |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `SolverError` variant identifies the terminal failure  | After all retry attempts are exhausted (see SS6)           |
| Solver state is unspecified                            | The caller should call `reset()` before reusing the solver |
| `SolverStatistics.retry_count` reflects retry attempts | Retry attempts are tracked even on failure                 |

**Fallibility:** This method returns `Result<LpSolution, SolverError>`. LP solves wrap FFI calls to C libraries that may encounter numerical difficulties, infeasibility, or other solver-internal failures that cannot be prevented by precondition checks.

### 2.5 solve_with_basis

`solve_with_basis` sets a cached basis for warm-starting before solving. This combines the `set basis` and `solve` operations into a single method to ensure the basis is applied atomically with the solve. Warm-starting from a cached basis typically reduces simplex iterations by 80-95% compared to cold starts.

**Preconditions:**

| Condition                                                                         | Description                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------- |
| `load_model` has been called                                                      | A model must be loaded                        |
| `basis.col_status.len()` matches the loaded model's column count                  | Basis dimension matches current LP            |
| `basis.row_status.len()` matches the loaded model's row count (structural + cuts) | Basis covers all rows including appended cuts |

**Postconditions (on `Ok`):**

| Condition                                               | Description                                            |
| ------------------------------------------------------- | ------------------------------------------------------ |
| Same as `solve()` `Ok` postconditions                   | Valid solution with normalized duals                   |
| Simplex iterations are typically reduced vs. cold start | Warm-start benefit is observable in `SolverStatistics` |

**Postconditions (on `Err`):**

| Condition                                               | Description                                      |
| ------------------------------------------------------- | ------------------------------------------------ |
| Same as `solve()` `Err` postconditions                  | Terminal error after retry exhaustion            |
| Implementation may fall back to cold start during retry | Basis rejection is a valid retry escalation step |

**Fallibility:** Same as `solve()` -- returns `Result<LpSolution, SolverError>`.

**Basis dimension mismatch handling:** If the provided basis dimensions do not match the current LP (e.g., because cuts were added since the basis was saved), the solver implementation must handle this gracefully. Per [Solver Abstraction SS2.3](./solver-abstraction.md), the structural portion of the basis is position-stable; only the cut portion needs extension (new cut rows initialized as Basic) or truncation.

### 2.6 reset

`reset` clears all internal solver state, returning the instance to a clean state equivalent to a freshly constructed solver. This is used for error recovery (after a terminal `SolverError`) or when switching between fundamentally different LP structures.

**Preconditions:** None. `reset` can be called at any time.

**Postconditions:**

| Condition                                     | Description                                               |
| --------------------------------------------- | --------------------------------------------------------- |
| Solver state is clean                         | No loaded model, no cached basis, no factorization        |
| `load_model` must be called before next solve | The solver cannot solve without a loaded model            |
| Statistics are preserved                      | `reset` does not zero the accumulated statistics counters |

**Infallibility:** This method does not return `Result`. Clearing solver state is a local operation with no failure modes.

### 2.7 get_basis

`get_basis` extracts the current simplex basis from the solver. The basis is stored in the original problem space (not presolved) to ensure portability across solver versions and presolve strategies ([Solver Abstraction SS9](./solver-abstraction.md)).

**Preconditions:**

| Condition                                                | Description                                  |
| -------------------------------------------------------- | -------------------------------------------- |
| A successful `solve` or `solve_with_basis` has completed | A basis exists only after a successful solve |

**Postconditions:**

| Condition                              | Description                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Basis.col_status.len() == num_cols`   | One status per variable                                                                                 |
| `Basis.row_status.len() == num_rows`   | One status per constraint (structural + cuts)                                                           |
| Status values are in the canonical set | `AtLower`, `Basic`, `AtUpper`, `Free`, or `Fixed` per [Solver Abstraction SS9](./solver-abstraction.md) |

**Infallibility:** This method does not return `Result`. After a successful solve, the basis always exists and can be extracted. Calling `get_basis` without a prior successful solve is a programming error (panic on violation).

### 2.8 statistics

`statistics` returns accumulated solve metrics for this solver instance. The counters grow monotonically across all solves performed since construction (or since the last construction -- `reset` does not clear statistics).

**Preconditions:** None. Can be called at any time, including before any solves.

**Postconditions:**

| Condition                                      | Description                                            |
| ---------------------------------------------- | ------------------------------------------------------ |
| All fields are non-negative                    | Counters start at zero and only increment              |
| `solve_count >= success_count + failure_count` | Total solves decompose into successes and failures     |
| `retry_count` counts individual retry attempts | One retry attempt per escalation step per failed solve |

**Infallibility:** This method does not return `Result`. It reads internal counters with no failure modes.

### 2.9 name

`name` returns a static string identifying the solver backend. Used for logging, diagnostics, and checkpoint metadata.

**Preconditions:** None.

**Postconditions:**

| Condition                                | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| Returns a non-empty `&'static str`       | Lifetime is `'static` -- no allocation needed |
| Value is constant for the implementation | `"highs"`, `"clp"`, etc.                      |

**Infallibility:** This method does not return `Result`. It returns a compile-time constant.

## 3. Error Type

The `SolverError` enum categorizes terminal LP solve failures. These are the errors that reach the SDDP algorithm after all solver-internal retry logic has been exhausted. The six variants correspond to the error categories defined in [Solver Abstraction SS6](./solver-abstraction.md).

```rust
/// Terminal LP solve error returned after all retry attempts are exhausted.
///
/// The SDDP algorithm uses the variant to determine its response:
/// hard stop (Infeasible, Unbounded, InternalError) or proceed with
/// degraded quality (NumericalDifficulty, TimeLimitExceeded, IterationLimit)
/// when a partial solution is available.
#[derive(Debug)]
pub enum SolverError {
    /// The LP has no feasible solution.
    ///
    /// Indicates a data error (inconsistent bounds or constraints) or
    /// a modeling error. The SDDP algorithm performs a hard stop.
    Infeasible {
        /// Infeasibility ray (proof of infeasibility), if available.
        ray: Option<Vec<f64>>,
    },

    /// The LP objective is unbounded below.
    ///
    /// Indicates a modeling error (missing bounds, incorrect objective
    /// sign). The SDDP algorithm performs a hard stop.
    Unbounded {
        /// Unbounded direction, if available.
        direction: Option<Vec<f64>>,
    },

    /// Solver encountered numerical difficulties that persisted through
    /// all retry attempts.
    ///
    /// May have a partial (non-optimal) solution. The SDDP algorithm
    /// logs a warning and may proceed if the partial solution is usable.
    NumericalDifficulty {
        /// Best solution found before the difficulty, if any.
        partial_solution: Option<LpSolution>,
        /// Description of the numerical issue.
        message: String,
    },

    /// Per-solve wall-clock time budget exhausted.
    ///
    /// May have a partial solution from the best iteration reached.
    TimeLimitExceeded {
        /// Best solution found within the time budget, if any.
        partial_solution: Option<LpSolution>,
        /// Elapsed wall-clock time in seconds.
        elapsed_seconds: f64,
    },

    /// Solver simplex iteration limit reached.
    ///
    /// May have a partial solution from the last completed iteration.
    IterationLimit {
        /// Best solution found within the iteration budget, if any.
        partial_solution: Option<LpSolution>,
        /// Number of iterations performed.
        iterations: u64,
    },

    /// Unrecoverable solver-internal failure.
    ///
    /// Covers FFI panics, memory allocation failures within the solver,
    /// corrupted internal state, or any error not classifiable into the
    /// above categories. The SDDP algorithm logs and performs a hard stop.
    InternalError {
        /// Human-readable error description.
        message: String,
        /// Solver-specific error code, if available.
        error_code: Option<i32>,
    },
}
```

**Error-to-response mapping:**

| Variant               | Hard Stop | May Proceed with Partial Solution |
| --------------------- | :-------: | :-------------------------------: |
| `Infeasible`          |    Yes    |                No                 |
| `Unbounded`           |    Yes    |                No                 |
| `NumericalDifficulty` |    No     |                Yes                |
| `TimeLimitExceeded`   |    No     |                Yes                |
| `IterationLimit`      |    No     |                Yes                |
| `InternalError`       |    Yes    |                No                 |

## 4. Supporting Types

### 4.1 LpSolution

```rust
/// Complete solution from a successful LP solve.
///
/// All values are in the original (unscaled) problem space. Dual values
/// are normalized to the canonical sign convention per
/// [Solver Abstraction SS8](./solver-abstraction.md) -- see SS7.
pub struct LpSolution {
    /// Optimal objective value (minimization sense).
    pub objective: f64,

    /// Primal variable values, indexed by column.
    /// Length equals `num_cols`. State variables occupy the contiguous
    /// prefix `[0, n_state)` per [Solver Abstraction SS2.1](./solver-abstraction.md).
    pub primal: Vec<f64>,

    /// Dual multipliers (shadow prices), indexed by row.
    /// Length equals `num_rows` (structural + cuts). Cut-relevant
    /// constraint duals occupy the contiguous prefix `[0, n_cut_relevant)`
    /// per [Solver Abstraction SS2.2](./solver-abstraction.md).
    ///
    /// Sign convention: normalized per SS7 before returning.
    pub dual: Vec<f64>,

    /// Reduced costs, indexed by column.
    /// Length equals `num_cols`.
    pub reduced_costs: Vec<f64>,

    /// Number of simplex iterations performed for this solve.
    pub iterations: u64,

    /// Wall-clock solve time in seconds (excluding retry overhead).
    pub solve_time_seconds: f64,
}
```

### 4.2 Basis

```rust
/// Simplex basis: one status per column and one per row.
///
/// Stored in the original problem space (not presolved) to ensure
/// portability across solver versions and presolve strategies
/// ([Solver Abstraction SS9](./solver-abstraction.md)).
pub struct Basis {
    /// Basis status for each column (variable).
    pub col_status: Vec<BasisStatus>,

    /// Basis status for each row (constraint).
    /// Includes both structural rows and cut rows.
    pub row_status: Vec<BasisStatus>,
}

/// Basis status for a single variable or constraint.
///
/// Maps to solver-specific status codes:
/// HiGHS uses `HighsInt` (4 bytes), CLP uses `unsigned char` (1 byte).
/// The implementation translates between this canonical representation
/// and the solver-specific encoding.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BasisStatus {
    /// Variable is at its lower bound.
    AtLower,
    /// Variable is in the basis (between bounds).
    Basic,
    /// Variable is at its upper bound.
    AtUpper,
    /// Variable is free (superbasic).
    Free,
    /// Variable is fixed (lower == upper).
    Fixed,
}
```

### 4.3 SolverStatistics

```rust
/// Accumulated solve metrics for a single solver instance.
///
/// Counters grow monotonically from construction. Thread-local --
/// aggregated across threads via reduction after training completes.
pub struct SolverStatistics {
    /// Total number of `solve` and `solve_with_basis` calls.
    pub solve_count: u64,

    /// Number of solves that returned `Ok`.
    pub success_count: u64,

    /// Number of solves that returned `Err`.
    pub failure_count: u64,

    /// Total simplex iterations across all solves.
    pub total_iterations: u64,

    /// Total retry attempts across all solves.
    pub retry_count: u64,

    /// Cumulative wall-clock time spent in solver calls (seconds).
    pub total_solve_time_seconds: f64,
}
```

### 4.4 StageTemplate

The `StageTemplate` holds the pre-assembled structural LP for one stage in solver-ready CSC form. It is built once at initialization and shared read-only across all threads. The full specification of its contents, lifecycle, and memory layout is in [Solver Abstraction SS11.1](./solver-abstraction.md). This spec defines only the type signature for use in the `SolverInterface` trait.

**Construction ownership**: The `cobre-sddp` crate owns `StageTemplate` construction. A builder function in `cobre-sddp` takes a reference to the resolved `System` struct ([Internal Structures SS1](../data-model/internal-structures.md)) and the `StageDefinition` for the target stage, and produces a `StageTemplate`. The solver crate (`cobre-solver`) receives `StageTemplate` as an opaque data holder and does not interpret its contents -- it bulk-loads the CSC arrays into the underlying LP solver without understanding what the columns or rows represent. This separation ensures that LP modeling concerns (variable ordering, constraint structure, state dimension) remain in `cobre-sddp`, while solver concerns (API calls, retry logic, basis management) remain in `cobre-solver`.

```rust
// Construction function signature (in cobre-sddp, not cobre-solver):
//
// pub fn build_stage_template(
//     system: &System,
//     stage_def: &StageDefinition,
//     stage_index: usize,
// ) -> StageTemplate;
```

```rust
/// Pre-assembled structural LP for one stage, in CSC (column-major) form.
///
/// Built once at initialization from resolved internal structures
/// ([Internal Structures](../data-model/internal-structures.md)).
/// Shared read-only across all threads within an MPI rank.
/// Column and row ordering follows [Solver Abstraction SS2](./solver-abstraction.md).
pub struct StageTemplate {
    /// Number of columns (variables).
    pub num_cols: usize,
    /// Number of structural rows (constraints, excluding cuts).
    pub num_rows: usize,
    /// Number of non-zero entries in the structural matrix.
    pub num_nz: usize,

    /// CSC column start offsets. Length: `num_cols + 1`.
    pub col_starts: Vec<usize>,
    /// CSC row indices. Length: `num_nz`.
    pub row_indices: Vec<usize>,
    /// CSC non-zero values. Length: `num_nz`.
    pub values: Vec<f64>,

    /// Column lower bounds. Length: `num_cols`.
    pub col_lower: Vec<f64>,
    /// Column upper bounds. Length: `num_cols`.
    pub col_upper: Vec<f64>,
    /// Objective coefficients. Length: `num_cols`.
    pub objective: Vec<f64>,

    /// Row lower bounds. Length: `num_rows`.
    pub row_lower: Vec<f64>,
    /// Row upper bounds. Length: `num_rows`.
    pub row_upper: Vec<f64>,

    /// Number of state variables (contiguous prefix of columns).
    /// Equal to N * (1 + L) per [Solver Abstraction SS2.1](./solver-abstraction.md).
    pub n_state: usize,
    /// Number of state values to transfer between stages.
    /// Equal to N * L per [Solver Abstraction SS2.1](./solver-abstraction.md)
    /// (storage + all lags except the oldest).
    pub n_transfer: usize,
    /// Number of cut-relevant constraint rows (contiguous prefix of rows).
    /// Equal to N + N*L + n_fpha + n_gvc per [Solver Abstraction SS2.2](./solver-abstraction.md).
    pub n_cut_relevant: usize,
    /// Number of operating hydros at this stage.
    pub n_hydro: usize,
    /// Maximum PAR order across all operating hydros at this stage.
    pub max_par_order: usize,
}
```

### 4.5 RowBatch

The `RowBatch` holds constraint rows for batch addition in CSR (row-major) form, ready for a single `add_rows` call. In SDDP, it is assembled from the cut pool's activity bitmap before each LP rebuild.

```rust
/// Batch of constraint rows for addition, in CSR (row-major) form.
///
/// In SDDP, assembled from the cut pool activity bitmap for the current stage.
/// Passed to `add_rows` for a single batch row-addition call.
/// See [Solver Abstraction SS5.4](./solver-abstraction.md) for the
/// assembly protocol.
pub struct RowBatch {
    /// Number of active cuts in this batch.
    pub num_rows: usize,

    /// CSR row start offsets. Length: `num_rows + 1`.
    pub row_starts: Vec<usize>,
    /// CSR column indices. Length: total non-zeros across all cuts.
    pub col_indices: Vec<usize>,
    /// CSR non-zero values. Length: total non-zeros across all cuts.
    pub values: Vec<f64>,

    /// Row lower bounds (cut intercepts alpha). Length: `num_rows`.
    pub row_lower: Vec<f64>,
    /// Row upper bounds (all +infinity). Length: `num_rows`.
    pub row_upper: Vec<f64>,
}
```

## 5. Dispatch Mechanism

The `SolverInterface` trait uses **compile-time monomorphization** -- the training loop is generic over the solver type, and the concrete implementation is resolved at compile time. This is the same pattern used by the `Communicator` trait ([Communicator Trait §3](../hpc/communicator-trait.md)) and documented as the solver selection strategy in [Solver Abstraction SS10](./solver-abstraction.md).

```rust
/// Train the SDDP policy using the provided solver and communicator backends.
///
/// Both generic parameters are resolved at compile time -- no trait object
/// indirection, no vtable lookup, no dynamic dispatch on the hot path.
pub fn train<S: SolverInterface, C: Communicator>(
    solver_factory: impl Fn() -> S,
    comm: &C,
    config: &TrainingConfig,
    stages: &[StageTemplate],
    // ... other parameters
) -> TrainingResult {
    // Each OpenMP thread creates its own solver instance via solver_factory
    // Thread-local workspace holds the solver for the entire training run
    todo!()
}
```

**Why compile-time monomorphization (not enum dispatch):** The solver interface is fundamentally different from the five algorithm-variant abstractions (risk measure, cut formulation, horizon mode, sampling scheme, cut selection strategy) that use enum dispatch:

| Aspect                      | SolverInterface                    | Algorithm-Variant Traits                              |
| --------------------------- | ---------------------------------- | ----------------------------------------------------- |
| **Variation scope**         | Global -- one solver per build     | May vary per stage (risk measure) or per run (others) |
| **Variant count**           | One per binary (feature-gated)     | 2-3 variants coexist in the same binary               |
| **Call frequency**          | Millions of times (every LP solve) | Hundreds to thousands per iteration                   |
| **FFI boundary**            | Wraps C library calls              | Pure Rust computation                                 |
| **Performance sensitivity** | Extremely high -- on the hot path  | Low to moderate -- dominated by LP solve cost         |
| **Dispatch pattern**        | Compile-time monomorphization      | Enum match at call site                               |

The key distinction is that exactly one solver backend is active per build (selected via Cargo feature flags per [Solver Abstraction SS10](./solver-abstraction.md)). The binary never needs to dispatch between HiGHS and CLP at runtime. Monomorphization eliminates virtual dispatch overhead entirely, enables the compiler to inline solver-specific code paths, and is consistent with the established `Communicator` trait pattern.

**Contrast with enum dispatch:** The algorithm-variant traits (e.g., `RiskMeasure`, `HorizonMode`) use enum dispatch because they have a small, fixed variant set where multiple variants may coexist in the same binary (e.g., per-stage risk measure variation). The solver interface has neither characteristic: there is exactly one active solver per binary, and the call frequency is orders of magnitude higher.

## 6. Retry Logic Encapsulation

Retry logic for numerical difficulties is **encapsulated within each `SolverInterface` implementation**. The `solve()` and `solve_with_basis()` methods handle retries internally and return only the final result (success or terminal error) to the caller. The calling algorithm never sees intermediate retry attempts. The `retry_max_attempts` and `retry_time_budget_seconds` parameters are sourced from `config.json` (see [Configuration Reference section 3.5](../configuration/configuration-reference.md)).

The retry behavioral contract is defined in [Solver Abstraction SS7](./solver-abstraction.md):

- **Maximum attempts**: Configurable upper bound (default: 5)
- **Time budget**: Configurable wall-clock budget for all attempts combined
- **Escalating strategies**: Least-disruptive (clear basis) to most-disruptive (switch algorithm)
- **Final disposition**: Terminal `SolverError` with best partial solution if available
- **Logging**: Each retry attempt logged at debug level

For solver-specific retry escalation sequences, see [HiGHS Implementation](./solver-highs-impl.md) and [CLP Implementation](./solver-clp-impl.md). The implementation specs define which HiGHS/CLP API calls correspond to each escalation step (clear basis, disable presolve, switch to interior point, relax tolerances).

## 7. Dual Normalization Contract

All dual multipliers in `LpSolution.dual` are **pre-normalized** to the canonical sign convention defined in [Solver Abstraction SS8](./solver-abstraction.md) before the solution is returned to the caller. Solver-specific sign differences are resolved within the `SolverInterface` implementation.

**Canonical convention:** A positive dual on a $\leq$ constraint means that increasing the RHS increases the objective ($\partial z^* / \partial b > 0$).

**Why this matters:** The cut coefficient computation in the backward pass extracts dual multipliers from the cut-relevant constraint rows (`[0, n_cut_relevant)`) and uses them directly as cut gradients:

$$\beta_t^k = W_t^\top \pi_t^*$$

A sign error in $\pi_t^*$ produces cuts that point in the wrong direction, leading to divergence of the outer approximation. By normalizing duals inside the solver implementation, the cut generation logic is solver-agnostic and provably correct regardless of which backend is active.

**Implementation responsibility:** Each solver backend must know its native dual sign convention and apply the appropriate transformation. For example, if a solver reports duals with the opposite sign for $\geq$ constraints, the implementation negates those duals before populating `LpSolution.dual`. This transformation is applied once per solve, adding negligible overhead to the solution extraction step.

## Cross-References

- [Solver Abstraction](./solver-abstraction.md) -- Operations contract (SS4), LP layout convention (SS2), cut pool design (SS5), error categories (SS6), retry logic contract (SS7), dual normalization (SS8), basis storage (SS9), compile-time selection (SS10), stage templates and rebuild strategy (SS11)
- [Solver Workspaces](./solver-workspaces.md) -- Thread-local solver infrastructure (SS1), per-stage basis cache (SS1.5), pre-allocated solution buffers (SS1.2), solve statistics (SS1.6)
- [HiGHS Implementation](./solver-highs-impl.md) -- HiGHS-specific API mapping (SS2), retry strategy, batch operations, memory footprint
- [CLP Implementation](./solver-clp-impl.md) -- CLP-specific API mapping (SS2), C++ wrapper strategy, mutable pointer optimization, cloning path
- [Communicator Trait](../hpc/communicator-trait.md) -- Compile-time monomorphization pattern (SS3) that the solver interface follows; convention blockquote source
- [Backend Testing](../hpc/backend-testing.md) -- Conformance test methodology applicable to solver backend testing
- [Extension Points](./extension-points.md) -- Dispatch mechanism analysis (SS7) contrasting compile-time monomorphization (solver) with enum dispatch (algorithm variants); variant selection pipeline (SS6)
- [Training Loop](./training-loop.md) -- Forward pass (SS4) and backward pass (SS6) that drive solver invocations; abstraction points (SS3) parameterizing the training loop
- [Cut Management Implementation](./cut-management-impl.md) -- Cut pool activity bitmap (SS1.1), CSR assembly for `addRows` (SS1), cut coefficient computation using duals from `LpSolution`
- [LP Formulation](../math/lp-formulation.md) -- Constraint structure that defines which duals are cut-relevant and feed into the cut coefficient formula
- [Binary Formats](../data-model/binary-formats.md) -- Cut pool memory layout (SS3.4) that produces `RowBatch` inputs; LP rebuild strategy analysis (SS3, Appendix A)
- [Internal Structures](../data-model/internal-structures.md) -- Logical in-memory data model from which `StageTemplate` is built
- [Hybrid Parallelism](../hpc/hybrid-parallelism.md) -- OpenMP threading model (SS3) requiring thread-local solvers with `Send` but not `Sync`
- [Memory Architecture](../hpc/memory-architecture.md) -- NUMA-aware allocation (SS2) for solver workspaces
