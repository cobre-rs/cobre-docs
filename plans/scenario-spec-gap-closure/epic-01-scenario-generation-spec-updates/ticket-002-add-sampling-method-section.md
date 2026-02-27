# ticket-002 Add sampling_method Section to scenario-generation.md

## Context

### Background

The `stages.json` schema in `input-scenarios.md` SS1.8 defines a `sampling_method` field (SAA, LHS, QMC, Selective) that controls HOW the opening tree noise values are generated. However, `scenario-generation.md` -- the architecture spec that defines the opening tree and noise generation infrastructure -- never references `sampling_method` or explains how it connects to the opening tree construction described in SS2.3. A reader of the scenario generation spec has no way to discover that the opening tree generation method is configurable.

This is distinct from the `SamplingScheme` abstraction (InSample/External/Historical in SS3), which controls WHICH noise source the forward pass uses. `sampling_method` and `SamplingScheme` are orthogonal dimensions: `sampling_method` governs how the opening tree is populated; `SamplingScheme` governs how the forward pass selects from available noise sources.

### Relation to Epic

This is the second of two tickets in Epic 1. It adds the new SS2.3b section that connects the data model (`sampling_method` field) to the architecture spec (opening tree generation). Ticket-001 must be completed first (or concurrently) since both modify `scenario-generation.md`.

### Current State

File: `src/specs/architecture/scenario-generation.md`

The file has sections SS2.3 (Opening Tree) and SS2.3a (OpeningTree Rust Type) followed by SS2.4 (Time-Varying Correlation Profiles). There is no section between SS2.3a and SS2.4.

SS2.3 describes the opening tree structure and generation but says "Generate $N_t$ noise vectors per stage $t$" without specifying the sampling algorithm used to generate those noise vectors. The only reference to randomness is the seed derivation in SS2.2a, which describes the deterministic hash function but not the sampling strategy applied after the RNG is seeded.

`input-scenarios.md` SS1.8 defines the `sampling_method` field and its five values (SAA, LHS, QMC Sobol, QMC Halton, Selective). The `stages.json` example in SS1.9 shows `"sampling_method": "lhs"` and `"sampling_method": "saa"` in stage definitions.

## Specification

### Requirements

1. **Add new section SS2.3b** titled "Sampling Method and Opening Tree Generation" between SS2.3a and SS2.4. This section must:

   a. Reference `input-scenarios.md` SS1.8 as the data model definition of `sampling_method`

   b. Explain the connection: the `sampling_method` field on each stage in `stages.json` controls the algorithm used to generate the $N_t$ noise vectors for that stage in the opening tree (SS2.3). This is orthogonal to `SamplingScheme` (SS3).

   c. Define SAA (Sample Average Approximation) as the method implemented for Phase 5: uniform Monte Carlo random sampling from the RNG seeded by the deterministic seed function (SS2.2a). Each noise vector component $z_i$ is drawn as independent standard normal $N(0,1)$, then transformed by Cholesky correlation (SS2.1). This is the default when `sampling_method` is `"saa"` or omitted.

   d. List the deferred methods with one-line descriptions and reference [Deferred Features](../deferred.md) for each:
   - LHS (Latin Hypercube Sampling): stratified sampling ensuring uniform marginal coverage
   - QMC Sobol/Halton (Quasi-Monte Carlo): low-discrepancy sequences for deterministic-like coverage
   - Selective (Clustering-based): representative scenarios from historical data clustering

   e. Include a summary table mapping each `sampling_method` value to its implementation status (Phase 5 vs. Deferred)

   f. Note that `sampling_method` can vary per stage (as stated in SS1.8), but the minimal viable solver uses uniform SAA across all stages

2. **Do NOT renumber SS2.4** -- The new section is SS2.3b, inserted between SS2.3a and SS2.4. No existing section numbers change.

### Inputs/Props

- `src/specs/data-model/input-scenarios.md` SS1.8 (sampling method definitions)
- `src/specs/architecture/scenario-generation.md` SS2.2a (seed derivation), SS2.3 (opening tree)

### Outputs/Behavior

- Modified `src/specs/architecture/scenario-generation.md` with new SS2.3b section

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Specifying the LHS, QMC, or Selective algorithms in detail (those are deferred)
- Modifying `input-scenarios.md` (the data model is already correct)
- Modifying SS2.3 or SS2.3a (the opening tree structure is already correct)
- Adding entries to `deferred.md` for the deferred sampling methods (if they are not already there)

## Acceptance Criteria

- [ ] Given `scenario-generation.md`, when searching for section header `### 2.3b`, then exactly one match is found and it is titled "Sampling Method and Opening Tree Generation"
- [ ] Given the new SS2.3b section, when read, then it contains a reference to `[Input Scenarios SS1.8](../data-model/input-scenarios.md)` for the `sampling_method` field definition
- [ ] Given the new SS2.3b section, when read, then SAA is described as "uniform Monte Carlo random sampling from the RNG seeded by the deterministic seed function (SS2.2a)"
- [ ] Given the new SS2.3b section, when read, then it contains a table with at least 5 rows (one per `sampling_method` value) showing implementation status
- [ ] Given the new SS2.3b section, when read, then LHS, QMC Sobol, QMC Halton, and Selective are listed as "Deferred"
- [ ] Given the section ordering in `scenario-generation.md`, when sections are listed, then SS2.3b appears after SS2.3a and before SS2.4, and SS2.4 retains its original number
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. Read `scenario-generation.md` and locate the boundary between SS2.3a (ends around line 325 with the `OpeningTreeView` discussion) and SS2.4 (starts around line 327 "### 2.4 Time-Varying Correlation Profiles")
2. Insert the new SS2.3b section at that boundary
3. Write the section content following the requirements above. Structure:
   - Opening paragraph explaining the connection between `sampling_method` and opening tree generation
   - A note that this is orthogonal to `SamplingScheme` (SS3) -- one controls HOW noise is generated, the other controls WHICH noise source the forward pass uses
   - SAA description (the only Phase 5 method)
   - Summary table of all methods and their status
   - Deferred methods paragraph with brief descriptions
   - Per-stage variation note
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- insert new SS2.3b between lines 325-327 (approximately)

### Patterns to Follow

- Follow the section naming pattern used throughout the file: `### 2.3b Sampling Method and Opening Tree Generation` (subsection numbering with letter suffix, matching the `### 2.3a OpeningTree Rust Type` pattern already in the file)
- Cross-references to data model specs use the pattern `[Input Scenarios SS1.8](../data-model/input-scenarios.md)` (relative path from `src/specs/architecture/`)
- Summary tables in this file use the standard Markdown table format with header row and alignment

### Pitfalls to Avoid

- Do NOT confuse `sampling_method` (SAA/LHS/QMC/Selective -- governs opening tree generation) with `SamplingScheme` (InSample/External/Historical -- governs forward pass scenario selection). Make the distinction explicit in the text.
- Do NOT renumber SS2.4 to SS2.5. The new section is SS2.3b. Renumbering would break all existing cross-references to SS2.4 across the entire spec corpus.
- Do NOT add detailed algorithm specifications for deferred methods. A one-line description and "Deferred" status is sufficient.
- Do NOT use the section symbol in architecture spec prose -- per CLAUDE.md convention.

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Verify section ordering: SS2.3a, SS2.3b, SS2.4 appear in that order with no renumbering
- Verify the new section contains a reference to `input-scenarios.md`

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: None (can be done in parallel with ticket-001 since they modify different sections of the same file, but coordination is needed)
- **Blocks**: ticket-003 (GAP-039 reclassification can cite SS2.3b as additional evidence that the architecture is complete)

## Effort Estimate

**Points**: 2
**Confidence**: High
