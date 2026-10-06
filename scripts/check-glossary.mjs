// Glossary gate (E13 ticket-218, GRD-07; R63, R65, R57, R83, ADR-018, ADR-034).
//
// reference/glossary.md is a math-zone page (zoneOf, ticket-217a): it defines
// each term in words and links the reference page that owns a file, path or
// key. This gate keeps software tokens out of it and keeps its A–Z index in
// step with the term tables.
//
// Rules, each reported as `reference/glossary.md:<line>: [<rule>] <snippet>`:
//   glossary-file        an inline code span holding a file extension (.json,
//                        .parquet, .csv, .bin or .fbs), or a bare file name in
//                        prose;
//   glossary-path        any other inline code span holding a `/`;
//   glossary-config-key  any other inline code span;
//   glossary-index       the `## Index` disagrees with the tables: a row with
//                        no entry, an entry with no row in the section it
//                        names, or entries out of order.
//
// D-218-1  Any inline code span is a violation. After ticket-216 the glossary
//          holds none, and every backticked token it ever carried was a file
//          name, a path, a key, a value literal or a field tuple. Before
//          matching, fenced code, HTML/MDX comments, `$$…$$` and `$…$` math
//          and link targets (`](…)`) are blanked with line numbers preserved,
//          so an anchor such as `#stagesjson` and KaTeX never fire. One
//          left-to-right scan decides which construct opens first, so a span
//          holding `$` or `<!--` stays a span.
// D-218-2  The index is checked. Every table row outside `## Index` and
//          `## Equivalent terms in other planning tools` needs one entry
//          `[<first cell, verbatim>](#<section slug>)`; an entry needs one row
//          in the section it names; entries sort case-insensitively on the
//          first cell with inline math and non-alphanumerics dropped. The slug
//          and the sort key are those of ticket-216 AC3.
//
// An entry in scripts/doc-lint-allow.txt grandfathers only the glossary rule
// it names; a `glossary-` entry that matches no hit is reported STALE and
// fails (ADR-034). Exit 0 clean, 1 on a hit or a stale entry, 2 on a setup
// error (unreadable glossary, malformed allowlist, unclosed code fence).
//
// Usage: node scripts/check-glossary.mjs [glossary file]

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const glossaryPath = join(
  scriptDir,
  "..",
  "src",
  "content",
  "docs",
  "reference",
  "glossary.md",
);
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");
const GLOSSARY_REL = "reference/glossary.md";
const INDEX_RULE = "glossary-index";

export const GLOSSARY_RULE_IDS = new Set([
  "glossary-file",
  "glossary-path",
  "glossary-config-key",
  INDEX_RULE,
]);

const FILE_NAME = String.raw`\.(?:json|parquet|csv|bin|fbs)\b`;
const FILE_IN_SPAN = new RegExp(FILE_NAME);
const BARE_FILE = new RegExp(String.raw`\b[\w-]+${FILE_NAME}`, "g");

const OPEN_FENCE = /^\s*(?:(`{3,})[^`]*|(~{3,}).*)$/;
const CLOSE_FENCE = /^\s*(`{3,}|~{3,})\s*$/;

// Alternatives of one scan; the leftmost opener wins. CODE_SPAN holds the only
// capture group (its backtick run, which the closing run must repeat) and
// stays inside one paragraph.
const COMMENT = /<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}/;
const DISPLAY_MATH = /\$\$[\s\S]*?\$\$/;
const INLINE_MATH = /\$[^$\n]*\$/;
const CODE_SPAN = /(`+)(?!`)(?:(?!\n[ \t]*\n)[\s\S])*?[^`]\1(?!`)/;
const LINK_TARGET = /\]\([^)\n]*\)/;
const TOKEN = new RegExp(
  [COMMENT, DISPLAY_MATH, INLINE_MATH, CODE_SPAN, LINK_TARGET]
    .map((pattern) => pattern.source)
    .join("|"),
  "g",
);

const EQUIVALENT_TERMS = "Equivalent terms in other planning tools";
const INDEX_ENTRY = /\[([^\]]+)\]\(#([\p{L}\p{N}_-]+)\)/gu;
const SEPARATOR_CELL = /^:?-+:?$/;

const blankKeepingNewlines = (s) => s.replace(/[^\n]/g, " ");
const isComment = (token) => /^(?:<!--|\{\/\*)/.test(token);
const lineAt = (text, offset) => text.slice(0, offset).split("\n").length;

const spanRule = (span) => {
  if (FILE_IN_SPAN.test(span)) return "glossary-file";
  return span.includes("/") ? "glossary-path" : "glossary-config-key";
};

// Ticket-216 AC3: the heading slug and the index sort key.
const slugOf = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/\s+/g, "-");
const sortKey = (term) =>
  term
    .toLowerCase()
    .replace(/\$[^$]*\$/g, "")
    .replace(/[^a-z0-9]/g, "");

function blankFences(text) {
  let fence = null;
  const lines = text.split(/\r?\n/).map((line) => {
    if (fence === null) {
      const open = OPEN_FENCE.exec(line);
      if (!open) return line;
      fence = open[1] ?? open[2];
      return "";
    }
    const close = CLOSE_FENCE.exec(line);
    if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
      fence = null;
    }
    return "";
  });
  if (fence !== null) {
    throw new Error("the page ends inside an unclosed code fence");
  }
  return lines.join("\n");
}

const cellsOf = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
const isSeparator = (line) =>
  line.trimStart().startsWith("|") &&
  cellsOf(line).every((cell) => SEPARATOR_CELL.test(cell));

function indexViolations(text) {
  const lines = text.split("\n");
  const rows = [];
  const entries = [];
  let section = null;

  lines.forEach((line, i) => {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      section = heading[1].trim();
    } else if (section === "Index") {
      for (const m of line.matchAll(INDEX_ENTRY)) {
        entries.push({ lineno: i + 1, term: m[1], anchor: m[2] });
      }
    } else if (
      section !== null &&
      section !== EQUIVALENT_TERMS &&
      line.trimStart().startsWith("|") &&
      !isSeparator(line) &&
      !isSeparator(lines[i + 1] ?? "")
    ) {
      rows.push({
        lineno: i + 1,
        term: cellsOf(line)[0],
        anchor: slugOf(section),
      });
    }
  });

  const violations = [];
  const unmatched = new Map();
  for (const entry of entries) {
    const key = `${entry.term}\0${entry.anchor}`;
    unmatched.set(key, [...(unmatched.get(key) ?? []), entry]);
  }
  for (const row of rows) {
    const pending = unmatched.get(`${row.term}\0${row.anchor}`);
    if (pending?.length) {
      pending.shift();
    } else {
      violations.push({
        lineno: row.lineno,
        rule: INDEX_RULE,
        snippet: `"${row.term}" has no Index entry linking #${row.anchor}`,
      });
    }
  }
  for (const pending of unmatched.values()) {
    for (const entry of pending) {
      violations.push({
        lineno: entry.lineno,
        rule: INDEX_RULE,
        snippet: `Index entry "${entry.term}" (#${entry.anchor}) has no row in that section`,
      });
    }
  }
  for (let i = 1; i < entries.length; i++) {
    if (sortKey(entries[i - 1].term) > sortKey(entries[i].term)) {
      violations.push({
        lineno: entries[i].lineno,
        rule: INDEX_RULE,
        snippet: `Index entry "${entries[i].term}" sorts before "${entries[i - 1].term}"`,
      });
    }
  }
  return violations;
}

/**
 * Glossary hits in the page's source text (allowlist NOT applied). Throws when
 * the page ends inside an unclosed code fence.
 *
 * @param {string} text
 * @returns {Array<{ lineno: number, rule: string, snippet: string }>}
 */
export function detectGlossaryViolations(text) {
  const unfenced = blankFences(text);
  const violations = [];

  const prose = unfenced.replace(TOKEN, (token, _run, offset) => {
    if (token.startsWith("`")) {
      violations.push({
        lineno: lineAt(unfenced, offset),
        rule: spanRule(token),
        snippet: token.replace(/\s+/g, " "),
      });
    }
    return blankKeepingNewlines(token);
  });
  for (const m of prose.matchAll(BARE_FILE)) {
    violations.push({
      lineno: lineAt(prose, m.index),
      rule: "glossary-file",
      snippet: m[0],
    });
  }

  const structure = unfenced.replace(TOKEN, (token) =>
    isComment(token) ? blankKeepingNewlines(token) : token,
  );
  violations.push(...indexViolations(structure));

  return violations.sort((a, b) => a.lineno - b.lineno);
}

/**
 * Detector output split against the allowlist; this gate owns every rule id
 * starting `glossary-`.
 *
 * @param {string} text
 * @param {ReturnType<typeof loadAllowlist>} allowlist
 */
export function checkGlossary(text, allowlist) {
  const violations = detectGlossaryViolations(text).map((v) => ({
    rel: GLOSSARY_REL,
    ...v,
  }));
  return partitionByAllowlist(violations, allowlist, (id) =>
    id.startsWith("glossary-"),
  );
}

function main() {
  let result;
  try {
    result = checkGlossary(
      readFileSync(process.argv[2] ?? glossaryPath, "utf8"),
      loadAllowlist(allowlistPath),
    );
  } catch (error) {
    console.error(`check:glossary: ${error.message}`);
    process.exit(2);
  }
  const { failing, grandfathered, stale } = result;

  if (failing.length === 0 && stale.length === 0) {
    console.log(
      `OK: ${GLOSSARY_REL} has no software token and a complete A–Z index` +
        (grandfathered.length > 0
          ? ` (${grandfathered.length} pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).`
          : "."),
    );
    process.exit(0);
  }

  for (const v of failing) {
    console.log(`${GLOSSARY_REL}:${v.lineno}: [${v.rule}] ${v.snippet}`);
  }
  for (const s of stale) {
    console.log(
      `STALE [${s.ruleId}]: ${s.key} — doc-lint-allow.txt:${s.fileLine} matches no glossary hit`,
    );
  }
  console.log(
    `FAIL: ${failing.length} glossary violation(s), ${stale.length} stale allowlist entry(ies). ` +
      `The glossary is a math-zone page: state a file, path or key in words and link the reference page that owns it, ` +
      `and keep the Index to one entry per term row. Delete or re-key a stale entry in scripts/doc-lint-allow.txt.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
