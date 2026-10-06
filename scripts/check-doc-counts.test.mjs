// Unit fixture for the check:counts detector (Epic 04 ticket-015).
//
// Pins checkText()'s behaviour: a stated count that disagrees with its
// adjacent table's data-row count is drift; a matching count is clean; a
// "must be present" back-reference is skipped (it points at a table ABOVE,
// not below); a count with no adjacent table (mid-prose subset mention) is
// skipped; a count binds to the table after the rest of its own paragraph and
// at most one further prose paragraph; fenced code is ignored.
//
// Also pins checkVariableCatalogCount() (an "N variables" statement against
// the first table of the `## Variable catalog` section, with prose between
// them) and checkSchemaCount() ("N vendored JSON Schema files" statements and
// the `## Available schemas` table against the vendored file count).

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

test("a backtick line inside a tilde fence does not close the fence", () => {
  const text = [
    "~~~text",
    "```",
    "~~~",
    "The file has 3 columns.",
    "",
    "| a | b |",
    "| - | - |",
    "| 1 | 2 |",
  ].join("\n");
  const problems = checkText(text, "test.mdx");
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /states "3 columns" but the adjacent table has 1 data rows/,
  );
});

test("skips a 'must be present' back-reference (points at a table above)", () => {
  const text = `${table(["a", "b", "c"])}\n\nAll three columns must be present with the correct types.\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("skips a count with no adjacent table (a mid-prose subset mention)", () => {
  const text = "This entry has five energy columns among its many fields, described below.\n\nSome unrelated prose.\n";
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("skips a count separated from its table by two intervening prose paragraphs (not adjacent)", () => {
  const text = `Eight columns.\n\nSome unrelated intervening prose paragraph.\n\nAnother unrelated paragraph.\n\n${table(["a", "b", "c", "d", "e", "f", "g"])}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("reads the table past the rest of the count's own paragraph", () => {
  const rows = ["a", "b", "c"];
  const drift = checkText(
    `Four columns, all non-nullable.\nMore prose in the same paragraph.\n\n${table(rows)}\n`,
    "test.mdx",
  );
  assert.equal(drift.length, 1);
  assert.match(drift[0], /test\.mdx:1/);
  assert.match(drift[0], /3 data rows/);
  const clean = checkText(
    `Three columns, all non-nullable.\nMore prose in the same paragraph.\n\n${table(rows)}\n`,
    "test.mdx",
  );
  assert.deepEqual(clean, []);
});

test("reads the table past one intervening prose paragraph and a '**Methodology:**' line", () => {
  const rows = ["a", "b", "c", "d"];
  const drift = checkText(
    `Five columns.\n\n**Methodology:** [X](/math/x)\n\nOne intervening paragraph.\n\n${table(rows)}\n`,
    "test.mdx",
  );
  assert.equal(drift.length, 1);
  assert.match(drift[0], /test\.mdx:1/);
  assert.match(drift[0], /4 data rows/);
  const clean = checkText(
    `Four columns, in a paragraph\nthat runs on.\n\nOne intervening paragraph.\n\n${table(rows)}\n`,
    "test.mdx",
  );
  assert.deepEqual(clean, []);
});

test("does not read past a heading, a fence or a thematic break", () => {
  const rows = table(["a", "b", "c"]);
  for (const stop of ["## Next", "```\ncode\n```", "---"]) {
    const text = `Five columns.\n\n${stop}\n\n${rows}\n`;
    assert.deepEqual(checkText(text, "test.mdx"), [], stop);
  }
});

test("does not bind a count inside a table row to a later table", () => {
  const text = `| Name | Note |\n| --- | --- |\n| a | 5 columns |\n| b | x |\n\nOne paragraph.\n\n${table(["a", "b", "c"])}\n`;
  assert.deepEqual(checkText(text, "test.mdx"), []);
});

test("reads the table past a '**Methodology:**' line between the count and the table", () => {
  const text = `Five columns.\n\n**Methodology:** [Scenario Generation](/math/scenario-generation)\n\n${table(["a", "b", "c", "d"])}\n`;
  const problems = checkText(text, "test.mdx");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /test\.mdx:1/);
  assert.match(problems[0], /4 data rows/);
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

test("a page without the claim reports zero statements (the vacuous case main() refuses)", () => {
  const catalog = checkVariableCatalogCount(
    `## Variable catalog\n\nThe variables are listed below.\n\n${table(names(3))}\n`,
    "gc.mdx",
  );
  assert.deepEqual(catalog, { statements: 0, catalogRows: 3, problems: [] });
  const schemas = checkSchemaCount(
    `## Available schemas\n\nThe schemas are listed below.\n\n${table(names(18))}\n`,
    "js.mdx",
    18,
  );
  assert.deepEqual(schemas, { statements: 0, tableRows: 18, problems: [] });
});

// ---------------------------------------------------------------------------
// main(): the real script run against a scratch tree. The script resolves its
// pages and public/schemas from its own location, so each run copies it into
// a temporary root and executes it with the working directory elsewhere.
// ---------------------------------------------------------------------------

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "check-doc-counts.mjs",
);
const SCRIPT_SOURCE = readFileSync(SCRIPT, "utf8");
const TARGETS = SCRIPT_SOURCE.match(/"reference\/[a-z-]+\/[a-z-]+\.mdx"/g).map(
  (s) => s.slice(1, -1),
);
const DOCS = "src/content/docs/";
const CATALOG = `${DOCS}reference/generic-constraints.mdx`;
const SCHEMA_PAGE = `${DOCS}reference/json-schemas.mdx`;
const gcPage = (claim) =>
  `## Variable catalog\n\n${claim}\n\n${table(["a", "b", "c"])}\n`;
const jsPage = (claim) =>
  `---\ndescription: ${claim}\n---\n\n## Available schemas\n\n${table(["a", "b"])}\n`;

// `edit` maps a root-relative path to its content, or to null to omit it.
// `schemas` lists the files under public/schemas, or null to omit the directory.
function gate(
  edit = {},
  schemas = ["a.schema.json", "b.schema.json", "notes.txt"],
) {
  const files = {
    "scripts/check-doc-counts.mjs": SCRIPT_SOURCE,
    [CATALOG]: gcPage("There are 3 LP variable types."),
    [SCHEMA_PAGE]: jsPage("The 2 vendored JSON Schema files."),
    ...Object.fromEntries(
      TARGETS.map((rel) => [`${DOCS}${rel}`, "No count here.\n"]),
    ),
    ...Object.fromEntries(
      (schemas ?? []).map((f) => [`public/schemas/${f}`, "{}"]),
    ),
    ...edit,
  };
  const root = mkdtempSync(join(tmpdir(), "doc-counts-"));
  const dirs = new Set();
  const written = [];
  try {
    for (const [rel, content] of Object.entries(files)) {
      if (content === null) continue;
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      written.push(path);
      for (let dir = dirname(rel); dir !== "."; dir = dirname(dir))
        dirs.add(dir);
    }
    if (schemas !== null)
      mkdirSync(join(root, "public/schemas"), { recursive: true });
    return spawnSync(
      process.execPath,
      [join(root, "scripts/check-doc-counts.mjs")],
      {
        encoding: "utf8",
        cwd: tmpdir(),
      },
    );
  } finally {
    for (const path of written) unlinkSync(path);
    for (const dir of [...dirs, "public/schemas"].sort(
      (a, b) => b.length - a.length,
    )) {
      try {
        rmdirSync(join(root, dir));
      } catch {}
    }
    rmdirSync(root);
  }
}

test("main() is green on a consistent tree and prints the counts it verified", () => {
  const result = gate();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout.trim(),
    `OK: column/field counts in ${TARGETS.length} doc files match their adjacent tables; reference/generic-constraints.mdx states 3 LP variables (3 catalog rows); reference/json-schemas.mdx states 2 vendored schemas (2 table rows, 2 files in public/schemas).`,
  );
});

test("main() fails on a seeded drift in a target page, the catalog and the schema page", () => {
  const page = gate({
    [`${DOCS}${TARGETS[0]}`]: `Three columns.\n\n${table(["a", "b"])}\n`,
  });
  assert.equal(page.status, 1);
  assert.match(
    page.stdout,
    new RegExp(
      `${TARGETS[0]}:1: states "Three columns" but the adjacent table has 2 data rows`,
    ),
  );
  const catalog = gate({ [CATALOG]: gcPage("There are 4 LP variable types.") });
  assert.equal(catalog.status, 1);
  assert.match(
    catalog.stdout,
    /generic-constraints\.mdx:3: states "4 LP variable types" but the catalog table has 3 data rows/,
  );
  const schema = gate({
    [SCHEMA_PAGE]: jsPage("The 3 vendored JSON Schema files."),
  });
  assert.equal(schema.status, 1);
  assert.match(
    schema.stdout,
    /json-schemas\.mdx:2: states "3 vendored JSON Schema files" but public\/schemas holds 2 vendored schema files/,
  );
});

test("main() counts only *.schema.json files, resolved from the script's location", () => {
  const extra = gate({}, [
    "a.schema.json",
    "b.schema.json",
    "c.schema.json",
    "notes.txt",
  ]);
  assert.equal(extra.status, 1);
  assert.match(extra.stdout, /public\/schemas holds 3 vendored schema files/);
  assert.match(
    extra.stdout,
    /table has 2 data rows but public\/schemas holds 3/,
  );
});

test("main() exits 2 on a missing page, a missing schema directory or a page without the claim", () => {
  for (const edit of [{ [CATALOG]: null }, { [SCHEMA_PAGE]: null }]) {
    const result = gate(edit);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /target file not found/);
  }
  const noDir = gate({}, null);
  assert.equal(noDir.status, 2);
  assert.match(noDir.stderr, /check:counts: could not read/);
  const vacuousCatalog = gate({
    [CATALOG]: gcPage("The variables are listed below."),
  });
  assert.equal(vacuousCatalog.status, 2);
  assert.match(
    vacuousCatalog.stderr,
    /no count statement found in reference\/generic-constraints\.mdx/,
  );
  const vacuousSchema = gate({
    [SCHEMA_PAGE]: jsPage("The schemas are listed below."),
  });
  assert.equal(vacuousSchema.status, 2);
  assert.match(
    vacuousSchema.stderr,
    /no count statement found in reference\/json-schemas\.mdx/,
  );
});
