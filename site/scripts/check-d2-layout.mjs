// D2 layout guard (E10 ticket-032, licensing.md checklist item 3).
//
// The d2 diagram engine (MPL-2.0) is invoked at build time by astro-d2 to render
// ```d2 fenced blocks to inline SVG. D2 ships three layout engines: dagre
// (default), ELK (Eclipse Layout Kernel, EPL-2.0), and TALA (Terrastruct's
// PROPRIETARY, paid engine). An UNLICENSED TALA run WATERMARKS its output. The
// licensing checklist requires confirming D2 uses ELK and NEVER TALA — both as a
// licensing safeguard (no proprietary engine, no watermark) and because the
// narrow-column docs layout was tuned for ELK.
//
// E1 (ticket-003) already set `layout: "elk"` in astro.config.mjs; this script is
// the durable, CI-bound regression guard that proves — mechanically and with no
// new dependency — that the invariant holds and a future edit cannot silently
// flip to TALA, either in the global astro-d2 config or in a per-block D2 layout
// directive (D2 supports per-diagram overrides, the residual risk).
//
// It performs two checks and exits non-zero (naming the offending file) on any
// violation:
//   (1) astro.config.mjs: MUST contain an explicit `layout: "elk"` astro-d2
//       assignment, and MUST NOT contain a `layout: tala` token. A MISSING
//       layout key also fails — without it astro-d2 falls back to its dagre
//       default, so we assert the explicit `elk` rather than silence.
//   (2) every ```d2 fenced block under src/: MUST NOT contain a `layout: tala`
//       directive.
//
// The match is scoped to a `layout:` assignment context (`/layout:\s*["']?tala/i`)
// — NOT the bare substring `tala` — so it never false-positives on prose words
// ("metadata", "tally") or on astro.config.mjs's own warning COMMENT, which reads
// `never "tala"` (the word `layout` there is not followed by a colon, so the
// comment is not a layout assignment and is correctly ignored).
//
// Run any time (no build needed — it reads source content, not dist/). Exits 0
// with a one-line confirmation when clean; exits 1 listing each violation, or
// with a clear message if a required file/dir is missing or unreadable.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const configPath = fileURLToPath(new URL("../astro.config.mjs", import.meta.url));
const srcRoot = fileURLToPath(new URL("../src/", import.meta.url));

// --- Layout-token regexes ---------------------------------------------------
// A `layout:` assignment whose value is `tala` (optionally quoted), case-
// insensitive (TALA / Tala / tala), with a trailing word boundary so a longer
// token that merely starts with "tala" is not matched. This is the BANNED
// pattern, scoped to an assignment so prose / comments containing the bare word
// "tala" do not trip it.
const TALA_LAYOUT = /layout:\s*["']?tala\b/i;

// The REQUIRED astro-d2 assignment: `layout: "elk"` (quoted, as in the config).
// Matched literally (quotes required) so a stray `layout: elk` comment without
// quotes would NOT satisfy the invariant — the shipped config uses quotes.
const ELK_LAYOUT = /layout:\s*["']elk["']/;

// --- Pure detectors (exported for the node:test fixture) --------------------
// Both are pure and synchronous so they can be unit-tested without touching the
// filesystem (see check-d2-layout.test.mjs).

// Inspect the text of astro.config.mjs. Return an array of violation strings
// (empty == clean): fails if the explicit `layout: "elk"` assignment is absent
// (missing or non-elk), and fails if any `layout: tala` token is present.
export function detectConfigViolations(text) {
  const violations = [];

  if (TALA_LAYOUT.test(text)) {
    violations.push(
      "astro.config.mjs sets a `layout: tala` astro-d2 token — TALA is the proprietary engine and watermarks unlicensed output; it must be `layout: \"elk\"`.",
    );
  }

  if (!ELK_LAYOUT.test(text)) {
    violations.push(
      "astro.config.mjs is missing the explicit `layout: \"elk\"` astro-d2 assignment — without it astro-d2 falls back to its default layout engine; set `layout: \"elk\"`.",
    );
  }

  return violations;
}

// Given the text of one content file, return an array of { block, match }
// describing every ```d2 fenced block that carries a `layout: tala` directive.
// Extracts d2 blocks by their fence markers; only the block bodies are scanned,
// so a `layout: tala` appearing in surrounding prose (not inside a d2 block) is
// out of scope here (the config check owns the astro-d2 layout; per-block TALA is
// the only in-content hazard).
export function detectD2BlockViolations(text) {
  const violations = [];
  // Match ```d2 … ``` blocks. The opening fence is ```d2 optionally followed by
  // trailing chars on the same line (astro-d2 has no info-string args today, but
  // tolerate them); the body is everything up to the next closing ``` fence.
  const fence = /```d2[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(text)) !== null) {
    const body = m[1];
    if (TALA_LAYOUT.test(body)) {
      violations.push({
        block: extractTalaLine(body),
        match: "layout: tala directive inside a ```d2 fenced block",
      });
    }
  }
  return violations;
}

// Return the trimmed line within a d2 block body that carries the tala directive,
// so the error message points at the offending line.
function extractTalaLine(body) {
  for (const line of body.split("\n")) {
    if (TALA_LAYOUT.test(line)) return line.trim();
  }
  return body.trim().split("\n")[0] ?? "(d2 block)";
}

// --- File walk --------------------------------------------------------------
// Recursively collect every .md/.mdx under src/. (No locale exclusion: TALA is a
// hard licensing hazard, so EVERY content file — including any future pt-br/ —
// must be covered.)
function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(`${full}/`));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// --- Main (run only when invoked directly, not when imported by a test) ------
function main() {
  const failures = [];

  // (1) astro.config.mjs check.
  if (!existsSync(configPath)) {
    console.error(
      "check:d2: astro.config.mjs not found — run this from the `site/` package.",
    );
    process.exit(1);
  }
  let configText;
  try {
    configText = readFileSync(configPath, "utf8");
  } catch (error) {
    console.error(
      `check:d2: could not read astro.config.mjs (${error.code ?? error.name}: ${error.message}).`,
    );
    process.exit(1);
  }
  for (const violation of detectConfigViolations(configText)) {
    failures.push({ rel: "astro.config.mjs", rule: violation });
  }

  // (2) ```d2 fenced-block check across src/.
  if (!existsSync(srcRoot)) {
    console.error(
      "check:d2: src/ not found — run this from the `site/` package.",
    );
    process.exit(1);
  }
  const sourceFiles = collectSourceFiles(srcRoot).sort();
  let d2BlockCount = 0;
  for (const sourcePath of sourceFiles) {
    const rel = sourcePath.slice(srcRoot.length);
    let text;
    try {
      text = readFileSync(sourcePath, "utf8");
    } catch (error) {
      failures.push({
        rel,
        rule: `unreadable file (${error.code ?? error.name}: ${error.message})`,
      });
      continue;
    }
    // Count d2 blocks for the clean-run summary.
    d2BlockCount += (text.match(/```d2[^\n]*\n/g) ?? []).length;
    for (const violation of detectD2BlockViolations(text)) {
      failures.push({
        rel,
        rule: `${violation.match}: ${violation.block}`,
      });
    }
  }

  // --- Report ---------------------------------------------------------------
  if (failures.length > 0) {
    console.error(
      `check:d2: ${failures.length} TALA layout violation(s) — D2 must use ELK, never the proprietary TALA engine:\n`,
    );
    for (const f of failures) {
      console.error(`  ${f.rel}\n    ${f.rule}\n`);
    }
    process.exit(1);
  }

  console.log(
    `check:d2: no tala layout anywhere; astro.config.mjs sets layout: "elk"; ` +
      `${d2BlockCount} d2 block(s) across ${sourceFiles.length} content file(s) clean.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-d2-layout.mjs`; stay inert when
// imported (matches check-figures.mjs's direct-run guard). argv[1] is absent
// under `node -e`/an importer with no entry file, so guard before pathToFileURL.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
