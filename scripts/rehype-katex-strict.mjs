// KaTeX strict-mode failures as a build error.
//
// KaTeX's default `strict: "warn"` only prints to the console, and setting
// `strict: "error"` is not enough on its own: rehype-katex renders each math
// element inside a `try`, records any KaTeX error as a vfile message
// (`source: "rehype-katex"`), and re-renders the same math with
// `strict: "ignore"`, so the build keeps going.
//
// A rehype plugin that throws does not fail the build either: Astro's content
// glob loader renders every `.md` entry inside its own `try`, logs the error and
// stores the entry without HTML, so the page ships empty with exit 0. This module
// therefore records instead of throwing:
//
//   - `rehypeKatexStrict` runs after rehype-katex, appends every message with
//     `source: "rehype-katex"` to `violations` and never throws, so every page
//     still renders;
//   - `integration` runs at `astro:build:done`, which Astro invokes without a
//     `catch`, and throws one `KatexStrictError` listing every recorded
//     violation, so `.md` and `.mdx` pages fail the build alike and all
//     violations are reported at once.
//
// Both halves share the state of one `createKatexStrict()` call. Register
// `[rehypeKatex, { strict: "error" }]` before `rehypeKatexStrict`.
// `astro:build:done` runs only in `astro build`, not in the dev server.

/**
 * @typedef {object} KatexViolation
 * @property {string} path Source file, or `<unknown file>`.
 * @property {number | "?"} line
 * @property {number | "?"} column
 * @property {string} reason The KaTeX error message.
 */

/**
 * @typedef {object} KatexVFile
 * @property {string | undefined} [path]
 * @property {ReadonlyArray<{
 *   source?: string | null,
 *   line?: number | null,
 *   column?: number | null,
 *   cause?: unknown,
 *   reason: string,
 * }>} messages
 */

export class KatexStrictError extends Error {
  name = "KatexStrictError";
}

/**
 * @returns {{
 *   rehypeKatexStrict: () => (tree: any, file: KatexVFile) => void,
 *   integration: { name: string, hooks: { "astro:build:done": () => void } },
 *   violations: KatexViolation[],
 * }}
 */
export function createKatexStrict() {
  /** @type {KatexViolation[]} */
  const violations = [];

  function rehypeKatexStrict() {
    return (/** @type {any} */ _tree, /** @type {KatexVFile} */ file) => {
      for (const message of file.messages) {
        if (message.source !== "rehype-katex") continue;
        /** @type {KatexViolation} */
        const violation = {
          path: file.path ?? "<unknown file>",
          line: message.line ?? "?",
          column: message.column ?? "?",
          reason:
            message.cause instanceof Error
              ? message.cause.message
              : message.reason,
        };
        const seen = violations.some(
          (v) =>
            v.path === violation.path &&
            v.line === violation.line &&
            v.column === violation.column &&
            v.reason === violation.reason,
        );
        if (!seen) violations.push(violation);
      }
    };
  }

  const integration = {
    name: "katex-strict",
    hooks: {
      "astro:build:done": () => {
        if (violations.length === 0) return;
        const files = new Set(violations.map((v) => v.path)).size;
        throw new KatexStrictError(
          [
            `rehype-katex-strict: ${violations.length} KaTeX error(s) in ${files} file(s):`,
            ...violations.map(
              (v) => `  ${v.path}:${v.line}:${v.column} ${v.reason}`,
            ),
          ].join("\n"),
        );
      },
    },
  };

  return { rehypeKatexStrict, integration, violations };
}
