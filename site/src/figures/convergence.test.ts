// The correctness guarantee matplotlib never gave us: now it's a test.
// Mirrors valueFunction.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import { bounds } from "./convergence.ts";

test("lower bound is monotone non-decreasing across all k (append-only cut pool)", () => {
  const series = bounds();
  for (let i = 1; i < series.length; i += 1) {
    assert.ok(
      series[i].lb >= series[i - 1].lb,
      `lb dipped at k=${series[i].k}: ${series[i].lb} < ${series[i - 1].lb}`,
    );
  }
});

test("CI band width is monotone non-increasing (the band tightens with k)", () => {
  const series = bounds();
  for (let i = 1; i < series.length; i += 1) {
    const wPrev = series[i - 1].ciHi - series[i - 1].ciLo;
    const wCurr = series[i].ciHi - series[i].ciLo;
    assert.ok(
      wCurr <= wPrev + 1e-12,
      `band widened at k=${series[i].k}: ${wCurr} > ${wPrev}`,
    );
  }
});

test("ubMean > lb for every k (a strictly positive optimality gap)", () => {
  for (const { k, lb, ubMean } of bounds()) {
    assert.ok(
      ubMean > lb,
      `non-positive gap at k=${k}: ubMean=${ubMean} lb=${lb}`,
    );
  }
});

test("lb and ubMean both converge toward cStar as k → kMax", () => {
  const cStar = 100;
  const series = bounds(25, cStar);
  const last = series[series.length - 1];
  // exp(−25/8) ≈ 0.043 → residual gap a few % of cStar; both within 5 of cStar.
  assert.ok(
    Math.abs(last.lb - cStar) < 5,
    `lb did not approach cStar: ${last.lb}`,
  );
  assert.ok(
    Math.abs(last.ubMean - cStar) < 5,
    `ubMean did not approach cStar: ${last.ubMean}`,
  );
});
