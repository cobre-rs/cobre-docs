// Unit fixture for the check:counts detector (Epic 04 ticket-015).
//
// Pins checkText()'s behaviour: a stated count that disagrees with its
// adjacent table's data-row count is drift; a matching count is clean; a
// "must be present" back-reference is skipped (it points at a table ABOVE,
// not below); a count with no adjacent table (mid-prose subset mention) is
// skipped; fenced code is ignored.
//
// Also pins checkVariableCatalogCount() (an "N variables" statement against
// the first table of the `## Variable catalog` section, with prose between
// them) and checkSchemaCount() ("N vendored JSON Schema files" statements and
// the `## Available schemas` table against the vendored file count).

import test from "node:test";
import assert from "node:assert/strict";
import {
  checkText,
  checkVariableCatalogCount,
  checkSchemaCount,
} from "./check-doc-counts.mjs";

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

const names = (n) => Array.from({ length: n }, (_, i) => `v${i}`);

function catalogPage(sentence, rows) {
  return `## Variable catalog\n\n${sentence}\n\nA grammar paragraph.\n\n${table(names(rows))}\n`;
}

test("catalog: 'All 26 LP variable types' matches 26 rows across an intervening paragraph", () => {
  const text = catalogPage("All 26 LP variable types are addressable.", 26);
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 26, problems: [] });
});

test("catalog: 'any of the 26 variables' phrasing matches 26 rows", () => {
  const text = catalogPage(
    "An `expression` can name any of the 26 variables below.",
    26,
  );
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 26, problems: [] });
});

test("catalog: flags a stated 27 against 26 rows, naming the line and the row count", () => {
  const text = catalogPage("All 27 LP variable types are addressable.", 26);
  const { problems } = checkVariableCatalogCount(text, "gc.mdx");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^gc\.mdx:3: states "27 LP variable types"/);
  assert.match(problems[0], /26 data rows/);
});

test("catalog: reads a spelled number against the table", () => {
  const clean = checkVariableCatalogCount(
    catalogPage("Three variables below.", 3),
    "gc.mdx",
  );
  assert.deepEqual(clean.problems, []);
  const drift = checkVariableCatalogCount(
    catalogPage("Four LP variables below.", 3),
    "gc.mdx",
  );
  assert.equal(drift.problems.length, 1);
  assert.match(drift.problems[0], /states "Four LP variables"/);
});

test("catalog: flags a section with no table, naming the heading line", () => {
  const text =
    "Intro.\n\n## Variable catalog\n\nAll 26 LP variable types.\n\nNo table here.\n";
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.equal(result.catalogRows, null);
  assert.equal(result.statements, 1);
  assert.deepEqual(result.problems, [
    'gc.mdx:3: "## Variable catalog" has no table',
  ]);
});

test("catalog: flags a page with no '## Variable catalog' section", () => {
  const text = `## Other\n\nAll 26 LP variable types.\n\n${table(names(26))}\n`;
  assert.deepEqual(checkVariableCatalogCount(text, "gc.mdx"), {
    statements: 0,
    catalogRows: null,
    problems: ['gc.mdx: no "## Variable catalog" section'],
  });
});

test("catalog: ignores a statement, a table and a heading inside a fenced block", () => {
  const text = [
    "```md",
    "## Variable catalog",
    "All 99 LP variable types.",
    "```",
    "",
    catalogPage("All 26 LP variable types.", 26),
  ].join("\n");
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 26, problems: [] });
});

test("catalog: ignores a statement and a table inside a fence within the section", () => {
  const text = `## Variable catalog\n\n\`\`\`md\nAll 99 variables.\n${table(names(9))}\n\`\`\`\n\n${table(names(3))}\n\nAll 3 variables.\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 3, problems: [] });
});

test("catalog: a pipe line without a separator row is not a table", () => {
  const text = `## Variable catalog\n\n| stray pipe prose\n\nAll 3 variables.\n\n${table(names(3))}\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 3, problems: [] });
});

test("catalog: does not read a statement after the next '##' heading", () => {
  const text = `${catalogPage("All 26 LP variable types.", 26)}\n## Later\n\nAll 5 variables.\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 26, problems: [] });
});

test("catalog: a '###' subsection stays inside the section", () => {
  const text = `## Variable catalog\n\n${table(names(3))}\n\n### Notes\n\nSee all 4 variables.\n`;
  const { problems } = checkVariableCatalogCount(text, "gc.mdx");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^gc\.mdx:11: states "4 variables"/);
});

test("catalog: counts the rows of the section's first table only", () => {
  const text = `${catalogPage("All 3 variables.", 3)}\n${table(names(9))}\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 3, problems: [] });
});

test("catalog: every statement on a line is checked", () => {
  const text = catalogPage(
    "Of the 26 variables, 3 variables take a block.",
    26,
  );
  const { statements, problems } = checkVariableCatalogCount(text, "gc.mdx");
  assert.equal(statements, 2);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /states "3 variables"/);
});

const schemaPage = (frontmatterCount, rows) =>
  `---\ntitle: JSON Schemas\ndescription: The ${frontmatterCount} vendored JSON Schema files.\n---\n\nIntro.\n\n## Available schemas\n\n${table(names(rows))}\n\n## Next\n`;

test("schemas: an equal frontmatter statement and table are clean", () => {
  const result = checkSchemaCount(schemaPage(18, 18), "js.mdx", 18);
  assert.deepEqual(result, { statements: 1, tableRows: 18, problems: [] });
});

test("schemas: flags a frontmatter 'The 17 vendored JSON Schema files' against 18", () => {
  const { problems } = checkSchemaCount(schemaPage(17, 18), "js.mdx", 18);
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^js\.mdx:3: states "17 vendored JSON Schema files"/,
  );
  assert.match(problems[0], /holds 18 vendored schema files/);
});

test("schemas: flags one wrong statement among two on a line", () => {
  const text = `${schemaPage(18, 18)}\nAll 18 schemas, not the 17 schemas of old.\n`;
  const { statements, problems } = checkSchemaCount(text, "js.mdx", 18);
  assert.equal(statements, 3);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /states "17 schemas"/);
});

test("schemas: flags a 17-row 'Available schemas' table against 18", () => {
  const { tableRows, problems } = checkSchemaCount(
    schemaPage(18, 17),
    "js.mdx",
    18,
  );
  assert.equal(tableRows, 17);
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^js\.mdx:8: the "## Available schemas" table has 17 data rows/,
  );
});

test("schemas: flags a 19-row 'Available schemas' table against 18", () => {
  const { tableRows, problems } = checkSchemaCount(
    schemaPage(18, 19),
    "js.mdx",
    18,
  );
  assert.equal(tableRows, 19);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /table has 19 data rows/);
});

test("schemas: a pipe line without a separator row is not a table", () => {
  const text = `## Available schemas\n\n| stray pipe prose\n\n${table(names(18))}\n`;
  const result = checkSchemaCount(text, "js.mdx", 18);
  assert.deepEqual(result, { statements: 0, tableRows: 18, problems: [] });
});

test("schemas: flags a page with no '## Available schemas' heading", () => {
  const text = "The 18 schemas below.\n\n## Other\n";
  assert.deepEqual(checkSchemaCount(text, "js.mdx", 18), {
    statements: 1,
    tableRows: null,
    problems: ['js.mdx: no "## Available schemas" section'],
  });
});

test("schemas: flags a heading whose table sits under the next heading of any level", () => {
  const text = `## Available schemas\n\nProse only.\n\n### Later\n\n${table(names(18))}\n`;
  const result = checkSchemaCount(text, "js.mdx", 18);
  assert.equal(result.tableRows, null);
  assert.deepEqual(result.problems, [
    'js.mdx:1: "## Available schemas" has no table',
  ]);
});

test("schemas: ignores a statement inside a fenced block", () => {
  const text = `${schemaPage(18, 18)}\n\`\`\`\nThe 99 schemas.\n\`\`\`\n`;
  const result = checkSchemaCount(text, "js.mdx", 18);
  assert.deepEqual(result, { statements: 1, tableRows: 18, problems: [] });
});

test("catalog: a '# ' line inside a fence does not end the section", () => {
  const text = `## Variable catalog\n\n\`\`\`text\n# a comment\n\`\`\`\n\nAll 3 variables.\n\n${table(names(3))}\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.deepEqual(result, { statements: 1, catalogRows: 3, problems: [] });
});

test("catalog: a table under the next '##' heading is not the catalog table", () => {
  const text = `## Variable catalog\n\nAll 3 variables.\n\n## Later\n\n${table(names(3))}\n`;
  const result = checkVariableCatalogCount(text, "gc.mdx");
  assert.equal(result.catalogRows, null);
  assert.deepEqual(result.problems, [
    'gc.mdx:1: "## Variable catalog" has no table',
  ]);
});

test("schemas: reads the first non-fenced table under the non-fenced heading", () => {
  const text = [
    "```md",
    "## Available schemas",
    table(names(5)),
    "```",
    "",
    "## Available schemas",
    "",
    "```md",
    "# a comment",
    table(names(7)),
    "```",
    "",
    table(names(18)),
    "",
    table(names(4)),
    "",
    "Eighteen JSON schema files.",
  ].join("\n");
  const result = checkSchemaCount(text, "js.mdx", 18);
  assert.deepEqual(result, { statements: 1, tableRows: 18, problems: [] });
});
