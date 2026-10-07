// Mirrors cvar.test.ts (node:test + node:assert/strict).
import test from "node:test";
import assert from "node:assert/strict";
import {
  exampleRows,
  methodologyWeights,
  tailWeights,
  weightedValue,
} from "./cvarWeights.ts";

const TOL = 1e-12;
const COSTS = [10, 20, 30, 40];
const EQUAL = [0.25, 0.25, 0.25, 0.25];
const SKEWED_COSTS = [37, 5, 22, 48, 13];
const SKEWED = [0.1, 0.3, 0.2, 0.15, 0.25];
const CASES = [
  { costs: COSTS, probs: EQUAL },
  { costs: SKEWED_COSTS, probs: SKEWED },
];
const PARAMS = [
  { alpha: 0.5, lambda: 0.5 },
  { alpha: 0.2, lambda: 0.7 },
  { alpha: 0.9, lambda: 0.3 },
  { alpha: 0.05, lambda: 1 },
];

function close(actual: number[], expected: number[], message: string): void {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, i) =>
    assert.ok(
      Math.abs(value - expected[i]) < TOL,
      `${message}: index ${i} is ${value}, expected ${expected[i]}`,
    ),
  );
}

// CVaR_alpha by the Rockafellar-Uryasev minimisation of risk-measures §2; the
// minimum of this convex piecewise-linear function sits at one of the costs.
function cvarMinimisation(
  costs: number[],
  probs: number[],
  alpha: number,
): number {
  return Math.min(
    ...costs.map(
      (eta) =>
        eta +
        probs.reduce((s, p, i) => s + p * Math.max(0, costs[i] - eta), 0) /
          alpha,
    ),
  );
}

test("methodology value is 30.0", () => {
  const mu = methodologyWeights(COSTS, EQUAL, 0.5, 0.5);
  close(mu, [0.125, 0.125, 0.375, 0.375], "mu*");
  assert.ok(Math.abs(weightedValue(COSTS, mu) - 30) < TOL);
});

test("tail weights fill the costliest openings up to p/alpha, whatever the input order", () => {
  close(tailWeights(COSTS, EQUAL, 0.5), [0, 0, 0.5, 0.5], "ascending input");
  close(
    tailWeights([40, 10, 30, 20], EQUAL, 0.5),
    [0.5, 0, 0.5, 0],
    "shuffled input",
  );
  close(
    tailWeights(COSTS, EQUAL, 0.4),
    [0, 0, 0.375, 0.625],
    "the last opening touched takes the remainder",
  );
});

test("tail weights break cost ties by input order", () => {
  close(tailWeights([5, 5, 5, 5], EQUAL, 0.5), [0.5, 0.5, 0, 0], "ties");
});

test("weights sum to 1", () => {
  const sum = (w: number[]) => w.reduce((s, x) => s + x, 0);
  for (const { costs, probs } of CASES) {
    for (const { alpha, lambda } of PARAMS) {
      const label = `alpha=${alpha} lambda=${lambda}`;
      assert.ok(
        Math.abs(sum(tailWeights(costs, probs, alpha)) - 1) < TOL,
        `q* ${label}`,
      );
      assert.ok(
        Math.abs(sum(methodologyWeights(costs, probs, alpha, lambda)) - 1) <
          TOL,
        `mu* ${label}`,
      );
    }
  }
});

test("mu* never falls below the floor and never exceeds the cap", () => {
  for (const { costs, probs } of CASES) {
    for (const { alpha, lambda } of PARAMS) {
      methodologyWeights(costs, probs, alpha, lambda).forEach((mu, i) => {
        const floor = (1 - lambda) * probs[i];
        const cap = floor + (lambda * probs[i]) / alpha;
        assert.ok(mu >= floor - TOL, `mu*[${i}]=${mu} below floor ${floor}`);
        assert.ok(mu <= cap + TOL, `mu*[${i}]=${mu} above cap ${cap}`);
      });
    }
  }
});

test("lambda = 0 gives the nominal probabilities", () => {
  for (const { costs, probs } of CASES) {
    for (const alpha of [0.05, 0.5, 1]) {
      close(methodologyWeights(costs, probs, alpha, 0), probs, "mu*");
    }
  }
});

test("alpha = 1 gives the nominal probabilities", () => {
  for (const { costs, probs } of CASES) {
    for (const lambda of [0, 0.5, 1]) {
      close(methodologyWeights(costs, probs, 1, lambda), probs, "mu*");
    }
  }
});

test("lambda = 1 gives the tail weights", () => {
  for (const { costs, probs } of CASES) {
    close(
      methodologyWeights(costs, probs, 0.3, 1),
      tailWeights(costs, probs, 0.3),
      "mu*",
    );
  }
});

test("mu* value is (1 - lambda) E[Z] + lambda CVaR_alpha[Z]", () => {
  for (const { costs, probs } of CASES) {
    for (const { alpha, lambda } of PARAMS) {
      const mean = weightedValue(costs, probs);
      const expected =
        (1 - lambda) * mean + lambda * cvarMinimisation(costs, probs, alpha);
      const value = weightedValue(
        costs,
        methodologyWeights(costs, probs, alpha, lambda),
      );
      assert.ok(
        Math.abs(value - expected) < 1e-9,
        `alpha=${alpha} lambda=${lambda}: ${value} vs ${expected}`,
      );
    }
  }
});

test("exampleRows pins the four-opening example", () => {
  const rows = exampleRows();
  assert.deepEqual(
    rows.map((r) => r.cost),
    COSTS,
  );
  for (const row of rows) {
    assert.equal(row.nominal, 0.25);
    assert.equal(row.floor, 0.125);
  }
  close(
    rows.map((r) => r.mu),
    [0.125, 0.125, 0.375, 0.375],
    "mu*",
  );
});
