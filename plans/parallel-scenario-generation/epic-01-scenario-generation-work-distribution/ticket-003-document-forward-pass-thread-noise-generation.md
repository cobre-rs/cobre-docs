# ticket-003: Document Forward Pass Per-Thread Noise Generation

## Context

### Background

During the SDDP forward pass, each Rayon worker thread processes complete forward trajectories independently (thread-trajectory affinity, documented in `work-distribution.md` SS1.2 and `hybrid-parallelism.md` SS3). At each stage within a trajectory, the thread generates the noise vector for that `(iteration, scenario_index, stage_id)` tuple using the deterministic seed derivation (SS2.2a in `scenario-generation.md`). This per-thread noise generation calling convention is implied by the combination of thread-trajectory affinity and deterministic seeds, but never stated explicitly. The existing SS5.2 "Two-Level Work Distribution" in `scenario-generation.md` describes scenario solve distribution but not the noise generation calling convention within each thread.

This ticket adds a short addendum to SS5.2 that explicitly documents the per-thread noise generation model: each thread initializes an RNG from the deterministic seed at the beginning of each stage, generates the noise vector, and uses it to fix the stage LP's noise terms -- all without communicating with other threads or ranks.

### Relation to Epic

This is the third content ticket in Epic 01. It documents the forward pass threading model, complementing ticket-001 (rank-level work distribution) and ticket-002 (opening tree parallel generation). Together, these three tickets provide complete parallel execution documentation for the scenario generation pipeline.

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md`

SS5.2 "Two-Level Work Distribution" (lines 526-534) currently states:

- MPI rank level: scenarios assigned to ranks as evenly as possible using contiguous blocks
- Thread level: within each rank, assigned scenarios processed by thread pool using dynamic work-stealing
- Notes that per-scenario processing costs are not uniform (LP convergence iteration counts vary)

The gap: SS5.2 describes the distribution of scenario _solves_ across threads, but does not document the noise generation step that happens within each thread at each stage. Specifically, it does not state:

1. That each thread independently generates noise using the deterministic seed
2. That no thread-to-thread or rank-to-rank communication is needed for noise
3. The exact calling convention: seed derivation -> RNG initialization -> noise vector generation -> correlation transform -> LP noise term fixup

File: `/home/rogerio/git/cobre-docs/src/specs/hpc/hybrid-parallelism.md`

SS5.1 "Core Pattern: Parallel Scenario Solving" (lines 176-193) shows a Rust code snippet for the parallel scenario solving pattern but does not include the noise generation step within the `solve_forward_trajectory` function.

## Specification

### Requirements

Add a new paragraph block to SS5.2 in `scenario-generation.md`, placed after the existing "Thread level" paragraph (after line 533, before the "Deployment strategy" paragraph at line 534). The addition must contain:

1. **Heading**: A bold-text subheading "**Per-thread noise generation calling convention.**" (inline bold, not a new section heading)

2. **Calling convention paragraph** explaining the exact sequence each Rayon worker thread follows when generating noise for a stage within its assigned forward trajectory:

   a. **Seed derivation**: Compute the deterministic seed via `seed(base_seed, iteration, scenario_index, stage_id)` using SipHash-1-3 (SS2.2a). The seed depends only on globally known constants -- no thread-local or rank-local state is needed.

   b. **RNG initialization**: Initialize a `Pcg64` (or equivalent) pseudo-random number generator from the derived 64-bit seed.

   c. **Independent noise sampling**: Generate $N_{\text{entities}}$ independent standard normal samples $z_i \sim \mathcal{N}(0,1)$ from the RNG.

   d. **Correlation transform**: Apply the Cholesky factor $L$ for the active correlation profile at this stage (SS2.1): $\eta = L \cdot z$. The Cholesky factors are pre-computed during initialization and shared read-only across all threads.

   e. **LP noise term fixup**: The resulting correlated noise vector $\eta$ is used to fix the noise terms in the stage LP (via the PAR inflow equation in [PAR(p) Inflow Model SS1](../math/par-inflow-model.md)).

3. **No-communication emphasis paragraph** stating: "Steps (a) through (e) are executed entirely within the thread. No inter-thread synchronization, no rank-to-rank communication, and no shared mutable state is involved. The only shared data accessed is the pre-computed Cholesky factors (read-only) and the PAR model parameters (read-only). This communication-free noise generation is a direct consequence of the deterministic seed derivation architecture (SS2.2, SS2.2a) -- the work distribution model documented in SS2.2b."

4. **InSample variant note** explaining that for the `InSample` sampling scheme, the forward pass does not generate noise at all. Instead, it uses the RNG to sample a random index $j \in \{0, \ldots, N_t - 1\}$ into the pre-generated opening tree (SS2.3). The full 5-step sequence above applies only to `External` and `Historical` variants, which require noise inversion from raw inflow values (SS4.3). For `InSample`, step (c) is replaced by "sample a uniform integer in $[0, N_t)$" and steps (d)-(e) are replaced by "look up the opening tree vector at the sampled index."

### Inputs/Props

- The current content of `scenario-generation.md` SS5.2
- The noise generation infrastructure in SS2.1, SS2.2, SS2.2a
- The PAR inflow model reference in `par-inflow-model.md`

### Outputs/Behavior

New paragraph block inserted into SS5.2 of `scenario-generation.md`. No new section heading is created; this is an inline addition within the existing SS5.2 section. No existing sections are renumbered.

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/scenario-generation.md`, when searching for `Per-thread noise generation calling convention`, then exactly one match is found within the SS5.2 "Two-Level Work Distribution" section
- [ ] Given the new paragraph block, when checking its content, then it contains: (a) a 5-step calling convention (seed derivation, RNG initialization, independent noise sampling, correlation transform, LP noise term fixup), (b) a no-communication emphasis paragraph referencing SS2.2b, and (c) an InSample variant note explaining the simplified path
- [ ] Given the new paragraph block, when checking references, then it contains links to SS2.2a, SS2.2b, SS2.1, SS2.3, SS4.3, and `par-inflow-model.md`
- [ ] Given the modified `scenario-generation.md`, when running `mdbook build` from the repo root, then the build completes without new warnings
- [ ] Given the modified file, when verifying section structure, then no section headings (`##` or `###`) have been added, removed, or renumbered -- only inline content within SS5.2 has been added

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/scenario-generation.md` SS5.2 (lines 526-538) to understand the current content and identify the insertion point
2. Read SS2.1 (lines 107-117), SS2.2 (lines 119-133), and SS2.2a (lines 135-166) for the noise generation infrastructure references
3. Read ticket-001's output (SS2.2b) to reference the work distribution model
4. Insert the new paragraph block after the "Thread level" paragraph and before the "Deployment strategy" paragraph
5. Write the content following the structure specified in Requirements above
6. Run `mdbook build` to verify no new warnings

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- Add paragraph block within SS5.2

### Patterns to Follow

- Use bold-text subheadings (e.g., `**Per-thread noise generation calling convention.**`) for inline subsections within a numbered section, consistent with the existing bold subheadings in the file (e.g., `**Why static, not dynamic dispatch**` in `work-distribution.md`)
- Use lettered list items (a, b, c, d, e) for the calling convention steps, consistent with the step enumeration style in SS1.2
- Reference sections within the same file using `SS` prefix (e.g., "SS2.2a", "SS2.2b")
- Reference external math specs using the full link format: `[PAR(p) Inflow Model SS1](../math/par-inflow-model.md)`

### Pitfalls to Avoid

- Do NOT create a new `###` heading -- this is an inline addition within SS5.2, not a new subsection
- Do NOT duplicate the seed derivation algorithm from SS2.2a -- reference it
- Do NOT modify the existing SS5.2 content before or after the insertion point
- Do NOT modify SS5.1 or SS5.3

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

- Modifying `hybrid-parallelism.md` SS5.1 code snippet (the code is illustrative; adding noise generation to it is out of scope)
- Adding the DEC-017 inline marker (ticket-004)
- Updating the Cross-References section of `scenario-generation.md` (ticket-006)
