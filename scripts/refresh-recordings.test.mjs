// Unit fixture for the refresh:recordings pure helpers.
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. Exercises
// parseGifNames (ls-tree stdout -> sorted .gif basenames), reconcileManifest
// (both mismatch directions), and assertGifMagic (named throw on non-GIF bytes)
// directly, with no filesystem or subprocess access.
import test from "node:test";
import assert from "node:assert/strict";
import {
  parseGifNames,
  reconcileManifest,
  assertGifMagic,
} from "./refresh-recordings.mjs";

// A representative `git ls-tree --name-only <ref> recordings/` fixture: mixed
// file types (the .tape/.md/.cast siblings must be ignored), not pre-sorted,
// trailing newline as real git output has.
const LS_TREE_FIXTURE =
  [
    "recordings/quickstart.tape",
    "recordings/quickstart.gif",
    "recordings/README.md",
    "recordings/multithreading.gif",
    "recordings/validation.gif",
    "recordings/validation-error.gif",
    "recordings/validation.tape",
  ].join("\n") + "\n";

const MANIFEST = [
  { src: "quickstart.gif", dest: "getting-started/quickstart.gif" },
  { src: "validation.gif", dest: "running/validation.gif" },
  { src: "validation-error.gif", dest: "running/validation-error.gif" },
  { src: "multithreading.gif", dest: "running/multithreading.gif" },
];

test("parseGifNames keeps only .gif basenames, sorted, ignoring .tape/.md", () => {
  assert.deepEqual(parseGifNames(LS_TREE_FIXTURE), [
    "multithreading.gif",
    "quickstart.gif",
    "validation-error.gif",
    "validation.gif",
  ]);
});

test("reconcileManifest passes when the ref GIFs exactly match the manifest", () => {
  assert.doesNotThrow(() =>
    reconcileManifest(parseGifNames(LS_TREE_FIXTURE), MANIFEST),
  );
});

test("reconcileManifest throws when the ref carries an unmapped GIF (a new demo)", () => {
  const withExtra = parseGifNames(LS_TREE_FIXTURE).concat("report.gif").sort();
  assert.throws(
    () => reconcileManifest(withExtra, MANIFEST),
    /report\.gif .* not in the manifest/,
  );
});

test("reconcileManifest throws when the manifest references a GIF absent at the ref", () => {
  const missing = parseGifNames(LS_TREE_FIXTURE).filter(
    (n) => n !== "validation.gif",
  );
  assert.throws(
    () => reconcileManifest(missing, MANIFEST),
    /validation\.gif not found/,
  );
});

test("assertGifMagic accepts GIF87a and GIF89a signatures", () => {
  assert.doesNotThrow(() =>
    assertGifMagic("a.gif", Buffer.from("GIF89a\x00\x01", "latin1")),
  );
  assert.doesNotThrow(() =>
    assertGifMagic("b.gif", Buffer.from("GIF87a rest", "latin1")),
  );
});

test("assertGifMagic throws a named error on non-GIF bytes (error page / LFS pointer)", () => {
  assert.throws(
    () => assertGifMagic("c.gif", Buffer.from("<!DOCTYPE html>", "latin1")),
    /c\.gif is not a GIF/,
  );
});
