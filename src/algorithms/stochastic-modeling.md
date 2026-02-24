# Stochastic Modeling

## Why Inflows Are Uncertain

Hydrothermal dispatch optimizes the operation of interconnected hydroelectric and thermal power plants over a multi-year horizon. The dominant source of uncertainty is **river inflow** -- the volume of water arriving at each reservoir in each time period. Inflows depend on rainfall, snowmelt, and upstream conditions that cannot be predicted with precision months or years ahead. Because water stored today displaces expensive thermal generation tomorrow (and vice versa), the dispatch decision at every stage depends critically on the _distribution_ of future inflows, not just a single forecast.

## Role of Autoregressive Models

SDDP requires a probabilistic model of inflows that captures two key properties:

1. **Seasonal patterns**: Inflows are strongly periodic -- wet and dry seasons drive large swings in mean and variance across the year.
2. **Temporal correlation**: A wet month is more likely to be followed by another wet month than by a dry one. Ignoring this correlation would underestimate hydrological risk.

The **Periodic Autoregressive model of order p** (PAR(p)) addresses both properties. It fits separate autoregressive parameters for each season (month or week), allowing the mean, variance, and lag structure to vary across the hydrological cycle. At each stage, the model expresses the current inflow as a linear function of recent past inflows plus a random innovation term:

$$
a_{h,t} = \mu_{m(t)} + \sum_{\ell=1}^{p} \psi_{m(t),\ell} \left( a_{h,t-\ell} - \mu_{m(t-\ell)} \right) + \sigma_{m(t)} \cdot \varepsilon_t
$$

The lagged inflows $a_{h,t-1}, \ldots, a_{h,t-p}$ become **state variables** in the SDDP subproblem, linking stages through the Bellman recursion.

## Spatial Correlation

In systems with many river basins, inflows at different plants are correlated -- a drought typically affects an entire region, not a single plant. Cobre handles spatial correlation by sampling the innovation vector $\varepsilon_t$ from a multivariate distribution that preserves the observed cross-plant correlation structure. The PAR(p) model captures temporal dependence per plant, while the joint sampling of innovations captures spatial dependence across plants. See [Spatial Correlation](spatial-correlation.md) for details on the correlation modeling approach.

## Integration with SDDP

During the **forward pass**, inflow scenarios are sampled from the PAR(p) model (or from external scenario files). During the **backward pass**, the opening tree of inflow realizations at each stage is generated from the same model, ensuring consistency between the policy being evaluated and the uncertainty it was trained against. When external scenarios are provided for training, a PAR(p) model is fitted to those scenarios so that the backward pass opening tree remains well-defined.

## Further Reading

- [PAR(p) Autoregressive Models](par-model.md) -- accessible explanation of the PAR(p) model, its parameters, and how lags become state variables
- [PAR Inflow Model Specification](../specs/math/par-inflow-model.md) -- full mathematical specification including fitting procedure, model order selection, and validation invariants
- [Scenario Generation](scenario-generation.md) -- how inflow scenarios are produced for forward and backward passes
