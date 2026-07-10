// Column/field-count drift gate (Epic 04 ticket-015) — near-verbatim port of
// cobre's `scripts/ci/check_doc_counts.py`, retargeted to the cobre-docs I/O
// Reference pages.
//
// Several Reference pages introduce a schema table with a sentence like
// "... 27 columns." or "Eight columns ...", immediately followed by a
// markdown table whose data rows enumerate exactly those columns/fields. The
// number and the table can drift apart silently (the Rust schema tests assert
// the *code*, not the prose), so this gate cross-checks every such count
// against the row count of the table that follows it.
//
// It is deliberately conservative: a count is only checked when a markdown
// table begins within a few (blank) lines after it. Counts with no following
// table (back-references such as "all eleven columns must be present", or a
// count that merely describes a SUBSET, e.g. "five energy columns") are
// skipped — the `_COUNT_RE` requires the number to be immediately followed by
// "columns"/"fields", and the `must be present` back-reference form is
// explicitly skipped. Fenced code is skipped entirely.
//
// UNLIKE check-doc-voice.mjs / check-doc-version.mjs, this gate does NOT
// consult scripts/doc-lint-allow.txt: a column/field-count claim disagreeing
// with its own adjacent table is a plain factual bug (not a methodology-voice
// or version-annotation judgement call), so it has no grandfather path — it
// must be zero on the committed corpus or the gate genuinely fails.
//
// Exports `checkText(text)` (the pure per-file detector) behind a direct-run
// guard, mirroring check-figures.mjs / check-doc-voice.mjs.
//
// Run any time (no build needed — reads source content, not dist/):
//   node scripts/check-doc-counts.mjs   |   npm run check:counts

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs");

// Reference pages that use the "N columns/fields" + adjacent-table
// convention — the cobre-docs analogs of cobre's `output-format.md` /
// `case-format.md`. Crate/perf pages are NOT ported into this repo (they are
// relocated-domain content per CLAUDE.md), so they are correctly absent here.
const TARGET_FILES = [
  "reference/output-format.mdx",
  "reference/case-directory-format.mdx",
];

// Spelled-out cardinals the corpus uses for small counts.
const WORD_TO_INT = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

// A count token: digits or a spelled cardinal, then "columns"/"fields".
// The negative lookbehind rejects "4-column" and mid-word matches.
const COUNT_RE = new RegExp(
  `(?<![\\w-])(\\d+|${Object.keys(WORD_TO_INT).join("|")})\\s+(?:columns|fields)\\b`,
  "i",
);

function parseCount(token) {
  if (/^\d+$/.test(token)) return parseInt(token, 10);
  return WORD_TO_INT[token.toLowerCase()] ?? null;
}

function isTableSeparator(line) {
  const s = line.trim();
  if (!s.startsWith("|")) return false;
  if (!/^[|:\- ]+$/.test(s)) return false;
  return s.includes("-");
}

// Count data rows of the table whose header is at `headerIdx`. `headerIdx +
// 1` is its `|---|` separator; data rows are the contiguous `|`-prefixed
// lines after it.
function countTableRows(lines, headerIdx) {
  let rows = 0;
  for (let i = headerIdx + 2; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("|")) {
      rows += 1;
    } else {
      break;
    }
  }
  return rows;
}

// Return the data-row count of the table that immediately follows the count
// line (`start`), or null if the next non-blank content is not a table. Only
// blank lines may separate the count from its table — this is what
// distinguishes a table-intro count ("... 27 columns." directly above the
// schema table) from a prose mention that happens to precede an unrelated
// table further down (intervening prose is not skipped over).
function tableRowsAfter(lines, start) {
  let idx = start + 1;
  while (idx < lines.length && lines[idx].trim() === "") idx += 1;
  if (
    idx + 1 < lines.length &&
    lines[idx].trimStart().startsWith("|") &&
    isTableSeparator(lines[idx + 1])
  ) {
    return countTableRows(lines, idx);
  }
  return null;
}

/**
 * Pure per-file detector (exported for the node:test fixture). Returns a
 * list of drift messages for one file's text (empty = clean).
 *
 * @param {string} text file contents
 * @param {string} label a display name for the file, used in messages
 * @returns {string[]}
 */
export function checkText(text, label = "<text>") {
  const problems = [];
  const lines = text.split("\n");
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.replace(/^\s+/, "");
    if (stripped.startsWith("```") || stripped.startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Back-reference forms ("all N columns must be present") point at a
    // table ABOVE, not below — skip them.
    if (line.toLowerCase().includes("must be present")) continue;

    const match = COUNT_RE.exec(line);
    if (match === null) continue;
    const stated = parseCount(match[1]);
    if (stated === null) continue;

    const rows = tableRowsAfter(lines, i);
    if (rows === null) continue;

    if (stated !== rows) {
      problems.push(
        `${label}:${i + 1}: states ${JSON.stringify(match[0])} but the adjacent table has ${rows} data rows`,
      );
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for checkText (the node:test fixture) does NOT
// trigger the filesystem reads or process.exit.
// ---------------------------------------------------------------------------
function main() {
  const problems = [];
  let checked = 0;

  for (const rel of TARGET_FILES) {
    const path = join(contentRoot, rel);
    if (!existsSync(path)) {
      console.error(`check:counts: target file not found: ${path}`);
      process.exit(2);
    }
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch (error) {
      console.error(`check:counts: could not read ${rel}: ${error.message}`);
      process.exit(2);
    }
    problems.push(...checkText(text, rel));
    checked += 1;
  }

  if (problems.length > 0) {
    console.log(
      "FAIL: doc count drift (a pinned column/field count disagrees with its adjacent table). Fix the number or the table:",
    );
    for (const p of problems) console.log(`  ${p}`);
    process.exit(1);
  }

  console.log(
    `OK: column/field counts in ${checked} doc files match their adjacent tables.`,
  );
  process.exit(0);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
