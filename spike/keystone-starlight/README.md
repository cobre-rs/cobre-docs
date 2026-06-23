# Keystone Spike — Astro Starlight theming proof

A throwaway proof-of-concept validating the **keystone** of the docs-tooling
overhaul (`docs/design/tools.md`): _theme-adaptive figures + tested-compute math
plots on Astro Starlight_. Built and verified **2026-06-22**.

## What it proves

One page (`src/content/docs/index.mdx`) exercises four claims; toggling the
Starlight light/dark switch flips **every** figure with no per-figure rework.

| #   | Claim                                                                            | Tier      | Result                              |
| --- | -------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| 1   | Heavy KaTeX renders at build time (sums, fractions, nested `\sqrt`, CVaR, cases) | 1 (build) | ✅ 18 KaTeX spans, `\sqrt` rendered |
| 2   | **Inline `currentColor` / CSS-var SVG follows the theme toggle for free**        | 1         | ✅ measured flip (below)            |
| 3   | Mermaid `autoTheme` follows the toggle                                           | 1         | ✅ pre-rendered at build, re-themes |
| 4   | Observable Plot from a **unit-tested compute module**, re-renders on toggle      | 2         | ✅ dark palette picked up           |
| 5   | **D2 (`astro-d2`) follows the manual toggle** after a generic CSS keystone       | 1         | ✅ measured flip (below)            |

**Claim 2 is the crux** — it's what matplotlib's baked-color SVGs could never do.
Measured computed values on toggle (light → dark):

| Element                            | Light            | Dark               |
| ---------------------------------- | ---------------- | ------------------ |
| `--dgm-storage` var                | `#8b5e3c`        | `#b87333`          |
| rect stroke (`var(--dgm-storage)`) | `rgb(139,94,60)` | `rgb(184,115,51)`  |
| line stroke (`currentColor`)       | `rgb(85,85,85)`  | `rgb(139,146,152)` |
| page background                    | white            | `rgb(23,24,28)`    |

**Claim 4** — the "best of both worlds" for math plots. Correctness lives in
`src/figures/valueFunction.ts` and is **tested** (`npm test`, 3/3 pass):

- tangent slope **==** analytic derivative (correct by construction)
- tangent touches `Q` exactly at the pin
- Benders cut underestimates convex `Q` everywhere

The renderer (`src/components/ValueFunctionPlot.astro`) consumes the computed
arrays and reads the palette from CSS vars (re-renders via a `MutationObserver`
on `data-theme`). Dark strokes measured `#d4956a` / `#4a90b8` = the dark
`--dgm-curve` / `--dgm-accent`.

See `screenshots/keystone-light.png` and `screenshots/keystone-dark.png`.

**Claim 5 — the D2 caveat and its fix.** `astro-d2` renders the diagram as
**inline SVG** (good ELK layout), but d2 gates its dark palette with
`@media (prefers-color-scheme: dark)` — so out of the box it follows the **OS
preference, not Starlight's manual toggle** (a half-themed page when the two
disagree). The fix is a generic CSS keystone in `src/styles/custom.css` that
re-keys d2's shared palette classes (`.fill-N*` / `.stroke-*`, common to every
d2 diagram) to `:root[data-theme]`, scoped to `.d2-svg`. Measured flip after the
fix (toggling `data-theme`):

| d2 class           | Dark      | Light (after toggle) |
| ------------------ | --------- | -------------------- |
| `fill-N7` (shape)  | `#1E1E2E` | `#FFFFFF`            |
| `fill-N1` (text)   | `#CDD6F4` | `#0A0F25`            |
| `fill-B1` (accent) | `#CBA6F7` | `#0D32B2`            |

Productionizing: a small rehype plugin rewriting the `@media` → `[data-theme]`
selector would do this automatically for any d2 palette, instead of the
committed CSS table. See `screenshots/d2-light.png` / `screenshots/d2-dark.png`.

## i18n routing — ✅ verified (Stage A)

Configured a **root** locale (`en`, no prefix) + `pt-br` (`lang: pt-BR`) and added
a translated `src/content/docs/pt-br/index.mdx`. Build produced:

- routes `/` (`<html lang="en">`) and `/pt-br/` (`<html lang="pt-BR">`)
- an automatic `<starlight-lang-select>` language switcher ("Português do Brasil")
- translated prose **and diagram labels** — the D2 one-line renders "Usina
  hidrelétrica", the SVG "estado em memória" — confirming **text-based diagrams
  localize** (matplotlib's baked text could not). Math is locale-neutral.

i18n is pure-static and needs no extra dependency. This is the cleaner of the two
future-goal pillars.

## Versioning — Architecture A (`starlight-versions`): ⚠️ blocked on math auto-archive (Stage B)

> **Two architectures exist; they're mutually exclusive.** A = one build, all
> versions in-tree, native picker (`starlight-versions`). B = one build per
> git tag, deployed to subpaths, hand-rolled picker (no plugin). The spike
> tested both; **B is the recommendation** (see below).

`starlight-versions@0.9.0` (pre-1.0) **works structurally and composes with i18n**:
with plain-markdown content, `astro build` archived the current docs into
`v0.8`, producing per-locale snapshots (`docs/0.8/`, `docs/pt-br/0.8/`), a
`src/content/versions/0.8.json` manifest, routes `/0.8/` + `/pt-br/0.8/`, and a
version picker ("Latest" / "0.8").

**But its auto-archive cannot parse KaTeX math.** Archiving any page with `$$`
math throws `[AstroUserError] Could not parse expression with acorn`. Bisected to
the root cause: **the archiver parses `{…}` inside `$$` as JS/MDX expressions**,
so a brace whose content isn't valid JS breaks it:

| Math                                                   | Archive        |
| ------------------------------------------------------ | -------------- |
| `$$ \bar{x} $$` (brace = `x`, valid JS)                | ✅ OK          |
| `$$ \bar{\alpha} $$` (brace = `\alpha`, a `\command`)  | ❌ acorn error |
| `$$ \text{else} $$` (brace = `else`, JS reserved word) | ❌ acorn error |

Essentially **all real LaTeX** (`\frac{1}{N-1}`, `\bar{\varepsilon}`,
`\text{...}`, `\begin{cases}`) trips it. For a math-saturated reference this is a
**hard blocker on the plugin's auto-archive**. Note it's `.md`-or-`.mdx`-agnostic
(both fail) and the parse runs during config setup, on `dev` and `build` alike.

**Workaround (verified to build):** the parser runs **only** during auto-archive.
If a version's snapshot already exists on disk, the plugin skips archiving and
serves it — and a versioned page **with** math renders KaTeX correctly. So the
production path is to **pre-generate snapshots** (e.g. copy the docs tree at each
cobre release tag into `docs/<slug>/` + a matching `versions/<slug>.json`) rather
than rely on auto-archive. That manifest must stay consistent (a crude hand-edit
desynced the slug to `/08/` in testing). Cleanest fix is upstream: the error
message itself invites a `HiDeoo/starlight-versions` issue. **Versioning is
therefore "yellow" — feasible, but not turnkey for math docs today.**

The plugin is installed but **intentionally not wired** in this spike (see
`astro.config.mjs` / `content.config.ts`) so the build stays green with the real
math content.

## Versioning — Architecture B (build-per-tag → subpaths): ✅ prototyped & verified

No `starlight-versions`, so the math blocker **cannot occur**. Each version is an
independent build at its own base path, assembled into one `dist/` tree.

Pieces (all in the spike):

- **`versions.json`** — the manifest of live versions (`latest` + `v0.8`, each
  with a `base` and `ref`).
- **`astro.config.mjs`** — `base: process.env.DOCS_BASE ?? "/"`, so each build is
  subpathed; and `components.SocialIcons` overridden to mount the picker in the header.
- **`src/components/VersionPicker.astro`** — reads its own base from
  `import.meta.env.BASE_URL`, marks the current version, links across the others.
- **`build-versions.mjs`** (`npm run build:versions`) — builds each entry with its
  `base`, assembles into `dist/` + `dist/v0.8/`. The one production substitution is
  documented in-file: a tagged version does `git worktree add … <ref>` then builds
  with `--root`.

**Verified end-to-end (build + static server + browser):**

| Check                                                                      | Result      |
| -------------------------------------------------------------------------- | ----------- |
| Two independent builds (`/`, `/v0.8/`) assembled into one tree             | ✅          |
| Assets correctly base-prefixed (0 stray root `/_astro/` in v0.8)           | ✅          |
| i18n composes per version (`/`, `/pt-br/`, `/v0.8/`, `/v0.8/pt-br/`)       | ✅          |
| Picker shows correct current per build (`v0.9 (dev)` vs `v0.8`)            | ✅ measured |
| Picker **navigates** between versions (selected v0.8 → landed on `/v0.8/`) | ✅          |
| Figures render under the subpath (D2 + 5 KaTeX on `/v0.8/`)                | ✅          |

See `screenshots/archB-latest-header.png` / `screenshots/archB-v08-header.png`.

**Trade-off vs A:** B gives up the in-page picker polish + unified search and adds
a ~30-line picker + a CI assembly step, but it removes the math blocker by
construction, ties versions to git tags (matching the cobre release-sync model),
and is **platform-agnostic** (works the same if the project stays on mdBook).

## Stack (verified working together)

- `astro@6.4.8` · `@astrojs/starlight@0.40.x`
- `starlight-katex@0.0.4` (math) — **works**, emits one deprecation warning
  about the old `markdown.remarkPlugins` API (cosmetic; watch-item)
- `astro-mermaid@2.0.x` (`autoTheme: true`, registered **before** Starlight)
- `astro-d2@0.11.x` + `d2@0.7.1` binary (conceptual diagrams, inline SVG) — needs
  the generic CSS keystone (above) to follow the manual toggle
- `@observablehq/plot@0.6.x` (math/data plots, vanilla island)
- Starlight-native i18n (root `en` + `pt-br`) — no extra dependency
- `starlight-versions@0.9.x` — installed, **not wired** (math auto-archive blocker)
- compute layer + tests run on Node's native `--test` + type-stripping (Node 25)

## Run it

```bash
cd spike/keystone-starlight
npm install
npm test          # compute-layer correctness (3/3)
npm run dev       # explore at http://localhost:4321 — toggle the theme
npm run build     # single static build into dist/
npm run build:versions   # Architecture B: multi-version build -> dist/ + dist/v0.8/
#   then: python3 -m http.server --directory dist   (serves / and /v0.8/)
```

## Notes / caveats surfaced

- `starlight-katex` is v0.0.4 and uses a deprecated Starlight markdown hook —
  functional now; the manual `remark-math` + `rehype-katex` fallback is the
  safety net if it ever breaks against a newer Starlight.
- Observable Plot bundles ~500 kB; it loads **only** as an island on pages that
  use it (not site-wide), so up-front JS stays near zero.
- `npm test` globs `src/figures/*.test.ts` (passing a bare dir to `node --test`
  misbehaved).
- D2 (`astro-d2`) themes via `prefers-color-scheme`, **not** Starlight's manual
  toggle — a real half-themed-book trap. The generic `.d2-svg` CSS keystone
  (claim 5) fixes it; a rehype `@media` → `[data-theme]` rewrite is the cleaner
  production form. This is the one extra step D2 needs that Mermaid's `autoTheme`
  gives for free.

This is a **spike** — not the migration. `node_modules`, `dist`, `.astro` are
git-ignored; nothing here affects the mdBook build at the repo root.
