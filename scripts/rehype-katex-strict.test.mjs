// Unit fixture for scripts/rehype-katex-strict.mjs (E15 ticket-247, GRD-11).
//
// Trees are built as hast by hand and run through the real rehype-katex and then
// the recorder, with a stub vfile that mirrors how vfile-message derives
// line/column from `place`. The seeded violations are the inputs that are strict
// errors on the installed KaTeX: `\text{hm³}` and `\text{§2}` (unknownSymbol) and
// `é` (unicodeTextInMathMode). A bare `x^3` is the clean control, and
// `\text{hm³}` under the default options is the control that shows why the build
// sets `strict: "error"`.
// node:test + node:assert/strict, picked up by the `scripts/*.test.mjs` glob in
// `npm test`.
import test from "node:test";
import assert from "node:assert/strict";
import rehypeKatex from "rehype-katex";
import { KatexStrictError, createKatexStrict } from "./rehype-katex-strict.mjs";

const STRICT = { strict: "error" };

function math(value, { display = false, position } = {}) {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [display ? "math-display" : "math-inline"] },
    children: [{ type: "text", value }],
    ...(position && { position }),
  };
}

function stubFile(path) {
  return {
    path,
    messages: [],
    message(reason, options) {
      const start = options.place?.start;
      const message = {
        reason,
        cause: options.cause,
        source: options.source,
        ruleId: options.ruleId,
        line: start?.line,
        column: start?.column,
      };
      this.messages.push(message);
      return message;
    },
  };
}

function renderPage(katexStrict, file, elements, options) {
  const tree = { type: "root", children: elements };
  rehypeKatex(options)(tree, file);
  katexStrict.rehypeKatexStrict()(tree, file);
  return tree;
}

function hookOf(katexStrict) {
  return katexStrict.integration.hooks["astro:build:done"];
}

function quietWarn(t) {
  return t.mock.method(console, "warn", () => {});
}

function isRendered(node) {
  return node.properties.className.includes("katex");
}

test("a unicode superscript inside \\text records one violation and the hook throws", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const tree = renderPage(
    k,
    stubFile("docs/a.md"),
    [math("\\text{hm³}")],
    STRICT,
  );
  assert.equal(k.violations.length, 1);
  assert.equal(k.violations[0].path, "docs/a.md");
  assert.match(k.violations[0].reason, /\[unknownSymbol\]/);
  assert.ok(isRendered(tree.children[0]), "the page still renders");
  assert.throws(hookOf(k), (error) => {
    assert.ok(error instanceof KatexStrictError);
    assert.equal(error.name, "KatexStrictError");
    assert.match(
      error.message,
      /^rehype-katex-strict: 1 KaTeX error\(s\) in 1 file\(s\):\n/,
    );
    assert.match(error.message, /\n {2}docs\/a\.md:\?:\? KaTeX parse error/);
    return true;
  });
});

test("a section sign inside \\text in display math is recorded", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(
    k,
    stubFile("docs/a.md"),
    [math("\\text{§2}", { display: true })],
    STRICT,
  );
  assert.equal(k.violations.length, 1);
  assert.match(k.violations[0].reason, /\[unknownSymbol\]/);
});

test("an accented letter in math mode is recorded", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile("docs/a.md"), [math("é")], STRICT);
  assert.equal(k.violations.length, 1);
  assert.match(k.violations[0].reason, /\[unicodeTextInMathMode\]/);
});

test("clean math records nothing, renders, and the hook returns", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const tree = renderPage(k, stubFile("docs/a.md"), [math("x^3")], STRICT);
  assert.deepEqual(k.violations, []);
  assert.ok(isRendered(tree.children[0]));
  assert.equal(hookOf(k)(), undefined);
});

test("violations across files are counted per violation and per file", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(
    k,
    stubFile("docs/a.md"),
    [math("\\text{hm³}"), math("\\text{§2}")],
    STRICT,
  );
  renderPage(k, stubFile("docs/b.md"), [math("é")], STRICT);
  assert.equal(k.violations.length, 3);
  assert.throws(hookOf(k), (error) => {
    const lines = error.message.split("\n");
    assert.equal(
      lines[0],
      "rehype-katex-strict: 3 KaTeX error(s) in 2 file(s):",
    );
    assert.equal(lines.length, 4);
    assert.match(lines[1], /^ {2}docs\/a\.md:\?:\? .*\[unknownSymbol\]/);
    assert.match(lines[2], /^ {2}docs\/a\.md:\?:\? .*\[unknownSymbol\]/);
    assert.match(
      lines[3],
      /^ {2}docs\/b\.md:\?:\? .*\[unicodeTextInMathMode\]/,
    );
    assert.notEqual(lines[1], lines[2]);
    return true;
  });
});

test("the default options record nothing for a unicode superscript (why the build sets strict: error)", (t) => {
  const warn = quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile("docs/a.md"), [math("\\text{hm³}")], {});
  assert.deepEqual(k.violations, []);
  assert.ok(
    warn.mock.calls.some((call) =>
      /strict mode is set to 'warn'.*\[unknownSymbol\]/.test(
        String(call.arguments[0]),
      ),
    ),
    "KaTeX reports the input as a strict violation under warn",
  );
  assert.equal(hookOf(k)(), undefined);
});

test("a parse error is recorded under the default options", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile("docs/a.md"), [math("\\frac{1}{")], {});
  assert.equal(k.violations.length, 1);
  assert.match(k.violations[0].reason, /Unexpected end of input/);
});

test("only messages whose source is rehype-katex are recorded", () => {
  const k = createKatexStrict();
  const file = stubFile("docs/a.md");
  file.message("Could not render math with KaTeX", { source: "remark-lint" });
  file.message("Could not render math with KaTeX", {});
  file.message("Unrelated reason", { source: "rehype-katex" });
  k.rehypeKatexStrict()({ type: "root", children: [] }, file);
  assert.deepEqual(
    k.violations.map((v) => v.reason),
    ["Unrelated reason"],
  );
});

test("a message without an Error cause reports its own reason", () => {
  const k = createKatexStrict();
  const file = stubFile("docs/a.md");
  file.message("No cause", { source: "rehype-katex" });
  file.message("String cause", { source: "rehype-katex", cause: "boom" });
  k.rehypeKatexStrict()({ type: "root", children: [] }, file);
  assert.deepEqual(
    k.violations.map((v) => v.reason),
    ["No cause", "String cause"],
  );
});

test("a file without a path is reported as <unknown file>", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile(undefined), [math("é")], STRICT);
  assert.equal(k.violations[0].path, "<unknown file>");
  assert.throws(hookOf(k), /\n {2}<unknown file>:\?:\? /);
});

test("line and column come from the math element position", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const position = {
    start: { line: 7, column: 12, offset: 90 },
    end: { line: 7, column: 16, offset: 94 },
  };
  renderPage(k, stubFile("docs/a.md"), [math("é", { position })], STRICT);
  assert.equal(k.violations[0].line, 7);
  assert.equal(k.violations[0].column, 12);
  assert.throws(hookOf(k), /\n {2}docs\/a\.md:7:12 /);
});

test("running the recorder twice on one file records each violation once", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const file = stubFile("docs/a.md");
  const tree = renderPage(k, file, [math("é")], STRICT);
  k.rehypeKatexStrict()(tree, file);
  assert.equal(k.violations.length, 1);
});

test("violations that differ only by reason are both kept", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile("docs/a.md"), [math("é"), math("\\text{§2}")], STRICT);
  assert.equal(k.violations.length, 2);
  assert.equal(k.violations[0].path, k.violations[1].path);
  assert.equal(k.violations[0].line, k.violations[1].line);
});

test("the same violation in two files is recorded once per file", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  renderPage(k, stubFile("docs/a.md"), [math("é")], STRICT);
  renderPage(k, stubFile("docs/b.md"), [math("é")], STRICT);
  assert.deepEqual(
    k.violations.map((v) => v.path),
    ["docs/a.md", "docs/b.md"],
  );
  assert.throws(hookOf(k), /in 2 file\(s\):/);
});

test("the same violation at two positions in one file is recorded twice", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const at = (line, column) => ({
    start: { line, column, offset: 0 },
    end: { line, column: column + 1, offset: 1 },
  });
  renderPage(
    k,
    stubFile("docs/a.md"),
    [
      math("é", { position: at(3, 5) }),
      math("é", { position: at(3, 9) }),
      math("é", { position: at(8, 5) }),
    ],
    STRICT,
  );
  assert.deepEqual(
    k.violations.map((v) => [v.line, v.column]),
    [
      [3, 5],
      [3, 9],
      [8, 5],
    ],
  );
});

test("violations is the live array behind the hook", (t) => {
  quietWarn(t);
  const k = createKatexStrict();
  const live = k.violations;
  renderPage(k, stubFile("docs/a.md"), [math("é")], STRICT);
  assert.equal(live.length, 1);
  live.length = 0;
  assert.equal(hookOf(k)(), undefined);
});

test("two instances share no state", (t) => {
  quietWarn(t);
  const first = createKatexStrict();
  const second = createKatexStrict();
  renderPage(first, stubFile("docs/a.md"), [math("é")], STRICT);
  assert.equal(first.violations.length, 1);
  assert.deepEqual(second.violations, []);
  assert.equal(hookOf(second)(), undefined);
  assert.throws(hookOf(first), KatexStrictError);
});

test("the integration is named katex-strict and hooks astro:build:done", () => {
  const { integration } = createKatexStrict();
  assert.equal(integration.name, "katex-strict");
  assert.deepEqual(Object.keys(integration.hooks), ["astro:build:done"]);
});
