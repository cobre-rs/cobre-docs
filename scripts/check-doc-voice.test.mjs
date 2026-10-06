// Unit fixture for the check:voice detector (Epic 04 ticket-015).
//
// Pins detectVoiceViolations(text, zone)'s behaviour: hype fires in BOTH
// zones; the unpinned-number check fires in STRICT only; the doc-voice-ok
// escape hatch and fenced-code blanking both suppress a hit.

import test from "node:test";
import assert from "node:assert/strict";
import {
  detectVoiceViolations,
  detectMagnitudeViolations,
  MAGNITUDE_RULE_IDS,
  RULE_IDS,
} from "./check-doc-voice.mjs";
import { ZONE_STRICT, ZONE_LENIENT, zoneOf } from "./doc-zones.mjs";

test("flags a hype superlative in the strict zone", () => {
  const v = detectVoiceViolations("Cobre is blazing-fast at solving LPs.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "hype-superlative"));
});

test("flags a hype superlative in the LENIENT zone too (hype is banned corpus-wide)", () => {
  const v = detectVoiceViolations("This CLI is blazing-fast.", ZONE_LENIENT);
  assert.ok(v.some((x) => x.rule === "hype-superlative"));
});

test("does NOT flag a hype phrase inside a fenced code block", () => {
  const text = "```\nthis mentions blazing-fast in a code sample\n```";
  assert.deepEqual(detectVoiceViolations(text, ZONE_STRICT), []);
});

test("flags a hedged magnitude ('typically N') in the STRICT zone", () => {
  const v = detectVoiceViolations(
    "The turbine efficiency is typically 0.85–0.92 for this class of plant.",
    ZONE_STRICT,
  );
  assert.ok(v.some((x) => x.rule === "unpinned-number"));
});

test("does NOT flag the same hedged magnitude in the LENIENT zone", () => {
  const v = detectVoiceViolations(
    "The turbine efficiency is typically 0.85–0.92 for this class of plant.",
    ZONE_LENIENT,
  );
  assert.deepEqual(v, []);
});

test("excludes a structural-noun count from the unpinned-number check", () => {
  // "typically stage 5" — "stage" is a structural noun, not a magnitude.
  const v = detectVoiceViolations("Convergence is typically stage 5 or later.", ZONE_STRICT);
  assert.deepEqual(v, []);
});

test("excludes a structural-suffix token ('8-bit', '1-based') from the unpinned-number check", () => {
  const v = detectVoiceViolations("Indexing is typically 1-based across the API.", ZONE_STRICT);
  assert.deepEqual(v, []);
});

test("a doc-voice-ok marked line is exempted even in the strict zone", () => {
  const text =
    "This is blazing-fast today. <!-- doc-voice-ok: domain term, not marketing -->";
  assert.deepEqual(detectVoiceViolations(text, ZONE_STRICT), []);
});

test("a bold-wrapped hype phrase is still matched (markdown '**' stripped before matching)", () => {
  // "more than **just**" -> after '**' stripping -> "more than just", which the
  // retained hype-contrasting-affirmative pattern matches. (The "not merely" /
  // "not just" family was dropped in the ticket-028 calibration as legitimate
  // logical-contrast connectives, so this exercises the '**'-stripping path via
  // the pattern that remains.)
  const v = detectVoiceViolations(
    "This is more than **just** a presence gate — it is a full lifecycle state.",
    ZONE_STRICT,
  );
  assert.ok(v.some((x) => x.rule === "hype-contrasting-affirmative"));
});

test("returns empty for clean prose in the strict zone", () => {
  const v = detectVoiceViolations(
    "## 1 Purpose\n\nThe value function is convex over the feasible region.",
    ZONE_STRICT,
  );
  assert.deepEqual(v, []);
});

test("the 'or more' unpinned-number form is flagged in strict zone", () => {
  const v = detectVoiceViolations("This requires 10 or more replications.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "unpinned-number"));
});

test("the 'common in practice' unpinned-number form is flagged in strict zone", () => {
  const v = detectVoiceViolations(
    "A horizon of this length is common in practice for annual studies.",
    ZONE_STRICT,
  );
  assert.ok(v.some((x) => x.rule === "unpinned-number"));
});

test("the 'on a modern' unpinned-number form is flagged in strict zone", () => {
  const v = detectVoiceViolations("This solves quickly on a modern workstation.", ZONE_STRICT);
  assert.ok(v.some((x) => x.rule === "unpinned-number"));
});

test("flags a monetary-rate instance magnitude in the STRICT zone", () => {
  const v = detectVoiceViolations("| 1,000–10,000 \\$/MWh |", ZONE_STRICT);
  assert.equal(v.filter((x) => x.rule === "instance-magnitude").length, 1);
});

test("does NOT flag the same instance magnitude in the LENIENT zone", () => {
  const v = detectVoiceViolations("| 1,000–10,000 \\$/MWh |", ZONE_LENIENT);
  assert.deepEqual(v, []);
});

test("does NOT flag a bare unit label with no leading number in strict zone", () => {
  const v = detectVoiceViolations("| \\$/MWh |", ZONE_STRICT);
  assert.deepEqual(v, []);
});

test("flags an open-ended magnitude ('5,000+') in the STRICT zone", () => {
  const v = detectVoiceViolations("| 5,000+ \\$/unit |", ZONE_STRICT);
  assert.equal(v.filter((x) => x.rule === "instance-magnitude").length, 1);
});

test("does NOT flag the same open-ended magnitude in the LENIENT zone", () => {
  const v = detectVoiceViolations("| 5,000+ \\$/unit |", ZONE_LENIENT);
  assert.deepEqual(v, []);
});

// detectMagnitudeViolations: a seeded positive per rule, the strict-only scope
// (the lenient zone and `examples/*` are exempt), prose blanking, block
// matching across a hard wrap, and the doc-voice-ok escape.

test("flags an open-ended instance count ('160+ hydro', '10+ iterations') in the STRICT zone", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "The study covers 160+ hydro plants.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-count", text: "160+ hydro" }],
  );
  assert.deepEqual(
    detectMagnitudeViolations("Burn-in takes 10+ iterations.", ZONE_STRICT),
    [{ lineno: 1, rule: "instance-count", text: "10+ iterations" }],
  );
});

test("flags an approximate state count ('≈ 2000 states', '~800 states') in the STRICT zone", () => {
  assert.deepEqual(
    detectMagnitudeViolations("The cut lives in ≈ 2000 states.", ZONE_STRICT),
    [{ lineno: 1, rule: "instance-approx", text: "≈ 2000 states" }],
  );
  assert.deepEqual(
    detectMagnitudeViolations("The cut lives in ~800 states.", ZONE_STRICT),
    [{ lineno: 1, rule: "instance-approx", text: "~800 states" }],
  );
});

test("flags the KaTeX approximation form ('$\\approx$ 2000 state dimensions')", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "The dimension is $\\approx$ 2000 state dimensions.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-approx", text: "\\approx$ 2000 state" }],
  );
});

test("flags a number-first span ('5-10 iterations') in the STRICT zone", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "Convergence takes 5-10 iterations.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-span", text: "5-10 iterations" }],
  );
});

test("flags the worded span ('5 to 10 iterations')", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "Convergence takes 5 to 10 iterations.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-span", text: "5 to 10 iterations" }],
  );
});

test("flags a unit-first span ('1 month - 5 years')", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "The horizon runs 1 month - 5 years.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-span", text: "1 month - 5 years" }],
  );
});

test("flags a phrase split by a hard wrap, at the line it starts on", () => {
  assert.deepEqual(
    detectMagnitudeViolations(
      "Studies with 160+\nhydro reservoirs are large.",
      ZONE_STRICT,
    ),
    [{ lineno: 1, rule: "instance-count", text: "160+ hydro" }],
  );
});

test("does NOT flag the same magnitudes in the LENIENT zone", () => {
  const text = "The study covers 160+ hydro plants in 5-10 iterations.";
  assert.equal(detectMagnitudeViolations(text, ZONE_STRICT).length, 2);
  assert.deepEqual(detectMagnitudeViolations(text, ZONE_LENIENT), []);
});

test("does NOT flag a worked example page (examples/* is lenient)", () => {
  const text = "The study covers 160+ hydro plants in 5-10 iterations.";
  assert.deepEqual(
    detectMagnitudeViolations(text, zoneOf("examples/toy-single-reservoir.md")),
    [],
  );
});

for (const text of [
  "Stage 1-3 is the initial window.",
  "This is a 2-stage problem.",
  "Indexing is 1-based across the API.",
  "The subproblem spans $t+1$ stages.",
  "The shift is ~ 12 percent of the demand.",
]) {
  test(`does NOT flag the near miss '${text}'`, () => {
    assert.deepEqual(detectMagnitudeViolations(text, ZONE_STRICT), []);
  });
}

test("does NOT flag a magnitude inside a fenced code block", () => {
  const text = "```\nThe study covers 160+ hydro plants.\n```";
  assert.deepEqual(detectMagnitudeViolations(text, ZONE_STRICT), []);
});

test("does NOT flag a magnitude inside an inline code span", () => {
  const text = "The token `160+ hydro` is a config literal.";
  assert.deepEqual(detectMagnitudeViolations(text, ZONE_STRICT), []);
});

test("a doc-voice-ok marked line is exempted from the magnitude rules", () => {
  const text =
    "The study covers 160+ hydro plants. <!-- doc-voice-ok: fixture -->";
  assert.deepEqual(detectMagnitudeViolations(text, ZONE_STRICT), []);
});

test("keeps the physical line number after a fenced block", () => {
  const text = "```\ncode\n```\n\nThe study covers 160+ hydro plants.";
  assert.deepEqual(detectMagnitudeViolations(text, ZONE_STRICT), [
    { lineno: 5, rule: "instance-count", text: "160+ hydro" },
  ]);
});

test("returns the hits of one block sorted by line, not by rule", () => {
  const text =
    "Convergence takes 5-10 iterations on\nthe 160+ hydro plants of the system.";
  assert.deepEqual(
    detectMagnitudeViolations(text, ZONE_STRICT).map((v) => [v.lineno, v.rule]),
    [
      [1, "instance-span"],
      [2, "instance-count"],
    ],
  );
});

test("MAGNITUDE_RULE_IDS holds the three magnitude rules, none in RULE_IDS", () => {
  assert.deepEqual([...MAGNITUDE_RULE_IDS].sort(), [
    "instance-approx",
    "instance-count",
    "instance-span",
  ]);
  for (const id of MAGNITUDE_RULE_IDS) assert.ok(!RULE_IDS.has(id));
});

test("detectVoiceViolations does not run the magnitude rules", () => {
  const v = detectVoiceViolations(
    "Convergence takes every 5-10 iterations.",
    ZONE_STRICT,
  );
  assert.ok(!v.some((x) => MAGNITUDE_RULE_IDS.has(x.rule)));
});
