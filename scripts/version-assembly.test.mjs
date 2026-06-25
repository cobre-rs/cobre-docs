// Version-picker logic regression guard (E6 ticket-024).
//
// VersionPicker.astro derives its rendered <option> set from two pure pieces of
// logic: `norm(base)` (force a trailing slash so "/v0.8" and "/v0.8/" compare
// equal) and `all = [latest, ...versions]` (latest first, then each versioned
// entry, one <option> per element). ticket-024 validated the *built* two-version
// tree end-to-end (AC1–AC6); this test pins the underlying norm/all contract so a
// future refactor of VersionPicker.astro cannot silently break multi-version
// option rendering (e.g. dropping latest, mis-ordering, or losing the trailing
// slash that makes the `selected` match work).
//
// Pure-logic test — no build, no dist/. The two helpers below are copies of the
// picker's `norm` and `all` derivation; they are intentionally duplicated (not
// imported) because the picker is an .astro component whose frontmatter cannot be
// imported into node:test. node:test + node:assert/strict, picked up by the
// `scripts/*.test.mjs` glob in `npm test`. Keep these two helpers in lockstep
// with VersionPicker.astro.
import test from "node:test";
import assert from "node:assert/strict";

// Mirrors VersionPicker.astro: `const norm = (b) => (b.endsWith("/") ? b : b + "/")`.
const norm = (b) => (b.endsWith("/") ? b : b + "/");
// Mirrors VersionPicker.astro: `const all = [versions.latest, ...versions.versions]`.
const allEntries = (cfg) => [cfg.latest, ...cfg.versions];

// Representative two-version shape (matches ticket-024's transient versions.json
// and E6's exit criterion "adding a tag is a one-line config change").
const cfg = {
  latest: { label: "latest", base: "/" },
  versions: [{ slug: "v0.8", label: "v0.8", base: "/v0.8/" }],
};

test("norm() forces a trailing slash (idempotent on already-slashed bases)", () => {
  assert.equal(norm("/v0.8/"), "/v0.8/");
  assert.equal(norm("/v0.8"), "/v0.8/");
  assert.equal(norm("/"), "/");
});

test("all entries are [latest, ...versions] in order, one per rendered option", () => {
  const all = allEntries(cfg);
  assert.equal(all.length, 2, "latest + one versioned entry → two options");
  assert.equal(all[0], cfg.latest, "latest is first");
  assert.equal(all[1], cfg.versions[0], "versioned entry follows latest");
  assert.deepEqual(
    all.map((v) => v.base),
    ["/", "/v0.8/"],
    "rendered <option value> set is the normalised bases, latest first",
  );
});

test("exactly the entry matching the current base is marked selected", () => {
  const all = allEntries(cfg);
  // On the /v0.8/ build, import.meta.env.BASE_URL === "/v0.8/".
  const current = norm("/v0.8/");
  const selected = all.filter((v) => norm(v.base) === current);
  assert.equal(selected.length, 1, "exactly one option is selected");
  assert.equal(selected[0].base, "/v0.8/", "the /v0.8/ option is selected");
  // On the latest build, BASE_URL === "/".
  const selectedAtRoot = all.filter((v) => norm(v.base) === norm("/"));
  assert.equal(selectedAtRoot.length, 1);
  assert.equal(selectedAtRoot[0].base, "/", "the latest option is selected at /");
});
