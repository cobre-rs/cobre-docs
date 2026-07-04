// Version-reference gate (Epic 04 ticket-015) — reframe of cobre's
// `scripts/ci/check_book_version.py`.
//
// cobre's book compares every version STRING it finds against the workspace
// `Cargo.toml` version — cobre-docs has no Cargo.toml, so this gate is
// reframed around the "No version numbers in the corpus" hard rule
// (CLAUDE.md): the single anchor is the `**Synced to: cobre vX.Y.Z …**` line.
//
//   - STRICT zones (math/*.mdx excluding _impl/, overview/*): ZERO cobre-
//     version strings/tokens AND zero version-annotation narration
//     ("added in v0.8.1", "as of v0.8.0", "Keys renamed from v0.8.1", "earlier
//     releases", ...) are tolerated — this enforces the hard rule directly.
//     Third-party versions ("PSR's SDDP (v17.3+)") are NOT flagged: the
//     token patterns require a literal `cobre`/`COBRE`/`cobre_version` marker
//     immediately adjacent, and the narration patterns require a
//     version-change verb, neither of which a bare third-party `vN.N` token
//     satisfies.
//   - LENIENT zones (math/_impl/*, reference/*, running/*, getting-started/*,
//     examples/*): a cobre-version string MAY appear (real CLI output like
//     `COBRE v0.9.1`, sample JSON like `"cobre_version": "0.9.0"`) but must be
//     a well-formed `X.Y.Z` — it is deliberately NOT required to equal the
//     anchor (lenient content shows the actual binary/artifact version, which
//     need not match the methodology sync tag; see CLAUDE.md's own recorded
//     `getting-started/quickstart.mdx` vs "Synced to" mismatch).
//
// Unlike check-doc-voice.mjs, this gate does NOT blank fenced code / inline
// code before matching: a raw cobre-version token appearing anywhere in the
// file — including inside a CLI-transcript or JSON-sample code fence — is
// exactly what it must catch (mirrors check_book_version.py, which has no
// fence-tracking at all).
//
// Because this corpus mixes single-long-line paragraphs with hard-wrapped
// files (`math/lp-warm-start.md` wraps at ~80 cols), matching is done against
// PARAGRAPH blocks (contiguous non-blank lines joined with a space), not bare
// physical lines — a real narration phrase in this tree ("removed entirely in
// the\nv0.8.2 restructure") is split by a mid-sentence line wrap, and a
// naive per-line regex would silently miss it. Each match is mapped back to
// the physical line on which it STARTS for reporting.
//
// A committed baseline allowlist (scripts/doc-lint-allow.txt, shared with
// check-doc-voice.mjs) grandfathers pre-existing strict-zone hits.
//
// Exports `parseAnchor(text)` and `detectVersionViolations(text, zone)` behind
// a direct-run guard, mirroring check-doc-voice.mjs.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { zoneOf, ZONE_STRICT, collectZonedSourceFiles } from "./doc-zones.mjs";
import { loadAllowlist, isAllowlisted } from "./doc-lint-allowlist.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const contentRoot = join(repoRoot, "src", "content", "docs") + "/";
const claudeMdPath = join(repoRoot, "CLAUDE.md");
const allowlistPath = join(scriptDir, "doc-lint-allow.txt");

// ---------------------------------------------------------------------------
// The single version anchor: `**Synced to: cobre vX.Y.Z …**` in CLAUDE.md.
// ---------------------------------------------------------------------------
const ANCHOR_RE = /\*\*Synced to:\s*cobre\s+v(\d+\.\d+\.\d+)\b[^*]*\*\*/i;

/**
 * Parse the `**Synced to: cobre vX.Y.Z …**` anchor out of CLAUDE.md's text.
 * Throws a descriptive Error if the line is absent or malformed — this is
 * the single version anchor and its absence is a hard failure, not a warning.
 *
 * @param {string} text CLAUDE.md file contents
 * @returns {{ version: string, raw: string }}
 */
export function parseAnchor(text) {
  const m = ANCHOR_RE.exec(text);
  if (!m) {
    throw new Error(
      "no '**Synced to: cobre vX.Y.Z …**' anchor line found in CLAUDE.md " +
        "(or it is malformed) — this is the single version anchor and must be present.",
    );
  }
  return { version: m[1], raw: m[0] };
}

// ---------------------------------------------------------------------------
// STRICT-zone-only: version-ANNOTATION narration phrases. The first seven
// mirror the ticket's R3 pattern list verbatim; `version-narration-renamed`
// is an ADDED pattern (documented here, not silently folded in) — it is
// needed to catch a real, ticket-named hit ("Keys renamed from v0.8.1",
// math/cut-management.mdx:250) that none of the seven literal patterns match.
// All run against a paragraph BLOCK (see buildBlocks), case-insensitive,
// global.
// ---------------------------------------------------------------------------
const NARRATION_PATTERNS = [
  ["version-narration-added", /added\s+in\s+(?:the\s+)?v\d/gi],
  ["version-narration-since", /since\s+v\d/gi],
  ["version-narration-removed", /removed\s+(?:entirely\s+)?in\s+(?:the\s+)?v\d/gi],
  ["version-narration-as-of", /as\s+of\s+v\d/gi],
  ["version-narration-earlier-releases", /earlier\s+(?:cobre\s+)?releases?\b/gi],
  ["version-narration-deprecated", /\bdeprecated\b/gi],
  ["version-narration-migration", /\bmigration\b/gi],
  // ADDED beyond the R3 literal list (see comment above).
  [
    "version-narration-renamed",
    /(?:renamed|restructured|changed)\s+(?:from|in)\s+(?:the\s+)?v\d/gi,
  ],
];

// ---------------------------------------------------------------------------
// cobre-version TOKEN patterns, checked in BOTH zones (with a different
// verdict per zone — see detectVersionViolations). The captured group is
// deliberately loose (`[0-9][0-9.]*` / `[^"]*`) rather than a strict
// `\d+\.\d+\.\d+`, so a MALFORMED lenient-zone version string (e.g.
// "COBRE v0.9") is still caught by the pattern and can be validated for
// well-formedness, rather than silently failing to match at all.
// ---------------------------------------------------------------------------
const VERSION_TOKEN_PATTERNS = [
  [
    "cobre-version-banner",
    /\b(?:cobre|COBRE)\s+v([0-9][0-9.]*)/g,
    (m) => m[1].replace(/\.$/, ""),
  ],
  [
    "cobre-version-json",
    /"cobre_version"\s*:\s*"([^"]*)"/g,
    (m) => m[1],
  ],
];

const WELL_FORMED_VERSION = /^\d+\.\d+\.\d+$/;

// ---------------------------------------------------------------------------
// Split text into paragraph BLOCKS (contiguous non-blank lines), each with a
// joined single-space-separated string and a per-physical-line offset table,
// so a match found in the joined string can be attributed back to the
// physical line on which it starts. This is what lets a narration phrase
// split across a hard-wrapped line break still be detected (see module
// header) without losing line-number precision for well-behaved single-line
// hits (the common case).
// ---------------------------------------------------------------------------
function buildBlocks(text) {
  const rawLines = text.split("\n");
  const rawBlocks = [];
  let current = null;

  for (let i = 0; i < rawLines.length; i++) {
    const lineno = i + 1;
    if (rawLines[i].trim() === "") {
      if (current) {
        rawBlocks.push(current);
        current = null;
      }
      continue;
    }
    if (!current) current = { startLine: lineno, lines: [] };
    // Strip markdown bold markers ("**") before matching: a narration verb is
    // routinely wrapped for emphasis (e.g. "is **removed entirely** in the
    // vX.Y.Z restructure"), and the literal "**" between "entirely" and "in"
    // would otherwise break a `\s+`-only narration regex. Stripping (not
    // blanking to a space) keeps the surrounding words adjacent, which is
    // what the phrase actually reads as once rendered. Length changes are
    // harmless here — this gate reports whole-phrase text, not a fixed-width
    // character window (contrast check-doc-voice.mjs's 30-char hedge lookahead).
    current.lines.push(rawLines[i].replace(/\*\*/g, ""));
  }
  if (current) rawBlocks.push(current);

  return rawBlocks.map((b) => {
    let joined = "";
    const lineStarts = [];
    for (let k = 0; k < b.lines.length; k++) {
      lineStarts.push(joined.length);
      joined += b.lines[k];
      if (k < b.lines.length - 1) joined += " ";
    }
    return { startLine: b.startLine, joined, lineStarts };
  });
}

// Map a character offset within a block's joined text back to its physical
// line number.
function lineForOffset(block, offset) {
  let lineIdx = 0;
  for (let k = 0; k < block.lineStarts.length; k++) {
    if (block.lineStarts[k] <= offset) lineIdx = k;
    else break;
  }
  return block.startLine + lineIdx;
}

// ---------------------------------------------------------------------------
// Pure per-file detector (exported for the node:test fixture and for main()).
// Returns { lineno, rule, text } violations (allowlist NOT applied here).
// ---------------------------------------------------------------------------
export function detectVersionViolations(text, zone) {
  const violations = [];
  const blocks = buildBlocks(text);

  for (const block of blocks) {
    if (zone === ZONE_STRICT) {
      for (const [rule, pattern] of NARRATION_PATTERNS) {
        for (const m of block.joined.matchAll(pattern)) {
          violations.push({
            lineno: lineForOffset(block, m.index),
            rule,
            text: m[0].trim(),
          });
        }
      }
    }

    for (const [rule, pattern, extractVersion] of VERSION_TOKEN_PATTERNS) {
      for (const m of block.joined.matchAll(pattern)) {
        const lineno = lineForOffset(block, m.index);
        if (zone === ZONE_STRICT) {
          violations.push({ lineno, rule, text: m[0].trim() });
        } else {
          const versionValue = extractVersion(m);
          if (!WELL_FORMED_VERSION.test(versionValue)) {
            violations.push({
              lineno,
              rule: "malformed-version-string",
              text: `${m[0].trim()} (version token ${JSON.stringify(versionValue)} is not a well-formed X.Y.Z)`,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for parseAnchor/detectVersionViolations (the
// node:test fixture) does NOT trigger the filesystem walk or process.exit.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(claudeMdPath)) {
    console.error("check:version: CLAUDE.md not found at repo root.");
    process.exit(1);
  }
  let anchor;
  try {
    anchor = parseAnchor(readFileSync(claudeMdPath, "utf8"));
  } catch (error) {
    console.error(`check:version: ${error.message}`);
    process.exit(1);
  }

  if (!existsSync(contentRoot)) {
    console.error(
      "check:version: src/content/docs/ not found — run this from the repo root.",
    );
    process.exit(1);
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(allowlistPath);
  } catch (error) {
    console.error(`check:version: ${error.message}`);
    process.exit(1);
  }

  const relFiles = collectZonedSourceFiles(contentRoot).sort();
  const violations = [];

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

    for (const v of detectVersionViolations(text, zone)) {
      const allowlisted = isAllowlisted(allowlist, rel, v.lineno);
      violations.push({ rel, ...v, allowlisted });
    }
  }

  const failing = violations.filter((v) => !v.allowlisted);

  if (failing.length === 0) {
    const grandfathered = violations.length - failing.length;
    console.log(
      `OK: ${relFiles.length} files scanned; anchor is cobre v${anchor.version}; ` +
        `no NEW cobre-version violations found` +
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
    `FAIL: ${failing.length} version violation(s). The methodology corpus carries no ` +
      `cobre-version numbers/annotations outside the CLAUDE.md "Synced to" anchor (v${anchor.version}); ` +
      `a lenient-zone version string must be a well-formed X.Y.Z. Add a rationale to ` +
      `scripts/doc-lint-allow.txt for a pre-existing hit under editorial review.`,
  );
  process.exit(1);
}

const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
