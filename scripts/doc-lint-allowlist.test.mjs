// Unit fixture for the shared doc-lint-allow.txt reader (Epic 04 ticket-015,
// hardened to a rule-scoped, stale-strict ratchet by ticket-008a).
//
// The voice-family gates (check-doc-voice.mjs, check-doc-version.mjs) depend on
// loadAllowlist()/partitionByAllowlist() to grandfather pre-existing hits; this
// pins the reader's behaviour directly against in-memory fixture files (written
// to the scratchpad, not the repo) so a future refactor cannot silently widen
// or narrow what counts as "grandfathered".

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";

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

const owns = (ids) => (id) => ids.includes(id);
const hit = (rel, lineno, rule) => ({ rel, lineno, rule, text: "x" });

test("a missing allowlist file is treated as empty (does not crash)", () => {
  const allowlist = loadAllowlist("/nonexistent/path/doc-lint-allow.txt");
  assert.equal(allowlist.size, 0);
  const v = hit("math/foo.mdx", 10, "rule-a");
  assert.deepEqual(partitionByAllowlist([v], allowlist, owns(["rule-a"])), {
    failing: [v],
    grandfathered: [],
    stale: [],
  });
});

test("blank lines and comment lines are ignored", () => {
  withFixture("# a comment\n\n   \nmath/foo.mdx:5  rule-a  # ok\n", (path) => {
    assert.deepEqual(
      [...loadAllowlist(path)],
      [["math/foo.mdx:5", [{ ruleId: "rule-a", fileLine: 4 }]]],
    );
  });
});

test("a path:line entry grandfathers exactly that path:line", () => {
  withFixture("math/foo.mdx:5  unpinned-number  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    const exact = hit("math/foo.mdx", 5, "unpinned-number");
    const otherLine = hit("math/foo.mdx", 6, "unpinned-number");
    const otherFile = hit("math/bar.mdx", 5, "unpinned-number");
    const { failing, grandfathered, stale } = partitionByAllowlist(
      [exact, otherLine, otherFile],
      allowlist,
      owns(["unpinned-number"]),
    );
    assert.deepEqual(grandfathered, [exact]);
    assert.deepEqual(failing, [otherLine, otherFile]);
    assert.deepEqual(stale, []);
  });
});

test("entry grandfathers only its own rule", () => {
  withFixture("math/foo.mdx:5  narration-no-longer  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    const hype = hit("math/foo.mdx", 5, "hype-superlative");
    const result = partitionByAllowlist(
      [hype],
      allowlist,
      owns(["narration-no-longer", "hype-superlative"]),
    );
    assert.deepEqual(result.failing, [hype]);
    assert.deepEqual(result.grandfathered, []);
    assert.deepEqual(result.stale, [
      { key: "math/foo.mdx:5", ruleId: "narration-no-longer", fileLine: 1 },
    ]);
  });
});

test("one entry covers every hit of its rule on that line", () => {
  withFixture("math/foo.mdx:5  rule-a  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    const first = hit("math/foo.mdx", 5, "rule-a");
    const second = hit("math/foo.mdx", 5, "rule-a");
    assert.deepEqual(
      partitionByAllowlist([first, second], allowlist, owns(["rule-a"])),
      { failing: [], grandfathered: [first, second], stale: [] },
    );
  });
});

test("stale owned entry is reported by name", () => {
  withFixture("# header\nmath/foo.mdx:5  rule-a  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    assert.deepEqual(partitionByAllowlist([], allowlist, owns(["rule-a"])), {
      failing: [],
      grandfathered: [],
      stale: [{ key: "math/foo.mdx:5", ruleId: "rule-a", fileLine: 2 }],
    });
  });
});

test("foreign-rule entry is neither applied nor stale", () => {
  withFixture("math/foo.mdx:5  rule-b  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    const own = owns(["rule-a"]);
    const ownHit = hit("math/foo.mdx", 5, "rule-a");
    const foreignHit = hit("math/foo.mdx", 5, "rule-b");
    assert.deepEqual(partitionByAllowlist([ownHit], allowlist, own), {
      failing: [ownHit],
      grandfathered: [],
      stale: [],
    });
    assert.deepEqual(partitionByAllowlist([foreignHit], allowlist, own), {
      failing: [foreignHit],
      grandfathered: [],
      stale: [],
    });
  });
});

test("re-keyed entry passes", () => {
  const own = owns(["rule-a"]);
  const moved = hit("math/foo.mdx", 7, "rule-a");
  withFixture("math/foo.mdx:5  rule-a  # rationale\n", (path) => {
    // A line shift with the entry left behind fails on both sides.
    assert.deepEqual(partitionByAllowlist([moved], loadAllowlist(path), own), {
      failing: [moved],
      grandfathered: [],
      stale: [{ key: "math/foo.mdx:5", ruleId: "rule-a", fileLine: 1 }],
    });
  });
  withFixture("math/foo.mdx:7  rule-a  # rationale\n", (path) => {
    assert.deepEqual(partitionByAllowlist([moved], loadAllowlist(path), own), {
      failing: [],
      grandfathered: [moved],
      stale: [],
    });
  });
});

test("a comma-joined rule-id cell parses to one element per id", () => {
  withFixture("math/foo.mdx:5  rule-a,rule-b  # two hits\n", (path) => {
    assert.deepEqual(loadAllowlist(path).get("math/foo.mdx:5"), [
      { ruleId: "rule-a", fileLine: 1 },
      { ruleId: "rule-b", fileLine: 1 },
    ]);
  });
});

test("comma-joined ids filter per rule", () => {
  withFixture("math/foo.mdx:5  rule-a,rule-b  # two hits\n", (path) => {
    const allowlist = loadAllowlist(path);
    const own = owns(["rule-a", "rule-b", "rule-c"]);
    const a = hit("math/foo.mdx", 5, "rule-a");
    const b = hit("math/foo.mdx", 5, "rule-b");
    const c = hit("math/foo.mdx", 5, "rule-c");
    assert.deepEqual(partitionByAllowlist([a, b, c], allowlist, own), {
      failing: [c],
      grandfathered: [a, b],
      stale: [],
    });
    assert.deepEqual(partitionByAllowlist([a], allowlist, own).stale, [
      { key: "math/foo.mdx:5", ruleId: "rule-b", fileLine: 1 },
    ]);
  });
});

test("an unreadable violation is never grandfathered", () => {
  withFixture("math/foo.mdx:0  unreadable  # rationale\n", (path) => {
    const allowlist = loadAllowlist(path);
    const v = hit("math/foo.mdx", 0, "unreadable");
    assert.deepEqual(
      partitionByAllowlist([v], allowlist, owns(["rule-a", "unreadable"])),
      {
        failing: [v],
        grandfathered: [],
        stale: [{ key: "math/foo.mdx:0", ruleId: "unreadable", fileLine: 1 }],
      },
    );
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
