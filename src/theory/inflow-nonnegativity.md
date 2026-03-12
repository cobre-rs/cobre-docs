# Inflow Non-Negativity

## Overview

The PAR(p) autoregressive model generates inflow realizations by adding a random innovation to a weighted combination of past inflows. Because the innovation term can be arbitrarily negative in the Gaussian model, the total inflow can sometimes be negative — which is physically impossible. Negative inflows would cause the water balance to add water to the reservoir rather than drain it, producing absurd dispatch decisions.

Handling this situation correctly is important for both LP feasibility and for maintaining the statistical properties of the inflow model. Three strategies are available, with different trade-offs between model fidelity, LP complexity, and computational cost.

## How Negative Inflows Arise

The PAR(p) model at stage $t$ for hydro $h$ generates:

$$
a_h = \underbrace{\mu_m - \sum_{\ell=1}^{p} \psi_\ell \mu_{m-\ell}}_{\text{deterministic base}} + \underbrace{\sum_{\ell=1}^{p} \psi_\ell \cdot \hat{a}_{h,\ell}}_{\text{lag contribution}} + \underbrace{\sigma_m \cdot \eta}_{\text{noise term}}
$$

When the noise realization $\eta$ is sufficiently negative (e.g., $\eta < -2$), the total can become negative. For systems with low seasonal mean flows and high variability, this can occur with non-negligible probability in dry seasons.

If $a_h < 0$ enters the water balance constraint uncorrected, the LP solver treats it as a negative inflow (water added to the river system), which has no physical meaning and will cause the optimizer to mismanage reservoir storage.

## The Penalty Method (Recommended)

The recommended approach introduces a non-negative slack variable $\sigma^{inf}_h$ that absorbs any negative inflow, keeping the effective inflow non-negative while preserving the LP formulation and the AR model structure for positive realizations.

**Modified AR constraint**:

$$
a_h + \sigma^{inf}_h = \text{deterministic base} + \sum_{\ell=1}^{p} \psi_\ell \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \eta
$$

with $\sigma^{inf}_h \geq 0$. When $\eta$ is mild, the optimizer sets $\sigma^{inf}_h = 0$ and $a_h$ takes its natural value. When $\eta$ is extreme, $\sigma^{inf}_h$ absorbs the excess, so the effective inflow:

$$
a_h^{eff} = a_h + \sigma^{inf}_h \geq 0
$$

The violation is penalized in the objective outside the block summation:

$$
+ \sum_{h \in \mathcal{H}} c^{inf} \cdot \sigma^{inf}_h \cdot T
$$

where $T = \sum_k \tau_k$ is the total stage duration in hours. The factor $T$ converts the slack rate (m³/s) to an equivalent energy dimension over the full stage, making the penalty dimensionally consistent with storage violation penalties that appear in the same part of the objective.

The penalty $c^{inf}$ is a Category 2 constraint violation penalty — it sits above generation costs in the penalty hierarchy, ensuring the optimizer "pays" for negative inflow events in the value function and propagates this signal back through the Benders cuts.

### Properties

- LP always feasible: the slack prevents infeasibility for any noise realization
- AR dynamics preserved for positive realizations: when $\sigma^{inf}_h = 0$, the model is unchanged
- Clear cost signal: the penalty magnitude tracks how frequently and severely the threshold is violated

## Truncation (Simple Alternative)

The simplest method truncates negative inflows to zero before they enter the LP:

$$
a_h = \max\left(0, \text{deterministic base} + \sum_{\ell=1}^{p} \psi_\ell \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \eta\right)
$$

No additional LP variables or constraints are needed. However, truncation has two statistical drawbacks: it shifts the mean inflow upward (positive bias) and disrupts temporal correlation at truncation events, because the extreme noise that triggered truncation is discarded rather than tracked.

For quick studies or debugging, truncation is acceptable. For production use, the bias can distort long-run cost estimates in drought scenarios.

**Available since v0.1.1.** To enable truncation, set the following field in `config.json`:

```json
{
  "modeling": {
    "inflow_non_negativity": {
      "method": "truncation"
    }
  }
}
```

**Implementation.** Before LP patching in the forward pass, the algorithm evaluates $a_h$ using `evaluate_par_inflow`. If $a_h < 0$, the noise term is replaced with the threshold value returned by `solve_par_noise` — the minimum noise that keeps $a_h$ at exactly zero given the current lag state. This replacement occurs before the LP is built, so no additional LP variables or constraints are required.

## Deferred: Truncation with Penalty

A more sophisticated hybrid approach (deferred to a future release) combines truncation with explicit noise adjustment tracking. It introduces a dimensionless slack $\xi_h \geq 0$ that adjusts the noise term rather than the inflow directly:

$$
a_h = \text{deterministic base} + \sum_{\ell=1}^{p} \psi_\ell \cdot \hat{a}_{h,\ell} + \sigma_m \cdot (\eta + \xi_h), \quad a_h \geq 0
$$

The penalty is proportional to the actual inflow correction $\sigma_m \cdot \xi_h$, which is larger in high-variability seasons. This approach preserves AR model structure better than pure truncation and provides a more precise signal of how much the noise realization was adjusted. It is deferred because the interaction with the noise generation pipeline adds complexity that is not needed for the minimal viable solver.

The PAR evaluation infrastructure needed for this method (`evaluate_par_inflow` and `solve_par_noise`) is now in place from v0.1.1, so the remaining work is confined to the LP patching and penalty accounting layers.

## Summary

| Method                  | LP Size                     | Bias    | AR Preservation | Recommended         |
| ----------------------- | --------------------------- | ------- | --------------- | ------------------- |
| No handling             | Base                        | None    | Full            | Debugging only      |
| Penalty                 | +1 var/constraint per hydro | Minimal | Full            | **Production**      |
| Truncation              | Base                        | Upward  | Partial         | Available in v0.1.1 |
| Truncation with penalty | +vars                       | Minimal | Full            | Deferred            |

## Further Reading

- [PAR(p) Autoregressive Models](par-model.md) — the inflow model that generates the realizations handled here
- [Inflow Non-Negativity (spec)](../specs/math/inflow-nonnegativity.md) — complete formal specification including the full LP formulations for all four methods and penalty hierarchy placement
- [LP Formulation (spec)](../specs/math/lp-formulation.md) — penalty taxonomy and priority ordering
