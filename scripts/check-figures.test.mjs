// Unit fixture for the check:figures detector (E4 ticket-020).
//
// The detect-on-scratch-file AC already proves the gate catches a violation
// end-to-end; this colocated node:test fixture additionally pins the pure
// detector's behaviour (banned-pattern in → violation out, clean string in →
// empty) so a future refactor of check-figures.mjs cannot silently weaken it.
// node:test + node:assert/strict, mirroring src/figures/*.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { detectFigureViolations } from "./check-figures.mjs";

test("flags an ../../images/ asset reference", () => {
  const text = "![value function](../../images/d02-value-function.svg)";
  const v = detectFigureViolations(text);
  assert.ok(
    v.length >= 1,
    "expected at least one violation for ../../images/ path",
  );
  assert.ok(
    v.some((x) => x.rule.includes("../../images/")),
    "expected the image-asset rule to fire",
  );
});

test("flags a root-relative /images/ asset reference", () => {
  const v = detectFigureViolations("see /images/d22-risk-measure-cvar.svg");
  assert.ok(v.some((x) => x.rule.includes("/images/")));
});

test("flags a residual 'Figure — retooled in E4' aside", () => {
  const v = detectFigureViolations(":::note[Figure — retooled in E4]\n:::");
  assert.ok(v.some((x) => x.rule.includes("retooled in E4")));
});

test("flags each retired figure stem", () => {
  const stems = [
    "d02-value-function",
    "d03-scenario-tree",
    "d07-hybrid-parallelism",
    "d08-memory-architecture",
    "d09-forward-pass-distribution",
    "d21-convergence-bounds",
    "d22-risk-measure-cvar",
    "d23-par-stored-vs-computed",
    "d24-lp-column-layout",
    "system-element-overview",
  ];
  for (const stem of stems) {
    const v = detectFigureViolations(`reference to ${stem} here`);
    assert.ok(
      v.some((x) => x.rule.includes(stem)),
      `expected stem '${stem}' to be flagged`,
    );
  }
});

test("does NOT flag an external URL whose path contains /images/", () => {
  // `/images/` must catch a retired ROOT ref (`](/images/…`), not a path segment
  // inside an external URL — otherwise future attribution/links would misfire CI.
  const text = "logo at https://docs.cobre-rs.dev/images/logo.png and /math/images/x";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("does NOT flag the legitimate /math/system-elements chapter slug", () => {
  // The retired Excalidraw stem is `system-element-overview`; the bare
  // `system-element(s)` chapter slug appears in many prose cross-links and must
  // NOT be a false positive.
  const text = "see [system elements](/math/system-elements) for the cascade";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("does NOT flag the renderer-demo embeds index.mdx keeps", () => {
  // ValueFunctionPlot is a component import, ```d2 / ```mermaid are fenced
  // demos — none are retired-SVG references.
  const text = [
    'import ValueFunctionPlot from "../../components/ValueFunctionPlot.astro";',
    "```mermaid\nflowchart LR\n  A --> B\n```",
    "```d2\nforward -> backward\n```",
    "<ValueFunctionPlot />",
  ].join("\n");
  assert.deepEqual(detectFigureViolations(text), []);
});

test("returns empty for clean migrated prose", () => {
  const text = "## 1 Purpose\n\nThe value function is convex. See [LP](/math/lp-formulation).";
  assert.deepEqual(detectFigureViolations(text), []);
});

test("reports multiple violations in one file", () => {
  const text = "../../images/d02-value-function.svg and also d24-lp-column-layout";
  const v = detectFigureViolations(text);
  // 1 image-path hit + 2 stem hits (d02-value-function appears inside the path
  // AND d24-lp-column-layout) → at least 3.
  assert.ok(v.length >= 3, `expected >=3 violations, got ${v.length}`);
});
