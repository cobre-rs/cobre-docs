# cobre-docs: The Definitive Toolset

> Tiered, one-pick-per-job stack for the methodology **reference** (math +
> worked examples + reference). Chosen for fit, active maintenance (verified
> June 2026), and honest scope. Organised as **Lock / Resolve / Defer** so the
> low-risk core ships now and the ambitious interactive layer is adopted only
> where a figure earns it.
>
> Client frameworks are minimised: the static core needs **none**. The only
> framework runtime in the stack is **React**, pulled **only** onto pages that
> embed an interactive node-graph (React Flow), as an Astro island.

## The one-paragraph answer

**Astro Starlight** is the framework. Math typesetting is **KaTeX** (Starlight
KaTeX plugin). Diagrams-as-code is **D2** (`astro-d2`) for committed conceptual
figures + **Mermaid** (`astro-mermaid`) for inline-in-prose flows. Math and data
figures are a **tested TypeScript compute layer** rendered with **Observable
Plot** — correct-by-construction _and_ theme-reactive — with **JSXGraph**
reserved for the handful of figures where dragging genuinely teaches.
Explorable node-graph diagrams (opt-in, per-figure) use **React Flow**
(`@xyflow/react`, MIT). i18n is **Starlight-native** + **Lunaria** for
translation-status tracking; versioning is **`starlight-versions`**. Everything
interactive runs as an **Astro island** hydrated with `client:visible`. GSAP
timeline animation and ECharts dashboards are **out of scope for the reference**
(they belong to the tutorial/onboarding layer, if anywhere).

---

## The tiered model

| Tier                            | What                                                                                                               | Tools                                                                                        | Rationale                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **🔒 Lock now**                 | The static-docs core that solves the actual pain (maintainable, themeable, i18n-able, versionable diagrams + docs) | Starlight · KaTeX · D2 · Mermaid · native i18n + Lunaria · `starlight-versions` · image-zoom | Low risk, high fit. Matches the goals: theme-adaptive, no Python, future i18n + versioning.                               |
| **🧩 Resolve**                  | The math/data figure question — port matplotlib's _correctness_ into JS without losing it                          | TS compute layer + **Observable Plot** (+ **JSXGraph** for dynamic)                          | Keeps correct-by-construction (now _tested_), gains theming + optional interactivity, retires matplotlib **and** ECharts. |
| **⏸ Defer / opt-in**            | Genuine interactivity ambitions — adopt per-figure only when a static figure can't carry the teaching              | **React Flow** (explorable diagrams)                                                         | Most one-lines / DAGs are fine as static D2. React Flow is the escape hatch when explorability earns its runtime cost.    |
| **🚫 Out of scope (reference)** | Onboarding flair that belongs to the tutorial layer                                                                | GSAP · ECharts                                                                               | `diagram-authoring.md` already separates reference diagrams from tutorial-layer widgets. Keep that boundary.              |

---

## 🔒 Lock now — the core stack

| Category                  | Pick                                          | Package(s)                                                                            | Why it wins                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Theme tier                  |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Framework**             | **Astro Starlight**                           | `@astrojs/starlight`                                                                  | The only option that gives i18n + versioning + theme-reactive component figures together. Static-first, near-zero JS up front, clean on GitHub Pages.                                                                                                                                                                                                                                                                                                                      | —                           |
| **LaTeX equations**       | **KaTeX**                                     | `starlight-katex` (`starlightKatex()` — wraps remark-math + rehype-katex + KaTeX CSS) | Compile-time, zero client JS, fast, copy-selectable, flicker-free. One install + one plugin line handles the deps, config, and CSS so you don't hand-wire remark/rehype.                                                                                                                                                                                                                                                                                                   | Tier 1 (build-time)         |
| **Conceptual diagrams**   | **D2**                                        | `astro-d2`                                                                            | Diagrams-as-code: diffable, PR-reviewable, no Python env, clean auto-layout for narrow columns. Maintained by HiDeoo (core Starlight-ecosystem author).                                                                                                                                                                                                                                                                                                                    | Tier 1 _(see theming note)_ |
| **Inline diagrams**       | **Mermaid**                                   | `astro-mermaid`                                                                       | Quick flowcharts living **inside the prose** they illustrate. `autoTheme: true` reads Starlight's `data-theme` and re-renders on toggle. Register **before** Starlight in `astro.config`.                                                                                                                                                                                                                                                                                  | Tier 1 (themed)             |
| **i18n routing**          | **Starlight native**                          | (built in)                                                                            | Per-locale trees under `src/content/docs/en/`, `/pt-BR/`; 34 pre-translated UI languages; clean on static hosting.                                                                                                                                                                                                                                                                                                                                                         | —                           |
| **i18n status**           | **Lunaria**                                   | `@lunariajs/starlight`                                                                | Dashboard of which pages are translated / stale as `en` changes — exactly what a pt-BR rollout needs. Move to Crowdin/Weblate only when external community translators appear.                                                                                                                                                                                                                                                                                             | —                           |
| **Versioning**            | **build-per-tag → subpaths** (Architecture B) | _no plugin_ — env-driven Astro `base` + `versions.json` + picker + CI assembly        | **Recommended + prototyped green in the spike.** Each cobre release tag builds independently to its own subpath (`/`, `/v0.8/`); a ~30-line picker links them. No `starlight-versions` ⇒ the math blocker can't occur; platform-agnostic. **Architecture A (`starlight-versions`)** is the alternative (native in-page picker + unified search) but its **auto-archive can't parse KaTeX `$$` math** (acorn — verified); usable only via pre-generated snapshots. Pre-1.0. | —                           |
| **Image zoom (optional)** | **starlight-image-zoom**                      | `starlight-image-zoom`                                                                | Click-to-zoom any static figure (D2/SVG) on mobile. Cheap win.                                                                                                                                                                                                                                                                                                                                                                                                             | —                           |

### Theming note — make D2 match Mermaid (the keystone)

Mermaid (`autoTheme`) follows Starlight's light/dark toggle live. **D2's SVG does
not** — verified in the spike (`spike/keystone-starlight/`): `astro-d2` emits the
dark palette under `@media (prefers-color-scheme: dark)`, so it tracks the **OS
preference, not Starlight's manual toggle**. When the two disagree you get a
half-themed page (everything dark, the D2 figure still light).

**The fix (proven):** `astro-d2` renders inline SVG using shared palette classes
(`.fill-N*` / `.stroke-*`, common to every d2 diagram). A single generic CSS
block scoped to `.d2-svg` re-keys those classes to `:root[data-theme]` — one
block themes every D2 figure site-wide, binding them to the manual toggle.
Cleaner production form: a small rehype plugin that rewrites the
`@media (prefers-color-scheme)` selector to `[data-theme]` automatically.

The same `currentColor` / CSS-var discipline makes _any_ committed SVG (including
a hand-drawn one) theme-reactive at Tier 1 — **author colours once → every theme
for free.** This is the one extra step D2 needs that Mermaid gives for nothing.

---

## 🧩 Resolve — math & data figures (best of both worlds)

**The principle: computation is not rendering. Keep them separate.**

matplotlib's only irreplaceable virtue was _correct by construction_ — markers
derived from the math, not eyeballed. That virtue is a property of **how the
data is produced**, not of the renderer. So we keep it and move it to a better
home:

1. **Compute layer** — a small, **unit-tested** TypeScript module
   (`figures/compute/*.ts`): `valueFunction(v)`, `bendersTangentAt(v0)`,
   `cvarMarkers(mu, sigma, alpha)`, `convergenceBand(...)`. Every mark is
   positioned from these returned arrays — **never hand-typed**. Tangent slope =
   analytic/numeric derivative at the pin; CVaR markers = numeric CDF inversion;
   bands = the actual noise model. Assert it in tests:
   `slope(tangentAt(v0)) ≈ derivative(Q, v0)`. This is **stronger** than the
   status quo, where correctness lived in an uncommitted, untested Python script.
2. **Render layer** — feed the computed arrays to a theme-reactive renderer.

This loses nothing matplotlib gave you, and gains: unit-tested correctness,
light/dark theming, optional interactivity, one language (TS) for site + figures,
and **no Python/uv environment**.

| Job                                                                                    | Pick                | Package              | Why                                                                                                                                                                                                                                                                      | Theme tier |
| -------------------------------------------------------------------------------------- | ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Static / data plots** (value function, convergence bounds, CVaR PDF, histograms)     | **Observable Plot** | `@observablehq/plot` | Grammar-of-graphics built for "computed arrays → clean axes/curves/markers/bands." Vanilla JS, lightweight, the right altitude for math figures. **Replaces matplotlib _and_ ECharts.** Re-render on theme toggle (cheap: it's one function call returning an SVG node). | Tier 2     |
| **Dynamic / draggable math** (drag a trial point on `Q(v)`, sliders accumulating cuts) | **JSXGraph**        | `jsxgraph`           | Purpose-built dynamic-geometry: draggable points with constraints, sliders. Vanilla. Reserve for the 1–2 figures where dragging _teaches_; don't reach for it where a static Plot suffices.                                                                              | Tier 2     |

**Tiny stats helpers** (erf, normal/lognormal quantile) are a few lines or a
small dependency (`jstat`); none of the figures in play need anything heavier.
matplotlib is **retired**.

---

## ⏸ Defer / opt-in — interactive diagrams

| Job                                                          | Pick           | Package                                                                                      | Status                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explorable node-graph** (power-system one-line, crate DAG) | **React Flow** | `@xyflow/react` (MIT — free core; "Pro" is paid examples/support, _not_ a different package) | **Adopt per-figure, only when explorability earns its cost.** Most one-lines / DAGs are fine as static D2. React Flow is the mature, battle-tested xyflow product (older and steadier than Svelte Flow). Pulls **React** onto that page only, via `@astrojs/react` + `client:visible`. Custom symbol nodes, MiniMap/Controls, NodeResizer/Toolbar; bind its `colorMode` to the theme (Tier 2). |

**Why React Flow over Svelte Flow:** Astro islands make the framework choice
_per-page_ — React and Svelte cost the same architecturally — so there is no
"React-free" prize worth a maturity downgrade. React Flow is the original,
hardened tool; take it. Svelte Flow is **rejected** (younger, npm README still
carries a "things might change" note).

---

## 🚫 Out of scope for the reference

- **GSAP** (timeline animation, e.g. a reservoir draining over stages) →
  belongs to the **tutorial/onboarding layer** (`dev-strategy.md` §5), not the
  methodology reference. `diagram-authoring.md` already draws this boundary;
  keep it. If onboarding ever wants scripted scenes, GSAP is the pick there —
  Webflow-backed, original team, 100% free incl. MorphSVG/SplitText.
- **ECharts** (dashboard charts) → wrong altitude for math figures; Observable
  Plot covers the reference's plotting needs. Revisit **only** if a genuine
  interactive dashboard (zoom/brush over large series) ever appears.

---

## How it fits together (the two mechanics)

**1. Islands keep it fast.** Every interactive figure (Observable Plot,
JSXGraph, a React Flow graph) is a component embedded in MDX and hydrated with
`client:visible` — its JS loads only when the reader scrolls to it. A 25-chapter
book ships almost no JS up front. Build-time tools (KaTeX, D2) and
`currentColor` SVG add zero runtime. For a React Flow graph specifically, if its
SSR pass is ever fussy, use `client:only="react"` — a node graph has no SEO
value to SSR anyway.

**2. One theme hook for the Tier-2 ones.** Starlight sets
`document.documentElement.dataset.theme = "dark" | "light"`. **Tier 1** —
KaTeX, D2 (`currentColor`), Mermaid (`autoTheme`), any `currentColor` SVG —
follow the toggle for free. **Tier 2** — Observable Plot (re-call the render
function), JSXGraph (update board colours), React Flow (bind `colorMode`) —
re-render/re-style on toggle via a ~10-line `MutationObserver` on that attribute,
ideally a shared `useTheme()`/`onThemeChange()` helper so the wiring lives in one
place.

**Framework footprint:** the static core (Starlight, KaTeX, D2, Mermaid) and the
vanilla islands (Observable Plot, JSXGraph) need **no client framework**. The
only framework runtime is **React**, pulled in **only** by React Flow, and only
on pages that embed an explorable node-graph.

---

## Install

```bash
# framework
npm create astro@latest -- --template starlight

# math typesetting — one plugin handles remark-math + rehype-katex + CSS
npm i starlight-katex
#   astro.config: plugins: [ starlightKatex() ]   (import { starlightKatex } from "starlight-katex")
#   fallback if the plugin lags Starlight: npm i remark-math rehype-katex katex

# diagrams-as-code
npm i astro-d2 astro-mermaid          # + the `d2` binary on your build machine / CI
#   d2 binary (not on npm): curl -fsSL https://d2lang.com/install.sh | sh -s --

# math & data figures (vanilla islands) + compute layer
npm i @observablehq/plot              # static / data plots (renderer)
npm i jsxgraph                        # dynamic / draggable math (reserve)
# npm i jstat                         # optional: stats helpers (erf, quantiles)

# interactive diagrams — opt-in, only if you build an explorable node-graph
npm i @astrojs/react react react-dom @xyflow/react
npx astro add react                   # wires the React integration into astro.config

# i18n status + versioning
npm i @lunariajs/starlight starlight-versions
#   astro.config: plugins: [ starlightVersions({ versions: [{ slug: "0.8" }] }) ]
#   src/content.config.ts: versions collection via docsVersionsLoader()
#   (snapshots current docs into a version on dev-server start; pre-1.0)

# optional
npm i starlight-image-zoom
```

If you build **no** explorable node-graphs, drop
`@astrojs/react react react-dom @xyflow/react` — the rest of the stack pulls in
no client framework at all.

---

## Maintenance snapshot (June 2026)

- **Astro** v6.4.x (active monthly cadence) · **Starlight** — core team.
- **KaTeX** via `starlight-katex` (`starlightKatex()`) — compile-time, the
  de-facto math standard; one plugin wraps remark-math + rehype-katex + CSS.
- **astro-d2 / astro-mermaid** — HiDeoo (core ecosystem) / active. **D2** engine
  — Terrastruct, active.
- **Observable Plot** `@observablehq/plot` — Observable, MIT, active; vanilla,
  returns an SVG/HTML node (trivial to re-render on theme toggle).
- **JSXGraph** v1.12.x — Univ. Bayreuth, active (recent 3D + ARIA work).
- **React Flow** `@xyflow/react` — xyflow team, MIT, mature and battle-tested
  (the original; v12.x); custom nodes, `colorMode`, MiniMap/Controls,
  NodeResizer/Toolbar.
- **@astrojs/react** — first-party Astro integration.
- **starlight-versions / Lunaria** — HiDeoo / Astro ecosystem. `starlight-versions`
  is pre-1.0 (a watch-item; branch-per-release is the fallback).

Deliberately rejected: **Svelte Flow** (younger than React Flow; no React-free
prize worth the maturity gap), **ECharts** (dashboard altitude; Observable Plot
fits math figures), **matplotlib** (correctness preserved by the tested TS
compute layer; Python env retired), **Mafs** (quiet single-maintainer →
JSXGraph instead).

---

## The watch-items, stated plainly

1. **`starlight-versions`** is pre-1.0 → branch-per-release builds are the
   conservative fallback for versioning.
2. **Observable Plot + JSXGraph are Tier 2** → they need the `MutationObserver`
   theme hook (one shared helper). Budget the small wiring once; it's not free
   like the build-time tools.
3. **React Flow** pulls React onto interactive-diagram pages → keep those
   figures deliberate and few; default to static D2 unless explorability teaches.
