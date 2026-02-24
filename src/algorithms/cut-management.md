# Cut Management

Cut management controls the lifecycle of Benders cuts in the SDDP algorithm: how cuts are generated, aggregated, stored, and selectively pruned. Effective cut management is essential for solver performance -- without it, the number of constraints in each stage LP grows unboundedly, slowing every forward and backward pass solve.

## What is a Benders cut?

A Benders cut is a linear inequality added to a stage's LP that approximates the cost of future decisions. Each cut encodes information learned during a backward pass solve: how sensitive the total future cost is to changes in reservoir storage volumes and inflow history at that stage.

Mathematically, a cut takes the form:

$$
\theta \geq \alpha + \sum_h \beta^v_h \cdot v_h + \sum_{h,\ell} \beta^{lag}_{h,\ell} \cdot a_{h,\ell}
$$

where $\theta$ is the future cost variable, $\alpha$ is the intercept, $\beta^v_h$ captures the marginal value of water in reservoir $h$, and $\beta^{lag}_{h,\ell}$ captures the marginal value of inflow history. The collection of all cuts at a stage forms a piecewise-linear lower approximation of the true future cost function.

## How cuts are generated

During the backward pass, the algorithm solves each stage's LP at trial states collected in the forward pass, for every scenario in the opening tree. The LP dual variables (shadow prices) from the water balance and AR lag-fixing constraints provide the cut coefficients. The intercept is computed so that the cut passes exactly through the trial point.

Because multiple scenarios are evaluated, the per-scenario coefficients are aggregated into a single cut per trial point using probability-weighted averaging. This is the **single-cut** formulation used by Cobre.

## Why cut management matters

Each SDDP iteration adds new cuts, so after hundreds of iterations the cut pool can contain thousands of constraints per stage. Most older cuts become redundant as newer, tighter cuts supersede them. Without pruning:

- **LP solve time** increases linearly with the number of active cuts
- **Memory consumption** grows proportionally
- **Numerical conditioning** degrades as near-parallel cuts accumulate

Cut selection strategies identify and deactivate redundant cuts, keeping the LP compact while preserving the quality of the future cost approximation. The available strategies (Level-1, LML1, dominated cut detection) offer different trade-offs between aggressiveness and safety. See [Cut Selection](cut-selection.md) for a summary of each strategy.

Importantly, deactivated cuts are not deleted from memory -- they are relaxed to $-\infty$ so their indices remain stable. This preserves reproducibility across checkpoint/resume cycles and allows reactivation if needed.

## Further reading

- [Cut Management (spec)](../specs/math/cut-management.md) -- complete formal specification: cut definition, dual extraction, aggregation formulas, validity conditions, selection strategies, convergence guarantees, and configuration parameters
- [Single-Cut vs Multi-Cut](single-multi-cut.md) -- comparison of cut aggregation strategies
- [Cut Selection](cut-selection.md) -- overview of the three selection strategies
- [Benders Decomposition](benders.md) -- the decomposition framework underlying cut generation
- [Forward and Backward Passes](forward-backward.md) -- the iterative structure that drives cut generation
