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
- $\sigma_{m(t)}$: Residual standard deviation for season $m(t)$ (**computed** at runtime — see section 3)
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

These are provided in `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet`:

| Stored quantity      | Column               | File                     | Symbol              | Description                                                                     |
| -------------------- | -------------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------------- |
| Seasonal sample mean | `mean_m3s`           | `inflow_seasonal_stats`  | $\mu_m = \bar{a}_m$ | Mean of historical observations for season $m$                                  |
| Seasonal sample std  | `std_m3s`            | `inflow_seasonal_stats`  | $s_m$               | Standard deviation of historical observations for season $m$                    |
| AR coefficients      | `coefficient`        | `inflow_ar_coefficients` | $\psi^*_{m,\ell}$   | AR coefficient **standardized by seasonal std** — the direct Yule-Walker output |
| Residual std ratio   | `residual_std_ratio` | `inflow_ar_coefficients` | $\sigma_m / s_m$    | Residual std as fraction of seasonal std, $\in (0, 1]$ — a pure model property  |

The AR order $p_m$ is **not stored explicitly**. It is derived at runtime from the count of coefficient rows per (hydro_id, stage_id) group in `inflow_ar_coefficients.parquet`.

The standardized coefficient $\psi^*_{m,\ell}$ is the direct output of the Yule-Walker fitting procedure (see section 5.4). It is dimensionless — the coefficient of the standardized process $(a_{h,t} - \mu_m) / s_m$. The relationship to the original-unit coefficient $\psi_{m,\ell}$ used in the LP is:

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

> **Why store `residual_std_ratio` rather than $\sigma_m$ directly?** The residual std decomposes as $\sigma_m = s_m \cdot \texttt{residual\_std\_ratio}_m$, where $s_m$ is a **conditioning** quantity (swappable for climate scenario studies) and the ratio is a **model dynamics** property (fixed per PAR fit). Storing $\sigma_m$ directly would bake in a specific $s_m$: when the user swaps seasonal stats for a different climate scenario, the stored $\sigma_m$ would be stale and noise scaling would be inconsistent with the new variability level. Storing the ratio preserves correct proportionality — if seasonal variability changes, noise scales proportionally. See also [PAR Coefficient Storage design document](../../design/PAR-COEFFICIENT-REDESIGN.md) section 3.4.

### LP coefficients

The stored standardized coefficients $\psi^*_{m,\ell}$ are converted to original-unit $\psi_{m,\ell}$ at runtime (see section 7.2), and these enter the LP directly (see [LP Formulation](lp-formulation.md)). The LP equation is:

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

1. For each order $k$ from 1 to $p_{max}$, build and solve the periodic Yule-Walker system (section 5.4) at order $k$. The last coefficient $\hat{\psi}^*_{m,k}$ from the order-$k$ solution is the periodic PACF value at lag $k$.
2. Select the order as the **maximum lag with significant PACF**:

   $$
   p_m = \max \left\{ k : |\text{PACF}_m(k)| > \frac{z_\alpha}{\sqrt{N_m}} \right\}
   $$

   where $z_\alpha = 1.96$ (95% confidence) and $N_m$ is the number of observations for season $m$. If no lag is significant, $p_m = 0$ (white noise).

3. Estimate AR coefficients at the selected order using the periodic Yule-Walker system (section 5.4).

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

For multi-resolution studies (monthly→quarterly aggregation), the same fitting procedure applies after duration-weighted aggregation; see [Multi-resolution studies](./multi-resolution-studies.md).

This section documents the five-step procedure for fitting PAR(p) parameters from historical inflow data. The fitting is performed when the system derives parameters from `inflow_history.parquet`. When pre-computed parameters are provided directly in `inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet`, this procedure is not executed.

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

The residual standard deviation for season $m$ is recovered at runtime from the stored ratio (see section 3):

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
- $\sigma_{m(t)}$: residual standard deviation for season $m(t)$ (derived at runtime — see section 3)
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

Multiplying both sides of the canonical form (section 7.1) by $\sigma_{m(t)}$ and rearranging yields the LP-ready equation:

$$
a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + \left[ \mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)} \right] + \sigma_{m(t)} \cdot \varepsilon_t
$$

where $\psi_{m(t),\ell}$ and $\sigma_{m(t)}$ are derived from stored quantities as described in section 7.2.

This decomposes the inflow into three additive components:

1. **Lag contribution**: $\displaystyle\sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell}$ — linear function of past inflows (state variables or known values)
2. **Deterministic base**: $\displaystyle\mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}$ — constant offset per (stage, hydro), precomputed once
3. **Stochastic innovation**: $\sigma_{m(t)} \cdot \varepsilon_t$ — noise draw scaled by the seasonal residual standard deviation

### 7.4 Deterministic Base

The deterministic base is defined as:

$$
b_{h,m(t)} = \mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}
$$

This is a precomputed constant per (stage, hydro) pair. It absorbs the mean-adjustment arithmetic that would otherwise be repeated at every forward-pass stage transition. With this definition, the LP-ready form (section 7.3) simplifies to:

$$
a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot a_{h,t-\ell} + b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t
$$

### 7.5 LP RHS Patching Operation

The lagged inflows $a_{h,t-\ell}$ are **LP variables**, not substituted values. In the LP (see [LP Formulation](lp-formulation.md)), they appear with coefficients $-\psi_{m(t),\ell}$ in the AR dynamics constraint row, and separate equality constraints fix each lag variable to its incoming state value:

$$
a_{h,t-\ell} = \hat{a}_{h,t-\ell}
$$

where $\hat{a}_{h,t-\ell}$ is patched per scenario to the actual lagged inflow from the trajectory record.

Because the lag contribution $\sum_\ell \psi \cdot a_{h,t-\ell}$ is carried by the constraint matrix (not the RHS), the AR dynamics constraint RHS reduces to:

$$
\text{RHS}_{h,t} = b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t
$$

where:

- $b_{h,m(t)}$ is the deterministic base for (stage, hydro), precomputed once at LP construction (section 7.4)
- $\sigma_{m(t)}$ is the noise scale for (stage, hydro), derived from stored ratio at initialization (section 7.2)
- $\varepsilon_t$ is the scenario noise draw for this (stage, hydro)

The $\psi_{m(t),\ell}$ coefficients are written into the constraint matrix **once at LP construction time** as the coefficients on the lagged inflow variables; they are not recomputed per scenario.

No division, no mean subtraction, no repeated coefficient transformation — the three precomputed LP components eliminate all redundant arithmetic from the hot path.

### 7.6 Summary of LP Components

| Component          | Symbol             | Shape per stage      | LP Role                                   | Source                                                                 |
| ------------------ | ------------------ | -------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Lag coefficients   | $\psi_{m(t),\ell}$ | One per (hydro, lag) | Constraint matrix (AR dynamics row)       | Derived from stored $\psi^*$ and $s_m$ at initialization (section 7.2) |
| Deterministic base | $b_{h,m(t)}$       | One per hydro        | AR dynamics constraint RHS (fixed term)   | Precomputed from $\mu$ and $\psi$                                      |
| Noise scale        | $\sigma_{m(t)}$    | One per hydro        | AR dynamics constraint RHS (noise factor) | Derived from stored ratio and $s_m$ at initialization (section 7.2)    |

## 8. Spatial Correlation Factorisation

The PAR(p) fitting procedure (section 5) produces per-hydro noise terms $\varepsilon_t$ that are treated as independent across hydro plants. Generating spatially correlated scenarios requires factorising the cross-hydro correlation matrix $C$ so that a vector of independent standard normal draws can be mapped to correlated noise. This section documents the choice of factorisation method and the rationale.

### 8.1 The Problem with Cholesky

The classical approach applies Cholesky factorisation: given $C = L L^\top$ with $L$ lower-triangular, correlated noise is obtained as $L z$ where $z \sim \mathcal{N}(0, I)$. Cholesky requires $C$ to be **strictly positive-definite**. In practice, estimated correlation matrices from hydro inflow series are frequently near-singular or rank-deficient for two reasons:

- **Short sample records**: Brazilian hydro series commonly span 80–90 years, yielding a historical record length $N$ that is comparable to the number of hydro plants in some subsystems. When $N$ is close to the matrix dimension, the sample eigenvalues of $C$ cluster near zero.
- **Heterogeneous series**: Plants with near-identical hydrological regimes (upstream–downstream pairs, same river basin) produce columns that are nearly linearly dependent, reducing the effective rank of $C$ below its nominal dimension.

A near-singular $C$ causes Cholesky to fail or to produce numerically degenerate lower triangular factors. A separate filtering pass to remove "degenerate" hydros would be required before the factorisation, discarding information and introducing a non-transparent pre-processing decision.

### 8.2 Eigendecomposition with Clipped Square Root

Cobre uses the **symmetric matrix square root via eigendecomposition**. The correlation matrix is decomposed as:

$$
C = U \Lambda U^\top
$$

where $U$ is the orthogonal matrix of eigenvectors and $\Lambda = \mathrm{diag}(\lambda_1, \ldots, \lambda_n)$ is the diagonal matrix of eigenvalues. The symmetric square root is then:

$$
C^{1/2} = U \Lambda^{1/2} U^\top
$$

To handle near-singular matrices, any eigenvalue $\lambda_i < 0$ (arising from floating-point rounding in the sample estimate) is **clipped to zero** before taking the square root:

$$
\tilde{\Lambda}^{1/2} = \mathrm{diag}\!\left(\sqrt{\max(\lambda_1, 0)},\, \ldots,\, \sqrt{\max(\lambda_n, 0)}\right)
$$

Correlated noise is then generated as $C^{1/2} z$ where $z \sim \mathcal{N}(0, I)$.

### 8.3 Why Eigendecomposition

The spectral form handles rank-deficient correlation matrices natively: eigenvectors corresponding to clipped (zero) eigenvalues contribute nothing to the factorisation, which is the correct behaviour for directions of zero variance. No prior filtering of degenerate hydro plants is needed.

The clipping threshold acts as a single, transparent parameter controlling which near-zero eigenvalues are treated as structural zeros. The cross-entity correlation structure is preserved for all eigenvalues above the threshold.

### 8.4 Trade-offs

| Property                        | Eigendecomposition (Cobre)       | Cholesky                            |
| ------------------------------- | -------------------------------- | ----------------------------------- |
| Handles rank-deficient $C$      | Yes — clipping makes it robust   | No — requires positive-definiteness |
| Computational cost              | Higher (full eigendecomposition) | Lower on well-conditioned matrices  |
| Degenerate-hydro filtering pass | Not required                     | Required for near-singular $C$      |
| Transparency of approximation   | Single clipping threshold        | Opaque numerical failure or pivot   |

The higher computational cost is acceptable because the factorisation is performed once per study configuration and not on the hot path of the forward pass.

## Cross-References

- [LP Formulation](lp-formulation.md) — AR inflow dynamics in the LP: state expansion, lag fixing constraints, dual variables
- [Inflow Non-Negativity](inflow-nonnegativity.md) — Methods for handling negative realizations produced by the PAR(p) model
- [Scenario Generation](./scenario-generation.md) — When external scenarios are used in training, a PAR model is fitted to the external data for backward pass opening tree generation. The fitting procedure (section 5 above) applies equally to this derived model.
- [Notation Conventions](../overview/notation-conventions.md) — Defines inflow symbols ($a_{h,t}$, $\mu_m$, $\psi_{m,\ell}$, $\sigma_m$) and unit conventions
