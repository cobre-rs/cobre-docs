# Risk Measures

## Why risk matters in power system planning

Standard SDDP minimizes the **expected** total cost across all scenarios. This produces policies that perform well on average but can lead to extremely high costs in adverse scenarios -- for example, a prolonged drought that depletes reservoirs and forces expensive thermal generation or load shedding.

Risk-averse SDDP addresses this by incorporating a **risk measure** into the optimization objective. Instead of minimizing only the average cost, the algorithm also penalizes outcomes in the tail of the cost distribution. The result is a policy that sacrifices a small amount of average-case performance for substantially better worst-case behavior.

## Risk-neutral vs risk-averse

In risk-neutral SDDP, each backward pass aggregates per-scenario cut coefficients using the scenario probabilities $p(\omega)$. All scenarios contribute equally (weighted by probability) to the cut that approximates the future cost function.

In risk-averse SDDP, the scenario probabilities are replaced by **risk-adjusted weights** $\mu^*_\omega$ that place more emphasis on expensive (adverse) scenarios. The cut generation mechanics are otherwise identical -- only the aggregation weights change.

## The convex combination risk measure

Cobre uses a convex combination of expectation and Conditional Value-at-Risk (CVaR):

$$
\rho^{\lambda, \alpha}[Z] = (1 - \lambda) \, \mathbb{E}[Z] + \lambda \cdot \text{CVaR}_\alpha[Z]
$$

This formulation has two parameters:

- **$\lambda$ (risk aversion weight)**: Controls the blend between expected value and CVaR. Setting $\lambda = 0$ recovers risk-neutral SDDP; setting $\lambda = 1$ uses pure CVaR.
- **$\alpha$ (confidence level)**: Controls how deep into the tail CVaR looks. Smaller $\alpha$ means focusing on more extreme adverse scenarios.

Both parameters can vary by stage, allowing operators to apply stronger risk aversion to near-term decisions (where consequences are immediate) and weaker risk aversion to distant stages.

## Implications for convergence monitoring

A critical subtlety of risk-averse SDDP is that the first-stage LP objective is **not a valid lower bound** on the true risk-averse optimal cost. It remains a useful convergence indicator (it increases monotonically and plateaus), but it cannot be interpreted as a bound in the same way as in risk-neutral SDDP. Valid upper bounds require the inner approximation (SIDP) method.

## Further reading

- [CVaR](cvar.md) -- Intuitive explanation of Conditional Value-at-Risk
- [Risk Measures (spec)](../specs/math/risk-measures.md) -- Complete formal specification: dual representations, subgradient theorem, risk-averse Bellman equation, cut generation algorithm, and lower bound validity warning
- [Cut Management](cut-management.md) -- How risk-adjusted weights integrate into cut aggregation
- [Convergence](convergence.md) -- Bound computation and stopping criteria
