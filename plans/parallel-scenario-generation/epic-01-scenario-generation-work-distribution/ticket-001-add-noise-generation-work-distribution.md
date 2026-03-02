# ticket-001: Add Work Distribution for Noise Generation Subsection

## Context

### Background

The Cobre scenario generation pipeline has exceptional algorithmic documentation -- deterministic seed derivation (SipHash-1-3), the `OpeningTree` Rust type, correlated noise generation via Cholesky decomposition, and the `SamplingScheme` enum with three forward sampling variants. However, the spec lacks an explicit parallel work distribution model comparable to the one documented for cut selection in `cut-selection-trait.md` SS2.2a. The parallelism is implied by the deterministic seed (any rank can independently derive identical noise) but never documented as an explicit work distribution model with partitioning formulas, threading conventions, and communication requirements (or lack thereof).

The recent DEC-016 update established a pattern for documenting parallel work distribution in architecture specs: an explicit subsection with a partitioning formula table, a within-rank threading model description, a result-gathering mechanism, and a conditional-execution note. This ticket creates the analogous subsection for noise generation.

### Relation to Epic

This is the foundation ticket for Epic 01. It establishes the work distribution model that ticket-002 (opening tree parallelization) and ticket-003 (forward pass threading) will reference and extend.

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md`

The file currently contains:

- SS2.2 "Reproducible Sampling" (lines ~119-133): Describes deterministic seed derivation and its guarantees (cross-rank reproducibility, restart reproducibility, order independence). Ends with an architectural note saying "no MPI broadcast of noise data is required" and "each rank generates only the noise it needs, exactly when it needs it."
- SS2.2a "Seed Derivation Function" (lines ~135-166): Specifies SipHash-1-3 with exact input encoding (20 bytes for forward pass, 16 bytes for opening tree).
- SS5.2 "Two-Level Work Distribution" (lines ~526-534): Describes MPI rank-level deterministic distribution and thread-level dynamic work-stealing for scenario processing, but does not document the noise generation work distribution explicitly. It focuses on scenario solve distribution, not noise generation distribution.

The gap: nowhere in the file is there an explicit subsection documenting:

1. That noise generation is communication-free (no allgatherv, no broadcast)
2. A partitioning formula for how noise generation work is divided across ranks
3. The within-rank threading calling convention for noise generation
4. A comparison table contrasting this with the cut selection model

## Specification

### Requirements

Add a new subsection **SS2.2b "Work Distribution for Noise Generation"** to `scenario-generation.md`, placed immediately after SS2.2a "Seed Derivation Function" (after line 166). The subsection must follow the structural pattern established by `cut-selection-trait.md` SS2.2a, adapted for the communication-free nature of noise generation.

The subsection must contain:

1. **Opening sentence** stating that this subsection documents the parallel calling convention for forward pass noise generation, analogous to the cut selection work distribution in `cut-selection-trait.md` SS2.2a.

2. **"Why no communication is needed" paragraph** explaining that deterministic seed derivation (SS2.2a) eliminates the need for MPI communication of noise data. Every rank independently derives identical noise for any `(iteration, scenario_index, stage_id)` tuple by hashing identical inputs. This is fundamentally different from cut selection, which requires `allgatherv` to gather `DeactivationSet` results because cut selection decisions are distributed across ranks (each rank selects for a subset of stages). Noise generation has no such dependency -- each rank generates only the noise it needs for its assigned scenarios.

3. **Work distribution table** with the same column format as `cut-selection-trait.md` SS2.2a's stage partitioning formula table, but adapted for scenario distribution:

   | Parameter                          | Formula                                                                                                                              |
   | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
   | Total forward scenarios            | $M$ (configured via `forward_passes` in `config.json`)                                                                               |
   | Scenarios per rank                 | $\lfloor M/R \rfloor$ or $\lceil M/R \rceil$ (contiguous block assignment per [Work Distribution §3.1](../hpc/work-distribution.md)) |
   | Rank $r$'s first scenario          | $s_{\text{first}}(r)$ per [Work Distribution §3.1](../hpc/work-distribution.md)                                                      |
   | Rank $r$'s last scenario           | $s_{\text{last}}(r)$ per [Work Distribution §3.1](../hpc/work-distribution.md)                                                       |
   | Inter-rank communication for noise | None -- deterministic seed derivation (SS2.2a)                                                                                       |

4. **Within-rank threading model paragraph** explaining that within each rank, Rayon worker threads generate noise independently for their assigned forward trajectories. Each thread uses the deterministic seed `seed(iteration, scenario_index, stage_id)` to initialize its RNG before generating the noise vector for each (scenario, stage) pair. Because the seed depends on `(iteration, scenario_index, stage_id)` -- not on thread ID, rank, or rank count -- any thread on any rank generates identical noise for the same tuple. No thread synchronization is needed for noise generation.

5. **Comparison table** contrasting noise generation with cut selection work distribution:

   | Aspect                   | Cut Selection (SS2.2a in cut-selection-trait.md) | Noise Generation (this subsection)                      |
   | ------------------------ | ------------------------------------------------ | ------------------------------------------------------- |
   | Work unit                | Stage                                            | (Scenario, Stage) pair                                  |
   | Distribution axis        | Stages across ranks                              | Scenarios across ranks (stages sequential per scenario) |
   | Inter-rank communication | `allgatherv` for DeactivationSets                | None (deterministic seeds)                              |
   | Within-rank threading    | Rayon work-stealing across assigned stages       | Rayon work-stealing across assigned scenarios           |
   | Data dependency          | Requires synchronized cut pool metadata          | Independent -- only needs base seed and PAR parameters  |

6. **Backward pass note** stating that backward pass noise generation also requires no communication. The opening tree is generated once before training and shared via `SharedRegion<T>` within a node ([Shared Memory Aggregation §1.4](../hpc/shared-memory-aggregation.md)). During the backward pass, each thread reads the opening tree noise vectors directly -- no generation occurs at runtime.

### Inputs/Props

- The current content of `scenario-generation.md` (read the file before modifying)
- The structural pattern from `cut-selection-trait.md` SS2.2a (for format consistency)
- The partitioning formula from `work-distribution.md` SS3.1 (for the standard contiguous block formula)

### Outputs/Behavior

A new SS2.2b subsection is inserted into `scenario-generation.md` after the current SS2.2a subsection. No existing sections are renumbered.

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/scenario-generation.md`, when searching for `### 2.2b Work Distribution for Noise Generation`, then exactly one match is found, and it is located after `### 2.2a Seed Derivation Function` and before `### 2.3 Opening Tree`
- [ ] Given the new SS2.2b subsection, when checking its content, then it contains: (a) a paragraph explaining why no MPI communication is needed, (b) a work distribution table with 5 rows (Total forward scenarios, Scenarios per rank, Rank r's first scenario, Rank r's last scenario, Inter-rank communication), (c) a within-rank threading model paragraph, (d) a comparison table with 5 rows contrasting noise generation with cut selection, and (e) a backward pass note
- [ ] Given the new SS2.2b subsection, when checking cross-references within the text, then it contains links to `cut-selection-trait.md` SS2.2a, `work-distribution.md` SS3.1, and `shared-memory-aggregation.md` SS1.4
- [ ] Given the modified `scenario-generation.md`, when running `mdbook build` from the repo root, then the build completes without new warnings (existing unclosed `<span>` warning in `risk-measures.md` is acceptable)
- [ ] Given the modified file, when checking that no existing section numbers have changed, then SS2.2, SS2.2a, SS2.3, SS2.3a, SS2.3b, SS2.4, SS3 through SS7 all retain their original heading text and numbering

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/scenario-generation.md` in its entirety to understand the current section structure
2. Read `src/specs/architecture/cut-selection-trait.md` SS2.2a (lines 191-214) to understand the target structural pattern
3. Read `src/specs/hpc/work-distribution.md` SS3.1 (lines 88-99) for the contiguous block assignment formula
4. Insert the new `### 2.2b Work Distribution for Noise Generation` subsection after SS2.2a (after line 166, before the `### 2.3 Opening Tree` heading)
5. Write the subsection following the structure specified in Requirements above
6. Run `mdbook build` to verify no new warnings
7. Verify no existing section numbers changed by searching for all `### 2.` and `## ` headings

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` -- Insert new SS2.2b subsection

### Patterns to Follow

- Match the structural pattern of `cut-selection-trait.md` SS2.2a: opening explanation, partitioning formula table, within-rank threading paragraph, and a comparison or rationale section
- Use `§` prefix for links to HPC files (e.g., `[Work Distribution §3.1](../hpc/work-distribution.md)`), and `SS` prefix for links to architecture files (e.g., `[Cut Selection Strategy Trait SS2.2a](./cut-selection-trait.md)`)
- Use Markdown pipe tables with consistent column alignment
- Follow the architectural note blockquote style already used in SS2.2

### Pitfalls to Avoid

- Do NOT renumber any existing sections. SS2.2b slots between SS2.2a and SS2.3
- Do NOT use `§` prefix for references to sections within the same file or other architecture files -- use `SS` prefix
- Do NOT use `§` prefix for the section heading itself -- architecture specs use `SS` prefix, but section headings in `scenario-generation.md` use plain numbers (e.g., `### 2.2b`)
- Do NOT modify the existing SS2.2 or SS2.2a content -- only add new content after SS2.2a
- Do NOT add the convention blockquote to this file -- `scenario-generation.md` is not a trait spec

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `mdbook build` from repo root and verify no new warnings

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-002-document-parallel-opening-tree-generation.md, ticket-003-document-forward-pass-thread-noise-generation.md, ticket-004-add-dec-017-decision-log-entry.md

## Effort Estimate

**Points**: 3
**Confidence**: High

## Out of Scope

- Adding the DEC-017 decision log entry (ticket-004)
- Adding inline DEC-017 markers to this or other files (ticket-004)
- Updating the Cross-References section of `scenario-generation.md` (ticket-006)
- Modifying any HPC spec files (ticket-006)
