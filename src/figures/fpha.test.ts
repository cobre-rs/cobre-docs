import test from "node:test";
import assert from "node:assert/strict";
import {
  GRID,
  cloud,
  envelope,
  examplePlant,
  figureData,
  kFpha,
  netHead,
  phi,
  rhoEq,
  upperHull,
} from "./fpha.ts";
import type { Plane, Point } from "./fpha.ts";

const near = (a: number, b: number, tol: number, what: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
const plant = examplePlant();
const points = cloud(plant, GRID.volumes, GRID.flows);
const planes = upperHull(points);
const k = kFpha(planes, points);
const planeAt = (p: Plane, v: number, q: number) => p.g0 + p.gv * v + p.gq * q;
// Window sample finer than the grid: 13 volumes x 21 flows, grid nodes included.
const sample: [number, number][] = Array.from({ length: 13 }, (_, i) =>
  Array.from({ length: 21 }, (_, j): [number, number] => [
    200 + (i * 800) / 12,
    (j * 250) / 20,
  ]),
).flat();
// Reference values from a separate Python implementation of the same fit (not shipped);
// the primal check below is algorithmically independent. Pinned to 1e-9. Columns: g0, gv, gq.
const REF_PLANES: [number, number, number][] = [
  [-34.705818, 0.189465435, 0.108367146],
  [-34.2100206, 0.194423409, 0.098451198],
  [-33.997536, 0.19477755, 0.097034634],
  [-33.7850514, 0.175653936, 0.126782478],
  [-31.307854125, 0.1591392875, 0.1432971265],
  [-30.78785075, 0.15393925375, 0.153697194],
  [-14.285714285714, 0.071428571429, 0.285714285714],
  [-0.8900617, 0.0044503085, 0.642931688],
  [-0.33643395, 0.00168216975, 0.665076798],
  [0, 0, 0.691991514],
  [100, 0, 0],
];
const REF_K = 0.9569903397375512;
// Slice at the third grid volume (v = vRef), flows 0, 1/5, ..., 1 of qMax, as fractions of gMax.
const REF_CLOUD = [0, 0.225587817, 0.437718276, 0.640641069, 0.838605888, 1];
const REF_RAW = [0, 0.339267078, 0.5714285714, 0.7142857143, 0.8571428571, 1];

// Independent upper concave envelope by the primal problem: the best interpolation of
// the cloud over every triangle (of three cloud points) that contains the point.
function primalEnvelope(cloudPoints: Point[], v: number, q: number): number {
  let best = -Infinity;
  for (let i = 0; i < cloudPoints.length; i += 1)
    for (let j = i + 1; j < cloudPoints.length; j += 1)
      for (let m = j + 1; m < cloudPoints.length; m += 1) {
        const [a, b, c] = [cloudPoints[i], cloudPoints[j], cloudPoints[m]];
        const det = (b.q - c.q) * (a.v - c.v) + (c.v - b.v) * (a.q - c.q);
        if (Math.abs(det) < 1e-9) continue;
        const l1 = ((b.q - c.q) * (v - c.v) + (c.v - b.v) * (q - c.q)) / det;
        const l2 = ((c.q - a.q) * (v - c.v) + (a.v - c.v) * (q - c.q)) / det;
        const l3 = 1 - l1 - l2;
        if (Math.min(l1, l2, l3) >= -1e-12)
          best = Math.max(best, l1 * a.g + l2 * b.g + l3 * c.g);
      }
  return best;
}

test("the synthetic plant and the figure grid are the pinned ones", () => {
  const { rhoEsp, ...rest } = plant;
  near(rhoEsp, 0.00981 * 0.95, 1e-15, "rho_esp = 9.81 eta / 1000");
  assert.deepEqual(rest, {
    vMin: 200,
    vMax: 1000,
    qMax: 250,
    gMax: 100,
    vRef: 600,
    lossFactor: 0.05,
    forebay: { linear: 100, quadratic: -20 },
    tailrace: { linear: 10, quadratic: -4 },
  });
  assert.deepEqual(GRID, { volumes: 5, flows: 6, slice: 2, samples: 101 });
});

test("net head and production at hand-computed points, head clamped at zero", () => {
  // v = 600: h_fore = 100 (0.6) - 20 (0.36) = 52.8; q = 250: h_tail = 10 - 4 = 6;
  // gross 46.8, loss 0.05 (46.8) = 2.34, net 44.46.
  near(netHead(plant, 600, 250), 44.46, 1e-9, "h_net(600, 250)");
  near(phi(plant, 600, 250), 0.0093195 * 250 * 44.46, 1e-9, "phi(600, 250)");
  // v = 200, q = 50: h_fore = 20 - 0.8 = 19.2; h_tail = 2 - 0.16 = 1.84; net 16.492.
  near(netHead(plant, 200, 50), 16.492, 1e-9, "h_net(200, 50)");
  near(phi(plant, 200, 50), 0.0093195 * 50 * 16.492, 1e-9, "phi(200, 50)");
  assert.equal(phi(plant, 600, 0), 0);
  const steep = { ...plant, tailrace: { linear: 1000, quadratic: 0 } };
  assert.equal(netHead(steep, 600, 250), 0);
  assert.equal(phi(steep, 600, 250), 0);
});

test("1. cloud: a uniform grid starting at q = 0, every point min(phi, gMax)", () => {
  assert.equal(points.length, GRID.volumes * GRID.flows);
  const vs = [200, 400, 600, 800, 1000];
  const qs = [0, 50, 100, 150, 200, 250];
  points.forEach((p, n) => {
    near(p.v, vs[Math.floor(n / 6)], 1e-9, `v[${n}]`);
    near(p.q, qs[n % 6], 1e-9, `q[${n}]`);
    near(p.g, Math.min(phi(plant, p.v, p.q), plant.gMax), 1e-9, `g[${n}]`);
    assert.ok(p.g <= plant.gMax);
  });
  const binding = points.filter((p) => phi(plant, p.v, p.q) > plant.gMax);
  assert.deepEqual(
    binding.map((p) => [p.v, p.q]),
    [
      [600, 250],
      [800, 200],
      [800, 250],
      [1000, 150],
      [1000, 200],
      [1000, 250],
    ],
  );
  binding.forEach((p) => assert.equal(p.g, plant.gMax));
});

test("2. hull: every plane bounds the cloud from above through at least three points", () => {
  assert.equal(planes.length, 11);
  for (const p of planes) {
    for (const c of points)
      assert.ok(
        c.g <= planeAt(p, c.v, c.q) + 1e-9,
        "a cloud point above a plane",
      );
    const through = points.filter(
      (c) => Math.abs(planeAt(p, c.v, c.q) - c.g) <= 1e-9,
    );
    assert.ok(through.length >= 3, `plane through ${through.length} points`);
    assert.ok(
      p.gv >= -1e-9 && p.gq >= -1e-9,
      "upper-facet gradients are non-negative",
    );
  }
});

test("hull: canonical order, no duplicates, and the planes of the independent reference", () => {
  assert.equal(planes.length, REF_PLANES.length);
  planes.forEach((p, i) => {
    const [g0, gv, gq] = REF_PLANES[i];
    near(p.g0, g0, 1e-9, `g0[${i}]`);
    near(p.gv, gv, 1e-9, `gv[${i}]`);
    near(p.gq, gq, 1e-9, `gq[${i}]`);
  });
  for (let i = 1; i < planes.length; i += 1)
    assert.ok(planes[i - 1].g0 <= planes[i].g0, "sorted by intercept");
  // The capacity facet is one plane although every triple of capped points yields it.
  const flat = planes.filter(
    (p) => p.gv === 0 && p.gq === 0 && Math.abs(p.g0 - plant.gMax) < 1e-9,
  );
  assert.equal(flat.length, 1);
  // The plane through the origin generates zero at zero flow.
  assert.ok(planes.some((p) => p.g0 === 0 && p.gv === 0 && p.gq > 0));
});

const square = (top: number): Point[] => [
  { v: 0, q: 0, g: 0 },
  { v: 1, q: 0, g: 0 },
  { v: 0, q: 1, g: 0 },
  { v: 1, q: 1, g: top },
];

test("hull: a hand-made cloud gives min(q, v); collinear points give no plane", () => {
  const hull = upperHull(square(1));
  assert.equal(hull.length, 2);
  [
    [0, 0, 1],
    [0, 1, 0],
  ].forEach(([g0, gv, gq], i) => {
    near(hull[i].g0, g0, 1e-12, `g0[${i}]`);
    near(hull[i].gv, gv, 1e-12, `gv[${i}]`);
    near(hull[i].gq, gq, 1e-12, `gq[${i}]`);
  });
  assert.equal(envelope(hull, 0.5, 0.5), 0.5);
  assert.equal(envelope(hull, 0.25, 0.75), 0.25);
  const line: Point[] = [
    { v: 0, q: 0, g: 0 },
    { v: 1, q: 0, g: 1 },
    { v: 2, q: 0, g: 5 },
  ];
  assert.deepEqual(upperHull(line), []);
});

test("hull: the 1e-9 tolerance merges planes, admits points on a plane, drops near-collinear triples", () => {
  assert.equal(upperHull(square(1e-7)).length, 2);
  assert.equal(upperHull(square(5e-10)).length, 1);
  const nearLine: Point[] = [
    { v: 0, q: 0, g: 0 },
    { v: 1, q: 0, g: 0 },
    { v: 2, q: 1e-12, g: 0 },
  ];
  assert.deepEqual(upperHull(nearLine), []);
});

test("hull: dedup compares every coefficient; a small nonzero determinant still gives a plane", () => {
  // Ridge g = -|q| over q in {-1, 0, 1}: two planes that share g0 and gv and differ in gq.
  const ridge: Point[] = [-1, 0, 1].flatMap((q) =>
    [0, 1].map((v) => ({ v, q, g: q <= 0 ? q : -q })),
  );
  const ridgePlanes = upperHull(ridge);
  assert.equal(ridgePlanes.length, 2);
  ridgePlanes.forEach((p, i) => {
    near(p.g0, 0, 1e-12, "ridge g0");
    near(p.gv, 0, 1e-12, "ridge gv");
    near(p.gq, i === 0 ? -1 : 1, 1e-12, "ridge gq");
  });
  // A thin triangle with determinant 1e-4, above the 1e-9 guard: the plane g = q.
  const thin: Point[] = [
    { v: 0, q: 0, g: 0 },
    { v: 1, q: 0, g: 0 },
    { v: 0, q: 1e-4, g: 1e-4 },
  ];
  const thinPlanes = upperHull(thin);
  assert.equal(thinPlanes.length, 1);
  near(thinPlanes[0].gq, 1, 1e-9, "thin triangle slope");
});

test("the envelope is the upper concave envelope of the cloud (independent primal check)", () => {
  for (const [v, q] of sample)
    near(
      envelope(planes, v, q),
      primalEnvelope(points, v, q),
      1e-9,
      `(${v}, ${q})`,
    );
});

test("3. the raw envelope is at least the capped phi at every cloud point", () => {
  for (const p of points)
    assert.ok(envelope(planes, p.v, p.q) >= p.g - 1e-9, `(${p.v}, ${p.q})`);
  const vertices = points.filter(
    (p) => Math.abs(envelope(planes, p.v, p.q) - p.g) <= 1e-9,
  );
  assert.ok(vertices.length >= 3 && vertices.length < points.length);
});

test("the envelope is the minimum over the planes, not the maximum", () => {
  let strictlyBelow = 0;
  for (const [v, q] of sample) {
    const values = planes.map((p) => planeAt(p, v, q));
    assert.equal(envelope(planes, v, q), Math.min(...values));
    if (Math.max(...values) > envelope(planes, v, q) + 1) strictlyBelow += 1;
  }
  assert.ok(strictlyBelow > 0);
});

test("4. q = 0 anchor: the raw envelope is zero at every grid volume", () => {
  for (const p of points.filter((c) => c.q === 0)) {
    near(envelope(planes, p.v, 0), 0, 1e-9, `v = ${p.v}`);
    assert.equal(p.g, 0);
  }
});

test("5. capacity cap: the raw envelope never exceeds gMax, which it reaches", () => {
  for (const [v, q] of sample)
    assert.ok(envelope(planes, v, q) <= plant.gMax + 1e-9, `(${v}, ${q})`);
  assert.ok(
    sample.some(([v, q]) => envelope(planes, v, q) >= plant.gMax - 1e-9),
  );
});

test("6. k_FPHA is the closed-form least-squares scalar", () => {
  let cross = 0;
  let square = 0;
  for (const p of points) {
    cross += envelope(planes, p.v, p.q) * p.g;
    square += envelope(planes, p.v, p.q) ** 2;
  }
  near(k, cross / square, 1e-12, "closed form");
  near(k, REF_K, 1e-9, "independent reference");
  const sse = (s: number) =>
    points.reduce(
      (acc, p) => acc + (s * envelope(planes, p.v, p.q) - p.g) ** 2,
      0,
    );
  assert.ok(sse(k) <= sse(k + 1e-3) && sse(k) <= sse(k - 1e-3));
  // Zero denominator: all-zero planes give the neutral 1.
  assert.equal(kFpha([{ g0: 0, gv: 0, gq: 0 }], points), 1);
  // No planes: the same neutral 1.
  assert.equal(kFpha([], points), 1);
  // Hand case: FPHA_0 = 2 against g = 1 and 3 gives (2 + 6) / (4 + 4) = 1.
  const two = [{ g0: 2, gv: 0, gq: 0 }];
  const pair: Point[] = [
    { v: 0, q: 0, g: 1 },
    { v: 1, q: 0, g: 3 },
  ];
  assert.equal(kFpha(two, pair), 1);
  assert.equal(kFpha([{ g0: 1, gv: 0, gq: 0 }], pair), 2);
});

test("7. the corrected surface lies below the raw envelope where positive iff k <= 1", () => {
  const below = (ps: Plane[], scale: number) =>
    sample.every(([v, q]) => {
      const raw = envelope(ps, v, q);
      return raw <= 0 || scale * raw <= raw + 1e-12;
    });
  assert.ok(k < 1);
  assert.ok(below(planes, k));
  // Planes 20% under the cloud make the regression scale up: k > 1 and the corrected
  // surface is no longer below.
  const low = planes.map((p) => ({
    g0: 0.8 * p.g0,
    gv: 0.8 * p.gv,
    gq: 0.8 * p.gq,
  }));
  const kLow = kFpha(low, points);
  assert.ok(kLow > 1);
  assert.equal(below(low, kLow), false);
  assert.equal(below(low, kLow), kLow <= 1);
  assert.equal(below(planes, k), k <= 1);
});

test("8. rho_eq times qMax is the uncapped production at the reference point", () => {
  near(
    rhoEq(plant, plant.vRef) * plant.qMax,
    phi(plant, plant.vRef, plant.qMax),
    1e-9,
    "rho_eq q_max",
  );
  near(rhoEq(plant, plant.vRef), 0.0093195 * 44.46, 1e-12, "rho_esp h_net");
  assert.ok(phi(plant, plant.vRef, plant.qMax) > plant.gMax);
  near(
    rhoEq(plant, 200) * plant.qMax,
    phi(plant, 200, plant.qMax),
    1e-9,
    "another reference",
  );
});

test("9. the hull is the same for shuffled clouds", () => {
  let seed = 12345;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let round = 0; round < 20; round += 1) {
    const shuffled = [...points];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    assert.deepEqual(upperHull(shuffled), planes);
  }
});

test("every plotted series of the figure data is pinned", () => {
  const f = figureData();
  const n = GRID.samples;
  assert.equal(points[GRID.slice * GRID.flows].v, plant.vRef);
  assert.equal(f.cloud.length, GRID.flows);
  f.cloud.forEach((s, j) => {
    near(s.q, j / 5, 1e-12, `cloud q[${j}]`);
    near(s.g, REF_CLOUD[j], 1e-9, `cloud g[${j}]`);
  });
  for (const series of [f.exact, f.raw, f.corrected]) {
    assert.equal(series.length, n);
    series.forEach((s, i) => near(s.q, i / (n - 1), 1e-12, `q[${i}]`));
  }
  f.exact.forEach((s, i) => {
    const q = (i * plant.qMax) / (n - 1);
    near(
      s.g,
      Math.min(phi(plant, plant.vRef, q), plant.gMax) / plant.gMax,
      1e-9,
      `exact[${i}]`,
    );
  });
  f.raw.forEach((s, i) => {
    const q = (i * plant.qMax) / (n - 1);
    near(s.g, envelope(planes, plant.vRef, q) / plant.gMax, 1e-9, `raw[${i}]`);
  });
  f.corrected.forEach((s, i) =>
    near(s.g, k * f.raw[i].g, 1e-12, `corrected[${i}]`),
  );
  REF_RAW.forEach((g, j) =>
    near(f.raw[20 * j].g, g, 1e-9, `raw at the cloud q[${j}]`),
  );
  REF_CLOUD.forEach((g, j) =>
    near(f.exact[20 * j].g, g, 1e-9, `exact at the cloud q[${j}]`),
  );
  near(f.corrected[100].g, REF_K, 1e-9, "corrected at q_max is k");
  assert.equal(f.equivalent.length, 2);
  assert.deepEqual(f.equivalent[0], { q: 0, g: 0 });
  near(f.equivalent[1].q, 1, 1e-12, "rho_eq line ends at q_max");
  near(
    f.equivalent[1].g * plant.gMax,
    phi(plant, plant.vRef, plant.qMax),
    1e-9,
    "rho_eq q_max",
  );
  near(f.equivalent[1].g, 1.035862425, 1e-9, "rho_eq q_max over gMax");
});
