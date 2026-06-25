// Compute layer — the "correct by construction" half of the CVaR risk-landscape
// figure, ported out of matplotlib (diagrams/matplotlib/d22_risk_measure_cvar.py)
// into tested TypeScript. No rendering here; this only derives data from the math.
// The renderer (Observable Plot) consumes it.
//
// Model: a right-skewed cost distribution C ~ Gamma(shape, scale). The risk
// markers are derived *numerically* from the analytic PDF, never eyeballed:
//   - E[C]      = ∫ x·f(x) dx                       (risk-neutral reference)
//   - VaR_alpha = the (1−alpha) quantile of C        (inverse trapezoid CDF)
//   - CVaR_alpha= E[C | C ≥ VaR_alpha]               (tail mean), the convex,
//                 coherent tail risk the risk-averse policy hedges against.
// Defaults mirror the Python source's constants: shape=3, scale=15, alpha=0.10
// (so the mean is shape·scale = 45 and the distribution is right-skewed).

export interface Point {
  x: number;
  f: number;
}

export interface RiskMoments {
  expected: number;
  varAlpha: number;
  cvarAlpha: number;
}

export interface TailRegion {
  /** x-grid points at or beyond VaR_alpha (the shaded (1−alpha) tail). */
  points: Point[];
}

// Lanczos approximation to the natural log of the gamma function. Implemented
// inline (no jstat / no new npm dep — zero-new-deps is the project convention)
// so the log-form PDF below is stable near x = 0. g = 7 coefficients give double
// precision across the domain we sample.
const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** Natural log of the gamma function via the Lanczos approximation. */
export function lgamma(x: number): number {
  // Reflection formula for x < 0.5 keeps the series in its accurate range.
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  const z = x - 1;
  let a = LANCZOS_COEFFICIENTS[0];
  const t = z + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_G + 2; i += 1) {
    a += LANCZOS_COEFFICIENTS[i] / (z + i);
  }
  return (
    0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
  );
}

/**
 * Analytic gamma PDF via its log form (numerically stable near 0). Mirrors the
 * Python `gamma_pdf`: guards the `(shape−1)·log(x)` term at x ≤ 0 (which would be
 * −Inf) and maps any non-finite result to 0 (the Python `f[~isfinite] = 0`).
 */
export function gammaPdf(x: number, shape: number, scale: number): number {
  if (x <= 0) return 0;
  const logF =
    (shape - 1) * Math.log(x) -
    x / scale -
    shape * Math.log(scale) -
    lgamma(shape);
  const f = Math.exp(logF);
  return Number.isFinite(f) ? f : 0;
}

/** Evenly spaced grid of `n` points on [start, end], inclusive (np.linspace). */
function linspace(start: number, end: number, n: number): number[] {
  return Array.from(
    { length: n },
    (_, i) => start + ((end - start) * i) / (n - 1),
  );
}

/**
 * Sample the PDF on [0, xMax] with `n` points. The x = 0 anchor is included so
 * the rendered curve starts at the axis (PDF there is 0 for shape > 1).
 */
export function samples(shape = 3, scale = 15, xMax = 180, n = 4000): Point[] {
  return linspace(0, xMax, n).map((x) => ({ x, f: gammaPdf(x, shape, scale) }));
}

/**
 * Cumulative distribution via the trapezoid rule, normalised to end at exactly
 * 1.0 (mirrors the Python `cdf /= cdf[-1]`). Returned parallel to the input grid.
 */
function trapezoidCdf(grid: Point[]): number[] {
  const cdf = [0];
  for (let i = 1; i < grid.length; i += 1) {
    const dx = grid[i].x - grid[i - 1].x;
    cdf.push(cdf[i - 1] + ((grid[i - 1].f + grid[i].f) / 2) * dx);
  }
  const total = cdf[cdf.length - 1];
  return cdf.map((c) => c / total);
}

/**
 * Linear interpolation of `query` against the monotone `xs`→`ys` table (the
 * np.interp used for quantile inversion). Clamps to the endpoints out of range.
 */
function interp(query: number, xs: number[], ys: number[]): number {
  if (query <= xs[0]) return ys[0];
  if (query >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= query) lo = mid;
    else hi = mid;
  }
  const t = (query - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}

/**
 * Risk moments derived by numerical integration of the gamma PDF — markers
 * correct by construction. `expected` is ∫x·f dx; `varAlpha` is the (1−alpha)
 * quantile via trapezoid-CDF inversion; `cvarAlpha` is the tail mean
 * ∫_{x≥VaR} x·f / ∫_{x≥VaR} f. Defaults mirror the Python source.
 */
export function riskMoments(shape = 3, scale = 15, alpha = 0.1): RiskMoments {
  const grid = samples(shape, scale);
  const cdf = trapezoidCdf(grid);

  let expected = 0;
  for (let i = 1; i < grid.length; i += 1) {
    const dx = grid[i].x - grid[i - 1].x;
    const left = grid[i - 1].x * grid[i - 1].f;
    const right = grid[i].x * grid[i].f;
    expected += ((left + right) / 2) * dx;
  }

  const xs = grid.map((p) => p.x);
  const varAlpha = interp(1 - alpha, cdf, xs);

  let tailMass = 0;
  let tailWeighted = 0;
  for (let i = 1; i < grid.length; i += 1) {
    if (grid[i - 1].x < varAlpha) continue;
    const dx = grid[i].x - grid[i - 1].x;
    tailMass += ((grid[i - 1].f + grid[i].f) / 2) * dx;
    const left = grid[i - 1].x * grid[i - 1].f;
    const right = grid[i].x * grid[i].f;
    tailWeighted += ((left + right) / 2) * dx;
  }
  const cvarAlpha = tailWeighted / tailMass;

  return { expected, varAlpha, cvarAlpha };
}

/** Build the cumulative distribution for testing the monotonicity / endpoint. */
export function cdf(shape = 3, scale = 15): number[] {
  return trapezoidCdf(samples(shape, scale));
}

/** The shaded (1−alpha) tail: grid points at or beyond VaR_alpha. */
export function tailRegion(shape = 3, scale = 15, alpha = 0.1): TailRegion {
  const { varAlpha } = riskMoments(shape, scale, alpha);
  return {
    points: samples(shape, scale).filter((p) => p.x >= varAlpha),
  };
}
