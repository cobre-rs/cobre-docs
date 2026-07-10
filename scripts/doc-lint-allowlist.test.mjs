// Unit fixture for the shared doc-lint-allow.txt reader (Epic 04 ticket-015).
//
// check-doc-voice.mjs and check-doc-version.mjs both depend on
// loadAllowlist()/isAllowlisted() to grandfather pre-existing hits; this
// pins the parser's behaviour directly against in-memory fixture files
// (written to the scratchpad, not the repo) so a future refactor cannot
// silently widen or narrow what counts as "grandfathered".

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAllowlist, isAllowlisted } from "./doc-lint-allowlist.mjs";

function withFixture(contents, fn) {
  const dir = mkdtempSync(join(tmpdir(), "doc-lint-allow-test-"));
  const path = join(dir, "doc-lint-allow.txt");
  writeFileSync(path, contents, "utf8");
  try {
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a missing allowlist file is treated as empty (does not crash)", () => {
  const allowlist = loadAllowlist("/nonexistent/path/doc-lint-allow.txt");
  assert.equal(allowlist.size, 0);
  assert.equal(isAllowlisted(allowlist, "math/foo.mdx", 10), false);
});

test("blank lines and comment lines are ignored", () => {
  withFixture("# a comment\n\n   \nmath/foo.mdx:5  rule-a  # ok\n", (path) => {
    const allowlist = loadAllowlist(path);
    assert.equal(allowlist.size, 1);
    assert.ok(isAllowlisted(allowlist, "math/foo.mdx", 5));
  });
});

test("a path:line entry grandfathers exactly that path:line", () => {
  withFixture("math/foo.mdx:5  unpinned-number  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    assert.ok(isAllowlisted(allowlist, "math/foo.mdx", 5));
    assert.ok(!isAllowlisted(allowlist, "math/foo.mdx", 6));
    assert.ok(!isAllowlisted(allowlist, "math/bar.mdx", 5));
  });
});

test("an entry silences ANY rule at that path:line (rule-id is documentation, not a filter)", () => {
  withFixture("math/foo.mdx:5  rule-a  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    // isAllowlisted takes no rule argument — a path:line hit is grandfathered
    // regardless of which rule fired there.
    assert.ok(isAllowlisted(allowlist, "math/foo.mdx", 5));
  });
});

test("multiple comma-joined rule-ids on one line are accepted", () => {
  withFixture("math/foo.mdx:5  rule-a,rule-b  # two hits, one line\n", (path) => {
    const allowlist = loadAllowlist(path);
    assert.ok(isAllowlisted(allowlist, "math/foo.mdx", 5));
  });
});

test("a malformed non-comment line throws a named error", () => {
  withFixture("this is not a valid entry\n", (path) => {
    assert.throws(() => loadAllowlist(path), /malformed entry/);
  });
});

test("a malformed line missing the rationale marker throws a named error", () => {
  withFixture("math/foo.mdx:5  rule-a  no-hash-marker\n", (path) => {
    assert.throws(() => loadAllowlist(path), /malformed entry/);
  });
});
