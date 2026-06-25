// apply-promotion-rewrites.mjs — the path-rewrite half of the deferred site/ →
// repo-root promotion (E9 / M4, ticket-037). Invoked by promote-site-to-root.sh
// AFTER its two guards pass and AFTER the tracked site/ tree has been `git mv`-d
// to the repo root. Authored under the migration's author-files / defer-execution
// mode: it is NEVER run today (the bash guards block --execute pre-cutover), and
// it changes nothing unless invoked with --execute.
//
// Why a Node helper instead of sed-in-bash: two of the rewrites are too fiddly
// for a safe in-shell sed —
//   (1) build-versions.mjs's `.src-${v.slug}/site` token is full of regex/shell
//       metacharacters (`[ ] " $ { } / ` backtick); a plain literal string
//       replace here is exact and escaping-free.
//   (2) the root .gitignore change is a MERGE (add the Astro ignores, preserve
//       the surviving plans/ + .playwright-mcp/ lines), not a token swap.
// The rewrites are SURGICAL: each YAML edit is scoped to the single line carrying
// a unique anchor, so the workflows' explanatory `site/` prose is never touched.
//
// Subprocess convention (none needed here, but stated for parity with the repo's
// security rule): if this helper ever shells out, use execFileSync(program,
// argsArray) — NEVER execSync with a shell string (build-versions.mjs,
// check-e10-gate.mjs).
//
// USAGE:
//   node apply-promotion-rewrites.mjs            Dry-run: print the rewrite plan, change nothing, exit 0.
//   node apply-promotion-rewrites.mjs --execute  Apply the rewrites (post-move only).
//   node apply-promotion-rewrites.mjs --help     Show usage.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Repo root is two levels up from site/scripts/ TODAY, but this helper runs AFTER
// the promotion has moved scripts/ to the repo root, so it is one level up at
// run time. Resolve defensively: walk up until a .git entry is found.
import { dirname, join } from "node:path";

function findRepoRoot(startDir) {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      // No .git found (e.g. a tarball checkout). Fall back to the dir two levels
      // up from this file (its pre-promotion location), which is the safest guess.
      return dirname(dirname(fileURLToPath(new URL("./", import.meta.url))));
    }
    dir = parent;
  }
}

const SCRIPT_DIR = fileURLToPath(new URL("./", import.meta.url));
const REPO_ROOT = findRepoRoot(SCRIPT_DIR);
const RUNBOOK_REL =
  "plans/starlight-migration/epic-09-decommission/decommission-runbook.md";

// ---------------------------------------------------------------------------
// Token rewrites — surgical, anchor-scoped replacements. Each entry:
//   { file, anchor, oldToken, newToken, note }
// `anchor` is a line-unique substring; only the FIRST line containing it is
// edited, and only its first oldToken → newToken. This is the complete, grep-
// verified inventory (2026-06-25) of files that hard-code the `site/` prefix,
// EXCLUDING the .gitignore merge (handled separately below).
//
// NB the load-bearing entry: build-versions.mjs's worktree build root
// `.src-${v.slug}/site` → `.src-${v.slug}`. A missed rewrite silently breaks
// tagged-release builds after promotion (the worktree IS the Astro root then).
// ---------------------------------------------------------------------------
const TOKEN_REWRITES = [
  // (1) starlight-ci.yml
  {
    file: ".github/workflows/starlight-ci.yml",
    anchor: "working-directory: site",
    oldToken: "working-directory: site",
    newToken: "working-directory: .",
    note: "drop the site/ working dir (root is the Astro project)",
  },
  {
    file: ".github/workflows/starlight-ci.yml",
    anchor: "cache-dependency-path: site/package-lock.json",
    oldToken: "site/package-lock.json",
    newToken: "package-lock.json",
    note: "lockfile now at root",
  },
  // (2) starlight-staging.yml
  {
    file: ".github/workflows/starlight-staging.yml",
    anchor: "working-directory: site",
    oldToken: "working-directory: site",
    newToken: "working-directory: .",
    note: "drop the site/ working dir (root is the Astro project)",
  },
  {
    file: ".github/workflows/starlight-staging.yml",
    anchor: "cache-dependency-path: site/package-lock.json",
    oldToken: "site/package-lock.json",
    newToken: "package-lock.json",
    note: "lockfile now at root",
  },
  {
    file: ".github/workflows/starlight-staging.yml",
    anchor: "path: site/dist",
    oldToken: "path: site/dist",
    newToken: "path: dist",
    note: "upload-artifact path now at root",
  },
  // (3) starlight-deploy.yml
  {
    file: ".github/workflows/starlight-deploy.yml",
    anchor: "working-directory: site",
    oldToken: "working-directory: site",
    newToken: "working-directory: .",
    note: "drop the site/ working dir (root is the Astro project)",
  },
  {
    file: ".github/workflows/starlight-deploy.yml",
    anchor: "cache-dependency-path: site/package-lock.json",
    oldToken: "site/package-lock.json",
    newToken: "package-lock.json",
    note: "lockfile now at root",
  },
  {
    file: ".github/workflows/starlight-deploy.yml",
    anchor: "path: site/dist",
    oldToken: "path: site/dist",
    newToken: "path: dist",
    note: "upload-pages-artifact path now at root",
  },
  {
    file: ".github/workflows/starlight-deploy.yml",
    anchor: "TODO(D5",
    oldToken: "site/astro.config.mjs",
    newToken: "astro.config.mjs",
    note: "TODO banner comment names the now-root config file",
  },
  // (4) build-versions.mjs — THE load-bearing functional rewrite + its comment block
  {
    file: "build-versions.mjs",
    anchor: '...(v.ref ? ["--root",',
    oldToken: ".src-${v.slug}/site",
    newToken: ".src-${v.slug}",
    note: "worktree IS the Astro root post-promotion (FUNCTIONAL — breaks tagged builds if missed)",
  },
  {
    file: "build-versions.mjs",
    anchor: "astro build --root .src-<slug>/site --outDir",
    oldToken: ".src-<slug>/site",
    newToken: ".src-<slug>",
    note: "explanatory comment (block line ~20) follows the code",
  },
  {
    file: "build-versions.mjs",
    anchor: "--root points at",
    oldToken: ".src-<slug>/site",
    newToken: ".src-<slug>",
    note: "explanatory comment (block line ~22) follows the code",
  },
];

// ---------------------------------------------------------------------------
// .gitignore MERGE — add the Astro ignores currently in site/.gitignore to the
// root .gitignore, while PRESERVING the surviving plans/ + .playwright-mcp/
// ignores. The root file's mdBook/Python lines are removed by the runbook once
// ticket-036 has run, so we do not touch them here (idempotent: only append the
// Astro ignores that are not already present).
// ---------------------------------------------------------------------------
const GITIGNORE_FILE = ".gitignore";
const ASTRO_IGNORES = [
  "# build output",
  "dist/",
  "# multi-version build temp + worktree dirs",
  ".dist-*",
  ".src-*",
  "# generated types",
  ".astro/",
  "# astro-d2 rendered SVG cache (regenerated from the ```d2 sources on build)",
  "public/d2/",
  "# dependencies",
  "node_modules/",
];
// The functional ignore globs (comments excluded) used for the presence check
// and asserted by the test as the merge's effective content.
const ASTRO_IGNORE_GLOBS = [
  "dist/",
  ".dist-*",
  ".src-*",
  ".astro/",
  "public/d2/",
  "node_modules/",
];
// Ignores that MUST survive the merge (the test asserts these are preserved).
const PRESERVED_GLOBS = ["plans/", ".playwright-mcp/"];

// ---------------------------------------------------------------------------
// applyTokenRewrite — surgical line-anchored replacement. Returns a result
// object; never throws on "already applied" (idempotent) so a resumed run is
// clean. Mutates the file only in --execute mode.
// ---------------------------------------------------------------------------
function applyTokenRewrite(rw, execute) {
  const abs = join(REPO_ROOT, rw.file);
  if (!existsSync(abs)) {
    return { status: "absent", detail: `${rw.file} not found` };
  }
  const src = readFileSync(abs, "utf8");
  const lines = src.split("\n");
  const idx = lines.findIndex((l) => l.includes(rw.anchor));
  if (idx === -1) {
    // Anchor gone: either already rewritten (newToken present) or unexpected.
    if (src.includes(rw.newToken) && !src.includes(rw.oldToken)) {
      return { status: "already", detail: "newToken already present" };
    }
    return { status: "anchor-missing", detail: `anchor '${rw.anchor}' not found` };
  }
  if (!lines[idx].includes(rw.oldToken)) {
    if (lines[idx].includes(rw.newToken)) {
      return { status: "already", detail: "line already rewritten" };
    }
    return {
      status: "token-missing",
      detail: `anchored line lacks oldToken '${rw.oldToken}'`,
    };
  }
  if (execute) {
    // Replace ONLY the first occurrence on the anchored line (String.replace with
    // a string pattern replaces the first match — exact, no regex escaping).
    lines[idx] = lines[idx].replace(rw.oldToken, rw.newToken);
    writeFileSync(abs, lines.join("\n"));
  }
  return { status: "applied", detail: `'${rw.oldToken}' -> '${rw.newToken}'` };
}

// ---------------------------------------------------------------------------
// mergeGitignore — append the Astro ignore block to the root .gitignore if its
// globs are not already present; preserve everything already there. Idempotent.
// ---------------------------------------------------------------------------
function mergeGitignore(execute) {
  const abs = join(REPO_ROOT, GITIGNORE_FILE);
  if (!existsSync(abs)) {
    return { status: "absent", detail: `${GITIGNORE_FILE} not found` };
  }
  const src = readFileSync(abs, "utf8");
  const present = new Set(
    src
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#")),
  );
  const missing = ASTRO_IGNORE_GLOBS.filter((g) => !present.has(g));
  if (missing.length === 0) {
    return { status: "already", detail: "all Astro ignores already present" };
  }
  if (execute) {
    const sep = src.endsWith("\n") ? "" : "\n";
    const block =
      `${sep}\n# ── Astro/Starlight (merged from site/.gitignore at promotion) ──\n` +
      `${ASTRO_IGNORES.join("\n")}\n`;
    writeFileSync(abs, src + block);
  }
  return {
    status: "applied",
    detail: `add ${missing.length} Astro ignore(s): ${missing.join(", ")}`,
  };
}

// ---------------------------------------------------------------------------
// Exported descriptors so the test can assert the map covers the full inventory
// without re-parsing prose. (ESM named exports; importing this module does NOT
// run main — see the import.meta.main guard at the bottom.)
// ---------------------------------------------------------------------------
export {
  TOKEN_REWRITES,
  GITIGNORE_FILE,
  ASTRO_IGNORE_GLOBS,
  PRESERVED_GLOBS,
  REPO_ROOT,
};

function usage(stream = process.stdout) {
  stream.write(
    [
      "apply-promotion-rewrites.mjs — post-move path rewrites for the site/ → root promotion (E9/M4).",
      "",
      "USAGE:",
      "  node apply-promotion-rewrites.mjs            Dry-run: print the rewrite plan, change nothing.",
      "  node apply-promotion-rewrites.mjs --execute  Apply the rewrites (post-move only).",
      "  node apply-promotion-rewrites.mjs --help     Show this help.",
      "",
      `Full procedure: ${RUNBOOK_REL}`,
      "",
    ].join("\n"),
  );
}

function main(argv) {
  const flag = argv[2];
  let execute = false;
  if (flag === undefined || flag === "") {
    execute = false;
  } else if (flag === "--execute") {
    execute = true;
  } else if (flag === "-h" || flag === "--help") {
    usage();
    return 0;
  } else {
    process.stderr.write(`apply-promotion-rewrites.mjs: unknown argument '${flag}'.\n`);
    usage(process.stderr);
    return 1;
  }

  const mode = execute ? "EXECUTE" : "DRY-RUN";
  process.stdout.write(
    `apply-promotion-rewrites.mjs: ${mode} — repo root: ${REPO_ROOT}\n`,
  );
  if (!execute) {
    process.stdout.write(
      "apply-promotion-rewrites.mjs: no changes will be made (pass --execute post-move).\n",
    );
  }
  process.stdout.write("\nToken rewrites (file | old -> new):\n");
  for (const rw of TOKEN_REWRITES) {
    const r = applyTokenRewrite(rw, execute);
    process.stdout.write(
      `  [${r.status}] ${rw.file}: ${rw.oldToken} -> ${rw.newToken}\n        (${rw.note})\n`,
    );
  }
  process.stdout.write("\n.gitignore merge:\n");
  const gi = mergeGitignore(execute);
  process.stdout.write(`  [${gi.status}] ${GITIGNORE_FILE}: ${gi.detail}\n`);

  process.stdout.write(
    `\napply-promotion-rewrites.mjs: ${mode} complete. See ${RUNBOOK_REL}\n`,
  );
  return 0;
}

// Only run main when invoked directly (node apply-promotion-rewrites.mjs …),
// NOT when imported by the test. import.meta.url vs process.argv[1] comparison.
const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  process.exit(main(process.argv));
}
