// Unit fixture for the check:type-spelling detector (E15 ticket-244b).
//
// Pins loadVocabulary() on an inline section 4, findTables() (header match,
// heading binding, fences) and checkPage() (every problem code seeded once,
// the kind of each binding), plus the CLI on temp roots: the OK line, the
// FAIL block, the no-table line, pt-br exclusion and the exit-2 cases. Every
// page is inline; only the default-vocabulary test reads the committed
// convention document.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadVocabulary,
  findTables,
  checkPage,
} from "./check-type-spelling.mjs";

const SCRIPT = fileURLToPath(
  new URL("./check-type-spelling.mjs", import.meta.url),
);

const PARQUET_TABLE = `| Name      | Parquet physical type | pyarrow      |
| --------- | --------------------- | ------------ |
| \`Int32\`   | INT32                 | \`pa.int32()\` |
| \`UInt32\`  | INT32                 | \`pa.uint32()\` |
| \`Float64\` | DOUBLE                | \`pa.float64()\` |
| \`Utf8\`    | BYTE_ARRAY            | \`pa.string()\` |
| \`Date32\`  | INT32 (date)          | \`pa.date32()\` |`;

const JSON_TABLE = `| Name              | Meaning      |
| ----------------- | ------------ |
| \`integer\`         | JSON integer |
| \`number\`          | JSON number  |
| \`string\`          | JSON string  |
| \`boolean\`         | true/false   |
| \`object\`          | JSON object  |
| \`array\`           | JSON array   |
| \`integer \\| null\` | Nullable     |`;

const FLATBUFFERS_TABLE = `| Name      | Meaning          |
| --------- | ---------------- |
| \`bool\`    | Boolean scalar   |
| \`byte\`    | Enum underlying  |
| \`uint8\`   | Unsigned 8-bit   |
| \`int32\`   | Signed 32-bit    |
| \`uint32\`  | Unsigned 32-bit  |
| \`uint64\`  | Unsigned 64-bit  |
| \`float64\` | 64-bit float     |
| \`string\`  | UTF-8 string     |`;

function section4(...blocks) {
  return [
    "# Conventions",
    "",
    "## 3. Output table schema",
    "",
    "| Name | Type |",
    "| --- | --- |",
    "| `stage_id` | Int32 |",
    "",
    "## 4. Type vocabulary",
    "",
    ...blocks.flatMap((block) => [block, ""]),
    "## 5. Anchors",
    "",
  ].join("\n");
}

const VOCAB_MD = section4(PARQUET_TABLE, JSON_TABLE, FLATBUFFERS_TABLE);
const vocab = loadVocabulary(VOCAB_MD);

const INPUT_HEADER =
  "| Name | Type | Required | Default | Units | Description |\n| --- | --- | --- | --- | --- | --- |";
const OUTPUT_HEADER =
  "| Name | Type | Nullable | Units | Description |\n| --- | --- | --- | --- | --- |";

const inputRow = (type) => `| \`a\` | ${type} | Yes | — | — | A. |`;
const outputRow = (type) => `| \`a\` | ${type} | No | — | A. |`;

// Heading on line 1, blank line 2, table header on lines 3-4, rows from line 5.
const inputPage = (heading, ...types) =>
  [heading, "", INPUT_HEADER, ...types.map(inputRow), ""].join("\n");
const outputPage = (heading, ...types) =>
  [heading, "", OUTPUT_HEADER, ...types.map(outputRow), ""].join("\n");

const problem = (code, line, cell) =>
  `check:type-spelling: ${code} p.md:${line} ${cell}`;
const problemsOf = (text) => checkPage(text, "p.md", vocab).problems;

const JSON_FILE = "### `system/x.json`";
const PARQUET_FILE = "### `system/x.parquet`";

test("loadVocabulary reads the three sets of section 4 without byte and the nullable form", () => {
  assert.deepEqual(
    {
      parquet: [...vocab.parquet],
      json: [...vocab.json],
      flatbuffers: [...vocab.flatbuffers],
    },
    {
      parquet: ["Int32", "UInt32", "Float64", "Utf8", "Date32"],
      json: ["integer", "number", "string", "boolean", "object", "array"],
      flatbuffers: [
        "bool",
        "uint8",
        "int32",
        "uint32",
        "uint64",
        "float64",
        "string",
      ],
    },
  );
});

test("loadVocabulary returns null for two tables, four tables or no section", () => {
  assert.equal(loadVocabulary(section4(PARQUET_TABLE, JSON_TABLE)), null);
  assert.equal(
    loadVocabulary(
      section4(PARQUET_TABLE, JSON_TABLE, FLATBUFFERS_TABLE, JSON_TABLE),
    ),
    null,
  );
  assert.equal(loadVocabulary("# Doc\n\n## 5. Anchors\n"), null);
});

test("loadVocabulary reads only up to the next ## heading", () => {
  const md = `${VOCAB_MD}\n${JSON_TABLE}\n`;
  assert.notEqual(loadVocabulary(md), null);
});

test("loadVocabulary skips tables whose header does not start with Name", () => {
  const conventions =
    "| Type | pyarrow |\n| --- | --- |\n| `Int32` | `pa.int32()` |";
  assert.notEqual(
    loadVocabulary(
      section4(PARQUET_TABLE, conventions, JSON_TABLE, FLATBUFFERS_TABLE),
    ),
    null,
  );
});

test("loadVocabulary ignores headings and tables inside fenced blocks", () => {
  const headingInFence = "```text\n## Not a heading\n```";
  assert.notEqual(
    loadVocabulary(
      section4(PARQUET_TABLE, headingInFence, JSON_TABLE, FLATBUFFERS_TABLE),
    ),
    null,
  );
  const tableInFence = `\`\`\`md\n${JSON_TABLE}\n\`\`\``;
  assert.notEqual(
    loadVocabulary(
      section4(PARQUET_TABLE, tableInFence, JSON_TABLE, FLATBUFFERS_TABLE),
    ),
    null,
  );
  const fakeStart = "```text\n## 4. Type vocabulary\n```\n\n";
  assert.notEqual(loadVocabulary(fakeStart + VOCAB_MD), null);
});

test("findTables returns header line, kind, binding and rows of both standard tables", () => {
  const text = [
    "## `system/x.json`",
    "",
    INPUT_HEADER,
    inputRow("string"),
    inputRow("integer \\| null"),
    "",
    "Prose between the tables.",
    "",
    "## `simulation/hydros/`",
    "",
    OUTPUT_HEADER,
    outputRow("Int32"),
  ].join("\n");
  assert.deepEqual(findTables(text), [
    {
      line: 3,
      kind: "input",
      binding: "system/x.json",
      rows: [
        { line: 5, type: "string" },
        { line: 6, type: "integer \\| null" },
      ],
    },
    {
      line: 12,
      kind: "output",
      binding: "simulation/hydros/",
      rows: [{ line: 14, type: "Int32" }],
    },
  ]);
});

test("findTables does not read a table with another header or without a separator", () => {
  const others = [
    "| Field | Type | Description |\n| --- | --- | --- |\n| `a` | string | A. |",
    "| Name | Type | Required | Units | Description |\n| --- | --- | --- | --- | --- |\n| `a` | string | Yes | — | A. |",
    "| Name | Type | Nullable | Units | Description | Extra |\n| --- | --- | --- | --- | --- | --- |\n| `a` | string | No | — | A. | B |",
    "| Name | Type | Required | Default | Units | Description |\n| `a` | string | Yes | — | — | A. |",
  ];
  for (const other of others) {
    assert.deepEqual(findTables(`${JSON_FILE}\n\n${other}\n`), [], other);
  }
});

test("findTables reads a table indented inside a list item", () => {
  const text = `- A list item:\n\n  ${INPUT_HEADER.replace("\n", "\n  ")}\n  ${inputRow("string")}\n`;
  assert.equal(findTables(text).length, 1);
});

test("findTables ignores tables and headings inside fenced blocks", () => {
  const table = `${INPUT_HEADER}\n${inputRow("INT32")}`;
  const fenced = [
    `\`\`\`md\n${table}\n\`\`\``,
    `~~~\n${table}\n~~~`,
    `\`\`\`\`text\n\`\`\`json\n${table}\n\`\`\`\n\`\`\`\``,
    `\`\`\`\`text\n\`\`\`\n${table}\n\`\`\`\`\n`,
    `- item\n\n  \`\`\`md\n  ${table.replaceAll("\n", "\n  ")}\n  \`\`\`\n`,
    `\`\`\`\n\`\`\`js\n${table}\n\`\`\``,
    `\`\`\`\n~~~\n${table}\n\`\`\``,
    `\`\`\`\n${table}\n`,
  ];
  for (const block of fenced) {
    assert.deepEqual(findTables(`${JSON_FILE}\n\n${block}\n`), [], block);
  }
  const after = findTables(`\`\`\`\n${table}\n\`\`\`\n\n${table}\n`);
  assert.equal(after.length, 1);
  assert.equal(after[0].line, 7);
  const longer = findTables(`\`\`\`\n${table}\n\`\`\`\`\n\n${table}\n`);
  assert.deepEqual(
    longer.map((found) => found.line),
    [7],
  );

  const headingInFence = `${JSON_FILE}\n\n\`\`\`md\n## Sibling\n### \`other.parquet\`\n\`\`\`\n\n${table}\n`;
  assert.equal(findTables(headingInFence)[0].binding, "system/x.json");
});

test("a clean input table under a .json heading has no problem", () => {
  const text = inputPage(
    JSON_FILE,
    "string",
    "integer",
    "number",
    "boolean",
    "object",
    "array",
    "integer \\| null",
  );
  assert.deepEqual(checkPage(text, "p.md", vocab), {
    tables: 1,
    cells: 7,
    problems: [],
  });
});

test("INT32 is NOT-IN-VOCABULARY", () => {
  assert.deepEqual(problemsOf(inputPage(JSON_FILE, "string", "INT32")), [
    problem("NOT-IN-VOCABULARY", 6, "INT32"),
  ]);
});

test("a cell outside every set, or an empty cell, is NOT-IN-VOCABULARY", () => {
  assert.deepEqual(
    problemsOf(inputPage(PARQUET_FILE, "DOUBLE", "Int", "", "`Int32")),
    [
      problem("NOT-IN-VOCABULARY", 5, "DOUBLE"),
      problem("NOT-IN-VOCABULARY", 6, "Int"),
      problem("NOT-IN-VOCABULARY", 7, ""),
      problem("NOT-IN-VOCABULARY", 8, "`Int32"),
    ],
  );
});

test("a row with no Type cell is NOT-IN-VOCABULARY", () => {
  const text = `${JSON_FILE}\n\n${INPUT_HEADER}\n| \`a\` |\n`;
  assert.deepEqual(problemsOf(text), [problem("NOT-IN-VOCABULARY", 5, "")]);
});

test("a backticked cell is BACKTICKED", () => {
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "`Int32`", "Int32")), [
    problem("BACKTICKED", 5, "`Int32`"),
  ]);
  assert.deepEqual(problemsOf(outputPage(PARQUET_FILE, "`INT32`")), [
    problem("BACKTICKED", 5, "`INT32`"),
  ]);
});

test("a JSON keyword under a .parquet heading and an Arrow name under a .json heading are WRONG-KIND", () => {
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "integer", "Int32")), [
    problem("WRONG-KIND", 5, "integer"),
  ]);
  assert.deepEqual(problemsOf(inputPage(JSON_FILE, "Int32", "integer")), [
    problem("WRONG-KIND", 5, "Int32"),
  ]);
  assert.deepEqual(problemsOf(outputPage(PARQUET_FILE, "string")), [
    problem("WRONG-KIND", 5, "string"),
  ]);
});

test("a lower-case Arrow name is WRONG-KIND under a Parquet heading", () => {
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "int32")), [
    problem("WRONG-KIND", 5, "int32"),
  ]);
});

test("integer \\| null is valid in an input table and NULLABLE-IN-OUTPUT in an output table", () => {
  assert.deepEqual(
    problemsOf(inputPage(JSON_FILE, "integer \\| null", "string \\| null")),
    [],
  );
  assert.deepEqual(problemsOf(inputPage("# Page", "integer \\| null")), []);
  assert.deepEqual(problemsOf(outputPage(JSON_FILE, "integer \\| null")), [
    problem("NULLABLE-IN-OUTPUT", 5, "integer \\| null"),
  ]);
  assert.deepEqual(problemsOf(outputPage("# Page", "number \\| null")), [
    problem("NULLABLE-IN-OUTPUT", 5, "number \\| null"),
  ]);
});

test("a nullable form needs a JSON keyword, the exact spacing and a JSON-kind binding", () => {
  assert.deepEqual(
    problemsOf(
      inputPage(
        JSON_FILE,
        "Int32 \\| null",
        "integer\\|null",
        "integer \\| nullable",
      ),
    ),
    [
      problem("NOT-IN-VOCABULARY", 5, "Int32 \\| null"),
      problem("NOT-IN-VOCABULARY", 6, "integer\\|null"),
      problem("NOT-IN-VOCABULARY", 7, "integer \\| nullable"),
    ],
  );
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "integer \\| null")), [
    problem("WRONG-KIND", 5, "integer \\| null"),
  ]);
  assert.deepEqual(
    problemsOf(inputPage("### `policy/x.bin`", "integer \\| null")),
    [problem("WRONG-KIND", 5, "integer \\| null")],
  );
});

test("a union of JSON keywords is valid in an unbound or .json table", () => {
  assert.deepEqual(
    problemsOf(inputPage(JSON_FILE, "string \\| object", "integer \\| number")),
    [],
  );
  assert.deepEqual(problemsOf(inputPage("# Page", "string \\| object")), []);
});

test("a union with a part outside the JSON keywords or with other spacing is NOT-IN-VOCABULARY", () => {
  assert.deepEqual(
    problemsOf(
      inputPage(
        JSON_FILE,
        "string \\| bogus",
        "Int32 \\| string",
        "string\\|object",
        "string \\| object \\| bogus",
      ),
    ),
    [
      problem("NOT-IN-VOCABULARY", 5, "string \\| bogus"),
      problem("NOT-IN-VOCABULARY", 6, "Int32 \\| string"),
      problem("NOT-IN-VOCABULARY", 7, "string\\|object"),
      problem("NOT-IN-VOCABULARY", 8, "string \\| object \\| bogus"),
    ],
  );
});

test("a union is WRONG-KIND under a .parquet heading and flagged under a .bin heading", () => {
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "string \\| object")), [
    problem("WRONG-KIND", 5, "string \\| object"),
  ]);
  assert.deepEqual(
    problemsOf(
      outputPage(
        "### `policy/x.bin`",
        "string \\| object",
        "string \\| uint32",
      ),
    ),
    [
      problem("WRONG-KIND", 5, "string \\| object"),
      problem("NOT-IN-VOCABULARY", 6, "string \\| uint32"),
    ],
  );
});

test("a backticked union is BACKTICKED", () => {
  assert.deepEqual(problemsOf(inputPage(JSON_FILE, "`string \\| object`")), [
    problem("BACKTICKED", 5, "`string \\| object`"),
  ]);
});

test("a union beside a nullable cell leaves the nullable rule unchanged", () => {
  assert.deepEqual(
    problemsOf(
      inputPage(
        JSON_FILE,
        "string \\| object",
        "integer \\| null",
        "Int32 \\| null",
      ),
    ),
    [problem("NOT-IN-VOCABULARY", 7, "Int32 \\| null")],
  );
  assert.deepEqual(problemsOf(outputPage(JSON_FILE, "integer \\| null")), [
    problem("NULLABLE-IN-OUTPUT", 5, "integer \\| null"),
  ]);
});

test("a .csv heading takes JSON keywords", () => {
  const csv = "### `training/dictionaries/entities.csv`";
  assert.deepEqual(problemsOf(inputPage(csv, "integer", "string")), []);
  assert.deepEqual(problemsOf(inputPage(csv, "Int32", "Utf8")), [
    problem("WRONG-KIND", 5, "Int32"),
    problem("WRONG-KIND", 6, "Utf8"),
  ]);
});

test("a .bin heading takes FlatBuffers spellings, vectors and schema names", () => {
  const bin = "### `policy/cuts/NNN.bin`";
  assert.deepEqual(
    problemsOf(
      outputPage(
        bin,
        "uint32",
        "string",
        "[float64]",
        "[uint8]",
        "[EntitySlot]",
        "EntityType",
        "SeasonManifest",
      ),
    ),
    [],
  );
  assert.deepEqual(
    problemsOf(
      outputPage(
        bin,
        "Int32",
        "INT32",
        "[Int32]",
        "[INT32]",
        "byte",
        "[byte]",
        "integer",
        "[]",
      ),
    ),
    [
      problem("WRONG-KIND", 5, "Int32"),
      problem("NOT-IN-VOCABULARY", 6, "INT32"),
      problem("NOT-IN-VOCABULARY", 7, "[Int32]"),
      problem("NOT-IN-VOCABULARY", 8, "[INT32]"),
      problem("NOT-IN-VOCABULARY", 9, "byte"),
      problem("NOT-IN-VOCABULARY", 10, "[byte]"),
      problem("WRONG-KIND", 11, "integer"),
      problem("NOT-IN-VOCABULARY", 12, "[]"),
    ],
  );
});

test("vectors and schema names are accepted under a .bin heading only", () => {
  assert.deepEqual(
    problemsOf(outputPage(JSON_FILE, "[float64]", "EntityType")),
    [
      problem("NOT-IN-VOCABULARY", 5, "[float64]"),
      problem("NOT-IN-VOCABULARY", 6, "EntityType"),
    ],
  );
  assert.deepEqual(
    problemsOf(outputPage("# Page", "[float64]", "EntityType")),
    [
      problem("NOT-IN-VOCABULARY", 5, "[float64]"),
      problem("NOT-IN-VOCABULARY", 6, "EntityType"),
    ],
  );
});

test("a directory heading binds Arrow names", () => {
  const dir = "### `simulation/hydros/`";
  assert.deepEqual(problemsOf(outputPage(dir, "Int32", "Utf8")), []);
  assert.deepEqual(problemsOf(outputPage(dir, "string", "float64")), [
    problem("WRONG-KIND", 5, "string"),
    problem("WRONG-KIND", 6, "float64"),
  ]);
});

test("an unbound table accepts the union of the three sets", () => {
  assert.deepEqual(
    problemsOf(outputPage("# Page", "Int32", "integer", "uint32", "string")),
    [],
  );
  assert.deepEqual(problemsOf(outputPage("# Page", "INT32")), [
    problem("NOT-IN-VOCABULARY", 5, "INT32"),
  ]);
  assert.deepEqual(problemsOf(`${INPUT_HEADER}\n${inputRow("INT32")}\n`), [
    problem("NOT-IN-VOCABULARY", 3, "INT32"),
  ]);
});

test("a table under a non-path heading below the file heading stays bound", () => {
  const text = [
    "## `system/x.json`",
    "",
    "### Fields",
    "",
    "#### `Kind`",
    "",
    INPUT_HEADER,
    inputRow("Int32"),
  ].join("\n");
  assert.deepEqual(problemsOf(text), [problem("WRONG-KIND", 9, "Int32")]);
});

test("a heading of the same or a higher level clears the binding", () => {
  for (const clearing of ["## Sibling", "### Sibling", "# Page", "## `Kind`"]) {
    const text = [
      "### `system/x.json`",
      "",
      clearing,
      "",
      INPUT_HEADER,
      inputRow("Int32"),
    ].join("\n");
    assert.deepEqual(problemsOf(text), [], clearing);
  }
});

test("a path heading rebinds, and a deeper path heading overrides its parent", () => {
  const text = [
    "### `training/dictionaries/`",
    "",
    "#### `codes.json`",
    "",
    INPUT_HEADER,
    inputRow("Int32"),
    "",
    "#### `bounds.parquet`",
    "",
    INPUT_HEADER,
    inputRow("Int32"),
    inputRow("integer"),
    "",
    "### `training/hydro_models.json`",
    "",
    INPUT_HEADER,
    inputRow("Int32"),
  ].join("\n");
  assert.deepEqual(problemsOf(text), [
    problem("WRONG-KIND", 7, "Int32"),
    problem("WRONG-KIND", 14, "integer"),
    problem("WRONG-KIND", 20, "Int32"),
  ]);
});

test("a backticked heading that is not a path does not bind", () => {
  const text = [
    "### `BusinessRuleViolation`",
    "",
    INPUT_HEADER,
    inputRow("INT32"),
    "",
    "### `--flag`",
    "",
    INPUT_HEADER,
    inputRow("DOUBLE"),
    "",
    "### `see system/x.json`",
    "",
    INPUT_HEADER,
    inputRow("DATE"),
  ].join("\n");
  assert.deepEqual(
    findTables(text).map((found) => found.binding),
    [null, null, null],
  );
});

test("problems are reported per table with the page label and 1-based line", () => {
  const text = [
    JSON_FILE,
    "",
    INPUT_HEADER,
    inputRow("INT32"),
    "",
    "## `simulation/x/`",
    "",
    OUTPUT_HEADER,
    outputRow("string"),
    outputRow("Utf8"),
  ].join("\n");
  assert.deepEqual(checkPage(text, "reference/y.mdx", vocab), {
    tables: 2,
    cells: 3,
    problems: [
      "check:type-spelling: NOT-IN-VOCABULARY reference/y.mdx:5 INT32",
      "check:type-spelling: WRONG-KIND reference/y.mdx:11 string",
    ],
  });
});

function withRoot(files, run) {
  const root = mkdtempSync(join(tmpdir(), "type-spelling-"));
  const dirs = new Set();
  try {
    for (const [rel, content] of Object.entries(files)) {
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      for (let dir = dirname(rel); dir !== "."; dir = dirname(dir)) {
        dirs.add(dir);
      }
    }
    return run(root);
  } finally {
    for (const rel of Object.keys(files)) unlinkSync(join(root, rel));
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
      rmdirSync(join(root, dir));
    }
    rmdirSync(root);
  }
}

const cli = (args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

test("CLI: a root with no standard table exits 1 with the no-table line", () => {
  withRoot(
    {
      "docs/p.md":
        "| Field | Type | Description |\n| --- | --- | --- |\n| a | b | c |\n",
      "vocab.md": VOCAB_MD,
    },
    (root) => {
      const result = cli([
        "--root",
        join(root, "docs"),
        "--vocab",
        join(root, "vocab.md"),
      ]);
      assert.equal(result.status, 1);
      assert.equal(
        result.stdout,
        "check:type-spelling: no standard-schema table found\n",
      );
    },
  );
});

test("CLI: a seeded misspelling prints the FAIL block and exits 1", () => {
  withRoot(
    {
      "docs/p.md": `${JSON_FILE}\n\n${INPUT_HEADER}\n${inputRow("INT32")}\n${inputRow("integer \\| null")}\n`,
      "vocab.md": VOCAB_MD,
    },
    (root) => {
      const result = cli([
        "--root",
        join(root, "docs"),
        "--vocab",
        join(root, "vocab.md"),
      ]);
      assert.equal(result.status, 1);
      assert.equal(
        result.stdout,
        "FAIL: 1 problem(s)\ncheck:type-spelling: NOT-IN-VOCABULARY p.md:5 INT32\n",
      );
    },
  );
});

test("CLI: a clean root prints the OK line; nested pages are read, pt-br and non-page files are not", () => {
  const bad = inputPage(JSON_FILE, "INT32");
  withRoot(
    {
      "docs/reference/a.mdx": inputPage(PARQUET_FILE, "Int32", "Float64"),
      "docs/reference/deep/b.md": outputPage(JSON_FILE, "string"),
      "docs/plain.md": "No table here.\n",
      "docs/pt-br/reference/a.mdx": bad,
      "docs/notes.txt": bad,
      "vocab.md": VOCAB_MD,
    },
    (root) => {
      const result = cli([
        "--root",
        join(root, "docs"),
        "--vocab",
        join(root, "vocab.md"),
      ]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(
        result.stdout,
        "OK: 3 Type cells in 2 tables across 2 pages use the reference-conventions §4 vocabulary\n",
      );
    },
  );
});

test("CLI: problems are counted per cell and listed in page path order", () => {
  withRoot(
    {
      "docs/b.md": inputPage(JSON_FILE, "DOUBLE", "DATE"),
      "docs/a/z.md": inputPage(JSON_FILE, "INT32"),
      "docs/a.md": inputPage(JSON_FILE, "UINT32", "BYTE_ARRAY"),
      "vocab.md": VOCAB_MD,
    },
    (root) => {
      const result = cli([
        "--root",
        join(root, "docs"),
        "--vocab",
        join(root, "vocab.md"),
      ]);
      assert.equal(result.status, 1);
      assert.equal(
        result.stdout,
        [
          "FAIL: 5 problem(s)",
          "check:type-spelling: NOT-IN-VOCABULARY a.md:5 UINT32",
          "check:type-spelling: NOT-IN-VOCABULARY a.md:6 BYTE_ARRAY",
          "check:type-spelling: NOT-IN-VOCABULARY a/z.md:5 INT32",
          "check:type-spelling: NOT-IN-VOCABULARY b.md:5 DOUBLE",
          "check:type-spelling: NOT-IN-VOCABULARY b.md:6 DATE",
          "",
        ].join("\n"),
      );
    },
  );
});

test("CLI: the vocabulary comes from --vocab", () => {
  const custom = section4(
    PARQUET_TABLE.replace("`Int32`", "`Zed`"),
    JSON_TABLE,
    FLATBUFFERS_TABLE,
  );
  withRoot(
    {
      "docs/p.md": inputPage(PARQUET_FILE, "Zed"),
      "vocab.md": custom,
      "default.md": VOCAB_MD,
    },
    (root) => {
      const docs = join(root, "docs");
      assert.equal(
        cli(["--root", docs, "--vocab", join(root, "vocab.md")]).status,
        0,
      );
      assert.equal(
        cli(["--root", docs, "--vocab", join(root, "default.md")]).status,
        1,
      );
    },
  );
});

test("CLI: an unreadable vocabulary or one without the three tables exits 2", () => {
  withRoot(
    {
      "docs/p.md": inputPage(PARQUET_FILE, "Int32"),
      "two.md": section4(PARQUET_TABLE, JSON_TABLE),
    },
    (root) => {
      const docs = join(root, "docs");
      const missing = cli([
        "--root",
        docs,
        "--vocab",
        join(root, "missing.md"),
      ]);
      assert.equal(missing.status, 2);
      assert.match(missing.stderr, /could not read .*missing\.md/);
      const two = cli(["--root", docs, "--vocab", join(root, "two.md")]);
      assert.equal(two.status, 2);
      assert.match(two.stderr, /does not hold the three section 4 tables/);
    },
  );
});

test("CLI: the default vocabulary is the committed convention document", () => {
  withRoot({ "docs/p.md": inputPage(PARQUET_FILE, "Int32") }, (root) => {
    const result = cli(["--root", join(root, "docs")]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("CLI: the committed section 4 admits the nullable-suffix, untyped and union spellings", () => {
  const page = [
    inputPage(PARQUET_FILE, "Int32 (nullable)", "Float64 (nullable)"),
    inputPage(JSON_FILE, "\u2014", "string \\| object"),
  ].join("\n");
  withRoot({ "docs/p.md": page }, (root) => {
    const result = cli(["--root", join(root, "docs")]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("an empty backticked cell is BACKTICKED", () => {
  assert.deepEqual(problemsOf(inputPage(PARQUET_FILE, "``")), [
    problem("BACKTICKED", 5, "``"),
  ]);
});

test("findTables ends a table's rows at the first line that does not start with a pipe", () => {
  const text = [
    JSON_FILE,
    "",
    INPUT_HEADER,
    inputRow("string"),
    "### `other.parquet`",
    "",
    INPUT_HEADER,
    inputRow("Int32"),
  ].join("\n");
  assert.deepEqual(
    findTables(text).map(({ line, binding, rows }) => ({
      line,
      binding,
      rows,
    })),
    [
      {
        line: 3,
        binding: "system/x.json",
        rows: [{ line: 5, type: "string" }],
      },
      {
        line: 8,
        binding: "other.parquet",
        rows: [{ line: 10, type: "Int32" }],
      },
    ],
  );
});

test("CLI: an unknown option, an option without a value or an unreadable root exits 2", () => {
  withRoot({ "vocab.md": VOCAB_MD }, (root) => {
    const vocabArgs = ["--vocab", join(root, "vocab.md")];
    for (const args of [
      ["--bogus", ...vocabArgs],
      [...vocabArgs, "--root"],
      ["--root", join(root, "absent"), ...vocabArgs],
      ["--root", join(root, "vocab.md"), ...vocabArgs],
    ]) {
      const result = cli(args);
      assert.equal(result.status, 2, args.join(" "));
      assert.match(result.stderr, /^check:type-spelling: /, args.join(" "));
      assert.equal(result.stdout, "", args.join(" "));
    }
  });
});
