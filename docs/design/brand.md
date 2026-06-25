# Cobre-docs — Brand & Colour Application

> **Authority:** `~/git/cobre/docs/internal/BRAND-GUIDELINES.md` (main `cobre` repo).
> Brand assets: `~/git/cobre/assets/` (`cobre-logo-{dark,light}.svg`, `cobre-icon.svg`).
> This document records **how the docs site applies the brand**; the main-repo
> guidelines are the **source of truth** — when they diverge, the guidelines win.
>
> **Consult this (and the authority) before ANY theming change.** Do **not** infer
> brand colours from the `spike/` palette — see [Why this doc exists](#why-this-doc-exists).

## Palette (from `BRAND-GUIDELINES.md` §2.2)

**Primary (the identity — warm):**

| Name         | Hex       | Role                                                          |
| ------------ | --------- | ------------------------------------------------------------- |
| Copper       | `#B87333` | **Brand primary** — chrome accent, icon fills, accent borders |
| Copper Light | `#D4956A` | Highlights, hover, accent-text on dark                        |
| Copper Dark  | `#8B5E3C` | Depth, pressed, accent-text on light                          |
| Patina       | `#4A8B6F` | Secondary accent, success/"stable", non-hydro diagram accents |

**Secondary accents (use with restraint):**

| Name        | Hex       | Role                                                                 |
| ----------- | --------- | -------------------------------------------------------------------- |
| Spark Amber | `#F5A623` | Warnings / `caution` asides / energy indicators                      |
| Signal Red  | `#DC4C4C` | Errors / `danger` asides                                             |
| Flow Blue   | `#4A90B8` | **Links, informational states, water/hydro only** — NOT the identity |

**Neutrals (dark — primary):** Midnight `#0F1419` (bg) · Surface `#1A2028` · Border
`#2D3440` · Muted `#8B9298` · Body `#C8C6C2` · Bright `#E8E6E3`.
**Neutrals (light):** `#FAFAF8` (bg) · Surface `#F0EDE8` · Border `#D4D0CA` · Muted
`#6B7280` · Body `#374151` · Dark `#1A2028`.

## How the docs site applies it (decisions locked 2026-06-24)

- **Chrome accent → Copper.** `--sl-color-accent*` (active sidebar item, header,
  focus rings, hover, buttons) = the copper ramp. This is the dominant identity.
- **Inline prose links → Flow Blue.** The brand table assigns Flow Blue to "Links",
  so content links (`.sl-markdown-content a`) stay flow-blue — a **targeted** override,
  visibly distinct from the copper chrome. (Chrome copper, links blue.)
- **Warm neutrals**, not Starlight's cool greys: page bg Midnight `#0F1419` (dark) /
  `#FAFAF8` (light), with the brand body/border/muted greys. WCAG AA on body text.
- **Semantic asides:** `note`/info → Flow Blue · `tip` → Patina · `caution` → Spark
  Amber · `danger` → Signal Red.
- **Diagram palette (`--dgm-*`):** copper (`storage`), patina (`runtime`), copper-light
  (`curve`). **Flow Blue is reserved for hydro/water** (`--dgm-hydro`); non-hydro
  "accent" marks (e.g. Benders tangents) use a warm tone. (The `.d2-svg` keystone uses
  d2's own hardcoded palette — a separate system, do not confuse with `--dgm`.)
- **Logo + favicon:** the **icon mark beside the "Cobre Methodology" title**,
  **theme-adaptive** via Starlight `logo:{dark,light}` — `cobre-icon.svg` (Midnight
  tile) on dark, `cobre-icon-light.svg` (light brand-surface tile; a **derived**
  variant with copper anchored on the readable `#B87333`..`#8B5E3C` range, since the
  original's lighter gradient stops wash out on a light tile) on light. `cobre-icon.svg`
  is also the favicon. The wide `cobre-logo-{dark,light}.svg` **wordmark** logos are
  for README-scale headers, **not** the small (~40px) site header — they scale to
  illegibility and duplicate "Cobre" beside the title.

## Design principles that constrain styling (§2.4)

1. **Copper warmth.** Differentiate from the sea of blue developer tools — copper
   accents on neutral backgrounds, used with restraint.
2. **Dark-first.** Dark is the default; light is the alternative.
3. **Technical, not trendy.** No decorative gradients, no rounded-everything.

## Typography (§2.3 — already wired)

IBM Plex Sans (body/headings) · JetBrains Mono (code), self-hosted via Fontsource
(SIL OFL). See `site/src/styles/fonts.css`.

## Where it's implemented

| File                           | Holds                                                                |
| ------------------------------ | -------------------------------------------------------------------- |
| `site/src/styles/brand.css`    | `--sl-color-accent*` copper ramp + the flow-blue prose-link override |
| `site/src/styles/neutrals.css` | the warm-neutral Starlight greyscale/bg/text override                |
| `site/src/styles/palette.css`  | `--dgm-*` diagram palette (copper/patina + `--dgm-hydro`)            |
| `site/src/styles/fonts.css`    | brand fonts (`--sl-font` / `--sl-font-mono`)                         |
| `site/astro.config.mjs`        | `logo`, favicon, `customCss` order                                   |

## Why this doc exists

In the Starlight migration E2, the chrome accent was derived from the `spike/`
palette's `--dgm-accent: #4a90b8` (flow blue), turning the **entire UI blue** —
directly contradicting "copper primary / differentiate from the sea of blue."
**Root cause:** the brand guidelines live in the **main `cobre` repo** and were
never referenced from `cobre-docs`, so the work anchored on the spike's exploratory
colour _labels_ instead of the authority. Corrected in **ticket-011b**.
**Rule:** consult this doc + the authority before theming; never treat the spike
palette as the brand.
