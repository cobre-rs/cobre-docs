# mdBook → Astro Starlight Migration Plan

> Status: **approved — decisions locked (§3, 2026-06-22). Not yet started**;
> execution begins at M1 (walking skeleton). Foundation is proven in
> `spike/keystone-starlight/` and the toolset in [`tools.md`](tools.md).
> Branch: `feat/starlight-migration`.

## 1. Strategy: parallel-run → cutover → decommission

Build the Starlight site **alongside** the live mdBook, reach **parity**, flip the
GitHub Pages deploy, then remove mdBook. The mdBook site keeps shipping until the
moment of cutover, so there is **no content-availability gap and a one-line
rollback** (revert the deploy workflow).

```
main (mdBook, live) ──────────────────────────────────► … (decommissioned)
   └─ feat/starlight-migration (Starlight) ─[parity]─► cutover ─► promote to root
```

## 2. Inventory & mapping (measured)

| mdBook today                                              | Count    | → Starlight target                                   |
| --------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `src/specs/**/*.md` (overview/math/examples/reference)    | 29       | `src/content/docs/**` (MD/MDX + frontmatter)         |
| `src/SUMMARY.md` (7-Part TOC)                             | 1        | `starlight.sidebar` config (manual groups)           |
| `book.toml`                                               | 1        | `astro.config.mjs` + Starlight options               |
| `theme/css/custom.css` (coal-only brand)                  | 1        | Starlight `customCss` + `--dgm` palette (light+dark) |
| matplotlib SVGs in `src/images/`                          | ~10      | per figure policy (§3, D3)                           |
| inline mermaid blocks                                     | 3        | `astro-mermaid` (`autoTheme`) — port as-is           |
| Excalidraw one-line                                       | 1        | D2 (retire Excalidraw)                               |
| blockquote callouts `> **Note**…`                         | 8 files  | Starlight `:::note/:::caution` asides                |
| relative `../x.md` links                                  | many     | slug links (Astro resolves; drop `.md`/`../`)        |
| `$…$` / `$$…$$` math                                      | 20 files | remark-math + rehype-katex (verify delimiters)       |
| `.github/workflows/{ci,deploy}.yml` (mdBook→Pages, CNAME) | 2        | Astro build + `d2` binary + Node → Pages             |
| mdBook `{{#include}}` transclusion                        | **0**    | nothing to port (clean)                              |

No transclusion and no playground blocks — the content port is mechanical
(frontmatter + links + callouts + math verification), not structural.

## 3. Decisions (LOCKED 2026-06-22)

| #      | Decision                      | Locked choice                                                                                                                                                  |
| ------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | App location during migration | **Isolated `site/` subdir**, promoted to repo root at decommission (E9). mdBook stays at root and live until cutover — no `src/` collision, clean rollback.    |
| **D2** | Light mode                    | **Design light + dark now** — the `--dgm` keystone palette already carries both; a quality upgrade over today's coal-only.                                     |
| **D3** | Figures                       | **Full retool now** — conceptual + one-line → D2 (retire Excalidraw); math plots → tested-compute Observable Plot; **retire the `diagrams/` Python pipeline**. |
| **D4** | Math renderer                 | **Manual `remark-math` + `rehype-katex`** (not `starlight-katex` v0.0.4).                                                                                      |
| **D5** | URL preservation              | **Deferred** to E7 — decide with traffic data; default to redirects if external links to `methodology.cobre-rs.dev` matter.                                    |

## 4. Epics

### E1 — Scaffold the migration app _(depends: nothing)_

Promote the spike's proven config into `site/` (D1): `astro.config.mjs`
(base-from-env, i18n root `en`, Starlight), **manual `remark-math` +
`rehype-katex`** (D4), `astro-mermaid`,
`astro-d2` + the `.d2-svg` keystone CSS, Observable Plot, the `--dgm` palette,
the version-picker + `build-versions.mjs`, `tsconfig` strict.
**Exit:** an empty-but-configured Starlight builds green; `npm test` harness ready.

### E2 — Theming & design system _(depends: E1)_

Port brand colors, fonts (IBM Plex Sans / JetBrains Mono), logo/site-title, and
the `--dgm` diagram palette into Starlight `customCss` for **light + dark** (D2).
Wire the D2 keystone and confirm KaTeX dark/light legibility.
**Exit:** the shell matches the cobre brand in both themes; a sample chapter
renders correctly.

### E3 — Content migration _(depends: E1; parallel with E4)_

Per chapter (29): add frontmatter (`title`, `description`); convert blockquote
callouts → asides (8 files); rewrite relative `.md` links → slugs; **verify
every `$$` block renders** (KaTeX delimiter parity is the top risk). Rebuild the
7-Part TOC as `starlight.sidebar`. Port glossary/bibliography.
**Exit:** all 29 chapters render; link-check passes; math spot-checked against the
live mdBook.

### E4 — Diagram migration _(depends: E1; D3 = full retool)_

Conceptual diagrams + the one-line → D2 (`.d2-svg` keystone, retire Excalidraw);
math plots → tested-compute Observable Plot modules (extend the spike's
`figures/` pattern); port the 3 mermaid blocks as-is. **Retire the `diagrams/`
Python pipeline** (matplotlib, `block_layout`, `cobre_brand`, Excalidraw).
**Exit:** every figure is theme-adaptive in light + dark; no figure depends on
Python.

### E5 — i18n scaffolding _(depends: E1)_

Lock the root-`en` locale structure under `src/content/docs/`; reserve `pt-br/`;
add the language switcher. **Defer actual pt-BR translation** (separate effort;
Lunaria dashboard when translators arrive).
**Exit:** locale config in place; switcher renders; en is the served root.

### E6 — Versioning scaffolding _(depends: E1)_

Wire Architecture B: `versions.json` with a single `latest`, `build-versions.mjs`,
picker. **No version snapshots yet** — the machinery is ready for the first
`git worktree add <tag>` build when a second cobre release must coexist.
**Exit:** `npm run build:versions` produces `/` cleanly; adding a tag is a
one-line config change.

### E7 — CI/CD & hosting _(depends: E1–E4)_

New Actions: install Node + `d2` binary, `astro build`, link-check, deploy to
Pages with the `methodology.cobre-rs.dev` CNAME. Add the version-aware build if
E6 is active. Set up redirects per D5.
**Exit:** a preview/staging deploy is green and visually verified.

### E8 — Parity verification & cutover _(depends: E2–E7)_

Side-by-side parity pass: content completeness, math rendering, internal links,
search, both themes, mobile. Then **flip `deploy.yml`** to build `site/` instead
of mdBook; keep the CNAME.
**Exit:** `methodology.cobre-rs.dev` serves Starlight; mdBook deploy disabled.

### E9 — Decommission mdBook _(depends: E8 stable)_

Remove `book.toml`, `src/SUMMARY.md`, the old `src/specs` tree (now migrated),
`mermaid.min.js`, the mdBook CI steps, and the `diagrams/` Python pipeline +
`pyproject.toml`/`uv.lock` (retired in E4). Promote `site/` → repo root.
Rewrite `CLAUDE.md` + `diagram-authoring.md` for the Starlight regime.
**Exit:** repo is Starlight-only; CLAUDE.md reflects the new stack.

## 5. Risks & mitigations

- **KaTeX delimiter drift** (mdbook-katex → rehype-katex): the highest-likelihood
  content bug. _Mitigate:_ automated check that every source `$$…$$` produces a
  `.katex` node in the built HTML; diff a math-dense chapter early in E3.
- **`starlight-katex` immaturity** → choose D4=(b) manual remark/rehype.
- **Figure rewrite scope** (E4) → D3=(b) interim themed-SVG is the pressure valve
  if cutover must not wait on figure quality.
- **URL breakage** (D5) → add redirects; the site is young so blast radius is low.
- **`src/` collision** → D1=(a) `site/` isolation removes it entirely.
- **Search/UX regressions** → E8 parity checklist is the gate; do not flip deploy
  until it passes.

## 6. Rollback

Until E9, rollback = revert `deploy.yml` to the mdBook job (the mdBook source is
untouched on `main`). Post-E9, rollback = revert the decommission commit. The
`feat/starlight-migration` branch keeps full history.

## 7. Milestones

1. **M1 — Walking skeleton:** E1+E2 + **one** math-dense chapter + its figures
   migrated and deployed to staging. Validates the whole toolchain on real
   content before committing to the full port. _(Highest-value checkpoint.)_
2. **M2 — Content complete:** E3+E4 done; full corpus at parity on staging.
3. **M3 — Cutover:** E5–E8; production serves Starlight.
4. **M4 — Clean:** E9; mdBook removed, docs updated.

## 8. Open follow-ups (out of migration scope)

pt-BR translation (E5 deferred), interactive math figures (JSXGraph), the rehype
`@media`→`[data-theme]` D2 plugin (replaces the committed keystone CSS), and a
math-safe `starlight-versions` archive shim (only if Architecture A is ever
revisited).
