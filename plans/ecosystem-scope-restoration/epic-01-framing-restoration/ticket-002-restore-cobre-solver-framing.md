# ticket-002 Restore Generic Framing in cobre-solver Overview

## Context

### Background

The `cobre-solver` crate overview describes itself as "the backend-agnostic LP solver interface used by the SDDP training and simulation loops." While the solver interface is indeed used by SDDP, it is designed as a generic LP solver abstraction. The overview also uses SDDP-specific terms like "cut pool integration path" and "Benders cuts" in the Overview paragraph, which should be described more generically. The crate overview should describe `cobre-solver` as a generic LP solver abstraction layer that can serve any LP-based optimization problem.

### Relation to Epic

This ticket updates the second crate overview in Epic 01. It is more complex than ticket-001 because the solver overview has more SDDP-specific terminology (cut pool, Benders cuts, stage templates).

### Current State

File `src/crates/solver.md`:

- Line 7: "used by the SDDP training and simulation loops"
- Line 19: "SDDP algorithm is genuinely solver-agnostic"
- Lines 25-27: "cut pool integration path allows the backward pass to inject new Benders cuts"

## Specification

### Requirements

1. Rewrite the Overview paragraph of `src/crates/solver.md` to describe `cobre-solver` as a generic LP solver abstraction layer
2. Replace "used by the SDDP training and simulation loops" with generic framing (e.g., "used by optimization solvers in the Cobre ecosystem")
3. Replace "SDDP algorithm is genuinely solver-agnostic" with generic framing (e.g., "optimization algorithms are genuinely solver-agnostic")
4. Replace "Benders cuts" and "cut pool integration" language with generic LP row addition terminology (e.g., "dynamic constraint addition")
5. Preserve Key Concepts section content but update the LP layout convention bullet to use generic terminology (since it describes the solver's own concepts, not SDDP concepts)
6. Preserve the Status section unchanged

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/crates/solver.md`

### Outputs/Behavior

- Updated overview paragraph with generic LP solver framing
- Key Concepts bullets updated where they describe solver-owned concepts in SDDP terms
- All cross-reference links intact
- Status section unchanged

### Error Handling

- If a Key Concepts bullet legitimately describes an SDDP-specific usage pattern, keep it but frame it as "used by SDDP for..." rather than implying it IS SDDP-specific

## Acceptance Criteria

- [ ] Given `src/crates/solver.md`, when the Overview paragraph is read, then it describes a "backend-agnostic LP solver interface for optimization problems" (or equivalent), not an "SDDP" solver interface
- [ ] Given the Overview paragraph, when searched for "SDDP", then zero matches appear in the first 3 paragraphs (Overview section)
- [ ] Given the LP layout convention bullet in Key Concepts, when read, then it describes column/row ordering for LP operations generically, mentioning SDDP only as an example use case if at all
- [ ] Given the updated file, when `mdbook build` is run, then the build succeeds with no new warnings
- [ ] Given the updated file, when all cross-reference links are checked, then none are broken

### Out of Scope

- Actual LP layout renaming (that is Epic 02 ticket-006)
- Method name changes (that is Epic 02 ticket-007)
- Mathematical content in referenced specs

## Implementation Guide

### Suggested Approach

1. Read the current Overview (lines 7-27)
2. Rewrite the first paragraph: generic LP solver abstraction, backend-agnostic, unified contract
3. Rewrite the second paragraph: two solver backends as first-class implementations, compile-time selection, same trait contract
4. Rewrite the third paragraph: workspace pattern for thread-local solver instances, pre-allocated buffers, NUMA-aware placement. Replace "cut pool integration path" with "dynamic constraint addition path" and "Benders cuts" with "dynamically added constraints"
5. Update Key Concepts bullets:
   - "LP layout convention" bullet: replace "cut-relevant constraints at the top" with "dual-relevant constraints at the top"; replace "fast dual extraction, and efficient cut injection" with "fast dual extraction, and efficient constraint addition"
   - "Solver trait interface" bullet: replace "add cut rows" with "add constraint rows"
   - "Cut pool integration" bullet: replace "Benders cuts generated during the backward pass" with a generic description of batch row addition, noting SDDP Benders cuts as the primary use case
6. Run `mdbook build`

### Key Files to Modify

- `src/crates/solver.md`

### Patterns to Follow

- Use "LP solver abstraction" and "optimization problems" language
- When an SDDP-specific usage must be mentioned, use "e.g., Benders cuts in SDDP" rather than implying it is the only use case
- Preserve the three-paragraph Overview structure

### Pitfalls to Avoid

- Do NOT remove all SDDP references from Key Concepts -- some bullets (like "Basis warm-starting") legitimately describe SDDP-specific iteration patterns. The Key Concepts section documents how the crate is used, and SDDP is a valid context. The goal is to avoid implying SDDP is the only context.
- Do NOT change cross-reference links
- Do NOT change the StageTemplate or StageIndexer ownership bullet -- these types remain SDDP-specific (owned by `cobre-solver`, constructed by `cobre-sddp`)

## Testing Requirements

### Unit Tests

- `grep -c "SDDP" src/crates/solver.md` in the Overview section (first 3 paragraphs) returns 0

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
