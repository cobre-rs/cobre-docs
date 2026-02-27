# ticket-001 Fix InSample Description and Add Seed-Broadcast Clarification

## Context

### Background

The implementation readiness audit (report-031) identified GAP-039 as a "scenario innovation noise broadcast format" gap, describing an architecture where "rank 0 generates scenarios and broadcasts to all ranks." This description is incorrect. The actual architecture, already specified in `scenario-generation.md` SS2.2a, uses deterministic seed derivation so that each MPI rank independently generates its own noise -- no broadcast is needed.

Additionally, `scenario-generation.md` SS3.2 contains a misleading description for the InSample sampling scheme. It says "The sampled noise feeds the PAR model to produce inflow realizations," which implies noise is fed to an external PAR model evaluation function. The correct architecture (confirmed by `training-loop.md` SS4.2a) is: the noise innovation epsilon is fixed as an LP variable via `patch_row_bounds` on the AR dynamics constraint row. The PAR model AR dynamics equation is embedded IN the LP as a constraint. The LP always receives noise (epsilon), never raw inflow values.

The External and Historical scheme descriptions in the same file are already correct -- they correctly describe noise inversion and LP-based injection. Only InSample needs updating.

### Relation to Epic

This is the first of two tickets in Epic 1 (Scenario Generation Spec Updates). It fixes the InSample description inconsistency and adds a clarifying note about the absence of noise broadcast. The second ticket (ticket-002) adds the new `sampling_method` section.

### Current State

File: `src/specs/architecture/scenario-generation.md`

**SS3.2 InSample (lines 357-364).** Current text for the InSample scheme:

```markdown
#### InSample (Default)

At each stage $t$, sample a random index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ and use the corresponding noise vector from the fixed opening tree (SS2.3). The sampled noise feeds the PAR model to produce inflow realizations.

- **Noise source**: Opening tree (same as backward pass)
- **Realization computation**: PAR model evaluation with sampled noise
- **Use case**: Standard SDDP training -- forward and backward passes see the same noise distribution

This is SDDP.jl's `InSampleMonteCarlo`: the forward pass samples from the same noise terms defined in the model.
```

The phrase "The sampled noise feeds the PAR model to produce inflow realizations" and the bullet "Realization computation: PAR model evaluation with sampled noise" are incorrect. In the Cobre architecture, the PAR model dynamics equation is already inside the LP as a constraint. The noise epsilon is injected by fixing the noise variable's bounds via `patch_row_bounds`, not by evaluating the PAR model externally.

**SS2.2 (lines 119-131).** Current text correctly describes deterministic seed derivation but does not explicitly state the implication: that no MPI broadcast of noise data is needed because every rank can independently derive the same noise for any (iteration, scenario, stage) tuple.

## Specification

### Requirements

1. **Fix SS3.2 InSample description**: Replace the misleading "feeds the PAR model" language with a description that matches the LP-based architecture. The noise vector from the opening tree is injected into the stage LP by fixing the noise variable epsilon via `patch_row_bounds` on the AR dynamics constraint row. Reference `training-loop.md` SS4.2a for the patch mechanism.

2. **Add SS2.2 clarifying note**: After the existing three-point "This design ensures" list in SS2.2, add a blockquote note stating that the deterministic seed derivation means no MPI broadcast of noise data is needed -- each rank independently generates identical noise for any given (iteration, scenario, stage) tuple by deriving the same seed and running the same RNG sequence. This is relevant context for understanding why GAP-039 (which assumed a broadcast) was a false gap.

### Inputs/Props

- Current file content of `src/specs/architecture/scenario-generation.md`
- Reference: `src/specs/architecture/training-loop.md` SS4.2a (patch mechanism)
- Reference: `src/specs/math/lp-formulation.md` SS5a (AR lag fixing constraints)

### Outputs/Behavior

- Modified `src/specs/architecture/scenario-generation.md` with corrected SS3.2 and augmented SS2.2

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying the External or Historical scheme descriptions (they are already correct)
- Modifying SS2.2a (seed derivation function) -- it is already correct
- Adding the `sampling_method` section (that is ticket-002)
- Modifying any file other than `scenario-generation.md`

## Acceptance Criteria

- [ ] Given the InSample description in SS3.2, when a reader follows it, then it correctly states that the noise vector from the opening tree is injected into the LP via `patch_row_bounds` on the AR dynamics constraint row, and does NOT say "feeds the PAR model" or "PAR model evaluation with sampled noise"
- [ ] Given the InSample "Realization computation" bullet in SS3.2, when read, then it says the noise epsilon is fixed as an LP variable (not that the PAR model is evaluated externally)
- [ ] Given SS2.2, when a reader finishes the "This design ensures" list, then a blockquote note explains that deterministic seed derivation eliminates the need for MPI broadcast of noise data
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings beyond the pre-existing `risk-measures.md` span warnings and search index size warning
- [ ] Given the file after editing, when searching for the phrase "feeds the PAR model", then zero matches are found in `scenario-generation.md`

## Implementation Guide

### Suggested Approach

1. Read the current SS3.2 InSample section (lines 357-364 of `scenario-generation.md`)
2. Replace the first paragraph. The corrected text should say something like: "At each stage $t$, sample a random index $j \in \{0, \ldots, N_{\text{openings}} - 1\}$ and use the corresponding noise vector $\eta_{t,j}$ from the fixed opening tree (SS2.3). The noise values are injected into the stage LP by fixing the noise variable $\varepsilon$ via `patch_row_bounds` on the AR dynamics constraint row (see [Training Loop SS4.2a](./training-loop.md)). The PAR model dynamics equation is already embedded in the LP as a constraint (see [LP Formulation SS5a](../math/lp-formulation.md)); the solver evaluates the inflow realization implicitly when it solves the LP with the fixed noise."
3. Update the "Realization computation" bullet to: "LP solve with noise epsilon fixed via `patch_row_bounds`"
4. Read SS2.2 (lines 119-131) and add a blockquote note after the "This design ensures" list. The note should explain that because every rank can independently derive the same noise for any (iteration, scenario, stage) tuple, no MPI broadcast of noise data is needed -- this is a key architectural property that differs from systems where a single rank generates all noise and broadcasts it.
5. Run `mdbook build` to verify no broken links

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- SS3.2 (around line 357) and SS2.2 (around line 131)

### Patterns to Follow

- The External and Historical scheme descriptions in the same file (SS3.2) already correctly describe the LP-based noise injection mechanism. The InSample description should be consistent with them.
- Blockquote notes in this file use the `> **Key distinction:**` or `> **Convention:**` pattern. Use a similar format like `> **Architectural note:**` for the SS2.2 addition.

### Pitfalls to Avoid

- Do NOT change the first sentence of the InSample paragraph ("At each stage $t$, sample a random index...") -- the sampling mechanism description is correct; only the "feeds the PAR model" follow-on is wrong
- Do NOT modify the External or Historical descriptions -- they are already correct
- Do NOT modify SS2.2a (seed derivation function) -- it is the authoritative specification and is correct as-is
- Do NOT use the `section symbol` in architecture spec prose -- per CLAUDE.md, `SS` prefix is used for architecture sections, and `section symbol` is reserved for HPC file links and the convention blockquote only
- Do NOT add a convention blockquote -- `scenario-generation.md` is not a trait spec

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Grep for "feeds the PAR model" in the modified file; verify zero matches
- Grep for "PAR model evaluation" in SS3.2; verify zero matches

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-003 (GAP-039 reclassification cites the SS2.2 clarifying note as evidence)

## Effort Estimate

**Points**: 2
**Confidence**: High
