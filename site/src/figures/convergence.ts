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
