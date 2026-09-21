// Unit fixture for the shared DEFAULT_COBRE_REF constant (ticket-003).
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. Asserts
// the tag shape only — the value itself is bumped at each release (Epic 12
// ticket-028), so the test must not pin a specific version.
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_COBRE_REF } from "./cobre-ref.mjs";

test("DEFAULT_COBRE_REF matches the vX.Y.Z tag shape", () => {
  assert.match(DEFAULT_COBRE_REF, /^v\d+\.\d+\.\d+$/);
});
