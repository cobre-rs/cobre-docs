// Unit fixture for the check:narration detector (ticket-009).
//
// Pins detectNarrationViolations(text): one positive per rule id, one named
// negative per measured false-positive class of the corpus, the blanking of
// non-prose regions, the rule self-reference guard, and the rule-scoped,
// stale-strict allowlist behaviour on detector output.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  detectNarrationViolations,
  NARRATION_RULE_IDS,
} from "./check-doc-narration.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";

const rules = (text) => detectNarrationViolations(text).map((v) => v.rule);

// ---- positives: one per rule id ---------------------------------------------

test("flags 'no longer accepted' (narration-no-longer)", () => {
  assert.deepEqual(rules("The legacy key is no longer accepted."), [
    "narration-no-longer",
  ]);
});

test("flags a no-longer interface status: reads, exists, declared, dependent, an interface noun", () => {
  for (const sentence of [
    "This release no longer reads the file.",
    "The grammar key no longer exists.",
    "The commitment is no longer declared here.",
    "The checkpoint is no longer dependent on one field.",
    "V_ref is no longer an override column.",
  ]) {
    assert.ok(
      rules(sentence).includes("narration-no-longer"),
      `expected narration-no-longer in: ${sentence}`,
    );
  }
});

test("flags a sentence-initial 'Previously' (narration-previously)", () => {
  assert.deepEqual(rules("Previously, the solver rejected this input."), [
    "narration-previously",
  ]);
});

test("flags a previously-qualified change ('was previously documented')", () => {
  assert.deepEqual(rules("The key was previously documented as optional."), [
    "narration-previously",
  ]);
});

test("flags a narrative 'used to' (narration-used-to)", () => {
  assert.deepEqual(rules("Cobre used to write a metadata file."), [
    "narration-used-to",
  ]);
});

test("flags 'used to be' whatever the subject (narration-used-to)", () => {
  assert.deepEqual(rules("The default used to be 1e-6."), [
    "narration-used-to",
  ]);
});

test("flags 'formerly' (narration-formerly)", () => {
  assert.deepEqual(
    rules("The id now occupies the slot formerly held by a cut."),
    ["narration-formerly"],
  );
});

test("flags 'now supports' (narration-now-verb)", () => {
  assert.deepEqual(rules("| Run-of-river plants | Hull now supports it |"), [
    "narration-now-verb",
  ]);
});

test("flags 'was fixed' / 'were broken' (narration-was-fixed)", () => {
  assert.deepEqual(rules("The scaling bug was fixed."), [
    "narration-was-fixed",
  ]);
  assert.deepEqual(rules("Two cuts were broken."), ["narration-was-fixed"]);
});

test("flags 'fixed in <release>' (narration-fixed-in)", () => {
  assert.deepEqual(rules("The crash is fixed in v0.16.1."), [
    "narration-fixed-in",
  ]);
  assert.deepEqual(rules("The crash is fixed in the next minor release."), [
    "narration-fixed-in",
  ]);
});

test("flags 'new in <version>' (narration-new-in)", () => {
  assert.deepEqual(rules("The key is new in v0.12.0."), ["narration-new-in"]);
});

test("flags 'pre-vX' (narration-pre-version)", () => {
  assert.deepEqual(rules("This matches the pre-v0.12.0 ordering."), [
    "narration-pre-version",
  ]);
});

test("flags 'Earlier documentation' / 'earlier releases' (narration-earlier-docs)", () => {
  assert.deepEqual(rules("Earlier documentation described a different unit."), [
    "narration-earlier-docs",
  ]);
  assert.deepEqual(rules("A checkpoint from earlier releases is rejected."), [
    "narration-earlier-docs",
  ]);
});

test("flags 'this release' (narration-this-release)", () => {
  assert.deepEqual(rules("This release renamed the table."), [
    "narration-this-release",
  ]);
});

test("flags upper-case BREAKING (narration-breaking)", () => {
  assert.deepEqual(rules("BREAKING: the key is renamed."), [
    "narration-breaking",
  ]);
});

test("flags 'migration' (narration-migration)", () => {
  assert.deepEqual(rules("A migration guide covers the rename."), [
    "narration-migration",
  ]);
});

test("flags a Before/After example heading with its line number (narration-before-after-heading)", () => {
  const text =
    "### Before (v0.13.0): two constraints\n\nbody\n\n### After (v0.14.0): one\n";
  assert.deepEqual(
    detectNarrationViolations(text).map((v) => [v.lineno, v.rule, v.text]),
    [
      [1, "narration-before-after-heading", "### Before"],
      [5, "narration-before-after-heading", "### After"],
    ],
  );
});

test("NARRATION_RULE_IDS lists the 14 rule ids", () => {
  assert.equal(NARRATION_RULE_IDS.size, 14);
  assert.ok(NARRATION_RULE_IDS.has("narration-before-after-heading"));
  assert.ok(!NARRATION_RULE_IDS.has("unreadable"));
});

// ---- negatives: one per measured false-positive class ----------------------

test("class 1: purpose 'used to' is prose, not narration", () => {
  const text =
    "**Output.** The derived seed is a 64-bit hash value used to initialize a\nstream, and the method used to factorise the correlation.";
  assert.deepEqual(rules(text), []);
});

test("class 2: 'tie-breaking' is not BREAKING", () => {
  assert.deepEqual(
    rules("The tolerance is the strategy's tie-breaking band."),
    [],
  );
});

test("class 3: adjectival 'previously solved/trained/basic' is prose", () => {
  assert.deepEqual(
    rules(
      "Adding a row to a previously solved LP keeps the basis; evaluate a previously trained policy, or drop a previously-basic cut.",
    ),
    [],
  );
});

test("class 4: a logical 'no longer' in a derivation is prose", () => {
  for (const sentence of [
    "Once a travel-time arc is declared, that plant's release no longer enters the downstream water balance.",
    "A constraint is no longer characterised by picking one relation out of a fixed set.",
    "The single unscaling no longer exactly recovers original units.",
    "The probability-weighted path sum of section 2 is no longer the quantity the policy optimizes.",
    "The per-opening LPs are no longer separable across buses.",
  ]) {
    assert.deepEqual(rules(sentence), [], sentence);
  }
});

test("class 5: 'migration' inside a link fragment is not prose", () => {
  assert.deepEqual(
    rules(
      "See [the checkpoint section](#format-version-and-migration) and [the page](/running/policy-management/#format-version-and-migration).",
    ),
    [],
  );
});

test("class 6: the sentence stating the no-annotations rule is not narration", () => {
  const text =
    "The methodology describes current Cobre as fact; it does not carry version annotations, deprecation notices, or migration notes. Readers who find a discrepancy should treat the observed behaviour as authoritative.";
  assert.deepEqual(rules(text), []);
});

test("'fixed in advance' and 'fixed in the current implementation' are not narration", () => {
  assert.deepEqual(
    rules(
      "The permutation is fixed in advance from the opening identity, and the defaults are fixed in the current implementation.",
    ),
    [],
  );
});

test("'New input data schemas' and 'a new in-memory buffer' are not 'new in'", () => {
  assert.deepEqual(
    rules("- New input data schemas\n- A new in-memory buffer holds the rows."),
    [],
  );
});

// ---- blanking: non-prose regions never fire ---------------------------------

test("a 'no longer' inside a fenced code block is blanked", () => {
  const text = "```text\nmessage: it's `x is no longer accepted\n```\n";
  assert.deepEqual(rules(text), []);
});

test("a 'no longer' inside a ~~~ fence and inside a nested longer fence is blanked", () => {
  assert.deepEqual(rules("~~~\nis no longer accepted\n~~~\n"), []);
  assert.deepEqual(
    rules("````md\n```\nis no longer accepted\n```\nformerly held\n````\n"),
    [],
  );
});

test("a 'no longer' inside inline code is blanked, also when the span is wrapped", () => {
  assert.deepEqual(
    rules("The message `is no longer accepted` is verbatim."),
    [],
  );
  assert.deepEqual(
    rules("The message `is no longer\naccepted` is verbatim."),
    [],
  );
});

test("a 'no longer' inside an HTML comment is blanked", () => {
  assert.deepEqual(
    rules(
      "Text.\n\n<!-- is no longer accepted\nformerly held -->\n\nMore text.",
    ),
    [],
  );
});

test("a 'no longer' inside an MDX comment is blanked", () => {
  assert.deepEqual(
    rules(
      "Text.\n\n{/* is no longer accepted\n   formerly held */}\n\nMore text.",
    ),
    [],
  );
});

test("a 'no longer' inside a link target and a bare URL is blanked", () => {
  assert.deepEqual(
    rules('See [the guide](/running/x "is no longer accepted") for details.'),
    [],
  );
  assert.deepEqual(
    rules("See https://example.com/docs/migration for details."),
    [],
  );
});

test("line numbers survive blanking and a hard-wrapped phrase reports its starting line", () => {
  const text = [
    "# Title", // 1
    "", // 2
    "```", // 3
    "fenced", // 4
    "```", // 5
    "", // 6
    "<!-- a", // 7
    "comment -->", // 8
    "", // 9
    "The key is no", // 10
    "longer accepted.", // 11
  ].join("\n");
  assert.deepEqual(
    detectNarrationViolations(text).map((v) => [v.lineno, v.rule]),
    [[10, "narration-no-longer"]],
  );
});

test("** emphasis does not split a phrase", () => {
  assert.deepEqual(rules("The key is **no longer** accepted."), [
    "narration-no-longer",
  ]);
});

// ---- allowlist on detector output -------------------------------------------

const FIXTURE = [
  "# Title", // 1
  "", // 2
  "The key is no longer accepted.", // 3
  "", // 4
  "A field formerly held the flag.", // 5
].join("\n");

function partitionFixture(allowlistText) {
  const dir = mkdtempSync(join(tmpdir(), "check-doc-narration-test-"));
  try {
    const path = join(dir, "doc-lint-allow.txt");
    writeFileSync(path, allowlistText, "utf8");
    const violations = detectNarrationViolations(FIXTURE).map((v) => ({
      rel: "a.md",
      ...v,
    }));
    return partitionByAllowlist(violations, loadAllowlist(path), (id) =>
      NARRATION_RULE_IDS.has(id),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("stale narration entry fails by name", () => {
  const { failing, grandfathered, stale } = partitionFixture(
    [
      "a.md:3  narration-no-longer  # grandfathered",
      "a.md:9  narration-formerly  # matches no hit",
    ].join("\n"),
  );
  assert.deepEqual(
    failing.map((v) => [v.lineno, v.rule]),
    [[5, "narration-formerly"]],
  );
  assert.deepEqual(
    grandfathered.map((v) => [v.lineno, v.rule]),
    [[3, "narration-no-longer"]],
  );
  assert.deepEqual(stale, [
    { key: "a.md:9", ruleId: "narration-formerly", fileLine: 2 },
  ]);
});

test("re-keyed narration entry passes", () => {
  const { failing, grandfathered, stale } = partitionFixture(
    [
      "a.md:3  narration-no-longer  # grandfathered",
      "a.md:5  narration-formerly  # re-keyed to the hit's new line",
    ].join("\n"),
  );
  assert.deepEqual(failing, []);
  assert.equal(grandfathered.length, 2);
  assert.deepEqual(stale, []);
});
