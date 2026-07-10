// Vendored terminal-recording refresh (recordings design, Option A).
//
// The demo GIFs embedded in getting-started/quickstart.mdx and
// running/running-studies.mdx are VHS recordings of the *cobre CLI* in action.
// They are GENERATED in the `cobre` repo (`recordings/*.tape` + the cobre
// binary; code = ground truth) — cobre-docs vendors a committed copy of that
// generated output under public/. This script re-vendors them exactly like
// refresh-schemas.mjs vendors the JSON Schemas; it never hand-edits a GIF.
//
// Released-baseline rule (same discipline as refresh-schemas): content is read
// from an immutable git TAG via `git -C <cobre> show <ref>:recordings/<name>`,
// NEVER the `cobre` working tree — a working-tree read would leak a mid-branch
// regeneration into the vendored copy. Because a tag's GIF is a fixed git blob,
// --check can byte-compare the vendored copy against it (unlike a *fresh* VHS
// run, which is not byte-reproducible — timing jitter).
//
// Path manifest: unlike schemas (a flat dir mirror), each recording maps to a
// specific public/ location next to the page that embeds it. MANIFEST is the
// single source of truth for what ships and where. reconcileManifest() fails
// loud if the tag grows a GIF the manifest does not map (a new demo the docs
// would otherwise silently drop) or maps one the tag lacks.
//
// Usage:
//   node scripts/refresh-recordings.mjs [--cobre <path>] [--ref <git-ref>] [--check]
//     --cobre   path to a cobre checkout (default: $COBRE_REPO or ~/git/cobre).
//               Only used to resolve the git object database — the ref is read
//               via plumbing, so cobre's checked-out branch is irrelevant.
//     --ref     git ref/tag to vendor from (default: v0.10.0).
//     --check   verify-only: byte-compare public/ copies against <ref>, write
//               nothing; exit 1 listing every drifted/missing file, else exit 0.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const DEFAULT_REF = "v0.10.0";
const RECORDINGS_SUBPATH = "recordings";

// The single source of truth for which GIFs ship and where. `src` is the
// basename under cobre `recordings/`; `dest` is the path under public/ (next to
// the page that embeds it, so the served URL is /<dest>).
const MANIFEST = [
  { src: "quickstart.gif", dest: "getting-started/quickstart.gif" },
  { src: "validation.gif", dest: "running/validation.gif" },
  { src: "validation-error.gif", dest: "running/validation-error.gif" },
  { src: "multithreading.gif", dest: "running/multithreading.gif" },
];

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));

// --- Pure helpers (exported for the node:test fixture) ----------------------
// Synchronous, no filesystem/subprocess; exercised directly on inline fixtures
// by scripts/refresh-recordings.test.mjs.

// Parse `git ls-tree --name-only <ref> recordings/` stdout into a sorted array
// of the .gif basenames present at the ref (ignoring .tape/.md/etc.).
export function parseGifNames(lsTreeStdout) {
  return lsTreeStdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(line.lastIndexOf("/") + 1))
    .filter((name) => name.endsWith(".gif"))
    .sort();
}

// Cross-check the GIFs present at the ref against MANIFEST, both directions.
// Throws a named error if the manifest references a GIF absent at the ref, or
// if the ref carries a GIF the manifest does not map (a new demo the docs would
// silently drop). Returns the sorted manifest `src` list on success.
export function reconcileManifest(refGifNames, manifest) {
  const refSet = new Set(refGifNames);
  const mapped = manifest.map((e) => e.src).sort();
  const mappedSet = new Set(mapped);

  const missingAtRef = mapped.filter((src) => !refSet.has(src));
  if (missingAtRef.length > 0) {
    throw new Error(
      `refresh:recordings: manifest references ${missingAtRef.join(", ")} not found under ${RECORDINGS_SUBPATH}/ at the ref — wrong ref, or a renamed/removed recording?`,
    );
  }
  const unmapped = refGifNames.filter((name) => !mappedSet.has(name));
  if (unmapped.length > 0) {
    throw new Error(
      `refresh:recordings: ${unmapped.join(", ")} exist under ${RECORDINGS_SUBPATH}/ at the ref but are not in the manifest — wire them into public/ (and a page) or they will not ship.`,
    );
  }
  return mapped;
}

// Throws a named error unless `buf` begins with a GIF signature (GIF87a/GIF89a).
// Guards against vendoring an error page, an LFS pointer, or a truncated blob
// instead of an actual GIF — the binary analog of assertWellFormed.
export function assertGifMagic(name, buf) {
  const magic = buf.subarray(0, 6).toString("latin1");
  if (magic !== "GIF87a" && magic !== "GIF89a") {
    throw new Error(
      `refresh:recordings: ${name} is not a GIF (magic bytes were ${JSON.stringify(magic)}) — an error page or LFS pointer, not the recording?`,
    );
  }
}

// --- Git plumbing (execFileSync with an ARGS ARRAY — never a shell string) --

function gitLsTree(cobre, ref) {
  try {
    return execFileSync(
      "git",
      ["-C", cobre, "ls-tree", "--name-only", ref, `${RECORDINGS_SUBPATH}/`],
      { encoding: "utf8" },
    );
  } catch (error) {
    throw new Error(
      `refresh:recordings: cannot list ${RECORDINGS_SUBPATH}/ at ${ref} from ${cobre} — is the tag fetched? (${error.message})`,
    );
  }
}

// Returns a Buffer — NO encoding, so binary GIF bytes are preserved verbatim.
// maxBuffer is raised well above execFileSync's 1 MB default: GIFs routinely
// exceed it (multithreading.gif is ~1.1 MB), which would otherwise ENOBUFS.
function gitShowBinary(cobre, ref, src) {
  try {
    return execFileSync(
      "git",
      ["-C", cobre, "show", `${ref}:${RECORDINGS_SUBPATH}/${src}`],
      { maxBuffer: 256 * 1024 * 1024 },
    );
  } catch (error) {
    throw new Error(
      `refresh:recordings: cannot read ${ref}:${RECORDINGS_SUBPATH}/${src} from ${cobre} — is the tag fetched? (${error.message})`,
    );
  }
}

// --- Arg parsing --------------------------------------------------------------

function parseArgs(argv) {
  let cobre = process.env.COBRE_REPO ?? join(homedir(), "git", "cobre");
  let ref = DEFAULT_REF;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--cobre") {
      cobre = argv[++i];
    } else if (arg === "--ref") {
      ref = argv[++i];
    } else if (arg === "--check") {
      check = true;
    } else {
      throw new Error(`refresh:recordings: unrecognized argument '${arg}'`);
    }
  }
  return { cobre, ref, check };
}

// --- Main (run only when invoked directly, not when imported by the test) ---

function main() {
  const { cobre, ref, check } = parseArgs(process.argv.slice(2));

  reconcileManifest(parseGifNames(gitLsTree(cobre, ref)), MANIFEST);

  const released = new Map();
  for (const { src } of MANIFEST) {
    const buf = gitShowBinary(cobre, ref, src);
    assertGifMagic(src, buf);
    released.set(src, buf);
  }

  if (check) {
    const drifted = [];
    for (const { src, dest } of MANIFEST) {
      const destPath = join(publicDir, dest);
      if (!existsSync(destPath)) {
        drifted.push(`${dest} (missing from public/)`);
        continue;
      }
      if (!readFileSync(destPath).equals(released.get(src))) {
        drifted.push(`${dest} (drifted from ${ref})`);
      }
    }
    if (drifted.length > 0) {
      console.error(
        `refresh:recordings --check: ${drifted.length} of ${MANIFEST.length} vendored recording(s) drifted from ${ref}:\n`,
      );
      for (const d of drifted) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(
      `refresh:recordings --check: ${MANIFEST.length} vendored recordings match ${ref}`,
    );
    process.exit(0);
  }

  for (const { src, dest } of MANIFEST) {
    const destPath = join(publicDir, dest);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, released.get(src));
  }
  console.log(
    `refresh:recordings: vendored ${MANIFEST.length} recordings from ${ref}`,
  );
  process.exit(0);
}

// Run when executed directly; stay inert when imported by the test.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (import.meta.url === entryHref) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
