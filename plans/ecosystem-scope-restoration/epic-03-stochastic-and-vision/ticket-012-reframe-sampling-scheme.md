# ticket-012 Reframe sampling-scheme-trait.md and sampling-scheme-testing.md

## Context

### Background

The `sampling-scheme-trait.md` purpose paragraph frames the `SamplingScheme` abstraction as SDDP-specific: "the enum-based trait through which the SDDP forward pass selects scenario realizations." The trait is already designed generically (InSample, External, Historical are general scenario selection strategies), but its framing ties it exclusively to SDDP. Similarly, `sampling-scheme-testing.md` references the SDDP forward pass in its purpose paragraph.

### Relation to Epic

This is the first ticket in Epic 03 (Stochastic Generalization). It reframes the sampling scheme as a general scenario generation abstraction.

### Current State

File `src/specs/architecture/sampling-scheme-trait.md`:

- Purpose paragraph: "the enum-based trait through which the SDDP forward pass selects scenario realizations at each stage"
- Convention blockquote is present and correct (must NOT be modified)
- The trait definition, method contracts, and behavioral invariants are already generic in structure
- SS5 "Forward-Backward Separation Invariant" is SDDP-specific (correctly so)

File `src/specs/architecture/sampling-scheme-testing.md`:

- Purpose paragraph: "conformance test suite for the `SamplingScheme` enum and its three methods"
- References "SDDP forward pass" in test descriptions
- No convention blockquote (correct for testing specs)

## Specification

### Requirements

1. Update `sampling-scheme-trait.md` Purpose paragraph to describe the SamplingScheme as a general scenario generation abstraction, with SDDP forward pass as the primary consumer
2. Preserve the convention blockquote VERBATIM (path `../hpc/backend-testing.md` for architecture files)
3. In `sampling-scheme-trait.md`, keep SS5 "Forward-Backward Separation Invariant" as-is (it is correctly SDDP-specific -- it describes a mathematical invariant of the SDDP algorithm)
4. Update `sampling-scheme-testing.md` Purpose paragraph to use generic framing
5. Do NOT change method names, signatures, or behavioral contracts
6. Do NOT change test names, fixture data, or expected values
7. Preserve all cross-reference links

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/specs/architecture/sampling-scheme-trait.md`, `/home/rogerio/git/cobre-docs/src/specs/architecture/sampling-scheme-testing.md`

### Outputs/Behavior

- Both files have generic-framed purpose paragraphs
- All behavioral content unchanged
- Convention blockquote in trait spec unchanged
- SDDP-specific content within the spec body stays (SS5, validation rules, etc.)

### Error Handling

- SS5 Forward-Backward Separation Invariant is a mathematical SDDP invariant. Do NOT genericize it. The invariant is specific to SDDP and must remain as-is.
- SS6 Validation Rules reference SDDP configuration. These stay as-is.

## Acceptance Criteria

- [ ] Given `sampling-scheme-trait.md`, when the Purpose paragraph is read, then it describes a general "scenario generation abstraction" (or equivalent), noting SDDP forward pass as the primary consumer
- [ ] Given `sampling-scheme-trait.md`, when the convention blockquote is compared to the canonical text, then it is character-for-character identical with `../hpc/backend-testing.md` path
- [ ] Given `sampling-scheme-trait.md` SS5, when read, then it still describes the SDDP Forward-Backward Separation Invariant unchanged
- [ ] Given `sampling-scheme-testing.md`, when the Purpose paragraph is read, then it uses generic framing for the scenario generation concept
- [ ] Given both files, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Method names (already generic)
- Enum variant names (already generic)
- SS5 Forward-Backward Separation Invariant content
- SS6 Validation Rules content
- Test fixture data and expected values

## Implementation Guide

### Suggested Approach

**For `sampling-scheme-trait.md`:**

1. Purpose paragraph rewrite: "This spec defines the `SamplingScheme` abstraction -- the enum-based dispatch through which iterative optimization algorithms select scenario realizations at each stage. In the Cobre ecosystem, the primary consumer is the SDDP forward pass, which uses the sampling scheme to determine the noise source for each stage solve. The sampling scheme is one of three orthogonal concerns governing how scenarios are handled during training..."
2. Keep the rest of the purpose paragraph's technical content about the three variants and configuration source
3. Verify convention blockquote unchanged

**For `sampling-scheme-testing.md`:**

1. Purpose paragraph rewrite: "This spec defines the conformance test suite for the `SamplingScheme` enum and its three methods (`sample_forward`, `requires_noise_inversion`, `backward_tree_source`), as specified in [Sampling Scheme Trait](./sampling-scheme-trait.md). The suite verifies that all three variants produce correct noise vectors..."
2. Keep all test tables, fixture data, and expected values unchanged

### Key Files to Modify

- `src/specs/architecture/sampling-scheme-trait.md` (Purpose paragraph only)
- `src/specs/architecture/sampling-scheme-testing.md` (Purpose paragraph only)

### Patterns to Follow

- "scenario generation abstraction" as the generic concept
- "SDDP forward pass" as the primary consumer
- Keep all SDDP-specific behavioral content in the spec body

### Pitfalls to Avoid

- CRITICAL: Do NOT modify the convention blockquote in `sampling-scheme-trait.md`
- Do NOT genericize SS5 (Forward-Backward Separation Invariant) -- it IS an SDDP invariant
- Do NOT change test names or fixture data in the testing spec
- Verify the convention blockquote path is `../hpc/backend-testing.md` (architecture file)

## Testing Requirements

### Unit Tests

- Purpose paragraph of `sampling-scheme-trait.md` does not start with "SDDP" as the defining context
- Convention blockquote path verification

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
