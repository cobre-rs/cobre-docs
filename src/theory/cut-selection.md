# Cut Selection

As SDDP iterates, the number of Benders cuts grows with each backward pass. Many older cuts become redundant once newer, tighter cuts are generated at nearby states. Cut selection strategies identify and deactivate these redundant cuts, keeping the stage LPs compact without sacrificing approximation quality.

Cobre supports three selection strategies, listed from least to most aggressive.

## Cut activity

All three strategies rely on the concept of **cut activity**. A cut is active at a given state if it is binding (or nearly binding) at the LP optimum -- meaning it is actually shaping the future cost approximation at that point. Inactive cuts sit below the current approximation surface and contribute nothing to the solution.

Activity is determined by checking whether the gap between the future cost variable $\theta^*$ and the cut's value is below a configurable threshold $\epsilon$:

$$
\text{cut } k \text{ is active at } \hat{x} \iff \theta^* - (\alpha_k + \pi_k^\top \hat{x}) < \epsilon
$$

A threshold of zero means only strictly binding cuts count; a small positive value (e.g., 1e-6) accounts for numerical tolerance.

## Level-1

The simplest strategy. A cut is retained if it was active **at least once** during the entire algorithm execution. Periodically, cuts that have never been active are deactivated.

- **Retention policy**: ever-active
- **Aggressiveness**: low -- keeps cuts that were useful at any point in training
- **Risk**: may retain cuts that were active early but are now permanently dominated by newer cuts

## Limited Memory Level-1 (LML1)

A refinement of Level-1 that adds a time horizon. Each cut is timestamped with the most recent iteration at which it was active. Cuts whose timestamp is older than a configurable **memory window** $W$ (in iterations) are deactivated.

- **Retention policy**: active within the last $W$ iterations
- **Aggressiveness**: moderate -- controlled by the window size
- **Risk**: a very small window may prematurely remove cuts that are infrequently but meaningfully active

## Dominated cut detection

The most aggressive strategy. A cut is dominated if, at every visited state, some other cut in the pool achieves an equal or higher value. Dominated cuts provide no value at any known operating point and can be safely deactivated.

Since verifying domination over the entire state space is intractable, Cobre checks domination only at the states visited during recent forward passes. As the set of visited states grows denser over iterations, the domination check becomes more reliable.

- **Retention policy**: not dominated at any visited state
- **Aggressiveness**: high -- directly targets cuts that contribute nothing
- **Cost**: $\mathcal{O}(|\text{cuts}| \times |\text{visited states}|)$ per stage per check

## Convergence guarantees

Level-1 and LML1 both preserve the finite convergence guarantee of SDDP: removing cuts that are never active at visited states does not affect the outer approximation quality at those states. This result is established in Bandarra and Guigues (2021).

## Configuration

Cut selection is controlled by four parameters: the strategy (`level1`, `lml1`, or `domination`), the activity threshold, the frequency of selection checks (in iterations), and the memory window (for LML1). See [Cut Management (spec) -- section 9](../specs/math/cut-management.md#9-selection-parameters) for the parameter table.

## Further reading

- [Cut Management (spec)](../specs/math/cut-management.md) -- formal definitions of cut activity, all three selection strategies, convergence theorem, and configuration parameters
- [Cut Management](cut-management.md) -- overview of the full cut lifecycle
- [Convergence](convergence.md) -- how cut quality affects stopping criteria and bound computation
