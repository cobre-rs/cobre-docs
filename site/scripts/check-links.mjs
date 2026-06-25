// Internal link-check gate (E3 ticket-016, the epic's exit gate).
//
// Tickets 013/014/015 rewrote every cross-chapter mdBook link to a Starlight
// root-relative slug (e.g. `[…](/math/cut-management)`) but deliberately deferred
// broken-link detection to this script. It proves, mechanically and with no new
// dependency, that every internal link in the BUILT corpus resolves to a real
// page: it walks `dist/**/*.html`, extracts every `href`, skips the links that are
// not internal page links (external / mailto / protocol-relative / pure in-page
// fragment / asset), and asserts each remaining target maps to a file Astro
// actually emitted.
//
// Why a static-HTML crawl (not lychee/linkinator): the corpus links are entirely
// internal root-relative slugs, so no network crawler and no running server is
// needed — this keeps the zero-new-dependency, plain-Node convention of
// check-math-parity.mjs and build-versions.mjs, and runs straight over `dist/`.
//
// Resolution model (Starlight emits directory-style URLs): a slug `/math/x`
// resolves to `dist/math/x/index.html`. Links appear both with and without a
// trailing slash and may carry a `#fragment`/`?query`, all of which are stripped
// before resolution. `/` is the landing page → `dist/index.html`. The build `base`
// (DOCS_BASE) is honoured: an absolute href carrying the base prefix has it
// stripped before resolving against `dist/`. The whole tree is walked, so links
// inside `dist/pt-br/…` are validated too (intentional — not special-cased).
//
// Run AFTER `npm run build`. Exits 0 when every internal link resolves; exits 1
// listing each unresolved link as `<source-html> -> <href>`, or with a build-first
// message when `dist/` is absent.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));

if (!existsSync(distRoot)) {
  console.error(
    "check:links: dist/ not found — run `npm run build` before `npm run check:links`.",
  );
  process.exit(1);
}

// The build `base` (Architecture B: e.g. "/v0.8/"). Absolute hrefs are emitted
// with this prefix, so it is stripped before resolving against dist/. Normalised
// to a leading-and-trailing-slash form ("/" stays "/").
const rawBase = process.env.DOCS_BASE ?? "/";
const base = `/${rawBase.replace(/^\/+|\/+$/g, "")}/`.replace(/\/{2,}/g, "/");

// Asset extensions: links to these are static files, not pages, and are out of
// scope for the page-resolution check (they are emitted/copied by Astro, not
// content slugs).
const ASSET_EXT = new Set([
  ".svg",
  ".css",
  ".js",
  ".mjs",
  ".map",
  ".json",
  ".xml",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".pdf",
  ".zip",
]);

// Recursively collect every .html file under dist/ (shape mirrors
// check-math-parity.mjs's collectSourceFiles walker). The whole tree is walked,
// including dist/pt-br/, so links on every built page are checked.
function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(`${full}/`));
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

// True for links that are NOT internal page links and must be skipped:
// external schemes, protocol-relative, pure in-page fragments, empty hrefs, and
// asset files.
function shouldSkip(href) {
  if (href === "") return true;
  if (href.startsWith("#")) return true; // pure in-page fragment
  if (href.startsWith("//")) return true; // protocol-relative (external)
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return true; // http:, https:, mailto:, tel:, …
  const ext = path.extname(href.split(/[?#]/, 1)[0]).toLowerCase();
  if (ASSET_EXT.has(ext)) return true;
  return false;
}

// Resolve an internal href to its dist/ file, honouring directory-style URLs.
// Returns the resolved absolute path on success, or null if no candidate exists.
// `sourceFile` is the absolute path of the HTML page the href was found in, used
// to resolve relative (non-leading-slash) links against the page's directory.
function resolveTarget(href, sourceFile) {
  // Strip query and fragment.
  let pathname = href.split(/[?#]/, 1)[0];

  let abs;
  if (pathname.startsWith("/")) {
    // Root-relative: strip the build base prefix, then resolve under dist/.
    if (base !== "/" && pathname.startsWith(base)) {
      pathname = "/" + pathname.slice(base.length);
    } else if (base !== "/" && pathname === base.slice(0, -1)) {
      // Href equals the base without its trailing slash (e.g. "/v0.8").
      pathname = "/";
    }
    abs = path.join(distRoot, "." + pathname);
  } else {
    // Relative link: resolve against the source page's directory.
    abs = path.resolve(path.dirname(sourceFile), pathname);
  }

  // Candidate forms, in order: directory-style index.html, an .html sibling, the
  // literal path as a file. `/` (→ distRoot) is covered by the index.html form.
  const candidates = [path.join(abs, "index.html"), `${abs}.html`, abs];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

const htmlFiles = collectHtmlFiles(distRoot).sort();
const hrefPattern = /href="([^"]*)"/g;
const failures = [];
let linksChecked = 0;

for (const sourceFile of htmlFiles) {
  const html = readFileSync(sourceFile, "utf8");
  const rel = sourceFile.slice(distRoot.length);
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (shouldSkip(href)) continue;
    linksChecked += 1;
    if (resolveTarget(href, sourceFile) === null) {
      failures.push({ source: rel, href });
    }
  }
}

if (failures.length > 0) {
  console.error(
    `check:links: ${failures.length} unresolved internal link(s) across ${htmlFiles.length} HTML file(s):\n`,
  );
  for (const f of failures) {
    console.error(`  ${f.source} -> ${f.href}`);
  }
  process.exit(1);
}

console.log(
  `check:links: ${htmlFiles.length} HTML files crawled, ${linksChecked} internal links checked, 0 broken.`,
);
process.exit(0);
