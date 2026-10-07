// Unit tests for the check:python-api helpers (E14 ticket-233).
// node:test + node:assert/strict, inline fixtures, plus one seeded-violation
// test on the vendored stubs in scripts/pystubs/.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  checkCoverage,
  collectSymbols,
  isPublic,
  moduleName,
  parsePage,
  parseStub,
} from "./check-python-api.mjs";

const STUB = [
  '"""Module docstring.',
  "class NotASymbol: mentioned inside the docstring",
  '"""',
  "from . import errors as errors",
  "from ._types import Shape",
  "__version__: str",
  "_private: int",
  "def top(",
  "    path: str,",
  "    flag: bool = False,",
  ") -> None:",
  '    """Doc with a fake field:',
  "    fake: int",
  '    """',
  "    ...",
  "class Thing:",
  '    """One-line class docstring."""',
  "    size: int",
  "    def __init__(self, size: int) -> None: ...",
  "    @property",
  "    def area(self) -> float: ...",
  "    def grow(",
  "        self,",
  "        by: int,",
  "    ) -> None: ...",
  "    def _hidden(self) -> None: ...",
  "class _Private:",
  "    secret: int",
].join("\n");

test("isPublic keeps dunders except __init__ and drops _names", () => {
  assert.equal(isPublic("run"), true);
  assert.equal(isPublic("__version__"), true);
  assert.equal(isPublic("__init__"), false);
  assert.equal(isPublic("_types_helper"), false);
});

test("moduleName maps __init__.pyi to cobre and others to cobre.<stem>", () => {
  assert.equal(moduleName("__init__.pyi"), "cobre");
  assert.equal(moduleName("results.pyi"), "cobre.results");
  assert.equal(moduleName("_types.pyi"), "cobre._types");
});

test("parseStub extracts module, defs, classes, members and fields only", () => {
  const { headings, fields } = parseStub(STUB, "cobre.x");
  assert.deepEqual(headings, [
    "cobre.x",
    "cobre.x.__version__",
    "cobre.x.top",
    "cobre.x.Thing",
    "cobre.x.Thing.area",
    "cobre.x.Thing.grow",
  ]);
  assert.deepEqual([...fields.entries()], [["cobre.x.Thing", ["size"]]]);
});

test("parsePage ignores fenced headings and assigns rows to the open class", () => {
  const page = [
    "## `cobre.x`",
    "```python",
    "### `cobre.x.fenced`",
    "| `fake` | row in a fence |",
    "```",
    "### `cobre.x.Thing`",
    "| Field | Type | Description |",
    "| --- | --- | --- |",
    "| `size` | `int` | Size. |",
    "### Notes",
    "| `loose` | not under an identifier heading |",
  ].join("\n");
  const { headings, rows } = parsePage(page);
  assert.deepEqual(headings.map((h) => h.name), ["cobre.x", "cobre.x.Thing"]);
  assert.deepEqual(rows.get("cobre.x.Thing"), ["size"]);
  assert.deepEqual(rows.get("cobre.x"), []);
});

const COMPLETE = [
  "## `cobre.x`",
  "### `cobre.x.__version__`",
  "### `cobre.x.top`",
  "| `path` | a parameter table under a function is free |",
  "### `cobre.x.Thing`",
  "| `size` | `int` | Size. |",
  "#### `cobre.x.Thing.area`",
  "#### `cobre.x.Thing.grow`",
].join("\n");

test("checkCoverage passes a complete page", () => {
  const symbols = parseStub(STUB, "cobre.x");
  assert.deepEqual(checkCoverage(symbols, parsePage(COMPLETE)), []);
});

test("checkCoverage reports missing, phantom and duplicate headings", () => {
  const symbols = parseStub(STUB, "cobre.x");
  const page = COMPLETE.replace("#### `cobre.x.Thing.grow`", "#### `cobre.x.Thing.shrink`") + "\n### `cobre.x.top`";
  assert.deepEqual(checkCoverage(symbols, parsePage(page)).sort(), [
    "DUPLICATE\tcobre.x.top\tline 9",
    "MISSING\tcobre.x.Thing.grow",
    "PHANTOM\tcobre.x.Thing.shrink\tline 8",
  ]);
});

test("checkCoverage reports missing and phantom field rows", () => {
  const symbols = parseStub(STUB, "cobre.x");
  const page = COMPLETE.replace("| `size` | `int` | Size. |", "| `width` | `int` | Not a field. |");
  assert.deepEqual(checkCoverage(symbols, parsePage(page)).sort(), [
    "MISSING-FIELD\tcobre.x.Thing.size",
    "PHANTOM-FIELD\tcobre.x.Thing.width",
  ]);
});

test("a field-less class may carry a parameter table", () => {
  const symbols = parseStub("class Plain:\n    def go(self) -> None: ...", "cobre.y");
  const page = "## `cobre.y`\n### `cobre.y.Plain`\n| `case_dir` | constructor parameter |\n#### `cobre.y.Plain.go`";
  assert.deepEqual(checkCoverage(symbols, parsePage(page)), []);
});

test("seeded violation on the vendored stubs: one dropped heading is the only finding", () => {
  const dir = fileURLToPath(new URL("./pystubs/", import.meta.url));
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".pyi"))
    .sort()
    .map((name) => ({ name, text: readFileSync(dir + name, "utf8") }));
  const symbols = collectSymbols(files);
  assert.ok(symbols.headings.includes("cobre.run.run"));
  const lines = [];
  for (const name of symbols.headings) {
    lines.push(`### \`${name}\``);
    for (const field of symbols.fields.get(name) ?? []) lines.push(`| \`${field}\` | x |`);
  }
  const complete = lines.join("\n");
  assert.deepEqual(checkCoverage(symbols, parsePage(complete)), []);
  const seeded = complete.replace("### `cobre.run.run`\n", "");
  assert.deepEqual(checkCoverage(symbols, parsePage(seeded)), ["MISSING\tcobre.run.run"]);
});

test("a def or class line that carries its own docstring, and async def, are symbols", () => {
  const { headings, fields } = parseStub(
    'async def a() -> None: ...\ndef b() -> None: """Doc."""\nclass C: """Doc."""\n    n: int',
    "cobre.z",
  );
  assert.deepEqual(headings, ["cobre.z", "cobre.z.a", "cobre.z.b", "cobre.z.C"]);
  assert.deepEqual([...fields.entries()], [["cobre.z.C", ["n"]]]);
});
