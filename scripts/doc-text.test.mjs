// Unit fixture for the shared prose-preprocessing helpers (ticket-008).
//
// Pins the behaviour of the helpers extracted from check-doc-voice.mjs and
// check-doc-version.mjs so a third consumer can rely on them unchanged.

import test from "node:test";
import assert from "node:assert/strict";
import {
  proseLines,
  buildBlocks,
  lineForOffset,
  inRuleSelfReference,
} from "./doc-text.mjs";

test("proseLines blanks fenced code and keeps the original line numbers", () => {
  const text = ["before", "```js", "const hidden = 1;", "```", "after"].join(
    "\n",
  );
  assert.deepEqual(proseLines(text), [
    [1, "before"],
    [5, "after"],
  ]);
});

test("proseLines blanks inline code spans", () => {
  assert.deepEqual(proseLines("use `secret` here"), [[1, "use   here"]]);
});

test("proseLines blanks HTML comments", () => {
  assert.deepEqual(proseLines("a <!-- hidden --> b"), [[1, "a   b"]]);
});

test("proseLines strips ** emphasis markers without splitting the words", () => {
  assert.deepEqual(proseLines("is **removed entirely** in the next"), [
    [1, "is removed entirely in the next"],
  ]);
});

test("buildBlocks joins a hard-wrapped paragraph and lineForOffset maps a match to its starting line", () => {
  const text =
    "The key was removed entirely in the\nv0.8.2 restructure.\n\nNext paragraph.";
  const blocks = buildBlocks(text);

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].startLine, 1);
  assert.equal(
    blocks[0].joined,
    "The key was removed entirely in the v0.8.2 restructure.",
  );
  assert.equal(blocks[1].startLine, 4);

  const wrapped = blocks[0].joined.match(/removed\s+entirely\s+in\s+the\s+v\d/);
  assert.ok(wrapped);
  assert.equal(lineForOffset(blocks[0], wrapped.index), 1);
  assert.equal(
    lineForOffset(blocks[0], blocks[0].joined.indexOf("restructure")),
    2,
  );
});

test("inRuleSelfReference is true inside a clause that negates carrying migration notes", () => {
  const joined = "The chapter carries no migration notes.";
  assert.equal(inRuleSelfReference(joined, joined.indexOf("migration")), true);
});

test("inRuleSelfReference is false for genuine change narration", () => {
  const joined = "A migration guide was added in v0.9.";
  assert.equal(inRuleSelfReference(joined, joined.indexOf("migration")), false);
});
