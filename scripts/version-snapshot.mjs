// Testable helpers for build-versions.mjs (ADR-005).
//
// build-versions.mjs runs its whole build at module top level, so nothing in it
// can be imported by a test; the logic that needs a unit test lives here and the
// orchestrator imports it. The module performs no I/O on import.
//
// A versioned entry is built from a throwaway git worktree of its ref, and
// src/components/VersionPicker.astro reads that worktree's own versions.json —
// the copy committed at the ref, which predates the entry being built.
// writeSnapshotVersions overwrites it with the current versions.json text so the
// snapshot's picker lists every version and marks its own entry selected.
//
// Astro applies a build's `base` to the URLs it manages (assets, sidebar,
// favicon), and build-versions.mjs nests each build's output, redirect stubs
// included, under dist/<base>/. Two kinds of root-relative URL are emitted
// verbatim and would leave a versioned snapshot for latest: a link
// an author writes in markdown as [x](/math/x), emitted as href="/math/x", and
// the destination of a redirect stub, <meta http-equiv="refresh"
// content="0;url=/math/x/">. prefixRootRelative gives every href/src value and
// every refresh url= target that starts with a single "/" the snapshot's base
// unless its path already carries it; prefixSnapshotTree applies that to each
// *.html file of the copied snapshot. Other attributes are untouched: the
// picker's <option value="/"> stays pointed at latest, as does the content of
// any meta that is not a refresh. A stub's <title>, <code> text and canonical
// <link> keep the latest path.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_RELATIVE = /(\s(?:href|src)=)(["'])(\/(?!\/)[\s\S]*?)\2/g;
// A <meta> tag (its quoted values may hold ">"), the refresh marker inside it,
// and the url= target of its content attribute ("0;url=/x/").
const META_TAG = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const HTTP_EQUIV_REFRESH = /\shttp-equiv=(["'])refresh\1/i;
const REFRESH_URL = /(\scontent=(["'])[^"']*?\burl=)(\/(?!\/)[\s\S]*?)\2/i;
// What may follow the base in a value already inside the snapshot: nothing, a
// path, a query or a fragment ("/v0.16", "/v0.16/x", "/v0.16?x", "/v0.16#s").
const BASE_END = /^(?:[/?#]|$)/;

export function writeSnapshotVersions(worktreeDir, versionsText) {
  if (!statSync(worktreeDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(
      `build:versions: snapshot worktree ${worktreeDir} is not a directory`,
    );
  }
  const target = join(worktreeDir, "versions.json");
  writeFileSync(target, versionsText);
  return target;
}

function prefixLinks(html, base) {
  // Base "/" gives an empty prefix: every value already starts with "/".
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  let rewritten = 0;
  const prefixValue = (value) => {
    if (value.startsWith(prefix) && BASE_END.test(value.slice(prefix.length))) {
      return value;
    }
    rewritten++;
    return `${prefix}${value}`;
  };
  const links = html.replace(
    ROOT_RELATIVE,
    (_, attr, quote, value) => `${attr}${quote}${prefixValue(value)}${quote}`,
  );
  const prefixed = links.replace(META_TAG, (tag) =>
    HTTP_EQUIV_REFRESH.test(tag)
      ? tag.replace(
          REFRESH_URL,
          (_, lead, quote, target) => `${lead}${prefixValue(target)}${quote}`,
        )
      : tag,
  );
  return { html: prefixed, rewritten };
}

export function prefixRootRelative(html, base) {
  return prefixLinks(html, base).html;
}

export function prefixSnapshotTree(dir, base) {
  let files = 0;
  let rewritten = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = prefixSnapshotTree(path, base);
      files += inner.files;
      rewritten += inner.rewritten;
    } else if (entry.name.endsWith(".html")) {
      files++;
      const result = prefixLinks(readFileSync(path, "utf8"), base);
      if (result.rewritten > 0) {
        writeFileSync(path, result.html);
        rewritten += result.rewritten;
      }
    }
  }
  return { files, rewritten };
}
