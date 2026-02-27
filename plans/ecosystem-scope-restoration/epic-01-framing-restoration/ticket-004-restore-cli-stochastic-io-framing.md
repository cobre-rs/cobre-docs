# ticket-004 Restore Generic Framing in cobre-cli, cobre-stochastic, and cobre-io Overviews

## Context

### Background

Three remaining crate overviews describe themselves in SDDP-specific terms. `cobre-cli` says "single entrypoint for the Cobre SDDP solver" and "orchestrates the full execution lifecycle" with SDDP-specific phases. `cobre-stochastic` says "implements the scenario generation pipeline for SDDP training and simulation." `cobre-io` is relatively generic already but contains some SDDP-specific framing. Each needs its Overview paragraph restored to ecosystem-appropriate language.

### Relation to Epic

This ticket handles the three remaining crate overviews in Epic 01. They are grouped because each requires a moderate amount of prose work and shares the same pattern.

### Current State

File `src/crates/cli.md`:

- Line 8: "top-level binary crate and single entrypoint for the Cobre SDDP solver"
- Line 8-9: "orchestrates the full execution lifecycle -- from MPI initialization through input loading, validation, training, simulation, and finalization"

File `src/crates/stochastic.md`:

- Line 7: "implements the scenario generation pipeline for SDDP training and simulation"
- Line 8: "preprocesses PAR(p) model parameters"

File `src/crates/io.md`:

- Line 7: "handles all file-system interactions for a Cobre study" (relatively generic)
- The Overview is mostly generic already; minor SDDP-specific language may exist

## Specification

### Requirements

1. Rewrite `src/crates/cli.md` Overview to describe `cobre-cli` as the top-level binary crate for the Cobre ecosystem (not "the Cobre SDDP solver")
2. Rewrite `src/crates/stochastic.md` Overview to describe `cobre-stochastic` as a scenario generation and stochastic process framework (with PAR(p)/hydro as the first implementation)
3. Review `src/crates/io.md` Overview and update any remaining SDDP-specific language to generic terms
4. Preserve all Key Concepts sections, cross-reference links, and Status sections
5. Do NOT change behavioral contracts or structural patterns

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/crates/cli.md`, `/home/rogerio/git/cobre-docs/src/crates/stochastic.md`, `/home/rogerio/git/cobre-docs/src/crates/io.md`

### Outputs/Behavior

- All three files have generic Overview paragraphs
- Key Concepts bullets may mention SDDP as a usage context, not as the defining purpose
- All structural content preserved

### Error Handling

- `cobre-cli` legitimately orchestrates SDDP phases -- frame the execution lifecycle generically (startup, validation, initialization, solve, finalize) with SDDP as the current solver implementation
- `cobre-stochastic` has PAR(p)-specific content that is correctly domain-specific in Key Concepts; only the Overview framing needs generalization

## Acceptance Criteria

- [ ] Given `src/crates/cli.md`, when the first sentence of the Overview is read, then it says "top-level binary crate for the Cobre ecosystem" (or equivalent), not "the Cobre SDDP solver"
- [ ] Given `src/crates/stochastic.md`, when the Overview paragraph is read, then it describes a general "scenario generation framework" (or equivalent), not "scenario generation pipeline for SDDP"
- [ ] Given `src/crates/io.md`, when the Overview is searched for "SDDP", then zero matches appear in the Overview paragraph
- [ ] Given all three files, when `mdbook build` is run, then the build succeeds with no new warnings
- [ ] Given all three files, when Key Concepts sections are diffed against originals, then cross-reference links are unchanged

### Out of Scope

- Architecture spec purpose paragraphs for scenario generation (that is Epic 03)
- Method signatures or type definitions
- Exit code definitions in `cli.md`

## Implementation Guide

### Suggested Approach

**For `src/crates/cli.md`:**

1. Rewrite first sentence: "cobre-cli is the top-level binary crate and execution entrypoint for the Cobre ecosystem."
2. Describe the lifecycle generically: "orchestrates the full execution lifecycle -- from process initialization through input loading, validation, solver execution, and finalization"
3. Keep the phases description but use generic terms where possible: "Validation phase", "Initialization phase", "Solve phase" (instead of "Training phase"), "Simulation phase" (this is specific but acceptable since simulation is a real phase)

**For `src/crates/stochastic.md`:**

1. Rewrite Overview: "cobre-stochastic implements the scenario generation framework for the Cobre ecosystem. Its first implementation provides PAR(p) autoregressive inflow models for hydrothermal dispatch, including..."
2. Frame the preprocessing, noise generation, and opening tree as capabilities of the scenario generation framework, with hydro-specific details as the first implementation
3. Keep "external scenario injection" framing -- it is already generic

**For `src/crates/io.md`:**

1. Review the Overview -- it is mostly generic ("handles all file-system interactions for a Cobre study")
2. Check for any SDDP-specific terms in the Overview and replace them
3. Key Concepts section may reference "training and simulation" which is acceptable as specific phase names

### Key Files to Modify

- `src/crates/cli.md` (Overview paragraph only)
- `src/crates/stochastic.md` (Overview paragraph only)
- `src/crates/io.md` (Overview paragraph only, if needed)

### Patterns to Follow

- "Cobre ecosystem" as the scope reference
- Phase names (Training, Simulation) are acceptable as specific features, not as the defining purpose
- PAR(p)/hydro as "first implementation" of a generic capability

### Pitfalls to Avoid

- Do NOT genericize `cobre-cli` to the point where it loses clarity about what it actually does
- Do NOT remove SDDP phase names (Training, Simulation) from `cli.md` -- these are real execution phases
- Do NOT change exit code definitions or lifecycle phase descriptions beyond framing

## Testing Requirements

### Unit Tests

- `grep "SDDP" src/crates/cli.md` in Overview paragraph returns 0 matches
- `grep "SDDP" src/crates/stochastic.md` in Overview paragraph returns 0 matches
- `grep "SDDP" src/crates/io.md` in Overview paragraph returns 0 matches

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
