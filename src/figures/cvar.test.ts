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

test("riskMoments(3,15,0.10): E[Z] ≈ 45 and E[Z] < VaR < CVaR (correct by construction)", () => {
  const { expected, varAlpha, cvarAlpha } = riskMoments(3, 15, 0.1);
  // Mean of Gamma(shape, scale) = shape·scale = 45; numeric quadrature within 0.5.
  assert.ok(Math.abs(expected - 45) < 0.5, `expected=${expected}`);
  // CVaR is the tail mean strictly beyond VaR for a continuous right-skewed law.
  assert.ok(varAlpha < cvarAlpha, `VaR=${varAlpha} not < CVaR=${cvarAlpha}`);
  // Full ordering for this right-skewed gamma: the mean sits below both tail marks.
  assert.ok(expected < varAlpha, `E[Z]=${expected} not < VaR=${varAlpha}`);
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

test("alpha is the tail fraction", () => {
  const xs = samples(3, 15).map((p) => p.x);
  const c = cdf(3, 15);
  for (const alpha of [0.05, 0.1, 0.5]) {
    const { varAlpha } = riskMoments(3, 15, alpha);
    // Probability mass on the grid at or beyond VaR_alpha: 1 − F(VaR_alpha).
    const tailMass = 1 - c[xs.findIndex((x) => x >= varAlpha)];
    assert.ok(
      Math.abs(tailMass - alpha) < 0.01,
      `alpha=${alpha}: mass at or beyond VaR=${varAlpha} is ${tailMass}`,
    );
  }
});

test("alpha = 1 gives the expectation", () => {
  const { expected, cvarAlpha } = riskMoments(3, 15, 1);
  // The worst 100% of outcomes is every outcome, so CVaR collapses to E[Z].
  assert.ok(
    Math.abs(cvarAlpha - expected) < 0.5,
    `CVaR_1=${cvarAlpha} not within 0.5 of E[Z]=${expected}`,
  );
});
