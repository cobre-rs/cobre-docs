# ticket-013 Reframe scenario-generation.md Purpose Paragraph

## Context

### Background

The `scenario-generation.md` spec defines the scenario generation pipeline for the Cobre ecosystem. Its purpose paragraph currently says "the Cobre scenario generation pipeline: PAR model preprocessing, correlated noise generation, the sampling scheme abstraction that governs how scenarios are selected in forward and backward passes, external scenario integration, load scenario generation, and the scenario memory layout optimized for the forward pass hot-path." While the content is legitimately PAR/hydro-specific (it IS the PAR model spec), the framing should position PAR(p) as the first implementation of a general scenario generation framework.

### Relation to Epic

This ticket reframes the purpose paragraph of the main scenario generation architecture spec. It is independent of ticket-012 (which handles the sampling scheme trait).

### Current State

File `src/specs/architecture/scenario-generation.md`:

- Purpose paragraph: "This spec defines the Cobre scenario generation pipeline: PAR model preprocessing, correlated noise generation..."
- The spec body is inherently PAR(p)/hydro-specific and correctly so
- No convention blockquote (this is not a trait spec)

## Specification

### Requirements

1. Update the Purpose paragraph to frame scenario generation as a general capability with PAR(p) as the first implementation
2. Keep all spec body content unchanged -- SS1 through the final section are all correctly PAR(p)/hydro-specific
3. Do NOT add a convention blockquote (this is not a trait spec)
4. Preserve all cross-reference links

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md`

### Outputs/Behavior

- Purpose paragraph describes the scenario generation framework generically, then specifies PAR(p) as the first implementation
- All body content unchanged
- All cross-reference links intact

### Error Handling

- The spec body IS PAR(p)/hydro-specific. Do not attempt to genericize it -- only the purpose paragraph framing changes.

## Acceptance Criteria

- [ ] Given `scenario-generation.md`, when the Purpose paragraph is read, then it mentions that PAR(p) is the "first implementation" or "current implementation" of a general scenario generation capability
- [ ] Given `scenario-generation.md`, when sections SS1 through the final section are diffed against originals, then zero lines have changed
- [ ] Given the file, when `mdbook build` is run, then the build succeeds
- [ ] Given the file, when cross-reference links are checked, then none are broken

### Out of Scope

- SS1-SS7 body content (PAR model preprocessing, noise generation, memory layout -- all correctly domain-specific)
- Mathematical formulas
- Memory layout optimizations

## Implementation Guide

### Suggested Approach

1. Rewrite the Purpose paragraph: "This spec defines the Cobre scenario generation pipeline. The framework supports pluggable stochastic process models for generating scenarios used by iterative optimization algorithms. The current implementation provides PAR(p) autoregressive inflow models for hydrothermal dispatch, including: PAR model preprocessing, correlated noise generation, the sampling scheme abstraction that governs how scenarios are selected in forward and backward passes, external scenario integration, load scenario generation, and the scenario memory layout optimized for the solution hot-path."
2. Keep the "For the mathematical definition..." cross-reference sentence
3. Verify no body content changed

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` (Purpose paragraph only)

### Patterns to Follow

- "scenario generation framework" as the generic concept
- "PAR(p) autoregressive inflow models" as the first implementation
- Keep all PAR(p)-specific content in the body

### Pitfalls to Avoid

- Do NOT add a convention blockquote -- this is not a trait spec
- Do NOT genericize the body content
- Do NOT change cross-reference links

## Testing Requirements

### Unit Tests

- Purpose paragraph mentions "framework" or "general" capability, not just "SDDP scenario generation"

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
