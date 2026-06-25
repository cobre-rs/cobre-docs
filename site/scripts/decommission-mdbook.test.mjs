// Colocated unit fixture for the deferred decommission script (E9 ticket-036).
//
// decommission-mdbook.sh is the M4 removal phase, authored under the migration's
// author-files / defer-execution mode: it MUST be a guaranteed no-op against the
// current (pre-cutover) repo. This fixture pins the three safety-critical
// behaviours so a future edit cannot silently weaken them:
//
//   (a) the REMOVE and DO-NOT-DELETE allow-lists never share a path (the
//       permanent Starlight artifacts can never end up on the removal list);
//   (b) the default dry-run exits 0 and prints all 14 git-rm REMOVE targets
//       (the plan the reviewer reads), changing nothing;
//   (c) --execute with COBRE_CUTOVER_CONFIRMED=1 STILL exits non-zero pre-cutover,
//       naming the repo-state signal (deploy.yml still owns push:[main]) — the
//       guard is not satisfied by the env var alone.
//
// The arrays are parsed straight out of the shell source so the script stays the
// single source of truth (no duplicated lists to drift). Subprocesses use
// execFileSync(program, argsArray) — NEVER execSync with a shell string — per the
// project's subprocess-security convention (check-e10-gate.mjs, build-versions.mjs).
// node:test + node:assert/strict, picked up by the `scripts/*.test.mjs` glob in
// `npm test`. Zero new dependencies.

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Repo-root-relative path to the script, and the absolute path to read its source.
// site/ is one level up from site/scripts/; the repo root is two levels up.
const SCRIPT_REL = "scripts/decommission-mdbook.sh";
const siteDir = fileURLToPath(new URL("../", import.meta.url));
const scriptAbs = fileURLToPath(
  new URL("./decommission-mdbook.sh", import.meta.url),
);

// The 14 git-rm REMOVE targets the dry-run plan must enumerate (pinned by the
// ticket; the count is asserted so an accidental add/drop is caught).
const EXPECTED_REMOVE_TARGETS = [
  "book.toml",
  "src/SUMMARY.md",
  "src/introduction.md",
  "src/specs",
  "src/images",
  "theme",
  "mermaid.min.js",
  "mermaid-init.js",
  "Makefile",
  "diagrams",
  "pyproject.toml",
  "uv.lock",
  ".github/workflows/ci.yml",
  ".github/workflows/deploy.yml",
];

// ---------------------------------------------------------------------------
// Parse a `readonly NAME=( … )` bash array literal out of the script source.
// Returns the entries with surrounding double-quotes stripped, ignoring `#`
// comment lines inside the parentheses. Keeps the shell script as the single
// source of truth for both arrays (no duplicated lists in the test).
// ---------------------------------------------------------------------------
function parseBashArray(source, name) {
  const start = source.indexOf(`readonly ${name}=(`);
  assert.notEqual(start, -1, `array ${name} not found in script source`);
  const open = source.indexOf("(", start);
  const close = source.indexOf(")", open);
  assert.ok(close > open, `unterminated array ${name} in script source`);
  const body = source.slice(open + 1, close);
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.replace(/^"(.*)"$/, "$1"));
}

const scriptSource = readFileSync(scriptAbs, "utf8");
const removeArray = parseBashArray(scriptSource, "REMOVE_TARGETS");
const gitignoredArray = parseBashArray(scriptSource, "GITIGNORED_REMOVE");
const doNotDeleteArray = parseBashArray(scriptSource, "DO_NOT_DELETE");

// Run the script with execFileSync (args array, NO shell string). Returns
// { status, stdout, stderr }; never throws on a non-zero exit so a test can
// assert on the failing exit code + message. `env` is merged onto process.env.
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

// Run `--execute` inside a THROWAWAY git sandbox so the cutover guard is checked
// against a controlled (pre-cutover) repo state and --execute can NEVER mutate
// the real repository. CRITICAL: once the real repo's cutover commit lands, its
// guard PASSES, so running `--execute` against the real tree (cwd=siteDir) would
// perform the actual mdBook removal. The empty sandbox has no promoted
// starlight-deploy.yml, so the repo-state signal fails and the removal is refused.
// The script is invoked by ABSOLUTE path with cwd=sandbox so its REPO_ROOT
// (git rev-parse --show-toplevel) resolves to the sandbox. COBRE_CUTOVER_CONFIRMED
// is cleared first, then the test's env applied, so a caller-shell value can't leak.
function runExecuteInSandbox(env = {}) {
  const sandbox = mkdtempSync(join(tmpdir(), "decommission-guard-"));
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

// --- (a) REMOVE / DO-NOT-DELETE never overlap -------------------------------

test("the REMOVE and DO-NOT-DELETE arrays share no path", () => {
  const removable = new Set([...removeArray, ...gitignoredArray]);
  const overlap = doNotDeleteArray.filter((p) => removable.has(p));
  assert.deepEqual(
    overlap,
    [],
    `DO-NOT-DELETE paths must never appear in the REMOVE lists; overlap: ${overlap.join(", ")}`,
  );
});

test("no permanent Starlight artifact (site/, LICENSE, starlight-*.yml) appears in the REMOVE lists", () => {
  // A targeted spot-check of the highest-stakes DO-NOT-DELETE entries, beyond the
  // full set comparison above — these are the ones a careless glob would catch.
  const removable = new Set([...removeArray, ...gitignoredArray]);
  for (const guarded of [
    "site",
    "LICENSE",
    "LICENSE-docs",
    ".github/workflows/starlight-ci.yml",
    ".github/workflows/starlight-staging.yml",
    ".github/workflows/starlight-deploy.yml",
  ]) {
    assert.equal(
      removable.has(guarded),
      false,
      `${guarded} must never be a removal target`,
    );
    assert.ok(
      doNotDeleteArray.includes(guarded),
      `${guarded} must be on the DO-NOT-DELETE list`,
    );
  }
});

test("the script source contains no wildcard/glob removal target (explicit allow-list only)", () => {
  // A broad pattern (e.g. .github/workflows/*.yml) could clobber a DO-NOT-DELETE
  // path; every REMOVE entry must be a literal path with no glob metacharacter.
  for (const target of [...removeArray, ...gitignoredArray]) {
    assert.ok(
      !/[*?[\]]/.test(target),
      `REMOVE target '${target}' must not contain a glob metacharacter`,
    );
  }
});

// --- (b) dry-run exits 0 and lists all 14 REMOVE targets --------------------

test("dry-run (no flags) exits 0 and lists all 14 REMOVE targets", () => {
  const { status, stdout } = runScript([]);
  assert.equal(status, 0, "dry-run must exit 0");
  assert.equal(
    EXPECTED_REMOVE_TARGETS.length,
    14,
    "the ticket pins exactly 14 git-rm REMOVE targets",
  );
  for (const target of EXPECTED_REMOVE_TARGETS) {
    assert.ok(
      stdout.includes(target),
      `dry-run plan must list the REMOVE target '${target}'`,
    );
  }
  // The gitignored built output is part of the plan too.
  assert.ok(stdout.includes("book"), "dry-run plan must list the book/ target");
  // And it must announce it changed nothing.
  assert.match(stdout, /DRY-RUN/i, "dry-run must label its output as a dry run");
});

test("the parsed REMOVE_TARGETS array matches the 14 ticket-pinned paths exactly", () => {
  assert.deepEqual(
    removeArray,
    EXPECTED_REMOVE_TARGETS,
    "the script's REMOVE_TARGETS must equal the ticket allow-list (order + content)",
  );
});

// --- (c) --execute pre-cutover fails the repo-state guard -------------------

test("--execute with COBRE_CUTOVER_CONFIRMED=1 exits non-zero naming the repo-state signal", () => {
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
  // It must name the repo-state signal specifically (starlight-deploy not yet
  // promoted), NOT the env signal — proving env=1 alone does not satisfy the guard.
  assert.match(
    stderr,
    /starlight-deploy\.yml|deploy\.yml/,
    "stderr must name the failed workflow repo-state signal",
  );
});

test("--execute with no env var exits non-zero naming the COBRE_CUTOVER_CONFIRMED signal", () => {
  // Explicitly clear the env var (in case the runner has it set) to exercise the
  // env-signal branch deterministically.
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

// --- flag handling ----------------------------------------------------------

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
