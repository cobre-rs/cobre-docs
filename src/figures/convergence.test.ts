// The correctness guarantee matplotlib never gave us: now it's a test.
// Mirrors valueFunction.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import { bounds, panels } from "./convergence.ts";

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

test("exact panel: lb is monotone non-decreasing and ubExact never falls below lb", () => {
  const { exact } = panels();
  for (let i = 0; i < exact.length; i += 1) {
    assert.ok(
      exact[i].ubExact >= exact[i].lb,
      `ubExact below lb at k=${exact[i].k}: ${exact[i].ubExact} < ${exact[i].lb}`,
    );
    if (i === 0) continue;
    assert.ok(
      exact[i].lb >= exact[i - 1].lb,
      `lb dipped at k=${exact[i].k}: ${exact[i].lb} < ${exact[i - 1].lb}`,
    );
  }
});

test("exact panel: ubExact is non-increasing and closes on lb toward cStar", () => {
  const cStar = 100;
  const { exact } = panels(25, cStar);
  for (let i = 1; i < exact.length; i += 1) {
    assert.ok(
      exact[i].ubExact <= exact[i - 1].ubExact,
      `ubExact rose at k=${exact[i].k}: ${exact[i].ubExact} > ${exact[i - 1].ubExact}`,
    );
  }
  const first = exact[0];
  const last = exact[exact.length - 1];
  assert.ok(
    last.ubExact - last.lb < (first.ubExact - first.lb) / 10,
    `gap did not close: ${last.ubExact - last.lb}`,
  );
  assert.ok(
    Math.abs(last.ubExact - cStar) < 5,
    `ubExact did not approach cStar: ${last.ubExact}`,
  );
});

test("sampled panel: lb is monotone non-decreasing and the band width is non-increasing", () => {
  const { sampled } = panels();
  for (let i = 1; i < sampled.length; i += 1) {
    assert.ok(
      sampled[i].lb >= sampled[i - 1].lb,
      `lb dipped at k=${sampled[i].k}: ${sampled[i].lb} < ${sampled[i - 1].lb}`,
    );
    const wPrev = sampled[i - 1].ciHi - sampled[i - 1].ciLo;
    const wCurr = sampled[i].ciHi - sampled[i].ciLo;
    assert.ok(
      wCurr <= wPrev + 1e-12,
      `band widened at k=${sampled[i].k}: ${wCurr} > ${wPrev}`,
    );
  }
});

test("sampled panel: the band starts above lb and reaches below it for the rest of the run", () => {
  const { sampled } = panels();
  assert.ok(sampled[0].ciLo > sampled[0].lb, "band already below lb at k=0");
  const firstBelow = sampled.findIndex((p) => p.ciLo < p.lb);
  assert.ok(firstBelow > 0, "band never reaches below lb");
  const tail = sampled.slice(firstBelow);
  assert.ok(
    tail.length >= 3,
    `band below lb for only ${tail.length} iterations`,
  );
  for (const { k, ciLo, lb } of tail) {
    assert.ok(ciLo < lb, `band back above lb at k=${k}: ciLo=${ciLo} lb=${lb}`);
  }
});

test("both panels share the same k and lb series", () => {
  const { sampled, exact } = panels();
  assert.equal(sampled.length, exact.length);
  for (let i = 0; i < sampled.length; i += 1) {
    assert.equal(sampled[i].k, exact[i].k);
    assert.equal(sampled[i].lb, exact[i].lb);
  }
});
