// Compute layer — the "correct by construction" half of the math-figure story,
// ported out of matplotlib into tested TypeScript. No rendering here; this only
// derives data from the math. The renderer (Observable Plot) consumes it.
//
// Model: a convex, decreasing future-cost function Q(v) = A·exp(-v/s), standing
// in for an SDDP cost-to-go in stored volume v. Benders cuts are its tangents.

export interface Point {
  v: number;
  q: number;
}

const A = 100; // cost scale
const S = 40; // volume scale (hm³)

/** Future cost as a function of stored volume. Convex, decreasing. */
export function Q(v: number): number {
  return A * Math.exp(-v / S);
}

/** Analytic derivative Q'(v). The Benders subgradient. */
export function dQ(v: number): number {
  return -(A / S) * Math.exp(-v / S);
}

/** Sample the curve on [0, vmax] with n+1 points. */
export function samples(vmax = 100, n = 80): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const v = (vmax * i) / n;
    return { v, q: Q(v) };
  });
}

export interface Tangent {
  v0: number;
  slope: number;
  intercept: number;
  at: (v: number) => number;
}

/** Benders tangent (cut) at pin v0 — slope is the *actual* derivative, never eyeballed. */
export function bendersTangentAt(v0: number): Tangent {
  const slope = dQ(v0);
  const intercept = Q(v0) - slope * v0;
  return { v0, slope, intercept, at: (v: number) => slope * v + intercept };
}
