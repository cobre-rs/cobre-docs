# PAR(p) Autoregressive Models

## What Is a PAR(p) Model?

A **Periodic Autoregressive model of order p** (PAR(p)) is a time series model designed for data with strong seasonal patterns. It extends the classical autoregressive (AR) model by allowing every parameter to vary by season — the coefficients that govern January inflows are different from those that govern July inflows.

The "order p" indicates how many past time steps the model looks back. A PAR(3) model for a given month predicts the current inflow using the inflows from the previous three months. The order can differ by season: January might need only one lag while April might need four, reflecting different hydrological dynamics across the year.

## The PAR(p) Equation

For hydro plant $h$ at stage $t$ falling in season $m(t)$, the PAR(p) model is:

$$
a_{h,t} = \mu_{m(t)} + \sum_{\ell=1}^{p} \psi_{m(t),\ell} \left( a_{h,t-\ell} - \mu_{m(t-\ell)} \right) + \sigma_{m(t)} \cdot \varepsilon_t
$$

In words: the inflow at stage $t$ equals the seasonal mean, plus a weighted combination of how much recent inflows deviated from _their_ seasonal means, plus a random shock.

### Parameters by Season

Each season $m$ has its own set of parameters:

| Parameter       | Symbol                                | Role                                     |
| --------------- | ------------------------------------- | ---------------------------------------- |
| Seasonal mean   | $\mu_m$                               | Expected inflow for season $m$           |
| AR coefficients | $\psi_{m,1}, \ldots, \psi_{m,p}$      | Weights on past deviations from the mean |
| Residual std    | $\sigma_m$                            | Scale of the random innovation           |
| Innovation      | $\varepsilon_t \sim \mathcal{N}(0,1)$ | Standardized random shock                |

The seasonal mean $\mu_m$ and sample standard deviation $s_m$ are estimated from historical data. The AR coefficients $\psi_{m,\ell}$ are fitted using the Yule-Walker equations (see below). The residual standard deviation $\sigma_m$ is derived at runtime from the other parameters (it is not stored independently).

## How Lags Become State Variables

In the SDDP framework, decisions at each stage depend on a set of **state variables** that summarize everything the optimizer needs to know from the past. For the PAR(p) model, the state variables are the lagged inflows:

$$
\text{State at stage } t: \quad \bigl(v_{h,t},\; a_{h,t-1},\; a_{h,t-2},\; \ldots,\; a_{h,t-p_{\max}}\bigr)
$$

where $v_{h,t}$ is the reservoir volume and $a_{h,t-\ell}$ are the lagged inflows needed by the autoregressive equation. Each lag adds one state variable per hydro plant to the SDDP subproblem.

This is significant for problem size: a system with 150 hydro plants and a maximum PAR order of 6 adds up to $150 \times 6 = 900$ state variables beyond the reservoir volumes. The LP formulation includes constraints that "shift" lagged inflows forward from one stage to the next, ensuring the autoregressive structure is respected across the Bellman recursion.

## Stored vs. Computed Quantities

Cobre stores the natural outputs of the fitting process:

- **Stored**: seasonal means ($\mu_m$), seasonal sample standard deviations ($s_m$), AR order ($p_m$), and AR coefficients in original units ($\psi_{m,\ell}$)
- **Computed at runtime**: the residual standard deviation $\sigma_m$, derived from the stored quantities to guarantee consistency

This design avoids redundancy — $\sigma_m$ is fully determined by the other parameters and recomputing it is inexpensive.

## Yule-Walker Fitting Procedure

When fitting PAR(p) parameters from historical inflow data, the AR coefficients are estimated by solving the **Yule-Walker equations** — a linear system that relates the autocorrelations of the data to the model coefficients. The procedure has six steps.

> **Implementation status**: As of v0.1.1, this full fitting procedure is implemented in
> `cobre-stochastic`'s estimation module. Steps 1–5 are carried out by the seasonal
> statistics, autocorrelation, and AR coefficient estimators; Step 6 selects the model
> order via partial autocorrelation function (PACF) significance testing before the final
> coefficients are computed.

### Step 1 — Seasonal Statistics

For each season $m$, compute the sample mean and standard deviation from historical observations $\{a_{h,t} : m(t) = m\}$:

$$
\hat{\mu}_m = \frac{1}{N_m} \sum_{t:\,m(t)=m} a_{h,t}
$$

$$
\hat{s}_m = \sqrt{\frac{1}{N_m - 1} \sum_{t:\,m(t)=m} \left(a_{h,t} - \hat{\mu}_m\right)^2}
$$

where $N_m$ is the number of historical observations for season $m$.

### Step 2 — Seasonal Autocorrelations

Compute the cross-seasonal autocorrelation at lag $\ell$ for season $m$. The cross-seasonal structure arises because lag $\ell$ at season $m$ reaches back to season $m - \ell$ (cyclically):

$$
\hat{\gamma}_m(\ell) = \frac{1}{N_m - 1} \sum_{t:\,m(t)=m} \left(a_{h,t} - \hat{\mu}_m\right)\left(a_{h,t-\ell} - \hat{\mu}_{m-\ell}\right)
$$

$$
\hat{\rho}_m(\ell) = \frac{\hat{\gamma}_m(\ell)}{\hat{s}_m \cdot \hat{s}_{m-\ell}}
$$

Note that $\hat{s}_{m-\ell}$ is the standard deviation of season $m - \ell$, not of season $m$. This is the defining feature of a _periodic_ (as opposed to stationary) autoregressive model.

### Step 3 — Yule-Walker System

For each season $m$, the coefficients in standardized form $\psi_{m,1}^*, \ldots, \psi_{m,p}^*$ satisfy:

$$
\mathbf{R}_m \boldsymbol{\psi}_m^* = \boldsymbol{r}_m
$$

where:

$$
\mathbf{R}_m = \begin{pmatrix}
1 & \hat{\rho}_{m-1}(1) & \cdots & \hat{\rho}_{m-p+1}(p-1) \\
\hat{\rho}_m(1) & 1 & \cdots & \hat{\rho}_{m-p+2}(p-2) \\
\vdots & \vdots & \ddots & \vdots \\
\hat{\rho}_m(p-1) & \hat{\rho}_{m-1}(p-2) & \cdots & 1
\end{pmatrix}, \qquad
\boldsymbol{r}_m = \begin{pmatrix} \hat{\rho}_m(1) \\ \hat{\rho}_m(2) \\ \vdots \\ \hat{\rho}_m(p) \end{pmatrix}
$$

The solution is:

$$
\hat{\boldsymbol{\psi}}_m^* = \mathbf{R}_m^{-1} \boldsymbol{r}_m
$$

The matrix $\mathbf{R}_m$ is not a standard Toeplitz matrix (because consecutive rows use different seasons' correlations), but it has a similar structure. The correlation matrix must be positive definite for the solution to exist; if not, the historical record may be too short for the requested order.

> **LU factorization**: In the implementation, the periodic Yule-Walker system is solved
> via **LU factorization with partial pivoting** rather than direct matrix inversion or
> the classical Levinson-Durbin recursion. The Levinson-Durbin recursion assumes a
> stationary Toeplitz covariance structure, which does not hold for the periodic
> correlation matrix $\mathbf{R}_m$ (whose consecutive rows use different seasons'
> correlations). LU factorization with partial pivoting handles the general (non-Toeplitz)
> case correctly in $O(p^3)$ time. For the per-season orders typical in hydro studies
> ($p \leq 12$), this cost is negligible.

### Step 4 — Residual Standard Deviation

After solving the Yule-Walker system, the residual standard deviation for season $m$ is:

$$
\hat{\sigma}_m = \hat{s}_m \sqrt{1 - \boldsymbol{\psi}_m^{*\top} \boldsymbol{r}_m}
$$

This equals $\hat{s}_m$ times the square root of the unexplained variance fraction. If $\hat{\sigma}_m^2 \leq 0$, the model overfits — it explains all historical variance, leaving no room for the noise term.

### Step 5 — Convert to Original Units

The Yule-Walker solution yields coefficients in standardized form $\psi^*_{m,\ell}$ (dimensionless, relating standardized deviations). The LP requires original-unit coefficients:

$$
\psi_{m,\ell} = \psi^*_{m,\ell} \cdot \frac{s_m}{s_{m-\ell}}
$$

These are computed once at initialization and used directly as LP constraint matrix entries.

### Step 6 — Model Order Selection (PACF)

Before Steps 3–5 are applied at the final model order, the implementation selects the
order $p_m$ for each season $m$ using **partial autocorrelation function (PACF)
significance testing**. The procedure fits Yule-Walker systems at increasing orders
$p = 1, 2, \ldots, p_{\max}$ and examines the last coefficient $\psi^*_{m,p}$ at each
order — the partial autocorrelation at lag $p$. Under the null hypothesis that the true
order is less than $p$, the partial autocorrelation is approximately normally distributed
with standard error $1/\sqrt{N}$, where $N$ is the number of historical observations for
the season.

The selected order is the largest $p$ whose partial autocorrelation is significant:

$$
p_m^* = \max\!\left\{p \in \{1, \ldots, p_{\max}\} : \left|\psi^*_{m,p}\right| > z_{\alpha/2} / \sqrt{N}\right\}
$$

where $z_{\alpha/2}$ is the critical value for the chosen significance level (typically
$z_{0.025} = 1.96$ for a 95% confidence band). If no lag is significant, the selected
order is $p_m^* = 0$ (white-noise model, no autoregressive structure).

> **Implementation**: This procedure is implemented in `select_order_pacf` in the
> `cobre-stochastic` estimation module. The function evaluates PACF significance for each
> candidate order and returns the selected order. AIC and BIC are recognized alternatives
> but are not implemented.

## Key Properties

- **Periodicity**: All parameters vary by season, matching the strong seasonality of hydrological data.
- **Parsimony**: The model order $p$ is selected per season using PACF significance testing (implemented via `select_order_pacf`). AIC and BIC are recognized alternatives but are not implemented.
- **Stationarity**: Fitted models are validated to ensure the AR process does not diverge — the characteristic polynomial roots must lie outside the unit circle.
- **Positive residual variance**: After fitting, $\sigma_m^2 > 0$ must hold for all seasons. A zero or negative residual variance indicates overfitting.

## Further Reading

- [Stochastic Modeling](stochastic-modeling.md) — overview of why inflow uncertainty matters and how PAR(p) fits into the SDDP workflow
- [Inflow Non-Negativity](inflow-nonnegativity.md) — how negative PAR(p) realizations are handled
- [PAR Inflow Model Specification](../specs/math/par-inflow-model.md) — complete mathematical specification with unit conversion formulas, runtime preprocessing steps, and all validation invariants

---

> **See also**: For implementation details and usage, see the
> [Stochastic Modeling guide](https://cobre-rs.github.io/cobre/guide/stochastic-modeling.html)
> in the software book.
