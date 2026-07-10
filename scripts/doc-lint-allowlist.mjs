// Shared committed baseline allowlist reader (Epic 04 ticket-015, R4).
//
// `scripts/doc-lint-allow.txt` is a ratchet: it grandfathers pre-existing
// strict-zone hits (each with a rationale) so `check-doc-voice.mjs` and
// `check-doc-version.mjs` land green on the current corpus while still
// failing on any NEW violation with no matching entry. This mirrors cobre's
// own `scripts/ci/allow-rationale-allowlist.txt` convention.
//
// Format: one entry per grandfathered hit, one per line:
//   <relpath>:<line>  <rule-id>  # rationale
// `<relpath>` is relative to `src/content/docs/` (forward slashes). Blank
// lines and lines starting with `#` are comments and are ignored. A
// malformed non-comment, non-blank line is a NAMED failure — the gate must
// not silently ignore a typo that would otherwise widen the allowlist's
// effective grandfather set. A missing file is treated as an empty allowlist
// (a fresh checkout with no allowlist yet is not a crash).

import { readFileSync, existsSync } from "node:fs";

const ENTRY_RE = /^(\S+):(\d+)\s+(\S+)\s+#\s*(.+)$/;

/**
 * Parse the allowlist file into a Map of "relpath:lineno" -> rule-id[].
 * Throws a descriptive Error on a malformed non-comment/non-blank line.
 *
 * @param {string} path absolute path to scripts/doc-lint-allow.txt
 * @returns {Map<string, string[]>}
 */
export function loadAllowlist(path) {
  const map = new Map();
  if (!existsSync(path)) return map;

  const lines = readFileSync(path, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;

    const m = ENTRY_RE.exec(line);
    if (!m) {
      throw new Error(
        `doc-lint-allow.txt:${i + 1}: malformed entry ${JSON.stringify(raw)} ` +
          `— expected '<relpath>:<line>  <rule-id>  # rationale'`,
      );
    }
    const [, relpath, lineno, ruleId] = m;
    const key = `${relpath}:${lineno}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ruleId);
  }
  return map;
}

/**
 * A `path:line` pair is grandfathered if it has ANY entry in the allowlist,
 * regardless of rule-id (the rule-id column is documentation, not a filter —
 * a line is either a known, reviewed pre-existing hit or it is not).
 *
 * @param {Map<string, string[]>} allowlist
 * @param {string} relpath
 * @param {number} lineno
 * @returns {boolean}
 */
export function isAllowlisted(allowlist, relpath, lineno) {
  return allowlist.has(`${relpath}:${lineno}`);
}
