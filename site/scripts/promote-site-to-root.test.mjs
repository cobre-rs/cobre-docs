// Colocated unit fixture for the deferred promotion machinery (E9 ticket-037).
//
// promote-site-to-root.sh is the M4 promotion phase, authored under the
// migration's author-files / defer-execution mode: it MUST be a guaranteed no-op
// against the current (pre-cutover, pre-removal) repo. This fixture pins the
// safety-critical + completeness behaviours so a future edit cannot silently
// weaken them:
//
//   (a) the dry-run exits 0, labels itself a dry run, and lists EVERY tracked
//       top-level site/ entry in its `git mv` plan (including the dotfile
//       .gitignore) — the plan the reviewer reads, changing nothing;
//   (b) the script's REWRITE_MAP enumerates the COMPLETE verified `site/`-prefix
//       inventory (the three working-directory removals, the three
//       cache-dependency-path swaps, the two path: site/dist swaps, the
//       load-bearing build-versions.mjs --root rewrite, and the .gitignore
//       merge) — count + exact tokens;
//   (c) --execute pre-cutover STILL exits non-zero, naming the failed cutover
//       signal (the guard is not satisfied by the env var alone) — proving the
//       deferred move cannot run today;
//   (d) the companion apply-promotion-rewrites.mjs exports a TOKEN_REWRITES map
//       + .gitignore merge descriptors that match the same inventory (so the
//       bash map and the Node applier never drift).
//
// Subprocesses use execFileSync(program, argsArray) — NEVER execSync with a
// shell string — per the project's subprocess-security convention
// (build-versions.mjs, check-e10-gate.mjs, decommission-mdbook.test.mjs).
// node:test + node:assert/strict, picked up by the `scripts/*.test.mjs` glob in
// `npm test`. Zero new dependencies.

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TOKEN_REWRITES,
  GITIGNORE_FILE,
  ASTRO_IGNORE_GLOBS,
  PRESERVED_GLOBS,
} from "./apply-promotion-rewrites.mjs";

// Repo-root-relative path to the script (for execFileSync cwd=siteDir), and the
// absolute path to read its source. site/ is one level up from site/scripts/;
// the repo root is two levels up.
const SCRIPT_REL = "scripts/promote-site-to-root.sh";
const siteDir = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const scriptAbs = fileURLToPath(
  new URL("./promote-site-to-root.sh", import.meta.url),
);

const scriptSource = readFileSync(scriptAbs, "utf8");

// ---------------------------------------------------------------------------
// Run the script with execFileSync (args array, NO shell string). Returns
// { status, stdout, stderr }; never throws on a non-zero exit so a test can
// assert on the failing exit code + message. `env` is merged onto process.env.
// ---------------------------------------------------------------------------
function runScript(args = [], env = {}) {
  try {
    const stdout = execFileSync("bash", [SCRIPT_REL, ...args], {
      cwd: siteDir,
      env: { ...process.env, ...env },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      status: typeof err.status === "number" ? err.status : 1,
      stdout: err.stdout ? err.stdout.toString() : "",
      stderr: err.stderr ? err.stderr.toString() : "",
    };
  }
}

// ---------------------------------------------------------------------------
// Run `--execute` inside a THROWAWAY git sandbox so the cutover guard is checked
// against a controlled (pre-cutover) repo state and --execute can NEVER mutate
// the real repository. CRITICAL: once the real repo's cutover commit lands, its
// guard PASSES, so running `--execute` against the real tree (cwd=siteDir) would
// perform the actual promotion. The empty sandbox has no promoted
// starlight-deploy.yml, so the repo-state signal fails and the move is refused.
// The script is invoked by ABSOLUTE path with cwd=sandbox, so its REPO_ROOT
// (git rev-parse --show-toplevel) resolves to the sandbox. COBRE_CUTOVER_CONFIRMED
// is cleared first, then the test's env applied, so a caller-shell value can't leak.
function runExecuteInSandbox(env = {}) {
  const sandbox = mkdtempSync(join(tmpdir(), "promote-guard-"));
  const childEnv = { ...process.env };
  delete childEnv.COBRE_CUTOVER_CONFIRMED;
  Object.assign(childEnv, env);
  try {
    execFileSync("git", ["init", "-q"], { cwd: sandbox });
    const stdout = execFileSync("bash", [scriptAbs, "--execute"], {
      cwd: sandbox,
      env: childEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      status: typeof err.status === "number" ? err.status : 1,
      stdout: err.stdout ? err.stdout.toString() : "",
      stderr: err.stderr ? err.stderr.toString() : "",
    };
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Parse the `readonly REWRITE_MAP=( … )` bash array out of the script source so
// the shell script stays the single source of truth (no duplicated map in the
// test). Each element is a `file|anchor|old|new|note` quoted string; we strip
// the surrounding double-quotes and the leading `#`-comment lines.
// ---------------------------------------------------------------------------
function parseRewriteMap(source) {
  const start = source.indexOf("readonly REWRITE_MAP=(");
  assert.notEqual(start, -1, "REWRITE_MAP array not found in script source");
  const open = source.indexOf("(", start);
  // The map values contain '(' and ')' (e.g. "(root is the Astro project)"),
  // so find the array's closing paren as the first ")" that begins a line.
  const closeRel = source.slice(open + 1).search(/\n\)/);
  assert.ok(closeRel !== -1, "unterminated REWRITE_MAP array in script source");
  const body = source.slice(open + 1, open + 1 + closeRel);
  // Unescape the bash double-quote escapes (\$ \` \" \\) so a parsed token equals
  // the value bash stores at runtime (e.g. the build-versions.mjs entry encodes
  // `\${v.slug}` in source, which bash reads as the literal `${v.slug}`).
  const unescape = (s) => s.replace(/\\([$`"\\])/g, "$1");
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.replace(/^"(.*)"$/, "$1"))
    .map((entry) => {
      const [file, anchor, oldToken, newToken, ...noteParts] = entry
        .split("|")
        .map(unescape);
      return { file, anchor, oldToken, newToken, note: noteParts.join("|") };
    });
}

const rewriteMap = parseRewriteMap(scriptSource);

// The complete, grep-verified `site/`-prefix inventory (2026-06-25). The bash
// REWRITE_MAP must contain a token-swap entry for each of these (the .gitignore
// MERGE is asserted separately as a <MERGE> entry).
const EXPECTED_TOKEN_SWAPS = [
  // file, old, new
  [".github/workflows/starlight-ci.yml", "working-directory: site", "working-directory: ."],
  [".github/workflows/starlight-ci.yml", "site/package-lock.json", "package-lock.json"],
  [".github/workflows/starlight-staging.yml", "working-directory: site", "working-directory: ."],
  [".github/workflows/starlight-staging.yml", "site/package-lock.json", "package-lock.json"],
  [".github/workflows/starlight-staging.yml", "path: site/dist", "path: dist"],
  [".github/workflows/starlight-deploy.yml", "working-directory: site", "working-directory: ."],
  [".github/workflows/starlight-deploy.yml", "site/package-lock.json", "package-lock.json"],
  [".github/workflows/starlight-deploy.yml", "path: site/dist", "path: dist"],
  [".github/workflows/starlight-deploy.yml", "site/astro.config.mjs", "astro.config.mjs"],
];

// ---------------------------------------------------------------------------
// (a) dry-run exits 0, labels itself, and lists every tracked top-level entry
// ---------------------------------------------------------------------------

// The tracked top-level site/ entries the `git mv` plan must enumerate. Derived
// from `git ls-files site/` so the test does not hard-code a list that could
// drift; the explicit-membership assertions below pin the dotfile + the dirs.
function trackedTopLevelEntries() {
  const out = execFileSync("git", ["ls-files", "--", "site/"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const set = new Set(
    out
      .split("\n")
      .filter((l) => l.startsWith("site/"))
      .map((l) => l.slice("site/".length).split("/")[0])
      .filter((e) => e.length > 0),
  );
  return [...set].sort();
}

test("dry-run (no flags) exits 0, labels itself a dry run, and changes nothing", () => {
  const { status, stdout } = runScript([]);
  assert.equal(status, 0, "dry-run must exit 0");
  assert.match(stdout, /DRY-RUN/i, "dry-run must label its output as a dry run");
  assert.match(
    stdout,
    /this was a dry run; nothing was moved/i,
    "dry-run must state it changed nothing",
  );
});

test("dry-run lists a `git mv` line for every tracked top-level site/ entry (incl. .gitignore)", () => {
  const { status, stdout } = runScript([]);
  assert.equal(status, 0, "dry-run must exit 0");
  const entries = trackedTopLevelEntries();
  assert.ok(
    entries.includes(".gitignore"),
    "the tracked dotfile site/.gitignore must be in the move set",
  );
  for (const entry of entries) {
    assert.ok(
      stdout.includes(`git mv  site/${entry}`),
      `dry-run plan must list a 'git mv site/${entry}' line`,
    );
  }
});

test("dry-run annotates .gitignore as merge-superseded (Option A: merged, not moved)", () => {
  // A root .gitignore survives ticket-036 (it carries plans/ + .playwright-mcp/),
  // so site/.gitignore is merged into it, NOT git mv'd. The plan must list
  // .gitignore for inventory completeness but mark it superseded by the MERGE so
  // a reviewer is not misled into expecting a clobbering move.
  const { stdout } = runScript([]);
  const giLine = stdout
    .split("\n")
    .find((l) => l.includes("git mv  site/.gitignore"));
  assert.ok(giLine, "the plan must list a site/.gitignore line");
  assert.match(
    giLine,
    /superseded by .gitignore MERGE/i,
    "the site/.gitignore plan line must be annotated as superseded by the MERGE",
  );
});

test("dry-run names the untracked dirs it intentionally does NOT move", () => {
  const { stdout } = runScript([]);
  for (const skip of ["node_modules", "dist", ".astro", "public/d2"]) {
    assert.ok(
      stdout.includes(`site/${skip}`),
      `dry-run must record skipping the untracked site/${skip}`,
    );
  }
});

// ---------------------------------------------------------------------------
// (b) the bash REWRITE_MAP enumerates the complete inventory
// ---------------------------------------------------------------------------

test("the script's REWRITE_MAP contains every token-swap in the verified inventory (exact tokens)", () => {
  for (const [file, oldToken, newToken] of EXPECTED_TOKEN_SWAPS) {
    const hit = rewriteMap.find(
      (e) => e.file === file && e.oldToken === oldToken && e.newToken === newToken,
    );
    assert.ok(
      hit,
      `REWRITE_MAP must contain ${file}: '${oldToken}' -> '${newToken}'`,
    );
  }
});

test("the script's REWRITE_MAP contains the load-bearing build-versions.mjs --root rewrite", () => {
  const hit = rewriteMap.find(
    (e) =>
      e.file === "site/build-versions.mjs" &&
      e.oldToken === ".src-${v.slug}/site" &&
      e.newToken === ".src-${v.slug}",
  );
  assert.ok(
    hit,
    "REWRITE_MAP must contain the functional build-versions.mjs '.src-${v.slug}/site' -> '.src-${v.slug}' rewrite",
  );
});

test("the script's REWRITE_MAP contains the root .gitignore MERGE entry", () => {
  const hit = rewriteMap.find(
    (e) => e.file === ".gitignore" && e.anchor === "<MERGE>",
  );
  assert.ok(hit, "REWRITE_MAP must contain a .gitignore <MERGE> entry");
  // The merge note must name the surviving ignores so a careless edit that drops
  // them is caught.
  assert.match(
    `${hit.oldToken} ${hit.newToken}`,
    /plans\//,
    "the .gitignore merge must preserve the plans/ ignore",
  );
  assert.match(
    `${hit.oldToken} ${hit.newToken}`,
    /\.playwright-mcp\//,
    "the .gitignore merge must preserve the .playwright-mcp/ ignore",
  );
});

test("the REWRITE_MAP has exactly the expected number of entries (9 swaps + 3 build-versions + 1 merge = 13)", () => {
  // 9 workflow/TODO token swaps + 3 build-versions.mjs lines (1 functional + 2
  // comment) + 1 .gitignore merge. A drifting count flags an accidental add/drop.
  assert.equal(
    rewriteMap.length,
    13,
    `expected 13 REWRITE_MAP entries, found ${rewriteMap.length}`,
  );
});

// ---------------------------------------------------------------------------
// (c) --execute pre-cutover fails the cutover guard (deferred: cannot run today)
// ---------------------------------------------------------------------------

test("--execute with COBRE_CUTOVER_CONFIRMED=1 exits non-zero naming the cutover repo-state signal", () => {
  const { status, stderr } = runExecuteInSandbox({
    COBRE_CUTOVER_CONFIRMED: "1",
  });
  assert.notEqual(
    status,
    0,
    "--execute must fail without the cutover repo-state signal, even with the env set",
  );
  assert.match(
    stderr,
    /cutover guard FAILED/i,
    "stderr must report the cutover guard failure",
  );
  assert.match(
    stderr,
    /starlight-deploy\.yml|deploy\.yml/,
    "stderr must name the failed workflow repo-state signal",
  );
});

test("--execute with no env var exits non-zero naming the COBRE_CUTOVER_CONFIRMED signal", () => {
  const env = { ...process.env };
  delete env.COBRE_CUTOVER_CONFIRMED;
  let status;
  let stderr = "";
  try {
    execFileSync("bash", [SCRIPT_REL, "--execute"], {
      cwd: siteDir,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    status = 0;
  } catch (err) {
    status = typeof err.status === "number" ? err.status : 1;
    stderr = err.stderr ? err.stderr.toString() : "";
  }
  assert.notEqual(status, 0, "--execute must fail when the env signal is unset");
  assert.match(
    stderr,
    /COBRE_CUTOVER_CONFIRMED/,
    "stderr must name the missing env signal",
  );
});

// ---------------------------------------------------------------------------
// flag handling (mirrors decommission-mdbook.test.mjs)
// ---------------------------------------------------------------------------

test("--help exits 0 and prints usage", () => {
  const { status, stdout } = runScript(["--help"]);
  assert.equal(status, 0, "--help must exit 0");
  assert.match(stdout, /USAGE/i, "--help must print usage");
});

test("an unknown flag exits non-zero and prints usage to stderr", () => {
  const { status, stdout, stderr } = runScript(["--bogus"]);
  assert.notEqual(status, 0, "an unknown flag must exit non-zero");
  assert.equal(stdout, "", "usage for a bad flag must go to stderr, not stdout");
  assert.match(stderr, /unknown argument/i, "stderr must name the unknown flag");
});

// ---------------------------------------------------------------------------
// (d) the Node applier's exported descriptors match the same inventory
// ---------------------------------------------------------------------------

test("apply-promotion-rewrites.mjs TOKEN_REWRITES covers every inventory token-swap", () => {
  for (const [file, oldToken, newToken] of EXPECTED_TOKEN_SWAPS) {
    const hit = TOKEN_REWRITES.find(
      (e) => e.file === file && e.oldToken === oldToken && e.newToken === newToken,
    );
    assert.ok(
      hit,
      `TOKEN_REWRITES must contain ${file}: '${oldToken}' -> '${newToken}'`,
    );
  }
});

test("apply-promotion-rewrites.mjs TOKEN_REWRITES targets the POST-move build-versions.mjs path (root, not site/)", () => {
  const functional = TOKEN_REWRITES.find(
    (e) =>
      e.file === "build-versions.mjs" &&
      e.oldToken === ".src-${v.slug}/site" &&
      e.newToken === ".src-${v.slug}",
  );
  assert.ok(
    functional,
    "TOKEN_REWRITES must rewrite root build-versions.mjs '.src-${v.slug}/site' -> '.src-${v.slug}'",
  );
  // Post-promotion, the file is at the repo root — NOT site/build-versions.mjs.
  for (const e of TOKEN_REWRITES) {
    assert.ok(
      !e.file.startsWith("site/"),
      `TOKEN_REWRITES file '${e.file}' must be a post-move (root) path, not site/-prefixed`,
    );
  }
});

test("apply-promotion-rewrites.mjs .gitignore merge adds the Astro globs and preserves the survivors", () => {
  assert.equal(GITIGNORE_FILE, ".gitignore");
  for (const glob of ["dist/", ".dist-*", ".src-*", ".astro/", "public/d2/", "node_modules/"]) {
    assert.ok(
      ASTRO_IGNORE_GLOBS.includes(glob),
      `ASTRO_IGNORE_GLOBS must include '${glob}'`,
    );
  }
  for (const glob of ["plans/", ".playwright-mcp/"]) {
    assert.ok(
      PRESERVED_GLOBS.includes(glob),
      `PRESERVED_GLOBS must include the surviving '${glob}' ignore`,
    );
  }
});
