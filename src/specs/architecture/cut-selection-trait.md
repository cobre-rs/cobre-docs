# Cut Selection Strategy Trait

## Purpose

This spec defines the `CutSelectionStrategy` abstraction -- the enum-based trait through which the SDDP training loop decides which cuts to deactivate from the per-stage cut pools during training. Cut selection controls the growth of the piecewise-linear outer approximation $\underline{V}_t$ by periodically deactivating cuts that are no longer contributing to the approximation quality at visited states, thereby bounding LP solve time and memory consumption. The three supported strategies -- Level-1, Limited Memory Level-1 (LML1), and Dominated -- correspond to the three selection methods defined in [Cut Management SS7](../math/cut-management.md) and implemented in [Cut Management Implementation SS2](./cut-management-impl.md). Because the cut selection strategy is a global property of the training run (one strategy for all stages), the abstraction uses enum dispatch, consistent with the pattern established in [HorizonMode SS4](./horizon-mode-trait.md) and [SamplingScheme SS4](./sampling-scheme-trait.md).

> **Convention: Rust traits as specification guidelines.** The Rust trait definitions, method signatures, and struct declarations throughout this specification corpus serve as _guidelines for implementation_, not as absolute source-of-truth contracts that must be reproduced verbatim. Their purpose is twofold: (1) to express behavioral contracts, preconditions, postconditions, and type-level invariants more precisely than prose alone, and (2) to anchor conformance test suites that verify backend interchangeability (see [Backend Testing §1](../hpc/backend-testing.md)). Implementation may diverge in naming, parameter ordering, error representation, or internal organization when practical considerations demand it -- provided the behavioral contracts and conformance tests continue to pass. When a trait signature and a prose description conflict, the prose description (which captures the domain intent) takes precedence; the conflict should be resolved by updating the trait signature. This convention applies to all trait-bearing specification documents in `src/specs/`.

## 1. Trait Definition

The cut selection strategy is modeled as a flat enum with three variants, matching the three strategies supported by Cobre ([Cut Management SS7](../math/cut-management.md)):

```rust
/// Cut selection strategy for controlling cut pool growth during SDDP training.
///
/// A single `CutSelectionStrategy` value is resolved from the `cut_selection`
/// field in `config.json` during configuration loading (see Extension Points SS6).
/// The strategy is global to the training run -- all stages use the same
/// selection method. Selection runs periodically (every `check_frequency`
/// iterations) and only deactivates cuts -- it never deletes them, preserving
/// slot indices for reproducibility.
#[derive(Debug, Clone)]
pub enum CutSelectionStrategy {
    /// Level-1 selection: retain any cut that was ever binding.
    ///
    /// A cut is deactivated only if its cumulative active count is zero --
    /// i.e., it has never been binding at any visited state during the entire
    /// algorithm execution. This is the least aggressive strategy.
    ///
    /// See [Cut Management SS7.1](../math/cut-management.md).
    Level1 {
        /// Activity threshold epsilon for near-binding tolerance.
        /// A cut is considered binding if theta* - (alpha_k + pi_k^T x) < threshold.
        threshold: f64,

        /// Number of iterations between selection runs.
        check_frequency: u32,
    },

    /// Limited Memory Level-1 (LML1): retain cuts active within a recent window.
    ///
    /// Each cut is timestamped with the most recent iteration at which it was
    /// binding. Cuts whose timestamp is older than `memory_window` iterations
    /// are deactivated. More aggressive than Level-1 because cuts that were
    /// active early but are now permanently dominated will eventually be removed.
    ///
    /// See [Cut Management SS7.2](../math/cut-management.md).
    LML1 {
        /// Activity threshold epsilon for near-binding tolerance.
        threshold: f64,

        /// Number of iterations between selection runs.
        check_frequency: u32,

        /// Number of iterations to retain inactive cuts before deactivation.
        /// A cut whose `last_active_iter` is older than
        /// `current_iteration - memory_window` is deactivated.
        memory_window: u32,
    },

    /// Dominated cut detection: remove cuts dominated at all visited states.
    ///
    /// A cut k is dominated if at every visited state x_hat, some other active
    /// cut achieves a higher (or equal within threshold) value. This is the
    /// most aggressive strategy and the most computationally expensive:
    /// O(|active cuts| x |visited states|) per stage per check.
    ///
    /// See [Cut Management SS7.3](../math/cut-management.md).
    Dominated {
        /// Activity threshold epsilon for near-binding tolerance.
        threshold: f64,

        /// Number of iterations between selection runs.
        check_frequency: u32,
    },
}
```

## 2. Method Contracts

### 2.1 should_run

`should_run` determines whether cut selection should execute at the current iteration. Selection runs periodically based on `check_frequency` to amortize the cost of scanning the cut pool. The method is called once per iteration, after the backward pass completes and before the next forward pass begins.

```rust
impl CutSelectionStrategy {
    /// Determine whether cut selection should run at this iteration.
    ///
    /// Returns `true` if the current iteration is a multiple of the
    /// variant's `check_frequency`, indicating that the cut pool should
    /// be scanned for deactivation candidates.
    pub fn should_run(&self, iteration: u32) -> bool {
        let freq = match self {
            Self::Level1 { check_frequency, .. } => *check_frequency,
            Self::LML1 { check_frequency, .. } => *check_frequency,
            Self::Dominated { check_frequency, .. } => *check_frequency,
        };
        iteration > 0 && iteration % freq == 0
    }
}
```

**Preconditions:**

| Condition        | Description                     |
| ---------------- | ------------------------------- |
| `iteration >= 0` | Valid iteration index (0-based) |

**Postconditions:**

| Condition                                                              | Description                                |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| Returns `false` when `iteration == 0`                                  | Never run selection before any cuts exist  |
| Returns `true` iff `iteration > 0 && iteration % check_frequency == 0` | Periodic triggering at configured interval |

**Infallibility:** This method does not return `Result`. The `check_frequency` value is validated at configuration load time to be positive (see SS5).

### 2.2 select

`select` is the primary method that scans the cut pool for a single stage and returns the set of cut indices to deactivate. The method is called once per stage at each selection check, iterating over all stages in the backward pass order. The returned deactivation set is applied to the activity bitmap by the caller (the training loop or FCF manager).

```rust
impl CutSelectionStrategy {
    /// Scan the cut pool for a single stage and identify cuts to deactivate.
    ///
    /// Returns the indices of cuts that should be deactivated according to
    /// the configured selection strategy. The caller is responsible for
    /// applying the deactivation to the activity bitmap.
    ///
    /// The method does NOT modify the cut pool -- it is a pure query that
    /// returns a deactivation set. This separation allows the training loop
    /// to log deactivation counts before applying them.
    pub fn select(
        &self,
        cut_pool: &StageCutPool,
        iteration: u32,
    ) -> DeactivationSet {
        // Dispatch on variant:
        // - Level1: deactivate cuts with active_count == 0
        // - LML1: deactivate cuts with last_active_iter < iteration - memory_window
        // - Dominated: deactivate cuts dominated at all visited states
        todo!()
    }
}
```

**Preconditions (all variants):**

| Condition                               | Description                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `cut_pool.populated_count() > 0`        | At least one cut exists in the pool                                                       |
| `should_run(iteration)` returned `true` | Selection is only invoked when the periodic check fires                                   |
| Activity tracking data is up-to-date    | `update_activity` has been called for all binding cuts from the most recent backward pass |

**Postconditions (all variants):**

| Condition                                                     | Description                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Returned indices are a subset of currently active cut indices | Never deactivates already-inactive cuts                              |
| Returned indices do not include cuts added in this iteration  | Newly generated cuts are never candidates for immediate deactivation |
| Returned set may be empty                                     | If no cuts meet the deactivation criteria, an empty set is returned  |

**Variant-specific behavioral contracts:**

**Level1:**

| Postcondition                              | Description                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Deactivates cuts where `active_count == 0` | A cut that has never been binding at any visited state is deactivated  |
| Retains all cuts with `active_count > 0`   | Any cut that was ever binding is preserved, regardless of how long ago |

**LML1:**

| Postcondition                                                         | Description                                                     |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Deactivates cuts where `last_active_iter < iteration - memory_window` | Cuts not active within the recent memory window are deactivated |
| Retains cuts where `last_active_iter >= iteration - memory_window`    | Recently active cuts are preserved                              |
| When `memory_window` is very large, behavior approaches Level1        | A sufficiently large window retains all ever-active cuts        |

**Dominated:**

| Postcondition                                                                                                          | Description                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Deactivates cut $k$ only if dominated at **all** visited states                                                        | $\forall \hat{x} \in \text{visited states}: \max_{j \neq k} \{ \alpha_j + \pi_j^\top \hat{x} \} - (\alpha_k + \pi_k^\top \hat{x}) > \epsilon$ |
| A cut dominating at only some visited states is retained                                                               | Partial domination is not sufficient for deactivation                                                                                         |
| The domination check uses only currently active cuts                                                                   | Inactive cuts do not participate in the domination comparison                                                                                 |
| Computational cost is $\mathcal{O}(\lvert\text{active cuts}\rvert \times \lvert\text{visited states}\rvert)$ per stage | The most expensive strategy; cost is amortized by `check_frequency`                                                                           |

**Infallibility:** This method does not return `Result`. The cut pool is guaranteed to be in a valid state because it is initialized at startup and modified only through the deterministic slot assignment protocol ([Cut Management Implementation SS1.2](./cut-management-impl.md)). Visited states are guaranteed to exist because `should_run` returns `false` at iteration 0 (before any forward pass has produced trial points).

### 2.3 update_activity

`update_activity` records that a specific cut was binding at the current LP solution. This method is called during the backward pass, after each LP solve, for every cut whose dual multiplier is positive (indicating the cut is binding). The method updates the per-cut tracking metadata that `select` later reads to make deactivation decisions.

```rust
impl CutSelectionStrategy {
    /// Update tracking metadata for a cut that was binding at an LP solution.
    ///
    /// Called after each LP solve in the backward pass for every cut whose
    /// dual multiplier exceeds the solver tolerance. The update depends on
    /// the active strategy variant.
    pub fn update_activity(
        &self,
        metadata: &mut CutMetadata,
        iteration: u32,
    ) {
        match self {
            Self::Level1 { .. } => {
                metadata.active_count += 1;
            }
            Self::LML1 { .. } => {
                metadata.last_active_iter = iteration;
            }
            Self::Dominated { .. } => {
                metadata.domination_count = 0;
            }
        }
    }
}
```

**Preconditions:**

| Condition                                              | Description                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| The cut at `metadata` was binding in the current solve | The dual multiplier of the cut constraint is positive (above solver tolerance) |
| `iteration` is the current training iteration          | Timestamp correctness for LML1                                                 |

**Postconditions:**

| Variant   | Update                                         | Description                                                                             |
| --------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Level1    | `metadata.active_count` incremented by 1       | Monotonically increasing counter; once positive, the cut is never deactivated by Level1 |
| LML1      | `metadata.last_active_iter` set to `iteration` | Timestamp refreshed; the cut's retention window restarts                                |
| Dominated | `metadata.domination_count` reset to 0         | The cut is not dominated at this state; reset counter                                   |

**Thread safety:** `update_activity` is called on per-thread solver workspaces during the backward pass. Each thread processes its own trajectories and updates the metadata for the cuts it evaluated. No locking is needed because the per-stage synchronization barrier ensures that all threads have finished their updates before `select` reads the metadata. See [Cut Management Implementation SS6.2](./cut-management-impl.md).

**Infallibility:** This method does not return `Result`. It performs simple counter/timestamp updates on validated, pre-allocated metadata structures.

## 3. Supporting Types

### 3.1 CutSelectionConfig

The `CutSelectionConfig` struct represents the deserialized form of the `cut_selection` field in `config.json` ([Configuration Reference](../configuration/configuration-reference.md)):

```rust
/// Configuration representation of the cut selection strategy, matching
/// the `training.cut_selection` field in `config.json`.
///
/// Deserialized from the JSON object with fields `enabled`, `method`,
/// `threshold`, `check_frequency`, and optionally `memory_window`.
#[derive(Debug, Clone, Deserialize)]
pub struct CutSelectionConfig {
    /// Whether cut selection is enabled. When `false`, no selection runs
    /// and all cuts remain active for the entire training run.
    pub enabled: bool,

    /// Selection method: `"level1"`, `"lml1"`, or `"domination"`.
    pub method: String,

    /// Activity threshold epsilon for near-binding tolerance.
    /// Recommended: 0.0 (only strictly binding cuts are considered active).
    pub threshold: f64,

    /// Number of iterations between selection runs.
    pub check_frequency: u32,

    /// Number of iterations to retain inactive cuts (LML1 only).
    /// Ignored for Level1 and Dominated.
    pub memory_window: Option<u32>,
}
```

**Conversion:** `CutSelectionConfig` is validated and converted to `Option<CutSelectionStrategy>` during configuration loading. When `enabled` is `false`, the conversion produces `None` and the training loop skips all selection logic. When `enabled` is `true`, the validated config produces a `Some(CutSelectionStrategy)` value. Validation rules are specified in SS5.

### 3.2 Per-Cut Tracking Metadata

Each cut slot in the pre-allocated cut pool carries metadata used by the selection strategies. The metadata fields are written during `update_activity` (SS2.3) and read during `select` (SS2.2):

```rust
/// Per-cut metadata for cut selection tracking.
///
/// Stored alongside the cut coefficients and intercept in the pre-allocated
/// cut pool (see Cut Management Implementation SS1.1). All fields are
/// initialized to their zero/default values when the cut is first written.
pub struct CutMetadata {
    /// Iteration at which this cut was generated.
    /// Used to prevent deactivation of cuts generated in the current iteration.
    pub iteration_generated: u32,

    /// Forward pass index that generated this cut.
    /// Combined with `iteration_generated`, uniquely identifies the cut's
    /// deterministic slot (see Cut Management Implementation SS1.2).
    pub forward_pass_index: u32,

    /// Cumulative number of times this cut was binding at an LP solution.
    /// Used by Level1: deactivate if `active_count == 0`.
    /// Initialized to 0; incremented by `update_activity` for Level1 variant.
    pub active_count: u32,

    /// Most recent iteration at which this cut was binding.
    /// Used by LML1: deactivate if `last_active_iter < iteration - memory_window`.
    /// Initialized to `iteration_generated`; updated by `update_activity` for LML1.
    pub last_active_iter: u32,

    /// Number of visited states at which this cut is dominated by other cuts.
    /// Used by Dominated: deactivate if dominated at ALL visited states.
    /// Reset to 0 by `update_activity` when the cut is binding at a state.
    pub domination_count: u32,
}
```

**Initialization semantics:** When a new cut is written to its deterministic slot, the metadata fields are initialized as follows:

| Field                 | Initial Value         | Rationale                                                   |
| --------------------- | --------------------- | ----------------------------------------------------------- |
| `iteration_generated` | Current iteration     | Identifies when the cut was created                         |
| `forward_pass_index`  | Forward pass index    | Identifies which forward pass trajectory generated the cut  |
| `active_count`        | 0                     | The cut has not yet been evaluated in a subsequent LP solve |
| `last_active_iter`    | `iteration_generated` | Prevents immediate deactivation by LML1 on the first check  |
| `domination_count`    | 0                     | Not yet evaluated for domination                            |

### 3.3 DeactivationSet

```rust
/// Set of cut indices to deactivate at a single stage.
///
/// Returned by `select` and consumed by the FCF manager to update the
/// activity bitmap. The indices are slot positions in the pre-allocated
/// cut pool.
pub struct DeactivationSet {
    /// Cut slot indices to deactivate.
    pub indices: Vec<u32>,
}
```

The `DeactivationSet` is a lightweight transfer type. The caller applies each index to the activity bitmap by clearing the corresponding bit and decrementing the active count.

## 4. Dispatch Mechanism

The cut selection strategy uses **enum dispatch** -- a `match` on the `CutSelectionStrategy` variant at each call site. This is the same pattern used by the three sibling trait specs: [RiskMeasure SS4](./risk-measure-trait.md), [HorizonMode SS4](./horizon-mode-trait.md), and [SamplingScheme SS4](./sampling-scheme-trait.md).

**Why enum dispatch is the natural choice:** The cut selection strategy is a global setting (one strategy for the entire run, applied identically to all stages), so compile-time monomorphization would also work. However, enum dispatch is preferred for consistency with the other algorithm abstraction points and because the variant set is small and closed (three strategies, with no additional variants planned). The `match` cost is negligible: `select` executes at most once per stage per `check_frequency` iterations, which at production scale (120 stages, `check_frequency=10`) amounts to at most 12 dispatches per iteration -- amortized over the dominant LP solve cost.

**Why not trait objects:** The variant set is closed (Level1, LML1, and Dominated only). `Box<dyn CutSelectionStrategy>` would add heap allocation and virtual dispatch overhead without the extensibility benefit. The enum approach keeps the strategy value on the stack and allows the compiler to inline the variant-specific logic.

**Why not compile-time monomorphization:** While the strategy is global (unlike the per-stage risk measure), monomorphization would require propagating a generic type parameter `S: CutSelectionStrategyTrait` through the training loop and FCF manager signatures. The marginal performance benefit is zero (the `match` executes on a cold path), while the compile-time complexity would increase. Enum dispatch avoids this cost-free complexity.

## 5. Validation Rules

The following validation rules apply to `CutSelectionConfig` during configuration loading:

| Rule | Condition                                                            | Error                                                                                                      |
| ---- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| C1   | `method` must be one of `"level1"`, `"lml1"`, `"domination"`         | Unrecognized cut selection method                                                                          |
| C2   | `threshold` must be $\geq 0$                                         | Negative threshold is meaningless                                                                          |
| C3   | `check_frequency` must be $> 0$                                      | Zero frequency would mean selection runs every iteration (use 1 for that) and zero causes division-by-zero |
| C4   | When `method` is `"lml1"`, `memory_window` must be present and $> 0$ | LML1 requires a finite positive memory window                                                              |
| C5   | When `method` is not `"lml1"`, `memory_window` is ignored if present | No error, silently ignored (logged as warning)                                                             |

Validation is performed once during the variant selection pipeline ([Extension Points SS6](./extension-points.md), step 5). After validation, the `CutSelectionStrategy` enum value is guaranteed to satisfy these constraints for the entire training run. This is why `should_run`, `select`, and `update_activity` are infallible -- they operate on validated inputs.

## 6. Interaction with Cut Pool

### 6.1 Activity Bitmap

The per-stage cut pool maintains an activity bitmap that tracks which slots contain active cuts ([Cut Management Implementation SS1.1](./cut-management-impl.md)). The bitmap has one bit per pre-allocated slot. The cut selection strategy interacts with this bitmap through a strict protocol:

| Operation      | Who performs it                | Bitmap effect                                   |
| -------------- | ------------------------------ | ----------------------------------------------- |
| Add new cut    | Training loop                  | Sets the slot's bit to 1 (active)               |
| Deactivate cut | FCF manager (on select result) | Clears the slot's bit to 0 (inactive)           |
| Reactivate cut | Never                          | Deactivation is permanent within a training run |

**Deactivation semantics:** When a cut is deactivated, its activity bitmap bit is cleared and the stage's active count is decremented. The cut's coefficient data, intercept, and metadata remain in the slot -- they are never overwritten or zeroed. This is essential for:

1. **Checkpoint/resume correctness** -- the full cut history (active and inactive) is serialized to FlatBuffers on checkpoint ([Cut Management Implementation SS3](./cut-management-impl.md))
2. **Deterministic slot assignment** -- slot indices are computed from `(iteration, forward_pass_index)` and must remain stable regardless of deactivation ([Cut Management Implementation SS1.2](./cut-management-impl.md))
3. **Post-hoc analysis** -- inactive cuts can be inspected for debugging and diagnostics

### 6.2 Deactivation vs. Deletion

Cuts are **never deleted** from the pool. The deactivation mechanism relaxes the cut's contribution to the LP by ensuring that deactivated cuts are not loaded into the solver workspace for subsequent LP solves. Concretely:

- **Active cuts** are included in the CSR assembly for the LP constraint matrix ([Solver Abstraction SS5](./solver-abstraction.md))
- **Inactive cuts** are skipped during CSR assembly -- they have no effect on the LP solution

This is functionally equivalent to setting the cut's bound to $-\infty$ (as described in [Cut Management SS5](../math/cut-management.md)), but implemented more efficiently by excluding inactive cuts from the solver entirely rather than adding a redundant row.

### 6.3 Populated Count and Active Count

The cut pool tracks two counts per stage:

| Counter           | Description                                                                      | Updated by                                    |
| ----------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `populated_count` | Number of slots containing valid cuts (active or inactive). Grows monotonically. | Training loop, on each new cut addition       |
| `active_count`    | Number of currently active cuts. May decrease after selection runs.              | FCF manager, after applying `DeactivationSet` |

The `select` method reads `populated_count` to know the range of slots to scan (slots `0..populated_count`), and reads the activity bitmap to identify which of those slots are currently active. The relationship `active_count <= populated_count <= capacity` always holds.

### 6.4 Visited States

The Dominated variant requires access to the set of visited states (trial points from forward passes). These are stored in the policy's per-stage `StageStates` structure ([Cut Management Implementation SS2.3](./cut-management-impl.md)). The visited state set grows with each forward pass iteration. For the Dominated check, the implementation evaluates every active cut at every visited state, yielding the $\mathcal{O}(\lvert\text{active cuts}\rvert \times \lvert\text{visited states}\rvert)$ cost per stage.

At production scale (15,000 cut capacity, 192 forward passes, 50 iterations between checks), the visited state set at the first check contains $192 \times 10 = 1{,}920$ states, and the active cut count is approximately $192 \times 10 = 1{,}920$. The domination check cost is $1{,}920 \times 1{,}920 \approx 3.7\text{M}$ cut evaluations per stage, each requiring a dot product of dimension `state_dimension` (2,080 at production scale). This is significant -- approximately $3.7\text{M} \times 2{,}080 \approx 7.7\text{G}$ floating-point operations per stage per check -- which is why `check_frequency` amortizes the cost across multiple iterations.

## 7. Convergence Guarantee

**Theorem** (Bandarra & Guigues, 2021): Under Level-1 or LML1 cut selection, SDDP with finitely many scenarios converges to the optimal value function with probability 1.

This theorem is stated and cited in [Cut Management SS8](../math/cut-management.md). The key insight is that removing cuts that are never active at any visited state does not affect the outer approximation quality at those states. As the set of visited states becomes dense over iterations, the approximation converges.

**Applicability to variants:**

| Variant   | Convergence guarantee                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Level1    | Preserved. Only cuts that have _never_ been binding are removed; all ever-useful cuts remain.                                                                                                                                            |
| LML1      | Preserved. The memory window ensures that periodically revisited cuts are retained. The theorem's proof covers the LML1 case explicitly.                                                                                                 |
| Dominated | Not formally covered by the Bandarra-Guigues theorem. Dominated cut detection is a heuristic that may remove cuts which would be active at unvisited states. In practice, the visited state set grows dense and the heuristic converges. |

**Implication for production use:** Level1 and LML1 are the recommended strategies when convergence guarantees are required. The Dominated strategy offers more aggressive pruning at the cost of a weaker theoretical guarantee, making it suitable for cases where empirical convergence monitoring (via [Convergence Monitoring](./convergence-monitoring.md)) provides sufficient confidence.

## Cross-References

- [Cut Management (Math)](../math/cut-management.md) -- Cut activity definition (SS6), three selection strategies (SS7.1 Level-1, SS7.2 LML1, SS7.3 Dominated), convergence guarantee theorem (SS8), selection parameters (SS9)
- [Cut Management Implementation](./cut-management-impl.md) -- Cut pool structure and activity bitmap (SS1.1), deterministic slot assignment (SS1.2), selection strategy implementation (SS2), cut serialization for checkpoint (SS3), cross-rank synchronization (SS4), activity tracking and binding detection (SS6)
- [Extension Points](./extension-points.md) -- Variant architecture overview (SS1), dispatch mechanism analysis (SS7), variant selection pipeline (SS6), variant composition validation (SS8)
- [Training Loop](./training-loop.md) -- Cut metadata and active count tracking (SS7.3), backward pass where `update_activity` is invoked
- [Solver Abstraction](./solver-abstraction.md) -- Cut pool design (SS5), how active cuts enter the solver LP via CSR assembly (SS5.4)
- [Solver Workspaces](./solver-workspaces.md) -- Stage solve workflow (SS1.4) where binding detection occurs and activity counters are updated
- [Configuration Reference](../configuration/configuration-reference.md) -- `training.cut_selection` JSON schema: `enabled`, `method`, `threshold`, `check_frequency`, `memory_window`
- [Binary Formats](../data-model/binary-formats.md) -- FlatBuffers schema for cut metadata persistence (SS3.1), visited states for dominated detection (SS3.4)
- [Convergence Monitoring](./convergence-monitoring.md) -- Uses FCF statistics (lower bound from stage 1 cuts) that depend on cut pool quality
- [Risk Measure Trait](./risk-measure-trait.md) -- Sibling trait specification following the same enum dispatch pattern (SS4)
- [Horizon Mode Trait](./horizon-mode-trait.md) -- Sibling trait specification following the same enum dispatch pattern (SS4)
- [Sampling Scheme Trait](./sampling-scheme-trait.md) -- Sibling trait specification following the same enum dispatch pattern (SS4)
- [Communicator Trait](../hpc/communicator-trait.md) -- Reference pattern for trait specification structure and convention blockquote
