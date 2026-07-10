# Cobre Docs — Development Guidelines

## Project Overview

Cobre-docs is the **methodology reference** for the Cobre ecosystem — an Astro
Starlight site containing the specification corpus for SDDP-based hydrothermal
dispatch.

> **Current layout.** The Starlight app currently lives in the `site/`
> subdirectory (the legacy mdBook tree still sits at the repo root pending
> decommission). Run the `npm` commands below from `site/`, and read the
> content/component paths in this guide (`src/content/docs/`, `src/components/`,
> `src/figures/`, `astro.config.mjs`, …) as `site/`-prefixed until the
> `site/`→root promotion runs — after which they are exactly as written.

- **Dev**: `npm run dev` (Astro dev server)
- **Build**: `npm run build`; `npm run build:versions` for multi-version assembly
- **Build hygiene**: `npm run build` needs a clean (committed) working tree —
  Lunaria reads git history and errors on the `/lunaria` route with uncommitted
  changes to tracked files. Build and verify on committed state.
- **KaTeX**: manual remark-math + rehype-katex (D4) wired in `astro.config.mjs`
  — NOT a Starlight plugin. Math is rendered to static HTML at build time (zero
  client JS).
- **Source**: all chapters live under `src/content/docs/`; the sidebar/TOC is
  configured in `astro.config.mjs` (Starlight `sidebar`), not a flat text
  table-of-contents file.
- **Audience**: `methodology.cobre-rs.dev` (see `docs/design/dev-strategy.md`)

The actual Cobre code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State

**Synced to: cobre v0.10.0 (2026-07-10).**

The corpus is a **methodology-only** reference (math, worked examples,
reference) organised into the 7-Part sidebar configured in `astro.config.mjs`.
Architecture, HPC, interfaces, data-model, and configuration live in the cobre
developer guide (see "Relocated domains" below).

---

## Hard Rules

- **Ground truth**: code > spec. When they diverge, update the spec.
- **Batched edits**: a change to the methodology that touches multiple chapters
  must land as a single batch (one commit / one PR) — there is no propagation
  registry, so the corpus only stays consistent if every affected chapter is
  edited together. (Example: the v0.8.0 state-pinning change touched
  lp-formulation, cut-management, sddp-algorithm, lp-warm-start, determinism,
  notation, glossary, and both worked examples.)
- **Serialization (cobre code fact)**: `postcard` for MPI broadcast,
  `FlatBuffers` for policy persistence. Never `bincode`.
- **No `Box<dyn Trait>` (cobre code fact)**: cobre uses enum dispatch for
  closed variant sets (e.g. solver `Profile`, `LocalCommKind`). Reflect this if
  a chapter describes the solver interface.
- **Brand colours**: the site identity is **Copper** (`#B87333`), not blue — see
  [`docs/design/brand.md`](docs/design/brand.md) before any theming. **Never infer
  brand colour from the `spike/` palette** (its `--dgm-accent` is flow-blue for
  diagram/hydro use, not the UI accent).

---

## Methodology Authoring Standards

The corpus is a **general, instance-agnostic methodology reference** — not an
implementation guide, not a deployment-specific tutorial. (Codified from the
Part-1 docs review, 2026-06.)

- **No instance magic numbers.** Reference and symbol tables carry meaning, units,
  and structure — never "typical size/value" columns or instance counts (plant
  counts, `$/MWh` ranges, horizon lengths). Those hold for some studies and are
  absurd for others; concrete numbers belong only in an explicit **worked example**
  (Part 6). If a number encoded a methodological _ordering_ (e.g. a penalty
  hierarchy), keep the ordering in prose and drop the absolute values.
- **Symbol keys stay conceptual.** Notation keys and overview tables define what a
  symbol _means_; they do not carry solver internals (reduced costs, column
  pinning, prescalers, hot-path details). Keep those in the derivation section that
  owns them — reinforces _code > spec_ and _Relocated domains_.
- **Don't justify symbol choices.** State the notation clearly; do not explain why a
  symbol was chosen (no etymology/provenance asides, especially Portuguese). The
  bilingual **glossary** and practitioner term-maps (`reference/glossary.md`,
  `hydro-production-models` §3) are a deliberate translation aid for
  DECOMP/DESSEM/NEWAVE practitioners — those stay.
- **Conceptual / overview chapters earn their visuals.** Introduce an idea with the
  equation(s) + a diagram + the tested-compute plots (use `.mdx` to embed the
  Observable Plot islands), and keep notation consistent with the deep chapters the
  overview previews. (Model: SDDP.jl `first_steps`.)
- **No dev artifacts ship as content.** Spike/scaffold renderer-checks, TODO demos,
  and harness probes never appear on the published site.

---

## Spec File Patterns

When **updating the LP / SDDP / cut / warm-start cluster** (`lp-formulation.md`,
`cut-management.md`, `sddp-algorithm.mdx`, `lp-warm-start.md`,
`determinism-guarantees.md`):

→ Verify column/row layout against `StateLayout` in
`crates/cobre-sddp/src/lp/indexer/state_layout.rs` (the
`state_to_lp_incoming_column` resolver). LP construction itself lives in
`crates/cobre-sddp/src/lp/builder/` (`columns.rs`, `rows.rs`, `entries.rs`,
`template.rs`, `layout.rs`); the old `StageIndexer`/`EquipmentCounts` bags were
retired (post-v0.8.2), their study-shape fields moved to `StudyDimensions` /
`StageGeometry`.
→ **State pinning (v0.8.0)**: incoming state (storage, AR lags, anticipated-thermal
slots) is pinned by **column bounds** on the incoming-state columns, resolved
via `StateLayout::state_to_lp_incoming_column`. The `storage_fixing`,
`lag_fixing`, and `anticipated_state_fixing` row ranges are permanent empty
sentinels (`0..0`) — there are **no** state-fixing rows.
→ **Cut subgradient (v0.8.0)**: cut coefficients are the **reduced costs** of
the pinned columns, unscaled by **dividing** by `col_scale[col]` — not row
duals. NB: the v0.8.0 CHANGELOG prose says "multiply"; the shipped code
divides (`crates/cobre-sddp/src/training/backward/duals_extraction.rs`).
**Docs follow the code: divide.**
→ **LP scaling**: Cobre applies its own offline geometric-mean row/col prescaler
plus a cost-scale factor; the LP backend's internal simplex scaler is
**disabled** (HiGHS: `simplex_scale_strategy = 0`) on all phase profiles — no
double-scaling. (The LP backend is now selectable at build time — HiGHS default,
CLP opt-in — a relocated/devguide concern; keep methodology backend-generic.)
→ **Cut pool**: append-only with stable, deterministic slot indices; deactivation
toggles a cut row's RHS to a trivially-satisfied `±∞` sentinel (row never
removed); only active cuts are baked into each iteration's template.
→ **Cut selection (v0.8.1)**: periodic-pruning methods
(`level1`/`lml1`/`domination`) deactivate cuts; the **dynamic** method (DCS,
v0.8.1) instead keeps the pool whole and loads a bounded **resident subset**
per solve (lazy-exact). The `training.cut_selection` config was restructured into a tagged `selection` object — renames `active_window`→
`seed_window`, `candidate_window`→`candidate_recency`, `nadic`→
`max_added_per_round`, `domination_epsilon`→`domination_tolerance`,
`cut_activity_tolerance`→`row_activity_tolerance`; removed `enabled`/`method`/
`threshold`/`memory_window`/`basis_activity_window`. DCS code: `crates/cobre-sddp/src/cut/dcs.rs`.

When **updating the hydro-production / FPHA cluster** (`hydro-production-models.md`)

→ Computed-FPHA fit is a **3-D convex hull** of the `(volume, turbined)`
production cloud at spillage = 0 (flow axis starts at 0; **no** spillage axis;
**no** synthetic closing point — the q=0 column anchors), capped at installed
capacity, with a least-squares **`α` correction** and a per-plane lateral-flow secant for
`γ_S`. Fits are **per-stage**; run-of-river is supported (`γ_V` snapped to 0).
→ **`reference_volume`** (`volume_hm3` XOR `percentile`) is the single source of
truth for the fit and the `ρ_eq` derivation; `reference_volume_hm3` is gone.
→ Optional `fpha_plane_reduction` (angle/distance, origin plane never merged) and
optional exact **piecewise-quartic tailrace** with backwater families.
→ Verify against `crates/cobre-sddp/src/production/fpha_fitting/`. **Docs follow
the code**: the design-doc/CHANGELOG "synthetic closing point" is NOT shipped.

When **authoring or editing a diagram** (new inline ` ```d2 ` diagram —
schematic, flowchart, or network one-line — or a tested Observable Plot island
under `src/figures/` + `src/components/`):
→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) —
tool-selection decision table (§1.1), the `.d2-svg` brand keystone + semantic
node-colour vocabulary (§4.2), flowchart idiom (§5), quality gates (§7).
→ **Two tools only**: **d2** draws every diagram (schematics, flowcharts, loops,
network one-lines — build-time SVG, one themable keystone in
`src/styles/diagrams.css`); **Observable Plot** draws every computed math plot.
**Mermaid was retired (2026-07)** — never add a ` ```mermaid ` fence; write a
` ```d2 ` flowchart instead. Semantic node colours (hydro→Flow Blue,
thermal→Spark Amber, NCS→Patina, deficit→Signal Red, generic→copper) come from
the `classes` vocabulary in diagram-authoring.md §4.2, not ad-hoc hex.
→ Reference implementations: `src/components/ValueFunctionPlot.astro` +
`src/figures/valueFunction.ts` (Observable Plot math plot), an inline ` ```d2 `
block in `src/content/docs/math/lp-formulation.md` (schematic), the ` ```d2 `
SDDP loop in `src/content/docs/math/sddp-algorithm.mdx` (flowchart), and the
semantic-coloured network one-line in
`src/content/docs/math/system-elements.mdx`.

When **updating hydro dead-volume filling or commissioning windows**
(`penalty-system.md`, `system-elements.md`, `lp-formulation.md`,
`equipment-formulations.md`):
→ **Filling (post-v0.8.2)**: `filling = {start_stage_id, filling_min_rate_m3s}`.
Per-stage minimum end-of-stage storage `V_target[t]` ramps to `min_storage_hm3`
at the last filling stage `entry_stage_id - 1` (`build_filling_v_target` in
`lp/builder/template.rs`); soft floor row `v_h + σ_fill ≥ V_target[t]`
(`lp/builder/rows.rs`), slack cost `filling_target_violation_cost`. The retention
/ impound cap is **gone** — natural inflow flows freely. Once operating, the
soft `min_storage` floor (`filled_min_storage_floor`, `rows.rs`) applies.
→ **Penalty ordering (post-v0.8.2)**: `storage_violation_below_cost > deficit >
{operational} > resource > regularization`, with the **separate** rule
`deficit > filling_target_violation_cost` (the fill schedule is not as hard as
load shedding). Validator: `cobre-io/src/validation/semantic/scenarios.rs`
(`check_penalty_ordering` + one-sided hard `check_filling_sufficiency`).
→ **Commissioning windows**: half-open `[entry_stage_id, exit_stage_id)` via
`commissioning_active` (`lp/builder/mod.rs`); applies to thermals, lines, NCS,
pumping, contracts (+ hydro generation). Outside the window the entity's columns
are pinned to `[0, 0]`. NB: the cobre book's "Entity Lifecycle" table calls exit
"inclusive" — the **code is exclusive**; docs follow the code.

---

## Relocated domains

Architecture, HPC/parallelism, solver/interfaces, data-model/output-schemas, and
configuration live in the **cobre developer guide**. Do
**not** re-add chapters, CLAUDE rules, or cross-links for them here (no
`architecture/`, `hpc/`, `data-model/`, `interfaces/`, `configuration/` trees).
Topics such as `SolverError` classification, the GIL/MPI safety contract, output
schema column counts, and Python bindings live in that guide; reference it from a
methodology chapter only via a trailing-line cross-link, never by reintroducing
the content.

---

## Key References

| Resource                  | Location                                                               | Purpose                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cobre code (ground truth) | `https://github.com/cobre-rs/cobre/`                                   | Actual implementation                                                                                            |
| Software book             | `https://docs.cobre-rs.dev/`                                           | User-facing docs                                                                                                 |
| Dev strategy              | `https://github.com/cobre-rs/cobre/docs/design/dev-strategy.md`        | Documentation & public presence strategy                                                                         |
| CHANGELOG                 | `https://github.com/cobre-rs/cobre/CHANGELOG.md`                       | Per-release feature list (sync source)                                                                           |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for spec diagrams                                                                 |
| Brand & colour            | [`docs/design/brand.md`](docs/design/brand.md)                         | Site colour/identity authority — **Copper** primary, Flow Blue for links/hydro only. Consult before any theming. |
