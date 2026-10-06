// Mirrors cvarWeights.test.ts (node:test + node:assert/strict). Every expected
// value is the number examples/toy-four-reservoir prints in §1 and §4-§5.
import test from "node:test";
import assert from "node:assert/strict";
import {
  TOY4,
  figureData,
  forwardPassMean,
  inflows,
  stage4Backward,
  terminalBus,
} from "./toyFourSlopes.ts";

const TOL = 1e-9;
const TRIAL = [0, 6, 5, 8];

function near(actual: number, expected: number, what: string): void {
  assert.ok(
    Math.abs(actual - expected) <= TOL,
    `${what}: ${actual} vs ${expected}`,
  );
}

function nearAll(actual: number[], expected: number[], what: string): void {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((x, i) => near(x, expected[i], `${what}[${i}]`));
}

test("TOY4 holds the parameter tables of page section 1", () => {
  assert.deepEqual(TOY4.hydros, ["H1", "H2", "H3", "H4"]);
  assert.deepEqual(TOY4.capacity, [100, 100, 80, 80]);
  assert.deepEqual(TOY4.initialStorage, [30, 30, 20, 20]);
  assert.deepEqual(TOY4.mean, [15, 12, 10, 8]);
  assert.deepEqual(TOY4.std, [5, 4, 3, 3]);
  assert.deepEqual(TOY4.demand, [25, 20, 15, 12]);
  assert.equal(TOY4.thermalCost, 50);
  assert.equal(TOY4.stages, 4);
  assert.deepEqual(TOY4.noise, [-1, 0, 1]);
  near(TOY4.probability, 1 / 3, "probability");
});

test("opening inflows match the page table", () => {
  nearAll(inflows(-1), [10, 8, 7, 5], "w1");
  nearAll(inflows(0), [15, 12, 10, 8], "w2");
  nearAll(inflows(1), [20, 16, 13, 11], "w3");
});

test("forward pass storages and costs", () => {
  const f = forwardPassMean();
  nearAll(f.storage[0], [20, 22, 15, 16], "x1");
  nearAll(f.storage[1], [10, 14, 10, 12], "x2");
  nearAll(f.storage[2], TRIAL, "x3");
  nearAll(f.stageCost, [0, 0, 0, 600], "cost");
});

test("stage-4 forward dispatch: two buses run thermal, B3 exactly balanced", () => {
  const a = inflows(0);
  const rows = TRIAL.map((x, h) => terminalBus(h, x, a[h]));
  nearAll(
    rows.map((r) => r.thermal),
    [10, 2, 0, 0],
    "thermal",
  );
  assert.equal(rows.filter((r) => r.thermal > 0).length, 2);
  near(rows[2].available, TOY4.demand[2], "B3 available = demand");
});

test("stage-4 openings: costs, intercepts, slopes and the aggregate cut", () => {
  const b = stage4Backward(TRIAL);
  nearAll(
    b.openings.map((o) => o.cost),
    [1200, 600, 250],
    "Q4",
  );
  nearAll(
    b.openings.map((o) => o.intercept),
    [1750, 900, 250],
    "b0",
  );
  nearAll(
    b.openings[0].buses.map((x) => x.slope),
    [-50, -50, -50, 0],
    "w1",
  );
  nearAll(
    b.openings[1].buses.map((x) => x.slope),
    [-50, -50, 0, 0],
    "w2",
  );
  nearAll(
    b.openings[2].buses.map((x) => x.slope),
    [-50, 0, 0, 0],
    "w3",
  );
  nearAll(b.openings[1].buses[2].slopeInterval, [-50, 0], "B3 kink");
  nearAll(b.slopes, [-50, -100 / 3, -50 / 3, 0], "slopes");
  near(b.intercept, 2900 / 3, "b0bar");
  near(
    b.intercept + b.slopes.reduce((s, x, h) => s + x * TRIAL[h], 0),
    b.expectedCost,
    "tight",
  );
  near(b.expectedCost, 2050 / 3, "Qbar");
});

test("the aggregated cut lies on or below the expected terminal cost", () => {
  const b = stage4Backward(TRIAL);
  const grid = [0, 5, 10, 15, 20, 25, 30];
  for (const x0 of grid)
    for (const x1 of grid)
      for (const x2 of grid)
        for (const x3 of grid) {
          const x = [x0, x1, x2, x3];
          const expected =
            TOY4.noise.reduce<number>((s, eps) => {
              const a = inflows(eps);
              return (
                s + x.reduce((c, xh, h) => c + terminalBus(h, xh, a[h]).cost, 0)
              );
            }, 0) / 3;
          const cut =
            b.intercept + b.slopes.reduce((s, sl, h) => s + sl * x[h], 0);
          assert.ok(cut <= expected + TOL, `cut ${cut} > ${expected} at ${x}`);
        }
});

test("a bus whose water equals its demand has interval [-50, 0] and slope 0", () => {
  const r = terminalBus(2, 5, 10);
  near(r.available, TOY4.demand[2], "available = demand");
  nearAll(r.slopeInterval, [-50, 0], "interval");
  near(r.slope, 0, "slope");
});

test("figureData returns H1..H4 in order with the four aggregate slopes", () => {
  const f = figureData();
  assert.deepEqual(
    f.map((r) => r.hydro),
    ["H1", "H2", "H3", "H4"],
  );
  nearAll(
    f.map((r) => r.slope),
    [-50, -100 / 3, -50 / 3, 0],
    "bars",
  );
});

test("figureData per-opening reduced costs are the plotted dots", () => {
  const f = figureData();
  const dots = [
    [-50, -50, -50],
    [-50, -50, 0],
    [-50, 0, 0],
    [0, 0, 0],
  ];
  f.forEach((r, h) => {
    nearAll(r.perOpening, dots[h], `dots ${r.hydro}`);
    near(
      r.perOpening.reduce((s, x) => s + x, 0) * TOY4.probability,
      r.slope,
      `bar ${r.hydro} is the mean of its dots`,
    );
  });
});
