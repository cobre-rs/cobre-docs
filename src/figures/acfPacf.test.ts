// Mirrors cvar.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import {
  figureData,
  modelAcfPar1,
  mulberry32,
  standardNormals,
  pacfFromAcf,
  sampleAcf,
  sampleAcfAt,
  significanceBand,
  simulatePar1,
} from "./acfPacf.ts";

const PSI_12 = [
  0.55, 0.6, 0.65, 0.7, 0.72, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5,
];

function near(actual: number, expected: number, tol: number, what: string) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${what}: ${actual} vs ${expected} (tol ${tol})`,
  );
}

test("lag-0 sample ACF is 1 for every season", () => {
  const series = simulatePar1(PSI_12, 30, 7);
  for (let season = 0; season < PSI_12.length; season += 1) {
    assert.equal(sampleAcf(series, season, 3)[0], 1);
  }
});

test("sample ACF uses year-aligned pairs, the population divisor and per-season population std (hand case)", () => {
  // Season 0 = [1,3,5] (mean 3), season 1 = [4,2,6] (mean 4); both have
  // population variance 8/3. Season 0, lag 1 reaches season 1 of the previous
  // year: pairs (3,4) and (5,2), deviations (0,0) and (2,−2) -> −4 / 2 = −2 ->
  // −2 / (8/3) = −0.75. Season 1, lag 1 reaches season 0 of the same year:
  // deviations (0,−2,2) and (−2,0,2) -> 4 / 3 -> (4/3) / (8/3) = 0.5. Season 1,
  // lag 2 (one full cycle) pairs consecutive years: deviations (−2,2) and
  // (0,−2) -> −4 / 2 = −2 -> −0.75.
  const series = [
    [1, 4],
    [3, 2],
    [5, 6],
  ];
  near(sampleAcfAt(series, 0, 1), -0.75, 1e-12, "season 0 lag 1");
  near(sampleAcfAt(series, 1, 1), 0.5, 1e-12, "season 1 lag 1");
  near(sampleAcfAt(series, 1, 2), -0.75, 1e-12, "season 1 lag 2");
});

test("sample ACF is 0 for a zero-std season and clamped to [-1, 1]", () => {
  const flat = [
    [1, 5],
    [1, 7],
    [1, 3],
  ];
  assert.equal(sampleAcfAt(flat, 0, 1), 0);
  assert.equal(sampleAcfAt(flat, 1, 1), 0);
  // Unclamped values are ±1.5: two pairs carry all the variance of three
  // observations, so the pair-sum over the pair count exceeds the std product.
  const up = [
    [0, 1],
    [1, -1],
    [-1, 0],
  ];
  const down = [
    [0, -1],
    [1, 1],
    [-1, 0],
  ];
  assert.equal(sampleAcfAt(up, 0, 1), 1);
  assert.equal(sampleAcfAt(down, 0, 1), -1);
});

test("modelAcfPar1 equals the product formula (constant psi and a two-season hand case)", () => {
  const constant = modelAcfPar1([0.6, 0.6, 0.6], 1, 5);
  for (let lag = 0; lag <= 5; lag += 1) {
    near(constant[lag], 0.6 ** lag, 1e-12, `0.6^${lag}`);
  }
  // psi* = [0.5, 0.8]: season 0 multiplies psi*_0, psi*_1, psi*_0; season 1 the reverse.
  const s0 = modelAcfPar1([0.5, 0.8], 0, 3);
  const s1 = modelAcfPar1([0.5, 0.8], 1, 3);
  const want0 = [1, 0.5, 0.5 * 0.8, 0.5 * 0.8 * 0.5];
  const want1 = [1, 0.8, 0.8 * 0.5, 0.8 * 0.5 * 0.8];
  for (let lag = 0; lag <= 3; lag += 1) {
    near(s0[lag], want0[lag], 1e-12, `season 0 lag ${lag}`);
    near(s1[lag], want1[lag], 1e-12, `season 1 lag ${lag}`);
  }
});

test("significanceBand(100) is 1.96/10", () => {
  near(significanceBand(100), 0.196, 1e-12, "band");
});

test("sample PACF at lag 1 equals sample ACF at lag 1", () => {
  const series = simulatePar1(PSI_12, 60, 3);
  for (let season = 0; season < PSI_12.length; season += 1) {
    const pacf = pacfFromAcf(
      (s, lag) => sampleAcfAt(series, s, lag),
      season,
      6,
      PSI_12.length,
    );
    near(pacf[0], sampleAcf(series, season, 1)[1], 1e-12, `season ${season}`);
  }
});

test("PACF of the model ACF is psi* at lag 1 and 0 at lags 2-6, in every season", () => {
  for (let season = 0; season < PSI_12.length; season += 1) {
    const pacf = pacfFromAcf(
      (s, lag) => modelAcfPar1(PSI_12, s, lag)[lag],
      season,
      6,
      PSI_12.length,
    );
    assert.equal(pacf.length, 6);
    near(pacf[0], PSI_12[season], 1e-12, `season ${season} lag 1`);
    for (let lag = 2; lag <= 6; lag += 1) {
      near(pacf[lag - 1], 0, 1e-12, `season ${season} lag ${lag}`);
    }
  }
});

test("PACF stops at the lag before a singular Yule-Walker system", () => {
  // Perfectly correlated lags make the order-2 matrix [[1,1],[1,1]] singular.
  const pacf = pacfFromAcf(() => 1, 0, 4, 1);
  assert.deepEqual(pacf, [1]);
});

test("simulatePar1 is deterministic for a seed and differs across seeds", () => {
  assert.deepEqual(simulatePar1(PSI_12, 5, 42), simulatePar1(PSI_12, 5, 42));
  assert.notDeepEqual(simulatePar1(PSI_12, 5, 42), simulatePar1(PSI_12, 5, 43));
});

test("long simulated series has unit seasonal variance and tracks the model ACF/PACF", () => {
  // 10000 years per season. A season's value in one year depends on the next
  // year's through twelve ψ* factors (their product is 0.003), so the pairs
  // behind each sample correlation are near-independent and its sd is
  // ≈ (1 − ρ²)/√N ≤ 0.010. Measured over 200 seeds, the largest sd of any
  // checked ACF or PACF deviation is 0.012: the 0.08 bound is more than 6 sd.
  // The sample variance of N near-independent normals has sd √(2/N) = 0.014
  // (measured 0.0142): the 0.1 bound is 7 sd.
  const years = 10000;
  const series = simulatePar1(PSI_12, years, 11);
  for (let season = 0; season < PSI_12.length; season += 1) {
    const values = series.map((row) => row[season]);
    const mean = values.reduce((s, v) => s + v, 0) / years;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / years;
    near(variance, 1, 0.1, `season ${season} variance`);
  }
  for (const season of [0, 5]) {
    const sample = sampleAcf(series, season, 6);
    const model = modelAcfPar1(PSI_12, season, 6);
    const pacf = pacfFromAcf(
      (s, lag) => sampleAcfAt(series, s, lag),
      season,
      6,
      PSI_12.length,
    );
    for (let lag = 1; lag <= 6; lag += 1) {
      near(sample[lag], model[lag], 0.08, `season ${season} ACF lag ${lag}`);
    }
    near(pacf[0], PSI_12[season], 0.08, `season ${season} PACF lag 1`);
    for (let lag = 2; lag <= 6; lag += 1) {
      near(pacf[lag - 1], 0, 0.08, `season ${season} PACF lag ${lag}`);
    }
  }
});

test("figureData: lag-1 PACF is outside the band, lags 2-6 inside, so order selection returns 1", () => {
  const { acf, pacf, bandEdges, years, seasonLabel } = figureData();
  // The chapter's paragraph states season 6, N = 60 and lags 1-6.
  assert.equal(seasonLabel, 6);
  assert.equal(years, 60);
  assert.deepEqual(
    acf.map((r) => r.lag),
    [1, 2, 3, 4, 5, 6],
  );
  assert.deepEqual(
    pacf.map((r) => r.lag),
    [1, 2, 3, 4, 5, 6],
  );
  assert.equal(bandEdges[0], -bandEdges[1]);
  const selected = pacf.filter((r) => Math.abs(r.sample) > bandEdges[1]);
  assert.deepEqual(
    selected.map((r) => r.lag),
    [1],
  );
  // Seed-pinned illustration check, not a statistical bound: at N = 60 the
  // sample ACF has sd 0.06 to 0.13 per lag (measured over 2000 seeds), and only
  // 222 of seeds 1-2000 keep every lag within 0.1 of the model while only lag 1
  // is significant. The seed was chosen among them so the figure reads as a
  // sample following its model; a changed seed or ψ* re-selects the example
  // instead of loosening this tolerance.
  for (const row of acf) {
    near(row.sample, row.model, 0.1, `ACF lag ${row.lag}`);
  }
  near(
    pacf[0].model,
    acf[0].model,
    1e-12,
    "model PACF lag 1 = model ACF lag 1",
  );
  for (const row of pacf.slice(1)) {
    near(row.model, 0, 1e-12, `model PACF lag ${row.lag}`);
  }
});

test("mulberry32 matches the reference Mulberry32 stream and stays in [0, 1)", () => {
  // Known answers from an independent uint32 implementation of Mulberry32
  // (integer-exact, so identical on every engine).
  const g = mulberry32(42);
  assert.deepEqual(
    [g(), g(), g()],
    [0.6011037519201636, 0.44829055899754167, 0.8524657934904099],
  );
  const h = mulberry32(6);
  for (let i = 0; i < 10000; i += 1) {
    const u = h();
    assert.ok(u >= 0 && u < 1, `draw ${i}: ${u}`);
  }
});

test("standardNormals returns exactly n draws from one prefix-stable stream", () => {
  for (const n of [0, 1, 7, 8]) {
    assert.equal(standardNormals(3, n).length, n, `n = ${n}`);
  }
  assert.deepEqual(standardNormals(3, 7), standardNormals(3, 8).slice(0, 7));
});

test("simulatePar1 starts from z_0 = ε_0 and applies ψ* of the current step's season", () => {
  // ψ* = 0 in every season: z_t = ε_t, so the series is the innovation stream
  // reshaped row-major into years × seasons.
  const eps = standardNormals(5, 4 * 3);
  assert.deepEqual(
    simulatePar1([0, 0, 0], 4, 5),
    [0, 1, 2, 3].map((y) => eps.slice(3 * y, 3 * y + 3)),
  );
  // ψ* = [0, 1, 0]: season 1 has no innovation (√(1 − 1²) = 0) and copies
  // season 0 of the same year exactly; seasons 0 and 2 are fresh innovations.
  // Using ψ* of the previous step's season would break every equality below.
  const years = 50;
  const e = standardNormals(9, years * 3);
  const series = simulatePar1([0, 1, 0], years, 9);
  for (let y = 0; y < years; y += 1) {
    assert.equal(series[y][0], e[3 * y], `year ${y} season 0`);
    assert.equal(series[y][1], series[y][0], `year ${y} season 1`);
    assert.equal(series[y][2], e[3 * y + 2], `year ${y} season 2`);
  }
});

test("modelAcfPar1 multiplies ψ* backwards through the seasons (three-season hand case)", () => {
  // With M = 2, m − j and m + j coincide mod 2; M = 3 separates them.
  // ψ* = [0.5, 0.8, 0.3]: season 0 multiplies ψ*_0, ψ*_2, ψ*_1; season 1 ψ*_1, ψ*_0, ψ*_2.
  const psi = [0.5, 0.8, 0.3];
  const want: Record<number, number[]> = {
    0: [1, 0.5, 0.5 * 0.3, 0.5 * 0.3 * 0.8],
    1: [1, 0.8, 0.8 * 0.5, 0.8 * 0.5 * 0.3],
  };
  for (const season of [0, 1]) {
    const got = modelAcfPar1(psi, season, 3);
    for (let lag = 0; lag <= 3; lag += 1) {
      near(got[lag], want[season][lag], 1e-12, `season ${season} lag ${lag}`);
    }
  }
});

test("sample ACF looks back, not forward, through the seasons (three-season hand case)", () => {
  // Seasons 0 = [1,2,3], 1 = [2,4,6], 2 = [3,2,1]. Season 1 at lag 1 is season 0
  // of the same year (perfectly correlated); the forward neighbour, season 2,
  // is perfectly anti-correlated.
  const series = [
    [1, 2, 3],
    [2, 4, 2],
    [3, 6, 1],
  ];
  near(sampleAcfAt(series, 1, 1), 1, 1e-12, "season 1 lag 1");
});

test("sample ACF is 0 when the lag leaves no year-aligned pair", () => {
  // Two years, two seasons: season 0 at lag 4 reaches two years back, so no pair exists
  // (without the guard this would be 0/0 = NaN).
  const series = [
    [1, 4],
    [3, 2],
  ];
  assert.equal(sampleAcfAt(series, 0, 4), 0);
});

test("sample ACF pairs a_t with a_{t−ℓ} for lags beyond one cycle (lag mod M > season)", () => {
  // Seasons 0 = [0,2,4,6], 1 = [1,3,5,7] (population variance 5 each). Season 0 at
  // lag 3 reaches season 1 two years back: pairs (4,1) and (6,3), deviations (1,3)
  // and (−3,−1) -> −6 / 2 = −3 -> −3 / 5 = −0.6. Pairing only one year back would
  // give the lag-1 value 1/3.
  const series = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ];
  near(sampleAcfAt(series, 0, 3), -0.6, 1e-12, "season 0 lag 3");
});

test("figureData matches the paragraph: season-6 model products, decay over six lags, fixed domain", () => {
  const data = figureData();
  assert.deepEqual(data, figureData());
  // Model ACF of page season 6 is ∏ ψ*_6, ψ*_5, …: 0.75, ·0.72, ·0.70, ·0.65, ·0.60, ·0.55.
  const want = [0.75, 0.54, 0.378, 0.2457, 0.14742, 0.081081];
  data.acf.forEach((row, i) =>
    near(row.model, want[i], 1e-12, `model ACF lag ${row.lag}`),
  );
  near(data.pacf[0].model, 0.75, 1e-12, "model PACF lag 1 = ψ*_6");
  near(data.bandEdges[1], 1.96 / Math.sqrt(60), 1e-15, "band edge");
  assert.deepEqual(data.lagDomain, [0.5, 6.5]);
  // "the autocorrelation decays over all six lags"
  for (let i = 1; i < data.acf.length; i += 1) {
    assert.ok(
      data.acf[i].model < data.acf[i - 1].model,
      `model ACF rises at lag ${data.acf[i].lag}`,
    );
    assert.ok(
      data.acf[i].sample < data.acf[i - 1].sample,
      `sample ACF rises at lag ${data.acf[i].lag}`,
    );
  }
  assert.ok(
    data.acf.every((r) => r.model > 0 && r.sample > 0),
    "ACF stays positive",
  );
  // AcfPacfPlot.astro fixes y: domain [−0.5, 1]; every plotted value must fall inside it.
  const plotted = [
    ...data.acf.flatMap((r) => [r.sample, r.model]),
    ...data.pacf.flatMap((r) => [r.sample, r.model]),
    ...data.bandEdges,
  ];
  assert.ok(
    plotted.every((v) => Number.isFinite(v) && v >= -0.5 && v <= 1),
    "value outside [−0.5, 1]",
  );
});
