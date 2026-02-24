# ticket-021 Add Missing Spec Links to Crate Documentation Pages

## Context

### Background

Epic 02 (ticket-006) identified 14 HIGH findings where crate documentation pages under `src/crates/` are missing cross-reference links to their primary specs. The most severe gap is in `cobre-sddp` which links only 4 of its 12 primary specs. These missing links mean developers reading the crate docs cannot navigate to the authoritative spec for a concept described in the crate overview.

This ticket was created as a SPLIT from the original ticket-019 because the crate doc link fixes are a distinct concern from spec file section-number corrections: they modify different files (`src/crates/*.md` vs `src/specs/*.md`), follow a different pattern (adding new Key Concepts bullets vs. editing existing cross-reference text), and can be verified independently.

### Relation to Epic

This ticket handles the 14 HIGH crate doc missing-link findings and optionally the 11 MEDIUM crate doc findings. It runs after ticket-018 (notation) and ticket-019 (spec file fixes) because the spec files must be correct before linking to them. It runs in parallel with or after ticket-020 (MEDIUM/LOW) since they modify non-overlapping files.

### Current State

The crate documentation pages at `/home/rogerio/git/cobre-docs/src/crates/` have a consistent structure:

1. Title and status badge
2. Overview paragraph(s)
3. Key Concepts section with bullet points, each linking to a spec
4. Status section

The Key Concepts section is where missing links must be added. Each bullet follows this pattern:

```markdown
- **Concept name** -- Brief description of what the spec covers and why it matters to this crate.
  See [Spec Title](../specs/section/spec-file.md).
```

The cross-reference index at `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` (Component 1: spec-to-crate table and Component 2: per-crate reading lists) provides the authoritative mapping of which specs belong to which crates.

## Specification

### Requirements

Add missing spec links to 5 crate doc pages. The definitive list is from the epic-02 learnings (`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/learnings.md` lines 161-181):

**1. `/home/rogerio/git/cobre-docs/src/crates/sddp.md`** — 8 HIGH missing links

Add Key Concepts bullets for each of these specs:

| Spec                                    | Suggested Bullet                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `specs/math/sddp-algorithm.md`          | SDDP algorithm: Bellman recursion, forward/backward pass theory, single-cut vs multi-cut, policy graph                     |
| `specs/math/lp-formulation.md`          | LP subproblem: complete stage LP structure (objective, constraints, variable bounds) that the solver constructs and solves |
| `specs/math/system-elements.md`         | System element formulations: per-element variables, constraints, and cost contributions                                    |
| `specs/math/block-formulations.md`      | Block formulations: multi-block stage structure, independent vs parallel modes, block aggregation                          |
| `specs/math/hydro-production-models.md` | Hydro production models: constant productivity, FPHA hyperplanes, head-dependent generation                                |
| `specs/math/cut-management.md`          | Cut management: Benders cut lifecycle, dual extraction, aggregation, validity, selection strategies                        |
| `specs/math/risk-measures.md`           | Risk measures: CVaR, convex combination (EAVaR), risk-averse cut generation, per-stage profiles, bound validity            |
| `specs/math/stopping-rules.md`          | Stopping rules: convergence criteria (bound stalling, simulation stability, iteration/time limits)                         |

**2. `/home/rogerio/git/cobre-docs/src/crates/core.md`** — 2 HIGH missing links

| Spec                                  | Suggested Bullet                                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `specs/overview/design-principles.md` | Design principles: format selection criteria (JSON/Parquet/FlatBuffers), declaration order invariance, canonical ID ordering |
| `specs/math/system-elements.md`       | System elements: entity variable definitions and constraint formulations that the data model must support                    |

**3. `/home/rogerio/git/cobre-docs/src/crates/io.md`** — 2 HIGH missing links

| Spec                                            | Suggested Bullet                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `specs/architecture/input-loading-pipeline.md`  | Input loading pipeline: rank-0 centric loading, dependency ordering, sparse expansion, data broadcasting |
| `specs/architecture/validation-architecture.md` | Validation architecture: five-layer validation pipeline, error collection, error catalog, report format  |

**4. `/home/rogerio/git/cobre-docs/src/crates/cli.md`** — 1 HIGH missing link

| Spec                                             | Suggested Bullet                                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/configuration/configuration-reference.md` | Configuration reference: complete `config.json` and `stages.json` schema, modeling/training/simulation options, formulation-to-configuration mapping |

**5. `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md`** — 1 HIGH missing link

Review the ticket-006 ferrompi section (`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-006-audit-report.md`) to identify the specific missing link. Based on the ferrompi crate page, which already links to 4 HPC specs (hybrid-parallelism, communication-patterns, shared-memory-aggregation, slurm-deployment), the most likely HIGH gap is `specs/hpc/memory-architecture.md` (NUMA-aware allocation relevant to ferrompi's SharedWindow).

### Inputs/Props

- Epic-02 learnings: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/learnings.md` (lines 161-181)
- Ticket-006 audit report: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-006-audit-report.md`
- Cross-reference index: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` (per-crate reading lists)

### Outputs/Behavior

- All 14 HIGH missing links added to crate doc pages
- Each new link follows the existing Key Concepts bullet pattern
- New bullets are inserted in a logical reading order (math foundations before architecture)
- `mdbook build` passes with exit 0

### Error Handling

- If a spec file path has changed since the audit (unlikely but possible), verify the path exists before adding the link
- If the crate page structure has changed, adapt the insertion point to match the current format

## Acceptance Criteria

- [ ] Given `src/crates/sddp.md`, when reading the Key Concepts section, then it contains links to all 12 primary specs: the 4 existing (training-loop, simulation-architecture, convergence-monitoring, cut-management-impl) plus the 8 new ones listed above
- [ ] Given `src/crates/core.md`, when reading the Key Concepts section, then it contains links to `design-principles.md` and `system-elements.md` in addition to the existing links
- [ ] Given `src/crates/io.md`, when reading the Key Concepts section, then it contains links to `input-loading-pipeline.md` and `validation-architecture.md` in addition to the existing links
- [ ] Given `src/crates/cli.md`, when reading the Key Concepts section, then it contains a link to `configuration-reference.md` in addition to the existing links
- [ ] Given `src/crates/ferrompi.md`, when reading the Key Concepts section, then the HIGH gap identified in ticket-006 is resolved
- [ ] Given any added link, when clicking it in the rendered mdBook, then it resolves to the correct spec page (no 404)
- [ ] Given the full cobre-docs repo, when running `mdbook build`, then the build succeeds with exit 0

## Implementation Guide

### Suggested Approach

1. **Read the ticket-006 audit report** to confirm the exact list of HIGH missing links per crate and the ferrompi gap
2. **Read each crate doc page** to understand its current Key Concepts structure and identify insertion points
3. **Add links to sddp.md first** (8 links, largest batch) — group math specs together, before the existing architecture spec links
4. **Add links to core.md, io.md, cli.md, ferrompi.md** (2, 2, 1, 1 links)
5. **Run `mdbook build`** to verify all links resolve
6. **Optionally**: address the 11 MEDIUM crate doc gaps (SDDP-9 through SDDP-15, CORE-3, IO-3) if time permits. These add links to secondary specs and HPC specs. The MEDIUM items are documented in ticket-006.

### Key Files to Modify

1. `/home/rogerio/git/cobre-docs/src/crates/sddp.md` — Add 8 Key Concepts bullets
2. `/home/rogerio/git/cobre-docs/src/crates/core.md` — Add 2 Key Concepts bullets
3. `/home/rogerio/git/cobre-docs/src/crates/io.md` — Add 2 Key Concepts bullets
4. `/home/rogerio/git/cobre-docs/src/crates/cli.md` — Add 1 Key Concepts bullet
5. `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md` — Add 1 Key Concepts bullet

### Patterns to Follow

Follow the exact format of existing Key Concepts bullets. For example, in `sddp.md`:

```markdown
- **Training iterations** -- Each iteration performs a forward pass (sample $M$
  scenarios, solve stage LPs, record visited states and lower bound) followed by
  a backward pass (evaluate all openings at visited states, extract duals,
  generate and aggregate cuts).
  See [Training Loop](../specs/architecture/training-loop.md).
```

New bullets should:

- Use `**Bold concept name**` followed by `--` and a description
- Keep descriptions to 2-3 lines
- End with `See [Spec Title](relative/path/to/spec.md).`
- Use relative paths from `src/crates/` to `src/specs/` (i.e., `../specs/...`)

### Pitfalls to Avoid

- **Do NOT duplicate existing links**: sddp.md already links to training-loop.md, simulation-architecture.md, convergence-monitoring.md, and cut-management-impl.md. Do not add these again.
- **Path accuracy**: The relative path from `src/crates/sddp.md` to `src/specs/math/sddp-algorithm.md` is `../specs/math/sddp-algorithm.md`
- **Ordering**: Insert math spec links before architecture spec links for logical reading flow
- **LaTeX in bullets**: Some bullets may include `$...$` inline math (like the existing training iterations bullet). This is fine — KaTeX handles inline math in list items.

## Testing Requirements

### Build Verification

- Run `mdbook build` after all link additions
- Verify exit 0 and no broken link warnings

### Link Verification

- For each added link, verify the target file exists at the relative path
- Optionally: open the built book and click each new link to confirm navigation

## Dependencies

- **Blocked By**: ticket-018 (notation change), ticket-019 (spec file fixes must be done so links point to correct content)
- **Blocks**: Nothing — this can run in parallel with ticket-020

## Effort Estimate

**Points**: 2
**Confidence**: High (all required information is documented; the work is mechanical — adding formatted bullets to markdown files)
