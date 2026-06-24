# Cobre Docs — Development Guidelines

## Project Overview

Cobre-docs is the **methodology reference** for the Cobre ecosystem — an mdBook
containing the specification corpus for SDDP-based hydrothermal dispatch.

- **Build**: `mdbook build` from repo root
- **Serve**: `mdbook serve --open`
- **KaTeX**: requires `mdbook-katex` v0.10.0-alpha (pre-release binary, not the crates.io version)
- **Source**: all spec files live under `src/specs/`; TOC is `src/SUMMARY.md`
- **Audience**: `methodology.cobre-rs.dev` (see `docs/design/dev-strategy.md`)

The actual Cobre code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State

**Synced to: cobre v0.8.2 (2026-06-17).**

The corpus is a **methodology-only** reference (math, worked examples,
reference) organised into the 7-Part TOC in `src/SUMMARY.md`. Architecture,
HPC, interfaces, data-model, and configuration live in the cobre developer
guide (see "Relocated domains" below).

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

## Spec File Patterns

When **updating the LP / SDDP / cut / warm-start cluster** (`lp-formulation.md`,
`cut-management.md`, `sddp-algorithm.md`, `lp-warm-start.md`,
`determinism-guarantees.md`):

→ Verify column/row layout against the `StageIndexer` in
  `crates/cobre-sddp/src/lp/indexer/` (struct in `layout.rs`; the
  `state_to_lp_incoming_column` resolver in `state_mapping.rs`).
→ **State pinning (v0.8.0)**: incoming state (storage, AR lags, anticipated-thermal
  slots) is pinned by **column bounds** on the incoming-state columns, resolved
  via `StageIndexer::state_to_lp_incoming_column`. The `storage_fixing`,
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

When **authoring or editing a diagram** (new `src/images/*.svg`,
`diagrams/matplotlib/d*.py`, or inline ` ```mermaid ` block in a spec):
→ Follow [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) —
  tool-selection decision table (§1.1), design system for composed blocks
  (§4.2–4.3), naming (§7), D2 rendering policy (§2).
→ Consistency rule (§1.3): a family of related diagrams uses the same tool —
  never mix within a domain.
→ Reference implementations: `diagrams/matplotlib/d02_value_function.py` (math
  plot), `diagrams/matplotlib/d23_par_stored_vs_computed.py` (composed block
  diagram), inline mermaid in `src/specs/math/sddp-algorithm.md` §3 (flowchart).

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

| Resource                  | Location                                                               | Purpose                                          |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| Cobre code (ground truth) | `https://github.com/cobre-rs/cobre/`                                   | Actual implementation                            |
| Software book             | `https://docs.cobre-rs.dev/`                                           | User-facing docs                                 |
| Dev strategy              | `https://github.com/cobre-rs/cobre/docs/design/dev-strategy.md`        | Documentation & public presence strategy         |
| CHANGELOG                 | `https://github.com/cobre-rs/cobre/CHANGELOG.md`                       | Per-release feature list (sync source)           |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for spec diagrams |
| Brand & colour | [`docs/design/brand.md`](docs/design/brand.md) | Site colour/identity authority — **Copper** primary, Flow Blue for links/hydro only. Consult before any theming. |