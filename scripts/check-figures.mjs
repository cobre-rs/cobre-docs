// Figure-dependency gate (E4 ticket-020, the epic's Python-independence exit gate).
//
// E4 retooled all 7 referenced figures onto three browser-native renderers
// (Observable Plot, D2, mermaid) and dropped the 3 HPC figures, so the migrated
// corpus must no longer reference ANY retired matplotlib/Excalidraw SVG. This
// script is the durable, CI-bound guardrail that proves — mechanically and with
// no new dependency — that future content cannot silently re-introduce a
// Python/Excalidraw-built figure path. (The retired SVGs in `src/images/*.svg`
// and the `diagrams/` Python still physically exist by design; their deletion is
// E9/ticket-036, explicitly out of scope here. This gate checks the *content no
// longer references them*, not that the files are gone.)
//
// It walks every `*.md`/`*.mdx` under `src/content/docs/` (the migrated corpus
// only — NOT `diagrams/` or `src/images/`, which still exist until E9) and exits
// non-zero, with a per-file message naming the file + the offending substring +
// the rule violated, if it finds any of:
//   (a) an image-asset reference: `../../images/` or `/images/`  (a Python/
//       Excalidraw SVG would manifest here),
//   (b) a residual figure-deferral aside: `Figure — retooled in E4`  (the E3
//       placeholder that 017/018 were to replace),
//   (c) a reference to a retired figure stem: the nine matplotlib stems
//       (d02…d24) plus the Excalidraw `system-element-overview`.
//
// It then runs two scope-confirmation checks that encode E4's resolved scope and
// FAIL if violated (not just informational):
//   • the three HPC stems (d07/d08/d09) appear in ZERO content files — they were
//     never ported (scope: drop d07/d08/d09);
//   • a `ConvergencePlot` (the re-homed d21) figure IS present in
//     `math/stopping-rules` (scope: port + re-home d21).
//
// index.mdx is intentionally IN scope: it keeps the harness/D2/mermaid renderer
// DEMOS (a `ValueFunctionPlot` component import + fenced ```mermaid / ```d2
// blocks), none of which are retired-SVG references, so it passes the banned
// checks naturally — it is not special-cased. pt-br/ is excluded to mirror
// check-math-parity.mjs (a future locale; only the root English corpus is gated).
//
// Run any time (no build needed — it reads source content, not dist/). Exits 0
// with a one-line summary when clean; exits 1 listing each violation, or with a
// clear message if the content root is missing or a file cannot be read.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const contentRoot = fileURLToPath(
  new URL("../src/content/docs/", import.meta.url),
);

// --- Retired figure stems ---------------------------------------------------
// The exact hyphenated filename stems of the 10 retired assets (9 matplotlib +
// 1 Excalidraw), matched as full stems — NOT bare prefixes like `d02` or
// `system-element`. Matching the full stem avoids false positives against the
// legitimate `/math/system-elements` chapter slug (which appears in many prose
// cross-links) and against math/section tokens that merely start with `d` + digit.
const RETIRED_STEMS = [
  "d02-value-function",
  "d03-scenario-tree",
  "d07-hybrid-parallelism",
  "d08-memory-architecture",
  "d09-forward-pass-distribution",
  "d21-convergence-bounds",
  "d22-risk-measure-cvar",
  "d23-par-stored-vs-computed",
  "d24-lp-column-layout",
  "system-element-overview",
];

// The HPC subset that scope dropped (must appear in ZERO content files).
const HPC_STEMS = [
  "d07-hybrid-parallelism",
  "d08-memory-architecture",
  "d09-forward-pass-distribution",
];

// --- Pure detector (exported for the node:test fixture) ---------------------
// Given the text of a single content file, return an array of { rule, match }
// describing every banned-pattern occurrence. Pure and synchronous so it can be
// unit-tested without touching the filesystem (see check-figures.test.mjs).
export function detectFigureViolations(text) {
  const violations = [];

  // (a) Image-asset references. `../../images/` is the mdBook-era relative path;
  // `/images/` is its root-relative form. Either means a static SVG dependency.
  for (const needle of ["../../images/", "/images/"]) {
    let index = text.indexOf(needle);
    while (index !== -1) {
      // A genuine retired root ref (`](/images/…`, `"/images/…`) is preceded by a
      // markdown delimiter. Skip a bare `/images/` that merely continues a longer
      // path or an external URL (`https://host/images/…`, `/math/images/…`) — there
      // the char before `/images/` is an alphanumeric host/path char, not a ref.
      const prev = index > 0 ? text[index - 1] : "";
      const isPathContinuation = needle === "/images/" && /[A-Za-z0-9]/.test(prev);
      if (!isPathContinuation) {
        violations.push({
          rule: `image-asset reference ('${needle}' — retired Python/Excalidraw SVG path)`,
          match: extractContext(text, index, needle.length),
        });
      }
      index = text.indexOf(needle, index + needle.length);
    }
  }

  // (b) Residual figure-deferral aside (the E3 placeholder text). The em-dash
  // (—, U+2014) is part of the marker; match it literally.
  {
    const needle = "Figure — retooled in E4";
    let index = text.indexOf(needle);
    while (index !== -1) {
      violations.push({
        rule: "residual figure-deferral aside ('Figure — retooled in E4' — should have been replaced by 017/018)",
        match: extractContext(text, index, needle.length),
      });
      index = text.indexOf(needle, index + needle.length);
    }
  }

  // (c) Retired figure-stem references.
  for (const stem of RETIRED_STEMS) {
    let index = text.indexOf(stem);
    while (index !== -1) {
      violations.push({
        rule: `retired figure stem ('${stem}')`,
        match: extractContext(text, index, stem.length),
      });
      index = text.indexOf(stem, index + stem.length);
    }
  }

  return violations;
}

// Return the line containing the match at `index`, trimmed, so the error message
// points at the offending substring in context.
function extractContext(text, index, length) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  let lineEnd = text.indexOf("\n", index + length);
  if (lineEnd === -1) lineEnd = text.length;
  return text.slice(lineStart, lineEnd).trim();
}

// --- File walk --------------------------------------------------------------
// Recursively collect every .md/.mdx under src/content/docs/, excluding pt-br/
// (future locale; mirrors check-math-parity.mjs). index.mdx is intentionally
// INCLUDED (its renderer demos are not retired-SVG references — see header).
function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "pt-br") continue;
    // Skip underscore-prefixed entries (e.g. the math/_impl/_*.mdx interleave
    // partials): Starlight's docsLoader globs `**/[^_]*.{md,mdx}`, so these are
    // NOT routed pages — mirrors check-math-parity.mjs.
    if (entry.name.startsWith("_")) continue;
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
// Walk the corpus, collect violations + scope evidence, print, and exit. Kept
// behind a direct-run guard so importing this module for `detectFigureViolations`
// (the node:test fixture) does NOT trigger the walk or process.exit.
function main() {
  if (!existsSync(contentRoot)) {
    console.error(
      "check:figures: src/content/docs/ not found — run this from the `site/` package.",
    );
    process.exit(1);
  }

  const sourceFiles = collectSourceFiles(contentRoot).sort();
  const failures = [];

  // Track scope-confirmation evidence while walking.
  const hpcHits = []; // { rel, stem } — must stay empty
  let convergencePlotHost = null; // rel of the file embedding <ConvergencePlot ...

  for (const sourcePath of sourceFiles) {
    const rel = sourcePath.slice(contentRoot.length);

    let text;
    try {
      text = readFileSync(sourcePath, "utf8");
    } catch (error) {
      // Surface the unreadable path with a clear message — no bare catch.
      failures.push({
        rel,
        rule: `unreadable file (${error.code ?? error.name}: ${error.message})`,
        match: "(could not read file)",
      });
      continue;
    }

    for (const violation of detectFigureViolations(text)) {
      failures.push({ rel, ...violation });
    }

    // Scope evidence: record any HPC-stem hit (these are also caught above as
    // retired-stem violations; here we surface them specifically for the scope
    // assertion's message).
    for (const stem of HPC_STEMS) {
      if (text.includes(stem)) hpcHits.push({ rel, stem });
    }

    // Scope evidence: the re-homed d21 figure is a <ConvergencePlot ... embed in
    // math/stopping-rules. Match the embed tag (a usage, not just the import) so
    // a dangling import without a render does not satisfy the assertion.
    if (
      rel.replace(/\\/g, "/").startsWith("math/stopping-rules") &&
      /<ConvergencePlot[\s/>]/.test(text)
    ) {
      convergencePlotHost = rel;
    }
  }

  // --- Scope-confirmation assertions ----------------------------------------
  // These encode E4's resolved scope and FAIL the gate if violated.
  const scopeErrors = [];

  for (const hit of hpcHits) {
    scopeErrors.push(
      `scope: HPC figure stem '${hit.stem}' must appear in 0 content files but was found in ${hit.rel} (d07/d08/d09 were dropped, never ported).`,
    );
  }

  if (convergencePlotHost === null) {
    scopeErrors.push(
      "scope: expected a <ConvergencePlot /> embed (the re-homed d21 figure) in math/stopping-rules, but none was found.",
    );
  }

  // --- Report ---------------------------------------------------------------
  if (failures.length > 0 || scopeErrors.length > 0) {
    if (failures.length > 0) {
      console.error(
        `check:figures: ${failures.length} retired-figure reference(s) across ${sourceFiles.length} content file(s):\n`,
      );
      for (const f of failures) {
        console.error(
          `  ${f.rel}\n    rule:  ${f.rule}\n    found: ${f.match}\n`,
        );
      }
    }
    if (scopeErrors.length > 0) {
      console.error("check:figures: scope-confirmation assertion(s) failed:\n");
      for (const message of scopeErrors) {
        console.error(`  ${message}`);
      }
      console.error("");
    }
    process.exit(1);
  }

  console.log(
    `check:figures: ${sourceFiles.length} content files checked, 0 retired-figure references; ` +
      `d07/d08/d09 absent, ConvergencePlot (d21) present in ${convergencePlotHost}.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-figures.mjs`; stay inert when
// imported (the comparison holds because Node sets argv[1] to the entry script).
// `argv[1]` is absent when loaded via `node -e`/an importer with no entry file,
// so guard before pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
