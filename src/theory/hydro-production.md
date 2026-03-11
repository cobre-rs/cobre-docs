# Hydro Production Models

## Overview

The amount of electrical power a hydroelectric plant produces depends on two physical quantities: how much water flows through the turbines and the pressure difference (net head) driving that flow. Net head is the difference between the upstream reservoir level and the downstream tailrace level, minus hydraulic losses in the penstock.

This nonlinear relationship creates a modeling challenge for LP-based optimization: the exact production function $g = f(v, q)$ is a bilinear function of storage and flow, incompatible with linear programming. Cobre uses two linearization strategies during training (policy construction) that preserve LP tractability while capturing different levels of head-variation accuracy.

## Constant Productivity Model

The simplest model assumes productivity is constant — independent of how full the reservoir is. Generation is a linear function of turbined flow:

$$
g_{h,k} = \rho_h \cdot q_{h,k}
$$

where $\rho_h$ is the **productivity coefficient** (MW per m³/s), computed from the turbine efficiency and a reference net head:

$$
\rho_h = \frac{9.81 \times \eta_h \times H^{ref}_h}{1000}
$$

with $\eta_h$ the turbine-generator efficiency (typically 0.85–0.92) and $H^{ref}_h$ the net head at a representative operating point (typically 65% full storage).

This is an equality constraint: for each hydro $h$ and each load block $k$, generation is fully determined by turbined flow. The LP does not treat generation as a free variable — it is substituted out. The simplicity makes this model fast and numerically well-conditioned, which is valuable for long planning horizons where head variation is secondary to reservoir management.

**When to use**: Run-of-river plants, far-future stages, and initial algorithm development where computational speed matters more than fine-grained head variation.

## FPHA: Piecewise-Linear Head Approximation

The exact hydroelectric production function is:

$$
\phi(v, q, q_{out}) = \frac{9.81 \times \eta \times q \times h_{net}(v, q, q_{out})}{1000}
$$

where the **net head** captures the full hydraulic chain:

$$
h_{net}(v, q, q_{out}) = h_{fore}(v) - h_{tail}(q_{out}) - h_{loss}(q)
$$

- $h_{fore}(v)$: forebay (reservoir surface) level, a nonlinear function of storage
- $h_{tail}(q_{out})$: tailrace level, a function of total outflow $q_{out} = q + s$
- $h_{loss}(q)$: hydraulic losses in the penstock and turbines

Because $\phi$ is a product of $q$ and $h_{net}(v, q, q_{out})$, it is nonlinear in the LP variables. FPHA (Função de Produção Hidrelétrica Aproximada) replaces this nonlinear surface with a **concave piecewise-linear envelope**: a set of $M$ hyperplanes that together bound generation from above everywhere in the operating region:

$$
g_{h,k} \leq \gamma_0^m + \gamma_v^m \cdot v^{avg}_h + \gamma_q^m \cdot q_{h,k} + \gamma_s^m \cdot s_{h,k}, \quad m = 1, \ldots, M
$$

where $v^{avg}_h = (v^{in}_h + v_h)/2$ is the average storage over the stage.

### Physical Meaning of Coefficients

Each hyperplane coefficient has a clear hydraulic interpretation:

| Coefficient  | Sign     | Interpretation                                             |
| ------------ | -------- | ---------------------------------------------------------- |
| $\gamma_0^m$ | $> 0$    | Generation at zero storage and zero flow                   |
| $\gamma_v^m$ | $> 0$    | Higher reservoir level raises forebay, increasing net head |
| $\gamma_q^m$ | $> 0$    | More turbined flow produces more power                     |
| $\gamma_s^m$ | $\leq 0$ | More spillage raises tailrace, reducing net head           |

The negative sign on $\gamma_s^m$ reflects a real hydraulic effect: water released as spillage raises the downstream level, which partially cancels the head driving power generation. In systems with strong tailrace backwater effects, this is an important operational consideration.

### Concave Envelope and Conservative Bias

The LP optimizer maximizes hydro generation subject to the FPHA constraints (since hydro has zero fuel cost). At the optimum, generation lies on one of the hyperplane faces. Because the envelope is a concave upper bound on the exact nonlinear surface, the FPHA model may overestimate generation compared to the physical plant.

To prevent this, a **correction factor** $\kappa \leq 1$ scales the hyperplane intercepts:

$$
\tilde{\gamma}_0^m = \kappa \times \gamma_0^m
$$

The default approach sets $\kappa$ as the worst-case ratio between the exact production function and the FPHA approximation across the operating grid, guaranteeing that FPHA never overestimates. For plants with modest head variation, typical values are $\kappa \approx 0.97$–$1.00$.

### Impact on Water Values

Because the average storage $v^{avg}_h = (v^{in}_h + v_h)/2$ appears in the FPHA constraint, the incoming storage variable $v^{in}_h$ is linked to the generation upper bound. The dual of the incoming storage fixing constraint therefore captures both the water balance sensitivity and the FPHA generation sensitivity — all through a single LP variable. This is what makes the "fishing constraint" technique (see [LP Formulation](lp-formulation.md)) particularly powerful: the FPHA contribution to cut coefficients is automatic.

### FPHA vs. Constant Productivity: Trade-offs

| Criterion                | Constant Productivity    | FPHA                             |
| ------------------------ | ------------------------ | -------------------------------- |
| LP constraints per hydro | 1 equality per block     | $M$ inequalities per block       |
| Head variation captured  | No                       | Yes                              |
| Data required            | Productivity coefficient | Topology functions + hyperplanes |
| Training speed           | Fast                     | Slower (more constraints)        |
| Cut quality              | Conservative             | More accurate water values       |

In practice, many systems use FPHA for near-term stages (where head variation significantly affects near-term dispatch) and constant productivity for far-future stages (where approximation accuracy matters less than speed).

## Further Reading

- [LP Formulation](lp-formulation.md) — how production constraints fit into the assembled stage LP
- [Benders Decomposition](benders.md) — how FPHA affects cut coefficient computation
- [Hydro Production Models (spec)](../specs/math/hydro-production-models.md) — complete formal specification including topology function interpolation, correction factor computation methods, and the simulation-only linearized head model
