# Sampling Scheme Trait

## Purpose

This spec defines the `SamplingScheme` abstraction -- the enum-based trait through which the SDDP forward pass selects scenario realizations at each stage. The sampling scheme is one of three orthogonal concerns governing how scenarios are handled during training ([Scenario Generation SS3.1](./scenario-generation.md)): it controls the forward pass noise source while leaving the backward pass noise source untouched. The three supported variants -- InSample, External, and Historical -- correspond to the three forward sampling modes described in [Scenario Generation SS3.2](./scenario-generation.md) and the variant table in [Extension Points SS5.1](./extension-points.md). The sampling scheme is a global property of the training run (one scheme per execution), configured via the `scenario_source` field in `stages.json` ([Input Scenarios SS2.1](../data-model/input-scenarios.md)).

> **Convention: Rust traits as specification guidelines.** The Rust trait definitions, method signatures, and struct declarations throughout this specification corpus serve as _guidelines for implementation_, not as absolute source-of-truth contracts that must be reproduced verbatim. Their purpose is twofold: (1) to express behavioral contracts, preconditions, postconditions, and type-level invariants more precisely than prose alone, and (2) to anchor conformance test suites that verify backend interchangeability (see [Backend Testing §1](../hpc/backend-testing.md)). Implementation may diverge in naming, parameter ordering, error representation, or internal organization when practical considerations demand it -- provided the behavioral contracts and conformance tests continue to pass. When a trait signature and a prose description conflict, the prose description (which captures the domain intent) takes precedence; the conflict should be resolved by updating the trait signature. This convention applies to all trait-bearing specification documents in `src/specs/`.

## 1. Trait Definition

The sampling scheme is modeled as a flat enum with three variants, matching the three forward sampling modes supported by Cobre ([Extension Points SS5.1](./extension-points.md)):

```rust
/// Sampling scheme controlling how the forward pass selects scenario
/// realizations at each stage.
///
/// A single `SamplingScheme` value is resolved from the `scenario_source`
/// field in `stages.json` during configuration loading (see
/// Extension Points SS6). The enum is global to the training run --
/// all stages share the same sampling scheme.
#[derive(Debug, Clone)]
pub enum SamplingScheme {
    /// In-sample Monte Carlo forward sampling.
    ///
    /// At each stage t, sample a random index j in {0, ..., N_openings - 1}
    /// and use the corresponding noise vector from the fixed opening tree.
    /// The forward and backward passes draw from the same noise distribution.
    ///
    /// See [Scenario Generation SS3.2](./scenario-generation.md).
    InSample {
        /// Base seed for reproducible noise generation.
        /// Deterministic seed derivation per (iteration, scenario, stage)
        /// ensures cross-rank and restart reproducibility.
        seed: u64,
    },

    /// External scenario forward sampling.
    ///
    /// The forward pass draws from user-provided scenario data
    /// (`external_scenarios.parquet`). External inflow values are
    /// inverted to noise terms (epsilon) before use in the LP, because the
    /// SDDP formulation includes AR dynamics as constraints with fixed
    /// noise terms. See [Scenario Generation SS4.3](./scenario-generation.md).
    ///
    /// The backward pass uses the fixed opening tree generated from a
    /// PAR model fitted to the external data (see SS5 and
    /// [Scenario Generation SS4.2](./scenario-generation.md)).
    External {
        /// Pre-loaded external scenario data, indexed by
        /// (stage_id, scenario_id, hydro_id).
        scenarios: ExternalScenarioData,

        /// How scenarios are selected from the external set during
        /// the forward pass.
        selection_mode: SelectionMode,
    },

    /// Historical inflow replay.
    ///
    /// The forward pass replays actual historical inflow sequences mapped
    /// to stages via `season_definitions`. Historical inflow values are
    /// inverted to noise terms (epsilon) before use in the LP, following
    /// the same noise inversion procedure as External.
    ///
    /// The backward pass uses the fixed opening tree generated from a
    /// PAR model fitted to the historical data.
    Historical {
        /// Pre-loaded historical inflow data, mapped from
        /// `inflow_history.parquet` to the stage structure via
        /// `season_definitions`.
        history: HistoricalInflowData,
    },
}
```

The `ExternalScenarioData` and `HistoricalInflowData` types are opaque handles to the pre-loaded and pre-validated scenario data. Their internal structure is an implementation concern -- the spec constrains only the behavioral contracts in SS2.

## 2. Method Contracts

### 2.1 sample_forward

`sample_forward` selects the noise realization for a given forward pass stage. This is the primary method consumed by the forward pass at each stage solve. The method returns a `NoiseVector` containing one noise value per stochastic entity, which the training loop uses to fix the noise terms in the stage LP.

```rust
impl SamplingScheme {
    /// Select the noise realization for a forward pass stage.
    ///
    /// The returned NoiseVector contains one noise value (eta) per
    /// stochastic entity. For InSample, this is a direct lookup into
    /// the opening tree. For External and Historical, the raw inflow
    /// values are inverted to noise terms via the PAR model
    /// (see [Scenario Generation SS4.3](./scenario-generation.md)).
    pub fn sample_forward(
        &self,
        stage_id: usize,
        scenario_index: usize,
        rng: &mut StageRng,
    ) -> NoiseVector {
        todo!()
    }
}
```

**Preconditions:**

| Condition                                                       | Description                                                                                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stage_id` exists in the stage set                              | The stage ID was loaded from `stages.json` and passed validation                                                                                                           |
| `scenario_index < total_forward_passes`                         | The scenario index is within the current iteration's forward pass count                                                                                                    |
| `rng` is seeded deterministically                               | The RNG state is derived from `(iteration, scenario_index, stage_id)` via the deterministic seed derivation scheme ([Scenario Generation SS2.2](./scenario-generation.md)) |
| For `External`: `stage_id` exists in the external scenario data | All stages referenced during forward traversal have external scenario entries                                                                                              |
| For `Historical`: `stage_id` is mappable to a historical period | The stage's season has corresponding historical inflow data                                                                                                                |

**Postconditions:**

| Condition                                                                                    | Description                                                                                                                                           |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NoiseVector` has length equal to the number of stochastic entities                          | One noise value per entity in the correlation structure                                                                                               |
| For `InSample`: the returned noise is the opening tree vector at the sampled index           | The sampled index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ is drawn uniformly by `rng`                                                          |
| For `External`: the returned noise is the inverted noise from the selected external scenario | Raw inflow values from `external_scenarios.parquet` are transformed to noise terms $\eta_t$ via [Scenario Generation SS4.3](./scenario-generation.md) |
| For `Historical`: the returned noise is the inverted noise from the historical inflow record | Historical inflows from `inflow_history.parquet` are transformed to noise terms $\eta_t$ via the same inversion procedure                             |
| Deterministic output                                                                         | Given the same `rng` state, `stage_id`, and `scenario_index`, the method returns identical results across MPI ranks, restarts, and thread orderings   |
| Correlation is applied                                                                       | The returned noise vector reflects the spatial correlation structure from `correlation.json` ([Scenario Generation SS2.1](./scenario-generation.md))  |

**Noise inversion detail:** For `External` and `Historical`, the raw inflow value $a_t^{\text{target}}$ at stage $t$ for hydro $h$ is inverted to a noise term via:

$$
\eta_t = \frac{a_t^{\text{target}} - \phi_m - \sum_{\ell=1}^{P} \psi_{m,\ell} \cdot a_{t-\ell}}{\sigma_m}
$$

where $\phi_m$, $\psi_{m,\ell}$, and $\sigma_m$ are the precomputed PAR model parameters for the active season $m$. See [Scenario Generation SS4.3](./scenario-generation.md) for the full procedure and validation checks.

**Infallibility:** This method does not return `Result`. All inputs (stage IDs, external scenario data, historical data) are validated at configuration load time (SS6). The PAR model parameters are guaranteed to produce valid inversions after preprocessing validation ([Validation Architecture SS2.5](./validation-architecture.md)).

### 2.2 requires_noise_inversion

`requires_noise_inversion` indicates whether the variant requires noise inversion -- the transformation of raw inflow values to noise terms ($\eta$) via the PAR model before they can be used in the stage LP. InSample operates directly on pre-generated noise vectors from the opening tree, so no inversion is needed. External and Historical provide raw inflow values that must be inverted.

```rust
impl SamplingScheme {
    /// Whether this sampling scheme requires noise inversion.
    ///
    /// When true, the preprocessing pipeline must:
    /// 1. Fit a PAR model to the forward scenario data
    ///    (see [Scenario Generation SS4.2](./scenario-generation.md))
    /// 2. Generate the opening tree from the fitted PAR model
    /// 3. Invert external/historical inflow values to noise terms
    ///    (see [Scenario Generation SS4.3](./scenario-generation.md))
    pub fn requires_noise_inversion(&self) -> bool {
        match self {
            SamplingScheme::InSample { .. } => false,
            SamplingScheme::External { .. } => true,
            SamplingScheme::Historical { .. } => true,
        }
    }
}
```

**Preconditions:** None. This is a pure query on the enum variant.

**Postconditions:**

| Condition                   | Description                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `InSample` returns `false`  | Opening tree noise is already in noise-term form; no inversion needed |
| `External` returns `true`   | External scenario inflow values must be inverted to noise terms       |
| `Historical` returns `true` | Historical inflow values must be inverted to noise terms              |

**Implications for the preprocessing pipeline:** When `requires_noise_inversion()` returns `true`, the initialization sequence must include two additional steps before training begins:

1. **PAR model fitting** -- Fit a PAR model to the external/historical data using the Yule-Walker method ([Scenario Generation SS1.4](./scenario-generation.md), [Scenario Generation SS4.2](./scenario-generation.md)). The fitted model provides the seasonal statistics and AR coefficients needed for both noise inversion and opening tree generation.
2. **Opening tree generation from fitted model** -- Generate the fixed opening tree using noise from the fitted PAR model, so that backward pass branchings reflect the statistical properties of the forward scenario data.

### 2.3 backward_tree_source

`backward_tree_source` describes the source of noise for the backward pass opening tree. This method makes explicit the relationship between the forward sampling scheme and the backward pass noise source -- a relationship governed by the forward-backward separation invariant (SS5).

```rust
/// Describes the source of noise for the backward pass opening tree.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BackwardTreeSource {
    /// Opening tree noise is generated from the user-provided PAR
    /// model parameters (inflow_seasonal_stats.parquet and
    /// inflow_ar_coefficients.parquet).
    UserProvidedPAR,

    /// Opening tree noise is generated from a PAR model fitted to
    /// external scenario data (external_scenarios.parquet).
    FittedToExternalData,

    /// Opening tree noise is generated from a PAR model fitted to
    /// historical inflow data (inflow_history.parquet).
    FittedToHistoricalData,
}

impl SamplingScheme {
    /// Describe the noise source for the backward pass opening tree.
    ///
    /// The backward pass ALWAYS uses the fixed opening tree (SS5).
    /// This method indicates where the opening tree noise comes from,
    /// which determines the PAR model used for tree generation.
    pub fn backward_tree_source(&self) -> BackwardTreeSource {
        match self {
            SamplingScheme::InSample { .. } => BackwardTreeSource::UserProvidedPAR,
            SamplingScheme::External { .. } => BackwardTreeSource::FittedToExternalData,
            SamplingScheme::Historical { .. } => BackwardTreeSource::FittedToHistoricalData,
        }
    }
}
```

**Preconditions:** None. This is a pure query on the enum variant.

**Postconditions:**

| Condition                                     | Description                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `InSample` returns `UserProvidedPAR`          | The user supplies PAR parameters; opening tree is generated from those parameters          |
| `External` returns `FittedToExternalData`     | PAR model is fitted to external scenarios; opening tree is generated from the fitted model |
| `Historical` returns `FittedToHistoricalData` | PAR model is fitted to historical inflows; opening tree is generated from the fitted model |

**Usage:** The training initialization pipeline uses `backward_tree_source()` to determine which PAR model to use when generating the opening tree ([Scenario Generation SS2.3](./scenario-generation.md)). When the source is `FittedToExternalData` or `FittedToHistoricalData`, the PAR fitting step must precede opening tree generation.

## 3. Supporting Types

### 3.1 SamplingSchemeConfig

`SamplingSchemeConfig` represents the deserialized form of the `scenario_source` field in `stages.json` ([Input Scenarios SS2.1](../data-model/input-scenarios.md)). It maps directly to the JSON schema:

```rust
/// Configuration representation of the sampling scheme, matching the
/// `scenario_source` field in `stages.json`.
///
/// Deserialized from one of the three JSON forms documented in
/// [Input Scenarios SS2.1](../data-model/input-scenarios.md).
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "sampling_scheme", rename_all = "snake_case")]
pub enum SamplingSchemeConfig {
    /// InSample: `{ "sampling_scheme": "in_sample", "seed": 42 }`
    InSample {
        /// Base seed for reproducible noise generation.
        seed: u64,
    },

    /// External: `{ "sampling_scheme": "external", "selection_mode": "random" }`
    External {
        /// How scenarios are selected: "random" (default) or "sequential".
        #[serde(default = "default_selection_mode")]
        selection_mode: SelectionMode,
    },

    /// Historical: `{ "sampling_scheme": "historical" }`
    Historical,
}

fn default_selection_mode() -> SelectionMode {
    SelectionMode::Random
}
```

**Conversion:** `SamplingSchemeConfig` is validated and converted to `SamplingScheme` during configuration loading (step 4 of the variant selection pipeline in [Extension Points SS6](./extension-points.md)). The validation rules are specified in SS6.

### 3.2 SelectionMode

`SelectionMode` applies only to the `External` variant and determines how scenarios are selected from the external set during the forward pass:

```rust
/// Selection mode for external scenario sampling.
///
/// Controls how the forward pass picks scenarios from the
/// external_scenarios.parquet dataset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SelectionMode {
    /// Sample uniformly from the external scenario set with replacement.
    /// Each forward pass trajectory independently draws a random scenario.
    /// This is the default.
    Random,

    /// Iterate through external scenarios in order, cycling when
    /// exhausted. Scenario `i` is assigned to forward pass trajectory
    /// `i mod N_external`. Deterministic -- no randomness involved.
    Sequential,
}
```

### 3.3 NoiseVector

The `NoiseVector` is the return type of `sample_forward`. It contains one noise value per stochastic entity:

```rust
/// Noise vector for a single (stage, scenario) pair.
///
/// Contains one noise value (eta) per stochastic entity. The entity
/// ordering matches the entity index used throughout the scenario
/// generation pipeline ([Scenario Generation SS2.1](./scenario-generation.md)).
pub struct NoiseVector {
    /// Noise values, one per stochastic entity.
    /// Length equals the number of entities in the correlation structure.
    pub values: Vec<f64>,
}
```

## 4. Dispatch Mechanism

The sampling scheme uses **enum dispatch** -- a `match` on the `SamplingScheme` variant at each call site in the forward pass. The sampling scheme is global (one per run), determined at configuration load time from `stages.json`.

**Why global, not per-stage:** The sampling scheme determines the source of forward pass noise -- whether it comes from the opening tree, external data, or historical records. This is inherently a run-level property: a single training run cannot simultaneously draw from in-sample noise at one stage and external scenarios at another (the noise sources would be inconsistent, and the noise inversion prerequisites differ between schemes). The scheme must be uniform across all stages in a given run.

**Why enum dispatch, not compile-time monomorphization:** Although the sampling scheme is global (making monomorphization technically feasible), enum dispatch is preferred for consistency with the other abstraction points ([Extension Points SS7](./extension-points.md)). The match overhead is negligible: `sample_forward` is called once per stage per forward trajectory. At production scale (192 forward passes, 120 stages), this is ~23,000 match dispatches per iteration -- dominated by the LP solve cost.

**Why not trait objects:** The variant set is closed (InSample, External, and Historical only). Trait objects add indirection cost without extensibility benefit. The enum approach avoids heap allocation and is consistent with the `RiskMeasure` and `HorizonMode` dispatch patterns ([Risk Measure Trait SS4](./risk-measure-trait.md), [Horizon Mode Trait SS4](./horizon-mode-trait.md)).

## 5. Forward-Backward Separation Invariant

This section documents the most critical behavioral contract governing the sampling scheme abstraction.

**Invariant: The backward pass ALWAYS uses the fixed opening tree, regardless of the forward sampling scheme.**

This invariant is established in [Scenario Generation SS3.1](./scenario-generation.md) and [Extension Points SS5.4](./extension-points.md). It is the foundation of SDDP correctness when the forward and backward noise sources differ:

The forward pass may sample from any of the three noise sources (opening tree, external data, historical records). The backward pass, which generates cuts by evaluating all $N_{\text{openings}}$ branchings at each stage, always uses the fixed opening tree generated once before training begins ([Scenario Generation SS2.3](./scenario-generation.md)). The opening tree is invariant across iterations -- every backward pass "sees the same tree."

**Why this invariant is necessary:** Cut generation in SDDP requires proper probabilistic branchings -- each opening has a known probability weight, and the cut aggregation formula depends on these weights summing to 1. Using external scenarios directly in the backward pass would violate this requirement because external scenarios are deterministic data, not probabilistic branchings. The fixed opening tree, generated from a PAR model (either user-provided or fitted to the external/historical data), provides the probabilistic structure that SDDP demands.

**Consequences by variant:**

| Variant    | Forward Noise Source         | Backward Noise Source        | Opening Tree PAR Model                                                                |
| ---------- | ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| InSample   | Opening tree (random index)  | Same opening tree            | User-provided PAR parameters                                                          |
| External   | `external_scenarios.parquet` | Opening tree from fitted PAR | PAR fitted to external data ([Scenario Generation SS4.2](./scenario-generation.md))   |
| Historical | `inflow_history.parquet`     | Opening tree from fitted PAR | PAR fitted to historical data ([Scenario Generation SS4.2](./scenario-generation.md)) |

For InSample, the forward and backward noise sources coincide -- both draw from the same opening tree. This is the standard SDDP configuration where the trial points visited in the forward pass are consistent with the backward pass branchings.

For External and Historical, the forward and backward noise sources differ. The forward pass explores states driven by external/historical data, while the backward pass evaluates cuts at those states under PAR-generated branchings. The PAR model is fitted to the external/historical data to ensure that the backward branchings reflect the statistical properties of the forward scenarios. Without this fitting step, the cuts generated in the backward pass would be based on a noise distribution unrelated to the forward scenarios, potentially degrading convergence.

**Violations of this invariant are implementation errors.** Any code path that allows the backward pass to use noise from a source other than the fixed opening tree produces cuts with incorrect probability weights, which can lead to non-convergent or sub-optimal policies.

## 6. Validation Rules

The following validation rules apply to `SamplingSchemeConfig` during configuration loading. These reproduce rules S1-S4 from [Extension Points SS5.3](./extension-points.md):

| Rule | Condition                                                             | Error                                  |
| ---- | --------------------------------------------------------------------- | -------------------------------------- |
| S1   | `in_sample` requires `seed`                                           | Reproducibility requires explicit seed |
| S2   | `external` requires `external_scenarios.parquet` in input directory   | Missing external scenario file         |
| S3   | `historical` requires `inflow_history.parquet` in input directory     | Missing historical inflow file         |
| S4   | `external` with `selection_mode` must be `"random"` or `"sequential"` | Invalid selection mode                 |

```rust
/// Structured validation error for sampling scheme rules S1-S4.
#[derive(Debug)]
pub enum SamplingSchemeValidationError {
    /// S1: InSample requires a seed for reproducibility.
    MissingSeed,

    /// S2: External requires external_scenarios.parquet.
    MissingExternalScenarioFile {
        expected_path: String,
    },

    /// S3: Historical requires inflow_history.parquet.
    MissingHistoricalInflowFile {
        expected_path: String,
    },

    /// S4: Invalid selection mode for External variant.
    InvalidSelectionMode {
        value: String,
    },
}
```

Validation is performed once during the variant selection pipeline ([Extension Points SS6](./extension-points.md), step 5). After validation, the `SamplingScheme` enum value is guaranteed to satisfy these constraints for the entire training run. This is why `sample_forward` is infallible -- it operates on validated inputs and pre-loaded data.

**Additional preprocessing validation:** When `requires_noise_inversion()` returns `true`, the PAR model fitting and noise inversion steps perform their own validation:

- **PAR fitting validation** -- The fitted model must satisfy the same invariants as user-provided PAR parameters: positive residual variance, correlation matrix positive definite, AR order consistency ([Scenario Generation SS1.4](./scenario-generation.md), [PAR(p) Inflow Model SS6](../math/par-inflow-model.md)).
- **Noise inversion validation** -- Warning if $|\eta_t| > 4.0$ (extreme noise); error if $\sigma_m \approx 0$ but the residual is non-negligible ([Scenario Generation SS4.3](./scenario-generation.md)).
- **AR order compatibility** -- If loading a warm-start policy, the AR order in the policy must match the fitted model ([Validation Architecture SS2.5b](./validation-architecture.md)).

## Cross-References

- [Scenario Generation](./scenario-generation.md) -- Three orthogonal concerns (SS3.1), forward sampling schemes (SS3.2), backward sampling (SS3.4), opening tree (SS2.3), noise inversion (SS4.3), PAR fitting from external data (SS4.2), reproducible sampling (SS2.2)
- [Extension Points](./extension-points.md) -- Sampling scheme variant table (SS5.1), configuration mapping (SS5.2), validation rules S1-S4 (SS5.3), forward-backward separation invariant (SS5.4), dispatch mechanism analysis (SS7), variant selection pipeline (SS6)
- [Training Loop](./training-loop.md) -- Forward pass (SS4) where `sample_forward` is invoked; sampling scheme behavioral contract (SS3.4)
- [PAR(p) Inflow Model](../math/par-inflow-model.md) -- PAR model definition (SS1), parameter set (SS2), residual std derivation (SS3), fitting procedure (SS5), validation invariants (SS6)
- [Input Scenarios SS2.1](../data-model/input-scenarios.md) -- `scenario_source` JSON schema: `sampling_scheme`, `seed`, `selection_mode`
- [Input Scenarios SS2.5](../data-model/input-scenarios.md) -- `external_scenarios.parquet` schema: `stage_id`, `scenario_id`, `hydro_id`, `value_m3s`
- [Validation Architecture](./validation-architecture.md) -- PAR validation rules (SS2.5), warm-start AR compatibility (SS2.5b)
- [Risk Measure Trait](./risk-measure-trait.md) -- Sibling trait specification following the same enum dispatch pattern
- [Horizon Mode Trait](./horizon-mode-trait.md) -- Sibling trait specification following the same enum dispatch pattern
- [Communicator Trait](../hpc/communicator-trait.md) -- Reference pattern for trait specification structure and convention blockquote
- [Solver Abstraction SS10](./solver-abstraction.md) -- Compile-time solver selection pattern (contrasted with the enum dispatch used here)
- [Deferred Features SS C.13](../deferred.md) -- Alternative forward pass model (deferred)
- [Deferred Features SS C.14](../deferred.md) -- Monte Carlo backward sampling (deferred)
