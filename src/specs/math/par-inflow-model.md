# PAR(p) Inflow Model

## Purpose

This spec defines the Periodic Autoregressive model of order $p$ (PAR(p)) used to capture temporal correlation in inflow time series, including the model definition, parameter semantics, the relationship between stored and computed quantities, the fitting procedure, model order selection, and validation invariants.

## 1. Model Definition

The **Periodic Autoregressive model of order p** (PAR(p)) captures temporal correlation in inflow time series while accounting for seasonal variation in parameters. For hydro $h$ at stage $t$ corresponding to season $m(t)$:

$$
a_{h,t} = \mu_{m(t)} + \sum_{\ell=1}^{p} \psi_{m(t),\ell} \left( a_{h,t-\ell} - \mu_{m(t-\ell)} \right) + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $a_{h,t}$: Incremental inflow at stage $t$ (m³/s)
- $\mu_{m(t)}$: Seasonal mean for season $m(t)$
- $\psi_{m(t),\ell}$: Autoregressive coefficient for lag $\ell$ in season $m(t)$
- $\sigma_{m(t)}$: Residual standard deviation for season $m(t)$ (**computed**, not stored — see §3)
- $\varepsilon_t \sim \mathcal{N}(0, 1)$: Innovation (standardized noise)
- $m(t)$: Season index for stage $t$ (e.g., month 1–12)

The model order $p$ can vary by season and by hydro plant.

## 2. Parameter Set

For each hydro $h$ and each season $m \in \{1, \ldots, M\}$ (e.g., $M = 12$ for monthly, $M = 52$ for weekly), the complete PAR(p) model requires:

| Parameter                   | Symbol                           | Description                 |
| --------------------------- | -------------------------------- | --------------------------- |
| Seasonal mean               | $\mu_m$                          | Mean inflow for season $m$  |
| AR coefficients             | $\psi_{m,1}, \ldots, \psi_{m,p}$ | Autoregressive coefficients |
| Residual standard deviation | $\sigma_m$                       | Scale of innovation term    |

## 3. Stored vs. Computed Quantities

The data model stores **seasonal sample statistics**, not the full set of derived parameters. The relationship between stored and computed quantities is:

### Stored in input files

These are provided in `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet` (see [Input Scenarios §3.1–3.2](../data-model/input-scenarios.md)):

| Stored quantity      | Column        | Symbol              | Description                                                  |
| -------------------- | ------------- | ------------------- | ------------------------------------------------------------ |
| Seasonal sample mean | `mean_m3s`    | $\mu_m = \bar{a}_m$ | Mean of historical observations for season $m$               |
| Seasonal sample std  | `std_m3s`     | $s_m$               | Standard deviation of historical observations for season $m$ |
| AR order             | `ar_order`    | $p_m$               | Number of AR lags for this (hydro, season)                   |
| AR coefficients      | `coefficient` | $\psi_{m,\ell}$     | Autoregressive coefficient for lag $\ell$ in season $m$      |

### Computed at runtime

The **residual standard deviation** $\sigma_m$ is not stored. It is derived from the stored quantities during model initialization. Since the stored coefficients $\psi_{m,\ell}$ are in original units, the runtime first reverse-transforms them to standardized form:

$$
\psi_{m,\ell}^* = \psi_{m,\ell} \cdot \frac{s_{m-\ell}}{s_m}
$$

Then computes the residual standard deviation:

$$
\sigma_m = s_m \sqrt{1 - \sum_{\ell=1}^{p} \psi_{m,\ell}^* \cdot \hat{\rho}_m(\ell)}
$$

> **Why not store $\sigma_m$?** The seasonal sample statistics ($\mu_m$, $s_m$) and original-unit AR coefficients ($\psi_{m,\ell}$) are the natural outputs of standard fitting tools (e.g., Yule-Walker). The residual std $\sigma_m$ is a derived quantity — storing it would create redundancy and a risk of inconsistency. Computing it is inexpensive and guarantees consistency.

### LP coefficients

The stored AR coefficients are already in original units, so they enter the LP directly (see [LP Formulation §5](lp-formulation.md)). The LP equation is:

$$
a_h = \underbrace{\left( \mu_m - \sum_{\ell=1}^{p} \psi_{m,\ell} \mu_{m-\ell} \right)}_{\text{deterministic base}}
+ \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell}}_{\text{lag contribution}}
+ \underbrace{\sigma_m \cdot \eta_t}_{\text{stochastic innovation}}
$$

where $a_{h,\ell}$ are state variables (lagged inflows) and $\eta_t$ is the sampled noise realization.

## 4. Model Order Selection

The PAR order $p$ can vary by season. Available selection criteria:

1. **AIC (Akaike Information Criterion)**:

   $$
   \text{AIC}_m(p) = N_m \ln(\hat{\sigma}_m^2) + 2p
   $$

2. **BIC (Bayesian Information Criterion)**:

   $$
   \text{BIC}_m(p) = N_m \ln(\hat{\sigma}_m^2) + p \ln(N_m)
   $$

3. **Coefficient significance**: Include lag $\ell$ only if $|\hat{\psi}_{m,\ell}| > 2 / \sqrt{N_m}$

where $N_m$ is the number of historical observations for season $m$.

## 5. Fitting Procedure

This section documents the five-step procedure for fitting PAR(p) parameters from historical inflow data. The fitting is performed when the system derives parameters from `inflow_history.parquet` (see [Input Scenarios §2](../data-model/input-scenarios.md)). When pre-computed parameters are provided directly in `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet`, this procedure is not executed.

### 5.1 Notation

Let $Y_m = \{a_{h,t} : m(t) = m\}$ be the historical observations for season $m$. Define:

| Symbol           | Description                                  |
| ---------------- | -------------------------------------------- |
| $N_m$            | Number of observations for season $m$        |
| $\bar{a}_m$      | Sample mean for season $m$                   |
| $s_m$            | Sample standard deviation for season $m$     |
| $\gamma_m(\ell)$ | Autocovariance at lag $\ell$ for season $m$  |
| $\rho_m(\ell)$   | Autocorrelation at lag $\ell$ for season $m$ |

### 5.2 Step 1 — Seasonal Means and Standard Deviations

**Seasonal Mean**:

$$
\hat{\mu}_m = \bar{a}_m = \frac{1}{N_m} \sum_{t: m(t) = m} a_{h,t}
$$

**Seasonal Standard Deviation**:

$$
\hat{s}_m = \sqrt{\frac{1}{N_m - 1} \sum_{t: m(t) = m} (a_{h,t} - \bar{a}_m)^2}
$$

### 5.3 Step 2 — Seasonal Autocorrelations

The autocorrelation at lag $\ell$ for season $m$ is computed from standardized deviations.

**Cross-seasonal autocovariance**:

For observations at season $m$ with lag $\ell$ reaching back to season $m - \ell$ (mod $M$, where $M$ is the cycle length):

$$
\hat{\gamma}_m(\ell) = \frac{1}{N_m - 1} \sum_{t: m(t) = m} \left( a_{h,t} - \bar{a}_m \right) \left( a_{h,t-\ell} - \bar{a}_{m-\ell} \right)
$$

**Autocorrelation**:

$$
\hat{\rho}_m(\ell) = \frac{\hat{\gamma}_m(\ell)}{\hat{s}_m \cdot \hat{s}_{m-\ell}}
$$

where $\hat{s}_{m-\ell}$ is the standard deviation of season $m - \ell$ (cyclically, so season 0 = season $M$).

### 5.4 Step 3 — Yule-Walker Equations

For each season $m$, the PAR(p) coefficients $\psi_{m,1}^*, \ldots, \psi_{m,p}^*$ in standardized form are found by solving the **Yule-Walker system**:

$$
\begin{pmatrix}
1 & \hat{\rho}_{m-1}(1) & \hat{\rho}_{m-2}(2) & \cdots & \hat{\rho}_{m-p+1}(p-1) \\
\hat{\rho}_{m}(1) & 1 & \hat{\rho}_{m-1}(1) & \cdots & \hat{\rho}_{m-p+2}(p-2) \\
\hat{\rho}_{m}(2) & \hat{\rho}_{m-1}(1) & 1 & \cdots & \hat{\rho}_{m-p+3}(p-3) \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
\hat{\rho}_{m}(p-1) & \hat{\rho}_{m-1}(p-2) & \hat{\rho}_{m-2}(p-3) & \cdots & 1
\end{pmatrix}
\begin{pmatrix}
\psi_{m,1}^* \\
\psi_{m,2}^* \\
\psi_{m,3}^* \\
\vdots \\
\psi_{m,p}^*
\end{pmatrix}
=
\begin{pmatrix}
\hat{\rho}_{m}(1) \\
\hat{\rho}_{m}(2) \\
\hat{\rho}_{m}(3) \\
\vdots \\
\hat{\rho}_{m}(p)
\end{pmatrix}
$$

In matrix notation: $\mathbf{R}_m \boldsymbol{\psi}_m^* = \boldsymbol{r}_m$

where:

- $\mathbf{R}_m$ is the $p \times p$ correlation matrix (Toeplitz-like but with cross-seasonal correlations)
- $\boldsymbol{r}_m = (\hat{\rho}_m(1), \ldots, \hat{\rho}_m(p))^\top$ is the vector of target autocorrelations

**Solution**:

$$
\hat{\boldsymbol{\psi}}_m^* = \mathbf{R}_m^{-1} \boldsymbol{r}_m
$$

### 5.5 Step 4 — Convert to Original Units

The Yule-Walker solution $\psi_{m,\ell}^*$ is for standardized variables. Convert back to original units:

$$
\hat{\psi}_{m,\ell} = \psi_{m,\ell}^* \cdot \frac{\hat{s}_m}{\hat{s}_{m-\ell}}
$$

### 5.6 Step 5 — Residual Standard Deviation

The residual variance for season $m$ is:

$$
\hat{\sigma}_m^2 = \hat{s}_m^2 \left( 1 - \sum_{\ell=1}^{p} \psi_{m,\ell}^* \cdot \hat{\rho}_m(\ell) \right)
$$

The residual standard deviation:

$$
\hat{\sigma}_m = \hat{s}_m \sqrt{1 - \boldsymbol{r}_m^\top \mathbf{R}_m^{-1} \boldsymbol{r}_m}
$$

## 6. Validation Invariants

After fitting or loading pre-computed parameters, the following invariants must hold:

1. **Positive residual variance**: $\sigma_m^2 > 0$ for all seasons. If violated, the AR model explains all variance — likely overfitting.
2. **Stationarity**: Roots of $1 - \sum_\ell \psi_{m,\ell} z^\ell = 0$ lie outside the unit circle. Ensures the AR process is stable and does not diverge.
3. **Correlation matrix positive definite**: $\mathbf{R}_m$ is invertible. Required for Yule-Walker solution to exist. If violated, the historical record may be too short for the requested AR order.
4. **No systematic bias**: Residuals $\varepsilon_t$ have mean near zero. Indicates the model captures the mean structure correctly.
5. **AR order consistency**: The number of coefficient rows per (hydro_id, stage_id) in `inflow_ar_coefficients.parquet` matches the `ar_order` in `inflow_seasonal_stats.parquet`.

## 7. PAR-to-LP Transformation

This section derives the explicit algebraic transformation from the canonical PAR(p) model (section 1) into the form consumed by the LP subproblem. The derivation identifies three precomputable components that are cached once at initialization and reused at every forward-pass stage transition.

### 7.1 Canonical Standardized Form

The PAR(p) model (section 1) operates on deviations from the seasonal mean, scaled by the seasonal standard deviation. In fully standardized form:

$$
\frac{a_{h,t} - \mu_{m(t)}}{\sigma_{m(t)}} = \sum_{\ell=1}^{p} \phi_{m(t),\ell} \frac{a_{h,t-\ell} - \mu_{m(t-\ell)}}{\sigma_{m(t-\ell)}} + \varepsilon_t
$$

where:

- $\phi_{m(t),\ell}$: AR coefficients in **standardized** form (correlations between normalized deviations)
- $\sigma_{m(t)}$: residual standard deviation for season $m(t)$ (section 3)
- $\varepsilon_t \sim \mathcal{N}(0, 1)$: innovation noise

The coefficients $\psi_{m,\ell}$ stored in the input files (section 2) are already in **original units**, not standardized. The relationship between the two forms is established in the next step.

### 7.2 Coefficient Conversion

The standardized coefficients $\phi_{m,\ell}$ and the original-unit coefficients $\psi_{m,\ell}$ are related by:

$$
\psi_{m(t),\ell} = \phi_{m(t),\ell} \cdot \frac{\sigma_{m(t)}}{\sigma_{m(t-\ell)}}
$$

This is the inverse of the reverse transformation in section 3: $\phi_{m,\ell} = \psi_{m,\ell} \cdot s_{m-\ell} / s_m$. Since the stored coefficients are already in original units, no conversion is needed at runtime — the LP uses $\psi_{m,\ell}$ directly.

### 7.3 LP-Ready Form

Multiplying both sides of the canonical form (7.1) by $\sigma_{m(t)}$ and rearranging yields the LP-ready equation:

$$
a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + \left[ \mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)} \right] + \sigma_{m(t)} \cdot \varepsilon_t
$$

This decomposes the inflow into three additive components:

1. **Lag contribution**: $\displaystyle\sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell}$ — linear function of past inflows (state variables or known values)
2. **Deterministic base**: $\displaystyle\mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}$ — constant offset per (stage, hydro), precomputed once
3. **Stochastic innovation**: $\sigma_{m(t)} \cdot \varepsilon_t$ — noise draw scaled by the seasonal residual standard deviation

### 7.4 Deterministic Base

The deterministic base is defined as:

$$
b_{h,m(t)} = \mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}
$$

This is a precomputed constant per (stage, hydro) pair. It absorbs the mean-adjustment arithmetic that would otherwise be repeated at every forward-pass stage transition. With this definition, the LP-ready form (7.3) simplifies to:

$$
a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t
$$

### 7.5 LP RHS Patching Operation

At each forward-pass stage transition, the solver patches the LP right-hand side for the inflow balance constraint. Using the `PrecomputedParLp` cache (defined in [Internal Structures §14](../data-model/internal-structures.md)), this reduces to a single multiply-add sequence:

$$
\text{RHS}_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $\psi_{m(t),\ell}$ are read from `PrecomputedParLp.psi[stage][hydro][lag]`
- $b_{h,m(t)}$ is read from `PrecomputedParLp.deterministic_base[stage][hydro]`
- $\sigma_{m(t)}$ is read from `PrecomputedParLp.sigma[stage][hydro]`
- $a_{h,t-\ell}$ are the lagged inflow values from the current state
- $\varepsilon_t$ is the scenario noise draw for this (stage, hydro)

No division, no mean subtraction, no repeated coefficient transformation — the precomputation in `PrecomputedParLp` eliminates all redundant arithmetic from the hot path.

### 7.6 Summary of LP Components

| Component          | Symbol             | Shape per stage      | Source                                |
| ------------------ | ------------------ | -------------------- | ------------------------------------- |
| Lag coefficients   | $\psi_{m(t),\ell}$ | One per (hydro, lag) | Stored in input files (section 2)     |
| Deterministic base | $b_{h,m(t)}$       | One per hydro        | Precomputed from $\mu$ and $\psi$     |
| Noise scale        | $\sigma_{m(t)}$    | One per hydro        | Derived at initialization (section 3) |

## Cross-References

- [Input Scenarios §3.1–3.2](../data-model/input-scenarios.md) — Defines `inflow_seasonal_stats.parquet` (μ, s, ar_order) and `inflow_ar_coefficients.parquet` (ψ per lag)
- [LP Formulation §5](lp-formulation.md) — AR inflow dynamics in the LP: state expansion, lag fixing constraints, dual variables
- [Internal Structures §14](../data-model/internal-structures.md) — `PrecomputedParLp` struct caching the three LP components derived in section 7
- [Inflow Non-Negativity](inflow-nonnegativity.md) — Methods for handling negative realizations produced by the PAR(p) model
- [Scenario Generation §4.2](../architecture/scenario-generation.md) — When external scenarios are used in training, a PAR model is fitted to the external data for backward pass opening tree generation. The fitting procedure (§5 above) applies equally to this derived model.
- [Notation Conventions](../overview/notation-conventions.md) — Defines inflow symbols ($a_{h,t}$, $\mu_m$, $\psi_{m,\ell}$, $\sigma_m$) and unit conventions
