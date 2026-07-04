// Unit fixture for the check:counts detector (Epic 04 ticket-015).
//
// Pins checkText()'s behaviour: a stated count that disagrees with its
// adjacent table's data-row count is drift; a matching count is clean; a
// "must be present" back-reference is skipped (it points at a table ABOVE,
// not below); a count with no adjacent table (mid-prose subset mention) is
// skipped; fenced code is ignored.

import test from "node:test";
import assert from "node:assert/strict";
import { checkText } from "./check-doc-counts.mjs";

function table(rows) {
  const header = "| Column | Type |";
  const sep = "| --- | --- |";
  const body = rows.map((r) => `| ${r} | INT32 |`);
  return [header, sep, ...body].join("\n");
}

test("flags drift: stated 'Eight columns' with a 7-row adjacent table", () => {
  const text = `Eight columns.\n\n${table(["a", "b", "c", "d", "e", "f", "g"])}\n`;
  const problems = checkText(text, "test.mdx");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /test\.mdx:1/);
  assert.match(problems[0], /7 data rows/);
});

test("is clean when the stated count matches an 8-row table", () => {
  const text = `Eight columns.\n\n${table(["a", "b", "c", "d", "e", "f", "g", "h"])}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("is clean for a numeric count matching its table", () => {
  const text = `11 columns.\n\n${table(Array.from({ length: 11 }, (_, i) => `c${i}`))}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("flags numeric drift", () => {
  const text = `11 columns.\n\n${table(Array.from({ length: 10 }, (_, i) => `c${i}`))}\n`;
  const problems = checkText(text, "test.mdx");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /10 data rows/);
});

test("skips a 'must be present' back-reference (points at a table above)", () => {
  const text = `${table(["a", "b", "c"])}\n\nAll three columns must be present with the correct types.\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("skips a count with no adjacent table (a mid-prose subset mention)", () => {
  const text = "This entry has five energy columns among its many fields, described below.\n\nSome unrelated prose.\n";
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("skips a count separated from its table by intervening prose (not immediately adjacent)", () => {
  const text = `Eight columns.\n\nSome unrelated intervening prose paragraph.\n\n${table(["a", "b", "c", "d", "e", "f", "g"])}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("ignores a count inside a fenced code block", () => {
  const text = "```\nEight columns.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n```\n";
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("does not match a hyphenated 'N-column' mid-word form", () => {
  const text = `The 4-column schema below is fully described.\n\n${table(["a", "b", "c"])}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});
