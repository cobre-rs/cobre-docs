// Compute layer for the FPHA fitting figure (math/hydro-production-models §2.6),
// the "correct by construction" half of its island. No rendering here.
//
// Plant: a synthetic hydro with a concave forebay curve, a quadratic tailrace and a
// factor head loss, in fixed arbitrary units; only normalized fractions are plotted.
// Fit (spillage zero, as in the computed-FPHA path): a uniform grid over
// [vMin, vMax] x [0, qMax] evaluates the production function capped at the
// installed capacity gMax. The raw envelope FPHA_0 is the pointwise minimum over
// the upper planes of the convex hull of that cloud, found here by brute force over
// point triples. kFpha is the least-squares scalar that rescales FPHA_0 onto the
// capped production.
export interface Plant {
  vMin: number;
  vMax: number;
  qMax: number;
  gMax: number;
  vRef: number;
  rhoEsp: number;
  lossFactor: number;
  forebay: { linear: number; quadratic: number };
  tailrace: { linear: number; quadratic: number };
}
export interface Point {
  v: number;
  q: number;
  g: number;
}
export interface Plane {
  g0: number;
  gv: number;
  gq: number;
}
export interface Sample {
  q: number;
  g: number;
}
export interface FigureData {
  cloud: Sample[];
  exact: Sample[];
  raw: Sample[];
  corrected: Sample[];
  equivalent: Sample[];
}

const EPS = 1e-9;
export const GRID = { volumes: 5, flows: 6, slice: 2, samples: 101 } as const;

export function examplePlant(): Plant {
  return {
    vMin: 200,
    vMax: 1000,
    qMax: 250,
    gMax: 100,
    vRef: 600,
    rhoEsp: 0.00981 * 0.95,
    lossFactor: 0.05,
    forebay: { linear: 100, quadratic: -20 },
    tailrace: { linear: 10, quadratic: -4 },
  };
}

/** h_net = max(h_fore(v) - h_tail(q) - h_loss, 0) at spillage 0, h_loss = k_loss (h_fore - h_tail). */
export function netHead(plant: Plant, v: number, q: number): number {
  const x = v / plant.vMax;
  const u = q / plant.qMax;
  const gross =
    plant.forebay.linear * x +
    plant.forebay.quadratic * x * x -
    (plant.tailrace.linear * u + plant.tailrace.quadratic * u * u);
  return Math.max(gross - plant.lossFactor * gross, 0);
}
/** Exact production, uncapped: rho_esp q h_net. */
export function phi(plant: Plant, v: number, q: number): number {
  return plant.rhoEsp * q * netHead(plant, v, q);
}
const capped = (plant: Plant, v: number, q: number): number =>
  Math.min(phi(plant, v, q), plant.gMax);

/** Uniform nv x nq grid over [vMin, vMax] x [0, qMax], volume-major, generation capped at gMax. */
export function cloud(plant: Plant, nv: number, nq: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < nv; i += 1) {
    const v = plant.vMin + (i * (plant.vMax - plant.vMin)) / (nv - 1);
    for (let j = 0; j < nq; j += 1) {
      const q = (j * plant.qMax) / (nq - 1);
      points.push({ v, q, g: capped(plant, v, q) });
    }
  }
  return points;
}

function planeThrough(a: Point, b: Point, c: Point): Plane | null {
  const dv1 = b.v - a.v;
  const dq1 = b.q - a.q;
  const dg1 = b.g - a.g;
  const dv2 = c.v - a.v;
  const dq2 = c.q - a.q;
  const dg2 = c.g - a.g;
  const det = dv1 * dq2 - dq1 * dv2;
  if (Math.abs(det) < EPS) return null;
  const gv = (dg1 * dq2 - dq1 * dg2) / det;
  const gq = (dv1 * dg2 - dg1 * dv2) / det;
  return { g0: a.g - gv * a.v - gq * a.q, gv, gq };
}
const planeAt = (p: Plane, v: number, q: number): number =>
  p.g0 + p.gv * v + p.gq * q;
const sameWithin = (a: Plane, b: Plane): boolean =>
  Math.abs(a.g0 - b.g0) <= EPS &&
  Math.abs(a.gv - b.gv) <= EPS &&
  Math.abs(a.gq - b.gq) <= EPS;

/** Non-vertical planes through at least three cloud points with every cloud point on or below, sorted, deduplicated within 1e-9. */
export function upperHull(points: Point[]): Plane[] {
  const pts = [...points].sort((a, b) => a.v - b.v || a.q - b.q);
  const found: Plane[] = [];
  for (let i = 0; i < pts.length; i += 1)
    for (let j = i + 1; j < pts.length; j += 1)
      for (let k = j + 1; k < pts.length; k += 1) {
        const plane = planeThrough(pts[i], pts[j], pts[k]);
        if (plane && pts.every((p) => p.g <= planeAt(plane, p.v, p.q) + EPS))
          found.push(plane);
      }
  found.sort((a, b) => a.g0 - b.g0 || a.gv - b.gv || a.gq - b.gq);
  return found.filter(
    (p, i) => !found.slice(0, i).some((o) => sameWithin(o, p)),
  );
}
/** FPHA_0: the pointwise minimum over the planes (the LP binds the tightest plane). */
export function envelope(planes: Plane[], v: number, q: number): number {
  return Math.min(...planes.map((p) => planeAt(p, v, q)));
}
/** Closed-form least-squares scalar: sum(FPHA_0 g) / sum(FPHA_0^2) over the cloud; 1 on no planes or a zero denominator. */
export function kFpha(planes: Plane[], points: Point[]): number {
  if (planes.length === 0) return 1;
  let cross = 0;
  let square = 0;
  for (const p of points) {
    const raw = envelope(planes, p.v, p.q);
    cross += raw * p.g;
    square += raw * raw;
  }
  return square === 0 ? 1 : cross / square;
}
/** rho_eq = rho_esp h_net(vRef, qMax). */
export function rhoEq(plant: Plant, vRef: number): number {
  return plant.rhoEsp * netHead(plant, vRef, plant.qMax);
}

/** Every series the island plots, as fractions of qMax and gMax, on the slice at one grid volume. */
export function figureData(): FigureData {
  const plant = examplePlant();
  const { volumes, flows, slice, samples } = GRID;
  const points = cloud(plant, volumes, flows);
  const planes = upperHull(points);
  const k = kFpha(planes, points);
  const sliceStart = slice * flows;
  const v = points[sliceStart].v;
  const frac = (q: number, g: number): Sample => ({
    q: q / plant.qMax,
    g: g / plant.gMax,
  });
  const flowsFine = Array.from(
    { length: samples },
    (_, i) => (i * plant.qMax) / (samples - 1),
  );
  const rho = rhoEq(plant, plant.vRef);
  return {
    cloud: points
      .slice(sliceStart, sliceStart + flows)
      .map((p) => frac(p.q, p.g)),
    exact: flowsFine.map((q) => frac(q, capped(plant, v, q))),
    raw: flowsFine.map((q) => frac(q, envelope(planes, v, q))),
    corrected: flowsFine.map((q) => frac(q, k * envelope(planes, v, q))),
    equivalent: [0, plant.qMax].map((q) => frac(q, rho * q)),
  };
}
