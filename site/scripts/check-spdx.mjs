// SPDX licensing audit gate (E10 ticket-035, licensing.md checklist item 7).
//
// This is the durable, CI-bound guardrail that underwrites the "100% FOSS,
// freely redistributable" claim for the migrated Starlight site. The spot-check
// was performed by hand during refinement (every installed dependency is
// permissive; d2 + ELK are build-time-only weak copyleft with no output
// obligation; no E8 cutover blocker) — this script CODIFIES that verdict as an
// automated check so that any *future* copyleft / non-FOSS / unlicensed
// dependency added to the declared tree fails the gate mechanically.
//
// What it does (zero new npm deps — plain node: built-ins only):
//   - Reads the declared dependency set from site/package.json
//     (dependencies + devDependencies), mirroring gen-notices.mjs so the two
//     stay consistent.
//   - For each, reads node_modules/<pkg>/package.json `license` and classifies
//     its SPDX id against a PERMISSIVE allow-list. Missing node_modules/<pkg>
//     fails the gate naming the package (signals `npm ci` was not run).
//   - Classifies the two hard-coded non-npm extras d2 = MPL-2.0 and
//     ELK = EPL-2.0 SEPARATELY as `build-time-weak-copyleft` — an explicit
//     build-time-only exemption, deliberately NOT lumped into the permissive
//     allow-list so the weak-copyleft distinction stays visible in the table.
//   - Prints a fixed-width table: pkg, version, SPDX, classification
//     (permissive | build-time-weak-copyleft | BLOCKER).
//   - Exits 0 when every entry is permissive or exempt; exits non-zero naming
//     every BLOCKER (any GPL-* / AGPL-* / LGPL-* / proprietary / empty /
//     UNLICENSED id, or any SPDX id outside the allow-list and the exemption).
//
// SPDX expression handling (the `license` field may be an expression, not a
// bare id):
//   - `(A OR B)` (dual license) passes if ANY arm is allow-listed; the elected
//     arm is noted in the table.
//   - `A AND B` requires ALL arms to be allow-listed; any non-permissive arm is
//     a BLOCKER.
//
// Scope (deliberately narrow — this is a SPOT-CHECK, not an SBOM): the declared
// deps in package.json + the two named non-npm extras. A full transitive SBOM
// of the dependency closure is a separate future task per licensing.md caveats.
//
// Run any time (no build needed — reads package.json + node_modules metadata):
//   node scripts/check-spdx.mjs   |   npm run check:spdx
//
// The pure classifier (classifyLicense) is exported and unit-tested in
// check-spdx.test.mjs; main() is behind a direct-run guard so importing the
// module does not trigger the filesystem walk or process.exit.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Paths (resolved relative to this script so it can be run from any cwd, like
// gen-notices.mjs).
// ---------------------------------------------------------------------------
const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(scriptDir, "..");
const pkgJsonPath = join(siteRoot, "package.json");
const nodeModulesRoot = join(siteRoot, "node_modules");

// ---------------------------------------------------------------------------
// Permissive SPDX allow-list. A license id (or every arm of an AND-expression,
// or any arm of an OR-expression) must be in this set to classify as
// `permissive`. Kept as the single source of truth for the allow-list so the
// classifier and any caller agree.
// ---------------------------------------------------------------------------
export const PERMISSIVE_ALLOW_LIST = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "OFL-1.1",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "Unlicense",
  "CC0-1.0",
]);

// ---------------------------------------------------------------------------
// Build-time-only weak-copyleft exemption — the two non-npm extras used only at
// build time to produce static SVGs (no source/binary is bundled into the site
// output, so no MPL-2.0/EPL-2.0 obligation reaches visitors). These are the
// ONLY ids allowed outside the permissive allow-list, and they are tracked
// separately (classification `build-time-weak-copyleft`), never as `permissive`.
// ---------------------------------------------------------------------------
export const BUILD_TIME_WEAK_COPYLEFT = new Set(["MPL-2.0", "EPL-2.0"]);

// The two named non-npm extras with their known SPDX ids and roles, checked in
// addition to the package.json deps (they are not in node_modules to read).
const NON_NPM_EXTRAS = [
  { name: "d2", version: "0.7.1", spdx: "MPL-2.0" },
  { name: "ELK", version: "(bundled inside d2)", spdx: "EPL-2.0" },
];

// Classification labels (stable strings used in the table and the exit logic).
export const CLASS_PERMISSIVE = "permissive";
export const CLASS_WEAK_COPYLEFT = "build-time-weak-copyleft";
export const CLASS_BLOCKER = "BLOCKER";

// ---------------------------------------------------------------------------
// Normalise a package.json `license` field to a trimmed SPDX expression string.
//
// npm's canonical form is a string SPDX id/expression. Two legacy/edge forms
// must NOT crash the audit:
//   - the deprecated object form `{ type, url }` → use `.type`;
//   - the very old array form `[{ type }, ...]` → join the types with " AND "
//     (conservative: an array historically meant "all of these apply").
// Anything that resolves to an empty/whitespace string is treated as absent by
// the caller (→ BLOCKER); we never silently coerce an absent license to a pass.
// ---------------------------------------------------------------------------
export function normaliseLicenseField(license) {
  if (typeof license === "string") return license.trim();
  if (Array.isArray(license)) {
    return license
      .map((entry) =>
        typeof entry === "string" ? entry : (entry && entry.type) || "",
      )
      .filter(Boolean)
      .join(" AND ")
      .trim();
  }
  if (license && typeof license === "object" && typeof license.type === "string") {
    return license.type.trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// Pure SPDX classifier (exported for the node:test fixture).
//
// Input: a raw SPDX expression string (or "" / undefined for a missing field).
// Output: { classification, spdx, reason, electedArm? } where:
//   - classification ∈ { permissive | build-time-weak-copyleft | BLOCKER }
//   - spdx: the normalised expression echoed back for the table
//   - reason: a short human-readable explanation (always set)
//   - electedArm: for an OR-expression that passed, the allow-listed arm chosen
//
// Rules:
//   - empty / missing / UNLICENSED / NONE  → BLOCKER (an absent license is NOT
//     permissive).
//   - a bare id in BUILD_TIME_WEAK_COPYLEFT → build-time-weak-copyleft (the
//     d2/ELK exemption; expressions are not expected for these, but a bare id
//     matches).
//   - an OR-expression `(A OR B)`           → permissive if ANY arm is
//     allow-listed (electedArm = the first such arm); otherwise BLOCKER.
//   - an AND-expression `A AND B`           → permissive only if ALL arms are
//     allow-listed; otherwise BLOCKER.
//   - a bare id                              → permissive if allow-listed, else
//     BLOCKER.
//
// NB: mixed AND/OR with parenthesised sub-expressions beyond the simple flat
// `(A OR B)` / `A AND B` forms are not expected in this tree; the parser treats
// the whole expression by its dominant operator and is conservative (an
// unrecognised arm is non-permissive → BLOCKER), so it can never pass something
// it does not positively recognise as allow-listed.
// ---------------------------------------------------------------------------
export function classifyLicense(rawLicense) {
  const spdx = (rawLicense ?? "").trim();

  // Absent / explicitly unlicensed → BLOCKER. UNLICENSED is npm's marker for a
  // proprietary, non-redistributable package; NONE is a no-license marker.
  if (
    spdx === "" ||
    spdx.toUpperCase() === "UNLICENSED" ||
    spdx.toUpperCase() === "NONE"
  ) {
    return {
      classification: CLASS_BLOCKER,
      spdx: spdx === "" ? "(empty)" : spdx,
      reason:
        "missing/empty/UNLICENSED license field — an absent license is not permissive",
    };
  }

  // Strip surrounding/loose parentheses for tokenising. A simple flat
  // expression (the only shapes we expect) does not need nested-paren handling.
  const bare = spdx.replace(/[()]/g, " ").trim();

  // Build-time-only weak-copyleft exemption (bare id match: d2 = MPL-2.0,
  // ELK = EPL-2.0). Checked before the allow-list so it is classified distinctly.
  if (BUILD_TIME_WEAK_COPYLEFT.has(bare)) {
    return {
      classification: CLASS_WEAK_COPYLEFT,
      spdx,
      reason: "build-time-only weak copyleft (no obligation on site output)",
    };
  }

  // OR-expression: passes if ANY arm is allow-listed; note the elected arm.
  if (/\bOR\b/i.test(bare)) {
    const arms = bare.split(/\s+OR\s+/i).map((a) => a.trim()).filter(Boolean);
    const elected = arms.find((arm) => PERMISSIVE_ALLOW_LIST.has(arm));
    if (elected) {
      return {
        classification: CLASS_PERMISSIVE,
        spdx,
        electedArm: elected,
        reason: `dual-license OR — elected permissive arm '${elected}'`,
      };
    }
    return {
      classification: CLASS_BLOCKER,
      spdx,
      reason: `no permissive arm in OR-expression (arms: ${arms.join(", ")})`,
    };
  }

  // AND-expression: requires ALL arms allow-listed.
  if (/\bAND\b/i.test(bare)) {
    const arms = bare.split(/\s+AND\s+/i).map((a) => a.trim()).filter(Boolean);
    const offending = arms.filter((arm) => !PERMISSIVE_ALLOW_LIST.has(arm));
    if (offending.length === 0) {
      return {
        classification: CLASS_PERMISSIVE,
        spdx,
        reason: `all AND arms permissive (${arms.join(" AND ")})`,
      };
    }
    return {
      classification: CLASS_BLOCKER,
      spdx,
      reason: `non-permissive arm(s) in AND-expression: ${offending.join(", ")}`,
    };
  }

  // Bare id.
  if (PERMISSIVE_ALLOW_LIST.has(bare)) {
    return {
      classification: CLASS_PERMISSIVE,
      spdx,
      reason: "permissive SPDX id",
    };
  }

  return {
    classification: CLASS_BLOCKER,
    spdx,
    reason: `'${bare}' is not in the permissive allow-list or the build-time exemption`,
  };
}

// ---------------------------------------------------------------------------
// Read the declared dependency set from a package.json object, mirroring
// gen-notices.mjs (dependencies + devDependencies merged). Exported so a test
// could exercise it; kept tiny and pure.
// ---------------------------------------------------------------------------
export function readDeclaredDeps(pkgJson) {
  return {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
  };
}

// ---------------------------------------------------------------------------
// Audit one npm dependency: read node_modules/<pkg>/package.json, classify its
// license. Returns { name, version, spdx, classification, reason, electedArm? }.
// A missing node_modules/<pkg> dir or unreadable metadata is itself a failure
// (returned as a BLOCKER-class row with an explanatory reason) so the caller can
// print it in the table AND exit non-zero — the audit never silently skips a
// declared package.
// ---------------------------------------------------------------------------
function auditNpmDep(pkgName) {
  const pkgDir = join(nodeModulesRoot, pkgName);
  if (!existsSync(pkgDir)) {
    return {
      name: pkgName,
      version: "(not installed)",
      spdx: "(missing)",
      classification: CLASS_BLOCKER,
      reason: `node_modules/${pkgName} not found — run \`npm ci\` first`,
    };
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  } catch (err) {
    return {
      name: pkgName,
      version: "(unreadable)",
      spdx: "(unreadable)",
      classification: CLASS_BLOCKER,
      reason: `failed to read node_modules/${pkgName}/package.json: ${err.message}`,
    };
  }

  const normalised = normaliseLicenseField(meta.license);
  const result = classifyLicense(normalised);
  return {
    name: pkgName,
    version: meta.version ?? "(unknown)",
    spdx: result.spdx,
    classification: result.classification,
    reason: result.reason,
    electedArm: result.electedArm,
  };
}

// ---------------------------------------------------------------------------
// Render the audited rows as a fixed-width table (same column style as
// gen-notices.mjs' SPDX summary). Returns the table as a string.
// ---------------------------------------------------------------------------
function renderTable(rows) {
  const widths = {
    name: Math.max(7, ...rows.map((r) => r.name.length)),
    version: Math.max(7, ...rows.map((r) => String(r.version).length)),
    spdx: Math.max(4, ...rows.map((r) => String(r.spdx).length)),
    cls: Math.max(14, ...rows.map((r) => r.classification.length)),
  };
  const pad = (s, n) => String(s).padEnd(n);
  const header =
    `${pad("Package", widths.name)}  ${pad("Version", widths.version)}  ` +
    `${pad("SPDX", widths.spdx)}  Classification`;
  const lines = [header, "-".repeat(header.length)];
  for (const r of rows) {
    const note = r.electedArm ? `  (elected ${r.electedArm})` : "";
    lines.push(
      `${pad(r.name, widths.name)}  ${pad(r.version, widths.version)}  ` +
        `${pad(r.spdx, widths.spdx)}  ${pad(r.classification, widths.cls)}${note}`,
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main (run only when invoked directly). Kept behind a direct-run guard so
// importing this module for classifyLicense (the node:test fixture) does NOT
// trigger the filesystem reads or process.exit.
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(pkgJsonPath)) {
    console.error(
      "check:spdx: site/package.json not found — run this from the `site/` package.",
    );
    process.exit(1);
  }

  let pkgJson;
  try {
    pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  } catch (err) {
    console.error(`check:spdx: failed to read site/package.json: ${err.message}`);
    process.exit(1);
  }

  const declaredDeps = readDeclaredDeps(pkgJson);
  const depNames = Object.keys(declaredDeps).sort((a, b) => a.localeCompare(b));

  // Audit every declared npm dependency, then append the two non-npm extras.
  const rows = depNames.map(auditNpmDep);
  for (const extra of NON_NPM_EXTRAS) {
    const result = classifyLicense(extra.spdx);
    rows.push({
      name: extra.name,
      version: extra.version,
      spdx: result.spdx,
      classification: result.classification,
      reason: result.reason,
      electedArm: result.electedArm,
    });
  }

  // Print the table.
  console.log(renderTable(rows));
  console.log("");

  // Collect blockers (anything not permissive and not the build-time exemption).
  const blockers = rows.filter((r) => r.classification === CLASS_BLOCKER);

  if (blockers.length > 0) {
    console.error(
      `check:spdx: ${blockers.length} licensing BLOCKER(s) — the "100% FOSS, ` +
        `freely redistributable" claim does NOT hold; E8 cutover gate is blocked:\n`,
    );
    for (const b of blockers) {
      console.error(`  ${b.name} @ ${b.version}\n    SPDX:   ${b.spdx}\n    why:    ${b.reason}\n`);
    }
    process.exit(1);
  }

  const permissive = rows.filter((r) => r.classification === CLASS_PERMISSIVE).length;
  const exempt = rows.filter((r) => r.classification === CLASS_WEAK_COPYLEFT).length;
  console.log(
    `check:spdx: ${rows.length} entries audited — ${permissive} permissive, ` +
      `${exempt} build-time-weak-copyleft (d2/ELK), 0 blockers. ` +
      `FOSS claim holds; no E8 blocker.`,
  );
  process.exit(0);
}

// Run when executed as `node scripts/check-spdx.mjs`; stay inert when imported
// (the comparison holds because Node sets argv[1] to the entry script). argv[1]
// is absent under `node -e`/an importer with no entry file, so guard before
// pathToFileURL — an import context is never a direct run.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  main();
}
