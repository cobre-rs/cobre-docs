# Single-Cut vs Multi-Cut

In SDDP, the backward pass evaluates multiple inflow scenarios at each trial state and must combine the resulting information into cuts for the previous stage. There are two approaches: the **single-cut** formulation (used by Cobre) and the **multi-cut** formulation (deferred to a future release).

## Single-cut formulation

The single-cut approach aggregates per-scenario cut coefficients into one cut per trial point by computing the probability-weighted average:

$$
\bar{\alpha} = \sum_{\omega} p(\omega) \cdot \alpha(\omega), \qquad \bar{\pi} = \sum_{\omega} p(\omega) \cdot \pi(\omega)
$$

This produces a single constraint added to the stage LP:

$$
\theta \geq \bar{\alpha} + \bar{\pi}^\top x
$$

**Advantages:**

- Each iteration adds exactly one cut per stage per trial point, keeping the LP small
- LP solve times remain fast, especially important for systems with many stages
- Simpler implementation and lower memory footprint

**Trade-off:**

- Each cut carries averaged information, so more iterations may be needed to achieve the same approximation quality

## Multi-cut formulation

The multi-cut approach keeps one cut per scenario, introducing scenario-specific future cost variables $\theta_\omega$:

$$
\theta_\omega \geq \alpha(\omega) + \pi(\omega)^\top x, \quad \forall \omega \in \Omega
$$

with the linking constraint $\theta = \sum_\omega p(\omega) \cdot \theta_\omega$.

**Advantages:**

- Preserves more information per iteration -- each scenario's sensitivity is represented individually
- Can converge in fewer iterations for problems with high scenario variability

**Trade-off:**

- Each iteration adds $|\Omega|$ cuts per stage per trial point, leading to larger LPs
- LP solve time per iteration is higher

## Which does Cobre use?

Cobre implements the **single-cut** formulation. For the system sizes typical of Brazilian hydrothermal dispatch (160+ hydro plants, hundreds of scenarios), the single-cut approach provides the best balance between iteration count and per-iteration solve time.

The multi-cut formulation is planned for a future release. See [Deferred Features](../specs/deferred.md) for status.

## Further reading

- [Cut Management (spec)](../specs/math/cut-management.md) -- formal definition of single-cut aggregation (section 3) and the multi-cut deferral note
- [Cut Management](cut-management.md) -- overview of the full cut lifecycle
- [Benders Decomposition](benders.md) -- how cuts are derived from LP duals
