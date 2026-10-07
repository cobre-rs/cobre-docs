// Unit fixture for the shared prose-preprocessing helpers (ticket-008).
//
// Pins the behaviour of the helpers extracted from check-doc-voice.mjs and
// check-doc-version.mjs so a third consumer can rely on them unchanged.

import test from "node:test";
import assert from "node:assert/strict";
import {
  proseLines,
  unclosedFenceLine,
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

test("proseLines blanks a tilde fence, a clean control for the fence-character rules", () => {
  const text = ["before", "~~~", "hidden", "~~~", "after"].join("\n");
  assert.deepEqual(proseLines(text), [
    [1, "before"],
    [5, "after"],
  ]);
});

test("proseLines blanks an indented fence, as inside a list item", () => {
  const text = ["- item", "  ```js", "  hidden", "  ```", "after"].join("\n");
  assert.deepEqual(proseLines(text), [
    [1, "- item"],
    [5, "after"],
  ]);
  assert.equal(unclosedFenceLine("- item\n  ```js\n  hidden"), 2);
});

test("proseLines: a ~~~ line inside a backtick fence does not close it, so fenced text is not read as prose", () => {
  const text = ["```", "~~~", "hidden", "```", "after"].join("\n");
  assert.deepEqual(
    proseLines(text).map(([lineno]) => lineno),
    [5],
  );
});

test("proseLines: a ~~~ line inside a backtick fence does not hide the prose after the real closer", () => {
  const text = ["```", "~~~", "hidden", "```", "after"].join("\n");
  assert.deepEqual(proseLines(text).at(-1), [5, "after"]);
});

test("proseLines: a backtick line inside a tilde fence does not close it", () => {
  const text = ["~~~", "```", "hidden", "~~~", "after"].join("\n");
  assert.deepEqual(proseLines(text), [[5, "after"]]);
});

test("proseLines: a closer needs at least the opener's length and an empty info string", () => {
  const longer = ["````", "```", "hidden", "````", "after"].join("\n");
  assert.deepEqual(proseLines(longer), [[5, "after"]]);
  const info = ["```", "```js", "hidden", "```", "after"].join("\n");
  assert.deepEqual(proseLines(info), [[5, "after"]]);
});

test("unclosedFenceLine returns the opening line of a fence still open at the end of the text", () => {
  assert.equal(unclosedFenceLine("text\n```js\ncode\nmore"), 2);
  assert.equal(unclosedFenceLine("~~~\ncode"), 1);
  assert.equal(unclosedFenceLine("```\nA\n```\n~~~\nB"), 4);
});

test("unclosedFenceLine is null when every fence closes, whatever the fence characters", () => {
  assert.equal(unclosedFenceLine("text\n```js\ncode\n```\nmore"), null);
  assert.equal(unclosedFenceLine("~~~\ncode\n~~~\n"), null);
  assert.equal(unclosedFenceLine("```\n~~~\ncode\n```"), null);
  assert.equal(unclosedFenceLine("````\n```\ncode\n````"), null);
  assert.equal(unclosedFenceLine("no fence at all"), null);
});

test("unclosedFenceLine: a ~~~ line inside a backtick fence does not close it", () => {
  assert.equal(unclosedFenceLine("```\n~~~\ncode"), 1);
  assert.equal(unclosedFenceLine("````\n```\ncode"), 1);
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
