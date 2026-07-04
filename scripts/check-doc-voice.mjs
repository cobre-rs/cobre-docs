// Two-voice prose gate (Epic 04 ticket-015) — port of cobre's
// `scripts/ci/check_doc_voice.py`.
//
// cobre's book is single-voiced (software prose); cobre-docs is two-voiced
// (Epic 03: methodology math vs the software-layer partials/pages). The gate
// therefore keys every file off the shared `zoneOf()` predicate
// (scripts/doc-zones.mjs) and runs two checks with different scope:
//
//   1. Hype phrases — a curated list of marketing superlatives and
//      contrasting-affirmative constructs. Runs in BOTH zones: a sober
//      reference register is banned corpus-wide, not just in the methodology.
//   2. Unpinned "typical" numbers — a hedge word (typically/roughly/usually/
//      approximately/commonly) followed shortly by a magnitude, "N or more",
//      "common in practice", or "on a modern/typical ...". Runs in the STRICT
//      zone ONLY: the methodology states the invariant, not a transient
//      number, while the lenient software-layer pages may legitimately carry
//      concrete config/CLI numbers.
//
// Scans PROSE only: fenced code blocks (``` / ~~~), inline `code` spans, and
// HTML comments are blanked before matching, so code samples, identifiers, and
// config defaults are never flagged. A line carrying an inline
// `<!-- doc-voice-ok: reason -->` marker is exempted (checked against the RAW
// source line, since the marker itself is an HTML comment that would
// otherwise be blanked out of the prose).
//
// A committed baseline allowlist (scripts/doc-lint-allow.txt, R4) grandfathers
// pre-existing strict-zone hits so the gate lands green and blocks only NEW
// violations — see that file's header for the rationale-per-entry convention.
//
// Exports `detectVoiceViolations(text, zone)` — the pure per-file detector —
// behind a direct-run guard, mirroring check-figures.mjs / check-spdx.mjs.
//
// Run any time (no build needed — reads source content, not dist/):
//   node scripts/check-doc-voice.mjs   |   npm run check:voice

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { zoneOf, ZONE_STRICT, collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, isAllowlisted } from "./doc-lint-allowlist.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(scriptDir, "..", "src", "content", "docs") + "/";
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");

// ---------------------------------------------------------------------------
// §5-equivalent banned constructs (hype). Kept deliberately tight: only
// phrases that have no sober-reference use, so a hit is almost always real.
// Ported verbatim from check_doc_voice.py's `_HYPE_PATTERNS`.
// ---------------------------------------------------------------------------
const HYPE_PATTERNS = [
  [
    "hype-superlative",
    /\b(blazing[- ]?fast|blazingly|lightning[- ]?fast|world[- ]class|best[- ]in[- ]class|cutting[- ]edge|state[- ]of[- ]the[- ]art|game[- ]chang(?:ing|er)|revolutionar(?:y|ize)|revolutioniz\w*|seamless(?:ly)?|effortless(?:ly)?|production[- ]grade|battle[- ]tested|turnkey|supercharg\w*|unleash\w*|high[- ]fidelity|dramatically|zero[- ]cost|zero[- ]overhead)\b/i,
  ],
  [
    "hype-contrasting-affirmative",
    /(more than just\b|not just an?\b|isn't just\b|is not just\b|isn't merely\b|is not merely\b|not merely\b)/i,
  ],
];

// §2-equivalent unpinned-number checks, ported verbatim.
const HEDGE = /\b(typically|roughly|usually|approximately|commonly)\b/gi;
const OR_MORE = /\b\d[\d,]*\s+or\s+more\b/i;
const COMMON_IN_PRACTICE = /\bcommon in practice\b/i;
const ON_A_MODERN = /\bon a (?:modern|typical|standard|decent|recent)\b/i;

// A number found shortly after a hedge word, capturing the word right before it.
const HEDGE_NUM = /([A-Za-z][\w-]*\s+)?(~?\d[\d.,]*\S*)/;

// Words that legitimately precede a number (structural index, not a magnitude).
const STRUCTURAL_NOUNS = new Set([
  "stage",
  "stages",
  "rank",
  "ranks",
  "id",
  "ids",
  "index",
  "indices",
  "step",
  "steps",
  "phase",
  "phases",
  "bus",
  "buses",
  "line",
  "lines",
  "node",
  "nodes",
  "figure",
  "section",
  "chapter",
  "version",
  "table",
  "day",
  "days",
  "month",
  "months",
  "week",
  "weeks",
  "year",
  "years",
  "dimension",
  "dimensions",
  "order",
  "tier",
  "tiers",
  "block",
  "blocks",
  "level",
  "levels",
  "row",
  "rows",
  "column",
  "columns",
  "page",
]);

// A digit that is really part of a token like "1-based" / "8-bit" / "2-D".
const STRUCTURAL_SUFFIX = /^\d[\d.,]*-?(based|indexed|bit|byte|dimensional|d)\b/i;

const OK_MARKER = /<!--\s*doc-voice-ok/;
const INLINE_CODE = /`[^`]*`/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

// ---------------------------------------------------------------------------
// Blank fenced code, inline code spans, and HTML comments; return
// (lineno, prose) pairs, preserving line numbers for reporting — port of
// `_prose_lines`.
// ---------------------------------------------------------------------------
function proseLines(text) {
  const out = [];
  let inFence = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineno = i + 1;
    const line = lines[i];
    const stripped = line.replace(/^\s+/, "");
    if (stripped.startsWith("```") || stripped.startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    let prose = line.replace(INLINE_CODE, " ");
    prose = prose.replace(HTML_COMMENT, " ");
    // Strip markdown bold markers ("**"): a hedge/hype phrase is routinely
    // wrapped for emphasis (e.g. "not merely **policy quality**" or "is
    // **removed entirely**"), and the literal "**" would otherwise break a
    // `\s+`-only regex expecting the words to be separated by plain
    // whitespace. Stripping (not blanking to a space) keeps the surrounding
    // words adjacent, matching how the phrase actually reads once rendered.
    prose = prose.replace(/\*\*/g, "");
    out.push([lineno, prose]);
  }
  return out;
}

// Return a short description of the first unpinned-number hit, else null —
// port of `_typical_number_hit`.
function typicalNumberHit(prose) {
  const orMore = OR_MORE.exec(prose);
  if (orMore) return orMore[0];
  if (COMMON_IN_PRACTICE.test(prose)) return "common in practice";
  const onA = ON_A_MODERN.exec(prose);
  if (onA) return onA[0];

  HEDGE.lastIndex = 0;
  let hedgeMatch;
  while ((hedgeMatch = HEDGE.exec(prose)) !== null) {
    const after = hedgeMatch.index + hedgeMatch[0].length;
    const tail = prose.slice(after, after + 30);
    const m = HEDGE_NUM.exec(tail);
    if (!m) continue;
    const preceding = (m[1] || "").trim().toLowerCase();
    if (STRUCTURAL_NOUNS.has(preceding)) continue;
    let numPart = m[2].replace(/^\s+/, "");
    if (numPart.startsWith("~")) numPart = numPart.slice(1);
    if (STRUCTURAL_SUFFIX.test(numPart)) continue;
    return `${hedgeMatch[0]} ... ${numPart.slice(0, 12).trim()}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pure per-file detector (exported for the node:test fixture and for main()).
//
// `zone` is the file's `zoneOf()` result ("strict" | "lenient"). The hype
// check always runs; the unpinned-number check runs only when zone === strict.
// Returns an array of { lineno, rule, text } violations (allowlist NOT applied
// here — that is layered on by the caller so the pure detector stays testable
// without touching the filesystem).
// ---------------------------------------------------------------------------
export function detectVoiceViolations(text, zone) {
  const violations = [];
  const rawLines = text.split("\n");

  for (const [lineno, prose] of proseLines(text)) {
    if (!prose.trim()) continue;

    // The OK marker is an HTML comment, blanked out of `prose`; check the raw
    // source line so a genuine exception can opt out.
    if (OK_MARKER.test(rawLines[lineno - 1] ?? "")) continue;

    for (const [label, pattern] of HYPE_PATTERNS) {
      const m = pattern.exec(prose);
      if (m) {
        violations.push({ lineno, rule: label, text: m[0].trim() });
      }
    }

    if (zone === ZONE_STRICT) {
      const hit = typicalNumberHit(prose);
      if (hit !== null) {
        violations.push({ lineno, rule: "unpinned-number", text: hit });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for detectVoiceViolations (the node:test fixture)
// does NOT trigger the filesystem walk or process.exit.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:voice: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(1);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:voice: ${error.message}`);
    process.exit(1);
  }
  const relFiles = collectZonedSourceFiles(contentRoot).sort();

  const violations = [];
  let linesChecked = 0;

  for (const rel of relFiles) {
    const zone = zoneOf(rel);
    let text;
    try {
      text = readFileSync(join(contentRoot, rel), "utf8");
    } catch (error) {
      violations.push({
        rel,
        lineno: 0,
        rule: "unreadable",
        text: `${error.code ?? error.name}: ${error.message}`,
        allowlisted: false,
      });
      continue;
    }

    linesChecked += proseLines(text).filter(([, prose]) => prose.trim()).length;

    for (const v of detectVoiceViolations(text, zone)) {
      const allowlisted = isAllowlisted(allowlist, rel, v.lineno);
      violations.push({ rel, ...v, allowlisted });
    }
  }

  const failing = violations.filter((v) => !v.allowlisted);

  if (failing.length === 0) {
    const grandfathered = violations.length - failing.length;
    console.log(
      `OK: ${linesChecked} prose lines scanned across ${relFiles.length} files; ` +
        `no NEW promotional voice or unpinned 'typical' numbers found` +
        (grandfathered > 0
          ? ` (${grandfathered} pre-existing hit(s) grandfathered via scripts/doc-lint-allow.txt).`
          : "."),
    );
    process.exit(0);
  }

  for (const v of failing) {
    console.log(`VIOLATION [${v.rule}]: ${v.rel}:${v.lineno}: ${JSON.stringify(v.text)}`);
  }
  console.log(
    `FAIL: ${failing.length} prose violation(s). Rewrite per the Methodology Authoring ` +
      `Standards, mark a genuine exception with an inline '<!-- doc-voice-ok: reason -->', ` +
      `or (for a pre-existing hit under editorial review) add a rationale to scripts/doc-lint-allow.txt.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
