# ticket-001 Restore Generic Framing in cobre-core Overview

## Context

### Background

The Cobre ecosystem is a power system analysis and optimization platform, with SDDP as its first vertical. However, the `cobre-core` crate overview describes itself as "the in-memory data model for SDDP studies," which incorrectly narrows the crate's scope. `cobre-core` defines entity registries, topology validation, and resolved runtime structures that are generic power system infrastructure -- buses, transmission lines, hydro plants, thermal plants, etc. These entities are used by SDDP but are equally applicable to power flow, OPF, and other analyses.

### Relation to Epic

This is the first ticket in Epic 01 (Framing Restoration). It establishes the pattern for crate overview prose restoration that subsequent tickets follow.

### Current State

File `src/crates/core.md` line 7: "cobre-core provides the in-memory data model for SDDP studies."
The entire Overview paragraph frames the crate through an SDDP lens: "consumed in two phases ... LP definition construction ... training/simulation loop."

## Specification

### Requirements

1. Rewrite the Overview paragraph of `src/crates/core.md` to describe `cobre-core` as the power system entity model for the Cobre ecosystem
2. Replace "in-memory data model for SDDP studies" with a generic description (e.g., "the power system entity model for the Cobre ecosystem")
3. Replace "downstream code" SDDP-specific framing with generic framing (e.g., "downstream solvers and analysis tools")
4. Replace "training/simulation loop" framing with generic framing (e.g., "iterative solution algorithms")
5. Preserve all Key Concepts bullet points and their cross-reference links unchanged
6. Preserve the Status section unchanged
7. Do NOT change any behavioral contracts or structural patterns

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/crates/core.md`
- Current overview text (lines 7-28)

### Outputs/Behavior

- Updated overview paragraph that describes `cobre-core` generically
- All cross-reference links intact
- Key Concepts section unchanged
- Status section unchanged

### Error Handling

- If any cross-reference link would break, preserve the original link text
- If a phrase is ambiguous between generic and SDDP-specific, prefer the generic form

## Acceptance Criteria

- [ ] Given `src/crates/core.md`, when the Overview paragraph is read, then it describes a "power system entity model" (or equivalent generic phrasing), not an "SDDP" data model
- [ ] Given `src/crates/core.md`, when `grep "SDDP" src/crates/core.md` is run, then zero matches appear in the Overview section (SDDP may still appear in Key Concepts if contextually necessary)
- [ ] Given the updated file, when `mdbook build` is run from the repo root, then the build succeeds with no new warnings
- [ ] Given the updated file, when the Key Concepts section is diffed against the original, then no links or structural content have changed

### Out of Scope

- Key Concepts bullet points (these reference SDDP-specific specs and are contextually correct)
- Status section
- Any file other than `src/crates/core.md`

## Implementation Guide

### Suggested Approach

1. Read the current Overview paragraph (lines 7-28)
2. Rewrite line 7 to: "cobre-core provides the power system entity model for the Cobre ecosystem." or similar
3. Rewrite the second paragraph to frame resolution as a generic concern: entities have cascaded defaults that are pre-resolved during loading so downstream tools never query the cascade at runtime
4. Rewrite the third paragraph to frame the two consumption phases generically: initialization (driving LP or model construction) and iterative execution (where throughput is critical)
5. Verify no Key Concepts bullets were changed
6. Run `mdbook build` to verify

### Key Files to Modify

- `src/crates/core.md` (lines 7-28, Overview section only)

### Patterns to Follow

- Use "power system" or "entity model" language, not "SDDP" language
- Keep the paragraph structure (3 paragraphs: purpose, resolution, consumption phases)
- Preserve technical accuracy about cascaded defaults and canonical ordering

### Pitfalls to Avoid

- Do NOT remove the mention of LP definition construction entirely -- it is a valid use case, just not the only one. Frame it as "optimization model construction" or similar.
- Do NOT change the Key Concepts section
- Do NOT change cross-reference links

## Testing Requirements

### Unit Tests

- `grep -c "SDDP" src/crates/core.md` in the Overview section returns 0

### Integration Tests

- `mdbook build` succeeds from the repo root

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: None (other Epic 01 tickets are independent)

## Effort Estimate

**Points**: 1
**Confidence**: High
