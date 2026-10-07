// Compute layer — the "correct by construction" half of the four-reservoir
// slope figure (examples/toy-four-reservoir §5-§6). No rendering here; this
// re-runs the walkthrough's iteration-1 backward pass at stage 4 and derives the
// cut slopes the page states. The renderer (Observable Plot) consumes it.
//
// Case: four buses, each with one local hydro, one local thermal and one demand
// block; no cascade and no transmission, so the terminal stage splits into four
// independent bus problems. The three openings share one standard-normal
// innovation eps in {-1, 0, +1}, each with probability 1/3.
//   - terminalBus      one bus at the terminal stage (no theta): turbine up to
//                      the demand, the thermal covers the rest. The storage cut
//                      slope is the right derivative: -thermalCost while the
//                      water is short, 0 once it covers the demand. A bus whose
//                      available water equals its demand is a kink with the
//                      subgradient interval [-thermalCost, 0] and takes 0.
//   - forwardPassMean  iteration 1 with eps = 0 and theta = 0 (no cuts), so
//                      every stage dispatches like the terminal one.
//   - stage4Backward   the per-opening costs, slopes and intercepts at a trial
//                      point, aggregated by probability into one cut.
//   - figureData       the aggregate slope and the per-opening reduced costs of
//                      each hydro at the stage-3 trial point.
// Worked example (page §4-§5): trial point (0, 6, 5, 8); opening costs 1200, 600,
// 250 and intercepts 1750, 900, 250; aggregate slopes (-50, -100/3, -50/3, 0),
// intercept 2900/3, value 2050/3 at the trial point.

export const TOY4 = {
  hydros: ["H1", "H2", "H3", "H4"],
  capacity: [100, 100, 80, 80],
  initialStorage: [30, 30, 20, 20],
  mean: [15, 12, 10, 8],
  std: [5, 4, 3, 3],
  demand: [25, 20, 15, 12],
  thermalCost: 50,
  stages: 4,
  noise: [-1, 0, 1],
  probability: 1 / 3,
} as const;

export interface BusDispatch {
  available: number;
  q: number;
  thermal: number;
  cost: number;
  slopeInterval: [number, number];
  slope: number;
  vOut: number;
}

export function inflows(eps: number): number[] {
  return TOY4.mean.map((m, h) => m + TOY4.std[h] * eps);
}

export function terminalBus(
  h: number,
  vIn: number,
  inflow: number,
): BusDispatch {
  const D = TOY4.demand[h];
  const c = TOY4.thermalCost;
  const available = vIn + inflow;
  const q = Math.min(D, available);
  const thermal = D - q;
  const right = available < D ? -c : 0;
  const left = available <= D ? -c : 0;
  return {
    available,
    q,
    thermal,
    cost: c * thermal,
    slopeInterval: [left, right],
    slope: right,
    vOut: available - q,
  };
}

export function forwardPassMean(): {
  storage: number[][];
  stageCost: number[];
} {
  let v: number[] = [...TOY4.initialStorage];
  const storage: number[][] = [];
  const stageCost: number[] = [];
  for (let t = 1; t <= TOY4.stages; t += 1) {
    const a = inflows(0);
    const rows = v.map((x, h) => terminalBus(h, x, a[h]));
    stageCost.push(rows.reduce((s, r) => s + r.cost, 0));
    v = rows.map((r) => r.vOut);
    storage.push(v);
  }
  return { storage, stageCost };
}

function openingCut(trial: number[], eps: number) {
  const a = inflows(eps);
  const buses = trial.map((x, h) => terminalBus(h, x, a[h]));
  const cost = buses.reduce((s, b) => s + b.cost, 0);
  const intercept = cost - buses.reduce((s, b, h) => s + b.slope * trial[h], 0);
  return { buses, cost, intercept };
}

export function stage4Backward(trial: number[]) {
  const openings = TOY4.noise.map((eps) => openingCut(trial, eps));
  const p = TOY4.probability;
  const slopes = TOY4.hydros.map(
    (_, h) => p * openings.reduce((s, o) => s + o.buses[h].slope, 0),
  );
  const intercept = p * openings.reduce((s, o) => s + o.intercept, 0);
  const expectedCost = p * openings.reduce((s, o) => s + o.cost, 0);
  return { openings, slopes, intercept, expectedCost };
}

export function figureData() {
  const trial = forwardPassMean().storage[2];
  const b = stage4Backward(trial);
  return TOY4.hydros.map((hydro, h) => ({
    hydro,
    slope: b.slopes[h],
    perOpening: b.openings.map((o) => o.buses[h].slope),
  }));
}
