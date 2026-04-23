# Diagram Authoring Guide

**Scope.** This guide defines **which tool each kind of methodology-reference
diagram uses**, and the design system that keeps them visually coherent. It
covers diagrams under `src/specs/**` (rendered into `src/images/`) and the
source scripts under `diagrams/`.

This is separate from the _tutorial-layer_ visualizations in
[`dev-strategy.md`](dev-strategy.md) §5 (Chart.js, GSAP hero, interactive
widgets) — those are user-facing onboarding artifacts for
`methodology.cobre-rs.dev` and `cobre-rs.dev`. This guide is the rulebook
for **every diagram you author inside a spec file**.

Companion documents:

- [`diagrams/README.md`](../../diagrams/README.md) — commands, paths, quickstart
- [`diagrams/excalidraw/design-system.md`](../../diagrams/excalidraw/design-system.md) — Excalidraw canvas/palette/symbols

---

## 1. Tool selection

### 1.1 Decision table

| Diagram content                                                                            | Tool                            | Why                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------- |
| Mathematical function, distribution, convergence curve, histogram                          | **matplotlib**                  | Markers / curves computed from the math; correct by construction          |
| Composed block diagram (nested containers, labeled regions, data flow with math in labels) | **matplotlib + `block_layout`** | Code-defined topology, consistent visual identity, PR-reviewable as diffs |
| Flowchart, state machine, sequential pipeline, lifecycle                                   | **mermaid (inline)**            | No asset to maintain; authoring lives next to the prose it illustrates    |
| Power-system one-line (buses, generators, demand/deficit arrows)                           | **Excalidraw**                  | Domain-specific spatial semantics that a code tool would flatten          |
| Animated walk-through of an algorithm                                                      | **manim (optional group)**      | Motion that teaches; rare, always paired with a static fallback SVG       |

### 1.2 Decision tree

````
Does the diagram's content reduce to a mathematical function or distribution?
├── YES → matplotlib                                      (§3)
│
Is it a composition of labeled boxes, possibly nested, possibly with arrows
between them (data flow, hardware topology, memory layout)?
├── YES → matplotlib + block_layout                       (§4)
│
Is it a sequential flow, decision tree, state transition, or lifecycle?
├── YES → inline ```mermaid block                         (§5)
│
Is it a power-system one-line or does grid-snap spatial layout carry meaning?
├── YES → Excalidraw                                      (§6)
│
None of the above clearly fits → **stop and discuss**, do not improvise.
````

### 1.3 Consistency rule (non-negotiable)

**A family of related diagrams uses the same tool.** If the HPC section needs
three topology diagrams, they are all matplotlib + `block_layout` — not two
in one tool and one in another. Mixed tools within a domain fragment the
visual identity and make the reader re-learn vocabulary. When a new diagram
joins an existing family, it inherits the family's tool.

---

## 2. Rendering policy — D2 (render locally, commit the asset)

1. Edit the source (Python script, mermaid fence, Excalidraw file).
2. Render locally with `make diagrams` (matplotlib) or by eye (mermaid is
   rendered by the browser at book build time).
3. Inspect `make serve --open`.
4. Commit **source + rendered SVG** in the same commit.

Rationale: PR reviewers see the visual diff alongside the code change; CI
stays fast; builds never fail from a missing font or a library version drift.

CI installs `mdbook-mermaid` (pinned) and builds the book against committed
assets — it never re-renders matplotlib scripts.

---

## 3. matplotlib — math plots

**Use when** the diagram's content is a function, distribution, time series,
or any quantity that can be computed from a formula.

**Correctness rule.** The math **is** the diagram. Tangent slopes come from
the derivative. Quantiles come from numerical inversion of the CDF. Confidence
bands come from the actual noise model. Never position markers by eye.

**Starting points.** Clone the structure of:

- `diagrams/matplotlib/d02_value_function.py` — convex function + Benders tangents
- `diagrams/matplotlib/d21_convergence_bounds.py` — time-evolving bounds with a CI band
- `diagrams/matplotlib/d22_risk_measure_cvar.py` — PDF + numerically-derived risk markers

Every script must:

- Begin with `from __future__ import annotations`
- Call `apply_cobre_style(dark=False)` from `cobre_brand`
- Derive its output filename: `stem = Path(__file__).stem.replace("_", "-")`
- Save to `Path(__file__).resolve().parents[2] / "src" / "images" / f"{stem}.svg"`

---

## 4. matplotlib + `block_layout` — composed block diagrams

**Use when** the diagram is a composition of labeled rectangles — with or
without nesting — and spatial layout is schematic rather than measured.

All such diagrams share one source of truth for styling: the `block_layout`
helper module in `diagrams/matplotlib/`. This is what guarantees a uniform
identity across d23 (data-flow), d07-d09 (HPC topology), and anything added
later.

### 4.1 Primitives (source: `diagrams/matplotlib/block_layout.py`)

- `block(ax, xy, wh, *, title, title_mono, role, lw)` → `Placed` — rounded rectangle with optional title; returns a value object exposing edge midpoints (`left_mid`, `right_mid`, `top_mid`, `bottom_mid`) and center (`cx`, `cy`) for arrow connection.
- `arrow(ax, src, dst, *, label, kind, label_offset)` — directed arrow between `Placed` blocks (auto edge-selection) or raw points; `kind ∈ {dataflow, transform, comm}` selects stroke style.
- `arrange(bounds, *, rows, cols, pad, gap, reserve_top)` — return `[(xy, wh), …]` for a grid of equal cells inside a bounding box, row-major top-left first.
- `text / math / caption(ax, xy, s, …)` — typography helpers wired to `BODY_SIZE` / `ANNOT_SIZE` so per-script font choices stay off the critical path.

Constants: `CORNER_RADIUS`, `INNER_PAD`, `GAP`, `TITLE_SIZE`, `BODY_SIZE`, `ANNOT_SIZE`, `LW_BLOCK`, `LW_NESTED`, `ROLES`, `ARROW_STYLES`.

Reference implementation: `diagrams/matplotlib/d23_par_stored_vs_computed.py`
(the first consumer — proves the primitives at 5 blocks + 3 arrows).

(When a new primitive is needed, add it here — don't inline one-off shapes.)

### 4.2 Roles & palette

| Role      | Face color | Border               | Used for                                    |
| --------- | ---------- | -------------------- | ------------------------------------------- |
| `storage` | `#F5EEE4`  | copper `#B87333`     | On-disk data, parquet files                 |
| `runtime` | `#EDF5EE`  | patina `#4A8B6F`     | In-memory computed state                    |
| `compute` | `#F5EEE4`  | copper `#B87333`     | Compute nodes, ranks, threads               |
| `shared`  | `#F0F4F8`  | flow blue `#4A90B8`  | SharedRegion / intra-node read-only data    |
| `warning` | `#FDE8E8`  | signal red `#DC4C4C` | Errors, aborts, deficit, stall              |
| `neutral` | `#FFFFFF`  | mid gray `#555555`   | Generic containers, LP consumer, interfaces |

All colors come from `cobre_brand.COLORS`. **Never introduce ad-hoc hex.**
If a new semantic role is needed, add it to the palette _and_ update this
table — don't silently pick a color.

### 4.3 Typography & spacing constants

| Token           | Value                         |
| --------------- | ----------------------------- |
| Title           | 13 pt, semibold               |
| Body label      | 12 pt, regular                |
| Annotation      | 10 pt, italic, MID_TEXT color |
| Corner radius   | 0.03 (figure units)           |
| Outer padding   | 0.25                          |
| Inner padding   | 0.15                          |
| Arrow mutation  | 18 pt (stroke head)           |
| Transform arrow | 1.6 pt copper                 |
| Dataflow arrow  | 1.4 pt mid gray               |
| Comm arrow      | 1.2 pt dashed, flow blue      |

These live as constants in `block_layout.py`; do not override per-script.

### 4.4 Transparent background (mandatory for composed-block diagrams)

Composed-block diagrams save with `transparent=True` so they blend with the
coal-theme mdBook page rather than appearing as white panels stapled onto it.
Every `d*.py` script in this category ends with:

```python
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight",
            transparent=True)
```

Consequences the author must keep in mind:

- **Text outside any role-filled block** (figure title, column headers,
  external captions) must use `COLORS.BODY` (`#C8C6C2`) or `COLORS.BRIGHT`
  (`#E8E6E3`) explicitly. The default `COLORS.DARK_TEXT` becomes invisible
  against the coal page.
- **Text inside a block** stays `DARK_TEXT` — every role fill is a light
  tint, so dark text on a cream/mint/blush card reads correctly.
- **`fig.suptitle(...)`** needs `color=COLORS.BRIGHT` for the same reason.
- **`caption()`** (MID_TEXT on light fill) is only safe _inside_ a block;
  for a caption sitting on the page background, use
  `text(ax, ..., size=ANNOT_SIZE, italic=True, color=COLORS.BODY)`
  rather than `caption(...)`.

Math plots (§3) keep white backgrounds — they read as chart panels and their
axes/curves rely on dark defaults. Transparent-bg would require retuning
every curve colour and is out of scope for that category.

---

## 5. mermaid — inline flowcharts

**Use when** the diagram is a flowchart, decision tree, state machine, or
sequential pipeline. Mermaid blocks live **inline** in the spec markdown,
rendered client-side by `mdbook-mermaid` against the branded init at
`/mermaid-init.js`.

Conventions:

- **Default to `flowchart TB`** (top-bottom). The mdBook content column is
  narrow (~700–900 px); a horizontal `LR` layout with more than four nodes
  in a row squeezes each node to ~80 px, and the text becomes illegible.
  Use `LR` only when the diagram has **three or fewer nodes** in a row.
  For stateDiagram-v2, set `direction TB` unless the state machine is
  genuinely three states or fewer.
- For `subgraph` content that must be horizontal (e.g., stage-T to stage-1
  pipelines), keep the **outer** flow `TB` so subgraphs stack vertically,
  and use `direction LR` **inside** each subgraph.
- Node shapes: `["text"]` process, `{"text"}` decision, `(["text"])` start/end stadium
- `<br/>` for line breaks; `<b>…</b>` / `<i>…</i>` for emphasis (`htmlLabels: true` is on)
- Prefer **short, compact** labels with `·` as a mid-dot separator over
  multi-line labels in sequential flows — every extra `<br/>` inflates node
  height, and tall nodes in a narrow column push neighbours around.
- Subgraphs for grouping (MPI ranks, validation layers, stages). **Max two levels of nesting** — any deeper and it's a block diagram (§4).
- **Keep subgraph titles ≤ ~40 characters / one line.** The ELK layout engine
  reserves space for a single line of subgraph title and doesn't recompute
  when the label wraps, so a two-line title gets overlapped by the first
  child node. When more detail is needed, put it in the surrounding prose,
  not the subgraph label.
- Per-node `style` directives only when defaults don't communicate — the branded init handles the general case.

Starting points: the seven blocks committed in `e9c3699` (sddp-iteration-cycle,
execution-phases, validation-layers, …).

No separate asset is committed. Mermaid source IS the spec source — which is
the whole point: diffs land in the same PR as the prose they illustrate.

---

## 6. Excalidraw — spatial / domain diagrams

**Use when** spatial layout carries meaning that a code tool would flatten.
In practice today: only power-system one-line diagrams
(`system-element-overview.svg` is the current example).

Workflow:

1. Author `.excalidraw` source in `diagrams/excalidraw/`
2. Follow palette + symbol library in `diagrams/excalidraw/design-system.md`
3. Export SVG with grid snap on
4. Commit both the `.excalidraw` source and the exported SVG

---

## 7. Naming & paths

| Asset kind             | Source                                    | Output                    |
| ---------------------- | ----------------------------------------- | ------------------------- |
| matplotlib             | `diagrams/matplotlib/dNN_slug.py`         | `src/images/dNN-slug.svg` |
| block_layout (variant) | same                                      | same                      |
| mermaid                | fenced block inside the spec              | — (client-side render)    |
| Excalidraw             | `diagrams/excalidraw/dNN-slug.excalidraw` | `src/images/dNN-slug.svg` |
| manim (optional)       | `diagrams/matplotlib/dNN_slug_anim.py`    | `src/images/dNN-slug.gif` |

- Script filenames use `_` (Python convention); output asset names use `-` (web convention).
- **Derive the output stem in the script**: `stem = Path(__file__).stem.replace("_", "-")`. Never hardcode the filename — it becomes a second source of truth that silently drifts.
- `dNN` prefix is reserved for machine-rendered diagrams. Numbers are assigned on migration and never reused.

---

## 8. Quality gates

Before committing:

- `make lint` passes — `ruff check` clean, `mypy --strict` clean on all scripts.
- New matplotlib scripts are **correct by construction** — markers come from formula evaluation.
- No ad-hoc hex colors; all color references go through `cobre_brand.COLORS` / `GEN_COLORS`.
- Fonts are IBM Plex Sans (body) and JetBrains Mono (code) — already wired via `.mplstyle` files and `mermaid-init.js`.
- For matplotlib SVGs: re-render is reproducible. Minor byte-level differences from matplotlib's non-determinism are acceptable; visual differences are not without a source-change to justify them.

---

## 9. Migration log

Short record of decisions worth preserving across sessions, so future edits
don't re-litigate. Commit hashes point to the full context.

| Date       | Decision                                                                                                                                                                                                                       | Commit / source      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 2026-04-22 | Pipeline set up: uv project, matplotlib + mermaid at repo root, optional manim group, D2 rendering policy                                                                                                                      | `55bb979`            |
| 2026-04-22 | Math batch migrated to matplotlib: d02 value function, d21 convergence bounds, d22 CVaR risk measure, d23 PAR stored vs computed                                                                                               | `55bb979`, `d0a6d4c` |
| 2026-04-22 | Flowchart batch migrated to inline mermaid: 7 diagrams across `sddp-algorithm`, `work-distribution`, `solver-abstraction`, `cli-and-lifecycle`, `input-loading-pipeline`, `validation-architecture`, `simulation-architecture` | `e9c3699`            |
| 2026-04-22 | Consistency rule established for HPC topology family: `hybrid-parallelism`, `memory-architecture`, `forward-pass-distribution` share one tool (matplotlib + `block_layout`)                                                    | User directive       |

When adding an entry: date (ISO), one-line rule, commit hash or source of the
call. Do not paste commit messages here — git log has those.

---

## 10. Anti-patterns

- **Don't** hand-author SVGs for methodology diagrams. Without a source of
  truth, they bitrot silently and nobody can review a small change.
- **Don't** mix tools within a diagram family. If one HPC topology diagram
  is matplotlib + `block_layout`, all of them are.
- **Don't** hardcode output filenames. Derive from `__file__`.
- **Don't** introduce ad-hoc hex colors. Extend `cobre_brand.COLORS` with a
  named role and record it in §4.2.
- **Don't** use matplotlib for a flowchart (use mermaid) or mermaid for a
  math plot (use matplotlib). The table in §1.1 is not a suggestion.
- **Don't** nest mermaid subgraphs more than two levels deep — the layout
  engine degrades and the diagram is trying to be a block diagram (§4).
- **Don't** re-render everything before an unrelated commit. Matplotlib's
  non-deterministic bytes create noise diffs. `git checkout -- <file>` the
  spurious ones.
