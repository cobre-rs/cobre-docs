import test from "node:test";
import assert from "node:assert/strict";
import {
  ITERATION_NOISE,
  TOY,
  lowerBound,
  runIterations,
  trueCostToGo,
  solveStage,
  storageSlopes,
  costToGoApprox,
  figureData,
  cutValue,
} from "./toySingleValue.ts";
const near = (a: number, b: number, tol: number, what: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
const nearAll = (a: number[], b: number[], what: string) => {
  assert.equal(a.length, b.length);
  a.forEach((x, i) => near(x, b[i], 1e-9, `${what}[${i}]`));
};
const it = runIterations();
// Independent check: a dynamic program over a 0.5 release grid, with no closed form.
const dp = (t: number, v: number): number =>
  t > 4
    ? 0
    : (1 / 3) *
      [20, 30, 40].reduce((s, a) => {
        let best = Infinity;
        for (let q = 0; q <= 40; q += 0.5) {
          const vo = v + a - q;
          if (vo >= 0 && vo <= 100)
            best = Math.min(best, 50 * (40 - q) + dp(t + 1, vo));
        }
        return s + best;
      }, 0);
test("case parameters match the page's parameter table", () => {
  const mu = 30;
  const sigma = 10;
  assert.equal(TOY.stages, 4);
  assert.equal(TOY.demand, 40);
  assert.equal(TOY.thermalCost, 50);
  assert.equal(TOY.capacity, 100);
  assert.equal(TOY.initialStorage, 30);
  assert.equal(TOY.inflows.length, 3);
  nearAll(
    [...TOY.inflows],
    [-1, 0, 1].map((e) => mu + sigma * e),
    "inflows = mu + sigma eps",
  );
  near(TOY.probability, 1 / TOY.inflows.length, 1e-12, "probability");
  assert.deepEqual(ITERATION_NOISE, [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
  ]);
});
test("iteration-1 forward pass (eps = 0)", () => {
  nearAll(
    it[0].trajectory.map((s) => s.vOut),
    [20, 10, 0, 0],
    "v",
  );
  nearAll(
    it[0].trajectory.map((s) => 50 * s.g),
    [0, 0, 0, 500],
    "stage cost",
  );
});
test("iteration-1 stage 4", () => {
  const b = it[0].backward[2];
  nearAll(
    b.openings.map((r) => r.cost),
    [1000, 500, 0],
    "Q4",
  );
  nearAll(
    b.openings.map((r) => r.slope),
    [-50, -50, 0],
    "beta",
  );
  nearAll(b.openings[2].slopeInterval, [-50, 0], "w3 kink");
  near(b.cut.intercept, 500, 1e-9, "b0");
  near(b.cut.slope, -100 / 3, 1e-9, "bv");
});
test("iteration-1 stage 3", () => {
  const b = it[0].backward[1];
  nearAll(
    b.openings.map((r) => r.theta),
    [500, 500, 500 / 3],
    "theta*",
  );
  nearAll(
    b.openings.map((r) => r.cost),
    [1000, 500, 500 / 3],
    "Q3",
  );
  nearAll(
    b.openings.map((r) => r.slope),
    [-50, -100 / 3, -100 / 3],
    "beta",
  );
  nearAll(b.openings[1].slopeInterval, [-50, -100 / 3], "w2 kink");
  nearAll(
    b.openings.map((r) => r.intercept),
    [1500, 2500 / 3, 500],
    "b0",
  );
  near(b.cut.intercept, 8500 / 9, 1e-9, "b0");
  near(b.cut.slope, -350 / 9, 1e-9, "bv");
});
test("iteration-1 stage 2 and lower bound", () => {
  const b = it[0].backward[0];
  nearAll(
    b.openings.map((r) => r.cost),
    [8500 / 9, 5000 / 9, 500 / 3],
    "Q2",
  );
  nearAll(
    b.openings.map((r) => r.slope),
    [-350 / 9, -350 / 9, -350 / 9],
    "beta",
  );
  nearAll(b.openings[0].slopeInterval, [-50, -350 / 9], "w1 kink");
  nearAll(
    b.openings.map((r) => r.intercept),
    [15500 / 9, 4000 / 3, 8500 / 9],
    "b0",
  );
  near(b.cut.intercept, 4000 / 3, 1e-9, "b0");
  near(b.cut.slope, -350 / 9, 1e-9, "bv");
  near(it[0].lowerBound, 5000 / 9, 1e-9, "LB1");
});
test("iteration 2", () => {
  nearAll(
    it[1].trajectory.map((s) => s.vOut),
    [30, 20, 10, 0],
    "v",
  );
  nearAll(
    it[1].trajectory.map((s) => s.theta),
    [500 / 3, 500 / 3, 500 / 3, 0],
    "theta",
  );
  nearAll(
    it[1].trajectory.map((s) => 50 * s.g),
    [0, 0, 0, 0],
    "cost",
  );
  const [s2, s3, s4] = it[1].backward;
  near(s4.cut.intercept, 1000 / 3, 1e-9, "s4 b0");
  near(s4.cut.slope, -50 / 3, 1e-9, "s4 bv");
  nearAll(
    s3.openings.map((r) => r.cost),
    [500, 500 / 3, 0],
    "Q3 it2",
  );
  nearAll(
    s3.openings.map((r) => r.slope),
    [-100 / 3, -50 / 3, 0],
    "beta3 it2",
  );
  near(s3.cut.intercept, 5000 / 9, 1e-9, "s3 b0");
  near(s3.cut.slope, -50 / 3, 1e-9, "s3 bv");
  nearAll(
    s2.openings.map((r) => r.cost),
    [5000 / 9, 2000 / 9, 500 / 9],
    "Q2 it2",
  );
  near(s2.cut.intercept, 1000, 1e-9, "s2 b0");
  near(s2.cut.slope, -650 / 27, 1e-9, "s2 bv");
  near(it[1].lowerBound, 16000 / 27, 1e-9, "LB2");
});
test("each cut equals the expected cost at its trial point", () => {
  for (const k of it)
    for (let i = 0; i < 3; i += 1) {
      const vHat = k.trajectory[i].vOut;
      const b = k.backward[i];
      near(cutValue(b.cut, vHat), b.expectedCost, 1e-9, "tight");
    }
});
test("every cut and the envelope lie on or below the true cost-to-go", () => {
  const cuts = it[1].cuts;
  for (let t = 1; t <= 3; t += 1)
    for (let v = 0; v <= 100; v += 0.5) {
      near(
        Math.min(0, trueCostToGo(t + 1, v) - costToGoApprox(cuts[t - 1], v)),
        0,
        1e-9,
        `t=${t} v=${v}`,
      );
    }
});
test("optimum and lower-bound sequence", () => {
  near(trueCostToGo(1, 30), 17000 / 27, 1e-9, "z*");
  assert.ok(
    it[0].lowerBound < it[1].lowerBound &&
      it[1].lowerBound < trueCostToGo(1, 30),
  );
  // independent fine-grid DP check of V_3 at a few points
  for (const v of [0, 5, 10, 15, 20, 30])
    near(dp(3, v), trueCostToGo(3, v), 1e-9, `dp V3(${v})`);
});
test("right slope equals a one-sided difference away from kinks", () => {
  const cuts = it[0].cuts[2];
  for (const [vIn, a] of [
    [0, 20],
    [10, 40],
    [5, 30],
  ] as const) {
    const h = 1e-6;
    const fd =
      (solveStage(vIn + h, a, cuts).cost - solveStage(vIn, a, cuts).cost) / h;
    near(storageSlopes(vIn, a, cuts)[1], fd, 1e-4, `fd ${vIn},${a}`);
  }
});
test("figure data", () => {
  const f = figureData();
  const at = (arr: { v: number; value: number }[], v: number) =>
    arr.find((p) => p.v === v)!.value;
  nearAll(
    [0, 10, 20, 30, 40].map((v) => at(f.trueCurve, v)),
    [1000, 5000 / 9, 2000 / 9, 500 / 9, 0],
    "V3",
  );
  nearAll(
    [0, 10, 20, 30, 40].map((v) => at(f.envelope, v)),
    [8500 / 9, 5000 / 9, 2000 / 9, 500 / 9, 0],
    "env",
  );
  nearAll(
    f.trialPoints.map((p) => p.v),
    [10, 20],
    "trial v",
  );
  nearAll(
    f.trialPoints.map((p) => p.value),
    [5000 / 9, 2000 / 9],
    "trial value",
  );
  near(at(f.envelope, 15), 3250 / 9, 1e-9, "env 15");
  near(at(f.trueCurve, 15), 3500 / 9, 1e-9, "V3 15");
});

test("ties go to more turbining (a cut as steep as the thermal cost)", () => {
  const s = solveStage(10, 30, [{ intercept: 500, slope: -50 }]);
  near(s.q, 40, 1e-9, "q");
  near(s.cost, 500, 1e-9, "cost");
});
test("cut segments end where each cut reaches zero", () => {
  const f = figureData();
  near(f.cutSegments[0].to.v, 8500 / 350, 1e-9, "it1 zero");
  near(f.cutSegments[1].to.v, 100 / 3, 1e-9, "it2 zero");
  near(f.cutSegments[0].from.value, 8500 / 9, 1e-9, "it1 at 0");
  near(f.cutSegments[1].to.value, 0, 1e-9, "it2 end");
});
test("a cut steeper than the thermal cost is rejected", () => {
  assert.throws(() => solveStage(0, 20, [{ intercept: 100, slope: -60 }]));
});

test("iteration-2 backward slopes and intercepts", () => {
  const [s2, s3] = it[1].backward;
  nearAll(
    s3.openings.map((r) => r.intercept),
    [3500 / 3, 500, 0],
    "b0 stage 3",
  );
  nearAll(
    s2.openings.map((r) => r.slope),
    [-350 / 9, -50 / 3, -50 / 3],
    "beta stage 2",
  );
  nearAll(
    s2.openings.map((r) => r.intercept),
    [15500 / 9, 6500 / 9, 5000 / 9],
    "b0 stage 2",
  );
});
test("lower-bound stage-1 solves", () => {
  nearAll(
    lowerBound(it[0].cuts).openings.map((r) => r.cost),
    [8500 / 9, 5000 / 9, 500 / 3],
    "Q1 it1",
  );
  nearAll(
    lowerBound(it[1].cuts).openings.map((r) => r.cost),
    [8500 / 9, 5000 / 9, 2500 / 9],
    "Q1 it2",
  );
});
test("every plotted field of the figure data is pinned", () => {
  const f = figureData();
  const grid = Array.from({ length: 51 }, (_, i) => i);
  nearAll(
    f.trueCurve.map((p) => p.v),
    grid,
    "V3 grid",
  );
  nearAll(
    f.envelope.map((p) => p.v),
    grid,
    "envelope grid",
  );
  nearAll(
    f.trueCurve.map((p) => p.value),
    grid.map((v) => dp(3, v)),
    "V3 against the dynamic program",
  );
  nearAll(
    f.envelope.map((p) => p.value),
    grid.map((v) =>
      Math.max(0, 8500 / 9 - (350 / 9) * v, 5000 / 9 - (50 / 3) * v),
    ),
    "envelope against the two cuts",
  );
  assert.deepEqual(
    f.cuts.map((c) => c.iteration),
    [1, 2],
  );
  nearAll(
    f.cuts.map((c) => c.intercept),
    [8500 / 9, 5000 / 9],
    "cut intercepts",
  );
  nearAll(
    f.cuts.map((c) => c.slope),
    [-350 / 9, -50 / 3],
    "cut slopes",
  );
  assert.deepEqual(
    f.trialPoints.map((p) => p.iteration),
    [1, 2],
  );
  nearAll(
    f.trialPoints.map((p) => p.v),
    [10, 20],
    "trial v",
  );
  nearAll(
    f.trialPoints.map((p) => p.value),
    [5000 / 9, 2000 / 9],
    "trial value",
  );
  assert.deepEqual(
    f.cutSegments.map((s) => s.iteration),
    [1, 2],
  );
  nearAll(
    f.cutSegments.map((s) => s.from.v),
    [0, 0],
    "segment start v",
  );
  nearAll(
    f.cutSegments.map((s) => s.from.value),
    [8500 / 9, 5000 / 9],
    "segment start value",
  );
  nearAll(
    f.cutSegments.map((s) => s.to.v),
    [8500 / 350, 100 / 3],
    "segment end v",
  );
  nearAll(
    f.cutSegments.map((s) => s.to.value),
    [0, 0],
    "segment end value",
  );
});
test("the section 8 table columns", () => {
  const f = figureData();
  const at = (arr: { v: number; value: number }[], v: number) =>
    arr.find((p) => p.v === v)!.value;
  const vs = [0, 10, 15, 20, 30, 40];
  nearAll(
    vs.map((v) => at(f.trueCurve, v)),
    [1000, 5000 / 9, 3500 / 9, 2000 / 9, 500 / 9, 0],
    "V3",
  );
  nearAll(
    vs.map((v) => cutValue(f.cuts[0], v)),
    [8500 / 9, 5000 / 9, 3250 / 9, 1500 / 9, -2000 / 9, -5500 / 9],
    "cut 1",
  );
  nearAll(
    vs.map((v) => cutValue(f.cuts[1], v)),
    [5000 / 9, 3500 / 9, 2750 / 9, 2000 / 9, 500 / 9, -1000 / 9],
    "cut 2",
  );
  nearAll(
    vs.map((v) => at(f.envelope, v)),
    [8500 / 9, 5000 / 9, 3250 / 9, 2000 / 9, 500 / 9, 0],
    "envelope",
  );
});
test("the envelope meets V3 at the trial points, on [20, 30] and from 40 on, and lies below it elsewhere", () => {
  const stage2Cuts = it[1].cuts[1];
  for (let v = 0; v <= 50; v += 0.5) {
    const gap = trueCostToGo(3, v) - costToGoApprox(stage2Cuts, v);
    const touches = Math.abs(v - 10) < 1e-9 || (v >= 20 && v <= 30) || v >= 40;
    if (touches) near(gap, 0, 1e-9, `contact at ${v}`);
    else assert.ok(gap > 1e-9, `gap at ${v}: ${gap}`);
  }
});
