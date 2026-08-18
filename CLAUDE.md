# Cobre Docs — Development Guidelines

## Project Overview

Cobre-docs is the **single, unified documentation site** for the Cobre ecosystem
— an Astro Starlight site that layers the SDDP methodology reference (math, worked
examples) with the user-facing software guide (install, configure, I/O, CLI,
examples) for hydrothermal dispatch. It is the one documentation property; the
legacy `cobre/book/` mdBook is retired and the developer/crate-internal layer now
lives as per-crate `README.md` files + `ARCHITECTURE.md` in the `cobre` repo.

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
- **Audience & domain**: the unified site serves `docs.cobre-rs.dev` (see
  `docs/design/dev-strategy.md`); `methodology.cobre-rs.dev` 301-redirects in.

The actual Cobre code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State

**Synced to: cobre v0.14.1 (2026-08-18).**

The corpus is a **unified two-layer reference**: the annotation-free **math
layer** (formulation, algorithm, worked examples) interleaved per topic with a
version-scoped **software layer** (Configure / I·O tabs, the I/O Reference, and
Running Cobre), organised into the interleaved sidebar configured in
`astro.config.mjs`. Only crate-internal/developer architecture lives outside this
site, as `cobre` per-crate READMEs + `ARCHITECTURE.md` (see "Unified corpus & the
developer surface" below). Versioning is **latest-only** for now (`versions.json`
= `{ latest }`); the build-per-tag mechanism is wired but publishes no frozen
snapshots yet.

---

## Hard Rules

- **Ground truth**: code > spec. When they diverge, update the spec.
- **No cobre version numbers in the math layer.** `math/*` and the overview/
  notation/glossary carry no cobre version annotations (no "as of vX.Y",
  "added in", "earlier releases", migration notes) — the math is always-true and
  instance-agnostic. The **software layer** (`_impl/*` partials, `reference/*`,
  `running/*`) may carry version-scoped config/I·O/CLI detail: each versioned
  snapshot describes current cobre for its tag. This is the two-layer expression
  of the T1 versioning tension.
- **Batched edits**: a change that touches multiple chapters must land as a single
  batch (one commit / one PR) — there is no propagation registry, so the corpus
  only stays consistent if every affected chapter is edited together. (Example:
  the v0.10.0 sync touched block-formulations, lp-formulation, system-elements,
  penalty-system, cut-management, par-inflow, determinism, notation, the `_impl`
  partials, and the reference pages as one batched set of commits.)
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

## Unified corpus & the developer surface

The site is **one corpus with two layers**, interleaved topic-by-topic. This
_inverts_ the previous "relocated domains" rule: user-facing architecture-adjacent
content (configuration, I/O files, output schemas, CLI, examples, results) now
**does** live here, as the software layer — it is not exiled to a separate guide.

- **Math layer** — the page body: formulation, algorithm, notation, worked
  examples. Annotation-free and instance-agnostic (see Math-Layer standards).
- **Software layer** — imported sibling partials rendered as tabs
  (`math/_impl/_<topic>.configure.mdx`, `.io.mdx`, `.notes.mdx`) plus the
  `reference/*` and `running/*` pages. Version-scoped; may carry concrete config
  keys, output-schema columns, CLI flags, and instance detail.
- **Source-vs-render split (hard)**: math stays in the topic's own `math/*`
  file; the software layers live in **separate** `_impl/_*` partial files
  rendered as `<Tabs>`. The partial **filename** must start with `_`
  (`_impl/_hydro.configure.mdx`) — Starlight's `docsLoader` globs `**/[^_]*` by
  **basename**, so the `_` on the directory alone is not enough. This keeps
  per-release config churn out of the annotation-free math file.
- **Developer / crate internals stay OUT of the site.** Crate responsibilities,
  the dependency graph, `SolverError` classification internals, the GIL/MPI
  safety contract, and other implementation architecture live as **`cobre`
  per-crate `README.md` + `ARCHITECTURE.md`** on GitHub. Reference them from a
  chapter only via a trailing cross-link, never by reintroducing the content.
- **Two-way backlink contract**: a software-layer partial links up to the math
  it implements; the reference/running pages link back to the topic chapter.
  Keep both directions live (the `check:links` gate enforces resolution).

---

## Math-Layer Authoring Standards

The math layer is a **general, instance-agnostic methodology reference** — not an
implementation guide, not a deployment-specific tutorial. (Codified from the
Part-1 docs review, 2026-06; scoped to `math/*` + overview/notation/glossary.)

- **No instance magic numbers.** Reference and symbol tables carry meaning, units,
  and structure — never "typical size/value" columns or instance counts (plant
  counts, `$/MWh` ranges, horizon lengths). Those hold for some studies and are
  absurd for others; concrete numbers belong only in an explicit **worked example**
  (Part 6) or the software layer. If a number encoded a methodological _ordering_
  (e.g. a penalty hierarchy), keep the ordering in prose and drop the absolute
  values.
- **Symbol keys stay conceptual.** Notation keys and overview tables define what a
  symbol _means_; they do not carry solver internals (reduced costs, column
  pinning, prescalers, hot-path details). Keep those in the derivation section that
  owns them — reinforces _code > spec_.
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
- **Voice gate (Epic 04).** `check:voice` runs the corpus-wide hype/unpinned-number
  detector; `check:version` forbids cobre-version narration in the math zone. A
  genuine pre-existing exception is grandfathered in `scripts/doc-lint-allow.txt`
  (a ratchet — any NEW hit fails the gate).

## Software-Layer Authoring Standards

The software layer (`_impl/*` partials, `reference/*`, `running/*`) is the
**version-scoped, user-facing** counterpart. It **may** carry concrete config
keys, JSON field tables, output-schema columns, CLI flags, and example values —
the things the math layer forbids. It still follows _code > spec_ (verify every
field/flag against the current cobre code, not stale prose), stays user-facing
(no crate internals — those are cobre READMEs), and keeps its `_`-prefixed
partial filenames so the render split holds.

---

## Spec File Patterns

When **updating the LP / SDDP / cut / warm-start cluster** (`lp-formulation.md`,
`cut-management.mdx`, `sddp-algorithm.mdx`, `lp-warm-start.md`,
`determinism-guarantees.md`):

→ Verify column/row layout against `StateSpace` in
`crates/cobre-sddp/src/lp/indexer/state_space.rs` (the
`state_to_lp_incoming_column` resolver). LP construction lives in
`crates/cobre-sddp/src/lp/builder/` (`columns.rs`, `rows.rs`, `entries.rs`,
`template.rs`, `layout.rs`).
→ **State pinning**: incoming state (storage, AR lags, in-transit buckets,
anticipated-thermal slots) is pinned by **column bounds** on the incoming-state
columns. The `storage_fixing`/`lag_fixing`/`transit_bucket_fixing`/
`anticipated_state_fixing` row ranges are permanent empty sentinels (`0..0`) —
there are **no** state-fixing rows.
→ **Cut subgradient**: cut coefficients are the **reduced costs** of the pinned
columns, unscaled by **dividing** by `col_scale[col]` — not row duals. Which
state dimensions a stage's cut projects onto is governed by its per-stage
`state_variables` selection (`cut_state_projection.rs`, `duals_extraction.rs`):
storage and inflow-lags are toggleable (default storage-only), while transit
buckets and anticipated slots are always projected in.
→ **Chronological block mode**: `stages.json` per-stage `block_mode`
(`parallel` default | `chronological`); a chronological stage chains per-block
storage, computes per-block FPHA + evaporation on each block's **average**
storage, and (PreFilling) freezes each block's storage identity
(`rows.rs`/`entries.rs`). Cut coefficients are block-count/mode-independent, so a
policy is **portable across block modes and counts** — policy load validates only
state dimension + the per-slot entity manifest, never `block_mode`
(`policy_load.rs`).
→ **LP scaling**: Cobre applies its own offline geometric-mean row/col prescaler
plus a configurable cost-scale factor (`modeling.cost_scale_factor`, default
`1_000_000.0` = `DEFAULT_COST_SCALE_FACTOR` in `setup/params.rs`); the LP
backend's internal simplex scaler is **disabled by default** (HiGHS:
`simplex_scale_strategy = 0`, pinned on all three phase profiles in
`solve/solver_phase.rs`). It is now **overridable per phase** via the solver
profile's `scale` field (`off` | `solver_scaling`) on
`training.solver.{backward,forward}` and `simulation.solver`; enabling
`solver_scaling` applies a second scaling and **breaks** the single-unscaling
exactness that `lp-formulation.md` §12.3 states as holding by default only.
(Backend is selectable at build time — HiGHS default, CLP opt-in — a
software-layer/devguide concern; keep the math backend-generic.)
→ **Cut pool**: append-only with stable, deterministic slot indices; deactivation
toggles a cut row's RHS to a `±∞` sentinel (row never removed); only active cuts
are baked into each iteration's template. Periodic-pruning methods
(`level1`/`lml1`/`domination`) deactivate; **DCS** keeps the pool whole and loads
a bounded resident subset per solve (`crates/cobre-sddp/src/cut/dcs.rs`).

When **updating hydro production / FPHA** (`hydro-production-models.mdx`):

→ Computed-FPHA fit is a **3-D convex hull** of the `(volume, turbined)` cloud at
spillage = 0 (flow axis starts at 0; **no** spillage axis; **no** synthetic
closing point — the q=0 column anchors), capped at installed capacity, with a
least-squares **`α` correction** and a per-plane lateral-flow secant for `γ_S`.
Per-stage fits; run-of-river supported (`γ_V` snapped to 0). **`reference_volume`**
(`volume_hm3` XOR `percentile`) is the single source of truth. Verify against
`crates/cobre-sddp/src/production/fpha_fitting/`.

When **updating water travel time / cascade** (`lp-formulation.md §5d`,
`system-elements.mdx`, `_impl/_hydro.*`):

→ A hydro's `travel_time_hours` on its **main cascade arc** delays release as
**augmented Benders state** — in-transit buckets, one slot per downstream plant
per maturity lag, pinned by column bounds like all state (`state_space.rs`,
shared `delivery_ring.rs`; declared arcs in `setup/bucket_topology.rs`).
`InitialConditions.past_defluences` seeds stage-0 buckets; validation requires
history ≥ the arc travel time. Output: `simulation/in_transit/`. Volume maturing
**past the last stage is dropped** (documented limitation).

When **updating anticipated thermals** (`lp-formulation.md §5c`,
`system-elements.mdx §4`, `_impl/_equipment.configure.mdx`):

→ Lead is one of `lead_stages` (calendar-free) XOR `lead_time_hours` (physical,
resolved on the stage calendar) — `AnticipatedConfig::{LeadStages,LeadTime}`
(`entities/thermal.rs`). Every commitment is **bounded, costed, and
commissioning-gated at its delivery stage** `t+K` (`columns.rs`,
`lead_time/mod.rs`); a sub-stage lead → ordinary thermal; fan-out (>1 delivery) and
lead>horizon are rejected at load. The delivered commitment is
reconciled against solver feasibility-tolerance drift at its delivery bound on
every solve (`lp/builder/commitment_reconcile.rs`); genuine over-commitment →
named error (thermal, stage, overshoot), never a bare infeasible LP.

When **updating filling / commissioning** (`penalty-system.mdx`,
`system-elements.mdx`, `lp-formulation.md`):

→ **Filling**: `filling = {start_stage_id, filling_min_rate_m3s}`; per-stage
`V_target[t]` ramp with a soft floor + `filling_target_violation_cost`;
`deficit > filling_target_violation_cost`. **Commissioning**: half-open
`[entry_stage_id, exit_stage_id)` via `commissioning_active` (`lp/builder/mod.rs`);
for thermals/lines/NCS/pumping/contracts, outside-window columns pin to `[0,0]`.
**Hydros are the exception**: outside its window a non-filling hydro is
**PreFilling** — turbine/spillage/diversion pinned to 0, storage decoupled by a
frozen identity, inflow passed downstream. **Spillage** is frozen to 0 in
PreFilling only, free during Filling and Operating (`columns.rs`, `filling_phase`).
→ **Required `operational_start_date`** (ISO) on every `system/*` entity; canonical
entity order is `(operational_start_date, id)` — rename-invariant, id-renumber
moves LP/cut/output order (`system/builder.rs` `sort_canonical`).

When **authoring or editing a diagram** (inline ` ```d2 ` or a tested Observable
Plot island under `src/figures/` + `src/components/`):

→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md).
**Two tools only** on the site: **d2** draws every diagram (build-time SVG, one
themable keystone in `src/styles/diagrams.css`); **Observable Plot** draws every
computed math plot. **Mermaid was retired (2026-07)** on the site — never add a
` ```mermaid ` fence here (it is fine in the `cobre` READMEs/ARCHITECTURE.md, which
GitHub renders). Semantic node colours (hydro→Flow Blue, thermal→Spark Amber,
NCS→Patina, deficit→Signal Red, generic→copper) come from the `classes` vocabulary
in diagram-authoring.md §4.2, not ad-hoc hex.

**JSON schemas**: the 18 input schemas are generated in `cobre` from `cobre-io`
types; this site **vendors** a committed copy (`public/schemas/`) refreshed by
`npm run refresh:schemas --ref <tag>` (reads a git ref, never the cobre working
tree). Refresh on each cobre release; the freshness gate stays in `cobre`.

---

## Key References

| Resource                  | Location                                                        | Purpose                                                      |
| ------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Cobre code (ground truth) | `https://github.com/cobre-rs/cobre/`                           | Actual implementation                                       |
| Unified docs site         | `https://docs.cobre-rs.dev/`                                   | This site (methodology + software layer)                    |
| Crate READMEs + ARCHITECTURE | `https://github.com/cobre-rs/cobre/` (`crates/*/README.md`, `ARCHITECTURE.md`) | Developer/crate-internal surface (not on the site) |
| Dev strategy              | `docs/design/dev-strategy.md`                                  | Documentation & public-presence strategy                    |
| CHANGELOG                 | `https://github.com/cobre-rs/cobre/CHANGELOG.md`               | Per-release feature list (sync source)                      |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for diagrams        |
| Brand & colour            | [`docs/design/brand.md`](docs/design/brand.md)                 | Site colour/identity — **Copper** primary, Flow Blue for links/hydro only |
