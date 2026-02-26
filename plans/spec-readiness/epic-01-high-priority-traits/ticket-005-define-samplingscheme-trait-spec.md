# ticket-005 Define SamplingScheme Trait Spec

## Context

### Background

The sampling scheme is the fourth algorithm abstraction point in the SDDP training loop (the third being cut formulation, which is fixed at single-cut). It determines how the forward pass selects scenario realizations at each stage. Three variants exist: InSample (random index from opening tree), External (user-provided scenarios from Parquet file), and Historical (historical inflow replay). The design is in `scenario-generation.md` SS3; the behavioral contract is in `extension-points.md` SS5.4; the configuration is in `extension-points.md` SS5.2-SS5.3.

A critical invariant is that the backward pass always uses the fixed opening tree regardless of forward sampling scheme (extension-points.md SS5.4, scenario-generation.md SS3.1).

### Relation to Epic

Fifth ticket in Epic 01. The conformance test spec (ticket-006) depends on this trait spec. Independent of tickets 001-004.

### Current State

- `src/specs/architecture/extension-points.md` SS5 describes the three variants and configuration
- `src/specs/architecture/scenario-generation.md` SS3 provides the complete sampling scheme abstraction (three orthogonal concerns, forward sampling schemes, forward pass model, backward sampling)
- `src/specs/architecture/scenario-generation.md` SS4 describes external scenario integration (PAR fitting, noise inversion)
- No formal trait definition exists yet

## Specification

### Requirements

Create a new file `src/specs/architecture/sampling-scheme-trait.md` with the following structure:

1. **Title**: `# Sampling Scheme Trait`
2. **Purpose paragraph**: Define the trait controlling how the forward pass selects scenario realizations
3. **Convention blockquote**: Copy verbatim from `communicator-trait.md`
4. **SS1. Trait Definition**: Enum-based trait with three variants (InSample, External, Historical)
5. **SS2. Method Contracts**: Primary method with preconditions/postconditions:
   - `sample_forward(stage_id, scenario_index, rng) -> NoiseVector` -- Select the noise realization for a given forward pass stage. For InSample, this draws a random index from the opening tree. For External, this looks up the external scenario data. For Historical, this maps the historical record to stages.
   - `requires_noise_inversion() -> bool` -- Whether the variant requires noise inversion (External and Historical do; InSample does not). Per scenario-generation.md SS4.3.
   - `backward_tree_source() -> BackwardTreeSource` -- Describe the backward pass noise source for this scheme. All return the fixed opening tree, but the tree may be fitted to different data (InSample: PAR from model parameters; External/Historical: PAR fitted to external/historical data). Per scenario-generation.md SS4.2.
6. **SS3. Supporting Types**: `SamplingSchemeConfig` matching the `stages.json` schema, `SelectionMode` enum for External variant
7. **SS4. Dispatch Mechanism**: Enum dispatch. Sampling scheme is global (one per run).
8. **SS5. Forward-Backward Separation Invariant**: Document the critical invariant from scenario-generation.md SS3.1 and extension-points.md SS5.4: the backward pass ALWAYS uses the fixed opening tree
9. **SS6. Validation Rules**: Rules S1-S4 from extension-points.md SS5.3
10. **Cross-References** section

### Content Guidelines

- The **scenario-generation.md is the primary source** for sampling scheme behavior
- The forward-backward separation invariant is the most important behavioral contract -- emphasize it
- Document that External and Historical variants require noise inversion (scenario-generation.md SS4.3)
- Document that External/Historical trigger PAR model fitting from external data (scenario-generation.md SS4.2)
- The `selection_mode` (random vs sequential) applies only to the External variant

### Error Handling

Validation errors for missing required files (external_scenarios.parquet, inflow_history.parquet). Reference the validation rules S1-S4.

## Acceptance Criteria

- [ ] Given the file exists, when reading it, then it contains: Purpose, convention blockquote, SS1-SS6, and Cross-References
- [ ] Given the trait definition in SS1, when reading it, then three variants are defined (InSample, External, Historical)
- [ ] Given the method contracts in SS2, when reading `sample_forward`, then it has Preconditions and Postconditions tables
- [ ] Given SS5, when reading it, then the forward-backward separation invariant is prominently documented
- [ ] Given SS6, when reading the validation rules, then S1-S4 from extension-points.md SS5.3 are all present
- [ ] Given the cross-references, when checking each link, then all links resolve to existing sections

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/scenario-generation.md` SS3 for the sampling scheme abstraction
2. Read `src/specs/architecture/extension-points.md` SS5 for variant table, configuration, and validation
3. Read `src/specs/architecture/scenario-generation.md` SS4 for external scenario integration
4. Write the trait spec, emphasizing the forward-backward separation invariant

### Key Files to Modify

- **Create**: `src/specs/architecture/sampling-scheme-trait.md`

### Patterns to Follow

- Same structural pattern as communicator-trait.md, risk-measure-trait.md, horizon-mode-trait.md

### Pitfalls to Avoid

- Do NOT conflate forward sampling with backward sampling (they are independent concerns per scenario-generation.md SS3.1)
- Do NOT add Monte Carlo backward sampling (deferred feature C.14)
- Do NOT add alternative forward pass model (deferred feature C.13)
- Do NOT include PAR model fitting details (that belongs in scenario-generation.md, not the trait spec)

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-006 (conformance test spec depends on this trait spec)

## Effort Estimate

**Points**: 3
**Confidence**: High
