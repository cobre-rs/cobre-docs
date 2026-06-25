// Unit fixture for the check:d2 detectors (E10 ticket-032).
//
// The temporary-`tala`-edit AC already proves the guard catches a config
// violation end-to-end; this colocated node:test fixture additionally pins the
// two pure detectors (banned `layout: tala` in → violation out, clean
// `layout: "elk"` in → empty) so a future refactor of check-d2-layout.mjs cannot
// silently weaken the licensing guard. node:test + node:assert/strict, mirroring
// check-figures.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import {
  detectConfigViolations,
  detectD2BlockViolations,
} from "./check-d2-layout.mjs";

// --- detectConfigViolations -------------------------------------------------

test("config: clean `layout: \"elk\"` passes", () => {
  const text = 'astroD2({ inline: true, layout: "elk", theme: {} }),';
  assert.deepEqual(detectConfigViolations(text), []);
});

test("config: `layout: \"tala\"` is flagged", () => {
  const text = 'astroD2({ inline: true, layout: "tala" }),';
  const v = detectConfigViolations(text);
  assert.ok(v.length >= 1, "expected a violation for layout: \"tala\"");
  assert.ok(
    v.some((m) => /tala/i.test(m)),
    "expected the tala-token rule to fire",
  );
});

test("config: single-quoted `layout: 'tala'` is flagged", () => {
  const v = detectConfigViolations("layout: 'tala',");
  assert.ok(v.some((m) => /tala/i.test(m)));
});

test("config: unquoted `layout: tala` is flagged", () => {
  const v = detectConfigViolations("layout: tala");
  assert.ok(v.some((m) => /tala/i.test(m)));
});

test("config: uppercase `layout: \"TALA\"` is flagged (case-insensitive)", () => {
  const v = detectConfigViolations('layout: "TALA"');
  assert.ok(v.some((m) => /tala/i.test(m)));
});

test("config: missing layout key entirely is flagged", () => {
  // No layout assignment at all → astro-d2 would fall back to its default; the
  // guard must require the explicit elk.
  const v = detectConfigViolations("astroD2({ inline: true, theme: {} }),");
  assert.ok(v.length >= 1, "expected a violation for a missing layout key");
  assert.ok(
    v.some((m) => /missing/i.test(m) && /elk/i.test(m)),
    "expected the missing-elk rule to fire",
  );
});

test("config: the shipped warning COMMENT `never \"tala\"` is NOT a false positive", () => {
  // astro.config.mjs carries the literal guidance comment below; `layout` there
  // is not followed by a colon, so it is not a layout assignment and the bare
  // word "tala" inside it must not trip the guard. Pair it with the real elk
  // assignment exactly as the config does.
  const text = [
    '// layout MUST be "elk" — never "tala" (unlicensed TALA watermarks output, E10).',
    'layout: "elk",',
  ].join("\n");
  assert.deepEqual(detectConfigViolations(text), []);
});

test("config: prose words like \"metadata\"/\"tally\" are NOT false positives", () => {
  const text = 'metadata and a tally — layout: "elk"';
  assert.deepEqual(detectConfigViolations(text), []);
});

// --- detectD2BlockViolations ------------------------------------------------

test("d2 block: a `layout: tala` directive inside ```d2 is flagged", () => {
  const text = ["```d2", "layout: tala", "a -> b", "```"].join("\n");
  const v = detectD2BlockViolations(text);
  assert.ok(v.length >= 1, "expected a violation inside the d2 block");
  assert.ok(v.some((x) => /tala/i.test(x.match)));
});

test("d2 block: a quoted `layout: \"tala\"` directive is flagged", () => {
  const text = ['```d2', 'layout: "tala"', "a -> b", "```"].join("\n");
  assert.ok(detectD2BlockViolations(text).length >= 1);
});

test("d2 block: a clean block (direction/style, no tala) passes", () => {
  const text = [
    "```d2",
    "direction: right",
    "a -> b: edge {style.stroke-width: 3}",
    "```",
  ].join("\n");
  assert.deepEqual(detectD2BlockViolations(text), []);
});

test("d2 block: `tala` in surrounding PROSE (outside the d2 fence) is out of scope", () => {
  // Only block bodies are scanned; a layout: tala mention in prose around the
  // block (not inside it) is not a per-block directive and is ignored here.
  const text = [
    "Some prose mentioning layout: tala in passing.",
    "```d2",
    "direction: down",
    "a -> b",
    "```",
  ].join("\n");
  assert.deepEqual(detectD2BlockViolations(text), []);
});

test("d2 block: only the offending block is flagged among several", () => {
  const text = [
    "```d2",
    "direction: right",
    "a -> b",
    "```",
    "text between",
    "```d2",
    "layout: tala",
    "c -> d",
    "```",
  ].join("\n");
  const v = detectD2BlockViolations(text);
  assert.equal(v.length, 1, "expected exactly one flagged block");
});

test("d2 block: a non-d2 fenced block with `layout: tala` is ignored", () => {
  // A ```yaml/```text block that happens to contain the token is not a d2 block.
  const text = ["```yaml", "layout: tala", "```"].join("\n");
  assert.deepEqual(detectD2BlockViolations(text), []);
});
