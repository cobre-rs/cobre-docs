# PAR(p) Autoregressive Models

## What Is a PAR(p) Model?

A **Periodic Autoregressive model of order p** (PAR(p)) is a time series model designed for data with strong seasonal patterns. It extends the classical autoregressive (AR) model by allowing every parameter to vary by season -- the coefficients that govern January inflows are different from those that govern July inflows.

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

The seasonal mean $\mu_m$ and sample standard deviation $s_m$ are estimated from historical data. The AR coefficients $\psi_{m,\ell}$ are fitted using the Yule-Walker equations. The residual standard deviation $\sigma_m$ is derived at runtime from the other parameters (it is not stored independently).

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

This design avoids redundancy -- $\sigma_m$ is fully determined by the other parameters and recomputing it is inexpensive.

## Key Properties

- **Periodicity**: All parameters vary by season, matching the strong seasonality of hydrological data.
- **Parsimony**: The model order $p$ is selected per season using information criteria (AIC, BIC) or coefficient significance tests, avoiding unnecessary lags.
- **Stationarity**: Fitted models are validated to ensure the AR process does not diverge -- the characteristic polynomial roots must lie outside the unit circle.
- **Positive residual variance**: After fitting, $\sigma_m^2 > 0$ must hold for all seasons. A zero or negative residual variance indicates overfitting.

## Further Reading

- [Stochastic Modeling](stochastic-modeling.md) -- overview of why inflow uncertainty matters and how PAR(p) fits into the SDDP workflow
- [PAR Inflow Model Specification](../specs/math/par-inflow-model.md) -- complete mathematical specification with the Yule-Walker fitting procedure, model order selection criteria, unit conversion formulas, and all validation invariants
