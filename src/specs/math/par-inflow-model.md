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
- $\sigma_{m(t)}$: Residual standard deviation for season $m(t)$ (**computed** at runtime — see §3)
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

The data model stores **seasonal sample statistics** and **standardized AR coefficients** with an explicit residual fraction. The relationship between stored and computed quantities is:
![PAR model stored vs computed quantities — files on disk store scale-invariant ψ* and residual_std_ratio, runtime converts to original-unit ψ and σ using seasonal stats](../../images/d23-par-stored-vs-computed.svg)

### Stored in input files

These are provided in `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet` (see [Input Scenarios §3.1–3.2](../data-model/input-scenarios.md)):

| Stored quantity      | Column               | File                     | Symbol              | Description                                                                     |
| -------------------- | -------------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------------- |
| Seasonal sample mean | `mean_m3s`           | `inflow_seasonal_stats`  | $\mu_m = \bar{a}_m$ | Mean of historical observations for season $m$                                  |
| Seasonal sample std  | `std_m3s`            | `inflow_seasonal_stats`  | $s_m$               | Standard deviation of historical observations for season $m$                    |
| AR coefficients      | `coefficient`        | `inflow_ar_coefficients` | $\psi^*_{m,\ell}$   | AR coefficient **standardized by seasonal std** — the direct Yule-Walker output |
| Residual std ratio   | `residual_std_ratio` | `inflow_ar_coefficients` | $\sigma_m / s_m$    | Residual std as fraction of seasonal std, $\in (0, 1]$ — a pure model property  |

The AR order $p_m$ is **not stored explicitly**. It is derived at runtime from the count of coefficient rows per (hydro_id, stage_id) group in `inflow_ar_coefficients.parquet`.

The standardized coefficient $\psi^*_{m,\ell}$ is the direct output of the Yule-Walker fitting procedure (see §5.4). It is dimensionless — the coefficient of the standardized process $(a_{h,t} - \mu_m) / s_m$. The relationship to the original-unit coefficient $\psi_{m,\ell}$ used in the LP is:

$$
\psi_{m,\ell} = \psi^*_{m,\ell} \cdot \frac{s_m}{s_{m-\ell}}
$$

### Computed at runtime

From the stored quantities, the LP requires two additional quantities computed once at initialization:

**Original-unit AR coefficients** (for LP constraint matrix entries):

$$
\psi_{m,\ell} = \psi^*_{m,\ell} \cdot \frac{s_m}{s_{m-\ell}}
$$

**Residual standard deviation** (for noise scaling):

$$
\sigma_m = s_m \cdot \texttt{residual\_std\_ratio}_m
$$

No autocorrelation values are needed at runtime. All required quantities are derived solely from the stored seasonal stats and AR coefficient file.

> **Why store `residual_std_ratio` rather than $\sigma_m$ directly?** The residual std decomposes as $\sigma_m = s_m \cdot \texttt{residual\_std\_ratio}_m$, where $s_m$ is a **conditioning** quantity (swappable for climate scenario studies) and the ratio is a **model dynamics** property (fixed per PAR fit). Storing $\sigma_m$ directly would bake in a specific $s_m$: when the user swaps seasonal stats for a different climate scenario, the stored $\sigma_m$ would be stale and noise scaling would be inconsistent with the new variability level. Storing the ratio preserves correct proportionality — if seasonal variability changes, noise scales proportionally. See also [PAR Coefficient Storage design document](../../design/PAR-COEFFICIENT-REDESIGN.md) §3.4.

### LP coefficients

The stored standardized coefficients $\psi^*_{m,\ell}$ are converted to original-unit $\psi_{m,\ell}$ at runtime (see §7.2), and these enter the LP directly (see [LP Formulation §5](lp-formulation.md)). The LP equation is:

$$
a_h = \underbrace{\left( \mu_m - \sum_{\ell=1}^{p} \psi_{m,\ell} \mu_{m-\ell} \right)}_{\text{deterministic base}}
+ \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot a_{h,\ell}}_{\text{lag contribution}}
+ \underbrace{\sigma_m \cdot \eta_t}_{\text{stochastic innovation}}
$$

where $a_{h,\ell}$ are state variables (lagged inflows) and $\eta_t$ is the sampled noise realization.

## 4. Model Order Selection

The PAR order $p$ can vary by season. Available selection criteria:

### 4.1 PACF (Periodic Partial Autocorrelation Function) -- Default

The default method computes the **periodic PACF** via progressive periodic Yule-Walker matrix solves at orders $k = 1, 2, \ldots, p_{max}$, then selects the order using a significance threshold.

**Algorithm**:

1. For each order $k$ from 1 to $p_{max}$, build and solve the periodic Yule-Walker system (§5.4) at order $k$. The last coefficient $\hat{\psi}^*_{m,k}$ from the order-$k$ solution is the periodic PACF value at lag $k$.
2. Select the order as the **maximum lag with significant PACF**:

   $$
   p_m = \max \left\{ k : |\text{PACF}_m(k)| > \frac{z_\alpha}{\sqrt{N_m}} \right\}
   $$

   where $z_\alpha = 1.96$ (95% confidence) and $N_m$ is the number of observations for season $m$. If no lag is significant, $p_m = 0$ (white noise).

3. Estimate AR coefficients at the selected order using the periodic Yule-Walker system (§5.4).

**Post-selection validation**: After PACF selection, two rejection gates are applied iteratively:

- **Negative $\phi_1$ rejection**: If $\hat{\psi}^*_{m,1} < 0$ (first AR coefficient is negative), the order is reduced. Negative $\phi_1$ contradicts the hydrological persistence property (inflows are positively autocorrelated at lag 1).
- **Contribution-based validation**: The recursively-composed contributions for each lag are computed. If any contribution is negative (indicating potential model instability), the order is reduced to the maximum lag with non-negative contributions. This implements NEWAVE's `reducao_ordem` algorithm.

The reduction process is iterative: after each reduction, the PACF selection and coefficient estimation are re-run at the new ceiling, and the validation checks are repeated until all seasons pass or reach order 0.

### 4.2 AIC (Akaike Information Criterion)

$$
\text{AIC}_m(p) = N_m \ln(\hat{\sigma}_m^2) + 2p
$$

### 4.3 BIC (Bayesian Information Criterion)

$$
\text{BIC}_m(p) = N_m \ln(\hat{\sigma}_m^2) + p \ln(N_m)
$$

### 4.4 Coefficient Significance

Include lag $\ell$ only if $|\hat{\psi}_{m,\ell}| > 2 / \sqrt{N_m}$.

In all methods, $N_m$ is the number of historical observations for season $m$.

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

For each season $m$, the PAR(p) coefficients $\psi_{m,1}^*, \ldots, \psi_{m,p}^*$ in standardized form are found by solving the **periodic Yule-Walker system**. Unlike the classical (stationary) Yule-Walker equations where all rows use the same reference season, the periodic variant shifts the reference season per row. This correctly accounts for the non-Toeplitz covariance structure of periodic autoregressive processes.

**Matrix construction**: For row $i$ and column $j$ (0-indexed, $0 \leq i,j < p$), the reference season is shifted by row index:

$$
[\mathbf{R}_m]_{i,j} = \hat{\rho}_{(m-i) \bmod M}(|j - i|)
$$

where $M$ is the number of seasons in the periodic cycle (e.g., 12 for monthly). The diagonal entries are always 1 (since $\hat{\rho}_{m'}(0) = 1$ for any season $m'$). The matrix is symmetric but **not Toeplitz** when $M > 1$, because each row references a different season for its autocorrelation values.

**RHS construction**: Each RHS element also uses a shifted reference season:

$$
[\boldsymbol{r}_m]_i = \hat{\rho}_{(m-i) \bmod M}(p - i)
$$

This comes from column $p$ of the extended $(p{+}1) \times (p{+}1)$ version of the periodic autocorrelation matrix.

The full system is:

$$
\begin{pmatrix}
1 & \hat{\rho}_{m}(1) & \hat{\rho}_{m}(2) & \cdots & \hat{\rho}_{m}(p{-}1) \\
\hat{\rho}_{(m-1)}(1) & 1 & \hat{\rho}_{(m-1)}(1) & \cdots & \hat{\rho}_{(m-1)}(p{-}2) \\
\hat{\rho}_{(m-2)}(2) & \hat{\rho}_{(m-2)}(1) & 1 & \cdots & \hat{\rho}_{(m-2)}(p{-}3) \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
\hat{\rho}_{(m-p+1)}(p{-}1) & \hat{\rho}_{(m-p+1)}(p{-}2) & \hat{\rho}_{(m-p+1)}(p{-}3) & \cdots & 1
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
\hat{\rho}_{m}(p) \\
\hat{\rho}_{(m-1)}(p{-}1) \\
\hat{\rho}_{(m-2)}(p{-}2) \\
\vdots \\
\hat{\rho}_{(m-p+1)}(1)
\end{pmatrix}
$$

where all season indices are taken modulo $M$.

In matrix notation: $\mathbf{R}_m \boldsymbol{\psi}_m^* = \boldsymbol{r}_m$

where:

- $\mathbf{R}_m$ is the $p \times p$ periodic correlation matrix (symmetric but not Toeplitz for $M > 1$)
- $\boldsymbol{r}_m$ is the vector of target autocorrelations with per-row reference season shifting

> **Note**: For a single-season model ($M = 1$), all rows use the same reference season and the matrix reduces to the classical Toeplitz Yule-Walker matrix. The periodic formulation is the general case that correctly handles multi-season (e.g., monthly) data.

**Solution**:

$$
\hat{\boldsymbol{\psi}}_m^* = \mathbf{R}_m^{-1} \boldsymbol{r}_m
$$

The system is solved via Gaussian elimination with partial pivoting (for small systems with $p \leq 10$, this is numerically adequate).

### 5.5 Step 4 — Store Standardized Coefficients and Residual Fraction

The Yule-Walker solution $\psi_{m,\ell}^*$ is in standardized form — the direct output of step 3. It is stored as-is in `inflow_ar_coefficients.parquet`. No conversion to original units is performed.

Compute and store the residual std ratio:

$$
\widehat{\texttt{residual\_std\_ratio}}_m = \sqrt{1 - \boldsymbol{\psi}_m^{*\top} \boldsymbol{r}_m} = \sqrt{1 - \sum_{\ell=1}^{p} \psi_{m,\ell}^* \cdot \hat{\rho}_m(\ell)}
$$

Both $\psi^*_{m,\ell}$ (one row per lag) and $\widehat{\texttt{residual\_std\_ratio}}_m$ (repeated across all lag rows of the same (hydro, stage) group) are written to `inflow_ar_coefficients.parquet`.

### 5.6 Step 5 — Residual Standard Deviation

The residual standard deviation for season $m$ is recovered at runtime from the stored ratio (see §3):

$$
\hat{\sigma}_m = \hat{s}_m \cdot \widehat{\texttt{residual\_std\_ratio}}_m
$$

For reference, the full expression in terms of fitting quantities is:

$$
\hat{\sigma}_m = \hat{s}_m \sqrt{1 - \boldsymbol{r}_m^\top \mathbf{R}_m^{-1} \boldsymbol{r}_m}
$$

## 6. Validation Invariants

After fitting or loading pre-computed parameters, the following invariants must hold:

1. **Positive residual variance**: $\sigma_m^2 > 0$ for all seasons. If violated, the AR model explains all variance — likely overfitting.
2. **Stationarity**: Roots of $1 - \sum_\ell \psi_{m,\ell} z^\ell = 0$ lie outside the unit circle. Ensures the AR process is stable and does not diverge.
3. **Correlation matrix positive definite**: $\mathbf{R}_m$ is invertible. Required for Yule-Walker solution to exist. If violated, the historical record may be too short for the requested AR order.
4. **No systematic bias**: Residuals $\varepsilon_t$ have mean near zero. Indicates the model captures the mean structure correctly.
5. **AR order derivation**: The number of coefficient rows per (hydro_id, stage_id) in `inflow_ar_coefficients.parquet` determines the AR order $p_m$. Lags must be contiguous: $\{1, 2, \ldots, p_m\}$.
6. **Residual std ratio consistency**: The `residual_std_ratio` value must be identical across all lag rows sharing the same (hydro_id, stage_id) group, and must lie in $(0, 1]$.

## 7. PAR-to-LP Transformation

This section derives the explicit algebraic transformation from the canonical PAR(p) model (section 1) into the form consumed by the LP subproblem. The derivation identifies three precomputable components that are cached once at initialization and reused at every forward-pass stage transition.

### 7.1 Canonical Standardized Form

The PAR(p) model (section 1) operates on deviations from the seasonal mean, scaled by the seasonal standard deviation. In fully standardized form:

$$
\frac{a_{h,t} - \mu_{m(t)}}{\sigma_{m(t)}} = \sum_{\ell=1}^{p} \phi_{m(t),\ell} \frac{a_{h,t-\ell} - \mu_{m(t-\ell)}}{\sigma_{m(t-\ell)}} + \varepsilon_t
$$

where:

- $\phi_{m(t),\ell}$: AR coefficients in **fully standardized** form (correlations between normalized deviations)
- $\sigma_{m(t)}$: residual standard deviation for season $m(t)$ (derived at runtime — see §3)
- $\varepsilon_t \sim \mathcal{N}(0, 1)$: innovation noise

The input files store $\psi^*_{m,\ell}$ (standardized by seasonal std $s_m$, not residual std $\sigma_m$). The next step converts these to original-unit $\psi_{m,\ell}$ for use in the LP.

### 7.2 Coefficient Conversion

The stored standardized coefficients $\psi^*_{m,\ell}$ are converted to original-unit coefficients $\psi_{m,\ell}$ at runtime using the seasonal standard deviations from `inflow_seasonal_stats.parquet`:

$$
\psi_{m,\ell} = \psi^*_{m,\ell} \cdot \frac{s_m}{s_{m-\ell}}
$$

The residual standard deviation is also derived at this preprocessing step:

$$
\sigma_m = s_m \cdot \texttt{residual\_std\_ratio}_m
$$

These conversions are performed once at LP construction time. They require only the seasonal stats ($s_m$) and the stored model quantities ($\psi^*_{m,\ell}$, $\texttt{residual\_std\_ratio}_m$) — no autocorrelation values, no historical data.

### 7.3 LP-Ready Form

Multiplying both sides of the canonical form (7.1) by $\sigma_{m(t)}$ and rearranging yields the LP-ready equation:

$$
a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + \left[ \mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)} \right] + \sigma_{m(t)} \cdot \varepsilon_t
$$

where $\psi_{m(t),\ell}$ and $\sigma_{m(t)}$ are derived from stored quantities as described in §7.2.

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

The lagged inflows $a_{h,t-\ell}$ are **LP variables**, not substituted values. In the LP (see [LP Formulation §5](lp-formulation.md)), they appear with coefficients $-\psi_{m(t),\ell}$ in the AR dynamics constraint row, and separate equality constraints fix each lag variable to its incoming state value (see [LP Formulation §5a](lp-formulation.md)):

$$
a_{h,t-\ell} = \hat{a}_{h,t-\ell}
$$

where $\hat{a}_{h,t-\ell}$ is patched per scenario to the actual lagged inflow from the trajectory record.

Because the lag contribution $\sum_\ell \psi \cdot a_{h,t-\ell}$ is carried by the constraint matrix (not the RHS), the AR dynamics constraint RHS reduces to:

$$
\text{RHS}_{h,t} = b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $b_{h,m(t)}$ is read from `PrecomputedParLp.deterministic_base[stage][hydro]`
- $\sigma_{m(t)}$ is read from `PrecomputedParLp.sigma[stage][hydro]`
- $\varepsilon_t$ is the scenario noise draw for this (stage, hydro)

The $\psi_{m(t),\ell}$ coefficients from `PrecomputedParLp.psi[stage][hydro][lag]` are written into the constraint matrix **once at LP construction time** as the coefficients on the lagged inflow variables; they are not recomputed per scenario.

No division, no mean subtraction, no repeated coefficient transformation — the precomputation in `PrecomputedParLp` eliminates all redundant arithmetic from the hot path.

### 7.6 Summary of LP Components

| Component          | Symbol             | Shape per stage      | LP Role                                   | Source                                                          |
| ------------------ | ------------------ | -------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Lag coefficients   | $\psi_{m(t),\ell}$ | One per (hydro, lag) | Constraint matrix (AR dynamics row)       | Derived from stored $\psi^*$ and $s_m$ at initialization (§7.2) |
| Deterministic base | $b_{h,m(t)}$       | One per hydro        | AR dynamics constraint RHS (fixed term)   | Precomputed from $\mu$ and $\psi$                               |
| Noise scale        | $\sigma_{m(t)}$    | One per hydro        | AR dynamics constraint RHS (noise factor) | Derived from stored ratio and $s_m$ at initialization (§7.2)    |

## 8. Annual Component Extension (PAR(p)-A)

The classical PAR(p) model (§1) encodes hydrological memory only through its $p$ monthly lags. When
the historical record exhibits persistent multi-year wet or dry episodes, $p$ monthly lags are
insufficient: the model reverts toward the seasonal mean within a few periods. The
**PAR(p)-A extension** adds one additional regressor — the rolling 12-month average inflow
$\bar{A}_{h,t-1}$ — that explicitly captures the annual-scale hydrological tendency without
requiring a very high AR order.

### 8.1 Model Definition

For hydro $h$ at stage $t$ with season $m = m(t)$, the PAR(p)-A model is:

$$
a_{h,t} = \mu_m + \sum_{\ell=1}^{p} \phi_{m,\ell} \left( a_{h,t-\ell} - \mu_{m-\ell} \right)
         + \psi_m \left( \bar{A}_{h,t-1} - \mu^A_m \right) + \sigma_m \varepsilon_t
$$

where:

- $\phi_{m,\ell}$: periodic AR coefficient for lag $\ell$ and season $m$ (same role as $\psi_{m,\ell}$
  in §1; the notation distinguishes the classical lags from the annual coefficient below)
- $\psi_m$: **annual component coefficient** for season $m$, expressed in the standardized
  space of $\bar{A}$
- $\bar{A}_{h,t-1}$: rolling 12-month average inflow at hydro $h$, centered on the period
  immediately preceding stage $t$:

$$
\bar{A}_{h,t-1} = \frac{1}{12} \sum_{\tau=1}^{12} a_{h,t-\tau}
$$

- $\mu^A_m$: seasonal mean of $\bar{A}$ for season $m$ (see §8.2)
- $\sigma_m$: residual standard deviation, same as in the classical model (§3)
- $\varepsilon_t \sim \mathcal{N}(0,1)$: innovation noise

When $\psi_m = 0$ the model reduces exactly to the classical PAR(p) (§1).

### 8.2 Sample Statistics of the Annual Component

To estimate $\psi_m$ and to convert it to original units, two seasonal statistics of $\bar{A}$ are
required: its mean $\mu^A_m$ and its standard deviation $\sigma^A_m$.

**Rolling average series.** For each hydro $h$ and chronological index $i$ (0-based), define:

$$
A_i = \frac{1}{12} \sum_{j=0}^{11} a_{h,i-j}
$$

The target date of $A_i$ is the date of observation $i$. This value is associated with the season
of observation $i$.

**Seasonal statistics.** For $N^A_m$ rolling-average values falling in season $m$:

$$
\hat{\mu}^A_m = \frac{1}{N^A_m} \sum_{i : m(i) = m} A_i
$$

$$
\hat{\sigma}^A_m = \sqrt{\frac{1}{N^A_m - 1} \sum_{i : m(i) = m} \left( A_i - \hat{\mu}^A_m \right)^2}
$$

> **Note: Bessel correction divergence from the source literature.** The formula above uses
> divisor $N^A_m - 1$ (Bessel-corrected sample standard deviation). The original PAR(p)-A
> derivation (CEPEL DEA-1416/2020, eq. 18) uses the population divisor $N^A_m$. This
> implementation intentionally diverges to match the `1/(N-1)` convention used throughout
> the workspace by `estimate_seasonal_stats` (see §5.2). The two values differ by a factor
> of $\sqrt{N^A_m / (N^A_m - 1)}$, which is negligible at typical historical sample sizes
> ($N^A_m \geq 20$) but will produce a systematic discrepancy when cross-checking against
> NEWAVE numerical outputs that follow the population formula.

### 8.3 Extended Yule-Walker System

Fitting the PAR(p)-A model requires estimating $p + 1$ unknowns per season: the $p$ classical AR
coefficients $\phi^*_{m,1}, \ldots, \phi^*_{m,p}$ (in standardized form) and the annual coefficient
$\psi_m$. The system in §5.4 is extended by one equation and one unknown.

The $(p+1) \times (p+1)$ extended periodic Yule-Walker matrix for season $m$ appends a row and
column for the cross-correlations between the monthly series $z_t = (a_{h,t} - \mu_m) / s_m$ and
the rolling annual series. Concretely, two additional correlation quantities are needed:

**Cross-correlation $\rho^{m-1}_{Z,A}(k-1)$** (last column of the AR block rows): the
correlation between $z_{t-k}$ and $\bar{A}_{t-1}$, at reference season $m-1$.

**Cross-correlation $\rho^{m-1}_{Z,A}(-1)$** (bottom-right element): the correlation between
$\bar{A}_{t-1}$ and $z_t$, at reference season $m-1$.

The solution vector $(\phi^*_{m,1}, \ldots, \phi^*_{m,p}, \psi_m)^\top$ is obtained by solving
this extended system; the details of the full matrix structure follow directly from the periodic
extension in §5.4.

### 8.4 Original-Unit Reduction

The annual component coefficient $\psi_m$ from the Yule-Walker solution is expressed in the
standardized space of $\bar{A}$. To enter the LP, it must be converted to the same
original-unit (m³/s) space as the classical AR coefficients. Define:

$$
\hat{\psi}_m = \psi_m \cdot \frac{\sigma_m}{\hat{\sigma}^A_m}
$$

where $\hat{\sigma}^A_m$ is the seasonal standard deviation of $\bar{A}$ from §8.2 and
$\sigma_m$ is the residual standard deviation of the monthly series. $\hat{\psi}_m$ is the
annual component coefficient in original units.

**Why the rolling average collapses to per-lag coefficients.** The key observation is that
$\bar{A}_{h,t-1}$ is a uniform-weight linear combination of the 12 most recent monthly inflows:

$$
\bar{A}_{h,t-1} = \frac{1}{12} \sum_{j=1}^{12} a_{h,t-j}
$$

Substituting this into the PAR(p)-A model equation (§8.1) and collecting terms by lag, the
annual regressor contributes $\hat{\psi}_m / 12$ to the coefficient on every lag $j \in \{1, \ldots, 12\}$.
Combined with the classical AR contribution $\hat{\phi}_{m,j}$ (which is non-zero only for
$j \leq p$), the effective per-lag coefficient $\tilde{\phi}_{m,j}$ entering the LP is:

$$
\tilde{\phi}_{m,j} = \hat{\phi}_{m,j} + \frac{\hat{\psi}_m}{12}, \quad j \leq p
$$

$$
\tilde{\phi}_{m,j} = \frac{\hat{\psi}_m}{12}, \quad p < j \leq 12
$$

where the original-unit classical coefficient is:

$$
\hat{\phi}_{m,j} = \phi^*_{m,j} \cdot \frac{s_m}{s_{m-j}}
$$

This reduction is exact: no approximation is introduced. The LP therefore requires a stride of 12
coefficient slots per (stage, hydro) pair when the annual component is active, even when the
classical AR order $p < 12$.

### 8.5 LP Integration via State-Fixing Rows

The reduction in §8.4 is the load-bearing architectural insight that allows the PAR(p)-A
extension to integrate with the existing LP structure at zero cost to the SDDP cut-extraction
layer.

In the LP formulation (§7), each lagged inflow $a_{h,t-j}$ is already a dedicated state
variable, fixed by an equality constraint (a "state-fixing row") to its incoming scenario value
$\hat{a}_{h,t-j}$:

$$
a_{h,t-j} = \hat{a}_{h,t-j}, \quad j = 1, \ldots, p
$$

The PAR(p)-A extension widens this set to $j = 1, \ldots, 12$: each of the 12 monthly lags
required by the rolling average is already — or is now — a state variable. Their coefficients in
the AR dynamics constraint row are the reduced values $\tilde{\phi}_{m,j}$ from §8.4.

**Chain-rule propagation through duals.** Because the contribution of $\bar{A}_{h,t-1}$ has
been collapsed into per-lag coefficients on existing state variables, the dual of each
state-fixing row automatically carries the full chain-rule contribution of the annual component.
No additional dual variables or cut-extraction logic are needed. When the SDDP backward pass
collects the dual on row $j$ to form a Benders cut gradient, it already includes the
$\hat{\psi}_m / 12$ share from the annual term.

Concretely, the cut gradient entry for lag $j$ (as seen by the SDDP cut-extraction layer) is:

$$
\frac{\partial Q}{\partial a_{h,t-j}} = \lambda_j, \quad j = 1, \ldots, 12
$$

where $\lambda_j$ is the dual of the state-fixing equality for lag $j$. For $j \leq p$ this
dual reflects both the classical AR dynamics and the annual contribution; for $p < j \leq 12$ it
reflects the annual contribution alone. The cut-extraction layer does not distinguish these two
cases — it reads 12 duals and assembles the cut in the same way regardless of whether
the annual component is active.

### 8.6 Cross-References

- §3 (Stored vs. Computed Quantities) — The seasonal std $s_m$ and the residual std ratio
  $\sigma_m / s_m$ used in the unit conversion $\hat{\phi}_{m,j} = \phi^*_{m,j} \cdot s_m / s_{m-j}$
  are the same stored quantities as for the classical model.
- §5.4 (Yule-Walker Equations) — The extended PAR(p)-A Yule-Walker system (§8.3) is a direct
  augmentation of the periodic system in §5.4, appending one row and one column for the annual
  cross-correlations.
- §7 (PAR-to-LP Transformation) — The LP structure (constraint matrix entries, RHS patching,
  `PrecomputedParLp` layout) described in §7 is unchanged. The PAR(p)-A extension only widens
  the coefficient stride from $p$ to 12 and populates the additional slots with $\hat{\psi}_m / 12$.

## Cross-References

- [Input Scenarios §3.1–3.2](../data-model/input-scenarios.md) — Defines `inflow_seasonal_stats.parquet` (μ, s) and `inflow_ar_coefficients.parquet` (ψ\* per lag, residual_std_ratio)
- [LP Formulation §5](lp-formulation.md) — AR inflow dynamics in the LP: state expansion, lag fixing constraints, dual variables
- [Internal Structures §14](../data-model/internal-structures.md) — `PrecomputedParLp` struct caching the three LP components derived in section 7
- [Inflow Non-Negativity](inflow-nonnegativity.md) — Methods for handling negative realizations produced by the PAR(p) model
- [Scenario Generation §4.2](../architecture/scenario-generation.md) — When external scenarios are used in training, a PAR model is fitted to the external data for backward pass opening tree generation. The fitting procedure (§5 above) applies equally to this derived model.
- [Notation Conventions](../overview/notation-conventions.md) — Defines inflow symbols ($a_{h,t}$, $\mu_m$, $\psi_{m,\ell}$, $\sigma_m$) and unit conventions
