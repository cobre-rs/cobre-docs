// Unit fixture for the refresh:recordings pure helpers.
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. Exercises
// sha256Hex, checkRecording (sha256 drift, tape-blob drift, a missing GIF, an
// unresolved tape), reconcileRecords (both mismatch directions), and
// assertGifMagic (named throw on non-GIF bytes) directly, with no filesystem or
// subprocess access.
import test from "node:test";
import assert from "node:assert/strict";
import {
  sha256Hex,
  checkRecording,
  reconcileRecords,
  assertGifMagic,
} from "./refresh-recordings.mjs";

const GIF = Buffer.from("GIF89a\x00\x01fixture", "latin1");

const RECORD = {
  dest: "getting-started/quickstart.gif",
  sha256: sha256Hex(GIF),
  tape: "recordings/quickstart.tape",
  tape_ref: "v0.17.0",
  tape_blob: "e2fd31bf86e02e35f56f5807ce2449957861d9c4",
  cobre_version: null,
  hostname_method: null,
  note: "fixture",
};

const MANIFEST = [
  { tape: "quickstart.tape", dest: "getting-started/quickstart.gif" },
];

test("sha256Hex returns the lowercase hex digest", () => {
  assert.equal(
    sha256Hex(Buffer.from("abc", "latin1")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("checkRecording reports no drift when the sha256 and the tape blob match", () => {
  assert.deepEqual(checkRecording(RECORD, GIF, RECORD.tape_blob), []);
});

test("checkRecording names the dest on a sha256 mismatch", () => {
  const changed = Buffer.concat([GIF, Buffer.from([0])]);
  const drift = checkRecording(RECORD, changed, RECORD.tape_blob);
  assert.equal(drift.length, 1);
  assert.match(drift[0], /^getting-started\/quickstart\.gif \(sha256 /);
});

test("checkRecording reports a tape-blob mismatch", () => {
  const drift = checkRecording(RECORD, GIF, "0".repeat(40));
  assert.equal(drift.length, 1);
  assert.match(
    drift[0],
    /recordings\/quickstart\.tape at v0\.17\.0 is blob 0{40}, recorded e2fd31bf/,
  );
});

test("checkRecording does not treat an unresolved tape (null blob) as a drift", () => {
  assert.deepEqual(checkRecording(RECORD, GIF, null), []);
});

test("checkRecording reports both the sha256 drift and the tape drift", () => {
  const changed = Buffer.concat([GIF, Buffer.from([0])]);
  assert.equal(checkRecording(RECORD, changed, "0".repeat(40)).length, 2);
});

test("checkRecording reports a GIF missing from public/", () => {
  assert.deepEqual(checkRecording(RECORD, null, RECORD.tape_blob), [
    "getting-started/quickstart.gif (missing from public/)",
  ]);
});

test("checkRecording throws on non-GIF bytes instead of comparing the sha256", () => {
  assert.throws(
    () =>
      checkRecording(RECORD, Buffer.from("<!DOCTYPE html>", "latin1"), null),
    /getting-started\/quickstart\.gif is not a GIF/,
  );
});

test("reconcileRecords passes when the manifest and the records name the same recording", () => {
  assert.doesNotThrow(() => reconcileRecords(MANIFEST, [RECORD]));
});

test("reconcileRecords throws when a manifest entry has no record", () => {
  assert.throws(
    () => reconcileRecords(MANIFEST, []),
    /maps recordings\/quickstart\.tape -> getting-started\/quickstart\.gif but .* no such record/,
  );
});

test("reconcileRecords throws when a record has no manifest entry", () => {
  const extra = {
    ...RECORD,
    dest: "getting-started/extra.gif",
    tape: "recordings/extra.tape",
  };
  assert.throws(
    () => reconcileRecords(MANIFEST, [RECORD, extra]),
    /getting-started\/extra\.gif but the manifest does not map it/,
  );
});

test("reconcileRecords throws when a record names another tape than the manifest", () => {
  assert.throws(
    () =>
      reconcileRecords(MANIFEST, [
        { ...RECORD, tape: "recordings/other.tape" },
      ]),
    /no such record/,
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
