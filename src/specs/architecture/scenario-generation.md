# Scenario Generation

## Purpose

This spec defines the Cobre scenario generation pipeline. The framework supports pluggable stochastic process models for generating scenarios used by iterative optimization algorithms. The current implementation provides PAR(p) autoregressive inflow models for hydrothermal dispatch, including: PAR model preprocessing, correlated noise generation, the sampling scheme abstraction that governs how scenarios are selected in forward and backward passes, external scenario integration, load scenario generation, and the scenario memory layout optimized for the solution hot-path. For the mathematical definition of the PAR(p) model, see [PAR(p) Inflow Model](../math/par-inflow-model.md).

## 1. PAR Model Preprocessing

### 1.1 Overview

The PAR(p) model generates stochastic inflows during training. Before the training loop begins, the raw PAR parameters — loaded from `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet` — are preprocessed into a contiguous, cache-friendly layout that eliminates per-stage season lookups on the hot path.

For the full PAR(p) model definition, parameter set, and fitting theory, see [PAR(p) Inflow Model](../math/par-inflow-model.md).

### 1.2 Preprocessing Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PAR Model Preprocessing Pipeline                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Input: inflow_seasonal_stats.parquet (μ, s per hydro × stage)                  │
│         inflow_ar_coefficients.parquet (ψ per hydro × stage × lag)              │
│         inflow_history.parquet (optional, for lag initialization)               │
│                                                                                 │
│  Step 1: Load PAR Parameters                                                    │
│  For each (hydro h, stage t) with season m = season(t):                         │
│    μ[h][t] = mean_m3s          (seasonal mean)                                  │
│    s[h][t] = std_m3s           (seasonal sample std)                            │
│    ψ[h][t][ℓ] = coefficient    (AR coefficients, original units)                │
│    p[h][t] = ar_order          (AR order for this hydro/stage)                  │
│                              │                                                  │
│                              ▼                                                  │
│  Step 2: Compute Residual Standard Deviation                                    │
│  For each (hydro h, stage t):                                                   │
│    Reverse-standardize AR coefficients to get ψ*                                │
│    Compute σ[h][t] from s[h][t] and ψ* (see par-inflow-model.md SS3)            │
│                              │                                                  │
│                              ▼                                                  │
│  Step 3: Precompute Stage-Specific Deterministic Components                     │
│  For each (hydro h, stage t) with season m = season(t):                         │
│    base[h][t] = μ[h][t] − Σ_ℓ ψ[h][t][ℓ] · μ[h][t−ℓ]                            │
│    coeff[h][t][ℓ] = ψ[h][t][ℓ]  for ℓ = 1..p[h][t]                              │
│    scale[h][t] = σ[h][t]                                                        │
│                              │                                                  │
│                              ▼                                                  │
│  Step 4: Initialize Lag State from History                                      │
│  From inflow_history.parquet (when present):                                    │
│    lag_state[h][ℓ] = historical_inflow[h][t₀ − ℓ]  for ℓ = 1..max_order         │
│                              │                                                  │
│                              ▼                                                  │
│  Output: Precomputed PAR structure (contiguous arrays for hot-path access)      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

> **Key distinction:** The input file stores the seasonal sample standard deviation ($s_m$), NOT the residual standard deviation ($\sigma_m$). The residual std is computed during preprocessing from $s_m$ and the AR coefficients via reverse-standardization. See [PAR(p) Inflow Model SS3](../math/par-inflow-model.md) for the derivation.

### 1.3 Memory Layout for Hot-Path Access

The precomputed PAR data uses struct-of-arrays layout for cache efficiency. All arrays are row-major with stage as the outer dimension, so that sequential stage iteration within a scenario touches contiguous memory.

**Arrays:**

| Array          | Dimensions              | Layout                  | Description                                |
| -------------- | ----------------------- | ----------------------- | ------------------------------------------ |
| `base`         | T × N_hydro             | Row-major (stage outer) | Deterministic component per (stage, hydro) |
| `coefficients` | T × N_hydro × max_order | Row-major               | AR coefficients per (stage, hydro, lag)    |
| `scales`       | T × N_hydro             | Row-major               | Residual std $\sigma$ per (stage, hydro)   |
| `orders`       | N_hydro                 | Flat                    | AR order per hydro                         |

**Inflow computation** for a given (stage, hydro) with lag state and noise value $\eta$:

$$
a_{h,t} = \text{base}[h][t] + \sum_{\ell=1}^{p} \text{coeff}[h][t][\ell] \cdot a_{h,t-\ell} + \text{scale}[h][t] \cdot \eta
$$

This is the runtime form of the PAR(p) equation from [PAR(p) Inflow Model SS1](../math/par-inflow-model.md), with all season lookups pre-resolved.

### 1.4 PAR Model Fitting from Historical Data

When AR coefficients are not provided in `inflow_ar_coefficients.parquet`, Cobre fits PAR models from historical inflow data using the Yule-Walker method with BIC-based order selection. For the mathematical derivation of the fitting procedure, see [PAR(p) Inflow Model — Fitting Procedure](../math/par-inflow-model.md).

The fitting process:

1. **Season extraction** — Group historical observations by season (as defined in `season_definitions`)
2. **Seasonal statistics** — Compute mean ($\mu_m$) and sample standard deviation ($s_m$) per season
3. **Standardization** — Transform observations to zero-mean, unit-variance per season
4. **Order selection** — For each season, fit AR models from order 1 to `max_order`, select the order minimizing BIC
5. **Yule-Walker solution** — Solve the Yule-Walker equations using Levinson-Durbin recursion in O(p²) per season
6. **Back-transform** — Convert standardized coefficients back to original units for storage

The fitted model output includes: seasonal means, AR coefficients (original units), residual standard deviations, and selected AR orders — all per season.

**Fitted model validation** follows the same invariants defined in [PAR(p) Inflow Model SS6](../math/par-inflow-model.md):

| Check                      | Severity | Description                                                |
| -------------------------- | -------- | ---------------------------------------------------------- |
| Positive residual variance | Error    | $\sigma_m^2 > 0$ for all seasons                           |
| PAR seasonal stability     | Warning  | Per-season AR polynomial roots outside unit circle         |
| Correlation matrix PSD     | Error    | $R_m$ positive definite (invertible)                       |
| No systematic bias         | Warning  | Residuals $\varepsilon_t$ mean near zero                   |
| AR order consistency       | Error    | Coefficient row count matches `ar_order` in seasonal stats |

## 2. Noise Generation Infrastructure

### 2.1 Correlated Noise Generation

Hydros within the same correlation group share spatially **correlated** noise. The correlation structure is defined in `correlation.json` (see [Input Scenarios SS5](../data-model/input-scenarios.md)).

The generation process:

1. **Independent sampling** — Generate independent standard normal $z_i \sim N(0,1)$ samples, one per entity in the correlation group
2. **Cholesky transform** — Pre-decompose the correlation matrix $\Sigma = L L^T$ during preprocessing. At runtime, multiply: $\eta = L \cdot z$, producing correlated samples
3. **Entity assignment** — Each entity in the group receives its own correlated noise value $\eta_i$ from the transformed vector

Entities in different correlation groups are independent of each other. Entities not assigned to any group receive independent $N(0,1)$ noise.

### 2.2 Reproducible Sampling

Noise generation must produce identical results regardless of MPI rank assignment, thread scheduling, or restart. This is achieved through **deterministic seed derivation**:

- A base seed is specified in `config.json`
- Each (iteration, scenario, stage) tuple maps to a unique derived seed via a deterministic hash function
- The RNG state is initialized from this derived seed before generating the noise vector for that tuple

This design ensures:

- **Cross-rank reproducibility** — The same scenario/stage produces the same noise regardless of which MPI rank processes it
- **Restart reproducibility** — Resuming from a checkpoint produces identical noise for subsequent iterations
- **Order independence** — Results are identical regardless of the order in which scenarios or stages are processed

> **Architectural note:** Because every rank can independently derive the same noise for any `(iteration, scenario, stage)` tuple by hashing identical inputs with the same RNG, no MPI broadcast of noise data is required. This is a key architectural property: rank 0 does not generate all noise and broadcast it to worker ranks. Instead, each rank generates only the noise it needs, exactly when it needs it. This property eliminates the need for a dedicated scenario innovation noise broadcast format — the seed-based architecture already resolves the distribution problem.

### 2.2a Seed Derivation Function

The deterministic hash function referenced in SS2.2 is **SipHash-1-3**, provided by the [`siphasher`](https://crates.io/crates/siphasher) crate (version `1.x`). The `siphasher` crate guarantees output stability across crate versions, making it suitable for cross-platform and cross-build reproducibility. The hash does **not** need to be cryptographic — SipHash-1-3 is chosen for speed and sufficient collision resistance over the small $(iteration, scenario, stage)$ input domain, not for security properties.

> **Convention:** The standard library's `std::collections::hash_map::DefaultHasher` MUST NOT be used. Its output is explicitly not guaranteed to be stable across Rust compiler versions or platforms.

**Input encoding (forward pass).** The hash input is a fixed-width, little-endian byte sequence constructed by concatenating four integers:

```
input = base_seed.to_le_bytes()       // u64, 8 bytes
     ++ iteration.to_le_bytes()        // u32, 4 bytes
     ++ scenario.to_le_bytes()         // u32, 4 bytes
     ++ stage.to_le_bytes()            // u32, 4 bytes
```

Total input: **20 bytes**. The `++` operator denotes byte-level concatenation (no separators, no length prefixes).

**Input encoding (opening tree).** For opening tree generation (SS2.3), the input replaces `iteration` and `scenario` with a single `opening_index`:

```
input = base_seed.to_le_bytes()       // u64, 8 bytes
     ++ opening_index.to_le_bytes()    // u32, 4 bytes
     ++ stage.to_le_bytes()            // u32, 4 bytes
```

Total input: **16 bytes**.

**Output.** The derived seed is the full 64-bit SipHash-1-3 output. This 64-bit value is used to initialize a `Pcg64` (or equivalent) pseudo-random number generator, which then produces the noise vector $\eta$ for the corresponding tuple.

**Endianness requirement.** Little-endian encoding is **mandatory**. Native byte encoding is not acceptable because it would produce different hash inputs on big-endian and little-endian architectures, breaking cross-platform reproducibility. All integer-to-bytes conversions use explicit `.to_le_bytes()` calls.

**Crate version requirement.** The `siphasher` crate version must be pinned to `1.x` (i.e., `siphasher = "1"` in `Cargo.toml`). The 1.x series provides the `SipHasher13` type and guarantees output stability within the major version. Any future major version upgrade requires verification that hash outputs remain identical for the same inputs, or a migration path for checkpoint compatibility.

### 2.3 Opening Tree

The backward pass in SDDP evaluates an aggregated cut by solving **all** $N_t$ branchings at each stage $t$. These branchings must be identical across all iterations — the backward pass always "sees the same tree." The opening tree is therefore **generated once before training begins** and remains fixed throughout.

The per-stage branching factor $N_t$ comes from `ScenarioSourceConfig.branching_factor` ([Internal Structures SS12.5](../data-model/internal-structures.md)). Uniform branching ($N_t = N$ for all $t$) is the common case in standard SDDP, but per-stage variable branching is supported — this is required for complete tree mode (SS7.2), where the DECOMP special case uses $N_t = 1$ for $t < T$ and $N_T = K$.

**Tree generation:**

1. Before the first SDDP iteration, generate $N_t$ noise vectors per stage $t$, producing a fixed opening tree with total element count $\sum_t N_t \times \text{dim}$
2. Each noise vector is generated from the base seed using deterministic seed derivation per (opening_index, stage) — ensuring reproducibility across restarts and MPI configurations (see SS2.2)
3. Correlation is applied per the active profile for each stage (see SS2.5)

**Backward pass usage:** At each stage $t$, the backward pass iterates over **all** $N_t$ noise vectors, solving one subproblem per opening, then aggregates the resulting cuts. Because the tree is fixed, every iteration produces cuts that refine the same set of future cost scenarios. Note that $N_t$ may vary per stage.

**Forward pass usage (InSample only):** When the `InSample` sampling scheme is active (see SS3.2), the forward pass samples a random index $j \in \{0, \ldots, N_t - 1\}$ at each stage and uses the corresponding noise vector $\eta_{t,j}$ to generate the stage realization. The sampling is a single random integer per stage — no noise generation occurs during the forward pass. Other sampling schemes (`External`, `Historical`) use entirely separate data sources and do **not** access the opening tree; the forward pass noise path is governed by the `SamplingScheme` abstraction (SS3), not by `OpeningTree` directly.

**Memory layout:** The opening tree uses **stage-major ordering** for backward pass locality. At each backward pass stage, all $N_t$ noise vectors are accessed sequentially; stage-major layout places these vectors contiguously in memory, enabling linear prefetch and avoiding large strides across openings:

```
[stage_0_opening_0_entity_0, ..., stage_0_opening_0_entity_E,   ← N_0 openings
 stage_0_opening_1_entity_0, ..., stage_0_opening_1_entity_E,      for stage 0
 ...
 stage_1_opening_0_entity_0, ...,                                ← N_1 openings
 ...                                                                for stage 1
 stage_T_opening_0_entity_0, ..., stage_T_opening_Nt_entity_E]  ← N_T openings
```

**Offset-based access:** The noise vector for `(stage, opening_idx)` occupies the contiguous slice:

```
data[stage_offsets[stage] + opening_idx * dim .. + dim]
```

where `dim` = $N_{\text{entities}}$ (number of random variables per stage) and `stage_offsets[t]` = $\sum_{s=0}^{t-1} N_s \times \text{dim}$ is the cumulative offset for stage $t$. For uniform branching, this reduces to `stage * n_openings * dim + opening_idx * dim`.

Total size: $\sum_t N_t \times \text{dim} \times 8$ bytes. For typical production cases with uniform branching (120 stages $\times$ 200 openings $\times$ 160 hydros = ~30 MB), the entire tree fits in L3 cache. For the reference configuration in [Memory Architecture §2.1](../hpc/memory-architecture.md) (60 stages $\times$ 10 openings $\times$ 160 entities = ~0.8 MB), the tree fits in L2 cache.

### 2.3a OpeningTree Rust Type

The `OpeningTree` struct is the concrete Rust type that holds the pre-generated noise realizations described in SS2.3. It is defined in **cobre-stochastic** and consumed read-only by **cobre-sddp** during the training loop's backward pass ([Training Loop SS6.2](./training-loop.md)).

#### Type Definition

```rust
pub struct OpeningTree {
    /// Flat contiguous storage for all noise values.
    /// Layout: stage-major with variable branching per stage.
    /// Length: sum(openings_per_stage[t] * dim for t in 0..n_stages).
    data: Box<[f64]>,

    /// Cumulative offset array for stage-based indexing.
    /// Length: n_stages + 1.
    /// stage_offsets[t] = sum(openings_per_stage[s] * dim for s in 0..t).
    /// stage_offsets[n_stages] = data.len().
    stage_offsets: Box<[usize]>,

    /// Number of openings (branchings) per stage.
    /// Length: n_stages.
    /// For uniform branching: all entries are equal.
    openings_per_stage: Box<[usize]>,

    /// Number of stages in the planning horizon (T).
    n_stages: usize,

    /// Number of random variables per noise vector.
    dim: usize,
}
```

**Field descriptions:**

| Field                | Type           | Description                                                                                                                                                                        |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`               | `Box<[f64]>`   | Flat contiguous storage. Length = $\sum_t N_t \times \text{dim}$. Heap-allocated, non-resizable after construction.                                                                |
| `stage_offsets`      | `Box<[usize]>` | Cumulative offset array. `stage_offsets[t]` = $\sum_{s=0}^{t-1} N_s \times \text{dim}$. Length = `n_stages + 1`. The sentinel `stage_offsets[n_stages]` = `data.len()`.            |
| `openings_per_stage` | `Box<[usize]>` | Per-stage branching factors $N_t$. Length = `n_stages`. Sourced from `ScenarioSourceConfig.branching_factor` ([Internal Structures SS12.5](../data-model/internal-structures.md)). |
| `n_stages`           | `usize`        | Number of stages $T$ in the planning horizon.                                                                                                                                      |
| `dim`                | `usize`        | Number of random variables (entities) per noise vector $N_{\text{entities}}$.                                                                                                      |

**Why `Box<[f64]>` and not `Vec<f64>`:** The opening tree is allocated once and never resized. `Box<[f64]>` communicates this invariant at the type level — there is no capacity field, no growth path, and no accidental reallocation. The box is created from a `Vec<f64>` via `into_boxed_slice()` after generation completes. The same reasoning applies to `stage_offsets` and `openings_per_stage`.

**Why this layout:**

- `stage_offsets` enables O(1) access to any (stage, opening) pair without iterating
- All openings for a given stage are contiguous — same cache-friendly backward pass pattern as described in SS2.3
- Uniform branching is a degenerate case where all `openings_per_stage` entries are equal and `stage_offsets` is a simple arithmetic progression
- No wasted space: total data length = $\sum_t N_t \times \text{dim}$ exactly

#### Access Method

```rust
impl OpeningTree {
    /// Return the noise vector for the given (stage, opening_idx) pair
    /// as a contiguous `f64` slice of length `self.dim`.
    ///
    /// # Panics
    ///
    /// Panics if `stage >= self.n_stages` or
    /// `opening_idx >= self.openings_per_stage[stage]`.
    pub fn opening(&self, stage: usize, opening_idx: usize) -> &[f64] {
        assert!(stage < self.n_stages);
        assert!(opening_idx < self.openings_per_stage[stage]);
        let offset = self.stage_offsets[stage] + opening_idx * self.dim;
        &self.data[offset..offset + self.dim]
    }

    /// Return the number of openings at the given stage.
    pub fn n_openings(&self, stage: usize) -> usize {
        self.openings_per_stage[stage]
    }

    /// Return the number of stages.
    pub fn n_stages(&self) -> usize { self.n_stages }

    /// Return the dimension (entities per noise vector).
    pub fn dim(&self) -> usize { self.dim }

    /// Return the total number of f64 elements in the backing array.
    pub fn len(&self) -> usize { self.data.len() }

    /// Return the total size in bytes of the backing array.
    pub fn size_bytes(&self) -> usize { self.data.len() * std::mem::size_of::<f64>() }
}
```

Note: `n_openings()` takes a `stage` parameter because the branching factor can vary per stage. For uniform branching, the caller can use `n_openings(0)` or check any stage.

**Backward pass usage pattern** ([Training Loop SS6.2](./training-loop.md)):

```rust
// At stage t, evaluate all openings for trial point x_hat
for j in 0..opening_tree.n_openings(t) {
    let noise: &[f64] = opening_tree.opening(t, j);
    // noise[h] is the correlated noise value for entity h at opening j
    // Compute realized inflows via PAR model, patch LP, solve, extract duals
}
```

The inner loop accesses `n_openings(t)` contiguous blocks of `dim` f64 values, each separated by exactly `dim * 8` bytes. This is the optimal access pattern for hardware prefetchers.

#### Forward/Backward Separation

The `OpeningTree` is the backward pass's primary noise data structure. At every backward pass stage, all $N_t$ openings are evaluated to generate Benders cuts. The forward pass does NOT always use the opening tree — only the `InSample` sampling scheme draws from it (via random index selection into the stage's openings). The `External` and `Historical` schemes use entirely separate data sources (external scenarios, historical records). The forward pass noise path is governed by the `SamplingScheme` abstraction (SS3), not by `OpeningTree` directly.

#### Borrowed View Type

```rust
/// Read-only view over opening tree data, providing offset-based access.
/// Borrows the underlying storage. Used by the training loop; does not
/// own the data.
pub struct OpeningTreeView<'a> {
    data: &'a [f64],
    stage_offsets: &'a [usize],
    openings_per_stage: &'a [usize],
    n_stages: usize,
    dim: usize,
}
```

The `OpeningTreeView` provides the same access API as `OpeningTree` (`opening()`, `n_openings()`, `n_stages()`, `dim()`) but borrows the data instead of owning it. The dual-type design (`OpeningTree` for owned generation, `OpeningTreeView` for borrowed consumption) follows the dual-nature principle established in [Internal Structures SS1.1](../data-model/internal-structures.md): `cobre-stochastic` owns the generation and the `OpeningTree` struct, while `cobre-sddp` consumes it through `OpeningTreeView<'a>` without taking ownership.

### 2.3b Sampling Method and Opening Tree Generation

The `sampling_method` field on each stage in `stages.json` (see [Input Scenarios SS1.8](../data-model/input-scenarios.md)) controls the algorithm used to generate the $N_t$ noise vectors for that stage's opening tree entries (SS2.3). This is **orthogonal** to the `SamplingScheme` abstraction (SS3): `sampling_method` governs _how_ the opening tree is populated with noise vectors; `SamplingScheme` governs _which_ noise source the forward pass uses.

**SAA — the Phase 5 implementation.** For the minimal viable solver, the only implemented `sampling_method` is `"saa"` (Sample Average Approximation): uniform Monte Carlo random sampling from the RNG seeded by the deterministic seed function (SS2.2a). Each noise vector component $z_i$ is drawn as an independent standard normal $\mathcal{N}(0,1)$, then transformed by the Cholesky correlation factor (SS2.1) to produce the correlated noise vector $\eta$. SAA is the default when `sampling_method` is `"saa"` or omitted from the stage definition.

**Summary of sampling methods:**

| Method       | Description                                                               | Phase 5 Status |
| ------------ | ------------------------------------------------------------------------- | -------------- |
| `saa`        | Sample Average Approximation — uniform Monte Carlo from seeded RNG        | Implemented    |
| `lhs`        | Latin Hypercube Sampling — stratified, uniform marginal coverage          | Deferred       |
| `qmc_sobol`  | Quasi-Monte Carlo (Sobol sequences) — low-discrepancy deterministic-like  | Deferred       |
| `qmc_halton` | Quasi-Monte Carlo (Halton sequences) — alternative low-discrepancy method | Deferred       |
| `selective`  | Selective/Representative Sampling — clustering on historical data         | Deferred       |

The deferred methods (`lhs`, `qmc_sobol`, `qmc_halton`, `selective`) are listed in [Deferred Features](../deferred.md) and are not implemented in Phase 5.

**Per-stage variation.** The `sampling_method` field can vary per stage (as permitted by [Input Scenarios SS1.8](../data-model/input-scenarios.md)), enabling mixed strategies in a single run. The minimal viable solver uses uniform SAA across all stages; per-stage method variation is a deferred capability.

### 2.4 Time-Varying Correlation Profiles

The correlation structure can vary across stages via the **profile + schedule** pattern defined in [Input Scenarios SS5.3](../data-model/input-scenarios.md):

- **Profiles** — Named correlation configurations (e.g., `"default"`, `"wet_season"`, `"dry_season"`), each defining correlation groups and matrices
- **Schedule** — An optional array embedded in `correlation.json` that maps specific `stage_id` values to profile names. Stages not listed use the `"default"` profile.

During preprocessing, the Cholesky decomposition is computed **once per profile** (not per stage). At runtime, the scenario generator looks up the active profile for the current stage via the schedule and uses its pre-computed Cholesky factor.

## 3. Sampling Scheme Abstraction

### 3.1 Three Orthogonal Concerns

The SDDP algorithm has three independently configurable concerns that govern how scenarios are handled during training. Cobre formalizes these as distinct abstractions, following the design established by SDDP.jl:

| Concern                                              | Abstraction            | What It Controls                 | Default    |
| ---------------------------------------------------- | ---------------------- | -------------------------------- | ---------- |
| Which noise is selected at each forward pass stage   | **Sampling Scheme**    | Forward scenario selection       | `InSample` |
| Which LP model is solved in the forward pass         | **Forward Pass Model** | Training LP vs alternative model | `Default`  |
| Which noise terms are evaluated in the backward pass | **Backward Sampling**  | Branching completeness           | `Complete` |

These three concerns are **orthogonal** — each can be configured independently without affecting the others. The forward pass model and backward sampling are fixed in the initial implementation (Default and Complete respectively), with alternatives deferred. The sampling scheme is the primary configurable dimension.

**Forward and backward noise source separation** is a natural consequence of this design: the sampling scheme controls the forward pass noise source, while backward sampling always draws from the fixed opening tree (SS2.3). These two sources may differ — for example, the forward pass may sample from external scenarios while the backward pass evaluates all openings generated from a PAR model fitted to those scenarios.

### 3.2 Forward Sampling Schemes

The sampling scheme determines how the forward pass selects a scenario realization at each stage. Cobre supports three sampling schemes:

#### InSample (Default)

At each stage $t$, sample a random index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ and use the corresponding noise vector $\eta_{t,j}$ from the fixed opening tree (SS2.3). The noise values are injected into the stage LP by fixing the noise variable $\varepsilon$ via `patch_row_bounds` on the AR dynamics constraint row (see [Training Loop SS4.2a](./training-loop.md)). The PAR model dynamics equation is already embedded in the LP as a constraint ([LP Formulation SS5a](../math/lp-formulation.md)); the solver evaluates the inflow realization implicitly when it solves the LP with the fixed noise.

- **Noise source**: Opening tree (same as backward pass)
- **Realization computation**: LP solve with noise epsilon fixed via `patch_row_bounds` on the AR dynamics constraint row
- **Use case**: Standard SDDP training — forward and backward passes see the same noise distribution

This is SDDP.jl's `InSampleMonteCarlo`: the forward pass samples from the same noise terms defined in the model.

#### External

The forward pass draws from user-provided scenario data (`external_scenarios.parquet`). At each stage $t$, select a scenario from the external set — either by random sampling or by sequential iteration through the external scenarios.

- **Noise source**: External scenario values (not the opening tree)
- **Realization computation**: The external scenario provides inflow values, but these are **not used directly as LP inputs**. The SDDP LP formulation includes the AR dynamics equation as a constraint, with inflow lags and the current-stage noise term as variables fixed via fixing constraints. Therefore, external inflow values must always be **inverted to noise terms** (ε) before they can be used in the LP. This noise inversion is described in SS4.3.
- **Backward pass interaction**: The backward pass still uses the fixed opening tree. When external scenarios are the forward source, the opening tree noise is generated from a **PAR model fitted to the external data**, ensuring the backward branchings reflect the statistical properties of the external scenarios (see SS4.2)
- **Use case**: Training with historical data, imported Monte Carlo scenarios, or stress-test scenarios

This corresponds to SDDP.jl's `OutOfSampleMonteCarlo`: the forward pass uses noise terms different from those defined in the model.

The selection mode within the external set is configured via `selection_mode`:

| Mode         | Behavior                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| `random`     | Sample uniformly from the external scenario set (with replacement). Default. |
| `sequential` | Iterate through external scenarios in order, cycling when exhausted.         |

#### Historical

Replay actual historical inflow sequences mapped to stages via `season_definitions`. The forward pass deterministically follows historical data in order, cycling through available years when the number of forward passes exceeds the historical record.

- **Noise source**: Historical inflow values (mapped from `inflow_history.parquet` to stage structure)
- **Realization computation**: Like external scenarios, historical inflow values must be **inverted to noise terms** (ε) before use in the LP. The same noise inversion procedure applies (see SS4.3).
- **Backward pass interaction**: Same as External — the backward pass uses a PAR model fitted to the historical data
- **Use case**: Policy validation against observed conditions, historical replay analysis

This corresponds to SDDP.jl's `Historical` sampling scheme.

### 3.3 Forward Pass Model

The forward pass model determines which LP is solved at each stage during the forward pass. Cobre implements one model:

- **Default** — Solve the training LP (the convex LP used for cut generation) with the scenario realization from the sampling scheme. This is the standard SDDP forward pass.

An **Alternative Forward Pass** model — solving a different LP (e.g., with simulation-only features like linearized head or unit commitment) to generate trial points, while keeping the training LP for cut generation — is deferred. See [Deferred Features SSC.13](../deferred.md).

### 3.4 Backward Sampling

The backward sampling scheme determines which noise terms are evaluated at each stage during the backward pass. Cobre implements one scheme:

- **Complete** — Evaluate **all** $N_{\text{openings}}$ noise vectors from the fixed opening tree. This is the standard SDDP backward pass that guarantees proper cut generation by considering every branching.

A **MonteCarlo(n)** backward sampling scheme — sampling $n$ openings with replacement instead of evaluating all — is deferred. See [Deferred Features SSC.14](../deferred.md).

### 3.5 Configuration

The sampling scheme is configured in `stages.json` via the `scenario_source` object. See [Input Scenarios SS2.1](../data-model/input-scenarios.md) for the full schema.

**Summary of scheme-to-config mapping:**

| Sampling Scheme | `scenario_source` config                                        | Required inputs                                 |
| --------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| InSample        | `{ "sampling_scheme": "in_sample", "seed": 42 }`                | Uncertainty models (SS1) or inflow history       |
| External        | `{ "sampling_scheme": "external", "selection_mode": "random" }` | `external_scenarios.parquet`                    |
| Historical      | `{ "sampling_scheme": "historical" }`                           | `inflow_history.parquet` + `season_definitions` |

## 4. External Scenario Integration

### 4.1 External Scenario Sources

Cobre supports external (deterministic) scenarios as an alternative forward pass noise source. External scenarios can drive the forward pass in **both training and simulation**.

| Use Case           | Description                                |
| ------------------ | ------------------------------------------ |
| Historical replay  | Use actual historical inflows              |
| Monte Carlo import | Pre-generated scenarios from external tool |
| Stress testing     | Specific drought/flood scenarios           |

**Input file**: `scenarios/external_scenarios.parquet` with columns `(stage_id, scenario_id, hydro_id, value_m3s)`. See [Input Scenarios SS2.5](../data-model/input-scenarios.md).

### 4.2 Backward Pass with External Forward Scenarios

When the `External` or `Historical` sampling scheme is active during training, the forward and backward passes use **different noise sources**. The backward pass still requires proper probabilistic branchings for valid cut generation, so the opening tree noise must reflect the statistical properties of the external data.

The lifecycle is:

1. **PAR fitting** — Fit a PAR model to the external scenario data (or historical inflow data), treating the external values as a synthetic history. The fitting follows the same procedure as SS1.4: seasonal statistics and AR coefficients are estimated from the external data.
2. **Opening tree generation** — Generate the fixed opening tree (SS2.3) using noise from the fitted PAR model. The branchings reflect the distributional characteristics of the external scenarios.
3. **Training** — Forward pass samples from external data; backward pass evaluates all openings from the PAR-fitted tree.

**Rationale:** Using external scenarios directly in the backward pass would violate SDDP's requirement for proper probabilistic branchings. By fitting a PAR model to the external data, the backward pass preserves the statistical signature of the scenarios while producing valid cuts.

### 4.3 Noise Inversion for External Scenarios

When using external scenarios, Cobre must compute the **implied noise values** that would have generated those inflows under the PAR model. This is required because the backward pass needs noise values to construct the appropriate RHS perturbations for cut generation.

Given target inflow $a_t^{\text{target}}$ at stage $t$ for hydro $h$ with season $m$:

$$
\eta_t = \frac{a_t^{\text{target}} - \phi_m - \sum_{\ell=1}^{P} \psi_{m,\ell} \cdot a_{t-\ell}}{\sigma_m}
$$

where $\phi_m = \mu_m - \sum_{\ell=1}^{P} \psi_{m,\ell} \cdot \mu_{m-\ell}$ is the precomputed base value.

All quantities ($\mu_m$, $\psi_{m,\ell}$, $\sigma_m$) are in their respective units as described in [PAR(p) Inflow Model SS2-3](../math/par-inflow-model.md). The AR coefficients are in original units; $\sigma_m$ is the derived residual std.

The inversion proceeds **sequentially through stages** (each stage updates the lag buffer for the next):

1. Initialize lag buffer from historical inflows or initial conditions
2. For each stage $t$: compute the deterministic PAR component, solve for $\eta_t$, update the lag buffer with $a_t^{\text{target}}$
3. Validate the inverted noise:
   - **Warning** if $|\eta_t| > 4.0$ (extreme noise suggests the external scenario deviates significantly from the PAR model)
   - **Error** if $\sigma_m \approx 0$ but the residual $a_t^{\text{target}} - \text{deterministic component}$ exceeds a tolerance (the PAR model says this series is deterministic, but the external scenario disagrees)

After inversion, a JSON validation report is emitted with noise statistics (mean, std, min, max, extreme count), warnings, and an overall status.

**Critical**: If AR order mismatches between the PAR model and a warm-start policy, noise inversion produces incorrect values. This is validated during policy loading (see [Validation Architecture SS2.5b](./validation-architecture.md)).

### 4.4 External Scenarios in Simulation

When the `External` sampling scheme is active during simulation, the forward pass returns inflow values directly from the pre-loaded data — no stochastic computation occurs. The forward pass iterates through the external scenarios deterministically using `sequential` selection mode.

## 5. Scenario Memory Layout

### 5.1 Memory Organization

Scenario data uses **scenario-major ordering** optimized for the forward pass access pattern:

```
Access Pattern in Forward Pass:
  - Outer loop: scenarios (parallel across threads)
  - Inner loop: stages (sequential within scenario)
  - Innermost: entities (sequential within stage)

Layout: [S0_T0_H0] [S0_T0_H1] ... [S0_TT_HN] [S1_T0_H0] ... [SS_TT_HN]
```

**Benefits:**

- Each thread accesses contiguous memory for its assigned scenarios
- No false sharing between threads (each thread's scenarios are in separate memory regions)
- Predictable prefetching within the stage sequence

**Size estimate (production scale):** 200 scenarios × 120 stages × 160 hydros × 8 bytes = ~30 MB for inflows. Total per rank (including loads): ~50 MB, which fits in L3 cache per NUMA domain.

**Backward pass consideration:** The backward pass iterates over stages in reverse, accessing all scenarios at a given stage. With scenario-major layout, this accesses non-contiguous memory (stride = `n_stages × n_entities`). This is acceptable because: (a) the noise cache is relatively small and fits in L3, (b) the alternative (stage-major layout) would penalize the more latency-sensitive forward pass, and (c) the backward pass LP reuses basis and warm-starts from the previous opening solution, changing only the noise terms — so memory access latency is unlikely to be the bottleneck, though this should be validated with profiling once the solver is operational.

### 5.2 Two-Level Work Distribution

Cobre distributes scenario work across two levels: **MPI ranks** (inter-node / inter-NUMA) and **threads** (intra-rank).

**MPI rank level — deterministic distribution.** Scenarios are assigned to MPI ranks as evenly as possible. If `S` total scenarios are distributed across `R` ranks, the first `S mod R` ranks receive `⌈S/R⌉` scenarios and the remaining ranks receive `⌊S/R⌋`. The distribution is deterministic and based solely on rank index and total scenario count. Each rank stores only its assigned scenarios in memory. MPI gather operations use the per-rank counts and displacements to collect results (e.g., for upper bound evaluation or output aggregation).

**Thread level — dynamic work-stealing.** Within each rank, the assigned scenarios are processed by a thread pool using dynamic work-stealing scheduling. This is critical because **per-scenario processing costs are not uniform** — iteration counts for LP convergence vary depending on the noise realization, active constraints, and warm-start quality. Dynamic work-stealing at the thread level absorbs this variability without requiring inter-rank communication.

**Deployment strategy.** The shared-memory architecture favors **fewer MPI ranks with more threads per rank** — typically one rank per NUMA domain (or per node). This minimizes MPI communication overhead while maximizing the benefit of thread-level dynamic scheduling and shared L3 cache for scenario data (see SS5.1).

### 5.3 NUMA-Aware Allocation

On NUMA architectures, scenario data is allocated with **first-touch policy** awareness. Each thread initializes (writes to) its portion of the scenario array during allocation, ensuring that the OS places those pages on the NUMA domain local to the thread's CPU. This avoids remote memory access during the forward pass.

## 6. Load Scenario Generation

### 6.1 Load Uncertainty Model

When `load_seasonal_stats.parquet` is provided, the system generates stochastic load realizations per (bus, stage) using the stored mean and standard deviation. Load models are typically **independent** (no AR structure) — each load realization is drawn as:

$$
d_{b,t} = \mu_{b,t}^{\text{load}} + s_{b,t}^{\text{load}} \cdot \eta_{b,t}^{\text{load}}
$$

where $\eta_{b,t}^{\text{load}} \sim N(0,1)$ is an independent noise term. See [Input Scenarios SS3.3](../data-model/input-scenarios.md).

When `load_seasonal_stats.parquet` is absent, loads are treated as deterministic (taken from the demand values in the entity definitions).

### 6.2 Block Load Factors

The base load realization $d_{b,t}$ is a **stage-level** value in MW. Block-level loads are obtained by applying **multiplicative block factors**:

$$
d_{b,t,k} = d_{b,t} \cdot f_{b,t,k}
$$

where $f_{b,t,k}$ is the block factor from `load_factors.json`. If `load_factors.json` is absent, all block factors default to 1.0. See [Input Scenarios SS4](../data-model/input-scenarios.md).

### 6.3 Load Correlation

If load entities are included in correlation groups defined in `correlation.json`, their noise terms are correlated with inflow noise via the same Cholesky transform described in SS2.1. Otherwise, load noise is independent of inflow noise.

## 7. Complete Tree Mode

### 7.1 Concept

In addition to standard SDDP sampling, Cobre supports a **complete tree** execution mode where the solver explores an explicit scenario tree — every branching at every stage is visited, with no sampling. This is the approach used by CEPEL's DECOMP model for short-term hydrothermal dispatch.

In standard SDDP, the forward pass samples one branching per stage, so only a fraction of the scenario tree is explored per iteration. In complete tree mode, the full tree is enumerated, and each node corresponds to a deterministic subproblem. The Benders decomposition is still applied — cuts propagate backward through the tree — but there is no stochastic sampling; the solution is exact for the given tree.

### 7.2 Tree Structure

The scenario tree is defined by per-stage branching counts $N_t$ for $t = 1, \ldots, T$:

- **Total nodes at stage $t$**: $\prod_{s=1}^{t} N_s$
- **Total leaf nodes**: $\prod_{t=1}^{T} N_t$
- **Total tree nodes**: $\sum_{t=1}^{T} \prod_{s=1}^{t} N_s$

Each node at stage $t$ has $N_t$ children, each corresponding to a distinct realization (noise vector or external scenario value). The branchings at each stage are drawn from the opening tree (SS2.3), so $N_t = N_{\text{openings}}$ when using uniform branching, or the tree can have variable branching factors per stage.

**DECOMP special case:** $N_t = 1$ for all stages except the last ($t = T$), where $N_T$ equals the number of external scenario branchings. This produces a deterministic trunk with branching only at the final stage — a common structure for weekly/monthly short-term planning where uncertainty is resolved at the end of the horizon.

```
DECOMP Special Case (N_t = 1 for t < T, N_T branchings at last stage):

Stage:  1        2        3        ...      T
        ●────────●────────●── ... ──●───────● branch 1
                                    ├───────● branch 2
                                    ├───────● branch 3
                                    └───────● branch N_T

General Case (N_t branchings per stage):

Stage:  1             2                  3
        ●─────────────●─────────────────●
        │             ├─────────────────●
        │             └─────────────────●
        ├─────────────●─────────────────●
        │             ├─────────────────●
        │             └─────────────────●
        └─────────────●─────────────────●
                      ├─────────────────●
                      └─────────────────●

Total nodes at stage 3: N_1 × N_2 × N_3
```

### 7.3 Relationship to SDDP with External Scenarios

Complete tree mode is closely related to standard SDDP with external scenarios. Consider the case where:

- External scenarios are used in training (SS3.2 External scheme)
- $N_{\text{forward\_passes}} = N_{\text{openings}}$ at the last stage
- All branchings at the last stage are visited exactly once (no repetition)

This configuration approaches a complete tree solution for the last stage. The key difference is that standard SDDP sampling may repeat or skip branchings, while complete tree mode guarantees exhaustive coverage.

To bridge the two modes, the forward pass can be configured to **force exhaustive visitation** — cycling through all branching indices without replacement rather than sampling with replacement. When combined with a single forward pass per branching at the final stage, this degenerates exactly into the complete tree for the DECOMP special case.

### 7.4 Scope and Limitations

Complete tree mode is feasible only when the total number of tree nodes is computationally tractable. For a 5-stage problem with 20 branchings per stage, the tree has $20^5 = 3.2$ million leaf nodes — each requiring an LP solve. Production-scale SDDP problems (60-120 stages) make full trees intractable; the mode is intended for:

- Short-horizon problems (5-12 stages, weekly resolution)
- DECOMP-like configurations with deterministic trunks and branching only at specific stages
- Validation and benchmarking against SDDP solutions on small instances

The solver integration for complete tree mode (tree enumeration, node-to-subproblem mapping, result aggregation) is documented in [Deferred Features SSC.12](../deferred.md).

## Cross-References

- [PAR(p) Inflow Model](../math/par-inflow-model.md) — Mathematical definition, parameter set, stored vs. computed quantities, fitting procedure, validation invariants
- [Inflow Non-Negativity](../math/inflow-nonnegativity.md) — Handling of negative inflow realizations from PAR sampling
- [SDDP Algorithm](../math/sddp-algorithm.md) — Forward/backward pass structure, cut generation, convergence; references sampling scheme abstraction (SS3.1-SS3.2)
- [Input Scenarios](../data-model/input-scenarios.md) — Data model for seasonal stats (SS3.1), AR coefficients (SS3.2), load stats (SS3.3), load factors (SS4), correlation (SS5), external scenarios (SS2.5), scenario_source schema (SS2.1)
- [Input System Entities](../data-model/input-system-entities.md) — Hydro and bus entity definitions referenced by scenario data
- [Validation Architecture](./validation-architecture.md) — PAR validation rules (SS2.5, PAR Inflow Model domain), warm-start AR compatibility (SS2.5b)
- [Input Loading Pipeline](./input-loading-pipeline.md) — How scenario input files are loaded and validated
- [CLI and Lifecycle](./cli-and-lifecycle.md) — Scenario generation phase within the execution lifecycle
- [Training Loop](./training-loop.md) — How the training loop consumes sampling scheme configuration
- [Memory Architecture](../hpc/memory-architecture.md) — Per-rank memory budget tracking for opening tree and scenario data (§2.1)
- [Deferred Features SSC.11](../deferred.md) — User-supplied noise openings (pre-sampled, pre-correlated)
- [Deferred Features SSC.12](../deferred.md) — Complete tree solver integration (DECOMP-like)
- [Deferred Features SSC.13](../deferred.md) — Alternative forward pass model
- [Deferred Features SSC.14](../deferred.md) — Monte Carlo backward sampling
