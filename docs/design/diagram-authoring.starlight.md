# Diagram Authoring Guide

**Scope.** This guide defines **which tool each kind of methodology-reference
diagram uses**, and the conventions that keep them visually coherent. It covers
diagrams embedded in chapters under `src/content/docs/` and the compute components
under `src/components/` and `src/figures/`.

This is separate from the _tutorial-layer_ visualizations in
[`dev-strategy.md`](dev-strategy.md) §5 (Chart.js, GSAP hero, interactive
widgets) — those are user-facing onboarding artifacts for
`methodology.cobre-rs.dev` and `cobre-rs.dev`. This guide is the rulebook
for **every diagram you author inside a spec file**.

> **Paths in this guide are post-promotion (repo-root).** All references such as
> `src/content/docs/`, `src/components/`, `src/styles/diagrams.css`, and
> `astro.config.mjs` assume the Starlight app sits at the repo root. Until the E9
> `site/`→root promotion runs, those files live under `site/` (e.g.
> `site/astro.config.mjs`).

---

## 1. Tool selection

### 1.1 Decision table

| Diagram content                                                                            | Tool                       | Why                                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Mathematical function, distribution, convergence curve, histogram                          | **Observable Plot** island | Compute layer unit-tested; markers/curves derived from the math, not placed by eye                       |
| Composed block diagram (nested containers, labeled regions, data flow with math in labels) | **inline D2** (`astro-d2`) | Code-defined topology in a text fence; PR-reviewable as diffs; theme-adaptive via the `.d2-svg` keystone |
| Flowchart, state machine, sequential pipeline, lifecycle                                   | **inline Mermaid**         | No asset to maintain; source lives next to the prose it illustrates; autoTheme                           |
| Power-system one-line (buses, generators, demand/deficit arrows)                           | **inline D2** (`astro-d2`) | D2 handles spatial schematics; covers both schematic and hand-drawn spatial diagram roles                |

D2 covers both the composed-block and spatial-diagram roles. Observable Plot
covers the math-plot role. There are no other diagram tools in this pipeline.

### 1.2 Decision tree

````
Does the diagram's content reduce to a mathematical function or distribution?
├── YES → Observable Plot island                              (§3)
│
Is it a composition of labeled boxes, possibly nested, possibly with arrows
between them (data flow, hardware topology, memory layout, power-system one-line)?
├── YES → inline ```d2 block                                  (§4)
│
Is it a sequential flow, decision tree, state transition, or lifecycle?
├── YES → inline ```mermaid block                             (§5)
│
None of the above clearly fits → stop and discuss, do not improvise.
````

### 1.3 Consistency rule (non-negotiable)

**A family of related diagrams uses the same tool.** If the LP section needs
three column-layout schematics, they are all inline D2 — not two in one tool and
one in another. Mixed tools within a domain fragment the visual identity and make
the reader re-learn vocabulary. When a new diagram joins an existing family, it
inherits the family's tool.

### 1.4 Figures in conceptual & overview chapters

**Conceptual and overview chapters earn their visuals.** A chapter that
introduces an idea before its deep treatment (Part 1, and any "in one page"
overview) should pair the key equation(s) with a diagram and/or a tested-compute
plot — the model is SDDP.jl's `first_steps`. Text-only is the exception, not the
default; a single well-chosen figure lowers the onboarding barrier more than
another paragraph.

- **Reuse, don't re-author.** A tested-compute plot may appear as a teaser in an
  overview chapter _and_ in the deep chapter that owns it — one instance per page
  (each island uses a fixed element `id`). Reusing the same component keeps the
  teaser correct-by-construction; do not fork a second, hand-tuned copy.
- **Embedding.** A chapter that embeds an Observable Plot island must be `.mdx`
  (import with the standard relative path, e.g.
  `import ValueFunctionPlot from "../../../components/ValueFunctionPlot.astro"`).
  Inline ` ```d2 ` and ` ```mermaid ` fences work in plain `.md` too.
- **Notation parity.** Keep the overview's symbols identical to the deep chapter
  it previews — never introduce a parallel notation just for the overview.
- **Restraint.** Figures must teach, not decorate. Pick the one or two that carry
  the concept; do not dump every figure from the deep chapters into the overview.

Reference: `src/content/docs/overview/sddp-framework-overview.mdx` pairs the
Bellman recursion with the SDDP-loop mermaid flowchart and the
ValueFunction / Convergence / CVaR plots — each section gets exactly one figure.

---

## 2. Rendering policy

Each tool has a fixed render path:

| Tool            | Render time | How                                                               | Theme adaptation                          |
| --------------- | ----------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Observable Plot | Client-side | Astro island reads `--dgm-*` CSS vars; re-renders on theme toggle | `getComputedStyle` → CSS vars             |
| D2              | Build time  | `astro-d2` renders ` ```d2 ` fences to inline SVG                 | `.d2-svg` keystone (`[data-theme]` remap) |
| Mermaid         | Client-side | `astro-mermaid` with `autoTheme: true`                            | Automatic                                 |

**D2 engine: ELK, never TALA.** The `astro-d2` integration is configured with
`layout: "elk"` in `astro.config.mjs`. TALA is a proprietary layout engine that
watermarks output when used without a licence — using it breaks the build. The
`check:d2` guard (`npm run check:d2`) enforces ELK-only at CI time. Never change
the layout engine without resolving the licence question first.

**No committed SVG assets for D2 or Mermaid.** Both render from their inline
fence source — there is no separate SVG file to commit or maintain. Observable
Plot components are Astro islands (`.astro` files) — no static SVG either.

---

## 3. Observable Plot — math plots

**Use when** the diagram's content is a function, distribution, convergence
curve, or any quantity that can be computed from a formula.

### 3.1 Correctness rule

**The math IS the diagram.** Tangent slopes come from the analytic derivative.
Quantiles come from numerical inversion of the CDF. Convergence bounds come from
the actual bound computation. Never position markers by eye.

The compute functions live in `src/figures/<name>.ts` and are asserted by a
sibling `src/figures/<name>.test.ts`. The render layer (`.astro` island) consumes
this tested compute module — it does no arithmetic of its own.

### 3.2 Structure

Every math-plot figure has two files:

- **`src/figures/<name>.ts`** — pure TypeScript compute layer. Exports functions
  and data-point arrays derived from the math. No rendering, no DOM access, no
  `import` of Observable Plot. Example: `src/figures/valueFunction.ts` exports
  `Q(v)`, `dQ(v)`, `samples()`, and `bendersTangentAt()`.
- **`src/components/<Name>Plot.astro`** — Astro island. Imports from the compute
  module, reads `--dgm-*` CSS vars via `getComputedStyle`, builds the Observable
  Plot `marks` array, and re-renders on the `data-theme` attribute toggle.
  Example: `src/components/ValueFunctionPlot.astro`.

### 3.3 Theme-adaptive colours

Read palette vars from the document root — never hard-code hex:

```typescript
const curve =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--dgm-curve")
    .trim() || "#b87333";
const accent =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--dgm-accent")
    .trim() || "#4a8b6f";
```

Set `style: { background: "transparent" }` on the plot so it blends with
Starlight's light and dark page backgrounds.

Observe `data-theme` attribute changes so the plot recolours on theme toggle:

```typescript
new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
```

### 3.4 Starting point

Clone `src/components/ValueFunctionPlot.astro` and its compute module
`src/figures/valueFunction.ts` + `src/figures/valueFunction.test.ts` as the
reference implementation. It demonstrates:

- Convex function Q(v) + Benders tangents (correct by construction from `dQ`)
- `--dgm-curve` / `--dgm-accent` / `--dgm-text` var reads
- Three unit tests: slope matches finite-difference, tangent touches Q at pin,
  cut is a lower bound everywhere on the curve

The unit tests (`npm test`) provide the correctness guarantee: every marker,
tangent, and quantile is asserted from formula evaluation — the core advantage of
the tested-compute model over a static rendering approach.

---

## 4. D2 — schematics and composed block diagrams

**Use when** the diagram is a composition of labeled boxes, data-flow arrows, or
a spatial schematic (power-system one-line, hardware topology, LP column layout).
D2 is the single tool for both topology/layout diagrams and spatial domain
diagrams — the three-tool pipeline has no fourth option.

### 4.1 Inline fence placement

D2 schematics live as inline fenced blocks in the chapter `.md` or `.mdx` file:

````markdown
```d2
LP stage-T: {
  x-columns: "state | gen | hydro | …"
  c-vector: "obj. coeff."
}
```
````

`astro-d2` renders the fence to an inline SVG at build time. No separate source
file; no separate SVG to commit. The fence IS the source.

### 4.2 Theme adaptation

D2 SVGs rendered by `astro-d2` carry d2's built-in palette **class names**
(`fill-N1`, `stroke-B2`, …). The `.d2-svg` keystone in `src/styles/diagrams.css`
remaps those palette classes to brand-hex values under
`:root[data-theme="light"]` / `:root[data-theme="dark"]` selectors, so every d2
figure recolours on theme toggle. The `theme: { default: "0", dark: "200" }`
setting in `astro.config.mjs` picks d2's base light (0) / dark (200) palette at
build time; the keystone then maps it onto brand colours.

This keystone uses **hardcoded brand hex** — it is **independent** of the
`--dgm-*` CSS-var palette that Observable Plot islands read. The two theming
systems are deliberately separate (see the comment in `astro.config.mjs`): D2
themes via `[data-theme]`-scoped class remapping, Observable Plot via `--dgm-*`
vars, Mermaid via `autoTheme`.

**Never introduce ad-hoc hex colors** in a D2 fence. Use D2's built-in styling
attributes (fill, stroke) with values from the brand palette when overrides are
needed; add a note in §8 (migration log) if a new semantic colour is introduced.

### 4.3 Engine: ELK, never TALA

The `layout: "elk"` setting in `astro.config.mjs` is mandatory. Do not change
it. See §2 for the TALA watermark rationale.

### 4.4 Reference implementations

- `src/content/docs/math/lp-formulation.md` — inline ` ```d2 ` block (LP
  column-layout schematic, d24)
- `src/content/docs/math/par-inflow-model.md` — inline ` ```d2 ` block (PAR
  stored-vs-computed schematic, d23 equivalent)
- `src/content/docs/math/system-elements.md` — inline ` ```d2 ` block
  (system-element-overview, now a code-authored schematic)

---

## 5. Mermaid — inline flowcharts

**Use when** the diagram is a flowchart, decision tree, state machine, or
sequential pipeline.

Mermaid blocks live **inline** in the spec markdown, rendered client-side by
`astro-mermaid` with `autoTheme: true` (configured in `astro.config.mjs`). There
is no separate init file or committed asset.

Conventions:

- **Default to `flowchart TB`** (top-bottom). The Starlight content column is
  narrow; a horizontal `LR` layout with more than four nodes in a row squeezes
  nodes to illegibility. Use `LR` only when the diagram has **three or fewer
  nodes** in a row.
- For `subgraph` content that must be horizontal (e.g., stage-T to stage-1
  pipelines), keep the **outer** flow `TB` so subgraphs stack vertically, and use
  `direction LR` **inside** each subgraph.
- Node shapes: `["text"]` process, `{"text"}` decision, `(["text"])` start/end stadium
- `<br/>` for line breaks; `<b>…</b>` / `<i>…</i>` for emphasis
- Prefer **short, compact** labels with `·` as a mid-dot separator over
  multi-line labels — every extra `<br/>` inflates node height.
- Subgraphs for grouping (MPI ranks, validation layers, stages). **Max two levels
  of nesting** — any deeper and it is a schematic (§4).
- **Keep subgraph titles ≤ ~40 characters / one line.**

Starting point: the inline mermaid flowchart in
`src/content/docs/math/sddp-algorithm.mdx` §3 (the SDDP iteration-cycle
flowchart). No separate asset is committed — the mermaid source IS the spec source.

---

## 6. Naming and paths

| Asset kind        | Source location                                                           | How rendered                         |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| Observable Plot   | `src/components/<Name>Plot.astro` + `src/figures/<name>.ts` (+`.test.ts`) | Client-side island, no committed SVG |
| D2 schematic      | Inline ` ```d2 ` fence in the chapter `.md` / `.mdx`                      | Build-time inline SVG by `astro-d2`  |
| Mermaid flowchart | Inline ` ```mermaid ` fence in the chapter `.md` / `.mdx`                 | Client-side by `astro-mermaid`       |

Component naming: `<Name>` is PascalCase, matching the Astro component filename.
Compute module: `<name>` is camelCase, matching the `.ts` and `.test.ts` filenames.
There is no `dNN` prefix scheme for inline fences (they have no filesystem path).
Observable Plot components do not need a numeric prefix — name by semantic role
(e.g., `ValueFunctionPlot`, `CvarPlot`, `ConvergencePlot`).

---

## 7. Quality gates

Before committing a diagram change:

- `npm run check:figures` — asserts every `.astro` island has a paired `src/figures/<name>.ts`
  and `src/figures/<name>.test.ts`.
- `npm run check:d2` — asserts all ` ```d2 ` fences use ELK layout (no TALA).
- `npm run check:math` — asserts math rendering parity (remark-math + rehype-katex).
- `npm test` — runs the full test suite including `src/figures/*.test.ts`; the
  tested compute layer must be green (correctness guarantee).

All four must pass before the PR is opened.

---

## 8. Migration log

Short record of decisions worth preserving across sessions.

| Date       | Decision                                                                                                                                                                                                            | Source               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 2026-04-22 | Original pipeline established with Python-based math plots, inline mermaid, and a render-locally policy for committed SVG assets                                                                                    | `55bb979`            |
| 2026-04-22 | Math plots (value function, convergence bounds, CVaR risk measure, PAR stored vs computed) authored in the original pipeline                                                                                        | `55bb979`, `d0a6d4c` |
| 2026-04-22 | Flowchart batch authored as inline mermaid: 7 diagrams across sddp-algorithm, work-distribution, solver-abstraction, cli-and-lifecycle, etc.                                                                        | `e9c3699`            |
| 2026-04-22 | Consistency rule established for HPC topology family (all diagrams in a family share one tool)                                                                                                                      | User directive       |
| 2026-06-xx | Pipeline overhauled for Starlight (E4): math plots → tested-compute Observable Plot islands; composed-block schematics → inline D2 (ELK); spatial diagrams → inline D2; browser-mermaid → astro-mermaid (autoTheme) | E4 epic              |
| 2026-06-xx | ELK-only mandate established (E10 ticket-032): proprietary TALA layout engine watermarks output without a licence; `check:d2` guard enforces ELK                                                                    | ticket-032           |
| 2026-06-25 | Onboarding-figures guidance added (§1.4): conceptual/overview chapters pair the key equation with a diagram/plot, reusing the tested-compute islands as teasers (model: SDDP.jl `first_steps`)                      | Part-1 docs review   |

---

## 9. Anti-patterns

- **Don't** hand-author SVGs for methodology diagrams. Without a source of
  truth, they bitrot silently and nobody can review a small change.
- **Don't** mix tools within a diagram family. If one LP section diagram is
  inline D2, all diagrams in that section are inline D2.
- **Don't** use D2 for a math plot (use Observable Plot) or Observable Plot for
  a flowchart (use Mermaid). The table in §1.1 is not a suggestion.
- **Don't** use Observable Plot as a layout tool. If the diagram has no computed
  math, it is not an Observable Plot diagram.
- **Don't** hard-code hex colors in Observable Plot islands. All color references
  go through `--dgm-*` CSS vars read at render time.
- **Don't** use TALA as the D2 layout engine. Always `layout: "elk"`. The
  `check:d2` guard will catch this, but catch it in authoring first.
- **Don't** nest mermaid subgraphs more than two levels deep — the layout
  engine degrades and the diagram is trying to be a schematic (§4).
- **Don't** position Observable Plot markers by eye. Every marker, tangent, and
  quantile must come from a formula evaluation in `src/figures/<name>.ts`,
  asserted by `src/figures/<name>.test.ts`.
