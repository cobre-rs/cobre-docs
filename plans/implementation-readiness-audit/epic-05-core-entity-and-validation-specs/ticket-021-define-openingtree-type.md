# ticket-021 Define OpeningTree Rust Type with Ownership Model

## Context

### Background

GAP-023 in the spec gap inventory identifies that the `OpeningTree` type -- the data structure holding pre-generated noise realizations for the backward pass -- has no Rust struct definition in the spec corpus. The opening tree is referenced in `src/specs/architecture/scenario-generation.md` (conceptually) and in `src/specs/architecture/training-loop.md` (as a parameter to backward pass), but its Rust type, memory layout, and ownership model are unspecified.

The key design question is ownership: the opening tree is generated once before training begins, then shared read-only across all MPI ranks and threads within a rank. The two candidate ownership models are:

- `Arc<OpeningTree>` -- heap-allocated, reference-counted, standard Rust shared ownership
- `SharedRegion<OpeningTree>` -- placed in shared memory via `SharedMemoryProvider`, zero-copy across intra-node ranks

This is condition C-09 from the readiness verdict (report-017). It blocks Phase 5 (cobre-stochastic implementation).

### Relation to Epic

This ticket is independent of the other tickets in Epic 05 (entity structs and validation checks). It requires reading the `SharedMemoryProvider` spec (`src/specs/hpc/communicator-trait.md`) to understand the shared memory API, but does not require Phase 4 coding to be complete.

### Current State

- `src/specs/architecture/scenario-generation.md` describes the opening tree conceptually: pre-generated noise realizations organized by (stage, opening_index), sampled once before training, fixed for the entire training run.
- `src/specs/architecture/training-loop.md` references the opening tree as a parameter to the backward pass.
- `src/specs/hpc/communicator-trait.md` defines the `SharedMemoryProvider` trait and `SharedRegion<T>` type for intra-node shared memory.
- `src/specs/hpc/memory-architecture.md` describes the NUMA-aware memory allocation patterns.
- No Rust struct definition for `OpeningTree` exists anywhere in the spec corpus.

## Specification

### Requirements

1. Define the `OpeningTree` Rust struct in `src/specs/architecture/scenario-generation.md` in a new or expanded section (likely near the section that describes opening tree generation).

2. The struct must capture:
   - Pre-generated noise realizations organized by (stage, opening_index)
   - The total number of openings (configurable)
   - Dimensionality per opening (number of random variables per stage)
   - Access pattern: `fn opening(&self, stage: usize, opening_idx: usize) -> &[f64]` -- returns a slice of noise values for one (stage, opening) pair

3. Define the ownership model with a clear recommendation:
   - Evaluate `Arc<OpeningTree>` vs `SharedRegion<OpeningTree>` based on the Cobre memory architecture
   - Consider: the opening tree can be large (thousands of stages x hundreds of openings x tens of random variables = millions of f64 values)
   - Consider: intra-node shared memory avoids duplicating the tree across MPI ranks on the same node
   - Cross-reference `memory-architecture.md` for the NUMA allocation guidance

4. Specify the memory layout for SIMD-friendly access:
   - Contiguous `f64` storage (flat array, not `Vec<Vec<f64>>`)
   - Stride and indexing scheme: `data[stage * n_openings * dim + opening_idx * dim .. + dim]`

5. Cross-reference `training-loop.md` for how the backward pass consumes the opening tree.

### Inputs/Props

- `src/specs/architecture/scenario-generation.md` -- opening tree description
- `src/specs/architecture/training-loop.md` -- backward pass consumption of opening tree
- `src/specs/hpc/communicator-trait.md` -- `SharedMemoryProvider` trait and `SharedRegion<T>`
- `src/specs/hpc/memory-architecture.md` -- NUMA allocation guidance

### Outputs/Behavior

- Updated `src/specs/architecture/scenario-generation.md` with:
  - `OpeningTree` Rust struct definition with doc comments
  - Ownership model recommendation (`Arc` vs `SharedRegion`) with justification
  - Memory layout specification (flat array, stride formula)
  - Access method signature (`fn opening(&self, stage: usize, opening_idx: usize) -> &[f64]`)
  - Cross-references to `memory-architecture.md` and `training-loop.md`
- Updated `src/specs/overview/spec-gap-inventory.md` to mark GAP-023 as resolved

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `scenario-generation.md` is read, when searching for `pub struct OpeningTree`, then a complete Rust struct definition is found with at least a flat data array, stage count, opening count, and dimension fields
- [ ] Given the `OpeningTree` definition, when checking the access method, then `fn opening(&self, stage: usize, opening_idx: usize) -> &[f64]` is present with stride calculation documented
- [ ] Given the `OpeningTree` definition, when checking the ownership model section, then both `Arc<OpeningTree>` and `SharedRegion<OpeningTree>` are evaluated with a clear recommendation and justification
- [ ] Given the ownership model recommendation, when checking cross-references, then `communicator-trait.md` (SharedMemoryProvider) and `memory-architecture.md` (NUMA) are cited
- [ ] Given `spec-gap-inventory.md` is read, when searching for GAP-023, then the status is "Resolved" with a reference to the updated section

## Implementation Guide

### Suggested Approach

1. Read `scenario-generation.md` to understand the opening tree's role in the algorithm: pre-generated noise for backward pass, fixed for training duration, shared across ranks.
2. Read `communicator-trait.md` to understand `SharedRegion<T>` semantics: allocation, lifetime, thread-safety guarantees.
3. Read `memory-architecture.md` SS3 for NUMA allocation guidance.
4. Read `training-loop.md` to understand how the backward pass indexes into the opening tree.
5. Design the struct: flat `Vec<f64>` (or `Box<[f64]>`) with metadata fields for stride calculation.
6. Write the ownership model analysis: `Arc<OpeningTree>` is simpler but duplicates data per rank on the same node; `SharedRegion<OpeningTree>` avoids duplication but adds complexity (alignment, lifetime management).
7. Make a recommendation -- for a production HPC solver, `SharedRegion` is likely preferred for large opening trees, with `Arc` as a fallback for single-rank or testing scenarios.
8. Add the struct, access method, and ownership analysis to `scenario-generation.md`.
9. Update `spec-gap-inventory.md`.

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- add OpeningTree definition
- `src/specs/overview/spec-gap-inventory.md` -- mark GAP-023 resolved

### Patterns to Follow

- Follow the `System` struct pattern from `internal-structures.md`: code block with doc comment, then field descriptions table.
- Follow the flat-array memory layout pattern used in `solver-workspaces.md` for LP variable storage.
- Use the `SS` prefix convention for cross-references within architecture files; `section` prefix for HPC files.

### Pitfalls to Avoid

- Do NOT prescribe `SharedRegion` as the only option -- the spec should support both ownership models with a recommendation.
- Do NOT use nested `Vec<Vec<f64>>` -- the flat array with stride computation is required for SIMD and cache performance.
- Do NOT conflate the opening tree (fixed, pre-generated noise) with the scenario pipeline (per-iteration sampling in the forward pass).
- Do NOT include the noise generation algorithm in this ticket -- only the data structure and ownership model.

## Testing Requirements

### Unit Tests

Not applicable -- this is a spec authoring task.

### Integration Tests

Verify `mdbook build` completes without errors after the changes.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None (independent of other Epic 05 tickets)
- **Blocks**: None directly (but Epic 08 verification depends on all condition resolutions)

## Effort Estimate

**Points**: 3
**Confidence**: High
