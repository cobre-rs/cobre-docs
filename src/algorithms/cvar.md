# Conditional Value at Risk (CVaR)

## What is CVaR?

Conditional Value-at-Risk (CVaR) is a risk measure that captures the **expected cost in the worst-case tail** of a probability distribution. While the ordinary expected value averages over all outcomes equally, CVaR focuses on the most adverse fraction.

Formally, for a random cost $Z$ and a confidence level $\alpha \in (0, 1]$:

$$
\text{CVaR}_\alpha(Z) = \min_{\eta \in \mathbb{R}} \left\{ \eta + \frac{1}{\alpha} \, \mathbb{E}\left[(Z - \eta)^+\right] \right\}
$$

The parameter $\alpha$ determines how deep into the tail the measure looks. Smaller $\alpha$ means a more pessimistic assessment.

## Intuitive interpretation

Imagine sorting all possible cost outcomes from lowest to highest. CVaR$_\alpha$ is the average cost among the worst $\alpha$-fraction of those outcomes.

- **$\alpha = 1$**: The "worst 100%" is the entire distribution, so CVaR$_1$ equals the ordinary expected value $\mathbb{E}[Z]$.
- **$\alpha = 0.5$**: The average cost of the worst half of outcomes.
- **$\alpha = 0.05$**: The average cost of the worst 5% of outcomes -- a strongly pessimistic measure.

## Relationship to VaR

Value-at-Risk (VaR) is the threshold below which the worst $\alpha$-fraction of outcomes falls. CVaR goes further: it averages all costs **beyond** that threshold. This makes CVaR strictly more conservative than VaR and, unlike VaR, it is a coherent risk measure (satisfying monotonicity, translation equivariance, positive homogeneity, and subadditivity).

## Why CVaR for hydrothermal dispatch?

In hydrothermal systems, the primary source of uncertainty is river inflows. A sequence of dry years can deplete reservoirs and force the system to rely on expensive thermal generation or, in extreme cases, impose load curtailment. The expected cost may look acceptable, but the cost in drought scenarios can be catastrophic.

By incorporating CVaR into the SDDP objective, the optimizer builds policies that maintain higher reservoir levels as a hedge against drought. The resulting policy costs slightly more on average but avoids the worst tail outcomes -- a trade-off that power system operators typically prefer.

## How CVaR enters the SDDP algorithm

Cobre does not use pure CVaR in isolation. Instead, it uses a **convex combination** of expectation and CVaR:

$$
\rho^{\lambda, \alpha}[Z] = (1 - \lambda) \, \mathbb{E}[Z] + \lambda \cdot \text{CVaR}_\alpha[Z]
$$

During the backward pass, this combination changes only the **aggregation weights** used to combine per-scenario cut coefficients into a single cut. Scenarios with higher costs receive proportionally more weight, while low-cost scenarios receive less. The LP formulation, dual extraction, and cut structure remain unchanged.

## Further reading

- [Risk Measures](risk-measures.md) -- Overview of risk-averse vs risk-neutral SDDP
- [Risk Measures (spec)](../specs/math/risk-measures.md) -- Complete formal specification including the dual representation of CVaR, the sorting-based weight computation algorithm, and the critical warning about lower bound validity
- [SDDP Theory](sddp-theory.md) -- How the forward-backward iteration works
