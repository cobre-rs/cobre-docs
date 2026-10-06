// Unit fixture for the refresh:error-kinds pure helpers (ticket-214a).
//
// node:test + node:assert/strict, mirroring refresh-schemas.test.mjs. Every
// case runs on an inline Rust fixture: no git, no filesystem.
import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEnumVariants,
  helperConstructors,
  stripTestCode,
  isTestOnlyPath,
  listSourcePaths,
  constructorSites,
  buildVendored,
  serialize,
  diffVendored,
} from "./refresh-error-kinds.mjs";

const rust = (strings) => String.raw(strings).replace(/^\n/, "");

const ENUM_SRC = rust`
use std::path::PathBuf;

/// Doc for E, which mentions E::A.
#[derive(Debug, thiserror::Error)]
pub enum E {
    /// Unit variant.
    A,
    /// Struct variant whose attribute string holds braces.
    #[error("b {path}: {message}")]
    B {
        /// Field doc.
        path: PathBuf,
        message: String,
    },
    #[error(
        "c {x} \
         continued"
    )]
    C(u8, String),
    // a comment with an unbalanced { brace
    D = 4,
}

impl E {
    pub fn b(path: impl AsRef<Path>, message: impl Into<String>) -> Self {
        Self::B {
            path: path.as_ref().to_path_buf(),
            message: message.into(),
        }
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::A => "A",
            Self::B { .. } => "B",
        }
    }

    const fn d() -> Self {
        // the variant follows a comment
        Self::D
    }
}

impl Other {
    fn a() -> Self {
        Self::A
    }
}
`;

const VARIANTS = ["A", "B", "C", "D"];
const HELPERS = new Map([
  ["b", "B"],
  ["d", "D"],
]);
const sites = (source) =>
  constructorSites(stripTestCode(source), "E", VARIANTS, HELPERS).map(
    ({ variant, line }) => `${variant}:${line}`,
  );

test("parseEnumVariants reads unit, struct and tuple variants in declaration order", () => {
  assert.deepEqual(parseEnumVariants(ENUM_SRC, "E"), ["A", "B", "C", "D"]);
});

test("parseEnumVariants ignores doc comments, attributes with braces in strings, and a discriminant", () => {
  const source = rust`
#[derive(Debug)]
pub(crate) enum Kind {
    /// Kind::X is only a doc mention.
    #[error("{a} and {b}")]
    First,
    Second = 2,
}
`;
  assert.deepEqual(parseEnumVariants(source, "Kind"), ["First", "Second"]);
});

test("parseEnumVariants throws a named error for a missing enum", () => {
  assert.throws(
    () => parseEnumVariants(ENUM_SRC, "Missing"),
    /refresh:error-kinds: enum Missing not found/,
  );
});

test("helperConstructors maps fns whose body starts Self::Variant", () => {
  assert.deepEqual(helperConstructors(ENUM_SRC, "E"), HELPERS);
});

test("helperConstructors skips fns in other impl blocks and bodies that do not start Self::Variant", () => {
  const helpers = helperConstructors(ENUM_SRC, "E");
  assert.equal(helpers.has("kind"), false);
  assert.equal(helpers.has("a"), false);
});

test("isTestOnlyPath flags tests.rs and test_support.rs only", () => {
  assert.equal(isTestOnlyPath("crates/x/src/tests.rs"), true);
  assert.equal(isTestOnlyPath("crates/x/src/test_support.rs"), true);
  assert.equal(isTestOnlyPath("crates/x/src/lib.rs"), false);
  assert.equal(isTestOnlyPath("crates/x/src/my_tests.rs"), false);
});

test("stripTestCode blanks comment lines and keeps the line count", () => {
  const source = rust`
/// E::A in a doc comment
fn live() -> E {
    // E::B in a line comment
    E::C(1)
}
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.doesNotMatch(stripped, /E::A|E::B/);
  assert.match(stripped, /E::C\(1\)/);
  assert.deepEqual(sites(source), ["C:4"]);
});

test("stripTestCode drops a #[cfg(test)] mod whose body holds braces in strings and chars", () => {
  const source = rust`
fn live() -> E { E::A }

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    fn one() {
        let s = "}";
        let q = "\"}";
        let c = '{';
    }
    fn two() {
        let e = E::D;
    }
}

fn after() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["A:1", "C:16"]);
});

test("stripTestCode keeps a live constructor that follows a #[cfg(test)] use at the top of the file", () => {
  const source = rust`
#[cfg(test)]
use crate::E::A;

fn live() -> E {
    E::B { path: p, message: m }
}
`;
  assert.deepEqual(sites(source), ["B:5"]);
});

test("stripTestCode drops a single #[cfg(test)] fn in the middle of the file and keeps the rest", () => {
  const source = rust`
fn one() -> E { E::A }

#[cfg(test)]
fn only_in_tests() -> E { E::B { path: p, message: m } }

fn two() -> E { E::C(2) }
`;
  assert.deepEqual(sites(source), ["A:1", "C:6"]);
});

test("constructorSites excludes a single-line match arm pattern but counts the arm's constructor", () => {
  const source = rust`
match x {
    E::A => E::B { path: p, message: m },
    E::B { .. } => 1,
    E::C(..) => 2,
}
`;
  assert.deepEqual(sites(source), ["B:2"]);
});

test("constructorSites excludes a multi-line struct pattern whose => follows the closing brace", () => {
  const source = rust`
match x {
    E::B {
        path,
        message,
    } => path,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes an alternation line that starts with |", () => {
  const source = rust`
match x {
    E::A
    | E::C(_)
    | E::D if ok(x) => 1,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes matches! and let-pattern uses but counts a let-bound constructor", () => {
  const source = rust`
let a = matches!(x, E::A | E::D);
let b = matches!(x, E::B { .. });
if let E::B { path, .. } = x {}
let built = E::C(4);
`;
  assert.deepEqual(sites(source), ["C:4"]);
});

test("constructorSites counts a closure constructor and a qualified path, not a longer enum name", () => {
  const source = rust`
let f = |e| E::C(e);
let g = crate::validation::E::A;
let h = OtherE::A;
let ok = a || E::D == x;
`;
  assert.deepEqual(sites(source), ["C:1", "A:2", "D:4"]);
});

test("constructorSites counts a helper call as its variant and ignores calls to other fns", () => {
  const source = rust`
let a = E::b("p", "m");
let b = E::d();
let c = E::kind(&x);
let d = E::b;
`;
  assert.deepEqual(sites(source), ["B:1", "D:2"]);
});

test("buildVendored keeps declaration order, the D-214a-2 key order, and a null emitter", () => {
  const vendored = buildVendored("v0.0.0", [
    {
      name: "E",
      source: "crates/x/src/e.rs",
      variants: ["A", "B"],
      emitters: new Map([["B", "crates/x/src/use.rs:7"]]),
    },
  ]);
  assert.deepEqual(Object.keys(vendored), ["generatedBy", "ref", "enums"]);
  assert.deepEqual(Object.keys(vendored.enums[0]), [
    "name",
    "source",
    "variants",
  ]);
  assert.deepEqual(vendored.enums[0].variants, [
    { name: "A", emitted: false, emitter: null },
    { name: "B", emitted: true, emitter: "crates/x/src/use.rs:7" },
  ]);
});

test("serialize is deterministic two-space JSON with a trailing newline", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A"], emitters: new Map() },
  ]);
  const text = serialize(vendored);
  assert.equal(text, serialize(vendored));
  assert.equal(text.endsWith("}\n"), true);
  assert.equal(text.startsWith('{\n  "generatedBy"'), true);
  assert.deepEqual(JSON.parse(text), vendored);
});

test("diffVendored is empty for a byte-identical copy and names a flipped variant", () => {
  const vendored = buildVendored("v0.0.0", [
    {
      name: "E",
      source: "e.rs",
      variants: ["A", "B"],
      emitters: new Map([["A", "e.rs:1"]]),
    },
  ]);
  const text = serialize(vendored);
  assert.deepEqual(diffVendored(text, vendored), []);

  const flipped = JSON.parse(text);
  flipped.enums[0].variants[1].emitted = true;
  const drift = diffVendored(serialize(flipped), vendored);
  assert.equal(drift.length, 1);
  assert.match(
    drift[0],
    /^E\.B \(vendored emitted=true emitter=null; v0\.0\.0 has emitted=false/,
  );

  const moved = JSON.parse(text);
  moved.enums[0].variants[0].emitter = "e.rs:2";
  const [change] = diffVendored(serialize(moved), vendored);
  assert.match(change, /^E\.A \(vendored emitted=true emitter=e\.rs:2;/);
});

test("diffVendored reports a ref change, a missing variant, an extra variant, and a layout-only change", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A", "B"], emitters: new Map() },
  ]);
  const older = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A", "Gone"], emitters: new Map() },
  ]);
  older.ref = "v0.0.-1";
  const drift = diffVendored(serialize(older), vendored);
  assert.deepEqual(drift, [
    "ref (vendored v0.0.-1, expected v0.0.0)",
    "E.B (missing from the vendored copy)",
    "E.Gone (not declared at v0.0.0)",
  ]);

  const compact = JSON.stringify(vendored);
  assert.deepEqual(diffVendored(compact, vendored), [
    "scripts/error-kinds.json (layout differs from the regenerated file)",
  ]);
});

test("diffVendored reports malformed JSON instead of throwing", () => {
  const vendored = buildVendored("v0.0.0", []);
  const drift = diffVendored("{ not json", vendored);
  assert.equal(drift.length, 1);
  assert.match(drift[0], /not well-formed JSON/);
});

// --- Lexer: raw strings, lifetimes, block comments, nested `;`, string attrs --

test("MA1 stripTestCode skips raw strings holding quotes, braces and a trailing backslash", () => {
  const windowsPath = rust`
#[cfg(test)]
mod tests {
    const WIN: &str = r"C:\dir\";
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(windowsPath), ["C:7"]);
  const jsonBody = rust`
#[cfg(test)]
mod tests {
    const JSON: &str = r#"{"k": "}"#;
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(jsonBody), ["C:7"]);
});

test("MA2 stripTestCode tells lifetimes and labels from char literals, escapes included", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn f<'a>(s: &'a str, t: &'a str, u: &'_ str) -> char { '}' }
    fn q() -> char { '\"' }
    fn r() -> char { '\'' }
    fn l() { 'outer: loop { break 'outer; } }
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:10"]);
});

test("MA3 stripTestCode skips a block comment holding a brace inside a #[cfg(test)] mod", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    /* a stray } in a block comment */
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("MA4 stripTestCode ends a #[cfg(test)] item at its own ;, not a ; nested in [ ] or ( )", () => {
  const source = rust`
#[cfg(test)]
const FIXTURE: [E; 1] = [E::A];
#[cfg(test)]
fn t(buf: [u8; 4]) -> E { E::D }

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:6"]);
});

test("MA5 stripTestCode skips a #[cfg(test)] string inside an already-stripped test mod", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn split(src: &str) -> &str { src.split("#[cfg(test)]").next().unwrap() }
    fn g() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.deepEqual(sites(source), ["C:7"]);
});

test("stripTestCode resumes after a stripped item, so a #[cfg(test)] nested inside it leaks nothing", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    #[cfg(test)]
    fn inner() -> E { E::A }
    fn other() -> E { E::D }
}

fn live() -> E { E::C(1) }
`;
  const stripped = stripTestCode(source);
  assert.equal(stripped.split("\n").length, source.split("\n").length);
  assert.deepEqual(sites(source), ["C:8"]);
});

test("stripTestCode does not let a lifetime swallow the brace that follows it", () => {
  const source = rust`
#[cfg(test)]
mod tests {
    fn g<'a, 'b>(x: &'a u8) where 'a: 'b{ 1 }
    fn h() -> E { E::A }
}

fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("stripTestCode ignores a #[cfg(test)] that only appears in a live string or comment", () => {
  const source = rust`
let marker = "#[cfg(test)]";
/* #[cfg(test)] */
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:3"]);
});

// --- Rule: nested patterns, guards, closures, matches!, strings and comments --

test("MD1 constructorSites excludes a variant pattern nested inside another pattern", () => {
  const source = rust`
match err {
    Self::Io(E::B { .. })
    | Self::Other => 1,
    Self::Io(E::A) => 2,
    Some(E::D) => 3,
    Err(E::C(_)) => 4,
}
fn live() -> Result<(), E> {
    if bad { return Err(E::C(1)); }
    match n {
        Some(0) => Err(E::B { path: p, message: m }),
        _ => Ok(()),
    }
}
`;
  assert.deepEqual(sites(source), ["C:9", "B:11"]);
});

test("constructorSites excludes a nested pattern that ends in ] and counts a constructor in a vec!", () => {
  const source = rust`
match x {
    Some([E::D]) => 1,
    _ => 2,
}
let v = vec![E::C(1)];
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD1 constructorSites excludes a match arm with a guard, single- and multi-line", () => {
  const source = rust`
match x {
    E::A if ok(x) => 1,
    E::B { path, .. }
        if path.exists() =>
    {
        2
    }
    _ => 3,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes a guarded nested pattern", () => {
  const source = rust`
match x {
    Some(E::D) if ok(x) => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("SD2 constructorSites counts a closure constructor that starts its line", () => {
  const source = rust`
let parsed = parse(x).map_err(
    |message| E::B {
        path: p,
        message,
    },
)?;
let other = y.ok_or_else(
    || E::A,
)?;
`;
  assert.deepEqual(sites(source), ["B:2", "A:8"]);
});

test("constructorSites still excludes an alternation line that starts with | after a closure-free prefix", () => {
  const source = rust`
match x {
    E::C(_)
    | E::A
    | E::B { .. } => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites excludes a variant in a tuple pattern on a line that starts with |", () => {
  const source = rust`
match pair {
    Pair::One
    | Pair::Two(E::B, _) => 1,
    _ => 2,
}
match pair {
    | E::A | Pair::Two(E::D, 1) => 1,
    _ => 2,
}
`;
  assert.deepEqual(sites(source), []);
});

test("constructorSites counts a constructor on a line after a let without an initializer", () => {
  const source = rust`
let total;
return Err(E::C(1));
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("SD3 constructorSites excludes a rustfmt-wrapped multi-line matches! pattern", () => {
  const source = rust`
if matches!(
    err,
    E::B { .. }
) {}
let k = matches!(x, E::A) && emit(E::C(1));
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD4 constructorSites ignores E::V in strings, trailing comments and block comments", () => {
  const source = rust`
let s = "see E::A for details";
let t = r#"E::B {"#;
let n = 1; // not E::D
/*
 * E::A in a block comment
 */
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:7"]);
});

test("constructorSites is not opened by a matches!( inside a string", () => {
  const source = rust`
let s = "matches!(";
let c = E::C(1);
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("SD5 stripTestCode never strips past the block that encloses a #[cfg(test)] field", () => {
  const source = rust`
struct Counter {
    #[cfg(test)]
    calls: usize,
    n: u8,
}

impl Counter {
    fn fail() -> E { E::C(1) }
}
`;
  assert.deepEqual(sites(source), ["C:8"]);
});

test("SP1 constructorSites excludes a let-else pattern but counts the constructor in its else", () => {
  const source = rust`
let E::B { path, .. } = x else { return Err(E::C(1)) };
let Some(v) = opt else {
    return Err(E::A);
};
`;
  assert.deepEqual(sites(source), ["C:1", "A:3"]);
});

test("SP2 stripTestCode drops a #[cfg(test)] impl block and keeps the next live item", () => {
  const source = rust`
#[cfg(test)]
impl E {
    fn mock() -> Self { E::A }
}
fn live() -> E { E::C(1) }
`;
  assert.deepEqual(sites(source), ["C:5"]);
});

test("SD7 parseEnumVariants reads a last variant without a trailing comma and a #[from] field", () => {
  const source = rust`
pub enum E {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    Last { x: HashMap<String, Vec<(u8, u8)>> }
}
`;
  assert.deepEqual(parseEnumVariants(source, "E"), ["Io", "Last"]);
});

// --- Guards: empty listing, empty enum, wrong-shape copy ------------------------

test("listSourcePaths keeps sorted crates/*/src .rs paths and drops test-only and other files", () => {
  const stdout = [
    "crates/b/src/lib.rs",
    "crates/a/src/tests.rs",
    "crates/a/src/validation/mod.rs",
    "crates/a/src/test_support.rs",
    "crates/a/tests/integration.rs",
    "crates/a/src/data.json",
    "crates/a/Cargo.toml",
    "",
  ].join("\n");
  assert.deepEqual(listSourcePaths(stdout), [
    "crates/a/src/validation/mod.rs",
    "crates/b/src/lib.rs",
  ]);
});

test("listSourcePaths throws a named error for an empty listing or one without source files", () => {
  assert.throws(
    () => listSourcePaths(""),
    /refresh:error-kinds: no crates\/\*\/src \.rs files/,
  );
  assert.throws(
    () => listSourcePaths("crates/a/src/tests.rs\ncrates/a/Cargo.toml\n"),
    /refresh:error-kinds: no crates\/\*\/src \.rs files/,
  );
});

test("parseEnumVariants throws a named error for an enum with no variants", () => {
  const source = rust`
pub enum E {
    // nothing declared
}
`;
  assert.throws(
    () => parseEnumVariants(source, "E"),
    /refresh:error-kinds: enum E has no variants/,
  );
});

test("SD6 diffVendored names a well-formed but wrong-shape copy instead of throwing", () => {
  const vendored = buildVendored("v0.0.0", [
    { name: "E", source: "e.rs", variants: ["A"], emitters: new Map() },
  ]);
  for (const text of [
    "{}",
    "null",
    "[]",
    '{"ref":"v0.0.0","enums":5}',
    '{"enums":[5]}',
    '{"enums":[{"name":"E"}]}',
    '{"enums":[{"name":"E","variants":[null]}]}',
    '{"enums":[{"variants":[]}]}',
    '{"enums":[{"name":7,"variants":[]}]}',
  ]) {
    const drift = diffVendored(text, vendored);
    assert.equal(drift.length, 1, text);
    assert.match(drift[0], /does not have the vendored shape/, text);
  }
});

test("stripTestCode masks raw byte and raw C strings without swallowing the code after them", () => {
  for (const literal of [
    String.raw`br"C:\"`,
    String.raw`br#"x "y"#`,
    String.raw`cr"z\"`,
  ]) {
    const source = `const S: &[u8] = ${literal};\nfn live() -> E { E::C(1) }\n`;
    assert.deepEqual(sites(source), ["C:2"], literal);
  }
});

test("stripTestCode masks a nested block comment without swallowing the code after it", () => {
  const source = rust`
/* outer /* inner */ "still comment */
fn live() -> E { E::C(1) }
/* outer /* inner */ E::A */
`;
  assert.deepEqual(sites(source), ["C:2"]);
});

test("a #[cfg(test)] field inside an E::V struct literal keeps the literal's own closing brace", () => {
  const source = rust`
let e = E::B {
    #[cfg(test)]
    trace: 1,
    path: p,
};
match y {
    E::A => 1,
}
`;
  assert.deepEqual(sites(source), ["B:1"]);
});
