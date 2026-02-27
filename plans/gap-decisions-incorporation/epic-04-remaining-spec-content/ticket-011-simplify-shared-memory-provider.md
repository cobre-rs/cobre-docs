# ticket-011 Simplify SharedMemoryProvider Bound for Minimal Viable

## Context

### Background

GAP-033 identified an inconsistency: the `train` function signature in `communicator-trait.md` SS3 shows `C: Communicator + SharedMemoryProvider` as the generic bound, but `solver-interface-trait.md` shows `C: Communicator` only. The stakeholder design review decided that for Phase 5 (minimal viable), each MPI rank uses **isolated per-rank memory** -- no MPI shared memory windows. The `SharedMemoryProvider` trait and MPI shared memory optimization for the `System` struct are deferred to a post-profiling optimization pass, gated on memory pressure measurements.

### Relation to Epic

Epic 04 resolves the five remaining gaps. This ticket resolves GAP-033 by clarifying the generic bounds on the training entry point and documenting the deferral of shared memory optimization.

### Current State

- `src/specs/hpc/communicator-trait.md` SS3 shows `pub fn train<C: Communicator>(...)` with only `Communicator` as the bound (lines 285-305). The `SharedMemoryProvider` trait is defined in SS4 of the same file (lines 319-546) but the `train` signature does NOT include it.
- `src/specs/hpc/hybrid-parallelism.md` SS1.3 documents shared memory layout (scenario storage and cut pool regions via `SharedRegion<T>`). SS1.0a documents that single-process mode uses `HeapFallback`.
- `src/specs/hpc/hybrid-parallelism.md` SS6 initialization sequence Step 3 creates an intra-node communicator via `comm.split_local()`.
- The `SharedMemoryProvider` trait (SS4) and its `HeapFallback` semantics (SS4.4) are fully specified.
- The `train` function signature in `communicator-trait.md` SS3 currently uses `C: Communicator` without `SharedMemoryProvider`.

## Specification

### Requirements

1. Add a **design note** to `communicator-trait.md` SS4 (after the trait definition or in a new SS4.5 subsection) documenting:
   - For the minimal viable implementation (Phase 5), the `train()` function uses `C: Communicator` only -- `SharedMemoryProvider` is NOT part of the training entry point generic bound.
   - Each MPI rank uses isolated per-rank memory: the `System` struct and cut pool are replicated in each rank's heap. No MPI shared memory windows are used.
   - The `SharedMemoryProvider` trait and `SharedRegion<T>` remain in the spec as the design for a post-profiling optimization. The optimization will be triggered when memory pressure measurements on production-scale runs (120 stages, 160 hydros, 15,000 cuts/stage) show that per-rank replication exceeds available memory.
   - The three trigger conditions for re-introducing shared memory: (a) per-rank memory exceeds 80% of NUMA domain memory, (b) cut pool replication causes swap/OOM on standard HPC nodes, (c) profiling reveals significant time in data replication during initialization.
2. Add a clarifying note to `hybrid-parallelism.md` SS1.3 ("Shared Memory Layout") stating that the shared memory layout described is the target architecture; the minimal viable implementation uses per-rank heap replication via `HeapFallback`.
3. Update `hybrid-parallelism.md` SS6 initialization sequence Step 3 to note that in the minimal viable implementation, `split_local()` returns a `LocalBackend` equivalent (single-rank communicator) even under the ferrompi backend, because shared memory regions are not used.

### Inputs/Props

- The existing `SharedMemoryProvider` trait definition in `communicator-trait.md` SS4.
- The existing shared memory layout in `hybrid-parallelism.md` SS1.3.
- The `HeapFallback` semantics table in `communicator-trait.md` SS4.4.

### Outputs/Behavior

- `communicator-trait.md` SS4 gains a design note (or SS4.5 subsection) documenting the minimal viable simplification.
- `hybrid-parallelism.md` SS1.3 gains a note clarifying that the shared memory layout is deferred.
- `hybrid-parallelism.md` SS6 Step 3 gains a note about the minimal viable behavior.

### Error Handling

Not applicable (documentation ticket).

### Out of Scope

- Removing the `SharedMemoryProvider` trait definition from `communicator-trait.md` -- it stays as the design for future optimization.
- Modifying the `train()` function signature in SS3 -- it already uses `C: Communicator` without `SharedMemoryProvider`.
- Modifying the `HeapFallback` semantics table in SS4.4 -- it is already correct.
- Changing any files outside the two target files.

## Acceptance Criteria

- [ ] Given `src/specs/hpc/communicator-trait.md`, when searching for "minimal viable" or "Phase 5" in section 4, then a design note appears stating that `SharedMemoryProvider` is not part of the `train()` generic bound in the minimal viable implementation.
- [ ] Given `src/specs/hpc/communicator-trait.md`, when the design note is read, then it lists three trigger conditions for re-introducing shared memory.
- [ ] Given `src/specs/hpc/hybrid-parallelism.md` SS1.3, when the section is read, then it contains a note stating that the shared memory layout is the target architecture and the minimal viable implementation uses per-rank heap replication.
- [ ] Given the modified files, when `mdbook build` is run, then it completes with exit code 0 and no new warnings.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/hpc/communicator-trait.md` SS4 (lines 319-546) to understand the full SharedMemoryProvider trait.
2. After SS4.4 ("Fallback Strategy"), add a new subsection **SS4.5 Minimal Viable Simplification** containing:
   - A paragraph explaining that for the minimal viable implementation, the training entry point (`train<C: Communicator>`) does not require `SharedMemoryProvider`. Each rank uses `HeapFallback` semantics: all shared data (System struct, opening tree, cut pool) is replicated in per-rank heap memory.
   - A table of three trigger conditions for re-introducing shared memory.
   - A note that the `SharedMemoryProvider` trait definition remains in the spec as the architectural target.
3. Read `src/specs/hpc/hybrid-parallelism.md` SS1.3 ("Shared Memory Layout").
4. Add a note after the two-row table in SS1.3:
   > **Minimal viable note.** The shared memory layout above describes the target architecture. In the minimal viable implementation (Phase 5), all data is replicated per rank via `HeapFallback` ([Communicator Trait SS4.5](./communicator-trait.md)). The memory overhead of replication is acceptable at initial scale and will be re-evaluated after profiling.
5. In `hybrid-parallelism.md` SS6 Step 3, add a parenthetical or note:
   > In the minimal viable implementation, Step 3 still calls `split_local()` for API consistency, but no shared memory regions are created in subsequent steps. The `HeapFallback` makes all `SharedRegion` operations local heap allocations.
6. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/hpc/communicator-trait.md` (add SS4.5 subsection)
- `src/specs/hpc/hybrid-parallelism.md` (add notes to SS1.3 and SS6 Step 3)

### Patterns to Follow

- HPC specs use plain numbered headings (`## 4.`, `### 4.5`), not `SS` prefix. The `§` prefix is used only in cross-reference links from other files pointing into HPC files.
- Design notes within HPC specs follow the blockquote pattern: `> **Minimal viable note.**` or `> **Design note (GAP-033).**`
- Cross-references from one HPC file to another HPC file section use `§` prefix in link text: `[Communicator Trait §4.5](./communicator-trait.md)`.

### Pitfalls to Avoid

- Do NOT use `SS4.5` in the heading text itself -- HPC files use `### 4.5`, not `### SS4.5`.
- Do NOT remove or modify the `SharedMemoryProvider` trait definition -- it stays as the target architecture.
- Do NOT modify the `train` signature in SS3 -- it already correctly shows `C: Communicator` without `SharedMemoryProvider`.
- Do NOT change any architecture files (`src/specs/architecture/`) in this ticket.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Run `mdbook build` from the repo root; verify exit code 0.
- Verify that `grep -c 'minimal viable\|Phase 5' src/specs/hpc/communicator-trait.md` returns at least 1 match.
- Verify that `grep -c 'HeapFallback' src/specs/hpc/hybrid-parallelism.md` returns at least 2 matches (existing + new note).

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
