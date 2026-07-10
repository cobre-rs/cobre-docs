# Cobre Documentation Unification — Strategy & Options

**Date:** 2026-07-02
**Status:** DECIDED (2026-07-02) — the four structural forks are resolved (see
§6); §5 and §7 reflect the chosen direction. Options/rationale retained for the
record.
**Scope:** Merging the two Cobre documentation properties — the **methodology
reference** (this repo, Astro Starlight → `methodology.cobre-rs.dev`) and the
**software guide** (the `book/` mdBook inside the `cobre` code repo →
`docs.cobre-rs.dev`) — into a single site, without harming either audience.

Supersedes the documentation-split assumption in
[`dev-strategy.md`](./dev-strategy.md) (2026-03-25), which predates the
methodology site's migration off mdBook and still describes both properties as
mdBooks.

---

## 1. Why unify

Two separate sites, two toolchains, two repos, two deploy pipelines, two
sidebars, two search indexes. A reader who wants "the docs" has to know that the
math lives at one domain and the usage lives at another, and hop between them.
Maintainers carry the split in their heads. The stated goal:

> Clearly state the **methodology**; then, **if the reader wants**, let them
> descend into **how the software implements it** — input/output file
> descriptions, configuration, CLI. One home, one version picker, one language
> switcher.

This is a **progressive-disclosure** requirement: theory first, implementation
on demand. The methodology is the spine; the software surface hangs off it as
optional depth.

---

## 2. Current state — the two worlds

|                 | **Methodology** (this repo)                         | **Software guide** (`cobre/book/`)                                                   |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Engine          | Astro Starlight (Node)                              | mdBook (Rust)                                                                        |
| Domain          | `methodology.cobre-rs.dev`                          | `docs.cobre-rs.dev`                                                                  |
| Content         | 29 chapters, 7 Parts, math-heavy                    | 42 md files (~17.6k lines) + 18 JSON Schemas (~4.2k lines)                           |
| Nature          | **Theory**: WHAT/WHY. Instance-agnostic, math-first | **Operation**: HOW. Config, I/O, CLI, API. No math at all                            |
| Math            | KaTeX at build time                                 | None (deliberately delegated out)                                                    |
| **i18n**        | **en + pt-br + Lunaria dashboard**                  | None (`language = "en"`)                                                             |
| **Versioning**  | **build-per-tag → subpaths** (`build-versions.mjs`) | None (latest-only)                                                                   |
| Diagrams        | D2 (ELK) + Mermaid + Observable Plot islands        | Mermaid only                                                                         |
| Quality gates   | 7 npm gates (math parity, links, figures, SPDX, …)  | Book-build smoke + 3 doc-lint Python gates in `ci.yml`                               |
| Licensing       | Apache-2.0 (code) / **CC-BY-4.0 (content)**         | Apache-2.0 (lives in code repo; no separate content license)                         |
| Source of truth | Hand-authored prose tracking the code               | Prose **+ 18 JSON Schemas generated from `cobre-io` Rust types**, CI-freshness-gated |

### The mdBook's unique, deep assets (what the merge must not lose)

- `reference/case-format.md` (1498 lines) — the definitive **input** reference (~40 files, field-by-field).
- `reference/output-format.md` (1265 lines) — the definitive **output** reference.
- `reference/error-codes.md` (497) · `reference/flatbuffers-schema.md` (159) · `reference/schemas.md` (85).
- **18 machine-readable JSON Schemas** (`book/src/schemas/*.json`), _generated_ from the Rust types and served for `$schema` editor validation. These want to live next to the code that generates them — see Tension 4.
- Heaviest topical overlaps with methodology (same topic, config/usage angle): `guide/hydro-plants.md`, `guide/stochastic-modeling.md` (1507 lines), `guide/configuration.md` (666), `guide/performance-accelerators.md`, `crates/sddp.md`, `crates/stochastic.md`.

---

## 3. The key realization: complementary, not redundant

The split was **designed**, not accidental. The mdBook holds no equations; it
ends topic sections with `> Theory reference →` links into the methodology site.
The methodology holds no config/CLI; it references "case directory" and
"configuration" as opaque terms.

So the merge is **not** a deduplication exercise. It is a **layering** exercise:
for each domain (hydro, stochastic, penalties, cuts, network, …) there already
exist two written treatments — the _math_ and the _operation_ — that were never
allowed to sit next to each other. Unification means putting them one click
apart, in one navigable tree, and repairing the (now-broken) links between them.

**Corollary:** the biggest immediate win costs almost nothing — the ~10
`book → methodology` cross-links currently point at pre-migration `/theory/…`
and `/specs/…` slugs that **no longer resolve** against the 7-Part Starlight
site. Even before a full merge, these are dead links today.

---

## 4. Core tensions the merge must resolve

**T1 — Version-annotation policy vs version-bound software docs.**
The methodology's hard rule is _no version annotations, ship latest-only_. But
config schema, I/O columns, error codes, and CLI flags **change per release** —
the mdBook even has a CI gate (`check_book_version.py`) asserting version strings
equal `Cargo.toml`. These policies appear to collide.
→ **Resolution:** they don't, if versioning moves from _inline prose_ to the
_build-per-tag_ mechanism this repo already has. Each versioned snapshot
(`/v0.9/`) describes "current cobre" _for that tag_ — methodology stays
annotation-free **within** a snapshot; the software layer gets per-version
accuracy **across** snapshots. This is the strongest argument that cobre-docs is
the right host: the machinery the software layer needs already exists here and is
unused. It does require **turning versioning on for real** (populate
`versions.json` with release refs; today it is `latest`-only).

**T2 — Generated schemas are coupled to the code.** The 18 JSON Schemas are
emitted by `cargo run -p cobre-cli -- schema export` and freshness-gated in the
`cobre` CI. Physically moving them here severs them from their generator.
→ **Resolution options** (this is Decision B/A territory): (a) generate in
`cobre`, **sync** artifacts into cobre-docs at build; (b) move generation here
and have cobre-docs CI invoke the cobre CLI; (c) submodule. Any works; it must be
chosen deliberately, not defaulted.

**T3 — The "Relocated domains" rule is inverted.** `CLAUDE.md` currently forbids
re-adding architecture/HPC/interfaces/data-model/config here. The merge reverses
that. The scope nuance matters: the user's ask ("how the software implements it,
I/O descriptions") is the **user-facing** software surface (install, CLI, config,
I/O, Python, examples) — _not_ necessarily the `For Developers / crates`
internal-architecture chapters. Those can be a clearly-marked deepest tier, or
stay in the code repo. → **Decision B** below.

**T4 — Losing code+doc co-PR.** Today a config change and its doc update land in
one `cobre` PR. Moving software docs here breaks that unless we adopt a sync
model. → **Decision A** (repo topology) below.

**T5 — Two toolchains.** ~17.6k lines of mdBook markdown → Starlight MDX. Mostly
mechanical (mermaid survives; admonitions, `{{#include}}`, tables, and the stale
cross-links need porting). **The team has already run this exact migration once**
(methodology mdBook→Starlight), so a proven playbook exists (URL-preservation
redirects, slug mapping, gate suite).

**T6 — Licensing seam.** Methodology prose is CC-BY-4.0; the software docs live
under Apache-2.0 today. A unified site needs a per-section content-license story
(the footer already renders a content-license line). Likely: prose CC-BY-4.0,
JSON schemas + code snippets Apache-2.0. Low-risk; decide once.

---

## 5. Information architecture — options and chosen pattern

Three candidate patterns were considered; the chosen one (**IA-B**) follows.

**IA-A — Two pillars under one site, cross-linked per topic.**
Keep both corpora intact as top-level sections in one Starlight site sharing
search / version picker / i18n / brand. Methodology stays the 7 Parts verbatim.
The software guide becomes a second pillar. Wire rigorous progressive-disclosure
links both ways. Lowest risk, preserves both bodies, delivers the unification the
user asked for (one site, one picker, one language switch, one search).

**IA-B — Topic-interleaved chapters with tabbed disclosure.** Each domain becomes
one chapter: methodology first, then `<Tabs>`/collapsibles for _Configure · I/O ·
Implementation_. The truest literal reading of "state the methodology, then enter
the implementation" — but it welds stable math to volatile config in one file
(per-release churn now touches the math), and interleaving 29+42 chapters is a
large editorial effort.

**IA-C — Diátaxis four-quadrant** (Tutorials / How-to / Reference / Explanation,
with methodology as "Explanation"). The textbook-correct structure, best
long-term scaling — but the largest reorganization and it dissolves the
well-loved 7-Part methodology shape into one quadrant.

### Chosen: IA-B — topic-interleaved chapters, made safe by layered partials

The methodology is the **spine of each chapter**; the software layers hang off it
as tabbed, optional depth — the literal realization of "state the methodology,
then let the reader enter how the software implements it." The one real hazard of
IA-B — welding volatile config into the stable, annotation-free math file — is
neutralized by a **source-vs-render split**:

> **One chapter renders as tabs; its layers are separate source files.**
> A topic chapter's methodology prose stays in its own MDX file (instance-agnostic,
> version-free, exactly as today). Each software layer lives in a **sibling partial**
> imported into the chapter and shown as a tab. The reader sees one unified page;
> the repo keeps the math and the churn in different files.

**Chapter anatomy** (e.g. Hydro Production):

```text
math/hydro-production-models.mdx        ← methodology page (default tab; stable)
  imports & renders as <Tabs>:
    math/_impl/_hydro.configure.mdx      ← "Configure" tab        (version-scoped)
    math/_impl/_hydro.io.mdx             ← "Inputs & Outputs" tab (version-scoped)
    math/_impl/_hydro.notes.mdx          ← "Implementation notes" tab (optional)
```

**Partial-naming gotcha (verified against Starlight 0.40).** Starlight's
`docsLoader` globs `**/[^_]*.{md,mdx}`, which excludes files by **basename** only —
so an `_impl/` _directory_ prefix is NOT enough; the imported partial's **filename**
must start with `_` (`_hydro.configure.mdx`) or it is built as a stray page. This is
the load-bearing rule the Phase-2 template ticket encodes.

Why this holds the line: the math file never imports version numbers or magic
instance values (the Part-1 editorial rule survives); a per-release config change
edits `_impl/*.mdx` only; Lunaria tracks translation status per file, so
translators can localize math and config independently; and a versioned build-per-tag
snapshot still captures the whole chapter coherently.

**Three documentation surfaces** (this is the topology the decisions produce):

```
1. docs.cobre-rs.dev  — cobre-docs (this repo): the ONE user-facing site.
                         Methodology + user-facing software, interleaved per topic.
                         Owns i18n + versioning + search. Single source of truth
                         for prose. Replaces BOTH old sites.

2. cobre repo READMEs — per-module/per-crate README.md files inside the code.
                         The developer navigation layer (read on GitHub, next to
                         the code). Replaces the mdBook's "For Developers/crates"
                         tier. NOT on the docs site.

3. JSON Schemas       — generated from cobre-io Rust types (code = ground truth),
                         vendored into cobre-docs for the I/O reference. Generated
                         in cobre, consumed here.
```

**Sketch of the unified sidebar** (one site, one version picker + language switch):

```
Cobre Documentation            [ version ▾ ]  [ EN | PT-BR ]

GET STARTED
  What Cobre solves · Install · Quickstart · Python quickstart

SYSTEM MODELLING        (each chapter: Methodology ▸ Configure ▸ I/O tabs)
  LP formulation · System elements · Equipment · Blocks
  Hydro production · Penalties · Inflow non-negativity

STOCHASTIC MODELLING    (interleaved)
  PAR(p) inflow · Multi-resolution · Weekly–monthly · Scenario generation

THE SDDP ALGORITHM      (interleaved)
  Algorithm · Cut management · Warm start · Risk measures
  Stopping rules · Upper bound · Determinism · Reproducibility

COUPLING & BOUNDARIES   (interleaved)
  Horizon modes · Discount rate

RUNNING COBRE           (pure software — no methodology twin)
  Configuration · Running studies · Policy management · Performance
  Case conversion (NEWAVE / cobre-bridge) · Understanding results

REFERENCE
  Case directory format · Output format · JSON schemas
  FlatBuffers policy schema · Error codes · CLI reference
  Worked examples · Glossary · Bibliography
```

The 7-Part scaffold survives as the four interleaved modelling/algorithm groups;
pure-software topics with no methodology twin (config, running, conversion) get
their own **Running Cobre** group; the I/O corpus lands in **Reference**.

**The two-way link contract** still applies for the cross-group cases (e.g.
`interpreting-results` → `upper-bound-evaluation`): every software page with a
methodology twin backlinks to it, **repaired to the current slugs** (the ~10
existing `book → methodology` links are broken today).

---

## 6. Decisions (locked 2026-07-02)

| #   | Decision      | Resolution                                                                                                                                                                                                                |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Repo topology | **cobre-docs is the single source of truth** for user-facing docs; the **mdBook is retired**. The `cobre` repo is re-documented as **per-module/per-crate README files** (dev-facing, on GitHub) — see §6a. Schemas: §6b. |
| B   | Content scope | **User-facing layer only.** Install, CLI, config, I/O, Python, examples, results move to the site. Crate internals do **not** — they become the per-module READMEs of surface A/§6a.                                      |
| C   | IA pattern    | **IA-B — topic-interleaved tabbed chapters**, made safe by the source-vs-render split (§5): math in its own file, software layers as imported partials.                                                                   |
| D   | Domain        | **`docs.cobre-rs.dev`** serves the unified site; `methodology.cobre-rs.dev` 301-redirects in; the code-repo mdBook deploy is retired.                                                                                     |

Consequential re-scoping vs the original options: the user picked neither A1
(single-repo) nor A2 (cross-repo sync) verbatim — instead, **user docs
centralize in cobre-docs while the developer layer is reborn as in-repo READMEs
rather than a doc site at all.** That fully retires the mdBook and cleanly answers
Tension T3 (the "For Developers/crates" tier leaves the docs surface entirely).

### 6a. New surface — `cobre` per-module READMEs (developer navigation)

The mdBook's `For Developers/crates` chapters (~4.5k lines across
overview/core/io/stochastic/solver/comm/sddp/cli/ferrompi) are the **seed
content** for a set of `README.md` files placed next to the code:

- One `README.md` per workspace crate (`crates/<crate>/README.md`), each
  describing that crate's responsibility, key types, and entry points — read on
  GitHub while browsing the code.
- A workspace-root `ARCHITECTURE.md` (or `crates/README.md`) carrying the crate
  dependency graph + the "reserved crates" note (the old `crates/overview.md`).
- These are **dev-facing and code-local**; they are _not_ built into the docs
  site and carry no i18n/versioning burden. They live and version with the code.

This is a separate workstream in the `cobre` repo (own plan/tickets), sequenced
alongside the mdBook retirement so no developer content is lost in the cutover.

### 6b. Schemas — code stays ground truth, docs vendor the output

"Single source of truth in cobre-docs" governs **prose**. The 18 JSON Schemas are
_generated from `cobre-io` Rust types_, so per the project's own **code = ground
truth** rule their SoT is the code, not the docs. Mechanism: `cobre` CI runs
`schema export` on release and publishes the schemas as an artifact (or commits
them under a stable path); cobre-docs **vendors** them for the I/O reference and
`$schema` links. The freshness gate stays in `cobre` (next to the generator). The
one residual sub-decision is _how_ they cross the repo boundary — committed
vendored copy (simplest, greppable) vs CI artifact fetch. **Recommend: committed
vendored copy**, refreshed by a small script on each cobre release.

---

## 7. Migration strategy (phased)

Leans on the proven mdBook→Starlight playbook this repo already executed. Two
tracks run in parallel: **T-DOCS** (this repo) and **T-CODE** (the `cobre` repo's
per-module READMEs). They converge at the cutover.

**Phase 0 — Free repair (independent of everything).** Fix the ~10 broken
`book → methodology` cross-links to the current 7-Part slugs. Valuable even if the
merge stalled.

**Phase 1 — Re-scaffold the site (T-DOCS).** Rename identity to _Cobre
Documentation_ (title, `logo` alt, README, footer). Restructure the sidebar into
the interleaved groups + **Running Cobre** + **Reference** (§5 sketch). Add
**Getting Started** (install / quickstart / python-quickstart / what-cobre-solves,
ported from the mdBook).

**Phase 2 — Port + interleave the user-facing software content (T-DOCS).**
Per topic: convert the mdBook chapter to MDX, split its software material into
sibling partials (`_impl/<topic>.configure.mdx`, `.io.mdx`, `.notes.mdx`), and
wire `<Tabs>` into the matching methodology chapter (§5 anatomy). Sequence
highest-overlap first: **hydro-production → stochastic/PAR → penalties → cut
management → network/blocks**, then the rest. Land the I/O corpus
(`case-format`, `output-format`, `error-codes`, `flatbuffers-schema`) in
**Reference**. Each topic ships as one batch (the CLAUDE.md batched-edits rule).

**Phase 3 — Schema vendoring + gate port (T-DOCS + `cobre`).** Stand up §6b
(committed vendored schemas + refresh script). Port the three doc-lint gates as
npm checks, with **two voice profiles**: strict on `math/*.mdx` (no version
strings, no instance numbers), lenient on `_impl/*.mdx` and Reference (both
allowed).

**Phase 4 — Progressive disclosure + versioning + i18n (T-DOCS).** Finish the
per-chapter tabs and the cross-group backlinks; **turn versioning on** (populate
`versions.json` with release refs) so the software layer gets per-version
accuracy while the math rides each snapshot; the software partials inherit
en/pt-br + Lunaria automatically (the mdBook only ever _aspired_ to i18n).

**Phase 5 — `cobre` developer READMEs (T-CODE).** Seed per-crate `README.md` +
workspace `ARCHITECTURE.md` from the mdBook's `crates/*` chapters (§6a) **before**
deleting the mdBook, so no developer content is lost.

**Phase 6 — Cutover.** Point `docs.cobre-rs.dev` at the unified site; retire the
mdBook deploy (`cobre/.github/workflows/docs.yml`) and delete `cobre/book/`; 301
the old `/theory/…`, `/specs/…`, and `methodology.cobre-rs.dev` URLs via the
existing `redirects` map in `astro.config.mjs` (pull 404/referrer data first).

**Phase 7 — Governance rewrite.** Update `CLAUDE.md`: invert the "Relocated
domains" rule; codify the **two-layer authoring standard** (math stays
annotation-free and instance-agnostic; the software layer is version-scoped and
may carry concrete config/I/O/instance detail) and the **source-vs-render split**
(math and `_impl/*` partials are separate files). Refresh `dev-strategy.md` and
`README.md` to the new one-site reality.

---

## 8. Risks & mitigations

- **Math/config coupling churn** (the core IA-B hazard) → the **source-vs-render
  split** (§5): math lives in its own file, software layers in imported partials;
  a per-release config change never touches a math file.
- **Editorial cost of interleaving ~20 chapters** → phase topic-by-topic,
  highest-overlap first (Phase 2); the split-partial structure lets a topic ship
  incrementally.
- **Developer content lost at mdBook retirement** → Phase 5 (seed the per-crate
  READMEs) **precedes** Phase 6 (delete `cobre/book/`).
- **Schema staleness** → generation + freshness gate stay in `cobre` next to the
  Rust types; docs vendor the output (§6b). Code remains ground truth.
- **Broken inbound links at cutover** → extend the existing `redirects`
  discipline; pull referrer/404 data before finalizing.
- **Two doc-voice regimes** → two lint profiles keyed on path (`math/*` strict,
  `_impl/*` + Reference lenient) — natural because the split already separates the
  files.

---

## 9. Status & next step

The four structural forks are **locked** (§6). Residual sub-decisions, each with a
standing recommendation, resolve during the phases:

| Sub-decision     | Recommendation                                                  |
| ---------------- | --------------------------------------------------------------- |
| Schema crossing  | **committed vendored copy** in cobre-docs, refresh script (§6b) |
| Versioning-on    | Phase 4; populate `versions.json` with release refs             |
| Licensing seam   | prose CC-BY-4.0; schemas + code snippets Apache-2.0             |
| Dev-README shape | one `README.md` per crate + workspace `ARCHITECTURE.md` (§6a)   |

**Next step:** turn §7 into a concrete, ticketed implementation plan (`/plan`),
two tracks (T-DOCS here, T-CODE in `cobre`), starting with the zero-risk Phase 0
link repair.
