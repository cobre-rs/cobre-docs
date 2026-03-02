# Master Plan: Parallel Scenario Generation Spec Update

## Executive Summary

This plan adds explicit parallel execution documentation to the scenario generation pipeline specs in the Cobre mdBook documentation project. The algorithm, seed strategy, opening tree structure, and sampling scheme abstraction are already well-specified, but parallelism is only implied (via deterministic seeds and references to MPI distribution). This update brings scenario generation to the same level of parallel execution explicitness as the recent cut selection work distribution update (DEC-016), documenting the communication-free parallelism model, opening tree generation parallelization, forward pass noise generation threading, and parallel generation tests.

## Goals & Non-Goals

**Goals:**

- Add an explicit "Work Distribution for Noise Generation" subsection to `scenario-generation.md` analogous to `cut-selection-trait.md` SS2.2a
- Document opening tree generation parallelization with partitioning formula and multi-node/multi-thread story
- Document forward pass noise generation threading model (per-thread independent generation)
- Add parallel generation tests to `sampling-scheme-testing.md`
- Add a Decision Log entry (DEC-017) for communication-free parallel noise generation with inline markers in all affected files
- Update cross-references between scenario generation specs and HPC specs bidirectionally
- Update the cross-reference index for all affected files in a single batch

**Non-Goals:**

- Modifying the scenario generation algorithm itself (PAR model, noise inversion, sampling scheme logic)
- Adding new sampling methods or variants
- Changing the opening tree memory layout or Rust types
- Modifying cut-selection, solver, or training loop specs beyond cross-reference additions
- Any code implementation

## Architecture Overview

### Current State

The scenario generation pipeline has exceptional algorithmic documentation (SipHash-1-3 seed derivation, opening tree structure with Rust types, correlated noise generation, three sampling scheme variants with full pre/postcondition tables, 23 conformance tests). However, parallel execution is only implied:

- `scenario-generation.md` SS2.2 states "noise generation must produce identical results regardless of MPI rank assignment" and notes that "no MPI broadcast of noise data is required" -- but never documents the work distribution model explicitly
- `shared-memory-aggregation.md` SS1.4 has a 6-step opening tree generation protocol that says "distribute generation work across ranks within the node (each rank generates its assigned portion via contiguous block assignment)" -- but provides no formula for the assignment
- The forward pass threading model (each thread generates noise independently for its assigned scenarios) is implied by deterministic seeds + thread-trajectory affinity but never stated
- No parallel generation tests exist (only single-rank reproducibility tests)

### Target State

After this plan:

1. `scenario-generation.md` gains a new SS2.2b "Work Distribution for Noise Generation" subsection with the same structure as `cut-selection-trait.md` SS2.2a (explicit partitioning formula, within-rank threading model, communication-free rationale)
2. `scenario-generation.md` SS2.3 gains a parallel generation addendum documenting how opening tree generation is parallelized across ranks and threads
3. `sampling-scheme-testing.md` gains a new SS5 "Parallel Generation Tests" with 5+ tests verifying rank-independent generation, thread-independent generation, and opening tree multi-rank equivalence
4. A new DEC-017 entry in the Decision Log documents communication-free parallel noise generation as a cross-cutting decision with inline markers in all affected files
5. Cross-references are bidirectionally updated between scenario generation, sampling scheme, and HPC specs
6. The cross-reference index is updated in a single batch for all modified files

### Key Design Decisions

1. **Communication-free parallelism as an explicit architectural decision (DEC-017)**: The deterministic seed derivation (SipHash-1-3) eliminates the need for MPI communication of noise -- every rank derives identical results independently. This is fundamentally different from cut selection (which needs `allgatherv` for DeactivationSets) and should be documented as an explicit cross-cutting decision, not left implicit.

2. **New subsection rather than restructuring**: Adding SS2.2b after the existing SS2.2a preserves all existing section references. No renumbering of existing sections is needed.

3. **Parallel tests in the existing testing spec**: Adding a new section to `sampling-scheme-testing.md` (SS5) rather than creating a separate testing spec keeps parallel tests co-located with the existing reproducibility tests they complement.

## Technical Approach

### Tech Stack

This is a documentation-only plan. All deliverables are Markdown spec files within the mdBook project.

### Component/Module Breakdown

| Component                              | Files Modified                                                                  | Description                         |
| -------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| Noise generation work distribution     | `scenario-generation.md`                                                        | New SS2.2b subsection               |
| Opening tree parallel generation       | `scenario-generation.md`                                                        | Addendum to SS2.3                   |
| Forward pass threading model           | `scenario-generation.md`                                                        | Addendum to SS5.2                   |
| Parallel generation tests              | `sampling-scheme-testing.md`                                                    | New SS5 section                     |
| Decision Log entry                     | `decision-log.md`                                                               | DEC-017 registry entry              |
| Inline decision markers                | Multiple specs                                                                  | DEC-017 markers in affected files   |
| Cross-references (HPC -> architecture) | `work-distribution.md`, `shared-memory-aggregation.md`, `hybrid-parallelism.md` | Updated Cross-References sections   |
| Cross-references (architecture -> HPC) | `scenario-generation.md`, `sampling-scheme-trait.md`                            | Updated Cross-References sections   |
| Cross-reference index                  | `cross-reference-index.md`                                                      | Batch update for all modified files |

### Data Flow

No data flow changes. This is a documentation update.

### Testing Strategy

Each ticket has mdBook build verification (`mdbook build`) as an acceptance criterion. Cross-reference links are verified by checking that target anchors exist. Decision log consistency is verified by grepping for DEC-017 across affected files.

## Phases & Milestones

| Epic | Name                                  | Scope                                                                              | Tickets |
| ---- | ------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| 1    | Scenario Generation Work Distribution | Core spec updates: SS2.2b, SS2.3 addendum, SS5.2 addendum, DEC-017, inline markers | 4       |
| 2    | Parallel Testing and Cross-References | Parallel tests, cross-reference updates, index batch update                        | 3       |

**Milestone 1** (end of Epic 1): All spec content additions are complete. The scenario generation pipeline is documented at the same level of parallel execution explicitness as cut selection.

**Milestone 2** (end of Epic 2): Parallel tests, bidirectional cross-references, and cross-reference index are complete. Full consistency audit passes.

## Risk Analysis

| Risk                                                                                   | Likelihood | Impact | Mitigation                                                                              |
| -------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| Section renumbering propagation                                                        | Low        | Medium | SS2.2b is inserted as a new subsection after SS2.2a; no existing section numbers change |
| Cross-reference index drift                                                            | Medium     | Low    | Batch update in a single ticket as the final step                                       |
| Inconsistency with existing `shared-memory-aggregation.md` SS1.4 opening tree protocol | Low        | Medium | Ticket 2 explicitly reconciles SS1.4 with the new SS2.3 addendum                        |

## Success Metrics

1. `grep "Work Distribution for Noise Generation" src/specs/architecture/scenario-generation.md` returns one match
2. `grep "DEC-017" src/specs/` returns matches in all affected files listed in the decision log entry
3. `mdbook build` completes without new warnings
4. Parallel generation test count in `sampling-scheme-testing.md` is >= 5
5. All 6 gaps identified in the prior analysis are addressed
