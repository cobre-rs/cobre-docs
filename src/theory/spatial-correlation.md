# Spatial Correlation

Hydro plants in the same river basin or geographic region tend to experience similar hydrological conditions -- when one plant receives high inflows, nearby plants often do too. Capturing this **spatial correlation** is essential for realistic scenario generation. This page summarizes how Cobre handles it. For the full autoregressive model specification, see [PAR Inflow Model (spec)](../specs/math/par-inflow-model.md).

## Temporal correlation: the PAR(p) model

Each hydro plant's inflow series is modeled independently by a Periodic Autoregressive model of order $p$ (PAR(p)). This model captures **temporal correlation** -- the tendency for high-inflow months to follow high-inflow months -- through autoregressive coefficients that link the current inflow to past values:

$$
a_{h,t} = \mu_{m(t)} + \sum_{\ell=1}^{p} \psi_{m(t),\ell} (a_{h,t-\ell} - \mu_{m(t-\ell)}) + \sigma_{m(t)} \cdot \varepsilon_{h,t}
$$

The parameters (seasonal means $\mu$, AR coefficients $\psi$, residual standard deviations $\sigma$) vary by season, reflecting the strong seasonality of hydrological processes.

## Spatial correlation: correlated noise terms

The PAR(p) model for each plant produces a **residual** (innovation term) $\varepsilon_{h,t}$ that represents the unexplained randomness after accounting for the autoregressive structure. Spatial correlation is introduced by making these residuals **correlated across plants**.

Instead of drawing independent noise for each plant, the scenario generator samples a vector of correlated noise terms. Plants in the same river basin share a large portion of their randomness, while plants in distant basins are less correlated. The correlation structure is typically estimated from the historical residuals of the fitted PAR(p) models.

## Effect on scenario generation

Correlated noise means that the scenarios used in the forward and backward passes reflect realistic joint behavior across plants:

- In a **wet scenario**, most plants in a basin receive above-average inflows simultaneously, leading to system-wide surplus.
- In a **dry scenario**, most plants are deficient together, stressing the thermal fleet.

Without spatial correlation, the scenario generator would produce unrealistic combinations -- some plants wet while their upstream neighbors are dry -- leading to policies that underestimate system-level risk.

## Implementation notes

The spatial correlation structure is encoded in the noise vectors stored in the opening tree. Each noise vector contains entries for all hydro plants, and the cross-plant correlations are baked into the vector generation process. The PAR(p) model then transforms these correlated noise vectors into inflow realizations that respect both the temporal dynamics (autoregressive lags) and the spatial structure (correlated residuals).

## Related topics

- [PAR Inflow Model (spec)](../specs/math/par-inflow-model.md) -- Full specification of the autoregressive model, fitting procedure, and validation
- [Scenario Generation](scenario-generation.md) -- How scenarios incorporating spatial correlation are used in the SDDP passes
- [SDDP Theory](sddp-theory.md) -- The broader algorithmic context in which inflow modeling operates
