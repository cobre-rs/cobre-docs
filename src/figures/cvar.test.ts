// The correctness guarantee matplotlib never gave us: now it's a test.
// Mirrors valueFunction.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import { cdf, gammaPdf, lgamma, riskMoments, samples } from "./cvar.ts";

test("lgamma matches known closed forms (Lanczos is accurate)", () => {
  // Γ(3) = 2! = 2 → ln 2; Γ(1/2) = √π → ½·ln π; Γ(5) = 4! = 24 → ln 24.
  assert.ok(Math.abs(lgamma(3) - Math.log(2)) < 1e-9, `lgamma(3)=${lgamma(3)}`);
  assert.ok(
    Math.abs(lgamma(0.5) - 0.5 * Math.log(Math.PI)) < 1e-9,
    `lgamma(0.5)=${lgamma(0.5)}`,
  );
  assert.ok(
    Math.abs(lgamma(5) - Math.log(24)) < 1e-9,
    `lgamma(5)=${lgamma(5)}`,
  );
});

test("PDF is finite and non-negative everywhere, including x = 0", () => {
  // x = 0 drives the (shape−1)·log(x) term to −Inf; the guard must map it to 0.
  assert.equal(gammaPdf(0, 3, 15), 0);
  for (const { x, f } of samples(3, 15)) {
    assert.ok(Number.isFinite(f), `non-finite PDF at x=${x}`);
    assert.ok(f >= 0, `negative PDF ${f} at x=${x}`);
  }
});

test("riskMoments(3,15,0.10): E[C] ≈ 45 and E[C] < VaR < CVaR (correct by construction)", () => {
  const { expected, varAlpha, cvarAlpha } = riskMoments(3, 15, 0.1);
  // Mean of Gamma(shape, scale) = shape·scale = 45; numeric quadrature within 0.5.
  assert.ok(Math.abs(expected - 45) < 0.5, `expected=${expected}`);
  // CVaR is the tail mean strictly beyond VaR for a continuous right-skewed law.
  assert.ok(varAlpha < cvarAlpha, `VaR=${varAlpha} not < CVaR=${cvarAlpha}`);
  // Full ordering for this right-skewed gamma: the mean sits below both tail marks.
  assert.ok(expected < varAlpha, `E[C]=${expected} not < VaR=${varAlpha}`);
});

test("trapezoid CDF is monotone non-decreasing and ends at ≈ 1.0", () => {
  const c = cdf(3, 15);
  for (let i = 1; i < c.length; i += 1) {
    assert.ok(
      c[i] >= c[i - 1] - 1e-12,
      `CDF dipped at index ${i}: ${c[i]} < ${c[i - 1]}`,
    );
  }
  assert.ok(
    Math.abs(c[c.length - 1] - 1) < 1e-3,
    `CDF ends at ${c[c.length - 1]}`,
  );
});
