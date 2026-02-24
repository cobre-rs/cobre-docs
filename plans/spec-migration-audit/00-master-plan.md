# Master Plan: SDDP Spec Migration Quality Audit & Enforcement

## Executive Summary

The 50 SDDP specification documents (~16,000 lines of content) were migrated from the `powers-rs` repository into the `cobre-docs` mdBook across 5 epics and 39 tickets. This audit plan performs a deep scrutiny pass — not a re-migration — to verify that the migrated documents are correct, complete, well-mapped to Cobre's multi-crate architecture, internally coherent, and that all LaTeX equations render correctly on the deployed site. The plan concludes with the creation of a centralized cross-reference index and remediation of any issues found.

## Goals and Non-Goals

### Goals

- Verify zero information loss across all 50 migrated spec files (file-by-file, not sampling-based)
- Confirm every spec is assigned to the section that aligns with its target crate(s)
- Audit crate documentation pages for consistency with the specs they reference
- Verify all 1,324 internal cross-references resolve correctly and point to the intended content
- Verify the 13 algorithm reference pages accurately summarize the formal specs without contradiction
- Verify LaTeX equations render correctly on the deployed GitHub Pages site
- Create a centralized spec-to-crate dependency index as a navigable reference document
- Fix all issues found, categorized by severity (CRITICAL, HIGH, MEDIUM, LOW)

### Non-Goals

- Re-migrating or rewriting spec content (content was authored and approved during the migration)
- Auditing the user guide stub pages (`src/guide/`) or migration guide (`src/migration/`)
- Auditing the powers-rs source specs for correctness (the source is treated as ground truth)
- Creating new specs or extending spec coverage beyond what exists
- Implementing any Rust code in the cobre workspace

## Architecture Overview

### Three Repositories

| Repository   | Role                                                                            | Path                                   |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------- |
| `powers-rs`  | Source — 50 original spec files across 7 numbered directories                   | `/home/rogerio/git/powers/docs/specs/` |
| `cobre-docs` | Target — mdBook with 50 migrated specs + crate docs + algorithm reference       | `/home/rogerio/git/cobre-docs/`        |
| `cobre`      | Architecture reference — 7-crate Rust workspace defining implementation targets | `/home/rogerio/git/cobre/`             |

### Cobre Crate Architecture

| Crate              | Responsibility                                                                 | Primary Spec Files                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cobre-core`       | Shared data model: buses, hydros, thermals, topology, resolution               | `specs/data-model/` (10 files), `specs/math/system-elements.md`, `specs/math/equipment-formulations.md`, `specs/overview/design-principles.md`                               |
| `cobre-io`         | File parsers/serializers: NEWAVE, CSV, Arrow, FlatBuffers, JSON/TOML           | `specs/data-model/` (input/output files), `specs/architecture/input-loading-pipeline.md`, `specs/architecture/validation-architecture.md`                                    |
| `cobre-stochastic` | PAR(p) inflow models, correlated noise, Monte Carlo, scenario generation       | `specs/math/par-inflow-model.md`, `specs/architecture/scenario-generation.md`                                                                                                |
| `cobre-solver`     | Backend-agnostic LP/MIP solver trait, HiGHS/CLP, warm-start basis management   | `specs/architecture/solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`                                                             |
| `cobre-sddp`       | Full SDDP: forward/backward pass, cut management, CVaR, stopping criteria, MPI | Most `specs/math/` files, `specs/architecture/training-loop.md`, `simulation-architecture.md`, `convergence-monitoring.md`, `cut-management-impl.md`, all `specs/hpc/` files |
| `cobre-cli`        | Binary `cobre`: run studies, manage input, inspect results                     | `specs/architecture/cli-and-lifecycle.md`, `specs/configuration/configuration-reference.md`                                                                                  |
| `ferrompi`         | MPI 4.x Rust bindings, SharedWindow, topology detection                        | `specs/hpc/hybrid-parallelism.md`, `communication-patterns.md`, `synchronization.md`                                                                                         |

### Spec File Counts

| Section                | Files  | Line Count (approx) |
| ---------------------- | ------ | ------------------- |
| `specs/overview/`      | 3      | 798                 |
| `specs/math/`          | 14     | ~5,200              |
| `specs/data-model/`    | 10     | ~4,705              |
| `specs/architecture/`  | 13     | ~3,300              |
| `specs/hpc/`           | 8      | ~1,488              |
| `specs/configuration/` | 1      | 379                 |
| `specs/deferred.md`    | 1      | 850                 |
| **Total**              | **50** | **~16,720**         |

### Crate Documentation Files

| File                       | Crate                                            |
| -------------------------- | ------------------------------------------------ |
| `src/crates/overview.md`   | All crates — dependency graph, design principles |
| `src/crates/core.md`       | cobre-core                                       |
| `src/crates/io.md`         | cobre-io                                         |
| `src/crates/stochastic.md` | cobre-stochastic                                 |
| `src/crates/solver.md`     | cobre-solver                                     |
| `src/crates/sddp.md`       | cobre-sddp                                       |
| `src/crates/cli.md`        | cobre-cli                                        |
| `src/crates/ferrompi.md`   | ferrompi                                         |

### Algorithm Reference Files (13 files)

The `src/algorithms/` directory contains accessible companion summaries:
`sddp-theory.md`, `benders.md`, `forward-backward.md`, `convergence.md`, `stochastic-modeling.md`, `par-model.md`, `spatial-correlation.md`, `scenario-generation.md`, `cut-management.md`, `single-multi-cut.md`, `cut-selection.md`, `risk-measures.md`, `cvar.md`

## Technical Approach

### Tech Stack

- Content: Markdown (mdBook), LaTeX math via MathJax
- Audit tooling: bash scripts (grep, diff), Python for counting/comparison
- Cross-reference index: new Markdown file added to `src/specs/cross-reference-index.md`
- Deployed site: https://cobre-rs.github.io/cobre-docs/ for LaTeX verification

### Severity Classification

| Severity | Definition                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| CRITICAL | Information loss — content present in source but absent from target                                                |
| HIGH     | Incorrect spec-to-crate mapping, missing crate coverage, contradiction between algorithm reference and formal spec |
| MEDIUM   | Broken cross-reference, inconsistency between crate doc and spec                                                   |
| LOW      | Style inconsistency, minor wording, cosmetic                                                                       |

### Audit Methodology

**Epic 1** (Content Integrity): For each of 50 files — diff source vs target, count headings/tables/formulas, verify frontmatter removal, verify brand replacement completeness.

**Epic 2** (Spec-to-Crate Mapping): For each spec — trace which crate(s) it specifies behavior for, verify the SUMMARY.md section assignment matches the crate responsibility, audit crate doc pages for spec reference completeness.

**Epic 3** (Cross-Reference Coherence): Extract all markdown links from `src/specs/` and `src/crates/`, resolve each, verify semantic accuracy, verify algorithm reference pages are consistent with their corresponding formal specs.

**Epic 4** (LaTeX Rendering): Visit the deployed GitHub Pages for each high-LaTeX-density file, screenshot or observe rendered equations, log failures by file and equation.

**Epic 5** (Cross-Reference Index): Build a structured `cross-reference-index.md` mapping specs to crates, specs to outgoing links, crates to specs, with a dependency ordering table.

**Epic 6** (Remediation): Fix all CRITICAL and HIGH findings from epics 1-5 and as many MEDIUM/LOW as practical.

## Phases and Milestones

| Epic    | Description                           | Tickets | Progressive Mode |
| ------- | ------------------------------------- | ------- | ---------------- |
| Epic 01 | Content Integrity Verification        | 5       | Detailed         |
| Epic 02 | Spec-to-Crate Mapping Audit           | 4       | Detailed         |
| Epic 03 | Cross-Reference and Coherence Audit   | 4       | Outline          |
| Epic 04 | LaTeX Equation Rendering Verification | 2       | Outline          |
| Epic 05 | Cross-Reference Index Creation        | 2       | Outline          |
| Epic 06 | Remediation                           | 3       | Outline          |

## Risk Analysis

| Risk                                                       | Likelihood | Impact | Mitigation                                                                                            |
| ---------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Content gaps not caught by line-count comparison           | Medium     | HIGH   | Supplement line counts with heading inventory and formula count audits                                |
| LaTeX renders on one browser but not another               | Low        | MEDIUM | Test with both Chromium and Firefox on the deployed site                                              |
| Scenario-generation.md crate assignment ambiguity          | High       | HIGH   | Explicitly document the split between stochastic (math/generation) and sddp (integration into passes) |
| Remediation tickets are underspecified until epics 1-5 run | High       | LOW    | Epic 06 is intentionally outline — it will be refined after findings are known                        |
| New cross-reference index file not reflected in SUMMARY.md | Low        | HIGH   | Ticket 016 explicitly includes SUMMARY.md update                                                      |

## Success Metrics

- All 50 spec files pass a content integrity check (zero CRITICAL findings)
- All 1,324 internal cross-references resolve correctly
- All LaTeX display equations on the 9 high-density pages render correctly on the deployed site
- A `cross-reference-index.md` file exists in `src/specs/` and is listed in `SUMMARY.md`
- All CRITICAL and HIGH findings from the audit are fixed
- mdBook build exits with code 0 after all remediation
