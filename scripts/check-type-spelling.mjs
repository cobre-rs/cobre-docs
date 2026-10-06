// Reference type-spelling gate (E15 ticket-244b).
//
// `docs/design/reference-conventions.md` section 4 owns the type vocabulary:
// Arrow names for Parquet columns, JSON Schema keywords for JSON and CSV
// fields, and the `policy.fbs` spellings for FlatBuffers fields. This gate
// reads that section at run time, so a type added to the document reaches the
// gate in the same change, and checks the Type cell of every table under
// `src/content/docs` whose header is exactly the input header
// (`Name | Type | Required | Default | Units | Description`) or the output
// header (`Name | Type | Nullable | Units | Description`). Other tables are not
// read. Fenced code is skipped.
//
// A table is bound to a file kind by the nearest preceding heading whose text
// is only a backticked path: `.parquet` or a directory path (`simulation/hydros/`)
// binds Arrow names, `.json` and `.csv` bind JSON keywords, `.bin` binds
// FlatBuffers spellings. A binding ends at the next heading of the same or a
// higher level. An unbound table accepts any name of the three sets.
//
// Problem codes, one per Type cell at most:
//   BACKTICKED          the cell is wrapped in backticks
//   NULLABLE-IN-OUTPUT  `<keyword> \| null` in an output table
//   WRONG-KIND          a vocabulary name outside the bound kind's set
//   NOT-IN-VOCABULARY   a name in none of the sets
//
// `<keyword> \| null` is the nullable form of an input table and takes a JSON
// keyword. A `.bin` table also accepts a vector `[T]` of a FlatBuffers spelling
// or schema name, and a schema name: a CamelCase identifier that is not a name
// of section 4 (`EntityType`, `[EntitySlot]`).
//
// Exports `loadVocabulary(markdown)`, `findTables(text)` and
// `checkPage(text, label, vocab)` behind a direct-run guard, mirroring
// check-doc-counts.mjs.
//
// Run any time (no build needed — reads source content, not dist/):
//   node scripts/check-type-spelling.mjs [--root <dir>] [--vocab <file>]
// Exit 0: clean. Exit 1: problems, or no standard-schema table under the root.
// Exit 2: an unknown or incomplete option, an unreadable root or page, or a
// vocabulary file that is unreadable or lacks the three section-4 tables.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const scriptDir = dirname(fileURLToPath(import.meta.url));

const INPUT_HEADER = "Name|Type|Required|Default|Units|Description";
const OUTPUT_HEADER = "Name|Type|Nullable|Units|Description";
const SCHEMA_NAME = /^(?=.*[a-z])[A-Z][A-Za-z0-9]*$/;

// Cells of a table row; `\|` stays inside its cell.
function splitCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

function isSeparator(line) {
  return /^\|[|:\- ]*-[|:\- ]*$/.test(line.trim());
}

// Per-line flags: true for a fence delimiter and every line inside a fence. A
// closing fence repeats the opening character at least as many times, so a
// four-backtick fence can hold a three-backtick line.
function fencedLines(lines) {
  let open = null;
  return lines.map((line) => {
    const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (open === null) {
      if (fence === null) return false;
      open = fence[1];
      return true;
    }
    if (
      fence !== null &&
      fence[2].trim() === "" &&
      fence[1][0] === open[0] &&
      fence[1].length >= open.length
    ) {
      open = null;
    }
    return true;
  });
}

// Every table outside fences: `{ line, header, rows }` with 1-based line
// numbers and trimmed cells.
function parseTables(lines, fenced) {
  const tables = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (
      fenced[i] ||
      !lines[i].trimStart().startsWith("|") ||
      !isSeparator(lines[i + 1])
    ) {
      continue;
    }
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trimStart().startsWith("|"); j++) {
      rows.push({ line: j + 1, cells: splitCells(lines[j]) });
    }
    tables.push({ line: i + 1, header: splitCells(lines[i]), rows });
    i = j - 1;
  }
  return tables;
}

function kindOfPath(path) {
  if (path.endsWith(".bin")) return "flatbuffers";
  if (/\.(json|csv)$/.test(path)) return "json";
  if (path.endsWith(".parquet") || path.endsWith("/")) return "parquet";
  return null;
}

function pathOfHeading(text) {
  const match = /^`([^`\s]+)`$/.exec(text);
  return match !== null && kindOfPath(match[1]) !== null ? match[1] : null;
}

function headingsOf(lines, fenced) {
  return lines.flatMap((line, i) => {
    const match = fenced[i] ? null : /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    return match === null
      ? []
      : [
          {
            line: i + 1,
            level: match[1].length,
            path: pathOfHeading(match[2]),
          },
        ];
  });
}

function bindingAt(headings, line) {
  let bound = null;
  for (const heading of headings) {
    if (heading.line > line) break;
    if (heading.path !== null) {
      bound = { level: heading.level, path: heading.path };
    } else if (bound !== null && heading.level <= bound.level) {
      bound = null;
    }
  }
  return bound === null ? null : bound.path;
}

/**
 * Read the type vocabulary from `## 4. Type vocabulary` of the convention
 * document: the backticked first-column names of its three tables
 * headed `Name`, in order Parquet, JSON, FlatBuffers. `byte` and the nullable
 * form `integer \| null` are not names.
 *
 * @param {string} markdown contents of the convention document
 * @returns {{parquet: Set<string>, json: Set<string>, flatbuffers: Set<string>} | null}
 *   null when the section is missing or does not hold exactly three such tables
 */
export function loadVocabulary(markdown) {
  const lines = markdown.split("\n");
  const fenced = fencedLines(lines);
  const start = lines.findIndex(
    (line, i) => !fenced[i] && /^## 4\. Type vocabulary\s*$/.test(line),
  );
  if (start === -1) return null;
  let end = lines.findIndex(
    (line, i) => i > start && !fenced[i] && /^## /.test(line),
  );
  if (end === -1) end = lines.length;

  const sets = parseTables(
    lines.slice(start + 1, end),
    fenced.slice(start + 1, end),
  )
    .filter((table) => table.header[0] === "Name")
    .map(
      (table) =>
        new Set(
          table.rows.flatMap(({ cells }) => {
            const name = /^`(.+)`$/.exec(cells[0])?.[1];
            return name === undefined || name === "byte" || name.includes("|")
              ? []
              : [name];
          }),
        ),
    );
  if (sets.length !== 3) return null;
  const [parquet, json, flatbuffers] = sets;
  return { parquet, json, flatbuffers };
}

/**
 * Every table outside fenced code whose header is exactly the input header or
 * the output header.
 *
 * @param {string} text page contents
 * @returns {{line: number, kind: "input" | "output", binding: string | null,
 *   rows: {line: number, type: string}[]}[]}
 *   `line` is the header row; `binding` is the path of the governing file
 *   heading; `type` is the trimmed Type cell, `\|` kept inside it
 */
export function findTables(text) {
  const lines = text.split("\n");
  const fenced = fencedLines(lines);
  const headings = headingsOf(lines, fenced);
  return parseTables(lines, fenced).flatMap((table) => {
    const header = table.header.join("|");
    if (header !== INPUT_HEADER && header !== OUTPUT_HEADER) return [];
    return [
      {
        line: table.line,
        kind: header === INPUT_HEADER ? "input" : "output",
        binding: bindingAt(headings, table.line),
        rows: table.rows.map((row) => ({
          line: row.line,
          type: row.cells[1] ?? "",
        })),
      },
    ];
  });
}

function inVocabulary(vocab, name) {
  return (
    vocab.parquet.has(name) ||
    vocab.json.has(name) ||
    vocab.flatbuffers.has(name)
  );
}

function isSchemaName(vocab, name) {
  return SCHEMA_NAME.test(name) && !inVocabulary(vocab, name);
}

// The problem code of one Type cell, or null when the cell is valid. `bound`
// is the kind of the governing file heading, null for an unbound table.
function classify(cell, tableKind, bound, vocab) {
  if (/^`.*`$/.test(cell)) return "BACKTICKED";

  const keyword = /^(\S+) \\\| null$/.exec(cell)?.[1];
  if (keyword !== undefined && vocab.json.has(keyword)) {
    if (tableKind === "output") return "NULLABLE-IN-OUTPUT";
    return bound === null || bound === "json" ? null : "WRONG-KIND";
  }

  if (bound === null ? inVocabulary(vocab, cell) : vocab[bound].has(cell)) {
    return null;
  }
  if (inVocabulary(vocab, cell)) return "WRONG-KIND";
  if (bound === "flatbuffers") {
    const element = /^\[(.+)\]$/.exec(cell)?.[1];
    if (
      isSchemaName(vocab, cell) ||
      (element !== undefined &&
        (vocab.flatbuffers.has(element) || isSchemaName(vocab, element)))
    ) {
      return null;
    }
  }
  return "NOT-IN-VOCABULARY";
}

/**
 * Check the Type cell of every standard-schema table of one page.
 *
 * @param {string} text page contents
 * @param {string} label display name of the page, used in problem lines
 * @param {NonNullable<ReturnType<typeof loadVocabulary>>} vocab
 * @returns {{tables: number, cells: number, problems: string[]}}
 *   each problem reads `check:type-spelling: <CODE> <label>:<line> <cell>`
 */
export function checkPage(text, label, vocab) {
  const tables = findTables(text);
  const problems = [];
  let cells = 0;
  for (const table of tables) {
    const bound = table.binding === null ? null : kindOfPath(table.binding);
    for (const row of table.rows) {
      cells += 1;
      const code = classify(row.type, table.kind, bound, vocab);
      if (code !== null) {
        problems.push(
          `check:type-spelling: ${code} ${label}:${row.line} ${row.type}`,
        );
      }
    }
  }
  return { tables: tables.length, cells, problems };
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for the node:test fixture does NOT trigger the
// filesystem reads or process.exit.
// ---------------------------------------------------------------------------
// Setup and usage errors exit 2, apart from the problem exit 1.
function fail(message) {
  console.error(`check:type-spelling: ${message}`);
  process.exit(2);
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: { root: { type: "string" }, vocab: { type: "string" } },
    }));
  } catch (error) {
    fail(error.message);
  }
  const root = resolve(
    values.root ?? join(scriptDir, "..", "src", "content", "docs"),
  );
  const vocabPath = resolve(
    values.vocab ??
      join(scriptDir, "..", "docs", "design", "reference-conventions.md"),
  );

  let markdown;
  try {
    markdown = readFileSync(vocabPath, "utf8");
  } catch (error) {
    fail(`could not read ${vocabPath}: ${error.message}`);
  }
  const vocab = loadVocabulary(markdown);
  if (vocab === null) {
    fail(`${vocabPath} does not hold the three section 4 tables`);
  }

  let pages;
  try {
    pages = readdirSync(root, { recursive: true })
      .filter((rel) => /\.mdx?$/.test(rel) && !rel.startsWith("pt-br/"))
      .sort()
      .map((rel) => ({ rel, text: readFileSync(join(root, rel), "utf8") }));
  } catch (error) {
    fail(`could not read ${root}: ${error.message}`);
  }

  let tables = 0;
  let cells = 0;
  let pagesWithTables = 0;
  const problems = [];
  for (const { rel, text } of pages) {
    const result = checkPage(text, rel, vocab);
    tables += result.tables;
    cells += result.cells;
    if (result.tables > 0) pagesWithTables += 1;
    problems.push(...result.problems);
  }

  if (tables === 0) {
    console.log("check:type-spelling: no standard-schema table found");
    process.exit(1);
  }
  if (problems.length > 0) {
    console.log(`FAIL: ${problems.length} problem(s)`);
    for (const problem of problems) console.log(problem);
    process.exit(1);
  }
  console.log(
    `OK: ${cells} Type cells in ${tables} tables across ${pagesWithTables} pages use the reference-conventions §4 vocabulary`,
  );
  process.exit(0);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
