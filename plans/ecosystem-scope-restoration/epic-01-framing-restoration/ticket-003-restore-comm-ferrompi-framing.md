# ticket-003 Restore Generic Framing in cobre-comm and ferrompi Overviews

## Context

### Background

Both `cobre-comm` and `ferrompi` crate overviews describe themselves in SDDP-specific terms. `cobre-comm` says "pluggable communication backend abstraction for Cobre's distributed SDDP execution" and "decouples the SDDP training loop from specific communication technologies." `ferrompi` says "backbone for all process-level parallelism in Cobre" (acceptable) but then frames shared memory in SDDP terms: "In SDDP workloads, this is used for scenario storage and the cut pool." These crates provide generic distributed computing infrastructure applicable to any parallel optimization or analysis workload.

### Relation to Epic

This ticket handles two smaller crate overviews that share a common communication/HPC theme. Grouping them avoids context-switching overhead.

### Current State

File `src/crates/comm.md`:

- Line 8: "for Cobre's distributed SDDP execution"
- Line 12-13: "decouples the SDDP training loop from specific communication technologies"
- Key Concepts bullets reference "SDDP training loop" directly

File `src/crates/ferrompi.md`:

- Line 8: "backbone for all process-level parallelism in Cobre" (OK)
- Lines 15-16: "In SDDP workloads, this is used for scenario storage and the cut pool"
- Lines 21-22: "operations used during SDDP training -- no point-to-point messaging"

## Specification

### Requirements

1. Rewrite `src/crates/comm.md` Overview paragraph to describe `cobre-comm` as a pluggable communication backend for distributed computing in the Cobre ecosystem
2. Replace "SDDP training loop" references with generic "optimization algorithms" or "distributed computation"
3. Rewrite `src/crates/ferrompi.md` Overview paragraph to describe ferrompi as generic MPI bindings for distributed computing
4. Replace SDDP-specific shared memory framing with generic framing (e.g., "large shared data structures")
5. In Key Concepts sections, keep SDDP as a usage example but not the defining description
6. Preserve all cross-reference links, section numbering, and structural content
7. Preserve Status, Public API, Feature Matrix, Migration Path, and Dependency Graph sections unchanged in `comm.md`

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/crates/comm.md`, `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md`

### Outputs/Behavior

- Both files have generic Overview paragraphs
- Key Concepts bullets use generic framing with SDDP as example usage
- All structural content preserved

### Error Handling

- If a Key Concepts bullet describes a pattern that is inherently SDDP-specific (like "three collective operations used per SDDP iteration"), keep the SDDP reference but add context that the same pattern applies to other iterative algorithms

## Acceptance Criteria

- [ ] Given `src/crates/comm.md`, when the Overview paragraph is read, then it describes "distributed computing infrastructure" (or equivalent), not "distributed SDDP execution"
- [ ] Given `src/crates/ferrompi.md`, when the Overview paragraph is read, then shared memory is described generically as "large shared data structures" (or equivalent), not "scenario storage and the cut pool"
- [ ] Given both files, when the section numbering and Public API tables in `comm.md` are diffed against originals, then they are unchanged
- [ ] Given both files, when `mdbook build` is run, then the build succeeds with no new warnings
- [ ] Given both files, when all cross-reference links are checked, then none are broken

### Out of Scope

- Sections 1-5 of `comm.md` (these are structural architecture content, not overview framing)
- Method signatures or type definitions
- The Communicator trait purpose paragraph (that is Epic 02 ticket-011)

## Implementation Guide

### Suggested Approach

**For `src/crates/comm.md`:**

1. Rewrite Overview paragraph (lines 7-15): "cobre-comm provides the pluggable communication backend abstraction for distributed computing in the Cobre ecosystem."
2. Replace "SDDP training loop" with "iterative optimization algorithms" in the Overview
3. In Key Concepts, update the Communicator trait bullet: "through which iterative optimization algorithms perform collective operations" instead of "through which the SDDP training loop performs collective operations"
4. In Communication patterns bullet, note that the three collective operations per iteration pattern is established by SDDP as the first user, but the infrastructure is generic

**For `src/crates/ferrompi.md`:**

1. Rewrite Overview (lines 7-28): Keep "backbone for all process-level parallelism" (already generic)
2. Replace "In SDDP workloads" with "In iterative optimization workloads" or "For distributed optimization"
3. Replace "cut synchronization, bound aggregation, and configuration broadcast during SDDP training" with "data synchronization, result aggregation, and configuration broadcast during distributed computation"
4. Keep "collective operations" and "MPI 4.0 persistent collective support" descriptions unchanged

### Key Files to Modify

- `src/crates/comm.md` (Overview paragraph, Key Concepts bullets only)
- `src/crates/ferrompi.md` (Overview paragraph, Key Concepts bullets only)

### Patterns to Follow

- "distributed computing" and "iterative optimization" language for generic framing
- SDDP as an example: "e.g., in the SDDP training loop" or "used by SDDP for..."
- Preserve all structural sections (numbering, tables, code blocks)

### Pitfalls to Avoid

- Do NOT modify sections 1-5 of `comm.md` -- these are structural architecture content
- Do NOT modify cross-reference links
- Do NOT change the Non-responsibilities list in comm.md section 1

## Testing Requirements

### Unit Tests

- `grep "SDDP" src/crates/comm.md` in Overview paragraph returns 0 matches
- `grep "SDDP" src/crates/ferrompi.md` in Overview paragraph returns 0 matches

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
