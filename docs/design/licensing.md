# cobre-docs Toolset — Licensing Analysis

> Can the finalized stack be used to write and **publicly distribute** the Cobre
> ecosystem docs (open-source, served statically)? Verified against each
> project's actual license text, June 2026.
> **Not legal advice** — I'm not a lawyer; this is an engineering-grade read of
> the licenses so you can make an informed call (and, for the one gray area,
> know exactly what to check).

## Bottom line

**Yes — you can ship the docs with this stack.** Every piece is one of:

- **Permissive** (MIT / ISC / BSD-3) — use freely, just keep the notices, or
- **Weak-copyleft that doesn't touch you** (D2 = MPL-2.0; ELK = EPL-2.0) — build-time tools whose output (your SVGs/site) carries no obligation, or
- **Dual-licensed so you pick the permissive arm** (JSXGraph → take MIT).

There is **no GPL/AGPL** anywhere in the tree (the licenses that could force you to open-source your own pipeline). **As of the locked stack the tree is 100% FOSS** — GSAP (the lone proprietary, Webflow-owned, revocable dependency) has been **swapped for Motion (`motion`, MIT)** as the preferred animation tool, so there is no longer any non-open-source piece to track. (Note: the interactive-diagram pick is **React Flow** (`@xyflow/react`, MIT), not Svelte Flow — so the runtime notices below cover **React** (`react`/`react-dom`/`@astrojs/react`, all MIT), not Svelte.)

Two light compliance tasks fall out of this: (1) ship a third-party-notices / acknowledgements page, because the **runtime** libraries are redistributed to every visitor; (2) include the OFL text with your embedded fonts. Both are quick.

---

## Full license inventory

"Ships to browser?" matters: a library that runs client-side is **redistributed** with your published site, so its notice obligations apply to the deployed `dist/`. A build-time-only tool's license governs the tool, not your output.

| Tool                                        | Version | License                      | Ships to browser?                         | Obligation for you                                                 |
| ------------------------------------------- | ------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| **Astro**                                   | 6.4.x   | MIT                          | Build-time (emits HTML)                   | Keep notice (dev dep)                                              |
| **Starlight**                               | 0.40.x  | MIT                          | Runtime (small theme JS/CSS)              | Keep notice                                                        |
| **React + React-DOM**                       | 19.x    | MIT                          | Runtime (interactive-diagram pages only)  | Keep notice                                                        |
| **@astrojs/react**                          | current | MIT                          | Build-time                                | Keep notice                                                        |
| **@xyflow/react** (React Flow)              | 12.x    | MIT                          | Runtime (interactive-diagram pages)       | Keep notice                                                        |
| **remark-math / rehype-katex** (chosen, D4) | 6 / 7   | MIT                          | Build-time                                | Keep notice                                                        |
| **starlight-katex** _(unused alternative)_  | 0.0.x   | MIT\*                        | —                                         | n/a — D4 chose manual remark/rehype; only if adopted later         |
| **KaTeX** (engine + CSS + fonts)            | 0.16.x  | **MIT** (incl. fonts)        | Runtime (CSS + WOFF2 fonts)               | Keep notice; ship the `fonts/` dir                                 |
| **astro-mermaid**                           | 2.0.x   | MIT\*                        | Build-time + client render                | Keep notice (\*verify)                                             |
| **Mermaid**                                 | 11.x    | MIT                          | Runtime (client render)                   | Keep notice                                                        |
| **astro-d2**                                | 0.11.x  | MIT (HiDeoo)                 | Build-time                                | Keep notice                                                        |
| **D2 engine** (`d2` binary)                 | 0.7.x   | **MPL-2.0**                  | **Build-time only**                       | None on your SVGs/site (see below)                                 |
| → **ELK** layout (inside D2)                | —       | **EPL-2.0**                  | Build-time only                           | None on output (see below)                                         |
| → **TALA** layout (optional, D2)            | —       | **Proprietary/paid**         | —                                         | **Do not enable** (watermarks unlicensed)                          |
| **@observablehq/plot**                      | 0.6.x   | **ISC**                      | Runtime (chart islands)                   | Keep notice                                                        |
| → **d3** (inside Plot)                      | 7.x     | ISC                          | Runtime                                   | Keep notice                                                        |
| **JSXGraph**                                | 1.12.x  | **LGPL-3.0-or-later OR MIT** | Runtime (math islands)                    | **Elect MIT**; keep MIT notice                                     |
| **Motion** (`motion`)                       | 12.x    | **MIT**                      | Runtime (animation pages, tutorial layer) | Keep notice (replaces GSAP — fully FOSS)                           |
| **@lunariajs/starlight** (Lunaria)          | current | MIT\*                        | Build/CI (status dashboard)               | Keep notice (\*verify)                                             |
| **starlight-versions**                      | —       | MIT (HiDeoo)                 | **Not used**                              | Versioning via Architecture B (no plugin) — nothing to notice      |
| **starlight-image-zoom**                    | current | MIT (HiDeoo)                 | Runtime (small)                           | Keep notice                                                        |
| **IBM Plex Sans**                           | —       | **SIL OFL 1.1**              | Runtime (WOFF2)                           | Ship OFL text; don't sell font; don't reuse reserved name on edits |
| **JetBrains Mono**                          | —       | **SIL OFL 1.1**              | Runtime (WOFF2)                           | Same as above                                                      |
| **Node.js**                                 | 25      | MIT (+ mixed deps)           | Build/test only                           | None on output                                                     |

\* Community plugins are permissive by observation; confirm the exact `license` field in each `package.json` at install (takes seconds with `npm view <pkg> license`).

---

## The three "read the fine print" items

### 1. GSAP → Motion — RESOLVED (the tree is now fully FOSS)

GSAP was the one **non-OSI** piece (a free-but-**proprietary**, Webflow-owned, **revocable** license whose banner you may not strip). It existed only for the optional tutorial-layer reservoir animation, so it has been **swapped for Motion** (`motion`, MIT — vanilla JS, great for timeline/scroll; successor to Motion One). That removes the only asterisk: **no proprietary, no revocable, no copyleft-that-touches-output anywhere in the tree.** Motion is the preferred animation tool; for simple motion the native **Web Animations API** is a zero-dependency fallback. (`anime.js`, MIT, is an equivalent alternative if ever needed.)

This is the single decision worth making consciously; everything else below is mechanical.

### 2. JSXGraph — dual-licensed, so take MIT

JSXGraph is **"free software dual licensed under the GNU LGPL or MIT License"** — recipient's choice ("at your option"). **Elect MIT.** Then it carries the same light obligations as any MIT library (preserve the copyright + MIT text) and **none** of LGPL's relinking/source-availability conditions. State the election explicitly in your notices ("JSXGraph — used under the MIT option of its LGPL/MIT dual license") so there's no ambiguity. Its bundled CSS ships to the browser; that's covered by the same MIT notice.

### 3. D2 — MPL-2.0, but you only run the binary (and avoid TALA)

D2's engine is **MPL-2.0** (Mozilla Public License 2.0), a **file-level weak copyleft**. The obligation it creates only triggers if you **modify D2's own source files and distribute those modified files** — then those specific files must stay MPL. You're doing neither: `astro-d2` invokes the prebuilt `d2` binary at build time to emit SVG. **The SVGs and your site are your work and carry no MPL obligation**, and D2's code never ships to the browser. So MPL-2.0 is effectively a non-event here. (If you ever vendored and patched D2's Go source and redistributed that, you'd keep those files under MPL — not your situation.)

Two related notes:

- **ELK** (the layout engine D2 uses for your narrow-column layouts) is **EPL-2.0** — also weak copyleft, also build-time-only, also no effect on your output. Fine.
- **TALA** (D2's premium layout engine) is **proprietary and paid**; an unlicensed TALA **watermarks** output. Your spike uses ELK, so you're clear — just never flip the layout to `tala`.

---

## Fonts (they ship to visitors, so their licenses travel with the site)

- **IBM Plex Sans** and **JetBrains Mono** are **SIL OFL 1.1**. Web embedding/serving is expressly allowed. Obligations: (a) **include the OFL license text** alongside the font files you self-host (or rely on Google Fonts/Fontsource, which bundle it); (b) **don't sell the fonts on their own**; (c) if you ever **modify** a font, **don't keep its Reserved Font Name**. Normal web use trips none of these.
- **KaTeX fonts** (the `KaTeX_*` WOFF2 files) are covered by **KaTeX's MIT license**; KaTeX ships them precisely for you to copy into your static dir. Keep the MIT notice; no special font terms.

If you self-host fonts, the tidy move is a `fonts/LICENSE` (OFL text) next to the WOFF2 files. If you pull them via **Fontsource** (`@fontsource/...`, MIT-packaged OFL fonts) or Google Fonts, the license ships with the package.

---

## The one real compliance task: a third-party-notices page

Because the **runtime** libraries — Svelte + Starlight runtime, Observable Plot (+d3), JSXGraph, Mermaid, KaTeX CSS/fonts, Svelte Flow, and GSAP if you keep it — are **redistributed to every visitor**, their MIT/ISC/BSD terms require preserving each project's copyright + license text in what you distribute. Two compatible ways to satisfy this (do both for belt-and-suspenders):

1. **Let the bundler keep license banners.** Astro/Vite preserve `/*! ... */` license comments in emitted JS by default; don't strip them. This already covers most of it.
2. **Publish an acknowledgements page** — e.g. `methodology.cobre-rs.dev/licenses` or a committed `THIRD-PARTY-NOTICES.md` — listing each dependency, its license, and copyright. Generate it mechanically so it stays current:
   ```bash
   npx license-checker --production --summary        # quick overview
   npx license-checker --production --out NOTICES.txt # full texts for the page
   #  (or: npx @quentin-sommer/license-report / oss-attribution-generator)
   ```
   Add a one-line footer link to it from the docs. This is the standard, low-effort way OSS sites discharge permissive-license attribution.

That's the whole obligation. Permissive licenses don't require you to share _your_ source, only to not erase _theirs_.

---

## Adjacent (and worth doing): license the docs content itself

The tool licenses say nothing about what license **your prose, diagrams, and equations** are under — that's your choice, and setting it is what makes the methodology cleanly **reusable and citable** (your stated aspiration). Common, clean split for a technical doc:

- **Code samples / config snippets** → the **same license as the Cobre codebase** (whatever `cobre-rs/cobre` uses — MIT/Apache-2.0/etc.), so examples are drop-in for users.
- **Prose + figures** → **CC-BY-4.0** (attribution) — or **CC-BY-SA-4.0** if you want share-alike on derivatives.

Put a `LICENSE` (or `LICENSE-docs`) in the docs repo stating this split, and a short footer notice ("© 2026 … — text under CC-BY-4.0, code under <cobre's license>"). This is independent of the tooling and removes ambiguity for anyone translating, quoting, or building on the docs (directly relevant since pt-BR translators and citation are on your roadmap).

---

## Compliance checklist

- [x] **GSAP decided**: replaced with **Motion** (`motion`, MIT) → tree is fully FOSS. (Keep Motion's MIT notice like any runtime dep.)
- [ ] **Record JSXGraph as used under its MIT option** in your notices.
- [ ] **Confirm D2 uses ELK, never TALA** (no `layout: tala`); no action needed on MPL/EPL since you only run the binary.
- [ ] **Generate `THIRD-PARTY-NOTICES`** (license-checker) and link it from the footer; don't strip bundler license banners. Cover the **React** runtime (React Flow), not Svelte.
- [ ] **Ship OFL text with self-hosted fonts** (or use Fontsource/Google Fonts which bundle it); keep KaTeX's MIT notice with its fonts.
- [ ] **Add a docs-content license** (CC-BY-4.0 for prose/figures; **Apache-2.0** for code samples, matching `cobre-rs/cobre`).
- [ ] **Spot-verify the community plugins' SPDX** at install (`npm view <pkg> license`) — confirm `astro-mermaid`, `astro-d2`, `@lunariajs/starlight`, `starlight-image-zoom`.

## Verification notes / caveats

- Versions move; re-check at adoption. The substantive license facts (KaTeX MIT incl. fonts, Observable Plot ISC, JSXGraph LGPL/MIT dual, D2 MPL-2.0, GSAP proprietary-free, OFL fonts) are from primary sources and are stable, but plugin SPDX fields and GSAP's terms (Webflow may amend) are the version-sensitive ones.
- "Weak copyleft" (MPL-2.0, EPL-2.0) here is benign **only because** you use those tools as build-time binaries and don't modify-and-redistribute their source. If that ever changes, revisit.
- Again, not legal advice — for anything high-stakes (e.g. if Cobre later relicenses or a sponsor requires a formal SBOM/attestation), have counsel review the generated NOTICES.
