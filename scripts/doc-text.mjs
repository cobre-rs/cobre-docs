// Shared prose-preprocessing helpers for the doc gates (ticket-008).
//
// Pure ESM, no filesystem access. `proseLines` is used by check-doc-voice.mjs;
// `buildBlocks`, `lineForOffset` and `inRuleSelfReference` are used by
// check-doc-version.mjs. They were extracted here, unchanged, so a further gate
// can reuse the same preprocessing instead of carrying a third private copy.

const INLINE_CODE = /`[^`]*`/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

// ---------------------------------------------------------------------------
// Blank fenced code, inline code spans, and HTML comments; return
// (lineno, prose) pairs, preserving line numbers for reporting — port of
// `_prose_lines`.
// ---------------------------------------------------------------------------
export function proseLines(text) {
  const out = [];
  let inFence = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineno = i + 1;
    const line = lines[i];
    const stripped = line.replace(/^\s+/, "");
    if (stripped.startsWith("```") || stripped.startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    let prose = line.replace(INLINE_CODE, " ");
    prose = prose.replace(HTML_COMMENT, " ");
    // Strip markdown bold markers ("**"): a hedge/hype phrase is routinely
    // wrapped for emphasis (e.g. "not merely **policy quality**" or "is
    // **removed entirely**"), and the literal "**" would otherwise break a
    // `\s+`-only regex expecting the words to be separated by plain
    // whitespace. Stripping (not blanking to a space) keeps the surrounding
    // words adjacent, matching how the phrase actually reads once rendered.
    prose = prose.replace(/\*\*/g, "");
    out.push([lineno, prose]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Split text into paragraph BLOCKS (contiguous non-blank lines), each with a
// joined single-space-separated string and a per-physical-line offset table,
// so a match found in the joined string can be attributed back to the
// physical line on which it starts. This is what lets a narration phrase
// split across a hard-wrapped line break still be detected (see
// check-doc-version.mjs's module header) without losing line-number precision
// for well-behaved single-line hits (the common case).
// ---------------------------------------------------------------------------
export function buildBlocks(text) {
  const rawLines = text.split("\n");
  const rawBlocks = [];
  let current = null;

  for (let i = 0; i < rawLines.length; i++) {
    const lineno = i + 1;
    if (rawLines[i].trim() === "") {
      if (current) {
        rawBlocks.push(current);
        current = null;
      }
      continue;
    }
    if (!current) current = { startLine: lineno, lines: [] };
    // Strip markdown bold markers ("**") before matching: a narration verb is
    // routinely wrapped for emphasis (e.g. "is **removed entirely** in the
    // vX.Y.Z restructure"), and the literal "**" between "entirely" and "in"
    // would otherwise break a `\s+`-only narration regex. Stripping (not
    // blanking to a space) keeps the surrounding words adjacent, which is
    // what the phrase actually reads as once rendered. Length changes are
    // harmless here — this gate reports whole-phrase text, not a fixed-width
    // character window (contrast check-doc-voice.mjs's 30-char hedge lookahead).
    current.lines.push(rawLines[i].replace(/\*\*/g, ""));
  }
  if (current) rawBlocks.push(current);

  return rawBlocks.map((b) => {
    let joined = "";
    const lineStarts = [];
    for (let k = 0; k < b.lines.length; k++) {
      lineStarts.push(joined.length);
      joined += b.lines[k];
      if (k < b.lines.length - 1) joined += " ";
    }
    return { startLine: b.startLine, joined, lineStarts };
  });
}

// ---------------------------------------------------------------------------
// Self-reference guard (ticket-028). The corpus's own "Code as ground truth"
// principle sentence STATES the no-version-annotations rule by naming the very
// constructs the narration patterns hunt for: "… it does not carry version
// annotations, deprecation notices, or migration notes …". A clause that
// NEGATES carrying such notes is describing the policy, not narrating a version
// change, so a bare-lexical narration hit ("migration", "deprecated") landing
// inside it is a false positive. Detected conservatively: the clause containing
// the match — bounded by the nearest sentence/clause breaks on each side — must
// contain an explicit "does not carry" / "carries no" / "carry no" / "without"
// / "no" negation governing an "annotations|notices|notes" enumeration. Real
// change-narration ("a migration guide added in v0.9") never has this shape, so
// the exclusion cannot mask a genuine version annotation.
// ---------------------------------------------------------------------------
const NEGATED_ANNOTATION_ENUM =
  /\b(?:does not carry|do not carry|carries no|carry no|without|no)\b[^.;]*\b(?:annotations?|notices?|notes?)\b/i;

export function inRuleSelfReference(joined, matchIndex) {
  const clauseStart =
    Math.max(
      joined.lastIndexOf(".", matchIndex - 1),
      joined.lastIndexOf(";", matchIndex - 1),
    ) + 1;
  const nextDot = joined.indexOf(".", matchIndex);
  const clauseEnd = nextDot === -1 ? joined.length : nextDot;
  return NEGATED_ANNOTATION_ENUM.test(joined.slice(clauseStart, clauseEnd));
}

// Map a character offset within a block's joined text back to its physical
// line number.
export function lineForOffset(block, offset) {
  let lineIdx = 0;
  for (let k = 0; k < block.lineStarts.length; k++) {
    if (block.lineStarts[k] <= offset) lineIdx = k;
    else break;
  }
  return block.startLine + lineIdx;
}
