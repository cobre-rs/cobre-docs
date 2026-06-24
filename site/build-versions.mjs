// Architecture B orchestrator: build each version independently with its own
// `base`, then assemble into one dist/ tree (e.g. /  +  /v0.8/ once E6 adds
// real entries; with a single `latest` entry today it is just /).
//
// PROTOTYPE NOTE: all builds here share the current source — only `base` (and
// thus the picker's "current") differ. In PRODUCTION, a versioned entry would
// first materialize its tagged source, e.g.:
//     git worktree add --force .src-v0.8 v0.8
//   then build with `--root .src-v0.8`. That one line is the only difference.

import { execSync } from "node:child_process";
import { readFileSync, rmSync, cpSync, mkdirSync } from "node:fs";

const cfg = JSON.parse(
  readFileSync(new URL("./versions.json", import.meta.url), "utf8"),
);
const builds = [cfg.latest, ...cfg.versions];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const baseEnv = {
  ...process.env,
  PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
};

for (const v of builds) {
  // A versioned entry MUST carry a unique `slug` (only the `latest` entry may omit
  // it → `.dist-latest`). Without this guard, a versioned entry lacking `slug` would
  // resolve to `.dist-latest` too and silently overwrite the latest build's output
  // (E6 populates `versions`, so this contract must hold before then).
  if (v !== cfg.latest && !v.slug) {
    throw new Error(
      `versions.json entry missing required "slug" field: ${JSON.stringify(v)}`,
    );
  }
  const base = v.base.endsWith("/") ? v.base : v.base + "/";
  const tmp = `.dist-${v.slug ?? "latest"}`;
  console.log(`\n=== building ${v.label}  (base=${base}) ===`);

  // PRODUCTION: if (v.ref) execSync(`git worktree add --force .src-${v.slug} ${v.ref}`)
  //             and pass `--root .src-${v.slug}` below.
  execSync(`node_modules/.bin/astro build --outDir ${tmp}`, {
    stdio: "inherit",
    env: { ...baseEnv, DOCS_BASE: base },
  });

  const dest = base === "/" ? "dist" : `dist${base}`.replace(/\/$/, "");
  mkdirSync(dest, { recursive: true });
  cpSync(tmp, dest, { recursive: true });
  rmSync(tmp, { recursive: true, force: true });
}

const subpaths = builds
  .map((v) => (v.base.endsWith("/") ? v.base : v.base + "/"))
  .join("  and  ");
console.log(`\n✓ Assembled multi-version site in dist/  ->  ${subpaths}`);
