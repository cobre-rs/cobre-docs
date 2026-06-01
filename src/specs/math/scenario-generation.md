# Scenario Generation

## Purpose

This chapter defines the Cobre scenario generation methodology. It covers the
PAR(p) preprocessing rationale, correlated noise generation, the opening tree
concept, the sampling scheme abstraction that governs how scenarios are selected
in forward and backward passes, external scenario integration, load scenario
generation, and complete tree mode. For the mathematical definition of the
PAR(p) model itself, see [PAR(p) Inflow Model](./par-inflow-model.md).

## 1. PAR Model Preprocessing

### 1.1 Overview

The PAR(p) model generates stochastic inflows during training. Before the
training loop begins, the raw PAR parameters — loaded from
`inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet` — are
preprocessed into a contiguous layout that eliminates per-stage season lookups
on the hot path. Preprocessing also resolves all season-indexed quantities into
stage-indexed arrays so that the forward and backward passes operate on a single
flat structure per (stage, hydro) pair.

**Why preprocessing separates stored from computed quantities.** The input files
store standardized AR coefficients ($\psi^*_{m,\ell}$, the direct Yule-Walker
output) and `residual_std_ratio` ($\sigma_m / s_m$) — not original-unit
coefficients and not $\sigma_m$ directly. Preprocessing converts these at
startup: $\psi_{m,\ell} = \psi^*_{m,\ell} \cdot s_m / s_{m-\ell}$ and
$\sigma_m = s_m \cdot \texttt{residual\_std\_ratio}_m$. This separation keeps
the swappable seasonal conditioning ($s_m$) distinct from the fixed model
dynamics ($\psi^*$, residual_std_ratio): a different conditioning stream can
be substituted without re-fitting the AR dynamics — only the seasonal stats
file changes. The preprocessing pipeline produces contiguous stage-indexed
arrays ready for hot-path access.

For the full PAR(p) model definition, parameter set, and fitting theory, see
[PAR(p) Inflow Model](./par-inflow-model.md).

### 1.2 Preprocessing Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PAR Model Preprocessing Pipeline                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Input: inflow_seasonal_stats.parquet (μ, s per hydro × stage)                  │
│         inflow_ar_coefficients.parquet (ψ* per hydro × stage × lag, residual_std_ratio) │
│         inflow_history.parquet (optional, for lag initialization)               │
│                                                                                 │
│  Step 1: Load PAR Parameters                                                    │
│  For each (hydro h, stage t) with season m = season(t):                         │
│    μ[h][t] = mean_m3s              (seasonal mean)                              │
│    s[h][t] = std_m3s               (seasonal sample std)                        │
│    ψ*[h][t][ℓ] = coefficient       (AR coefficients, standardized by s)         │
│    r[h][t] = residual_std_ratio    (σ_m/s_m; same for all lags of a group)      │
│    p[h][t] = max(lag) per group    (AR order derived from coefficient count)     │
│                              │                                                  │
│                              ▼                                                  │
│  Step 2: Convert to Original-Unit Coefficients and Derive σ                    │
│  For each (hydro h, stage t) with season m = season(t):                         │
│    ψ[h][t][ℓ] = ψ*[h][t][ℓ] · s[m] / s[m-ℓ]   (runtime conversion)            │
│    σ[h][t] = s[h][t] · r[h][t]                  (σ = s_m · residual_std_ratio)  │
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

### 1.3 PAR Model Fitting from Historical Data

When AR coefficients are not provided in `inflow_ar_coefficients.parquet`,
Cobre fits PAR models from historical inflow data using the Yule-Walker method
with PACF-based order selection. For the mathematical derivation of the fitting
procedure, see [PAR(p) Inflow Model](./par-inflow-model.md).

The fitting process:

1. **Season extraction** — Group historical observations by season (as defined
   in `season_definitions`)
2. **Seasonal statistics** — Compute mean ($\mu_m$) and sample standard
   deviation ($s_m$) per season
3. **Standardization** — Transform observations to zero-mean, unit-variance per
   season
4. **Order selection** — For each season, compute the Periodic Autocorrelation
   Function (PACF) up to `max_order` and select the order where the PACF
   coefficient becomes insignificant
5. **Yule-Walker solution** — Solve the Yule-Walker equations via LU
   factorization of the Toeplitz autocorrelation matrix
6. **Store direct output** — Store the standardized coefficients
   $\psi^*_{m,\ell}$ (direct Yule-Walker output) and the computed
   `residual_std_ratio` in `inflow_ar_coefficients.parquet`; no conversion to
   original units is performed at fit time (see section 1.1)

The fitted model output includes: seasonal means ($\mu_m$, $s_m$) stored in
`inflow_seasonal_stats.parquet`, and standardized AR coefficients
($\psi^*_{m,\ell}$) plus `residual_std_ratio` stored in
`inflow_ar_coefficients.parquet`. AR order is implicit from the count of
coefficient rows per (hydro, stage) group — it is not stored as a separate
field.

**Fitted model validation** follows the invariants defined in
[PAR(p) Inflow Model](./par-inflow-model.md):

| Check                       | Severity | Description                                                         |
| --------------------------- | -------- | ------------------------------------------------------------------- |
| Positive residual variance  | Error    | $\sigma_m^2 > 0$ for all seasons                                    |
| PAR seasonal stability      | Warning  | Per-season AR polynomial roots outside unit circle                  |
| Correlation matrix symmetry | Warning  | $R_m$ symmetric (spectral decomposition clips negative eigenvalues) |
| No systematic bias          | Warning  | Residuals $\varepsilon_t$ mean near zero                            |
| AR order consistency        | Error    | Lags are contiguous {1, 2, ..., p} per (hydro, stage) group         |

## 2. Noise Generation

### 2.1 Correlated Noise Generation

Hydros within the same correlation group share spatially **correlated** noise.
The correlation structure is defined in `correlation.json`.

The generation process:

1. **Independent sampling** — Generate independent standard normal
   $z_i \sim N(0,1)$ samples, one per entity in the correlation group
2. **Spectral transform** — Pre-decompose the correlation matrix via
   eigendecomposition $\Sigma = V \operatorname{diag}(\lambda) V^T$ during
   preprocessing. The spectral factor
   $D = V \operatorname{diag}(\sqrt{\max(0,\lambda)}) V^T$ transforms
   independent noise into correlated noise: $\eta = D \cdot z$. Negative
   eigenvalues are clipped to zero, yielding the nearest
   positive-semidefinite approximation. The `method` field in
   `correlation.json` defaults to `"spectral"`; `"cholesky"` is accepted for
   backward compatibility.
3. **Entity assignment** — Each entity in the group receives its own
   correlated noise value $\eta_i$ from the transformed vector.

Entities in different correlation groups are independent of each other.
Entities not assigned to any group receive independent $N(0,1)$ noise.

For the spectral factorisation rationale and the full eigendecomposition
derivation, see [PAR(p) Inflow Model](./par-inflow-model.md).

### 2.2 Reproducible Sampling

Noise generation must produce identical results regardless of MPI rank
assignment, thread scheduling, or restart. This is achieved through
**deterministic seed derivation**:

- A base seed is specified in `config.json`
- Each (iteration, scenario, stage) tuple maps to a unique derived seed via a
  deterministic hash function
- The RNG state is initialized from this derived seed before generating the
  noise vector for that tuple

This design ensures:

- **Cross-rank reproducibility** — The same scenario/stage produces the same
  noise regardless of which MPI rank processes it
- **Restart reproducibility** — Resuming from a checkpoint produces identical
  noise for subsequent iterations
- **Order independence** — Results are identical regardless of the order in
  which scenarios or stages are processed

> **Architectural note:** Because every rank can independently derive the same
> noise for any `(iteration, scenario, stage)` tuple by hashing identical
> inputs with the same RNG, no MPI broadcast of noise data is required. Each
> rank generates only the noise it needs, exactly when it needs it. This
> property eliminates the need for a dedicated scenario innovation noise
> broadcast format.

**Input encoding (forward pass).** The hash input is a fixed-width,
little-endian byte sequence constructed by concatenating four integers:
base seed (8 bytes), iteration (4 bytes), scenario index (4 bytes), and
stage (4 bytes) — 20 bytes total. Little-endian encoding is mandatory for
cross-platform reproducibility.

**Input encoding (opening tree).** For opening tree generation (section 2.3),
the input replaces `iteration` and `scenario` with a single `opening_index`:
base seed (8 bytes), opening index (4 bytes), stage (4 bytes) — 16 bytes
total.

**Output.** The derived seed is a 64-bit hash value used to initialize a
pseudo-random number generator, which then produces the noise vector $\eta$
for the corresponding tuple.

### 2.3 Opening Tree

The backward pass in SDDP evaluates an aggregated cut by solving **all** $N_t$
branchings at each stage $t$. These branchings must be identical across all
iterations — the backward pass always "sees the same tree." Cobre fixes a set
of branchings before training and visits all of them in every backward pass.
This fixed set is the **opening tree**.

The tree is **generated once before training begins** and remains fixed
throughout. Generation produces $N_t$ noise vectors per stage; the backward
pass iterates over them at every iteration of the algorithm.

The per-stage branching factor $N_t$ is configured per study. Uniform
branching ($N_t = N$ for all $t$) is the common case in standard SDDP, but
per-stage variable branching is supported — this is required for complete tree
mode (section 6.2), where the DECOMP special case uses $N_t = 1$ for $t < T$
and $N_T = K$.

**Tree generation:**

1. Before the first SDDP iteration, generate $N_t$ noise vectors per stage
   $t$, producing a fixed opening tree with total element count
   $\sum_t N_t \times \text{dim}$
2. Each noise vector is generated from the base seed using deterministic seed
   derivation per (opening_index, stage) — ensuring reproducibility across
   restarts and MPI configurations (see section 2.2)
3. Correlation is applied per the active profile for each stage (see section
   2.4)

**Backward pass usage:** At each stage $t$, the backward pass iterates over
**all** $N_t$ noise vectors, solving one subproblem per opening, then
aggregates the resulting cuts. Because the tree is fixed, every iteration
produces cuts that refine the same set of future cost scenarios.

**Forward pass usage (InSample only):** When the `InSample` sampling scheme is
active (see section 3.2), the forward pass samples a random index
$j \in \{0, \ldots, N_t - 1\}$ at each stage and uses the corresponding noise
vector $\eta_{t,j}$ from the opening tree. Other sampling schemes (`External`,
`Historical`) use entirely separate data sources and do not access the opening
tree; the forward pass noise path is governed by the sampling scheme
abstraction (section 3).

The opening tree uses stage-major ordering so that all $N_t$ noise vectors for
a given stage are contiguous in memory, enabling linear access during the
backward pass. The noise vector for a given (stage, opening_index) pair is
read directly without iteration over the tree structure.

The same tree is generated bit-identically on every MPI rank because seed
derivation depends only on `(base_seed, opening_index, stage)` — globally
known constants. For the determinism guarantees that follow from this
property, see [Determinism Guarantees](./determinism-guarantees.md).

### 2.3a Sampling Method and Opening Tree Generation

The `sampling_method` field on each stage in `stages.json` controls the
algorithm used to generate the $N_t$ noise vectors for that stage's opening
tree entries. This is **orthogonal** to the sampling scheme abstraction
(section 3): `sampling_method` governs _how_ the opening tree is populated
with noise vectors; the sampling scheme governs _which_ noise source the
forward pass uses.

**SAA** (Sample Average Approximation) is the implemented `sampling_method`:
uniform Monte Carlo random sampling from the deterministic-seeded RNG. Each
noise vector component $z_i$ is drawn as an independent standard normal
$\mathcal{N}(0,1)$, then transformed by the spectral correlation factor
(section 2.1) to produce the correlated noise vector $\eta$.

**Summary of sampling methods:**

| Method       | Description                                                               | Status              |
| ------------ | ------------------------------------------------------------------------- | ------------------- |
| `saa`        | Sample Average Approximation — uniform Monte Carlo from seeded RNG        | Implemented         |
| `lhs`        | Latin Hypercube Sampling — stratified, uniform marginal coverage          | Implemented         |
| `qmc_sobol`  | Quasi-Monte Carlo (Sobol sequences) — low-discrepancy deterministic-like  | Implemented         |
| `qmc_halton` | Quasi-Monte Carlo (Halton sequences) — alternative low-discrepancy method | Implemented         |
| `selective`  | Selective/Representative Sampling — clustering on historical data         | Not yet implemented |

**Per-stage variation.** The `sampling_method` field can vary per stage,
enabling mixed strategies in a single run.

### 2.4 Time-Varying Correlation Profiles

The correlation structure can vary across stages via the **profile + schedule**
pattern defined in `correlation.json`:

- **Profiles** — Named correlation configurations (e.g., `"default"`,
  `"wet_season"`, `"dry_season"`), each defining correlation groups and
  matrices
- **Schedule** — An optional array that maps specific `stage_id` values to
  profile names. Stages not listed use the `"default"` profile.

During preprocessing, the spectral decomposition is computed **once per
profile** (not per stage). At runtime, the scenario generator looks up the
active profile for the current stage via the schedule and uses its
pre-computed spectral factor.

## 3. Sampling Scheme Abstraction

### 3.1 Three Orthogonal Concerns

The SDDP algorithm has three independently configurable concerns that govern
how scenarios are handled during training. Cobre formalizes these as distinct
abstractions, following the design established by SDDP.jl:

| Concern                                              | Abstraction            | What It Controls                 | Default    |
| ---------------------------------------------------- | ---------------------- | -------------------------------- | ---------- |
| Which noise is selected at each forward pass stage   | **Sampling Scheme**    | Forward scenario selection       | `InSample` |
| Which LP model is solved in the forward pass         | **Forward Pass Model** | Training LP vs alternative model | `Default`  |
| Which noise terms are evaluated in the backward pass | **Backward Sampling**  | Branching completeness           | `Complete` |

These three concerns are **orthogonal** — each can be configured independently
without affecting the others. The forward pass model and backward sampling are
fixed in the current implementation (Default and Complete respectively). The
sampling scheme is the primary configurable dimension.

**Forward and backward noise source separation** is a natural consequence of
this design: the sampling scheme controls the forward pass noise source, while
backward sampling always draws from the fixed opening tree (section 2.3).
These two sources may differ — for example, the forward pass may sample from
external scenarios while the backward pass evaluates all openings generated
from a PAR model fitted to those scenarios.

### 3.2 Forward Sampling Schemes

The sampling scheme determines how the forward pass selects a scenario
realization at each stage. Cobre supports four sampling schemes, configured
independently per stochastic class (inflow, load, NCS) via per-class
sub-objects in `training.scenario_source`:

#### InSample (Default)

At each stage $t$, sample a random index
$j \in \{0, \ldots, N_{\text{openings}} - 1\}$ and use the corresponding noise
vector $\eta_{t,j}$ from the fixed opening tree (section 2.3). The PAR model
dynamics equation is embedded in the LP as a constraint; the solver evaluates
the inflow realization implicitly when it solves the LP with the fixed noise.

- **Noise source**: Opening tree (same as backward pass)
- **Use case**: Standard SDDP training — forward and backward passes see the
  same noise distribution

This is SDDP.jl's `InSampleMonteCarlo`: the forward pass samples from the
same noise terms defined in the model.

#### OutOfSample

The forward pass draws from independently generated Monte Carlo noise that is
distinct from the opening tree noise. At each stage $t$, a fresh noise vector
is generated from the same PAR model used for the opening tree, but with
independent random draws. The backward pass uses the same fixed opening tree
as InSample.

- **Noise source**: Independently generated Monte Carlo noise (not from the
  opening tree)
- **Backward pass interaction**: The backward pass uses the fixed opening tree
  generated from the same PAR model
- **Use case**: Out-of-sample forward evaluation to reduce in-sample bias

This corresponds to SDDP.jl's `OutOfSampleMonteCarlo`.

#### External

The forward pass draws from user-provided per-class scenario data (e.g.,
`external_inflow_scenarios.parquet`). At each stage $t$, a scenario is
selected from the external set.

- **Noise source**: External scenario values (not the opening tree)
- **Realization computation**: External values must always be **inverted to
  noise terms** (epsilon) before they can be used in the LP (see section 4.3).
- **Backward pass interaction**: The backward pass still uses the fixed opening
  tree. When external scenarios are the forward source, the opening tree noise
  is generated from a **PAR model fitted to the external data**, ensuring the
  backward branchings reflect the statistical properties of the external
  scenarios (see section 4.2).
- **Use case**: Training with imported Monte Carlo scenarios or stress-test
  scenarios

#### Historical

Replay actual historical sequences mapped to stages via `season_definitions`.
The forward pass deterministically follows historical data in order, cycling
through available years when the number of forward passes exceeds the
historical record.

- **Noise source**: Historical values (mapped from `inflow_history.parquet` or
  equivalent to stage structure)
- **Realization computation**: Historical values must be **inverted to noise
  terms** (epsilon) before use in the LP. The same noise inversion procedure
  applies (see section 4.3). The lag chain seeding the inversion is rooted at
  `initial_conditions.past_inflows` and advanced by the per-stage transitions —
  not at the year-preceding raw historical lags. The reason and consequences
  are spelled out under "x₀ consistency under historical replay" below.
- **Backward pass interaction**: Same as External — the backward pass uses a
  PAR model fitted to the historical data.
- **Use case**: Policy validation against observed conditions, historical
  replay analysis

This corresponds to NEWAVE's `TENDENCIA HIDROLOGICA` convention, which is also
the semantics used by SDDP.jl's `Historical` sampling scheme.

### 3.3 Forward Pass Model

The forward pass model determines which LP is solved at each stage during the
forward pass. Cobre implements one model:

- **Default** — Solve the training LP (the convex LP used for cut generation)
  with the scenario realization from the sampling scheme. This is the standard
  SDDP forward pass.

An alternative forward pass model that solves a different LP to generate trial
points while keeping the training LP for cut generation is not currently
implemented.

### 3.4 Backward Sampling

The backward sampling scheme determines which noise terms are evaluated at each
stage during the backward pass. Cobre implements one scheme:

- **Complete** — Evaluate **all** $N_{\text{openings}}$ noise vectors from the
  fixed opening tree. This is the standard SDDP backward pass that guarantees
  proper cut generation by considering every branching.

A Monte Carlo backward sampling variant — sampling $n$ openings with
replacement instead of evaluating all — is not currently implemented.

### 3.5 Configuration

The sampling scheme is configured in `config.json` via
`training.scenario_source` (for training) and `simulation.scenario_source`
(for simulation). Each stochastic class (inflow, load, NCS) has its own
scheme. When `simulation.scenario_source` is absent, it falls back to
`training.scenario_source`.

**Summary of scheme-to-config mapping (per class):**

| Sampling Scheme | Per-class config example        | Required inputs                                                              |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| InSample        | `{ "scheme": "in_sample" }`     | Uncertainty models or inflow history                                         |
| OutOfSample     | `{ "scheme": "out_of_sample" }` | Same as InSample (independent noise from same model)                         |
| External        | `{ "scheme": "external" }`      | Per-class external scenario file (e.g., `external_inflow_scenarios.parquet`) |
| Historical      | `{ "scheme": "historical" }`    | `inflow_history.parquet` + `season_definitions`                              |

## 4. External Scenario Integration

### 4.1 External Scenario Sources

Cobre supports external (deterministic) scenarios as an alternative forward
pass noise source. External scenarios can drive the forward pass in **both
training and simulation**.

| Use Case           | Description                                |
| ------------------ | ------------------------------------------ |
| Historical replay  | Use actual historical inflows              |
| Monte Carlo import | Pre-generated scenarios from external tool |
| Stress testing     | Specific drought/flood scenarios           |

**Input files** (per-class): `scenarios/external_inflow_scenarios.parquet`,
`scenarios/external_load_scenarios.parquet`,
`scenarios/external_ncs_scenarios.parquet`. Each class has its own file with
class-specific entity ID and value columns.

### 4.2 Backward Pass with External Forward Scenarios

When the `External` or `Historical` sampling scheme is active during training,
the forward and backward passes use **different noise sources**. The backward
pass still requires proper probabilistic branchings for valid cut generation,
so the opening tree noise must reflect the statistical properties of the
external data.

The lifecycle is:

1. **PAR fitting** — Fit a PAR model to the external scenario data (or
   historical inflow data), treating the external values as a synthetic
   history. The fitting follows the same procedure as section 1.3: seasonal
   statistics and AR coefficients are estimated from the external data.
2. **Opening tree generation** — Generate the fixed opening tree (section 2.3)
   using noise from the fitted PAR model. The branchings reflect the
   distributional characteristics of the external scenarios.
3. **Training** — Forward pass samples from external data; backward pass
   evaluates all openings from the PAR-fitted tree.

**Rationale:** Using external scenarios directly in the backward pass would
violate SDDP's requirement for proper probabilistic branchings. By fitting a
PAR model to the external data, the backward pass preserves the statistical
signature of the scenarios while producing valid cuts.

### 4.3 Noise Inversion for External and Historical Scenarios

When using external or historical scenarios, Cobre must compute the **implied
noise values** that would have generated those inflows under the PAR model.
This is required because the backward pass needs noise values to construct the
appropriate RHS perturbations for cut generation, and the lower bound and
upper bound must be evaluated at the same $x_0$ for the gap to be meaningful.

Given target inflow $a_t^{\text{target}}$ at stage $t$ for hydro $h$ with
season $m$:

$$
\eta_t = \frac{a_t^{\text{target}} - \phi_m - \sum_{\ell=1}^{P} \psi_{m,\ell} \cdot a_{t-\ell}}{\sigma_m}
$$

where $\phi_m = \mu_m - \sum_{\ell=1}^{P} \psi_{m,\ell} \cdot \mu_{m-\ell}$ is
the precomputed base value.

All quantities ($\mu_m$, $\psi_{m,\ell}$, $\sigma_m$) are in their respective
units as described in [PAR(p) Inflow Model](./par-inflow-model.md). The AR
coefficients are in original units; $\sigma_m$ is the derived residual std.
Under PAR(p)-A, the upper index $P$ of the lag sum equals the full width of
the AR-dynamics row (12 for monthly cycles when the annual component is
active), not the classical AR order — the annual coefficient is spread across
the trailing lag positions and must enter the deterministic component of the
inversion to keep the implied noise consistent with the LP's AR row.

The inversion proceeds **sequentially through stages** (each stage updates the
lag buffer for the next):

1. Initialise the lag buffer from `initial_conditions.past_inflows` (see "x₀
   consistency under historical replay" below for the reason this is the only
   admissible seed).
2. For each stage $t$: compute the deterministic PAR component, solve for
   $\eta_t$, update the lag buffer with $a_t^{\text{target}}$.
3. Validate the inverted noise:
   - **Warning** if $|\eta_t| > 4.0$ (extreme noise suggests the external
     scenario deviates significantly from the PAR model)
   - **Error** if $\sigma_m \approx 0$ but the residual
     $a_t^{\text{target}} - \text{deterministic component}$ exceeds a
     tolerance (the PAR model says this series is deterministic, but the
     external scenario disagrees)

After inversion, a JSON validation report is emitted with noise statistics
(mean, std, min, max, extreme count), warnings, and an overall status.

#### x₀ consistency under historical replay

The historical and external schemes share the same SDDP forward pass: the
sampler returns a standardised noise residual $\eta_t$ and the LP reconstructs
the realised inflow from $\eta_t$ together with the lag state carried in the
state vector. The lag state at stage 0 is taken uniformly from
`initial_conditions.past_inflows` for every scenario, matching NEWAVE's
`TENDENCIA HIDROLOGICA` convention.

For the implied $\eta_t$ on a historical window to reconstruct the raw
historical observation exactly when the LP starts from the same $x_0$, the
inversion lag chain must also be rooted at `past_inflows` — not at the
year-preceding raw historical inflows of the window being replayed. If the
inversion is seeded from the window-preceding lags while the LP starts from
`past_inflows`, the two paths build their lag chains from different roots and
produce a systematic per-stage offset of

$$
z_h^{(t)} = a_t^{\text{target}} - a_t^{\text{reconstructed}}
        = \sum_{\ell} \psi_{m,\ell} \cdot \bigl(\text{past\_inflows}_\ell - \text{window\_lag}_\ell\bigr)
$$

that propagates through every stage. This offset prevents exact replay of the
historical observation even at stage 0 and shows up as a structural,
typically-negative gap between the forward upper bound and the lower bound
that does not close with iteration count.

To eliminate this gap, the inversion runs as a **rolling lag chain seeded
from `past_inflows`** and advanced each period via the same
`StageLagTransition` machinery the LP uses for multi-resolution studies
(see [Multi-Resolution Studies](./multi-resolution-studies.md)). For uniform
monthly studies the transitions are trivial — accumulate the current stage's
target inflow, finalise at the end of every period. Sub-monthly and
multi-monthly configurations are out of scope for current releases and are
guarded by an assertion that fires when non-trivial transitions are supplied
to the historical inversion.

The cross-scheme implications are:

- **Historical scheme.** Every scenario starts the forward LP from
  `past_inflows`; the implied $\eta$ rebuilds the raw historical observation
  to within floating-point precision at every stage; the LB and UB evaluate
  $V_0$ at the same $x_0$.
- **External scheme.** Same rolling-chain machinery — the supplied target
  series is inverted relative to `past_inflows` (or the user-supplied initial
  conditions for that class), preserving LB/UB consistency at $x_0$ across all
  forward replays.
- **InSample / OutOfSample.** Unaffected — these schemes do not invert noise
  from observed inflows; they sample $\eta_t$ from the PAR model directly.

A `past_inflows_digest` (a 64-bit SipHash-1-3 fingerprint of every
`past_inflows` value) is stored on the historical library and on the model
provenance report so consumers can detect when a precomputed library has
drifted out of sync with the `past_inflows` currently in use.

### 4.4 External Scenarios in Simulation

When a stochastic class uses the `External` sampling scheme during simulation,
the forward pass returns values directly from the pre-loaded per-class data —
no stochastic computation occurs. The forward pass iterates through the
external scenarios deterministically.

## 5. Load Scenario Generation

### 5.1 Load Uncertainty Model

When `load_seasonal_stats.parquet` is provided, the system generates stochastic
load realizations per (bus, stage) using the stored mean and standard
deviation. Load models are typically **independent** (no AR structure) — each
load realization is drawn as:

$$
d_{b,t} = \mu_{b,t}^{\text{load}} + s_{b,t}^{\text{load}} \cdot \eta_{b,t}^{\text{load}}
$$

where $\eta_{b,t}^{\text{load}} \sim N(0,1)$ is an independent noise term.

When `load_seasonal_stats.parquet` is absent, loads are treated as
deterministic (taken from the demand values in the entity definitions).

### 5.2 Block Load Factors

The base load realization $d_{b,t}$ is a **stage-level** value in MW.
Block-level loads are obtained by applying **multiplicative block factors**:

$$
d_{b,t,k} = d_{b,t} \cdot f_{b,t,k}
$$

where $f_{b,t,k}$ is the block factor from `load_factors.json`. If
`load_factors.json` is absent, all block factors default to 1.0.

### 5.3 Load Correlation

If load entities are included in correlation groups defined in
`correlation.json`, their noise terms are correlated with inflow noise via the
same spectral transform described in section 2.1. Otherwise, load noise is
independent of inflow noise.

## 6. Complete Tree Mode

### 6.1 Concept

In addition to standard SDDP sampling, Cobre supports a **complete tree**
execution mode where the solver explores an explicit scenario tree — every
branching at every stage is visited, with no sampling. This is the approach
used by CEPEL's DECOMP model for short-term hydrothermal dispatch.

In standard SDDP, the forward pass samples one branching per stage, so only a
fraction of the scenario tree is explored per iteration. In complete tree mode,
the full tree is enumerated, and each node corresponds to a deterministic
subproblem. The Benders decomposition is still applied — cuts propagate
backward through the tree — but there is no stochastic sampling; the solution
is exact for the given tree.

### 6.2 Tree Structure

The scenario tree is defined by per-stage branching counts $N_t$ for
$t = 1, \ldots, T$:

- **Total nodes at stage $t$**: $\prod_{s=1}^{t} N_s$
- **Total leaf nodes**: $\prod_{t=1}^{T} N_t$
- **Total tree nodes**: $\sum_{t=1}^{T} \prod_{s=1}^{t} N_s$

Each node at stage $t$ has $N_t$ children, each corresponding to a distinct
realization (noise vector or external scenario value). The branchings at each
stage are drawn from the opening tree (section 2.3), so
$N_t = N_{\text{openings}}$ when using uniform branching, or the tree can have
variable branching factors per stage.

**DECOMP special case:** $N_t = 1$ for all stages except the last ($t = T$),
where $N_T$ equals the number of external scenario branchings. This produces a
deterministic trunk with branching only at the final stage — a common structure
for weekly/monthly short-term planning where uncertainty is resolved at the end
of the horizon.

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

### 6.3 Relationship to SDDP with External Scenarios

Complete tree mode is closely related to standard SDDP with external
scenarios. Consider the case where:

- External scenarios are used in training (section 3.2 External scheme)
- $N_{\text{forward\_passes}} = N_{\text{openings}}$ at the last stage
- All branchings at the last stage are visited exactly once (no repetition)

This configuration approaches a complete tree solution for the last stage. The
key difference is that standard SDDP sampling may repeat or skip branchings,
while complete tree mode guarantees exhaustive coverage.

To bridge the two modes, the forward pass can be configured to **force
exhaustive visitation** — cycling through all branching indices without
replacement rather than sampling with replacement. When combined with a single
forward pass per branching at the final stage, this degenerates exactly into
the complete tree for the DECOMP special case.

### 6.4 Scope and Limitations

Complete tree mode is feasible only when the total number of tree nodes is
computationally tractable. For a 5-stage problem with 20 branchings per stage,
the tree has $20^5 = 3.2$ million leaf nodes — each requiring an LP solve.
Production-scale SDDP problems (60–120 stages) make full trees intractable;
the mode is intended for:

- Short-horizon problems (5–12 stages, weekly resolution)
- DECOMP-like configurations with deterministic trunks and branching only at
  specific stages
- Validation and benchmarking against SDDP solutions on small instances

The complete tree solver integration (tree enumeration, node-to-subproblem
mapping, result aggregation) is not yet implemented.

## Cross-References

- [PAR(p) Inflow Model](./par-inflow-model.md) — Mathematical definition,
  parameter set, stored vs. computed quantities, fitting procedure, spectral
  factorisation rationale, validation invariants
- [Inflow Non-Negativity](./inflow-nonnegativity.md) — Handling of negative
  inflow realizations from PAR sampling
- [SDDP Algorithm](./sddp-algorithm.md) — Forward/backward pass structure,
  cut generation, convergence; references sampling scheme abstraction
  (sections 3.1–3.2)
- [Cut Management](./cut-management.md) — Cut generation, storage, and
  selection; uses opening tree branchings as the backward pass input
- [Multi-Resolution Studies](./multi-resolution-studies.md) — Multi-resolution
  modeling configurations; uses scenario generation with varied stage counts
- [Weekly+Monthly Coupled Studies](./weekly-monthly-coupled-studies.md) —
  Coupled weekly/monthly study configurations; uses complete tree mode and
  DECOMP special case
- [Determinism Guarantees](./determinism-guarantees.md) — Formal guarantees
  of bit-identical reproduction across ranks, restarts, and platform variants;
  grounded in the seed derivation architecture of section 2.2
