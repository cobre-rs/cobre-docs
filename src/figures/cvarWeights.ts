// Compute layer — the "correct by construction" half of the CVaR weights figure
// (risk-measures §7, Step 2). No rendering here; this only derives the weights of
// the worked example from the math. The renderer (Observable Plot) consumes it.
//
// Model: n openings with costs Z_i and nominal probabilities p_i (sum 1), a tail
// fraction alpha in (0, 1] and a risk weight lambda in [0, 1].
//   - tailWeights        q*, the CVaR_alpha dual probability vector (§4.1): walk
//                        the openings from the costliest down, give each up to
//                        p_i / alpha, and let the opening that reaches the total
//                        mass 1 take the remainder.
//   - methodologyWeights mu* = (1 - lambda) p + lambda q* (§4.2, §7): every opening
//                        keeps the floor (1 - lambda) p_i, so mu*_i lies in
//                        [(1 - lambda) p_i, (1 - lambda) p_i + lambda p_i / alpha]
//                        and sum_i mu*_i Z_i = (1 - lambda) E[Z] + lambda CVaR_alpha[Z].
// Worked example (risk-measures §7): costs 10, 20, 30, 40, p = 0.25 each,
// alpha = lambda = 0.5 give mu* = (0.125, 0.125, 0.375, 0.375) and value 30.0.

export interface WeightRow {
  cost: number;
  nominal: number;
  floor: number;
  mu: number;
}

/**
 * q*: the CVaR_alpha tail weights, a greedy fill in descending cost order up to
 * p_i / alpha, the last opening touched taking the remainder; ties keep input
 * order. Returns weights in input order.
 */
export function tailWeights(
  costs: number[],
  probs: number[],
  alpha: number,
): number[] {
  const order = costs.map((_, i) => i).sort((i, j) => costs[j] - costs[i]);
  const weights = costs.map(() => 0);
  let remaining = 1;
  for (const i of order) {
    weights[i] = Math.min(probs[i] / alpha, remaining);
    remaining -= weights[i];
  }
  return weights;
}

/** mu* = (1 - lambda) p + lambda q*: the risk-adjusted weights with the floor. */
export function methodologyWeights(
  costs: number[],
  probs: number[],
  alpha: number,
  lambda: number,
): number[] {
  const q = tailWeights(costs, probs, alpha);
  return probs.map((p, i) => (1 - lambda) * p + lambda * q[i]);
}

/** The value a weight vector assigns to the opening costs: the sum of weight times cost. */
export function weightedValue(costs: number[], weights: number[]): number {
  return costs.reduce((sum, cost, i) => sum + cost * weights[i], 0);
}

const EXAMPLE_COSTS = [10, 20, 30, 40];
const EXAMPLE_PROB = 0.25;
const EXAMPLE_ALPHA = 0.5;
const EXAMPLE_LAMBDA = 0.5;

/** The pinned worked example, one row per opening, for the renderer. */
export function exampleRows(): WeightRow[] {
  const probs = EXAMPLE_COSTS.map(() => EXAMPLE_PROB);
  const mu = methodologyWeights(
    EXAMPLE_COSTS,
    probs,
    EXAMPLE_ALPHA,
    EXAMPLE_LAMBDA,
  );
  return EXAMPLE_COSTS.map((cost, i) => ({
    cost,
    nominal: probs[i],
    floor: (1 - EXAMPLE_LAMBDA) * probs[i],
    mu: mu[i],
  }));
}
