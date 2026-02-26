# Report 003 -- cobre-stochastic API Surface Completeness Audit

**Crate**: cobre-stochastic
**Phase**: 5 (Scenario Generation, parallelizable with Phases 3-4)
**Auditor**: sddp-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

| Item Name                       | Category      | Spec File                  | Section      | Status   | Notes                                                                                                                                                                                                          |
| ------------------------------- | ------------- | -------------------------- | ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrecomputedPar`                | Struct        | `scenario-generation.md`   | SS1.2, SS1.3 | MISSING  | Preprocessing pipeline output fully described (4 contiguous arrays: `base`, `coefficients`, `scales`, `orders`) with dimensions and layout, but no Rust struct definition. GAP-022 identifies this explicitly. |
| Opening tree type               | Struct        | `scenario-generation.md`   | SS2.3        | MISSING  | Shape `(T x N_openings x N_entities)`, opening-major layout, and memory estimate documented, but no Rust type, accessor methods, or ownership model defined. GAP-023 identifies this explicitly.               |
| `SamplingScheme`                | Enum          | `sampling-scheme-trait.md` | SS1          | COMPLETE | Full Rust enum definition with 3 variants (`InSample`, `External`, `Historical`), doc comments, and field types.                                                                                               |
| `SamplingSchemeConfig`          | Enum          | `sampling-scheme-trait.md` | SS3.1        | COMPLETE | Full Rust enum with serde derives, `#[serde(tag = "sampling_scheme", rename_all = "snake_case")]`, and default function for `selection_mode`.                                                                  |
| `SelectionMode`                 | Enum          | `sampling-scheme-trait.md` | SS3.2        | COMPLETE | Full Rust enum with `Random` and `Sequential` variants, serde derives, doc comments.                                                                                                                           |
| `NoiseVector`                   | Struct        | `sampling-scheme-trait.md` | SS3.3        | COMPLETE | Full Rust struct definition: `pub values: Vec<f64>`. Entity ordering contract documented.                                                                                                                      |
| `BackwardTreeSource`            | Enum          | `sampling-scheme-trait.md` | SS2.3        | COMPLETE | Full Rust enum with 3 variants (`UserProvidedPAR`, `FittedToExternalData`, `FittedToHistoricalData`), derives `Debug, Clone, Copy, PartialEq, Eq`.                                                             |
| `SamplingSchemeValidationError` | Enum          | `sampling-scheme-trait.md` | SS6          | COMPLETE | Full Rust enum with 4 variants (`MissingSeed`, `MissingExternalScenarioFile`, `MissingHistoricalInflowFile`, `InvalidSelectionMode`), all fields typed.                                                        |
| `ExternalScenarioData`          | Opaque handle | `sampling-scheme-trait.md` | SS1          | PARTIAL  | Referenced as a field type in `SamplingScheme::External` but described as an "opaque handle" with no struct definition.                                                                                        |
| `HistoricalInflowData`          | Opaque handle | `sampling-scheme-trait.md` | SS1          | PARTIAL  | Referenced as a field type in `SamplingScheme::Historical` but described as an "opaque handle" with no struct definition.                                                                                      |
| Cholesky factor storage type    | Struct        | `scenario-generation.md`   | SS2.1, SS2.4 | MISSING  | Cholesky decomposition per profile described conceptually. No Rust type for storing the lower-triangular factor $L$. No matrix library dependency specified (nalgebra, ndarray, flat `Vec<f64>`).              |
| Correlation profile/schedule    | Struct        | `scenario-generation.md`   | SS2.4        | PARTIAL  | Profile-based time-varying correlation documented with schedule semantics. `CorrelationModel` referenced in `internal-structures.md` SS14 as a `System` field but has no Rust struct definition.               |
| Seed derivation types           | Type          | `scenario-generation.md`   | SS2.2a       | PARTIAL  | Input encoding (20-byte forward, 16-byte opening tree) and output (u64) fully specified. `SipHasher13` type named. No Rust function signature or newtype wrapper for the derived seed.                         |
| `StageRng`                      | Type          | `sampling-scheme-trait.md` | SS2.1        | MISSING  | Used as a parameter type in `sample_forward(&self, ..., rng: &mut StageRng)` but never defined. Is this `Pcg64`? A newtype? A trait alias?                                                                     |
| Scenario workspace types        | Struct        | `scenario-generation.md`   | SS5.1, SS5.2 | MISSING  | Scenario memory layout (scenario-major ordering), two-level work distribution, and NUMA-aware allocation are all documented, but no Rust types for scenario buffers or workspace allocation are specified.     |

### 1.2 Public Functions

| Item Name                       | Category | Spec File                  | Section | Status   | Notes                                                                                                                                                                                                                                                 |
| ------------------------------- | -------- | -------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| PAR preprocessing function      | Function | `scenario-generation.md`   | SS1.2   | PARTIAL  | Four-step pipeline fully described (load, compute residual std, precompute deterministic components, initialize lag state). No Rust function signature. GAP-022 recommends: `fn precompute_par(system: &System, stages: &[Stage]) -> PrecomputedPar`. |
| Residual std computation        | Function | `par-inflow-model.md`      | SS3     | COMPLETE | Mathematical formula fully specified: $\sigma_m = s_m \sqrt{1 - \sum_\ell \psi_{m,\ell}^* \cdot \hat{\rho}_m(\ell)}$. Reverse-standardization formula for $\psi^*_{m,\ell}$ also complete. No Rust signature but the math is unambiguous.             |
| Cholesky factorization function | Function | `scenario-generation.md`   | SS2.1   | PARTIAL  | Described as "Pre-decompose the correlation matrix $\Sigma = LL^T$ during preprocessing." No Rust function signature. No specification of whether this uses a library (e.g., nalgebra) or a custom implementation.                                    |
| Opening tree construction       | Function | `scenario-generation.md`   | SS2.3   | PARTIAL  | Three-step algorithm documented (generate N_openings noise vectors per stage, apply correlation, store in opening-major order). Seed derivation per `(opening_index, stage)` specified. No Rust function signature.                                   |
| `sample_forward`                | Method   | `sampling-scheme-trait.md` | SS2.1   | COMPLETE | Full Rust method signature: `pub fn sample_forward(&self, stage_id: usize, scenario_index: usize, rng: &mut StageRng) -> NoiseVector`. Precondition and postcondition tables provided. Infallibility citation present.                                |
| `requires_noise_inversion`      | Method   | `sampling-scheme-trait.md` | SS2.2   | COMPLETE | Full Rust implementation provided with `match` body. Preconditions (none) and postconditions documented.                                                                                                                                              |
| `backward_tree_source`          | Method   | `sampling-scheme-trait.md` | SS2.3   | COMPLETE | Full Rust implementation provided with `match` body returning `BackwardTreeSource` variants.                                                                                                                                                          |
| Seed derivation function        | Function | `scenario-generation.md`   | SS2.2a  | PARTIAL  | Algorithm fully specified (SipHash-1-3, input encoding, endianness, crate version). No Rust function signature, but the specification is detailed enough to implement directly. See F-003 for residual ambiguity.                                     |
| PAR model fitting (Yule-Walker) | Function | `scenario-generation.md`   | SS1.4   | PARTIAL  | Six-step procedure outlined (season extraction, seasonal statistics, standardization, order selection, Yule-Walker solution, back-transform). Mathematical derivation in `par-inflow-model.md` SS5 is thorough. No Rust function signature.           |
| Noise inversion                 | Function | `scenario-generation.md`   | SS4.3   | COMPLETE | Formula fully specified: $\eta_t = (a_t^{\text{target}} - \phi_m - \sum_\ell \psi_{m,\ell} \cdot a_{t-\ell}) / \sigma_m$. Sequential procedure with lag buffer update documented. Validation checks (warning if $                                     | \eta_t | > 4.0$, error if $\sigma_m \approx 0$) documented. |
| Inflow evaluation (runtime)     | Function | `scenario-generation.md`   | SS1.3   | COMPLETE | Formula: $a_{h,t} = \text{base}[h][t] + \sum_\ell \text{coeff}[h][t][\ell] \cdot a_{h,t-\ell} + \text{scale}[h][t] \cdot \eta$. GAP-022 recommends: `fn evaluate(&self, stage: usize, hydro: usize, lags: &[f64], noise: f64) -> f64`.                |
| Load scenario generation        | Function | `scenario-generation.md`   | SS6.1   | COMPLETE | Formula: $d_{b,t} = \mu^{\text{load}}_{b,t} + s^{\text{load}}_{b,t} \cdot \eta^{\text{load}}_{b,t}$. Block factor application documented in SS6.2.                                                                                                    |

### 1.3 Error Types

| Item Name                       | Category      | Spec File                  | Section | Status   | Notes                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------- | -------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SamplingSchemeValidationError` | Enum          | `sampling-scheme-trait.md` | SS6     | COMPLETE | 4 variants covering rules S1-S4, all fields typed with structured diagnostics.                                                                                                                                                                               |
| Cholesky factorization failure  | Error         | `scenario-generation.md`   | SS2.1   | MISSING  | Cholesky decomposition fails when the correlation matrix is not positive definite. The validation invariant "Correlation matrix PSD" is in `par-inflow-model.md` SS6 and `scenario-generation.md` SS1.4, but no Rust error type is defined for this failure. |
| PAR fitting validation errors   | Error         | `scenario-generation.md`   | SS1.4   | PARTIAL  | Five validation checks documented (positive residual variance, PAR stability, correlation matrix PSD, no systematic bias, AR order consistency) with severity levels (Error/Warning). No Rust error type defined.                                            |
| Noise inversion validation      | Error/Warning | `scenario-generation.md`   | SS4.3   | PARTIAL  | Two validation conditions documented: warning if $                                                                                                                                                                                                           | \eta_t | > 4.0$, error if $\sigma_m \approx 0$ with non-negligible residual. JSON validation report mentioned but no Rust type specified for the report or the error. |

### 1.4 Trait Implementations

| Item Name                            | Category    | Spec File                  | Section | Status   | Notes                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SamplingScheme` enum dispatch       | Dispatch    | `sampling-scheme-trait.md` | SS4     | COMPLETE | Enum dispatch chosen. Rationale for rejecting `Box<dyn Trait>` and compile-time monomorphization documented. Performance analysis (23,000 match dispatches/iteration, dominated by LP solve cost) provided. |
| `SamplingSchemeConfig` serde derives | Derive      | `sampling-scheme-trait.md` | SS3.1   | COMPLETE | `#[derive(Debug, Clone, Deserialize)]` with `#[serde(tag = "sampling_scheme", rename_all = "snake_case")]` specified.                                                                                       |
| `BackwardTreeSource` derives         | Derive      | `sampling-scheme-trait.md` | SS2.3   | COMPLETE | `#[derive(Debug, Clone, Copy, PartialEq, Eq)]` specified.                                                                                                                                                   |
| `NoiseVector` derives                | Derive      | `sampling-scheme-trait.md` | SS3.3   | MISSING  | No derive macros specified for `NoiseVector`. Likely needs at least `Debug, Clone`.                                                                                                                         |
| `Send + Sync` for opening tree       | Trait bound | `scenario-generation.md`   | SS2.3   | PARTIAL  | GAP-023 recommends shared read-only via `Arc` or `SharedRegion`, implying `Send + Sync`, but the trait bounds are not explicitly stated in any spec.                                                        |

### 1.5 Crate Boundary Interactions

| Boundary                                          | Consumer Spec                    | Status   | Notes                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-core -> cobre-stochastic (PAR models)       | `internal-structures.md` SS14    | PARTIAL  | `System.par_models: Vec<ParModel>` is the source. `ParModel` has fields listed (mean_m3s, std_m3s, ar_order, coefficients) but no Rust struct definition (reported in report-001 F-006). cobre-stochastic consumes these to build `PrecomputedPar`, but no consuming function signature exists. |
| cobre-core -> cobre-stochastic (Correlation)      | `internal-structures.md` SS14    | PARTIAL  | `System.correlation: CorrelationModel` is the source. Fields documented (profiles, groups, Cholesky-decomposed matrices, schedule) but no Rust struct. cobre-stochastic uses the Cholesky factors at runtime.                                                                                   |
| cobre-stochastic -> cobre-sddp (opening tree)     | `scenario-generation.md` SS2.3   | PARTIAL  | The backward pass in cobre-sddp iterates over all openings per stage. The opening tree is produced by cobre-stochastic and consumed by cobre-sddp, but no shared type or interface is defined. GAP-023 directly addresses this.                                                                 |
| cobre-stochastic -> cobre-sddp (forward sampling) | `sampling-scheme-trait.md` SS2.1 | COMPLETE | `sample_forward` method signature is fully specified. The training loop calls this at each stage. `NoiseVector` is the return type.                                                                                                                                                             |
| cobre-stochastic -> cobre-sddp (noise inversion)  | `scenario-generation.md` SS4.3   | PARTIAL  | Noise inversion is required for External/Historical sampling. The formula and procedure are specified, but no function signature exists for the cobre-sddp training loop to call.                                                                                                               |
| Input files -> cobre-stochastic (Parquet schemas) | `input-scenarios.md` SS3.1-3.2   | COMPLETE | Parquet column schemas for `inflow_seasonal_stats.parquet` (5 columns) and `inflow_ar_coefficients.parquet` (4 columns) fully specified with types.                                                                                                                                             |
| Input files -> cobre-stochastic (correlation)     | `input-scenarios.md` SS5         | COMPLETE | `correlation.json` schema fully specified with profile-based structure, entity references, matrix format, and schedule.                                                                                                                                                                         |

---

## 2. Category Summaries

| Category                    | COMPLETE | PARTIAL | MISSING | Total  |
| --------------------------- | -------- | ------- | ------- | ------ |
| Public Types                | 6        | 4       | 5       | 15     |
| Public Functions            | 6        | 5       | 0       | 11     |
| Error Types                 | 1        | 2       | 1       | 4      |
| Trait Implementations       | 3        | 1       | 1       | 5      |
| Crate Boundary Interactions | 3        | 4       | 0       | 7      |
| **Total**                   | **19**   | **16**  | **7**   | **42** |

---

## 3. Findings

### F-001: `PrecomputedPar` struct not defined (GAP-022)

**Severity**: High
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS1.3 specifies the memory layout:

> "The precomputed PAR data uses struct-of-arrays layout for cache efficiency. All arrays are row-major with stage as the outer dimension, so that sequential stage iteration within a scenario touches contiguous memory."

And the four arrays are defined in a table:

> | Array          | Dimensions              | Layout                  | Description                                |
> | -------------- | ----------------------- | ----------------------- | ------------------------------------------ |
> | `base`         | T x N_hydro             | Row-major (stage outer) | Deterministic component per (stage, hydro) |
> | `coefficients` | T x N_hydro x max_order | Row-major               | AR coefficients per (stage, hydro, lag)    |
> | `scales`       | T x N_hydro             | Row-major               | Residual std $\sigma$ per (stage, hydro)   |
> | `orders`       | N_hydro                 | Flat                    | AR order per hydro                         |

`src/specs/overview/spec-gap-inventory.md` GAP-022 states:

> "The PAR preprocessing pipeline produces contiguous arrays (`base`, `coefficients`, `scales`, `orders`) but the concrete Rust types that hold these arrays are unspecified. Is this a single struct? Multiple arrays? Does it own the data or borrow from cobre-core? This is the primary data structure that cobre-stochastic exposes to cobre-sddp."

GAP-022 resolution path recommends:

> "Define a `PrecomputedPar` struct with owned contiguous arrays. Specify the public constructor `fn precompute_par(system: &System, stages: &[Stage]) -> PrecomputedPar` and the runtime evaluation method `fn evaluate(&self, stage: usize, hydro: usize, lags: &[f64], noise: f64) -> f64`."

GAP-022 remains **open** (status: Medium, no "Resolved" prefix).

**Impact**: `PrecomputedPar` is the primary data structure that cobre-stochastic exposes to cobre-sddp. Without a concrete Rust type, the crate boundary is undefined. An implementer must decide on ownership (owned vs. borrowed), storage (flat `Vec<f64>` with manual indexing vs. ndarray), and the public interface (direct field access vs. accessor methods). The struct-of-arrays layout is specified but the Rust representation is not.

**Recommendation**: Define a `PrecomputedPar` struct in `scenario-generation.md` SS1.3 with:

- Owned `Vec<f64>` fields for `base`, `coefficients`, `scales`
- `Vec<u32>` for `orders`
- Dimension metadata (`n_stages: usize`, `n_hydros: usize`, `max_order: usize`)
- Public accessor methods with bounds-checked indexing
- Constructor and `evaluate` signatures as GAP-022 recommends

---

### F-002: Opening tree Rust type not defined (GAP-023)

**Severity**: High
**Affected Crate**: cobre-stochastic, cobre-sddp
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS2.3 documents:

> "the opening tree of shape $(T \times N_{\text{openings}} \times N_{\text{entities}})$"

> "Memory layout: The opening tree uses opening-major ordering for backward pass locality:
> `[opening_0_stage_0_entity_0, ..., opening_0_stage_T_entity_E, opening_1_stage_0_entity_0, ..., opening_N_stage_T_entity_E]`"

> "Total size: $N_{\text{openings}} \times T \times N_{\text{entities}} \times 8$ bytes. For typical production cases (200 openings x 120 stages x 160 hydros = ~30 MB), the entire tree fits in L3 cache."

`src/specs/overview/spec-gap-inventory.md` GAP-023 states:

> "The opening tree is described as a 3D array `(T x N_openings x N_entities)` stored in opening-major order, but the Rust type and ownership model are unspecified. Is this a `Vec<f64>` with manual indexing? An `ndarray::Array3`? A `SharedRegion<f64>` from cobre-comm? The type crosses the cobre-stochastic/cobre-sddp boundary."

GAP-023 resolution path recommends:

> "Define the opening tree type: recommend a flat `Vec<f64>` with an accessor struct that provides `fn noise(&self, opening: usize, stage: usize, entity: usize) -> f64` with bounds-checked indexing. Specify that the tree is allocated once and shared read-only via `Arc` or `SharedRegion`."

GAP-023 remains **open** (status: Medium, no "Resolved" prefix).

**Impact**: The opening tree crosses the cobre-stochastic/cobre-sddp boundary. cobre-stochastic generates it once before training; cobre-sddp's backward pass reads it at every iteration. Without a concrete type and ownership model, the crate interface is undefined. The choice between `Arc<OpeningTree>` (heap-shared) and `SharedRegion<f64>` (MPI shared window) affects the parallelization architecture.

**Recommendation**: Define an `OpeningTree` struct with a flat `Vec<f64>` backing store, dimension metadata, and an accessor `fn noise(&self, opening: usize, stage: usize, entity: usize) -> f64`. Document ownership as `Arc<OpeningTree>` for intra-rank sharing. Specify that the opening tree is `Send + Sync` for thread safety.

---

### F-003: Seed derivation function lacks Rust signature despite complete specification

**Severity**: Medium
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS2.2a provides an exceptionally detailed specification including input encoding, output semantics, crate dependency, and endianness:

> "The deterministic hash function referenced in SS2.2 is **SipHash-1-3**, provided by the [`siphasher`](https://crates.io/crates/siphasher) crate (version `1.x`)."

Forward pass encoding (20 bytes):

> ```
> input = base_seed.to_le_bytes()       // u64, 8 bytes
>      ++ iteration.to_le_bytes()        // u32, 4 bytes
>      ++ scenario.to_le_bytes()         // u32, 4 bytes
>      ++ stage.to_le_bytes()            // u32, 4 bytes
> ```

Opening tree encoding (16 bytes):

> ```
> input = base_seed.to_le_bytes()       // u64, 8 bytes
>      ++ opening_index.to_le_bytes()    // u32, 4 bytes
>      ++ stage.to_le_bytes()            // u32, 4 bytes
> ```

> "**Output.** The derived seed is the full 64-bit SipHash-1-3 output. This 64-bit value is used to initialize a `Pcg64` (or equivalent) pseudo-random number generator"

The specification is complete for implementation but lacks a Rust function signature. Two distinct encodings (forward pass: 20-byte, opening tree: 16-byte) suggest two functions or a unified interface with an enum discriminator.

**Impact**: An implementer can write the function directly from the spec, but the API shape (two functions vs. one parameterized function, parameter names, return type) is left to the implementer. The `Pcg64` RNG type is qualified with "(or equivalent)" which introduces a choice point.

**Recommendation**: Add Rust signatures:

```rust
fn derive_forward_seed(base_seed: u64, iteration: u32, scenario: u32, stage: u32) -> u64;
fn derive_opening_seed(base_seed: u64, opening_index: u32, stage: u32) -> u64;
```

Pin the RNG type to `Pcg64` from the `rand_pcg` crate (removing the "or equivalent" qualifier) to ensure cross-implementation reproducibility.

---

### F-004: `StageRng` type not defined

**Severity**: Medium
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/sampling-scheme-trait.md` SS2.1 uses `StageRng` in the `sample_forward` signature:

> ```rust
> pub fn sample_forward(
>     &self,
>     stage_id: usize,
>     scenario_index: usize,
>     rng: &mut StageRng,
> ) -> NoiseVector {
>     todo!()
> }
> ```

The precondition table states:

> "`rng` is seeded deterministically — The RNG state is derived from `(iteration, scenario_index, stage_id)` via the deterministic seed derivation scheme ([Scenario Generation SS2.2](./scenario-generation.md))"

`src/specs/architecture/scenario-generation.md` SS2.2a states the derived seed initializes:

> "a `Pcg64` (or equivalent) pseudo-random number generator"

But `StageRng` is never defined as a type alias or struct anywhere in the spec corpus.

**Impact**: `StageRng` is a parameter type in the primary hot-path method. Without a definition, the implementer must infer it from context (likely `Pcg64` or `rand::rngs::StdRng`). If different implementers choose differently, reproducibility is broken.

**Recommendation**: Define `type StageRng = rand_pcg::Pcg64;` (or a newtype wrapper) in the sampling scheme spec or scenario generation spec. Remove the "or equivalent" qualifier from SS2.2a.

---

### F-005: Cholesky factor storage type and library dependency unspecified

**Severity**: Medium
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS2.1 describes:

> "**Cholesky transform** -- Pre-decompose the correlation matrix $\Sigma = LL^T$ during preprocessing. At runtime, multiply: $\eta = L \cdot z$, producing correlated samples"

SS2.4 adds:

> "During preprocessing, the Cholesky decomposition is computed **once per profile** (not per stage). At runtime, the scenario generator looks up the active profile for the current stage via the schedule and uses its pre-computed Cholesky factor."

No specification exists for:

1. The Rust type for storing $L$ (flat `Vec<f64>` with lower-triangular packing? Dense 2D array? nalgebra `LowerTriangular`?)
2. Whether a linear algebra library (nalgebra, ndarray, faer) is used or a custom implementation is written
3. The error handling when $\Sigma$ is not positive definite (the validation invariant exists but no error type)

**Impact**: The Cholesky factor is accessed at every noise generation call. The storage format affects SIMD compatibility and cache behavior. Correlation groups are typically small (5-20 entities), so the matrix-vector multiply $\eta = L \cdot z$ is not a bottleneck, but the storage choice propagates to the `CorrelationModel` type design.

**Recommendation**: Specify the library dependency (nalgebra is the idiomatic choice for small dense matrices in Rust). Define the Cholesky factor storage type within the `CorrelationModel` struct. Add a `CholeskyError` variant for non-positive-definite matrices.

---

### F-006: Scenario workspace and buffer types unspecified

**Severity**: Medium
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS5.1 describes the memory organization:

> "Scenario data uses **scenario-major ordering** optimized for the forward pass access pattern:
>
> ````
> Access Pattern in Forward Pass:
>   - Outer loop: scenarios (parallel across threads)
>   - Inner loop: stages (sequential within scenario)
>   - Innermost: entities (sequential within stage)
> ```"
> ````

SS5.2 describes two-level work distribution:

> "Cobre distributes scenario work across two levels: **MPI ranks** (inter-node / inter-NUMA) and **threads** (intra-rank)."

SS5.3 discusses NUMA-aware allocation:

> "On NUMA architectures, scenario data is allocated with **first-touch policy** awareness."

No Rust types are defined for: the scenario buffer (flat `Vec<f64>` with stride calculation?), per-rank scenario assignment metadata, or the NUMA-aware allocation wrapper.

**Impact**: The scenario buffer is a hot-path data structure accessed by every forward pass thread. Without defined types, the implementer must design the buffer layout, thread-safe access pattern, and NUMA allocation strategy without specification guidance.

**Recommendation**: Define a `ScenarioBuffer` struct with the flat `Vec<f64>` backing store, dimension metadata (`n_scenarios`, `n_stages`, `n_entities`), and accessor methods. Add a `RankAssignment` struct documenting the per-rank scenario range.

---

### F-007: AR model parameter type mismatch between internal-structures.md and scenario-generation.md

**Severity**: Medium
**Affected Crate**: cobre-core, cobre-stochastic
**Affected Phase**: Phase 1 (cobre-core) and Phase 5 (cobre-stochastic)

**Evidence**: `src/specs/data-model/internal-structures.md` SS14 describes inflow models as:

> "Pre-resolved seasonal statistics and AR coefficients:
>
> - `mean_m3s` (mu) -- seasonal mean inflow
> - `std_m3s` (sigma) -- seasonal standard deviation
> - AR order `p` and coefficient list `[psi_1, ..., psi_p]` (variable length, can be 0)"

The `System` struct in SS1.3 declares:

> `pub par_models: Vec<ParModel>,       // per (hydro, stage)`

This is a flat `Vec<ParModel>` indexed "per (hydro, stage)" -- implying a 2D logical structure flattened to 1D.

`src/specs/architecture/scenario-generation.md` SS1.3 specifies the preprocessed layout as struct-of-arrays:

> | Array          | Dimensions              | Layout                  |
> | -------------- | ----------------------- | ----------------------- |
> | `base`         | T x N_hydro             | Row-major (stage outer) |
> | `coefficients` | T x N_hydro x max_order | Row-major               |
> | `scales`       | T x N_hydro             | Row-major               |
> | `orders`       | N_hydro                 | Flat                    |

The internal-structures.md representation (`Vec<ParModel>` with per-element fields) is an array-of-structs (AoS) layout. The scenario-generation.md preprocessed representation is a struct-of-arrays (SoA) layout. These are **different data layouts** by design (dual-nature: clarity-first in cobre-core, performance-first in cobre-stochastic), but the transformation from one to the other is not specified.

Additionally, `internal-structures.md` SS14 uses the label "sigma" for `std_m3s`, but `par-inflow-model.md` SS3 is explicit that:

> "The **residual standard deviation** $\sigma_m$ is not stored. It is derived from the stored quantities during model initialization."

The stored quantity is the **sample** standard deviation $s_m$, not the residual $\sigma_m$. The label "sigma" in internal-structures.md is misleading.

**Impact**: (1) No function signature exists for the AoS-to-SoA transformation from `Vec<ParModel>` to `PrecomputedPar`. (2) The "sigma" label in internal-structures.md could lead an implementer to store the wrong quantity ($\sigma_m$ instead of $s_m$), breaking the residual std computation.

**Recommendation**: (1) Add a constructor `PrecomputedPar::from_system(system: &System) -> PrecomputedPar` that documents the AoS-to-SoA transformation. (2) Correct the "sigma" label in internal-structures.md SS14 to "s_m (seasonal sample standard deviation)" and add a parenthetical noting that this is NOT the residual std.

---

### F-008: PAR fitting validation errors lack a Rust error type

**Severity**: Low
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/scenario-generation.md` SS1.4 specifies five validation checks:

> | Check                      | Severity | Description                                                |
> | -------------------------- | -------- | ---------------------------------------------------------- |
> | Positive residual variance | Error    | $\sigma_m^2 > 0$ for all seasons                           |
> | PAR seasonal stability     | Warning  | Per-season AR polynomial roots outside unit circle         |
> | Correlation matrix PSD     | Error    | $R_m$ positive definite (invertible)                       |
> | No systematic bias         | Warning  | Residuals $\varepsilon_t$ mean near zero                   |
> | AR order consistency       | Error    | Coefficient row count matches `ar_order` in seasonal stats |

These have Error/Warning severity levels but no Rust error enum maps to them. The `SamplingSchemeValidationError` in `sampling-scheme-trait.md` SS6 covers only the sampling scheme configuration (S1-S4), not the PAR fitting validation.

**Impact**: An implementer must create an ad-hoc error type for PAR fitting validation. The severity levels (Error vs. Warning) need to map to Rust semantics (`Result::Err` vs. log warning and continue).

**Recommendation**: Define a `ParFittingValidation` enum with variants for each check, annotated with severity. Specify that Error-severity items return `Err` (aborting the fitting) and Warning-severity items emit log warnings but continue.

---

### F-009: `NoiseVector` lacks derive macros

**Severity**: Low
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/sampling-scheme-trait.md` SS3.3 defines:

> ```rust
> pub struct NoiseVector {
>     /// Noise values, one per stochastic entity.
>     /// Length equals the number of entities in the correlation structure.
>     pub values: Vec<f64>,
> }
> ```

No `#[derive(...)]` macros are specified. By contrast, `BackwardTreeSource` in SS2.3 explicitly specifies:

> `#[derive(Debug, Clone, Copy, PartialEq, Eq)]`

And `SamplingSchemeConfig` in SS3.1 specifies:

> `#[derive(Debug, Clone, Deserialize)]`

**Impact**: `NoiseVector` is returned by `sample_forward` and consumed by the training loop. It likely needs `Debug` (for logging), `Clone` (for storing trajectory records), and possibly `PartialEq` (for testing). Without specification, derive choices are left to the implementer.

**Recommendation**: Add `#[derive(Debug, Clone)]` to `NoiseVector`. Consider `PartialEq` for testing support.

---

### F-010: InSample behavioral contract lacks explicit opening index sampling specification

**Severity**: Low
**Affected Crate**: cobre-stochastic
**Affected Phase**: Phase 5

**Evidence**: `src/specs/architecture/sampling-scheme-trait.md` SS2.1 postconditions state:

> "For `InSample`: the returned noise is the opening tree vector at the sampled index -- The sampled index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ is drawn uniformly by `rng`"

`src/specs/architecture/scenario-generation.md` SS2.3 adds:

> "When the `InSample` sampling scheme is active (see SS3.2), the forward pass samples a random index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ at each stage and uses the corresponding noise vector $\eta_{t,j}$ to generate the stage realization. The sampling is a single random integer per stage -- no noise generation occurs during the forward pass."

The contract is clear: uniform sampling of an integer index. However, the spec does not state whether sampling is with or without replacement **across stages within a single trajectory**. For InSample, each stage independently samples (implied by "a single random integer per stage"), so replacement across stages is the default. But this should be made explicit for clarity.

Additionally, the infallibility citation in SS2.1 states:

> "**Infallibility:** This method does not return `Result`. All inputs (stage IDs, external scenario data, historical data) are validated at configuration load time (SS6). The PAR model parameters are guaranteed to produce valid inversions after preprocessing validation ([Validation Architecture SS2.5](./validation-architecture.md))."

This citation is complete: it references SS6 for input validation and `validation-architecture.md` SS2.5 for PAR preprocessing validation.

**Impact**: Minimal. The uniform sampling semantics are clear from context. The lack of an explicit "with replacement across stages" statement is a minor documentation gap.

**Recommendation**: Add a clarifying note: "Each stage independently samples from the full opening index range (effectively with replacement across stages within a trajectory)."

---

### F-011: Complete tree mode types unspecified within cobre-stochastic scope

**Severity**: Low
**Affected Crate**: cobre-stochastic
**Affected Phase**: Deferred (but architectural hooks may affect Phase 5)

**Evidence**: `src/specs/architecture/scenario-generation.md` SS7 describes complete tree mode:

> "the solver explores an explicit scenario tree -- every branching at every stage is visited, with no sampling."

> "The scenario tree is defined by per-stage branching counts $N_t$ for $t = 1, \ldots, T$"

> "The solver integration for complete tree mode (tree enumeration, node-to-subproblem mapping, result aggregation) is documented in [Deferred Features SSC.12](../deferred.md)."

Complete tree mode is explicitly deferred, but the scenario generation spec documents the tree structure in detail. No types are defined for tree node addressing, per-stage branching counts, or the DECOMP special case configuration.

**Impact**: Low. Per the scope definition in `spec-gap-inventory.md`:

> "Deferred features (... complete tree mode) are explicitly out of scope and are NOT flagged as gaps."

However, the scenario generation spec already contains substantial complete tree mode content (SS7.1-7.4). If the architectural hooks in `SamplingScheme` need extension for complete tree mode, this should be verified.

**Recommendation**: No action required for Phase 5. Verify during deferred feature planning that the `SamplingScheme` enum can be extended for complete tree mode without breaking changes (e.g., a fourth variant `CompleteTree { branching_counts: Vec<u32> }`).

---

## 4. GAP-022 and GAP-023 Current State Assessment

### GAP-022 (PrecomputedPar) -- Status: OPEN

`src/specs/overview/spec-gap-inventory.md` line 47:

> "GAP-022 | Medium | cobre-stochastic | Scenario Generation | 1.2, 1.3 | The PAR preprocessing pipeline produces contiguous arrays (`base`, `coefficients`, `scales`, `orders`) but the concrete Rust types that hold these arrays are unspecified."

No "Resolved" prefix appears in the Description column. The resolution path is a recommendation, not a completed action. The `scenario-generation.md` spec has not been updated since the gap was filed -- the array table in SS1.3 remains the only concrete specification, with no Rust struct definition added.

### GAP-023 (Opening tree) -- Status: OPEN

`src/specs/overview/spec-gap-inventory.md` line 48:

> "GAP-023 | Medium | cobre-stochastic, cobre-sddp | Scenario Generation | 2.3 | The opening tree is described as a 3D array `(T x N_openings x N_entities)` stored in opening-major order, but the Rust type and ownership model are unspecified."

No "Resolved" prefix. The resolution path recommending `Vec<f64>` with accessor struct has not been implemented in the spec.

Both gaps remain open and directly correspond to findings F-001 and F-002 above.

---

## 5. SipHash-1-3 Seed Derivation Detailed Assessment

The seed derivation specification in `scenario-generation.md` SS2.2a is the most detailed algorithmic specification in the cobre-stochastic scope. Assessment:

| Aspect                      | Status   | Evidence                                                                                        |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| Hash algorithm              | COMPLETE | "SipHash-1-3, provided by the `siphasher` crate (version `1.x`)"                                |
| Forward pass input encoding | COMPLETE | 20-byte: `base_seed(u64) ++ iteration(u32) ++ scenario(u32) ++ stage(u32)`, all `to_le_bytes()` |
| Opening tree input encoding | COMPLETE | 16-byte: `base_seed(u64) ++ opening_index(u32) ++ stage(u32)`, all `to_le_bytes()`              |
| Endianness                  | COMPLETE | "Little-endian encoding is **mandatory**"                                                       |
| Output interpretation       | COMPLETE | "full 64-bit SipHash-1-3 output" used to seed Pcg64                                             |
| Crate version pinning       | COMPLETE | `siphasher = "1"` in Cargo.toml                                                                 |
| `DefaultHasher` prohibition | COMPLETE | "MUST NOT be used" with rationale                                                               |
| Rust function signature     | MISSING  | No `fn derive_seed(...)` signature (see F-003)                                                  |
| RNG type                    | PARTIAL  | "Pcg64 (or equivalent)" -- the qualifier introduces ambiguity (see F-004)                       |

The byte-level input encodings are unambiguous and implementation-ready. The only gaps are the function signature and the RNG type qualifier.

---

## 6. InSample Behavioral Contract Assessment

The InSample sampling scheme behavioral contract from `sampling-scheme-trait.md`:

| Contract Element            | Status   | Evidence                                                                                                                                              |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preconditions               | COMPLETE | 5 preconditions in table (stage_id validity, scenario_index range, rng seeding, External data presence, Historical data mappability)                  |
| Postconditions              | COMPLETE | 6 postconditions in table (vector length, InSample lookup, External inversion, Historical inversion, determinism, correlation)                        |
| Infallibility citation      | COMPLETE | Cites SS6 (config load validation) and Validation Architecture SS2.5 (PAR preprocessing validation)                                                   |
| Noise source                | COMPLETE | "the returned noise is the opening tree vector at the sampled index"                                                                                  |
| Sampling distribution       | COMPLETE | "sampled index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ is drawn uniformly by `rng`"                                                            |
| Determinism guarantee       | COMPLETE | "Given the same `rng` state, `stage_id`, and `scenario_index`, the method returns identical results across MPI ranks, restarts, and thread orderings" |
| Forward-backward separation | COMPLETE | Documented in SS5 with explicit invariant statement and per-variant consequence table                                                                 |
| Pure-query methods          | COMPLETE | `requires_noise_inversion` and `backward_tree_source` both state "Preconditions: None. This is a pure query on the enum variant."                     |

The behavioral contract is thorough and implementation-ready.

---

## 7. AR Model Parameter Type Tracing

Tracing AR model parameter types from input files through internal-structures.md to scenario-generation.md:

| Parameter                       | Input Schema (`input-scenarios.md`)              | Internal Structure (`internal-structures.md` SS14) | Preprocessed Layout (`scenario-generation.md` SS1.3)               | Consistency                                                                                                              |
| ------------------------------- | ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Seasonal mean $\mu_m$           | `mean_m3s: f64` (SS3.1)                          | `mean_m3s (mu)`                                    | `base[h][t]` (derived: $\mu_m - \sum_\ell \psi_\ell \mu_{m-\ell}$) | Consistent -- stored value is input, preprocessed value is derived                                                       |
| Sample std $s_m$                | `std_m3s: f64` (SS3.1)                           | `std_m3s (sigma)`                                  | `scales[h][t]` ($\sigma_m$, derived via reverse-standardization)   | **INCONSISTENT** -- internal-structures labels this "sigma" but the stored quantity is $s_m$, not $\sigma_m$ (see F-007) |
| AR order $p$                    | `ar_order: i32` (SS3.1)                          | `AR order p` (no type)                             | `orders[h]` (no type)                                              | Type gap -- input is `i32`, internal and preprocessed types unspecified                                                  |
| AR coefficients $\psi_{m,\ell}$ | `coefficient: f64` (SS3.2), `lag: i32` (1-based) | `coefficient list [psi_1, ..., psi_p]`             | `coefficients[h][t][l]`                                            | Consistent -- original units throughout                                                                                  |

The primary inconsistency is the "sigma" labeling in `internal-structures.md` SS14, documented in F-007.

---

## 8. Crate Verdict

**CONDITIONAL PASS**

cobre-stochastic has a strong mathematical foundation and well-specified behavioral contracts. The `SamplingScheme` enum (SS1) with all three variants, its three methods (`sample_forward`, `requires_noise_inversion`, `backward_tree_source`) with complete precondition/postcondition tables, the `SamplingSchemeConfig` serde representation (SS3.1), the `SamplingSchemeValidationError` enum (SS6), and the forward-backward separation invariant (SS5) are all implementation-ready.

The PAR preprocessing pipeline is mathematically complete: the four-array layout (SS1.3), the residual std derivation (`par-inflow-model.md` SS3), the inflow computation formula, and the noise inversion procedure (SS4.3) provide sufficient mathematical specification to implement. The seed derivation function (SS2.2a) is one of the most precisely specified algorithms in the corpus.

The **conditional** qualifier reflects two categories of gaps:

1. **Concrete Rust types missing for core data structures (F-001, F-002):** `PrecomputedPar` and the opening tree type are the two primary data structures cobre-stochastic owns. Both have detailed dimensional and layout specifications but no Rust struct definitions. These correspond to open gaps GAP-022 and GAP-023. Without these types, the crate API surface is undefined despite the domain semantics being clear.

2. **Library and infrastructure dependencies unspecified (F-003, F-004, F-005, F-006):** The RNG type (`StageRng`), linear algebra library (for Cholesky), and scenario buffer types are implementation choices that should be in the specification to ensure reproducibility and consistency.

### Resolution path for PASS

| Priority | Finding                           | Action                                                                                                 |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Must     | F-001 (PrecomputedPar / GAP-022)  | Define Rust struct with owned contiguous arrays, dimension metadata, constructor, and accessor methods |
| Must     | F-002 (Opening tree / GAP-023)    | Define Rust struct with flat `Vec<f64>`, accessor, ownership model (`Arc`), and `Send + Sync` bounds   |
| Must     | F-004 (StageRng)                  | Define `type StageRng = rand_pcg::Pcg64` and remove the "or equivalent" qualifier                      |
| Should   | F-003 (Seed derivation signature) | Add two Rust function signatures for forward and opening tree seed derivation                          |
| Should   | F-005 (Cholesky storage)          | Specify nalgebra dependency and Cholesky factor type; add `CholeskyError`                              |
| Should   | F-007 (sigma label)               | Correct the "sigma" label in internal-structures.md SS14 to "s_m (sample std)"                         |
| May      | F-006, F-008, F-009, F-010, F-011 | Resolve during implementation or Phase 5 prep                                                          |
