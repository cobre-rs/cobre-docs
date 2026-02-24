# ticket-008 Audit Spec-to-Crate Mapping for Math and Architecture Specs

## Context

### Background

This ticket audits the 27 specs across `specs/math/` (14 files) and `specs/architecture/` (13 files) for crate assignment correctness.

The math section is almost entirely `cobre-sddp` territory, with two important exceptions:

- `par-inflow-model.md` is the authoritative spec for `cobre-stochastic`
- `system-elements.md` and `equipment-formulations.md` define the physical element model that `cobre-core` will implement

The architecture section is more heterogeneous:

- `solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md` → `cobre-solver`
- `training-loop.md`, `simulation-architecture.md`, `convergence-monitoring.md`, `cut-management-impl.md`, `extension-points.md` → `cobre-sddp`
- `scenario-generation.md` → `cobre-stochastic` (PAR preprocessing, noise generation, opening tree) + `cobre-sddp` (integration into passes)
- `input-loading-pipeline.md`, `validation-architecture.md` → `cobre-io` (data loading and validation logic)
- `cli-and-lifecycle.md` → `cobre-cli`

The key architectural question resolved in this ticket: Is `scenario-generation.md` correctly placed in `specs/architecture/` even though its primary implementor is `cobre-stochastic`? And are `input-loading-pipeline.md` and `validation-architecture.md` correctly placed in `specs/architecture/` even though their primary implementor is `cobre-io`?

### Relation to Epic

This is ticket 3 of 4 in Epic 02. Together with ticket-007, it covers all 50 spec files from a mapping perspective (the remaining 10 HPC/config files are ticket-009).

### Current State

All math and architecture specs are placed in their respective sections. The `SUMMARY.md` lists them correctly. The question is whether the section granularity is sufficient for developer navigation.

The `scenario-generation.md` concern was anticipated during the migration — this spec was originally in `03-architecture/` in the source and was kept in the corresponding `specs/architecture/` section in the target. However, `cobre-stochastic` is the implementation crate. This ticket produces a documented decision on whether this is acceptable.

## Specification

### Requirements

**Check M1 — Math Section Mapping** (14 files): For each math spec, identify its primary crate:

- `sddp-algorithm.md` → cobre-sddp (SDDP algorithm core)
- `lp-formulation.md` → cobre-sddp (stage LP construction)
- `system-elements.md` → cobre-core (physical entity modeling) AND cobre-sddp (LP construction uses these)
- `block-formulations.md` → cobre-sddp (block LP structure)
- `hydro-production-models.md` → cobre-sddp (FPHA in LP) AND cobre-core (hydro entity data)
- `cut-management.md` → cobre-sddp (cut generation and aggregation)
- `discount-rate.md` → cobre-sddp (discount factor in objective)
- `infinite-horizon.md` → cobre-sddp (cyclic policy graph)
- `risk-measures.md` → cobre-sddp (CVaR risk-averse cuts)
- `inflow-nonnegativity.md` → cobre-sddp (LP constraint)
- `par-inflow-model.md` → cobre-stochastic (PAR model implementation)
- `equipment-formulations.md` → cobre-sddp (LP constraints) AND cobre-core (entity types)
- `stopping-rules.md` → cobre-sddp (convergence monitoring)
- `upper-bound-evaluation.md` → cobre-sddp (statistical upper bound computation)

Confirm or correct each assignment. Flag any HIGH finding where the primary crate assignment is wrong.

**Check M2 — Architecture Section Mapping** (13 files): For each architecture spec, identify its primary crate and determine if the placement in `specs/architecture/` is semantically correct:

- Is `input-loading-pipeline.md` more naturally placed in `specs/data-model/`? It defines the sequential loading steps (structural → schema → referential → semantic validation), which is the `cobre-io` I/O pipeline.
- Is `validation-architecture.md` more naturally placed elsewhere? It defines validation layers that run in `cobre-io` but are orchestrated by `cobre-cli`.
- Is `scenario-generation.md` correctly placed in `specs/architecture/` even though `cobre-stochastic` implements it?

**Check M3 — Documented Decisions for Architecture Ambiguities**: Produce written decisions for the 3 architecture ambiguities above. Each decision must state:

- Current placement
- Primary implementation crate
- Whether the placement correctly reflects the cobre-docs taxonomy (specs/architecture = how things are built; specs/data-model = what data flows)
- Recommendation: keep, move to different section, or add cross-reference note

**Check M4 — SUMMARY.md Verification**: Confirm all 27 files appear in SUMMARY.md under the correct heading.

### Inputs

- Files: `src/specs/math/` (14 files) and `src/specs/architecture/` (13 files)
- `SUMMARY.md`: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`
- Architecture reference: crate Cargo.toml files in `/home/rogerio/git/cobre/crates/`

### Outputs

A 27-row mapping table:

```
| Spec File | Section | Primary Crate | Secondary Crate(s) | Placement OK | Findings |
```

Written decisions for the 3 architecture placement ambiguities.

### Error Handling

- Spec with incorrect primary crate assignment: HIGH
- Spec correctly placed with a clear secondary crate not documented: LOW
- Spec missing from SUMMARY.md: HIGH

## Acceptance Criteria

- [ ] Given `par-inflow-model.md`, when crate assignment is determined, then `cobre-stochastic` is identified as primary and the placement in `specs/math/` is justified (math spec for a stochastic crate is acceptable because the spec defines the mathematical model)
- [ ] Given `scenario-generation.md`, when placement is evaluated, then a documented decision exists explaining why `specs/architecture/` is correct (or recommending a move)
- [ ] Given `input-loading-pipeline.md` and `validation-architecture.md`, when placement is evaluated, then documented decisions exist for whether these belong in `specs/architecture/` or `specs/data-model/`
- [ ] Given all 27 files, when SUMMARY.md is checked, then all 27 are listed under their correct sections
- [ ] The ticket produces a 27-row mapping table

## Implementation Guide

### Suggested Approach

Step 1: For `par-inflow-model.md` — confirm its primary crate is `cobre-stochastic` by reading the Purpose section:

```bash
head -8 /home/rogerio/git/cobre-docs/src/specs/math/par-inflow-model.md
```

Step 2: For the architecture ambiguities, read the Purpose sections:

```bash
head -10 /home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md
head -10 /home/rogerio/git/cobre-docs/src/specs/architecture/input-loading-pipeline.md
head -10 /home/rogerio/git/cobre-docs/src/specs/architecture/validation-architecture.md
```

Step 3: Check whether `cobre-stochastic` has its own Cargo.toml in the workspace and whether `scenario-generation.md` specifies the PAR preprocessing step (which is stochastic) vs the SDDP training loop integration (which is sddp):

```bash
ls /home/rogerio/git/cobre/crates/cobre-stochastic/
```

Step 4: For the `input-loading-pipeline.md` decision — determine if the sequential validation layers (structural, schema, referential, dimensional, semantic) are primarily `cobre-io` logic or `cobre-cli` orchestration:

```bash
head -30 /home/rogerio/git/cobre-docs/src/specs/architecture/input-loading-pipeline.md
head -30 /home/rogerio/git/cobre-docs/src/specs/architecture/validation-architecture.md
```

Step 5: Build the 27-row mapping table.

### Key Files to Modify

Read-only audit.

### Patterns to Follow

The reasoning for placement decisions should follow the cobre-docs taxonomy: `specs/math/` = mathematical formulations; `specs/architecture/` = how components are built and integrated; `specs/data-model/` = data schemas and file formats; `specs/hpc/` = parallel distribution.

### Pitfalls to Avoid

- `scenario-generation.md` covers both PAR model preprocessing (stochastic domain) AND the sampling scheme abstraction for the SDDP forward/backward passes (algorithm domain). The file spans two crate boundaries. The decision should reflect this dual nature.
- `hydro-production-models.md` defines the FPHA model — used in the LP (cobre-sddp) but the hyperplane data lives in the hydro entity (cobre-core). Document both.

## Testing Requirements

### Unit Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-006 (crate responsibility table)
- **Blocks**: ticket-009 (master mapping table compilation)

## Effort Estimate

**Points**: 2
**Confidence**: High
