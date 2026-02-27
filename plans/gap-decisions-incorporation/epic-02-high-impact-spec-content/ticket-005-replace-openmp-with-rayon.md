# ticket-005 Replace OpenMP with Rayon for Intra-Rank Parallelism

## Context

### Background

GAP-018 identifies that the threading model for intra-rank parallelism is unspecified in Rust terms. The `hybrid-parallelism.md` spec currently prescribes OpenMP via C FFI as the only threading model. The stakeholder review confirmed: use **rayon** for intra-rank parallelism, with `ThreadPoolBuilder::spawn_handler` for NUMA pinning if needed. OpenMP is deferred unless profiling reveals a gap that rayon cannot fill. The rayon dependency is encapsulated in `cobre-sddp`; no rayon types appear in public APIs.

### Relation to Epic

This is the largest ticket in Epic 02. The `hybrid-parallelism.md` spec is 300 lines and the OpenMP decision permeates sections 1 through 7. The rewrite affects the rationale (section 2), responsibility split (section 3), configuration (section 4), FFI strategy (section 5), initialization sequence (section 6), and build integration (section 7). However, the cross-references section and the overall architecture (communication backend + intra-rank threading) remain structurally the same.

### Current State

`src/specs/hpc/hybrid-parallelism.md` currently:

- **Section 1**: Describes the hybrid architecture with OpenMP as the threading layer
- **Section 2**: "Design Rationale: Why OpenMP (Not Rayon)" -- a comparison table favoring OpenMP
- **Section 3**: MPI vs OpenMP responsibility split
- **Section 4**: Parallel configuration with OpenMP environment variables
- **Section 5**: OpenMP C FFI Strategy (wrapper primitives, callback trampoline pattern)
- **Section 6**: Initialization sequence with OpenMP steps
- **Section 7**: Build integration for OpenMP C wrapper

The decision reverses the core premise of section 2 and eliminates the need for sections 5 and 7 (no C FFI wrapper needed with rayon).

## Specification

### Requirements

1. Rewrite `src/specs/hpc/hybrid-parallelism.md` sections 1-7 to reflect rayon as the intra-rank threading model
2. **Section 1**: Replace "OpenMP via C FFI" with "rayon" in the hybrid architecture overview. Update the architecture table's intra-rank row. Keep the communication backend layer unchanged.
3. **Section 2**: Rewrite as "Design Rationale: Why Rayon (OpenMP Deferred)" -- document the decision with rationale: rayon is pure Rust (no FFI), ecosystem standard, sufficient for the initial implementation. OpenMP deferred to post-profiling if NUMA pinning or vendor-optimized scheduling proves necessary. Include the `ThreadPoolBuilder::spawn_handler` escape hatch for NUMA pinning.
4. **Section 3**: Update the MPI vs threading responsibility split to replace "OpenMP Threads" with "Rayon Threads" in all table headers and descriptions. The logical split (coarse ranks vs fine threads) is unchanged.
5. **Section 4**: Replace OpenMP environment variables with rayon configuration:
   - Thread count via `RAYON_NUM_THREADS` or `ThreadPoolBuilder::num_threads()`
   - NUMA pinning via `ThreadPoolBuilder::spawn_handler` (optional, deferred)
   - LP solver threading suppression unchanged
   - NUMA allocation policy unchanged
6. **Section 5**: Replace the OpenMP C FFI strategy with rayon parallel patterns:
   - `rayon::iter::ParallelIterator` for parallel LP solves
   - No C FFI wrapper needed
   - No callback trampoline pattern needed
7. **Section 6**: Update initialization sequence:
   - Replace Steps 4-5 (OpenMP config + LP solver suppression) with rayon thread pool creation
   - Thread pool created with `ThreadPoolBuilder::new().num_threads(n).build_global()`
   - NUMA allocation policy step unchanged
8. **Section 7**: Simplify build integration -- no OpenMP compiler detection or C wrapper compilation needed. Only the LP solver threading suppression environment variables remain.
9. **Encapsulation**: Add a note that rayon is a `cobre-sddp` dependency only. No rayon types (`ParallelIterator`, `ThreadPool`) appear in public crate APIs. Other crates interact through `&System`, `&TrainingConfig`, etc.

### Out of Scope

- Changing the communication backend architecture (MPI, ferrompi, etc.)
- Modifying the cross-references section at the bottom of the file
- Changing the reference deployment section (section 8) except to replace "OpenMP threads" with "rayon threads"
- Profiling or benchmarking rayon vs OpenMP (that is a future task)
- Adding rayon to any crate other than `cobre-sddp`

### Inputs/Props

The hybrid-parallelism.md file at `/home/rogerio/git/cobre-docs/src/specs/hpc/hybrid-parallelism.md` (300 lines).

### Outputs/Behavior

Updated `hybrid-parallelism.md` with rayon as the intra-rank threading model, sections 1-8 rewritten to reflect the decision.

### Error Handling

Not applicable (spec documentation).

## Acceptance Criteria

- [ ] Given `src/specs/hpc/hybrid-parallelism.md` section 1, when reading the architecture overview table, then the "Intra-rank threading" row shows "Rayon" (not "OpenMP via C FFI")
- [ ] Given section 2, when reading the design rationale, then it explains why rayon was chosen over OpenMP and documents OpenMP as a deferred optimization with the `ThreadPoolBuilder::spawn_handler` escape hatch for NUMA pinning
- [ ] Given section 4, when searching for `OMP_PROC_BIND` or `OMP_PLACES`, then they are absent; rayon configuration (`RAYON_NUM_THREADS` or `ThreadPoolBuilder`) is present instead
- [ ] Given section 5, when searching for "C FFI" or "callback trampoline", then they are absent; rayon parallel patterns (`ParallelIterator`) are documented instead
- [ ] Given the entire file, when searching for "encapsulat", then a note states rayon is a `cobre-sddp` dependency only with no rayon types in public APIs

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/hybrid-parallelism.md` in full (300 lines)
2. Work section by section (1 through 8), replacing OpenMP references with rayon equivalents:
   - Section 1: Change "OpenMP via C FFI" to "Rayon" in the table and text. Keep the communication backend description unchanged.
   - Section 2: Rewrite from scratch as a rayon-vs-OpenMP comparison that favors rayon for the initial implementation with OpenMP as a deferred option
   - Section 3: Find-and-replace "OpenMP" with "Rayon" in the table headers; update descriptions to use rayon terminology
   - Section 4: Replace OpenMP environment variables subsection with rayon configuration. Keep LP solver suppression (4.3) and NUMA allocation (4.4) unchanged.
   - Section 5: Replace entirely with rayon parallel patterns (no C FFI, no wrapper primitives)
   - Section 6: Update initialization steps to use rayon thread pool creation instead of OpenMP runtime initialization
   - Section 7: Simplify -- no C compiler detection or wrapper compilation
   - Section 8: Replace "OpenMP threads" with "rayon threads" in the reference deployment
3. Verify that all cross-references in the Cross-References section still resolve (do not modify the cross-references section itself)
4. This is an HPC spec file -- use `§` prefix for section references to other HPC files, plain numbers for sections within this file

### Key Files to Modify

- `src/specs/hpc/hybrid-parallelism.md` -- rewrite sections 1-8

### Patterns to Follow

- HPC specs use `§` for cross-references to other HPC files (e.g., `[Communicator Trait §1](./communicator-trait.md)`)
- HPC specs use plain numbered sections within the file (`## 1.`, `## 2.`)
- Retain the same section numbering structure (sections 1-8 with subsections) to avoid breaking external cross-references
- The file does NOT have the convention blockquote (it is not a trait spec)

### Pitfalls to Avoid

- Do NOT change the cross-references section at the bottom -- external links to this file reference specific sections
- Do NOT remove the communication backend descriptions (sections 1.2, 1.3) -- those are about MPI/ferrompi, not OpenMP
- Do NOT remove section 6a (alternative initialization for single-process mode) -- update it to use rayon terminology
- Preserve all existing cross-reference links (e.g., `[Training Loop SS4.3]`) even though the content around them changes
- The `§` prefix is correct in this file (HPC directory) -- do NOT replace with `SS`

## Testing Requirements

### Unit Tests

Not applicable (Markdown spec document).

### Integration Tests

- Run `mdbook build` and verify no new errors
- Verify that all cross-reference links within the file still resolve
- Grep for orphaned OpenMP references: `grep -i "openmp\|omp_" src/specs/hpc/hybrid-parallelism.md` should only find them in the "deferred" rationale context, not as active specifications

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
