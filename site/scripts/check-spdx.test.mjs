// Unit fixture for the check:spdx classifier (E10 ticket-035).
//
// The run-against-the-tree AC (`npm run check:spdx` exits 0) and the
// temporary-GPL-entry AC together prove the gate end-to-end; this colocated
// node:test fixture additionally pins the pure classifier's behaviour so a
// future refactor of check-spdx.mjs cannot silently weaken it:
//   - permissive ids (MIT/ISC/Apache-2.0/OFL-1.1 + the rest of the allow-list)
//     classify as `permissive`;
//   - the d2/ELK exemption (MPL-2.0/EPL-2.0) classifies as
//     `build-time-weak-copyleft`, NOT permissive (the distinction must stay
//     visible);
//   - copyleft / proprietary / empty ids (GPL-3.0-only, AGPL-3.0-or-later,
//     LGPL-*, UNLICENSED, "") classify as BLOCKER;
//   - SPDX OR/AND expressions are handled (OR passes on any permissive arm with
//     the elected arm noted; AND requires all arms permissive).
//
// node:test + node:assert/strict, mirroring check-figures.test.mjs. Picked up
// automatically by the `scripts/*.test.mjs` glob in `npm test`.

import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyLicense,
  normaliseLicenseField,
  CLASS_PERMISSIVE,
  CLASS_WEAK_COPYLEFT,
  CLASS_BLOCKER,
  PERMISSIVE_ALLOW_LIST,
} from "./check-spdx.mjs";

// ---- Permissive allow-list -------------------------------------------------
test("classifies the audited permissive ids as permissive", () => {
  // The exact ids that appear in this tree (per the ticket audit table).
  for (const id of ["MIT", "ISC", "Apache-2.0", "OFL-1.1"]) {
    assert.equal(
      classifyLicense(id).classification,
      CLASS_PERMISSIVE,
      `expected '${id}' to classify as permissive`,
    );
  }
});

test("classifies every allow-listed id as permissive", () => {
  // Pin the whole allow-list so trimming an entry from it cannot pass silently.
  for (const id of PERMISSIVE_ALLOW_LIST) {
    assert.equal(
      classifyLicense(id).classification,
      CLASS_PERMISSIVE,
      `expected allow-listed '${id}' to classify as permissive`,
    );
  }
});

// ---- Build-time-only weak-copyleft exemption (d2 / ELK) --------------------
test("exempts MPL-2.0 (d2) as build-time-weak-copyleft, not permissive", () => {
  const r = classifyLicense("MPL-2.0");
  assert.equal(r.classification, CLASS_WEAK_COPYLEFT);
  assert.notEqual(
    r.classification,
    CLASS_PERMISSIVE,
    "MPL-2.0 must NOT be lumped into the permissive allow-list",
  );
});

test("exempts EPL-2.0 (ELK) as build-time-weak-copyleft, not permissive", () => {
  const r = classifyLicense("EPL-2.0");
  assert.equal(r.classification, CLASS_WEAK_COPYLEFT);
  assert.notEqual(r.classification, CLASS_PERMISSIVE);
});

// ---- Blockers: copyleft / proprietary / absent -----------------------------
test("flags GPL-3.0-only as BLOCKER", () => {
  assert.equal(classifyLicense("GPL-3.0-only").classification, CLASS_BLOCKER);
});

test("flags AGPL-3.0-or-later as BLOCKER", () => {
  assert.equal(
    classifyLicense("AGPL-3.0-or-later").classification,
    CLASS_BLOCKER,
  );
});

test("flags LGPL-3.0-or-later as BLOCKER", () => {
  assert.equal(
    classifyLicense("LGPL-3.0-or-later").classification,
    CLASS_BLOCKER,
  );
});

test("flags an empty license field as BLOCKER (absent ≠ permissive)", () => {
  for (const empty of ["", "   ", undefined, null]) {
    assert.equal(
      classifyLicense(empty).classification,
      CLASS_BLOCKER,
      `expected empty/absent (${JSON.stringify(empty)}) to be a BLOCKER`,
    );
  }
});

test("flags UNLICENSED (npm proprietary marker) as BLOCKER", () => {
  assert.equal(classifyLicense("UNLICENSED").classification, CLASS_BLOCKER);
  assert.equal(classifyLicense("NONE").classification, CLASS_BLOCKER);
});

test("flags an unrecognised/non-FOSS id as BLOCKER", () => {
  assert.equal(
    classifyLicense("SEE LICENSE IN LICENSE.txt").classification,
    CLASS_BLOCKER,
  );
  assert.equal(classifyLicense("Proprietary").classification, CLASS_BLOCKER);
});

// ---- SPDX expression handling ----------------------------------------------
test("OR-expression passes if any arm is permissive, noting the elected arm", () => {
  const r = classifyLicense("(MIT OR Apache-2.0)");
  assert.equal(r.classification, CLASS_PERMISSIVE);
  assert.equal(r.electedArm, "MIT");
});

test("OR-expression elects the permissive arm even when the other is copyleft", () => {
  // The JSXGraph case recorded in the notices preamble: LGPL-2.0-or-later / MIT.
  const r = classifyLicense("(LGPL-2.0-or-later OR MIT)");
  assert.equal(r.classification, CLASS_PERMISSIVE);
  assert.equal(r.electedArm, "MIT");
});

test("OR-expression with no permissive arm is a BLOCKER", () => {
  assert.equal(
    classifyLicense("(GPL-3.0-only OR LGPL-3.0-only)").classification,
    CLASS_BLOCKER,
  );
});

test("AND-expression passes only if ALL arms are permissive", () => {
  assert.equal(
    classifyLicense("MIT AND Apache-2.0").classification,
    CLASS_PERMISSIVE,
  );
});

test("AND-expression with a non-permissive arm is a BLOCKER", () => {
  assert.equal(
    classifyLicense("MIT AND GPL-3.0-only").classification,
    CLASS_BLOCKER,
  );
});

// ---- License-field normalisation (legacy/object/array forms) ---------------
test("normalises the canonical string license form", () => {
  assert.equal(normaliseLicenseField("MIT"), "MIT");
  assert.equal(normaliseLicenseField("  Apache-2.0  "), "Apache-2.0");
});

test("normalises the deprecated { type } object license form", () => {
  assert.equal(normaliseLicenseField({ type: "MIT", url: "x" }), "MIT");
});

test("normalises the legacy array license form to an AND-expression", () => {
  assert.equal(
    normaliseLicenseField([{ type: "MIT" }, { type: "Apache-2.0" }]),
    "MIT AND Apache-2.0",
  );
});

test("normalises a missing license field to an empty string (→ BLOCKER)", () => {
  assert.equal(normaliseLicenseField(undefined), "");
  assert.equal(classifyLicense(normaliseLicenseField(undefined)).classification, CLASS_BLOCKER);
});
