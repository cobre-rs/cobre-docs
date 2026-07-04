// Unit fixture for the check:voice detector (Epic 04 ticket-015).
//
// Pins detectVoiceViolations(text, zone)'s behaviour: hype fires in BOTH
// zones; the unpinned-number check fires in STRICT only; the doc-voice-ok
// escape hatch and fenced-code blanking both suppress a hit.

import test from "node:test";
import assert from "node:assert/strict";
import { detectVoiceViolations } from "./check-doc-voice.mjs";
import { ZONE_STRICT, ZONE_LENIENT } from "./doc-zones.mjs";

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

test("a bold-wrapped narration phrase is still matched (markdown '**' stripped before matching)", () => {
  const v = detectVoiceViolations(
    "This is not **merely** a presence gate but a full lifecycle state.",
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
