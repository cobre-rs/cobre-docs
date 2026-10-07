// Compute layer — the "correct by construction" half of the SDDP convergence
// figure, ported out of matplotlib (diagrams/matplotlib/d21_convergence_bounds.py)
// into tested TypeScript. No rendering here; this only derives data from the math.
// The renderer (Observable Plot) consumes it.
//
// Model: the evolution of the lower and upper bound across SDDP iterations k.
//   - lb     = cStar − 30·exp(−k/8): a concave ramp rising toward cStar. The LB
//              is *monotone non-decreasing* — adding cuts can only raise the
//              restricted-master value (the append-only cut pool guarantee).
//   - ubMean = cStar + 40·exp(−k/8) + 1: the policy-cost upper bound descending
//              toward cStar from above. The 95% confidence band is
//              ubMean ± 1.96·ciSigma with ciSigma = 8·exp(−k/12) + 1, so the band
//              tightens as the per-iteration sample size grows.
// The UB *point* series is `ubMean` itself — DETERMINISTIC. The Python jittered it
// with a seeded RNG (cosmetic Monte-Carlo noise); a seeded RNG is not portable
// across runtimes and the figure must be reproducible, so the jitter is dropped.

export interface BoundPoint {
  k: number;
  lb: number;
  ubMean: number;
  ciLo: number;
  ciHi: number;
}

/**
 * Per-iteration bound evolution for k = 0 … kMax, with the lower bound monotone
 * non-decreasing toward `cStar`, the upper bound descending toward `cStar`, and a
 * 95% confidence band that tightens with k. Defaults mirror the Python source's
 * constants (kMax = 25, cStar = 100).
 */
export function bounds(kMax = 25, cStar = 100): BoundPoint[] {
  return Array.from({ length: kMax + 1 }, (_, k) => {
    const lb = cStar - 30 * Math.exp(-k / 8);
    const ubMean = cStar + 40 * Math.exp(-k / 8) + 1;
    const ciSigma = 8 * Math.exp(-k / 12) + 1;
    return {
      k,
      lb,
      ubMean,
      ciLo: ubMean - 1.96 * ciSigma,
      ciHi: ubMean + 1.96 * ciSigma,
    };
  });
}

export interface ExactPoint {
  k: number;
  lb: number;
  ubExact: number;
}

/**
 * Two-panel companion to bounds(): one policy, its upper bound evaluated two ways.
 *   - exact   = the upper bound of an enumerated forward pass. ubExact descends
 *               toward cStar and never falls below lb, so the gap it leaves with
 *               the lower bound closes toward zero — the quantity the gap rule tests.
 *   - sampled = the upper bound of a sampled forward pass: the sample mean (the
 *               same value as ubExact, in expectation) with a 95% band. The band's
 *               standard error has a floor — the per-iteration sample size is
 *               fixed — so it shrinks toward a floor while the gap closes faster,
 *               and late in the run its lower edge falls below lb. A sampled
 *               estimate therefore cannot certify optimality.
 * Both panels take the lower bound from bounds(), so the lb series is shared.
 */
export function panels(
  kMax = 25,
  cStar = 100,
): { sampled: BoundPoint[]; exact: ExactPoint[] } {
  const exact = bounds(kMax, cStar).map(({ k, lb }) => ({
    k,
    lb,
    ubExact: cStar + 40 * Math.exp(-k / 8),
  }));
  const sampled = exact.map(({ k, lb, ubExact }) => {
    const half = 1.96 * (6 * Math.exp(-k / 12) + 3);
    return {
      k,
      lb,
      ubMean: ubExact,
      ciLo: ubExact - half,
      ciHi: ubExact + half,
    };
  });
  return { sampled, exact };
}
