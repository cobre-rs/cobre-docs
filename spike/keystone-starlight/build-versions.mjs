// Architecture B orchestrator: build each version independently with its own
// `base`, then assemble into one dist/ tree:  /  +  /v0.8/.
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

console.log("\n✓ Assembled multi-version site in dist/  ->  /  and  /v0.8/");
