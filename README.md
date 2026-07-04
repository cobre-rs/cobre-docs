# cobre-docs

**Cobre Documentation** for the [Cobre](https://github.com/cobre-rs/cobre)
ecosystem — the mathematics, algorithm, and worked examples behind its
SDDP-based hydrothermal dispatch, together with how the software implements them.

Published at **[methodology.cobre-rs.dev](https://methodology.cobre-rs.dev)**, built
with [Astro Starlight](https://starlight.astro.build/).

> **Scope.** This is a _methodology-only_ reference (math, worked examples,
> reference). Architecture, HPC/parallelism, solver interfaces,
> data-model/output-schemas, and configuration live in the Cobre **developer
> guide**, not here. The Cobre code is the ground truth — when a spec diverges from
> the code, the spec is updated.

## Local development

Requires **Node 25+**. The [`d2`](https://d2lang.com/) binary (v0.7.1) must be on
`PATH` for D2 figures to render — see `.github/workflows/starlight-ci.yml` for the
pinned install; without it, ` ```d2 ` blocks render empty.

```bash
npm install            # or: npm ci
npm run dev            # Astro dev server with live reload
npm run build          # static build → dist/
npm run build:versions # multi-version assembly (versions.json) → dist/
```

## Stack

| Concern        | Tool                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Site framework | [Astro Starlight](https://starlight.astro.build/)                                                               |
| Math           | KaTeX via manual `remark-math` + `rehype-katex` (rendered at build time, zero client JS)                        |
| Diagrams       | inline [D2](https://d2lang.com/) (ELK engine) for schematics; [Mermaid](https://mermaid.js.org/) for flowcharts |
| Math plots     | [Observable Plot](https://observablehq.com/plot/) islands backed by a unit-tested TypeScript compute layer      |
| i18n           | Starlight-native (`en` + `pt-br`) + [Lunaria](https://lunaria.dev/) translation dashboard                       |
| Versioning     | build-per-tag → subpaths (no plugin); see `build-versions.mjs` + `versions.json`                                |

## Structure

```
src/
├── content/
│   ├── docs/             # the 7-Part methodology corpus (29 chapters)
│   │   ├── index.mdx     #   landing page
│   │   ├── overview/     #   Part 1 — Introduction
│   │   ├── math/         #   Parts 2–5 — system & stochastic modelling, SDDP, coupling
│   │   ├── examples/     #   Part 6 — worked examples
│   │   ├── reference/    #   Part 7 — glossary, bibliography
│   │   └── pt-br/        #   pt-BR locale (i18n)
│   └── content.config.ts
├── components/           # Astro islands (Observable Plot figures, version picker, footer)
├── figures/              # tested TypeScript compute layer for the plots (*.ts + *.test.ts)
├── styles/               # brand palette, figure/KaTeX/font CSS
└── assets/               # logo / favicon
astro.config.mjs          # integrations + the curated 7-Part sidebar/TOC
build-versions.mjs        # multi-version build orchestrator
scripts/                  # quality-gate scripts (see below)
public/                   # static assets + THIRD-PARTY-NOTICES.txt
```

## Quality gates

```bash
npm test              # tested-compute layer + script unit tests (node --test)
npm run check         # astro check (types)
npm run check:math    # KaTeX $$-block render parity
npm run check:links   # internal link integrity
npm run check:figures # every plot island has a paired tested compute module
npm run check:d2      # D2 uses the ELK engine, never TALA
npm run check:spdx    # 100% FOSS dependency audit
npm run check:e10     # third-party-notices / content-licensing completeness
```

## Deployment

A push to `main` triggers `.github/workflows/starlight-deploy.yml`, which runs the
full gate suite, builds the site, and publishes it to GitHub Pages at
`methodology.cobre-rs.dev`.

## License

Dual-licensed:

- **Code** (build scripts, Astro components, configuration) — [Apache-2.0](LICENSE).
- **Content** (prose, equations, figures) — [CC-BY-4.0](LICENSE-docs).

See [`LICENSE-docs`](LICENSE-docs) for how the two compose, and
[`public/THIRD-PARTY-NOTICES.txt`](public/THIRD-PARTY-NOTICES.txt) for the bundled
third-party dependencies.
