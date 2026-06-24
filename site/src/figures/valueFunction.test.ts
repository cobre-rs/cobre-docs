// The correctness guarantee matplotlib never gave us: now it's a test.
import test from "node:test";
import assert from "node:assert/strict";
import { Q, bendersTangentAt, samples } from "./valueFunction.ts";

test("tangent slope equals the analytic derivative (correct by construction)", () => {
  for (const v0 of [10, 30, 55, 80]) {
    const t = bendersTangentAt(v0);
    const h = 1e-6;
    const finiteDiff = (Q(v0 + h) - Q(v0 - h)) / (2 * h);
    assert.ok(
      Math.abs(t.slope - finiteDiff) < 1e-4,
      `slope ${t.slope} vs finite-diff ${finiteDiff} at v0=${v0}`,
    );
  }
});

test("tangent touches Q exactly at the pin", () => {
  for (const v0 of [10, 30, 55, 80]) {
    const t = bendersTangentAt(v0);
    assert.ok(Math.abs(t.at(v0) - Q(v0)) < 1e-9);
  }
});

test("Benders cut underestimates convex Q everywhere (the cut is a lower bound)", () => {
  const t = bendersTangentAt(40);
  for (const { v, q } of samples(100, 100)) {
    assert.ok(t.at(v) <= q + 1e-9, `cut above Q at v=${v}`);
  }
});
