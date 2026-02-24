# ticket-006 Audit Crate Documentation Pages for Spec Reference Completeness

## Context

### Background

The 8 crate documentation pages (`src/crates/`) serve as the human-readable summaries that link each Rust crate to its formal specifications. Each crate page has an Overview prose section, a Key Concepts section (with links to specific spec files), and a Status section. These pages are the primary navigation entry point for a developer who wants to understand a crate's spec before implementing it.

The key risk is an incomplete crate doc: a crate that implements behavior specified in a formal spec but whose doc page does not link to that spec. A developer consulting the crate doc would miss relevant spec content and produce an implementation that diverges from the specification.

The 7 crate documentation files are:

- `/home/rogerio/git/cobre-docs/src/crates/core.md` — cobre-core
- `/home/rogerio/git/cobre-docs/src/crates/io.md` — cobre-io
- `/home/rogerio/git/cobre-docs/src/crates/stochastic.md` — cobre-stochastic
- `/home/rogerio/git/cobre-docs/src/crates/solver.md` — cobre-solver
- `/home/rogerio/git/cobre-docs/src/crates/sddp.md` — cobre-sddp
- `/home/rogerio/git/cobre-docs/src/crates/cli.md` — cobre-cli
- `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md` — ferrompi (separate repo)

### Relation to Epic

This is the first ticket in Epic 02. It establishes the ground truth about what each crate's documentation currently says before tickets 007-009 audit whether the spec-to-crate mapping is correct.

### Current State

The crate doc pages were created during the migration (Epic 01 foundation). They are not migrated from `powers-rs` — they were written fresh for the `cobre-docs` context. The pages exist and have been reviewed. The concern is spec coverage completeness: does each crate doc reference all the spec files that define its behavior?

From direct inspection of the crate docs:

**cobre-core**: Key Concepts links to `input-system-entities.md`, `input-hydro-extensions.md`, `penalty-system.md`, `internal-structures.md`. Potential gap: `design-principles.md` (declares declaration order invariance requirement), `system-elements.md` (defines core physical elements), `equipment-formulations.md` (defines pumping/contract data model aspects).

**cobre-io**: Key Concepts links to `input-directory-structure.md`, `input-scenarios.md`, `input-constraints.md`, `output-schemas.md`, `output-infrastructure.md`, `binary-formats.md`. Potential gap: `input-loading-pipeline.md` and `validation-architecture.md` (both describe io-layer behavior), `design-principles.md` (format decision framework).

**cobre-stochastic**: Key Concepts links to `scenario-generation.md` and `par-inflow-model.md`. Coverage appears adequate for the stochastic scope.

**cobre-solver**: Key Concepts links to `solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`. Coverage appears complete.

**cobre-sddp**: Key Concepts links to `training-loop.md`, `simulation-architecture.md`, `convergence-monitoring.md`, `cut-management-impl.md`. Potential gap: `sddp-algorithm.md` (the foundational math spec), all risk measures and stopping rules math specs.

**cobre-cli**: Key Concepts links to `cli-and-lifecycle.md`, `validation-architecture.md`. Potential gap: `configuration-reference.md` (the CLI reads and validates config.json).

**ferrompi**: Likely links to `hybrid-parallelism.md` and `synchronization.md`. Verify coverage of `communication-patterns.md`.

### Architecture Reference (Ground Truth)

From the cobre workspace at `/home/rogerio/git/cobre/`, the crate responsibilities are:

| Crate            | Confirmed Responsibilities                             | Expected Spec Coverage                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| cobre-core       | Entity types, topology, resolution, canonical ordering | design-principles, system-elements, equipment-formulations, input-system-entities, internal-structures, penalty-system, input-hydro-extensions                                                                                                                                                                                                   |
| cobre-io         | All file I/O: loading, validation, writing             | input-directory-structure, input-scenarios, input-constraints, output-schemas, output-infrastructure, binary-formats, input-loading-pipeline, validation-architecture, design-principles                                                                                                                                                         |
| cobre-stochastic | PAR(p) preprocessing, correlated noise, opening tree   | par-inflow-model, scenario-generation                                                                                                                                                                                                                                                                                                            |
| cobre-solver     | LP trait, HiGHS, CLP, workspaces, warm-start           | solver-abstraction, solver-highs-impl, solver-clp-impl, solver-workspaces                                                                                                                                                                                                                                                                        |
| cobre-sddp       | Full SDDP loop, forward/backward pass, cut management  | sddp-algorithm, lp-formulation, system-elements, block-formulations, hydro-production-models, cut-management, discount-rate, infinite-horizon, risk-measures, inflow-nonnegativity, stopping-rules, upper-bound-evaluation, training-loop, simulation-architecture, convergence-monitoring, cut-management-impl, extension-points, all hpc files |
| cobre-cli        | Binary, lifecycle, exit codes, config loading          | cli-and-lifecycle, configuration-reference                                                                                                                                                                                                                                                                                                       |
| ferrompi         | MPI bindings, SharedWindow, topology detection         | hybrid-parallelism, communication-patterns, synchronization (at minimum)                                                                                                                                                                                                                                                                         |

## Specification

### Requirements

For each of the 7 crate doc pages:

**Check A — Key Concepts Link Coverage**: List all formal spec files that the crate is responsible for (from the ground truth table). For each expected spec, verify a markdown link to it exists somewhere in the crate doc page (either in Key Concepts or the Overview prose).

**Check B — Link Correctness**: All links in the crate doc page must resolve to existing files. The link format is `../specs/<section>/<file>.md`.

**Check C — Overview Prose Accuracy**: The Overview prose must describe the crate's behavior as defined in the specs. Spot-check 2-3 specific behavioral claims per crate against the referenced spec. For example, `cobre-sddp` Overview says "Each iteration follows a fixed lifecycle: forward pass, forward synchronization (MPI_Allreduce), backward pass..." — verify this matches `training-loop.md §2.1`.

**Check D — Dependency Graph in overview.md**: The `crates/overview.md` page shows a dependency graph. Verify the dependency graph is consistent with the actual Cargo.toml dependencies in the cobre workspace at `/home/rogerio/git/cobre/Cargo.toml` (and individual crate Cargo.toml files).

### Inputs

- Target: `/home/rogerio/git/cobre-docs/src/crates/` — all 8 files
- Architecture reference: `/home/rogerio/git/cobre/crates/` — individual Cargo.toml files
- Spec files: `/home/rogerio/git/cobre-docs/src/specs/` — all sections

### Outputs

Per-crate audit sections. Each section contains:

- Link coverage table: `| Expected Spec | Link Present | Link Resolves |`
- Findings (MEDIUM for missing link, HIGH for missing coverage of primary spec)
- PASS/FAIL verdict

### Error Handling

- Primary spec for a crate not linked at all from the crate doc: HIGH
- Link in crate doc resolves to wrong file: HIGH
- Secondary spec not linked: MEDIUM
- Dependency graph inconsistency with Cargo.toml: MEDIUM

## Acceptance Criteria

- [ ] Given `cobre-core` crate doc, when cross-checked against expected specs, then `system-elements.md` and `design-principles.md` are either linked or their absence is justified
- [ ] Given `cobre-io` crate doc, when cross-checked, then `input-loading-pipeline.md` and `validation-architecture.md` are linked or their absence is justified
- [ ] Given `cobre-sddp` crate doc, when cross-checked, then `sddp-algorithm.md` from the math section is linked or its absence is justified
- [ ] Given `cobre-cli` crate doc, when cross-checked, then `configuration-reference.md` is linked or its absence is justified
- [ ] Given all 7 crate doc pages, when all markdown links are resolved, then zero broken links exist
- [ ] Given `crates/overview.md` dependency graph, when compared to Cargo.toml, then the graph is correct
- [ ] The ticket produces a 7-crate summary table: `| Crate | Primary Specs Covered | Missing Refs | Verdict |`

## Implementation Guide

### Suggested Approach

Step 1: For each crate doc, extract all links:

```bash
for f in core io stochastic solver sddp cli ferrompi; do
  echo "=== crates/${f}.md ==="
  grep -o '\[.*\](../specs/[^)]*\.md[^)]*)' \
    /home/rogerio/git/cobre-docs/src/crates/${f}.md
done
```

Step 2: Compare to the expected spec coverage table above. Mark each expected spec as `Linked` or `Missing`.

Step 3: For each linked spec, verify the path resolves:

```bash
# Example for cobre-sddp
while IFS= read -r link; do
  path=$(echo "$link" | grep -o '(../[^)]*\.md)' | tr -d '()')
  # Resolve relative to src/crates/
  resolved="/home/rogerio/git/cobre-docs/src/crates/${path}"
  [ -f "$resolved" ] || echo "BROKEN: $path"
done < <(grep -o '\[.*\](../[^)]*\.md)' /home/rogerio/git/cobre-docs/src/crates/sddp.md)
```

Step 4: Check the Cargo workspace for actual crate dependencies:

```bash
cat /home/rogerio/git/cobre/Cargo.toml
cat /home/rogerio/git/cobre/crates/cobre-sddp/Cargo.toml 2>/dev/null || \
  cat /home/rogerio/git/cobre/crates/cobre-sddp/Cargo.toml
```

Step 5: Compare the dependency graph in `crates/overview.md` to the Cargo dependency tree.

Step 6: For `cobre-sddp`, `cobre-core`, and `cobre-io` specifically — verify 2-3 behavioral claims in the Overview prose against the referenced spec.

### Key Files to Modify

Read-only audit. Findings go into the audit report. Fixes in Epic 06.

### Patterns to Follow

The `crates/overview.md` dependency graph is at `/home/rogerio/git/cobre-docs/src/crates/overview.md` — it uses a code block ASCII diagram, not a mermaid chart.

### Pitfalls to Avoid

- `ferrompi` is in a separate repository — it will not have a Cargo.toml in `/home/rogerio/git/cobre/crates/`. The dependency is expressed in `cobre-sddp`'s Cargo.toml as an optional dependency.
- Some spec files appear under multiple expected crates (e.g., `system-elements.md` is relevant to both `cobre-core` and `cobre-sddp`). A spec linked from one crate doc but not another is not necessarily missing — use the primary vs secondary distinction.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

`mdbook build` exit 0 throughout (no files are modified by this ticket).

## Dependencies

- **Blocked By**: ticket-001 (crate doc links reference spec files whose integrity is being verified)
- **Blocks**: ticket-007, ticket-008, ticket-009 (the crate expected coverage table is established here)

## Effort Estimate

**Points**: 2
**Confidence**: High
