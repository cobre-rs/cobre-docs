// Compute layer for the single-reservoir walkthrough (examples/toy-single-reservoir),
// the "correct by construction" half of its cost-to-go figure. No rendering here.
//
// Model: one reservoir (capacity 100, initial storage 30), one thermal unit at 50 per
// unit against a demand of 40 (the deficit slack never binds), no discounting, four
// stages, and a 0-order inflow with three equiprobable openings (20, 30, 40). Each
// stage LP is solved exactly: its objective is convex piecewise-linear in the turbined
// flow q, so an optimum sits at a bound or at a breakpoint of the cut set, and ties go
// to the larger q. A cut slope is the derivative of the stage cost in the incoming
// storage; at a kink it takes the right derivative, the rate for one more unit of
// incoming storage. The module re-runs iterations 1 and 2 (forward pass, backward pass,
// cut construction, lower bound) and computes the exact cost-to-go V_t(v) by
// enumerating inflow sequences.
export interface Cut {
  intercept: number;
  slope: number;
}
export const TOY = {
  stages: 4,
  demand: 40,
  thermalCost: 50,
  capacity: 100,
  initialStorage: 30,
  inflows: [20, 30, 40], // openings eps = -1, 0, +1 (mean 30, std 10)
  probability: 1 / 3,
} as const;
export const ITERATION_NOISE: number[][] = [
  [0, 0, 0, 0],
  [1, 0, 0, 0],
];

export function cutValue(c: Cut, v: number): number {
  return c.intercept + c.slope * v;
}
/** theta seen by a stage LP: max(0, every cut) (theta >= 0 and theta >= each cut). */
export function costToGoApprox(cuts: Cut[], v: number): number {
  return Math.max(0, ...cuts.map((c) => cutValue(c, v)));
}
function rightSlopeOf(cuts: Cut[], v: number): number {
  const pieces = [{ intercept: 0, slope: 0 }, ...cuts];
  const top = Math.max(...pieces.map((c) => cutValue(c, v)));
  const atTop = (c: Cut) => Math.abs(cutValue(c, v) - top) < 1e-9;
  return Math.max(...pieces.filter(atTop).map((c) => c.slope));
}
function leftSlopeOf(cuts: Cut[], v: number): number {
  const pieces = [{ intercept: 0, slope: 0 }, ...cuts];
  const top = Math.max(...pieces.map((c) => cutValue(c, v)));
  const atTop = (c: Cut) => Math.abs(cutValue(c, v) - top) < 1e-9;
  return Math.min(...pieces.filter(atTop).map((c) => c.slope));
}
export interface StageSolution {
  q: number;
  g: number;
  vOut: number;
  theta: number;
  cost: number;
}
/** min c_th g + theta  s.t. q + g = D, vOut = vIn + a - q, 0 <= vOut <= cap, q, g >= 0. */
export function solveStage(
  vIn: number,
  inflow: number,
  cuts: Cut[],
): StageSolution {
  const { demand: D, thermalCost: c, capacity } = TOY;
  // prettier-ignore
  if (cuts.some((k) => k.slope < -c)) throw new Error("cut slope steeper than the thermal cost");
  const lo = Math.max(0, vIn + inflow - capacity);
  const hi = Math.min(D, vIn + inflow);
  const cands = new Set<number>([lo, hi]);
  const pieces = [{ intercept: 0, slope: 0 }, ...cuts];
  for (const a of pieces)
    for (const b of pieces) {
      if (a.slope !== b.slope)
        cands.add(
          vIn + inflow - (b.intercept - a.intercept) / (a.slope - b.slope),
        );
    }
  let best: StageSolution | null = null;
  for (const q of cands) {
    if (q < lo - 1e-12 || q > hi + 1e-12) continue;
    const vOut = vIn + inflow - q;
    const theta = costToGoApprox(cuts, vOut);
    const cost = c * (D - q) + theta;
    if (
      best === null ||
      cost < best.cost - 1e-9 ||
      (Math.abs(cost - best.cost) <= 1e-9 && q > best.q)
    ) {
      best = { q, g: D - q, vOut, theta, cost };
    }
  }
  return best as StageSolution;
}
/** [left, right] derivative of the stage cost in the incoming storage (valid subgradient interval). */
export function storageSlopes(
  vIn: number,
  inflow: number,
  cuts: Cut[],
): [number, number] {
  const { demand: D, thermalCost: c } = TOY;
  const avail = vIn + inflow;
  const right = avail < D - 1e-9 ? -c : rightSlopeOf(cuts, avail - D);
  const left = avail <= D + 1e-9 ? -c : leftSlopeOf(cuts, avail - D);
  return [left, right];
}
export interface OpeningRow extends StageSolution {
  inflow: number;
  slopeInterval: [number, number];
  slope: number;
  intercept: number;
}
/** One backward-pass step at trial point vHat: per-opening rows and the probability-weighted cut (right-derivative choice). */
export function backwardCut(
  vHat: number,
  cutsNext: Cut[],
): { cut: Cut; openings: OpeningRow[]; expectedCost: number } {
  const openings = TOY.inflows.map((inflow) => {
    const s = solveStage(vHat, inflow, cutsNext);
    const slopeInterval = storageSlopes(vHat, inflow, cutsNext);
    const slope = slopeInterval[1];
    return {
      ...s,
      inflow,
      slopeInterval,
      slope,
      intercept: s.cost - slope * vHat,
    };
  });
  const p = TOY.probability;
  return {
    openings,
    cut: {
      intercept: p * openings.reduce((s, r) => s + r.intercept, 0),
      slope: p * openings.reduce((s, r) => s + r.slope, 0),
    },
    expectedCost: p * openings.reduce((s, r) => s + r.cost, 0),
  };
}
export interface TrajectoryStage extends StageSolution {
  stage: number;
  vIn: number;
  inflow: number;
}
/** cuts[t-1] = cuts in stage t's LP (t = 1..T); the terminal stage has none. */
export function forwardPass(noise: number[], cuts: Cut[][]): TrajectoryStage[] {
  const out: TrajectoryStage[] = [];
  let v: number = TOY.initialStorage;
  for (let t = 1; t <= TOY.stages; t += 1) {
    const inflow = 30 + 10 * noise[t - 1];
    const s = solveStage(v, inflow, cuts[t - 1]);
    out.push({ ...s, stage: t, vIn: v, inflow });
    v = s.vOut;
  }
  return out;
}
export function lowerBound(cuts: Cut[][]): {
  value: number;
  openings: StageSolution[];
} {
  const openings = TOY.inflows.map((a) =>
    solveStage(TOY.initialStorage, a, cuts[0]),
  );
  return {
    value: TOY.probability * openings.reduce((s, r) => s + r.cost, 0),
    openings,
  };
}
export interface Iteration {
  trajectory: TrajectoryStage[];
  backward: ReturnType<typeof backwardCut>[];
  lowerBound: number;
  cuts: Cut[][];
}
export function runIterations(
  noisePerIteration: number[][] = ITERATION_NOISE,
): Iteration[] {
  let cuts: Cut[][] = Array.from({ length: TOY.stages }, () => []);
  const out: Iteration[] = [];
  for (const noise of noisePerIteration) {
    const trajectory = forwardPass(noise, cuts);
    const next = cuts.map((c) => [...c]);
    const backward: ReturnType<typeof backwardCut>[] = [];
    for (let t = TOY.stages; t >= 2; t -= 1) {
      const vHat = trajectory[t - 2].vOut;
      const step = backwardCut(vHat, next[t - 1]);
      backward.unshift(step);
      next[t - 2].push(step.cut);
    }
    cuts = next;
    out.push({
      trajectory,
      backward,
      lowerBound: lowerBound(cuts).value,
      cuts,
    });
  }
  return out;
}
/** Exact V_t(v): expected optimal cost of stages t..T from incoming storage v, by enumerating inflow sequences
 *  under turbine-first dispatch (optimal because no unit of stored water saves more than one unit of thermal). */
export function trueCostToGo(t: number, v: number): number {
  if (t > TOY.stages) return 0;
  return (
    TOY.probability *
    TOY.inflows.reduce((s, a) => {
      const q = Math.min(TOY.demand, v + a);
      return (
        s + TOY.thermalCost * (TOY.demand - q) + trueCostToGo(t + 1, v + a - q)
      );
    }, 0)
  );
}
export function figureData(step = 1, vmax = 50) {
  const it = runIterations();
  const stage2Cuts = it[1].cuts[1]; // cuts in stage 2's LP: approximations of V_3
  const grid = Array.from(
    { length: Math.round(vmax / step) + 1 },
    (_, i) => i * step,
  );
  return {
    trueCurve: grid.map((v) => ({ v, value: trueCostToGo(3, v) })),
    envelope: grid.map((v) => ({ v, value: costToGoApprox(stage2Cuts, v) })),
    cuts: stage2Cuts.map((c, i) => ({ iteration: i + 1, ...c })),
    trialPoints: it.map((k, i) => {
      const v = k.trajectory[1].vOut;
      return { iteration: i + 1, v, value: trueCostToGo(3, v) };
    }),
    cutSegments: stage2Cuts.map((c, i) => {
      const to = Math.min(vmax, -c.intercept / c.slope);
      return {
        iteration: i + 1,
        from: { v: 0, value: c.intercept },
        to: { v: to, value: cutValue(c, to) },
      };
    }),
  };
}
