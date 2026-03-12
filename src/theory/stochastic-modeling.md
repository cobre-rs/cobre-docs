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

## Stochastic Load Demand

Electrical load (demand) at each bus can also be treated as uncertain. While inflow uncertainty drives long-term hydro storage decisions, load uncertainty captures the variability in consumption patterns across scenarios -- an important factor when optimizing systems under demand-side risk or evaluating the impact of forecast errors on operational cost.

### Load Noise Model

The load model shares the same structural framework as the inflow model. Load at bus $b$ in stage $t$ has seasonal mean $\mu^L_{m(t)}$ and seasonal standard deviation $\sigma^L_{m(t)}$. A noise term is drawn from a standard normal distribution, optionally conditioned on recent past residuals via autoregressive lags, and then scaled to produce a stochastic factor applied to the base demand:

$$
d_{b,t} = \bar{d}_{b,t} \cdot \left(1 + \sigma^L_{m(t)} \cdot \varepsilon^L_t + \sum_{\ell=1}^{p_L} \phi_{m(t),\ell} \cdot \varepsilon^L_{t-\ell}\right)
$$

where $\bar{d}_{b,t}$ is the deterministic base demand for bus $b$ at stage $t$ and $\varepsilon^L_t \sim N(0,1)$ is the innovation term. The AR order $p_L$ (equivalent to `ar_order` in the input) is typically zero for load (white noise), though higher orders are supported when historical load data exhibits temporal autocorrelation.

The seasonal parameters $\mu^L_{m(t)}$ and $\sigma^L_{m(t)}$ are supplied via the `load_seasonal_stats.parquet` input file. When this file is absent, load demand is treated as fully deterministic.

### Relation to the PAR(p) Framework

In the implementation, the load noise precomputation mirrors the inflow noise precomputation: `PrecomputedNormalLp` is the load analog of `PrecomputedParLp`. Both structures store the per-scenario, per-stage noise samples that are drawn once before the algorithm begins and then replayed identically across forward and backward passes to ensure reproducibility. The difference is that load noise does not contribute new state variables to the Bellman recursion -- lagged load residuals, if any, are not carried across stages as LP columns.

### Effect on the Power Balance Constraint

Load noise is applied as an additive patch to the right-hand side of the power balance constraint at each bus during LP construction. For each scenario and stage, the realized demand $d_{b,t}$ replaces the deterministic base demand in the constraint, shifting the feasible region. This patching takes place identically during the forward pass, the backward pass, and the simulation pipeline, so the policy trained under stochastic load is also evaluated under the same distributional assumptions.

## Integration with SDDP

During the **forward pass**, both inflow scenarios and load noise realizations are applied to the LP at each stage: inflows enter through the hydro water balance constraints, while load noise enters through the bus power balance right-hand sides. During the **backward pass**, the same inflow opening tree and load noise samples are replayed to ensure that the cuts computed at each stage are consistent with the uncertainty faced during forward simulation. When external scenarios are provided for training, a PAR(p) model is fitted to those scenarios so that the backward pass opening tree remains well-defined. Simulation uses the same noise application logic, so realized cost distributions faithfully reflect both sources of uncertainty.

## Further Reading

- [PAR(p) Autoregressive Models](par-model.md) -- accessible explanation of the PAR(p) model, its parameters, and how lags become state variables
- [PAR Inflow Model Specification](../specs/math/par-inflow-model.md) -- full mathematical specification including fitting procedure, model order selection, and validation invariants
- [Scenario Generation](scenario-generation.md) -- how inflow scenarios are produced for forward and backward passes

---

> **See also**: For implementation details and usage, including stochastic load
> configuration and the `load_seasonal_stats.parquet` input format, see the
> [Stochastic Modeling guide](https://cobre-rs.github.io/cobre/guide/stochastic-modeling.html)
> in the software book.
