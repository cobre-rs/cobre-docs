# cobre-docs

**Cobre Documentation** for the [Cobre](https://github.com/cobre-rs/cobre)
ecosystem — the mathematics, algorithm, and worked examples behind its
SDDP-based hydrothermal dispatch, together with how the software implements them.

Published at **[docs.cobre-rs.dev](https://docs.cobre-rs.dev)**, built
with [Astro Starlight](https://starlight.astro.build/).

> **Scope.** This is the **single, unified** docs site: an annotation-free math
> layer (formulation, algorithm, worked examples) interleaved per topic with a
> version-scoped software layer (configure / I·O tabs, the I/O reference, and
> running Cobre). Only developer/crate internals live outside it, as `cobre`
> per-crate READMEs + `ARCHITECTURE.md`. The Cobre code is the ground truth —
> when a spec diverges from the code, the spec is updated.

## Local development

Requires **Node 25+**. The [`d2`](https://d2lang.com/) binary (v0.7.1) must be on
`PATH` for D2 figures to render — see `.github/workflows/starlight-ci.yml` for the
pinned install; without it, `npm run build` and `npm run dev` abort with
"Could not find D2".

```bash
npm install            # or: npm ci
npm run dev            # Astro dev server with live reload
npm run build          # static build → dist/
npm run build:versions # multi-version assembly (versions.json) → dist/
```

## Stack

| Concern        | Tool                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Site framework | [Astro Starlight](https://starlight.astro.build/)                                                                            |
| Math           | KaTeX via manual `remark-math` + `rehype-katex` (rendered at build time, zero client JS)                                     |
| Diagrams       | inline [D2](https://d2lang.com/) (ELK engine) for every diagram — schematics, flowcharts, network one-lines (build-time SVG) |
| Math plots     | [Observable Plot](https://observablehq.com/plot/) islands backed by a unit-tested TypeScript compute layer                   |
| i18n           | Starlight-native (`en` + `pt-br`) + [Lunaria](https://lunaria.dev/) translation dashboard                                    |
| Versioning     | build-per-tag → subpaths (no plugin); see `build-versions.mjs` + `versions.json`                                             |

## Structure

```
src/
├── content/
│   ├── docs/             # the unified corpus — math layer + interleaved software layer
│   │   ├── index.mdx     #   landing page
│   │   ├── getting-started/ #   Get Started — installation, quickstart, Python quickstart
│   │   ├── overview/     #   Get Started (what Cobre solves) and Introduction
│   │   ├── math/         #   System Modelling, Stochastic Modelling, The SDDP Algorithm, Coupling & Boundary Conditions
│   │   │   └── _impl/    #   software-layer Configure / I·O / Notes partials, rendered as tabs on the math pages
│   │   ├── running/      #   Running Cobre
│   │   ├── examples/     #   Worked Examples
│   │   ├── reference/    #   Reference — CLI, error codes, schemas, Python API, glossary, bibliography
│   │   │   ├── case-format/ #   Reference > Case Format
│   │   │   └── output/   #   Reference > Output Format
│   │   └── pt-br/        #   pt-BR locale scaffold (.gitkeep only); feeds no sidebar group
│   └── content.config.ts
├── components/           # Astro islands (Observable Plot figures, version picker, footer)
├── figures/              # tested TypeScript compute layer for the plots (*.ts + *.test.ts)
├── styles/               # brand palette, figure/KaTeX/font CSS
└── assets/               # logo / favicon
astro.config.mjs          # integrations + the Starlight sidebar (groups and page order)
build-versions.mjs        # multi-version build orchestrator
scripts/                  # quality-gate and refresh scripts, with their tests and fixtures (see below)
public/                   # static assets: vendored input schemas/, quickstart recordings, THIRD-PARTY-NOTICES.txt
```

## Quality gates

```bash
npm test              # tested-compute layer + script unit tests (node --test)
npm run check         # astro check (types)
npm run check:math    # KaTeX $$-block render parity
npm run build         # fails on any KaTeX strict-mode violation or parse error (scripts/rehype-katex-strict.mjs)
npm run check:links   # internal link integrity
npm run check:figures # no retired-figure reference, the figure scope assertions hold, and every Plot island imports a tested src/figures module with an aria-label
npm run check:voice   # hype phrases, unpinned "typical" numbers, instance magnitudes (two-voice methodology)
npm run check:counts  # stated counts match their tables and files: column/field counts, the generic-constraint variable catalog, the vendored schema count (public/schemas)
npm run check:version # cobre-version references vs the Synced-to anchor
npm run check:narration # change narration, both zones (ratchet: scripts/doc-lint-allow.txt)
npm run check:glossary # glossary: no file/path/config tokens, A–Z index complete (ratchet: scripts/doc-lint-allow.txt)
npm run check:error-coverage # every emitted ErrorKind/LoadError variant has an error-codes section; unemitted ones are reserved
npm run check:input-schemas # vendored input schemas match the case-format tables: names both ways, required flags, enums
npm run check:python-api # every public cobre-python stub symbol has an anchor in reference/python-api (stubs: scripts/pystubs/)
npm run check:d2      # D2 uses the ELK engine, never TALA
npm run check:spdx    # 100% FOSS dependency audit
npm run check:gc-examples # every gc-check fence behaves as marked under cobre v0.17.0 (COBRE_BIN or cobre on PATH)
npm run refresh:recordings -- --check # quickstart.gif matches scripts/recordings-provenance.json (check only)
npm run check:type-spelling # reference Type cells use the reference-conventions §4 vocabulary
npm run check:e10     # third-party-notices / content-licensing completeness
```

## Deployment

A push to `main` triggers `.github/workflows/starlight-deploy.yml`, which builds the
site, runs the build checks, and publishes it to GitHub Pages at
`docs.cobre-rs.dev` (`methodology.cobre-rs.dev` 301-redirects in). The full gate
suite, the doc-lint gates included, runs in `.github/workflows/starlight-ci.yml` on
pull requests to `main`.

## License

Dual-licensed:

- **Code** (build scripts, Astro components, configuration) — [Apache-2.0](LICENSE).
- **Content** (prose, equations, figures) — [CC-BY-4.0](LICENSE-docs).

See [`LICENSE-docs`](LICENSE-docs) for how the two compose, and
[`public/THIRD-PARTY-NOTICES.txt`](public/THIRD-PARTY-NOTICES.txt) for the bundled
third-party dependencies.
