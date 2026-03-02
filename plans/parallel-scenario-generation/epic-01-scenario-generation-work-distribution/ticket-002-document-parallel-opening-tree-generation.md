# ticket-002: Document Parallel Opening Tree Generation

## Context

### Background

The opening tree (`OpeningTree` struct, SS2.3/SS2.3a in `scenario-generation.md`) is generated once before training begins and remains fixed throughout. The existing spec documents the tree structure, memory layout, Rust type, and access methods in exceptional detail. However, the parallelization of tree generation itself is not documented in `scenario-generation.md`. The only documentation of parallel tree generation is a 6-step protocol in `shared-memory-aggregation.md` SS1.4, which says "distribute generation work across ranks within the node (each rank generates its assigned portion via contiguous block assignment)" without specifying what "contiguous block assignment" means (blocks of openings? stages? both?), and without documenting the multi-node story or per-thread generation model.

This ticket adds a parallel generation addendum to SS2.3 in `scenario-generation.md`, providing the explicit partitioning formula, multi-node/multi-thread model, and reconciling with the SS1.4 protocol in `shared-memory-aggregation.md`.

### Relation to Epic

This is the second content ticket in Epic 01. It builds on the work distribution model established in ticket-001 (SS2.2b) and extends it specifically to the one-time opening tree generation phase.

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md`

SS2.3 "Opening Tree" (lines 168-203) documents:

- Tree generation procedure (generate N_t noise vectors per stage, deterministic seed per (opening_index, stage))
- Backward and forward pass usage
- Memory layout (stage-major ordering)
- Offset-based access formula
- Total size computation

File: `/home/rogerio/git/cobre-docs/src/specs/hpc/shared-memory-aggregation.md`

SS1.4 "Shared Data: Opening Tree (Secondary)" (lines 58-76) documents:

- A 6-step generation protocol using `SharedRegion<T>`
- Steps 3-4 say "distribute generation work across ranks within the node" and "each rank writes its portion directly to the shared region at the correct offset"
- No partitioning formula is provided
- No multi-node or multi-thread model is provided

The gap: the partitioning formula is missing, the multi-node story (each node generates independently via deterministic seeds -- no cross-node communication needed) is unstated, and the per-thread generation model within a rank is undocumented.

## Specification

### Requirements

Add a new subsection **SS2.3c "Parallel Opening Tree Generation"** to `scenario-generation.md`, placed immediately after SS2.3b "Sampling Method and Opening Tree Generation" (after the end of SS2.3b, before SS2.4 "Time-Varying Correlation Profiles"). The subsection must contain:

1. **Opening statement** explaining that this subsection documents how opening tree generation is parallelized across MPI ranks and threads. It references the `SharedRegion<T>` protocol in `shared-memory-aggregation.md` SS1.4 and provides the partitioning details that protocol references but does not specify.

2. **Multi-node model paragraph** explaining that because opening tree seeds depend only on `(base_seed, opening_index, stage)` (SS2.2a), every node can generate its opening tree independently without cross-node communication. On multi-node deployments, each node generates the complete tree (or a copy of it) using the same deterministic seeds, producing bit-identical results. The tree is then shared within the node via `SharedRegion<T>` ([Shared Memory Aggregation §1.4](../hpc/shared-memory-aggregation.md)).

3. **Within-node partitioning formula** documenting how opening tree generation work is divided across ranks on the same node. The natural work unit is a single `(opening_index, stage)` pair. The total generation work is $\sum_t N_t$ pairs (one per opening per stage). For uniform branching, this simplifies to $N_{\text{openings}} \times T$ pairs.

   The partitioning distributes openings across ranks (not stages, because the stage dimension is the inner loop for each opening's seed derivation):

   | Parameter                                                | Formula                                                                                                                                               |
   | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Total openings                                           | $N = \max_t(N_t)$ for variable branching; $N_{\text{openings}}$ for uniform                                                                           |
   | Openings per rank                                        | $\lfloor N/R_{\text{node}} \rfloor$ or $\lceil N/R_{\text{node}} \rceil$ (contiguous block per [Work Distribution §3.1](../hpc/work-distribution.md)) |
   | Rank $r$'s first opening                                 | Per [Work Distribution §3.1](../hpc/work-distribution.md)                                                                                             |
   | Rank $r$'s last opening                                  | Per [Work Distribution §3.1](../hpc/work-distribution.md)                                                                                             |
   | Each rank generates all stages for its assigned openings | Stages are the inner loop; openings are the outer loop                                                                                                |

4. **Why openings, not stages, are the distribution axis** paragraph explaining that distributing by opening (rather than by stage) aligns with the stage-major memory layout (SS2.3). Each rank generates a contiguous block of openings across all stages, which maps to a contiguous memory region in the `SharedRegion<T>`. This enables each rank to write its generated data directly to the correct offset without interleaving with other ranks' writes. If stages were the distribution axis, each rank's writes would be scattered across the memory region (one block per stage), increasing the complexity of offset computation and potentially causing cache line conflicts during the parallel write phase.

5. **Within-rank threading paragraph** explaining that within each rank, the assigned openings are distributed across Rayon worker threads. Each thread generates all stages for its assigned openings using the deterministic seed `seed(base_seed, opening_index, stage)`. No thread synchronization is needed during generation because each thread writes to a disjoint portion of the `SharedRegion<T>`.

6. **Reconciliation note** stating that this subsection provides the partitioning details referenced by `shared-memory-aggregation.md` SS1.4 step 3 ("contiguous block assignment"). The 6-step protocol in SS1.4 remains the authoritative reference for the `SharedRegion<T>` allocation and fence sequence; this subsection documents the generation work distribution within that protocol.

7. **Variable branching note** explaining that for variable branching ($N_t$ varies per stage), the partitioning uses $\max_t(N_t)$ as the total opening count. Ranks assigned openings that exceed $N_t$ for a particular stage simply skip that (opening, stage) pair. This produces at most a minor load imbalance (ranks with higher opening indices may skip more pairs) which is negligible for the one-time generation phase.

### Inputs/Props

- The current content of `scenario-generation.md` SS2.3, SS2.3a, SS2.3b
- The `SharedRegion<T>` protocol in `shared-memory-aggregation.md` SS1.4
- The contiguous block formula in `work-distribution.md` SS3.1

### Outputs/Behavior

A new SS2.3c subsection is inserted into `scenario-generation.md` after SS2.3b and before SS2.4. No existing sections are renumbered.

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/scenario-generation.md`, when searching for `### 2.3c Parallel Opening Tree Generation`, then exactly one match is found, and it is located after `### 2.3b Sampling Method and Opening Tree Generation` and before `### 2.4 Time-Varying Correlation Profiles`
- [ ] Given the new SS2.3c subsection, when checking its content, then it contains: (a) a multi-node model paragraph, (b) a within-node partitioning formula table with 5 rows, (c) a rationale paragraph for opening-axis distribution, (d) a within-rank threading paragraph, (e) a reconciliation note referencing `shared-memory-aggregation.md` SS1.4, and (f) a variable branching note
- [ ] Given the new SS2.3c subsection, when checking cross-references within the text, then it contains links to `shared-memory-aggregation.md` SS1.4 and `work-distribution.md` SS3.1
- [ ] Given the modified `scenario-generation.md`, when running `mdbook build` from the repo root, then the build completes without new warnings
- [ ] Given the modified file, when checking that no existing section numbers have changed, then SS2.3, SS2.3a, SS2.3b, SS2.4, and all subsequent sections retain their original heading text and numbering

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/scenario-generation.md` to locate the end of SS2.3b (after the sampling methods summary table, around line 347) and the beginning of SS2.4 (line 349)
2. Read `src/specs/hpc/shared-memory-aggregation.md` SS1.4 (lines 58-76) to understand the existing protocol
3. Read `src/specs/hpc/work-distribution.md` SS3.1 (lines 88-99) for the contiguous block formula reference
4. Insert the new `### 2.3c Parallel Opening Tree Generation` subsection between SS2.3b and SS2.4
5. Write the subsection following the structure specified in Requirements above
6. Run `mdbook build` to verify no new warnings
7. Verify no existing section numbers changed

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- Insert new SS2.3c subsection

### Patterns to Follow

- Use `§` prefix for links to HPC files (e.g., `[Shared Memory Aggregation §1.4](../hpc/shared-memory-aggregation.md)`, `[Work Distribution §3.1](../hpc/work-distribution.md)`)
- Use `SS` prefix for links to architecture spec sections (e.g., `SS2.2a`, `SS2.3`)
- Use pipe tables for the partitioning formula
- Reference the existing contiguous block formula from `work-distribution.md` rather than duplicating it

### Pitfalls to Avoid

- Do NOT renumber any existing sections. SS2.3c slots between SS2.3b and SS2.4
- Do NOT modify the existing SS2.3, SS2.3a, or SS2.3b content
- Do NOT modify `shared-memory-aggregation.md` -- the reconciliation is one-directional (this subsection explains the partitioning; SS1.4 remains the authoritative SharedRegion protocol)
- Do NOT duplicate the full `SharedRegion<T>` allocation protocol from SS1.4 -- reference it instead
- Do NOT use `§` for self-references within `scenario-generation.md` -- use plain section numbers (e.g., "SS2.2a")

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `mdbook build` from repo root and verify no new warnings

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-add-noise-generation-work-distribution.md
- **Blocks**: ticket-004-add-dec-017-decision-log-entry.md

## Effort Estimate

**Points**: 2
**Confidence**: High

## Out of Scope

- Modifying `shared-memory-aggregation.md` SS1.4 (cross-references are updated in ticket-006)
- Adding the DEC-017 inline marker (ticket-004)
- Adding parallel generation tests (ticket-005)
- Updating the Cross-References section of `scenario-generation.md` (ticket-006)
